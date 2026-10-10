import { Link } from 'react-router-dom'
import { useConfig } from '@/lib/config'
import { useCopy } from '@/lib/copy'

export default function Footer() {
  const { config } = useConfig()
  const t = useCopy()
  const links = [
    { to: '/blog', label: t('nav.enBlog') },
    { to: '/forum', label: t('nav.enForum') },
    { to: '/moments', label: t('nav.enMoments') },
    { to: '/chat', label: t('nav.enChat') },
    { to: '/admin', label: t('misc.admin'), accent: true },
  ]

  return (
    <footer className="mt-24 border-t border-white/8 bg-[#080808]">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-xl font-black tracking-tighter text-white">
            {config.site?.name || 'FYX'}
            <span className="ml-1 text-[var(--fyx-accent)]">●</span>
          </div>
          <div className="mono mt-1 text-[10px] tracking-[0.25em] text-white/35">
            {config.site?.slogan}
          </div>
        </div>

        <div className="mono flex flex-wrap gap-x-5 gap-y-2 text-[11px] text-white/45">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={`transition hover:text-white ${l.accent ? 'hover:text-[var(--fyx-accent)]' : ''}`}
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="mono text-[10px] leading-relaxed tracking-wider text-white/30">
          <div>
            {t('footer.copyright', { year: new Date().getFullYear(), name: config.site?.name || 'FYX' })}
          </div>
          <div>{t('footer.bgm', { title: config.music?.title || '', artist: config.music?.artist || '' })}</div>
        </div>
      </div>
    </footer>
  )
}
