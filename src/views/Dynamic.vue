<template>
  <div class="dynamic-page">
    <div class="page-header">
      <el-button type="text" @click="router.back()" style="margin-right: 16px;">
        <el-icon><ArrowLeft /></el-icon>
      </el-button>
      <h2>动态</h2>
    </div>
    
    <!-- 动态发布组件 -->
    <PostCreate @post-created="refreshPosts" />
    
    <!-- 动态列表组件 -->
    <PostList 
      :posts="posts" 
      :has-more="hasMore" 
      @load-more="loadMorePosts"
      @post-deleted="handlePostDeleted"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import { ElMessage, ElIcon, ElButton } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'
import request from '../utils/request'
import PostCreate from '../components/PostCreate.vue'
import PostList from '../components/PostList.vue'

const router = useRouter()

const store = useStore()
const isAuthenticated = computed(() => store.getters.isAuthenticated)

// 动态列表
const posts = ref([])
const hasMore = ref(true)
const page = ref(1)
const pageSize = ref(10)

// 加载动态列表
const loadPosts = async () => {
  try {
    const response = await request.get('/posts', {
      params: { page: page.value - 1, size: pageSize.value }
    })
    
    // 处理动态数据，添加额外字段
    const formattedPosts = response.map(post => ({
      ...post,
      showComments: false,
      newComment: '',
      comments: []
      // isLiked字段已经从后端获取
    }))
    
    if (page.value === 1) {
      posts.value = formattedPosts
    } else {
      posts.value = [...posts.value, ...formattedPosts]
    }
    
    // 检查是否还有更多数据
    hasMore.value = formattedPosts.length === pageSize.value
    
    page.value++
  } catch (error) {
    ElMessage.error('加载动态失败')
  }
}

// 加载更多动态
const loadMorePosts = () => {
  if (hasMore.value) {
    loadPosts()
  }
}

// 刷新动态列表
const refreshPosts = () => {
  page.value = 1
  loadPosts()
}

// 处理动态删除
const handlePostDeleted = (postId) => {
  posts.value = posts.value.filter(post => post.id !== postId)
}

// 页面加载时获取动态列表
onMounted(() => {
  loadPosts()
})
</script>

<style scoped>
.dynamic-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 24px;
}

.page-header {
  margin-bottom: 24px;
}

.page-header h2 {
  margin: 0;
  font-size: 24px;
}
</style>