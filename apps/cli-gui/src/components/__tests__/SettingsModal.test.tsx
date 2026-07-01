import { test, expect, afterEach } from 'bun:test'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import { SettingsModal } from '../SettingsModal'

afterEach(() => { cleanup() })

test('defaults to the account tab', () => {
  render(<SettingsModal open onOpenChange={() => {}} />)
  expect(screen.getByText('未登录')).toBeInTheDocument()
})

test('switching to the language tab shows zh/en enabled and others disabled', () => {
  render(<SettingsModal open onOpenChange={() => {}} />)
  fireEvent.click(screen.getByText('语言'))
  expect(screen.getByText('中文')).toBeInTheDocument()
  expect(screen.getByText('English')).toBeInTheDocument()
  const japaneseOption = screen.getByText('日本語（即将支持）')
  expect(japaneseOption.closest('button')).toBeDisabled()
})
