'use client'

import { ChevronRight, ChevronDown, File, Folder, FolderOpen } from 'lucide-react'
import useAppStore from '@/lib/store'
import { cn } from '@/lib/utils'
import type { FileNode } from '@/lib/types'

export default function FileTree() {
  const { fileTree, expandedPaths, selectedPath, actions } = useAppStore()

  // 临时的示例文件树数据
  const sampleFileTree: FileNode = {
    id: 'root',
    name: 'project',
    path: '/',
    type: 'directory',
    children: [
      {
        id: '1',
        name: 'src',
        path: '/src',
        type: 'directory',
        children: [
          {
            id: '2',
            name: 'index.ts',
            path: '/src/index.ts',
            type: 'file',
            language: 'typescript'
          },
          {
            id: '3',
            name: 'utils.ts',
            path: '/src/utils.ts',
            type: 'file',
            language: 'typescript'
          }
        ]
      },
      {
        id: '4',
        name: 'package.json',
        path: '/package.json',
        type: 'file',
        language: 'json'
      }
    ]
  }

  // 使用示例数据，如果没有真实数据
  const tree = fileTree || sampleFileTree

  return (
    <div className="h-full overflow-auto scrollbar-thin">
      <div className="p-2">
        <div className="mb-2 px-2 py-1 text-xs font-semibold text-muted-foreground">
          EXPLORER
        </div>
        {tree.children && tree.children.map(node => (
          <FileTreeNode
            key={node.id}
            node={node}
            level={0}
          />
        ))}
      </div>
    </div>
  )
}

interface FileTreeNodeProps {
  node: FileNode
  level: number
}

function FileTreeNode({ node, level }: FileTreeNodeProps) {
  const { expandedPaths, selectedPath, actions } = useAppStore()
  const isExpanded = expandedPaths.has(node.path)
  const isSelected = selectedPath === node.path

  const handleClick = () => {
    if (node.type === 'directory') {
      actions.togglePath(node.path)
    } else {
      actions.selectFile(node.path)
      actions.openFile(node.path)
    }
  }

  return (
    <>
      <div
        className={cn(
          "flex items-center gap-1 rounded px-2 py-1 text-sm cursor-pointer",
          "hover:bg-accent hover:text-accent-foreground",
          isSelected && "bg-accent text-accent-foreground"
        )}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
        onClick={handleClick}
      >
        {node.type === 'directory' ? (
          <>
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 shrink-0" />
            ) : (
              <ChevronRight className="h-4 w-4 shrink-0" />
            )}
            {isExpanded ? (
              <FolderOpen className="h-4 w-4 shrink-0 text-blue-500" />
            ) : (
              <Folder className="h-4 w-4 shrink-0 text-blue-500" />
            )}
          </>
        ) : (
          <>
            <div className="w-4" />
            <File className="h-4 w-4 shrink-0 text-muted-foreground" />
          </>
        )}
        <span className="truncate">{node.name}</span>
      </div>
      
      {node.type === 'directory' && isExpanded && node.children && (
        <>
          {node.children.map(child => (
            <FileTreeNode
              key={child.id}
              node={child}
              level={level + 1}
            />
          ))}
        </>
      )}
    </>
  )
}