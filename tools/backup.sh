#!/bin/bash
# 观史自动备份：数据每日（git bundle + JSON 快照），图片每周日全量
set -e
ROOT="$HOME/projects/guanshi"
DEST_ROOT="/mnt/d/backups/guanshi"
[ -d /mnt/d ] || DEST_ROOT="/mnt/c/Users/W/Backups/guanshi"
DAILY="$DEST_ROOT/daily"
WEEKLY="$DEST_ROOT/weekly-images"
mkdir -p "$DAILY" "$WEEKLY"
STAMP=$(date +%Y%m%d-%H%M)
cd "$ROOT"
# 1) git bundle：完整仓库历史单文件
git bundle create "$DAILY/guanshi-code-$STAMP.bundle" --all 2>/dev/null
# 2) 数据 JSON 快照（人类可读的安全网）
node --input-type=module -e "
const m = await import('$ROOT/src/data/index.js');
const fs = await import('fs');
fs.writeFileSync('$DAILY/guanshi-data-$STAMP.json', JSON.stringify(m.ALL, null, 1));
" 2>/dev/null || cp -r src/data "$DAILY/data-$STAMP"
# 3) 周日：图片全量（151MB）
if [ "$(date +%u)" = "7" ] || [ "$1" = "--with-images" ]; then
  tar cf "$WEEKLY/images-$STAMP.tar" -C "$ROOT/public" images
  ls -t "$WEEKLY"/images-*.tar 2>/dev/null | tail -n +3 | xargs -r rm -f
fi
# 4) 只保留最近 14 份每日备份
ls -t "$DAILY"/guanshi-*.bundle 2>/dev/null | tail -n +15 | xargs -r rm -f
ls -t "$DAILY"/guanshi-data-*.json 2>/dev/null | tail -n +15 | xargs -r rm -f
echo "[$(date '+%F %T')] 备份完成 → $DAILY"
ls -lt "$DAILY" | head -4
