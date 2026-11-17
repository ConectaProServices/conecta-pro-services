# 10-08 - Versionamento e Checklist Consolidado

## 1. Projeto

Conecta Pro Services (`ConectaProServices/conecta-pro-services`), backend NestJS em `conecta-pro-services-backend/`.

## 2. Issue

**#20 - `[SUB-07] Containerizar o backend com Docker Compose`**. Criada nesta atividade por decisão da equipe (não existia Issue de containerização). Executada por João (`JPZS-Git`) e revisada por Layssa (`LayssaRD`). DoR-07: comentário de `LayssaRD` em 2026-11-17T19:17:16Z.

## 3. Epic

#1 - `[UC01] Solicitar Agendamento`. A #20 está vinculada como sub-issue (3/7 concluídas no momento da criação).

## 4. Branch

`feature/20-containerizacao-backend`, criada a partir da `main` (`5251625`) após `git fetch --prune` e de confirmar que não havia branch vinculada à #20.

## 5. Estado inicial

Sem `Dockerfile`, sem `.dockerignore`, sem serviço `api`; `compose.yaml` com `5432:5432` divergindo do container (`5435:5432`, 5432 do host ocupada); DataSource da CLI sem suporte a `dist/`; sem scripts de migration de runtime. Linha de base: 21/21 e 5/5 (10-01).

## 6. Arquivos verificados

`package.json`, `pnpm-lock.yaml`, `package-lock.json`, `tsconfig.json`, `tsconfig.build.json`, `nest-cli.json`, `src/main.ts`, `src/app.module.ts`, `src/database/data-source.ts`, migration, `.env.example`, `.gitignore`, `compose.yaml`, configs do Vitest. Inexistentes: `Dockerfile`, `.dockerignore`, `pnpm-workspace.yaml`.

## 7. Alterações realizadas

| Arquivo | Tipo |
| --- | --- |
| `Dockerfile` | Criado |
| `.dockerignore` | Criado |
| `compose.yaml` | Serviço `api` adicionado; porta do Postgres `"5435:5432"` |
| `.env.example` | `COMPOSE_PROJECT_NAME`, `PORT` |
| `src/database/data-source.ts` | Migrations relativas ao arquivo, com a extensão do arquivo em execução |
| `package.json` | `migration:show:prod`, `migration:run:prod` |
| `.env` (local, não versionado) | `COMPOSE_PROJECT_NAME` acrescentado |

## 8. Imagem

`conecta-pro-services-api:dev`, `8310cabbef9c`, 474 MB, multi-stage, `USER node`, `CMD ["node","dist/main.js"]`, sem `.env` nem código-fonte (10-02, 10-03).

## 9. Compose

Serviços `postgres` (preservado, hash idêntico, não recriado) e `api`; `docker compose config --quiet` → OK; volume `conecta_postgres_data` preservado (10-04).

## 10. Variáveis

API com `DB_HOST=postgres`, `DB_PORT=5432`, `DB_NAME=conecta_dev`, credenciais interpoladas do `.env`, sem `TEST_DB_*`; `COMPOSE_PROJECT_NAME=conecta-pro-services-backend` (10-05).

## 11. Migrations

`pnpm migration:show:prod` no contêiner → `[X] 1 CreateSchedulings1793060000000`. Sem pendências, `run` não executado (10-06).

## 12. Execução

`docker compose up -d --build api`: API `running`, Postgres `healthy`; logs com módulos, rota e `successfully started` (10-06).

## 13. HTTP

`POST /schedulings` → 201 (`c78264d4-2203-4a71-bd58-1ae21829fa30`); inválido → 400; repetido após o restart → 409 (10-07).

## 14. PostgreSQL

`SELECT ... FROM scheduling.schedulings WHERE "schedulingId" = 'c78264d4-...'` em `conecta_dev` → 1 linha; conexão da API (`172.20.0.3`) em `pg_stat_activity`.

## 15. Durabilidade

SQL antes e depois de `docker compose restart api` idênticos (`diff` → `IDENTICOS`); `StartedAt` da API mudou e o do Postgres não.

## 16. Testes

`pnpm test` 21/21; `pnpm test:integration` 5/5 (`conecta_test`); build ok; lint com 1 warning preexistente; `test:e2e` não executado (banco de desenvolvimento).

## 17. Commits reais

| Hash | Mensagem |
| --- | --- |
| `ae22484` | `build(docker): containerize NestJS backend and integrate with Compose (refs #20, refs #1)` |
| `7cc4e27` | `fix(database): resolve migrations from compiled dist and add runtime migration scripts (refs #20)` |
| `27dcbbf` | `docs: add Material 10 artifacts and prompt (refs #20)` |

Mais um commit com este artefato. Push: `* [new branch] feature/20-containerizacao-backend -> feature/20-containerizacao-backend`. Varredura do diff antes do commit: senha de teste 0 ocorrências, 0 linhas novas com a senha de dev, nenhum `.env`.

## 18. Pull Request

| Item | Valor |
| --- | --- |
| Número | #21 |
| URL | https://github.com/ConectaProServices/conecta-pro-services/pull/21 |
| Estado | Open. Criado como **Draft**; marcado "Ready for review" em 17/11/2026 (`gh pr ready 21`) |
| Base / origem | `main` ← `feature/20-containerizacao-backend` |
| Vínculo | `Closes #20` (verificado: `closingIssuesReferences = [20]`), `refs #1` |
| Revisora | `LayssaRD` (pedido explícito de "Approve" na descrição) |

## 19. GitHub Project

| Item | Status |
| --- | --- |
| #20 SUB-07 | `Under review` (`Todo → Ready → In progress → Under review`) |
| PR #21 | `Under review` |
| #15 SUB-06 | `Under review` (desatualizado, não alterado) |

## 20. Checklist

### Planejamento

| Item | Situação |
| --- | --- |
| Oito Markdown do Material 09 analisados | Confirmado |
| Issue de containerização e Epic verificadas | Confirmado (Issue inexistente; #20 criada e vinculada à #1) |
| Branch confirmada | Confirmado |
| DoR, WIP e dependências | Confirmado |

### Dockerfile e imagem

| Item | Situação |
| --- | --- |
| Dockerfile examinado (ou criado, com registro) | Confirmado (criado) |
| Versões de Node e pnpm | Confirmado (24.21.0 / 12.8.1, dentro e fora da imagem) |
| Lockfile validado | Confirmado (`--frozen-lockfile` aceito; lockfile inalterado) |
| Build multi-stage | Confirmado |
| Entry point, DataSource e migrations compilados | Confirmado |
| `.dockerignore` auditado | Confirmado (criado) |
| Imagem construída e identificada | Confirmado |

### Compose e rede

| Item | Situação |
| --- | --- |
| Serviço da API | Confirmado (adicionado) |
| PostgreSQL e volumes preservados | Confirmado (hash idêntico, mesmo container) |
| Healthchecks | Confirmado |
| Porta HTTP e porta interna do PostgreSQL | Confirmado (3000; 5432 interna, 5435 host) |
| `DB_HOST` = serviço do Compose | Confirmado |
| Credenciais sem exposição | Confirmado |
| `docker compose config --quiet` | Confirmado |

### Migrations

| Item | Situação |
| --- | --- |
| Scripts confirmados | Confirmado (criados) |
| Banco de destino | Confirmado (`conecta_dev`) |
| Histórico inspecionado | Confirmado |
| Aplicadas somente se necessário | Confirmado (nenhuma pendente, `run` não executado) |
| Nenhuma operação destrutiva | Confirmado |

### Execução e persistência

| Item | Situação |
| --- | --- |
| API inicializada e PostgreSQL saudável | Confirmado |
| Logs inspecionados | Confirmado |
| Comunicação entre contêineres | Confirmado |
| Cadastro HTTP registrado | Confirmado |
| Registro consultado no PostgreSQL | Confirmado |
| API reiniciada e registro consultado novamente | Confirmado |
| Durabilidade comprovada | Confirmado |

### Testes

| Item | Situação |
| --- | --- |
| Scripts verificados | Confirmado |
| Testes executados agora | Confirmado (21/21, 5/5) |
| Banco de testes isolado | Confirmado (`conecta_test`) |
| E2E legados tratados com segurança | Confirmado (não executados) |
| Regressões investigadas | Confirmado (nenhuma) |

### GitHub

| Item | Situação |
| --- | --- |
| Alterações inspecionadas e segredos não versionados | Confirmado |
| Commits reais | Confirmado |
| PR verificado / criado | Confirmado (#21) |
| Evidências e Project | Confirmado |
| Nenhum merge automático | Confirmado |

### Transparência

Comandos, builds, consultas, requisições, testes e commits foram executados pelo assistente no ambiente local do estudante, com saídas reais. O estudante autorizou a criação da Issue, o commit e o PR. A DoR foi aprovada por humano (`LayssaRD`). A revisão do PR #21 está pendente.

## 21. Pendências

1. Revisão humana ("Approve") e merge autorizado do PR #21. Ao mergear, a #20 fecha.
2. Colegas devem usar `DB_PORT=5435` no `.env` (Postgres do Compose publicado em 5435).
3. `POSTGRES_PASSWORD` de dev em texto no `compose.yaml` (preexistente).
4. `package-lock.json` coexistindo com `pnpm-lock.yaml`.
5. E2E no banco de dev (SUB-06); sem CI.
6. Os contêineres `conecta-api` e `conecta-postgres` ficaram em execução (`restart: unless-stopped`).

## 22. Próximas ações

- Merge do PR #21 e README com "como rodar com Docker".
- CI com build da imagem e `pnpm test` / `pnpm test:integration` (serviço PostgreSQL).
- SUB-05 (#14): RN05 → status HTTP; SUB-06 (#15): E2E em banco de testes.
- Avaliar a otimização da imagem (`pnpm deploy --prod` / alpine) e a remoção do `package-lock.json`.
