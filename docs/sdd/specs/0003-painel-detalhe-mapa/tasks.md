# Tasks: Painel de Detalhe ao Lado do Mapa

> Derivado de plan.md desta mesma pasta.

- [x] Criar `visual-mockups.html` e esperar David validar antes de alterar a tela real (aprovado em 2026-07-10)
- [x] `views.ts`: exportar `lineCardView` e adicionar `.resource-map-body` + `<aside id="map-detail">` com estado vazio em `resourceMapView`
- [x] `map.ts`: mapa de marcadores por linha, `selectLine(line)` preenchendo o painel, `clearSelection()`, destaque `is-selected` nos marcadores, listener delegado (fechar / ver na lista)
- [x] `styles.css`: grid `mapa | painel`, scroll interno do painel, reset do card no painel, destaque do marcador selecionado, variante mobile na media query existente
- [x] Rodar `npm run sdd:check`
- [x] Rodar `npm test`
- [x] Rodar `npm run build`
- [x] Fazer autorrevisao do diff
- [x] Subir `npm run dev` e esperar David validar visualmente no browser (gate obrigatorio - sem essa aprovacao o ciclo nao fecha)
- [x] Apos o OK do David, parar o servidor e marcar a spec como `Done`
