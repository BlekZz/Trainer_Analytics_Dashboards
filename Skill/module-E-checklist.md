# 模組 E：交付檢核清單 (Delivery Checklist)

> **核心原則：交付前必須跑完所有檢查；任何一項失敗都不能交付。**

---

## E.1 18 項 hard-check 清單

依序檢查，**全綠才能交付**：

### 資料層 (5 項)
- [ ] **1. DATA 物件存在且為 single source of truth** — 沒有任何 hard-code 數字遊離在 DATA 之外
- [ ] **2. assertConsistency 全條通過** — console 顯示 `✓ All data consistency checks passed`（條數因產業不同，至少包含模組 A.4 的基礎 9 條 + 本產業追加項）
- [ ] **3. 數字量級符合產業常識** — 對照模組 A.5 常識量級表
- [ ] **4. 月度節律符合產業** — 對照模組 A.6 節律模式庫
- [ ] **5. 口徑差距控制在 5% 以內** — 如有故意保留差距當教學點，必須在答案中解釋

### 視覺層 (4 項)
- [ ] **6. 色彩語意 protocol 遵守** — 無 protocol 外的顏色出沒
- [ ] **7. 字型規範遵守** — 標題 Lora / 正文 Outfit / 數字 JBM
- [ ] **8. 所有 datalabels 不被切** — 用 layout.padding + suggestedMax 雙保險
- [ ] **9. 無 legend 顯示 "undefined"** — 單 dataset 圖必須 legend.display: false

### 教學層 (5 項)
- [ ] **10. 二維難度標籤 [L?·?] 每題標註** — 並列兩個 chip 視覺呈現
- [ ] **11. F/I/A 標註正確** — A 題必含 `<span class="fia a">A</span>` 標籤
- [ ] **12. 證據碼 ev 引用每題都有** — 每個具體數字後 `<span class="ev">圖名</span>`
- [ ] **13. 陷阱區塊在 A 題 + 訓練題都存在** — 不可省略
- [ ] **14. nav-hint 跨頁推論題都有** — L3 系列必設

### 結構層 (4 項)
- [ ] **15. 三段式答案結構符合 F/I/A 規範** — F 題只到觀察、I 題到推論、A 題完整四段
- [ ] **16. 訓練題區塊存在於 P3 末（或差異化指定位置）** — 紫色 panel
- [ ] **17. 📐 設計選擇揭露區塊存在** — 8 項或差異化指定的數量
- [ ] **18. 指標定義面板可開合且填齊** — 所有 KPI 都有口徑說明
- [ ] **19. 所有縮寫/專有名詞已在 def-panel 定義** — 搜尋全文大寫縮寫（YoY、pp、LTV、ROI、KPI、AOV 等），逐一確認 def-panel 有對應條目；無定義者不得出現在正文
- [ ] **20. 所有分析依據只引用儀表板呈現的數據** — F/I tag 中的每個數字需有圖表出處；引用未呈現數據者必須改為 [A] tag 並說明來源假設
- [ ] **21. F/I/A 標籤系統在可見位置有說明** — legend strip 或 def-panel 必須有 F/I/A 三色標籤的含義說明，不可只在摺疊答案內使用
- [ ] **22. `Chart.register(ChartDataLabels)` 為 script 啟動第一呼叫** — 缺少此行，所有 `datalabels: { display: true }` 為死碼（Chart.js 不報錯，只是靜默不渲染）；在 console 確認數值出現才算通過
- [ ] **23. 每道 QA 訓練題答案都有 `chart-ref-btn`** — 點擊執行 `goToChart(page, cardId)`，觸發頁切換 + scrollIntoView + chartFlash 動畫；所有對應 `chart-card` 必須有 `id="card-{id}"`
- [ ] **24. KPI 卡值不截斷** — `.kpi-value` 禁用 `overflow: hidden; text-overflow: ellipsis; white-space: nowrap`；改用 `font-size: clamp()` + `word-break: break-word`；在 1400px 寬度下確認最長 KPI 值完整顯示
- [ ] **25. Bar/Column chart 資料依顯示值降序排列** — 月份時間軸例外；多圖共享標籤時使用一致的固定排序順序
- [ ] **26. 值域差距 >10x 的雙數列使用雙 Y-axis** — 禁用對數刻度；右軸加 `grid: { drawOnChartArea: false }`，避免格線重疊
- [ ] **27. 禁止使用 `Chart.defaults.set('plugins.datalabels', ...)`** — 此呼叫覆蓋 ChartDataLabels 內部 option merger，會導致 dual-axis 圖和 fill-line 圖整個消失（不只是 label 消失），且不報錯；改為在每個圖表逐一設定 `datalabels: { display: false/true }`
- [ ] **28. `switchPage` 用 `setTimeout(60ms)` 包住 draw 呼叫** — DOM classList 切換後瀏覽器尚未完成 layout；同步呼叫 drawXxx() 時 canvas 尺寸為 0，圖表靜默初始化成空白；正確寫法：`setTimeout(() => { if (name==='ops') drawOps(); ... }, 60)`
- [ ] **29. 所有用到的 `.hNNN` CSS class 必須有定義** — 容器高度 0 = 圖表完全不可見且不報錯；生成 HTML 前確認 `.h240/.h260/.h280/.h300/.h360/.h420/.h480/.h520` 全部在 `:root` 下方定義
- [ ] **30. 定義側板 sticky 定位結構正確** — `position:sticky; top:var(--header-h); height:calc(100vh - var(--header-h)); align-self:flex-start` 必須加在 `#def-panel-outer`（flex child）上；`#def-panel-inner` 只設 `height:100%; overflow-y:auto`。若 sticky 加在 `overflow:hidden` 的子元素上會靜默失效，導致面板頂部出現錯誤空白
- [ ] **31. annotation plugin 用正確全域名稱 register** — CDN UMD 全域是 `window.ChartAnnotation`，**不是** `window['chartjs-plugin-annotation']`；確認 script 頂部為：`if (window.ChartAnnotation) Chart.register(window.ChartAnnotation);`
- [ ] **32. `mk()` datalabels 合併使用 spread pattern，而非 Object.assign** — 確認 `mk()` 中 explicit datalabels 合併寫法為 `dl = { ...dl, display: true, ...opts.plugins.datalabels }`，而非 `Object.assign(dl, opts.plugins.datalabels)`；水平 bar / 堆疊 bar 帶有 explicit datalabels config 時，截圖確認數值出現在 bar 末端（不需 hover）
- [ ] **33. 所有 `.findings-section` 預設坍縮** — 開啟 dashboard 後所有 Findings 區塊應顯示摺疊狀態（只見標題列 + 箭頭▼），點擊後展開；確認 `DOMContentLoaded` 有 `document.querySelectorAll('.findings-section').forEach(s => s.classList.add('collapsed'))`
- [ ] **34. `new Chart()` 直接建立的圖表有 `maintainAspectRatio: false` 且容器有明確 height** — 雷達、氣泡、散點等不走 `mk()` 的圖表，options 必須有 `responsive: true, maintainAspectRatio: false`，容器必須有 `style="height:NNNpx"`；截圖目視確認尺寸合理（雷達圖建議 240–320px，視頁面密度決定）

---

## E.2 Playwright 自動驗證腳本

如環境支援 Playwright，跑此腳本：

```python
from playwright.sync_api import sync_playwright
import os

def verify_dashboard(html_path):
    abs_path = os.path.abspath(html_path)
    file_url = f"file://{abs_path}"

    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": 1400, "height": 900})

        errors = []
        consistency_passed = [False]

        def on_console(msg):
            if 'All data consistency checks passed' in msg.text:
                consistency_passed[0] = True
            if msg.type == 'error' and '403' not in msg.text:
                errors.append(f"[{msg.type}] {msg.text}")

        page.on("console", on_console)
        page.on("pageerror", lambda err: errors.append(f"[pageerror] {err}"))

        page.goto(file_url)
        page.wait_for_timeout(2500)

        # 檢查 1: 資料一致性
        assert consistency_passed[0], "❌ assertConsistency 未通過"
        print("✓ Data consistency passed")

        # 檢查 2: 無 JS error
        assert len(errors) == 0, f"❌ JS errors: {errors}"
        print("✓ No JS errors")

        # 檢查 3: 各頁所有 canvas 都渲染
        for tab_idx, tab_name in enumerate(['member', 'transaction', 'cross'], start=1):
            page.click(f"button.nav-btn:nth-of-type({tab_idx})")
            page.wait_for_timeout(1500)
            canvases = page.evaluate("""() =>
              Array.from(document.querySelectorAll('canvas'))
                .filter(c => c.offsetParent !== null)
                .map(c => {
                  const ctx = c.getContext('2d');
                  const img = ctx.getImageData(0,0,c.width,c.height);
                  let nonZero = 0;
                  for(let i=3; i<img.data.length; i+=4) if(img.data[i]>0) nonZero++;
                  return {id: c.id, pixels: nonZero};
                })
            """)
            for c in canvases:
                assert c['pixels'] > 100, f"❌ Canvas {c['id']} empty"
            print(f"✓ {tab_name}: {len(canvases)} canvases rendered")

        # 檢查 4: QA toggle 功能
        page.click("button.nav-btn:nth-of-type(1)")
        page.wait_for_timeout(500)
        page.locator(".qa-question").first.click()
        page.wait_for_timeout(300)
        is_open = page.evaluate("""() =>
          document.querySelector('.qa-item').classList.contains('open')""")
        assert is_open, "❌ QA toggle 失敗"
        print("✓ QA toggle works")

        # 檢查 5: 必備 UI 元素存在
        required_elements = [
            '.color-legend',           # 色彩語意條
            '.qa-level',               # L 難度標籤
            '.fia',                    # F/I/A 標註
            '.ev',                     # 證據碼
            '.trap-block',             # 陷阱區塊
            '.nav-hint',               # 跨頁提示
            '.chart-ref-btn',          # 圖表索引按鈕
            '#defPanel',               # 定義面板
            '.training-panel',         # 訓練題區塊
            '.meta-panel',             # 設計選擇揭露
        ]
        for sel in required_elements:
            count = page.evaluate(f"document.querySelectorAll('{sel}').length")
            assert count > 0, f"❌ 缺少元素: {sel}"
        print("✓ All required elements present")

        browser.close()
        print("\n🎉 All checks passed.")

# 使用
verify_dashboard("/path/to/generated/dashboard.html")
```

---

## E.3 必驗證的數值 hard-check

除了 assertConsistency，再用 Python 預跑這幾個交叉驗算：

```python
import json

with open("DATA.json") as f:
    DATA = json.load(f)

A = DATA['anchors']

# 1. 月度堆疊合計
monthly_sum = sum(sum(v) for v in DATA['monthly_category'].values())
assert monthly_sum == A['total_revenue_wan'], f"月度品類合計 {monthly_sum} ≠ {A['total_revenue_wan']}"

# 2. AOV 可反推
derived_aov = round(A['total_revenue_wan'] * 10000 / A['total_events'])
assert abs(derived_aov - A['per_event_avg']) <= 1, f"AOV 不一致"

# 3. 各百分比類合計 = 100
for key in ['source', 'age']:
    s = sum(DATA[key]['pct'])
    assert s == 100, f"{key} 合計 {s} ≠ 100"

# 4. 等級類合計 = total_users
tier_sum = sum(DATA['tier']['counts'])
assert tier_sum == A['total_users'], f"Tier {tier_sum} ≠ {A['total_users']}"

# 5. 子集合驗證
buyer_sum = sum(DATA['frequency']['counts'])
assert buyer_sum == A['active_users']

# 6. 互補集驗證
assert A['non_active'] == A['total_users'] - A['active_users']

# 7. 月度合計 100%
for i in range(12):
    s = sum(DATA['payment'][k][i] for k in DATA['payment'])
    assert s == 100, f"Month {i+1} payment sum {s} ≠ 100"

# 8. 派生百分比
high_freq_pct = sum(DATA['frequency']['counts'][-2:]) / buyer_sum * 100
assert abs(high_freq_pct - DATA['kpi_anchors']['high_freq_pct']) < 0.1

# 9. 跨類驗算
yearly_check = sum(monthly_sum for monthly_sum in [
    sum(arr[i] for arr in DATA['monthly_category'].values())
    for i in range(12)
])
assert yearly_check == A['total_revenue_wan']

print("✓ All 9 data assertions passed")
```

---

## E.4 視覺驗證（人工/AI 視覺檢查）

跑完自動驗證後，用 Playwright 截圖三頁，人工或 AI 視覺檢查：

| 檢查項 | 標準 |
|---|---|
| 整體調性是否統一 | 色系一致、無突兀字體 |
| Findings 是否視覺貼合圖表 | 左側 4px 主色邊 + 較深背景 |
| KPI 卡視覺權重不過大 | 不擠壓 QA 區 |
| 圖表 datalabels 不被切 | 所有最高 bar 標籤完整顯示 |
| nav-hint 黃色卡視覺顯眼 | 摺疊時隱藏、展開時清楚 |
| trap-block 紅色提示 | 與正向綠 QA 形成對比 |
| meta-panel 在最末尾 | 不被 P3 主內容淹沒 |

---

## E.5 交付物清單

最終交付給使用者的內容：

```
1. dashboard.html          # 完整可獨立打開的 HTML 檔
2. DATA.json               # 資料 single source
3. CHANGELOG.md            # 差異化記錄（vs 範本）
4. verification-report.txt # E.1 18 項自檢結果
5. screenshots/            # 三頁完整截圖（可選）
   ├── p1.png
   ├── p2.png
   └── p3.png
```

`CHANGELOG.md` 必包含：
- 跟前一份相比的視覺軸差異
- 跟前一份相比的教學軸差異
- 跟前一份相比的結構軸差異
- 此份特有的陷阱主題（至少 3 個）
- 訓練題切角（4 道分別訓練什麼能力）

---

## E.6 交付前最終話術

交付時必須附上一段「使用建議」給使用者，例如：

```
這份 [產業] 訓練 dashboard 已生成完畢，重點訓練 [主題] 的 [能力]。

差異化亮點：
- 視覺：[簡述]
- 教學：[簡述]
- 結構：[簡述]

建議使用方式：
1. 給實習生時，先讓他們花 10 分鐘看完全頁不開答案
2. 接著要他們嘗試回答 4 道 L1·F 暖身題（建立直覺）
3. 再挑 2-3 道 L2·I 推論題討論（訓練思考路徑）
4. 最後留訓練題作回家作業（綜合能力）
5. 復盤時聚焦 ⚠ 陷阱區塊 — 那是真正的學習點

注意事項：
- 這是合成資料（DEMO chip 已標示），不可用於真實業務決策
- 如要修改數字，請改 DATA 物件而非 HTML 文案，否則會破壞內部一致性
- 設計選擇揭露區塊本身就是教學內容，建議引導學員閱讀並質疑
```

---

## E.8 交付後二次 QA 流程（強制）

> **原則：寫完檔案後，先宣告讓 user 做視覺審核，同時 Claude 讀取實際寫入的檔案進行資料層 QA。兩條線並行，不等 user 確認再開始。**

### 執行順序

```
1. Write tool 寫入檔案
2. 立即宣告：「檔案已寫入，請打開瀏覽器進行視覺審核。我同步開始讀取實際檔案做資料 QA。」
3. 用 Read tool 讀取實際寫入的 HTML（不是記憶中的內容）
4. 依以下清單逐項交叉驗算
5. 視覺審核與資料 QA 結果同時回報給 user
```

### 資料層二次 QA 清單（讀取實際檔案後逐項執行）

#### D1 — KPI 定義與分佈資料封閉性
對每個 KPI card 找到其對應的分佈圖，驗算「KPI = 分佈加總 or 衍生」：

| KPI | 驗算公式 | 常見破口 |
|---|---|---|
| 回購率 X% | X% × total_customers = ≤時間窗口桶加總 | 時間窗口切法不一致 |
| 活躍率 / VIP 佔比 | 分子人數 ÷ total_customers | 定義面板說的門檻 ≠ 頻率分佈切點 |
| AOV | total_revenue × 10000 ÷ total_events | monthly_aov 若硬編需逐月驗算 |
| YoY 成長 % | (新值 ÷ 舊值 − 1) × 100，舊值必須在 HTML 中呈現 | 舊值寫在文案但 DATA 沒有 |

#### D2 — 跨陣列 identity 確認
驗算「兩個不同資料結構描述同一群人」：
- 頻率分佈某幾段 = tier 某個層級人數（須由業務定義鎖住，定義面板必須說清楚門檻）
- 若有子集合（活躍客、轉換客），確認 子集合人數 + 非子集合人數 = total

#### D3 — 衍生欄位不能硬編
如果 DATA 裡有 `monthly_aov`、`monthly_churn` 等逐月欄位：
- 確認它們是否由 `monthly_revenue ÷ monthly_visits` 等公式動態計算
- **禁止** 在 DATA 物件中硬編逐月衍生值，必須改為 `const derivedArr = labels.map(...)` 在 drawXxx() 中即時計算

#### D4 — 多維資料封閉三角
若有散點圖 (scatter) 同時呈現 A × B 兩個維度，且還有第三個一維資料 C：
- 驗算：`A[i] × B[i] × 轉換因子 ≈ C[i]`（允許 ±5%）
- 超過 5% 差距需在「設計選擇揭露」中說明口徑差，或修正其中一組數字

#### D5 — assertConsistency 覆蓋率確認
讀取 assertConsistency 函式，確認以下幾類都有覆蓋：
- [ ] 人數類加總（各分群 = total_customers）
- [ ] 百分比類加總（各月 sum = 100）
- [ ] 業績類加總（月度堆疊 = 年度錨點）
- [ ] 派生 KPI 反推（AOV, 佔比等）
- [ ] **新增：** 時間窗口類 KPI 與分佈圖封閉（回購率、留存率等）
- [ ] **新增：** 跨陣列 identity check（頻率段 = tier count）

### 二次 QA 回報格式

```markdown
## 二次資料 QA 結果

### ✅ 通過
- assertConsistency 10 項全通過（console log 確認）
- 回購率 KPI ↔ 分佈桶封閉：21,462 = 58,320 × 36.8% ✓
- VIP 定義門檻（年12+次）↔ tier 人數（12,480）↔ 頻率段加總 ✓
- AOV 由月度資料動態衍生，無硬編 ✓

### ⚠️ 發現問題（若有）
- [問題描述 + 建議修法]
```

---

## E.7 後續迭代記錄

每生成一份新 dashboard，更新此 skill 旁的 `ARCHIVE.md` 記錄：

```markdown
## Dashboard #N | 2026-05-XX
- 產業：[XXX]
- 訓練主題：[YYY]
- 錨點：[ZZZ]
- 差異化亮點：[簡述三軸差異]
- 陷阱主題：[列出此份特有陷阱]
- 使用反饋：[實習生反應、什麼題目卡住、什麼陷阱奏效]
```

這份 archive 可以反饋到下一份生成，避免重複差異化模式、累積有效陷阱主題庫。
