#!/bin/sh
# Builds every replica and the gallery wrapper into site/ for one static deploy.
set -eu
cd "$(dirname "$0")/.."
rm -rf site && mkdir site
cp gallery/index.html site/index.html
cat > site/vercel.json <<'JSON'
{ "headers": [{ "source": "/(.*)", "headers": [{ "key": "X-Robots-Tag", "value": "noindex, nofollow" }] }] }
JSON
for dir in replicas/*/; do
  name=$(basename "$dir")
  echo "Building $name"
  (cd "$dir" && npm ci --silent && npm run build --silent >/dev/null)
  cp -R "$dir/dist" "site/$name"
done
