# AI Code Editor - 仿Cursor IDE

一个基于Web的智能代码编辑器，模仿Cursor IDE的核心功能，集成AI辅助编程能力。

![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.0-38B2AC)
![License](https://img.shields.io/badge/license-MIT-green)

## ✨ 功能特性

### 🚀 基础功能
- 📁 **文件管理系统** - 完整的文件树，支持创建、删除、重命名等操作
- ✏️ **Monaco Editor** - VS Code同款编辑器，支持语法高亮、智能提示
- 🎨 **主题系统** - 支持亮色/暗色主题切换
- 📑 **多标签编辑** - 同时编辑多个文件，标签页管理
- 💾 **自动保存** - 编辑内容自动保存，防止数据丢失

### 🤖 AI功能
- 🔍 **智能代码搜索** - 基于语义的代码搜索，快速定位相关代码
- 📊 **代码索引** - 自动解析和索引代码库，提取函数、类等结构
- 🎯 **上下文感知** - 根据当前编辑位置提供相关建议
- ⚡ **实时搜索** - 输入即搜索，毫秒级响应

### 💻 技术特性
- 🏗️ **模块化架构** - 清晰的代码组织，易于扩展和维护
- ⚡ **高性能** - 使用防抖、缓存等优化技术
- 📱 **响应式设计** - 适配不同屏幕尺寸
- 🔧 **TypeScript** - 完整的类型支持，提升开发体验

## 🛠️ 技术栈

- **框架**: Next.js 14 (App Router)
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **状态管理**: Zustand
- **编辑器**: Monaco Editor
- **UI组件**: Radix UI
- **代码解析**: Tree-sitter (WASM)
- **AI集成**: Vercel AI SDK

## 📦 安装使用

### 环境要求
- Node.js 18.0 或更高版本
- npm 或 yarn 或 pnpm

### 安装步骤

1. **克隆项目**
```bash
git clone https://github.com/yourusername/ai-code-editor.git
cd ai-code-editor
```

2. **安装依赖**
```bash
npm install
# 或
yarn install
# 或
pnpm install
```

3. **配置环境变量**（可选）
```bash
cp .env.example .env.local
# 编辑 .env.local 添加你的API密钥
```

4. **启动开发服务器**
```bash
npm run dev
# 或
yarn dev
# 或
pnpm dev
```

5. **访问应用**
打开浏览器访问 [http://localhost:3000](http://localhost:3000)

## 🎮 使用指南

### 基本操作
1. **文件操作**
   - 左侧文件树右键可以创建、删除、重命名文件
   - 点击文件打开编辑
   - 支持拖拽调整面板大小

2. **代码编辑**
   - 支持多文件同时编辑
   - 自动语法高亮和代码提示
   - Ctrl/Cmd + S 保存文件（也会自动保存）

3. **AI搜索**
   - 点击右上角机器人图标打开AI面板
   - 在搜索框输入关键词进行搜索
   - 点击搜索结果跳转到对应代码

### AI功能演示
在浏览器控制台运行以下命令查看AI功能演示：
```javascript
demoAISearch()
```

## 📁 项目结构

```
ai-code-editor/
├── app/                    # Next.js App Router
│   ├── api/               # API路由
│   │   └── files/        # 文件操作API
│   │   └── ...
│   ├── layout.tsx        # 根布局
│   └── page.tsx          # 主页面
├── components/            # React组件
│   ├── AIPanel.tsx       # AI搜索面板
│   ├── EditorArea.tsx    # 编辑器区域
│   ├── FileTree.tsx      # 文件树
│   ├── MonacoEditor.tsx  # Monaco编辑器封装
│   └── ...
├── lib/                   # 工具库
│   ├── services/         # 服务层
│   │   ├── aiSearchService.ts    # AI搜索服务
│   │   ├── codeIndexService.ts   # 代码索引服务
│   │   └── fileService.ts        # 文件操作服务
│   ├── store/            # 状态管理
│   ├── types.ts          # TypeScript类型定义
│   └── utils.ts          # 工具函数
├── workspace/            # 虚拟文件系统
└── docs/                 # 项目文档
```

## 🔧 配置说明

### 环境变量
查看 `.env.example` 了解可配置的环境变量：
- `OPENAI_API_KEY` - OpenAI API密钥（可选）
- `ANTHROPIC_API_KEY` - Anthropic API密钥（可选）
- `AI_PROVIDER` - AI提供商选择

### 自定义配置
- **主题**: 在 `tailwind.config.js` 中自定义颜色主题
- **编辑器**: 在 `MonacoEditor.tsx` 中配置编辑器选项
- **AI搜索**: 在 `aiSearchService.ts` 中调整搜索策略

## 🚀 部署

### Vercel部署（推荐）
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/ai-code-editor)

### 其他平台
项目支持部署到任何支持Node.js的平台：
- Netlify
- Railway
- Render
- 自托管服务器

## 🤝 贡献指南

欢迎贡献代码！请遵循以下步骤：

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 🙏 致谢

- [Monaco Editor](https://microsoft.github.io/monaco-editor/) - 强大的代码编辑器
- [Tree-sitter](https://tree-sitter.github.io/tree-sitter/) - 增量解析库
- [Vercel](https://vercel.com) - 部署平台
- [Cursor IDE](https://cursor.sh/) - 灵感来源

## 📞 联系方式

- 项目主页: [https://github.com/yourusername/ai-code-editor](https://github.com/yourusername/ai-code-editor)
- 问题反馈: [Issues](https://github.com/yourusername/ai-code-editor/issues)

---

⭐ 如果这个项目对你有帮助，请给一个星标支持！
