# Diagnóstico dos Cursos IFBA — Etapa 1 · v1.1

Pacote inicial de autenticação e aprovação de acesso. HTML, CSS e JavaScript separados, sem compilação. A imagem enviada está em `assets/telalogin2.png`.

## Atualização v1.1 — campus e cursos

**Se já instalou a versão anterior:** execute somente `supabase/03_campi_cursos.sql` no SQL Editor, uma vez, e substitua os arquivos do site pelos desta versão. Preserve sua URL e chave pública em `js/config.js`. Não execute novamente o arquivo 01 nem o 02.

**Se está começando agora:** execute `01_schema.sql` e depois `03_campi_cursos.sql`, antes do cadastro inicial. Cadastre o primeiro administrador selecionando **Reitoria**, confirme seu e-mail e autorize-o pelo arquivo `02_primeiro_admin.sql`.

No index, o administrador encontrará **Campi e cursos**. Cadastre primeiro as unidades e depois cada curso, indicando campus e nível (Técnico ou Superior). Não foram inventadas listas de cursos: elas serão preenchidas por você. Reitoria é a única unidade inicial para permitir o primeiro cadastro administrativo.

No formulário de solicitação:

- Campus/unidade é obrigatório para todos os perfis.
- Curso é obrigatório somente para Coordenadores de Cursos Técnicos e Coordenadores de Cursos Superiores.
- A lista filtra cursos ativos pelo campus escolhido e pelo nível do perfil.
- Ao trocar campus ou perfil, o curso é limpo para evitar vínculo incorreto.
- Sem curso disponível, o coordenador deve solicitar seu cadastro à administração; não há campo livre.

O painel de aprovação mostra os vínculos e permite ajustá-los antes de aprovar. O banco rejeita aprovação ou novo cadastro com curso de outro campus/nível, curso inativo ou unidade inativa. Indeferir uma solicitação não exige preencher vínculos ausentes.

Os registros anteriores permanecem intactos, com campus/curso vazios. Para pendentes, o administrador preenche os vínculos ao aprovar. Para usuários já aprovados, a regularização nesta versão deve ser feita pelo responsável no SQL Editor, após conferir o vínculo; não há tela de edição de usuários aprovados. Não houve reclassificação automática.

Desativar campus/curso remove a opção das novas solicitações, preservando vínculos e acesso já concedidos. O catálogo de nomes, níveis e identificadores é público para preencher o formulário antes do login; dados pessoais continuam protegidos. Apenas administradores aprovados podem inserir ou alterar os catálogos. Exclusão não é permitida pelo frontend. Cada usuário ainda possui um campus/unidade e, quando coordenador, um curso.

### Verificações adicionais no Supabase

1. Cadastrar dois campi e cursos técnicos/superiores em cada um.
2. Verificar que cada coordenador vê apenas cursos do campus e nível escolhidos.
3. Trocar campus/perfil e verificar que a seleção de curso é descartada.
4. Desativar curso/unidade e verificar que não aparece em novas solicitações.
5. Tentar manipular a requisição para selecionar curso de outro campus/nível: o banco deve recusar.
6. Tentar cadastrar curso com conta comum: as políticas devem negar.
7. Aprovar uma solicitação antiga preenchendo campus/curso.

## O que funciona após configurar o Supabase

- Login real por e-mail e senha; não utiliza senha do SUAP.
- Solicitação com nome completo, CPF com verificação dos dígitos, SIAPE opcional (7 dígitos), e-mail e um dos cinco perfis.
- Criação e confirmação de senha (mínimo 12 caracteres) e confirmação de e-mail.
- Cadastro nasce pendente, sem perfil autorizado, mesmo ao solicitar Administrador.
- Página `index.html` mostra a identidade autenticada, situação, perfil solicitado e perfil autorizado.
- Administrador aprovado pode listar, aprovar e indeferir solicitações. CPF completo fica disponível somente ao titular e aos administradores aprovados.
- Recuperação de senha por e-mail, saída da sessão e tema claro/escuro.
- Regras RLS e permissões de banco impedem alteração direta de perfil e leitura de cadastros de terceiros.
- Mudanças de situação/perfil são registradas em `access_audit`.

## 1. Criar o banco

Use preferencialmente um projeto Supabase novo dedicado ao diagnóstico. No **SQL Editor**, execute `supabase/01_schema.sql` e depois `supabase/03_campi_cursos.sql`, cada um uma única vez. O script cria tabelas, tipos, funções, políticas e um trigger de cadastro. A transação desfaz tudo se houver erro. Não é uma migração para projeto que já possua essas estruturas.

O trigger exige os dados do formulário para cada novo usuário. Por isso, faça os cadastros pela página `solicitar-acesso.html`, inclusive o primeiro administrador. Criar usuários manualmente no painel Auth sem os metadados obrigatórios falhará; provedores sociais e convites ainda não estão implementados.

## 2. Conectar os arquivos

Em configurações do projeto, copie a **Project URL** e a chave **Publishable** (`sb_publishable_...`) ou a chave pública legada **anon**. Edite `js/config.js`:

```js
window.APP_CONFIG = {
  supabaseUrl: 'https://SEU-PROJETO.supabase.co',
  supabaseKey: 'SUA_CHAVE_PUBLICA',
};
```

A chave pública é própria para o navegador; a proteção depende das permissões e políticas do SQL. Nunca coloque `service_role`, `sb_secret_...`, senha de banco ou token administrativo no frontend.

## 3. Configurar autenticação e e-mails

Em Authentication, habilite cadastro com e-mail/senha e mantenha **Confirm email** habilitado. Configure senha mínima de 12 caracteres. Em URL Configuration:

- Site URL local: `http://localhost:8000`
- Redirect URLs: `http://localhost:8000/index.html` e `http://localhost:8000/redefinir-senha.html`
- Na hospedagem, cadastre os endereços HTTPS equivalentes, incluindo subpasta se houver.

Configure SMTP próprio para enviar e-mails aos usuários reais. O envio de teste padrão do Supabase tem restrições de destinatários e limites. Verifique limites de envio e controles contra abuso antes de divulgar o formulário; CAPTCHA pode ser integrado em etapa posterior, mas ainda não existe neste pacote. Não desative a confirmação de e-mail para contornar restrições de envio.

## 4. Abrir localmente

Extraia o ZIP, abra um terminal na pasta `diagnostico-ifba` e execute:

```sh
python -m http.server 8000
```

No Windows também pode usar `py -m http.server 8000`. Abra `http://localhost:8000/login.html`. Não utilize apenas duplo clique em arquivo `file://` para testar os links de autenticação. O SDK Supabase é carregado do jsDelivr e exige internet; está fixado na versão 2.57.4. Para ambiente institucional restrito, hospede essa mesma distribuição localmente e atualize as tags script.

## 5. Criar o primeiro administrador

1. Abra Solicitar acesso e cadastre seus dados, escolhendo Administrador.
2. Confirme o e-mail recebido.
3. Abra `supabase/02_primeiro_admin.sql`, substitua o e-mail de exemplo pelo e-mail cadastrado e execute no SQL Editor.
4. Entre em `login.html`. O index deve mostrar Administrador e a lista de solicitações.

O primeiro administrador é autorizado por uma operação administrativa no banco. Nenhum usuário ganha esse perfil apenas por selecioná-lo no formulário. Nas aprovações seguintes, o administrador verifica os dados e escolhe o perfil; o banco também exige e-mail confirmado. Não há notificação automática de aprovação nesta etapa: o solicitante consulta sua situação ao entrar novamente.

## Perfis iniciais

| Código | Perfil |
| --- | --- |
| administrador | Administrador |
| coordenador_tecnico | Coordenadores de Cursos Técnicos |
| coordenador_superior | Coordenadores de Cursos Superiores |
| diretor | Diretores Gerais e de Ensino |
| equipe_curriculos | Equipe de Construção dos Currículos |

Cada pessoa possui um perfil autorizado nesta etapa. Direção Geral e Direção de Ensino integram o mesmo perfil, conforme solicitado. Acúmulo de funções e permissões dos formulários de diagnóstico serão modelados nas etapas seguintes. Os vínculos de campus e curso já constam nesta versão. Ainda não existe acesso a dados de cursos.

## Organização

- `login.html`: autenticação e solicitação de recuperação.
- `solicitar-acesso.html`: cadastro e solicitação de perfil.
- `redefinir-senha.html`: troca de senha pelo link recebido.
- `index.html`: teste de acesso e aprovação administrativa.
- `css/style.css`: estilos, temas e responsividade.
- `js/config.js`: parâmetros públicos do projeto.
- `js/common.js`: cliente Supabase, validação e utilitários.
- `js/login.js`, `request.js`, `reset.js`, `dashboard.js`: comportamento por página.
- `supabase/01_schema.sql`: instalação do banco.
- `supabase/02_primeiro_admin.sql`: autorização inicial.
- `supabase/03_campi_cursos.sql`: migração de campus/cursos, validação e novas permissões.
- `js/catalog.js`: carregamento e filtragem dos catálogos.

## Segurança e limites concretos

A interface nunca usa `user_metadata` para conceder acesso. No cadastro, os dados fornecidos em metadata são copiados pelo trigger para `profiles`, com status pendente e perfil autorizado nulo. Alterações posteriores de metadata não alteram essa tabela. Os dados de identificação também permanecem nos metadados privados da própria conta Auth: considere ambas as localizações nas rotinas institucionais de correção, retenção e exclusão. Não há consulta pública de CPF nem CPF na URL. Uma exclusão em Auth remove o perfil; o histórico preserva os UUIDs para auditoria.

A sessão persiste no navegador até sair ou expirar; em computador compartilhado, use Sair ao terminar. A página de status é acessível a qualquer pessoa autenticada, inclusive pendente, para acompanhar sua solicitação. Isso não libera os futuros módulos. As futuras tabelas do diagnóstico precisarão de políticas próprias para exigir aprovação e limitar campus/curso; a proteção de página sozinha não basta.

A função administrativa `review_access` também aceita `bloqueado`, mas o painel inicial oferece somente aprovação/indeferimento das pendências. Gestão de contas aprovadas, recurso contra indeferimento, múltiplos perfis e edição dos dados cadastrais ficam para a próxima etapa.

## Roteiro de homologação no seu projeto

1. Testar cada um dos cinco perfis com contas de e-mail que você controla.
2. Confirmar que senha incorreta falha e e-mail não confirmado não entra.
3. Confirmar que pendente vê só a situação, sem administração.
4. Aprovar um coordenador e verificar o perfil no index após novo login.
5. Solicitar Administrador em outra conta: deve continuar sem privilégios até aprovação.
6. Como usuário comum, tentar ler outros perfis, alterar `approved_role`, inserir perfil diretamente ou chamar `review_access`: o banco deve negar.
7. Confirmar que o administrador não pode alterar seu próprio perfil pela função.
8. Testar aprovação antes de confirmar e-mail: deve ser recusada.
9. Testar recuperação de senha, link expirado, logout e acesso direto ao index sem sessão.
10. Testar telas estreitas, teclado, tema escuro e aprovação com dois administradores.

Validações locais: sintaxe dos arquivos JavaScript e casos de CPF válido/inválido. A execução do SQL, as políticas com usuários reais, o SMTP e a autenticação ponta a ponta dependem do seu projeto Supabase e não foram executados nesta entrega.

## Documentação de referência

- https://supabase.com/docs/guides/auth/managing-user-data
- https://supabase.com/docs/guides/database/postgres/row-level-security
- https://supabase.com/docs/reference/javascript/auth-signup
- https://supabase.com/docs/reference/javascript/auth-resetpasswordforemail
