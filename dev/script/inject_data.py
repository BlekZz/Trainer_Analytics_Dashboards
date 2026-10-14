"""Inject a generated DATA JSON into a dashboard between the /*__DATA__*/ … /*__END__*/ markers.

Usage: python dev/script/inject_data.py <data.json> <dashboard.html>
First run replaces `/*__DATA__*/null`; later runs replace whatever sits between the two markers.
"""
import json
import re
import sys

data_path, html_path = sys.argv[1], sys.argv[2]
data = json.load(open(data_path, encoding="utf-8"))
lines = ",\n  ".join(f"{json.dumps(k, ensure_ascii=False)}: {json.dumps(v, ensure_ascii=False, separators=(',', ':'))}" for k, v in data.items())
payload = "/*__DATA__*/{\n  " + lines + "\n}/*__END__*/"

html = open(html_path, encoding="utf-8").read()
if "/*__DATA__*/null" in html:
    html = html.replace("/*__DATA__*/null", payload, 1)
else:
    html, n = re.subn(r"/\*__DATA__\*/[\s\S]*?/\*__END__\*/", lambda _: payload, html, count=1)
    if n != 1:
        sys.exit("markers not found")
open(html_path, "w", encoding="utf-8").write(html)
print(f"injected {len(data)} keys into {html_path}")
