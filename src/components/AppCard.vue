<template>
  <div class="app-card" :class="{ 'app-card--featured': featured }">
    <div class="app-content">
      <div class="app-background">
        <img v-if="app.cover" :src="app.cover" :alt="app.appName" />
        <div v-else class="app-placeholder-gradient"></div>
        <!-- 整体渐变遮罩 -->
        <div class="app-overlay-gradient"></div>
      </div>
      <div class="app-info">
        <div class="app-info-left">
          <a-avatar :src="app.user?.userAvatar" :size="40">
            {{ app.user?.userName?.charAt(0) || 'U' }}
          </a-avatar>
        </div>
        <div class="app-info-right">
          <h3 class="app-title">{{ app.appName || '未命名应用' }}</h3>
          <p class="app-author">
            {{ app.user?.userName || (featured ? '官方' : '未知用户') }}
          </p>
        </div>
      </div>
      <div class="app-actions">
        <a-space>
          <a-button type="primary" @click="handleViewChat">查看对话</a-button>
          <a-button v-if="app.deployKey" type="default" @click="handleViewWork">查看作品</a-button>
        </a-space>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  app: API.AppVO
  featured?: boolean
}

interface Emits {
  (e: 'view-chat', appId: string | number | undefined): void
  (e: 'view-work', app: API.AppVO): void
}

const props = withDefaults(defineProps<Props>(), {
  featured: false,
})

const emit = defineEmits<Emits>()

const handleViewChat = () => {
  emit('view-chat', props.app.id)
}

const handleViewWork = () => {
  emit('view-work', props.app)
}
</script>

<style scoped>
.app-card {
  background: var(--bg-primary);
  border-radius: 12px; /* 使用更大的圆角增强柔和感 */
  overflow: hidden;
  box-shadow: var(--shadow-light);
  border: 1px solid var(--border-color);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); /* 使用更平滑的过渡曲线 */
  cursor: pointer;
  height: 240px; /* 固定卡片高度 */
  position: relative;
}

.app-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  border-color: var(--primary-color);
}

.app-card--featured {
    border-color: var(--primary-color);
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 10px 10px -5px rgba(0, 0, 0, 0.03);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .app-card--featured:hover {
    box-shadow: 0 15px 30px -8px rgba(0, 0, 0, 0.12), 0 10px 15px -5px rgba(0, 0, 0, 0.05);
  }

.app-content {
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
  z-index: 1; /* 确保内容在遮罩之上 */
}

.app-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 0;
  overflow: hidden;
}

.app-background img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.app-card:hover .app-background img {
  transform: scale(1.05); /* 悬停时图片轻微放大 */
}

.app-placeholder-gradient {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

/* 整体渐变遮罩层 - 以白色为主（极低透明度版） */
.app-overlay-gradient {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1;
  background: linear-gradient(
    to bottom,
    rgba(255, 255, 255, 0) 0%,
    rgba(255, 255, 255, 0.1) 70%,
    rgba(255, 255, 255, 0.2) 100%
  );
}

.app-info {
    position: relative;
    z-index: 2;
    padding: 16px;
    background: transparent;
  }

.app-info-left {
  flex-shrink: 0;
}

.app-info-left .ant-avatar {
  width: 36px;
  height: 36px;
  font-size: 14px;
  border: 2px solid white;
}

.app-info-right {
  flex: 1;
  min-width: 0;
  margin-left: 12px;
}

.app-title {
    font-size: 16px;
    font-weight: 600;
    margin: 0 0 4px;
    color: #000000; /* 保持黑色字体 */
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    text-shadow: 
      0 0 8px rgba(255, 255, 255, 0.9), /* 增强的白色发光效果 */
      0 1px 4px rgba(255, 255, 255, 0.8); /* 常规白色阴影 */
    transition: text-shadow 0.3s ease;
  }

  .app-card:hover .app-title {
    text-shadow: 
      0 0 12px rgba(255, 255, 255, 0.95), /* 悬停时增强发光效果 */
      0 1px 6px rgba(255, 255, 255, 0.9); /* 增强的白色阴影 */
  }

  .app-author {
    font-size: 13px;
    color: #000000; /* 保持黑色字体 */
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    text-shadow: 
      0 0 6px rgba(255, 255, 255, 0.85), /* 增强的白色发光效果 */
      0 1px 3px rgba(255, 255, 255, 0.75); /* 常规白色阴影 */
    transition: text-shadow 0.3s ease;
  }

  .app-card:hover .app-author {
    text-shadow: 
      0 0 10px rgba(255, 255, 255, 0.9), /* 悬停时增强发光效果 */
      0 1px 5px rgba(255, 255, 255, 0.85); /* 增强的白色阴影 */
  }

.app-actions {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 16px;
    background: rgba(255, 255, 255, 0.85);
    transform: translateY(100%);
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    z-index: 2;
    border-top: 1px solid rgba(0, 0, 0, 0.05);
  }

.app-card:hover .app-actions {
  transform: translateY(0);
}

.app-actions .ant-btn {
  height: 32px;
  padding: 0 16px;
  font-size: 13px;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.app-actions .ant-btn:hover {
  transform: translateY(-1px);
}
</style>
