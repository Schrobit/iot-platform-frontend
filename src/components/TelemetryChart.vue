<template>
  <div ref="chartRef" class="chart-container"></div>
</template>

<script setup>
import { ref, onMounted, watch, onUnmounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import dayjs from 'dayjs'

const props = defineProps({
  data: {
    type: [Array, Object],
    default: () => []
  },
  title: String,
  unit: String
})

const chartRef = ref(null)
let chartInstance = null
let resizeObserver = null

const getSeriesData = () => {
  if (Array.isArray(props.data)) {
    return props.data
  }
  if (props.data && Array.isArray(props.data.points)) {
    return props.data.points
  }
  return []
}

const ensureChartInstance = () => {
  if (chartInstance) return true
  if (!chartRef.value) return false

  const { clientWidth, clientHeight } = chartRef.value
  if (!clientWidth || !clientHeight) return false

  chartInstance = echarts.init(chartRef.value)
  return true
}

const initChart = () => {
  if (!ensureChartInstance()) return
  updateChart()
}

const updateChart = () => {
  if (!chartInstance) return

  const seriesData = getSeriesData()

  const xData = seriesData.map(item => dayjs(item.ts).format('YYYY-MM-DD HH:mm:ss'))
  const yData = seriesData.map(item => item.value)

  const option = {
    title: {
      text: props.title,
      left: 'center'
    },
    tooltip: {
      trigger: 'axis'
    },
    xAxis: {
      type: 'category',
      data: xData
    },
    yAxis: {
      type: 'value',
      name: props.unit
    },
    series: [
      {
        data: yData,
        type: 'line',
        smooth: true
      }
    ],
    graphic: seriesData.length
      ? undefined
      : {
          type: 'text',
          left: 'center',
          top: 'middle',
          style: {
            text: '暂无数据',
            fontSize: 14,
            fill: '#909399'
          }
        }
  }

  chartInstance.setOption(option, { notMerge: true })
}

watch(() => props.data, () => {
  if (!ensureChartInstance()) return
  updateChart()
}, { deep: true })

watch(() => [props.title, props.unit], () => {
  if (!ensureChartInstance()) return
  updateChart()
})

onMounted(() => {
  resizeObserver = new ResizeObserver(() => {
    if (!ensureChartInstance()) return
    chartInstance.resize()
    updateChart()
  })

  if (chartRef.value) resizeObserver.observe(chartRef.value)

  nextTick(() => {
    initChart()
    handleResize()
  })

  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }
  if (chartInstance) {
    chartInstance.dispose()
    chartInstance = null
  }
})

const handleResize = () => {
  chartInstance && chartInstance.resize()
}
</script>

<style scoped>
.chart-container {
  width: 100%;
  height: 400px;
}
</style>
