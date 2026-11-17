# 04-05 - Evidências da Execução e Falha Funcional RED (TDD)

## 1. Registro da Execução Real no Terminal

- **Data e Hora:** 10/11/2026 15:16:57
- **Diretório de Execução:** `conecta-pro-services-backend/`
- **Comando Executado:**
```bash
npm test -- src/modules/scheduling/entities/scheduling.entity.spec.ts
```

---

## 2. Saída Completa e Expressiva do Terminal (Log Real)

```text
> conecta-pro-services-backend@0.0.1 test
> vitest run src/modules/scheduling/entities/scheduling.entity.spec.ts

The plugin "vite-tsconfig-paths" is detected. Vite now supports tsconfig paths resolution natively via the resolve.tsconfigPaths option. You can remove the plugin and set resolve.tsconfigPaths: true in your Vite config instead.

 RUN  v4.1.11 C:/Users/utfpr/Documents/GitHubJP/conecta-pro-services/conecta-pro-services-backend

 ❯ src/modules/scheduling/entities/scheduling.entity.spec.ts (4 tests | 1 failed) 7ms
     ✓ should create a PENDING scheduling when it starts more than 24h from now 2ms
     ✓ should accept a scheduling that starts exactly 24h from now 0ms
     ✓ should throw SchedulingTooSoonException when it starts less than 24h from now 0ms
     × deve lançar erro de domínio quando customerId e professionalId forem idênticos 4ms

⎯⎯⎯⎯⎯⎯⎯ Failed Tests 1 ⎯⎯⎯⎯⎯⎯⎯

 FAIL  src/modules/scheduling/entities/scheduling.entity.spec.ts > Scheduling.request (RN05 - proibição de cliente idêntico ao prestador) > deve lançar erro de domínio quando customerId e professionalId forem idênticos
AssertionError: expected [Function] to throw an error

- Expected:
null

+ Received:
undefined

 ❯ src/modules/scheduling/entities/scheduling.entity.spec.ts:55:55
     53|         // Act & Assert (Ação e Verificação):
     54|         // O método de fábrica deve barrar a criação e lançar erro de domínio
     55|         expect(() => Scheduling.request(params, NOW)).toThrow(
       |                                                       ^
     56|             /cliente e prestador não podem ser a mesma pessoa|self-scheduling not allowed/i,
     57|         );

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯

 Test Files  1 failed (1)
      Tests  1 failed | 3 passed (4)
   Start at  15:16:57
   Duration  254ms (transform 41ms, setup 0ms, import 65ms, tests 7ms, environment 0ms)
```

---

## 3. Análise e Diagnóstico da Falha RED

1. **Causa Raiz da Falha:** O método estático de fábrica `Scheduling.request()` na classe `Scheduling` (`src/modules/scheduling/entities/scheduling.entity.ts`) atualmente valida apenas a regra temporal de antecedência de 24 horas (`RN01`). Ele ainda não possui a instrução de guarda que verifica se `props.customerId === props.professionalId`.
2. **Resultado Observado:** A asserção `expect(() => Scheduling.request(params, NOW)).toThrow(...)` falhou com `AssertionError: expected [Function] to throw an error`, pois a entidade foi instanciada com sucesso em vez de lançar o erro esperado.
3. **Validação da Legitimidade do RED:**
   - ✅ O código compila perfeitamente sem erros de sintaxe ou tipos TypeScript.
   - ✅ O runner de testes (Vitest) executou normalmente sem falhas de infraestrutura.
   - ✅ A falha é puramente funcional e comprova a ausência do comportamento de negócio no código de produção.
   - ⛔ **Aplicação da Regra Capital do TDD:** O código de produção em `scheduling.entity.ts` **não** foi alterado para satisfazer o teste nesta etapa, permanecendo intacto para o ciclo GREEN subsequente (Material 05).
