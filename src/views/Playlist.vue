<template>
  <div class="playlist-container">
    <div class="container">
      <div class="playlist-header">
        <el-button type="text" @click="router.back()">
          <el-icon><ArrowLeft /></el-icon>
        </el-button>
        <h1>我的歌单</h1>
        <el-button type="primary" @click="showCreateModal = true">
          <el-icon><Plus /></el-icon>
          创建歌单
        </el-button>
      </div>

      <div class="playlist-grid">
        <div v-for="playlist in playlists" :key="playlist.id" class="playlist-card">
          <div class="playlist-cover">
            <el-image
              :src="playlist.coverPath"
              fit="cover"
              style="width: 100%; height: 100%;"
            >
              <template #error>
                <div class="image-slot" style="display: flex; justify-content: center; align-items: center; width: 100%; height: 100%; background: #f5f7fa; color: #909399; font-size: 48px;">
                  <el-icon><Music /></el-icon>
                </div>
              </template>
            </el-image>
          </div>
          <div class="playlist-info">
            <h3 class="playlist-title">{{ playlist.name }}</h3>
            <p class="playlist-description">{{ playlist.description || '暂无描述' }}</p>
            <div class="playlist-stats">
              <span>{{ playlist.musicCount }} 首音乐</span>
              <span>{{ playlist.playCount }} 播放</span>
            </div>
            <div class="playlist-actions">
              <el-button type="text" size="small" @click="handleViewPlaylist(playlist)">
                <el-icon><View /></el-icon>
                查看
              </el-button>
              <el-button type="text" size="small" @click="handleEditPlaylist(playlist)">
                <el-icon><Edit /></el-icon>
                编辑
              </el-button>
              <el-button type="text" size="small" @click="handleDeletePlaylist(playlist)" danger>
                <el-icon><Delete /></el-icon>
                删除
              </el-button>
            </div>
          </div>
        </div>
        <div v-if="playlists.length === 0" class="no-playlists">
          <el-icon class="empty-icon"><Document /></el-icon>
          <p>你还没有创建任何歌单</p>
          <el-button type="primary" @click="showCreateModal = true">
            <el-icon><Plus /></el-icon>
            创建第一个歌单
          </el-button>
        </div>
      </div>
    </div>

    <!-- 创建歌单弹窗 -->
    <el-dialog
      v-model="showCreateModal"
      title="创建歌单"
      width="500px"
    >
      <el-form
        :model="createForm"
        :rules="createRules"
        ref="createFormRef"
        label-width="80px"
      >
        <el-form-item label="歌单名称" prop="name">
          <el-input v-model="createForm.name" placeholder="请输入歌单名称" />
        </el-form-item>
        <el-form-item label="歌单描述" prop="description">
          <el-input
            v-model="createForm.description"
            type="textarea"
            placeholder="请输入歌单描述"
            :rows="3"
          />
        </el-form-item>
        <el-form-item label="是否公开" prop="isPublic">
          <el-switch v-model="createForm.isPublic" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showCreateModal = false">取消</el-button>
          <el-button type="primary" @click="handleCreatePlaylist">确认</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 编辑歌单弹窗 -->
    <el-dialog
      v-model="showEditModal"
      title="编辑歌单"
      width="500px"
    >
      <el-form
        :model="editForm"
        :rules="editRules"
        ref="editFormRef"
        label-width="80px"
      >
        <el-form-item label="歌单名称" prop="name">
          <el-input v-model="editForm.name" placeholder="请输入歌单名称" />
        </el-form-item>
        <el-form-item label="歌单描述" prop="description">
          <el-input
            v-model="editForm.description"
            type="textarea"
            placeholder="请输入歌单描述"
            :rows="3"
          />
        </el-form-item>
        <el-form-item label="是否公开" prop="isPublic">
          <el-switch v-model="editForm.isPublic" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showEditModal = false">取消</el-button>
          <el-button type="primary" @click="handleUpdatePlaylist">确认</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from 'vuex'
import { ElMessage, ElMessageBox, ElIcon, ElDialog, ElForm, ElFormItem, ElInput, ElSwitch, ElButton } from 'element-plus'
import { Plus, View, Edit, Delete, Document, ArrowLeft, Headset as Music } from '@element-plus/icons-vue'
import request from '../utils/request'

const router = useRouter()
const store = useStore()
const playlists = ref([])

// 创建歌单相关
const showCreateModal = ref(false)
const createFormRef = ref(null)
const createForm = reactive({
  name: '',
  description: '',
  isPublic: true
})

const createRules = {
  name: [
    { required: true, message: '请输入歌单名称', trigger: 'blur' },
    { min: 2, max: 30, message: '歌单名称长度在 2 到 30 个字符', trigger: 'blur' }
  ],
  description: [
    { max: 200, message: '歌单描述不能超过 200 个字符', trigger: 'blur' }
  ]
}

// 编辑歌单相关
const showEditModal = ref(false)
const editFormRef = ref(null)
const editForm = reactive({
  id: null,
  name: '',
  description: '',
  isPublic: true
})

const editRules = {
  name: [
    { required: true, message: '请输入歌单名称', trigger: 'blur' },
    { min: 2, max: 30, message: '歌单名称长度在 2 到 30 个字符', trigger: 'blur' }
  ],
  description: [
    { max: 200, message: '歌单描述不能超过 200 个字符', trigger: 'blur' }
  ]
}

const getPlaylists = () => {
  if (!store.state.isAuthenticated) {
    ElMessage.warning('请先登录查看歌单')
    return
  }
  
  request.get('/playlist/my')
    .then(response => {
      // 确保 playlists.value 是一个数组
      playlists.value = Array.isArray(response) ? response : (response.data || [])
    })
    .catch(error => {
      console.error('Failed to get playlists:', error)
      ElMessage.error('获取歌单失败')
    })
}

const handleViewPlaylist = (playlist) => {
  // Navigate to playlist detail page
  router.push({ name: 'PlaylistDetail', params: { id: playlist.id } })
}

const handleEditPlaylist = (playlist) => {
  Object.assign(editForm, playlist)
  showEditModal.value = true
}

const handleDeletePlaylist = (playlist) => {
  ElMessageBox.confirm(
    `确定要删除歌单 "${playlist.name}" 吗？此操作不可恢复。`,
    '删除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  )
    .then(() => {
      return request.delete(`/playlist/${playlist.id}`)
    })
    .then(() => {
      ElMessage.success('删除歌单成功')
      getPlaylists()
    })
    .catch(error => {
      if (error !== 'cancel') {
        console.error('Failed to delete playlist:', error)
        ElMessage.error('删除歌单失败')
      }
    })
}

const handleCreatePlaylist = async () => {
  if (!createFormRef.value) return
  
  await createFormRef.value.validate((valid) => {
    if (valid) {
      request.post('/playlist', createForm)
        .then(() => {
          ElMessage.success('创建歌单成功')
          showCreateModal.value = false
          // Reset form
          createForm.name = ''
          createForm.description = ''
          createForm.isPublic = true
          getPlaylists()
        })
        .catch(error => {
          console.error('Failed to create playlist:', error)
          ElMessage.error('创建歌单失败')
        })
    } else {
      return false
    }
  })
}

const handleUpdatePlaylist = async () => {
  if (!editFormRef.value) return
  
  await editFormRef.value.validate((valid) => {
    if (valid) {
      request.put(`/playlist/${editForm.id}`, {
        name: editForm.name,
        description: editForm.description,
        isPublic: editForm.isPublic
      })
        .then(() => {
          ElMessage.success('更新歌单成功')
          showEditModal.value = false
          getPlaylists()
        })
        .catch(error => {
          console.error('Failed to update playlist:', error)
          ElMessage.error('更新歌单失败')
        })
    } else {
      return false
    }
  })
}

onMounted(() => {
  if (store.state.isAuthenticated) {
    getPlaylists()
  } else {
    router.push('/login')
  }
})
</script>

<style scoped>
.playlist-container {
  padding: 32px 0;
}

.playlist-header {
  display: flex;
  align-items: center;
  margin-bottom: 32px;
  gap: 16px;
}

.playlist-header h1 {
  flex: 1;
  margin: 0;
  color: #303133;
}

.playlist-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
}

.playlist-card {
  background-color: #fff;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.playlist-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.15);
}

.playlist-cover {
  width: 100%;
  height: 150px;
  overflow: hidden;
}

.playlist-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.playlist-info {
  padding: 16px;
}

.playlist-title {
  margin: 0 0 8px 0;
  font-size: 18px;
  color: #303133;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.playlist-description {
  margin: 0 0 12px 0;
  color: #606266;
  font-size: 14px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.4;
}

.playlist-stats {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
  font-size: 12px;
  color: #909399;
}

.playlist-actions {
  display: flex;
  gap: 8px;
}

.no-playlists {
  grid-column: 1 / -1;
  text-align: center;
  padding: 64px 20px;
  background-color: #f5f7fa;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.empty-icon {
  font-size: 48px;
  color: #c0c4cc;
}

.no-playlists p {
  margin: 0;
  color: #606266;
  font-size: 16px;
}
</style>