import { expect, test } from '@playwright/test'

const legacy = {
  goals: { cal: 2200, p: 180, c: 220, f: 65 },
  pantry: [
    {
      id: 1,
      name: "TJ's Low Fat Greek Yogurt",
      brand: "Trader Joe's",
      emoji: '🫙',
      serving: '1 cup (227g)',
      cal: 130,
      p: 22,
      c: 9,
      f: 2,
      stock: true,
    },
    {
      id: 8,
      name: 'Large Cage-Free Egg',
      brand: "Trader Joe's",
      emoji: '🥚',
      serving: '1 egg (50g)',
      cal: 70,
      p: 6,
      c: 0,
      f: 5,
      stock: true,
    },
  ],
  days: {
    '2026-11-01': {
      Breakfast: [{ name: 'Large Cage-Free Egg', emoji: '🥚', cal: 70, p: 6, c: 0, f: 5, qty: 3 }],
      Lunch: [],
      Dinner: [],
      Snacks: [],
    },
  },
}

test('first run: start with the starter pantry and log a food', async ({ page }) => {
  await page.goto('./')
  await page.getByRole('button', { name: 'Start with the starter pantry' }).click()
  await expect(page.getByRole('button', { name: 'Start with the starter pantry' })).toBeHidden()

  await page.getByRole('region', { name: 'Breakfast' }).getByRole('button', { name: 'Add food' }).click()
  const sheet = page.getByRole('dialog', { name: 'Add to Breakfast' })
  await sheet.getByRole('searchbox').fill('egg')
  await sheet.getByRole('button', { name: /Large Cage-Free Egg/ }).click()
  await sheet.getByRole('button', { name: 'More' }).click()
  await sheet.getByRole('button', { name: 'More' }).click()
  await expect(sheet.getByText('12g')).toBeVisible()
  await sheet.getByRole('button', { name: 'Log food' }).click()
  await expect(sheet.getByText('Logged Large Cage-Free Egg')).toBeVisible()
  await sheet.getByRole('button', { name: 'Close' }).click()

  const breakfast = page.getByRole('region', { name: 'Breakfast' })
  await expect(breakfast.getByText('2 × 1 egg, 140 cal, 12g protein')).toBeVisible()
  await expect(page.getByText('168g')).toBeVisible() // protein left

  await page.reload()
  await expect(page.getByRole('region', { name: 'Breakfast' }).getByText('Large Cage-Free Egg')).toBeVisible()
})

test('imports data from the first app on the same site', async ({ page }) => {
  await page.addInitScript((data) => localStorage.setItem('macrocalc.v1', JSON.stringify(data)), legacy)
  await page.goto('./')
  await page.getByRole('button', { name: 'Import from current app' }).click()
  await page.getByRole('link', { name: 'History' }).click()
  await expect(page.getByText('210 cal')).toBeVisible()
  await expect(page.getByText('18g protein')).toBeVisible()
  await page.getByRole('link', { name: 'Pantry' }).click()
  await expect(page.getByText("TJ's Low Fat Greek Yogurt")).toBeVisible()
})

test('adds a Trader Joe’s item to the pantry and toggles stock', async ({ page }) => {
  await page.goto('./#/pantry')
  await page.getByRole('searchbox').fill('smoked sal')
  await page.getByRole('button', { name: 'Add', exact: true }).click()
  await expect(page.getByText('Added Smoked Salmon')).toBeVisible()
  const stock = page.getByRole('button', { name: 'Smoked Salmon in stock' })
  await expect(stock).toHaveAttribute('aria-pressed', 'true')
  await stock.click()
  await expect(stock).toHaveAttribute('aria-pressed', 'false')
})

test('meal ideas log a whole meal', async ({ page }) => {
  await page.goto('./')
  await page.getByRole('button', { name: 'Start with the starter pantry' }).click()
  await page.getByRole('link', { name: 'Ideas' }).click()
  await page.getByLabel('Log ideas to').selectOption('Lunch')
  await page.getByRole('button', { name: 'Log this meal to Lunch' }).first().click()
  await expect(page.getByRole('heading', { level: 1, name: 'Today' })).toBeVisible()
  await expect(page.getByRole('region', { name: 'Lunch' }).locator('div', { hasText: '×' }).first()).toBeVisible()
})

test('works offline after the first visit', async ({ page, context }) => {
  await page.goto('./')
  await page.evaluate(() => navigator.serviceWorker.ready)
  await page.reload()
  await context.setOffline(true)
  await page.reload()
  await expect(page.getByRole('heading', { level: 1, name: 'Today' })).toBeVisible()
})
