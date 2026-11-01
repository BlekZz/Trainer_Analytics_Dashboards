#!/usr/bin/env node
/**
 * gen_palette.mjs — 語意類別色產生器（零依賴，Node 18+；計算全部來自 palette_lib.mjs，與 audit PAL-01／02 同一份）
 * 規則與使用時機的說明文件：Skill/module-D-diff.md D.11。
 *
 * 給定背景色，替 c() 的五個類別色 key（blue／teal／orange／purple／red）求一組：
 *   1. 色相落在語意色名區間內（OKLCH h，見 FAMILIES；色名不變＝Sprint 總原則 2），明度落在色族範圍內（FAMILY_L，防「棕」「粉」）
 *   2. 彩度 C ≥ 0.09（低於此偏灰，色名開始失效）
 *   3. 對背景 WCAG 對比 ≥ 3:1（非文字圖形元素，SC 1.4.11）
 *   4. 10 色對正常視力 ΔE ≥ 15（PAL-01 門檻）
 *   5. 「10 色對 × 正常／protan／deutan」共 30 個 ΔE 的最小值 ≥ T＝min(t*, 12)，t*＝此最小值可達的上界（須 ≥ 6，≥ 8＝無 PAL-02 WARN）
 *   6. 滿足以上者取品質罰分最低（penalty()：色相離典型值、彩度偏低、明度離適讀帶、對比剛好卡線）
 * 明度階梯不另外硬寫：dichromacy 下混淆色對（blue/purple、orange/red、red/teal）只剩明度可分，
 *   門檻 T 會逼它們落在不同 L；輸出的 L 欄即為階梯，可直接解釋「為什麼這兩色一深一淺」。
 *
 * 演算法（決定性，無亂數）：
 *   a. 各色族格點取樣 OKLCH（L step 0.03、h step 4°、C 0.09–0.24 step 0.03＋該 L/h 的最大彩度點），轉 hex 後以 hex 重算
 *      （報告值＝audit 會算出的值），濾掉色域外與不符 1–3 者，依罰分排序
 *   b. 二分搜尋 t*：「是否存在 5 色，每色對正常 ≥15 且三視覺 ΔE 都 ≥ t」＝5 部圖 clique 可行性，bitset DFS
 *   c. 門檻 T 下 branch-and-bound 求罰分最低的一組；第 2 組起要求至少一個非 anchor 色與先前每組的同 key 色差 ΔE ≥ 8
 *   d. 每組以細格點（L 0.005、C 0.005、h 1°）座標下降微調降低罰分（限制與多樣性照舊）
 *
 * 用法：
 *   node dev/script/gen_palette.mjs --bg '#0d1117'                       # top 3 候選＋完整驗證表
 *   node dev/script/gen_palette.mjs --bg '#0d1117' --anchor blue=#3b82f6  # 固定某 key（逗號分隔多個；保留品牌色／只換撞色的那幾色）
 *   node dev/script/gen_palette.mjs --bg '#ECFDF5' --map blue=green,teal=blue  # key→色族重新對應（該 preset 的 --accent 是綠）
 *   node dev/script/gen_palette.mjs --bg '#0d1117' --top 5 --json        # JSON 輸出
 *   node dev/script/gen_palette.mjs --bg '#0d1117' --maxmin              # 純 max-min（門檻 0.98·t*，再比罰分）
 *   node dev/script/gen_palette.mjs --bg '#0d1117' --check blue=#3b82f6,teal=#2aab85,orange=#d4870a,purple=#7c4dff,red=#d43a2f
 *                                                                        # 只驗證一組現有色（與 audit PAL 同算法）
 *   node dev/script/gen_palette.mjs --benchmark [--bg <hex>]             # Okabe-Ito／Paul Tol bright 子集評分（sanity check）
 * 色族：red 15–38｜orange 48–75｜gold 75–100｜green 142–190｜cyan 195–225｜blue 228–268｜purple 282–328（OKLCH h°）
 *   預設對應 blue→blue、teal→green、orange→orange、purple→purple、red→red；anchor 不受區間限制（但會標示是否落在區間內）。
 * Exit code：0 = 首選候選無 PAL FAIL／--check 無 FAIL／--benchmark；1 = 無解或 --check FAIL；2 = 參數錯誤
 */
import {
  PAL_KEYS, PAL_NORMAL_MIN, PAL_CVD_FAIL, PAL_CVD_WARN, CONTRAST_MIN, CVD,
  hexToRgb, toHex, srgbToLin, linToOklab, rgbToOklch, oklchToRgbClipped, simulateCvd, contrast, scoreHexPalette,
} from './palette_lib.mjs';

/**
 * 色族色相區間 [lo, hi, 典型色相 core, 色名]（OKLCH h°）。以既有 preset／Tailwind 色實測 h 校準：
 * - red 15–38（core 27）：#EF4444 25、#DC2626 27、#D43A2F 29；>40 開始讀成橘紅（Okabe-Ito vermillion 47.5 即屬此），<15 偏洋紅。
 * - orange 48–75（core 62）：#D97706 58、#D4870A 69、#F59E0B 70；>75 偏琥珀／金黃（Okabe-Ito orange 76.8 已在邊外）。
 * - gold 75–100（core 88）：讀成「金／黃」。只透過 --map 使用（P7 金色正向色）。註：#A16207 實測 h 66，其實落在 orange。
 * - green 142–190（core 165）：#22C55E 150、#059669 163、#2AAB85 168、#0D9488 185（綠／青綠／teal 都算）；>190 讀成青。
 * - cyan 195–225（core 210）：#22D3EE 211（青／天藍）。只透過 --map 或 anchor 使用。
 * - blue 228–268（core 252）：#0369A1 243、#0284C7 242、#3B82F6 260、#2563EB 263。
 * - purple 282–328（core 298）：#7C3AED 293、#8B5CF6 293、#A78BFA 294；>330 偏洋紅／粉（Okabe-Ito reddish purple 346）。
 * - 268–282 刻意空出：靛（#6366F1 277）介於藍紫之間，色名會被讀成任一邊，與 blue/purple 兩方都易混。
 */
export const FAMILIES = {
  red: [15, 38, 27, '紅'], orange: [48, 75, 62, '橘'], gold: [75, 100, 88, '金/黃'], green: [142, 190, 165, '綠/青綠'],
  cyan: [195, 225, 210, '青/天藍'], blue: [228, 268, 252, '藍'], purple: [282, 328, 298, '紫'],
};
/**
 * 色族的明度上下限（OKLCH L；未列者用 L_RANGE）。色名不只看色相：同一色相，暗橘讀成「棕」、亮紅讀成「粉／鮭魚」、
 * 暗金讀成「橄欖／土黃」。實測：淺底只放開 orange 時，純 max-min／罰分解會選 #7B3701（L 0.42，棕）；
 * P7 放開 red 時選 #F99998（L 0.78，粉）——兩者都會讓內文「橘色」「紅色」失準，故設限。
 */
const FAMILY_L = { orange: [0.62, 0.88], gold: [0.70, 0.92], red: [0.45, 0.70] };
const lRange = fam => FAMILY_L[fam] || L_RANGE;
const DEFAULT_MAP = { blue: 'blue', teal: 'green', orange: 'orange', purple: 'purple', red: 'red' };
const C_MIN = 0.09, L_RANGE = [0.42, 0.88], L_STEP = 0.03, H_STEP = 4, C_LIST = [0.09, 0.12, 0.15, 0.18, 0.21, 0.24, 0.37];
/**
 * 分離度目標：30 個 ΔE 的最小值做到 TARGET_MIN（＝PAL-02 WARN 線 8 的 1.5 倍）後，不再追求更大，改挑「品質罰分」最低者。
 * 理由：純 max-min 會把色推到限制邊緣（實測 P2 背景：teal 被推到 L 0.94 近白、blue 壓在對比 3.00、色相貼區間邊），
 * 分離度遠超門檻卻不好看也不像該色名。--maxmin 可改回純 max-min（t* 的 98% 為門檻，再比品質）。
 */
const TARGET_MIN = 12;
const DIVERSITY_MIN = 8;   // 第 2 組起：至少有一個非 anchor 色與先前每組的同 key 色相差 ΔE ≥ 8

// ── 基準組（sanity check）──
const BENCHMARKS = {
  'Okabe-Ito（blue=#0072B2）': { blue: '#0072B2', teal: '#009E73', orange: '#E69F00', purple: '#CC79A7', red: '#D55E00' },
  'Okabe-Ito（blue=#56B4E9 sky）': { blue: '#56B4E9', teal: '#009E73', orange: '#E69F00', purple: '#CC79A7', red: '#D55E00' },
  'Paul Tol bright（orange=yellow #CCBB44）': { blue: '#4477AA', teal: '#228833', orange: '#CCBB44', purple: '#AA3377', red: '#EE6677' },
};

// ── 參數 ──
function parseArgs(argv) {
  const o = { anchors: {}, map: { ...DEFAULT_MAP }, top: 3, json: false, bg: null, check: null, benchmark: false, maxmin: false };
  const kv = (s, f) => s.split(',').filter(Boolean).forEach(p => { const [k, v] = p.split('='); f(k.trim(), (v || '').trim()); });
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i], nx = () => { if (i + 1 >= argv.length) die(`${a} 缺值`); return argv[++i]; };
    if (a === '--bg') o.bg = nx();
    else if (a === '--anchor') kv(nx(), (k, v) => { o.anchors[k] = v; });
    else if (a === '--map') kv(nx(), (k, v) => { o.map[k] = v; });
    else if (a === '--check') { o.check = {}; kv(nx(), (k, v) => { o.check[k] = v; }); }
    else if (a === '--top') o.top = Math.max(1, parseInt(nx(), 10) || 3);
    else if (a === '--json') o.json = true;
    else if (a === '--benchmark') o.benchmark = true;
    else if (a === '--maxmin') o.maxmin = true;
    else if (a === '-h' || a === '--help') { console.log('用法見 dev/script/gen_palette.mjs 檔頭註解'); process.exit(0); }
    else die(`未知參數 ${a}`);
  }
  for (const [k, v] of Object.entries({ ...o.anchors, ...(o.check || {}) })) {
    if (!PAL_KEYS.includes(k)) die(`未知 key ${k}（可用：${PAL_KEYS.join('/')}）`);
    if (!hexToRgb(v)) die(`${k} 的色值不是 hex：${v}`);
  }
  for (const [k, f] of Object.entries(o.map)) {
    if (!PAL_KEYS.includes(k)) die(`--map 未知 key ${k}`);
    if (!FAMILIES[f]) die(`--map 未知色族 ${f}（可用：${Object.keys(FAMILIES).join('/')}）`);
  }
  if (o.check && PAL_KEYS.some(k => !o.check[k])) die(`--check 需要五個 key：${PAL_KEYS.join(',')}`);
  if (!o.benchmark && !o.bg) die('需要 --bg <hex>');
  if (o.bg && !hexToRgb(o.bg)) die(`--bg 不是 hex：${o.bg}`);
  return o;
}
function die(msg) { console.error(`✗ ${msg}`); process.exit(2); }

// ── 候選色 ──
const inWindow = (h, [lo, hi]) => h >= lo && h <= hi;
/** 一個 hex 的預算資料：OKLab（正常／protan／deutan）、OKLCH、對比。 */
function colorInfo(hex, bgRgb) {
  const rgb = hexToRgb(hex), lin = rgb.map(srgbToLin);
  return { hex: toHex(rgb), rgb, lch: rgbToOklch(rgb), contrast: contrast(rgb, bgRgb), pen: 0,
    lab: [linToOklab(lin), linToOklab(simulateCvd(lin, CVD.protan)), linToOklab(simulateCvd(lin, CVD.deutan))] };
}
/** 兩色在三種視覺下的 ΔE（OKLab×100）。 */
const dist3 = (x, y) => x.lab.map((p, i) => { const q = y.lab[i]; return 100 * Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]); });
const okColor = (ci, fam) => ci.contrast >= CONTRAST_MIN && ci.lch[1] >= C_MIN && ci.lch[0] >= lRange(fam)[0] && ci.lch[0] <= lRange(fam)[1]
  && inWindow(ci.lch[2], FAMILIES[fam]);
/**
 * 品質罰分（越低越好，單色可加總）：色相離該色族典型色相越遠、彩度 <0.13（偏灰）、明度離背景適讀帶
 * （深底 0.72／淺底 0.58）越遠、對比 <3.6（剛好卡 3:1 在實際螢幕上偏暗淡）各自平方懲罰。
 */
function penalty(ci, fam, bgDark) {
  const [lo, hi, core] = FAMILIES[fam], [L, C, h] = ci.lch, half = (hi - lo) / 2;
  return ((h - core) / half) ** 2 + (Math.max(0, 0.13 - C) / 0.04) ** 2 + ((L - (bgDark ? 0.72 : 0.58)) / 0.15) ** 2
    + (Math.max(0, 3.6 - ci.contrast) / 0.6) ** 2;
}

/** 色族格點取樣（決定性），依罰分排序（B&B 依此順序走，先找到的解就是好解）。 */
function sampleFamily(fam, bgRgb, bgDark) {
  const [hLo, hHi] = FAMILIES[fam], seen = new Map();
  for (let L = lRange(fam)[0]; L <= lRange(fam)[1] + 1e-9; L += L_STEP) for (let h = hLo; h <= hHi + 1e-9; h += H_STEP) for (const C of C_LIST) {
    const { rgb, clipped } = oklchToRgbClipped([L, C, h]);
    if (clipped && C !== C_LIST.at(-1)) continue;   // 最後一個＝最大彩度點（裁到色域邊界）
    const hex = toHex(rgb);
    if (seen.has(hex)) continue;
    const ci = colorInfo(hex, bgRgb);
    if (okColor(ci, fam)) { ci.pen = penalty(ci, fam, bgDark); seen.set(hex, ci); }
  }
  return [...seen.values()].sort((x, y) => x.pen - y.pen || (x.hex < y.hex ? -1 : 1));
}

// ── 最佳化 ──
/** 一組（key→colorInfo）的評分：30 個 ΔE 的最小值、正常視力最小值、罰分總和。 */
function evalSet(cs) {
  let min = Infinity, minN = Infinity, pen = 0;
  for (let i = 0; i < cs.length; i++) { pen += cs[i].pen; for (let j = i + 1; j < cs.length; j++) {
    const d = dist3(cs[i], cs[j]); min = Math.min(min, ...d); minN = Math.min(minN, d[0]);
  } }
  return { min, minN, pen };
}

/**
 * 主求解：cands[k]＝第 k 個 key 的候選（已依罰分排序）。
 * 1) 二分搜尋 t*＝「每色對正常 ≥15 且三視覺 ΔE 都 ≥ t」可行的最大 t（5 部圖 clique 可行性，bitset DFS）
 * 2) 門檻 T＝min(t*, TARGET_MIN)（--maxmin：0.98·t*），branch-and-bound 求罰分最低的 topN 組（彼此多樣，見 best）
 * 回傳 { tStar, T, sols:[{idx, pen}] }；PAL-01 本身不可行時 tStar=null、normalBest＝正常視力最小 ΔE 可達上界。
 */
function solve(cands, maxmin, topN) {
  const K = cands.length, n = cands.map(c => c.length), words = n.map(x => Math.ceil(x / 32));
  const pairMin = [], pairN = [];
  for (let i = 0; i < K; i++) { pairMin[i] = []; pairN[i] = []; for (let j = i + 1; j < K; j++) {
    const m = new Float32Array(n[i] * n[j]), nn = new Float32Array(n[i] * n[j]);
    for (let a = 0; a < n[i]; a++) for (let b = 0; b < n[j]; b++) { const d = dist3(cands[i][a], cands[j][b]); m[a * n[j] + b] = Math.min(d[0], d[1], d[2]); nn[a * n[j] + b] = d[0]; }
    pairMin[i][j] = m; pairN[i][j] = nn;
  } }
  const buildCompat = cond => {
    const comp = [];
    for (let i = 0; i < K; i++) { comp[i] = []; for (let j = i + 1; j < K; j++) {
      const arr = [], m = pairMin[i][j], nn = pairN[i][j];
      for (let a = 0; a < n[i]; a++) { const bs = new Uint32Array(words[j]);
        for (let b = 0; b < n[j]; b++) if (cond(m[a * n[j] + b], nn[a * n[j] + b])) bs[b >> 5] |= 1 << (b & 31);
        arr.push(bs); }
      comp[i][j] = arr;
    } }
    return comp;
  };
  const full = j => { const bs = new Uint32Array(words[j]); for (let b = 0; b < n[j]; b++) bs[b >> 5] |= 1 << (b & 31); return bs; };
  const firstBit = bs => { for (let w = 0; w < bs.length; w++) if (bs[w]) return (w << 5) + (31 - Math.clz32(bs[w] & -bs[w])); return -1; };
  /** DFS（候選依罰分排序，bitset 依索引走＝依罰分走）。keep>0 時做 B&B 保留罰分最低的 keep 組；否則找到 1 組即停。 */
  function search(comp, keep, init) {
    const out = [], pick = new Array(K);
    let worst = Infinity;   // 保留集合滿了之後的最大罰分（剪枝界）
    const push = (idx, pen) => {
      out.push({ idx, pen }); if (keep && out.length > keep) { out.sort((x, y) => x.pen - y.pen); out.length = keep; }
      if (keep && out.length === keep) worst = out[out.length - 1].pen;
    };
    function rec(level, allowed, pen) {
      if (!keep && out.length) return;
      if (level === K) { push(pick.slice(), pen); return; }
      let bound = pen; for (let j = level; j < K; j++) { const fb = firstBit(allowed[j]); if (fb < 0) return; bound += cands[j][fb].pen; }
      if (bound >= worst) return;
      const A = allowed[level];
      for (let w = 0; w < A.length; w++) { let bits = A[w]; while (bits) {
        const t = bits & -bits, b = (w << 5) + (31 - Math.clz32(t)); bits ^= t;
        const p2 = pen + cands[level][b].pen;
        if (p2 >= worst) return;   // 之後的候選罰分只會更高
        pick[level] = b;
        const next = allowed.slice(); let ok = true;
        for (let j = level + 1; j < K && ok; j++) {
          const src = comp[level][j][b], cur = allowed[j], nw = new Uint32Array(cur.length); let any = 0;
          for (let x = 0; x < cur.length; x++) { nw[x] = cur[x] & src[x]; any |= nw[x]; }
          if (!any) ok = false; next[j] = nw;
        }
        if (ok) rec(level + 1, next, p2);
        if (!keep && out.length) return;
      } }
    }
    rec(0, init || cands.map((_, j) => full(j)), 0);
    return out.sort((x, y) => x.pen - y.pen);
  }
  const feasible = t => search(buildCompat((m, nn) => m >= t && nn >= PAL_NORMAL_MIN), 0).length > 0;
  if (!feasible(0)) {
    let lo = 0, hi = PAL_NORMAL_MIN;
    for (let it = 0; it < 12; it++) { const mid = (lo + hi) / 2; if (search(buildCompat((m, nn) => nn >= mid), 0).length) lo = mid; else hi = mid; }
    return { tStar: null, normalBest: lo };
  }
  let lo = 0, hi = 60;
  for (let it = 0; it < 16; it++) { const mid = (lo + hi) / 2; if (feasible(mid)) lo = mid; else hi = mid; }
  const T = maxmin ? lo * 0.98 : Math.min(lo, TARGET_MIN);
  const comp = buildCompat((m, nn) => m >= T && nn >= PAL_NORMAL_MIN);
  /**
   * 第 1 組＝門檻 T 下罰分最低者（B&B keep=1）。之後每組：對每個非 anchor 的 key f，把 f 的候選限制為「與先前每組的 f 色
   * 正常 ΔE ≥ DIVERSITY_MIN」，各求一次最低罰分解，取其中最低者（多樣性限制落在單一色族上＝可在根節點遮罩，B&B 照常剪枝）。
   */
  const best = (fixedOut) => {
    let top = null;
    for (let f = 0; f < K; f++) {
      if (n[f] === 1) continue;
      const init = cands.map((_, j) => full(j));
      for (let b = 0; b < n[f]; b++) if (fixedOut.some(prev => dist3(cands[f][b], cands[f][prev[f]])[0] < DIVERSITY_MIN)) init[f][b >> 5] &= ~(1 << (b & 31));
      const r = search(comp, 1, init)[0];
      if (r && (!top || r.pen < top.pen)) top = r;
    }
    return top;
  };
  const sols = [], first = search(comp, 1)[0];
  if (first) sols.push(first);
  while (first && sols.length < topN) { const r = best(sols.map(x => x.idx)); if (!r) break; sols.push(r); }
  return { tStar: lo, T, sols };
}

/**
 * 座標下降微調：每次只動一色、細格點（L 0.005、C 0.005、h 1°），接受「罰分降低且門檻 T／PAL-01／色族限制照舊」的移動；anchor 不動。
 * others＝已定案的前幾組：微調不得把本組拉回與它們只差 <DIVERSITY_MIN（否則多組會收斂成同一解）。
 */
function refine(set, fams, anchored, bgRgb, bgDark, T, others = []) {
  let cur = set.slice(), score = evalSet(cur);
  const steps = [];
  for (const dL of [-0.005, 0, 0.005]) for (const dC of [-0.005, 0, 0.005]) for (const dh of [-1, 0, 1]) if (dL || dC || dh) steps.push([dL, dC, dh]);
  for (let iter = 0; iter < 300; iter++) {
    let best = null;
    for (let k = 0; k < cur.length; k++) {
      if (anchored[k]) continue;
      const [L, C, h] = cur[k].lch;
      for (const [dL, dC, dh] of steps) {
        const { rgb, clipped } = oklchToRgbClipped([L + dL, C + dC, h + dh]);
        if (clipped) continue;
        const ci = colorInfo(toHex(rgb), bgRgb);
        if (ci.hex === cur[k].hex || !okColor(ci, fams[k])) continue;
        ci.pen = penalty(ci, fams[k], bgDark);
        const trial = cur.slice(); trial[k] = ci;
        const s = evalSet(trial);
        if (s.minN < PAL_NORMAL_MIN || s.min < T - 1e-9 || s.pen >= score.pen - 1e-9) continue;
        if (!others.every(o => trial.some((c, i) => !anchored[i] && dist3(c, o[i])[0] >= DIVERSITY_MIN))) continue;
        if (!best || s.pen < best.s.pen) best = { trial, s };
      }
    }
    if (!best) break;
    cur = best.trial; score = best.s;
  }
  return cur;
}

// ── 輸出 ──
const f1 = x => x.toFixed(1);
function report(hexMap, bgHex, fams) {
  const s = scoreHexPalette(hexMap, bgHex), bgRgb = hexToRgb(bgHex);
  const colors = Object.fromEntries(Object.entries(hexMap).map(([k, h]) => {
    const [L, C, hh] = rgbToOklch(hexToRgb(h)), fam = fams?.[k];
    return [k, { hex: toHex(hexToRgb(h)), L: +L.toFixed(3), C: +C.toFixed(3), h: +hh.toFixed(1), contrast: +contrast(hexToRgb(h), bgRgb).toFixed(2),
      family: fam || null, inWindow: fam ? inWindow(hh, FAMILIES[fam]) : null }];
  }));
  const all = s.pairs.flatMap(p => [['normal', p.normal], ['protan', p.protan], ['deutan', p.deutan]].map(([v, d]) => ({ pair: p.key, vision: v, dE: d })));
  const bind = all.reduce((m, x) => (x.dE < m.dE ? x : m));
  const minContrast = Object.entries(colors).reduce((m, [k, c]) => (c.contrast < m.contrast ? { key: k, contrast: c.contrast } : m), { contrast: Infinity });
  return { bg: toHex(bgRgb), verdict: s.verdict, colors,
    minNormal: { pair: s.minNormal.key, dE: +f1(s.minNormal.normal) }, minCvd: { pair: s.minCvd.key, vision: s.minCvd.cvdType, dE: +f1(s.minCvd.cvd) },
    binding: { pair: bind.pair, vision: bind.vision, dE: +f1(bind.dE) }, minContrast,
    pairs: s.pairs.map(p => ({ pair: p.key, normal: +f1(p.normal), protan: +f1(p.protan), deutan: +f1(p.deutan) })) };
}
function printReport(r, title) {
  console.log(`\n${title}  背景 ${r.bg}  → ${r.verdict}`);
  console.log('  key     hex       L      C      h      對比   色族');
  for (const [k, c] of Object.entries(r.colors))
    console.log(`  ${k.padEnd(7)} ${c.hex}  ${c.L.toFixed(3)}  ${c.C.toFixed(3)}  ${f1(c.h).padStart(5)}  ${c.contrast.toFixed(2).padStart(5)}  ${c.family ? `${c.family}${c.inWindow ? '' : ' ⚠區間外'}` : '-'}`);
  console.log('  色對           正常  protan deutan');
  for (const p of r.pairs) {
    const mark = p.normal < PAL_NORMAL_MIN || Math.min(p.protan, p.deutan) < PAL_CVD_FAIL ? ' ✗' : Math.min(p.protan, p.deutan) < PAL_CVD_WARN ? ' ⚠' : '';
    console.log(`  ${p.pair.padEnd(14)} ${f1(p.normal).padStart(5)} ${f1(p.protan).padStart(6)} ${f1(p.deutan).padStart(6)}${mark}`);
  }
  console.log(`  綁定約束：最小 ΔE ${f1(r.binding.dE)}＝${r.binding.pair} ${r.binding.vision}｜正常最小 ${f1(r.minNormal.dE)}（${r.minNormal.pair}，門檻 ${PAL_NORMAL_MIN}）`
    + `｜色盲最小 ${f1(r.minCvd.dE)}（${r.minCvd.pair} ${r.minCvd.vision}，門檻 ${PAL_CVD_FAIL}/${PAL_CVD_WARN}）｜對比最小 ${r.minContrast.contrast.toFixed(2)}（${r.minContrast.key}，門檻 ${CONTRAST_MIN}）`);
}

function main() {
  const o = parseArgs(process.argv.slice(2));
  const out = {};
  if (o.benchmark) {
    out.benchmark = [];
    for (const bg of o.bg ? [o.bg] : ['#FFFFFF', '#0D1117']) for (const [name, m] of Object.entries(BENCHMARKS)) {
      const r = report(m, bg, DEFAULT_MAP); r.name = name; out.benchmark.push(r);
      if (!o.json) printReport(r, `[基準] ${name}`);
    }
    if (o.json) console.log(JSON.stringify(out, null, 2));
    return 0;
  }
  if (o.check) {
    const r = report(o.check, o.bg, o.map); out.check = r;
    if (o.json) console.log(JSON.stringify(out, null, 2)); else printReport(r, '[驗證]');
    return r.verdict === 'FAIL' ? 1 : 0;
  }
  const t0 = Date.now(), bgRgb = hexToRgb(o.bg), bgDark = rgbToOklch(bgRgb)[0] < 0.5;
  const keys = PAL_KEYS.slice(), fams = keys.map(k => o.map[k]), anchored = keys.map(k => !!o.anchors[k]);
  const cands = keys.map((k, i) => anchored[i] ? [colorInfo(o.anchors[k], bgRgb)] : sampleFamily(fams[i], bgRgb, bgDark));
  const empty = keys.filter((k, i) => !cands[i].length);
  out.params = { bg: toHex(bgRgb), anchors: o.anchors, map: o.map, maxmin: o.maxmin, candidates: Object.fromEntries(keys.map((k, i) => [k, cands[i].length])) };
  const anchorNotes = keys.filter((k, i) => anchored[i]).map(k => {
    const ci = cands[keys.indexOf(k)][0], fam = FAMILIES[o.map[k]];
    return `${k}=${ci.hex}（h ${f1(ci.lch[2])}${inWindow(ci.lch[2], fam) ? '' : `，⚠ 不在 ${o.map[k]} 區間 ${fam[0]}–${fam[1]}`}；對比 ${ci.contrast.toFixed(2)}${ci.contrast < CONTRAST_MIN ? ' ⚠ <3' : ''}）`;
  });
  if (empty.length) {
    out.infeasible = { constraint: 'hue-window+chroma+contrast', keys: empty,
      detail: `${empty.join('/')} 在色相區間＋C≥${C_MIN}＋色族明度範圍＋對比≥${CONTRAST_MIN} 下沒有任何候選色（背景太接近該色族可用的明度）` };
  } else {
    const res = solve(cands, o.maxmin, o.top);
    if (res.tStar === null) {
      out.infeasible = { constraint: 'PAL-01', detail: `正常視力 10 色對最小 ΔE 最多只能到 ${f1(res.normalBest)}（< ${PAL_NORMAL_MIN}）；換 anchor 或 --map` };
    } else {
      const picked = [];
      for (const { idx } of res.sols) picked.push(idx.map((b, i) => cands[i][b]));
      const done = [];
      for (const cs of picked) done.push(refine(cs, fams, anchored, bgRgb, bgDark, res.T, done.slice()));
      const finals = done.map(cs => ({ cs, s: evalSet(cs) }))
        .sort((a, b) => a.s.pen - b.s.pen);
      out.tStar = +f1(res.tStar); out.T = +f1(res.T);
      out.candidates = finals.map(f => ({ ...report(Object.fromEntries(keys.map((k, i) => [k, f.cs[i].hex])), o.bg, o.map), penalty: +f.s.pen.toFixed(2) }));
      if (res.tStar < PAL_CVD_FAIL) out.infeasible = { constraint: 'PAL-02', detail: `三視覺最小 ΔE 最多 ${f1(res.tStar)}（< ${PAL_CVD_FAIL}）；換 anchor 或 --map` };
    }
  }
  out.elapsedMs = Date.now() - t0;
  if (o.json) { console.log(JSON.stringify(out, null, 2)); }
  else {
    console.log(`背景 ${out.params.bg}（${bgDark ? '深' : '淺'}底）｜色族 ${keys.map((k, i) => `${k}→${fams[i]}`).join(' ')}｜候選數 ${keys.map((k, i) => `${k}:${cands[i].length}`).join(' ')}`);
    if (anchorNotes.length) console.log(`anchor：${anchorNotes.join('；')}`);
    if (out.tStar != null) console.log(`可達最小 ΔE 上界 t*＝${out.tStar}；採用門檻 T＝${out.T}（${o.maxmin ? '--maxmin：0.98·t*' : `min(t*, ${TARGET_MIN})`}），在 T 之上挑品質罰分最低者`);
    if (out.infeasible) console.log(`✗ 無解：卡在 ${out.infeasible.constraint} — ${out.infeasible.detail}`);
    (out.candidates || []).forEach((r, i) => printReport(r, `[候選 ${i + 1}｜罰分 ${r.penalty}]`));
    console.log(`\n（${out.elapsedMs} ms）`);
  }
  return out.infeasible || !out.candidates?.length || out.candidates[0].verdict === 'FAIL' ? 1 : 0;
}
process.exitCode = main();
