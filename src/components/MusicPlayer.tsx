import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Music, Pause, Play, Volume2, VolumeX } from 'lucide-react'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { useConfig } from '@/lib/config'
import { useCopy } from '@/lib/copy'

export default function MusicPlayer() {
  const { config, loaded } = useConfig()
  const t = useCopy()
  const music = config.music
  const appearDelay = !loaded ? 4 : config.splash?.enabled ? Math.max(0.8, (config.splash.duration || 2600) / 1000) + 1.2 : 1.2
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(false)
  const [volume, setVolume] = useState(0.8)
  const [current, setCurrent] = useState(0)
  const [duration, setDuration] = useState(0)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!music?.enabled || !music.src) return
    const audio = new Audio(music.src)
    audio.preload = 'metadata'
    audio.volume = 0.8
    audio.loop = true
    audioRef.current = audio
    const onTime = () => setCurrent(audio.currentTime)
    const onMeta = () => {
      setDuration(audio.duration || 0)
      setReady(true)
    }
    const onErr = () => setReady(false)
    audio.addEventListener('timeupdate', onTime)
    audio.addEventListener('loadedmetadata', onMeta)
    audio.addEventListener('error', onErr)
    if (music.autoplay) {
      void audio.play().then(() => setPlaying(true)).catch(() => setPlaying(false))
    }
    return () => {
      audio.pause()
      audio.removeEventListener('timeupdate', onTime)
      audio.removeEventListener('loadedmetadata', onMeta)
      audio.removeEventListener('error', onErr)
      audio.src = ''
    }
  }, [music?.enabled, music?.src, music?.autoplay])

  useEffect(() => {
    const audio = audioRef.current
    if (audio) audio.volume = muted ? 0 : volume
  }, [volume, muted])

  if (!music?.enabled || !music.src) return null

  const toggle = () => {
    const audio = audioRef.current
    if (!audio) return
    if (playing) {
      audio.pause()
      setPlaying(false)
    } else {
      void audio.play().then(() => setPlaying(true)).catch(() => setPlaying(false))
    }
  }

  const seek = (value: number[]) => {
    const audio = audioRef.current
    if (!audio || !duration) return
    audio.currentTime = value[0]
    setCurrent(value[0])
  }

  const fmt = (s: number) => {
    if (!Number.isFinite(s)) return '0:00'
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${String(sec).padStart(2, '0')}`
  }

  return (
    <motion.div
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: appearDelay, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="fixed right-4 bottom-4 z-[150] w-[min(21rem,calc(100vw-2rem))] rounded-2xl border border-white/10 bg-[#0d0d0d]/95 p-3 shadow-2xl backdrop-blur-xl"
    >
      <div className="flex items-center gap-3">
        <div className="relative size-11 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-black">
          {music.cover ? (
            <img src={music.cover} alt="" className="size-full object-cover opacity-90" />
          ) : (
            <div className="grid size-full place-items-center text-white/40">
              <Music className="size-4" />
            </div>
          )}
          <motion.div
            className="absolute inset-0 rounded-full border border-white/30"
            animate={playing ? { rotate: 360 } : { rotate: 0 }}
            transition={{ duration: 4, repeat: playing ? Infinity : 0, ease: 'linear' }}
            style={{ borderRadius: '999px', inset: '25%' }}
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-semibold text-white">{music.title}</div>
          <div className="truncate text-[11px] text-white/45">{music.artist}</div>
        </div>

        <Button
          size="icon"
          variant="ghost"
          onClick={toggle}
          aria-label={playing ? '暂停' : '播放'}
          className="size-9 rounded-full border border-white/10 bg-white/5 text-white hover:bg-white/10"
        >
          {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
        </Button>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <span className="mono w-8 text-right text-[10px] text-white/40">{fmt(current)}</span>
        <Slider
          value={[current]}
          max={Math.max(duration, 1)}
          step={0.5}
          onValueChange={seek}
          className="flex-1"
          aria-label="播放进度"
        />
        <span className="mono w-8 text-[10px] text-white/40">{fmt(duration)}</span>
        <Button
          size="icon"
          variant="ghost"
          className="size-7 text-white/60 hover:text-white"
          onClick={() => setMuted((m) => !m)}
          aria-label="静音"
        >
          {muted || volume === 0 ? <VolumeX className="size-3.5" /> : <Volume2 className="size-3.5" />}
        </Button>
      </div>

      <Slider
        value={[muted ? 0 : volume]}
        max={1}
        step={0.01}
        onValueChange={(v) => {
          setVolume(v[0])
          setMuted(false)
        }}
        className="mt-2 hidden"
        aria-label="音量"
      />
      {!ready && (
        <div className="mono mt-1.5 text-[10px] text-white/30">{t('music.offline')}</div>
      )}
    </motion.div>
  )
}
