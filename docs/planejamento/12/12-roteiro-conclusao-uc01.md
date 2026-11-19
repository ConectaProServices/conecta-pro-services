# Roteiro de Conclusão — UC01 Solicitar Agendamento

- **Repositório:** `ConectaProServices/conecta-pro-services`
- **Branch inspecionada:** `feature/uc01-rn03-error-contracts-e2e`
- **Documentação do roteiro:** `docs/planejamento/12/12-roteiro-conclusao-uc01.md`
- **Estado consultado:** 19/11/2026. Nenhuma Issue foi fechada nem PR integrado.

> A CLI `gh` não está instalada neste ambiente (`gh auth status` não pôde ser executado: `gh` não reconhecido). Os comandos abaixo são instruções para uso futuro; em cada etapa há alternativa pela interface Web.

## 1. Visão geral — o caso de uso já está concluído?

**Ainda não.** A implementação e os testes cobrem partes substanciais do UC01, mas a conclusão funcional e de governança está bloqueada por critérios pendentes, Issues abertas e revisão/merge do PR #22.

### Critérios gerais da especificação

A especificação detalhada está em `docs/planejamento/01/01-03-issue-principal-epic.md`; a Issue #1 registra RN01, RN03, RN05 e INV-1. A Issue não atribui IDs formais aos critérios abaixo; `CA-1` a `CA-6` são rótulos deste roteiro para facilitar a conferência.

| Critério | Evidência encontrada | Estado |
| --- | --- | --- |
| CA-1 — Criar solicitação válida via API | `POST /schedulings` observado com `201`; testes HTTP e fluxo com componentes reais. Material 10 também registra persistência e restart | **Confirmado** |
| CA-2 — Rejeitar antecedência menor que 24h (RN01) | Testes de Service/integração verificam rejeição; teste PostgreSQL e suíte rápida passaram | **Confirmado no nível automatizado** |
| CA-3 — Rejeitar sobreposição para o mesmo prestador (INV-1) | Teste PostgreSQL verifica consulta e constraint; teste integrado em memória cobre conflito; Material 10 registra HTTP 409 | **Confirmado** |
| CA-4 — Persistir como `PENDING` | Teste PostgreSQL consulta a linha salva; Material 10 registra POST, SQL e durabilidade após restart | **Confirmado pelas evidências registradas** |
| CA-5 — Retornar erros em contrato consistente | Mapeamento local de RN05 para 422 e limite diário RN03 para 409; testes exercitam ambos, além de 400/404/409/422 | **Validado na branch local; aguarda revisão/merge** |
| CA-6 — Cobertura automatizada do fluxo principal e alternativos | `pnpm test` 25/25, `pnpm test:integration` 6/6 e E2E 6/6 no banco isolado `TEST_DB_*`; inclui catálogo, conflito, RN03 e RN05 | **Validado na branch local; aguarda revisão/merge** |

### Persistência, containerização e auditoria

- **Persistência:** Issue #13 fechada; PR #19 integrado. Testes PostgreSQL atuais passaram (5/5) no banco `conecta_test`, com identidade do banco/usuário verificada.
- **Containerização:** Issue #20 fechada; PR #21 integrado. Artefatos do Material 10 registram build, execução HTTP e durabilidade. Uma consulta SQL posterior compartilhada mostrou apenas `-- (1 row)`, sem valores, e por isso não é evidência suficiente por si só.
- **Material 11:** PR #22 está aberto, contra `main`, sem merge. O PR não fecha #15; sua descrição usa `Refs #15`. A suíte de integração 5/5 foi acrescentada à descrição.
- **Ajustes para conclusão:** branch local `feature/uc01-rn03-error-contracts-e2e`, baseada em `origin/main`, implementa RN03 por dia-calendário de `startsAt` em `America/Sao_Paulo`, mapeia RN05 e inclui E2E isolado. Ainda não foi publicada nem tem PR; não foi integrada a `main`.
- **Material 12:** cenário B — preservação arquitetural, sem refatoração. Os oito artefatos estão no workspace em `docs/planejamento/12/`, sem commit ou PR próprios. A revisão humana ainda está pendente.

### Governança da Epic

A Epic #1 está **Open** e o GitHub informa 4/7 Sub-Issues concluídas (57%). As três abertas são #12, #14 e #15. A contagem de 7 inclui a Sub-Issue extra de containerização #20, além das seis inicialmente planejadas. Os ajustes locais cobrem os pontos técnicos identificados, mas ainda precisam de PR, revisão humana e merge.

Não encerrar a Epic antes de:

1. Resolver e fechar #12, #14 e #15 com evidências.
2. Corrigir/confirmar a cobertura do RN03 e a resposta HTTP do RN05.
3. Revisar e integrar os PRs pertinentes em `main`.
4. Obter revisão humana; o PR #22 foi criado pela própria `LayssaRD`, que não pode aprovar a própria alteração.
5. Atualizar a Epic e o GitHub Project conforme o estado real.

## 2. Mapa atual de Pull Requests

Os PRs existentes apontam diretamente para `main`; **não há pilha de PRs dependentes**. A única PR aberta no GitHub é #22. A branch de ajustes UC01 está apenas local e ainda não possui PR.

```text
main
├── PR #16 — SUB-01 / domínio — MERGED
├── PR #17 — SUB-02 / endpoint HTTP — MERGED
├── PR #18 — testes integrados em memória — MERGED (não fechou #15)
├── PR #19 — SUB-04 / PostgreSQL — MERGED
├── PR #21 — SUB-07 / Docker Compose — MERGED
└── PR #22 — Material 11 / contrato HTTP — OPEN, pronto para revisão

Material 12 — parecer arquitetural local; sem PR

feature/uc01-rn03-error-contracts-e2e — ajustes locais de RN03/RN05/E2E; ainda sem PR
```

Os PRs #16, #17, #18, #19 e #21 estão fechados e têm `merged_at` registrado. Não existe PR #20 nesta lista: #20 é a Issue de containerização.

## 3. Passo a passo operacional

### Passo 1 — Publicar o parecer arquitetural

**O que fazer:** compartilhar o parecer 12-08 com a equipe e decidir se os oito arquivos do Material 12 serão versionados.

**Por que:** o Material 12 não alterou código e não deve gerar um PR artificial. O PR #22 é o único aberto e trata do Material 11; um comentário pode registrar o parecer sem misturar arquivos ou alterar o escopo.

**CLI, se `gh` estiver instalada e autenticada:**

```powershell
gh pr comment 22 --body-file "docs/planejamento/12/12-08-revisao-github-checklist.md"
```

**Interface Web:** abra o PR #22 → aba **Conversation** → escreva um comentário com o conteúdo de `12-08-revisao-github-checklist.md` → **Comment**. O parecer informa que é uma auditoria sem refatoração e que a revisão humana está pendente.

Para versionar os oito documentos, combine primeiro com a equipe uma Issue/branch documental apropriada. Não faça `git add .`; não inclua `.env`, arquivos ZIP ou os prompts fora do escopo combinado. Se a equipe decidir que o PR #22 é o veículo apropriado:

```powershell
git status --short
git add docs/planejamento/12/12-*.md
git diff --cached --check
git commit -m "docs(uc01): add architecture audit and closure guide"
git push
```

Na Web, a alternativa é confirmar primeiro o escopo acordado e então usar o fluxo de commit/branch do VS Code; não envie alterações locais sem revisar **Files changed**.

### Passo 2 — Verificar o estado Draft

**O que fazer:** confirmar que PRs que serão revisados estão prontos para revisão.

**Por que:** não iniciar revisão formal em PR Draft.

**Estado verificado:** PR #22 já está `draft=false`; os PRs #16–#19 e #21 estão fechados. Não há PR Draft conhecido a retirar de Draft.

**CLI:**

```powershell
gh pr list --state open
gh pr view 22 --json state,isDraft,baseRefName,headRefName
```

Se uma PR futura aparecer como Draft:

```powershell
gh pr ready <NUMERO>
```

**Interface Web:** na página da PR, confira o banner de Draft; se aplicável, selecione **Ready for review**. Não há ação necessária no PR #22 agora.

### Passo 3 — Realizar a revisão técnica humana

**O que fazer:** uma pessoa diferente da autora deve revisar o PR #22.

**Por que:** a autora do PR não pode aprovar a própria alteração; a aprovação não pode ser presumida.

**CLI:**

```powershell
gh pr view 22
gh pr diff 22
gh pr review 22 --approve
```

O comando de aprovação deve ser executado pelo revisor humano, não pela autora nem pelo assistente. Antes, confira se não há `.env`, credenciais ou arquivos acidentais.

**Interface Web:** PR #22 → **Files changed** → revisar DTO/mapper/controller, teste de contrato e artefatos; verificar arquivos e segredos; **Review changes** → **Approve** (revisor distinto) ou **Request changes**. Não declare aprovação antes de ela constar no GitHub.

### Passo 4 — Integrar PRs e validar `main`

**O que fazer:** revisar e integrar somente o PR aberto após aprovação e verificações obrigatórias.

**Por que:** #22 é o único PR aberto e já tem base `main`; não há próximo PR empilhado para redirecionar. Os PRs antigos já foram integrados.

> [!WARNING]
> Em uma futura pilha de PRs, não use `--delete-branch` para apagar uma branch que ainda é base de outro PR: apagar a branch-base pode fechar automaticamente o PR dependente. Primeiro faça merge do PR base; depois redirecione o PR seguinte para `main` com `gh pr edit <PR-SEGUINTE> --base main`; só então considere apagar a branch antiga. Essa sequência não é necessária para o estado atual, pois não há PR empilhado.

Depois de aprovação humana e confirmação dos critérios do PR:

```powershell
gh pr view 22 --json state,isDraft,reviewDecision,baseRefName,headRefName
gh pr merge 22 --merge
git fetch origin
git switch main
git pull --ff-only origin main
Set-Location conecta-pro-services-backend
pnpm build
pnpm lint
pnpm test
pnpm test:integration
```

Não execute `gh pr merge` antes da revisão. Não use `--delete-branch` neste PR. `pnpm test:e2e` só deve ser executado depois que seu `DB_*` estiver confirmado como banco descartável/isolado; a suíte E2E atual sobe `AppModule` e apaga os IDs criados no `afterAll`.

**Interface Web:** depois da aprovação, confira novamente **Checks** e **Conversation**; selecione **Merge pull request** → **Create a merge commit**. Atualize localmente `main` via `git fetch` e `git pull --ff-only`, então rode os mesmos comandos de validação.

### Passo 5 — Resolver Sub-Issues e atualizar o Project

**O que fazer:** fechar cada Issue somente após seus critérios e evidências estarem completos.

| Issue | Estado atual | Entrega / o que falta antes de fechar | PR / rastreabilidade |
| --- | --- | --- | --- |
| #10 SUB-01 | Closed | Agregado; PR foi integrado | PR #16 merged |
| #11 SUB-02 | Closed | DTO de entrada e endpoint; PR foi integrado | PR #17 merged |
| #12 SUB-03 | **Open**, sem assignee | Branch local implementa RN03 por data de `startsAt` em `America/Sao_Paulo`, considerando PENDING/CONFIRMED; inclui consulta no repositório, índice único parcial para concorrência e teste PostgreSQL de fronteira de data. Catálogo, RN01, INV-1 e PENDING continuam cobertos. Publicar/revisar/mergear o PR e corrigir as referências de dependência antigas no texto da Issue. | Branch `feature/uc01-rn03-error-contracts-e2e`, ainda sem PR |
| #13 SUB-04 | Closed | Persistência real; PR foi integrado | PR #19 merged |
| #14 SUB-05 | **Open**, sem assignee | Branch local mapeia `SameParticipantSchedulingException` para 422 e RN03 para 409; testes verificam o contrato. Publicar/revisar/mergear e corrigir dependências antigas no texto da Issue. | Branch `feature/uc01-rn03-error-contracts-e2e`, ainda sem PR |
| #15 SUB-06 | **Open**, atribuído a `JPZS-Git` | E2E local atualizado e executado: sucesso/PENDING, antecedência, catálogo, sobreposição, RN03 e RN05; 6/6 no banco `TEST_DB_*`, após validar identidade e aplicar migrations; limpeza remove somente IDs criados pelo teste. Publicar/revisar/mergear; PR #22 é `Refs #15`, não fecha a Issue. | PR #18 merged (escopo parcial); PR #22 aberto; branch local sem PR |
| #20 SUB-07 (extra) | Closed | Containerização; PR integrado | PR #21 merged |

Os critérios específicos de #12 não listam RN03 apesar de a Epic a contemplar; atualize o aceite da Issue com a regra e o fuso `America/Sao_Paulo` antes de fechar. Os textos de dependência #12/#14 têm referências antigas/incompletas; corrija no GitHub em vez de copiar números incorretos.

Após merge da PR que entrega cada Issue, registre a evidência e feche explicitamente apenas se a PR não tiver `Closes #ID`:

```powershell
gh issue close 12 --comment "Critérios da SUB-03 verificados na PR #<PR>; decisão de escopo e evidências de RN03 registradas."
gh issue close 14 --comment "Contratos de erro verificados na PR #<PR>; RN05 e cenários inválidos cobertos."
gh issue close 15 --comment "Critérios da SUB-06 verificados na PR #<PR>; E2E executado em banco isolado."
```

Substitua `<PR>` pelo número real após criá-lo/confirmá-lo. Não execute esses comandos antes da entrega e revisão. As Issues #10, #11, #13 e #20 já estão fechadas; não as feche de novo.

**Interface Web:** em cada Issue aberta, confira critérios, PRs e checks; registre comentário com links/evidência e selecione **Close issue** só após a revisão. No Project, mova cartões para **Done** somente após critérios satisfeitos. Nomes documentados do fluxo são `Todo`, `Ready`, `In Progress`, `Under review`, `Done`; o board e a coluna atual dos cartões não puderam ser confirmados nesta consulta (API de Projects retornou 404 e `gh` não está instalado). Confirme-os na aba **Projects** da organização antes de movimentar cartões.

### Passo 6 — Atualizar checklists e encerrar a Epic

**O que fazer:** consolidar os critérios e encerrar #1 apenas quando todo o trabalho necessário estiver integrado e aprovado.

**Por que:** hoje #1 está aberta, 4/7 Sub-Issues estão fechadas e #12/#14/#15 seguem abertas. Além disso, a descrição atual da Issue #1 não contém checkboxes formais para os seis critérios gerais; eles estão documentados em `docs/planejamento/01/01-03-issue-principal-epic.md`.

Antes do encerramento:

1. Atualize a descrição da Epic com checkboxes dos critérios gerais (CA-1 a CA-6 deste roteiro) e links para evidências.
2. Marque cada critério como concluído somente após confirmar as evidências indicadas na Seção 1.
3. Confirme que todas as Sub-Issues filhas estão fechadas; o estado atual inclui a #20 adicional.
4. Confirme PRs relevantes merged em `main`, revisão humana registrada e testes finais aprovados.
5. Confirme o Project e mova o card da Epic para **Done** somente após os passos anteriores.

**CLI — somente depois de todos os critérios satisfeitos e revisados:**

```powershell
gh issue view 1
gh issue close 1 --comment "UC01 concluído: Sub-Issues resolvidas, PRs integrados, CAs verificados e evidências/testes registrados."
```

**Interface Web:** atualize a descrição da #1 com os checkboxes/evidências, confirme todas as Sub-Issues filhas fechadas, registre comentário de encerramento e selecione **Close issue**; depois atualize o card para **Done**. Não feche a Epic enquanto RN03/RN05, #12/#14/#15, PR #22 ou revisão humana ainda estiverem pendentes.

## 4. Estado final recomendado

**Não encerrar a Epic #1 agora.** Os ajustes técnicos de RN03, RN05 e os cenários E2E estão implementados e validados localmente na branch `feature/uc01-rn03-error-contracts-e2e` (build passou; lint sem erros e um warning preexistente; unitários 25/25, integração PostgreSQL 6/6, E2E isolado 6/6). Ainda falta publicar a branch e abrir/revisar/mergear seu PR, aplicar a migration de RN03 no ambiente de destino, corrigir os aceites/dependências das Issues, integrar PR #22 após revisão humana, atualizar o Project e fechar #12/#14/#15 com evidências. Nenhuma operação de push, merge ou fechamento foi realizada.
