'use client'

import { ChevronRight, ChevronDown, File, Folder, FolderOpen, Plus, MoreVertical } from 'lucide-react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import useAppStore from '@/lib/store'
import { cn } from '@/lib/utils'
import type { FileNode } from '@/lib/types'

export default function FileTree() {
  const { fileTree, expandedPaths, selectedPath, actions } = useAppStore()

  if (!fileTree) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        <p className="text-sm">Loading files...</p>
      </div>
    )
  }

  return (
    <div className="h-full overflow-auto scrollbar-thin">
      <div className="p-2">
        <div className="mb-2 flex items-center justify-between px-2 py-1">
          <span className="text-xs font-semibold text-muted-foreground">EXPLORER</span>
          <button
            className="rounded p-1 hover:bg-accent"
            onClick={() => {
              // TODO: 实现新建文件对话框
              console.log('Create new file')
            }}
            title="New File"
          >
            <Plus className="h-3 w-3" />
          </button>
        </div>
        {fileTree.children && fileTree.children.map(node => (
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

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  return (
    <>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <div
            className={cn(
              "flex items-center gap-1 rounded px-2 py-1 text-sm cursor-pointer group",
              "hover:bg-accent hover:text-accent-foreground",
              isSelected && "bg-accent text-accent-foreground"
            )}
            style={{ paddingLeft: `${level * 12 + 8}px` }}
            onClick={handleClick}
            onContextMenu={handleContextMenu}
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
            <span className="flex-1 truncate">{node.name}</span>
            <MoreVertical className="h-3 w-3 opacity-0 group-hover:opacity-100" />
          </div>
        </DropdownMenu.Trigger>
        
        <DropdownMenu.Portal>
          <DropdownMenu.Content 
            className="z-50 min-w-[160px] rounded-md border border-border bg-background p-1 shadow-md"
            sideOffset={5}
          >
            {node.type === 'directory' && (
              <>
                <DropdownMenu.Item
                  className="flex cursor-pointer items-center rounded px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground outline-none"
                  onClick={() => {
                    const fileName = prompt('Enter file name:')
                    if (fileName) {
                      actions.createFile(`${node.path}/${fileName}`)
                    }
                  }}
                >
                  New File
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  className="flex cursor-pointer items-center rounded px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground outline-none"
                  onClick={() => {
                    const folderName = prompt('Enter folder name:')
                    if (folderName) {
                      actions.createFile(`${node.path}/${folderName}`, '')
                    }
                  }}
                >
                  New Folder
                </DropdownMenu.Item>
                <DropdownMenu.Separator className="my-1 h-px bg-border" />
              </>
            )}
            
            <DropdownMenu.Item
              className="flex cursor-pointer items-center rounded px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground outline-none"
              onClick={() => {
                const newName = prompt('Enter new name:', node.name)
                if (newName && newName !== node.name) {
                  const newPath = node.path.replace(/\/[^\/]*$/, `/${newName}`)
                  actions.renameFile(node.path, newPath)
                }
              }}
            >
              Rename
            </DropdownMenu.Item>
            
            <DropdownMenu.Item
              className="flex cursor-pointer items-center rounded px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground outline-none text-destructive"
              onClick={() => {
                if (confirm(`Delete ${node.name}?`)) {
                  actions.deleteFile(node.path)
                }
              }}
            >
              Delete
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
      
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