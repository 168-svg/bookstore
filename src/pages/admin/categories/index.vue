<script setup lang="ts">
definePage({
  style: {
    navigationBarTitleText: '分类管理',
  },
})

import type { ICategory, ISubCategory } from '@/api/categories'
import { getCategories, addCategory, updateCategory, deleteCategory, addSubCategory, updateSubCategory, deleteSubCategory } from '@/api/categories'

const categories = ref<ICategory[]>([])
const loading = ref(false)
const editingCat = ref<{ id?: number, name: string } | null>(null)
const editingSub = ref<{ id?: number, category_id: number, name: string, color: string } | null>(null)

async function fetchCategories() {
  try {
    loading.value = true
    const res = await getCategories()
    categories.value = res
  }
  catch {
    uni.showToast({ title: '获取分类失败', icon: 'none' })
  }
  finally {
    loading.value = false
  }
}

function showAddCategory() {
  editingCat.value = { name: '' }
}

function showEditCategory(cat: ICategory) {
  editingCat.value = { id: cat.id, name: cat.name }
}

function showAddSubCategory(catId: number) {
  editingSub.value = { category_id: catId, name: '', color: '#E2DFD7' }
}

function showEditSubCategory(sub: ISubCategory) {
  editingSub.value = { id: sub.id, category_id: sub.category_id, name: sub.name, color: sub.color }
}

async function handleSaveCategory() {
  if (!editingCat.value?.name) {
    uni.showToast({ title: '请输入分类名称', icon: 'none' })
    return
  }
  try {
    if (editingCat.value.id) {
      await updateCategory(editingCat.value.id, { name: editingCat.value.name })
    } else {
      await addCategory({ name: editingCat.value.name })
    }
    editingCat.value = null
    uni.showToast({ title: '保存成功', icon: 'success' })
    fetchCategories()
  }
  catch {
    uni.showToast({ title: '保存失败', icon: 'none' })
  }
}

async function handleSaveSubCategory() {
  if (!editingSub.value?.name) {
    uni.showToast({ title: '请输入子分类名称', icon: 'none' })
    return
  }
  try {
    if (editingSub.value.id) {
      await updateSubCategory(editingSub.value.id, { name: editingSub.value.name, color: editingSub.value.color })
    } else {
      await addSubCategory({ category_id: editingSub.value.category_id, name: editingSub.value.name, color: editingSub.value.color })
    }
    editingSub.value = null
    uni.showToast({ title: '保存成功', icon: 'success' })
    fetchCategories()
  }
  catch {
    uni.showToast({ title: '保存失败', icon: 'none' })
  }
}

function handleDeleteCategory(cat: ICategory) {
  uni.showModal({
    title: '确认删除',
    content: `确定要删除分类"${cat.name}"及其所有子分类吗？`,
    success: async (res) => {
      if (res.confirm) {
        await deleteCategory(cat.id)
        uni.showToast({ title: '删除成功', icon: 'success' })
        fetchCategories()
      }
    },
  })
}

function handleDeleteSubCategory(sub: ISubCategory) {
  uni.showModal({
    title: '确认删除',
    content: `确定要删除子分类"${sub.name}"吗？`,
    success: async (res) => {
      if (res.confirm) {
        await deleteSubCategory(sub.id)
        uni.showToast({ title: '删除成功', icon: 'success' })
        fetchCategories()
      }
    },
  })
}

onMounted(() => {
  fetchCategories()
})
</script>

<template>
  <view class="admin-categories bg-bg min-h-100vh">
    <!-- 添加分类按钮 -->
    <view class="px-30rpx py-20rpx">
      <view class="bg-primary text-white py-20rpx rounded-44rpx font-bold text-26rpx text-center" @tap="showAddCategory">
        + 添加分类
      </view>
    </view>

    <!-- 分类列表 -->
    <view class="px-30rpx flex flex-col gap-20rpx pb-30rpx">
      <view v-for="cat in categories" :key="cat.id" class="cat-group bg-white rounded-16rpx shadow-sm overflow-hidden">
        <!-- 分类头 -->
        <view class="cat-header flex justify-between items-center px-24rpx py-20rpx border-b border-#F5F5F5">
          <text class="text-28rpx font-bold">{{ cat.name }}</text>
          <view class="flex gap-16rpx">
            <text class="text-22rpx text-primary" @tap="showAddSubCategory(cat.id)">+ 子分类</text>
            <text class="text-22rpx text-#4A90E2" @tap="showEditCategory(cat)">编辑</text>
            <text class="text-22rpx text-#E75E40" @tap="handleDeleteCategory(cat)">删除</text>
          </view>
        </view>
        <!-- 子分类列表 -->
        <view class="cat-subs px-24rpx py-16rpx flex flex-wrap gap-16rpx">
          <view
            v-for="sub in cat.subs"
            :key="sub.id"
            class="sub-tag flex items-center gap-8rpx py-8rpx px-16rpx rounded-8rpx text-22rpx"
            :style="{ background: `${sub.color}40` }"
          >
            <view class="w-16rpx h-16rpx rounded-full" :style="{ background: sub.color }" />
            <text>{{ sub.name }}</text>
            <text class="text-#4A90E2 ml-4rpx" @tap="showEditSubCategory(sub)">✎</text>
            <text class="text-#E75E40" @tap="handleDeleteSubCategory(sub)">✕</text>
          </view>
          <view v-if="cat.subs.length === 0" class="text-22rpx text-text-muted py-8rpx">
            暂无子分类
          </view>
        </view>
      </view>
    </view>

    <!-- 编辑分类弹窗 -->
    <view v-if="editingCat" class="modal-mask fixed inset-0 bg-#00000066 flex items-center justify-center z-999" @tap="editingCat = null">
      <view class="modal-content bg-white rounded-24rpx p-30rpx w-600rpx" @tap.stop>
        <text class="text-30rpx font-bold mb-24rpx">{{ editingCat.id ? '编辑分类' : '添加分类' }}</text>
        <input
          v-model="editingCat.name"
          type="text"
          placeholder="请输入分类名称"
          class="border border-border p-20rpx rounded-16rpx text-26rpx mb-24rpx"
        />
        <view class="flex gap-20rpx">
          <view class="flex-1 text-center py-16rpx border border-border rounded-24rpx text-26rpx" @tap="editingCat = null">取消</view>
          <view class="flex-1 text-center py-16rpx bg-primary text-white rounded-24rpx text-26rpx" @tap="handleSaveCategory">保存</view>
        </view>
      </view>
    </view>

    <!-- 编辑子分类弹窗 -->
    <view v-if="editingSub" class="modal-mask fixed inset-0 bg-#00000066 flex items-center justify-center z-999" @tap="editingSub = null">
      <view class="modal-content bg-white rounded-24rpx p-30rpx w-600rpx" @tap.stop>
        <text class="text-30rpx font-bold mb-24rpx">{{ editingSub.id ? '编辑子分类' : '添加子分类' }}</text>
        <input
          v-model="editingSub.name"
          type="text"
          placeholder="请输入子分类名称"
          class="border border-border p-20rpx rounded-16rpx text-26rpx mb-20rpx"
        />
        <view class="form-item flex flex-col gap-12rpx mb-24rpx">
          <text class="text-24rpx">颜色</text>
          <input v-model="editingSub.color" type="text" placeholder="#E2DFD7" class="border border-border p-20rpx rounded-16rpx text-26rpx" />
        </view>
        <view class="flex gap-20rpx">
          <view class="flex-1 text-center py-16rpx border border-border rounded-24rpx text-26rpx" @tap="editingSub = null">取消</view>
          <view class="flex-1 text-center py-16rpx bg-primary text-white rounded-24rpx text-26rpx" @tap="handleSaveSubCategory">保存</view>
        </view>
      </view>
    </view>
  </view>
</template>
