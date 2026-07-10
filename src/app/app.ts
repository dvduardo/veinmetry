import type { AnalysisResult, GameData, WorkerResponse } from '../types'
import { initializeResourceMap } from './map'
import { errorView, landingView, loadingView, reportView } from './views'

let gameDataPromise: Promise<GameData> | undefined

export function startApp(app: HTMLElement): void {
  function loadGameData(): Promise<GameData> {
    gameDataPromise ??= fetch(`${import.meta.env.BASE_URL}game-data.json`).then((response) => {
      if (!response.ok) throw new Error('Não foi possível carregar os dados desta versão do jogo.')
      return response.json() as Promise<GameData>
    })
    return gameDataPromise
  }

  function landing(): void {
    app.innerHTML = landingView(import.meta.env.BASE_URL)
    bindTheme()
    const input = document.querySelector<HTMLInputElement>('#file-input')!
    const dropzone = document.querySelector<HTMLElement>('.dropzone')!
    input.addEventListener('change', () => input.files?.[0] && void analyzeFile(input.files[0]))
    dropzone.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') input.click()
    })
    for (const eventName of ['dragenter', 'dragover']) {
      dropzone.addEventListener(eventName, (event) => { event.preventDefault(); dropzone.classList.add('dragging') })
    }
    for (const eventName of ['dragleave', 'drop']) {
      dropzone.addEventListener(eventName, (event) => { event.preventDefault(); dropzone.classList.remove('dragging') })
    }
    dropzone.addEventListener('drop', (event) => {
      const file = event.dataTransfer?.files[0]
      if (file) void analyzeFile(file)
    })
  }

  function bindTheme(): void {
    const button = document.querySelector<HTMLButtonElement>('.theme-toggle')
    const saved = localStorage.getItem('veinmetry-theme')
    if (saved) document.documentElement.dataset.theme = saved
    button?.addEventListener('click', () => {
      const next = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light'
      document.documentElement.dataset.theme = next
      localStorage.setItem('veinmetry-theme', next)
    })
  }

  function loading(fileName: string): void {
    app.innerHTML = loadingView(fileName)
  }

  function setProgress(progress: number, message: string): void {
    const percent = Math.round(progress * 100)
    const track = document.querySelector<HTMLElement>('.progress-track')
    const fill = track?.querySelector<HTMLElement>('span')
    if (track) track.setAttribute('aria-valuenow', String(percent))
    if (fill) fill.style.width = `${percent}%`
    const label = document.querySelector<HTMLElement>('#progress-message')
    if (label) label.textContent = message
  }

  async function analyzeFile(file: File): Promise<void> {
    if (!file.name.toLowerCase().endsWith('.sav')) {
      showError('Escolha um arquivo com extensão .sav.')
      return
    }
    loading(file.name)
    try {
      const [gameData, buffer] = await Promise.all([loadGameData(), file.arrayBuffer()])
      const worker = new Worker(new URL('../worker/analyze.worker.ts', import.meta.url), { type: 'module' })
      worker.onmessage = ({ data }: MessageEvent<WorkerResponse>) => {
        if (data.type === 'progress') setProgress(data.progress, data.message)
        if (data.type === 'error') { worker.terminate(); showError(data.message) }
        if (data.type === 'result') { worker.terminate(); renderReport(data.result) }
      }
      worker.onerror = () => { worker.terminate(); showError('O analisador encontrou um erro inesperado.') }
      worker.postMessage({ type: 'analyze', fileName: file.name, buffer, gameData }, [buffer])
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Não foi possível iniciar a análise.')
    }
  }

  function renderReport(result: AnalysisResult): void {
    app.innerHTML = reportView(result)
    bindTheme()
    document.querySelectorAll('.brand-button, .new-file').forEach((button) => button.addEventListener('click', landing))
    document.querySelectorAll<HTMLButtonElement>('.filters button').forEach((button) => {
      button.addEventListener('click', () => {
        document.querySelectorAll('.filters button').forEach((candidate) => candidate.classList.remove('active'))
        button.classList.add('active')
        const filter = button.dataset.filter
        document.querySelectorAll<HTMLElement>('.line-card').forEach((card) => {
          card.hidden = filter !== 'all' && !card.classList.contains(filter!)
        })
      })
    })
    initializeResourceMap(result)
  }

  function showError(message: string): void {
    app.innerHTML = errorView(message)
    document.querySelector('.error-screen button')?.addEventListener('click', landing)
  }

  landing()
}
