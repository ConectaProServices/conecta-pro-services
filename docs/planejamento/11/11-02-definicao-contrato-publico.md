# 11-02 - Definição do Contrato Público

## 1. Contrato de entrada

`POST /schedulings` recebe `RequestSchedulingDto`:

| Campo | Tipo | Obrigatório | Validação |
| --- | --- | --- | --- |
| `customerId` | string UUID | Sim | `@IsUUID`, `@IsNotEmpty` |
| `serviceId` | string UUID | Sim | `@IsUUID`, `@IsNotEmpty` |
| `professionalId` | string UUID | Sim | `@IsUUID`, `@IsNotEmpty` |
| `startsAt` | string JSON convertida para `Date` | Sim | `@Type`, `@IsDate`, `@IsNotEmpty` |

Campos extras são descartados por `whitelist: true`.

## 2. Contrato público de saída

```ts
export class RequestSchedulingResponseDto {
  schedulingId: string;
  customerId: string;
  serviceId: string;
  professionalId: string;
  startsAt: Date;
  endsAt: Date;
  status: string;
  message: string;
}
```

| Campo | Tipo JSON | Origem | Justificativa |
| --- | --- | --- | --- |
| `schedulingId` | string UUID | Agendamento criado | Identifica o recurso solicitado |
| `customerId` | string UUID | Entrada / agendamento | Identifica o cliente |
| `serviceId` | string UUID | Entrada / agendamento | Identifica o serviço |
| `professionalId` | string UUID | Entrada / agendamento | Identifica o profissional |
| `startsAt` | string ISO | Agendamento criado | Início confirmado |
| `endsAt` | string ISO | Agendamento criado | Fim calculado pelo catálogo |
| `status` | string | Estado do agendamento | Estado atual público |
| `message` | string | Mensagem da aplicação | Confirmação para o consumidor |

## 3. Responsabilidades distintas

- DTO de entrada: valida e transforma dados recebidos.
- Entidade de domínio: aplica regras e representa o agregado `Scheduling`.
- Entidade ORM: implementa persistência da infraestrutura.
- DTO de resposta: define exclusivamente a representação HTTP pública.
- Mapper HTTP: seleciona campos públicos do objeto recebido da aplicação.

O DTO de resposta não substitui a entidade de domínio nem a entidade ORM.

## 4. Compatibilidade

Nenhum campo confirmado foi renomeado, removido, tipado novamente ou encapsulado. O contrato existente foi preservado.
