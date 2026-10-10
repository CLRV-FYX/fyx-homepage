import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { useCopy } from '@/lib/copy'

export interface LightboxItem {
  type: 'image' | 'video'
  url: string
  title?: string
}

export default function Lightbox({
  items,
  index,
  onClose,
  onIndex,
}: {
  items: LightboxItem[]
  index: number
  onClose: () => void
  onIndex: (i: number) => void
}) {
  const open = index >= 0 && index < items.length
  const item = open ? items[index] : null
  const t = useCopy()

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') onIndex((index + 1) % items.length)
      if (e.key === 'ArrowLeft') onIndex((index - 1 + items.length) % items.length)
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, index, items.length, onClose, onIndex])

  return (
    <AnimatePresence>
      {open && item && (
        <motion.div
          className="fixed inset-0 z-[250] flex flex-col items-center justify-center bg-black/92 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <button
            className="absolute top-5 right-5 grid size-10 place-items-center rounded-full border border-white/15 text-white/80 transition hover:bg-white/10"
            onClick={onClose}
            aria-label="关闭"
          >
            <X className="size-5" />
          </button>

          {items.length > 1 && (
            <>
              <button
                className="absolute left-4 grid size-11 place-items-center rounded-full border border-white/15 text-white/80 transition hover:bg-white/10"
                onClick={(e) => {
                  e.stopPropagation()
                  onIndex((index - 1 + items.length) % items.length)
                }}
                aria-label="上一张"
              >
                <ChevronLeft className="size-5" />
              </button>
              <button
                className="absolute right-4 grid size-11 place-items-center rounded-full border border-white/15 text-white/80 transition hover:bg-white/10"
                onClick={(e) => {
                  e.stopPropagation()
                  onIndex((index + 1) % items.length)
                }}
                aria-label="下一张"
              >
                <ChevronRight className="size-5" />
              </button>
            </>
          )}

          <motion.div
            key={item.url}
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.25 }}
            className="max-h-[78vh] max-w-[92vw]"
            onClick={(e) => e.stopPropagation()}
          >
            {item.type === 'video' ? (
              <video src={item.url} controls autoPlay playsInline className="max-h-[78vh] max-w-[92vw] rounded-xl" />
            ) : (
              <img src={item.url} alt={item.title || ''} className="max-h-[78vh] max-w-[92vw] rounded-xl object-contain" />
            )}
          </motion.div>

          <div className="mono absolute bottom-5 text-[11px] tracking-[0.2em] text-white/45">
            {item.title || ''} {items.length > 1 ? `· ${index + 1} / ${items.length}` : ''} · {t('lightbox.hint')}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
