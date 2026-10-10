import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { api } from './api'
import type { SiteConfig } from './types'

const FALLBACK: SiteConfig = {
  site: { name: 'FYX', slogan: 'GAME · MUSIC · LIFE' },
  hero: { title: 'FYX', subtitle: '', badge: '', scrollHint: 'SCROLL' },
  theme: { accent: '#ff4a3d' },
  splash: { enabled: false, duration: 2000, lines: [] },
  music: { enabled: false, title: '', artist: '', src: '' },
  games: [],
}

interface ConfigContextValue {
  config: SiteConfig
  loaded: boolean
  reload: () => Promise<void>
  setConfigLocal: (cfg: SiteConfig) => void
}

const ConfigContext = createContext<ConfigContextValue | null>(null)

export function ConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<SiteConfig>(FALLBACK)
  const [loaded, setLoaded] = useState(false)

  const reload = useCallback(async () => {
    try {
      const data = await api<SiteConfig>('/api/config')
      setConfig(data)
    } catch (e) {
      console.error('加载站点配置失败', e)
    } finally {
      setLoaded(true)
    }
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  useEffect(() => {
    const accent = config.theme?.accent
    if (accent) document.documentElement.style.setProperty('--fyx-accent', accent)
    if (config.site?.name) document.title = `${config.site.name} · 个人游戏主页`
  }, [config])

  const setConfigLocal = useCallback((cfg: SiteConfig) => setConfig(cfg), [])

  return (
    <ConfigContext.Provider value={{ config, loaded, reload, setConfigLocal }}>
      {children}
    </ConfigContext.Provider>
  )
}

export function useConfig() {
  const ctx = useContext(ConfigContext)
  if (!ctx) throw new Error('useConfig must be used within ConfigProvider')
  return ctx
}
