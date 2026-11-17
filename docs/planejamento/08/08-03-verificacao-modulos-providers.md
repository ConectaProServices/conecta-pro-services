# 08-03 - Verificação de Módulos e Providers

## 1. Configuração real do módulo

`conecta-pro-services-backend/src/modules/scheduling/scheduling.module.ts` (sem alteração nesta etapa):

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

`src/app.module.ts` importa `ObserveModule.forRoot(...)`, `ConfigModule.forRoot({ isGlobal: true })`, `TypeOrmModule.forRootAsync(...)` (Postgres) e `SchedulingModule`.

## 2. Os 8 pontos de verificação

| # | Ponto | Situação | Evidência |
| --- | --- | --- | --- |
| 1 | Módulo da funcionalidade íntegro | Confirmado | `SchedulingModule dependencies initialized` |
| 2 | Controller em `controllers` | Confirmado | `SchedulingController`; `Mapped {/schedulings, POST} route` |
| 3 | Service em `providers` | Confirmado | `SchedulingService` |
| 4 | Token do repositório | Confirmado | `SCHEDULING_REPOSITORY = Symbol('SCHEDULING_REPOSITORY')`. Um Symbol em runtime, não uma interface |
| 5 | Implementação em memória associada ao token | **Divergente do Material 08** | Em produção o token aponta para `TypeOrmSchedulingRepository` (`useExisting`). Não há implementação em memória do agendamento; ela será criada e associada **só no contexto de teste** (`overrideProvider(...).useClass(InMemorySchedulingRepository)`) |
| 6 | Módulo importado no `AppModule` | Confirmado | `imports: [..., SchedulingModule]` |
| 7 | `ValidationPipe` configurado | Confirmado | `main.ts`: `new ValidationPipe({ whitelist: true, transform: true })` (Material 07, commit `3cb3550`) |
| 8 | Compila e inicializa sem falhas de DI | Confirmado | Logs abaixo |

### Observação sobre o padrão de provider

O Material 08 usa `{ provide: TOKEN, useClass: Implementacao }`. O projeto usa `useExisting`: registra a classe concreta como provider próprio e cria um **alias** do token para essa instância. O efeito para o Service é o mesmo (recebe a implementação pelo token), mas `TypeOrmSchedulingRepository` também fica injetável pela classe. O padrão da equipe foi preservado.

Outro ponto: como o módulo importa `TypeOrmModule.forFeature`, ele **depende do `DataSource`** fornecido pelo `TypeOrmModule.forRoot` do `AppModule`. Fora do `AppModule`, ele não compila sem sobrescrever o token do repositório ORM (08-01 §8). É um acoplamento da composição à infraestrutura, a ser considerado na SUB-04 (08-07).

## 3. Cadeia de resolução de dependências

1. O NestJS lê os metadados do `SchedulingModule` e precisa instanciar o `SchedulingController`.
2. O construtor do Controller declara `SchedulingService` pelo **tipo** (metadado `design:paramtypes`). O contêiner encontra a classe em `providers` e a instancia, ou reaproveita a instância singleton.
3. O construtor do `SchedulingService` declara `@Inject(SCHEDULING_REPOSITORY)` e `@Inject(SERVICE_CATALOG)`. Como `ISchedulingRepository` e `IServiceCatalog` são interfaces e somem na transpilação, a resolução se dá pelos **Symbols**.
4. O módulo localiza os providers desses tokens: `SCHEDULING_REPOSITORY → useExisting: TypeOrmSchedulingRepository` e `SERVICE_CATALOG → useExisting: InMemoryServiceCatalog`.
5. Para `TypeOrmSchedulingRepository`, o contêiner ainda resolve `@InjectRepository(SchedulingEntity)` (token `SchedulingEntityRepository`), fornecido por `TypeOrmModule.forFeature`, que por sua vez exige o `DataSource`.
6. O Service opera apenas sobre `ISchedulingRepository` e `IServiceCatalog`. Trocar o provider do token (TypeORM ↔ memória) não exige alterar o Service, o Controller nem o DTO.

No teste integrado (08-05), o passo 4 é redirecionado para `InMemorySchedulingRepository` e o passo 5 recebe um valor inerte. O restante da cadeia é o real.

## 4. Verificação prática

Comandos executados na `main` (`b3ac5be`), em 17/11/2026:

```text
$ pnpm build
$ nest build                       (sem erros)
$ PORT=3000 node dist/main
LOG [InstanceLoader] TypeOrmModule dependencies initialized
LOG [InstanceLoader] ConfigHostModule dependencies initialized
LOG [InstanceLoader] DiscoveryModule dependencies initialized
LOG [InstanceLoader] AppModule dependencies initialized
LOG [InstanceLoader] ConfigModule dependencies initialized
LOG [InstanceLoader] ObserveModule dependencies initialized
LOG [InstanceLoader] TypeOrmCoreModule dependencies initialized
LOG [InstanceLoader] TypeOrmModule dependencies initialized
LOG [InstanceLoader] SchedulingModule dependencies initialized
LOG [RoutesResolver] AppController {/}:
LOG [RouterExplorer] Mapped {/, GET} route
LOG [RoutesResolver] SchedulingController {/schedulings}:
LOG [RouterExplorer] Mapped {/schedulings, POST} route
LOG [NestApplication] Nest application successfully started
```

A aplicação foi encerrada em seguida. Não houve `UnknownDependenciesException`.

## 5. Diagnóstico e pendências

- Composição de produção: íntegra.
- Composição em memória: depende do `InMemorySchedulingRepository`, ainda não implementado (aguarda a DoR-07 da #15).
- O módulo não é carregável sem banco por causa do `TypeOrmModule.forFeature`. Isso não é um defeito para produção, mas obriga a usar overrides no teste. Uma alternativa futura (SUB-04) seria separar um módulo de persistência.
