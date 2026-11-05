import { expect, test } from '@playwright/test'

test('app opens at iPhone size with no errors', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))

  await page.goto('./')
  await expect(page.getByRole('heading', { name: 'Macro Calc' })).toBeVisible()

  const hasHorizontalScroll = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  )
  expect(hasHorizontalScroll).toBe(false)
  expect(errors).toEqual([])
})

test('web app manifest is served', async ({ request }) => {
  const res = await request.get('manifest.webmanifest')
  expect(res.ok()).toBe(true)
  expect((await res.json()).short_name).toBe('Macro Calc')
})
