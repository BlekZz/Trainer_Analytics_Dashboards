# 模組 D：差異化策略 (Differentiation Strategy)

> **核心原則：差異化不是「換產業換顏色」，而是讓每一份 dashboard 訓練到不同的分析肌肉群。**

---

## D.1 為什麼需要差異化？

如果每份 dashboard 結構都長得跟前一份一樣，學員會：
1. 對「會員結構→交易行為→交叉分析」的三頁式產生套路化反射
2. 看到圓餅圖就找「主要品類佔比」、看到時段圖就答「晚間 20 點高峰」
3. 失去「初見資料」的思考訓練

**差異化的目的是強制學員重新建立分析直覺**。

---

## D.2 三軸差異化框架

每份 dashboard 從三個獨立軸做差異化，**至少在 2 個軸有顯著差異**才算合格：

```
        視覺軸 (Visual)
            ↕
   ┌────────┴────────┐
   ↓                 ↓
教學軸 (Pedagogy) ↔ 結構軸 (Structure)
```

### 視覺軸 — 同類圖表用不同呈現

| 元素 | 變體選項 |
|---|---|
| 主色系 | 藍/綠/紫/橘 + 中性灰（語意不變，色相換） |
| 整體調性 | 暖色（橘為主）vs 冷色（藍為主）vs 中性（灰+一色強調） |
| 字型組合 | Lora+Outfit / Source Serif+Inter / Playfair+IBM Plex |
| 圖表變體 | bar→column / donut→half-donut / line→area / 排序方向 |
| 動畫 | 預設 480ms easeOutQuart / 加長到 800ms / 完全關掉 |
| 邊角 | radius 14px / 8px / 0px（銳利硬派） |
| 卡片陰影 | soft shadow / hard line / 完全 flat |
| KPI 樣式 | 縱向卡 / 橫向 strip / 內嵌 chart-block 頂部 |

### 教學軸 — 同類能力用不同切入

| 元素 | 變體選項 |
|---|---|
| 答案語氣 | 親切教練式 / 嚴肅顧問式 / 蘇格拉底反問式 |
| 陷阱密度 | 每個 A 題都有 / 只在訓練題有 / 在 I 題也加 |
| F/I/A 嚴格度 | 寬鬆（自然標）/ 嚴格（每句都標）/ 引號式（用 "F:" "I:") |
| nav-hint 風格 | 黃色提示 / 直接內嵌段落 / 浮動按鈕 |
| 訓練題類型 | 全是策略決策 / 全是缺失維度 / 三類混合 |
| 設計選擇揭露 | 8 項詳述 / 3 項深度 / 改成「分析師日記」敘事 |
| 難度分佈 | 平衡型 / 進階傾斜 / 批判型（見 C.9） |
| 定義面板 | 標準口徑 / 含「為什麼這樣定義」短記 / 含「業界常見替代定義」 |

### 結構軸 — 同主題用不同組織

| 元素 | 變體選項 |
|---|---|
| 頁數 | 3 頁（標準）/ 4 頁（細拆）/ 2 頁（高密度） |
| 頁面分組邏輯 | 維度分頁（會員/交易/交叉）/ 漏斗分頁（吸引/啟用/留存/變現）/ 時序分頁（即時/週/月/年） |
| KPI 數量 | 每頁 4 個 / 每頁 3 個 / 第一頁 6 個其他頁不放 |
| 圖表密度 | 每頁 4-6 張（標準）/ 每頁 8+ 張（高密度）/ 每頁 3 張（聚焦） |
| Findings 位置 | 圖下方（標準）/ 圖右側（並列）/ 整頁底部統一區塊 |
| 訓練題位置 | P3 末尾（標準）/ 每頁末尾各放 1-2 題 / 獨立第 4 頁全是訓練 |
| 起手頁 | 從 KPI 摘要起（標準）/ 從訓練題起（先挑戰再看資料）/ 從定義面板起 |

---

## D.3 差異化套件抽選

當使用者沒指定差異化偏好時，從以下套件中**至少抽 3 個元素**（不同軸混搭）：

```python
# 差異化抽選邏輯（示意）
import random

VISUAL_VARIANTS = [
  '主色換綠系 (#2aab85 主)',
  '主色換紫系 (#7c4dff 主)',
  '所有 donut 改 half-donut',
  '所有 bar 改 column',
  '整體 radius 縮成 6px（更銳利）',
  'KPI 改橫向 strip',
  '圖表動畫關掉（瞬間顯示）',
  '陰影改 hard-line（無 blur）',
]

PEDAGOGY_VARIANTS = [
  '陷阱密度加倍（I 題也加陷阱）',
  '訓練題從 4 道改為 6 道',
  '加入「分析師日記」敘事段落取代設計選擇揭露',
  'F/I/A 標註改為 emoji（📍 ⚡ 🤔）',
  'nav-hint 改為深色背景強調感',
  '定義面板加「為什麼這樣定義」短記',
]

STRUCTURE_VARIANTS = [
  '改成 4 頁（漏斗式分頁）',
  '改成 2 頁（高密度單頁）',
  'KPI 砍到每頁 3 個（換 spotlight 卡）',
  'Findings 移到圖表右側並列',
  '訓練題拆到每頁末尾',
  '起手頁從訓練題開始',
]

# 至少抽 1 個視覺 + 1 個教學 + 1 個結構
chosen = (random.sample(VISUAL_VARIANTS, 1)
          + random.sample(PEDAGOGY_VARIANTS, 1)
          + random.sample(STRUCTURE_VARIANTS, 1))
```

執行前先把抽到的差異化列出來給使用者確認。

---

## D.4 必須差異化的元素（避免完全雷同）

不論差異化抽到什麼，以下元素**每份 dashboard 都必須跟前一份不同**：

1. **資料錨點數字** — 不可重複（前一份是 48,263 → 這份不能用同數字）
2. **訓練題主題** — 4 道訓練題的角度不可完全照抄
3. **陷阱主題** — 至少 3 個陷阱必須是這份特有的
4. **產業情境** — 不可同產業重複（除非使用者明確要求「同產業不同切角」）
5. **設計選擇揭露的 8 項中至少 3 項要替換** — 確保元層級洞察有新東西

---

## D.5 差異化但不可妥協的元素

無論差異化怎麼做，以下絕對不能變：

1. **F/I/A 標註系統存在** — 教學核心，不可動
2. **assertConsistency 9 條檢查** — 資料完整性紅線
3. **三段式答案結構** — 觀察→推論→行動（依 F/I/A 縮減段數）
4. **陷阱區塊存在** — 至少在訓練題與 A 題出現
5. **指標定義面板** — 不可省略
6. **DEMO 合成資料 chip** — 必須明確標示「非真實資料」
7. **設計選擇揭露區塊** — 教學最有價值的部分

---

## D.6 差異化執行範例

### 範例 1：使用者輸入

```
產業：線上教育平台
主題：學生轉換漏斗 + 完課率分析
差異化偏好：題目要更難一點、結構不要照抄
```

### 範例 2：執行決策

**結構軸差異化**：改用「漏斗式 4 頁」
```
P1: 註冊與啟用（top of funnel）
P2: 學習行為與互動（engagement）
P3: 完課與續訂（retention）
P4: 訓練題 + 設計選擇揭露（獨立教學頁）
```

**視覺軸差異化**：主色換綠系 + radius 8px + KPI 改橫向 strip

**教學軸差異化**：難度分佈改批判型（L3·A 多）+ 陷阱密度加倍（I 題也加）+ 訓練題全是「批判性質疑」

**資料差異化**：總註冊 26,840 / 總啟用 18,503 / 完課率 32.7%（vs 前份 48,263 / 96,483）

### 範例 3：差異化 changelog 輸出

執行完畢後，必須輸出此份跟基準範本的差異列表：

```markdown
## 差異化 Changelog

### 視覺軸
- 主色：藍 #2d5be3 → 綠 #2aab85
- 卡片 radius：14px → 8px
- KPI 配置：縱向 4 卡 → 橫向 strip

### 教學軸
- 陷阱密度：每 A 題 → 每 I+A 題
- 訓練題類型：策略 / 取捨 / 集中度 / 缺失 → 全部改批判性質疑
- 難度分佈：平衡型 → 批判型（L3·A 多）

### 結構軸
- 分頁邏輯：維度分頁（會員/交易/交叉）→ 漏斗分頁（吸引/啟用/留存/變現）
- 訓練題位置：P3 末尾 → 獨立 P4

### 資料軸
- 錨點：48,263 / 96,483 / 4,821 萬 → 26,840 / 18,503 / 32.7%
```

---

## D.7 同主題不同切角設計

如果使用者要求「同產業 + 同主題但訓練不同能力」，差異化重點落在**教學軸**：

| 同主題不同切角範例 | 訓練重點差異 |
|---|---|
| 會員分析（v1）vs 會員分析（v2） | v1: 結構推論；v2: 流失歸因 |
| Funnel（v1）vs Funnel（v2） | v1: 階段瓶頸辨識；v2: 跨期 cohort 對比 |
| 留存分析（v1）vs 留存分析（v2） | v1: 月度 churn；v2: 觸發事件 → 留存影響 |

這時資料錨點可以接近（讓學員聚焦能力而非適應新數字），但**問題本身與陷阱主題必須完全替換**。

---

## D.8 差異化反模式

1. **🚫 只換色不換結構** — 看起來不一樣但訓練的是同一塊肌肉
2. **🚫 全部差異化過頭** — 沒有可辨識的範本基線，學員每份都要重新學介面
3. **🚫 差異化破壞核心** — 為了不一樣把 F/I/A 拿掉
4. **🚫 沒輸出 changelog** — 使用者不知道哪裡不一樣，差異化沒被「看見」
5. **🚫 同產業同主題差異不足** — 必須教學軸大幅差異
6. **🚫 隨機差異化沒邏輯** — 「我這份換綠色 + 訓練題改 6 道 + 圓餅變半圓」三個元素互不關聯，看起來像 bug

---

## D.9 視覺 Preset 庫

> 從 UI UX Pro Max 資料庫萃取，針對 analytics/BI dashboard 情境整理成 7 個可直接套用的視覺套餐。
> 每個 preset 提供完整的 CSS token override + 字型配對，選一個後覆蓋 template 的 `:root` 即可。

**使用規則：**
- D2 目前預設是 P2（藍系分析型），這是 template 的基線，**每次產出需跟上一份使用不同 preset**
- Preset 只鎖定色彩語意的「色相」，五個語意角色（主資料 / 正向 / 注意 / 警示 / 行為）不變
- 深色 preset (P1/P2/P4/P7) 適合長時間盯看的分析工作；淺色 preset (P3/P5/P6) 適合簡報式呈現

---

### Preset 速查表

| # | 名稱 | 底色 | 主色（--accent） | 正向（--accent2） | 字型組合 | 適合產業 |
|---|---|---|---|---|---|---|
| **P1** | 深色財務型 | `#020617` | `#3B82F6` | `#22C55E` | IBM Plex Sans × IBM Plex Sans | 金融、FinTech、證券 |
| **P2** | 藍系分析型 *(預設)* | `#0d1117` | `#2d5be3` | `#2aab85` | Outfit × Lora | 電商、SaaS、通用分析 |
| **P3** | 輕色企業型 | `#F8FAFC` | `#2563EB` | `#059669` | Plus Jakarta Sans × Plus Jakarta Sans | B2B、CRM、供應鏈 |
| **P4** | 暗色科技型 | `#0F172A` | `#22D3EE` | `#22C55E` | Space Grotesk × DM Sans | 製造、IoT、物流 |
| **P5** | 醫療信任型 | `#ECFEFF` | `#0891B2` | `#059669` | Lexend × Source Sans 3 | 醫療、健康、公衛 |
| **P6** | 電商活力型 | `#ECFDF5` | `#059669` | `#10B981` | Rubik × Nunito Sans | 零售、電商、DTC |
| **P7** | 銀行深色型 | `#020617` | `#1E3A8A` | `#A16207` | IBM Plex Sans × IBM Plex Sans | 銀行、保險、傳統金融 |

---

### P1 深色財務型

```css
:root {
  --bg: #020617; --bg-card: #0E1223; --bg-finding: #131B2F;
  --accent: #3B82F6; --accent2: #22C55E; --warn: #D97706; --danger: #EF4444; --purple: #8B5CF6;
  --text: #F8FAFC; --text-muted: #94A3B8; --border: rgba(255,255,255,0.07);
  --radius: 10px;
}
```
```html
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;500;600;700&display=swap">
/* font-family: 'IBM Plex Sans', sans-serif; 標題與內文同字族，靠字重區分層級 */
```
- **調性：** 嚴肅、資料密度高、信任感強
- **圖表色建議：** 正向指標用 `#22C55E`，負向用 `#EF4444`，中性資料用 `#3B82F6`
- **反模式：** 不可用淺色背景 / 不可用圓角 > 12px / 不可用裝飾性動畫

---

### P2 藍系分析型（預設 baseline）

```css
/* template 原始 :root，無需修改 */
:root {
  --bg: #0d1117; --bg-card: #161b27; --bg-finding: #1a2030;
  --accent: #3b82f6; --accent2: #2aab85; --warn: #d4870a; --danger: #d43a2f; --purple: #7c4dff;
  --text: #e6edf3; --text-muted: #8b949e; --border: rgba(255,255,255,0.08);
  --radius: 14px;
}
```
```html
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Lora:wght@400;600&family=Outfit:wght@400;500;600&family=JetBrains+Mono:wght@400;700&display=swap">
```
- **調性：** 中性專業，資料導向，適合多數分析情境
- **注意：** 這是 baseline，不應連續兩份都用 P2

---

### P3 輕色企業型

```css
:root {
  --bg: #F8FAFC; --bg-card: #FFFFFF; --bg-finding: #F1F5FD;
  --accent: #2563EB; --accent2: #059669; --warn: #D97706; --danger: #DC2626; --purple: #7C3AED;
  --text: #0F172A; --text-muted: #64748B; --border: rgba(0,0,0,0.08);
  --radius: 12px;
}
/* header 背景改為白底 */
.site-header { background: rgba(248,250,252,0.97); border-bottom: 1px solid rgba(0,0,0,0.08); }
/* nav-tab active 調整 */
.nav-tab.active { background: rgba(248,250,252,0.97); color: var(--accent); }
```
```html
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap">
```
- **調性：** 明亮、親和、適合簡報式呈現給非技術決策者
- **注意：** 淺色模式需確認 chart 資料顏色仍具足夠對比度（建議 `rgba()` alpha 提高至 0.9）

---

### P4 暗色科技型

```css
:root {
  --bg: #0F172A; --bg-card: #1B2336; --bg-finding: #202D3F;
  --accent: #22D3EE; --accent2: #22C55E; --warn: #F59E0B; --danger: #EF4444; --purple: #A78BFA;
  --text: #F8FAFC; --text-muted: #94A3B8; --border: rgba(255,255,255,0.07);
  --radius: 8px;
}
```
```html
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=DM+Sans:wght@400;500;700&display=swap">
/* 標題: Space Grotesk；內文: DM Sans */
```
- **調性：** 科技感、高密度、偏硬派（radius 8px 強調精確）
- **適用場景：** 製造業 OEE 分析、物流追蹤、IoT 感測器 dashboard

---

### P5 醫療信任型

```css
:root {
  --bg: #ECFEFF; --bg-card: #FFFFFF; --bg-finding: #E0F9FB;
  --accent: #0891B2; --accent2: #059669; --warn: #D97706; --danger: #DC2626; --purple: #7C3AED;
  --text: #164E63; --text-muted: #64748B; --border: rgba(0,0,0,0.07);
  --radius: 16px;
}
.site-header { background: rgba(236,254,255,0.97); }
```
```html
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Lexend:wght@300;400;500;600;700&family=Source+Sans+3:wght@300;400;500;600;700&display=swap">
/* 標題: Lexend（高可及性設計）；內文: Source Sans 3 */
```
- **調性：** 清晰、低刺激、符合 WCAG AA
- **反模式：** 不可用高飽和紅色（用橘代替警示）/ 不可用暗色背景

---

### P6 電商活力型

```css
:root {
  --bg: #ECFDF5; --bg-card: #FFFFFF; --bg-finding: #E8F8F1;
  --accent: #059669; --accent2: #10B981; --warn: #D97706; --danger: #DC2626; --purple: #7C3AED;
  --text: #064E3B; --text-muted: #64748B; --border: rgba(0,0,0,0.07);
  --radius: 14px;
}
.site-header { background: rgba(236,253,245,0.97); }
```
```html
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Rubik:wght@300;400;500;600;700&family=Nunito+Sans:ital,opsz,wght@0,6..12,300;0,6..12,400;0,6..12,600&display=swap">
/* 標題: Rubik；內文: Nunito Sans */
```
- **調性：** 積極、轉換導向、電商氣氛
- **注意：** --accent 和 --accent2 同為綠系，使用時需用色相差或飽和度差異來區分語意

---

### P7 銀行深色型

```css
:root {
  --bg: #020617; --bg-card: #0A1628; --bg-finding: #0F1E35;
  --accent: #1E3A8A; --accent2: #A16207; --warn: #D97706; --danger: #EF4444; --purple: #6366F1;
  --text: #F8FAFC; --text-muted: #94A3B8; --border: rgba(255,255,255,0.06);
  --radius: 8px;
}
```
```html
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;500;600;700&display=swap">
```
- **調性：** 莊重、傳統、合規感強（金色 `--accent2` 作為正向/獲利指標）
- **反模式：** 不可用亮色主視覺 / 不可用圓角 > 10px / 不可使用 AI 紫色系漸層

---

## D.10 圖表選型擴充

> 補充 module-B 未收錄的圖表類型。這些圖表適合特定分析主題，未來新增產業 dashboard 時可作為差異化工具。

| 圖表類型 | 適合訓練主題 | 用 Chart.js 實現難度 | 教學價值 |
|---|---|---|---|
| **Waterfall / 瀑布圖** | 毛利拆解、預算差異、P&L 說明 | 中（需自訂 stacked bar offset） | 高：強迫學員理解加法結構 |
| **Bullet Chart / 子彈圖** | KPI vs 目標、績效達成率 | 中（橫向 bar + annotation） | 高：訓練「目標對比」而非只看絕對值 |
| **Funnel / 漏斗圖** | 轉換分析、會員旅程、購買漏斗 | 低（可用遞減 bar 模擬） | 高：訓練「drop-off 歸因」思維 |
| **Calendar Heatmap** | 時段節律分析、週/月熱力圖 | 高（需自行用 grid 實現） | 中：訓練「時序模式」識別 |
| **Waffle Chart** | 佔比進度（比 pie 更易讀） | 中（CSS grid + 色塊） | 中：適合取代 donut 呈現單一比例 |
| **Candlestick** | 金融/股價資料（銀行、證券產業） | 高（需 chartjs-chart-financial 插件） | 中：限金融產業 dashboard 使用 |
| **Radar / 蜘蛛圖** | 多維度能力評比（員工績效、產品對比） | 低（Chart.js 原生支援） | 中：訓練「多維權衡」思維 |

### 圖表使用底線（來自 UI UX Pro Max charts.csv）

| 規則 | 說明 |
|---|---|
| Donut > 6 類 → 改 stacked bar | 超過 6 個扇形視覺上無法分辨 |
| 散點 < 20 個點 → 改 bar | 樣本太少看不出分佈模式 |
| Pie 禁止在 a11y 優先情境使用 | 色盲者無法分辨扇形 — 必須提供 table 備案 |
| 3D 圖表禁用 | 學術與業界已棄用；訓練 dashboard 中出現 3D 是反面教材 |
| 折線 series > 6 條 → 拆頁或改其他呈現 | 顏色數量超限，視覺雜訊大於資訊量 |
