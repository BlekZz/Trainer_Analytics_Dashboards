# Sprint：配色系統化＋既有成品撞色與圖表設定修正

- 起始：2026-11-01（claude）｜base `2f84f1d`
- 來源：`dev/Sprint_end_skill_hardening.md`「後續選項」1、2、4；Blake 2026-11-01 指示：真實色盲撞色要處理、既有成品圖表設定要修、第 9 份（preset）要調整，並建立「每份主題都能有邏輯依據、快速產出高品質色票」的機制。

## 總原則

1. `Dashboard/*.html` 的**文字與數字不得修改**。本 Sprint 經 Blake 同意，可改：配色 token／hex、Chart.js options（scale、interaction、point、legend、datalabels 等設定）。
2. **色名不變**：成品內文出現「紫柱」「橘色虛線」「藍柱」「紅色虛線」等色名 → 換色後該語意色必須仍落在同一色名的色相區間內。
3. 配色有邏輯依據：產生器的規則可重跑、可驗證；audit 與產生器共用同一份色彩計算（單一來源）。
4. 每個新 FAIL 規則或改動的規則，照舊用 `audit-mutation-test.mjs` 證明（mutant 轉紅）。

## 設計：配色產生規則（M1 實作依據）

- **語意色相區間**（OKLCH h，度數；M1 依實測與色名可接受範圍微調，記錄理由）：red ≈ 15–35、orange ≈ 50–80、teal/green ≈ 150–195、blue ≈ 230–270、purple ≈ 285–330。
- **明度階梯**：dichromacy 模擬下色相混淆但明度保留 → 易撞的色對（blue/purple、orange/red、red/teal）必須靠明度差分開。產生器在背景色限制下替五色分配不同 L 層級。
- **背景約束**：每色對背景 WCAG 對比 ≥ 3:1（非文字圖形元素）。
- **目標函數**：在全部 10 色對 × 正常／protan／deutan 下最大化最小 ΔE（OKLab×100，與 audit PAL 相同），且須過 PAL 門檻 15／6／8。
- **基準組**：Okabe-Ito、Paul Tol bright 作為 sanity check（計算庫對它們的評分須合理；它們可作候選種子，但需經語意區間過濾）。
- **輸入／輸出**：`node dev/script/gen_palette.mjs --bg <hex> [--anchor blue=<hex>] [--top 3] [--json]` → top-N 候選＋每組完整驗證表；無解時明確報告卡在哪個約束。

## Milestones

### M1 色彩庫＋產生器＋preset（agent，Opus）
- 1.1 抽出 `dev/script/palette_lib.mjs`（OKLab、Machado 2009、ΔE、WCAG 對比、OKLCH↔sRGB、gamut clip）；`audit-dashboards.mjs` 改 import（PAL 結果不得改變）。
- 1.2 新增 `dev/script/gen_palette.mjs`（上述設計）。
- 1.3 用產生器重驗 D.9 全部 P1–P7；不過 PAL 的 preset 回填修正色（P2 purple、P1 與第 3 份同色問題），D.9 記錄新舊值與 ΔE。
- 1.4 文件：module-D 新增「配色生成」段（規則、指令、基準組、何時開決策頁讓 Blake 挑）；B.9-1、SKILL Phase 1 指向它；template 預設 tokens 若為 P2 則同步。
- **QA**：(a) audit 全量 PAL 結果與改前逐項一致（同色對、同數值到小數一位）；(b) mutation-test 全綠；(c) 產生器對 P1–P7 背景各產出 ≥1 組過 PAL＋對比的候選；(d) 對 Okabe-Ito 子集的評分寫進報告。

### M3 既有成品圖表設定修正（agent，Opus；與 M1 並行，不碰 audit 檔）
- 修 EXEMPTIONS 內 CH-01／02／03／08／09 全部項目，只改 Chart.js options。
- CH-01（bar 值軸 min>0）：先確認不是陷阱教學刻意截斷（看對應題目／trap-block），刻意者回報保留豁免；其餘改基線 0。
- CH-02 依實際最大值（stacked 取加總）設 `grace` 或 max ≥ 1.2×；CH-08 `interaction:{mode:'index',intersect:false}`；CH-09 `pointHoverRadius ≥ 10`；CH-03 隱藏 undefined／單一 dataset legend。
- **QA**：`git diff Dashboard/` 只出現 options 變動（agent 回報每檔 diff 摘要）；對該檔跑 audit 時，原 CH 豁免項不再命中（以暫時移除豁免的副本 audit 驗證，或回報命中清單）；截圖抽查標籤未被切。

### M2 既有成品重配色（agent，Opus；等 M1）
- 範圍：EXEMPTIONS 內全部 PAL-01／02 項（SaaS、品牌、網紅、醫美、零售、電商、餐飲）。
- 先盤點每份 `c()` 對應的 token／hex（各份 mapping 不同，例如網紅 accent=purple、零售 accent=green、品牌 accent2=orange）與內文色名；用產生器在該份背景下求解，盡量只動撞色的那幾個色。
- 同步更新寫死的 rgba／hex（同一語意色的所有出現處）。
- **QA**：移除全部 PAL 豁免後 audit 該份無 PAL FAIL；內文色名仍對應正確色相區間；截圖前後對照。

### M4 獨立驗收（fresh-context agent，非實作者）
- 全量 audit exit 0、mutation-test 全綠、EXEMPTIONS 已無 PAL 與已修 CH 項目、`git diff 2f84f1d -- Dashboard/` 不含文字或數字變動（以剝除 style/script options 後比對文字節點驗證）、產生器實跑一個新背景。

## 最終驗收 checklist
- [ ] audit 全量 `EXIT=0`
- [ ] mutation-test 全綠
- [ ] EXEMPTIONS 無 PAL-01／02 條目；CH 條目僅剩經判定為刻意設計者（附理由）
- [ ] 成品文字節點與數字零變動（M4 實證）
- [ ] P1–P7 全部過 PAL；D.9 記錄新值
- [ ] module-D 配色生成段＋產生器可用

## 偏離紀錄
- **M1 目標函數（2026-11-01，claude）：** 設計寫「最大化 30 個 ΔE 的最小值」。實作改為兩段：先求可達上界 t*，門檻取 T＝min(t*, 12)，T 之上挑品質罰分最低者；`--maxmin` 保留純 max-min。理由：純 max-min 實測把色推到限制邊緣（P2 背景 teal L 0.94 近白、blue 對比剛好 3.00、色相貼區間邊），分離度遠超門檻卻不好看（dev/tech-notes.md #28）。
- **M1 色相區間微調＋新增明度範圍：** red 15–38、orange 48–75、green 142–190、blue 228–268、purple 282–328（268–282 靛刻意空出）；另加 gold 75–100、cyan 195–225 供 `--map`（P7 金色、P4 青色主色）。色名也取決於明度，加 orange L 0.62–0.88、red 0.45–0.70、gold 0.70–0.92（實測曾產出棕 `#7B3701`、粉 `#F99998`）。理由與實例在 `gen_palette.mjs` FAMILIES／FAMILY_L 註解。
- **M1 新增 `--map`、`--check`、`--maxmin`：** 設計未列。`--map` 是因為 P6 的 blue key 實為綠、teal key 為藍，P7 的 teal key 為金色；`--check` 用於 1.3「驗證既有五色」。
- **M1 範圍外的同步修改：** P2 purple 換色後，除 template 的 `--purple` token，也同步改了 template 內同色的寫死 rgba（`.badge.l3`、`.training-block`、`TOKEN_FALLBACK`），以及 module-B B.1 色彩表／圖例範例、CLAUDE.md 設計 token 表的 P2 purple 值、ARCHIVE 兩處 P1 註記——避免文件與 template 不一致。
- **M1 P1 與第 3 份的重複：** 只換 accent（`#3B82F6→#57A8FF`），bg `#020617` 與 IBM Plex 字型仍與第 3 份相同（P7 也用同一 bg）；D.9 P1 註記寫明若要與第 3 份並排展示，另換 bg 重跑。是否也換 bg 留給 Blake 決定。
- **M1 P7 purple `#6366F1`（h 277，靛）：** 過 PAL 但在紫色區間外；依「只換撞色」原則保留，D.9 註記建議選 P7 時換掉。
