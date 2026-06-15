<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import BookCover from '@/components/BookCover.vue'
import type { IBook } from '@/api/books'
import { getBooks } from '@/api/books'
import { getCategories } from '@/api/categories'
import type { ICategory } from '@/api/categories'

definePage({
  type: 'home',
  style: {
    navigationStyle: 'custom',
    navigationBarTitleText: '首页',
  },
})

const bannerList = [
  { title: '好书不贵 知识传递', subtitle: '发现心仪的二手书', color: '#E6E1D6', accent: '#365F47' },
  { title: '新书上架 限时特惠', subtitle: '本周热门 9 折起', color: '#DFD9CD', accent: '#E75E40' },
  { title: '以书会友 分享阅读', subtitle: '数万本二手书任你选', color: '#E2DDD1', accent: '#4A3E3D' },
]

const kingzoneItems = [
  { icon: '📚', text: '分类', color: '#365F47', action: 'category' },
  { icon: '💰', text: '低价区', color: '#E75E40', action: 'cheap' },
  { icon: '✨', text: '新上架', color: '#E7A941', action: 'new' },
  { icon: '🔍', text: '求书区', color: '#4A90E2', action: 'search' },
]

const books = ref<IBook[]>([])
const categories = ref<ICategory[]>([])
const loading = ref(false)
const keyword = ref('')
const activeCategory = ref<number | null>(null)
const activeSort = ref('latest')

const sortOptions = [
  { key: 'latest', label: '最新' },
  { key: 'price_asc', label: '价格升' },
  { key: 'price_desc', label: '价格降' },
]

const displayedBooks = computed(() => {
  let list = [...books.value]
  if (keyword.value.trim()) {
    const kw = keyword.value.trim().toLowerCase()
    list = list.filter(b =>
      (b.title || '').toLowerCase().includes(kw) ||
      (b.author || '').toLowerCase().includes(kw) ||
      (b.isbn || '').includes(kw),
    )
  }
  if (activeCategory.value != null) {
    list = list.filter(b => b.sub_category_id === activeCategory.value)
  }
  if (activeSort.value === 'price_asc') {
    list.sort((a, b) => a.price - b.price)
  } else if (activeSort.value === 'price_desc') {
    list.sort((a, b) => b.price - a.price)
  }
  return list
})

async function fetchData() {
  loading.value = true
  try {
    const [booksRes, categoriesRes] = await Promise.all([
      getBooks({ page: 1, pageSize: 50 }),
      getCategories(),
    ])
    books.value = booksRes.list || []
    categories.value = categoriesRes || []
  } catch (err) {
    console.error('加载失败', err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchData()
})

function handleKingzoneClick(action: string) {
  if (action === 'category') {
    uni.switchTab({ url: '/pages/category/index' })
  } else if (action === 'cheap') {
    activeSort.value = 'price_asc'
    uni.showToast({ title: '已按价格升序', icon: 'none' })
  } else if (action === 'new') {
    activeSort.value = 'latest'
    uni.showToast({ title: '已按最新排序', icon: 'none' })
  } else if (action === 'search') {
    uni.showToast({ title: '请在搜索框输入关键词', icon: 'none' })
  }
}

function handleBookClick(book: IBook) {
  uni.navigateTo({
    url: `/pages/book-detail/index?id=${book.id}`,
  })
}

function handleCategorySelect(subCatId: number | null) {
  activeCategory.value = subCatId
}

function handleSortChange(key: string) {
  activeSort.value = key
}

function handleSearchConfirm() {
  // 搜索已通过 computed 实时生效
  uni.showToast({ title: `搜索: ${keyword.value}`, icon: 'none' })
}

function clearKeyword() {
  keyword.value = ''
}
</script>

<template>
  <view class="home-page bg-bg">
    <!-- 搜索框 -->
    <view class="search-box px-30rpx pt-30rpx pb-20rpx bg-white shadow-sm">
      <view class="search-input bg-bg h-72rpx rounded-full flex items-center px-30rpx text-text-muted text-26rpx">
        <text class="mr-16rpx">🔍</text>
        <input
          v-model="keyword"
          class="flex-1 text-text-main text-26rpx"
          placeholder="搜索书名 / 作者 / ISBN"
          confirm-type="search"
          @confirm="handleSearchConfirm"
        />
        <text v-if="keyword" class="ml-12rpx text-24rpx text-text-muted" @tap="clearKeyword">✕</text>
      </view>
    </view>

    <!-- 轮播 Banner -->
    <swiper
      class="banner mx-30rpx my-30rpx rounded-24rpx"
      :autoplay="true"
      :interval="4000"
      :circular="true"
      indicator-dots
      indicator-color="rgba(0,0,0,0.2)"
      indicator-active-color="#365F47"
    >
      <swiper-item v-for="(b, i) in bannerList" :key="i">
        <view
          class="banner-item h-240rpx rounded-24rpx px-40rpx flex flex-col justify-center"
          :style="{ background: b.color }"
        >
          <text class="text-36rpx font-bold" :style="{ color: b.accent }">{{ b.title }}</text>
          <text class="text-24rpx text-text-muted mt-10rpx">{{ b.subtitle }}</text>
        </view>
      </swiper-item>
    </swiper>

    <!-- 快捷入口 -->
    <view class="kingzone-grid grid grid-cols-4 px-30rpx py-20rpx text-center gap-20rpx bg-white rounded-24rpx mx-30rpx mb-30rpx">
      <view
        v-for="item in kingzoneItems"
        :key="item.text"
        class="kingzone-item flex flex-col items-center text-24rpx font-medium"
        @tap="handleKingzoneClick(item.action)"
      >
        <view
          class="kingzone-icon w-88rpx h-88rpx rounded-full flex items-center justify-center mb-12rpx"
          :style="{ background: item.color + '20', color: item.color }"
        >
          <text class="text-44rpx">{{ item.icon }}</text>
        </view>
        <text>{{ item.text }}</text>
      </view>
    </view>

    <!-- 分类横向滚动 -->
    <scroll-view class="category-scroll px-30rpx mb-24rpx" scroll-x>
      <view class="flex gap-16rpx">
        <view
          class="pill-chip px-28rpx py-12rpx rounded-full text-24rpx bg-white"
          :class="{ active: activeCategory === null }"
          @tap="handleCategorySelect(null)"
        >
          全部分类
        </view>
        <template v-for="cat in categories" :key="cat.id">
          <view
            v-for="sub in cat.subs"
            :key="sub.id"
            class="pill-chip px-28rpx py-12rpx rounded-full text-24rpx bg-white"
            :class="{ active: activeCategory === sub.id }"
            @tap="handleCategorySelect(sub.id)"
          >
            {{ sub.name }}
          </view>
        </template>
      </view>
    </scroll-view>

    <!-- 排序与标题 -->
    <view class="section-header flex justify-between items-center px-30rpx py-20rpx font-bold text-30rpx">
      <text>为你推荐 ({{ displayedBooks.length }})</text>
      <view class="flex gap-12rpx">
        <view
          v-for="opt in sortOptions"
          :key="opt.key"
          class="text-22rpx font-normal text-text-muted px-20rpx py-8rpx rounded-full bg-white"
          :class="{ active: activeSort === opt.key }"
          @tap="handleSortChange(opt.key)"
        >{{ opt.label }}</view>
      </view>
    </view>

    <!-- 书籍列表 -->
    <view v-if="loading" class="text-center py-60rpx text-text-muted text-24rpx">
      加载中...
    </view>
    <view v-else-if="displayedBooks.length === 0" class="text-center py-80rpx text-text-muted text-24rpx">
      暂无书籍，换个分类试试吧
    </view>
    <view v-else class="books-grid grid grid-cols-3 gap-24rpx px-30rpx pb-30rpx">
      <view
        v-for="book in displayedBooks"
        :key="book.id"
        class="book-card bg-white rounded-20rpx overflow-hidden shadow-sm"
        @tap="handleBookClick(book)"
      >
        <BookCover :title="book.title" :color="book.color || '#365F47'" height="240rpx" />
        <view class="p-16rpx">
          <text class="book-card-title text-24rpx font-bold truncate block">{{ book.title }}</text>
          <text class="book-card-author text-20rpx text-text-muted mb-8rpx block truncate">{{ book.author }}</text>
          <view class="flex items-baseline justify-between">
            <text class="book-card-price text-26rpx font-bold text-accent">¥{{ Number(book.price).toFixed(2) }}</text>
            <text v-if="book.condition" class="text-18rpx text-text-muted">{{ book.condition }}</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<style scoped>
.home-page {
  min-height: 100vh;
  padding-bottom: 120rpx;
}

.book-card-title {
  line-height: 1.3;
}

.pill-chip.active {
  background: #365F47;
  color: #fff;
  font-weight: 600;
}

.category-scroll {
  white-space: nowrap;
}
</style>
