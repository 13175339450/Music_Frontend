<template>
  <div class="home">
    <header class="home-header">
      <div class="container">
        <div class="logo">
          <h1>社交化音乐平台</h1>
        </div>
        <nav class="nav">
          <router-link to="/" class="nav-item">首页</router-link>
          <router-link to="/dynamic" class="nav-item">动态</router-link>
          <router-link to="/playlist" class="nav-item">歌单</router-link>
          <router-link to="/discover" class="nav-item">发现音乐</router-link>
          <router-link v-if="isAuthenticated" to="/recommendations" class="nav-item">个性化推荐</router-link>
          <router-link v-if="isAuthenticated" to="/following" class="nav-item">我的关注</router-link>
          <router-link v-if="isAuthenticated" to="/followers" class="nav-item">我的粉丝</router-link>
          <router-link v-if="hasMusician" to="/musician" class="nav-item">音乐人中心</router-link>
          <router-link v-if="hasAdmin" to="/admin" class="nav-item">管理后台</router-link>
          <div class="user-menu">
            <template v-if="isAuthenticated">
              <router-link to="/user/profile" class="nav-item">{{ user.nickname || user.username }}</router-link>
              <el-button type="text" @click="handleLogout">退出</el-button>
            </template>
            <template v-else>
              <router-link to="/login" class="nav-item">登录</router-link>
              <router-link to="/register" class="nav-item">注册</router-link>
            </template>
          </div>
        </nav>
      </div>
    </header>

    <main class="main-content">
      <div class="container">
        <section class="search-section">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索音乐、歌手、歌单"
            style="width: 500px"
            @keyup.enter="handleSearch"
          >
            <template #append>
              <el-button @click="handleSearch">搜索</el-button>
            </template>
          </el-input>
        </section>

        <section v-if="isAuthenticated && personalizedRecommendations.length > 0" class="recommend-section personalized-section">
          <div class="section-header">
            <div class="header-left">
              <h2>每日推荐</h2>
              <!-- <span class="subtitle">基于协同过滤算法为您定制</span> -->
            </div>
            <router-link to="/recommendations" class="more-link">
              查看更多 <el-icon><ArrowRight /></el-icon>
            </router-link>
          </div>
          <div class="music-grid">
            <div
              v-for="music in personalizedRecommendations"
              :key="music.id"
              class="music-card"
              @click="goToMusicDetail(music.id)"
            >
              <div class="music-cover">
                <el-image :src="`/api/music/cover/${music.id}`" fit="cover" class="cover-image">
                  <template #error>
                    <div class="placeholder"></div>
                  </template>
                </el-image>
              </div>
              <div class="music-info">
                <h3>{{ music.title }}</h3>
                <p>{{ music.artist }}</p>
                <div class="music-stats">
                  <span>{{ music.playCount }} 播放</span>
                  <span>{{ music.likeCount }} 喜欢</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section class="recommend-section">
          <h2>推荐音乐</h2>
          <div class="music-grid">
            <div
              v-for="music in musicList"
              :key="music.id"
              class="music-card"
              @click="goToMusicDetail(music.id)"
            >
              <div class="music-cover">
                <el-image :src="`/api/music/cover/${music.id}`" fit="cover" class="cover-image">
                  <template #error>
                    <div class="placeholder"></div>
                  </template>
                </el-image>
              </div>
              <div class="music-info">
                <h3>{{ music.title }}</h3>
                <p>{{ music.artist }}</p>
                <div class="music-stats">
                  <span>{{ music.playCount }} 播放</span>
                  <span>{{ music.likeCount }} 喜欢</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>

    <!-- <footer class="footer">
      <div class="container">
        <p>© 2025 社交化音乐平台 版权所有</p>
      </div>
    </footer> -->
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from 'vuex'
import { ArrowRight } from '@element-plus/icons-vue'
import request from '../utils/request'

const router = useRouter()
const store = useStore()

const searchKeyword = ref('')
const musicList = ref([])
const personalizedRecommendations = ref([])

const isAuthenticated = computed(() => store.getters.isAuthenticated)
const user = computed(() => store.getters.currentUser)
const hasMusician = computed(() => store.getters.hasRole('ROLE_MUSICIAN'))
const hasAdmin = computed(() => store.getters.hasRole('ROLE_ADMIN'))

// 获取音乐列表
const getMusicList = async () => {
  try {
    const response = await request.get('/music/list')
    musicList.value = response
  } catch (error) {
    console.error('Failed to get music list:', error)
  }
}

// 获取个性化推荐
const getPersonalizedRecommendations = async () => {
  if (isAuthenticated.value) {
    try {
      const response = await request.get('/recommendations')
      personalizedRecommendations.value = Array.isArray(response) ? response.slice(0, 5) : []
    } catch (error) {
      console.error('Failed to get recommendations:', error)
    }
  }
}

// 搜索音乐
const handleSearch = () => {
  if (searchKeyword.value.trim()) {
    router.push({ path: '/search', query: { keyword: searchKeyword.value } })
  }
}

// 跳转到音乐详情页
const goToMusicDetail = (id) => {
  router.push(`/music/${id}`)
}

// 退出登录
const handleLogout = () => {
  store.dispatch('logout')
  router.push('/login')
}

// 页面加载时获取音乐列表
onMounted(() => {
  getMusicList()
  if (isAuthenticated.value) {
    getPersonalizedRecommendations()
  }
})
</script>

<style scoped>
.home-header {
  background-color: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.logo h1 {
  margin: 0;
  font-size: 24px;
  color: #1890ff;
}

.nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 0;
}

.nav-item {
  margin: 0 16px;
  color: #333;
  text-decoration: none;
  font-size: 16px;
}

.nav-item:hover {
  color: #1890ff;
}

.user-menu {
  display: flex;
  align-items: center;
}

.main-content {
  padding: 32px 0;
}

.search-section {
  text-align: center;
  margin-bottom: 48px;
}

.recommend-section h2 {
  margin-bottom: 24px;
  font-size: 24px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.header-left {
  display: flex;
  align-items: baseline;
  gap: 12px;
}

.section-header h2 {
  margin: 0;
  font-size: 24px;
}

.subtitle {
  color: #999;
  font-size: 14px;
}

.more-link {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #666;
  text-decoration: none;
  font-size: 14px;
  transition: color 0.3s;
}

.more-link:hover {
  color: #1890ff;
}

.personalized-section {
  margin-bottom: 48px;
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
  cursor: pointer;
  transition: transform 0.3s ease;
}

.music-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.music-cover {
  width: 100%;
  height: 150px;
  overflow: hidden;
}

.music-cover.placeholder {
  background: linear-gradient(135deg, #a0c4ff 0%, #cdb4db 100%);
}

.cover-image {
  width: 100%;
  height: 100%;
}

.placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #a0c4ff 0%, #cdb4db 100%);
}

.music-info {
  padding: 16px;
}

.music-info h3 {
  margin: 0 0 8px 0;
  font-size: 16px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.music-info p {
  margin: 0 0 12px 0;
  color: #666;
  font-size: 14px;
}

.music-stats {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #999;
}

.footer {
  background-color: #333;
  color: #fff;
  text-align: center;
  padding: 24px 0;
  margin-top: 64px;
}
</style>
