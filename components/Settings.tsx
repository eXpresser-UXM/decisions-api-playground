'use client'
import Alert from '@mui/material/Alert'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import type { Keys } from '@/lib/types'

type Props = {
  keys: Keys
  onChange: (keys: Keys) => void
}

// キーは React の state（メモリ）にのみ保持する。localStorage・sessionStorage・Cookie には保存しない。
export function Settings({ keys, onChange }: Props) {
  return (
    <Stack spacing={3} sx={{ maxWidth: 640 }}>
      <Typography variant="h5">APIキーの設定</Typography>
      <Alert severity="info">
        キーはこのページのメモリにのみ保持し、再読み込みで消えます。保存はしません。
        判定のたびに、このPCで動いている開発サーバーを経由して各社の API にだけ送信します。
        デモ専用のキーを作り、利用額の上限を設定し、使用後は無効化してください。
      </Alert>
      <TextField
        label="TypeSafe APIキー（Jev）"
        type="password"
        autoComplete="off"
        value={keys.typesafe}
        onChange={(e) => onChange({ ...keys, typesafe: e.target.value.trim() })}
        helperText={keys.typesafe ? '入力済み' : 'キー未設定'}
        slotProps={{ htmlInput: { spellCheck: false } }}
      />
      <TextField
        label="OpenAI APIキー（Decisions API）"
        type="password"
        autoComplete="off"
        value={keys.openai}
        onChange={(e) => onChange({ ...keys, openai: e.target.value.trim() })}
        helperText={keys.openai ? '入力済み' : 'キー未設定'}
        slotProps={{ htmlInput: { spellCheck: false } }}
      />
    </Stack>
  )
}
