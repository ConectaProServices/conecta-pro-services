# 01-04 - Sub-Issues Completas

## SUB-01 — Modelar e validar o agregado `Scheduling`

### Objetivo

Definir a entidade e o padrão de comportamento do agendamento para representar corretamente o ciclo de vida da solicitação no domínio.

### Descrição detalhada

- Criar a entidade `Scheduling` com atributos relevantes para o caso de uso.
- Representar o status do agendamento e o intervalo de tempo.
- Definir o cálculo de `endsAt` a partir da duração do serviço.
- Garantir que o aggregate mantenha consistência no domínio.

### Requisito / regra de origem

- UC01 - Solicitar Agendamento
- RN01: antecedência mínima de 24 horas
- INV-1: ausência de sobreposição da agenda

### Escopo e responsabilidades

- Modelar a entidade e responsabilidades do agregado.
- Definir as regras de criação do objeto.
- Validar a representação da data e intervalo.

### Critérios de aceite

- A entidade aceita os dados de `customerId`, `serviceId`, `professionalId`, `startsAt` e `endsAt`.
- O status inicial é `PENDING`.
- A duração do agendamento é calculada com base no serviço contratado.

### Dependências

- Nenhuma estrutural; depende da definição do domínio do projeto.

### Labels sugeridas

`domain`, `scheduling`, `backend`

### Responsável

Guilherme Campos Feuser

### Estado inicial recomendado

`Ready`

### Evidências esperadas

- Entidade definida e versionada no módulo de agendamento.
- Código de domínio alinhado com a regra de negócio.

---

## SUB-02 — Definir DTO de entrada e endpoint HTTP de criação

### Objetivo

Expor a funcionalidade de criação do agendamento de forma padronizada pela API.

### Descrição detalhada

- Criar o `RequestSchedulingDto` com validações de entrada.
- Definir rota HTTP de criação do agendamento.
- Garantir a serialização dos campos e a estrutura da resposta.

### Requisito / regra de origem

- Fluxo principal do UC01
- Validações de entrada do caso de uso

### Escopo e responsabilidades

- Controller do módulo de agendamento.
- DTOs com validações de tipo e UUID.
- Resposta HTTP consistente para sucesso.

### Critérios de aceite

- A API aceita payload com UUID válido e data válida.
- O endpoint responde com status HTTP adequado em caso de sucesso.
- Campos obrigatórios são validados antes da execução da regra de negócio.

### Dependências

- SUB-01

### Labels sugeridas

`api`, `backend`, `validation`

### Responsável

Layssa Rodrigues Alves

### Estado inicial recomendado

`Ready`

### Evidências esperadas

- Endpoint documentado no controller.
- Payload com validação automática.

---

## SUB-03 — Implementar regra de negócio de solicitação

### Objetivo

Centralizar a lógica de validação da solicitação de agendamento e garantir que apenas operações válidas sejam persistidas.

### Descrição detalhada

- Verificar se o serviço informado existe no catálogo.
- Validar antecedência mínima de 24h.
- Verificar conflito de horário com reservas ativas do prestador.
- Criar o agendamento com status pendente e intervalo final calculado.

### Requisito / regra de origem

- RN01
- RN03
- RN05
- INV-1
- Fluxo principal do UC01

### Escopo e responsabilidades

- Implementar `SchedulingService.requestScheduling`.
- Aplicar regras e lançar exceções apropriadas.
- Disparar rejeição em caso de sobreposição ou antecedência inválida.

### Critérios de aceite

- Solicitações com menos de 24h são rejeitadas.
- Agendamentos sobrepostos para o mesmo prestador são rejeitados.
- O serviço inválido não permite criação do agendamento.
- O caso válido cria o agendamento com status `PENDING`.

### Dependências

- SUB-01, SUB-02

### Labels sugeridas

`scheduling`, `domain`, `validation`

### Responsável

Guilherme Campos Feuser

### Estado inicial recomendado

`Backlog`

### Evidências esperadas

- Lógica implementada no serviço.
- Exceções específicas para cada falha.

---

## SUB-04 — Implementar persistência do agendamento

### Objetivo

Persistir o agendamento de forma segura e consistente em banco de dados relacional.

### Descrição detalhada

- Criar a estrutura da entidade TypeORM.
- Implementar o repositório de agendamento.
- Salvar a reserva e consultar pelo identificador.
- Integrar o módulo com a infraestrutura do projeto.

### Requisito / regra de origem

- Persistência do fluxo principal do UC01
- Garantia de consistência da operação

### Escopo e responsabilidades

- Entity mapping.
- Repositório de agendamento.
- Integração com banco PostgreSQL.

### Critérios de aceite

- O agendamento é salvo corretamente em tabela/entidade.
- O sistema consegue consultar a reserva criada.
- A estrutura persiste tempo de início, término e status.

### Dependências

- SUB-01, SUB-03

### Labels sugeridas

`persistence`, `database`, `backend`

### Responsável

Layssa Rodrigues Alves

### Estado inicial recomendado

`Backlog`

### Evidências esperadas

- Mapeamento ORM validado.
- Repositório funcionando com dados persistidos.

---

## SUB-05 — Implementar tratamento de exceções e contratos de erro

### Objetivo

Padronizar as respostas do sistema para cenários de falha e garantir previsibilidade de uso da API.

### Descrição detalhada

- Definir exceções específicas do domínio.
- Estruturar respostas HTTP com status apropriado.
- Garantir que erros de regra, catálogo e conflito recebam tratamento consistente.

### Requisito / regra de origem

- Fluxos alternativos e de exceção do UC01

### Escopo e responsabilidades

- Erros de regra de negócio.
- Erro de catálogo inexistente.
- Conflitos de agenda.
- Respostas HTTP do controlador.

### Critérios de aceite

- Erro de antecedência retorna status e mensagem claros.
- Conflito de agenda retorna resposta consistente.
- Serviço inexistente gera mensagem apropriada.

### Dependências

- SUB-02, SUB-03, SUB-04

### Labels sugeridas

`error-handling`, `api`, `backend`

### Responsável

João Pedro Zanette Sartori

### Estado inicial recomendado

`Backlog`

### Evidências esperadas

- Tratamento centralizado de boletins de erro.
- Testes de contrato de erro documentados.

---

## SUB-06 — Definir testes automatizados do UC01

### Objetivo

Validar o comportamento do caso de uso principal e dos cenários negativos para garantir regressão controlada.

### Descrição detalhada

- Criar testes unitários da regra de negócio.
- Criar testes E2E para o endpoint de criação.
- Cobrir o fluxo principal e os principais cenários alternativas.

### Requisito / regra de origem

- UC01 correto funcionamento
- RN01, INV-1 e validação de entrada

### Escopo e responsabilidades

- Testes de unidade do serviço.
- Testes E2E de API.
- Validação de retorno e falhas.

### Critérios de aceite

- Fluxo principal passa no teste.
- Antecedência menor que 24h é rejeitada.
- Conflito de agenda é rejeitado.
- Erro de catálogo é tratado.

### Dependências

- SUB-01 a SUB-05

### Labels sugeridas

`test`, `quality`, `scheduling`

### Responsável

João Pedro Zanette Sartori

### Estado inicial recomendado

`Backlog`

### Evidências esperadas

- suíte de testes executando e passando.
- cenários principais documentados no código.
