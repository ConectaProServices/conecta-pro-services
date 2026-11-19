# 12-01 - Diagnóstico da Arquitetura

## Projeto e escopo

- Projeto: Conecta Pro Services, backend NestJS/TypeScript.
- Caso auditado: UC01, solicitação de agendamento por `POST /schedulings`.
- Branch inspecionada: `feature/material-11-http-contract-stabilization`.
- PR relacionado: #22, aberto contra `main`, ainda sem merge.
- Destino dos artefatos: `docs/planejamento/12/`.
- Escopo: caminho HTTP → aplicação → domínio → persistência PostgreSQL; composição dos providers e testes pertinentes.

## Documentação recuperada

Os oito artefatos `docs/planejamento/11/11-01` a `11-08` foram lidos. Eles registram o contrato HTTP estabilizado, o mapper de resposta, os testes de contrato, as evidências Docker, os resultados de teste e as pendências.

## Componentes confirmados

| Componente | Evidência |
| --- | --- |
| Controller e DTO de entrada | `src/modules/scheduling/controllers/scheduling.controller.ts`; `dtos/request-scheduling.dto.ts` |
| DTO e mapper HTTP | `dtos/confirm-schedule-response.dto.ts`; `mappers/scheduling-response.mapper.ts` |
| Service e entidade de domínio | `services/scheduling.service.ts`; `entities/scheduling.entity.ts` |
| Portas de persistência e catálogo | `repositories/scheduling.repository.interface.ts`; `ports/service-catalog.interface.ts` |
| Adaptadores | `infraestructure/persistence/scheduling/typeorm-scheduling.repository.ts`; `in-memory-scheduling.repository.ts` |
| Mapper ORM e entidade ORM | `scheduling.orm-mapper.ts`; `scheduling.orm-entity.ts` |
| Composição | `scheduling.module.ts`; `app.module.ts` |
| Fronteira de runtime | `src/main.ts`; `common/filters/domain-http-exception.filter.ts` |

## Linha de base executada nesta auditoria

| Comando | Resultado |
| --- | --- |
| `pnpm test` | 6 arquivos, 22 testes aprovados |
| `pnpm test:integration` | 1 arquivo, 5 testes aprovados; helper valida banco e usuário dedicados |
| `pnpm build` | Aprovado |
| `pnpm lint` | 0 erros; 1 warning `no-redundant-type-constituents` no contrato do Repository |

`pnpm test:e2e` foi inspecionado e não executado: as suítes usam `AppModule`, que lê `DB_*` de `.env`; a suíte de agendamento remove IDs criados no `afterAll`. Não foi possível confirmar que o alvo era descartável; evitar execução contra o banco de desenvolvimento.

## Planejamento e GitHub

- Issue #15 (`[SUB-06] Definir testes automatizados do UC01`): aberta, atribuída a `JPZS-Git`, critérios incluem sucesso, antecedência, conflito e catálogo.
- Issue #14 (`[SUB-05] Implementar tratamento de exceções e contratos de erro`): aberta, cobre respostas HTTP apropriadas para erros de domínio, catálogo e conflito.
- Issue #12 (`[SUB-03] Implementar regra de negócio de solicitação`): aberta, cobre catálogo, antecedência e conflitos.
- PR #22: aberto, head `feature/material-11-http-contract-stabilization`, base `main`, sem merge.
- A auditoria arquitetural não possui Issue específica confirmada. Nenhuma Issue foi criada nem movida.

## Riscos e plano

Achados a avaliar: tipo `any` no contrato do Repository; resposta de erro observada para RN05; dependência do Service no DTO HTTP; catálogo de produção ainda associado ao adaptador em memória. Classificações e propostas estão em 12-03/12-04. Nenhuma alteração de código foi autorizada; decisão atual é preservar e encaminhar os pontos aos escopos existentes.
