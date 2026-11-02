<template>
  <div class="fixed inset-0 z-50 bg-slate-950/75 flex items-center justify-center p-4">
    <div
      :class="[
        'w-full max-w-sm rounded-3xl modal-surface p-6 shadow-2xl space-y-5 text-center transition-transform',
        hasError ? 'animate-shake' : ''
      ]"
    >
      <!-- Lock Icon -->
      <div class="w-14 h-14 mx-auto rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center shadow-lg shadow-amber-500/10">
        <Lock class="w-7 h-7" />
      </div>

      <!-- Title & Description -->
      <div>
        <h3 class="text-base font-semibold text-white">
          {{ isFirstTime ? '初始化个人空间密码' : '个人空间已锁定' }}
        </h3>
        <p class="text-xs text-slate-300 mt-1">
          {{ isFirstTime ? '首次使用个人空间，请设置主密码。所有敏感网址将采用 AES-256 加密保存。' : '请输入主密码解锁个人空间' }}
        </p>
      </div>

      <!-- Password Input -->
      <form @submit.prevent="handleSubmit" class="space-y-3">
        <div>
          <input
            ref="inputRef"
            type="password"
            v-model="password"
            :placeholder="isFirstTime ? '请设置 6 位以上密码...' : '输入解锁密码...'"
            class="w-full bg-slate-900/90 border border-slate-700/80 focus:border-amber-400 rounded-xl px-4 py-2.5 text-center text-sm text-white tracking-widest placeholder:tracking-normal placeholder:text-slate-500 focus:outline-none"
            autofocus
          />
        </div>

        <p v-if="hasError" class="text-xs text-rose-400 font-medium">
          {{ errorMsg }}
        </p>

        <div class="flex items-center space-x-2 pt-2">
          <button
            type="button"
            @click="$emit('cancel')"
            class="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
          >
            取消
          </button>
          <button
            type="submit"
            :disabled="!password"
            class="flex-1 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 text-xs font-semibold shadow-md shadow-amber-500/30 transition-colors"
          >
            {{ isFirstTime ? '设置并解锁' : '立即解锁' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Lock } from 'lucide-vue-next'

const props = defineProps<{
  isFirstTime: boolean
}>()

const emit = defineEmits<{
  (e: 'unlock', pwd: string): void
  (e: 'cancel'): void
}>()

const password = ref('')
const hasError = ref(false)
const errorMsg = ref('')
const inputRef = ref<HTMLInputElement | null>(null)

onMounted(() => {
  inputRef.value?.focus()
})

function handleSubmit() {
  if (props.isFirstTime && password.value.length < 6) {
    showError('为了安全起见，密码至少需要 6 个字符')
    return
  }

  emit('unlock', password.value)
}

function showError(msg: string) {
  hasError.value = true
  errorMsg.value = msg
  setTimeout(() => {
    hasError.value = false
  }, 1000)
}

defineExpose({
  showError
})
</script>

<style scoped>
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20%, 60% { transform: translateX(-8px); }
  40%, 80% { transform: translateX(8px); }
}
.animate-shake {
  animation: shake 0.4s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
}
</style>
