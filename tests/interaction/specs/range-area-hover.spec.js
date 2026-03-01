/**
 * Range-area chart — hover / tooltip interaction tests.
 *
 * This spec is the direct regression guard for two bugs fixed during the
 * globals-deprecation refactor:
 *
 *   1. `pathMouseEnter` crash — `this.ctx.events` was null when Graphics was
 *      constructed without a ctx arg (fixed: Graphics._fireEvent reads
 *      w.globals.events directly).
 *
 *   2. `buildRangeTooltipHTML` crash — `opts.ctx.tooltip.tooltipLabels` was
 *      null after `ctx:` was removed from the tooltip.custom callback args
 *      (fixed: uses opts.w.globals.tooltip.tooltipLabels instead).
 *
 * If either regression returns, every test in this file will fail because the
 * consoleErrors fixture automatically fails the test on any JS exception.
 *
 * NOTE: Range-area uses a custom tooltip template (buildRangeTooltipHTML) that
 * renders inside .apexcharts-tooltip-rangebar. There is NO .apexcharts-tooltip-title
 * element — the month label is in <span class="category">Jan: </span> and
 * values are in <span class="value start-value"> and <span class="value end-value">.
 */

import { test, expect } from '../fixtures/base.js'
import { hoverDataPoint, waitForTooltip, captureEvent } from '../helpers/chart.js'

// basic-range-area.html: single series "New York Temperature"
// 12 monthly data points, each y = [min, max] in °C
// Jan: [-2, 4], Feb: [-1, 6], ..., Dec: [1, 7]

test.describe('Range-area chart hover', () => {
  test('no JS errors when hovering data points', async ({ page, loadChart }) => {
    await loadChart('rangeArea', 'basic-range-area')

    // Hover every point. The bug caused a crash on the very first hover,
    // so this immediately catches both regressions if they return.
    for (let j = 0; j < 12; j++) {
      await hoverDataPoint(page, 0, j)
    }
  })

  test('tooltip renders without crashing on first point', async ({ page, loadChart }) => {
    await loadChart('rangeArea', 'basic-range-area')

    await hoverDataPoint(page, 0, 0)
    await waitForTooltip(page)

    // Range-area has no .apexcharts-tooltip-title — the month label is
    // rendered as <span class="category">Jan: </span> inside the rangebar div.
    // Just asserting the tooltip appeared at all proves buildRangeTooltipHTML
    // ran without throwing.
    const category = await page
      .locator('.apexcharts-tooltip-rangebar .category')
      .first()
      .textContent()
    expect(category.trim()).toMatch(/^Jan/)
  })

  test('tooltip shows range values (start and end) for first point', async ({ page, loadChart }) => {
    await loadChart('rangeArea', 'basic-range-area')

    // Jan: y = [-2, 4], yaxis formatter adds '°C'
    await hoverDataPoint(page, 0, 0)
    await waitForTooltip(page)

    // Range-area uses buildRangeTooltipHTML which renders:
    //   <span class="value start-value">-2°C</span>
    //   <span class="value end-value">4°C</span>
    const startValue = await page
      .locator('.apexcharts-tooltip-rangebar .value.start-value')
      .first()
      .textContent()
    const endValue = await page
      .locator('.apexcharts-tooltip-rangebar .value.end-value')
      .first()
      .textContent()

    expect(startValue.trim()).toBe('-2°C')
    expect(endValue.trim()).toBe('4°C')
  })

  test('tooltip shows correct values for mid-year point', async ({ page, loadChart }) => {
    await loadChart('rangeArea', 'basic-range-area')

    // Jul: y = [21, 29]
    await hoverDataPoint(page, 0, 6)
    await waitForTooltip(page)

    const category = await page
      .locator('.apexcharts-tooltip-rangebar .category')
      .first()
      .textContent()
    expect(category.trim()).toMatch(/^Jul/)

    const startValue = await page
      .locator('.apexcharts-tooltip-rangebar .value.start-value')
      .first()
      .textContent()
    const endValue = await page
      .locator('.apexcharts-tooltip-rangebar .value.end-value')
      .first()
      .textContent()

    expect(startValue.trim()).toBe('21°C')
    expect(endValue.trim()).toBe('29°C')
  })

  test('dataPointMouseEnter fires with correct indices', async ({ page, loadChart }) => {
    await loadChart('rangeArea', 'basic-range-area')

    const cfg = await captureEvent(page, 'dataPointMouseEnter', () =>
      hoverDataPoint(page, 0, 3),
    )
    expect(cfg.seriesIndex).toBe(0)
    expect(cfg.dataPointIndex).toBe(3)
  })
})
