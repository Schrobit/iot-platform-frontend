<template>
  <div class="app-container">
    <!-- Filter Bar -->
    <div class="filter-container mb-4">
      <el-input 
        v-model="listQuery.keyword" 
        placeholder="关键字搜索" 
        style="width: 200px;" 
        class="filter-item" 
        @keyup.enter="handleFilter"
        clearable
        @clear="handleFilter"
      />
      <el-button type="primary" class="filter-item" @click="handleFilter">搜索</el-button>
      <el-button 
        v-if="authStore.role === 'admin'" 
        type="success" 
        class="filter-item" 
        @click="handleCreate"
      >
        新增
      </el-button>
    </div>

    <!-- Table -->
    <el-table 
      v-loading="listLoading" 
      :data="list" 
      border 
      fit 
      highlight-current-row 
      style="width: 100%"
    >
      <el-table-column prop="id" label="ID" width="80" align="center" />
      <el-table-column prop="name" label="名称" />
      <el-table-column prop="is_active" label="状态" width="100" align="center">
        <template #default="scope">
          <el-tag :type="scope.row.is_active ? 'success' : 'danger'">
            {{ scope.row.is_active ? '启用' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="created_at" label="创建时间" width="180">
          <template #default="scope">
              {{ formatTime(scope.row.created_at) }}
          </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="300" fixed="right">
        <template #default="scope">
          <el-button size="small" @click="handleView(scope.row, 'info')">详情</el-button>
          <el-button size="small" @click="handleView(scope.row, 'telemetry')">遥测</el-button>
          <el-button size="small" @click="handleView(scope.row, 'gateways')">网关</el-button>
          <template v-if="authStore.role === 'admin'">
            <el-button size="small" type="primary" @click="handleUpdate(scope.row)">编辑</el-button>
            <el-button size="small" type="danger" @click="handleDelete(scope.row)">删除</el-button>
          </template>
        </template>
      </el-table-column>
    </el-table>

    <!-- Pagination -->
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
      <el-form 
        ref="dataFormRef" 
        :rules="rules" 
        :model="temp" 
        label-position="left" 
        label-width="80px" 
        style="width: 400px; margin-left:50px;"
      >
        <el-form-item label="名称" prop="name">
          <el-input v-model="temp.name" />
        </el-form-item>
        <el-form-item label="状态" prop="is_active">
          <el-switch v-model="temp.is_active" :active-value="1" :inactive-value="0" />
        </el-form-item>
        <el-form-item label="Meta" prop="meta">
          <el-input 
            type="textarea" 
            v-model="temp.metaStr" 
            :rows="4" 
            placeholder="请输入 JSON 格式"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogFormVisible = false">取消</el-button>
          <el-button type="primary" @click="dialogStatus === 'create' ? createData() : updateData()">
            确认
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- View Drawer -->
    <el-drawer v-model="drawerVisible" :title="drawerTitle" size="50%">
        <el-tabs v-model="activeTab">
            <el-tab-pane label="详情信息" name="info">
                <el-descriptions :column="1" border>
                    <el-descriptions-item label="ID">{{ currentItem.id }}</el-descriptions-item>
                    <el-descriptions-item label="名称">{{ currentItem.name }}</el-descriptions-item>
                    <el-descriptions-item label="Meta">
                        <JsonViewer :data="currentItem.meta" />
                    </el-descriptions-item>
                </el-descriptions>
            </el-tab-pane>
            <el-tab-pane label="关联网关" name="gateways">
                <el-table :data="gatewaysList" v-loading="gatewaysLoading" border>
                    <el-table-column prop="id" label="ID" width="80" />
                    <el-table-column prop="name" label="名称" />
                    <el-table-column prop="sn" label="SN" />
                    <el-table-column prop="is_active" label="状态">
                         <template #default="scope">
                            <el-tag :type="scope.row.is_active ? 'success' : 'danger'">
                                {{ scope.row.is_active ? '启用' : '禁用' }}
                            </el-tag>
                        </template>
                    </el-table-column>
                </el-table>
            </el-tab-pane>
            <el-tab-pane label="最新遥测" name="telemetry">
                <div style="margin-bottom: 10px;">
                    <el-button size="small" @click="loadTelemetry">刷新</el-button>
                </div>
                <el-table :data="telemetryList" v-loading="telemetryLoading" border stripe>
                    <el-table-column prop="device_name" label="设备" />
                    <el-table-column prop="type" label="类型" />
                    <el-table-column prop="value" label="值" />
                    <el-table-column prop="unit" label="单位" />
                    <el-table-column prop="ts" label="时间">
                        <template #default="scope">
                            {{ formatTime(scope.row.ts) }}
                        </template>
                    </el-table-column>
                </el-table>
            </el-tab-pane>
        </el-tabs>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick } from 'vue'
import { 
    getCleanrooms, 
    createCleanroom, 
    updateCleanroom, 
    deleteCleanroom, 
    getCleanroomGateways, 
    getCleanroomLatestTelemetry 
} from '@/api/cleanrooms'
import { useAuthStore } from '@/stores/auth'
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'
import JsonViewer from '@/components/JsonViewer.vue'

const authStore = useAuthStore()

// List
const list = ref([])
const total = ref(0)
const listLoading = ref(true)
const listQuery = reactive({
  page: 1,
  page_size: 10,
  keyword: undefined
})

// Dialog
const dialogFormVisible = ref(false)
const dialogStatus = ref('')
const textMap = {
  update: '编辑',
  create: '新增'
}
const dataFormRef = ref(null)
const temp = reactive({
  id: undefined,
  name: '',
  is_active: 1,
  metaStr: '{}'
})
const rules = {
  name: [{ required: true, message: '请输入名称', trigger: 'blur' }],
  meta: [{ 
      validator: (rule, value, callback) => {
          try {
              JSON.parse(temp.metaStr)
              callback()
          } catch (e) {
              callback(new Error('请输入有效的 JSON 格式'))
          }
      }, 
      trigger: 'blur' 
  }]
}

// Drawer
const drawerVisible = ref(false)
const drawerTitle = ref('')
const activeTab = ref('info')
const currentItem = ref({})
const gatewaysList = ref([])
const gatewaysLoading = ref(false)
const telemetryList = ref([])
const telemetryLoading = ref(false)

// Methods
const getList = async () => {
  listLoading.value = true
  try {
    const { code, data } = await getCleanrooms(listQuery)
    if (code === 0) {
      list.value = data.list || data.items || []
      total.value = data.total || 0
    }
  } catch (e) { console.error(e) }
  finally { listLoading.value = false }
}

const handleFilter = () => {
  listQuery.page = 1
  getList()
}

const resetTemp = () => {
  temp.id = undefined
  temp.name = ''
  temp.is_active = 1
  temp.metaStr = '{}'
}

const handleCreate = () => {
  resetTemp()
  dialogStatus.value = 'create'
  dialogFormVisible.value = true
  nextTick(() => {
    dataFormRef.value?.clearValidate()
  })
}

const createData = () => {
  dataFormRef.value?.validate(async (valid) => {
    if (valid) {
      try {
        const payload = {
            name: temp.name,
            is_active: temp.is_active,
            meta: JSON.parse(temp.metaStr)
        }
        const { code } = await createCleanroom(payload)
        if (code === 0) {
          list.value.unshift({ ...payload, id: 'new', created_at: new Date() }) // Optimistic or reload
          ElMessage.success('创建成功')
          dialogFormVisible.value = false
          getList()
        }
      } catch (e) { console.error(e) }
    }
  })
}

const handleUpdate = (row) => {
  temp.id = row.id
  temp.name = row.name
  temp.is_active = row.is_active
  temp.metaStr = JSON.stringify(row.meta || {}, null, 2)
  dialogStatus.value = 'update'
  dialogFormVisible.value = true
  nextTick(() => {
    dataFormRef.value?.clearValidate()
  })
}

const updateData = () => {
  dataFormRef.value?.validate(async (valid) => {
    if (valid) {
      try {
        const payload = {
            name: temp.name,
            is_active: temp.is_active,
            meta: JSON.parse(temp.metaStr)
        }
        const { code } = await updateCleanroom(temp.id, payload)
        if (code === 0) {
          ElMessage.success('更新成功')
          dialogFormVisible.value = false
          getList()
        }
      } catch (e) { console.error(e) }
    }
  })
}

const handleDelete = (row) => {
    ElMessageBox.confirm('确认删除该洁净室吗?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
    }).then(async () => {
        const { code } = await deleteCleanroom(row.id)
        if (code === 0) {
            ElMessage.success('删除成功')
            getList()
        }
    })
}

const handleView = (row, tab) => {
    currentItem.value = row
    drawerTitle.value = `洁净室详情 - ${row.name}`
    activeTab.value = tab
    drawerVisible.value = true
    
    if (tab === 'gateways') loadGateways()
    if (tab === 'telemetry') loadTelemetry()
}

const loadGateways = async () => {
    gatewaysLoading.value = true
    try {
        const { code, data } = await getCleanroomGateways(currentItem.value.id)
        if (code === 0) gatewaysList.value = data || []
    } catch (e) { console.error(e) }
    finally { gatewaysLoading.value = false }
}

const loadTelemetry = async () => {
    telemetryLoading.value = true
    try {
        const { code, data } = await getCleanroomLatestTelemetry(currentItem.value.id)
        if (code === 0) {
            telemetryList.value = (data || []).map(item => ({
                ...item,
                device_name: item.device_name ?? item.name ?? ''
            }))
        }
    } catch (e) { console.error(e) }
    finally { telemetryLoading.value = false }
}

const formatTime = (ts) => dayjs(ts).format('YYYY-MM-DD HH:mm:ss')

onMounted(() => {
    getList()
})
</script>

<style scoped>
.app-container {
    padding: 20px;
}
.filter-container {
    display: flex;
    gap: 10px;
    align-items: center;
}
.pagination-container {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
}
</style>
