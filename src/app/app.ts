import type { AnalysisResult, GameData, WorkerResponse } from '../types'
import { initializeResourceMap } from './map'
import { errorView, landingView, loadingView, reportView } from './views'

let gameDataPromise: Promise<GameData> | undefined
let stopBrandBeltAnimations: (() => void) | undefined

export function startApp(app: HTMLElement): void {
  function loadGameData(): Promise<GameData> {
    gameDataPromise ??= fetch(`${import.meta.env.BASE_URL}game-data.json`).then((response) => {
      if (!response.ok) throw new Error('Não foi possível carregar os dados desta versão do jogo.')
      return response.json() as Promise<GameData>
    })
    return gameDataPromise
  }

  function landing(): void {
    stopBrandBeltAnimations?.()
    app.innerHTML = landingView(import.meta.env.BASE_URL)
    bindTheme()
    stopBrandBeltAnimations = startBrandBeltAnimations()
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
    stopBrandBeltAnimations?.()
    app.innerHTML = loadingView(fileName)
    stopBrandBeltAnimations = startBrandBeltAnimations()
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
    stopBrandBeltAnimations?.()
    app.innerHTML = reportView(result)
    bindTheme()
    stopBrandBeltAnimations = startBrandBeltAnimations()
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
    stopBrandBeltAnimations?.()
    app.innerHTML = errorView(message)
    stopBrandBeltAnimations = undefined
    document.querySelector('.error-screen button')?.addEventListener('click', landing)
  }

  landing()
}

interface BeltSample {
  element: HTMLElement
  x: number
}

interface BeltPhase {
  name: 'empty' | 'steady' | 'jam' | 'release' | 'recovered' | 'starved'
  duration: number
  speed: number
  spawn: number
  blocked?: boolean
}

function startBrandBeltAnimations(): () => void {
  const belts = Array.from(document.querySelectorAll<HTMLElement>('.brand-belt'))
  const stops = belts.map(startBrandBeltAnimation)
  return () => stops.forEach((stop) => stop())
}

function startBrandBeltAnimation(belt: HTMLElement): () => void {
  const oreSamples = Array.from(belt.querySelectorAll<HTMLElement>('i'))
  const activeSamples: BeltSample[] = []
  const minimumGap = 8.2
  const phases: BeltPhase[] = [
    { name: 'empty', duration: 1200, speed: 0, spawn: Infinity },
    { name: 'steady', duration: 5200, speed: 0.045, spawn: 650 },
    { name: 'jam', duration: 2800, speed: 0.045, spawn: 420, blocked: true },
    { name: 'release', duration: 950, speed: 0.032, spawn: 520 },
    { name: 'jam', duration: 1900, speed: 0.045, spawn: 420, blocked: true },
    { name: 'release', duration: 1100, speed: 0.034, spawn: 540 },
    { name: 'recovered', duration: 5200, speed: 0.045, spawn: 650 },
    { name: 'starved', duration: 9000, speed: 0.045, spawn: 700 },
  ]
  let phaseIndex = 0
  let phaseStarted = 0
  let lastFrame = 0
  let lastSpawn = 0
  let frame = 0
  let stopped = false

  function clearBelt(): void {
    activeSamples.splice(0)
    for (const sample of oreSamples) {
      sample.classList.remove('active')
      sample.style.left = '-10px'
    }
  }

  function spawnSample(): void {
    const rear = activeSamples.reduce((lowest, sample) => Math.min(lowest, sample.x), Infinity)
    if (rear < minimumGap - 6) return
    const element = oreSamples.find((sample) => !sample.classList.contains('active'))
    if (!element) return
    const sample = { element, x: -6 }
    element.style.left = `${sample.x}%`
    element.classList.add('active')
    activeSamples.push(sample)
  }

  function beginPhase(now: number): void {
    phaseStarted = now
    lastSpawn = now
    const phase = phases[phaseIndex]
    if (!phase) return
    belt.className = `brand-belt ${phase.blocked ? 'is-jammed' : phase.name === 'empty' ? 'is-empty' : 'is-flowing'}`
    if (phase.name === 'empty') clearBelt()
    if (phase.name === 'steady') spawnSample()
  }

  function currentSpawnInterval(phase: BeltPhase, elapsed: number): number {
    if (phase.name !== 'starved') return phase.spawn
    const progress = elapsed / phase.duration
    if (progress > 0.46) return Infinity
    return 700 + (progress / 0.46) * 2400
  }

  function moveSamples(distance: number, blocked: boolean): void {
    activeSamples.sort((a, b) => b.x - a.x)
    for (let index = 0; index < activeSamples.length; index += 1) {
      const sample = activeSamples[index]
      if (!sample) continue
      let limit = Infinity
      if (blocked) {
        const previousSample = activeSamples[index - 1]
        limit = index === 0 || !previousSample ? (sample.x > 92 ? Infinity : 92) : previousSample.x - minimumGap
      }
      sample.x = Math.min(sample.x + distance, limit)
      sample.element.style.left = `${sample.x}%`
    }

    for (let index = activeSamples.length - 1; index >= 0; index -= 1) {
      const sample = activeSamples[index]
      if (!sample) continue
      if (sample.x <= 106) continue
      sample.element.classList.remove('active')
      sample.element.style.left = '-10px'
      activeSamples.splice(index, 1)
    }
  }

  function simulateBelt(now: number): void {
    if (stopped) return
    if (!phaseStarted) beginPhase(now)
    const phase = phases[phaseIndex]
    if (!phase) return
    const elapsed = now - phaseStarted
    const delta = Math.min(now - (lastFrame || now), 40)
    lastFrame = now

    const spawnInterval = currentSpawnInterval(phase, elapsed)
    if (now - lastSpawn >= spawnInterval) {
      spawnSample()
      lastSpawn = now
    }
    moveSamples(phase.speed * delta, Boolean(phase.blocked))

    if (elapsed >= phase.duration) {
      phaseIndex = (phaseIndex + 1) % phases.length
      beginPhase(now)
    }
    frame = requestAnimationFrame(simulateBelt)
  }

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    oreSamples.slice(0, 4).forEach((sample, index) => {
      sample.style.left = `${15 + index * 22}%`
      sample.classList.add('active')
    })
  } else {
    frame = requestAnimationFrame(simulateBelt)
  }

  return () => {
    stopped = true
    cancelAnimationFrame(frame)
  }
}
