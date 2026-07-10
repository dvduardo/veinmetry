import type { LineBalance } from '../types'

export function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
  })[char]!)
}

export function number(value: number): string {
  return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(value)
}

export function statusText(line: LineBalance): string {
  if (line.status === 'deficit') return 'Déficit'
  if (line.status === 'balanced') return 'No limite'
  if (line.status === 'untraceable') return 'Não rastreável'
  return 'Com folga'
}
