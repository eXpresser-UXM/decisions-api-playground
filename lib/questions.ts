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

export const TEXT_QUESTIONS: Question[] = [ROUTE]

// 動作確認用の入力（架空のポチッとモールの問い合わせ）
export const SAMPLE_INQUIRIES: { text: string; note: string }[] = [
  { text: 'キャンセルの条件を教えてください', note: '期待：faq' },
  { text: '注文をキャンセルしたいです', note: '期待：order' },
  { text: '頼んだ本がまだ届かないんですけど！', note: '期待：delivery' },
  { text: '届いた本が注文と違う', note: '正解が一つに決まらない' },
]
