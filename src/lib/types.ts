export interface User {
  id: number
  username: string
  role: 'admin' | 'user'
  banned?: boolean
  createdAt?: number
}

export interface Character {
  name: string
  title?: string
  img?: string
  desc?: string
  quote?: string
}

export interface Game {
  id: string
  title: string
  zh?: string
  year?: string
  genre?: string
  dev?: string
  cover?: string
  desc?: string
  highlight?: string
  tags?: string[]
  chars?: Character[]
  gallery?: string[]
}

export interface SiteConfig {
  site: { name: string; slogan: string; favicon?: string }
  announcement?: string
  hero: { badge?: string; title: string; subtitle?: string; scrollHint?: string; bgImage?: string }
  theme: { accent: string; accent2?: string }
  splash: { enabled: boolean; duration: number; lines: string[] }
  music: { enabled: boolean; title: string; artist: string; src: string; cover?: string; autoplay?: boolean }
  about?: { title: string; text: string; image?: string }
  wall?: { title: string; subtitle?: string; note?: string }
  games: Game[]
  /** 开源项目卡片（首页 04 栏） */
  oss?: CardLink[]
  /** 网站推荐卡片（首页 05 栏） */
  links?: CardLink[]
  /** AI 助手（管理员全局配置；apiKey 不会通过公开 config 下发） */
  ai?: AiConfig
  boards?: Board[]
  allowRegister?: boolean
  copy?: Record<string, string>
  [key: string]: unknown
}

/** 图片卡片：开源项目 / 网站，点击跳转 url */
export interface CardLink {
  id: string
  name: string
  url: string
  desc?: string
  image?: string
  tags?: string[]
  badge?: string
}

/** AI 多参数（管理员与用户同构，用户配置逐字段覆盖管理员） */
export interface AiConfig {
  enabled?: boolean
  baseUrl?: string
  apiKey?: string
  model?: string
  temperature?: number
  top_p?: number
  max_tokens?: number
  systemPrompt?: string
}

/** GET /api/ai/prefs 返回的脱敏视图 */
export interface AiPrefsView {
  enabled: boolean
  user: AiConfig & { hasKey?: boolean; apiKeyMasked?: string }
  admin: AiConfig & { hasKey?: boolean; apiKeyMasked?: string }
  effective: { using: 'user' | 'admin' | 'none'; model: string; baseUrl: string; hasKey: boolean }
}

export interface Post {
  id: number
  title: string
  content?: string
  tags?: string[]
  cover?: string
  published?: boolean
  createdAt: number
  updatedAt: number
  excerpt?: string
  author?: User | null
}

export interface Board {
  id: string
  name: string
  desc?: string
  sort?: number
  threadCount?: number
}

export interface ThreadItem {
  id: number
  boardId: string
  title: string
  pinned?: boolean
  locked?: boolean
  createdAt: number
  lastReplyAt: number
  replyCount: number
  author?: User | null
}

export interface ReplyItem {
  id: number
  threadId: number
  content: string
  createdAt: number
  author?: User | null
}

export interface ThreadDetail extends Omit<ThreadItem, 'replyCount'> {
  content: string
  board?: { id: string; name: string } | null
  replies: ReplyItem[]
}

export interface MomentMedia {
  type: 'image' | 'video'
  url: string
}

export interface Moment {
  id: number
  content: string
  media: MomentMedia[]
  createdAt: number
  author: User | null
  likes: User[]
  comments: { id: number; content: string; createdAt: number; author: User | null }[]
  liked: boolean
}

export interface ChatOverview {
  user: User
  last: { content: string; createdAt: number; fromMe: boolean } | null
  unread: number
}

export interface Message {
  id: number
  from: number
  to: number
  content: string
  createdAt: number
  readAt: number | null
  mine?: boolean
}

export interface MediaItem {
  id: number
  type: 'image' | 'video'
  url: string
  title?: string
  createdAt: number
  sort?: number
  uploader?: User | null
}
