<template>
  <div class="followers-container">
    <div class="container">
      <el-page-header @back="goBack" content="我的粉丝" style="margin-bottom: 24px" />

      <div class="user-list">
        <div v-if="loading" class="loading">
          <el-icon class="is-loading"><Loading /></el-icon>
          <span>加载中...</span>
        </div>

       

        <div v-else class="user-grid">
          <div v-for="user in followersList" :key="user.id" class="user-card">
            <div class="user-avatar">
              <el-avatar :size="80" :src="user.avatar">
                <el-icon><User /></el-icon>
              </el-avatar>
            </div>
            <div class="user-info">
              <h3 class="user-name">{{ user.nickname || user.username }}</h3>
              <p class="user-bio">{{ user.bio || '这个人很懒，什么都没写' }}</p>
             
              <div class="user-actions">
                <el-button
                  :type="isFollowing(user.id) ? 'default' : 'primary'"
                  size="small"
                  @click="handleFollow(user)"
                  :loading="followLoading === user.id"
                >
                  {{ isFollowing(user.id) ? '已关注' : '回关' }}
                </el-button>
               
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from 'vuex'
import { ElMessage, ElIcon } from 'element-plus'
import { Loading, User } from '@element-plus/icons-vue'
import request from '../utils/request'

const router = useRouter()
const store = useStore()

const loading = ref(true)
const followersList = ref([])
const followLoading = ref(null)
const followStatusMap = ref(new Map())

const goBack = () => {
  router.back()
}

const goToDiscover = () => {
  router.push('/discover')
}

const getFollowersList = async () => {
  loading.value = true
  try {
    const response = await request.get('/follow/followers')
    followersList.value = response
    await loadFollowStatus()
  } catch (error) {
    console.error('Failed to get followers list:', error)
    ElMessage.error('获取粉丝列表失败')
  } finally {
    loading.value = false
  }
}

const loadFollowStatus = async () => {
  for (const user of followersList.value) {
    try {
      const response = await request.get(`/follow/${user.id}/status`)
      followStatusMap.value.set(user.id, response.isFollowing)
    } catch (error) {
      console.error(`Failed to check follow status for user ${user.id}:`, error)
    }
  }
}

const isFollowing = (userId) => {
  return followStatusMap.value.get(userId) || false
}

const getFollowingCount = (userId) => {
  return 0
}

const getFollowerCount = (userId) => {
  return 0
}

const handleFollow = async (user) => {
  try {
    followLoading.value = user.id
    if (isFollowing(user.id)) {
      await request.delete(`/follow/${user.id}`)
      followStatusMap.value.set(user.id, false)
      ElMessage.success('已取消关注')
    } else {
      await request.post(`/follow/${user.id}`)
      followStatusMap.value.set(user.id, true)
      ElMessage.success('关注成功')
    }
  } catch (error) {
    console.error('Failed to follow user:', error)
    ElMessage.error('操作失败')
  } finally {
    followLoading.value = null
  }
}

const viewUserDetail = (user) => {
  router.push(`/user/${user.id}`)
}

onMounted(() => {
  if (!store.state.isAuthenticated) {
    ElMessage.warning('请先登录')
    router.push('/login')
    return
  }
  getFollowersList()
})
</script>

<style scoped>
.followers-container {
  min-height: calc(100vh - 60px);
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 24px 0;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.user-list {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 0;
  color: #909399;
}

.loading .el-icon {
  font-size: 32px;
  margin-bottom: 12px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 0;
  color: #909399;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
  color: #dcdfe6;
}

.empty-state p {
  margin-bottom: 24px;
  font-size: 16px;
}

.user-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.user-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  transition: all 0.3s;
}

.user-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.user-avatar {
  margin-bottom: 16px;
}

.user-info {
  text-align: center;
  width: 100%;
}

.user-name {
  margin: 0 0 8px 0;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.user-bio {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #909399;
  line-height: 1.5;
  min-height: 42px;
}

.user-stats {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-bottom: 16px;
  font-size: 14px;
  color: #606266;
}

.user-actions {
  display: flex;
  gap: 8px;
  justify-content: center;
}
</style>
