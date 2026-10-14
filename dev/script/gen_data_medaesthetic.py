"""Generate DATA for 醫美連鎖_預約回診分析 (dashboard #8) with anchor-derive-assert discipline.

Usage: python dev/script/gen_data_medaesthetic.py <out.json>
All derived arrays are forced to close on the anchors; every assertion must pass before the JSON is written.
"""
import json
import sys

import numpy as np

RNG = np.random.default_rng(20251014)
MONTHS = 12

# ── Anchors (locked) ────────────────────────────────────────────────
A = {
    "year": 2025,
    "clinics": 6,
    "appointments": 48000,
    "cancelled": 3600,
    "noshow": 4560,
    "attended": 39840,
    "attend_rate": 83.0,
    "prev_appointments": 42105,
    "prev_attend_rate": 86.0,
    "unique_customers": 14200,
    "new_customers": 8100,
    "returning_customers": 6100,
    "revenue_wan": 23904,
    "aov": 6000,
    "revisit_90d": 41.0,
    "prev_revisit_90d": 46.0,
}
A["appt_yoy"] = round((A["appointments"] / A["prev_appointments"] - 1) * 100, 1)


def split_total(total, weights):
    """Integer split of total proportional to weights; remainder goes to the largest weights."""
    w = np.asarray(weights, dtype=float)
    raw = w / w.sum() * total
    out = np.floor(raw).astype(int)
    for i in np.argsort(-(raw - out))[: total - out.sum()]:
        out[i] += 1
    return out.tolist()


# ── P1 monthly funnel ───────────────────────────────────────────────
season = [1.18, 0.78, 0.92, 0.95, 0.98, 0.96, 1.08, 1.06, 0.93, 0.97, 1.05, 1.14]
appts = split_total(A["appointments"], season)
cancelled = split_total(A["cancelled"], np.array(appts) * (1 + RNG.normal(0, 0.08, MONTHS)))  # monthly variation
rate_path = np.linspace(86.4, 79.8, MONTHS) + RNG.normal(0, 0.45, MONTHS)  # drifts down, with noise
attended = [round(a * r / 100) for a, r in zip(appts, rate_path)]
attended[-1] += A["attended"] - sum(attended)  # close on anchor
noshow = [a - c - t for a, c, t in zip(appts, cancelled, attended)]

noshow_reasons = {"labels": ["忘記", "臨時有事", "遲到超過15分", "價格考量", "其他"],
                  "counts": [1550, 1280, 820, 540, 370]}
lead = {"labels": ["當天", "1–3天", "4–7天", "8–14天", "15天以上"],
        "appts": [6200, 13400, 12800, 9100, 6500],
        "noshow": [248, 938, 1216, 1137, 1021]}

# ── P2 customers & revisit ──────────────────────────────────────────
new_weights = [0.70, 0.55, 0.70, 0.75, 0.80, 0.80, 0.95, 0.95, 0.90, 1.00, 1.15, 1.25]
new_visits = split_total(A["new_customers"], new_weights)
returning_visits = [t - n for t, n in zip(attended, new_visits)]

treat_cats = ["皮秒／音波拉提", "玻尿酸", "肉毒", "雷射美白", "保養療程"]
revisit_by_cat = {"labels": treat_cats,
                  "base": [1500, 1700, 2600, 2900, 3300],
                  "revisit": [810, 765, 1014, 1015, 1316]}

# cohort = 2025 年內第一次到診的月份（新舊客皆含）；H2 = 7–10 月（滿 90 天觀察期），180 天尚無法觀察 → None
cohort = {"days": [30, 60, 90, 180],
          "h1": [21.0, 34.5, 44.8, 58.2], "h1_n": 6078,
          "h2": [17.6, 28.9, 37.1, None], "h2_n": 5922}

# Simpson: both segments improve, aggregate falls because the new-customer share rises
# 基準期 = 1–10 月到診顧客（12,000 人）；新客基期必須等於 1–10 月新客首次到診加總
new_base_curr = sum(new_visits[:10])
simpson = {
    "segments": ["新客", "舊客"],
    "prev": {"base": [3871, 8129], "revisit": [968, 4552]},                          # 25.0% / 56.0% → 46.0%
    "curr": {"base": [new_base_curr, 12000 - new_base_curr],
             "revisit": [round(new_base_curr * 0.26), 4920 - round(new_base_curr * 0.26)]},  # 26.0% / ~57.3% → 41.0%
}

# ── P3 treatments & revenue ─────────────────────────────────────────
rev_by_cat = {"labels": treat_cats, "revenue_wan": [7650, 6214, 4302, 3346, 2392],
              "visits": [4400, 5600, 7640, 9200, 13000]}
aov_hist = {"labels": ["<3千", "3–6千", "6千–1萬", "1–2萬", "2萬以上"],
            "visits": [14200, 11800, 7400, 4640, 1800]}
doctors = {"labels": ["王醫師", "林醫師", "陳醫師", "張醫師", "李醫師", "黃醫師", "吳醫師", "劉醫師"],
           "visits": [6200, 5800, 5400, 5100, 4900, 4600, 4200, 3640]}

# ── P4 same stats, different shapes ─────────────────────────────────
TARGET = {"mx": 70.0, "sx": 8.0, "my": 24.0, "sy": 6.0, "r": 0.60}
N = 30


def shape(kind):
    if kind == "linear":
        x = RNG.normal(0, 1, N)
        y = x + RNG.normal(0, 0.9, N)
    elif kind == "outlier":
        x = RNG.normal(0, 0.75, N)
        y = RNG.normal(0, 0.75, N)
        x[-2:], y[-2:] = 3.0, 3.0  # placeholders; positions are solved in fit()
    elif kind == "clusters":
        g = np.r_[np.zeros(N // 2), np.ones(N - N // 2)]
        x = g * 2.4 + RNG.normal(0, 0.35, N)
        y = g * 1.6 + RNG.normal(0, 0.45, N)
    elif kind == "ushape":
        x = np.linspace(-1.8, 1.8, N) + RNG.normal(0, 0.05, N)
        y = x ** 2 + RNG.normal(0, 0.12, N)
    return x, y


def fit(kind):
    """Blend in the x direction until corr hits the target, then map to the target mean/sd."""
    x, y = shape(kind)
    if kind == "outlier":
        # main cluster decorrelated exactly (r = 0); only the two outliers create the correlation
        mx_, my_ = x[:-2], y[:-2] - y[:-2].mean()
        dx = mx_ - mx_.mean()
        my_ = my_ - (my_ @ dx) / (dx @ dx) * dx
        lo, hi = 0.1, 20.0
        for _ in range(80):
            a = (lo + hi) / 2
            xx = np.r_[mx_, mx_.mean() + a, mx_.mean() + 0.85 * a]
            yy = np.r_[my_, a, 0.95 * a]
            r = np.corrcoef(xx, yy)[0, 1]
            lo, hi = (a, hi) if r < TARGET["r"] else (lo, a)
        zx = (xx - xx.mean()) / xx.std()
        yy = (yy - yy.mean()) / yy.std()
    else:
        zx = (x - x.mean()) / x.std()
        zy = (y - y.mean()) / y.std()
        lo, hi = -5.0, 5.0
        for _ in range(80):
            t = (lo + hi) / 2
            yy = zy + t * zx
            r = np.corrcoef(zx, yy)[0, 1]
            lo, hi = (t, hi) if r < TARGET["r"] else (lo, t)
        yy = (yy - yy.mean()) / yy.std()
    px = np.round(TARGET["mx"] + TARGET["sx"] * zx, 1)
    py = np.round(TARGET["my"] + TARGET["sy"] * yy, 1)
    return [{"x": float(a), "y": float(b)} for a, b in zip(px, py)]


quartet = {"doctors": ["王醫師", "林醫師", "陳醫師", "張醫師"],
           "kinds": ["linear", "outlier", "clusters", "ushape"],
           "x_label": "療程後滿意度（0–100）", "y_label": "半年內回購金額（千元）"}
quartet["points"] = [fit(k) for k in quartet["kinds"]]


def stats(pts):
    x = np.array([p["x"] for p in pts])
    y = np.array([p["y"] for p in pts])
    return [float(round(v, k)) for v, k in ((x.mean(), 1), (x.std(), 1), (y.mean(), 1), (y.std(), 1), (np.corrcoef(x, y)[0, 1], 2))]


quartet["stats"] = [stats(p) for p in quartet["points"]]

DATA = {"anchors": A, "months": [f"{m}月" for m in range(1, 13)],
        "appts": appts, "cancelled": cancelled, "attended": attended, "noshow": noshow,
        "noshow_reasons": noshow_reasons, "lead": lead,
        "new_visits": new_visits, "returning_visits": returning_visits,
        "revisit_by_cat": revisit_by_cat, "cohort": cohort, "simpson": simpson,
        "rev_by_cat": rev_by_cat, "aov_hist": aov_hist, "doctors": doctors, "quartet": quartet}

# ── Assertions (must all pass) ──────────────────────────────────────
errs = []


def eq(a, b, label, tol=0):
    if abs(a - b) > tol:
        errs.append(f"{label}: got {a}, expected {b}")


eq(A["cancelled"] + A["noshow"] + A["attended"], A["appointments"], "funnel closes")
eq(round(A["attended"] / A["appointments"] * 100, 1), A["attend_rate"], "attend_rate")
eq(A["new_customers"] + A["returning_customers"], A["unique_customers"], "customers split")
eq(A["attended"] * A["aov"] / 10000, A["revenue_wan"], "revenue = attended × aov")
eq(A["appt_yoy"], 14.0, "appt_yoy", 0.05)
eq(sum(appts), A["appointments"], "monthly appts sum")
eq(sum(cancelled), A["cancelled"], "monthly cancelled sum")
eq(sum(attended), A["attended"], "monthly attended sum")
eq(sum(noshow), A["noshow"], "monthly noshow sum")
if min(noshow) <= 0:
    errs.append("monthly noshow must be positive")
eq(sum(noshow_reasons["counts"]), A["noshow"], "noshow reasons sum")
eq(sum(lead["appts"]), A["appointments"], "lead appts sum")
eq(sum(lead["noshow"]), A["noshow"], "lead noshow sum")
lead_rates = [n / a for n, a in zip(lead["noshow"], lead["appts"])]
if lead_rates != sorted(lead_rates):
    errs.append("lead-time noshow rate should rise with lead time")
eq(sum(new_visits), A["new_customers"], "new visits sum = new customers")
eq(sum(returning_visits), A["attended"] - A["new_customers"], "returning visits sum")
rb = revisit_by_cat
eq(sum(rb["base"]), 12000, "revisit base")
eq(round(sum(rb["revisit"]) / sum(rb["base"]) * 100, 1), A["revisit_90d"], "revisit_90d by category")
eq(cohort["h1_n"] + cohort["h2_n"], 12000, "cohort sizes = revisit base")
eq(round((cohort["h1"][2] * cohort["h1_n"] + cohort["h2"][2] * cohort["h2_n"]) / 12000, 1), A["revisit_90d"], "cohort weighted 90d")
sp = simpson
eq(sum(sp["curr"]["base"]), 12000, "simpson curr base")
eq(sp["curr"]["base"][0], sum(new_visits[:10]), "simpson new base = Jan–Oct new visits")
eq(round(sum(sp["curr"]["revisit"]) / sum(sp["curr"]["base"]) * 100, 1), A["revisit_90d"], "simpson curr aggregate")
eq(round(sum(sp["prev"]["revisit"]) / sum(sp["prev"]["base"]) * 100, 1), A["prev_revisit_90d"], "simpson prev aggregate")
eq(sum(sp["curr"]["revisit"]), sum(rb["revisit"]), "simpson revisit = category revisit")
for i in range(2):
    pr = sp["prev"]["revisit"][i] / sp["prev"]["base"][i]
    cr = sp["curr"]["revisit"][i] / sp["curr"]["base"][i]
    if not cr > pr:
        errs.append(f"simpson segment {i} must improve")
eq(sum(rev_by_cat["revenue_wan"]), A["revenue_wan"], "revenue by category")
eq(sum(rev_by_cat["visits"]), A["attended"], "visits by category")
if rev_by_cat["revenue_wan"] != sorted(rev_by_cat["revenue_wan"], reverse=True):
    errs.append("revenue by category must be sorted desc")
eq(sum(aov_hist["visits"]), A["attended"], "aov histogram")
eq(sum(doctors["visits"]), A["attended"], "doctor visits")
for k, pts in zip(quartet["kinds"], quartet["points"]):
    if not all(0 <= p["x"] <= 100 and p["y"] >= 0 for p in pts):
        errs.append(f"{k}: point outside domain (x 0–100, y ≥ 0)")
for k, st in zip(quartet["kinds"], quartet["stats"]):
    eq(st[0], TARGET["mx"], f"{k} mean x", 0.1)
    eq(st[1], TARGET["sx"], f"{k} sd x", 0.1)
    eq(st[2], TARGET["my"], f"{k} mean y", 0.1)
    eq(st[3], TARGET["sy"], f"{k} sd y", 0.1)
    eq(st[4], TARGET["r"], f"{k} corr", 0.01)

if errs:
    print("ASSERTION FAILED:\n  " + "\n  ".join(errs))
    sys.exit(1)
json.dump(DATA, open(sys.argv[1], "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(f"✓ all assertions passed; wrote {sys.argv[1]}")
print("monthly appts", appts)
print("monthly attend rate", [round(t / a * 100, 1) for t, a in zip(attended, appts)])
print("monthly noshow", noshow)
print("lead noshow %", [round(r * 100, 1) for r in lead_rates])
print("quartet stats", quartet["stats"])
