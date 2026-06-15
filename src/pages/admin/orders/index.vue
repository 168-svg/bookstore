<script setup lang="ts">
definePage({
  style: {
    navigationBarTitleText: '订单管理',
  },
})

import type { IOrder } from '@/api/orders'
import { getAdminOrders, updateOrderStatus } from '@/api/orders'

const orders = ref<IOrder[]>([])
const total = ref(0)
const page = ref(1)
const statusFilter = ref('')
const loading = ref(false)

const statusOptions = ['', '待付款', '待发货', '待收货', '已完成', '已取消']

async function fetchOrders() {
  try {
    loading.value = true
    const params: Record<string, any> = { page: page.value, pageSize: 20 }
    if (statusFilter.value) params.status = statusFilter.value
    const res = await getAdminOrders(params)
    orders.value = res.list
    total.value = res.total
  }
  catch {
    uni.showToast({ title: '获取订单失败', icon: 'none' })
  }
  finally {
    loading.value = false
  }
}

function handleStatusFilter(status: string) {
  statusFilter.value = status
  page.value = 1
  fetchOrders()
}

function handleUpdateStatus(order: IOrder, newStatus: string) {
  uni.showModal({
    title: '确认操作',
    content: `确定要将订单 ${order.order_no} 状态改为"${newStatus}"吗？`,
    success: async (res) => {
      if (res.confirm) {
        await updateOrderStatus(order.id, newStatus)
        uni.showToast({ title: '操作成功', icon: 'success' })
        fetchOrders()
      }
    },
  })
}

function getStatusColor(status: string) {
  const map: Record<string, string> = {
    '待付款': '#E7A941',
    '待发货': '#4A90E2',
    '待收货': '#365F47',
    '已完成': '#999',
    '已取消': '#E75E40',
  }
  return map[status] || '#999'
}

onMounted(() => {
  fetchOrders()
})
</script>

<template>
  <view class="admin-orders bg-bg min-h-100vh">
    <!-- 状态筛选 -->
    <scroll-view scroll-x class="status-tabs bg-white px-20rpx py-16rpx flex gap-12rpx border-b border-#F0F0F0">
      <view
        v-for="opt in statusOptions"
        :key="opt"
        class="tab-pill whitespace-nowrap py-8rpx px-20rpx rounded-24rpx text-22rpx"
        :class="statusFilter === opt ? 'bg-primary text-white' : 'bg-#F0F0F0 text-#666'"
        @tap="handleStatusFilter(opt)"
      >
        {{ opt || '全部' }}
      </view>
    </scroll-view>

    <!-- 订单列表 -->
    <view class="order-list p-24rpx flex flex-col gap-20rpx">
      <view v-if="orders.length === 0 && !loading" class="text-center text-text-muted py-80rpx text-26rpx">
        暂无订单
      </view>

      <view
        v-for="order in orders"
        :key="order.id"
        class="order-card bg-white rounded-16rpx p-24rpx shadow-sm"
      >
        <!-- 头部 -->
        <view class="flex justify-between items-center mb-16rpx pb-16rpx border-b border-#F5F5F5">
          <text class="text-22rpx text-text-muted">{{ order.order_no }}</text>
          <text class="text-22rpx font-bold" :style="{ color: getStatusColor(order.status) }">{{ order.status }}</text>
        </view>

        <!-- 买家信息 -->
        <view class="flex justify-between items-center mb-12rpx text-22rpx text-text-muted">
          <text>买家: {{ order.buyer_name || '未知' }}</text>
          <text>{{ order.created_at }}</text>
        </view>

        <!-- 订单项 -->
        <view v-for="item in order.items" :key="item.id" class="flex justify-between items-center py-8rpx text-24rpx">
          <text>{{ item.title }} x{{ item.quantity }}</text>
          <text class="font-bold">¥{{ (item.price * item.quantity).toFixed(2) }}</text>
        </view>

        <!-- 合计 -->
        <view class="flex justify-between items-center pt-16rpx mt-12rpx border-t border-#F5F5F5">
          <text class="text-26rpx">合计: <text class="font-bold text-accent">¥{{ order.total_price.toFixed(2) }}</text></text>
        </view>

        <!-- 操作按钮 -->
        <view class="flex gap-16rpx mt-16rpx pt-16rpx border-t border-#F5F5F5">
          <template v-if="order.status === '待付款'">
            <view class="flex-1 text-center py-12rpx text-22rpx text-#E75E40 font-bold border border-#E75E40 rounded-8rpx" @tap="handleUpdateStatus(order, '已取消')">
              取消订单
            </view>
            <view class="flex-1 text-center py-12rpx text-22rpx text-primary font-bold border border-primary rounded-8rpx" @tap="handleUpdateStatus(order, '待发货')">
              确认付款
            </view>
          </template>
          <template v-else-if="order.status === '待发货'">
            <view class="flex-1 text-center py-12rpx text-22rpx text-primary font-bold border border-primary rounded-8rpx" @tap="handleUpdateStatus(order, '待收货')">
              发货
            </view>
          </template>
          <template v-else-if="order.status === '待收货'">
            <view class="flex-1 text-center py-12rpx text-22rpx text-primary font-bold border border-primary rounded-8rpx" @tap="handleUpdateStatus(order, '已完成')">
              确认完成
            </view>
          </template>
        </view>
      </view>
    </view>
  </view>
</template>
