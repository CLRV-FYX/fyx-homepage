import { useState } from 'react'
import { motion } from 'framer-motion'
import { Quote } from 'lucide-react'
import { useConfig } from '@/lib/config'
import { splitDot, useCopy } from '@/lib/copy'
import Lightbox, { type LightboxItem } from '@/components/Lightbox'
import { MdInline } from '@/components/Md'
import type { Game } from '@/lib/types'

function Chars({ game }: { game: Game }) {
  const t = useCopy()
  const chars = game.chars || []
  if (chars.length === 0) return null
  return (
    <div className="mt-10">
      <div className="mono mb-4 flex items-center gap-3 text-[10px] tracking-[0.3em] text-white/40">
        <span className="h-px w-8 bg-white/20" />
        {t('games.charsLabel')}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {chars.map((c, i) => (
          <motion.div
            key={c.name + i}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.5, delay: i * 0.08 }}
            className="group relative overflow-hidden rounded-2xl border border-white/8 bg-[#0e0e0e] transition-colors hover:border-[var(--fyx-accent)]/45"
          >
            {c.img ? (
              <div className="relative h-44 overflow-hidden bg-black">
                <img
                  src={c.img}
                  alt={c.name}
                  loading="lazy"
                  className="h-full w-full object-cover object-[25%_top] transition-transform duration-700 group-hover:scale-[1.06]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e0e] via-transparent to-transparent" />
              </div>
            ) : (
              <div className="relative grid h-44 place-items-center overflow-hidden">
                <div className="grid-bg absolute inset-0 opacity-60" />
                <span className="text-7xl font-black text-white/8 select-none">{c.name.slice(0, 1)}</span>
                <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e0e] to-transparent" />
              </div>
            )}
            <div className="relative p-5 pt-3">
              <h4 className="text-lg font-bold text-white">{c.name}</h4>
              {c.title && (
                <div className="mono mt-1 text-[10px] leading-relaxed tracking-wider text-[var(--fyx-accent)]">
                  {c.title}
                </div>
              )}
              {c.desc && (
                <div className="mt-2.5 text-[13px] leading-relaxed text-white/55">
                  <MdInline text={c.desc} breaks />
                </div>
              )}
              {c.quote && (
                <div className="mt-3 flex gap-2 border-t border-white/8 pt-3 text-[12px] text-white/70 italic">
                  <Quote className="mt-0.5 size-3.5 shrink-0 text-[var(--fyx-accent)]" />
                  <MdInline text={c.quote} breaks />
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

export default function GamesSection() {
  const { config } = useConfig()
  const t = useCopy()
  const [heading, headingDot] = splitDot(t('games.heading'))
  const games = config.games || []
  const [lb, setLb] = useState<{ items: LightboxItem[]; index: number } | null>(null)

  return (
    <section id="games" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <div className="mono mb-3 flex items-center gap-3 text-[11px] tracking-[0.35em] text-white/40">
        {t('games.eyebrow')} <span className="h-px w-10 bg-white/15" />
      </div>
      <h2 className="mb-14 text-4xl font-black tracking-tighter text-white sm:text-5xl">
        {heading}
        <span className="text-[var(--fyx-accent)]">{headingDot}</span>
      </h2>

      <div className="flex flex-col gap-24">
        {games.map((g, gi) => {
          const gallery: LightboxItem[] = (g.gallery || []).map((url) => ({
            type: 'image',
            url,
            title: g.zh || g.title,
          }))
          return (
            <motion.article
              key={g.id || gi}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className={`grid items-center gap-8 md:grid-cols-2 ${gi % 2 === 1 ? 'md:[&>*:first-child]:order-2' : ''}`}>
                <div className="group relative aspect-video overflow-hidden rounded-2xl border border-white/10 bg-black">
                  {g.cover && (
                    <img
                      src={g.cover}
                      alt={g.title}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-[900ms] group-hover:scale-105"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />
                  <div className="absolute top-4 left-4 flex items-center gap-2">
                    <span className="mono rounded-full border border-white/20 bg-black/50 px-2.5 py-1 text-[10px] tracking-widest text-white/80 backdrop-blur">
                      NO.{String(gi + 1).padStart(2, '0')}
                    </span>
                  </div>
                  {g.highlight && (
                    <div className="mono absolute right-4 bottom-4 rounded-full bg-[var(--fyx-accent)] px-3 py-1.5 text-[10px] font-bold tracking-wider text-black">
                      {g.highlight}
                    </div>
                  )}
                </div>

                <div>
                  <div className="mono text-[10px] tracking-[0.3em] text-white/40">
                    {(g.year || '').toUpperCase()} · {(g.genre || '').toUpperCase()}
                  </div>
                  <h3 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">{g.zh || g.title}</h3>
                  <div className="mono mt-1.5 text-[12px] tracking-[0.2em] text-[var(--fyx-accent)]">{g.title}</div>
                  {g.dev && <div className="mono mt-2 text-[11px] text-white/35">{g.dev}</div>}
                  {g.desc && (
                    <div className="mt-4 text-[14px] leading-relaxed text-white/60">
                      <MdInline text={g.desc} breaks />
                    </div>
                  )}

                  {g.tags && g.tags.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {g.tags.map((t) => (
                        <span
                          key={t}
                          className="rounded-full border border-white/12 px-3 py-1 text-[11px] text-white/55"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}

                  {gallery.length > 0 && (
                    <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
                      {gallery.map((item, i) => (
                        <button
                          key={item.url + i}
                          onClick={() => setLb({ items: gallery, index: i })}
                          className="size-16 shrink-0 overflow-hidden rounded-lg border border-white/10 opacity-70 transition hover:opacity-100"
                        >
                          <img src={item.url} alt="" loading="lazy" className="h-full w-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <Chars game={g} />
            </motion.article>
          )
        })}
      </div>

      {lb && (
        <Lightbox items={lb.items} index={lb.index} onClose={() => setLb(null)} onIndex={(i) => setLb({ ...lb, index: i })} />
      )}
    </section>
  )
}
