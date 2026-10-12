'use client'
import Accordion from '@mui/material/Accordion'
import AccordionDetails from '@mui/material/AccordionDetails'
import AccordionSummary from '@mui/material/AccordionSummary'
import Chip from '@mui/material/Chip'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { SAMPLE_GROUPS, type SampleGroup } from '@/lib/samples'

type Props = {
  /** サンプルを押したとき。State とそのグループの Questions を受け取る */
  onPick: (text: string, group: SampleGroup) => void
}

// サンプル一覧（最初は畳んだ状態）。同じ Questions を使うサンプルをグループにまとめる
export function SampleList({ onPick }: Props) {
  return (
    <Accordion variant="outlined" disableGutters>
      <AccordionSummary expandIcon={<span aria-hidden>▾</span>}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          サンプル一覧
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ ml: 2, alignSelf: 'center' }}>
          押すと State（問い合わせ文）と Questions の両方が置き換わります
        </Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Stack spacing={1.5}>
          {SAMPLE_GROUPS.map((g) => (
            <Paper key={g.title} variant="outlined" sx={{ px: 2, py: 1.5 }}>
              <Typography variant="subtitle2">{g.title}</Typography>
              <Typography variant="caption" color="text.secondary" component="div">
                {g.description}
              </Typography>
              <Typography variant="caption" color="text.secondary" component="div" sx={{ mb: 1, fontFamily: 'monospace' }}>
                Questions：{g.questions.map((q) => q.name).join(', ')}
              </Typography>
              <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
                {g.samples.map((s) => (
                  <Chip key={s.text} label={s.text} title={s.note} onClick={() => onPick(s.text, g)} variant="outlined" />
                ))}
              </Stack>
            </Paper>
          ))}
        </Stack>
      </AccordionDetails>
    </Accordion>
  )
}
