<script setup lang="ts">
import { useTokenStore, useUserStore } from '@/store'
import { register } from '@/api/auth'

definePage({
  style: {
    navigationStyle: 'custom',
    navigationBarTitleText: '我的',
  },
})

const userStore = useUserStore()
const tokenStore = useTokenStore()

// 登录表单
const showLoginModal = ref(false)
const isRegisterMode = ref(false)
const loginForm = ref({ username: '', password: '', nickname: '' })

const stats = computed(() => [
  { num: 12, label: '我发布的' },
  { num: 28, label: '我卖出的' },
  { num: 56, label: '我买到的' },
  { num: 3, label: '收藏夹' },
])

const menuItems = computed(() => {
  const items = [
    { text: '我的订单', path: '/pages/orders/index', isTab: false },
    { text: '我的购物车', path: '/pages/cart/index', isTab: true },
    { text: '地址管理', path: '/pages/address/index', isTab: false },
    { text: '联系客服', path: '', action: 'contact_service', isTab: false },
  ]

  // 管理员菜单（admin 或 super_admin 都能看到）
  if (userStore.userInfo.role === 'admin' || userStore.userInfo.role === 'super_admin') {
    items.push({ text: '管理后台', path: '/pages/admin/index', isTab: false })
  }

  return items
})

const isAdmin = computed(() => userStore.userInfo.role === 'admin' || userStore.userInfo.role === 'super_admin')

function handleMenuClick(path: string, isTab: boolean, action?: string) {
  if (action === 'contact_service') {
    uni.showModal({
      title: '联系客服',
      content: '客服电话: 400-888-8888\n工作时间: 9:00 - 21:00',
      showCancel: false,
      confirmText: '知道了',
    })
    return
  }
  if (!path) return
  if (isTab) {
    uni.switchTab({ url: path })
  } else {
    uni.navigateTo({ url: path })
  }
}

function handleStatClick(label: string) {
  if (!tokenStore.hasLogin) {
    uni.showToast({ title: '请先登录', icon: 'none' })
    return
  }
  const map: Record<string, string> = {
    '我发布的': '/pages/my-published/index',
    '我卖出的': '/pages/orders/index?role=seller',
    '我买到的': '/pages/orders/index?role=buyer',
    '收藏夹': '/pages/favorites/index',
  }
  const path = map[label]
  if (path) {
    uni.navigateTo({ url: path })
  }
}

function handleLoginClick() {
  if (tokenStore.hasLogin) {
    // 已登录，显示退出确认
    uni.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: async (res) => {
        if (res.confirm) {
          await tokenStore.logout()
          uni.showToast({ title: '已退出登录', icon: 'success' })
        }
      },
    })
  } else {
    showLoginModal.value = true
    isRegisterMode.value = false
  }
}

async function handleLoginSubmit() {
  if (!loginForm.value.username || !loginForm.value.password) {
    uni.showToast({ title: '请填写用户名和密码', icon: 'none' })
    return
  }

  try {
    if (isRegisterMode.value) {
      await register({
        username: loginForm.value.username,
        password: loginForm.value.password,
        nickname: loginForm.value.nickname || loginForm.value.username,
      })
      uni.showToast({ title: '注册成功', icon: 'success' })
    } else {
      await tokenStore.login({
        username: loginForm.value.username,
        password: loginForm.value.password,
      })
    }
    showLoginModal.value = false
    loginForm.value = { username: '', password: '', nickname: '' }
  }
  catch {
    uni.showToast({ title: isRegisterMode.value ? '注册失败' : '登录失败', icon: 'none' })
  }
}

function toggleLoginMode() {
  isRegisterMode.value = !isRegisterMode.value
}
</script>

<template>
  <view class="profile-page bg-bg min-h-100vh">
    <!-- 头部卡片 -->
    <view class="profile-header-card bg-gradient-to-b from-#E6E2D8 to-bg px-40rpx py-60rpx flex items-center gap-30rpx">
      <view class="seller-avatar w-110rpx h-110rpx rounded-full flex items-center justify-center text-white text-44rpx" :class="isAdmin ? 'bg-accent' : 'bg-primary'">
        {{ tokenStore.hasLogin ? (userStore.userInfo.nickname || userStore.userInfo.username).slice(0, 1) : '📖' }}
      </view>
      <view class="profile-name-area flex-1">
        <view class="flex items-center gap-12rpx">
          <text class="text-36rpx font-bold mb-8rpx">{{ tokenStore.hasLogin ? (userStore.userInfo.nickname || userStore.userInfo.username) : '热爱阅读的你' }}</text>
          <text v-if="isAdmin" class="text-18rpx bg-accent text-white px-10rpx py-2rpx rounded-8rpx">管理员</text>
        </view>
        <text v-if="tokenStore.hasLogin" class="text-22rpx text-text-muted">@{{ userStore.userInfo.username }}</text>
        <view v-else class="profile-level bg-primary text-white text-18rpx px-10rpx py-2rpx rounded-12rpx mt-8rpx w-fit" @tap="handleLoginClick">
          点击登录
        </view>
      </view>
      <view v-if="tokenStore.hasLogin" class="text-24rpx text-text-muted" @tap="handleLoginClick">
        退出
      </view>
    </view>

    <!-- 统计数据 -->
    <view class="profile-stats-grid grid grid-cols-4 bg-white py-30rpx text-center border-b border-border">
      <view
        v-for="stat in stats"
        :key="stat.label"
        class="stat-item flex flex-col gap-8rpx text-22rpx text-text-muted cursor-pointer"
        @tap="handleStatClick(stat.label)"
      >
        <text class="stat-num text-32rpx font-bold text-text-main">{{ stat.num }}</text>
        <text>{{ stat.label }}</text>
      </view>
    </view>

    <!-- 菜单列表 -->
    <view class="menu-list-group bg-white mt-20rpx flex flex-col">
      <view
        v-for="item in menuItems"
        :key="item.text"
        class="menu-list-row flex justify-between py-28rpx px-30rpx text-26rpx border-b border-#FAFAFA"
        @tap="handleMenuClick(item.path, item.isTab, (item as any).action)"
      >
        <view class="flex items-center gap-12rpx">
          <text>{{ item.text }}</text>
          <text v-if="item.text === '管理后台'" class="text-18rpx bg-accent text-white px-8rpx py-2rpx rounded-4rpx">Admin</text>
        </view>
        <text class="text-#CCC text-32rpx">›</text>
      </view>
    </view>

    <!-- 登录弹窗 -->
    <view v-if="showLoginModal" class="modal-mask fixed inset-0 bg-#00000066 flex items-center justify-center z-999" @tap="showLoginModal = false">
      <view class="modal-content bg-white rounded-24rpx p-40rpx w-640rpx" @tap.stop>
        <text class="text-34rpx font-bold mb-30rpx">{{ isRegisterMode ? '注册' : '登录' }}</text>

        <view class="flex flex-col gap-20rpx">
          <input
            v-model="loginForm.username"
            type="text"
            placeholder="请输入用户名"
            class="border border-border p-24rpx rounded-16rpx text-26rpx"
          />
          <input
            v-model="loginForm.password"
            type="text"
            password
            placeholder="请输入密码"
            class="border border-border p-24rpx rounded-16rpx text-26rpx"
          />
          <input
            v-if="isRegisterMode"
            v-model="loginForm.nickname"
            type="text"
            placeholder="请输入昵称（选填）"
            class="border border-border p-24rpx rounded-16rpx text-26rpx"
          />
        </view>

        <view class="bg-primary text-white py-24rpx rounded-44rpx font-bold text-28rpx text-center mt-30rpx" @tap="handleLoginSubmit">
          {{ isRegisterMode ? '注册' : '登录' }}
        </view>

        <view class="text-center mt-20rpx text-24rpx text-primary" @tap="toggleLoginMode">
          {{ isRegisterMode ? '已有账号？去登录' : '没有账号？去注册' }}
        </view>

        <view v-if="!isRegisterMode" class="text-center mt-16rpx text-22rpx text-text-muted">
          新用户？点击上方注册
        </view>
      </view>
    </view>
  </view>
</template>
