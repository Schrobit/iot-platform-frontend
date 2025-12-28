<template>
  <div class="json-viewer">
    <div class="toolbar">
        <el-button size="small" @click="handleCopy">复制</el-button>
        <el-button size="small" @click="expanded = !expanded">{{ expanded ? '折叠' : '展开' }}</el-button>
    </div>
    <el-scrollbar max-height="400px" v-if="expanded">
        <pre class="json-content">{{ formattedJson }}</pre>
    </el-scrollbar>
    <div v-else class="collapsed-view">
        {{ '{ ... }' }}
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus'

const props = defineProps({
  data: {
    type: [Object, Array, String],
    default: () => ({})
  }
})

const expanded = ref(true)

const formattedJson = computed(() => {
  try {
    return JSON.stringify(props.data, null, 2)
  } catch (e) {
    return String(props.data)
  }
})

const handleCopy = () => {
  navigator.clipboard.writeText(formattedJson.value).then(() => {
    ElMessage.success('已复制到剪贴板')
  }).catch(() => {
    ElMessage.error('复制失败')
  })
}
</script>

<style scoped>
.json-viewer {
    border: 1px solid #dcdfe6;
    border-radius: 4px;
    padding: 10px;
    background-color: #f5f7fa;
}
.toolbar {
    margin-bottom: 10px;
    display: flex;
    justify-content: flex-end;
    gap: 10px;
}
.json-content {
    margin: 0;
    font-family: monospace;
    white-space: pre-wrap;
    word-wrap: break-word;
    font-size: 12px;
}
.collapsed-view {
    color: #909399;
    font-style: italic;
    cursor: pointer;
}
</style>
