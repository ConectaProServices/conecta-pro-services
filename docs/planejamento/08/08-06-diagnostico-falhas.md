# 08-06 - Diagnóstico de Falhas de Integração

## 1. Categorias de falha no projeto

| Categoria | Exemplos concretos no Conecta Pro Services | Como aparece | Quem detecta |
| --- | --- | --- | --- |
| Composição de módulo / DI | Provider de `SCHEDULING_REPOSITORY` ou `SERVICE_CATALOG` ausente; token trocado; `SchedulingModule` não importado no `AppModule`; `TypeOrmModule.forFeature` sem `DataSource` | `Nest can't resolve dependencies of ...` na compilação do módulo | Nível C, E2E e inicialização do app. **Não** o Nível B |
| Fronteira HTTP | `ValidationPipe` ausente no `main.ts`; `@Type(() => Date)` ausente; filtro capturando `HttpException`; rota divergente | 500 em vez de 201/400 (caso real do 07-04) | Nível B, Nível C e requisição manual |
| Comportamento entre camadas | Service calculando `endsAt` errado; repositório devolvendo estrutura sem `getStatus()`; `existsOverlapping` com semântica diferente entre adaptadores | Resposta com dados errados; conflito não detectado | Nível C (com dados reais armazenados) e Nível A (regras) |

## 2. Experimento 1: provider do token omitido (contexto isolado)

### Configuração

Módulo de teste com `SchedulingController`, `SchedulingService` e catálogo reais, **sem** o provider de `SCHEDULING_REPOSITORY`. O `SchedulingModule` de produção não foi tocado.

```typescript
const compileWithoutRepository = Test.createTestingModule({
  controllers: [SchedulingController],
  providers: [
    SchedulingService,
    InMemoryServiceCatalog,
    { provide: SERVICE_CATALOG, useExisting: InMemoryServiceCatalog },
    // provider de SCHEDULING_REPOSITORY omitido de propósito
  ],
}).compile();
```

### Mensagem real (capturada com um spec temporário `src/zz-diag.spec.ts`, removido após a execução)

```text
Error: Nest can't resolve dependencies of the SchedulingService (?, Symbol(SERVICE_CATALOG)). Please make sure that the argument Symbol(SCHEDULING_REPOSITORY) at index [0] is available in the RootTestModule module.
Potential solutions:
- Is RootTestModule a valid NestJS module?
- If Symbol(SCHEDULING_REPOSITORY) is a provider, is it part of the current RootTestModule?
- If Symbol(SCHEDULING_REPOSITORY) is exported from a separate @Module, is that module imported within RootTestModule?
  @Module({
    imports: [ /* the Module containing Symbol(SCHEDULING_REPOSITORY) */ ]
  })
For more common dependency resolution issues, see: https://docs.nestjs.com/faq/common-errors
```

### Anatomia da mensagem

| Trecho | Significado |
| --- | --- |
| `dependencies of the SchedulingService` | Classe que não pôde ser instanciada |
| `(?, Symbol(SERVICE_CATALOG))` | Lista dos parâmetros do construtor; `?` marca o que não foi resolvido |
| `argument Symbol(SCHEDULING_REPOSITORY) at index [0]` | Token ausente e sua posição no construtor (1º parâmetro, `@Inject(SCHEDULING_REPOSITORY)`) |
| `available in the RootTestModule module` | Módulo em cujo escopo o token foi procurado (o módulo raiz criado pelo `Test.createTestingModule`) |

**Causa raiz:** o `SchedulingService` depende do contrato via `@Inject(SCHEDULING_REPOSITORY)`. Como a interface `ISchedulingRepository` some na transpilação, o contêiner só tem o Symbol para procurar, e nenhum provider desse token foi registrado.

**Correção:** registrar o provider do token, por exemplo `{ provide: SCHEDULING_REPOSITORY, useClass: InMemorySchedulingRepository }` (ou `useExisting: TypeOrmSchedulingRepository`, como em produção).

### Verificação automatizada mantida

Os dois casos ficaram como testes explícitos em `src/modules/scheduling/scheduling.integration.spec.ts`, no bloco "Diagnóstico de composição de DI":

- `falha ao compilar quando o provider de SCHEDULING_REPOSITORY é omitido`: `await expect(...compile()).rejects.toThrow("Nest can't resolve dependencies of the SchedulingService (?, Symbol(SERVICE_CATALOG)). Please make sure that the argument Symbol(SCHEDULING_REPOSITORY) at index [0] is available in the RootTestModule module.")`
- `compila quando o provider do token é registrado (correção)`

Os dois passam (08-05). A suíte permanece verde.

## 3. Experimento 2: módulo real sem banco

`Test.createTestingModule({ imports: [SchedulingModule] }).compile()`, executado em um spec temporário e removido:

```text
Nest can't resolve dependencies of the SchedulingEntityRepository (?). Please make sure that the argument DataSource at index [0] is available in the TypeOrmModule module.
```

- Classe afetada: `SchedulingEntityRepository`, o repositório TypeORM gerado por `TypeOrmModule.forFeature([SchedulingEntity])`.
- Token ausente: `DataSource`, fornecido por `TypeOrmModule.forRoot*`, que existe só no `AppModule`.
- Módulo: `TypeOrmModule` (o módulo dinâmico do `forFeature`).

Tratamento no teste integrado: `.overrideProvider(getRepositoryToken(SchedulingEntity)).useValue({})` e `.overrideProvider(SCHEDULING_REPOSITORY).useClass(InMemorySchedulingRepository)`.

## 4. Experimento 3: falha de composição que o Nível B não vê

Remoção temporária da linha `{ provide: SERVICE_CATALOG, useExisting: InMemoryServiceCatalog }` do `scheduling.module.ts` (backup, execução, restauração; `git diff` vazio ao final):

```text
### Nivel C (integrado)
      Tests  6 failed | 2 passed (8)
Error: Nest can't resolve dependencies of the SchedulingService (Symbol(SCHEDULING_REPOSITORY), ?). Please make sure that the argument Symbol(SERVICE_CATALOG) at index [1] is available in the SchedulingModule module.
### Nivel B (HTTP mock)
      Tests  2 passed (2)
```

- Os 6 testes que usam o `SchedulingModule` falharam. Os 2 de diagnóstico, que montam o próprio módulo isolado, passaram.
- O teste HTTP com Service mockado (Material 07) **continuou verde** com o módulo de produção quebrado.

Isso comprova na prática a conclusão do 08-02: o Nível B não substitui o Nível C.

## 5. Conclusões

- As falhas de DI no NestJS são diagnosticáveis pela mensagem: classe, posição `?`, token e módulo.
- O módulo de produção não foi alterado. Os experimentos 2 e 3 rodaram de forma temporária e não foram versionados.
- Pendência arquitetural (SUB-04): o acoplamento do `SchedulingModule` ao `TypeOrmModule.forFeature` obriga o uso de overrides em testes sem banco.
