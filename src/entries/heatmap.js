/**
 * ApexCharts — heatmap / treemap entry point.
 *
 * Usage:
 *   import ApexCharts from 'apexcharts/heatmap'
 *
 * Registers: heatmap, treemap
 */
import ApexCharts from '../apexcharts'
import HeatMap from '../charts/HeatMap'
import Treemap from '../charts/Treemap'

ApexCharts.use({
  heatmap: HeatMap,
  treemap: Treemap,
})

export default ApexCharts
