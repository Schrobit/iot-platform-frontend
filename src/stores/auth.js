import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

/**
 * Auth Store
 * Handles user authentication state, token management, and persistence.
 */
export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('access_token') || '')
  const refreshToken = ref(localStorage.getItem('refresh_token') || '')
  const user = ref(JSON.parse(localStorage.getItem('user') || '{}'))

  const isAuthenticated = computed(() => !!token.value)
  const role = computed(() => user.value?.role)
  const username = computed(() => user.value?.username)

  /**
   * Set authentication data
   * @param {Object} data - { access_token, refresh_token, user }
   */
  function setAuth(data) {
    if (data.access_token) {
      token.value = data.access_token
      localStorage.setItem('access_token', data.access_token)
    }
    if (data.refresh_token) {
      refreshToken.value = data.refresh_token
      localStorage.setItem('refresh_token', data.refresh_token)
    }
    if (data.user) {
      user.value = data.user
      localStorage.setItem('user', JSON.stringify(data.user))
    }
  }

  /**
   * Clear authentication data (Logout)
   */
  function clearAuth() {
    token.value = ''
    refreshToken.value = ''
    user.value = {}
    
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user')
  }

  return { 
    token, 
    refreshToken, 
    user, 
    isAuthenticated, 
    role, 
    username,
    setAuth, 
    clearAuth 
  }
})
