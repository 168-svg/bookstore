<script setup lang="ts">
definePage({
  style: {
    navigationBarTitleText: '书籍管理',
  },
})

import type { IBook } from '@/api/books'
import { getAdminBooks, deleteBook, updateBook } from '@/api/books'

const books = ref<IBook[]>([])
const total = ref(0)
const page = ref(1)
const keyword = ref('')
const statusFilter = ref('')
const loading = ref(false)

const statusOptions = ['', 'on_sale', 'sold', 'off']
const statusLabels: Record<string, string> = { '': '全部', on_sale: '在售', sold: '已售', off: '下架' }

async function fetchBooks() {
  try {
    loading.value = true
    const params: Record<string, any> = { page: page.value, pageSize: 20 }
    if (keyword.value) params.keyword = keyword.value
    if (statusFilter.value) params.status = statusFilter.value
    const res = await getAdminBooks(params)
    books.value = res.list
    total.value = res.total
  }
  catch {
    uni.showToast({ title: '获取书籍列表失败', icon: 'none' })
  }
  finally {
    loading.value = false
  }
}

function handleSearch() {
  page.value = 1
  fetchBooks()
}

function handleStatusFilter(status: string) {
  statusFilter.value = status
  page.value = 1
  fetchBooks()
}

function handleToggleStatus(book: IBook) {
  const newStatus = book.status === 'on_sale' ? 'off' : 'on_sale'
  uni.showModal({
    title: '确认操作',
    content: `确定要${newStatus === 'off' ? '下架' : '上架'}《${book.title}》吗？`,
    success: async (res) => {
      if (res.confirm) {
        await updateBook(book.id, { status: newStatus })
        uni.showToast({ title: '操作成功', icon: 'success' })
        fetchBooks()
      }
    },
  })
}

function handleDelete(book: IBook) {
  uni.showModal({
    title: '确认删除',
    content: `确定要删除《${book.title}》吗？此操作不可恢复！`,
    success: async (res) => {
      if (res.confirm) {
        await deleteBook(book.id)
        uni.showToast({ title: '删除成功', icon: 'success' })
        fetchBooks()
      }
    },
  })
}

function handleEdit(book: IBook) {
  uni.navigateTo({ url: `/pages/admin/book-edit/index?id=${book.id}` })
}

function getStatusTag(status: string) {
  const map: Record<string, { text: string, class: string }> = {
    on_sale: { text: '在售', class: 'bg-#EBF4EE text-primary' },
    sold: { text: '已售', class: 'bg-#F0F0F0 text-#999' },
    off: { text: '下架', class: 'bg-#FFF3E0 text-#E7A941' },
  }
  return map[status] || { text: status, class: 'bg-#F0F0F0 text-#999' }
}

onMounted(() => {
  fetchBooks()
})
</script>

<template>
  <view class="admin-books bg-bg min-h-100vh">
    <!-- 搜索栏 -->
    <view class="search-bar bg-white px-30rpx py-20rpx flex items-center gap-16rpx">
      <input
        v-model="keyword"
        type="text"
        placeholder="搜索书名/作者"
        class="flex-1 h-64rpx bg-#F5F5F5 rounded-full px-24rpx text-24rpx"
        confirm-type="search"
        @confirm="handleSearch"
      />
    </view>

    <!-- 状态筛选 -->
    <view class="status-tabs flex bg-white px-30rpx py-16rpx gap-16rpx border-b border-#F0F0F0">
      <view
        v-for="opt in statusOptions"
        :key="opt"
        class="tab-pill py-8rpx px-24rpx rounded-24rpx text-22rpx"
        :class="statusFilter === opt ? 'bg-primary text-white' : 'bg-#F0F0F0 text-#666'"
        @tap="handleStatusFilter(opt)"
      >
        {{ statusLabels[opt] }}
      </view>
    </view>

    <!-- 书籍列表 -->
    <view class="book-list p-30rpx flex flex-col gap-20rpx">
      <view v-if="books.length === 0 && !loading" class="text-center text-text-muted py-80rpx text-26rpx">
        暂无书籍数据
      </view>

      <view
        v-for="book in books"
        :key="book.id"
        class="book-card bg-white rounded-16rpx p-24rpx shadow-sm"
      >
        <view class="flex gap-20rpx">
          <view class="book-cover w-120rpx h-160rpx rounded-8rpx flex items-center justify-center text-24rpx text-white font-bold" :style="{ background: book.color }">
            {{ book.title.slice(0, 2) }}
          </view>
          <view class="flex-1 flex flex-col justify-between">
            <view>
              <view class="flex items-center gap-12rpx">
                <text class="text-26rpx font-bold">{{ book.title }}</text>
                <text class="text-18rpx px-8rpx py-2rpx rounded-4rpx" :class="getStatusTag(book.status).class">{{ getStatusTag(book.status).text }}</text>
              </view>
              <text class="text-22rpx text-text-muted">{{ book.author }} · {{ book.condition }}</text>
            </view>
            <view class="flex justify-between items-center">
              <text class="text-accent font-bold text-28rpx">¥{{ book.price.toFixed(2) }}</text>
              <text class="text-20rpx text-text-muted">{{ book.seller_name || '未知卖家' }}</text>
            </view>
          </view>
        </view>
        <view class="flex gap-16rpx mt-20rpx pt-16rpx border-t border-#F5F5F5">
          <view class="flex-1 text-center py-12rpx text-22rpx text-primary font-bold border border-primary rounded-8rpx" @tap="handleEdit(book)">
            编辑
          </view>
          <view class="flex-1 text-center py-12rpx text-22rpx font-bold rounded-8rpx" :class="book.status === 'on_sale' ? 'text-#E7A941 border border-#E7A941' : 'text-primary border border-primary'" @tap="handleToggleStatus(book)">
            {{ book.status === 'on_sale' ? '下架' : '上架' }}
          </view>
          <view class="flex-1 text-center py-12rpx text-22rpx text-#E75E40 font-bold border border-#E75E40 rounded-8rpx" @tap="handleDelete(book)">
            删除
          </view>
        </view>
      </view>
    </view>
  </view>
</template>
