# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

A collection of single-file analytics training dashboards for industry-specific interns. Each dashboard is a self-contained HTML file — CSS, data, charts, and Q&A all in one file. No build step, no dependencies to install. Open in a browser directly.

## Project Directory Structure

```
分析訓練儀表板/
├── Dashboard/          ← 所有成品 HTML（交付給學員的最終版）
│   ├── 餐飲連鎖_門市營運分析_訓練儀表板教材_v1.html
│   └── 電商DTC_會員交易分析_訓練儀表板教材_v3.html
├── Skill/              ← dashboard-training-factory skill 的本地鏡像（唯讀參考）
│   ├── SKILL.md
│   ├── template.html   ← 無數據骨架，新 dashboard 從這裡開始
│   ├── module-A-data.md
│   ├── module-B-visual.md
│   ├── module-C-pedagogy.md
│   ├── module-D-diff.md
│   └── module-E-checklist.md
├── dev/                ← 開發文件（非交付物）
│   ├── dev-knowhow.md  ← 技術踩坑記錄
│   └── TODO.md         ← 待辦事項
└── CLAUDE.md
```

**成品放 `Dashboard/`，新 dashboard 從 `Skill/template.html` 開始開發。**

### Skill/ 的定位（2026-07-18 起）

`Skill/` 是**本專案的凍結自足版**（版本鎖定，隨 repo 走），不再與任何全域路徑保持同步：

- 在本專案 scale 內繼續產同版本的 dashboard 流水線 → **直接用這份 project-based `Skill/`，不需啟動任何 global skill**。
- 全域備份在 `~/.claude/coldbench/skills/dashboard-training-factory/`（僅備份用途，無同步義務）。
- 教學方法論的**權威演進版**已遷移至 tutor skill family（`~/.claude/coldbench/skills/tutor-*` 與 `mock-data-forge`）——**開新的教學專案請用 `/init-tutorial`，勿以本專案為起點**。

## External Dependencies (CDN, pinned)

```
Chart.js 4.4.0
chartjs-plugin-datalabels 2.2.0
chartjs-plugin-annotation 3.0.1
Google Fonts: varies by visual preset (see Skill/module-D-diff.md D.9)
  Baseline (P2): Lora, Outfit, JetBrains Mono
  Other presets: IBM Plex Sans / Space Grotesk+DM Sans / Plus Jakarta Sans /
                 Lexend+Source Sans 3 / Rubik+Nunito Sans (see each preset spec)
```

## Architecture

**Single source of truth:** All chart numbers live in the `DATA` object (search `const DATA = {`). Never hardcode a number in HTML or chart calls — read from `DATA.*` instead.

**Consistency guard:** `assertConsistency()` validates internal cross-checks on every page load. Run the file in a browser and check the console — `✓ All data consistency checks passed` must appear before shipping any data change.

**Lazy chart rendering:** Charts are drawn only when their tab is first activated. `switchPage(name)` sets `initialized[name] = true` and calls the draw function once.

**Chart factory `mk(id, type, labels, datasets, opts)`:** Wrapper around `new Chart(...)` with shared tooltip style (`TT`) and legend defaults. Use for all non-donut charts; donut needs inline `centerText` plugin.

**Color function `c(key, alpha)`:** Six semantic keys — `blue` / `teal` / `orange` / `purple` / `red` / `gray`. Always use `c('key', alpha)` rather than raw hex.

## Q&A / Training Question Conventions

Each `<div class="qa-item">` follows this pattern:
- `.question` with `onclick="toggleQA(this)"` + badge + question text + arrow
- `.answer` with `<div class="answer-block">` containing `<p>` tagged with `<span class="tag-f">F:</span>` / `tag-i` / `tag-a`
- `<span class="fia f/i/a">` inline within answer text
- Difficulty badges: `<span class="badge l1/l2/l3">`
- `<div class="trap-block">` for wrong-answer warnings
- `<div class="nav-hint" onclick="switchPage(...)">` for cross-page hints (摺疊時隱藏)

## CSS Design Tokens

CSS variables in `:root`. Key semantic mapping (values below are P2 baseline defaults):

| Variable | Semantic | P2 Baseline |
|---|---|---|
| `--accent` | Primary data | `#3b82f6` |
| `--accent2` | Positive / teal | `#2aab85` |
| `--warn` | Caution / orange | `#d4870a` |
| `--danger` | Alert / churn | `#d43a2f` |
| `--purple` | Behavioral / time | `#7c4dff` |

**Visual Presets:** 7 complete `:root` override sets (P1–P7) are defined in `Skill/module-D-diff.md` D.9.
Each preset covers bg colors, accent tokens, font imports, and industry fit. Select one per dashboard to ensure visual differentiation across the series.

## File Naming Convention

All deliverable HTML files must follow this pattern:

```
{產業}_{分析主題}_訓練儀表板教材.html
```

Examples:
- `電商DTC_會員交易分析_訓練儀表板教材.html`
- `餐飲連鎖_門市營運分析_訓練儀表板教材.html`
- `金融保險_客戶留存分析_訓練儀表板教材.html`

Rules:
- 產業 and 分析主題 use Traditional Chinese, no spaces
- No version suffix — version is tracked via git, not filename
- Never use English slugs or the old `intern-analytics-demo-vN` pattern for final deliverables

## When Adding a New Dashboard

1. **選 Visual Preset** — 從 `Skill/module-D-diff.md` D.9 選一個 preset，不可與前一份相同。覆蓋 `:root` tokens 與 Google Fonts import。
2. Start from `Skill/template.html` — copy to `Dashboard/{產業}_{主題}_訓練儀表板教材.html`.
3. Fill in `DATA` first; run in browser, confirm `assertConsistency()` passes.
4. Add cross-check rules to `assertConsistency()` for every anchor value.
5. Keep everything in one file — single-file constraint is intentional (zero-dependency delivery to interns).
6. Once complete, the file stays in `Dashboard/`; no version suffix in filename (git tracks versions).

---

## Agent 資料夾說明

`Agent/` 目錄存放本專案所有 active agent 的 `.md` 定義，隨 repo 一起 commit，與 `Skill/` 同屬**凍結自足版**——本專案派工時直接讀 `Agent/` 內的角色定義就地派工，不需要（也不要）複製到 `~/.claude/agents/`。

**與新架構的關係：** 全域 agent 架構已重組——Corporate Training Designer 與 Code Reviewer 的教學/稽核職能在新架構由 `~/.claude/coldbench/agents/tutor-designer.md` / `tutor-audit-pedagogy.md` / `tutor-audit-accuracy.md` 承接。本專案續用凍結版，不遷移。

**維護規則：** 若本專案內 agent 定義有更新，直接改 `Agent/` 裡對應的 `.md` 並 commit（不外流到全域）。

---

## Active Agents
> 凍結版清單：File 欄對應 `Agent/` 目錄內的檔案（Bench 欄為歷史來源記錄，僅供溯源，不再指向全域目錄）。

Only the agents listed below are active for this project; 派工時直接讀 `Agent/<File>` 取得角色定義。

| Agent | File | Bench | Reason |
|---|---|---|---|
| Frontend Developer | `engineering-frontend-developer.md` | bench_agency-agents | Chart.js canvas 渲染、HTML/CSS/JS 主體建構 |
| Minimal Change Engineer | `engineering-minimal-change-engineer.md` | bench_agency-agents | 精確小型 bug fix（如 mk() 修補）不帶入 scope creep |
| Code Reviewer | `engineering-code-reviewer.md` | bench_agency-agents | assertConsistency 邏輯、資料一致性交叉驗算 |
| Analytics Reporter | `support-analytics-reporter.md` | bench_agency-agents | KPI 設計、資料維度規劃、圖表選型建議 |
| Corporate Training Designer | `corporate-training-designer.md` | bench_agency-agents | F/I/A 問題設計、難度矩陣、陷阱題設計 |
| Technical Writer | `engineering-technical-writer.md` | bench_agency-agents | dev-knowhow.md、CLAUDE.md、Skill 模組維護 |
| full-output-enforcement | `output-skill.md` | bench_taste-skill | 1500+ 行 HTML 生成防截斷，單檔交付必備 |
| redesign-existing-projects | `redesign-skill.md` | bench_taste-skill | Visual Preset（P1–P7）套用、跨儀表板視覺差異化 |
| Rapid Prototyper | `engineering-rapid-prototyper.md` | bench_agency-agents | Phase 1 規格確認後快速搭起骨架 HTML |
| Evidence Collector | `testing-evidence-collector.md` | bench_agency-agents | 圖表渲染後 QA 確認，交付前視覺驗收 |

## Inactive
All agents not listed above are suppressed for this session.
If you need an unlisted agent, explicitly name it in your message（客製需求可用 `/init-agent` 從 coldbench 加裝）.
