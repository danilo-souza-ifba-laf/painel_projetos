# Painel de Avaliação de Cursos do IFBA — versão HTML

## Arquivos

- `index.html`: estrutura do painel;
- `styles.css`: estilos e responsividade;
- `data.js`: base local alinhada à aba `Listas`, utilizada quando nenhuma API está configurada;
- `app.js`: filtros, indicadores, detalhamento e conexão à API;
- `Code.gs`: API para publicar os registros de `Cursos` e as opções da aba `Listas`.

## Uso local

Mantenha os arquivos Web na mesma pasta e abra `index.html` no navegador. Como a base local fica em `data.js`, não é necessário iniciar um servidor para testar.

## Conexão com o Google Sheets

1. Importe a planilha-base disponibilizada junto ao protótipo para o Google Sheets.
2. Acesse **Extensões → Apps Script**.
3. Substitua o conteúdo de `Code.gs` pelo código deste pacote.
4. Selecione **Implantar → Nova implantação → Aplicativo da Web**.
5. Defina a forma de execução e o acesso conforme a política institucional.
6. Copie a URL terminada em `/exec`.
7. No painel, selecione **Conectar API**, cole a URL e sincronize.

Para produção, valide as regras de acesso e a exposição dos dados antes de tornar o aplicativo Web público.

## Segmentação EPTNM e Superior

O painel lê a coluna `nivel` e classifica os registros em dois grupos:

- `EPTNM`: valores como `EPTNM - Integrado`, `EPTNM - Concomitante`, `EPTNM - Subsequente` e `EPTNM - EJA`;
- `Superior`: valores como `Superior - Bacharelado`, `Superior - Licenciatura` e `Superior - Tecnologia`.

O seletor geral atualiza os indicadores, a distribuição por etapa, os filtros e a tabela, mantendo uma interface direta organizada pelas três abas: `Todos`, `EPTNM` e `Superior`.
