// Jev（TypeSafe）を公式 SDK で呼び出す中継。
// TypeSafe API はブラウザからの直接呼び出しを CORS で拒否しているため、サーバー側から呼ぶ。
// API キーはリクエストヘッダー（画面で入力した値）か .env から取り、この呼び出しにだけ使う（保存・ログ出力はしない）。
import { APIError, TypeSafeClient } from '@typesafe-ai/sdk'
import type { JevRequest } from '@/lib/jev'
import { resolveKey } from '@/lib/envKeys'
import { KEY_HEADER, type ProxyEnvelope } from '@/lib/types'

export async function POST(request: Request) {
  // 画面で入力したキー（ヘッダー）を優先し、なければ .env のキーを使う
  const apiKey = resolveKey(request, KEY_HEADER, 'jev')
  if (!apiKey) {
    return Response.json(
      { ok: false, ms: null, error: { message: 'TypeSafe の APIキーが未設定です（画面でも .env でも設定されていません）' } } satisfies ProxyEnvelope,
      { status: 400 },
    )
  }
  const body = (await request.json()) as JevRequest

  const client = new TypeSafeClient({
    apiKey,
    // 応答時間を1回の呼び出しとして計測するため、自動リトライは無効にする
    retry: { maxRetries: 0 },
    timeout: 60_000,
  })

  const start = performance.now()
  try {
    const { data } = await client.systemOne(body).withResponse()
    const ms = performance.now() - start
    return Response.json({ ok: true, ms, response: data } satisfies ProxyEnvelope)
  } catch (e) {
    const ms = performance.now() - start
    const error =
      e instanceof APIError
        ? { status: e.status, message: e.message, body: e.body }
        : { message: e instanceof Error ? e.message : String(e) }
    return Response.json({ ok: false, ms, error } satisfies ProxyEnvelope)
  }
}
