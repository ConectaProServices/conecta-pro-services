# 10-06 - Migrations e Inicialização

## Parte 1 - Migrations no ambiente containerizado

### 1. Scripts (inexistentes → criados)

```diff
     "typeorm": "typeorm-ts-node-esm -d src/database/data-source.ts",
+    "migration:show:prod": "typeorm migration:show -d dist/database/data-source.js",
+    "migration:run:prod": "typeorm migration:run -d dist/database/data-source.js"
```

O script `typeorm` (ts-node, fontes `.ts`) foi preservado para desenvolvimento.

### 2. DataSource: ajuste mínimo para o código compilado

Antes, `migrations: ['src/database/migrations/*.ts']` era relativo ao diretório de execução e só encontrava `.ts`. Dentro da imagem não existe `src/`.

```diff
 import 'dotenv/config';
+import { dirname, join } from 'node:path';
+import { fileURLToPath } from 'node:url';
 import { DataSource } from 'typeorm';
 import { SchedulingEntity } from '../infraestructure/persistence/scheduling/scheduling.orm-entity.js';

+// Resolve as migrations a partir da localização deste arquivo:
+// - desenvolvimento (CLI via ts-node): src/database/migrations/*.ts
+// - runtime compilado (contêiner):     dist/database/migrations/*.js
+// A extensão segue a do próprio arquivo para não capturar os .d.ts gerados em dist/.
+const currentFile = fileURLToPath(import.meta.url);
+const migrationsExtension = currentFile.endsWith('.ts') ? 'ts' : 'js';
+
 export default new DataSource({
   ...
-  migrations: ['src/database/migrations/*.ts'],
+  migrations: [join(dirname(currentFile), 'migrations', `*.${migrationsExtension}`)],
   synchronize: false,
 });
```

- ESM: usa `import.meta.url` (o projeto é `"type": "module"`, `nodenext`).
- Um padrão `*.{ts,js}` foi descartado de propósito: em `dist/` existe `1793060000000-CreateScheduling.d.ts`, que seria carregado como migration.

Verificação no host, nos dois modos [Exec]:

```text
$ pnpm typeorm migration:show                 (ts-node, src/*.ts, DB_NAME=conecta_dev)
[X] 1 CreateSchedulings1793060000000
$ pnpm build && pnpm migration:show:prod      (node, dist/*.js)
[X] 1 CreateSchedulings1793060000000
```

### 3. Pré-condições

| # | Pré-condição | Situação |
| --- | --- | --- |
| 1 | PostgreSQL de dev ativo e banco correto | `conecta-postgres` `healthy`; `DB_NAME=conecta_dev` no contêiner |
| 2 | DataSource e migrations compilados | `dist/database/data-source.js`, `dist/database/migrations/1793060000000-CreateScheduling.js` na imagem |
| 3 | Scripts apontando para o DataSource correto | `-d dist/database/data-source.js` |
| 4 | Histórico inspecionado | Ver §4 |
| 5 | Sem operações destrutivas | Nenhuma |

### 4. Histórico consultado a partir do contêiner [Exec]

Primeira tentativa (falha do pnpm, corrigida em 10-02 §5):

```text
$ docker compose run --rm --no-deps api pnpm migration:show:prod
Error: ERR_PNPM_PACKAGE_MANAGER_REMOVE_MODULES_DIR
  × installing dependencies
  ╰─▶ Failed to remove /app/node_modules/class-transformer from the modules
      directory: Permission denied (os error 13)
```

Após a correção e a reconstrução da imagem:

```text
$ docker compose run --rm --no-deps api pnpm migration:show:prod
$ typeorm migration:show -d dist/database/data-source.js
[X] 1 CreateSchedulings1793060000000
```

A consulta saiu do contêiner (`DB_HOST=postgres`) para `conecta_dev`. **Nenhuma migration pendente: `migration:run:prod` NÃO foi executado.** Nenhuma migration nova foi criada; nenhum `synchronize`, `revert` ou edição manual do histórico.

## Parte 2 - Inicialização

### 5. Subida [Exec]

```text
postgres ANTES:  683617b089b1 created=2026-11-03T17:42:46.51057144Z
$ docker compose up -d --build api
 api  Built
 Container conecta-postgres  Running
 Container conecta-api  Creating
 Container conecta-api  Created
 Container conecta-postgres  Waiting
 Container conecta-postgres  Healthy
 Container conecta-api  Starting
 Container conecta-api  Started
postgres DEPOIS: 683617b089b1 created=2026-11-03T17:42:46.51057144Z

$ docker compose ps
NAME               SERVICE    STATE     STATUS                 PORTS
conecta-api        api        running   Up 6 seconds           0.0.0.0:3000->3000/tcp
conecta-postgres   postgres   running   Up 2 hours (healthy)   0.0.0.0:5435->5432/tcp
```

O banco de testes não é um serviço separado neste projeto, então nada foi iniciado além de `api` e da dependência `postgres` (já em execução).

### 6. Logs da API [Exec]

```text
$ docker compose logs api
[Nest] 1  - 11/17/2026, 7:26:05 PM     LOG [NestFactory] Starting Nest application...
[Nest] 1  - 11/17/2026, 7:26:05 PM     LOG [InstanceLoader] TypeOrmModule dependencies initialized +12ms
[Nest] 1  - 11/17/2026, 7:26:05 PM     LOG [InstanceLoader] ConfigHostModule dependencies initialized +9ms
[Nest] 1  - 11/17/2026, 7:26:05 PM     LOG [InstanceLoader] DiscoveryModule dependencies initialized +0ms
[Nest] 1  - 11/17/2026, 7:26:05 PM     LOG [InstanceLoader] AppModule dependencies initialized +1ms
[Nest] 1  - 11/17/2026, 7:26:05 PM     LOG [InstanceLoader] ConfigModule dependencies initialized +0ms
[Nest] 1  - 11/17/2026, 7:26:05 PM     LOG [InstanceLoader] ObserveModule dependencies initialized +9ms
[Nest] 1  - 11/17/2026, 7:26:05 PM     LOG [InstanceLoader] TypeOrmCoreModule dependencies initialized +17ms
[Nest] 1  - 11/17/2026, 7:26:05 PM     LOG [InstanceLoader] TypeOrmModule dependencies initialized +0ms
[Nest] 1  - 11/17/2026, 7:26:05 PM     LOG [InstanceLoader] SchedulingModule dependencies initialized +0ms
[Nest] 1  - 11/17/2026, 7:26:05 PM     LOG [RoutesResolver] AppController {/}: +5ms
[Nest] 1  - 11/17/2026, 7:26:05 PM     LOG [RouterExplorer] Mapped {/, GET} route +2ms
[Nest] 1  - 11/17/2026, 7:26:05 PM     LOG [RoutesResolver] SchedulingController {/schedulings}: +0ms
[Nest] 1  - 11/17/2026, 7:26:05 PM     LOG [RouterExplorer] Mapped {/schedulings, POST} route +1ms
[Nest] 1  - 11/17/2026, 7:26:05 PM     LOG [ObserveAgentWorker] Observe agent worker initialized.
[Nest] 1  - 11/17/2026, 7:26:05 PM     LOG [NestApplication] Nest application successfully started +2ms
```

| Confirmação | Evidência |
| --- | --- |
| PostgreSQL `healthy` | `docker compose ps` |
| API em execução | `conecta-api running` |
| NestJS e módulos | `InstanceLoader ... SchedulingModule dependencies initialized` |
| Rota do UC01 | `Mapped {/schedulings, POST} route` |
| TypeORM conectado | `TypeOrmCoreModule dependencies initialized` (só conclui após conectar ao banco) + conexão em `pg_stat_activity` (10-05) |
| Porta HTTP | `0.0.0.0:3000->3000/tcp`; requisições atendidas (10-07) |
| Falhas | Nenhuma no log |
