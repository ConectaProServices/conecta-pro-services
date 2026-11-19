# 11-07 - Verificação da API Containerizada

## 1. Ambiente

Verificado em 19/11/2026:

```text
conecta-api        Up
conecta-postgres   Up (healthy)
0.0.0.0:3000->3000/tcp
0.0.0.0:5435->5432/tcp
```

Os logs confirmaram o mapeamento de `POST /schedulings` e a inicialização da API.

## 2. Política aplicada

O contêiner foi reconstruído com `docker compose up -d --build api`; a imagem anterior não foi usada como evidência.

## 3. Reconstrução realizada

Quando o Docker estiver disponível, executar:

```bash
docker compose up -d --build api
docker compose ps
docker compose logs api
```

## 4. Requisições pendentes

Executado contra `http://localhost:3000/schedulings`:

- Payload válido: `201 Created`, com os oito campos públicos.
- Payload com `extraField`: `201 Created`; o campo não aparece na resposta.
- `{}`: `400 Bad Request`, com 8 mensagens de validação.
- Campo vazio/tipo errado: `400 Bad Request`, com mensagens do `ValidationPipe`.
- Cliente igual ao prestador: `500 Internal Server Error` com resposta genérica. Esse cenário permanece pendente de definição da Issue responsável.

## 5. Consulta PostgreSQL pendente

O usuário executou uma consulta read-only em `scheduling.schedulings`, mas a saída compartilhada foi apenas `-- (1 row)` e não demonstrou os valores da linha. Portanto, a persistência do identificador HTTP não é considerada confirmada por essa consulta. O banco `conecta_dev` também não existia neste contêiner no momento da tentativa; o banco de testes `conecta_test` foi criado em separado para a suíte de integração.

## 6. Conclusão

A proteção do contrato foi comprovada no teste HTTP local e na API reconstruída. A consulta SQL permanece inconclusiva. Posteriormente, `pnpm test:integration` foi executado com banco e usuário de testes dedicados: 5/5 aprovados.
