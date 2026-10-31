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
 *   [FAIL] Chart.js 未載入（window.Chart 不存在）→ 其後的分頁／canvas／逐題／CH／IX／LY 檢查全部略過
 *
 *   逐題容器（3.8）：.qa-item、.training-item（品牌）、.train-item（健身房）。非 .qa-item 容器的難度／題型可由題目列文字
 *   「L1–3·F/I/A」（如 train-badge「T1 L3·A」、h4「[L3·A] 訓練題 1」）判定；這兩類容器一律視為訓練題。
 *   A 題判定順序：題目列標記（同上）→ 題目列無任何題型標記時，答案區有 .tag-a 段落（「A:」行動段，零售採此寫法）。
 *   電商 DTC 題目列無標記、每題都有「🎯 行動」段（.ans-head.act，含 L1 題）、.fia.a 為行內假設註記 → 無可靠 A 訊號，不判定。
 *
 *   圖表實例（3.1，讀 Chart.getChart() 的實際 scale／options／datalabels label model；命中 key＝canvas id）：
 *   [FAIL] CH-01 bar 值軸 min > 0（B.9-6、E.1 #47）。自動豁免：data-trap 含「截斷」的 trap-block 所在題目／圖卡
 *          指向的圖（trap 所在 .chart-card 內的 canvas，或同題 goToChart／switchPage／scrollToTarget 目標內的 canvas）
 *   [FAIL] CH-02 bar／折線 dataset 有向外 datalabels（anchor:end 且 align 非 start/center/bottom/left；折線 align top/end）的值軸
 *          max < 1.2 × 資料最大值（E.1 #8、B.2-4、DQ-1～3；stacked 取各 category 加總；值軸 min>0 時以 min 為基線比距離）
 *   [FAIL] CH-03 legend 顯示 "undefined"／空白項，或單一 dataset（非 donut）卻顯示 legend（E.1 #9、B.8 #3）
 *   [FAIL] CH-04 donut／pie 沒有任何可見 datalabels（B.4 🔴、DQ-7）；部分切片無標籤（閾值過濾）→ [WARN]
 *   [WARN] CH-05 donut 第一片起始角不在 12 點鐘（DQ-5）。以實測 arc.startAngle 判定，不看 rotation 值：
 *          Chart.js 4.4.0 實測 rotation:0 → startAngle −90°（12 點鐘）、rotation:-90 → −180°（9 點鐘），B.4 文字與實況相反
 *   [WARN] CH-06 donut／pie 超過 6 塊（B.8 #5、B.9-4）
 *   [WARN] CH-07 donut 有外部標籤（anchor:end）但 layout.padding 最小邊 < 32（DQ-8）
 *   [FAIL] CH-08 折線圖（config type line）interaction.mode ≠ 'index'（B.5 🔴、DQ-11）
 *   [FAIL] CH-09 折線圖可見 dataset 的 pointHoverRadius < 10（B.5 🔴、DQ-12）
 *   [WARN] CH-10 非時間軸、非堆疊 bar 第一個可見 dataset 未依值降序（E.1 #25、B.4-1）。標籤半數以上含數字或為月份／星期名
 *          → 視為時間／有序分箱軸，跳過
 *
 *   真實點擊互動（3.2，關閉 transition/animation 後操作；命中 key 見各規則）：
 *   點擊方式＝scrollIntoView(center) → document.elementFromPoint(元素中心) 命中測試 → 對命中的最深元素 .click()。
 *   選這個而非 CDP Input.dispatchMouseEvent：命中測試保留「被別的元素蓋住就點不到」的真實語意，且整段在頁面內同步完成
 *   （不需逐次往返 CDP 換算座標），數百次點擊仍維持秒級。可見性一律用 computed style＋getBoundingClientRect
 *   與 overflow:hidden/clip 祖先求交集判定，不看 class。
 *   [FAIL] IX-01 題目（逐題容器）初始收合 → 點題目列展開 → 再點收合（key＝題目 key；B.5 QA Toggle、B.8 #7）
 *   [FAIL] IX-02 findings 點標題列（第一個子元素）展開 → 再點收合（key＝<page id>/findings#n；B.5 🔴、E.1 #33；
 *          初始未坍縮由既有 findings 檢查負責）
 *   [FAIL] IX-03 指標定義側板：初始關閉 → 點 toggle 開啟（寬 >40px）→ 再點關閉（E.1 #18）
 *   [FAIL] IX-04 .nav-hint／.chart-ref-btn 點擊後顯示的分頁＝onclick 宣告的分頁，且目標元素（id／card-id／group-id）
 *          存在於該頁（B.5 🔴 Chart Ref Button、E.1 #23；key＝<所在頁>→<參數>）
 *
 *   版面（3.3）：Emulation.setDeviceMetricsOverride 寬 960／1440 × 側板關／開 × 每個分頁（key＝<寬>/<側板>/<page id>）
 *   [FAIL] LY-01 水平溢出：document 或分頁容器 scrollWidth > clientWidth（附第一個溢出其父層的元素）
 *   [FAIL] LY-02 .kpi-value 截斷：scrollWidth > clientWidth（B.7 🔴、E.1 #24）
 *
 * 用法：
 *   node dev/script/audit-dashboards.mjs                 # 檢查 Dashboard/*.html
 *   node dev/script/audit-dashboards.mjs path/a.html ... # 指定檔案
 *   node dev/script/audit-dashboards.mjs --json out.json # 另寫每份統計（頁數、圖數、QA、trap、FIA、assert 條數、
 *                                                        #   最小 ΔE、:root 色／字型、陷阱名稱、各規則 fail/warn/exempt 命中數）
 *   node dev/script/audit-dashboards.mjs --summary       # 結尾印跨份報表（各份題數／陷阱數、:root accent／bg／字型組合重複、
 *                                                        #   陷阱名稱出現頻率）；--summary 與 --json 用同一份統計物件
 *   CHROME_PATH=/path/to/chrome node dev/script/audit-dashboards.mjs
 * Exit code：0 = 全部無 FAIL；1 = 有 FAIL；2 = 環境錯誤（找不到瀏覽器等）
 * 需要網路（CDN：Chart.js / plugins / Google Fonts）。全量 9 份約 1 分鐘（互動與版面檢查佔多數）。
 */
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
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
  // 3.1 圖表實例（命中 key＝canvas id）
  'CH-01': { sev: 'fail', desc: 'bar 值軸未從 0 起（B.9-6、E.1 #47）' },
  'CH-02': { sev: 'fail', desc: '有外部 datalabels 的值軸 max < 1.2×資料最大值（E.1 #8、DQ-1～3）' },
  'CH-03': { sev: 'fail', desc: 'legend 顯示 undefined／單一 dataset 卻顯示 legend（E.1 #9、B.8 #3）' },
  'CH-04': { sev: 'fail', desc: 'donut 切片 datalabels 未顯示（B.4 🔴、DQ-7）' },
  'CH-05': { sev: 'warn', desc: 'donut 第一片未從 12 點鐘起始（DQ-5，以實測角度判定）' },
  'CH-06': { sev: 'warn', desc: 'donut 超過 6 塊（B.8 #5、B.9-4）' },
  'CH-07': { sev: 'warn', desc: 'donut 外部標籤但 layout.padding < 32（DQ-8）' },
  'CH-08': { sev: 'fail', desc: "折線圖 interaction.mode 不是 'index'（B.5 🔴、DQ-11）" },
  'CH-09': { sev: 'fail', desc: '折線圖 pointHoverRadius < 10（B.5 🔴、DQ-12）' },
  'CH-10': { sev: 'warn', desc: '非時間軸 bar 未依值降序（E.1 #25）' },
  // 3.2 真實點擊
  'IX-01': { sev: 'fail', desc: '題目點擊展開／收合異常（B.5 QA Toggle、B.8 #7）' },
  'IX-02': { sev: 'fail', desc: 'findings 點擊展開／收合異常（B.5 🔴、E.1 #33）' },
  'IX-03': { sev: 'fail', desc: '指標定義側板開合異常（E.1 #18）' },
  'IX-04': { sev: 'fail', desc: '跨頁按鈕點擊後分頁或目標錯誤（B.5 🔴、E.1 #23）' },
  // 3.3 版面
  'LY-01': { sev: 'fail', desc: '水平溢出' },
  'LY-02': { sev: 'fail', desc: '.kpi-value 截斷（B.7 🔴、E.1 #24）' },
};
const LY_WIDTHS = [960, 1440];   // 3.3 寬度矩陣
const LY_WAIT_MS = 150;          // 切頁後等 Chart.js ResizeObserver 重算 canvas 寬（溢出時再多等 400ms 複驗）

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

  // ── M3（2026-11-01）新規則在既有成品的命中 ──
  // CH-01／02／03／08／09：圖表設定與 module-B／E 不符。改設定可機械完成，但 M3-A 不碰 Dashboard/（範圍限制），
  // 且 CH-01 截斷軸是否屬刻意設計、CH-02 標籤是否實際被切需截圖確認 → 先豁免（以 canvas id 為範圍），留待主線逐張判斷
  ...[['SaaS訂閱制_MRR訂閱指標分析_訓練儀表板教材.html', 'CH-02', ['chart-waterfall', 'chart-ltv-cac', 'chart-cac-channel', 'chart-migration', 'chart-funnel', 'chart-days-convert', 'chart-channel-conv']],
    ['SaaS訂閱制_MRR訂閱指標分析_訓練儀表板教材.html', 'CH-09', ['chart-mrr-trend', 'chart-churn-trend', 'chart-plan-dist']],
    ['健身房_會員全週期分析_訓練儀表板教材.html', 'CH-01', ['cCourseAtt', 'cPlanHours', 'cPlanRenewal', 'cPlanArpu']],
    ['健身房_會員全週期分析_訓練儀表板教材.html', 'CH-08', ['cHourly', 'cChurnTrend']],
    ['健身房_會員全週期分析_訓練儀表板教材.html', 'CH-09', ['cHourly', 'cChurnTrend']],
    ['品牌訊息通道_多通道績效分析_訓練儀表板教材.html', 'CH-01', ['c3-fcr']],
    ['品牌訊息通道_多通道績效分析_訓練儀表板教材.html', 'CH-02', ['c1-ch-conv', 'c1-push-conv-bar', 'c2-funnel', 'c4-src-bar']],
    ['網紅個人品牌_旅遊生活風格創作者_訓練儀表板教材.html', 'CH-02', ['chart-p1-dist', 'chart-p2-brands', 'chart-p3-cpm', 'chart-p4-engagement', 'chart-p4-active']],
    ['網紅個人品牌_旅遊生活風格創作者_訓練儀表板教材.html', 'CH-08', ['chart-p1-trend', 'chart-p1-active', 'chart-p3-impressions', 'chart-p3-decay']],
    ['網紅個人品牌_旅遊生活風格創作者_訓練儀表板教材.html', 'CH-09', ['chart-p1-trend', 'chart-p1-active', 'chart-p3-impressions', 'chart-p3-decay']],
    ['零售便利商店_商品庫存補貨分析_訓練儀表板教材.html', 'CH-03', ['ch-pareto', 'ch-stockout-monthly']],
    ['零售便利商店_商品庫存補貨分析_訓練儀表板教材.html', 'CH-08', ['ch-pareto']],
    ['零售便利商店_商品庫存補貨分析_訓練儀表板教材.html', 'CH-09', ['ch-pareto']],
    ['電商DTC_會員交易分析_訓練儀表板教材.html', 'CH-02', ['cMemberTrend', 'cMemberAge', 'cOrderDist', 'cPayMethod', 'cTierSpend']],
    ['電商DTC_會員交易分析_訓練儀表板教材.html', 'CH-08', ['cOrderHour', 'cPayMethod']],
    ['電商DTC_會員交易分析_訓練儀表板教材.html', 'CH-09', ['cPayMethod']],
    ['餐飲連鎖_門市營運分析_訓練儀表板教材.html', 'CH-01', ['cTierAOV']],
    ['餐飲連鎖_門市營運分析_訓練儀表板教材.html', 'CH-02', ['cStoreRank', 'cFreqDist', 'cRepurchase']],
    ['餐飲連鎖_門市營運分析_訓練儀表板教材.html', 'CH-08', ['cHourly']],
    ['餐飲連鎖_門市營運分析_訓練儀表板教材.html', 'CH-09', ['cHourly']],
  ].map(([file, rule, items]) => ({ file, rule, items,
    reason: '既有成品圖表設定（M3 新規則首次檢出）；修正屬改 Dashboard，留待主線逐張判斷是否機械修正' })),
  { file: 'SaaS訂閱制_MRR訂閱指標分析_訓練儀表板教材.html', rule: 'CH-01', items: ['chart-waterfall'],
    reason: '浮動 bar 瀑布圖（data 為 [起,迄]），自 4.6M 起畫以放大月變動；從 0 起畫各段會壓成細線，屬圖型設計而非一般 bar' },
  { file: 'template.html', rule: 'CH-08', items: ['cHourly'],
    reason: 'template 範例折線圖未設 interaction index；修 template 不在 M3-A 範圍，移交主線（新 dashboard 會繼承）' },
  { file: 'template.html', rule: 'CH-09', items: ['cHourly'],
    reason: 'template 範例折線圖 pointHoverRadius=5；同上移交主線' },
  // 3.8 擴大逐題容器後的命中：補 F/I/A／trap／收合都需新增教學內容或改互動設計（總原則 2）
  { file: '健身房_會員全週期分析_訓練儀表板教材.html', rule: 'QA-03', items: ['p-retention/T2', 'p-retention/T4'],
    reason: '.train-item 訓練題原稿無陷阱提示；補寫需新增教學內容' },
  { file: '健身房_會員全週期分析_訓練儀表板教材.html', rule: 'QA-02', items: ['p-retention/T4'],
    reason: '開放式「缺哪些分析維度」盤點題，答案為清單，無 F/I/A 可標（同電商 page-cross/T4）' },
  ...['QA-02', 'QA-03'].map(rule => ({ file: '品牌訊息通道_多通道績效分析_訓練儀表板教材.html', rule,
    items: ['page-4/訓練題1', 'page-4/訓練題2', 'page-4/訓練題3', 'page-4/訓練題4'],
    reason: '.training-item 只有題幹＋「提示」段，原稿無 F/I/A 與陷阱；補寫需新增教學內容' })),
  { file: '品牌訊息通道_多通道績效分析_訓練儀表板教材.html', rule: 'IX-01',
    items: ['page-4/訓練題1', 'page-4/訓練題2', 'page-4/訓練題3', 'page-4/訓練題4'],
    reason: '.training-item 的「提示」為常駐段落、原稿無收合設計；改成可收合屬改互動設計' },
  { file: '零售便利商店_商品庫存補貨分析_訓練儀表板教材.html', rule: 'QA-03',
    items: ['page-p1/#3', 'page-p1/#5', 'page-p2/#10', 'page-p3/#15', 'page-p3/#16'],
    reason: '3.8 新增「答案有 .tag-a 行動段即 A 題」後檢出；原稿無陷阱提示，補寫需新增教學內容（key 為全域序號）' },
  { file: '醫美連鎖_預約回診分析_訓練儀表板教材.html', rule: 'IX-02', items: ['page-p4/findings#1'],
    reason: 'Anscombe quartet 區塊刻意以 .veil-note 遮罩，須先按「打開圖」(revealQuartet) 才可操作——教學順序設計' },
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
  // qaHits：所有帶規則 ID 的逐項命中（QA／CH／IX…），在 Node 端 applyRules 套豁免
  const out = { fail: [], warn: [], info: { title: document.title }, qaHits: {} };
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
  if (!window.Chart) {
    out.fail.push('Chart.js 未載入（window.Chart 不存在：<script src=…chart.js> 遺失或 CDN 載入失敗）——其後的分頁／canvas／逐題／CH／IX／LY 檢查全部略過，修好後重跑');
    return out;
  }
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
  const hit = (rule, key, label, extra) => (out.qaHits[rule] = out.qaHits[rule] || []).push({ key, label, ...extra });
  const NUM_RE = /^(Q\s*\d+|T\s*\d+|訓練題\s*\d+)[\s.:：｜|、—-]*/;
  const LV_TXT = /\[?\bL([123])\s*[·・]\s*([FIA])?\]?/;   // 題目列文字型難度／題型（train-badge、h4）
  const Q_SEL = '.qa-item, .training-item, .train-item';   // 3.8 逐題容器
  const headOf = item => item.querySelector('.question, .qa-question, .train-q') || item.firstElementChild;
  const answerOf = (item, head) => {
    const a = item.querySelectorAll(':scope > .answer, :scope > .qa-answer, :scope > .train-answer, :scope > .training-hint');
    return a.length ? [...a] : [...item.children].filter(ch => ch !== head);
  };
  let typed = 0, typedAns = 0;
  const questions = [];
  [...document.querySelectorAll(Q_SEL)].forEach((item, idx) => {
    const isQa = item.classList.contains('qa-item');
    const head = headOf(item);
    const rest = [...item.children].filter(ch => ch !== head);           // 答案區＝題目列以外
    const inRest = sel => rest.some(ch => ch.matches(sel) || ch.querySelector(sel));
    const has = sel => !!item.querySelector(sel);
    const clone = head ? head.cloneNode(true) : document.createElement('div');
    clone.querySelectorAll('.badge, .qa-level, .qa-depth, .tag-f, .tag-i, .tag-a, .fia, .question-arrow, .qa-chevron, .train-chevron').forEach(n => n.remove());
    const rawText = clone.textContent.replace(/\s+/g, ' ').trim();
    const text = rawText.replace(/^\[L[123]\s*[·・]\s*[FIA]?\]\s*/, '');   // h4「[L3·A] 訓練題 1」→ 先剝難度再取題號
    const num = (text.match(NUM_RE) || [])[1];
    const key = `${(item.closest('.page') || {}).id || '?'}/${num ? num.replace(/\s+/g, '') : '#' + (idx + 1)}`;
    const label = `${key}「${text.replace(NUM_RE, '').replace(LV_TXT, '').trim().slice(0, 16)}…」`;
    const lvEl = head && head.querySelector('.badge.l1, .badge.l2, .badge.l3, .qa-level.l1, .qa-level.l2, .qa-level.l3');
    const lvTxt = !isQa && head ? head.textContent.match(LV_TXT) : null;  // 文字型只用於非 .qa-item 容器（不放寬既有規則）
    const level = lvEl ? ['l1', 'l2', 'l3'].find(l => lvEl.classList.contains(l)) : lvTxt ? 'l' + lvTxt[1] : null;
    let type = null;
    if (head) {
      for (const t of ['a', 'i', 'f']) if (head.querySelector(`.qa-depth.${t}, .tag-${t}, .fia.${t}`)) { type = t; break; }
      if (!type && lvEl) type = ((lvEl.textContent.match(/[·・]\s*([FIA])/) || [])[1] || '').toLowerCase() || null;
      if (!type && lvTxt && lvTxt[2]) type = lvTxt[2].toLowerCase();
    }
    if (type) typed++;
    else if (inRest('.tag-a')) { type = 'a'; typedAns++; }   // 題目列無題型 → 答案有「A:」行動段即 A 題（零售）
    const training = item.classList.contains('training') || !!item.closest('.training-block') || !isQa;
    if (!level) hit('QA-01', key, label);
    if (!inRest('.tag-f, .tag-i, .tag-a, .fia.f, .fia.i, .fia.a, .qa-depth, .ans-head.obs, .ans-head.inf, .ans-head.act')) hit('QA-02', key, label);
    if ((type === 'a' || training) && !has('.trap-block')) hit('QA-03', key, label + (training ? '［訓練題］' : '［A 題］'));
    if (!has('.ev')) hit('QA-04', key, label);
    if (!has('.chart-ref-btn')) hit('QA-05', key, label);
    if (level === 'l3' && !has('.nav-hint')) hit('QA-06', key, label);
    questions.push({ item, head, key, label, answer: answerOf(item, head) });
  });

  // ── 3.1 圖表實例 CH- ──（此時每頁都已切過、所有圖已畫）
  const NAV_RE = /(goToChart|switchPage|scrollToTarget)\(\s*['"]([^'"]*)['"](?:\s*,\s*['"]([^'"]*)['"])?/;
  const findTarget = id => id && (document.getElementById(id) || document.getElementById('card-' + id) || document.getElementById('group-' + id));
  // data-trap 含「截斷」→ 對應圖：trap 所在圖卡內的 canvas，或同題跨頁按鈕目標內的 canvas
  const truncated = new Set();
  for (const t of traps.filter(t => /截斷/.test(t.dataset.trap || ''))) {
    const box = t.closest(Q_SEL + ', .chart-card');
    if (!box) continue;
    const els = [box, ...[...box.querySelectorAll('[onclick]')].map(b => {
      const m = (b.getAttribute('onclick') || '').match(NAV_RE);
      return m && findTarget(m[1] === 'scrollToTarget' ? m[2] : m[3]);
    }).filter(Boolean)];
    els.forEach(el => (el.tagName === 'CANVAS' ? [el] : el.querySelectorAll('canvas')).forEach(cv => cv.id && truncated.add(cv.id)));
  }
  const rawVal = (v, axis) => Array.isArray(v) ? Math.max(...v) : (v && typeof v === 'object') ? v[axis] : v;
  const ordinal = labels => {   // 時間軸或有序分箱：半數以上標籤含數字或為月份／星期名
    const ls = labels.map(l => Array.isArray(l) ? l.join(' ') : String(l));
    return ls.filter(l => /\d|^(十[一二]?|[一二三四五六七八九])月|^(週|周|星期)[一二三四五六日天]|^(Mon|Tue|Wed|Thu|Fri|Sat|Sun|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i.test(l)).length >= ls.length / 2;
  };
  const chHit = (rule, cv, msg, extra) => hit(rule, cv.id || '(no id)', `${cv.id || '(no id)'}：${msg}`, extra);
  for (const cv of cvs) {
    const ch = Chart.getChart(cv);
    if (!ch) continue;
    const type = ch.config.type;
    const sets = ch.data.datasets.map((d, i) => ({ d, i, type: d.type || type, meta: ch.getDatasetMeta(i) })).filter(x => ch.isDatasetVisible(x.i));
    const dl = ch.$datalabels && ch.$datalabels._labels || [];
    const shownLabels = i => dl.filter(l => l._model && l.$context && l.$context.datasetIndex === i);
    const legOn = !!(ch.options.plugins.legend && ch.options.plugins.legend.display !== false);
    const legItems = (ch.legend && ch.legend.legendItems) || [];
    const round = (v, d = 2) => +v.toFixed(d);
    if (legOn && legItems.some(it => it.text == null || /^\s*$|undefined/.test(String(it.text))))
      chHit('CH-03', cv, `legend 出現 undefined／空白項（${legItems.map(it => String(it.text)).join('、')}）`);
    if (type === 'doughnut' || type === 'pie') {
      const s = sets[0];
      if (!s) continue;
      const n = s.meta.data.length;
      if (n > 6) chHit('CH-06', cv, `${n} 塊`);
      const arc = s.meta.data[0];
      const deg = arc ? ((arc.startAngle * 180 / Math.PI) % 360 + 540) % 360 - 180 : -90;   // 正規化到 (-180,180]
      if (Math.abs(deg + 90) > 1) chHit('CH-05', cv, `第一片起始 ${round(deg, 0)}°（12 點鐘＝−90°；rotation=${ch.options.rotation}）`);
      const lab = shownLabels(s.i);
      if (!lab.length) chHit('CH-04', cv, `${n} 塊皆無可見標籤（datalabels display 未開啟）`);
      else if (lab.length < n) chHit('CH-04', cv, `${lab.length}/${n} 塊有標籤（閾值過濾）`, { sev: 'warn' });
      if (lab.some(l => l._model.anchor === 'end')) {
        const p = ch.options.layout.padding;
        const minPad = typeof p === 'number' ? p : Math.min(...['top', 'right', 'bottom', 'left'].map(k => +(p && p[k]) || 0));
        if (minPad < 32) chHit('CH-07', cv, `padding 最小邊 ${minPad}`);
      }
      continue;
    }
    if (legOn && ch.data.datasets.length === 1 && !['polarArea', 'radar'].includes(type))
      chHit('CH-03', cv, `單一 dataset 卻顯示 legend（「${legItems.map(it => it.text).join('、')}」）`);
    // CH-01：bar 值軸從 0
    const bars = sets.filter(x => x.type === 'bar');
    const lowBar = bars.find(x => x.meta.vScale && x.meta.vScale.min > 0);
    if (lowBar) chHit('CH-01', cv, `值軸 ${lowBar.meta.vScale.id} min=${round(lowBar.meta.vScale.min)}`,
      truncated.has(cv.id) ? { auto: '對應 data-trap「截斷」教學陷阱' } : undefined);
    // CH-02：有向外 datalabels 的值軸 headroom
    const byScale = new Map();
    for (const x of sets.filter(x => x.type === 'bar' || x.type === 'line')) {   // DQ-1～3 只規範 bar／折線
      const out_ = shownLabels(x.i).some(l => {
        const { anchor, align } = l._model;
        return (anchor === 'end' && !['start', 'center', 'bottom', 'left'].includes(align)) || (x.type === 'line' && ['top', 'end'].includes(align));
      });
      if (out_ && x.meta.vScale) (byScale.get(x.meta.vScale) || byScale.set(x.meta.vScale, []).get(x.meta.vScale)).push(x);
    }
    for (const [vs, labelled] of byScale) {
      const ax = vs.axis;
      let dataMax;
      if (vs.options.stacked) {
        const members = sets.filter(x => x.meta.vScale === vs && x.type === 'bar');
        dataMax = Math.max(...ch.data.labels.map((_, k) => members.reduce((a, x) => a + Math.max(0, +rawVal(x.d.data[k], ax) || 0), 0)));
      } else dataMax = Math.max(...labelled.flatMap(x => x.d.data.map(v => +rawVal(v, ax)).filter(Number.isFinite)));
      if (!(dataMax > 0)) continue;
      const base = vs.min > 0 ? vs.min : 0;
      if (vs.max - base < 1.2 * (dataMax - base) * 0.999)
        chHit('CH-02', cv, `值軸 ${vs.id} max=${round(vs.max)}，資料最大 ${round(dataMax)}（需 ≥ ${round(base + 1.2 * (dataMax - base))}）`);
    }
    // CH-08／09：折線圖互動
    if (type === 'line') {
      const mode = ch.options.interaction && ch.options.interaction.mode;
      if (mode !== 'index') chHit('CH-08', cv, `interaction.mode=${mode}`);
      const radii = sets.filter(x => x.type === 'line' && x.meta.data[0]).map(x => +x.meta.data[0].options.hoverRadius);
      if (radii.length && Math.min(...radii) < 10) chHit('CH-09', cv, `pointHoverRadius=${Math.min(...radii)}`);
    }
    // CH-10：非時間軸 bar 降序（只 WARN）
    if (type === 'bar' && bars.length && !(bars[0].meta.vScale && bars[0].meta.vScale.options.stacked) && !ordinal(ch.data.labels || [])) {
      const vals = bars[0].d.data.map(v => +rawVal(v, bars[0].meta.vScale ? bars[0].meta.vScale.axis : 'y'));
      if (vals.every(v => Number.isFinite(v) && v >= 0) && vals.some((v, k) => k && v > vals[k - 1]))
        chHit('CH-10', cv, `「${bars[0].d.label || 'dataset 0'}」順序 ${vals.slice(0, 6).map(v => round(v, 1)).join(',')}${vals.length > 6 ? '…' : ''}`);
    }
  }

  // ── 3.2 真實點擊 IX- ──
  const noAnim = document.createElement('style');
  noAnim.id = '__audit_no_anim';
  noAnim.textContent = '*,*::before,*::after{transition:none!important;animation:none!important;scroll-behavior:auto!important}';
  document.head.appendChild(noAnim);
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const pageOf = k => pageEls.find(el => el.id === k || el.id === 'page-' + k || el.id === 'p-' + k || el.id.endsWith('-' + k));
  const activePages = () => pageEls.filter(p => getComputedStyle(p).display !== 'none');
  const goPage = el => {
    const pg = el.closest('.page');
    if (!pg || activePages().includes(pg)) return;
    const k = pages.find(k => pageOf(k) === pg);
    if (k) try { switchPage(k); } catch (e) { /* switchPage 錯誤已在前面回報 */ }
  };
  /** 可見方框：自身與祖先 display/visibility/opacity，並與 overflow hidden/clip 祖先求交集。回傳 {w,h}。 */
  const box = el => {
    if (!el || !el.isConnected) return { w: 0, h: 0 };
    for (let a = el; a; a = a.parentElement) {
      const cs = getComputedStyle(a);
      if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity < 0.05) return { w: 0, h: 0 };
    }
    const r = el.getBoundingClientRect();
    let [l, t, rt, b] = [r.left, r.top, r.right, r.bottom];
    for (let a = el.parentElement; a && a !== document.documentElement; a = a.parentElement) {
      const cs = getComputedStyle(a), clip = v => v === 'hidden' || v === 'clip';
      if (!clip(cs.overflowX) && !clip(cs.overflowY)) continue;
      const q = a.getBoundingClientRect();
      if (clip(cs.overflowX)) { l = Math.max(l, q.left); rt = Math.min(rt, q.right); }
      if (clip(cs.overflowY)) { t = Math.max(t, q.top); b = Math.min(b, q.bottom); }
    }
    return { w: Math.max(0, rt - l), h: Math.max(0, b - t) };
  };
  const seen = el => { const v = box(el); return v.w > 2 && v.h > 2; };
  const desc = el => el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (el.classList.length ? '.' + [...el.classList].slice(0, 2).join('.') : '');
  /** 模擬滑鼠點擊：捲到中央 → elementFromPoint 命中測試 → 點命中的最深元素。回傳錯誤字串或 null。 */
  const click = el => {
    el.scrollIntoView({ block: 'center', inline: 'nearest' });
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return '元素尺寸為 0';
    const x = Math.min(Math.max(r.left + r.width / 2, 1), innerWidth - 2), y = Math.min(Math.max(r.top + r.height / 2, 1), innerHeight - 2);
    const hitEl = document.elementFromPoint(x, y);
    if (!hitEl) return '點擊位置無元素';
    if (hitEl !== el && !el.contains(hitEl)) return `被 ${desc(hitEl)} 遮擋`;
    hitEl.click();
    return null;
  };
  /** 暫時移除祖先的 collapsed（題目放在坍縮區塊內時），回傳還原清單。 */
  const uncollapse = el => {
    const saved = [];
    for (let a = el.parentElement; a && a !== document.body; a = a.parentElement)
      if (a.classList.contains('collapsed')) { saved.push([a, a.className]); a.classList.remove('collapsed'); }
    return saved;
  };
  const restore = saved => saved.reverse().forEach(([e, c]) => { e.className = c; });
  /** 初始收合 → 點 head 展開 → 再點收合；回傳錯誤字串或 null。skipInitial：初始狀態由別的規則負責。 */
  const toggleCycle = (head, body, skipInitial) => {
    const open = () => body.some(seen);
    if (!head || !seen(head)) return '標題列不可見';
    if (open()) { if (!skipInitial) return '初始即展開（答案載入時可見）'; return null; }
    let e = click(head);
    if (e) return '點擊失敗：' + e;
    if (!open()) return '點擊後未展開';
    e = click(head);
    if (e) return '再點失敗：' + e;
    if (open()) return '再點後未收合';
    return null;
  };
  // IX-01 逐題
  for (const q of questions) {
    goPage(q.item);
    const saved = uncollapse(q.item).concat([[q.item, q.item.className], ...q.answer.map(e => [e, e.className])]);
    const err = q.answer.length ? toggleCycle(q.head, q.answer, false) : '找不到答案區';
    restore(saved);
    if (err) hit('IX-01', q.key, `${q.label}：${err}`);
  }
  // IX-02 findings
  const fCount = {};
  for (const sec of document.querySelectorAll('.findings-section')) {
    const pid = (sec.closest('.page') || {}).id || '?';
    const key = `${pid}/findings#${(fCount[pid] = (fCount[pid] || 0) + 1)}`;
    const head = sec.firstElementChild, body = [...sec.children].slice(1);
    if (!head || !body.length) continue;
    goPage(sec);
    const saved = uncollapse(sec).concat([[sec, sec.className]]);
    const err = toggleCycle(head, body, true);
    restore(saved);
    if (err) hit('IX-02', key, `${key}「${head.textContent.trim().slice(0, 12)}」：${err}`);
  }
  // IX-03 定義側板
  {
    const btn = document.querySelector('#defToggleBtn, #defToggle, .def-toggle-btn');
    const panel = document.querySelector('#def-panel-outer, .def-panel');
    const isOpen = () => box(panel).w > 40;
    let err = null;
    if (!btn || !panel) err = `找不到${btn ? '' : ' toggle 按鈕（#defToggleBtn／.def-toggle-btn）'}${panel ? '' : ' 側板（#def-panel-outer）'}`;
    else if (isOpen()) err = '初始即開啟';
    else {
      const e1 = click(btn);
      if (e1 || !isOpen()) err = e1 ? '點擊失敗：' + e1 : '點擊後未開啟';
      else { const e2 = click(btn); if (e2 || isOpen()) err = e2 ? '再點失敗：' + e2 : '再點後未關閉'; }
      if (isOpen()) btn.click();
    }
    if (err) hit('IX-03', 'def-panel', `定義側板：${err}`);
  }
  // IX-04 跨頁按鈕
  for (const btn of document.querySelectorAll('.nav-hint, .chart-ref-btn')) {
    const own = (btn.closest('.page') || {}).id || '?';
    const oc = btn.getAttribute('onclick') || '';
    const m = oc.match(NAV_RE);
    const key = `${own}→${m ? m.slice(2).filter(Boolean).join('/') : oc.slice(0, 30) || '(無 onclick)'}`;
    const kind = btn.classList.contains('nav-hint') ? 'nav-hint' : 'chart-ref-btn';
    let err = null;
    if (!m) err = 'onclick 無法解析跨頁目標（goToChart／switchPage／scrollToTarget）';
    else {
      const [, fn, a1, a2] = m;
      const tid = fn === 'scrollToTarget' ? a1 : a2;
      const target = findTarget(tid);
      const want = fn === 'scrollToTarget' ? target && target.closest('.page') : pageOf(a1);
      if (tid && !target) err = `目標元素 ${tid} 不存在`;
      else if (!want) err = `目標分頁 ${a1} 不存在`;
      else {
        goPage(btn);
        const saved = uncollapse(btn);
        const q = btn.closest(Q_SEL);
        if (q && !seen(btn)) {
          const head = headOf(q), ans = answerOf(q, head);
          saved.push([q, q.className], ...ans.map(e => [e, e.className]));
          if (head) click(head);
          if (!seen(btn)) { q.classList.add('open'); ans.forEach(e => e.classList.add('show', 'open')); }   // 題目開合已由 IX-01 判定，這裡強制展開
        }
        if (!seen(btn)) err = '按鈕不可見（所在區塊無法展開）';
        else {
          const e = click(btn);
          if (e) err = '點擊失敗：' + e;
          else {
            const ok = () => { const a = activePages(); return a.length === 1 && a[0] === want; };
            if (!ok()) await sleep(400);
            const act = activePages();
            if (!ok()) err = `點擊後顯示 ${act.map(p => '#' + p.id).join('、') || '無分頁'}，應為 #${want.id}`;
            else if (target && !want.contains(target)) err = `目標 #${target.id} 不在 #${want.id}`;
          }
        }
        restore(saved);
      }
    }
    if (err) hit('IX-04', key, `${kind} ${key}：${err}`);
  }
  await sleep(500);   // 讓 goToChart 的 setTimeout（捲動／閃爍）跑完
  if (pages[0]) try { switchPage(pages[0]); } catch (e) { /* 已回報 */ }

  // 統計（--json／--summary）
  const rs = getComputedStyle(document.documentElement);
  const cssHex = s => { const cx2 = document.createElement('canvas').getContext('2d'); cx2.fillStyle = '#000'; cx2.fillStyle = s; return String(cx2.fillStyle).toLowerCase(); };
  const fam = sel => { const el = document.querySelector(sel); return el ? getComputedStyle(el).fontFamily.split(',')[0].replace(/["']/g, '').trim() : ''; };
  out.stats = {
    accent: rs.getPropertyValue('--accent').trim() ? cssHex(rs.getPropertyValue('--accent').trim()) : '',
    bg: cssHex(rs.getPropertyValue('--bg').trim() || getComputedStyle(document.body).backgroundColor),
    fonts: { head: fam('h1, .header-title, h2'), body: fam('body'), mono: fam('.kpi-value') },
    trapNames: nameCount,
  };
  const nTrain = document.querySelectorAll('.training-item, .train-item').length;
  Object.assign(out.info, { pages: pages.length, charts: cvs.length - noChart.length, canvas: cvs.length, qa, train: nTrain, trap, fia, typed, typedAns, title: document.title });
  return out;
};

/**
 * 3.3 版面：在目前 viewport 寬度下把定義側板切到 wantOpen，逐頁量水平溢出與 .kpi-value 截斷。
 * 回傳 { hits:[{rule,key,label}] } 或 { skip }。transition 已在 PAGE_AUDIT 關閉（這裡再保險一次）。
 */
const LAYOUT_AUDIT = async (width, wantOpen, waitMs) => {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  if (!document.getElementById('__audit_no_anim')) {
    const s = document.createElement('style');
    s.id = '__audit_no_anim';
    s.textContent = '*,*::before,*::after{transition:none!important;animation:none!important}';
    document.head.appendChild(s);
  }
  const btn = document.querySelector('#defToggleBtn, #defToggle, .def-toggle-btn');
  const panel = document.querySelector('#def-panel-outer, .def-panel');
  const pw = () => (panel ? panel.getBoundingClientRect().width : 0);
  const state = wantOpen ? '側板開' : '側板關';
  if (btn && panel && (pw() > 40) !== wantOpen) btn.click();
  if (wantOpen && pw() <= 40) return { skip: `${width}/${state}：無法開啟定義側板` };
  const pageEls = [...document.querySelectorAll('.page')];
  const pages = [...new Set([...document.querySelectorAll('[onclick*="switchPage"]')]
    .map(t => (t.getAttribute('onclick').match(/switchPage\(\s*['"]([^'"]+)['"]/) || [])[1]).filter(Boolean))];
  const pageOf = k => pageEls.find(el => el.id === k || el.id === 'page-' + k || el.id === 'p-' + k || el.id.endsWith('-' + k));
  const desc = el => el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (el.classList.length ? '.' + [...el.classList].slice(0, 2).join('.') : '');
  const hits = [];
  for (const k of pages) {
    try { switchPage(k); } catch (e) { continue; }
    await sleep(waitMs);
    const pg = pageOf(k);
    const key = `${width}/${state}/${pg ? pg.id : k}`;
    const de = document.documentElement;
    const over = () => Math.max(de.scrollWidth - de.clientWidth, pg ? pg.scrollWidth - pg.clientWidth : 0);
    if (over() > 1) await sleep(400);   // 可能是 canvas 尚未隨新寬度重算，複驗
    const ov = over();
    if (ov > 1) {
      const cw = de.clientWidth;
      const culprit = [...(pg || document.body).querySelectorAll('*')].find(el => {
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.right > cw + 1 && el.parentElement && el.parentElement.getBoundingClientRect().right <= cw + 1;
      });
      hits.push({ rule: 'LY-01', key, label: `${key} 溢出 ${ov}px${culprit ? `（${desc(culprit)} 右緣 ${Math.round(culprit.getBoundingClientRect().right)}px > ${cw}px）` : ''}` });
    }
    for (const el of (pg || document).querySelectorAll('.kpi-value')) {
      if (el.getBoundingClientRect().width < 1) continue;
      if (el.scrollWidth > el.clientWidth + 1) {
        const t = el.textContent.trim().slice(0, 14);
        hits.push({ rule: 'LY-02', key: `${key}/${t}`, label: `${key}「${t}」scrollWidth ${el.scrollWidth} > ${el.clientWidth}` });
      }
    }
  }
  return { hits };
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
    res.info.palMin = { normal: +d.minNormal.normal.toFixed(1), normalPair: d.minNormal.key, cvd: +d.minCvd.cvd.toFixed(1), cvdPair: d.minCvd.key, cvdType: d.minCvd.cvdType };
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
  res.ruleHits = {};   // --json：各規則 fail／warn／exempt 命中數
  for (const [rule, list] of Object.entries(hits)) {
    const { sev, desc } = RULES[rule];
    const live = { fail: [], warn: [] };
    const cnt = res.ruleHits[rule] = { fail: 0, warn: 0, exempt: 0 };
    for (const h of list) {
      const ex = EXEMPTIONS.find(e => e.file === name && e.rule === rule && (!e.items || e.items.includes(h.key)));
      const reason = ex ? ex.reason : h.auto;   // h.auto＝頁面內自動豁免（CH-01 截斷軸教學陷阱）
      if (reason) { res.exempt.push(`${rule} ${h.label}：${reason}`); cnt.exempt++; }
      else { live[h.sev || sev].push(h.label); cnt[h.sev || sev]++; }
    }
    for (const lv of ['fail', 'warn']) {
      const ls = live[lv];
      if (!ls.length) continue;
      const unit = rule.startsWith('QA-') ? '題' : rule.startsWith('CH-') ? '圖' : '項';
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
    if (r.exceptionDetails) throw new Error('audit script error: ' + (r.exceptionDetails.exception && r.exceptionDetails.exception.description || r.exceptionDetails.text));
    const res = r.result.value;
    // 3.3 版面：寬度矩陣 × 側板開關（Chart.js 未載入時 PAGE_AUDIT 已提早結束，跳過）
    if (res.info.canvas != null) {
      for (const width of LY_WIDTHS) {
        await cdp.send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: false }, sessionId);
        await new Promise(ok => setTimeout(ok, 300));
        for (const open of [false, true]) {
          const ly = await cdp.send('Runtime.evaluate', {
            expression: `(${LAYOUT_AUDIT.toString()})(${width}, ${open}, ${LY_WAIT_MS})`, awaitPromise: true, returnByValue: true,
          }, sessionId);
          if (ly.exceptionDetails) { res.fail.push(`LY 版面檢查執行錯誤（${width}）：` + ly.exceptionDetails.text); continue; }
          const v = ly.result.value;
          if (v.skip) res.warn.push('LY ' + v.skip);
          for (const h of v.hits || []) (res.qaHits[h.rule] = res.qaHits[h.rule] || []).push({ key: h.key, label: h.label });
        }
      }
      await cdp.send('Emulation.clearDeviceMetricsOverride', {}, sessionId);
    }
    if (errors.length) res.fail.unshift('Uncaught：' + [...new Set(errors)].slice(0, 3).join(' | '));
    const stem = basename(file, '.html').replace(/訓練儀表板教材$/, '');
    const title = res.info.title || '';
    if (!title.replace(/\s+/g, '_').includes(stem.replace(/_$/, '')))
      res.warn.push(`<title>「${title}」與檔名不一致`);
    applyRules(res, file);
    return res;
  } finally {
    cdp.off(onEvt);
    await cdp.send('Target.closeTarget', { targetId }).catch(() => {});
  }
}

/** 解析 CLI：--json <path>、--summary，其餘為檔案。 */
function parseArgs(argv) {
  const opt = { files: [], json: null, summary: false };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--json') {
      opt.json = argv[++i];
      if (!opt.json || opt.json.startsWith('--')) { console.error('--json 需要輸出路徑'); process.exit(2); }
    } else if (argv[i] === '--summary') opt.summary = true;
    else opt.files.push(argv[i]);
  }
  return opt;
}

/** 每份統計（--json 輸出與 --summary 的唯一來源）。 */
function statsOf(file, status, res) {
  const s = res.info || {};
  return {
    file: basename(file), status,
    pages: s.pages ?? null, charts: s.charts ?? null, canvas: s.canvas ?? null,
    qa: s.qa ?? null, train: s.train ?? null, questions: s.qa == null ? null : s.qa + (s.train || 0),
    typedHead: s.typed ?? null, typedAnswer: s.typedAns ?? null,
    trap: s.trap ?? null, fia: s.fia ?? null, assertN: s.assertN ?? null, assertMode: s.assertMode ?? null,
    minDeltaE: s.palMin || null,
    root: res.stats ? { accent: res.stats.accent, bg: res.stats.bg, fonts: res.stats.fonts } : null,
    trapNames: res.stats ? res.stats.trapNames : {},
    rules: res.ruleHits || {},
    failCount: res.fail.length, warnCount: res.warn.length, exemptCount: (res.exempt || []).length,
  };
}

/** --summary：跨份報表。 */
function printSummary(all) {
  const short = f => f.replace(/_訓練儀表板教材\.html$|\.html$/, '').split('_')[0];
  const pad = (v, n) => String(v ?? '-').padStart(n);
  const padW = (s, n) => s + ' '.repeat(Math.max(1, n - [...s].reduce((w, ch) => w + (/[⺀-￯]/.test(ch) ? 2 : 1), 0)));   // 全形算 2 欄
  console.log('\n══ 跨份報表（--summary）══');
  console.log(padW('份', 14) + '  分頁  圖表   QA 訓練  題數 trap  FIA assert  ΔE正常  ΔE色盲  FAIL WARN 豁免');
  for (const s of all) {
    console.log(padW(short(s.file), 14) + `${pad(s.pages, 5)}${pad(s.charts, 6)}${pad(s.qa, 5)}${pad(s.train, 5)}${pad(s.questions, 6)}${pad(s.trap, 5)}${pad(s.fia, 5)}${pad(s.assertN, 7)}`
      + `${pad(s.minDeltaE && s.minDeltaE.normal, 8)}${pad(s.minDeltaE && s.minDeltaE.cvd, 8)}${pad(s.failCount, 6)}${pad(s.warnCount, 5)}${pad(s.exemptCount, 5)}`);
  }
  const groups = (label, fn) => {
    const m = new Map();
    for (const s of all) { const k = s.root && fn(s.root); if (k) (m.get(k) || m.set(k, []).get(k)).push(short(s.file)); }
    const dup = [...m].filter(([, v]) => v.length > 1);
    console.log(`\n:root ${label} 重複：` + (dup.length ? '' : '無'));
    dup.forEach(([k, v]) => console.log(`  ${k}：${v.join('、')}`));
  };
  groups('accent', r => r.accent);
  groups('bg', r => r.bg);
  groups('字型組合（標題／正文／數字）', r => [r.fonts.head, r.fonts.body, r.fonts.mono].join(' / '));
  groups('accent＋bg＋字型', r => [r.accent, r.bg, r.fonts.head, r.fonts.body, r.fonts.mono].join(' | '));
  const freq = new Map();
  for (const s of all) for (const [n, c] of Object.entries(s.trapNames || {})) {
    const e = freq.get(n) || freq.set(n, { total: 0, files: [] }).get(n);
    e.total += c; e.files.push(short(s.file) + (c > 1 ? `×${c}` : ''));
  }
  console.log('\n陷阱名稱頻率（data-trap，跨份；依出現份數→總次數排序）：');
  [...freq].sort((a, b) => b[1].files.length - a[1].files.length || b[1].total - a[1].total || a[0].localeCompare(b[0]))
    .forEach(([n, e]) => console.log(`  ${padW(n, 18)}${String(e.total).padStart(3)} 次／${e.files.length} 份：${e.files.join('、')}`));
}

async function main() {
  const opt = parseArgs(process.argv.slice(2));
  const files = listTargets(opt.files);
  const exe = findBrowser();
  if (!exe) { console.error('找不到 Chromium/Chrome/Edge，請設定 CHROME_PATH'); process.exit(2); }
  const t0 = Date.now();
  const server = await startServer(files);
  const { port } = server.address();
  const { proc, wsUrl, profile } = await launchBrowser(exe);
  const cdp = await connect(wsUrl);
  let failed = 0;
  const all = [];
  try {
    for (const [i, file] of files.entries()) {
      const name = basename(file);
      let res;
      try { res = await auditOne(cdp, `http://127.0.0.1:${port}/${i}/${encodeURIComponent(name)}`, file); }
      catch (e) { res = { fail: [e.message], warn: [], info: {} }; }
      const status = res.fail.length ? 'FAIL' : res.warn.length ? 'WARN' : 'PASS';
      if (res.fail.length) failed++;
      all.push(statsOf(file, status, res));
      const s = res.info;
      console.log(`[${status}] ${name}` + (s.canvas != null
        ? `  (分頁 ${s.pages}｜圖表 ${s.charts}/${s.canvas}｜QA ${s.qa}${s.train ? `＋訓練 ${s.train}` : ''}（標題型 ${s.typed}${s.typedAns ? `，答案判 A ${s.typedAns}` : ''}）｜trap ${s.trap}｜FIA ${s.fia}｜assert ${s.assertN ?? '?'} 條・${s.assertMode ?? '-'}${s.pal ? '｜' + s.pal : ''})` : ''));
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
  if (opt.summary) printSummary(all);
  if (opt.json) {
    writeFileSync(resolve(opt.json), JSON.stringify({ generated: new Date().toISOString(), seconds: Math.round((Date.now() - t0) / 1000), files: all }, null, 2) + '\n');
    console.log(`\nJSON 統計已寫入 ${resolve(opt.json)}`);
  }
  console.log(`\n${files.length - failed}/${files.length} 份無 FAIL（${Math.round((Date.now() - t0) / 1000)} 秒）`);
  process.exit(failed ? 1 : 0);
}

main().catch(e => { console.error(e); process.exit(2); });
