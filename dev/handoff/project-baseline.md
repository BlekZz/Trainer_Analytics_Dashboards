# 專案主線 [BLOCKED: 待 Blake 指示下一步（試用回饋／第 9 份／封存）]
- updated: 2026-10-14 (claude)
- base: 287f6c6
<!-- 查核: 2026-10-14 -->
- 停點: 第 8 份 `Dashboard/醫美連鎖_預約回診分析_訓練儀表板教材.html` 經 Blake 驗收通過（含 P3／P4 版面錯位修正）。Skill digest A/B/C、template 對齊、7 份回補全部完成。
- 下一步: 等 Blake 決定——實際給學員試用第 8 份並把回饋寫進 `Skill/ARCHIVE.md` #8「使用反饋」；或產第 9 份（唯一未用 preset：P1）；或宣告封存並刪除本 lane。
- 切入: Skill/ARCHIVE.md, dev/script/audit-dashboards.mjs, dev/script/gen_data_medaesthetic.py
- 事實:
  - [fact] `node dev/script/audit-dashboards.mjs Dashboard/*.html Skill/template.html`：8/8 PASS 零 WARN、template 僅 `<title>` 佔位 WARN（2026-10-14 實跑，含新增的分頁容器一致性與 findings 坍縮兩條 FAIL 檢查）
  - [fact] 第 8 份資料流程：`python dev/script/gen_data_medaesthetic.py <out.json>` → `python dev/script/inject_data.py <out.json> <html>`；改數字改生成器，不手改 HTML 的 DATA
  - [fact] 第 8 份獨立驗收殘留 ⚠（判定不修）：donut 用 teal／orange 當類別色、部分 %軸 max 寫死（皆 ≥×1.2）、cNewRet 只有新客序列有直接標籤
  - [fact] 配色驗證器在 Claude Code 內建 dataviz skill 的 `scripts/validate_palette.js`（bundled 路徑隨 CLI 版本變動，不可寫死）
  - [fact] repo 為 GitHub PUBLIC；日後吸收 tutor D/E/F（education-agent-skills，CC BY-SA 4.0）須署名＋同授權
