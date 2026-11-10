# 05-05 - Evidências da Execução de Testes (Fase GREEN)

## 1. Comparativo da Transição RED ➔ GREEN

| Aspecto | Fase RED (Material 04) | Fase GREEN (Material 05) |
| :--- | :--- | :--- |
| **Data/Hora** | 10/11/2026 15:16:57 | 10/11/2026 15:30:57 |
| **Comando** | `npm test -- src/.../scheduling.entity.spec.ts` | `npm test -- src/.../scheduling.entity.spec.ts` |
| **Status Geral** | `FAIL (1 failed \| 3 passed)` | `PASS (4 passed)` |
| **Resultado RN05** | `AssertionError: expected [Function] to throw an error` | `✓ deve lançar erro de domínio quando customerId e professionalId forem idênticos` |
| **Tempo de Execução** | 254ms | 275ms |

---

## 2. Log Real da Execução do Teste Unitário (Vitest)

```text
> conecta-pro-services-backend@0.0.1 test
> vitest run src/modules/scheduling/entities/scheduling.entity.spec.ts

The plugin "vite-tsconfig-paths" is detected. Vite now supports tsconfig paths resolution natively via the resolve.tsconfigPaths option. You can remove the plugin and set resolve.tsconfigPaths: true in your Vite config instead.

 RUN  v4.1.11 C:/Users/utfpr/Documents/GitHubJP/conecta-pro-services/conecta-pro-services-backend

 ✓ src/modules/scheduling/entities/scheduling.entity.spec.ts (4 tests) 3ms

 Test Files  1 passed (1)
      Tests  4 passed (4)
   Start at  15:30:57
   Duration  275ms (transform 42ms, setup 0ms, import 69ms, tests 3ms, environment 0ms)
```

---

## 3. Avaliação Detalhada das Asserções Aprovadas

No arquivo `src/modules/scheduling/entities/scheduling.entity.spec.ts`:

1. `✓ should create a PENDING scheduling when it starts more than 24h from now` — **PASS** (RN01)
2. `✓ should accept a scheduling that starts exactly 24h from now` — **PASS** (RN01)
3. `✓ should throw SchedulingTooSoonException when it starts less than 24h from now` — **PASS** (RN01)
4. `✓ deve lançar erro de domínio quando customerId e professionalId forem idênticos` — **PASS** (RN05, nova implementação GREEN).

---

## 4. Teste de Não-Regressão da Suíte Completa

Para garantir que a alteração no agregado não introduziu quebras em controladores, serviços ou filtros, a suíte completa de testes do backend foi executada:

**Comando:**
```bash
npm test
```

**Saída Real do Terminal:**
```text
> conecta-pro-services-backend@0.0.1 test
> vitest run

The plugin "vite-tsconfig-paths" is detected. Vite now supports tsconfig paths resolution natively via the resolve.tsconfigPaths option. You can remove the plugin and set resolve.tsconfigPaths: true in your Vite config instead.

 RUN  v4.1.11 C:/Users/utfpr/Documents/GitHubJP/conecta-pro-services/conecta-pro-services-backend

 ✓ src/modules/scheduling/entities/scheduling.entity.spec.ts (4 tests) 4ms
 ✓ src/app.controller.spec.ts (1 test) 267ms
 ✓ src/modules/scheduling/services/request-scheduling.service.spec.ts (4 tests) 228ms
 ✓ src/modules/scheduling/services/scheduling.services.spec.ts (2 tests) 219ms

 Test Files  4 passed (4)
      Tests  11 passed (11)
   Start at  15:53:38
   Duration  1.26s (transform 213ms, setup 0ms, import 2.41s, tests 718ms, environment 0ms)
```

---

## 5. Conclusão Técnica

A transição de **RED** para **GREEN** foi obtida de forma legítima, robusta e rápida. Todos os 11 testes automatizados do sistema foram aprovados com 100% de sucesso, comprovando a eficácia da implementação mínima e a ausência de regressões.
