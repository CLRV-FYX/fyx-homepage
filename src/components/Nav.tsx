import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { LogOut, Menu, Settings, UserRound, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/lib/auth'
import { useConfig } from '@/lib/config'
import { useCopy } from '@/lib/copy'

export default function Nav() {
  const { user, logout } = useAuth()
  const { config } = useConfig()
  const t = useCopy()
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  const links = [
    { to: '/', label: t('nav.home'), en: t('nav.enHome') },
    { to: '/blog', label: t('nav.blog'), en: t('nav.enBlog') },
    { to: '/forum', label: t('nav.forum'), en: t('nav.enForum') },
    { to: '/moments', label: t('nav.moments'), en: t('nav.enMoments') },
    { to: '/chat', label: t('nav.chat'), en: t('nav.enChat') },
  ]

  const navCls = ({ isActive }: { isActive: boolean }) =>
    `mono relative text-[11px] tracking-[0.18em] transition-colors ${
      isActive ? 'text-[var(--fyx-accent)]' : 'text-white/55 hover:text-white'
    }`

  return (
    <header className="fixed top-0 right-0 left-0 z-[120] border-b border-white/8 bg-[#0a0a0a]/85 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="group flex items-baseline gap-2" onClick={() => setOpen(false)}>
          <span className="text-lg font-black tracking-tighter text-white transition-transform group-hover:scale-105">
            {config.site?.name || 'FYX'}
          </span>
          <span className="hidden text-[var(--fyx-accent)] sm:inline">●</span>
          <span className="mono hidden text-[9px] tracking-[0.3em] text-white/35 md:inline">
            {config.site?.slogan}
          </span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} className={navCls} end={l.to === '/'}>
              {l.label}
            </NavLink>
          ))}
          {user?.role === 'admin' && (
            <NavLink to="/admin" className={navCls}>
              {t('nav.admin')}
            </NavLink>
          )}
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2 text-white/80 hover:text-white">
                  <UserRound className="size-4" />
                  <span className="max-w-24 truncate">{user.username}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuLabel className="mono text-[10px] text-white/50">
                  {user.role === 'admin' ? t('nav.roleAdmin') : t('nav.roleMember')}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/moments')}>
                  <UserRound /> {t('nav.menuMoments')}
                </DropdownMenuItem>
                {user.role === 'admin' && (
                  <DropdownMenuItem onClick={() => navigate('/admin')}>
                    <Settings /> {t('nav.menuAdmin')}
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    logout()
                    navigate('/')
                  }}
                >
                  <LogOut /> {t('nav.logout')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              size="sm"
              onClick={() => navigate('/login')}
              className="rounded-full bg-white text-black text-[12px] hover:bg-white/85"
            >
              {t('nav.login')}
            </Button>
          )}

          <button
            className="grid size-9 place-items-center rounded-lg border border-white/10 text-white/70 md:hidden"
            onClick={() => setOpen((o) => !o)}
            aria-label="menu"
          >
            {open ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden border-t border-white/8 md:hidden"
          >
            <div className="flex flex-col gap-4 px-6 py-5">
              {links.map((l) => (
                <NavLink key={l.to} to={l.to} className={navCls} end={l.to === '/'} onClick={() => setOpen(false)}>
                  {l.label} <span className="ml-2 text-white/25">{l.en}</span>
                </NavLink>
              ))}
              {user?.role === 'admin' && (
                <NavLink to="/admin" className={navCls} onClick={() => setOpen(false)}>
                  {t('nav.admin')}
                  <span className="ml-2 text-white/25">{t('nav.enAdmin')}</span>
                </NavLink>
              )}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  )
}
