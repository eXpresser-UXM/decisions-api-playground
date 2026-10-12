// API に依存しない共通形式（問い・選択肢・結果）

export type ChoiceQuestion = {
  kind: 'choice'
  name: string
  instructions: string
  options: { value: string; description: string }[]
}

export type ScoreQuestion = {
  kind: 'score'
  name: string
  instructions: string
  /** 低い → 高いの順 */
  levels: { label: string; description: string }[]
}

/** Jev の Noul ／ Decisions API の predicate */
export type PredicateQuestion = {
  kind: 'predicate'
  name: string
  instructions: string
  whenTrue?: string
  whenFalse?: string
}

export type Question = ChoiceQuestion | ScoreQuestion | PredicateQuestion

export type Probability = { key: string; label: string; probability: number }

export type Answer =
  | { kind: 'choice'; name: string; choice: string; probabilities: Probability[]; confidence: number }
  | { kind: 'score'; name: string; score: number; probabilities: Probability[]; confidence: number }
  | { kind: 'predicate'; name: string; probability: number }
  | { kind: 'refusal'; name: string }

/** レスポンスの usage にあるトークン数（含まれない項目は undefined） */
export type TokenUsage = { input?: number; output?: number }

export type ApiErrorInfo = {
  /** HTTP ステータスコード（通信エラー等で無い場合は undefined） */
  status?: number
  message: string
  /** エラーのレスポンス本体 */
  body?: unknown
}

export type ApiId = 'jev' | 'decisions'

/**
 * Route Handler（app/api/*）がブラウザに返す共通の封筒。
 * ms はサーバー側で SDK 呼び出しの前後を performance.now() で計測した値。
 */
export type ProxyEnvelope =
  | { ok: true; ms: number; response: unknown }
  | { ok: false; ms: number | null; error: ApiErrorInfo }

export type ApiResult =
  | { state: 'idle' }
  | { state: 'no-key' }
  | { state: 'unsupported'; reason: string }
  | { state: 'loading'; request: unknown }
  | {
      state: 'ok'
      request: unknown
      response: unknown
      /** API 呼び出し（SDK）にかかった時間 */
      ms: number
      /** ブラウザから見た往復時間（axios） */
      roundTripMs: number
      model: string
      usage: TokenUsage
      answers: Answer[]
    }
  | { state: 'error'; request: unknown; ms: number | null; roundTripMs: number; error: ApiErrorInfo }

export type Keys = { openai: string; typesafe: string }

/** ブラウザ → Route Handler でキーを渡すヘッダー名 */
export const KEY_HEADER = 'x-api-key'
