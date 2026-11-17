# 08-05 - Testes Integrados e Evidência de Armazenamento

## 1. Identificação

- Sub-Issue: #15 (SUB-06, testes automatizados), executada por João e revisada por Layssa
- Branch: `feature/15-teste-integrado-backend`
- Arquivos criados:
  - `conecta-pro-services-backend/src/modules/scheduling/scheduling.integration.spec.ts` (teste integrado, arquivo único)
  - `conecta-pro-services-backend/src/infraestructure/persistence/scheduling/in-memory-scheduling.repository.ts` (adaptador em memória do contrato; coordenação registrada na #13)
- Runner: Vitest 4.1.11 (`vi.spyOn` só para observar; nenhum `vi.fn()` substitui componente). HTTP: Supertest 7.3.1 + `@nestjs/testing`
- O sufixo `.spec.ts` faz o arquivo rodar no `pnpm test`, sem banco.

## 2. Objetivo e componentes reais

Exercitar `HTTP → SchedulingController → SchedulingService → SCHEDULING_REPOSITORY → InMemorySchedulingRepository` com o **`SchedulingModule` real**.

| Componente | Real? | Como |
| --- | --- | --- |
| `SchedulingModule` | Sim | `imports: [SchedulingModule]` |
| `SchedulingController`, `RequestSchedulingDto` | Sim | Do módulo |
| `ValidationPipe` + `DomainHttpExceptionFilter` | Sim | Mesma configuração do `main.ts` |
| `SchedulingService` | Sim | Do módulo (sem `useValue`) |
| `InMemoryServiceCatalog` (`SERVICE_CATALOG`) | Sim | Do módulo |
| `InMemorySchedulingRepository` (`SCHEDULING_REPOSITORY`) | Sim | `overrideProvider(SCHEDULING_REPOSITORY).useClass(InMemorySchedulingRepository)` |
| `getRepositoryToken(SchedulingEntity)` | Valor inerte `{}` | Necessário porque o módulo instancia o `TypeOrmSchedulingRepository`, que não participa do fluxo (08-06 §3) |

## 3. Código completo

### 3.1 `src/infraestructure/persistence/scheduling/in-memory-scheduling.repository.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { SchedulingStatus } from '../../../common/enum/scheduling-status.enum.js';
import { Scheduling } from '../../../modules/scheduling/entities/scheduling.entity.js';
import type { ISchedulingRepository } from '../../../modules/scheduling/repositories/scheduling.repository.interface.js';

const ACTIVE_STATUSES = [SchedulingStatus.PENDING, SchedulingStatus.CONFIRMED];

/**
 * Adaptador em memória do contrato ISchedulingRepository.
 * Uso: testes integrados do backend (Material 08). Não é a persistência definitiva:
 * o provider de produção do SchedulingModule continua sendo TypeOrmSchedulingRepository.
 */
@Injectable()
export class InMemorySchedulingRepository implements ISchedulingRepository {
    private readonly schedulings = new Map<string, Scheduling>();

    async findScheduleById(id: string): Promise<Scheduling | null> {
        return this.schedulings.get(id) ?? null;
    }

    async existsOverlapping(professionalId: string, startsAt: Date, endsAt: Date): Promise<boolean> {
        for (const scheduling of this.schedulings.values()) {
            if (
                scheduling.professionalId === professionalId &&
                ACTIVE_STATUSES.includes(scheduling.getStatus()) &&
                scheduling.startsAt < endsAt &&
                scheduling.endsAt > startsAt
            ) {
                return true;
            }
        }
        return false;
    }

    async save(scheduling: Scheduling): Promise<Scheduling> {
        this.schedulings.set(scheduling.schedulingId, scheduling);
        return scheduling;
    }
}
```

A semântica de `existsOverlapping` replica a do `TypeOrmSchedulingRepository` (status `PENDING`/`CONFIRMED`, `startsAt < endsAt` e `endsAt > startsAt`).

### 3.2 `src/modules/scheduling/scheduling.integration.spec.ts`

```typescript
import { HttpStatus, type INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SchedulingStatus } from '../../common/enum/scheduling-status.enum.js';
import { DomainHttpExceptionFilter } from '../../common/filters/domain-http-exception.filter.js';
import { DEMO_SERVICE_ID, InMemoryServiceCatalog } from '../../infraestructure/catalog/in-memory-service-catalog.js';
import { InMemorySchedulingRepository } from '../../infraestructure/persistence/scheduling/in-memory-scheduling.repository.js';
import { SchedulingEntity } from '../../infraestructure/persistence/scheduling/scheduling.orm-entity.js';
import { SchedulingController } from './controllers/scheduling.controller.js';
import { Scheduling } from './entities/scheduling.entity.js';
import { SERVICE_CATALOG } from './ports/service-catalog.interface.js';
import { SCHEDULING_REPOSITORY, type ISchedulingRepository } from './repositories/scheduling.repository.interface.js';
import { SchedulingModule } from './scheduling.module.js';
import { SchedulingService } from './services/scheduling.service.js';

const HOUR_IN_MS = 60 * 60 * 1000;
const SERVICE_DURATION_IN_MS = 60 * 60 * 1000; // serviço demo do InMemoryServiceCatalog: 60 min

const hoursFromNow = (hours: number) => new Date(Date.now() + hours * HOUR_IN_MS);

const buildPayload = (overrides: Record<string, unknown> = {}) => ({
  customerId: randomUUID(),
  serviceId: DEMO_SERVICE_ID,
  professionalId: randomUUID(),
  startsAt: hoursFromNow(48).toISOString(),
  ...overrides,
});

describe('POST /schedulings — integração do backend (módulo, controller, service e repositório em memória reais)', () => {
  let app: INestApplication;
  let moduleRef: TestingModule;
  let repository: ISchedulingRepository;

  beforeEach(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [SchedulingModule],
    })
      // O SchedulingModule importa TypeOrmModule.forFeature e instancia o TypeOrmSchedulingRepository,
      // que exige um DataSource. Esse adaptador não participa do fluxo testado: recebe um valor inerte.
      .overrideProvider(getRepositoryToken(SchedulingEntity))
      .useValue({})
      // O token do contrato passa a ser resolvido pelo adaptador em memória real.
      .overrideProvider(SCHEDULING_REPOSITORY)
      .useClass(InMemorySchedulingRepository)
      .compile();

    app = moduleRef.createNestApplication();
    // Mesma configuração de fronteira de src/main.ts
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.useGlobalFilters(new DomainHttpExceptionFilter());
    await app.init();

    repository = moduleRef.get<ISchedulingRepository>(SCHEDULING_REPOSITORY);
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await app?.close();
  });

  it('resolve os componentes reais pelo contêiner (sem mocks de Service ou Repository)', () => {
    expect(moduleRef.get(SchedulingController)).toBeInstanceOf(SchedulingController);
    expect(moduleRef.get(SchedulingService)).toBeInstanceOf(SchedulingService);
    expect(repository).toBeInstanceOf(InMemorySchedulingRepository);
    expect(moduleRef.get(SERVICE_CATALOG)).toBeInstanceOf(InMemoryServiceCatalog);
  });

  it('cria o agendamento com dados válidos (201) e o armazena no repositório em memória', async () => {
    const payload = buildPayload();

    const response = await request(app.getHttpServer())
      .post('/schedulings')
      .send(payload)
      .expect(HttpStatus.CREATED);

    // Evidência 1 — resposta HTTP produzida pelo fluxo real
    expect(response.body).toMatchObject({
      customerId: payload.customerId,
      serviceId: payload.serviceId,
      professionalId: payload.professionalId,
      startsAt: payload.startsAt,
      endsAt: new Date(new Date(payload.startsAt).getTime() + SERVICE_DURATION_IN_MS).toISOString(),
      status: SchedulingStatus.PENDING,
      message: 'Scheduling requested successfully.',
    });
    expect(response.body.schedulingId).toEqual(expect.any(String));

    // Evidência 2 — estado do repositório, consultado pelo próprio contrato (findScheduleById)
    const stored = await repository.findScheduleById(response.body.schedulingId);
    expect(stored).toBeInstanceOf(Scheduling);
    expect(stored?.getStatus()).toBe(SchedulingStatus.PENDING);
    expect(stored?.customerId).toBe(payload.customerId);
    expect(stored?.professionalId).toBe(payload.professionalId);
    expect(stored?.startsAt.toISOString()).toBe(payload.startsAt);
  });

  it('rejeita payload inválido na fronteira HTTP (400) sem acionar o Service nem gravar no repositório', async () => {
    const serviceSpy = vi.spyOn(moduleRef.get(SchedulingService), 'requestScheduling');
    const saveSpy = vi.spyOn(repository, 'save');

    const response = await request(app.getHttpServer())
      .post('/schedulings')
      .send(buildPayload({ customerId: 'nao-e-uuid', startsAt: 'nao-e-data' }))
      .expect(HttpStatus.BAD_REQUEST);

    expect(response.body.statusCode).toBe(400);
    expect(response.body.error).toBe('Bad Request');
    expect(response.body.message).toEqual(
      expect.arrayContaining(['customerId must be a UUID', 'startsAt must be a Date instance']),
    );
    expect(serviceSpy).not.toHaveBeenCalled();
    expect(saveSpy).not.toHaveBeenCalled();
  });

  it('rejeita conflito de agenda do mesmo prestador (409) usando o agendamento já armazenado', async () => {
    const professionalId = randomUUID();
    const startsAt = hoursFromNow(48).toISOString();

    await request(app.getHttpServer())
      .post('/schedulings')
      .send(buildPayload({ professionalId, startsAt }))
      .expect(HttpStatus.CREATED);

    const response = await request(app.getHttpServer())
      .post('/schedulings')
      .send(buildPayload({ professionalId, startsAt }))
      .expect(HttpStatus.CONFLICT);

    expect(response.body.error).toBe('SchedulingConflictException');
  });

  it('rejeita serviço inexistente no catálogo (404) sem gravar no repositório', async () => {
    const saveSpy = vi.spyOn(repository, 'save');

    const response = await request(app.getHttpServer())
      .post('/schedulings')
      .send(buildPayload({ serviceId: randomUUID() }))
      .expect(HttpStatus.NOT_FOUND);

    expect(response.body.error).toBe('CatalogServiceNotFoundException');
    expect(saveSpy).not.toHaveBeenCalled();
  });

  it('rejeita antecedência menor que 24h (422, RN01) sem gravar no repositório', async () => {
    const saveSpy = vi.spyOn(repository, 'save');

    const response = await request(app.getHttpServer())
      .post('/schedulings')
      .send(buildPayload({ startsAt: hoursFromNow(2).toISOString() }))
      .expect(HttpStatus.UNPROCESSABLE_ENTITY);

    expect(response.body.error).toBe('SchedulingTooSoonException');
    expect(saveSpy).not.toHaveBeenCalled();
  });
});

describe('Diagnóstico de composição de DI (contexto de teste isolado)', () => {
  it('falha ao compilar quando o provider de SCHEDULING_REPOSITORY é omitido', async () => {
    const compileWithoutRepository = Test.createTestingModule({
      controllers: [SchedulingController],
      providers: [
        SchedulingService,
        InMemoryServiceCatalog,
        { provide: SERVICE_CATALOG, useExisting: InMemoryServiceCatalog },
        // provider de SCHEDULING_REPOSITORY omitido de propósito
      ],
    }).compile();

    await expect(compileWithoutRepository).rejects.toThrow(
      "Nest can't resolve dependencies of the SchedulingService (?, Symbol(SERVICE_CATALOG)). " +
        'Please make sure that the argument Symbol(SCHEDULING_REPOSITORY) at index [0] is available in the RootTestModule module.',
    );
  });

  it('compila quando o provider do token é registrado (correção)', async () => {
    const isolated = await Test.createTestingModule({
      controllers: [SchedulingController],
      providers: [
        SchedulingService,
        InMemoryServiceCatalog,
        { provide: SERVICE_CATALOG, useExisting: InMemoryServiceCatalog },
        { provide: SCHEDULING_REPOSITORY, useClass: InMemorySchedulingRepository },
      ],
    }).compile();

    expect(isolated.get(SCHEDULING_REPOSITORY)).toBeInstanceOf(InMemorySchedulingRepository);
    await isolated.close();
  });
});
```

## 4. Cenários

| # | Cenário | Status | Verificações-chave | CA da SUB-06 |
| --- | --- | --- | --- | --- |
| 1 | Componentes reais resolvidos | — | Controller, Service, repositório em memória e catálogo vêm do contêiner | — |
| 2 | Payload válido | 201 | Corpo com `schedulingId`, `endsAt` = início + 60 min, `PENDING`; registro recuperável por `findScheduleById` | Fluxo principal |
| 3 | Payload inválido | 400 | Mensagens do DTO; `requestScheduling` e `save` não chamados (espiões que só observam) | — (fronteira) |
| 4 | Conflito do mesmo prestador | 409 | O 2º agendamento colide com o 1º, **gravado de fato** no repositório | Conflito de agenda |
| 5 | Serviço inexistente | 404 | `CatalogServiceNotFoundException`; nada gravado | Erro de catálogo |
| 6 | Antecedência menor que 24h | 422 | `SchedulingTooSoonException`; nada gravado | Antecedência < 24h |
| 7-8 | Diagnóstico de DI | — | Ver 08-06 | — |

O mínimo do Material 08 é válido (2) e inválido (3). Os cenários 4 a 6 cobrem os demais CAs da #15 no nível integrado.

## 5. Delimitação da evidência de armazenamento (Fase 8)

| Pergunta | Resposta |
| --- | --- |
| A resposta HTTP 201 prova o armazenamento? | Não sozinha. O corpo é montado a partir do retorno de `save()`, que poderia apenas ecoar o objeto sem guardá-lo |
| Como o armazenamento foi verificado? | `moduleRef.get(SCHEDULING_REPOSITORY)` devolve **a mesma instância** usada pelo Service (singleton do contêiner). O teste chama `findScheduleById(schedulingId)`, **método do próprio contrato** `ISchedulingRepository`, e obtém um `Scheduling` `PENDING` com os dados do payload |
| O `Map` interno foi acessado? | Não. `schedulings` é `private readonly` e não foi exposto. Nenhum método novo foi criado no contrato ou na classe, e nenhum endpoint `GET` foi adicionado |
| Evidência adicional | Cenário 4 (409): o conflito só é detectado se o 1º agendamento estiver no repositório, porque `existsOverlapping` lê o estado armazenado |
| Limite | Prova o armazenamento **no adaptador em memória durante o teste**. Persistência em banco está comprovada à parte pela consulta SQL em 08-04 §4 e pelo E2E |

## 6. Execuções reais (17/11/2026, `conecta-pro-services-backend/`)

### 6.1 Novo arquivo integrado

```text
$ pnpm exec vitest run src/modules/scheduling/scheduling.integration.spec.ts --reporter=verbose
 ✓ ... > resolve os componentes reais pelo contêiner (sem mocks de Service ou Repository) 138ms
 ✓ ... > cria o agendamento com dados válidos (201) e o armazena no repositório em memória 49ms
 ✓ ... > rejeita payload inválido na fronteira HTTP (400) sem acionar o Service nem gravar no repositório 17ms
 ✓ ... > rejeita conflito de agenda do mesmo prestador (409) usando o agendamento já armazenado 13ms
 ✓ ... > rejeita serviço inexistente no catálogo (404) sem gravar no repositório 8ms
 ✓ ... > rejeita antecedência menor que 24h (422, RN01) sem gravar no repositório 9ms
 ✓ ... Diagnóstico de composição de DI ... > falha ao compilar quando o provider de SCHEDULING_REPOSITORY é omitido 2ms
 ✓ ... Diagnóstico de composição de DI ... > compila quando o provider do token é registrado (correção) 2ms
 Test Files  1 passed (1)
      Tests  8 passed (8)
   Duration  1.31s
```

### 6.2 Teste unitário anterior do Service (Nível A)

```text
$ pnpm exec vitest run src/modules/scheduling/services/request-scheduling.service.spec.ts
 Test Files  1 passed (1)
      Tests  4 passed (4)
```

### 6.3 Teste HTTP com Service simulado (Nível B, Material 07)

```text
$ pnpm exec vitest run src/modules/scheduling/controllers/scheduling.controller.spec.ts
 Test Files  1 passed (1)
      Tests  2 passed (2)
```

### 6.4 Suíte completa

```text
$ pnpm test
 Test Files  6 passed (6)
      Tests  21 passed (21)
   Duration  1.50s

$ pnpm test:e2e
 Test Files  2 passed (2)
      Tests  3 passed (3)

$ pnpm build   -> nest build (sem erros)
$ pnpm lint    -> 1 warning preexistente (scheduling.repository.interface.ts:6, no-redundant-type-constituents)
```

## 7. Comparação com a linha de base

| Suíte | Linha de base (08-01) | Agora | Diferença |
| --- | --- | --- | --- |
| `pnpm test` | 5 arquivos / 13 testes | 6 arquivos / 21 testes | +1 arquivo, +8 testes; 0 falhas |
| Nível A (`requestScheduling`) | 4/4 | 4/4 | igual |
| Nível B (HTTP mock) | 2/2 | 2/2 | igual |
| `pnpm test:e2e` | 3/3 | 3/3 | igual |

Nenhum teste anterior foi alterado. Não há regressões.

Prova de sensibilidade (08-06 §4): com o provider `SERVICE_CATALOG` removido temporariamente do módulo, o arquivo integrado teve 6 falhas e o Nível B continuou 2/2.

## 8. Limitações e pendências

- Não testa banco real, SQL, migrations nem a constraint `23P01`. A constraint nem está aplicada no banco local (08-07).
- O override de `getRepositoryToken(SchedulingEntity)` é necessário por causa do acoplamento do módulo ao TypeORM.
- RN05 via HTTP (500) não foi incluída: o mapeamento é da SUB-05 (#14). Incluí-la agora fixaria um comportamento errado.
- A configuração da fronteira (pipe + filtro) continua duplicada entre `main.ts` e os testes.
