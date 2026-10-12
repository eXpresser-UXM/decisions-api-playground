# Vercel で公開する

[README に戻る](../README.md)

自分の Vercel アカウントにこのアプリを公開する手順と注意点です。
まずは README の「[自分の PC で動かす](../README.md#自分の-pc-で動かす開発したい人向け)」で、手元で動くことを確認してください。

## 公開の手順

1. このリポジトリを自分の GitHub にフォーク（またはコピー）する
2. Vercel で「Add New → Project」から、そのリポジトリを選ぶ
3. 設定を確認する
   - **Framework Preset**：Next.js（リポジトリの `vercel.json` で Next.js に固定しているので、自動でそうなります）
   - **Output Directory**：上書きしない。上書きしていると「No Output Directory named "dist" found」で失敗します
   - **Node.js Version**：24
   - **Environment Variables**：ふだんは **APIキーを登録しない**（下記）
4. 「Deploy」を押す

## APIキーの扱い

- 公開したサイトで利用者が画面に入力したキーは、**公開したアプリのサーバー（Vercel Functions）を経由して**各社に送られます。
  コードではキーを保存もログ出力もしませんが、利用者から見ると「他人のサーバーにキーを渡す」ことになります。
  設定画面にも「使い終わったら、そのAPIキーはすぐに削除（無効化）してください」と表示しています。
- **ふだんは Vercel の環境変数に `OPENAI_API_KEY`／`TYPESAFE_API_KEY` を登録しないでください。**
  登録すると、URL を知っている人なら誰でもそのキーで判定でき、料金は登録した人に請求されます（ログインの仕組みはありません）。

## ハンズオンの間だけキーを用意しておく

参加者がキーを用意しなくても試せるように、ハンズオンの間だけサーバーにキーを登録する手順です。

1. ハンズオン専用のキーを作り、各社の管理画面で**利用額の上限を低めに**設定する
2. Vercel のプロジェクト設定 → Environment Variables で、`OPENAI_API_KEY`／`TYPESAFE_API_KEY` を登録する
3. **再デプロイする**（環境変数の変更は、新しいデプロイにだけ反映されます）
4. 設定画面に「環境変数（.env）の … を使用中」と表示されることを確認する
5. ハンズオンが終わったら：
   1. **各社の管理画面でキーを無効化する**（いちばん確実です）
   2. Vercel の環境変数を削除する
   3. **もう一度再デプロイする**（削除しても、再デプロイしないかぎり公開中のアプリはキーを持ったままです）

キーを登録している間は、URL を知っている人なら誰でも使える状態です。登録はハンズオンの直前、削除は直後にしてください。

## エンドポイント

`OPENAI_BASE_URL`／`TYPESAFE_BASE_URL` で、各社の API の宛先を変えられます（未設定なら各社の既定値）。
設定画面に現在の値を表示しますが、画面からは変更できません。画面で変えられると、サーバーに登録したキーを別のサーバーへ送らせることができてしまうためです。

## 制限

- Vercel Functions が受け取れるリクエストは **4.5MB まで**です。画像は base64 にすると約1.33倍になるため、
  元の画像で 3MB 前後を超えると送れません（`413 FUNCTION_PAYLOAD_TOO_LARGE`）。画像は1MB以内を推奨します。
- 関数は標準では米国東部（`iad1`）で動きます。画面の「応答時間（API）」は、Vercel のサーバーから各社の API までの時間です。

参考：[Vercel Functions Limits](https://vercel.com/docs/functions/limitations)、[Environment variables](https://vercel.com/docs/environment-variables)、[vercel.json](https://vercel.com/docs/project-configuration/vercel-json)
