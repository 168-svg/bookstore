<script setup lang="ts">
import { ref, computed } from 'vue'
import BookCover from '@/components/BookCover.vue'
import type { IOrder } from '@/api/orders'
import { getOrders, updateOrderStatus } from '@/api/orders'

definePage({
  style: {
    navigationBarTitleText: '我的订单',
  },
})

const tabs = [
  { key: 'all', label: '全部' },
  { key: '待付款', label: '待付款' },
  { key: '待发货', label: '待发货' },
  { key: '待收货', label: '待收货' },
  { key: '已完成', label: '已完成' },
  { key: '已取消', label: '已取消' },
]

const roleTabs = [
  { key: 'buyer', label: '我买到的' },
  { key: 'seller', label: '我卖出的' },
]

const activeRole = ref<'buyer' | 'seller'>('buyer')
const activeTab = ref('all')
const orders = ref<IOrder[]>([])
const loading = ref(false)

const filteredOrders = computed(() => {
  if (activeTab.value === 'all') return orders.value
  return orders.value.filter((order) => order.status === activeTab.value)
})

async function fetchOrders() {
  try {
    loading.value = true
    const params: Record<string, any> = { page: 1, pageSize: 50, role: activeRole.value }
    if (activeTab.value !== 'all') params.status = activeTab.value
    const res = await getOrders(params)
    orders.value = res.list
  }
  catch (err) {
    console.error(err)
  }
  finally {
    loading.value = false
  }
}

function handleRoleClick(key: string) {
  activeRole.value = key as 'buyer' | 'seller'
  fetchOrders()
}

function handleTabClick(key: string) {
  activeTab.value = key
  fetchOrders()
}

async function handleConfirmReceive(order: IOrder) {
  uni.showModal({
    title: '确认收货',
    content: '确认已收到商品？',
    success: async (res) => {
      if (res.confirm) {
        await updateOrderStatus(order.id, '已完成')
        uni.showToast({ title: '确认收货成功', icon: 'success' })
        fetchOrders()
      }
    },
  })
}

function handleRemindShip() {
  uni.showToast({ title: '已提醒卖家尽快发货', icon: 'success' })
}

async function handleCancel(order: IOrder) {
  uni.showModal({
    title: '取消订单',
    content: '确定要取消该订单吗？',
    success: async (res) => {
      if (res.confirm) {
        await updateOrderStatus(order.id, '已取消')
        uni.showToast({ title: '订单已取消', icon: 'none' })
        fetchOrders()
      }
    },
  })
}

async function handlePay(order: IOrder) {
  uni.showToast({ title: '模拟支付成功', icon: 'success' })
  await updateOrderStatus(order.id, '待发货')
  fetchOrders()
}

onLoad((options: any) => {
  if (options?.role === 'seller') {
    activeRole.value = 'seller'
    uni.setNavigationBarTitle({ title: '我卖出的' })
  } else if (options?.role === 'buyer') {
    activeRole.value = 'buyer'
    uni.setNavigationBarTitle({ title: '我买到的' })
  }
  fetchOrders()
})
</script>

<template>
  <view class="orders-page bg-bg min-h-100vh">
    <!-- 角色切换 Tab -->
    <view class="role-tabs flex bg-white border-b border-border">
      <view
        v-for="roleTab in roleTabs"
        :key="roleTab.key"
        class="role-tab-item flex-1 py-24rpx text-center text-26rpx"
        :class="activeRole === roleTab.key ? 'text-primary font-bold border-b-4 border-primary' : 'text-text-muted'"
        @tap="handleRoleClick(roleTab.key)"
      >
        {{ roleTab.label }}
      </view>
    </view>

    <!-- 状态 Tab -->
    <view class="order-tabs flex bg-white border-b border-border">
      <view
        v-for="tab in tabs"
        :key="tab.key"
        class="order-tab-item flex-1 py-24rpx text-center text-24rpx text-text-muted"
        :class="{ active: activeTab === tab.key }"
        @tap="handleTabClick(tab.key)"
      >
        {{ tab.label }}
      </view>
    </view>

    <!-- 空状态 -->
    <view v-if="filteredOrders.length === 0 && !loading" class="empty-state flex flex-col items-center justify-center py-160rpx">
      <view class="w-200rpx h-200rpx rounded-full bg-white flex items-center justify-center mb-30rpx shadow-sm">
        <text class="text-80rpx text-text-muted">📦</text>
      </view>
      <text class="text-28rpx text-text-main mb-12rpx">暂无订单</text>
      <text class="text-22rpx text-text-muted">去挑选一些心仪的二手书吧</text>
    </view>

    <!-- 订单列表 -->
    <view class="order-list p-24rpx flex flex-col gap-24rpx">
      <view
        v-for="order in filteredOrders"
        :key="order.id"
        class="order-card bg-white rounded-20rpx shadow-sm"
      >
        <!-- 头部 -->
        <view class="order-card-header flex justify-between items-center text-22rpx text-text-muted border-b border-border px-30rpx py-20rpx">
          <view class="flex items-center gap-16rpx">
            <text class="text-22rpx text-text-muted">订单号: {{ order.order_no }}</text>
          </view>
          <text
            class="font-bold text-24rpx"
            :class="{
              'text-accent': order.status === '待发货',
              'text-primary': order.status === '待收货',
              'text-text-muted': order.status === '已完成' || order.status === '已取消',
            }"
          >
            {{ order.status }}
          </text>
        </view>

        <!-- 商品列表 -->
        <view class="px-30rpx py-24rpx">
          <view
            v-for="item in order.items"
            :key="item.id"
            class="flex items-start gap-20rpx py-16rpx first:pt-0 last:pb-0"
          >
            <BookCover :title="item.title" :color="item.color" width="100rpx" height="140rpx" font-size="20rpx" />
            <view class="flex-1 flex flex-col gap-8rpx">
              <text class="text-26rpx font-bold line-clamp-2">{{ item.title }}</text>
            </view>
            <view class="text-right">
              <text class="text-24rpx text-text-main block">¥{{ Number(item.price).toFixed(2) }}</text>
              <text class="text-20rpx text-text-muted">x{{ item.quantity }}</text>
            </view>
          </view>
        </view>

        <!-- 底部 -->
        <view class="order-card-footer flex justify-between items-center border-t border-border px-30rpx py-20rpx">
          <text class="text-22rpx text-text-muted">共 {{ order.items.reduce((s, i) => s + Number(i.quantity), 0) }} 件 · 实付款: <text class="font-bold text-accent text-26rpx">¥{{ Number(order.total_price).toFixed(2) }}</text></text>

          <view class="flex gap-16rpx">
            <view
              v-if="order.status === '待发货'"
              class="order-action-btn border border-border text-text-muted py-8rpx px-24rpx rounded-full text-22rpx font-medium"
              @tap="handleRemindShip"
            >
              提醒发货
            </view>
            <view
              v-if="order.status === '待收货'"
              class="order-action-btn border border-primary text-primary py-8rpx px-24rpx rounded-full text-22rpx font-medium"
              @tap="handleConfirmReceive(order)"
            >
              确认收货
            </view>
            <view
              v-if="order.status === '待付款'"
              class="order-action-btn border border-accent text-accent py-8rpx px-24rpx rounded-full text-22rpx font-medium"
              @tap="handlePay(order)"
            >
              立即付款
            </view>
            <view
              v-if="order.status === '待发货' || order.status === '待付款'"
              class="order-action-btn border border-border text-text-muted py-8rpx px-24rpx rounded-full text-22rpx font-medium"
              @tap="handleCancel(order)"
            >
              取消
            </view>
            <view
              v-if="order.status === '已完成'"
              class="order-action-btn border border-border text-text-muted py-8rpx px-24rpx rounded-full text-22rpx font-medium"
            >
              再次购买
            </view>
          </view>
        </view>

        <!-- 地址信息 -->
        <view class="px-30rpx pb-20rpx pt-8rpx text-20rpx text-text-muted border-t border-border">
          <text>收货: {{ order.address }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<style scoped>
.order-tab-item.active {
  color: #365F47;
  font-weight: bold;
  border-bottom: 4rpx solid #365F47;
}

.line-clamp-2 {
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
</style>
