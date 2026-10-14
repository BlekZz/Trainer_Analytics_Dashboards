# 專案主線 [ACTIVE]
- updated: 2026-10-14 (claude)
- base: 9a03bdb
<!-- 查核: 2026-10-14 -->
- 停點: 2026-10-14 repo 掃描後執行 1/2/3：落地 `dev/script/audit-dashboards.mjs`（零依賴 CDP 驗收）、零售 inventory_turnover 錨點修為 5.03、Skill 一致性修補（E.1=44 項、字型項改依 D.9、E.2 指向腳本、template 描述更正）。Skill 方法論不再演進（權威版在 tutor family）。
- 下一步: 待 Blake 裁定是否做 #4 跨 7 份命名統一（WARN 清單即工作範圍）；否則本線可結案刪檔。
- 切入: dev/script/audit-dashboards.mjs, Skill/module-E-checklist.md (E.1/E.2), Skill/SKILL.md
- 事實:
  - [fact] `node dev/script/audit-dashboards.mjs` @9a03bdb：7/7 無 FAIL、exit 0；mutation（舊錨點／拿掉 register／拿掉 trap／draw 短路）4/4 FAIL、exit 1（2026-10-14 實跑）
  - [fact] 剩餘 WARN：健身房/品牌/電商/餐飲 缺 datalabels display=false 預設；SaaS/品牌/零售/餐飲 缺 `.ev`；SaaS/網紅/零售/電商 缺 `.chart-ref-btn`（SaaS/零售以其他 class 呼叫 goToChart）；電商 `<title>` 仍為「…Dashboard v2」
  - [fact] `Skill/module-E-checklist.md` E.7 指向的 `ARCHIVE.md` 不存在（未處理）
