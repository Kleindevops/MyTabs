<template>
  <div class="flex flex-col items-center justify-center select-none py-4 transition-all duration-300">
    <!-- Time display with soft glow -->
    <div class="text-6xl md:text-7xl font-extralight tracking-tight text-white drop-shadow-[0_4px_16px_rgba(0,0,0,0.4)] flex items-baseline">
      <span>{{ hours }}</span>
      <span class="animate-pulse mx-1 text-white/70">:</span>
      <span>{{ minutes }}</span>
      <span class="text-xl md:text-2xl font-light text-white/60 ml-2 tracking-normal">{{ seconds }}</span>
    </div>

    <!-- Date & Greeting -->
    <div class="mt-2 flex items-center space-x-2 text-xs md:text-sm font-medium text-white/80 drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
      <span>{{ greeting }}</span>
      <span class="w-1 h-1 rounded-full bg-white/40"></span>
      <span>{{ dateStr }}</span>
      <span class="w-1 h-1 rounded-full bg-white/40"></span>
      <span>{{ weekday }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const hours = ref('00')
const minutes = ref('00')
const seconds = ref('00')
const dateStr = ref('')
const weekday = ref('')
const greeting = ref('你好')

let timer: number | null = null

const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']

function updateTime() {
  const now = new Date()
  const h = now.getHours()
  const m = now.getMinutes()
  const s = now.getSeconds()

  hours.value = h.toString().padStart(2, '0')
  minutes.value = m.toString().padStart(2, '0')
  seconds.value = s.toString().padStart(2, '0')

  dateStr.value = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`
  weekday.value = weekdays[now.getDay()]

  if (h >= 5 && h < 12) {
    greeting.value = '早上好'
  } else if (h >= 12 && h < 18) {
    greeting.value = '下午好'
  } else {
    greeting.value = '晚上好'
  }
}

onMounted(() => {
  updateTime()
  timer = window.setInterval(updateTime, 1000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>
