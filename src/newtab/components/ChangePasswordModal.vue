<template>
  <div class="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
    <div
      :class="[
        'w-full max-w-sm rounded-3xl glass-panel p-6 shadow-2xl space-y-5 border border-white/15 transition-transform',
        hasError ? 'animate-shake' : ''
      ]"
    >
      <!-- Header -->
      <div class="flex items-center justify-between pb-2 border-b border-white/10">
        <h3 class="text-sm font-semibold text-white flex items-center gap-2">
          <KeyRound class="w-4 h-4 text-amber-400" />
          修改个人空间密码
        </h3>
        <button @click="$emit('cancel')" class="text-white/60 hover:text-white text-xs">✕</button>
      </div>

      <form @submit.prevent="handleSubmit" class="space-y-3.5 text-xs">
        <!-- Old Password -->
        <div>
          <label class="block text-slate-300 mb-1 font-medium">当前原密码</label>
          <input
            type="password"
            v-model="oldPassword"
            placeholder="请输入当前的原密码"
            required
            class="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
          />
        </div>

        <!-- New Password -->
        <div>
          <label class="block text-slate-300 mb-1 font-medium">设置新密码</label>
          <input
            type="password"
            v-model="newPassword"
            placeholder="至少 6 位密码"
            required
            class="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
          />
        </div>

        <!-- Confirm New Password -->
        <div>
          <label class="block text-slate-300 mb-1 font-medium">确认新密码</label>
          <input
            type="password"
            v-model="confirmPassword"
            placeholder="再次输入新密码"
            required
            class="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
          />
        </div>

        <!-- Error Msg -->
        <p v-if="hasError" class="text-xs text-rose-400 font-medium text-center">
          {{ errorMsg }}
        </p>

        <!-- Buttons -->
        <div class="flex items-center space-x-2 pt-2 border-t border-white/10">
          <button
            type="button"
            @click="$emit('cancel')"
            class="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors"
          >
            取消
          </button>
          <button
            type="submit"
            :disabled="isSubmitting"
            class="flex-1 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold shadow-md shadow-amber-500/30 transition-colors"
          >
            {{ isSubmitting ? '正在修改...' : '确认修改密码' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { KeyRound } from 'lucide-vue-next'

const emit = defineEmits<{
  (e: 'change-password', payload: { oldPwd: string; newPwd: string }): void
  (e: 'cancel'): void
}>()

const oldPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const hasError = ref(false)
const errorMsg = ref('')
const isSubmitting = ref(false)

function handleSubmit() {
  if (newPassword.value.length < 6) {
    showError('新密码长度不能少于 6 位')
    return
  }

  if (newPassword.value !== confirmPassword.value) {
    showError('两次输入的新密码不一致')
    return
  }

  if (oldPassword.value === newPassword.value) {
    showError('新密码不能与原密码相同')
    return
  }

  emit('change-password', {
    oldPwd: oldPassword.value,
    newPwd: newPassword.value
  })
}

function showError(msg: string) {
  hasError.value = true
  errorMsg.value = msg
  setTimeout(() => {
    hasError.value = false
  }, 1200)
}

defineExpose({
  showError,
  setSubmitting: (val: boolean) => { isSubmitting.value = val }
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
