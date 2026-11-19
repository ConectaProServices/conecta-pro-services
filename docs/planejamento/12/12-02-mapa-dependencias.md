# 12-02 - Mapa de Dependências

## Fluxo de execução do UC01

```text
Cliente HTTP
  → NestJS ValidationPipe
  → SchedulingController.request
  → SchedulingService.requestScheduling
  → IServiceCatalog.findById
  → Scheduling.request
  → ISchedulingRepository.existsOverlapping
  → ISchedulingRepository.save
  → TypeOrmSchedulingRepository
  → SchedulingOrmMapper
  → TypeORM Repository<SchedulingEntity>
  → PostgreSQL
  → SchedulingService monta o resultado de saída
  → SchedulingController.toRequestSchedulingResponse
  → HTTP 201 JSON
```

O fluxo representa a chamada em runtime; não é o grafo de imports.

## Dependências de código

```text
SchedulingController → SchedulingService
SchedulingController → RequestSchedulingDto / RequestSchedulingResponseDto / mapper HTTP
SchedulingService → ISchedulingRepository + token SCHEDULING_REPOSITORY
SchedulingService → IServiceCatalog + token SERVICE_CATALOG
SchedulingService → Scheduling (domínio) + exceções de domínio
TypeOrmSchedulingRepository → ISchedulingRepository + Scheduling + ORM
SchedulingOrmMapper → Scheduling ↔ SchedulingEntity
SchedulingModule → registra Controller, Service, entidade e providers concretos
```

O Service importa o DTO de entrada em `services/scheduling.service.ts` e usa sua forma como input. Isso é uma dependência de tipo da camada de aplicação para um DTO de transporte; o risco está avaliado em 12-03.

## Composição NestJS / providers

| Token/provider | Registro observado | Resolução |
| --- | --- | --- |
| `SCHEDULING_REPOSITORY` | `useExisting: TypeOrmSchedulingRepository` | Singleton concreto, por provider já listado |
| `SERVICE_CATALOG` | `useExisting: InMemoryServiceCatalog` | Implementação em memória atualmente ativa |
| Repositório TypeORM | `TypeOrmModule.forFeature([SchedulingEntity])` | Fornece `Repository<SchedulingEntity>` injetado com `@InjectRepository` |
| `AppModule` | `SchedulingModule` importado | Inicializa TypeORM pela configuração global |

Os símbolos são tokens runtime; as interfaces TypeScript não são usadas pelo Nest para resolver providers. O teste integrado confirma a composição e também demonstra falha quando o token de Repository é omitido.

## Mappers distintos

- HTTP: `toRequestSchedulingResponse` cria o DTO público campo a campo a partir do objeto de saída do Service.
- Persistência: `SchedulingOrmMapper.toPersistence/toDomain` converte entre domínio e `SchedulingEntity`.

Não há evidência de duplicação entre esses dois mapeadores; suas fronteiras são diferentes.
