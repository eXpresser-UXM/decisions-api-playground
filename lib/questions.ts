import type { Question } from './types'

// フェーズ1：route（Choice 1問）
export const ROUTE: Question = {
  kind: 'choice',
  name: 'route',
  instructions: 'この問い合わせは、どの担当に回すべきか？',
  options: [
    { value: 'faq', description: '規約・FAQの案内（送料、キャンセル条件などの質問）' },
    { value: 'order', description: '注文の操作（注文の確認・キャンセル・返品の手続き）' },
    { value: 'delivery', description: '配送状況の確認（荷物がどこにあるか、いつ届くか）' },
    { value: 'human', description: '人間の担当者（上記に当てはまらない、または対応が難しい）' },
  ],
}

// フェーズ2：attitude（Score）
export const ATTITUDE: Question = {
  kind: 'score',
  name: 'attitude',
  instructions: 'お客さんの態度はどのくらいか？',
  levels: [
    { label: '穏やか', description: '落ち着いていて、感情的な表現がない' },
    { label: '困っている', description: '困りごとや不安を伝えているが、不満や怒りは見られない' },
    { label: '不満', description: '店やサービスへの不満がはっきり表れている' },
    { label: '怒っている', description: '強い怒りや苛立ちが表れている（強い言葉、感嘆符、責める表現など）' },
  ],
}

// フェーズ2：needs_verification（Jev は Noul、Decisions API は predicate）
// Decisions API の predicate には true/false の補足欄がないため、whenTrue/whenFalse は instructions に含めて送る
export const NEEDS_VERIFICATION: Question = {
  kind: 'predicate',
  name: 'needs_verification',
  instructions: 'この依頼は、注文情報を扱う前に本人確認（氏名・生年月日）が必要か？',
  whenTrue: '特定の注文を確認・変更・キャンセル・返品するなど、お客さん個人の注文情報を参照・操作する依頼',
  whenFalse: '規約・送料・キャンセル条件などの一般的な質問で、個人の注文情報を扱わない',
}

export const TEXT_QUESTIONS: Question[] = [ROUTE, ATTITUDE, NEEDS_VERIFICATION]

// 動作確認用の入力（架空のポチッとモールの問い合わせ）
export const SAMPLE_INQUIRIES: { text: string; note: string }[] = [
  { text: 'キャンセルの条件を教えてください', note: '期待：faq' },
  { text: '注文をキャンセルしたいです', note: '期待：order' },
  { text: '頼んだ本がまだ届かないんですけど！', note: '期待：delivery' },
  { text: '届いた本が注文と違う', note: '正解が一つに決まらない' },
]
