'use client'

import { X } from 'lucide-react'
import useAppStore from '@/lib/store'
import { cn } from '@/lib/utils'

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
      <div className="flex-1 bg-background p-4">
        <div className="h-full rounded border border-border bg-secondary/20 p-4">
          <p className="text-sm text-muted-foreground">
            Monaco Editor will be integrated here
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Active file: {tabs.find(t => t.id === activeTabId)?.path}
          </p>
        </div>
      </div>
    </div>
  )
}