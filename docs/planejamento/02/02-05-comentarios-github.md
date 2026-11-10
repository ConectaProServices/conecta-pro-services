# 02-05 - Comentários Técnicos para o GitHub

## 1. Comentário padrão de revisão

> ### 📋 Registro de Revisão de Planejamento
>
> **Revisor:** @[usuario_github]
> **Issue:** [SUB-XX] - [Título da Sub-Issue]
> **Data da Revisão:** [DD/MM/AAAA]
> **Resultado:** [ ] Aprovada sem ressalvas | [ ] Aprovada com ajustes menores | [ ] Ajustes necessários solicitados
>
> **Observações Técnicas:**
> - Verificação do objetivo e do escopo da atividade;
> - Análise de dependências e critérios de aceite;
> - Confirmação da aderência ao caso de uso UC01.
>
> **Ajustes Solicitados:**
> - [Ajustes a serem aplicados, se houver]
>
> **Conclusão e Prontidão:**
> - [Issue liberada para `Ready` ou mantida em `Backlog` até ajuste] 

## 2. Comentários específicos por Sub-Issue

### SUB-01 — Modelar e validar o agregado `Scheduling`

```markdown
### 📋 Registro de Revisão de Planejamento

**Revisor:** @[revisor]  
**Issue:** [SUB-01] - Modelar e validar o agregado `Scheduling`  
**Data da Revisão:** [DD/MM/AAAA]  
**Resultado:** [ ] Aprovada sem ressalvas | [ ] Aprovada com ajustes menores | [ ] Ajustes necessários solicitados

**Observações Técnicas:**
- O objetivo da tarefa está claramente definido e está alinhado ao caso de uso UC01.
- O aggregate `Scheduling` deve manter status inicial, dados de cliente, prestador, serviço e intervalo de execução.
- Recomenda-se confirmar as regras RN03 e RN05 no texto do issue para evitar ambiguidades futuras.

**Ajustes Solicitados:**
- Registrar explicitamente as regras de negócio que validam a estrutura do aggregate.

**Conclusão e Prontidão:**
- A Issue pode ser promovida para `Ready` após revisão humana e confirmação dos critérios complementares.
```

### SUB-02 — Definir DTO de entrada e endpoint HTTP de criação

```markdown
### 📋 Registro de Revisão de Planejamento

**Revisor:** @[revisor]  
**Issue:** [SUB-02] - Definir DTO de entrada e endpoint HTTP de criação  
**Data da Revisão:** [DD/MM/AAAA]  
**Resultado:** [ ] Aprovada sem ressalvas | [ ] Aprovada com ajustes menores | [ ] Ajustes necessários solicitados

**Observações Técnicas:**
- O escopo está bem delimitado para API e validação de entrada.
- Os campos necessários já estão alinhados ao caso de uso.
- O endpoint deve refletir exatamente a operação de criação do agendamento.

**Ajustes Solicitados:**
- Confirmar a rota implementada e a resposta final do serviço.

**Conclusão e Prontidão:**
- A Issue pode ser promovida para `Ready` após a confirmação final do contrato HTTP.
```

### SUB-03 — Implementar regra de negócio de solicitação

```markdown
### 📋 Registro de Revisão de Planejamento

**Revisor:** @[revisor]  
**Issue:** [SUB-03] - Implementar regra de negócio de solicitação  
**Data da Revisão:** [DD/MM/AAAA]  
**Resultado:** [ ] Aprovada sem ressalvas | [ ] Aprovada com ajustes menores | [ ] Ajustes necessários solicitados

**Observações Técnicas:**
- A atividade centraliza a regra de negócio do UC01.
- Os critérios de antecedência mínima e conflito de agenda estão alinhados ao planejamento técnico.
- Recomenda-se que a regra de validação do catálogo seja explicitamente descrita no item de execução.

**Ajustes Solicitados:**
- Detalhar a ordem de validação do catálogo, da janela temporal e da persistência.

**Conclusão e Prontidão:**
- A Issue deve permanecer em `Backlog` até a revisão humana confirmar a ordem correta de validação.
```

### SUB-04 — Implementar persistência do agendamento

```markdown
### 📋 Registro de Revisão de Planejamento

**Revisor:** @[revisor]  
**Issue:** [SUB-04] - Implementar persistência do agendamento  
**Data da Revisão:** [DD/MM/AAAA]  
**Resultado:** [ ] Aprovada sem ressalvas | [ ] Aprovada com ajustes menores | [ ] Ajustes necessários solicitados

**Observações Técnicas:**
- A tarefa está bem delimitada e depende diretamente das regras do aggregate do agendamento.
- O modelo relacional precisa refletir claramente o estado e os campos temporais do agendamento.
- Recomendação de revisão: validar o mapping do TypeORM e o status persistido.

**Ajustes Solicitados:**
- incluir o schema do banco e a forma de armazenamento do estado do agendamento.

**Conclusão e Prontidão:**
- A Issue deve seguir em `Backlog` até a validação técnica final do mapeamento.
```

### SUB-05 — Implementar tratamento de exceções e contratos de erro

```markdown
### 📋 Registro de Revisão de Planejamento

**Revisor:** @[revisor]  
**Issue:** [SUB-05] - Implementar tratamento de exceções e contratos de erro  
**Data da Revisão:** [DD/MM/AAAA]  
**Resultado:** [ ] Aprovada sem ressalvas | [ ] Aprovada com ajustes menores | [ ] Ajustes necessários solicitados

**Observações Técnicas:**
- A atividade está bem vinculada ao caso de uso e aos fluxos alternativos.
- A definição de resposta HTTP deve seguir padrão consistente para falha de regra e conflito de agenda.

**Ajustes Solicitados:**
- Definir explicitamente os códigos de status esperados para cada tipo de erro.

**Conclusão e Prontidão:**
- A Issue pode seguir para `Ready` após confirmação do contrato de resposta e revisão humana.
```

### SUB-06 — Definir testes automatizados do UC01

```markdown
### 📋 Registro de Revisão de Planejamento

**Revisor:** @[revisor]  
**Issue:** [SUB-06] - Definir testes automatizados do UC01  
**Data da Revisão:** [DD/MM/AAAA]  
**Resultado:** [ ] Aprovada sem ressalvas | [ ] Aprovada com ajustes menores | [ ] Ajustes necessários solicitados

**Observações Técnicas:**
- Os cenários propostos cobrem o fluxo principal e as regras críticas do caso de uso.
- A atividade depende da estabilidade do serviço e da persistência para que os testes se tornem confiáveis.

**Ajustes Solicitados:**
- Explicitar os testes mínimos obrigatórios para cada regra do UC01.

**Conclusão e Prontidão:**
- A Issue pode ser movida para `Backlog` até que o fluxo principal esteja estável e a revisão humana confirme a cobertura mínima.
```
