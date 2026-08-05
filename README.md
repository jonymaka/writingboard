# 写作工坊 · AI 辅助写作

一个纯前端、可部署到 GitHub Pages 的个人 AI 辅助写作平台。以「墨庐 · 写作案头」为设计意象：宣纸质感、墨色文字、朱砂印章、朱批批注——像在一方书案上落笔，AI 是那支蘸了朱砂的批笔。

## 功能一览

### ✍️ 选中文字 AI 操作

在编辑器选中任意文字，即弹出浮动工具栏：

| 操作 | 说明 |
|------|------|
| 润色 | 优化流畅度与用词，保持原意 |
| 改写 | 换一种表达重写，信息不变 |
| 续写 | 顺着文意继续向下写一段 |
| 扩写 | 补充细节、论据、例子 |
| 缩写 | 压缩提炼，更加精炼 |
| 风骨 | 风格转换：口语化 / 正式书面 / 文艺 / 简洁 / 幽默 |
| 校雠 | 纠正错别字、语法、标点 |
| 手谕 | 任意自定义指令 |

**上下文感知**：以上操作并非只针对孤立选区——请求会携带选中文字**前后各约 500 字**作为语境，并明确指示模型只修改选中部分、与上下文衔接自然。改出来的文字更贴合全文语境，不会"断片"。

### 📖 全文级工具（右侧面板）

右侧面板可**停靠**（不遮挡编辑区，编辑区自动收窄）并支持 **📌 锁定**（锁定后面板常开，可边看边写）：

- **对语**：以全文为上下文的多轮对话，回答可直接「归入文末」
- **撮要 / 提纲**：生成全文摘要或大纲，一键「冠于文首 / 缀于文末」
- **校雠**：全文错别字、语法、标点扫描

### 🖌 AI 结果交互

- **流式生成**：边生成边显示，可随时停笔
- **朱批预览**：生成结果先在浮动卡中预览，确认后再「朱批入文」
- **原地替换 + 红底高亮**：批注文字以朱批色高亮标记，已应用的修改可用 ⌘Z / Ctrl+Z 撤销
- **格式不粘连**：批注格式不会"跟手"——批注后回车、换行、在批注末尾继续输入，均为正常黑字
- **输出清洗**：自动去除模型输出首尾空行、压缩连续换行，多段内容转为真正的段落，杜绝意外空行

### 📁 文档与数据管理

- 多文档：新建、双击重命名、删除，编辑后自动保存（防抖 500ms）到 localStorage
- 单篇导入导出：HTML / Markdown / TXT
- **全量数据管理**（设置 → 全量数据）：一次导出/导入平台全部数据（所有文章 + 设置含 API Key）为 JSON，方便备份与迁移

### 🎨 三套纸墨主题

| 主题 | 代码值 | 气质 |
|------|--------|------|
| 宣纸 | `minimal-light` | 素笺昼书，米白纸面 + 朱砂红 |
| 朱砂 | `paper` | 温砂暮写，暖砂纸面 + 深朱砂 |
| 墨夜 | `dark` | 玄墨夜书，暖墨黑底 + 珊瑚朱批 |

可在设置中自由切换，选择会持久化。

## 快速开始

```bash
npm install
npm run dev     # 打开 http://localhost:5173
```

首次使用，点击右上角 **⚙️ 设置**，填写：

- **Base URL**：任意 OpenAI 兼容服务的地址，如 `https://api.openai.com/v1`
- **API Key**
- **模型名称**：如 `gpt-4o-mini`、`deepseek-chat`、`glm-4-flash`、`qwen-plus`
- **温度**：落笔温度（创意度），范围 0–1.5

然后在编辑器中选中文字，即可使用 AI 工具栏。

> ⚠️ 浏览器直调对服务端有 **CORS 限制**，需使用允许浏览器跨域访问的 OpenAI 兼容端点。

## 在线站点

已部署实例：<https://jonymaka.github.io/writingboard/>

## 部署到 GitHub Pages

仓库使用 `gh-pages` 分支托管构建产物，Pages 来源已设为该分支（见仓库 Settings → Pages）。

**首次发布**：

```bash
npm run build
rm -rf /tmp/wb-pages && mkdir -p /tmp/wb-pages
cp -R dist/. /tmp/wb-pages/
cd /tmp/wb-pages
git init -b gh-pages && git add -A && git commit -m "deploy"
git remote add origin https://github.com/jonymaka/writingboard.git
git push -f origin gh-pages
```

**更新**：重复上述命令（重新 build 后强制推送 `gh-pages` 分支）。

> 可选：若希望「push 到 main 即自动部署」，仓库内已备有 `.github/workflows/deploy.yml` 工作流。但推送到 GitHub 的 workflow 文件需要 token 的 `workflow` 权限——请先运行 `gh auth refresh -h github.com -s workflow` 完成授权，再 `git add .github/workflows/deploy.yml && git push`，并把仓库 Settings → Pages → Source 改为 **GitHub Actions**。

## 安全说明

- API Key 仅保存在浏览器 localStorage，**不进入代码、不上传任何服务器**
- 网站部署在公网后，任何访问者都能通过开发者工具读取该 Key
- **建议使用免费或低配额 Key，仅供自己使用**；可在设置中随时更换
- 文章数据仅存于本机浏览器，可用「全量数据」JSON 导出做备份

## 目录结构

```
src/
├── ai/provider.ts               # OpenAI 兼容流式客户端（Base URL / Key / 模型可配置）
├── lib/
│   ├── prompts.ts               # 指令模板 + 上下文窗口组装
│   ├── data.ts                  # 全量数据 JSON 序列化 / 校验
│   ├── export.ts                # HTML/Markdown 导入导出
│   └── stickyHighlightPlugin.ts # 批注格式防粘连插件
├── store/                       # Zustand：文档 / 设置 / UI 状态
├── hooks/
│   ├── useAiRequest.ts          # 流式请求（含 AbortController）
│   └── useReplaceSelection.ts   # 原地替换 + 输出清洗
└── components/
    ├── editor/                  # 编辑器 + 浮动 AI 工具栏 + 顶部栏
    ├── sidebar/                 # 文档列表 + 设置面板
    └── ai-panel/                # 右侧停靠面板（对语 / 撮要 / 校雠）
```

## 技术栈

React 18 · Vite · TypeScript · TipTap · Tailwind CSS · Zustand · Vitest

## 测试

```bash
npm test        # 运行 Vitest 单元测试
npm run build   # 类型检查 + 生产构建
```
