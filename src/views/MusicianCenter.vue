<template>
  <div class="musician-center-container">
    <div class="container">
      <div class="musician-header">
        <div class="header-top simple-header">
          <div class="back-link" @click="goBack">
            <el-icon class="back-icon"><ArrowLeft /></el-icon>
            <span>Back 返回</span>
          </div>
          <span class="divider">|</span>
          <h1 class="page-title">音乐人中心</h1>
        </div>
        <div class="musician-info">
          <el-avatar :size="80" :src="user.avatar">
            {{ user.nickname?.charAt(0) || user.username?.charAt(0) }}
          </el-avatar>
          <div class="user-meta">
            <h2>{{ user.nickname || user.username }}</h2>
            <p class="musician-id">音乐人ID: {{ user.id }}</p>
          </div>
        </div>
      </div>

      <div class="dashboard-section">
        <h2>数据概览</h2>
        <div class="dashboard-grid">
          <div class="dashboard-card">
            <div class="dashboard-icon plays">
              <el-icon><VideoCamera /></el-icon>
            </div>
            <div class="dashboard-content">
              <p class="dashboard-label">总播放量</p>
              <h3 class="dashboard-value">{{ stats.totalPlays }}</h3>
              <p class="dashboard-change" :class="{ 'positive': stats.playsChange >= 0, 'negative': stats.playsChange < 0 }">
                {{ stats.playsChange >= 0 ? '+' : '' }}{{ stats.playsChange }}% 较上周
              </p>
            </div>
          </div>
          <div class="dashboard-card">
            <div class="dashboard-icon followers">
              <el-icon><User /></el-icon>
            </div>
            <div class="dashboard-content">
              <p class="dashboard-label">粉丝数</p>
              <h3 class="dashboard-value">{{ stats.totalFollowers }}</h3>
              <p class="dashboard-change" :class="{ 'positive': stats.followersChange >= 0, 'negative': stats.followersChange < 0 }">
                {{ stats.followersChange >= 0 ? '+' : '' }}{{ stats.followersChange }}% 较上周
              </p>
            </div>
          </div>
          <div class="dashboard-card">
            <div class="dashboard-icon likes">
              <el-icon><Like /></el-icon>
            </div>
            <div class="dashboard-content">
              <p class="dashboard-label">总喜欢数</p>
              <h3 class="dashboard-value">{{ stats.totalLikes }}</h3>
              <p class="dashboard-change" :class="{ 'positive': stats.likesChange >= 0, 'negative': stats.likesChange < 0 }">
                {{ stats.likesChange >= 0 ? '+' : '' }}{{ stats.likesChange }}% 较上周
              </p>
            </div>
          </div>
          <div class="dashboard-card">
            <div class="dashboard-icon music">
              <el-icon><Music /></el-icon>
            </div>
            <div class="dashboard-content">
              <p class="dashboard-label">已发布音乐</p>
              <h3 class="dashboard-value">{{ stats.musicCount }}</h3>
              <p class="dashboard-change" :class="{ 'positive': stats.musicChange >= 0, 'negative': stats.musicChange < 0 }">
                {{ stats.musicChange >= 0 ? '+' : '' }}{{ stats.musicChange }}% 较上周
              </p>
            </div>
          </div>
        </div>
      </div>

      <div class="music-management-section">
        <div class="section-header">
          <h2>我的音乐</h2>
          <el-button type="primary" @click="showUploadModal = true">
            <el-icon><Upload /></el-icon>
            上传音乐
          </el-button>
        </div>
        <el-table :data="myMusic" style="width: 100%" stripe>
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column label="封面" width="100">
            <template #default="scope">
              <el-image
                :src="scope.row.coverPath ? `/api/music/cover/${scope.row.id}` : ''"
                fit="cover"
                style="width: 50px; height: 50px; border-radius: 4px"
              >
                <template #error>
                  <div class="image-slot" style="display: flex; justify-content: center; align-items: center; width: 100%; height: 100%; background: #f5f7fa; color: #909399;">
                    <el-icon><Music /></el-icon>
                  </div>
                </template>
              </el-image>
            </template>
          </el-table-column>
          <el-table-column prop="title" label="标题" />
          <el-table-column prop="artist" label="歌手" />
          <el-table-column prop="playCount" label="播放量" width="100" />
          <el-table-column prop="likeCount" label="喜欢数" width="100" />
          <el-table-column prop="copyrightInfo" label="版权信息" width="150" show-overflow-tooltip />
          <el-table-column prop="status" label="状态" width="100">
            <template #default="scope">
              <el-tag :type="scope.row.status === 1 ? 'success' : scope.row.status === 0 ? 'warning' : 'danger'">
                {{ scope.row.status === 1 ? '已通过' : scope.row.status === 0 ? '审核中' : '未通过' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="scope">
              <el-button type="text" size="small" @click="handleEditMusic(scope.row)">
                <el-icon><Edit /></el-icon>
                编辑
              </el-button>
              <el-button type="text" size="small" @click="handleDeleteMusic(scope.row)" danger>
                <el-icon><Delete /></el-icon>
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>



      
    </div>

    <!-- 上传音乐弹窗 -->
    <el-dialog
      v-model="showUploadModal"
      title="上传音乐"
      width="800px"
      destroy-on-close
    >
      <el-form :model="uploadForm" ref="uploadFormRef" label-width="100px">
        <el-form-item label="音乐标题" prop="title">
          <el-input v-model="uploadForm.title" placeholder="请输入音乐标题" />
        </el-form-item>
        <el-form-item label="歌手" prop="artist">
          <el-input v-model="uploadForm.artist" placeholder="请输入歌手名称" />
        </el-form-item>
        <el-form-item label="音乐文件" prop="audioFile">
          <el-upload
            v-model:file-list="audioFileList"
            accept=".mp3,.wav,.flac"
            :auto-upload="false"
            :limit="1"
            :on-exceed="handleAudioExceed"
          >
            <el-button type="primary">
              <el-icon><Upload /></el-icon>
              选择音乐文件
            </el-button>
            <template #tip>
              <div class="el-upload__tip">
                支持 MP3、WAV、FLAC 格式，文件大小不超过 50MB
              </div>
            </template>
          </el-upload>
        </el-form-item>
        <el-form-item label="封面图片" prop="coverFile">
          <el-upload
            v-model:file-list="coverFileList"
            accept=".jpg,.jpeg,.png"
            :auto-upload="false"
            :limit="1"
            :on-exceed="handleCoverExceed"
          >
            <el-button type="primary">
              <el-icon><Upload /></el-icon>
              选择封面图片
            </el-button>
            <template #tip>
              <div class="el-upload__tip">
                支持 JPG、JPEG、PNG 格式，建议尺寸 300x300px
              </div>
            </template>
          </el-upload>
        </el-form-item>
        <el-form-item label="音乐描述" prop="description">
          <el-input
            v-model="uploadForm.description"
            type="textarea"
            placeholder="请输入音乐描述"
            :rows="3"
          />
        </el-form-item>
        <el-form-item label="版权信息" prop="copyright">
          <el-input v-model="uploadForm.copyright" placeholder="请输入版权信息" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showUploadModal = false">取消</el-button>
          <el-button type="primary" @click="handleUploadMusic" :loading="uploading">
            上传音乐
          </el-button>
        </span>
      </template>
    </el-dialog>
    
    <el-dialog
      v-model="showEditModal"
      title="编辑音乐"
      width="600px"
      destroy-on-close
    >
      <el-form :model="editForm" label-width="100px">
        <el-form-item label="音乐标题">
          <el-input v-model="editForm.title" placeholder="请输入音乐标题" />
        </el-form-item>
        <el-form-item label="歌手">
          <el-input v-model="editForm.artist" placeholder="请输入歌手名称" />
        </el-form-item>
        <el-form-item label="音乐描述">
          <el-input
            v-model="editForm.description"
            type="textarea"
            placeholder="请输入音乐描述"
            :rows="3"
          />
        </el-form-item>
        <el-form-item label="版权信息">
          <el-input v-model="editForm.copyrightInfo" placeholder="请输入版权信息" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showEditModal = false">取消</el-button>
          <el-button type="primary" @click="submitEditMusic" :loading="editing">
            保存
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useStore } from 'vuex'
import { ElMessage, ElMessageBox, ElIcon } from 'element-plus'
import { VideoCamera, User, Star as Like, Headset as Music, Edit, Delete, Upload, DataAnalysis, TrendCharts, ChatDotRound, ArrowLeft } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import request from '../utils/request'

const store = useStore()
const router = useRouter()
const user = computed(() => store.state.user)

const goBack = () => {
  router.back()
}

// Dashboard stats
const stats = reactive({
  totalPlays: 0,
  playsChange: 0,
  totalFollowers: 0,
  followersChange: 0,
  totalLikes: 0,
  likesChange: 0,
  musicCount: 0,
  musicChange: 0
})

// My music
const myMusic = ref([])

// Recent comments
const recentComments = ref([])

// Upload music
const showUploadModal = ref(false)
const uploadFormRef = ref(null)
const uploadForm = reactive({
  title: '',
  artist: '',
  description: '',
  copyright: ''
})
const audioFileList = ref([])
const coverFileList = ref([])
const uploading = ref(false)

const showEditModal = ref(false)
const editing = ref(false)
const editForm = reactive({
  id: null,
  title: '',
  artist: '',
  description: '',
  copyrightInfo: ''
})

const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleString()
}

const getDashboardStats = () => {
  request.get('/musician/stats')
    .then(response => {
      stats.totalPlays = response.totalPlays || 0
      stats.totalLikes = response.totalLikes || 0
      stats.musicCount = response.totalMusic || 0
      stats.totalFollowers = response.totalFollowers ?? response.totalFans ?? 0
      
      stats.playsChange = response.playsChange ?? 0
      stats.likesChange = response.likesChange ?? 0
      stats.musicChange = response.musicChange ?? 0
      stats.followersChange = response.followersChange ?? 0
    })
    .catch(error => {
      console.error('Failed to get dashboard stats:', error)
      ElMessage.error('获取数据概览失败')
    })
}

const getMyMusic = () => {
  request.get('/musician/music')
    .then(response => {
      myMusic.value = response
      getRecentComments()
    })
    .catch(error => {
      console.error('Failed to get my music:', error)
      ElMessage.error('获取我的音乐失败')
    })
}

const getRecentComments = async () => {
  try {
    if (myMusic.value.length === 0) {
      recentComments.value = []
      return
    }
    
    const allComments = []
    
    for (const music of myMusic.value) {
      try {
        const comments = await request.get(`/comments/music/${music.id}`)
        allComments.push(...comments)
      } catch (error) {
        console.error(`Failed to get comments for music ${music.id}:`, error)
      }
    }
    
    recentComments.value = allComments.sort((a, b) => new Date(b.createTime) - new Date(a.createTime))
  } catch (error) {
    console.error('Failed to get recent comments:', error)
    ElMessage.error('获取最近评论失败')
  }
}

const handleEditMusic = (music) => {
  editForm.id = music.id
  editForm.title = music.title || ''
  editForm.artist = music.artist || ''
  editForm.description = music.description || ''
  editForm.copyrightInfo = music.copyrightInfo || ''
  showEditModal.value = true
}

const submitEditMusic = () => {
  if (!editForm.title.trim()) {
    ElMessage.warning('请输入音乐标题')
    return
  }
  editing.value = true
  const payload = {
    title: editForm.title,
    artist: editForm.artist,
    description: editForm.description,
    copyrightInfo: editForm.copyrightInfo
  }
  request.put(`/musician/music/${editForm.id}`, payload)
    .then(response => {
      ElMessage.success('保存成功')
      showEditModal.value = false
      editing.value = false
      getMyMusic()
    })
    .catch(error => {
      console.error('Failed to edit music:', error)
      ElMessage.error('保存失败')
      editing.value = false
    })
}

const handleDeleteMusic = (music) => {
  ElMessageBox.confirm(
    `确定要删除音乐 "${music.title}" 吗？此操作不可恢复。`,
    '删除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  )
    .then(() => {
      return request.delete(`/musician/music/${music.id}`)
    })
    .then(() => {
      ElMessage.success('删除音乐成功')
      getMyMusic()
    })
    .catch(error => {
      if (error !== 'cancel') {
        console.error('Failed to delete music:', error)
        ElMessage.error('删除音乐失败')
      }
    })
}

const handleReplyComment = (comment) => {
  ElMessage.info('回复评论功能开发中...')
}

const handleAudioExceed = () => {
  ElMessage.warning('只能上传一个音乐文件')
}

const handleCoverExceed = () => {
  ElMessage.warning('只能上传一个封面图片')
}

const handleUploadMusic = () => {
  if (!audioFileList.value.length) {
    ElMessage.warning('请选择音乐文件')
    return
  }
  
  uploading.value = true
  
  const formData = new FormData()
  formData.append('title', uploadForm.title)
  formData.append('artist', uploadForm.artist)
  formData.append('description', uploadForm.description || '')
  formData.append('copyright', uploadForm.copyright || '')
  formData.append('audioFile', audioFileList.value[0].raw)
  
  if (coverFileList.value.length > 0) {
    formData.append('coverFile', coverFileList.value[0].raw)
  }
  
  request.post('/musician/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
    .then(response => {
      ElMessage.success('音乐上传成功，请等待审核')
      showUploadModal.value = false
      // Reset form
      uploadForm.title = ''
      uploadForm.artist = ''
      uploadForm.description = ''
      uploadForm.copyright = ''
      audioFileList.value = []
      coverFileList.value = []
      getMyMusic()
    })
    .catch(error => {
      console.error('Failed to upload music:', error)
      ElMessage.error('音乐上传失败: ' + (error.response?.data || error.message))
    })
    .finally(() => {
      uploading.value = false
    })
}

onMounted(() => {
  getDashboardStats()
  getMyMusic()
})
</script>

<style scoped>
.musician-center-container {
  padding: 32px 0;
}

.musician-header {
  margin-bottom: 40px;
}

.header-top {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 32px;
}

.header-top h1 {
  margin: 0;
  color: #303133;
}

.back-button {
  display: flex;
  align-items: center;
  gap: 4px;
}

.musician-header h1 {
  margin: 0 0 32px 0;
  color: #303133;
}

.musician-info {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 24px;
  background-color: #f5f7fa;
  border-radius: 8px;
}

.user-meta h2 {
  margin: 0 0 8px 0;
  color: #303133;
}

.musician-id {
  margin: 0;
  color: #606266;
  font-size: 14px;
}

.dashboard-section {
  margin-bottom: 40px;
}

.dashboard-section h2 {
  margin-bottom: 24px;
  color: #303133;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.dashboard-card {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 24px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.dashboard-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
}

.dashboard-icon.plays {
  background-color: #e6f7ff;
  color: #1890ff;
}

.dashboard-icon.followers {
  background-color: #f6ffed;
  color: #52c41a;
}

.dashboard-icon.likes {
  background-color: #fff1f0;
  color: #ff4d4f;
}

.dashboard-icon.music {
  background-color: #f9f0ff;
  color: #722ed1;
}

.dashboard-content {
  flex: 1;
}

.dashboard-label {
  margin: 0 0 8px 0;
  color: #909399;
  font-size: 14px;
}

.dashboard-value {
  margin: 0 0 8px 0;
  font-size: 28px;
  font-weight: bold;
  color: #303133;
}

.dashboard-change {
  margin: 0;
  font-size: 12px;
  color: #52c41a;
}

.dashboard-change.positive {
  color: #52c41a;
}

.dashboard-change.negative {
  color: #ff4d4f;
}

.music-management-section {
  margin-bottom: 40px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.section-header h2 {
  margin: 0;
  color: #303133;
}

.fans-section {
  margin-bottom: 40px;
}

.fans-section h2 {
  margin-bottom: 24px;
  color: #303133;
}

.fans-section h3 {
  margin: 0 0 20px 0;
  color: #606266;
  font-size: 16px;
}

.comments-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.comment-item {
  display: flex;
  gap: 16px;
  padding: 20px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.comment-avatar {
  flex-shrink: 0;
}

.comment-content-wrapper {
  flex: 1;
}

.comment-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
  font-size: 14px;
}

.comment-user {
  font-weight: 500;
  color: #303133;
}

.comment-time {
  color: #909399;
}

.comment-music {
  color: #1890ff;
}

.comment-text {
  margin-bottom: 12px;
  color: #606266;
  line-height: 1.6;
}

.no-comments {
  text-align: center;
  padding: 40px;
  background-color: #f5f7fa;
  border-radius: 8px;
  color: #909399;
}

/* New Header Styles matching the design */
.simple-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.back-link {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  font-size: 16px;
  color: #303133;
  transition: color 0.3s;
}

.back-link:hover {
  color: #409eff;
}

.back-icon {
  font-size: 18px;
}

.divider {
  font-size: 18px;
  color: #dcdfe6;
  margin: 0 4px;
  font-weight: 300;
}

.page-title {
  margin: 0 !important;
  font-size: 18px;
  font-weight: 500;
  color: #303133;
}
</style>
