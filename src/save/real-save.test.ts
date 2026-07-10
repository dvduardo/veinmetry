import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { Parser } from '@etothepii/satisfactory-file-parser/build/parser/parser'
import { describe, expect, it } from 'vitest'
import { analyzeSnapshot } from '../analysis/analyze'
import type { GameData } from '../types'
import { extractSave } from './extract'

const savePath = process.env.SAVE_PATH

describe.skipIf(!savePath)('save real', () => {
  it('parseia e produz linhas auditáveis', () => {
    const bytes = readFileSync(savePath!)
    const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)
    const save = Parser.ParseSave('integration', buffer, { throwErrors: false })
    const snapshot = extractSave(save)
    const gameData = JSON.parse(readFileSync(resolve('public/game-data.json'), 'utf8')) as GameData
    const result = analyzeSnapshot(snapshot, gameData)

    expect(snapshot.stats.objects).toBeGreaterThan(10_000)
    expect(snapshot.stats.miners).toBeGreaterThan(0)
    expect(snapshot.stats.connections).toBeGreaterThan(1_000)
    expect(result.lines.length).toBeGreaterThan(0)

    console.log(JSON.stringify({ stats: result.stats, lines: result.lines.slice(0, 8).map((line) => ({
      item: line.itemName,
      sources: line.sources.length,
      consumers: line.consumers.length,
      extraction: line.extraction,
      demand: line.demand,
      balance: line.balance,
      status: line.status,
      warnings: line.warnings,
    })) }, null, 2))
  })
})
