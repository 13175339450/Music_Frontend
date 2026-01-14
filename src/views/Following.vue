<template>
  <div class="following-container">
    <div class="container">
      <el-page-header @back="goBack" content="我的关注" style="margin-bottom: 24px" />

      <div class="user-list">
        <div v-if="loading" class="loading">
          <el-icon class="is-loading"><Loading /></el-icon>
          <span>加载中...</span>
        </div>

        <div v-else-if="followingList.length === 0" class="empty-state">
          <el-icon class="empty-icon"><User /></el-icon>
          <p>你还没有关注任何人</p>
          <el-button type="primary" @click="goToDiscover">去发现音乐人</el-button>
        </div>

        <div v-else class="user-grid">
          <div v-for="user in followingList" :key="user.id" class="user-card">
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
                  @click="handleUnfollow(user)"
                  :loading="unfollowLoading === user.id"
                >
                  {{ isFollowing(user.id) ? '已关注' : '关注' }}
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
const followingList = ref([])
const unfollowLoading = ref(null)
const followStatusMap = ref(new Map())

const goBack = () => {
  router.back()
}

const goToDiscover = () => {
  router.push('/discover')
}

const getFollowingList = async () => {
  loading.value = true
  try {
    const response = await request.get('/follow/following')
    followingList.value = response
    await loadFollowStatus()
  } catch (error) {
    console.error('Failed to get following list:', error)
    ElMessage.error('获取关注列表失败')
  } finally {
    loading.value = false
  }
}

const loadFollowStatus = async () => {
  for (const user of followingList.value) {
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

const handleUnfollow = async (user) => {
  try {
    unfollowLoading.value = user.id
    await request.delete(`/follow/${user.id}`)
    followStatusMap.value.set(user.id, false)
    ElMessage.success('已取消关注')
    followingList.value = followingList.value.filter(u => u.id !== user.id)
  } catch (error) {
    console.error('Failed to unfollow user:', error)
    ElMessage.error('操作失败')
  } finally {
    unfollowLoading.value = null
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
  getFollowingList()
})
</script>

<style scoped>
.following-container {
  padding: 32px 0;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 64px 0;
  color: #909399;
}

.empty-state {
  text-align: center;
  padding: 64px 0;
  color: #909399;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.user-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 24px;
}

.user-card {
  background-color: #fff;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  gap: 16px;
  transition: box-shadow 0.3s ease;
}

.user-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.user-avatar {
  flex-shrink: 0;
}

.user-info {
  flex: 1;
  min-width: 0;
}

.user-name {
  margin: 0 0 8px 0;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-bio {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #606266;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.4;
}

.user-stats {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
  font-size: 12px;
  color: #909399;
}

.user-actions {
  display: flex;
  gap: 8px;
}
</style>
