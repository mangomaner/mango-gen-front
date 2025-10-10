<template>
  <div id="userLoginPage">
    <h2 class="title">Mango Gen</h2>
    <div class="desc">代码生成平台</div>
    <a-form :model="formState" name="basic" autocomplete="off" @finish="handleSubmit">
      <a-form-item name="userAccount" :rules="[{ required: true, message: '请输入账号' }]">
        <a-input v-model:value="formState.userAccount" placeholder="请输入账号" />
      </a-form-item>
      <a-form-item
        name="userPassword"
        :rules="[
          { required: true, message: '请输入密码' },
          { min: 6, message: '密码长度不能小于 6 位' },
        ]"
      >
        <a-input-password v-model:value="formState.userPassword" placeholder="请输入密码" />
      </a-form-item>
      <div class="tips">
        没有账号
        <RouterLink to="/user/register">去注册</RouterLink>
      </div>
      <a-form-item>
        <a-button type="primary" html-type="submit" style="width: 100%">登录</a-button>
      </a-form-item>
    </a-form>
  </div>
</template>
<script lang="ts" setup>
import { reactive } from 'vue'
import { userLogin } from '@/api/userController.ts'
import { useLoginUserStore } from '@/stores/loginUser.ts'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'

const formState = reactive<API.UserLoginRequest>({
  userAccount: '',
  userPassword: '',
})

const router = useRouter()
const loginUserStore = useLoginUserStore()

/**
 * 提交表单
 * @param values
 */
const handleSubmit = async (values: any) => {
  const res = await userLogin(values)
  // 登录成功，把登录态保存到全局状态中
  if (res.data.code === 0 && res.data.data) {
    await loginUserStore.fetchLoginUser()
    message.success('登录成功')
    router.push({
      path: '/',
      replace: true,
    })
  } else {
    message.error('登录失败，' + res.data.message)
  }
}
</script>

<style scoped>
#userLoginPage {
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
  text-align: right;
  color: var(--text-secondary);
  font-size: 12px;
  margin-bottom: 16px;
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
