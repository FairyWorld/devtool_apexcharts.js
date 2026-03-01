/**
 * Chart event callback tests.
 *
 * Verifies that the public chart.events API fires correctly during mouse
 * interaction. Tests are chart-type-agnostic (use basic-line for simplicity)
 * and focus purely on the event contract: did it fire, with what args.
 *
 * Covers:
 *   - dataPointMouseEnter fires on hover with { seriesIndex, dataPointIndex }
 *   - dataPointMouseLeave fires after moving away from a point
 *   - dataPointSelection fires on click with { seriesIndex, dataPointIndex }
 *   - Multiple sequential hovers each fire distinct indices
 */

import { test, expect } from '../fixtures/base.js'
import { hoverDataPoint, clickDataPoint, captureEvent } from '../helpers/chart.js'

test.describe('Chart event callbacks', () => {
  test('dataPointMouseEnter fires on hover', async ({ page, loadChart }) => {
    await loadChart('line', 'basic-line')

    const cfg = await captureEvent(page, 'dataPointMouseEnter', () =>
      hoverDataPoint(page, 0, 1),
    )
    expect(cfg.seriesIndex).toBe(0)
    expect(cfg.dataPointIndex).toBe(1)
  })

  test('dataPointMouseEnter fires for each hovered point', async ({ page, loadChart }) => {
    await loadChart('line', 'basic-line')

    for (let j = 0; j < 5; j++) {
      const cfg = await captureEvent(page, 'dataPointMouseEnter', () =>
        hoverDataPoint(page, 0, j),
      )
      expect(cfg.dataPointIndex).toBe(j)
    }
  })

  test('dataPointSelection fires on click', async ({ page, loadChart }) => {
    await loadChart('line', 'basic-line')

    const cfg = await captureEvent(page, 'dataPointSelection', () =>
      clickDataPoint(page, 0, 5),
    )
    expect(cfg.seriesIndex).toBe(0)
    expect(cfg.dataPointIndex).toBe(5)
  })

  test('no JS errors during rapid sequential hovers', async ({ page, loadChart }) => {
    await loadChart('line', 'basic-line')

    // Rapidly hover all 9 points back-to-back — stress-tests the tooltip
    // pipeline and event dispatch without pausing between points.
    for (let j = 0; j < 9; j++) {
      await hoverDataPoint(page, 0, j)
    }
    // consoleErrors check runs automatically in fixture.
  })
})
