import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAppStore = defineStore('app', () => {
  const sidebar = ref({
    opened: true,
    withoutAnimation: false
  })
  
  const device = ref('desktop')

  function toggleSideBar() {
    sidebar.value.opened = !sidebar.value.opened
  }

  function closeSideBar({ withoutAnimation }) {
    sidebar.value.opened = false
    sidebar.value.withoutAnimation = withoutAnimation
  }

  function toggleDevice(d) {
    device.value = d
  }

  return { sidebar, device, toggleSideBar, closeSideBar, toggleDevice }
})
