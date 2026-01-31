<template>
  <div class="comment-list">
    <div v-if="loading" class="loading">加载中...</div>
    <div v-else>
      <div v-if="comments.length === 0" class="no-comments">暂无评论</div>
      <div v-for="comment in comments" :key="comment.id" class="comment-item">
        <div class="comment-header">
          <el-avatar :src="comment.user.avatar" size="small">
            {{ (comment.user.nickname || comment.user.username || '?').charAt(0) }}
          </el-avatar>
          <div class="meta">
            <div class="name">{{ comment.user.nickname || comment.user.username }}</div>
            <div class="time">{{ formatTime(comment.createdAt) }}</div>
          </div>
        </div>
        <div class="comment-body">{{ comment.content }}</div>
        <div class="comment-footer">
          <span class="like">点赞 {{ comment.likeCount || 0 }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import request from '../utils/request'
import { ElMessage } from 'element-plus'

const props = defineProps({
  postId: {
    type: [Number, String],
    required: true
  }
})

const comments = ref([])
const loading = ref(false)

const fetchComments = async () => {
  if (!props.postId) return
  loading.value = true
  try {
    // request 返回的是 response.data（见 utils/request.js）
    const data = await request.get(`/comments/post/${props.postId}`)
    const list = Array.isArray(data) ? data : (data?.data || [])
    comments.value = list.map(c => ({
      ...c,
      createdAt: c.createTime || c.createdAt,
      user: c.user || { username: '', nickname: '', avatar: null },
      likeCount: c.likeCount || 0
    }))
  } catch (err) {
    console.error('加载评论失败', err)
    ElMessage.error('加载评论失败')
    comments.value = []
  } finally {
    loading.value = false
  }
}

onMounted(fetchComments)
watch(() => props.postId, (v) => { if (v) fetchComments() })

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
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(s)) {
      s = s.replace(' ', 'T')
    }

    let d = new Date(s)
    if (!isNaN(d.getTime())) return d

    const alt = s.replace(/-/g, '/')
    d = new Date(alt)
    if (!isNaN(d.getTime())) return d

    return null
  }

  const date = toDate(timeString)
  if (!date) return ''
  const now = new Date()
  const diff = now - date
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 30) return `${days}天前`
  return `${date.getFullYear()}-${(date.getMonth()+1).toString().padStart(2,'0')}-${date.getDate().toString().padStart(2,'0')} ${date.getHours().toString().padStart(2,'0')}:${date.getMinutes().toString().padStart(2,'0')}`
}
</script>

<style scoped>
.comment-list { padding: 8px; }
.loading, .no-comments { color: #888; padding: 12px 0; text-align: center }
.comment-item { padding: 10px 0; border-bottom: 1px solid #f0f0f0 }
.comment-header { display:flex; align-items:center; gap:8px }
.meta { display:flex; flex-direction:column; }
.name { font-weight:500; font-size:14px }
.time { font-size:12px; color:#999 }
.comment-body { margin:8px 0; line-height:1.5 }
.comment-footer { font-size:12px; color:#666 }
</style>
