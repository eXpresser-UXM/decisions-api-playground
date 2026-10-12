'use client'
import { useCallback, useEffect, useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate'
import CloseIcon from '@mui/icons-material/Close'

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

// 画像サイズの目安。Vercel などのサーバーレス環境ではリクエスト本体に上限があり（Vercel Functions は 4.5MB）、
// base64 にすると約1.33倍になるため、元の画像で 3MB 前後を超えると送れないことがある
const RECOMMENDED_BYTES = 1024 * 1024
const UNSTABLE_BYTES = 3 * 1024 * 1024

function sizeLevel(bytes: number): { color: string; message: string } {
  if (bytes > UNSTABLE_BYTES)
    return { color: 'error.main', message: '3MBを超えています。送信に失敗することがあります。1MB以内に縮小してください' }
  if (bytes > RECOMMENDED_BYTES)
    return { color: 'warning.main', message: '1MBを超えています（1MB以内推奨）。画像の判定は Decisions API のみ' }
  return { color: 'text.secondary', message: '画像の判定は Decisions API のみ' }
}

const fmtBytes = (n: number) => (n < 1024 * 1024 ? `${(n / 1024).toFixed(0)} KB` : `${(n / 1024 / 1024).toFixed(1)} MB`)

// 画像の問い（例：商品写真の破損の確認）用。Decisions API には data URL（base64）で渡す
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
      <Button component="label" variant="outlined" startIcon={<AddPhotoAlternateIcon />}>
        画像を添付
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
            alt="添付した画像"
            sx={{ height: 56, maxWidth: 96, objectFit: 'cover', borderRadius: 1, border: 1, borderColor: 'divider' }}
          />
          <Box>
            <Typography variant="body2">{image.name}</Typography>
            <Typography variant="caption" component="div" sx={{ color: sizeLevel(image.bytes).color }}>
              {fmtBytes(image.bytes)}・{sizeLevel(image.bytes).message}
            </Typography>
          </Box>
          <Button size="small" startIcon={<CloseIcon />} onClick={() => onChange(null)}>
            外す
          </Button>
        </Stack>
      ) : (
        <Typography variant="body2" color="text.secondary">
          ボタンから選ぶか、画像をコピーしてこの画面に貼り付け（Ctrl+V / ⌘V）できます。添付すると「画像」の付いた問いも
          Decisions API で判定します（Jev は画像非対応）。
          <strong>画像は1MB以内を推奨</strong>します。3MB前後を超えると、送信に失敗するなど動作が不安定になります。
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
