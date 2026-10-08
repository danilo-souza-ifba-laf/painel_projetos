# Protótipo — Diagnóstico dos Cursos IFBA

## Como abrir
1. Extraia todo o ZIP, preservando a pasta `assets`.
2. Abra `index.html` no Chrome, Edge ou Firefox.
3. Escolha um perfil e clique em **Entrar no protótipo**. Coordenador e gestor de campus podem escolher o vínculo demonstrativo.

Nenhuma instalação, compilação, CDN ou acesso à internet é necessário. Se o navegador restringir armazenamento em arquivos locais, sirva a pasta com `python -m http.server 8000` e abra `http://localhost:8000`.

## Arquivos
- `index.html`: acesso demonstrativo e seleção de perfil.
- `diagnostico.html`: quatro dimensões, progresso, formulários, rascunhos e registro de inconsistência. Dados Gerais agora usa um registro compartilhado do campus.
- `campus.html`: formulário completo de Dados Gerais do campus, pré-preenchimento, validação e edição posterior.
- `DADOS_GERAIS_REGRAS.md`: regras, contrato de banco futuro e roteiro de homologação.
- `paineis.html`: indicadores, filtros, dimensões, prioridades, exportação CSV e impressão/PDF pelo navegador.
- `gestao.html`: usuários por grupo, busca, seleção em lote, confirmação de simulação de convite e histórico CSV.
- `assets/styles.css`: aparência e adaptação às telas.
- `assets/app.js`: dados demonstrativos, navegação e comportamento.
- `assets/banner.webp`: recorte do banner fornecido na captura de tela; substituir pelo arquivo original de alta resolução antes da publicação.

## Perfis
| Perfil | Página inicial | Diagnóstico | Painéis | Gestão e envios |
|---|---|---|---|---|
| Administrador PROEN | Gestão | Edição de todos | Institucional | Consulta e simulação |
| Gestor PROEN | Painéis | Consulta | Institucional | Consulta ao histórico |
| Gestor de Campus | Painéis | Edição no campus e validação de Dados Gerais | Campus | Consulta no campus |
| Coordenador de Curso | Diagnóstico | Edição no curso; Dados Gerais somente consulta | Curso | Sem acesso |
| Visualizador | Painéis | Sem acesso | Institucional demonstrativo | Sem acesso |

O visualizador consulta todos os registros fictícios neste protótipo. Em produção, seu escopo deverá ser definido explicitamente.

## Roteiro de validação
- Entre como administrador e simule um convite individual e um lote. Confira o histórico.
- Cancele a confirmação: nenhum registro deve ser criado.
- Busque um termo inexistente: a tabela mostra estado vazio.
- Abra uma dimensão, preencha parcialmente e salve o rascunho. Reabra para conferir.
- Nas dimensões ainda demonstrativas, preencha os três campos e conclua. Para Dados Gerais, siga o roteiro em DADOS_GERAIS_REGRAS.md. O progresso deve atualizar.
- Filtre campus, nível, modalidade e ano nos painéis. Exporte o recorte em CSV.
- Troque para coordenador: apenas seu curso deve aparecer. A URL de gestão deve exibir bloqueio.
- Troque para gestor de campus: apenas os dados do vínculo devem aparecer.
- Troque para gestor PROEN: os formulários ficam em consulta e os envios indisponíveis.
- Confira a interface em celular.

## Dados e limites
Todos os nomes de usuários, e-mails e indicadores são fictícios; e-mails usam `example.org`. Os nomes de cursos/campi exemplificam a organização e não constituem catálogo oficial. Dados Gerais reproduz os campos do PDF fornecido. Os demais formulários permanecem propostas resumidas até o envio dos instrumentos correspondentes. O protótipo não inclui login real, backend, Supabase, envio de e-mail ou exportação XLSX. O PDF usa a impressão do navegador.

Rascunhos, inconsistências e histórico ficam no `localStorage`; a sessão fica no `sessionStorage`. Para zerar, limpe os dados do site no navegador. A busca e os filtros preservam o escopo do perfil. As informações não são sincronizadas entre computadores. Registros de inconsistência geram protocolo local e podem ser inspecionados nos dados do navegador; uma fila de atendimento será necessária em produção.

O controle em JavaScript é exclusivamente demonstrativo e pode ser alterado pelo usuário do navegador. Não usar este pacote para dados pessoais reais. Antes da produção, implementar autenticação e autorização no servidor/RLS, vínculos validados, trilha de auditoria, validação dos formulários, políticas de dados e função segura de envio de links de ativação com expiração e uso único.

## Evolução sugerida
Validar os campos com PROEN e campi, substituir a base demonstrativa por serviços de dados, implementar Supabase Auth e políticas RLS por curso/campus, migrar os formulários reais e integrar a rotina de convites no servidor. A separação entre HTML, CSS e JavaScript facilita a conversão posterior para componentes Angular.

## Verificação realizada
Sintaxe JavaScript verificada com Node. Funções de escopo por perfil, cálculo de progresso e escape de conteúdo verificadas na versão inicial. A atualização de Dados Gerais adicionou testes das regras de permissão, identificação, validação, edição posterior, revalidação e conflitos de versão. A execução visual automatizada não pôde ser concluída porque este ambiente não dispõe de navegador instalado. Use o roteiro acima para homologação da interface e dos fluxos.

## Atualização de Dados Gerais
O novo formulário usa registro por campus/ano e anexos em IndexedDB. A gravação atualiza o registro vigente no navegador. A conexão com banco remoto continua pendente. Gestor da unidade e administrador complementam e validam; coordenadores e gestores PROEN consultam. A identificação administrativa tem edição exclusiva do administrador com justificativa.
