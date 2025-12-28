import request from '../utils/request'

export function getGateways(params) {
  return request({
    url: '/gateways',
    method: 'get',
    params
  })
}

export function getGateway(id) {
  return request({
    url: `/gateways/${id}`,
    method: 'get'
  })
}

export function createGateway(data) {
  return request({
    url: '/gateways',
    method: 'post',
    data
  })
}

export function updateGateway(id, data) {
  return request({
    url: `/gateways/${id}`,
    method: 'patch',
    data
  })
}

export function deleteGateway(id) {
  return request({
    url: `/gateways/${id}`,
    method: 'delete'
  })
}

export function getGatewayCleanrooms(id) {
  return request({
    url: `/gateways/${id}/cleanrooms`,
    method: 'get'
  })
}

export function bindGatewayCleanroom(id, data) {
  return request({
    url: `/gateways/${id}/cleanrooms`,
    method: 'post',
    data
  })
}

export function unbindGatewayCleanroom(id, cleanroomId) {
  return request({
    url: `/gateways/${id}/cleanrooms/${cleanroomId}`,
    method: 'delete'
  })
}
