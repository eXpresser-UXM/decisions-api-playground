'use client'
import { createTheme } from '@mui/material/styles'

// 当日のネット環境に依存しないよう、Web フォントは読み込まず OS のフォントを使う
const theme = createTheme({
  colorSchemes: { light: true, dark: true },
  typography: {
    fontFamily: [
      'system-ui',
      '"Hiragino Sans"',
      '"Yu Gothic UI"',
      '"Noto Sans JP"',
      'Meiryo',
      'sans-serif',
    ].join(','),
  },
})

export default theme
