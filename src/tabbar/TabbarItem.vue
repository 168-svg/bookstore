<script setup lang="ts">
import type { CustomTabBarItem } from './types'
import { tabbarStore } from './store'

const props = defineProps<{
  item: CustomTabBarItem
  index: number
}>()

function getImageByIndex(index: number, item: CustomTabBarItem) {
  return tabbarStore.curIdx === index ? (item.iconActive || item.icon) : item.icon
}
</script>

<template>
  <view class="tabbar-cell">
    <!-- 中间发布按钮 -->
    <view v-if="item.isBulge" class="publish-cell">
      <view class="publish-btn">
        <view :class="[item.icon, 'icon-white']" />
      </view>
      <text class="publish-label">{{ item.text }}</text>
    </view>

    <!-- 普通 tab -->
    <view v-else class="normal-cell">
      <template v-if="item.iconType === 'unocss' || item.iconType === 'iconfont'">
        <view :class="[item.icon, 'icon-normal']" />
      </template>
      <template v-if="item.iconType === 'image'">
        <image :src="getImageByIndex(index, item)" class="icon-img" mode="scaleToFill" />
      </template>
      <text class="text-label">{{ item.text }}</text>
    </view>
  </view>
</template>

<style scoped>
.tabbar-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.icon-normal {
  font-size: 20px;
  line-height: 1;
}

.icon-white {
  font-size: 28px;
  line-height: 1;
  color: #fff;
}

.icon-img {
  width: 24px;
  height: 24px;
}

.text-label {
  margin-top: 2px;
  font-size: 12px;
}

/* 发布按钮 */
.publish-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.publish-btn {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: #365F47;
  box-shadow: 0 2px 8px rgba(54, 95, 71, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
}

.publish-label {
  margin-top: 2px;
  font-size: 12px;
  color: inherit;
}
</style>
