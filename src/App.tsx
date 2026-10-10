import { useEffect } from 'react'
import { BrowserRouter, Outlet, Route, Routes } from 'react-router-dom'
import { ThemeProvider } from 'next-themes'
import { Toaster } from '@/components/ui/sonner'
import { AuthProvider } from '@/lib/auth'
import { ConfigProvider, useConfig } from '@/lib/config'
import { useCopy } from '@/lib/copy'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import Splash from '@/components/Splash'
import MusicPlayer from '@/components/MusicPlayer'
import AiAssistant from '@/components/AiAssistant'
import Home from '@/pages/Home'
import Blog from '@/pages/Blog'
import BlogPost from '@/pages/BlogPost'
import Forum from '@/pages/Forum'
import ThreadPage from '@/pages/ThreadPage'
import Moments from '@/pages/Moments'
import Chat from '@/pages/Chat'
import AuthPage from '@/pages/AuthPage'
import Admin from '@/pages/admin/Admin'

function Shell() {
  return (
    <div className="min-h-screen pt-14">
      <Nav />
      <Outlet />
      <Footer />
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <BrowserRouter>
        <AuthProvider>
          <ConfigProvider>
            <FaviconSync />
            <Routes>
              <Route element={<Shell />}>
                <Route path="/" element={<Home />} />
                <Route path="/blog" element={<Blog />} />
                <Route path="/blog/:id" element={<BlogPost />} />
                <Route path="/forum" element={<Forum />} />
                <Route path="/forum/:boardId" element={<Forum />} />
                <Route path="/thread/:id" element={<ThreadPage />} />
                <Route path="/moments" element={<Moments />} />
                <Route path="/chat" element={<Chat />} />
                <Route path="/login" element={<AuthPage />} />
              </Route>
              <Route path="/admin/*" element={<Admin />} />
              <Route path="*" element={<ShellFallback />} />
            </Routes>
            <Splash />
            <MusicPlayer />
            <AiAssistant />
            <Toaster position="top-center" richColors closeButton />
          </ConfigProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  )
}

function ShellFallback() {
  const t = useCopy()
  return (
    <div className="grid min-h-screen place-items-center px-6 text-center">
      <div>
        <div className="mono text-[11px] tracking-[0.4em] text-white/40">{t('err.404Tag')}</div>
        <h1 className="mt-3 text-4xl font-black tracking-tighter text-white">{t('err.404Title')}</h1>
        <a href="/" className="mono mt-6 inline-block text-[12px] tracking-widest text-[var(--fyx-accent)] underline-offset-4 hover:underline">
          {t('err.backHome')}
        </a>
      </div>
    </div>
  )
}

/** 依据「站点设置 → 网站图标」动态切换 favicon（留空恢复默认） */
function FaviconSync() {
  const { config } = useConfig()
  const favicon = config.site?.favicon
  useEffect(() => {
    const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]')
    if (!link) return
    if (!link.dataset.origHref) link.dataset.origHref = link.getAttribute('href') || ''
    if (favicon && (favicon.startsWith('/') || favicon.startsWith('http'))) {
      link.href = favicon
    } else {
      link.href = link.dataset.origHref
    }
  }, [favicon])
  return null
}
