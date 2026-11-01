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

模組是依主題分章的**參考手冊**，不是執行順序。**執行順序只以下方「🔁 標準執行流程」的 Phase 總表為準**——CLAUDE.md、QUICKSTART、module-F 都引用該表，不另行重述。

- [`module-A-data.md`](./module-A-data.md) — 資料錨點、內部一致性、自檢機制
- [`module-B-visual.md`](./module-B-visual.md) — 色彩語意、版面、Chart.js 範本
- [`module-C-pedagogy.md`](./module-C-pedagogy.md) — 二維難度、F/I/A、陷阱設計
- [`module-D-diff.md`](./module-D-diff.md) — 視覺/教學/結構三軸差異化、D.9 Preset 庫
- [`module-E-checklist.md`](./module-E-checklist.md) — 最終 QA、自動驗收（E.2）
- [`module-F-agents.md`](./module-F-agents.md) — Agent 工作流整合（選用）：角色分工、稽核門檻
- [`QUICKSTART.md`](./QUICKSTART.md) — 5 種對話情境的標準執行範例
- [`template.html`](./template.html) — 無數據骨架（取自餐飲連鎖版面，DATA 已清空，未完成處以 `__TODO:<說明>__` 佔位）；audit 對 template 依 E.2 的 template 模式判讀（例如 AC-01「未配置」為 WARN 而非 FAIL）

---

## 🔁 標準執行流程

### Phase 總表（唯一流程定義）

| Phase | 輸入 | 輸出 | 驗收（全過才進下一 Phase） |
|---|---|---|---|
| **1 規格鎖定** | 產業、訓練主題、差異化偏好；`Skill/ARCHIVE.md`（已用產業／preset／陷阱） | 規格初稿（結構、圖表、題目、資料錨點、教學軸／結構軸差異化方向）＋選定的 D.9 preset＋套好 preset 的工作檔 `Dashboard/<新檔>.html` | audit **PAL-01／PAL-02**（配色驗證；此時只判讀這兩條）；**使用者確認規格** |
| **2 資料生成** | 已確認的規格與資料錨點 | `dev/script/gen_data_<slug>.py` → DATA JSON → 注入工作檔；`assertConsistency()` 補上每個錨點的 `check()` | 生成器 assertions 全過；`inject_data.py` exit 0；audit **AC-01**（有效檢查 N>0 且全過） |
| **3 HTML 建構** | 工作檔（已有 preset＋DATA） | 各頁圖表＋QA＋收尾面板（分層建構） | 每層渲染正常、console 無錯；完成時 audit exit 0（含 **PH-01** 佔位符清空、**QA-01～06**） |
| **4 差異化落地** | 規格初稿的教學軸／結構軸方向；D.3 | 教學軸／結構軸元素落地＋差異化 changelog（D.6 範例 3） | D.5 不可妥協元素仍在（紅線 2–4） |
| **4.5 Design QA** | 完成的工作檔 | Design QA 報告（E.9 格式） | E.9 DQ 全 ✅ |
| **5 驗收與交付** | 工作檔 | E.5 交付物（HTML、生成器、ARCHIVE 條目、audit 結果） | `node dev/script/audit-dashboards.mjs Dashboard/<新檔>.html` exit 0；E.1 C 組人工項；ARCHIVE 條目（E.7） |

> 視覺軸（preset）在 Phase 1 就定案並驗配色——配色硬傷要在建構前換掉，不是交付前（ARCHIVE「配色驗證紀錄」的教訓）。Phase 4 只處理教學軸與結構軸。

### Phase → 需讀段落（分段載入）

不需要開工前把所有模組讀完——**進入哪個 Phase，就讀該列的段落**；其餘模組在用到時再查（見下方「📋 快速參考表」）。段落裡的「原因／歷史」細節在 `dev/tech-notes.md`，只在需要時查對應條號。

| Phase | 必讀 | 用到時再查 |
|---|---|---|
| **1 規格鎖定** | 本檔 Phase 1；`ARCHIVE.md` 跨份總覽；D.2–D.5（三軸差異化、必須差異化／不可妥協元素）；D.9（選 preset，含各 preset 的配色驗證註）；D.11（配色生成：換色／新背景／品牌色）；B.9-1（配色驗證判讀）；C.1（二維難度標籤）；A.2（錨點） | B.2（圖表選型）；C.4c（陷阱覆蓋矩陣）；C.9（題目分佈）；D.7（同主題不同切角）；D.10（擴充圖表） |
| **2 資料生成** | 本檔 Phase 2；A.1–A.4（錨點、衍生資料、assertConsistency 契約）；E.3（生成器端數值 hard-check） | A.5（產業量級）；A.6（月度節律）；A.7（生成器範例）；A.8（反模式） |
| **3 HTML 建構** | 本檔 Phase 3（含 template 行為契約與執行規則）；B.3–B.5（版面、mk() 合併契約、互動）；C.2–C.5、C.7–C.8（答案三段式、證據碼、陷阱、nav-hint、訓練題、設計選擇揭露） | B.6–B.9（字型、響應式、反模式、視覺驗收）；C.6（KPI 卡）；C.10（教學反模式）；`dev/tech-notes.md` #14–#26 |
| **4 差異化落地** | D.3–D.6（套件、不可妥協元素、changelog 範例 3） | D.8（差異化反模式） |
| **4.5 Design QA** | E.9（22 項）＋其報告格式 | B.9（視覺驗收規則原文） |
| **5 驗收與交付** | E.1、E.2（audit 規則）、E.5（交付物）、E.7（ARCHIVE 條目格式） | E.4、E.6、E.8 |
| 選用：派工 | `module-F-agents.md`（只在要分工時讀） | — |

### Phase 1 — 規格鎖定（只換 token，不寫結構）
1. 確認輸入：產業、訓練主題、差異化偏好；讀 `Skill/ARCHIVE.md` 跨份總覽
2. 列出儀表板結構（頁數依 D.2 結構軸：預設 3–4 頁），每頁有明確的「分析意圖」
3. 列出每頁 3-6 張圖表，標註：圖表類型、資料維度、預期教學作用
4. 列出每頁 4-8 道問題，標註：[L?·?] 二維難度標籤
5. 提供「資料錨點預告」：總會員、總訂單、總營收等核心數字
6. 定教學軸／結構軸差異化方向（D.3 抽 2–3 個元素，見 D.4／D.5）
7. **選 preset**：從 D.9 選一個，不可與前一份相同，優先選 ARCHIVE 中尚未使用的；複製 `Skill/template.html` 到 `Dashboard/{產業}_{主題}_訓練儀表板教材.html`，**只覆蓋 `:root`（含 `--font-head/--font-body/--font-mono`）與 Google Fonts import**——template 的 `c()`、Chart 預設色、TT 在執行期讀 CSS token，不需改 JS
8. **驗配色**：`node dev/script/audit-dashboards.mjs Dashboard/<新檔>.html`，只判讀 PAL-01／PAL-02（其餘規則此時本來就會 FAIL）；PAL FAIL → 用 D.11 產生器（`node dev/script/gen_palette.mjs --bg <bg> --anchor <不撞的色>`）換色後重跑，不要手挑。改背景或主色、或 top-3 難分高下時，依 D.11 開決策頁給使用者挑。門檻與實作見 B.9-1
9. **此時等待使用者確認**規格與 preset，不要直接開工

### Phase 2 — 資料生成（依模組 A）
固定管線：**情境 → 生成器 → assertions → JSON → 注入 → audit**

10. 情境：把錨點與各圖維度寫成 `dev/script/gen_data_<slug>.py`，共用 `dev/script/datagen_lib.py`（固定 seed、整數配額分配、assertion 收集——拒絕 NaN／inf）；欄位名對齊 template 的 DATA
11. assertions：生成器在輸出前跑 A.4 同一批檢查類別（E.3）；任何一條失敗就不輸出，先修生成邏輯
12. JSON：`python dev/script/gen_data_<slug>.py <out.json>`（另產 meta 側檔記 seed／schema／生成器版本）。JSON 是可重生的中間產物，放暫存路徑、不進 repo；生成器才是交付物
13. 注入：`python dev/script/inject_data.py <out.json> Dashboard/<新檔>.html`——寫進 `const DATA = /*__DATA__*/{…}/*__END__*/;`，標記須恰好一對、寫入後讀回比對、同輸入重跑結果不變；改資料一律改生成器再重跑這兩步，不手改 HTML 內的 DATA
14. `assertConsistency()`：為每個錨點補 `check(name, cond)`（A.4）
15. audit：確認 AC-01 有效檢查 N>0 且無 ✗

### Phase 3 — HTML 建構（依模組 B、C）

> **🛑 Phase 3 ENTRY CHECKPOINT — 動任何 Write/Edit 工具之前，必須先輸出以下聲明**
>
> 用文字向使用者聲明（不需等待回覆，聲明後立即執行）：
> ```
> 【Phase 3 分層建構計畫】
> Layer 1：骨架調整（頁數／頁 key／nav／switchPage 分派、各頁空殼）
> Layer 2…N：末頁以外的每個資料頁一層——該頁所有圖表 + QA（Edit）
> 最後一層：最後一頁 + 收尾面板（訓練題／設計選擇／定義面板）
> 每層完成後確認渲染正常再進下一層。現在開始 Layer 1。
> ```
>
> ⛔ 禁止省略此聲明直接進入 HTML 建構。強制輸出聲明的目的是讓模型在動工具前明確 commit 分層策略，防止靜默一次輸出整份 HTML。

> **🔴 大型建構強制採用「分層分批次」策略**
>
> 完整 dashboard HTML 約 1,200–2,000 行，單次輸出極易觸碰 32,000 token 輸出上限，導致連線中斷、檔案不完整寫入，且 agent 不報錯只是靜默截斷。
>
> **強制分層依序建構（Layer 1 骨架＋每個資料頁一層，3 頁 = 4 層、4 頁 = 5 層），每層完成後確認再進下一層：**
>
> | 層次 | 內容 | 完成標誌 |
> |---|---|---|
> | **Layer 1 — 骨架** | 工作檔已含 preset、DATA、`assertConsistency()` 與 utility functions（`mk`, `c`, `TT`, `switchPage`, `goToChart`, `toggleDef`, `toggleQA`，沿用 template 不重寫）；本層只調整頁數／頁 key／nav tab／`switchPage` 分派與各頁 `<div>` 空殼 | 頁面可切換，`assertConsistency()` 通過，console 無錯 |
> | **Layer 2…N — 每頁圖表+QA**（末頁以外每個資料頁一層） | 該頁所有 canvas 元素 + KPI HTML + 該頁的 `drawXxx()` 完整實作 + 該頁所有 QA items | 該分頁開啟後所有圖表渲染，QA 可展開 |
> | **最後一層 — 末頁 + 收尾** | 末頁的圖表＋QA（同上）+ 訓練題面板 + 設計選擇面板 + 定義面板 `<dl>` 內容 | 末頁渲染，面板可開合，assertConsistency 再跑一次 |
>
> **draw 函式命名**：沿用 template 的慣例——每頁一個 `draw` + 頁 key 的 PascalCase（template 的頁 key `ops`／`cust`／`deep` 對應 `drawOps()`／`drawCust()`／`drawDeep()`）；換頁 key 時 `switchPage` 的 `pages` 陣列與分派一併改。
>
> **🔴 template 已內建、不可拿掉的行為契約**（程式以 `Skill/template.html` 為準，本檔不另附可執行片段）：
>
> - **Plugin 註冊**（`<script>` 最頂端、任何 Chart 實例化之前）：`Chart.register(ChartDataLabels)`；annotation 用 `if (window.ChartAnnotation) Chart.register(window.ChartAnnotation)`；全域以直接屬性賦值 `Chart.defaults.plugins.datalabels.display = false` 關閉 label，各圖逐一 opt-in。
> - **Lazy render**：每頁的 draw 只在第一次切到該頁時執行；執行前等容器尺寸有效（非 0×0）才畫；**draw 成功才標記該頁已完成**，失敗會清掉已建的 Chart 實例，下次切頁可重試。改頁 key 時只改分派，不要改回「先標記再畫」或固定延遲。
> - **主題 token**：`c()`、Chart 預設文字／格線色、TT 背景在執行期讀 CSS 變數，換 preset 不需改 JS。
>
> **原因（tech-notes entry 14-A／14-C 與 2026-11-01 實測）：**
> - ChartDataLabels CDN UMD 不自動 register；漏掉 → 所有 datalabels 靜默失效
> - 全域關閉 datalabels 統一用直接屬性賦值（與 template 一致）。2026-11-01 以 Chart.js 4.4.0＋datalabels 2.2.0 headless Chrome 實測：`Chart.defaults.set('plugins.datalabels', { display: false })` **不拋錯**、無 console 錯誤，結果與直接賦值逐像素相同，雙軸 bar+line 與填色折線都正常渲染——舊稿「v4 會拋錯」不成立，統一寫法只是為了全專案一致（見 E.1 #27）
> - 切頁當下容器可能還是 0×0，同步 draw 會畫成空白——所以要等尺寸有效、且失敗可重試
> - annotation plugin global 是 `window.ChartAnnotation`，不是 `window['chartjs-plugin-annotation']`
>
> **執行規則：**
> - 每層用 **Edit tool** 寫入工作檔（Phase 1 已從 template 複製），不要在 agent prompt 裡一次輸出整份 HTML
> - **用 Edit 取代「開頭 tag＋佔位」時，old_string 必須連同該區塊對應的結尾 tag 一起取代**（或 new_string 不自帶結尾 tag）——否則每頁多一個 `</div>`，後面的分頁跑出內容區、圖表照畫、audit 照綠（tech-notes #26）
> - 若有 agent 協助，**每個 agent 只負責一層**，由主 Claude 把關資料數字正確性後再觸發下一層
> - 任何層次寫入後發現資料錯誤，**先改生成器、重跑 Phase 2 的 JSON＋注入，再重跑 assertConsistency，再繼續**

16. 按 Layer 1 → 各頁 → 收尾層的順序建構；圖表用 template 的 `mk()` factory（模組 B），問題與答案依模組 C
17. 每層 Edit 後在瀏覽器確認渲染正常再繼續
18. 全部層完成後跑 audit：exit 0（`__TODO:…__` 佔位符一個都不能留，PH-01）

### Phase 4 — 差異化落地（依模組 D，只處理教學軸／結構軸）
19. 落地 Phase 1 定下的教學軸／結構軸元素（D.3），視覺軸已在 Phase 1 定案、這裡不再換 preset
20. 核對 D.5 不可妥協元素仍在；輸出差異化 changelog（D.6 範例 3）

### Phase 4.5 — Design QA（視覺品質驗收）

> **🔴 ENTRY CHECKPOINT — 進 Phase 5 前必須完成此 Design QA，全部通過才可繼續**
>
> 執行順序（不需使用者確認，完成後輸出結果）：
> 1. 在瀏覽器打開 HTML，依序切換所有分頁
> 2. 依 **E.9 Design QA 清單** 逐項勾選（見 module-E-checklist.md）
> 3. 輸出 Design QA 報告（格式見 E.9）
> 4. 有任何 ❌ → 修復後重跑清單，直到全部 ✅

21. 切換每一個分頁，目視確認所有圖表渲染正確（非空白）
22. 跑完 E.9 Design QA 22 項清單
23. 輸出 Design QA 結果摘要表格，並明確聲明「通過 N/22，可（或不可）進 Phase 5」

### Phase 5 — 驗收與交付（依模組 E）
24. 跑 `node dev/script/audit-dashboards.mjs Dashboard/<新檔>.html`，**exit 0 才繼續**（E.2）
25. 跑 E.1 **C 組**人工判斷項（22 列；A 組已由上一步 audit 保證，B 組只在改過 template 對應程式時才跑）
26. 交付前在 `Skill/ARCHIVE.md` 新增本份條目（差異化與陷阱主題，見 E.5／E.7）

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
| 確保數字內部一致 | A.4（assertConsistency 契約＋基礎檢查類別） |
| 選 chart 類型 | B.2 |
| 寫題目並標難度 | C.1（二維矩陣） |
| 寫答案的三段式 | C.2（觀察→推論→行動） |
| 選視覺 Preset（色票 + 字型） | D.9 |
| 選擴充圖表類型（Waterfall 等） | D.10 |
| 想跟前一份不同（三軸差異化） | D（全篇） |
| Design QA（Phase 4.5） | E.9（22 項視覺驗收） |
| 陷阱分類與覆蓋矩陣 | C.4c |
| 視覺驗收規則（配色驗證器、單一值軸） | B.9 |
| 資料矛盾題／同統計量不同形狀 | C.7 T5、A 原則 6–7 |
| 自動驗收（assert／渲染／紅線元素） | E.2（`dev/script/audit-dashboards.mjs`） |
| 交付前完整檢查 | E.1（A 組 audit 自動／B 組 template 不變式／C 組人工，原 47 項） |
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
