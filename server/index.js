import express from 'express'
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { Readable, Transform } from 'node:stream'
import { fileURLToPath } from 'node:url'
import multer from 'multer'
import {
  db, save, uid, secret, publicUser, verifyPassword, setPassword, UPLOAD_DIR,
} from './store.js'
import { defaultConfig } from './default-config.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const DIST = path.join(ROOT, 'dist')
const PORT = Number(process.env.PORT || 9527)

const app = express()
app.disable('x-powered-by')
app.use(express.json({ limit: '4mb' }))

/* ---------------- auth ---------------- */
const hmac = (s) => crypto.createHmac('sha256', secret).update(s).digest('base64url')

function issueToken(user, days = 30) {
  const exp = Date.now() + days * 864e5
  const body = `1.${user.id}.${exp}`
  return `${body}.${hmac(body)}`
}

function userFromToken(token) {
  if (!token) return null
  const parts = String(token).split('.')
  if (parts.length !== 4 || parts[0] !== '1') return null
  const body = parts.slice(0, 3).join('.')
  const a = Buffer.from(parts[3], 'utf8')
  const b = Buffer.from(hmac(body), 'utf8')
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null
  const exp = Number(parts[2])
  if (!exp || Date.now() > exp) return null
  const u = db.users.find((x) => x.id === Number(parts[1]))
  if (!u || u.banned) return null
  return u
}

app.use((req, res, next) => {
  const raw = req.headers.authorization || ''
  req.user = userFromToken(raw.replace(/^Bearer\s+/i, ''))
  res.set('X-Content-Type-Options', 'nosniff')
  next()
})

const requireAuth = (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: '请先登录' })
  next()
}
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') return res.status(403).json({ error: '需要管理员权限' })
  next()
}
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)
const fail = (status, msg) => {
  const e = new Error(msg)
  e.status = status
  throw e
}

/* ---------------- config ---------------- */
app.get('/api/config', (req, res) => {
  const out = { ...db.config, allowRegister: db.config.allowRegister !== false }
  // AI 的 apiKey 永远不通过公开配置下发（GET /api/ai/prefs 才能拿到脱敏视图）
  if (out.ai) out.ai = { ...out.ai, apiKey: '' }
  res.json(out)
})

app.put('/api/config', requireAdmin, wrap(async (req, res) => {
  const body = req.body
  if (!body || typeof body !== 'object' || Array.isArray(body)) fail(400, '配置格式错误')
  const allowed = Object.keys(defaultConfig).concat(['allowRegister'])
  const nextCfg = { ...db.config }
  for (const k of allowed) {
    if (k in body) nextCfg[k] = body[k]
  }
  if (nextCfg.games && !Array.isArray(nextCfg.games)) fail(400, 'games 必须是数组')
  if (nextCfg.oss && !Array.isArray(nextCfg.oss)) fail(400, 'oss 必须是数组')
  if (nextCfg.links && !Array.isArray(nextCfg.links)) fail(400, 'links 必须是数组')
  // ai.apiKey 防篡改/防丢失：未提交保持原值；显式提交空串则清空
  if (nextCfg.ai && typeof nextCfg.ai === 'object') {
    const submitted = body.ai && typeof body.ai === 'object' ? body.ai : null
    if (submitted && 'apiKey' in submitted) {
      nextCfg.ai = { ...nextCfg.ai, apiKey: String(submitted.apiKey || '').trim() }
    } else {
      nextCfg.ai = { ...nextCfg.ai, apiKey: (db.config.ai && db.config.ai.apiKey) || '' }
    }
  }
  db.config = nextCfg
  save()
  const out = { ...db.config }
  if (out.ai) out.ai = { ...out.ai, apiKey: '' }
  res.json(out)
}))

/* ---------------- auth api ---------------- */
app.post('/api/auth/register', wrap(async (req, res) => {
  if (db.config.allowRegister === false) fail(403, '注册已关闭')
  const { username, password } = req.body || {}
  const name = String(username || '').trim()
  if (!/^[\w\u4e00-\u9fa5-]{2,20}$/.test(name)) fail(400, '用户名需为 2-20 位中英文、数字或 - _')
  if (String(password || '').length < 6) fail(400, '密码至少 6 位')
  if (db.users.some((u) => u.username.toLowerCase() === name.toLowerCase())) fail(409, '用户名已被占用')
  const salt = crypto.randomBytes(16).toString('hex')
  const user = {
    id: uid(), username: name, salt,
    hash: crypto.scryptSync(String(password), salt, 64).toString('hex'),
    role: db.users.length === 0 ? 'admin' : 'user',
    banned: false, createdAt: Date.now(),
  }
  db.users.push(user)
  save()
  res.json({ token: issueToken(user), user: publicUser(user) })
}))

app.post('/api/auth/login', wrap(async (req, res) => {
  const { username, password } = req.body || {}
  const user = db.users.find((u) => u.username.toLowerCase() === String(username || '').trim().toLowerCase())
  if (!user || !verifyPassword(user, password)) fail(401, '用户名或密码错误')
  if (user.banned) fail(403, '账号已被封禁')
  res.json({ token: issueToken(user), user: publicUser(user) })
}))

app.get('/api/auth/me', (req, res) => {
  res.json({ user: req.user ? publicUser(req.user) : null })
})

app.post('/api/auth/password', requireAuth, wrap(async (req, res) => {
  const { oldPassword, newPassword } = req.body || {}
  if (!verifyPassword(req.user, oldPassword)) fail(400, '原密码错误')
  if (String(newPassword || '').length < 6) fail(400, '新密码至少 6 位')
  setPassword(req.user, String(newPassword))
  save()
  res.json({ ok: true })
}))

/* ---------------- upload ---------------- */
const MIME_EXT = {
  'image/png': '.png', 'image/jpeg': '.jpg', 'image/webp': '.webp', 'image/gif': '.gif',
  'image/avif': '.avif', 'video/mp4': '.mp4', 'video/webm': '.webm', 'video/quicktime': '.mov',
  'video/x-matroska': '.mkv', 'audio/mpeg': '.mp3', 'audio/mp4': '.m4a', 'audio/x-m4a': '.m4a',
}
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = MIME_EXT[file.mimetype] || path.extname(file.originalname || '').slice(0, 8) || '.bin'
    cb(null, `${Date.now()}-${crypto.randomBytes(5).toString('hex')}${ext}`)
  },
})
const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (MIME_EXT[file.mimetype]) return cb(null, true)
    cb(new Error('仅支持图片 / 视频 / 音频文件'))
  },
})

app.post('/api/upload', requireAuth, (req, res) => {
  upload.single('file')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message || '上传失败' })
    if (!req.file) return res.status(400).json({ error: '未收到文件' })
    const kind = req.file.mimetype.startsWith('video') ? 'video' : req.file.mimetype.startsWith('audio') ? 'audio' : 'image'
    res.json({ url: `/uploads/${req.file.filename}`, type: kind, name: req.file.originalname })
  })
})

/* ---------------- blog ---------------- */
app.get('/api/posts', wrap(async (req, res) => {
  const all = req.query.all === '1' && req.user?.role === 'admin'
  const list = db.posts
    .filter((p) => all || p.published)
    .slice()
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .map((p) => ({
      id: p.id, title: p.title, tags: p.tags || [], cover: p.cover || '',
      published: p.published, createdAt: p.createdAt, updatedAt: p.updatedAt,
      excerpt: (p.content || '').replace(/[#>*`\-!\[\]()]/g, '').slice(0, 140),
      author: publicUser(db.users.find((u) => u.id === p.authorId)),
    }))
  res.json(list)
}))

app.get('/api/posts/:id', wrap(async (req, res) => {
  const p = db.posts.find((x) => x.id === Number(req.params.id))
  if (!p || (!p.published && req.user?.role !== 'admin')) fail(404, '文章不存在')
  res.json({ ...p, author: publicUser(db.users.find((u) => u.id === p.authorId)) })
}))

app.post('/api/posts', requireAdmin, wrap(async (req, res) => {
  const { title, content, tags, cover, published } = req.body || {}
  if (!title || !content) fail(400, '标题和内容不能为空')
  const now = Date.now()
  const p = {
    id: uid(), authorId: req.user.id,
    title: String(title).slice(0, 120), content: String(content).slice(0, 200000),
    tags: Array.isArray(tags) ? tags.map(String).slice(0, 8) : [],
    cover: String(cover || ''), published: !!published,
    createdAt: now, updatedAt: now,
  }
  db.posts.unshift(p)
  save()
  res.json(p)
}))

app.put('/api/posts/:id', requireAdmin, wrap(async (req, res) => {
  const p = db.posts.find((x) => x.id === Number(req.params.id))
  if (!p) fail(404, '文章不存在')
  const { title, content, tags, cover, published } = req.body || {}
  if (title != null) p.title = String(title).slice(0, 120)
  if (content != null) p.content = String(content).slice(0, 200000)
  if (tags != null) p.tags = Array.isArray(tags) ? tags.map(String).slice(0, 8) : []
  if (cover != null) p.cover = String(cover)
  if (published != null) p.published = !!published
  p.updatedAt = Date.now()
  save()
  res.json(p)
}))

app.delete('/api/posts/:id', requireAdmin, wrap(async (req, res) => {
  const i = db.posts.findIndex((x) => x.id === Number(req.params.id))
  if (i < 0) fail(404, '文章不存在')
  db.posts.splice(i, 1)
  save()
  res.json({ ok: true })
}))

/* ---------------- forum ---------------- */
app.get('/api/boards', wrap(async (req, res) => {
  const boards = (db.config.boards || []).slice().sort((a, b) => (a.sort || 0) - (b.sort || 0))
  res.json(boards.map((b) => ({
    ...b,
    threadCount: db.threads.filter((t) => t.boardId === b.id).length,
  })))
}))

app.post('/api/boards', requireAdmin, wrap(async (req, res) => {
  const { name, desc } = req.body || {}
  if (!name) fail(400, '板块名不能为空')
  const id = 'b' + uid()
  db.config.boards = db.config.boards || []
  db.config.boards.push({ id, name: String(name).slice(0, 30), desc: String(desc || '').slice(0, 100), sort: db.config.boards.length + 1 })
  save()
  res.json({ id })
}))

app.put('/api/boards/:id', requireAdmin, wrap(async (req, res) => {
  const b = (db.config.boards || []).find((x) => x.id === req.params.id)
  if (!b) fail(404, '板块不存在')
  const { name, desc } = req.body || {}
  if (name != null) b.name = String(name).slice(0, 30)
  if (desc != null) b.desc = String(desc).slice(0, 100)
  save()
  res.json(b)
}))

app.delete('/api/boards/:id', requireAdmin, wrap(async (req, res) => {
  const idx = (db.config.boards || []).findIndex((x) => x.id === req.params.id)
  if (idx < 0) fail(404, '板块不存在')
  db.config.boards.splice(idx, 1)
  const tids = db.threads.filter((t) => t.boardId === req.params.id).map((t) => t.id)
  db.threads = db.threads.filter((t) => t.boardId !== req.params.id)
  db.replies = db.replies.filter((r) => !tids.includes(r.threadId))
  save()
  res.json({ ok: true })
}))

app.get('/api/boards/:id/threads', wrap(async (req, res) => {
  const list = db.threads
    .filter((t) => t.boardId === req.params.id)
    .slice()
    .sort((a, b) => (b.pinned - a.pinned) || ((b.lastReplyAt || b.createdAt) - (a.lastReplyAt || a.createdAt)))
    .map((t) => ({
      id: t.id, title: t.title, pinned: t.pinned, locked: t.locked,
      createdAt: t.createdAt, lastReplyAt: t.lastReplyAt || t.createdAt,
      replyCount: db.replies.filter((r) => r.threadId === t.id).length,
      author: publicUser(db.users.find((u) => u.id === t.authorId)),
    }))
  res.json(list)
}))

app.post('/api/boards/:id/threads', requireAuth, wrap(async (req, res) => {
  const board = (db.config.boards || []).find((b) => b.id === req.params.id)
  if (!board) fail(404, '板块不存在')
  const { title, content } = req.body || {}
  if (!title || !content) fail(400, '标题和内容不能为空')
  const now = Date.now()
  const t = {
    id: uid(), boardId: board.id, authorId: req.user.id,
    title: String(title).slice(0, 120), content: String(content).slice(0, 50000),
    pinned: false, locked: false, createdAt: now, lastReplyAt: now,
  }
  db.threads.unshift(t)
  save()
  res.json(t)
}))

app.get('/api/threads/:id', wrap(async (req, res) => {
  const t = db.threads.find((x) => x.id === Number(req.params.id))
  if (!t) fail(404, '主题不存在')
  const replies = db.replies
    .filter((r) => r.threadId === t.id)
    .sort((a, b) => a.createdAt - b.createdAt)
    .map((r) => ({ ...r, author: publicUser(db.users.find((u) => u.id === r.authorId)) }))
  const board = (db.config.boards || []).find((b) => b.id === t.boardId)
  res.json({
    ...t,
    board: board ? { id: board.id, name: board.name } : null,
    author: publicUser(db.users.find((u) => u.id === t.authorId)),
    replies,
  })
}))

app.post('/api/threads/:id/replies', requireAuth, wrap(async (req, res) => {
  const t = db.threads.find((x) => x.id === Number(req.params.id))
  if (!t) fail(404, '主题不存在')
  if (t.locked && req.user.role !== 'admin') fail(403, '主题已锁定')
  const { content } = req.body || {}
  if (!content) fail(400, '回复内容不能为空')
  const r = {
    id: uid(), threadId: t.id, authorId: req.user.id,
    content: String(content).slice(0, 20000), createdAt: Date.now(),
  }
  db.replies.push(r)
  t.lastReplyAt = r.createdAt
  save()
  res.json({ ...r, author: publicUser(req.user) })
}))

app.patch('/api/threads/:id', requireAuth, wrap(async (req, res) => {
  const t = db.threads.find((x) => x.id === Number(req.params.id))
  if (!t) fail(404, '主题不存在')
  const isAdmin = req.user.role === 'admin'
  const isOwner = t.authorId === req.user.id
  if (!isAdmin && !isOwner) fail(403, '无权操作')
  const { pinned, locked, title, content } = req.body || {}
  if (pinned != null) { if (!isAdmin) fail(403, '仅管理员可置顶'); t.pinned = !!pinned }
  if (locked != null) { if (!isAdmin) fail(403, '仅管理员可锁定'); t.locked = !!locked }
  if (title != null && (isAdmin || isOwner)) t.title = String(title).slice(0, 120)
  if (content != null && (isAdmin || isOwner)) t.content = String(content).slice(0, 50000)
  save()
  res.json(t)
}))

app.delete('/api/threads/:id', requireAuth, wrap(async (req, res) => {
  const i = db.threads.findIndex((x) => x.id === Number(req.params.id))
  if (i < 0) fail(404, '主题不存在')
  const t = db.threads[i]
  if (req.user.role !== 'admin' && t.authorId !== req.user.id) fail(403, '无权操作')
  db.threads.splice(i, 1)
  db.replies = db.replies.filter((r) => r.threadId !== t.id)
  save()
  res.json({ ok: true })
}))

app.delete('/api/replies/:id', requireAuth, wrap(async (req, res) => {
  const i = db.replies.findIndex((x) => x.id === Number(req.params.id))
  if (i < 0) fail(404, '回复不存在')
  const r = db.replies[i]
  if (req.user.role !== 'admin' && r.authorId !== req.user.id) fail(403, '无权操作')
  db.replies.splice(i, 1)
  save()
  res.json({ ok: true })
}))

/* ---------------- moments (朋友圈) ---------------- */
function decorateMoment(m, viewer) {
  const author = publicUser(db.users.find((u) => u.id === m.userId))
  const likes = db.momentLikes
    .filter((l) => l.momentId === m.id)
    .map((l) => publicUser(db.users.find((u) => u.id === l.userId)))
    .filter(Boolean)
  const comments = db.momentComments
    .filter((c) => c.momentId === m.id)
    .sort((a, b) => a.createdAt - b.createdAt)
    .map((c) => ({ ...c, author: publicUser(db.users.find((u) => u.id === c.userId)) }))
  return {
    ...m, author, likes, comments,
    liked: viewer ? likes.some((l) => l.id === viewer.id) : false,
  }
}

app.get('/api/moments', wrap(async (req, res) => {
  const offset = Math.max(0, Number(req.query.offset) || 0)
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10))
  const list = db.moments.slice().sort((a, b) => b.createdAt - a.createdAt)
  res.json({
    total: list.length,
    items: list.slice(offset, offset + limit).map((m) => decorateMoment(m, req.user)),
  })
}))

app.post('/api/moments', requireAuth, wrap(async (req, res) => {
  const { content, media } = req.body || {}
  const text = String(content || '').trim()
  const medias = (Array.isArray(media) ? media : []).slice(0, 9)
  if (!text && medias.length === 0) fail(400, '说点什么吧')
  const m = {
    id: uid(), userId: req.user.id, content: text.slice(0, 2000),
    media: medias.map((x) => ({ type: x.type || 'image', url: String(x.url || '') })).filter((x) => x.url),
    createdAt: Date.now(),
  }
  db.moments.unshift(m)
  save()
  res.json(decorateMoment(m, req.user))
}))

app.delete('/api/moments/:id', requireAuth, wrap(async (req, res) => {
  const i = db.moments.findIndex((x) => x.id === Number(req.params.id))
  if (i < 0) fail(404, '动态不存在')
  const m = db.moments[i]
  if (req.user.role !== 'admin' && m.userId !== req.user.id) fail(403, '无权操作')
  db.moments.splice(i, 1)
  db.momentLikes = db.momentLikes.filter((l) => l.momentId !== m.id)
  db.momentComments = db.momentComments.filter((c) => c.momentId !== m.id)
  save()
  res.json({ ok: true })
}))

app.post('/api/moments/:id/like', requireAuth, wrap(async (req, res) => {
  const m = db.moments.find((x) => x.id === Number(req.params.id))
  if (!m) fail(404, '动态不存在')
  const i = db.momentLikes.findIndex((l) => l.momentId === m.id && l.userId === req.user.id)
  let liked
  if (i >= 0) { db.momentLikes.splice(i, 1); liked = false } else {
    db.momentLikes.push({ momentId: m.id, userId: req.user.id }); liked = true
  }
  save()
  res.json({ liked, count: db.momentLikes.filter((l) => l.momentId === m.id).length })
}))

app.post('/api/moments/:id/comments', requireAuth, wrap(async (req, res) => {
  const m = db.moments.find((x) => x.id === Number(req.params.id))
  if (!m) fail(404, '动态不存在')
  const { content } = req.body || {}
  if (!content) fail(400, '评论不能为空')
  const c = {
    id: uid(), momentId: m.id, userId: req.user.id,
    content: String(content).slice(0, 500), createdAt: Date.now(),
  }
  db.momentComments.push(c)
  save()
  res.json({ ...c, author: publicUser(req.user) })
}))

app.delete('/api/moment-comments/:id', requireAuth, wrap(async (req, res) => {
  const i = db.momentComments.findIndex((x) => x.id === Number(req.params.id))
  if (i < 0) fail(404, '评论不存在')
  const c = db.momentComments[i]
  if (req.user.role !== 'admin' && c.userId !== req.user.id) fail(403, '无权操作')
  db.momentComments.splice(i, 1)
  save()
  res.json({ ok: true })
}))

/* ---------------- chat ---------------- */
app.get('/api/users', requireAuth, wrap(async (req, res) => {
  res.json(db.users.filter((u) => !u.banned).map(publicUser))
}))

app.get('/api/chats/overview', requireAuth, wrap(async (req, res) => {
  const others = db.users.filter((u) => u.id !== req.user.id && !u.banned)
  const rows = others.map((u) => {
    const convo = db.messages
      .filter((m) => (m.from === req.user.id && m.to === u.id) || (m.from === u.id && m.to === req.user.id))
      .sort((a, b) => a.createdAt - b.createdAt)
    const last = convo[convo.length - 1] || null
    const unread = convo.filter((m) => m.from === u.id && m.to === req.user.id && !m.readAt).length
    return {
      user: publicUser(u),
      last: last ? { content: last.content, createdAt: last.createdAt, fromMe: last.from === req.user.id } : null,
      unread,
    }
  })
  rows.sort((a, b) => (b.last?.createdAt || 0) - (a.last?.createdAt || 0))
  res.json(rows)
}))

app.get('/api/messages', requireAuth, wrap(async (req, res) => {
  const peer = Number(req.query.peer)
  const after = Number(req.query.after) || 0
  if (!peer) fail(400, '缺少 peer')
  const list = db.messages
    .filter((m) => ((m.from === req.user.id && m.to === peer) || (m.from === peer && m.to === req.user.id)) && m.id > after)
    .sort((a, b) => a.createdAt - b.createdAt)
  let changed = false
  for (const m of list) {
    if (m.to === req.user.id && !m.readAt) { m.readAt = Date.now(); changed = true }
  }
  if (changed) save()
  res.json(list.map((m) => ({ ...m, mine: m.from === req.user.id })))
}))

app.post('/api/messages', requireAuth, wrap(async (req, res) => {
  const { peerId, content } = req.body || {}
  const to = Number(peerId)
  const text = String(content || '').trim()
  if (!to || !text) fail(400, '消息不能为空')
  if (!db.users.some((u) => u.id === to)) fail(404, '用户不存在')
  const m = { id: uid(), from: req.user.id, to, content: text.slice(0, 2000), createdAt: Date.now(), readAt: null }
  db.messages.push(m)
  save()
  res.json({ ...m, mine: true })
}))

/* ---------------- 成绩墙 media ---------------- */
function mediaView(m) {
  return { ...m, uploader: publicUser(db.users.find((u) => u.id === m.uploaderId)) }
}

app.get('/api/media', wrap(async (req, res) => {
  res.json(db.media.slice().sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0) || b.createdAt - a.createdAt).map(mediaView))
}))

app.post('/api/media', requireAdmin, wrap(async (req, res) => {
  const { type, url, title } = req.body || {}
  if (!url) fail(400, '缺少资源地址')
  const kind = type === 'video' || type === 'image' ? type : 'image'
  const m = {
    id: uid(), type: kind, url: String(url), title: String(title || '').slice(0, 60),
    uploaderId: req.user.id, createdAt: Date.now(),
    sort: db.media.length,
  }
  db.media.push(m)
  save()
  res.json(mediaView(m))
}))

app.put('/api/media/order', requireAdmin, wrap(async (req, res) => {
  const ids = Array.isArray(req.body?.ids) ? req.body.ids.map(Number) : []
  ids.forEach((id, i) => {
    const m = db.media.find((x) => x.id === id)
    if (m) m.sort = i
  })
  save()
  res.json({ ok: true })
}))

app.patch('/api/media/:id', requireAdmin, wrap(async (req, res) => {
  const m = db.media.find((x) => x.id === Number(req.params.id))
  if (!m) fail(404, '不存在')
  if (req.body.title != null) m.title = String(req.body.title).slice(0, 60)
  save()
  res.json(mediaView(m))
}))

app.delete('/api/media/:id', requireAdmin, wrap(async (req, res) => {
  const i = db.media.findIndex((x) => x.id === Number(req.params.id))
  if (i < 0) fail(404, '不存在')
  db.media.splice(i, 1)
  save()
  res.json({ ok: true })
}))

/* ---------------- admin ---------------- */
app.get('/api/admin/stats', requireAdmin, (req, res) => {
  res.json({
    users: db.users.length,
    posts: db.posts.length,
    threads: db.threads.length,
    replies: db.replies.length,
    moments: db.moments.length,
    comments: db.momentComments.length,
    messages: db.messages.length,
    media: db.media.length,
  })
})

app.get('/api/admin/users', requireAdmin, (req, res) => {
  res.json(db.users.map((u) => ({
    ...publicUser(u),
    postCount: db.posts.filter((p) => p.authorId === u.id).length,
    threadCount: db.threads.filter((t) => t.authorId === u.id).length,
    momentCount: db.moments.filter((m) => m.userId === u.id).length,
  })))
})

app.patch('/api/admin/users/:id', requireAdmin, wrap(async (req, res) => {
  const u = db.users.find((x) => x.id === Number(req.params.id))
  if (!u) fail(404, '用户不存在')
  if (u.id === req.user.id && (req.body.role === 'user' || req.body.banned === true)) fail(400, '不能对自己操作')
  if (req.body.role === 'admin' || req.body.role === 'user') u.role = req.body.role
  if (typeof req.body.banned === 'boolean') u.banned = req.body.banned
  save()
  res.json(publicUser(u))
}))

app.post('/api/admin/users/:id/password', requireAdmin, wrap(async (req, res) => {
  const u = db.users.find((x) => x.id === Number(req.params.id))
  if (!u) fail(404, '用户不存在')
  const pw = String(req.body?.password || '')
  if (pw.length < 6) fail(400, '密码至少 6 位')
  setPassword(u, pw)
  save()
  res.json({ ok: true })
}))

app.delete('/api/admin/users/:id', requireAdmin, wrap(async (req, res) => {
  const id = Number(req.params.id)
  if (id === req.user.id) fail(400, '不能删除自己')
  const u = db.users.find((x) => x.id === id)
  if (!u) fail(404, '用户不存在')
  db.users = db.users.filter((x) => x.id !== id)
  db.moments = db.moments.filter((m) => m.userId !== id)
  db.messages = db.messages.filter((m) => m.from !== id && m.to !== id)
  save()
  res.json({ ok: true })
}))

/* ---------------- ai assistant ----------------
 * 双层配置：管理员全局 (db.config.ai) + 用户个人 (db.aiPrefs[userId])
 * 用户逐字段覆盖管理员；OpenAI 兼容协议，地址以 /v1 结尾。
 */
const maskKey = (k) => {
  const s = String(k || '')
  if (!s) return ''
  if (s.length <= 8) return '••••••'
  return `${s.slice(0, 3)}…${s.slice(-4)}`
}

function normBaseUrl(u) {
  let s = String(u || '').trim().replace(/\/+$/, '')
  if (!s) return ''
  if (!/\/v1$/i.test(s)) s += '/v1'
  return s
}

const clampNum = (v, min, max, dflt) => {
  const n = Number(v)
  if (!Number.isFinite(n)) return dflt
  return Math.min(max, Math.max(min, n))
}

function resolveAiFor(user) {
  const a = db.config.ai || {}
  const p = (db.aiPrefs && db.aiPrefs[user.id]) || {}
  const baseUrl = normBaseUrl(p.baseUrl || a.baseUrl || '')
  const apiKey = String(p.apiKey || a.apiKey || '').trim()
  const model = String(p.model || a.model || '').trim() || 'gpt-4o-mini'
  const temperature = clampNum(p.temperature ?? a.temperature, 0, 2, 0.7)
  const top_p = clampNum(p.top_p ?? a.top_p, 0, 1, 1)
  const mtRaw = p.max_tokens ?? a.max_tokens
  const max_tokens =
    mtRaw === '' || mtRaw == null || !Number.isFinite(Number(mtRaw))
      ? 1024
      : clampNum(mtRaw, 1, 100000, 1024)
  const systemPrompt = String(p.systemPrompt || a.systemPrompt || '')
  return { baseUrl, apiKey, model, temperature, top_p, max_tokens, systemPrompt }
}

function aiView(cfg) {
  const c = cfg || {}
  return {
    enabled: c.enabled !== false,
    baseUrl: c.baseUrl || '',
    apiKeyMasked: maskKey(c.apiKey),
    hasKey: !!c.apiKey,
    model: c.model || '',
    temperature: c.temperature ?? 0.7,
    top_p: c.top_p ?? 1,
    max_tokens: c.max_tokens ?? 1024,
    systemPrompt: c.systemPrompt || '',
  }
}

function aiPrefsResponse(user) {
  const a = db.config.ai || {}
  const p = (db.aiPrefs && db.aiPrefs[user.id]) || {}
  const eff = resolveAiFor(user)
  const enabled = a.enabled !== false
  const keyFromUser = !!(p.apiKey || p.baseUrl)
  const using =
    !enabled ? 'none'
    : eff.baseUrl && eff.apiKey ? (keyFromUser ? 'user' : 'admin')
    : 'none'
  return {
    enabled,
    user: aiView(p),
    admin: aiView(a),
    effective: {
      using,
      model: eff.model,
      baseUrl: eff.baseUrl,
      hasKey: !!(eff.baseUrl && eff.apiKey),
    },
  }
}

async function callAi(eff, messages, stream) {
  const ctl = new AbortController()
  const timer = setTimeout(() => ctl.abort(), 180000) // 全程 180s 上限（含响应体）
  const body = {
    model: eff.model,
    messages,
    stream: !!stream,
    temperature: eff.temperature,
    top_p: eff.top_p,
    max_tokens: eff.max_tokens,
  }
  try {
    const r = await fetch(`${eff.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${eff.apiKey}`,
      },
      body: JSON.stringify(body),
      signal: ctl.signal,
    })
    if (!r.ok) {
      clearTimeout(timer)
      let detail = ''
      try {
        detail = (await r.text()).replace(/\s+/g, ' ').slice(0, 240)
      } catch { /* ignore */ }
      const map = {
        400: '请求参数不被接受',
        401: 'API Key 无效或已过期',
        403: '当前 Key 无权访问该接口',
        404: '接口地址或模型名不存在',
        402: '额度不足',
        429: '请求过于频繁或额度用尽',
        500: '提供商服务异常',
        503: '提供商服务繁忙',
      }
      const e = new Error(`${map[r.status] || `提供商返回错误 (HTTP ${r.status})`}${detail ? `：${detail}` : ''}`)
      e.status = r.status >= 500 ? 502 : r.status
      throw e
    }
    // 注意：timer 留给响应体读取（fetch signal 会中断 body）；调用方读完后自然结束
    return { res: r, done: () => clearTimeout(timer) }
  } catch (e) {
    clearTimeout(timer)
    if (e.name === 'AbortError') {
      const t = new Error('上游 API 超时（180s）')
      t.status = 504
      throw t
    }
    if (e.status) throw e
    const n = new Error(`无法连接 API 地址：${e.cause?.message || e.message || '网络错误'}（请检查地址与服务器出网）`)
    n.status = 502
    throw n
  }
}

app.get('/api/ai/prefs', requireAuth, (req, res) => {
  res.json(aiPrefsResponse(req.user))
})

app.put('/api/ai/prefs', requireAuth, wrap(async (req, res) => {
  const b = req.body || {}
  const cur = { ...((db.aiPrefs && db.aiPrefs[req.user.id]) || {}) }
  if ('baseUrl' in b) {
    const u = String(b.baseUrl || '').trim()
    if (u && !/^https?:\/\//i.test(u)) fail(400, 'API 地址需以 http:// 或 https:// 开头')
    cur.baseUrl = u ? normBaseUrl(u) : ''
  }
  if ('apiKey' in b) cur.apiKey = String(b.apiKey || '').trim()
  if ('model' in b) cur.model = String(b.model || '').trim()
  if ('temperature' in b) {
    cur.temperature = b.temperature === '' || b.temperature == null ? undefined : clampNum(b.temperature, 0, 2, 0.7)
  }
  if ('top_p' in b) {
    cur.top_p = b.top_p === '' || b.top_p == null ? undefined : clampNum(b.top_p, 0, 1, 1)
  }
  if ('max_tokens' in b) {
    cur.max_tokens = b.max_tokens === '' || b.max_tokens == null ? undefined : clampNum(b.max_tokens, 1, 100000, 1024)
  }
  if ('systemPrompt' in b) cur.systemPrompt = String(b.systemPrompt || '')
  for (const k of Object.keys(cur)) if (cur[k] === undefined || cur[k] === '') delete cur[k]
  if (!db.aiPrefs) db.aiPrefs = {}
  db.aiPrefs[req.user.id] = cur
  save()
  res.json(aiPrefsResponse(req.user))
}))

function stripThinking(text) {
  if (!text || typeof text !== 'string') return ''
  return text
    .replace(/<(think|thought|thinking)[^>]*>[\s\S]*?<\/\1>/gi, '')
    .replace(/<(think|thought|thinking)[^>]*>[\s\S]*$/gi, '')
    .trim()
}

/**
 * 流式 SSE 思考过程拦截与清洗转换流：
 * 1. 自动过滤 <think>...</think>, <thought>...</thought>, <thinking>...</thinking> 思考块
 * 2. 自动丢弃 delta 中的 reasoning_content / reasoning 独立字段
 * 3. 跨 chunk 状态追踪：思考标签未闭合阶段的所有内容完全丢弃，闭合后立即恢复正文下发
 */
function createThinkingStream() {
  let inThinking = false
  let tagBuffer = ''
  const openTags = ['<think', '<thought', '<thinking']
  const closeTags = ['</think>', '</thought>', '</thinking>']

  function filterText(text) {
    tagBuffer += text
    let output = ''

    while (tagBuffer.length > 0) {
      if (!inThinking) {
        let earliestMatch = null
        for (const tag of openTags) {
          const idx = tagBuffer.toLowerCase().indexOf(tag)
          if (idx !== -1) {
            if (earliestMatch === null || idx < earliestMatch.index) {
              earliestMatch = { index: idx, tag }
            }
          }
        }

        if (earliestMatch === null) {
          let potentialTagLen = 0
          for (let i = 1; i <= Math.min(tagBuffer.length, 10); i++) {
            const tail = tagBuffer.slice(-i).toLowerCase()
            if ('<thinking>'.startsWith(tail) || '<thought>'.startsWith(tail) || '<think>'.startsWith(tail)) {
              potentialTagLen = i
              break
            }
          }
          if (potentialTagLen > 0) {
            output += tagBuffer.slice(0, tagBuffer.length - potentialTagLen)
            tagBuffer = tagBuffer.slice(tagBuffer.length - potentialTagLen)
            break
          } else {
            output += tagBuffer
            tagBuffer = ''
            break
          }
        } else {
          output += tagBuffer.slice(0, earliestMatch.index)
          tagBuffer = tagBuffer.slice(earliestMatch.index)
          const closeBracket = tagBuffer.indexOf('>')
          if (closeBracket !== -1) {
            inThinking = true
            tagBuffer = tagBuffer.slice(closeBracket + 1)
          } else {
            break
          }
        }
      } else {
        let earliestClose = null
        for (const tag of closeTags) {
          const idx = tagBuffer.toLowerCase().indexOf(tag)
          if (idx !== -1) {
            if (earliestClose === null || idx < earliestClose.index) {
              earliestClose = { index: idx, len: tag.length }
            }
          }
        }

        if (earliestClose !== null) {
          inThinking = false
          tagBuffer = tagBuffer.slice(earliestClose.index + earliestClose.len)
          if (tagBuffer.startsWith('\r\n')) tagBuffer = tagBuffer.slice(2)
          else if (tagBuffer.startsWith('\n')) tagBuffer = tagBuffer.slice(1)
        } else {
          let potentialCloseLen = 0
          for (let i = 1; i <= Math.min(tagBuffer.length, 11); i++) {
            const tail = tagBuffer.slice(-i).toLowerCase()
            for (const tag of closeTags) {
              if (tag.startsWith(tail)) {
                potentialCloseLen = Math.max(potentialCloseLen, i)
              }
            }
          }
          if (potentialCloseLen > 0) {
            tagBuffer = tagBuffer.slice(-potentialCloseLen)
          } else {
            tagBuffer = ''
          }
          break
        }
      }
    }
    return output
  }

  function flushText() {
    let out = ''
    if (!inThinking) {
      out = tagBuffer
    }
    tagBuffer = ''
    return out
  }

  let lineBuffer = ''

  return new Transform({
    transform(chunk, encoding, callback) {
      lineBuffer += chunk.toString('utf8')
      let idx
      while ((idx = lineBuffer.indexOf('\n\n')) !== -1) {
        const sseEvent = lineBuffer.slice(0, idx)
        lineBuffer = lineBuffer.slice(idx + 2)

        const lines = sseEvent.split('\n')
        for (const line of lines) {
          if (!line.startsWith('data:')) {
            this.push(line + '\n')
            continue
          }
          const rawData = line.slice(5).trim()
          if (rawData === '[DONE]') {
            const remaining = flushText()
            if (remaining) {
              const fakeChunk = { choices: [{ delta: { content: remaining } }] }
              this.push('data: ' + JSON.stringify(fakeChunk) + '\n\n')
            }
            this.push('data: [DONE]\n\n')
            continue
          }

          try {
            const json = JSON.parse(rawData)
            const choice = json.choices?.[0]
            if (choice?.delta) {
              delete choice.delta.reasoning_content
              delete choice.delta.reasoning

              const content = choice.delta.content
              if (typeof content === 'string') {
                const cleaned = filterText(content)
                if (cleaned) {
                  choice.delta.content = cleaned
                  this.push('data: ' + JSON.stringify(json) + '\n\n')
                }
              } else if (choice.finish_reason) {
                this.push('data: ' + JSON.stringify(json) + '\n\n')
              }
            } else {
              this.push(line + '\n\n')
            }
          } catch {
            this.push(line + '\n\n')
          }
        }
      }
      callback()
    },
    flush(callback) {
      const remaining = flushText()
      if (remaining) {
        const fakeChunk = { choices: [{ delta: { content: remaining } }] }
        this.push('data: ' + JSON.stringify(fakeChunk) + '\n\n')
      }
      if (lineBuffer.trim()) {
        this.push(lineBuffer)
      }
      callback()
    },
  })
}

app.post('/api/ai/chat', requireAuth, wrap(async (req, res) => {
  if (db.config.ai && db.config.ai.enabled === false) fail(403, 'AI 助手已被管理员关闭')
  const eff = resolveAiFor(req.user)
  if (!eff.baseUrl || !eff.apiKey) {
    fail(400, '尚未配置 API —— 请打开 AI 面板「设置」填写你的 API，或联系管理员配置')
  }
  const raw = Array.isArray(req.body?.messages) ? req.body.messages : []
  const msgs = raw
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim())
    .slice(-30)
    .map((m) => ({ role: m.role, content: String(m.content).slice(0, 20000) }))
  if (msgs.length === 0) fail(400, '消息不能为空')
  const messages = []
  if (eff.systemPrompt) messages.push({ role: 'system', content: eff.systemPrompt })
  messages.push(...msgs)

  const stream = req.body?.stream !== false
  const { res: upstream, done } = await callAi(eff, messages, stream)

  if (!stream) {
    const data = await upstream.json().catch(() => null)
    done()
    if (!data) fail(502, '上游返回了无法解析的数据')
    const choice = data.choices?.[0]
    if (choice?.message) {
      if (typeof choice.message.content === 'string') {
        choice.message.content = stripThinking(choice.message.content)
      }
      delete choice.message.reasoning_content
      delete choice.message.reasoning
    }
    return res.json(data)
  }

  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
  res.setHeader('Cache-Control', 'no-cache, no-transform')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no') // 反代（nginx）不缓冲，保证逐字输出
  const node = Readable.fromWeb(upstream.body)
  const filterStream = createThinkingStream()
  node.pipe(filterStream).pipe(res)
  filterStream.on('end', done)
  filterStream.on('error', () => { done(); res.end() })
  res.on('close', () => { done(); node.destroy(); filterStream.destroy() })
}))

app.post('/api/ai/test', requireAuth, wrap(async (req, res) => {
  const eff = resolveAiFor(req.user)
  if (!eff.baseUrl || !eff.apiKey) fail(400, '请先填写 API 地址与 API Key')
  const t0 = Date.now()
  const { res: upstream, done } = await callAi(
    eff,
    [{ role: 'user', content: '请只回复两个字：正常' }],
    false,
  )
  const data = await upstream.json().catch(() => null)
  done()
  if (!data) fail(502, '上游返回了无法解析的数据')
  const rawReply = String(data.choices?.[0]?.message?.content ?? '')
  res.json({
    ok: true,
    ms: Date.now() - t0,
    model: data.model || eff.model,
    reply: stripThinking(rawReply).slice(0, 200) || '正常',
  })
}))

/* ---------------- static & spa ---------------- */
app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '7d' }))
if (fs.existsSync(DIST)) {
  app.use(express.static(DIST, { index: false, maxAge: '1h' }))
}
app.use((req, res, next) => {
  if (req.method !== 'GET' || req.path.startsWith('/api') || req.path.startsWith('/uploads')) return next()
  const indexFile = path.join(DIST, 'index.html')
  if (!fs.existsSync(indexFile)) return next()
  res.sendFile(indexFile)
})
app.use('/api', (req, res) => res.status(404).json({ error: '接口不存在' }))

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const status = err.status || (err.name === 'MulterError' ? 400 : 500)
  if (status >= 500) console.error('[server]', err)
  res.status(status).json({ error: err.message || '服务器错误' })
})

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[FYX] server ready on http://0.0.0.0:${PORT}`)
})
