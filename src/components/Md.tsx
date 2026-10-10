import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'

/**
 * 全站统一 Markdown 渲染：
 * - Md      ：块级（段落/列表/代码块…），外层 .md-body 提供排版样式
 * - MdInline：行内（把段落拆包成裸内容，适合卡片、气泡、行内文案），breaks 让换行生效
 */
export function Md({
  text,
  breaks,
  className,
}: {
  text?: string | null
  breaks?: boolean
  className?: string
}) {
  if (!text) return null
  return (
    <div className={`md-body ${className || ''}`}>
      <ReactMarkdown remarkPlugins={breaks ? [remarkGfm, remarkBreaks] : [remarkGfm]}>
        {text}
      </ReactMarkdown>
    </div>
  )
}

export function MdInline({
  text,
  breaks,
  className,
}: {
  text?: string | null
  breaks?: boolean
  className?: string
}) {
  if (!text) return null
  return (
    <span className={className}>
      <ReactMarkdown
        remarkPlugins={breaks ? [remarkGfm, remarkBreaks] : [remarkGfm]}
        components={{
          p: ({ children }) => <>{children}</>,
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noreferrer" className="text-[var(--fyx-accent)] underline underline-offset-2">
              {children}
            </a>
          ),
        }}
      >
        {text}
      </ReactMarkdown>
    </span>
  )
}

export default Md
