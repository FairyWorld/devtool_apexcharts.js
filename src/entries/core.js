/**
 * ApexCharts — core entry point.
 *
 * Exports the base ApexCharts class with NO chart types and NO optional
 * feature modules registered. Use this as the starting point for custom
 * minimal bundles:
 *
 *   import ApexCharts from 'apexcharts/core'
 *   import 'apexcharts/line'                  // line/area/scatter chart types
 *   import 'apexcharts/features/legend'       // legend (optional)
 *   // Omit features you don't need — they won't be included in your bundle.
 *   // Note: tooltip is always included as part of core.
 */
export { default } from '../apexcharts'
