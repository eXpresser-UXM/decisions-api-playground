// サンプル一覧。同じ Questions を使うサンプルをグループにまとめる。
// サンプルを押すと State（問い合わせ文）とグループの Questions の両方を置き換える。
// 文章はすべて架空のもの（実在の人物・会社・データは使わない）
import { DEFAULT_QUESTIONS } from './questions'
import type { Question } from './types'

export type SampleGroup = {
  title: string
  /** グループの説明（何を見せるためのサンプルか） */
  description: string
  questions: Question[]
  samples: { text: string; note: string }[]
}

// ---- 社内ITヘルプデスク ----
const HELPDESK_QUESTIONS: Question[] = [
  {
    kind: 'choice',
    name: 'category',
    instructions: 'この問い合わせは、どの分類か？',
    options: [
      { value: 'account', description: 'アカウント・権限（ログインできない、パスワード、権限の追加など）' },
      { value: 'device', description: 'PC・周辺機器（故障、動作が遅い、プリンターなど）' },
      { value: 'software', description: 'ソフトウェア（インストール、ライセンス、アプリの不具合）' },
      { value: 'network', description: 'ネットワーク（Wi-Fi、VPN、社外からの接続）' },
      { value: 'other', description: 'その他（上記に当てはまらない）' },
    ],
  },
  {
    kind: 'score',
    name: 'urgency',
    instructions: 'どのくらい急ぎの対応が必要か？',
    levels: [
      { label: '低', description: '業務に支障はなく、時間があるときでよい' },
      { label: '中', description: '一部の作業に支障があるが、回避策がある' },
      { label: '高', description: '本人の業務が止まっている、または期限が迫っている' },
      { label: '緊急', description: '複数人・部署全体の業務が止まっている' },
    ],
  },
  {
    kind: 'predicate',
    name: 'has_secret',
    instructions: 'この問い合わせに、パスワードや認証コードなどの秘密情報がそのまま書かれているか？',
    whenTrue: 'パスワード、PIN、ワンタイムコードなどの文字列そのものが書かれている',
    whenFalse: '秘密情報の文字列は書かれていない（「パスワードを忘れた」などの話題だけなら いいえ）',
  },
]

// ---- 商品レビュー ----
const REVIEW_QUESTIONS: Question[] = [
  {
    kind: 'score',
    name: 'satisfaction',
    instructions: 'レビューを書いた人の満足度はどのくらいか？',
    levels: [
      { label: 'とても不満', description: '強い不満。返品や低評価をはっきり示している' },
      { label: '不満', description: '不満な点が目立つ' },
      { label: 'ふつう', description: '良い点と悪い点が同じくらい、または感想が中立' },
      { label: '満足', description: 'おおむね満足している' },
      { label: 'とても満足', description: '強く満足している。絶賛している' },
    ],
  },
  {
    kind: 'choice',
    name: 'topic',
    instructions: 'このレビューは主に何について書かれているか？',
    options: [
      { value: 'content', description: '本の内容（わかりやすさ、面白さ、役に立つか）' },
      { value: 'price', description: '価格（高い・安い、値段に見合うか）' },
      { value: 'shipping', description: '配送（届くまでの早さ、梱包）' },
      { value: 'condition', description: '商品の状態（汚れ、傷、折れ、落丁）' },
      { value: 'other', description: 'その他（上記に当てはまらない）' },
    ],
  },
  {
    kind: 'predicate',
    name: 'recommends',
    instructions: 'レビューを書いた人は、この商品を他の人に勧めているか？',
  },
]

// ---- メールの返信要否 ----
const MAIL_QUESTIONS: Question[] = [
  {
    kind: 'predicate',
    name: 'needs_reply',
    instructions: 'このメールに、返信（回答や対応）が必要か？',
    whenTrue: '質問、依頼、日程の確認など、相手が返事や対応を求めている',
    whenFalse: 'お知らせ・報告・お礼・宣伝だけで、返事を求めていない',
  },
  {
    kind: 'score',
    name: 'priority',
    instructions: 'このメールへの対応の優先度はどのくらいか？',
    levels: [
      { label: '低', description: '対応不要、または いつでもよい' },
      { label: '中', description: '数日以内に対応すればよい' },
      { label: '高', description: '今日・明日などの期限があり、すぐに対応が必要' },
    ],
  },
  {
    kind: 'choice',
    name: 'mail_type',
    instructions: 'このメールの種類はどれか？',
    options: [
      { value: 'request', description: '依頼（作業や資料の送付をお願いしている）' },
      { value: 'question', description: '質問・確認（答えや都合を聞いている）' },
      { value: 'report', description: '報告・共有（情報を知らせている）' },
      { value: 'thanks', description: 'お礼・あいさつ' },
      { value: 'sales', description: '営業・宣伝' },
    ],
  },
]

// ---- 英語版（Jev の主な学習言語は英語。日本語版と結果を比べる用） ----
const ENGLISH_QUESTIONS: Question[] = [
  {
    kind: 'choice',
    name: 'route',
    instructions: 'Which team should handle this inquiry?',
    options: [
      { value: 'faq', description: 'Policy / FAQ guidance (questions about shipping fees, cancellation terms, etc.)' },
      { value: 'order', description: 'Order operations (checking, cancelling, or returning an order)' },
      { value: 'delivery', description: 'Delivery status (where the package is, when it will arrive)' },
      { value: 'human', description: 'A human agent (none of the above, or difficult to handle)' },
    ],
  },
  {
    kind: 'score',
    name: 'attitude',
    instructions: "How would you describe the customer's attitude?",
    levels: [
      { label: 'Calm', description: 'Composed, no emotional language' },
      { label: 'Troubled', description: 'Expresses a problem or worry, but no dissatisfaction or anger' },
      { label: 'Dissatisfied', description: 'Clearly unhappy with the store or service' },
      { label: 'Angry', description: 'Strong anger or frustration (harsh words, exclamation marks, blame)' },
    ],
  },
  {
    kind: 'predicate',
    name: 'needs_verification',
    instructions: 'Does this request require identity verification (name and date of birth) before handling order information?',
    whenTrue: "The customer asks to check, change, cancel, or return a specific order of their own",
    whenFalse: "A general question about policies, shipping fees, or cancellation terms that doesn't involve personal order data",
  },
]

export const SAMPLE_GROUPS: SampleGroup[] = [
  {
    title: '架空ネット書店の問い合わせ分類',
    description: '担当の振り分け・態度・本人確認の要否。画像の問い（破損の有無・程度）は、商品写真を添付したときだけ判定します',
    questions: DEFAULT_QUESTIONS,
    samples: [
      { text: 'キャンセルの条件を教えてください', note: '期待：faq' },
      { text: '注文をキャンセルしたいです', note: '期待：order' },
      { text: '頼んだ本がまだ届かないんですけど！', note: '期待：delivery' },
      { text: '届いた本が注文と違う', note: '正解が一つに決まらない' },
      { text: '領収書を発行してもらうことはできますか？', note: '期待：faq、穏やか' },
      { text: '先週注文した本を返品したいので、手続きを教えてください', note: '期待：order、本人確認が必要' },
      { text: '注文した雑誌の付録が入っていませんでした。どうなってるんですか？', note: '不満。担当は割れやすい' },
      { text: 'もう二度と使わない。対応が遅すぎるし、電話もつながらない！', note: '期待：human、怒っている' },
      { text: '本の角がつぶれた状態で届きました', note: '商品写真を添付して試す（画像の問いも判定）' },
    ],
  },
  {
    title: '社内ITヘルプデスクの振り分け',
    description: '分類（Choice）・緊急度（Score）・秘密情報が書かれていないか（Noul）',
    questions: HELPDESK_QUESTIONS,
    samples: [
      { text: 'VPNにつながらず、在宅から社内システムに入れません。午後までに会議資料を提出する必要があります', note: '期待：network、高' },
      { text: 'Excelを開くと「ライセンスの有効期限が切れています」と表示されます', note: '期待：software' },
      { text: '来週から入るメンバーに、共有フォルダの閲覧権限を付けてください', note: '期待：account、低' },
      { text: 'ログインできません。パスワードは Sakura2026! で合っているはずです', note: '期待：has_secret が高い（架空のパスワード）' },
      { text: '3階のフロア全体でWi-Fiが切れています！誰も作業できません', note: '期待：network、緊急' },
      { text: 'ノートPCのファンがずっと大きな音を立てていて、動作も重いです', note: '期待：device' },
    ],
  },
  {
    title: '商品レビューの分析',
    description: '満足度（Score・5段階）・話題（Choice）・他の人に勧めているか（Noul）',
    questions: REVIEW_QUESTIONS,
    samples: [
      { text: '内容は期待以上でした。初心者にもわかりやすく、チームのメンバーにも勧めています', note: '期待：とても満足、content、勧めている' },
      { text: '本の内容は良いのですが、届いたら表紙が折れていて残念でした', note: '良い点と悪い点が混在' },
      { text: 'この値段なら電子版で十分だったかもしれません', note: '期待：price' },
      { text: '注文の翌日に届きました。梱包も丁寧で助かります。中身はこれから読みます', note: '期待：shipping、満足' },
      { text: '途中のページが抜けていました。交換してもらいましたが、正直がっかりです', note: '期待：condition、不満' },
    ],
  },
  {
    title: 'メールの返信要否・優先度',
    description: '返信が必要か（Noul）・優先度（Score）・種類（Choice）',
    questions: MAIL_QUESTIONS,
    samples: [
      { text: '明日の15時までに、見積書の修正版をお送りいただけますでしょうか。', note: '期待：返信必要、高、request' },
      { text: '本日の定例会の議事録を共有します。ご確認ください（返信は不要です）。', note: '期待：返信不要、report' },
      { text: '先日はお時間をいただき、ありがとうございました。今後ともよろしくお願いいたします。', note: '期待：返信不要、thanks' },
      { text: '【期間限定】今だけ全プラン30%オフ！お申し込みはこちらから', note: '期待：返信不要、sales' },
      { text: '来週の打ち合わせですが、火曜と木曜のどちらがご都合よろしいでしょうか？', note: '期待：返信必要、question' },
    ],
  },
  {
    title: '英語の問い合わせ分類（書店の英語版）',
    description: 'Jev の主な学習言語は英語です。日本語のサンプルと結果の違いを比べられます',
    questions: ENGLISH_QUESTIONS,
    samples: [
      { text: 'What is your cancellation policy?', note: 'expected: faq' },
      { text: 'I want to cancel my order.', note: 'expected: order' },
      { text: "The book I ordered still hasn't arrived!!", note: 'expected: delivery' },
      { text: 'The book I received is not the one I ordered.', note: 'ambiguous' },
    ],
  },
]
