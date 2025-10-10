<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { useLoginUserStore } from '@/stores/loginUser'
import { listMyAppVoByPage } from '@/api/appController'
import AppCard from '@/components/AppCard.vue'
import { getDeployUrl } from '@/config/env'  // 新增：用于生成作品访问地址

const loginUserStore = useLoginUserStore()

const myApps = ref<API.AppVO[]>([])
const myAppsPage = reactive({ current: 1, pageSize: 6, total: 0 })
const loading = ref(false)

const loadMyApps = async () => {
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

const handlePageChange = (page: number, pageSize: number) => {
  myAppsPage.current = page
  myAppsPage.pageSize = pageSize
  loadMyApps()
}

const handlePageSizeChange = (_: number, pageSize: number) => {
  myAppsPage.current = 1
  myAppsPage.pageSize = pageSize
  loadMyApps()
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
onMounted(() => {
  loadMyApps()
})
</script>

<template>
  <div id="myMaterialsPage">
    <div class="container">
      <div class="header-row">
        <div class="title-wrap">
          <h2 class="section-title">我的素材</h2>
          <span class="count" v-if="myAppsPage.total">{{ myAppsPage.total }}</span>
        </div>
        <div class="toolbar">
          <a-button size="small" @click="loadMyApps">刷新</a-button>
        </div>
      </div>

      <a-spin :spinning="loading">
        <div v-if="myApps.length > 0" class="app-grid">
          <AppCard v-for="app in myApps" :key="app.id" :app="app" @view-chat="$router.push(`/app/chat/${app.id}?view=1`)" @view-work="viewWork" />
        </div>
        <div v-else class="empty-state">
          <div class="empty-icon">🗂️</div>
          <div class="empty-title">这里还没有素材</div>
          <div class="empty-desc">从主页开始描述你的主题与尺寸，生成第一份素材</div>
          <a-button type="primary" size="small" @click="$router.push('/')">去生成</a-button>
        </div>
      </a-spin>

      <div class="pagination-wrapper" v-if="myAppsPage.total > 0">
        <a-pagination
          size="small"
          v-model:current="myAppsPage.current"
          v-model:page-size="myAppsPage.pageSize"
          :total="myAppsPage.total"
          :page-size-options="['6','12','15']"
          :show-size-changer="true"
          :show-total="(total: number) => `共 ${total} 个素材`"
          @change="handlePageChange"
          @showSizeChange="handlePageSizeChange"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
#myMaterialsPage { width: 100%; }
.container { max-width: 1100px; margin: 0 auto; padding: 16px; }
.header-row { display: flex; align-items: center; justify-content: space-between; margin: 8px 0 12px; }
.title-wrap { display: flex; align-items: center; gap: 8px; }
.section-title { font-size: 18px; font-weight: 700; margin: 0; }
.count { font-size: 12px; color: var(--primary-color); background: rgba(102,204,255,.12); padding: 2px 6px; border-radius: 10px; }
.app-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 12px; margin: 12px 0 16px; }
.pagination-wrapper { display: flex; justify-content: center; margin-top: 8px; }
.empty-state { text-align: center; color: var(--text-secondary); padding: 40px 0; }
.empty-icon { font-size: 36px; margin-bottom: 8px; opacity: .8; }
.empty-title { font-size: 16px; font-weight: 600; color: var(--text-primary); margin-bottom: 6px; }
.empty-desc { font-size: 13px; margin-bottom: 12px; }
</style>


