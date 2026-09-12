# Gestão de Concursos IFBA

Protótipo estático para gestão de listas de concursos Docente e TAE, demandas, convocações e nomeações.

## Como visualizar

Abra `index.html` em um navegador. Use qualquer e-mail e senha de demonstração para acessar o painel.

## Páginas

- `index.html`: acesso;
- `dashboard.html`: visão geral;
- `docentes.html`: acompanhamento e listas do concurso Docente;
- `tae.html`: acompanhamento e listas do concurso TAE;
- `demandas.html`: acompanhamento das demandas;
- `convocacoes.html`: fluxo de convocação e admissão;
- `cadastros.html`: importação e cadastros administrativos;
- `documentacao.html`: requisitos e diagramas UML;
- `database/schema.sql`: esquema do Supabase, regras de elegibilidade, visões de indicadores e RLS.

## Integração futura

O projeto é apenas a camada visual. A próxima etapa é adicionar o cliente do Supabase, autenticação, banco de dados, Storage para arquivos do DOU e políticas RLS para Administrador, Operador e Leitor.
