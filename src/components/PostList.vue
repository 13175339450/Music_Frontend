<template>
  <div class="post-list">
    <div v-for="post in posts" :key="post.id" class="post-item">
      <div class="post-header">
        <div class="user-info">
          <el-avatar :src="post.user.avatar" size="medium">
            {{ (post.user.nickname || post.user.username || '?').charAt(0) }}
          </el-avatar>
          <div class="user-details">
            <div class="username">{{ post.user.nickname || post.user.username }}</div>
            <div class="post-time">
              {{ formatTime(post.createdAt) }}
              <!-- 显示动态审核状态 -->
              <el-tag 
                v-if="(isAdmin || isCurrentUser(post.user.id)) && post.status !== 2" 
                :type="getPostStatusType(post.status)"
                size="small"
                style="margin-left: 8px;"
              >
                {{ getPostStatusText(post.status) }}
              </el-tag>
            </div>
          </div>
        </div>

      </div>
      
      <div class="post-content">
        <p>{{ post.content }}</p>
        
        <!-- 图片 -->
        <div v-if="post.imageUrls" class="post-images">
          <el-image
            v-for="(image, index) in post.imageUrls.split(',')"
            :key="index"
            :src="image"
            fit="cover"
            @click="previewImage(post, index)"
          ></el-image>
        </div>
      </div>
      
      <div class="post-stats">
        <div class="stat-item" @click="toggleLike(post)">
          <el-icon>
            <LikeFilled v-if="post.isLiked" />
            <Like v-else />
          </el-icon>
          <span>{{ post.likeCount }}</span>
        </div>
        <div class="stat-item" @click="toggleComments(post)">
          <el-icon><ChatDotRound /></el-icon>
          <span>{{ post.commentCount }}</span>
        </div>
        <div class="stat-item" @click="sharePost(post)">
          <el-icon><Share /></el-icon>
          <span>分享</span>
        </div>
      </div>
      
      <!-- 评论区 -->
      <div v-if="post.showComments" class="post-comments">
        <div v-for="comment in post.comments" :key="comment.id" class="comment-item">
          <div class="comment-header">
            <el-avatar :src="comment.user.avatar" size="large">
              {{ (comment.user.nickname || comment.user.username || '?').charAt(0) }}
            </el-avatar>
            <div class="comment-user">{{ comment.user.nickname || comment.user.username }}</div>
            <div class="comment-time">{{ formatTime(comment.createdAt) }}</div>
          </div>
          <div class="comment-content">{{ comment.content }}</div>
          <div class="comment-actions">
            <span class="comment-action" @click="toggleCommentLike(comment)">
              <el-icon>
                <LikeFilled v-if="comment.isLiked" />
                <Like v-else />
              </el-icon>
              {{ comment.likeCount }}
            </span>
          </div>
        </div>
        
        <!-- 评论输入框 -->
        <div class="comment-input">
          <el-input
            v-model="post.newComment"
            placeholder="写下你的评论..."
            @keyup.enter="submitComment(post)"
          >
            <template #append>
              <el-button @click="submitComment(post)">发送</el-button>
            </template>
          </el-input>
        </div>
      </div>
    </div>
    
    <!-- 加载更多 -->
    <div v-if="hasMore || loadingMore" class="load-more">
      <el-button v-if="!loadingMore" type="primary" @click="loadMorePosts">加载更多</el-button>
      <el-button v-else type="primary" :loading="true">加载中...</el-button>
    </div>
    <div v-if="!hasMore && posts.length > 0" class="no-more">
      <span>没有更多内容了</span>
    </div>
    
    <!-- 编辑动态弹窗 -->
    <el-dialog
      v-model="showEditModal"
      title="编辑动态"
      width="500px"
    >
      <el-input
        type="textarea"
        v-model="editForm.content"
        :rows="6"
        placeholder="请输入动态内容"
      />
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showEditModal = false">取消</el-button>
          <el-button type="primary" @click="submitEdit">保存</el-button>
        </div>
      </template>
    </el-dialog>
    
    <!-- 图片预览 -->
    <el-image-viewer
      v-if="showImageViewer"
      :url-list="imageUrls"
      :initial-index="imageIndex"
      @close="showImageViewer = false"
    ></el-image-viewer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useStore } from 'vuex'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '../utils/request'
import { More, Star as Like, StarFilled as LikeFilled, ChatDotRound, Share, VideoPlay as Play, Headset as Music } from '@element-plus/icons-vue'
import { useCommentLike } from '@/composables/useCommentLike'
import { useLike } from '@/composables/useLike'

const store = useStore()
const currentUserId = computed(() => store.getters.currentUser?.id)
const isAdmin = computed(() => store.getters.hasRole('ROLE_ADMIN')) // 使用Vuex的hasRole getter判断是否为管理员

// props
const props = defineProps({
  posts: {
    type: Array,
    default: () => []
  }
})

// 状态
const hasMore = ref(true)
const loadingMore = ref(false)
const showImageViewer = ref(false)
const imageUrls = ref([])
const imageIndex = ref(0)

// 编辑弹窗
const showEditModal = ref(false)
const editForm = ref({
  id: null,
  content: ''
})

// 格式化时间：支持多种后端时间字符串（例如 "YYYY-MM-DD HH:mm:ss"）
const formatTime = (timeString) => {
  const toDate = (input) => {
    if (!input) return null
    let s = input
    if (typeof input === 'object' && input !== null) {
      s = input.createTime || input.createdAt || input
    }
    if (typeof s === 'number') return new Date(s)
    if (typeof s !== 'string') return null

    s = s.trim()
    // 将常见的 "YYYY-MM-DD HH:mm:ss" 转为 ISO 格式 "YYYY-MM-DDTHH:mm:ss"
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(s)) {
      s = s.replace(' ', 'T')
    }

    // 尝试直接解析
    let d = new Date(s)
    if (!isNaN(d.getTime())) return d

    // Safari 兼容：把 - 换成 /
    const alt = s.replace(/-/g, '/')
    d = new Date(alt)
    if (!isNaN(d.getTime())) return d

    return null
  }

  const date = toDate(timeString)
  if (!date) return '刚刚'

  const now = new Date()
  const diff = now - date

  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 30) return `${days}天前`

  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2,'0')}:${date.getMinutes().toString().padStart(2,'0')}`
}

// 获取动态状态文本
const getPostStatusText = (status) => {
  const statusMap = {
    1: '待审核',
    2: '已通过',
    3: '已拒绝'
  }
  return statusMap[status] || '未知状态'
}

// 获取动态状态样式
const getPostStatusType = (status) => {
  const typeMap = {
    1: 'warning',
    2: 'success',
    3: 'danger'
  }
  return typeMap[status] || 'info'
}

// 判断是否是当前用户
const isCurrentUser = (userId) => {
  return currentUserId.value === userId
}



// 提交编辑
const submitEdit = async () => {
  if (!editForm.value.content.trim()) {
    ElMessage.warning('请输入动态内容')
    return
  }
  try {
    const payload = {
      id: editForm.value.id,
      content: editForm.value.content
    }
    const response = await request.put(`/posts/${editForm.value.id}`, payload)
    // 更新本地列表 — request 已返回实际数据（或兼容 axios 响应）
    const updated = response?.data || response || payload
    const idx = props.posts.findIndex(p => p.id === editForm.value.id)
    if (idx !== -1) {
      props.posts[idx].content = updated.content
      props.posts[idx].updatedAt = new Date().toISOString()
    }
    ElMessage.success('编辑成功')
    showEditModal.value = false
  } catch (error) {
    ElMessage.error('编辑失败')
  }
}

// 删除动态
const deletePost = async (post) => {
  try {
    await ElMessageBox.confirm('确定要删除这条动态吗？删除后将无法恢复。', '确认删除', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await request.delete(`/posts/${post.id}`)
    ElMessage.success('动态删除成功')
    // 触发父组件更新
    emit('postDeleted', post.id)
  } catch (error) {
    if (error.name !== 'ElMessageBoxCancel') {
      ElMessage.error('动态删除失败')
    }
  }
}

// 预览图片
const previewImage = (post, index) => {
  if (post.imageUrls) {
    imageUrls.value = post.imageUrls.split(',')
    imageIndex.value = index
    showImageViewer.value = true
  }
}

const { toggleLike: togglePostLike } = useLike()

// 切换点赞
const toggleLike = async (post) => {
  try {
    const response = await togglePostLike('post', post.id)
    
    // 根据后端返回的结果更新状态
    const wasLiked = post.isLiked
    post.isLiked = response.liked
    post.likeCount = response.likeCount || (wasLiked ? post.likeCount - 1 : post.likeCount + 1)
    
    ElMessage.success(post.isLiked ? '点赞成功' : '取消点赞成功')
  } catch (error) {
    ElMessage.error('点赞操作失败')
  }
}

// 切换评论显示
const toggleComments = (post) => {
  post.showComments = !post.showComments
  if (post.showComments && (!post.comments || post.comments.length === 0)) {
    loadComments(post)
  }
}

// 加载评论
const loadComments = async (post) => {
  try {
    const response = await request.get(`/comments/post/${post.id}`)

    // request 拦截器已返回 response.data，因此这里要兼容两种情况
    const commentsData = Array.isArray(response) ? response : (response?.data || response || [])

    const commentsWithStatus = []

    for (const comment of commentsData) {
      const commentWithStatus = {
        ...comment,
        isLiked: comment.isLiked || false,
        likeCount: comment.likeCount || 0
      }

      if (currentUserId.value) {
        try {
          const statusResponse = await request.get(`/likes/comment/${comment.id}/status`)
          const statusData = statusResponse?.data || statusResponse || {}
          commentWithStatus.isLiked = statusData.liked || false
          commentWithStatus.likeCount = typeof statusData.likeCount === 'number' ? statusData.likeCount : commentWithStatus.likeCount
        } catch (statusError) {
          console.warn(`Failed to get like status for comment ${comment.id}:`, statusError)
        }
      }

      commentsWithStatus.push(commentWithStatus)
    }

    post.comments = commentsWithStatus
  } catch (error) {
    console.error('加载评论失败:', error)
    post.comments = []
  }
}

// 提交评论
const submitComment = async (post) => {
  if (!post.newComment.trim()) return

  try {
    const payload = {
      content: post.newComment,
      postId: post.id
    }
    const response = await request.post('/comments', payload)

    post.showComments = true
    if (!post.comments) post.comments = []

    const responseData = response?.data || response || {}

    const newComment = {
      ...responseData,
      createdAt: responseData.createTime || responseData.createdAt,
      isLiked: responseData.isLiked || false,
      likeCount: responseData.likeCount || 0,
      replies: responseData.replies || [],
      user: responseData.user || {
        id: currentUserId.value,
        username: store.getters.currentUser?.username,
        nickname: store.getters.currentUser?.nickname,
        avatar: store.getters.currentUser?.avatar
      }
    }

    post.comments.unshift(newComment)
    post.commentCount = (post.commentCount || 0) + 1
    post.newComment = ''
    ElMessage.success('评论成功')
  } catch (error) {
    console.error('评论失败:', error)
    ElMessage.error('评论失败: ' + (error?.response?.data?.message || error?.message || '未知错误'))
  }
}

const { toggleCommentLike } = useCommentLike()

// 回复功能已移除

// 分享动态
const sharePost = async (post) => {
  try {
    // 调用分享API
    await request.post(`/posts/${post.id}/share`)
    post.shareCount++
    
    // 复制链接到剪贴板
    const shareUrl = `${window.location.origin}/dynamic`
    await navigator.clipboard.writeText(shareUrl)
    
    ElMessage.success('链接已复制，快去分享给好友吧！')
  } catch (error) {
    console.error('Share failed:', error)
    ElMessage.error('分享失败')
  }
}

// 加载更多动态
const loadMorePosts = () => {
  if (loadingMore.value) return; // 防止重复点击
  
  loadingMore.value = true;
  // 触发父组件加载更多
  emit('loadMore', () => {
    // 在父组件完成加载后调用此回调来重置加载状态
    loadingMore.value = false;
  });
}

// 定义事件
const emit = defineEmits(['postDeleted', 'loadMore'])
</script>

<style scoped>
.post-list {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.post-item {
  padding: 20px;
  border-bottom: 1px solid #f5f7fa;
}

.post-item:last-child {
  border-bottom: none;
}

.post-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-details {
  display: flex;
  flex-direction: column;
}

.username {
  font-weight: 500;
  margin-bottom: 4px;
}

.post-time {
  font-size: 12px;
  color: #999;
}

.post-content {
  margin-bottom: 16px;
}

.post-content p {
  margin: 0 0 12px 0;
  line-height: 1.5;
}

.post-music {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px;
  background-color: #f5f7fa;
  border-radius: 8px;
  margin-bottom: 16px;
}

.music-info {
  flex: 1;
}

.music-title {
  font-weight: 500;
  margin-bottom: 4px;
}

.music-artist {
  font-size: 12px;
  color: #666;
}

.post-images {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-bottom: 16px;
}

.post-images img {
  width: 100%;
  height: 0;
  padding-bottom: 100%;
  object-fit: cover;
  border-radius: 8px;
  cursor: pointer;
}

.post-video {
  margin-bottom: 16px;
}

.post-video video {
  width: 100%;
  max-height: 400px;
  object-fit: contain;
  border-radius: 8px;
}

.post-stats {
  display: flex;
  gap: 40px;
  margin-bottom: 16px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  color: #666;
  transition: color 0.3s;
}

.stat-item:hover {
  color: #1890ff;
}

.post-comments {
  background-color: #cbd0d6;
  padding: 16px;
  border-radius: 8px;
}

.comment-item {
  margin-bottom: 16px;
}

.comment-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.comment-user {
  font-weight: 500;
  font-size: 14px;
}

.comment-time {
  font-size: 12px;
  color: #999;
}

.comment-content {
  margin-bottom: 8px;
  line-height: 1.5;
}

.comment-actions {
  display: flex;
  gap: 24px;
  font-size: 12px;
  color: #666;
}

.comment-action {
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
}

.comment-action:hover {
  color: #1890ff;
}

/* reply styles removed with reply feature */

.reply-time {
  font-size: 11px;
  color: #999;
}

.reply-content {
  font-size: 13px;
  line-height: 1.4;
}

.reply-to {
  color: #1890ff;
}

.comment-input {
  margin-top: 16px;
}

.load-more {
  text-align: center;
  padding: 20px;
}

.no-more {
  text-align: center;
  padding: 20px;
  color: #999;
  font-size: 14px;
}
</style>