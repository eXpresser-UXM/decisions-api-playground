// サーバー側の設定（APIキーとエンドポイント）。Route Handler からだけ使う。
// 環境変数（ローカルなら .env）で設定する。キーだけは画面で入力した値があればそちらを優先する。
// 変数名は各社 SDK の標準に合わせる（OPENAI_API_KEY／OPENAI_BASE_URL、TYPESAFE_API_KEY／TYPESAFE_BASE_URL）。
// NEXT_PUBLIC_ を付けるとビルド時にブラウザ向けの JS へ埋め込まれるため、付けない名前を使う。
import { KEY_HEADER, type ApiId } from './types'

const ENV_NAMES: Record<ApiId, { key: string; baseUrl: string }> = {
  decisions: { key: 'OPENAI_API_KEY', baseUrl: 'OPENAI_BASE_URL' },
  jev: { key: 'TYPESAFE_API_KEY', baseUrl: 'TYPESAFE_BASE_URL' },
}

/** 各 SDK の既定のエンドポイント */
const DEFAULT_BASE_URLS: Record<ApiId, string> = {
  decisions: 'https://api.openai.com/v1',
  jev: 'https://api.typesafe.ai',
}

const trimSlash = (url: string) => url.trim().replace(/\/+$/, '')

export function envKey(id: ApiId): string | undefined {
  return process.env[ENV_NAMES[id].key]?.trim() || undefined
}

/** サーバーで使うエンドポイント（環境変数があればその値、なければ既定値）。機密ではないので画面に表示してよい */
export function serverBaseUrl(id: ApiId): string {
  return trimSlash(process.env[ENV_NAMES[id].baseUrl] || DEFAULT_BASE_URLS[id])
}

export type Target = { apiKey: string; baseURL: string }

/**
 * 呼び出し先とキーを決める。
 * - エンドポイント：環境変数（なければ既定値）だけで決める。画面からは変更できない
 *   （画面で変えられると、環境変数のキーを別のサーバーへ送らせることができてしまうため）
 * - キー：画面で入力した値（ヘッダー）を優先し、なければ環境変数
 */
export function resolveTarget(request: Request, id: ApiId, label: string): Target | { error: string } {
  const baseURL = serverBaseUrl(id)
  const apiKey = request.headers.get(KEY_HEADER)?.trim() || envKey(id)
  if (!apiKey) return { error: `${label} の APIキーが未設定です（画面でも環境変数でも設定されていません）` }
  return { apiKey, baseURL }
}
