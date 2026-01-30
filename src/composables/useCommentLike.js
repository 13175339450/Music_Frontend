import { ref } from 'vue'
import request from '@/utils/request'
import { ElMessage } from 'element-plus'

export function useCommentLike() {
  const loading = ref(false)

  // 切换评论点赞状态
  const toggleCommentLike = async (comment) => {
    if (loading.value) return // 防止重复点击

    loading.value = true

    try {
      const response = await request.post(`/likes/comment/${comment.id}`, {}, {
        headers: {
          'Content-Type': 'application/json'
        }
      })

      // 根据后端返回的结果更新状态
      const wasLiked = comment.isLiked
      comment.isLiked = response.liked
      comment.likeCount = response.likeCount || (wasLiked ? comment.likeCount - 1 : comment.likeCount + 1)

      ElMessage.success(comment.isLiked ? '点赞成功' : '取消点赞')
    } catch (error) {
      console.error('Failed to toggle comment like:', error)
      ElMessage.error('操作失败，请重试')
      throw error
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    toggleCommentLike
  }
}