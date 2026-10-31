#!/usr/bin/env node
/**
 * audit-mutation-test.mjs — audit-dashboards.mjs 的 mutation 回歸測試（零依賴，Node 22+）
 *
 * 用途：證明 audit 的每條 FAIL 級規則「真的會擋」。對 Dashboard/ 成品建副本、以精確字串取代注入缺陷，
 *   以子行程跑 audit，斷言：
 *     - 每個 mutant → audit exit 1，且輸出有以預期訊號開頭的 ✗ 行（規則 ID 或固定訊息；可再要求命中 key）
 *     - 同一份未變異副本（對照組）→ audit exit 0（證明 FAIL 來自注入，而非環境或既有缺陷）
 *   若 audit 被改壞（規則不再觸發、豁免寫太寬…），對應案例會轉紅。
 *
 * ⚠ 新增或修改 FAIL 級 audit 規則時，必須在下方 CASES 加（或更新）案例，並跑一次本腳本。
 *
 * 用法：
 *   node dev/script/audit-mutation-test.mjs                    # 全部案例＋涉及檔案的對照組
 *   node dev/script/audit-mutation-test.mjs --only CH-01,IX-03  # 只跑指定案例（逗號分隔或重複 --only；對照組只跑涉及的檔）
 *   node dev/script/audit-mutation-test.mjs --jobs 4            # 平行度（預設 3；每個 job 是一個 audit 子行程＝一個 headless 瀏覽器）
 *   node dev/script/audit-mutation-test.mjs --list              # 列出案例後結束
 *   node dev/script/audit-mutation-test.mjs --check-fixtures    # 只驗證注入字串（每個 find 在原檔恰好出現一次），不跑瀏覽器
 *   AUDIT_SCRIPT=/path/to/audit.mjs node dev/script/audit-mutation-test.mjs   # 指向另一份 audit（例：驗證本測試會紅）
 *
 * 設計：
 *   - 子行程而非 import：audit 在 import 時就執行 main() 並 process.exit()，無法當模組用；子行程也讓每個案例拿到
 *     獨立的 exit code，並可用 AUDIT_SCRIPT 換 audit。
 *   - 副本放 os.tmpdir() 下 mkdtemp 的根目錄，每個案例／對照組一個子目錄，檔名保留原名（audit 的 EXEMPTIONS 以檔名匹配；
 *     template 辨識以路徑計算，副本不在 Skill/ 下，故不會被當 template）。跑完（含失敗、Ctrl+C）一律刪除整個根目錄。
 *   - 注入前斷言每個 find 在原檔恰好出現一次（CRLF 檔自動把 \n 換成 \r\n 再找），否則該案例判「fixture 失效」，
 *     不跑也不算通過——避免 mutation 沒套上卻報綠。
 *
 * Exit code：0 = 全部通過；1 = 有案例失敗（mutant 未轉紅／對照組非 0／audit 環境錯誤）；
 *            2 = 無失敗但有 fixture 失效（注入字串在原檔不是恰好一次——成品改過了，需更新案例）。
 */
import { spawn } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..', '..');
const DASH = join(ROOT, 'Dashboard');
const AUDIT = resolve(process.env.AUDIT_SCRIPT || join(HERE, 'audit-dashboards.mjs'));
const RUN_TIMEOUT_MS = 240000;

const F = {
  med: '醫美連鎖_預約回診分析_訓練儀表板教材.html',
  food: '餐飲連鎖_門市營運分析_訓練儀表板教材.html',
  gym: '健身房_會員全週期分析_訓練儀表板教材.html',
  retail: '零售便利商店_商品庫存補貨分析_訓練儀表板教材.html',
  brand: '品牌訊息通道_多通道績效分析_訓練儀表板教材.html',
};

/**
 * 案例表。expect＝✗ 行開頭的訊號（規則 ID 或 audit 的固定訊息前綴）；key（選填）＝該 ✗ 行還必須含的字串（命中位置）。
 * edits＝[find, replace]，find 必須在原檔恰好出現一次。
 */
const CASES = [
  // ── M1：AC-01 空 assertion（Sprint M1 mutant：餐飲／健身房），原函式改名保留、不再被呼叫 ──
  { name: 'AC-01-empty-assert', file: F.food, expect: 'AC-01',
    note: 'assertConsistency 換成只印 ✓ 的空函式（原本改名停用）',
    edits: [['function assertConsistency() {',
      "function assertConsistency() { console.log('✓ All data consistency checks passed'); }\nfunction __mutantDisabledAssert() {"]] },
  { name: 'AC-01-hardcoded-N', file: F.gym, expect: 'AC-01', key: '不採信',
    note: '空函式但印寫死的「(14 checks)」——估算 0 條時回報值不得採信',
    edits: [['function assertConsistency(){',
      "function assertConsistency(){ console.log('✓ All data consistency checks passed (14 checks)'); }\nfunction __mutantDisabledAssert(){"]] },
  // ── M1：逐題紅線 QA-01／02／03 ──
  { name: 'QA-01-no-badge', file: F.med, expect: 'QA-01', key: 'page-p1/Q1',
    note: '刪 P1 Q1 題目列的難度 badge',
    edits: [['<span class="badge l1">L1·I</span><span class="question-text">Q1：2025 年的 48,000 筆預約', '<span class="question-text">Q1：2025 年的 48,000 筆預約']] },
  { name: 'QA-02-no-fia', file: F.med, expect: 'QA-02', key: 'page-p1/Q1',
    note: '刪 P1 Q1 答案的 F:／I: 標註',
    edits: [['<span class="tag-f">F:</span> 從<span class="ev">KPI 卡</span>與', '從<span class="ev">KPI 卡</span>與'],
      ['<span class="tag-i">I:</span> 每 100 筆預約', '每 100 筆預約']] },
  { name: 'QA-03-a-question', file: F.med, expect: 'QA-03', key: 'page-p2/Q2',
    note: '刪 P2 Q2（L1·A）的 trap-block（改 class）',
    edits: [['<div class="trap-block" data-trap-stage="read" data-trap="基線缺失">', '<div class="trap-removed" data-trap-stage="read" data-trap="基線缺失">']] },
  { name: 'QA-03-training', file: F.med, expect: 'QA-03', key: 'page-p4/T1',
    note: '刪訓練題 T1 的 trap-block（改 class）',
    edits: [['<div class="trap-block" data-trap-stage="read" data-trap="錨定效應">', '<div class="trap-removed" data-trap-stage="read" data-trap="錨定效應">']] },
  // ── M2：PH-01 佔位符、PAL ARCHIVE 修正前色 ──
  { name: 'PH-01-todo', file: F.med, expect: 'PH-01', key: '__TODO:x__',
    note: '<body> 後插入 <!-- __TODO:x__ -->',
    edits: [['<body>', '<body><!-- __TODO:x__ -->']] },
  { name: 'PAL-01-brand-prefix', file: F.brand, expect: 'PAL-01', key: 'orange/teal',
    note: 'ARCHIVE #3 修正前 --warn #F59E0B（teal≈orange ΔE 10.8）',
    edits: [['orange: `rgba(253,186,116,', 'orange: `rgba(245,158,11,']] },
  { name: 'PAL-01-retail-prefix', file: F.retail, expect: 'PAL-01', key: 'blue/teal',
    note: 'ARCHIVE #7 修正前 --accent2 #10B981（blue≈teal ΔE 10.2）',
    edits: [['teal:   `rgba(2,132,199,', 'teal:   `rgba(16,185,129,']] },
  { name: 'PAL-01-med-prefix', file: F.med, expect: 'PAL-01', key: 'blue/teal',
    note: 'ARCHIVE #8 修正前 P5 accent #0891B2（ΔE 11.8）',
    edits: [["blue: '3,105,161'", "blue: '8,145,178'"]] },
  { name: 'PAL-02-gym-prefix', file: F.gym, expect: 'PAL-02', key: 'orange/teal',
    note: 'ARCHIVE #4 修正前 --accent2 #22C55E（色盲 ΔE 5.7）',
    edits: [["teal:'13,148,136'", "teal:'34,197,94'"]] },
  // ── M3 3.1：圖表實例 CH ──
  { name: 'CH-01-bar-min', file: F.med, expect: 'CH-01', key: 'cAppts',
    note: 'cAppts bar 值軸 min 0 → 2000',
    edits: [['min: 0, max: axisMax(DATA.appts, 500)', 'min: 2000, max: axisMax(DATA.appts, 500)']] },
  { name: 'CH-02-headroom', file: F.med, expect: 'CH-02', key: 'cDoctors',
    note: 'cDoctors 有外部標籤，值軸 max 改 6500（資料最大 6200 < 1.2×）',
    edits: [['max: axisMax(dc.visits, 1000)', 'max: 6500']] },
  { name: 'CH-03-single-legend', file: F.med, expect: 'CH-03', key: 'cRevCat',
    note: 'cRevCat 單一 dataset 卻開 legend',
    edits: [['pct(v, A.revenue_wan)}）` } },', 'pct(v, A.revenue_wan)}）` }, legend: { display: true } },']] },
  { name: 'CH-04-donut-label-gone', file: F.med, expect: 'CH-04', key: 'cMix',
    note: 'tech-notes #25：donut datalabels 只留樣式、刪 display:true，全域預設 false → 標籤消失',
    edits: [["datalabels: { display: true, anchor: 'end', align: 'end', offset: 6,", "datalabels: { anchor: 'end', align: 'end', offset: 6,"]] },
  { name: 'CH-08-line-interaction', file: F.med, expect: 'CH-08', key: 'cAttend',
    note: "cAttend 折線 interaction.mode 'index' → 'nearest'",
    edits: [["tension: 0.25 }], {\n    interaction: { mode: 'index', intersect: false },", "tension: 0.25 }], {\n    interaction: { mode: 'nearest', intersect: true },"]] },
  { name: 'CH-09-hover-radius', file: F.med, expect: 'CH-09', key: 'cAttend',
    note: 'cAttend pointHoverRadius 10 → 5',
    edits: [['pointRadius: 4, pointHoverRadius: 10, tension: 0.25', 'pointRadius: 4, pointHoverRadius: 5, tension: 0.25']] },
  // ── M3 3.2：真實點擊 IX ──
  { name: 'IX-01-qa-toggle', file: F.med, expect: 'IX-01',
    note: 'toggleQA 不再切換 .answer.show（點題目不展開）',
    edits: [["item.querySelector('.answer').classList.toggle('show', open);", '/* mutant: answer 不切換 */']] },
  { name: 'IX-02-findings-click', file: F.med, expect: 'IX-02', key: 'findings#',
    note: 'findings 標題列不掛 click listener',
    edits: [["s.querySelector('.findings-label')?.addEventListener('click', () => s.classList.toggle('collapsed'));", '/* mutant: findings 無 click */']] },
  { name: 'IX-03-def-panel', file: F.med, expect: 'IX-03', key: '定義側板',
    note: 'toggleDef 不切換側板 .open',
    edits: [["outer.classList.toggle('open');", '/* mutant: 側板不開 */']] },
  { name: 'IX-04-goto-wrong-page', file: F.med, expect: 'IX-04',
    note: 'goToChart 一律切到 p1（靜態目標檢查仍通過，只有真實點擊抓得到）',
    edits: [['function goToChart(page, cardId) {\n  switchPage(page);', "function goToChart(page, cardId) {\n  switchPage('p1');"]] },
  // ── M3 3.3：版面 LY ──
  { name: 'LY-01-overflow', file: F.med, expect: 'LY-01', key: 'page-p2',
    note: 'P2 開頭插入 2400px 寬元素',
    edits: [['<p class="page-intro">預約變多了', '<div style="width:2400px;height:4px"></div><p class="page-intro">預約變多了']] },
  { name: 'LY-02-kpi-truncate', file: F.med, expect: 'LY-02',
    note: '.kpi-value 改 nowrap＋overflow hidden，客單價 KPI 加長文字',
    edits: [['line-height: 1.2; word-break: break-word; }', 'line-height: 1.2; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }'],
      ["aov: A => 'NT$' + fmt(A.aov),", "aov: A => 'NT$' + fmt(A.aov) + '／每位到診顧客平均單次消費金額（含稅）',"]] },
  // ── 非規則 ID 的固定 FAIL 檢查 ──
  { name: 'CHARTJS-missing', file: F.med, expect: 'Chart.js 未載入',
    note: '移除 Chart.js CDN <script>',
    edits: [['<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>', '<!-- mutant: chart.js 移除 -->']] },
  { name: 'DATALABELS-unregistered', file: F.med, expect: 'ChartDataLabels 未 register',
    note: '註解掉 Chart.register(ChartDataLabels)',
    edits: [['Chart.register(ChartDataLabels);', '/* mutant: 未 register */']] },
  { name: 'PAGE-extra-div', file: F.med, expect: '分頁不在同一個容器內',
    note: 'tech-notes #26：page-p3 前多一個 </div>',
    edits: [['<div id="page-p3" class="page">', '</div><div id="page-p3" class="page">']] },
  { name: 'FINDINGS-stray-text', file: F.med, expect: '1 個 findings-section 載入後未坍縮',
    note: 'tech-notes #21：findings 內放裸文字 node（collapsed 收不掉）',
    edits: [['<div class="findings-label">🔍 圖表解讀——先自己讀圖，再打開對照</div><div class="findings-content">1 月（4,720 筆）',
      '<div class="findings-label">🔍 圖表解讀——先自己讀圖，再打開對照</div>裸文字 <div class="findings-content">1 月（4,720 筆）']] },
  { name: 'GOTOCHART-wrong-ref', file: F.med, expect: 'goToChart 目標錯誤', key: 'card-cAovHist',
    note: '錯頁引用：goToChart 宣告 p2，但 card-cAovHist 在 P3',
    edits: [["goToChart('p3','card-cAovHist')", "goToChart('p2','card-cAovHist')"]] },
  { name: 'CANVAS-unrendered', file: F.med, expect: '未渲染的 canvas', key: 'cDoctors',
    note: "cDoctors 的 mk() 呼叫改成 void(...)（canvas 留著、不畫）",
    edits: [["mk('cDoctors', 'bar',", "void ('cDoctors', 'bar',"]] },
  { name: 'UNCAUGHT-error', file: F.med, expect: 'Uncaught',
    note: '<body> 後插入會 throw 的 inline script',
    edits: [['<body>', '<body><script>window.__mutant = null; window.__mutant.boom;</script>']] },
];

// ── CLI ──
function parseArgs(argv) {
  const opt = { only: [], jobs: 3, list: false, checkOnly: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--only') opt.only.push(...String(argv[++i] || '').split(',').map(s => s.trim()).filter(Boolean));
    else if (a.startsWith('--only=')) opt.only.push(...a.slice(7).split(',').map(s => s.trim()).filter(Boolean));
    else if (a === '--jobs') opt.jobs = +argv[++i];
    else if (a.startsWith('--jobs=')) opt.jobs = +a.slice(7);
    else if (a === '--list') opt.list = true;
    else if (a === '--check-fixtures') opt.checkOnly = true;
    else { console.error(`未知參數：${a}`); process.exit(2); }
  }
  if (!Number.isInteger(opt.jobs) || opt.jobs < 1) { console.error('--jobs 需為正整數'); process.exit(2); }
  return opt;
}

const count = (s, sub) => { let n = 0; for (let i = s.indexOf(sub); i >= 0; i = s.indexOf(sub, i + sub.length)) n++; return n; };

/** 套用 edits；回傳 { text } 或 { error }（fixture 失效）。CRLF 檔：find 含 \n 且原樣找不到時改用 \r\n。 */
function applyEdits(src, edits) {
  let text = src;
  for (const [find0, rep0] of edits) {
    let find = find0, rep = rep0, n = count(src, find);
    if (n === 0 && find.includes('\n') && src.includes('\r\n')) {
      find = find0.replace(/\n/g, '\r\n'); rep = rep0.replace(/\n/g, '\r\n'); n = count(src, find);
    }
    if (n !== 1) return { error: `注入字串在原檔出現 ${n} 次（需恰好 1 次）：${JSON.stringify(find0.slice(0, 60))}` };
    if (find === rep) return { error: `find 與 replace 相同（不是 mutation）：${JSON.stringify(find0.slice(0, 60))}` };
    text = text.replace(find, () => rep);
  }
  if (text === src) return { error: '注入後內容與原檔相同' };
  return { text };
}

/**
 * 跑 audit 子行程；回傳 { code, out, ms }。
 * tmp：子行程的 TEMP/TMP/TMPDIR——audit 的瀏覽器 profile（mkdtemp audit-dash-*）在 Windows 常因瀏覽器仍鎖檔而清不掉，
 * 導向本次暫存根目錄底下，由本腳本 finally 一併刪除，不在 os.tmpdir() 留殘留。
 */
function runAudit(file, tmp) {
  const t0 = Date.now();
  mkdirSync(tmp, { recursive: true });
  return new Promise(ok => {
    const env = { ...process.env, TEMP: tmp, TMP: tmp, TMPDIR: tmp };
    const p = spawn(process.execPath, [AUDIT, file], { stdio: ['ignore', 'pipe', 'pipe'], env });
    let out = '';
    p.stdout.on('data', d => { out += d; });
    p.stderr.on('data', d => { out += d; });
    const timer = setTimeout(() => { out += `\n[mutation-test] audit 逾時 ${RUN_TIMEOUT_MS / 1000}s，強制結束`; p.kill(); }, RUN_TIMEOUT_MS);
    p.on('close', code => { clearTimeout(timer); ok({ code: code ?? -1, out, ms: Date.now() - t0 }); });
    p.on('error', e => { clearTimeout(timer); ok({ code: -1, out: out + '\n' + e.message, ms: Date.now() - t0 }); });
  });
}

const failLines = out => out.split(/\r?\n/).map(l => l.trim()).filter(l => l.startsWith('✗ ')).map(l => l.slice(2));

async function pool(tasks, jobs) {
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(jobs, tasks.length) }, async () => {
    while (next < tasks.length) await tasks[next++]();
  }));
}

async function main() {
  const opt = parseArgs(process.argv.slice(2));
  if (opt.list) {
    CASES.forEach(c => console.log(`${c.name.padEnd(26)} ${c.expect.padEnd(16)} ${c.file}\n${' '.repeat(27)}${c.note}`));
    return 0;
  }
  const unknown = opt.only.filter(n => !CASES.some(c => c.name === n));
  if (unknown.length) { console.error(`--only 找不到案例：${unknown.join(', ')}（--list 看清單）`); return 2; }
  const cases = opt.only.length ? CASES.filter(c => opt.only.includes(c.name)) : CASES;
  if (!opt.checkOnly && !existsSync(AUDIT)) { console.error(`找不到 audit：${AUDIT}`); return 2; }

  // 1) fixture 驗證（不需瀏覽器）
  const srcCache = {};
  const src = f => (srcCache[f] ??= readFileSync(join(DASH, f), 'utf8'));
  const prepared = cases.map(c => {
    if (!existsSync(join(DASH, c.file))) return { c, error: `成品不存在：Dashboard/${c.file}` };
    return { c, ...applyEdits(src(c.file), c.edits) };
  });
  const broken = prepared.filter(p => p.error);
  broken.forEach(p => console.log(`[fixture 失效] ${p.c.name} → ${p.c.file}：${p.error}`));
  if (opt.checkOnly) {
    console.log(`fixture：${prepared.length - broken.length}/${prepared.length} 有效`);
    return broken.length ? 2 : 0;
  }

  // 2) 建副本（每案例一個子目錄，保留原檔名）＋對照組
  const t0 = Date.now();
  const tmpRoot = mkdtempSync(join(tmpdir(), 'audit-mut-'));
  // 瀏覽器子行程可能還鎖著 profile 檔：重試；仍失敗就印出路徑（不靜默留殘留）
  const cleanup = () => {
    try { rmSync(tmpRoot, { recursive: true, force: true, maxRetries: 10, retryDelay: 500 }); }
    catch (e) { console.log(`⚠ 暫存目錄未能刪除，請手動清除：${tmpRoot}（${e.code || e.message}）`); }
  };
  const onSig = () => { cleanup(); process.exit(130); };
  process.once('SIGINT', onSig);
  process.once('SIGTERM', onSig);
  console.log(`audit：${AUDIT}`);
  console.log(`案例 ${prepared.length - broken.length}${broken.length ? `（另 ${broken.length} 個 fixture 失效未跑）` : ''}，平行度 ${opt.jobs}\n`);
  const results = [];
  try {
    const tasks = [];
    const files = [...new Set(prepared.filter(p => !p.error).map(p => p.c.file))];
    files.forEach((f, i) => {
      const dir = join(tmpRoot, `control-${i}`);
      mkdirSync(dir);
      copyFileSync(join(DASH, f), join(dir, f));
      tasks.push(async () => {
        const r = await runAudit(join(dir, f), join(dir, 'tmp'));
        const pass = r.code === 0;
        results.push({ kind: 'control', name: '對照組', file: f, pass, r });
        console.log(`${pass ? 'PASS' : 'FAIL'}  對照組 → ${f} → 期望 exit 0 → 實得 exit=${r.code}（${(r.ms / 1000).toFixed(1)}s）`);
        if (!pass) failLines(r.out).slice(0, 6).forEach(l => console.log(`        ✗ ${l}`));
      });
    });
    prepared.filter(p => !p.error).forEach((p, i) => {
      const dir = join(tmpRoot, `case-${i}`);
      mkdirSync(dir);
      writeFileSync(join(dir, p.c.file), p.text);
      tasks.push(async () => {
        const r = await runAudit(join(dir, p.c.file), join(dir, 'tmp'));
        const lines = failLines(r.out);
        const hit = lines.some(l => l.startsWith(p.c.expect) && (!p.c.key || l.includes(p.c.key)));
        const pass = r.code === 1 && hit;
        results.push({ kind: 'case', name: p.c.name, file: p.c.file, pass, r });
        console.log(`${pass ? 'PASS' : 'FAIL'}  ${p.c.name} → ${p.c.file} → 期望 ${p.c.expect}${p.c.key ? `［${p.c.key}］` : ''} → 實得 exit=${r.code} 命中=${hit ? '是' : '否'}（${(r.ms / 1000).toFixed(1)}s）`);
        if (!pass) {
          console.log(`        注入：${p.c.note}`);
          (lines.length ? lines.slice(0, 6).map(l => `✗ ${l}`) : r.out.trim().split(/\r?\n/).slice(-6)).forEach(l => console.log(`        ${l}`));
        }
      });
    });
    await pool(tasks, opt.jobs);
  } finally {
    cleanup();
    process.off('SIGINT', onSig);
    process.off('SIGTERM', onSig);
  }
  const failed = results.filter(r => !r.pass);
  const sec = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(`\n案例 ${results.filter(r => r.kind === 'case' && r.pass).length}/${results.filter(r => r.kind === 'case').length} 轉紅、`
    + `對照組 ${results.filter(r => r.kind === 'control' && r.pass).length}/${results.filter(r => r.kind === 'control').length} exit 0、`
    + `fixture 失效 ${broken.length}（總耗時 ${sec} 秒）`);
  if (failed.length) { console.log('失敗：' + failed.map(r => `${r.name}（${r.file}）`).join('、')); return 1; }
  return broken.length ? 2 : 0;
}

main().then(code => process.exit(code), e => { console.error(e); process.exit(2); });
