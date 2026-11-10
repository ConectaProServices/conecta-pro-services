# 01-06 - Matriz de Dependências

| Atividade | Atividade pré-requisito | Justificativa técnica da dependência | Condição de desbloqueio necessária | Possibilidade de execução em paralelo |
| --- | --- | --- | --- | --- |
| SUB-01 | Nenhuma | A modelagem do domínio é a base para DTOs, regras e persistência | Validação do aggregate e status do agendamento | Não |
| SUB-02 | SUB-01 | O endpoint precisa refletir os campos e validações do aggregate | DTO e controller definidos e aprovados | Sim, parcialmente, com a elaboração dos testes iniciais |
| SUB-03 | SUB-01, SUB-02 | A regra de negócio depende da entidade e da entrada do cliente | Entidade e contrato de entrada estarem estáveis | Não |
| SUB-04 | SUB-01, SUB-03 | A persistência deve refletir a regra de negócio e o aggregate | Agendamento definido e regras validadas | Sim, parcialmente, se o modelo de dados estiver confirmado |
| SUB-05 | SUB-02, SUB-03, SUB-04 | Tratamento de erro depende do contrato e da persistência | Regras e estrutura de resposta definidas | Sim, parcialmente, durante a revisão final |
| SUB-06 | SUB-01 a SUB-05 | Os testes exigem o fluxo completo estabilizado | Fluxo funcional e tratamento de erro definidos | Sim, com a definição dos cenários em paralelo |

## Critérios de desbloqueio

- SUB-01 desbloqueia os demais itens, pois determina a forma do domínio.
- SUB-02 e SUB-03 devem convergir para a regra principal da resolução do caso de uso.
- SUB-04 só deve seguir depois da regra de negócio e da entidad do domínio estarem consolidadas.
- SUB-06 representa a validação final e pode começar com cenários em paralelo à conclusão, mas depende do fluxo funcional principal para execução estável.

## Observação de paralelismo

A implementação do projeto pode realizar certa sobreposição de trabalho entre:

- modelagem e DTOs;
- testes de contrato e estrutura de erro;
- persistência e organização da base final do módulo.

Contudo, a execução plena da regra de negócio deve permanecer sequencial para preservar a consistência do domínio.
