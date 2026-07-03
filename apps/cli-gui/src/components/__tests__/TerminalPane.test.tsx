import { test, expect, afterEach } from 'bun:test'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import { useEffect } from 'react'
import { AppStateProvider } from '../../state/AppState'
import { TerminalLogProvider, useTerminalLog } from '../../state/TerminalLog'
import { TerminalPane } from '../TerminalPane'

afterEach(() => { cleanup() })

function Seed({ children }: { children: React.ReactNode }) {
  const { appendLine } = useTerminalLog()
  useEffect(() => {
    appendLine('$ aas install openai-provider')
    appendLine('✓ 已安装 openai-provider 1.2.0', 'green')
  }, [])
  return <>{children}</>
}

function renderPane() {
  return render(
    <AppStateProvider>
      <TerminalLogProvider>
        <Seed>
          <TerminalPane />
        </Seed>
      </TerminalLogProvider>
    </AppStateProvider>
  )
}

test('collapsed by default: log lines are not rendered', () => {
  renderPane()
  expect(screen.queryByText('$ aas install openai-provider')).not.toBeInTheDocument()
})

test('expanding shows all appended lines', () => {
  renderPane()
  fireEvent.click(screen.getByLabelText('展开终端'))
  expect(screen.getByText('$ aas install openai-provider')).toBeInTheDocument()
  expect(screen.getByText('✓ 已安装 openai-provider 1.2.0')).toBeInTheDocument()
})

test('collapsing hides the lines again', () => {
  renderPane()
  fireEvent.click(screen.getByLabelText('展开终端'))
  fireEvent.click(screen.getByLabelText('收起终端'))
  expect(screen.queryByText('$ aas install openai-provider')).not.toBeInTheDocument()
})

test('renders an empty pane with no lines when expanded', () => {
  const { container } = render(
    <AppStateProvider>
      <TerminalLogProvider>
        <TerminalPane />
      </TerminalLogProvider>
    </AppStateProvider>
  )
  fireEvent.click(screen.getByLabelText('展开终端'))
  expect(container.querySelectorAll('[data-terminal-line]')).toHaveLength(0)
})
