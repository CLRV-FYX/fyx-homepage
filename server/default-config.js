// 站点默认配置 —— 后台可修改，存于 server/data/db.json
export const defaultConfig = {
  site: {
    name: 'FYX',
    slogan: 'GAME · MUSIC · LIFE',
    favicon: '🎮',
  },
  copy: {},
  announcement: '欢迎来到我的个人主页 —— 后台可随时调整全站内容',
  hero: {
    badge: 'PERSONAL ARCADE / 个人游戏厅',
    title: 'FYX',
    subtitle: '这里是属于我的游戏宇宙 —— Phigros、绝区零、异环。节奏不息，信号不灭。',
    scrollHint: 'SCROLL',
  },
  theme: {
    accent: '#ff4a3d',
    accent2: '#f5f5f5',
  },
  splash: {
    enabled: true,
    duration: 2600,
    lines: ['ESTABLISHING SIGNAL…', 'CALIBRATING RHYTHM…', 'WELCOME TO FYX'],
  },
  music: {
    enabled: true,
    title: 'Desultory Signals',
    artist: 'technoplanet · Phigros Chapter IX「Solivault」',
    src: '/audio/desultory-signals.m4a',
    cover: '/images/phigros-chart.jpg',
    autoplay: false,
  },
  about: {
    title: 'ABOUT FYX',
    text: '我是 FYX。平日在音游的判定线与开放都市之间穿行，喜欢叶瞬光的剑光、蕾米埃尔的谜、鸠的安静，也喜欢海特洛市下雨的夜。这个站点是我的游戏厅、日记本，也是和大家聊天的地方。',
  },
  wall: {
    title: 'MY RECORDS',
    subtitle: '成绩墙 · SCORE & MOMENTS',
    note: '把 FC / AP / Phi 成绩图与手元视频挂上来 —— 内容由后台上传管理。',
  },
  // 开源项目（首页栏目，点击跳转仓库）
  oss: [],
  // 网站推荐（首页栏目，点击跳转站点）
  links: [],
  // AI 助手：管理员全局配置（apiKey 只存服务端，不通过公开 config 下发）
  ai: {
    enabled: true,
    baseUrl: '',   // 以 /v1 结尾，例如 https://api.openai.com/v1
    apiKey: '',
    model: '',     // 例如 gpt-4o-mini / deepseek-chat
    temperature: 0.7,
    top_p: 1,
    max_tokens: 1024,
    systemPrompt: '你是本站的 AI 助手，回答简洁、友好，使用与提问相同的语言。',
  },
  games: [
    {
      id: 'phigros',
      title: 'Phigros',
      zh: '屁股肉 / 菲格罗斯',
      year: '2017 — 至今',
      genre: '无轨下落式 · 音乐节奏',
      dev: 'Pigeon Games 鸽游',
      cover: '/images/phigros-cover.jpg',
      desc: '完全免费、无内购的非商业音游。四种音符配合不断移动变换的判定线，200+ 首电音与数十位画师的精美插画。主线最终章「穹窿的孤舟」已于 2026 年 9 月 25 日开启，Desultory Signals 的 AT 18 成为新的终盘试炼。',
      highlight: '主线曲 · Desultory Signals AT 18',
      tags: ['音游', '免费无内购', 'Chapter IX'],
      chars: [
        {
          name: '鸠',
          title: '看板娘 · 概念角色',
          img: '/images/phigros-jiu.png',
          desc: 'Pigeon Games 一周年之际发布的概念角色，也是游戏封面上的少女。玩家爱称「屁股肉看板娘」。',
          quote: '音律灵动，跃然指尖。',
        },
        {
          name: 'Gino',
          title: '剧情角色',
          img: '',
          desc: '主线剧情中的重要角色之一，与鸠一起见证像素塔与各个章节的故事。',
          quote: '故事仍在继续。',
        },
      ],
      gallery: ['/images/phigros-cover.jpg', '/images/phigros-jiu-2.jpg', '/images/phigros-chart.jpg'],
    },
    {
      id: 'zzz',
      title: 'Zenless Zone Zero',
      zh: '绝区零',
      year: '2024-07-04 公测',
      genre: '都市动作 RPG · Roguelite',
      dev: 'miHoYo 米哈游',
      cover: '/images/zzz-yeshunguang.jpg',
      desc: '空洞与以骸共存的新艾利都。我以绳匠「法厄同」的身份，带领代理人穿行空洞。2.5 版本迎来虚狩继任者叶瞬光，3.1 版本「漫长的告别」让初代虚狩蕾米埃尔·丹苏醒——这两位是我最想安利的角色。',
      highlight: '重点角色 · 叶瞬光 × 蕾米埃尔',
      tags: ['动作', '新艾利都', '虚狩'],
      chars: [
        {
          name: '叶瞬光',
          title: '云岿山 · 凛刃（变种物理）· 强攻 · 第二位虚狩',
          img: '/images/zzz-yeshunguang.jpg',
          desc: '叶释渊的师妹，青溟剑的继承者。常态下是温柔的小师姐；进入「明心境」后白发红瞳、剑气纵横。青溟剑会吞噬使用者的记忆与五感——她却始终记得要守护绳匠。',
          quote: '若能化作光芒。',
        },
        {
          name: '蕾米埃尔·丹',
          title: '达识结社 · 流明 · 初代虚狩',
          img: '/images/zzz-remeielle.png',
          desc: '初代虚狩之一、昔日节杖军中校，因「静默之日」沉睡百年。擅长用恰到好处的玩笑拉近距离，又保持着令人捉摸不透的距离感。3.1 版本登场。',
          quote: '唯有越过知识的边界，才能触碰真实的虚像。',
        },
        {
          name: '叶瞬光 · 明心境',
          title: '白发红瞳 · 爆发形态',
          img: '/images/zzz-yeshunguang-2.jpg',
          desc: '切换形态后的战斗姿态，攻击转为「凛刃」属性，格挡与无敌帧齐备，温柔与锋利一体两面。',
          quote: '就算忘记一切，也不会忘记这一剑。',
        },
      ],
      gallery: [
        '/images/zzz-yeshunguang.jpg',
        '/images/zzz-yeshunguang-2.jpg',
        '/images/zzz-yeshunguang-battle.jpg',
        '/images/zzz-remeielle.png',
        '/images/zzz-remeielle-2.png',
        '/images/zzz-banner.jpg',
      ],
    },
    {
      id: 'yihuan',
      title: 'Neverness to Everness',
      zh: '异环',
      year: '2026-04-23 公测',
      genre: '超自然都市 · 开放世界 RPG',
      dev: 'Hotta Studio 幻塔工作室 · 完美世界',
      cover: '/images/yihuan-cover.jpg',
      desc: '人类与超自然共存的沿海大都市海特洛市。我扮演首位「无证上岗」的异象猎人——编号「零号异象」，在古董店「伊波恩」接取异象委托，与一群个性非凡的搭档演绎都市物语。',
      highlight: '舞台 · 海特洛市 HEITHRO',
      tags: ['开放世界', '新怪谈', '都市异能'],
      chars: [
        {
          name: '零',
          title: '主角 · 零号异象',
          img: '',
          desc: '首位无证上岗的异象猎人，失去全部记忆，能力无法被检测，被视作「无法归类的异常体」。',
          quote: '从零开始的委托人生。',
        },
        {
          name: '娜娜莉',
          title: 'S 级 · 灵属性输出',
          img: '',
          desc: '开服 T0 级灵属性主力，柯林斯秘传技法的传承者，开荒首选。',
          quote: '交给我吧。',
        },
        {
          name: '安魂曲',
          title: 'S 级 · 暗属性',
          img: '',
          desc: '异象管理局员工，后勤报修次数纪录保持者。梦中可化蝠飞行——「只想早点下班回家睡觉」。',
          quote: '解决这个，就可以休息了。',
        },
        {
          name: '早雾 / 法帝娅 / 薄荷',
          title: 'S · S · A 级搭档',
          img: '',
          desc: '咒属性的早雾、魂属性的法帝娅、A 级的快递员薄荷……海特洛市的每一次异象委托，都靠这群伙伴一起收场。',
          quote: '伊波恩全员，出动。',
        },
      ],
      gallery: [
        '/images/yihuan-cover.jpg',
        '/images/yihuan-cast.jpg',
        '/images/yihuan-cast-2.jpg',
        '/images/yihuan-street.jpg',
        '/images/yihuan-banner.jpg',
      ],
    },
  ],
  boards: [
    { id: 'games', name: '游戏讨论', desc: 'Phigros / 绝区零 / 异环，以及一切游戏话题', sort: 1 },
    { id: 'records', name: '成绩炫耀', desc: '晒成绩、晒手元、求批分', sort: 2 },
    { id: 'site', name: '站务与闲聊', desc: '站点建议、日常水帖', sort: 3 },
  ],
}

// 欢迎内容（仅在数据库为空时写入一次）
export const seedPosts = [
  {
    title: '欢迎来到 FYX 的个人主页',
    tags: ['公告', 'GYX'],
    cover: '/images/phigros-cover.jpg',
    published: true,
    content: `# 欢迎来到 FYX

这是一个集 **个人主页 / 博客 / 论坛 / 朋友圈 / 聊天** 于一体的小站。

- 🎮 三款我最喜欢的游戏：Phigros、绝区零、异环
- 🏆 成绩墙：后台上传成绩图与视频
- 🎵 开屏动画 + BGM：*Desultory Signals*（technoplanet）
- 🛠 全站内容都可以在 \`/admin\` 后台调整

> 默认管理员：\`fyx\` / \`fyx2026\`，登录后请尽快在后台修改密码。`,
  },
  {
    title: '我的音游片单：从 Glaciaxion 到 Desultory Signals',
    tags: ['音游', 'Phigros'],
    cover: '/images/phigros-chart.jpg',
    published: true,
    content: `# 我的音游片单

1. **Desultory Signals** — technoplanet，Chapter IX 主线曲，AT 18
2. **Rrhar'il** — 老章魔王曲，传说的开端
3. **Glaciaxion** — 判定线美学的代表

> 站点 BGM 就是《Desultory Signals》，右下角播放器随时可以开关。`,
  },
]

export const seedThreads = [
  {
    boardId: 'games',
    title: '大家最期待哪个角色复刻？',
    content: '我先说：蕾米埃尔·丹的卡池一定要回来看看。',
    replies: [{ content: '叶瞬光！青溟剑永远的神。' }],
  },
]
