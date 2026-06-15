<script setup lang="ts">
interface Props {
  title: string
  color?: string
  width?: string
  height?: string
  fontSize?: string
}

const props = withDefaults(defineProps<Props>(), {
  color: '#2c3e50',
  width: '100%',
  height: '120px',
  fontSize: '14px',
})
</script>

<template>
  <view
    class="book-cover"
    :style="{
      width: props.width,
      height: props.height,
      fontSize: props.fontSize,
      background: `linear-gradient(135deg, ${props.color}, ${props.color}dd)`,
    }"
  >
    <text class="book-title">{{ props.title }}</text>
  </view>
</template>

<style scoped>
.book-cover {
  color: white;
  border-radius: 4px 8px 8px 4px;
  box-shadow: 3px 4px 8px rgba(0, 0, 0, 0.15), inset 3px 0 0 rgba(255, 255, 255, 0.2);
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 10px;
  text-align: center;
}

.book-cover::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px 0 0 4px;
}

.book-title {
  font-weight: bold;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
}
</style>