# 10-01 - Diagnóstico da Containerização

Legenda de classificação: **[Doc]** documentado anteriormente · **[Código]** confirmado no código · **[Exec]** executado nesta atividade · **[Aguardando]** aguardando evidência · **[Pendente]** pendente de correção.

## 1. Projeto e caso de uso

- Conecta Pro Services (`ConectaProServices/conecta-pro-services`), backend em `conecta-pro-services-backend/`
- UC01 - Solicitar Agendamento (Epic #1); rota `POST /schedulings`
- Artefatos de origem: `docs/planejamento/09/09-01..09-08` (na `main`)
- Destino: `docs/planejamento/10/`
- Data: 17/11/2026

## 2. Issue e branch

| Item | Situação |
| --- | --- |
| Issue de containerização | **Não existia.** Criada nesta atividade por decisão da equipe: **#20 - `[SUB-07] Containerizar o backend com Docker Compose`**, labels `uc01` e `type:subissue`, assignee `JPZS-Git`, vinculada como sub-issue da Epic #1 (agora 3/7) e adicionada ao Project em `Todo` [Exec] |
| Responsáveis | João executa; Layssa revisa (decisão da equipe) |
| Branch | A criar a partir da `main` (`5251625`) após a DoR; nenhuma branch ou PR de containerização existente (`gh pr list --state all`: #16 a #19, todos mergeados) [Exec] |
| WIP | Só a #15 em `Under review` (1 de 3) [Exec] |
| Dependências | SUB-02 (#11) e SUB-04 (#13), ambas fechadas [Exec] |

### DoR da SUB-07 (#20)

| Critério | Avaliação |
| --- | --- |
| DoR-01 Objetivo | Atende |
| DoR-02 Escopo | Atende (inclui o que está fora do escopo) |
| DoR-03 CAs verificáveis | Atende (6 CAs) |
| DoR-04 Dependências | Atende (#11 e #13 fechadas) |
| DoR-05 Informações | Atende (este diagnóstico) |
| DoR-06 Responsável | Atende (assignee e corpo) |
| DoR-07 Revisão | Atende: comentário de `LayssaRD` na #20 em 2026-11-17T19:17:16Z ("Issue revisada e aprovada"). A #20 foi movida `Todo → Ready → In progress`; branch `feature/20-containerizacao-backend` criada a partir da `main` (`5251625`) após confirmar que não havia branch vinculada |

## 3. Infraestrutura existente

| Arquivo | Classificação | Observação |
| --- | --- | --- |
| `Dockerfile` | **Inexistente e necessário** [Exec] | — |
| `.dockerignore` | **Inexistente e necessário** [Exec] | — |
| `compose.yaml` | Implementado, mas **incompatível** [Código] | Só o serviço `postgres`; porta `"5432:5432"` diverge do container real (`5435:5432`); sem serviço `api`; senha de dev em texto |
| Serviço `api` no Compose | **Inexistente e necessário** | — |
| `package.json` | Implementado e confirmado [Código] | Sem `packageManager` nem `engines`; scripts `build`, `start:prod` (`node dist/main`), `typeorm` (ts-node, só para fontes `.ts`); **sem scripts de migration para `dist/`** |
| Lockfiles | Implementado, mas não verificado em contêiner | `pnpm-lock.yaml` (`lockfileVersion: '9.0'`) **e** `package-lock.json` coexistem; a imagem usará o do pnpm |
| `pnpm-workspace.yaml` | Inexistente (não é workspace) | — |
| `tsconfig.json` / `tsconfig.build.json` | Implementado e confirmado [Código] | `module: nodenext`; build com `rootDir: ./src`, excluindo `test` e specs |
| `nest-cli.json` | Implementado e confirmado | `deleteOutDir: true` |
| `src/main.ts` | Implementado e confirmado [Código] | Porta `process.env.PORT ?? 3000`; `ValidationPipe` e filtro globais |
| `src/app.module.ts` | Implementado e confirmado [Código] | `ConfigModule.forRoot({ envFilePath: '.env' })` (no contêiner não haverá `.env`; vale `process.env`); `synchronize: false` |
| `src/database/data-source.ts` | Implementado, mas **incompatível com runtime compilado** [Código] | `migrations: ['src/database/migrations/*.ts']`: dentro da imagem só existe `dist/`, então a CLI não encontraria migrations |
| Migrations | Implementado e confirmado | `CreateSchedulings1793060000000`; compilada em `dist/database/migrations/1793060000000-CreateScheduling.js` [Exec] |
| `.env.example` | Implementado e confirmado | `DB_*` e `TEST_DB_*`; sem `COMPOSE_PROJECT_NAME` nem `PORT` |

### Ambiente Docker (inspecionado) [Exec]

| Item | Valor |
| --- | --- |
| Docker / Compose | 28.0.1 / v2.33.1-desktop.1 |
| `conecta-postgres` | `postgres:17`, `Up (healthy)`, `0.0.0.0:5435->5432/tcp`, projeto Compose `conecta-pro-services-backend`, volume `conecta-pro-services-backend_conecta_postgres_data` |
| Bancos | `conecta_db` (legado), `conecta_dev` (dev, migrado), `conecta_test` (testes, com usuário próprio), todos no mesmo container (Material 09) |
| Porta 5432 no host | **Ocupada** por outro processo (PID 6232, fora do Docker). Explica por que o container usa 5435 |
| Porta 3000 no host | Livre |
| Outros projetos | `celilac-postgres` (5434), `rentpro-postgres` (5433): **não serão tocados** |

### Hash de configuração do Compose (sem alterar nada) [Exec]

```text
container conecta-postgres:  6310e60dc604f3d8706b7b60bf9de2aa6cf57e959cebc77f70057568755f7cc8
compose atual (5432:5432):   3f0d2c3b0557fd0bfcd329adc78d2cd27cd0ccb45b64e2e60aa826e87fe90bff
compose com "5435:5432":     6310e60dc604f3d8706b7b60bf9de2aa6cf57e959cebc77f70057568755f7cc8
```

O container foi criado com `"5435:5432"`. Com o arquivo versionado atual, um `docker compose up` **recriaria** o banco numa porta ocupada e falharia. Com `"5435:5432"` (decisão da equipe: fixar a porta do host em 5435), o hash é idêntico e o Compose **não recria** o container do banco.

## 4. Versões

| Item | Valor | Fonte |
| --- | --- | --- |
| Node.js no host | v24.21.0 | `node -v` [Exec] |
| pnpm no host | 12.8.1 | `pnpm -v` [Exec] |
| `packageManager` no `package.json` | Ausente | [Código] |

Decisão técnica: a imagem usará `node:24.21.0-bookworm-slim` e `pnpm@12.8.1`, as mesmas versões do ambiente que gerou o `pnpm-lock.yaml`. Não será adicionado `packageManager` ao `package.json`, para evitar reescrita do lockfile; a versão fica fixada no Dockerfile e registrada aqui.

## 5. Linha de base dos testes [Exec]

Branch `main`, commit `5251625`:

```text
$ pnpm test
 Test Files  6 passed (6)
      Tests  21 passed (21)
   Duration  1.50s

$ pnpm test:integration          (conecta_test, banco isolado)
 Test Files  1 passed (1)
      Tests  5 passed (5)
   Duration  903ms

$ pnpm build                     -> nest build (sem erros)
$ find dist -name "main.js" -o -name "data-source.js"
dist/database/data-source.js
dist/main.js
$ find dist/database -name "*.js"
dist/database/data-source.js
dist/database/migrations/1793060000000-CreateScheduling.js

$ git status --short             (só o prompt 10 não versionado)
```

`pnpm test:e2e` **não executado**: as suítes E2E sobem o `AppModule` com o banco do `.env` (`conecta_dev`, desenvolvimento). Pela regra do Material 10, não serão executadas contra o banco de desenvolvimento sem autorização expressa.

## 6. Problemas identificados

| # | Problema | Tratamento previsto |
| --- | --- | --- |
| 1 | Sem `Dockerfile` e sem `.dockerignore` | Criar o mínimo (multi-stage) |
| 2 | Sem serviço `api` no Compose | Adicionar sem sobrescrever o arquivo |
| 3 | `compose.yaml` com `5432:5432` ≠ container (`5435:5432`) | Alterar para `"5435:5432"` (hash idêntico, sem recriação) |
| 4 | `data-source.ts` só encontra migrations `.ts` | Ajuste mínimo: caminho relativo ao próprio arquivo, aceitando `.ts` e `.js` |
| 5 | Sem scripts de migration para o código compilado | Criar `migration:show:prod` e `migration:run:prod` apontando para `dist/database/data-source.js` |
| 6 | Sem `COMPOSE_PROJECT_NAME` | Definir `conecta-pro-services-backend` (nome atual do projeto, preserva redes e volumes) no `.env` e no `.env.example` |
| 7 | Dois lockfiles | Registrar; a imagem usa `pnpm-lock.yaml` e não copia o `package-lock.json` |
| 8 | Senha de dev em texto no `compose.yaml` | Preexistente; a API interpolará do `.env`; registrar como pendência |

## 7. Plano de validação

1. DoR-07 da #20 → branch `feature/20-containerizacao-backend`.
2. Dockerfile + `.dockerignore` → `docker build` (10-02, 10-03).
3. Compose (`api` + porta) → `docker compose config --quiet` (10-04).
4. Rede e variáveis: `DB_HOST=postgres`, `DB_PORT=5432`, `DB_NAME=conecta_dev` (10-05).
5. `migration:show:prod` no contêiner; `run` só se houver pendência (10-06).
6. `docker compose up -d --build api` + logs (10-06).
7. `POST /schedulings` → SQL → `docker compose restart api` → SQL (10-07).
8. `pnpm test` e `pnpm test:integration` (10-07).
9. Commits, PR e Project (10-08).
