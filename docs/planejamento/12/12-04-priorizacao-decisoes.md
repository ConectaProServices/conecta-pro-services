# 12-04 - Priorização e Decisões

As prioridades abaixo são julgamento técnico qualitativo, não métricas calculadas.

| Achado | Evidência / impacto | Risco e benefício | Esforço / cobertura | Decisão |
| --- | --- | --- | --- | --- |
| A-02: RN05 chega como 500 | Teste HTTP containerizado anterior observou 500; exceção não está no mapa de status | Contrato de erro inesperado para regra conhecida; corrigir traz status previsível; regressão localizada | Baixo; há teste integrado e Issue #14 prevê contratos de erro | Encaminhar para #14 e solicitar decisão da equipe; sem alteração nesta auditoria |
| A-01: tipo `any` do Repository | Warning lint; permite acessar estado privado e retornar tipo sem contrato | Pode ocultar erro de domínio e romper encapsulamento; tipagem melhora segurança | Baixo a médio; testes do Service e integração cobrem adapter | Recomendar ajuste futuro coordenado: `Scheduling | null`, usar `getStatus()` e definir retorno de `confirmScheduling`; não alterar sem aprovação |
| A-03: Service recebe DTO HTTP | Import e assinatura observados em `scheduling.service.ts` | Mudança do transporte pode repercutir na aplicação; não há falha atual | Médio; exige atualizar chamadas e testes | Investigar quando houver segundo transporte/consumidor; preservar por ora |
| A-04: catálogo em memória no módulo ativo | `SERVICE_CATALOG` aponta para `InMemoryServiceCatalog`, com entrada demo | Funcionalidade depende de catálogo embutido, não de catálogo integrado; pode não refletir dados reais | Dependência de módulo/catálogo de serviços; fluxo atual tem testes | Registrar como limitação de integração e alinhar com planejamento do catálogo, não substituir por mock alternativo |
| A-05: nome do DTO vs. caminho | Arquivo diz `confirm-schedule`, classe diz `RequestSchedulingResponseDto` | Navegação confusa, sem risco runtime demonstrado | Baixo, mas cosmético | Preservar; não renomear apenas para estética |

## Decisão geral

Preservar a arquitetura do UC01 nesta etapa. Não existe aprovação de equipe para uma refatoração; #14 é o destino provável do contrato de erro RN05, e #12/#15 continuam cobrindo regra/testes. A documentação não deve ser interpretada como autorização para alterar essas Issues.
