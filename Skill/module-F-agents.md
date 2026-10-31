# Module F — Agent 工作流整合

本模組定義如何將 10 個 Active Agents 嵌入 Phase 1–5 生成工作流，
每個 agent 有明確的入場條件、交付物與離場稽核門。

> **定位：大型建構時的選用模式，不是強制流程。** 單一 session 由主 Claude 直接依 SKILL.md Phase 1–5 執行即可；只有需要分工（例如分層建構怕輸出截斷、要獨立稽核）時才依本模組派工。下文的 GATE 不論是否派工都適用（它們就是 SKILL.md 各 Phase 的出口條件）。

---

## F.1 工作流總覽

```
Phase 1 ─────────────────────────────────────────────────────
  [Analytics Reporter] → KPI 架構、資料維度、圖表選型
  [Corporate Training Designer] → F/I/A 問題矩陣、難度分佈、陷阱設計
  [redesign-existing-projects] → 選 D.9 Visual Preset（P1–P7），只覆蓋工作檔 :root tokens + Google Fonts import
                    ↓
             ▼ GATE 1：audit PAL-01／PAL-02 通過 ＋ USER 確認規格與 preset
               （結構 3–4 頁、圖表清單、問題難度分佈、資料錨點預告）

Phase 2 ─────────────────────────────────────────────────────
  [Code Reviewer] → 審查 assertConsistency 邏輯設計
                    （cross-check 條件覆蓋所有 anchor 值）
                    ↓
             ▼ GATE 2：Console ✓ All data consistency checks passed
               失敗 → 回 Code Reviewer 修資料，不進 Phase 3

Phase 3 ─────────────────────────────────────────────────────
  （分層定義以 SKILL.md Phase 3 為準：Layer 1 骨架＋每個資料頁一層＋末頁收尾層，3 頁 = 4 層、4 頁 = 5 層）
  Layer 1  [Rapid Prototyper]
           → 工作檔已含 preset、DATA、assertConsistency、utility functions（沿用 template 不重寫）；
             本層只調頁數／頁 key／nav tab／switchPage 分派與各頁 <div> 空殼
                    ↓
             ▼ GATE 3-L1：頁面可切換，assertConsistency 通過，console 無錯

  Layer 2…N  [full-output-enforcement] + [Frontend Developer]
           → 末頁以外每個資料頁一層：該頁 canvas + KPI HTML + drawXxx() + 該頁 QA；
             最後一層：末頁圖表＋QA＋訓練題／設計選擇／定義面板
                    ↓
             ▼ GATE 3-L2…N：每層寫入後瀏覽器確認該頁圖表渲染，QA 可展開
               失敗 → [Minimal Change Engineer] 精確點修，不重跑整層

Phase 4 ─────────────────────────────────────────────────────
  （視覺軸已在 Phase 1 定案，這裡不再換 preset）
  主 Claude → 教學軸／結構軸差異化落地（D.3）＋差異化 changelog
                    ↓
             ▼ GATE 4：D.5 不可妥協元素仍在；色票 / 字型與前一份儀表板不同（複核 Phase 1 的選擇）

Phase 5 ─────────────────────────────────────────────────────
  [Evidence Collector] → 截圖驗收，跑 audit 腳本（E.2，E.1 A 組）＋ E.1 C 組人工項
  [Code Reviewer]      → 最終 JS 邏輯 + F/I/A 標記完整性
                    ↓
             ▼ GATE 5：audit exit 0 ＋ E.1 C 組全綠，無未標 ⚠ 的 A 題
               失敗 → [Minimal Change Engineer] 點修，不重跑 Phase 3

交付後 ──────────────────────────────────────────────────────
  [Technical Writer] → 更新 dev/tech-notes.md（新踩坑 or 確認模式）
```

---

## F.2 角色定位總表

| Agent | 檔案 | 工作角色 | 觸發時機（選用模式下） | On-demand |
|---|---|---|---|---|
| Analytics Reporter | `support-analytics-reporter.md` | 資料架構師：KPI、資料維度、圖表選型 | Phase 1 | 否 |
| Corporate Training Designer | `corporate-training-designer.md` | 教學設計師：F/I/A 問題、難度矩陣、陷阱 | Phase 1 | 否 |
| Code Reviewer | `engineering-code-reviewer.md` | 資料稽核員：assertConsistency + 最終 JS 審查 | Phase 2 + Phase 5 | 否 |
| Rapid Prototyper | `engineering-rapid-prototyper.md` | 骨架工程師：Layer 1（頁數／分派／空殼），不寫 draw logic | Phase 3 Layer 1 | 否 |
| full-output-enforcement | `output-skill.md` | 輸出守門員：防 Layer 2…N 截斷 | Phase 3 Layer 2…N | 否 |
| Frontend Developer | `engineering-frontend-developer.md` | 圖表工程師：Chart.js 實作、canvas 渲染 | Phase 3 Layer 2…N | 否 |
| redesign-existing-projects | `redesign-skill.md` | 視覺設計師：Preset 套用、跨儀表板差異化 | Phase 1（選 preset＋PAL 驗證） | 否 |
| Evidence Collector | `testing-evidence-collector.md` | QA 驗收員：截圖 + audit＋E.1 C 組 | Phase 5 | 否 |
| Minimal Change Engineer | `engineering-minimal-change-engineer.md` | 點修工：gate 失敗時針對性修復 | Gate 3/5 失敗時 | ✓ |
| Technical Writer | `engineering-technical-writer.md` | 知識整合：tech-notes.md 更新 | 交付後 | ✓ |

---

## F.3 稽核門檻明細

### GATE 1 — 規格確認（Phase 1 出口）

先過配色驗證，再由使用者確認以下各項，缺一不進 Phase 2：

0. **配色驗證**：套好 preset 的工作檔跑 `node dev/script/audit-dashboards.mjs Dashboard/<新檔>.html`，**PAL-01／PAL-02 無 FAIL**（此時只判讀這兩條，見 SKILL Phase 1 步驟 8、B.9-1）
1. **頁數結構**：依 D.2 頁數規則（預設 3–4 頁），每頁有明確分析意圖
2. **圖表清單**：每頁 3–6 張，標明圖表類型與教學作用
3. **問題難度分佈**：L1/L2/L3 × F/I/A 二維矩陣有覆蓋
4. **資料錨點預告**：總會員 / 總訂單 / 總營收等核心數字已列出
5. **選定的 D.9 preset**：與上一份不同（GATE 4 規則）

### GATE 2 — 資料一致性（Phase 2 出口）

- 瀏覽器 Console 必須輸出 `✓ All data consistency checks passed (N checks)` 且 N > 0
- assertConsistency 覆蓋模組 A.4 基礎檢查類別中本份資料適用者
- 任何 `✗ Consistency error` 都必須清零才能繼續

### GATE 3-L1 — 骨架驗收

- 頁面可在瀏覽器開啟（無 404、無 MIME error）
- Console 無 JS TypeError / ReferenceError
- `assertConsistency()` 在 DOMContentLoaded 自動執行並通過

### GATE 3-L2…N — 每層圖表驗收

- 對應分頁切換後，所有 canvas 有渲染（非空白）
- Chart.js datalabels 設定 display:true 的圖表有顯示數值
- QA 項目可點擊展開（onclick 有效）

### GATE 4 — 視覺差異確認

- `:root` 的 `--accent`、`--bg` 與前一份儀表板不同
- Google Fonts import 使用本次 Preset 指定字型
- Preset 與上一份不同（D.9 使用規則）；選前查 `Skill/ARCHIVE.md` 跨份總覽，優先選尚未使用的 preset

### GATE 5 — 交付前 QA

以 module-E 的實際分組為準，全部通過：

1. **E.1 A 組（audit 自動）**：`node dev/script/audit-dashboards.mjs <新檔>` exit 0（規則見 E.2）
2. **E.1 C 組（人工判斷）**：資料／視覺／教學 22 列逐項人工／AI 檢核；B 組（template 不變式）只在改過 template 對應程式時才跑
3. **E.9 Design QA**（SKILL Phase 4.5）結果已輸出

---

## F.4 設計原則

**Rapid Prototyper 只做 Layer 1 的原因**
Layer 1 只調骨架（頁數、分派、空殼；HEAD／DATA／utility 已從 template 與 Phase 2 帶入），邏輯密度低，適合快速輸出驗證。
Layer 2…N 有 Chart.js draw logic + 教學內容，需要 Frontend Developer 的精確度。

**full-output-enforcement + Frontend Developer 綁定的原因**
全輸出防截斷是 mechanism；Frontend Developer 負責內容正確性。
分開容易各自為政（前者只顧不截斷，後者只顧邏輯不顧長度限制）。

**Minimal Change Engineer 的 scope 限制**
只能修 gate 明確指出的問題，禁止重構周邊代碼。
防止「修一個 bug 順手改了整個 mk() 函數」的擴散型回歸。

**Agent 備份的使用方式**
本專案 `Agent/` 目錄存有所有 active agent 的 `.md` 定義（凍結版，隨 repo 走）。
派工時直接讀 `Agent/<檔名>` 取得角色定義就地派工，不要複製到全域 agent 目錄（見 CLAUDE.md「Agent 資料夾說明」）。
