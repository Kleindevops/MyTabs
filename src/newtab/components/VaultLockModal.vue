<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/25 backdrop-blur-[2px] transition-all duration-200"
    @click.self="handleCancel"
  >
    <div
      :class="[
        'relative w-full max-w-xs sm:max-w-sm rounded-2xl p-1.5 sm:p-2 transition-all duration-300',
        'bg-slate-900/60 hover:bg-slate-900/70 backdrop-blur-2xl border shadow-2xl',
        hasError
          ? 'border-rose-500/80 shadow-[0_8px_32px_rgba(244,63,94,0.3)] ring-2 ring-rose-500/30 animate-shake'
          : 'border-white/20 focus-within:border-amber-400/80 focus-within:ring-2 focus-within:ring-amber-400/25 shadow-black/40'
      ]"
      @click.stop
    >
      <form @submit.prevent="handleSubmit" class="flex items-center">
        <!-- Lock Icon -->
        <div class="pl-2.5 pr-1 flex items-center justify-center shrink-0">
          <Lock
            :class="[
              'w-4 h-4 transition-colors duration-200',
              hasError ? 'text-rose-400' : 'text-amber-400/90'
            ]"
          />
        </div>

        <!-- Password Input -->
        <input
          ref="inputRef"
          type="password"
          v-model="password"
          :placeholder="isFirstTime ? '设置密码 (按回车确认)...' : '输入密码解锁个人空间...'"
          class="flex-1 bg-transparent px-2.5 py-2 text-sm text-white placeholder-white/40 tracking-widest focus:outline-none font-medium selection:bg-amber-500/40"
          autocomplete="off"
          autocorrect="off"
          autocapitalize="off"
          spellcheck="false"
          autofocus
        />

        <!-- Verifying Spinner -->
        <div v-if="isVerifying" class="pr-2.5 flex items-center shrink-0">
          <Loader2 class="w-3.5 h-3.5 text-amber-400 animate-spin" />
        </div>
      </form>

      <!-- Error Message Hint -->
      <transition
        enter-active-class="transition duration-150 ease-out"
        enter-from-class="opacity-0 -translate-y-1"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition duration-100 ease-in"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 -translate-y-1"
      >
        <div
          v-if="hasError"
          class="text-[11px] text-rose-300 text-center font-medium py-1"
        >
          {{ errorMsg }}
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { Lock, Loader2 } from 'lucide-vue-next'
import { verifyVaultPassword } from '../../shared/crypto'

const props = defineProps<{
  isFirstTime: boolean
  salt?: string
  verifier?: string
}>()

const emit = defineEmits<{
  (e: 'unlock', pwd: string): void
  (e: 'cancel'): void
}>()

const password = ref('')
const hasError = ref(false)
const errorMsg = ref('')
const isVerifying = ref(false)
const inputRef = ref<HTMLInputElement | null>(null)
let verifyTimer: any = null

watch(password, (newVal) => {
  if (hasError.value) {
    hasError.value = false
    errorMsg.value = ''
  }

  // If first time setting up password, user will press Enter to submit
  if (props.isFirstTime) {
    return
  }

  if (!newVal || !props.salt || !props.verifier) {
    return
  }

  // Debounced auto-unlock while typing
  if (verifyTimer) clearTimeout(verifyTimer)
  verifyTimer = setTimeout(async () => {
    await checkAutoUnlock(newVal)
  }, 100)
})

async function checkAutoUnlock(val: string) {
  if (!val || !props.salt || !props.verifier) return
  isVerifying.value = true
  try {
    const valid = await verifyVaultPassword(val, props.salt, props.verifier)
    // Only emit if value hasn't changed during PBKDF2 calculation
    if (valid && password.value === val) {
      emit('unlock', val)
    }
  } catch {
    // Typing in progress, ignore verification failure
  } finally {
    isVerifying.value = false
  }
}

async function handleSubmit() {
  if (verifyTimer) clearTimeout(verifyTimer)
  const val = password.value

  if (props.isFirstTime) {
    if (val.length < 4) {
      showError('密码至少需要 4 位字符')
      return
    }
    emit('unlock', val)
    return
  }

  if (!val) {
    showError('请输入密码')
    return
  }

  if (!props.salt || !props.verifier) {
    emit('unlock', val)
    return
  }

  isVerifying.value = true
  try {
    const valid = await verifyVaultPassword(val, props.salt, props.verifier)
    if (valid) {
      emit('unlock', val)
    } else {
      showError('密码错误，请重新输入')
    }
  } catch {
    showError('密码验证失败')
  } finally {
    isVerifying.value = false
  }
}

function showError(msg: string) {
  hasError.value = true
  errorMsg.value = msg
  inputRef.value?.select()
  setTimeout(() => {
    hasError.value = false
  }, 1500)
}

function handleCancel() {
  emit('cancel')
}

function onGlobalKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    handleCancel()
  }
}

onMounted(() => {
  nextTick(() => {
    inputRef.value?.focus()
  })
  window.addEventListener('keydown', onGlobalKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onGlobalKeyDown)
  if (verifyTimer) clearTimeout(verifyTimer)
})

defineExpose({
  showError
})
</script>

<style scoped>
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20%, 60% { transform: translateX(-6px); }
  40%, 80% { transform: translateX(6px); }
}
.animate-shake {
  animation: shake 0.35s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
}
</style>
