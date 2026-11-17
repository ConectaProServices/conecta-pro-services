# 06-04 - Evidências de Regressão

## Matriz: linha de base vs. pós-refatoração

| Teste / arquivo | Comportamento verificado | Linha de base | Pós-refatoração | Situação |
| --- | --- | --- | --- | --- |
| `scheduling.entity.spec.ts` | RN01 e RN05 no agregado `Scheduling` | 4/4 aprovados | 4/4 aprovados | Preservado |
| Suíte Vitest do backend | 4 arquivos de teste do projeto | 11/11 aprovados | 11/11 aprovados | Preservado |

## Comandos e resultados reais

### Linha de base

Comando focado:

```text
pnpm exec vitest run src/modules/scheduling/entities/scheduling.entity.spec.ts
Test Files  1 passed (1)
     Tests  4 passed (4)
  Duration  1.24s
```

Suíte completa:

```text
pnpm test
Test Files  4 passed (4)
     Tests  11 passed (11)
  Duration  8.97s
```

### Pós-refatoração

Comando focado:

```text
pnpm exec vitest run src/modules/scheduling/entities/scheduling.entity.spec.ts
Test Files  1 passed (1)
     Tests  4 passed (4)
  Duration  676ms
```

Suíte completa:

```text
pnpm test
Test Files  4 passed (4)
     Tests  11 passed (11)
  Duration  4.94s
```

### Build e lint

- `pnpm build`: concluído com código de saída 0 (`nest build`).
- `pnpm lint`: concluído com código de saída 0. Emite um warning fora dos arquivos alterados: `src/modules/scheduling/repositories/scheduling.repository.interface.ts:6:43`, `typescript(no-redundant-type-constituents)` por `any` em união.
- As execuções Vitest também exibem o aviso informativo do plugin `vite-tsconfig-paths`.

## Verificação dos contratos

Não houve alteração de assinatura pública, DTO, controller, persistência ou injeção de dependência. O tipo concreto da exceção lançada para RN05 tornou-se específico; sua mensagem e o ponto de lançamento permaneceram inalterados. O teste existente continuou passando sem alteração.

## Limites da evidência

- Os testes locais demonstram estabilidade apenas para os cenários presentes na suíte Vitest executada.
- Não foi executada a suíte E2E.
- O build e o lint foram verificados localmente, mas não há check runs do CI no PR #16.
- A revisão humana formal ainda não foi registrada no GitHub.

## Parecer

Não foi observada regressão nos testes executados. O parecer é restrito ao escopo testado e não substitui CI, E2E ou revisão humana.
