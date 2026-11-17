# 04-03 - Preparação da Branch de Trabalho

## 1. Padrão de Nomenclatura e Vínculo à Issue

- **Issue Vinculada:** SUB-01 (#10) — Modelar e validar o agregado `Scheduling`
- **Padrão Adotado:** `feature/<issue-id>-<descricao-curta>`
- **Nome da Branch:** `feature/10-modelar-agregado-scheduling`
- **Branch Base:** `main` (commit `5cb1f98`)
- **Responsáveis:** Guilherme Campos Feuser (`@WearifulCupid0`) e João Pedro Zanette Sartori (`@JPZS-Git`)

---

## 2. Comandos de Preparação e Sincronização da Branch

### 2.1 Criação da Branch Local
```bash
git switch -c feature/10-modelar-agregado-scheduling
```
*Justificativa:* O comando `git switch -c` cria a branch a partir da `HEAD` da branch atual (`main`) e move o ponteiro de trabalho de forma atômica e segura.

### 2.2 Publicação e Rastreamento Remoto (Upstream)
```bash
git push -u origin feature/10-modelar-agregado-scheduling
```
*Justificativa:* O parâmetro `-u` (ou `--set-upstream`) estabelece o vínculo de rastreamento entre a branch local `feature/10-modelar-agregado-scheduling` e a branch remota `origin/feature/10-modelar-agregado-scheduling`.

---

## 3. Comandos de Verificação e Rastreabilidade Real

### 3.1 Verificação da Branch Ativa
```bash
git branch --show-current
```
**Saída Real do Terminal:**
```text
feature/10-modelar-agregado-scheduling
```

### 3.2 Verificação do Upstream e Rastreamento Remoto
```bash
git branch -vv
```
**Saída Real do Terminal:**
```text
* feature/10-modelar-agregado-scheduling 95a35e3 [origin/feature/10-modelar-agregado-scheduling] Merge branch 'feature/10-modelar-agregado-scheduling' of https://github.com/ConectaProServices/conecta-pro-services into feature/10-modelar-agregado-scheduling
  main                                   5cb1f98 [origin/main] docs: add planejamento operacional
```

---

## 4. Garantia de Isolamento

- A branch `main` permanece intacta e protegida.
- Todo o ciclo TDD (especificação do teste falho, captura de evidência RED e abertura do Draft PR) é executado no escopo exclusivo desta branch de trabalho.
