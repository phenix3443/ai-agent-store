import { test, expect, afterEach, beforeEach, mock } from 'bun:test'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'

beforeEach(() => { localStorage.clear() })
afterEach(() => { cleanup() })

const { PublishModal } = await import('../PublishModal')
const { ClientStateProvider } = await import('../ClientStateProvider')

function renderModal(onOpenChange: (open: boolean) => void = () => {}) {
  return render(
    <ClientStateProvider>
      <PublishModal open onOpenChange={onOpenChange} />
    </ClientStateProvider>
  )
}

test('defaults to provider fields', () => {
  renderModal()
  expect(screen.getByLabelText('Base URL')).toBeInTheDocument()
})

test('switching type to mcp swaps the visible fields', () => {
  renderModal()
  fireEvent.click(screen.getByText('MCP'))
  expect(screen.queryByLabelText('Base URL')).not.toBeInTheDocument()
  expect(screen.getByLabelText('传输方式')).toBeInTheDocument()
})

test('mcp transport=stdio shows command field, hides url field', () => {
  renderModal()
  fireEvent.click(screen.getByText('MCP'))
  fireEvent.change(screen.getByLabelText('传输方式'), { target: { value: 'stdio' } })
  expect(screen.getByLabelText('启动命令')).toBeInTheDocument()
  expect(screen.queryByLabelText('远程地址')).not.toBeInTheDocument()
})

test('submitting closes the modal', () => {
  const onOpenChange = mock(() => {})
  renderModal(onOpenChange)
  fireEvent.change(screen.getByLabelText('名称'), { target: { value: 'My Provider' } })
  fireEvent.click(screen.getByText('发布'))
  expect(onOpenChange).toHaveBeenCalledWith(false)
})
