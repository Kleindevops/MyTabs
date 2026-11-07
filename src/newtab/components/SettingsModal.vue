<template>
  <div data-no-selection-translate="true" class="fixed inset-0 z-50 bg-slate-950/75 flex items-center justify-center p-4">
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

          <!-- 沉浸式翻译配置面板 -->
          <div v-else-if="activeTab === 'translate'" class="space-y-4">
            <div>
              <h3 class="text-sm font-semibold text-white flex items-center gap-1.5">
                <Languages class="w-4 h-4 text-indigo-400" />
                沉浸式翻译 (双语对照与划词释义)
              </h3>
              <p class="text-xs text-slate-400 mt-1">
                采用微软 Edge 官方免翻墙、免 API Key 国内极速直连通道，毫秒级响应，无需在本地部署大模型，完全零磁盘与显存占用。
              </p>
            </div>

            <!-- 核心状态卡片 / 引擎信息 -->
            <div class="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-between">
              <div class="flex items-center space-x-3">
                <div class="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-bold text-sm">
                  译
                </div>
                <div>
                  <div class="text-xs font-semibold text-white flex items-center gap-2">
                    <span>微软 Edge 官方直连引擎</span>
                    <span class="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">国内极速直连 · 0配置</span>
                  </div>
                  <div class="text-[11px] text-slate-400 mt-0.5">支持整页长篇段落对照、长句流畅解析、抗限流与零知识隐私</div>
                </div>
              </div>
              <div class="text-right">
                <span class="text-[11px] font-mono text-indigo-300 bg-indigo-950/60 px-2 py-1 rounded-md border border-indigo-800">
                  快捷键: Alt + W
                </span>
              </div>
            </div>

            <!-- 细项开关列表 -->
            <div class="space-y-3">
              <!-- 1. 功能总开关 -->
              <div class="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                <div>
                  <div class="text-xs font-semibold text-white">启用沉浸式翻译功能</div>
                  <div class="text-[11px] text-slate-400 mt-0.5">在所有网页支持快捷键唤起双语对照、划词气泡与输入框翻译</div>
                </div>
                <input
                  type="checkbox"
                  v-model="currentImmersiveConfig.enabled"
                  @change="saveChanges"
                  class="w-4 h-4 rounded text-blue-600 accent-blue-600 cursor-pointer"
                />
              </div>

              <!-- 2. 目标语言选择 -->
              <div class="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                <div class="text-xs font-semibold text-white">默认目标翻译语言</div>
                <div class="text-[11px] text-slate-400">网页外文将默认自动翻译为该目标语言：</div>
                <div class="grid grid-cols-3 gap-2 pt-1">
                  <button
                    v-for="lang in [
                      { id: 'zh-Hans', name: '简体中文 (推荐)' },
                      { id: 'zh-Hant', name: '繁体中文' },
                      { id: 'en', name: 'English (英语)' },
                      { id: 'ja', name: '日本語 (日语)' },
                      { id: 'ko', name: '한국어 (韩语)' },
                      { id: 'fr', name: 'Français (法语)' }
                    ]"
                    :key="lang.id"
                    @click="setTargetLang(lang.id)"
                    :class="[
                      'p-2.5 rounded-xl text-xs font-medium border text-left transition-all',
                      currentImmersiveConfig.targetLang === lang.id
                        ? 'bg-blue-600/20 border-blue-500 text-blue-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                    ]"
                  >
                    {{ lang.name }}
                  </button>
                </div>
              </div>

              <!-- 3. 双语对照译文排版样式 -->
              <div class="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                <div class="text-xs font-semibold text-white">双语对照译文排版样式</div>
                <div class="text-[11px] text-slate-400">选择页面段落插入译文时的视觉呈现风格：</div>
                <div class="grid grid-cols-3 gap-2 pt-1">
                  <button
                    v-for="st in [
                      { id: 'dashed', name: '虚线优雅 (默认)', desc: '段落下方附带浅灰虚线，轻盈不喧宾夺主' },
                      { id: 'block', name: '微底色块', desc: '微透明蓝底卡片与左侧强调条，层次分明' },
                      { id: 'highlight', name: '淡黄高亮', desc: '温润荧光高亮底纹，适合研读精读' }
                    ]"
                    :key="st.id"
                    @click="setBilingualStyle(st.id)"
                    :class="[
                      'p-2.5 rounded-xl text-xs border text-left transition-all flex flex-col justify-between',
                      currentImmersiveConfig.bilingualStyle === st.id
                        ? 'bg-blue-600/20 border-blue-500 text-blue-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                    ]"
                  >
                    <div class="font-medium text-white mb-1">{{ st.name }}</div>
                    <div class="text-[10px] text-slate-400 leading-tight">{{ st.desc }}</div>
                  </button>
                </div>
              </div>

              <!-- 4. 划词翻译与触发方式 -->
              <div class="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
                <div class="flex items-center justify-between">
                  <div>
                    <div class="text-xs font-semibold text-white flex items-center gap-2">
                      <span>划词翻译功能</span>
                      <span
                        v-if="currentImmersiveConfig.selectionTranslate"
                        class="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                      >
                        已开启
                      </span>
                      <span
                        v-else
                        class="text-[10px] px-2 py-0.5 rounded-full bg-slate-700/50 text-slate-400 border border-slate-700"
                      >
                        已禁用
                      </span>
                    </div>
                    <div class="text-[11px] text-slate-400 mt-0.5">
                      在网页或桌面中选中文本、双击词句时提供即时翻译卡片、音标与语音朗读
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    v-model="currentImmersiveConfig.selectionTranslate"
                    @change="saveChanges"
                    class="w-4 h-4 rounded text-blue-600 accent-blue-600 cursor-pointer"
                  />
                </div>

                <!-- 触发方式选择：是直接翻译 还是弹窗翻译 (仅在划词翻译开启时展示) -->
                <div v-if="currentImmersiveConfig.selectionTranslate" class="pt-2.5 border-t border-slate-800/80 space-y-2">
                  <div class="text-[11px] font-medium text-slate-300">划词触发方式：</div>
                  <div class="grid grid-cols-2 gap-2.5">
                    <!-- 方式 A: 弹窗翻译 (气泡图标触发) -->
                    <button
                      type="button"
                      @click="setSelectionTriggerMode('bubble')"
                      :class="[
                        'p-3 rounded-xl text-left border transition-all flex flex-col justify-between space-y-1.5',
                        (currentImmersiveConfig.selectionTriggerMode || 'bubble') === 'bubble'
                          ? 'bg-blue-600/20 border-blue-500 text-blue-300 shadow-sm shadow-blue-500/10'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                      ]"
                    >
                      <div class="flex items-center justify-between">
                        <span class="text-xs font-semibold text-white flex items-center gap-1.5">
                          <span
                            class="w-2 h-2 rounded-full"
                            :class="(currentImmersiveConfig.selectionTriggerMode || 'bubble') === 'bubble' ? 'bg-blue-400' : 'bg-slate-600'"
                          ></span>
                          弹窗翻译 (悬浮图标)
                        </span>
                        <span class="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">推荐</span>
                      </div>
                      <div class="text-[10px] text-slate-400 leading-relaxed">
                        选中文本后显示悬浮“译”图标，鼠标点击或悬停时再展开翻译卡片，不干扰正常阅读与选词复制。
                      </div>
                    </button>

                    <!-- 方式 B: 直接翻译 (直接自动弹出卡片) -->
                    <button
                      type="button"
                      @click="setSelectionTriggerMode('direct')"
                      :class="[
                        'p-3 rounded-xl text-left border transition-all flex flex-col justify-between space-y-1.5',
                        currentImmersiveConfig.selectionTriggerMode === 'direct'
                          ? 'bg-blue-600/20 border-blue-500 text-blue-300 shadow-sm shadow-blue-500/10'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                      ]"
                    >
                      <div class="flex items-center justify-between">
                        <span class="text-xs font-semibold text-white flex items-center gap-1.5">
                          <span
                            class="w-2 h-2 rounded-full"
                            :class="currentImmersiveConfig.selectionTriggerMode === 'direct' ? 'bg-blue-400' : 'bg-slate-600'"
                          ></span>
                          直接翻译 (直接弹出卡片)
                        </span>
                      </div>
                      <div class="text-[10px] text-slate-400 leading-relaxed">
                        鼠标选中文本（或双击单词）直接自动弹出翻译卡片，一步到位无需二次点击。
                      </div>
                    </button>
                  </div>
                </div>
              </div>

              <!-- 5. 输入框 3 次空格翻译 -->
              <div class="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                <div>
                  <div class="text-xs font-semibold text-white">输入框连按 3 次空格极速互翻</div>
                  <div class="text-[11px] text-slate-400 mt-0.5">在任何输入框打中文连敲 3 次空格即刻原地翻译为地道英文（反之亦然），无需切换外部工具</div>
                </div>
                <input
                  type="checkbox"
                  v-model="currentImmersiveConfig.tripleSpaceTranslate"
                  @change="saveChanges"
                  class="w-4 h-4 rounded text-blue-600 accent-blue-600 cursor-pointer"
                />
              </div>
            </div>
          </div>

          <!-- 搜索引擎管理与自定义网址 -->
          <div v-else-if="activeTab === 'search'" class="space-y-4">
            <div class="flex items-start justify-between gap-4">
              <div>
                <h3 class="text-sm font-semibold text-white flex items-center gap-1.5">
                  <Search class="w-4 h-4 text-blue-400" />
                  搜索引擎管理与自定义网址
                </h3>
                <p class="text-xs text-slate-400 mt-1">
                  自定义主桌面聚合搜索框的搜索引擎。支持添加任意自定义搜索网址（使用 %s 代替关键词），支持设置默认引擎及快捷轮换。
                </p>
              </div>
              <div class="flex items-center gap-2 shrink-0">
                <button
                  @click="openAddEngineForm"
                  class="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium shadow-md shadow-blue-600/20 transition-all flex items-center space-x-1.5"
                >
                  <Plus class="w-3.5 h-3.5" />
                  <span>添加搜索引擎</span>
                </button>
                <button
                  @click="handleResetSearchEngines"
                  title="恢复为系统出厂预设的 5 款经典搜索引擎"
                  class="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                >
                  <RotateCcw class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <!-- 添加 / 编辑搜索引擎表单卡片 -->
            <div
              v-if="showEngineForm"
              class="p-4 rounded-2xl bg-slate-900/90 border border-blue-500/30 space-y-3.5 shadow-xl transition-all"
            >
              <div class="flex items-center justify-between border-b border-white/10 pb-2.5">
                <div class="text-xs font-semibold text-white flex items-center gap-1.5">
                  <Edit2 v-if="editingEngineId" class="w-3.5 h-3.5 text-blue-400" />
                  <Plus v-else class="w-3.5 h-3.5 text-blue-400" />
                  <span>{{ editingEngineId ? '编辑搜索引擎' : '添加自定义搜索引擎' }}</span>
                </div>
                <button
                  @click="closeEngineForm"
                  class="p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X class="w-4 h-4" />
                </button>
              </div>

              <div class="space-y-3 text-xs">
                <!-- 引擎名称 -->
                <div>
                  <label class="block text-slate-300 mb-1 font-medium">引擎名称 <span class="text-rose-400">*</span></label>
                  <input
                    type="text"
                    v-model="engineForm.name"
                    placeholder="例如: DuckDuckGo、知乎、Google 学术"
                    class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>

                <!-- 搜索网址 (URL) -->
                <div>
                  <label class="block text-slate-300 mb-1 font-medium">
                    搜索网址 (URL) <span class="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    v-model="engineForm.url"
                    placeholder="例如: https://duckduckgo.com/?q=%s"
                    class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-500 font-mono text-xs focus:outline-none focus:border-blue-500 transition-colors"
                  />
                  <div class="mt-1.5 text-[11px] text-sky-400/90 flex items-start gap-1 bg-sky-500/10 p-2 rounded-lg border border-sky-500/20">
                    <Lightbulb class="w-3.5 h-3.5 shrink-0 mt-0.5 text-sky-400" />
                    <span>在网址中使用 <code class="px-1 py-0.5 rounded bg-sky-950/60 font-mono text-sky-300 font-bold">%s</code> 代替搜索关键词。若未包含 %s，系统在回车搜索时会自动拼接到末尾。</span>
                  </div>
                </div>

                <!-- 搜索提示词 (可选) -->
                <div>
                  <label class="block text-slate-300 mb-1 font-medium">输入框占位提示词 (可选)</label>
                  <input
                    type="text"
                    v-model="engineForm.placeholder"
                    :placeholder="engineForm.name ? `${engineForm.name} 搜索...` : '例如: 输入搜索词...'"
                    class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>

                <!-- 设为默认勾选 -->
                <div class="flex items-center space-x-2 pt-1">
                  <input
                    type="checkbox"
                    id="set-as-default-engine"
                    v-model="engineForm.isDefault"
                    class="w-4 h-4 rounded text-blue-600 accent-blue-600 cursor-pointer"
                  />
                  <label for="set-as-default-engine" class="text-slate-300 cursor-pointer select-none">
                    设为默认搜索引擎（打开新标签页时优先使用）
                  </label>
                </div>
              </div>

              <!-- 表单操作按钮 -->
              <div class="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800">
                <button
                  @click="closeEngineForm"
                  class="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
                >
                  取消
                </button>
                <button
                  @click="handleSaveEngine"
                  class="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/30 transition-all flex items-center space-x-1"
                >
                  <Check class="w-3.5 h-3.5" />
                  <span>{{ editingEngineId ? '保存修改' : '确认添加' }}</span>
                </button>
              </div>
            </div>

            <!-- 常用搜索引擎快捷推荐模板 (One-Click Presets) -->
            <div class="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
              <div class="flex items-center justify-between text-xs">
                <div class="font-medium text-slate-300 flex items-center gap-1.5">
                  <Sparkles class="w-3.5 h-3.5 text-amber-400" />
                  <span>常用搜索引擎一键添加</span>
                </div>
                <span class="text-[11px] text-slate-400">点击即可快速加入列表</span>
              </div>
              <div class="flex flex-wrap gap-1.5 pt-1">
                <button
                  v-for="preset in availablePresets"
                  :key="preset.name"
                  @click="applyEnginePreset(preset)"
                  class="px-2.5 py-1 rounded-lg text-xs font-medium bg-white/5 hover:bg-blue-600/20 text-slate-300 hover:text-blue-300 border border-white/5 hover:border-blue-500/30 transition-all flex items-center space-x-1.5 group"
                  :title="preset.url"
                >
                  <Plus class="w-3 h-3 text-slate-400 group-hover:text-blue-400" />
                  <span>{{ preset.name }}</span>
                  <span class="text-[10px] text-slate-400 group-hover:text-blue-300/80">({{ preset.category }})</span>
                </button>
                <div v-if="availablePresets.length === 0" class="text-xs text-slate-500 py-1">
                  所有常用预设搜索引擎均已添加
                </div>
              </div>
            </div>

            <!-- 搜索引擎列表展示 -->
            <div class="space-y-2">
              <div class="text-xs font-medium text-slate-400 flex items-center justify-between px-1">
                <span>已启用的搜索引擎 (共 {{ currentEngines.length }} 款)</span>
                <span class="text-[11px] text-slate-500">可在桌面搜索框按 Tab 快速轮换</span>
              </div>

              <div class="space-y-2">
                <div
                  v-for="engine in currentEngines"
                  :key="engine.id"
                  class="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700/80 transition-all flex items-center justify-between gap-3 shadow-md"
                >
                  <div class="flex items-center space-x-3 min-w-0">
                    <div class="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 text-slate-300">
                      <component :is="getEngineIcon(engine)" class="w-4 h-4 text-blue-400" />
                    </div>
                    <div class="min-w-0">
                      <div class="text-xs font-semibold text-white flex items-center gap-2">
                        <span>{{ engine.name }}</span>
                        <!-- 默认标签 -->
                        <span
                          v-if="isDefaultEngine(engine.id)"
                          class="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-normal"
                        >
                          默认
                        </span>
                        <!-- 自定义标签 -->
                        <span
                          v-if="engine.isCustom"
                          class="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-normal"
                        >
                          自定义
                        </span>
                      </div>
                      <div class="text-[11px] text-slate-400 font-mono mt-0.5 truncate max-w-sm" :title="engine.url">
                        {{ engine.url }}
                      </div>
                    </div>
                  </div>

                  <!-- 动作按钮组 -->
                  <div class="flex items-center space-x-1.5 shrink-0">
                    <!-- 设为默认按钮 -->
                    <button
                      v-if="!isDefaultEngine(engine.id)"
                      @click="setDefaultEngine(engine.id)"
                      class="text-[11px] px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
                      title="设为新标签页默认搜索引擎"
                    >
                      设为默认
                    </button>

                    <!-- 编辑按钮 -->
                    <button
                      @click="editEngine(engine)"
                      class="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200 transition-colors"
                      title="编辑此搜索引擎"
                    >
                      <Edit2 class="w-3.5 h-3.5" />
                    </button>

                    <!-- 删除按钮 -->
                    <button
                      @click="deleteEngine(engine)"
                      :disabled="currentEngines.length <= 1"
                      class="p-1.5 rounded-lg bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 transition-colors disabled:opacity-30 disabled:hover:bg-white/5 disabled:hover:text-slate-400"
                      title="删除此搜索引擎"
                    >
                      <Trash2 class="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 1. 数据备份与云盘同步 (自定义目录与文件) -->
          <div v-else-if="activeTab === 'onedrive'" class="space-y-4">
            <div>
              <h3 class="text-sm font-semibold text-white flex items-center gap-1.5">
                <Cloud class="w-4 h-4 text-sky-400" />
                本地文件夹 / 云盘目录同步备份
              </h3>
              <p class="text-xs text-slate-400 mt-1">
                支持自由指定电脑上的任意文件夹（如 OneDrive、坚果云、本地磁盘等）及自定义备份文件名。插件本体与备份文件完全物理隔离，您可以将插件放置于任何目录运行。
              </p>
            </div>

            <!-- Folder Binding Status Card -->
            <div class="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
              <!-- Folder Selection Row -->
              <div class="flex items-center justify-between">
                <div>
                  <div class="text-xs font-medium text-slate-200">当前同步文件夹</div>
                  <div class="text-xs text-sky-400 font-mono mt-0.5 flex items-center gap-1.5">
                    <FolderSync class="w-3.5 h-3.5 shrink-0" />
                    <span>{{ settings.oneDrive?.directoryName || '尚未选择同步文件夹' }}</span>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <button
                    @click="handlePickOneDrive"
                    class="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium shadow-md shadow-blue-600/20 transition-all flex items-center space-x-1.5"
                  >
                    <FolderSync class="w-3.5 h-3.5" />
                    <span>{{ settings.oneDrive?.hasDirectory ? '更换授权目录' : '选择存储文件夹' }}</span>
                  </button>
                  <button
                    v-if="settings.oneDrive?.hasDirectory"
                    @click="handleUnbindOneDrive"
                    title="解除目录授权绑定"
                    class="p-1.5 rounded-xl bg-slate-800 hover:bg-rose-900/50 text-slate-400 hover:text-rose-300 transition-colors"
                  >
                    <Trash2 class="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <!-- Custom Backup File Name -->
              <div class="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <div>
                  <div class="font-medium text-slate-200">指定备份文件名</div>
                  <div class="text-[11px] text-slate-400 mt-0.5">默认在所选目录下读写此 JSON 文件</div>
                </div>
                <div class="flex items-center gap-1.5">
                  <input
                    type="text"
                    v-model="settings.oneDrive.backupFileName"
                    @blur="handleBackupFileNameChange"
                    @keyup.enter="handleBackupFileNameChange"
                    placeholder="mytabs_backup.json"
                    class="w-48 px-2.5 py-1 rounded-lg bg-slate-800/90 border border-slate-700 text-white text-xs font-mono focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              <!-- Status Pill & Actions -->
              <div v-if="settings.oneDrive?.hasDirectory" class="pt-3 border-t border-slate-800/80 space-y-3">
                <!-- Status Badge -->
                <div class="flex items-center justify-between text-xs flex-wrap gap-2">
                  <div class="flex items-center gap-2">
                    <span class="text-slate-400">同步状态:</span>
                    <!-- 1. Remote Newer -->
                    <span v-if="syncState === 'remote_newer'" class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-300 text-[11px] font-medium animate-pulse">
                      <span class="w-1.5 h-1.5 rounded-full bg-sky-400"></span>
                      检测到外部文件更新 (可同步)
                    </span>
                    <!-- 2. Local Newer -->
                    <span v-else-if="syncState === 'local_newer'" class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-medium">
                      <span class="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                      浏览器有新修改 (待备份)
                    </span>
                    <!-- 3. Synced -->
                    <span v-else class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[11px] font-medium">
                      <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      已同步至指定文件 (最新)
                    </span>
                  </div>

                  <span class="text-[11px] text-slate-500">
                    上次落盘: {{ formatTime(settings.oneDrive?.lastSyncTime) }}
                  </span>
                </div>

                <!-- Action Buttons -->
                <div class="flex items-center justify-between pt-1 flex-wrap gap-2">
                  <div class="text-[11px] text-slate-400">
                    <span v-if="syncState === 'remote_newer'">
                      外部文件更新于 {{ formatTime(remoteUpdateInfo.remoteModified) }}，包含 {{ remoteUpdateInfo.bookmarkCount }} 个书签
                    </span>
                    <span v-else-if="syncState === 'local_newer'">
                      本地产生新的修改，可点击备份或等待自动保存
                    </span>
                    <span v-else>
                      本地浏览器与磁盘备份数据完全一致
                    </span>
                  </div>

                  <div class="flex items-center space-x-2">
                    <!-- Backup Button -->
                    <button
                      @click="() => handleManualSyncToOneDrive(true)"
                      :disabled="isSyncing"
                      class="px-2.5 py-1 rounded-lg text-xs font-medium transition-colors flex items-center space-x-1"
                      :class="syncState === 'local_newer' ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-sm' : 'bg-slate-800 hover:bg-slate-700 text-slate-200'"
                    >
                      <RefreshCw class="w-3 h-3" :class="{ 'animate-spin': isSyncing }" />
                      <span>立即备份到文件</span>
                    </button>

                    <!-- Restore Button -->
                    <button
                      @click="handleRestoreFromOneDrive"
                      class="px-2.5 py-1 rounded-lg text-xs font-medium transition-colors"
                      :class="syncState === 'remote_newer' ? 'bg-sky-600 hover:bg-sky-500 text-white shadow-sm' : 'bg-slate-800 hover:bg-slate-700 text-amber-300'"
                    >
                      从文件同步恢复
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Auto Sync Toggle -->
            <div class="flex items-center justify-between p-3.5 rounded-2xl bg-slate-900/50 border border-slate-800 text-xs">
              <div>
                <div class="font-medium text-slate-200">修改配置时自动备份</div>
                <div class="text-[11px] text-slate-400 mt-0.5">添加网址、调整分类或更换壁纸后，系统静默写入指定备份文件</div>
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
                个人空间专为存放个人专属网址设计，采用 Web Crypto (AES-256-GCM) 零知识强加密。
              </p>
            </div>

            <!-- Password Status & Action Buttons -->
            <div class="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3 text-xs">
              <div class="flex items-center justify-between">
                <div>
                  <div class="font-medium text-slate-200">个人空间密码保护状态</div>
                  <div class="text-emerald-400 mt-0.5 flex items-center gap-1">
                    <ShieldCheck class="w-3.5 h-3.5" />
                    <span>{{ settings.vaultVerifier ? '已启用主密码保护' : '未设置主密码（双击桌面时间即可设置）' }}</span>
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
  BookOpen, Compass, Video, LayoutGrid, Lightbulb, ArrowRight, Calendar, Clock, Flame,
  AlertCircle, CheckCircle2, Search, Plus, Edit2, RotateCcw, Globe, SearchCheck, Tv, Code,
  MessageSquare, GraduationCap, Package, Languages
} from 'lucide-vue-next'
import { AI_PRESETS } from '../../shared/ai-client'
import {
  pickOneDriveDirectory,
  writeBackupToOneDrive,
  readBackupFromOneDrive,
  checkExternalUpdate,
  removeOneDriveBinding,
  DEFAULT_BACKUP_FILENAME,
  getEffectiveFileName
} from '../../shared/onedrive'
import {
  exportSettingsAsJSON,
  importSettingsFromJSON,
  saveSettings,
  DEFAULT_POPUP_BLOCKER,
  DEFAULT_SEARCH_ENGINES,
  DEFAULT_IMMERSIVE_TRANSLATE,
  POPULAR_SEARCH_ENGINES_PRESETS,
  type PopularEnginePreset
} from '../../shared/storage'
import { fetchBingDailyInfo, pinCurrentWallpaperService, resumeBingDailyService } from '../../shared/wallpaper'
import type { AppSettings, PopupBlockerConfig, SearchEngine, ImmersiveTranslateConfig, SelectionTriggerMode } from '../../shared/types'

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
  (e: 'toast', msg: string): void
  (e: 'open-vault-setup'): void
  (e: 'open-change-password'): void
  (e: 'clear-vault-password'): void
  (e: 'lock-vault'): void
}>()

const isVaultActive = computed(() => {
  return props.currentCategoryId === 'cat-vault'
})

const activeTab = ref(props.initialTab || 'guide')
const isIncognitoAllowed = ref(false)
const newWhitelistDomain = ref('')

const popupConfig = computed<PopupBlockerConfig>(() => {
  if (!props.settings.popupBlocker) {
    props.settings.popupBlocker = JSON.parse(JSON.stringify(DEFAULT_POPUP_BLOCKER))
  }
  return props.settings.popupBlocker
})

function checkIncognitoStatus() {
  if (typeof chrome !== 'undefined' && chrome.extension?.isAllowedIncognitoAccess) {
    chrome.extension.isAllowedIncognitoAccess((allowed) => {
      isIncognitoAllowed.value = !!allowed
    })
  } else {
    isIncognitoAllowed.value = false
  }
}

function openExtensionsManager() {
  const url = 'chrome://extensions/?id=' + (typeof chrome !== 'undefined' && chrome.runtime?.id ? chrome.runtime.id : '')
  if (typeof chrome !== 'undefined' && chrome.tabs?.create) {
    chrome.tabs.create({ url }).catch(() => window.open(url, '_blank'))
  } else {
    window.open(url, '_blank')
  }
}

function addWhitelistDomain() {
  const domain = newWhitelistDomain.value.trim().toLowerCase()
  if (!domain) return
  if (!props.settings.popupBlocker) {
    props.settings.popupBlocker = JSON.parse(JSON.stringify(DEFAULT_POPUP_BLOCKER))
  }
  if (!props.settings.popupBlocker.whitelist.includes(domain)) {
    props.settings.popupBlocker.whitelist.push(domain)
    saveChanges()
  }
  newWhitelistDomain.value = ''
}

function removeWhitelistDomain(domain) {
  if (!props.settings.popupBlocker) return
  props.settings.popupBlocker.whitelist = props.settings.popupBlocker.whitelist.filter(d => d !== domain)
  saveChanges()
}

function resetStats() {
  if (!props.settings.popupBlocker) return
  props.settings.popupBlocker.stats = {
    totalBlocked: 0,
    todayBlocked: 0,
    lastDate: new Date().toISOString().slice(0, 10)
  }
  saveChanges()
}

const isSyncing = ref(false)
const remoteUpdateInfo = ref<{ hasUpdate: boolean; remoteModified?: number; bookmarkCount?: number }>({ hasUpdate: false })

const syncState = computed<'unbound' | 'remote_newer' | 'local_newer' | 'synced'>(() => {
  if (!props.settings.oneDrive?.hasDirectory) return 'unbound'
  if (remoteUpdateInfo.value.hasUpdate) return 'remote_newer'
  const lastSync = props.settings.oneDrive?.lastSyncTime || 0
  const lastMod = props.settings.oneDrive?.lastModifiedTime || 0
  if (lastMod > lastSync + 1000) return 'local_newer'
  return 'synced'
})

async function checkSyncStatus() {
  if (props.settings.oneDrive?.hasDirectory) {
    const res = await checkExternalUpdate(
      props.settings.oneDrive?.lastSyncTime,
      props.settings.oneDrive?.backupFileName
    )
    remoteUpdateInfo.value = res
  } else {
    remoteUpdateInfo.value = { hasUpdate: false }
  }
}

watch(() => activeTab.value, (tab) => {
  if (tab === 'onedrive') {
    checkSyncStatus()
  }
})

onMounted(() => {
  if (activeTab.value === 'onedrive' || props.settings.oneDrive?.hasDirectory) {
    checkSyncStatus()
  }
})

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
    { id: 'translate', name: '沉浸式翻译', icon: Languages },
    { id: 'search', name: '搜索引擎', icon: Search },
    { id: 'onedrive', name: '数据备份同步', icon: Cloud },
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
  { id: 'translate', name: '沉浸式翻译' },
  { id: 'search', name: '搜索引擎' },
  { id: 'desktop', name: '常用桌面' },
  { id: 'onedrive', name: '数据备份同步' },
  { id: 'ai', name: 'AI 助手' },
  { id: 'wallpaper', name: '壁纸美化' },
  { id: 'sniffer', name: '视频嗅探' }
]

const guideItems = [
  {
    id: 'g-translate',
    category: 'translate',
    categoryName: '沉浸式翻译与双语阅读',
    title: '全网页双语对照、划词释义与输入框3次空格翻译',
    badge: '免翻墙 · 0本地显存',
    badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    icon: Languages,
    iconColor: 'text-indigo-400',
    targetTab: 'translate',
    whatIsIt: [
      '基于微软 Edge 官方免翻墙、免 API Key 国内极速直连通道，毫秒级响应，无需在本地部署大模型，完全零显存与磁盘负担。',
      '全页沉浸式双语对照：段落下贴合插入柔和译文，保留原文排版，自动保护代码块不乱码。',
      '划词悬浮释义气泡：选中文本浮起微标，支持音标、长句多行排版、真人语音朗读与一键复制。',
      '输入框 3 次空格翻译：连续敲 3 次空格直接把中文原地变为地道英文（或英文变中文）。'
    ],
    howToUse: [
      '双语对照快捷键：在任意英文/外文网页中，按下 Alt + W 快捷键（或右键菜单），自动开始逐段双语对照，再次按下可随心隐藏/显示译文。',
      '划词翻译与朗读：鼠标选中文本后，点击右下角浮起的“译”字图标，即可查看释义与发音。',
      '输入框快速翻译：在搜索框、邮件撰写或社交平台输入框打中文后，连续敲击 3 次空格键，内容即刻自动原地替换为英文。'
    ],
    tips: '国内直连引擎稳定抗封，长段落与学术论文均可流畅翻译，不消耗任何第三方商业 Token 额度。'
  },
  {
    id: 'g-search',
    category: 'search',
    categoryName: '桌面聚合搜索引擎',
    title: '自定义搜索引擎与快捷轮换',
    badge: '高效聚合',
    badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    icon: Search,
    iconColor: 'text-blue-400',
    targetTab: 'search',
    whatIsIt: [
      '桌面中央强大的多引擎聚合搜索框，支持在必应、谷歌、百度、GitHub、B站等多个主流引擎间瞬间切换。',
      '支持任意自定义添加搜索引擎网址，使用 %s 占位符定义关键词搜索位置。',
      '支持指定默认搜索引擎，并在搜索框内使用 Tab 键按顺序快速轮换引擎。'
    ],
    howToUse: [
      '自定义添加：前往【设置】->【搜索引擎】，点击【添加搜索引擎】，输入名称与带 %s 的搜索网址（如 https://duckduckgo.com/?q=%s）。',
      '快捷预设推荐：面板内提供 DuckDuckGo、知乎、微信读书、小红书、Google 学术等热门引擎，支持一键快速加入列表。',
      '设置默认引擎：在引擎卡片右侧点击【设为默认】，打开新标签页时将优先启用该引擎。',
      '键盘快速轮换：在桌面搜索框处于聚焦状态时，直接按下 Tab 键即可依次切换下一个搜索引擎。'
    ],
    tips: '若搜索网址中未包含 %s 占位符，系统在回车搜索时会自动将用户输入的关键词直接拼接到网址末尾，兼具灵活性与兼容性。'
  },
  {
    id: 'g-security',
    category: 'security',
    categoryName: '智能安全与弹窗拦截',
    title: '智能弹窗拦截与隐私模式防御',
    badge: '安全增强',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    icon: ShieldCheck,
    iconColor: 'text-emerald-400',
    targetTab: 'security',
    whatIsIt: [
      '智能识别并封堵恶意网站偷偷打开的后台标签页（Pop-under）与弹窗广告轰炸。',
      '自动清理网页内部的强制居中遮罩、全屏登录诱导层及流氓广告弹窗，解除页面滚动限制。',
      '识别并粉碎全屏透明点击陷阱（Clickjacking），防止误触空白区域触发流氓跳转。',
      '【无痕模式原生就绪】：当在 Chrome 扩展中开启“在无痕模式下允许”后，防御机制在隐私窗口同样生效，且严格遵守零知识防痕规范，绝不记录任何无痕浏览轨迹。'
    ],
    howToUse: [
      '开启拦截：前往【设置】->【安全与弹窗拦截】，确保总开关保持开启即可全自动防御。',
      '自定义防护细项：可自由启闭后台弹窗拦截、页面内遮罩清理、透明点击防劫持、以及滚动条恢复等开关。',
      '管理站点白名单：若遇到某些特定网银、开发工具或内网系统需要正常弹窗，可将域名添加至白名单中一键放行。',
      '隐私模式激活：点击面板中的无痕授权状态提示，在浏览器扩展管理页中勾选“在无痕模式下允许”，即可全方位保护无痕浏览。'
    ],
    tips: '在无痕模式下拦截弹窗时，系统仅进行匿名拦截计数，绝不会将无痕模式下的敏感网址明文存入任何本地数据库，百分之百保障个人隐私与数据安全。'
  },

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
    categoryName: '自定义本地/云盘同步与备份',
    title: '自定义目录与云盘同步备份',
    badge: '100% 数据归您所有',
    badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
    icon: Cloud,
    iconColor: 'text-sky-400',
    targetTab: 'onedrive',
    whatIsIt: [
      '自由指定电脑上的任意文件夹（如 OneDrive、坚果云、本地磁盘等）及自定义备份文件名。',
      '插件本体与备份文件完全物理隔离，您可以将插件放置于任何磁盘目录运行。',
      '零信任、零第三方服务器中转：所有书签与配置完全存放在您自己指定的本地或云盘文件中。'
    ],
    howToUse: [
      '自定义绑定目录：进入左侧【数据备份同步】，点击【选择存储文件夹】，选中电脑上的任意目录。',
      '智能防覆盖机制：首次绑定若发现已有备份，会自动弹窗提示您选择从文件还原或覆盖，换新机绝不丢数据。',
      '自动静默同步：勾选“修改配置时自动备份”，添加网址或调整布局后，系统在后台静默写入备份文件。',
      '跨设备更新感知：当检测到文件夹内的备份文件在其他电脑有更新时，界面会主动提示一键拉取同步。'
    ],
    tips: '插件解压在任何目录都能在浏览器中加载运行，备份文件随时支持手动导出与导入。'
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
  const targetFile = props.settings.oneDrive.backupFileName || DEFAULT_BACKUP_FILENAME
  const res = await pickOneDriveDirectory(targetFile)
  if (!res.success) {
    if (res.error && res.error !== '用户取消了选择') {
      alert(res.error)
    }
    return
  }

  const dirName = res.dirName || '已选文件夹'

  props.settings.oneDrive.hasDirectory = true
  props.settings.oneDrive.directoryName = dirName
  props.settings.oneDrive.backupFileName = targetFile
  await saveSettings(props.settings, false)
  alert(`已成功绑定同步文件夹【${dirName}】！`)
  await checkSyncStatus()
}

async function handleUnbindOneDrive() {
  if (!confirm('确定要解除当前同步文件夹的绑定吗？（不会删除您磁盘上的备份文件）')) return
  await removeOneDriveBinding()
  props.settings.oneDrive.hasDirectory = false
  props.settings.oneDrive.directoryName = undefined
  await saveSettings(props.settings, false)
  remoteUpdateInfo.value = { hasUpdate: false }
}

async function handleBackupFileNameChange() {
  props.settings.oneDrive.backupFileName = getEffectiveFileName(props.settings.oneDrive.backupFileName)
  await saveSettings(props.settings, false)
  await checkSyncStatus()
}

async function handleManualSyncToOneDrive(showAlert = true) {
  isSyncing.value = true
  const res = await writeBackupToOneDrive(props.settings, props.settings.oneDrive.backupFileName)
  isSyncing.value = false
  if (res.success && res.timestamp) {
    props.settings.oneDrive.lastSyncTime = res.timestamp
    await saveSettings(props.settings, false)
    await checkSyncStatus()
    if (showAlert) {
      alert('已成功备份到指定文件！')
    }
  } else {
    alert(`备份失败: ${res.error}`)
  }
}

async function handleRestoreFromOneDrive() {
  const fileName = props.settings.oneDrive.backupFileName || DEFAULT_BACKUP_FILENAME
  if (!confirm(`从文件【${fileName}】同步恢复将覆盖当前的所有设置与书签，确定继续吗？`)) return
  const res = await readBackupFromOneDrive(fileName)
  if (res.success && res.data) {
    res.data.oneDrive = {
      ...res.data.oneDrive,
      hasDirectory: true,
      directoryName: props.settings.oneDrive.directoryName,
      backupFileName: fileName,
      lastSyncTime: res.lastModified || Date.now()
    }
    emit('update-settings', res.data)
    await checkSyncStatus()
    alert('已成功从备份文件同步恢复配置！')
  } else {
    alert(`同步恢复失败: ${res.error}`)
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
    console.warn('Failed to pin wallpaper:', err)
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
    console.warn('Failed to resume daily wallpaper:', err)
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

// Search Engine State & Handlers
const showEngineForm = ref(false)
const editingEngineId = ref<string | null>(null)
const engineForm = ref<{
  name: string
  url: string
  placeholder: string
  isDefault: boolean
}>({
  name: '',
  url: '',
  placeholder: '',
  isDefault: false
})

const currentEngines = computed<SearchEngine[]>(() => {
  if (!props.settings.searchEngines || props.settings.searchEngines.length === 0) {
    props.settings.searchEngines = JSON.parse(JSON.stringify(DEFAULT_SEARCH_ENGINES))
  }
  return props.settings.searchEngines
})

function isDefaultEngine(engineId: string): boolean {
  const defId = props.settings.defaultSearchEngineId || 'bing'
  return defId === engineId
}

function setDefaultEngine(engineId: string) {
  props.settings.defaultSearchEngineId = engineId
  saveChanges()
  const engine = currentEngines.value.find(e => e.id === engineId)
  emit('toast', `已将「${engine?.name || '指定引擎'}」设为默认搜索引擎`)
}

const availablePresets = computed(() => {
  const existingNames = new Set(currentEngines.value.map(e => e.name.toLowerCase().trim()))
  const existingUrls = new Set(currentEngines.value.map(e => e.url.toLowerCase().trim()))
  return POPULAR_SEARCH_ENGINES_PRESETS.filter(p => {
    return !existingNames.has(p.name.toLowerCase().trim()) && !existingUrls.has(p.url.toLowerCase().trim())
  })
})

function openAddEngineForm() {
  editingEngineId.value = null
  engineForm.value = {
    name: '',
    url: '',
    placeholder: '',
    isDefault: false
  }
  showEngineForm.value = true
}

function editEngine(engine: SearchEngine) {
  editingEngineId.value = engine.id
  engineForm.value = {
    name: engine.name,
    url: engine.url,
    placeholder: engine.placeholder || '',
    isDefault: isDefaultEngine(engine.id)
  }
  showEngineForm.value = true
}

function closeEngineForm() {
  showEngineForm.value = false
  editingEngineId.value = null
}

function applyEnginePreset(preset: PopularEnginePreset) {
  const newEngine: SearchEngine = {
    id: `engine-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name: preset.name,
    url: preset.url,
    icon: preset.icon,
    placeholder: preset.placeholder,
    isCustom: true
  }
  props.settings.searchEngines = [...currentEngines.value, newEngine]
  saveChanges()
}

function handleSaveEngine() {
  const name = engineForm.value.name.trim()
  let url = engineForm.value.url.trim()
  if (!name) {
    alert('请输入搜索引擎名称')
    return
  }
  if (!url) {
    alert('请输入搜索网址 (URL)')
    return
  }

  // Prepend protocol if missing
  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`
  }

  const placeholder = engineForm.value.placeholder.trim() || `${name} 搜索...`

  if (editingEngineId.value) {
    // Edit existing engine
    props.settings.searchEngines = currentEngines.value.map(e => {
      if (e.id === editingEngineId.value) {
        return {
          ...e,
          name,
          url,
          placeholder
        }
      }
      return e
    })
    if (engineForm.value.isDefault) {
      props.settings.defaultSearchEngineId = editingEngineId.value
    } else if (props.settings.defaultSearchEngineId === editingEngineId.value) {
      // Fallback if user explicitly unchecked default on the current default engine
      const fallback = props.settings.searchEngines.find(e => e.id !== editingEngineId.value)
      props.settings.defaultSearchEngineId = fallback?.id || 'bing'
    }
  } else {
    // Add new custom engine
    const newId = `custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    const newEngine: SearchEngine = {
      id: newId,
      name,
      url,
      placeholder,
      isCustom: true,
      icon: 'Search'
    }
    props.settings.searchEngines = [...currentEngines.value, newEngine]
    if (engineForm.value.isDefault) {
      props.settings.defaultSearchEngineId = newId
    }
  }

  saveChanges()
  emit('toast', engineForm.value.isDefault ? `已保存并设为默认引擎「${name}」` : `已保存搜索引擎「${name}」`)
  closeEngineForm()
}

function deleteEngine(engine: SearchEngine) {
  if (currentEngines.value.length <= 1) {
    alert('至少需要保留一个搜索引擎')
    return
  }
  if (!confirm(`确定删除搜索引擎「${engine.name}」吗？`)) return

  props.settings.searchEngines = currentEngines.value.filter(e => e.id !== engine.id)
  if (props.settings.defaultSearchEngineId === engine.id) {
    props.settings.defaultSearchEngineId = props.settings.searchEngines[0]?.id || 'bing'
  }
  saveChanges()
  emit('toast', `已删除搜索引擎「${engine.name}」`)
}

function handleResetSearchEngines() {
  if (!confirm('确定将搜索引擎恢复为系统出厂的 5 款预设引擎吗？（自定义添加的引擎将被清除）')) return
  props.settings.searchEngines = JSON.parse(JSON.stringify(DEFAULT_SEARCH_ENGINES))
  props.settings.defaultSearchEngineId = 'bing'
  saveChanges()
  emit('toast', '已恢复出厂预设搜索引擎 (默认: Bing)')
}

function getEngineIcon(engine: SearchEngine) {
  const idOrName = (engine.id + ' ' + engine.name).toLowerCase()
  if (idOrName.includes('google') && !idOrName.includes('scholar') && !idOrName.includes('学术')) return Globe
  if (idOrName.includes('github') || idOrName.includes('mdn') || idOrName.includes('code')) return Code
  if (idOrName.includes('bilibili') || idOrName.includes('哔哩')) return Tv
  if (idOrName.includes('baidu') || idOrName.includes('百度')) return SearchCheck
  if (idOrName.includes('duck') || idOrName.includes('shield')) return ShieldCheck
  if (idOrName.includes('zhihu') || idOrName.includes('知乎')) return MessageSquare
  if (idOrName.includes('weread') || idOrName.includes('微信读书') || idOrName.includes('wiki') || idOrName.includes('维基')) return BookOpen
  if (idOrName.includes('scholar') || idOrName.includes('学术')) return GraduationCap
  if (idOrName.includes('xiaohongshu') || idOrName.includes('小红书')) return Compass
  if (idOrName.includes('npm') || idOrName.includes('package')) return Package
  return Search
}

// Immersive Translate helpers
const currentImmersiveConfig = computed<ImmersiveTranslateConfig>({
  get() {
    if (!props.settings.immersiveTranslate) {
      props.settings.immersiveTranslate = JSON.parse(JSON.stringify(DEFAULT_IMMERSIVE_TRANSLATE))
    }
    return props.settings.immersiveTranslate
  },
  set(val) {
    props.settings.immersiveTranslate = val
  }
})

function setTargetLang(langId: string) {
  currentImmersiveConfig.value.targetLang = langId
  saveChanges()
}

function setBilingualStyle(styleId: 'dashed' | 'block' | 'highlight') {
  currentImmersiveConfig.value.bilingualStyle = styleId
  saveChanges()
}

function setSelectionTriggerMode(mode: SelectionTriggerMode) {
  currentImmersiveConfig.value.selectionTriggerMode = mode
  saveChanges()
}

async function saveChanges() {
  await saveSettings(props.settings)
  emit('update-settings', { ...props.settings })
}
</script>
