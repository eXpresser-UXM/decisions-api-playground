'use client'
import { useCallback, useEffect, useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

export type AttachedImage = { name: string; dataUrl: string; bytes: number }

type Props = {
  image: AttachedImage | null
  onChange: (image: AttachedImage | null) => void
}

const readAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })

const fmtBytes = (n: number) => (n < 1024 * 1024 ? `${(n / 1024).toFixed(0)} KB` : `${(n / 1024 / 1024).toFixed(1)} MB`)

// 返品・クレームの商品写真を想定。Decisions API には data URL（base64）で渡す
export function ImageAttach({ image, onChange }: Props) {
  const [error, setError] = useState<string | null>(null)

  const pick = useCallback(
    async (file: File | undefined, name?: string) => {
      setError(null)
      if (!file) return
      if (!file.type.startsWith('image/')) {
        setError('画像ファイルを選んでください')
        return
      }
      try {
        onChange({ name: name ?? file.name, dataUrl: await readAsDataUrl(file), bytes: file.size })
      } catch {
        setError('画像を読み込めませんでした')
      }
    },
    [onChange],
  )

  // コピペでの貼り付け（判定画面を表示している間、どこで Ctrl+V / ⌘V しても受け付ける）。
  // クリップボードに画像があるときだけ横取りし、文字の貼り付けはそのまま通す
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const file = [...(e.clipboardData?.files ?? [])].find((f) => f.type.startsWith('image/'))
      if (!file) return
      e.preventDefault()
      void pick(file, `貼り付けた画像（${file.type.replace('image/', '')}）`)
    }
    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
  }, [pick])

  return (
    <Stack direction="row" spacing={2} sx={{ alignItems: 'center', flexWrap: 'wrap' }} useFlexGap>
      <Button component="label" variant="outlined">
        商品写真を添付
        <input
          hidden
          type="file"
          accept="image/*"
          onChange={(e) => {
            void pick(e.target.files?.[0])
            // 同じファイルを選び直しても onChange が発火するようにする
            e.target.value = ''
          }}
        />
      </Button>
      {image ? (
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
          <Box
            component="img"
            src={image.dataUrl}
            alt="添付した商品写真"
            sx={{ height: 56, maxWidth: 96, objectFit: 'cover', borderRadius: 1, border: 1, borderColor: 'divider' }}
          />
          <Box>
            <Typography variant="body2">{image.name}</Typography>
            <Typography variant="caption" color="text.secondary">
              {fmtBytes(image.bytes)}・画像の判定は Decisions API のみ
            </Typography>
          </Box>
          <Button size="small" onClick={() => onChange(null)}>
            外す
          </Button>
        </Stack>
      ) : (
        <Typography variant="body2" color="text.secondary">
          ボタンから選ぶか、画像をコピーしてこの画面に貼り付け（Ctrl+V / ⌘V）できます。添付すると「画像」の付いた問いも
          Decisions API で判定します（Jev は画像非対応）
        </Typography>
      )}
      {error && (
        <Typography variant="body2" color="error">
          {error}
        </Typography>
      )}
    </Stack>
  )
}
