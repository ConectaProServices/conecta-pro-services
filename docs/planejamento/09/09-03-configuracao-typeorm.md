# 09-03 - Configuração do TypeORM

## 1. Pacotes (`package.json`, já instalados, nada reinstalado)

`@nestjs/typeorm` ^12.0.2, `typeorm` ^1.1.2, `pg` ^8.23.1, `@nestjs/config` ^12.0.1, `dotenv` ^18.0.9, `ts-node` ^10.9.2.

## 2. `AppModule` (`src/app.module.ts`)

Todos os módulos foram preservados (`ObserveModule`, `ConfigModule` global, `TypeOrmModule.forRootAsync`, `SchedulingModule`). Uma única linha foi alterada:

```diff
         database: config.getOrThrow<string>('DB_NAME'),
         autoLoadEntities: true,
-        synchronize: true, 
+        synchronize: false,
```

| Item | Valor |
| --- | --- |
| Conexão | `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME` via `ConfigService.getOrThrow` |
| `autoLoadEntities` | `true` (registra a `SchedulingEntity` do `forFeature`) |
| `synchronize` | **`false`** (antes `true`; ver evidência do problema em 09-01 §3 e 08-07) |

Justificativa: com `synchronize: true`, o schema de `conecta_db` foi criado a partir da entidade, sem histórico e sem a constraint de exclusão. Além disso, a entidade não declarava a constraint, então o `synchronize` a removeria mesmo se ela existisse (09-04 §3). O schema agora é controlado só por migrations.

## 3. DataSource da CLI (`src/database/data-source.ts`, sem alteração)

```typescript
import 'dotenv/config';
import { DataSource } from 'typeorm';
import { SchedulingEntity } from '../infraestructure/persistence/scheduling/scheduling.orm-entity.js';

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [SchedulingEntity],
  migrations: ['src/database/migrations/*.ts'],
  synchronize: false,
});
```

- ESM `nodenext` com imports relativos `.js`: compatível.
- Script: `"typeorm": "typeorm-ts-node-esm -d src/database/data-source.ts"` (funcionou nos comandos abaixo).
- O destino é definido por `DB_*`. Como o `dotenv` **não sobrescreve** variáveis já definidas no processo, os comandos foram executados com `DB_NAME=conecta_dev` explícito antes de trocar o `.env`. Isso garante o banco de destino.

## 4. Verificações antes de aplicar a migration

| Verificação | Comando | Resultado |
| --- | --- | --- |
| Banco de destino | `DB_NAME=conecta_dev pnpm typeorm ...` | `conecta_dev` (criado vazio em 09-02) |
| Histórico | `DB_NAME=conecta_dev pnpm typeorm migration:show` | `[ ] CreateSchedulings1793060000000` (pendente) |
| Esquema atual | `SELECT count(*) FROM information_schema.tables ...` | 1 tabela: a `public.migrations`, criada pelo próprio `migration:show` (sem tabelas da funcionalidade) |
| Conflitos | — | Nenhum: schema `scheduling` inexistente em `conecta_dev` |

`conecta_db` (legado criado pelo `synchronize`) **não** recebeu a migration. Ela falharia sobre os objetos existentes, e a equipe decidiu preservá-lo intacto.

## 5. Variáveis de ambiente

- `.env` local: `DB_NAME` trocado de `conecta_db` para **`conecta_dev`** depois de aplicar a migration (`sed -i 's/^DB_NAME=conecta_db$/DB_NAME=conecta_dev/'`); `TEST_DB_*` acrescentadas (09-02).
- `.env.example` (versionado): acrescentadas as chaves `TEST_DB_*` **sem valores**.

## 6. Resultado após a configuração

```text
$ pnpm build        -> nest build (sem erros)
$ pnpm test         -> Test Files 6 passed (6) | Tests 21 passed (21)
$ pnpm test:e2e     -> Test Files 2 passed (2) | Tests 3 passed (3)   (agora contra conecta_dev migrado)
```

## 7. Pendências

- Cada desenvolvedor precisa aplicar a migration no próprio banco (`pnpm typeorm migration:run`). Com `synchronize: false`, a aplicação não cria mais as tabelas sozinha. Isso deve constar no README (sugestão para o PR).
- `ObserveModule` com `appKey: 'YOUR_APP_KEY'` hard-coded (preexistente, fora do escopo).
