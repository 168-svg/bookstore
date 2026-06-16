<script setup lang="ts">
import BookCover from '@/components/BookCover.vue'
import { useCartStore } from '@/store'
import { createOrder } from '@/api/orders'

definePage({
  style: {
    navigationBarTitleText: '订单确认',
  },
})

const cartStore = useCartStore()
const submitting = ref(false)

const address = ref({
  name: '张同学',
  phone: '138****1234',
  detail: '浙江省杭州市西湖区文三路123号',
})

const showAddressModal = ref(false)

const shippingFee = 3.00
const subTotal = computed(() => cartStore.totalPrice)
const finalPay = computed(() => subTotal.value + shippingFee)

function openAddressModal() {
  showAddressModal.value = true
}

function saveAddress() {
  showAddressModal.value = false
  uni.showToast({ title: '地址已更新', icon: 'none' })
}

async function handleSubmitOrder() {
  if (cartStore.checkedItems.length === 0) {
    uni.showToast({
      title: '没有可以提交的订单项',
      icon: 'none',
    })
    return
  }
  if (submitting.value) return

  uni.showModal({
    title: '确认下单',
    content: `订单合计 ¥${finalPay.value.toFixed(2)}，确认下单吗？`,
    success: async (res) => {
      if (!res.confirm) return

      submitting.value = true
      try {
        const addressText = `${address.value.name} ${address.value.phone} ${address.value.detail}`
        await createOrder({ address: addressText })
        cartStore.clearCheckedItems()

        uni.showToast({ title: '订单提交成功', icon: 'success' })
        setTimeout(() => {
          uni.redirectTo({ url: '/pages/orders/index' })
        }, 1000)
      }
      catch (err) {
        console.error(err)
      }
      finally {
        submitting.value = false
      }
    },
  })
}
</script>

<template>
  <view class="order-confirm-page bg-bg min-h-100vh pb-200rpx">
    <view class="order-confirm-container p-30rpx flex flex-col gap-24rpx">
      <!-- 地址卡片 -->
      <view class="address-card bg-white rounded-20rpx p-30rpx shadow-sm" @tap="openAddressModal">
        <view class="flex items-start gap-16rpx">
          <view class="w-64rpx h-64rpx rounded-full bg-#F5F2EA flex items-center justify-center">
            <text class="text-32rpx">📍</text>
          </view>
          <view class="flex-1">
            <view class="flex items-baseline gap-16rpx mb-8rpx">
              <text class="text-28rpx font-bold">{{ address.name }}</text>
              <text class="text-24rpx text-text-muted">{{ address.phone }}</text>
            </view>
            <text class="text-24rpx text-text-main block">{{ address.detail }}</text>
          </view>
          <text class="text-28rpx text-text-muted">›</text>
        </view>
      </view>

      <!-- 清单卡片 -->
      <view class="summary-card bg-white rounded-20rpx p-30rpx shadow-sm">
        <text class="text-26rpx font-bold mb-20rpx block">商品清单</text>

        <view v-if="cartStore.checkedItems.length === 0" class="text-center py-40rpx text-24rpx text-text-muted">
          购物车中没有选中的商品
          <view class="mt-20rpx bg-primary text-white px-40rpx py-16rpx rounded-full inline-block text-24rpx font-bold" @tap="() => uni.switchTab({ url: '/pages/cart/index' })">去购物车</view>
        </view>

        <view class="flex flex-col gap-24rpx">
          <view
            v-for="item in cartStore.checkedItems"
            :key="item.id"
            class="flex items-start gap-20rpx border-b border-border pb-24rpx last:border-b-0 last:pb-0"
          >
            <BookCover :title="item.title" :color="item.color" width="100rpx" height="140rpx" font-size="20rpx" />
            <view class="flex-1 flex flex-col gap-8rpx">
              <text class="text-26rpx font-bold line-clamp-2">{{ item.title }}</text>
              <text class="text-22rpx text-text-muted">{{ item.author }}</text>
              <text v-if="item.condition" class="text-20rpx text-primary bg-#EBF4EE px-12rpx py-4rpx rounded-8rpx w-fit">{{ item.condition }}</text>
            </view>
            <view class="text-right">
              <text class="text-26rpx font-bold text-accent block">¥{{ (item.price * item.quantity).toFixed(2) }}</text>
              <text class="text-20rpx text-text-muted">x{{ item.quantity }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 费用明细 -->
      <view class="fee-card bg-white rounded-20rpx p-30rpx shadow-sm">
        <view class="flex justify-between py-12rpx">
          <text class="text-24rpx text-text-muted">商品金额</text>
          <text class="text-24rpx">¥{{ subTotal.toFixed(2) }}</text>
        </view>
        <view class="flex justify-between py-12rpx">
          <text class="text-24rpx text-text-muted">运费</text>
          <text class="text-24rpx">¥{{ shippingFee.toFixed(2) }}</text>
        </view>
        <view class="flex justify-between pt-20rpx mt-12rpx border-t border-border">
          <text class="text-28rpx font-bold">应付金额</text>
          <text class="text-32rpx font-bold text-accent">¥{{ finalPay.toFixed(2) }}</text>
        </view>
      </view>

      <!-- 支付方式 -->
      <view class="pay-card bg-white rounded-20rpx p-30rpx shadow-sm flex justify-between items-center">
        <text class="text-26rpx">支付方式</text>
        <view class="flex items-center gap-12rpx">
          <text class="text-48rpx">💚</text>
          <text class="text-26rpx">微信支付</text>
          <text class="text-24rpx text-text-muted">›</text>
        </view>
      </view>
    </view>

    <!-- 底部操作栏 -->
    <view class="detail-bottom-actions fixed bottom-0 w-full bg-white border-t border-border flex justify-between items-center px-30rpx py-24rpx pb-safe shadow">
      <view class="flex-1">
        <text class="text-22rpx text-text-muted block">实付款</text>
        <text class="text-34rpx font-bold text-accent">¥{{ finalPay.toFixed(2) }}</text>
      </view>
      <view
        class="btn-solid bg-primary text-white py-20rpx px-48rpx rounded-full font-bold text-28rpx"
        :class="{ 'opacity-50': cartStore.checkedItems.length === 0 }"
        @tap="handleSubmitOrder"
      >
        提交订单
      </view>
    </view>

    <!-- 地址编辑弹窗 -->
    <view v-if="showAddressModal" class="modal-mask fixed inset-0 bg-#00000066 flex items-end justify-center z-999" @tap="showAddressModal = false">
      <view class="modal-content bg-white rounded-t-32rpx p-40rpx w-full" @tap.stop>
        <text class="text-34rpx font-bold mb-30rpx block">编辑收货地址</text>

        <view class="flex flex-col gap-24rpx mb-30rpx">
          <view class="form-item flex flex-col gap-12rpx">
            <text class="text-24rpx">收货人</text>
            <input v-model="address.name" class="border border-border bg-bg p-20rpx rounded-16rpx text-26rpx" />
          </view>
          <view class="form-item flex flex-col gap-12rpx">
            <text class="text-24rpx">手机号</text>
            <input v-model="address.phone" class="border border-border bg-bg p-20rpx rounded-16rpx text-26rpx" />
          </view>
          <view class="form-item flex flex-col gap-12rpx">
            <text class="text-24rpx">详细地址</text>
            <textarea v-model="address.detail" class="w-full h-160rpx border border-border bg-bg p-20rpx rounded-16rpx text-26rpx" />
          </view>
        </view>

        <view class="flex gap-20rpx">
          <view class="flex-1 bg-bg text-text-main py-24rpx rounded-44rpx font-bold text-28rpx text-center" @tap="showAddressModal = false">取消</view>
          <view class="flex-1 bg-primary text-white py-24rpx rounded-44rpx font-bold text-28rpx text-center" @tap="saveAddress">保存</view>
        </view>
      </view>
    </view>
  </view>
</template>

<style scoped>
.line-clamp-2 {
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
</style>
