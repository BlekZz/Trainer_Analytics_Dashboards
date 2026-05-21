# 分析訓練儀表板 — 待辦事項

---

## 待完成

- [x] **電商DTC v3 二次 QA**
  `電商DTC_會員交易分析_訓練儀表板教材_v3.html`
  依照更新後的 skill 標準重新審查，重點項目：
  - ✅ Check 19：def-panel 補 YoY / pp / KPI / ROI / ARPU 五個縮寫定義
  - ✅ Check 20：所有 F/I tag 引用均有 ev 標記且對應圖表，無違規
  - ✅ Check 21：color-legend strip 已有 F/I/A 三色說明（第 270-273 行）
  - ✅ C.4b：本 dashboard 無 HHI，無散點圖 → 略過
  - ✅ KPI YoY 前年基準值：補活躍會員、年流失率、總訂單、AOV、首購轉化率、升等率共 6 張卡片

- [ ] **建立 GitHub remote 並推送**
  本專案目錄尚未 git init 也未連結遠端 repo。
  步驟：
  1. `git init`
  2. 在 GitHub 建立新 repo（建議名稱：`analytics-training-dashboards`）
  3. `git remote add origin git@github.com:<user>/analytics-training-dashboards.git`
  4. 初次 commit：加入 `.gitignore`（排除 `Claude Temp Files/`）再 push

---

## 已完成

- [x] `餐飲連鎖_門市營運分析_訓練儀表板教材_v1.html` 生成
- [x] P0/P1 修正（VIP 定義、回購分佈、monthly_aov 移除、HHI 閾值）
- [x] P2/P3 修正（scatter 封閉三角、精品型四象限、LTV [A] tag、高頻業績錨點）
- [x] Bug 修正（Q8 時段、月均 YoY 基準、duplicate id、scatter 精品型標籤）
- [x] HHI 改為品類層級可驗算（3,478）+ Check 13
- [x] 定義面板補全 YoY / pp / LTV / ROI / KPI / F/I/A
- [x] Legend strip 新增 F/I/A 三色標籤說明
- [x] Skill 更新：module-A/C/E + dev-knowhow.md（共 13 條 knowhow）
