'use client'
import { useState, type ReactNode } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import LinearProgress from '@mui/material/LinearProgress'
import Link from '@mui/material/Link'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import DataObjectIcon from '@mui/icons-material/DataObject'
import type { Answer, ApiResult, Pricing, Probability, Question } from '@/lib/types'
import { JsonModal } from './JsonModal'

type Props = {
  title: string
  result: ApiResult
  /** タイトル下に小さく出す注意書き */
  note?: ReactNode
  /** 判定した問い（行をそろえるため、また問いや選択肢の説明を出すために使う） */
  questions: Question[]
  /** 推定課金額の単価と、その根拠の公式ドキュメント */
  pricing: Pricing
}

const pct = (p: number) => `${(p * 100).toFixed(1)}%`
const msText = (ms: number) => `${ms.toFixed(0)} ms`

type BarItem = Probability & { description?: string }

/** 1行1文字列で、はみ出たら「…」で省略する（全文はマウスを乗せると出る） */
function OneLine({ children, sx }: { children: string; sx?: object }) {
  return (
    <Typography variant="body2" color="text.secondary" noWrap title={children} sx={{ minWidth: 0, ...sx }}>
      {children}
    </Typography>
  )
}

// 選択肢がこれより多い Choice は、確率の高い順に上位だけを表示し、残りは「表示」ボタンで開く
const MANY_OPTIONS = 12
const TOP_OPTIONS = 10

function ChoiceBars({ items, highlight }: { items: BarItem[]; highlight?: string }) {
  const [showAll, setShowAll] = useState(false)
  if (items.length <= MANY_OPTIONS) return <Bars items={items} highlight={highlight} />
  const sorted = [...items].sort((a, b) => b.probability - a.probability)
  const shown = showAll ? sorted : sorted.slice(0, TOP_OPTIONS)
  return (
    <Stack spacing={1}>
      <Typography variant="caption" color="text.secondary">
        選択肢 {items.length} 件を確率の高い順に表示{showAll ? '' : `（上位 ${TOP_OPTIONS} 件）`}
      </Typography>
      <Bars items={shown} highlight={highlight} />
      <Box>
        <Button size="small" onClick={() => setShowAll((v) => !v)}>
          {showAll ? '上位だけを表示' : `残り ${items.length - TOP_OPTIONS} 件を表示`}
        </Button>
      </Box>
    </Stack>
  )
}

function Bars({ items, highlight }: { items: BarItem[]; highlight?: string }) {
  return (
    <Stack spacing={0.75}>
      {items.map((p) => {
        const top = p.key === highlight
        return (
          <Stack key={p.key} direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
            <Typography
              variant="body2"
              noWrap
              title={p.label}
              sx={{ width: 120, flexShrink: 0, fontWeight: top ? 700 : 400, fontFamily: 'monospace' }}
            >
              {p.label}
            </Typography>
            {/* グラフとパーセンテージは全体の半分程度に収め、残りに選択肢の説明を出す */}
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', width: '45%', flexShrink: 0 }}>
              <LinearProgress
                variant="determinate"
                value={Math.max(0, Math.min(1, p.probability)) * 100}
                color={top ? 'primary' : 'inherit'}
                sx={{ flex: 1, height: 10, borderRadius: 5 }}
              />
              <Typography variant="body2" sx={{ width: 52, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                {pct(p.probability)}
              </Typography>
            </Stack>
            <OneLine sx={{ flex: 1 }}>{p.description ?? ''}</OneLine>
          </Stack>
        )
      })}
    </Stack>
  )
}

function AnswerHead({ name, kind, question }: { name: string; kind: string; question?: Question }) {
  return (
    <Box sx={{ mb: 1 }}>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
        <Typography component="code" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
          {name}
        </Typography>
        <Chip size="small" label={kind} variant="outlined" />
      </Stack>
      {/* その問いが何を聞いているかを1行で出す */}
      {question && <OneLine sx={{ mt: 0.5 }}>{question.instructions}</OneLine>}
    </Box>
  )
}

function Main({ value, sub }: { value: string; sub: string }) {
  return (
    <Stack direction="row" spacing={2} sx={{ alignItems: 'baseline', mb: 1.5 }}>
      <Typography variant="h4" component="span" sx={{ fontWeight: 700 }}>
        {value}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {sub}
      </Typography>
    </Stack>
  )
}

/** 確率の各行に、問いの定義から選択肢（段階）の説明を付ける */
function withDescriptions(items: Probability[], q: Question | undefined): BarItem[] {
  if (q?.kind === 'choice') return items.map((p) => ({ ...p, description: q.options.find((o) => o.value === p.key)?.description }))
  if (q?.kind === 'score') return items.map((p) => ({ ...p, description: q.levels[Number(p.key)]?.description }))
  return items
}

function AnswerView({ answer, question }: { answer: Answer; question?: Question }) {
  switch (answer.kind) {
    case 'choice':
      return (
        <Box>
          <AnswerHead name={answer.name} kind="Choice" question={question} />
          <Main value={answer.choice} sub={`Confidence ${answer.confidence.toFixed(3)}`} />
          <ChoiceBars items={withDescriptions(answer.probabilities, question)} highlight={answer.choice} />
        </Box>
      )
    case 'score': {
      const top = answer.probabilities.reduce((a, b) => (b.probability > a.probability ? b : a))
      return (
        <Box>
          <AnswerHead name={answer.name} kind="Score" question={question} />
          <Main
            value={answer.score.toFixed(2)}
            sub={`最も確率が高い段階：${top.label}（${top.key}）　Confidence ${answer.confidence.toFixed(3)}`}
          />
          <Bars
            items={withDescriptions(answer.probabilities, question).map((p) => ({ ...p, label: `${p.key}: ${p.label}` }))}
            highlight={top.key}
          />
        </Box>
      )
    }
    case 'predicate':
      return (
        <Box>
          <AnswerHead name={answer.name} kind="Noul / predicate" question={question} />
          <Main value={pct(answer.probability)} sub="「はい」の確率" />
          <Bars
            items={[
              {
                key: 'yes',
                label: 'はい',
                probability: answer.probability,
                description: question?.kind === 'predicate' ? question.whenTrue : undefined,
              },
            ]}
          />
        </Box>
      )
    case 'refusal':
      return (
        <Box>
          <AnswerHead name={answer.name} kind="refusal" question={question} />
          <Typography color="text.secondary">回答が返りませんでした（refusal）。</Typography>
        </Box>
      )
    case 'unsupported':
      return (
        <Box>
          <AnswerHead name={answer.name} kind="対象外" question={question} />
          <Alert severity="info" variant="outlined">
            {answer.reason}
          </Alert>
        </Box>
      )
  }
}

/** 左右のカードの行（ヘッダ・情報・各問い）をそろえるための行数 */
export const panelRows = (questionCount: number) => 2 + questionCount

const fmtTokens = (n: number | undefined) => (n === undefined ? '—' : n.toLocaleString())
// 1回あたりは非常に小さい額になるため、有効数字3桁で表示する
// 単価は公式ドキュメントの表記（$0.042、$0.10）に合わせて最低2桁で表示する
const fmtUnitPrice = (usd: number) => usd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })
const fmtUsd = (usd: number) => `$${usd === 0 ? '0' : usd.toPrecision(3)}`

function Stat({ label, children, sub }: { label: string; children: ReactNode; sub?: ReactNode }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      {children}
      {sub && (
        <Typography variant="caption" color="text.secondary" component="div">
          {sub}
        </Typography>
      )}
    </Box>
  )
}

export function ResultPanel({ title, result, note, questions, pricing }: Props) {
  const [open, setOpen] = useState(false)
  const hasJson = result.state === 'ok' || result.state === 'error' || result.state === 'loading'
  const rows = panelRows(questions.length)
  // 区切り線は各行の上に引く（CardContent ではなく行ごとに置くため）
  const rowSx = { px: 2, py: 2, borderTop: 1, borderColor: 'divider', minWidth: 0 }

  return (
    // 親（ResultGrid）の行を subgrid で共有し、左右のカードで各行の高さをそろえる
    <Card
      variant="outlined"
      sx={{ display: 'grid', gridTemplateRows: 'subgrid', gridRow: `span ${rows}`, rowGap: 0 }}
    >
      <CardHeader
        title={title}
        subheader={note}
        slotProps={{ title: { variant: 'h6' }, subheader: { variant: 'caption' } }}
        sx={{ alignItems: 'flex-start' }}
        action={
          hasJson && (
            <Button size="small" variant="outlined" startIcon={<DataObjectIcon />} onClick={() => setOpen(true)}>
              JSONを表示
            </Button>
          )
        }
      />

      {result.state === 'ok' ? (
        <>
          <Stack direction="row" spacing={4} useFlexGap sx={{ ...rowSx, flexWrap: 'wrap' }}>
            <Stat label="応答時間（API）" sub={`ブラウザからの往復 ${msText(result.roundTripMs)}`}>
              <Typography variant="h5" sx={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                {msText(result.ms)}
              </Typography>
            </Stat>
            <Stat label="トークン（レスポンスの usage）" sub={`出力 ${fmtTokens(result.usage.output)} Token`}>
              <Typography variant="h5" sx={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                入力 {fmtTokens(result.usage.input)} Token
              </Typography>
            </Stat>
            <Stat label="モデル（レスポンスの値）">
              <Typography sx={{ fontFamily: 'monospace', fontWeight: 600 }}>{result.model}</Typography>
            </Stat>
            <Stat
              label="推定課金額"
              sub={
                <>
                  ${fmtUnitPrice(pricing.usdPerMillionInputTokens)} / MTokenで推定。正確な金額は
                  <Link href={pricing.docUrl} target="_blank" rel="noopener noreferrer">
                    公式ドキュメント
                  </Link>
                  を確認してください
                </>
              }
            >
              <Typography variant="h5" sx={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                {result.usage.input === undefined
                  ? '—'
                  : fmtUsd((result.usage.input * pricing.usdPerMillionInputTokens) / 1_000_000)}
              </Typography>
            </Stat>
          </Stack>
          {result.answers.map((a) => (
            <Box key={a.name} sx={rowSx}>
              <AnswerView answer={a} question={questions.find((q) => q.name === a.name)} />
            </Box>
          ))}
        </>
      ) : (
        <Box sx={{ ...rowSx, gridRow: `span ${rows - 1}` }}>
          {result.state === 'idle' && <Typography color="text.secondary">「判定する」を押すと結果が出ます。</Typography>}
          {result.state === 'no-key' && <Alert severity="warning">キー未設定のため、呼び出していません。「設定」タブで APIキーを入力してください</Alert>}
          {result.state === 'unsupported' && <Alert severity="info">{result.reason}</Alert>}
          {result.state === 'loading' && (
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <CircularProgress size={20} />
              <Typography color="text.secondary">判定中…</Typography>
            </Stack>
          )}
          {result.state === 'error' && (
            <Alert severity="error">
              <Typography sx={{ fontWeight: 700 }}>
                エラー{result.error.status !== undefined && `（HTTP ${result.error.status}）`}
                {result.ms !== null && `　${msText(result.ms)}`}
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.5 }}>
                {result.error.message}
              </Typography>
              {result.error.body !== undefined && (
                <Box component="pre" sx={{ mt: 1, mb: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontSize: 12 }}>
                  {JSON.stringify(result.error.body, null, 2)}
                </Box>
              )}
            </Alert>
          )}
        </Box>
      )}

      {hasJson && (
        <JsonModal
          open={open}
          title={`${title}：リクエスト／レスポンス`}
          request={result.request}
          response={
            result.state === 'ok'
              ? result.response
              : result.state === 'error'
                ? { status: result.error.status ?? null, body: result.error.body ?? null, message: result.error.message }
                : undefined
          }
          onClose={() => setOpen(false)}
        />
      )}
    </Card>
  )
}
