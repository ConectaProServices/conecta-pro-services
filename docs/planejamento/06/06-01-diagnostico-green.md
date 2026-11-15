# 06-01 - Diagnóstico GREEN e Linha de Base

## Identificação

- Projeto: Conecta Pro Services
- Caso de uso: UC01 - Solicitar Agendamento
- Critério trabalhado: RN05 - cliente e prestador não podem ser a mesma pessoa no mesmo agendamento
- Issue: #10 - `[SUB-01] Modelar e validar o agregado Scheduling`
- Branch: `feature/10-modelar-agregado-scheduling`
- Pull Request: #16, aberto como Draft, com base em `main`
- Stack: NestJS, TypeScript, Vitest e pnpm
- Diretório desta etapa: `docs/planejamento/06/`

## Escopo recuperado da etapa 05

A implementação GREEN adiciona uma guarda em `Scheduling.request()` para rejeitar identificadores `customerId` e `professionalId` iguais. O teste correspondente está em `src/modules/scheduling/entities/scheduling.entity.spec.ts`; a implementação está em `src/modules/scheduling/entities/scheduling.entity.ts`.

O histórico da etapa 05 registra a validação de RN01 e RN05, com 4 testes aprovados no arquivo do agregado e 11 testes aprovados na suíte. A mudança mantém teste e produção na mesma Issue, branch e PR, sem PRs dependentes.

## Estado verificado do repositório

Verificação local em 15/11/2026:

```text
## feature/10-modelar-agregado-scheduling...origin/feature/10-modelar-agregado-scheduling
fbcbde4 add 06 to prompts
75a8ae3 Organizing the docs/planejamento into folders
6648c90 docs: add 8 artifacts for Material 05 TDD GREEN
```

O worktree estava limpo e a branch local acompanhava a branch remota. `main` está em `5cb1f98`.

## Linha de base atual dos testes

### Teste focado do agregado

Comando executado:

```text
pnpm exec vitest run src/modules/scheduling/entities/scheduling.entity.spec.ts
```

Resultado real:

```text
Test Files  1 passed (1)
     Tests  4 passed (4)
  Duration  1.24s
```

### Suíte completa de testes

Comando executado:

```text
pnpm test
```

Resultado real:

```text
Test Files  4 passed (4)
     Tests  11 passed (11)
  Duration  8.97s
```

Ambas as execuções exibiram o aviso do plugin `vite-tsconfig-paths`, informando que o Vite oferece suporte nativo a resolução de caminhos. Não houve falhas. A suíte Vitest executada não é evidência de execução E2E.

## Situação no GitHub

Consulta ao repositório em 15/11/2026:

- Issue #10 está aberta.
- PR #16 está aberto, em Draft, da branch `feature/10-modelar-agregado-scheduling` para `main`.
- O PR contém 42 arquivos alterados e 8 commits, incluindo artefatos/documentação das etapas anteriores.
- Não há reviews humanas registradas, comentários de revisão ou check runs associados ao PR.
- Não há evidência de autorização para merge; o PR não foi integrado.
- A revisão do PR confirma que `same-participant-scheduling.exception.ts` foi adicionado como arquivo vazio.

## Discrepâncias documentais identificadas

- O checklist `05-08` cita Draft PR `#10`, mas o PR real é #16; #10 é a Issue da Sub-Issue.
- O documento `05-08` cita artefatos no diretório `docs/planejamento/`, mas os arquivos foram organizados em `docs/planejamento/05/`.
- A base local e o PR mostram que a exceção tipada prevista ainda não foi implementada; existe apenas o arquivo vazio.

## Condição de prontidão

A linha de base está verde e o worktree limpo. Há condição para avaliar e executar uma refatoração estrutural restrita à exceção de domínio. O estado atual do PR, as verificações de CI e a revisão humana continuam pendentes de governança; esta etapa não autoriza merge.
