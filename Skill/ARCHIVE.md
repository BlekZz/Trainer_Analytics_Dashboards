# Dashboard ARCHIVE

來源：`module-E-checklist.md` E.7。每交付一份新 dashboard，在本檔追加一筆（依日期由舊到新、編號遞增），並更新末節「跨份總覽」。
用途：選下一份的差異化方向時，一眼看出哪些產業、主題、視覺 preset、陷阱主題已用過。日期取自 git 首次加入該檔的 commit；#1/#2 同為 19fa5ef（同日同 commit），順序依 CLAUDE.md 版本脈絡排列。

## Dashboard #1 | 2026-05-21
- 檔案：`Dashboard/餐飲連鎖_門市營運分析_訓練儀表板教材.html`
- 產業：餐飲連鎖
- 訓練主題：門市營運分析（來客 × 客單、外帶結構、門市分級、高頻顧客與再購）
- 錨點：`total_customers: 58320`、`total_visits: 486217`、`total_revenue_wan: 13954`、`total_stores: 34`、`aov: 287`、`repurchase_rate_30d: 36.8`
- 視覺 Preset：P2 藍系分析型（近似）——bg #0d1117、字型 Outfit+Lora+JetBrains Mono 與 P2 吻合；accent #3b82f6 與 P2 的 #2d5be3 略異
- 頁數／QA 數：3 頁／21 題
- 差異化亮點：來客×客單雙軸同圖、右軸刻意縮窄放大客單微變；VIP AOV(287→241)低於全體的逆直覺數字直接呈現，要學員自己發現「AOV ≠ LTV」；外帶口徑未拆外送/自取，刻意留盲點。
- 陷阱主題：比例上升不等於絕對量下降／低業績門市不一定最需協助／AOV 不等於 LTV／提升高頻貢獻不等於只服務高頻／統一 KPI 衡量異質門市
- 使用反饋：未記錄

## Dashboard #2 | 2026-05-21
- 檔案：`Dashboard/電商DTC_會員交易分析_訓練儀表板教材.html`
- 產業：電商 DTC
- 訓練主題：會員交易分析（會員流動、等級結構、品類、頻次、渠道 LTV）
- 錨點：`total_members: 48263`、`total_orders: 96483`、`total_revenue_wan: 4821`、`aov: 499`、`buyers: 15348`、`first_purchase_rate: 31.8`
- 視覺 Preset：自訂（accent #2d5be3／bg #f5f3ef／字型 Lora+Outfit+JetBrains Mono）——字型與 accent 同 P2，但為淺色暖底，非 P2 的 #0d1117
- 頁數／QA 數：3 頁／19 題
- 差異化亮點：三頁分頁（會員／交易／跨域交叉）讓切換即切換分析視角；KPI 卡置頂只給方向不給原因；頻次圖排除「從未購買」32,915 人避免壓縮其他 bucket；免運門檻標在訂單分佈圖上。
- 陷阱主題：KPI 與圖表小差距不要改數字／人均消費×流失人數直接相乘／品類第一不等於過度集中／未首購與只買一次混為一池／只看 LTV 不看 CAC
- 使用反饋：未記錄

## Dashboard #3 | 2026-05-25
- 檔案：`Dashboard/品牌訊息通道_多通道績效分析_訓練儀表板教材.html`
- 產業：品牌行銷（訊息通道）
- 訓練主題：多通道績效分析（LINE／Email 推播漏斗 vs WhatsApp／Meta／Chat 對話解決率）
- 錨點：無 `anchors` 物件，DATA 以通道分組：`LINE.reach: 72000`、`LINE.open_rate: 0.38`、`LINE.ctr: 0.12`、`EMAIL.reach: 38000`、`WHATSAPP.conversations: 4200`、`META.FCR: 0.54`
- 視覺 Preset：P7 Modified（檔內自述「P7 Modified 深色 Preset」）——bg #020617／accent #3B82F6／accent2 #D97706／字型 IBM Plex Sans+IBM Plex Mono；與 P7 表列 accent #1E3A8A 不同，accent 與 bg 實同 P1
- 頁數／QA 數：4 頁／20 題
- 差異化亮點：推播（漏斗型）與對話（解決率型）KPI 邏輯不同故拆兩頁；每頁埋「分母不一致」口徑陷阱；效率對比圖附「分母不同勿直接比較」警示；月度趨勢刻意只給 3 個月。
- 陷阱主題：CTR 分母（觸達 vs 開封）口徑／高 FCR 加高棄單的偽象／轉換率恆定假設／Q4 節慶歸因／效率指標量質倒置
- 使用反饋：未記錄

## Dashboard #4 | 2026-06-11
- 檔案：`Dashboard/健身房_會員全週期分析_訓練儀表板教材.html`
- 產業：健身房
- 訓練主題：會員全週期分析（會員全貌→使用行為→留存）
- 錨點：`total_members: 6843`、`new_members: 2178`、`churned_members: 1654`、`annual_churn_rate: 26.2`、`renewal_rate: 68.3`、`avg_monthly_arpu: 1321`
- 視覺 Preset：P4 暗色科技型——bg #0F172A／accent #22D3EE／字型 Space Grotesk+DM Sans（另用 JetBrains Mono）均吻合
- 頁數／QA 數：3 頁／16 題
- 差異化亮點：三頁對應「是誰→怎麼用→會不會回來」決策鏈；ARPU 與續約率反直覺（月費 ARPU 高於年費但續約率遠低）；KPI 卡「反設計」故意留可質疑線索（月均 ARPU 1,321 低於最低定價 1,500）；1 月高峰刻意不加解釋。
- 陷阱主題：只看 ARPU 定推廣方向／1 月高峰不等於行銷成功／熱力圖為日內分佈非跨日總量／流失自陳原因不等於真實原因／流失率高不等於先留客
- 使用反饋：未記錄

## Dashboard #5 | 2026-06-11
- 檔案：`Dashboard/網紅個人品牌_旅遊生活風格創作者_訓練儀表板教材.html`
- 產業：網紅／個人品牌（旅遊生活風格創作者）
- 訓練主題：多平台受眾與業配營收分析（平台成長、品類收入、洽詢到回款漏斗、受眾質量）
- 錨點：`total_followers: 490700`、`monthly_revenue: 318000`、`annual_deals: 89`、`annual_revenue: 2842000`、`repeat_client_rate: 42`、`ad_spend: 28500`
- 視覺 Preset：自訂（檔內自述「Social Creator（客製化）」）——accent #7C3AED／bg #FDFCFF／字型 Plus Jakarta Sans；字型同 P3 但配色不同
- 頁數／QA 數：4 頁／16 題
- 差異化亮點：5 平台同框比較；個人品牌 B2B 銷售漏斗（洽詢→回款）；P4 新增評論深度指數與存儲率；刻意埋跨象限矛盾（TikTok 增速放緩但活躍率維穩、保險互動率最低但收入最高、Blog 最小但評論最深）。
- 陷阱主題：增速放緩不等於平台走弱／追蹤數暴漲誤判為正訊號／高互動不等於高收入／單次收入不等於業配決策標準／CPM 最低不等於最值得投
- 使用反饋：未記錄

## Dashboard #6 | 2026-06-12
- 檔案：`Dashboard/SaaS訂閱制_MRR訂閱指標分析_訓練儀表板教材.html`
- 產業：SaaS 訂閱制
- 訓練主題：MRR 訂閱指標分析（MRR 拆解、流失與 Cohort、LTV/CAC、試用漏斗）
- 錨點：`mrr: 4847200`、`arr: 58166400`、`arpu: 2584`、`monthly_churn_rate: 2.3`、`nrr: 104.2`、`ltv_cac_ratio: 3.9`
- 視覺 Preset：P3 輕色企業型（檔內自述）——bg #F8FAFC／accent #2563EB／字型 Plus Jakarta Sans
- 頁數／QA 數：4 頁／27 題
- 差異化亮點：Waterfall 強制 MRR=加法結構；Cohort 用 HTML 表格而非圖表；12 月刻意設為 MRR 下滑月（反直覺查因）；NRR 作外部輸入不從月度推算；試用轉換率口徑（÷申請數 38.2% vs ÷活躍試用 63.7%）刻意揭露。
- 陷阱主題：MRR 下滑不能直接歸因 Contraction／NRR 健康可能被新客掩蓋／先看 Cohort 再定優先客群／流失原因問卷的選擇性偏誤／LTV 簡化公式未扣 COGS
- 使用反饋：未記錄

## Dashboard #7 | 2026-06-14
- 檔案：`Dashboard/零售便利商店_商品庫存補貨分析_訓練儀表板教材.html`
- 產業：零售便利商店
- 訓練主題：商品庫存補貨分析（ABC 帕累托、毛利率、庫存週齡、缺貨與補貨優先矩陣）
- 錨點：`total_stores: 52`、`active_skus: 2847`、`overall_gm_pct: 34.5`、`inventory_turnover: 5.03`、`stockout_rate_pct: 8.3`、`abc_a_revenue_pct: 78.2`
- 視覺 Preset：P6 電商活力型——bg #ECFDF5／accent #059669／accent2 #10B981／字型 Rubik+Nunito Sans（另用 JetBrains Mono）均吻合
- 頁數／QA 數：4 頁／20 題
- 差異化亮點：ABC 分組使補貨策略可操作化（帕累托 25 點可看折點）；營收+毛利率雙軸同框揭示旺季讓利；補貨優先矩陣用 scatter 呈現象限；門市型態×品類雙熱力圖；Findings 預設收合（先問後答）。
- 陷阱主題：帕累托「前 20% SKU」錯答（16% 已達 78.9%）／銷量增不等於毛利率降／毛利率高不等於毛利額大（僅 3 個 `.trap-block`，其餘陷阱走其他形式）
- 使用反饋：未記錄

---

## 跨份總覽

| # | 產業 | 主題 | Preset | 主色 |
|---|---|---|---|---|
| 1 | 餐飲連鎖 | 門市營運分析 | P2（近似） | #3b82f6 |
| 2 | 電商 DTC | 會員交易分析 | 自訂（P2 字型、淺底） | #2d5be3 |
| 3 | 品牌訊息通道 | 多通道績效分析 | P7 Modified | #3B82F6 |
| 4 | 健身房 | 會員全週期分析 | P4 | #22D3EE |
| 5 | 網紅個人品牌 | 旅遊創作者受眾與業配 | 自訂 Social Creator | #7C3AED |
| 6 | SaaS 訂閱制 | MRR 訂閱指標 | P3 | #2563EB |
| 7 | 零售便利商店 | 商品庫存補貨 | P6 | #059669 |

重複：#1 與 #2 共用 Lora+Outfit 字型與 P2 基線；#2、#3、#6 主色皆為藍（#2d5be3／#3B82F6／#2563EB），#3 與 #1 的 accent 同為 #3B82F6；#5 與 #6 同用 Plus Jakarta Sans。尚未使用：P1、P5。
