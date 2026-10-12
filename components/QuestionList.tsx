'use client'
import { useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { DEFAULT_QUESTIONS } from '@/lib/questions'
import type { Question } from '@/lib/types'
import { KIND_LABEL, QuestionEditor } from './QuestionEditor'
import { QuestionsJsonDialog } from './QuestionsJsonDialog'
import { SectionTitle } from './SectionTitle'

type Props = {
  questions: Question[]
  onChange: (questions: Question[]) => void
}

/** 編集中の対象：既存の問いの位置、または新規追加 */
type Editing = { index: number } | { index: null } | null

function summary(q: Question) {
  switch (q.kind) {
    case 'choice':
      return q.options.map((o) => o.value).join(' / ')
    case 'score':
      return q.levels.map((l) => l.label).join(' → ')
    case 'predicate':
      return 'はい／いいえ'
  }
}

// Questions（Jev の questions／Decisions API の questions）の一覧。追加・編集・削除はメモリ上だけで行う
export function QuestionList({ questions, onChange }: Props) {
  const [editing, setEditing] = useState<Editing>(null)
  // ダイアログを開くたびに作り直して、前回の入力が残らないようにする
  const [editorKey, setEditorKey] = useState(0)
  const [jsonOpen, setJsonOpen] = useState(false)

  const open = (target: Editing) => {
    setEditorKey((k) => k + 1)
    setEditing(target)
  }
  const current = editing && editing.index !== null ? questions[editing.index] : null
  const otherNames = questions.filter((_, i) => !editing || i !== editing.index).map((q) => q.name)

  const save = (q: Question) => {
    if (!editing) return
    onChange(
      editing.index === null ? [...questions, q] : questions.map((old, i) => (i === editing.index ? q : old)),
    )
    setEditing(null)
  }

  return (
    <Paper variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <SectionTitle
        action={
          <>
            <Button size="small" onClick={() => onChange(DEFAULT_QUESTIONS)}>
              初期値に戻す
            </Button>
            <Button size="small" variant="contained" onClick={() => open({ index: null })} sx={{ ml: 1 }}>
              ＋ 追加
            </Button>
            <Button size="small" variant="outlined" onClick={() => setJsonOpen(true)} sx={{ ml: 1 }}>
              JSON
            </Button>
          </>
        }
      >
        Questions（回答形式）
        <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
          {questions.length}問
        </Typography>
      </SectionTitle>

      <Box sx={{ flex: 1, overflowY: 'auto', maxHeight: 480 }}>
        {questions.length === 0 && (
          <Typography color="text.secondary" variant="body2" sx={{ p: 2 }}>
            問いがありません。「＋ 追加」から追加してください。
          </Typography>
        )}
        {questions.map((q, i) => (
          <Stack
            key={q.name}
            direction="row"
            spacing={1}
            sx={{
              alignItems: 'center',
              px: 2,
              py: 1,
              cursor: 'pointer',
              '&:not(:last-of-type)': { borderBottom: 1, borderColor: 'divider' },
              '&:hover': { bgcolor: 'action.hover' },
            }}
            onClick={() => open({ index: i })}
          >
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
                <Typography component="code" sx={{ fontFamily: 'monospace', fontWeight: 600, fontSize: 14 }}>
                  {q.name}
                </Typography>
                <Chip size="small" variant="outlined" label={KIND_LABEL[q.kind]} />
                {q.image && <Chip size="small" color="info" variant="outlined" label="画像" />}
              </Stack>
              <Typography variant="caption" color="text.secondary" noWrap component="div">
                {q.instructions}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap component="div" sx={{ fontFamily: 'monospace' }}>
                {summary(q)}
              </Typography>
            </Box>
            <IconButton
              size="small"
              aria-label={`${q.name} を削除`}
              onClick={(e) => {
                e.stopPropagation()
                onChange(questions.filter((_, j) => j !== i))
              }}
            >
              ✕
            </IconButton>
          </Stack>
        ))}
      </Box>

      {jsonOpen && (
        <QuestionsJsonDialog
          questions={questions}
          onApply={(qs) => {
            onChange(qs)
            setJsonOpen(false)
          }}
          onClose={() => setJsonOpen(false)}
        />
      )}

      {editing && (
        <QuestionEditor
          key={editorKey}
          question={current}
          otherNames={otherNames}
          onSave={save}
          onClose={() => setEditing(null)}
        />
      )}
    </Paper>
  )
}
