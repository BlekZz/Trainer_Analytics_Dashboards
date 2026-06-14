# 分析訓練儀表板教材庫

專為各產業實習生設計的互動式分析訓練素材。每份儀表板是單一 HTML 檔案——CSS、合成數據、圖表、問答題全部自包含，不需安裝任何套件，直接用瀏覽器開啟即可使用。

---

## 現有儀表板

| 檔案 | 產業 | 分析主題 | 頁數 | 題數 |
|---|---|---|---|---|
| `餐飲連鎖_門市營運分析_訓練儀表板教材.html` | 餐飲連鎖 | 門市業績 × 顧客行為 × 跨維度分析 | 3 | 17+4 |
| `電商DTC_會員交易分析_訓練儀表板教材.html` | 電商 DTC | 會員結構 × 交易模式 × 交叉分析 | 3 | 18+ |
| `零售便利商店_商品庫存補貨分析_訓練儀表板教材.html` | 零售便利商店 | ABC 分類 × 庫存健康 × 毛利結構 × 補貨策略 | 4 | 19+8 |

> 所有數據均為合成資料，僅供訓練用途。

---

## 目錄結構

```
├── Dashboard/          ← 成品 HTML（直接交付給學員）
├── Skill/              ← 製作規範文件 + 無數據骨架範本
│   ├── template.html   ← 新 dashboard 從這裡開始
│   ├── SKILL.md        ← 快速啟動與整體規範
│   ├── module-A-data.md      ← 數據設計規範
│   ├── module-B-visual.md    ← 視覺與互動規範
│   ├── module-C-pedagogy.md  ← 教學設計規範
│   ├── module-D-diff.md      ← 視覺/教學/結構三軸差異化策略
│   └── module-E-checklist.md ← 上線前 QA 清單
└── dev/                ← 開發筆記（非交付物）
    ├── dev-knowhow.md  ← 技術踩坑記錄
    └── TODO.md         ← 待辦事項
```

---

## 如何使用

直接在瀏覽器開啟 `Dashboard/` 內的 HTML 檔案即可。無需伺服器、無需安裝。

建議瀏覽器：Chrome / Edge（需支援 ES2020+）。最低視窗寬度 960px（桌機/平板情境設計）。

---

## 如何新增一份儀表板

1. 複製 `Skill/template.html` → `Dashboard/{產業}_{分析主題}_訓練儀表板教材.html`
2. 填入 `DATA` 物件中的所有數值
3. 在瀏覽器開啟，確認 console 印出 `✓ All data consistency checks passed`
4. 補充 `assertConsistency()` 中的跨欄驗算規則
5. 從 `Skill/module-D-diff.md` D.9 選一個 Visual Preset（P1–P7），不可與前一份相同
6. 撰寫 KPI 卡、圖表 findings、QA 題組
7. **Phase 4.5 Design QA**：依 `Skill/module-E-checklist.md` E.9 跑完 18 項視覺驗收，全部通過才繼續
8. 對照 `Skill/module-E-checklist.md` E.1 完成 44 項上線前完整 QA

---

## 技術規格

**外部依賴（CDN，版本鎖定）**

```
Chart.js 4.4.0
chartjs-plugin-datalabels 2.2.0
chartjs-plugin-annotation 3.0.1
Google Fonts: Lora · Outfit · JetBrains Mono
```

**架構關鍵點**

- `const DATA = { ... }` — 所有數字的唯一來源，禁止在 HTML 或圖表呼叫中硬編碼
- `assertConsistency()` — 每次頁面載入執行跨欄驗算，確保數字一致
- `mk(id, type, labels, datasets, opts)` — 統一圖表工廠，套用共用 tooltip 與 legend 預設值
- `c(key, alpha)` — 色彩語意函式，六個語意鍵：`blue` / `teal` / `orange` / `purple` / `red` / `gray`
- Lazy rendering：切換到對應分頁才初始化圖表，`initialized[name]` 防止重複繪製

**Header 三列設計**

```
Row 1: 文件命名式標題 + 資料 chips          ✏️ 製作者  🗓️ 製作時間
Row 2: [📖 指標定義 ›]  [Tab1][Tab2][Tab3]
Row 3: ● 事實  ● 正向  ● 注意  ● 警示  ● 行為  │ L1 L2 L3 │ F I A
```

**色彩語意**

| 色鍵 | 色碼 | 語意 |
|---|---|---|
| `blue` | `#3b82f6` | 事實數據 / 主資料 |
| `teal` | `#2aab85` | 正向 / 穩定 |
| `orange` | `#d4870a` | 注意 / 季節性 |
| `red` | `#d43a2f` | 警示 / 流失 |
| `purple` | `#7c4dff` | 行為 / 時序 |
| `gray` | `rgba(139,148,158,α)` | 對照 / 長尾 |

---

製作者：Blake · [blake.lee@inboundmarketing.tw](mailto:blake.lee@inboundmarketing.tw)
