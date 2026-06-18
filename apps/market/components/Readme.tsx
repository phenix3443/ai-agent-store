import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface ReadmeProps {
  url: string
}

async function fetchReadme(url: string): Promise<string> {
  try {
    const res = await fetch(url, { next: { revalidate: 3600 } })
    if (!res.ok) return '_README not available._'
    return res.text()
  } catch {
    return '_README not available._'
  }
}

export async function Readme({ url }: ReadmeProps) {
  const content = await fetchReadme(url)

  return (
    <div className="prose prose-invert prose-sm max-w-none text-ray-fg-secondary
      prose-headings:text-ray-fg prose-a:text-ray-official prose-code:text-ray-fg
      prose-pre:bg-ray-surface-1 prose-pre:border prose-pre:border-ray-border">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  )
}
