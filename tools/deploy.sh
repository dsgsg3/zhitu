#!/bin/bash
# 构建并部署到 Cloudflare Pages（项目 guanshi，直传 dist，不走 git 集成）
# 音频与图片不入 git，但会随 dist 一起上传。用法：bash tools/deploy.sh [--no-build]
set -e
cd "$(dirname "$0")/.."
WR=$(command -v wrangler || true)
[ -n "$WR" ] || WR=~/projects/QPet/node_modules/.bin/wrangler
[ "$1" = "--no-build" ] || npm run build
echo "=== 部署 dist（$(du -sh dist | cut -f1)，请稍候）==="
"$WR" pages deploy dist --project-name=guanshi --branch=main --commit-dirty=true 2>&1 | tail -6
echo DEPLOY-DONE
