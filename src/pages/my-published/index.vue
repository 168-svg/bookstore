<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getBooks, deleteBook, updateBook, type IBook } from '@/api/books'
import { useUserStore } from '@/store/user'

definePage({
  style: {
    navigationBarTitleText: '我发布的',
  },
})

const userStore = useUserStore()
const books = ref<IBook[]>([])
const loading = ref(false)

async function fetchBooks() {
  try {
    loading.value = true
    const res = await getBooks({ seller_id: userStore.userInfo.userId, pageSize: 50 })
    books.value = res.list
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}

function handleDelete(book: IBook) {
  uni.showModal({
    title: '提示',
    content: `确定要删除《${book.title}》吗？`,
    success: async (res) => {
      if (res.confirm) {
        await deleteBook(book.id)
        uni.showToast({ title: '删除成功', icon: 'success' })
        fetchBooks()
      }
    },
  })
}

function handleToggleStatus(book: IBook) {
  const nextStatus = book.status === 'on_sale' ? 'off_shelf' : 'on_sale'
  uni.showModal({
    title: '提示',
    content: nextStatus === 'on_sale' ? '确定将该书重新上架吗？' : '确定要下架该书吗？',
    success: async (res) => {
      if (res.confirm) {
        await updateBook(book.id, { status: nextStatus })
        uni.showToast({ title: '操作成功', icon: 'success' })
        fetchBooks()
      }
    },
  })
}

function handleEdit(book: IBook) {
  uni.navigateTo({ url: `/pages/admin/book-edit?id=${book.id}` })
}

function handlePublish() {
  uni.navigateTo({ url: '/pages/publish/index' })
}

function statusLabel(status: string) {
  const map: Record<string, string> = {
    on_sale: '在售',
    sold: '已售出',
    off_shelf: '已下架',
  }
  return map[status] || status
}

onMounted(() => {
  fetchBooks()
})
</script>

<template>
  <view class="my-published-page bg-bg min-h-100vh">
    <view class="p-30rpx flex justify-between items-center">
      <text class="text-26rpx text-text-muted">共 {{ books.length }} 本</text>
      <view class="py-12rpx px-24rpx bg-primary text-white text-24rpx rounded-full" @tap="handlePublish">
        + 发布新书
      </view>
    </view>

    <view v-if="books.length === 0 && !loading" class="empty-state flex flex-col items-center py-160rpx">
      <text class="text-80rpx mb-20rpx">📚</text>
      <text class="text-28rpx text-text-main mb-12rpx">还没有发布书籍</text>
      <view class="py-16rpx px-32rpx bg-primary text-white text-26rpx rounded-full mt-20rpx" @tap="handlePublish">
        去发布一本
      </view>
    </view>

    <view class="book-list p-30rpx flex flex-col gap-24rpx">
      <view v-for="book in books" :key="book.id" class="book-card bg-white p-24rpx rounded-20rpx flex gap-20rpx">
        <view class="w-140rpx h-180rpx rounded-12rpx flex items-center justify-center text-white text-22rpx font-bold flex-shrink-0 shadow" :style="{ background: book.color || '#2c3e50' }">
          {{ book.title.slice(0, 8) }}
        </view>
        <view class="flex-1 flex flex-col gap-8rpx">
          <view class="flex items-start justify-between gap-16rpx">
            <text class="text-28rpx font-bold line-clamp-2 flex-1">{{ book.title }}</text>
            <view class="text-22rpx px-12rpx py-4rpx rounded-full flex-shrink-0"
              :class="{
                'bg-green-100 text-green-700': book.status === 'on_sale',
                'bg-gray-100 text-gray-600': book.status !== 'on_sale',
              }">
              {{ statusLabel(book.status) }}
            </view>
          </view>
          <text class="text-24rpx text-text-muted">{{ book.author }}</text>
          <view class="flex items-baseline gap-8rpx">
            <text class="text-30rpx font-bold text-accent">¥{{ Number(book.price).toFixed(2) }}</text>
            <text v-if="book.original_price" class="text-22rpx text-text-muted line-through">¥{{ Number(book.original_price).toFixed(2) }}</text>
          </view>
          <text class="text-20rpx text-text-muted">{{ book.created_at }}</text>

          <view class="flex gap-16rpx mt-12rpx">
            <view class="action-btn border border-border text-text-main py-8rpx px-20rpx rounded-full text-22rpx" @tap="handleEdit(book)">
              编辑
            </view>
            <view class="action-btn border border-primary text-primary py-8rpx px-20rpx rounded-full text-22rpx" @tap="handleToggleStatus(book)">
              {{ book.status === 'on_sale' ? '下架' : '上架' }}
            </view>
            <view class="action-btn border border-accent text-accent py-8rpx px-20rpx rounded-full text-22rpx" @tap="handleDelete(book)">
              删除
            </view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>
