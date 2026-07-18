# Module F — Agent 工作流整合

本模組定義如何將 10 個 Active Agents 嵌入 Phase 1–5 生成工作流，
每個 agent 有明確的入場條件、交付物與離場稽核門。

---

## F.1 工作流總覽

```
Phase 1 ─────────────────────────────────────────────────────
  [Analytics Reporter] → KPI 架構、資料維度、圖表選型
  [Corporate Training Designer] → F/I/A 問題矩陣、難度分佈、陷阱設計
                    ↓
             ▼ GATE 1：USER 確認規格
               （結構 3–4 頁、圖表清單、問題難度分佈、資料錨點預告）

Phase 2 ─────────────────────────────────────────────────────
  [Code Reviewer] → 審查 assertConsistency 邏輯設計
                    （cross-check 條件覆蓋所有 anchor 值）
                    ↓
             ▼ GATE 2：Console ✓ All data consistency checks passed
               失敗 → 回 Code Reviewer 修資料，不進 Phase 3

Phase 3 ─────────────────────────────────────────────────────
  Layer 1  [Rapid Prototyper]
           → HEAD + CSS + DATA 物件 + assertConsistency + utility functions
                    ↓
             ▼ GATE 3-L1：瀏覽器開啟，assertConsistency 通過，console 無錯

  Layer 2–4  [full-output-enforcement] + [Frontend Developer]
           → draw functions + Chart.js canvas 渲染 + QA items
                    ↓
             ▼ GATE 3-L2/3/4：每層寫入後瀏覽器確認圖表渲染，QA 可展開
               失敗 → [Minimal Change Engineer] 精確點修，不重跑整層

Phase 4 ─────────────────────────────────────────────────────
  [redesign-existing-projects]
           → 套用 Visual Preset（P1–P7）
           → 覆蓋 :root tokens + Google Fonts import
                    ↓
             ▼ GATE 4：色票 / 字型與前一份儀表板確認不同

Phase 5 ─────────────────────────────────────────────────────
  [Evidence Collector] → 截圖驗收，逐項跑 module-E 9 項 hard-check
  [Code Reviewer]      → 最終 JS 邏輯 + F/I/A 標記完整性
                    ↓
             ▼ GATE 5：9 項全通，無未標 ⚠ 的 A 題
               失敗 → [Minimal Change Engineer] 點修，不重跑 Phase 3

交付後 ──────────────────────────────────────────────────────
  [Technical Writer] → 更新 dev/tech-notes.md（新踩坑 or 確認模式）
```

---

## F.2 角色定位總表

| Agent | 檔案 | 工作角色 | 觸發時機 | On-demand |
|---|---|---|---|---|
| Analytics Reporter | `support-analytics-reporter.md` | 資料架構師：KPI、資料維度、圖表選型 | Phase 1 強制 | 否 |
| Corporate Training Designer | `corporate-training-designer.md` | 教學設計師：F/I/A 問題、難度矩陣、陷阱 | Phase 1 強制 | 否 |
| Code Reviewer | `engineering-code-reviewer.md` | 資料稽核員：assertConsistency + 最終 JS 審查 | Phase 2 + Phase 5 | 否 |
| Rapid Prototyper | `engineering-rapid-prototyper.md` | 骨架工程師：Layer 1，不寫 draw logic | Phase 3 Layer 1 | 否 |
| full-output-enforcement | `output-skill.md` | 輸出守門員：防 Layer 2–4 截斷 | Phase 3 Layer 2–4 | 否 |
| Frontend Developer | `engineering-frontend-developer.md` | 圖表工程師：Chart.js 實作、canvas 渲染 | Phase 3 Layer 2–4 | 否 |
| redesign-existing-projects | `redesign-skill.md` | 視覺設計師：Preset 套用、跨儀表板差異化 | Phase 4 強制 | 否 |
| Evidence Collector | `testing-evidence-collector.md` | QA 驗收員：截圖 + 9 項 hard-check | Phase 5 強制 | 否 |
| Minimal Change Engineer | `engineering-minimal-change-engineer.md` | 點修工：gate 失敗時針對性修復 | Gate 3/5 失敗時 | ✓ |
| Technical Writer | `engineering-technical-writer.md` | 知識整合：tech-notes.md 更新 | 交付後 | ✓ |

---

## F.3 稽核門檻明細

### GATE 1 — 規格確認（Phase 1 出口）

使用者必須確認以下四項，缺一不進 Phase 2：

1. **頁數結構**：3–4 頁，每頁有明確分析意圖
2. **圖表清單**：每頁 3–6 張，標明圖表類型與教學作用
3. **問題難度分佈**：L1/L2/L3 × F/I/A 二維矩陣有覆蓋
4. **資料錨點預告**：總會員 / 總訂單 / 總營收等核心數字已列出

### GATE 2 — 資料一致性（Phase 2 出口）

- 瀏覽器 Console 必須輸出 `✓ All data consistency checks passed`
- assertConsistency 最少覆蓋模組 A 的 9 條標準 check
- 任何 `⚠ Data consistency errors` 都必須清零才能繼續

### GATE 3-L1 — 骨架驗收

- 頁面可在瀏覽器開啟（無 404、無 MIME error）
- Console 無 JS TypeError / ReferenceError
- `assertConsistency()` 在 DOMContentLoaded 自動執行並通過

### GATE 3-L2/3/4 — 每層圖表驗收

- 對應分頁切換後，所有 canvas 有渲染（非空白）
- Chart.js datalabels 設定 display:true 的圖表有顯示數值
- QA 項目可點擊展開（onclick 有效）

### GATE 4 — 視覺差異確認

- `:root` 的 `--accent`、`--bg` 與前一份儀表板不同
- Google Fonts import 使用本次 Preset 指定字型
- 不得與既有任何一份儀表板的 Preset 完全相同

### GATE 5 — 交付前 QA

對應 module-E 的 9 項 hard-check，全部通過：

1. assertConsistency 通過
2. 所有分頁圖表均有渲染
3. 所有 I/A 題答案有 F/I/A 標記
4. 所有 A 題有 ⚠ 陷阱提示
5. 設計選擇揭露面板存在且可展開
6. 定義面板（`<dl>`）存在且有內容
7. 訓練題面板存在（含進階訓練題）
8. 版面在 1280px 寬度下無橫向捲軸
9. 圖表 tooltip hover 可正常觸發（interaction mode 已設定）

---

## F.4 設計原則

**Rapid Prototyper 只做 Layer 1 的原因**
Layer 1 是骨架（HEAD + DATA + utility）邏輯密度低，適合快速輸出驗證。
Layer 2–4 有 Chart.js draw logic + 教學內容，需要 Frontend Developer 的精確度。

**full-output-enforcement + Frontend Developer 綁定的原因**
全輸出防截斷是 mechanism；Frontend Developer 負責內容正確性。
分開容易各自為政（前者只顧不截斷，後者只顧邏輯不顧長度限制）。

**Minimal Change Engineer 的 scope 限制**
只能修 gate 明確指出的問題，禁止重構周邊代碼。
防止「修一個 bug 順手改了整個 mk() 函數」的擴散型回歸。

**Agent 備份的使用方式**
本專案 `Agent/` 目錄存有所有 active agent 的 `.md` 備份。
clone repo 的協作者將檔案複製到 `~/.claude/agents/` 即可直接調用，
不需從 Claude marketplace 重新安裝。
