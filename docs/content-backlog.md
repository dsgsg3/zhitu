# 内容后备清单（docs/content-backlog.md）

> 记录已识别的内容缺口与候选条目。加入前先 `grep "id: '" src/data/*.js` 确认不与现有条目重复。
> 年代分布现状（2026-09-22）：上古 21 · 古典 54 · 中古 60 · 近代 45 · 现代 41 · **当代 5（已补 4 → 9）**

## 当代（最缺，优先）

| 候选 id | 名称 | 年 | 一句话理由 | 维基目标 |
|---|---|---|---|---|
| ~~september-11~~ | ✅ 已加 | 2001 | — | — |
| ~~global-financial-crisis~~ | ✅ 已加 | 2008 | — | — |
| ~~covid-pandemic~~ | ✅ 已加 | 2020 | — | — |
| ~~ai-era~~ | ✅ 已加 | 2016 | — | — |
| world-wide-web | 万维网诞生 | 1991 | 信息时代的底座（归现代 1991<2000） | First website / CERN |
| chernobyl-disaster | 切尔诺贝利 | 1986 | 核时代的信任危机 | Chernobyl disaster |
| hong-kong-handover | 香港回归 | 1997 | 中国与殖民史的交汇点 | 1997 香港回归 |
| eu-founding | 欧盟成立 | 1993 | 主权国家让渡主权的实验 | Maastricht Treaty |
| chang'e-4 | 嫦娥四号月背着陆 | 2019 | 人类首次月背软着陆 | Chang'e 4 |
| crispr-era | CRISPR 基因编辑 | 2012 | 改写生命代码的工具 | CRISPR |
| wikipedia-launch | 维基百科 | 2001 | 人类协作知识工程 | History of Wikipedia |

## 上古（次缺）

| 候选 id | 名称 | 年 | 一句话理由 | 维基目标 |
|---|---|---|---|---|
| ~~western-zhou-founding~~ | ✅ 已加 | -1046 | — | — |
| phoenician-alphabet | ⚠️ 已存在 | -1050 | 原档案已有，勿重复添加 | — |
| assyrian-empire | 亚述帝国 | -911 | 第一个真正的军事帝国 | Neo-Assyrian Empire |
| ramesses-ii | 拉美西斯二世 | -1303 | 与摩西传说绑定的法老（人物） | Ramesses II |
| iron-age-revolution | 铁器革命 | -1200 | 平民武装改变战争与政治 | Iron Age |
| kingdom-of-israel | 以色列联合王国 | -1000 | 一神教的摇篮 | Kingdom of Israel |
| indus-decline | 印河流域文明衰亡 | -1900 | 气候变化亡国的古代样本 | Indus Valley Civilisation |
| laping/catalhoyuk | 加泰土丘 | -7000 | 最早的城市生活实验（更早于两河） | Çatalhöyük |

## 提醒

- 新条目 related 必须引用已存在 id；插入后 `npm run validate:data` 必须通过
- 配图走既有管线：仿照 `tools/fetch-batch5.mjs` 生成批次 JSON → `node tools/apply-images.mjs <file>`
- 人物条目注意 gender 中性表述；当代条目注意措辞中性、多来源

## 第六批已加（2026-09-24）

用 `node tools/add-entries.mjs <batch.json>` 入库（含配图下载）：

- 上古：ramesses-ii 拉美西斯二世 · bronze-age-collapse 青铜时代崩溃 · mohenjo-daro 摩亨佐-达罗 · erlitou 二里头遗址
- 当代：chang-e-4 嫦娥四号月背着陆 · higgs-boson 希格斯玻色子的发现 · euro-launch 欧元现钞流通 · three-gorges-dam 三峡大坝

年代分布：上古 49 · 古典 86 · 中古 133 · 近代 116 · 现代 108 · 当代 16（共 508）。当代仍最缺。
