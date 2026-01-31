<template>
  <div class="login-container">
    <div class="login-box">
      <h2>用户登录</h2>
      <el-form
        :model="loginForm"
        :rules="loginRules"
        ref="loginFormRef"
        label-width="80px"
      >
        <el-form-item label="用户名" prop="username">
          <el-input v-model="loginForm.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            show-password
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleLogin" :loading="loading" style="width: 100%">
            登录
          </el-button>
        </el-form-item>
        <el-form-item style="margin-top: 16px">
          <div class="register-link">
            还没有账号？<router-link to="/register">立即注册</router-link>
          </div>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from 'vuex'
import { ElMessage } from 'element-plus'
import request from '../utils/request'

const router = useRouter()
const store = useStore()
const loginFormRef = ref(null)
const loading = ref(false)

const loginForm = reactive({
  username: '',
  password: ''
})

const loginRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度在 6 到 20 个字符', trigger: 'blur' }
  ]
}

const handleLogin = async () => {
  if (!loginFormRef.value) return
  
  try {
    console.log('开始登录流程')
    // 使用Promise方式调用validate
    await loginFormRef.value.validate()
    console.log('表单验证通过')
    loading.value = true
    
    console.log('Login form data:', loginForm)
    const response = await request.post('/auth/login', loginForm)
    console.log('Login response:', response)
    
    // 打印完整的响应结构
    console.log('Response structure:', JSON.stringify(response, null, 2))
    
    if (response.token && response.username) {
      console.log('响应数据有效，开始更新Vuex状态')
      store.dispatch('login', {
        user: {
          id: response.userId,
          username: response.username,
          nickname: response.nickname,
          avatar: response.avatar,
          roles: response.roles
        },
        token: response.token
      })
      console.log('Vuex状态更新完成')
      console.log('当前Vuex状态:', {
        user: store.state.user,
        token: store.state.token,
        isAuthenticated: store.state.isAuthenticated
      })
      ElMessage.success('登录成功')
      console.log('准备跳转到首页')
      router.push('/')
      console.log('跳转完成')
    } else {
      console.error('Invalid response data:', response)
      console.error('Response missing token or username:', { token: response.token, username: response.username })
      ElMessage.error('登录失败：返回数据格式错误')
    }
  } catch (error) {
    console.error('Login error:', error)
    console.error('Error response:', error.response)
    console.error('Error message:', error.message)
    let errorMsg = '登录失败，请检查用户名和密码'
    if (error.response && error.response.data) {
      if (typeof error.response.data === 'string') {
        errorMsg = error.response.data
      } else if (error.response.data.message) {
        errorMsg = error.response.data.message
      }
    }
    ElMessage.error("账号或密码错误")
  } finally {
    loading.value = false
    console.log('登录流程结束')
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: url('../assets/background.jpg') center/cover no-repeat;
}

.login-box {
  background-color: #fff;
  padding: 40px;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
}

.login-box h2 {
  text-align: center;
  margin-bottom: 32px;
  color: #303133;
  font-size: 24px;
}

.register-link {
  text-align: center;
}

.register-link a {
  color: #409eff;
  text-decoration: none;
}

.register-link a:hover {
  text-decoration: underline;
}
</style>
