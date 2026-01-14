<template>
  <div class="recommendations-container">
    <div class="container">
      <div class="section-header">
        <el-button type="text" @click="router.back()">
          <el-icon><ArrowLeft /></el-icon>
        </el-button>
        <div>
          <h1>个性化推荐</h1>
          <!-- <p class="subtitle">结合协同过滤与内容推荐算法，为您量身定制</p> -->
        </div>
        <div class="actions">
          <el-button type="primary" @click="loadRecommendations">刷新推荐</el-button>
        </div>
      </div>
      <div class="music-grid">
        <div
          v-for="music in recommendations"
          :key="music.id"
          class="music-card"
        >
          <div class="music-cover placeholder"></div>
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
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from 'vuex'
import { ElMessage, ElIcon, ElButton } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'
import request from '../utils/request'

const router = useRouter()
const store = useStore()

const recommendations = ref([])
const followStatus = ref(new Map())
const followLoading = ref(null)

const loadRecommendations = async () => {
  try {
    const response = await request.get('/recommendations')
    recommendations.value = Array.isArray(response) ? response : []
    await loadFollowStatus()
  } catch (e) {
    ElMessage.error('获取推荐失败')
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
  
  const musicianIds = [...new Set(recommendations.value.map(m => m.musicianId).filter(id => id))]
  
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

onMounted(() => {
  loadRecommendations()
  loadFollowStatus()
})
</script>

<style scoped>
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px 20px;
}
.section-header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 16px;
}

.section-header h1 {
  margin: 0;
  flex: 1;
}
.subtitle {
  margin: 4px 0 0 0;
  color: #999;
  font-size: 14px;
}
.music-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
}
.music-card {
  background: #fff;
  border-radius: 8px;
  padding: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.music-cover.placeholder {
  height: 140px;
  border-radius: 6px;
  background: linear-gradient(135deg, #a0c4ff 0%, #cdb4db 100%);
}
.music-info h3 {
  margin: 0;
  font-size: 16px;
}
.music-info p {
  margin: 0;
  color: #666;
  font-size: 13px;
}
.music-actions {
  display: flex;
  gap: 8px;
  margin-top: 4px;
}
</style>

