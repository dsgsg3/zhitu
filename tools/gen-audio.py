#!/usr/bin/env python3
# 预生成全站朗读音频：public/audio/<id>.mp3（可断点续跑）
# 由 tools/audio-gen-task.sh 每日两次调用（Windows 计划任务 GuanshiAudioGen-Day / -Night）。
# 只允许单实例运行：上一轮没跑完时新一轮直接退出，避免两个进程抢写同一批分段文件。
import fcntl, os, pathlib, re, subprocess, sys, time

root = pathlib.Path(__file__).resolve().parent.parent
outdir = root / 'public/audio'
outdir.mkdir(parents=True, exist_ok=True)
TTS = os.environ.get('GUANSHI_TTS_URL', 'https://guanshi-tts.fanzhibao68.workers.dev/tts?voice=mimo_default')
LOG = open('/tmp/gen-audio.log', 'a', encoding='utf-8')
SLOW = (root / 'tools/.gen-slow').exists()

def log(s):
    line = time.strftime('[%F %T] ') + s
    print(line, flush=True)
    LOG.write(line + '\n')
    LOG.flush()

# 0) 单实例锁
lock = open('/tmp/guanshi-gen-audio.lock', 'w')
try:
    fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
except BlockingIOError:
    log('ALREADY-RUNNING 另一个生成进程仍在运行，本轮跳过')
    sys.exit(0)

# 1) 汇总全部条目的朗读文本（与前端 speakEntry 完全一致）
entries = []
for f in ['civilizations', 'figures', 'artifacts', 'events']:
    t = (root / 'src/data' / (f + '.js')).read_text(encoding='utf-8')
    parts = re.split(r'(\n  \{\n)', t)
    for i in range(2, len(parts), 2):
        chunk = parts[i]
        m = re.search(r"id: '([^']+)'", chunk)
        if not m: continue
        eid = m.group(1)
        name = re.search(r"name: '([^']*)'", chunk)
        summary = re.search(r"summary: '([^']*)'", chunk)
        paras = re.findall(r"^\s+'(.*)',$", chunk, re.M)
        secs_blocks = re.findall(r"heading: '([^']*)',\s*paragraphs: \[([^\]]*)\]", chunk, re.S)
        sec_text = ''
        for h, pp in secs_blocks:
            sec_text += h + '。' + ''.join(re.findall(r"'([^']*)'", pp))
        text = (name.group(1) if name else '') + '。' + (summary.group(1) if summary else '') + '。' + ''.join(paras) + ' ' + sec_text
        entries.append((eid, re.sub(r"\s+", ' ', text).strip()))

log('entries: ' + str(len(entries)) + (' (slow mode)' if SLOW else ''))

# 2) 逐条合成
ok = fail = skipped = 0
shard_total = int(os.environ.get('GEN_SHARD_TOTAL', '1'))
shard_idx = int(os.environ.get('GEN_SHARD_IDX', '0'))
per = (len(entries) + shard_total - 1) // shard_total
entries = entries[shard_idx * per:(shard_idx + 1) * per]
log('shard ' + str(shard_idx) + '/' + str(shard_total) + ' entries: ' + str(len(entries)))

def clean_parts(eid):
    for f_ in outdir.glob(eid + '.p*.mp3'):
        f_.unlink()

for idx, (eid, text) in enumerate(entries):
    dest = outdir / (eid + '.mp3')
    if dest.exists() and dest.stat().st_size > 5000:
        skipped += 1
        continue
    if dest.exists():
        dest.unlink()          # 残缺文件（≤5KB）删掉重生成
    clean_parts(eid)           # 清掉上次中断留下的分段
    # 分段 ≤600 字
    marked = re.sub(r'([。！？!?；;])', '\\1\u0001', text)
    sents = [s.strip() for s in marked.split('\u0001') if s.strip()]
    parts, buf = [], ''
    for s in sents:
        if len(buf + s) > 600:
            if buf: parts.append(buf)
            buf = s
        else:
            buf += s
    if buf: parts.append(buf)
    if not parts:
        fail += 1
        log('SKIP-EMPTY ' + eid)
        continue
    # 合成各段
    ok_parts = []
    bad = False
    for pi, part in enumerate(parts):
        partfile = outdir / (eid + '.p' + str(pi) + '.mp3')
        for attempt in range(1, 4):
            r = subprocess.run(['curl', '-sL', '--max-time', '180', '-X', 'POST',
                                '-H', 'Content-Type: text/plain', '--data-binary', part,
                                '-o', str(partfile), TTS])
            size = partfile.stat().st_size if partfile.exists() else 0
            if r.returncode == 0 and size > 2000:
                ok_parts.append(partfile)
                break
            log('RETRY ' + eid + ' p' + str(pi) + ' attempt ' + str(attempt))
            time.sleep(20)
        else:
            bad = True
            log('FAIL ' + eid + ' part ' + str(pi))
            break
        time.sleep(30 if SLOW else 2.5)
    if bad:
        fail += 1
        log('FAIL ' + eid)
        clean_parts(eid)
        continue
    # 拼接 MP3：先写临时文件再原子改名，中断不会留下可被线上读到的残缺 mp3
    tmp = outdir / (eid + '.mp3.tmp')
    with open(tmp, 'wb') as o:
        for f_ in ok_parts:
            o.write(f_.read_bytes())
    os.replace(tmp, dest)
    clean_parts(eid)
    ok += 1
    log('DONE ' + eid + ' parts=' + str(len(ok_parts)) + ' ' + ('%.0fKB' % (dest.stat().st_size / 1024)))
    time.sleep(8 if SLOW else 1.5)

log('GEN-AUDIO-PASS-DONE ok=' + str(ok) + ' fail=' + str(fail) + ' skipped=' + str(skipped))
