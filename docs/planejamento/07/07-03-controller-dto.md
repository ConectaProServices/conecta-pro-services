# 07-03 - Controller e DTO

## 1. Sub-Issues

- Atendida: #11 - SUB-02 (DTO de entrada e endpoint HTTP)
- Relacionadas: #12 - SUB-03 (serviço reutilizado, sem alteração); #10 - SUB-01 (contrato do agregado)

## 2. Situação

O Controller e o DTO **já existiam** no repositório (commit `8c0a19f`, de 27/10/2026, anterior ao Material 04). Nesta etapa eles foram **verificados quanto à conformidade e mantidos sem alteração**. Não houve motivo arquitetural para mudá-los, e preservar o código evita alterar contratos já usados pelo teste E2E existente.

## 3. Controller

`conecta-pro-services-backend/src/modules/scheduling/controllers/scheduling.controller.ts`

```typescript
import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { SchedulingService } from '../services/scheduling.service.js';
import { RequestSchedulingDto } from '../dtos/request-scheduling.dto.js';

@Controller('schedulings')
export class SchedulingController {
  constructor(private readonly schedulingService: SchedulingService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async request(@Body() dto: RequestSchedulingDto) {
    return this.schedulingService.requestScheduling(dto);
  }
}
```

### Checklist de verificação

| Item | Situação |
| --- | --- |
| Prefixo de rota `@Controller('schedulings')` | Confirmado |
| Verbo `@Post()` e status `201` explícito | Confirmado |
| Extração com `@Body()` tipada por `RequestSchedulingDto` | Confirmado |
| Injeção do `SchedulingService` via construtor | Confirmado (o teste HTTP resolve o provider) |
| Delegação fiel a `requestScheduling(input: RequestSchedulingDto)` | Confirmado. O serviço recebe o DTO inteiro, conforme sua assinatura atual |
| Sem regra de negócio, sem acesso a repositório ou banco | Confirmado |

O Controller passa o DTO inteiro porque essa é a **assinatura existente** do serviço (`requestScheduling(input: RequestSchedulingDto)`). Desmembrar os campos exigiria mudar o contrato da SUB-03 sem justificativa.

## 4. DTO

`conecta-pro-services-backend/src/modules/scheduling/dtos/request-scheduling.dto.ts`

```typescript
import { IsUUID, IsNotEmpty, IsDate } from 'class-validator';
import { Type } from 'class-transformer';

export class RequestSchedulingDto {
    @IsUUID()
    @IsNotEmpty()
    public readonly customerId: string;

    @IsUUID()
    @IsNotEmpty()
    public readonly serviceId: string;

    @IsUUID()
    @IsNotEmpty()
    public readonly professionalId: string;

    @Type(() => Date)
    @IsDate()
    @IsNotEmpty()
    public readonly startsAt: Date;
}
```

### Compatibilidade com o contrato

| Campo | Contrato (`01-04` SUB-01/SUB-02) | Restrição HTTP |
| --- | --- | --- |
| `customerId` | UUID do cliente | `@IsUUID` + `@IsNotEmpty` |
| `serviceId` | UUID do serviço do catálogo | `@IsUUID` + `@IsNotEmpty` |
| `professionalId` | UUID do prestador | `@IsUUID` + `@IsNotEmpty` |
| `startsAt` | Data/hora de início | `@Type(() => Date)` converte a string ISO; `@IsDate` rejeita datas inválidas |

`endsAt` **não** faz parte da entrada: ele é calculado pelo serviço a partir da duração do catálogo (CA da SUB-01). Nenhum campo extra foi inventado.

## 5. Validação HTTP vs. regra de negócio

| Camada | O que valida | Onde | Status |
| --- | --- | --- | --- |
| Fronteira HTTP (SUB-02) | Formato: UUIDs válidos, campos presentes, data válida | DTO + `ValidationPipe` | `400` |
| Domínio (SUB-01) | RN05 cliente ≠ prestador; RN01 antecedência de 24h | `Scheduling.request()` | RN01 → `422`; RN05 → **500** (não mapeado, pendência SUB-05) |
| Aplicação (SUB-03) | Serviço existe no catálogo; INV-1 sem sobreposição | `SchedulingService.requestScheduling()` | `404` / `409` |

Rejeitar um UUID inválido no DTO **não** implementa nem substitui RN01, RN05 ou INV-1. Essas regras protegem o domínio independentemente de quem chama o serviço e têm testes próprios (`scheduling.entity.spec.ts`, `request-scheduling.service.spec.ts`). Nenhuma regra de negócio foi adicionada ou alterada nesta etapa.

## 6. Dependências

`@nestjs/common` ^12.0.1, `class-validator` ^0.15.1, `class-transformer` ^0.5.1. Todas já estavam instaladas.

## 7. Verificações e pendências

- Verificado por requisição real (07-05) e por teste automatizado (07-06).
- `pnpm build` aprovado com o DTO atual, sem ajuste necessário.
- Nenhuma pendência no Controller ou no DTO para a SUB-02.
