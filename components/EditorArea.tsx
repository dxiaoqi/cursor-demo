'use client'

import { X } from 'lucide-react'
import dynamic from 'next/dynamic'
import useAppStore from '@/lib/store'
import { cn } from '@/lib/utils'

// 动态导入Monaco Editor以避免SSR问题
const MonacoEditor = dynamic(() => import('./MonacoEditor'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-muted-foreground">
      <p>Loading editor...</p>
    </div>
  ),
})

export default function EditorArea() {
  const { tabs, activeTabId, actions } = useAppStore()

  if (tabs.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        <div className="text-center">
          <p className="text-lg">No files open</p>
          <p className="text-sm">Open a file from the explorer to start editing</p>
        </div>
      </div>
    )
  }

  const activeTab = tabs.find(tab => tab.id === activeTabId)

  return (
    <div className="flex h-full flex-col">
      {/* 标签栏 */}
      <div className="flex h-10 items-end border-b border-border bg-background">
        <div className="flex overflow-x-auto scrollbar-thin">
          {tabs.map(tab => (
            <div
              key={tab.id}
              className={cn(
                "group flex h-9 items-center gap-2 border-r border-border px-3 cursor-pointer",
                "hover:bg-accent/50 transition-colors",
                activeTabId === tab.id && "bg-accent"
              )}
              onClick={() => actions.setActiveTab(tab.id)}
            >
              <span className="text-sm">{tab.title}</span>
              {tab.isDirty && (
                <div className="h-2 w-2 rounded-full bg-foreground/50" />
              )}
              <button
                className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation()
                  actions.closeTab(tab.id)
                }}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 编辑器内容区 */}
      <div className="flex-1 bg-background">
        {activeTab && <MonacoEditor tab={activeTab} />}
      </div>
    </div>
  )
}