'use client'
import type { ReactNode } from 'react'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

/** State・Questions の枠の見出し（2つの枠で高さと見た目をそろえる） */
export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <Stack
      direction="row"
      sx={{ alignItems: 'center', px: 2, py: 1.25, borderBottom: 1, borderColor: 'divider', minHeight: 56 }}
    >
      <Typography variant="h6" component="h2" sx={{ flex: 1, fontSize: '1.1rem', fontWeight: 600 }}>
        {children}
      </Typography>
      {action}
    </Stack>
  )
}
