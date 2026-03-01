/**
 * Legend — click to toggle series visibility.
 *
 * Covers:
 *   - Clicking a legend entry collapses the series (adds collapsed class)
 *   - Clicking again re-expands it
 *   - No JS errors during toggle
 */

import { test, expect } from '../fixtures/base.js'
import { clickLegend, collapsedSeriesCount } from '../helpers/chart.js'

// We use mixed/line-column.html which has multiple named series and a legend,
// making it the most straightforward sample for toggle testing.
// Series names: "Website Blog" and "Social Media"

test.describe('Legend toggle', () => {
  test('clicking legend entry collapses a series', async ({ page, loadChart }) => {
    await loadChart('mixed', 'line-column')

    expect(await collapsedSeriesCount(page)).toBe(0)

    // Toggle the first named series off.
    await clickLegend(page, 'Website Blog')

    // Wait for the DOM class to apply.
    await page.waitForTimeout(300)

    expect(await collapsedSeriesCount(page)).toBe(1)
  })

  test('clicking legend entry again re-expands the series', async ({ page, loadChart }) => {
    await loadChart('mixed', 'line-column')

    await clickLegend(page, 'Website Blog')
    await page.waitForTimeout(300)
    expect(await collapsedSeriesCount(page)).toBe(1)

    await clickLegend(page, 'Website Blog')
    await page.waitForTimeout(300)
    expect(await collapsedSeriesCount(page)).toBe(0)
  })

  test('no JS errors during legend toggle', async ({ page, loadChart }) => {
    await loadChart('mixed', 'line-column')

    await clickLegend(page, 'Website Blog')
    await page.waitForTimeout(300)
    await clickLegend(page, 'Social Media')
    await page.waitForTimeout(300)
    // consoleErrors check runs automatically in fixture.
  })
})
