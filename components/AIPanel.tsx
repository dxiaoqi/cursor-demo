'use client'

import { useState, useRef, useEffect } from 'react'
import { Search, Sparkles, FileText, Code, RefreshCw } from 'lucide-react'
import useAppStore from '@/lib/store'
import { cn } from '@/lib/utils'
import { debounce } from '@/lib/utils'

export default function AIPanel() {
  const { searchResults, indexingStatus, aiStatus, actions } = useAppStore()
  const [searchQuery, setSearchQuery] = useState('')
  const searchInputRef = useRef<HTMLInputElement>(null)

  // 创建防抖搜索函数
  const debouncedSearch = useRef(
    debounce((query: string) => {
      if (query.trim()) {
        actions.triggerSearch(query)
      }
    }, 300)
  ).current

  useEffect(() => {
    // 当搜索查询变化时触发搜索
    debouncedSearch(searchQuery)
  }, [searchQuery, debouncedSearch])

  const handleReindex = () => {
    actions.indexCodebase()
  }

  return (
    <div className="flex h-full flex-col">
      {/* 标题栏 */}
      <div className="flex h-12 items-center justify-between border-b border-border px-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">AI Assistant</span>
        </div>
        <button
          onClick={handleReindex}
          className="rounded p-1 hover:bg-accent transition-colors"
          title="Reindex codebase"
          disabled={indexingStatus.isIndexing}
        >
          <RefreshCw className={cn(
            "h-4 w-4",
            indexingStatus.isIndexing && "animate-spin"
          )} />
        </button>
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
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search codebase..."
            className="w-full rounded-md border border-input bg-background px-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {aiStatus.isActive && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          )}
        </div>
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-auto scrollbar-thin p-4">
        {searchResults.length > 0 ? (
          <div className="space-y-3">
            <div className="mb-2 text-xs text-muted-foreground">
              Found {searchResults.length} results
            </div>
            {searchResults.map(result => (
              <SearchResultItem key={result.id} result={result} />
            ))}
          </div>
        ) : searchQuery.trim() ? (
          <div className="text-center text-sm text-muted-foreground">
            {aiStatus.isActive ? (
              <p>Searching...</p>
            ) : (
              <>
                <p>No results found</p>
                <p className="mt-2 text-xs">
                  Try different keywords or make sure the codebase is indexed
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="text-center text-sm text-muted-foreground">
            <p>Start typing to search your codebase</p>
            <p className="mt-2 text-xs">
              The AI will help you find relevant code snippets
            </p>
          </div>
        )}
      </div>

      {/* 底部信息 */}
      <div className="border-t border-border p-4">
        <div className="text-xs text-muted-foreground">
          {indexingStatus.totalFiles > 0 ? (
            <div className="flex items-center justify-between">
              <span>{indexingStatus.indexedFiles} files indexed</span>
              {aiStatus.lastActivity && (
                <span>
                  Last search: {new Date(aiStatus.lastActivity).toLocaleTimeString()}
                </span>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-yellow-500" />
              <span>No files indexed yet</span>
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

  const getRelevanceColor = (score: number) => {
    if (score > 0.8) return 'text-green-500'
    if (score > 0.6) return 'text-yellow-500'
    return 'text-muted-foreground'
  }

  return (
    <div 
      className="cursor-pointer rounded-md border border-border p-3 hover:bg-accent/50 transition-colors"
      onClick={() => actions.openFile(result.chunk.metadata.filePath)}
    >
      <div className="flex items-start gap-2">
        {getIcon()}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium truncate">
              {result.chunk.metadata.fileName}
            </span>
            <span className="text-xs text-muted-foreground">
              {result.chunk.type}
            </span>
          </div>
          <div className="text-xs text-muted-foreground">
            Lines {result.chunk.metadata.startLine}-{result.chunk.metadata.endLine}
          </div>
          <div className="mt-1">
            <pre className="text-xs text-muted-foreground line-clamp-3 whitespace-pre-wrap font-mono">
              {result.content.trim()}
            </pre>
          </div>
          {result.chunk.metadata.symbols.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
              {result.chunk.metadata.symbols.map((symbol, idx) => (
                <span 
                  key={idx}
                  className="rounded bg-secondary px-1.5 py-0.5 text-xs"
                >
                  {symbol}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className={cn("text-xs font-medium", getRelevanceColor(result.score))}>
          {(result.score * 100).toFixed(0)}%
        </div>
      </div>
    </div>
  )
}