<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import BookCover from '@/components/BookCover.vue'
import { getCategories } from '@/api/categories'
import { getBooks } from '@/api/books'
import type { IBook, ICategory } from '@/api/books'

definePage({
  style: {
    navigationStyle: 'custom',
    navigationBarTitleText: '分类',
  },
})

const categories = ref<ICategory[]>([])
const books = ref<IBook[]>([])
const loading = ref(false)

const activeCategory = ref('')
const activeSubId = ref<number | null>(null)

const currentCategory = computed(() => {
  return categories.value.find(c => c.name === activeCategory.value)
})

const filteredBooks = computed(() => {
  if (activeSubId.value != null) {
    return books.value.filter(b => b.sub_category_id === activeSubId.value)
  }
  // 仅主分类筛选
  const cat = categories.value.find(c => c.name === activeCategory.value)
  if (cat && cat.subs) {
    const subIds = cat.subs.map(s => s.id)
    return books.value.filter(b => subIds.includes(b.sub_category_id!))
  }
  return books.value
})

async function loadData() {
  loading.value = true
  try {
    const [cats, booksRes] = await Promise.all([
      getCategories(),
      getBooks({ page: 1, pageSize: 100 }),
    ])
    categories.value = cats || []
    books.value = booksRes.list || []
    if (categories.value.length > 0) {
      activeCategory.value = categories.value[0].name
    }
  } catch (err) {
    console.error('加载失败', err)
    // 提供兜底数据
    categories.value = [
      { id: 1, name: '文学小说', sort_order: 0, subs: [{ id: 1, name: '现代文学', color: '#E2DFD7' }, { id: 2, name: '外国文学', color: '#D4D0C5' }, { id: 3, name: '经典名著', color: '#C7C2B4' }] },
      { id: 2, name: '社科经管', sort_order: 1, subs: [{ id: 4, name: '经济学', color: '#E5E2DA' }, { id: 5, name: '管理学', color: '#D8D4C9' }] },
      { id: 3, name: '历史传记', sort_order: 2, subs: [{ id: 6, name: '中国历史', color: '#D9D3C7' }, { id: 7, name: '人物传记', color: '#C5BDA9' }] },
    ]
    activeCategory.value = categories.value[0].name
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})

function handleCategoryClick(name: string) {
  activeCategory.value = name
  activeSubId.value = null
}

function handleSubClick(subId: number) {
  activeSubId.value = activeSubId.value === subId ? null : subId
}

function handleBookClick(book: IBook) {
  uni.navigateTo({
    url: `/pages/book-detail/index?id=${book.id}`,
  })
}
</script>

<template>
  <view class="category-page bg-bg">
    <!-- 搜索框 -->
    <view class="search-box bg-white px-30rpx py-20rpx shadow-sm">
      <view class="search-input bg-bg h-72rpx rounded-full flex items-center px-30rpx text-text-muted text-26rpx">
        <text class="mr-16rpx">🔍</text>
        <text>搜索分类 / 书名</text>
      </view>
    </view>

    <!-- 分类容器 -->
    <view class="category-container flex flex-1 bg-white" style="min-height: calc(100vh - 200rpx);">
      <!-- 左侧分类导航 -->
      <scroll-view class="category-sidebar w-200rpx bg-bg" scroll-y>
        <view
          v-for="cat in categories"
          :key="cat.id"
          class="sidebar-item py-32rpx px-20rpx text-24rpx text-center text-text-muted"
          :class="{ active: activeCategory === cat.name }"
          @tap="handleCategoryClick(cat.name)"
        >
          {{ cat.name }}
        </view>
      </scroll-view>

      <!-- 右侧内容 -->
      <scroll-view class="category-content flex-1 p-30rpx" scroll-y>
        <!-- 子分类标签 -->
        <view v-if="currentCategory" class="mb-30rpx">
          <text class="cat-group-title text-28rpx font-bold mb-20rpx block">{{ currentCategory.name }}</text>
          <view class="flex flex-wrap gap-16rpx">
            <view
              class="py-12rpx px-24rpx rounded-full text-24rpx bg-bg border"
              :class="activeSubId === null ? 'active' : ''"
              @tap="activeSubId = null"
            >
              全部
            </view>
            <view
              v-for="sub in currentCategory.subs"
              :key="sub.id"
              class="py-12rpx px-24rpx rounded-full text-24rpx bg-bg border"
              :class="{ active: activeSubId === sub.id }"
              @tap="handleSubClick(sub.id)"
            >
              {{ sub.name }}
            </view>
          </view>
        </view>

        <!-- 书籍网格 -->
        <view class="books-section">
          <view class="flex justify-between items-center mb-20rpx">
            <text class="text-26rpx font-bold">相关书籍 ({{ filteredBooks.length }})</text>
          </view>

          <view v-if="loading" class="text-center py-80rpx text-text-muted text-24rpx">加载中...</view>

          <view v-else-if="filteredBooks.length === 0" class="text-center py-80rpx text-text-muted text-24rpx">
            该分类下暂无书籍
          </view>

          <view v-else class="cat-book-grid grid grid-cols-2 gap-20rpx">
            <view
              v-for="book in filteredBooks"
              :key="book.id"
              class="book-item bg-bg rounded-20rpx p-20rpx shadow-sm"
              @tap="handleBookClick(book)"
            >
              <BookCover :title="book.title" :color="book.color || '#365F47'" height="240rpx" />
              <text class="text-24rpx font-bold truncate block mt-16rpx">{{ book.title }}</text>
              <text class="text-20rpx text-text-muted truncate block">{{ book.author }}</text>
              <view class="flex items-baseline justify-between mt-8rpx">
                <text class="text-accent font-bold text-26rpx">¥{{ Number(book.price).toFixed(2) }}</text>
                <text v-if="book.condition" class="text-18rpx text-text-muted">{{ book.condition }}</text>
              </view>
            </view>
          </view>
        </view>
      </scroll-view>
    </view>
  </view>
</template>

<style scoped>
.category-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.category-container {
  flex: 1;
}

.sidebar-item.active {
  background: #FFFFFF;
  color: #365F47;
  font-weight: bold;
  position: relative;
}

.sidebar-item.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 30rpx;
  bottom: 30rpx;
  width: 8rpx;
  background: #365F47;
  border-radius: 0 4rpx 4rpx 0;
}

.book-item .active,
.pill-chip.active,
.py-12rpx.px-24rpx.rounded-full.text-24rpx.bg-bg.border.active {
  background: #365F47;
  color: #fff;
  border-color: #365F47;
  font-weight: 600;
}
</style>
