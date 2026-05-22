const BASE_URL = 'http://localhost:3000/api'

const request = (url, options = {}) => {
  return new Promise((resolve, reject) => {
    const token = wx.getStorageSync('token')
    const header = { 'Content-Type': 'application/json' }
    if (token) {
      header['Authorization'] = `Bearer ${token}`
    }
    wx.request({
      url: `${BASE_URL}${url}`,
      method: options.method || 'GET',
      data: options.data || {},
      header,
      success: (res) => {
        if (res.statusCode === 401) {
          wx.removeStorageSync('token')
          wx.removeStorageSync('userInfo')
          wx.redirectTo({ url: '/pages/login/login' })
          reject(new Error('未登录'))
          return
        }
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data)
        } else {
          reject(res.data || { message: '请求失败' })
        }
      },
      fail: (err) => {
        reject({ message: '网络错误', err })
      }
    })
  })
}

const api = {
  get: (url, data) => request(url, { method: 'GET', data }),
  post: (url, data) => request(url, { method: 'POST', data }),
  put: (url, data) => request(url, { method: 'PUT', data }),
  delete: (url) => request(url, { method: 'DELETE' })
}

module.exports = { api }
