<template>
  <div class="user-profile-container">
    <div class="container">
      <div class="section-header">
        <el-button type="primary" @click="goBack">返回</el-button>
        <h1>个人中心</h1>
      </div>
      
      <div class="profile-content">
        <!-- 用户信息卡片 -->
        <div class="profile-card">
          <div class="profile-avatar">
            <el-avatar :size="100" :src="userInfo.avatar">
              <template #default>
                <div class="avatar-placeholder">
                  {{ userInfo.username?.charAt(0).toUpperCase() }}
                </div>
              </template>
            </el-avatar>
          </div>
          <div class="profile-info">
            <h2>{{ userInfo.username }}</h2>
            <p class="email">{{ userInfo.email }}</p>
            <p class="join-date">注册时间：{{ formatDate(userInfo.createdAt) }}</p>
          </div>
          <div class="profile-actions">
            <el-button type="primary" @click.stop="editProfile">编辑资料</el-button>
            <el-button type="warning" @click.stop="showPasswordModal = true" style="margin-left: 10px">修改密码</el-button>
          </div>
        </div>
        
        <!-- 用户统计信息 -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-number">{{ userInfo.favoriteCount || 0 }}</div>
            <div class="stat-label">收藏的音乐</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">{{ userInfo.postCount || 0 }}</div>
            <div class="stat-label">发布的动态</div>
          </div>

        </div>
        


        <!-- 最近播放 -->
        <div class="recent-plays">
          <h3>最近播放</h3>
          <div v-if="recentPlays.length > 0" class="music-list">
            <div v-for="music in recentPlays" :key="music.id" class="music-item">
              <div class="music-cover placeholder"></div>
              <div class="music-detail">
                <h4>{{ music.title }}</h4>
                <p>{{ music.artist }}</p>
              </div>
              <el-button type="primary" size="small" @click="play(music)">播放</el-button>
            </div>
          </div>
          <div v-else class="empty-state">
            <p>暂无最近播放记录</p>
          </div>
        </div>
      </div>
      
      <!-- 编辑资料弹窗 -->
      <el-dialog
        v-model="showEditModal"
        title="编辑个人资料"
        width="500px"
      >
        <el-form :model="editForm" :rules="editRules" ref="editFormRef" label-width="80px">
          <el-form-item label="用户名" prop="username">
            <el-input v-model="editForm.username" placeholder="请输入用户名" />
          </el-form-item>
          <el-form-item label="邮箱" prop="email">
            <el-input v-model="editForm.email" placeholder="请输入邮箱" />
          </el-form-item>
          
          <!-- 密码更改部分已移除，使用独立弹窗 -->

        </el-form>
        <template #footer>
          <span class="dialog-footer">
            <el-button @click="showEditModal = false">取消</el-button>
            <el-button type="primary" @click="handleUpdateProfile">保存</el-button>
          </span>
        </template>
      </el-dialog>
      <!-- 修改密码弹窗 -->
      <el-dialog
        v-model="showPasswordModal"
        title="修改密码"
        width="500px"
        append-to-body
      >
        <el-form :model="passwordForm" :rules="passwordRules" ref="passwordFormRef" label-width="100px">
          <el-form-item label="旧密码" prop="oldPassword">
            <el-input v-model="passwordForm.oldPassword" type="password" show-password placeholder="请输入旧密码" />
          </el-form-item>
          <el-form-item label="新密码" prop="newPassword">
            <el-input v-model="passwordForm.newPassword" type="password" show-password placeholder="请输入新密码" />
          </el-form-item>
          <el-form-item label="确认新密码" prop="confirmPassword">
            <el-input v-model="passwordForm.confirmPassword" type="password" show-password placeholder="请再次输入新密码" />
          </el-form-item>
        </el-form>
        <template #footer>
          <span class="dialog-footer">
            <el-button @click="showPasswordModal = false">取消</el-button>
            <el-button type="primary" @click="handlePasswordChange">确认修改</el-button>
          </span>
        </template>
      </el-dialog>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from 'vuex'
import { ElMessage, ElForm, ElFormItem, ElInput, ElUpload, ElImage, ElIcon, ElDialog, ElButton } from 'element-plus'
import { Picture, ArrowLeft } from '@element-plus/icons-vue'
import request from '../utils/request'

const router = useRouter()
const store = useStore()

// 用户信息
const userInfo = ref({
  username: '',
  email: '',
  avatar: '',
  createdAt: '',
  favoriteCount: 0,
  postCount: 0
})

// 最近播放
const recentPlays = ref([])

// 返回上一页
const goBack = () => {
  router.go(-1)
}

// 编辑资料相关
const showEditModal = ref(false)
const editFormRef = ref(null)
const editForm = reactive({
  username: '',
  email: ''
})

const editRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, max: 20, message: '用户名长度在 2 到 20 个字符', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ],

  newPassword: [
    {
      validator: (rule, value, callback) => {
        if (value) {
          if (value.length < 6) {
            callback(new Error('新密码长度不能少于6个字符'))
          } else {
            callback()
          }
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ],
  confirmPassword: [
    {
      validator: (rule, value, callback) => {
        if (value) {
          if (value !== editForm.newPassword) {
            callback(new Error('两次输入的密码不一致'))
          } else {
            callback()
          }
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

// 修改密码相关
const showPasswordModal = ref(false)
const passwordFormRef = ref(null)
const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const validatePass2 = (rule, value, callback) => {
  if (value === '') {
    callback(new Error('请再次输入密码'))
  } else if (value !== passwordForm.newPassword) {
    callback(new Error('两次输入密码不一致!'))
  } else {
    callback()
  }
}

const passwordRules = {
  oldPassword: [
    { required: true, message: '请输入旧密码', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度在 6 到 20 个字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, validator: validatePass2, trigger: 'blur' }
  ]
}

const handlePasswordChange = async () => {
  if (!passwordFormRef.value) return
  
  await passwordFormRef.value.validate((valid) => {
    if (valid) {
      request.post('/user/change-password', {
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword
      })
      .then(() => {
        ElMessage.success('密码修改成功，请重新登录')
        showPasswordModal.value = false
        // Reset form
        passwordForm.oldPassword = ''
        passwordForm.newPassword = ''
        passwordForm.confirmPassword = ''
        
        // Logout
        store.dispatch('logout')
        router.push('/login')
      })
      .catch(error => {
        console.error('Failed to change password:', error)
        ElMessage.error(error.response?.data || '密码修改失败')
      })
    } else {
      return false
    }
  })
}

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 加载用户信息
const loadUserInfo = async () => {
  try {
    console.log('开始加载用户信息...')
    console.log('当前token:', typeof window !== 'undefined' && localStorage ? localStorage.getItem('token') : null)
    console.log('Vuex认证状态:', store.state.isAuthenticated)
    
    const response = await request.get('/user/profile')
    console.log('用户信息API响应:', response)
    
    // 确保response是对象
    if (typeof response === 'object' && response !== null) {
      userInfo.value = response
      // 初始化编辑表单
      editForm.username = response.username || ''
            editForm.email = response.email || ''
      console.log('用户信息加载完成:', userInfo.value)
    } else {
      console.error('用户信息API返回数据格式错误:', response)
      ElMessage.error('获取用户信息失败：数据格式错误')
    }
  } catch (error) {
    console.error('获取用户信息异常:', error)
    console.error('错误响应:', error.response)
    if (error.response) {
      console.error('错误状态:', error.response.status)
      console.error('错误数据:', error.response.data)
      if (error.response.status === 401) {
        ElMessage.error('登录已过期，请重新登录')
        store.dispatch('logout')
        router.push('/login')
      } else {
        ElMessage.error(`获取用户信息失败：${error.response.data || '服务器错误'}`)
      }
    } else {
      ElMessage.error('网络错误，请检查连接')
    }
  }
}



// 加载最近播放
const loadRecentPlays = async () => {
  try {
    console.log('开始加载最近播放...')
    const response = await request.get('/user/recent-plays')
    console.log('最近播放API响应:', response)
    
    // 确保response是数组
    recentPlays.value = Array.isArray(response) ? response : []
    console.log('最近播放加载完成:', recentPlays.value)
  } catch (error) {
    console.error('获取最近播放异常:', error)
    console.error('错误响应:', error.response)
    if (error.response) {
      console.error('错误状态:', error.response.status)
      console.error('错误数据:', error.response.data)
    }
    ElMessage.error('获取最近播放记录失败')
  }
}

// 播放音乐
const play = (music) => {
  store.dispatch('playMusic', music)
  ElMessage.success(`正在播放 ${music.title}`)
}

// 编辑资料
const editProfile = () => {
  console.log('编辑资料按钮被点击，当前showEditModal值:', showEditModal.value)
  // 检查当前token状态
  const currentToken = typeof window !== 'undefined' && localStorage ? localStorage.getItem('token') : null
  console.log('当前token:', currentToken)
  console.log('token长度:', currentToken ? currentToken.length : 0)
  // 强制更新showEditModal状态
  showEditModal.value = false
  // 使用nextTick确保状态更新
  nextTick(() => {
    showEditModal.value = true
    console.log('弹窗状态已设置为true，当前值:', showEditModal.value)
  })
}



// 更新个人资料
const handleUpdateProfile = async () => {
  if (!editFormRef.value) return
  
  await editFormRef.value.validate((valid) => {
    if (valid) {
      // 构建更新请求体
      const updateData = {
        username: editForm.username,
        email: editForm.email
      }
      
      request.put('/user/profile', updateData)
      .then(() => {
        ElMessage.success('更新个人资料成功')
        showEditModal.value = false
        
        // 重新加载用户信息
        loadUserInfo()
      })
      .catch(error => {
        console.error('Failed to update profile:', error)
        ElMessage.error('更新个人资料失败')
      })
    } else {
      return false
    }
  })
}

// 页面加载时获取用户信息
onMounted(() => {
  // 检查是否登录
  if (!store.state.isAuthenticated) {
    router.push('/login')
    return
  }
  
  console.log('开始加载用户信息...')
  loadUserInfo()
  loadRecentPlays()
})
</script>

<style scoped>
.user-profile-container {
  padding: 24px 0;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.section-header {
  margin-bottom: 24px;
}

.section-header h1 {
  margin: 0;
  font-size: 28px;
  color: #303133;
}

.profile-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.profile-card {
  background: #fff;
  border-radius: 12px;
  padding: 32px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  display: flex;
  align-items: center;
  gap: 32px;
}

.profile-avatar {
  flex-shrink: 0;
}

.profile-info h2 {
  margin: 0 0 8px 0;
  font-size: 24px;
  color: #303133;
}

.profile-info .email {
  margin: 0 0 8px 0;
  color: #606266;
  font-size: 16px;
}

.profile-info .join-date {
  margin: 0;
  color: #909399;
  font-size: 14px;
}

.profile-actions {
  margin-left: auto;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
}

.stat-card {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  text-align: center;
}

.stat-number {
  font-size: 32px;
  font-weight: bold;
  color: #409eff;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 16px;
  color: #606266;
}

.section-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-title h3 {
  margin: 0;
}



.recent-plays {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.recent-plays h3 {
  margin: 0 0 20px 0;
  font-size: 20px;
  color: #303133;
}

.music-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.music-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px;
  border-radius: 8px;
  background: #f5f7fa;
  transition: background-color 0.3s;
}

.music-item:hover {
  background: #e6f7ff;
}

.music-cover.placeholder {
  width: 60px;
  height: 60px;
  border-radius: 6px;
  background: linear-gradient(135deg, #a0c4ff 0%, #cdb4db 100%);
  flex-shrink: 0;
}

.music-detail {
  flex: 1;
  min-width: 0;
}

.music-detail h4 {
  margin: 0 0 4px 0;
  font-size: 16px;
  color: #303133;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.music-detail p {
  margin: 0;
  font-size: 14px;
  color: #606266;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.empty-state {
  text-align: center;
  padding: 40px 0;
  color: #909399;
}
</style>