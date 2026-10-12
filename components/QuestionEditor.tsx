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
import RadioButtonCheckedIcon from '@mui/icons-material/RadioButtonChecked'
import LinearScaleIcon from '@mui/icons-material/LinearScale'
import ThumbsUpDownIcon from '@mui/icons-material/ThumbsUpDown'
import DeleteForeverIcon from '@mui/icons-material/DeleteForever'
import AddIcon from '@mui/icons-material/Add'
import SwapVertIcon from '@mui/icons-material/SwapVert'
import CloseIcon from '@mui/icons-material/Close'
import SaveIcon from '@mui/icons-material/Save'
import { validateQuestion } from '@/lib/questionValidation'
import type { Question } from '@/lib/types'

type Kind = Question['kind']

/** 種類ごとのアイコン（Choice：1つを選ぶ、Score：段階、Noul：はい／いいえ） */
export const KIND_ICON: Record<Kind, React.ReactElement> = {
  choice: <RadioButtonCheckedIcon fontSize="small" />,
  score: <LinearScaleIcon fontSize="small" />,
  predicate: <ThumbsUpDownIcon fontSize="small" />,
}

export const KIND_LABEL: Record<Kind, string> = {
  choice: 'Choice',
  score: 'Score',
  predicate: 'Noul / predicate',
}

/** 種類ごとの説明（https://docs.typesafe.ai/primitives と Decisions API ガイドの定義をもとに日本語で） */
const KIND_DESCRIPTION: Record<Kind, { summary: string; detail: string; example: string }> = {
  choice: {
    summary: '用意した選択肢の中から、いちばん当てはまるものを1つ選びます。',
    detail: '答えは、選ばれた選択肢・選択肢ごとの確率・Confidence（どのくらい確信があるか）です。選択肢に順番がない分類に使います。',
    example: '例：問い合わせをどの担当に回すか、レビューの話題は何か',
  },
  score: {
    summary: '低い → 高いの順に並べた段階で、どのくらいかを評価します。',
    detail:
      '答えは、段階の番号（0から）を確率で重み付けした平均値（段階の間の値にもなります）・段階ごとの確率・Confidence です。程度や強さのように順番がある評価に使います。',
    example: '例：お客さんの怒りの度合い、緊急度、満足度',
  },
  predicate: {
    summary: '「はい／いいえ」で答えられる問いに、「はい」である確率（0〜1）を返します。',
    detail:
      'Jev では Noul、Decisions API では predicate と呼びます。「はい」「いいえ」とする条件を書くと、Jev には条件として、Decisions API には問いの補足として送ります。',
    example: '例：本人確認が必要か、急ぎの問い合わせか、秘密情報が書かれているか',
  },
}

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
  const errors = validateQuestion(fromDraft(draft), otherNames)
  const set = (patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch }))
  const setRow = (i: number, patch: Partial<Row>) =>
    setDraft((d) => ({ ...d, rows: d.rows.map((r, j) => (j === i ? { ...r, ...patch } : r)) }))

  const save = () => {
    setTouched(true)
    if (errors.length === 0) onSave(fromDraft(draft))
  }

  const rowsLabel =
    draft.kind === 'choice'
      ? { title: '選択肢', key: '値（例：faq）', add: '選択肢を追加' }
      : { title: '段階（低い → 高いの順）', key: '段階の名前（例：穏やか）', add: '段階を追加' }

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
              <ToggleButton key={k} value={k} sx={{ textTransform: 'none', px: 2, gap: 1 }}>
                {KIND_ICON[k]}
                {KIND_LABEL[k]}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>

          {/* 選んでいる種類が何をするものかの説明 */}
          <Alert severity="info" variant="outlined" icon={KIND_ICON[draft.kind]}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {KIND_LABEL[draft.kind]}：{KIND_DESCRIPTION[draft.kind].summary}
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5 }}>
              {KIND_DESCRIPTION[draft.kind].detail}
            </Typography>
            <Typography variant="caption" color="text.secondary" component="div" sx={{ mt: 0.5 }}>
              {KIND_DESCRIPTION[draft.kind].example}
            </Typography>
          </Alert>

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
                    color="error"
                    aria-label="この行を削除"
                    onClick={() => set({ rows: draft.rows.filter((_, j) => j !== i) })}
                    disabled={draft.rows.length <= 2}
                  >
                    <DeleteForeverIcon fontSize="small" />
                  </IconButton>
                </Stack>
              ))}
              <Stack direction="row" spacing={1}>
                <Button
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={() => set({ rows: [...draft.rows, { key: '', description: '' }] })}
                >
                  {rowsLabel.add}
                </Button>
                {draft.kind === 'score' && draft.rows.length > 1 && (
                  <Button size="small" startIcon={<SwapVertIcon />} onClick={() => set({ rows: [...draft.rows].reverse() })}>
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
        <Button startIcon={<CloseIcon />} onClick={onClose}>
          キャンセル
        </Button>
        <Button
          variant="contained"
          startIcon={question ? <SaveIcon /> : <AddIcon />}
          onClick={save}
          disabled={touched && errors.length > 0}
        >
          {question ? '保存' : '追加'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
