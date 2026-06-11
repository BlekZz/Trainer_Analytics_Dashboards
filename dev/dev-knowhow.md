# 分析訓練儀表板 — 開發 Knowhow

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
