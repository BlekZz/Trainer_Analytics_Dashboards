/**
 * palette_lib.mjs — 配色計算單一來源（零依賴 ESM）。audit-dashboards.mjs（PAL-01／02）與 gen_palette.mjs 共用。
 *
 * 公式來源：Ottosson 2020 OKLab／OKLCH、CIE 15 sRGB→Lab D65、Sharma et al. 2005 CIEDE2000、
 *   Machado, Oliveira & Fernandes 2009（CVD 模擬，severity 1.0，作用於線性 RGB）、WCAG 2.x 相對亮度與對比。
 * 判定用 ΔE＝OKLab 歐氏距離 ×100（B.9-1 門檻的原始單位；校準見 dev/tech-notes.md #27）。
 * 色彩表示：sRGB 0–255 陣列 [r,g,b]；線性 RGB 0–1 陣列；OKLab [L,a,b]（L 0–1）；OKLCH [L,C,h°]。
 */

/** B.9-1 門檻（OKLab×100）：正常視力 <15 FAIL；色盲 <6 FAIL、6–8 WARN。 */
export const PAL_NORMAL_MIN = 15, PAL_CVD_FAIL = 6, PAL_CVD_WARN = 8;
/** 非文字圖形元素對背景的 WCAG 最低對比（WCAG 2.1 SC 1.4.11）。 */
export const CONTRAST_MIN = 3;
/** c() 的五個類別色 key（gray 為中性色不列入）。 */
export const PAL_KEYS = ['blue', 'teal', 'orange', 'purple', 'red'];

// ── sRGB ↔ 線性 ──
/** sRGB 0–255 單通道 → 線性 0–1。 */
export const srgbToLin = v => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
/** 線性 0–1 單通道 → sRGB 0–255（不四捨五入、不夾值）。 */
export const linToSrgb = v => 255 * (v <= 0.0031308 ? 12.92 * v : 1.055 * Math.sign(v) * Math.abs(v) ** (1 / 2.4) - 0.055);

/** '#RRGGBB'／'#RGB'（不分大小寫，可省 #）→ [r,g,b] 0–255。不合法回傳 null。 */
export function hexToRgb(hex) {
  let h = String(hex).trim().replace(/^#/, '');
  if (/^[0-9a-f]{3}$/i.test(h)) h = h.split('').map(x => x + x).join('');
  if (!/^[0-9a-f]{6}$/i.test(h)) return null;
  return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16));
}
/** [r,g,b] 0–255 → '#RRGGBB'（四捨五入、大寫）。 */
export const toHex = rgb => '#' + rgb.map(v => Math.round(v).toString(16).padStart(2, '0')).join('').toUpperCase();
/** fg [r,g,b,a] 疊在 bg [r,g,b] 上的不透明 sRGB。 */
export const composite = ([r, g, b, a], bg) => [r, g, b].map((v, i) => v * a + bg[i] * (1 - a));

// ── CIELAB（僅 CIEDE2000 參考值用）──
export function linToLab([r, g, b]) {
  const X = (0.4124564 * r + 0.3575761 * g + 0.1804375 * b) / 0.95047;
  const Y = 0.2126729 * r + 0.7151522 * g + 0.0721750 * b;
  const Z = (0.0193339 * r + 0.1191920 * g + 0.9503041 * b) / 1.08883;
  const f = t => t > 216 / 24389 ? Math.cbrt(t) : (24389 / 27 * t + 16) / 116;
  return [116 * f(Y) - 16, 500 * (f(X) - f(Y)), 200 * (f(Y) - f(Z))];
}

// ── OKLab／OKLCH ──
/** 線性 sRGB → OKLab（Ottosson 2020）。 */
export function linToOklab([r, g, b]) {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s];
}
/** OKLab → 線性 sRGB（可能超出 0–1＝色域外）。 */
export function oklabToLin([L, a, b]) {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.2914855480 * b) ** 3;
  return [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s];
}
export const oklabToOklch = ([L, a, b]) => [L, Math.hypot(a, b), (Math.atan2(b, a) * 180 / Math.PI + 360) % 360];
export const oklchToOklab = ([L, C, h]) => [L, C * Math.cos(h * Math.PI / 180), C * Math.sin(h * Math.PI / 180)];
/** sRGB 0–255 → OKLCH。 */
export const rgbToOklch = rgb => oklabToOklch(linToOklab(rgb.map(srgbToLin)));

const EPS = 1e-6;
/** 線性 RGB 是否在 sRGB 色域內。 */
export const inGamut = lin => lin.every(v => v >= -EPS && v <= 1 + EPS);
/**
 * OKLCH → sRGB 0–255，色域外時保持 L、h 不變、二分法降 C 到邊界（CSS Color 4 的 chroma reduction 簡化版）。
 * 回傳 { rgb, clipped, C }（C＝實際採用的彩度）。
 */
export function oklchToRgbClipped([L, C, h]) {
  const lin = c => oklabToLin(oklchToOklab([L, c, h]));
  if (inGamut(lin(C))) return { rgb: lin(C).map(v => linToSrgb(Math.min(1, Math.max(0, v)))), clipped: false, C };
  let lo = 0, hi = C;
  for (let i = 0; i < 30; i++) { const mid = (lo + hi) / 2; if (inGamut(lin(mid))) lo = mid; else hi = mid; }
  return { rgb: lin(lo).map(v => linToSrgb(Math.min(1, Math.max(0, v)))), clipped: true, C: lo };
}

// ── ΔE ──
/** 判定用 ΔE：OKLab 歐氏距離 ×100（輸入線性 RGB）。 */
export const deltaEOk = (x, y) => { const p = linToOklab(x), q = linToOklab(y); return 100 * Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]); };
/** 參考用 CIEDE2000（輸入 CIELAB）。 */
export function deltaE2000([L1, a1, b1], [L2, a2, b2]) {
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

// ── 色盲模擬 ──
/** Machado, Oliveira & Fernandes (2009) severity 1.0，作用於線性 RGB。 */
export const CVD = {
  protan: [[0.152286, 1.052583, -0.204868], [0.114503, 0.786281, 0.099216], [-0.003882, -0.048116, 1.051998]],
  deutan: [[0.367322, 0.860646, -0.227968], [0.280085, 0.672501, 0.047413], [-0.011820, 0.042940, 0.968881]],
};
/** 線性 RGB 經 CVD 矩陣模擬，結果夾到 [0,1]。 */
export const simulateCvd = (lin, m) => m.map(row => row[0] * lin[0] + row[1] * lin[1] + row[2] * lin[2]).map(v => Math.min(1, Math.max(0, v)));

// ── WCAG ──
/** WCAG 相對亮度（輸入 sRGB 0–255；線性化門檻用 0.04045，與 0.03928 的差異對 8-bit 色值無影響）。 */
export const relLuminance = rgb => { const [r, g, b] = rgb.map(srgbToLin); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
/** WCAG 對比 (L1+0.05)/(L2+0.05)，1–21。 */
export const contrast = (x, y) => { const a = relLuminance(x), b = relLuminance(y); return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05); };

// ── 色組評分 ──
/**
 * 類別色兩兩比較（全部色對，不只相鄰）。colors＝{key:[r,g,b,a]}，bg＝[r,g,b]。
 * 回傳 { pairs:[{key, normal, protan, deutan, cvd, cvdType, de00, de00cvd}], minNormal, minCvd, hex }。
 * 判定值 normal／protan／deutan／cvd 為 OKLab ΔE×100；de00／de00cvd 為 CIEDE2000 參考值。
 * 色盲：兩色先各自經同一 CVD 矩陣模擬（線性 RGB，結果夾到 [0,1]），再算距離。
 */
export function paletteDistances(colors, bg) {
  const keys = Object.keys(colors);
  const solid = Object.fromEntries(keys.map(k => [k, composite(colors[k], bg)]));
  const lin = k => solid[k].map(srgbToLin);
  const sim = (k, m) => simulateCvd(lin(k), m);
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
 * 以 hex 色組評分（gen_palette 與基準組共用）：{key:'#hex'}＋背景 hex → paletteDistances 結果再加
 * contrast（各色對背景）、verdict（'PASS'｜'WARN'｜'FAIL'，與 audit PAL-01／02 判定一致；另檢查對比 ≥3）。
 */
export function scoreHexPalette(hexMap, bgHex) {
  const bg = hexToRgb(bgHex);
  const colors = Object.fromEntries(Object.entries(hexMap).map(([k, h]) => [k, [...hexToRgb(h), 1]]));
  const d = paletteDistances(colors, bg);
  const contrastMap = Object.fromEntries(Object.entries(hexMap).map(([k, h]) => [k, contrast(hexToRgb(h), bg)]));
  const fail = d.minNormal.normal < PAL_NORMAL_MIN || d.minCvd.cvd < PAL_CVD_FAIL;
  const lowContrast = Object.entries(contrastMap).filter(([, v]) => v < CONTRAST_MIN).map(([k]) => k);
  const verdict = fail ? 'FAIL' : (d.minCvd.cvd < PAL_CVD_WARN || lowContrast.length ? 'WARN' : 'PASS');
  return { ...d, contrast: contrastMap, lowContrast, verdict };
}
