// 文件系统相关类型
export interface FileNode {
  id: string
  name: string
  path: string
  type: 'file' | 'directory'
  children?: FileNode[]
  content?: string
  language?: string
}

export interface FileChange {
  type: 'create' | 'update' | 'delete' | 'rename'
  path: string
  newPath?: string
  content?: string
}

// 编辑器相关类型
export interface EditorTab {
  id: string
  path: string
  title: string
  content: string
  language: string
  isDirty: boolean
  viewState?: any // Monaco editor view state
}

export interface Position {
  lineNumber: number
  column: number
}

export interface Selection {
  startLineNumber: number
  startColumn: number
  endLineNumber: number
  endColumn: number
}

// 自定义Range类型，避免DOM依赖
export interface CodeRange {
  startLine: number
  startColumn: number
  endLine: number
  endColumn: number
}

// AI相关类型
export interface CodeChunk {
  id: string
  content: string
  type: 'function' | 'class' | 'module' | 'other'
  metadata: {
    fileName: string
    filePath: string
    startLine: number
    endLine: number
    symbols: string[]
    imports: string[]
    exports: string[]
    language: string
    lastModified?: number
  }
  embedding?: number[]
}

export interface SearchResult {
  id: string
  chunk: CodeChunk
  score: number
  highlights?: CodeRange[]
  content: string
  metadata: CodeChunk['metadata']
}

export interface CodeContext {
  currentFile: string
  cursorPosition: Position
  currentLine: string
  beforeText: string
  afterText: string
  selectedText?: string
  openFiles: string[]
  recentFiles: string[]
  language: string
  queryEmbedding?: number[]
}

export interface IndexingStatus {
  isIndexing: boolean
  progress: number
  totalFiles: number
  indexedFiles: number
  errors: Array<{
    file: string
    error: string
  }>
}

export interface AIStatus {
  isActive: boolean
  currentTask?: string
  lastActivity?: number
}

// UI相关类型
export interface ContextMenuItem {
  label: string
  icon?: any
  shortcut?: string
  disabled?: boolean
  separator?: boolean
  action?: () => void
  submenu?: ContextMenuItem[]
}

export interface Notification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message?: string
  duration?: number
}

// Store相关类型
export interface OpenFile {
  path: string
  scrollTop?: number
}

export interface AppState {
  // 文件系统状态
  fileTree: FileNode | null
  expandedPaths: Set<string>
  selectedPath: string | null
  
  // 编辑器状态
  tabs: EditorTab[]
  activeTabId: string | null
  editorContent: Map<string, string>
  cursorPosition: Map<string, Position>
  selections: Map<string, Selection>
  
  // AI状态
  indexingStatus: IndexingStatus
  searchResults: SearchResult[]
  aiPanelVisible: boolean
  aiStatus: AIStatus
  
  // UI状态
  theme: 'light' | 'dark'
  sidebarWidth: number
  aiPanelWidth: number
  notifications: Notification[]
  
  // Actions
  actions: {
    // 文件操作
    setFileTree: (tree: FileNode) => void
    togglePath: (path: string) => void
    selectFile: (path: string) => void
    createFile: (path: string, content?: string) => Promise<void>
    deleteFile: (path: string) => Promise<void>
    renameFile: (oldPath: string, newPath: string) => Promise<void>
    
    // 编辑器操作
    openFile: (path: string) => Promise<void>
    closeTab: (tabId: string) => void
    setActiveTab: (tabId: string) => void
    updateTabContent: (tabId: string, content: string) => void
    updateCursorPosition: (path: string, position: Position) => void
    
    // AI操作
    setIndexingStatus: (status: Partial<IndexingStatus>) => void
    setSearchResults: (results: SearchResult[]) => void
    toggleAIPanel: () => void
    triggerSearch: (query: string) => Promise<void>
    indexCodebase: () => Promise<void>
    
    // UI操作
    toggleTheme: () => void
    setSidebarWidth: (width: number) => void
    setAIPanelWidth: (width: number) => void
    addNotification: (notification: Omit<Notification, 'id'>) => void
    removeNotification: (id: string) => void
  }
}