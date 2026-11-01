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
| 頁數 | 3 頁（標準）/ 4 頁（細拆）/ 2 頁（高密度）——**頁數規則唯一定義處**：預設 3–4 頁（SKILL Phase 1、F GATE 1 皆依此）；唯一例外是差異化明確抽中／指定「2 頁高密度」；獨立訓練頁計入總頁數，總數仍不超過 4 頁 |
| 頁面分組邏輯 | 維度分頁（會員/交易/交叉）/ 漏斗分頁（吸引/啟用/留存/變現）/ 時序分頁（即時/週/月/年） |
| KPI 數量 | 每頁 4 個 / 每頁 3 個 / 第一頁 6 個其他頁不放 |
| 圖表密度 | 每頁 4-6 張（標準）/ 每頁 8+ 張（高密度）/ 每頁 3 張（聚焦） |
| Findings 位置 | 圖下方（標準）/ 圖右側（並列）/ 整頁底部統一區塊 |
| 訓練題位置 | P3 末尾（標準）/ 每頁末尾各放 1-2 題 / 獨立最後一頁全是訓練（計入頁數上限，見上列） |
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
  '設計選擇揭露改用「分析師日記」敘事呈現（區塊與各項設計選擇的語意必留，只改寫法）',
  'F/I/A 標註附加 emoji（📍 ⚡ 🤔）（F/I/A 字母與 tag-f/i/a、fia class 必留，emoji 只是附加）',
  'nav-hint 改為深色背景強調感',
  '定義面板加「為什麼這樣定義」短記',
  '加入 T5 資料矛盾題（兩指標講相反故事，見 C.7／A 原則 7）',
  '加入「同統計量、不同形狀」教學組（見 A 原則 6）',
  '陷阱覆蓋拉到 4 階段全滿（見 C.4c）',
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

1. **F/I/A 標註系統存在** — 教學核心，不可動（差異化只能附加或改呈現，例如附加 emoji；F/I/A 字母與 class 必留）
2. **assertConsistency 檢查** — 資料完整性紅線（依 A.4 契約：適用的基礎檢查類別都要有、N > 0 且全數通過）
3. **三段式答案結構** — 觀察→推論→行動（依 F/I/A 縮減段數）
4. **陷阱區塊存在** — 至少在訓練題與 A 題出現
5. **指標定義面板** — 不可省略
6. **DEMO 合成資料 chip** — 必須明確標示「非真實資料」
7. **設計選擇揭露區塊** — 教學最有價值的部分（可改為「分析師日記」敘事呈現，區塊與內容語意必留，不可移除）

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
- 主色：藍 #3b82f6 → 綠 #2aab85
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
> 每個 preset 提供完整的 CSS token override（含字型 token `--font-head/--font-body/--font-mono`）+ Google Fonts import。template 的 `c()`、Chart 預設色、TT 在執行期讀 CSS token，**選一個後只需覆蓋 template 的 `:root` 與 Google Fonts import**，不改 JS。
> 選定時機是 SKILL Phase 1（建構前），選完立即跑 audit 看 PAL-01／PAL-02（B.9-1）。下列色值已回填 2026-10-14 驗證後的修正（見 ARCHIVE「配色驗證紀錄」），並於 2026-11-01 以 D.11 產生器（`gen_palette.mjs`，與 audit PAL 同一份計算）全部 10 色對重驗、回填修正色（各 preset 的「配色驗證」註記列舊→新與 ΔE）；速查表與各 preset 詳細設定一致。
> 2026-11-01 重驗結果：P1–P7 全部過 PAL（正常 ≥15、色盲 ≥8，無 WARN）且五色對背景對比 ≥3:1。只換撞色的那幾色，preset 主色（`--accent`）除 P1（與第 3 份重複）、P7（對比 1.95 不足）外都保留。同日 M2 另換 P1 bg（與第 3 份／P7 同底）與 P7 purple（靛色落在紫色區間外），各自註記於下。

**使用規則：**
- D2 目前預設是 P2（藍系分析型），這是 template 的基線，**每次產出需跟上一份使用不同 preset**
- Preset 只鎖定色彩語意的「色相」，五個語意角色（主資料 / 正向 / 注意 / 警示 / 行為）不變
- 深色 preset (P1/P2/P4/P7) 適合長時間盯看的分析工作；淺色 preset (P3/P5/P6) 適合簡報式呈現

---

### Preset 速查表

| # | 名稱 | 底色 | 主色（--accent） | 正向（--accent2） | 字型組合 | 適合產業 |
|---|---|---|---|---|---|---|
| **P1** | 深色財務型 | `#08141A` | `#57A8FF` | `#39C699` | IBM Plex Sans × IBM Plex Sans | 金融、FinTech、證券 |
| **P2** | 藍系分析型 *(預設)* | `#0d1117` | `#3b82f6` | `#2aab85` | Lora × Outfit | 電商、SaaS、通用分析 |
| **P3** | 輕色企業型 | `#F8FAFC` | `#2563EB` | `#099A87` | Plus Jakarta Sans × Plus Jakarta Sans | B2B、CRM、供應鏈 |
| **P4** | 暗色科技型 | `#0F172A` | `#22D3EE` | `#0D9488` | Space Grotesk × DM Sans | 製造、IoT、物流 |
| **P5** | 醫療信任型 | `#ECFEFF` | `#0369A1` | `#049B84` | Lexend × Source Sans 3 | 醫療、健康、公衛 |
| **P6** | 電商活力型 | `#ECFDF5` | `#059669` | `#0284C7` | Rubik × Nunito Sans | 零售、電商、DTC |
| **P7** | 銀行深色型 | `#020617` | `#006DA2` | `#FED420` | IBM Plex Sans × IBM Plex Sans | 銀行、保險、傳統金融 |

---

### P1 深色財務型

```css
:root {
  --bg: #08141A; --bg-card: #0F1E25; --bg-finding: #14262F;
  --accent: #57A8FF; --accent2: #39C699; --warn: #F7931F; --danger: #EF4444; --purple: #8B5CF6;
  --text: #F8FAFC; --text-muted: #94A3B8; --border: rgba(255,255,255,0.07);
  --radius: 10px;
  --font-head: 'IBM Plex Sans', sans-serif; --font-body: 'IBM Plex Sans', sans-serif; --font-mono: 'IBM Plex Mono', monospace;
}
```
```html
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;500;600;700&family=IBM+Plex+Mono:wght@400;600&display=swap">
/* 標題與內文同字族，靠字重區分層級；數字用 IBM Plex Mono */
```
- **配色驗證（D.11 產生器，2026-11-01）：** 原色組 FAIL——orange/red 正常 ΔE 11.8、blue/purple deutan 1.3、orange/teal／red/teal 色盲 7.1／7.4。改 accent `#3B82F6→#57A8FF`、accent2 `#22C55E→#39C699`、warn `#D97706→#F7931F`（保留 purple、danger）後：正常最小 17.0（orange/red）、protan 13.2、deutan 12.0（red/teal），對比最小 4.76（purple）。指令：`--bg '#020617' --anchor purple=#8B5CF6,red=#EF4444`
- **與第 3 份的重複已解除（accent＋bg 換色）：** 原 bg `#020617`＋accent `#3B82F6` 與第 3 份（品牌訊息通道，P7 Modified）相同，P7 也用同一 bg。2026-11-01 先換 accent `#57A8FF`，同日（Sprint_palette_system M2）再換 bg `#020617→#08141A`（深石油藍，h≈220，與 P2 `#0d1117`、P4 `#0F172A`、P7 `#020617` 都不同）、bg-card `#0E1223→#0F1E25`、bg-finding `#131B2F→#14262F`。五色不變，新背景下 `--check` 重驗 PASS：正常最小 17.0（orange/red）、protan 13.2、deutan 12.0（red/teal），對比最小 4.02（purple，對 bg-card）／4.41（對 bg）。指令：`--bg '#0F1E25' --check blue=#57A8FF,teal=#39C699,orange=#F7931F,purple=#8B5CF6,red=#EF4444`。字型（IBM Plex）仍與第 3 份相同
- **調性：** 嚴肅、資料密度高、信任感強
- **圖表色建議：** 正向指標用 `--accent2`，負向用 `--danger`，中性資料用 `--accent`
- **反模式：** 不可用淺色背景 / 不可用圓角 > 12px / 不可用裝飾性動畫

---

### P2 藍系分析型（預設 baseline）

```css
/* template 預設 :root（2026-11-01 起 --purple 已換色，與 template 同步） */
:root {
  --bg: #0d1117; --bg-card: #161b27; --bg-finding: #1a2030;
  --accent: #3b82f6; --accent2: #2aab85; --warn: #d4870a; --danger: #d43a2f; --purple: #b89cf3;
  --text: #e6edf3; --text-muted: #8b949e; --border: rgba(255,255,255,0.08);
  --radius: 14px;
  --font-head: 'Lora', serif; --font-body: 'Outfit', sans-serif; --font-mono: 'JetBrains Mono', monospace;
}
```
```html
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Lora:wght@400;600&family=Outfit:wght@400;500;600&family=JetBrains+Mono:wght@400;700&display=swap">
```
- **調性：** 中性專業，資料導向，適合多數分析情境
- **注意：** 這是 baseline，不應連續兩份都用 P2
- **配色驗證（D.11 產生器，2026-11-01）：** 原 blue `#3b82f6` ↔ purple `#7c4dff` 正常 ΔE 12.9、deutan 4.2（PAL-01／02 FAIL）。只換 purple `#7c4dff→#b89cf3`（淺紫，h 298）：正常最小 16.6（orange/red）、protan／deutan 最小 11.0，對比最小 4.01（red）。blue 與 purple 改靠明度分開（L 0.62 vs 0.75）。指令：`--bg '#0d1117' --anchor blue=#3b82f6,teal=#2aab85,orange=#d4870a,red=#d43a2f`。已用 P2 的既有成品（第 1、2 份）由 Sprint_palette_system M2 另行重配（第 1 份 purple 同為 `#b89cf3`；第 2 份淺底改 `#7c519d`，見 ARCHIVE）

---

### P3 輕色企業型

```css
:root {
  --bg: #F8FAFC; --bg-card: #FFFFFF; --bg-finding: #F1F5FD;
  --accent: #2563EB; --accent2: #099A87; --warn: #D97706; --danger: #CD2023; --purple: #7A54A1;
  --text: #0F172A; --text-muted: #64748B; --border: rgba(0,0,0,0.08);
  --radius: 12px;
  --font-head: 'Plus Jakarta Sans', sans-serif; --font-body: 'Plus Jakarta Sans', sans-serif; --font-mono: 'JetBrains Mono', monospace;
}
/* header 背景改為白底 */
.site-header { background: rgba(248,250,252,0.97); border-bottom: 1px solid rgba(0,0,0,0.08); }
/* nav-tab active 調整 */
.nav-tab.active { background: rgba(248,250,252,0.97); color: var(--accent); }
```
```html
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;700&display=swap">
```
- **調性：** 明亮、親和、適合簡報式呈現給非技術決策者
- **注意：** 淺色模式需確認 chart 資料顏色仍具足夠對比度（建議 `rgba()` alpha 提高至 0.9）
- **配色驗證（D.11 產生器，2026-11-01）：** 原色組 FAIL——blue/purple 正常 12.4、deutan 0.4，orange/red 正常 14.4。改 accent2 `#059669→#099A87`、purple `#7C3AED→#7A54A1`、danger `#DC2626→#CD2023`（保留 accent、warn）：正常最小 15.2（blue/purple）、protan 12.1、deutan 12.0，對比最小 3.04（orange，淺底橘色的上限，見 D.11）。原色組即第 6 份（SaaS）所用，成品修正由 Sprint M2 處理

---

### P4 暗色科技型

```css
:root {
  --bg: #0F172A; --bg-card: #1B2336; --bg-finding: #202D3F;
  --accent: #22D3EE; --accent2: #0D9488; --warn: #F59E0B; --danger: #EF4444; --purple: #A78BFA;
  --text: #F8FAFC; --text-muted: #94A3B8; --border: rgba(255,255,255,0.07);
  --radius: 8px;
  --font-head: 'Space Grotesk', sans-serif; --font-body: 'DM Sans', sans-serif; --font-mono: 'JetBrains Mono', monospace;
}
```
```html
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=DM+Sans:wght@400;500;700&family=JetBrains+Mono:wght@400;700&display=swap">
/* 標題: Space Grotesk；內文: DM Sans */
```
- **調性：** 科技感、高密度、偏硬派（radius 8px 強調精確）
- **適用場景：** 製造業 OEE 分析、物流追蹤、IoT 感測器 dashboard
- **配色驗證（B.9-1，2026-10-14，第 4 份）：** 原 accent2 `#22C55E` 與 orange 色盲 ΔE 5.7（硬傷），改 `#0D9488` 後 ΔE 16.6；已回填上方 `:root` 與速查表
- **2026-11-01 重驗（D.11，全部 10 色對）：** 不需改色——正常最小 19.8（orange/red）、protan 12.0、deutan 11.4（blue/purple），對比最小 4.74。accent `#22D3EE`（h 211）屬「青／天藍」，產生器以 `--map blue=cyan` 驗證

---

### P5 醫療信任型

```css
:root {
  --bg: #ECFEFF; --bg-card: #FFFFFF; --bg-finding: #E0F9FB;
  --accent: #0369A1; --accent2: #049B84; --warn: #D97706; --danger: #D1121C; --purple: #7C3AED;
  --text: #164E63; --text-muted: #64748B; --border: rgba(0,0,0,0.07);
  --radius: 16px;
  --font-head: 'Lexend', sans-serif; --font-body: 'Source Sans 3', sans-serif; --font-mono: 'JetBrains Mono', monospace;
}
.site-header { background: rgba(236,254,255,0.97); }
```
```html
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Lexend:wght@300;400;500;600;700&family=Source+Sans+3:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;700&display=swap">
/* 標題: Lexend（高可及性設計）；內文: Source Sans 3 */
```
- **調性：** 清晰、低刺激、符合 WCAG AA
- **反模式：** 不可用高飽和紅色（用橘代替警示）/ 不可用暗色背景
- **配色驗證（B.9-1，2026-10-14）：** 原 accent #0891B2 與 accent2 #059669 正常視力 ΔE 11.8（硬傷），改 #0369A1 後 ΔE 18.5（已回填上方 `:root` 與速查表）；orange↔accent2 色盲 ΔE 7.9（WARN），對應系列需保留數字標籤
- **2026-11-01 重驗（D.11，全部 10 色對）：** 原色組 orange/red 正常 14.4（非相鄰色對，舊驗證器未比）→ FAIL。改 accent2 `#059669→#049B84`、danger `#DC2626→#D1121C`（保留 accent、warn、purple）：正常最小 16.6（orange/red）、protan／deutan 最小 11.6（原 WARN 7.9 一併解除），對比最小 3.06（orange）。第 8 份（醫美）的成品修正由 Sprint M2 處理

---

### P6 電商活力型

```css
:root {
  --bg: #ECFDF5; --bg-card: #FFFFFF; --bg-finding: #E8F8F1;
  --accent: #059669; --accent2: #0284C7; --warn: #C46D00; --danger: #C50A17; --purple: #7C3AED;
  --text: #064E3B; --text-muted: #64748B; --border: rgba(0,0,0,0.07);
  --radius: 14px;
  --font-head: 'Rubik', sans-serif; --font-body: 'Nunito Sans', sans-serif; --font-mono: 'JetBrains Mono', monospace;
}
.site-header { background: rgba(236,253,245,0.97); }
```
```html
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Rubik:wght@300;400;500;600;700&family=Nunito+Sans:ital,opsz,wght@0,6..12,300;0,6..12,400;0,6..12,600&family=JetBrains+Mono:wght@400;700&display=swap">
/* 標題: Rubik；內文: Nunito Sans */
```
- **調性：** 積極、轉換導向、電商氣氛
- **配色驗證（B.9-1，2026-10-14，第 7 份）：** 原 accent2 `#10B981` 與 accent `#059669` 同為綠系，正常視力 ΔE 10.2（硬傷）；改 `#0284C7` 後 ΔE 16.9，已回填上方 `:root` 與速查表。正向語意因此改由藍色承載，圖例與標籤需寫明
- **2026-11-01 重驗（D.11，全部 10 色對，`--map blue=green,teal=blue`）：** 原色組 orange/red 正常 14.4 → FAIL、blue(綠)/orange 色盲 7.9 WARN。改 warn `#D97706→#C46D00`、danger `#DC2626→#C50A17`（保留 accent、accent2、purple）：正常最小 15.4（orange/red）、protan 9.3、deutan 9.2，對比最小 3.58。第 7 份（零售）的成品修正由 Sprint M2 處理

---

### P7 銀行深色型

```css
:root {
  --bg: #020617; --bg-card: #0A1628; --bg-finding: #0F1E35;
  --accent: #006DA2; --accent2: #FED420; --warn: #EE9E55; --danger: #EF4444; --purple: #B18EF6;
  --text: #F8FAFC; --text-muted: #94A3B8; --border: rgba(255,255,255,0.06);
  --radius: 8px;
  --font-head: 'IBM Plex Sans', sans-serif; --font-body: 'IBM Plex Sans', sans-serif; --font-mono: 'IBM Plex Mono', monospace;
}
```
```html
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;500;600;700&family=IBM+Plex+Mono:wght@400;600&display=swap">
```
- **調性：** 莊重、傳統、合規感強（金色 `--accent2` 作為正向/獲利指標）
- **配色驗證（D.11 產生器，2026-11-01，`--map teal=gold`）：** 原色組 FAIL——orange/red 正常 11.8、deutan 4.4，red/teal protan 4.9；accent `#1E3A8A` 對背景對比僅 1.95（圖形元素看不見）；accent2 `#A16207` 實測 h 66 與 warn 同屬橘色區。改 accent `#1E3A8A→#006DA2`（保留深藍調，對比 3.56）、accent2 `#A16207→#FED420`（真正的金色 h 94）、warn `#D97706→#EE9E55`：正常最小 15.0（orange/teal）、protan 12.8、deutan 12.2。保留 danger。purple 原 `#6366F1`（h 277，靛）過 PAL 但落在產生器紫色區間（282–328）外，內文寫「紫」時讀者可能讀成藍紫——同日（Sprint_palette_system M2）以其餘四色 anchor 重跑換成 `#B18EF6`（h 298，罰分最低的首選）：正常最小 15.0（orange/teal）、protan 15.2、deutan 12.3（orange/red），purple 對 bg-card 對比 6.97，blue/purple 正常 24.9。指令：`--bg '#0A1628' --map teal=gold --anchor blue=#006DA2,teal=#FED420,orange=#EE9E55,red=#EF4444`
- **與 P1 區隔：** P1 已於 2026-11-01 改 bg `#08141A`，兩者不再同底；字型同為 IBM Plex；主色分別為深藍 `#006DA2`（P7）與亮藍 `#57A8FF`（P1）。P7 的 bg `#020617` 仍與第 3 份（品牌訊息通道，P7 Modified）相同——該份即自述為 P7 變體
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

---

## D.11 配色生成（gen_palette，2026-11-01）

> 類別色（`c()` 的 blue／teal／orange／purple／red）不再手挑。產生器 `dev/script/gen_palette.mjs` 與 audit PAL-01／02 共用同一份計算（`dev/script/palette_lib.mjs`：OKLab×100、Machado 2009 色盲模擬、WCAG 對比），所以產生器說 PASS 的色組，audit 一定過 PAL。

**何時用**
- 選 preset（SKILL Phase 1 步驟 7–8）：先用 `--check` 驗該 preset 的五色；不過才換色。D.9 的 P1–P7 已於 2026-11-01 全部重驗通過。
- 新背景色、品牌指定色（`--anchor`）、或要換掉某一兩個撞色時：用產生器求解，**只放開要換的那幾色**，其餘以 `--anchor` 固定，preset 的辨識度才保得住。

**規則（每條都可重跑、可驗證）**

| 規則 | 內容 | 理由 |
|---|---|---|
| 色名區間（OKLCH h°） | red 15–38｜orange 48–75｜green 142–190｜blue 228–268｜purple 282–328；另有 gold 75–100、cyan 195–225 只能用 `--map` 指定 | 內文寫「紫柱」「橘色虛線」，換色後色名必須仍成立；268–282（靛）刻意空出，介於藍紫之間兩邊都會被讀錯。區間以既有 preset／Tailwind 色實測 h 校準，各邊界的實例寫在產生器 `FAMILIES` 註解 |
| 色名明度 | orange L 0.62–0.88、red L 0.45–0.70、gold L 0.70–0.92，其餘 0.42–0.88；彩度 C ≥ 0.09 | 同色相下，暗橘讀成「棕」、亮紅讀成「粉」（實測曾產出 `#7B3701`、`#F99998`）；彩度太低讀成灰 |
| 背景對比 | 每色對背景 WCAG ≥ 3:1 | 非文字圖形元素（SC 1.4.11） |
| PAL 門檻 | 10 色對正常 ΔE ≥ 15；protan／deutan ≥ 6 為硬限制，目標 ≥ 8（無 WARN） | 與 audit PAL-01／02 相同（B.9-1） |
| 明度階梯 | 不硬寫，由目標函數自然產生 | 色盲下 blue/purple、orange/red、red/teal 的色相差會消失，只剩明度可分；輸出的 L 欄就是階梯 |
| 目標函數 | 先求可達上界 t*（30 個 ΔE＝10 色對×三種視覺的最小值最大可到多少），門檻取 T＝min(t*, 12)，在 T 之上選「品質罰分」最低的組 | 12＝WARN 線 8 的 1.5 倍；再往上分離度看不出差別，純 max-min 反而把色推到限制邊緣（近白、剛好 3:1、色相貼邊）。罰分＝離典型色相、彩度 <0.13、離適讀明度帶（深底 0.72／淺底 0.58）、對比 <3.6 四項平方和。`--maxmin` 可改回純 max-min |
| 決定性 | 格點取樣＋branch-and-bound，無亂數 | 同參數重跑得到同結果，D.9 的數字可複驗 |

**指令**

```bash
node dev/script/gen_palette.mjs --bg '#0d1117'                                  # top 3 候選＋每組 10 色對 × 正常/protan/deutan 表
node dev/script/gen_palette.mjs --bg '#0d1117' --anchor blue=#3b82f6,red=#d43a2f  # 固定部分色，只解其餘
node dev/script/gen_palette.mjs --bg '#ECFDF5' --map blue=green,teal=blue         # 該 preset 的 --accent 是綠、--accent2 是藍
node dev/script/gen_palette.mjs --bg '#F8FAFC' --check blue=#2563EB,teal=#059669,orange=#D97706,purple=#7C3AED,red=#DC2626
node dev/script/gen_palette.mjs --benchmark                                      # 基準組評分
```
- 輸出的「綁定約束」＝目前最小的那個 ΔE（哪個色對、哪種視覺），也就是要再分開時該動的地方；「⚠區間外」＝該色（通常是 anchor）不在色名區間內。
- 無解時直接說卡在哪：`hue-window+chroma+contrast`（某色族在這個背景下找不到任何可用色——通常是淺底的 orange，對比 3:1 與「不變棕」只剩很窄的一段）、`PAL-01`（anchor 組合讓正常 ΔE 到不了 15）、`PAL-02`（色盲 ΔE 到不了 6）。處理：少固定一色，或改 `--map`。
- 執行時間：自由求解約 0.2–1.5 秒；`--top` 越大越久。exit 0＝首選候選無 FAIL。

**基準組（sanity check，`--benchmark`）**：以同一計算評既有的色盲友善配色，確認量度合理。

| 基準組（取 5 色對應 c() key） | 正常最小 | 色盲最小 | 判定 | 色名區間 |
|---|---|---|---|---|
| Okabe-Ito（blue `#0072B2`、teal `#009E73`、orange `#E69F00`、purple `#CC79A7`、red `#D55E00`） | 15.6（orange/red） | 7.6（purple/teal deutan） | 無 FAIL；WARN 7.6；白底 orange 對比 2.25 | orange 76.8、purple 346、red 47.5 都在區間外（橘偏黃、紫偏粉、紅偏橘） |
| Paul Tol bright（blue `#4477AA`、teal `#228833`、yellow `#CCBB44` 代 orange、purple `#AA3377`、red `#EE6677`） | 18.0（purple/red） | 8.3（blue/purple deutan） | 無 FAIL、無 WARN；白底 yellow 對比 1.95 | yellow 101、purple 349 在區間外 |

公認的色盲友善組在本量度下都落在「剛好過門檻」（色盲 7.6–8.3），可知 15／6／8 門檻與這套計算是合理的；但它們的色相不符本專案的色名語意，所以只作基準，不直接採用。產生器自由求解（不 anchor）在 P1–P7 各背景都能做到全部 30 個 ΔE ≥ 12。

**何時開決策頁讓 Blake 挑**（用 `decision-page` skill，把 top-3 每組做成色票＋一張示範長條／折線圖，並列綁定約束與罰分）：
- 新 preset、換 preset 主色（`--accent`），或品牌色 anchor 後其餘四色全放開——這是辨識度的主觀選擇；
- top-3 罰分差距 < 0.5（數學上幾乎等價，只剩美感差異）。

只換一兩個撞色、且首選罰分明顯最低時，直接採用首選，在 D.9 該 preset 註記舊→新與 ΔE 即可。換色後照常跑 audit 確認 PAL。
