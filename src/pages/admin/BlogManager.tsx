import { useEffect, useState } from 'react'
import { Loader2, Pencil, Plus, Trash2, Upload } from 'lucide-react'
import { api, fmtDate, uploadFile } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import type { Post } from '@/lib/types'

interface Draft {
  id?: number
  title: string
  content: string
  tags: string
  cover: string
  published: boolean
}

const EMPTY: Draft = { title: '', content: '', tags: '', cover: '', published: true }

export default function BlogManager() {
  const [posts, setPosts] = useState<Post[]>([])
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<Draft>(EMPTY)
  const [busy, setBusy] = useState(false)
  const [uploading, setUploading] = useState(false)

  const load = () => api<Post[]>('/api/posts?all=1').then(setPosts).catch(() => {})
  useEffect(() => {
    void load()
  }, [])

  const save = async () => {
    if (!draft.title.trim() || !draft.content.trim()) return toast.error('标题和内容不能为空')
    setBusy(true)
    try {
      const body = {
        title: draft.title,
        content: draft.content,
        tags: draft.tags.split(/[，,]/).map((s) => s.trim()).filter(Boolean),
        cover: draft.cover,
        published: draft.published,
      }
      if (draft.id) await api(`/api/posts/${draft.id}`, { method: 'PUT', body })
      else await api('/api/posts', { method: 'POST', body })
      toast.success('已保存')
      setOpen(false)
      void load()
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const remove = async (id: number) => {
    if (!confirm('删除这篇文章？')) return
    try {
      await api(`/api/posts/${id}`, { method: 'DELETE' })
      setPosts((l) => l.filter((p) => p.id !== id))
      toast.success('已删除')
    } catch (e) {
      toast.error((e as Error).message)
    }
  }

  const edit = (p: Post) => {
    setDraft({
      id: p.id,
      title: p.title,
      content: p.content || '',
      tags: (p.tags || []).join(', '),
      cover: p.cover || '',
      published: p.published !== false,
    })
    setOpen(true)
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="mono text-[10px] tracking-[0.35em] text-white/40">BLOG</div>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-white">博客管理</h1>
        </div>
        <Button
          onClick={() => {
            setDraft(EMPTY)
            setOpen(true)
          }}
          className="rounded-full bg-[var(--fyx-accent)] text-black hover:opacity-90"
        >
          <Plus /> 写文章
        </Button>
      </div>

      <div className="space-y-3">
        {posts.map((p) => (
          <div key={p.id} className="flex items-center gap-4 rounded-xl border border-white/8 bg-[#0e0e0e] p-4">
            <div className="size-14 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-black">
              {p.cover ? <img src={p.cover} alt="" className="h-full w-full object-cover" /> : <div className="grid-bg h-full w-full opacity-50" />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate text-[15px] font-semibold text-white">{p.title}</span>
                {!p.published && (
                  <span className="mono rounded bg-yellow-500/15 px-1.5 py-0.5 text-[8px] text-yellow-400">DRAFT</span>
                )}
              </div>
              <div className="mono mt-1 text-[10px] tracking-wider text-white/35">
                {fmtDate(p.updatedAt)} · {(p.tags || []).join(' / ') || '无标签'}
              </div>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button size="sm" variant="outline" onClick={() => edit(p)}>
                <Pencil /> 编辑
              </Button>
              <Button size="sm" variant="destructive" onClick={() => remove(p.id)}>
                <Trash2 />
              </Button>
            </div>
          </div>
        ))}
        {posts.length === 0 && (
          <div className="rounded-2xl border border-dashed border-white/12 p-12 text-center text-sm text-white/45">
            还没有文章。
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{draft.id ? '编辑文章' : '写文章'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>标题</Label>
              <Input value={draft.title} onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))} maxLength={120} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>标签（逗号分隔）</Label>
                <Input value={draft.tags} onChange={(e) => setDraft((d) => ({ ...d, tags: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>封面图</Label>
                <div className="flex gap-2">
                  <Input value={draft.cover} onChange={(e) => setDraft((d) => ({ ...d, cover: e.target.value }))} placeholder="/images/…" />
                  <label className="flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-md border border-white/12 px-3 text-[12px] text-white/70 hover:bg-white/5">
                    {uploading ? <Loader2 className="size-3.5 animate-spin" /> : <Upload className="size-3.5" />}
                    <input
                      hidden
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const f = e.target.files?.[0]
                        if (!f) return
                        setUploading(true)
                        try {
                          const r = await uploadFile(f)
                          setDraft((d) => ({ ...d, cover: r.url }))
                        } catch (err) {
                          toast.error((err as Error).message)
                        } finally {
                          setUploading(false)
                        }
                      }}
                    />
                  </label>
                </div>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>正文（Markdown）</Label>
              <Textarea
                rows={14}
                value={draft.content}
                onChange={(e) => setDraft((d) => ({ ...d, content: e.target.value }))}
                className="mono text-[12.5px]"
                placeholder="# 标题&#10;&#10;正文支持 **Markdown**、列表、表格、代码块…"
              />
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={draft.published} onCheckedChange={(v) => setDraft((d) => ({ ...d, published: v }))} />
              <span className="text-[12px] text-white/50">公开发布（关闭则保存为草稿）</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>取消</Button>
            <Button onClick={save} disabled={busy} className="bg-[var(--fyx-accent)] text-black hover:opacity-90">
              {busy ? '保存中…' : '保存'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
