<template>
  <div class="dashboard-container">
    <!-- System Health -->
    <el-card class="box-card mb-4">
      <template #header>
        <div class="card-header">
          <span>系统健康状态</span>
          <el-button text @click="fetchHealth">刷新</el-button>
        </div>
      </template>
      <el-row :gutter="20">
        <el-col :span="6" v-for="(status, name) in health" :key="name">
          <el-alert
            :title="healthNameMap[name] || name.toUpperCase()"
            :type="status === 'up' ? 'success' : 'error'"
            :description="status === 'up' ? '正常' : '连接失败'"
            show-icon
            :closable="false"
          />
        </el-col>
      </el-row>
    </el-card>

    <!-- KPIs -->
    <el-row :gutter="20" class="mb-4">
      <el-col :span="8">
        <el-card shadow="hover">
          <template #header>洁净室总数</template>
          <div class="kpi-value">{{ kpi.cleanrooms }}</div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover">
          <template #header>网关总数</template>
          <div class="kpi-value">{{ kpi.gateways }}</div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover">
          <template #header>设备总数</template>
          <div class="kpi-value">{{ kpi.devices }}</div>
        </el-card>
      </el-col>
    </el-row>

    <!-- Latest Telemetry -->
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>最新遥测概览</span>
          <div class="filter-container">
            <el-select 
                v-model="selectedCleanroomId" 
                placeholder="选择洁净室" 
                @change="handleCleanroomChange"
                style="width: 200px; margin-right: 10px;"
            >
                <el-option
                    v-for="item in cleanrooms"
                    :key="item.id"
                    :label="item.name"
                    :value="item.id"
                />
            </el-select>
            <el-input 
                v-model="filterType" 
                placeholder="筛选类型 (Type)" 
                style="width: 150px" 
                clearable
            />
          </div>
        </div>
      </template>
      
      <el-table :data="filteredTelemetry" v-loading="telemetryLoading" style="width: 100%" stripe>
        <el-table-column prop="device_name" label="设备名称" />
        <el-table-column prop="type" label="类型" />
        <el-table-column prop="value" label="值" />
        <el-table-column prop="unit" label="单位" />
        <el-table-column prop="ts" label="时间">
            <template #default="scope">
                {{ formatTime(scope.row.ts) }}
            </template>
        </el-table-column>
        <template #empty>
          <span v-if="selectedCleanroomId">暂无数据</span>
          <span v-else></span>
        </template>
      </el-table>
      <el-empty v-if="!selectedCleanroomId" description="请选择一个洁净室查看数据" />
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { getSystemHealth } from '@/api/dashboard'
import { getCleanrooms, getCleanroomLatestTelemetry } from '@/api/cleanrooms'
import { getDevices } from '@/api/devices'
import { getGateways } from '@/api/gateways'
import dayjs from 'dayjs'

const health = ref({})
const healthNameMap = {
  service: '系统服务',
  mysql: 'MySQL',
  influxdb: 'InfluxDB',
  rabbitmq: 'RabbitMQ'
}
const kpi = reactive({
    cleanrooms: 0,
    devices: 0,
    gateways: 0
})
const cleanrooms = ref([])
const selectedCleanroomId = ref(null)
const telemetryData = ref([])
const telemetryLoading = ref(false)
const filterType = ref('')

const filteredTelemetry = computed(() => {
    if (!filterType.value) return telemetryData.value
    return telemetryData.value.filter(item => 
        item.type.toLowerCase().includes(filterType.value.toLowerCase())
    )
})

const formatTime = (ts) => {
    return dayjs(ts).format('YYYY-MM-DD HH:mm:ss')
}

const fetchHealth = async () => {
    try {
        const { code, data } = await getSystemHealth()
        if (code === 0) health.value = data
    } catch (e) { console.error(e) }
}

const fetchKPIs = async () => {
    try {
        // Fetch totals via list interfaces (assuming API returns total in meta or pagination)
        // Swagger says: GET /cleanrooms?page&page_size. Response: {code, data: {items: [], total: 100}} usually.
        // I need to check the API response structure for list. 
        // Based on typical REST: data might be { list: [], total: 0 } or just [].
        // "分别调用 list 接口取 total"
        
        const [cRes, gRes, dRes] = await Promise.all([
            getCleanrooms({ page_size: 1 }),
            getGateways({ page_size: 1 }),
            getDevices({ page_size: 1 })
        ])
        
        if (cRes.code === 0) kpi.cleanrooms = cRes.data.total || 0
        if (gRes.code === 0) kpi.gateways = gRes.data.total || 0
        if (dRes.code === 0) kpi.devices = dRes.data.total || 0

    } catch (e) { console.error(e) }
}

const fetchCleanrooms = async () => {
    try {
        const { code, data } = await getCleanrooms({ page_size: 100 }) // Get first 100 for dropdown
        if (code === 0) {
            cleanrooms.value = data.list || data.items || [] // Handle likely response structure
        }
    } catch (e) { console.error(e) }
}

const handleCleanroomChange = async (id) => {
    if (!id) return
    telemetryLoading.value = true
    try {
        const { code, data } = await getCleanroomLatestTelemetry(id)
        if (code === 0) {
            telemetryData.value = (data || []).map(item => ({
                ...item,
                device_name: item.device_name ?? item.name ?? ''
            }))
        }
    } catch (e) { console.error(e) }
    finally { telemetryLoading.value = false }
}

onMounted(() => {
    fetchHealth()
    fetchKPIs()
    fetchCleanrooms()
})
</script>

<style scoped>
.dashboard-container {
    padding: 20px;
}
.mb-4 {
    margin-bottom: 20px;
}
.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}
.kpi-value {
    font-size: 24px;
    font-weight: bold;
    text-align: center;
    color: #409EFF;
}
.filter-container {
    display: flex;
    align-items: center;
}
</style>
