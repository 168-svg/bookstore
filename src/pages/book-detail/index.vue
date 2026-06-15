<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import BookCover from '@/components/BookCover.vue'
import { useCartStore, useFavoriteStore } from '@/store'
import { getBookDetail, type IBook } from '@/api/books'
import { getBookReviews, createReview, type IReview } from '@/api/reviews'

definePage({
  style: {
    navigationBarTitleText: '书籍详情',
  },
})

const cartStore = useCartStore()
const favoriteStore = useFavoriteStore()

const bookId = ref<number | null>(null)
const book = ref<IBook | null>(null)
const reviews = ref<IReview[]>([])
const reviewTotal = ref(0)
const avgRating = ref(0)
const loading = ref(false)

// 评论输入
const showReviewModal = ref(false)
const newReview = ref({ rating: 5, content: '' })

// 数量
const quantity = ref(1)

// 模拟评分星星
const stars = computed(() => {
  const full = Math.floor(avgRating.value)
  const hasHalf = avgRating.value - full >= 0.3
  const arr = []
  for (let i = 0; i < 5; i++) {
    if (i < full) arr.push('★')
    else if (i === full && hasHalf) arr.push('☆')
    else arr.push('☆')
  }
  return arr
})

const isFav = computed(() => (book.value ? favoriteStore.isFavorite(book.value.id) : false))

onLoad((options) => {
  if (options?.id) {
    bookId.value = Number(options.id)
    loadData()
  } else {
    // 兼容旧的参数方式
    const title = decodeURIComponent(options?.title || '小王子')
    const author = decodeURIComponent(options?.author || '圣埃克苏佩里')
    const price = Number(options?.price) || 6.5
    const color = decodeURIComponent(options?.color || '#294a4f')
    book.value = {
      id: 0,
      title,
      author,
      price,
      original_price: price * 2,
      color,
      condition: '8成新',
      publisher: '译林出版社',
      publish_date: '2015-05',
      isbn: '',
      description: `${title} 是一本写给所有人的童话。关于爱、责任与孤独。`,
      cover_url: '',
      seller_id: 1,
      seller_name: '小太阳',
      sub_category_id: null,
      sub_category_name: '外国文学',
      status: 'on_sale',
      created_at: '',
      updated_at: '',
    }
  }
})

async function loadData() {
  if (!bookId.value) return
  loading.value = true
  try {
    const [bookRes, reviewRes] = await Promise.all([
      getBookDetail(bookId.value),
      getBookReviews(bookId.value),
    ])
    book.value = bookRes
    reviews.value = reviewRes.list || []
    reviewTotal.value = reviewRes.total || 0
    avgRating.value = reviewRes.avgRating || 0
  } catch (err) {
    console.error('详情加载失败', err)
  } finally {
    loading.value = false
  }
}

function handleAddToCart() {
  if (!book.value) return
  const b = book.value
  for (let i = 0; i < quantity.value; i++) {
    cartStore.addItem({
      title: b.title,
      author: b.author,
      price: b.price,
      color: b.color,
      condition: b.condition,
    })
  }
  uni.showToast({ title: '已加入购物车', icon: 'success' })
}

function handleBuyNow() {
  if (!book.value) return
  const b = book.value
  cartStore.uncheckAll()
  for (let i = 0; i < quantity.value; i++) {
    cartStore.addItem({
      title: b.title,
      author: b.author,
      price: b.price,
      color: b.color,
      condition: b.condition,
    })
  }
  uni.navigateTo({ url: '/pages/order-confirm/index' })
}

function handleToggleFavorite() {
  if (!book.value) return
  const b = book.value
  const added = favoriteStore.toggle({
    id: b.id,
    title: b.title,
    author: b.author,
    price: b.price,
    color: b.color,
    condition: b.condition,
    seller_name: b.seller_name,
    added_at: '',
  })
  uni.showToast({ title: added ? '已收藏' : '已取消收藏', icon: 'none' })
}

function handleShare() {
  uni.showToast({ title: '已复制分享链接', icon: 'none' })
}

function openReviewModal() {
  showReviewModal.value = true
}

async function submitReview() {
  if (!bookId.value || !newReview.value.content.trim()) {
    uni.showToast({ title: '请输入评论内容', icon: 'none' })
    return
  }
  try {
    await createReview({
      book_id: bookId.value,
      rating: newReview.value.rating,
      content: newReview.value.content,
    })
    uni.showToast({ title: '评论成功', icon: 'success' })
    newReview.value = { rating: 5, content: '' }
    showReviewModal.value = false
    loadData()
  } catch (err) {
    console.error('评论失败', err)
  }
}
</script>

<template>
  <view class="detail-page bg-bg">
    <view v-if="loading" class="text-center py-120rpx text-text-muted text-24rpx">加载中...</view>

    <template v-else-if="book">
      <!-- 封面区域 -->
      <view class="detail-cover-sec flex justify-center py-50rpx bg-#EFECE6 relative">
        <BookCover :title="book.title" :color="book.color || '#365F47'" width="260rpx" height="360rpx" font-size="36rpx" />

        <view class="fav-btn absolute right-30rpx top-30rpx w-72rpx h-72rpx rounded-full bg-white flex items-center justify-center shadow" @tap="handleToggleFavorite">
          <text class="text-36rpx" :class="isFav ? 'text-accent' : 'text-text-muted'">{{ isFav ? '♥' : '♡' }}</text>
        </view>
      </view>

      <!-- 信息块 -->
      <view class="detail-info-block bg-white p-30rpx mb-20rpx">
        <view class="detail-price-row flex items-baseline gap-16rpx mb-16rpx">
          <text class="price-now text-48rpx font-bold text-accent">¥{{ Number(book.price).toFixed(2) }}</text>
          <text v-if="book.original_price" class="price-old text-24rpx text-text-muted line-through">¥{{ Number(book.original_price).toFixed(2) }}</text>
          <text v-if="book.condition" class="condition-tag bg-#EBF4EE text-primary text-20rpx px-12rpx py-4rpx rounded-8rpx font-bold">{{ book.condition }}</text>
          <text v-if="book.sub_category_name" class="condition-tag bg-#F5F0E0 text-#8B6914 text-20rpx px-12rpx py-4rpx rounded-8rpx">{{ book.sub_category_name }}</text>
        </view>

        <text class="detail-title text-34rpx font-bold mb-8rpx block">{{ book.title }}</text>
        <text class="detail-author text-26rpx text-text-muted mb-16rpx block">{{ book.author }}</text>

        <!-- 评分 -->
        <view class="rating-row flex items-center gap-12rpx mb-20rpx">
          <text class="text-28rpx text-#E7A941">
            <text v-for="(s, i) in stars" :key="i">{{ s }}</text>
          </text>
          <text class="text-24rpx text-text-muted">{{ avgRating.toFixed(1) }} 分</text>
          <text class="text-24rpx text-text-muted">· {{ reviewTotal }} 条评论</text>
        </view>

        <!-- 元数据 -->
        <view class="metadata-list border-t border-border pt-24rpx flex flex-col gap-12rpx text-24rpx">
          <view class="metadata-item flex">
            <text class="metadata-label text-text-muted w-160rpx">出版社</text>
            <text class="text-text-main flex-1">{{ book.publisher || '-' }}</text>
          </view>
          <view class="metadata-item flex">
            <text class="metadata-label text-text-muted w-160rpx">出版时间</text>
            <text class="text-text-main flex-1">{{ book.publish_date || '-' }}</text>
          </view>
          <view class="metadata-item flex">
            <text class="metadata-label text-text-muted w-160rpx">ISBN</text>
            <text class="text-text-main flex-1">{{ book.isbn || '-' }}</text>
          </view>
        </view>
      </view>

      <!-- 描述块 -->
      <view class="detail-desc-block bg-white p-30rpx mb-20rpx">
        <text class="block-title text-28rpx font-bold mb-16rpx block">书籍描述</text>
        <text class="block-content text-24rpx text-#555 leading-relaxed block whitespace-pre-line">{{ book.description || '暂无描述' }}</text>
      </view>

      <!-- 评论块 -->
      <view class="review-block bg-white p-30rpx mb-20rpx">
        <view class="flex justify-between items-center mb-20rpx">
          <text class="block-title text-28rpx font-bold">读者评价 ({{ reviewTotal }})</text>
          <view class="btn-outline-small border border-primary text-primary text-22rpx px-20rpx py-8rpx rounded-full" @tap="openReviewModal">
            写评论
          </view>
        </view>

        <view v-if="reviews.length === 0" class="text-center py-40rpx text-text-muted text-24rpx">
          还没有评价，成为第一个写评价的人吧
        </view>

        <view v-else class="flex flex-col gap-24rpx">
          <view v-for="r in reviews.slice(0, 5)" :key="r.id" class="review-item border-b border-border pb-24rpx last:border-b-0">
            <view class="flex items-center gap-16rpx mb-12rpx">
              <view class="w-56rpx h-56rpx rounded-full bg-primary text-white flex items-center justify-center text-24rpx font-bold">
                {{ (r.nickname || 'U').slice(0, 1) }}
              </view>
              <view class="flex-1">
                <text class="text-24rpx font-bold block">{{ r.nickname }}</text>
                <text class="text-20rpx text-text-muted">{{ r.created_at }}</text>
              </view>
              <text class="text-24rpx text-#E7A941">{{ '★'.repeat(r.rating) }}{{ '☆'.repeat(5 - r.rating) }}</text>
            </view>
            <text class="text-24rpx text-text-main block leading-relaxed">{{ r.content }}</text>
          </view>
        </view>
      </view>

      <!-- 卖家块 -->
      <view class="seller-block bg-white p-30rpx flex items-center justify-between mb-30rpx">
        <view class="flex items-center gap-20rpx">
          <view class="seller-avatar w-80rpx h-80rpx rounded-full bg-#E7A941 flex items-center justify-center text-white font-bold text-32rpx">
            {{ (book.seller_name || '阳').slice(0, 1) }}
          </view>
          <view>
            <text class="text-26rpx font-bold block">{{ book.seller_name || '认证卖家' }}</text>
            <text class="text-22rpx text-text-muted">评分 4.9 · 卖出 32 本书</text>
          </view>
        </view>
        <view class="text-24rpx text-primary px-20rpx py-12rpx border border-primary rounded-full" @tap="handleShare">
          分享
        </view>
      </view>
    </template>

    <!-- 底部操作栏 -->
    <view class="detail-bottom-actions fixed bottom-0 w-full h-120rpx bg-white border-t border-border flex items-center px-30rpx gap-20rpx pb-safe z-50">
      <view class="qty-stepper flex items-center border border-border rounded-full overflow-hidden h-72rpx">
        <view class="w-64rpx h-72rpx flex items-center justify-center text-32rpx" @tap="quantity > 1 && quantity--">−</view>
        <view class="w-72rpx h-72rpx flex items-center justify-center text-26rpx bg-bg">{{ quantity }}</view>
        <view class="w-64rpx h-72rpx flex items-center justify-center text-32rpx" @tap="quantity++">+</view>
      </view>
      <view class="btn-outline flex-1 border border-border h-80rpx rounded-full flex items-center justify-center text-28rpx font-bold" @tap="handleAddToCart">
        加入购物车
      </view>
      <view class="btn-solid flex-1 bg-primary text-white h-80rpx rounded-full flex items-center justify-center text-28rpx font-bold" @tap="handleBuyNow">
        立即购买
      </view>
    </view>

    <!-- 评论弹窗 -->
    <view v-if="showReviewModal" class="modal-mask fixed inset-0 bg-#00000066 flex items-end justify-center z-999" @tap="showReviewModal = false">
      <view class="modal-content bg-white rounded-t-32rpx p-40rpx w-full" @tap.stop>
        <text class="text-34rpx font-bold mb-30rpx block">写下你的评价</text>

        <view class="flex items-center gap-12rpx mb-30rpx">
          <text class="text-26rpx text-text-muted">评分:</text>
          <view class="flex gap-8rpx">
            <text
              v-for="n in 5"
              :key="n"
              class="text-44rpx"
              :class="n <= newReview.rating ? 'text-#E7A941' : 'text-#E0E0E0'"
              @tap="newReview.rating = n"
            >★</text>
          </view>
          <text class="text-24rpx text-text-muted ml-12rpx">{{ newReview.rating }} 星</text>
        </view>

        <textarea
          v-model="newReview.content"
          class="w-full h-240rpx border border-border rounded-16rpx p-20rpx text-26rpx bg-bg"
          placeholder="分享你对这本书的看法..."
          maxlength="200"
        />

        <view class="flex gap-20rpx mt-30rpx">
          <view class="flex-1 bg-bg text-text-main py-24rpx rounded-44rpx font-bold text-28rpx text-center" @tap="showReviewModal = false">取消</view>
          <view class="flex-1 bg-primary text-white py-24rpx rounded-44rpx font-bold text-28rpx text-center" @tap="submitReview">发表</view>
        </view>
      </view>
    </view>
  </view>
</template>

<style scoped>
.detail-page {
  padding-bottom: 140rpx;
}
</style>
