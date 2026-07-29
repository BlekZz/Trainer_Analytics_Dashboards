# 分析訓練儀表板 — 開發 Knowhow

> Global technotes pointers: `~/.claude/technotes/windows.md`、`~/.claude/technotes/git.md`、`~/.claude/technotes/claude-code.md`（單檔 HTML 按結構層拆 subagent call）（SSOT 在池，本檔不複製池內容）

開發過程中累積的非顯而易見技巧與決策。

---

## 1. 大型單檔 HTML 的 Token 限制拆分策略

**問題：** 生成 1,500+ 行的單檔 HTML 時，LLM 輸出 token 上限會在中途截斷。

**解法：** 按「HTML 結構層」而非「功能」拆成三次 subagent call：
- Part 1：`<head>` + CSS + P1 HTML（最重、含最多 CSS）
- Part 2：額外 CSS class + P2 + P3 HTML
- Part 3：完整 `<script>` 區塊（DATA + JS 邏輯）

每個 part 各自完整輸出，再由主 agent 用 Write tool 組合寫入。使用 `full-output-enforcement` agent type 可進一步防止各 part 內部截斷。

**注意：** Part 3 的 JS 不能依賴 Part 1/2 的 HTML 元素存在才能宣告變數，所有 `document.getElementById()` 只在 draw function 被呼叫時才執行，lazy init 天然防止這個問題。

〔已上行 → technotes/claude-code.md，2026-07-21〕

---

## 2. assertConsistency 的命名一致性

**問題：** 模組 A 規格用 `errors.push()`，實際生成的 assertConsistency 用 `errs.push()`，grep 驗證時會抓不到。

**解法：** 未來統一使用 `errors` 作為陣列名稱（與模組 A 規格一致）。

```javascript
// 標準寫法（與模組 A 一致）
const errors = [];
// ...
errors.push(`tier sum=${tierSum} ≠ 58320`);
if (errors.length === 0) {
  console.log('✓ All data consistency checks passed');
} else {
  console.error('⚠ Data consistency errors:', errors);
}
```

---

## 3. 跨陣列 assertConsistency Check 設計模式

**問題：** 傳統 assertion 只檢查「各陣列自己加總對不對」，無法捕捉兩個獨立陣列之間的業務邏輯矛盾。

**解法：** 在資料設計階段就確立「身份等式」，讓第 9 條 check 跨陣列驗證：

```javascript
// Check 9：高頻顧客（年12+次）的人數 === VIP 顧客人數
// 業務定義：VIP 就是年頻次 ≥12 次的顧客
const highFreq = DATA.frequency.counts[4] + DATA.frequency.counts[5]; // 年12-23 + 年24+
if (highFreq !== DATA.customer_tier.counts[2]) {
  errors.push(`high_freq=${highFreq} ≠ VIP count=${DATA.customer_tier.counts[2]}`);
}
```

這讓兩個看似獨立的資料結構透過業務定義互相鎖住，任何一邊的數字變動都會觸發 assertion 失敗。

---

## 4. 「逆直覺教學點」的資料設計方法

**問題：** VIP 顧客的 AOV（客單價）應設計成高還是低？

**決策：** 刻意設計成 VIP AOV（271）< 常客 AOV（303），理由：
- 高頻顧客因習慣性點餐，每次不一定點最貴的
- 年度 LTV（總消費）仍遠高於常客
- 製造 AOV vs LTV 的討論空間，訓練學員不要用單一指標評估顧客價值

**關鍵：** 逆直覺點必須同時出現在：(1) 資料本身、(2) 對應的 Q&A 陷阱塊、(3) 設計選擇揭露面板。三處都要有，學員才不會以為是 bug。

---

## 5. 散點圖四象限的中位線設定

**原則：** 象限分隔線不要用任意數字，要用資料本身的均值：

```
x 中位線 = total_visits / total_stores / 12 = 486217 / 34 / 12 ≈ 1196 (月均來客)
y 中位線 = overall AOV = 287 (NT$)
```

這樣每個象限的定義有業務意義（高於/低於全鏈均值），而非人為分割。

---

## 6. 「刻意缺失維度」的教學設計

**技巧：** 刻意不放翻桌率、外送 vs 自取拆分，但必須在兩個地方明確說明：
1. **訓練題（T3/T4）**：用問題引導學員自己發現缺失
2. **設計選擇揭露**：說明「為什麼這樣設計」

絕對不能讓缺失「靜默存在」——沒有解釋的缺失會被誤解為疏漏而非教學設計。

---

## 7. 深色主題 vs 淺色主題的選型時機

| 情境 | 建議 |
|---|---|
| 多份 dashboard 教材、希望視覺差異化 | 深色主題（與預設淺色版形成對比） |
| 初學者第一份接觸 | 淺色主題（視覺認知負擔低） |
| 長時間閱讀大量數字 | 深色主題（減少眼睛疲勞） |
| 需要印刷輸出 | 淺色主題（深色印刷耗墨且對比差） |

深色主題的 Chart.js 注意事項：
- `gridColor` 要用 `rgba(255,255,255,0.05)` 而非預設灰
- `tickColor` 要用 `rgba(255,255,255,0.4)`
- datalabels 顏色要用 `#e6edf3`（淺色文字）

---

## 8. 檔案命名規則（本專案）

```
{產業}_{分析主題}_訓練儀表板教材_v{N}.html
```

- 同產業同主題，第二版 → `v2.html`（不建立新目錄）
- 版本號從 `v1` 起，舊版保留（不覆蓋）
- 不使用英文 slug 或 `intern-analytics-demo-vN` 舊命名

---

## 9. 散點圖「封閉三角」原則

**問題：** 散點圖的 x 軸（月均來客）若獨立設定，與 store_revenue 之間會有最大 13% 的誤差（如高雄苓雅 x=480 但實際推算 x=544），讓聰明的學員算出矛盾。

**解法：** x 軸從 store_revenue 反推：`x = round(store_revenue[i] × 10000 / (y[i] × 12))`，確保封閉三角：

```
x（月均來客） × y（AOV） × 12 個月 / 10000 = store_revenue（萬）
```

assertConsistency 新增 Check 11，驗證每個門市的推算值與 store_revenue 之差 < 1%。

**副作用：** 若業務邏輯使所有門市高收入者也是高流量，用此公式反推後可能某個象限完全空缺（見第 10 條）。

---

## 10. 四象限散點圖必須確保所有象限有代表門市

**問題：** 餐飲連鎖中「高業績 = 高流量 × 高客單」的商業邏輯，導致封閉三角反推後所有門市自然聚在右下→右上→左下三個象限，左上「精品型」（低流量高客單）完全空白。

**解法：** 在資料設計階段刻意將 3-5 家門市的 AOV 設為顯著高於全局均值（y > 中位線），配合封閉三角，讓 x 反推值落入左上象限：

```
精品型示範（餐飲連鎖）：
- 淡水   : store_revenue=312, y=312, → x=833（< 1196 中線）→ 左上 ✓
- 竹北   : store_revenue=244, y=305, → x=667 → 左上 ✓
- 台中西屯: store_revenue=231, y=318, → x=605 → 左上 ✓
- 台南東區: store_revenue=179, y=298, → x=501 → 左上 ✓
```

**業務說明（讓數字有意義）：** 這些是「商圈規模小但品牌溢價高」的精品型門市，需在設計選擇揭露中說明，否則學員會以為是 bug。

---

## 11. 高頻貢獻率等無法直接圖表驗算的 KPI 必須加錨點

**問題：** KPI「高頻顧客貢獻58.3%業績」在圖表上看不出具體數字，學員無法驗算，分析師品質問題。

**解法：** 在 `DATA.anchors` 中加入 `high_freq_revenue_wan: 8135`（58.3% × 13,954），讓 F tag 可寫成「高頻業績 NT$8,135萬 ÷ NT$13,954萬 = 58.3%」，並加 assertConsistency Check 12 驗證比例封閉。

**通用原則（KPI 可驗算性三選一）：**
1. 直接計算：KPI = 可算出的公式（如 AOV = 總收入/總訂單）
2. 分佈閉合：KPI 是加總分佈的結果（如回購率 = ≤30天人數 / 總顧客）
3. 錨點交叉驗算：KPI 不能直接算出時，加 `xxx_revenue` 錨點讓 % × total = 原始值可驗

凡無法通過三選一其中一條的 KPI，不得放入儀表板。

---

## 12. 縮寫/術語全面審查的方法

**問題：** 在一份 dashboard 中，YoY、pp、LTV、ROI、KPI 等縮寫分散在 KPI 卡、答案、findings 各處，很容易漏掉定義。

**操作方法（快速掃描）：** 完稿後在 HTML 全文搜尋大寫字母序列（regex: `[A-Z]{2,5}`），逐一核對 def-panel 是否有對應條目。餐飲案例中補漏：YoY、pp、LTV、ROI、KPI。

**注意：** HHI 等指數名稱必須同時在 def-panel 中寫出全名（Herfindahl-Hirschman Index），且說明計算方法與數字所在層級（品類層級 vs SKU 層級），防止學員引用未展示的計算基礎。

---

## 14. Chart.js 4.x 圖表不渲染的三大靜默陷阱

以下三個問題在 Chart.js 4.x 中均**不報錯、只是圖表靜默不顯示**，極難診斷。

### 14-A：`Chart.register(ChartDataLabels)` 必須存在，且順序不可錯

**問題：** `chartjs-plugin-datalabels@2.x` 的 UMD/CDN bundle **不會自動 register**（不同於 chartjs-plugin-annotation 會自動掛載）。若未呼叫 `Chart.register(ChartDataLabels)`，所有 `datalabels: { display: true }` 均為死碼——不報錯，數值就是不出現。

**失敗連鎖（本專案 SaaS 儀表板的真實踩坑）：**
1. 忘記加 `Chart.register(ChartDataLabels)` → plugin 載入但不生效 → 所有 datalabels 靜默消失
2. 試圖加 `Chart.defaults.plugins.datalabels.display = false` 修補全域預設
3. 但 plugin 尚未 register → `Chart.defaults.plugins.datalabels` 是 `undefined`
4. `undefined.display = false` 拋 `TypeError` → **整個 inline script 中斷 → 所有 chart 消失**

**正確寫法（順序不可交換）：**

```javascript
// 1. 先 register，才能存取 Chart.defaults.plugins.datalabels
Chart.register(ChartDataLabels);
if (window.ChartAnnotation) Chart.register(window.ChartAnnotation);

// 2. register 完成後才安全設定全域預設
Chart.defaults.plugins.datalabels.display = false; // 全域關閉，mk() 按需 opt-in

// 3. 接著才定義 BASE_PLG 等變數
const BASE_PLG = { ... };
```

**診斷技巧：** 開 F12 Console，若看到 `TypeError: Cannot set properties of undefined` 出現在 `datalabels` 相關行，確定是 register 順序問題。若 Console 完全乾淨但 label 不顯示，確定是忘記 register。

**annotation plugin 的不同行為：** `chartjs-plugin-annotation@3.x` UMD bundle **會** 自動 register，但仍建議加 `if (window.ChartAnnotation) Chart.register(window.ChartAnnotation)` 防呆（重複 register 不會報錯）。

---

### 14-B：禁用 `Chart.defaults.set('plugins.datalabels', { display: false })`

**問題：** 這行看似「全域關閉再個別開啟」的 best practice，實際上會覆蓋 ChartDataLabels 插件的內部 option merger，導致雙 Y 軸圖（dual-axis bar+line）和填色折線圖（fill line）的**整個圖形消失**（不只是 label 消失），且不報任何錯誤。

**解法：** 直接刪除這行。在每個不需要 label 的圖表中，逐一指定 `datalabels: { display: false }` 即可。每個需要 label 的圖表則顯式設定 `datalabels: { display: true, ... }`。

---

### 14-C：`switchPage` 必須用 `setTimeout(60ms)` 包住 draw 呼叫

**問題：** `switchPage` 呼叫 DOM classList 修改（hidden/active）後，若立即同步呼叫 drawXxx()，瀏覽器尚未完成 layout——Chart.js 讀到的 canvas 尺寸仍是 0×0，導致圖表初始化成空白且不報錯。

**現象：** 第一頁（直接載入）的圖表正常，切換到其他頁面後的圖表全部空白或只顯示背景色。

**解法：** 使用 60ms 延遲，與工作版（電商DTC）保持一致：
```javascript
if (!initialized[name]) {
  initialized[name] = true;
  setTimeout(() => {
    if (name === 'ops') drawOps();
    if (name === 'cust') drawCust();
    if (name === 'deep') drawDeep();
  }, 60);
}
```

---

### 14-D：所有 canvas 容器的 CSS 高度 class 必須實際定義

**問題：** HTML 中 `<div class="h280">` 若 `.h280 { height: 280px }` 不在 CSS 中，容器高度為 0，圖表完全不可見（Chart.js 不報錯）。

**症狀：** 圖表在 DOM 中存在（F12 可查到 canvas），但視覺上完全消失，不是白色而是完全不佔空間。

**解法：** 統一定義所有使用到的 `.hNNN` class。建議完整組：
```css
.h240 { height: 240px; }
.h260 { height: 260px; }
.h280 { height: 280px; }
.h300 { height: 300px; }
.h360 { height: 360px; }
.h420 { height: 420px; }
.h480 { height: 480px; }
.h520 { height: 520px; }
```

每次新增圖表前，先確認對應的 height class 存在。

---

## 13. 計算指標的層級一致性

**問題：** 儀表板顯示品類（3 欄）資料，但 HHI KPI 使用 SKU 層級計算值（需要品項明細），學員無法驗算，違反「所有分析依據只使用儀表板呈現數據」原則。

**解法：** 指標的計算層級必須與儀表板呈現的資料層級一致：
- 只有品類資料 → HHI 用品類層級（42²+33²+25²=3,478）
- 需要 SKU 層級 → 必須同時在儀表板中顯示 SKU 明細圖

**驗算方法：** 每個 KPI 數值，在寫完儀表板後，自己嘗試從圖表資料手動推算一次，確認能算出來。算不出來的數字就是層級錯誤或缺少定義。

---

## 15. annotation plugin 全域變數名稱陷阱

**問題：** `chartjs-plugin-annotation@3.x` UMD CDN bundle 的全域變數是 `window.ChartAnnotation`，**不是** `window['chartjs-plugin-annotation']`。

使用錯誤名稱時：
```javascript
// ❌ 錯誤：key 不存在，if 永遠 false，plugin 靜默未 register
if (typeof window['chartjs-plugin-annotation'] !== 'undefined') {
  Chart.register(window['chartjs-plugin-annotation']);
}
// ❌ 同樣錯誤（短寫也用了錯誤 key）
if (window['chartjs-plugin-annotation']) Chart.register(window['chartjs-plugin-annotation']);
```

後果：`if(...)` 評估為 false → plugin 未 register → 所有 annotation（基準線、標籤、虛線）靜默消失，Console 完全乾淨，無任何錯誤提示。

**正確寫法（唯一標準）：**
```javascript
// ✅ 正確：CDN UMD 全域就是 window.ChartAnnotation
if (window.ChartAnnotation) Chart.register(window.ChartAnnotation);
```

**稽核記錄（2026-06）：** 本批次中 餐飲連鎖_v1、電商DTC_v3、品牌訊息通道 三份儀表板使用了錯誤名稱，統一修正為 `window.ChartAnnotation`。

---

## 16. def-panel sticky 定位必須在 `#def-panel-outer`（flex child），不可在 `#def-panel-inner`

**問題：** `#def-panel-outer` 有 `overflow: hidden`（用於 width 過渡動畫），任何具有 `overflow: hidden` 的祖先都會讓子元素的 `position: sticky` **靜默失效**——子元素降級為 static，面板位置錯誤（通常在錯誤位置出現）。

**錯誤寫法（sticky 在 inner → 被 outer overflow:hidden 阻斷）：**
```css
#def-panel-outer { flex-shrink: 0; width: 0; overflow: hidden; transition: width ...; }
#def-panel-inner {
  width: 323px;
  height: calc((100vh - var(--header-h)) * 1.2);
  overflow-y: auto;
  position: sticky;      /* ← 靜默失效，因 outer 有 overflow:hidden */
  top: var(--header-h);
}
```

**正確寫法（sticky 在 outer → flex child 本身不受 overflow:hidden 影響）：**
```css
#def-panel-outer {
  flex-shrink: 0; width: 0; overflow: hidden; transition: width ...;
  position: sticky;              /* ← sticky 在 flex child 上，正確 */
  top: var(--header-h, 138px);
  height: calc(100vh - var(--header-h, 138px));
  align-self: flex-start;        /* ← 必要：防 flex stretch 破壞 sticky */
}
#def-panel-outer.open { width: 323px; }
#def-panel-inner {
  width: 323px;
  height: 100%;                  /* ← 繼承 outer 高度 */
  overflow-y: auto;              /* ← 面板內部自行捲動 */
}
```

**稽核記錄（2026-06）：** 餐飲連鎖_v1、電商DTC_v3、SaaS、品牌訊息通道 四份儀表板使用錯誤寫法，統一修正。網紅個人品牌、健身房為正確實作。

---

## 17. findings-section 必須預設坍縮——缺少此設計 = 訓練效果為零

**問題：** 若 `.findings-section` 預設展開，學員一打開頁面就看到所有分析結論和 QA 答案，完全失去「先看圖、自己推論、再驗證」的訓練流程。這是教學設計的根本錯誤。

**強制實作三件組（缺一不可）：**

### (A) HTML — findings-section 內第一個子元素必須是 .findings-label
```html
<div class="findings-section">
  <div class="findings-label">🔍 分析發現</div>
  <!-- 其他內容... -->
</div>
```
若批次建立多個 findings-section，可改用 JS 動態插入（見下方 C）。

### (B) CSS — 加在所有 findings-section 樣式之後
```css
.findings-label {
  cursor: pointer; user-select: none;
  display: flex; align-items: center; justify-content: space-between;
  font-size: 11px; font-weight: 700; letter-spacing: 1.2px; text-transform: uppercase;
  color: var(--accent); margin-bottom: 10px;
}
.findings-label::after { content: '▲'; font-size: 8px; transition: transform 0.22s; opacity: 0.65; }
.findings-section.collapsed .findings-label { margin-bottom: 0; }
.findings-section.collapsed .findings-label::after { transform: rotate(180deg); }
.findings-section.collapsed > *:not(.findings-label) { display: none; }
```

### (C) JS — DOMContentLoaded 自動坍縮 + 動態補 label
```javascript
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.findings-section').forEach(s => {
    // 若 HTML 中尚未手動加入 .findings-label，動態插入
    if (!s.querySelector('.findings-label')) {
      const lbl = document.createElement('div');
      lbl.className = 'findings-label';
      lbl.textContent = '🔍 分析發現';
      s.insertBefore(lbl, s.firstChild);
    }
    s.classList.add('collapsed');
    s.querySelector('.findings-label').addEventListener('click', () => {
      s.classList.toggle('collapsed');
    });
  });
});
```

**稽核記錄（2026-06）：** 本批次 6 份儀表板中，只有「網紅個人品牌」實作此功能。餐飲連鎖_v1、電商DTC_v3、SaaS、健身房、品牌訊息通道 均缺少，統一補入。電商DTC 特殊情況：HTML 內已有 `.findings-label` 元素，只需補 CSS collapsed 規則 + DOMContentLoaded handler。

---

## 18. 製作時間 chip 格式標準

**標準格式（必須包含「製作時間：」中文前綴）：**
```html
<span class="meta-chip">🗓️ 製作時間：20260613</span>
```

**錯誤格式（缺前綴，僅有日期）：**
```html
<!-- ❌ 不標準 -->
<span class="meta-chip">🗓️ 20260611</span>
```

**規則：** 每次對該儀表板有任何修改，必須同步更新製作時間為當天日期（YYYYMMDD 格式）。格式統一確保所有檔案頭部信息一致、可掃描確認版本。

**稽核記錄（2026-06）：** 健身房_會員全週期分析 缺少前綴，已修正。

---

## 19. 跨儀表板一致性稽核檢查清單（Cross-Dashboard Audit Checklist）

當需要對多份儀表板進行批次稽核時，依下列清單逐項 grep 確認：

| 項目 | 正確模式 | grep 指令 |
|------|---------|---------|
| Chart.register(ChartDataLabels) | 每份必有且在 assertConsistency 之後 | `grep -n "Chart.register(ChartDataLabels)"` |
| annotation plugin 名稱 | `window.ChartAnnotation` | `grep -n "ChartAnnotation\|chartjs-plugin-annotation"` |
| def-panel sticky 位置 | `#def-panel-outer` 有 `position:sticky` | `grep -n "position.*sticky"` |
| findings collapse CSS | `.findings-section.collapsed` 有 3 條規則 | `grep -c "findings-section.collapsed"` |
| findings collapse JS | `classList.add('collapsed')` + click handler | `grep -n "add.*collapsed\|classList.toggle"` |
| findings label 文字 | `🔍 分析發現`（不是 📊 Findings 或其他） | `grep -n "分析發現\|📊 Findings"` |
| findings text-node wrapper | 內容含 text node 的 section 需有 `.findings-content` wrapper | `grep -n "findings-content"` |
| FIA/badge 無 monospace | `.badge`/`.fia` 不含 `font-family.*monospace\|JetBrains` | `grep -n "\.badge\|\.fia"` |
| 製作時間 chip | 含「製作時間：」前綴 | `grep -n "製作時間"` |
| syncHeaderHeight | JS 有 `syncHeaderHeight` | `grep -n "syncHeaderHeight"` |

**判斷 findings-section 是否需要 `.findings-content` wrapper：**
若 findings-section 內容為 `<strong>` + text / `<br>` + text（非純 `<div>`/`<p>` 包裹），必須加 wrapper。
快速判斷：`grep -A3 'findings-section' file.html | grep -v 'findings-label\|qa-item\|finding-item\|div class'`

---

## 20. `syncHeaderHeight()` — 動態 header 高度同步

**問題：** sticky 元素（def-panel-outer、nav-tabs 等）使用 `top: var(--header-h)` 定位，若 `--header-h` 是硬編碼靜態值，在不同螢幕寬度或字型縮放下 header 實際高度會偏移，造成 sticky 元素位置不準確。

**解法：** 在 JS 動態讀取 `#top-header` 的 `offsetHeight` 並更新 CSS 變數，並在 `load` 和 `resize` 時重新計算：

```javascript
function syncHeaderHeight() {
  const h = document.getElementById('top-header').offsetHeight;
  document.documentElement.style.setProperty('--header-h', h + 'px');
}
window.addEventListener('load', syncHeaderHeight);
window.addEventListener('resize', syncHeaderHeight);
```

**位置：** 放在主 `<script>` 區塊的最末、`</script>` 之前。不可放在 `DOMContentLoaded` 內（load 事件比 DOMContentLoaded 晚，字型載入後才能得到正確高度）。

**CSS 端配合：**
```css
:root { --header-h: 138px; }   /* 初始預估值，JS 載入後覆蓋 */

#def-panel-outer {
  position: sticky;
  top: var(--header-h, 138px);
  height: calc(100vh - var(--header-h, 138px));
}
```

**稽核記錄（2026-06）：** SaaS 儀表板缺少此函數，統一補入。其餘 5 份均已具備。

**黃金標準版（2026-06 當前）：** `網紅個人品牌_旅遊生活風格創作者_訓練儀表板教材.html` 是唯一通過全部項目的版本，新功能應以此為參考。

---

## 21. findings-section collapse — text node 靜默失效陷阱

**現象：** `collapsed` class 確實被加上（label 箭頭翻轉），但坍縮後 findings 內容仍然可見。

**根因：** findings-section 內容若為 `<strong>文字：</strong>後接 raw text`（無 `<div>`/`<p>` 包裹），則：
```css
.findings-section.collapsed > *:not(.findings-label) { display: none; }
```
只隱藏 **element children**（`<strong>`、`<br>` 等），**raw text node 不是 element，永遠不受影響**，仍然可見。

**受影響的寫法（常見）：**
```html
<div class="findings-section">
  <strong>觀察：</strong>推播通道觸達 110,000 筆，...
  <br>
  <strong>推論：</strong>對話型通道效率更高...
</div>
```

**修法：在 DOMContentLoaded JS 中建立 `.findings-content` wrapper，把所有非 label 節點（含 text node）一起包進去：**

```javascript
document.querySelectorAll('.findings-section').forEach(s => {
  let lbl = s.querySelector('.findings-label');
  if (!lbl) {
    lbl = document.createElement('div');
    lbl.className = 'findings-label';
    s.insertBefore(lbl, s.firstChild);
  }
  lbl.textContent = '🔍 分析發現';
  if (!s.querySelector('.findings-content')) {
    const wrap = document.createElement('div');
    wrap.className = 'findings-content';
    // Array.from() 先做靜態快照，避免 live NodeList 在 appendChild 時位移
    Array.from(s.childNodes).forEach(n => { if (n !== lbl) wrap.appendChild(n); });
    s.appendChild(wrap);
  }
  s.classList.add('collapsed');
  lbl.addEventListener('click', () => s.classList.toggle('collapsed'));
});
```

原有 CSS `> *:not(.findings-label)` 不需改動：`.findings-content` 是 element child，會被正確隱藏。

**判斷標準：** findings-section 的直接子節點是否包含 text node 或 inline element（`<strong>`、`<br>`、`<span>`）？
- 是 → 需要 wrapper
- 否（全是 `<div>` 或 `<p>`）→ 原有 CSS 已足夠

**稽核記錄（2026-06）：** SaaS、品牌訊息通道、餐飲連鎖 均使用此寫法，已統一補入 wrapper。健身房、電商DTC、網紅個人品牌 使用 div 容器，不受影響。

---

## 22. DOMContentLoaded 重複註冊陷阱

**現象：** 點擊 findings label 沒有反應（toggle 了又 toggle 回去 = 淨效果為零）。

**根因：** 同一個 `<script>` 中有兩段 `document.addEventListener('DOMContentLoaded', ...)` 同時對 `.findings-label` 加了 click handler，兩個 handler 都觸發，一個 toggle on、一個 toggle off，結果不動。

**發生情境：**
- 舊版 dashboard 已有 `toggleFindings()` + DOMContentLoaded（加 collapsed + click）
- 補丁 script 不知道原有 handler 的存在，又加了一個完整的 DOMContentLoaded

**正確做法：** 補入新功能時先 grep 確認是否已有 DOMContentLoaded 及 findings handler：
```bash
grep -n "DOMContentLoaded\|toggleFindings\|findings.*click" file.html
```
若已存在 → 修改原有的，不要新增第二個。

**稽核記錄（2026-06）：** 網紅個人品牌 原有 `toggleFindings()` 機制，補丁誤加第二個 handler，已修正為只保留原有 handler 並補入 `label.textContent` 更新。

---

## 23. FIA / L123 CSS 標準規格（以品牌訊息通道為基準）

新建儀表板的 FIA 和 L123 標籤，直接複製以下 CSS block，再視主題調整 rgba 值。

```css
/* ─── Badge (L1 / L2 / L3) ─── */
.badge { display: inline-block; border-radius: 4px; padding: 1px 6px; font-size: 0.67rem; font-weight: 600; }
.badge.l1 { background: rgba(217,119,6,0.18); color: var(--accent2); border: 1px solid rgba(217,119,6,0.3); }
.badge.l2 { background: rgba(59,130,246,0.18); color: var(--accent); border: 1px solid rgba(59,130,246,0.3); }
.badge.l3 { background: rgba(139,92,246,0.18); color: var(--purple); border: 1px solid rgba(139,92,246,0.3); }

/* ─── Answer-block FIA tags（段落開頭標記）─── */
.tag-f { display: inline-block; background: rgba(217,119,6,0.18); color: var(--accent2); border-radius: 4px; padding: 0 5px; font-size: 0.7rem; font-weight: 700; margin-right: 3px; }
.tag-i { display: inline-block; background: rgba(59,130,246,0.18); color: var(--accent); border-radius: 4px; padding: 0 5px; font-size: 0.7rem; font-weight: 700; margin-right: 3px; }
.tag-a { display: inline-block; background: rgba(245,158,11,0.18); color: var(--warn); border-radius: 4px; padding: 0 5px; font-size: 0.7rem; font-weight: 700; margin-right: 3px; }

/* ─── Inline FIA spans（句中標記）─── */
.fia { display: inline-block; border-radius: 3px; padding: 0 4px; font-size: 0.68rem; font-weight: 700; }
.fia.f { background: rgba(217,119,6,0.18); color: var(--accent2); }
.fia.i { background: rgba(59,130,246,0.18); color: var(--accent); }
.fia.a { background: rgba(245,158,11,0.18); color: var(--warn); }

/* ─── fi-tag（findings-section 段落前綴，維持 monospace）─── */
.fi-tag { display: inline-block; font-family: monospace; font-size: 9.5px; font-weight: 700; padding: 0 4px; border-radius: 2px; margin-right: 5px; vertical-align: middle; position: relative; top: -1px; }
.fi-tag.fi-f { background: #dbe7ff; color: #1a3a99; }
.fi-tag.fi-i { background: #fef4d9; color: #8a5d00; }
.fi-tag.fi-a { background: #fde7e3; color: #a8362a; }
```

**規則：**
- `.badge`、`.tag-f/i/a`、`.fia` — **不加 font-family**（繼承 body 的主字型）
- `.fi-tag` — **保留 monospace**（設計上刻意使用等寬字型以突顯段落標籤）
- 顏色背景用 `rgba()`，文字顏色用 `var()` CSS 變數（確保各主題自動適配）
- 深色主題（如健身房）的 rgba 值可用主題對應的 accent/teal/amber 值替換，但**不可用 hardcoded hex**

**常見錯誤：** 舊版 `.badge` 加了 `font-family:'JetBrains Mono'`、`.fia` 加了 `font-size:9.5px;vertical-align:middle;position:relative;top:-1px` — 這些是舊的 monospace 定位補償，使用標準主字型後不再需要。

---

## 24. Donut chart — 預設顯示百分比 datalabels

**問題：** Donut chart 建立時通常會加 `datalabels:{ display:false }` 避免在所有 chart 上出現 datalabel，但 donut chart 本身需要在扇形中心顯示佔比值。

**正確寫法（僅 donut 的 plugin 區塊）：**
```javascript
plugins: {
  legend:   { position:'bottom', labels:{ boxWidth:12, padding:12, font:{size:11} } },
  tooltip:  { callbacks:{ label: ctx => `NT$${ctx.parsed.toLocaleString()} (${(ctx.parsed/total*100).toFixed(1)}%)` } },
  datalabels: {
    display:   true,
    color:     '#fff',
    font:      { size: 11, weight: '600' },
    formatter: (val) => (val / total * 100).toFixed(1) + '%',
    anchor:    'center',
    align:     'center',
    clip:      false
  }
}
```

**注意：** `mk()` factory 在 `options.plugins.datalabels` 未設定時會套用全域 register 的 datalabels 預設值。Donut chart **不經過 `mk()`**，直接 `new Chart()` 建立，因此需要在 plugins 區塊明確設定 datalabels，不能依賴全域。
