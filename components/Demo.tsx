'use client'
import { useState } from 'react'
import AppBar from '@mui/material/AppBar'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Container from '@mui/material/Container'
import Grid from '@mui/material/Grid'
import Stack from '@mui/material/Stack'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import TextField from '@mui/material/TextField'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import { runAll, type ApiJob } from '@/lib/apiClient'
import { buildDecisionsRequest, parseDecisionsResponse, type DecisionsResponse } from '@/lib/decisions'
import { buildJevRequest, parseJevResponse, type JevResponse } from '@/lib/jev'
import { SAMPLE_INQUIRIES, TEXT_QUESTIONS } from '@/lib/questions'
import type { ApiId, ApiResult, Keys } from '@/lib/types'
import { ResultPanel } from './ResultPanel'
import { Settings } from './Settings'

type Screen = 'judge' | 'settings'

const IDLE: Record<ApiId, ApiResult> = { jev: { state: 'idle' }, decisions: { state: 'idle' } }

export function Demo() {
  const [screen, setScreen] = useState<Screen>('settings')
  // APIキーはメモリ（state）にのみ保持する
  const [keys, setKeys] = useState<Keys>({ openai: '', typesafe: '' })
  const [text, setText] = useState('')
  const [results, setResults] = useState<Record<ApiId, ApiResult>>(IDLE)
  const [running, setRunning] = useState(false)

  const judge = async () => {
    const questions = TEXT_QUESTIONS
    const jev: ApiJob<JevResponse> = {
      id: 'jev',
      apiKey: keys.typesafe,
      request: buildJevRequest(questions, text),
      parse: (res) => parseJevResponse(questions, res),
      model: (res) => res.model,
    }
    const decisions: ApiJob<DecisionsResponse> = {
      id: 'decisions',
      apiKey: keys.openai,
      request: buildDecisionsRequest(questions, text),
      parse: (res) => parseDecisionsResponse(questions, res),
      model: (res) => res.model,
    }
    setRunning(true)
    setResults(IDLE)
    await runAll([jev, decisions], (id, result) => setResults((prev) => ({ ...prev, [id]: result })))
    setRunning(false)
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="static" color="default" elevation={0} sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Toolbar sx={{ gap: 2 }}>
          <Typography variant="h6" component="h1" sx={{ fontWeight: 700 }}>
            ポチッとモール判定デモ
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ display: { xs: 'none', md: 'block' } }}>
            Jev × OpenAI Decisions API
          </Typography>
          <Box sx={{ flex: 1 }} />
          <Tabs value={screen} onChange={(_, v: Screen) => setScreen(v)}>
            <Tab value="judge" label="判定" />
            <Tab value="settings" label="設定" />
          </Tabs>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ py: 4 }}>
        {screen === 'settings' ? (
          <Settings keys={keys} onChange={setKeys} />
        ) : (
          <Stack spacing={3}>
            <Stack spacing={1.5}>
              <TextField
                label="問い合わせ文"
                multiline
                minRows={3}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="例：頼んだ本がまだ届かないんですけど！"
              />
              <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  サンプル：
                </Typography>
                {SAMPLE_INQUIRIES.map((s) => (
                  <Chip key={s.text} label={s.text} title={s.note} onClick={() => setText(s.text)} variant="outlined" />
                ))}
              </Stack>
              <Box>
                <Button variant="contained" size="large" onClick={judge} disabled={running || !text.trim()}>
                  判定する
                </Button>
              </Box>
            </Stack>

            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                <ResultPanel
                  title="Jev（TypeSafe）"
                  result={results.jev}
                  // https://docs.typesafe.ai/models#language-support
                  note="※ Jev の主な学習言語は英語で、日本語は精度が英語と同等ではないとされています（公式ドキュメントより）"
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <ResultPanel title="Decisions API（OpenAI）" result={results.decisions} />
              </Grid>
            </Grid>
          </Stack>
        )}
      </Container>
    </Box>
  )
}
