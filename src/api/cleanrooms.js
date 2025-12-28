import request from '../utils/request'

export function getCleanrooms(params) {
  return request({
    url: '/cleanrooms',
    method: 'get',
    params
  })
}

export function createCleanroom(data) {
  return request({
    url: '/cleanrooms',
    method: 'post',
    data
  })
}

export function updateCleanroom(id, data) {
  return request({
    url: `/cleanrooms/${id}`,
    method: 'patch',
    data
  })
}

export function deleteCleanroom(id) {
  return request({
    url: `/cleanrooms/${id}`,
    method: 'delete'
  })
}

export function getCleanroomGateways(id) {
  return request({
    url: `/cleanrooms/${id}/gateways`,
    method: 'get'
  })
}

export function getCleanroomLatestTelemetry(id) {
  return request({
    url: `/cleanrooms/${id}/telemetry/latest`,
    method: 'get'
  })
}
