# 專案主線 [BLOCKED: 待 Blake 指示是否產第 8 份或封存]
- updated: 2026-10-14 (claude)
- base: 1e16b06
<!-- 查核: 2026-10-14 -->
- 停點: 2026-10-14 收尾完成：audit-dashboards 驗收腳本（含 goToChart 目標檢查）、零售錨點修正、Skill 一致性修補、7 份跨檔統一（title／datalabels 預設／`.ev`／`.chart-ref-btn`）、`Skill/ARCHIVE.md` 回填 7 筆。無未完工項。
- 下一步: 等 Blake 決定方向——產新 dashboard（從 `Skill/template.html`，preset 優先選未用過的 P1／P5，見 ARCHIVE 跨份總覽），或宣告封存並刪除本 lane。
- 切入: dev/script/audit-dashboards.mjs, Skill/ARCHIVE.md, Skill/SKILL.md
- 事實:
  - [fact] `node dev/script/audit-dashboards.mjs` @1e16b06：7/7 PASS、零 WARN、exit 0（2026-10-14 實跑）；mutation（舊錨點／拿掉 register／拿掉 trap／draw 短路／goToChart 錯頁與不存在 id）皆 FAIL exit 1
  - [fact] 零售 P1 的 4 張 canvas（ch-abc／ch-pareto／ch-monthly／ch-cat-donut）`toDataURL` 雜湊跨次不穩定（兩種狀態來回），做像素中性比對時要跑兩次基準（dev/tech-notes.md #25）
  - [fact] 電商DTC 各圖 datalabels 為顯式 `display:true`；全域預設 false（commit 1e0dd42，96 canvas 像素雜湊前後一致）
  - [inference] `Skill/ARCHIVE.md` 視覺 preset 判定是 agent 依 accent／字型比對 D.9 所得，#1 餐飲（P2 近似）、#3 品牌（P7 Modified，accent／bg 實同 P1）屬近似判定
