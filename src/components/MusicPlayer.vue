<template>
  <div class="music-player" v-if="currentMusic">
    <div class="player-content">
      <!-- 音乐信息 -->
      <div class="music-info">
        <div class="music-cover-placeholder"></div>
        <div class="music-meta">
          <div class="music-title">{{ currentMusic.title }}</div>
          <div class="music-artist">{{ currentMusic.artist }}</div>
        </div>
      </div>

      <!-- 播放控制 -->
      <div class="play-controls">
        <el-button circle @click="handlePrevious" :disabled="!canPlayPrevious">
          <el-icon><SkipPrevious /></el-icon>
        </el-button>
        <el-button circle size="large" @click="handlePlayPause">
          <el-icon v-if="!isPlaying"><Play /></el-icon>
          <el-icon v-else><Pause /></el-icon>
        </el-button>
        <el-button circle @click="handleNext" :disabled="!canPlayNext">
          <el-icon><SkipNext /></el-icon>
        </el-button>
      </div>

      <!-- 进度条 -->
      <div class="progress-section">
        <div class="time-display">{{ formatTime(currentTime) }}</div>
        <el-slider
          v-model="progressValue"
          :max="duration"
          @change="handleProgressChange"
          class="progress-slider"
        ></el-slider>
        <div class="time-display">{{ formatTime(duration) }}</div>
      </div>

      <!-- 音量控制 -->
      <div class="volume-control">
        <el-button circle @click="toggleMute">
          <el-icon v-if="volume > 0"><Sound /></el-icon>
          <el-icon v-else><SoundMuted /></el-icon>
        </el-button>
        <el-slider
          v-model="volume"
          :min="0"
          :max="100"
          @change="handleVolumeChange"
          class="volume-slider"
        ></el-slider>
      </div>

      <!-- 播放模式 -->
      <div class="play-mode">
        <el-button circle @click="togglePlayMode" :title="modeTitle">
          <el-icon v-if="playMode === 'order'">
            <List />
          </el-icon>
          <el-icon v-else-if="playMode === 'random'">
            <RefreshRight />
          </el-icon>
          <el-icon v-else>
            <View />
          </el-icon>
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useStore } from 'vuex'
import { ElMessage, ElIcon } from 'element-plus'
import {
  VideoPlay as Play,
  VideoPause as Pause,
  ArrowLeft as SkipPrevious,
  ArrowRight as SkipNext,
  Microphone as Sound,
  Mute as SoundMuted,
  List,
  RefreshRight,
  View,
  Headset as Music
} from '@element-plus/icons-vue'

const store = useStore()

// 音频元素引用
const audioElement = ref(null)

// 播放状态
const currentMusic = computed(() => store.state.currentMusic)
const isPlaying = computed(() => store.state.isPlaying)
const currentTime = computed(() => store.state.currentTime)
const duration = computed(() => store.state.duration)
const volume = computed({
  get: () => store.state.volume,
  set: (value) => store.commit('setVolume', value)
})
const playMode = computed(() => store.state.playMode)
const playlist = computed(() => store.state.playlist)

// 计算属性：是否可以播放上一首/下一首
const canPlayPrevious = computed(() => store.getters.canPlayPrevious)
const canPlayNext = computed(() => store.getters.canPlayNext)

// 播放模式标题
const modeTitle = computed(() => {
  const titles = {
    order: '顺序播放',
    random: '随机播放',
    loop: '单曲循环'
  }
  return titles[playMode.value]
})

// 播放进度
const progressValue = computed({
  get: () => currentTime.value,
  set: (value) => handleProgressChange(value)
})

// 音量控制
const isMuted = ref(false)
const previousVolume = ref(70)

// 格式化时间
const formatTime = (seconds) => {
  if (!seconds) return '00:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

// 播放/暂停控制
const handlePlayPause = () => {
  if (!audioElement.value) return
  
  if (isPlaying.value) {
    store.dispatch('pauseMusic')
  } else {
    store.dispatch('playMusic', currentMusic.value)
  }
}

// 上一首
const handlePrevious = () => {
  store.dispatch('playPrevious')
}

// 下一首
const handleNext = () => {
  store.dispatch('playNext')
}

// 进度条变化
const handleProgressChange = (value) => {
  if (!audioElement.value) return
  audioElement.value.currentTime = value
}

// 音量变化
const handleVolumeChange = (value) => {
  if (!audioElement.value) return
  
  audioElement.value.volume = value / 100
  
  // 如果音量大于0且之前是静音状态，则取消静音
  if (value > 0 && isMuted.value) {
    isMuted.value = false
    audioElement.value.muted = false
  }
}

// 切换静音
const toggleMute = () => {
  if (!audioElement.value) return
  
  if (isMuted.value) {
    // 取消静音
    audioElement.value.muted = false
    store.commit('setVolume', previousVolume.value)
    isMuted.value = false
  } else {
    // 静音
    previousVolume.value = volume.value
    audioElement.value.muted = true
    store.commit('setVolume', 0)
    isMuted.value = true
  }
}

// 切换播放模式
const togglePlayMode = () => {
  const nextMode = store.dispatch('togglePlayMode')
  
  const titles = {
    order: '顺序播放',
    random: '随机播放',
    loop: '单曲循环'
  }
  
  ElMessage.success(`已切换到${titles[nextMode]}`)
}

// 监听当前音乐变化
watch(currentMusic, (newMusic) => {
  if (newMusic && audioElement.value) {
    // 设置新的音频源
    audioElement.value.src = `/api/music/play/${newMusic.id}`
    audioElement.value.load()
    
    // 如果当前是播放状态，自动播放新音乐
    if (isPlaying.value) {
      audioElement.value.play()
        .then(() => {
          store.commit('setIsPlaying', true)
        })
        .catch(error => {
          console.error('播放失败:', error)
          ElMessage.error('播放失败')
          store.commit('setIsPlaying', false)
        })
    }
  }
}, { deep: true })

// 监听播放状态变化
watch(isPlaying, (newPlayingState) => {
  if (!audioElement.value) return
  
  if (newPlayingState) {
    audioElement.value.play()
      .catch(error => {
        console.error('播放失败:', error)
        store.commit('setIsPlaying', false)
        ElMessage.error('播放失败')
      })
  } else {
    audioElement.value.pause()
  }
})

// 音频事件监听
const handleLoadedMetadata = () => {
  if (audioElement.value) {
    store.commit('setDuration', audioElement.value.duration)
  }
}

const handleTimeUpdate = () => {
  if (audioElement.value) {
    store.commit('setCurrentTime', audioElement.value.currentTime)
  }
}

const handleEnded = () => {
  if (playMode.value === 'loop') {
    // 单曲循环，重新播放当前音乐
    audioElement.value.currentTime = 0
    audioElement.value.play()
  } else {
    // 顺序播放或随机播放，播放下一首
    store.dispatch('playNext')
  }
}

// 组件挂载
onMounted(() => {
  // 创建音频元素
  audioElement.value = new Audio()
  audioElement.value.volume = volume.value / 100
  
  // 添加事件监听
  audioElement.value.addEventListener('loadedmetadata', handleLoadedMetadata)
  audioElement.value.addEventListener('timeupdate', handleTimeUpdate)
  audioElement.value.addEventListener('ended', handleEnded)
  
  // 如果当前有音乐且处于播放状态，开始播放
  if (currentMusic.value && isPlaying.value) {
    audioElement.value.src = `/api/music/play/${currentMusic.value.id}`
    audioElement.value.load()
    audioElement.value.play()
      .catch(error => {
        console.error('播放失败:', error)
        store.commit('setIsPlaying', false)
      })
  }
})

// 组件卸载
onUnmounted(() => {
  if (audioElement.value) {
    audioElement.value.pause()
    audioElement.value.removeEventListener('loadedmetadata', handleLoadedMetadata)
    audioElement.value.removeEventListener('timeupdate', handleTimeUpdate)
    audioElement.value.removeEventListener('ended', handleEnded)
    audioElement.value = null
  }
})
</script>

<style scoped>
.music-player {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 80px;
  background-color: rgba(255, 255, 255, 0.95);
  border-top: 1px solid #ebeef5;
  box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  padding: 0 24px;
  z-index: 1000;
}

.player-content {
  display: flex;
  align-items: center;
  width: 100%;
  gap: 24px;
}

.music-info {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 200px;
}

.music-cover-placeholder {
  width: 50px;
  height: 50px;
  border-radius: 4px;
  background: linear-gradient(135deg, #a0c4ff 0%, #cdb4db 100%);
}

.music-meta {
  display: flex;
  flex-direction: column;
}

.music-title {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.music-artist {
  font-size: 12px;
  color: #909399;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.play-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.progress-section {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 300px;
}

.time-display {
  font-size: 12px;
  color: #909399;
  min-width: 45px;
  text-align: center;
}

.progress-slider {
  flex: 1;
}

.volume-control {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 150px;
}

.volume-slider {
  width: 100px;
}

.play-mode {
  margin-left: 16px;
}
</style>
