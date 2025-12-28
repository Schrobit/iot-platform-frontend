<template>
  <div class="app-container">
    <div class="filter-container mb-4">
      <el-input v-model="listQuery.keyword" placeholder="关键字" style="width: 150px;" class="filter-item" clearable @keyup.enter="handleFilter" />
      <el-input v-model="listQuery.type" placeholder="类型" style="width: 120px;" class="filter-item" clearable @keyup.enter="handleFilter" />
      <el-input v-model="listQuery.gateway_id" placeholder="网关ID" style="width: 120px;" class="filter-item" clearable @keyup.enter="handleFilter" />
      <el-input v-model="listQuery.cleanroom_id" placeholder="洁净室ID" style="width: 120px;" class="filter-item" clearable @keyup.enter="handleFilter" />
      <el-button type="primary" class="filter-item" @click="handleFilter">搜索</el-button>
      <el-button v-if="authStore.role === 'admin'" type="success" class="filter-item" @click="handleCreate">新增</el-button>
    </div>

    <el-table v-loading="listLoading" :data="list" border fit highlight-current-row style="width: 100%">
      <el-table-column prop="id" label="ID" width="80" align="center" />
      <el-table-column prop="name" label="名称" />
      <el-table-column prop="sn" label="SN" />
      <el-table-column prop="type" label="类型" width="100" />
      <el-table-column prop="gateway_id" label="网关ID" width="100" />
      <el-table-column prop="cleanroom_id" label="洁净室ID" width="100" />
      <el-table-column prop="unit" label="单位" width="80" />
      <el-table-column prop="is_active" label="状态" width="100" align="center">
        <template #default="scope">
          <el-tag :type="scope.row.is_active ? 'success' : 'danger'">
            {{ scope.row.is_active ? '启用' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="350" fixed="right">
        <template #default="scope">
          <el-button size="small" @click="handleView(scope.row)">详情/遥测</el-button>
          <template v-if="authStore.role === 'admin'">
            <el-button size="small" type="warning" @click="handleCommand(scope.row)">下发命令</el-button>
            <el-button size="small" type="primary" @click="handleUpdate(scope.row)">编辑</el-button>
            <el-button size="small" type="danger" @click="handleDelete(scope.row)">删除</el-button>
          </template>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination-container">
        <el-pagination
            v-model:current-page="listQuery.page"
            v-model:page-size="listQuery.page_size"
            :page-sizes="[10, 20, 30, 50]"
            layout="total, sizes, prev, pager, next, jumper"
            :total="total"
            @size-change="handleFilter"
            @current-change="handleFilter"
        />
    </div>

    <!-- Create/Edit Dialog -->
    <el-dialog :title="textMap[dialogStatus]" v-model="dialogFormVisible">
      <el-form ref="dataFormRef" :rules="rules" :model="temp" label-width="100px" style="width: 400px; margin-left:50px;">
        <el-form-item label="名称" prop="name"><el-input v-model="temp.name" /></el-form-item>
        <el-form-item label="SN" prop="sn"><el-input v-model="temp.sn" /></el-form-item>
        <el-form-item label="类型" prop="type"><el-input v-model="temp.type" /></el-form-item>
        <el-form-item label="单位" prop="unit"><el-input v-model="temp.unit" /></el-form-item>
        <el-form-item label="网关ID" prop="gateway_id"><el-input v-model.number="temp.gateway_id" /></el-form-item>
        <el-form-item label="洁净室ID" prop="cleanroom_id"><el-input v-model.number="temp.cleanroom_id" /></el-form-item>
        <el-form-item label="状态" prop="is_active">
          <el-switch v-model="temp.is_active" :active-value="1" :inactive-value="0" />
        </el-form-item>
        <el-form-item label="Meta" prop="meta">
          <el-input type="textarea" v-model="temp.metaStr" :rows="4" placeholder="JSON format" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogFormVisible = false">取消</el-button>
          <el-button type="primary" @click="dialogStatus === 'create' ? createData() : updateData()">确认</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- Command Dialog -->
    <el-dialog title="下发命令" v-model="cmdDialogVisible">
        <el-form :model="cmdTemp" label-width="100px">
            <el-form-item label="命令名称" required>
                <el-input v-model="cmdTemp.command_name" />
            </el-form-item>
            <el-form-item label="Payload">
                <el-input type="textarea" v-model="cmdTemp.payloadStr" :rows="4" placeholder="JSON format" />
            </el-form-item>
        </el-form>
        <template #footer>
            <el-button @click="cmdDialogVisible = false">取消</el-button>
            <el-button type="primary" @click="sendCommand">发送</el-button>
        </template>
    </el-dialog>

    <!-- Drawer -->
    <el-drawer v-model="drawerVisible" :title="drawerTitle" size="60%">
        <el-tabs v-model="activeTab">
            <el-tab-pane label="详情信息" name="info">
                <el-descriptions :column="1" border>
                    <el-descriptions-item label="ID">{{ currentItem.id }}</el-descriptions-item>
                    <el-descriptions-item label="名称">{{ currentItem.name }}</el-descriptions-item>
                    <el-descriptions-item label="SN">{{ currentItem.sn }}</el-descriptions-item>
                    <el-descriptions-item label="Meta">
                        <JsonViewer :data="currentItem.meta" />
                    </el-descriptions-item>
                </el-descriptions>
            </el-tab-pane>
            <el-tab-pane label="遥测历史" name="telemetry">
                <div class="filter-container mb-4" style="flex-wrap: wrap;">
                    <el-date-picker
                        v-model="dateRange"
                        type="datetimerange"
                        range-separator="至"
                        start-placeholder="开始"
                        end-placeholder="结束"
                        style="width: 350px; margin-right: 10px;"
                        value-format="YYYY-MM-DD HH:mm:ss"
                    />
                    <el-select v-model="historyQuery.agg" placeholder="聚合" style="width: 100px; margin-right: 10px;">
                        <el-option label="原始值" value="raw" />
                        <el-option label="平均值" value="mean" />
                        <el-option label="最小值" value="min" />
                        <el-option label="最大值" value="max" />
                        <el-option label="最新值" value="last" />
                    </el-select>
                    <el-input v-model="historyQuery.interval" placeholder="时间间隔(1m)" style="width: 100px; margin-right: 10px;" />
                    <el-input v-model.number="historyQuery.limit" placeholder=" 数据条数" style="width: 80px; margin-right: 10px;" />
                    <el-button type="primary" @click="loadHistory">查询</el-button>
                </div>
                <div v-loading="chartLoading">
                    <TelemetryChart :data="chartData" :title="currentItem.name" :unit="currentItem.unit" />
                </div>
            </el-tab-pane>
        </el-tabs>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick, watch } from 'vue'
import { 
    getDevices, createDevice, updateDevice, deleteDevice, 
    getDeviceTelemetry, sendDeviceCommand 
} from '@/api/devices'
import { useAuthStore } from '@/stores/auth'
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'
import JsonViewer from '@/components/JsonViewer.vue'
import TelemetryChart from '@/components/TelemetryChart.vue'

const authStore = useAuthStore()
const list = ref([])
const total = ref(0)
const listLoading = ref(true)
const listQuery = reactive({
  page: 1, page_size: 10, keyword: undefined,
  type: undefined, gateway_id: undefined, cleanroom_id: undefined
})

const dialogFormVisible = ref(false)
const dialogStatus = ref('')
const textMap = { update: '编辑', create: '新增' }
const dataFormRef = ref(null)
const temp = reactive({
  id: undefined, name: '', sn: '', type: '', unit: '',
  gateway_id: undefined, cleanroom_id: undefined, is_active: 1, metaStr: '{}'
})
const rules = {
  name: [{ required: true, message: '必填', trigger: 'blur' }],
  sn: [{ required: true, message: '必填', trigger: 'blur' }]
}

const cmdDialogVisible = ref(false)
const cmdTemp = reactive({
    command_name: '',
    payloadStr: '{}'
})
const currentCmdDevice = ref(null)

const drawerVisible = ref(false)
const drawerTitle = ref('')
const activeTab = ref('info')
const currentItem = ref({})
const chartData = ref([])
const chartLoading = ref(false)
const dateRange = ref([])
const historyQuery = reactive({
    agg: 'raw', interval: '1m', limit: 100
})

const getList = async () => {
  listLoading.value = true
  try {
    const { code, data } = await getDevices(listQuery)
    if (code === 0) {
      list.value = data.list || data.items || []
      total.value = data.total || 0
    }
  } catch (e) { console.error(e) }
  finally { listLoading.value = false }
}

const handleFilter = () => { listQuery.page = 1; getList() }

const resetTemp = () => {
  Object.assign(temp, {
    id: undefined, name: '', sn: '', type: '', unit: '',
    gateway_id: undefined, cleanroom_id: undefined, is_active: 1, metaStr: '{}'
  })
}

const handleCreate = () => {
  resetTemp()
  dialogStatus.value = 'create'
  dialogFormVisible.value = true
  nextTick(() => dataFormRef.value?.clearValidate())
}

const createData = () => {
  dataFormRef.value?.validate(async (valid) => {
    if (valid) {
      const payload = { ...temp, meta: JSON.parse(temp.metaStr) }
      delete payload.metaStr
      delete payload.id
      const { code } = await createDevice(payload)
      if (code === 0) {
        ElMessage.success('Created')
        dialogFormVisible.value = false
        getList()
      }
    }
  })
}

const handleUpdate = (row) => {
  Object.assign(temp, row)
  temp.metaStr = JSON.stringify(row.meta || {}, null, 2)
  dialogStatus.value = 'update'
  dialogFormVisible.value = true
  nextTick(() => dataFormRef.value?.clearValidate())
}

const updateData = () => {
  dataFormRef.value?.validate(async (valid) => {
    if (valid) {
      const payload = { ...temp, meta: JSON.parse(temp.metaStr) }
      delete payload.metaStr
      const { code } = await updateDevice(temp.id, payload)
      if (code === 0) {
        ElMessage.success('Updated')
        dialogFormVisible.value = false
        getList()
      }
    }
  })
}

const handleDelete = (row) => {
  ElMessageBox.confirm('Delete?').then(async () => {
    const { code } = await deleteDevice(row.id)
    if (code === 0) {
      ElMessage.success('Deleted')
      getList()
    }
  })
}

const handleView = (row) => {
    currentItem.value = row
    drawerTitle.value = `Device - ${row.name}`
    activeTab.value = 'info'
    drawerVisible.value = true
    // Default range: last 1 hour
  const end = dayjs()
  const start = end.subtract(1, 'hour')
  dateRange.value = [start.format('YYYY-MM-DD HH:mm:ss'), end.format('YYYY-MM-DD HH:mm:ss')]
}

const loadHistory = async () => {
    if (!currentItem.value.id) return
    if (!dateRange.value || dateRange.value.length !== 2) {
        ElMessage.warning('Select time range')
        return
    }
    chartLoading.value = true
    try {
        const params = {
            from: dateRange.value[0],
            to: dateRange.value[1],
            agg: historyQuery.agg,
            interval: historyQuery.interval,
            limit: historyQuery.limit
        }
        const { code, data } = await getDeviceTelemetry(currentItem.value.id, params)
        if (code === 0) {
            if (data && Array.isArray(data.points)) {
                chartData.value = data.points
            } else if (Array.isArray(data)) {
                chartData.value = data
            } else {
                chartData.value = []
            }
        }
    } catch(e) { console.error(e) }
    finally { chartLoading.value = false }
}

const handleCommand = (row) => {
    currentCmdDevice.value = row
    cmdTemp.command_name = ''
    cmdTemp.payloadStr = '{}'
    cmdDialogVisible.value = true
}

const sendCommand = async () => {
    if (!cmdTemp.command_name) {
        ElMessage.error('Command name required')
        return
    }
    try {
        const payload = {
            command_name: cmdTemp.command_name,
            payload: JSON.parse(cmdTemp.payloadStr)
        }
        const { code } = await sendDeviceCommand(currentCmdDevice.value.id, payload)
        if (code === 0) {
            ElMessage.success('Command Sent')
            cmdDialogVisible.value = false
        }
    } catch(e) { console.error(e) }
}

watch(activeTab, (val) => {
    if (val === 'telemetry' && chartData.value.length === 0) {
        loadHistory()
    }
})

onMounted(getList)
</script>

<style scoped>
.app-container { padding: 20px; }
.filter-container { display: flex; gap: 10px; }
.pagination-container { margin-top: 20px; display: flex; justify-content: flex-end; }
</style>
