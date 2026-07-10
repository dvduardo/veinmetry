# Plano: Painel de Detalhe ao Lado do Mapa

> Referencia: spec.md desta mesma pasta

## Abordagem tecnica

O painel e um `<aside id="map-detail">` renderizado junto do mapa dentro de `.resource-map-panel`, num grid de duas colunas (`mapa | painel`). Ele existe desde o primeiro render com um estado vazio, entao a largura do mapa nunca muda e nao precisamos de `map.invalidateSize()`.

O clique no marcador deixa de fazer `scrollIntoView` na pagina. Em vez disso, `selectLine` passa a receber a `LineBalance` inteira e injeta no painel o mesmo card da lista, gerado por `lineCardView` (que passa a ser exportada), mais um cabecalho com botao de fechar e um botao "Ver na lista" que preserva o scroll antigo como acao opcional. A selecao continua sendo refletida na lista via classe `.map-selected` (sem scroll) e passa a ser refletida no mapa via classe `is-selected` no elemento do marcador.

Um unico listener delegado no painel (registrado em `initializeResourceMap`) trata fechar e "Ver na lista". Sem estado global novo: a selecao continua sendo expressa por classes no DOM, como hoje.

## Modulos afetados

- `src/app/views.ts` - exportar `lineCardView`; em `resourceMapView`, envolver `#resource-map` num wrapper `.resource-map-body` que tambem contem `<aside id="map-detail" class="map-detail" aria-live="polite">` com o estado vazio (`.map-detail-empty`).
- `src/app/map.ts` - guardar os marcadores por linha num `Map<string, L.Marker[]>`; `marker.on('click', () => selectLine(line))`; reescrever `selectLine(line: LineBalance)` para (1) preencher o painel com cabecalho + `lineCardView(line)` + botao "Ver na lista" `data-line-id`, (2) aplicar `.map-selected` no card da lista sem scroll, (3) alternar `is-selected` nos marcadores via `marker.getElement()`; nova `clearSelection()` que restaura o estado vazio e remove destaques; listener delegado de clique no `#map-detail`.
- `src/app/styles.css` - `.resource-map-body { display: grid; grid-template-columns: minmax(0, 1fr) 360px; }`; `.map-detail { overflow-y: auto; min-height: 0; border-left: 1px solid var(--line); }` (a altura da linha do grid e ditada pelo `aspect-ratio` do mapa, dando o scroll interno); `.map-detail-empty`, `.map-detail-head` e botoes; reset leve do `.line-card` dentro do painel (sem borda externa/raio, padding menor); `.veinmetry-marker.is-selected span` com escala e sombra de destaque; na media query `max-width: 650px`, colunas viram `1fr` e o painel empilha abaixo do mapa com `max-height: 320px` e `border-top`.

Sem mudancas em `src/app/app.ts`, `src/types.ts`, analise ou worker.

## Padroes e utilitarios reutilizados

- `lineCardView` (`src/app/views.ts`) - o card completo da linha, reusado sem duplicar markup.
- Classe `.map-selected` e seu estilo existente (`styles.css`) para o destaque na lista.
- `markerIcon`/`.veinmetry-marker` como base do destaque de selecao no mapa.
- Media query responsiva existente (`max-width: 650px`) para a variante mobile.
- Variaveis de tema (`--line`, `--surface`, `--acid`, etc.) para claro/escuro.

## Riscos e trade-offs

- O painel de 360px estreita o mapa em telas medias (~900px); mitigado por `minmax(0, 1fr)` no mapa e pelo empilhamento no breakpoint mobile. Se ficar apertado, da para reduzir o painel ou antecipar o breakpoint durante a validacao visual.
- O card dentro do painel herda estilos pensados para a lista; o reset leve precisa cobrir borda, raio e padding para nao parecer "card dentro de card".
- `marker.getElement()` so existe com o marcador adicionado ao mapa; o destaque deve tolerar elemento ausente.
- Linhas com varios nodulos (merged) tem varios marcadores; todos devem receber `is-selected` juntos.

## Estrategia de verificacao

- `npm run sdd:check`, `npm test`, `npm run build` (e tipos via build).
- Mockup visual validado por David antes da tela real.
- Validacao humana final (gate obrigatorio): subir `npm run dev`, David carrega um `.sav` real e confere no browser: clique no marcador mostra o card no painel sem scroll da pagina; trocar de marcador troca o card; fechar volta ao estado vazio; "Ver na lista" rola ate o card; card longo rola dentro do painel; viewport estreita empilha o painel; temas claro e escuro. So depois do OK explicito a spec vai para `Done`.
