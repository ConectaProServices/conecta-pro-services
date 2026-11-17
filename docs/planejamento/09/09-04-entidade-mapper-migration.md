# 09-04 - Entidade ORM, Mapper e Migration

> Situação: entidade ORM, mapper e migration **já existiam** na `main`. Nesta etapa foram revisados, a migration foi **aplicada pela primeira vez** (em `conecta_dev` e `conecta_test`) e a entidade ORM foi **ajustada** para concordar exatamente com a migration.

## 1. Entidade ORM (`src/infraestructure/persistence/scheduling/scheduling.orm-entity.ts`)

Separada da entidade de domínio (`Scheduling`, sem decorators de TypeORM). Código após o ajuste:

```typescript
import { Column, CreateDateColumn, DeleteDateColumn, Entity, Exclusion, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import { SchedulingStatus } from '../../../common/enum/scheduling-status.enum.js';

// Espelha a constraint criada pela migration CreateSchedulings1793060000000 (INV-1: sem sobreposição
// de agendamentos ativos do mesmo prestador). Sem esta declaração, o TypeORM trata a constraint como
// "desconhecida" e uma migration gerada (ou o synchronize) a removeria.
@Exclusion(
    'EXCL_schedulings_no_overlap',
    `USING gist ("professionalId" WITH =, tstzrange("startsAt", "endsAt") WITH &&) WHERE ("status" IN ('PENDING', 'CONFIRMED') AND "deletedAt" IS NULL)`,
)
@Entity({ name: 'schedulings', schema: 'scheduling' })
export class SchedulingEntity {
    @PrimaryColumn({ type: 'uuid', primaryKeyConstraintName: 'PK_schedulings_schedulingId' })
    schedulingId: string;

    @Column({ type: 'uuid' })
    customerId: string;

    @Column({ type: 'uuid' })
    serviceId: string;

    @Column({ type: 'uuid' })
    professionalId: string;

    @Column({ type: 'timestamp with time zone' })
    startsAt: Date;

    @Column({ type: 'timestamp with time zone' })
    endsAt: Date;

    @Column({ type: 'enum', enum: SchedulingStatus })
    status: SchedulingStatus;

    @CreateDateColumn({ type: 'timestamp with time zone' })
    createdAt: Date;

    @UpdateDateColumn({ type: 'timestamp with time zone' })
    updatedAt: Date;

    @DeleteDateColumn({ type: 'timestamp with time zone', nullable: true })
    deletedAt: Date | null;
}
```

### Decisões de mapeamento

| Decisão | Motivo |
| --- | --- |
| `@PrimaryColumn` uuid (sem `@PrimaryGeneratedColumn`) | O `schedulingId` é gerado na aplicação (`randomUUID()` no `SchedulingService`) |
| Schema `scheduling`, tabela `schedulings` | Convenção preexistente da equipe |
| Colunas em camelCase com aspas | Nomes iguais aos atributos de domínio (sem `name:` customizado) |
| `timestamp with time zone` | Instantes absolutos (UTC); evita ambiguidade de fuso |
| `enum` com os 4 valores de `SchedulingStatus` | Espelha o enum de domínio |
| `@Exclusion(...)` **(novo)** | Declara a constraint de INV-1 que já existia na migration (ver §3) |
| `primaryKeyConstraintName` **(novo)** | Alinha o nome da PK ao da migration (`PK_schedulings_schedulingId`) |

Atributos novos no domínio ou no banco: **nenhum**.

## 2. Migration (`src/database/migrations/1793060000000-CreateScheduling.ts`, sem alteração)

```typescript
import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateSchedulings1793060000000 implements MigrationInterface {
    name = 'CreateSchedulings1793060000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS "scheduling"`);

        await queryRunner.query(`CREATE TYPE "scheduling"."schedulings_status_enum" AS ENUM('PENDING', 'CONFIRMED', 'CANCELED', 'COMPLETED')`);

        await queryRunner.query(`CREATE TABLE "scheduling"."schedulings" (
            "schedulingId" uuid NOT NULL,
            "customerId" uuid NOT NULL,
            "serviceId" uuid NOT NULL,
            "professionalId" uuid NOT NULL,
            "startsAt" TIMESTAMP WITH TIME ZONE NOT NULL,
            "endsAt" TIMESTAMP WITH TIME ZONE NOT NULL,
            "status" "scheduling"."schedulings_status_enum" NOT NULL,
            "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
            "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
            "deletedAt" TIMESTAMP WITH TIME ZONE,
            CONSTRAINT "PK_schedulings_schedulingId" PRIMARY KEY ("schedulingId")
        )`);

        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS btree_gist`);
        await queryRunner.query(`ALTER TABLE "scheduling"."schedulings"
            ADD CONSTRAINT "EXCL_schedulings_no_overlap"
            EXCLUDE USING gist (
                "professionalId" WITH =,
                tstzrange("startsAt", "endsAt") WITH &&
            )
            WHERE ("status" IN ('PENDING', 'CONFIRMED') AND "deletedAt" IS NULL)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "scheduling"."schedulings" DROP CONSTRAINT "EXCL_schedulings_no_overlap"`);
        await queryRunner.query(`DROP TABLE "scheduling"."schedulings"`);
        await queryRunner.query(`DROP TYPE "scheduling"."schedulings_status_enum"`);
        await queryRunner.query(`DROP SCHEMA IF EXISTS "scheduling"`);
    }
}
```

O `down` nunca foi executado (sem `migration:revert`).

## 3. Concordância entidade × migration (`migration:generate --dryrun`)

### Antes do ajuste na entidade

```text
$ DB_NAME=conecta_dev pnpm typeorm migration:generate src/database/migrations/DriftCheck --dryrun
...
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "scheduling"."schedulings" DROP CONSTRAINT "EXCL_schedulings_no_overlap"`);
    }
```

O TypeORM queria **remover** a constraint de INV-1, porque ela não estava declarada na entidade. Esse mesmo mecanismo explica a ausência dela no `conecta_db` criado pelo `synchronize`.

### Depois do ajuste

```text
$ DB_NAME=conecta_dev pnpm typeorm migration:generate src/database/migrations/DriftCheck --dryrun
No changes in database schema were found - cannot generate a migration. To create a new empty migration use "typeorm migration:create" command
[ELIFECYCLE] Command failed with exit code 1.
```

O exit code 1 é o comportamento padrão quando não há diferenças. Com `--dryrun`, nenhum arquivo foi criado (`ls src/database/migrations/` → só `1793060000000-CreateScheduling.ts`).

## 4. Aplicação da migration em `conecta_dev`

```text
$ DB_NAME=conecta_dev pnpm typeorm migration:show
[ ] CreateSchedulings1793060000000

$ DB_NAME=conecta_dev pnpm typeorm migration:run
query: CREATE TYPE "scheduling"."schedulings_status_enum" AS ENUM('PENDING', 'CONFIRMED', 'CANCELED', 'COMPLETED')
query: CREATE TABLE "scheduling"."schedulings" ( ... CONSTRAINT "PK_schedulings_schedulingId" PRIMARY KEY ("schedulingId") )
query: CREATE EXTENSION IF NOT EXISTS btree_gist
query: ALTER TABLE "scheduling"."schedulings" ADD CONSTRAINT "EXCL_schedulings_no_overlap" EXCLUDE USING gist ( ... )
query: INSERT INTO "migrations"("timestamp", "name") VALUES ($1, $2) -- PARAMETERS: [1793060000000,"CreateSchedulings1793060000000"]
Migration CreateSchedulings1793060000000 has been executed successfully.
query: COMMIT

$ DB_NAME=conecta_dev pnpm typeorm migration:show
[X] 1 CreateSchedulings1793060000000
```

### Esquema esperado × criado (`\d scheduling.schedulings` em `conecta_dev`)

```text
     Column     |                Type                | Nullable | Default
----------------+------------------------------------+----------+---------
 schedulingId   | uuid                               | not null |
 customerId     | uuid                               | not null |
 serviceId      | uuid                               | not null |
 professionalId | uuid                               | not null |
 startsAt       | timestamp with time zone           | not null |
 endsAt         | timestamp with time zone           | not null |
 status         | scheduling.schedulings_status_enum | not null |
 createdAt      | timestamp with time zone           | not null | now()
 updatedAt      | timestamp with time zone           | not null | now()
 deletedAt      | timestamp with time zone           |          |
Indexes:
    "PK_schedulings_schedulingId" PRIMARY KEY, btree ("schedulingId")
    "EXCL_schedulings_no_overlap" EXCLUDE USING gist ("professionalId" WITH =, tstzrange("startsAt", "endsAt") WITH &&) WHERE ((status = ANY (ARRAY['PENDING'::scheduling.schedulings_status_enum, 'CONFIRMED'::scheduling.schedulings_status_enum])) AND "deletedAt" IS NULL)
```

Igual à migration: 10 colunas, tipos, nulabilidade, defaults, PK nomeada e exclusion constraint.

```text
$ ... -c "SELECT conname, contype FROM pg_constraint WHERE conrelid='scheduling.schedulings'::regclass;"
 PK_schedulings_schedulingId | p
 EXCL_schedulings_no_overlap | x

$ ... -t -c "SELECT extname FROM pg_extension ORDER BY 1;"
 btree_gist
 plpgsql
```

### Tabela de histórico × tabela da funcionalidade

```text
$ ... -c 'SELECT * FROM public.migrations;'          (histórico do TypeORM)
 id |   timestamp   |              name
----+---------------+--------------------------------
  1 | 1793060000000 | CreateSchedulings1793060000000

$ ... -c 'SELECT count(*) FROM scheduling.schedulings;'   (dados da funcionalidade)
 count
-------
     0
```

Em `conecta_test`, a migration foi aplicada pelo teste automatizado (`runMigrations()`, 09-07), com resultado equivalente: histórico com `CreateSchedulings1793060000000`, tabela pertencente a `conecta_test_user` e as duas constraints.

## 5. Mapper (`src/infraestructure/persistence/scheduling/scheduling.orm-mapper.ts`, sem alteração)

```typescript
import { Scheduling } from '../../../modules/scheduling/entities/scheduling.entity.js';
import { SchedulingEntity } from './scheduling.orm-entity.js';

export class SchedulingOrmMapper {
    static toDomain(entity: SchedulingEntity): Scheduling {
        return new Scheduling(
            entity.schedulingId,
            entity.customerId,
            entity.serviceId,
            entity.professionalId,
            entity.startsAt,
            entity.endsAt,
            entity.status,
            entity.createdAt,
            entity.updatedAt,
            entity.deletedAt ?? null,
        );
    }

    static toPersistence(scheduling: Scheduling): SchedulingEntity {
        const entity = new SchedulingEntity();
        entity.schedulingId = scheduling.schedulingId;
        entity.customerId = scheduling.customerId;
        entity.serviceId = scheduling.serviceId;
        entity.professionalId = scheduling.professionalId;
        entity.startsAt = scheduling.startsAt;
        entity.endsAt = scheduling.endsAt;
        entity.status = scheduling.getStatus();
        entity.createdAt = scheduling.createdAt;
        entity.updatedAt = scheduling.updatedAt;
        entity.deletedAt = scheduling.deletedAt;
        return entity;
    }
}
```

| Verificação | Situação |
| --- | --- |
| `toPersistence` / `toDomain` bidirecionais e estáticos | Sim |
| Sem regras de negócio | Sim: só cópia de campos. `toDomain` usa o construtor (reconstituição), não `Scheduling.request()`, então não reaplica RN01/RN05 a dados já persistidos, o que está correto |
| Entidade ORM confinada à infraestrutura | Sim: Service e Controller não importam `SchedulingEntity` |
| Status privado do domínio | Lido via `getStatus()` |
