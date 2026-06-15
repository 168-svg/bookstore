<script setup lang="ts">
import { customTabbarEnable, tabbarCacheEnable } from './config'
import { tabbarList, tabbarStore } from './store'
import TabbarItem from './TabbarItem.vue'

// #ifdef MP-WEIXIN
defineOptions({
  virtualHost: true,
})
// #endif

function handleClick(index: number) {
  const list = tabbarList.value
  if (!list[index]) return

  const item = list[index]
  const url = item.pagePath

  // 中间操作型按钮（发布页）用 navigateTo
  if (item.isBulge) {
    uni.navigateTo({ url })
    return
  }

  if (index === tabbarStore.curIdx && tabbarStore.isCurrentRouteTabbarItem(index)) {
    return
  }

  const prevIdx = tabbarStore.curIdx
  tabbarStore.setCurIdx(index)

  if (tabbarCacheEnable) {
    uni.switchTab({
      url,
      success: () => tabbarStore.syncCurIdxByCurrentPageAsync(),
      fail: () => tabbarStore.setCurIdx(prevIdx),
    })
  }
  else {
    uni.navigateTo({
      url,
      success: () => tabbarStore.syncCurIdxByCurrentPageAsync(),
      fail: () => tabbarStore.setCurIdx(prevIdx),
    })
  }
}

const activeColor = 'var(--wot-color-theme, #365F47)'
const inactiveColor = '#8E8C88'
function getColorByIndex(index: number) {
  return tabbarStore.curIdx === index ? activeColor : inactiveColor
}
</script>

<template>
  <view v-if="customTabbarEnable" class="tabbar-root">
    <view class="tabbar-wrapper bg-white" @touchmove.stop.prevent>
      <view class="tabbar-inner">
        <view
          v-for="(item, index) in tabbarList"
          :key="index"
          class="tabbar-item"
          :style="{ color: getColorByIndex(index) }"
          @tap="handleClick(index)"
        >
          <TabbarItem :item="item" :index="index" />
        </view>
      </view>
      <view class="pb-safe" />
    </view>
  </view>
</template>

<style scoped>
.tabbar-root {
  height: 50px;
  padding-bottom: env(safe-area-inset-bottom);
}

.tabbar-wrapper {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  border-top: 1px solid #EAE8E3;
  box-sizing: border-box;
  padding-bottom: env(safe-area-inset-bottom);
}

.tabbar-inner {
  display: flex;
  height: 50px;
  align-items: center;
}

.tabbar-item {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.pb-safe {
  height: env(safe-area-inset-bottom);
}
</style>
