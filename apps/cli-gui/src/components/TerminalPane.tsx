import { ChevronDown, ChevronUp } from 'lucide-react'
import { useAppState } from '../state/AppState'
import { useTerminalLog, type LineColor } from '../state/TerminalLog'

const COLOR_CLASS: Record<LineColor, string> = {
  default: 'text-store-text-2',
  green: 'text-store-green',
  red: 'text-store-red',
}

export function TerminalPane() {
  const { lines } = useTerminalLog()
  const { terminalExpanded, setTerminalExpanded } = useAppState()

  return (
    <div className="shrink-0 border-t border-store-border bg-black">
      <button
        type="button"
        aria-label={terminalExpanded ? '收起终端' : '展开终端'}
        onClick={() => setTerminalExpanded(!terminalExpanded)}
        className="flex w-full items-center justify-between px-3 py-1.5 font-mono text-xs text-store-text-2 hover:text-store-text"
      >
        终端
        {terminalExpanded ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
      </button>
      {terminalExpanded && (
        <div className="h-40 overflow-y-auto px-3 pb-3 font-mono text-xs">
          {lines.map((line, i) => (
            <div key={i} data-terminal-line className={COLOR_CLASS[line.color]}>
              {line.text}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
