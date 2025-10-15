<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { message, Input } from 'ant-design-vue'
import { SearchOutlined } from '@ant-design/icons-vue'
import { useLoginUserStore } from '@/stores/loginUser'
import { listMyAppVoByPage } from '@/api/appController'
import AppCard from '@/components/AppCard.vue'
import { getDeployUrl } from '@/config/env'  // 新增：用于生成作品访问地址

const loginUserStore = useLoginUserStore()

const myApps = ref<API.AppVO[]>([])
const myAppsPage = reactive({ current: 1, pageSize: 6, total: 0 })
const loading = ref(false)
const searchKeyword = ref('')

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

// 点击页码切换页面
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
// 新增：查看作品
const viewWork = (app: API.AppVO) => {
  if (app?.deployKey) {
    const url = getDeployUrl(app.deployKey)
    window.open(url, '_blank')
  } else {
    message.warning('该素材暂无作品链接')
  }
}

// 新增：查看对话
const viewChat = (appId: string | number | undefined) => {
  if (appId) {
    const chatUrl = `${window.location.origin}/app/chat/${appId}?standalone=true`
    window.open(chatUrl, '_blank')
  }
}
onMounted(() => {
  loadMyApps()
})
</script>

<template>
  <div id="myMaterialsPage">
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

      <a-spin :spinning="loading">
        <div v-if="myApps.length > 0" class="app-grid">
          <AppCard v-for="app in myApps" :key="app.id" :app="app" @view-chat="viewChat" @view-work="viewWork" />
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

<style scoped>
#myMaterialsPage { width: 100%; }
.container { max-width: 1100px; margin: 0 auto; padding: 16px; }
.search-container { 
    display: flex;
    justify-content: center;
    margin: 32px 0 24px;
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
    height: 56px;
    border-radius: 28px;
    background-color: white;
    border: 1px solid #e6e6e6;
    transition: all 0.3s ease;
    cursor: pointer;
  }
  .custom-search-wrapper:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    border-color: #d9d9d9;
  }
  .search-icon {
    position: absolute;
    left: 20px;
    font-size: 18px;
    color: #999;
    z-index: 1;
  }
  .custom-search-input {
    flex: 1;
    height: 100%;
    border: none;
    border-radius: 28px;
    font-size: 16px;
    padding: 0 20px 0 50px;
    background-color: transparent;
    outline: none;
  }
  .custom-search-input::placeholder {
    color: #999;
  }
  .ant-input-clear-icon {
    right: 70px !important;
    font-size: 16px;
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
  width: 50px;
  height: 100px;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border: none;
  pointer-events: auto;
  outline: none;
}

.navigation-button:hover:not(.disabled) {
  background: transparent;
}

.navigation-button.disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.arrow-icon {
  font-size: 32px;
  font-weight: bold;
  color: #666;
}

.left {
  margin-left: 16px;
}

.right {
  margin-right: 16px;
}

.app-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 12px; margin: 12px 0 16px; }
.pagination-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 24px;
  gap: 12px;
}
.pagination-info {
  font-size: 14px;
  color: #666;
}
.page-buttons {
  display: flex;
  gap: 8px;
}
.page-button {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 14px;
  color: #666;
  transition: all 0.2s ease;
  border-radius: 4px;
}
.page-button:hover {
  background-color: #f0f0f0;
  color: #4096ff;
}
.page-button.active {
  background-color: #4096ff;
  color: white;
  font-weight: bold;
}
.empty-state { text-align: center; color: var(--text-secondary); padding: 40px 0; }
.empty-icon { font-size: 36px; margin-bottom: 8px; opacity: .8; }
.empty-title { font-size: 16px; font-weight: 600; color: var(--text-primary); margin-bottom: 6px; }
.empty-desc { font-size: 13px; margin-bottom: 12px; }
</style>


