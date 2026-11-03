# 02-02 - Matriz de Permissões do GitHub

## 1. Premissas

A matriz abaixo aplica o princípio do menor privilégio e distingue:

- papel funcional na equipe;
- permissão necessária no repositório GitHub;
- nível de acesso no GitHub Project.

> A recomendação de permissão é de governança. A efetivação real das permissões depende do administrador do repositório e do proprietário do projeto.

## 2. Níveis de permissão do GitHub

- `Read`: acompanhamento e leitura do repositório.
- `Triage`: gestão de Issues e Discussions sem poder de push direto em código.
- `Write`: desenvolvimento diário, abertura de branches e pull requests.
- `Maintain`: gestão de branches protegidas, automações e configuração de fluxo sem acesso completo de administração.
- `Admin`: controle avançado do repositório, permissões e configuração geral.

## 3. Matriz recomendada

| Integrante | Papel funcional | Operações práticas no repositório | Permissão recomendada | Nível no GitHub Project | Justificativa técnica e de segurança |
| --- | --- | --- | --- | --- | --- |
| Layssa Rodrigues Alves | Coordenadora | Acompanhar Issues, comentar em tarefas, criar branches locais, abrir PRs e revisar tarefas do board | `Write` | `Write` | Necessária para gerenciar fluxo de trabalho sem conceder acesso administrativo completo |
| João Pedro Zanette Sartori | Desenvolvedor backend | Implementar, testar localmente, abrir PRs e acompanhar Issues | `Write` | `Write` | Acesso adequado para desenvolvimento sem exposição indevida de configurações do projeto |
| Guilherme Campos Feuser | Responsável técnico | Validar arquitetura, revisar PRs, acompanhar Issues, apoiar combinações de branch e configuração de automações | `Maintain` | `Write` | Mantém autonomia de gestão operacional sem conceder acesso de administração total, respeitando o princípio do menor privilégio |

## 4. Observações de governança

- Nenhum integrante foi recomendado com `Admin` nesta etapa, pois não é necessário para a execução do planejamento e do desenvolvimento inicial do UC01.
- O `Read` pode ser usado para estudantes que apenas acompanham o progresso do projeto sem participar da implementação.
- O `Triage` deve ser considerado em cenários de revisão de Issues, mas não é o nível mínimo recomendado para desenvolvedores ativos.
- O GitHub Project pode ter nível de acesso diferente do nível do repositório; recomenda-se que o board seja administrado por quem precisa acompanhar workflow e não necessariamente por quem tem acesso de código.

## 5. Conclusão

A recomendação de permissões busca equilibrar autonomia de execução, segurança e responsabilidade. A equipe está organizada para desenvolver o primeiro slice sem conceder direitos administrativos desnecessários ao repositório.
