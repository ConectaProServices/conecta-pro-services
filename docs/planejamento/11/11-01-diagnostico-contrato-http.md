# 11-01 - Diagnóstico do Contrato HTTP

## 1. Projeto e caso de uso

- Projeto: Conecta Pro Services.
- Backend: `conecta-pro-services-backend/`, NestJS.
- Caso de uso: UC01 - Solicitar Agendamento.
- Rota existente: `POST /schedulings`.
- Branch desta atividade: `feature/material-11-http-contract-stabilization`.
- Destino da documentação: `docs/planejamento/11/`.

## 2. Contrato observado anteriormente

O sucesso já era `201 Created` e o corpo observado no Material 10 continha:

```json
{
  "schedulingId": "<uuid>",
  "customerId": "<uuid>",
  "serviceId": "<uuid>",
  "professionalId": "<uuid>",
  "startsAt": "<iso-date>",
  "endsAt": "<iso-date>",
  "status": "PENDING",
  "message": "Scheduling requested successfully."
}
```

O estado inicial não possuía um mapeamento HTTP explícito no Controller. A resposta vinha diretamente do objeto construído pelo `SchedulingService`, a partir do agendamento persistido ou mockado.

## 3. Componentes inspecionados

| Componente | Estado inicial |
| --- | --- |
| Controller | `SchedulingController.request` delegava ao `SchedulingService.requestScheduling` e não tipava/transformava a resposta |
| DTO de entrada | `RequestSchedulingDto`: UUIDs e `startsAt: Date` |
| DTO de resposta | `RequestSchedulingResponseDto` existia como declaração sem construtor, mas não era usado |
| Service | Montava o objeto público diretamente, sem mecanismo HTTP separado |
| Entidade de domínio | `Scheduling`, sem campos novos nesta atividade |
| Persistência/ORM | Sem alteração |
| `main.ts` | `ValidationPipe({ whitelist: true, transform: true })` e filtro global |
| Testes | Vitest, Supertest e `@nestjs/testing`; spec do Controller já cobria sucesso e 400 |
| Compose | API na porta 3000 e PostgreSQL publicado na porta 5435 |

## 4. Linha de base real

Executada nesta atividade, antes da correção:

| Comando | Resultado |
| --- | --- |
| `pnpm test` | 6 arquivos / 21 testes aprovados |
| `pnpm test:integration` | Falhou antes dos testes: `TEST_DB_*` não definido no `.env` |
| `pnpm build` | Aprovado |

## 5. Divergências e necessidade

- Não havia proteção HTTP explícita contra campos adicionais acrescentados ao objeto do Service.
- O DTO de resposta já existia, mas não era utilizado pelo Controller.
- O teste fechado de sucesso não detectava propriedades extras vindas de um Service mockado.
- Inicialmente o Docker não estava acessível por este assistente; em 19/11/2026 o ambiente foi iniciado pelo usuário e a API foi reconstruída e verificada com sucesso.

## 6. Decisão

Adicionar um mapper HTTP explícito e preservá-lo no Controller. Não alterar domínio, Service, Repository, ORM, Docker ou banco.

## 7. Pendências

- Configurar `TEST_DB_*` com banco e usuário exclusivos terminados em `_test`.
- Identificar ou criar uma Issue específica da estabilização do contrato, sem reutilizar a Issue de containerização nem duplicar planejamento.
