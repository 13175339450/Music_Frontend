import { createStore } from 'vuex'

const store = createStore({
  state: {
    user: {
      id: localStorage.getItem('userId'),
      username: localStorage.getItem('username'),
      nickname: localStorage.getItem('nickname'),
      avatar: localStorage.getItem('avatar'),
      roles: JSON.parse(localStorage.getItem('roles') || '[]')
    },
    isAuthenticated: !!localStorage.getItem('token'),
    token: localStorage.getItem('token') || null,
    currentMusic: null,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 70,
    playMode: 'order',
    playlist: []
  },
  getters: {
    isAuthenticated: state => state.isAuthenticated,
    currentUser: state => state.user,
    hasRole: (state) => (role) => {
      return state.user.roles.includes(role)
    },
    currentMusic: state => state.currentMusic,
    isPlaying: state => state.isPlaying,
    currentTime: state => state.currentTime,
    duration: state => state.duration,
    volume: state => state.volume,
    playMode: state => state.playMode,
    playlist: state => state.playlist,
    canPlayPrevious: state => state.playlist.length > 1,
    canPlayNext: state => state.playlist.length > 1,
    currentMusicIndex: state => {
      if (!state.currentMusic) return -1
      return state.playlist.findIndex(item => item.id === state.currentMusic.id)
    }
  },
  mutations: {
    setUser(state, user) {
      state.user = user
      state.isAuthenticated = true
      localStorage.setItem('userId', user.id || '')
      localStorage.setItem('username', user.username || '')
      localStorage.setItem('nickname', user.nickname || '')
      localStorage.setItem('avatar', user.avatar || '')
      localStorage.setItem('roles', JSON.stringify(user.roles || []))
    },
    setToken(state, token) {
      state.token = token
      localStorage.setItem('token', token)
    },
    logout(state) {
      state.user = {
        id: null,
        username: null,
        nickname: null,
        avatar: null,
        roles: []
      }
      state.isAuthenticated = false
      state.token = null
      localStorage.removeItem('token')
      localStorage.removeItem('userId')
      localStorage.removeItem('username')
      localStorage.removeItem('nickname')
      localStorage.removeItem('avatar')
      localStorage.removeItem('roles')
    },
    setCurrentMusic(state, music) {
      state.currentMusic = music
    },
    setIsPlaying(state, isPlaying) {
      state.isPlaying = isPlaying
    },
    setCurrentTime(state, currentTime) {
      state.currentTime = currentTime
    },
    setDuration(state, duration) {
      state.duration = duration
    },
    setVolume(state, volume) {
      state.volume = volume
    },
    setPlayMode(state, playMode) {
      state.playMode = playMode
    },
    setPlaylist(state, playlist) {
      state.playlist = playlist
    },
    addToPlaylist(state, music) {
      // 避免重复添加相同的音乐
      const exists = state.playlist.some(item => item.id === music.id)
      if (!exists) {
        state.playlist.push(music)
      }
    },
    removeFromPlaylist(state, musicId) {
      state.playlist = state.playlist.filter(item => item.id !== musicId)
    },
    clearPlaylist(state) {
      state.playlist = []
    }
  },
  actions: {
    login({ commit }, { user, token }) {
      commit('setUser', user)
      commit('setToken', token)
      localStorage.setItem('roles', JSON.stringify(user.roles))
    },
    logout({ commit }) {
      commit('logout')
    },
    fetchUserInfo({ commit, state }) {
      if (state.token && !state.user.id) {
        import('../utils/request').then(({ default: request }) => {
          request.get('/user/profile')
            .then(response => {
              if (response) {
                const user = {
                  id: response.id,
                  username: response.username,
                  nickname: response.nickname || response.username,
                  avatar: response.avatar,
                  roles: response.roles || []
                }
                commit('setUser', user)
              }
            })
            .catch(error => {
              console.error('Failed to fetch user info:', error)
              if (error.response && error.response.status === 401) {
                commit('logout')
              }
            })
        })
      }
    },
    playMusic({ commit, state }, music) {
      // 如果音乐不在播放列表中，添加进去
      if (!state.playlist.some(item => item.id === music.id)) {
        commit('addToPlaylist', music)
      }
      commit('setCurrentMusic', music)
      commit('setIsPlaying', true)
    },
    pauseMusic({ commit }) {
      commit('setIsPlaying', false)
    },
    togglePlay({ commit, state }) {
      commit('setIsPlaying', !state.isPlaying)
    },
    playPrevious({ commit, state, getters }) {
      if (state.playlist.length <= 1) return
      
      let currentIndex = getters.currentMusicIndex
      let previousIndex = (currentIndex - 1 + state.playlist.length) % state.playlist.length
      
      commit('setCurrentMusic', state.playlist[previousIndex])
      commit('setIsPlaying', true)
    },
    playNext({ commit, state, getters }) {
      if (state.playlist.length <= 1) return
      
      let nextIndex
      if (state.playMode === 'random') {
        // 随机播放，避免重复播放同一首
        let randomIndex
        do {
          randomIndex = Math.floor(Math.random() * state.playlist.length)
        } while (randomIndex === getters.currentMusicIndex)
        nextIndex = randomIndex
      } else {
        // 顺序播放或单曲循环
        let currentIndex = getters.currentMusicIndex
        nextIndex = (currentIndex + 1) % state.playlist.length
      }
      
      commit('setCurrentMusic', state.playlist[nextIndex])
      commit('setIsPlaying', true)
    },
    togglePlayMode({ commit, state }) {
      const modes = ['order', 'random', 'loop']
      const currentIndex = modes.indexOf(state.playMode)
      const nextMode = modes[(currentIndex + 1) % modes.length]
      commit('setPlayMode', nextMode)
      return nextMode
    },
    setPlaylist({ commit }, playlist) {
      commit('setPlaylist', playlist)
    },
    addToPlaylist({ commit }, music) {
      commit('addToPlaylist', music)
    },
    removeFromPlaylist({ commit, state, getters }, musicId) {
      commit('removeFromPlaylist', musicId)
      
      // 如果移除的是当前播放的音乐，播放下一首
      if (state.currentMusic && state.currentMusic.id === musicId) {
        if (state.playlist.length > 0) {
          let currentIndex = getters.currentMusicIndex
          let nextIndex = Math.min(currentIndex, state.playlist.length - 1)
          commit('setCurrentMusic', state.playlist[nextIndex])
        } else {
          commit('setCurrentMusic', null)
          commit('setIsPlaying', false)
        }
      }
    },
    clearPlaylist({ commit }) {
      commit('clearPlaylist')
      commit('setCurrentMusic', null)
      commit('setIsPlaying', false)
    }
  }
})

export default store