import './styles.css'
import type { AnalysisResult, GameData, LineBalance, WorkerResponse } from './types'

const app = document.querySelector<HTMLElement>('#app')!
let gameDataPromise: Promise<GameData> | undefined

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
  })[char]!)
}

function number(value: number): string {
  return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(value)
}

function loadGameData(): Promise<GameData> {
  gameDataPromise ??= fetch(`${import.meta.env.BASE_URL}game-data.json`).then((response) => {
    if (!response.ok) throw new Error('Não foi possível carregar os dados desta versão do jogo.')
    return response.json() as Promise<GameData>
  })
  return gameDataPromise
}

function landing(): void {
  app.innerHTML = `
    <header class="topbar">
      <a class="brand" href="${import.meta.env.BASE_URL}" aria-label="Nódulo, início">
        <span class="brand-mark" aria-hidden="true"></span>
        <span>Nódulo</span>
      </a>
      <button class="theme-toggle" type="button" aria-label="Alternar tema" title="Alternar tema">◐</button>
    </header>
    <section class="hero">
      <p class="eyebrow">Auditor de recursos · Satisfactory</p>
      <h1>Seu nódulo dá conta<br><span>da fábrica inteira?</span></h1>
      <p class="lede">Descubra quanto cada linha extrai, o que ela alimenta e onde falta — usando seu save real, sem enviar o arquivo para servidor algum.</p>
      <label class="dropzone" tabindex="0">
        <input id="file-input" type="file" accept=".sav" hidden>
        <span class="drop-icon" aria-hidden="true">↓</span>
        <strong>Arraste seu arquivo .sav aqui</strong>
        <span>ou clique para escolher</span>
        <small>O processamento acontece somente neste navegador.</small>
      </label>
      <div class="scope-note">
        <span>V1</span>
        <p>Analisa esteiras, lifts, splitters, mergers e containers. Trens, veículos, drones e fluidos ainda não entram no balanço.</p>
      </div>
    </section>
    <footer>Feito para encontrar gargalos antes que eles encontrem você.</footer>
  `
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
  const saved = localStorage.getItem('nodulo-theme')
  if (saved) document.documentElement.dataset.theme = saved
  button?.addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light'
    document.documentElement.dataset.theme = next
    localStorage.setItem('nodulo-theme', next)
  })
}

function loading(fileName: string): void {
  app.innerHTML = `
    <section class="loading-screen">
      <div class="loader-node" aria-hidden="true"></div>
      <p class="eyebrow">Analisando ${escapeHtml(fileName)}</p>
      <h1>Seguindo cada esteira…</h1>
      <p id="progress-message">Preparando os dados do jogo.</p>
      <div class="progress-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><span></span></div>
    </section>
  `
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
    const worker = new Worker(new URL('./worker/analyze.worker.ts', import.meta.url), { type: 'module' })
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

function statusText(line: LineBalance): string {
  if (line.status === 'deficit') return 'Déficit'
  if (line.status === 'balanced') return 'No limite'
  if (line.status === 'untraceable') return 'Não rastreável'
  return 'Com folga'
}

function lineCard(line: LineBalance): string {
  const balanceSign = line.balance > 0 ? '+' : ''
  const sourceRows = line.sources.map((source) => `
    <li>
      <span><strong>${escapeHtml(source.miner)}</strong> · ${Math.round(source.clock * 100)}% · ${source.purity === 'RP_Pure' ? 'puro' : source.purity === 'RP_Inpure' ? 'impuro' : source.purity === 'RP_Normal' ? 'normal' : 'pureza desconhecida'}</span>
      <b>${number(source.effectiveRate)}/min</b>
    </li>`).join('')
  const consumerRows = line.consumers.length
    ? line.consumers.map((consumer) => `
      <li>
        <span><strong>${escapeHtml(consumer.machine)}</strong> · ${escapeHtml(consumer.recipeName)} · ${Math.round(consumer.clock * 100)}%</span>
        <b>${number(consumer.demand)}/min</b>
      </li>`).join('')
    : '<li class="muted">Nenhum consumidor rastreável nesta linha.</li>'
  const warnings = line.warnings.length
    ? `<div class="warnings">${line.warnings.map((warning) => `<p>⚠ ${escapeHtml(warning)}</p>`).join('')}</div>`
    : ''

  return `
    <article class="line-card ${line.status}">
      <div class="card-head">
        <div><p class="card-kicker">${line.merged ? `${line.sources.length} nódulos agrupados` : 'Linha de suprimento'}</p><h2>${escapeHtml(line.itemName)}</h2></div>
        <span class="status-pill">${statusText(line)}</span>
      </div>
      <div class="balance-grid">
        <div><span>Extração</span><strong>${number(line.extraction)}<small>/min</small></strong></div>
        <div><span>Demanda</span><strong>${number(line.demand)}<small>/min</small></strong></div>
        <div class="net"><span>Saldo</span><strong>${balanceSign}${number(line.balance)}<small>/min</small></strong></div>
      </div>
      <details>
        <summary>Origens <span>${line.sources.length}</span></summary>
        <ul>${sourceRows}</ul>
      </details>
      <details open>
        <summary>Consumidores <span>${line.consumers.length}</span></summary>
        <ul>${consumerRows}</ul>
      </details>
      ${line.suggestion ? `<p class="suggestion">↳ ${escapeHtml(line.suggestion)}</p>` : ''}
      ${warnings}
    </article>`
}

function renderReport(result: AnalysisResult): void {
  const deficit = result.lines.filter((line) => line.status === 'deficit').length
  const balanced = result.lines.filter((line) => line.status === 'balanced').length
  app.innerHTML = `
    <header class="topbar report-topbar">
      <button class="brand brand-button" type="button" aria-label="Nova análise"><span class="brand-mark"></span><span>Nódulo</span></button>
      <button class="theme-toggle" type="button" aria-label="Alternar tema">◐</button>
    </header>
    <section class="report-shell">
      <div class="report-heading">
        <div><p class="eyebrow">${escapeHtml(result.saveName)} · build ${result.buildVersion}</p><h1>Balanço das linhas</h1></div>
        <button class="new-file" type="button">Analisar outro save</button>
      </div>
      <div class="summary-strip">
        <div><strong>${result.stats.lines}</strong><span>linhas</span></div>
        <div class="bad"><strong>${deficit}</strong><span>em déficit</span></div>
        <div><strong>${balanced}</strong><span>no limite</span></div>
        <div><strong>${result.stats.miners}</strong><span>mineradoras</span></div>
      </div>
      ${result.warnings.length ? `<div class="global-warning">${result.warnings.map(escapeHtml).join(' ')}</div>` : ''}
      <nav class="filters" aria-label="Filtrar linhas">
        <button class="active" data-filter="all">Todas</button>
        <button data-filter="deficit">Déficit</button>
        <button data-filter="surplus">Com folga</button>
        <button data-filter="untraceable">Não rastreáveis</button>
      </nav>
      <div class="line-list">${result.lines.map(lineCard).join('')}</div>
      ${result.lines.length ? '' : '<div class="empty-state"><h2>Nenhuma linha encontrada</h2><p>O save não contém mineradoras conectadas por esteiras reconhecidas pela v1.</p></div>'}
    </section>
  `
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
}

function showError(message: string): void {
  app.innerHTML = `
    <section class="error-screen">
      <span>!</span><p class="eyebrow">A análise parou</p><h1>Não deu para ler este save.</h1>
      <p>${escapeHtml(message)}</p><button type="button">Tentar outro arquivo</button>
    </section>`
  document.querySelector('.error-screen button')?.addEventListener('click', landing)
}

landing()
