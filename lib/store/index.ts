import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { devtools, persist } from 'zustand/middleware'
import type { AppState, FileNode, EditorTab, Position, IndexingStatus, SearchResult, Notification } from '../types'
import { generateId } from '../utils'

const useAppStore = create<AppState>()(
  devtools(
    persist(
      immer((set, get) => ({
        // 初始状态
        fileTree: null,
        expandedPaths: new Set<string>(),
        selectedPath: null,
        tabs: [],
        activeTabId: null,
        editorContent: new Map(),
        cursorPosition: new Map(),
        selections: new Map(),
        indexingStatus: {
          isIndexing: false,
          progress: 0,
          totalFiles: 0,
          indexedFiles: 0,
          errors: [],
        },
        searchResults: [],
        aiPanelVisible: false,
        aiStatus: {
          isActive: false,
        },
        theme: 'dark',
        sidebarWidth: 240,
        aiPanelWidth: 384,
        notifications: [],

        // Actions
        actions: {
          // 文件操作
          setFileTree: (tree: FileNode) => set((state) => {
            state.fileTree = tree
          }),

          togglePath: (path: string) => set((state) => {
            if (state.expandedPaths.has(path)) {
              state.expandedPaths.delete(path)
            } else {
              state.expandedPaths.add(path)
            }
          }),

          selectFile: (path: string) => set((state) => {
            state.selectedPath = path
          }),

          createFile: async (path: string, content: string = '') => {
            // TODO: 实现文件创建逻辑
            console.log('Creating file:', path)
          },

          deleteFile: async (path: string) => {
            // TODO: 实现文件删除逻辑
            console.log('Deleting file:', path)
          },

          renameFile: async (oldPath: string, newPath: string) => {
            // TODO: 实现文件重命名逻辑
            console.log('Renaming file:', oldPath, 'to', newPath)
          },

          // 编辑器操作
          openFile: async (path: string) => {
            const state = get()
            
            // 检查文件是否已经打开
            const existingTab = state.tabs.find(tab => tab.path === path)
            if (existingTab) {
              state.actions.setActiveTab(existingTab.id)
              return
            }

            // 创建新标签页
            const fileName = path.split('/').pop() || 'untitled'
            const language = getLanguageFromPath(path)
            
            const newTab: EditorTab = {
              id: generateId(),
              path,
              title: fileName,
              content: '', // TODO: 从文件系统读取内容
              language,
              isDirty: false,
            }

            set((state) => {
              state.tabs.push(newTab)
              state.activeTabId = newTab.id
              state.selectedPath = path
            })
          },

          closeTab: (tabId: string) => set((state) => {
            const index = state.tabs.findIndex(tab => tab.id === tabId)
            if (index === -1) return

            state.tabs.splice(index, 1)
            
            // 如果关闭的是当前标签，切换到其他标签
            if (state.activeTabId === tabId) {
              if (state.tabs.length > 0) {
                // 优先选择相邻的标签
                const newIndex = Math.min(index, state.tabs.length - 1)
                state.activeTabId = state.tabs[newIndex].id
              } else {
                state.activeTabId = null
              }
            }
          }),

          setActiveTab: (tabId: string) => set((state) => {
            state.activeTabId = tabId
            const tab = state.tabs.find(t => t.id === tabId)
            if (tab) {
              state.selectedPath = tab.path
            }
          }),

          updateTabContent: (tabId: string, content: string) => set((state) => {
            const tab = state.tabs.find(t => t.id === tabId)
            if (tab) {
              tab.content = content
              tab.isDirty = true
              state.editorContent.set(tab.path, content)
            }
          }),

          updateCursorPosition: (path: string, position: Position) => set((state) => {
            state.cursorPosition.set(path, position)
          }),

          // AI操作
          setIndexingStatus: (status: Partial<IndexingStatus>) => set((state) => {
            Object.assign(state.indexingStatus, status)
          }),

          setSearchResults: (results: SearchResult[]) => set((state) => {
            state.searchResults = results
          }),

          toggleAIPanel: () => set((state) => {
            state.aiPanelVisible = !state.aiPanelVisible
          }),

          triggerSearch: async (query: string) => {
            // TODO: 实现搜索逻辑
            console.log('Searching for:', query)
            set((state) => {
              state.aiStatus.isActive = true
              state.aiStatus.currentTask = 'Searching...'
            })
          },

          // UI操作
          toggleTheme: () => set((state) => {
            state.theme = state.theme === 'light' ? 'dark' : 'light'
            // 更新DOM
            if (typeof document !== 'undefined') {
              document.documentElement.classList.toggle('dark', state.theme === 'dark')
            }
          }),

          setSidebarWidth: (width: number) => set((state) => {
            state.sidebarWidth = width
          }),

          setAIPanelWidth: (width: number) => set((state) => {
            state.aiPanelWidth = width
          }),

          addNotification: (notification: Omit<Notification, 'id'>) => set((state) => {
            const newNotification: Notification = {
              ...notification,
              id: generateId(),
            }
            state.notifications.push(newNotification)

            // 自动移除通知
            if (notification.duration !== 0) {
              setTimeout(() => {
                get().actions.removeNotification(newNotification.id)
              }, notification.duration || 5000)
            }
          }),

          removeNotification: (id: string) => set((state) => {
            const index = state.notifications.findIndex(n => n.id === id)
            if (index !== -1) {
              state.notifications.splice(index, 1)
            }
          }),
        },
      })),
      {
        name: 'ai-code-editor-storage',
        partialize: (state) => ({
          theme: state.theme,
          sidebarWidth: state.sidebarWidth,
          aiPanelWidth: state.aiPanelWidth,
          expandedPaths: Array.from(state.expandedPaths),
        }),
        onRehydrateStorage: () => (state) => {
          if (state && state.expandedPaths) {
            state.expandedPaths = new Set(state.expandedPaths as any)
          }
        },
      }
    )
  )
)

// 辅助函数
function getLanguageFromPath(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase()
  const languageMap: Record<string, string> = {
    js: 'javascript',
    jsx: 'javascript',
    ts: 'typescript',
    tsx: 'typescript',
    md: 'markdown',
    json: 'json',
    css: 'css',
    html: 'html',
    py: 'python',
    java: 'java',
    cpp: 'cpp',
    c: 'c',
    go: 'go',
    rs: 'rust',
  }
  return languageMap[ext || ''] || 'plaintext'
}

export default useAppStore