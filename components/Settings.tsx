'use client'
import Alert from '@mui/material/Alert'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import type { EnvStatus } from '@/lib/apiClient'
import type { Keys } from '@/lib/types'

type Props = {
  keys: Keys
  /** サーバーの設定（環境変数にキーがあるか・エンドポイント）。キーの値はブラウザに来ない */
  envStatus: EnvStatus
  onChange: (keys: Keys) => void
}

/** キー入力欄の下に出す、どのキーを使うかの説明 */
function keySource(typed: string, inEnv: boolean) {
  if (typed) return inEnv ? '画面で入力したキーを使用中（環境変数のキーより優先）' : '画面で入力したキーを使用中'
  return inEnv ? '環境変数（.env）のキーを使用中（ここに入力すると、画面の値を優先します）' : 'キー未設定'
}

// 画面で入力したキーは React の state（メモリ）にのみ保持する。localStorage・sessionStorage・Cookie には保存しない。
// 環境変数のキーはサーバー側だけで使い、値はブラウザに送らない。
export function Settings({ keys, envStatus, onChange }: Props) {
  const apis = [
    {
      id: 'typesafe',
      title: 'Jev（TypeSafe）',
      keyEnv: 'TYPESAFE_API_KEY',
      urlEnv: 'TYPESAFE_BASE_URL',
      inEnv: envStatus.typesafe,
    },
    {
      id: 'openai',
      title: 'Decisions API（OpenAI）',
      keyEnv: 'OPENAI_API_KEY',
      urlEnv: 'OPENAI_BASE_URL',
      inEnv: envStatus.openai,
    },
  ] as const

  return (
    <Stack spacing={3} sx={{ maxWidth: 720 }}>
      <Typography variant="h5">設定</Typography>
      <Alert severity="warning">
        入力したAPIキーは、このアプリのサーバーを経由して各社の API に送られます。
        キーを保存したり悪用したりすることはありませんが、
        <strong>使い終わったら、そのAPIキーはすぐに削除（無効化）してください。</strong>
        デモ専用のキーを作り、利用額の上限を設定しておくことをおすすめします。
      </Alert>
      <Alert severity="info">
        画面で入力した値はこのページのメモリにのみ保持し、再読み込みで消えます。
        サーバーの環境変数（ローカルなら .env）にキーがあれば、それが初期値になります（画面で入力した値が優先）。
        環境変数のキーはサーバーの中だけで使い、ブラウザには送りません。
        エンドポイントは環境変数でのみ設定でき、画面からは変更できません。
      </Alert>

      {apis.map((a) => {
        return (
          <Paper key={a.id} variant="outlined" sx={{ p: 2.5 }}>
            <Stack spacing={2.5}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                {a.title}
              </Typography>
              <TextField
                label="APIキー"
                type="password"
                autoComplete="off"
                value={keys[a.id]}
                onChange={(e) => onChange({ ...keys, [a.id]: e.target.value.trim() })}
                placeholder={a.inEnv ? `環境変数（.env）の ${a.keyEnv} を使用中` : undefined}
                helperText={keySource(keys[a.id], a.inEnv)}
                slotProps={{ htmlInput: { spellCheck: false }, inputLabel: a.inEnv ? { shrink: true } : undefined }}
              />
              {/* エンドポイントは環境変数でのみ設定する（画面で変えると、キーを別のサーバーへ送らせられるため） */}
              <TextField
                label="エンドポイント（読み取り専用）"
                value={envStatus.baseUrls[a.id] || '取得中…'}
                helperText={`環境変数 ${a.urlEnv} で変更できます（未設定なら各 SDK の既定値）`}
                slotProps={{ htmlInput: { readOnly: true, style: { fontFamily: 'monospace' } } }}
              />
            </Stack>
          </Paper>
        )
      })}
    </Stack>
  )
}
