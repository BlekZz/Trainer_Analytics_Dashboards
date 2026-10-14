# 專案主線 [BLOCKED: 待 Blake 試用第 8 份並回饋]
- updated: 2026-10-14 (claude)
- base: bdef2bb
<!-- 查核: 2026-10-14 -->
- 停點: 第 8 份 `Dashboard/醫美連鎖_預約回診分析_訓練儀表板教材.html` 完成（P5、4 頁 16 圖、18 題＋T1–T5、19 個 trap 涵蓋 4 階段、單軸、揭示式 P4），獨立驗收（fresh-context agent 逐項 E.1／E.9）找出的 ❌ 已全修；template 已對齊新規則（含 findings 坍縮）。
- 下一步: Blake 用實際學員或自己試做第 8 份，回饋寫進 `Skill/ARCHIVE.md` #8「使用反饋」；依回饋決定是否回補 template／Skill，或產第 9 份（唯一未用 preset：P1）。
- 切入: Dashboard/醫美連鎖_預約回診分析_訓練儀表板教材.html, dev/script/gen_data_medaesthetic.py, Skill/ARCHIVE.md
- 事實:
  - [fact] `node dev/script/audit-dashboards.mjs Dashboard/*.html Skill/template.html`：8/8 份 PASS 零 WARN、template 僅 `<title>` 佔位 WARN（2026-10-14 實跑）
  - [fact] 第 8 份資料由 `python dev/script/gen_data_medaesthetic.py <out.json>` 生成、`python dev/script/inject_data.py <out.json> <html>` 注入（/*__DATA__*/…/*__END__*/ 標記）；改數字一律改生成器重跑，不手改 HTML 的 DATA
  - [fact] 獨立驗收殘留 ⚠（判定不修）：donut 用 teal／orange 當類別色與圖例語意色重疊、部分 %軸 max 寫死（22／70／80，皆 ≥×1.2）、cNewRet 只有新客序列有直接標籤
  - [fact] 配色驗證器在 Claude Code 內建 dataviz skill 的 `scripts/validate_palette.js`（bundled 路徑隨 CLI 版本變動，不可寫死）
  - [fact] repo 為 GitHub PUBLIC；日後吸收 tutor D/E/F（education-agent-skills，CC BY-SA 4.0）須署名＋同授權
