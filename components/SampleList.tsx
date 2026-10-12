'use client'
import { useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Drawer from '@mui/material/Drawer'
import IconButton from '@mui/material/IconButton'
import Link from '@mui/material/Link'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import MenuBookIcon from '@mui/icons-material/MenuBook'
import CloseIcon from '@mui/icons-material/Close'
import { SAMPLE_GROUPS, type SampleGroup } from '@/lib/samples'

type Props = {
  /** サンプルを押したとき。State とそのグループの Questions を受け取る */
  onPick: (text: string, group: SampleGroup) => void
}

const sampleCount = SAMPLE_GROUPS.reduce((n, g) => n + g.samples.length, 0)

// サンプル一覧。ボタンを押すと右から Drawer で開く（画面全体は覆わない幅）。
// 同じ Questions を使うサンプルをグループにまとめる
export function SampleList({ onPick }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
        <Button variant="outlined" startIcon={<MenuBookIcon />} onClick={() => setOpen(true)}>
          サンプル一覧を開く
        </Button>
        <Typography variant="body2" color="text.secondary">
          {SAMPLE_GROUPS.length}グループ・{sampleCount}件。選ぶと State（判定する文章）と Questions の両方が置き換わります
        </Typography>
      </Stack>

      <Drawer
        anchor="right"
        open={open}
        onClose={() => setOpen(false)}
        slotProps={{ paper: { sx: { width: 'min(720px, 92vw)' } } }}
      >
        <Stack
          direction="row"
          sx={{ alignItems: 'center', px: 2.5, py: 1.5, borderBottom: 1, borderColor: 'divider' }}
        >
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" component="h2">
              サンプル一覧
            </Typography>
            <Typography variant="caption" color="text.secondary">
              選ぶと State（判定する文章）と Questions の両方が置き換わります。文章は架空のもの、または各社ドキュメントの例です
            </Typography>
          </Box>
          <IconButton aria-label="閉じる" onClick={() => setOpen(false)}>
            <CloseIcon />
          </IconButton>
        </Stack>

        <Stack spacing={1.5} sx={{ p: 2.5, overflowY: 'auto' }}>
          {SAMPLE_GROUPS.map((g) => (
            <Paper key={g.title} variant="outlined" sx={{ px: 2, py: 1.5 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                {g.title}
              </Typography>
              <Typography variant="caption" color="text.secondary" component="div">
                {g.description}
              </Typography>
              {g.source && (
                <Typography variant="caption" component="div">
                  出典：
                  <Link href={g.source.url} target="_blank" rel="noopener noreferrer">
                    {g.source.label}
                  </Link>
                </Typography>
              )}
              <Typography variant="caption" color="text.secondary" component="div" sx={{ mb: 1, fontFamily: 'monospace' }}>
                Questions：{g.questions.map((q) => q.name).join(', ')}
              </Typography>
              <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
                {g.samples.map((s) => (
                  <Chip
                    key={s.text}
                    label={s.label ?? s.text}
                    title={s.note}
                    variant="outlined"
                    onClick={() => {
                      onPick(s.text, g)
                      setOpen(false)
                    }}
                    // 長い文も折り返して全文を見せる
                    sx={{ height: 'auto', py: 0.5, '& .MuiChip-label': { whiteSpace: 'normal' } }}
                  />
                ))}
              </Stack>
            </Paper>
          ))}
        </Stack>
      </Drawer>
    </>
  )
}
