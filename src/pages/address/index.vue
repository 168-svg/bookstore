<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getAddresses, addAddress, updateAddress, deleteAddress, setDefaultAddress, type IAddress } from '@/api/addresses'

definePage({
  style: {
    navigationBarTitleText: '地址管理',
  },
})

const addresses = ref<IAddress[]>([])
const showModal = ref(false)
const editingId = ref<number | null>(null)
const form = ref({
  name: '',
  phone: '',
  address: '',
  is_default: 0,
})

async function fetchAddresses() {
  try {
    addresses.value = await getAddresses()
  } catch (err) {
    console.error(err)
  }
}

function openAdd() {
  editingId.value = null
  form.value = { name: '', phone: '', address: '', is_default: 0 }
  showModal.value = true
}

function openEdit(addr: IAddress) {
  editingId.value = addr.id
  form.value = {
    name: addr.name,
    phone: addr.phone,
    address: addr.address,
    is_default: addr.is_default,
  }
  showModal.value = true
}

function closeModal() {
  showModal.value = false
}

async function handleSubmit() {
  if (!form.value.name || !form.value.phone || !form.value.address) {
    uni.showToast({ title: '请填写完整信息', icon: 'none' })
    return
  }
  try {
    if (editingId.value) {
      await updateAddress(editingId.value, form.value)
      uni.showToast({ title: '修改成功', icon: 'success' })
    } else {
      await addAddress(form.value)
      uni.showToast({ title: '添加成功', icon: 'success' })
    }
    showModal.value = false
    fetchAddresses()
  } catch (err) {
    console.error(err)
  }
}

function handleDelete(id: number) {
  uni.showModal({
    title: '提示',
    content: '确定要删除该地址吗？',
    success: async (res) => {
      if (res.confirm) {
        await deleteAddress(id)
        uni.showToast({ title: '删除成功', icon: 'success' })
        fetchAddresses()
      }
    },
  })
}

async function handleSetDefault(id: number) {
  await setDefaultAddress(id)
  uni.showToast({ title: '设置成功', icon: 'success' })
  fetchAddresses()
}

onMounted(() => {
  fetchAddresses()
})
</script>

<template>
  <view class="address-page bg-bg min-h-100vh">
    <view v-if="addresses.length === 0" class="empty-state flex flex-col items-center py-160rpx">
      <text class="text-80rpx mb-20rpx">📍</text>
      <text class="text-28rpx text-text-main mb-12rpx">还没有收货地址</text>
      <view class="py-16rpx px-32rpx bg-primary text-white text-26rpx rounded-full mt-20rpx" @tap="openAdd">
        添加地址
      </view>
    </view>

    <view class="address-list p-30rpx flex flex-col gap-24rpx">
      <view v-for="addr in addresses" :key="addr.id" class="addr-card bg-white p-30rpx rounded-20rpx flex flex-col gap-16rpx">
        <view class="flex items-center justify-between gap-20rpx">
          <view class="flex items-center gap-16rpx flex-1">
            <text class="text-30rpx font-bold">{{ addr.name }}</text>
            <text class="text-26rpx text-text-main">{{ addr.phone }}</text>
            <text v-if="addr.is_default" class="text-20rpx bg-primary text-white px-12rpx py-4rpx rounded-full">默认</text>
          </view>
          <view class="flex gap-16rpx">
            <view class="action-btn border border-border text-text-muted py-8rpx px-20rpx rounded-full text-22rpx" @tap="openEdit(addr)">编辑</view>
            <view class="action-btn border border-accent text-accent py-8rpx px-20rpx rounded-full text-22rpx" @tap="handleDelete(addr.id)">删除</view>
          </view>
        </view>
        <text class="text-26rpx text-text-main">{{ addr.address }}</text>
        <view v-if="!addr.is_default" class="flex justify-end">
          <view class="text-22rpx text-primary" @tap="handleSetDefault(addr.id)">设为默认</view>
        </view>
      </view>
    </view>

    <view class="p-30rpx">
      <view class="btn-submit bg-primary text-white py-28rpx rounded-full font-bold text-28rpx text-center" @tap="openAdd">
        + 新增地址
      </view>
    </view>

    <!-- 编辑/新增弹窗 -->
    <view v-if="showModal" class="modal-mask fixed inset-0 bg-#00000066 flex items-center justify-center z-999" @tap="closeModal">
      <view class="modal-content bg-white rounded-24rpx p-40rpx w-[600rpx]" @tap.stop>
        <text class="text-34rpx font-bold mb-30rpx block">{{ editingId ? '编辑地址' : '新增地址' }}</text>

        <view class="flex flex-col gap-20rpx">
          <view class="flex flex-col gap-12rpx">
            <text class="text-24rpx">收件人</text>
            <input v-model="form.name" placeholder="请输入收件人姓名" class="border border-border bg-bg p-20rpx rounded-16rpx text-26rpx" />
          </view>
          <view class="flex flex-col gap-12rpx">
            <text class="text-24rpx">联系电话</text>
            <input v-model="form.phone" placeholder="请输入手机号" class="border border-border bg-bg p-20rpx rounded-16rpx text-26rpx" />
          </view>
          <view class="flex flex-col gap-12rpx">
            <text class="text-24rpx">详细地址</text>
            <textarea v-model="form.address" placeholder="请输入详细地址" class="w-full h-160rpx border border-border bg-bg p-20rpx rounded-16rpx text-26rpx" />
          </view>
          <view class="flex items-center gap-12rpx">
            <view class="checkbox w-32rpx h-32rpx border border-border rounded flex items-center justify-center" :class="form.is_default ? 'bg-primary border-primary' : ''" @tap="form.is_default = form.is_default ? 0 : 1">
              <text v-if="form.is_default" class="text-white text-22rpx">✓</text>
            </view>
            <text class="text-24rpx">设为默认地址</text>
          </view>
        </view>

        <view class="flex gap-20rpx mt-40rpx">
          <view class="flex-1 border border-border text-text-muted py-24rpx rounded-44rpx text-28rpx text-center" @tap="closeModal">取消</view>
          <view class="flex-1 bg-primary text-white py-24rpx rounded-44rpx text-28rpx text-center" @tap="handleSubmit">保存</view>
        </view>
      </view>
    </view>
  </view>
</template>
