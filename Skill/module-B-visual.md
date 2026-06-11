# 模組 B：視覺與互動規範 (Visual & Interaction Standards)

> **核心原則：視覺語言要「服務分析推論」而非「服務美觀」。每個顏色、每個位置、每個動畫都要有意義。**

---

## B.1 色彩語意 Protocol

固定五色 + 中性灰，**絕對不可任意換語意**。生成不同產業 dashboard 時可以微調色相，但語意不變。

| 色名 | 標準色碼 | 語意 | 使用時機 |
|---|---|---|---|
| 主資料藍 | `#2d5be3` | 中性事實、主要資料 | 大多數圖表的基準色 |
| 正向綠 | `#2aab85` | 正向趨勢、穩定、高價值 | 活躍率、回購率、健康指標 |
| 注意橘 | `#d4870a` | 季節性、中等強度、需注意 | 旺季、中間區段、警告但不嚴重 |
| 警示紅 | `#d43a2f` | 流失、風險、衰退 | 流失曲線、超出門檻、急跌 |
| 行為紫 | `#7c4dff` | 時間相關、用戶行為 | 時段圖、再購間隔、行為節律 |
| 中性灰 | `rgba(100,110,135,X)` | 對照組、長尾、未分類 | 「其他」項、未轉換池 |

頂部色彩語意條為必備元素（D7），讓讀者建立 mental model：

```html
<div class="color-legend">
  <span class="lg-label">色彩語意</span>
  <span class="cl-item"><span class="cl-dot" style="background:#2d5be3"></span>主資料/事實</span>
  <span class="cl-item"><span class="cl-dot" style="background:#2aab85"></span>正向/穩定</span>
  <span class="cl-item"><span class="cl-dot" style="background:#d4870a"></span>注意/季節性</span>
  <span class="cl-item"><span class="cl-dot" style="background:#d43a2f"></span>警示/流失</span>
  <span class="cl-item"><span class="cl-dot" style="background:#7c4dff"></span>行為/時間</span>
</div>
```

---

## B.2 Chart 類型對應決策表

| 想呈現 | 用什麼 chart | 避免用 |
|---|---|---|
| 兩個系列同期對比（如新增 vs 流失） | 並列 bar chart | 折線會讓視覺重疊 |
| 多分類加總到固定總量 | 堆疊 bar / donut | 折線無法呈現組成 |
| 趨勢 + 組成（同時想看總量與分佈） | 堆疊 bar + 折線疊加 | 純堆疊看不出總量 |
| 一個維度的等級對比 | 橫向 bar（標籤長時） | 縱向會被擠扁 |
| 24h / 24 期間的節律 | 折線 + 區域填色 | bar 太破碎 |
| 比例分佈（佔比） | donut（4-6 類）/ 縱向 bar（7+ 類） | pie 無法擺中央數字 |
| 兩個獨立人池 | 並列兩個元件，**不要**畫在同一張圖 | 強行合併會誤導 |
| 4-7 個百分比的演變 | 多線折線 | bar 看不出順序 |
| 散佈關聯 | scatter | bar 無法呈現相關性 |

### 重要視覺工程設計

1. **堆疊 bar 上疊「總量折線」**（D8）— 當你用堆疊呈現組成時，加紅色虛線表示總量趨勢，避免「組成清楚但總量模糊」的問題。

2. **donut 中央放總量數字**（custom plugin）— 不要浪費中央那塊空間，用 `afterDraw` plugin 寫上總量與標籤。

3. **annotation 標策略點**（用 chartjs-plugin-annotation）—
   - 免運門檻畫紅色虛線並標 label
   - 24h 圖標 20 點高峰位置
   - cohort 矩陣標關鍵時間節點

4. **datalabels 必須避開邊界** — 用 `layout.padding` + `scales.y.suggestedMax`（最大值的 1.1-1.2 倍）雙保險，否則最高的 bar 標籤會被切。

---

## B.3 版面結構標準

### Header 3-row sticky（標準版，2026-05 起）

```
┌─────────────────────────────────────────────────────────────────────┐
│ Row 1: 文件命名式標題 + info chips                    ← flex: 1 → │✏️ 製作者│🗓️ 製作時間│
│   {產業}_{主題}_訓練儀表板                                          │
│   [📅 資料期間] [📊 資料範圍] [⚗️ DEMO 合成資料集]                   │
├─────────────────────────────────────────────────────────────────────┤
│ Row 2: [📖 指標定義 ›]  [tab1][tab2][tab3]                          │
│   指標定義按鈕在最左，nav-tabs 緊接在右                              │
├─────────────────────────────────────────────────────────────────────┤
│ Row 3 (legend): ● 主資料 ● 正向 ● 注意 ● 警示 ● 行為 │ L1 L2 L3 │ F I A │
└─────────────────────────────────────────────────────────────────────┘
```

**Row 1 製作資訊規則：**
- 標題與資料 chips 之後加 `<span style="flex:1"></span>` 將製作資訊推到最右側
- 製作者 chip：`✏️ 製作者：Blake`（固定，不隨產業變動）
- 製作時間 chip：`🗓️ 製作時間：YYYYMMDD`（例：20260522）
- **每次對該檔案有任何修改，必須同步更新製作時間為當天日期**
- 文件命名式標題不含版本號（版本由 git 追蹤）

整個 header 必須 `position: sticky; top: 0; z-index: 200`，透過 `syncHeaderHeight()` 在 load/resize 時動態更新 `--header-h` CSS 變數，供側板 sticky 定位使用。

### 指標定義側板（推左側滑出，D10 新規格）

- 按鈕在 Row 2 最左，點擊後**從左側滑出**定義側板（`#def-panel-outer` width 0 → 320px）
- 側板**推擠佈局**（`#main-wrapper: flex`），不蓋在內容上層
- 側板有**模糊搜尋欄**（`filterDef()` 過濾 `.def-item`，無結果時顯示提示）
- 側板有獨立捲動（`overflow-y: auto`，高度繼承 outer 的 `height: calc(100vh - var(--header-h))`）
- 關閉時：清空搜尋欄 + 重置 filterDef + 呼叫 `Chart.instances` 全部 resize（修復圖表寬度）

> **🔴 sticky 定位陷阱（2026-06 確認）**
>
> `position: sticky` **必須加在 `#def-panel-outer`（flex child）上，不能加在 `#def-panel-inner` 上。**
>
> 原因：`#def-panel-outer` 有 `overflow: hidden`（用於 width 過渡動畫）；任何具有 `overflow: hidden/auto/scroll` 的祖先都會讓子元素的 `position: sticky` 失效——子元素會被降級為 static 定位，導致面板出現在錯誤位置（通常是頁面頂部多出一段空白）。
>
> **正確 CSS 規格：**
>
> ```css
> /* ✅ 正確：sticky 在 outer (flex child) 上 */
> #def-panel-outer {
>   width: 0;
>   overflow: hidden;             /* 用於 width 過渡，不影響 outer 自身的 sticky */
>   transition: width .3s ease;
>   flex-shrink: 0;
>   position: sticky;             /* ← sticky 在 outer */
>   top: var(--header-h);
>   height: calc(100vh - var(--header-h));
>   align-self: flex-start;       /* ← 必要：防止 flex stretch 撐滿容器高度破壞 sticky */
> }
> #def-panel-inner {
>   width: 320px;
>   height: 100%;                 /* ← 繼承 outer 高度 */
>   padding: 18px 16px;
>   overflow-y: auto;             /* ← 面板內容自行捲動 */
>   background: var(--bg-card);
>   border-right: 1px solid var(--border);
> }
>
> /* ❌ 錯誤：sticky 在 overflow:hidden 的子元素上 → sticky 靜默失效 */
> #def-panel-inner {
>   position: sticky;             /* 被 outer 的 overflow:hidden 阻斷，完全無效 */
>   top: var(--header-h);
>   height: calc(100vh - var(--header-h));
> }
> ```

```html
<!-- wrapper 結構 -->
<div id="main-wrapper">
  <div id="def-panel-outer">
    <div id="def-panel-inner">
      <h3>📖 指標定義</h3>
      <div class="def-search-wrap"><input oninput="filterDef(this.value)" ...></div>
      <div class="def-no-result" id="defNoResult">沒有符合的指標</div>
      <!-- def-items -->
    </div>
  </div>
  <div id="content-area">
    <!-- page-1, page-2, page-3 -->
  </div>
</div>
```

### 色彩語意條（Row 3）

- 5 色 dot 只顯示語意文字，**不加括號顏色名稱**（dot 本身已代表顏色）
- 分隔線後跟 L1/L2/L3 難度 badge，再一條分隔線後跟 F/I/A 標籤

### 每頁標準內容結構：

```
┌─────────────────────────────────────────────────┐
│ Section: KPI cards (4 個)                       │
│   - 視覺權重縮小：value 28px、padding 16px        │
│   - bottom 3px 主色條                            │
├─────────────────────────────────────────────────┤
│ Section: Chart group 1                          │
│   ┌────────────────┐                            │
│   │ chart-block    │ ← 圖表本體                  │
│   ├────────────────┤                            │
│   │ findings-section ← 4px 左邊條 + 主色         │
│   │   - QA item ×N                              │
│   └────────────────┘                            │
├─────────────────────────────────────────────────┤
│ Section: Chart group 2 (...)                    │
├─────────────────────────────────────────────────┤
│ (P3 only) Training panel                         │
│ (P3 only) 📐 Design Choices panel               │
└─────────────────────────────────────────────────┘
```

### Chart-Findings 視覺結合（D2）

`findings-section` 必須有 `border-left: 4px solid var(--accent)` 視覺暗示「這是圖表的延伸對話」，並用更深的背景色（`var(--bg-finding)`，比 chart-block 背景深一階）。

避免讓 findings 看起來像「另一個獨立區塊」— 它是圖表的**延伸論述**，不是平行內容。

---

## B.4 Plugin 初始化 & 標準 mk() Chart Factory

### Plugin 強制初始化（🔴 紅線）

每份 dashboard 的 `<script>` 區塊第一件事，**必須**呼叫：

```javascript
Chart.register(ChartDataLabels);
if (window.ChartAnnotation) Chart.register(window.ChartAnnotation);
```

> **🔴 annotation plugin 全域名稱陷阱（2026-06 確認）**：CDN UMD bundle 的全域變數是 `window.ChartAnnotation`，**不是** `window['chartjs-plugin-annotation']`。用錯名稱時 `if(...)` 為 false，plugin 靜默未 register，所有 annotation（基準線、標籤、點）全部消失且不報錯。

**缺少第一行 = 所有 `datalabels: { display: true }` 為靜默死碼。** Chart.js 4 不再自動啟動 CDN 載入的 plugin，必須手動 register。

### mk() Chart Factory

所有圖表透過此 factory 創建，確保 auto-datalabels、正確合併邏輯、plugins 深合併：

```javascript
function mk(id, type, labels, datasets, opts={}) {
  const ctx = document.getElementById(id);
  if (!ctx) return null;
  const isHorizBar = opts.indexAxis === 'y';
  const isStacked  = opts.scales?.x?.stacked || opts.scales?.y?.stacked ||
                     (datasets[0]?.stack);

  // Auto-datalabels: 垂直非堆疊 bar 自動開啟數值顯示，其他圖表預設關閉
  let dl = { display: false };
  if (type === 'bar' && !isHorizBar && !isStacked) {
    dl = {
      display: true, anchor: 'end', align: 'top', clip: false,
      color: 'var(--text-b)',
      font: { size: 10, weight: '600' },
      padding: { bottom: 2 },
      formatter: v => (v == null) ? '' : (Math.abs(v) >= 1000 ? (v/1000).toFixed(1)+'K' : String(v))
    };
  }

  // 🔴 Merge rule（2026-06 修正）：必須用 spread，禁止 Object.assign
  // Object.assign 不新增 display 鍵 → explicit config 沒有 display 時，display:false 維持，labels 靜默不顯示
  // Spread pattern：explicit config 沒有 display → 預設 true；有 display:false → 仍可覆蓋
  if (opts.plugins?.datalabels) {
    dl = { ...dl, display: true, ...opts.plugins.datalabels };
  }

  const mergedPlugins = { ...TT.plugins, ...(opts.plugins || {}), datalabels: dl };
  const topPad = (type === 'bar' && !isHorizBar && !isStacked) ? 28 : 18;

  return new Chart(ctx, {
    type,
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      layout: { padding: { top: topPad, ...(opts.layout?.padding || {}) } },
      ...TT,
      ...opts,
      plugins: mergedPlugins
    }
  });
}
```

**規則：**
- `maintainAspectRatio: false` — 高度由容器 `style="height:NNNpx"` 或 `.hNNN` CSS class 控制
- **垂直非堆疊 bar 自動顯示數值**，無須在 opts.plugins.datalabels 重複設定（除非要自訂 formatter/顏色）
- **水平 bar / 堆疊 bar** 需在 opts.plugins 提供 `datalabels: { anchor, align, formatter }`；`display` 可省略（預設 true），**要隱藏才顯式寫 `display: false`**
- `mk()` 外直接寫的 `new Chart()`（雷達、氣泡、散點）必須手動加 `responsive: true, maintainAspectRatio: false`，且容器必須有明確 `height`，否則尺寸由寬度 × aspect ratio 決定
- 不要在 mk() 外另寫 `new Chart()`，除非需要 custom plugin（如 donut 中央文字）

### 圖表資料排序規則（🔴 紅線）

1. **Bar / Column chart** — 資料依「顯示值」**降序排列**（最大值在左/上）。若有語意固定順序（月份時間軸）則例外。
2. **Donut / Pie chart** — 切片依「值」**降序排列**（最大切片從 12 點鐘位置順時針開始）。
3. **多圖共享標籤陣列** — 以最核心指標降序排定後，所有圖使用相同順序，確保視覺一致。
4. **值域差距 >10x** — 禁用對數刻度；改用**雙 Y-axis**，右軸加 `grid: { drawOnChartArea: false }`。

---

## B.5 互動規範

### Page Switch
- 三頁 nav tab，active 狀態用主色 + 加粗 + 白底
- Switching 時 trigger flash animation 標示目標圖表（`flash-target` class）
- 第一次切換頁面才初始化該頁圖表（lazy init），減少首屏負擔

### QA Toggle
- 預設摺疊，點 question 展開 answer
- 摺疊時視覺權重低（border-left 3px 淺色、字 13.5px regular）
- 展開時加粗 + 主色 border + 綠色 chevron
- 動畫 transform 旋轉 chevron

### Findings 預設坍縮（🔴 紅線）

`.findings-section` 必須在 `DOMContentLoaded` 時加 `collapsed` class，讓學員先觀察圖表、再看分析結論。若沒做此步驟，一打開頁面就暴露所有結論，訓練效果為零。

```javascript
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.findings-section').forEach(s => s.classList.add('collapsed'));
  document.querySelectorAll('.findings-label').forEach(label => {
    label.addEventListener('click', () => toggleFindings(label));
  });
});

function toggleFindings(el) {
  el.closest('.findings-section').classList.toggle('collapsed');
}
```

CSS（必備）：
```css
.findings-label {
  cursor: pointer; user-select: none;
  display: flex; align-items: center; justify-content: space-between;
}
.findings-label::after { content: '▲'; font-size: 8px; transition: transform 0.22s; }
.findings-section.collapsed .findings-label { margin-bottom: 0; }
.findings-section.collapsed .findings-label::after { transform: rotate(180deg); }
.findings-section.collapsed > *:not(.findings-label) { display: none; }
```

### nav-hint 跳頁（D3）
- 跨頁推論題的 answer 區內第一行放黃色 `nav-hint` 卡片
- 點擊觸發 page-switch + scroll-to-chart + flash animation
- 用 `👉` icon 強化「跳轉」直覺
- 摺疊時隱藏，展開答案才出現（避免問題列表變雜亂）

### Chart Ref Button（圖表索引按鈕）（🔴 紅線）

**每一道 QA 訓練題的答案都必須有至少一個 `chart-ref-btn`**，讓讀者可直接跳轉到答案引用的圖表。

```html
<button class="chart-ref-btn" onclick="goToChart('page-name','card-chart-id')">📍 查看：圖表名稱</button>
```

CSS（加在 style 末尾）：
```css
@keyframes chartFlash {
  0%,100% { box-shadow: none; border-color: var(--border); }
  50% { box-shadow: 0 0 0 3px rgba(96,165,250,0.85), 0 0 20px rgba(96,165,250,0.35);
        border-color: rgba(96,165,250,0.9); }
}
.chart-flash { animation: chartFlash 0.55s ease-in-out 4; }

.chart-ref-btn {
  display: inline-flex; align-items: center; gap: 5px;
  background: rgba(59,130,246,0.07); border: 1px solid rgba(59,130,246,0.28);
  border-radius: 6px; padding: 5px 12px; margin-top: 8px;
  font-size: 0.76rem; color: var(--accent); cursor: pointer;
  font-family: var(--font-body); transition: background 0.2s;
}
.chart-ref-btn:hover { background: rgba(59,130,246,0.14); }
```

JavaScript：
```javascript
function goToChart(page, cardId) {
  switchPage(page);
  setTimeout(function() {
    const card = document.getElementById(cardId);
    if (!card) return;
    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    card.classList.remove('chart-flash');
    void card.offsetWidth;               // force reflow to restart animation
    card.classList.add('chart-flash');
    setTimeout(function() { card.classList.remove('chart-flash'); }, 2400);
  }, 200);
}
```

每個被引用的 `chart-card` 必須有 `id="card-{canvas-id}"`：
```html
<div class="chart-card" id="card-cVisitAOV">
```

### Definition Panel（D10）— 側板規格（見 B.3）
- Header Row 2 最左有 `📖 指標定義 ›` 按鈕，點擊從**左側滑出**側板
- 側板推擠佈局（非遮罩），有模糊搜尋欄 + 關閉時清空搜尋
- 列出所有 KPI 精確口徑 + 所有縮寫定義（YoY、pp、KPI、ROI、ARPU 等）
- 預設收起（width: 0），不佔首屏

---

## B.6 字型規範

```
標題類       Lora (serif)        Lora-600
正文類       Outfit (sans-serif) Outfit-400 ~ 600
數字/技術    JetBrains Mono      JBM-400 ~ 700
```

數字必須用 JetBrains Mono（等寬字型）——不論是 datalabels、tooltip 還是 F/I/A 標籤。否則百分比、金額對齊會醜。

---

## B.7 響應式設計

最小支援 960px viewport（給 13" 筆電）。低於此寬度：
- KPI 從 4 欄變 2 欄
- chart-row 從多欄變單欄堆疊
- 色彩 legend 收緊間距
- meta-panel 從 2 欄變 1 欄

不需要支援手機版 — 訓練型 dashboard 一定是桌機/平板情境，不要為了 mobile 犧牲桌機資訊密度。

### KPI Grid 必用規格（🔴 紅線）

```css
/* ✅ 正確：auto-fit 讓卡片撐滿整列，4 張卡各得 ~338px（1400px 寬時） */
.kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px,1fr)); gap: 14px; }

/* ❌ 錯誤：auto-fill 產生幽靈空欄，4 張卡只有 ~200px 寬，KPI 值截斷 */
/* .kpi-grid { grid-template-columns: repeat(auto-fill, minmax(180px,1fr)); } */
```

KPI 值禁止截斷（🔴 紅線）：
```css
/* ✅ 正確 */
.kpi-value {
  font-family: 'JetBrains Mono', monospace;
  font-size: clamp(1.05rem, 2.4vw, 1.55rem);
  font-weight: 600; line-height: 1.2;
  word-break: break-word;          /* 允許折行，禁止截斷 */
}
/* ❌ 禁止以下三條任一出現在 .kpi-value 上 */
/* overflow: hidden; text-overflow: ellipsis; white-space: nowrap; */
```

響應式標準兩段：
```css
@media(max-width:600px) {
  .header-legend .legend-vdivider { display: none; }
  .legend-colors, .legend-right { gap: 8px; }
  .page { padding: 16px; }
}
@media(max-width:480px) {
  .kpi-grid { grid-template-columns: 1fr; }
}
```

---

## B.8 視覺反模式（避免做這些）

1. **🚫 使用未在 protocol 中的色** — 看起來會像「貼了便利貼」
2. **🚫 在同一頁出現超過 3 種圖表類型** — 視覺疲勞
3. **🚫 折線圖只有 1 個 dataset 卻顯示 legend** — Chart.js 會顯示 "undefined"
4. **🚫 datalabels 數字超過 4 位數還用全寫** — 用 `1.2K / 4.8M` 簡寫
5. **🚫 圓餅圖切超過 6 塊** — 切到第 7 塊以後變成「色塊大亂鬥」，改用縱向 bar
6. **🚫 用陰影、漸層、3D 效果** — 訓練型 dashboard 要「平實」，不是 pitch deck
7. **🚫 QA item 預設展開** — 一打開頁面看到 18 道答案會直接放棄
8. **🚫 對數刻度處理大值域差距** — 兩條線相差 100x 時，log scale 刻度讓讀者無法判斷絕對值；改用雙 Y-axis（各軸有語意單位）
9. **🚫 `Chart.register(ChartDataLabels)` 缺失** — datalabels 全靜默失效，Chart.js 不報錯；每次生成後必須在瀏覽器 console 確認數值出現
10. **🚫 `position:sticky` 加在 `overflow:hidden` 子元素上** — sticky 靜默失效，側板位置錯誤；sticky 必須加在 flex child（`#def-panel-outer`）上，見 B.3 規格
11. **🚫 annotation plugin 用 `window['chartjs-plugin-annotation']` 判斷** — CDN UMD 全域是 `window.ChartAnnotation`；用錯名稱導致 plugin 未 register，所有 annotation 靜默消失
12. **🚫 `Object.assign(dl, opts.plugins.datalabels)` 合併 datalabels config** — `Object.assign` 不新增原本沒有的 key；若 explicit config 沒有 `display` 欄位，`dl.display:false` 維持不變，所有 horizontal bar / stacked bar 的 labels 靜默不顯示且不報錯。**正確寫法：** `dl = { ...dl, display: true, ...opts.plugins.datalabels }`（spread 讓 explicit config 覆蓋 `display:true`，沒有 `display` 的 explicit config 自動得到 `display:true`；要隱藏才明確寫 `display: false`）
13. **🚫 `.findings-section` 缺少預設坍縮** — 一進頁面就暴露所有分析結論，訓練效果為零；必須在 `DOMContentLoaded` 呼叫 `s.classList.add('collapsed')`；見 B.5 完整 Pattern
14. **🚫 `new Chart()` 直接建立的圖表（雷達、氣泡、散點）未設 `maintainAspectRatio: false`** — Chart.js 預設 `maintainAspectRatio: true`，高度由容器寬度 × aspect ratio 計算，容器的 `height` CSS 完全無效，導致圖表過大或尺寸不受控；此類圖表必須在 options 明確加 `responsive: true, maintainAspectRatio: false` 並搭配容器 `style="height:NNNpx"`
