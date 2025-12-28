<template>
  <div class="common-layout">
    <el-container>
      <el-aside width="200px">
        <el-menu
          :default-active="$route.path"
          class="el-menu-vertical-demo"
          router
        >
          <el-menu-item index="/dashboard">
            <el-icon><Odometer /></el-icon>
            <span>仪表盘</span>
          </el-menu-item>
          <el-menu-item index="/cleanrooms">
            <el-icon><House /></el-icon>
            <span>洁净室管理</span>
          </el-menu-item>
          <el-menu-item index="/gateways">
            <el-icon><Connection /></el-icon>
            <span>网关管理</span>
          </el-menu-item>
          <el-menu-item index="/devices">
            <el-icon><Cpu /></el-icon>
            <span>设备管理</span>
          </el-menu-item>
          <el-menu-item index="/commands">
            <el-icon><ChatLineRound /></el-icon>
            <span>命令历史</span>
          </el-menu-item>
          <el-menu-item index="/users" v-if="authStore.role === 'admin'">
            <el-icon><User /></el-icon>
            <span>用户管理</span>
          </el-menu-item>
        </el-menu>
      </el-aside>
      <el-container>
        <el-header>
            <div class="header-content">
                <span>数字孪生驱动的半导体洁净室环境感知、动态溯源与自适应调控平台</span>
                <div class="right-menu">
                    <span>{{ authStore.username }} ({{ authStore.role }})</span>
                    <el-button type="text" @click="handleLogout">退出登录</el-button>
                </div>
            </div>
        </el-header>
        <el-main>
            <router-view />
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup>
import { useAuthStore } from '@/stores/auth'
import { useRouter, useRoute } from 'vue-router'
import { Odometer, House, Connection, Cpu, ChatLineRound, User } from '@element-plus/icons-vue'

const authStore = useAuthStore()
const router = useRouter()

const handleLogout = () => {
  authStore.clearAuth()
  router.push('/login')
}
</script>

<style scoped>
.common-layout {
    height: 100vh;
}
.el-container {
    height: 100%;
}
.el-aside {
    background-color: #fff;
    border-right: 1px solid #dcdfe6;
}
.el-header {
    background-color: #fff;
    border-bottom: 1px solid #dcdfe6;
    display: flex;
    align-items: center;
}
.header-content {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
}
.right-menu {
    display: flex;
    gap: 15px;
    align-items: center;
}
</style>
