# 11-04 - Semântica HTTP e Erros

## 1. Configuração efetiva

- `ValidationPipe`: `whitelist: true`, `transform: true`.
- Filtro global: `DomainHttpExceptionFilter`.
- Status de sucesso confirmado pelo Controller: `201 Created`.

## 2. Matriz

| Cenário | Entrada | Resultado esperado | Resultado observado nesta atividade |
| --- | --- | --- | --- |
| Sucesso | UUIDs válidos e `startsAt` válido | 201; oito campos públicos | Preservado por teste HTTP mockado |
| Campo extra na entrada | Campo não decorado no DTO | Removido pelo whitelist; 201 | Coberto pela suíte existente |
| Corpo com UUID inválido e data inválida | Valores incorretos | 400; mensagens de validação | 400 confirmado pelo teste |
| Corpo vazio | `{}` | 400 | Confirmado no contêiner: `400 Bad Request`, 8 mensagens de validação |
| Campo com tipo errado | UUID inválido, serviço vazio e data inválida | 400 | Confirmado no contêiner com 4 mensagens |
| Campo extra na entrada | `extraField` adicional | 201; campo não devolvido | Confirmado no contêiner com `201 Created` |
| Conflito de agenda | Mesmo profissional e janela coincidente | 409 | Evidenciado pelo teste integrado em memória e pelo Material 10 no contêiner |
| Serviço inexistente | UUID não encontrado no catálogo | 404 | Coberto pelo teste integrado em memória |
| Antecedência insuficiente | Início a menos de 24h | 422 | Coberto pelo teste integrado em memória |
| Cliente igual ao prestador (RN05) | Mesmos UUIDs em `customerId` e `professionalId` | Status exigido pela Issue responsável permanece pendente | Confirmado no contêiner: `500 Internal Server Error`, com mensagem genérica |

## 3. Respostas de erro

- O filtro preserva respostas `HttpException` do Nest.
- Exceções de domínio conhecidas são convertidas para status e JSON controlados.
- Erros inesperados não expõem detalhes em produção.
- Nenhuma nova regra de negócio ou novo código obrigatório foi introduzido.

## 4. Divergências

A execução HTTP real foi confirmada contra a API reconstruída no contêiner. Os cenários mockados e integrados em memória complementam essa evidência.
