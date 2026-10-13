// 選択肢や問いが多い場合の耐久テスト用サンプル。
// - 都道府県あてクイズ（Choice・47択）
// - 本のジャンル（Choice・100択）と、同じ内容の2段階版（大分類＋大分類ごとの小分類を1回のリクエストで聞く）
// - 問い合わせのタグ付け（Noul・100問）
// 上限：Jev は Choice 1問あたり255択・1リクエスト64,000トークンまで（https://docs.typesafe.ai/api, /models）。
// Decisions API は公式ドキュメントに選択肢数・問い数の上限の記載がない（2026-10-13 確認）。超えた場合は API のエラーをそのまま表示する。
// 文章はすべて架空のもの
import type { Question } from './types'

// ---- 都道府県あてクイズ ----
const PREFECTURES = [
  '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
  '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
  '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県', '静岡県', '愛知県',
  '三重県', '滋賀県', '京都府', '大阪府', '兵庫県', '奈良県', '和歌山県',
  '鳥取県', '島根県', '岡山県', '広島県', '山口県',
  '徳島県', '香川県', '愛媛県', '高知県',
  '福岡県', '佐賀県', '長崎県', '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県',
]

export const PREFECTURE_QUESTIONS: Question[] = [
  {
    kind: 'choice',
    name: 'prefecture',
    instructions: 'このヒントが表している都道府県はどれか？',
    // 説明文は付けない（値の日本語名だけで判定する）
    options: PREFECTURES.map((value) => ({ value, description: '' })),
  },
]

// ---- 本のジャンル（大分類と小分類）----
// 1段階版は小分類をすべて並べた100択。2段階版は大分類（9択）と、大分類ごとの小分類（9〜14択）を
// 1回のリクエストでまとめて聞く（使う答えは、選ばれた大分類に対応する小分類。TypeSafe の Speculative fan-out の考え方）
type Genre = { value: string; description: string }
type GenreGroup = { name: string; value: string; description: string; genres: Genre[] }

const GENRE_GROUPS: GenreGroup[] = [
  {
    name: 'genre_fiction',
    value: '文芸',
    description: '小説・詩歌などの文学作品',
    genres: [
      { value: '純文学', description: '芸術性や人間の内面を重視した小説' },
      { value: '恋愛小説', description: '恋愛を中心に描く小説' },
      { value: 'ミステリー', description: '事件の謎解きや推理が中心の小説' },
      { value: '警察小説', description: '警察組織や刑事の捜査を描く小説' },
      { value: 'ハードボイルド', description: '探偵などが非情な世界で活躍する小説' },
      { value: 'SF', description: '科学的な想像をもとにした未来や宇宙の物語' },
      { value: 'ファンタジー', description: '魔法や架空の世界を舞台にした物語' },
      { value: 'ホラー', description: '恐怖を主題にした小説' },
      { value: '歴史・時代小説', description: '過去の時代や歴史上の人物を描く小説' },
      { value: '青春小説', description: '若者の成長や友情を描く小説' },
      { value: 'ライトノベル', description: 'イラスト付きで若い読者向けの娯楽小説' },
      { value: '海外文学', description: '外国の作家による小説の翻訳' },
      { value: '詩・短歌・俳句', description: '詩や短歌、俳句の作品集' },
      { value: '古典文学', description: '古典として読み継がれる昔の文学作品' },
    ],
  },
  {
    name: 'genre_humanities',
    value: '人文・ノンフィクション',
    description: '実話や、人間・社会・歴史を扱う本',
    genres: [
      { value: 'エッセイ', description: '筆者の体験や考えを自由に書いた文章' },
      { value: '伝記・自伝', description: '実在の人物の生涯をたどる本' },
      { value: 'ルポルタージュ', description: '取材にもとづいて事実を伝える記録' },
      { value: '歴史', description: '過去の出来事や時代を解説する本' },
      { value: '哲学・思想', description: '哲学者や思想を解説する本' },
      { value: '心理学', description: '人の心や行動の仕組みを扱う本' },
      { value: '宗教', description: '宗教の教えや歴史を扱う本' },
      { value: '社会・政治', description: '社会問題や政治のしくみを扱う本' },
      { value: '地理・紀行', description: '各地の地理や旅の記録' },
      { value: '言語・言語学', description: '言葉の成り立ちや仕組みを扱う本' },
      { value: '民俗学', description: '地域の風習や伝承を研究する本' },
    ],
  },
  {
    name: 'genre_business',
    value: 'ビジネス・経済',
    description: '仕事やお金、経済に関する本',
    genres: [
      { value: '経営・戦略', description: '会社の経営や戦略を考える本' },
      { value: 'マーケティング', description: '商品の売り方や市場の分析を扱う本' },
      { value: '会計・財務', description: '簿記や決算、財務の知識を扱う本' },
      { value: '投資・資産運用', description: '株や投資信託などの運用を扱う本' },
      { value: '自己啓発', description: '考え方や習慣を変えて成長をめざす本' },
      { value: '仕事術・スキル', description: '仕事の進め方や実務の技術を扱う本' },
      { value: '起業', description: '会社を立ち上げる方法を扱う本' },
      { value: '経済学', description: '経済の理論やしくみを解説する本' },
      { value: 'キャリア・転職', description: '働き方や転職を考える本' },
      { value: 'リーダーシップ', description: 'チームや組織を率いる方法を扱う本' },
      { value: '法律・法務', description: '法律の知識や契約などの実務を扱う本' },
    ],
  },
  {
    name: 'genre_science',
    value: '理工・IT',
    description: '科学・技術・コンピューターに関する本',
    genres: [
      { value: 'プログラミング', description: 'プログラミング言語や開発の方法を扱う本' },
      { value: 'AI・データサイエンス', description: '人工知能やデータ分析を扱う本' },
      { value: 'ネットワーク・セキュリティ', description: '通信やコンピューターの安全を扱う本' },
      { value: '数学', description: '数学の理論や問題を扱う本' },
      { value: '物理', description: '物理学の理論や現象を扱う本' },
      { value: '化学', description: '物質の性質や反応を扱う本' },
      { value: '生物', description: '生き物のしくみや進化を扱う本' },
      { value: '天文・宇宙', description: '星や宇宙について扱う本' },
      { value: '工学・ものづくり', description: '機械や電気、製造の技術を扱う本' },
      { value: '医学・健康科学', description: '医学や看護などの専門的な本' },
      { value: '環境・エネルギー', description: '環境問題やエネルギーを扱う本' },
      { value: '農業・食品科学', description: '農業や食品の科学を扱う本' },
    ],
  },
  {
    name: 'genre_hobby',
    value: '趣味・実用',
    description: '趣味や遊び、実用的な楽しみの本',
    genres: [
      { value: '手芸・ハンドメイド', description: '編み物や裁縫などの作り方' },
      { value: '園芸・ガーデニング', description: '植物の育て方や庭づくり' },
      { value: '旅行ガイド', description: '旅行先の観光情報をまとめたガイドブック' },
      { value: 'スポーツ・アウトドア', description: 'スポーツの技術やキャンプ・登山' },
      { value: '釣り', description: '釣りの技術や釣り場の案内' },
      { value: 'ペット', description: '動物の飼い方や育て方' },
      { value: '写真・カメラ', description: '写真の撮り方やカメラの使い方' },
      { value: '音楽・楽器', description: '楽器の演奏方法や楽譜' },
      { value: '将棋・囲碁・ゲーム', description: 'ボードゲームやゲームの攻略' },
      { value: '鉄道・乗り物', description: '鉄道や車、飛行機などの乗り物' },
      { value: '占い', description: '星占いや手相などの占い' },
    ],
  },
  {
    name: 'genre_life',
    value: '暮らし・健康',
    description: '料理や家事など家庭の暮らしと、体の健康に関する本',
    genres: [
      { value: '料理・レシピ', description: '料理の作り方やレシピ集' },
      { value: '家事・掃除', description: '掃除や洗濯など家事のコツ' },
      { value: 'インテリア・住まい', description: '部屋づくりや家の購入・リフォーム' },
      { value: 'ダイエット・美容', description: '体型づくりやスキンケア' },
      { value: '健康・家庭の医学', description: '一般向けの病気や健康の知識' },
      { value: '妊娠・出産・育児', description: '妊娠から子育てまでの実用書' },
      { value: '介護', description: '家族の介護の方法や制度' },
      { value: '冠婚葬祭・マナー', description: '儀式や日常のマナー' },
      { value: 'お金・節約', description: '家計管理や節約の方法' },
      { value: '防災', description: '災害への備えや避難の方法' },
      { value: 'メンタルヘルス', description: '心の健康やストレスとの付き合い方' },
    ],
  },
  {
    name: 'genre_kids',
    value: '子ども・学習',
    description: '子ども向けの本と、学習・受験の本',
    genres: [
      { value: '絵本', description: '絵が中心の幼い子ども向けの本' },
      { value: '児童書', description: '小学生向けの読み物' },
      { value: '図鑑', description: '生き物や乗り物などを写真や絵で紹介する本' },
      { value: '小中学生の学習参考書', description: '小中学生の勉強用の参考書やドリル' },
      { value: '大学受験', description: '大学入試の対策本' },
      { value: '資格試験', description: '資格や検定の試験対策' },
      { value: '語学学習', description: '外国語を学ぶための教材' },
      { value: '教育論', description: '教育や子育ての考え方を論じる本' },
      { value: '知育', description: '幼児の考える力を伸ばす遊びの本' },
      { value: '辞書・辞典', description: '国語辞典や英和辞典など' },
    ],
  },
  {
    name: 'genre_art',
    value: 'アート・エンタメ',
    description: '芸術や漫画、映像などの娯楽の本',
    genres: [
      { value: '漫画', description: 'コミック作品' },
      { value: '画集・イラスト集', description: '絵画やイラストの作品集' },
      { value: '写真集', description: '写真家やタレントの写真作品集' },
      { value: 'デザイン', description: 'グラフィックやプロダクトのデザイン' },
      { value: '建築', description: '建築作品や建築の考え方' },
      { value: '映画', description: '映画の評論やガイド' },
      { value: '演劇・舞台', description: '演劇や舞台芸術' },
      { value: '芸能・タレント本', description: '芸能人の本やインタビュー集' },
      { value: 'アニメ・声優', description: 'アニメ作品や声優の本' },
      { value: 'お笑い', description: 'お笑い芸人やコントの本' },
      { value: '音楽評論', description: '音楽やアーティストについての評論' },
    ],
  },
  {
    name: 'genre_magazine',
    value: '雑誌',
    description: '定期的に発行される雑誌',
    genres: [
      { value: '週刊誌', description: 'ニュースや話題を扱う週刊の雑誌' },
      { value: 'ファッション誌', description: '服やおしゃれを扱う雑誌' },
      { value: '経済誌', description: 'ビジネスや経済を扱う雑誌' },
      { value: '情報誌', description: '地域のお店やイベントを紹介する雑誌' },
      { value: '趣味の雑誌', description: 'キャンプや車など特定の趣味を扱う雑誌' },
      { value: '文芸誌', description: '小説や評論を載せる雑誌' },
      { value: '専門誌・学術誌', description: '特定分野の専門家向けの雑誌' },
      { value: '子ども向け雑誌', description: '子ども向けの学習・娯楽雑誌' },
      { value: 'パズル・クイズ誌', description: 'クロスワードや数独などの雑誌' },
    ],
  },
]

const ALL_GENRES = GENRE_GROUPS.flatMap((g) => g.genres)

export const GENRE_FLAT_QUESTIONS: Question[] = [
  {
    kind: 'choice',
    name: 'genre',
    instructions: 'この本（雑誌）のジャンルはどれか？ いちばん近いものを1つ選ぶ。',
    options: ALL_GENRES,
  },
]

export const GENRE_TWO_STAGE_QUESTIONS: Question[] = [
  {
    kind: 'choice',
    name: 'genre_major',
    instructions: 'この本（雑誌）の大分類はどれか？',
    options: GENRE_GROUPS.map((g) => ({ value: g.value, description: g.description })),
  },
  ...GENRE_GROUPS.map(
    (g): Question => ({
      kind: 'choice',
      name: g.name,
      instructions: `この本（雑誌）が「${g.value}」に分類されるとしたら、小分類はどれか？`,
      options: g.genres,
    }),
  ),
]

// 1段階版と2段階版で同じサンプルを使い、結果を比べられるようにする（架空の本・雑誌の紹介文）
const GENRE_SAMPLES = [
  {
    text: '密室で起きた殺人事件を、引退した元刑事と新米記者が追う長編。最後に意外な真犯人が明かされる。',
    note: '期待：ミステリー（警察小説とも迷う）',
  },
  {
    text: '毎日10分でできる作り置きおかず120品。冷凍保存のコツも紹介。',
    note: '期待：料理・レシピ',
  },
  {
    text: 'Python で機械学習を始める入門書。数学が苦手な人向けに、手を動かしながら学べる。',
    note: 'プログラミングと AI・データサイエンスで割れやすい',
  },
  {
    text: '戦国時代を生きた武将の生涯を、史料をもとに描いた物語。',
    note: '歴史・時代小説と伝記・自伝で割れやすい',
  },
  {
    text: '月刊。毎号、全国のキャンプ場と新しいアウトドア用品を特集する。',
    note: '趣味の雑誌とスポーツ・アウトドアで割れやすい（2段階版では大分類が雑誌になるか）',
  },
]

// ---- 問い合わせのタグ付け（Noul・100問）----
// ネット書店の問い合わせに付けるタグ。1タグ＝1つの Noul（はい／いいえ）
const TAGS: [name: string, label: string][] = [
  // 注文
  ['order_cancel', '注文のキャンセル'],
  ['order_change_address', '注文後の届け先の変更'],
  ['order_change_quantity', '注文の数量の変更'],
  ['order_add_item', '注文への商品の追加'],
  ['order_status', '注文状況の確認'],
  ['order_confirmation_missing', '注文確認メールが届かない'],
  ['order_duplicate', '同じ商品を重複して注文した'],
  ['order_history', '過去の注文履歴の確認'],
  ['order_preorder', '予約注文'],
  ['order_out_of_stock', '在庫切れ・入荷予定'],
  ['order_gift_wrapping', 'ギフト包装・のし'],
  ['stock_notification', '入荷のお知らせの登録'],
  ['release_date', '発売日の確認'],
  // 配送
  ['delivery_delay', '配送の遅れ'],
  ['delivery_not_received', '配送済みなのに届いていない'],
  ['delivery_wrong_address', '別の住所に届いた'],
  ['delivery_date', '配達日時の指定'],
  ['delivery_redelivery', '再配達の依頼'],
  ['delivery_tracking', '配送状況の追跡'],
  ['delivery_overseas', '海外への配送'],
  ['delivery_box_damaged', '配送中の箱の破損'],
  ['delivery_partial', '分割配送'],
  ['delivery_store_pickup', 'コンビニ・店舗での受け取り'],
  ['delivery_fee', '送料'],
  ['delivery_drop_off', '置き配'],
  ['delivery_packaging', '過剰包装・梱包の大きさ'],
  // 商品
  ['product_damaged', '商品の破損・傷'],
  ['product_wrong_item', '注文と違う商品が届いた'],
  ['product_missing_item', '付録や同梱物が入っていない'],
  ['product_page_defect', '落丁・乱丁'],
  ['product_dirty', '商品の汚れ'],
  ['product_edition', '版・刷の違い'],
  ['product_bonus', '購入特典'],
  ['product_content_question', '本の内容についての質問'],
  ['product_recommendation', 'おすすめの本を知りたい'],
  ['product_isbn', 'ISBN・書誌情報'],
  ['product_used_condition', '中古品の状態'],
  ['magazine_subscription', '雑誌の定期購読'],
  // 返品・返金
  ['return_request', '返品の依頼'],
  ['exchange_request', '交換の依頼'],
  ['refund_request', '返金の依頼'],
  ['refund_status', '返金の状況の確認'],
  ['return_shipping_fee', '返品の送料'],
  ['return_deadline', '返品の期限'],
  ['cancel_fee', 'キャンセル料'],
  // 支払い
  ['payment_method', '支払い方法'],
  ['payment_error', '支払いのエラー'],
  ['double_charge', '二重請求'],
  ['receipt_invoice', '領収書・請求書'],
  ['points', 'ポイント'],
  ['coupon', 'クーポン'],
  ['gift_card', 'ギフトカード'],
  ['installment', '分割払い'],
  ['cash_on_delivery', '代金引換'],
  ['price_difference', '価格の違い・値下げ'],
  // アカウント
  ['login_problem', 'ログインできない'],
  ['password_reset', 'パスワードの再設定'],
  ['email_change', 'メールアドレスの変更'],
  ['account_delete', '退会・アカウントの削除'],
  ['membership_rank', '会員ランク・特典'],
  ['newsletter_unsubscribe', 'メールマガジンの停止'],
  ['personal_info_change', '登録情報の変更'],
  ['two_factor', '二段階認証'],
  ['account_hacked', '不正ログイン・乗っ取り'],
  ['address_book', 'お届け先リストの管理'],
  ['privacy_request', '個人情報の開示・削除の請求'],
  // 電子書籍
  ['ebook_download', '電子書籍のダウンロード'],
  ['ebook_device', '電子書籍の対応端末'],
  ['ebook_purchase_missing', '購入した電子書籍が表示されない'],
  ['ebook_refund', '電子書籍の返金'],
  ['ebook_viewer_bug', '電子書籍ビューアの不具合'],
  ['ebook_format', '電子書籍のファイル形式'],
  ['ebook_sample', '試し読み'],
  ['ebook_gift', '電子書籍のプレゼント'],
  // サイト・アプリ
  ['site_error', 'サイトのエラー'],
  ['app_crash', 'アプリが落ちる・起動しない'],
  ['search_problem', '検索でうまく見つからない'],
  ['cart_problem', 'カートの不具合'],
  ['slow_site', 'サイトの表示が遅い'],
  ['display_issue', '表示の崩れ'],
  ['wishlist', 'ほしい物リスト'],
  ['notification_settings', '通知の設定'],
  // 法人・その他
  ['corporate_order', '法人・大量の注文'],
  ['library_school', '図書館・学校からの注文'],
  ['author_publisher', '著者・出版社からの連絡'],
  ['affiliate', 'アフィリエイト'],
  ['recruitment', '採用への応募・問い合わせ'],
  ['media_inquiry', '取材の申し込み'],
  ['praise', 'お礼・ほめ言葉'],
  ['suggestion', '要望・改善の提案'],
  ['spam_unrelated', '書店と関係のない内容・迷惑メール'],
  // 感情・対応の注意
  ['angry', '強い不満・怒り'],
  ['urgent', '急ぎの対応を求めている'],
  ['repeat_contact', '何度目かの問い合わせ'],
  ['escalation_request', '責任者の対応を求めている'],
  ['legal_threat', '法的措置・消費者センターへの相談をほのめかしている'],
  ['personal_info_included', '電話番号・住所などの個人情報が書かれている'],
  ['needs_guidance', '操作に不慣れで手順の説明が必要'],
  ['foreign_language', '日本語以外の言語で書かれている'],
  ['gift_purpose', '贈り物としての購入'],
]

export const TAG_QUESTIONS: Question[] = TAGS.map(([name, label]) => ({
  kind: 'predicate',
  name: `tag_${name}`,
  instructions: `この問い合わせは「${label}」に当てはまるか？`,
}))

export const STRESS_SAMPLE_GROUPS = [
  {
    title: '【耐久テスト】都道府県あてクイズ（Choice・47択）',
    description: '47都道府県から1つを選ぶ。選択肢は日本語名だけで、説明文はない',
    questions: PREFECTURE_QUESTIONS,
    samples: [
      { text: '日本最北端の宗谷岬があり、面積がいちばん大きい都道府県。', note: '期待：北海道（答えがはっきりしている）' },
      { text: '県庁所在地は那覇市で、首里城がある。', note: '期待：沖縄県（答えがはっきりしている）' },
      { text: '富士山がよく見える県。', note: '静岡県と山梨県などで割れるはず（候補が複数）' },
    ],
  },
  {
    title: '【耐久テスト】本のジャンル（Choice・100択）',
    description: `本・雑誌の細かいジャンル${ALL_GENRES.length}個から1つを選ぶ。下の2段階版と同じサンプルで結果を比べられる`,
    questions: GENRE_FLAT_QUESTIONS,
    samples: GENRE_SAMPLES,
  },
  {
    title: '【耐久テスト】本のジャンル・2段階版（大分類→小分類）',
    description:
      `大分類（${GENRE_GROUPS.length}択）と、大分類ごとの小分類（各${Math.min(...GENRE_GROUPS.map((g) => g.genres.length))}〜` +
      `${Math.max(...GENRE_GROUPS.map((g) => g.genres.length))}択）を1回のリクエストでまとめて聞く。` +
      '使う答えは、genre_major で選ばれた大分類に対応する行の小分類（関係のない大分類の行も、念のため答えが出る）',
    questions: GENRE_TWO_STAGE_QUESTIONS,
    samples: GENRE_SAMPLES,
  },
  {
    title: '【耐久テスト】問い合わせのタグ付け（Noul・100問）',
    description: `ネット書店の問い合わせに付けるタグ${TAGS.length}個を、1タグ＝1つの Noul（はい／いいえ）で一度に判定する`,
    questions: TAG_QUESTIONS,
    samples: [
      {
        label: '配送遅れ＋二重請求（何度目かの問い合わせ）',
        text: '先週注文した本がまだ届きません。追跡番号を見ても荷物が動いていないです。しかも同じ注文で2回請求されています。至急確認してください！ 問い合わせるのはもう3回目です。',
        note: '期待：delivery_delay・delivery_tracking・double_charge・urgent・repeat_contact・angry など',
      },
      {
        label: '付録の欠品＋破損＋定期購読',
        text: '届いた雑誌の付録が入っておらず、表紙も破れていました。交換をお願いしたいです。あと、来月号から定期購読に切り替えたいのですが、ポイントは使えますか？',
        note: '期待：product_missing_item・product_damaged・exchange_request・magazine_subscription・points など',
      },
    ],
  },
]
