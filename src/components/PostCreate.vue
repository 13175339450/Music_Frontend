<template>
  <div class="post-create">
    <div class="create-header">
      <h3>发布动态</h3>
    </div>
    <div class="create-content">
      <div class="user-avatar">
        <el-avatar :src="user.avatar" size="large"></el-avatar>
      </div>
      <div class="post-form">
        <el-input
          v-model="post.content"
          type="textarea"
          placeholder="分享你喜欢的音乐或想法..."
          :rows="3"
          style="resize: none"
        ></el-input>
        
        <div class="form-actions">
          <div class="action-buttons">
            <el-button type="text" @click="toggleImageUpload">
              <el-icon><Picture /></el-icon> 图片
            </el-button>
          </div>
          <el-button type="primary" @click="submitPost" :disabled="!post.content.trim()">
            发布
          </el-button>
        </div>
        
        <!-- 图片上传 -->
        <el-upload
          v-if="showImageUpload"
          class="image-upload"
          action="/api/upload/images"
          name="files"
          :headers="uploadHeaders"
          list-type="picture-card"
          :on-success="handleImageUploadSuccess"
          :on-error="handleImageUploadError"
          :before-upload="beforeImageUpload"
          :multiple="true"
          :limit="9"
        >
          <el-icon><Plus /></el-icon>
          <template #tip>
            <div class="el-upload__tip">支持JPG、PNG格式，单张不超过5MB，最多上传9张</div>
          </template>
        </el-upload>
        
        <!-- 选中的图片 -->
        <div v-if="selectedImages.length > 0" class="selected-images">
          <div v-for="(image, index) in selectedImages" :key="index" class="selected-image-item">
            <el-image :src="image" fit="cover"></el-image>
            <el-button type="text" size="small" @click="removeImage(index)">
              <el-icon><Delete /></el-icon>
            </el-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useStore } from 'vuex'
import { ElMessage } from 'element-plus'
import request from '../utils/request'
import { Picture, Delete, Plus } from '@element-plus/icons-vue'

const store = useStore()
const user = computed(() => store.getters.currentUser)

// 上传请求头
const uploadHeaders = computed(() => {
  const token = localStorage.getItem('token')
  return {
    Authorization: token ? `Bearer ${token}` : ''
  }
})

// 动态内容
const post = ref({
  content: '',
  imageUrls: []
})

// 图片上传状态
const selectedImages = ref([])
const showImageUpload = ref(false)

// 切换图片上传界面
const toggleImageUpload = () => {
  showImageUpload.value = !showImageUpload.value
}

// 移除图片
const removeImage = (index) => {
  selectedImages.value.splice(index, 1)
}

// 图片上传前校验
const beforeImageUpload = (file) => {
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

// 图片上传成功处理
const handleImageUploadSuccess = (response, file, fileList) => {
  // 后端返回的是图片URL的列表
  if (Array.isArray(response)) {
    selectedImages.value.push(...response)
    ElMessage.success(`成功上传 ${response.length} 张图片`)
    // 保持上传界面显示，方便用户继续上传
  } else {
    ElMessage.error('图片上传失败')
  }
}

// 图片上传失败处理
const handleImageUploadError = (error, file, fileList) => {
  ElMessage.error('图片上传失败')
}

// 提交动态
const submitPost = async () => {
  try {
    const postData = {
      content: post.value.content,
      imageUrls: selectedImages.value.join(',')
    }
    
    await request.post('/posts', postData)
    ElMessage.success('动态发布成功')
    
    // 重置表单
    post.value = {
      content: '',
      imageUrls: []
    }
    selectedImages.value = []
    
    // 触发父组件更新
    emit('postCreated')
  } catch (error) {
    ElMessage.error('动态发布失败')
  }
}

// 定义事件
const emit = defineEmits(['postCreated'])
</script>

<style scoped>
.post-create {
  background-color: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 24px;
}

.create-header h3 {
  margin: 0 0 20px 0;
  font-size: 18px;
}

.create-content {
  display: flex;
  gap: 16px;
}

.user-avatar {
  margin-top: 4px;
}

.post-form {
  flex: 1;
}

.form-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
}

.action-buttons {
  display: flex;
  gap: 16px;
}

.selected-images {
  display: flex;
  gap: 12px;
  margin-top: 16px;
  flex-wrap: wrap;
}

.selected-image-item {
  position: relative;
  width: 80px;
  height: 80px;
}

.selected-image-item img {
  width: 100%;
  height: 100%;
  border-radius: 8px;
  object-fit: cover;
}

.selected-image-item .el-button {
  position: absolute;
  top: -8px;
  right: -8px;
  padding: 0;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background-color: #fff;
  border: 1px solid #dcdfe6;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
