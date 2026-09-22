# 观史 · 把五千年历史握在手里

一个手机端优先的历史探索站点。文明、人物、文物、事件四类档案铺成一张可以漫游的时间地图。

- **首页**：年轮式入口，九个时间点直接跳进对应历史；足迹区显示探索进度与收藏（localStorage，不登录）
- **时间轴**：可左右拖动的 SVG 长河，覆盖公元前 3500 年至公元 2050 年（节点键盘可达）
- **档案库**：分类 / 年代 / 地域三维组合筛选，关键词走统一搜索（含拼音）
- **详情**：正文 + 关键事实 + 关联历史 + 同期世界（锚点年份前后 120 年）+ 参考出处 + 收藏
- **专题**：编辑精选的阅读路线（`/collections`），顺序即推荐阅读顺序

## 技术栈

Vite 6 + React 18 + react-router-dom 7，纯静态，无后端。全部内容来自 `src/data/*.js` 的静态导出，共 **192 条**档案（`npm run validate:data` 可随时核对）。

## 运行

```bash
npm install
npm run dev            # 开发服务器
npm run build          # 产出 dist/
npm run preview        # 本地预览构建产物（带 SPA fallback）
npm run validate:data  # 校验档案数据（加数据前后必跑）
npm run sitemap -- https://your-domain  # 公网部署后生成 dist/sitemap.xml
```

## 部署注意

项目使用 `BrowserRouter`（URL 形如 `/timeline`、`/entity/tang`），**托管时必须配置 SPA fallback**，否则在非根路径刷新会 404。同时 `vite.config.js` 的 `base` 必须保持 `/`——`./` 会导致二级路由（如 `/entity/tang`）下静态资源解析成 `/entity/assets/…` 而白屏。

### 部署到 WSL（当前方式）

仓库直接放在 WSL 原生目录（`~/projects/guanshi`），开发与部署都在同一侧，不再需要 Windows 侧：

```bash
cd ~/projects/guanshi
npm install          # 首次：只需装 Linux 平台依赖
npm run dev          # 开发服务器（Windows 浏览器同样访问 localhost）
npm run build        # 产出 dist/
python3 tools/spa_server.py 5173 dist   # 前台运行；后台则加 setsid nohup
```

`tools/spa_server.py` 是一个带 SPA fallback 的零依赖静态服务器：命中真实文件原样返回，其余路径回退 `index.html`，`/assets/` 长缓存、首页不缓存。

访问 <http://localhost:5173>。停止服务：`pgrep -f "spa_server\.py 5173" | grep -v $$ | xargs -r kill`（直接 `pkill -f` 会误杀发起命令自身的 shell）。

### 其他托管方式

- nginx：`try_files $uri $uri/ /index.html;`
- 任意静态服务器：`npx serve -s dist`
- 若托管环境不支持 rewrite（如纯对象存储静态托管），把 `src/main.jsx` 的 `BrowserRouter` 换成 `HashRouter` 即可，此时 `base` 改回 `./`。

## 目录

```
index.html                 页面骨架与字体
src/main.jsx               入口，挂载 Router 与全局样式
src/App.jsx                路由表
src/data/
  taxonomy.js              年代 / 分类 / 地域三套枚举 + 年份格式化
  schema.js                实体字段说明（注释）
  civilizations.js         文明 · 国家
  figures.js               人物
  artifacts.js             文物 · 建筑
  events.js                事件
  index.js                 汇总导出 ALL / byId / search(+拼音) / sameEra
  collections.js           专题策展（路线顺序 + 每段导读）
src/store.js               足迹与收藏（localStorage + useSyncExternalStore）
src/pages/                 Home / Timeline / Browse / Detail / NotFound(404) / Collections / Collection
src/components/            Header(含搜索) / Footer / EntityCard / ScrollToTop / SkylineSilhouette
src/styles/                global / home / timeline / browse / detail
```

## 数据规范

新增一条档案，往对应分类文件里追加一个对象即可（字段见 `src/data/schema.js`）：

```js
{
  id: 'tang',                 // 唯一标识，决定路由 /entity/tang
  category: 'civilization',   // civilization | figure | artifact | event
  name: '唐',
  foreign: 'Tang Dynasty',    // 外文名，可选
  region: 'china',            // 取 taxonomy.js 的 REGIONS key
  year: 618,                  // 锚点年份，负数 = 公元前
  range: [618, 907],          // 存续区间，可选
  kicker: '世界的中心',        // 一句话标签
  summary: '……',              // 列表摘要，约 40 字
  paragraphs: ['……'],         // 正文，一段一条
  facts: [{ label, value }],  // 关键事实卡
  related: ['changan-city'],  // 关联实体 id，必须真实存在
  sources: [{ label: '维基百科', url: 'https://zh.wikipedia.org/wiki/唐朝' }], // 出处，建议至少一条
  image: {                   // 配图，可选（Wikimedia Commons 热链，须署名）
    src: 'https://…/960px-….jpg',
    page: 'https://commons.wikimedia.org/wiki/File:…',
    author: '……', license: 'CC BY-SA 4.0',
  },
  quote: '……', quoteBy: '……', // 点睛引文，可选
}
```

四条约定：

1. `related` 里的 id **必须已存在**，否则校验报错（`npm run validate:data`）。
2. `id` 用小写短横线命名，不要带 `-placeholder`、`-figure` 之类后缀。
3. 配图只用 Wikimedia Commons 的自由版权图片（Public domain / CC0 / CC BY / CC BY-SA），`author` + `license` 照文件页原样填；批量找图可用 `node tools/fetch-images.mjs` 取候选（须人工审核许可证）。
4. `sources` 尽量给精确词条直链，拿不准的用 `https://zh.wikipedia.org/w/index.php?search=关键词` 检索链接；缺省时详情页会自动兜底一条检索链接。

新增 / 改动档案后必须跑通 `npm run validate:data`（id 唯一、`related` 有出处、`sources` 格式合法）。

年代分期为世界通史口径（上古 / 古典 / 中古 / 近代 / 现代 / 当代），不按中国王朝切分——否则罗马帝国会被算进「先秦」。分期定义见 `taxonomy.js` 的 `ERAS`。地域含大洋洲（东南亚暂归 `east-asia`）。

搜索走 `src/data/index.js` 的统一匹配（名字 > 外文名 > 标签 > 摘要 > 正文，支持拼音/首字母），档案库筛选与顶栏搜索共用同一逻辑。
