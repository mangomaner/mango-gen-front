<template>
  <div id="myPage">
    <!-- 用户信息卡片 -->
    <div class="user-profile-card">
      <div class="user-info-section">
        <a-avatar :size="80" :src="loginUserStore.loginUser.userAvatar">
          {{ loginUserStore.loginUser.userName?.charAt(0) || 'U' }}
        </a-avatar>
        <div class="user-details">
          <h2 class="user-name">{{ loginUserStore.loginUser.userName || '未知用户' }}</h2>
          <div class="user-stats">
            <div class="stat-item">
              <span class="stat-number">{{ myAppsPage.total }}</span>
              <span class="stat-label">素材</span>
            </div>
            <div class="stat-item">
              <span class="stat-number">0</span>
              <span class="stat-label">粉丝</span>
            </div>
            <div class="stat-item">
              <span class="stat-number">0</span>
              <span class="stat-label">关注</span>
            </div>
          </div>
        </div>
        <a-button type="primary" size="large" class="edit-profile-btn">
          编辑资料
        </a-button>
      </div>
    </div>

    <!-- 内容区域 -->
    <div class="container">
      <!-- 搜索框 -->
      <div class="search-container">
        <div class="search-input-container">
          <div class="custom-search-wrapper" @click="handleSearch">
            <SearchOutlined class="search-icon" />
            <Input
              v-model:value="searchKeyword"
              placeholder="搜索素材名称"
              allowClear
              @pressEnter="handleSearch"
              class="custom-search-input"
              @click.stop
            />
          </div>
        </div>
      </div>

      <!-- 素材列表 -->
      <a-spin :spinning="loading">
        <div v-if="myApps.length > 0" class="app-grid">
          <AppCard v-for="app in myApps" :key="app.id" :app="app" @view-chat="viewChat" @view-work="viewWork" @delete="handleDeleteApp" />
        </div>
        <div v-else class="empty-state">
          <div class="empty-icon">🗂️</div>
          <div class="empty-title">这里还没有素材</div>
          <div class="empty-desc">从主页开始描述你的主题与尺寸，生成第一份素材</div>
          <a-button type="primary" size="small" @click="$router.push('/')">去生成</a-button>
        </div>
      </a-spin>

      <!-- 左右翻页按钮 -->
      <div class="app-navigation">
        <div class="navigation-button left" @click="goToPrevPage" :class="{ disabled: myAppsPage.current <= 1 }">
          <span class="arrow-icon">&lt;</span>
        </div>
        <div class="navigation-button right" @click="goToNextPage" :class="{ disabled: myAppsPage.current >= Math.ceil(myAppsPage.total / myAppsPage.pageSize) }">
          <span class="arrow-icon">&gt;</span>
        </div>
      </div>

      <!-- 分页 -->
      <div class="pagination-wrapper" v-if="myAppsPage.total > 0">
        <div class="pagination-info">
          共 {{ myAppsPage.total }} 个素材
        </div>
        <div class="page-buttons">
          <div 
            v-for="page in visiblePages"
            :key="page"
            class="page-button"
            :class="{ active: page === myAppsPage.current }"
            @click="goToPage(page)"
          >
            {{ page }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { message, Input } from 'ant-design-vue'
import { SearchOutlined } from '@ant-design/icons-vue'
import { useLoginUserStore } from '@/stores/loginUser'
import { listMyAppVoByPage } from '@/api/appController'
import AppCard from '@/components/AppCard.vue'
import { getDeployUrl } from '@/config/env'

const loginUserStore = useLoginUserStore()

// 素材数据
const myApps = ref<API.AppVO[]>([])
const myAppsPage = reactive({ current: 1, pageSize: 8, total: 0 })
const loading = ref(false)
const searchKeyword = ref('')

// 加载素材列表
const loadMyApps = async (appName?: string) => {
  if (!loginUserStore.loginUser.id) {
    message.warning('请先登录')
    return
  }
  try {
    loading.value = true
    const res = await listMyAppVoByPage({
      pageNum: myAppsPage.current,
      pageSize: myAppsPage.pageSize,
      sortField: 'createTime',
      sortOrder: 'desc',
      appName: appName
    })
    if (res.data.code === 0 && res.data.data) {
      myApps.value = res.data.data.records || []
      myAppsPage.total = res.data.data.totalRow || 0
    }
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

// 搜索函数
const handleSearch = () => {
  myAppsPage.current = 1; // 搜索时重置到第一页
  loadMyApps(searchKeyword.value.trim());
}

// 计算需要显示的页码
const visiblePages = computed(() => {
  const pages = []
  const maxPage = Math.ceil(myAppsPage.total / myAppsPage.pageSize)
  const currentPage = myAppsPage.current
  
  // 显示当前页左右各2个页码，总共5个页码
  let startPage = Math.max(1, currentPage - 2)
  let endPage = Math.min(maxPage, startPage + 4)
  
  // 如果后面的页码不够，向前补充
  if (endPage - startPage < 4) {
    const prevStartPage = Math.max(1, endPage - 4)
    if (prevStartPage < startPage) {
      startPage = prevStartPage
    }
  }
  
  // 添加页码
  for (let i = startPage; i <= endPage; i++) {
    pages.push(i)
  }
  
  return pages
})

// 页面切换
const goToPage = (page: number) => {
  if (page !== myAppsPage.current) {
    myAppsPage.current = page
    loadMyApps(searchKeyword.value.trim())
  }
}

// 上一页
const goToPrevPage = () => {
  if (myAppsPage.current > 1) {
    myAppsPage.current--
    loadMyApps(searchKeyword.value.trim())
  }
}

// 下一页
const goToNextPage = () => {
  const maxPage = Math.ceil(myAppsPage.total / myAppsPage.pageSize)
  if (myAppsPage.current < maxPage) {
    myAppsPage.current++
    loadMyApps(searchKeyword.value.trim())
  }
}

// 查看作品
const viewWork = (app: API.AppVO) => {
  if (app?.deployKey) {
    const url = getDeployUrl(app.deployKey)
    window.open(url, '_blank')
  } else {
    message.warning('该素材暂无作品链接')
  }
}

// 查看对话
const viewChat = (appId: string | number | undefined) => {
  if (appId) {
    const chatUrl = `${window.location.origin}/app/chat/${appId}?standalone=true`
    window.open(chatUrl, '_blank')
  }
}

// 处理删除
const handleDeleteApp = (appId: string | number | undefined) => {
  // 从列表中移除已删除的素材
  const index = myApps.value.findIndex(app => app.id === appId)
  if (index > -1) {
    myApps.value.splice(index, 1)
    myAppsPage.total--
    
    // 如果当前页为空且不是第一页，返回上一页
    if (myApps.value.length === 0 && myAppsPage.current > 1) {
      myAppsPage.current--
      loadMyApps(searchKeyword.value.trim())
    }
  }
}

// 组件挂载时加载素材
onMounted(() => {
  loadMyApps()
})
</script>

<style scoped>
#myPage { width: 100%; padding-bottom: 32px; }

/* 用户信息卡片 */
.user-profile-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  margin: 16px 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.user-info-section {
  display: flex;
  align-items: center;
  gap: 16px;
  max-width: 1200px;
  margin: 0 auto;
}

.user-details {
  flex: 1;
}

.user-name {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: #1a1a1a;
}

.user-stats {
  display: flex;
  gap: 24px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-number {
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;
}

.stat-label {
  font-size: 12px;
  color: #666;
  margin-top: 2px;
}

.edit-profile-btn {
  height: 32px;
  padding: 0 16px;
  font-size: 12px;
}

/* 内容区域 */
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 16px;
}

/* 搜索框 */
.search-container {
  display: flex;
  justify-content: center;
  margin: 16px 0 12px;
  padding: 0 16px;
}

.search-input-container {
  display: flex;
  align-items: center;
  width: 100%;
  max-width: 700px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.custom-search-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  height: 40px;
  border-radius: 20px;
  background-color: white;
  border: 1px solid #e6e6e6;
  transition: all 0.3s ease;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.custom-search-wrapper:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  border-color: #d9d9d9;
}

.search-icon {
  position: absolute;
  left: 16px;
  font-size: 14px;
  color: #999;
  z-index: 1;
}

.custom-search-input {
  flex: 1;
  height: 100%;
  border: none;
  border-radius: 20px;
  font-size: 13px;
  padding: 0 16px 0 40px;
  background-color: transparent;
  outline: none;
}

.custom-search-input::placeholder {
  color: #999;
}

.ant-input-clear-icon {
  right: 50px !important;
  font-size: 14px;
  color: #999;
}

.ant-input-clear-icon:hover {
  color: #666;
}

/* 左右翻页按钮 */
.app-navigation {
  display: flex;
  justify-content: space-between;
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  transform: translateY(-50%);
  pointer-events: none;
  z-index: 10;
}

.navigation-button {
  width: 36px;
  height: 72px;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border: none;
  pointer-events: auto;
  outline: none;
  border-radius: 6px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.navigation-button:hover:not(.disabled) {
  background: white;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.navigation-button.disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.arrow-icon {
  font-size: 24px;
  font-weight: bold;
  color: #666;
}

.left {
  margin-left: 12px;
}

.right {
  margin-right: 12px;
}

/* 素材网格 */
.app-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
  margin: 12px 0 16px;
  position: relative;
  padding: 12px 0;
}

/* 分页 */
.pagination-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 20px;
  gap: 12px;
  background: white;
  padding: 12px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.pagination-info {
  font-size: 12px;
  color: #666;
}

.page-buttons {
  display: flex;
  gap: 6px;
}

.page-button {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 12px;
  color: #666;
  transition: all 0.2s ease;
  border-radius: 6px;
  border: 1px solid #e6e6e6;
}

.page-button:hover {
  background-color: #f0f0f0;
  color: #4096ff;
  border-color: #4096ff;
}

.page-button.active {
  background-color: #4096ff;
  color: white;
  font-weight: bold;
  border-color: #4096ff;
}

/* 空状态 */
.empty-state {
  text-align: center;
  color: var(--text-secondary);
  padding: 40px 0;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.empty-icon {
  font-size: 36px;
  margin-bottom: 12px;
  opacity: 0.8;
}

.empty-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 6px;
}

.empty-desc {
  font-size: 12px;
  margin-bottom: 16px;
  color: #666;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .user-info-section {
    flex-direction: column;
    text-align: center;
    gap: 16px;
  }
  
  .user-stats {
    justify-content: center;
    gap: 24px;
  }
  
  .app-grid {
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 16px;
  }
  
  .pagination-wrapper {
    flex-direction: column;
    gap: 12px;
  }
}
</style>