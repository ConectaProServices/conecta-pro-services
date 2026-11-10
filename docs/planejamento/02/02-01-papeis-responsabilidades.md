# 02-01 - Matriz de Papéis e Responsabilidades

## 1. Contexto

A equipe responsável pelo caso de uso UC01 - Solicitar Agendamento foi identificada como composta por três estudantes, com perfis técnicos centrados em backend Node.js/NestJS, Docker e bancos relacionais.

## 2. Estrutura funcional da equipe

| Integrante | GitHub / contato informado | Função principal | Funções secundárias | Responsabilidades principais | Justificativa técnica |
| --- | --- | --- | --- | --- | --- |
| Layssa Rodrigues Alves | layssa21.alves@gmail.com | Coordenadora | Desenvolvedora backend; revedora de critérios | Acompanhar cronograma, facilitar comunicação, garantir alinhamento do fluxo de trabalho e revisar documentação de tarefas | Apresenta perfil técnico consolidado em NestJS, Docker e TypeScript, sendo adequada para coordenação e acompanhamento da execução |
| João Pedro Zanette Sartori | joaopedrosartori2016@gmail.com | Desenvolvedor backend | Revisor técnico; apoio em validação | Executar a implementação técnica das Sub-Issues atribuídas; revisar critérios de qualidade e aderência à regra de negócio | Perfil técnico em NestJS, Docker e TypeScript, com boa adequação para API, estrutura e validações internas |
| Guilherme Campos Feuser | guilhermefeuser@alunos.utfpr.edu.br | Responsável técnico / Desenvolvedor backend | Coordenador de integração e revisão de arquitetura | Garantir aderência arquitetural, revisar regras de domínio, conduzir validações de persistência e apoio à resolução de conflitos técnicos | Perfil mais completo do grupo, com experiência em NestJS, PostgreSQL, Docker, PNPM e infraestrutura, sendo ideal como referência técnica |

## 3. Papéis formais recomendados

### Coordenador

- Acompanhar prazos e remoção de impedimentos.
- Organizar comunicação geral da equipe.
- Garantir que cada Sub-Issue tenha o responsável e o revisor explícitos.
- Validar se o board e as labels seguem a governança do GitHub.

### Responsável Técnico

- Validar aderência à arquitetura do sistema.
- Resolver dúvidas técnicas com base no caso de uso e no planejamento anterior.
- Confirmar integração entre regras de domínio, API e persistência.
- Apoiar revisão de critérios de aceite antes do início da implementação.

### Desenvolvedor

- Executar a implementação do backlog técnico atribuído.
- Registrar evidências de desenvolvimento e testes relevantes.
- Usar o critério de aceite como referência formal da tarefa.

### Revisor de Issues

- Verificar clareza da especificação, dependências e critérios de aceite.
- Confirmar que a atividade está pronta para execução ou precisa retornar para `Backlog`.
- Validar se a Issue está adequada ao caso de uso e ao escopo do projeto.

## 4. Distribuição funcional por integrante

| Integrante | Papel funcional | Atividades principais sob responsabilidade | Papel de revisão |
| --- | --- | --- | --- |
| Layssa | Coordenadora + desenvolvedora | Sub-Issues de API, contratos e documentação de execução | Revisora das Sub-Issues de domínio e testes |
| João | Desenvolvedor backend | Regras de negócio, tratamento de erro e testes | Revisor das Sub-Issues de API e persistência |
| Guilherme | Responsável técnico + desenvolvedor backend | Modelagem do domínio e integração com persistência | Revisor das Sub-Issues de regra de negócio e API |

## 5. Observações importantes

- A distribuição foi pensada para manter equilíbrio de carga e revisão cruzada.
- A coordenação não implica em permissões administrativas automáticas no repositório.
- O papel funcional e a permissão do GitHub são elementos distintos e devem continuar separados ao longo do projeto.
- O perfil técnico da equipe permite revisão cruzada sem dependência exclusiva de um único membro.
