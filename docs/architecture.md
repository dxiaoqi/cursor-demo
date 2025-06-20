# 系统架构设计文档

## 1. 总体架构

### 1.1 架构原则
- **模块化设计**：各功能模块独立，便于开发和维护
- **分层架构**：清晰的层次结构，降低耦合度
- **事件驱动**：使用事件机制处理用户操作和系统状态变化
- **响应式设计**：实时响应用户操作，提供流畅体验

### 1.2 技术栈选择理由

| 技术 | 选择理由 |
|------|----------|
| Next.js 14 | 支持App Router、Server Components，性能优秀 |
| Vercel AI SDK | 提供完整的AI集成方案，支持流式响应、RAG等 |
| Monaco Editor | VS Code同款编辑器，功能强大，生态完善 |
| Zustand | 轻量级状态管理，TypeScript支持好 |
| Tailwind CSS | 快速开发UI，与Radix UI配合良好 |
| Tree-sitter (WASM) | 高性能代码解析，支持多语言 |

## 2. 系统分层架构

```
┌─────────────────────────────────────────────────────────────┐
│                        表现层（UI Layer）                     │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ FileTree    │  │ CodeEditor   │  │ AIPanel          │  │
│  │ Component   │  │ Component    │  │ Component        │  │
│  └─────────────┘  └──────────────┘  └──────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│                     应用层（Application Layer）              │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ Editor      │  │ AI           │  │ FileSystem       │  │
│  │ Controller  │  │ Controller   │  │ Controller       │  │
│  └─────────────┘  └──────────────┘  └──────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│                      服务层（Service Layer）                 │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ Code Parser │  │ Indexing     │  │ AI Service       │  │
│  │ Service     │  │ Service      │  │                  │  │
│  └─────────────┘  └──────────────┘  └──────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│                      数据层（Data Layer）                    │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ File Store  │  │ Vector Store │  │ Cache Store      │  │
│  └─────────────┘  └──────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## 3. 核心模块设计

### 3.1 文件系统模块

```typescript
// 文件系统接口定义
interface FileSystemService {
  // 文件操作
  createFile(path: string, content: string): Promise<void>;
  readFile(path: string): Promise<string>;
  updateFile(path: string, content: string): Promise<void>;
  deleteFile(path: string): Promise<void>;
  
  // 目录操作
  createDirectory(path: string): Promise<void>;
  readDirectory(path: string): Promise<FileNode[]>;
  deleteDirectory(path: string): Promise<void>;
  
  // 文件树管理
  getFileTree(): Promise<FileNode>;
  watchChanges(callback: (changes: FileChange[]) => void): void;
}

interface FileNode {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileNode[];
  content?: string;
  language?: string;
}
```

### 3.2 代码解析模块

```typescript
// AST解析服务
interface CodeParserService {
  // 解析代码
  parseCode(code: string, language: string): Promise<ParseResult>;
  
  // 提取符号
  extractSymbols(ast: AST): Symbol[];
  
  // 代码分块
  chunkCode(ast: AST, strategy: ChunkStrategy): CodeChunk[];
  
  // 依赖分析
  analyzeDependencies(ast: AST): DependencyGraph;
}

interface ParseResult {
  ast: AST;
  symbols: Symbol[];
  errors: ParseError[];
}

interface Symbol {
  name: string;
  type: 'class' | 'function' | 'variable' | 'interface';
  location: Location;
  signature?: string;
  docComment?: string;
}
```

### 3.3 索引服务模块

```typescript
// 索引管理服务
interface IndexingService {
  // 索引操作
  indexFile(file: FileNode): Promise<void>;
  updateIndex(file: FileNode): Promise<void>;
  removeFromIndex(filePath: string): Promise<void>;
  
  // 批量索引
  indexProject(files: FileNode[]): Promise<void>;
  
  // 索引查询
  searchByEmbedding(embedding: number[], limit: number): Promise<SearchResult[]>;
  searchBySymbol(symbol: string): Promise<SearchResult[]>;
  
  // 索引管理
  clearIndex(): Promise<void>;
  getIndexStats(): Promise<IndexStats>;
}

interface SearchResult {
  chunk: CodeChunk;
  score: number;
  highlights?: Range[];
}
```

### 3.4 AI服务模块

```typescript
// AI集成服务
interface AIService {
  // 嵌入生成
  generateEmbedding(text: string): Promise<number[]>;
  generateEmbeddings(texts: string[]): Promise<number[][]>;
  
  // 代码补全
  completeCode(context: CodeContext): Promise<CompletionResult>;
  
  // 智能搜索
  semanticSearch(query: string, context: CodeContext): Promise<SearchResult[]>;
  
  // 对话交互
  chat(messages: Message[], context: CodeContext): Promise<ChatResponse>;
}

interface CodeContext {
  currentFile: string;
  cursorPosition: Position;
  selectedText?: string;
  openFiles: string[];
  recentFiles: string[];
}
```

## 4. 数据流设计

### 4.1 代码索引流程

```mermaid
graph LR
    A[用户创建/修改文件] --> B[文件系统监听]
    B --> C[触发索引任务]
    C --> D[AST解析]
    D --> E[代码分块]
    E --> F[生成嵌入向量]
    F --> G[存储到向量数据库]
    G --> H[更新索引状态]
```

### 4.2 智能补全流程

```mermaid
graph LR
    A[用户输入代码] --> B[捕获光标位置]
    B --> C[提取上下文]
    C --> D[生成查询向量]
    D --> E[向量检索]
    E --> F[相关性排序]
    F --> G[构建Prompt]
    G --> H[调用LLM]
    H --> I[流式返回结果]
    I --> J[更新UI]
```

### 4.3 状态管理流程

```typescript
// Zustand Store设计
interface AppState {
  // 文件系统状态
  fileTree: FileNode | null;
  openFiles: OpenFile[];
  activeFile: string | null;
  
  // 编辑器状态
  editorContent: Map<string, string>;
  cursorPosition: Map<string, Position>;
  selections: Map<string, Selection>;
  
  // AI状态
  indexingStatus: IndexingStatus;
  searchResults: SearchResult[];
  aiPanelVisible: boolean;
  
  // Actions
  actions: {
    // 文件操作
    createFile: (path: string) => Promise<void>;
    openFile: (path: string) => Promise<void>;
    saveFile: (path: string, content: string) => Promise<void>;
    closeFile: (path: string) => void;
    
    // 编辑器操作
    updateContent: (path: string, content: string) => void;
    updateCursor: (path: string, position: Position) => void;
    
    // AI操作
    triggerSearch: (query: string) => Promise<void>;
    toggleAIPanel: () => void;
  };
}
```

## 5. 关键算法实现

### 5.1 代码分块算法

```typescript
class CodeChunker {
  private readonly chunkSize = 1500; // 字符数
  private readonly overlap = 200;     // 重叠字符数
  
  chunkByAST(ast: AST, code: string): CodeChunk[] {
    const chunks: CodeChunk[] = [];
    
    // 1. 提取顶层定义（类、函数）
    const topLevelNodes = this.extractTopLevelNodes(ast);
    
    for (const node of topLevelNodes) {
      const chunk = this.createChunkFromNode(node, code);
      
      // 2. 如果chunk太大，进一步分割
      if (chunk.content.length > this.chunkSize) {
        chunks.push(...this.splitLargeChunk(chunk));
      } else {
        chunks.push(chunk);
      }
    }
    
    // 3. 处理剩余代码（imports、全局变量等）
    const remainingChunks = this.chunkRemainingCode(ast, code, topLevelNodes);
    chunks.push(...remainingChunks);
    
    return chunks;
  }
  
  private createChunkFromNode(node: ASTNode, code: string): CodeChunk {
    const content = code.substring(node.start, node.end);
    const metadata = this.extractMetadata(node, code);
    
    return {
      id: generateId(),
      content,
      type: this.getNodeType(node),
      metadata,
      embedding: undefined // 后续生成
    };
  }
}
```

### 5.2 相关性评分算法

```typescript
class RelevanceScorer {
  score(
    chunk: CodeChunk,
    query: string,
    context: CodeContext
  ): number {
    let score = 0;
    
    // 1. 语义相似度（0-1）
    const semanticScore = this.cosineSimilarity(
      chunk.embedding!,
      context.queryEmbedding!
    );
    score += semanticScore * 0.4;
    
    // 2. 位置权重（0-1）
    const locationScore = this.calculateLocationScore(
      chunk,
      context.currentFile,
      context.cursorPosition
    );
    score += locationScore * 0.3;
    
    // 3. 引用关系（0-1）
    const referenceScore = this.calculateReferenceScore(
      chunk,
      context
    );
    score += referenceScore * 0.2;
    
    // 4. 时间衰减（0-1）
    const recencyScore = this.calculateRecencyScore(
      chunk,
      context.recentFiles
    );
    score += recencyScore * 0.1;
    
    return score;
  }
  
  private cosineSimilarity(a: number[], b: number[]): number {
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    return dotProduct / (magnitudeA * magnitudeB);
  }
}
```

### 5.3 上下文窗口管理

```typescript
class ContextWindowManager {
  private readonly maxTokens = 8000;
  private readonly tokenizer = new Tokenizer();
  
  buildContext(
    searchResults: SearchResult[],
    userQuery: string,
    codeContext: CodeContext
  ): string {
    const contextParts: ContextPart[] = [];
    let currentTokens = 0;
    
    // 1. 添加系统提示
    const systemPrompt = this.getSystemPrompt();
    currentTokens += this.tokenizer.count(systemPrompt);
    contextParts.push({ type: 'system', content: systemPrompt });
    
    // 2. 添加当前文件上下文
    const currentFileContext = this.getCurrentFileContext(codeContext);
    const fileTokens = this.tokenizer.count(currentFileContext);
    if (currentTokens + fileTokens < this.maxTokens * 0.3) {
      currentTokens += fileTokens;
      contextParts.push({ type: 'current_file', content: currentFileContext });
    }
    
    // 3. 添加检索结果（按相关性排序）
    for (const result of searchResults) {
      const resultTokens = this.tokenizer.count(result.chunk.content);
      if (currentTokens + resultTokens > this.maxTokens * 0.8) break;
      
      currentTokens += resultTokens;
      contextParts.push({
        type: 'search_result',
        content: this.formatSearchResult(result)
      });
    }
    
    // 4. 添加用户查询
    contextParts.push({ type: 'user_query', content: userQuery });
    
    return this.assembleContext(contextParts);
  }
}
```

## 6. API设计

### 6.1 RESTful API

```typescript
// 文件操作API
POST   /api/files          // 创建文件
GET    /api/files/:path    // 读取文件
PUT    /api/files/:path    // 更新文件
DELETE /api/files/:path    // 删除文件

// 索引API
POST   /api/index/file     // 索引单个文件
POST   /api/index/project  // 索引整个项目
GET    /api/index/stats    // 获取索引统计

// AI功能API
POST   /api/ai/complete    // 代码补全
POST   /api/ai/search      // 语义搜索
POST   /api/ai/chat        // 对话交互
```

### 6.2 WebSocket事件

```typescript
// 客户端 -> 服务器
interface ClientEvents {
  'file:change': { path: string; content: string };
  'cursor:move': { path: string; position: Position };
  'search:trigger': { query: string; context: CodeContext };
}

// 服务器 -> 客户端
interface ServerEvents {
  'index:progress': { status: IndexingStatus; progress: number };
  'search:results': { results: SearchResult[] };
  'ai:stream': { chunk: string; done: boolean };
}
```

## 7. 性能优化策略

### 7.1 索引优化
- **增量更新**：只重新索引修改的文件
- **后台处理**：使用Web Worker进行索引计算
- **批量操作**：合并多个索引请求

### 7.2 检索优化
- **缓存机制**：LRU缓存最近的搜索结果
- **预加载**：预测用户意图，提前加载可能需要的数据
- **索引分片**：大项目分片存储，并行检索

### 7.3 UI优化
- **虚拟列表**：文件树使用虚拟滚动
- **懒加载**：按需加载编辑器和AI功能
- **防抖节流**：优化高频事件处理

## 8. 安全考虑

### 8.1 数据安全
- 所有数据存储在客户端（Demo版本）
- 敏感信息不发送到AI服务
- 支持本地AI模型（可选）

### 8.2 API安全
- API请求验证
- Rate limiting
- 输入验证和清理

## 9. 扩展性设计

### 9.1 插件架构
```typescript
interface Plugin {
  name: string;
  version: string;
  activate(context: PluginContext): void;
  deactivate(): void;
}

interface PluginContext {
  fileSystem: FileSystemService;
  parser: CodeParserService;
  ai: AIService;
  ui: UIService;
}
```

### 9.2 主题系统
- 支持自定义编辑器主题
- 支持UI主题切换
- 主题配置导入/导出

## 10. 部署架构

```
┌─────────────────┐     ┌─────────────────┐
│   CDN (静态资源) │     │   Vercel Edge   │
└────────┬────────┘     └────────┬────────┘
         │                       │
         └───────────┬───────────┘
                     │
              ┌──────┴──────┐
              │  Next.js    │
              │  应用服务器  │
              └──────┬──────┘
                     │
         ┌───────────┴───────────┐
         │                       │
    ┌────┴────┐           ┌──────┴──────┐
    │ AI API  │           │ Vector DB   │
    │ (OpenAI)│           │  (内存)     │
    └─────────┘           └─────────────┘
```

本架构设计注重模块化、可扩展性和性能，为实现一个功能完善的AI代码编辑器奠定了坚实的技术基础。