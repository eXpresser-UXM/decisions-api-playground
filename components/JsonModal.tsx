'use client'
import { useState } from 'react'
import dynamic from 'next/dynamic'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import IconButton from '@mui/material/IconButton'
import Stack from '@mui/material/Stack'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import Typography from '@mui/material/Typography'

// モーダルを開いたときに初めて Monaco を読み込む
const JsonEditor = dynamic(() => import('./JsonEditor'), {
  ssr: false,
  loading: () => (
    <Typography color="text.secondary" sx={{ p: 2 }}>
      エディタを読み込み中…
    </Typography>
  ),
})

type Props = {
  open: boolean
  title: string
  request: unknown
  /** 成功時はレスポンス本体、エラー時はステータスコードを含むエラー本体 */
  response: unknown
  onClose: () => void
}

const DATA_URL_KEEP = 80

/** 表示用：長い data URL（base64 画像）の途中を省略する。コピーには使わない */
function abbreviateDataUrls(value: unknown): unknown {
  if (typeof value === 'string') {
    if (value.startsWith('data:') && value.length > DATA_URL_KEEP * 2) {
      return `${value.slice(0, DATA_URL_KEEP)}…（${value.length - DATA_URL_KEEP * 2}文字省略・コピーは全文）…${value.slice(-DATA_URL_KEEP)}`
    }
    return value
  }
  if (Array.isArray(value)) return value.map(abbreviateDataUrls)
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, abbreviateDataUrls(v)]))
  }
  return value
}

const pretty = (value: unknown) => JSON.stringify(value, null, 2) ?? ''

type TabId = 'request' | 'response'

export function JsonModal({ open, title, request, response, onClose }: Props) {
  const [tab, setTab] = useState<TabId>('request')
  const [copied, setCopied] = useState<TabId | null>(null)

  const value = tab === 'request' ? request : response

  const copy = async () => {
    // コピーは省略なしの全文（ボディのみ。APIキー・認証ヘッダーは含まれない）
    await navigator.clipboard.writeText(pretty(value))
    setCopied(tab)
    setTimeout(() => setCopied(null), 1500)
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg" slotProps={{ paper: { sx: { height: '85vh' } } }}>
      <DialogTitle sx={{ pr: 6 }}>
        {title}
        <IconButton aria-label="閉じる" onClick={onClose} sx={{ position: 'absolute', right: 8, top: 8 }}>
          ✕
        </IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 1, p: 0 }}>
        <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', px: 2 }}>
          <Tabs value={tab} onChange={(_, v: TabId) => setTab(v)}>
            <Tab value="request" label="リクエスト" />
            <Tab value="response" label="レスポンス" />
          </Tabs>
          <Button variant="outlined" size="small" onClick={copy} disabled={value === undefined}>
            {copied === tab ? 'コピーしました' : 'コピー'}
          </Button>
        </Stack>
        <Typography variant="caption" color="text.secondary" sx={{ px: 2 }}>
          本体（ボディ）のみ表示しています。APIキー・認証ヘッダーは含みません。
        </Typography>
        <Box sx={{ flex: 1, minHeight: 0, borderTop: 1, borderColor: 'divider' }}>
          {value === undefined ? (
            <Typography color="text.secondary" sx={{ p: 2 }}>
              まだレスポンスがありません。
            </Typography>
          ) : (
            <JsonEditor key={tab} value={pretty(abbreviateDataUrls(value))} readOnly />
          )}
        </Box>
      </DialogContent>
    </Dialog>
  )
}
