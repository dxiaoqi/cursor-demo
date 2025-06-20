import type { CodeChunk, SearchResult } from '../types'

export class EmbeddingService {
  private embeddings: Map<string, number[]> = new Map()
  
  // 简单的余弦相似度计算
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0
    
    let dotProduct = 0
    let normA = 0
    let normB = 0
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i]
      normA += a[i] * a[i]
      normB += b[i] * b[i]
    }
    
    normA = Math.sqrt(normA)
    normB = Math.sqrt(normB)
    
    if (normA === 0 || normB === 0) return 0
    
    return dotProduct / (normA * normB)
  }
  
  // 生成文本的简单向量表示（用于演示，实际应使用OpenAI embeddings）
  private generateSimpleEmbedding(text: string): number[] {
    // 这是一个非常简单的向量化方法，仅用于演示
    // 实际应用中应该使用OpenAI的embedding API
    const words = text.toLowerCase().split(/\s+/)
    const vector = new Array(128).fill(0)
    
    // 简单的词频统计作为特征
    words.forEach((word, index) => {
      const hash = word.split('').reduce((acc, char) => {
        return ((acc << 5) - acc) + char.charCodeAt(0)
      }, 0)
      const idx = Math.abs(hash) % 128
      vector[idx] += 1
    })
    
    // 归一化
    const norm = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0))
    if (norm > 0) {
      for (let i = 0; i < vector.length; i++) {
        vector[i] /= norm
      }
    }
    
    return vector
  }
  
  async generateEmbedding(text: string): Promise<number[]> {
    // 在实际应用中，这里应该调用OpenAI的embedding API
    // 由于需要API密钥，这里使用简单的本地实现
    return this.generateSimpleEmbedding(text)
  }
  
  async embedChunk(chunk: CodeChunk): Promise<void> {
    // 生成chunk的文本表示
    const textRepresentation = [
      chunk.metadata.fileName,
      chunk.metadata.symbols.join(' '),
      chunk.content.slice(0, 500), // 只取前500个字符
    ].join('\n')
    
    const embedding = await this.generateEmbedding(textRepresentation)
    this.embeddings.set(chunk.id, embedding)
    chunk.embedding = embedding
  }
  
  async embedChunks(chunks: CodeChunk[]): Promise<void> {
    for (const chunk of chunks) {
      await this.embedChunk(chunk)
    }
  }
  
  async searchSimilar(query: string, chunks: CodeChunk[], topK: number = 10): Promise<SearchResult[]> {
    const queryEmbedding = await this.generateEmbedding(query)
    const results: SearchResult[] = []
    
    for (const chunk of chunks) {
      let embedding = this.embeddings.get(chunk.id)
      if (!embedding) {
        await this.embedChunk(chunk)
        embedding = this.embeddings.get(chunk.id)!
      }
      
      const similarity = this.cosineSimilarity(queryEmbedding, embedding)
      
      results.push({
        id: chunk.id,
        chunk,
        score: similarity,
        content: chunk.content,
        metadata: chunk.metadata,
      })
    }
    
    // 按相似度排序并返回前K个结果
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
  }
  
  clearEmbeddings() {
    this.embeddings.clear()
  }
}

export const embeddingService = new EmbeddingService()