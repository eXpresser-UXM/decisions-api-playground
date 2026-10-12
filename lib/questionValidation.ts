// Questions の入力チェック（編集ダイアログと JSON 編集で共通）
import type { Question } from './types'

// 件数の上限は Jev のドキュメントによる（Choice は最大255、Score は2〜10段階。https://docs.typesafe.ai/api）
const MAX_CHOICES = 255
const MAX_LEVELS = 10
// 名前の形式はこのアプリの決まり（両 API のドキュメントに制約の記載はないが、JSON のキーとして扱いやすい形にそろえる）
const NAME_PATTERN = /^[A-Za-z][A-Za-z0-9_]*$/

/** 1問分の中身をチェックする。otherNames はこの問い以外の名前（重複チェック用） */
export function validateQuestion(q: Question, otherNames: string[]): string[] {
  const errors: string[] = []
  const name = q.name.trim()
  if (!name) errors.push('名前を入力してください')
  else if (!NAME_PATTERN.test(name)) errors.push('名前は英字で始め、英数字と _ だけにしてください（例：is_urgent）')
  else if (otherNames.includes(name)) errors.push(`名前「${name}」はすでに使われています`)
  if (!q.instructions.trim()) errors.push('問いを入力してください')
  if (q.kind === 'choice' || q.kind === 'score') {
    const keys = q.kind === 'choice' ? q.options.map((o) => o.value.trim()) : q.levels.map((l) => l.label.trim())
    const what = q.kind === 'choice' ? '選択肢の値' : '段階の名前'
    const max = q.kind === 'choice' ? MAX_CHOICES : MAX_LEVELS
    if (keys.length < 2) errors.push(`${what}は2つ以上必要です`)
    if (keys.length > max) errors.push(`${what}は${max}個までです`)
    if (keys.some((k) => !k)) errors.push(`空の${what}があります`)
    const filled = keys.filter(Boolean)
    if (q.kind === 'choice' && new Set(filled).size !== filled.length) errors.push('選択肢の値が重複しています')
  }
  return errors
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)
const optStr = (v: unknown) => v === undefined || typeof v === 'string'

/** JSON の1要素を Question に変換する。形が違えばエラーの一覧を返す */
function toQuestion(v: unknown): Question | string[] {
  if (!isObj(v)) return ['オブジェクトではありません']
  const errors: string[] = []
  if (typeof v.name !== 'string') errors.push('name（文字列）がありません')
  if (typeof v.instructions !== 'string') errors.push('instructions（文字列）がありません')
  if (v.image !== undefined && typeof v.image !== 'boolean') errors.push('image は true／false にしてください')
  const base = {
    name: String(v.name ?? '').trim(),
    instructions: String(v.instructions ?? '').trim(),
    ...(v.image === true ? { image: true } : {}),
  }
  switch (v.kind) {
    case 'choice': {
      const options = v.options
      if (!Array.isArray(options) || !options.every((o) => isObj(o) && typeof o.value === 'string' && optStr(o.description)))
        return [...errors, 'options は { "value": 文字列, "description": 文字列（任意） } の配列にしてください']
      if (errors.length) return errors
      return {
        ...base,
        kind: 'choice',
        options: options.map((o) => ({ value: String(o.value).trim(), description: String(o.description ?? '').trim() })),
      }
    }
    case 'score': {
      const levels = v.levels
      if (!Array.isArray(levels) || !levels.every((l) => isObj(l) && typeof l.label === 'string' && optStr(l.description)))
        return [...errors, 'levels は { "label": 文字列, "description": 文字列（任意） } の配列にしてください']
      if (errors.length) return errors
      return {
        ...base,
        kind: 'score',
        levels: levels.map((l) => ({ label: String(l.label).trim(), description: String(l.description ?? '').trim() })),
      }
    }
    case 'predicate': {
      if (!optStr(v.whenTrue) || !optStr(v.whenFalse)) errors.push('whenTrue／whenFalse は文字列にしてください')
      if (errors.length) return errors
      const whenTrue = String(v.whenTrue ?? '').trim()
      const whenFalse = String(v.whenFalse ?? '').trim()
      return { ...base, kind: 'predicate', ...(whenTrue ? { whenTrue } : {}), ...(whenFalse ? { whenFalse } : {}) }
    }
    default:
      return [...errors, 'kind は "choice"・"score"・"predicate" のどれかにしてください']
  }
}

/** Questions 全体の JSON を読み込む。問題があれば「何番目の、どの問いか」を付けたエラーを返す */
export function parseQuestionsJson(text: string): { questions: Question[] } | { errors: string[] } {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch (e) {
    return { errors: [`JSON として読めません：${e instanceof Error ? e.message : String(e)}`] }
  }
  if (!Array.isArray(data)) return { errors: ['全体を配列（[ ... ]）にしてください'] }

  const errors: string[] = []
  const questions: Question[] = []
  data.forEach((item, i) => {
    const label = `${i + 1}番目${isObj(item) && typeof item.name === 'string' && item.name ? `（${item.name}）` : ''}`
    const q = toQuestion(item)
    if (Array.isArray(q)) {
      errors.push(...q.map((m) => `${label}：${m}`))
      return
    }
    const others = data
      .filter((_, j) => j !== i)
      .map((o) => (isObj(o) && typeof o.name === 'string' ? o.name.trim() : ''))
    errors.push(...validateQuestion(q, others).map((m) => `${label}：${m}`))
    questions.push(q)
  })
  return errors.length ? { errors } : { questions }
}
