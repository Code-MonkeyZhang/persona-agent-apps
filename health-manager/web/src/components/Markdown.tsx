import ReactMarkdown from 'react-markdown'

/** Markdown renderer for journal bodies, styled with the app's type scale. */
export function Markdown({ children }: { children: string }) {
  return (
    <div className="text-[15px] leading-relaxed">
      <ReactMarkdown
        components={{
          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
          ul: ({ children }) => (
            <ul className="mb-2 list-disc pl-5 last:mb-0">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-2 list-decimal pl-5 last:mb-0">{children}</ol>
          ),
          li: ({ children }) => <li className="mb-0.5">{children}</li>,
          strong: ({ children }) => (
            <strong className="font-semibold">{children}</strong>
          ),
          blockquote: ({ children }) => (
            <blockquote className="mb-2 border-l-2 border-border pl-3 text-muted-foreground last:mb-0">
              {children}
            </blockquote>
          ),
          h1: ({ children }) => (
            <h1 className="mb-1.5 mt-1 text-[17px] font-semibold first:mt-0">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="mb-1.5 mt-1 text-[16px] font-semibold first:mt-0">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="mb-1.5 mt-1 text-[15px] font-semibold first:mt-0">{children}</h3>
          ),
          code: ({ children }) => (
            <code className="rounded bg-muted px-1 py-0.5 text-[13px]">{children}</code>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  )
}
