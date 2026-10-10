import { type ReactNode } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Award,
  Bot,
  Code2,
  Gamepad2,
  Globe,
  LayoutDashboard,
  Loader2,
  MessagesSquare,
  Newspaper,
  Palette,
  Settings,
  ShieldCheck,
  Sparkles,
  Type,
  Users,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/lib/auth'
import Overview from './Overview'
import SiteSettings from './SiteSettings'
import CopyEditor from './CopyEditor'
import CardLinksEditor from './CardLinksEditor'
import AiSettings from './AiSettings'
import GamesEditor from './GamesEditor'
import WallManager from './WallManager'
import BlogManager from './BlogManager'
import ForumManager from './ForumManager'
import MomentsManager from './MomentsManager'
import UsersManager from './UsersManager'
import Security from './Security'

const TABS = [
  { id: 'overview', label: '概览', en: 'DASHBOARD', icon: LayoutDashboard },
  { id: 'site', label: '站点设置', en: 'SITE', icon: Palette },
  { id: 'copy', label: '文案库', en: 'COPY', icon: Type },
  { id: 'games', label: '游戏管理', en: 'GAMES', icon: Gamepad2 },
  { id: 'oss', label: '开源项目', en: 'OPEN SOURCE', icon: Code2 },
  { id: 'links', label: '网站推荐', en: 'WEBSITES', icon: Globe },
  { id: 'wall', label: '成绩墙', en: 'RECORDS', icon: Award },
  { id: 'blog', label: '博客', en: 'BLOG', icon: Newspaper },
  { id: 'forum', label: '论坛', en: 'FORUM', icon: MessagesSquare },
  { id: 'moments', label: '朋友圈', en: 'MOMENTS', icon: Sparkles },
  { id: 'ai', label: 'AI 设置', en: 'AI', icon: Bot },
  { id: 'users', label: '用户', en: 'USERS', icon: Users },
  { id: 'security', label: '安全', en: 'SECURITY', icon: ShieldCheck },
] as const

type TabId = (typeof TABS)[number]['id']

export default function Admin() {
  const { user, loading } = useAuth()
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const tab = (params.get('tab') || 'overview') as TabId

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#0a0a0a]">
        <Loader2 className="size-6 animate-spin text-white/40" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#0a0a0a] px-6 text-center">
        <div>
          <div className="mono text-[11px] tracking-[0.4em] text-white/40">ADMIN AREA</div>
          <h1 className="mt-3 text-3xl font-black tracking-tighter text-white">请先登录管理员账号</h1>
          <button
            onClick={() => navigate('/login', { state: { from: '/admin' } })}
            className="mono mt-6 rounded-full bg-[var(--fyx-accent)] px-6 py-2.5 text-[11px] font-bold tracking-[0.2em] text-black"
          >
            去登录 →
          </button>
        </div>
      </div>
    )
  }

  if (user.role !== 'admin') {
    return (
      <div className="grid min-h-screen place-items-center bg-[#0a0a0a] px-6 text-center">
        <div>
          <div className="mono text-[11px] tracking-[0.4em] text-red-400">403 FORBIDDEN</div>
          <h1 className="mt-3 text-3xl font-black tracking-tighter text-white">当前账号没有管理权限</h1>
          <Link to="/" className="mono mt-6 inline-block text-[12px] tracking-widest text-[var(--fyx-accent)] hover:underline">
            ← 返回首页
          </Link>
        </div>
      </div>
    )
  }

  const setTab = (id: string) => {
    params.set('tab', id)
    setParams(params, { replace: true })
  }

  const render = (): ReactNode => {
    switch (tab) {
      case 'site':
        return <SiteSettings />
      case 'copy':
        return <CopyEditor />
      case 'games':
        return <GamesEditor />
      case 'oss':
        return (
          <CardLinksEditor
            cfgKey="oss"
            title="开源项目"
            en="OPEN SOURCE"
            hint="首页第 04 栏：图片卡片，点击跳转到对应开源项目仓库。字段全部支持 Markdown。"
            nameLabel="项目名称"
            urlLabel="仓库地址"
            urlPh="https://github.com/…"
          />
        )
      case 'links':
        return (
          <CardLinksEditor
            cfgKey="links"
            title="网站推荐"
            en="WEBSITES"
            hint="首页第 05 栏：图片卡片，点击跳转到对应网站。字段全部支持 Markdown。"
            nameLabel="网站名称"
            urlLabel="网站地址"
            urlPh="https://…"
          />
        )
      case 'wall':
        return <WallManager />
      case 'blog':
        return <BlogManager />
      case 'forum':
        return <ForumManager />
      case 'moments':
        return <MomentsManager />
      case 'ai':
        return <AiSettings />
      case 'users':
        return <UsersManager />
      case 'security':
        return <Security />
      default:
        return <Overview onTab={setTab} />
    }
  }

  return (
    <div className="flex min-h-screen bg-[#080808]">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-56 flex-col border-r border-white/8 bg-[#0b0b0b] lg:flex">
        <div className="flex h-14 items-center gap-2 border-b border-white/8 px-5">
          <Settings className="size-4 text-[var(--fyx-accent)]" />
          <div>
            <div className="text-sm font-black tracking-tight text-white">FYX ADMIN</div>
            <div className="mono text-[8px] tracking-[0.3em] text-white/30">CONTROL PANEL</div>
          </div>
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
          {TABS.map((t) => {
            const active = tab === t.id
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition ${
                  active
                    ? 'bg-[var(--fyx-accent)] text-black'
                    : 'text-white/55 hover:bg-white/5 hover:text-white'
                }`}
              >
                <t.icon className="size-4" />
                <div>
                  <div className="text-[13px] font-semibold">{t.label}</div>
                  <div className={`mono text-[8px] tracking-[0.2em] ${active ? 'text-black/60' : 'text-white/25'}`}>
                    {t.en}
                  </div>
                </div>
              </button>
            )
          })}
        </nav>
        <div className="border-t border-white/8 p-4">
          <Link to="/" className="mono text-[10px] tracking-[0.2em] text-white/40 hover:text-white">
            ← VIEW SITE
          </Link>
          <div className="mono mt-2 text-[9px] text-white/25">SIGNED AS {user.username}</div>
        </div>
      </aside>

      {/* 移动端顶部标签 */}
      <div className="fixed inset-x-0 top-0 z-40 flex gap-1 overflow-x-auto border-b border-white/8 bg-[#0b0b0b] px-3 py-2 lg:hidden">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-[12px] transition ${
              tab === t.id ? 'bg-[var(--fyx-accent)] text-black' : 'text-white/55 hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <main className="min-w-0 flex-1 px-4 pt-16 pb-16 lg:px-8 lg:pt-8 lg:pl-64">
        <div className="mx-auto max-w-4xl">{render()}</div>
      </main>
    </div>
  )
}
