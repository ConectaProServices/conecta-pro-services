# Sistema de Agendamento de Serviços (Salão, Clínica, Oficina)

### Responsáveis (Alunos):

* Guilherme Campos Feuser

* Layssa Rodrigues Alves

* João Pedro Zanette Sartori

* **Disciplina:** Desenvolvimento de Sistemas Corporativos

## 📖 Propósito e Contexto

O sistema atua como um marketplace genérico e catálogo centralizado de serviços para pequenos e médios prestadores (salões de beleza, clínicas e oficinas). O objetivo é eliminar o uso de agendas manuais e aplicativos genéricos de mensagens, prevenindo conflitos de horários (*overbooking*) e ausências (*no-shows*) através de um modelo de bloqueio síncrono de horários e governança por avaliação mútua.

## 🚀 Estágio Atual

O projeto encontra-se na fase de **preparação e governança do repositório**. Atualmente, a base documental, a organização das *branches* e a gestão de tarefas (*Issues*) estão configuradas. A API, as conexões com o banco de dados e os contêineres Docker ainda **não** estão configurados ou em funcionamento, existindo apenas no nível do planejamento arquitetural.

## ✂️ Primeiro Slice Escolhido

O recorte inicial de implementação incidirá sobre o **UC01 - Solicitar Agendamento**.
O foco será garantir que o Cliente consiga reservar um horário validando a regra matemática de 24 horas de antecedência (RN01) e efetuando o bloqueio provisório da agenda no sistema para evitar conflitos de simultaneidade (INV-1).

## 💻 Tecnologias Previstas

*Nota: As tecnologias abaixo estão planejadas para a fase de implementação futura, mas **nenhuma está ainda configurada ou em execução no projeto**.*

* **Linguagem / Plataforma:** \[Escreva aqui o que usam, ex: Node.js / TypeScript, Java, C#, etc.\]

* **Banco de Dados:** PostgreSQL

* **ORM:** \[Escreva aqui o que usam, ex: Prisma, TypeORM, Hibernate, Entity Framework\]

* **Infraestrutura:** Docker (para orquestração local do ambiente de desenvolvimento)

## 📂 Organização do Repositório

* `/docs/`: Contém a documentação de arquitetura e do domínio do projeto.

  * 📄 Consultar a [Visão Geral do Sistema](docs/visao-geral.md) para compreender as fronteiras dos *Bounded Contexts*, as regras centrais e as decisões arquiteturais vigentes (ADRs).