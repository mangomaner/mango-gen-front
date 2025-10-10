<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { useLoginUserStore } from '@/stores/loginUser'
import { addApp, listMyAppVoByPage, listGoodAppVoByPage } from '@/api/appController'
import { getDeployUrl } from '@/config/env'
import AppCard from '@/components/AppCard.vue'

const router = useRouter()
const loginUserStore = useLoginUserStore()

// 为首页添加特定的类名
document.body.classList.add('home-page')

// 页面卸载时移除类名
onMounted(() => {
  return () => {
    document.body.classList.remove('home-page')
  }
})

// 用户提示词
const userPrompt = ref('')
const creating = ref(false)

// 我的应用数据
const myApps = ref<API.AppVO[]>([])
const myAppsPage = reactive({
  current: 1,
  pageSize: 6,
  total: 0,
})

// 精选应用数据
const featuredApps = ref<API.AppVO[]>([])
const featuredAppsPage = reactive({
  current: 1,
  pageSize: 6,
  total: 0,
})

// 模板数据
const templates = ref([
  {
    id: 1,
    icon: '🖼️',
    title: '桌面/手机壁纸',
    description: '按主题与风格生成 2K/4K 壁纸，支持横竖屏与留白',
    tags: ['壁纸', '2K/4K', '留白'],
    prompt: '生成一张清爽蓝色系的科幻风桌面壁纸，玻璃拟态，留出桌面图标的安全区，导出 4K 与 2K 两个尺寸。'
  },
  {
    id: 2,
    icon: '🧩',
    title: '头像与横幅',
    description: '统一风格的头像与社媒横幅，自动适配尺寸与构图',
    tags: ['头像', '横幅', '统一风格'],
    prompt: '为同一角色生成一组社媒形象：圆形头像与 Twitter/X 横幅，冷调赛博风，头像中心构图，横幅右侧留文案区。'
  },
  {
    id: 3,
    icon: '🎭',
    title: '表情包/贴纸',
    description: '透明背景 PNG，情绪统一，成套导出',
    tags: ['贴纸', '透明背景', '成套'],
    prompt: '生成 8 张可爱风情绪贴纸（开心/害羞/生气/比心等），统一描边与配色，导出透明背景 PNG。'
  },
  {
    id: 4,
    icon: '📦',
    title: '图标与小组件',
    description: '界面图标、桌面小组件预览，含阴影与留白规范',
    tags: ['图标', '小组件', '留白'],
    prompt: '基于「云海」主题生成一组应用图标与桌面小组件预览，圆角矩形，柔和投影，导出 1x/2x/3x。'
  },
  {
    id: 5,
    icon: '📃',
    title: '海报/配图',
    description: '长图与横版配图，保留文字安全区',
    tags: ['配图', '长图', '安全区'],
    prompt: '生成一张活动海报主视觉与两张横版配图，日系清爽风，主视觉中央构图，四周保留文案安全区。'
  },
  {
    id: 6,
    icon: '🔤',
    title: '标题字/装饰字',
    description: '主题化标题字样式与配套装饰元素',
    tags: ['标题字', '装饰', '统一风格'],
    prompt: '为「Mango Gen」生成一组标题字样式，蓝绿色冷调，玻璃质感，附三种装饰线与角标元素。'
  }
])

// 设置提示词
const setPrompt = (prompt: string) => {
  userPrompt.value = prompt
  // 滚动到输入区域
  scrollToInput()
}

// 滚动到输入区域
const scrollToInput = () => {
  const inputSection = document.querySelector('.smart-input-section')
  if (inputSection) {
    inputSection.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
}

// 优化提示词功能已移除

// 创建应用
const createApp = async () => {
  if (!userPrompt.value.trim()) {
    message.warning('请输入应用描述')
    return
  }

  if (!loginUserStore.loginUser.id) {
    message.warning('请先登录')
    await router.push('/user/login')
    return
  }

  creating.value = true
  try {
    const res = await addApp({
      initPrompt: userPrompt.value.trim(),
    })

    if (res.data.code === 0 && res.data.data) {
      message.success('应用创建成功')
      // 跳转到对话页面，确保ID是字符串类型
      const appId = String(res.data.data)
      await router.push(`/app/chat/${appId}`)
    } else {
      message.error('创建失败：' + res.data.message)
    }
  } catch (error) {
    console.error('创建应用失败：', error)
    message.error('创建失败，请重试')
  } finally {
    creating.value = false
  }
}

// 加载我的应用
const loadMyApps = async () => {
  if (!loginUserStore.loginUser.id) {
    return
  }

  try {
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
  } catch (error) {
    console.error('加载我的应用失败：', error)
  }
}

// 加载精选应用
const loadFeaturedApps = async () => {
  try {
    const res = await listGoodAppVoByPage({
      pageNum: featuredAppsPage.current,
      pageSize: featuredAppsPage.pageSize,
      sortField: 'createTime',
      sortOrder: 'desc',
    })

    if (res.data.code === 0 && res.data.data) {
      featuredApps.value = res.data.data.records || []
      featuredAppsPage.total = res.data.data.totalRow || 0
    }
  } catch (error) {
    console.error('加载精选应用失败：', error)
  }
}

// 查看对话
const viewChat = (appId: string | number | undefined) => {
  if (appId) {
    router.push(`/app/chat/${appId}?view=1`)
  }
}

// 查看作品
const viewWork = (app: API.AppVO) => {
  console.log('aaa')
  console.log('查看作品：', app.deployKey)

  if (app.deployKey) {

    const url = getDeployUrl(app.deployKey)
    window.open(url, '_blank')
  }
}

// 格式化时间函数已移除，不再需要显示创建时间

// 页面加载时获取数据
onMounted(() => {
  loadMyApps()
  loadFeaturedApps()

  // 鼠标跟随光效
  const handleMouseMove = (e: MouseEvent) => {
    const { clientX, clientY } = e
    const { innerWidth, innerHeight } = window
    const x = (clientX / innerWidth) * 100
    const y = (clientY / innerHeight) * 100

    document.documentElement.style.setProperty('--mouse-x', `${x}%`)
    document.documentElement.style.setProperty('--mouse-y', `${y}%`)
  }

  document.addEventListener('mousemove', handleMouseMove)

  // 清理事件监听器
  return () => {
    document.removeEventListener('mousemove', handleMouseMove)
  }
})
</script>

<template>
  <div id="homePage">
    <!-- 英雄区域 -->
    <section class="hero-section">
      <div class="hero-background">
        <div class="hero-particles"></div>
      </div>
      <div class="container">
        <div class="hero-content">
          <div class="hero-badge">
            <span>面向创作者的数字周边生成</span>
          </div>
          <h1 class="hero-title">
            <span class="title-line">用文字描述</span>
            <span class="title-line highlight">得到可用素材</span>
          </h1>
          <p class="hero-description">
            描述主题与风格，Mango Gen 会生成可直接使用的数字素材（壁纸、头像横幅、贴纸等）。
            <br />
            支持多尺寸导出与透明背景，语气克制，专注创作本身。
          </p>

          <!-- 智能输入区域 -->
          <div class="smart-input-section">
            <div class="input-container">
        <a-textarea
          v-model:value="userPrompt"
                placeholder="例如：清爽蓝色系科幻壁纸｜玻璃拟态｜2K竖屏"
                :rows="3"
                :maxlength="500"
                class="smart-input"
                @keydown.enter.ctrl="createApp"
        />
        <div class="input-actions">
                <a-button
                  type="primary"
                  size="large"
                  @click="createApp"
                  :loading="creating"
                  class="generate-btn"
                >
            <template #icon>
                    <span class="btn-icon">✨</span>
            </template>
                  生成素材
          </a-button>
              </div>
            </div>
            <div class="input-tips">
              <span class="tip">💡 提示：按 Ctrl + Enter 快速生成</span>
            </div>
          </div>

          <!-- 特色标签 -->
          <div class="feature-tags">
            <div class="tag">🧩 多尺寸导出</div>
            <div class="tag">🪄 透明背景</div>
            <div class="tag">🎚️ 风格一致</div>
            <div class="tag">✏️ 轻量编辑</div>
          </div>
        </div>
      </div>
    </section>

    <!-- 模板展示区域 -->
    <section class="templates-section">
      <div class="container">
        <div class="section-header">
          <h2 class="section-title">常用数字素材</h2>
          <p class="section-subtitle">从模板开始，或直接输入你的想法</p>
      </div>

        <div class="templates-grid">
          <div
            v-for="template in templates"
            :key="template.id"
            class="template-card"
            @click="setPrompt(template.prompt)"
          >
            <div class="template-preview">
              <div class="template-icon">{{ template.icon }}</div>
            </div>
            <div class="template-info">
              <h3 class="template-title">{{ template.title }}</h3>
              <p class="template-desc">{{ template.description }}</p>
              <div class="template-tags">
                <span v-for="tag in template.tags" :key="tag" class="template-tag">{{ tag }}</span>
              </div>
            </div>
        </div>
        </div>
      </div>
    </section>

    <!-- 我的作品区域 -->


    <!-- 精选案例区域 -->
    <section class="featured-section">
      <div class="container">
        <div class="section-header">
          <h2 class="section-title">精选作品</h2>
          <p class="section-subtitle">探索社区中的优秀数字素材</p>
      </div>

        <div class="featured-grid">
          <AppCard
            v-for="app in featuredApps"
            :key="app.id"
            :app="app"
            :featured="true"
            @view-chat="viewChat"
            @view-work="viewWork"
          />
        </div>

        <div class="pagination-wrapper" v-if="featuredAppsPage.total > featuredAppsPage.pageSize">
          <a-pagination
            v-model:current="featuredAppsPage.current"
            v-model:page-size="featuredAppsPage.pageSize"
            :total="featuredAppsPage.total"
            :show-size-changer="false"
            :show-total="(total: number) => `共 ${total} 个案例`"
            @change="loadFeaturedApps"
          />
        </div>
      </div>
    </section>

    <!-- 底部CTA区域 -->
    <section class="cta-section">
      <div class="container">
        <div class="cta-card">
          <div class="cta-left">
            <h2 class="cta-title">开始创作</h2>
            <p class="cta-description">输入类型、主题与尺寸，立即生成可用素材</p>
          </div>
          <div class="cta-right">
            <a-button type="primary" size="large" class="cta-button" @click="scrollToInput">
              开始生成
            </a-button>
        </div>
      </div>
    </div>
    </section>
  </div>
</template>

<style scoped>
#homePage {
  width: 100%;
  margin: 0;
  padding: 0;
  min-height: 100vh;
  background: var(--bg-secondary);
  position: relative;
  overflow-x: hidden;
  padding-top: 0;
  /* 确保首页内容从最顶部开始，包括导航栏区域 */
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  position: relative;
  z-index: 2;
  width: 100%;
  box-sizing: border-box;
}

/* 英雄区域 */
.hero-section {
  position: relative;
  min-height: 100vh; /* 调整为完整视口高度，包括导航栏区域 */
  display: flex;
  align-items: center;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  overflow: hidden;
}

.hero-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1;
}

.hero-particles {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image:
    radial-gradient(circle at 20% 80%, rgba(102, 204, 255, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(102, 204, 255, 0.08) 0%, transparent 50%),
    radial-gradient(circle at 40% 40%, rgba(102, 204, 255, 0.06) 0%, transparent 50%);
  animation: float 20s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translate(0, 0) rotate(0deg); }
  33% { transform: translate(30px, -30px) rotate(120deg); }
  66% { transform: translate(-20px, 20px) rotate(240deg); }
}

.hero-content {
  position: relative;
  z-index: 2;
  text-align: center;
  max-width: 800px;
  margin: 0 auto;
  padding: 60px 0;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(102, 204, 255, 0.1);
  border: 1px solid rgba(102, 204, 255, 0.2);
  border-radius: 50px;
  padding: 8px 16px;
  font-size: 14px;
  color: var(--primary-color);
  margin-bottom: 24px;
  backdrop-filter: blur(10px);
}

.badge-icon {
  font-size: 16px;
}

.hero-title {
  font-size: 48px;
  font-weight: 700;
  margin: 0 0 20px;
  line-height: 1.2;
  letter-spacing: -1px;
}

.title-line {
  display: block;
  color: var(--text-primary);
}

.title-line.highlight {
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-dark) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-description {
  font-size: 18px;
  line-height: 1.6;
  color: var(--text-secondary);
  margin: 0 0 40px;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

/* 智能输入区域 */
.smart-input-section {
  margin-bottom: 40px;
}

.input-container {
  position: relative;
  max-width: 600px;
  margin: 0 auto;
}

.smart-input {
  width: 100%;
  border-radius: 16px;
  border: 2px solid var(--border-color);
  font-size: 16px;
  padding: 20px 120px 20px 20px;
  background: var(--bg-primary);
  box-shadow: var(--shadow-medium);
  transition: all 0.3s ease;
  resize: none;
}

.smart-input:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 4px rgba(102, 204, 255, 0.1);
  transform: translateY(-2px);
}

.input-actions {
  position: absolute;
  bottom: 12px;
  right: 12px;
}

.generate-btn {
  height: 44px;
  padding: 0 24px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-dark) 100%);
  border: none;
  box-shadow: 0 4px 16px rgba(102, 204, 255, 0.3);
  transition: all 0.3s ease;
}

.generate-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 204, 255, 0.4);
}

.btn-icon {
  margin-right: 8px;
  font-size: 18px;
}

.input-tips {
  text-align: center;
  margin-top: 12px;
}

.tip {
  font-size: 14px;
  color: var(--text-secondary);
  background: rgba(102, 204, 255, 0.1);
  padding: 6px 12px;
  border-radius: 20px;
  display: inline-block;
}

/* 特色标签 */
.feature-tags {
  display: flex;
  justify-content: center;
  gap: 16px;
  flex-wrap: wrap;
  margin-top: 40px;
}

.tag {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 25px;
  padding: 8px 16px;
  font-size: 14px;
  color: var(--text-secondary);
  transition: all 0.3s ease;
}

.tag:hover {
  background: var(--primary-color);
  color: white;
  transform: translateY(-2px);
  box-shadow: var(--shadow-light);
}

/* 模板展示区域 */
.templates-section {
  padding: 80px 0;
  background: var(--bg-primary);
}

.section-header {
  text-align: center;
  margin-bottom: 60px;
}

.section-title {
  font-size: 36px;
  font-weight: 700;
  margin: 0 0 16px;
  color: var(--text-primary);
}

.section-subtitle {
  font-size: 18px;
  color: var(--text-secondary);
  margin: 0;
}

.templates-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
}

.template-card {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 24px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.template-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, var(--primary-color), var(--primary-light));
  transform: scaleX(0);
  transition: transform 0.3s ease;
}

.template-card:hover::before {
  transform: scaleX(1);
}

.template-card:hover {
  transform: translateY(-8px);
  box-shadow: var(--shadow-medium);
  border-color: var(--primary-color);
}

.template-preview {
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, rgba(102, 204, 255, 0.1), rgba(102, 204, 255, 0.05));
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}

.template-icon {
  font-size: 28px;
}

.template-title {
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 8px;
  color: var(--text-primary);
}

.template-desc {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0 0 16px;
  line-height: 1.5;
}

.template-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.template-tag {
  background: rgba(102, 204, 255, 0.1);
  color: var(--primary-color);
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
}

/* 我的作品区域 */
.my-works-section {
  padding: 80px 0;
  background: var(--bg-secondary);
}

.works-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
  margin-bottom: 40px;
}

/* 精选案例区域 */
.featured-section {
  padding: 80px 0;
  background: var(--bg-primary);
}

.featured-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
  margin-bottom: 40px;
}

/* 分页 */
.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 40px;
}

/* CTA区域 */
.cta-section {
  padding: 60px 0;
  background: transparent;
}

.cta-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 20px 24px;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-light);
}

.cta-left {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.cta-title {
  font-size: 20px;
  font-weight: 700;
  margin: 0;
}

.cta-description {
  font-size: 14px;
  margin: 0;
  color: var(--text-secondary);
}

.cta-button {
  height: 40px;
  padding: 0 20px;
  font-size: 14px;
  font-weight: 600;
  border-radius: 8px;
}

.cta-right { display: flex; align-items: center; }

/* 响应式设计 */
@media (max-width: 768px) {
  .container {
    padding: 0 16px;
  }

  .hero-content {
    padding: 40px 0;
  }

  .hero-title {
    font-size: 32px;
  }

  .hero-description {
    font-size: 16px;
  }

  .smart-input {
    padding: 16px 100px 16px 16px;
    font-size: 14px;
  }

  .generate-btn {
    height: 36px;
    padding: 0 16px;
    font-size: 14px;
  }

  .section-title {
    font-size: 28px;
  }

  .section-subtitle {
    font-size: 16px;
  }

  .templates-grid,
  .works-grid,
  .featured-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .template-card {
    padding: 20px;
  }

  .feature-tags {
    gap: 12px;
  }

  .tag {
    font-size: 12px;
    padding: 6px 12px;
  }

  .cta-title {
    font-size: 18px;
  }

  .cta-description {
    font-size: 13px;
  }

  .cta-card { flex-direction: column; align-items: flex-start; }
}

@media (max-width: 480px) {
  .hero-title {
    font-size: 24px;
  }

  .hero-description {
    font-size: 14px;
  }

  .smart-input {
    padding: 12px 80px 12px 12px;
    font-size: 14px;
  }

  .generate-btn {
    height: 32px;
    padding: 0 12px;
    font-size: 12px;
  }

  .section-title {
    font-size: 24px;
  }

  .templates-section,
  .my-works-section,
  .featured-section,
  .cta-section {
    padding: 60px 0;
  }
}
</style>
