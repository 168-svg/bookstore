<script setup lang="ts">
definePage({
  style: {
    navigationBarTitleText: '用户管理',
  },
})

import type { IAdminUser } from '@/api/admin'
import { getUsers, updateUserRole, deleteUser, resetUserPassword } from '@/api/admin'

const users = ref<IAdminUser[]>([])
const total = ref(0)
const page = ref(1)
const keyword = ref('')
const roleFilter = ref('')
const loading = ref(false)

async function fetchUsers() {
  try {
    loading.value = true
    const params: Record<string, any> = { page: page.value, pageSize: 20 }
    if (keyword.value) params.keyword = keyword.value
    if (roleFilter.value) params.role = roleFilter.value
    const res = await getUsers(params)
    users.value = res.list
    total.value = res.total
  }
  catch {
    uni.showToast({ title: '获取用户列表失败', icon: 'none' })
  }
  finally {
    loading.value = false
  }
}

function handleSearch() {
  page.value = 1
  fetchUsers()
}

function handleRoleFilter(role: string) {
  roleFilter.value = role
  page.value = 1
  fetchUsers()
}

function handleToggleRole(user: IAdminUser) {
  const newRole = user.role === 'admin' ? 'user' : 'admin'
  const label = newRole === 'admin' ? '管理员' : '普通用户'
  uni.showModal({
    title: '确认操作',
    content: `确定要将用户"${user.nickname || user.username}"的角色改为"${label}"吗？`,
    success: async (res) => {
      if (res.confirm) {
        await updateUserRole(user.id, newRole)
        uni.showToast({ title: '操作成功', icon: 'success' })
        fetchUsers()
      }
    },
  })
}

function handleDeleteUser(user: IAdminUser) {
  uni.showModal({
    title: '确认删除',
    content: `确定要删除用户"${user.nickname || user.username}"吗？此操作不可恢复！`,
    success: async (res) => {
      if (res.confirm) {
        await deleteUser(user.id)
        uni.showToast({ title: '删除成功', icon: 'success' })
        fetchUsers()
      }
    },
  })
}

function handleResetPassword(user: IAdminUser) {
  uni.showModal({
    title: '重置密码',
    editable: true,
    placeholderText: '请输入新密码',
    success: async (res) => {
      if (res.confirm && res.content) {
        await resetUserPassword(user.id, res.content)
        uni.showToast({ title: '密码重置成功', icon: 'success' })
      }
    },
  })
}

onMounted(() => {
  fetchUsers()
})
</script>

<template>
  <view class="admin-users bg-bg min-h-100vh">
    <!-- 搜索栏 -->
    <view class="search-bar bg-white px-30rpx py-20rpx flex items-center gap-16rpx">
      <input
        v-model="keyword"
        type="text"
        placeholder="搜索用户名/昵称"
        class="flex-1 h-64rpx bg-#F5F5F5 rounded-full px-24rpx text-24rpx"
        confirm-type="search"
        @confirm="handleSearch"
      />
    </view>

    <!-- 角色筛选 -->
    <view class="role-tabs flex bg-white px-30rpx py-16rpx gap-16rpx border-b border-#F0F0F0">
      <view
        class="tab-pill py-8rpx px-24rpx rounded-24rpx text-22rpx"
        :class="roleFilter === '' ? 'bg-primary text-white' : 'bg-#F0F0F0 text-#666'"
        @tap="handleRoleFilter('')"
      >
        全部
      </view>
      <view
        class="tab-pill py-8rpx px-24rpx rounded-24rpx text-22rpx"
        :class="roleFilter === 'admin' ? 'bg-primary text-white' : 'bg-#F0F0F0 text-#666'"
        @tap="handleRoleFilter('admin')"
      >
        管理员
      </view>
      <view
        class="tab-pill py-8rpx px-24rpx rounded-24rpx text-22rpx"
        :class="roleFilter === 'user' ? 'bg-primary text-white' : 'bg-#F0F0F0 text-#666'"
        @tap="handleRoleFilter('user')"
      >
        普通用户
      </view>
    </view>

    <!-- 用户列表 -->
    <view class="user-list p-30rpx flex flex-col gap-20rpx">
      <view v-if="users.length === 0 && !loading" class="text-center text-text-muted py-80rpx text-26rpx">
        暂无用户数据
      </view>

      <view
        v-for="user in users"
        :key="user.id"
        class="user-card bg-white rounded-16rpx p-24rpx shadow-sm"
      >
        <view class="flex items-center gap-20rpx">
          <view class="user-avatar w-80rpx h-80rpx rounded-full flex items-center justify-center text-32rpx font-bold text-white" :class="user.role === 'admin' ? 'bg-accent' : 'bg-primary'">
            {{ (user.nickname || user.username).slice(0, 1) }}
          </view>
          <view class="flex-1">
            <view class="flex items-center gap-12rpx">
              <text class="text-26rpx font-bold">{{ user.nickname || user.username }}</text>
              <text class="text-18rpx px-8rpx py-2rpx rounded-4rpx" :class="user.role === 'admin' ? 'bg-#FFF3E0 text-#E7A941' : 'bg-#EBF4EE text-primary'">
                {{ user.role === 'admin' ? '管理员' : '用户' }}
              </text>
            </view>
            <text class="text-22rpx text-text-muted">@{{ user.username }} · {{ user.created_at }}</text>
          </view>
        </view>

        <view class="flex gap-16rpx mt-20rpx pt-16rpx border-t border-#F5F5F5">
          <view class="flex-1 text-center py-12rpx text-22rpx text-primary font-bold border border-primary rounded-8rpx" @tap="handleToggleRole(user)">
            {{ user.role === 'admin' ? '设为用户' : '设为管理员' }}
          </view>
          <view class="flex-1 text-center py-12rpx text-22rpx text-#4A90E2 font-bold border border-#4A90E2 rounded-8rpx" @tap="handleResetPassword(user)">
            重置密码
          </view>
          <view class="flex-1 text-center py-12rpx text-22rpx text-#E75E40 font-bold border border-#E75E40 rounded-8rpx" @tap="handleDeleteUser(user)">
            删除
          </view>
        </view>
      </view>
    </view>
  </view>
</template>
