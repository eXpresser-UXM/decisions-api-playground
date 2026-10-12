// Jev（TypeSafe System One API）用の変換（共通形式 ⇔ Jev の形式）
// 参照: https://docs.typesafe.ai/api
import type { Answer, Pricing, Question, TokenUsage } from './types'

/** jev-latest ではなく固定バージョンを使う（https://docs.typesafe.ai/models） */
export const JEV_MODEL = 'jev-1.13.0'

/** 推定課金額の計算に使う単価（入力トークンのみ課金。2026-10-10 時点） */
export const JEV_PRICING: Pricing = {
  usdPerMillionInputTokens: 0.042,
  docUrl: 'https://docs.typesafe.ai/models#current-models',
}

type JevQuestion =
  | { type: 'choice'; instructions: string; criteria: Record<string, string> }
  | { type: 'score'; instructions: string; criteria: [string, string, ...string[]] }
  | { type: 'noul'; instructions: string; criteria?: { true?: string; false?: string } }

export type JevRequest = {
  model: string
  state: string
  questions: Record<string, JevQuestion>
}

type JevAnswer =
  | { type: 'choice'; choice: string; probabilities: Record<string, number>; confidence: number }
  | {
      type: 'score'
      score: number
      legend: Record<string, string>
      probabilities: Record<string, number>
      confidence: number
    }
  | { type: 'noul'; noul: number }

export type JevResponse = {
  model: string
  answers: Record<string, JevAnswer>
  usage?: { input_tokens: number; output_tokens: number }
}

export function parseJevUsage(res: JevResponse): TokenUsage {
  return { input: res.usage?.input_tokens, output: res.usage?.output_tokens }
}

function toJevQuestion(q: Question): JevQuestion {
  switch (q.kind) {
    case 'choice':
      return {
        type: 'choice',
        instructions: q.instructions,
        criteria: Object.fromEntries(q.options.map((o) => [o.value, o.description])),
      }
    case 'score':
      return {
        type: 'score',
        instructions: q.instructions,
        // Score は2段階以上（共通形式の側で保証する）
        criteria: q.levels.map((l) => `${l.label}：${l.description}`) as [string, string, ...string[]],
      }
    case 'predicate': {
      const criteria: { true?: string; false?: string } = {}
      if (q.whenTrue) criteria.true = q.whenTrue
      if (q.whenFalse) criteria.false = q.whenFalse
      return Object.keys(criteria).length > 0
        ? { type: 'noul', instructions: q.instructions, criteria }
        : { type: 'noul', instructions: q.instructions }
    }
  }
}

export function buildJevRequest(questions: Question[], text: string): JevRequest {
  return {
    model: JEV_MODEL,
    state: text,
    questions: Object.fromEntries(questions.map((q) => [q.name, toJevQuestion(q)])),
  }
}

export function parseJevResponse(questions: Question[], res: JevResponse): Answer[] {
  return questions.map((q): Answer => {
    const a = res.answers[q.name]
    if (!a) return { kind: 'refusal', name: q.name }
    if (q.kind === 'choice' && a.type === 'choice') {
      return {
        kind: 'choice',
        name: q.name,
        choice: a.choice,
        confidence: a.confidence,
        probabilities: q.options.map((o) => ({
          key: o.value,
          label: o.value,
          probability: a.probabilities[o.value] ?? 0,
        })),
      }
    }
    if (q.kind === 'score' && a.type === 'score') {
      return {
        kind: 'score',
        name: q.name,
        score: a.score,
        confidence: a.confidence,
        probabilities: q.levels.map((l, i) => ({
          key: String(i),
          label: l.label,
          probability: a.probabilities[String(i)] ?? 0,
        })),
      }
    }
    if (q.kind === 'predicate' && a.type === 'noul') {
      return { kind: 'predicate', name: q.name, probability: a.noul }
    }
    return { kind: 'refusal', name: q.name }
  })
}
