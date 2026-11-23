# 11-06 - Compatibilidade com Consumidores

## 1. Contrato atual

Os oito campos públicos são `schedulingId`, `customerId`, `serviceId`, `professionalId`, `startsAt`, `endsAt`, `status` e `message`.

## 2. Matriz hipotética

| Cenário | Contrato hipotético | Consumidores afetados | Classificação | Mitigação |
| --- | --- | --- | --- | --- |
| Renomear `schedulingId` para `id` | Nova chave `id` | Clientes que usam a chave atual | Potencialmente incompatível | Não renomear sem nova versão e migração |
| Renomear `startsAt` | Novo nome de campo | Clientes que leem ou validam fechadamente | Potencialmente incompatível | Compatibilidade temporária somente por dupla exposição |
| Remover um campo | Campo ausente | Clientes que dependem dele | Potencialmente incompatível | Deprecar antes de remover |
| Alterar `schedulingId` para número | Tipo numérico | Clientes que validam UUID/string | Potencialmente incompatível | Preservar string UUID |
| Encapsular em `data` | `{ data: {...} }` | Todos os clientes existentes | Potencialmente incompatível | Nova versão ou adaptação coordenada |
| Alterar 201 para 200 | Status diferente | Clientes que exigem 201 | Potencialmente incompatível | Preservar 201; documentar antes de mudar |
| Adicionar campo opcional | Campo extra no JSON | Depende da validação do cliente | Dependente do contrato e dos consumidores | Adicionar com cliente tolerante ou coordenar adoção |

Nenhuma alteração hipotética foi implementada.

## 3. Conclusões

O contrato atual foi estabilizado sem breaking changes. A adição de um campo opcional não é automaticamente compatível: somente é segura quando o consumidor aceita objetos abertos ou ignora propriedades desconhecidas.
