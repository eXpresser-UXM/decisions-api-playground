// サーバーの設定を返す。APIキーは「設定されているか」だけを返し、値は返さない。
// エンドポイントは機密ではないので、画面の初期値として値を返す
import { connection } from 'next/server'
import { envKey, serverBaseUrl } from '@/lib/serverConfig'

export type EnvStatus = {
  openai: boolean
  typesafe: boolean
  baseUrls: { openai: string; typesafe: string }
}

export async function GET() {
  // ビルド時に固定されないよう、リクエストのたびに環境変数を読む
  await connection()
  return Response.json({
    openai: !!envKey('decisions'),
    typesafe: !!envKey('jev'),
    baseUrls: { openai: serverBaseUrl('decisions'), typesafe: serverBaseUrl('jev') },
  } satisfies EnvStatus)
}
