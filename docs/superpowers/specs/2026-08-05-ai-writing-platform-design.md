# AI 辅助写作平台设计文档

- 日期：2026-08-05
- 状态：已确认
- 部署目标：GitHub Pages（纯前端静态站点）

## 1. 概述

一个面向个人的 AI 辅助文章撰写平台。核心能力是对文章进行全方位润色优化：支持选中文字的**改写、润色、续写、扩写、缩写、语气风格转换、纠错、自定义指令**，以及全文级的**摘要/大纲、错别字检查、多轮对话**。

纯前端实现，无后端。AI 接入采用**通用 OpenAI 兼容接口**：Base URL、API Key、模型名全部由用户在设置面板中自定义并保存在本地（localStorage），不预设任何厂商、不进入代码仓库。AI 请求由浏览器直接调用。

## 2. 关键决策

| 决策点 | 结论 |
|--------|------|
| 使用场景 | 个人写作工具 |
| 编辑器形态 | 富文本编辑器（所见即所得），基于 TipTap |
| 部署方式 | 纯前端 + GitHub Pages 静态部署 |
| AI 接入 | 通用 OpenAI 兼容接口：用户自配 Base URL / API Key / 模型名（不预设厂商） |
| API Key 存储 | 设置面板输入，存 localStorage，不硬编码、不入库 |
| 主界面布局 | 两栏：左文档列表 + 右大编辑区；选中文字弹出浮动 AI 工具栏 |
| AI 结果展示 | 原地替换 + 高亮 + 可撤销（借用编辑器 undo 历史） |
| 全文级工具呈现 | 右侧滑出面板，标签页切换（对话 / 摘要 / 检查） |
| 视觉风格 | 三套主题自由切换：极简明亮 / 纸感书写 / 深色护眼 |

## 3. 技术栈

| 层面 | 选型 |
|------|------|
| 前端框架 | React 18 + Vite + TypeScript |
| 编辑器 | TipTap（基于 ProseMirror） |
| 样式 | Tailwind CSS + CSS 变量主题系统 |
| 状态管理 | Zustand |
| 存储 | localStorage（文章、设置、Key、主题） |
| AI 接入 | OpenAI 兼容 Chat Completions 接口（fetch 流式） |
| 部署 | GitHub Pages（GitHub Actions 自动构建发布） |
| 测试 | Vitest（单测：prompt 构建、存储、导入导出、provider 封装） |

## 4. 功能范围

### 4.1 选中文字操作（浮动工具栏）

用户选中一段文字后，编辑器上方弹出浮动 AI 工具栏，提供以下操作：

- **润色**：改善表达流畅度、词汇精准度，保持原意
- **改写**：换一种说法重写，保持信息不变
- **续写**：在选中段落后继续展开
- **扩写**：补充细节、论据、例子
- **缩写**：压缩提炼，保留核心信息
- **风格转换**：口语化 / 正式 / 文艺 / 简洁 等预设风格
- **纠错**：修正错别字、语法、标点
- **自定义指令**：用户输入任意指令作用于选中文字

### 4.2 全文级操作（右侧滑出面板）

工具栏提供「对话 / 摘要 / 检查」三个入口，点击从右侧滑出面板，带标签页：

- **💬 对话**：多轮对话，以全文为上下文，可要求连续修改文章
- **📋 摘要/大纲**：生成全文摘要或文章大纲，支持复制、插入到文首/文末
- **🔍 错别字检查**：扫描全文，列出疑似问题及修改建议，可逐条应用

### 4.3 文档管理

- 多文档列表（左侧栏）
- 新建、重命名、删除文档
- 编辑后自动防抖保存到 localStorage
- 导出为 HTML / Markdown 文件
- 导入 HTML / Markdown 文件

### 4.4 设置面板

- **AI 接入（通用 OpenAI 兼容）**：
  - Base URL（如 `https://api.openai.com/v1`，兼容任意 OpenAI 风格服务）
  - API Key
  - 模型名（如 `gpt-4o`、`deepseek-chat`、`glm-4-flash`、`qwen-plus` 等，由用户自填）
- 主题切换：极简明亮 / 纸感书写 / 深色护眼
- 默认主题设定

## 5. 组件结构

```
src/
├── main.tsx
├── App.tsx
├── styles/
│   └── themes.css              # 三套主题 CSS 变量
├── types/
│   ├── doc.ts                  # Doc / Block 类型
│   └── settings.ts             # Settings 类型
├── store/
│   ├── useDocStore.ts          # 文档列表 + 当前文档 + 自动保存
│   ├── useSettingsStore.ts     # 模型 / Key / 主题
│   └── useUiStore.ts           # 滑出面板状态 / 浮动菜单状态
├── lib/
│   ├── storage.ts              # localStorage 封装
│   ├── export.ts               # HTML / Markdown 导入导出
│   └── id.ts                   # 唯一 ID 生成
├── ai/
│   └── provider.ts             # OpenAI 兼容 Chat Completions 客户端（Base URL / Key / 模型名来自设置）
├── components/
│   ├── editor/
│   │   ├── Editor.tsx          # TipTap 封装
│   │   ├── Toolbar.tsx         # 顶部工具栏（含全文级入口）
│   │   └── BubbleMenu.tsx      # 选中文字浮动 AI 工具栏
│   ├── sidebar/
│   │   ├── DocList.tsx         # 文档列表
│   │   └── SettingsPanel.tsx   # 设置面板
│   └── ai-panel/
│       ├── AiPanel.tsx         # 右侧滑出面板
│       ├── ChatTab.tsx         # 对话标签
│       ├── SummaryTab.tsx      # 摘要/大纲标签
│       └── CheckTab.tsx        # 错别字检查标签
└── hooks/
    ├── useAiRequest.ts         # 流式 AI 请求（含 AbortController）
    └── useReplaceSelection.ts  # 原地替换选中文字 + 高亮 + 撤销
```

## 6. 数据流

### 6.1 选中文字操作

1. 用户在编辑器选中文字 → TipTap BubbleMenu 检测到选区 → 显示浮动 AI 工具栏
2. 用户点击某操作（如润色）→ 构建 prompt（系统提示 + 选中文本 + 操作指令）
3. `useAiRequest` 发起流式请求，实时显示生成内容
4. 完成后 `useReplaceSelection` 将结果原地替换选中文字，高亮标记，可通过编辑器 undo 撤销

### 6.2 全文级操作

1. 用户点击工具栏「对话/摘要/检查」→ 右侧滑出面板
2. 面板以当前文档全文为上下文发起请求
3. 对话标签维护多轮消息记录；摘要/大纲结果可复制或插入文档；检查结果逐条应用

### 6.3 持久化

- 文档编辑 → 防抖（~500ms）→ 写入 localStorage
- 设置（Key、主题）变更 → 即时写入 localStorage
- 主题通过 `data-theme` 属性 + CSS 变量切换

## 7. 错误处理

| 场景 | 处理方式 |
|------|----------|
| 未配置 Base URL / Key / 模型名 | 提示并引导跳转设置面板 |
| 网络错误 / CORS / HTTP 错误 | toast 提示 + 重试按钮 |
| 流式中断 | 保留已生成部分，提供继续/重试 |
| 用户取消请求 | AbortController 终止流 |
| 模型限流/超时 | 明确错误文案 + 重试 |
| localStorage 满 | 提示导出备份 |

## 8. Prompt 设计

- 系统提示包含：角色（中文写作助手）、输出要求（仅返回改写后的文本，不加解释、不加引号、不改格式结构）、当前操作类型
- 操作类型通过不同指令模板表达：润色 / 改写 / 续写 / 扩写 / 缩写 / 风格转换 / 纠错
- 全文级操作：注入全文 + 专门指令（摘要 / 大纲 / 检查清单）
- 对话：多轮消息历史 + 全文上下文

## 9. 安全与隐私

- API Key 仅存于浏览器 localStorage，不出现在代码或构建产物中
- 部署后页面为公开访问，任何人可通过开发者工具读取 localStorage 中的 Key → 文档中明确提示用户使用免费/低配额 Key
- 浏览器直调对服务端有 CORS 限制：部分 OpenAI 兼容端点支持浏览器访问，不支持的需选择支持 CORS 的端点或模型
- 文章数据仅存于用户浏览器，不上传任何服务器

## 10. 测试策略

- **单元测试（Vitest）**
  - prompt 构建函数：各操作类型的指令模板正确
  - storage：读写、缺省值、损坏数据兜底
  - export/import：HTML/Markdown 往返一致
  - provider 封装：请求 URL、headers、body 格式正确（mock fetch）
- **手工验证**
  - 三套主题切换
  - 选中文字各操作 + 撤销
  - 全文摘要/检查/对话
  - 导出导入往返
- **部署验证**：GitHub Actions 构建后检查 Pages 站点可访问

## 11. 部署流程

1. 项目推送到 GitHub 仓库
2. GitHub Actions workflow：`vite build` → `vite.config` 设置 `base: './'` → 上传 `dist/` 到 GitHub Pages
3. 用户首次使用打开站点，在设置中输入 API Key
