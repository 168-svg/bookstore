<script setup lang="ts">
import BookCover from '@/components/BookCover.vue'
import { useCartStore } from '@/store'

definePage({
  style: {
    navigationBarTitleText: '购物车',
  },
})

const cartStore = useCartStore()

function handleCheckout() {
  if (cartStore.checkedItems.length === 0) {
    uni.showToast({ title: '请选择要结算的商品', icon: 'none' })
    return
  }
  uni.navigateTo({ url: '/pages/order-confirm/index' })
}

function handleRemoveItem(id: string, title: string) {
  uni.showModal({
    title: '提示',
    content: `确定要从购物车中移除《${title}》吗？`,
    success: (res) => {
      if (res.confirm) {
        cartStore.removeItem(id)
        uni.showToast({ title: '已移除', icon: 'none' })
      }
    },
  })
}

function handleClearAll() {
  if (cartStore.items.length === 0) return
  uni.showModal({
    title: '提示',
    content: '确定要清空购物车吗？',
    success: (res) => {
      if (res.confirm) {
        cartStore.clearAll()
        uni.showToast({ title: '已清空', icon: 'none' })
      }
    },
  })
}

function goToHome() {
  uni.switchTab({ url: '/pages/index/index' })
}
</script>

<template>
  <view class="cart-page bg-bg min-h-100vh">
    <!-- 头部操作栏 -->
    <view v-if="cartStore.items.length > 0" class="cart-header bg-white px-30rpx py-20rpx flex justify-between items-center mb-20rpx">
      <text class="text-28rpx font-bold">共 {{ cartStore.totalCount }} 件商品</text>
      <view class="text-24rpx text-text-muted" @tap="handleClearAll">清空</view>
    </view>

    <!-- 空状态 -->
    <view v-if="cartStore.items.length === 0" class="empty-state flex flex-col items-center justify-center py-200rpx">
      <view class="w-240rpx h-240rpx rounded-full bg-white flex items-center justify-center mb-30rpx shadow-sm">
        <text class="text-80rpx text-text-muted">🛒</text>
      </view>
      <text class="text-28rpx text-text-main mb-12rpx">购物车空空如也</text>
      <text class="text-22rpx text-text-muted mb-40rpx">去逛逛，发现心仪的二手书</text>
      <view class="bg-primary text-white px-48rpx py-20rpx rounded-full text-26rpx font-bold" @tap="goToHome">
        去首页看看
      </view>
    </view>

    <!-- 商品列表 -->
    <view class="cart-list px-30rpx flex flex-col gap-20rpx pb-200rpx">
      <view
        v-for="item in cartStore.items"
        :key="item.id"
        class="cart-item bg-white rounded-20rpx p-24rpx shadow-sm"
      >
        <view class="flex items-start gap-16rpx">
          <!-- 选择框 -->
          <view
            class="mock-checkbox w-40rpx h-40rpx rounded-full border-4rpx flex items-center justify-center mt-60rpx"
            :class="{ checked: item.checked }"
            @tap="cartStore.toggleChecked(item.id)"
          />

          <!-- 封面 -->
          <BookCover :title="item.title" :color="item.color" width="140rpx" height="180rpx" font-size="24rpx" />

          <!-- 信息 -->
          <view class="cart-item-info flex-1 flex flex-col gap-8rpx">
            <text class="cart-item-title text-26rpx font-bold line-clamp-2 leading-tight">{{ item.title }}</text>
            <text class="cart-item-meta text-22rpx text-text-muted">{{ item.author }}</text>
            <text v-if="item.condition" class="cart-item-meta text-20rpx text-primary bg-#EBF4EE px-12rpx py-4rpx rounded-8rpx w-fit mt-4rpx">{{ item.condition }}</text>

            <view class="cart-item-bottom flex justify-between items-center mt-16rpx">
              <text class="text-accent font-bold text-30rpx">¥{{ Number(item.price).toFixed(2) }}</text>
              <view class="flex items-center gap-16rpx">
                <view class="text-22rpx text-text-muted" @tap="handleRemoveItem(item.id, item.title)">删除</view>
                <view class="quantity-stepper flex border border-border rounded-8rpx overflow-hidden">
                  <view
                    class="step-btn w-56rpx h-48rpx bg-bg flex items-center justify-center text-28rpx"
                    @tap="cartStore.updateQuantity(item.id, -1)"
                  >
                    −
                  </view>
                  <view class="step-num w-56rpx h-48rpx flex items-center justify-center text-24rpx bg-white">
                    {{ item.quantity }}
                  </view>
                  <view
                    class="step-btn w-56rpx h-48rpx bg-bg flex items-center justify-center text-28rpx"
                    @tap="cartStore.updateQuantity(item.id, 1)"
                  >
                    +
                  </view>
                </view>
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 底部结算栏 -->
    <view v-if="cartStore.items.length > 0" class="cart-footer-bar fixed bottom-0 w-full bg-white border-t border-border flex justify-between items-center px-30rpx py-24rpx pb-safe shadow">
      <view class="flex items-center gap-16rpx">
        <view
          class="mock-checkbox w-40rpx h-40rpx rounded-full border-4rpx flex items-center justify-center"
          :class="{ checked: cartStore.isAllChecked }"
          @tap="cartStore.toggleAllChecked"
        />
        <text class="text-24rpx">全选</text>
      </view>
      <view class="flex items-center gap-24rpx">
        <view class="text-right">
          <view class="text-22rpx text-text-muted">已选 {{ cartStore.checkedCount }} 件</view>
          <view class="text-28rpx">合计: <text class="text-accent font-bold text-32rpx">¥{{ cartStore.totalPrice.toFixed(2) }}</text></view>
        </view>
        <view
          class="btn-checkout bg-primary text-white py-20rpx px-48rpx rounded-full text-26rpx font-bold"
          :class="{ 'opacity-50': cartStore.checkedItems.length === 0 }"
          @tap="handleCheckout"
        >
          去结算
        </view>
      </view>
    </view>
  </view>
</template>

<style scoped>
.mock-checkbox.checked {
  background: #365F47;
  border-color: #365F47;
  color: #fff;
}

.mock-checkbox.checked::before {
  content: '✓';
  font-size: 24rpx;
  font-weight: bold;
}

.line-clamp-2 {
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
</style>
