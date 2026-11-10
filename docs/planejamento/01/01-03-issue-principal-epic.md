# [UC01] Solicitar Agendamento

## Objetivo geral

Implementar o primeiro slice funcional do sistema, permitindo que um cliente realize uma solicitação de agendamento validando a disponibilidade do prestador e a regra de antecedência mínima de 24 horas.

## Contexto e escopo

O módulo de agendamento é o núcleo de valor do projeto. O problema central é a ausência de controle centralizado de horários, o que gera conflitos, sobreposição e dificuldades operacionais para prestadores de serviços. Este caso de uso representa a base para a criação e manutenção da agenda do prestador, com foco em segurança de consistência e organização do processo de reserva.

## Referência formal

- Documento de referência do sistema: [visao-geral.md](../visao-geral.md)
- Base técnica e arquitetura do primeiro slice: [BASE_TECNICA_UC01.md](../tmp_desenv_corporativo/Desenvolvimento-Sistema-Corporativo-main/BASE_TECNICA_UC01.md)
- Blueprint de implementação: [BLUEPRINT_DE_IMPLEMENTACAO.md](../BLUEPRINT_DE_IMPLEMENTACAO.md)

## Requisitos funcionais contemplados

- Receber a solicitação de agendamento com dados do cliente, serviço e prestador.
- Validar a existência do serviço no catálogo.
- Calcular o fim do agendamento com base na duração do serviço.
- Verificar antecedência mínima de 24 horas.
- Verificar sobreposição de agenda do prestador.
- Persistir o agendamento em status pendente.
- Retornar resposta estruturada ao cliente.

## Relação com as Sub-Issues planejadas

- [ ] SUB-01 — Modelar e validar o agregado `Scheduling`
- [ ] SUB-02 — Definir DTO de entrada e endpoint HTTP de criação
- [ ] SUB-03 — Implementar regra de negócio de solicitação
- [ ] SUB-04 — Implementar persistência do agendamento
- [ ] SUB-05 — Implementar tratamento de exceções e contratos de erro
- [ ] SUB-06 — Definir testes automatizados do UC01

## Critérios gerais de aceite para conclusão do caso de uso

- O cliente consegue criar uma solicitação de agendamento com payload válido.
- O sistema rejeita solicitações com antecedência menor que 24 horas.
- O sistema rejeita solicitações em horários sobrepostos para o mesmo prestador.
- O agendamento é persistido com status inicial pendente.
- O erro do sistema é retornado em contrato consistente para cenários inválidos.
- A funcionalidade está coberta por testes do fluxo principal e dos cenários alternativos.

## Dependências externas e bloqueios

- Disponibilidade de ambiente de desenvolvimento com PostgreSQL e Docker.
- Configuração do módulo de agendamento no backend.
- Definição da estrutura do repositório e do módulo de serviços externos.
- Alinhamento da equipe para interpretação das regras de negócio.

## Condições de conclusão e prontidão

Este épico estará pronto para iniciar a implementação quando:

- a modelagem do domínio estiver validada;
- o contrato de entrada estiver definido;
- a regra de negócio do UC01 estiver clara;
- os testes do fluxo principal e dos erros básicos forem previstos;
- o ambiente de banco e execução estiver pronto.
