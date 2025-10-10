<template>
  <a-layout-header class="header">
    <a-row :wrap="false">
      <!-- 左侧：Logo和标题 -->
      <a-col flex="200px">
        <RouterLink to="/">
          <div class="header-left">
            <img class="logo" src="@/assets/logo.svg" alt="Logo" />
            <h1 class="site-title">Mango Gen</h1>
          </div>
        </RouterLink>
      </a-col>
      <!-- 中间：导航菜单 -->
      <a-col flex="auto">
        <a-menu
          v-model:selectedKeys="selectedKeys"
          mode="horizontal"
          :items="menuItems"
          @click="handleMenuClick"
        />
      </a-col>
      <!-- 右侧：用户操作区域 -->
      <a-col>
        <div class="user-login-status">
          <div v-if="loginUserStore.loginUser.id">
            <a-dropdown>
              <a-space>
                <a-avatar :src="loginUserStore.loginUser.userAvatar" />
                {{ loginUserStore.loginUser.userName ?? '无名' }}
              </a-space>
              <template #overlay>
                <a-menu>
                  <a-menu-item @click="doLogout">
                    <LogoutOutlined />
                    退出登录
                  </a-menu-item>
                </a-menu>
              </template>
            </a-dropdown>
          </div>
          <div v-else>
            <a-button type="primary" href="/user/login">登录</a-button>
          </div>
        </div>
      </a-col>
    </a-row>
  </a-layout-header>
</template>

<script setup lang="ts">
import { computed, h, ref } from 'vue'
import { useRouter } from 'vue-router'
import { type MenuProps, message } from 'ant-design-vue'
import { useLoginUserStore } from '@/stores/loginUser.ts'
import { userLogout } from '@/api/userController.ts'
import { LogoutOutlined, HomeOutlined } from '@ant-design/icons-vue'

const loginUserStore = useLoginUserStore()
const router = useRouter()
// 当前选中菜单
const selectedKeys = ref<string[]>(['/'])
// 监听路由变化，更新当前选中菜单
router.afterEach((to, from, next) => {
  selectedKeys.value = [to.path]
})

// 菜单配置项
const originItems = [
  {
    key: '/',
    icon: () => h(HomeOutlined),
    label: '主页',
    title: '主页',
  },
  {
    key: '/materials',
    label: '我的素材',
    title: '我的素材',
  },
  {
    key: '/admin/userManage',
    label: '用户管理',
    title: '用户管理',
  },
  {
    key: '/admin/appManage',
    label: '应用管理',
    title: '应用管理',
  },
  {
    key: 'others',
    label: h('a', { href: 'https://space.bilibili.com/521182571', target: '_blank' }, 'Mango Gen'),
    title: 'Mango Gen',
  },
]

// 过滤菜单项
const filterMenus = (menus = [] as MenuProps['items']) => {
  return menus?.filter((menu) => {
    const menuKey = menu?.key as string
    if (menuKey?.startsWith('/admin')) {
      const loginUser = loginUserStore.loginUser
      if (!loginUser || loginUser.userRole !== 'admin') {
        return false
      }
    }
    return true
  })
}

// 展示在菜单的路由数组
const menuItems = computed<MenuProps['items']>(() => filterMenus(originItems))

// 处理菜单点击
const handleMenuClick: MenuProps['onClick'] = (e) => {
  const key = e.key as string
  selectedKeys.value = [key]
  // 跳转到我的素材单独页面
  if (key === '/materials') {
    router.push('/materials')
    return
  }
  // 跳转到对应页面
  if (key.startsWith('/')) {
    router.push(key)
  }
}

// 退出登录
const doLogout = async () => {
  const res = await userLogout()
  if (res.data.code === 0) {
    loginUserStore.setLoginUser({
      userName: '未登录',
    })
    message.success('退出登录成功')
    await router.push('/user/login')
  } else {
    message.error('退出登录失败，' + res.data.message)
  }
}
</script>

<style scoped>
.header {
  background: transparent;
  padding: 0 16px;
  box-shadow: none;
  border-bottom: none;
  height: 56px;
  line-height: 56px;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 10;
  /* 添加一个轻微的背景色，提高文字可读性 */
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.logo {
  height: 32px;
  width: 32px;
}

.site-title {
  margin: 0;
  font-size: 16px;
  color: var(--primary-color);
  font-weight: 600;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.ant-menu-horizontal {
  border-bottom: none !important;
  line-height: 56px;
  background: transparent;
}

.ant-menu-horizontal .ant-menu-item {
  height: 56px;
  line-height: 56px;
  padding: 0 12px;
  font-size: 14px;
  color: var(--text-primary);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  position: relative;
  transition: all 0.3s ease;
  margin: 0 2px;
  border-radius: 6px 6px 0 0;
}

.ant-menu-horizontal .ant-menu-item-selected,
.ant-menu-horizontal .ant-menu-item:hover {
  color: var(--primary-color);
  background: rgba(255, 255, 255, 0.2);
  border-radius: 6px 6px 0 0;
}

/* 美化选中状态 */
.ant-menu-horizontal .ant-menu-item-selected::before {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, var(--primary-color), var(--primary-light));
  border-radius: 6px 6px 0 0;
  transform: scaleX(1);
  transition: transform 0.3s ease;
}

.ant-menu-horizontal .ant-menu-item:not(.ant-menu-item-selected):hover::before {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, var(--primary-color), var(--primary-light));
  border-radius: 6px 6px 0 0;
  transform: scaleX(0.5);
  transition: transform 0.3s ease;
}

/* 添加底部发光效果 */
.ant-menu-horizontal .ant-menu-item-selected::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 10%;
  right: 10%;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--primary-color), transparent);
  filter: blur(2px);
  opacity: 0.7;
}

/* 添加选中项的光晕效果 */
.ant-menu-horizontal .ant-menu-item-selected {
  box-shadow: 0 2px 8px rgba(102, 204, 255, 0.2);
}

.user-login-status {
  display: flex;
  align-items: center;
  height: 56px;
  color: var(--text-primary);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.user-login-status .ant-btn {
  height: 32px;
  padding: 0 16px;
  font-size: 13px;
  border-radius: var(--border-radius);
}

.user-login-status .ant-avatar {
  margin-right: 8px;
}
</style>