---
name: dashboard-training-factory
description: |
  生成「資料分析訓練儀表板」的規格手冊。當使用者提供 (1) 產業別 / 業務情境、(2) 想訓練的分析能力主題、(3) 可選的差異化指令時，依此手冊產出單一 HTML 檔案，包含：合成資料集、互動式圖表、F/I/A 標註的問答訓練、教學陷阱提示、設計選擇揭露。

  觸發時機：當使用者說「幫我做一份 [產業] 的分析訓練 dashboard」、「生成新的 demo dashboard 教實習生 [主題]」、「我要做 [業務情境] 的儀表板教材」、「按照規格手冊產 dashboard」、「換個產業重做一份 dashboard 教材」時，立即載入此 skill。

  不適用情境：(1) 真實業務 dashboard 需求 — 用 analyst-dashboard skill；(2) 簡報 / pitch deck — 用 presentation-deck skill；(3) 履歷篩選 — 用 gs-resume-screener skill。
version: 1.0
author: Blake
---

# Dashboard Training Factory

> 生成「資料分析訓練儀表板」的規格手冊。從產業情境到可投入使用的 HTML 教材，覆蓋資料設計、視覺規範、教學機制、差異化策略四大面向。

---

## 🎯 設計哲學

這份 skill 不是「生成一份儀表板」，而是「生成一份**訓練分析能力的儀表板**」。差別在於：

| 一般 dashboard | 訓練型 dashboard |
|---|---|
| 給管理者快速看數據 | 給實習生練習推論能力 |
| KPI 是結論 | KPI 是「需要被質疑的起點」 |
| 圖表是答案 | 圖表是「需要被詮釋的證據」 |
| 數字一致是基本要求 | **數字內部一致 + 故意保留「合理口徑差」當教學點** |
| 答案越清楚越好 | **答案要分 F/I/A，逼學員區分事實/推論/假設** |

如果你寫出來的儀表板「實習生看一眼就有答案」— 它失敗了。它必須是**讓人有信心去推論，但推論時會被陷阱絆倒** 的設計。

---

## 📦 輸入規格

使用者至少需提供：

### 必要輸入
1. **產業/情境** — 例：B2C 電商、SaaS、線下零售、餐飲連鎖、線上教育、訂閱媒體、健身房會員制、二手交易平台
2. **訓練主題** — 想訓練實習生什麼能力？例：
   - 「會員 × 交易交叉分析」（前一輪用過）
   - 「funnel 漏斗轉換分析」
   - 「留存與回購分析」
   - 「A/B test 解讀」
   - 「流量歸因分析」
   - 「成本與毛利結構分析」

### 可選輸入（差異化指令）
3. **差異化偏好** — 想跟前一份範本有什麼不同？例：
   - 「這次用偏服務業的情境」「資料粒度要更細到週」「答案要更偏批判性質疑」「視覺風格要更暗色」「題目要更難一點」
   - 若無指定 → 套用「差異化套件」中的隨機組合（見模組 D）

如果使用者只說「換一個產業就好」，主動詢問訓練主題與差異化偏好；不要直接假設。

---

## 🗂️ 規格手冊架構

本手冊分為五大模組，**依此順序執行**：

```
模組 A：資料設計與驗證 (Data Validation)
   ↓
模組 B：視覺與互動規範 (Visual & Interaction Standards)
   ↓
模組 C：教學機制設計 (Pedagogical Mechanics)
   ↓
模組 D：差異化策略 (Differentiation Strategy)
   ↓
模組 E：交付檢核清單 (Delivery Checklist)
```

每個模組對應一個獨立文件，閱讀後依序執行：

- [`module-A-data.md`](./module-A-data.md) — 資料錨點、內部一致性、自檢機制
- [`module-B-visual.md`](./module-B-visual.md) — 色彩語意、版面、Chart.js 範本
- [`module-C-pedagogy.md`](./module-C-pedagogy.md) — 二維難度、F/I/A、陷阱設計
- [`module-D-diff.md`](./module-D-diff.md) — 視覺/教學/結構三軸差異化
- [`module-E-checklist.md`](./module-E-checklist.md) — 最終 QA、Playwright 自動驗證
- [`module-F-agents.md`](./module-F-agents.md) — Agent 工作流整合：角色分工、稽核門檻
- [`QUICKSTART.md`](./QUICKSTART.md) — 5 種對話情境的標準執行範例
- [`template.html`](./template.html) — 基準範本（B2C 電商會員 × 交易分析）

---

## 🔁 標準執行流程

當使用者觸發此 skill，依此流程操作：

### Phase 1 — 規格鎖定（不要寫 code）
1. 確認輸入：產業、訓練主題、差異化偏好
2. 列出**至少 3 頁、最多 4 頁**的儀表板結構，每頁有明確的「分析意圖」
3. 列出每頁 3-6 張圖表，標註：圖表類型、資料維度、預期教學作用
4. 列出每頁 4-8 道問題，標註：[L?·?] 二維難度標籤
5. 提供「資料錨點預告」：總會員、總訂單、總營收等核心數字
6. **此時等待使用者確認**，不要直接開工

### Phase 2 — 資料生成（依模組 A）
7. 用 Python 生成所有合成資料，並驗證內部一致性
8. 輸出 `DATA.json`（single source of truth），跑完整 assertion 後再進下一步
9. 任何 assertion 失敗都要先修資料

### Phase 3 — HTML 建構（依模組 B）

> **🛑 Phase 3 ENTRY CHECKPOINT — 動任何 Write/Edit 工具之前，必須先輸出以下聲明**
>
> 用文字向使用者聲明（不需等待回覆，聲明後立即執行）：
> ```
> 【Phase 3 分層建構計畫】
> Layer 1：骨架 + DATA + assertConsistency（Write tool，新建檔案）
> Layer 2：P1 所有圖表 + QA（Edit append）
> Layer 3：P2 所有圖表 + QA（Edit append）
> Layer 4：P3 + 收尾面板（Edit append）
> 每層完成後確認渲染正常再進下一層。現在開始 Layer 1。
> ```
>
> ⛔ 禁止省略此聲明直接進入 HTML 建構。強制輸出聲明的目的是讓模型在動工具前明確 commit 分層策略，防止靜默一次輸出整份 HTML。

> **🔴 大型建構強制採用「分層分批次」策略**
>
> 完整 dashboard HTML 約 1,200–2,000 行，單次輸出極易觸碰 32,000 token 輸出上限，導致連線中斷、檔案不完整寫入，且 agent 不報錯只是靜默截斷。
>
> **強制分 4 層依序建構，每層完成後確認再進下一層：**
>
> | 層次 | 內容 | 完成標誌 |
> |---|---|---|
> | **Layer 1 — 骨架** | HEAD + P4 CSS + `<body>` 結構（header/main-wrapper/def-panel/content-area 空殼）+ 完整 DATA 物件 + `assertConsistency()` + utility functions（`mk`, `c`, `TT`, `switchPage`, `goToChart`, `toggleDef`, `toggleQA`） | `assertConsistency()` 通過，console 無錯 |
> | **Layer 2 — P1 圖表+QA** | P1 所有 canvas 元素 + KPI HTML + `drawMember()` 完整實作 + P1 所有 QA items | P1 分頁開啟後所有圖表渲染，QA 可展開 |
> | **Layer 3 — P2 圖表+QA** | P2 所有 canvas 元素 + KPI HTML + `drawBehavior()` 完整實作 + P2 所有 QA items | P2 分頁開啟後所有圖表渲染 |
> | **Layer 4 — P3 + 收尾** | P3 所有 canvas 元素 + KPI HTML + `drawRetention()` + P3 QA + 訓練題面板 + 設計選擇面板 + 定義面板 `<dl>` 內容 | P3 渲染，面板可開合，assertConsistency 再跑一次 |
>
> **🔴 Layer 1 必填樣板（`<script>` 區塊最頂端，任何 Chart 實例化之前）：**
>
> ```javascript
> // ── Plugin registration ────────────────────────────────────────────
> Chart.register(ChartDataLabels);
> if (window.ChartAnnotation) Chart.register(window.ChartAnnotation);
> Chart.defaults.plugins.datalabels.display = false; // opt-in per chart
> ```
>
> 以及 `switchPage` 必須用 `setTimeout(60ms)` 包住所有 draw 呼叫：
>
> ```javascript
> function switchPage(name) {
>   document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
>   document.getElementById('page-' + name).classList.add('active');
>   document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
>   document.querySelector(`[onclick*="'${name}'"]`).classList.add('active');
>   if (!initialized[name]) {
>     initialized[name] = true;
>     setTimeout(() => { const fn = window['draw_' + name]; if (fn) fn(); }, 60);
>   }
> }
> ```
>
> **原因（entry 14-A/14-B/14-C in tech-notes）：**
> - ChartDataLabels CDN UMD 不自動 register；漏掉 → 所有 datalabels 靜默失效
> - `Chart.defaults.set('plugins.datalabels',...)` 在 v4 會拋錯；改用直接屬性賦值
> - switchPage 同步呼叫時 canvas size = 0×0，圖表空白；setTimeout 60ms 讓 DOM 完成顯示
> - annotation plugin global 是 `window.ChartAnnotation`，不是 `window['chartjs-plugin-annotation']`
>
> **執行規則：**
> - 每層用 **Write tool**（Layer 1）或 **Edit tool 追加**（Layer 2–4）寫入檔案，不要在 agent prompt 裡一次輸出整份 HTML
> - 若有 agent 協助，**每個 agent 只負責一層**，由主 Claude 把關資料數字正確性後再觸發下一層
> - Layer 1 完成後立即用瀏覽器開啟確認 `assertConsistency` 通過，再進 Layer 2
> - 任何層次寫入後發現資料錯誤，**先修 DATA 物件，再重跑 assertConsistency，再繼續**

10. 從 `Skill/template.html` 骨架開始，按 Layer 1–4 順序建構
11. Layer 1：注入 DATA 物件 + utility functions，確認 assertConsistency 通過
12. Layer 2–4：依模組 B 規範繪製所有圖表（用標準 mk() factory），依模組 C 規範撰寫問題與答案
13. 每層 Write/Edit 後在瀏覽器確認渲染正常再繼續

### Phase 4 — 差異化注入（依模組 D）
14. 從 **D.9 Preset 庫**選一個視覺套餐（P1–P7），覆蓋 `:root` tokens 與字型 import，不可與前一份相同
15. 從差異化套件（D.3）再抽 2–3 個教學軸 / 結構軸元素
16. 套用差異化標記，避免跟既有範本長太像

### Phase 4.5 — Design QA（視覺品質驗收）

> **🔴 ENTRY CHECKPOINT — 進 Phase 5 前必須完成此 Design QA，全部通過才可繼續**
>
> 執行順序（不需使用者確認，完成後輸出結果）：
> 1. 在瀏覽器打開 HTML，依序切換所有分頁
> 2. 依 **E.9 Design QA 清單** 逐項勾選（見 module-E-checklist.md）
> 3. 輸出 Design QA 報告（格式見 E.9）
> 4. 有任何 ❌ → 修復後重跑清單，直到全部 ✅

17. 切換每一個分頁（P1 → P2 → P3 → P4），目視確認所有圖表渲染正確（非空白）
18. 跑完 E.9 Design QA 18 項清單
19. 輸出 Design QA 結果摘要表格，並明確聲明「通過 N/18，可（或不可）進 Phase 5」

### Phase 5 — 驗收（依模組 E）
20. Playwright 自動測試（如環境支援）
21. 跑 E.1 完整 hard-check 清單（34 項）
22. 交付前產出 changelog：跟範本相比差異化了哪些

---

## ⚠️ 紅線（不可違反）

無論差異化做到什麼程度，以下不可違反：

1. **數字內部一致性** — assertConsistency() 必須通過所有檢查（模組 A）
2. **F/I/A 標註存在** — 所有 I/A 題的答案必須有明確標註
3. **陷阱區塊存在** — 所有 A 題與訓練題必須有 ⚠ 陷阱提示
4. **設計選擇揭露** — 最終必須有「📐 這份 Dashboard 的設計選擇」元層級區塊
5. **真實情境一致性** — 數字量級、季節性、品類佔比要符合該產業常識（例如餐飲連鎖的客單價不可能是 NT$50000）

---

## 📋 快速參考表

| 想做什麼 | 看哪個模組 |
|---|---|
| 設計新的合成資料集 | A.1 ~ A.3 |
| 確保數字內部一致 | A.4（assertion 9 條） |
| 選 chart 類型 | B.2 |
| 寫題目並標難度 | C.1（二維矩陣） |
| 寫答案的三段式 | C.2（觀察→推論→行動） |
| 選視覺 Preset（色票 + 字型） | D.9 |
| 選擴充圖表類型（Waterfall 等） | D.10 |
| 想跟前一份不同（三軸差異化） | D（全篇） |
| Design QA（Phase 4.5） | E.9（18 項視覺驗收） |
| 交付前完整檢查 | E.1（34 項 hard-check） |
| Agent 工作角色與稽核門 | F（全篇） |

---

## 🚀 啟動範例

```
使用者輸入：
「幫我做一份 SaaS 訂閱產品的儀表板，訓練主題是『流失分析與 cohort 留存』，
這次差異化希望：(1) 比上次更偏推論題；(2) 加入週粒度時間維度。」

執行步驟：
1. Phase 1 → 列出 3 頁結構（活躍指標 / cohort 矩陣 / 流失歸因）
                + 12 張圖表 + 18 道問題（L?·? 分佈）
2. 等使用者確認
3. Phase 2-5 依規範執行
```

詳細執行請參考各模組文件。
