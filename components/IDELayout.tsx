'use client'

import { useState } from 'react'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import FileTree from './FileTree'
import EditorArea from './EditorArea'
import AIPanel from './AIPanel'
import TopBar from './TopBar'
import useAppStore from '@/lib/store'
import { cn } from '@/lib/utils'

export default function IDELayout() {
  const { sidebarWidth, aiPanelWidth, aiPanelVisible, actions } = useAppStore()
  const [isResizing, setIsResizing] = useState(false)

  return (
    <div className="flex h-screen flex-col bg-background">
      <TopBar />
      
      <div className="flex-1 overflow-hidden">
        <PanelGroup direction="horizontal" className="h-full">
          {/* 左侧文件树 */}
          <Panel
            defaultSize={20}
            minSize={15}
            maxSize={40}
            onResize={(size) => actions.setSidebarWidth((size / 100) * window.innerWidth)}
          >
            <div className="h-full border-r border-border bg-secondary/50">
              <FileTree />
            </div>
          </Panel>

          <PanelResizeHandle 
            className={cn(
              "w-1 hover:bg-accent transition-colors",
              isResizing && "bg-accent"
            )}
            onDragging={setIsResizing}
          />

          {/* 中间编辑器区域 */}
          <Panel minSize={30}>
            <EditorArea />
          </Panel>

          {/* 右侧AI面板 */}
          {aiPanelVisible && (
            <>
              <PanelResizeHandle 
                className={cn(
                  "w-1 hover:bg-accent transition-colors",
                  isResizing && "bg-accent"
                )}
                onDragging={setIsResizing}
              />
              <Panel
                defaultSize={25}
                minSize={20}
                maxSize={50}
                onResize={(size) => actions.setAIPanelWidth((size / 100) * window.innerWidth)}
              >
                <div className="h-full border-l border-border bg-secondary/30">
                  <AIPanel />
                </div>
              </Panel>
            </>
          )}
        </PanelGroup>
      </div>
    </div>
  )
}