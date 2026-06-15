<script setup lang="ts">
definePage({
  style: {
    navigationBarTitleText: '编辑书籍',
  },
})

import type { IBook } from '@/api/books'
import { getBookDetail, publishBook, updateBook } from '@/api/books'
import { getCategories } from '@/api/categories'
import type { ICategory } from '@/api/categories'

const bookId = ref<number | null>(null)
const isEdit = ref(false)
const categories = ref<ICategory[]>([])

const form = ref({
  title: '',
  author: '',
  price: '',
  original_price: '',
  color: '#2c3e50',
  condition: '8成新',
  publisher: '',
  publish_date: '',
  isbn: '',
  description: '',
  sub_category_id: null as number | null,
  status: 'on_sale',
})

const conditions = ['全新', '9成新', '8.5成新', '8成新', '7成新及以下']

async function fetchCategories() {
  try {
    const res = await getCategories()
    categories.value = res
  }
  catch {
    // ignore
  }
}

async function fetchBookDetail(id: number) {
  try {
    const book = await getBookDetail(id)
    form.value = {
      title: book.title,
      author: book.author,
      price: String(book.price),
      original_price: String(book.original_price),
      color: book.color,
      condition: book.condition,
      publisher: book.publisher,
      publish_date: book.publish_date,
      isbn: book.isbn,
      description: book.description,
      sub_category_id: book.sub_category_id,
      status: book.status,
    }
  }
  catch {
    uni.showToast({ title: '获取书籍信息失败', icon: 'none' })
  }
}

async function handleSubmit() {
  if (!form.value.title || !form.value.author || !form.value.price) {
    uni.showToast({ title: '请填写书名、作者和价格', icon: 'none' })
    return
  }

  try {
    const data = {
      ...form.value,
      price: Number(form.value.price),
      original_price: Number(form.value.original_price) || 0,
    }

    if (isEdit.value && bookId.value) {
      await updateBook(bookId.value, data)
      uni.showToast({ title: '更新成功', icon: 'success' })
    }
    else {
      await publishBook(data)
      uni.showToast({ title: '发布成功', icon: 'success' })
    }

    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
  }
  catch {
    uni.showToast({ title: '操作失败', icon: 'none' })
  }
}

onLoad((options) => {
  fetchCategories()
  if (options?.id) {
    bookId.value = Number(options.id)
    isEdit.value = true
    fetchBookDetail(bookId.value)
  }
})
</script>

<template>
  <view class="book-edit-page bg-bg min-h-100vh">
    <view class="edit-form p-30rpx flex flex-col gap-24rpx">
      <view class="form-item flex flex-col gap-12rpx">
        <text class="text-26rpx font-bold">书名 *</text>
        <input v-model="form.title" type="text" placeholder="请输入书名" class="border border-border bg-white p-20rpx rounded-16rpx text-26rpx" />
      </view>

      <view class="form-item flex flex-col gap-12rpx">
        <text class="text-26rpx font-bold">作者 *</text>
        <input v-model="form.author" type="text" placeholder="请输入作者" class="border border-border bg-white p-20rpx rounded-16rpx text-26rpx" />
      </view>

      <view class="form-item flex flex-col gap-12rpx">
        <text class="text-26rpx font-bold">售价 *</text>
        <input v-model="form.price" type="digit" placeholder="¥ 请输入售价" class="border border-border bg-white p-20rpx rounded-16rpx text-26rpx" />
      </view>

      <view class="form-item flex flex-col gap-12rpx">
        <text class="text-26rpx font-bold">原价</text>
        <input v-model="form.original_price" type="digit" placeholder="¥ 请输入原价" class="border border-border bg-white p-20rpx rounded-16rpx text-26rpx" />
      </view>

      <view class="form-item flex flex-col gap-12rpx">
        <text class="text-26rpx font-bold">成色</text>
        <view class="condition-pills flex flex-wrap gap-16rpx">
          <view
            v-for="cond in conditions"
            :key="cond"
            class="pill py-12rpx px-24rpx rounded-30rpx bg-white border border-border text-24rpx"
            :class="{ active: form.condition === cond }"
            @tap="form.condition = cond"
          >
            {{ cond }}
          </view>
        </view>
      </view>

      <view class="form-item flex flex-col gap-12rpx">
        <text class="text-26rpx font-bold">出版社</text>
        <input v-model="form.publisher" type="text" placeholder="请输入出版社" class="border border-border bg-white p-20rpx rounded-16rpx text-26rpx" />
      </view>

      <view class="form-item flex flex-col gap-12rpx">
        <text class="text-26rpx font-bold">出版时间</text>
        <input v-model="form.publish_date" type="text" placeholder="如 2024-01" class="border border-border bg-white p-20rpx rounded-16rpx text-26rpx" />
      </view>

      <view class="form-item flex flex-col gap-12rpx">
        <text class="text-26rpx font-bold">ISBN</text>
        <input v-model="form.isbn" type="text" placeholder="请输入ISBN" class="border border-border bg-white p-20rpx rounded-16rpx text-26rpx" />
      </view>

      <view class="form-item flex flex-col gap-12rpx">
        <text class="text-26rpx font-bold">分类</text>
        <picker
          :range="categories.flatMap(c => c.subs.map(s => `${c.name} - ${s.name}`))"
          @change="(e: any) => {
            const flatSubs = categories.flatMap(c => c.subs)
            const idx = e.detail.value
            form.sub_category_id = flatSubs[idx]?.id || null
          }"
        >
          <view class="border border-border bg-white p-20rpx rounded-16rpx text-26rpx text-text-muted">
            {{ form.sub_category_id ? categories.flatMap(c => c.subs).find(s => s.id === form.sub_category_id)?.name || '选择分类' : '选择分类' }}
          </view>
        </picker>
      </view>

      <view class="form-item flex flex-col gap-12rpx">
        <text class="text-26rpx font-bold">描述</text>
        <textarea v-model="form.description" placeholder="请输入书籍描述" class="border border-border bg-white p-20rpx rounded-16rpx text-26rpx h-200rpx" />
      </view>

      <view v-if="isEdit" class="form-item flex flex-col gap-12rpx">
        <text class="text-26rpx font-bold">状态</text>
        <view class="flex gap-16rpx">
          <view
            class="pill py-12rpx px-24rpx rounded-30rpx bg-white border border-border text-24rpx"
            :class="{ active: form.status === 'on_sale' }"
            @tap="form.status = 'on_sale'"
          >
            在售
          </view>
          <view
            class="pill py-12rpx px-24rpx rounded-30rpx bg-white border border-border text-24rpx"
            :class="{ active: form.status === 'off' }"
            @tap="form.status = 'off'"
          >
            下架
          </view>
        </view>
      </view>

      <view class="btn-submit bg-primary text-white py-24rpx rounded-44rpx font-bold text-30rpx text-center mt-20rpx" @tap="handleSubmit">
        {{ isEdit ? '保存修改' : '发布' }}
      </view>
    </view>
  </view>
</template>

<style scoped>
.pill.active {
  background: #365F47;
  color: #FFF;
  border-color: #365F47;
}
</style>
