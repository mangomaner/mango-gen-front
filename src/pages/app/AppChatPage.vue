<template>
  <div id="appChatPage">
    <!-- 现代化顶部栏 -->
    <div class="modern-header">
      <div class="header-content">
      <div class="header-left">
          <div class="app-info">
            <div class="app-details">
              <div class="app-header-row">
                <h1 class="app-name">{{ appInfo?.appName || 'Mango Gen 应用' }}</h1>
                <a-tag v-if="appInfo?.codeGenType" class="type-tag">
                  {{ formatCodeGenType(appInfo.codeGenType) }}
                </a-tag>
                <span v-if="isGenerating" class="status-indicator generating">
                  生成中...
                </span>
              </div>
            </div>
          </div>
      </div>
      <div class="header-right">
          <div class="action-buttons">
            <a-button type="text" @click="showAppDetail" class="action-btn">
          <template #icon>
            <InfoCircleOutlined />
          </template>
              详情
        </a-button>
        <a-button
                type="text"
            @click="downloadCode"
            :loading="downloading"
            :disabled="!isOwner"
                class="action-btn"
        >
          <template #icon>
            <DownloadOutlined />
          </template>
              下载
        </a-button>
            <a-button
                type="primary"
                @click="deployApp"
                :loading="deploying"
                class="deploy-btn"
            >
          <template #icon>
            <CloudUploadOutlined />
          </template>
              部署应用
        </a-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="main-content">
      <!-- 左侧预览区域（交换到左侧） -->
      <div class="preview-section">
        <div class="preview-header modern-preview-header">
          <!-- 左：标题与状态 -->
          <div class="preview-left">
            <div class="preview-title">
              <span class="preview-title-text">预览页</span>
              <div class="preview-status" :class="{ 'generating': isGenerating }">
                <span class="status-indicator-dot"></span>
                {{ isGenerating ? '生成中...' : '已就绪' }}
              </div>
              <span v-if="previewBlinking" class="preview-blinking-indicator"></span>
            </div>
          </div>

          <!-- 中：缩放控件（居中） -->
          <div class="preview-center">
            <div class="zoom-controls">
              <a-button size="small" type="text" @click="zoomOut" class="modern-btn zoom-btn" :hoverable="false">-</a-button>
              <input
                type="text"
                class="scale-box modern-scale-box scale-input"
                :value="Math.round(previewScale * 100) + '%'"
                @blur="handleScaleInputChange"
                @keydown.enter="handleScaleInputChange"
              />
              <a-button size="small" type="text" @click="zoomIn" class="modern-btn zoom-btn" :hoverable="false">+</a-button>
            </div>
          </div>

          <!-- 右：操作按钮 -->
          <div class="preview-right modern-actions">
            <a-button size="small" type="text" @click="refreshPreview" title="刷新预览" class="modern-btn" :hoverable="false">
              <template #icon>
                <i class="anticon anticon-sync"></i>
              </template>
              刷新
            </a-button>
            <a-button
                v-if="isOwner && previewUrl"
                type="text"
                :class="['modern-btn', { 'edit-mode-active': isEditMode }]"
                @click="toggleEditMode"
                :hoverable="false"
            >
              <template #icon>
                <EditOutlined />
              </template>
              {{ isEditMode ? '退出编辑' : '编辑模式' }}
            </a-button>
            <a-button v-if="previewUrl" type="text" @click="openInNewTab" class="modern-btn" :hoverable="false">
              <template #icon>
                <ExportOutlined />
              </template>
              新窗口打开
            </a-button>
          </div>
        </div>
        <div class="preview-content">
          <!-- 始终保持一致的预览框显示，不根据生成状态变化 -->
          <div v-if="!previewUrl" class="preview-placeholder">
            <div class="placeholder-content">
              <div class="placeholder-icon">🚀</div>
              <h3>准备生成你的数字素材</h3>
              <p>描述类型与尺寸，AI 会生成可直接使用的素材与导出建议</p>
            </div>
          </div>
          <div v-else class="preview-frame-container">
            <iframe
                :src="previewUrl"
                class="preview-iframe"
                frameborder="0"
                @load="onIframeLoad"
            ></iframe>
          </div>
        </div>
      </div>

      <!-- 右侧对话区域（交换到右侧） -->
      <div class="chat-section">
        <!-- 消息区域 -->
        <div class="messages-container" ref="messagesContainer">
          <!-- 加载更多按钮 -->
          <div v-if="hasMoreHistory" class="load-more-container">
            <a-button type="link" @click="loadMoreHistory" :loading="loadingHistory" size="small" class="load-more-btn">
              <template #icon>
                <span>↻</span>
              </template>
              加载更多历史消息
            </a-button>
          </div>

          <!-- 消息列表 -->
          <div v-for="(message, index) in messages" :key="index" class="message-item" :class="message.type">
            <div v-if="message.type === 'user'" class="user-message">
              <div class="message-wrapper">
                <div class="message-content">
                  <div class="message-text">{{ message.content }}</div>
                  <div class="message-time" v-if="message.createTime">
                    {{ formatTime(message.createTime) }}
                  </div>
                </div>
              <div class="message-avatar">
                  <a-avatar :src="loginUserStore.loginUser.userAvatar" size="small">
                    {{ loginUserStore.loginUser.userName?.charAt(0) || 'U' }}
                  </a-avatar>
                </div>
              </div>
            </div>
            <div v-else class="ai-message">
              <div class="message-wrapper">
              <div class="message-avatar">
                  <a-avatar :src="aiAvatar" size="small">
                    <span>🤖</span>
                  </a-avatar>
              </div>
              <div class="message-content">
                  <div class="message-text">
                <!-- 带有工具调用的消息，支持多个function_call标签 -->
                <template v-if="message.content && containsFunctionCall(message.content)">
                  <template v-for="(part, partIndex) in getFunctionCallParts(message.content)" :key="partIndex">
                    <MarkdownRenderer v-if="part.type === 'text'" :content="part.content" />
                    <div v-else-if="part.type === 'functionCall'" class="tool-call-collapsible">
                      <div class="tool-call-header" @click="toggleFunctionCall(index, partIndex)">
                        <div class="tool-call-icon">⚙️</div>
                        <div class="tool-call-info">
<!--                          <span class="tool-call-title">工具调用</span>-->
                          <span class="tool-call-summary">{{ getToolCallSummary(part.content) }}</span>
                        </div>
                        <div class="tool-call-toggle-icon" :class="{ 'expanded': isFunctionCallExpanded(index, partIndex) }">
                          {{ isFunctionCallExpanded(index, partIndex) ? '▲' : '▼' }}
                        </div>
                      </div>
                      <div class="tool-call-content" :class="{ 'expanded': isFunctionCallExpanded(index, partIndex) }">
                        <div class="tool-call-code">
                          <MarkdownRenderer :content="part.content" />
                        </div>
                      </div>
                    </div>
                  </template>
                </template>
                <MarkdownRenderer v-else-if="message.content" :content="message.content" />
                <div v-if="message.loading" class="loading-indicator">
                      <div class="typing-dots">
                        <span></span>
                        <span></span>
                        <span></span>
                </div>
                      <span class="loading-text">天钿 正在思考...</span>
                    </div>
                  </div>
                  <div class="message-time" v-if="message.createTime">
                    {{ formatTime(message.createTime) }}
                    <a-button
                      v-if="message.type === 'ai' && !message.loading"
                      type="primary"
                      size="small"
                      @click="handleRollback(index)"
                      :loading="rollingBack.value"
                      class="rollback-btn"
                    >
                      <template #icon>
                        <RollbackOutlined />
                      </template>
                      回滚到此处
                    </a-button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 选中元素信息展示 -->
        <a-alert
            v-if="selectedElementInfo"
            class="selected-element-alert"
            type="info"
            closable
            @close="clearSelectedElement"
        >
          <template #message>
            <div class="selected-element-info">
              <div class="element-header">
                <span class="element-tag">
                  选中元素：{{ selectedElementInfo.tagName.toLowerCase() }}
                </span>
                <span v-if="selectedElementInfo.id" class="element-id">
                  #{{ selectedElementInfo.id }}
                </span>
                <span v-if="selectedElementInfo.className" class="element-class">
                  .{{ selectedElementInfo.className.split(' ').join('.') }}
                </span>
              </div>
              <div class="element-details">
                <div v-if="selectedElementInfo.textContent" class="element-item">
                  内容: {{ selectedElementInfo.textContent.substring(0, 50) }}
                  {{ selectedElementInfo.textContent.length > 50 ? '...' : '' }}
                </div>
                <div v-if="selectedElementInfo.pagePath" class="element-item">
                  页面路径: {{ selectedElementInfo.pagePath }}
                </div>
                <div class="element-item">
                  选择器:
                  <code class="element-selector-code">{{ selectedElementInfo.selector }}</code>
                </div>
              </div>
            </div>
          </template>
        </a-alert>

        <!-- 智能输入区域 -->
        <div class="input-container">
          <div class="input-wrapper">
            <a-tooltip v-if="!isOwner" title="无法在别人的作品下对话哦~" placement="top">
              <div class="input-field">
              <a-textarea
                  v-model:value="userInput"
                  :placeholder="getInputPlaceholder()"
                    :rows="3"
                  :maxlength="1000"
                  @keydown.enter.prevent="sendMessage"
                  :disabled="isGenerating || !isOwner"
                    class="message-input"
                />
                <div class="input-actions">
                  <a-button
                      type="primary"
                      @click="sendMessage"
                      :loading="isGenerating"
                      :disabled="!isOwner || !userInput.trim()"
                      class="send-btn"
                  >
                    <template #icon>
                      <SendOutlined />
                    </template>
                  </a-button>
                </div>
              </div>
            </a-tooltip>
            <div v-else class="input-field">
            <a-textarea
                v-model:value="userInput"
                :placeholder="getInputPlaceholder()"
                  :rows="3"
                :maxlength="1000"
                @keydown.enter.prevent="sendMessage"
                :disabled="isGenerating"
                  class="message-input"
            />
            <div class="input-actions">
              <a-button
                  type="primary"
                  @click="sendMessage"
                  :loading="isGenerating"
                    :disabled="!userInput.trim()"
                    class="send-btn"
              >
                <template #icon>
                  <SendOutlined />
                </template>
              </a-button>
            </div>
          </div>
            <div class="input-footer">
              <span class="char-count">{{ userInput.length }}/1000</span>
        </div>
      </div>
        </div>
      </div>
    </div>

    <!-- 应用详情弹窗 -->
    <AppDetailModal
        v-model:open="appDetailVisible"
        :app="appInfo"
        :show-actions="isOwner || isAdmin"
        @edit="editApp"
        @delete="deleteApp"
    />

    <!-- 部署成功弹窗 -->
    <DeploySuccessModal
        v-model:open="deployModalVisible"
        :deploy-url="deployUrl"
        @open-site="openDeployedSite"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, onUnmounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message, Modal } from 'ant-design-vue'
import { useLoginUserStore } from '@/stores/loginUser'
import {
  getAppVoById,
  deployApp as deployAppApi,
  deleteApp as deleteAppApi,
} from '@/api/appController'
import { listAppChatHistory } from '@/api/chatHistoryController'
import { CodeGenTypeEnum, formatCodeGenType } from '@/utils/codeGenTypes'
import request from '@/request'

import MarkdownRenderer from '@/components/MarkdownRenderer.vue'
import AppDetailModal from '@/components/AppDetailModal.vue'
import DeploySuccessModal from '@/components/DeploySuccessModal.vue'
import aiAvatar from '@/assets/aiAvatar.png'
import { API_BASE_URL, getStaticPreviewUrl } from '@/config/env'
import { VisualEditor, type ElementInfo } from '@/utils/visualEditor'

import { CloudUploadOutlined, SendOutlined, ExportOutlined, InfoCircleOutlined, DownloadOutlined, EditOutlined, RollbackOutlined } from '@ant-design/icons-vue'
import { rollbackToHistoryVersion } from '@/api/fileHistoryController.ts'

const route = useRoute()
const router = useRouter()
const loginUserStore = useLoginUserStore()

// 应用信息
const appInfo = ref<API.AppVO>()
const appId = ref<any>()

// 对话相关
interface Message {
  type: 'user' | 'ai'
  id: string
  content: string
  loading?: boolean
  createTime?: string
}

const messages = ref<Message[]>([])
const userInput = ref('')
const isGenerating = ref(false)
const messagesContainer = ref<HTMLElement>()

// 对话历史相关
const loadingHistory = ref(false)
const hasMoreHistory = ref(false)
const lastCreateTime = ref<string>()
const historyLoaded = ref(false)
const rollingBack = ref(false)

// 预览相关
const previewUrl = ref('')
const previewReady = ref(false)
const previewScale = ref(1)
const previewBlinking = ref(false)

// 刷新预览
const refreshPreview = () => {
  if (previewUrl.value) {
    // 添加时间戳以确保刷新
    const timestamp = new Date().getTime()
    const urlObj = new URL(previewUrl.value, window.location.origin)
    urlObj.searchParams.set('t', timestamp.toString())
    previewUrl.value = urlObj.toString()
    previewReady.value = false
  }
}

// 部署相关
const deploying = ref(false)
const deployModalVisible = ref(false)
const deployUrl = ref('')

// 下载相关
const downloading = ref(false)

// 可视化编辑相关
const isEditMode = ref(false)
const selectedElementInfo = ref<ElementInfo | null>(null)
const visualEditor = new VisualEditor({
  onElementSelected: (elementInfo: ElementInfo) => {
    selectedElementInfo.value = elementInfo
  },
})

// 权限相关
const isOwner = computed(() => {
  return appInfo.value?.userId === loginUserStore.loginUser.id
})

const isAdmin = computed(() => {
  return loginUserStore.loginUser.userRole === 'admin'
})

// 应用详情相关
const appDetailVisible = ref(false)

// 显示应用详情
const showAppDetail = () => {
  appDetailVisible.value = true
}

// 加载对话历史
const loadChatHistory = async (isLoadMore = false) => {
  if (!appId.value || loadingHistory.value) return
  loadingHistory.value = true
  try {
    const params: API.listAppChatHistoryParams = {
      appId: appId.value,
      pageSize: 10,
    }
    // 如果是加载更多，传递最后一条消息的创建时间作为游标
    if (isLoadMore && lastCreateTime.value) {
      params.lastCreateTime = lastCreateTime.value
    }
    const res = await listAppChatHistory(params)
    if (res.data.code === 0 && res.data.data) {
      const chatHistories = res.data.data.records || []
      if (chatHistories.length > 0) {
        // 将对话历史转换为消息格式，并按时间正序排列（老消息在前）
        const historyMessages: Message[] = chatHistories
            .map((chat) => ({
              type: (chat.messageType === 'user' ? 'user' : 'ai') as 'user' | 'ai',
              id: chat.id,
              content: chat.message || '',
              createTime: chat.createTime,
            }))
            .reverse() // 反转数组，让老消息在前
        if (isLoadMore) {
          // 加载更多时，将历史消息添加到开头
          messages.value.unshift(...historyMessages)
        } else {
          // 初始加载，直接设置消息列表
          messages.value = historyMessages
        }
        // 更新游标
        lastCreateTime.value = chatHistories[chatHistories.length - 1]?.createTime
        // 检查是否还有更多历史
        hasMoreHistory.value = chatHistories.length === 10
      } else {
        hasMoreHistory.value = false
      }
      historyLoaded.value = true
    }
  } catch (error) {
    console.error('加载对话历史失败：', error)
    message.error('加载对话历史失败')
  } finally {
    loadingHistory.value = false
  }
}

// 加载更多历史消息
const loadMoreHistory = async () => {
  await loadChatHistory(true)
}

// 获取应用信息
const fetchAppInfo = async () => {
  const id = route.params.id as string
  if (!id) {
    message.error('应用ID不存在')
    router.push('/')
    return
  }

  appId.value = id

  try {
    const res = await getAppVoById({ id: id as unknown as number })
    if (res.data.code === 0 && res.data.data) {
      appInfo.value = res.data.data

      // 先加载对话历史
      await loadChatHistory()
      // 如果有至少2条对话记录，展示对应的网站
      if (messages.value.length >= 2) {
        updatePreview()
      }
      // 检查是否需要自动发送初始提示词
      // 只有在是自己的应用且没有对话历史时才自动发送
      if (
          appInfo.value.initPrompt &&
          isOwner.value &&
          messages.value.length === 0 &&
          historyLoaded.value
      ) {
        await sendInitialMessage(appInfo.value.initPrompt)
      }
    } else {
      message.error('获取应用信息失败')
      router.push('/')
    }
  } catch (error) {
    console.error('获取应用信息失败：', error)
    message.error('获取应用信息失败')
    router.push('/')
  }
}

// 发送初始消息
const sendInitialMessage = async (prompt: string) => {
  // 添加用户消息
  messages.value.push({
    type: 'user',
    content: prompt,
  })

  // 添加AI消息占位符
  const aiMessageIndex = messages.value.length
  messages.value.push({
    type: 'ai',
    content: '',
    loading: true,
  })

  await nextTick()
  scrollToBottom()

  // 开始生成
          isGenerating.value = true
          previewBlinking.value = true
          await generateCode(prompt, aiMessageIndex)
}

// 发送消息
const sendMessage = async () => {
  if (!userInput.value.trim() || isGenerating.value) {
    return
  }

  let message = userInput.value.trim()
  // 如果有选中的元素，将元素信息添加到提示词中
  if (selectedElementInfo.value) {
    let elementContext = `\n\n选中元素信息：`
    if (selectedElementInfo.value.pagePath) {
      elementContext += `\n- 页面路径: ${selectedElementInfo.value.pagePath}`
    }
    elementContext += `\n- 标签: ${selectedElementInfo.value.tagName.toLowerCase()}\n- 选择器: ${selectedElementInfo.value.selector}`
    if (selectedElementInfo.value.textContent) {
      elementContext += `\n- 当前内容: ${selectedElementInfo.value.textContent.substring(0, 100)}`
    }
    message += "\n" + elementContext
  }
  userInput.value = ''
  // 添加用户消息（包含元素信息）
  messages.value.push({
    type: 'user',
    id: '',
    content: message,
  })

  // 发送消息后，清除选中元素并退出编辑模式
  if (selectedElementInfo.value) {
    clearSelectedElement()
    if (isEditMode.value) {
      toggleEditMode()
    }
  }

  // 添加AI消息占位符
  const aiMessageIndex = messages.value.length
  messages.value.push({
    type: 'ai',
    id: '',
    content: '',
    loading: true,
  })

  await nextTick()
  scrollToBottom()

  // 开始生成
          isGenerating.value = true
          previewBlinking.value = true
          await generateCode(message, aiMessageIndex)
}

// 生成代码 - 使用 EventSource 处理流式响应
const generateCode = async (userMessage: string, aiMessageIndex: number) => {
  let eventSource: EventSource | null = null
  let streamCompleted = false

  try {
    // 获取 axios 配置的 baseURL
    const baseURL = request.defaults.baseURL || API_BASE_URL

    // 构建URL参数
    const params = new URLSearchParams({
      appId: appId.value || '',
      message: userMessage,
    })

    const url = `${baseURL}/app/chat/gen/code?${params}`

    // 创建 EventSource 连接
    eventSource = new EventSource(url, {
      withCredentials: true,
    })

    let fullContent = ''

    // 处理接收到的消息
    eventSource.onmessage = function (event) {
      if (streamCompleted) return

      try {
        // 解析JSON包装的数据
        const parsed = JSON.parse(event.data)
        const content = parsed.d

        // 拼接内容
        if (content !== undefined && content !== null) {
          fullContent += content
          messages.value[aiMessageIndex].content = fullContent
          messages.value[aiMessageIndex].loading = false
          scrollToBottom()
        }
      } catch (error) {
        console.error('解析消息失败:', error)
        handleError(error, aiMessageIndex)
      }
    }

    // 处理done事件
    eventSource.addEventListener('done', function () {
      if (streamCompleted) return
      // 延迟更新预览，确保后端已完成处理
      setTimeout(async () => {
        // await fetchAppInfo()
        updatePreview()
        // 在生成完代码后调用刷新预览逻辑
        refreshPreview()
      }, 0)
      streamCompleted = true
      isGenerating.value = false
      previewBlinking.value = false
      eventSource?.close()


    })

    // 处理business-error事件（后端限流等错误）
    eventSource.addEventListener('business-error', function (event: MessageEvent) {
      if (streamCompleted) return

      try {
        const errorData = JSON.parse(event.data)
        console.error('SSE业务错误事件:', errorData)

        // 显示具体的错误信息
        const errorMessage = errorData.message || '生成过程中出现错误'
        messages.value[aiMessageIndex].content = `❌ ${errorMessage}`
        messages.value[aiMessageIndex].loading = false
        message.error(errorMessage)

        streamCompleted = true
        isGenerating.value = false
        eventSource?.close()
      } catch (parseError) {
        console.error('解析错误事件失败:', parseError, '原始数据:', event.data)
        handleError(new Error('服务器返回错误'), aiMessageIndex)
      }
    })

    // 处理错误
    eventSource.onerror = function () {
      if (streamCompleted || !isGenerating.value) return
      // 检查是否是正常的连接关闭
      if (eventSource?.readyState === EventSource.CONNECTING) {
        streamCompleted = true
        isGenerating.value = false
        eventSource?.close()

        setTimeout(async () => {
          await fetchAppInfo()
          updatePreview()
        }, 1000)
      } else {
        handleError(new Error('SSE连接错误'), aiMessageIndex)
      }
    }
  } catch (error) {
    console.error('创建 EventSource 失败：', error)
    handleError(error, aiMessageIndex)
  }
}

// 错误处理函数
const handleError = (error: unknown, aiMessageIndex: number) => {
  console.error('生成代码失败：', error)
  messages.value[aiMessageIndex].content = '抱歉，生成过程中出现了错误，请重试。'
  messages.value[aiMessageIndex].loading = false
  message.error('生成失败，请重试')
  isGenerating.value = false
}

// 更新预览
const updatePreview = () => {
  if (appId.value) {
    const codeGenType = appInfo.value?.codeGenType || CodeGenTypeEnum.HTML
    const newPreviewUrl = getStaticPreviewUrl(codeGenType, appId.value)
    previewUrl.value = newPreviewUrl
    previewReady.value = true
  }
}

// 滚动到底部
const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

// 下载代码
const downloadCode = async () => {
  if (!appId.value) {
    message.error('应用ID不存在')
    return
  }
  downloading.value = true
  try {
    const API_BASE_URL = request.defaults.baseURL || ''
    const url = `${API_BASE_URL}/app/download/${appId.value}`
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
    })
    if (!response.ok) {
      throw new Error(`下载失败: ${response.status}`)
    }
    // 获取文件名
    const contentDisposition = response.headers.get('Content-Disposition')
    const fileName = contentDisposition?.match(/filename="(.+)"/)?.[1] || `app-${appId.value}.zip`
    // 下载文件
    const blob = await response.blob()
    const downloadUrl = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = fileName
    link.click()
    // 清理
    URL.revokeObjectURL(downloadUrl)
    message.success('代码下载成功')
  } catch (error) {
    console.error('下载失败：', error)
    message.error('下载失败，请重试')
  } finally {
    downloading.value = false
  }
}

// 部署应用
const deployApp = async () => {
  if (!appId.value) {
    message.error('应用ID不存在')
    return
  }

  deploying.value = true
  try {
    const res = await deployAppApi({
      appId: appId.value as unknown as number,
    })

    if (res.data.code === 0 && res.data.data) {
      deployUrl.value = res.data.data
      deployModalVisible.value = true
      message.success('部署成功')
    } else {
      message.error('部署失败：' + res.data.message)
    }
  } catch (error) {
    console.error('部署失败：', error)
    message.error('部署失败，请重试')
  } finally {
    deploying.value = false
  }
}

// 在新窗口打开预览
const openInNewTab = () => {
  if (previewUrl.value) {
    window.open(previewUrl.value, '_blank')
  }
}

// 打开部署的网站
const openDeployedSite = () => {
  if (deployUrl.value) {
    window.open(deployUrl.value, '_blank')
  }
}

// iframe加载完成
const onIframeLoad = () => {
  previewReady.value = true
  const iframe = document.querySelector('.preview-iframe') as HTMLIFrameElement
  if (iframe) {
    visualEditor.init(iframe)
    visualEditor.onIframeLoad()
  }
  // 初次加载时应用缩放
  applyIframeScale()
}

// 编辑应用
const editApp = () => {
  if (appInfo.value?.id) {
    router.push(`/app/edit/${appInfo.value.id}`)
  }
}

// 删除应用
const deleteApp = async () => {
  if (!appInfo.value?.id) return

  try {
    const res = await deleteAppApi({ id: appInfo.value.id })
    if (res.data.code === 0) {
      message.success('删除成功')
      appDetailVisible.value = false
      router.push('/')
    } else {
      message.error('删除失败：' + res.data.message)
    }
  } catch (error) {
    console.error('删除失败：', error)
    message.error('删除失败')
  }
}

// 可视化编辑相关函数
const toggleEditMode = () => {
  // 检查 iframe 是否已经加载
  const iframe = document.querySelector('.preview-iframe') as HTMLIFrameElement
  if (!iframe) {
    message.warning('请等待页面加载完成')
    return
  }
  // 确保 visualEditor 已初始化
  if (!previewReady.value) {
    message.warning('请等待页面加载完成')
    return
  }
  const newEditMode = visualEditor.toggleEditMode()
  isEditMode.value = newEditMode
}

const clearSelectedElement = () => {
  selectedElementInfo.value = null
  visualEditor.clearSelection()
}

const getInputPlaceholder = () => {
  if (selectedElementInfo.value) {
    return `正在编辑 ${selectedElementInfo.value.tagName.toLowerCase()} 元素，请描述需要的构图/配色/留白/导出尺寸...`
  }
  return '请输入你的数字素材需求（类型/主题/风格/尺寸/留白等）'
}

// 预览缩放（缩放的是 iframe 内部内容，而非预览容器）
const applyIframeScale = () => {
  const iframe = document.querySelector('.preview-iframe') as HTMLIFrameElement
  if (!iframe || !iframe.contentDocument) return
  const doc = iframe.contentDocument
  const root = doc.documentElement as HTMLElement
  const body = doc.body as HTMLElement
  const scale = previewScale.value
  ;[root, body].forEach((el) => {
    if (!el) return
    el.style.transform = `scale(${scale})`
    el.style.transformOrigin = '0 0'
    el.style.width = scale < 1 ? `${(100 / scale).toFixed(2)}%` : '100%'
    el.style.height = 'auto'
  })
}

const setPreviewScale = (scale: number) => {
  const clamped = Math.max(0.5, Math.min(2, scale))
  previewScale.value = Number(clamped.toFixed(2))
}

// 处理手动输入的缩放值
const handleScaleInputChange = (e: Event) => {
  const input = e.target as HTMLInputElement
  // 提取数字部分并转换为数字
  const numValue = parseFloat(input.value.replace(/[^0-9.]/g, ''))
  if (!isNaN(numValue)) {
    setPreviewScale(numValue / 100)
  }
  // 重新设置显示值，确保格式正确
  input.value = Math.round(previewScale.value * 100) + '%'
}
const zoomIn = () => setPreviewScale(previewScale.value + 0.1)
const zoomOut = () => setPreviewScale(previewScale.value - 0.1)
const resetZoom = () => setPreviewScale(1)

watch(previewScale, () => {
  applyIframeScale()
})

// 格式化时间
const formatTime = (timeString: string) => {
  const date = new Date(timeString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  if (diff < 60000) { // 1分钟内
    return '刚刚'
  } else if (diff < 3600000) { // 1小时内
    return `${Math.floor(diff / 60000)}分钟前`
  } else if (diff < 86400000) { // 24小时内
    return `${Math.floor(diff / 3600000)}小时前`
  } else {
    return date.toLocaleDateString()
  }
}

// 工具调用折叠逻辑
const FUNCTION_CALL_REGEX = /<function_call>([\s\S]*?)<\/function_call>/gi

const containsFunctionCall = (content: string) => {
  return FUNCTION_CALL_REGEX.test(content)
}

// 用于存储每个消息中各个functionCall的展开状态
const expandedFunctionCalls = ref<Map<number, Set<number>>>(new Map())

const getFunctionCallParts = (content: string) => {
  // 重置正则表达式的lastIndex
  FUNCTION_CALL_REGEX.lastIndex = 0
  
  const parts: Array<{ type: 'text' | 'functionCall', content: string }> = []
  let lastIndex = 0
  let match: RegExpExecArray | null
  
  // 查找所有的functionCall标签
  while ((match = FUNCTION_CALL_REGEX.exec(content)) !== null) {
    // 添加functionCall标签前的文本
    if (match.index > lastIndex) {
      parts.push({
        type: 'text',
        content: content.slice(lastIndex, match.index)
      })
    }
    
    // 添加functionCall内容
    parts.push({
      type: 'functionCall',
      content: match[1] || ''
    })
    
    lastIndex = match.index + match[0].length
  }
  
  // 添加最后一个functionCall标签后的文本
  if (lastIndex < content.length) {
    parts.push({
      type: 'text',
      content: content.slice(lastIndex)
    })
  }
  
  return parts
}

const toggleFunctionCall = (messageIndex: number, callIndex: number) => {
  if (!expandedFunctionCalls.value.has(messageIndex)) {
    expandedFunctionCalls.value.set(messageIndex, new Set())
  }
  
  const callSet = expandedFunctionCalls.value.get(messageIndex)! as Set<number>
  if (callSet.has(callIndex)) {
    callSet.delete(callIndex)
  } else {
    callSet.add(callIndex)
  }
}

const isFunctionCallExpanded = (messageIndex: number, callIndex: number) => {
  if (!expandedFunctionCalls.value.has(messageIndex)) {
    return false
  }
  
  return expandedFunctionCalls.value.get(messageIndex)!.has(callIndex)
}



// 获取工具调用摘要
const getToolCallSummary = (content: string) => {
  // 尝试提取JSON中的函数名或主要信息作为摘要
  try {
    // 去除可能的格式问题
    const cleanContent = content.replace(/\n/g, '').trim()

    // 尝试解析为JSON
    const parsed = JSON.parse(cleanContent)

    // 如果有function_name字段，返回它
    if (parsed.function_name) {
      return parsed.function_name
    }

    // 如果有name字段，返回它
    if (parsed.name) {
      return parsed.name
    }

    // 返回JSON对象的第一个键
    const firstKey = Object.keys(parsed)[0]
    if (firstKey) {
      return firstKey
    }
  } catch (e) {
    // 如果不是有效的JSON，截取前30个字符作为摘要
    return content.trim().substring(0, 28) + (content.length > 28 ? '...' : '')
  }

  // 默认返回
  return content.trim().substring(0, 28) + (content.length > 28 ? '...' : '')
}

// 处理历史回滚
const handleRollback = async (index: number) => {
  if (rollingBack.value || !appId.value) {
    return
  }
  if (messages.value.length - 1 - index === 0) {
    message.warn("该消息为最新消息，需回滚消息数为0")
    return
  }

  // 显示确认对话框
  Modal.confirm({
    title: '确认回滚',
    content: `确定要回滚到这条消息吗？您此次将会回滚${messages.value.length - 1 - index}条消息，"${messages.value[index + 1].content.slice(0, 15)}..." 该内容及其之后所有内容将被删除且无法恢复。`,
    okText: '确认',
    cancelText: '取消',
    onOk: async () => {
      rollingBack.value = true
      try {
        // 直接使用已加载的对话历史，不再重新调用接口
        // 由于消息列表是倒序排列的，我们需要找到对应的历史记录
        // 我们只回滚到AI的回复，所以需要找到当前AI消息对应的历史记录
        // index是消息数组中的索引，需要转换为chatHistories中的索引
        const targetMessage = messages.value[index]
        if (targetMessage) {
          // 由于messages数组是按时间正序排列，而chatHistories是按时间倒序排列
          // 所以需要计算在chatHistories中的实际位置
          console.log('targetMessage', targetMessage)
          const rollbackRes = await rollbackToHistoryVersion({
            appId: appId.value as unknown as number,
            chatHistoryId: targetMessage.id
          })

          if (rollbackRes.data.code === 0) {
            message.success('历史回滚成功')
            // 重新加载聊天历史
            await fetchAppInfo()
            // 回滚完成后自动刷新预览
            setTimeout(() => {
              refreshPreview()
            }, 1000)
          } else {
            message.error('历史回滚失败：' + rollbackRes.data.message)
          }

        } else {
          message.error('未找到对应的消息')
        }
      } catch (error) {
        console.error('回滚历史失败：', error)
        message.error('历史回滚失败，请重试')
      } finally {
        rollingBack.value = false
      }
    }
  })
}

// 页面加载时获取应用信息
onMounted(() => {
  fetchAppInfo()

  // 监听 iframe 消息
  window.addEventListener('message', (event) => {
    visualEditor.handleIframeMessage(event)
  })
})

// 清理资源
onUnmounted(() => {
  // EventSource 会在组件卸载时自动清理
})
</script>

<style scoped>
#appChatPage {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg-secondary);
  overflow: hidden;
}

/* 现代化顶部栏 */
.modern-header {
  background: var(--bg-primary);
  border-bottom: 1px solid var(--border-color);
  box-shadow: var(--shadow-light);
  z-index: 10;
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 16px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
}

.app-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.app-icon {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, var(--primary-color), var(--primary-dark));
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.app-details {
  display: flex;
  align-items: center;
}

.app-header-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.app-name {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.app-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.type-tag {
  background: rgba(102, 204, 255, 0.1);
  color: var(--primary-color);
  border: 1px solid rgba(102, 204, 255, 0.2);
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 4px;
}

.status-indicator {
  font-size: 12px;
  color: var(--text-secondary);
  padding: 2px 6px;
  border-radius: 4px;
}

.status-indicator.generating {
  background: rgba(251, 191, 36, 0.1);
  color: #f59e0b;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.header-right {
  display: flex;
  align-items: center;
}

.action-buttons {
  display: flex;
  align-items: center;
  gap: 8px;
}

.action-btn {
  color: var(--text-secondary);
  border: none;
  background: transparent;
  padding: 8px 12px;
  border-radius: var(--border-radius);
  transition: all 0.3s ease;
}

.action-btn:hover {
  background: rgba(102, 204, 255, 0.1);
  color: var(--primary-color);
}

.deploy-btn {
  background: linear-gradient(135deg, var(--primary-color), var(--primary-dark));
  border: none;
  border-radius: var(--border-radius);
  padding: 8px 16px;
  font-weight: 600;
  box-shadow: var(--shadow-light);
  transition: all 0.3s ease;
}

.deploy-btn:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-medium);
}

/* 主要内容区域 */
.main-content {
  flex: 1;
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: 16px;
  padding: 16px;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
  box-sizing: border-box;
  overflow: hidden;
}

/* 左侧对话区域 */
.chat-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--bg-primary);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-light);
  border: 1px solid var(--border-color);
  overflow: hidden;
}

/* 对话头部 */
.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-color);
  background: rgba(102, 204, 255, 0.02);
}

.chat-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.title-icon {
  font-size: 18px;
}

.chat-stats {
  font-size: 12px;
  color: var(--text-secondary);
}

.message-count {
  background: rgba(102, 204, 255, 0.1);
  color: var(--primary-color);
  padding: 4px 8px;
  border-radius: 12px;
}

/* 消息容器 */
.messages-container {
  flex: 1;
  padding: 14px;
  overflow-y: auto;
  scroll-behavior: smooth;
  background: linear-gradient(180deg, var(--bg-primary) 0%, rgba(102, 204, 255, 0.01) 100%);
}

/* 加载更多按钮 */
.load-more-container {
  text-align: center;
  padding: 12px 0;
  margin-bottom: 16px;
}

.load-more-btn {
  color: var(--primary-color);
  border: 1px solid rgba(102, 204, 255, 0.2);
  background: rgba(102, 204, 255, 0.05);
  border-radius: 20px;
  padding: 6px 16px;
  font-size: 12px;
  transition: all 0.3s ease;
}

.load-more-btn:hover {
  background: rgba(102, 204, 255, 0.1);
  border-color: var(--primary-color);
}

/* 消息样式 */
.message-item {
  margin-bottom: 20px;
  animation: messageSlideIn 0.3s ease-out;
}

@keyframes messageSlideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message-wrapper {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.user-message .message-wrapper {
  flex-direction: row-reverse;
}

.message-content {
  max-width: 70%;
  position: relative;
}

.message-text {
  padding: 12px 16px;
  border-radius: 16px;
  line-height: 1.5;
  word-wrap: break-word;
  position: relative;
  border: 1px solid var(--border-color);
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}

.user-message .message-text {
  background: linear-gradient(135deg, var(--primary-color), var(--primary-dark));
  color: white;
  border-bottom-right-radius: 6px;
  border-color: transparent;
}

.ai-message .message-text {
  background: #ffffff;
  color: var(--text-primary);
  border-bottom-left-radius: 6px;
}
/* 移除悬浮动画效果 */

/* 气泡尾巴 */
.user-message .message-text::after {
  content: '';
  position: absolute;
  right: -6px;
  bottom: 10px;
  width: 0;
  height: 0;
  border-left: 6px solid transparent;
  border-top: 6px solid rgba(0,0,0,0.12);
  filter: blur(0.3px);
}
.user-message .message-text::before {
  content: '';
  position: absolute;
  right: -5px;
  bottom: 11px;
  width: 0;
  height: 0;
  border-left: 5px solid transparent;
  border-top: 5px solid rgba(255,255,255,0.25);
}

.ai-message .message-text::after {
  content: '';
  position: absolute;
  left: -6px;
  bottom: 10px;
  width: 0;
  height: 0;
  border-right: 6px solid transparent;
  border-top: 6px solid rgba(0,0,0,0.06);
  filter: blur(0.3px);
}
.ai-message .message-text::before {
  content: '';
  position: absolute;
  left: -5px;
  bottom: 11px;
  width: 0;
  height: 0;
  border-right: 5px solid transparent;
  border-top: 5px solid #ffffff;
}

.message-time {
  font-size: 11px;
  color: var(--text-secondary);
  margin-top: 4px;
  text-align: right;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 8px;
}

.ai-message .message-time {
  text-align: left;
  justify-content: flex-start;
}

/* 工具调用折叠样式 */
.tool-call-collapsible {
  margin: 8px 0;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  background: #fff;
  border: 1px solid #f0f0f0;
}

/* 工具调用头部样式 */
.tool-call-header {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;
  background: #fafafa;
  border-bottom: 1px solid #f0f0f0;
  transition: all 0.3s ease;
}

.tool-call-header:hover {
  background: #f5f5f5;
}

.tool-call-icon {
  font-size: 16px;
  margin-right: 10px;
  color: #1890ff;
}

.tool-call-info {
  flex: 1;
}

.tool-call-title {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-right: 8px;
}

.tool-call-summary {
  font-size: 13px;
  color: #666;
  opacity: 0.8;
}

.tool-call-toggle-icon {
  font-size: 12px;
  color: #999;
  transition: transform 0.3s ease;
}

.tool-call-toggle-icon.expanded {
  transform: rotate(180deg);
}

/* 工具调用内容样式 */
.tool-call-content {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s ease, padding 0.3s ease;
  background: #ffffff;
}

.tool-call-content.expanded {
  max-height: 600px;
  padding: 0;
  overflow: visible;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 0;
  box-shadow: none;
}

.tool-call-code {
  margin: 0 !important;
  padding: 16px !important;
  background: transparent !important;
  border: none !important;
  border-radius: 0 !important;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
  font-size: 14px !important;
  line-height: 1.6 !important;
  color: #1e293b !important;
  overflow-x: auto !important;
  overflow-y: auto !important;
  white-space: normal !important;
  min-height: 120px !important;
  max-height: 500px !important;
  box-shadow: none !important;
  transition: none !important;
  z-index: 10 !important;
}

/* 移除所有悬停效果 */
.tool-call-code:hover {
  background: transparent !important;
  box-shadow: none !important;
}

/* 确保Markdown内容在工具调用区域内正确显示 */
.tool-call-code .markdown-content {
  color: #1e293b !important;
  background: transparent !important;
}

.tool-call-code .markdown-content :deep(pre) {
  background: #f1f5f9 !important;
  border-radius: 4px !important;
}

.tool-call-code .markdown-content :deep(pre code) {
  background: transparent !important;
}

.tool-call-code .markdown-content :deep(.hljs) {
  background: #f1f5f9 !important;
  color: #1e293b !important;
}

/* 滚动条样式优化 - 小巧精致风格 */
.tool-call-code::-webkit-scrollbar {
  width: 4px;
  height: 4px;
}

.tool-call-code::-webkit-scrollbar-track {
  background: transparent;
}

.tool-call-code::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 2px;
}

.tool-call-code::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

.message-avatar {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
}

/* 加载指示器 */
.loading-indicator {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  border-bottom-left-radius: 4px;
}

.typing-dots {
  display: flex;
  gap: 4px;
}

.typing-dots span {
  width: 6px;
  height: 6px;
  background: var(--primary-color);
  border-radius: 50%;
  animation: typing 1.4s infinite ease-in-out;
}

.typing-dots span:nth-child(1) { animation-delay: -0.32s; }
.typing-dots span:nth-child(2) { animation-delay: -0.16s; }

@keyframes typing {
  0%, 80%, 100% {
    transform: scale(0.8);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

.loading-text {
  font-size: 14px;
  color: var(--text-secondary);
}

/* 输入区域 */
.input-container {
  padding: 20px;
  background: var(--bg-primary);
  border-top: 1px solid var(--border-color);
}

.input-wrapper {
  position: relative;
}

.input-field {
  position: relative;
}

.message-input {
  border-radius: 12px;
  border: 2px solid var(--border-color);
  background: var(--bg-primary);
  padding: 10px 44px 10px 14px;
  font-size: 13px;
  line-height: 1.5;
  transition: all 0.3s ease;
  resize: none;
}

.message-input:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(102, 204, 255, 0.1);
}

.input-actions {
  position: absolute;
  bottom: 6px;
  right: 6px;
}

.send-btn {
  width: 36px;
  height: 36px;
  border-radius: 6px;
  background: linear-gradient(135deg, var(--primary-color), var(--primary-dark));
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
}

.send-btn:hover:not(:disabled) {
  box-shadow: var(--shadow-light);
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 回滚按钮 */
.rollback-btn {
  font-size: 11px !important;
  padding: 4px 8px !important;
  height: auto !important;
  color: var(--primary-color) !important;
  border: none !important;
  border-radius: 4px !important;
  background: white !important;
  box-shadow: none !important;
}

.rollback-btn:hover {
  color: var(--primary-color) !important;
  background: rgba(24, 144, 255, 0.08) !important;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05) !important;
  transition: all 0.2s ease-in-out !important;
}

.input-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 8px;
}

.char-count {
  font-size: 12px;
  color: var(--text-secondary);
}

/* Markdown / 文本细节优化 */
.message-text :deep(p) { margin: 0 0 8px; }
.message-text :deep(p:last-child) { margin-bottom: 0; }
.message-text :deep(ul),
.message-text :deep(ol) { margin: 0 0 8px 20px; padding: 0; }
.message-text :deep(code) {
  background: rgba(0,0,0,0.04);
  padding: 0 4px;
  border-radius: 4px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
}
.message-text :deep(pre) {
  background: #0f172a;
  color: #282a2c;
  padding: 10px 12px;
  border-radius: 10px;
  overflow: auto;
  border: 1px solid rgba(255,255,255,0.06);
}
.message-text :deep(a) { color: var(--primary-color); text-decoration: none; }
.message-text :deep(a:hover) { text-decoration: underline; }

/* 右侧预览区域 */
.preview-section {
  flex: 1.5;
  display: flex;
  flex-direction: column;
  background: var(--bg-primary);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-light);
  border: 1px solid var(--border-color);
  overflow: hidden;
}

.preview-header {
  display: grid;
  grid-template-columns: 1fr auto 1fr; /* 左 中 右 */
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-color);
  background: rgba(102, 204, 255, 0.02);
}

.preview-left {
  justify-self: start;
}

.preview-center {
  justify-self: center;
}

.preview-right {
  justify-self: end;
  display: flex;
  align-items: center;
  gap: 8px;
}

.preview-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.preview-status {
  font-size: 11px;
  padding: 4px 8px;
  border-radius: 12px;
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
  margin-left: 8px;
}

.preview-status.generating {
  background: rgba(251, 191, 36, 0.1);
  color: #f59e0b;
  animation: pulse 2s infinite;
}

.preview-actions {
  display: flex;
  gap: 8px;
}

.scale-label { font-size: 12px; color: var(--text-secondary); }

.preview-content {
  flex: 1;
  position: relative;
  overflow: hidden;
}

/* 预览占位符 */
.preview-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  background: linear-gradient(135deg, rgba(102, 204, 255, 0.02), rgba(102, 204, 255, 0.05));
}

.placeholder-content {
  text-align: center;
  color: var(--text-secondary);
}

.placeholder-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.6;
}

.placeholder-content h3 {
  margin: 0 0 8px;
  font-size: 18px;
  color: var(--text-primary);
}

.placeholder-content p {
  margin: 0;
  font-size: 14px;
}

/* 预览加载 */
.preview-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  background: linear-gradient(135deg, rgba(102, 204, 255, 0.02), rgba(102, 204, 255, 0.05));
}

.loading-content {
  text-align: center;
  color: var(--text-secondary);
}

.loading-spinner {
  margin-bottom: 16px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(102, 204, 255, 0.2);
  border-top: 3px solid var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-content h3 {
  margin: 0 0 8px;
  font-size: 18px;
  color: var(--text-primary);
}

.loading-content p {
  margin: 0;
  font-size: 14px;
}

/* 预览框架 */
.preview-frame-container {
  height: 100%;
  position: relative;
}

/* 预览闪烁提示灯 */
.preview-blinking-indicator {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #f59e0b;
  margin-left: 8px;
  animation: blink 1.5s infinite;
}

@keyframes blink {
  0%, 50%, 100% {
    opacity: 0.5;
  }
  25%, 75% {
    opacity: 1;
  }
}

.preview-iframe {
  width: 100%;
  height: 100%;
  border: none;
  background: white;
}

/* 选中元素提示 */
.selected-element-alert {
  margin: 0 20px 16px;
  border-radius: var(--border-radius);
  border: 1px solid rgba(102, 204, 255, 0.2);
  background: rgba(102, 204, 255, 0.05);
}

/* 编辑模式按钮 */
.edit-mode-active {
  background-color: #10b981 !important;
  color: white !important;
}

.edit-mode-active:hover {
  background-color: #059669 !important;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .main-content {
    gap: 16px;
    padding: 16px;
  }
}

@media (max-width: 1024px) {
  .main-content {
    flex-direction: column;
    gap: 16px;
  }

  .chat-section,
  .preview-section {
    flex: none;
    height: 50vh;
  }
}

@media (max-width: 768px) {
  .header-content {
    padding: 12px 16px;
  }

  .app-name {
    font-size: 16px;
  }

  .main-content {
    padding: 12px;
    gap: 12px;
  }

  .messages-container {
    padding: 16px;
  }

  .input-container {
    padding: 16px;
  }

  .message-content {
    max-width: 85%;
  }

  .action-buttons {
    gap: 4px;
  }

  .action-btn {
    padding: 6px 8px;
    font-size: 12px;
  }

  .deploy-btn {
    padding: 6px 12px;
    font-size: 12px;
  }
}

/* 现代企业UI - 预览头部样式 */
.modern-preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #ffffff;
  border-bottom: 1px solid #f0f0f0;
  border-radius: 8px 8px 0 0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
}

.preview-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.preview-title-text {
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;
}

.preview-status {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: 12px;
  background-color: #f7f7f7;
  transition: all 0.3s ease;
}

.preview-status.generating {
  color: #faad14;
  background-color: #fff7e6;
}

.preview-status:not(.generating) {
  color: #52c41a;
  background-color: #f6ffed;
}

.status-indicator-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: currentColor;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
  100% {
    opacity: 1;
  }
}

.modern-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.zoom-controls {
  display: flex;
  align-items: center;
  gap: 4px;
  background-color: #fff;
  padding: 2px;
  border-radius: 6px;
}

.modern-btn {
  font-size: 13px;
  border-radius: 6px;
  font-weight: 500;
  border: none !important;
  color: #2c3e50;
}

.modern-btn:hover {
  background-color: #f0f2f5 !important;
  color: #1890ff !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.modern-scale-box {
  display: inline-block;
  padding: 4px 8px;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  background-color: #fff;
  min-width: 45px;
  text-align: center;
  font-weight: 600;
  font-size: 12px;
  color: #2c3e50;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.05);
}

.scale-input {
  border: 1px solid #e8e8e8;
  outline: none;
  font-family: inherit;
  min-width: 45px;
  font-size: 12px;
  padding: 3px 6px;
  height: 28px;
  box-sizing: border-box;
  font-weight: 600;
  color: #1890ff;
  background-color: #fafafa;
  transition: all 0.3s ease;
}

.scale-input:focus {
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

.zoom-btn {
  min-width: 28px;
  height: 28px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
}

.edit-mode-active {
  color: #1890ff !important;
  background-color: #e6f7ff !important;
}

.edit-mode-active:hover {
  color: #40a9ff !important;
  background-color: #bae7ff !important;
}

@media (max-width: 480px) {
  .header-content {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }

  .header-right {
    width: 100%;
    justify-content: flex-end;
  }

  .app-info {
    gap: 8px;
  }

  .app-icon {
    width: 32px;
    height: 32px;
    font-size: 16px;
  }

  .app-name {
    font-size: 14px;
  }

  .main-content {
    padding: 8px;
  }

  .chat-section,
  .preview-section {
    height: 45vh;
  }
}
</style>
