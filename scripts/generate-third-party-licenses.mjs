// サードパーティーライセンスの一覧（public/third-party-licenses.txt）を作る。
// npm run build / npm run dev の前に自動で実行される（package.json の prebuild / predev）。
// package-lock.json から本番用の依存（devDependencies 以外）を拾い、node_modules にある各パッケージの
// ライセンス種別と LICENSE ファイルの全文をまとめる。外部ツールは使わず Node.js の標準機能だけで書いている。
// 中身は英語にする（ライセンス文の原文がほぼ英語で、.txt は環境によって日本語が文字化けするため）
import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const lock = JSON.parse(fs.readFileSync(path.join(root, 'package-lock.json'), 'utf8'))
// LICENSE・COPYING・NOTICE のほか、同梱している別のオープンソースの表示（monaco-editor の ThirdPartyNotices.txt など）も拾う
const LICENSE_FILE = /^(licen[cs]e|copying|notice)([.-].*)?$|notices?\.|^copyrightnotice/i

const packages = new Map()
for (const [key, info] of Object.entries(lock.packages ?? {})) {
  // ルート（このアプリ自体）と、開発時だけ使う依存は除く
  if (!key || info.dev || info.devOptional) continue
  const dir = path.join(root, key)
  // ほかの OS 向けの optional な依存（sharp のバイナリなど）は、この環境に入っていなければ除く
  if (!fs.existsSync(dir)) continue
  const name = key.slice(key.lastIndexOf('node_modules/') + 'node_modules/'.length)
  const id = `${name}@${info.version}`
  if (packages.has(id)) continue

  let pkg = {}
  try {
    pkg = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'))
  } catch {
    // package.json が読めなくても、lock の情報だけで載せる
  }
  const files = fs
    .readdirSync(dir)
    .filter((f) => LICENSE_FILE.test(f) && fs.statSync(path.join(dir, f)).isFile())
    .sort()
  const repository = typeof pkg.repository === 'string' ? pkg.repository : pkg.repository?.url
  packages.set(id, {
    name,
    version: info.version,
    license: info.license ?? pkg.license ?? '(not specified)',
    url: pkg.homepage ?? repository ?? '',
    texts: files.map((f) => ({ file: f, text: fs.readFileSync(path.join(dir, f), 'utf8').trim() })),
  })
}

const list = [...packages.values()].sort((a, b) => a.name.localeCompare(b.name) || a.version.localeCompare(b.version))
const rule = '='.repeat(80)
const own = fs.readFileSync(path.join(root, 'LICENSE'), 'utf8').trim()

const out = [
  'Jev x OpenAI Decisions API Playground - Licenses',
  '',
  'This file is generated automatically by scripts/generate-third-party-licenses.mjs.',
  'Source: https://github.com/eXpresser-UXM/decisions-api-playground',
  '',
  rule,
  'This application',
  rule,
  own,
  '',
  rule,
  `Third-party software (${list.length} packages used in production)`,
  rule,
  '',
  ...list.map((p) => `- ${p.name}@${p.version} (${p.license})`),
  '',
  ...list.flatMap((p) => [
    rule,
    `${p.name}@${p.version}`,
    `License: ${p.license}`,
    ...(p.url ? [`URL: ${p.url}`] : []),
    rule,
    '',
    ...(p.texts.length
      ? p.texts.flatMap((t) => [...(p.texts.length > 1 ? [`--- ${t.file} ---`] : []), t.text, ''])
      : ['(No license file is included in this package. See the license field above.)', '']),
  ]),
].join('\n')

const outFile = path.join(root, 'public', 'third-party-licenses.txt')
fs.mkdirSync(path.dirname(outFile), { recursive: true })
fs.writeFileSync(outFile, out + '\n', 'utf8')
console.log(`third-party licenses: ${list.length} packages -> ${path.relative(root, outFile)}`)
