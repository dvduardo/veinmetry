# SDD no Veinmetry

Este documento define como David e Codex trabalham neste projeto usando
**Spec-Driven Development (SDD)**: nenhuma feature nova comeca a ser
implementada antes de passar por spec e plano aprovados.

## Papeis

| Papel | Quem | Responsabilidade |
| --- | --- | --- |
| Product Owner | David | Define problema, prioridades e decisoes de UX/produto. Aprova spec e plano. |
| Tech Lead / Implementador | Codex | Traduz a ideia em spec tecnica, escreve o plano, quebra em tasks, implementa e revisa antes de entregar. |

## Ciclo SDD

```
Ideia -> Spec -> Plano -> Mockup* -> Tasks -> Implementacao -> Review -> Done

* obrigatorio quando a mudanca cria ou altera visualmente alguma tela
```

1. **Ideia** - problema ou melhoria em linguagem natural.
2. **Spec** - `spec.md` usando `templates/spec.template.md`. David aprova ou ajusta antes do plano.
3. **Plano** - `plan.md` usando `templates/plan.template.md`. Nenhuma linha de codigo de feature deve ser escrita antes da aprovacao.
4. **Mockup visual** - se houver tela nova ou alteracao visual, criar `visual-mockups.html` na pasta da spec antes de implementar a tela real.
5. **Tasks** - `tasks.md` usando `templates/tasks.template.md`, com checkpoints e verificacoes.
6. **Implementacao** - codigo seguindo o plano aprovado. Desvios relevantes voltam para David antes de continuar.
7. **Review** - autorrevisao do diff, testes e validacao manual quando fizer sentido.
8. **Done** - feature entregue e spec atualizada para `Done`.

## Status das specs

O campo `> Status:` no topo de cada `spec.md` e a fonte de verdade do ciclo.
A linha deve comecar com uma destas palavras canonicas:

| Status | Significado |
| --- | --- |
| `Draft` | Spec sendo escrita, ainda nao aprovada. |
| `Approved` | Spec e plano aprovados; pode implementar. |
| `In Progress` | Implementacao em andamento. |
| `Done` | Implementada, revisada e validada. |

Regras validadas por `npm run sdd:check`:

- toda pasta em `docs/sdd/specs/*` precisa ter `spec.md`;
- `spec.md` precisa ter uma linha `> Status:` no topo;
- o status precisa comecar com o vocabulario canonico;
- `In Progress` falha o check para evitar deploy de trabalho inacabado.

## Estrutura

```
docs/sdd/
├── README.md
├── templates/
│   ├── spec.template.md
│   ├── plan.template.md
│   └── tasks.template.md
└── specs/
    └── 0001-base-auditor-v1/
        ├── spec.md
        ├── plan.md
        └── tasks.md
```

- Numere specs com quatro digitos, em ordem de criacao: `0001-`, `0002-`, etc.
- Use slugs curtos em kebab-case.
- `visual-mockups.html` e obrigatorio apenas quando a spec altera UI.

## Quando a spec esta pronta para virar plano

- Problema e objetivo claros em 1-2 frases.
- Requisitos e criterios de aceite verificaveis.
- Fora de escopo explicito.
- Perguntas abertas resolvidas ou registradas.

## Quando o plano esta pronto para implementar

- Modulos afetados e abordagem definidos.
- Reuso de padroes existentes identificado.
- Riscos e trade-offs anotados.
- Estrategia de verificacao definida.
- David aprovou explicitamente.
- Se houver UI, o mockup visual foi validado antes da implementacao real.

## Verificacao

Antes de considerar um ciclo pronto:

```bash
npm run sdd:check
npm test
npm run build
```

O workflow de deploy tambem roda `npm run sdd:check` antes de testes e build.
