#!/usr/bin/env python3
"""观史 · 带 SPA fallback 的静态服务器（用于 WSL/任意 Linux 部署）

用法:
    python3 tools/spa_server.py [port] [root]
示例:
    python3 tools/spa_server.py 5173 dist

行为:
  - 命中真实文件（assets、图标等）时按原样返回
  - 其余路径一律回退到 index.html，交给 BrowserRouter 在浏览器侧处理
"""
import os
import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 5173
ROOT = os.path.abspath(sys.argv[2] if len(sys.argv) > 2 else "dist")


class SPAHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def send_head(self):  # noqa: N802
        path = self.translate_path(self.path.split("?", 1)[0].split("#", 1)[0])
        if not os.path.exists(path):
            self.path = "/index.html"
        return super().send_head()

    def end_headers(self):
        if self.path.startswith("/assets/"):
            self.send_header("Cache-Control", "public, max-age=31536000, immutable")
        else:
            self.send_header("Cache-Control", "no-cache")
        super().end_headers()

    def log_message(self, fmt, *args):
        sys.stderr.write("[guanshi] %s\n" % (fmt % args))


if __name__ == "__main__":
    if not os.path.isfile(os.path.join(ROOT, "index.html")):
        sys.exit(f"找不到 {ROOT}/index.html，请先运行 npm run build")
    server = ThreadingHTTPServer(("0.0.0.0", PORT), SPAHandler)
    print(f"观史已启动: http://0.0.0.0:{PORT}  (root={ROOT})", flush=True)
    server.serve_forever()
