#!/usr/bin/env python3
# 用法: python3 tools/deepen-append.py <dir>
# 把 <dir>/<id>.txt 新条目追加到对应数据文件（按 category 路由），校验 id 唯一与数组终止符。
# chunk 格式与 deepen 相同：首行 "    id: 'xxx',"，末行 "  },"，不含入口括号（脚本负责补）。
import pathlib, re, sys
root = pathlib.Path('/home/w/projects/guanshi')
src = pathlib.Path(sys.argv[1])
filemap = {'civilization': 'civilizations', 'figure': 'figures', 'artifact': 'artifacts', 'event': 'events'}
added, skipped, bad = [], [], []
for cf in sorted(src.glob('*.txt')):
    chunk = cf.read_text(encoding='utf-8').strip()
    m = re.search(r"id: '([^']+)'", chunk)
    c = re.search(r"category: '([^']+)'", chunk)
    if not (chunk.startswith("    id: '") and chunk.endswith('  },') and m and c):
        bad.append(cf.name)
        continue
    eid, fname = m.group(1), filemap.get(c.group(1))
    if not fname:
        bad.append(eid + ':cat')
        continue
    p = root / f'src/data/{fname}.js'
    text = p.read_text(encoding='utf-8')
    if re.search(r"id: '" + re.escape(eid) + r"'", text):
        skipped.append(eid)
        continue
    if not text.rstrip().endswith('];'):
        raise SystemExit(f'ABORT: {fname} terminator missing before append of {eid}')
    idx = text.rstrip().rfind('\n];')
    new = text[:idx].rstrip('\n') + '\n  {\n' + chunk + '\n];\n'
    p.write_text(new, encoding='utf-8')
    added.append(f'{fname}:{eid}')
print('appended', len(added), '| dup-skip', len(skipped), '| bad', bad or '-')
for a in added:
    print(' +', a)
