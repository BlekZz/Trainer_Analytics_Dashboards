# 分析訓練儀表板 — 待辦事項

---

## 待完成

- [ ] **電商DTC v3 二次 QA**
  `電商DTC_會員交易分析_訓練儀表板教材_v3.html`
  依照更新後的 skill 標準重新審查，重點項目：
  - E.1 新增的 Check 19：所有縮寫/專有名詞已在 def-panel 定義
  - E.1 新增的 Check 20：所有分析依據只引用儀表板呈現的數據（F/I tag）
  - E.1 新增的 Check 21：F/I/A 標籤系統在 legend strip 或 def-panel 有可見說明
  - C.4b 原則 1：計算指標的層級一致性（如 HHI 等）
  - scatter 封閉三角 + 四象限均佈（若有散點圖）
  - KPI YoY 卡片全部補前年基準值

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
