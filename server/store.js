import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { defaultConfig, seedPosts, seedThreads } from './default-config.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
export const DATA_DIR = path.join(__dirname, 'data')
export const UPLOAD_DIR = path.join(DATA_DIR, 'uploads')
fs.mkdirSync(DATA_DIR, { recursive: true })
fs.mkdirSync(UPLOAD_DIR, { recursive: true })

const DB_PATH = path.join(DATA_DIR, 'db.json')
const SECRET_PATH = path.join(DATA_DIR, 'secret')

export const secret = (() => {
  if (fs.existsSync(SECRET_PATH)) return fs.readFileSync(SECRET_PATH, 'utf8').trim()
  const s = crypto.randomBytes(32).toString('hex')
  fs.writeFileSync(SECRET_PATH, s)
  return s
})()

function hashPassword(password, salt) {
  return crypto.scryptSync(String(password), salt, 64).toString('hex')
}

function freshDb() {
  const salt = crypto.randomBytes(16).toString('hex')
  const now = Date.now()
  const db = {
    nextId: 1000,
    users: [
      {
        id: 1,
        username: 'fyx',
        salt,
        hash: hashPassword('fyx2026', salt),
        role: 'admin',
        banned: false,
        createdAt: now,
      },
    ],
    config: JSON.parse(JSON.stringify(defaultConfig)),
    posts: [],
    threads: [],
    replies: [],
    moments: [],
    momentComments: [],
    momentLikes: [],
    messages: [],
    media: [],
    aiPrefs: {},
  }
  // 种子：博客
  for (const p of seedPosts) {
    db.posts.push({
      id: db.nextId++,
      authorId: 1,
      title: p.title,
      tags: p.tags,
      cover: p.cover,
      content: p.content,
      published: p.published,
      createdAt: now,
      updatedAt: now,
    })
  }
  // 种子：论坛
  for (const t of seedThreads) {
    const tid = db.nextId++
    db.threads.push({
      id: tid,
      boardId: t.boardId,
      authorId: 1,
      title: t.title,
      content: t.content,
      pinned: false,
      locked: false,
      createdAt: now,
      lastReplyAt: now,
    })
    for (const r of t.replies || []) {
      db.replies.push({
        id: db.nextId++,
        threadId: tid,
        authorId: 1,
        content: r.content,
        createdAt: now,
      })
    }
  }
  return db
}

function load() {
  if (!fs.existsSync(DB_PATH)) {
    const db = freshDb()
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2))
    return db
  }
  try {
    const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'))
    // 补齐新增字段
    db.config = { ...JSON.parse(JSON.stringify(defaultConfig)), ...(db.config || {}) }
    for (const k of ['posts', 'threads', 'replies', 'moments', 'momentComments', 'momentLikes', 'messages', 'media', 'users']) {
      if (!Array.isArray(db[k])) db[k] = []
    }
    if (!Array.isArray(db.config.boards)) db.config.boards = defaultConfig.boards
    // 用户级 AI API 偏好（按 userId 存），与用户资料分离避免泄漏
    if (!db.aiPrefs || typeof db.aiPrefs !== 'object' || Array.isArray(db.aiPrefs)) db.aiPrefs = {}
    return db
  } catch (e) {
    console.error('[store] db.json 解析失败，备份后重建', e)
    fs.copyFileSync(DB_PATH, DB_PATH + '.bak-' + Date.now())
    const db = freshDb()
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2))
    return db
  }
}

export const db = load()

let saveTimer = null
export function save() {
  if (saveTimer) return
  saveTimer = setTimeout(() => {
    saveTimer = null
    const tmp = DB_PATH + '.tmp'
    fs.writeFileSync(tmp, JSON.stringify(db, null, 2))
    fs.renameSync(tmp, DB_PATH)
  }, 40)
}

export function uid() {
  db.nextId += 1
  return db.nextId
}

export function publicUser(u) {
  if (!u) return null
  return { id: u.id, username: u.username, role: u.role, banned: !!u.banned, createdAt: u.createdAt }
}

export function verifyPassword(user, password) {
  const h = hashPassword(password, user.salt)
  const a = Buffer.from(h, 'hex')
  const b = Buffer.from(user.hash, 'hex')
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}

export function setPassword(user, password) {
  user.salt = crypto.randomBytes(16).toString('hex')
  user.hash = hashPassword(password, user.salt)
}
