#!/bin/bash
# 安全重启 5173 预览服务。
# 为什么不用 pkill -f：发起命令自身的 cmdline 也含关键字，会误杀自己，
# 导致“杀了旧服务、新服务没起来”。这里用 [.] 避开自匹配，并落盘日志。
cd "$(dirname "$0")/.." || exit 1
PIDS=$(pgrep -f "spa_server[.]py 5173" || true)
if [ -n "$PIDS" ]; then
  echo "停止旧服务: $PIDS"
  kill $PIDS
  sleep 1
fi
setsid nohup python3 tools/spa_server.py 5173 dist > server.log 2>&1 < /dev/null &
sleep 1
curl -s -o /dev/null -w "5173 -> %{http_code}\n" --max-time 5 http://localhost:5173/
