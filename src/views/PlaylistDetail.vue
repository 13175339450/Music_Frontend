<template>
  <div class="playlist-detail">
    <div class="container">
      <el-page-header @back="goBack" content="歌单详情" style="margin-bottom: 24px" />
      <!-- 歌单头部 -->
      <div class="playlist-header">
        <div class="playlist-cover-large">
          <el-image
            :src="playlist.coverPath"
            fit="cover"
            style="width: 100%; height: 100%"
          >
            <template #error>
              <div class="image-slot" style="display: flex; justify-content: center; align-items: center; width: 100%; height: 100%; background: #f5f7fa; color: #909399; font-size: 48px;">
                <el-icon><Music /></el-icon>
              </div>
            </template>
          </el-image>
        </div>
        <div class="playlist-info-large">
          <h1 class="playlist-title-large">{{ playlist.name }}</h1>
          <div class="playlist-meta">
            <span class="meta-item">
              <el-icon><User /></el-icon>
              {{ playlist.user.nickname || playlist.user.username }}
            </span>
            <span class="meta-item">
              <el-icon><Music /></el-icon>
              {{ playlist.musicCount }} 首音乐
            </span>
            <span class="meta-item">
              <el-icon><View /></el-icon>
              {{ playlist.playCount }} 播放
            </span>
            <span v-if="!playlist.isPublic" class="meta-item private-tag">
              <el-icon><Lock /></el-icon>
              私有
            </span>
          </div>
          <div class="playlist-description-large">{{ playlist.description || '暂无描述' }}</div>
          <div class="playlist-actions-large">
            <el-button type="primary" @click="playAllMusic">
              <el-icon><Play /></el-icon>
              播放全部
            </el-button>
            <el-button v-if="isOwner" @click="toggleEditCover">
              <el-icon><Upload /></el-icon>
              上传封面
            </el-button>
            <el-dropdown v-if="isOwner">
              <el-button>
                <el-icon><More /></el-icon>
                更多操作
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="toggleEditModal">编辑歌单信息</el-dropdown-item>
                  <el-dropdown-item @click="deletePlaylist" danger>删除歌单</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>
      </div>

      <!-- 歌单歌曲列表 -->
      <div class="music-list-section">
        <div class="section-header">
          <h2>歌曲列表</h2>
          <el-input
            v-model="searchKeyword"
            placeholder="搜索歌曲"
            style="width: 300px"
          >
            <template #append>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </div>

        <div class="music-table-container">
          <table class="music-table">
            <thead>
              <tr>
                <th>序号</th>
                <th>封面</th>
                <th>歌曲</th>
                <th>歌手</th>
                <th>专辑</th>
                <th>时长</th>
                <th v-if="isOwner || store.state.isAuthenticated">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(music, index) in filteredMusicList"
                :key="music.id"
                class="music-item"
                @click="playMusic(music)"
              >
                <td class="music-index">{{ index + 1 }}</td>
                <td class="music-cover">
                  <el-image
                    :src="music.coverPath"
                    fit="cover"
                    style="width: 100%; height: 100%"
                  >
                    <template #error>
                      <div class="image-slot" style="display: flex; justify-content: center; align-items: center; width: 100%; height: 100%; background: #f5f7fa; color: #909399;">
                        <el-icon><Music /></el-icon>
                      </div>
                    </template>
                  </el-image>
                </td>
                <td class="music-title">{{ music.title }}</td>
                <td class="music-artist">
                  <router-link v-if="music.musicianId" :to="`/musician/${music.musicianId}`" class="artist-link">
                    {{ music.artist }}
                  </router-link>
                  <span v-else>{{ music.artist }}</span>
                </td>
                <td class="music-album">{{ music.album || '-' }}</td>
                <td class="music-duration">{{ formatDuration(music.duration) }}</td>
                <td class="music-actions">
                  <el-button
                    v-if="isOwner"
                    type="text"
                    size="small"
                    danger
                    @click.stop="removeMusicFromPlaylist(music.id)"
                  >
                    <el-icon><Delete /></el-icon>
                    移除
                  </el-button>
                  <el-button
                    v-if="store.state.isAuthenticated && !isOwner && music.musicianId"
                    :type="getFollowStatus(music.musicianId) ? 'default' : 'primary'"
                    size="small"
                    @click.stop="handleFollowMusician(music.musicianId, $event)"
                    :loading="followLoading === music.musicianId"
                  >
                    {{ getFollowStatus(music.musicianId) ? '已关注' : '关注' }}
                  </el-button>
                </td>
              </tr>
            </tbody>
          </table>

          <div v-if="filteredMusicList.length === 0" class="no-music">
            <el-icon class="empty-icon"><Music /></el-icon>
            <p>歌单中还没有添加音乐</p>
            <el-button type="primary" @click="showAddMusicModal">
              <el-icon><Plus /></el-icon>
              添加音乐
            </el-button>
          </div>
        </div>
      </div>

      <!-- 编辑歌单信息弹窗 -->
      <el-dialog
        v-model="showEditModal"
        title="编辑歌单信息"
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

      <!-- 添加音乐弹窗 -->
      <el-dialog
        v-model="showAddMusicModal"
        title="添加音乐到歌单"
        width="80%"
      >
        <div class="add-music-container">
          <el-input
            v-model="musicSearchKeyword"
            placeholder="搜索音乐"
            style="width: 100%; margin-bottom: 16px"
            @keyup.enter="searchMusic"
          >
            <template #append>
              <el-button @click="searchMusic">搜索</el-button>
            </template>
          </el-input>

          <div class="music-search-results">
            <div
              v-for="music in searchResults"
              :key="music.id"
              class="search-result-item"
              @click="addMusicToPlaylist(music)"
            >
              <el-image
                :src="music.coverPath"
                fit="cover"
                style="width: 60px; height: 60px; margin-right: 12px; border-radius: 4px; overflow: hidden;"
              >
                <template #error>
                  <div class="image-slot" style="display: flex; justify-content: center; align-items: center; width: 100%; height: 100%; background: #f5f7fa; color: #909399;">
                    <el-icon><Music /></el-icon>
                  </div>
                </template>
              </el-image>
              <div class="music-info">
                <div class="music-title">{{ music.title }}</div>
                <div class="music-artist">{{ music.artist }}</div>
              </div>
              <el-button type="primary" size="small" @click.stop="addMusicToPlaylist(music)">
                <el-icon><Plus /></el-icon>
                添加
              </el-button>
            </div>
          </div>
        </div>
        <template #footer>
          <span class="dialog-footer">
            <el-button @click="showAddMusicModal = false">关闭</el-button>
          </span>
        </template>
      </el-dialog>

      <!-- 封面上传弹窗 -->
      <el-dialog
        v-model="showCoverUploadModal"
        title="上传歌单封面"
        width="500px"
      >
        <el-upload
          class="cover-upload"
          action="/api/upload/images"
          list-type="picture-card"
          :on-success="handleCoverUploadSuccess"
          :on-error="handleCoverUploadError"
          :before-upload="beforeCoverUpload"
          :limit="1"
        >
          <el-icon><Plus /></el-icon>
          <template #tip>
            <div class="el-upload__tip">支持JPG、PNG格式，不超过5MB</div>
          </template>
        </el-upload>
        <template #footer>
          <span class="dialog-footer">
            <el-button @click="showCoverUploadModal = false">取消</el-button>
          </span>
        </template>
      </el-dialog>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useStore } from 'vuex'
import { ElMessage, ElMessageBox, ElIcon, ElDialog, ElForm, ElFormItem, ElInput, ElSwitch, ElButton, ElDropdown, ElDropdownMenu, ElDropdownItem, ElUpload } from 'element-plus'
import { User, Headset as Music, View, Lock, VideoPlay as Play, Upload, More, Delete, Search, Plus } from '@element-plus/icons-vue'
import request from '../utils/request'

const route = useRoute()
const router = useRouter()
const store = useStore()

const goBack = () => {
  router.back()
}

// 歌单信息
const playlist = ref({})
const playlistId = computed(() => route.params.id)
const currentUserId = computed(() => store.getters.currentUser?.id)
const isOwner = computed(() => playlist.value.user?.id === currentUserId.value)

// 音乐列表
const musicList = ref([])
const searchKeyword = ref('')
const followStatus = ref(new Map())
const followLoading = ref(null)
const filteredMusicList = computed(() => {
  if (!searchKeyword.value) return musicList.value
  return musicList.value.filter(music => 
    music.title.toLowerCase().includes(searchKeyword.value.toLowerCase()) ||
    music.artist.toLowerCase().includes(searchKeyword.value.toLowerCase())
  )
})

// 编辑歌单相关
const showEditModal = ref(false)
const editFormRef = ref(null)
const editForm = reactive({
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

// 添加音乐相关
const showAddMusicModal = ref(false)
const musicSearchKeyword = ref('')
const searchResults = ref([])

// 封面上传相关
const showCoverUploadModal = ref(false)

// 获取歌单详情
const getPlaylistDetail = () => {
  request.get(`/playlist/${playlistId.value}`)
    .then(response => {
      playlist.value = response.data || response
      // 更新编辑表单
      editForm.name = playlist.value.name
      editForm.description = playlist.value.description || ''
      editForm.isPublic = playlist.value.isPublic
      // 获取歌单中的音乐
      getMusicInPlaylist()
    })
    .catch(error => {
      console.error('Failed to get playlist detail:', error)
      ElMessage.error('获取歌单详情失败')
      router.push('/playlist')
    })
}

// 获取歌单中的音乐
const getMusicInPlaylist = () => {
  request.get(`/playlist/${playlistId.value}/music`)
    .then(response => {
      musicList.value = Array.isArray(response) ? response : (response.data || [])
      loadFollowStatus()
    })
    .catch(error => {
      console.error('Failed to get music in playlist:', error)
      ElMessage.error('获取歌单音乐失败')
    })
}

// 获取关注状态
const getFollowStatus = (musicianId) => {
  return followStatus.value.get(musicianId) || false
}

// 加载关注状态
const loadFollowStatus = async () => {
  if (!store.state.isAuthenticated) {
    return
  }
  
  const musicianIds = [...new Set(musicList.value.map(m => m.musicianId).filter(id => id))]
  
  for (const musicianId of musicianIds) {
    try {
      const response = await request.get(`/follow/${musicianId}/status`)
      followStatus.value.set(musicianId, response.isFollowing)
    } catch (error) {
      console.error(`Failed to check follow status for musician ${musicianId}:`, error)
    }
  }
}

// 处理关注音乐人
const handleFollowMusician = async (musicianId, event) => {
  if (!store.state.isAuthenticated) {
    ElMessage.warning('请先登录')
    return
  }
  
  event.stopPropagation()
  
  const isFollowing = getFollowStatus(musicianId)
  followLoading.value = musicianId
  
  try {
    const url = `/follow/${musicianId}`
    const method = isFollowing ? 'delete' : 'post'
    
    await request[method](url)
    followStatus.value.set(musicianId, !isFollowing)
    ElMessage.success(!isFollowing ? '关注成功' : '已取消关注')
  } catch (error) {
    console.error('Failed to follow musician:', error)
    ElMessage.error('操作失败')
  } finally {
    followLoading.value = null
  }
}

// 搜索音乐
const searchMusic = () => {
  if (!musicSearchKeyword.value) return
  
  request.get('/music/search', {
    params: { keyword: musicSearchKeyword.value }
  })
    .then(response => {
      searchResults.value = Array.isArray(response) ? response : (response.data || [])
    })
    .catch(error => {
      console.error('Failed to search music:', error)
      ElMessage.error('搜索音乐失败')
    })
}

// 添加音乐到歌单
const addMusicToPlaylist = (music) => {
  request.post(`/playlist/${playlistId.value}/music`, {
    musicId: music.id
  })
    .then(() => {
      ElMessage.success('音乐添加成功')
      getMusicInPlaylist()
      // 关闭弹窗
      showAddMusicModal.value = false
    })
    .catch(error => {
      console.error('Failed to add music to playlist:', error)
      ElMessage.error('添加音乐失败')
    })
}

// 从歌单中移除音乐
const removeMusicFromPlaylist = (musicId) => {
  ElMessageBox.confirm(
    '确定要从歌单中移除这首歌吗？',
    '确认移除',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  )
    .then(() => {
      return request.delete(`/playlist/${playlistId.value}/music/${musicId}`)
    })
    .then(() => {
      ElMessage.success('音乐移除成功')
      getMusicInPlaylist()
    })
    .catch(error => {
      if (error !== 'cancel') {
        console.error('Failed to remove music from playlist:', error)
        ElMessage.error('移除音乐失败')
      }
    })
}

// 播放全部音乐
const playAllMusic = () => {
  if (musicList.value.length === 0) {
    ElMessage.warning('歌单中还没有音乐')
    return
  }
  store.dispatch('playAllMusic', musicList.value)
  ElMessage.success('开始播放歌单')
}

// 播放单首音乐
const playMusic = (music) => {
  store.dispatch('playMusic', music)
}

// 更新歌单信息
const handleUpdatePlaylist = async () => {
  if (!editFormRef.value) return
  
  await editFormRef.value.validate((valid) => {
    if (valid) {
      request.put(`/playlist/${playlistId.value}`, editForm)
        .then(() => {
          ElMessage.success('歌单信息更新成功')
          showEditModal.value = false
          getPlaylistDetail()
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

// 删除歌单
const deletePlaylist = () => {
  ElMessageBox.confirm(
    `确定要删除歌单 "${playlist.value.name}" 吗？此操作不可恢复。`,
    '删除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  )
    .then(() => {
      return request.delete(`/playlist/${playlistId.value}`)
    })
    .then(() => {
      ElMessage.success('歌单删除成功')
      router.push('/playlist')
    })
    .catch(error => {
      if (error !== 'cancel') {
        console.error('Failed to delete playlist:', error)
        ElMessage.error('删除歌单失败')
      }
    })
}

// 切换编辑封面弹窗
const toggleEditCover = () => {
  showCoverUploadModal.value = true
}

// 封面上传前校验
const beforeCoverUpload = (file) => {
  const isJPGorPNG = file.type === 'image/jpeg' || file.type === 'image/png'
  const isLt5M = file.size / 1024 / 1024 < 5

  if (!isJPGorPNG) {
    ElMessage.error('上传图片只能是 JPG/PNG 格式!')
  }
  if (!isLt5M) {
    ElMessage.error('上传图片大小不能超过 5MB!')
  }

  return isJPGorPNG && isLt5M
}

// 封面上传成功处理
const handleCoverUploadSuccess = (response, file, fileList) => {
  if (Array.isArray(response) && response.length > 0) {
    const coverUrl = response[0]
    // 更新歌单封面
    request.put(`/playlist/${playlistId.value}/cover`, { coverPath: coverUrl })
      .then(() => {
        ElMessage.success('封面上传成功')
        showCoverUploadModal.value = false
        getPlaylistDetail()
      })
      .catch(error => {
        console.error('Failed to update playlist cover:', error)
        ElMessage.error('更新封面失败')
      })
  } else {
    ElMessage.error('封面上传失败')
  }
}

// 封面上传失败处理
const handleCoverUploadError = (error, file, fileList) => {
  ElMessage.error('封面上传失败')
}

// 格式化音乐时长
const formatDuration = (seconds) => {
  if (!seconds) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// 监听路由变化
watch(() => route.params.id, () => {
  getPlaylistDetail()
})

onMounted(() => {
  getPlaylistDetail()
})
</script>

<style scoped>
.playlist-detail {
  padding: 32px 0;
}

.playlist-header {
  display: flex;
  align-items: center;
  margin-bottom: 32px;
}

.playlist-cover-large {
  width: 200px;
  height: 200px;
  border-radius: 8px;
  overflow: hidden;
  margin-right: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.playlist-cover-large img {
  width: 100%;
  height: 100%;
}

.playlist-info-large {
  flex: 1;
}

.playlist-title-large {
  font-size: 32px;
  margin: 0 0 16px 0;
  font-weight: 700;
}

.playlist-meta {
  display: flex;
  gap: 20px;
  margin-bottom: 16px;
  color: #606266;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.private-tag {
  color: #f56c6c;
}

.playlist-description-large {
  margin-bottom: 24px;
  color: #606266;
  line-height: 1.6;
}

.playlist-actions-large {
  display: flex;
  gap: 12px;
  align-items: center;
}

.music-list-section {
  margin-top: 48px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.section-header h2 {
  font-size: 24px;
  margin: 0;
  font-weight: 600;
}

.music-table-container {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  padding: 16px;
}

.music-table {
  width: 100%;
  border-collapse: collapse;
}

.music-table th {
  text-align: left;
  padding: 12px;
  font-weight: 600;
  color: #606266;
  border-bottom: 2px solid #f0f0f0;
}

.music-table td {
  padding: 12px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
}

.music-item:hover {
  background-color: #f5f7fa;
}

.music-index {
  width: 50px;
  text-align: center;
  color: #909399;
}

.music-cover {
  width: 60px;
  height: 60px;
  overflow: hidden;
  border-radius: 4px;
}

.music-cover img {
  width: 100%;
  height: 100%;
}

.music-title {
  font-weight: 500;
  color: #303133;
}

.music-artist, .music-album, .music-duration {
  color: #606266;
}

.artist-link {
  color: #409eff;
  text-decoration: none;
  transition: color 0.3s;
}

.artist-link:hover {
  color: #66b1ff;
  text-decoration: underline;
}

.music-actions {
  text-align: right;
}

.no-music {
  text-align: center;
  padding: 64px 0;
  color: #909399;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.add-music-container {
  max-height: 500px;
  overflow-y: auto;
}

.search-result-item {
  display: flex;
  align-items: center;
  padding: 12px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
}

.search-result-item:hover {
  background-color: #f5f7fa;
}

.cover-upload {
  margin-bottom: 16px;
}
</style>
