// Jev（TypeSafe）を公式 SDK で呼び出す中継。
// TypeSafe API はブラウザからの直接呼び出しを CORS で拒否しているため、サーバー側から呼ぶ。
// API キーとエンドポイントは、画面で入力した値（リクエストヘッダー）か環境変数から取り、
// この呼び出しにだけ使う（保存・ログ出力はしない）。決め方は lib/serverConfig.ts を参照。
import { APIError, TypeSafeClient } from '@typesafe-ai/sdk'
import type { JevRequest } from '@/lib/jev'
import { resolveTarget } from '@/lib/serverConfig'
import type { ProxyEnvelope } from '@/lib/types'

export async function POST(request: Request) {
  const target = resolveTarget(request, 'jev', 'TypeSafe')
  if ('error' in target) {
    return Response.json({ ok: false, ms: null, error: { message: target.error } } satisfies ProxyEnvelope, {
      status: 400,
    })
  }
  const body = (await request.json()) as JevRequest

  const client = new TypeSafeClient({
    apiKey: target.apiKey,
    baseURL: target.baseURL,
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
