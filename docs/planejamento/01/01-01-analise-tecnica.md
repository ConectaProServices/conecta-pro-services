# 01-01 - Análise Técnica do Caso de Uso

## Informações gerais

- Projeto: Sistema de Agendamento de Serviços (Salão, Clínica, Oficina)
- Caso de uso selecionado: UC01 - Solicitar Agendamento
- Código do caso de uso: UC01
- Repositório base: `conecta-pro-services-backend`
- Stack prevista: NestJS + TypeScript + PostgreSQL + TypeORM + Docker
- Documento de origem: [visao-geral.md](../visao-geral.md), [BASE_TECNICA_UC01.md](../tmp_desenv_corporativo/Desenvolvimento-Sistema-Corporativo-main/BASE_TECNICA_UC01.md)

## 1. Identificação e título do caso de uso

- Título: Solicitar Agendamento
- Objetivo: permitir que um cliente reserve um horário em um serviço ofertado por um prestador, validando disponibilidade, antecedência mínima e ausência de conflito de agenda.

## 2. Objetivo e escopo

O caso de uso tem como objetivo principal garantir a criação de uma intenção de agendamento em um momento válido, com o bloqueio temporário da agenda e a persistência do pedido em estado inicial. O escopo funcional abrange:

- escolha do prestador e do serviço;
- validação ex ante da data e hora solicitada;
- verificação da existência de conflito na agenda do prestador;
- criação do agendamento com status inicial pendente;
- registro das informações necessárias para a continuidade do fluxo de aprovação.

## 3. Atores envolvidos e papéis

| Ator | Papel | Observação |
| --- | --- | --- |
| Cliente | Usuário que busca e solicita agendamento | É o principal ator do caso de uso |
| Prestador | Responsável por disponibilidade e confirmação | Também participa indiretamente via regra de disponibilidade e aprovação |
| Sistema | Valida regras, persiste e responde ao cliente | Executa a lógica de negócio e a persistência |
| Serviço de catálogo | Fonte de dados do serviço solicitado | Verifica se o serviço existe e retorna a duração |

## 4. Pré-condições e pós-condições

### Pré-condições

- O cliente não deve estar bloqueado por regra de governança ou penalidade do sistema.
- O serviço informado deve existir no catálogo ativo.
- O prestador deve possuir disponibilidade para o intervalo proposto.
- O cliente e o prestador não devem ser a mesma pessoa ou perfil de usuário no mesmo agendamento.

### Pós-condições

- O agendamento é salvo com status inicial `PENDING`.
- O intervalo solicitado fica bloqueado provisoriamente para evitar sobreposição.
- O sistema responde ao cliente com o identificador do agendamento e os dados do compromisso.

## 5. Síntese dos fluxos

### Fluxo principal

1. O cliente informa `customerId`, `serviceId`, `professionalId` e `startsAt`.
2. O sistema valida se o serviço existe.
3. O sistema calcula o horário de término com base na duração do serviço.
4. O sistema verifica se a data e hora atendem à antecedência mínima.
5. O sistema verifica sobreposição na agenda do prestador.
6. O sistema cria o agendamento em status pendente.
7. O sistema persiste a entidade e devolve o resultado ao cliente.

### Fluxos alternativos

- A data informada está menos de 24 horas à frente: falha de regra (RN01).
- Já existe uma reserva ativa do mesmo prestador sobreposta ao intervalo solicitado: falha de concorrência (INV-1).
- O serviço informado não existe no catálogo: retorno de erro de catálogo inexistente.

### Fluxo de exceção

- Requisição com dados inválidos (ex.: UUID mal formatado, campo ausente, data nula).
- Falha de persistência do banco de dados.
- Conflito de concorrência entre múltiplas solicitações simultâneas.

## 6. Regras de negócio e validações

### Regras de negócio identificadas

- RN01: antecedência mínima de 24 horas para solicitar o agendamento.
- RN03: um cliente não pode manter mais de um agendamento ativo na mesma data.
- RN05: o cliente e o prestador não podem ser a mesma pessoa no mesmo agendamento.
- INV-1: reservas ativas do mesmo prestador não podem apresentar janelas de tempo sobrepostas.

### Validações do caso de uso

- `customerId`, `serviceId`, `professionalId` devem ser UUID válidos.
- `startsAt` deve ser informado e compatível com o tipo `Date`.
- O serviço deve existir e estar ativo no catálogo.
- O início do agendamento deve respeitar o mínimo de 24h.
- O intervalo deve ser livre para o prestador.

## 7. Componentes e camadas arquiteturais envolvidas

- Camada de apresentação: controller/entrada HTTP e DTO de validação.
- Camada de aplicação: `SchedulingService` e orquestração do caso de uso.
- Camada de domínio: entidade `Scheduling`, regras de agregação e status.
- Camada de persistência: repositório e ORM entity.
- Camada de catalogo/serviço: consulta de serviço e duração.

## 8. Considerações arquiteturais preliminares

- O caso de uso é o primeiro slice do backend e representa a base do módulo de agendamento.
- A lógica central está no serviço de agenda, com validação de conflito e cálculo de intervalo final.
- A separação entre serviço e agendamento é pertinente para evitar acoplamento do catálogo à transação de reserva.
- O modelo de data/hora deve ser tratado com timezone consistente para evitar inconsistência entre cliente e banco.

## 9. Restrições e dúvidas levantadas

### Requisitos documentados

- O fluxo de agendamento exige validação de antecedência e sobreposição.
- O serviço precisa ser validado como existente antes do agendamento.
- O agendamento gera uma intenção pendente e bloqueia o horário provisionalmente.

### Propostas técnicas / hipóteses

- A assinatura do endpoint pode seguir o padrão `POST /schedulings`.
- A persistência do agendamento pode seguir a estrutura já prevista em `SchedulingEntity` e `SchedulingRepository`.
- O cálculo do fim do agendamento deve considerar a duração do serviço em minutos.
- O comportamento de concorrência pode ser tratado com checagem em transação ou com lock de consulta, conforme validação futura.

## 10. Conclusão

O UC01 é o fluxo central de valor do sistema e deve ser tratado como primeiro slice de implementação. A implementação deve priorizar consistência do domínio, validação de regra de negócio e persistência correta do agendamento pendente, mantendo acoplamento baixo entre catálogo, domínio e infraestrutura.
