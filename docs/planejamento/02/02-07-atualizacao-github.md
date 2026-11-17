# 02-07 - Plano de Atualização do GitHub

## 1. Objetivo

Orientar a equipe a aplicar no repositório GitHub a organização de papéis, revisão cruzada, comentários técnicos e controle de prontidão das Sub-Issues.

## 2. Procedimento operacional

### Passo 1 — Conferência de integridade

- Verificar a existência da Issue principal `[UC01] Solicitar Agendamento`.
- Validar se todas as Sub-Issues planejadas aparecem no repositório.
- Garantir que os identificadores `SUB-01` a `SUB-06` permaneçam preservados.

### Passo 2 — Atualização de assignees

- Atribuir os responsáveis com base na matriz de distribuição.
- Definir o revisor para cada issue em um campo apropriado ou em comentário inicial da atividade.

### Passo 3 — Registro de revisores

- Garantir que cada Sub-Issue seja revisada por alguém diferente do assignee.
- O comentário técnico deve conter o nome do revisor e a data da revisão.

### Passo 4 — Publicação de comentários

- Inserir os comentários do Artefato 05 em cada Issue.
- O comentário deve indicar claramente: objetivos, dependências, avaliação e status final recomendado.

### Passo 5 — Ajustes de descrição

- Revisar critérios de aceite e escopo quando a análise indicar ajuste.
- Registrar mudanças no texto da Issue em vez de criar nova atividade de planejamento.

### Passo 6 — Governança do board

- Manter apenas os 5 estados do fluxo acadêmico:
  - `Backlog`
  - `Ready`
  - `In Progress`
  - `In Review`
  - `Done`
- Não criar labels de status, e.g., `status:ready`. O campo `Status` do GitHub Project é o responsável por esse controle.
- Considerar `Ready` somente para issues que cumpram todos os critérios de DoR após revisão humana.

### Passo 7 — Auditoria final do board

- Verificar se cada Sub-Issue tem responsável, revisor e status correto.
- Confirmar que a equipe não iniciou implementação sem vínculo claro com o caso de uso.
- Registrar pendências finais para o próximo ciclo.

## 3. Recomendação de execução

O ideal é que a equipe siga nesta ordem:

1. atribuição de assignees;
2. revisão cruzada;
3. publicação dos comentários;
4. avaliação da DoR;
5. promoção para `Ready`.

## 4. Conclusão

Com a aplicação do plano acima, a equipe terá o GitHub alinhado com a governança acadêmica e pronto para a etapa de desenvolvimento do UC01 sem perder rastreabilidade e clareza de responsabilidades.
