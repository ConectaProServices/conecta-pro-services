# 07-06 - Testes HTTP

## 1. Identificação

- Sub-Issue: #11 - SUB-02. Complementa a #15 (SUB-06 - testes do UC01) sem substituí-la.
- Arquivo criado: `conecta-pro-services-backend/src/modules/scheduling/controllers/scheduling.controller.spec.ts`
- Runner: Vitest 4.1.11 (`vi.fn()`; nenhum uso de `jest.*`)
- Ferramenta HTTP: Supertest 7.3.1 + `@nestjs/testing`
- O sufixo `.spec.ts` dentro de `src/` faz o arquivo rodar no `pnpm test` padrão, sem depender de banco.

## 2. Cenários

| # | Cenário | Verificações |
| --- | --- | --- |
| 1 | Payload válido em `POST /schedulings` | Status `201`; `requestScheduling` chamado 1 vez com `{customerId, serviceId, professionalId, startsAt: Date}`; `startsAt` é instância de `Date` (`transform`); campo extra `unexpectedField` removido (`whitelist`); corpo JSON com os nomes do contrato (`schedulingId`, `endsAt`, `status`, `message`) |
| 2 | Payload que viola o DTO | Status `400`; `error: "Bad Request"`; as 4 mensagens do `ValidationPipe`; `requestScheduling` **não chamado** |

O módulo de teste registra somente o `SchedulingController` e substitui o `SchedulingService` por um mock (`useValue`). A aplicação de teste recebe a **mesma configuração** de `main.ts`: `ValidationPipe({ whitelist: true, transform: true })` e `DomainHttpExceptionFilter`. Os mocks são resetados no `beforeEach` e a aplicação é fechada no `afterEach`.

## 3. Código-fonte

```typescript
import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DomainHttpExceptionFilter } from '../../../common/filters/domain-http-exception.filter.js';
import { SchedulingService } from '../services/scheduling.service.js';
import { SchedulingController } from './scheduling.controller.js';

const CUSTOMER_ID = '11111111-1111-4111-8111-111111111111';
const PROFESSIONAL_ID = '22222222-2222-4222-8222-222222222222';
const SERVICE_ID = '33333333-3333-4333-8333-333333333333';
const SCHEDULING_ID = '44444444-4444-4444-8444-444444444444';
const STARTS_AT = '2026-12-01T13:00:00.000Z';
const ENDS_AT = '2026-12-01T14:00:00.000Z';

describe('POST /schedulings (fronteira HTTP com serviço mockado)', () => {
  let app: INestApplication;
  const schedulingServiceMock = { requestScheduling: vi.fn() };

  beforeEach(async () => {
    schedulingServiceMock.requestScheduling.mockReset();

    const moduleRef = await Test.createTestingModule({
      controllers: [SchedulingController],
      providers: [{ provide: SchedulingService, useValue: schedulingServiceMock }],
    }).compile();

    app = moduleRef.createNestApplication();
    // Mesma configuração de fronteira usada em src/main.ts
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.useGlobalFilters(new DomainHttpExceptionFilter());
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('retorna 201 e delega ao SchedulingService.requestScheduling com payload válido', async () => {
    schedulingServiceMock.requestScheduling.mockResolvedValue({
      schedulingId: SCHEDULING_ID,
      customerId: CUSTOMER_ID,
      serviceId: SERVICE_ID,
      professionalId: PROFESSIONAL_ID,
      startsAt: new Date(STARTS_AT),
      endsAt: new Date(ENDS_AT),
      status: 'PENDING',
      message: 'Scheduling requested successfully.',
    });

    const response = await request(app.getHttpServer())
      .post('/schedulings')
      .send({
        customerId: CUSTOMER_ID,
        serviceId: SERVICE_ID,
        professionalId: PROFESSIONAL_ID,
        startsAt: STARTS_AT,
        unexpectedField: 'deve ser removido pelo whitelist',
      })
      .expect(HttpStatus.CREATED);

    expect(schedulingServiceMock.requestScheduling).toHaveBeenCalledTimes(1);
    const [input] = schedulingServiceMock.requestScheduling.mock.calls[0];
    expect(input).toEqual({
      customerId: CUSTOMER_ID,
      serviceId: SERVICE_ID,
      professionalId: PROFESSIONAL_ID,
      startsAt: new Date(STARTS_AT),
    });
    expect(input.startsAt).toBeInstanceOf(Date);
    expect(input).not.toHaveProperty('unexpectedField');

    expect(response.body).toEqual({
      schedulingId: SCHEDULING_ID,
      customerId: CUSTOMER_ID,
      serviceId: SERVICE_ID,
      professionalId: PROFESSIONAL_ID,
      startsAt: STARTS_AT,
      endsAt: ENDS_AT,
      status: 'PENDING',
      message: 'Scheduling requested successfully.',
    });
  });

  it('retorna 400 e não chama o serviço quando o payload viola o DTO', async () => {
    const response = await request(app.getHttpServer())
      .post('/schedulings')
      .send({
        customerId: 'nao-e-uuid',
        serviceId: '',
        professionalId: PROFESSIONAL_ID,
        startsAt: 'nao-e-data',
      })
      .expect(HttpStatus.BAD_REQUEST);

    expect(response.body.statusCode).toBe(400);
    expect(response.body.error).toBe('Bad Request');
    expect(response.body.message).toEqual(
      expect.arrayContaining([
        'customerId must be a UUID',
        'serviceId should not be empty',
        'serviceId must be a UUID',
        'startsAt must be a Date instance',
      ]),
    );
    expect(schedulingServiceMock.requestScheduling).not.toHaveBeenCalled();
  });
});
```

## 4. Execuções reais (17/11/2026, diretório `conecta-pro-services-backend/`)

Todas as execuções exibiram somente o aviso preexistente do plugin `vite-tsconfig-paths`, omitido abaixo.

### 4.1 Novo arquivo de testes HTTP

```text
$ pnpm exec vitest run src/modules/scheduling/controllers/scheduling.controller.spec.ts
 Test Files  1 passed (1)
      Tests  2 passed (2)
   Duration  1.08s
```

### 4.2 Prova de sensibilidade do teste

Com o `domain-http-exception.filter.ts` restaurado temporariamente para a versão da `main` (sem repasse de `HttpException`):

```text
     × retorna 400 e não chama o serviço quando o payload viola o DTO 12ms
 FAIL  src/modules/scheduling/controllers/scheduling.controller.spec.ts > POST /schedulings (fronteira HTTP com serviço mockado) > retorna 400 e não chama o serviço quando o payload viola o DTO
Error: expected 400 "Bad Request", got 500 "Internal Server Error"
      Tests  1 failed | 1 passed (2)
```

O ajuste foi reaplicado logo em seguida. Isso prova que o teste detecta o defeito real corrigido nesta etapa.

### 4.3 Teste unitário anterior do agregado (Materiais 04 a 06)

```text
$ pnpm exec vitest run src/modules/scheduling/entities/scheduling.entity.spec.ts
 Test Files  1 passed (1)
      Tests  4 passed (4)
```

### 4.4 Suíte completa (unitária)

```text
$ pnpm test
 Test Files  5 passed (5)
      Tests  13 passed (13)
   Duration  1.24s
```

### 4.5 Suíte E2E (Postgres real)

```text
$ pnpm test:e2e
 Test Files  2 passed (2)
      Tests  3 passed (3)
   Duration  1.54s
```

### 4.6 Build e lint

```text
$ pnpm build        -> nest build (sem erros)
$ pnpm lint
src/modules/scheduling/repositories/scheduling.repository.interface.ts:6:43: warning typescript(no-redundant-type-constituents): 'any' overrides all other types in this union type.
```

O único warning de lint já existia e está em arquivo não alterado (já registrado no Material 06).

## 5. Análise de regressão

| Suíte | Linha de base (`main`, 07-01) | Após SUB-02 | Diferença |
| --- | --- | --- | --- |
| `pnpm test` | 4 arquivos / 11 testes | 5 arquivos / 13 testes | +1 arquivo, +2 testes (novos), 0 falhas |
| Agregado | 4/4 | 4/4 | igual |
| `pnpm test:e2e` | 2 arquivos / 3 testes | 2 arquivos / 3 testes | igual; o filtro alterado continua devolvendo 422 para RN01 |

Não houve regressões.

## 6. Níveis de teste

| Nível | Exemplo no projeto | O que exercita |
| --- | --- | --- |
| Unitário de Controller | Não existe (chamar `controller.request(dto)` direto) | Só a delegação; sem pipe, rota ou JSON |
| **Fronteira HTTP com serviço mockado** | `scheduling.controller.spec.ts` (**esta etapa**) | Roteamento, serialização JSON, DTO, `ValidationPipe`, filtro, status codes e delegação ao serviço |
| Unitário de domínio/aplicação | `scheduling.entity.spec.ts`, `request-scheduling.service.spec.ts` | RN01, RN05, INV-1, catálogo |
| Integração/E2E com persistência real | `test/scheduling/request-scheduling.e2e-spec.ts` | `AppModule` completo + Postgres |

Os dois testes HTTP comprovam a fronteira, mas **não** substituem os testes de persistência nem encerram critérios de domínio. A SUB-06 (#15) continua responsável pela cobertura completa do UC01 (conflito, catálogo inexistente via HTTP etc.).

## 7. Limitações e pendências

- A configuração da fronteira (pipe + filtro) está duplicada entre `main.ts`, este teste e o E2E. Extrair um `configureHttpApp()` reduziria o risco de divergência.
- RN05 via HTTP (500) segue pendente na SUB-05.
