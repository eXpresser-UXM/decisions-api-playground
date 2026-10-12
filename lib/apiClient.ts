// ブラウザ → Route Handler（app/api/*）の呼び出し。API ごとに axios インスタンスを分ける。
import axios, { type AxiosInstance } from 'axios'
import type { Answer, ApiErrorInfo, ApiId, ApiResult, ProxyEnvelope, TokenUsage } from './types'
import { KEY_HEADER } from './types'

const instances: Record<ApiId, AxiosInstance> = {
  jev: axios.create({ baseURL: '/api/jev', headers: { 'Content-Type': 'application/json' } }),
  decisions: axios.create({ baseURL: '/api/decisions', headers: { 'Content-Type': 'application/json' } }),
}

export type ApiJob<Res> = {
  id: ApiId
  /** 画面で入力したキー（空なら送らず、サーバー側で .env のキーを使う） */
  apiKey: string
  /** .env にキーがあるか（値はブラウザに来ない） */
  hasEnvKey: boolean
  request: unknown
  parse: (response: Res) => Answer[]
  model: (response: Res) => string
  usage: (response: Res) => TokenUsage
  /** 呼び出さない理由（例：Jev に送れる問いがない）。指定すると呼び出さずにその旨を表示する */
  skipReason?: string
}

/** 1つの API を呼ぶ。往復時間は axios 呼び出しの前後を performance.now() で計測する */
async function runOne<Res>(job: ApiJob<Res>, onUpdate: (id: ApiId, result: ApiResult) => void) {
  if (!job.apiKey && !job.hasEnvKey) {
    onUpdate(job.id, { state: 'no-key' })
    return
  }
  if (job.skipReason) {
    onUpdate(job.id, { state: 'unsupported', reason: job.skipReason })
    return
  }
  onUpdate(job.id, { state: 'loading', request: job.request })
  const start = performance.now()
  let envelope: ProxyEnvelope
  try {
    const res = await instances[job.id].post<ProxyEnvelope>('', job.request, {
      // 画面で入力したキーだけをヘッダーで送る。なければ送らず、サーバー側で .env のキーを使う
      headers: job.apiKey ? { [KEY_HEADER]: job.apiKey } : {},
      // 4xx/5xx でも封筒（ProxyEnvelope）を読む
      validateStatus: () => true,
    })
    envelope = res.data
    if (!envelope || typeof envelope !== 'object' || !('ok' in envelope)) {
      envelope = {
        ok: false,
        ms: null,
        error: { status: res.status, message: '中継サーバーから想定外の応答がありました', body: res.data },
      }
    }
  } catch (e) {
    const error: ApiErrorInfo = { message: e instanceof Error ? e.message : String(e) }
    envelope = { ok: false, ms: null, error }
  }
  const roundTripMs = performance.now() - start

  if (envelope.ok) {
    const response = envelope.response as Res
    onUpdate(job.id, {
      state: 'ok',
      request: job.request,
      response,
      ms: envelope.ms,
      roundTripMs,
      model: job.model(response),
      usage: job.usage(response),
      answers: job.parse(response),
    })
  } else {
    onUpdate(job.id, { state: 'error', request: job.request, ms: envelope.ms, roundTripMs, error: envelope.error })
  }
}

export type EnvStatus = { openai: boolean; typesafe: boolean }

/** .env に APIキーがあるかどうか（キーの値は返らない） */
export async function fetchEnvStatus(): Promise<EnvStatus> {
  try {
    const res = await axios.get<EnvStatus>('/api/env-status')
    return { openai: !!res.data.openai, typesafe: !!res.data.typesafe }
  } catch {
    return { openai: false, typesafe: false }
  }
}

/** 複数の API を並列に呼ぶ。片方が失敗してももう片方の結果は表示される */
export async function runAll(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  jobs: ApiJob<any>[],
  onUpdate: (id: ApiId, result: ApiResult) => void,
) {
  await Promise.allSettled(jobs.map((job) => runOne(job, onUpdate)))
}
