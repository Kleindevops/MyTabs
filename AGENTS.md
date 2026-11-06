# 🤖 MyTabs Agent 开发与协作规范 (AGENTS.md)

本文件是所有参与 `MyTabs` 项目开发、维护与重构的 AI Agent 及开发者的必须遵守的最高准则。

---

## 🚨 一、核心开发红线 (Critical Rules)

### 1. 严禁伪造数据与弱加密 (Strictly Real Data & Zero-Knowledge Security)
- **绝对零知识加密**：绝密私人收藏夹（`Vault`）及导出的云同步密文，必须使用真实 Web Crypto API（PBKDF2 强哈希散列 + AES-256-GCM 算法）进行端到端强力加密，绝对禁止明文落地、禁止使用可逆弱编码（如纯 Base64/凯撒加密）伪装加密，严禁硬编码密钥。
- **真防痕与真实无痕隔离**：私人网址跳转必须真实调用 Chrome / Edge 原生无痕窗口接口（`chrome.windows.create({ incognito: true, url: ... })`）；敏感历史清理必须真实调用 `chrome.history.deleteUrl`，绝不虚假标记或走过场。
- **真实网络嗅探与请求拦截**：流媒体资源嗅探器必须真实基于 `chrome.webRequest` / Content Script 捕获真实流媒体网络直链（`.m3u8`、`.mp4`、`.webm` 等），严禁 Mock 假数据或伪造假直链欺骗用户。

### 2. 保证每个功能的独立解耦 (Feature Independence & Loose Coupling)
- **MV3 职责边界清晰隔离**：
  - `src/background/`：纯后台 Service Worker（流媒体嗅探 `sniffer.ts`、敏感历史自动清理 `history-cleaner.ts`、右键上下文菜单 `context-menu.ts`、站点元数据解析 `site-meta.ts`）。严禁在此操作 DOM，不可依赖内存常驻变量（MV3 SW 随时会被系统挂起休眠），以 ESM 格式打包。
  - `src/content/`：网页注入脚本（划词翻译、全文提取），以 IIFE 独立格式打包，严格隔离网页宿主上下文，不污染目标网页全局命名空间。
  - `src/newtab/`：新标签页核心 UI（桌面中央时钟挂件/暗门、聚合搜索框、桌面图标网格、Windows 任务栏风格底栏 Dock、分类管理、设置抽屉）。
  - `src/sidepanel/`：AI 智能侧边栏副驾驶，拥有独立的生命周期与多模型对话支持。
  - `src/popup/`：资源嗅探结果清单与快捷操作小弹窗。
  - `src/shared/`：公共底层服务层（`crypto.ts` 加解密服务、`vault-service.ts` 个人空间密码锁与计时器、`storage.ts` 本地存储封装、`onedrive.ts` 文件系统直存同步、`types.ts` 全局类型定义）。
- **隐形暗门零泄露原则**：
  - 在未解锁状态下，常规分类导航、任务栏、设置面板等任何公共界面中，**严禁留下任何私人分类的文字、按钮、图标或数据痕迹**；只有在双击时钟挂件并成功解锁后，才允许动态拉起私人空间；
  - 超时加锁或手动锁闭后，必须立即清理解密状态与明文缓存，自动退回常规视图。
- **单向依赖与面向接口**：UI 组件只通过 `src/shared/` 统一服务层读写数据，各扩展页面间通过 `chrome.runtime.sendMessage` 或 `storage.onChanged` 标准消息机制通信，禁止强行交叉侵入。

### 3. 每次任务完成后必须在本地提交 Git (Local Git Commit After Each Task)
- **任务闭环提交**：每完成一个独立的开发任务、Bug 修复、重构或文档更新，并在本地构建与验证通过后，**必须立即执行本地 `git commit`**。
- **提交规范**：遵循 Conventional Commits 规范，例如：
  - `feat(vault): 描述新增功能`
  - `fix(sniffer): 描述修复的问题`
  - `docs: 描述文档更新`
  - `refactor(newtab): 描述重构内容`
  - `style(dock): 描述样式调整`
- **版本递增规则 (Version Auto-Increment)**：
  - 每次代码修改并完成本地 Git 提交时，若涉及功能或发布，必须保持 `package.json`、`manifest.json` 与 `README.md` 的版本号同步递增（例如 `v1.0.0` -> `v1.0.1` 等），确保界面展示、安装包与提交记录时刻保持一一对应。
- **提交前质量把关**：
  1. 编译构建必须成功通过（`npm run build` 无错误、无告警）；
  2. TypeScript 类型静态检查通过（无类型断言崩溃或隐式 any）；
  3. 不提交 `dist/` 临时构建产物、不提交调试 dump、`.log` 或无关缓存。

### 4. 严禁执行 `git push`（仅限人类开发者本人操作）(Strictly NO Git Push)
- **最高权限红线**：**AI Agent 严禁在任何情况下执行 `git push`**（包括但不限于推送至任何远程分支、force push 或 push tags）。
- **权限边界**：远程代码推送与发布权利 100% 归人类开发者（USER）所有。Agent 完成工作后，只需确保本地已做好清晰规范的 `commit`，等待用户亲自核对后手动推送。

---

## 🛡️ 二、安全与工程原则

### 1. Chrome Manifest V3 合规与无状态生命周期
- MV3 的 Service Worker 为事件驱动机制，无操作时会被浏览器自动挂起休眠。绝不可在后台内存中长期缓存关键会话状态；状态需持久化至 `chrome.storage.local` 或 IndexedDB（`idb-keyval`）。
- 严格遵循 MV3 的 Content Security Policy (CSP)：**严禁使用 `eval()`、严禁使用 `new Function()`、严禁外链不可信 JS 脚本**，所有依赖资源必须本地打包离线化。

### 2. 端到端隐私锁与内存销毁守护 (Zero-Knowledge & Memory Scrubbing)
- 私人暗门开启后，由 `vault-service.ts` 维护解锁状态与超时倒计时（支持 1~30 分钟或自定义）。
- 当用户手动上锁、超时加锁、关闭标签页或切换到公共分类时，**必须第一时间清空内存中的解密密钥与明文数据**，严防内存驻留导致隐私泄露。
- 全网盘同步导出时，私密数据在写入外部文件前必须先进行 AES-256-GCM 加密，确保同步到第三方网盘的文件中绝无明文网址。

### 3. 本地直存全网盘免配置兼容 (File System Access API)
- 基于浏览器原生 `window.showDirectoryPicker` 实现本地与网盘目录直存，零第三方平台 API Key 申请门槛。
- 兼容 OneDrive、坚果云、Google Drive、Dropbox、iCloud、百度网盘、NAS 等任意支持本地同步盘的存储载体。
- 支持毫秒级防抖自动静默保存，具备读写容错与优雅降级。

### 4. 现代桌面级 UI 与高分屏适配 (Tailwind & Acrylic Blur)
- 遵循 iTab / Windows 11 视觉规范，采用 Tailwind CSS 组织原子化样式。
- 亚克力毛玻璃滤镜（Backdrop Blur）、通透透明底色图标、多引擎聚合键盘流（`Tab` 键轮换）需保持轻盈流畅。
- 全面适配高分屏 DPI 与深色/浅色模式自适应。

---

## 🛠️ 三、开发环境与常用指令

### 1. Git 工具路径调用
在当前 Windows 环境下，若全局未配置 `git` 环境变量，请使用宿主机内嵌的 GitHub Desktop Git 解释器路径：
```powershell
& "C:\Users\chirs\AppData\Local\GitHubDesktop\app-3.6.7\resources\app\git\cmd\git.exe" <subcommand>
```
或者在 PowerShell 终端临时引入：
```powershell
$env:PATH = "C:\Users\chirs\AppData\Local\GitHubDesktop\app-3.6.7\resources\app\git\cmd;" + $env:PATH
```

### 2. Node.js 与 NPM 前端工程指令
```powershell
# 1. 安装项目依赖
npm install

# 2. 启动 Vite 开发热重载服务器 (新标签页 / 侧边栏 / Popup 预览)
npm run dev

# 3. 完整生产构建 (Vite 构建 UI + esbuild 构建 Background 与 Content Scripts + 拷贝 Manifest & 图标)
npm run build

# 4. TypeScript 类型静态检查
npx tsc --noEmit

# 5. 打包生成发布 ZIP 扩展包
npm run zip
```

### 3. 浏览器加载调试流程
1. 打开 Chromium 内核浏览器（Chrome / Edge / Brave / Vivaldi 等）；
2. 地址栏访问 `chrome://extensions/` 或 `edge://extensions/`；
3. 开启右上角（或左下角）的 **“开发者模式” (Developer mode)** 开关；
4. 点击 **“加载已解压的扩展程序” (Load unpacked)**；
5. 选择当前项目的构建产出目录：
   ```text
   D:\MyTabs\dist
   ```
6. 后续代码修改后重新执行 `npm run build`，在扩展卡片上点击刷新按钮即可加载最新代码。

---

## 📌 四、Agent 任务执行标准流程 (SOP)

1. **需求分析与设计**：明确所属模块（`newtab` / `sidepanel` / `popup` / `background` / `content` / `shared`），严格遵守暗门零暴露与 MV3 CSP 规范。
2. **代码实现与自测**：
   - 严禁假数据与弱加密，保证 AES-256-GCM 与无痕隔离真实可靠；
   - 遵循单向依赖与面向接口设计，修改单一模块不产生交叉副作用。
3. **本地编译与构建验证**：
   - 运行 `npm run build` 确保 0 错误、0 警告构建成功；
   - 验证 `dist/` 目录下产物结构完整。
4. **版本同步递增**：
   - 同步递增 `package.json`、`manifest.json` 与 `README.md` 的版本号。
5. **执行本地 Git 提交**：
   ```powershell
   git add <变更文件>
   git commit -m "docs/feat/fix: 详细清晰的提交描述"
   ```
6. **绝对禁止推送远程仓库**：**严禁调用 `git push`**，交付时明确告知用户已完成本地提交，等待用户自行确认并推送。
