import { useConfig } from './config'

export interface CopyItem {
  key: string
  label: string
  dflt: string
}

export interface CopyGroup {
  id: string
  title: string
  items: CopyItem[]
}

/**
 * 全站可编辑文案字典 —— 后台「文案管理」逐条编辑。
 * 未覆盖的 key 自动回落到 dflt。
 */
export const COPY_GROUPS: CopyGroup[] = [
  {
    id: 'nav',
    title: '导航栏 Nav',
    items: [
      { key: 'nav.home', label: '首页', dflt: '首页' },
      { key: 'nav.blog', label: '博客', dflt: '博客' },
      { key: 'nav.forum', label: '论坛', dflt: '论坛' },
      { key: 'nav.moments', label: '朋友圈', dflt: '朋友圈' },
      { key: 'nav.chat', label: '聊天', dflt: '聊天' },
      { key: 'nav.enHome', label: '首页(英文小字·移动端)', dflt: 'HOME' },
      { key: 'nav.enBlog', label: '博客(英文小字·移动端)', dflt: 'BLOG' },
      { key: 'nav.enForum', label: '论坛(英文小字·移动端)', dflt: 'FORUM' },
      { key: 'nav.enMoments', label: '朋友圈(英文小字·移动端)', dflt: 'MOMENTS' },
      { key: 'nav.enChat', label: '聊天(英文小字·移动端)', dflt: 'CHAT' },
      { key: 'nav.enAdmin', label: '后台(英文小字·移动端)', dflt: 'ADMIN' },
      { key: 'nav.login', label: '登录按钮', dflt: '登录 / 注册' },
      { key: 'nav.admin', label: '后台入口', dflt: '后台' },
      { key: 'nav.roleAdmin', label: '菜单身份·管理员', dflt: 'ADMINISTRATOR' },
      { key: 'nav.roleMember', label: '菜单身份·成员', dflt: 'MEMBER' },
      { key: 'nav.menuMoments', label: '菜单·我的朋友圈', dflt: '我的朋友圈' },
      { key: 'nav.menuAdmin', label: '菜单·后台管理', dflt: '后台管理' },
      { key: 'nav.logout', label: '菜单·退出登录', dflt: '退出登录' },
    ],
  },
  {
    id: 'hero',
    title: '首页 Hero（标题/副标题/公告在「站点设置」）',
    items: [
      { key: 'hero.announceTag', label: '公告标签', dflt: 'ANNOUNCE' },
      { key: 'hero.cta1', label: '主按钮', dflt: 'ENTER GAME ROOM' },
      { key: 'hero.cta2', label: '次按钮', dflt: '成绩墙 RECORDS' },
      { key: 'hero.vertical', label: '右侧竖排文字', dflt: 'PERSONAL HOMEPAGE · 2026' },
    ],
  },
  {
    id: 'games',
    title: '游戏专区（游戏内容在「游戏管理」）',
    items: [
      { key: 'games.eyebrow', label: '章节编号', dflt: '01 GAMES' },
      { key: 'games.heading', label: '大标题', dflt: '我喜欢的游戏.' },
      { key: 'games.charsLabel', label: '角色栏标题', dflt: 'CHARACTERS / 角色' },
    ],
  },
  {
    id: 'wall',
    title: '成绩墙（标题/提示语在「站点设置」）',
    items: [
      { key: 'wall.eyebrow', label: '章节编号', dflt: '02 RECORDS' },
      { key: 'wall.items', label: '资源计数(可用 {{n}})', dflt: '{{n}} ITEMS' },
      { key: 'wall.awaiting', label: '空位标语', dflt: 'AWAITING UPLOAD' },
      { key: 'wall.uploadBtn', label: '空位按钮', dflt: '去后台上传 →' },
      { key: 'wall.emptyNote', label: '空位提示(配置为空时)', dflt: '成绩墙空空如也 —— 把你的高光时刻挂上来。' },
      { key: 'wall.labelImage', label: '图片角标', dflt: 'SCORE' },
      { key: 'wall.labelVideo', label: '视频角标', dflt: 'VIDEO' },
    ],
  },
  {
    id: 'home',
    title: '首页·博客预览 & 关于',
    items: [
      { key: 'home.blogEyebrow', label: '博客栏章节编号', dflt: '03 BLOG' },
      { key: 'home.blogHeading', label: '博客栏标题', dflt: '最近在写.' },
      { key: 'home.blogAll', label: '查看全部', dflt: 'ALL POSTS →' },
      { key: 'home.blogEmpty', label: '博客栏空状态', dflt: '还没有文章 —— 后台「博客」可以开始写作。' },
      { key: 'home.aboutEyebrow', label: '关于栏章节编号', dflt: '06 ABOUT' },
      { key: 'home.aboutList', label: '关于·侧栏清单(每行一条)', dflt: 'PHIGROS\nZENLESS ZONE ZERO\nNEVERNESS TO EVERNESS' },
    ],
  },
  {
    id: 'oss',
    title: '开源项目栏（内容在「开源项目」后台）',
    items: [
      { key: 'oss.eyebrow', label: '章节编号', dflt: '04 OPEN SOURCE' },
      { key: 'oss.heading', label: '大标题', dflt: '开源项目.' },
      { key: 'oss.view', label: '卡片悬停提示', dflt: '打开仓库' },
    ],
  },
  {
    id: 'links',
    title: '网站栏（内容在「网站推荐」后台）',
    items: [
      { key: 'links.eyebrow', label: '章节编号', dflt: '05 WEBSITES' },
      { key: 'links.heading', label: '大标题', dflt: '喜欢的网站.' },
      { key: 'links.view', label: '卡片悬停提示', dflt: '打开网站' },
    ],
  },
  {
    id: 'footer',
    title: '页脚（链接沿用导航文案）',
    items: [
      { key: 'footer.copyright', label: '版权行(可用 {{year}} {{name}})', dflt: '© {{year}} {{name}} · PERSONAL USE ONLY' },
      { key: 'footer.bgm', label: 'BGM 行(可用 {{title}} {{artist}})', dflt: 'BGM: {{title}} — {{artist}}' },
    ],
  },
  {
    id: 'blog',
    title: '博客页',
    items: [
      { key: 'blog.eyebrow', label: '眉题·左', dflt: 'BLOG' },
      { key: 'blog.eyebrowSub', label: '眉题·右', dflt: '随笔 · 随便写写' },
      { key: 'blog.heading', label: '大标题', dflt: '博客.' },
      { key: 'blog.write', label: '写文章入口(管理员)', dflt: '+ 写文章' },
      { key: 'blog.empty', label: '空状态', dflt: '还没有文章。' },
      { key: 'blog.draft', label: '草稿角标', dflt: 'DRAFT' },
      { key: 'post.back', label: '返回链接', dflt: 'BLOG' },
      { key: 'post.draftPreview', label: '草稿预览条', dflt: 'DRAFT PREVIEW' },
      { key: 'post.notFound', label: '文章不存在', dflt: '文章不存在' },
    ],
  },
  {
    id: 'forum',
    title: '论坛',
    items: [
      { key: 'forum.eyebrow', label: '眉题·左', dflt: 'FORUM' },
      { key: 'forum.eyebrowSub', label: '眉题·右', dflt: '论坛' },
      { key: 'forum.heading', label: '大标题', dflt: '论坛.' },
      { key: 'forum.boardsEmpty', label: '板块空状态', dflt: '论坛板块还没配置 —— 请在后台「论坛」中添加。' },
      { key: 'forum.boardMeta', label: '板块主题数(可用 {{count}})', dflt: '{{count}} THREADS' },
      { key: 'forum.newThread', label: '发帖按钮', dflt: '发起主题' },
      { key: 'forum.threadsEmpty', label: '主题列表空状态', dflt: '还没有主题，来发第一帖吧。' },
      { key: 'forum.newTitle', label: '发帖弹窗标题', dflt: '发起主题' },
      { key: 'forum.newDesc', label: '发帖弹窗描述(可用 {{board}})', dflt: '在「{{board}}」发布新主题' },
      { key: 'forum.labelTitle', label: '字段·标题', dflt: '标题' },
      { key: 'forum.labelContent', label: '字段·内容', dflt: '内容' },
      { key: 'forum.titlePh', label: '标题占位符', dflt: '说点什么…' },
      { key: 'forum.contentPh', label: '正文占位符', dflt: '正文…' },
      { key: 'forum.cancel', label: '取消', dflt: '取消' },
      { key: 'forum.publish', label: '发布', dflt: '发布' },
      { key: 'forum.publishing', label: '发布中…', dflt: '发布中…' },
      { key: 'forum.needTitleContent', label: '校验提示', dflt: '标题和内容都要填' },
      { key: 'forum.postOk', label: '发布成功提示', dflt: '主题已发布' },
      { key: 'forum.replies', label: '回复数标签', dflt: 'REPLIES' },
      { key: 'forum.lastReply', label: '最后回复', dflt: '最后回复' },
      { key: 'forum.pinChip', label: '置顶角标', dflt: 'PIN' },
      { key: 'forum.lockChip', label: '锁定角标', dflt: 'LOCK' },
    ],
  },
  {
    id: 'thread',
    title: '主题详情',
    items: [
      { key: 'thread.authorUnknown', label: '作者占位', dflt: '未知' },
      { key: 'thread.replyCount', label: '回复计数(可用 {{n}})', dflt: '{{n}} REPLIES' },
      { key: 'thread.locked', label: '锁定提示', dflt: '主题已锁定' },
      { key: 'thread.replyPh', label: '回复占位符', dflt: '写下你的回复…' },
      { key: 'thread.replyPhGuest', label: '未登录占位符', dflt: '登录后参与讨论' },
      { key: 'thread.replyBtn', label: '回复按钮', dflt: '回复' },
      { key: 'thread.replying', label: '发送中…', dflt: '发送中…' },
      { key: 'thread.empty', label: '空回复', dflt: '还没有回复。' },
      { key: 'thread.notFound', label: '主题不存在', dflt: '主题不存在' },
      { key: 'thread.deleted', label: '删除成功', dflt: '主题已删除' },
      { key: 'thread.pinOk', label: '置顶成功提示', dflt: '已更新置顶' },
      { key: 'thread.lockOk', label: '锁定成功提示', dflt: '已更新锁定' },
      { key: 'thread.pin', label: '菜单·置顶', dflt: '置顶' },
      { key: 'thread.unpin', label: '菜单·取消置顶', dflt: '取消置顶' },
      { key: 'thread.lock', label: '菜单·锁定', dflt: '锁定' },
      { key: 'thread.unlock', label: '菜单·解锁', dflt: '解锁' },
      { key: 'thread.delete', label: '菜单·删除主题', dflt: '删除主题' },
      { key: 'thread.menu', label: '更多菜单按钮', dflt: '···' },
    ],
  },
  {
    id: 'moments',
    title: '朋友圈',
    items: [
      { key: 'moments.eyebrow', label: '眉题·左', dflt: 'MOMENTS' },
      { key: 'moments.eyebrowSub', label: '眉题·右', dflt: '朋友圈' },
      { key: 'moments.heading', label: '大标题', dflt: '朋友圈.' },
      { key: 'moments.composerPh', label: '发布框占位符', dflt: '最近在玩什么？说点什么…' },
      { key: 'moments.mediaBtn', label: '上传按钮', dflt: '图片 / 视频' },
      { key: 'moments.uploading', label: '上传中', dflt: 'UPLOADING…' },
      { key: 'moments.postBtn', label: '发布按钮', dflt: '发布' },
      { key: 'moments.posting', label: '发布中…', dflt: '发布中…' },
      { key: 'moments.postOk', label: '发布成功提示', dflt: '已发布' },
      { key: 'moments.limit', label: '数量限制提示', dflt: '最多 9 张 / 段' },
      { key: 'moments.guestCta', label: '未登录提示', dflt: '登录后即可发布动态、点赞和评论。' },
      { key: 'moments.guestBtn', label: '未登录按钮', dflt: '登录 / 注册' },
      { key: 'moments.empty', label: '空状态', dflt: '朋友圈静悄悄 —— 发布第一条动态吧。' },
      { key: 'moments.loadMore', label: '加载更多(可用 {{n}})', dflt: '加载更多（共 {{n}}）' },
      { key: 'moments.like', label: '点赞(无数量)', dflt: 'LIKE' },
      { key: 'moments.comment', label: '评论(无数量)', dflt: 'REPLY' },
      { key: 'moments.commentPh', label: '评论占位符', dflt: '评论…' },
      { key: 'moments.deleted', label: '删除成功', dflt: '已删除' },
      { key: 'moments.anon', label: '匿名评论者', dflt: '匿名' },
    ],
  },
  {
    id: 'chat',
    title: '聊天',
    items: [
      { key: 'chat.eyebrow', label: '眉题·左', dflt: 'CHAT' },
      { key: 'chat.eyebrowSub', label: '眉题·右', dflt: '聊天' },
      { key: 'chat.heading', label: '大标题', dflt: '聊天.' },
      { key: 'chat.guestTitle', label: '未登录标题', dflt: '登录后开始聊天' },
      { key: 'chat.guestDesc', label: '未登录描述', dflt: '和站内好友、和我私信 —— 微信式的即时会话。' },
      { key: 'chat.guestBtn', label: '未登录按钮', dflt: '登录 / 注册' },
      { key: 'chat.contacts', label: '联系人栏', dflt: 'CONTACTS · 通讯录' },
      { key: 'chat.emptyContacts', label: '空联系人', dflt: '还没有其他用户 —— 邀请朋友注册吧。' },
      { key: 'chat.selectTitle', label: '未选中标题', dflt: 'SELECT A CONTACT' },
      { key: 'chat.selectDesc', label: '未选中描述', dflt: '从左侧选择一个联系人开始聊天' },
      { key: 'chat.noMsg', label: '无消息预览', dflt: '暂无消息' },
      { key: 'chat.me', label: '自己消息前缀', dflt: '我: ' },
      { key: 'chat.inputPh', label: '输入占位符', dflt: '输入消息，Enter 发送…' },
      { key: 'chat.admin', label: '身份·管理员', dflt: 'ADMINISTRATOR' },
      { key: 'chat.member', label: '身份·成员', dflt: 'MEMBER' },
    ],
  },
  {
    id: 'auth',
    title: '登录 / 注册',
    items: [
      { key: 'auth.brand', label: '品牌眉题', dflt: 'FYX ACCOUNT' },
      { key: 'auth.fillAll', label: '校验提示', dflt: '请填写用户名和密码' },
      { key: 'auth.welcomeBack', label: '登录欢迎语', dflt: '欢迎回来，{{name}}' },
      { key: 'auth.regOk', label: '注册欢迎语', dflt: '注册成功，欢迎 {{name}}' },
      { key: 'auth.login', label: '登录标题', dflt: '登录.' },
      { key: 'auth.register', label: '注册标题', dflt: '注册.' },
      { key: 'auth.loginTab', label: '登录 Tab', dflt: 'LOGIN' },
      { key: 'auth.registerTab', label: '注册 Tab', dflt: 'REGISTER' },
      { key: 'auth.username', label: '用户名', dflt: '用户名' },
      { key: 'auth.usernamePh', label: '用户名占位符', dflt: '2-20 位中英文 / 数字' },
      { key: 'auth.password', label: '密码', dflt: '密码' },
      { key: 'auth.passwordPhLogin', label: '密码占位符·登录', dflt: '密码' },
      { key: 'auth.passwordPhReg', label: '密码占位符·注册', dflt: '至少 6 位' },
      { key: 'auth.submitLogin', label: '登录按钮', dflt: '登 录' },
      { key: 'auth.submitReg', label: '注册按钮', dflt: '注 册' },
      { key: 'auth.regClosed', label: '关闭注册提示', dflt: 'REGISTRATION CLOSED · 注册已关闭' },
      { key: 'auth.regHint', label: '注册提示', dflt: 'REGISTER TO JOIN FORUM / MOMENTS / CHAT' },
      { key: 'auth.adminHint', label: '管理员提示', dflt: 'ADMIN DEFAULT: fyx / fyx2026 — 记得修改' },
    ],
  },
  {
    id: 'ai',
    title: 'AI 助手浮窗',
    items: [
      { key: 'ai.title', label: '浮窗标题', dflt: 'AI 助手' },
      { key: 'ai.en', label: '英文小字', dflt: 'ASSISTANT' },
      { key: 'ai.guestTitle', label: '未登录标题', dflt: '登录后与 AI 对话' },
      { key: 'ai.guestDesc', label: '未登录描述', dflt: '配置你自己的 API，或使用管理员配置的模型。' },
      { key: 'ai.ph', label: '输入占位符', dflt: '问点什么…（Enter 发送）' },
      { key: 'ai.send', label: '发送按钮', dflt: '发送' },
      { key: 'ai.settings', label: '设置按钮', dflt: '设置' },
      { key: 'ai.clear', label: '清空对话', dflt: '清空对话' },
      { key: 'ai.notConfigured', label: '未配置标题', dflt: '尚未配置 API' },
      { key: 'ai.notConfiguredDesc', label: '未配置说明', dflt: '点右上角「设置」填写你自己的 API 地址与 Key；也可以等管理员在后台 →「AI 设置」里配置全局 API。地址以 /v1 结尾。' },
      { key: 'ai.mineTab', label: '设置·我的配置', dflt: '我的配置' },
      { key: 'ai.adminTab', label: '设置·管理员配置', dflt: '管理员配置' },
      { key: 'ai.readonly', label: '非管理员只读', dflt: '仅管理员可修改' },
      { key: 'ai.addrLabel', label: '字段·API 地址', dflt: 'API 地址（以 /v1 结尾）' },
      { key: 'ai.addrPh', label: '地址占位符', dflt: 'https://api.openai.com/v1' },
      { key: 'ai.keyLabel', label: '字段·API Key', dflt: 'API Key' },
      { key: 'ai.keyKeepHint', label: 'Key 保留提示(可用 {{mask}})', dflt: '已保存（{{mask}}）· 留空保持不变' },
      { key: 'ai.clearKey', label: '清除 Key', dflt: '清除已存 Key' },
      { key: 'ai.modelLabel', label: '字段·模型', dflt: '模型名' },
      { key: 'ai.modelPh', label: '模型占位符', dflt: 'gpt-4o-mini / deepseek-chat…' },
      { key: 'ai.tempLabel', label: '字段·温度', dflt: '温度 temperature（0–2）' },
      { key: 'ai.toppLabel', label: '字段·top_p', dflt: '采样 top_p（0–1）' },
      { key: 'ai.maxLabel', label: '字段·max_tokens', dflt: '最大输出 max_tokens' },
      { key: 'ai.sysLabel', label: '字段·系统提示词', dflt: '系统提示词 system prompt' },
      { key: 'ai.save', label: '保存设置', dflt: '保存设置' },
      { key: 'ai.saved', label: '保存成功', dflt: '设置已保存' },
      { key: 'ai.test', label: '测试连接', dflt: '测试连接' },
      { key: 'ai.testOk', label: '测试成功(可用 {{ms}} {{model}})', dflt: '连接成功 · {{ms}}ms · {{model}}' },
      { key: 'ai.usingAdmin', label: '状态·管理员API', dflt: '当前使用：管理员 API' },
      { key: 'ai.usingMine', label: '状态·我的API', dflt: '当前使用：我的 API' },
      { key: 'ai.usingNone', label: '状态·未配置', dflt: '当前未配置可用 API' },
    ],
  },
  {
    id: 'misc',
    title: '其他（开屏 / 播放器 / 灯箱 / 404）',
    items: [
      { key: 'splash.skip', label: '开屏·跳过提示', dflt: 'CLICK TO SKIP' },
      { key: 'music.offline', label: '播放器·离线提示', dflt: 'AUDIO OFFLINE' },
      { key: 'lightbox.hint', label: '灯箱·关闭提示', dflt: 'ESC CLOSE' },
      { key: 'misc.admin', label: '管理员徽章', dflt: 'ADMIN' },
      { key: 'err.errorTag', label: '错误眉题', dflt: 'ERROR' },
      { key: 'err.404Tag', label: '404 眉题', dflt: '404' },
      { key: 'err.404Title', label: '404 标题', dflt: '页面不存在' },
      { key: 'err.backHome', label: '返回首页', dflt: '← BACK TO HOME' },
    ],
  },
]

export const DEFAULT_COPY: Record<string, string> = {}
for (const g of COPY_GROUPS) {
  for (const it of g.items) DEFAULT_COPY[it.key] = it.dflt
}

type Vars = Record<string, string | number>

/** 把「标题.」拆成 [标题, 点]，方便把句点染成高亮色 */
export function splitDot(s: string): [string, string] {
  if (/[.。]$/.test(s)) return [s.slice(0, -1), s.slice(-1)]
  return [s, '']
}

export function useCopy() {
  const { config } = useConfig()
  const overrides = (config.copy as Record<string, string> | undefined) || {}
  return (key: string, vars?: Vars): string => {
    let s = overrides[key] ?? DEFAULT_COPY[key] ?? key
    if (vars) {
      for (const [k, v] of Object.entries(vars)) s = s.split(`{{${k}}}`).join(String(v))
    }
    return s
  }
}
