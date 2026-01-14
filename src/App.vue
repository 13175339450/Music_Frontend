<template>
  <div id="app">
    <router-view />
    <MusicPlayer />
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useStore } from 'vuex'
import MusicPlayer from './components/MusicPlayer.vue'

const store = useStore()

// 应用初始化时加载用户信息
onMounted(() => {
  store.dispatch('fetchUserInfo')
})
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  background-image: url('./assets/background.jpg');
  background-size: cover;
  background-position: center;
  background-attachment: fixed;
  background-repeat: no-repeat;
  min-height: 100vh;
}
</style>