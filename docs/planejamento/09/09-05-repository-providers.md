# 09-05 - Repositório TypeORM e Providers

## 1. Contrato implementado (inalterado)

`src/modules/scheduling/repositories/scheduling.repository.interface.ts`

```typescript
import type { Scheduling } from "../entities/scheduling.entity.js";

export const SCHEDULING_REPOSITORY = Symbol('SCHEDULING_REPOSITORY');

export interface ISchedulingRepository {
    findScheduleById(id: string): Promise<any | null>;

    existsOverlapping(professionalId: string, startsAt: Date, endsAt: Date): Promise<boolean>;

    save(scheduling: Scheduling): Promise<Scheduling>;
}
```

## 2. Adaptador (`src/infraestructure/persistence/scheduling/typeorm-scheduling.repository.ts`, sem alteração)

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, LessThan, MoreThan, Repository } from 'typeorm';
import { Scheduling } from '../../../modules/scheduling/entities/scheduling.entity.js';
import type { ISchedulingRepository } from '../../../modules/scheduling/repositories/scheduling.repository.interface.js';
import { SchedulingStatus } from '../../../common/enum/scheduling-status.enum.js';
import { SchedulingConflictException } from '../../../common/exceptions/scheduling-conflict.exception.js';
import { SchedulingEntity } from './scheduling.orm-entity.js';
import { SchedulingOrmMapper } from './scheduling.orm-mapper.js';

const EXCLUSION_VIOLATION = '23P01';

@Injectable()
export class TypeOrmSchedulingRepository implements ISchedulingRepository {
    constructor(
        @InjectRepository(SchedulingEntity)
        private readonly repository: Repository<SchedulingEntity>,
    ) {}

    async findScheduleById(id: string): Promise<Scheduling | null> {
        const entity = await this.repository.findOne({
            where: { schedulingId: id },
        });

        if (!entity) {
            return null;
        }

        return SchedulingOrmMapper.toDomain(entity);
    }

    async existsOverlapping(professionalId: string, startsAt: Date, endsAt: Date): Promise<boolean> {
        return this.repository.exists({
            where: {
                professionalId,
                status: In([SchedulingStatus.PENDING, SchedulingStatus.CONFIRMED]),
                startsAt: LessThan(endsAt),
                endsAt: MoreThan(startsAt),
            },
        });
    }

    async save(scheduling: Scheduling): Promise<Scheduling> {
        const entity = SchedulingOrmMapper.toPersistence(scheduling);

        try {
            const savedEntity = await this.repository.save(entity);
            return SchedulingOrmMapper.toDomain(savedEntity);
        } catch (error) {
            if (this.isExclusionViolation(error)) {
                throw new SchedulingConflictException();
            }
            throw error;
        }
    }

    private isExclusionViolation(error: unknown): boolean {
        const candidate = error as { code?: string; driverError?: { code?: string } };
        return (candidate?.driverError?.code ?? candidate?.code) === EXCLUSION_VIOLATION;
    }
}
```

| Requisito do Material 09 | Situação |
| --- | --- |
| `@Injectable()` + `@InjectRepository(SchedulingEntity)` | Sim |
| `Repository<SchedulingEntity>` tipado por completo | Sim (campo chamado `repository`, nome preexistente) |
| Entrada via `SchedulingOrmMapper.toPersistence` | Sim |
| Persistência via `await this.repository.save(...)` | Sim |
| Saída via `SchedulingOrmMapper.toDomain` | Sim |
| Assinaturas do contrato preservadas | Sim (`save(scheduling: Scheduling): Promise<Scheduling>`, etc.) |
| Imports ESM com `.js` | Sim |
| Sem TypeORM no Service e sem SQL no Controller | Sim |

Observações de revisão (não alteradas; registradas como sugestão):

- `findScheduleById` no contrato retorna `Promise<any | null>` (origem do warning de lint). O adaptador já devolve `Scheduling | null`; tipar o contrato com `Scheduling` seria uma melhoria, mas alteraria o contrato, que é de outra Sub-Issue.
- `existsOverlapping` não filtra `deletedAt IS NULL` (o TypeORM aplica o filtro de soft delete automaticamente em `exists`/`find` com `@DeleteDateColumn`). Isso é coerente com o `WHERE` da constraint.

## 3. Módulo e provider (`src/modules/scheduling/scheduling.module.ts`, sem alteração)

```typescript
@Module({
    imports: [TypeOrmModule.forFeature([SchedulingEntity])],
    controllers: [SchedulingController],
    providers: [
        SchedulingService,
        TypeOrmSchedulingRepository,
        InMemoryServiceCatalog,
        { provide: SCHEDULING_REPOSITORY, useExisting: TypeOrmSchedulingRepository },
        { provide: SERVICE_CATALOG, useExisting: InMemoryServiceCatalog },
    ],
    exports: [SchedulingService],
})
export class SchedulingModule {}
```

- A entidade está registrada em `TypeOrmModule.forFeature([SchedulingEntity])` e carregada pelo `autoLoadEntities` do `AppModule`.
- O token `SCHEDULING_REPOSITORY` resolve para o `TypeOrmSchedulingRepository`. O Material 09 sugere `useClass`; a equipe usa `useExisting` (alias para a instância registrada pela classe). O efeito é o mesmo, e o padrão foi preservado.
- **Nenhuma troca de provider foi necessária:** a produção já usava o adaptador TypeORM. A mudança real desta etapa foi garantir que o banco tenha o schema da migration (`synchronize: false` + migration aplicada).

## 4. Preservação das suítes anteriores

| Suíte | Arquivo | Depende de PostgreSQL? | Como continua isolada |
| --- | --- | --- | --- |
| 1. Unitário do Service | `services/*.spec.ts` | Não | Repositório e catálogo via `useValue` |
| 2. HTTP com Service mock | `controllers/scheduling.controller.spec.ts` | Não | Só o Controller no módulo de teste |
| 3. Integrado em memória (Material 08) | `scheduling.integration.spec.ts` | Não | `overrideProvider(getRepositoryToken(SchedulingEntity)).useValue({})` + `overrideProvider(SCHEDULING_REPOSITORY).useClass(InMemorySchedulingRepository)`, já presentes desde o Material 08 |
| 4. Integração PostgreSQL (novo) | `test/integration/*.integration-spec.ts` | Sim, só `conecta_test` | Config e script próprios (`pnpm test:integration`) |
| (E2E) | `test/**/*.e2e-spec.ts` | Sim, banco do `.env` (`conecta_dev`) | `pnpm test:e2e` |

Nenhuma asserção de teste anterior foi alterada.

## 5. Evidências de compilação, DI e inicialização

```text
$ pnpm build   -> nest build (sem erros)

$ PORT=3000 node dist/main        (DB_NAME=conecta_dev, synchronize: false)
LOG [InstanceLoader] SchedulingModule dependencies initialized
LOG [RouterExplorer] Mapped {/schedulings, POST} route
LOG [NestApplication] Nest application successfully started
```

A requisição `POST /schedulings` gravou em `conecta_dev` (09-06), o que confirma que o token foi resolvido para o adaptador TypeORM conectado ao banco migrado.
