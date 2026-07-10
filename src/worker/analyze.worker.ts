/// <reference lib="webworker" />
import { Parser } from '@etothepii/satisfactory-file-parser/build/parser/parser'
import { analyzeSnapshot } from '../analysis/analyze'
import { extractSave } from '../save/extract'
import type { WorkerRequest, WorkerResponse } from '../types'

const scope = self as DedicatedWorkerGlobalScope

function post(message: WorkerResponse): void {
  scope.postMessage(message)
}

scope.onmessage = ({ data }: MessageEvent<WorkerRequest>) => {
  if (data.type !== 'analyze') return
  try {
    post({ type: 'progress', progress: 0.05, message: 'Abrindo o save…' })
    const save = Parser.ParseSave(data.fileName, data.buffer, {
      throwErrors: false,
      onProgressCallback: (progress, message) => post({
        type: 'progress',
        progress: 0.05 + progress * 0.72,
        message: message || 'Lendo objetos do mundo…',
      }),
    })
    post({ type: 'progress', progress: 0.8, message: 'Montando o grafo de esteiras…' })
    const snapshot = extractSave(save)
    post({ type: 'progress', progress: 0.92, message: 'Calculando oferta e demanda…' })
    const result = analyzeSnapshot(snapshot, data.gameData)
    post({ type: 'result', result })
  } catch (error) {
    post({ type: 'error', message: error instanceof Error ? error.message : 'Não foi possível analisar este save.' })
  }
}
