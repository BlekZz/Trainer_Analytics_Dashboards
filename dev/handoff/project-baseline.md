# 專案主線 [BLOCKED: 待 Blake 指示下一步（試用回饋／第 9 份／Sprint_end 後續選項／封存）]
- updated: 2026-11-01 (claude)
- base: 7f28537
<!-- 查核: 2026-11-01 -->
- identity: {"executor":"claude","device":"unknown","host":"DESKTOP-20251004","session_id":"unknown","session_name":"unknown","identity_source":"hostname"}
- 停點: 配色系統化 Sprint 完成並經獨立驗收（PASS 附註），見 `dev/Sprint_end_palette_system.md`：palette_lib＋gen_palette 產生器、P1–P7 全過 PAL、7 份成品撞色重配、既有成品 CH 圖表設定修正、PAL 與已修 CH 豁免移除。前一輪 Skill 強化見 `dev/Sprint_end_skill_hardening.md`。
- 下一步: 等 Blake 決定——(1) 學員試用第 8 份並把回饋寫進 `Skill/ARCHIVE.md`；(2) 產第 9 份（選 preset 後跑 `gen_palette.mjs --check`，D.11）；(3) `Sprint_end_palette_system.md`「後續選項」1–6（首要：網紅「橘色虛線」與電商未定義 `--purple` 兩處內容錯誤，改內文需同意）；(4) `Sprint_end_skill_hardening.md` 後續選項 3、5、6；(5) 封存並刪除本 lane。
- 切入: dev/Sprint_end_palette_system.md, dev/script/gen_palette.mjs, Skill/module-D-diff.md（D.9／D.11）
- 事實:
  - [fact] `node dev/script/audit-dashboards.mjs Dashboard/*.html Skill/template.html` → `EXIT=0`、`9/9 份無 FAIL`；剩 WARN 含 PAL-02×4（protan 7.9，既有）；EXEMPTIONS 無 PAL 條目，CH 只剩 SaaS `chart-waterfall` CH-01（2026-11-01 獨立驗收實跑）
  - [fact] `node dev/script/audit-mutation-test.mjs --jobs 4` → `EXIT=0`、30/30 轉紅、對照組 5/5；與其他 headless Chrome 並行時可能 LY-02 逾時 exit=2，閒置重跑即過（2026-11-01）；新增 FAIL 規則須在此加案例
  - [fact] 配色計算單一來源 `dev/script/palette_lib.mjs`（OKLab×100＋Machado 色盲模擬，門檻 15／6／8，比全部色對），audit 與 `gen_palette.mjs` 共用（`dev/tech-notes.md` #27、#28）
  - [fact] 產生器：語意色族色相區間＋明度範圍，`--bg/--anchor/--map/--check/--top/--maxmin/--benchmark`，決定性輸出，每次 ≤1.4 秒（`Skill/module-D-diff.md` D.11）
  - [fact] 第 8 份資料流程：`python dev/script/gen_data_medaesthetic.py <out.json>` → `python dev/script/inject_data.py <out.json> <html>`；共用 `dev/script/datagen_lib.py`；輸出 sha256 `9d81d9b2…faf3a`
  - [fact] 第 8 份獨立驗收殘留 ⚠（2026-10-14 判定不修）：donut 用 teal／orange 當類別色、部分 %軸 max 寫死（皆 ≥×1.2）、cNewRet 只有新客序列有直接標籤
  - [fact] repo 為 GitHub PUBLIC；日後吸收 tutor D/E/F（education-agent-skills，CC BY-SA 4.0）須署名＋同授權
