# Sprint：第 9 份 — 數位廣告投放 ROAS 與 A/B 測試分析

- 起始：2026-11-01（claude）｜Phase 1 規格經 Blake 確認（同日）
- 工作檔：`Dashboard/數位廣告投放_ROAS與AB測試分析_訓練儀表板教材.html`（已由 `Skill/template.html` 複製並套 preset）
- 流程：`Skill/SKILL.md` Phase 總表（本檔只記本份規格與 milestone，不重述流程）

## Blake 確認的決定

1. 情境／4 頁結構／錨點量級：照初稿。
2. 視覺：P1 色彩（`#08141A` 底，PAL 已過：正常 17.0／色盲 12.0），**字型改自訂**：Sora（標題）× Manrope（內文）× Fira Code（數字）——與前 8 份皆不同。
3. 統計深度：**直覺推導**（圖像化說明信賴區間、p 值、樣本數與檢定力），不放公式推導。
4. **題目知識領域比例三等分**：數據分析 : 行銷專業 : 產業知識 = 1 : 1 : 1（19 題＋5 訓練題＝24 → 各 8 題）。

## 情境

代理商替虛構 DTC 保養品牌「澄研」操盤 2025 全年投放：Meta、Google 搜尋、Google PMax、YouTube、LINE；Q3 做落地頁 A/B 測試與 8 支素材測試；Q4 做 Meta 再行銷的地理 holdout 增量測試。

## 錨點（暫定量級，由生成器定案；不得用整數結尾）

| 錨點 | 量級 |
|---|---|
| 年度總花費 | ≈ 1,286 萬 |
| 後台實際訂單 | ≈ 41,873 |
| 後台實際營收 | ≈ 5,147 萬（AOV ≈ 1,229） |
| 混合 ROAS（後台營收 ÷ 總花費） | ≈ 4.0 |
| 新客數 | ≈ 18,529 |
| 各平台自報歸因營收加總 | ≈ 實際營收 × 1.43（口徑差教學點，非錯誤） |
| 毛利結構 | 商品成本 ≈ 32%、退貨 ≈ 6%（毛利 ROAS 用） |

產業常識約束：保養品 DTC 季節性（母親節 5 月、618、雙 11、週年慶 10 月、Q4 CPM 上漲）、回購週期約 60–90 天、iOS ATT 後平台歸因訊號流失、化粧品廣告不得宣稱療效（素材題可用）。

## 結構（4 頁，決策鏈：看成效 → 驗口徑 → 驗實驗 → 分預算；全部單一值軸）

| 頁 key | 頁名 | 分析意圖 | 圖表 |
|---|---|---|---|
| `ovw` | 投放總覽 | 錢花在哪、帶回多少 | 月度花費；月度後台營收；通路花費占比 donut；各通路平台自報 ROAS；月度新客 CPA |
| `attr` | 歸因口徑 | 同一筆訂單被幾個平台認領 | 平台自報 vs 後台訂單（各通路）；三種歸因模型 ROAS（last-click／7 日點擊＋1 日瀏覽／資料驅動）；轉換延遲分布（當天／1 天／2–7 天／8–28 天）；各通路新客 vs 舊客占比；品牌字 vs 非品牌字搜尋 |
| `ab` | A/B 測試 | 實驗結果能不能信 | 每日累積轉換率 A/B＋95% CI 帶；逐日累積 p 值（偷看）；逐週 lift（新奇效應）；8 支素材 CTR＋CI（多重比較／贏家詛咒）；裝置別結果 |
| `budget` | 預算決策 | 下一塊錢放哪 | 花費級距 vs 邊際 ROAS（報酬遞減）；地理 holdout 增量 ROAS vs 歸因 ROAS；營收 ROAS vs 毛利 ROAS（損益兩平線）；收尾面板 |

A/B 資料設計：28 天、每組約 2.1 萬訪客；第 5 天 B 領先約 +30% 且 p<0.05（偷看會誤判），28 天終局 lift 約 +4–6%、p 介於 0.05–0.2（不顯著）；逐週 lift 遞減（新奇效應）。素材：8 支 CTR 點估計最高者 CI 與他支大幅重疊。Holdout：Meta 再行銷歸因 ROAS ≈ 9.8、增量 ROAS ≈ 1.6（T5 資料矛盾題）。

## 題目

- 分佈：批判型（C.9）——19 題＋5 訓練題（訓練題拆到各頁末尾），L2·A／L3·A 為主。
- 每題加**知識領域標記**（新教學元素）：`data-domain="data|mkt|ind"`，題目列顯示 chip「📊 數據分析／📣 行銷專業／🏭 產業知識」；24 題各 8（含訓練題）。
- **逐頁配額（Phase 3 各層照此寫，合計 = 19 題＋5 訓練題，領域各 8）**：

  | 頁 | 一般題（難度標籤） | 訓練題 | 領域 data／mkt／ind |
  |---|---|---|---|
  | ovw | L1·I、L1·A、L2·F、L2·I、L2·A | T1 | 2／2／2 |
  | attr | L1·I、L2·F、L2·A、L3·I、L3·A | T2 | 2／2／2 |
  | ab | L1·A、L2·I、L2·A、L3·A、L3·F | T3 | 2／2／2 |
  | budget | L2·A、L3·I、L3·A、L3·A | T4、T5（T5＝資料矛盾題：歸因 vs 增量 ROAS） | 2／2／2 |

  每頁 6 項中哪題屬哪個領域由該層決定，但每頁須恰好 2／2／2。
- 陷阱（4 階段全滿，C.4c 標記）：整理｜重複歸因（口徑不一致）；加工｜平均數陷阱（平均 vs 邊際 ROAS）、多重比較；呈現｜隱藏不確定性；解讀｜提早偷看（peeking）、相關≠因果（再行銷撿現成）、新奇效應、單指標決策（ROAS 高≠賺錢）。同名 ≤2 次。

## 差異化（D.2–D.5）

- 視覺：P1 色彩＋全新字型組合。
- 教學：批判型分佈；T5 資料矛盾題（歸因 vs 增量 ROAS）；定義面板含「業界常見替代定義」（歸因模型、p 值、檢定力）；知識領域 chip。
- 結構：訓練題拆到每頁末尾。

## Milestones

| M | Phase | 內容 | QA |
|---|---|---|---|
| M1 | 2 | `dev/script/gen_data_adroas.py`（共用 datagen_lib）→ JSON → `inject_data.py` → `assertConsistency()` 每錨點 `check()` | 生成器 assertions 全過；inject exit 0；audit AC-01 N>0 全過 |
| M2 | 3 | Layer 1 骨架（4 頁 key、nav、switchPage）＋ Layer 2–4（ovw／attr／ab）＋ Layer 5（budget＋收尾） | 每層渲染、console 無錯；完成時 audit exit 0（PH-01 清空、QA-01～06） |
| M3 | 4／4.5 | 差異化落地＋changelog；E.9 Design QA | D.5 元素在；E.9 全 ✅ |
| M4 | 5 | 獨立驗收：audit exit 0、E.1 C 組、領域比例 8/8/8、ARCHIVE 條目 | fresh-context 驗收者 |

## 偏離紀錄

- 2026-11-01（claude，M1／Phase 2）資料設計定案時的取捨，皆已進 `dev/script/gen_data_adroas.py` assertion：
  - 通路由規格的 5 平台拆成 6 列：Meta 拆「開發／再行銷」（holdout 與新舊客題需要）；品牌字／非品牌字是「Google 搜尋」的子拆分（合計＝該通路）。
  - 後台營收全數以站內 UTM 最終點擊分給 6 個通路（不設自然／直接流量桶），使「後台去重各通路合計＝後台總額」成立；三種歸因模型是同一份後台營收的重新分配（每個模型合計＝5,147 萬，最終點擊＝後台通路營收）——「模型移動功勞、不創造營收」本身是教學點。
  - 總花費取 1,283 萬（非 1,286）：讓混合 ROAS＝4.01，避免整數 4.00。
  - A/B 指標定義為落地頁「首購結帳率」，基準 ≈5.4%（高於一般 2–3%，情境為首購體驗組促銷頁）：每組 2.1 萬訪客下，終局 lift 5.8% 才會落在 p 0.05–0.2；若用 2–3% 基準，同 lift 的 p > 0.3。
  - Holdout 增量 ROAS 取 1.58（≈1.6），刻意低於毛利損益兩平 ROAS 1.61（毛利率 62%＝1−32%−6%）。
  - 轉換延遲最後一桶「8–28 天」假設所有歸因訂單都在 28 天窗內。
  - 素材 CTR 最高者設為「前後對比（療效暗示）」並帶 `compliance_risk`（化粧品不得宣稱療效，供產業題用），同時是曝光最少的一支（贏家詛咒）。
- 2026-11-01（claude，M2／Phase 3 Layer 1–2）：
  - T1 標 **L2·A**（C.7 預設訓練題為 L3·A）：訓練題拆到每頁末尾，ovw 是決策鏈第一頁，學員尚未看過後續頁，T1 只用本頁圖表＋KPI 推論；T2–T5 仍依 C.7 走 L3·A。
  - HTML 文字中的資料數字改以 `data-v` 屬性由 `buildTextValues()` 從 DATA 衍生注入（不寫靜態數字）；`buildTextValues()` 內含「敘事守門」（console `✗ Narrative guard`），資料重生後若題目敘述依賴的資料形狀不成立會報錯。
  - 定義面板已換成本份術語（ROAS／混合 ROAS／平台自報 ROAS／新客 CPA／AOV／CPM／ATT／PMax／UTM／DTC／開發 vs 再行銷／知識領域 chip）；template 的「設計選擇揭露」面板移除，留待 Layer 5 於 budget 頁重寫。
  - ovw 已用陷阱名（各 1 次）：加工｜平均數陷阱（Q2）、解讀｜相關≠因果（Q5）、解讀｜單指標決策（T1）。全份 15 個 trap-block 對 8 個名稱 ×2＝16 個額度，後續層需逐一記帳。
- 2026-11-01（claude，M2／Phase 3 Layer 3 attr）：
  - 題號延續全份流水號（attr 為 Q6–Q10＋T2），領域 Q6 ind／Q7 data／Q8 mkt／Q9 data／Q10 mkt／T2 ind＝2／2／2。
  - 配色：通路圖沿用 `CH_COLOR`（顏色跟著實體走），同一通路內的「口徑／歸因模型／新舊客」改用同色深淺區分；legend 以中性色深淺示意（`shadeLegend()`）。轉換延遲圖不分通路，用中性色深淺（新客深、舊客淺）與新舊客占比圖同語意。
  - 長條圖 tooltip 一律 `mode:'nearest'`（B.5），grouped bar 的 tooltip 把同組另一個數字一併寫進 label，不用 index 模式。
  - 定義面板新增 5 條：歸因模型（含業界常見替代定義）、歸因窗口與瀏覽歸因、模擬轉換、轉換延遲、品牌字 vs 非品牌字（C.4b 原則 2；超出 attr 頁本體，但為本頁術語所需）。
  - 新增陷阱名：解讀｜基線缺失（Q8）、加工｜挑選期間（T2，歸因窗口＝挑期間）；整理｜重複歸因（Q10）依規格落在本頁。累計陷阱帳：平均數陷阱 1、相關≠因果 1、單指標決策 1、重複歸因 1、基線缺失 1、挑選期間 1（各 ≤2）。
  - Q9「每個新客的花費」＝通路花費 ÷ 通路新客訂單，屬最終點擊口徑，答案中已註明上游通路被高估；台灣品牌以 LINE 官方帳號對好友推播的說法寫在 I 段並以新客占比佐證。
- 2026-11-01（claude，M2／Phase 3 Layer 4 ab）：
  - 題號延續 Q11–Q15＋T3；領域 Q11 data／Q12 ind／Q13 mkt／Q14 ind／Q15 data／T3 mkt＝2／2／2。
  - 配色：A/B 不是通路實體——A（原版）用中性色、B（新版）用 purple（與 Meta 再行銷同色但不同頁、不同實體）；素材圖沿用 `CH_COLOR` 的 Meta 開發色，合規風險那支改 orange。
  - 檢定力／MDE／所需樣本（T3、定義面板）由 `buildTextValues()` 依 DATA 以業界慣例（雙尾 5%、檢定力 80%）即時計算（新增 `normCdf()`、`sgn()` helper），答案中放在 [A] 段並註明慣例；多重比較「至少一組顯著」機率為獨立假設下的粗估。
  - 裝置別圖依 A 組轉換率降序（桌機在前），遵守 bar 降序紅線，而非依訪客占比。
  - Q15（L3·F）跨頁連 attr 轉換延遲；**未**拿測試首購數對照 ovw 新客數：28 天兩組首購合計 2,334 筆，高於 7–9 月任一月的全站新客（1,304–1,474），兩份資料口徑不相容（生成器層面的一致性風險，待主線裁定是否改生成器或把指標定義改為「結帳轉換」）。
  - 新增陷阱名：解讀｜提早偷看（Q11）、解讀｜新奇效應（Q13）、加工｜多重比較（Q14）、呈現｜隱藏不確定性（T3）。累計陷阱帳：平均數陷阱 1、相關≠因果 1、單指標決策 1、重複歸因 1、基線缺失 1、挑選期間 1、提早偷看 1、新奇效應 1、多重比較 1、隱藏不確定性 1（共 10 個 trap-block、四階段皆已覆蓋）。
  - 定義面板新增 7 條：A/B 測試／lift／百分點（含 holdback）、信賴區間、p 值與統計顯著（含序貫檢定）、檢定力、MDE、CTR、療效宣稱（化粧品廣告）。
- 2026-11-01（claude，M2／Layer 4 修正，coordinator 裁定選項二）：A/B 指標由「首購結帳率」改為**「結帳轉換率」**（落地頁訪客中完成任一筆訂單的比例，新舊客都算）——取代 Phase 2 紀錄中的首購口徑；訪客量與統計參數不動。生成器新增 `ab.metric_def`／`period`（2025-09-01～09-28，9/1 為週一與 dow 一致）／`month_index`，以及 2 條 assertion：兩組轉換合計（2,334）≤ 9 月後台訂單按 28/30 折算（≈2,845），且 ≥ 其 60%（約 82%＝大部分廣告流量經過此落地頁）。DATA 數值零變動（diff 只有 4 個字串／新增欄位）；HTML `assertConsistency()` 新增對應 check（130 → 131，已用 mutation 驗證會轉紅）。Q15 新增事實④（測試轉換占同期後台訂單約 82%，nav-hint 連 ovw 月度後台營收）；T3 的 CPA 估算改註「新舊客同步提升」前提。
- 2026-11-01（claude，M2／Phase 3 Layer 5 budget＋收尾）：
  - 題號延續 Q16–Q19＋T4、T5；領域 Q16 data／Q17 ind／Q18 mkt／Q19 ind／T4 mkt／T5 data＝2／2／2，全份 data／mkt／ind＝8／8／8（瀏覽器實數 `data-domain`）。
  - 圖表 4 張（規格 3 張）：holdout 拆成「三種 ROAS」（平台歸因 9.80／全年後台最終點擊 5.60／增量 1.58，中間那根期間不同、標題與 findings 已註明）＋「holdout 營收對照」（測試區 vs 對照區 × 前期／活動期，橘短線＝無增量時預期）——T5 的 ① 各自讀需要把增量的算法畫在畫面上（C.4b 原則 1）。
  - 花費級距圖 x 軸是有序的花費級距（不依值降序，同時間軸例外；audit CH-10 以「標籤含數字」判為有序軸）；平均 ROAS 用折線、邊際 ROAS 用柱（柱 i＝從級距 i−1 加到 i），低於損益兩平的柱改 red。營收 vs 毛利 ROAS 圖同時畫 1.61 與 1.00 兩條紅虛線（同一條件的兩種寫法，設計揭露第 3 項說明）。
  - 新增陷阱名：解讀｜過度推論（T4，缺失維度題）。T5 陷阱用解讀｜基線缺失（第 2 次），非 C.7 建議的加工｜分母錯置：本題兩個 ROAS 分母相同、差在分子是否有反事實基線。終帳：平均數陷阱 2、相關≠因果 2、單指標決策 2、基線缺失 2，其餘 7 個名稱各 1（共 15 個 trap-block、四階段皆覆蓋）。
  - Q19 的 [A] 段用「其他變動成本再占營收 15%」假設值算出門檻 2.13（`V.otherPct`／`V.be2` 由 JS 從 DATA 衍生，文字明示為假設）；Q17、Q18 引用的保養品回購週期 60–90 天、7 天猶豫期為產業常識，放在 [A]／[I] 文字敘述、不帶 DATA 以外的計算。
  - Q18 題目原寫「AM」，改為「代理商業務窗口」避免新增未定義縮寫；定義面板新增 6 條：增量 ROAS／地理 holdout、邊際 ROAS、損益兩平 ROAS、毛利 ROAS（POAS）、LTV、MMM（各含業界常見替代定義）。另：ab 頁既有的「PM」未在定義面板（非本層範圍，留給 Phase 4／E.9 處理）。
  - `buildTextValues()` 新增 budget 區塊 11 條敘事守門（級距跨越損益兩平的位置、增量略低於損益兩平、只有 YouTube 低於損益兩平、YouTube 換模型後高於門檻等）；`assertConsistency()` 不變（131 條）。
- 2026-11-01（claude，M3／Phase 4–4.5＋Phase 5 交付物）：只動 CSS／圖表 options／文字版面，DATA 與題目實質不變。
  - 縮寫（C.4b 原則 2、E.1 C#19）：Q11、T3 的「PM」改「專案負責人」；素材標籤（DATA 字串、畫在圖軸上）的 KOL／UGC／ASMR 原本沒定義，定義面板加一條「素材類型縮寫」。抽出全文 innerText 與 DATA 字串掃大寫序列：其餘 ROAS／CPA／CPM／CTR／ATT／MDE／LTV／POAS／MMM／KPI／AOV／DTC／UTM／PMax／MER／CI 都已有定義；DDA 只出現在 console 的 check 名稱；Wald／SE 等方法字串不會顯示在畫面上。
  - 色彩 protocol（C#6）：template 留下的 P2 色 rgba 寫死值（`59,130,246`／`96,165,250`／`212,135,10`／`42,171,133`／`184,156,243`／`212,67,47`／`13,17,23`，共 39 處）和陷阱文字 `#e8847a`（2 處）一律改成 `color-mix(…var(--token)…)`，header 與 active tab 的底色因此跟 P1 `--bg` 一致。第 8 份當時也做過同樣的清理。
  - 版面（E.9 DQ-7）：視窗 960 寬、定義面板打開時，內容區只剩約 637px，兩欄圖卡每張約 280px，donut 的外部標籤（Meta 開發、Meta 再行銷）被截。`#content-area` 加 `container-type: inline-size`，並加 `@container (max-width:760px)` 讓內容區窄時改單欄（原本的 `@media(max-width:900px)` 只看視窗寬度）。
  - 圖表 options：cCreCtr 的「第 1 名下緣」標籤原本壓在最後一列的 1.07% 數值上，改放到圖區上緣外，legend 移到圖下方；cAbCr（2 條實線、原本沒有直接標籤，B.9-5）在最後一天標「A 原版／B 新版＋終值」，往左上、左下放，並用 `clamp` 避免右緣截字。
  - 資料期間（C#47、B.9-8）：12 張缺期間的圖卡標題補上 `data-v="year|abPeriod|hoPeriod"`。這兩張不補：cCreCtr 只寫「首週」，因為 DATA 沒有素材測試日期；cHoldRoas 的三根長條各自標了「測試期／全年」。T5［A］原本寫死的「6 週」改用 `hoPeriod` 綁定。

## Phase 4 — 差異化落地核對（D.3／D.5）

| 規劃元素 | 實際狀態 | 證據 |
|---|---|---|
| P1 色彩 | ✅ `:root` 五色＝D.9 P1（`#57A8FF／#39C699／#F7931F／#EF4444／#8B5CF6`，bg `#08141A`） | HTML `:root`；audit ΔE 正常 17.0／色盲 12.0 |
| Sora × Manrope × Fira Code | ✅ Google Fonts import 與 `--font-head/body/mono` 一致 | HTML L11、L28–30 |
| 批判型分佈（C.9） | ✅ 一般題 L1·I 2／L1·A 2／L2·F 2／L2·I 2／L2·A 4／L3·F 1／L3·I 2／L3·A 4（無 L1·F，A 題 10/19），訓練題 T1 L2·A、T2–T5 L3·A | 瀏覽器計數 `.badge` |
| T5 資料矛盾題 | ✅ 歸因 9.80 vs 增量 1.58，有三段（各自讀／找矛盾／下判斷）＋監控指標＋trap | budget T5 |
| 定義面板含業界常見替代定義 | ✅ 歸因模型、信賴區間、p 值、MDE、CTR、增量 ROAS、邊際、損益兩平、POAS、LTV、新客 CPA、混合 ROAS（MER）等 | def-panel（35 條） |
| 知識領域 chip | ✅ 24 題 data／mkt／ind＝8／8／8，每頁 2／2／2；header legend 與定義面板都有說明 | `data-domain` 計數 |
| 訓練題拆到每頁末尾 | ✅ 4 個 `.training-block`（ovw T1、attr T2、ab T3、budget T4＋T5） | |
| D.5 不可妥協 | ✅ F/I/A（FIA 110）、assertConsistency 131 條全過、三段式、trap 15、定義面板、DEMO chip、📐 設計選擇揭露 8 項 | audit PASS |

## 差異化 Changelog（對照第 8 份醫美連鎖／template 基準）

### 視覺軸
- Preset：P5 醫療信任型（淺色 `#ECFEFF`、accent `#0369A1`）→ **P1 深色財務型**（`#08141A`、accent `#57A8FF`），第一次使用 P1
- 字型：Lexend＋Source Sans 3 → **Sora（標題）× Manrope（內文）× Fira Code（數字）**，前 8 份都沒用過
- 色彩語意：通路是實體色（`CH_COLOR`），同一通路內的口徑、模型、客群用同色深淺區分；legend 以中性色深淺示意
- 版面：內容區用 container query，打開定義面板時依內容區寬度改單欄

### 教學軸
- 難度分佈：採 C.9 **批判型**（L2·A／L3·A 為主、無 L1·F，A 題占一般題 10/19）
- 新教學元素：**知識領域 chip**（📊 數據分析／📣 行銷專業／🏭 產業知識，24 題三類各 8 題）
- 定義面板：口徑說明 → 加上「**業界常見替代定義**」與常見誤解（統計、歸因、增量、POAS 等）
- T5 資料矛盾題：第 8 份（同統計量不同形狀＋矛盾）→ **歸因 ROAS 9.80 vs 增量 ROAS 1.58**（同一段期間、同一筆花費）
- 陷阱：4 階段全滿、11 個名稱、15 個 trap-block；本份才有的：重複歸因、提早偷看、新奇效應、多重比較、隱藏不確定性、平均數陷阱（平均 vs 邊際 ROAS）

### 結構軸
- 分頁邏輯：族群／漏斗分頁 → **決策鏈 4 頁**（看成效 → 驗口徑 → 驗實驗 → 分預算），L3 題用 nav-hint 指回前面的頁面
- 訓練題位置：集中在單一位置 → **拆到每頁末尾**（T1–T5 分在 4 頁）
- 文字數字：全部用 `data-v` 從 DATA 衍生，並由 `buildTextValues()` 敘事守門

### 資料軸
- 錨點：48,000 預約／83.0% 出席／23,904 萬 → **花費 1,283 萬／後台營收 5,147 萬／訂單 41,873／混合 ROAS 4.01／新客 CPA 692**
- 口徑差：平台自報加總＝後台 × 1.43（教學點）；A/B 第 5 天 +30.5% 且 p<0.05，終局 +5.8%、p 不顯著

## Design QA 結果（Phase 4.5）

瀏覽器：Playwright Chromium，http://localhost:8765/，1440 與 960 兩種寬度 × 定義面板開／關 × 4 頁，所有 QA 與 findings 都展開（16 種組合：canvas 19/19 都有 Chart 實例、沒有 0 尺寸、沒有水平溢出、console 0 error／0 guard）。截圖在 session scratchpad 的 `dq/`（`mont_1440_*`、`mont_960open_*`、`fix_*`）。

| # | 項目 | 狀態 | 備註 |
|---|---|---|---|
| DQ-1 | Bar 軸 max（20% headroom） | ✅ | 全部用 `headroom()`＝ceil(max×1.2／step)；cSpendM 210／167、cClaimOrd 20,000／15,909、cCreCtr 3／2.15 |
| DQ-2 | Stacked bar 動態 max | ✅ | 唯一的堆疊圖 cNewMix 是 100% 堆疊，max＝100 是定義值 |
| DQ-3 | 折線圖 Y 軸 max | ✅ | cTier 折線有 datalabels，max 4.5／3.53；cCpaM、cAbP 用 headroom；cAbCr 只標終點，max 10／7.5 |
| DQ-4 | 值域比例 <10x | ✅ | bar 最大 10.9x（cAbWeek +26.1% vs −2.4%，最小柱目視可辨）；cAbP 是 p 值折線 61x，接近 0 本身就是教學點（不可用對數） |
| DQ-5 | Donut 12 點鐘起畫 | ✅ | cSpendMix 未設 `rotation`（0） |
| DQ-6 | Donut 降序排列 | ✅ | `descIdx(CH.spend_pct)` 33／20／16／12／11／8 |
| DQ-7 | Donut 全項目 datalabels | ✅（修後） | 960 寬＋面板開啟時兩欄太窄，標籤被截 → 加 container query 改單欄後全部完整 |
| DQ-8 | Donut layout.padding≥32 | ✅ | padding 40、legend:false |
| DQ-9 | Stacked bar 頂端加總 | N/A | 100% 堆疊，每根加總都是 100% |
| DQ-10 | Stacked bar tooltip 佔比 | ✅ | cNewMix tooltip「新客 75.1%（n 筆）｜通路訂單 N 筆」 |
| DQ-11 | 折線圖 hover mode:index | ✅ | cCpaM、cAbCr、cAbP、cTier 都是 index／intersect:false |
| DQ-12 | pointHoverRadius≥10 | ✅ | 全部 10 |
| DQ-13 | 非首頁渲染正確 | ✅ | attr／ab／budget 從 switchPage 到 initialized 分別 119／128／118 ms |
| DQ-14 | 首頁不點擊即渲染 | ✅ | 載入後 ovw 5 張圖都有 Chart 實例（經 switchPage 契約） |
| DQ-15 | syncHeaderHeight 位置正確 | ✅ | 綁在 window load／resize（主 script 末） |
| DQ-16 | 製作時間 chip 格式 | ✅ | 🗓️ 製作時間：20261101 |
| DQ-17 | DOMContentLoaded 不重複 | ✅ | 只有 1 個 handler（另一處是註解） |
| DQ-18 | findings collapse 真正生效 | ✅ | 載入時 19/19 都是 collapsed |
| DQ-19 | 配色驗證器 | ✅ | audit PAL：正常 ΔE 17.0（orange/red）／色盲 12.0（red/teal, deutan） |
| DQ-20 | 單一值軸 | ✅ | 19 張圖都只有一條值軸，雙軸 0 張 |
| DQ-21 | 標題／單位／期間 | ✅（修後） | 抽 cCpaM、cHoldRev、cMargin：標題有單位與期間；另外 12 張圖卡補上期間（cCreCtr、cHoldRoas 例外，原因見偏離紀錄） |
| DQ-22 | 不只靠顏色 | ✅（修後） | ≥2 系列的圖都有 legend；cAbCr 補上終點直接標籤，其餘 ≤4 系列的圖都有數值標籤 |

**通過 22/22（DQ-9 N/A）→ ✅ 可進 Phase 5**（修正：DQ-7 版面、DQ-21 期間、DQ-22 直接標籤，cCreCtr 的標籤重疊也一併修正）

## Phase 5 — E.1 C 組人工判斷（claude 自跑，非獨立驗收）

| # | 結果 | 備註 |
|---|---|---|
| 1 SSOT | ✅ | 文字數字全部用 `data-v`；寫死的只剩產業常識與建議參數（60–90 天、7 天猶豫期、28 天窗口、5–10% holdback）；T5 的「6 週」已改綁定。偷看日 `d5=4` 是規格設計常數（cAbCr 標註與 `buildTextValues` 兩處一致），沒有從 DATA 讀 |
| 2 assert 覆蓋 | ✅ | 131 條：錨點、反推、分佈閉合、通路加總、歸因模型合計、A/B 統計重算、holdout、毛利 |
| 3 量級 | ✅ | AOV 1,229、毛利率 62%、混合 ROAS 4.01、新客 CPA 692，符合保養品 DTC |
| 4 月度節律 | ✅ | 5／6／10／11／12 月高峰、2 月最低、Q4 CPA 上升 |
| 5 口徑差 | ✅ | 自報／後台 1.43 倍是刻意的教學點，Q4、Q10、KPI 都有解釋 |
| 35 KPI 可驗算 | ✅ | 12 張 KPI 卡都有公式或可在圖上反推（tooltip 給分子分母） |
| 37 層級一致 | ✅ | 通路層級資料對應通路層級 KPI |
| 43／44 散點 | N/A | 本份沒有散點圖 |
| 6 色彩語意 | ✅ | 已清除 template 寫死的顏色。軟性問題：YouTube 的通路色剛好是 red，在 cMargin 中它又剛好是唯一低於損益兩平的通路，兩種語意重疊（顏色跟著實體走，屬設計選擇） |
| 7 字型 | ✅ | 標題、內文、數字三種角色都有，import 與 token 一致 |
| 26 雙軸 | ✅ | 0 張 |
| 34 new Chart 尺寸 | ✅ | donut：maintainAspectRatio:false＋h300 |
| 47 單位／期間 | ✅ | 見 DQ-21（cCreCtr 沒有日期資料） |
| 11 F/I/A 正確 | ✅（裁定後修） | 24 題逐段讀過；Q9 原［I］的「新客第一單金額較小」依 coordinator 裁定拆出為獨立［A］段，明說是待驗證假設（缺新舊客 AOV 拆分），保留推論訓練價值 |
| 15 三段式 | ✅ | F 題（Q3／Q7／Q15）只有 F；I 題到 I 為止（Q12、Q17 附了說明資料缺口的［A］，沒有 🎯）；A 題都是 F→I→A→🎯 |
| 16 訓練題位置 | ✅ | 拆在每頁末尾（差異化指定的位置） |
| 18 定義面板 | ✅ | 所有 KPI 都有口徑；共 35 條 |
| 19 縮寫 | ✅（修後） | PM 改寫；KOL／UGC／ASMR 補上定義 |
| 20 只引用呈現數據 | ✅（裁定後修） | Q9 該子句已改［A］；其餘［I］中的產業常識（回購週期、猶豫期、行動流量結構）都是敘述，沒有拿來計算 |
| 38 逆直覺三處同步 | ✅ | 歸因 vs 增量：DATA、T5／Q18 trap、揭露 #6；A/B 基準偏高：DATA、揭露 #5；早期顯著：DATA、Q11 trap |
| 39 缺失維度兩處 | ✅（裁定後修） | 自然流量：T4＋揭露 #4。回購／LTV：T4 ①＋揭露 #4（改名「刻意省略的兩個維度」，理由：本份聚焦投放端口徑與實驗，LTV 留作 T4 缺失維度練習）。A/B 新舊訪客拆分在 Q11／Q13［A］說明缺口 |

**C 組：21 列 ✅、2 列 N/A（#43、#44）**。#11／#20／#39 依 coordinator 裁定修正（Q9 拆［A］、揭露 #4 併入回購／LTV）；#6 的 YouTube 紅色依裁定維持。修後 audit rc=0（FIA 110→111）、console 只有 favicon 404、`data-v` 空值 0。

## Phase 5 — 交付物

- 生成器可重現：`python dev/script/gen_data_adroas.py <tmp>` 跑兩次，sha256 都是 `bed44e20e9d68d7bfd51f03a3a3b0459f714c41b3ab8b904c2f0a79328520fdc`；把該 JSON 用 `inject_data.py` 注入工作檔的副本，結果與工作檔逐位元組相同（cmp=0，裁定修正後重驗仍 cmp=0，最終工作檔 sha256 `321d66e0d65e54d68394a76ef01945bd6e27e24e2f46709ee359df17ead7172b`）
- ARCHIVE：已新增 #9 條目，並補上跨份總覽列與配色驗證紀錄列
- audit：`node dev/script/audit-dashboards.mjs Dashboard/*.html Skill/template.html` → rc=0（10/10 份無 FAIL；#9 PASS：圖表 19/19、QA 24、trap 15、FIA 110、assert 131）
