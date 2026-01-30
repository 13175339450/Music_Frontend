import { ref } from 'vue'
import request from '@/utils/request'
import { ElMessage } from 'element-plus'

export function useLike() {
  const loading = ref(false)

  // 切换点赞状态（适用于音乐、帖子、评论等）
  const toggleLike = async (type, id) => {
    if (loading.value) return // 防止重复点击

    loading.value = true

    try {
      // 构建API端点
      const endpoint = `/likes/${type}/${id}`
      const response = await request.post(endpoint, {}, {
        headers: {
          'Content-Type': 'application/json'
        }
      })

      // 返回响应数据，让调用者决定如何更新UI
      return response
    } catch (error) {
      console.error(`Failed to toggle ${type} like:`, error)
      ElMessage.error('操作失败，请重试')
      throw error
    } finally {
      loading.value = false
    }
  }

  // 获取点赞状态
  const getLikeStatus = async (type, id) => {
    try {
      const endpoint = `/likes/${type}/${id}/status`
      const response = await request.get(endpoint)
      return response
    } catch (error) {
      console.error(`Failed to get ${type} like status:`, error)
      return { liked: false }
    }
  }

  return {
    loading,
    toggleLike,
    getLikeStatus
  }
}