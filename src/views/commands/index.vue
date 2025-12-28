<template>
  <div class="app-container">
    <div class="filter-container mb-4">
      <el-input v-model="listQuery.device_id" placeholder="设备ID" style="width: 120px;" class="filter-item" clearable @keyup.enter="handleFilter" />
      <el-input v-model="listQuery.issued_by" placeholder="下发人ID" style="width: 120px;" class="filter-item" clearable @keyup.enter="handleFilter" />
      <el-date-picker
        v-model="dateRange"
        type="datetimerange"
        range-separator="-"
        start-placeholder="开始时间"
        end-placeholder="结束时间"
        value-format="YYYY-MM-DD HH:mm:ss"
        class="filter-item"
        style="width: 350px;"
      />
      <el-button type="primary" class="filter-item" @click="handleFilter">搜索</el-button>
    </div>

    <el-table v-loading="listLoading" :data="list" border fit highlight-current-row style="width: 100%">
      <el-table-column prop="id" label="ID" width="80" align="center" />
      <el-table-column prop="device_id" label="设备ID" width="100" align="center" />
      <el-table-column prop="command_name" label="命令名称" />
      <el-table-column prop="issued_by" label="下发人ID" width="100" align="center" />
      <el-table-column prop="created_at" label="时间" width="180">
          <template #default="scope">{{ formatTime(scope.row.created_at) }}</template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="100" fixed="right">
        <template #default="scope">
          <el-button size="small" @click="handleView(scope.row)">详情</el-button>
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

    <!-- Drawer -->
    <el-drawer v-model="drawerVisible" title="命令详情" size="40%">
        <el-descriptions :column="1" border>
            <el-descriptions-item label="ID">{{ currentItem.id }}</el-descriptions-item>
            <el-descriptions-item label="设备ID">{{ currentItem.device_id }}</el-descriptions-item>
            <el-descriptions-item label="命令名称">{{ currentItem.command_name }}</el-descriptions-item>
            <el-descriptions-item label="下发人ID">{{ currentItem.issued_by }}</el-descriptions-item>
            <el-descriptions-item label="时间">{{ formatTime(currentItem.created_at) }}</el-descriptions-item>
            <el-descriptions-item label="数据负载">
                <JsonViewer :data="currentItem.payload" />
            </el-descriptions-item>
        </el-descriptions>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { getCommands } from '@/api/commands'
import dayjs from 'dayjs'
import JsonViewer from '@/components/JsonViewer.vue'

const list = ref([])
const total = ref(0)
const listLoading = ref(true)
const listQuery = reactive({
  page: 1, page_size: 10, device_id: undefined, issued_by: undefined
})
const dateRange = ref([])

const drawerVisible = ref(false)
const currentItem = ref({})

const getList = async () => {
  listLoading.value = true
  const params = { ...listQuery }
  if (dateRange.value && dateRange.value.length === 2) {
      params.from = dateRange.value[0]
      params.to = dateRange.value[1]
  }
  try {
    const { code, data } = await getCommands(params)
    if (code === 0) {
      list.value = data.list || data.items || []
      total.value = data.total || 0
    }
  } catch (e) { console.error(e) }
  finally { listLoading.value = false }
}

const handleFilter = () => { listQuery.page = 1; getList() }

const handleView = (row) => {
    currentItem.value = row
    drawerVisible.value = true
}

const formatTime = (ts) => dayjs(ts).format('YYYY-MM-DD HH:mm:ss')

onMounted(getList)
</script>

<style scoped>
.app-container { padding: 20px; }
.filter-container { display: flex; gap: 10px; flex-wrap: wrap; }
.pagination-container { margin-top: 20px; display: flex; justify-content: flex-end; }
</style>
