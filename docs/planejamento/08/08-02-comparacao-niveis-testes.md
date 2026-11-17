# 08-02 - Comparação dos Níveis de Teste

## 1. Testes existentes analisados

| Nível | Arquivo | O que faz |
| --- | --- | --- |
| A - Unitário do Service | `src/modules/scheduling/services/request-scheduling.service.spec.ts` | `SchedulingService` real; `SCHEDULING_REPOSITORY` e `SERVICE_CATALOG` como `useValue` com `vi.fn()`. 4 testes: catálogo inexistente, RN01, INV-1 (conflito), caminho feliz `PENDING` |
| A - Unitário do Service | `src/modules/scheduling/services/scheduling.services.spec.ts` | `confirmScheduling` com repositório mockado (2 testes, fora do UC01) |
| (domínio) | `src/modules/scheduling/entities/scheduling.entity.spec.ts` | `Scheduling.request()` puro: RN01 e RN05 (4 testes) |
| B - HTTP com Service simulado | `src/modules/scheduling/controllers/scheduling.controller.spec.ts` | `SchedulingController` real + DTO + `ValidationPipe` + `DomainHttpExceptionFilter` + Supertest; `SchedulingService` como `useValue` com `vi.fn()` (2 testes: 201 e 400) |
| C - Integrado do backend | `src/modules/scheduling/scheduling.integration.spec.ts` (**a criar nesta etapa**) | Ver seção 2 |
| (além do C) E2E com banco real | `test/scheduling/request-scheduling.e2e-spec.ts` | `AppModule` completo + PostgreSQL (2 testes: 201 persistido e 422 RN01) |

## 2. Matriz comparativa

| Critério | Nível A - Unitário do Service | Nível B - HTTP com Service simulado | Nível C - Integrado do backend |
| --- | --- | --- | --- |
| **Componentes reais** | `SchedulingService`, `Scheduling` (agregado), contêiner Nest de teste | `SchedulingController`, `RequestSchedulingDto`, `ValidationPipe`, `DomainHttpExceptionFilter`, pipeline HTTP (Express) | `SchedulingModule` real, `SchedulingController`, `RequestSchedulingDto`, `ValidationPipe`, `DomainHttpExceptionFilter`, `SchedulingService`, `Scheduling`, `InMemoryServiceCatalog` (via `SERVICE_CATALOG`), `InMemorySchedulingRepository` (via `SCHEDULING_REPOSITORY`) |
| **Componentes simulados** | Repositório (`findScheduleById`, `existsOverlapping`, `save`) e catálogo (`findById`) com `vi.fn()` | `SchedulingService` (`requestScheduling: vi.fn()`) | Nenhum no fluxo. Só o token do repositório ORM (`getRepositoryToken(SchedulingEntity)`) é substituído por um valor inerte, porque o `TypeOrmSchedulingRepository` é instanciado pelo módulo mas não é usado |
| **Dependências exercitadas** | Injeção de tokens no Service; interação com o contrato de repositório | Roteamento, desserialização JSON, `class-transformer` (`@Type(() => Date)`), `class-validator`, filtro, serialização da resposta | Todas as do B, mais resolução real do Service pelo módulo, `@Inject(SCHEDULING_REPOSITORY)` e `@Inject(SERVICE_CATALOG)`, cálculo de `endsAt` pelo catálogo, `Scheduling.request()`, `existsOverlapping` e `save` em memória |
| **Comportamento verificado** | Ordem das regras, exceções e chamadas ao contrato | Status 201/400, delegação ao Service, `whitelist` e `transform`, contrato do corpo | Fluxo completo HTTP → armazenamento em memória → resposta com `schedulingId` gerado e `endsAt` calculado; 400 antes do Service |
| **Evidência produzida** | Asserções sobre mocks (`toHaveBeenCalledWith`, `not.toHaveBeenCalled`) | Status e corpo HTTP; asserções sobre o mock do Service | Status e corpo HTTP gerados pelo código real; inspeção do repositório em memória obtido do contêiner (ver 08-05) |
| **Limitações** | Não passa por rota, DTO, pipe, filtro nem composição do módulo | Não executa Service, regras nem repositório; não testa a DI do módulo | Não testa banco real, SQL, transações, constraint de exclusão (`23P01`) nem migrations; o catálogo é sempre o demo em memória |
| **CAs / requisitos não cobertos** | Validação de entrada (CA3 da SUB-02); status HTTP | RN01, RN05, INV-1, catálogo (o Service é mock) | Persistência real (SUB-04); RN05 via HTTP (500, SUB-05); conflito e catálogo inexistente via HTTP só se forem incluídos |

## 3. Conclusão

> **O teste HTTP com Service simulado, produzido no Material 07, não substitui o teste integrado com Service e Repository reais.**

No Nível B, o `SchedulingService` é um `vi.fn()` que devolve o que o teste manda. Mesmo que o Service, o módulo ou o repositório estivessem quebrados, os dois testes do Material 07 continuariam verdes. Só o Nível C detecta, por exemplo, um provider ausente no `SchedulingModule`, um token trocado, ou um `endsAt` calculado errado. O Nível A, por sua vez, detalha as regras de negócio que o C não precisa repetir.

Neste projeto existe ainda um nível acima do C, o E2E com `AppModule` e PostgreSQL. Ele não torna o C desnecessário: o E2E depende de um banco ativo e de `.env`, é mais lento e não roda no `pnpm test` padrão. O C roda em memória, em segundos, junto com a suíte unitária.

Situação desta matriz: os Níveis A e B foram analisados no código e executados na linha de base (08-01). O Nível C está **planejado**; sua execução e evidências são registradas em 08-05.
