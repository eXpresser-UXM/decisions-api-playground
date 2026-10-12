'use client'
import Alert from '@mui/material/Alert'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import type { EnvStatus } from '@/lib/apiClient'
import type { Keys } from '@/lib/types'

type Props = {
  keys: Keys
  /** .env にキーがあるか（キーの値はブラウザに来ないので、有無だけ） */
  envStatus: EnvStatus
  onChange: (keys: Keys) => void
}

/** 入力欄の下に出す、どのキーを使うかの説明 */
function keySource(typed: string, inEnv: boolean) {
  if (typed) return inEnv ? '画面で入力したキーを使用中（環境変数のキーより優先）' : '画面で入力したキーを使用中'
  return inEnv ? '環境変数（.env）のキーを使用中（ここに入力すると、画面の値を優先します）' : 'キー未設定'
}

// 画面で入力したキーは React の state（メモリ）にのみ保持する。localStorage・sessionStorage・Cookie には保存しない。
// .env のキーはサーバー側だけで使い、値はブラウザに送らない。
export function Settings({ keys, envStatus, onChange }: Props) {
  const fields = [
    { id: 'typesafe', label: 'TypeSafe APIキー（Jev）', env: 'TYPESAFE_API_KEY', inEnv: envStatus.typesafe },
    { id: 'openai', label: 'OpenAI APIキー（Decisions API）', env: 'OPENAI_API_KEY', inEnv: envStatus.openai },
  ] as const

  return (
    <Stack spacing={3} sx={{ maxWidth: 640 }}>
      <Typography variant="h5">APIキーの設定</Typography>
      <Alert severity="warning">
        入力したAPIキーは、このアプリのサーバーを経由して各社の API に送られます。
        キーを保存したり悪用したりすることはありませんが、
        <strong>使い終わったら、そのAPIキーはすぐに削除（無効化）してください。</strong>
        デモ専用のキーを作り、利用額の上限を設定しておくことをおすすめします。
      </Alert>
      <Alert severity="info">
        画面で入力したキーはこのページのメモリにのみ保持し、再読み込みで消えます。
        サーバーの環境変数（ローカルなら .env）にキーがあれば、それが初期値になります（画面で入力した値が優先）。
        環境変数のキーはサーバーの中だけで使い、ブラウザには送りません。
      </Alert>
      {fields.map((f) => (
        <TextField
          key={f.id}
          label={f.label}
          type="password"
          autoComplete="off"
          value={keys[f.id]}
          onChange={(e) => onChange({ ...keys, [f.id]: e.target.value.trim() })}
          placeholder={f.inEnv ? `環境変数（.env）の ${f.env} を使用中` : undefined}
          helperText={keySource(keys[f.id], f.inEnv)}
          slotProps={{ htmlInput: { spellCheck: false }, inputLabel: f.inEnv ? { shrink: true } : undefined }}
        />
      ))}
    </Stack>
  )
}
