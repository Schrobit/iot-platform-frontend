<template>
  <div class="app-container">
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

    <el-table v-loading="listLoading" :data="list" border fit highlight-current-row style="width: 100%">
      <el-table-column prop="id" label="ID" width="80" align="center" />
      <el-table-column prop="name" label="名称" />
      <el-table-column prop="sn" label="SN" />
      <el-table-column prop="is_active" label="状态" width="100" align="center">
        <template #default="scope">
          <el-tag :type="scope.row.is_active ? 'success' : 'danger'">
            {{ scope.row.is_active ? '启用' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="created_at" label="创建时间" width="180">
          <template #default="scope">{{ formatTime(scope.row.created_at) }}</template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="300" fixed="right">
        <template #default="scope">
          <el-button size="small" @click="handleView(scope.row)">详情/绑定</el-button>
          <template v-if="authStore.role === 'admin'">
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
        <el-form-item label="SN" prop="sn">
          <el-input v-model="temp.sn" />
        </el-form-item>
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

    <!-- Drawer -->
    <el-drawer v-model="drawerVisible" :title="drawerTitle" size="50%">
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
            <el-tab-pane label="绑定洁净室" name="cleanrooms">
                <div style="margin-bottom: 10px;" v-if="authStore.role === 'admin'">
                    <el-button type="primary" size="small" @click="handleBindCleanroom">绑定新洁净室</el-button>
                </div>
                <el-table :data="cleanroomsList" v-loading="cleanroomsLoading" border>
                    <el-table-column prop="id" label="ID" width="80" />
                    <el-table-column prop="name" label="名称" />
                    <el-table-column label="操作" width="100">
                        <template #default="scope">
                            <el-button 
                                v-if="authStore.role === 'admin'"
                                size="small" 
                                type="danger" 
                                @click="handleUnbind(scope.row)"
                            >解绑</el-button>
                        </template>
                    </el-table-column>
                </el-table>
            </el-tab-pane>
        </el-tabs>
    </el-drawer>

    <!-- Bind Dialog -->
    <el-dialog title="绑定洁净室" v-model="bindDialogVisible" width="400px">
        <el-form :model="bindTemp" label-width="80px">
            <el-form-item label="洁净室ID">
                <el-input v-model="bindTemp.cleanroom_id" placeholder="请输入洁净室ID" />
            </el-form-item>
            <el-form-item label="Meta">
                <el-input type="textarea" v-model="bindTemp.metaStr" placeholder="JSON format (Optional)" />
            </el-form-item>
        </el-form>
        <template #footer>
            <span class="dialog-footer">
                <el-button @click="bindDialogVisible = false">取消</el-button>
                <el-button type="primary" @click="bindCleanroomData">确定</el-button>
            </span>
        </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick } from 'vue'
import { 
    getGateways, 
    createGateway, 
    updateGateway, 
    deleteGateway, 
    getGatewayCleanrooms,
    bindGatewayCleanroom,
    unbindGatewayCleanroom
} from '@/api/gateways'
import { useAuthStore } from '@/stores/auth'
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'
import JsonViewer from '@/components/JsonViewer.vue'

const authStore = useAuthStore()

const list = ref([])
const total = ref(0)
const listLoading = ref(true)
const listQuery = reactive({
  page: 1,
  page_size: 10,
  keyword: undefined
})

const dialogFormVisible = ref(false)
const dialogStatus = ref('')
const textMap = { update: '编辑', create: '新增' }
const dataFormRef = ref(null)
const temp = reactive({
  id: undefined,
  name: '',
  sn: '',
  is_active: 1,
  metaStr: '{}'
})
const rules = {
  name: [{ required: true, message: '必填', trigger: 'blur' }],
  sn: [{ required: true, message: '必填', trigger: 'blur' }],
  meta: [{ validator: (rule, val, cb) => { try { JSON.parse(temp.metaStr); cb() } catch(e){ cb(new Error('Invalid JSON')) } }, trigger: 'blur' }]
}

const drawerVisible = ref(false)
const drawerTitle = ref('')
const activeTab = ref('info')
const currentItem = ref({})
const cleanroomsList = ref([])
const cleanroomsLoading = ref(false)

const bindDialogVisible = ref(false)
const bindTemp = reactive({
    cleanroom_id: '',
    metaStr: '{}'
})

const getList = async () => {
  listLoading.value = true
  try {
    const { code, data } = await getGateways(listQuery)
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
  temp.sn = ''
  temp.is_active = 1
  temp.metaStr = '{}'
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
      const { code } = await createGateway(payload)
      if (code === 0) {
        ElMessage.success('Created')
        dialogFormVisible.value = false
        getList()
      }
    }
  })
}

const handleUpdate = (row) => {
  temp.id = row.id
  temp.name = row.name
  temp.sn = row.sn
  temp.is_active = row.is_active
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
      const { code } = await updateGateway(temp.id, payload)
      if (code === 0) {
        ElMessage.success('Updated')
        dialogFormVisible.value = false
        getList()
      }
    }
  })
}

const handleDelete = (row) => {
  ElMessageBox.confirm('Confirm delete?').then(async () => {
    const { code } = await deleteGateway(row.id)
    if (code === 0) {
      ElMessage.success('Deleted')
      getList()
    }
  })
}

const handleView = (row) => {
    currentItem.value = row
    drawerTitle.value = `Gateway - ${row.name}`
    activeTab.value = 'info'
    drawerVisible.value = true
    loadCleanrooms()
}

const loadCleanrooms = async () => {
    if (!currentItem.value.id) return
    cleanroomsLoading.value = true
    try {
        const { code, data } = await getGatewayCleanrooms(currentItem.value.id)
        if (code === 0) cleanroomsList.value = data || []
    } catch(e) { console.error(e) }
    finally { cleanroomsLoading.value = false }
}

const handleBindCleanroom = () => {
    bindTemp.cleanroom_id = ''
    bindTemp.metaStr = '{}'
    bindDialogVisible.value = true
}

const bindCleanroomData = async () => {
    if (!bindTemp.cleanroom_id) {
        ElMessage.error('Please input cleanroom ID')
        return
    }
    try {
        const payload = {
            cleanroom_id: parseInt(bindTemp.cleanroom_id),
            meta: JSON.parse(bindTemp.metaStr || '{}')
        }
        const { code } = await bindGatewayCleanroom(currentItem.value.id, payload)
        if (code === 0) {
            ElMessage.success('Bound')
            bindDialogVisible.value = false
            loadCleanrooms()
        }
    } catch(e) { console.error(e) }
}

const handleUnbind = (row) => {
    ElMessageBox.confirm(`Unbind cleanroom ${row.name}?`).then(async () => {
        const { code } = await unbindGatewayCleanroom(currentItem.value.id, row.id)
        if (code === 0) {
            ElMessage.success('Unbound')
            loadCleanrooms()
        }
    })
}

const formatTime = (ts) => dayjs(ts).format('YYYY-MM-DD HH:mm:ss')

onMounted(getList)
</script>

<style scoped>
.app-container { padding: 20px; }
.filter-container { display: flex; gap: 10px; }
.pagination-container { margin-top: 20px; display: flex; justify-content: flex-end; }
</style>
