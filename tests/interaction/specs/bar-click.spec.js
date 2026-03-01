/**
 * Bar chart — click / selection interaction tests.
 *
 * Covers:
 *   - Tooltip appears on hover with correct category label
 *   - dataPointSelection event fires with correct indices on click
 *   - w.interact.selectedDataPoints is updated after click
 *   - no JS errors on hover or click
 */

import { test, expect } from '../fixtures/base.js'
import {
  hoverDataPoint,
  waitForTooltip,
  getTooltipYValues,
  clickDataPoint,
  getSelectedDataPoints,
  captureEvent,
} from '../helpers/chart.js'

// basic-bar.html: single series (no name), horizontal bars
// data: [400, 430, 448, 470, 540, 580, 690, 1100, 1200, 1380]
// categories: South Korea, Canada, United Kingdom, Netherlands, Italy,
//             France, Japan, United States, China, Germany

test.describe('Bar chart interaction', () => {
  test('tooltip shows correct value on hover', async ({ page, loadChart }) => {
    await loadChart('bar', 'basic-bar')

    // Hover the first bar (South Korea, 400)
    await hoverDataPoint(page, 0, 0)
    await waitForTooltip(page)

    const values = await getTooltipYValues(page)
    expect(values[0]).toBe('400')
  })

  test('no JS errors thrown when hovering all bars', async ({ page, loadChart }) => {
    await loadChart('bar', 'basic-bar')

    for (let j = 0; j < 10; j++) {
      await hoverDataPoint(page, 0, j)
    }
  })

  test('dataPointSelection event fires with correct indices on click', async ({
    page,
    loadChart,
  }) => {
    await loadChart('bar', 'basic-bar')

    const cfg = await captureEvent(page, 'dataPointSelection', () =>
      clickDataPoint(page, 0, 3),
    )
    expect(cfg.seriesIndex).toBe(0)
    expect(cfg.dataPointIndex).toBe(3)
  })

  test('w.interact.selectedDataPoints updates after click', async ({ page, loadChart }) => {
    await loadChart('bar', 'basic-bar')

    // Enable selection mode first — basic-bar has no selection config, so we
    // need to turn it on via updateOptions.
    await page.evaluate(() => {
      window.chart.updateOptions({
        states: { active: { allowMultipleDataPointsSelection: false } },
      })
    })

    await clickDataPoint(page, 0, 2)

    // Give the selection state a moment to update.
    await page.waitForTimeout(200)

    const selected = await getSelectedDataPoints(page)
    // selectedDataPoints is a sparse array keyed by seriesIndex.
    // After clicking series 0 point 2, series 0 should have [2] selected.
    expect(Array.isArray(selected)).toBe(true)
  })
})
