<script setup lang="ts">
definePage({
  style: {
    navigationStyle: 'custom',
    navigationBarTitleText: '',
  },
})

function handleEnter() {
  uni.switchTab({
    url: '/pages/index/index',
  })
}
</script>

<template>
  <view class="splash-page">
    <view class="splash-title-area">
      <text class="splash-title">二手书</text>
      <text class="splash-subtitle">让每一本书 · 遇见新的读者</text>
    </view>

    <view class="splash-slogan">
      <text>让知识循环，温暖延续</text>
    </view>

    <view class="splash-books">
      <view class="book-layer book-layer-1" />
      <view class="book-layer book-layer-2" />
      <view class="book-layer book-layer-3" />
    </view>

    <view class="splash-footer" @tap="handleEnter">
      <text>点击进入系统 &gt;</text>
    </view>
  </view>
</template>

<style scoped>
.splash-page {
  background-color: #F8F6F2;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  padding: 160rpx 40rpx 120rpx 40rpx;
  text-align: center;
  height: 100vh;
}

.splash-title-area {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.splash-title {
  font-size: 64rpx;
  letter-spacing: 8rpx;
  color: #365F47;
  font-weight: bold;
}

.splash-subtitle {
  font-size: 28rpx;
  color: #8E8C88;
  letter-spacing: 4rpx;
  margin-top: 20rpx;
}

.splash-slogan {
  writing-mode: vertical-rl;
  text-orientation: mixed;
  font-size: 36rpx;
  letter-spacing: 12rpx;
  color: #555;
  line-height: 2;
}

.splash-books {
  width: 140rpx;
  height: 120rpx;
  position: relative;
}

.book-layer {
  position: absolute;
  border-radius: 4rpx;
}

.book-layer-1 {
  bottom: 0;
  width: 120rpx;
  height: 24rpx;
  background: #DE6B48;
  transform: rotate(-4deg);
}

.book-layer-2 {
  bottom: 16rpx;
  left: 8rpx;
  width: 112rpx;
  height: 28rpx;
  background: #365F47;
  transform: rotate(2deg);
}

.book-layer-3 {
  bottom: 36rpx;
  left: 16rpx;
  width: 100rpx;
  height: 20rpx;
  background: #E7A941;
}

.splash-footer {
  font-size: 24rpx;
  color: #365F47;
  text-decoration: underline;
}
</style>