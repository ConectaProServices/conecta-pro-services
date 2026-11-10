# 05-07 - Versionamento, Procedimento de Commit e Atualização do Pull Request

## 1. Procedimento de Commit Atômico da Implementação GREEN

Para manter o histórico do Git limpo, atômico e rigorosamente aderente ao ciclo TDD, isolamos o commit de código de produção:

### 1.1 Adição do Arquivo Modificado
```bash
git add conecta-pro-services-backend/src/modules/scheduling/entities/scheduling.entity.ts
```

### 1.2 Registro do Commit Semântico (Conventional Commits)
```bash
git commit -m "feat(scheduling): reject self-booking when customer and professional are the same (ref #10)"
```

### 1.3 Adição e Commit dos Artefatos de Documentação
```bash
git add docs/planejamento/05-*.md docs/prompts/05-do-teste-red-a-implementacao-green-com-tdd.md
git commit -m "docs: add artifacts for Material 05 TDD GREEN implementation"
```

### 1.4 Publicação na Branch Remota
```bash
git push origin feature/10-modelar-agregado-scheduling
```

---

## 2. Resumo das Alterações (Diff do Código de Produção)

```diff
diff --git a/conecta-pro-services-backend/src/modules/scheduling/entities/scheduling.entity.ts b/conecta-pro-services-backend/src/modules/scheduling/entities/scheduling.entity.ts
index 75ba812..18cd4ec 100644
--- a/conecta-pro-services-backend/src/modules/scheduling/entities/scheduling.entity.ts
+++ b/conecta-pro-services-backend/src/modules/scheduling/entities/scheduling.entity.ts
@@ -32,6 +32,10 @@ export class Scheduling {
     }
 
     public static request(props: RequestSchedulingProps, now: Date = new Date()): Scheduling {
+        if (props.customerId === props.professionalId) {
+            throw new Error("Cliente e prestador não podem ser a mesma pessoa.");
+        }
+
         if (props.startsAt.getTime() - now.getTime() < MIN_NOTICE_IN_MS) {
             throw new SchedulingTooSoonException();
         }
```

---

## 3. Minuta de Atualização do Pull Request no GitHub

Acesse o **Draft Pull Request** existente no GitHub associado à branch `feature/10-modelar-agregado-scheduling` e atualize a descrição com a seguinte minuta:

```markdown
## 📝 Pull Request — [SUB-01] Modelar e validar o agregado Scheduling

### 📌 Issue Vinculada
Ref: #10

### 🎯 Objetivo desta Alteração
Concluir a fase **GREEN** do ciclo TDD, implementando a regra de negócio e invariante de domínio:
> **RN05:** "O cliente e o prestador não podem ser a mesma pessoa no mesmo agendamento (`customerId !== professionalId`)."

### 🛠️ Alterações Incluídas
- Implementação da cláusula de guarda em `Scheduling.request()` para barrar `customerId === professionalId`:
  `conecta-pro-services-backend/src/modules/scheduling/entities/scheduling.entity.ts`
- O teste unitário criado na fase RED agora passa com 100% de sucesso.

### 🧪 Evidência da Fase GREEN (TDD)
Execução do Vitest com aprovação total de 4 testes no arquivo e 11 testes na suíte geral:
\`\`\`text
 ✓ src/modules/scheduling/entities/scheduling.entity.spec.ts (4 tests) 3ms
 Test Files  1 passed (1)
      Tests  4 passed (4)
\`\`\`

### ⏳ Estado Atual e Próximos Passos
- [x] Branch de trabalho criada a partir da `main`
- [x] Teste automatizado escrito e falhando legitimamente (fase RED — Material 04)
- [x] Implementação de código de produção para satisfazer o teste (fase GREEN — Material 05)
- [ ] Refatoração e limpeza de código (fase REFACTOR — Material 06)
- [ ] Revisão técnica final e conversão para PR definitivo (Ready for review)

⚠️ **ATENÇÃO: Este Pull Request ainda está em desenvolvimento e NÃO DEVE SER INTEGRADO (MERGE) até a conclusão da fase REFACTOR (Material 06).**
```

---

## 4. Governança e Atualização do GitHub Project

- **Status da Sub-Issue #10:** Mantida estritamente em **`In Progress`**.
- **Regras Estritas:**
  - ⛔ **NÃO mover para `In Review` ou `Done`:** A tarefa ainda passará pela fase formal de refatoração (Material 06).
  - ⛔ **NÃO fazer merge na `main`:** O código só será integrado após o encerramento completo do ciclo TDD.
