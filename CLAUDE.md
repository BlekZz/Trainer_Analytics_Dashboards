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
`Skill/` 只是鏡像，權威版在 `~/.claude/skills/dashboard-training-factory/`，兩者應保持同步。

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
