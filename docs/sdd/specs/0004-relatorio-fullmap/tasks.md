# Tasks: Relatorio Full-Map como Tela Padrao

> Derivado de plan.md desta mesma pasta.

- [x] Criar `visual-mockups.html` e esperar David validar antes de alterar a tela real (aprovado em 2026-07-10, com a ressalva incorporada: marca deve usar o logo animado real)
- [x] David aprovar spec.md (2026-07-10)
- [x] David aprovar plan.md (2026-07-10, status → `Approved`)
- [x] `views.ts`: reescrever `reportView` para a casca full-map (topbar com `brandMarkup()`, chips, pilula "Dados de exemplo" quando demo, toolbar, painel de linhas, drawer, pilula de aviso, estado sem mapa) e adicionar "Ver demonstracao" na landing
- [x] `demo.ts` (novo): `demoResult(): AnalysisResult` com save de exemplo tipado (4 status, coordenadas reais)
- [x] `map.ts`: `invalidateSize` pos-criacao, `focusLine` com fitBounds, `highlightLine`, `setStatusFilter`; drawer ficou a cargo do `app.ts` (funciona tambem em save sem mapa — desvio pontual do plano, mesma UX)
- [x] `app.ts`: bindings dos novos controles (toggle ☰, filtros sobre marcadores+painel, `Esc`, clique em card do painel, `openLineDetail`/`closeLineDetail`) preservando marca/new-file/tema; binding do "Ver demonstracao" → `renderReport(demoResult(), { demo: true })`
- [x] `styles.css`: portar estilos do mockup (report-bar, chips, toolbar, paineis, drawer, pilula), remover estilos orfaos do relatorio antigo, variante mobile
- [x] Conferir tema claro e `prefers-reduced-motion`
- [x] Rodar `npm run sdd:check` (passou; aviso esperado: spec ainda `Approved` ate validacao visual)
- [x] Rodar `npm test`
- [x] Rodar `npm run build`
- [x] Fazer autorrevisao do diff
- [x] Subir `npm run dev` e esperar David validar visualmente no browser (validado por David em 2026-07-10)
- [x] Se for visual: apos o OK do David, parar o servidor
- [x] Preparar commits: se houver varios assuntos, separar em commits distintos, sempre com mensagem clara
- [ ] Fazer commit e push da branch
- [ ] Abrir PR da branch para `main` no GitHub
- [ ] Somente depois do PR aberto, marcar a spec como `Done`
