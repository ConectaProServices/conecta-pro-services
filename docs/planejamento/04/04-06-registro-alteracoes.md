# 04-06 - Registro de Alterações Controladas e Procedimento de Commit

## 1. Arquivos Modificados e Adicionados

Para manter a atomicidade da alteração técnica, **apenas** o arquivo estritamente indispensável para expressar o teste RED foi modificado no código:

1. `conecta-pro-services-backend/src/modules/scheduling/entities/scheduling.entity.spec.ts` (cenário de teste automatizado exercitando a RN05 no padrão AAA).

---

## 2. Resumo das Alterações (Diff Resumido do Teste)

```diff
diff --git a/conecta-pro-services-backend/src/modules/scheduling/entities/scheduling.entity.spec.ts b/conecta-pro-services-backend/src/modules/scheduling/entities/scheduling.entity.spec.ts
index 7d75a5a..5b27009 100644
--- a/conecta-pro-services-backend/src/modules/scheduling/entities/scheduling.entity.spec.ts
+++ b/conecta-pro-services-backend/src/modules/scheduling/entities/scheduling.entity.spec.ts
@@ -38,3 +38,23 @@ describe('Scheduling.request (RN01 - antecedência mínima de 24h)', () => {
         expect(() => Scheduling.request(params, NOW)).toThrow(SchedulingTooSoonException);
     });
 });
+
+describe('Scheduling.request (RN05 - proibição de cliente idêntico ao prestador)', () => {
+    it('deve lançar erro de domínio quando customerId e professionalId forem idênticos', () => {
+        // Arrange (Preparação): dados válidos com antecedência > 24h, porém com IDs iguais
+        const sameUserId = '22222222-2222-4222-8222-222222222222';
+        const startsAt = hoursFromNow(48);
+        const params = {
+            ...buildParams(startsAt),
+            customerId: sameUserId,
+            professionalId: sameUserId,
+        };
+
+        // Act & Assert (Ação e Verificação):
+        // O método de fábrica deve barrar a criação e lançar erro de domínio
+        expect(() => Scheduling.request(params, NOW)).toThrow(
+            /cliente e prestador não podem ser a mesma pessoa|self-scheduling not allowed/i,
+        );
+    });
+});
```

---

## 3. Rastreabilidade dos Commits e Push

### 3.1 Commit do Teste (Fase RED)
```bash
git commit -m "test(scheduling): add failing test for self-booking rejection (ref #10)"
```
**Hash Real do Commit:** `b8939ef`  
**Autor:** Guilherme Campos Feuser (`@WearifulCupid0` / `guilhermefeuser@alunos.utfpr.edu.br`)  
**Data:** Tue Nov 10 15:02:05 2026 -0300

### 3.2 Commit de Sincronização Local / Governança
**Hash Real do Commit de Integração:** `95a35e3`  
**Autor:** João Pedro Zanette Sartori (`@JPZS-Git` / `joaopedrosartori@alunos.utfpr.edu.br`)

### 3.3 Publicação no Repositório Remoto
```bash
git push -u origin feature/10-modelar-agregado-scheduling
```
**Saída do Terminal:**
```text
branch 'feature/10-modelar-agregado-scheduling' set up to track 'origin/feature/10-modelar-agregado-scheduling'.
To https://github.com/ConectaProServices/conecta-pro-services.git
   b8939ef..95a35e3  feature/10-modelar-agregado-scheduling -> feature/10-modelar-agregado-scheduling
```

### 3.4 Verificação com `git log -1 --stat`
```text
commit 95a35e3
Author: João Pedro Zanette Sartori <joaopedrosartori@alunos.utfpr.edu.br>
Date:   Tue Nov 10 15:16:00 2026 -0300

    Merge branch 'feature/10-modelar-agregado-scheduling' of https://github.com/ConectaProServices/conecta-pro-services into feature/10-modelar-agregado-scheduling
```
