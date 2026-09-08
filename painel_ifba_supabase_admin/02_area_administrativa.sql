-- Painel de Avaliação de Cursos do IFBA
-- Migração 02: autenticação, atribuição de responsável e área administrativa
-- Pré-requisito: executar primeiro esquema_supabase_painel_ifba.sql

begin;

-- -----------------------------------------------------------------------------
-- 1. Perfis e atribuição de responsabilidade
-- -----------------------------------------------------------------------------

alter table public.perfis_usuario
  add column if not exists email text,
  add column if not exists ativo boolean not null default true;

alter table public.demandas
  add column if not exists responsavel_usuario_id uuid
    references public.perfis_usuario(usuario_id) on delete set null;

create index if not exists idx_demandas_responsavel_usuario_id
  on public.demandas(responsavel_usuario_id);

create unique index if not exists idx_perfis_usuario_email_unico
  on public.perfis_usuario(lower(email))
  where email is not null;

-- Cria/atualiza o perfil sempre que uma conta é criada no Supabase Auth.
create or replace function public.sincronizar_novo_usuario()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.perfis_usuario (usuario_id, nome, email, papel, ativo)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', new.raw_user_meta_data ->> 'nome', new.email),
    new.email,
    'leitor',
    true
  )
  on conflict (usuario_id) do update
  set nome = coalesce(excluded.nome, public.perfis_usuario.nome),
      email = excluded.email,
      atualizado_em = now();

  return new;
end;
$$;

drop trigger if exists trg_auth_novo_usuario on auth.users;
create trigger trg_auth_novo_usuario
after insert or update of email, raw_user_meta_data on auth.users
for each row execute function public.sincronizar_novo_usuario();

-- Inclui contas criadas antes desta migração.
insert into public.perfis_usuario (usuario_id, nome, email, papel, ativo)
select
  u.id,
  coalesce(u.raw_user_meta_data ->> 'name', u.raw_user_meta_data ->> 'nome', u.email),
  u.email,
  'leitor',
  true
from auth.users as u
on conflict (usuario_id) do update
set nome = coalesce(excluded.nome, public.perfis_usuario.nome),
    email = excluded.email,
    atualizado_em = now();

-- -----------------------------------------------------------------------------
-- 2. Função de autorização exclusiva do administrador
-- -----------------------------------------------------------------------------

create or replace function public.usuario_e_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.perfis_usuario as p
    where p.usuario_id = auth.uid()
      and p.papel = 'admin'
      and p.ativo = true
  );
$$;

revoke all on function public.usuario_e_admin() from public;
revoke all on function public.usuario_e_admin() from anon;
grant execute on function public.usuario_e_admin() to authenticated;

-- Usuários autenticados veem perfis ativos, permitindo identificar quem acompanha
-- cada demanda. Administradores também veem perfis inativos e podem administrar
-- nome, papel, campus e situação do perfil.
drop policy if exists "perfil_leitura_propria" on public.perfis_usuario;
drop policy if exists "perfis_leitura_propria_ou_admin" on public.perfis_usuario;
drop policy if exists "perfis_leitura_autenticada" on public.perfis_usuario;
create policy "perfis_leitura_autenticada"
on public.perfis_usuario for select
to authenticated
using (ativo = true or usuario_id = auth.uid() or public.usuario_e_admin());

drop policy if exists "perfis_atualizacao_admin" on public.perfis_usuario;
create policy "perfis_atualizacao_admin"
on public.perfis_usuario for update
to authenticated
using (public.usuario_e_admin())
with check (public.usuario_e_admin());

grant update (nome, papel, campus_id, ativo)
  on table public.perfis_usuario to authenticated;

-- Nesta versão, todas as operações de cadastro ficam restritas ao admin.
drop policy if exists "campi_escrita_editor" on public.campi;
drop policy if exists "campi_escrita_admin" on public.campi;
create policy "campi_escrita_admin"
on public.campi for all to authenticated
using (public.usuario_e_admin())
with check (public.usuario_e_admin());

drop policy if exists "cursos_escrita_editor" on public.cursos;
drop policy if exists "cursos_escrita_admin" on public.cursos;
create policy "cursos_escrita_admin"
on public.cursos for all to authenticated
using (public.usuario_e_admin())
with check (public.usuario_e_admin());

drop policy if exists "demandas_escrita_editor" on public.demandas;
drop policy if exists "demandas_escrita_admin" on public.demandas;
create policy "demandas_escrita_admin"
on public.demandas for all to authenticated
using (public.usuario_e_admin())
with check (public.usuario_e_admin());

drop policy if exists "movimentacoes_escrita_editor" on public.movimentacoes;
drop policy if exists "movimentacoes_escrita_admin" on public.movimentacoes;
create policy "movimentacoes_escrita_admin"
on public.movimentacoes for all to authenticated
using (public.usuario_e_admin())
with check (public.usuario_e_admin());

-- -----------------------------------------------------------------------------
-- 3. View de leitura usada pelo painel e pela área administrativa
-- -----------------------------------------------------------------------------

drop view if exists public.painel_cursos;

create view public.painel_cursos
with (security_invoker = true)
as
select
  d.id as demanda_id,
  d.codigo as id,
  c.id as curso_id,
  ca.id as campus_id,
  ca.nome as campus,
  c.nome as curso,
  c.nivel,
  c.modalidade,
  d.tipo_demanda,
  d.etapa_atual,
  d.responsavel_atual,
  d.responsavel_usuario_id,
  pu.nome as responsavel_usuario_nome,
  pu.email as responsavel_usuario_email,
  d.processo_sei,
  d.portaria_comissao,
  d.data_portaria,
  mov.entrada_proen,
  mov.saida_proen,
  mov.entrada_campus,
  mov.saida_campus,
  d.situacao_consepe,
  d.data_consepe,
  d.prazo,
  d.prioridade,
  d.progresso,
  d.observacoes,
  d.atualizado_em
from public.demandas as d
join public.cursos as c on c.id = d.curso_id
join public.campi as ca on ca.id = c.campus_id
left join public.perfis_usuario as pu
  on pu.usuario_id = d.responsavel_usuario_id
left join (
  select
    m.demanda_id,
    max(m.data_movimentacao) filter (
      where m.unidade = 'PROEN' and m.tipo = 'Entrada'
    ) as entrada_proen,
    max(m.data_movimentacao) filter (
      where m.unidade = 'PROEN' and m.tipo = 'Saída'
    ) as saida_proen,
    max(m.data_movimentacao) filter (
      where m.unidade = 'Campus' and m.tipo = 'Entrada'
    ) as entrada_campus,
    max(m.data_movimentacao) filter (
      where m.unidade = 'Campus' and m.tipo = 'Saída'
    ) as saida_campus
  from public.movimentacoes as m
  group by m.demanda_id
) as mov on mov.demanda_id = d.id
where d.ativa = true
  and c.ativo = true
  and ca.ativo = true;

comment on view public.painel_cursos is
  'Contrato de leitura do painel, incluindo usuário responsável e identificadores administrativos.';

revoke all on table public.painel_cursos from anon, authenticated;
grant select on table public.painel_cursos to authenticated;

commit;

-- -----------------------------------------------------------------------------
-- PRIMEIRO ADMINISTRADOR
-- Execute o bloco abaixo separadamente, trocando o e-mail.
-- A conta precisa existir em Authentication > Users.
-- -----------------------------------------------------------------------------
-- update public.perfis_usuario
-- set papel = 'admin', ativo = true
-- where lower(email) = lower('seu.email@ifba.edu.br');
