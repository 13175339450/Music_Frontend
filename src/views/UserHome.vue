<template>
  <div class="user-home-container">
    <div class="container">
      <el-page-header @back="goBack" content="用户主页" style="margin-bottom: 24px" />
      
      <div class="profile-card" v-if="profile">
        <div class="profile-avatar">
          <el-avatar :size="100" :src="profile.avatar">
            <el-icon><User /></el-icon>
          </el-avatar>
        </div>
        <div class="profile-info">
          <h2 class="name">{{ profile.nickname || profile.username }}</h2>
          <p class="meta">注册时间：{{ formatDate(profile.createdAt) }}</p>
          <div class="stats">
            <span>{{ followingCount }} 关注</span>
            <span>{{ followerCount }} 粉丝</span>
            <span>{{ profile.postCount }} 动态</span>
          </div>
          <div class="actions">
            <el-button
              :type="isFollowing ? 'default' : 'primary'"
              @click="toggleFollow"
              :loading="followLoading"
            >
              {{ isFollowing ? '已关注' : '关注' }}
            </el-button>
          </div>
        </div>
      </div>

      <div class="section" v-if="posts.length > 0">
        <div class="section-header">
          <h3>最近动态</h3>
        </div>
        <div class="posts-list">
          <div class="post-item" v-for="post in posts" :key="post.id">
            <div class="post-content">{{ post.content }}</div>
            <div class="post-meta">
              <span>点赞 {{ post.likeCount }}</span>
              <span>评论 {{ post.commentCount }}</span>
              <span>时间 {{ post.createdAt }}</span>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="empty">
        <el-icon class="empty-icon"><User /></el-icon>
        <p>TA 还没有发布动态</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User } from '@element-plus/icons-vue'
import request from '../utils/request'

const route = useRoute()
const router = useRouter()
const userId = Number(route.params.id)

const profile = ref(null)
const posts = ref([])
const isFollowing = ref(false)
const followLoading = ref(false)
const followerCount = ref(0)
const followingCount = ref(0)

const goBack = () => router.back()

const formatDate = (d) => {
  if (!d) return ''
  try {
    return new Date(d).toLocaleString()
  } catch {
    return String(d)
  }
}

const loadProfile = async () => {
  try {
    const res = await request.get(`/user/profile/${userId}`)
    profile.value = res
  } catch (e) {
    ElMessage.error('获取用户信息失败')
  }
}

const loadFollowStats = async () => {
  try {
    const followers = await request.get(`/follow/followers/${userId}`)
    const following = await request.get(`/follow/following/${userId}`)
    followerCount.value = Array.isArray(followers) ? followers.length : 0
    followingCount.value = Array.isArray(following) ? following.length : 0
  } catch {}
}

const loadFollowStatus = async () => {
  try {
    const res = await request.get(`/follow/${userId}/status`)
    isFollowing.value = !!res.isFollowing
  } catch {}
}

const loadPosts = async () => {
  try {
    const res = await request.get(`/posts/user/${userId}`)
    posts.value = Array.isArray(res) ? res : []
  } catch {}
}

const toggleFollow = async () => {
  try {
    followLoading.value = true
    if (isFollowing.value) {
      await request.delete(`/follow/${userId}`)
      isFollowing.value = false
      ElMessage.success('已取消关注')
    } else {
      await request.post(`/follow/${userId}`)
      isFollowing.value = true
      ElMessage.success('关注成功')
    }
    await loadFollowStats()
  } catch (e) {
    ElMessage.error('操作失败')
  } finally {
    followLoading.value = false
  }
}

onMounted(async () => {
  await loadProfile()
  await Promise.all([loadFollowStats(), loadFollowStatus(), loadPosts()])
})
</script>

<style scoped>
.user-home-container {
  padding: 24px 0;
}
.container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 0 20px;
}
.profile-card {
  display: flex;
  gap: 24px;
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
}
.profile-avatar {
  flex-shrink: 0;
}
.profile-info .name {
  margin: 0 0 8px 0;
  font-size: 22px;
}
.profile-info .meta {
  margin: 0 0 12px 0;
  color: #909399;
}
.stats {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
}
.actions {
  display: flex;
  gap: 12px;
}
.section {
  margin-top: 24px;
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
}
.section-header h3 {
  margin: 0 0 12px 0;
}
.posts-list {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}
.post-item {
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 12px;
}
.post-meta {
  margin-top: 8px;
  color: #909399;
  font-size: 12px;
  display: flex;
  gap: 12px;
}
.empty {
  margin-top: 24px;
  text-align: center;
  color: #909399;
}
.empty-icon {
  font-size: 48px;
}
</style>
