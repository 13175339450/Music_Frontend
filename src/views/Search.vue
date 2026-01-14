<template>
  <div class="search-container">
    <div class="container">
      <div class="section-header">
        <el-button type="text" @click="router.back()">
          <el-icon><ArrowLeft /></el-icon>
          返回
        </el-button>
        <h1>搜索结果: "{{ keyword }}"</h1>
      </div>

      <div v-if="loading" class="loading-state">
        <el-icon class="is-loading"><Loading /></el-icon>
        <p>正在搜索...</p>
      </div>

      <div v-else-if="list.length === 0" class="empty-state">
        <el-icon><Search /></el-icon>
        <p>未找到相关音乐</p>
      </div>

      <div v-else class="music-grid">
        <div
          v-for="music in list"
          :key="music.id"
          class="music-card"
        >
          <div class="music-cover">
            <el-image :src="`/api/music/cover/${music.id}?v=${music.updateTime || ''}`" fit="cover" class="cover-image">
              <template #error>
                <div class="placeholder">
                  <el-icon><Music /></el-icon>
                </div>
              </template>
             </el-image>
          </div>
          <div class="music-info">
            <h3>{{ music.title }}</h3>
            <p>{{ music.artist }}</p>
          </div>
          <div class="music-actions">
            <el-button type="primary" size="small" @click="play(music)">播放</el-button>
            <el-button size="small" @click="openDetail(music.id)">详情</el-button>
            <el-button
              v-if="store.state.isAuthenticated && music.musicianId"
              :type="getFollowStatus(music.musicianId) ? 'default' : 'primary'"
              size="small"
              @click="handleFollowMusician(music.musicianId, $event)"
              :loading="followLoading === music.musicianId"
            >
              {{ getFollowStatus(music.musicianId) ? '已关注' : '关注' }}
            </el-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useStore } from 'vuex'
import { ElMessage, ElIcon } from 'element-plus'
import { ArrowLeft, Headset as Music, Search, Loading } from '@element-plus/icons-vue'
import request from '../utils/request'

const route = useRoute()
const router = useRouter()
const store = useStore()

const keyword = ref(route.query.keyword || '')
const list = ref([])
const loading = ref(false)
const followStatus = ref(new Map())
const followLoading = ref(null)

const doSearch = async () => {
  if (!keyword.value.trim()) return
  
  loading.value = true
  try {
    const response = await request.get('/music/search', { params: { keyword: keyword.value } })
    list.value = Array.isArray(response) ? response : []
    await loadFollowStatus()
  } catch (e) {
    ElMessage.error('搜索失败')
  } finally {
    loading.value = false
  }
}

const play = (music) => {
  store.dispatch('playMusic', music)
}

const openDetail = (id) => {
  router.push(`/music/${id}`)
}

const getFollowStatus = (musicianId) => {
  return followStatus.value.get(musicianId) || false
}

const loadFollowStatus = async () => {
  if (!store.state.isAuthenticated) {
    return
  }
  
  const musicianIds = [...new Set(list.value.map(m => m.musicianId).filter(id => id))]
  
  if (musicianIds.length === 0) return

  for (const musicianId of musicianIds) {
    try {
      const response = await request.get(`/follow/${musicianId}/status`)
      followStatus.value.set(musicianId, response.isFollowing)
    } catch (error) {
      console.error(`Failed to check follow status for musician ${musicianId}:`, error)
    }
  }
}

const handleFollowMusician = async (musicianId, event) => {
  if (!store.state.isAuthenticated) {
    ElMessage.warning('请先登录')
    return
  }
  
  event.stopPropagation()
  
  const isFollowing = getFollowStatus(musicianId)
  followLoading.value = musicianId
  
  try {
    const url = `/follow/${musicianId}`
    const method = isFollowing ? 'delete' : 'post'
    
    await request[method](url)
    followStatus.value.set(musicianId, !isFollowing)
    ElMessage.success(!isFollowing ? '关注成功' : '已取消关注')
  } catch (error) {
    console.error('Failed to follow musician:', error)
    ElMessage.error('操作失败')
  } finally {
    followLoading.value = null
  }
}

watch(() => route.query.keyword, (newKeyword) => {
  if (newKeyword) {
    keyword.value = newKeyword
    doSearch()
  }
})

onMounted(() => {
  doSearch()
})
</script>

<style scoped>
.search-container {
  padding: 20px 0;
  min-height: calc(100vh - 200px);
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 30px;
}

.section-header h1 {
  margin: 0;
  font-size: 24px;
  color: #303133;
}

.loading-state, .empty-state {
  text-align: center;
  padding: 100px 0;
  color: #909399;
}

.loading-state .el-icon, .empty-state .el-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.music-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 24px;
}

.music-card {
  background-color: #fff;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
  display: flex;
  flex-direction: column;
}

.music-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.15);
}

.music-cover {
  width: 100%;
  aspect-ratio: 1;
  overflow: hidden;
  background-color: #f5f7fa;
}

.cover-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #a0c4ff 0%, #cdb4db 100%);
  color: #fff;
  font-size: 40px;
}

.music-info {
  padding: 12px;
  flex-grow: 1;
}

.music-info h3 {
  margin: 0 0 8px;
  font-size: 16px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #303133;
}

.music-info p {
  margin: 0;
  font-size: 14px;
  color: #909399;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.music-actions {
  padding: 12px;
  border-top: 1px solid #ebeef5;
  display: flex;
  gap: 8px;
  justify-content: space-between;
}
</style>
