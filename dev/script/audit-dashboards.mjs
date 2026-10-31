#!/usr/bin/env node
/**
 * audit-dashboards.mjs — 交付前自動驗收（零依賴，Node 22+ 內建 WebSocket/fetch）
 *
 * 用真瀏覽器（headless Chromium / Edge / Chrome，經 CDP）逐份開啟儀表板，檢查：
 *   [FAIL] assertConsistency() 存在、無 ✗ / console.error / throw
 *   [FAIL] 載入期間無 uncaught exception
 *   [FAIL] ChartDataLabels 已 register
 *   [FAIL] 切過每個分頁後，每個 canvas 都有 Chart 實例且尺寸非 0
 *   [FAIL] AC-01 assertConsistency 有效檢查條數 N=0（成品）；template 則為 [WARN]「未配置」
 *          N 的來源：新格式讀 `✓ All data consistency checks passed (N checks)`（原始碼估算為 0 時一律以 0 計，防寫死的 N）；
 *          舊格式（不印 N，既有 8 份）以去除註解後的 assertConsistency.toString() 估算：
 *          「helper 呼叫次數 ＋ helper 以外的 .push( 次數」，helper＝函式內含 .push( 或 console.error( 的區域函式
 *          template 以「路徑 = <repo>/Skill/template.html」辨識（刻意不用 data-template 標記：
 *          成品從 template 複製時若殘留標記，會把 N=0 從 FAIL 降成 WARN）
 *   [FAIL] 教學紅線元素存在：.qa-item、.trap-block、F/I/A 標註、設計選擇／設計說明區塊
 *   逐題規則（每個 .qa-item；命中輸出 <page id>/<題號>「題目前綴」，題號取 Q#／T#／訓練題#，無題號用 #全域序號）：
 *   [FAIL] QA-01 題目列缺難度標記（.badge.l1–l3 或 .qa-level.l1–l3）
 *   [FAIL] QA-02 答案區（題目列以外）缺 F/I/A 標註（.tag-f/i/a、.fia.f/i/a、.qa-depth，
 *          或改呈現變體 .ans-head.obs/.inf/.act＝觀察／推論／行動）（紅線 #2）
 *   [FAIL] QA-03 A 題或訓練題缺 .trap-block（紅線 #3）
 *          A 題＝題目列含 .qa-depth.a／.tag-a／.fia.a，或難度徽章文字含「·A」
 *          訓練題＝.qa-item.training，或位於 .training-block 內的 .qa-item
 *   [WARN] QA-04 題目缺 .ev 證據碼（E.1 #12）
 *   [WARN] QA-05 題目缺 .chart-ref-btn（E.1 #23）
 *   [WARN] QA-06 L3 題缺 .nav-hint（E.1 #14）
 *   豁免：本檔 EXEMPTIONS 常數表（檔名 × 規則 ID × [題目 key] × 理由）；豁免項照印（⊘）但不計 FAIL／WARN
 *   [WARN] Chart.defaults.plugins.datalabels.display 未設為 false（opt-in 規範）
 *   [WARN] <title> 與檔名不一致
 *   [WARN] trap-block 缺 data-trap-stage／data-trap、涵蓋 <3 階段、同名 >2 次（C.4c）
 *   [WARN] 雙 Y-axis 圖沒有對應「雙軸假相關」trap-block（B.9-2）
 *
 * 用法：
 *   node dev/script/audit-dashboards.mjs                 # 檢查 Dashboard/*.html
 *   node dev/script/audit-dashboards.mjs path/a.html ... # 指定檔案
 *   CHROME_PATH=/path/to/chrome node dev/script/audit-dashboards.mjs
 * Exit code：0 = 全部無 FAIL；1 = 有 FAIL；2 = 環境錯誤（找不到瀏覽器等）
 * 需要網路（CDN：Chart.js / plugins / Google Fonts）。
 */
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir, homedir } from 'node:os';
import { basename, join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SETTLE_MS = 1500;   // load 後等 CDN plugin / DOMContentLoaded handler
const PAGE_WAIT_MS = 400; // switchPage 內 setTimeout(60) + Chart 動畫起跑
const TEMPLATE_PATH = join(ROOT, 'Skill', 'template.html'); // AC-01：此路徑 N=0 → WARN「未配置」，其餘 → FAIL

/** 逐題規則（1.3）。sev 決定未豁免命中算 FAIL 還是 WARN。 */
const QA_RULES = {
  'QA-01': { sev: 'fail', desc: '題目列缺難度標記 .badge/.qa-level l1–l3' },
  'QA-02': { sev: 'fail', desc: '答案區缺 F/I/A 標註（紅線 #2）' },
  'QA-03': { sev: 'fail', desc: 'A 題／訓練題缺 .trap-block（紅線 #3）' },
  'QA-04': { sev: 'warn', desc: '缺 .ev 證據碼（E.1 #12）' },
  'QA-05': { sev: 'warn', desc: '缺 .chart-ref-btn（E.1 #23）' },
  'QA-06': { sev: 'warn', desc: 'L3 題缺 .nav-hint（E.1 #14）' },
};

/**
 * 規則豁免表（1.4）：既有成品命中、但修正需改內容或屬刻意設計者。
 * items 省略 = 該檔該規則全部命中都豁免；給陣列 = 只豁免這些題目 key（<page id>/<題號>），新增的命中仍會報。
 * 豁免項照樣印出（⊘），不計入 FAIL／WARN。
 */
const EXEMPTIONS = [
  // 補 trap-block／F/I/A 都需新增教學文字，屬改內容（Sprint 總原則 2），非機械修正 → 列豁免，留待人工補寫
  { file: 'SaaS訂閱制_MRR訂閱指標分析_訓練儀表板教材.html', rule: 'QA-03',
    items: ['page-mrr/Q6', 'page-churn/Q6', 'page-ltv/Q4', 'page-ltv/Q6', 'page-funnel/Q5', 'page-funnel/訓練題2', 'page-funnel/訓練題3'],
    reason: 'A 題／訓練題原稿無陷阱提示；補寫需新增教學內容，非機械修正' },
  { file: '零售便利商店_商品庫存補貨分析_訓練儀表板教材.html', rule: 'QA-03',
    items: ['page-p4/#17', 'page-p4/#18', 'page-p4/#19', 'page-p4/#20'],
    reason: '「L3 決策應用訓練」4 題原稿無陷阱提示；補寫需新增教學內容（題目無題號，key 為全域序號）' },
  { file: '電商DTC_會員交易分析_訓練儀表板教材.html', rule: 'QA-02', items: ['page-cross/T4'],
    reason: '開放式「還缺哪些分析視角」盤點題，答案為清單而非資料推論，無 F/I/A 可標' },
  { file: '電商DTC_會員交易分析_訓練儀表板教材.html', rule: 'QA-03', items: ['page-cross/T4'],
    reason: '同上；開放式盤點題無對應陷阱，補寫需新增教學內容' },
];

function findBrowser() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const candidates = [
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser',
  ];
  const pw = join(homedir(), 'AppData/Local/ms-playwright');
  if (existsSync(pw)) {
    for (const d of readdirSync(pw).filter(n => /^chromium-\d+$/.test(n)).sort().reverse()) {
      candidates.push(join(pw, d, 'chrome-win64/chrome.exe'), join(pw, d, 'chrome-win/chrome.exe'));
    }
  }
  return candidates.find(existsSync);
}

function listTargets(args) {
  if (args.length) return args.map(a => resolve(a));
  const dir = join(ROOT, 'Dashboard');
  return readdirSync(dir).filter(f => f.endsWith('.html')).sort().map(f => join(dir, f));
}

/** 每個檔案掛在 /<i>/<檔名>，只提供 HTML 本體（其餘資源皆 CDN）。 */
function startServer(files) {
  const server = createServer((req, res) => {
    const m = decodeURIComponent(req.url).match(/^\/(\d+)\//);
    const file = m && files[+m[1]];
    if (!file) { res.writeHead(404).end(); return; }
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }).end(readFileSync(file));
  });
  return new Promise(ok => server.listen(0, '127.0.0.1', () => ok(server)));
}

function launchBrowser(exe) {
  const profile = mkdtempSync(join(tmpdir(), 'audit-dash-'));
  const proc = spawn(exe, [
    '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
    '--remote-debugging-port=0', `--user-data-dir=${profile}`, '--window-size=1440,900', 'about:blank',
  ], { stdio: ['ignore', 'ignore', 'pipe'] });
  return new Promise((ok, fail) => {
    let buf = '';
    const t = setTimeout(() => fail(new Error('browser did not expose DevTools in 20s')), 20000);
    proc.stderr.on('data', d => {
      buf += d;
      const m = buf.match(/DevTools listening on (ws:\/\/\S+)/);
      if (m) { clearTimeout(t); ok({ proc, wsUrl: m[1], profile }); }
    });
    proc.on('exit', c => fail(new Error(`browser exited early (code ${c})`)));
  });
}

/** 最小 CDP client：flatten session，事件依 sessionId 分派。 */
function connect(wsUrl) {
  const ws = new WebSocket(wsUrl);
  let id = 0;
  const pending = new Map();
  const listeners = new Set();
  ws.onmessage = ev => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      const { ok, fail } = pending.get(msg.id);
      pending.delete(msg.id);
      msg.error ? fail(new Error(msg.error.message)) : ok(msg.result);
    } else if (msg.method) listeners.forEach(fn => fn(msg));
  };
  const send = (method, params = {}, sessionId) => new Promise((ok, fail) => {
    pending.set(++id, { ok, fail });
    ws.send(JSON.stringify({ id, method, params, sessionId }));
  });
  return new Promise(ok => { ws.onopen = () => ok({ ws, send, on: fn => listeners.add(fn), off: fn => listeners.delete(fn) }); });
}

// 在頁面內執行的檢查（序列化後送進瀏覽器）
const PAGE_AUDIT = async (pageWait) => {
  const out = { fail: [], warn: [], info: {}, qaHits: {} };
  const logs = [];
  /** 舊格式估算斷言數：去註解（保留字串內容）→ 移除 helper 定義本體 → helper 呼叫數 ＋ 剩餘 .push( 數。 */
  function estimateAssertions(src) {
    let s = '', q = null;
    for (let i = 0; i < src.length;) {
      const ch = src[i], nx = src[i + 1];
      if (q) { s += ch; if (ch === '\\') { s += nx || ''; i += 2; continue; } if (ch === q) q = null; i++; continue; }
      if (ch === '"' || ch === "'" || ch === '`') { q = ch; s += ch; i++; continue; }
      if (ch === '/' && nx === '/') { while (i < src.length && src[i] !== '\n') i++; continue; }
      if (ch === '/' && nx === '*') { const e = src.indexOf('*/', i + 2); i = e < 0 ? src.length : e + 2; continue; }
      s += ch; i++;
    }
    const body = s.slice(s.indexOf('{') + 1);   // 去掉外層 function assertConsistency() {
    const defRe = /function\s+([A-Za-z_$][\w$]*)\s*\([^)]*\)\s*\{|(?:const|let|var|,)\s*([A-Za-z_$][\w$]*)\s*=\s*(?:function\s*)?\([^)]*\)\s*(?:=>\s*)?\{/g;
    const helpers = [], cuts = [];
    for (let m; (m = defRe.exec(body));) {
      let depth = 0, j = m.index + m[0].length - 1;
      for (; j < body.length; j++) { if (body[j] === '{') depth++; else if (body[j] === '}' && --depth === 0) break; }
      const fnBody = body.slice(m.index, j + 1);
      if (/\.push\(|console\.error\(/.test(fnBody)) { helpers.push(m[1] || m[2]); cuts.push([m.index, j + 1]); }
    }
    let rest = body;
    for (const [a, b] of cuts.reverse()) rest = rest.slice(0, a) + rest.slice(b);
    let n = (rest.match(/\.push\(/g) || []).length;
    for (const h of helpers) n += (rest.match(new RegExp(`(?<![\\w$.])${h.replace(/\$/g, '\\$')}\\s*\\(`, 'g')) || []).length;
    return n;
  }
  if (typeof assertConsistency !== 'function') out.fail.push('assertConsistency() 不存在');
  else {
    const o = { log: console.log, warn: console.warn, error: console.error };
    console.log = (...a) => logs.push(['log', a.join(' ')]);
    console.warn = (...a) => logs.push(['warn', a.join(' ')]);
    console.error = (...a) => logs.push(['error', a.join(' ')]);
    try { assertConsistency(); } catch (e) { out.fail.push('assertConsistency() throw: ' + e.message); }
    finally { Object.assign(console, o); }
    const bad = logs.filter(([lv, t]) => lv === 'error' || /✗|FAIL/.test(t)).map(([, t]) => t);
    if (bad.length) out.fail.push('assertConsistency 失敗：' + bad.slice(0, 5).join(' | '));
    out.info.assertLines = logs.length;
    // AC-01 有效檢查條數：新格式讀 (N checks)；舊格式由原始碼估算。
    // 原始碼估算一律執行：估算為 0 時以 0 計，即使印出的 N>0（防寫死字串，例：健身房印 '(14 checks)' 字面值）
    const reported = logs.map(([, t]) => t.match(/✓ All data consistency checks passed \((\d+) checks?\)/)).find(Boolean);
    const est = estimateAssertions(assertConsistency.toString());
    if (!reported) Object.assign(out.info, { assertN: est, assertMode: '估算' });
    else if (est === 0 && +reported[1] > 0) Object.assign(out.info, { assertN: 0, assertMode: `估算；回報值 ${reported[1]} 不採信` });
    else Object.assign(out.info, { assertN: +reported[1], assertMode: '回報' });
  }
  if (!window.Chart) { out.fail.push('Chart.js 未載入'); return out; }
  if (!Chart.registry.plugins.get('datalabels')) out.fail.push('ChartDataLabels 未 register（tech-notes 14-A）');
  if (Chart.defaults.plugins.datalabels && Chart.defaults.plugins.datalabels.display !== false)
    out.warn.push('datalabels 預設未設 display=false（SKILL Layer 1 樣板）');

  const pages = [...new Set([...document.querySelectorAll('[onclick*="switchPage"]')]
    .map(t => (t.getAttribute('onclick').match(/switchPage\(\s*['"]([^'"]+)['"]/) || [])[1]).filter(Boolean))];
  if (!pages.length) out.fail.push('找不到任何 switchPage 分頁');
  // 版面結構：所有分頁必須是同一個容器的子元素（多一個 </div> 會讓後面的分頁跑到外層，圖照畫但版面錯位）
  const pageEls = [...document.querySelectorAll('.page')];
  const parents = new Set(pageEls.map(el => el.parentElement));
  if (parents.size > 1) out.fail.push('分頁不在同一個容器內（疑似多餘的 </div>）：' + pageEls.map(el => `#${el.id}→${el.parentElement.id || el.parentElement.tagName.toLowerCase()}`).join(', '));
  if (document.documentElement.scrollWidth > window.innerWidth + 1) out.fail.push(`頁面橫向溢出：內容寬 ${document.documentElement.scrollWidth}px > 視窗 ${window.innerWidth}px`);
  for (const p of pages) {
    try { switchPage(p); } catch (e) { out.fail.push(`switchPage('${p}') throw: ${e.message}`); }
    await new Promise(r => setTimeout(r, pageWait));
  }
  const cvs = [...document.querySelectorAll('canvas')];
  const noChart = cvs.filter(c => !Chart.getChart(c)).map(c => c.id || '(no id)');
  const zero = cvs.filter(c => Chart.getChart(c) && (c.width === 0 || c.height === 0)).map(c => c.id || '(no id)');
  if (!cvs.length) out.fail.push('沒有任何 canvas');
  if (noChart.length) out.fail.push('未渲染的 canvas：' + noChart.join(', '));
  if (zero.length) out.fail.push('尺寸為 0 的圖表：' + zero.join(', '));

  const count = sel => document.querySelectorAll(sel).length;
  const qa = count('.qa-item'), trap = count('.trap-block');
  const fia = count('.tag-f, .tag-i, .tag-a, .fia.f, .fia.i, .fia.a');
  const designPanel = /設計選擇|設計說明|📐/.test(document.body.innerText);
  if (!qa) out.fail.push('缺 .qa-item');
  if (!trap) out.fail.push('缺 .trap-block（紅線 #3）');
  if (!fia) out.fail.push('缺 F/I/A 標註（紅線 #2）');
  if (!designPanel) out.fail.push('缺「設計選擇／設計說明」區塊（紅線 #4）');
  // goToChart(page, cardId) 目標必須存在，且位於該 page 的容器內（避免跳錯頁／死連結）
  const badRefs = [];
  for (const el of document.querySelectorAll('[onclick*="goToChart"]')) {
    const m = el.getAttribute('onclick').match(/goToChart\(\s*['"]([^'"]+)['"]\s*,\s*['"]([^'"]+)['"]/);
    if (!m) { badRefs.push('無法解析：' + el.getAttribute('onclick')); continue; }
    const [, pg, id] = m, card = document.getElementById(id);
    const pageEl = card && card.closest('.page');
    const tabFor = pageEl && [...document.querySelectorAll('[onclick*="switchPage"]')]
      .some(t => new RegExp(`switchPage\\(\\s*['"]${pg}['"]`).test(t.getAttribute('onclick')));
    if (!card) badRefs.push(`${pg}/${id}：card 不存在`);
    else if (!pageEl || !tabFor || !(pageEl.id === pg || pageEl.id.endsWith('-' + pg) || pageEl.id === 'page-' + pg || pageEl.id === 'p-' + pg))
      badRefs.push(`${pg}/${id}：card 位於 #${pageEl ? pageEl.id : '?'}，與 page 參數不符`);
  }
  if (badRefs.length) out.fail.push('goToChart 目標錯誤：' + [...new Set(badRefs)].slice(0, 6).join(' | '));
  // B.5／E.1 #33：findings 載入後必須預設坍縮（檢查「看得到的內容」，不只看 class）
  const openFindings = [...document.querySelectorAll('.findings-section')].filter(sec => {
    // 第一個子元素是標題列（.findings-label 或 .findings-toggle-btn 等各份寫法），其餘才是內容
    // 用 computed display 判斷（隱藏分頁裡的區塊也能檢查）；裸 text node 收合不了（tech-notes #21）一律算未坍縮
    const visible = [...sec.children].slice(1).filter(ch => getComputedStyle(ch).display !== 'none' && ch.textContent.trim());
    const strayText = [...sec.childNodes].some(n => n.nodeType === 3 && n.textContent.trim());
    return visible.length || strayText;
  });
  if (openFindings.length) out.fail.push(`${openFindings.length} 個 findings-section 載入後未坍縮（E.1 #33）`);
  // C.4c 陷阱分類：每個 trap-block 要有合法 stage＋名稱，整份涵蓋 ≥3 階段，同名 ≤2 次
  const STAGES = ['curate', 'wrangle', 'visualize', 'read'];
  const traps = [...document.querySelectorAll('.trap-block')];
  const untagged = traps.filter(t => !STAGES.includes(t.dataset.trapStage) || !t.dataset.trap);
  if (untagged.length) out.warn.push(`${untagged.length}/${traps.length} 個 trap-block 缺 data-trap-stage／data-trap（C.4c）`);
  const stagesHit = new Set(traps.map(t => t.dataset.trapStage).filter(s => STAGES.includes(s)));
  if (traps.length && stagesHit.size < 3) out.warn.push(`陷阱只涵蓋 ${stagesHit.size} 個階段（${[...stagesHit].join('/') || '無'}），需 ≥3（C.4c）`);
  const nameCount = {};
  traps.forEach(t => { if (t.dataset.trap) nameCount[t.dataset.trap] = (nameCount[t.dataset.trap] || 0) + 1; });
  const dup = Object.entries(nameCount).filter(([, n]) => n > 2).map(([k, n]) => `${k}×${n}`);
  if (dup.length) out.warn.push('同名陷阱超過 2 次：' + dup.join('、'));
  // B.9-2 雙 Y-axis 只允許當教學陷阱
  const dualAxis = cvs.filter(cv => { const ch = Chart.getChart(cv); return ch && Object.values(ch.scales).filter(s => s.axis === 'y').length >= 2; }).map(cv => cv.id);
  if (dualAxis.length && !nameCount['雙軸假相關']) out.warn.push(`雙 Y-axis 圖 ${dualAxis.join(', ')} 沒有對應的「雙軸假相關」trap-block（B.9-2）`);
  Object.assign(out.info, { stages: stagesHit.size, dualAxis: dualAxis.length });
  // 1.3 逐題紅線：每個 .qa-item 各自檢查，命中記錄題目 key（<page id>/<題號>）與題目前綴
  const hit = (rule, key, label) => (out.qaHits[rule] = out.qaHits[rule] || []).push({ key, label });
  const NUM_RE = /^(Q\s*\d+|T\s*\d+|訓練題\s*\d+)[\s.:：｜|、—-]*/;
  let typed = 0;
  [...document.querySelectorAll('.qa-item')].forEach((item, idx) => {
    const head = item.querySelector('.question, .qa-question') || item.firstElementChild;
    const rest = [...item.children].filter(ch => ch !== head);           // 答案區＝題目列以外
    const inRest = sel => rest.some(ch => ch.matches(sel) || ch.querySelector(sel));
    const has = sel => !!item.querySelector(sel);
    const clone = head ? head.cloneNode(true) : document.createElement('div');
    clone.querySelectorAll('.badge, .qa-level, .qa-depth, .tag-f, .tag-i, .tag-a, .fia, .question-arrow, .qa-chevron').forEach(n => n.remove());
    const text = clone.textContent.replace(/\s+/g, ' ').trim();
    const num = (text.match(NUM_RE) || [])[1];
    const key = `${(item.closest('.page') || {}).id || '?'}/${num ? num.replace(/\s+/g, '') : '#' + (idx + 1)}`;
    const label = `${key}「${text.replace(NUM_RE, '').slice(0, 16)}…」`;
    const lvEl = head && head.querySelector('.badge.l1, .badge.l2, .badge.l3, .qa-level.l1, .qa-level.l2, .qa-level.l3');
    const level = lvEl ? ['l1', 'l2', 'l3'].find(l => lvEl.classList.contains(l)) : null;
    let type = null;
    if (head) {
      for (const t of ['a', 'i', 'f']) if (head.querySelector(`.qa-depth.${t}, .tag-${t}, .fia.${t}`)) { type = t; break; }
      if (!type && lvEl) type = ((lvEl.textContent.match(/[·・]\s*([FIA])/) || [])[1] || '').toLowerCase() || null;
    }
    if (type) typed++;
    const training = item.classList.contains('training') || !!item.closest('.training-block');
    if (!level) hit('QA-01', key, label);
    if (!inRest('.tag-f, .tag-i, .tag-a, .fia.f, .fia.i, .fia.a, .qa-depth, .ans-head.obs, .ans-head.inf, .ans-head.act')) hit('QA-02', key, label);
    if ((type === 'a' || training) && !has('.trap-block')) hit('QA-03', key, label + (training ? '［訓練題］' : '［A 題］'));
    if (!has('.ev')) hit('QA-04', key, label);
    if (!has('.chart-ref-btn')) hit('QA-05', key, label);
    if (level === 'l3' && !has('.nav-hint')) hit('QA-06', key, label);
  });
  Object.assign(out.info, { pages: pages.length, charts: cvs.length - noChart.length, canvas: cvs.length, qa, trap, fia, typed, title: document.title });
  return out;
};

/** AC-01 檢查條數判讀 ＋ QA-xx 逐題命中套豁免表，結果寫回 res.fail / res.warn / res.exempt。 */
function applyRules(res, file) {
  const name = basename(file);
  const isTemplate = resolve(file) === TEMPLATE_PATH;
  res.exempt = [];
  const { assertN, assertMode } = res.info;
  if (assertN === 0) {
    if (isTemplate) res.warn.push(`AC-01 assertConsistency 未配置（有效檢查 0 條，${assertMode}）——template 填入 DATA 後需補 check()`);
    else res.fail.push(`AC-01 assertConsistency 有效檢查 0 條（${assertMode}）——「全部通過」不具意義`);
  }
  for (const [rule, hits] of Object.entries(res.qaHits || {})) {
    const { sev, desc } = QA_RULES[rule];
    const live = [];
    for (const h of hits) {
      const ex = EXEMPTIONS.find(e => e.file === name && e.rule === rule && (!e.items || e.items.includes(h.key)));
      if (ex) res.exempt.push(`${rule} ${h.label}：${ex.reason}`);
      else live.push(h.label);
    }
    if (!live.length) continue;
    const shown = live.slice(0, 8).join('、') + (live.length > 8 ? ` …等 ${live.length} 題` : '');
    (sev === 'fail' ? res.fail : res.warn).push(`${rule} ${desc}（${live.length} 題）：${shown}`);
  }
}

async function auditOne(cdp, url, file) {
  const { targetId } = await cdp.send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await cdp.send('Target.attachToTarget', { targetId, flatten: true });
  const errors = [];
  let loaded;
  const loadP = new Promise(r => (loaded = r));
  const onEvt = msg => {
    if (msg.sessionId !== sessionId) return;
    if (msg.method === 'Runtime.exceptionThrown') {
      const d = msg.params.exceptionDetails;
      errors.push((d.exception && d.exception.description || d.text).split('\n')[0]);
    } else if (msg.method === 'Page.loadEventFired') loaded();
  };
  cdp.on(onEvt);
  try {
    await cdp.send('Runtime.enable', {}, sessionId);
    await cdp.send('Page.enable', {}, sessionId);
    await cdp.send('Page.navigate', { url }, sessionId);
    await Promise.race([loadP, new Promise((_, f) => setTimeout(() => f(new Error('load timeout 30s')), 30000))]);
    await new Promise(r => setTimeout(r, SETTLE_MS));
    const r = await cdp.send('Runtime.evaluate', {
      expression: `(${PAGE_AUDIT.toString()})(${PAGE_WAIT_MS})`, awaitPromise: true, returnByValue: true,
    }, sessionId);
    if (r.exceptionDetails) throw new Error('audit script error: ' + r.exceptionDetails.text);
    const res = r.result.value;
    if (errors.length) res.fail.unshift('Uncaught：' + [...new Set(errors)].slice(0, 3).join(' | '));
    const stem = basename(file, '.html').replace(/訓練儀表板教材$/, '');
    if (!res.info.title.replace(/\s+/g, '_').includes(stem.replace(/_$/, '')))
      res.warn.push(`<title>「${res.info.title}」與檔名不一致`);
    applyRules(res, file);
    return res;
  } finally {
    cdp.off(onEvt);
    await cdp.send('Target.closeTarget', { targetId }).catch(() => {});
  }
}

async function main() {
  const files = listTargets(process.argv.slice(2));
  const exe = findBrowser();
  if (!exe) { console.error('找不到 Chromium/Chrome/Edge，請設定 CHROME_PATH'); process.exit(2); }
  const server = await startServer(files);
  const { port } = server.address();
  const { proc, wsUrl, profile } = await launchBrowser(exe);
  const cdp = await connect(wsUrl);
  let failed = 0;
  try {
    for (const [i, file] of files.entries()) {
      const name = basename(file);
      let res;
      try { res = await auditOne(cdp, `http://127.0.0.1:${port}/${i}/${encodeURIComponent(name)}`, file); }
      catch (e) { res = { fail: [e.message], warn: [], info: {} }; }
      const status = res.fail.length ? 'FAIL' : res.warn.length ? 'WARN' : 'PASS';
      if (res.fail.length) failed++;
      const s = res.info;
      console.log(`[${status}] ${name}` + (s.canvas != null
        ? `  (分頁 ${s.pages}｜圖表 ${s.charts}/${s.canvas}｜QA ${s.qa}（標題型 ${s.typed}）｜trap ${s.trap}｜FIA ${s.fia}｜assert ${s.assertN ?? '?'} 條・${s.assertMode ?? '-'})` : ''));
      res.fail.forEach(m => console.log(`    ✗ ${m}`));
      res.warn.forEach(m => console.log(`    ⚠ ${m}`));
      (res.exempt || []).forEach(m => console.log(`    ⊘ 豁免 ${m}`));
    }
  } finally {
    cdp.ws.close();
    proc.kill();
    server.close();
    await new Promise(r => setTimeout(r, 300));
    try { rmSync(profile, { recursive: true, force: true }); } catch { /* browser 可能仍持有檔案鎖 */ }
  }
  console.log(`\n${files.length - failed}/${files.length} 份無 FAIL`);
  process.exit(failed ? 1 : 0);
}

main().catch(e => { console.error(e); process.exit(2); });
