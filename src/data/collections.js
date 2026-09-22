// 专题策展：编辑精选的阅读路线，顺序即推荐阅读顺序。
// entries 里的 id 必须已存在（validate:data 会校验），note 是一句话导读。
export const collections = [
  {
    id: 'silk-road-route',
    name: '丝绸之路',
    kicker: '从长安到罗马',
    summary: '一条路，八段故事：凿路的人、走路的商队、两端的帝国。',
    entries: [
      { id: 'zhang-qian', note: '起点：被俘十年不忘使命，凿空西域的人。' },
      { id: 'han-wudi', note: '推手：把帝国的目光推向西域的皇帝。' },
      { id: 'silk-road', note: '路本身：商队、宗教与技术共用的网络。' },
      { id: 'changan-city', note: '东端：世界中心的长安城。' },
      { id: 'tang', note: '高峰：丝路最繁华的时代。' },
      { id: 'xuanzang', note: '逆行者：向西求法十七年的和尚。' },
      { id: 'roman-empire', note: '西端：知道中国存在、却从未见过的罗马。' },
      { id: 'marco-polo', note: '尾声：陆上丝路最后的见证人。' },
    ],
  },
  {
    id: 'age-of-sail',
    name: '大航海时代',
    kicker: '风帆把世界连起来',
    summary: '宝船与卡拉维尔船相向而行，世界从此没有“外面”。',
    entries: [
      { id: 'zhenghe-shipyard', note: '中国的答案：能装两千人的宝船。' },
      { id: 'zheng-he', note: '七下西洋的人。' },
      { id: 'voyages-of-zhenghe', note: '事件：持续 28 年的官方远航。' },
      { id: 'columbus-voyage', note: '另一端：哥伦布大交换重塑两大陆。' },
      { id: 'columbus', note: '想找中国、找到美洲的人。' },
      { id: 'inca-empire', note: '被撞见的帝国：安第斯的另一端。' },
      { id: 'american-independence', note: '三百年后：新大陆自己当家。' },
    ],
  },
  {
    id: 'paper-words',
    name: '纸与字',
    kicker: '知识如何变便宜',
    summary: '从蔡伦的麻纸到古腾堡的铅字：信息成本下降的千年青史。',
    entries: [
      { id: 'cai-lun', note: '造纸的人。' },
      { id: 'paper-invention', note: '纸向西走：改变世界的缓慢扩散。' },
      { id: 'phoenician-alphabet', note: '字母：二十二个符号装下一种语言。' },
      { id: 'dunhuang-library-cave', note: '藏经洞：纸上的千年图书馆。' },
      { id: 'movable-type', note: '活字：印得更快。' },
      { id: 'gutenberg', note: '古腾堡：欧洲的引爆点。' },
      { id: 'liberty-bell-press', note: '四十二行圣经：第一本书。' },
      { id: 'hangul-letter', note: '为百姓造的字：谚文。' },
    ],
  },
  {
    id: 'steppe-empires',
    name: '草原与帝国',
    kicker: '马蹄声里的三千年',
    summary: '长城内外：防守、反击与融合，农耕与游牧的漫长对峙。',
    entries: [
      { id: 'qin-han', note: '第一次直面草原的大一统王朝。' },
      { id: 'great-wall', note: '长城：农耕文明的边界。' },
      { id: 'han-wudi', note: '反击：把匈奴赶出漠南。' },
      { id: 'genghis-khan', note: '草原的答案：把游牧变成世界帝国的人。' },
      { id: 'mongol-empire', note: '最大的陆上帝国。' },
      { id: 'yuan', note: '入主中原的一百年。' },
      { id: 'ming', note: '把蒙古赶回草原，又修了一遍长城。' },
    ],
  },
  {
    id: 'indian-ocean',
    name: '印度洋世界',
    kicker: '季风上的贸易圈',
    summary: '不靠帝国、靠季风连起来的海：香料、瓷器与信仰同船。',
    entries: [
      { id: 'chola-ocean-trade', note: '朱罗的舰队：印度洋上的执剑人。' },
      { id: 'srivijaya', note: '三佛齐：守住马六甲的港市联盟。' },
      { id: 'angkor-wat', note: '吴哥：贸易养出的神庙之城。' },
      { id: 'borobudur', note: '婆罗浮屠：海路传来的佛。' },
      { id: 'ibn-battuta', note: '走遍印度洋的人。' },
      { id: 'zheng-he', note: '宝船也到过这里。' },
      { id: 'mughal-empire', note: '陆上帝国，海上也分一杯羹。' },
    ],
  },
]

export const collectionById = Object.fromEntries(collections.map((c) => [c.id, c]))
