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

type Props =
  | { value: string; readOnly: true }
  /** 編集できる場合は初期値だけ渡し、以降の内容は onChange で受け取る（毎回 value を戻すとカーソルが飛ぶため） */
  | { value: string; readOnly: false; onChange: (value: string) => void }

export default function JsonEditor(props: Props) {
  const dark = window.matchMedia('(prefers-color-scheme: dark)').matches
  return (
    <Editor
      height="100%"
      language="json"
      {...(props.readOnly
        ? { value: props.value }
        : { defaultValue: props.value, onChange: (v: string | undefined) => props.onChange(v ?? '') })}
      theme={dark ? 'vs-dark' : 'light'}
      options={{
        readOnly: props.readOnly,
        folding: true,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        wordWrap: 'on',
        // 全角の括弧などを「紛らわしい文字」として枠で囲む表示を止める（日本語では普通に使うため）
        unicodeHighlight: { ambiguousCharacters: false },
        fontSize: 13,
        automaticLayout: true,
      }}
    />
  )
}
