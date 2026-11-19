# 12-06 - Verificação de Regressões

## Linha de base executada nesta auditoria

| Verificação | Resultado atual |
| --- | --- |
| `pnpm test` | 6 arquivos / 22 testes aprovados |
| `pnpm test:integration` | 1 arquivo / 5 testes aprovados no banco `conecta_test` |
| `pnpm build` | Aprovado |
| `pnpm lint` | 0 erros; 1 warning existente em `scheduling.repository.interface.ts:6` |

## Segurança dos testes PostgreSQL

`test/helpers/test-data-source.ts` exige `TEST_DB_*`, exige nome terminado em `_test`, rejeita mesmo banco ou usuário de desenvolvimento e consulta a identidade reportada pelo servidor. A suíte aplica migrations e remove apenas IDs que ela própria criou; não usa `TRUNCATE`. Os 5 testes passaram.

## E2E

O script `test:e2e` executa `vitest run --config ./vitest.config.e2e.ts`, incluindo `test/scheduling/request-scheduling.e2e-spec.ts` e `test/app.e2e-spec.ts`. Ambos sobem `AppModule`. O teste de agendamento obtém o Repository TypeORM real e, no `afterAll`, remove os IDs criados. Como `AppModule` usa `DB_*` do `.env`, não foi executado: o banco de destino não foi confirmado como descartável e a suíte escreve/remove dados.

## Comparação e limitações

- Não há código alterado nesta auditoria; a suíte rápida, integração e build não apontaram regressão.
- O lint mantém um warning de tipo, diretamente relacionado a A-01.
- A auditoria não executou E2E; posteriormente, os cenários de agendamento foram validados em banco isolado no branch de conclusão do UC01.
- A evidência da API Docker do Material 11 é histórica; não foi repetida como parte desta auditoria.
- As aprovações não provam ausência absoluta de defeitos.
