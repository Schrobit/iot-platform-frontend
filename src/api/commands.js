import request from '../utils/request'

export function getCommands(params) {
  return request({
    url: '/commands',
    method: 'get',
    params
  })
}

export function getCommand(id) {
  return request({
    url: `/commands/${id}`,
    method: 'get'
  })
}
