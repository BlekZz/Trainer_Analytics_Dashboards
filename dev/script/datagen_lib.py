"""Shared helpers for dashboard DATA generators (anchor -> derive -> assert -> emit).

Only what generators actually reuse lives here: seeded RNG, integer quota split,
assertion collector (rejects NaN/inf), and emit (DATA JSON + side-car meta).
"""
import json
import math
import platform
import sys

import numpy as np

SCHEMA_VERSION = 1


def make_rng(seed):
    """Fixed-seed numpy Generator. Call once per generator; draw order is part of the output contract."""
    return np.random.default_rng(seed)


def split_total(total, weights):
    """Integer split of `total` proportional to `weights`; remainder goes to the largest fractional parts. Sum is exact."""
    w = np.asarray(weights, dtype=float)
    if not np.all(np.isfinite(w)) or (w < 0).any() or w.sum() <= 0:
        raise ValueError("weights must be finite, non-negative, with positive sum")
    raw = w / w.sum() * total
    out = np.floor(raw).astype(int)
    for i in np.argsort(-(raw - out))[: total - out.sum()]:
        out[i] += 1
    return out.tolist()


class Checker:
    """Collects assertion failures instead of stopping at the first. NaN/inf operands always fail."""

    def __init__(self):
        self.errs = []

    @staticmethod
    def _finite(*vals):
        return all(isinstance(v, (int, float, np.integer, np.floating)) and math.isfinite(v) for v in vals)

    def eq(self, a, b, label, tol=0):
        if not self._finite(a, b, tol):
            self.errs.append(f"{label}: non-finite or non-numeric operand (got {a!r}, expected {b!r})")
        elif abs(a - b) > tol:
            self.errs.append(f"{label}: got {a}, expected {b}")

    def check(self, cond, label):
        if not cond:
            self.errs.append(label)

    def finish(self):
        """Exit 1 with all failures listed; return silently when clean."""
        if self.errs:
            print("ASSERTION FAILED:\n  " + "\n  ".join(self.errs))
            sys.exit(1)


def emit(data, out_path, *, seed, generator, generator_version, indent=1):
    """Write DATA JSON (unchanged shape) and a `<out>.meta.json` side-car with seed/schema/generator/runtime versions.

    Meta stays out of DATA so the injected dashboard and the JSON bytes are not affected by provenance fields.
    """
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=indent)
    meta = {"seed": seed, "schema_version": SCHEMA_VERSION, "generator": generator,
            "generator_version": generator_version, "python": platform.python_version(), "numpy": np.__version__}
    meta_path = f"{out_path}.meta.json"
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(meta, f, ensure_ascii=False, indent=1)
    return meta_path
