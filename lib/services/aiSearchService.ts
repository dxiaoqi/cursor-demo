import { codeIndexService } from './codeIndexService'
import { embeddingService } from './embeddingService'
import type { FileNode, SearchResult, CodeContext, Position } from '../types'

export class AISearchService {
  private isInitialized = false
  private indexingProgress = 0
  private totalFiles = 0
  private indexedFiles = 0
  
  async initialize() {
    if (this.isInitialized) return
    
    await codeIndexService.initialize()
    this.isInitialized = true
  }
  
  async indexWorkspace(
    fileTree: FileNode, 
    onProgress?: (progress: number, indexedFiles: number, totalFiles: number) => void
  ): Promise<void> {
    await this.initialize()
    
    // 计算总文件数
    this.totalFiles = this.countFiles(fileTree)
    this.indexedFiles = 0
    this.indexingProgress = 0
    
    // 清空旧的索引
    codeIndexService.clearIndex()
    embeddingService.clearEmbeddings()
    
    // 索引文件树
    await this.indexFileTree(fileTree, onProgress)
    
    // 生成所有chunks的embeddings
    const chunks = codeIndexService.getChunks()
    await embeddingService.embedChunks(chunks)
    
    this.indexingProgress = 100
    if (onProgress) {
      onProgress(100, this.indexedFiles, this.totalFiles)
    }
  }
  
  private countFiles(node: FileNode): number {
    if (node.type === 'file') {
      const supportedLanguages = ['javascript', 'typescript', 'jsx', 'tsx']
      return node.language && supportedLanguages.includes(node.language) ? 1 : 0
    }
    
    let count = 0
    if (node.children) {
      for (const child of node.children) {
        count += this.countFiles(child)
      }
    }
    return count
  }
  
  private async indexFileTree(
    node: FileNode,
    onProgress?: (progress: number, indexedFiles: number, totalFiles: number) => void
  ): Promise<void> {
    if (node.type === 'file' && node.language) {
      const supportedLanguages = ['javascript', 'typescript', 'jsx', 'tsx']
      if (supportedLanguages.includes(node.language)) {
        try {
          const response = await fetch(`/api/files?path=${encodeURIComponent(node.path)}`)
          const { content } = await response.json()
          await codeIndexService.indexFile(node.path, content, node.language)
          
          this.indexedFiles++
          this.indexingProgress = Math.round((this.indexedFiles / this.totalFiles) * 100)
          
          if (onProgress) {
            onProgress(this.indexingProgress, this.indexedFiles, this.totalFiles)
          }
        } catch (error) {
          console.error(`Failed to index ${node.path}:`, error)
        }
      }
    } else if (node.type === 'directory' && node.children) {
      for (const child of node.children) {
        await this.indexFileTree(child, onProgress)
      }
    }
  }
  
  async search(query: string, context?: CodeContext): Promise<SearchResult[]> {
    const chunks = codeIndexService.getChunks()
    
    if (chunks.length === 0) {
      return []
    }
    
    // 组合多种搜索策略
    const results: SearchResult[] = []
    
    // 1. 语义搜索（向量相似度）
    const semanticResults = await embeddingService.searchSimilar(query, chunks, 20)
    
    // 2. 关键词搜索
    const keywordResults = codeIndexService.searchChunks(query)
    
    // 3. 上下文相关搜索（如果提供了上下文）
    let contextResults: SearchResult[] = []
    if (context) {
      contextResults = await this.searchWithContext(query, context, chunks)
    }
    
    // 合并结果并去重
    const resultMap = new Map<string, SearchResult>()
    
    // 添加语义搜索结果（权重最高）
    semanticResults.forEach(result => {
      resultMap.set(result.id, {
        ...result,
        score: result.score * 1.0, // 语义搜索权重
      })
    })
    
    // 添加关键词搜索结果
    keywordResults.forEach(chunk => {
      const existing = resultMap.get(chunk.id)
      if (existing) {
        existing.score = Math.max(existing.score, 0.8) // 如果同时匹配，取较高分
      } else {
        resultMap.set(chunk.id, {
          id: chunk.id,
          chunk,
          score: 0.8, // 关键词搜索权重
          content: chunk.content,
          metadata: chunk.metadata,
        })
      }
    })
    
    // 添加上下文搜索结果
    contextResults.forEach(result => {
      const existing = resultMap.get(result.id)
      if (existing) {
        existing.score = Math.min(1.0, existing.score + 0.2) // 上下文加成
      } else {
        resultMap.set(result.id, result)
      }
    })
    
    // 转换为数组并排序
    return Array.from(resultMap.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, 10) // 返回前10个结果
  }
  
  private async searchWithContext(
    query: string,
    context: CodeContext,
    chunks: any[]
  ): Promise<SearchResult[]> {
    const results: SearchResult[] = []
    
    // 优先搜索当前文件中的相关内容
    const currentFileChunks = chunks.filter(
      chunk => chunk.metadata.filePath === context.currentFile
    )
    
    // 搜索与当前光标位置接近的chunks
    currentFileChunks.forEach(chunk => {
      const distance = Math.abs(
        chunk.metadata.startLine - context.cursorPosition.lineNumber
      )
      
      // 距离越近，分数越高
      const proximityScore = 1 / (1 + distance / 10)
      
      results.push({
        id: chunk.id,
        chunk,
        score: proximityScore * 0.5, // 位置相关性权重
        content: chunk.content,
        metadata: chunk.metadata,
      })
    })
    
    return results
  }
  
  async getContextualSuggestions(context: CodeContext): Promise<SearchResult[]> {
    // 基于当前上下文生成智能建议
    const chunks = codeIndexService.getChunks()
    
    // 1. 查找相似的代码模式
    const query = context.currentLine.trim()
    if (!query) return []
    
    // 2. 搜索相关代码
    return this.search(query, context)
  }
  
  getIndexingStatus() {
    return {
      isInitialized: this.isInitialized,
      progress: this.indexingProgress,
      totalFiles: this.totalFiles,
      indexedFiles: this.indexedFiles,
      totalChunks: codeIndexService.getChunks().length,
    }
  }
}

export const aiSearchService = new AISearchService()