<script setup lang="ts">
import BasicLayout from '@/layouts/BasicLayout.vue'
</script>

<template>
  <BasicLayout />
</template>

<style>
/* 全局样式优化 - 精简小巧风格 */
* {
  box-sizing: border-box;
}

:root {
  --primary-color: #4a9eff;
  --primary-light: #7ebcff;
  --primary-dark: #3685e8;
  --text-primary: #2c3e50;
  --text-secondary: #7f8c8d;
  --bg-primary: #ffffff;
  --bg-secondary: #f8f9fa;
  --border-color: #e9ecef;
  --shadow-light: 0 2px 8px rgba(74, 158, 255, 0.1);
  --shadow-medium: 0 4px 16px rgba(74, 158, 255, 0.15);
  --border-radius: 8px;
  --border-radius-lg: 12px;
}

body {
  margin: 0;
  padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  overflow-x: hidden;
  background-color: var(--bg-secondary);
  color: var(--text-primary);
  font-size: 14px;
  line-height: 1.5;
}

html {
  overflow-x: hidden;
}

/* Ant Design 组件主题色覆盖 */
.ant-btn-primary {
  background-color: var(--primary-color) !important;
  border-color: var(--primary-color) !important;
}

.ant-btn-primary:hover {
  background-color: var(--primary-dark) !important;
  border-color: var(--primary-dark) !important;
}

.ant-menu-item-selected {
  background-color: rgba(102, 204, 255, 0.1) !important;
  color: var(--primary-color) !important;
}

.ant-menu-item:hover {
  color: var(--primary-color) !important;
}

.ant-input:focus,
.ant-input-focused {
  border-color: var(--primary-color) !important;
  box-shadow: 0 0 0 2px rgba(102, 204, 255, 0.2) !important;
}

.ant-pagination-item-active {
  background-color: var(--primary-color) !important;
  border-color: var(--primary-color) !important;
}

.ant-pagination-item:hover {
  border-color: var(--primary-color) !important;
  color: var(--primary-color) !important;
}
</style>
