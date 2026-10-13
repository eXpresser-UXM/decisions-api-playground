# Jev x OpenAI Decisions API Playground

同じ文章と問いを、TypeSafe の **Jev** と OpenAI の **Decisions API** に同時に投げて、
判定結果・応答時間・トークン数・推定課金額を左右に並べて比べるプレイグラウンドです。

**公開中のサイト：https://decisions-api-playground.vercel.app/**

![判定結果の例](docs/images/03-results.png)

## これは何のアプリ？

Jev と Decisions API は、どちらも「文章について決まった形の問いを投げると、確率付きの答えを返す」API です。
自由な文章を生成する LLM と違い、答えは選択肢・段階・はい／いいえのどれかで返り、それぞれに確率が付きます。

このアプリでは、次のようなことを2つの API で同時に試して、結果を見比べられます。

- 問い合わせの振り分け、ヘルプデスクの分類、レビューの分析、メールの仕分けなど、業務でありがちな判定
- LLM の入出力のガードレール、G-Eval による回答の品質評価
- 問いの文面を書き換えると答えがどう変わるか、日本語と英語で結果がどう違うか
- 選択肢が47〜183個ある Choice や、100問の Noul を一度に聞いたときの答えと応答時間（耐久テスト）

問いの種類は3つです（呼び方は API によって少し違います）。

| 種類 | 何をするか |
| --- | --- |
| Choice | 用意した選択肢の中から1つ選ぶ（例：どの担当に回すか） |
| Score | 低い → 高いの段階で評価する（例：怒りの度合い、緊急度） |
| Noul（Jev）／ predicate（Decisions API） | 「はい／いいえ」で答えられる問いに、「はい」である確率を返す（例：本人確認が必要か） |

DX道場（2026/10/14）のデモ・ハンズオン用に作りました。

## 免責事項（必ずお読みください）

> [!CAUTION]
> - **このアプリは Claude（AI）を使って作りました。** コードの正しさ・安全性・動作は一切保証しません。
> - **APIキーの扱いに注意してください。** 入力した APIキーは、このアプリのサーバーを経由して各社の API に送られます。
>   コードではキーを保存もログ出力もしませんが、**デモ専用のキーを作り、利用額の上限を設定し、使い終わったらすぐに削除（無効化）してください。**
> - **何が起きても、作者は一切対応しません。** 不具合の修正、質問への回答、キーの漏えいや料金・損害への対応などは行いません。
>   **すべて自己責任で**使ってください。
> - **TypeSafe AI 社・OpenAI 社の公式ツールではありません。** デモ・学習用であり、本番での利用は想定していません。
> - 入力した文章と画像は各社の API に送信されます。**個人情報や社内の実データは入力しないでください。**
> - 各社の API の仕様が変わると、予告なく動かなくなることがあります（2026-10-12 時点で動作を確認）。

## とりあえず使ってみる

インストールは不要です。ブラウザで次のサイトを開くだけで使えます。

1. https://decisions-api-playground.vercel.app/ を開く
2. APIキーを用意する
   - ハンズオンなど、サーバーにキーが設定されているときは不要です（「判定」タブから始まります）
   - それ以外のときは「設定」タブで、[OpenAI](https://platform.openai.com/api-keys) と [TypeSafe](https://console.typesafe.ai/keys) のキーを入力します（どちらも利用料金がかかります）
3. 「サンプル一覧を開く」からサンプルを選び、「判定する」を押す
4. 左（Jev）と右（Decisions API）の結果を見比べる

画面の見方や、問いの追加・編集、画像の添付などは **[プレイグラウンドの使い方](docs/usage.md)** にまとめています。

## 自分の PC で動かす（開発したい人向け）

必要なもの：[Node.js](https://nodejs.org/) 24（`.nvmrc` で指定。nvm を使っている場合は `nvm use`）と Git

```bash
git clone https://github.com/eXpresser-UXM/decisions-api-playground.git
cd decisions-api-playground
npm install
```

APIキーを毎回画面で入力しなくて済むように、`.env` を用意します（任意）。

```bash
cp .env.sample .env
```

`.env` を開いて、`OPENAI_API_KEY` と `TYPESAFE_API_KEY` にキーを書きます。
エンドポイント（`OPENAI_BASE_URL`／`TYPESAFE_BASE_URL`）には各社の既定値が入っています。別のサーバーに向けるときだけ書き換えてください。

```bash
npm run dev
```

ブラウザで **http://localhost:3000** を開くと、プレイグラウンドが表示されます。

- `.env` にキーがあれば、設定画面に「環境変数（.env）の … を使用中」と表示され、入力しなくても判定できます。画面で入力したキーはそちらが優先されます。
- `.env` のキーはサーバーの中だけで使い、ブラウザには送りません。`.env` は `.gitignore` で除外していますが、コミットしないよう注意してください。
- `.env` を書き換えたら、`npm run dev` を止めて起動し直してください。

自分の Vercel に公開する場合は **[Vercel で公開する](docs/deploy-vercel.md)** を読んでください（ハンズオンの間だけキーを用意する手順も書いています）。

### よく使うコマンド

| コマンド | 内容 |
| --- | --- |
| `npm run dev` | 開発サーバーを起動（http://localhost:3000） |
| `npm run build` | 本番用にビルド（型チェックを含む） |
| `npm run lint` | ESLint でチェック |
| `npm run licenses` | サードパーティーライセンスの一覧を作る（`dev`・`build` の前にも自動で実行） |

## ソースコードの構成

Next.js（App Router）＋ MUI で作っています。ブラウザから各社の API を直接呼ばず、Next.js のサーバー側（Route Handler）から公式 SDK で呼んでいます
（TypeSafe の API がブラウザからの直接呼び出しを CORS で拒否しているため）。

```
ブラウザ（React / MUI）
  │ axios（画面で入力したキーは x-api-key ヘッダー）
  ▼
Next.js Route Handler（app/api/jev, app/api/decisions）
  │ 公式 SDK（@typesafe-ai/sdk / openai）。キーとエンドポイントは lib/serverConfig.ts で決める
  ▼
TypeSafe API / OpenAI API
```

| パス | 中身 |
| --- | --- |
| `app/page.tsx`・`app/layout.tsx` | ページの入口と、MUI のテーマの設定 |
| `app/api/jev/route.ts` | Jev を TypeSafe の SDK で呼び、時間を計る |
| `app/api/decisions/route.ts` | Decisions API を OpenAI の SDK で呼び、時間を計る |
| `app/api/env-status/route.ts` | サーバーにキーがあるか（値は返さない）とエンドポイントを返す |
| `components/Demo.tsx` | 画面全体（タブ・判定画面・判定の実行） |
| `components/Settings.tsx` | 設定画面（APIキー・エンドポイント） |
| `components/SampleList.tsx` | サンプル一覧（Drawer） |
| `components/QuestionList.tsx`・`QuestionEditor.tsx`・`QuestionsJsonDialog.tsx` | Questions の一覧・編集・JSON での編集 |
| `components/ResultPanel.tsx` | 結果の表示（左右の行をそろえる） |
| `components/JsonModal.tsx`・`JsonEditor.tsx` | リクエスト／レスポンスの JSON 表示（Monaco Editor を同梱） |
| `components/ImageAttach.tsx` | 画像の添付・貼り付け |
| `lib/types.ts` | API に依存しない共通の形（問い・答え・結果） |
| `lib/jev.ts`・`lib/decisions.ts` | 共通の形 ⇔ 各 API の形の変換、モデル名、推定課金額の単価 |
| `lib/samples.ts`・`lib/questions.ts` | サンプル一覧と、初期の Questions |
| `lib/questionValidation.ts` | 問いの入力チェック（編集画面と JSON 編集で共通） |
| `lib/apiClient.ts` | ブラウザ → Route Handler の呼び出しと、両 API の並列実行 |
| `lib/serverConfig.ts` | サーバー側で使うキーとエンドポイントの決め方 |
| `docs/` | 使い方・Vercel での公開のドキュメントと、スクリーンショット |
| `scripts/generate-third-party-licenses.mjs` | サードパーティーライセンスの一覧（`public/third-party-licenses.txt`）を作る |
| `.env.sample` | 環境変数のひな形 |
| `vercel.json` | Vercel で Next.js としてビルドするための設定 |

### コミット前の秘密情報チェック

APIキーやトークンをコミットしないよう、コミット前に次を実行して何も出ないことを確認してください。

```bash
git diff --cached | grep -n -E "sk-[A-Za-z0-9_-]{10,}|Bearer [A-Za-z0-9._-]{10,}|_API_KEY=[^ ]+"
```

スクリーンショットを追加するときは、APIキーが映っていないことを確認してください。

## 参考リンク

- OpenAI Decisions API：https://developers.openai.com/api/docs/guides/decisions
- TypeSafe（Jev）ドキュメント：https://docs.typesafe.ai/ ／ API リファレンス：https://docs.typesafe.ai/api
- G-Eval：https://arxiv.org/abs/2303.16634 ／ DeepEval の G-Eval：https://deepeval.com/docs/metrics-llm-evals

## ライセンス

このアプリは [MIT License](./LICENSE) です。

使っているオープンソースのライセンスは、画面右下の「Licenses」から確認できます。
一覧は `npm run dev`／`npm run build` の前に `scripts/generate-third-party-licenses.mjs` が自動で作ります
（`package-lock.json` の本番用の依存と、各パッケージの LICENSE・NOTICE などのファイルから作成。生成したファイルはコミットしません）。
