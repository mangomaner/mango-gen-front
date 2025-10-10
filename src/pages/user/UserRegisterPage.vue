<template>
  <div id="userRegisterPage">
    <h2 class="title">鱼皮 AI 应用生成 - 用户注册</h2>
    <div class="desc">不写一行代码，生成完整应用</div>
    <a-form :model="formState" name="basic" autocomplete="off" @finish="handleSubmit">
      <a-form-item name="userAccount" :rules="[{ required: true, message: '请输入账号' }]">
        <a-input v-model:value="formState.userAccount" placeholder="请输入账号" />
      </a-form-item>
      <a-form-item
        name="userPassword"
        :rules="[
          { required: true, message: '请输入密码' },
          { min: 6, message: '密码不能小于 6 位' },
        ]"
      >
        <a-input-password v-model:value="formState.userPassword" placeholder="请输入密码" />
      </a-form-item>
      <a-form-item
        name="checkPassword"
        :rules="[
          { required: true, message: '请确认密码' },
          { min: 6, message: '密码不能小于 6 位' },
          { validator: validateCheckPassword },
        ]"
      >
        <a-input-password v-model:value="formState.checkPassword" placeholder="请确认密码" />
      </a-form-item>
      <div class="tips">
        已有账号？
        <RouterLink to="/user/login">去登录</RouterLink>
      </div>
      <a-form-item>
        <a-button type="primary" html-type="submit" style="width: 100%">注册</a-button>
      </a-form-item>
    </a-form>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { userRegister } from '@/api/userController.ts'
import { message } from 'ant-design-vue'
import { reactive } from 'vue'

const router = useRouter()

const formState = reactive<API.UserRegisterRequest>({
  userAccount: '',
  userPassword: '',
  checkPassword: '',
})

/**
 * 验证确认密码
 * @param rule
 * @param value
 * @param callback
 */
const validateCheckPassword = (rule: unknown, value: string, callback: (error?: Error) => void) => {
  if (value && value !== formState.userPassword) {
    callback(new Error('两次输入密码不一致'))
  } else {
    callback()
  }
}

/**
 * 提交表单
 * @param values
 */
const handleSubmit = async (values: API.UserRegisterRequest) => {
  const res = await userRegister(values)
  // 注册成功，跳转到登录页面
  if (res.data.code === 0) {
    message.success('注册成功')
    router.push({
      path: '/user/login',
      replace: true,
    })
  } else {
    message.error('注册失败，' + res.data.message)
  }
}
</script>

<style scoped>
#userRegisterPage {
  background: var(--bg-primary);
  max-width: 400px;
  padding: 32px 24px;
  margin: 40px auto;
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-medium);
  border: 1px solid var(--border-color);
}

.title {
  text-align: center;
  margin-bottom: 12px;
  font-size: 20px;
  color: var(--text-primary);
  font-weight: 600;
}

.desc {
  text-align: center;
  color: var(--text-secondary);
  margin-bottom: 24px;
  font-size: 14px;
}

.tips {
  margin-bottom: 16px;
  color: var(--text-secondary);
  font-size: 12px;
  text-align: right;
}

.tips a {
  color: var(--primary-color);
  text-decoration: none;
}

.tips a:hover {
  color: var(--primary-dark);
  text-decoration: underline;
}

.ant-form-item {
  margin-bottom: 16px;
}

.ant-input,
.ant-input-password {
  height: 36px;
  border-radius: var(--border-radius);
  border-color: var(--border-color);
}

.ant-input:focus,
.ant-input-password:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(102, 204, 255, 0.2);
}

.ant-btn {
  height: 36px;
  border-radius: var(--border-radius);
  font-size: 14px;
}
</style>
