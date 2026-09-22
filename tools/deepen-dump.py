#!/usr/bin/env python3
# 用法: python3 tools/deepen-dump.py <out-dir> <id...>
# 把指定条目的当前 chunk 导出为 <out-dir>/current.json，并生成 <out-dir>/all-ids.json 白名单
import pathlib, re, json, sys
root = pathlib.Path('/home/w/projects/guanshi')
out = pathlib.Path(sys.argv[1])
want = sys.argv[2:]
out.mkdir(parents=True, exist_ok=True)
data = {f: (root / f'src/data/{f}.js').read_text(encoding='utf-8')
        for f in ['civilizations', 'figures', 'artifacts', 'events']}
all_ids = {}
cur = {}
for fname, text in data.items():
    parts = re.split(r'(\n  \{\n)', text)
    for i in range(2, len(parts), 2):
        m = re.search(r"id: '([^']+)'", parts[i])
        if m:
            all_ids[m.group(1)] = fname
            if m.group(1) in want:
                cur[m.group(1)] = parts[i]
(out / 'current.json').write_text(json.dumps(cur, ensure_ascii=False, indent=1), encoding='utf-8')
(out / 'all-ids.json').write_text(json.dumps(sorted(all_ids), ensure_ascii=False, indent=0), encoding='utf-8')
missing = [w for w in want if w not in cur]
print('dumped', len(cur), '/', len(want), 'missing:', missing or '-')
