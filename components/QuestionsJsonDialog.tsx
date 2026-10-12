'use client'
import { useState } from 'react'
import dynamic from 'next/dynamic'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Typography from '@mui/material/Typography'
import { parseQuestionsJson } from '@/lib/questionValidation'
import type { Question } from '@/lib/types'

// 開いたときに初めて Monaco を読み込む
const JsonEditor = dynamic(() => import('./JsonEditor'), {
  ssr: false,
  loading: () => (
    <Typography color="text.secondary" sx={{ p: 2 }}>
      エディタを読み込み中…
    </Typography>
  ),
})

type Props = {
  questions: Question[]
  onApply: (questions: Question[]) => void
  onClose: () => void
}

/** Questions 全体を JSON（このアプリの共通形式）で編集する。開くたびにマウントし直す前提 */
export function QuestionsJsonDialog({ questions, onApply, onClose }: Props) {
  const [initial] = useState(() => JSON.stringify(questions, null, 2))
  const [text, setText] = useState(initial)
  const [errors, setErrors] = useState<string[]>([])
  const [copied, setCopied] = useState(false)

  const apply = () => {
    const result = parseQuestionsJson(text)
    if ('errors' in result) {
      setErrors(result.errors)
      return
    }
    onApply(result.questions)
  }

  const copy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="lg" slotProps={{ paper: { sx: { height: '85vh' } } }}>
      <DialogTitle>Questions を JSON で編集</DialogTitle>
      <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 1, p: 0 }}>
        <Typography variant="caption" color="text.secondary" sx={{ px: 2, pt: 1 }}>
          このアプリの共通形式です。kind は choice・score・predicate（Jev の Noul）のどれか。画像の問いには
          &quot;image&quot;: true を付けます。「適用」で一覧に反映し、各 API の形式には判定時に変換します。
        </Typography>
        <Box sx={{ flex: 1, minHeight: 0, borderTop: 1, borderColor: 'divider' }}>
          <JsonEditor
            value={initial}
            readOnly={false}
            onChange={(v) => {
              setText(v)
              setErrors([])
            }}
          />
        </Box>
        {errors.length > 0 && (
          <Alert severity="error" sx={{ mx: 2, mb: 1, maxHeight: 160, overflowY: 'auto' }}>
            {errors.map((e) => (
              <div key={e}>{e}</div>
            ))}
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={copy} sx={{ mr: 'auto' }}>
          {copied ? 'コピーしました' : 'コピー'}
        </Button>
        <Button onClick={onClose}>キャンセル</Button>
        <Button variant="contained" onClick={apply} disabled={errors.length > 0}>
          適用
        </Button>
      </DialogActions>
    </Dialog>
  )
}
