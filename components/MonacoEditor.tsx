'use client'

import { useEffect, useRef } from 'react'
import Editor, { OnMount, OnChange } from '@monaco-editor/react'
import useAppStore from '@/lib/store'
import type { EditorTab, Position } from '@/lib/types'

interface MonacoEditorProps {
  tab: EditorTab
}

export default function MonacoEditor({ tab }: MonacoEditorProps) {
  const { theme, actions } = useAppStore()
  const editorRef = useRef<any>(null)

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor

    // 配置编辑器选项
    editor.updateOptions({
      fontSize: 14,
      fontFamily: "'Fira Code', Consolas, 'Courier New', monospace",
      fontLigatures: true,
      minimap: {
        enabled: true,
      },
      scrollBeyondLastLine: false,
      wordWrap: 'on',
      automaticLayout: true,
      formatOnPaste: true,
      formatOnType: true,
    })

    // 恢复视图状态
    if (tab.viewState) {
      editor.restoreViewState(tab.viewState)
    }

    // 监听光标位置变化
    editor.onDidChangeCursorPosition((e) => {
      const position: Position = {
        lineNumber: e.position.lineNumber,
        column: e.position.column,
      }
      actions.updateCursorPosition(tab.path, position)
    })

    // 保存视图状态
    editor.onDidChangeModel(() => {
      const viewState = editor.saveViewState()
      if (viewState) {
        // TODO: 更新tab的viewState
      }
    })

    // 配置TypeScript默认选项
    if (monaco) {
      monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
        target: monaco.languages.typescript.ScriptTarget.Latest,
        allowNonTsExtensions: true,
        moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
        module: monaco.languages.typescript.ModuleKind.CommonJS,
        noEmit: true,
        esModuleInterop: true,
        jsx: monaco.languages.typescript.JsxEmit.React,
        reactNamespace: 'React',
        allowJs: true,
        typeRoots: ['node_modules/@types'],
      })

      monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
        noSemanticValidation: false,
        noSyntaxValidation: false,
      })
    }
  }

  const handleChange: OnChange = (value, event) => {
    if (value !== undefined) {
      actions.updateTabContent(tab.id, value)
    }
  }

  // 自定义主题
  const monacoTheme = theme === 'dark' ? 'vs-dark' : 'vs'

  return (
    <div className="h-full w-full">
      <Editor
        height="100%"
        language={tab.language}
        value={tab.content}
        theme={monacoTheme}
        onChange={handleChange}
        onMount={handleEditorDidMount}
        options={{
          selectOnLineNumbers: true,
          roundedSelection: false,
          readOnly: false,
          cursorStyle: 'line',
          automaticLayout: true,
        }}
      />
    </div>
  )
}