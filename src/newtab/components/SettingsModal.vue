<template>
  <div class="fixed inset-0 z-50 bg-slate-950/75 flex items-center justify-center p-4">
    <div class="w-full max-w-3xl h-[620px] rounded-3xl modal-surface shadow-2xl flex flex-col overflow-hidden border border-white/15">
      <!-- Header -->
      <div class="flex items-center justify-between px-6 py-4 border-b border-white/10 shrink-0">
        <h2 class="text-base font-semibold text-white flex items-center gap-2">
          <Settings class="w-5 h-5 text-blue-400" />
          系统与扩展设置
        </h2>
        <button
          @click="$emit('close')"
          class="p-1 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Main Layout: Left Tabs + Right Content -->
      <div class="flex-1 flex overflow-hidden">
        <!-- Sidebar Navigation -->
        <div class="w-44 bg-slate-950/40 border-r border-white/10 p-3 space-y-1 shrink-0">
          <button
            v-for="t in tabs"
            :key="t.id"
            @click="activeTab = t.id"
            :class="[
              'w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-all text-left',
              activeTab === t.id
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            ]"
          >
            <component :is="t.icon" class="w-4 h-4 shrink-0" />
            <span>{{ t.name }}</span>
          </button>
        </div>

        <!-- Right Content Body -->
        <div class="flex-1 overflow-y-auto p-6 space-y-6">
          <!-- 0. 功能介绍与使用手册 -->
          <div v-if="activeTab === 'guide'" class="space-y-4">
            <div>
              <h3 class="text-sm font-semibold text-white flex items-center gap-1.5">
                <BookOpen class="w-4 h-4 text-blue-400" />
                MyTabs 功能全览与使用手册
              </h3>
              <p class="text-xs text-slate-400 mt-1">
                专为效率、专注与极致隐私打造的桌面级新标签页。点击下方分类可快速查阅核心功能特性与使用技巧。
              </p>
            </div>

            <!-- Category Filter Pills -->
            <div class="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
              <button
                v-for="cat in guideCategories"
                :key="cat.id"
                @click="selectedGuideCategory = cat.id"
                :class="[
                  'px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all',
                  selectedGuideCategory === cat.id
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                    : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                ]"
              >
                {{ cat.name }}
              </button>
            </div>

            <!-- Feature Cards List -->
            <div class="space-y-4">
              <div
                v-for="item in filteredGuides"
                :key="item.id"
                class="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3.5 transition-all hover:border-slate-700/80 shadow-md"
              >
                <!-- Card Header -->
                <div class="flex items-start justify-between gap-3">
                  <div class="flex items-center space-x-2.5 min-w-0">
                    <div class="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                      <component :is="item.icon" class="w-4 h-4" :class="item.iconColor" />
                    </div>
                    <div class="min-w-0">
                      <div class="text-xs font-semibold text-white flex items-center flex-wrap gap-2">
                        <span>{{ item.title }}</span>
                        <span
                          class="text-[10px] px-2 py-0.5 rounded-full font-normal border"
                          :class="item.badgeColor"
                        >
                          {{ item.badge }}
                        </span>
                      </div>
                      <div class="text-[11px] text-slate-400 mt-0.5 truncate">{{ item.categoryName }}</div>
                    </div>
                  </div>

                  <!-- Quick Jump Button -->
                  <button
                    v-if="item.targetTab && (item.targetTab !== 'vault' || isVaultActive)"
                    @click="activeTab = item.targetTab"
                    class="text-[11px] text-blue-400 hover:text-blue-300 flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 transition-colors shrink-0"
                    title="点击前往对应设置面板"
                  >
                    <span>前往设置</span>
                    <ArrowRight class="w-3 h-3" />
                  </button>
                </div>

                <!-- 1. 功能是什么 -->
                <div class="bg-white/[0.02] rounded-xl p-3 border border-white/5 space-y-1.5">
                  <div class="text-xs font-medium text-slate-200 flex items-center gap-1.5">
                    <Lightbulb class="w-3.5 h-3.5 text-amber-400" />
                    <span>功能是什么？</span>
                  </div>
                  <ul class="text-[11px] text-slate-300 space-y-1 list-disc list-inside">
                    <li v-for="(point, idx) in item.whatIsIt" :key="idx" class="leading-relaxed">
                      {{ point }}
                    </li>
                  </ul>
                </div>

                <!-- 2. 怎么使用 -->
                <div class="bg-white/[0.02] rounded-xl p-3 border border-white/5 space-y-1.5">
                  <div class="text-xs font-medium text-slate-200 flex items-center gap-1.5">
                    <Compass class="w-3.5 h-3.5 text-sky-400" />
                    <span>怎么使用？</span>
                  </div>
                  <div class="text-[11px] text-slate-300 space-y-1.5">
                    <div v-for="(step, sIdx) in item.howToUse" :key="sIdx" class="flex items-start gap-2 leading-relaxed">
                      <span class="w-4 h-4 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center justify-center text-[10px] shrink-0 mt-0.5 font-mono">
                        {{ sIdx + 1 }}
                      </span>
                      <span class="flex-1">{{ step }}</span>
                    </div>
                  </div>
                </div>

                <!-- 3. 技巧提示 -->
                <div v-if="item.tips" class="text-[11px] text-amber-300/90 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2 flex items-start gap-1.5">
                  <span class="shrink-0 font-medium">💡 技巧提示：</span>
                  <span class="flex-1">{{ item.tips }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 1. OneDrive 备份与同步 -->
          <div v-if="activeTab === 'onedrive'" class="space-y-4">
            <div>
              <h3 class="text-sm font-semibold text-white flex items-center gap-1.5">
                <Cloud class="w-4 h-4 text-sky-400" />
                OneDrive 本地文件夹直存同步
              </h3>
              <p class="text-xs text-slate-400 mt-1">
                授权一次您的本地 OneDrive 同步文件夹，配置文件变更后会自动静默保存至该目录，Windows OneDrive 客户端将实时为您备份至云端。
              </p>
            </div>

            <!-- Folder Binding Status Card -->
            <div class="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
              <div class="flex items-center justify-between">
                <div>
                  <div class="text-xs font-medium text-slate-200">当前同步目录</div>
                  <div class="text-xs text-sky-400 font-mono mt-0.5">
                    {{ settings.oneDrive?.directoryName || '尚未选择 OneDrive 文件夹' }}
                  </div>
                </div>
                <button
                  @click="handlePickOneDrive"
                  class="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium shadow-md shadow-blue-600/20 transition-all flex items-center space-x-1.5"
                >
                  <FolderSync class="w-3.5 h-3.5" />
                  <span>{{ settings.oneDrive?.hasDirectory ? '更换授权目录' : '选择 OneDrive 文件夹' }}</span>
                </button>
              </div>

              <!-- Last sync info & sync now -->
              <div v-if="settings.oneDrive?.hasDirectory" class="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span class="text-slate-400">
                  上次备份时间: {{ formatTime(settings.oneDrive?.lastSyncTime) }}
                </span>
                <div class="flex items-center space-x-2">
                  <button
                    @click="handleManualSyncToOneDrive"
                    :disabled="isSyncing"
                    class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors flex items-center space-x-1"
                  >
                    <RefreshCw class="w-3 h-3" :class="{ 'animate-spin': isSyncing }" />
                    <span>备份到云盘</span>
                  </button>
                  <button
                    @click="handleRestoreFromOneDrive"
                    class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 transition-colors"
                  >
                    从云盘恢复
                  </button>
                </div>
              </div>
            </div>

            <!-- Auto Sync Toggle -->
            <div class="flex items-center justify-between p-3.5 rounded-2xl bg-slate-900/50 border border-slate-800 text-xs">
              <div>
                <div class="font-medium text-slate-200">修改配置时自动同步</div>
                <div class="text-[11px] text-slate-400 mt-0.5">添加网址或调整布局后自动写入备份文件</div>
              </div>
              <input
                type="checkbox"
                v-model="settings.oneDrive.autoSync"
                @change="saveChanges"
                class="w-4 h-4 rounded text-blue-600 accent-blue-600 cursor-pointer"
              />
            </div>

            <!-- Manual JSON Backup fallback -->
            <div class="pt-2 border-t border-slate-800">
              <div class="text-xs font-medium text-slate-300 mb-2">手动文件备份（兜底方案）</div>
              <div class="flex items-center space-x-3">
                <button
                  @click="exportJSON"
                  class="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors flex items-center justify-center space-x-1.5"
                >
                  <Download class="w-3.5 h-3.5" />
                  <span>导出 JSON 配置文件</span>
                </button>
                <label class="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors flex items-center justify-center space-x-1.5 cursor-pointer">
                  <Upload class="w-3.5 h-3.5" />
                  <span>导入 JSON 配置文件</span>
                  <input type="file" accept=".json" @change="importJSON" class="hidden" />
                </label>
              </div>
            </div>
          </div>

          <!-- 2. 个人空间与加密锁 -->
          <div v-else-if="activeTab === 'vault'" class="space-y-4">
            <div>
              <h3 class="text-sm font-semibold text-white flex items-center gap-1.5">
                <Lock class="w-4 h-4 text-amber-400" />
                个人空间与端到端加密保护
              </h3>
              <p class="text-xs text-slate-400 mt-1">
                个人空间专为存放私密敏感网址设计，采用 Web Crypto (AES-256-GCM) 零知识强加密。
              </p>
            </div>

            <!-- Password Status & Action Buttons -->
            <div class="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3 text-xs">
              <div class="flex items-center justify-between">
                <div>
                  <div class="font-medium text-slate-200">个人空间密码保护状态</div>
                  <div class="text-emerald-400 mt-0.5 flex items-center gap-1">
                    <ShieldCheck class="w-3.5 h-3.5" />
                    <span>{{ settings.vaultVerifier ? '已启用主密码保护' : '当前为空密码（双击桌面时间即可直接进入）' }}</span>
                  </div>
                </div>
                <div class="flex items-center space-x-2">
                  <button
                    v-if="settings.vaultVerifier"
                    @click="$emit('open-change-password')"
                    class="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs shadow-md shadow-amber-500/20 transition-colors"
                  >
                    修改密码
                  </button>
                  <button
                    v-if="settings.vaultVerifier"
                    @click="$emit('clear-vault-password')"
                    class="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-300 font-medium text-xs transition-colors"
                  >
                    清除密码
                  </button>
                  <button
                    v-if="!settings.vaultVerifier"
                    @click="$emit('open-vault-setup')"
                    class="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition-colors"
                  >
                    设置密码
                  </button>
                  <button
                    @click="$emit('lock-vault')"
                    class="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition-colors"
                  >
                    立即上锁
                  </button>
                </div>
              </div>
            </div>

            <!-- Auto-Lock Timeout Setting (解开后再次锁上的时间限制) -->
            <div class="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3.5 text-xs">
              <div class="flex items-center justify-between">
                <div>
                  <div class="font-medium text-slate-200 flex items-center gap-1.5">
                    <Clock class="w-4 h-4 text-amber-400" />
                    <span>解锁后自动重新锁上的时间限制</span>
                  </div>
                  <div class="text-[11px] text-slate-400 mt-0.5">
                    解开个人空间后，超过设定的时间将自动重新锁上并返回公共分类，防止离开电脑时泄露隐私。
                  </div>
                </div>
                <div class="font-mono text-xs font-semibold text-amber-300 shrink-0">
                  {{ (settings.vaultAutoLockMinutes ?? 5) > 0 ? `${settings.vaultAutoLockMinutes ?? 5} 分钟后锁定` : '关闭页面时锁定' }}
                </div>
              </div>

              <!-- Preset Duration Options -->
              <div class="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-1">
                <button
                  v-for="opt in autoLockOptions"
                  :key="opt.value"
                  type="button"
                  @click="setAutoLockMinutes(opt.value)"
                  class="py-2 px-1 rounded-xl border text-center transition-all text-xs font-medium"
                  :class="[
                    (settings.vaultAutoLockMinutes ?? 5) === opt.value
                      ? 'bg-amber-500/20 border-amber-500/80 text-amber-300 shadow-sm'
                      : 'bg-white/5 border-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                  ]"
                >
                  {{ opt.label }}
                </button>
              </div>

              <!-- Custom Minute Input Slider/Input for Flexibility -->
              <div class="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                <span class="text-slate-400">自定义时间限制 (分钟):</span>
                <div class="flex items-center space-x-2">
                  <input
                    type="number"
                    min="1"
                    max="180"
                    :value="settings.vaultAutoLockMinutes ?? 5"
                    @change="onCustomAutoLockInput"
                    class="w-16 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono text-center text-xs focus:outline-none focus:border-amber-400"
                  />
                  <span class="text-slate-400">分钟 (0 = 仅关闭页面时锁定)</span>
                </div>
              </div>
            </div>

            <!-- Privacy Guarantee FAQ -->
            <div class="p-4 rounded-2xl bg-slate-900/50 border border-slate-800 text-xs space-y-2.5">
              <div class="font-semibold text-slate-200 flex items-center gap-1.5">
                <Shield class="w-4 h-4 text-emerald-400" />
                个人空间隐私安全解答
              </div>
              <ul class="text-slate-400 text-[11px] space-y-2 leading-relaxed">
                <li class="flex items-start gap-1.5">
                  <span class="text-emerald-400 font-bold">•</span>
                  <span><b class="text-slate-300">浏览器书签栏看不出来</b>：个人空间数据保存在扩展专有的沙盒存储内，完全脱离浏览器的原生书签体系，浏览器的书签栏、菜单、书签管理器（Ctrl+Shift+O）中绝不会有任何痕迹。</span>
                </li>
                <li class="flex items-start gap-1.5">
                  <span class="text-emerald-400 font-bold">•</span>
                  <span><b class="text-slate-300">OneDrive 备份高强度加密</b>：同步至本地 OneDrive 文件夹以及云盘的备份均为经过 AES-256 算法处理的乱码密文，无主密码即使打开 JSON 文件也无法窥视任何真实网址。</span>
                </li>
                <li class="flex items-start gap-1.5">
                  <span class="text-emerald-400 font-bold">•</span>
                  <span><b class="text-slate-300">强制无痕隔离模式</b>：个人空间内的所有网址点击时一律强制自动拉起 Chrome 原生【无痕隐私窗口】打开，底层物理零历史记录（Ctrl+H 绝无蛛丝马迹），关窗即刻销毁 Cookie 与缓存，退出浏览器自动恢复密码锁定。</span>
                </li>
              </ul>
            </div>
          </div>

          <!-- 4. AI 助手设置 -->
          <div v-else-if="activeTab === 'ai'" class="space-y-4">
            <div>
              <h3 class="text-sm font-semibold text-white flex items-center gap-1.5">
                <Sparkles class="w-4 h-4 text-indigo-400" />
                AI 侧边栏与总结设置
              </h3>
              <p class="text-xs text-slate-400 mt-1">
                只需输入您的 API Key，即可在侧边栏、右键菜单和网页总结中调用顶级大模型。
              </p>
            </div>

            <div class="space-y-3 text-xs">
              <div>
                <label class="block text-slate-300 mb-1 font-medium">模型提供商</label>
                <select
                  v-model="settings.ai.provider"
                  @change="onAIProviderChange"
                  class="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  <option v-for="(val, key) in AI_PRESETS" :key="key" :value="key">
                    {{ val.name }}
                  </option>
                </select>
              </div>

              <div>
                <label class="block text-slate-300 mb-1 font-medium">API Key (密钥)</label>
                <input
                  type="password"
                  v-model="settings.ai.apiKey"
                  @blur="saveChanges"
                  placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxx"
                  class="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label class="block text-slate-300 mb-1 font-medium">模型名称 (Model)</label>
                <input
                  type="text"
                  v-model="settings.ai.model"
                  @blur="saveChanges"
                  class="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          <!-- 5. 壁纸个性化与外观 -->
          <div v-else-if="activeTab === 'wallpaper'" class="space-y-4">
            <div>
              <h3 class="text-sm font-semibold text-white flex items-center gap-1.5">
                <Palette class="w-4 h-4 text-pink-400" />
                壁纸个性化与背景视觉调节
              </h3>
              <p class="text-xs text-slate-400 mt-1">
                支持自定义本地图片上传、网络链接、精选 4K 高清壁纸、Bing 每日壁纸与极简深色渐变。
              </p>
            </div>

            <!-- Wallpaper Mode Selector Tabs -->
            <div class="flex items-center space-x-1 p-1 bg-slate-900/90 rounded-2xl border border-slate-800 text-xs">
              <button
                v-for="sub in wallpaperSubTabs"
                :key="sub.id"
                @click="setWallpaperSubTab(sub.id)"
                :class="[
                  'flex-1 py-1.5 px-2 rounded-xl text-center font-medium transition-all text-xs truncate',
                  activeWallpaperSubTab === sub.id
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-semibold'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                ]"
              >
                {{ sub.name }}
              </button>
            </div>

            <!-- 1. 自定义壁纸 (Custom Mode) -->
            <div v-if="activeWallpaperSubTab === 'custom'" class="space-y-3 text-xs">
              <!-- Local File Upload Box -->
              <div
                class="p-4 rounded-2xl border-2 border-dashed border-slate-700/80 hover:border-blue-500/80 bg-slate-900/60 transition-all text-center cursor-pointer group"
                @click="triggerFileInput"
              >
                <input
                  ref="fileInputRef"
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/avif"
                  class="hidden"
                  @change="handleWallpaperUpload"
                />
                <div class="flex flex-col items-center justify-center space-y-2">
                  <div class="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Upload class="w-5 h-5" />
                  </div>
                  <div>
                    <div class="font-medium text-slate-200">点击选择本地壁纸图片</div>
                    <div class="text-[11px] text-slate-400 mt-0.5">支持 JPG、PNG、WebP 高清大图（自动优化适配屏幕）</div>
                  </div>
                </div>
              </div>

              <!-- Processing Indicator -->
              <div v-if="isProcessingImage" class="flex items-center justify-center space-x-2 py-2 text-xs text-blue-400">
                <RefreshCw class="w-3.5 h-3.5 animate-spin" />
                <span>正在高清优化并应用壁纸...</span>
              </div>

              <!-- Network Image URL Input -->
              <div class="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                <div class="text-xs font-medium text-slate-300">网络图片链接 (URL)</div>
                <div class="flex items-center space-x-2">
                  <input
                    type="text"
                    v-model="customImageUrl"
                    placeholder="https://images.unsplash.com/photo-..."
                    class="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
                  />
                  <button
                    @click="applyCustomImageUrl"
                    :disabled="!customImageUrl.trim()"
                    class="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-medium text-xs shadow-md shadow-blue-600/20 transition-all shrink-0"
                  >
                    应用链接
                  </button>
                </div>
              </div>

              <!-- Active Custom Wallpaper Preview -->
              <div
                v-if="settings.wallpaper.type === 'custom' && settings.wallpaper.value"
                class="relative h-28 rounded-2xl overflow-hidden border border-white/20 shadow-lg group"
              >
                <img
                  :src="settings.wallpaper.value"
                  alt="Custom Wallpaper"
                  class="w-full h-full object-cover"
                />
                <div class="absolute inset-0 bg-black/40 flex items-center justify-between px-4">
                  <div class="text-white text-xs font-medium flex items-center gap-1.5">
                    <Check class="w-4 h-4 text-emerald-400" />
                    <span>当前自定义壁纸已生效</span>
                  </div>
                  <button
                    @click="triggerFileInput"
                    class="px-2.5 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-white text-[11px] transition-all"
                  >
                    更换图片
                  </button>
                </div>
              </div>
            </div>

            <!-- 2. 精选壁纸库 (Curated Gallery) -->
            <div v-else-if="activeWallpaperSubTab === 'curated'" class="space-y-3">
              <div class="text-xs text-slate-400">点击任意壁纸即刻预览应用：</div>
              <div class="grid grid-cols-4 gap-2.5 max-h-56 overflow-y-auto pr-1">
                <div
                  v-for="w in CURATED_WALLPAPERS"
                  :key="w.id"
                  @click="selectCuratedWallpaper(w)"
                  class="relative group rounded-xl overflow-hidden aspect-video cursor-pointer border transition-all"
                  :class="[
                    settings.wallpaper.value === w.url
                      ? 'border-blue-500 ring-2 ring-blue-500/80 shadow-lg'
                      : 'border-white/10 hover:border-white/40'
                  ]"
                >
                  <img :src="w.thumb" :alt="w.name" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-1.5">
                    <span class="text-[10px] text-white/90 font-medium truncate">{{ w.name }}</span>
                  </div>
                  <div
                    v-if="settings.wallpaper.value === w.url"
                    class="absolute top-1 right-1 w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md"
                  >
                    <Check class="w-2.5 h-2.5" />
                  </div>
                </div>
              </div>
            </div>

            <!-- 3. Bing 每日壁纸 (Bing Daily) -->
            <div v-else-if="activeWallpaperSubTab === 'bing'" class="space-y-3 text-xs">
              <div class="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
                <div class="flex items-center justify-between">
                  <div>
                    <div class="font-medium text-slate-200 flex items-center gap-2">
                      <span>微软 Bing 每日壁纸</span>
                      <span
                        v-if="isBingPinned"
                        class="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-medium flex items-center gap-1"
                      >
                        <Pin class="w-3 h-3" />
                        <span>已固定当前壁纸</span>
                      </span>
                      <span
                        v-else
                        class="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] font-medium flex items-center gap-1"
                      >
                        <RefreshCw class="w-2.5 h-2.5" />
                        <span>每日自动更新中</span>
                      </span>
                    </div>
                    <div class="text-[11px] text-slate-400 mt-1">
                      {{ isBingPinned ? '已为您永久锁定今天的必应壁纸，不再随日期更换' : '每日零点自动同步微软官方必应全球精选风景高清壁纸' }}
                    </div>
                  </div>

                  <!-- Actions -->
                  <div class="flex items-center space-x-2 shrink-0">
                    <!-- If currently in daily rotation: show "固定壁纸" button -->
                    <button
                      v-if="!isBingPinned"
                      @click="pinCurrentBingWallpaper"
                      :disabled="isPinningBing"
                      class="px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/30 active:scale-95"
                      title="喜欢今天的每日壁纸？点击固定保存，不再随日期更换"
                    >
                      <Pin class="w-3.5 h-3.5" />
                      <span>{{ isPinningBing ? '正在固定...' : '固定壁纸' }}</span>
                    </button>

                    <!-- If currently pinned: show "恢复每日更新" button -->
                    <button
                      v-else
                      @click="resumeBingDaily"
                      class="px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 active:scale-95"
                      title="恢复为每天零点自动更换新壁纸"
                    >
                      <RefreshCw class="w-3.5 h-3.5 text-blue-400" />
                      <span>恢复每日更新</span>
                    </button>
                  </div>
                </div>

                <div class="relative h-32 rounded-xl overflow-hidden border border-white/10 shadow-md">
                  <img
                    :src="todayBingUrl || 'https://bing.biturl.top/?resolution=1920&format=image&index=0&mkt=zh-CN'"
                    alt="Bing Daily"
                    class="w-full h-full object-cover"
                  />
                  <div class="absolute bottom-2 left-2 right-2 px-2.5 py-1 bg-black/85 rounded-lg text-[10px] text-white flex items-center justify-between">
                    <span class="truncate">{{ bingCopyright || '今日微软 Bing 封面' }}</span>
                    <span class="shrink-0 text-white/50 ml-2 font-mono">1920 × 1080</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 4. 极简深色渐变 (Color / Gradients) -->
            <div v-else-if="activeWallpaperSubTab === 'color'" class="space-y-3 text-xs">
              <div class="text-xs text-slate-400">选择极简深色渐变，衬托图标更聚焦：</div>
              <div class="grid grid-cols-3 gap-2.5">
                <button
                  type="button"
                  v-for="grad in GRADIENT_PRESETS"
                  :key="grad.name"
                  @click="selectGradient(grad.value)"
                  class="h-16 rounded-xl border p-2 flex flex-col justify-end text-left relative transition-all"
                  :style="{ background: grad.value }"
                  :class="[
                    settings.wallpaper.value === grad.value
                      ? 'border-blue-500 ring-2 ring-blue-500/80 shadow-md'
                      : 'border-white/10 hover:border-white/30'
                  ]"
                >
                  <span class="text-[11px] font-medium text-white/90 drop-shadow-sm">{{ grad.name }}</span>
                  <div
                    v-if="settings.wallpaper.value === grad.value"
                    class="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center"
                  >
                    <Check class="w-2.5 h-2.5" />
                  </div>
                </button>
              </div>

              <!-- Custom Color picker -->
              <div class="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <span class="text-slate-300">自定义纯色背景</span>
                <input
                  type="color"
                  :value="settings.wallpaper.type === 'color' && settings.wallpaper.value?.startsWith('#') ? settings.wallpaper.value : '#0f172a'"
                  @input="onColorPickerChange"
                  class="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                />
              </div>
            </div>

            <!-- Visual Adjustment Controls (Always visible at bottom of Wallpaper tab) -->
            <div class="pt-4 border-t border-slate-800 space-y-3.5 text-xs">
              <div class="text-xs font-semibold text-slate-200">背景微调效果</div>

              <!-- Mask Darkness Slider -->
              <div>
                <div class="flex justify-between text-slate-300 mb-1">
                  <span>暗色遮罩透明度 (让图标和文字更清晰)</span>
                  <span class="font-mono text-blue-400">{{ settings.wallpaper.mask }}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="80"
                  v-model.number="settings.wallpaper.mask"
                  @input="saveChanges"
                  class="w-full accent-blue-500 cursor-pointer"
                />
              </div>

              <!-- Blur Slider -->
              <div>
                <div class="flex justify-between text-slate-300 mb-1">
                  <span>背景磨砂模糊 (亚克力毛玻璃深度)</span>
                  <span class="font-mono text-blue-400">{{ settings.wallpaper.blur }}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="25"
                  v-model.number="settings.wallpaper.blur"
                  @input="saveChanges"
                  class="w-full accent-blue-500 cursor-pointer"
                />
              </div>
            </div>

            <!-- 桌面小组件与功能开关 -->
            <div class="pt-4 border-t border-slate-800 space-y-3 text-xs">
              <div class="text-xs font-semibold text-slate-200">桌面小组件与性能</div>

              <div class="flex items-center justify-between p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800">
                <div class="space-y-0.5 pr-2">
                  <div class="font-medium text-slate-200 flex items-center gap-1.5">
                    <Flame class="w-3.5 h-3.5 text-amber-400" />
                    <span>显示实时热搜榜卡片</span>
                  </div>
                  <div class="text-[11px] text-slate-400">
                    开启后在主桌面显示可拖动热搜小组件；关闭后彻底卸载浮动层合成，显著降低 GPU 显卡开销。
                  </div>
                </div>
                <input
                  type="checkbox"
                  v-model="settings.showHotNews"
                  @change="saveChanges"
                  class="w-4 h-4 rounded text-blue-600 accent-blue-600 cursor-pointer shrink-0"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue'
import {
  Settings, X, Cloud, Lock, ShieldCheck, Sparkles, Palette,
  FolderSync, RefreshCw, Download, Upload, Trash2, Check, Pin,
  BookOpen, Compass, Video, LayoutGrid, Lightbulb, ArrowRight, Calendar, Clock, Flame
} from 'lucide-vue-next'
import { AI_PRESETS } from '../../shared/ai-client'
import { pickOneDriveDirectory, writeBackupToOneDrive, readBackupFromOneDrive } from '../../shared/onedrive'
import { exportSettingsAsJSON, importSettingsFromJSON, saveSettings } from '../../shared/storage'
import { fetchBingDailyInfo, pinCurrentWallpaperService, resumeBingDailyService } from '../../shared/wallpaper'
import type { AppSettings } from '../../shared/types'

const props = withDefaults(
  defineProps<{
    settings: AppSettings
    initialTab?: string
    currentCategoryId?: string
  }>(),
  {
    initialTab: 'guide',
    currentCategoryId: 'cat-common'
  }
)

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'update-settings', s: AppSettings): void
  (e: 'open-vault-setup'): void
  (e: 'open-change-password'): void
  (e: 'clear-vault-password'): void
  (e: 'lock-vault'): void
}>()

const isVaultActive = computed(() => {
  return props.currentCategoryId === 'cat-vault'
})

const activeTab = ref(props.initialTab || 'guide')
const isSyncing = ref(false)

// Vault Auto-Lock Options & Handlers
const autoLockOptions = [
  { label: '1 分钟', value: 1 },
  { label: '3 分钟', value: 3 },
  { label: '5 分钟', value: 5 },
  { label: '10 分钟', value: 10 },
  { label: '15 分钟', value: 15 },
  { label: '永不超时', value: 0 }
]

function setAutoLockMinutes(val: number) {
  props.settings.vaultAutoLockMinutes = val
  saveChanges()
}

function onCustomAutoLockInput(e: Event) {
  const val = parseInt((e.target as HTMLInputElement).value, 10)
  if (!isNaN(val) && val >= 0) {
    setAutoLockMinutes(val)
  }
}

// Wallpaper Subtabs & State
const wallpaperSubTabs = [
  { id: 'bing', name: 'Bing 每日' },
  { id: 'custom', name: '自定义壁纸' },
  { id: 'curated', name: '精选壁纸库' },
  { id: 'color', name: '极简渐变' }
]

const isBingDailyActive = computed(() => {
  return props.settings.wallpaper?.type === 'bing' && !props.settings.wallpaper?.isPinned
})

const isBingPinned = computed(() => {
  const wp = props.settings.wallpaper
  if (!wp) return false
  return Boolean(wp.isPinned || (wp.type === 'custom' && wp.value && !wp.value.startsWith('data:image') && (wp.value.includes('th?id=') || wp.value.includes('bing.com'))))
})

function inferInitialSubTab(): string {
  const wp = props.settings.wallpaper
  if (!wp) return 'bing'
  if (wp.type === 'bing' || isBingPinned.value) {
    return 'bing'
  }
  if (wp.type === 'unsplash') return 'curated'
  if (wp.type === 'color') return 'color'
  return 'custom'
}

const activeWallpaperSubTab = ref(inferInitialSubTab())
const customImageUrl = ref(props.settings.wallpaper.type === 'custom' && !props.settings.wallpaper.value?.startsWith('data:') && !props.settings.wallpaper.value?.includes('bing.com') ? props.settings.wallpaper.value : '')
const isProcessingImage = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)
const isPinningBing = ref(false)
const bingCopyright = ref('')
const todayBingUrl = ref('')

onMounted(() => {
  fetchTodayBingInfo()
})

watch(() => props.initialTab, (newTab) => {
  if (newTab) activeTab.value = newTab
})

watch(() => props.currentCategoryId, () => {
  if (!isVaultActive.value && activeTab.value === 'vault') {
    activeTab.value = 'guide'
  }
})

// Tab navigation list: vault settings is strictly exclusive to 个人空间
const tabs = computed(() => {
  const allTabs = [
    { id: 'guide', name: '功能介绍', icon: BookOpen },
    { id: 'onedrive', name: 'OneDrive 备份', icon: Cloud },
    { id: 'vault', name: '个人空间锁', icon: Lock },
    { id: 'ai', name: 'AI 助手模型', icon: Sparkles },
    { id: 'wallpaper', name: '壁纸个性化', icon: Palette }
  ]
  if (!isVaultActive.value) {
    return allTabs.filter(t => t.id !== 'vault')
  }
  return allTabs
})

// Guide State & Data
const selectedGuideCategory = ref('all')

const guideCategories = [
  { id: 'all', name: '全部功能' },
  { id: 'desktop', name: '常用桌面' },
  { id: 'onedrive', name: '云端备份' },
  { id: 'ai', name: 'AI 助手' },
  { id: 'wallpaper', name: '壁纸美化' },
  { id: 'sniffer', name: '视频嗅探' }
]

const guideItems = [
  {
    id: 'g-desktop',
    category: 'desktop',
    categoryName: '常用网站与桌面 Dock 管理',
    title: '常用网站导航与高清透明图标',
    badge: '核心桌面体验',
    badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    icon: LayoutGrid,
    iconColor: 'text-blue-400',
    whatIsIt: [
      '桌面级网格化书签导航，彻底告别传统浏览器书签栏的杂乱拥挤，专注高效。',
      '原生官方高清图标引擎，自动抓取并呈现高清 Apple Touch Icon 及清晰 Favicon。',
      '支持 100% 纯透明底色与多彩品牌底色随心切换，让图标轻盈通透地悬浮在桌面壁纸上。',
      'Windows 风格底部任务栏 Dock，支持鼠标滚轮横向翻页，左键单击秒级直达。'
    ],
    howToUse: [
      '添加网址：点击桌面上的【+ 添加】按钮，输入网址（如 github.com），系统会自动识别官方图标与网站标题，选择分类后点击保存。',
      '切换透明底色：鼠标右键点击任意卡片选择【编辑图标】，选择最左侧的“透明底色”按钮，即可消除外框，呈现自然透明图标。',
      '右键管理：右键点击任意书签，可呼出菜单随时修改网站标题、URL、更换图标，或选择“在无痕模式打开”及“删除”。',
      '多场景分类切换：点击任务栏常用推荐、开发者、效率办公等分类，轻松隔离不同场景的工作与生活网站。'
    ],
    tips: '若网站自带圆角白底（如 Linux.do），选择透明底色后卡片将与壁纸融为一体，无任何多余黑边框。'
  },
  {
    id: 'g-onedrive',
    category: 'onedrive',
    categoryName: 'OneDrive 本地文件夹直存同步',
    title: 'OneDrive 本地直存云端备份与恢复',
    badge: '100% 数据归您所有',
    badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
    icon: Cloud,
    iconColor: 'text-sky-400',
    targetTab: 'onedrive',
    whatIsIt: [
      '创新的本地直存型云端同步方案，基于 Chrome 官方 File System Access 授权协议。',
      '数据以标准 JSON 直接写入您本地电脑的 OneDrive 目录，借由 Windows 官方 OneDrive 客户端实时自动上传到微软云端。',
      '零信任、零第三方服务器中转：无需注册第三方账号，所有书签、分类、密码哈希与壁纸配置完全存放在您自己的微软云盘中。'
    ],
    howToUse: [
      '首次绑定目录：进入左侧【OneDrive 备份】，点击【选择 OneDrive 文件夹】（或更换授权目录），选中电脑上的 OneDrive 文件夹（如 OneDrive/MyTabs）。',
      '自动静默同步：勾选“修改配置时自动同步”，添加或修改网址、调整图标后，系统均在后台 1 秒内静默写入备份。',
      '换新机/重装恢复：在另一台电脑或重装浏览器后，同样授权该 OneDrive 目录，点击【从云盘恢复】，全部个性化配置瞬间还原！',
      '离线 JSON 导出导入：随时可点击【导出 JSON 配置文件】将数据下载至本地，或随时【导入 JSON 配置文件】。'
    ],
    tips: '即使电脑离线或断网，扩展依然能在本地正常读写，重新连网后 OneDrive 会自动推送最新版本至云端。'
  },
  {
    id: 'g-ai',
    category: 'ai',
    categoryName: 'AI 智能助手（侧边栏 Copilot）',
    title: '多模型 AI 对话副驾驶',
    badge: '桌面生产力副驾驶',
    badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    icon: Sparkles,
    iconColor: 'text-indigo-400',
    targetTab: 'ai',
    whatIsIt: [
      '集成在浏览器侧边栏的原生 AI 生产力对话副驾驶，新标签页随时问答、无需跳转外部网页。',
      '兼容通用 OpenAI 接口规范，预设支持 DeepSeek（官方高速大模型）、OpenAI（GPT-4o）、Kimi（Moonshot）、通义千问等。',
      '支持实时打字机流式输出、长文本上下文多轮对话与代码块一键复制。'
    ],
    howToUse: [
      '配置 API Key：在左侧【AI 助手模型】中选择服务商（推荐 DeepSeek，高智商极速响应），填入 API Key 并点击保存。',
      '随时呼出侧边栏：点击桌面主搜索框右侧的 AI 图标，或底部任务栏的【AI】药丸按钮，右侧抽屉式面板即刻滑出。',
      '高效对话提问：支持向 AI 询问代码逻辑、文本翻译、公文撰写或解答任意专业技术疑难。'
    ],
    tips: '侧边栏支持随时收起与展开，不打扰主桌面使用，且对话数据安全保存在本地。'
  },
  {
    id: 'g-wallpaper',
    category: 'wallpaper',
    categoryName: '壁纸个性化与视觉调校',
    title: 'Bing 每日壁纸与亚克力毛玻璃',
    badge: '4K 视觉与毛玻璃',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    icon: Palette,
    iconColor: 'text-amber-400',
    targetTab: 'wallpaper',
    whatIsIt: [
      '支持微软 Bing 每日 4K 锁屏风景壁纸自动同步，每日探索全球顶尖自然风光。',
      '内置精选高分辨率风景壁纸库、支持粘贴任意自定义图片 URL 或本地上传高清壁纸。',
      '自由调节亚克力毛玻璃磨砂度（Blur）与暗色遮罩透明度（Mask），打造精致桌面。'
    ],
    howToUse: [
      '开启每日 Bing：在左侧【壁纸个性化】中切换至【Bing 每日】，每天打开新标签页自动同步最新世界风景。',
      '固定今日壁纸：若遇到特别喜欢的当日必应壁纸，点击【固定当前壁纸】即可将其永久锁定保留。',
      '自定义壁纸：切换至“自定义壁纸”，可直接粘贴高清网络图片链接，或点击“上传本地图片”。',
      '调校舒适度：拖动“背景暗色遮罩”使文字更清晰，拖动“背景磨砂模糊”打造沉浸的 Windows 亚克力视觉效果。'
    ],
    tips: '推荐将遮罩调至 20%~30%，模糊度设为 0~5px，既能清晰看清壁纸细节，又能保证桌面图标与文字的高可读性。'
  },
  {
    id: 'g-sniffer',
    category: 'sniffer',
    categoryName: '网页音视频资源嗅探与提取',
    title: '原生视频与 HLS (M3U8) 流媒体嗅探',
    badge: '原生媒体解析',
    badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    icon: Video,
    iconColor: 'text-rose-400',
    whatIsIt: [
      '扩展内置无感网络流媒体嗅探引擎，自动捕获正在播放的视频资源。',
      '精准识别标准 MP4 / WebM 直链以及流媒体 HLS (.m3u8) 切片索引。',
      '纯本地内核嗅探，绝无任何第三方外部中转解析接口，完全保障数据安全。'
    ],
    howToUse: [
      '浏览视频：在任意包含在线视频播放的网页中正常播放视频。',
      '打开嗅探面板：点击 Chrome 浏览器右上角扩展栏的【MyTabs】插件图标。',
      '查看与复制：弹窗会清晰列出嗅探到的媒体流链接、码率与格式标识。',
      '本地播放或合并：点击【复制链接】可在 PotPlayer、VLC 等本地播放器中直接播放；或点击【复制下载命令】使用标准 FFmpeg 工具本地合并为完整 MP4。'
    ],
    tips: '嗅探功能在您浏览视频页面时自动就绪，点击右上角图标即可即时提取，无需任何复杂配置。'
  }
]

const filteredGuides = computed(() => {
  if (selectedGuideCategory.value === 'all') return guideItems
  return guideItems.filter(g => g.category === selectedGuideCategory.value)
})

const CURATED_WALLPAPERS = [
  {
    id: 'w-1',
    name: '雪山星夜',
    url: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1920&q=80',
    thumb: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=320&q=70'
  },
  {
    id: 'w-2',
    name: '晨曦森林',
    url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1920&q=80',
    thumb: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=320&q=70'
  },
  {
    id: 'w-3',
    name: '蔚蓝深海',
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1920&q=80',
    thumb: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=320&q=70'
  },
  {
    id: 'w-4',
    name: '赛博霓虹',
    url: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=1920&q=80',
    thumb: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=320&q=70'
  },
  {
    id: 'w-5',
    name: '极简流体',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1920&q=80',
    thumb: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=320&q=70'
  },
  {
    id: 'w-6',
    name: '富士日落',
    url: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1920&q=80',
    thumb: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=320&q=70'
  },
  {
    id: 'w-7',
    name: '深空星云',
    url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1920&q=80',
    thumb: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=320&q=70'
  },
  {
    id: 'w-8',
    name: '治愈秋原',
    url: 'https://images.unsplash.com/photo-1470240731273-7821a6eeb6bd?auto=format&fit=crop&w=1920&q=80',
    thumb: 'https://images.unsplash.com/photo-1470240731273-7821a6eeb6bd?auto=format&fit=crop&w=320&q=70'
  }
]

const GRADIENT_PRESETS = [
  { name: '深邃星空', value: 'linear-gradient(135deg, #090d16 0%, #1e1b4b 50%, #0f172a 100%)' },
  { name: '赛博暗紫', value: 'linear-gradient(135deg, #180e29 0%, #2d124d 50%, #0d0d1b 100%)' },
  { name: '极光深绿', value: 'linear-gradient(135deg, #061a14 0%, #0d3326 50%, #050f0c 100%)' },
  { name: '暖调可可', value: 'linear-gradient(135deg, #1c1412 0%, #32211c 50%, #140d0c 100%)' },
  { name: '极夜玄黑', value: '#000000' },
  { name: '哑光太空灰', value: '#13151a' }
]

function formatTime(timestamp?: number) {
  if (!timestamp) return '从未同步'
  return new Date(timestamp).toLocaleString('zh-CN', { hour12: false })
}

async function handlePickOneDrive() {
  const res = await pickOneDriveDirectory()
  if (res.success && res.dirName) {
    props.settings.oneDrive.hasDirectory = true
    props.settings.oneDrive.directoryName = res.dirName
    await handleManualSyncToOneDrive()
  } else if (res.error) {
    alert(res.error)
  }
}

async function handleManualSyncToOneDrive() {
  isSyncing.value = true
  const res = await writeBackupToOneDrive(props.settings)
  isSyncing.value = false
  if (res.success && res.timestamp) {
    props.settings.oneDrive.lastSyncTime = res.timestamp
    await saveSettings(props.settings, false)
    alert('已成功备份到云盘！')
  } else {
    alert(`备份失败: ${res.error}`)
  }
}

async function handleRestoreFromOneDrive() {
  if (!confirm('从 OneDrive 恢复备份将覆盖当前的所有设置与书签，确定继续吗？')) return
  const res = await readBackupFromOneDrive()
  if (res.success && res.data) {
    emit('update-settings', res.data)
    alert('已成功从 OneDrive 恢复配置！')
  } else {
    alert(`恢复失败: ${res.error}`)
  }
}

function exportJSON() {
  exportSettingsAsJSON(props.settings)
}

async function importJSON(e: Event) {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return
  try {
    const data = await importSettingsFromJSON(file)
    emit('update-settings', data)
    alert('导入配置文件成功！')
  } catch (err: any) {
    alert(`导入失败: ${err.message}`)
  }
}

function onAIProviderChange() {
  const preset = AI_PRESETS[props.settings.ai.provider]
  if (preset) {
    props.settings.ai.baseUrl = preset.baseUrl
    props.settings.ai.model = preset.defaultModel
  }
  saveChanges()
}

// Wallpaper handlers
function setWallpaperSubTab(subId: string) {
  activeWallpaperSubTab.value = subId
  if (subId === 'bing') {
    if (!isBingDailyActive.value && !isBingPinned.value) {
      selectBingDaily()
    }
    fetchTodayBingInfo()
  }
}

async function fetchTodayBingInfo() {
  try {
    const info = await fetchBingDailyInfo()
    if (info) {
      bingCopyright.value = info.copyright
      todayBingUrl.value = info.url
    }
  } catch (err) {
    console.warn('Failed to fetch Bing info:', err)
  }
}

async function pinCurrentBingWallpaper() {
  isPinningBing.value = true
  try {
    const { settings: nextSettings, info } = await pinCurrentWallpaperService(props.settings)
    emit('update-settings', nextSettings)
    if (info) {
      bingCopyright.value = info.copyright
      todayBingUrl.value = info.url
    }
  } catch (err) {
    console.error('Failed to pin wallpaper:', err)
    alert('固定壁纸失败，请重试')
  } finally {
    isPinningBing.value = false
  }
}

async function resumeBingDaily() {
  try {
    const nextSettings = await resumeBingDailyService(props.settings)
    emit('update-settings', nextSettings)
  } catch (err) {
    console.error('Failed to resume daily wallpaper:', err)
  }
}

function triggerFileInput() {
  fileInputRef.value?.click()
}

async function handleWallpaperUpload(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return

  isProcessingImage.value = true
  try {
    const dataUrl = await compressImage(file)
    props.settings.wallpaper.type = 'custom'
    props.settings.wallpaper.value = dataUrl
    customImageUrl.value = ''
    await saveChanges()
  } catch (err) {
    alert('壁纸图片读取失败，请检查文件格式')
  } finally {
    isProcessingImage.value = false
    if (fileInputRef.value) fileInputRef.value.value = ''
  }
}

function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height
        const maxDimension = 2560
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width)
            width = maxDimension
          } else {
            width = Math.round((width * maxDimension) / height)
            height = maxDimension
          }
        }
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx?.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', 0.88))
      }
      img.onerror = reject
      img.src = e.target?.result as string
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function applyCustomImageUrl() {
  const url = customImageUrl.value.trim()
  if (!url) return
  props.settings.wallpaper.type = 'custom'
  props.settings.wallpaper.value = url
  saveChanges()
}

function selectCuratedWallpaper(w: { url: string }) {
  props.settings.wallpaper.type = 'unsplash'
  props.settings.wallpaper.value = w.url
  saveChanges()
}

function selectBingDaily() {
  props.settings.wallpaper.type = 'bing'
  props.settings.wallpaper.value = 'https://bing.biturl.top/?resolution=1920&format=image&index=0&mkt=zh-CN'
  saveChanges()
}

function selectGradient(val: string) {
  props.settings.wallpaper.type = 'color'
  props.settings.wallpaper.value = val
  saveChanges()
}

function onColorPickerChange(e: Event) {
  const color = (e.target as HTMLInputElement).value
  selectGradient(color)
}

async function saveChanges() {
  await saveSettings(props.settings)
  emit('update-settings', { ...props.settings })
}
</script>
