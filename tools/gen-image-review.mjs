// 生成 image-review.html：全站配图人工审查页（自包含，双击即开）
// 用法: node tools/gen-image-review.mjs
import fs from 'node:fs'
import { ALL } from '../src/data/index.js'
import { formatYear } from '../src/data/taxonomy.js'

const items = ALL.map((e) => ({
  id: e.id,
  name: e.name,
  foreign: e.foreign || '',
  category: e.category,
  year: e.year,
  label: formatYear(e.year),
  kicker: e.kicker || '',
  src: e.image?.src || '',
  page: e.image?.page || '',
  author: e.image?.author || '',
  license: e.image?.license || '',
}))

const html = `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>观史 · 配图审查</title>
<style>
  :root { --bg:#f7f4ee; --ink:#1b1a17; --faint:#8a857a; --line:#e2ddd2; --red:#c0392b; --gold:#a8842c; }
  * { box-sizing:border-box; margin:0; }
  body { background:var(--bg); color:var(--ink); font:14px/1.5 -apple-system,'PingFang SC','Microsoft YaHei',sans-serif; }
  header { position:sticky; top:0; z-index:9; background:rgba(247,244,238,.96); border-bottom:1px solid var(--line); padding:10px 14px; }
  header h1 { font-size:16px; font-family:Georgia,'Songti SC',serif; }
  .bar { display:flex; flex-wrap:wrap; gap:8px; margin-top:8px; align-items:center; }
  .chip { border:1px solid var(--line); background:#fff; border-radius:999px; padding:4px 12px; cursor:pointer; font-size:12px; }
  .chip.on { background:var(--ink); color:#fff; border-color:var(--ink); }
  .stat { font-size:12px; color:var(--faint); margin-left:auto; }
  button.act { border:1px solid var(--gold); color:var(--gold); background:#fff; border-radius:8px; padding:5px 12px; cursor:pointer; font-size:12px; }
  .grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(210px,1fr)); gap:12px; padding:14px; }
  .card { background:#fff; border:1px solid var(--line); border-radius:10px; overflow:hidden; cursor:pointer; position:relative; }
  .card img { width:100%; height:140px; object-fit:cover; display:block; background:#eee; }
  .card .meta { padding:8px 10px; font-size:12px; }
  .card .meta b { display:block; font-size:14px; }
  .card .meta small { color:var(--faint); display:block; margin-top:2px; }
  .card .cat { position:absolute; top:8px; left:8px; background:rgba(0,0,0,.55); color:#fff; font-size:10px; padding:2px 8px; border-radius:999px; }
  .card.marked { outline:3px solid var(--red); outline-offset:-3px; }
  .card.marked::after { content:'✕ 问题图'; position:absolute; top:8px; right:8px; background:var(--red); color:#fff; font-size:10px; padding:2px 8px; border-radius:999px; }
  .card.nopic .imgbox { height:140px; display:flex; align-items:center; justify-content:center; color:var(--faint); background:repeating-linear-gradient(45deg,#f2efe8,#f2efe8 12px,#ece8de 12px,#ece8de 24px); }
  .empty-note { padding:40px; text-align:center; color:var(--faint); }
</style>
</head>
<body>
<header>
  <h1>观史 · 配图人工审查 <span style="font-size:11px;color:var(--faint)">单击卡片=标记问题 · 点击图下外链可看原图页</span></h1>
  <div class="bar" id="bar"></div>
</header>
<div class="grid" id="grid"></div>
<script>
const ITEMS = ${JSON.stringify(items)};
const CATS = { civilization:'文明', figure:'人物', artifact:'文物', event:'事件' };
const KEY = 'gs-img-review-v1';
let marked = new Set(JSON.parse(localStorage.getItem(KEY) || '[]'));
let filter = 'all';
const grid = document.getElementById('grid');
const bar = document.getElementById('bar');

function save(){ localStorage.setItem(KEY, JSON.stringify([...marked])); render(); }
function exportMarks(){
  const list = ITEMS.filter(i=>marked.has(i.id)).map(i=>({id:i.id,name:i.name,category:i.category,src:i.src}));
  const text = JSON.stringify(list,null,2);
  navigator.clipboard?.writeText(text);
  const blob = new Blob([text],{type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = 'image-review-marks.json'; a.click();
  alert('已导出 ' + list.length + ' 条标记（同时复制到剪贴板）');
}
function render(){
  const shown = ITEMS.filter(i => filter==='all' || (filter==='marked' ? marked.has(i.id) : i.category===filter));
  grid.innerHTML = shown.map(i => {
    const img = i.src
      ? \`<img loading="lazy" src="\${i.src}" alt="\${i.name}" onerror="this.parentElement.innerHTML='<div class=empty-note>加载失败/死链</div>'">\`
      : \`<div class="imgbox"><div class="empty-note">无图</div></div>\`;
    const page = i.page ? \`<small><a href="\${i.page}" target="_blank" onclick="event.stopPropagation()">commons ↗</a> · \${i.license || '无许可信息'}</small>\` : '<small>无出处</small>';
    return \`<div class="card \${marked.has(i.id)?'marked':''} \${i.src?'':'nopic'}" data-id="\${i.id}">
      <span class="cat">\${CATS[i.category]||i.category}</span>
      \${img}
      <div class="meta"><b>\${i.name}</b>
        <small>\${i.foreign} · \${i.label} · \${i.id}</small>
        \${i.kicker?\`<small>\${i.kicker}</small>\`:''}
        \${page}
      </div></div>\`;
  }).join('');
  bar.innerHTML =
    ['all:全部','civilization:文明','figure:人物','artifact:文物','event:事件','marked:已标记']
      .map(([k,l]) => \`<button class="chip \${filter===k?'on':''}" data-f="\${k}">\${l}</button>\`).join('') +
    \`<button class="act" id="exp">导出标记（\${marked.size}）</button>
     <button class="act" id="clr">清空标记</button>
     <span class="stat">\${ITEMS.length} 条 · 已标 \${marked.size}</span>\`;
  bar.querySelectorAll('[data-f]').forEach(b => b.onclick = () => { filter = b.dataset.f; render(); });
  document.getElementById('exp').onclick = exportMarks;
  document.getElementById('clr').onclick = () => { if(confirm('清空全部标记？')){ marked.clear(); save(); } };
}
grid.addEventListener('click', (e) => {
  if (e.target.closest('a')) return;
  const card = e.target.closest('.card'); if (!card) return;
  const id = card.dataset.id;
  marked.has(id) ? marked.delete(id) : marked.add(id);
  save();
});
render();
</script>
</body>
</html>`

const dest = new URL('../image-review.html', import.meta.url)
fs.writeFileSync(dest, html)
console.log('image-review.html:', (html.length / 1024).toFixed(1) + 'KB,', items.length, '条')
