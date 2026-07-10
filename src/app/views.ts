import type { AnalysisResult, LineBalance } from '../types'
import { escapeHtml, number, statusText } from './format'

function brandMarkup(): string {
  return `
    <span class="brand-text">Veinmetry</span>
    <span class="brand-belt is-empty" aria-hidden="true">
      <i style="--ore:#d47615;--i:0"></i><i style="--ore:#fdcc48;--i:1"></i><i style="--ore:#88d288;--i:2"></i><i style="--ore:#f177b5;--i:3"></i><i style="--ore:#3984bf;--i:4"></i><i style="--ore:#9b55bf;--i:5"></i><i style="--ore:#d47615;--i:6"></i><i style="--ore:#fdcc48;--i:7"></i><i style="--ore:#88d288;--i:8"></i><i style="--ore:#f177b5;--i:9"></i><i style="--ore:#3984bf;--i:10"></i><i style="--ore:#9b55bf;--i:11"></i>
    </span>`
}

export function landingView(baseUrl: string): string {
  return `
    <header class="topbar">
      <a class="brand" href="${baseUrl}" aria-label="Veinmetry, início">
        ${brandMarkup()}
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
      <button class="demo-cta" type="button">▶ Ver demonstração com um save de exemplo</button>
      <div class="privacy-strip" aria-label="Escopo e privacidade">
        <div><span>Processamento</span><strong>100% no navegador</strong></div>
        <div><span>Entrada</span><strong>Save real do jogador</strong></div>
        <div><span>Escopo v1</span><strong>Esteiras, lifts e máquinas</strong></div>
      </div>
    </section>
    <footer>Feito para encontrar gargalos antes que eles encontrem você.</footer>
  `
}

export function loadingView(fileName: string): string {
  return `
    <section class="loading-screen">
      <div class="brand loading-brand" aria-label="Veinmetry">${brandMarkup()}</div>
      <div class="loader-node" aria-hidden="true"></div>
      <p class="eyebrow">Analisando ${escapeHtml(fileName)}</p>
      <h1>Seguindo a rede física do save.</h1>
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

export function hasMappableSources(result: AnalysisResult): boolean {
  return result.lines.some((line) =>
    line.sources.some((source) => typeof source.x === 'number' && typeof source.y === 'number'),
  )
}

export function reportView(result: AnalysisResult, demo: boolean): string {
  const deficit = result.lines.filter((line) => line.status === 'deficit').length
  const balanced = result.lines.filter((line) => line.status === 'balanced').length
  const hasMap = hasMappableSources(result)

  return `
    <div class="report-screen">
      <header class="report-bar">
        <button class="brand brand-button" type="button" aria-label="Nova análise">${brandMarkup()}</button>
        <div class="save-meta">
          <p class="eyebrow">${escapeHtml(result.saveName)} · build ${result.buildVersion}</p>
          <strong>Balanço das linhas</strong>
        </div>
        <div class="summary-chips" aria-label="Resumo">
          <span><b>${result.stats.lines}</b> linhas</span>
          <span class="bad"><b>${deficit}</b> déficit</span>
          <span><b>${balanced}</b> no limite</span>
          <span><b>${result.stats.miners}</b> mineradoras</span>
        </div>
        <div class="bar-spacer"></div>
        ${demo ? '<span class="demo-pill">● Dados de exemplo</span>' : ''}
        <button class="new-file" type="button">${demo ? 'Analisar meu save' : 'Analisar outro save'}</button>
        <button class="theme-toggle" type="button" aria-label="Alternar tema" title="Alternar tema">◐</button>
      </header>
      <section class="report-body">
        ${hasMap
          ? '<div id="resource-map" class="report-map" aria-label="Mapa dos nódulos usados no save"></div>'
          : '<div class="map-empty-state"><h2>Nenhum nódulo mapeável</h2><p>O save não contém mineradoras com posição conhecida; explore as linhas pelo painel ao lado.</p></div>'}
        <div class="map-toolbar">
          <button id="lines-toggle" class="lines-toggle" type="button" aria-expanded="${hasMap ? 'false' : 'true'}" aria-controls="lines-panel">
            <b>☰</b> Linhas <b class="lines-count">${result.stats.lines}</b>
          </button>
          <nav class="map-filters" aria-label="Filtrar linhas">
            <button class="active" data-filter="all">Todas</button>
            <button data-filter="deficit">Déficit</button>
            <button data-filter="balanced">No limite</button>
            <button data-filter="surplus">Com folga</button>
            <button data-filter="untraceable">Não rastreáveis</button>
          </nav>
          <div class="bar-spacer"></div>
          <div class="map-legend" aria-label="Legenda">
            <span><i class="deficit"></i>Déficit</span>
            <span><i class="balanced"></i>No limite</span>
            <span><i class="surplus"></i>Com folga</span>
            <span><i class="untraceable"></i>Não rastreável</span>
          </div>
        </div>
        <aside id="lines-panel" class="lines-panel ${hasMap ? '' : 'open'}" aria-label="Todas as linhas">
          <div class="panel-head">
            <p>Todas as linhas · clique para localizar no mapa</p>
            <button type="button" class="panel-close" aria-label="Fechar lista">×</button>
          </div>
          <div class="lines-panel-scroll">
            ${result.lines.length
              ? result.lines.map(lineCardView).join('')
              : '<div class="empty-state"><h2>Nenhuma linha encontrada</h2><p>O save não contém mineradoras conectadas por esteiras reconhecidas pela v1.</p></div>'}
          </div>
        </aside>
        <aside id="detail-drawer" class="detail-drawer" aria-live="polite"></aside>
        ${result.warnings.length ? `<div class="map-warning">⚠ ${result.warnings.map(escapeHtml).join(' ')}</div>` : ''}
      </section>
    </div>
  `
}

export function lineCardView(line: LineBalance): string {
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
