#!/usr/bin/env bash
# Bumps the ?v= cache-bust query on EVERY asset reference across HTML, CSS, and JS.
# Covers: href/src/data-img attributes, inline style url(...), CSS url(...), JS string literals.
# Run this BEFORE every deploy.
set -e
cd "$(dirname "$0")"
NEW_V=$(date +%s)
echo "Bumping cache-bust version to: $NEW_V"

# Asset extensions to cache-bust
EXTS='(png|jpg|jpeg|webp|svg|gif|ico|css|js|woff2?|ttf)'

bust_file() {
  local f="$1"
  # 1) Replace existing ?v=<digits> with new timestamp
  sed -i -E "s#\?v=[0-9]+#?v=${NEW_V}#g" "$f"
  # 2) Add ?v= to href/src/data-img attribute values (only if no ?v= present)
  sed -i -E "s#(href|src|data-img)=\"([^\"?]+\.${EXTS})\"#\1=\"\2?v=${NEW_V}\"#g" "$f"
  sed -i -E "s#(href|src|data-img)='([^'?]+\.${EXTS})'#\1='\2?v=${NEW_V}'#g" "$f"
  # 3) Add ?v= to url(...) references (inline style + CSS)
  sed -i -E "s#url\(\"([^\"?]+\.${EXTS})\"\)#url(\"\1?v=${NEW_V}\")#g" "$f"
  sed -i -E "s#url\('([^'?]+\.${EXTS})'\)#url('\1?v=${NEW_V}')#g" "$f"
  sed -i -E "s#url\(([^)'\"?]+\.${EXTS})\)#url(\1?v=${NEW_V})#g" "$f"
}

# HTML pages (root + all subfolders one and two levels deep)
for f in *.html */index.html */*/index.html; do
  [ -f "$f" ] || continue
  bust_file "$f"
done

# CSS files
for f in *.css; do
  [ -f "$f" ] || continue
  bust_file "$f"
done

# JS asset string literals
for f in *.js; do
  [ -f "$f" ] || continue
  sed -i -E "s#\?v=[0-9]+#?v=${NEW_V}#g" "$f"
  sed -i -E "s#'(assets/[^'?]+\.${EXTS})'#'\1?v=${NEW_V}'#g" "$f"
  sed -i -E "s#\"(assets/[^\"?]+\.${EXTS})\"#\"\1?v=${NEW_V}\"#g" "$f"
done

echo "Updated files:"
grep -l "?v=${NEW_V}" *.html *.css *.js 2>/dev/null
