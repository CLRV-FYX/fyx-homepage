import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Loader2, Send, Settings2, Sparkles, Trash2, X, Zap } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { useConfig } from '@/lib/config'
import { useCopy } from '@/lib/copy'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Textarea } from '@/components/ui/textarea'
import { MdInline } from '@/components/Md'
import type { AiConfig, AiPrefsView } from '@/lib/types'

interface Msg {
  role: 'user' | 'assistant'
  content: string
}

const LS_MSGS = 'fyx_ai_msgs'

function readToken() {
  return localStorage.getItem('fyx_token') || ''
}

/** POST /api/ai/chat 并解析 SSE，逐段回调 delta */
async function streamChat(messages: Msg[], onDelta: (s: string) => void) {
  const res = await fetch('/api/ai/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${readToken()}`,
    },
    body: JSON.stringify({ messages, stream: true }),
  })
  if (!res.ok || !res.body) {
    let msg = `请求失败 (HTTP ${res.status})`
    try {
      msg = (await res.json()).error || msg
    } catch { /* ignore */ }
    throw new Error(msg)
  }
  const reader = res.body.getReader()
  const dec = new TextDecoder()
  let buf = ''
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    buf += dec.decode(value, { stream: true })
    let idx: number
    while ((idx = buf.indexOf('\n\n')) !== -1) {
      const chunk = buf.slice(0, idx)
      buf = buf.slice(idx + 2)
      for (const line of chunk.split('\n')) {
        if (!line.startsWith('data:')) continue
        const data = line.slice(5).trim()
        if (data === '[DONE]') return
        try {
          const j = JSON.parse(data)
          const d = j.choices?.[0]?.delta?.content
          if (d) onDelta(String(d))
        } catch { /* keep-alive / partial */ }
      }
    }
  }
}

function emptyPrefs(): AiPrefsView {
  return {
    enabled: true,
    user: {},
    admin: {},
    effective: { using: 'none', model: '', baseUrl: '', hasKey: false },
  }
}

/** 数字参数编辑行（滑杆 + 数值） */
function SliderField({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (v: number) => void
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label className="text-[12px] text-white/60">{label}</Label>
        <span className="mono text-[11px] text-[var(--fyx-accent)]">{value}</span>
      </div>
      <Slider value={[value]} min={min} max={max} step={step} onValueChange={(v) => onChange(v[0])} />
    </div>
  )
}

export default function AiAssistant() {
  const { config, reload } = useConfig()
  const { user } = useAuth()
  const t = useCopy()
  const navigate = useNavigate()

  const [open, setOpen] = useState(false)
  const [view, setView] = useState<'chat' | 'settings'>('chat')
  const [tab, setTab] = useState<'mine' | 'admin'>('mine')
  const [prefs, setPrefs] = useState<AiPrefsView>(emptyPrefs())
  const [prefsLoaded, setPrefsLoaded] = useState(false)

  const [msgs, setMsgs] = useState<Msg[]>(() => {
    try {
      const raw = localStorage.getItem(LS_MSGS)
      const list = raw ? (JSON.parse(raw) as Msg[]) : []
      return Array.isArray(list) ? list.slice(-40) : []
    } catch {
      return []
    }
  })
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const [streaming, setStreaming] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const taRef = useRef<HTMLTextAreaElement>(null)

  // 管理员/用户配置草稿
  const [mine, setMine] = useState<Partial<AiConfig>>({})
  const [mineKey, setMineKey] = useState('') // 只在用户输入时提交
  const [admin, setAdmin] = useState<Partial<AiConfig>>({})
  const [adminKey, setAdminKey] = useState('')
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)

  const aiEnabled = config.ai?.enabled !== false

  useEffect(() => {
    localStorage.setItem(LS_MSGS, JSON.stringify(msgs.slice(-40)))
  }, [msgs])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [msgs, busy, streaming])

  useEffect(() => {
    if (!open || !user || prefsLoaded) return
    api<AiPrefsView>('/api/ai/prefs')
      .then((p) => {
        setPrefs(p)
        setMine({
          baseUrl: p.user.baseUrl || '',
          model: p.user.model || '',
          temperature: p.user.temperature ?? 0.7,
          top_p: p.user.top_p ?? 1,
          max_tokens: p.user.max_tokens ?? 1024,
          systemPrompt: p.user.systemPrompt || '',
        })
        setAdmin({
          enabled: p.admin.enabled !== false,
          baseUrl: p.admin.baseUrl || '',
          model: p.admin.model || '',
          temperature: p.admin.temperature ?? 0.7,
          top_p: p.admin.top_p ?? 1,
          max_tokens: p.admin.max_tokens ?? 1024,
          systemPrompt: p.admin.systemPrompt || '',
        })
        setPrefsLoaded(true)
      })
      .catch(() => setPrefsLoaded(true))
  }, [open, user, prefsLoaded])

  if (!aiEnabled) return null

  const usingLabel =
    prefs.effective.using === 'admin'
      ? t('ai.usingAdmin')
      : prefs.effective.using === 'user'
        ? t('ai.usingMine')
        : t('ai.usingNone')

  const send = async () => {
    const text = draft.trim()
    if (!text || busy) return
    if (!user) {
      navigate('/login')
      return
    }
    const history = [...msgs, { role: 'user' as const, content: text }]
    setMsgs(history)
    setDraft('')
    setBusy(true)
    setStreaming(true)
    let acc = ''
    let started = false
    try {
      await streamChat(history, (d) => {
        if (!started) {
          started = true
          setMsgs((l) => [...l, { role: 'assistant', content: d }])
          acc = d
        } else {
          acc += d
          setMsgs((l) => {
            const next = [...l]
            next[next.length - 1] = { role: 'assistant', content: acc }
            return next
          })
        }
      })
      if (!started) {
        // 上游没给内容（例如只回了 role）——给个空助手帧避免卡在 loading
        setMsgs((l) => [...l, { role: 'assistant', content: '…' }])
      }
    } catch (e) {
      toast.error((e as Error).message)
      if (started) {
        setMsgs((l) => {
          const next = [...l]
          next[next.length - 1] = { role: 'assistant', content: `${acc}\n\n⚠️ ${(e as Error).message}` }
          return next
        })
      }
    } finally {
      setBusy(false)
      setStreaming(false)
    }
  }

  const saveMine = async () => {
    setSaving(true)
    try {
      const body: Record<string, unknown> = { ...mine }
      if (mineKey.trim()) body.apiKey = mineKey.trim()
      const p = await api<AiPrefsView>('/api/ai/prefs', { method: 'PUT', body })
      setPrefs(p)
      setMineKey('')
      toast.success(t('ai.saved'))
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const clearMineKey = async () => {
    try {
      const p = await api<AiPrefsView>('/api/ai/prefs', { method: 'PUT', body: { apiKey: '' } })
      setPrefs(p)
      toast.success(t('ai.saved'))
    } catch (e) {
      toast.error((e as Error).message)
    }
  }

  const clearAdminKey = async () => {
    if (!isAdmin) return
    try {
      await api('/api/config', { method: 'PUT', body: { ai: { ...admin, apiKey: '' } } })
      const p = await api<AiPrefsView>('/api/ai/prefs')
      setPrefs(p)
      void reload()
      toast.success(t('ai.saved'))
    } catch (e) {
      toast.error((e as Error).message)
    }
  }

  const saveAdmin = async () => {
    if (!user || user.role !== 'admin') return
    setSaving(true)
    try {
      const body: Record<string, unknown> = { ...admin }
      if (adminKey.trim()) body.apiKey = adminKey.trim()
      await api<Record<string, unknown>>('/api/config', { method: 'PUT', body: { ai: body } })
      const p = await api<AiPrefsView>('/api/ai/prefs')
      setPrefs(p)
      setAdminKey('')
      void reload()
      toast.success(t('ai.saved'))
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const test = async () => {
    setTesting(true)
    try {
      const r = await api<{ ms: number; model: string }>('/api/ai/test', { method: 'POST' })
      toast.success(t('ai.testOk', { ms: r.ms, model: r.model }))
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setTesting(false)
    }
  }

  const isAdmin = user?.role === 'admin'

  const renderConfigForm = (scope: 'mine' | 'admin') => {
    const data = scope === 'mine' ? mine : admin
    const set = scope === 'mine' ? setMine : setAdmin
    const keyVal = scope === 'mine' ? mineKey : adminKey
    const setKey = scope === 'mine' ? setMineKey : setAdminKey
    const savedMask = scope === 'mine' ? prefs.user.apiKeyMasked : prefs.admin.apiKeyMasked
    const hasKey = scope === 'mine' ? prefs.user.hasKey : prefs.admin.hasKey
    const readOnly = scope === 'admin' && !isAdmin

    return (
      <div className="space-y-4">
        {scope === 'admin' && (
          <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/3 px-3 py-2">
            <span className="text-[12px] text-white/60">启用 AI 助手</span>
            <input
              type="checkbox"
              checked={data.enabled !== false}
              disabled={readOnly}
              onChange={(e) => set({ ...data, enabled: e.target.checked })}
              className="size-4 accent-[var(--fyx-accent)]"
            />
          </div>
        )}

        <div className="space-y-1.5">
          <Label className="text-[12px] text-white/60">{t('ai.addrLabel')}</Label>
          <Input
            value={data.baseUrl || ''}
            disabled={readOnly}
            placeholder={t('ai.addrPh')}
            onChange={(e) => set({ ...data, baseUrl: e.target.value })}
            className="text-[13px]"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-[12px] text-white/60">{t('ai.keyLabel')}</Label>
          <div className="flex gap-2">
            <Input
              type="password"
              value={keyVal}
              disabled={readOnly}
              placeholder={hasKey ? t('ai.keyKeepHint', { mask: savedMask || '••••' }) : 'sk-…'}
              onChange={(e) => setKey(e.target.value)}
              className="text-[13px]"
            />
            {hasKey && !readOnly && (
              <Button
                variant="outline"
                size="sm"
                onClick={scope === 'mine' ? clearMineKey : clearAdminKey}
                className="shrink-0"
              >
                {t('ai.clearKey')}
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-[12px] text-white/60">{t('ai.modelLabel')}</Label>
          <Input
            value={data.model || ''}
            disabled={readOnly}
            placeholder={t('ai.modelPh')}
            onChange={(e) => set({ ...data, model: e.target.value })}
            className="text-[13px]"
          />
        </div>

        <SliderField
          label={t('ai.tempLabel')}
          value={Number(data.temperature ?? 0.7)}
          min={0}
          max={2}
          step={0.1}
          onChange={(v) => set({ ...data, temperature: v })}
        />
        <SliderField
          label={t('ai.toppLabel')}
          value={Number(data.top_p ?? 1)}
          min={0}
          max={1}
          step={0.05}
          onChange={(v) => set({ ...data, top_p: v })}
        />
        <div className="space-y-1.5">
          <Label className="text-[12px] text-white/60">{t('ai.maxLabel')}</Label>
          <Input
            type="number"
            min={1}
            max={100000}
            value={String(data.max_tokens ?? 1024)}
            disabled={readOnly}
            onChange={(e) => set({ ...data, max_tokens: Number(e.target.value) })}
            className="text-[13px]"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-[12px] text-white/60">{t('ai.sysLabel')}</Label>
          <Textarea
            rows={3}
            value={data.systemPrompt || ''}
            disabled={readOnly}
            placeholder="You are a helpful assistant…"
            onChange={(e) => set({ ...data, systemPrompt: e.target.value })}
            className="text-[13px]"
          />
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          <Button
            size="sm"
            disabled={saving || readOnly}
            onClick={scope === 'mine' ? saveMine : saveAdmin}
            className="rounded-full bg-[var(--fyx-accent)] text-black hover:opacity-90"
          >
            {saving && <Loader2 className="size-3.5 animate-spin" />}
            {t('ai.save')}
          </Button>
          <Button size="sm" variant="outline" disabled={testing} onClick={test} className="rounded-full">
            {testing ? <Loader2 className="size-3.5 animate-spin" /> : <Zap className="size-3.5" />}
            {t('ai.test')}
          </Button>
        </div>
        {readOnly && <p className="mono text-[10px] text-white/35">{t('ai.readonly')}</p>}
      </div>
    )
  }

  return (
    <>
      {/* 浮动按钮 */}
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 2.4 }}
        onClick={() => {
          setOpen((o) => !o)
          setView('chat')
        }}
        className="fixed bottom-4 left-4 z-[150] grid size-12 place-items-center rounded-full border border-[var(--fyx-accent)]/50 bg-[#0d0d0d]/95 text-[var(--fyx-accent)] shadow-2xl backdrop-blur transition hover:bg-[var(--fyx-accent)] hover:text-black"
        title={t('ai.title')}
        aria-label={t('ai.title')}
      >
        <Sparkles className="size-5" />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.22 }}
            className="fixed bottom-20 left-4 z-[151] flex w-[min(24rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-white/12 bg-[#0d0d0d]/97 shadow-2xl backdrop-blur-xl"
            style={{ height: 'min(34rem, calc(100vh - 7rem))' }}
          >
            {/* 头部 */}
            <div className="flex items-center gap-2 border-b border-white/8 px-4 py-3">
              <div className="grid size-7 place-items-center rounded-lg bg-[var(--fyx-accent)]/15">
                <Sparkles className="size-4 text-[var(--fyx-accent)]" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-bold text-white">
                  {t('ai.title')}
                  <span className="mono ml-2 text-[8px] tracking-widest text-white/30">{t('ai.en')}</span>
                </div>
                <div className="mono truncate text-[9px] tracking-wider text-white/35">
                  {prefs.effective.model ? `${usingLabel} · ${prefs.effective.model}` : usingLabel}
                </div>
              </div>
              <button
                onClick={() => setMsgs([])}
                className="rounded-lg p-1.5 text-white/40 transition hover:bg-white/6 hover:text-white"
                title={t('ai.clear')}
                aria-label={t('ai.clear')}
              >
                <Trash2 className="size-4" />
              </button>
              <button
                onClick={() => setView((v) => (v === 'settings' ? 'chat' : 'settings'))}
                className={`rounded-lg p-1.5 transition hover:bg-white/6 ${view === 'settings' ? 'text-[var(--fyx-accent)]' : 'text-white/40 hover:text-white'}`}
                title={t('ai.settings')}
                aria-label={t('ai.settings')}
              >
                <Settings2 className="size-4" />
              </button>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 text-white/40 transition hover:bg-white/6 hover:text-white"
                aria-label="close"
              >
                <X className="size-4" />
              </button>
            </div>

            {view === 'settings' ? (
              <div className="flex-1 overflow-y-auto p-4">
                <div className="mono mb-4 flex gap-1 rounded-full border border-white/10 bg-white/3 p-1 text-[11px] tracking-widest">
                  <button
                    onClick={() => setTab('mine')}
                    className={`flex-1 rounded-full py-1.5 transition ${tab === 'mine' ? 'bg-[var(--fyx-accent)] text-black' : 'text-white/50 hover:text-white'}`}
                  >
                    {t('ai.mineTab')}
                  </button>
                  <button
                    onClick={() => setTab('admin')}
                    className={`flex-1 rounded-full py-1.5 transition ${tab === 'admin' ? 'bg-[var(--fyx-accent)] text-black' : 'text-white/50 hover:text-white'}`}
                  >
                    {t('ai.adminTab')}
                  </button>
                </div>
                {tab === 'admin' && !isAdmin ? (
                  <p className="mono text-[11px] text-white/40">{t('ai.readonly')}</p>
                ) : (
                  renderConfigForm(tab === 'mine' ? 'mine' : 'admin')
                )}
                <p className="mt-4 border-t border-white/8 pt-3 text-[11px] leading-relaxed text-white/35">
                  {t('ai.notConfiguredDesc')}
                </p>
              </div>
            ) : !user ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
                <p className="text-sm font-semibold text-white">{t('ai.guestTitle')}</p>
                <p className="text-[12px] text-white/45">{t('ai.guestDesc')}</p>
                <Button
                  onClick={() => navigate('/login')}
                  className="mt-2 rounded-full bg-[var(--fyx-accent)] text-black hover:opacity-90"
                >
                  {t('chat.guestBtn')}
                </Button>
              </div>
            ) : (
              <>
                {!prefs.effective.hasKey && (
                  <button
                    onClick={() => setView('settings')}
                    className="border-b border-white/8 bg-[var(--fyx-accent)]/8 px-4 py-2.5 text-left text-[11px] leading-relaxed text-white/60 transition hover:bg-[var(--fyx-accent)]/15"
                  >
                    <span className="font-semibold text-[var(--fyx-accent)]">{t('ai.notConfigured')}</span>
                    {' — '}
                    {t('ai.notConfiguredDesc')}
                  </button>
                )}

                {/* 消息区 */}
                <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
                  {msgs.length === 0 && (
                    <div className="grid h-full place-items-center px-4 text-center text-[12px] leading-relaxed text-white/35">
                      {t('ai.notConfiguredDesc')}
                    </div>
                  )}
                  {msgs.map((m, i) => (
                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[13.5px] leading-relaxed break-words ${
                          m.role === 'user'
                            ? 'rounded-br-md bg-[var(--fyx-accent)] whitespace-pre-wrap text-black'
                            : 'rounded-bl-md border border-white/8 bg-white/6 text-white/85'
                        }`}
                      >
                        {m.role === 'user' ? m.content : <MdInline text={m.content} breaks />}
                      </div>
                    </div>
                  ))}
                  {busy && msgs[msgs.length - 1]?.role === 'user' && (
                    <div className="flex justify-start">
                      <div className="rounded-2xl rounded-bl-md border border-white/8 bg-white/6 px-4 py-3">
                        <span className="inline-flex gap-1">
                          <i className="size-1.5 animate-bounce rounded-full bg-white/50 [animation-delay:0ms]" />
                          <i className="size-1.5 animate-bounce rounded-full bg-white/50 [animation-delay:150ms]" />
                          <i className="size-1.5 animate-bounce rounded-full bg-white/50 [animation-delay:300ms]" />
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* 输入区 */}
                <div className="flex gap-2 border-t border-white/8 p-3">
                  <textarea
                    ref={taRef}
                    rows={1}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        void send()
                      }
                    }}
                    placeholder={t('ai.ph')}
                    className="max-h-28 min-h-10 flex-1 resize-none rounded-xl border border-white/10 bg-white/4 px-3 py-2.5 text-[13px] text-white outline-none placeholder:text-white/30 focus:border-[var(--fyx-accent)]/50"
                  />
                  <Button
                    onClick={() => void send()}
                    disabled={busy || !draft.trim()}
                    size="icon"
                    className="size-10 shrink-0 rounded-xl bg-[var(--fyx-accent)] text-black hover:opacity-90"
                    aria-label={t('ai.send')}
                  >
                    {busy ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                  </Button>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
