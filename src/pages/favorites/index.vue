<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getFavorites, removeFavorite, type IFavoriteItem } from '@/api/favorites'

definePage({
  style: {
    navigationBarTitleText: '收藏夹',
  },
})

const items = ref<IFavoriteItem[]>([])
const loading = ref(false)

async function fetchFavorites() {
  try {
    loading.value = true
    const res = await getFavorites()
    items.value = res.list
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}

function handleRemove(item: IFavoriteItem) {
  uni.showModal({
    title: '提示',
    content: `确定要取消收藏《${item.title}》吗？`,
    success: async (res) => {
      if (res.confirm) {
        await removeFavorite(item.id)
        uni.showToast({ title: '已取消收藏', icon: 'none' })
        fetchFavorites()
      }
    },
  })
}

function handleDetail(item: IFavoriteItem) {
  uni.navigateTo({ url: `/pages/book-detail/index?id=${item.id}` })
}

onMounted(() => {
  fetchFavorites()
})
</script>

<template>
  <view class="favorites-page bg-bg min-h-100vh">
    <view class="p-30rpx">
      <text class="text-26rpx text-text-muted">共 {{ items.length }} 本</text>
    </view>

    <view v-if="items.length === 0 && !loading" class="empty-state flex flex-col items-center py-160rpx">
      <text class="text-80rpx mb-20rpx">⭐</text>
      <text class="text-28rpx text-text-main mb-12rpx">还没有收藏任何书籍</text>
      <text class="text-22rpx text-text-muted">快去逛逛，发现好书吧～</text>
    </view>

    <view class="fav-list p-30rpx flex flex-col gap-24rpx">
      <view v-for="item in items" :key="item.id" class="fav-card bg-white p-24rpx rounded-20rpx flex gap-20rpx" @tap="handleDetail(item)">
        <view class="w-140rpx h-180rpx rounded-12rpx flex items-center justify-center text-white text-22rpx font-bold flex-shrink-0 shadow" :style="{ background: item.color || '#2c3e50' }">
          {{ item.title.slice(0, 8) }}
        </view>
        <view class="flex-1 flex flex-col gap-8rpx">
          <text class="text-28rpx font-bold line-clamp-2">{{ item.title }}</text>
          <text class="text-24rpx text-text-muted">{{ item.author }}</text>
          <text v-if="item.seller_name" class="text-22rpx text-text-muted">卖家: {{ item.seller_name }}</text>
          <view class="flex items-baseline gap-8rpx">
            <text class="text-30rpx font-bold text-accent">¥{{ Number(item.price).toFixed(2) }}</text>
          </view>
          <view class="flex justify-end">
            <view class="action-btn border border-text-muted text-text-muted py-8rpx px-20rpx rounded-full text-22rpx" @tap.stop="handleRemove(item)">
              取消收藏
            </view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>
