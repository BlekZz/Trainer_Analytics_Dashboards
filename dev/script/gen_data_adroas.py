"""Generate DATA for 數位廣告投放_ROAS與AB測試分析 (dashboard #9) with anchor-derive-assert discipline.

Usage: python dev/script/gen_data_adroas.py <out.json>
All derived arrays close on the anchors; every assertion must pass before the JSON is written.

Statistical conventions (also stated in DATA.ab.method / DATA.holdout.method so the page can cite them):
- A/B per-arm 95% CI: Wald normal approximation p ± 1.96·sqrt(p(1−p)/n) on the cumulative conversion rate.
- A/B difference 95% CI: unpooled normal approximation (pB − pA) ± 1.96·sqrt(pA(1−pA)/nA + pB(1−pB)/nB).
- A/B p-value: two-sided two-proportion z-test with pooled SE, recomputed on cumulative counts every day (peeking view).
- Creative CTR 95% CI: Wald normal approximation per creative.
- Holdout incremental revenue: test-region revenue − test-region pre-period revenue × (control post / control pre)
  (pre-period-scaled control as the counterfactual; retargeting paused in control regions during the test).
"""
import math
import sys

import numpy as np

from datagen_lib import Checker, emit, make_rng, split_total

SEED = 20251101
GENERATOR_VERSION = "1"
RNG = make_rng(SEED)
MONTHS = 12
Z95 = 1.959964

# ── Anchors (locked) ────────────────────────────────────────────────
SPEND_WAN = 1283          # 年度總花費（萬）
REVENUE_WAN = 5147        # 後台實際營收（萬）
ORDERS = 41873            # 後台實際訂單
NEW_CUSTOMERS = 18529     # 新客數（= 首購訂單數）
OVERCLAIM = 1.43          # 平台自報歸因營收加總 ÷ 後台營收
COGS_PCT, RETURN_PCT = 32.0, 6.0

A = {
    "year": 2025,
    "spend_wan": SPEND_WAN,
    "revenue_wan": REVENUE_WAN,
    "orders": ORDERS,
    "aov": round(REVENUE_WAN * 10000 / ORDERS),
    "blended_roas": round(REVENUE_WAN / SPEND_WAN, 2),
    "new_customers": NEW_CUSTOMERS,
    "returning_orders": ORDERS - NEW_CUSTOMERS,
    "new_cpa": round(SPEND_WAN * 10000 / NEW_CUSTOMERS),
    "platform_revenue_wan": round(REVENUE_WAN * OVERCLAIM),
    "cogs_pct": COGS_PCT,
    "return_pct": RETURN_PCT,
    "margin_pct": 100 - COGS_PCT - RETURN_PCT,
}
A["overclaim_ratio"] = round(A["platform_revenue_wan"] / REVENUE_WAN, 2)
A["platform_roas"] = round(A["platform_revenue_wan"] / SPEND_WAN, 2)
A["breakeven_roas"] = round(100 / A["margin_pct"], 2)
A["margin_roas"] = round(REVENUE_WAN * A["margin_pct"] / 100 / SPEND_WAN, 2)

months = [f"{m}月" for m in range(1, 13)]

# ── ovw: monthly (保養品 DTC：2 月春節低、5 月母親節、6 月 618、10 月週年慶、11 月雙 11、Q4 CPM 上漲) ──
w_spend = [0.72, 0.62, 0.80, 0.86, 1.12, 1.18, 0.82, 0.80, 0.86, 1.22, 1.52, 1.28]
w_rev = [0.74, 0.66, 0.82, 0.88, 1.18, 1.24, 0.80, 0.78, 0.85, 1.30, 1.50, 1.20]
w_aov = [0.98, 0.97, 0.99, 1.00, 1.03, 1.02, 0.98, 0.97, 0.99, 1.04, 1.06, 1.02]  # 檔期組合價拉高客單
w_new = [0.78, 0.66, 0.86, 0.92, 1.20, 1.22, 0.86, 0.82, 0.90, 1.18, 1.25, 0.95]  # Q4 新客增幅追不上花費
noise = lambda: 1 + RNG.normal(0, 0.025, MONTHS)
spend_m = split_total(SPEND_WAN, np.array(w_spend) * noise())
revenue_m = split_total(REVENUE_WAN, np.array(w_rev) * noise())
orders_m = split_total(ORDERS, np.array(revenue_m) / np.array(w_aov))
new_m = split_total(NEW_CUSTOMERS, np.array(w_new) * noise())
cpa_m = [round(s * 10000 / n) for s, n in zip(spend_m, new_m)]
roas_m = [round(r / s, 2) for r, s in zip(revenue_m, spend_m)]

# ── channels ────────────────────────────────────────────────────────
CH = ["Meta 開發", "Meta 再行銷", "Google 搜尋", "Google PMax", "YouTube", "LINE"]
ch_spend = split_total(SPEND_WAN, [33.0, 12.0, 20.0, 16.0, 11.0, 8.0])
backend_roas_design = [2.9, 5.6, 6.4, 3.4, 1.4, 5.0]
ch_rev = split_total(REVENUE_WAN, np.array(ch_spend) * backend_roas_design)  # 後台去重（站內 UTM 最終點擊）
ch_aov_design = [1150, 1330, 1260, 1190, 1120, 1280]
ch_orders = split_total(ORDERS, np.array(ch_rev) / ch_aov_design)
new_share_design = [0.62, 0.21, 0.38, 0.47, 0.71, 0.14]
ch_new = split_total(NEW_CUSTOMERS, np.array(ch_orders) * new_share_design)
ch_returning = [o - n for o, n in zip(ch_orders, ch_new)]

# platform self-reported (each platform's own window, overlapping credit) — inflation is the teaching point
claim_rev_mult = [1.52, 1.753, 1.06, 1.60, 2.40, 1.25]
ch_claim_rev = [round(r * m) for r, m in zip(ch_rev, claim_rev_mult)]
ch_claim_rev[0] += A["platform_revenue_wan"] - sum(ch_claim_rev)  # close on anchor via the largest channel
claim_ord_mult = [1.49, 1.71, 1.05, 1.57, 2.31, 1.23]
ch_claim_orders = [round(o * m) for o, m in zip(ch_orders, claim_ord_mult)]

channels = {
    "labels": CH,
    "spend_wan": ch_spend,
    "spend_pct": [v / 10 for v in split_total(1000, ch_spend)],
    "backend_revenue_wan": ch_rev,
    "backend_orders": ch_orders,
    "backend_roas": [round(r / s, 2) for r, s in zip(ch_rev, ch_spend)],
    "platform_revenue_wan": ch_claim_rev,
    "platform_orders": ch_claim_orders,
    "platform_roas": [round(r / s, 2) for r, s in zip(ch_claim_rev, ch_spend)],
    "new_orders": ch_new,
    "returning_orders": ch_returning,
    "new_pct": [round(n / o * 100, 1) for n, o in zip(ch_new, ch_orders)],
}

# ── attr: three attribution models over the SAME deduplicated backend revenue (models move credit, not create it) ──
model_mult = {
    "last_click": [1, 1, 1, 1, 1, 1],
    "click7_view1": [1.16, 1.12, 0.84, 0.97, 2.05, 0.86],   # view-through credits upper funnel / video
    "dda": [1.14, 0.88, 0.80, 1.07, 1.62, 0.93],            # data-driven: brand search & retargeting lose share
}
attribution = {"models": ["最終點擊", "7 日點擊＋1 日瀏覽", "資料驅動"], "keys": list(model_mult),
               "revenue_wan": {}, "roas": {}}
for k, m in model_mult.items():
    rev = ch_rev if k == "last_click" else split_total(REVENUE_WAN, np.array(ch_rev) * m)
    attribution["revenue_wan"][k] = rev
    attribution["roas"][k] = [round(r / s, 2) for r, s in zip(rev, ch_spend)]

# conversion lag (首次廣告互動 → 下單), new customers deliberate longer (60–90 天回購週期的舊客多當天回購)
lag_labels = ["當天", "1 天", "2–7 天", "8–28 天"]
lag_new = split_total(NEW_CUSTOMERS, [31.4, 13.7, 30.6, 24.3])
lag_ret = split_total(A["returning_orders"], [54.8, 17.2, 19.6, 8.4])
lag_all = [a + b for a, b in zip(lag_new, lag_ret)]
lag = {"labels": lag_labels, "new": lag_new, "returning": lag_ret, "all": lag_all,
       "new_pct": [v / 10 for v in split_total(1000, lag_new)],
       "returning_pct": [v / 10 for v in split_total(1000, lag_ret)],
       "all_pct": [v / 10 for v in split_total(1000, lag_all)]}

# brand vs non-brand search (splits of the Google 搜尋 channel)
SI = CH.index("Google 搜尋")
s_spend = split_total(ch_spend[SI], [23.6, 76.4])
s_rev = split_total(ch_rev[SI], [57.9, 42.1])
s_orders = split_total(ch_orders[SI], [57.9 / 1.31, 42.1 / 1.20])
s_new = split_total(ch_new[SI], [s_orders[0] * 0.17, s_orders[1] * 0.62])
s_dda = split_total(attribution["revenue_wan"]["dda"][SI], [s_rev[0] * 0.62, s_rev[1] * 1.21])
search = {"labels": ["品牌字", "非品牌字"], "spend_wan": s_spend, "revenue_wan": s_rev, "orders": s_orders,
          "new_orders": s_new, "new_pct": [round(n / o * 100, 1) for n, o in zip(s_new, s_orders)],
          "roas": [round(r / s, 2) for r, s in zip(s_rev, s_spend)],
          "dda_revenue_wan": s_dda, "dda_roas": [round(r / s, 2) for r, s in zip(s_dda, s_spend)]}


# ── ab: landing-page test, 28 days ──────────────────────────────────
def pval(ca, na, cb, nb):
    """Two-sided pooled two-proportion z-test."""
    p = (ca + cb) / (na + nb)
    se = math.sqrt(p * (1 - p) * (1 / na + 1 / nb))
    z = (cb / nb - ca / na) / se
    return z, math.erfc(abs(z) / math.sqrt(2))


DAYS = 28
dow = np.tile([1.06, 1.03, 1.00, 0.98, 0.93, 0.95, 1.05], 4)  # day 1 = Monday
va = split_total(20983, dow * (1 + RNG.normal(0, 0.03, DAYS)))
vb = split_total(21027, dow * (1 + RNG.normal(0, 0.03, DAYS)))
cr_a_day = 0.054 * (1 + RNG.normal(0, 0.07, DAYS))
ca = [round(v * r) for v, r in zip(va, cr_a_day)]
# B: fix cumulative targets at day 5 / week boundaries / final, distribute within each block by A's daily rate.
expB = np.array(vb) * cr_a_day


def block_total(lo, hi, lift):
    return round(sum(ca[lo:hi]) / sum(va[lo:hi]) * sum(vb[lo:hi]) * (1 + lift))


cb = [0] * DAYS
blocks = [(0, 5, 0.305), (5, 7, 0.15), (7, 14, 0.052), (14, 21, -0.024)]
for lo, hi, lift in blocks:
    cb[lo:hi] = split_total(block_total(lo, hi, lift), expB[lo:hi])
FINAL_LIFT = 0.058
final_b = round(sum(ca) / sum(va) * sum(vb) * (1 + FINAL_LIFT))
cb[21:28] = split_total(final_b - sum(cb[:21]), expB[21:28])

cum = lambda xs: np.cumsum(xs).tolist()
cva, cvb, cca, ccb = cum(va), cum(vb), cum(ca), cum(cb)


def wald(c, n):
    p = c / n
    h = Z95 * math.sqrt(p * (1 - p) / n)
    return round(p * 100, 3), round((p - h) * 100, 3), round((p + h) * 100, 3)


ab = {"metric": "首購結帳率", "days": list(range(1, DAYS + 1)),
      "visitors_a": va, "visitors_b": vb, "conv_a": ca, "conv_b": cb,
      "cum_visitors_a": cva, "cum_visitors_b": cvb, "cum_conv_a": cca, "cum_conv_b": ccb,
      "cr_a": [], "ci_a_lo": [], "ci_a_hi": [], "cr_b": [], "ci_b_lo": [], "ci_b_hi": [],
      "lift_pct": [], "diff_pp": [], "diff_ci_lo": [], "diff_ci_hi": [], "z": [], "p_value": [],
      "method": {"ci_arm": "Wald 常態近似（每組累積轉換率）", "ci_diff": "未合併 SE 的常態近似（B−A，百分點）",
                 "test": "雙尾雙比例 z 檢定（合併 SE），每日以累積數重算", "alpha": 0.05}}
for i in range(DAYS):
    for arm, c, n in (("a", cca[i], cva[i]), ("b", ccb[i], cvb[i])):
        p, lo, hi = wald(c, n)
        ab[f"cr_{arm}"].append(p)
        ab[f"ci_{arm}_lo"].append(lo)
        ab[f"ci_{arm}_hi"].append(hi)
    pa, pb = cca[i] / cva[i], ccb[i] / cvb[i]
    se_u = math.sqrt(pa * (1 - pa) / cva[i] + pb * (1 - pb) / cvb[i])
    z, p = pval(cca[i], cva[i], ccb[i], cvb[i])
    ab["lift_pct"].append(round((pb / pa - 1) * 100, 1))
    ab["diff_pp"].append(round((pb - pa) * 100, 3))
    ab["diff_ci_lo"].append(round((pb - pa - Z95 * se_u) * 100, 3))
    ab["diff_ci_hi"].append(round((pb - pa + Z95 * se_u) * 100, 3))
    ab["z"].append(round(z, 3))
    ab["p_value"].append(round(p, 4))

weekly = {"labels": ["第 1 週", "第 2 週", "第 3 週", "第 4 週"], "visitors_a": [], "conv_a": [],
          "visitors_b": [], "conv_b": [], "lift_pct": []}
for w in range(4):
    s = slice(w * 7, w * 7 + 7)
    for key, arr in (("visitors_a", va), ("conv_a", ca), ("visitors_b", vb), ("conv_b", cb)):
        weekly[key].append(sum(arr[s]))
    weekly["lift_pct"].append(round((weekly["conv_b"][w] / weekly["visitors_b"][w])
                                    / (weekly["conv_a"][w] / weekly["visitors_a"][w]) * 100 - 100, 1))
ab["weekly"] = weekly

# device split (final 28-day totals): mobile carries the lift, desktop slightly negative
TA, TB, TCA, TCB = cva[-1], cvb[-1], cca[-1], ccb[-1]
mva, mvb = round(TA * 0.762), round(TB * 0.758)
mca = round(mva * 0.0503)
mcb = round(mvb * mca / mva * 1.083)
device = {"labels": ["手機", "桌機"], "visitors_a": [mva, TA - mva], "conv_a": [mca, TCA - mca],
          "visitors_b": [mvb, TB - mvb], "conv_b": [mcb, TCB - mcb], "cr_a": [], "cr_b": [], "lift_pct": [], "p_value": []}
for d in range(2):
    pa = device["conv_a"][d] / device["visitors_a"][d]
    pb = device["conv_b"][d] / device["visitors_b"][d]
    device["cr_a"].append(round(pa * 100, 2))
    device["cr_b"].append(round(pb * 100, 2))
    device["lift_pct"].append(round((pb / pa - 1) * 100, 1))
    device["p_value"].append(round(pval(device["conv_a"][d], device["visitors_a"][d],
                                        device["conv_b"][d], device["visitors_b"][d])[1], 4))
ab["device"] = device

# ── creatives: 8 Meta 素材首週測試（小額、曝光數不等） ───────────────
cr_labels = ["前後對比（療效暗示）", "KOL 開箱", "成分特寫", "質地 ASMR", "用戶 UGC 心得", "實驗室幕後", "週年慶倒數", "限時優惠"]
cr_imp = [6213, 21436, 18921, 24683, 16352, 15718, 17465, 26039]
cr_ctr_design = [0.0182, 0.0151, 0.0147, 0.0141, 0.0137, 0.0133, 0.0119, 0.0107]
cr_clicks = [round(i * c) for i, c in zip(cr_imp, cr_ctr_design)]
creatives = {"labels": cr_labels, "impressions": cr_imp, "clicks": cr_clicks,
             "compliance_risk": [True, False, False, False, False, False, False, False],
             "ctr": [], "ci_lo": [], "ci_hi": [], "method": "Wald 常態近似 95% CI"}
for c, n in zip(cr_clicks, cr_imp):
    p, lo, hi = wald(c, n)
    creatives["ctr"].append(p)
    creatives["ci_lo"].append(lo)
    creatives["ci_hi"].append(hi)
top = int(np.argmax(creatives["ctr"]))
creatives["top_index"] = top
creatives["overlap_with_top"] = sum(1 for j in range(8) if j != top and creatives["ci_hi"][j] >= creatives["ci_lo"][top])

# ── budget: Meta 開發 spend tiers on a saturating response curve R(s) = a·(1 − e^(−s/b)) ──
MI = CH.index("Meta 開發")
s_cur = ch_spend[MI] / 12
B_SCALE = 40.0
a_curve = (ch_rev[MI] / 12) / (1 - math.exp(-s_cur / B_SCALE))
tier_spend = [round(s_cur * f, 1) for f in (0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0)]
tier_rev = [round(a_curve * (1 - math.exp(-s / B_SCALE)), 1) for s in tier_spend]
tiers = {"channel": CH[MI], "unit": "萬／月", "current_index": 2,
         "spend_wan": tier_spend, "revenue_wan": tier_rev,
         "avg_roas": [round(r / s, 2) for r, s in zip(tier_rev, tier_spend)],
         "marginal_labels": [f"{tier_spend[i]}→{tier_spend[i + 1]}" for i in range(len(tier_spend) - 1)],
         "marginal_roas": [round((tier_rev[i + 1] - tier_rev[i]) / (tier_spend[i + 1] - tier_spend[i]), 2)
                           for i in range(len(tier_spend) - 1)]}

# geo holdout: Q4 6 週，Meta 再行銷在對照區暫停；金額單位：元
HSPEND = 136420
h_attr = round(HSPEND * 9.8)
h_test_pre, h_ctrl_pre, h_ctrl_post = 3897460, 3718230, 4096870
h_expected = h_test_pre * h_ctrl_post / h_ctrl_pre
h_test_post = round(h_expected + HSPEND * 1.58)
h_incr = round(h_test_post - h_expected)
holdout = {"channel": "Meta 再行銷", "period": "2025 Q4（6 週）", "unit": "元",
           "spend": HSPEND, "attributed_revenue": h_attr,
           "test_pre": h_test_pre, "test_post": h_test_post, "control_pre": h_ctrl_pre, "control_post": h_ctrl_post,
           "expected_test_post": round(h_expected), "incremental_revenue": h_incr,
           "attributed_roas": round(h_attr / HSPEND, 2), "incremental_roas": round(h_incr / HSPEND, 2),
           "method": "增量營收 = 測試區活動期營收 − 測試區前期營收 ×（對照區活動期 ÷ 對照區前期）"}

margin_rate = A["margin_pct"] / 100
margin = {"labels": CH, "revenue_roas": channels["backend_roas"],
          "margin_roas": [round(r * margin_rate / s, 2) for r, s in zip(ch_rev, ch_spend)],
          "breakeven_revenue_roas": A["breakeven_roas"], "breakeven_margin_roas": 1.0}

DATA = {"anchors": A, "months": months,
        "monthly": {"spend_wan": spend_m, "revenue_wan": revenue_m, "orders": orders_m,
                    "new_customers": new_m, "new_cpa": cpa_m, "roas": roas_m},
        "channels": channels, "attribution": attribution, "lag": lag, "search": search,
        "ab": ab, "creatives": creatives, "tiers": tiers, "holdout": holdout, "margin": margin}

# ── Assertions (must all pass) ──────────────────────────────────────
chk = Checker()
N_ASSERT = [0]


def eq(a, b, label, tol=0):
    N_ASSERT[0] += 1
    chk.eq(a, b, label, tol)


def ok(cond, label):
    N_ASSERT[0] += 1
    chk.check(cond, label)


# anchors & derived KPIs
eq(A["aov"], 1229, "aov ≈ 1,229", 1)
eq(A["blended_roas"], round(REVENUE_WAN / SPEND_WAN, 2), "blended ROAS = revenue ÷ spend")
ok(3.9 <= A["blended_roas"] <= 4.1, "blended ROAS ≈ 4.0")
ok(1.42 <= A["platform_revenue_wan"] / REVENUE_WAN <= 1.44, "platform sum ≈ 1.43 × backend")
eq(A["margin_pct"], 62.0, "margin = 100 − COGS − returns")
eq(A["new_customers"] + A["returning_orders"], ORDERS, "new + returning = orders")
for k in ("spend_wan", "revenue_wan", "orders", "new_customers"):
    ok(A[k] % 10 != 0, f"anchor {k} must not end in 0")
# monthly closure
eq(sum(spend_m), SPEND_WAN, "monthly spend sum")
eq(sum(revenue_m), REVENUE_WAN, "monthly revenue sum")
eq(sum(orders_m), ORDERS, "monthly orders sum")
eq(sum(new_m), NEW_CUSTOMERS, "monthly new customers sum")
ok(all(n <= o for n, o in zip(new_m, orders_m)), "monthly new ≤ orders")
for mi in (4, 5, 9, 10):  # May, Jun, Oct, Nov peaks
    ok(revenue_m[mi] > np.mean(revenue_m), f"month {mi + 1} revenue above average (season peak)")
ok(revenue_m[10] == max(revenue_m), "Nov (雙 11) is the revenue peak")
ok(revenue_m[1] == min(revenue_m), "Feb (春節) is the revenue trough")
ok(np.mean(cpa_m[9:]) > np.mean(cpa_m[:9]) * 1.1, "Q4 new-customer CPA ≥ 10% above Jan–Sep (CPM 上漲)")
# channels
eq(sum(ch_spend), SPEND_WAN, "channel spend sum")
eq(sum(channels["spend_pct"]), 100.0, "channel spend pct sum", 1e-9)
eq(sum(ch_rev), REVENUE_WAN, "channel backend revenue sum")
eq(sum(ch_orders), ORDERS, "channel backend orders sum")
eq(sum(ch_new), NEW_CUSTOMERS, "channel new orders sum")
eq(sum(ch_claim_rev), A["platform_revenue_wan"], "channel platform revenue sum = anchor")
ok(all(c > b for c, b in zip(ch_claim_rev, ch_rev)), "every platform over-claims revenue")
ok(all(c > b for c, b in zip(ch_claim_orders, ch_orders)), "every platform over-claims orders")
ok(1.35 <= sum(ch_claim_orders) / ORDERS <= 1.50, "platform orders sum ≈ 1.4 × backend")
ok(all(0 < r < o for r, o in zip(ch_returning, ch_orders)), "per-channel returning in (0, orders)")
ok(channels["new_pct"][1] < 25 and channels["new_pct"][5] < 25, "retargeting / LINE mostly returning")
ok(channels["new_pct"][4] > 60, "YouTube mostly new")
eq(channels["platform_roas"][1], 9.8, "Meta 再行銷 platform ROAS ≈ 9.8", 0.05)
aovs = [r * 10000 / o for r, o in zip(ch_rev, ch_orders)]
ok(all(1000 <= v <= 1450 for v in aovs), "channel AOV within 1,000–1,450")
# attribution models
for k in model_mult:
    eq(sum(attribution["revenue_wan"][k]), REVENUE_WAN, f"model {k} revenue sum = backend")
ar = attribution["roas"]
YI = CH.index("YouTube")
ok(ar["click7_view1"][YI] > ar["last_click"][YI] * 1.5, "YouTube gains under view-through")
ok(ar["dda"][SI] < ar["last_click"][SI], "search loses under DDA")
ok(ar["dda"][1] < ar["last_click"][1], "retargeting loses under DDA")
# lag
eq(sum(lag_new), NEW_CUSTOMERS, "lag new sum")
eq(sum(lag_ret), A["returning_orders"], "lag returning sum")
for key in ("new_pct", "returning_pct", "all_pct"):
    eq(round(sum(lag[key]), 6), 100.0, f"lag {key} sum = 100")
ok(lag["new_pct"][3] > lag["returning_pct"][3] * 2, "new customers have longer lag")
# search split
eq(sum(s_spend), ch_spend[SI], "search spend split")
eq(sum(s_rev), ch_rev[SI], "search revenue split")
eq(sum(s_orders), ch_orders[SI], "search orders split")
eq(sum(s_new), ch_new[SI], "search new split")
eq(sum(s_dda), attribution["revenue_wan"]["dda"][SI], "search DDA split")
ok(search["roas"][0] > 2.5 * search["roas"][1], "brand ROAS ≫ non-brand")
ok(search["new_pct"][0] < 25 < 50 < search["new_pct"][1], "brand mostly returning; non-brand mostly new")
ok(search["dda_roas"][0] < search["roas"][0] and search["dda_roas"][1] > search["roas"][1], "DDA: brand down, non-brand up")
# A/B
ok(20500 <= TA <= 21500 and 20500 <= TB <= 21500, "≈21k visitors per arm")
eq(sum(va), TA, "A visitors cumulative")
eq(sum(cb), TCB, "B conversions cumulative")
ok(all(0 < c < v for c, v in zip(ca + cb, va + vb)), "daily conversions in (0, visitors)")
ok(min(ca + cb) > 0, "no zero-conversion day")
d5 = 4
ok(ab["lift_pct"][d5] >= 27 and ab["p_value"][d5] < 0.05, f"day 5 B ≈ +30% & p<0.05 (got {ab['lift_pct'][d5]}, {ab['p_value'][d5]})")
ok(4.0 <= ab["lift_pct"][-1] <= 6.0, f"final lift 4–6% (got {ab['lift_pct'][-1]})")
ok(0.05 < ab["p_value"][-1] < 0.2, f"final p in (0.05, 0.2) (got {ab['p_value'][-1]})")
ok(ab["diff_ci_lo"][-1] < 0 < ab["diff_ci_hi"][-1], "final diff CI spans 0")
ok(ab["ci_b_lo"][-1] < ab["cr_a"][-1] < ab["ci_b_hi"][-1] or ab["ci_a_hi"][-1] > ab["ci_b_lo"][-1], "final arm CIs overlap")
wl = weekly["lift_pct"]
ok(all(wl[i] > wl[i + 1] for i in range(3)), f"weekly lift strictly decreasing (got {wl})")
ok(wl[0] > 20 and wl[3] < 0, "novelty: week 1 strong, week 4 negative")
ok(any(p >= 0.05 for p in ab["p_value"][14:]), "p rises back above 0.05 after week 2")
eq(sum(weekly["visitors_a"]), TA, "weekly A visitors")
eq(sum(weekly["conv_b"]), TCB, "weekly B conversions")
eq(sum(device["visitors_a"]), TA, "device A visitors")
eq(sum(device["conv_b"]), TCB, "device B conversions")
ok(device["lift_pct"][0] > ab["lift_pct"][-1] > device["lift_pct"][1], "device: mobile > overall > desktop")
ok(device["cr_a"][1] > device["cr_a"][0], "desktop converts higher than mobile")
# creatives
ok(top == 0 and cr_imp[top] == min(cr_imp), "top CTR creative has the smallest sample (winner's curse)")
ok(creatives["overlap_with_top"] >= 5, f"top CTR CI overlaps ≥5 of 7 (got {creatives['overlap_with_top']})")
ok(creatives["ctr"] == sorted(creatives["ctr"], reverse=True), "creatives sorted by CTR desc")
# tiers
mr, av = tiers["marginal_roas"], tiers["avg_roas"]
ok(all(mr[i] > mr[i + 1] for i in range(len(mr) - 1)), "marginal ROAS strictly decreasing")
ok(all(av[i + 1] > mr[i] for i in range(len(mr))), "average ROAS > marginal at every tier")
ok(mr[1] > A["breakeven_roas"] > mr[3], "break-even crossed just above current spend")
eq(tier_rev[2] * 12, ch_rev[MI], "current tier × 12 ≈ Meta 開發 annual revenue", ch_rev[MI] * 0.01)
# holdout
eq(holdout["attributed_roas"], 9.8, "holdout attributed ROAS ≈ 9.8", 0.05)
eq(holdout["incremental_roas"], 1.6, "holdout incremental ROAS ≈ 1.6", 0.05)
ok(holdout["incremental_roas"] < A["breakeven_roas"], "incremental ROAS below break-even")
eq(holdout["incremental_revenue"], round(h_test_post - h_test_pre * h_ctrl_post / h_ctrl_pre), "incremental formula")
# margin
ok(margin["margin_roas"][YI] < 1 < min(m for i, m in enumerate(margin["margin_roas"]) if i != YI), "only YouTube below margin break-even")

chk.finish()
meta_path = emit(DATA, sys.argv[1], seed=SEED, generator="gen_data_adroas", generator_version=GENERATOR_VERSION)
print(f"✓ all {N_ASSERT[0]} assertions passed; wrote {sys.argv[1]} (+ {meta_path})")
print("anchors", A)
print("monthly spend", spend_m, "revenue", revenue_m, "cpa", cpa_m)
print("channels backend roas", channels["backend_roas"], "platform roas", channels["platform_roas"], "new%", channels["new_pct"])
print("models", attribution["roas"])
print("search", search["roas"], search["dda_roas"], search["new_pct"])
print("ab day5", ab["lift_pct"][4], ab["p_value"][4], "final", ab["lift_pct"][-1], ab["p_value"][-1], "weekly", wl)
print("ab p series", ab["p_value"])
print("device", device["lift_pct"], device["p_value"])
print("creatives ctr", creatives["ctr"], "overlap", creatives["overlap_with_top"])
print("tiers avg", av, "marginal", mr)
print("holdout", holdout["attributed_roas"], holdout["incremental_roas"], h_incr)
print("margin roas", margin["margin_roas"])
