# 11-05 - Testes Automatizados do Contrato

## 1. Suíte existente

O spec `src/modules/scheduling/controllers/scheduling.controller.spec.ts` já continha:

- Inicialização única do `INestApplication`.
- `ValidationPipe({ whitelist: true, transform: true })`.
- `DomainHttpExceptionFilter`.
- Mock de `SchedulingService.requestScheduling`.
- Cenário válido com `201`.
- Cenário inválido com `400`.

A estrutura foi preservada.

## 2. Novo teste

Foi acrescentado um cenário que mocka o Service com uma propriedade simulada chamada `internalSchedulingTrace`.

Asserções:

- A propriedade não aparece na resposta.
- `response.body` é comparado por `toEqual` com exatamente os oito campos públicos.

O identificador continua fixado somente no mock; a API real usa UUID gerado.

## 3. Evidência RED

Antes do mapper, o teste encontrou:

```text
Received: "informacao-interna-ilustrativa"
Expected: property "internalSchedulingTrace" undefined
```

Resultado: 1 falha, demonstrando o vazamento.

## 4. Evidência GREEN

Após o mapper:

```text
$ pnpm test
Test Files  6 passed (6)
Tests       22 passed (22)
```

## 5. Comandos executados

| Comando | Resultado |
| --- | --- |
| `pnpm test -- src/modules/scheduling/controllers/scheduling.controller.spec.ts` | RED antes do mapper; GREEN depois |
| `pnpm test` | 22/22 |
| `pnpm build` | Aprovado |
| `pnpm lint` | 0 erros; 1 warning preexistente |
| `pnpm test:integration` | Não aprovado: `TEST_DB_HOST` não definido; 5 testes foram ignorados |

## 6. Regressões

Não foram observadas regressões na suíte rápida. A integração PostgreSQL não pôde ser reexecutada nesta sessão porque `TEST_DB_*` não está configurado.
