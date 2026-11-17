# 06-02 - Avaliação da Necessidade de Refatoração

## Escopo avaliado

Foram inspecionados `Scheduling.request()`, o teste da entidade, as exceções de agendamento existentes e `DomainHttpExceptionFilter`. A linha de base em `06-01-diagnostico-green.md` confirma 4/4 testes focados e 11/11 testes na suíte.

## Avaliação de qualidade

| Critério | Evidência | Classificação |
| --- | --- | --- |
| Clareza e nomenclatura | A comparação direta entre `customerId` e `professionalId` é clara; a nova exceção merece nome próprio, seguindo as exceções existentes | Oportunidade concreta |
| Coesão | A invariável RN05 está aplicada no método de criação do agregado, na camada de domínio | Adequado |
| Duplicação | Não foi observada lógica duplicada no trecho avaliado | Sem problema comprovado |
| Complexidade | A guarda introduz uma condição simples, sem complexidade desnecessária | Adequado |
| Limites arquiteturais | A validação está na entidade, sem dependência de HTTP ou persistência | Adequado |
| Manutenibilidade | O erro genérico dificulta identificar e tratar RN05 especificamente; já existe um arquivo placeholder vazio no PR | Problema estrutural localizado |
| Testabilidade | O teste atual valida a rejeição e a mensagem; pode permanecer inalterado para preservar a observação existente | Adequado |
| Contratos | A resposta HTTP depende do filtro global; alterar o mapeamento para 400 mudaria comportamento observável e não será incluído nesta refatoração | Limite de escopo |

## Distinção de escopo

- **Refatoração desta etapa:** substituir o `Error` genérico por uma exceção específica de domínio, preservando a mensagem e o fluxo de rejeição existente.
- **Não incluído:** mapear a exceção no filtro HTTP para `400 Bad Request`. Isso altera o contrato HTTP atual e deve ser tratado como uma decisão funcional/API separada, com critério de aceite e teste próprios.
- **Não identificado:** bug novo ou nova regra além da RN05.

## Decisão técnica

**Cenário A — Refatoração necessária e recomendada, com escopo mínimo.** A exceção genérica representa a violação de uma regra específica e o arquivo dedicado já está presente, porém vazio. Implementá-lo como uma classe de exceção com nome explícito, importá-lo no agregado e manter a mensagem existente melhora a tipagem e a legibilidade sem alterar o critério de aceite nem adicionar mapeamento HTTP.

## Riscos e ações

1. Preservar literalmente a mensagem atual para manter compatibilidade com a asserção existente.
2. Não alterar o filtro HTTP durante esta refatoração; seu comportamento atual para erros não mapeados permanece inalterado.
3. Executar novamente o teste focado e a suíte completa após a mudança.
4. Manter o PR Draft: não há review humana nem autorização formal de merge.
