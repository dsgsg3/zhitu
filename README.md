# 观史 · 把五千年历史握在手里

一个手机端优先的历史探索站点。文明、人物、文物、事件四类档案铺成一张可以漫游的时间地图。

线上地址：<https://guanshi.aijianli.xin>（Cloudflare Pages，项目名 `guanshi`）

- **首页**：年轮式入口，九个时间点直接跳进对应历史；足迹区显示探索进度与收藏（localStorage，不登录）
- **时间轴**：六个时代的「时代长廊」，时代导航 + 垂直时间线
- **档案库**：分类 / 年代 / 地域三维组合筛选，关键词走统一搜索（含拼音）
- **地图 / 地球仪**：2D 世界地图与 3D 地球仪（three.js）上的档案坐标与历史航线动画
- **详情**：正文分节 + 关键事实 + 引文 + 关联历史 + 同期世界（锚点年份前后 120 年）+ 参考出处 + 收藏
- **专题**：编辑精选的阅读路线（`/collections`），顺序即推荐阅读顺序，带本专题阅读进度
- **体验**：夜间模式、阅读进度条、回到顶部、搜索命中高亮、筛选栏吸顶

## 技术栈

Vite 6 + React 18 + react-router-dom 7，纯静态，无后端；地图 d3-geo + world-atlas，地球仪 three.js。
全部内容来自 `src/data/*.js` 的静态导出，共 **508 条**档案（`npm run validate:data` 可随时核对）。

### 数据加载与预渲染

| 场景 | 加载什么 |
|---|---|
| 列表 / 地图 / 时间轴 / 卡片 | `src/data/slim-index.js` 精简索引（构建前自动生成，约 230KB） |
| 直接打开详情页 | 预渲染好的 `entity/<id>.html`，正文已在 HTML 里，另内嵌本篇 JSON，**零数据请求** |
| 站内跳到另一篇 | 只拉 `/data/entity/<id>.json`（几 KB） |
| 顶栏 / 档案库正文搜索 | 才加载全量数据（按分类拆成 4 个 chunk 并行） |

`npm run build` 分三步：客户端构建 → SSR 构建（`src/entry-server.jsx` → `dist-ssr/`）→ `tools/prerender.mjs`
为每篇档案和专题页输出完整 HTML（标题 / 描述 / OG / canonical / JSON-LD / 正文），并生成
`dist/data/entity/*.json`、`dist/sitemap.xml`、`dist/robots.txt`。浏览器端用 `hydrateRoot` 接管预渲染页，
其余路由（首页、时间轴等）仍是普通 SPA。站点地址默认 `https://guanshi.aijianli.xin`，可用 `SITE_URL` 覆盖。

> SSR 注意：组件渲染阶段不要直接读 `window` / `localStorage`；外部状态用 `useSyncExternalStore` 并提供服务端快照
>（参考 `src/store.js`、`src/theme.js`），否则 hydrate 会不一致。

## 运行

仓库放在 WSL 原生目录（`~/projects/guanshi`），开发、构建、部署都在 WSL 里做：

```bash
npm install
npm run dev            # 开发服务器（详情页正文走全量数据回退，无需预渲染）
npm run build          # 产出 dist/（含预渲染页、单篇 JSON、sitemap）
npm run validate:data  # 校验档案数据（加数据前后必跑）
npm run lint:depth     # 深度标准检查（字数 / 小节 / 事实卡 / 引文 / 关联）
bash tools/serve.sh    # 本地预览 dist/：http://localhost:5173（带 SPA fallback 与 .html 美化路由）
bash tools/deploy.sh   # 构建并部署到 Cloudflare Pages（--no-build 跳过构建）
```

部署用的是 WSL 里 Linux 版 wrangler（脚本内置路径），不要用 Windows 全局安装的 wrangler。
推送 GitHub 时两个分支一起推：`git push origin master master:main`。

## 部署注意

- 使用 `BrowserRouter`，托管必须支持 SPA fallback；`vite.config.js` 的 `base` 必须保持 `/`
- 预渲染页是 `entity/<id>.html`，托管需把 `/entity/<id>` 映射到它（Cloudflare Pages 默认如此；
  nginx 用 `try_files $uri $uri.html $uri/ /index.html;`）
- `public/images/` 不入 git（约 100MB），由 `tools/backup.sh` 每周全量备份到 D 盘

## 目录

```
index.html                 页面骨架与字体
src/main.jsx               入口：有预渲染内容则 hydrateRoot，否则 createRoot
src/entry-server.jsx       仅构建期使用的 SSR 入口
src/App.jsx                路由表（页面均为懒加载）
src/data/
  taxonomy.js              年代 / 分类 / 地域三套枚举 + 年份格式化
  schema.js                实体字段说明（注释）
  civilizations.js / figures.js / artifacts.js / events.js   四类档案
  index.js                 汇总导出 ALL / byId / search(+拼音) / sameEra
  slim-index.js            自动生成的精简索引（勿手改）
  useData.js               两级加载：slimIndex / loadEntity（单篇）/ loadData（全量）
  collections.js           专题策展（路线顺序 + 每段导读）
  routes.js                地图 / 地球仪上的历史航线
src/store.js               足迹与收藏（localStorage + useSyncExternalStore）
src/theme.js               夜间模式
src/pages/                 Home / Timeline / Browse / Detail / MapPage / GlobePage / Collections / Collection / NotFound
src/components/            Header(含搜索) / Footer / EntityCard / HistoryMap / HistoryGlobe / ...
src/styles/                各页样式
docs/                      深度写作指南、内容后备清单
tools/                     构建、校验、审计、配图、部署、备份脚本（一次性批次脚本在 tools/archive/）
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
3. 配图只用 Wikimedia Commons 的自由版权图片（Public domain / CC0 / CC BY / CC BY-SA），`author` + `license` 照文件页原样填。新条目可在 JSON 里写 `image_candidate: { file, page, author, license }`，用 `node tools/add-entries.mjs <batch.json>` 一次完成入库与下载配图。
4. `sources` 尽量给精确词条直链，拿不准的用 `https://zh.wikipedia.org/w/index.php?search=关键词` 检索链接；缺省时详情页会自动兜底一条检索链接。

新增 / 改动档案后必须跑通 `npm run validate:data`（id 唯一、`related` 有出处、`sources` 格式合法）。

年代分期为世界通史口径（上古 / 古典 / 中古 / 近代 / 现代 / 当代），不按中国王朝切分——否则罗马帝国会被算进「先秦」。分期定义见 `taxonomy.js` 的 `ERAS`。地域含大洋洲（东南亚暂归 `east-asia`）。

搜索走 `src/data/index.js` 的统一匹配（名字 > 外文名 > 标签 > 摘要 > 正文，支持拼音/首字母），档案库筛选与顶栏搜索共用同一逻辑。
