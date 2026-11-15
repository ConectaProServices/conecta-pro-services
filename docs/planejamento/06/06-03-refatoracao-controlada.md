# 06-03 - Refatoração Controlada

## Decisão adotada

Executada uma refatoração localizada: a violação RN05 agora lança `SameParticipantSchedulingException` em vez de `Error` genérico. O arquivo da exceção já existia no PR como arquivo vazio.

## Arquivos analisados e alterados

- `conecta-pro-services-backend/src/common/exceptions/same-participant-scheduling.exception.ts`
- `conecta-pro-services-backend/src/modules/scheduling/entities/scheduling.entity.ts`
- Teste examinado, mas não alterado: `conecta-pro-services-backend/src/modules/scheduling/entities/scheduling.entity.spec.ts`

## Diff funcional

```diff
diff --git a/src/common/exceptions/same-participant-scheduling.exception.ts b/src/common/exceptions/same-participant-scheduling.exception.ts
+export class SameParticipantSchedulingException extends Error {
+    constructor() {
+        super("Cliente e prestador não podem ser a mesma pessoa.");
+        this.name = "SameParticipantSchedulingException";
+    }
+}

diff --git a/src/modules/scheduling/entities/scheduling.entity.ts b/src/modules/scheduling/entities/scheduling.entity.ts
+import { SameParticipantSchedulingException } from "../../../common/exceptions/same-participant-scheduling.exception.js";
 ...
         if (props.customerId === props.professionalId) {
-            throw new Error("Cliente e prestador não podem ser a mesma pessoa.");
+            throw new SameParticipantSchedulingException();
         }
```

## Contratos e comportamentos preservados

- A guarda continua ocorrendo antes da instanciação do agendamento e da validação temporal.
- A mensagem da exceção foi mantida exatamente, preservando a asserção existente do teste.
- RN01, status inicial `PENDING`, parâmetros da fábrica e assinatura pública de `Scheduling.request()` não foram alterados.
- Nenhum DTO, controller, repositório, filtro HTTP ou teste foi modificado.
- O filtro HTTP não foi alterado: mapear RN05 para HTTP 400 mudaria o comportamento observável e requer uma decisão/critério de aceite separado.

## Resultado imediato

Após a alteração, o teste focado passou (4/4) e a suíte completa passou (11/11). `pnpm build` também passou. `pnpm lint` concluiu sem erro, mas emitiu um warning preexistente em `src/modules/scheduling/repositories/scheduling.repository.interface.ts` sobre união de tipos com `any`.

## Situação de versionamento

As alterações foram versionadas em dois commits e enviadas para `feature/10-modelar-agregado-scheduling`:

- `eaab51f` — `refactor(scheduling): type self-participant domain error (ref #10)`
- `ac05090` — `docs: add Material 06 refactoring and integration artifacts`

O PR #16 acompanha o novo head `ac05090`; permanece Draft e sem reviews humanas ou check runs. A descrição do PR ainda precisa ser atualizada manualmente para refletir o encerramento da refatoração e a pendência de revisão/integração.
