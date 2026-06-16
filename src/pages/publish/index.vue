<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { publishBook } from '@/api/books'
import { getCategories, type ICategory } from '@/api/categories'

definePage({
  style: {
    navigationBarTitleText: '发布二手书',
  },
})

const categories = ref<ICategory[]>([])
const activeCategoryId = ref<number | null>(null)
const activeSubId = ref<number | null>(null)
const showCategoryModal = ref(false)

const conditions = ['全新', '9成新', '8成新', '7成新及以下']
const conditionColors = ['#E7A941', '#4A90E2', '#365F47', '#E75E40']

const form = ref({
  title: '',
  author: '',
  condition: '8成新',
  price: '',
  original_price: '',
  publisher: '',
  publish_date: '',
  isbn: '',
  description: '',
  color: '#365F47',
})

const colorPalette = ['#365F47', '#294a4f', '#4f2929', '#8B6914', '#4A90E2', '#E75E40', '#7B4D8C', '#1e375a', '#5D6B4A', '#6B3A2F']

const canSubmit = () => form.value.title && form.value.author && form.value.price

onMounted(async () => {
  try {
    const data = await getCategories()
    categories.value = data || []
  } catch (err) {
    console.error('加载分类失败', err)
  }
})

function handleConditionClick(cond: string) {
  form.value.condition = cond
}

function handleColorClick(color: string) {
  form.value.color = color
}

function openCategoryModal() {
  showCategoryModal.value = true
}

function selectCategory(catId: number, subId: number, subName: string) {
  activeCategoryId.value = catId
  activeSubId.value = subId
  showCategoryModal.value = false
  uni.showToast({ title: `已选择: ${subName}`, icon: 'none' })
}

const selectedSubName = () => {
  if (activeSubId.value == null) return ''
  for (const cat of categories.value) {
    const sub = cat.subs?.find(s => s.id === activeSubId.value)
    if (sub) return sub.name
  }
  return ''
}

async function handlePublish() {
  if (!canSubmit()) {
    uni.showToast({ title: '请填写书名、作者和售价', icon: 'none' })
    return
  }
  const price = Number(form.value.price)
  if (!price || price <= 0) {
    uni.showToast({ title: '请输入有效价格', icon: 'none' })
    return
  }

  try {
    await publishBook({
      title: form.value.title,
      author: form.value.author,
      price,
      original_price: Number(form.value.original_price) || price * 2,
      color: form.value.color,
      condition: form.value.condition,
      publisher: form.value.publisher || '',
      publish_date: form.value.publish_date || '',
      isbn: form.value.isbn || '',
      description: form.value.description || '',
      sub_category_id: activeSubId.value || null,
    })
    uni.showToast({ title: '发布成功！', icon: 'success' })
    setTimeout(() => {
      uni.switchTab({ url: '/pages/index/index' })
    }, 1000)
  } catch (err) {
    console.error('发布失败', err)
    uni.showToast({ title: '发布失败，请重试', icon: 'none' })
  }
}
</script>

<template>
  <view class="publish-page bg-bg">
    <view class="publish-form p-30rpx flex flex-col gap-30rpx">

      <!-- 封面预览与选择 -->
      <view class="form-card bg-white rounded-20rpx p-30rpx">
        <text class="text-26rpx font-bold mb-20rpx block">封面预览</text>
        <view class="flex gap-24rpx items-center">
          <view
            class="w-200rpx h-240rpx rounded-16rpx flex items-center justify-center text-white text-24rpx font-bold shadow"
            :style="{ background: `linear-gradient(135deg, ${form.color}, ${form.color}aa)` }"
          >
            {{ form.title || '封面预览' }}
          </view>
          <view class="flex-1 flex flex-col gap-16rpx">
            <text class="text-24rpx text-text-muted">选择封面底色</text>
            <view class="flex flex-wrap gap-16rpx">
              <view
                v-for="c in colorPalette"
                :key="c"
                class="w-56rpx h-56rpx rounded-12rpx border-4rpx"
                :class="form.color === c ? 'border-primary ring-2' : 'border-transparent'"
                :style="{ background: c }"
                @tap="handleColorClick(c)"
              />
            </view>
          </view>
        </view>
      </view>

      <!-- 基础信息 -->
      <view class="form-card bg-white rounded-20rpx p-30rpx flex flex-col gap-24rpx">
        <text class="text-26rpx font-bold block">基础信息</text>

        <view class="form-item flex flex-col gap-12rpx">
          <text class="text-24rpx">书名 <text class="text-accent">*</text></text>
          <input
            v-model="form.title"
            type="text"
            placeholder="请输入书名"
            class="border border-border bg-bg p-20rpx rounded-16rpx text-26rpx"
          />
        </view>

        <view class="form-item flex flex-col gap-12rpx">
          <text class="text-24rpx">作者 <text class="text-accent">*</text></text>
          <input
            v-model="form.author"
            type="text"
            placeholder="请输入作者"
            class="border border-border bg-bg p-20rpx rounded-16rpx text-26rpx"
          />
        </view>

        <view class="form-item flex flex-col gap-12rpx">
          <text class="text-24rpx">成色 <text class="text-accent">*</text></text>
          <view class="condition-pills flex gap-16rpx flex-wrap">
            <view
              v-for="(cond, idx) in conditions"
              :key="cond"
              class="pill py-12rpx px-24rpx rounded-30rpx bg-bg border text-24rpx"
              :class="{ active: form.condition === cond }"
              :style="form.condition === cond ? { background: conditionColors[idx], color: '#fff', borderColor: conditionColors[idx] } : {}"
              @tap="handleConditionClick(cond)"
            >
              {{ cond }}
            </view>
          </view>
        </view>

        <view class="form-item flex flex-col gap-12rpx">
          <text class="text-24rpx">分类</text>
          <view
            class="border border-border bg-bg p-20rpx rounded-16rpx text-26rpx flex justify-between items-center"
            @tap="openCategoryModal"
          >
            <text :class="selectedSubName() ? 'text-text-main' : 'text-text-muted'">{{ selectedSubName() || '点击选择分类...' }}</text>
            <text class="text-24rpx text-text-muted">›</text>
          </view>
        </view>
      </view>

      <!-- 价格信息 -->
      <view class="form-card bg-white rounded-20rpx p-30rpx flex flex-col gap-24rpx">
        <text class="text-26rpx font-bold block">价格信息</text>

        <view class="form-item flex flex-col gap-12rpx">
          <text class="text-24rpx">售价 (元) <text class="text-accent">*</text></text>
          <input
            v-model="form.price"
            type="digit"
            placeholder="请输入售价"
            class="border border-border bg-bg p-20rpx rounded-16rpx text-26rpx"
          />
        </view>

        <view class="form-item flex flex-col gap-12rpx">
          <text class="text-24rpx">原价 (元)</text>
          <input
            v-model="form.original_price"
            type="digit"
            placeholder="请输入原价"
            class="border border-border bg-bg p-20rpx rounded-16rpx text-26rpx"
          />
        </view>
      </view>

      <!-- 出版信息 -->
      <view class="form-card bg-white rounded-20rpx p-30rpx flex flex-col gap-24rpx">
        <text class="text-26rpx font-bold block">出版信息</text>

        <view class="form-item flex flex-col gap-12rpx">
          <text class="text-24rpx">出版社</text>
          <input
            v-model="form.publisher"
            type="text"
            placeholder="请输入出版社"
            class="border border-border bg-bg p-20rpx rounded-16rpx text-26rpx"
          />
        </view>

        <view class="form-item flex flex-col gap-12rpx">
          <text class="text-24rpx">出版时间</text>
          <input
            v-model="form.publish_date"
            type="text"
            placeholder="如: 2015-05"
            class="border border-border bg-bg p-20rpx rounded-16rpx text-26rpx"
          />
        </view>

        <view class="form-item flex flex-col gap-12rpx">
          <text class="text-24rpx">ISBN</text>
          <input
            v-model="form.isbn"
            type="text"
            placeholder="请输入 ISBN"
            class="border border-border bg-bg p-20rpx rounded-16rpx text-26rpx"
          />
        </view>
      </view>

      <!-- 详细描述 -->
      <view class="form-card bg-white rounded-20rpx p-30rpx flex flex-col gap-24rpx">
        <text class="text-26rpx font-bold block">书籍描述</text>
        <textarea
          v-model="form.description"
          class="w-full h-240rpx border border-border bg-bg p-20rpx rounded-16rpx text-26rpx"
          placeholder="描述书籍的新旧程度、是否有笔记、是否有破损..."
          maxlength="500"
        />
        <text class="text-20rpx text-text-muted text-right">{{ form.description.length }} / 500</text>
      </view>

      <!-- 发布按钮 -->
      <view
        class="btn-submit-publish bg-primary text-white py-28rpx rounded-44rpx font-bold text-30rpx text-center mb-60rpx shadow"
        @tap="handlePublish"
      >
        发布
      </view>
    </view>

    <!-- 分类选择弹窗 -->
    <view v-if="showCategoryModal" class="modal-mask fixed inset-0 bg-#00000066 flex items-end justify-center z-999" @tap="showCategoryModal = false">
      <view class="modal-content bg-white rounded-t-32rpx p-40rpx w-full max-h-[80vh] overflow-auto" @tap.stop>
        <text class="text-34rpx font-bold mb-30rpx block">选择分类</text>

        <view v-if="categories.length === 0" class="text-center py-60rpx text-text-muted text-24rpx">
          暂无分类数据
        </view>

        <view v-for="cat in categories" :key="cat.id" class="mb-30rpx">
          <text class="text-28rpx font-bold mb-16rpx block text-primary">{{ cat.name }}</text>
          <view class="flex flex-wrap gap-16rpx">
            <view
              v-for="sub in cat.subs"
              :key="sub.id"
              class="py-12rpx px-24rpx rounded-full text-24rpx bg-bg"
              :class="{ active: activeSubId === sub.id }"
              @tap="selectCategory(cat.id, sub.id, sub.name)"
            >
              {{ sub.name }}
            </view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<style scoped>
.pill.active {
  border-color: transparent;
}

.ring-2 {
  box-shadow: 0 0 0 4rpx rgba(54, 95, 71, 0.3);
}

.category-item.active {
  background: #365F47;
  color: #fff;
  font-weight: 600;
  border-color: #365F47;
}
</style>
