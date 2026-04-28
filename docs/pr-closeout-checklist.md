# Checklist Operacional: Closeout de Issue Vinculada a PR

Este documento define o fluxo obrigatario para fechar ou mover issues vinculadas a Pull Requests no NutriAI. Aplica-se a todo agente tecnico (CTO, Senior Fullstack Engineer, Mid-level Fullstack Engineer) antes de transitar uma issue para `in_review`, `done`, ou ao recuperar uma issue stranded.

## Motivacao

Incidente [LUC-17](/LUC/issues/LUC-17): uma issue foi movida para `in_review` e recebeu handoff de reviewer quando o PR remoto ja estava mergeado. O checkout local estava desatualizado e foi tratado como source of truth, prolongando um fluxo stale sem necessidade.

## Regra de decisao

```
PR remoto ja mergeado? → Issue vai para done (com comentario citando PR, commit e data)
PR remoto nao mergeado? → in_review e' apropriado (revisao pre-merge ou handoff pendente)
Nao sabe? → Verifique remotamente ANTES de decidir (veja passo 1)
```

## Checklist (executar em ordem)

### 1. Verificar estado remoto do PR

**Nunca** decidir o status da issue baseando-se apenas no checkout local. O checkout local pode estar desatualizado (`git fetch` pendente ou branch local atrasada).

Opcoes de verificacao remota (escolher uma):

```bash
# Opcao A: GitHub CLI (preferida)
gh pr view <PR_NUMBER> --json state,mergedAt,mergeCommit --jq '{state,mergedAt,mergeCommit}'

# Opcao B: git ls-remote (quando gh nao disponivel)
git fetch origin
git log --oneline origin/main -5  # comparar com o branch do PR

# Opcao C: API GitHub direta
curl -s https://api.github.com/repos/EvanderLucena/nutriai/pulls/<PR_NUMBER> | jq '{state,merged,merged_at,merge_commit_sha}'
```

### 2. Classificar o estado

| Estado remoto | Acao na issue | Status Paperclip | Comentario obrigatorio |
| --- | --- | --- | --- |
| PR mergeado | Fechar imediatamente | `done` | Citar PR #, commit hash e data de merge |
| PR aberto, sem conflitos | Handoff para revisao | `in_review` | Indicar que o PR esta aberto e quem revisa |
| PR aberto, com conflitos ou checks falhando | Manter em execucao | `in_progress` | Descrever bloqueio e proxima acao |
| PR fechado sem merge | Reavaliar escopo | `in_progress` ou `blocked` | Explicar motivo do fechamento e caminho alternativo |
| Sem PR vinculado | Seguir fluxo normal | Conforme escopo | Sem requisito adicional |

### 3. Sincronizar checkout local (se PR mergeado)

```bash
git fetch origin
git checkout main
git pull origin main
```

Isso evita trabalhar sobre branches ja mergeadas e previne decisoes baseadas em estado local stale.

### 4. Redigir comentario final da issue

Todo comentario final de closeout **deve** conter:

```md
## Status: <done|in_review|in_progress|blocked>

- **O que mudou**: <descricao concisa da entrega ou bloqueio>
- **PR/Commit**: <#PR ou hash do commit de merge, quando aplicavel>
- **Data de merge**: <quando o PR foi mergeado no GitHub, quando aplicavel>
- **Proxima acao**: <o que acontece depois, ou "nenhuma" se conclusivo>
- **Owner**: <quem executa a proxima acao>
```

### 5. Recuperacao de issue stranded

Ao recuperar uma issue em estado stranded (sem heartbeat, sem atividade):

1. **Primeiro**: executar passo 1 (verificar estado remoto do PR vinculado)
2. Se o PR ja foi mergeado: fechar a issue como `done` (passo 2)
3. Se o PR nao foi mergeado: investigar motivo do travamento, atualizar comentario e retomar execucao
4. **Nunca** mover para `in_review` sem verificacao remota previa

## Diferenciacao critica: repo local vs estado remoto

| Cenario | Sintoma no checkout local | Estado real | Acao correta |
| --- | --- | --- | --- |
| Repo local desatualizado | Branch do PR aparece ativa; `git log` nao mostra merge | PR ja mergeado no GitHub | `git fetch` + fechar issue como `done` |
| PR remoto nao mergeado | Branch do PR aparece ativa; remoto confirma aberto | PR aberto | `in_review` ou `in_progress` conforme estado |
| PR mergeado e local sincronizado | Branch mesclada visivel em `git log origin/main` | PR ja mergeado | Fechar issue como `done` |

**Regra absoluta**: o estado remoto (GitHub) e' o source of truth. O checkout local e' apenas um cache que pode estar desatualizado.

## Exemplo de comentario final (PR ja mergeado)

```md
## Status: done

- **O que mudou**: implementacao de sanitizacao de inputs numericos em AddFoodModal e FoodsView
- **PR/Commit**: PR #52, commit aacd3ab
- **Data de merge**: 2026-04-28
- **Proxima acao**: nenhuma (entrega completa)
- **Owner**: n/a
```

## Exemplo de comentario final (PR aberto, aguardando revisao)

```md
## Status: in_review

- **O que mudou**: refactor de PatientView para remover fallback ANA
- **PR/Commit**: PR #55 (aberto, aguardando aprovacao CI)
- **Data de merge**: pendente
- **Proxima acao**: aguardar resultado do CI + merge
- **Owner**: Senior Fullstack Engineer
```

## Referencias

- Incidente raiz: [LUC-17](/LUC/issues/LUC-17) — analise de causa raiz do gap entre merge de PR e estado Paperclip
- Issue que codificou este checklist: [LUC-18](/LUC/issues/LUC-18)
- Matriz de roteamento tecnico: `docs/technical-routing-matrix.md`