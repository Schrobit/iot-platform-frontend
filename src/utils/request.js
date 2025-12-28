import axios from 'axios'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '../stores/auth'
import router from '../router'

// Create Axios instance
const service = axios.create({
  baseURL: import.meta.env.VITE_API_BASE + '/api/v1',
  timeout: 10000 // 10s timeout
})

// Request Interceptor
service.interceptors.request.use(
  config => {
    const authStore = useAuthStore()
    if (authStore.token) {
      config.headers['Authorization'] = `Bearer ${authStore.token}`
    }
    return config
  },
  error => {
    console.error('Request Error:', error)
    return Promise.reject(error)
  }
)

// Flag to prevent multiple refresh requests
let isRefreshing = false
let requestsQueue = []

// Response Interceptor
service.interceptors.response.use(
  response => {
    const res = response.data
    // If custom code is not 0, it is judged as an error.
    // Adjust this logic based on your actual API response structure if needed.
    // The requirement says "response 若 code!=0 统一 ElMessage.error"
    if (res.code !== undefined && res.code !== 0) {
      ElMessage.error(res.message || 'Error')
      
      // You might want to return Promise.reject here if you want to catch it in the component
      return Promise.reject(new Error(res.message || 'Error'))
    }
    return res
  },
  async error => {
    const authStore = useAuthStore()
    const originalRequest = error.config

    // Handle 401 Unauthorized
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If already refreshing, add to queue
        return new Promise((resolve, reject) => {
          requestsQueue.push((token) => {
            originalRequest.headers['Authorization'] = `Bearer ${token}`
            resolve(service(originalRequest))
          })
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        // Call refresh endpoint
        // We use a fresh axios instance or fetch to avoid interceptors issues
        const response = await axios.post(
          import.meta.env.VITE_API_BASE + '/api/v1/auth/refresh',
          {},
          {
            headers: {
              Authorization: `Bearer ${authStore.refreshToken}`
            }
          }
        )

        const { code, data } = response.data
        if (code === 0 && data) {
            // Update store
            authStore.setAuth(data)
            
            // Process queue
            requestsQueue.forEach(cb => cb(data.access_token))
            requestsQueue = []
            
            // Retry original request
            originalRequest.headers['Authorization'] = `Bearer ${data.access_token}`
            return service(originalRequest)
        } else {
            throw new Error('Refresh failed')
        }
      } catch (refreshError) {
        // Refresh failed, clear auth and redirect to login
        authStore.clearAuth()
        requestsQueue = []
        router.push('/login')
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    ElMessage.error(error.message || 'Request Failed')
    return Promise.reject(error)
  }
)

export default service
