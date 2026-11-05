import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('virtual:pwa-register/react', () => ({
  useRegisterSW: () => ({ needRefresh: [false, () => {}], updateServiceWorker: vi.fn() }),
}))

import App from './App'

describe('App shell', () => {
  it('opens on Today with the main tabs and the setup card', async () => {
    render(<App />)
    expect(screen.getByRole('heading', { level: 1, name: 'Today' })).toBeInTheDocument()
    for (const tab of ['Today', 'Ideas', 'Pantry', 'History', 'Settings'])
      expect(screen.getByRole('link', { name: tab })).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: 'Start with the starter pantry' })).toBeInTheDocument()
  })
})
