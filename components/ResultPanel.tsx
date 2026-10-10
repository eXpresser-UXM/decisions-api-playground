'use client'
import { useState } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
import LinearProgress from '@mui/material/LinearProgress'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import type { Answer, ApiResult, Probability } from '@/lib/types'
import { JsonModal } from './JsonModal'

type Props = {
  title: string
  result: ApiResult
}

const pct = (p: number) => `${(p * 100).toFixed(1)}%`
const msText = (ms: number) => `${ms.toFixed(0)} ms`

function Bars({ items, highlight }: { items: Probability[]; highlight?: string }) {
  return (
    <Stack spacing={0.75}>
      {items.map((p) => {
        const top = p.key === highlight
        return (
          <Stack key={p.key} direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <Typography
              variant="body2"
              sx={{ width: 96, flexShrink: 0, fontWeight: top ? 700 : 400, fontFamily: 'monospace' }}
            >
              {p.label}
            </Typography>
            <LinearProgress
              variant="determinate"
              value={Math.max(0, Math.min(1, p.probability)) * 100}
              color={top ? 'primary' : 'inherit'}
              sx={{ flex: 1, height: 10, borderRadius: 5 }}
            />
            <Typography variant="body2" sx={{ width: 56, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
              {pct(p.probability)}
            </Typography>
          </Stack>
        )
      })}
    </Stack>
  )
}

function AnswerHead({ name, kind }: { name: string; kind: string }) {
  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1 }}>
      <Typography component="code" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
        {name}
      </Typography>
      <Chip size="small" label={kind} variant="outlined" />
    </Stack>
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

function AnswerView({ answer }: { answer: Answer }) {
  switch (answer.kind) {
    case 'choice':
      return (
        <Box>
          <AnswerHead name={answer.name} kind="Choice" />
          <Main value={answer.choice} sub={`Confidence ${answer.confidence.toFixed(3)}`} />
          <Bars items={answer.probabilities} highlight={answer.choice} />
        </Box>
      )
    case 'score': {
      const top = answer.probabilities.reduce((a, b) => (b.probability > a.probability ? b : a))
      return (
        <Box>
          <AnswerHead name={answer.name} kind="Score" />
          <Main value={answer.score.toFixed(2)} sub={`Confidence ${answer.confidence.toFixed(3)}`} />
          <Bars items={answer.probabilities} highlight={top.key} />
        </Box>
      )
    }
    case 'predicate':
      return (
        <Box>
          <AnswerHead name={answer.name} kind="Noul / predicate" />
          <Main value={pct(answer.probability)} sub="「はい」の確率" />
          <Bars items={[{ key: 'yes', label: 'はい', probability: answer.probability }]} />
        </Box>
      )
    case 'refusal':
      return (
        <Box>
          <AnswerHead name={answer.name} kind="refusal" />
          <Typography color="text.secondary">回答が返りませんでした（refusal）。</Typography>
        </Box>
      )
  }
}

export function ResultPanel({ title, result }: Props) {
  const [open, setOpen] = useState(false)
  const hasJson = result.state === 'ok' || result.state === 'error' || result.state === 'loading'

  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardHeader
        title={title}
        slotProps={{ title: { variant: 'h6' } }}
        action={
          hasJson && (
            <Button size="small" variant="outlined" onClick={() => setOpen(true)}>
              JSONを表示
            </Button>
          )
        }
      />
      <Divider />
      <CardContent>
        {result.state === 'idle' && <Typography color="text.secondary">「判定する」を押すと結果が出ます。</Typography>}
        {result.state === 'no-key' && <Alert severity="warning">キー未設定（呼び出していません）</Alert>}
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

        {result.state === 'ok' && (
          <Stack spacing={3}>
            <Stack direction="row" spacing={4} sx={{ flexWrap: 'wrap' }}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  応答時間（API）
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                  {msText(result.ms)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  ブラウザからの往復 {msText(result.roundTripMs)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  モデル（レスポンスの値）
                </Typography>
                <Typography sx={{ fontFamily: 'monospace', fontWeight: 600 }}>{result.model}</Typography>
              </Box>
            </Stack>
            {result.answers.map((a) => (
              <AnswerView key={a.name} answer={a} />
            ))}
          </Stack>
        )}
      </CardContent>

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
