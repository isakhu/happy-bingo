import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

const root = resolve(process.cwd())
const failures = []
const fail = (message) => failures.push(message)
const requiredVoices = [
  ...Array.from({ length: 15 }, (_, i) => `b${i + 1}.mp3`),
  ...Array.from({ length: 15 }, (_, i) => `i${i + 16}.mp3`),
  ...Array.from({ length: 15 }, (_, i) => `n${i + 31}.mp3`),
  ...Array.from({ length: 15 }, (_, i) => `g${i + 46}.mp3`),
  ...Array.from({ length: 15 }, (_, i) => `o${i + 61}.mp3`),
  'Goodbingo.mp3', 'cartellawu.mp3', 'chewatawu.mp3', 'pause.mp3',
]

const cardSource = readFileSync(join(root, 'src', 'main', 'customer-cards.ts'), 'utf8')
const cards = []
const cardPattern = /\{id:(\d+),values:\[([^\]]+)\]\}/g
for (const match of cardSource.matchAll(cardPattern)) {
  cards.push({ id: Number(match[1]), values: match[2].split(',').map(Number) })
}

if (cards.length !== 100) fail(`Expected exactly 100 embedded Cartellas, found ${cards.length}.`)
const ids = new Set()
const ranges = [[1, 15], [16, 30], [31, 45], [46, 60], [61, 75]]
for (const card of cards) {
  if (!Number.isInteger(card.id) || card.id < 1 || card.id > 100) fail(`Invalid Cartella id: ${card.id}.`)
  if (ids.has(card.id)) fail(`Duplicate Cartella id: ${card.id}.`)
  ids.add(card.id)
  if (card.values.length !== 25) fail(`Cartella ${card.id} has ${card.values.length} cells; expected 25.`)
  if (card.values[12] !== 0) fail(`Cartella ${card.id} center cell is not FREE/0.`)
  for (let col = 0; col < 5; col += 1) {
    const [min, max] = ranges[col]
    const seen = new Set()
    for (let row = 0; row < 5; row += 1) {
      const index = row * 5 + col
      if (index === 12) continue
      const value = card.values[index]
      if (!Number.isInteger(value) || value < min || value > max) fail(`Cartella ${card.id} cell ${index}=${value} is outside its ${min}-${max} column range.`)
      if (seen.has(value)) fail(`Cartella ${card.id} contains duplicate value ${value} in column ${col}.`)
      seen.add(value)
    }
  }
}
for (let id = 1; id <= 100; id += 1) if (!ids.has(id)) fail(`Missing Cartella id ${id}.`)

const voiceDir = join(root, 'audio', 'voices')
if (!existsSync(voiceDir)) fail('audio/voices directory is missing.')
else {
  const files = new Set(readdirSync(voiceDir).filter((file) => file.toLowerCase().endsWith('.mp3')).map((file) => file.toLowerCase()))
  if (files.size < 79) fail(`Expected at least 79 MP3 voice files, found ${files.size}.`)
  for (const file of requiredVoices) if (!files.has(file.toLowerCase())) fail(`Missing required voice asset: ${file}.`)
}

const sourceRoots = [join(root, 'src')]
const sourceFiles = []
function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'out') continue
    const path = join(dir, entry.name)
    if (entry.isDirectory()) walk(path)
    else if (/\.(ts|tsx|js|css|html)$/.test(entry.name)) sourceFiles.push(path)
  }
}
for (const dir of sourceRoots) if (existsSync(dir)) walk(dir)
for (const file of sourceFiles) {
  const content = readFileSync(file, 'utf8')
  if (/\bhttps?:\/\//i.test(content)) fail(`External URL found in offline source: ${file}.`)
}

if (failures.length) {
  console.error('Happy Bingo SYSTEM AUDIT FAILED')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('Happy Bingo SYSTEM AUDIT PASSED')
console.log(`Validated ${cards.length} Cartellas, ${requiredVoices.length} required voice assets, and ${sourceFiles.length} offline source files.`)
