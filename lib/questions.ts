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

// フェーズ3：画像の問い（Decisions API のみ。Jev は画像入力に非対応）
export const VISIBLE_DAMAGE: Question = {
  kind: 'predicate',
  name: 'visible_damage',
  image: true,
  instructions: '商品に目に見える破損（割れ、破れ、へこみ）があるか？ 影や梱包の傷は無視する。',
}

export const DAMAGE_LEVEL: Question = {
  kind: 'score',
  name: 'damage_level',
  image: true,
  instructions: '商品の破損の程度はどのくらいか？ 影や梱包の傷は無視する。',
  levels: [
    { label: 'なし', description: '商品に目に見える破損はない' },
    { label: '軽微', description: '小さな傷・折れ・へこみがあるが、読む・使うのに支障はない' },
    { label: '重大', description: '大きな破れ・割れ・変形があり、商品として使えない、または交換が必要な程度' },
  ],
}

export const IMAGE_QUESTIONS: Question[] = [VISIBLE_DAMAGE, DAMAGE_LEVEL]

/** 画面の Questions の初期値（画面で追加・編集・削除できる。再読み込みでこの値に戻る） */
export const DEFAULT_QUESTIONS: Question[] = [...TEXT_QUESTIONS, ...IMAGE_QUESTIONS]
