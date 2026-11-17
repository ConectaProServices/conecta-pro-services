# 05-06 - Análise Preliminar de Qualidade e Débitos Técnicos

## 1. Diagnóstico de Qualidade do Código GREEN

- **Componente Avaliado:** `Scheduling` (`src/modules/scheduling/entities/scheduling.entity.ts`)
- **Método Avaliado:** `Scheduling.request()`
- **Objetivo da Análise:** Mapear débitos técnicos e oportunidades de melhoria arquitetural para o **Material 06 (Fase REFACTOR do TDD)** sem violar a cadência do ciclo atual.

---

## 2. Pontos Fortes da Implementação Atual

1. **Baixo Acoplamento:** A regra de integridade foi colocada dentro da entidade de domínio raiz (`Scheduling`), evitando vazamento de lógica de negócio para DTOs ou controllers.
2. **Fail-Fast:** A verificação de participantes inválidos é executada logo na primeira linha do método estático, economizando processamento antes de calcular diferenças de datas ou instanciar objetos.
3. **Clareza e Simplicidade:** O código utiliza comparação direta `props.customerId === props.professionalId`, com legibilidade imediata e complexidade ciclomática mínima (incremento de apenas 1 ponto).
4. **Segurança de Regressão:** Todos os testes unitários e de integração existentes continuam passando sem impactos adversos.

---

## 3. Oportunidades de Melhoria e Débitos Técnicos Identificados

### 3.1 Tratamento e Tipagem de Exceções
- **Situação Atual:** O código dispara um erro genérico `new Error("Cliente e prestador não podem ser a mesma pessoa.")`.
- **Oportunidade no REFACTOR:** Substituir por uma classe de exceção fortemente tipada (ex.: `SameParticipantSchedulingException` estendendo `DomainException`), garantindo consistência com `SchedulingTooSoonException` e facilitando a captura no filtro HTTP.

### 3.2 Padronização de Mensagens e Internacionalização
- **Situação Atual:** Mensagem em português chumbada (*hardcoded*) no corpo do método.
- **Oportunidade no REFACTOR:** Centralizar as mensagens de violação de invariantes em um catálogo de constantes ou mensagens do domínio de agendamento.

### 3.3 Mapeamento no Filtro Global de Erros HTTP
- **Situação Atual:** O filtro `domain-http-exception.filter.ts` trata exceções específicas já registradas.
- **Oportunidade no REFACTOR:** Assegurar que a exceção de autoagendamento seja traduzida para o status HTTP `400 Bad Request` com código de erro específico (`SCHEDULING_SAME_PARTICIPANT`).

---

## 4. Backlog Priorizado para a Fase REFACTOR (Material 06)

| Prioridade | Item de Refatoração | Descrição | Risco |
| :---: | :--- | :--- | :---: |
| **1** | Tipagem da Exceção | Criar `SameParticipantSchedulingException` e usá-la no método | Baixo |
| **2** | Integração com Exception Filter | Mapear a exceção de domínio no filtro HTTP para resposta REST padronizada | Baixo |
| **3** | Enriquecimento de Testes de Borda | Adicionar teste validando se a exceção tipada é capturada com o código de status correto | Baixo |

> ⚠️ **Diretriz TDD:** Nenhuma das melhorias acima foi aplicada nesta fase para manter a pureza e isolamento estrito da fase GREEN. Elas serão conduzidas sob proteção dos testes no Material 06.
