# 功能点拆分设计文档

## 1. 基础功能模块

### 1.1 文件树组件

#### 功能描述
提供项目文件的树形展示和管理功能，支持文件的创建、删除、重命名等操作。

#### 实现细节

**组件结构：**
```typescript
// components/FileTree/index.tsx
interface FileTreeProps {
  onFileSelect: (path: string) => void;
  onFileCreate: (path: string, type: 'file' | 'directory') => void;
  onFileDelete: (path: string) => void;
  onFileRename: (oldPath: string, newPath: string) => void;
}

// 文件节点组件
interface FileNodeProps {
  node: FileNode;
  level: number;
  expanded: boolean;
  selected: boolean;
  onToggle: () => void;
  onSelect: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
}
```

**核心功能：**
1. **文件树渲染**
   - 递归渲染文件节点
   - 支持展开/折叠目录
   - 文件类型图标显示
   - 选中状态管理

2. **右键菜单**
   - 新建文件/文件夹
   - 重命名
   - 删除
   - 复制路径

3. **拖拽功能**
   - 文件/文件夹拖拽移动
   - 拖拽时的视觉反馈
   - 验证拖拽合法性

**状态管理：**
```typescript
interface FileTreeState {
  fileTree: FileNode | null;
  expandedPaths: Set<string>;
  selectedPath: string | null;
  contextMenu: {
    visible: boolean;
    x: number;
    y: number;
    targetPath: string;
  } | null;
}
```

### 1.2 Monaco Editor集成

#### 功能描述
集成Monaco Editor，提供代码编辑、语法高亮、智能提示等功能。

#### 实现细节

**编辑器配置：**
```typescript
// components/CodeEditor/config.ts
export const editorOptions: monaco.editor.IStandaloneEditorConstructionOptions = {
  theme: 'vs-dark',
  fontSize: 14,
  fontFamily: 'Fira Code, monospace',
  minimap: { enabled: true },
  scrollBeyondLastLine: false,
  automaticLayout: true,
  tabSize: 2,
  wordWrap: 'on',
  // TypeScript配置
  'typescript.suggest.autoImports': true,
  'typescript.updateImportsOnFileMove.enabled': 'always',
};

// 语言配置
export const languageDefaults = {
  typescript: {
    diagnosticsOptions: {
      noSemanticValidation: false,
      noSyntaxValidation: false,
    },
    compilerOptions: {
      target: monaco.languages.typescript.ScriptTarget.ES2020,
      allowNonTsExtensions: true,
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
      module: monaco.languages.typescript.ModuleKind.CommonJS,
      noEmit: true,
      esModuleInterop: true,
      jsx: monaco.languages.typescript.JsxEmit.React,
      reactNamespace: 'React',
      allowJs: true,
      typeRoots: ['node_modules/@types'],
    },
  },
};
```

**多标签页管理：**
```typescript
interface EditorTab {
  id: string;
  path: string;
  title: string;
  content: string;
  language: string;
  isDirty: boolean;
  viewState?: monaco.editor.ICodeEditorViewState;
}

interface EditorState {
  tabs: EditorTab[];
  activeTabId: string | null;
  editorInstance: monaco.editor.IStandaloneCodeEditor | null;
}
```

**核心功能实现：**
1. **编辑器生命周期管理**
   - 创建和销毁编辑器实例
   - 保存和恢复视图状态
   - 处理编辑器事件

2. **文件操作集成**
   - 打开文件时创建新标签
   - 保存文件时更新内容
   - 监听文件变化

3. **智能功能**
   - 自动补全
   - 错误提示
   - 快速修复
   - 格式化

### 1.3 类型系统支持

#### 功能描述
提供完整的TypeScript类型检查和智能提示功能。

#### 实现细节

**类型服务初始化：**
```typescript
// services/typescript/index.ts
class TypeScriptService {
  private worker: Worker;
  private languageService: monaco.languages.typescript.LanguageServiceDefaults;
  
  async initialize() {
    // 1. 配置TypeScript编译选项
    this.languageService = monaco.languages.typescript.typescriptDefaults;
    this.languageService.setCompilerOptions(compilerOptions);
    
    // 2. 加载类型定义
    await this.loadTypeDefinitions();
    
    // 3. 设置诊断选项
    this.languageService.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false,
      onlyVisible: false,
    });
  }
  
  private async loadTypeDefinitions() {
    // 加载常用库的类型定义
    const typeLibs = ['es2020', 'dom', 'react', 'react-dom'];
    for (const lib of typeLibs) {
      const types = await this.fetchTypeDefinition(lib);
      this.languageService.addExtraLib(types, `node_modules/@types/${lib}/index.d.ts`);
    }
  }
}
```

**类型推导增强：**
```typescript
// 自动导入建议
monaco.languages.registerCodeActionProvider('typescript', {
  provideCodeActions: (model, range, context) => {
    const actions: monaco.languages.CodeAction[] = [];
    
    // 检查是否有未导入的符号
    const diagnostics = context.markers.filter(marker => 
      marker.code === '2304' || marker.code === '2552'
    );
    
    for (const diagnostic of diagnostics) {
      // 生成导入建议
      const importAction = this.createImportAction(model, diagnostic);
      if (importAction) actions.push(importAction);
    }
    
    return { actions, dispose: () => {} };
  }
});
```

## 2. AI功能模块

### 2.1 代码库索引系统

#### 功能描述
自动扫描和索引项目代码，建立语义化的代码知识库。

#### 实现细节

**索引流程设计：**
```typescript
// services/indexing/CodeIndexer.ts
class CodeIndexer {
  private parser: CodeParser;
  private chunker: CodeChunker;
  private embedder: EmbeddingService;
  private vectorStore: VectorStore;
  
  async indexProject(files: FileNode[]): Promise<void> {
    const indexingTasks = files
      .filter(file => this.isCodeFile(file))
      .map(file => this.indexFile(file));
    
    await Promise.all(indexingTasks);
  }
  
  private async indexFile(file: FileNode): Promise<void> {
    try {
      // 1. 解析代码获取AST
      const parseResult = await this.parser.parse(file.content, file.language);
      
      // 2. 提取符号信息
      const symbols = this.extractSymbols(parseResult.ast);
      
      // 3. 代码分块
      const chunks = this.chunker.chunk(parseResult.ast, file.content);
      
      // 4. 生成嵌入向量
      const embeddings = await this.embedder.embed(
        chunks.map(chunk => chunk.content)
      );
      
      // 5. 存储到向量数据库
      await this.vectorStore.upsert(
        chunks.map((chunk, i) => ({
          id: chunk.id,
          vector: embeddings[i],
          metadata: {
            ...chunk.metadata,
            symbols,
            filePath: file.path,
          }
        }))
      );
      
      // 6. 更新索引状态
      await this.updateIndexStatus(file.path, 'indexed');
    } catch (error) {
      await this.updateIndexStatus(file.path, 'error', error.message);
    }
  }
}
```

**AST解析实现：**
```typescript
// services/parser/TreeSitterParser.ts
import Parser from 'web-tree-sitter';

class TreeSitterParser implements CodeParser {
  private parsers: Map<string, Parser> = new Map();
  
  async initialize() {
    await Parser.init();
    
    // 加载语言解析器
    const languages = ['javascript', 'typescript', 'tsx'];
    for (const lang of languages) {
      const parser = new Parser();
      const langWasm = await Parser.Language.load(`/wasm/tree-sitter-${lang}.wasm`);
      parser.setLanguage(langWasm);
      this.parsers.set(lang, parser);
    }
  }
  
  async parse(code: string, language: string): Promise<ParseResult> {
    const parser = this.parsers.get(language);
    if (!parser) throw new Error(`Unsupported language: ${language}`);
    
    const tree = parser.parse(code);
    const symbols = this.extractSymbols(tree.rootNode);
    
    return {
      ast: tree,
      symbols,
      errors: this.extractErrors(tree),
    };
  }
  
  private extractSymbols(node: Parser.SyntaxNode): Symbol[] {
    const symbols: Symbol[] = [];
    
    const visit = (node: Parser.SyntaxNode) => {
      // 提取函数定义
      if (node.type === 'function_declaration' || 
          node.type === 'method_definition') {
        const nameNode = node.childForFieldName('name');
        if (nameNode) {
          symbols.push({
            name: nameNode.text,
            type: 'function',
            location: {
              start: node.startPosition,
              end: node.endPosition,
            },
            signature: this.extractSignature(node),
          });
        }
      }
      
      // 提取类定义
      if (node.type === 'class_declaration') {
        const nameNode = node.childForFieldName('name');
        if (nameNode) {
          symbols.push({
            name: nameNode.text,
            type: 'class',
            location: {
              start: node.startPosition,
              end: node.endPosition,
            },
          });
        }
      }
      
      // 递归遍历子节点
      for (let i = 0; i < node.childCount; i++) {
        visit(node.child(i)!);
      }
    };
    
    visit(node);
    return symbols;
  }
}
```

**代码分块策略：**
```typescript
// services/chunking/ASTChunker.ts
class ASTChunker implements CodeChunker {
  private readonly maxChunkSize = 1500;
  private readonly overlapSize = 200;
  
  chunk(ast: Parser.Tree, code: string): CodeChunk[] {
    const chunks: CodeChunk[] = [];
    const rootNode = ast.rootNode;
    
    // 1. 优先按语义单元分块（函数、类）
    const semanticUnits = this.extractSemanticUnits(rootNode);
    
    for (const unit of semanticUnits) {
      const unitCode = code.substring(unit.startIndex, unit.endIndex);
      
      if (unitCode.length <= this.maxChunkSize) {
        // 单元足够小，直接作为一个chunk
        chunks.push(this.createChunk(unit, unitCode));
      } else {
        // 单元太大，需要进一步分割
        chunks.push(...this.splitLargeUnit(unit, unitCode));
      }
    }
    
    // 2. 处理顶层代码（imports、全局变量等）
    const topLevelChunks = this.chunkTopLevelCode(rootNode, code, semanticUnits);
    chunks.unshift(...topLevelChunks);
    
    return chunks;
  }
  
  private extractSemanticUnits(node: Parser.SyntaxNode): SemanticUnit[] {
    const units: SemanticUnit[] = [];
    
    const visit = (node: Parser.SyntaxNode) => {
      if (this.isSemanticUnit(node)) {
        units.push({
          type: node.type,
          name: this.extractName(node),
          startIndex: node.startIndex,
          endIndex: node.endIndex,
          node,
        });
      } else {
        for (let i = 0; i < node.childCount; i++) {
          visit(node.child(i)!);
        }
      }
    };
    
    visit(node);
    return units;
  }
  
  private isSemanticUnit(node: Parser.SyntaxNode): boolean {
    return [
      'function_declaration',
      'class_declaration',
      'method_definition',
      'arrow_function',
      'function_expression',
    ].includes(node.type);
  }
}
```

### 2.2 智能检索系统

#### 功能描述
基于用户当前编辑上下文，智能检索相关代码片段。

#### 实现细节

**检索触发器：**
```typescript
// services/retrieval/RetrievalTrigger.ts
class RetrievalTrigger {
  private debounceTimer: NodeJS.Timeout | null = null;
  private readonly debounceDelay = 300;
  
  constructor(
    private editor: monaco.editor.IStandaloneCodeEditor,
    private retrievalService: RetrievalService
  ) {
    this.setupListeners();
  }
  
  private setupListeners() {
    // 光标位置变化
    this.editor.onDidChangeCursorPosition((e) => {
      this.handleCursorChange(e);
    });
    
    // 内容变化
    this.editor.onDidChangeModelContent((e) => {
      this.handleContentChange(e);
    });
    
    // 选择变化
    this.editor.onDidChangeCursorSelection((e) => {
      if (e.selection.isEmpty()) return;
      this.handleSelectionChange(e);
    });
  }
  
  private handleCursorChange(e: monaco.editor.ICursorPositionChangedEvent) {
    // 防抖处理
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    
    this.debounceTimer = setTimeout(() => {
      const context = this.buildContext(e.position);
      this.retrievalService.triggerRetrieval(context);
    }, this.debounceDelay);
  }
  
  private buildContext(position: monaco.Position): CodeContext {
    const model = this.editor.getModel()!;
    const offset = model.getOffsetAt(position);
    
    // 获取当前行
    const currentLine = model.getLineContent(position.lineNumber);
    
    // 获取前后文
    const beforeText = model.getValueInRange({
      startLineNumber: Math.max(1, position.lineNumber - 10),
      startColumn: 1,
      endLineNumber: position.lineNumber,
      endColumn: position.column,
    });
    
    const afterText = model.getValueInRange({
      startLineNumber: position.lineNumber,
      startColumn: position.column,
      endLineNumber: Math.min(model.getLineCount(), position.lineNumber + 10),
      endColumn: model.getLineMaxColumn(Math.min(model.getLineCount(), position.lineNumber + 10)),
    });
    
    return {
      currentFile: this.getCurrentFilePath(),
      cursorPosition: position,
      currentLine,
      beforeText,
      afterText,
      language: model.getLanguageId(),
    };
  }
}
```

**语义检索实现：**
```typescript
// services/retrieval/SemanticRetrieval.ts
class SemanticRetrieval {
  constructor(
    private vectorStore: VectorStore,
    private embeddingService: EmbeddingService,
    private scorer: RelevanceScorer
  ) {}
  
  async search(
    query: string, 
    context: CodeContext, 
    limit: number = 10
  ): Promise<SearchResult[]> {
    // 1. 生成查询向量
    const queryEmbedding = await this.embeddingService.embed(query);
    
    // 2. 向量检索
    const candidates = await this.vectorStore.search(queryEmbedding, limit * 3);
    
    // 3. 重新评分
    const scoredResults = candidates.map(candidate => {
      const score = this.scorer.score(candidate, query, context);
      return {
        ...candidate,
        score,
      };
    });
    
    // 4. 排序并返回top结果
    return scoredResults
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }
}

// 相关性评分器
class RelevanceScorer {
  score(
    candidate: VectorSearchResult,
    query: string,
    context: CodeContext
  ): number {
    const weights = {
      semantic: 0.4,
      location: 0.3,
      reference: 0.2,
      recency: 0.1,
    };
    
    // 语义相似度
    const semanticScore = candidate.score; // 向量相似度
    
    // 位置相关性
    const locationScore = this.calculateLocationScore(
      candidate.metadata.filePath,
      context.currentFile,
      candidate.metadata.startLine,
      context.cursorPosition.lineNumber
    );
    
    // 引用关系
    const referenceScore = this.calculateReferenceScore(
      candidate.metadata.symbols,
      context
    );
    
    // 时间相关性
    const recencyScore = this.calculateRecencyScore(
      candidate.metadata.lastModified,
      context.recentFiles
    );
    
    return (
      semanticScore * weights.semantic +
      locationScore * weights.location +
      referenceScore * weights.reference +
      recencyScore * weights.recency
    );
  }
  
  private calculateLocationScore(
    candidateFile: string,
    currentFile: string,
    candidateLine: number,
    currentLine: number
  ): number {
    if (candidateFile === currentFile) {
      // 同文件，根据行距离计算
      const distance = Math.abs(candidateLine - currentLine);
      return Math.max(0, 1 - distance / 1000);
    } else {
      // 不同文件，根据路径相似度计算
      return this.pathSimilarity(candidateFile, currentFile) * 0.5;
    }
  }
}
```

### 2.3 AI交互系统

#### 功能描述
集成Vercel AI SDK，提供智能代码补全和对话功能。

#### 实现细节

**AI服务封装：**
```typescript
// services/ai/AIService.ts
import { openai } from '@ai-sdk/openai';
import { embed, embedMany, streamText } from 'ai';

class AIService {
  private model = openai('gpt-4-turbo');
  private embeddingModel = openai.embedding('text-embedding-3-small');
  
  // 生成嵌入向量
  async generateEmbedding(text: string): Promise<number[]> {
    const { embedding } = await embed({
      model: this.embeddingModel,
      value: text,
    });
    return embedding;
  }
  
  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    const { embeddings } = await embedMany({
      model: this.embeddingModel,
      values: texts,
    });
    return embeddings;
  }
  
  // 代码补全
  async completeCode(
    context: CodeContext,
    searchResults: SearchResult[]
  ): Promise<ReadableStream> {
    const prompt = this.buildCompletionPrompt(context, searchResults);
    
    const result = await streamText({
      model: this.model,
      messages: [
        {
          role: 'system',
          content: this.getSystemPrompt(),
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.2,
      maxTokens: 500,
    });
    
    return result.toDataStreamResponse();
  }
  
  private buildCompletionPrompt(
    context: CodeContext,
    searchResults: SearchResult[]
  ): string {
    const parts = [
      '### Current Context',
      `File: ${context.currentFile}`,
      `Language: ${context.language}`,
      `Cursor Position: Line ${context.cursorPosition.lineNumber}`,
      '',
      '### Code Before Cursor',
      '```' + context.language,
      context.beforeText,
      '```',
      '',
      '### Code After Cursor',
      '```' + context.language,
      context.afterText,
      '```',
      '',
      '### Related Code from Project',
    ];
    
    // 添加检索到的相关代码
    for (const result of searchResults.slice(0, 3)) {
      parts.push(
        `File: ${result.metadata.filePath}`,
        '```' + context.language,
        result.content,
        '```',
        ''
      );
    }
    
    parts.push(
      '### Task',
      'Complete the code at the cursor position. Consider the context and related code.'
    );
    
    return parts.join('\n');
  }
  
  private getSystemPrompt(): string {
    return `You are an expert code assistant integrated into an IDE. 
Your task is to provide accurate, contextual code completions.

Guidelines:
1. Generate only the code that should be inserted at the cursor position
2. Ensure the completion fits naturally with the surrounding code
3. Follow the coding style and patterns evident in the context
4. Consider imports, type definitions, and other dependencies
5. Prefer completions that utilize existing code patterns from the project`;
  }
}
```

**Prompt工程优化：**
```typescript
// services/ai/PromptBuilder.ts
class PromptBuilder {
  buildRAGPrompt(
    query: string,
    context: CodeContext,
    searchResults: SearchResult[]
  ): ChatMessage[] {
    const messages: ChatMessage[] = [];
    
    // 系统消息
    messages.push({
      role: 'system',
      content: this.getRAGSystemPrompt(),
    });
    
    // 添加项目上下文
    messages.push({
      role: 'user',
      content: this.formatProjectContext(context),
    });
    
    // 添加检索结果
    if (searchResults.length > 0) {
      messages.push({
        role: 'assistant',
        content: 'I found the following relevant code in your project:',
      });
      
      messages.push({
        role: 'user',
        content: this.formatSearchResults(searchResults),
      });
    }
    
    // 用户查询
    messages.push({
      role: 'user',
      content: query,
    });
    
    return messages;
  }
  
  private getRAGSystemPrompt(): string {
    return `You are an AI assistant integrated into a code editor with access to the entire codebase.
You have been provided with relevant code snippets from the project based on semantic search.

Your capabilities:
1. Answer questions about the codebase accurately
2. Suggest code improvements based on project patterns
3. Help with refactoring and debugging
4. Explain code functionality and relationships

Guidelines:
- Base your answers on the provided code context
- Reference specific files and line numbers when relevant
- If information is not available in the context, clearly state so
- Maintain consistency with the project's coding style`;
  }
  
  private formatSearchResults(results: SearchResult[]): string {
    return results.map((result, index) => {
      const { metadata, content } = result;
      return `
### Result ${index + 1} (Score: ${result.score.toFixed(3)})
File: ${metadata.filePath}
Lines: ${metadata.startLine}-${metadata.endLine}
${metadata.symbols.length > 0 ? `Symbols: ${metadata.symbols.join(', ')}` : ''}

\`\`\`${metadata.language}
${content}
\`\`\`
`;
    }).join('\n\n');
  }
}
```

## 3. UI组件设计

### 3.1 AI面板组件

#### 功能描述
右侧悬浮面板，展示AI检索结果和交互界面。

#### 实现细节

**面板组件结构：**
```typescript
// components/AIPanel/index.tsx
interface AIPanelProps {
  isOpen: boolean;
  onClose: () => void;
  searchResults: SearchResult[];
  isSearching: boolean;
}

const AIPanel: React.FC<AIPanelProps> = ({
  isOpen,
  onClose,
  searchResults,
  isSearching,
}) => {
  const [activeTab, setActiveTab] = useState<'search' | 'chat' | 'prompt'>('search');
  
  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: isOpen ? 0 : '100%' }}
      transition={{ type: 'spring', damping: 20 }}
      className="fixed right-0 top-0 h-full w-96 bg-gray-900 border-l border-gray-700 shadow-xl z-50"
    >
      {/* 标题栏 */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <h2 className="text-lg font-semibold">AI Assistant</h2>
        <button onClick={onClose}>
          <X className="w-5 h-5" />
        </button>
      </div>
      
      {/* 标签页 */}
      <div className="flex border-b border-gray-700">
        <TabButton
          active={activeTab === 'search'}
          onClick={() => setActiveTab('search')}
        >
          Search Results
        </TabButton>
        <TabButton
          active={activeTab === 'chat'}
          onClick={() => setActiveTab('chat')}
        >
          Chat
        </TabButton>
        <TabButton
          active={activeTab === 'prompt'}
          onClick={() => setActiveTab('prompt')}
        >
          Prompt
        </TabButton>
      </div>
      
      {/* 内容区域 */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'search' && (
          <SearchResultsView
            results={searchResults}
            isSearching={isSearching}
          />
        )}
        {activeTab === 'chat' && <ChatView />}
        {activeTab === 'prompt' && <PromptView />}
      </div>
    </motion.div>
  );
};
```

**搜索结果展示：**
```typescript
// components/AIPanel/SearchResultsView.tsx
const SearchResultsView: React.FC<{
  results: SearchResult[];
  isSearching: boolean;
}> = ({ results, isSearching }) => {
  if (isSearching) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader className="animate-spin w-6 h-6" />
      </div>
    );
  }
  
  if (results.length === 0) {
    return (
      <div className="p-4 text-gray-400 text-center">
        No results found. Try moving your cursor or selecting code.
      </div>
    );
  }
  
  return (
    <div className="divide-y divide-gray-700">
      {results.map((result, index) => (
        <SearchResultItem
          key={result.id}
          result={result}
          rank={index + 1}
        />
      ))}
    </div>
  );
};

const SearchResultItem: React.FC<{
  result: SearchResult;
  rank: number;
}> = ({ result, rank }) => {
  const [expanded, setExpanded] = useState(false);
  
  return (
    <div className="p-4 hover:bg-gray-800 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-gray-500">#{rank}</span>
            <span className="text-sm font-medium text-blue-400">
              {result.metadata.filePath}
            </span>
            <span className="text-xs text-gray-500">
              L{result.metadata.startLine}-{result.metadata.endLine}
            </span>
          </div>
          
          {result.metadata.symbols.length > 0 && (
            <div className="flex gap-1 mb-2">
              {result.metadata.symbols.map(symbol => (
                <span
                  key={symbol}
                  className="text-xs px-2 py-1 bg-gray-700 rounded"
                >
                  {symbol}
                </span>
              ))}
            </div>
          )}
          
          <div className="relative">
            <pre className={`text-xs overflow-hidden ${!expanded ? 'max-h-20' : ''}`}>
              <code>{result.content}</code>
            </pre>
            
            {result.content.split('\n').length > 5 && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="absolute bottom-0 right-0 text-xs text-blue-400 hover:underline"
              >
                {expanded ? 'Show less' : 'Show more'}
              </button>
            )}
          </div>
        </div>
        
        <div className="ml-2 text-xs text-gray-500">
          {(result.score * 100).toFixed(0)}%
        </div>
      </div>
    </div>
  );
};
```

### 3.2 状态栏组件

#### 功能描述
显示索引状态、AI活动状态等信息。

#### 实现细节

```typescript
// components/StatusBar/index.tsx
const StatusBar: React.FC = () => {
  const { indexingStatus, aiStatus } = useAppStore();
  
  return (
    <div className="fixed bottom-0 left-0 right-0 h-6 bg-gray-800 border-t border-gray-700 flex items-center px-4 text-xs">
      {/* 索引状态 */}
      <div className="flex items-center gap-2">
        {indexingStatus.isIndexing ? (
          <>
            <Loader className="w-3 h-3 animate-spin" />
            <span>Indexing... {indexingStatus.progress}%</span>
          </>
        ) : (
          <>
            <CheckCircle className="w-3 h-3 text-green-500" />
            <span>{indexingStatus.totalFiles} files indexed</span>
          </>
        )}
      </div>
      
      <div className="mx-4 h-4 w-px bg-gray-600" />
      
      {/* AI状态 */}
      <div className="flex items-center gap-2">
        {aiStatus.isActive ? (
          <>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span>AI Active</span>
          </>
        ) : (
          <>
            <div className="w-2 h-2 bg-gray-500 rounded-full" />
            <span>AI Ready</span>
          </>
        )}
      </div>
      
      <div className="flex-1" />
      
      {/* 其他状态信息 */}
      <div className="flex items-center gap-4">
        <span>TypeScript {tsVersion}</span>
        <span>UTF-8</span>
      </div>
    </div>
  );
};
```

## 4. 性能优化实现

### 4.1 虚拟滚动

```typescript
// components/VirtualList/index.tsx
import { VariableSizeList } from 'react-window';

const VirtualFileTree: React.FC<{
  nodes: FlattenedNode[];
  itemHeight: number;
}> = ({ nodes, itemHeight }) => {
  const getItemSize = (index: number) => {
    // 可以根据节点类型返回不同高度
    return itemHeight;
  };
  
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const node = nodes[index];
    return (
      <div style={style}>
        <FileNode
          node={node}
          level={node.level}
          expanded={node.expanded}
          selected={node.selected}
        />
      </div>
    );
  };
  
  return (
    <VariableSizeList
      height={window.innerHeight - 100} // 减去其他UI元素高度
      itemCount={nodes.length}
      itemSize={getItemSize}
      width="100%"
    >
      {Row}
    </VariableSizeList>
  );
};
```

### 4.2 防抖和节流

```typescript
// utils/performance.ts
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// 使用示例
const debouncedSearch = debounce(handleSearch, 300);
const throttledScroll = throttle(handleScroll, 100);
```

### 4.3 Web Worker集成

```typescript
// workers/indexing.worker.ts
import { expose } from 'comlink';
import Parser from 'web-tree-sitter';

class IndexingWorker {
  private parser: Parser | null = null;
  
  async initialize() {
    await Parser.init();
    this.parser = new Parser();
    // 加载语言...
  }
  
  async parseAndChunk(code: string, language: string): Promise<CodeChunk[]> {
    if (!this.parser) throw new Error('Parser not initialized');
    
    // 执行耗时的解析和分块操作
    const tree = this.parser.parse(code);
    const chunks = this.chunkCode(tree, code);
    
    return chunks;
  }
  
  private chunkCode(tree: Parser.Tree, code: string): CodeChunk[] {
    // 分块逻辑...
    return [];
  }
}

expose(IndexingWorker);

// 主线程使用
import { wrap } from 'comlink';

const worker = new Worker(
  new URL('./workers/indexing.worker.ts', import.meta.url),
  { type: 'module' }
);

const indexingWorker = wrap<IndexingWorker>(worker);
await indexingWorker.initialize();
const chunks = await indexingWorker.parseAndChunk(code, 'typescript');
```

## 5. 测试策略

### 5.1 单元测试

```typescript
// __tests__/services/CodeChunker.test.ts
import { CodeChunker } from '@/services/chunking/CodeChunker';

describe('CodeChunker', () => {
  let chunker: CodeChunker;
  
  beforeEach(() => {
    chunker = new CodeChunker();
  });
  
  test('should chunk simple function correctly', async () => {
    const code = `
function add(a: number, b: number): number {
  return a + b;
}
    `.trim();
    
    const chunks = await chunker.chunk(code, 'typescript');
    
    expect(chunks).toHaveLength(1);
    expect(chunks[0].type).toBe('function');
    expect(chunks[0].content).toContain('function add');
  });
  
  test('should handle large functions by splitting', async () => {
    const largeFunction = generateLargeFunction(2000); // 生成超过maxChunkSize的函数
    const chunks = await chunker.chunk(largeFunction, 'typescript');
    
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.every(chunk => chunk.content.length <= 1500)).toBe(true);
  });
});
```

### 5.2 集成测试

```typescript
// __tests__/integration/AIService.test.ts
import { AIService } from '@/services/ai/AIService';
import { mockSearchResults } from '../mocks';

describe('AIService Integration', () => {
  let aiService: AIService;
  
  beforeAll(() => {
    aiService = new AIService();
  });
  
  test('should generate relevant code completion', async () => {
    const context = {
      currentFile: '/src/utils/math.ts',
      cursorPosition: { lineNumber: 5, column: 10 },
      beforeText: 'function multiply(',
      afterText: '\n}',
      language: 'typescript',
    };
    
    const stream = await aiService.completeCode(context, mockSearchResults);
    const completion = await streamToString(stream);
    
    expect(completion).toContain('a: number');
    expect(completion).toContain('b: number');
    expect(completion).toContain('return');
  });
});
```

## 6. 部署和发布

### 6.1 构建配置

```typescript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // 配置Web Worker
    config.module.rules.push({
      test: /\.worker\.(js|ts)$/,
      use: { loader: 'worker-loader' },
    });
    
    // 配置WASM
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    };
    
    // 排除node模块
    if (!isServer) {
      config.resolve.fallback = {
        fs: false,
        path: false,
        crypto: false,
      };
    }
    
    return config;
  },
  
  // 优化选项
  swcMinify: true,
  compress: true,
  
  // 环境变量
  env: {
    NEXT_PUBLIC_AI_API_KEY: process.env.AI_API_KEY,
  },
};

module.exports = nextConfig;
```

### 6.2 Docker配置

```dockerfile
# Dockerfile
FROM node:18-alpine AS base

# 依赖安装
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN corepack enable pnpm && pnpm install --frozen-lockfile

# 构建阶段
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN pnpm build

# 运行阶段
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

这个功能点拆分文档详细说明了每个核心功能的实现方案，包括具体的代码结构、算法实现和集成方式，为开发提供了清晰的指导。