# Sprint：Skill 強化（驗收可信度 → 第 9 份鋪路 → 驗收擴充）

- 建立：2026-11-01（claude）
- 來源：Claude（Opus）與 Codex 兩份獨立審查的合併結論（本 session，主線抽查 7 條證據皆屬實）
- 狀態：執行中；使用者 2026-11-01 指示「整理成 plan 然後全部做（3 批次）」
- 範圍：`Skill/`、`dev/script/`、`CLAUDE.md`、`dev/tech-notes.md`；`Dashboard/` 只允許**機械性結構修正**（不改文字與數字），且每處都要在本檔「偏離紀錄」寫明

## 總原則（每個 milestone 都適用）

1. **新增的 FAIL 規則必須用 mutation 證明有效**：拿掉防線或注入缺陷 → 該規則轉紅；還原 → 轉綠。在 milestone QA 記錄觀察到的訊號（訊息原文＋exit code）。
2. **既有 8 份不回頭重做**：不補生成器、不重生資料、不改配色。新規則在既有成品上若命中：真缺陷且可機械修正 → 修並記錄；屬刻意差異或需改內容 → 以**規則 ID＋檔名＋理由**列入豁免，WARN 不升 FAIL。
3. **不把判斷題自動化**：產業量級合理性、F/I/A 標得對不對、陷阱有沒有教學價值，留給人工／獨立 reviewer。
4. **不把 tutor family 方法論灌回凍結版**：本 Sprint 只修矛盾、修 bug、補驗收、補流程契約。
5. **驗收收尾一律跑**：`node dev/script/audit-dashboards.mjs Dashboard/*.html Skill/template.html`，8 份 PASS；template 的結果依 M1 的「template 模式」規則判讀。
6. Commit 用 `claude:` 前綴、明確路徑 staging，依更動範圍切小步。

---

## M1 — 修驗收的假綠燈＋文件矛盾（第一批）

### M1-A 程式（`Skill/template.html`、`dev/script/audit-dashboards.mjs`）

| ID | 項目 | 證據 |
|---|---|---|
| 1.1 | `assertConsistency()` 改用 `check(name, cond)` helper，變數統一為 `errors`；成功時印 `✓ All data consistency checks passed (N checks)`。template 在檢查全被註解時 N=0 | `Skill/template.html:1147–1189`（目前全註解仍印通過；宣告 `errs`） |
| 1.2 | audit 判讀檢查條數：新格式讀 N；舊格式（既有 8 份）退回以去除註解後的函式原始碼估算有效斷言數。**成品 N=0 → FAIL**；template（以路徑或 `data-template` 標記辨識）N=0 → WARN「未配置」 | `dev/script/audit-dashboards.mjs:113–123` 只抓失敗訊號 |
| 1.3 | 紅線改**逐題**檢查：每個 `.qa-item` 有難度 badge 與 F/I/A；A 題與訓練題內含 `.trap-block`；答案含 `.ev` 與 `.chart-ref-btn`；L3 題有 `.nav-hint`。每條規則有 ID（如 `QA-01`…），輸出命中的題號 | `dev/script/audit-dashboards.mjs:149–156, 195–196`；`Skill/SKILL.md:205–206`；E.1 #10–#14、#23 |
| 1.4 | 規則豁免機制：audit 支援以規則 ID 豁免特定檔案（集中在腳本內一張表，附理由），豁免項仍印出但不計 FAIL | Codex 反建議「不要一次把 WARN 升 FAIL」 |

### M1-B 文件一致性

| ID | 項目 | 證據 |
|---|---|---|
| 1.5 | 資料 schema 統一以 template 為準：A.4、A.7、E.3 範例改成對齊 template 欄位名，或改寫成「見 template」；容差（A.8 <1% vs E.8 ±5%）與象限點數要求統一並寫明適用等式 | `Skill/module-A-data.md:120–170, 216–275, 301–305`；`Skill/module-E-checklist.md:70, 111–161, 289–290` |
| 1.6 | module-F：「9 項 hard-check」改為引用 E 的實際分組；刪除 F.4「複製到 `~/.claude/agents/`」；10 個 agent 從「強制」改為「大型建構時的選用模式」；F `:107` 的 preset 規則與 D.9 對齊 | `Skill/module-F-agents.md:45, 48, 68, 107, 111, 139–142` |
| 1.7 | `SKILL.md` Phase 3 分層表改為通用寫法（每個資料頁一層、函式名對齊 template 的 `drawOps/drawCust/drawDeep` 命名慣例），補 tech-notes #26 規則：「取代開頭 tag 時，old_string 連同對應結尾 tag 一起取代」 | `Skill/SKILL.md:128–131, 150–152`；`dev/tech-notes.md:625` |
| 1.8 | `mk()` 只保留 template 一份可執行實作；module-B 改為引用 template 並寫明合併契約（tooltip／legend／datalabels 深合併、需注入預設 `display:true`），修正「Object.assign 不新增 key」錯誤說明 | `Skill/module-B-visual.md:244–282, 264, 504`；`Skill/template.html:1225–1239` |
| 1.9 | 混合堆疊圖加總 formatter 改為以 stack ID／明確組成系列加總，排除總量線、比較線、隱藏系列，處理零總量 | `Skill/module-B-visual.md:51–70`；`Skill/template.html:1313–1331` |
| 1.10 | 差異化變體與紅線相容：D.3 的「emoji 取代 FIA」「敘事取代揭露」改為「附加／改呈現，語意必留」；頁數例外只在一處定義 | `Skill/module-D-diff.md:89–107, 134–142`；`Skill/QUICKSTART.md:189–193` |
| 1.11 | FIA 字型規則統一（FIA 繼承正文，B.6 改）；C.4b 明訂 F/I 證據須在畫面可讀，僅存在 DATA 不算 | `Skill/module-B-visual.md:440`；`Skill/module-E-checklist.md:64`；`Skill/module-C-pedagogy.md:236–246` |
| 1.12 | 過時內容：QUICKSTART 英文檔名、「既有 7 份」、交付物清單；E.5 交付物改成實際做法（HTML＋生成器腳本＋ARCHIVE 條目＋audit 結果）；CLAUDE.md 目錄樹（只列 2 份、「鏡像」字樣）；tech-notes 版本尾碼舊規則標註已取代 | `Skill/QUICKSTART.md:84–87, 105`；`Skill/module-E-checklist.md:186–195`；`CLAUDE.md:14–16`；`dev/tech-notes.md:118–125` |
| 1.13 | CLAUDE.md 加一行：觸發 dashboard-training-factory 時一律讀本專案 `Skill/SKILL.md`，忽略同名全域 skill（`anthropic-skills:dashboard-training-factory`） | 本 session skill 清單可見同名全域版；專案無 `.claude/skills/` |

### M1 QA
- [ ] 1.2 mutation：把某份成品的 assertConsistency 內容全註解 → audit FAIL；還原 → PASS
- [ ] 1.3 mutation：刪掉某 A 題的 `.trap-block` → 對應規則 FAIL 並指出題號；還原 → PASS
- [ ] template 在 audit 下為 WARN「未配置」而非 PASS 無聲通過，也非 FAIL
- [ ] 8 份全 PASS（含豁免表，豁免逐條有理由）
- [ ] `rg -n "errs\b" Skill/` 無殘留；`rg -n "9 項" Skill/module-F-agents.md` 無殘留

---

## M2 — 為第 9 份鋪路（第二批）

| ID | 項目 | 證據 |
|---|---|---|
| 2.1 | template 主題化：新增 `--font-head/--font-body/--font-mono` token；CSS 寫死的字型改讀 token；`c()`、`Chart.defaults.color`、TT 背景、grid 色改以 `getComputedStyle` 讀 CSS token | `Skill/template.html:28, 47, 72, …, 1197–1222`；`Skill/module-D-diff.md:227` |
| 2.2 | template 清掉寫死數字（`58,320`、餐飲公式、散點門檻、donut 分母）改讀 DATA／衍生值；未完成處用可辨識佔位符；audit 成品模式偵測殘留佔位符 → FAIL | `Skill/template.html:395, 415, 722, 812, 1459, 1491, 1546, 1588–1600` |
| 2.3 | template 的 DATA 包進 `/*__DATA__*/{…}/*__END__*/`；`inject_data.py` 強化：標記恰好一對、寫入前驗 JSON、寫入後讀回比對、同輸入重跑不變、處理字串中 `</script>` | `dev/script/inject_data.py:16–22`；template 無 `__DATA__`（rg 計數 0） |
| 2.4 | 從第 8 份抽 `dev/script/datagen_lib.py`（配額分配、assertion 收集含拒絕非有限數、固定 seed RNG、emit 附 seed／schema 版本／生成器版本）；`gen_data_medaesthetic.py` 改用 lib 後**輸出 JSON 必須與改前逐位元組相同** | `dev/script/gen_data_medaesthetic.py:11, 49–53, 174–176, 220–228` |
| 2.5 | 流程契約：SKILL.md 改成一張 Phase／輸入／輸出／驗收 ID 表；preset 選定＋配色驗證移到 Phase 1；Phase 2 標準化「情境 → 生成器 → assertions → JSON → 注入 → audit」；CLAUDE.md「When Adding a New Dashboard」與 QUICKSTART 對齊 | `Skill/SKILL.md:93–102, 174–177`；`CLAUDE.md:111`；`Skill/ARCHIVE.md:128` |
| 2.6 | D.9 回填：P4 accent2 → `#0D9488`、P6 accent2 → `#0284C7`（依 ARCHIVE 已驗證修正）；速查表與詳細設定一致（含 P5）；P1 加註「與第 3 份同 bg／accent、accent2 有色盲風險，使用前須調色並驗證」 | `Skill/module-D-diff.md:244–255, 316, 335, 356`；`Skill/ARCHIVE.md:33, 122, 125` |
| 2.7 | 配色驗證本地化：audit 在執行期讀實際使用的類別色與背景，自行實作 CIEDE2000＋色盲模擬，門檻依 B.9-1（正常 <15、色盲 <6 → FAIL）；B.9-1 改指向 audit，不再依賴 dataviz 路徑。**不得複製 dataviz 腳本**（repo public、授權不明） | `Skill/module-B-visual.md:516–520` |
| 2.8 | template lazy render 改為「繪製成功才標記完成、失敗清理實例可重試、以尺寸有效為前提而非固定 60ms」；SKILL.md 內的另一版片段同步或改引用 | `Skill/template.html:1666–1672`；`Skill/SKILL.md:150–152` |

### M2 QA
- [ ] 2.1：template 改套一組淺色 preset tokens（暫時性實驗，不 commit），確認 tooltip／類別色／字型跟著變
- [ ] 2.2 mutation：在一份成品副本插入佔位符 → FAIL
- [ ] 2.3：`inject_data.py` 對 template 副本注入兩次結果相同；標記重複的副本 → 拒絕
- [ ] 2.4：改前改後 `gen_data_medaesthetic.py` 輸出 sha256 相同（記錄雜湊與語意：JSON 檔全文）
- [ ] 2.7 mutation：把某份副本的 accent2 改成與 accent 相近色 → FAIL；第 4 份舊色 `#22C55E` 情境 → 色盲 FAIL
- [ ] 8 份全 PASS；template 依 M1 規則

---

## M3 — 驗收擴充（第三批）

| ID | 項目 | 證據 |
|---|---|---|
| 3.1 | 讀 Chart 實例檢查：bar 值軸 min=0（`data-trap` 含截斷軸者豁免）、有 datalabels 的值軸 max ≥ 1.2×資料最大值、單一 dataset 不顯示 legend 且無 "undefined"、donut rotation／padding／≤6 塊／datalabels 顯式開啟、折線 `interaction.mode='index'` 與 `pointHoverRadius≥10`、非時間軸 bar 降序（WARN） | `Skill/module-E-checklist.md:325–345`；E.1 #8, #9, #25, #47 |
| 3.2 | 真實點擊互動：每個 `.question`、findings、定義面板「初始收合 → 點擊展開 → 再點收合」；跨頁按鈕驗 active page 與目標 | `dev/tech-notes.md:528–544`；`Skill/module-E-checklist.md:105, 356` |
| 3.3 | 每頁＋側板開／關狀態量 overflow、KPI 截斷（scrollWidth>clientWidth）；寬度矩陣 960／1440 | `dev/script/audit-dashboards.mjs:74, 137–141`；`Skill/module-B-visual.md:446` |
| 3.4 | `--json` 輸出每份統計；`--summary` 跨份報表（`:root` accent／bg／字型組合重複、陷阱名稱出現頻率、題數／陷阱數）；ARCHIVE 跨份總覽改指向報表並修正已漂移數字（#7 陷阱 3→實際值） | `dev/script/audit-dashboards.mjs:197`；`Skill/ARCHIVE.md:80` |
| 3.5 | module-E 47 項依「誰保證」重組：A 組 audit 自動（標規則 ID）／B 組 template 不變式／C 組人工判斷；交付時只人工跑 C 組 | `Skill/module-E-checklist.md:7–76` |
| 3.6 | SKILL.md 加 Phase→需讀段落對照表，取代「全部讀完再執行」；B、E 的歷史原因段改指向 tech-notes 條號 | `Skill/SKILL.md:74` |
| 3.7 | 回歸案例腳本 `dev/script/audit-mutation-test.mjs`：對成品副本自動注入 M1–M3 各 FAIL 規則的缺陷（空 assertion、刪 trap、錯頁引用、裸文字未收合、label 消失、多餘 `</div>`、佔位符殘留、撞色），斷言每個都轉紅、原檔轉綠；副本放暫存目錄、跑完清掉 | `dev/tech-notes.md:612–631` |

### M3 QA
- [ ] 3.7 腳本本身 exit 0，且輸出逐案「mutation → 規則 ID → FAIL」
- [ ] 3.1–3.3 新規則在 8 份上的命中全部已處理（修正或列入豁免）
- [ ] `--summary` 輸出可讀、數字與 `--json` 一致

---

## 最終驗收 checklist

- [ ] `node dev/script/audit-dashboards.mjs Dashboard/*.html Skill/template.html` → exit 0（實測 exit code 直接量，不經 pipe）
- [ ] `node dev/script/audit-mutation-test.mjs` → exit 0，所有案例轉紅
- [ ] `gen_data_medaesthetic.py` 輸出雜湊與改前相同
- [ ] fresh-context 獨立驗收（非實作者）讀 diff＋實跑上面三項，回報無 blocking
- [ ] tech-notes 新增本 Sprint 學到的坑；handoff lane 更新
- [ ] 通過後本檔 rename 為 `Sprint_end_skill_hardening.md`

## 偏離紀錄 / 豁免表

### M1（2026-11-01 完成）

- **狀態判讀**：新增 QA-04／05／06 為 WARN，8 份因此顯示 `[WARN]` 而非 `[PASS]`。本 Sprint 的「8 份全 PASS」一律解讀為「**exit 0、無 FAIL**」。主線獨立重跑：`EXIT=0`、`9/9 份無 FAIL`、template `assert 0 條・回報`（AC-01 WARN）。
- **機械修正 0 處**：FAIL 級命中修起來都要新增教學文字，全部列入 `audit-dashboards.mjs` 的 `EXEMPTIONS`（以題目 key 為範圍，同檔新增命中仍會報）：
  - SaaS訂閱制 QA-03 × 7：page-mrr/Q6、page-churn/Q6、page-ltv/Q4、page-ltv/Q6、page-funnel/Q5、page-funnel/訓練題2、訓練題3——原稿無陷阱提示
  - 零售便利商店 QA-03 × 4：page-p4/#17～#20（L3 決策應用訓練；key 為全域序號，前面插題會位移）——同上
  - 電商DTC QA-02＋QA-03：page-cross/T4——開放式盤點題，答案是清單不是資料推論
- **規則定義**：電商 page-cross/T1 以 `.ans-head.obs/.inf/.act` 呈現 F/I/A，視為 QA-02 合法變體（依 1.10「改呈現、語意必留」）。
- **mutation 證據**（M1-A 實作者實測，新舊 audit 對照）：4 個 mutant（餐飲／SaaS／健身房空 assertion、SaaS 刪 page-mrr/Q4 trap）新 audit `EXIT=1`、HEAD 舊 audit `EXIT=0`；template 複製到 Skill/ 外 → AC-01 FAIL。
- **刻意改變的既有呈現**：template cRevCat tooltip 加 `callbacks.label` 顯示佔比（module-B 堆疊 bar 必備）。

### M2（2026-11-01 完成）

- **主線獨立重跑**：`node dev/script/audit-dashboards.mjs Dashboard/*.html Skill/template.html` → `EXIT=0`、`9/9 份無 FAIL`。
- **2.7 偏離規格（主線接受）**：判定量度改為 **OKLab 歐氏距離 ×100**＋Machado 2009 色盲模擬（protan／deutan），門檻沿用 B.9-1 的 15／6／8。理由：此量度把 ARCHIVE 記錄的 9 個 ΔE 值逐一重現到小數一位（差距 0.0），證明 B.9-1 的門檻本來就是 OKLab 單位；CIEDE2000 下 #8 修正前色對 ΔE00=28.9 大於現行健身房 22.9，任何門檻都無法同時滿足「修正前 FAIL、修正後不 FAIL」。CIEDE2000 仍自行實作（Sharma 2005 參考值吻合到小數 4 位），只在 `AUDIT_PAL_VERBOSE=1` 時列為參考。
- **PAL 比全部 10 個色對**（舊驗證器只比相鄰色）→ 7 份冒出非相鄰色對命中，依總原則 2 列入 `EXEMPTIONS` 共 12 筆（以色對為單位）。**待人工確認**：網紅個人品牌 blue `#7C3AED` ↔ purple `#9333EA` 正常 ΔE 僅 4.4，若同圖出現屬實際缺陷。
- **mutation**：ARCHIVE 4 組修正前色＋插入 `__TODO:x__` → 新 audit 全 `EXIT=1`，HEAD 舊 audit 全 `EXIT=0`。
- **2.4**：`gen_data_medaesthetic.py` 改用 lib 前後輸出 JSON 全文 sha256 皆 `9d81d9b2…faf3a`；inject 對第 8 份副本注入兩次與原檔 sha256 相同（`2fe09578…74fc`）。
- **2.9 實測（Chart.js 4.4.0＋datalabels 2.2.0，2026-11-01）**：`Chart.defaults.set('plugins.datalabels',…)` 不拋錯、不讓雙軸／填色折線消失；與直接賦值逐像素相同。
- **template baseline 外觀刻意變化**：tooltip 底色改讀 `--bg-finding`、grid 改讀 `--border`（0.08）、tooltip 內文改讀 `--text`；cTierAOV 軸改 `min:0`；散點中線標籤「中位來客」更正為「月均來客」（原算法即平均）；HHI 公式說明更正。

### 移交給後續 milestone 的發現（M2 新增）

- → M3 3.6：B.9-1 文字改為 OKLab×100、比全部色對、「明度範圍／對比 <3:1」未本地化須人工；Sprint 2.7 的「CIEDE2000」以本段為準
- → M3 3.6：template P2 baseline blue `#3B82F6` ↔ purple `#7C4DFF` 正常 12.9／deutan 4.2，D.9 P2 須加註或回填修正色（第 9 份若沿用 P2 會 FAIL）
- → M3 3.6：module-F `:41`、`:69` 仍寫 Phase 4 套 preset，GATE 1 無 PAL；tech-notes 14-B 與 2.9 實測相反、14-C 的 `setTimeout(60)` 須對齊 2.8
- → M3 3.1：audit 既有 bug——頁面無 Chart.js 時 `res.info.title` 為 undefined 拋 `Cannot read properties of undefined (reading 'replace')`
- → 不修：template CSS 的按鈕／badge／header 仍寫死 P2 rgba（不在 2.1 範圍；要做需 `color-mix()`）

### 移交給後續 milestone 的發現（M1）

- → M2 2.2：template donut `cTierDonut` datalabels 未顯式 `display:true`（全域預設 false → 百分比靜默不顯示），formatter 寫死 `58320`
- → M2 2.2：template 範例 QA 有 21 題缺 `.ev`、6 題 L3 缺 `.nav-hint`，新 dashboard 會繼承
- → M2 2.5：`Skill/SKILL.md:101`「輸出 `DATA.json`」與新 E.5 不一致
- → M2 新增 2.9：`SKILL.md` 稱 `Chart.defaults.set('plugins.datalabels',…)` 在 v4 會拋錯，E.1 #27 稱不報錯——實測後統一
- → M3 3.5：module-E 的 E.2 audit 規則表對齊 AC-01、QA-01～06 與豁免機制
- → M3 新增 3.8：QA 規則只掃 `.qa-item`，品牌 `.training-item`、健身房 `.train-item` 不在範圍；零售／電商題目列無 F/I/A 類型標記（標題型 0）→ 一般 A 題的 QA-03 抓不到

## 刻意不做

- 回頭替前 7 份補生成器或重生資料；改 SPA／手機版；全部 WARN 一次升 FAIL；判斷題自動化；tutor family 方法論回灌；學員回饋前擴充題型／圖表／無障礙／列印／作答區（第四批，等回饋）
