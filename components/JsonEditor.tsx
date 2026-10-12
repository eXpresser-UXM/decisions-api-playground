'use client'
// Monaco Editor による JSON 表示。JsonModal から next/dynamic（ssr: false）で遅延読み込みされる。
// @monaco-editor/react は標準では CDN（cdn.jsdelivr.net）から本体を読み込むため、
// loader.config({ monaco }) で npm パッケージの monaco-editor を同梱して使う。
import Editor, { loader } from '@monaco-editor/react'
// editor.api だけを読み込むと、JSON 機能の遅延読み込み時にエディタ機能が後から登録され
// 「depends on UNKNOWN service」エラーになるため、エディタ全体を先に読み込む
import * as monaco from 'monaco-editor'

self.MonacoEnvironment = {
  getWorker(_workerId: string, label: string) {
    if (label === 'json') {
      return new Worker(new URL('monaco-editor/language/json/json.worker.js', import.meta.url), { type: 'module' })
    }
    return new Worker(new URL('monaco-editor/editor/editor.worker.js', import.meta.url), { type: 'module' })
  },
}
loader.config({ monaco })

type Props = {
  value: string
  readOnly: boolean
}

export default function JsonEditor({ value, readOnly }: Props) {
  const dark = window.matchMedia('(prefers-color-scheme: dark)').matches
  return (
    <Editor
      height="100%"
      language="json"
      value={value}
      theme={dark ? 'vs-dark' : 'light'}
      options={{
        readOnly,
        folding: true,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        wordWrap: 'on',
        fontSize: 13,
        automaticLayout: true,
      }}
    />
  )
}
