# 模組 A：資料設計與驗證 (Data Validation)

> **核心原則：所有數字從同一個 DATA 物件衍生；任何不能用算式驗算的 KPI 都是壞 KPI。**

---

## A.1 資料設計的兩個對立目標

合成資料設計時你會面臨對立目標：

| 目標 1：教學需求 | 目標 2：真實性 |
|---|---|
| 數字要剛好暴露教學點 | 數字要符合產業常識 |
| Q4 旺季要明顯 | 不能 Q4 比平日大 100 倍 |
| Bronze 流失要突出 | 但不能高到 80% 不合理 |

**解法**：先決定教學點 → 反向設計數字 → 用 assertion 驗證內部一致 → 用「產業常識表」驗證合理性。

---

## A.2 資料錨點 (Anchors) — 鎖定後不可改

「錨點」是整份儀表板的**單一事實源 (single source of truth)**。所有圖表的數字加總、所有 KPI 的計算結果都要能對齊到錨點。

### 必設錨點

```javascript
anchors: {
  total_users:    XXXXX,   // 總使用者/會員/客戶
  total_events:   XXXXX,   // 總訂單/總訪問/總工單
  total_revenue:  XXXXX,   // 總營收/總成本（萬/千/億依量級）
  per_event_avg:  XXX,     // = total_revenue / total_events
  active_users:   XXXXX,   // 活躍/已轉換的用戶
  active_rate:    XX.X,    // = active_users / total_users
  year:           YYYY,
}
```

### 依產業可選錨點

| 產業 | 額外錨點建議 |
|---|---|
| 電商 / 零售 | 總會員、總訂單、總營收、AOV、回購率 |
| SaaS | MAU、MRR、ARR、Churn rate、NRR |
| 教育平台 | 註冊數、完課率、人均時數、續訂率 |
| 餐飲連鎖 | 客數、客單價、翻桌率、外帶比 |
| 訂閱媒體 | 訂閱數、活躍率、Churn、ARPU |
| 健身房 | 會籍數、上課率、續約率、人均月消費 |
| 二手平台 | 註冊數、成交率、平均成交價、糾紛率 |

**錨點數字選取的尺度**：
- 不要用整數結尾（48,000 太假，48,263 比較像真實）
- 量級要符合產業（小型 B2C 5 萬人、中型 50 萬、大型 500 萬+）

---

## A.3 衍生資料的設計原則

### 原則 1：每個圖表的「合計」要等於對應錨點

例如月度品類營收堆疊圖，**每月加總 = 該月總營收**、**全年加總 = 總營收錨點**。

```javascript
// 自檢範例
const yearlyTotalFromCategories = Object.values(DATA.monthly_category)
  .reduce((sum, arr) => sum + arr.reduce((a,b)=>a+b, 0), 0);
assert(yearlyTotalFromCategories === DATA.anchors.total_revenue);
```

### 原則 2：百分比類資料合計 = 100

來源渠道、年齡分佈、付款方式月合計、品類佔比 — 全部必須 sum 到 100（或 100%）。

### 原則 3：分群類資料的人數合計 = 總人數

等級分佈、頻次分佈（含未轉換池）、地區分佈 — 合計必須等於 total_users。

### 原則 4：派生 KPI 必須能反推（三選一驗算路徑）

凡是 KPI 卡片上的數字，必須能通過以下三種路徑之一驗算：

| 路徑 | 定義 | 範例 |
|---|---|---|
| **直接計算** | KPI = 公式，可從其他 DATA 欄位算出 | AOV = 總營收 / 總訂單 |
| **分佈閉合** | KPI 是加總分佈的結果 | 回購率 = ≤30天人數 / 總顧客 |
| **錨點交叉** | KPI 是百分比且無法直接算時，加 `xxx_wan`/`xxx_count` 錨點使 `% × total = 原始值` | `high_freq_contribution: 58.3` + `high_freq_revenue_wan: 8135` → 8135/13954=58.3% |

**凡無法通過三選一其中一條的 KPI，不得放入儀表板。**

**反例**：「滿意度 4.2 分」沒有可反推的資料 → 不放，或補對應分佈圖。

常見範例：
- 「活躍率 60.4%」← 活躍人數 / 總會員（直接計算）
- 「年流失率 18.3%」← 全年流失 / 年初總會員（直接計算）
- 「高頻貢獻 58.3%」← high_freq_revenue_wan / total_revenue_wan（錨點交叉）

### 原則 5：保留「合理口徑差」當教學點（選用）

如前一輪 P1.Q2 範例：圖表淨增 5,412 vs KPI 隱含淨增 5,324（差 88 人 ≈ 1.6%）。這是**故意的教學設計**，教實習生「合理口徑差距是業界常態，重點不在消滅差距而在能解釋差距」。

**規則**：
- 口徑差不可超過 5%（超過會像 bug 不像教學）
- 必須在答案中明確解釋差距來源（例如：主動退會 vs 系統判定無效的定義差異）

---

## A.4 9 項 assertConsistency 自檢

每份生成的 dashboard 都要在 JS 中內建 `assertConsistency()` 函式，page-load 時跑過。**任何一項失敗都要先修資料**。

```javascript
function assertConsistency() {
  const A = DATA.anchors;
  const sum = arr => arr.reduce((a,b)=>a+b, 0);
  const errors = [];

  // ① 分群類人數合計 = 總用戶
  const groupSum = sum(DATA.tier.counts);
  if (groupSum !== A.total_users) errors.push(`Tier ${groupSum} ≠ ${A.total_users}`);

  // ② 百分比類合計 = 100
  if (sum(DATA.source.pct) !== 100) errors.push(`Source pct ≠ 100`);
  if (sum(DATA.age.pct) !== 100) errors.push(`Age pct ≠ 100`);

  // ③ 事件分佈合計 = 總事件數
  const eventSum = sum(DATA.event_distribution.counts);
  if (eventSum !== A.total_events) errors.push(`Event dist ${eventSum} ≠ ${A.total_events}`);

  // ④ 月度堆疊類合計 = 總營收
  const stackSum = Object.values(DATA.monthly_stack)
    .reduce((acc, arr) => acc + sum(arr), 0);
  if (stackSum !== A.total_revenue) errors.push(`Monthly stack ${stackSum} ≠ ${A.total_revenue}`);

  // ⑤ 多層分佈每層合計 = 100 (例如付款方式月合計)
  for (let i = 0; i < 12; i++) {
    const s = ['cat1','cat2','cat3','cat4'].reduce((a,k)=>a+DATA.multilayer[k][i], 0);
    if (s !== 100) errors.push(`Multilayer month ${i+1} = ${s} ≠ 100`);
  }

  // ⑥ 子集合人數合計 = 母集合
  const subsetSum = sum(DATA.frequency.counts);
  if (subsetSum !== A.active_users) errors.push(`Freq ${subsetSum} ≠ active_users ${A.active_users}`);

  // ⑦ 互補集合 = 全集合 - 子集合
  if (A.non_active !== A.total_users - A.active_users) errors.push(`Complement mismatch`);

  // ⑧ 關鍵比例正確
  const keyPct = (DATA.frequency.counts.slice(-2).reduce((a,b)=>a+b, 0)) / subsetSum * 100;
  if (Math.abs(keyPct - DATA.kpis.high_freq_pct) > 0.1) errors.push(`High freq pct mismatch`);

  // ⑨ 派生指標等於原始比例
  const derivedAOV = A.total_revenue * 10000 / A.total_events;  // 假設營收以萬為單位
  if (Math.abs(derivedAOV - A.per_event_avg) > 1) errors.push(`AOV derivation ≠ stored`);

  if (errors.length) {
    console.error('⚠ Data consistency errors:', errors);
  } else {
    console.log('✓ All data consistency checks passed');
  }
}
assertConsistency();
```

---

## A.5 產業常識量級表（防止「數字內部一致但外部荒謬」）

| 維度 | B2C 電商 | SaaS | 餐飲連鎖 | 線上教育 | 訂閱媒體 |
|---|---|---|---|---|---|
| 客單價/ARPU | NT$300-2000 | NT$500-5000/月 | NT$200-800/餐 | NT$1500-5000/課 | NT$200-500/月 |
| 月均下單/月活 | 0.5-3 次 | 90%+ MAU | 1-4 次 | 看課 3-10 次 | 12-25 次閱讀 |
| Churn rate | 15-25%/年 | 5-10%/月 | n/a | 30-50%/年 | 4-8%/月 |
| 高頻用戶佔比 | 10-25% | 30-50% | 20-40% | 5-15% | 15-30% |
| 行動支付佔比 | 50-70% | n/a | 30-60% | 80%+ | 90%+ |
| 旺淡季振幅 | 1.5-2.5x | 1.0-1.2x | 1.3-1.8x | 1.5-2x | 1.0-1.3x |

**用法**：生成資料時，將你的數字跟此表對照。超出範圍要嘛改數字，要嘛在「設計選擇」區塊明確說明「為何故意偏離常態」。

---

## A.6 月度節律模式庫

選一個合適的月度節律當生成模板：

| 模式名 | 適用 | 形狀 |
|---|---|---|
| **電商雙峰** | B2C 電商 | 雙 11 / 雙 12 / 年中 618 三高峰 |
| **教育學期** | 線上教育 | 9 月開學、3 月開春、暑假低谷 |
| **訂閱平穩** | SaaS / 媒體 | 月增 1-3%，無明顯季節性 |
| **餐飲週末** | 餐飲 | 週六日佔該週 40%+，無強年度節律 |
| **服務淡旺** | B2B 服務 | Q1 預算釋出、Q4 結案集中 |
| **健身年初** | 健身房 | 1 月入會高峰，5-9 月維持 |

**衍生範例**（電商雙峰，月度數值乘數）：
```
1月  2月  3月  4月  5月  6月  7月  8月  9月  10月  11月  12月
0.7  0.6  0.7  0.8  0.8  1.1  0.9  0.8  0.8  1.1   1.4   1.6
```
（基礎月為 1.0，雙 11/12 月為 1.4/1.6）

---

## A.7 Python 資料生成範例

```python
import json

# 1. 鎖錨點
ANCHORS = {
    "total_users": 48263,
    "total_events": 96483,
    "total_revenue_wan": 4821,  # 萬元
    "active_users": 15348,
    "year": 2024,
}

# 2. 衍生 KPI
ANCHORS["aov"] = round(ANCHORS["total_revenue_wan"] * 10000 / ANCHORS["total_events"])
ANCHORS["active_rate"] = round(ANCHORS["active_users"] / ANCHORS["total_users"] * 1000) / 10

# 3. 設計月度節律（電商雙峰）
monthly_factor = [0.65, 0.55, 0.70, 0.78, 0.85, 0.92, 0.95, 0.92, 0.88, 1.18, 1.36, 1.56]
# 正規化讓加總 = 12（這樣每月平均 = 年/12）
s = sum(monthly_factor)
monthly_factor = [m * 12 / s for m in monthly_factor]

# 4. 拆品類（必須整數，所以最後一個欄位調整）
def split_to_categories(total, weights):
    """讓 weights 加總 = total，避免浮點誤差。"""
    raw = [total * w for w in weights]
    rounded = [round(x) for x in raw]
    diff = total - sum(rounded)
    rounded[-1] += diff  # 把誤差塞到最後一格
    return rounded

# 例：5 品類佔比設計
category_weights = {'3C': 0.395, '服飾': 0.223, '美妝': 0.160, '食品': 0.119, '居家': 0.103}
category_yearly = {k: round(ANCHORS["total_revenue_wan"] * w) for k, w in category_weights.items()}

# 修正合計
diff = ANCHORS["total_revenue_wan"] - sum(category_yearly.values())
last = list(category_yearly.keys())[-1]
category_yearly[last] += diff

# 拆月份
monthly_category = {}
for cat, yearly in category_yearly.items():
    monthly_category[cat] = split_to_categories(yearly,
                            [f/12 for f in monthly_factor])

# 5. 驗算
total_check = sum(sum(v) for v in monthly_category.values())
assert total_check == ANCHORS["total_revenue_wan"], f"Mismatch: {total_check}"
print(f"✓ 月度品類合計 = {total_check} 萬 (符合錨點)")

# 6. 輸出
with open("DATA.json", "w") as f:
    json.dump({"anchors": ANCHORS, "monthly_category": monthly_category}, f,
              ensure_ascii=False, indent=2)
```

---

## A.8 資料設計反模式（避免做這些事）

1. **🚫 hard-code 數字到 HTML 而非 DATA 物件**
   - 結果：改數字要改很多地方，永遠對不齊
   - 對策：所有數字進 `const DATA = {...}`，圖表/文案都讀它

2. **🚫 文案說的數字 ≠ 圖表呈現的數字**
   - 結果：學員看完整堂課懷疑老師是不是不會算
   - 對策：答案中所有具體數字都用 `<span class="ev">圖名</span>` 引用，並能從 DATA 算回

3. **🚫 用奇怪的單位混搭（一處用萬、一處用元）**
   - 結果：學員心算暴增、看不出比例
   - 對策：DATA 全域統一單位，呈現時才轉換

4. **🚫 100% 圓餅圖加總到 98% 或 101%**
   - 結果：「合計不到 100」是專業致命傷
   - 對策：assertion 第 ② 條強制檢查

5. **🚫 KPI 卡用「年比 +X%」但沒給去年數字**
   - 結果：學員無法驗算
   - 對策：每個 YoY 都附上去年原始值（例：「12.4% YoY vs 42,939 (2023)」）

6. **🚫 散點圖的 x/y 軸獨立設定（兩軸間沒有業務等式）**
   - 結果：聰明學員用 `x × y × 12` 反推年收入，發現與 store_revenue 差到 10%+，喪失信任
   - 對策：**散點封閉三角原則** — 散點圖若同時表達「數量 × 均值 × 期數 = 總量」，x 軸必須從 store_revenue 反推：`x = round(revenue × 10000 / (y × 12))`，assertConsistency 驗證誤差 < 1%

7. **🚫 散點圖四象限只有 3 個象限有門市**
   - 結果：四象限框架失去教學意義——學員只看到「旗艦 vs 末段」二元對比，無法練習四種決策處方
   - 對策：**四象限均佈原則** — 資料設計階段必須確保 4 個象限都有至少 2-3 家門市。若封閉三角使某象限自然空缺（通常是「低流量高客單」象限），需刻意將 3-5 家門市的 AOV 設為高於全局均值，並在「設計選擇揭露」中說明這是刻意設計（精品型門市），防止學員誤認為 bug。
