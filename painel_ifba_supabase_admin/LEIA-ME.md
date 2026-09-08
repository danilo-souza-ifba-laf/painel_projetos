# Painel de Avaliação de Cursos do IFBA — Supabase

O projeto agora utiliza o Supabase diretamente no navegador. O Google Sheets e o `Code.gs` não são mais necessários para o funcionamento do painel.

## Páginas

- `login.html`: autenticação de leitores, editores e administradores;
- `index.html`: painel de consulta, disponível para usuários autenticados e ativos;
- `admin.html`: cadastro e edição, exclusivo para o perfil `admin`.

## 1. Preparar o banco

No **SQL Editor** do Supabase, execute nesta ordem:

1. `esquema_supabase_painel_ifba.sql` — esquema principal criado na etapa anterior;
2. `02_area_administrativa.sql` — usuários responsáveis, perfis, políticas e view administrativa.

Se o primeiro esquema já foi executado, execute apenas o segundo arquivo.

## 2. Criar os usuários

1. No Supabase, acesse **Authentication → Users**.
2. Use **Add user** para cadastrar a conta do administrador.
3. No final de `02_area_administrativa.sql`, copie o bloco “PRIMEIRO ADMINISTRADOR”.
4. Substitua o e-mail e execute o comando no SQL Editor.

Novas contas recebem automaticamente o papel `leitor`. A atribuição inicial de `admin` deve ser feita no SQL Editor. Não use uma chave secreta no navegador para criar usuários.

## 3. Configurar a conexão

No painel do Supabase, copie:

- a **Project URL**;
- a chave **Publishable** (`sb_publishable_...`). Em projetos antigos, a chave `anon` também funciona.

Edite somente o arquivo `supabase-config.js`:

```javascript
window.IFBA_SUPABASE_CONFIG = Object.freeze({
  url: "https://IDENTIFICADOR.supabase.co",
  publishableKey: "sb_publishable_SUA_CHAVE"
});
```

Nunca coloque nesse arquivo a chave `sb_secret_...`, `service_role` ou a senha do banco.

## 4. Publicar ou testar

Mantenha todos os arquivos na mesma pasta e publique-os em uma hospedagem HTTPS. Para teste local, utilize um servidor Web local; o arquivo de entrada é `login.html`.

## Fluxo da área administrativa

1. Entre em `login.html` com uma conta `admin`.
2. Acesse **Administração** no painel.
3. Cadastre o campus e o curso pelos botões `+`, caso ainda não existam.
4. Preencha a demanda e selecione o usuário responsável.
5. Salve a demanda.
6. Selecione a demanda na lista e registre entradas e saídas no bloco **Histórico**.

O formulário permite editar demandas existentes e arquivá-las. O arquivamento é lógico: os dados permanecem no banco, mas deixam de aparecer na view `painel_cursos`.

## Perfis

- `leitor`: consulta o painel;
- `editor`: perfil reservado para uma futura área de manutenção limitada;
- `admin`: consulta, cadastra, edita, arquiva e atribui responsáveis.

O usuário atribuído à demanda precisa existir em **Authentication → Users** e estar ativo em `perfis_usuario`.
