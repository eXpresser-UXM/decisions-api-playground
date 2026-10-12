'use client'
import { useEffect, useState } from 'react'
import AppBar from '@mui/material/AppBar'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import Container from '@mui/material/Container'
import Link from '@mui/material/Link'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import TextField from '@mui/material/TextField'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import FactCheckIcon from '@mui/icons-material/FactCheck'
import SettingsIcon from '@mui/icons-material/Settings'
import HelpOutlineOutlinedIcon from '@mui/icons-material/HelpOutlineOutlined'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import { EMPTY_ENV_STATUS, fetchEnvStatus, runAll, type ApiJob, type EnvStatus } from '@/lib/apiClient'
import {
  buildDecisionsInput,
  buildDecisionsRequest,
  DECISIONS_PRICING,
  parseDecisionsResponse,
  parseDecisionsUsage,
  type DecisionsResponse,
} from '@/lib/decisions'
import {
  buildJevRequest,
  JEV_IMAGE_UNSUPPORTED,
  JEV_PRICING,
  parseJevResponse,
  parseJevUsage,
  type JevResponse,
} from '@/lib/jev'
import { DEFAULT_QUESTIONS } from '@/lib/questions'
import type { Answer, ApiId, ApiResult, Keys, Question } from '@/lib/types'
import { ImageAttach, type AttachedImage } from './ImageAttach'
import { QuestionList } from './QuestionList'
import { ResultPanel } from './ResultPanel'
import { SampleList } from './SampleList'
import { SectionTitle } from './SectionTitle'
import { Settings } from './Settings'

/** プレイグラウンドの使い方（GitHub 上の docs/usage.md） */
const USAGE_URL = 'https://github.com/eXpresser-UXM/decisions-api-playground/blob/main/docs/usage.md'

type Screen = 'judge' | 'settings'

const IDLE: Record<ApiId, ApiResult> = { jev: { state: 'idle' }, decisions: { state: 'idle' } }

export function Demo() {
  const [screen, setScreen] = useState<Screen>('settings')
  // APIキーはメモリ（state）にのみ保持する
  const [keys, setKeys] = useState<Keys>({ openai: '', typesafe: '' })
  // サーバーの設定（環境変数にキーがあるか・エンドポイント）。キーは画面で入力した値が優先
  const [envStatus, setEnvStatus] = useState<EnvStatus>(EMPTY_ENV_STATUS)
  useEffect(() => {
    void fetchEnvStatus().then((status) => {
      setEnvStatus(status)
      // 環境変数に両方のキーがあれば、設定しなくても判定できるので判定タブから始める
      if (status.openai && status.typesafe) setScreen((s) => (s === 'settings' ? 'judge' : s))
    })
  }, [])
  const [text, setText] = useState('')
  const [results, setResults] = useState<Record<ApiId, ApiResult>>(IDLE)
  const [running, setRunning] = useState(false)
  const [image, setImage] = useState<AttachedImage | null>(null)
  // Questions（画面で追加・編集・削除できる。メモリのみで、再読み込みで初期値に戻る）
  const [questions, setQuestions] = useState<Question[]>(DEFAULT_QUESTIONS)
  // 直前に判定した問い。問いや画像を変えても表示中の結果（行数・問いの説明）がずれないよう判定時に決める
  const [judgedQuestions, setJudgedQuestions] = useState<Question[]>([])

  // 画像の問いは画像を添付したときだけ判定する
  const askedQuestions = questions.filter((q) => !q.image || image)

  const judge = async () => {
    const allQuestions = askedQuestions
    // Jev には画像を送れないため、画像の問いを除いて送る
    const jevQuestions = allQuestions.filter((q) => !q.image)
    const jev: ApiJob<JevResponse> = {
      id: 'jev',
      apiKey: keys.typesafe,
      hasEnvKey: envStatus.typesafe,
      request: buildJevRequest(jevQuestions, text),
      parse: (res) => {
        const answers = parseJevResponse(jevQuestions, res)
        // 結果欄の行を Decisions API とそろえるため、画像の問いも同じ位置に「画像非対応」として並べる
        return allQuestions.map(
          (q): Answer =>
            q.image
              ? { kind: 'unsupported', name: q.name, reason: JEV_IMAGE_UNSUPPORTED }
              : answers.find((a) => a.name === q.name)!,
        )
      },
      model: (res) => res.model,
      usage: parseJevUsage,
      skipReason: jevQuestions.length === 0 ? `送れる問いがありません（${JEV_IMAGE_UNSUPPORTED}）` : undefined,
    }
    const decisions: ApiJob<DecisionsResponse> = {
      id: 'decisions',
      apiKey: keys.openai,
      hasEnvKey: envStatus.openai,
      request: buildDecisionsRequest(allQuestions, buildDecisionsInput(text, image?.dataUrl)),
      parse: (res) => parseDecisionsResponse(allQuestions, res),
      model: (res) => res.model,
      usage: parseDecisionsUsage,
    }
    setRunning(true)
    setJudgedQuestions(allQuestions)
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
          <Box sx={{ flex: 1 }} />
          {/* 使い方のページ（GitHub 上の docs/usage.md）を新しいタブで開く */}
          <Button
            variant="outlined"
            href={USAGE_URL}
            target="_blank"
            rel="noopener noreferrer"
            startIcon={<HelpOutlineOutlinedIcon />}
            endIcon={<OpenInNewIcon fontSize="small" />}
          >
            使い方
          </Button>
          <Tabs value={screen} onChange={(_, v: Screen) => setScreen(v)}>
            <Tab value="judge" label="判定" icon={<FactCheckIcon />} iconPosition="start" />
            <Tab value="settings" label="設定" icon={<SettingsIcon />} iconPosition="start" />
          </Tabs>
        </Toolbar>
      </AppBar>

      {/* 右下の固定表記と重ならないよう下側を広めに取る */}
      <Container maxWidth="xl" sx={{ pt: 4, pb: 6 }}>
        {screen === 'settings' ? (
          <Settings keys={keys} envStatus={envStatus} onChange={setKeys} onGoJudge={() => setScreen('judge')} />
        ) : (
          <Stack spacing={3}>
            <SampleList
              onPick={(sample, group) => {
                setText(sample)
                setQuestions(group.questions)
              }}
            />

            {/* 左：State（判定する文章＋画像）、右：Questions（問い） */}
            <Box
              sx={{
                display: 'grid',
                // minmax(0, 1fr)：1行で省略する長い文に列幅を押し広げられないようにする
                gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: 'repeat(2, minmax(0, 1fr))' },
                gap: 3,
                alignItems: 'stretch',
              }}
            >
              <Paper variant="outlined" sx={{ display: 'flex', flexDirection: 'column' }}>
                <SectionTitle>State（判定する文章）</SectionTitle>
                <Stack spacing={2} sx={{ p: 2, flex: 1 }}>
                  <TextField
                    multiline
                    minRows={6}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="判定したい文章を入力するか、「サンプル一覧を開く」から選んでください"
                    slotProps={{ htmlInput: { 'aria-label': '判定する文章（State）' } }}
                    sx={{ flex: 1, '& .MuiInputBase-root': { height: '100%', alignItems: 'flex-start' } }}
                  />
                  <ImageAttach image={image} onChange={setImage} />
                </Stack>
              </Paper>
              <QuestionList questions={questions} onChange={setQuestions} />
            </Box>

            <Stack direction="row" spacing={2} sx={{ alignItems: 'center', justifyContent: 'flex-end' }}>
              <Typography variant="body2" color="text.secondary">
                {!text.trim()
                  ? 'State（判定する文章）を入力してください'
                  : askedQuestions.length === 0
                  ? '判定する問いがありません。Questions に問いを追加してください'
                  : `${askedQuestions.length}問を判定します` +
                    (questions.length > askedQuestions.length
                      ? `（画像の問い${questions.length - askedQuestions.length}問は、画像を添付すると判定します）`
                      : '')}
              </Typography>
              <Button
                variant="contained"
                size="large"
                onClick={judge}
                disabled={running || !text.trim() || askedQuestions.length === 0}
                startIcon={<PlayArrowIcon />}
                sx={{ px: 5 }}
              >
                判定する
              </Button>
            </Stack>

            <Divider />

            {/* 2枚のカードが行を subgrid で共有し、ヘッダ・情報・各問いの高さを左右でそろえる */}
            <Box
              sx={{
                display: 'grid',
                // minmax(0, 1fr)：1行で省略する長い文に列幅を押し広げられないようにする
                gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: 'repeat(2, minmax(0, 1fr))' },
                columnGap: 3,
                rowGap: { xs: 3, md: 0 },
              }}
            >
              <ResultPanel
                title="Jev（TypeSafe）"
                result={results.jev}
                questions={judgedQuestions}
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
                questions={judgedQuestions}
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
          // 表記の上で下の画面を邪魔しないよう、クリックはリンクの部分だけ受け付ける
          pointerEvents: 'none',
        }}
      >
        Made by{' '}
        <Link
          href="https://uxm.jp"
          target="_blank"
          rel="noopener noreferrer"
          color="inherit"
          sx={{ pointerEvents: 'auto', fontWeight: 600 }}
        >
          Studio UXM
        </Link>{' '}
        · Built with Claude — use the source at your own risk
      </Typography>
    </Box>
  )
}

