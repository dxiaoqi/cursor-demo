import Parser from 'web-tree-sitter'
import { nanoid } from 'nanoid'
import type { CodeChunk, FileNode } from '../types'

type ParserType = typeof Parser
type SyntaxNode = any // tree-sitter类型定义问题的临时解决方案

export class CodeIndexService {
  private parser: any = null
  private languages: Map<string, any> = new Map()
  private chunks: Map<string, CodeChunk> = new Map()
  
  async initialize() {
    try {
      // @ts-ignore
      await Parser.init({
        locateFile(scriptName: string, scriptDirectory: string) {
          return `https://unpkg.com/web-tree-sitter@0.20.8/${scriptName}`
        },
      })
      // @ts-ignore
      this.parser = new Parser()
      
      // 加载语言
      await this.loadLanguage('javascript', 'https://unpkg.com/tree-sitter-javascript@0.20.1/tree-sitter-javascript.wasm')
      await this.loadLanguage('typescript', 'https://unpkg.com/tree-sitter-typescript@0.20.3/tree-sitter-typescript.wasm')
    } catch (error) {
      console.error('Failed to initialize parser:', error)
    }
  }
  
  private async loadLanguage(name: string, wasmUrl: string) {
    try {
      // @ts-ignore
      const language = await Parser.Language.load(wasmUrl)
      this.languages.set(name, language)
    } catch (error) {
      console.error(`Failed to load ${name} language:`, error)
    }
  }
  
  async indexFile(path: string, content: string, language: string): Promise<CodeChunk[]> {
    if (!this.parser) {
      await this.initialize()
    }
    
    const lang = this.getLanguageFromString(language)
    const parserLanguage = this.languages.get(lang)
    
    if (!parserLanguage || !this.parser) {
      // 如果没有对应的parser，创建一个基础的chunk
      const chunk: CodeChunk = {
        id: nanoid(),
        content,
        type: 'module',
        metadata: {
          fileName: path.split('/').pop() || '',
          filePath: path,
          startLine: 1,
          endLine: content.split('\n').length,
          symbols: [],
          imports: [],
          exports: [],
          language,
          lastModified: Date.now(),
        },
      }
      this.chunks.set(chunk.id, chunk)
      return [chunk]
    }
    
    this.parser.setLanguage(parserLanguage)
    const tree = this.parser.parse(content)
    const chunks: CodeChunk[] = []
    
    // 提取函数
    const functions = this.extractFunctions(tree.rootNode, content, path, language)
    chunks.push(...functions)
    
    // 提取类
    const classes = this.extractClasses(tree.rootNode, content, path, language)
    chunks.push(...classes)
    
    // 如果没有提取到任何chunk，创建一个模块级别的chunk
    if (chunks.length === 0) {
      const moduleChunk: CodeChunk = {
        id: nanoid(),
        content,
        type: 'module',
        metadata: {
          fileName: path.split('/').pop() || '',
          filePath: path,
          startLine: 1,
          endLine: content.split('\n').length,
          symbols: [],
          imports: this.extractImports(tree.rootNode, content),
          exports: this.extractExports(tree.rootNode, content),
          language,
          lastModified: Date.now(),
        },
      }
      chunks.push(moduleChunk)
    }
    
    // 存储chunks
    chunks.forEach(chunk => {
      this.chunks.set(chunk.id, chunk)
    })
    
    return chunks
  }
  
  private extractFunctions(node: SyntaxNode, content: string, path: string, language: string): CodeChunk[] {
    const chunks: CodeChunk[] = []
    const lines = content.split('\n')
    
    const visit = (node: SyntaxNode) => {
      if (node.type === 'function_declaration' || 
          node.type === 'method_definition' ||
          node.type === 'arrow_function' ||
          node.type === 'function_expression') {
        
        const startLine = node.startPosition.row + 1
        const endLine = node.endPosition.row + 1
        const functionContent = lines.slice(startLine - 1, endLine).join('\n')
        
        // 获取函数名
        let functionName = 'anonymous'
        const nameNode = node.childForFieldName('name')
        if (nameNode) {
          functionName = content.substring(nameNode.startIndex, nameNode.endIndex)
        }
        
        const chunk: CodeChunk = {
          id: nanoid(),
          content: functionContent,
          type: 'function',
          metadata: {
            fileName: path.split('/').pop() || '',
            filePath: path,
            startLine,
            endLine,
            symbols: [functionName],
            imports: [],
            exports: [],
            language,
            lastModified: Date.now(),
          },
        }
        chunks.push(chunk)
      }
      
      // 递归访问子节点
      for (const child of node.children) {
        visit(child)
      }
    }
    
    visit(node)
    return chunks
  }
  
  private extractClasses(node: SyntaxNode, content: string, path: string, language: string): CodeChunk[] {
    const chunks: CodeChunk[] = []
    const lines = content.split('\n')
    
    const visit = (node: SyntaxNode) => {
      if (node.type === 'class_declaration') {
        const startLine = node.startPosition.row + 1
        const endLine = node.endPosition.row + 1
        const classContent = lines.slice(startLine - 1, endLine).join('\n')
        
        // 获取类名
        let className = 'anonymous'
        const nameNode = node.childForFieldName('name')
        if (nameNode) {
          className = content.substring(nameNode.startIndex, nameNode.endIndex)
        }
        
        const chunk: CodeChunk = {
          id: nanoid(),
          content: classContent,
          type: 'class',
          metadata: {
            fileName: path.split('/').pop() || '',
            filePath: path,
            startLine,
            endLine,
            symbols: [className],
            imports: [],
            exports: [],
            language,
            lastModified: Date.now(),
          },
        }
        chunks.push(chunk)
      }
      
      // 递归访问子节点
      for (const child of node.children) {
        visit(child)
      }
    }
    
    visit(node)
    return chunks
  }
  
  private extractImports(node: SyntaxNode, content: string): string[] {
    const imports: string[] = []
    
    const visit = (node: SyntaxNode) => {
      if (node.type === 'import_statement') {
        const importText = content.substring(node.startIndex, node.endIndex)
        imports.push(importText)
      }
      
      for (const child of node.children) {
        visit(child)
      }
    }
    
    visit(node)
    return imports
  }
  
  private extractExports(node: SyntaxNode, content: string): string[] {
    const exports: string[] = []
    
    const visit = (node: SyntaxNode) => {
      if (node.type === 'export_statement') {
        const exportText = content.substring(node.startIndex, node.endIndex)
        exports.push(exportText)
      }
      
      for (const child of node.children) {
        visit(child)
      }
    }
    
    visit(node)
    return exports
  }
  
  private getLanguageFromString(language: string): string {
    const languageMap: Record<string, string> = {
      javascript: 'javascript',
      typescript: 'typescript',
      tsx: 'typescript',
      jsx: 'javascript',
    }
    return languageMap[language] || language
  }
  
  async indexWorkspace(fileTree: FileNode): Promise<void> {
    const indexFile = async (node: FileNode) => {
      if (node.type === 'file' && node.language) {
        // 只索引支持的文件类型
        const supportedLanguages = ['javascript', 'typescript', 'jsx', 'tsx']
        if (supportedLanguages.includes(node.language)) {
          try {
            const response = await fetch(`/api/files?path=${encodeURIComponent(node.path)}`)
            const { content } = await response.json()
            await this.indexFile(node.path, content, node.language)
          } catch (error) {
            console.error(`Failed to index ${node.path}:`, error)
          }
        }
      } else if (node.type === 'directory' && node.children) {
        // 递归索引子目录
        for (const child of node.children) {
          await indexFile(child)
        }
      }
    }
    
    await indexFile(fileTree)
  }
  
  getChunks(): CodeChunk[] {
    return Array.from(this.chunks.values())
  }
  
  searchChunks(query: string): CodeChunk[] {
    const results: CodeChunk[] = []
    const queryLower = query.toLowerCase()
    
    for (const chunk of this.chunks.values()) {
      // 简单的文本搜索
      if (chunk.content.toLowerCase().includes(queryLower) ||
          chunk.metadata.fileName.toLowerCase().includes(queryLower) ||
          chunk.metadata.symbols.some(s => s.toLowerCase().includes(queryLower))) {
        results.push(chunk)
      }
    }
    
    return results
  }
  
  clearIndex() {
    this.chunks.clear()
  }
}

export const codeIndexService = new CodeIndexService()