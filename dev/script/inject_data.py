r"""Inject a generated DATA JSON into a dashboard between the /*__DATA__*/ ... /*__END__*/ markers.

Usage: python dev/script/inject_data.py <data.json> <dashboard.html>

Contract:
- the HTML must contain exactly one marker pair; 0 or >1 -> exit 1 (nothing written).
  First injection into a bare `/*__DATA__*/null` (no END marker yet) is still accepted.
- the JSON must be an object; `</script` inside string values is escaped as `<\/script` (still valid JSON/JS).
- write goes to a temp file in the same directory, then os.replace (original is never truncated midway).
- after writing, the content between the markers is re-read, json.loads'd and compared with the input.
- same input, same file -> byte-identical result (idempotent).
"""
import json
import os
import re
import sys
import tempfile

START, END = "/*__DATA__*/", "/*__END__*/"


def die(msg):
    sys.exit(f"inject_data: {msg}")


def build_payload(data):
    def dump(v):
        return json.dumps(v, ensure_ascii=False, separators=(",", ":"), allow_nan=False)

    lines = ",\n  ".join(f"{json.dumps(k, ensure_ascii=False)}: {dump(v)}" for k, v in data.items())
    body = "{\n  " + lines + "\n}" if data else "{}"
    # `</script` would end the inline <script> early; `<\/` is a legal JSON/JS escape for `</`.
    body = re.sub(r"</(script)", r"<\\/\1", body, flags=re.IGNORECASE)
    if START in body or END in body:
        die("JSON text contains a marker string; refusing")
    return body


def extract(html):
    s, e = html.find(START), html.find(END)
    return html[s + len(START):e]


def main():
    if len(sys.argv) != 3:
        die("usage: inject_data.py <data.json> <dashboard.html>")
    data_path, html_path = sys.argv[1], sys.argv[2]
    try:
        with open(data_path, encoding="utf-8") as f:
            data = json.load(f)
    except (OSError, ValueError) as ex:
        die(f"cannot read JSON {data_path}: {ex}")
    if not isinstance(data, dict):
        die(f"JSON top level must be an object, got {type(data).__name__}")
    try:
        body = build_payload(data)
    except ValueError as ex:  # allow_nan=False
        die(f"JSON contains a non-finite number: {ex}")

    with open(html_path, encoding="utf-8", newline="") as f:
        html = f.read()
    if "\r\n" in html:  # keep the file's line-ending style so re-injecting identical data is byte-stable
        body = body.replace("\n", "\r\n")
    n_start, n_end = html.count(START), html.count(END)
    if n_start != 1 or n_end > 1:
        die(f"expected exactly one {START} ... {END} pair, found {n_start} start / {n_end} end marker(s) in {html_path}")
    if n_end == 1:
        if html.find(START) > html.find(END):
            die("END marker precedes START marker")
        new = re.sub(re.escape(START) + r"[\s\S]*?" + re.escape(END), lambda _: START + body + END, html, count=1)
    else:
        if START + "null" not in html:
            die(f"{START} has no {END} and is not the first-run `{START}null` form")
        new = html.replace(START + "null", START + body + END, 1)

    fd, tmp = tempfile.mkstemp(dir=os.path.dirname(os.path.abspath(html_path)), suffix=".tmp")
    try:
        with os.fdopen(fd, "w", encoding="utf-8", newline="") as f:
            f.write(new)
        with open(tmp, encoding="utf-8", newline="") as f:
            back = f.read()
        if back.count(START) != 1 or back.count(END) != 1:
            die("read-back marker count != 1")
        try:
            ok = json.loads(extract(back)) == data
        except ValueError:
            ok = False
        if not ok:
            die("read-back JSON differs from input; original left untouched")
        os.replace(tmp, html_path)
    finally:
        if os.path.exists(tmp):
            os.remove(tmp)
    print(f"injected {len(data)} keys into {html_path}")


if __name__ == "__main__":
    main()
