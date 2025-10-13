<template>
  <a-layout class="basic-layout">
    <!-- 顶部导航栏 - 不在AppChatPage页面显示 -->
    <GlobalHeader v-if="!isAppChatPage" />
    <!-- 主要内容区域 -->
    <a-layout-content 
      class="main-content" 
      :class="{ 'home-page': isHomePage }"
    >
      <router-view />
    </a-layout-content>
    <!-- 底部版权信息 - 不在AppChatPage页面显示 -->
    <GlobalFooter v-if="!isAppChatPage" />
  </a-layout>
</template>

<script setup lang="ts">
import GlobalHeader from '@/components/GlobalHeader.vue'
import GlobalFooter from '@/components/GlobalFooter.vue'
import { useRoute } from 'vue-router'
import { computed } from 'vue'

const route = useRoute()

// 判断是否为首页
const isHomePage = computed(() => route.path === '/')

// 判断是否为AppChatPage页面
const isAppChatPage = computed(() => route.path.startsWith('/app/chat'))
</script>

<style scoped>
.basic-layout {
  background: var(--bg-secondary);
  min-height: 100vh;
  position: relative;
}

.main-content {
  width: 100%;
  padding: 0;
  background: transparent;
  margin: 0;
  min-height: calc(100vh - 64px - 60px); /* 减去头部和底部高度 */
  padding-top: 56px; /* 为固定导航栏留出空间，确保非首页内容不被遮挡 */
}

/* AppChatPage页面样式 - 全屏显示内容 */
.basic-layout:has(#appChatPage) .main-content {
  min-height: 100vh;
  padding-top: 0;
}

/* 首页特殊样式 */
.main-content.home-page {
  padding-top: 0;
}
</style>