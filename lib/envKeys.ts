// .env（.env.local など）の APIキー。サーバー側（Route Handler）だけで読む。
// NEXT_PUBLIC_ を付けるとビルド時にブラウザ向けの JS へ埋め込まれるため、付けない名前を使う。
// 変数名は各社 SDK の標準に合わせる（OPENAI_API_KEY／TYPESAFE_API_KEY）
import type { ApiId } from './types'

const ENV_NAMES: Record<ApiId, string> = {
  decisions: 'OPENAI_API_KEY',
  jev: 'TYPESAFE_API_KEY',
}

export function envKey(id: ApiId): string | undefined {
  return process.env[ENV_NAMES[id]]?.trim() || undefined
}

/**
 * 使う APIキーを決める。画面で入力されたキー（リクエストヘッダー）を優先し、なければ .env の値を使う
 */
export function resolveKey(request: Request, headerName: string, id: ApiId): string | undefined {
  return request.headers.get(headerName)?.trim() || envKey(id)
}
