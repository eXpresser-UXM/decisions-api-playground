// .env に APIキーが設定されているかどうかだけを返す（キーの値は返さない）
import { connection } from 'next/server'
import { envKey } from '@/lib/envKeys'

export type EnvStatus = { openai: boolean; typesafe: boolean }

export async function GET() {
  // ビルド時に固定されないよう、リクエストのたびに .env の状態を読む
  await connection()
  return Response.json({ openai: !!envKey('decisions'), typesafe: !!envKey('jev') } satisfies EnvStatus)
}
