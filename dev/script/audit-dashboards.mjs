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
 *   [FAIL] PH-01 原始碼（文件文字、DATA、script）殘留 `__TODO:` 佔位符；template 則為 [WARN]（命中 key＝佔位符本身）
 *   配色（B.9-1，2026-11-01 本地化，取代 dataviz validate_palette.js）：頁面內呼叫 c(key,1) 取
 *   blue/teal/orange/purple/red 五個類別色（gray 是中性色不算），與 body computed 背景合成不透明色後兩兩比較
 *   （全部 10 個色對，命中 key＝色對，如 orange/teal）。判定 ΔE＝OKLab 歐氏距離 ×100（B.9-1 門檻的原始單位，
 *   以 ARCHIVE 配色驗證紀錄校準，見 PAL_NORMAL_MIN 註解）；色盲模擬＝Machado 2009 severity 1.0、線性 RGB。皆本檔自行實作：
 *   [FAIL] PAL-01 正常視力 ΔE < 15
 *   [FAIL] PAL-02 色盲模擬（protanopia／deuteranopia 取較小者）ΔE < 6
 *   [WARN] PAL-02 色盲模擬 6 ≤ ΔE < 8（該色對的系列需直接標籤或紋理）
 *   [WARN] PAL 頁面沒有 c() 或類別色無法解析 → 跳過配色檢查（不 FAIL）
 *   template（同 AC-01 路徑辨識）的 PAL-01／PAL-02 一律降為 WARN：類別色要等 Phase 1 選定 preset 才定案
 *   舊驗證器只比相鄰色；既有 8 份的非相鄰命中逐色對列入 EXEMPTIONS（新色對仍會報）
 *   環境變數 AUDIT_PAL_VERBOSE=1 印出每個色對的 ΔE（正常／protan／deutan）與 CIEDE2000 參考值
 *   豁免：本檔 EXEMPTIONS 常數表（檔名 × 規則 ID × [題目 key／色對／佔位符] × 理由）；豁免項照印（⊘）但不計 FAIL／WARN
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

/** 逐項規則（1.3＋M2）。sev 決定未豁免命中算 FAIL 還是 WARN（命中本身帶 sev 時以命中為準）。 */
const RULES = {
  'QA-01': { sev: 'fail', desc: '題目列缺難度標記 .badge/.qa-level l1–l3' },
  'QA-02': { sev: 'fail', desc: '答案區缺 F/I/A 標註（紅線 #2）' },
  'QA-03': { sev: 'fail', desc: 'A 題／訓練題缺 .trap-block（紅線 #3）' },
  'QA-04': { sev: 'warn', desc: '缺 .ev 證據碼（E.1 #12）' },
  'QA-05': { sev: 'warn', desc: '缺 .chart-ref-btn（E.1 #23）' },
  'QA-06': { sev: 'warn', desc: 'L3 題缺 .nav-hint（E.1 #14）' },
  'PH-01': { sev: 'fail', desc: '殘留 __TODO: 佔位符' },
  'PAL-01': { sev: 'fail', desc: '正常視力類別色 ΔE < 15（B.9-1 硬傷，須換色）' },
  'PAL-02': { sev: 'fail', desc: '色盲模擬類別色 ΔE 過近（<6 硬傷須換色；6–8 須直接標籤或紋理）' },
};

/**
 * B.9-1 門檻，單位＝OKLab 歐氏距離 ×100（判定用 ΔE）。
 * 校準（2026-11-01）：ARCHIVE「配色驗證紀錄」9 個數值（修正前 10.8／10.2／11.8／色盲 5.7，修正後 17.7／16.9／18.5／16.6，
 * 色盲 7.9）以此量度＋Machado CVD 逐一重現到 0.1；CIEDE2000 無法同時讓「修正前 FAIL、現行不 FAIL」成立
 * （#8 修正前 #0891B2↔#059669 ΔE00=28.9，高於現行健身房 blue/teal 22.9），故 ΔE00 只列參考（AUDIT_PAL_VERBOSE）。
 */
const PAL_NORMAL_MIN = 15, PAL_CVD_FAIL = 6, PAL_CVD_WARN = 8;

// ── 配色數學（自行實作；公式來源：Ottosson 2020 OKLab、CIE 15 sRGB→Lab D65、Sharma et al. 2005 CIEDE2000、Machado et al. 2009）──
const srgbToLin = v => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
function linToLab([r, g, b]) {
  const X = (0.4124564 * r + 0.3575761 * g + 0.1804375 * b) / 0.95047;
  const Y = 0.2126729 * r + 0.7151522 * g + 0.0721750 * b;
  const Z = (0.0193339 * r + 0.1191920 * g + 0.9503041 * b) / 1.08883;
  const f = t => t > 216 / 24389 ? Math.cbrt(t) : (24389 / 27 * t + 16) / 116;
  return [116 * f(Y) - 16, 500 * (f(X) - f(Y)), 200 * (f(Y) - f(Z))];
}
/** 線性 sRGB → OKLab（Ottosson 2020）。 */
function linToOklab([r, g, b]) {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s];
}
/** 判定用 ΔE：OKLab 歐氏距離 ×100（輸入線性 RGB）。 */
const deltaEOk = (x, y) => { const p = linToOklab(x), q = linToOklab(y); return 100 * Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]); };
/** 參考用 CIEDE2000（輸入 CIELAB）。 */
function deltaE2000([L1, a1, b1], [L2, a2, b2]) {
  const rad = d => d * Math.PI / 180, deg = r => r * 180 / Math.PI, p7 = x => x ** 7;
  const Cb = (Math.hypot(a1, b1) + Math.hypot(a2, b2)) / 2;
  const G = 0.5 * (1 - Math.sqrt(p7(Cb) / (p7(Cb) + p7(25))));
  const a1p = (1 + G) * a1, a2p = (1 + G) * a2;
  const C1p = Math.hypot(a1p, b1), C2p = Math.hypot(a2p, b2);
  const hue = (b, a) => (a === 0 && b === 0) ? 0 : (deg(Math.atan2(b, a)) + 360) % 360;
  const h1p = hue(b1, a1p), h2p = hue(b2, a2p);
  const dLp = L2 - L1, dCp = C2p - C1p;
  let dhp = 0;
  if (C1p * C2p !== 0) { dhp = h2p - h1p; if (dhp > 180) dhp -= 360; else if (dhp < -180) dhp += 360; }
  const dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin(rad(dhp / 2));
  const Lbp = (L1 + L2) / 2, Cbp = (C1p + C2p) / 2;
  let hbp = h1p + h2p;
  if (C1p * C2p !== 0) hbp = Math.abs(h1p - h2p) <= 180 ? hbp / 2 : (hbp < 360 ? (hbp + 360) / 2 : (hbp - 360) / 2);
  const T = 1 - 0.17 * Math.cos(rad(hbp - 30)) + 0.24 * Math.cos(rad(2 * hbp)) + 0.32 * Math.cos(rad(3 * hbp + 6)) - 0.20 * Math.cos(rad(4 * hbp - 63));
  const dTheta = 30 * Math.exp(-(((hbp - 275) / 25) ** 2));
  const Rc = 2 * Math.sqrt(p7(Cbp) / (p7(Cbp) + p7(25)));
  const Sl = 1 + 0.015 * (Lbp - 50) ** 2 / Math.sqrt(20 + (Lbp - 50) ** 2);
  const Sc = 1 + 0.045 * Cbp, Sh = 1 + 0.015 * Cbp * T, Rt = -Math.sin(rad(2 * dTheta)) * Rc;
  return Math.sqrt((dLp / Sl) ** 2 + (dCp / Sc) ** 2 + (dHp / Sh) ** 2 + Rt * (dCp / Sc) * (dHp / Sh));
}
/** Machado, Oliveira & Fernandes (2009) severity 1.0，作用於線性 RGB。 */
const CVD = {
  protan: [[0.152286, 1.052583, -0.204868], [0.114503, 0.786281, 0.099216], [-0.003882, -0.048116, 1.051998]],
  deutan: [[0.367322, 0.860646, -0.227968], [0.280085, 0.672501, 0.047413], [-0.011820, 0.042940, 0.968881]],
};
const toHex = rgb => '#' + rgb.map(v => Math.round(v).toString(16).padStart(2, '0')).join('').toUpperCase();
/** fg [r,g,b,a] 疊在 bg [r,g,b] 上的不透明 sRGB。 */
const composite = ([r, g, b, a], bg) => [r, g, b].map((v, i) => v * a + bg[i] * (1 - a));

/**
 * 類別色兩兩比較（全部色對，不只相鄰）。回傳 { pairs:[{key, normal, protan, deutan, cvd, cvdType, de00, de00cvd}], minNormal, minCvd, hex }。
 * 判定值 normal／protan／deutan／cvd 為 OKLab ΔE×100；de00／de00cvd 為 CIEDE2000 參考值。
 * 色盲：兩色先各自經同一 CVD 矩陣模擬（線性 RGB，結果夾到 [0,1]），再算距離。
 */
function paletteDistances(colors, bg) {
  const keys = Object.keys(colors);
  const solid = Object.fromEntries(keys.map(k => [k, composite(colors[k], bg)]));
  const lin = k => solid[k].map(srgbToLin);
  const sim = (k, m) => m.map(row => row[0] * lin(k)[0] + row[1] * lin(k)[1] + row[2] * lin(k)[2]).map(v => Math.min(1, Math.max(0, v)));
  const de00 = (x, y) => deltaE2000(linToLab(x), linToLab(y));
  const pairs = [];
  for (let i = 0; i < keys.length; i++) for (let j = i + 1; j < keys.length; j++) {
    const [a, b] = [keys[i], keys[j]].sort();
    const normal = deltaEOk(lin(a), lin(b));
    const protan = deltaEOk(sim(a, CVD.protan), sim(b, CVD.protan));
    const deutan = deltaEOk(sim(a, CVD.deutan), sim(b, CVD.deutan));
    pairs.push({ key: `${a}/${b}`, normal, protan, deutan, cvd: Math.min(protan, deutan), cvdType: protan <= deutan ? 'protan' : 'deutan',
      de00: de00(lin(a), lin(b)), de00cvd: Math.min(...Object.values(CVD).map(m => de00(sim(a, m), sim(b, m)))) });
  }
  const min = f => pairs.reduce((m, p) => (p[f] < m[f] ? p : m), pairs[0]);
  return { pairs, minNormal: min('normal'), minCvd: min('cvd'), hex: Object.fromEntries(keys.map(k => [k, toHex(solid[k])])) };
}

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
  // PAL（2.7）：舊 dataviz 驗證器只比「相鄰」色（blue→teal→orange→purple→red 順序），ARCHIVE 只記到相鄰色對；
  // 本 audit 比全部色對，以下為既有成品的非相鄰命中。換色屬改配色（總原則 2：既有 8 份不改配色）→ 逐色對豁免，新色對仍會報。
  // 未查證這些色對是否實際同圖出現；若同圖並列，系列需直接標籤。
  ...[['SaaS訂閱制_MRR訂閱指標分析_訓練儀表板教材.html', 'PAL-01', ['blue/purple', 'orange/red']],
    ['SaaS訂閱制_MRR訂閱指標分析_訓練儀表板教材.html', 'PAL-02', ['blue/purple']],
    ['品牌訊息通道_多通道績效分析_訓練儀表板教材.html', 'PAL-01', ['blue/purple', 'red/teal']],
    ['品牌訊息通道_多通道績效分析_訓練儀表板教材.html', 'PAL-02', ['blue/purple', 'red/teal']],
    ['網紅個人品牌_旅遊生活風格創作者_訓練儀表板教材.html', 'PAL-01', ['blue/purple', 'orange/red']],
    ['網紅個人品牌_旅遊生活風格創作者_訓練儀表板教材.html', 'PAL-02', ['blue/purple']],
    ['醫美連鎖_預約回診分析_訓練儀表板教材.html', 'PAL-01', ['orange/red']],
    ['零售便利商店_商品庫存補貨分析_訓練儀表板教材.html', 'PAL-01', ['orange/red']],
    ['電商DTC_會員交易分析_訓練儀表板教材.html', 'PAL-01', ['blue/purple']],
    ['電商DTC_會員交易分析_訓練儀表板教材.html', 'PAL-02', ['blue/purple']],
    ['餐飲連鎖_門市營運分析_訓練儀表板教材.html', 'PAL-01', ['blue/purple']],
    ['餐飲連鎖_門市營運分析_訓練儀表板教材.html', 'PAL-02', ['blue/purple']],
  ].map(([file, rule, items]) => ({ file, rule, items,
    reason: '非相鄰色對，2026-10-14 舊驗證器（只比相鄰色）未檢出；換色屬改配色（總原則 2），保留現狀' })),
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
  // PAL：在頁面內取 c() 的實際類別色與 body computed 背景（ΔE 運算在 Node 端）
  if (typeof c !== 'function') out.palette = { skip: '頁面沒有 c() 色彩函式' };
  else {
    const cx = document.createElement('canvas').getContext('2d');
    const parse = s => {   // 以 canvas 正規化任意 CSS 色字串；無效字串會保留哨兵值
      const norm = sentinel => { cx.fillStyle = sentinel; cx.fillStyle = String(s); return cx.fillStyle; };
      const v1 = norm('#010203'), v2 = norm('#040506');
      if (v1 !== v2) return null;
      let m = v1.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
      if (m) return [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16), 1];
      m = v1.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+))?\s*\)$/);
      return m ? [+m[1], +m[2], +m[3], m[4] == null ? 1 : +m[4]] : null;
    };
    const colors = {}, bad = [];
    for (const k of ['blue', 'teal', 'orange', 'purple', 'red']) {
      let v = null;
      try { v = parse(c(k, 1)); } catch (e) { /* c() throw 視同無法解析 */ }
      if (v) colors[k] = v; else bad.push(k);
    }
    // 背景：body → html → 白，逐層合成（body 透明時沿用下層）
    let bg = [255, 255, 255];
    for (const el of [document.documentElement, document.body]) {
      const v = el && parse(getComputedStyle(el).backgroundColor);
      if (v) bg = [0, 1, 2].map(i => v[i] * v[3] + bg[i] * (1 - v[3]));
    }
    out.palette = bad.length ? { skip: `c() 無法解析類別色：${bad.join(', ')}` } : { colors, bg };
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
  const hits = { ...(res.qaHits || {}) };
  const add = (rule, h) => (hits[rule] = hits[rule] || []).push(h);
  // PH-01：掃原始檔（涵蓋文件文字、DATA、script、註解）；template 降為 WARN
  const src = readFileSync(file, 'utf8');
  for (const m of src.matchAll(/__TODO:(?:[^\n_]|_(?!_))*(?:__)?/g)) {   // 佔位符格式 __TODO:說明__，取到結尾 __ 或行尾
    const line = src.slice(0, m.index).split('\n').length;
    add('PH-01', { key: m[0], label: `L${line} ${m[0].slice(0, 40)}`, sev: isTemplate ? 'warn' : 'fail' });
  }
  // PAL-01／PAL-02：配色 ΔE（B.9-1）
  const pal = res.palette;
  if (!pal || pal.skip) res.warn.push(`PAL 跳過配色檢查：${pal ? pal.skip : '頁面未回傳類別色'}`);
  else {
    const d = paletteDistances(pal.colors, pal.bg);
    const f1 = x => x.toFixed(1);
    res.info.pal = `ΔE 正常 ${f1(d.minNormal.normal)}（${d.minNormal.key}）／色盲 ${f1(d.minCvd.cvd)}（${d.minCvd.key}, ${d.minCvd.cvdType}）`;
    res.info.palDetail = [`背景 ${toHex(pal.bg)}；` + Object.entries(d.hex).map(([k, v]) => `${k}=${v}`).join(' '),
      ...d.pairs.map(p => `${p.key.padEnd(14)} 正常 ${f1(p.normal).padStart(5)}｜protan ${f1(p.protan).padStart(5)}｜deutan ${f1(p.deutan).padStart(5)}`
        + `　（參考 ΔE00 正常 ${f1(p.de00).padStart(5)}｜色盲 ${f1(p.de00cvd).padStart(5)}）`)];
    for (const p of d.pairs) {
      // template 的類別色是 P2 基線，要等 Phase 1 選定 preset 才定案 → template 模式一律 WARN
      const tpl = isTemplate ? '（template：preset 未選定）' : '';
      if (p.normal < PAL_NORMAL_MIN) add('PAL-01', { key: p.key, label: `${p.key} ΔE ${f1(p.normal)}（${d.hex[p.key.split('/')[0]]}↔${d.hex[p.key.split('/')[1]]}）${tpl}`, sev: isTemplate ? 'warn' : 'fail' });
      if (p.cvd < PAL_CVD_WARN) add('PAL-02', { key: p.key, label: `${p.key} ${p.cvdType} ΔE ${f1(p.cvd)}${tpl}`, sev: p.cvd < PAL_CVD_FAIL && !isTemplate ? 'fail' : 'warn' });
    }
  }
  for (const [rule, list] of Object.entries(hits)) {
    const { sev, desc } = RULES[rule];
    const live = { fail: [], warn: [] };
    for (const h of list) {
      const ex = EXEMPTIONS.find(e => e.file === name && e.rule === rule && (!e.items || e.items.includes(h.key)));
      if (ex) res.exempt.push(`${rule} ${h.label}：${ex.reason}`);
      else live[h.sev || sev].push(h.label);
    }
    for (const lv of ['fail', 'warn']) {
      const ls = live[lv];
      if (!ls.length) continue;
      const unit = rule.startsWith('QA-') ? '題' : '項';
      const shown = ls.slice(0, 8).join('、') + (ls.length > 8 ? ` …等 ${ls.length} ${unit}` : '');
      res[lv].push(`${rule} ${desc}（${ls.length} ${unit}）：${shown}`);
    }
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
        ? `  (分頁 ${s.pages}｜圖表 ${s.charts}/${s.canvas}｜QA ${s.qa}（標題型 ${s.typed}）｜trap ${s.trap}｜FIA ${s.fia}｜assert ${s.assertN ?? '?'} 條・${s.assertMode ?? '-'}${s.pal ? '｜' + s.pal : ''})` : ''));
      if (process.env.AUDIT_PAL_VERBOSE && s.palDetail) s.palDetail.forEach(m => console.log(`    · ${m}`));
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
