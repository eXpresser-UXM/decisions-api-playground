// OpenAI Decisions API を公式 SDK で呼び出す中継。
// API キーとエンドポイントは、画面で入力した値（リクエストヘッダー）か環境変数から取り、
// この呼び出しにだけ使う（保存・ログ出力はしない）。決め方は lib/serverConfig.ts を参照。
import OpenAI, { APIError } from 'openai'
import type { DecisionsRequest } from '@/lib/decisions'
import { resolveTarget } from '@/lib/serverConfig'
import type { ProxyEnvelope } from '@/lib/types'

export async function POST(request: Request) {
  const target = resolveTarget(request, 'decisions', 'OpenAI')
  if ('error' in target) {
    return Response.json({ ok: false, ms: null, error: { message: target.error } } satisfies ProxyEnvelope, {
      status: 400,
    })
  }
  const body = (await request.json()) as DecisionsRequest

  const client = new OpenAI({
    apiKey: target.apiKey,
    baseURL: target.baseURL,
    // 環境変数の組織・プロジェクト設定を拾わないよう明示する
    organization: null,
    project: null,
    // 応答時間を1回の呼び出しとして計測するため、自動リトライは無効にする
    maxRetries: 0,
    timeout: 60_000,
  })

  const start = performance.now()
  try {
    const { data } = await client.decisions.create(body).withResponse()
    const ms = performance.now() - start
    return Response.json({ ok: true, ms, response: data } satisfies ProxyEnvelope)
  } catch (e) {
    const ms = performance.now() - start
    const error =
      e instanceof APIError && e.status !== undefined
        ? // SDK は本体の error フィールドだけを保持しているので、元の形 { error: ... } に戻す
          { status: e.status, message: e.message, body: { error: e.error } }
        : { message: e instanceof Error ? e.message : String(e) }
    return Response.json({ ok: false, ms, error } satisfies ProxyEnvelope)
  }
}
