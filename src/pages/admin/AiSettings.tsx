import { useEffect, useState } from 'react'
import { Loader2, Save, Zap } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { useConfig } from '@/lib/config'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Textarea } from '@/components/ui/textarea'
import type { AiConfig, AiPrefsView, SiteConfig } from '@/lib/types'

/**
 * AI 设置（管理员）：全局 API 地址（/v1）、Key、模型与默认多参数。
 * 与用户个人配置逐字段叠加：用户填过的字段以用户为准。
 */
export default function AiSettings() {
  const { config, setConfigLocal, reload } = useConfig()
  const [draft, setDraft] = useState<AiConfig>({})
  const [keyInput, setKeyInput] = useState('')
  const [keyMasked, setKeyMasked] = useState('')
  const [hasKey, setHasKey] = useState(false)
  const [busy, setBusy] = useState(false)
  const [testing, setTesting] = useState(false)

  useEffect(() => {
    const a = (config.ai as AiConfig | undefined) || {}
    setDraft({
      enabled: a.enabled !== false,
      baseUrl: a.baseUrl || '',
      model: a.model || '',
      temperature: a.temperature ?? 0.7,
      top_p: a.top_p ?? 1,
      max_tokens: a.max_tokens ?? 1024,
      systemPrompt: a.systemPrompt || '',
    })
  }, [config])

  useEffect(() => {
    api<AiPrefsView>('/api/ai/prefs')
      .then((p) => {
        setKeyMasked(p.admin.apiKeyMasked || '')
        setHasKey(!!p.admin.hasKey)
      })
      .catch(() => {})
  }, [])

  const save = async () => {
    setBusy(true)
    try {
      const ai: Record<string, unknown> = { ...draft }
      if (keyInput.trim()) ai.apiKey = keyInput.trim()
      const next = await api<SiteConfig>('/api/config', { method: 'PUT', body: { ai } })
      setConfigLocal(next)
      setKeyInput('')
      toast.success('AI 配置已保存')
      void reload()
      // 刷新脱敏视图
      api<AiPrefsView>('/api/ai/prefs')
        .then((p) => {
          setKeyMasked(p.admin.apiKeyMasked || '')
          setHasKey(!!p.admin.hasKey)
        })
        .catch(() => {})
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const clearKey = async () => {
    try {
      const next = await api<SiteConfig>('/api/config', { method: 'PUT', body: { ai: { ...draft, apiKey: '' } } })
      setConfigLocal(next)
      setHasKey(false)
      setKeyMasked('')
      toast.success('已清除 API Key')
      void reload()
    } catch (e) {
      toast.error((e as Error).message)
    }
  }

  const test = async () => {
    setTesting(true)
    try {
      const r = await api<{ ms: number; model: string; reply: string }>('/api/ai/test', { method: 'POST' })
      toast.success(`连接成功 · ${r.ms}ms · ${r.model} · 「${r.reply || '正常'}」`)
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="mono text-[10px] tracking-[0.35em] text-white/40">AI SETTINGS</div>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-white">AI 设置</h1>
          <p className="mt-1 max-w-xl text-[12px] leading-relaxed text-white/45">
            全局 API（OpenAI 兼容，地址以 /v1 结尾）。用户可在右下角 AI 面板填写自己的 API，
            逐字段覆盖这里的配置；模型、温度、top_p、max_tokens、系统提示词均为可调参数。
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={test} disabled={testing} className="rounded-full">
            {testing ? <Loader2 className="size-4 animate-spin" /> : <Zap className="size-4" />}
            测试连接
          </Button>
          <Button onClick={save} disabled={busy} className="rounded-full bg-[var(--fyx-accent)] text-black hover:opacity-90">
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} 保存全部
          </Button>
        </div>
      </div>

      <section className="rounded-2xl border border-white/8 bg-[#0e0e0e] p-5 sm:p-6">
        <label className="mb-5 flex items-center justify-between rounded-xl border border-white/10 bg-white/3 px-4 py-3">
          <span className="text-[13px] text-white/70">启用 AI 助手（前台右下角浮窗）</span>
          <input
            type="checkbox"
            checked={draft.enabled !== false}
            onChange={(e) => setDraft((d) => ({ ...d, enabled: e.target.checked }))}
            className="size-4 accent-[var(--fyx-accent)]"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-[12px] text-white/60">API 地址（以 /v1 结尾）</Label>
            <Input
              value={draft.baseUrl || ''}
              placeholder="https://api.openai.com/v1"
              onChange={(e) => setDraft((d) => ({ ...d, baseUrl: e.target.value }))}
              className="text-[13px]"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[12px] text-white/60">API Key</Label>
            <div className="flex gap-2">
              <Input
                type="password"
                value={keyInput}
                placeholder={hasKey ? `已保存（${keyMasked || '••••'}）· 留空保持不变` : 'sk-…'}
                onChange={(e) => setKeyInput(e.target.value)}
                className="text-[13px]"
              />
              {hasKey && (
                <Button variant="outline" size="sm" onClick={clearKey} className="shrink-0">
                  清除
                </Button>
              )}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[12px] text-white/60">默认模型</Label>
            <Input
              value={draft.model || ''}
              placeholder="gpt-4o-mini / deepseek-chat / qwen-plus…"
              onChange={(e) => setDraft((d) => ({ ...d, model: e.target.value }))}
              className="text-[13px]"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[12px] text-white/60">最大输出 max_tokens</Label>
            <Input
              type="number"
              min={1}
              max={100000}
              value={String(draft.max_tokens ?? 1024)}
              onChange={(e) => setDraft((d) => ({ ...d, max_tokens: Number(e.target.value) }))}
              className="text-[13px]"
            />
          </div>
        </div>

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-[12px] text-white/60">温度 temperature（0–2）</Label>
              <span className="mono text-[11px] text-[var(--fyx-accent)]">{draft.temperature ?? 0.7}</span>
            </div>
            <Slider
              value={[Number(draft.temperature ?? 0.7)]}
              min={0}
              max={2}
              step={0.1}
              onValueChange={(v) => setDraft((d) => ({ ...d, temperature: v[0] }))}
            />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-[12px] text-white/60">采样 top_p（0–1）</Label>
              <span className="mono text-[11px] text-[var(--fyx-accent)]">{draft.top_p ?? 1}</span>
            </div>
            <Slider
              value={[Number(draft.top_p ?? 1)]}
              min={0}
              max={1}
              step={0.05}
              onValueChange={(v) => setDraft((d) => ({ ...d, top_p: v[0] }))}
            />
          </div>
        </div>

        <div className="mt-5 space-y-1.5">
          <Label className="text-[12px] text-white/60">系统提示词 system prompt（全局默认，用户可覆盖）</Label>
          <Textarea
            rows={3}
            value={draft.systemPrompt || ''}
            onChange={(e) => setDraft((d) => ({ ...d, systemPrompt: e.target.value }))}
            placeholder="你是本站的 AI 助手…"
            className="text-[13px]"
          />
        </div>

        <p className="mono mt-5 border-t border-white/8 pt-4 text-[10px] leading-relaxed tracking-wider text-white/30">
          KEY 仅存于服务器 server/data/db.json，不会下发给浏览器（公开配置接口已脱敏）。建议在「安全」里修改管理员密码。
        </p>
      </section>
    </div>
  )
}
