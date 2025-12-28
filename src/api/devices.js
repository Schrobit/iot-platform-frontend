import request from '../utils/request'

export function getDevices(params) {
  return request({
    url: '/devices',
    method: 'get',
    params
  })
}

export function getDevice(id) {
  return request({
    url: `/devices/${id}`,
    method: 'get'
  })
}

export function createDevice(data) {
  return request({
    url: '/devices',
    method: 'post',
    data
  })
}

export function updateDevice(id, data) {
  return request({
    url: `/devices/${id}`,
    method: 'patch',
    data
  })
}

export function deleteDevice(id) {
  return request({
    url: `/devices/${id}`,
    method: 'delete'
  })
}

export function getDeviceLatestTelemetry(id) {
  return request({
    url: `/devices/${id}/telemetry/latest`,
    method: 'get'
  })
}

export function getDeviceTelemetry(id, params) {
  return request({
    url: `/devices/${id}/telemetry`,
    method: 'get',
    params
  })
}

export function sendDeviceCommand(id, data) {
  return request({
    url: `/devices/${id}/commands`,
    method: 'post',
    data
  })
}
