# Jev x OpenAI Decisions API Playground

架空の本・雑誌ECサイト「ポチッとモール」のカスタマーサポートを題材に、同じ問い合わせ文を
TypeSafe の **Jev** と OpenAI の **Decisions API** に同時に投げ、判定結果と応答時間を左右に並べて比べるデモです。
DX道場（2026/10/14）のデモ用に作りました。

<!-- TODO: 画面のスクリーンショット（APIキーが映っていないもの）を docs/screenshot.png に置いてリンクする -->

> [!IMPORTANT]
> - **デモ・学習用**です。本番運用は想定していません。
> - **TypeSafe AI 社・OpenAI 社の公式ツールではありません。**

## できること

- 問い合わせ文を入力して「判定する」を押すと、Jev と Decisions API を**並列に**呼び出します
- 問い合わせ文（State）の横で、判定する問い（Questions）を追加・編集・削除できます。種類は Choice・Score・Noul（predicate）です。
  変更はメモリにのみ保持し、再読み込みや「初期値に戻す」で元に戻ります。サンプルを押すと State と Questions の両方が置き換わります
- 初期値の問い：担当の振り分け（route／Choice）、お客さんの態度（attitude／Score）、本人確認の要否（needs_verification／Noul）、
  商品の破損の有無（visible_damage／Noul）と程度（damage_level／Score）
- 「画像」の付いた問いは、商品写真を添付したとき（ボタンから選ぶか、コピーして貼り付け）だけ判定します。
  画像の判定は Decisions API のみです（Jev は画像入力に非対応）
- 選ばれた選択肢、選択肢ごとの確率、Confidence、応答時間、モデル名（レスポンスに含まれる実際の値）、
  トークン数、推定課金額を左右に並べて表示します
- 「JSONを表示」で、各 API に送ったリクエストと返ってきたレスポンスの JSON（本体のみ）を確認・コピーできます。
  そのまま各社の Playground や curl に貼り付けて再現できます
- エラー時はステータスコードとエラー本体を表示します

## 動作環境

- Node.js 24（`.nvmrc` 参照。`nvm use` で切り替えられます）
- ローカルで `npm run dev` して使う前提です（デプロイは想定していません）

## 起動手順

```bash
git clone <このリポジトリのURL>
cd decisions-api-playground
npm install
npm run dev
```

ブラウザで http://localhost:3000 を開き、「設定」タブで APIキーを入力してから「判定」タブで試します。

## APIキー

| API | キーの取得先 |
| --- | --- |
| Jev（TypeSafe） | https://console.typesafe.ai/keys |
| Decisions API（OpenAI） | https://platform.openai.com/api-keys |

- どちらも**利用には各社のクレジット（料金）が必要**です。
- キーは画面で入力し、ブラウザのメモリ（React の state）にのみ保持します。**再読み込みで消えます**。
  localStorage・sessionStorage・Cookie・ファイルなど、どこにも保存しません。
- キーは判定のたびに、手元で動いている Next.js の開発サーバーを経由して各社の API に送られます。
  それ以外の宛先には送信しません。開発サーバーもキーを保存・ログ出力しません。
- **デモ専用のキーを作り、利用額の上限を設定し、使用後は無効化することを強く推奨します。**

## 入力内容についての注意

入力した文章と添付した画像は各社の API に送信されます。**個人情報や社内の実データは入力しないでください。**
サンプルの問い合わせ文はすべて架空のものです。

### 画像について

- サンプル画像は同梱していません。試すときは、**自分で撮影した写真**（例：角が折れた本、破れたカバー）を使ってください。
- 人の顔・住所・伝票の番号などが写っている写真は使わないでください。
- Web 検索で見つけた画像など、利用条件がわからない画像を使ったり、このリポジトリに追加したりしないでください。

## 各 API の提供状況（2026-10-10 時点で確認）

- **OpenAI Decisions API**：公開ベータ（GA 予定とされています）。使えるモデルは `gpt-6-luna` のみ。
- **TypeSafe Jev**：このデモでは `jev-latest` ではなく固定バージョン `jev-1.13.0` を使っています。
  ドキュメント上、主な学習言語は英語で、日本語を含むその他の言語は精度が同等ではないとされています。

どちらも仕様変更により、予告なく動かなくなる可能性があります。

## しくみ

```
ブラウザ（React / MUI）
  │ axios（キーは x-api-key ヘッダー）
  ▼
Next.js Route Handler（app/api/jev, app/api/decisions）
  │ 公式 SDK（@typesafe-ai/sdk / openai）
  ▼
TypeSafe API / OpenAI API
```

- TypeSafe API はブラウザからの直接呼び出しを CORS で拒否しているため（2026-10-10 確認）、
  Next.js のサーバー側から呼び出しています。OpenAI も同じ形にそろえています。
- 両 API は形式が異なる（Decisions API は questions・answers が配列、Jev は辞書）ため、
  内部では共通の形式（`lib/types.ts`）で扱い、API ごとの変換を `lib/jev.ts`・`lib/decisions.ts` に分けています。
- 応答時間は、サーバー側で SDK 呼び出しの前後を `performance.now()` で計測した値です。
  あわせて、ブラウザから見た往復時間（axios 呼び出しの前後）も表示します。
  計測を1回の呼び出しにそろえるため、SDK の自動リトライは無効にしています。
- JSON の表示には Monaco Editor を使い、CDN からではなく `monaco-editor` パッケージを同梱して読み込みます。

## 開発者向け

### コミット前の秘密情報チェック

APIキーやトークンをコミットしないよう、コミット前に次を実行して何も出ないことを確認してください。

```bash
git diff --cached | grep -n -E "sk-[A-Za-z0-9_-]{10,}|Bearer [A-Za-z0-9._-]{10,}|api[_-]?key\s*[:=]\s*['\"][^'\"]{10,}"
```

履歴全体を確認する場合：

```bash
git log -p --all | grep -n -E "sk-[A-Za-z0-9_-]{10,}|Bearer [A-Za-z0-9._-]{10,}"
```

スクリーンショットを追加するときは、設定画面やキーが映っていないことを確認してください。

### 主なファイル

| パス | 内容 |
| --- | --- |
| `lib/types.ts` | 共通形式（問い・選択肢・結果） |
| `lib/questions.ts` | 判定する問いとサンプル入力 |
| `lib/jev.ts` / `lib/decisions.ts` | 共通形式 ⇔ 各 API の形式の変換 |
| `lib/apiClient.ts` | ブラウザ → Route Handler の呼び出し（axios）と並列実行 |
| `app/api/*/route.ts` | 各社 SDK の呼び出しと時間計測 |
| `components/` | 画面（MUI） |
| `docs/SPEC.md` | 指示書 |

## 参考リンク

- OpenAI Decisions API：https://developers.openai.com/api/docs/guides/decisions
- TypeSafe（Jev）ドキュメント：https://docs.typesafe.ai/
- TypeSafe API リファレンス：https://docs.typesafe.ai/api
- TypeSafe JavaScript SDK：https://docs.typesafe.ai/sdk/javascript

## ライセンス

[MIT License](./LICENSE)
