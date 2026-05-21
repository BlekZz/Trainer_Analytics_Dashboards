# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

Single-file analytics training dashboard for DTC/e-commerce interns. All code — CSS, data, charts, Q&A — lives in `intern-analytics-demo-v3.html` (1,428 lines). No build step, no dependencies to install. Open in a browser directly.

## External Dependencies (CDN, pinned)

```
Chart.js 4.4.0
chartjs-plugin-datalabels 2.2.0
chartjs-plugin-annotation 3.0.1
Google Fonts: Lora, Outfit, JetBrains Mono
```

## Architecture

**Single source of truth:** All chart numbers live in the `DATA` object at line ~1027. Never hardcode a number in HTML or chart calls — read from `DATA.*` instead.

**Consistency guard:** `assertConsistency()` (line ~1096) validates internal cross-checks (tier counts = total members, order distribution = total orders, etc.) on every page load. Run the file in a browser and check the console — `✓ All data consistency checks passed` must appear before shipping any data change.

**Lazy chart rendering:** Charts are drawn only when their tab is first activated. `switchPage(name)` sets `initialized[name] = true` and calls `draw(name)` once. Adding a chart to a page = add the `<canvas id="cXxx">` in HTML, then add the draw call inside `drawMember()`, `drawTx()`, or `drawCross()`.

**Chart factory `mk(id, type, labels, datasets, opts)`:** Wrapper around `new Chart(...)` with shared tooltip style (`TT`) and legend defaults baked in. Use for all non-donut charts. Donut/doughnut charts need the custom `centerText` plugin so they are constructed inline.

**Color palette (`PALETTES` / `c(key, alpha)`):** Six semantic keys — `blue` (fact/data), `teal` (positive), `orange` (caution), `purple` (behavioral/time), `red` (alert/churn), `gray` (neutral). Always use `c('key', alpha)` rather than raw hex in chart datasets to stay consistent with the CSS color semantics declared in `:root`.

## Page & Section Structure

| Tab | Page div ID | Draw function | Sections |
|---|---|---|---|
| 👤 會員分析 | `page-member` | `drawMember()` | KPI cards → 新增/流失趨勢 → 等級結構 → 渠道來源 → 年齡 |
| 💳 交易分析 | `page-transaction` | `drawTx()` | KPI cards → 月度品類堆疊 → 品類圓餅 → 訂單分佈 → 時段 → 付款方式 → 等級消費 → 頻次 → 渠道LTV → 再購間隔 → 訓練題 |
| 🔗 交叉分析 | `page-cross` | `drawCross()` | Cross-tab charts + training questions |

## Q&A / Training Question Conventions

Each `<div class="qa-item">` follows this pattern:
- `onclick="toggleQA(this)"` on `.qa-question` toggles `.open` class
- Answer blocks use three semantic headers: `📊 觀察` (facts from chart), `🧠 推論` (inference), `🎯 行動` (action)
- Inline `<span class="fia f">F</span>` / `<span class="fia i">I</span>` / `<span class="fia a">A</span>` tags annotate Fact / Inference / Assumption
- Difficulty badges: `<span class="qa-level l1">L1</span>` (single chart), `l2` (same-page cross), `l3` (cross-page)
- `<div class="trap-block">` for common wrong-answer warnings
- `<div class="nav-hint" onclick="switchPage(...)">` for cross-page navigation hints

## CSS Design Tokens

All colors, radii, and shadows are CSS variables in `:root` (lines 13–51). Edit there, not inline. Key semantic mapping mirrors the JS `PALETTES`:

| Variable | Semantic |
|---|---|
| `--accent` `#2d5be3` | Primary data / blue |
| `--accent-2` `#e8503a` | Alert / churn / red |
| `--accent-3` `#2aab85` | Positive / teal |
| `--accent-4` `#d4870a` | Caution / orange |
| `--accent-5` `#7c4dff` | Behavioral / purple |

## File Naming Convention

All deliverable HTML files must follow this pattern:

```
{產業}_{分析主題}_訓練儀表板教材_v{N}.html
```

Examples:
- `電商DTC_會員交易分析_訓練儀表板教材_v1.html`
- `餐飲連鎖_門市營運分析_訓練儀表板教材_v1.html`
- `金融保險_客戶留存分析_訓練儀表板教材_v2.html`

Rules:
- 產業 and 分析主題 use Traditional Chinese, no spaces
- Version starts at `v1` for each new industry/topic combination; increment within the same topic
- Never use English slugs or the old `intern-analytics-demo-vN` pattern for final deliverables

## When Adding a New Dashboard Version

1. Name the file per the convention above before writing any code.
2. Update `DATA` first — run in browser, confirm `assertConsistency()` passes.
3. Add any new consistency checks to `assertConsistency()` to cover new cross-references.
4. Do not split into multiple files; the single-file constraint is intentional (zero-dependency delivery to interns).
