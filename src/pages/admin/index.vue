<script setup lang="ts">
definePage({
  style: {
    navigationBarTitleText: '管理后台',
  },
})

import type { IAdminStats } from '@/api/admin'
import { getAdminStats } from '@/api/admin'
import { useUserStore } from '@/store'

const userStore = useUserStore()

const stats = ref<IAdminStats>({
  userCount: 0,
  bookCount: 0,
  orderCount: 0,
  totalSales: 0,
  onSaleCount: 0,
  pendingOrderCount: 0,
})

const loading = ref(true)
const isAdmin = computed(() => userStore.userInfo.role === 'admin' || userStore.userInfo.role === 'super_admin')

const menuItems = [
  { label: '书籍管理', icon: '📚', path: '/pages/admin/books/index', color: '#365F47' },
  { label: '分类管理', icon: '📂', path: '/pages/admin/categories/index', color: '#E7A941' },
  { label: '订单管理', icon: '📋', path: '/pages/admin/orders/index', color: '#4A90E2' },
  { label: '用户管理', icon: '👥', path: '/pages/admin/users/index', color: '#E75E40' },
]

async function fetchStats() {
  if (!isAdmin.value) {
    uni.showToast({ title: '当前账号无管理权限，请用管理员账号登录', icon: 'none', duration: 2500 })
    loading.value = false
    return
  }
  try {
    loading.value = true
    const res = await getAdminStats()
    stats.value = res
  }
  catch {
    uni.showToast({ title: '获取统计数据失败（可能无权限）', icon: 'none' })
  }
  finally {
    loading.value = false
  }
}

function handleMenuClick(path: string) {
  uni.navigateTo({ url: path })
}

onMounted(() => {
  fetchStats()
})
</script>

<template>
  <view class="admin-dashboard bg-bg min-h-100vh">
    <!-- 顶部标题 -->
    <view class="admin-header bg-primary px-30rpx py-40rpx">
      <text class="text-36rpx font-bold text-white">管理后台</text>
      <text class="text-24rpx text-#C5E1D0 mt-8rpx">二手书交易平台管理系统</text>
    </view>

    <!-- 统计卡片 -->
    <view class="stats-grid grid grid-cols-3 gap-20rpx px-30rpx py-30rpx">
      <view class="stat-card bg-white rounded-16rpx p-24rpx text-center shadow-sm">
        <text class="stat-num text-36rpx font-bold text-primary">{{ stats.userCount }}</text>
        <text class="stat-label text-22rpx text-text-muted mt-8rpx">用户总数</text>
      </view>
      <view class="stat-card bg-white rounded-16rpx p-24rpx text-center shadow-sm">
        <text class="stat-num text-36rpx font-bold text-accent">{{ stats.onSaleCount }}</text>
        <text class="stat-label text-22rpx text-text-muted mt-8rpx">在售书籍</text>
      </view>
      <view class="stat-card bg-white rounded-16rpx p-24rpx text-center shadow-sm">
        <text class="stat-num text-36rpx font-bold text-#E7A941">{{ stats.orderCount }}</text>
        <text class="stat-label text-22rpx text-text-muted mt-8rpx">订单总数</text>
      </view>
      <view class="stat-card bg-white rounded-16rpx p-24rpx text-center shadow-sm">
        <text class="stat-num text-36rpx font-bold text-#4A90E2">¥{{ stats.totalSales.toFixed(0) }}</text>
        <text class="stat-label text-22rpx text-text-muted mt-8rpx">销售总额</text>
      </view>
      <view class="stat-card bg-white rounded-16rpx p-24rpx text-center shadow-sm">
        <text class="stat-num text-36rpx font-bold text-#E75E40">{{ stats.pendingOrderCount }}</text>
        <text class="stat-label text-22rpx text-text-muted mt-8rpx">待处理订单</text>
      </view>
      <view class="stat-card bg-white rounded-16rpx p-24rpx text-center shadow-sm">
        <text class="stat-num text-36rpx font-bold text-#365F47">{{ stats.bookCount }}</text>
        <text class="stat-label text-22rpx text-text-muted mt-8rpx">书籍总数</text>
      </view>
    </view>

    <!-- 管理菜单 -->
    <view class="admin-menu px-30rpx">
      <text class="text-28rpx font-bold mb-20rpx">管理功能</text>
      <view class="menu-grid grid grid-cols-2 gap-20rpx">
        <view
          v-for="item in menuItems"
          :key="item.label"
          class="menu-card bg-white rounded-16rpx p-30rpx flex items-center gap-20rpx shadow-sm"
          @tap="handleMenuClick(item.path)"
        >
          <view class="menu-icon w-80rpx h-80rpx rounded-full flex items-center justify-center text-40rpx" :style="{ background: `${item.color}15` }">
            {{ item.icon }}
          </view>
          <text class="text-26rpx font-bold">{{ item.label }}</text>
        </view>
      </view>
    </view>
  </view>
</template>
