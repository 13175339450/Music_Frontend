<template>
  <div class="admin-center-container">
    <div class="container">
      <div class="admin-header">
        <div class="header-top simple-header">
          <div class="back-link" @click="goBack">
            <el-icon class="back-icon"><ArrowLeft /></el-icon>
            <span>Back 返回</span>
          </div>
          <span class="divider">|</span>
          <h1 class="page-title">管理后台</h1>
        </div>
        <div class="admin-info">
          <el-avatar :size="60" :src="user.avatar">
            {{ user.nickname?.charAt(0) || user.username?.charAt(0) }}
          </el-avatar>
          <div class="admin-meta">
            <h2>{{ user.nickname || user.username }}</h2>
            <p class="admin-role">管理员</p>
          </div>
        </div>
      </div>

      <div class="dashboard-section">
        <h2>平台概览</h2>
        <div class="dashboard-grid">
          <div class="dashboard-card">
            <div class="dashboard-icon users">
              <el-icon><User /></el-icon>
            </div>
            <div class="dashboard-content">
              <p class="dashboard-label">总用户数</p>
              <h3 class="dashboard-value">{{ stats.totalUsers }}</h3>
              <p class="dashboard-change">+{{ stats.usersChange }}% 较昨日</p>
            </div>
          </div>
          <div class="dashboard-card">
            <div class="dashboard-icon musicians">
              <el-icon><Headset /></el-icon>
            </div>
            <div class="dashboard-content">
              <p class="dashboard-label">音乐人数量</p>
              <h3 class="dashboard-value">{{ stats.totalMusicians }}</h3>
              <p class="dashboard-change">+{{ stats.musiciansChange }}% 较昨日</p>
            </div>
          </div>
          <div class="dashboard-card">
            <div class="dashboard-icon music">
              <el-icon><Headset /></el-icon>
            </div>
            <div class="dashboard-content">
              <p class="dashboard-label">音乐总数</p>
              <h3 class="dashboard-value">{{ stats.totalMusic }}</h3>
              <p class="dashboard-change">+{{ stats.musicChange }}% 较昨日</p>
            </div>
          </div>
          <div class="dashboard-card">
            <div class="dashboard-icon playlists">
              <el-icon><VideoCamera /></el-icon>
            </div>
            <div class="dashboard-content">
              <p class="dashboard-label">总播放量</p>
              <h3 class="dashboard-value">{{ stats.totalPlays }}</h3>
              <p class="dashboard-change">+{{ stats.playsChange }}% 较昨日</p>
            </div>
          </div>
          <div class="dashboard-card">
            <div class="dashboard-icon comments">
              <el-icon><ChatDotRound /></el-icon>
            </div>
            <div class="dashboard-content">
              <p class="dashboard-label">评论总数</p>
              <h3 class="dashboard-value">{{ stats.totalComments }}</h3>
              <p class="dashboard-change">+{{ stats.commentsChange }}% 较昨日</p>
            </div>
          </div>
         
        </div>
      </div>

      <el-tabs v-model="activeTab" type="card" style="margin-bottom: 32px;">
        <el-tab-pane label="用户管理" name="userManagement">
          <div class="section-header">
            <h2>用户管理</h2>
            <el-button type="primary" @click="showCreateUserModal = true">
              <el-icon><Plus /></el-icon>
              创建用户
            </el-button>
          </div>
          <div class="search-bar">
            <el-input
              v-model="userSearchQuery"
              placeholder="搜索用户名或ID"
              clearable
              style="width: 300px; margin-right: 16px"
              @keyup.enter="handleUserSearch"
            >
              <template #append>
                <el-button @click="handleUserSearch"><el-icon><Search /></el-icon></el-button>
              </template>
            </el-input>
            <el-select v-model="userRoleFilter" placeholder="按角色筛选" style="width: 150px;">
              <el-option label="全部" value="" />
              <el-option label="普通用户" value="USER" />
              <el-option label="音乐人" value="MUSICIAN" />
              <el-option label="管理员" value="ADMIN" />
            </el-select>
          </div>
          <el-table :data="users" style="width: 100%" stripe>
            <el-table-column prop="id" label="ID" width="80" />
            <el-table-column prop="username" label="用户名" />
            <el-table-column prop="nickname" label="昵称" />
            <el-table-column label="角色" width="120">
              <template #default="scope">
                <el-tag
                  v-for="role in scope.row.roles"
                  :key="role"
                  :type="role === 'ADMIN' ? 'danger' : role === 'MUSICIAN' ? 'success' : 'info'"
                  style="margin-right: 4px"
                >
                  {{ role === 'ADMIN' ? '管理员' : role === 'MUSICIAN' ? '音乐人' : '普通用户' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="registerTime" label="注册时间" width="180">
              <template #default="scope">
                {{ formatDate(scope.row.registerTime) }}
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100">
              <template #default="scope">
                <el-switch
                  v-model="scope.row.status"
                  :active-value="'ACTIVE'"
                  :inactive-value="'INACTIVE'"
                  @change="handleUserStatusChange(scope.row)"
                ></el-switch>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="200" fixed="right">
              <template #default="scope">
                <el-button type="text" size="small" @click="handleEditUser(scope.row)">
                  <el-icon><Edit /></el-icon>
                  编辑
                </el-button>
                <el-button type="text" size="small" @click="handleDeleteUser(scope.row)" danger>
                  <el-icon><Delete /></el-icon>
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane name="contentReview">
          <template #label>
            <el-badge :value="stats.pendingContent" :hidden="stats.pendingContent === 0 || !stats.pendingContent" class="item" type="danger" is-dot>
              内容审核
            </el-badge>
          </template>
          <div class="section-header">
            <h2>内容审核</h2>
          </div>
          <el-tabs v-model="reviewTab" type="border-card">
            <el-tab-pane name="music">
              <template #label>
                <el-badge :value="pendingMusic.length" :hidden="pendingMusic.length === 0" class="item">
                  音乐审核
                </el-badge>
              </template>
              <el-table :data="pendingMusic" style="width: 100%" stripe>
                <el-table-column prop="id" label="ID" width="80" />
                <el-table-column prop="title" label="标题" />
                <el-table-column prop="artist" label="歌手" />
                <el-table-column label="封面" width="100">
                  <template #default="scope">
                    <el-image
                      :src="scope.row.coverPath ? `/api/music/cover/${scope.row.id}` : 'https://via.placeholder.com/50'"
                      fit="cover"
                      style="width: 50px; height: 50px; border-radius: 4px"
                    ></el-image>
                  </template>
                </el-table-column>
                <el-table-column prop="creator" label="上传者" width="120">
                  <template #default="scope">
                    {{ scope.row.creator?.nickname || scope.row.creator?.username }}
                  </template>
                </el-table-column>
                <el-table-column prop="createdAt" label="上传时间" width="180" />
                <el-table-column label="操作" width="150" fixed="right">
                  <template #default="scope">
                    <el-button type="success" size="small" @click="handleApproveMusic(scope.row)">
                      <el-icon><Check /></el-icon>
                      通过
                    </el-button>
                    <el-button type="danger" size="small" @click="handleRejectMusic(scope.row)">
                      <el-icon><Close /></el-icon>
                      拒绝
                    </el-button>
                  </template>
                </el-table-column>
              </el-table>
            </el-tab-pane>

      

        <el-tab-pane name="posts">
          <template #label>
            <el-badge :value="pendingPosts.length" :hidden="pendingPosts.length === 0" class="item">
              动态审核
            </el-badge>
          </template>
          <el-table :data="pendingPosts" style="width: 100%" stripe>
            <el-table-column prop="id" label="ID" width="80" />
            <el-table-column label="发布者" width="120">
              <template #default="scope">
                {{ scope.row.user?.nickname || scope.row.user?.username }}
              </template>
            </el-table-column>
            <el-table-column prop="content" label="动态内容" width="400">
              <template #default="scope">
                <div class="comment-preview">{{ scope.row.content }}</div>
              </template>
            </el-table-column>
            <el-table-column prop="createdAt" label="发布时间" width="180" />
            <el-table-column label="状态" width="100">
              <template #default="scope">
                <el-tag :type="getPostStatusType(scope.row.status)">
                  {{ getPostStatusText(scope.row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="150" fixed="right">
              <template #default="scope">
                <el-button type="success" size="small" @click="handleApprovePost(scope.row)">
                  <el-icon><Check /></el-icon>
                  通过
                </el-button>
                <el-button type="danger" size="small" @click="handleRejectPost(scope.row)">
                  <el-icon><Close /></el-icon>
                  拒绝
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
          </el-tabs>
        </el-tab-pane>

        <el-tab-pane label="数据统计" name="statistics">
          <div class="section-header">
            <h2>数据统计</h2>
          </div>
          <div class="charts-grid">
            <div class="chart-card">
              <h3>用户增长趋势</h3>
              <div ref="userGrowthChart" class="chart-container"></div>
            </div>
            <div class="chart-card">
              <h3>内容分布</h3>
              <div ref="contentDistributionChart" class="chart-container"></div>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- Create User Modal -->
    <el-dialog
      v-model="showCreateUserModal"
      title="创建用户"
      width="500px"
    >
      <el-form
        :model="createUserForm"
        :rules="createUserRules"
        ref="createUserFormRef"
        label-width="80px"
      >
        <el-form-item label="用户名" prop="username">
          <el-input v-model="createUserForm.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input
            v-model="createUserForm.password"
            type="password"
            placeholder="请输入密码"
            show-password
          />
        </el-form-item>
        <el-form-item label="昵称" prop="nickname">
          <el-input v-model="createUserForm.nickname" placeholder="请输入昵称" />
        </el-form-item>
        <el-form-item label="角色" prop="roles">
          <el-select
            v-model="createUserForm.roles"
            multiple
            placeholder="请选择角色"
            style="width: 100%"
          >
            <el-option label="普通用户" value="USER" />
            <el-option label="音乐人" value="MUSICIAN" />
            <el-option label="管理员" value="ADMIN" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showCreateUserModal = false">取消</el-button>
          <el-button type="primary" @click="handleCreateUser">创建</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- Edit User Modal -->
    <el-dialog
      v-model="showEditUserModal"
      title="编辑用户"
      width="500px"
    >
      <el-form
        :model="editUserForm"
        :rules="editUserRules"
        ref="editUserFormRef"
        label-width="80px"
      >
        <el-form-item label="用户名" prop="username">
          <el-input v-model="editUserForm.username" placeholder="请输入用户名" disabled />
        </el-form-item>
        <el-form-item label="昵称" prop="nickname">
          <el-input v-model="editUserForm.nickname" placeholder="请输入昵称" />
        </el-form-item>
        <el-form-item label="角色" prop="roles">
          <el-select
            v-model="editUserForm.roles"
            multiple
            placeholder="请选择角色"
            style="width: 100%"
          >
            <el-option label="普通用户" value="USER" />
            <el-option label="音乐人" value="MUSICIAN" />
            <el-option label="管理员" value="ADMIN" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showEditUserModal = false">取消</el-button>
          <el-button type="primary" @click="handleUpdateUser">更新</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from 'vuex'
import { ElMessage, ElMessageBox, ElIcon } from 'element-plus'
import { 
  User, Headset, VideoCamera, ChatDotRound, Warning, 
  Plus, Search, Edit, Delete, Check, Close, TrendCharts, PieChart,
  Headset as Music, ArrowLeft
} from '@element-plus/icons-vue'
import request from '../utils/request'
import * as echarts from 'echarts'

const store = useStore()
const user = computed(() => store.state.user)
const router = useRouter()
const goBack = () => {
  router.push('/')
}

// Dashboard stats
const stats = reactive({
  totalUsers: 0,
  usersChange: 0,
  totalMusicians: 0,
  musiciansChange: 0,
  totalMusic: 0,
  musicChange: 0,
  totalPlays: 0,
  playsChange: 0,
  totalComments: 0,
  commentsChange: 0,
  pendingContent: 0
})

// Tabs
const activeTab = ref('userManagement')
const reviewTab = ref('music')

// User management
const users = ref([])
const userSearchQuery = ref('')
const userRoleFilter = ref('')

// Create user
const showCreateUserModal = ref(false)
const createUserFormRef = ref(null)
const createUserForm = reactive({
  username: '',
  password: '',
  nickname: '',
  roles: ['USER']
})

const createUserRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度在 6 到 20 个字符', trigger: 'blur' }
  ],
  nickname: [
    { required: true, message: '请输入昵称', trigger: 'blur' },
    { min: 2, max: 20, message: '昵称长度在 2 到 20 个字符', trigger: 'blur' }
  ],
  roles: [
    { required: true, message: '请选择角色', trigger: 'change' }
  ]
}

// Edit user
const showEditUserModal = ref(false)
const editUserFormRef = ref(null)
const editUserForm = reactive({
  id: null,
  username: '',
  nickname: '',
  roles: ['USER']
})

const editUserRules = {
  nickname: [
    { required: true, message: '请输入昵称', trigger: 'blur' },
    { min: 2, max: 20, message: '昵称长度在 2 到 20 个字符', trigger: 'blur' }
  ],
  roles: [
    { required: true, message: '请选择角色', trigger: 'change' }
  ]
}

// Content review
const pendingMusic = ref([])
const pendingComments = ref([])
const pendingPosts = ref([])

// Chart refs
const userGrowthChart = ref(null)
const contentDistributionChart = ref(null)
let userGrowthChartInstance = null
let contentDistributionChartInstance = null

const formatDate = (dateVal) => {
  if (!dateVal) return '-'
  return new Date(dateVal).toLocaleString()
}

const getDashboardStats = () => {
  request.get('/admin/stats')
    .then(response => {
      Object.assign(stats, response)
    })
    .catch(error => {
      console.error('Failed to get dashboard stats:', error)
      ElMessage.error('获取平台概览失败')
    })
}

const getUsers = () => {
  request.get('/admin/users')
    .then(response => {
      // 将用户的roles从对象数组转换为字符串数组，便于前端处理
      users.value = response.map(user => {
        user.roles = user.roles.map(role => role.name.replace('ROLE_', ''))
        user.status = user.status === 1 ? 'ACTIVE' : 'INACTIVE'
        return user
      })
    })
    .catch(error => {
      console.error('Failed to get users:', error)
      ElMessage.error('获取用户列表失败')
    })
}

const handleUserSearch = () => {
  const params = {}
  if (userSearchQuery.value.trim()) {
    params.keyword = userSearchQuery.value.trim()
  }
  if (userRoleFilter.value) {
    params.role = userRoleFilter.value
  }
  
  request.get('/admin/users/search', { params })
    .then(response => {
      users.value = response.map(user => {
        user.roles = user.roles.map(role => role.name.replace('ROLE_', ''))
        user.status = user.status === 1 ? 'ACTIVE' : 'INACTIVE'
        return user
      })
    })
    .catch(error => {
      console.error('Failed to search users:', error)
      ElMessage.error('搜索用户失败')
    })
}

const handleUserStatusChange = (user) => {
  request.put(`/admin/users/${user.id}/status`, {
    status: user.status
  })
    .then(() => {
      ElMessage.success('用户状态更新成功')
    })
    .catch(error => {
      console.error('Failed to update user status:', error)
      ElMessage.error('更新用户状态失败')
      // Revert the change
      user.status = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
    })
}

const handleCreateUser = async () => {
  if (!createUserFormRef.value) return
  
  await createUserFormRef.value.validate((valid) => {
    if (valid) {
      // 创建用户时不直接发送角色，先创建用户，再设置角色
      const userData = {
        username: createUserForm.username,
        password: createUserForm.password,
        nickname: createUserForm.nickname
      }
      
      request.post('/admin/users', userData)
        .then(response => {
          // 创建用户成功后，设置用户角色
          const userId = response.id
          return request.put(`/admin/users/${userId}/roles`, {
            roles: createUserForm.roles.map(r => 'ROLE_' + r)
          })
        })
        .then(() => {
          ElMessage.success('创建用户成功')
          showCreateUserModal.value = false
          // Reset form
          Object.assign(createUserForm, {
            username: '',
            password: '',
            nickname: '',
            roles: ['USER']
          })
          getUsers()
        })
        .catch(error => {
          console.error('Failed to create user:', error)
          ElMessage.error('创建用户失败')
        })
    } else {
      return false
    }
  })
}

const handleEditUser = (user) => {
  Object.assign(editUserForm, user)
  showEditUserModal.value = true
}

const handleUpdateUser = async () => {
  if (!editUserFormRef.value) return
  
  await editUserFormRef.value.validate((valid) => {
    if (valid) {
      // 更新用户基本信息时不包含角色
      const userData = {
        username: editUserForm.username,
        nickname: editUserForm.nickname
      }
      
      request.put(`/admin/users/${editUserForm.id}`, userData)
        .then(() => {
          // 更新用户基本信息成功后，更新用户角色
          return request.put(`/admin/users/${editUserForm.id}/roles`, {
            roles: editUserForm.roles.map(r => 'ROLE_' + r)
          })
        })
        .then(() => {
          ElMessage.success('更新用户成功')
          showEditUserModal.value = false
          getUsers()
        })
        .catch(error => {
          console.error('Failed to update user:', error)
          ElMessage.error('更新用户失败')
        })
    } else {
      return false
    }
  })
}

const handleDeleteUser = (user) => {
  ElMessageBox.confirm(
    `确定要删除用户 "${user.username}" 吗？此操作不可恢复。`,
    '删除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  )
    .then(() => {
      return request.delete(`/admin/users/${user.id}`)
    })
    .then(() => {
      ElMessage.success('删除用户成功')
      getUsers()
    })
    .catch(error => {
      if (error !== 'cancel') {
        console.error('Failed to delete user:', error)
        ElMessage.error('删除用户失败')
      }
    })
}

const getPendingMusic = () => {
  request.get('/admin/content/pending/music')
    .then(response => {
      pendingMusic.value = response
    })
    .catch(error => {
      console.error('Failed to get pending music:', error)
      ElMessage.error('获取待审核音乐失败')
    })
}

const getPendingComments = () => {
  request.get('/admin/content/pending/comments')
    .then(response => {
      pendingComments.value = response
    })
    .catch(error => {
      console.error('Failed to get pending comments:', error)
      ElMessage.error('获取待审核评论失败')
    })
}

const handleApproveMusic = (music) => {
  request.put(`/admin/content/music/${music.id}/approve`)
    .then(() => {
      ElMessage.success('音乐审核通过')
      getPendingMusic()
    })
    .catch(error => {
      console.error('Failed to approve music:', error)
      ElMessage.error('审核音乐失败')
    })
}

const handleRejectMusic = (music) => {
  ElMessageBox.confirm(
    `确定要拒绝音乐 "${music.title}" 吗？`,
    '拒绝确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  )
    .then(() => {
      return request.put(`/admin/content/music/${music.id}/reject`)
    })
    .then(() => {
      ElMessage.success('音乐审核拒绝')
      getPendingMusic()
    })
    .catch(error => {
      if (error !== 'cancel') {
        console.error('Failed to reject music:', error)
        ElMessage.error('拒绝音乐失败')
      }
    })
}

const handleApproveComment = (comment) => {
  request.put(`/admin/content/comments/${comment.id}/approve`)
    .then(() => {
      ElMessage.success('评论审核通过')
      getPendingComments()
    })
    .catch(error => {
      console.error('Failed to approve comment:', error)
      ElMessage.error('审核评论失败')
    })
}

const handleRejectComment = (comment) => {
  request.delete(`/admin/content/comments/${comment.id}`)
    .then(() => {
      ElMessage.success('评论已删除')
      getPendingComments()
    })
    .catch(error => {
      console.error('Failed to delete comment:', error)
      ElMessage.error('删除评论失败')
    })
}

// Post review methods
const getPendingPosts = () => {
  request.get('/admin/posts/pending')
    .then(response => {
      pendingPosts.value = response
    })
    .catch(error => {
      console.error('Failed to get pending posts:', error)
      ElMessage.error('获取待审核动态失败')
    })
}

const handleApprovePost = (post) => {
  request.put(`/admin/posts/${post.id}/approve`)
    .then(() => {
      ElMessage.success('动态审核通过')
      getPendingPosts()
    })
    .catch(error => {
      console.error('Failed to approve post:', error)
      ElMessage.error('审核动态失败')
    })
}

const handleRejectPost = (post) => {
  request.put(`/admin/posts/${post.id}/reject`)
    .then(() => {
      ElMessage.success('动态审核拒绝')
      getPendingPosts()
    })
    .catch(error => {
      console.error('Failed to reject post:', error)
      ElMessage.error('拒绝动态失败')
    })
}

const getPostStatusText = (status) => {
  const statusMap = {
    1: '待审核',
    2: '已通过',
    3: '已拒绝'
  }
  return statusMap[status] || '未知状态'
}

const getPostStatusType = (status) => {
  const typeMap = {
    1: 'warning',
    2: 'success',
    3: 'danger'
  }
  return typeMap[status] || 'info'
}

const initUserGrowthChart = () => {
  console.log('Initializing User Growth Chart')
  if (!userGrowthChart.value) {
    console.warn('User Growth Chart ref is missing')
    return
  }
  
  // Dispose existing instance if any
  if (userGrowthChartInstance != null && userGrowthChartInstance != "" && userGrowthChartInstance != undefined) {
    userGrowthChartInstance.dispose();
  }
  
  userGrowthChartInstance = echarts.init(userGrowthChart.value)
  
  request.get('/admin/stats/users')
    .then(response => {
      console.log('User Growth Stats:', response)
      const dates = response.map(item => item.date)
      const totalCounts = response.map(item => item.total)
      const userCounts = response.map(item => item.user)
      const adminCounts = response.map(item => item.admin)
      const musicianCounts = response.map(item => item.musician)
      
      const option = {
        tooltip: {
          trigger: 'axis'
        },
        legend: {
          data: ['总用户数', '普通用户', '管理员', '音乐人'],
          top: 0
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          boundaryGap: false,
          data: dates
        },
        yAxis: {
          type: 'value',
          minInterval: 1
        },
        series: [
          {
            name: '总用户数',
            type: 'line',
            data: totalCounts,
            smooth: true,
            itemStyle: {
              color: '#1890ff'
            }
          },
          {
            name: '普通用户',
            type: 'line',
            data: userCounts,
            smooth: true,
            itemStyle: {
              color: '#52c41a'
            }
          },
          {
            name: '管理员',
            type: 'line',
            data: adminCounts,
            smooth: true,
            itemStyle: {
              color: '#f5222d'
            }
          },
          {
            name: '音乐人',
            type: 'line',
            data: musicianCounts,
            smooth: true,
            itemStyle: {
              color: '#fa8c16'
            }
          }
        ]
      }
      
      userGrowthChartInstance.setOption(option)
    })
    .catch(error => {
      console.error('Failed to get user growth stats:', error)
    })
}

const initContentDistributionChart = () => {
  console.log('Initializing Content Distribution Chart')
  if (!contentDistributionChart.value) return
  
  if (contentDistributionChartInstance != null && contentDistributionChartInstance != "" && contentDistributionChartInstance != undefined) {
    contentDistributionChartInstance.dispose();
  }
  
  contentDistributionChartInstance = echarts.init(contentDistributionChart.value)
  
  request.get('/admin/stats/content')
    .then(response => {
      console.log('Content Stats:', response)
      const musicCategoryData = response.musicCategory || {}
      const postCategoryData = response.postCategory || {}
      
      // 处理音乐数据
      const musicItems = Object.entries(musicCategoryData).map(([name, value]) => ({
        name,
        value,
        type: '音乐库'
      }))
      const totalMusic = musicItems.reduce((sum, item) => sum + item.value, 0)
      
      // 处理动态数据
      const postItems = Object.entries(postCategoryData).map(([name, value]) => ({
        name,
        value,
        type: '社区动态'
      }))
      const totalPosts = postItems.reduce((sum, item) => sum + item.value, 0)
      
      const option = {
        tooltip: {
          trigger: 'item',
          formatter: '{a} <br/>{b}: {c} ({d}%)'
        },
        legend: {
          orient: 'vertical',
          left: 'left',
          top: 'middle'
        },
        series: [
          {
            name: '内容类型',
            type: 'pie',
            selectedMode: 'single',
            radius: [0, '30%'],
            label: {
              position: 'inner',
              fontSize: 12,
              color: '#fff'
            },
            labelLine: {
              show: false
            },
            data: [
              { value: totalMusic, name: '音乐库', itemStyle: { color: '#1890ff' } },
              { value: totalPosts, name: '社区动态', itemStyle: { color: '#52c41a' } }
            ].filter(item => item.value > 0)
          },
          {
            name: '详细分类',
            type: 'pie',
            radius: ['45%', '65%'],
            label: {
              show: true,
              formatter: '{b}: {c}'
            },
            data: [
              ...musicItems,
              ...postItems
            ].sort((a, b) => b.value - a.value)
          }
        ]
      }
      
      contentDistributionChartInstance.setOption(option)
    })
    .catch(error => {
      console.error('Failed to get content stats:', error)
    })
}

const handleResize = () => {
  if (userGrowthChartInstance) {
    userGrowthChartInstance.resize()
  }
  if (contentDistributionChartInstance) {
    contentDistributionChartInstance.resize()
  }
}

watch(activeTab, (val) => {
  if (val === 'statistics') {
    nextTick(() => {
      initUserGrowthChart()
      initContentDistributionChart()
      handleResize()
    })
  }
})

onMounted(() => {
  getDashboardStats()
  getUsers()
  getPendingMusic()
  getPendingComments()
  getPendingPosts()
  
  // Charts will be initialized when the tab is switched to 'statistics'
  // or if it is the default tab (though it is not)
  if (activeTab.value === 'statistics') {
    nextTick(() => {
      initUserGrowthChart()
      initContentDistributionChart()
    })
  }
  
  window.addEventListener('resize', handleResize)
})
</script>

<style scoped>
.admin-center-container {
  padding: 32px 0;
}

.admin-header {
  margin-bottom: 40px;
}

.header-top {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 32px;
}

.back-button {
  display: flex;
  align-items: center;
  gap: 4px;
}

.admin-header h1 {
  margin: 0 0 32px 0;
  color: #303133;
}

.admin-info {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background-color: #f5f7fa;
  border-radius: 8px;
}

.admin-meta h2 {
  margin: 0 0 4px 0;
  color: #303133;
  font-size: 20px;
}

.admin-role {
  margin: 0;
  color: #606266;
  font-size: 14px;
}

.dashboard-section {
  margin-bottom: 40px;
}

.dashboard-section h2 {
  margin-bottom: 24px;
  color: #303133;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.dashboard-card {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 24px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.dashboard-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
}

.dashboard-icon.users {
  background-color: #e6f7ff;
  color: #1890ff;
}

.dashboard-icon.musicians {
  background-color: #f6ffed;
  color: #52c41a;
}

.dashboard-icon.music {
  background-color: #f9f0ff;
  color: #722ed1;
}

.dashboard-icon.playlists {
  background-color: #fff7e6;
  color: #fa8c16;
}

.dashboard-icon.comments {
  background-color: #fff1f0;
  color: #ff4d4f;
}

.dashboard-icon.pending {
  background-color: #fffbe6;
  color: #faad14;
}

.dashboard-content {
  flex: 1;
}

.dashboard-label {
  margin: 0 0 8px 0;
  color: #909399;
  font-size: 14px;
}

.dashboard-value {
  margin: 0 0 8px 0;
  font-size: 28px;
  font-weight: bold;
  color: #303133;
}

.dashboard-change {
  margin: 0;
  font-size: 12px;
  color: #52c41a;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.section-header h2 {
  margin: 0;
  color: #303133;
}

.search-bar {
  display: flex;
  align-items: center;
  margin-bottom: 24px;
}

.comment-preview {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.charts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 20px;
}

.chart-card {
  padding: 24px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.chart-card h3 {
  margin: 0 0 20px 0;
  color: #303133;
  font-size: 18px;
}

.chart-placeholder {
  height: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #f5f7fa;
  border-radius: 4px;
  color: #909399;
}

.chart-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.chart-container {
  width: 100%;
  height: 300px;
}

/* New Header Styles matching the design */
.simple-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.back-link {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  font-size: 16px;
  color: #303133;
  transition: color 0.3s;
}

.back-link:hover {
  color: #409eff;
}

.back-icon {
  font-size: 18px;
}

.divider {
  font-size: 18px;
  color: #dcdfe6;
  margin: 0 4px;
  font-weight: 300;
}

.page-title {
  margin: 0 !important;
  font-size: 18px;
  font-weight: 500;
  color: #303133;
}
</style>
