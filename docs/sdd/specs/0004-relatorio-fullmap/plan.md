# Plano: Relatorio Full-Map como Tela Padrao

> Referencia: spec.md desta mesma pasta

## Abordagem tecnica

`reportView` deixa de renderizar o documento rolavel (`.report-shell`) e passa a renderizar uma casca fixa de duas linhas de grid (`topbar | corpo do mapa`) ocupando a viewport (`position: fixed; inset: 0`). O corpo contem o `#resource-map` absoluto cobrindo tudo, a toolbar flutuante (botao ☰ Linhas, filtros, legenda), o `<aside>` do painel de linhas (esquerda), o `<aside>` do drawer de detalhe (direita) e a pilula de aviso global.

`initializeResourceMap` continua dono do Leaflet e dos marcadores, com tres mudancas: (1) o container agora tem tamanho definido por posicionamento absoluto, entao chamamos `map.invalidateSize()` num `requestAnimationFrame` apos criar o mapa; (2) `selectLine` passa a preencher o drawer (em vez do painel lateral fixo) e expoe tambem uma funcao `focusLine(line)` que faz `fitBounds` no `featureGroup` dos marcadores da linha; (3) o clique num card do painel de linhas chama `focusLine` + `selectLine`.

Os filtros saem da `<nav class="filters">` da lista antiga e viram os chips da toolbar; o handler (hoje em `app.ts`) passa a alternar `is-dimmed` nos marcadores (via `markersByLine`, exposto pelo modulo de mapa) e `hidden` nos cards do painel. O painel de linhas reusa `lineCardView` com uma classe de contexto que compacta o card via CSS (mesma tecnica do `.map-detail` atual).

A marca na topbar usa `brandMarkup()` como hoje; `startBrandBeltAnimations()` ja e chamado por `renderReport` e continua funcionando sem mudanca. Nada na animacao e tocado.

Sem nodulos mapeaveis (`resourceMapView` hoje retorna string vazia): mantemos a casca, trocamos o mapa por um estado vazio (`.map-empty-state`) e abrimos o painel de linhas por padrao.

Modo demonstracao: um novo modulo `src/app/demo.ts` exporta `demoResult(): AnalysisResult` — dados estaticos tipados (linhas nos quatro status, `SourceBalance` com `x`/`y` em coordenadas reais do mapa, avisos e sugestoes realistas; base: o save simulado do mockup aprovado). Na landing, um botao secundario "Ver demonstracao" abaixo da dropzone chama o mesmo `renderReport(demoResult(), { demo: true })`. Com `demo: true`, a topbar mostra uma pilula "Dados de exemplo" e o botao principal vira "Analisar meu save" (mesmo handler de voltar a landing). Nenhum caminho de codigo paralelo: e o fluxo normal alimentado por outro `AnalysisResult`.

CSS: os estilos do relatorio antigo (`.report-shell`, `.summary-strip`, `.resource-map-panel`, `.resource-map-body`, `.map-detail*`, `.filters` no contexto do relatorio) sao substituidos pelos novos (`.report-bar`, `.summary-chips`, `.map-toolbar`, `.lines-panel`, `.detail-drawer`, `.map-warning`), portados do mockup aprovado. Estilos da landing/loading/erro ficam intactos.

## Modulos afetados

- `src/app/views.ts` - reescrever `reportView` para a casca full-map (topbar com `brandMarkup()`, chips de resumo, pilula "Dados de exemplo" quando demo, toolbar, paineis, aviso em pilula); `landingView` ganha o botao secundario "Ver demonstracao" abaixo da dropzone; `lineCardView` inalterado; remover `resourceMapView`/`mapDetailEmptyView` em favor da nova estrutura.
- `src/app/map.ts` - `invalidateSize` pos-criacao; `selectLine` renderiza no `#detail-drawer`; nova `focusLine` (fitBounds nos marcadores da linha); expor callbacks/estrutura para filtros e painel de lista (ex.: retorno `{ markersByLine, focusLine, selectLine, clearSelection }`); remover o listener de "Ver na lista".
- `src/app/app.ts` - `renderReport(result, { demo })` liga os novos controles: toggle do painel ☰, filtros (marcadores + cards do painel), `Esc` (drawer → painel), clique em card do painel; binding do botao "Ver demonstracao" na landing chamando `renderReport(demoResult(), { demo: true })`; bindings existentes de marca/new-file/tema preservados. `startBrandBeltAnimations` permanece como esta.
- `src/app/demo.ts` (novo) - `demoResult(): AnalysisResult` com o save de exemplo estatico e tipado.
- `src/app/styles.css` - novos blocos do layout full-map (portar do mockup, usando as variaveis de tema); remover estilos orfaos do relatorio antigo; media query mobile: paineis viram overlays de largura quase total, chips de resumo compactam, legenda some.

Sem mudancas em `src/types.ts`, analise, worker ou `index.html`.

## Padroes e utilitarios reutilizados

- `lineCardView` (`views.ts`) para card completo (drawer) e compacto (painel, via CSS de contexto — mesma tecnica do `.map-detail .line-card` da spec 0003).
- `brandMarkup()` + `startBrandBeltAnimations()`/`stopBrandBeltAnimations` (`views.ts`/`app.ts`) para a marca animada, sem alteracao.
- Configuracao `scimMap`, `tileLayer`, `rasterPoint`, `markerIcon` e o `Map<string, L.Marker[]>` de `map.ts`.
- Classes de destaque existentes: `.veinmetry-marker.is-selected`, `.map-selected`.
- `bindTheme` e o fluxo `landing`/`loading`/`renderReport` de `app.ts`.
- Variaveis de tema para claro/escuro.
- Mockup aprovado como referencia visual: `visual-mockups.html` nesta pasta.

## Riscos e trade-offs

- E a maior mudanca visual do projeto: o relatorio-documento deixa de existir. Mitigado pelo mockup aprovado e pelo gate de validacao visual do David.
- Mapa criado em container dimensionado por CSS fixo pode renderizar tiles cortados se `invalidateSize` nao rodar apos o layout: garantir `requestAnimationFrame` (padrao ja demonstrado no mockup).
- Tema claro: os overlays usam `color-mix` com `--surface`; conferir contraste no claro durante a validacao.
- Linhas sem coordenadas so sao acessiveis pelo painel ☰; o botao precisa ficar evidente (badge com contagem).
- Teclado/acessibilidade: garantir ordem de foco ao abrir drawer/painel e `aria-expanded` no toggle.
- `app.ts` hoje filtra `.line-card` globalmente; com cards no painel e no drawer, o filtro deve mirar so o painel para nao esconder o card aberto no drawer.
- Dados da demo podem divergir do formato real de `AnalysisResult` conforme o motor evolui; por serem tipados em TS, o build quebra junto — divergencia aparece cedo.
- A demo precisa parecer real sem enganar: a pilula "Dados de exemplo" deve ficar sempre visivel na topbar do modo demo.

## Estrategia de verificacao

- `npm run sdd:check`, `npm test`, `npm run build`.
- Subir `npm run dev` e validar com um `.sav` real: fluxo completo landing → loading → full-map; marcador → drawer; ☰ → painel → clique em card enquadra e abre detalhe; filtros; `Esc`; esteira animada na topbar; temas claro/escuro; viewport estreita; save sem nodulos mapeaveis (se disponivel, ou simulado).
- Validar o modo demonstracao: "Ver demonstracao" na landing abre o full-map com os dados de exemplo e a pilula "Dados de exemplo"; "Analisar meu save" volta para a landing.
- Validacao humana final (gate obrigatorio): David confere no browser e so depois do OK explicito a spec vai para `Done`.
