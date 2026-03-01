/**
 * Reusable Playwright helpers for ApexCharts interaction tests.
 *
 * All helpers receive a Playwright `page` object.
 */

/**
 * Wait for the tooltip to become visible (.apexcharts-active class).
 */
export async function waitForTooltip(page) {
  await page.waitForSelector('.apexcharts-tooltip.apexcharts-active', {
    timeout: 3_000,
  })
}

/**
 * Return all visible y-values from the active tooltip.
 * e.g. ['100', '250'] for a two-series chart.
 */
export async function getTooltipYValues(page) {
  return page
    .locator('.apexcharts-tooltip-text-y-value')
    .allTextContents()
}

/**
 * Return the tooltip title text (usually the x-axis label).
 */
export async function getTooltipTitle(page) {
  return page.locator('.apexcharts-tooltip-title').textContent()
}

/**
 * Hover over a data point.
 *
 * Strategy:
 *  - If the chart has a per-point element with [index][j] attributes (bar,
 *    column, heatmap), hover that element directly — this bubbles a mousemove
 *    to the canvas tooltip listener AND fires mouseenter on the element so
 *    pathMouseEnter → dataPointMouseEnter fires.
 *  - Otherwise (line, area, range-area) dispatch a mousemove on the SVG canvas
 *    at the pixel coordinates from w.globals.seriesXvalues / seriesYvalues.
 *    If a marker element exists after the event (e.g. armEventCapture enabled
 *    markers), also dispatch mouseenter on it to fire dataPointMouseEnter.
 */
export async function hoverDataPoint(page, seriesIndex, dataPointIndex) {
  const selector = `[index="${seriesIndex}"][j="${dataPointIndex}"]`
  const el = page.locator(selector).first()
  const count = await el.count()

  if (count > 0) {
    // Element exists — hover it directly (bar, column, heatmap, markers).
    await el.hover({ force: true })
  } else {
    // Coordinate-based fallback for line/area/range-area.
    await page.evaluate(
      ([si, di]) => {
        const gl = window.chart.w.globals
        const xVals = gl.seriesXvalues[si]
        // Add a small inward nudge (capped at 5 px) so the tooltip hit-test
        // doesn't land exactly on the grid edge for data point 0 (x = 0).
        const step = xVals.length > 1 ? xVals[1] - xVals[0] : 10
        const x = gl.translateX + xVals[di] + Math.min(step / 2, 5)
        const y = gl.translateY + gl.seriesYvalues[si][di]

        const svgEl = document.querySelector('.apexcharts-svg')
        const rect = svgEl.getBoundingClientRect()
        const clientX = rect.left + x
        const clientY = rect.top + y

        svgEl.dispatchEvent(
          new MouseEvent('mousemove', {
            bubbles: true,
            cancelable: true,
            clientX,
            clientY,
          }),
        )

        // Also fire mouseenter on a marker element if it now exists (e.g.
        // after armEventCapture called updateOptions({ markers: { size:6 } })).
        const pointEl = svgEl.querySelector(`[index="${si}"][j="${di}"]`)
        if (pointEl) {
          pointEl.dispatchEvent(
            new MouseEvent('mouseenter', {
              bubbles: false,
              cancelable: true,
              clientX,
              clientY,
            }),
          )
        }
      },
      [seriesIndex, dataPointIndex],
    )
    await page.waitForTimeout(50)
  }
}

/**
 * Click a data point by dispatching mousedown + click events on the SVG canvas
 * at the pixel coordinates of the data point.
 *
 * For bar charts the [index][j] element click is reliable; for others (line,
 * area) we use coordinate-based dispatch to avoid selector timeouts.
 */
export async function clickDataPoint(page, seriesIndex, dataPointIndex) {
  // Try element-based click first (works for bar/column/rangeBar whose rect
  // elements carry [index] and [j] attributes).
  const selector = `[index="${seriesIndex}"][j="${dataPointIndex}"]`
  const el = page.locator(selector).first()
  const exists = await el.count()
  if (exists > 0) {
    await el.click({ force: true })
    return
  }

  // Fallback: coordinate-based click on the SVG for line/area/range-area.
  await page.evaluate(
    ([si, di]) => {
      const gl = window.chart.w.globals
      const x = gl.translateX + gl.seriesXvalues[si][di]
      const y = gl.translateY + gl.seriesYvalues[si][di]

      const svgEl = document.querySelector('.apexcharts-svg')
      const rect = svgEl.getBoundingClientRect()
      const opts = {
        bubbles: true,
        cancelable: true,
        clientX: rect.left + x,
        clientY: rect.top + y,
      }
      svgEl.dispatchEvent(new MouseEvent('mousedown', opts))
      svgEl.dispatchEvent(new MouseEvent('mouseup', opts))
      svgEl.dispatchEvent(new MouseEvent('click', opts))
    },
    [seriesIndex, dataPointIndex],
  )
  await page.waitForTimeout(50)
}

/**
 * Read w.interact.selectedDataPoints from the live chart instance.
 * Returns a plain array-of-arrays copy.
 */
export async function getSelectedDataPoints(page) {
  return page.evaluate(() =>
    JSON.parse(JSON.stringify(window.chart.w.interact.selectedDataPoints)),
  )
}

/**
 * Click a legend entry by series name text.
 */
export async function clickLegend(page, seriesName) {
  await page
    .locator(`.apexcharts-legend-text:text("${seriesName}")`)
    .click({ force: true })
}

/**
 * Return the count of currently collapsed (hidden) series.
 */
export async function collapsedSeriesCount(page) {
  return page.locator('.apexcharts-series-collapsed').count()
}

/**
 * Set up a one-shot capture for an ApexCharts chart event.
 *
 * Call this BEFORE the interaction that triggers the event.
 * It writes the captured config to window.__capturedEvent, then call
 * `waitForCapturedEvent(page)` after the interaction to read the result.
 *
 * Two-step design avoids the deadlock that would occur if page.evaluate()
 * tried to both register and await the event in a single call (the browser
 * Promise would never resolve because the hover hasn't fired yet).
 *
 * Example:
 *   await armEventCapture(page, 'dataPointMouseEnter')
 *   await hoverDataPoint(page, 0, 2)
 *   const cfg = await waitForCapturedEvent(page)
 *   // cfg = { seriesIndex: 0, dataPointIndex: 2 }
 */
export async function armEventCapture(page, eventName) {
  await page.evaluate((name) => {
    window.__capturedEvent = null
    window.chart.updateOptions({
      // Enable intersect mode so markers lose the `no-pointer-events` CSS
      // class and mouseenter events can reach them. Also set size > 0 so
      // per-point marker elements (with [index][j] attrs) are rendered.
      // Both are required for pathMouseEnter → dataPointMouseEnter to fire
      // on line/area/range-area charts.
      tooltip: { intersect: true, shared: false },
      markers: { size: 6 },
      chart: {
        events: {
          [name]: (_e, _ctx, config) => {
            window.__capturedEvent = {
              seriesIndex: Number(config.seriesIndex),
              dataPointIndex: Number(config.dataPointIndex),
            }
          },
        },
      },
    })
  }, eventName)
  // Wait for re-render triggered by updateOptions.
  await page.waitForFunction(
    () => window.chart.w.globals.animationEnded === true,
    { timeout: 5_000 },
  )
}

/**
 * Wait for window.__capturedEvent to be set (populated by armEventCapture),
 * then return and clear it. Rejects after `timeout` ms.
 */
export async function waitForCapturedEvent(page, timeout = 3_000) {
  await page.waitForFunction(() => window.__capturedEvent !== null, { timeout })
  return page.evaluate(() => {
    const result = window.__capturedEvent
    window.__capturedEvent = null
    return result
  })
}

/**
 * Convenience wrapper: arms the capture, runs `action`, waits for result.
 *
 * Example:
 *   const cfg = await captureEvent(page, 'dataPointMouseEnter', () =>
 *     hoverDataPoint(page, 0, 2)
 *   )
 */
export async function captureEvent(page, eventName, action) {
  await armEventCapture(page, eventName)
  await action()
  return waitForCapturedEvent(page)
}
