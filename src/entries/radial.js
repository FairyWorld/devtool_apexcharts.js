/**
 * ApexCharts — radialBar / radar entry point.
 *
 * Usage:
 *   import ApexCharts from 'apexcharts/radial'
 *
 * Registers: radialBar, radar
 */
import ApexCharts from '../apexcharts'
import Radial from '../charts/Radial'
import Radar from '../charts/Radar'

ApexCharts.use({
  radialBar: Radial,
  radar: Radar,
})

export default ApexCharts
