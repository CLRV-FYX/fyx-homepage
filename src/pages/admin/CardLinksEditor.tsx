import { useEffect, useState } from 'react'
import { ArrowDown, ArrowUp, Loader2, Plus, Save, Trash2, Upload } from 'lucide-react'
import { api, uploadFile } from '@/lib/api'
import { useConfig } from '@/lib/config'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import type { CardLink, SiteConfig } from '@/lib/types'

/**
 * 图片卡栏目编辑器 —— 「开源项目」与「网站推荐」共用。
 * 条目：名称 / 跳转地址 / 图片（上传）/ 简介(Markdown) / 标签 / 角标 / 排序
 */
export default function CardLinksEditor({
  cfgKey,
  title,
  en,
  hint,
  nameLabel,
  urlLabel,
  urlPh,
}: {
  cfgKey: 'oss' | 'links'
  title: string
  en: string
  hint: string
  nameLabel: string
  urlLabel: string
  urlPh?: string
}) {
  const { config, setConfigLocal, reload } = useConfig()
  const [items, setItems] = useState<CardLink[]>([])
  const [busy, setBusy] = useState(false)
  const [uploading, setUploading] = useState('')

  useEffect(() => {
    const list = (config[cfgKey] as CardLink[] | undefined) || []
    setItems(list.map((i) => ({ ...i, tags: i.tags || [] })))
  }, [config, cfgKey])

  const patch = (i: number, p: Partial<CardLink>) =>
    setItems((l) => l.map((it, j) => (j === i ? { ...it, ...p } : it)))

  const move = (i: number, dir: -1 | 1) =>
    setItems((l) => {
      const j = i + dir
      if (j < 0 || j >= l.length) return l
      const next = [...l]
      ;[next[i], next[j]] = [next[j], next[i]]
      return next
    })

  const pickImage = async (i: number, file: File | undefined) => {
    if (!file) return
    setUploading(String(i))
    try {
      const r = await uploadFile(file)
      patch(i, { image: r.url })
      toast.success('图片已上传')
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setUploading('')
    }
  }

  const save = async () => {
    for (const [idx, it] of items.entries()) {
      if (!it.name.trim()) return toast.error(`第 ${idx + 1} 项缺少名称`)
      if (!/^https?:\/\//.test(it.url || '') && !String(it.url || '').startsWith('/')) {
        return toast.error(`第 ${idx + 1} 项地址需以 http(s):// 或 / 开头`)
      }
    }
    setBusy(true)
    try {
      const next = await api<SiteConfig>('/api/config', { method: 'PUT', body: { [cfgKey]: items } })
      setConfigLocal(next)
      toast.success('已保存')
      void reload()
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="mono text-[10px] tracking-[0.35em] text-white/40">{en}</div>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-white">{title}</h1>
          <p className="mt-1 text-[12px] text-white/45">{hint}</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() =>
              setItems((l) => [
                ...l,
                { id: `${cfgKey}-${Date.now()}`, name: '新项目', url: 'https://', desc: '', image: '', tags: [], badge: '' },
              ])
            }
          >
            <Plus /> 添加
          </Button>
          <Button onClick={save} disabled={busy} className="rounded-full bg-[var(--fyx-accent)] text-black hover:opacity-90">
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} 保存全部
          </Button>
        </div>
      </div>

      {items.length === 0 && (
        <div className="rounded-2xl border border-dashed border-white/12 p-12 text-center text-sm text-white/45">
          还没有内容 —— 点右上角「添加」，前台会自动出现这一栏。
        </div>
      )}

      <div className="space-y-4 pb-8">
        {items.map((it, i) => (
          <section key={it.id || i} className="rounded-2xl border border-white/8 bg-[#0e0e0e] p-5">
            <div className="mb-4 flex items-center justify-between">
              <span className="mono text-[10px] tracking-[0.3em] text-white/35">
                NO.{String(i + 1).padStart(2, '0')}
              </span>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" onClick={() => move(i, -1)} disabled={i === 0} aria-label="上移">
                  <ArrowUp className="size-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => move(i, 1)} disabled={i === items.length - 1} aria-label="下移">
                  <ArrowDown className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setItems((l) => l.filter((_, j) => j !== i))}
                  className="text-red-400 hover:text-red-400"
                  aria-label="删除"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-[12px] text-white/60">{nameLabel}</Label>
                <Input value={it.name} onChange={(e) => patch(i, { name: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[12px] text-white/60">{urlLabel}</Label>
                <Input
                  value={it.url}
                  placeholder={urlPh}
                  onChange={(e) => patch(i, { url: e.target.value })}
                  className="text-[13px]"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-[12px] text-white/60">封面图（点击上传）</Label>
                <div className="flex gap-2">
                  <Input
                    value={it.image || ''}
                    placeholder="/images/… 或上传"
                    onChange={(e) => patch(i, { image: e.target.value })}
                    className="text-[13px]"
                  />
                  <label
                    className={`flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-white/12 px-3 text-[12px] text-white/60 transition hover:border-[var(--fyx-accent)]/50 hover:text-white ${
                      uploading === String(i) ? 'pointer-events-none opacity-60' : ''
                    }`}
                  >
                    {uploading === String(i) ? <Loader2 className="size-3.5 animate-spin" /> : <Upload className="size-3.5" />}
                    上传
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={uploading === String(i)}
                      onChange={(e) => {
                        const f = e.target.files?.[0]
                        e.target.value = ''
                        void pickImage(i, f)
                      }}
                    />
                  </label>
                </div>
                {it.image && (
                  <div className="mt-1 h-24 overflow-hidden rounded-lg border border-white/10">
                    <img src={it.image} alt="" className="h-full w-full object-cover" />
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="grid gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[12px] text-white/60">标签（逗号分隔）</Label>
                    <Input
                      value={(it.tags || []).join(', ')}
                      onChange={(e) =>
                        patch(i, { tags: e.target.value.split(/[，,]/).map((s) => s.trim()).filter(Boolean) })
                      }
                      placeholder="React, 开源, TypeScript"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[12px] text-white/60">角标（可选，如 HOT / v2.0）</Label>
                    <Input value={it.badge || ''} onChange={(e) => patch(i, { badge: e.target.value })} maxLength={16} />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-[12px] text-white/60">简介（支持 Markdown）</Label>
                <Textarea
                  rows={3}
                  value={it.desc || ''}
                  onChange={(e) => patch(i, { desc: e.target.value })}
                  placeholder="一句话介绍，支持 **加粗**、`代码`、[链接](…)、换行"
                />
              </div>
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
