import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { FileNode } from '@/lib/types'

// 虚拟文件系统的根目录
const WORKSPACE_ROOT = path.join(process.cwd(), 'workspace')

// 确保工作区目录存在
async function ensureWorkspaceExists() {
  try {
    await fs.access(WORKSPACE_ROOT)
  } catch {
    await fs.mkdir(WORKSPACE_ROOT, { recursive: true })
    // 创建示例文件
    await createSampleFiles()
  }
}

async function createSampleFiles() {
  const files = [
    {
      path: 'src/index.ts',
      content: `// Welcome to AI Code Editor
console.log('Hello, World!')

function greet(name: string): string {
  return \`Hello, \${name}!\`
}

export { greet }
`
    },
    {
      path: 'src/utils.ts',
      content: `export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null
      func(...args)
    }
    
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}
`
    },
    {
      path: 'package.json',
      content: JSON.stringify({
        name: 'my-project',
        version: '1.0.0',
        description: 'A sample project',
        main: 'src/index.ts',
        scripts: {
          dev: 'ts-node src/index.ts',
          build: 'tsc'
        },
        dependencies: {},
        devDependencies: {
          'typescript': '^5.0.0',
          'ts-node': '^10.0.0'
        }
      }, null, 2)
    },
    {
      path: 'README.md',
      content: `# My Project

This is a sample project created in AI Code Editor.

## Features
- TypeScript support
- AI-powered code completion
- Intelligent code search

## Getting Started

\`\`\`bash
npm install
npm run dev
\`\`\`
`
    }
  ]

  for (const file of files) {
    const filePath = path.join(WORKSPACE_ROOT, file.path)
    await fs.mkdir(path.dirname(filePath), { recursive: true })
    await fs.writeFile(filePath, file.content, 'utf-8')
  }
}

// 递归构建文件树
async function buildFileTree(dirPath: string, relativePath: string = ''): Promise<FileNode> {
  const stats = await fs.stat(dirPath)
  const name = path.basename(dirPath)
  const fullPath = relativePath ? `/${relativePath}` : '/'
  
  if (stats.isDirectory()) {
    const entries = await fs.readdir(dirPath)
    const children = await Promise.all(
      entries
        .filter(entry => !entry.startsWith('.')) // 过滤隐藏文件
        .map(entry => 
          buildFileTree(
            path.join(dirPath, entry),
            relativePath ? `${relativePath}/${entry}` : entry
          )
        )
    )
    
    return {
      id: fullPath,
      name,
      path: fullPath,
      type: 'directory',
      children: children.sort((a, b) => {
        // 目录优先，然后按名称排序
        if (a.type === 'directory' && b.type === 'file') return -1
        if (a.type === 'file' && b.type === 'directory') return 1
        return a.name.localeCompare(b.name)
      })
    }
  } else {
    const ext = path.extname(name).slice(1)
    return {
      id: fullPath,
      name,
      path: fullPath,
      type: 'file',
      language: getLanguageFromExt(ext)
    }
  }
}

function getLanguageFromExt(ext: string): string {
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
  return languageMap[ext] || 'plaintext'
}

// GET /api/files - 获取文件树或文件内容
export async function GET(request: NextRequest) {
  await ensureWorkspaceExists()
  
  const searchParams = request.nextUrl.searchParams
  const filePath = searchParams.get('path')
  
  try {
    if (filePath) {
      // 获取文件内容
      const fullPath = path.join(WORKSPACE_ROOT, filePath.slice(1)) // 移除开头的 /
      const content = await fs.readFile(fullPath, 'utf-8')
      return NextResponse.json({ content })
    } else {
      // 获取文件树
      const fileTree = await buildFileTree(WORKSPACE_ROOT)
      fileTree.name = 'workspace' // 重命名根目录
      return NextResponse.json({ fileTree })
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'File operation failed' },
      { status: 500 }
    )
  }
}

// POST /api/files - 创建文件或目录
export async function POST(request: NextRequest) {
  await ensureWorkspaceExists()
  
  try {
    const { path: filePath, type, content = '' } = await request.json()
    const fullPath = path.join(WORKSPACE_ROOT, filePath.slice(1))
    
    if (type === 'directory') {
      await fs.mkdir(fullPath, { recursive: true })
    } else {
      await fs.mkdir(path.dirname(fullPath), { recursive: true })
      await fs.writeFile(fullPath, content, 'utf-8')
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create file' },
      { status: 500 }
    )
  }
}

// PUT /api/files - 更新文件内容或重命名
export async function PUT(request: NextRequest) {
  await ensureWorkspaceExists()
  
  try {
    const { path: filePath, content, newPath } = await request.json()
    const fullPath = path.join(WORKSPACE_ROOT, filePath.slice(1))
    
    if (newPath) {
      // 重命名
      const newFullPath = path.join(WORKSPACE_ROOT, newPath.slice(1))
      await fs.mkdir(path.dirname(newFullPath), { recursive: true })
      await fs.rename(fullPath, newFullPath)
    } else if (content !== undefined) {
      // 更新内容
      await fs.writeFile(fullPath, content, 'utf-8')
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update file' },
      { status: 500 }
    )
  }
}

// DELETE /api/files - 删除文件或目录
export async function DELETE(request: NextRequest) {
  await ensureWorkspaceExists()
  
  try {
    const { path: filePath } = await request.json()
    const fullPath = path.join(WORKSPACE_ROOT, filePath.slice(1))
    
    const stats = await fs.stat(fullPath)
    if (stats.isDirectory()) {
      await fs.rm(fullPath, { recursive: true })
    } else {
      await fs.unlink(fullPath)
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete file' },
      { status: 500 }
    )
  }
}