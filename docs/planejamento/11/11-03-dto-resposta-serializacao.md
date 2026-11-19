# 11-03 - DTO de Resposta e Serialização

## 1. Estado anterior

O DTO `RequestSchedulingResponseDto` já existia no projeto, mas não era usado pelo Controller. A resposta era devolvida diretamente pelo retorno do `SchedulingService.requestScheduling`.

O `scheduling.orm-mapper.ts` e demais componentes de persistência não precisavam ser modificados.

## 2. DTO final

Foi mantido o componente existente em `src/modules/scheduling/dtos/confirm-schedule-response.dto.ts` e foi adicionado um construtor explícito com os oito campos públicos.

## 3. Mapper HTTP

Criado `src/modules/scheduling/mappers/scheduling-response.mapper.ts`:

- Entrada: estrutura publicada pelo Service com campos públicos.
- Saída: `RequestSchedulingResponseDto`.
- O retorno é construído campo a campo.
- Campos adicionais do objeto recebido em runtime são ignorados.

## 4. Controller final

`SchedulingController.request` continua delegando ao método real:

```ts
const scheduling = await this.schedulingService.requestScheduling(dto);
return toRequestSchedulingResponse(scheduling);
```

O tipo de retorno passou a ser `Promise<RequestSchedulingResponseDto>`.

## 5. Arquivos modificados

- `src/modules/scheduling/controllers/scheduling.controller.ts`
- `src/modules/scheduling/controllers/scheduling.controller.spec.ts`
- `src/modules/scheduling/dtos/confirm-schedule-response.dto.ts`
- Novo mapper `src/modules/scheduling/mappers/scheduling-response.mapper.ts`

Nenhum Service, Repository, domínio, ORM ou mapper de persistência foi alterado.

## 6. Evidências

Ciclo RED → GREEN executado:

- RED: mock do Service devolveu `internalSchedulingTrace`; o teste fechado detectou vazamento.
- GREEN: mapper selecionou apenas os oito campos públicos; o teste passou.

Verificações realizadas:

- `pnpm test`: 22/22 aprovados.
- `pnpm build`: aprovado.
- `pnpm lint`: aprovado com 1 warning preexistente em `scheduling.repository.interface.ts`.
