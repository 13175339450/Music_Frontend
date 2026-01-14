import axios from 'axios'
import store from '../store'

// 创建axios实例
const request = axios.create({
  baseURL: '/api',
  timeout: 10000
})

// 请求拦截器
request.interceptors.request.use(
  config => {
    // 从localStorage获取token，添加存在性检查防止TypeError
    const token = typeof window !== 'undefined' && localStorage ? localStorage.getItem('token') : null
    // 登录请求不添加token
    if (token && !config.url.includes('/auth/login')) {
      // 设置请求头
      config.headers.Authorization = 'Bearer ' + token
    }
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  response => {
    return response.data
  },
  error => {
    // 处理401错误（未授权）
    if (error.response && error.response.status === 401) {
      // 清除用户信息
      store.dispatch('logout')
      // 跳转到登录页面
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default request