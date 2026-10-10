import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Film, Plus } from 'lucide-react'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { useConfig } from '@/lib/config'
import { useCopy } from '@/lib/copy'
import type { MediaItem } from '@/lib/types'
import Lightbox, { type LightboxItem } from '@/components/Lightbox'
import { MdInline } from '@/components/Md'

export default function AchievementWall() {
  const { config } = useConfig()
  const { user } = useAuth()
  const t = useCopy()
  const [items, setItems] = useState<MediaItem[]>([])
  const [lb, setLb] = useState<number | null>(null)
  const wall = config.wall || { title: 'MY RECORDS', subtitle: '成绩墙', note: '' }

  useEffect(() => {
    api<MediaItem[]>('/api/media')
      .then(setItems)
      .catch(() => setItems([]))
  }, [])

  const lightboxItems: LightboxItem[] = items.map((m) => ({ type: m.type, url: m.url, title: m.title }))

  return (
    <section id="records" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <div className="mono mb-3 flex items-center gap-3 text-[11px] tracking-[0.35em] text-white/40">
        {t('wall.eyebrow')} <span className="h-px w-10 bg-white/15" />
      </div>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-4xl font-black tracking-tighter text-white sm:text-5xl">
            {wall.title || 'MY RECORDS'}<span className="text-[var(--fyx-accent)]">.</span>
          </h2>
          {wall.subtitle && <div className="mono mt-2 text-[11px] tracking-[0.3em] text-white/40">{wall.subtitle}</div>}
        </div>
        <div className="mono text-[11px] text-white/35">{t('wall.items', { n: items.length })}</div>
      </div>

      {items.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((m, i) => (
            <motion.button
              key={m.id}
              initial={{ opacity: 0, scale: 0.96 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: (i % 8) * 0.04 }}
              onClick={() => setLb(i)}
              className="group relative aspect-[4/3] overflow-hidden rounded-xl border border-white/10 bg-[#0e0e0e] text-left"
            >
              {m.type === 'video' ? (
                <video
                  src={m.url}
                  muted
                  preload="metadata"
                  playsInline
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <img
                  src={m.url}
                  alt={m.title || ''}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent opacity-80" />
              {m.type === 'video' && (
                <span className="absolute top-2 left-2 grid size-7 place-items-center rounded-full bg-black/65 text-white backdrop-blur">
                  <Film className="size-3.5" />
                </span>
              )}
              <div className="absolute right-2 bottom-2 left-2 truncate text-[11px] text-white/80">
                {m.title || (m.type === 'video' ? t('wall.labelVideo') : t('wall.labelImage'))}
              </div>
            </motion.button>
          ))}
        </div>
      ) : (
        /* ============ 专为成绩图 / 视频预留的大空位 ============ */
        <div className="grid-bg relative flex min-h-[380px] flex-col items-center justify-center rounded-3xl border border-dashed border-white/15 bg-[#0b0b0b] px-6 py-16 text-center">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.06]"
            style={{ background: 'radial-gradient(400px 200px at 50% 50%, var(--fyx-accent), transparent 70%)' }}
          />
          <div className="grid size-16 place-items-center rounded-2xl border border-white/15 bg-white/4">
            <Plus className="size-7 text-white/50" />
          </div>
          <div className="mono mt-6 text-[11px] tracking-[0.35em] text-white/45">{t('wall.awaiting')}</div>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-white/55">
            <MdInline text={wall.note || t('wall.emptyNote')} breaks />
          </p>
          {user?.role === 'admin' && (
            <Link
              to="/admin?tab=wall"
              className="mono mt-7 rounded-full bg-[var(--fyx-accent)] px-6 py-2.5 text-[11px] font-bold tracking-[0.2em] text-black transition hover:opacity-90"
            >
              {t('wall.uploadBtn')}
            </Link>
          )}
        </div>
      )}

      {lb !== null && (
        <Lightbox
          items={lightboxItems}
          index={lb}
          onClose={() => setLb(null)}
          onIndex={(i) => setLb(i)}
        />
      )}
    </section>
  )
}
