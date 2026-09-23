// 用法: node tools/find-missing-img.mjs — 数据引用但磁盘不存在的图片
import { existsSync } from 'node:fs'
import { ALL } from '../src/data/index.js'

for (const e of ALL) {
  if (e.image?.src?.startsWith('/images/')) {
    if (!existsSync(new URL('../public' + e.image.src, import.meta.url))) {
      console.log('缺文件:', e.id, e.image.src)
    }
  } else if (!e.image) {
    console.log('无图:', e.id)
  }
}
console.log('检查结束')
