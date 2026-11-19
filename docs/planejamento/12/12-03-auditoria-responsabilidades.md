# 12-03 - Auditoria de Responsabilidades

## Matriz

| Critério | Observação e evidência | Conclusão |
| --- | --- | --- |
| Separação de responsabilidades | Controller chama o Service; entidade aplica antecedência e regra de participantes; adapter persiste; mappers separam fronteira HTTP e ORM | Adequada no fluxo de criação, com ressalva de DTO HTTP no Service |
| Acoplamento | `SchedulingService` recebe `RequestSchedulingDto`; importa o tipo diretamente | Acoplamento de aplicação ao contrato de transporte confirmado; risco limitado enquanto este for o único consumidor |
| Coesão | Repository concentra consultas e gravação; adapter contém tradução da violação PostgreSQL | Coesa no escopo visto |
| Duplicação | Mappers HTTP e ORM mapeiam fronteiras diferentes; não foi demonstrada lógica duplicada | Hipótese de duplicação descartada |
| Legibilidade | Nome do arquivo `confirm-schedule-response.dto.ts` declara `RequestSchedulingResponseDto` | Inconsistência nominal observada; risco de navegação, sem falha funcional comprovada |
| Testabilidade | Testes de Service, Controller, integração em memória e adapter PostgreSQL; tokens substituíveis | Adequada; 22 unitários e 5 integração passaram |
| Estabilidade dos contratos | Controller declara `201`; DTO e mapper selecionam campos; teste HTTP usa comparação fechada | Adequada para o contrato atual |
| Configuração e composição | Tokens runtime vinculados com `useExisting`; TypeORM registra entidade; teste verifica provider | Adequada |

## Problemas confirmados

### A-01 — `any` no contrato do Repository

- Evidência: `ISchedulingRepository.findScheduleById` retorna `Promise<any | null>`, mas os dois adapters retornam `Promise<Scheduling | null>`.
- Efeito demonstrável: o `any` elimina checagem estática e mascara inconsistência; `pnpm lint` aponta `no-redundant-type-constituents` nessa declaração.
- Uso relevante: `SchedulingService.confirmScheduling` também retorna `Promise<any>` e verifica `scheduling.status`, embora o agregado declare o campo como `private`.
- Risco: código de aplicação pode depender de detalhes internos e permitir valores inválidos sem erro de compilação.
- Conclusão: problema de tipo/encapsulamento confirmado, mas fora do comportamento de criação principal.

### A-02 — RN05 não tem mapeamento HTTP explícito

- Evidência: `Scheduling.request` lança `SameParticipantSchedulingException`; a tabela do `DomainHttpExceptionFilter` não a inclui.
- Observação runtime registrada no Material 11: cliente igual ao prestador recebeu `500 Internal Server Error`, com texto genérico.
- Conclusão: comportamento confirmado; Issue #14 é o escopo mais próximo para resposta HTTP apropriada. Não corrigido nesta auditoria.

## Observações e hipóteses descartadas

- O Controller não acessa ORM nem Repository.
- O Service depende dos contratos do Repository e do catálogo, não do adaptador TypeORM.
- O provider de persistência de produção é TypeORM; o catálogo ativo é `InMemoryServiceCatalog` e possui somente um serviço demo. Isso é uma limitação concreta de composição/integrabilidade, mas sua substituição depende do módulo/catálogo externo ainda não implementado; não foi classificada como defeito isolado do UC01.
- Não foi encontrada duplicação entre mapper HTTP e mapper ORM.
- Não há evidência de que o repositório exponha tipos TypeORM em sua interface.
- Não foi avaliada qualidade absoluta nem cobertura de toda a aplicação.
