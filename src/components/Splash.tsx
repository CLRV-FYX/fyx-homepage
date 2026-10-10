import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useConfig } from '@/lib/config'
import { useCopy } from '@/lib/copy'

const EASE = [0.76, 0, 0.24, 1] as const

export default function Splash() {
  const { config, loaded } = useConfig()
  const t = useCopy()
  const [gone, setGone] = useState(false)
  const [progress, setProgress] = useState(0)
  const rafRef = useRef(0)

  const splash = config.splash
  const active = loaded && !!splash?.enabled && !gone

  useEffect(() => {
    if (!active) return
    const duration = Math.max(800, Number(splash?.duration) || 2600)
    const start = performance.now()
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration)
      setProgress(p)
      if (p < 1) rafRef.current = requestAnimationFrame(tick)
      else setGone(true)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [active, splash?.duration])

  const lines = (splash?.lines?.length ? splash.lines : ['WELCOME']) as string[]
  const lineIndex = Math.min(lines.length - 1, Math.floor(progress * lines.length))
  const letters = (config.site?.name || 'FYX').split('')

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          key="splash"
          className="fixed inset-0 z-[300] flex cursor-pointer flex-col items-center justify-center bg-[#050505]"
          onClick={() => setGone(true)}
          exit={{ y: '-100%' }}
          transition={{ duration: 0.7, ease: EASE }}
        >
          <div className="pointer-events-none absolute inset-0 grid-bg opacity-40" />
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.15]"
            style={{
              background:
                'radial-gradient(600px 300px at 50% 55%, var(--fyx-accent), transparent 70%)',
            }}
          />

          <div className="relative flex items-end gap-1 overflow-hidden sm:gap-2">
            {letters.map((ch, i) => (
              <motion.span
                key={i}
                className="text-[17vw] leading-none font-black tracking-tighter text-white sm:text-[9rem]"
                initial={{ y: '110%', opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.12 + i * 0.09, duration: 0.7, ease: EASE }}
              >
                {ch}
              </motion.span>
            ))}
          </div>

          <motion.div
            className="relative mt-8 h-px w-56 overflow-hidden bg-white/15 sm:w-80"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <div
              className="h-full bg-[var(--fyx-accent)]"
              style={{ width: `${progress * 100}%`, transition: 'width 80ms linear' }}
            />
          </motion.div>

          <div className="mono relative mt-5 h-5 text-[11px] tracking-[0.35em] text-white/55">
            <AnimatePresence mode="wait">
              <motion.span
                key={lineIndex}
                initial={{ y: 8, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -8, opacity: 0 }}
                transition={{ duration: 0.25 }}
              >
                {lines[lineIndex]}
              </motion.span>
            </AnimatePresence>
          </div>

          <motion.div
            className="mono absolute bottom-8 text-[10px] tracking-[0.3em] text-white/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            {t('splash.skip')}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
