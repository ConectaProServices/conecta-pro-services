# Visão Geral do Sistema: Agendamento de Serviços

## 1. O Problema e o Contexto
Pequenos e médios prestadores de serviços (salões de beleza, clínicas e oficinas mecânicas) utilizam agendas manuais e aplicativos genéricos. Essa dinâmica informal gera conflitos de horários, sobreposição de marcações (*overbooking*), ausências sem aviso prévio (*no-shows*) e a total inexistência de um histórico centralizado de reputação. 

O sistema atua como um marketplace e gerenciador de agendas, resolvendo essas dores através de bloqueios matemáticos de tempo e governança por avaliação mútua.

## 2. Conceitos do Domínio e Regras Centrais
O sistema unifica os atores na entidade **Usuário** (que assume os papéis de *Cliente* ou *Prestador*). 

A operação principal é protegida pelas seguintes regras e conceitos de domínio:
* **Conceitos Principais:** `Agendamento` (Entidade / Raiz de Agregação), `Agenda` (Entidade de Disponibilidade), `Serviço` (Fotografia / Objeto de Valor) e `JanelaDeTempo`.
* **Regra Central (RN01):** Um agendamento exige antecedência mínima de 24 horas.
* **Invariante Crítica (INV-1):** O sistema não permite que duas reservas pendentes ou confirmadas para o mesmo Prestador possuam janelas de tempo que se sobreponham.

## 3. Decisões Arquiteturais e Fronteiras
* **ADR-001 (Monólito Modular):** O projeto adota arquitetura monolítica separada em camadas e contextos (Agendamento, Disponibilidade, Catálogo, Avaliação e Identidade).
* **ADR-002 (Bloqueio Síncrono):** Para proteger a INV-1, o contexto de *Agendamento* comunica-se de forma síncrona com o contexto de *Disponibilidade* para bloquear provisoriamente o horário no exato momento do registro da solicitação.

## 4. O Primeiro Slice
O trabalho de implementação foca estritamente no núcleo transacional do sistema.
* **Caso de Uso Selecionado:** UC01 - Solicitar Agendamento.
* **Objetivo:** Garantir que o Cliente consiga reservar um horário de forma validada, gerando um bloqueio na agenda do Prestador.
* **Limites do Recorte:** O slice abrange a recepção da requisição, a coordenação da aplicação, a obtenção do snapshot do serviço no catálogo, a aplicação da regra de 24h (RN01), o bloqueio na agenda (INV-1) e a persistência do status *Pendente*. 
* **Fora do Recorte:** Aprovação posterior pelo prestador, expiração por timeout, envio de notificações externas e registro de avaliações.

---