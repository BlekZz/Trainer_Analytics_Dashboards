# 模組 E：交付檢核清單 (Delivery Checklist)

> **核心原則：交付前必須跑完所有檢查；任何一項失敗都不能交付。**

---

## E.1 交付檢核清單（依「誰保證」分三組）

> **2026-11-01 重組（Sprint 3.5）**：原「47 項 hard-check」依**由誰保證**分成 A／B／C 三組。`#N` 是**原編號，保留作對照**——SKILL、module-B／C／F、tech-notes 與 audit 規則說明以 `E.1 #N` 引用，照樣對得到。原項同時含「可自動檢查」與「須人工判斷」兩部分者拆成兩列、共用原編號（#2、#11、#18、#26、#47）。
>
> | 組 | 誰保證 | 何時跑 | 列數 |
> |---|---|---|---|
> | **A** audit 自動 | `dev/script/audit-dashboards.mjs`（規則見 E.2） | 每次改 `Dashboard/*.html` 後；**交付條件 = exit 0**，WARN 逐條判斷 | 23 |
> | **B** template 不變式 | `Skill/template.html` 已內建的程式／CSS | **只在改 template，或刻意改寫 template 提供的那段程式時**檢查；沿用 template 即已滿足 | 7 |
> | **C** 人工判斷 | 實作者＋獨立 reviewer | **交付時逐項人工跑**（Phase 5） | 22 |
>
> 合計 52 列 = 原 47 項 + 5 個拆列。判斷題（產業量級、F/I/A 是否標對、陷阱的教學價值）一律在 C 組，不交給 audit。

### A 組 — audit 自動（23 列）

看 audit 輸出即可，不必重複人工檢查；「備註」欄的人工部分已另列 C 組或寫明。

| 原 # | 項目 | audit 規則 | 等級 | 備註 |
|---|---|---|---|---|
| 2 | assertConsistency 全條通過，console 顯示 `✓ All data consistency checks passed (N checks)` 且 N > 0 | AC-01；〔未編號〕assertConsistency 存在、無 ✗／`console.error`／throw | FAIL | 檢查類別是否涵蓋 A.4 適用項 → C 組 #2 |
| 8 | 所有 datalabels 不被切：值軸 `max ≥ 1.2 ×` 資料最大值（stacked 取各 category 加總） | CH-02 | FAIL | 寫法：強制 `max = Math.ceil(maxVal × 1.2)`，禁用 suggestedMax；`layout.padding` 另見 CH-07 |
| 9 | 無 legend 顯示 "undefined"；單 dataset 圖 `legend.display: false` | CH-03 | FAIL | |
| 10 | 每題有難度標籤（L1–L3） | QA-01 | FAIL | 「並列兩個 chip」的外觀由 template CSS 提供 |
| 11 | 答案區有 F/I/A 標註（存在性；A 題含 `<span class="fia a">A</span>` 或等效標記） | QA-02 | FAIL | 標得對不對 → C 組 #11 |
| 12 | 每題有證據碼 `<span class="ev">圖名</span>` | QA-04 | WARN | 以題為單位；「每個具體數字後都有」的密度由人工抽查（C 組 #20 一併看） |
| 13 | 陷阱區塊在 A 題＋訓練題都存在 | QA-03 | FAIL | 陷阱有沒有教學價值屬人工（C.4），不在本列 |
| 14 | L3 跨頁推論題有 nav-hint | QA-06 | WARN | |
| 17 | 📐 設計選擇揭露區塊存在 | 〔未編號〕教學紅線元素存在（設計選擇／設計說明區塊） | FAIL | 條數（8 項或差異化指定數量）交付時順手核對 |
| 18 | 指標定義側板可開合 | IX-03 | FAIL | 內容是否填齊 → C 組 #18 |
| 22 | `Chart.register(ChartDataLabels)` 已執行 | 〔未編號〕ChartDataLabels 已 register | FAIL | |
| 23 | 每題答案有 `chart-ref-btn`；點擊切到正確分頁且目標 `card-{id}` 存在於該頁 | QA-05（WARN）、IX-04、〔未編號〕goToChart 目標不存在或不在所宣告分頁 | FAIL／WARN | |
| 24 | KPI 卡值不截斷（960／1440 寬 × 側板開關 × 每頁） | LY-02 | FAIL | `.kpi-value` 寫法見 B.7 |
| 25 | Bar／Column 依顯示值降序 | CH-10 | WARN | 時間軸／有序分箱自動跳過；多圖共享標籤時順序一致屬人工 |
| 26 | 雙 Y-axis 圖都有對應 `data-trap="雙軸假相關"` 的 trap-block | 〔未編號〕雙 Y-axis 圖沒有對應「雙軸假相關」trap-block | WARN | 值域 >10x 是否已拆圖／指數化 → C 組 #26 |
| 27 | 全域關閉 datalabels（`Chart.defaults.plugins.datalabels.display = false`），各圖逐一 opt-in | 〔未編號〕datalabels 預設未設 display=false | WARN | 統一用直接屬性賦值；2026-11-01 實測 `Chart.defaults.set()` 寫法在 4.4.0＋datalabels 2.2.0 也不出錯，統一只為一致 |
| 29 | 所有用到的 `.hNNN` 高度 class 有定義（容器高度 0 = 圖表不可見且不報錯） | 〔未編號〕每個 canvas 有 Chart 實例且尺寸非 0 | FAIL | template 已定義 `.h240`～`.h520`；新增高度 class 時才可能出錯 |
| 33 | 所有 `.findings-section` 預設坍縮，點標題列展開／再點收合 | 〔未編號〕findings-section 載入後未坍縮；IX-02 | FAIL | |
| 36 | `assertConsistency` 符合 A.4 寫法契約（`check(name, cond)`、`errors`、印 N） | AC-01 | FAIL（template WARN） | 舊格式（既有 8 份）以原始碼估算 N |
| 42 | findings 坍縮後內容（含 `<strong>`／`<br>`／裸 text node）完全不可見 | 〔未編號〕findings-section 載入後未坍縮 | FAIL | 判定看「看得到的內容」而非 class；需 `.findings-content` wrapper 的寫法見 tech-notes #21 |
| 45 | 每個 trap-block 有 `data-trap-stage`＋`data-trap`，整份涵蓋 ≥3 階段 | 〔未編號〕trap-block 缺 data-trap-stage／data-trap、涵蓋 <3 階段、同名 >2 次 | WARN | 可見 `.trap-tag` 外觀由 template CSS 提供；分類語意見 C.4c |
| 46 | 類別色通過配色規則 | PAL-01、PAL-02 | FAIL（PAL-02 6–8 為 WARN） | PAL WARN 或對比不足時，對應系列須有可見數字標籤（B.9-1）→ 人工確認 |
| 47 | bar 值軸從 0 起 | CH-01 | FAIL | `data-trap` 含「截斷」的刻意截斷軸自動豁免；單位／期間／不只靠顏色 → C 組 #47 |

### B 組 — template 不變式（7 列，只在改 template 時檢查）

沿用 `Skill/template.html` 的程式即已滿足；**改 template 或改寫下列程式時**逐項確認，並跑 `node dev/script/audit-dashboards.mjs Skill/template.html`。

- [ ] **#21. F/I/A 標籤系統在可見位置有說明** — template header Row 3（色彩語意＋難度＋F/I/A）已內建；改 header 或差異化移除 Row 3 時，須在 legend strip 或 def-panel 保留 F/I/A 三色含義，不可只在摺疊答案內使用
- [ ] **#28. lazy render 沿用 template 的 `switchPage` 契約** — 等容器尺寸有效（非 0×0）才 draw；**draw 成功才標記該頁完成**，失敗清掉已建的 Chart 實例、下次切頁可重試；不可退回「先標記再畫」或只靠固定延遲。換頁 key 時只改分派。（症狀由 A 組 #29 的 canvas 檢查兜底）
- [ ] **#30. 定義側板 sticky 定位結構正確** — `position:sticky; top:var(--header-h); height:calc(100vh - var(--header-h)); align-self:flex-start` 加在 `#def-panel-outer`（flex child）上；`#def-panel-inner` 只設 `height:100%; overflow-y:auto`。sticky 加在 `overflow:hidden` 的子元素上會靜默失效（tech-notes #16）。audit 不量 sticky：改 CSS 後須在瀏覽器開側板、捲動長頁，確認 `#def-panel-outer.getBoundingClientRect().top` 維持 = header 高（2026-11-01 template 實測：scrollY 0 → 1772 時 top 皆為 172）
- [ ] **#31. annotation plugin 用正確全域名稱 register** — CDN UMD 全域是 `window.ChartAnnotation`，**不是** `window['chartjs-plugin-annotation']`；script 頂部為 `if (window.ChartAnnotation) Chart.register(window.ChartAnnotation);`
- [ ] **#32. `mk()` 沿用 template 實作且符合合併契約** — 不另寫一份；契約見 B.4：tooltip／legend／datalabels 深合併，呼叫端提供 datalabels 設定而未寫 `display` 時注入預設 `display: true`
- [ ] **#40. 深色／淺色主題的 Chart.js 顏色適配** — template 的 `c()`、Chart 預設文字／格線色、TT 背景於執行期讀 CSS token（M2 2.1），換 preset 只改 `:root`；改這段 JS 時須以一組深色、一組淺色 preset 各開一次，確認 grid／ticks／datalabels 文字可讀
- [ ] **#41. FIA/L123 CSS 標準規格** — `.badge`、`.tag-f/i/a`、`.fia` **不含 `font-family`**（繼承 body 主字型）；`.fi-tag` **保留 `font-family: monospace`**；改這幾個 class 時確認無殘留 `JetBrains Mono` 設定

### C 組 — 人工判斷（22 列，交付時人工跑）

#### 資料
- [ ] **#1. DATA 物件為 single source of truth** — 沒有任何 hard-code 數字遊離在 DATA 之外（audit PH-01 只抓 `__TODO:` 佔位符，抓不到寫死的數字）
- [ ] **#2. assertConsistency 覆蓋面** — 條數因產業不同；模組 A.4 基礎檢查類別中本份資料適用者都要有，再加本產業追加項（逐類核對見 E.8 D5）。「全條通過且 N>0」由 A 組 #2 保證
- [ ] **#3. 數字量級符合產業常識** — 對照模組 A.5 常識量級表
- [ ] **#4. 月度節律符合產業** — 對照模組 A.6 節律模式庫
- [ ] **#5. 口徑差距控制在 5% 以內** — 如有故意保留差距當教學點，必須在答案中解釋
- [ ] **#35. 每個 KPI 滿足「可驗算性三選一」** — (1) 直接公式推算（AOV = 總收入 ÷ 總訂單）；(2) 分佈閉合（回購率 = ≤30天人數 ÷ 總顧客）；(3) DATA.anchors 中有配對原始值（`high_freq_revenue_wan: 8135` 使 58.3% × 13,954 可驗算）。不滿足任一條的 KPI 不得出現在 KPI card 上
- [ ] **#37. 指標計算層級與圖表呈現層級一致** — 只呈現品類資料的儀表板不可放 SKU 層級 KPI（如用品類資料計算 HHI 而非 SKU）；每個 KPI 手動用圖表可見資料反推一次，算得出才合法
- [ ] **#43. 散點圖象限分割線來自資料均值 + 封閉三角成立**（含散點圖才需檢查） — x/y 分割線使用實際資料均值（如 total_revenue / store_count / 12），非任意整數；若 x 軸由業務公式反推（如月均來客 = 年收入 ÷ AOV ÷ 12），assertConsistency 有 Check 驗算反推值誤差 < 1%（容差規則見 A.8 #6）
- [ ] **#44. 散點圖四象限都有代表點**（含散點圖才需檢查） — 依 A.8 #7：四個象限各有 ≥2 個點；只有「空象限本身是教學點」時可留空，且必須在設計選擇揭露說明，否則學員會以為是資料設計錯誤

#### 視覺
- [ ] **#6. 色彩語意 protocol 遵守** — 顏色用對語意（B.1），無 protocol 外的顏色出沒（PAL-01／02 只驗色差，不驗語意）
- [ ] **#7. 字型規範遵守** — 依所選 D.9 preset 的字型配對（標題／正文／數字三種角色齊備），Google Fonts import 與 `--font-head/--font-body/--font-mono` token 一致；P2 baseline 為 Lora / Outfit / JetBrains Mono（audit `--summary` 只列出字型組合，不判定）
- [ ] **#26. 值域差距 >10x 不用雙 Y-axis 硬塞** — 禁用對數刻度；預設拆兩張圖或以共同基期指數化到同一軸。雙 Y-axis 只允許作為刻意教學陷阱（trap-block 對應由 A 組 #26 檢查，另須在設計選擇說明，見 B.9-2）
- [ ] **#34. `new Chart()` 直接建立的圖表有 `maintainAspectRatio: false` 且容器有明確 height** — 雷達、氣泡、散點等不走 `mk()` 的圖表，options 必須有 `responsive: true, maintainAspectRatio: false`，容器必須有明確高度；截圖目視確認尺寸合理（雷達圖建議 240–320px）。audit 只抓尺寸為 0，抓不到「依寬度比例撐出的錯誤高度」
- [ ] **#47. 圖卡有單位與資料期間；≥2 系列不只靠顏色辨識** — 見 B.9-5／8（bar 值軸從 0 起由 A 組 #47 CH-01 檢查）

#### 教學
- [ ] **#11. F/I/A 標註正確** — 每段標的類型與內容相符（觀察／推論／行動），A 題確實是行動建議（標註存在由 A 組 #11 QA-02 檢查）
- [ ] **#15. 三段式答案結構符合 F/I/A 規範** — F 題只到觀察、I 題到推論、A 題完整四段
- [ ] **#16. 訓練題區塊存在於 P3 末（或差異化指定位置）** — 紫色 panel
- [ ] **#18. 指標定義面板填齊** — 所有 KPI 都有口徑說明（可開合由 A 組 #18 IX-03 檢查）
- [ ] **#19. 所有縮寫/專有名詞已在 def-panel 定義** — 用 `grep -oE '[A-Z]{2,5}'` 掃全文大寫序列，逐一確認 def-panel 有對應條目；無定義者不得出現在正文（YoY、pp、LTV、ROI、KPI、AOV 等均需覆蓋）
- [ ] **#20. 所有分析依據只引用儀表板呈現的數據** — F/I tag 中的每個數字需有圖表出處（畫面可讀，C.4b）；引用未呈現數據者必須改為 [A] tag 並說明來源假設
- [ ] **#38. 逆直覺設計點三處同步（若有）** — 任何刻意反常識的數據設計（如 VIP AOV < 常客 AOV），必須同時在：(1) DATA 數值本身、(2) 對應 QA 的 `trap-block`、(3) 設計選擇揭露面板 三處均呈現；缺少任一處學員會以為是 bug
- [ ] **#39. 刻意缺失維度兩處說明（若有）** — 任何刻意不展示的維度（如未拆外送 vs 自取），必須在：(1) 訓練題引導學員自行察覺、(2) 設計選擇揭露說明理由；不可靜默缺失

---

## E.2 自動驗證腳本（`dev/script/audit-dashboards.mjs`）

可執行腳本已落地於專案 `dev/script/audit-dashboards.mjs`（零依賴，Node 22+；經 CDP 驅動本機 Chromium／Chrome／Edge，找不到時設 `CHROME_PATH`）。**規則 ID 以腳本檔頭與 `RULES` 常數為準**，本表為對照：

```bash
node dev/script/audit-dashboards.mjs                       # 檢查 Dashboard/*.html
node dev/script/audit-dashboards.mjs Dashboard/新檔.html    # 只檢查指定檔
node dev/script/audit-dashboards.mjs --json out.json       # 另寫每份統計（頁數、圖數、QA、trap、assert 條數、最小 ΔE、各規則命中數…）
node dev/script/audit-dashboards.mjs --summary             # 結尾印跨份報表（題數／陷阱數、:root 色與字型組合重複、陷阱名稱頻率）
```

### 編號規則

| 規則 | 等級 | 意義 | 對應 |
|---|---|---|---|
| AC-01 | FAIL（template WARN「未配置」） | `assertConsistency` 有效檢查條數 N=0；新格式讀印出的 N，舊格式以原始碼估算 | E.1 #2 #36 |
| QA-01 | FAIL | 題目列缺難度標記（`.badge`／`.qa-level` l1–l3） | E.1 #10 |
| QA-02 | FAIL | 答案區缺 F/I/A 標註（含 `.ans-head.obs/.inf/.act` 改呈現變體） | E.1 #11、紅線 #2 |
| QA-03 | FAIL | A 題或訓練題缺 `.trap-block` | E.1 #13、紅線 #3 |
| QA-04 | WARN | 題目缺 `.ev` 證據碼 | E.1 #12 |
| QA-05 | WARN | 題目缺 `.chart-ref-btn` | E.1 #23 |
| QA-06 | WARN | L3 題缺 `.nav-hint` | E.1 #14 |
| PH-01 | FAIL（template WARN） | 原始碼殘留 `__TODO:` 佔位符 | SKILL Phase 3 步驟 18 |
| PAL-01 | FAIL（template WARN） | 正常視力類別色 ΔE < 15（OKLab×100，全部色對） | E.1 #46、B.9-1 |
| PAL-02 | FAIL（ΔE<6）／WARN（6–8）；template WARN | 色盲模擬（protan／deutan）類別色 ΔE 過近 | E.1 #46、B.9-1 |
| CH-01 | FAIL | bar 值軸 min > 0（`data-trap` 含「截斷」者自動豁免） | E.1 #47、B.9-6 |
| CH-02 | FAIL | 有向外 datalabels 的值軸 max < 1.2 × 資料最大值 | E.1 #8、DQ-1～3 |
| CH-03 | FAIL | legend 顯示 "undefined"／空白，或單一 dataset 卻顯示 legend | E.1 #9 |
| CH-04 | FAIL（部分切片無標籤為 WARN） | donut／pie 沒有任何可見 datalabels | B.4、DQ-7 |
| CH-05 | WARN | donut 第一片不在 12 點鐘（以實測 `arc.startAngle` 判定） | B.4、DQ-5 |
| CH-06 | WARN | donut／pie 超過 6 塊 | B.8 #5、B.9-4 |
| CH-07 | WARN | donut 有外部標籤但 `layout.padding` 最小邊 < 32 | DQ-8 |
| CH-08 | FAIL | 折線圖 `interaction.mode` ≠ `'index'` | B.5、DQ-11 |
| CH-09 | FAIL | 折線圖可見 dataset 的 `pointHoverRadius` < 10 | B.5、DQ-12 |
| CH-10 | WARN | 非時間軸、非堆疊 bar 未依值降序 | E.1 #25 |
| IX-01 | FAIL | 題目初始收合 → 點擊展開 → 再點收合 異常 | B.5 QA Toggle、B.8 #7 |
| IX-02 | FAIL | findings 點標題列展開／收合異常 | E.1 #33、DQ-17／18 |
| IX-03 | FAIL | 指標定義側板 初始關閉 → 開啟 → 關閉 異常 | E.1 #18 |
| IX-04 | FAIL | `.nav-hint`／`.chart-ref-btn` 點擊後分頁或目標錯誤 | E.1 #23 |
| LY-01 | FAIL | 水平溢出（960／1440 × 側板開關 × 每頁） | B.7 |
| LY-02 | FAIL | `.kpi-value` 截斷（同上矩陣） | E.1 #24、B.7 |

### 未編號檢查（沒有規則 ID，不能豁免）

| 等級 | 檢查 | 對應 |
|---|---|---|
| FAIL | `assertConsistency()` 存在，且無 ✗／`console.error`／throw | E.1 #2、紅線 #1 |
| FAIL | 載入期間無 uncaught exception | — |
| FAIL | Chart.js 已載入（未載入則其後的分頁／canvas／QA／CH／IX／LY 檢查全部略過） | — |
| FAIL | `ChartDataLabels` 已 register | E.1 #22 |
| FAIL | 依序 `switchPage` 每個分頁後，每個 canvas 都有 Chart 實例且尺寸非 0 | E.1 #28 #29、DQ-13 |
| FAIL | 教學紅線元素存在：`.qa-item`、`.trap-block`、F/I/A 標註、設計選擇／設計說明區塊 | E.1 #17、紅線 #2 #3 #4 |
| FAIL | 所有分頁在同一容器內（多一個 `</div>` 的症狀；檔頭未列，見程式訊息） | tech-notes #26 |
| FAIL | 初始頁面橫向溢出（檔頭未列；完整矩陣見 LY-01） | B.7 |
| FAIL | `goToChart(page, cardId)` 目標不存在或不在所宣告分頁（檔頭未列） | E.1 #23 |
| FAIL | findings-section 載入後未坍縮（判定可見內容，含裸 text node；檔頭未列） | E.1 #33 #42 |
| WARN | `Chart.defaults.plugins.datalabels.display !== false` | E.1 #27 |
| WARN | `<title>` 與檔名不一致 | 檔名規範 |
| WARN | trap-block 缺分類標記、涵蓋 <3 階段、同名陷阱 >2 次 | E.1 #45、C.4c |
| WARN | 雙 Y-axis 圖沒有對應「雙軸假相關」trap-block | E.1 #26、B.9-2 |
| WARN | PAL 跳過（頁面沒有 `c()` 或類別色無法解析） | — |

### template 模式與豁免機制

- **template 模式**：以路徑 `<repo>/Skill/template.html` 辨識（刻意不用標記，避免成品殘留標記而降級）。此路徑下 AC-01、PH-01、PAL-01／02 降為 WARN（DATA 未填、佔位符未換、preset 未選）；其餘規則與成品相同，template 本身須無 FAIL。
- **豁免表**：腳本內 `EXEMPTIONS` 常數（檔名 × 規則 ID × `items` × 理由）。`items` 是命中 key（題目 `<page id>/<題號>`、canvas id、色對、佔位符…），省略則該檔該規則全部豁免；豁免項照印（⊘）但不計 FAIL／WARN，同檔新增的命中仍會報。只有**有規則 ID 的檢查**能豁免。
- **何時可加豁免**：既有成品的命中修正須改內容（Sprint 總原則 2），或屬刻意圖型設計（如 SaaS 瀑布圖 CH-01），每筆寫明理由。**新 dashboard 原則上不加豁免**——命中就修。

Exit code：`0` 全部無 FAIL／`1` 有 FAIL／`2` 環境錯誤。**交付條件 = exit 0**；WARN 逐條判斷是否為刻意差異化。
腳本不覆蓋的是 E.1 **C 組**（判斷題與語意）與 **B 組**（只在改 template 時檢查），以及 E.9 中標〔人工〕的項目。

---

## E.3 必驗證的數值 hard-check

生成器（Phase 2）在輸出 JSON 前，用 Python 對**同一批 A.4 檢查類別**先跑一次 assert——瀏覽器端的 `assertConsistency()` 是第二道。欄位名對齊 `Skill/template.html` 的 DATA；本份資料沒有的結構就略過該條，有的就必須寫。實際寫法見 `dev/script/gen_data_medaesthetic.py`。

```python
A = DATA['anchors']   # DATA = 生成器即將輸出的 dict

# 1. 分群／分佈人數合計 = 總顧客（A.4 ①②）
for key in ['customer_tier', 'frequency']:
    s = sum(DATA[key]['counts'])
    assert s == A['total_customers'], f"{key} 合計 {s} ≠ {A['total_customers']}"

# 2. 時序流量合計 = 總流量（A.4 ③）
assert sum(DATA['monthly_visits']) == A['total_visits']

# 3. 月度堆疊、單位分佈合計 = 年度營收錨點（A.4 ④⑤）
monthly_sum = sum(sum(v) for v in DATA['monthly_category'].values())
assert monthly_sum == A['total_revenue_wan'], f"月度品類合計 {monthly_sum} ≠ {A['total_revenue_wan']}"
assert sum(DATA['store_revenue']) == A['total_revenue_wan']

# 4. 互補佔比每期 = 100（A.4 ⑥）
for i in range(12):
    s = DATA['dine_takeout']['dine_in_pct'][i] + DATA['dine_takeout']['takeout_pct'][i]
    assert s == 100, f"Month {i+1} dine+takeout {s} ≠ 100"

# 5. 派生 KPI 與錨點交叉（A.4 ⑦⑧）
assert abs(A['total_revenue_wan'] * 10000 / A['total_visits'] - A['aov']) <= 1, "AOV 不一致"
assert abs(A['high_freq_revenue_wan'] / A['total_revenue_wan'] * 100 - A['high_freq_contribution']) <= 0.1

# 6. 散點封閉三角 < 1%（A.4 ⑨；容差規則見 A.8 #6）
for s, rev in zip(DATA['scatter_data'], DATA['store_revenue']):
    assert abs(s['x'] * s['y'] * 12 / 10000 - rev) / rev < 0.01, f"{s['label']} 封閉三角超出 1%"

print("✓ generator assertions passed")
```

---

## E.4 視覺驗證（人工/AI 視覺檢查）

跑完自動驗證後，用 Playwright 截圖三頁，人工或 AI 視覺檢查：

| 檢查項 | 標準 |
|---|---|
| 整體調性是否統一 | 色系一致、無突兀字體 |
| Findings 是否視覺貼合圖表 | 左側 4px 主色邊 + 較深背景 |
| KPI 卡視覺權重不過大 | 不擠壓 QA 區 |
| 圖表 datalabels 不被切 | 所有最高 bar 標籤完整顯示 |
| nav-hint 黃色卡視覺顯眼 | 摺疊時隱藏、展開時清楚 |
| trap-block 紅色提示 | 與正向綠 QA 形成對比 |
| meta-panel 在最末尾 | 不被 P3 主內容淹沒 |

---

## E.5 交付物清單

最終交付給使用者的內容：

```
1. Dashboard/{產業}_{分析主題}_訓練儀表板教材.html   # 完整可獨立打開的 HTML 檔（DATA 已注入）
2. dev/script/gen_data_<slug>.py                      # 資料生成器（改數字改這裡，不手改 HTML 的 DATA）
3. Skill/ARCHIVE.md 新增一筆 Dashboard #N             # 格式見 E.7，含差異化與陷阱主題
4. audit 結果                                          # `node dev/script/audit-dashboards.mjs <新檔>` exit 0，回報時附實際輸出摘要（含 N checks）
```

資料流程：`python dev/script/gen_data_<slug>.py <out.json>` → `python dev/script/inject_data.py <out.json> <html>`（第 8 份起的實際做法）。截圖（Design QA，E.9）用於驗收過程，不另列交付物。

ARCHIVE 條目與交付時的差異化說明（E.6）合計必包含：
- 跟前一份相比的視覺軸差異
- 跟前一份相比的教學軸差異
- 跟前一份相比的結構軸差異
- 此份特有的陷阱主題（至少 3 個）
- 訓練題切角（4 道分別訓練什麼能力）

---

## E.6 交付前最終話術

交付時必須附上一段「使用建議」給使用者，例如：

```
這份 [產業] 訓練 dashboard 已生成完畢，重點訓練 [主題] 的 [能力]。

差異化亮點：
- 視覺：[簡述]
- 教學：[簡述]
- 結構：[簡述]

建議使用方式：
1. 給實習生時，先讓他們花 10 分鐘看完全頁不開答案
2. 接著要他們嘗試回答 4 道 L1·F 暖身題（建立直覺）
3. 再挑 2-3 道 L2·I 推論題討論（訓練思考路徑）
4. 最後留訓練題作回家作業（綜合能力）
5. 復盤時聚焦 ⚠ 陷阱區塊 — 那是真正的學習點

注意事項：
- 這是合成資料（DEMO chip 已標示），不可用於真實業務決策
- 如要修改數字，請改 DATA 物件而非 HTML 文案，否則會破壞內部一致性
- 設計選擇揭露區塊本身就是教學內容，建議引導學員閱讀並質疑
```

---

## E.7 後續迭代記錄

每生成一份新 dashboard，更新此 skill 旁的 `ARCHIVE.md` 記錄：

```markdown
## Dashboard #N | 2026-05-XX
- 產業：[XXX]
- 訓練主題：[YYY]
- 錨點：[ZZZ]
- 差異化亮點：[簡述三軸差異]
- 陷阱主題：[列出此份特有陷阱]
- 使用反饋：[實習生反應、什麼題目卡住、什麼陷阱奏效]
```

這份 archive 可以反饋到下一份生成，避免重複差異化模式、累積有效陷阱主題庫。

---

## E.8 交付後二次 QA 流程（強制）

> **原則：寫完檔案後，先宣告讓 user 做視覺審核，同時 Claude 讀取實際寫入的檔案進行資料層 QA。兩條線並行，不等 user 確認再開始。**

### 執行順序

```
1. Write tool 寫入檔案
2. 立即宣告：「檔案已寫入，請打開瀏覽器進行視覺審核。我同步開始讀取實際檔案做資料 QA。」
3. 用 Read tool 讀取實際寫入的 HTML（不是記憶中的內容）
4. 依以下清單逐項交叉驗算
5. 視覺審核與資料 QA 結果同時回報給 user
```

### 資料層二次 QA 清單（讀取實際檔案後逐項執行）

#### D1 — KPI 定義與分佈資料封閉性
對每個 KPI card 找到其對應的分佈圖，驗算「KPI = 分佈加總 or 衍生」：

| KPI | 驗算公式 | 常見破口 |
|---|---|---|
| 回購率 X% | X% × total_customers = ≤時間窗口桶加總 | 時間窗口切法不一致 |
| 活躍率 / VIP 佔比 | 分子人數 ÷ total_customers | 定義面板說的門檻 ≠ 頻率分佈切點 |
| AOV | total_revenue_wan × 10000 ÷ total_visits | monthly_aov 若硬編需逐月驗算 |
| YoY 成長 % | (新值 ÷ 舊值 − 1) × 100，舊值必須在 HTML 中呈現 | 舊值寫在文案但 DATA 沒有 |

#### D2 — 跨陣列 identity 確認
驗算「兩個不同資料結構描述同一群人」：
- 頻率分佈某幾段 = tier 某個層級人數（須由業務定義鎖住，定義面板必須說清楚門檻）
- 若有子集合（活躍客、轉換客），確認 子集合人數 + 非子集合人數 = total

#### D3 — 衍生欄位不能硬編
如果 DATA 裡有 `monthly_aov`、`monthly_churn` 等逐月欄位：
- 確認它們是否由 `monthly_revenue ÷ monthly_visits` 等公式動態計算
- **禁止** 在 DATA 物件中硬編逐月衍生值，必須改為 `const derivedArr = labels.map(...)` 在 drawXxx() 中即時計算

#### D4 — 多維資料封閉三角
若有散點圖 (scatter) 同時呈現 A × B 兩個維度，且還有第三個一維資料 C：
- 驗算：`A[i] × B[i] × 轉換因子 ≈ C[i]`，誤差 < 1%（容差統一規則見 A.8 #6）
- 1%–5% 只允許作為刻意口徑差教學點，且須在答案與「設計選擇揭露」中解釋；> 5% 一律修正數字

#### D5 — assertConsistency 覆蓋率確認
讀取 assertConsistency 函式，確認以下幾類都有覆蓋：
- [ ] 人數類加總（各分群 = total_customers）
- [ ] 百分比類加總（各月 sum = 100）
- [ ] 業績類加總（月度堆疊 = 年度錨點）
- [ ] 派生 KPI 反推（AOV, 佔比等）
- [ ] **新增：** 時間窗口類 KPI 與分佈圖封閉（回購率、留存率等）
- [ ] **新增：** 跨陣列 identity check（頻率段 = tier count）

### 二次 QA 回報格式

```markdown
## 二次資料 QA 結果

### ✅ 通過
- assertConsistency 10 項全通過（console log 確認）
- 回購率 KPI ↔ 分佈桶封閉：21,462 = 58,320 × 36.8% ✓
- VIP 定義門檻（年12+次）↔ tier 人數（12,480）↔ 頻率段加總 ✓
- AOV 由月度資料動態衍生，無硬編 ✓

### ⚠️ 發現問題（若有）
- [問題描述 + 建議修法]
```

---

## E.9 Design QA 清單（Phase 4.5 專用，22 項）

> 在 Phase 4.5 執行，瀏覽器開啟後目視 + 原始碼逐項確認。
> 標 **〔A：規則 ID〕** 者已由 audit 自動檢查，看 audit 輸出即可（不必重複目視）；標 **〔人工〕** 者才需目視／原始碼確認。覆蓋：〔A〕12 項（DQ-1～3、5、7、8、11～13、18～20；其中 DQ-2／7／8／13 仍有括號內註明的目視部分），〔人工〕10 項（DQ-4、6、9、10、14～17、21、22；DQ-4／17 有 audit 兜底的部分）。
> **全部 ✅ 才能進 Phase 5。有任何 ❌ 必須修復後重跑。**

### 軸域設定（4 項）

- [ ] 〔A：CH-02〕 **DQ-1. Bar / horizontal bar：軸 max 已設定** — 所有帶 `datalabels { anchor:'end' }` 的圖，對應值軸有明確 `max`，公式為 `Math.ceil(Math.max(...data) * 1.2)`（或取整到合適單位）；確認最高 bar 標籤完整可見，不被截
- [ ] 〔A：CH-02；max 由加總動態計算而非硬編屬人工〕 **DQ-2. Stacked bar：動態加總 max** — Y 軸 `max` 由所有 category 加總最大值 × 1.2 動態計算，非硬編；公式：`Math.ceil(Math.max(...labels.map((_,i) => datasets.reduce((s,ds)=>s+ds.data[i],0))) * 1.2 / rounding) * rounding`
- [ ] 〔A：CH-02〕 **DQ-3. 折線圖 Y 軸 max（如有 datalabels）** — 若折線圖啟用 datalabels，同樣設 `max = Math.ceil(Math.max(...data) * 1.2)`；若無 datalabels 則 auto-scale 可接受
- [ ] 〔人工；雙軸 trap 對應由 audit 未編號 WARN 檢查〕 **DQ-4. 值域比例差距檢查** — 找出同一圖表最大值 / 最小非零值比率；若 > 10x，確認已拆圖或指數化（雙 Y-axis 僅限 B.9-2 的教學陷阱），且最小值組有足夠可見高度（bar ≥ 3% 可見 ≈ 目視可辨識）

### Donut / Pie 規範（4 項）

- [ ] 〔A：CH-05 WARN〕 **DQ-5. 第一片從 12 點鐘起畫：不設 `rotation`（或設 `0`），不可設 `rotation: -90`** — Chart.js 4.4.0 預設即 12 點鐘，`-90` 會變 9 點鐘（B.4，2026-11-01 實測）；打開頁面後直觀確認最大佔比切片從正上方順時針開始
- [ ] 〔人工；CH-10 只看 bar〕 **DQ-6. 資料陣列降序排列** — DATA 中對應 donut 的資料已依值從大到小排列（或生成時確認排序）
- [ ] 〔A：CH-04；標籤重疊／截斷目視〕 **DQ-7. 全項目 datalabels 顯示** — `display: true`（無條件閾值過濾），所有切片（包括最小）都有外部標籤顯示「品項名稱 + 佔比%」；目視確認標籤無重疊或被圖框截斷
- [ ] 〔A：CH-07 WARN；legend 關閉屬人工〕 **DQ-8. `layout.padding ≥ 32`** — 確認 options 中有 `layout: { padding: 32 }`（或等效值）預留外部 datalabels 空間；legend 應設 `display: false`（已由 datalabels 提供品項資訊）

### Stacked Bar 規範（2 項）

- [ ] 〔人工〕 **DQ-9. 頂端加總 label** — 最後一個 dataset 的 datalabels 顯示該 category 所有 segment 的加總值，`anchor:'end', align:'end'`；目視確認每個 stacked bar 頂端有總量數字
- [ ] 〔人工〕 **DQ-10. Tooltip 顯示各段佔比** — tooltip callback 輸出格式為 ` {label}: {raw} ({pct}%)`；hover 任一 segment 確認顯示百分比

### 互動體驗（2 項）

- [ ] 〔A：CH-08〕 **DQ-11. 折線 / 面積圖 hover 觸發範圍** — `interaction: { mode: 'index', intersect: false }` 已設定；測試：在曲線上任意 X 位置（不需精準對到 point）移動游標，tooltip 應即時出現
- [ ] 〔A：CH-09〕 **DQ-12. `pointHoverRadius ≥ 10`** — 折線圖 dataset 的 `pointHoverRadius` 設定 ≥ 10（預設 4 太小）；確認 hover 時 point 視覺放大明顯

### 跨頁渲染（2 項）

- [ ] 〔A：未編號 canvas 渲染檢查；≤200ms 目視〕 **DQ-13. 非首頁圖表正確渲染** — 依序點擊 P2、P3、P4 tab，確認每頁圖表在切換後 ≤ 200ms 完整渲染（非空白 canvas）；`switchPage` 符合 E.1 #28 的 lazy render 契約（等尺寸有效、成功才標記、失敗可重試）
- [ ] 〔人工；audit 會切到首頁，不區分「不點擊」〕 **DQ-14. 首頁不點擊即正確渲染** — 開啟頁面不做任何點擊，P1 圖表應已完整渲染；首頁同樣經 `switchPage` 的 lazy render 契約進入（沿用 template 的初始化，不另寫同步 draw）

### 版本標記 & 程式結構（4 項）

- [ ] 〔人工〕 **DQ-15. `syncHeaderHeight` 函數存在且位置正確** — 主 `<script>` 末（`</script>` 之前）有 `syncHeaderHeight` 函數，且綁定在 `window.addEventListener('load', ...)` 和 `window.addEventListener('resize', ...)`；**不可放在 `DOMContentLoaded` 內**（load 事件在字型載入後才觸發，DOMContentLoaded 會得到錯誤高度）
- [ ] 〔人工〕 **DQ-16. 製作時間 chip 格式正確** — header 中的 chip 格式為 `🗓️ 製作時間：YYYYMMDD`（含中文前綴、無空格、8 位日期）；每次修改後日期同步更新為當日；grep `製作時間` 確認格式
- [ ] 〔人工 grep；toggle 互相抵消的症狀由 IX-02 抓〕 **DQ-17. 只有一個 `DOMContentLoaded` handler** — grep `DOMContentLoaded` 確認全文只有一個 handler；若有多個，findings label 會因重複 click 綁定而 toggle 互相抵消（點了沒反應）；合併為單一 handler 或確認各自不重複操作同一元素
- [ ] 〔A：未編號 findings 坍縮檢查＋IX-02〕 **DQ-18. findings-section collapse 真正生效** — 目視確認 findings 區塊在頁面載入後預設坍縮（只見標題 + 箭頭）；若含 `<strong>`/`<br>`/raw text node 的 findings-section 坍縮後仍有內容可見，需加 `.findings-content` wrapper（entry 21）

### 視覺驗收（4 項，2026-10-14 新增，見 B.9）

- [ ] 〔A：PAL-01／PAL-02〕 **DQ-19. 配色驗證器通過** — 執行 B.9-1 的指令，貼上結果；硬傷（正常 ΔE < 15、色盲 ΔE < 6）必須換色後重跑
- [ ] 〔A：未編號雙軸 WARN〕 **DQ-20. 一張圖一條值軸** — 每個雙 Y-axis 圖都能對到一個 `data-trap="雙軸假相關"` 的 trap-block；對不到就拆圖
- [ ] 〔人工〕 **DQ-21. 標題、單位、期間** — 抽 3 張圖卡確認標題寫洞見（或設計選擇有說明為何不寫）、軸有單位、圖卡標資料期間
- [ ] 〔人工〕 **DQ-22. 不只靠顏色** — ≥2 系列的圖都有 legend，≤4 系列另有直接標籤

---

### Design QA 輸出格式

Phase 4.5 結束後，輸出以下格式的報告（不需等使用者確認，直接輸出後告知結果）：

```markdown
## Design QA 結果（Phase 4.5）

| # | 項目 | 狀態 | 備註 |
|---|---|---|---|
| DQ-1 | Bar 軸 max（20% headroom） | ✅ | ch-abc-restock: xMaxOrders=190k |
| DQ-2 | Stacked bar 動態 max | ✅ | ageMax=1150 |
| DQ-3 | 折線圖 Y 軸 max | ✅/N/A | 無 datalabels，auto-scale 可接受 |
| DQ-4 | 值域比例 <10x | ✅ | 最大比率 5.3x（ch-turnover） |
| DQ-5 | Donut 12 點鐘起畫（未設 rotation:-90） | ✅ | |
| DQ-6 | Donut 降序排列 | ✅ | |
| DQ-7 | Donut 全項目 datalabels | ✅ | |
| DQ-8 | Donut layout.padding≥32 | ✅ | |
| DQ-9 | Stacked bar 頂端加總 | ✅ | ch-inv-age |
| DQ-10 | Stacked bar tooltip 佔比 | ✅ | |
| DQ-11 | 折線圖 hover mode:index | ✅ | ch-stockout-monthly |
| DQ-12 | pointHoverRadius≥10 | ✅ | 12 |
| DQ-13 | 非首頁渲染正確 | ✅ | P2/P3/P4 均正常 |
| DQ-14 | 首頁不點擊即渲染 | ✅ | 經 switchPage 契約 |
| DQ-15 | syncHeaderHeight 位置正確 | ✅ | window.load/resize 綁定 |
| DQ-16 | 製作時間 chip 格式 | ✅ | 🗓️ 製作時間：20260614 |
| DQ-17 | DOMContentLoaded 不重複 | ✅ | grep 確認只有 1 個 |
| DQ-18 | findings collapse 真正生效 | ✅ | 目視確認坍縮 |
| DQ-19 | 配色驗證器 | ✅ | 正常 ΔE 20.7／色盲 11.1 |
| DQ-20 | 單一值軸 | ✅ | 雙軸 1 張，對應 trap-block 雙軸假相關 |
| DQ-21 | 標題／單位／期間 | ✅ | |
| DQ-22 | 不只靠顏色 | ✅ | |

**通過 22/22 → ✅ 可進 Phase 5**
```

若有 ❌ 項目，明確列出：
```
❌ DQ-7 Donut 全項目 datalabels — 最小切片（7.2%）datalabels 被截斷
   → 修復：調整 layout.padding 至 40 或字型縮至 size:9
```
