import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { devtools, persist } from 'zustand/middleware'
import type { AppState, FileNode, EditorTab, Position, IndexingStatus, SearchResult, Notification } from '../types'
import { generateId } from '../utils'
import { fileService } from '../services/fileService'

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
            try {
              await fileService.createFile(path, content)
              // 刷新文件树
              const tree = await fileService.getFileTree()
              get().actions.setFileTree(tree)
              get().actions.addNotification({
                type: 'success',
                title: 'File created',
                message: `Created ${path}`,
              })
            } catch (error) {
              get().actions.addNotification({
                type: 'error',
                title: 'Failed to create file',
                message: error instanceof Error ? error.message : 'Unknown error',
              })
            }
          },

          deleteFile: async (path: string) => {
            try {
              await fileService.deleteFile(path)
              // 关闭相关的标签页
              const state = get()
              const tabsToClose = state.tabs.filter(tab => tab.path.startsWith(path))
              tabsToClose.forEach(tab => state.actions.closeTab(tab.id))
              // 刷新文件树
              const tree = await fileService.getFileTree()
              state.actions.setFileTree(tree)
              state.actions.addNotification({
                type: 'success',
                title: 'File deleted',
                message: `Deleted ${path}`,
              })
            } catch (error) {
              get().actions.addNotification({
                type: 'error',
                title: 'Failed to delete file',
                message: error instanceof Error ? error.message : 'Unknown error',
              })
            }
          },

          renameFile: async (oldPath: string, newPath: string) => {
            try {
              await fileService.renameFile(oldPath, newPath)
              // 更新相关的标签页
              set((state) => {
                state.tabs.forEach(tab => {
                  if (tab.path === oldPath) {
                    tab.path = newPath
                    tab.title = newPath.split('/').pop() || 'untitled'
                  }
                })
              })
              // 刷新文件树
              const tree = await fileService.getFileTree()
              get().actions.setFileTree(tree)
              get().actions.addNotification({
                type: 'success',
                title: 'File renamed',
                message: `Renamed to ${newPath}`,
              })
            } catch (error) {
              get().actions.addNotification({
                type: 'error',
                title: 'Failed to rename file',
                message: error instanceof Error ? error.message : 'Unknown error',
              })
            }
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

            try {
              // 从文件系统读取内容
              const content = await fileService.getFileContent(path)
              
              // 创建新标签页
              const fileName = path.split('/').pop() || 'untitled'
              const language = getLanguageFromPath(path)
              
              const newTab: EditorTab = {
                id: generateId(),
                path,
                title: fileName,
                content,
                language,
                isDirty: false,
              }

              set((state) => {
                state.tabs.push(newTab)
                state.activeTabId = newTab.id
                state.selectedPath = path
                state.editorContent.set(path, content)
              })
            } catch (error) {
              state.actions.addNotification({
                type: 'error',
                title: 'Failed to open file',
                message: error instanceof Error ? error.message : 'Unknown error',
              })
            }
          },

          closeTab: (tabId: string) => set((state) => {
            const index = state.tabs.findIndex(tab => tab.id === tabId)
            if (index === -1) return

            const tab = state.tabs[index]
            // 清理相关状态
            state.editorContent.delete(tab.path)
            state.cursorPosition.delete(tab.path)
            state.selections.delete(tab.path)
            
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
              
              // 自动保存（可选）
              const autoSave = async () => {
                try {
                  await fileService.updateFileContent(tab.path, content)
                  set((state) => {
                    const t = state.tabs.find(t => t.id === tabId)
                    if (t) t.isDirty = false
                  })
                } catch (error) {
                  console.error('Auto-save failed:', error)
                }
              }
              
              // 延迟自动保存
              clearTimeout((window as any).autoSaveTimeout)
              ;(window as any).autoSaveTimeout = setTimeout(autoSave, 1000)
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

// 初始化：加载文件树
if (typeof window !== 'undefined') {
  fileService.getFileTree().then(tree => {
    useAppStore.getState().actions.setFileTree(tree)
  }).catch(error => {
    console.error('Failed to load file tree:', error)
  })
}

export default useAppStore