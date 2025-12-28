<template>
  <div class="app-container">
    <div class="filter-container mb-4">
      <el-input v-model="listQuery.keyword" placeholder="关键词" style="width: 200px;" class="filter-item" clearable @keyup.enter="handleFilter" />
      <el-select v-model="listQuery.role" placeholder="角色" clearable class="filter-item" style="width: 120px;">
        <el-option label="管理员" value="admin" />
        <el-option label="员工" value="staff" />
      </el-select>
      <el-button type="primary" class="filter-item" @click="handleFilter">搜索</el-button>
      <el-button type="success" class="filter-item" @click="handleCreate">新建</el-button>
    </div>

    <el-table v-loading="listLoading" :data="list" border fit highlight-current-row style="width: 100%">
      <el-table-column prop="id" label="ID" width="80" align="center" />
      <el-table-column prop="username" label="用户名" />
      <el-table-column prop="email" label="邮箱" />
      <el-table-column prop="role" label="角色" width="100" align="center">
          <template #default="scope">
              <el-tag :type="scope.row.role === 'admin' ? 'danger' : 'info'">{{ scope.row.role === 'admin' ? '管理员' : '员工' }}</el-tag>
          </template>
      </el-table-column>
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
          <el-button size="small" type="primary" @click="handleUpdate(scope.row)">编辑</el-button>
          <el-button size="small" type="warning" @click="handleResetPassword(scope.row)">重置密码</el-button>
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
        <el-form-item label="用户名" prop="username" v-if="dialogStatus==='create'">
          <el-input v-model="temp.username" />
        </el-form-item>
        <el-form-item label="密码" prop="password" v-if="dialogStatus==='create'">
          <el-input v-model="temp.password" type="password" show-password />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="temp.email" />
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-select v-model="temp.role" placeholder="选择角色">
            <el-option label="管理员" value="admin" />
            <el-option label="员工" value="staff" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" prop="is_active" v-if="dialogStatus==='update'">
          <el-switch v-model="temp.is_active" :active-value="1" :inactive-value="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogFormVisible = false">取消</el-button>
          <el-button type="primary" @click="dialogStatus === 'create' ? createData() : updateData()">确定</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick } from 'vue'
import { getUsers, createUser, updateUser, resetUserPassword } from '@/api/users'
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'

const list = ref([])
const total = ref(0)
const listLoading = ref(true)
const listQuery = reactive({
  page: 1, page_size: 10, keyword: undefined, role: undefined
})

const dialogFormVisible = ref(false)
const dialogStatus = ref('')
const textMap = { update: '编辑用户', create: '新建用户' }
const dataFormRef = ref(null)
const temp = reactive({
  id: undefined, username: '', password: '', email: '', role: 'staff', is_active: 1
})
const rules = {
  username: [{ required: true, message: 'Required', trigger: 'blur' }],
  password: [{ required: true, message: 'Required', trigger: 'blur' }],
  role: [{ required: true, message: 'Required', trigger: 'change' }]
}

const getList = async () => {
  listLoading.value = true
  try {
    const { code, data } = await getUsers(listQuery)
    if (code === 0) {
      list.value = data.list || data.items || []
      total.value = data.total || 0
    }
  } catch (e) { console.error(e) }
  finally { listLoading.value = false }
}

const handleFilter = () => { listQuery.page = 1; getList() }

const resetTemp = () => {
  Object.assign(temp, { id: undefined, username: '', password: '', email: '', role: 'staff', is_active: 1 })
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
      const { code } = await createUser(temp)
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
  dialogStatus.value = 'update'
  dialogFormVisible.value = true
  nextTick(() => dataFormRef.value?.clearValidate())
}

const updateData = () => {
  dataFormRef.value?.validate(async (valid) => {
    if (valid) {
      const payload = { role: temp.role, email: temp.email, is_active: temp.is_active }
      const { code } = await updateUser(temp.id, payload)
      if (code === 0) {
        ElMessage.success('Updated')
        dialogFormVisible.value = false
        getList()
      }
    }
  })
}

const handleResetPassword = (row) => {
    ElMessageBox.prompt('Please enter new password', 'Reset Password', {
        confirmButtonText: 'Confirm',
        cancelButtonText: 'Cancel',
        inputPattern: /.+/,
        inputErrorMessage: 'Password cannot be empty'
    }).then(async ({ value }) => {
        const { code } = await resetUserPassword(row.id, { new_password: value })
        if (code === 0) {
            ElMessage.success('Password Reset')
        }
    }).catch(() => {})
}

const formatTime = (ts) => dayjs(ts).format('YYYY-MM-DD HH:mm:ss')

onMounted(getList)
</script>

<style scoped>
.app-container { padding: 20px; }
.filter-container { display: flex; gap: 10px; }
.pagination-container { margin-top: 20px; display: flex; justify-content: flex-end; }
</style>
