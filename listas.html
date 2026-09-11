<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Documentação | Concursos IFBA</title><link rel="stylesheet" href="assets/css/style.css"><script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script></head><body><div class="shell"><aside class="sidebar" data-nav></aside><main class="content doc">
<header class="page-header"><div><p class="eyebrow">DOCUMENTAÇÃO</p><h1>Requisitos e modelo do sistema</h1><p class="muted">Especificação funcional inicial para implementação com Supabase.</p></div></header>
<section class="panel"><h2>Escopo</h2><p>Gerenciar listas dos concursos Docente e TAE, demandas institucionais, convocações sequenciais, admissão e nomeações no DOU.</p><h3>Perfis e permissões</h3><table><thead><tr><th>Ação</th><th>Administrador</th><th>Operador</th><th>Leitor</th></tr></thead><tbody><tr><td>Demandas e listas</td><td>Gerencia</td><td>Consulta</td><td>Consulta</td></tr><tr><td>Convocações e admissão</td><td>Gerencia</td><td>Gerencia</td><td>Consulta histórico</td></tr><tr><td>Usuários e parâmetros</td><td>Gerencia</td><td>—</td><td>—</td></tr></tbody></table></section>
<section class="panel"><h2>Regras essenciais</h2><ol><li>Listas são separadas por concurso, área/cargo e modalidade AC, PP ou PcD.</li><li>A convocação utiliza exclusivamente o primeiro candidato elegível pela posição atual.</li><li>Final de fila move o candidato à última posição da mesma lista; desistência o torna inelegível.</li><li>Nomeação no DOU bloqueia novas convocações e exige arquivo da publicação e campus definitivo.</li><li>Uma demanda pode conter vagas de mais de uma cota e indicar múltiplos campi previstos.</li></ol></section>
<section class="panel"><h2>Diagrama de casos de uso</h2><pre class="mermaid">flowchart LR
  A[Administrador] --> D[Gerir demandas]
  A --> L[Importar e gerir listas]
  A --> C[Gerir convocações]
  O[Operador] --> C
  Lr[Leitor] --> H[Consultar histórico]
  C --> H
  C --> N[Registrar nomeação DOU]
</pre></section>
<section class="panel"><h2>Modelo de domínio</h2><pre class="mermaid">erDiagram
  CONCURSO ||--o{ AREA_CARGO : possui
  AREA_CARGO ||--o{ CANDIDATO : classifica
  CANDIDATO ||--o{ MOVIMENTACAO : registra
  DEMANDA ||--o{ ITEM_DEMANDA : detalha
  ITEM_DEMANDA ||--o{ CONVOCACAO : origina
  CANDIDATO ||--o{ CONVOCACAO : recebe
  CONVOCACAO ||--o| NOMEACAO_DOU : resulta
  CAMPUS ||--o{ NOMEACAO_DOU : destino
</pre></section>
<section class="panel"><h2>Entidades Supabase</h2><p><code>profiles</code>, <code>concursos</code>, <code>areas_cargos</code>, <code>candidatos</code>, <code>movimentacoes_candidato</code>, <code>demandas</code>, <code>demanda_campi</code>, <code>itens_demanda</code>, <code>convocacoes</code>, <code>nomeacoes_dou</code>, <code>campi</code> e <code>importacoes_listas</code>.</p></section>
</main></div><script src="assets/js/app.js"></script></body></html>
