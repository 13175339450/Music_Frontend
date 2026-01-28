<template>
  <div class="music-detail-container">
    <div class="container">
      <el-page-header @back="goBack" content="音乐详情" style="margin-bottom: 24px" />
      <div class="music-info-section">
        <div class="music-cover-large">
          <el-image :src="`/api/music/cover/${music.id}`" fit="cover" style="width: 100%; height: 100%;">
            <template #error>
              <div style="width: 100%; height: 100%; background: linear-gradient(135deg, #a0c4ff 0%, #cdb4db 100%);"></div>
            </template>
          </el-image>
        </div>
        <div class="music-meta">
          <h1 class="music-title">{{ music.title }}</h1>
          <p class="music-artist">{{ music.artist }}</p>
          <div class="music-stats">
            <span>{{ music.playCount }} 播放</span>
            <span>{{ music.likeCount }} 喜欢</span>
            <span>{{ music.commentCount }} 评论</span>
          </div>
          <div class="music-artist-info">
            <span class="artist-label">音乐人：</span>
            <router-link :to="`/musician/${music.musicianId}`" class="artist-link">
              {{ music.artist }}
            </router-link>
            <el-button
              v-if="store.state.isAuthenticated && music.musicianId"
              :type="isFollowingMusician ? 'default' : 'primary'"
              size="small"
              @click="handleFollowMusician"
              class="follow-btn"
            >
              {{ isFollowingMusician ? '已关注' : '关注' }}
            </el-button>
          </div>
          <div class="music-actions">
            <el-button type="primary" size="large" @click="handlePlay">
              <el-icon><VideoPlay /></el-icon>
              {{ isPlaying ? '暂停' : '播放' }}
            </el-button>
            <el-button type="default" @click="handleLike">
              <el-icon><Like /></el-icon>
              {{ isLiked ? '已喜欢' : '喜欢' }}
            </el-button>
            <el-button type="default" @click="handleShare">
              <el-icon><Share /></el-icon>
              分享
            </el-button>
          </div>
          <div class="music-description">
            <h3>简介</h3>
            <p>{{ music.description || '暂无简介' }}</p>
          </div>
        </div>
      </div>

      <div class="comment-section">
        <h2>评论区</h2>
        <div class="comment-input">
          <el-input
            v-model="commentContent"
            type="textarea"
            placeholder="写下你的评论..."
            :rows="3"
            @keyup.enter="handleSubmitComment"
          ></el-input>
          <el-button type="primary" @click="handleSubmitComment" style="margin-top: 8px">
            发表评论
          </el-button>
        </div>
        <div class="comment-list">
          <div v-for="comment in comments" :key="comment.id" class="comment-item">
            <div class="comment-header">
              <el-avatar :size="40" :src="comment.user.avatar" class="user-avatar">
                 {{ (comment.user.nickname || comment.user.username || '?').charAt(0) }}
              </el-avatar>
              <div class="user-info">
                <span class="username">{{ comment.user.nickname || comment.user.username }}</span>
                <span class="comment-time">{{ formatDate(comment.createTime) }}</span>
              </div>
            </div>
            <div class="comment-content">{{ comment.content }}</div>
            <div class="comment-actions">
              <el-button type="text" size="small" @click="handleLikeComment(comment)">
                <el-icon><Like /></el-icon>
                {{ comment.likeCount }} 赞
              </el-button>
              <el-button type="text" size="small" @click="handleReply(comment)">
                回复
              </el-button>
            </div>
            
            <!-- 回复列表 -->
            <div v-if="comment.replies && comment.replies.length > 0" class="replies-list">
              <div v-for="reply in getVisibleReplies(comment)" :key="reply.id" class="reply-item">
                <div class="comment-header">
                  <el-avatar :size="32" :src="reply.user.avatar" class="user-avatar">
                     {{ (reply.user.nickname || reply.user.username || '?').charAt(0) }}
                  </el-avatar>
                  <div class="user-info">
                    <span class="username">{{ reply.user.nickname || reply.user.username }}</span>
                    <span class="comment-time">{{ formatDate(reply.createTime) }}</span>
                  </div>
                </div>
                <div class="comment-content">{{ reply.content }}</div>
              </div>
              
              <!-- 展开/收起按钮 -->
              <div v-if="shouldShowExpandButton(comment)" class="expand-replies-btn" @click="toggleExpandReplies(comment.id)">
                <span class="expand-text">
                  {{ expandedReplies.has(comment.id) ? '收起' : `展开全部 ${comment.replies.length} 条回复` }}
                </span>
                <el-icon class="expand-icon">
                  <component :is="expandedReplies.has(comment.id) ? 'ArrowUp' : 'ArrowDown'" />
                </el-icon>
              </div>
            </div>

            <!-- 回复输入框 -->
            <div v-if="showReplyInput === comment.id" class="reply-input">
              <el-input
                v-model="replyContent"
                type="textarea"
                placeholder="写下你的回复..."
                :rows="2"
                @keyup.enter="handleSubmitReply"
                style="margin-bottom: 8px"
              ></el-input>
              <div class="reply-input-actions">
                <el-button type="primary" size="small" @click="handleSubmitReply">
                  发表回复
                </el-button>
                <el-button type="default" size="small" @click="showReplyInput = null">
                  取消
                </el-button>
              </div>
            </div>
          </div>
          <div v-if="comments.length === 0" class="no-comments">
            暂无评论，快来发表第一条评论吧！
          </div>
        </div>
      </div>
    </div>
  </div>


</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useStore } from 'vuex'
import { ElMessage, ElIcon, ElDialog, ElCheckboxGroup, ElCheckbox, ElButton, ElAvatar } from 'element-plus'
import { VideoPlay, Star as Like, Share, ArrowUp, ArrowDown } from '@element-plus/icons-vue'
import request from '../utils/request'

const route = useRoute()
const router = useRouter()
const store = useStore()
const musicId = computed(() => route.params.id)

const goBack = () => {
  router.back()
}

const music = reactive({
  id: null,
  title: '',
  artist: '',
  coverPath: '',
  audioPath: '',
  description: '',
  playCount: 0,
  likeCount: 0,
  commentCount: 0
})

const comments = ref([])
const commentContent = ref('')
const isLiked = ref(false)
const isFollowingMusician = ref(false)
const isPlaying = computed(() => store.state.isPlaying && store.state.currentMusic?.id === music.id)

// 回复相关
const replyToComment = ref(null)
const replyContent = ref('')
const showReplyInput = ref(null)
const expandedReplies = ref(new Set())
const MAX_VISIBLE_REPLIES = 2



const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleString()
}

const getMusicDetail = () => {
  request.get(`/music/detail/${musicId.value}`)
    .then(response => {
      Object.assign(music, response)
    })
    .catch(error => {
      console.error('Failed to get music detail:', error)
      ElMessage.error('获取音乐详情失败')
    })
}

const getComments = () => {
  request.get(`/comments/music/${musicId.value}`)
    .then(response => {
      // 为每个评论添加isLiked属性，默认false
      comments.value = response.map(comment => ({
        ...comment,
        isLiked: comment.isLiked || false
      }))
    })
    .catch(error => {
      console.error('Failed to get comments:', error)
      ElMessage.error('获取评论失败')
    })
}

const checkIsLiked = () => {
  if (store.state.isAuthenticated) {
    request.get(`/likes/music/${musicId.value}/status`)
      .then(response => {
        isLiked.value = response.liked
      })
      .catch(error => {
        console.error('Failed to check like status:', error)
      })
  }
}

const checkFollowStatus = () => {
  if (store.state.isAuthenticated && music.musicianId) {
    request.get(`/follow/${music.musicianId}/status`)
      .then(response => {
        isFollowingMusician.value = response.isFollowing
      })
      .catch(error => {
        console.error('Failed to check follow status:', error)
      })
  }
}

const handleFollowMusician = () => {
  if (!store.state.isAuthenticated) {
    ElMessage.warning('请先登录')
    return
  }
  
  if (!music.musicianId) {
    ElMessage.warning('无法关注该音乐人')
    return
  }
  
  const url = `/follow/${music.musicianId}`
  const method = isFollowingMusician.value ? 'delete' : 'post'
  
  request[method](url)
    .then(() => {
      isFollowingMusician.value = !isFollowingMusician.value
      ElMessage.success(isFollowingMusician.value ? '关注成功' : '已取消关注')
    })
    .catch(error => {
      console.error('Failed to follow musician:', error)
      ElMessage.error('操作失败')
    })
}

const handlePlay = () => {
  store.dispatch('playMusic', music)
}

const handleLike = () => {
  if (!store.state.isAuthenticated) {
    ElMessage.warning('请先登录')
    return
  }
  
  const url = `/likes/music/${musicId.value}`
  const method = isLiked.value ? 'delete' : 'post'
  
  request[method](url)
    .then(() => {
      isLiked.value = !isLiked.value
      music.likeCount += isLiked.value ? 1 : -1
      ElMessage.success(isLiked.value ? '喜欢成功' : '取消喜欢')
    })
    .catch(error => {
      console.error('Failed to like music:', error)
      ElMessage.error('操作失败')
    })
}

const handleShare = () => {
  const shareUrl = `${window.location.origin}/music/${musicId.value}`
  
  if (navigator.clipboard && navigator.clipboard.writeText) {
    // 使用现代Clipboard API
    navigator.clipboard.writeText(shareUrl)
      .then(() => {
        ElMessage.success('分享链接已复制到剪贴板')
      })
      .catch(error => {
        console.error('Failed to copy share link:', error)
        ElMessage.error('复制失败，请手动复制链接')
      })
  } else {
    // 降级方案：使用传统的文本域选择复制
    const textArea = document.createElement('textarea')
    textArea.value = shareUrl
    document.body.appendChild(textArea)
    textArea.select()
    
    try {
      document.execCommand('copy')
      ElMessage.success('分享链接已复制到剪贴板')
    } catch (error) {
      console.error('Failed to copy share link:', error)
      ElMessage.error('复制失败，请手动复制链接')
    } finally {
      document.body.removeChild(textArea)
    }
  }
}



const handleSubmitComment = () => {
  if (!store.state.isAuthenticated) {
    ElMessage.warning('请先登录')
    return
  }
  
  if (!commentContent.value.trim()) {
    ElMessage.warning('请输入评论内容')
    return
  }
  
  request.post(`/comments/music/${musicId.value}`, { content: commentContent.value })
    .then(response => {
      comments.value.unshift(response)
      music.commentCount++
      commentContent.value = ''
      ElMessage.success('评论成功')
    })
    .catch(error => {
      console.error('Failed to submit comment:', error)
      ElMessage.error('评论失败')
    })
}

const handleLikeComment = (comment) => {
  if (!store.state.isAuthenticated) {
    ElMessage.warning('请先登录')
    return
  }
  
  const url = `/likes/comment/${comment.id}`
  const method = comment.isLiked ? 'delete' : 'post'
  
  request[method](url)
    .then(() => {
      comment.isLiked = !comment.isLiked
      comment.likeCount += comment.isLiked ? 1 : -1
      ElMessage.success(comment.isLiked ? '点赞成功' : '取消点赞')
    })
    .catch(error => {
      console.error('Failed to like comment:', error)
      ElMessage.error('操作失败')
    })
}

const handleReply = (comment) => {
  if (!store.state.isAuthenticated) {
    ElMessage.warning('请先登录')
    return
  }
  
  if (showReplyInput.value === comment.id) {
    // 如果当前已经打开了该评论的回复框，则关闭
    showReplyInput.value = null
    replyToComment.value = null
    replyContent.value = ''
  } else {
    // 打开回复框
    showReplyInput.value = comment.id
    replyToComment.value = comment
    replyContent.value = ''
  }
}

const handleSubmitReply = () => {
  if (!replyToComment.value || !replyContent.value.trim()) {
    ElMessage.warning('请输入回复内容')
    return
  }
  
  request.post(`/comments/${replyToComment.value.id}/reply`, { content: replyContent.value })
    .then(response => {
      ElMessage.success('回复成功')
      // 关闭回复框
      showReplyInput.value = null
      replyToComment.value = null
      replyContent.value = ''
      // 重新获取评论列表以显示新的回复
      getComments()
    })
    .catch(error => {
      console.error('Failed to submit reply:', error)
      ElMessage.error('回复失败')
    })
}

const toggleExpandReplies = (commentId) => {
  if (expandedReplies.value.has(commentId)) {
    expandedReplies.value.delete(commentId)
  } else {
    expandedReplies.value.add(commentId)
  }
}

const getVisibleReplies = (comment) => {
  if (!comment.replies || comment.replies.length === 0) {
    return []
  }
  
  const isExpanded = expandedReplies.value.has(comment.id)
  
  if (isExpanded) {
    return comment.replies
  } else {
    return comment.replies.slice(0, MAX_VISIBLE_REPLIES)
  }
}

const shouldShowExpandButton = (comment) => {
  return comment.replies && comment.replies.length > MAX_VISIBLE_REPLIES
}

onMounted(() => {
  getMusicDetail()
  getComments()
  checkIsLiked()
  checkFollowStatus()
})
</script>

<style scoped>
.music-detail-container {
  padding: 32px 0;
}

.music-info-section {
  display: flex;
  gap: 32px;
  margin-bottom: 48px;
}

.music-cover-large {
  width: 300px;
  height: 300px;
  overflow: hidden;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.music-cover-large img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.music-meta {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.music-title {
  font-size: 36px;
  margin: 0 0 16px 0;
  color: #303133;
}

.music-artist {
  font-size: 20px;
  color: #606266;
  margin: 0 0 24px 0;
}

.music-stats {
  display: flex;
  gap: 24px;
  margin-bottom: 24px;
  color: #909399;
  font-size: 14px;
}

.music-artist-info {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
  padding: 12px 16px;
  background-color: #f5f7fa;
  border-radius: 8px;
}

.artist-label {
  color: #606266;
  font-size: 14px;
}

.artist-link {
  color: #409eff;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.3s;
}

.artist-link:hover {
  color: #66b1ff;
}

.follow-btn {
  margin-left: auto;
}

.music-actions {
  display: flex;
  gap: 12px;
  margin-bottom: 32px;
}

.music-description {
  padding: 20px;
  background-color: #f5f7fa;
  border-radius: 8px;
}

.music-description h3 {
  margin: 0 0 12px 0;
  color: #303133;
}

.music-description p {
  margin: 0;
  color: #606266;
  line-height: 1.6;
}

.comment-section {
  border-top: 1px solid #ebeef5;
  padding-top: 32px;
}

.comment-section h2 {
  margin-bottom: 24px;
  color: #303133;
}

.comment-input {
  margin-bottom: 32px;
}

.comment-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.comment-item {
  padding-bottom: 24px;
  border-bottom: 1px solid #f0f0f0;
}

.comment-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.user-info {
  display: flex;
  flex-direction: column;
}

.username {
  font-weight: 500;
  color: #303133;
}

.comment-time {
  font-size: 12px;
  color: #909399;
}

.comment-content {
  margin-bottom: 12px;
  color: #606266;
  line-height: 1.5;
}

.comment-actions {
  display: flex;
  gap: 16px;
}

.no-comments {
  text-align: center;
  padding: 48px 0;
  color: #909399;
  background-color: #fafafa;
  border-radius: 8px;
}

.reply-input {
  margin-top: 16px;
  padding: 16px;
  background-color: #f5f7fa;
  border-radius: 8px;
}

.reply-input-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.replies-list {
  margin-left: 52px;
  margin-top: 16px;
  background-color: #f9fafc;
  border-radius: 8px;
  padding: 16px;
}

.reply-item {
  margin-bottom: 16px;
  border-bottom: 1px solid #ebeef5;
  padding-bottom: 16px;
}

.reply-item:last-child {
  margin-bottom: 0;
  border-bottom: none;
  padding-bottom: 0;
}

.expand-replies-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 8px 12px;
  margin-top: 12px;
  color: #409eff;
  cursor: pointer;
  transition: all 0.3s;
  border-radius: 4px;
  background-color: #f0f7ff;
}

.expand-replies-btn:hover {
  background-color: #e6f4ff;
}

.expand-text {
  font-size: 13px;
  font-weight: 500;
}

.expand-icon {
  font-size: 14px;
  transition: transform 0.3s;
}
</style>
