#!/usr/bin/env python3
# 用法: python3 tools/deepen-swap.py <dir>   （dir 内每个 <id>.txt 是一个完整条目 chunk）
# 按 id 定位条目并整块替换；内容与现文件一致时跳过（幂等）。
import pathlib, re, sys
root = pathlib.Path('/home/w/projects/guanshi')
swap_dir = pathlib.Path(sys.argv[1])
files = {f: (root / f'src/data/{f}.js').read_text(encoding='utf-8')
         for f in ['civilizations', 'figures', 'artifacts', 'events']}
swapped, skipped, unknown = [], [], []
for cf in sorted(swap_dir.glob('*.txt')):
    chunk = cf.read_text(encoding='utf-8')
    m = re.search(r"id: '([^']+)'", chunk)
    if not m:
        unknown.append(cf.name); continue
    eid = m.group(1)
    done = False
    for fname in files:
        text = files[fname]
        parts = re.split(r'(\n  \{\n)', text)
        for i in range(2, len(parts), 2):
            if re.search(r"id: '" + re.escape(eid) + r"'", parts[i]):
                if parts[i] != chunk:
                    parts[i] = chunk
                    files[fname] = ''.join(parts)
                    swapped.append(f'{fname}:{eid}')
                else:
                    skipped.append(eid)
                done = True
                break
        if done:
            break
    if not done:
        unknown.append(eid)
for fname, text in files.items():
    (root / f'src/data/{fname}.js').write_text(text, encoding='utf-8')
print('swapped', len(swapped), '| skipped(same)', len(skipped), '| unknown', unknown or '-')
for s in swapped:
    print(' -', s)
