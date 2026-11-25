import { act, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import Toast, { useToast } from './Toast'

afterEach(() => vi.useRealTimers())

function Example() {
  const { toast, notify, dismiss } = useToast()
  return (
    <>
      <button onClick={() => notify('Đã lưu.')}>Lưu</button>
      <Toast toast={toast} onDismiss={dismiss} />
    </>
  )
}

it('automatically hides the popup and restarts the timeout for a repeated message', () => {
  vi.useFakeTimers()
  render(<Example />)
  act(() => screen.getByRole('button', { name: 'Lưu' }).click())
  expect(screen.getByRole('status')).toHaveTextContent('Đã lưu.')
  act(() => vi.advanceTimersByTime(3000))
  act(() => screen.getByRole('button', { name: 'Lưu' }).click())
  act(() => vi.advanceTimersByTime(1000))
  expect(screen.getByRole('status')).toBeInTheDocument()
  act(() => vi.advanceTimersByTime(2500))
  expect(screen.queryByRole('status')).not.toBeInTheDocument()
})

it('cleans up the dismissal timer when leaving the page', () => {
  vi.useFakeTimers()
  const { unmount } = render(<Example />)
  act(() => screen.getByRole('button', { name: 'Lưu' }).click())
  unmount()
  expect(vi.getTimerCount()).toBe(0)
})
