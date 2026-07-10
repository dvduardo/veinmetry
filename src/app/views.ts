import type { AnalysisResult, LineBalance } from '../types'
import { escapeHtml, number, statusText } from './format'

export function landingView(baseUrl: string): string {
  return `
    <header class="topbar">
      <a class="brand" href="${baseUrl}" aria-label="Veinmetry, início">
        <span class="brand-mark" aria-hidden="true"></span>
        <span>Veinmetry</span>
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
}

export function loadingView(fileName: string): string {
  return `
    <section class="loading-screen">
      <div class="loader-node" aria-hidden="true"></div>
      <p class="eyebrow">Analisando ${escapeHtml(fileName)}</p>
      <h1>Seguindo cada esteira…</h1>
      <p id="progress-message">Preparando os dados do jogo.</p>
      <div class="progress-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><span></span></div>
    </section>
  `
}

export function errorView(message: string): string {
  return `
    <section class="error-screen">
      <span>!</span><p class="eyebrow">A análise parou</p><h1>Não deu para ler este save.</h1>
      <p>${escapeHtml(message)}</p><button type="button">Tentar outro arquivo</button>
    </section>`
}

export function reportView(result: AnalysisResult): string {
  const deficit = result.lines.filter((line) => line.status === 'deficit').length
  const balanced = result.lines.filter((line) => line.status === 'balanced').length

  return `
    <header class="topbar report-topbar">
      <button class="brand brand-button" type="button" aria-label="Nova análise"><span class="brand-mark"></span><span>Veinmetry</span></button>
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
      ${resourceMapView(result)}
      <nav class="filters" aria-label="Filtrar linhas">
        <button class="active" data-filter="all">Todas</button>
        <button data-filter="deficit">Déficit</button>
        <button data-filter="surplus">Com folga</button>
        <button data-filter="untraceable">Não rastreáveis</button>
      </nav>
      <div class="line-list">${result.lines.map(lineCardView).join('')}</div>
      ${result.lines.length ? '' : '<div class="empty-state"><h2>Nenhuma linha encontrada</h2><p>O save não contém mineradoras conectadas por esteiras reconhecidas pela v1.</p></div>'}
    </section>
  `
}

function resourceMapView(result: AnalysisResult): string {
  const hasPins = result.lines.some((line) =>
    line.sources.some((source) => typeof source.x === 'number' && typeof source.y === 'number'),
  )
  if (!hasPins) return ''

  return `
    <section class="resource-map-panel" aria-label="Mapa dos nódulos usados no save">
      <div class="resource-map-head">
        <div><p class="eyebrow">Mapa vanilla</p><h2>Nódulos usados por este save</h2></div>
        <div class="map-legend" aria-label="Legenda">
          <span><i class="deficit"></i>Déficit</span>
          <span><i class="balanced"></i>No limite</span>
          <span><i class="surplus"></i>Com folga</span>
          <span><i class="untraceable"></i>Não rastreável</span>
        </div>
      </div>
      <div id="resource-map" class="resource-map"></div>
    </section>`
}

function lineCardView(line: LineBalance): string {
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
    <article class="line-card ${line.status}" data-line-id="${escapeHtml(line.id)}">
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
