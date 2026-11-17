# 07-04 - Validação e Módulo

## 1. Problema identificado (evidência real, antes da alteração)

Aplicação compilada a partir da `main` (`d61920f`) e iniciada com `node dist/main` em 17/11/2026, 14:20:

| Requisição | Status obtido | Causa no log |
| --- | --- | --- |
| Payload **válido** | `500 Internal Server Error` | `TypeError: input.startsAt.getTime is not a function`. Sem `transform`, `startsAt` chega como string |
| Payload **inválido** | `500 Internal Server Error` | Payload não validado chega ao serviço e gera `CatalogServiceNotFoundException`; sem filtro global, a resposta é 500 genérico |

A rota estava mapeada (`Mapped {/schedulings, POST} route`), mas **não funcionava na aplicação real, nem no caminho feliz**. O teste E2E passava porque configura `ValidationPipe` e filtro dentro do próprio teste, o que mascarava a ausência dessa configuração no `main.ts`.

## 2. Alterações aplicadas

### `src/main.ts` (SUB-02)

```diff
+import { ValidationPipe } from '@nestjs/common';
 import { NestFactory } from '@nestjs/core';
 import { AppModule, ObserveInstrument } from './app.module.js';
+import { DomainHttpExceptionFilter } from './common/filters/domain-http-exception.filter.js';

 async function bootstrap() {
   const app = await NestFactory.create(AppModule, {
     instrument: ObserveInstrument,
   });
+  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
+  app.useGlobalFilters(new DomainHttpExceptionFilter());
   await app.listen(process.env.PORT ?? 3000);
 }
```

### `src/common/filters/domain-http-exception.filter.ts` (ajuste mínimo coordenado com a SUB-05, #14)

```diff
-import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
+import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
 ...
     const response = ctx.getResponse<Response>();
+
+    // Exceções HTTP do próprio Nest (ex.: 400 do ValidationPipe) mantêm status e corpo originais.
+    if (exception instanceof HttpException) {
+      const body = exception.getResponse();
+      return response
+        .status(exception.getStatus())
+        .json(typeof body === 'string' ? { statusCode: exception.getStatus(), message: body } : body);
+    }
+
     const status = this.resolveStatus(exception);
```

Justificativa: o filtro usa `@Catch()` sem argumentos e, portanto, intercepta também `BadRequestException`. Antes do ajuste, o 400 do pipe virava 500. A mudança não altera o mapeamento das exceções de domínio. O registro de coordenação está no comentário de `JPZS-Git` na Issue #14 (17/11/2026, 17:11).

## 3. `ValidationPipe`: como funciona

- **Leitura dos metadados:** os decoradores do `class-validator` (`@IsUUID`, `@IsDate`...) registram metadados na classe `RequestSchedulingDto`. O pipe usa o tipo declarado em `@Body() dto: RequestSchedulingDto`, transforma o JSON em instância da classe com `class-transformer` (`plainToInstance`) e executa `validate()` sobre ela.
- **`whitelist: true`:** propriedades do JSON **sem decorador de validação** no DTO são removidas antes de chegar ao Controller. O teste 1 de 07-06 comprova isso: `unexpectedField` não chega ao serviço.
- **`transform: true`:** o objeto entregue ao Controller passa a ser a instância transformada do DTO, e não o JSON plano. Assim, `@Type(() => Date)` converte `startsAt` de string ISO para `Date`. Não é uma conversão "mágica" de qualquer valor: só converte o que está declarado (`@Type`) ou primitivos inferidos pelo tipo de parâmetro. Uma string que não é data vira `Invalid Date`, que `@IsDate` rejeita.
- **Rejeição antes do Controller:** se a validação falha, o pipe lança `BadRequestException` com a lista de mensagens, e o método do Controller nem é executado. O filtro agora repassa essa exceção com status `400`.

## 4. Composição dos módulos (verificada, sem alteração)

`src/modules/scheduling/scheduling.module.ts`

| Item | Valor |
| --- | --- |
| `imports` | `TypeOrmModule.forFeature([SchedulingEntity])` |
| `controllers` | `SchedulingController` |
| `providers` | `SchedulingService`, `TypeOrmSchedulingRepository`, `InMemoryServiceCatalog`, `{ provide: SCHEDULING_REPOSITORY, useExisting: TypeOrmSchedulingRepository }`, `{ provide: SERVICE_CATALOG, useExisting: InMemoryServiceCatalog }` |
| `exports` | `SchedulingService` |

`src/app.module.ts` importa `ObserveModule`, `ConfigModule` (global, `.env`), `TypeOrmModule.forRootAsync` (Postgres) e `SchedulingModule`.

### Implementação concreta do repositório

Os tokens e interfaces foram preservados. **Não foi criado repositório em memória**: a persistência real (`TypeOrmSchedulingRepository`, SUB-04) já estava implementada e composta antes desta etapa. Por decisão da equipe, a verificação usou o Postgres local existente (container `conecta-postgres`, porta 5435), com um `.env` local não versionado (`.gitignore` linha 42). O catálogo de serviços continua em memória (`InMemoryServiceCatalog`, serviço demo `33333333-3333-4333-8333-333333333333`).

## 5. Evidência de inicialização (após a alteração)

`pnpm build` seguido de `PORT=3000 node dist/main`, 17/11/2026, 14:20:49:

```text
[InstanceLoader] TypeOrmModule dependencies initialized
[InstanceLoader] ConfigHostModule dependencies initialized
[InstanceLoader] DiscoveryModule dependencies initialized
[InstanceLoader] AppModule dependencies initialized
[InstanceLoader] ConfigModule dependencies initialized
[InstanceLoader] ObserveModule dependencies initialized
[InstanceLoader] TypeOrmCoreModule dependencies initialized
[InstanceLoader] TypeOrmModule dependencies initialized
[InstanceLoader] SchedulingModule dependencies initialized
[RoutesResolver] AppController {/}:
[RouterExplorer] Mapped {/, GET} route
[RoutesResolver] SchedulingController {/schedulings}:
[RouterExplorer] Mapped {/schedulings, POST} route
[NestApplication] Nest application successfully started
```

Não houve `UnknownDependenciesException` nem outros erros de injeção.

## 6. Pendências

- `SameParticipantSchedulingException` (RN05) não está mapeada no filtro e resulta em 500. Fica no escopo da SUB-05 (#14).
- O teste E2E (`test/scheduling/request-scheduling.e2e-spec.ts`, SUB-06) configura `ValidationPipe({ transform: true })` sem `whitelist`. Alinhá-lo ao `main.ts` fica como sugestão para a SUB-06.
- A configuração da fronteira está duplicada entre `main.ts` e os testes. Extrair uma função `configureHttpApp(app)` é uma refatoração possível para uma etapa futura.
