#!/usr/bin/env node
// Valida os specs SDD em docs/sdd/specs/*/spec.md.
//
// Regras:
//   A) Todo diretorio de spec precisa ter spec.md.
//   B) Todo spec.md precisa ter uma linha "> Status:" no topo.
//   C) O status precisa comecar com vocabulario canonico:
//        Draft | Approved | In Progress | Done
//   D) "In Progress" falha para evitar deploy de trabalho inacabado.

import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const SPECS_DIR = join(ROOT, 'docs', 'sdd', 'specs')
const CANONICAL = ['Draft', 'Approved', 'In Progress', 'Done']

function parseStatus(specPath) {
  const text = readFileSync(specPath, 'utf8')
  for (const line of text.split('\n').slice(0, 15)) {
    const match = line.match(/^>\s*Status:\s*(.+?)\s*$/)
    if (match) return match[1]
  }
  return null
}

function canonicalKeyword(statusText) {
  for (const keyword of [...CANONICAL].sort((a, b) => b.length - a.length)) {
    const re = new RegExp(`^${keyword}\\b`, 'i')
    if (re.test(statusText)) return keyword
  }
  return null
}

function main() {
  if (!existsSync(SPECS_DIR)) {
    console.error(`sdd-check: pasta nao encontrada: ${SPECS_DIR}`)
    process.exit(1)
  }

  const slugs = readdirSync(SPECS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()

  const errors = []
  const warnings = []

  for (const slug of slugs) {
    const specPath = join(SPECS_DIR, slug, 'spec.md')
    if (!existsSync(specPath)) {
      errors.push(`${slug}: falta spec.md`)
      continue
    }

    const statusText = parseStatus(specPath)
    if (!statusText) {
      errors.push(`${slug}: nenhuma linha "> Status:" encontrada em spec.md`)
      continue
    }

    const keyword = canonicalKeyword(statusText)
    if (!keyword) {
      errors.push(
        `${slug}: status "${statusText}" nao comeca com vocabulario canonico ` +
          `(${CANONICAL.join(' | ')})`,
      )
      continue
    }

    if (keyword === 'In Progress') {
      errors.push(
        `${slug}: status "In Progress" nao pode ir para main; ` +
          'finalize como Done ou volte para Approved.',
      )
    } else if (keyword !== 'Done') {
      warnings.push(`${slug}: status "${keyword}" ainda nao Done; confirme se e intencional.`)
    }
  }

  for (const warning of warnings) console.warn(`Aviso: ${warning}`)

  if (errors.length > 0) {
    for (const error of errors) console.error(`Erro: ${error}`)
    console.error(`\nsdd-check: ${errors.length} problema(s) de status nos specs.`)
    process.exit(1)
  }

  console.log(`sdd-check: ${slugs.length} spec(s) com status coerente.`)
}

main()
