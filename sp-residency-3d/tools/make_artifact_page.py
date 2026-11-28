"""Turn dist-artifact/index.html into the hosted page body (the host adds its own
<!doctype>/<html>/<head>/<body>, charset and viewport) and list the files to publish."""
import json
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIST = os.path.join(ROOT, "dist-artifact")
html = open(os.path.join(DIST, "index.html"), encoding="utf-8").read()
for pat in [r"<!doctype html>\s*", r"<html[^>]*>\s*", r"</html>\s*", r"<head>\s*", r"</head>\s*", r"<body>\s*", r"</body>\s*",
            r'<meta charset="UTF-8" />\s*', r'<meta name="viewport"[^>]*>\s*', r'<link rel="icon"[^>]*>\s*', r'<meta name="theme-color"[^>]*>\s*']:
    html = re.sub(pat, "", html, flags=re.I)
lines = [l.strip() for l in html.splitlines() if l.strip()]
# title first (the host scans the first 8KB for it)
lines.sort(key=lambda l: 0 if l.startswith("<title>") else 1)
page = "\n".join(lines) + "\n"
open(os.path.join(DIST, "artifact-page.html"), "w", encoding="utf-8").write(page)
files = {}
for dp, dn, fn in os.walk(DIST):
    for f in fn:
        full = os.path.join(dp, f)
        rel = os.path.relpath(full, DIST).replace(os.sep, "/")
        if rel in ("index.html", "artifact-page.html") or rel.endswith(".pdf"):
            continue
        files[rel] = os.path.relpath(full, os.path.dirname(ROOT)).replace(os.sep, "/")
json.dump(files, open(os.path.join(DIST, "artifact-files.json"), "w"), indent=1, sort_keys=True)
print(page)
print(len(files), "files,", round(sum(os.path.getsize(os.path.join(DIST, k)) for k in files) / 1e6, 2), "MB")
