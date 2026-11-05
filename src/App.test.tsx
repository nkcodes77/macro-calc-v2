import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('virtual:pwa-register/react', () => ({
  useRegisterSW: () => ({ needRefresh: [false, () => {}], updateServiceWorker: vi.fn() }),
}))

import App from './App'

describe('App shell', () => {
  it('renders the title and a link back to the current app', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: 'Macro Calc' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'current app' })).toHaveAttribute(
      'href',
      'https://nkcodes77.github.io/macro-calc/',
    )
  })
})
