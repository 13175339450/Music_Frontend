<template>
  <div class="dynamic-page">
    <div class="page-header">
      <div class="header-content">
        <div class="back-section">
          <el-button 
            type="default" 
            size="large" 
            @click="goBack"
            class="back-button"
          >
            <template #icon>
              <el-icon><ArrowLeft /></el-icon>
            </template>
            返回
          </el-button>
        </div>
        <h2 class="page-title">动态</h2>
        <div class="header-spacer"></div>
      </div>
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

// 返回上一页
const goBack = () => {
  router.go(-1) // 尝试返回上一页
  // 如果没有上一页，则导航到首页
  setTimeout(() => {
    if (window.history.state?.current === window.location.pathname) {
      router.push('/')
    }
  }, 100)
}

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
  min-height: calc(100vh - 48px);
}

.page-header {
  margin-bottom: 24px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  padding: 16px;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-spacer {
  width: 120px; /* 占位以保持标题居中 */
}

.back-section {
  display: flex;
  align-items: center;
}

.back-button {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 500;
  color: #303133;
  transition: all 0.3s;
  border: 1px solid #dcdfe6;
  background-color: #fff;
}

.back-button:hover {
  background-color: #f5f7fa;
  border-color: #c0c4cc;
  color: #409eff;
  transform: translateY(-1px);
}

.back-button:active {
  transform: translateY(0);
}

.page-title {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  text-align: center;
  flex: 1;
}
</style>