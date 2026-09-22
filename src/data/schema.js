// 实体数据结构说明：
// {
//   id: 'tang-dynasty',            // 唯一标识，用于路由 /entity/:id
//   category: 'civilization',      // civilization | figure | artifact | event
//   name: '唐',                    // 展示名
//   foreign: "Tang Dynasty",       // 外文/拉丁名（可选）
//   region: 'china',               // taxonomy REGIONS key
//   year: -221,                    // 锚点年份（负数=公元前），用于时间轴定位
//   range: [-221, 907],            // 存续/生卒区间（可选，事件可省）
//   kicker: '大一统王朝',           // 一句话标签
//   summary: '……',                 // 列表页摘要（60字内）
//   paragraphs: ['……', '……'],     // 详情页正文，每段一段
//   sections: [                    // 深度条目的分节正文（与 paragraphs 二选一或并用）
//     { heading: '生平', paragraphs: ['……'] },
//   ],
//   facts: [ {label, value} ],     // 关键事实卡（可选）
//   related: ['id', ...],          // 关联实体 id（必须已存在，否则校验报错）
//   sources: [                     // 出处与延伸阅读（建议至少一条，可选）
//     { label: '维基百科', url: 'https://zh.wikipedia.org/wiki/唐朝' },
//   ],
//   image: {                        // 配图（可选，Wikimedia Commons，须署名）
//     src: 'https://…/960px-….jpg', // 热链缩略图
//     page: 'https://commons.wikimedia.org/wiki/File:…', // 文件页（署名链接）
//     author: '……', license: 'CC BY-SA 4.0',
//   },
//   quote: '……', quoteBy: '……',   // 点睛引文（可选）
// }
