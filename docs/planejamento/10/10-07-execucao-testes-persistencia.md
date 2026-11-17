# 10-07 - Execução, Testes e Persistência

## Parte 1 - HTTP e durabilidade (API em contêiner) [Exec]

Ambiente: `conecta-api` (imagem `conecta-pro-services-api:dev`, `8310cabbef9c`) + `conecta-postgres`, banco `conecta_dev`. Cliente: `curl` no host (`localhost:3000`). Data: 17/11/2026.

### 1. Cadastro válido (com campo fora do contrato)

```text
=== [1] POST valido (19:26:54Z)
payload: {"customerId":"f448383e-503c-4536-9d32-4d7b49e51966","serviceId":"33333333-3333-4333-8333-333333333333","professionalId":"c19f9703-1c94-4dc9-a40b-f4d3224505ce","startsAt":"2026-11-22T19:00:00.000Z","extra":"campo fora do contrato"}
HTTP/1.1 201 Created
Content-Type: application/json; charset=utf-8

{"schedulingId":"c78264d4-2203-4a71-bd58-1ae21829fa30","customerId":"f448383e-503c-4536-9d32-4d7b49e51966","serviceId":"33333333-3333-4333-8333-333333333333","professionalId":"c19f9703-1c94-4dc9-a40b-f4d3224505ce","startsAt":"2026-11-22T19:00:00.000Z","endsAt":"2026-11-22T20:00:00.000Z","status":"PENDING","message":"Scheduling requested successfully."}
```

- 201; `schedulingId` gerado; `endsAt` = `startsAt` + 60 min; `PENDING`.
- O campo `extra` não aparece na resposta nem no banco. Ressalva: a resposta é montada explicitamente pelo Service, então isso não isola o efeito do `whitelist`. A remoção pelo `whitelist` está comprovada automaticamente no teste HTTP do Material 07 (`unexpectedField`).

### 2. Corpo inválido

```text
=== [2] POST invalido
HTTP/1.1 400 Bad Request

{"message":["customerId must be a UUID","serviceId should not be empty","serviceId must be a UUID","startsAt must be a Date instance"],"error":"Bad Request","statusCode":400}
```

### 3. SQL antes do reinício

```text
=== [3] SQL antes do restart (19:26:54Z)
$ docker compose exec -T postgres sh -c 'psql -U "$POSTGRES_USER" -d conecta_dev' <<'SQL'
SELECT "schedulingId", "customerId", "professionalId", "startsAt", "endsAt", status, "createdAt" FROM scheduling.schedulings WHERE "schedulingId" = 'c78264d4-2203-4a71-bd58-1ae21829fa30';
SQL
             schedulingId             |              customerId              |            professionalId            |        startsAt        |         endsAt         | status  |         createdAt
--------------------------------------+--------------------------------------+--------------------------------------+------------------------+------------------------+---------+----------------------------
 c78264d4-2203-4a71-bd58-1ae21829fa30 | f448383e-503c-4536-9d32-4d7b49e51966 | c19f9703-1c94-4dc9-a40b-f4d3224505ce | 2026-11-22 19:00:00+00 | 2026-11-22 20:00:00+00 | PENDING | 2026-11-17 19:26:54.198+00
(1 row)
```

O schema real é `scheduling`, e a tabela, `schedulings`. O `-d conecta_dev` foi passado explicitamente porque o `POSTGRES_DB` do contêiner é `conecta_db` (legado).

### 4. Reinicialização somente da API

```text
=== [4] docker compose restart api
 Container conecta-api  Restarting
 Container conecta-api  Started
api StartedAt:      2026-11-17T19:26:05.216448784Z -> 2026-11-17T19:27:06.13785093Z
postgres StartedAt: 2026-11-17T17:03:24.333773679Z -> 2026-11-17T17:03:24.333773679Z
[Nest] 1  - 11/17/2026, 7:27:07 PM     LOG [NestApplication] Nest application successfully started +1ms
```

O PostgreSQL não foi reiniciado (`StartedAt` inalterado) e nenhum volume foi tocado.

### 5. SQL depois do reinício e comparação

```text
=== [5] SQL depois do restart (19:27:08Z)
 c78264d4-2203-4a71-bd58-1ae21829fa30 | f448383e-503c-4536-9d32-4d7b49e51966 | c19f9703-1c94-4dc9-a40b-f4d3224505ce | 2026-11-22 19:00:00+00 | 2026-11-22 20:00:00+00 | PENDING | 2026-11-17 19:26:54.198+00
(1 row)

=== [6] comparacao
$ diff c-before.txt c-after.txt
IDENTICOS
```

### 6. A API reiniciada enxerga o dado persistido

```text
=== POST repetido (mesmo prestador e horario do registro c78264d4) apos o restart
HTTP/1.1 409 Conflict

{"statusCode":409,"error":"SchedulingConflictException","message":"The professional already has a scheduling in this time window."}
```

**Conclusão:** durabilidade comprovada. O mesmo registro foi observado por SQL antes e depois de reiniciar a API, e o novo processo da API usou esse registro para rejeitar o conflito.

## Parte 2 - Testes e regressões [Exec]

| Script | Implementado | Executado agora | Resultado |
| --- | --- | --- | --- |
| `pnpm test` (unitários, HTTP mock, integrado em memória) | Sim | Sim (host) | **6 arquivos / 21 testes / 21 aprovados** |
| `pnpm test:integration` (PostgreSQL, `conecta_test`) | Sim | Sim (host → `localhost:5435`) | **1 arquivo / 5 testes / 5 aprovados** |
| `pnpm test:e2e` | Sim (2 arquivos, `AppModule` + banco do `.env`) | **Não executado** | Fora do escopo: conectaria ao banco de **desenvolvimento** (`conecta_dev`). Regra do Material 10 |

```text
$ pnpm test
 Test Files  6 passed (6)
      Tests  21 passed (21)
   Duration  1.50s

$ docker ps --filter name=conecta-postgres --format '{{.Names}} {{.Status}} project={{.Label "com.docker.compose.project"}}'
conecta-postgres Up 2 hours (healthy) project=conecta-pro-services-backend

$ pnpm test:integration
 Test Files  1 passed (1)
      Tests  5 passed (5)
   Duration  904ms

$ pnpm build    -> nest build (sem erros)
$ pnpm lint     -> 1 warning preexistente (scheduling.repository.interface.ts:6)

$ git status --short     (pnpm-lock.yaml NÃO alterado)
 M conecta-pro-services-backend/.env.example
 M conecta-pro-services-backend/compose.yaml
 M conecta-pro-services-backend/package.json
 M conecta-pro-services-backend/src/database/data-source.ts
?? conecta-pro-services-backend/.dockerignore
?? conecta-pro-services-backend/Dockerfile
```

| Comparação | Linha de base (10-01) | Agora |
| --- | --- | --- |
| `pnpm test` | 21/21 | 21/21 |
| `pnpm test:integration` | 5/5 | 5/5 |

Sem regressões. A alteração do DataSource não afeta os testes: o helper de testes do Material 09 registra a classe de migration explicitamente.

**Testes automatizados ≠ evidência do ambiente Docker:** as suítes rodam no host. A comprovação do ambiente containerizado é a da Parte 1 (build, Compose, rede, logs, HTTP, SQL, reinício).

## Diagnóstico de falhas (Fase 11)

| # | Categoria | Comando | Sintoma / mensagem real | Causa | Correção | Verificação |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Execução (pnpm no runtime) | `docker compose run --rm --no-deps api pnpm migration:show:prod` | `ERR_PNPM_PACKAGE_MANAGER_REMOVE_MODULES_DIR ... Permission denied (os error 13)` | O pnpm 12 reinstala dependências antes de scripts; `node_modules` é do root e o processo roda como `node` | `ENV pnpm_config_verify_deps_before_run=false` (o prefixo `npm_config_` foi testado e não funcionou) | `[X] 1 CreateSchedulings1793060000000` |
| 2 | TypeORM (DataSource) | Análise do código | Glob `src/database/migrations/*.ts` inexistente na imagem | Caminho relativo ao CWD e só `.ts` | Caminho relativo ao arquivo e extensão do arquivo em execução | `migration:show` OK em ts-node e em `dist/` |
| 3 | Rede/porta (preventivo) | `docker compose config --hash postgres` | Hash do arquivo (5432) ≠ hash do container | Porta 5432 do host ocupada; container criado com 5435 | `"5435:5432"` | Hash idêntico; Postgres `Running`, não recriado |
| 4 | Observação | `pg_stat_activity` logo após o start | 0 linhas | Pool `pg` fecha conexões ociosas | Consulta repetida após a requisição | Linha de `172.20.0.3` |

Nenhum comando destrutivo foi usado como correção.
