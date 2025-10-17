<template>
  <div class="app-card-wrapper">
    <div class="app-card">
      <div class="video-container">
        <div class="video-thumbnail">
          <img v-if="app.cover" :src="app.cover" :alt="app.appName" />
          <div v-else class="video-placeholder"></div>
          <div class="delete-button" @click.stop="handleDelete">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 6v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6h-2.5l-.71-.71c-.18-.18-.44-.29-.7-.29H8.91c-.26 0-.52.11-.7.29L8.5 6H3zm4.01 3L9 6h6l.49 3H7.01zm8.49 0h-4.98L13 12h2l.51-3zM10.5 17h3c.83 0 1.5-.67 1.5-1.5S14.33 14 13.5 14h-3c-.83 0-1.5.67-1.5 1.5S9.67 17 10.5 17z"/>
            </svg>
          </div>
          <div class="app-actions">
            <a-space>
              <a-button type="primary" @click="handleViewChat">查看对话</a-button>
              <a-button v-if="app.deployKey" type="default" @click="handleViewWork">查看作品</a-button>
            </a-space>
          </div>
        </div>
      </div>
    </div>
    <div class="card-info">
      <h3 class="video-title">{{ app.appName || '未命名素材' }}</h3>
      <span class="app-date">{{ formatDate(app.createTime?.toString()) || '' }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Modal } from 'ant-design-vue'
import { deleteApp } from '@/api/appController'
import { message } from 'ant-design-vue'
import { formatDate } from '@/utils/time'

interface Props {
  app: API.AppVO
  featured?: boolean
}

interface Emits {
  (e: 'view-chat', appId: string | number | undefined): void
  (e: 'view-work', app: API.AppVO): void
  (e: 'delete', appId: string | number | undefined): void
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

const handleDelete = () => {
  Modal.confirm({
    title: '确认删除',
    content: '确定要删除这个素材吗？此操作不可撤销。',
    onOk: async () => {
      try {
        const response = await deleteApp({ id: props.app.id })
        if (response.data.code === 0 && response.data.data) {
          message.success('删除成功')
          emit('delete', props.app.id)
        } else {
          message.error('删除失败，请重试')
        }
      } catch (error) {
        console.error('删除失败:', error)
        message.error('删除失败，请重试')
      }
    }
  })
}
</script>

<style scoped>
.app-card-wrapper {
  display: flex;
  flex-direction: column;
  margin-bottom: 24px;
}

.app-card {
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  position: relative;
}

.app-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.video-container {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.video-thumbnail {
  position: relative;
  width: 100%;
  aspect-ratio: 16/9;
  overflow: hidden;
  background-color: #f2f2f2;
}

.delete-button {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 32px;
  height: 32px;
  background: rgba(255, 255, 255, 0.95);
  border: none;
  border-radius: 8px;
  color: #666;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 20;
  opacity: 0;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(4px);
}

.app-card:hover .delete-button {
  opacity: 1;
}

.delete-button:hover {
  background: #fff;
  color: #ff4d4f;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  transform: translateY(-2px);
}

.delete-button svg {
  transition: transform 0.2s ease;
}

.delete-button:hover svg {
  transform: scale(1.1);
}

.video-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.app-card:hover .video-thumbnail img {
  transform: scale(1.02);
}

.video-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(45deg, #e0e0e0, #f0f0f0);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  font-size: 24px;
}

.app-actions {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  opacity: 0;
  transition: opacity 0.3s ease;
  z-index: 10;
}

.app-card:hover .app-actions {
  opacity: 1;
}

.app-actions .ant-btn {
  height: 36px;
  padding: 0 18px;
  font-size: 14px;
  border-radius: 6px;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.app-actions .ant-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.25);
}

.video-title {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  margin: 0 0 4px 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-info {
  margin-top: 8px;
  padding-left: 4px;
}

.app-date {
  font-size: 13px;
  color: #999;
  font-weight: 400;
  display: block;
}
</style>
