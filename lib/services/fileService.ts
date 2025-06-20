import type { FileNode } from '../types'

class FileService {
  private baseUrl = '/api/files'

  async getFileTree(): Promise<FileNode> {
    const response = await fetch(this.baseUrl)
    if (!response.ok) {
      throw new Error('Failed to fetch file tree')
    }
    const data = await response.json()
    return data.fileTree
  }

  async getFileContent(path: string): Promise<string> {
    const response = await fetch(`${this.baseUrl}?path=${encodeURIComponent(path)}`)
    if (!response.ok) {
      throw new Error('Failed to fetch file content')
    }
    const data = await response.json()
    return data.content
  }

  async createFile(path: string, content: string = ''): Promise<void> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        path,
        type: 'file',
        content,
      }),
    })
    if (!response.ok) {
      throw new Error('Failed to create file')
    }
  }

  async createDirectory(path: string): Promise<void> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        path,
        type: 'directory',
      }),
    })
    if (!response.ok) {
      throw new Error('Failed to create directory')
    }
  }

  async updateFileContent(path: string, content: string): Promise<void> {
    const response = await fetch(this.baseUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        path,
        content,
      }),
    })
    if (!response.ok) {
      throw new Error('Failed to update file')
    }
  }

  async renameFile(oldPath: string, newPath: string): Promise<void> {
    const response = await fetch(this.baseUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        path: oldPath,
        newPath,
      }),
    })
    if (!response.ok) {
      throw new Error('Failed to rename file')
    }
  }

  async deleteFile(path: string): Promise<void> {
    const response = await fetch(this.baseUrl, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        path,
      }),
    })
    if (!response.ok) {
      throw new Error('Failed to delete file')
    }
  }
}

export const fileService = new FileService()