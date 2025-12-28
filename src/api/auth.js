import request from '../utils/request'

export function login(data) {
  return request({
    url: '/auth/login',
    method: 'post',
    data
  })
}

export function getInfo() {
  return request({
    url: '/auth/me',
    method: 'get'
  })
}

export function refreshToken(token) {
    // This is usually handled by the interceptor, but exposed just in case
    return request({
        url: '/auth/refresh',
        method: 'post',
        headers: {
            Authorization: `Bearer ${token}`
        }
    })
}
