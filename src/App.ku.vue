<script setup lang="ts">
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import FgTabbar from '@/tabbar/index.vue'
import { isPageTabbar } from './tabbar/store'
import { currRoute } from './utils'

const isCurrentPageTabbar = ref(true)

onShow(() => {
  const { path } = currRoute()
  isCurrentPageTabbar.value = path === '/' || isPageTabbar(path)
})
</script>

<template>
  <view>
    <KuRootView />

    <FgTabbar v-if="isCurrentPageTabbar" />
  </view>
</template>
