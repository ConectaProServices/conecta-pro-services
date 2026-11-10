# 04-07 - Minuta e Abertura do Draft Pull Request no GitHub

## 1. Dados de Configuração do Pull Request

- **Repositório:** `https://github.com/ConectaProServices/conecta-pro-services`
- **Branch Base (Destino):** `main`
- **Branch Comparada (Origem):** `feature/10-modelar-agregado-scheduling`
- **Título do PR:** `Draft: test(scheduling): add failing test for self-booking rejection (ref #10)`
- **Tipo de Pull Request:** **Draft Pull Request** (Rascunho de Trabalho em Progresso)
- **Assignee:** Guilherme Campos Feuser (`@WearifulCupid0`) / João Pedro Zanette Sartori (`@JPZS-Git`)
- **Reviewer:** Layssa Rodrigues Alves (`@LayssaRD`)

---

## 2. Conteúdo Integral da Descrição Submetida (Template Markdown)

```markdown
## 📝 Draft Pull Request — [SUB-01] Modelar e validar o agregado Scheduling

### 📌 Issue Vinculada
Ref: #10

### 🎯 Objetivo desta Alteração
Estabelecer o primeiro teste automatizado na fase **RED** do ciclo TDD, exercitando a regra de negócio e critério de aceite:
> **RN05:** "O cliente e o prestador não podem ser a mesma pessoa no mesmo agendamento (`customerId !== professionalId`)."

### 🛠️ Alterações Incluídas
- Implementação do cenário de teste unitário no padrão AAA no agregado: `conecta-pro-services-backend/src/modules/scheduling/entities/scheduling.entity.spec.ts`

### 🧪 Evidência da Fase RED (TDD)
O teste foi executado via Vitest no terminal e falhou legitimamente devido à ausência da implementação funcional em código de produção:
\`\`\`text
FAIL  src/modules/scheduling/entities/scheduling.entity.spec.ts > Scheduling.request (RN05 - proibição de cliente idêntico ao prestador) > deve lançar erro de domínio quando customerId e professionalId forem idênticos
AssertionError: expected [Function] to throw an error

- Expected:
null

+ Received:
undefined
 ❯ src/modules/scheduling/entities/scheduling.entity.spec.ts:55:55
     55|         expect(() => Scheduling.request(params, NOW)).toThrow(
\`\`\`

### ⏳ Estado Atual e Próximos Passos
- [x] Branch de trabalho criada a partir da `main`
- [x] Teste automatizado escrito e falhando legitimamente (fase RED)
- [x] Commit atômico registrado e publicado no GitHub
- [ ] Implementação de código de produção para satisfazer o teste (fase GREEN — Material 05)
- [ ] Refatoração e limpeza de código (fase REFACTOR — Material 05)

⚠️ **ATENÇÃO: Este Pull Request é um RASCUNHO (DRAFT) e NÃO DEVE SER INTEGRADO (MERGE) até a conclusão das fases GREEN e REFACTOR no Material 05.**
```

---

## 3. Instruções para Criação via GitHub Web e GitHub CLI

### Opção A — Pela Interface Web do GitHub
1. Acesse: `https://github.com/ConectaProServices/conecta-pro-services/pulls`
2. Clique no botão verde **New pull request**.
3. Selecione:
   - Base: `main`
   - Compare: `feature/10-modelar-agregado-scheduling`
4. Preencha o título e cole a minuta acima no corpo da descrição.
5. No botão verde de criação, clique na seta para baixo e escolha **"Create draft pull request"**.

### Opção B — Via GitHub CLI (`gh`)
```bash
gh pr create --draft \
  --base main \
  --head feature/10-modelar-agregado-scheduling \
  --title "Draft: test(scheduling): add failing test for self-booking rejection (ref #10)" \
  --body-file docs/planejamento/04-07-draft-pull-request.md
```
