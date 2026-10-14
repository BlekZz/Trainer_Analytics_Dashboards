#!/usr/bin/env node
/**
 * audit-dashboards.mjs — 交付前自動驗收（零依賴，Node 22+ 內建 WebSocket/fetch）
 *
 * 用真瀏覽器（headless Chromium / Edge / Chrome，經 CDP）逐份開啟儀表板，檢查：
 *   [FAIL] assertConsistency() 存在、無 ✗ / console.error / throw
 *   [FAIL] 載入期間無 uncaught exception
 *   [FAIL] ChartDataLabels 已 register
 *   [FAIL] 切過每個分頁後，每個 canvas 都有 Chart 實例且尺寸非 0
 *   [FAIL] 教學紅線元素存在：.qa-item、.trap-block、F/I/A 標註、設計選擇／設計說明區塊
 *   [WARN] Chart.defaults.plugins.datalabels.display 未設為 false（opt-in 規範）
 *   [WARN] <title> 與檔名不一致
 *   [WARN] 缺 .ev 證據碼 / .nav-hint / .chart-ref-btn（E.1 #12 / #14 / #23）
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
  const out = { fail: [], warn: [], info: {} };
  const logs = [];
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
  }
  if (!window.Chart) { out.fail.push('Chart.js 未載入'); return out; }
  if (!Chart.registry.plugins.get('datalabels')) out.fail.push('ChartDataLabels 未 register（tech-notes 14-A）');
  if (Chart.defaults.plugins.datalabels && Chart.defaults.plugins.datalabels.display !== false)
    out.warn.push('datalabels 預設未設 display=false（SKILL Layer 1 樣板）');

  const pages = [...new Set([...document.querySelectorAll('[onclick*="switchPage"]')]
    .map(t => (t.getAttribute('onclick').match(/switchPage\(\s*['"]([^'"]+)['"]/) || [])[1]).filter(Boolean))];
  if (!pages.length) out.fail.push('找不到任何 switchPage 分頁');
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
  const optional = { '.ev': '證據碼（E.1 #12）', '.nav-hint': '跨頁 nav-hint（E.1 #14）', '.chart-ref-btn': '圖表索引按鈕（E.1 #23）' };
  for (const [sel, label] of Object.entries(optional)) if (!count(sel)) out.warn.push(`缺 ${sel} ${label}`);
  Object.assign(out.info, { pages: pages.length, charts: cvs.length - noChart.length, canvas: cvs.length, qa, trap, fia, title: document.title });
  return out;
};

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
        ? `  (分頁 ${s.pages}｜圖表 ${s.charts}/${s.canvas}｜QA ${s.qa}｜trap ${s.trap}｜FIA ${s.fia}｜assert ${s.assertLines} 行)` : ''));
      res.fail.forEach(m => console.log(`    ✗ ${m}`));
      res.warn.forEach(m => console.log(`    ⚠ ${m}`));
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
