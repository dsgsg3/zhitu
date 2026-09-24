#!/bin/bash
# 构建并部署到 Cloudflare Pages（项目 guanshi，直传 dist，不走 git 集成）
# 用法：bash tools/deploy.sh [--no-build]
set -eo pipefail
cd "$(dirname "$0")/.."
# 必须用 Linux 版 wrangler：PATH 里可能先命中 Windows 全局安装（/mnt/c/...），其 workerd 原生包在 WSL 下无法运行
WR=~/projects/QPet/node_modules/.bin/wrangler
if [ ! -x "$WR" ]; then
  WR=$(type -ap wrangler | grep -v '^/mnt/' | head -1 || true)
fi
[ -n "$WR" ] || { echo '找不到 Linux 版 wrangler：在 WSL 里执行 npm i -g wrangler'; exit 1; }
[ "$1" = "--no-build" ] || npm run build
echo "=== 部署 dist（$(du -sh dist | cut -f1)，请稍候）==="
"$WR" pages deploy dist --project-name=guanshi --branch=main --commit-dirty=true 2>&1 | tail -6
echo DEPLOY-DONE
