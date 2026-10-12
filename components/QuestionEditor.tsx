'use client'
import { useState } from 'react'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import FormControlLabel from '@mui/material/FormControlLabel'
import IconButton from '@mui/material/IconButton'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import Typography from '@mui/material/Typography'
import type { Question } from '@/lib/types'

type Kind = Question['kind']

export const KIND_LABEL: Record<Kind, string> = {
  choice: 'Choice',
  score: 'Score',
  predicate: 'Noul / predicate',
}

// 件数の上限は Jev のドキュメントによる（Choice は最大255、Score は2〜10段階。https://docs.typesafe.ai/api）
const MAX_CHOICES = 255
const MAX_LEVELS = 10
// 名前の形式はこのアプリの決まり（両 API のドキュメントに制約の記載はないが、JSON のキーとして扱いやすい形にそろえる）
const NAME_PATTERN = /^[A-Za-z][A-Za-z0-9_]*$/

type Row = { key: string; description: string }

/** 種類を切り替えても、名前・問い・選択肢（段階）の入力はできるだけ引き継ぐ */
type Draft = {
  kind: Kind
  name: string
  instructions: string
  image: boolean
  rows: Row[]
  whenTrue: string
  whenFalse: string
}

const emptyRows = (): Row[] => [
  { key: '', description: '' },
  { key: '', description: '' },
]

function toDraft(q: Question | null): Draft {
  if (!q) return { kind: 'choice', name: '', instructions: '', image: false, rows: emptyRows(), whenTrue: '', whenFalse: '' }
  const base = { name: q.name, instructions: q.instructions, image: !!q.image, whenTrue: '', whenFalse: '' }
  switch (q.kind) {
    case 'choice':
      return { ...base, kind: 'choice', rows: q.options.map((o) => ({ key: o.value, description: o.description })) }
    case 'score':
      return { ...base, kind: 'score', rows: q.levels.map((l) => ({ key: l.label, description: l.description })) }
    case 'predicate':
      return { ...base, kind: 'predicate', rows: emptyRows(), whenTrue: q.whenTrue ?? '', whenFalse: q.whenFalse ?? '' }
  }
}

function fromDraft(d: Draft): Question {
  const base = { name: d.name.trim(), instructions: d.instructions.trim(), ...(d.image ? { image: true } : {}) }
  const rows = d.rows.map((r) => ({ key: r.key.trim(), description: r.description.trim() }))
  switch (d.kind) {
    case 'choice':
      return { ...base, kind: 'choice', options: rows.map((r) => ({ value: r.key, description: r.description })) }
    case 'score':
      return { ...base, kind: 'score', levels: rows.map((r) => ({ label: r.key, description: r.description })) }
    case 'predicate':
      return {
        ...base,
        kind: 'predicate',
        ...(d.whenTrue.trim() ? { whenTrue: d.whenTrue.trim() } : {}),
        ...(d.whenFalse.trim() ? { whenFalse: d.whenFalse.trim() } : {}),
      }
  }
}

function validate(d: Draft, otherNames: string[]): string[] {
  const errors: string[] = []
  const name = d.name.trim()
  if (!name) errors.push('名前を入力してください')
  else if (!NAME_PATTERN.test(name)) errors.push('名前は英字で始め、英数字と _ だけにしてください（例：is_urgent）')
  else if (otherNames.includes(name)) errors.push(`名前「${name}」はすでに使われています`)
  if (!d.instructions.trim()) errors.push('問いを入力してください')
  if (d.kind === 'choice' || d.kind === 'score') {
    const keys = d.rows.map((r) => r.key.trim())
    const what = d.kind === 'choice' ? '選択肢の値' : '段階の名前'
    const max = d.kind === 'choice' ? MAX_CHOICES : MAX_LEVELS
    if (keys.length < 2) errors.push(`${what}は2つ以上必要です`)
    if (keys.length > max) errors.push(`${what}は${max}個までです`)
    if (keys.some((k) => !k)) errors.push(`空の${what}があります`)
    const filled = keys.filter(Boolean)
    if (d.kind === 'choice' && new Set(filled).size !== filled.length) errors.push('選択肢の値が重複しています')
  }
  return errors
}

type Props = {
  /** 編集する問い。null なら新規追加 */
  question: Question | null
  /** この問い以外の名前（重複チェック用） */
  otherNames: string[]
  onSave: (question: Question) => void
  onClose: () => void
}

/** 開くたびに key を変えてマウントし直す前提（初期値は question から作る） */
export function QuestionEditor({ question, otherNames, onSave, onClose }: Props) {
  const [draft, setDraft] = useState<Draft>(() => toDraft(question))
  const [touched, setTouched] = useState(false)
  const errors = validate(draft, otherNames)
  const set = (patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch }))
  const setRow = (i: number, patch: Partial<Row>) =>
    setDraft((d) => ({ ...d, rows: d.rows.map((r, j) => (j === i ? { ...r, ...patch } : r)) }))

  const save = () => {
    setTouched(true)
    if (errors.length === 0) onSave(fromDraft(draft))
  }

  const rowsLabel =
    draft.kind === 'choice'
      ? { title: '選択肢', key: '値（例：faq）', add: '＋ 選択肢を追加' }
      : { title: '段階（低い → 高いの順）', key: '段階の名前（例：穏やか）', add: '＋ 段階を追加' }

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>{question ? `問いを編集：${question.name}` : '問いを追加'}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2.5}>
          <ToggleButtonGroup
            exclusive
            size="small"
            value={draft.kind}
            onChange={(_, v: Kind | null) => v && set({ kind: v })}
          >
            {(Object.keys(KIND_LABEL) as Kind[]).map((k) => (
              <ToggleButton key={k} value={k} sx={{ textTransform: 'none', px: 2 }}>
                {KIND_LABEL[k]}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>

          <TextField
            label="名前"
            value={draft.name}
            onChange={(e) => set({ name: e.target.value })}
            helperText="答えを見分けるための名前（Jev の questions のキー／Decisions API の name）"
            slotProps={{ htmlInput: { spellCheck: false, style: { fontFamily: 'monospace' } } }}
          />
          <TextField
            label="問い（instructions）"
            multiline
            minRows={2}
            value={draft.instructions}
            onChange={(e) => set({ instructions: e.target.value })}
          />

          {draft.kind === 'predicate' ? (
            <Stack spacing={2}>
              <TextField
                label="「はい」とする条件（任意）"
                value={draft.whenTrue}
                onChange={(e) => set({ whenTrue: e.target.value })}
              />
              <TextField
                label="「いいえ」とする条件（任意）"
                value={draft.whenFalse}
                onChange={(e) => set({ whenFalse: e.target.value })}
                helperText="Jev には criteria の true／false として、Decisions API には補足欄がないため問いの後ろに付けて送ります"
              />
            </Stack>
          ) : (
            <Stack spacing={1.5}>
              <Typography variant="subtitle2">{rowsLabel.title}</Typography>
              {draft.rows.map((r, i) => (
                <Stack key={i} direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                  {draft.kind === 'score' && (
                    <Typography sx={{ width: 20, fontFamily: 'monospace' }} color="text.secondary">
                      {i}
                    </Typography>
                  )}
                  <TextField
                    size="small"
                    label={rowsLabel.key}
                    value={r.key}
                    onChange={(e) => setRow(i, { key: e.target.value })}
                    sx={{ width: 220, flexShrink: 0 }}
                    slotProps={{ htmlInput: { spellCheck: false } }}
                  />
                  <TextField
                    size="small"
                    label="説明（任意）"
                    value={r.description}
                    onChange={(e) => setRow(i, { description: e.target.value })}
                    sx={{ flex: 1 }}
                  />
                  <IconButton
                    aria-label="この行を削除"
                    onClick={() => set({ rows: draft.rows.filter((_, j) => j !== i) })}
                    disabled={draft.rows.length <= 2}
                  >
                    ✕
                  </IconButton>
                </Stack>
              ))}
              <Stack direction="row" spacing={1}>
                <Button size="small" onClick={() => set({ rows: [...draft.rows, { key: '', description: '' }] })}>
                  {rowsLabel.add}
                </Button>
                {draft.kind === 'score' && draft.rows.length > 1 && (
                  <Button size="small" onClick={() => set({ rows: [...draft.rows].reverse() })}>
                    順番を逆にする
                  </Button>
                )}
              </Stack>
            </Stack>
          )}

          <FormControlLabel
            control={<Checkbox checked={draft.image} onChange={(e) => set({ image: e.target.checked })} />}
            label="画像の問い（画像を添付したときだけ判定。Jev は画像非対応）"
          />

          {touched && errors.length > 0 && (
            <Alert severity="error">
              {errors.map((e) => (
                <div key={e}>{e}</div>
              ))}
            </Alert>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>キャンセル</Button>
        <Button variant="contained" onClick={save} disabled={touched && errors.length > 0}>
          {question ? '保存' : '追加'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
