'use client'

import { Search, Sparkles, FileText, Code } from 'lucide-react'
import useAppStore from '@/lib/store'
import { cn } from '@/lib/utils'

export default function AIPanel() {
  const { searchResults, indexingStatus, aiStatus } = useAppStore()

  return (
    <div className="flex h-full flex-col">
      {/* 标题栏 */}
      <div className="flex h-12 items-center justify-between border-b border-border px-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">AI Assistant</span>
        </div>
      </div>

      {/* 索引状态 */}
      {indexingStatus.isIndexing && (
        <div className="border-b border-border p-4">
          <div className="text-xs text-muted-foreground">
            Indexing codebase...
          </div>
          <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-secondary">
            <div 
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${indexingStatus.progress}%` }}
            />
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            {indexingStatus.indexedFiles} / {indexingStatus.totalFiles} files
          </div>
        </div>
      )}

      {/* 搜索框 */}
      <div className="border-b border-border p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search codebase..."
            className="w-full rounded-md border border-input bg-background px-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-auto scrollbar-thin p-4">
        {searchResults.length > 0 ? (
          <div className="space-y-3">
            {searchResults.map(result => (
              <SearchResultItem key={result.id} result={result} />
            ))}
          </div>
        ) : (
          <div className="text-center text-sm text-muted-foreground">
            <p>No search results</p>
            <p className="mt-2 text-xs">
              Start typing to search through your codebase
            </p>
          </div>
        )}
      </div>

      {/* 底部信息 */}
      <div className="border-t border-border p-4">
        <div className="text-xs text-muted-foreground">
          {aiStatus.isActive ? (
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
              <span>{aiStatus.currentTask || 'AI is active'}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-gray-500" />
              <span>AI is idle</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

interface SearchResultItemProps {
  result: any // TODO: Use proper SearchResult type
}

function SearchResultItem({ result }: SearchResultItemProps) {
  const { actions } = useAppStore()
  
  const getIcon = () => {
    switch (result.chunk.type) {
      case 'function':
        return <Code className="h-4 w-4 text-blue-500" />
      case 'class':
        return <FileText className="h-4 w-4 text-green-500" />
      default:
        return <FileText className="h-4 w-4 text-muted-foreground" />
    }
  }

  return (
    <div 
      className="cursor-pointer rounded-md border border-border p-3 hover:bg-accent/50 transition-colors"
      onClick={() => actions.openFile(result.chunk.metadata.filePath)}
    >
      <div className="flex items-start gap-2">
        {getIcon()}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate">
            {result.chunk.metadata.fileName}
          </div>
          <div className="text-xs text-muted-foreground">
            Lines {result.chunk.metadata.startLine}-{result.chunk.metadata.endLine}
          </div>
          <div className="mt-1 text-xs text-muted-foreground line-clamp-2">
            {result.content}
          </div>
        </div>
        <div className="text-xs text-muted-foreground">
          {(result.score * 100).toFixed(0)}%
        </div>
      </div>
    </div>
  )
}