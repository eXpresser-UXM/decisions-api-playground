// OpenAI Decisions API 用の変換（共通形式 ⇔ Decisions API の形式）
// 参照: https://developers.openai.com/api/docs/guides/decisions
import type { Decision, DecisionCreateParams } from 'openai/resources/decisions'
import type { Answer, Pricing, Question, TokenUsage } from './types'

export const DECISIONS_MODEL = 'gpt-6-luna'

/** 推定課金額の計算に使う単価（入力トークンのみ課金。地域処理・長文の割増は含まない。2026-10-10 時点） */
export const DECISIONS_PRICING: Pricing = {
  usdPerMillionInputTokens: 0.1,
  docUrl: 'https://developers.openai.com/api/docs/guides/decisions#pricing-and-availability',
}

export type DecisionsRequest = DecisionCreateParams
export type DecisionsResponse = Decision

type DecisionsQuestion = DecisionCreateParams['questions'][number]

function toDecisionsQuestion(q: Question): DecisionsQuestion {
  switch (q.kind) {
    case 'choice':
      return {
        type: 'choice',
        name: q.name,
        instructions: q.instructions,
        choices: q.options.map((o) => ({ value: o.value, description: o.description })),
      }
    case 'score':
      return {
        type: 'score',
        name: q.name,
        instructions: q.instructions,
        levels: q.levels.map((l) => ({ label: l.label, description: l.description })),
      }
    case 'predicate': {
      // predicate には true/false の補足欄がないため、補足は instructions に含める
      const notes = [
        q.whenTrue && `「はい」とするのは：${q.whenTrue}`,
        q.whenFalse && `「いいえ」とするのは：${q.whenFalse}`,
      ].filter(Boolean)
      return {
        type: 'predicate',
        name: q.name,
        instructions: [q.instructions, ...notes].join('\n'),
      }
    }
  }
}

export function buildDecisionsRequest(
  questions: Question[],
  input: DecisionCreateParams['input'],
): DecisionsRequest {
  return {
    model: DECISIONS_MODEL,
    input,
    questions: questions.map(toDecisionsQuestion),
  }
}

export function parseDecisionsUsage(res: DecisionsResponse): TokenUsage {
  return { input: res.usage?.input_tokens, output: res.usage?.output_tokens }
}

export function parseDecisionsResponse(questions: Question[], res: DecisionsResponse): Answer[] {
  return questions.map((q): Answer => {
    const a = res.answers.find((x) => x.name === q.name)
    if (!a || a.type === 'refusal') return { kind: 'refusal', name: q.name }
    if (q.kind === 'choice' && a.type === 'choice') {
      return {
        kind: 'choice',
        name: q.name,
        choice: String(a.choice),
        confidence: a.confidence,
        probabilities: q.options.map((o) => ({
          key: o.value,
          label: o.value,
          probability: a.probabilities.find((p) => String(p.value) === o.value)?.probability ?? 0,
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
          probability: a.probabilities.find((p) => p.value === i)?.probability ?? 0,
        })),
      }
    }
    if (q.kind === 'predicate' && a.type === 'predicate') {
      return { kind: 'predicate', name: q.name, probability: a.probability }
    }
    return { kind: 'refusal', name: q.name }
  })
}
