'use client'

import { Moon, Sun, Bot, Menu } from 'lucide-react'
import useAppStore from '@/lib/store'
import { cn } from '@/lib/utils'

export default function TopBar() {
  const { theme, aiPanelVisible, actions } = useAppStore()

  return (
    <div className="flex h-12 items-center justify-between border-b border-border bg-background px-4">
      <div className="flex items-center gap-2">
        <Menu className="h-5 w-5 text-muted-foreground" />
        <h1 className="text-sm font-semibold">AI Code Editor</h1>
      </div>

      <div className="flex items-center gap-2">
        {/* AI面板切换 */}
        <button
          onClick={actions.toggleAIPanel}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-md transition-colors",
            "hover:bg-accent hover:text-accent-foreground",
            aiPanelVisible && "bg-accent text-accent-foreground"
          )}
          title="Toggle AI Panel"
        >
          <Bot className="h-4 w-4" />
        </button>

        {/* 主题切换 */}
        <button
          onClick={actions.toggleTheme}
          className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
          title="Toggle theme"
        >
          {theme === 'dark' ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  )
}