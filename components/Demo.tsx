'use client'
import { useState } from 'react'
import AppBar from '@mui/material/AppBar'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Container from '@mui/material/Container'
import Link from '@mui/material/Link'
import Stack from '@mui/material/Stack'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import TextField from '@mui/material/TextField'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import { runAll, type ApiJob } from '@/lib/apiClient'
import {
  buildDecisionsRequest,
  DECISIONS_PRICING,
  parseDecisionsResponse,
  parseDecisionsUsage,
  type DecisionsResponse,
} from '@/lib/decisions'
import { buildJevRequest, JEV_PRICING, parseJevResponse, parseJevUsage, type JevResponse } from '@/lib/jev'
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
      usage: parseJevUsage,
    }
    const decisions: ApiJob<DecisionsResponse> = {
      id: 'decisions',
      apiKey: keys.openai,
      request: buildDecisionsRequest(questions, text),
      parse: (res) => parseDecisionsResponse(questions, res),
      model: (res) => res.model,
      usage: parseDecisionsUsage,
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
            Jev x OpenAI Decisions API Playground
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ display: { xs: 'none', md: 'block' } }}>
            題材：ポチッとモール（架空の本・雑誌ECサイト）
          </Typography>
          <Box sx={{ flex: 1 }} />
          <Tabs value={screen} onChange={(_, v: Screen) => setScreen(v)}>
            <Tab value="judge" label="判定" />
            <Tab value="settings" label="設定" />
          </Tabs>
        </Toolbar>
      </AppBar>

      {/* 右下の固定表記と重ならないよう下側を広めに取る */}
      <Container maxWidth="xl" sx={{ pt: 4, pb: 6 }}>
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

            {/* 2枚のカードが行を subgrid で共有し、ヘッダ・情報・各問いの高さを左右でそろえる */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                columnGap: 3,
                rowGap: { xs: 3, md: 0 },
              }}
            >
              <ResultPanel
                title="Jev（TypeSafe）"
                result={results.jev}
                questionCount={TEXT_QUESTIONS.length}
                pricing={JEV_PRICING}
                note={
                  <>
                    ※ Jev の主な学習言語は英語で、日本語は精度が英語と同等ではないとされています（
                    <Link href="https://docs.typesafe.ai/models#language-support" target="_blank" rel="noopener noreferrer">
                      公式ドキュメント
                    </Link>
                    より）
                  </>
                }
              />
              <ResultPanel
                title="Decisions API（OpenAI）"
                result={results.decisions}
                questionCount={TEXT_QUESTIONS.length}
                pricing={DECISIONS_PRICING}
              />
            </Box>
          </Stack>
        )}
      </Container>

      <Typography
        variant="caption"
        color="text.secondary"
        sx={{
          position: 'fixed',
          right: 12,
          bottom: 8,
          px: 1,
          py: 0.25,
          borderRadius: 1,
          bgcolor: 'background.paper',
          opacity: 0.85,
          pointerEvents: 'none',
        }}
      >
        Made by eXpresser · Built with Claude — use the source at your own risk
      </Typography>
    </Box>
  )
}
