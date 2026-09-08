-- Painel de Avaliação de Cursos do IFBA
-- Esquema inicial para Supabase/PostgreSQL
--
-- Execução: Supabase Dashboard > SQL Editor > New query > Run.
-- O esquema preserva o contrato atual do painel por meio da view
-- public.painel_cursos, que devolve os mesmos 21 campos da planilha.

begin;

-- -----------------------------------------------------------------------------
-- 1. Função comum de auditoria
-- -----------------------------------------------------------------------------

create or replace function public.atualizar_data_modificacao()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- 2. Estrutura principal
-- -----------------------------------------------------------------------------

create table if not exists public.campi (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  constraint campi_nome_nao_vazio check (btrim(nome) <> ''),
  constraint campi_nome_unico unique (nome)
);

create table if not exists public.cursos (
  id uuid primary key default gen_random_uuid(),
  campus_id uuid not null references public.campi(id)
    on update cascade on delete restrict,
  nome text not null,
  nivel text not null,
  modalidade text not null default 'Presencial',
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  constraint cursos_nome_nao_vazio check (btrim(nome) <> ''),
  constraint cursos_nivel_nao_vazio check (btrim(nivel) <> ''),
  constraint cursos_modalidade_nao_vazia check (btrim(modalidade) <> ''),
  constraint cursos_identidade_unica unique (campus_id, nome, nivel, modalidade)
);

create table if not exists public.demandas (
  id uuid primary key default gen_random_uuid(),
  codigo text not null,
  curso_id uuid not null references public.cursos(id)
    on update cascade on delete restrict,
  tipo_demanda text not null,
  etapa_atual text not null default 'Mapeamento inicial',
  responsavel_atual text not null default 'Campus',
  processo_sei text not null,
  portaria_comissao text,
  data_portaria date,
  situacao_consepe text not null default 'Não encaminhado',
  data_consepe date,
  prazo date,
  prioridade text not null default 'Média',
  progresso smallint not null default 0,
  observacoes text,
  ativa boolean not null default true,
  criado_por uuid references auth.users(id) on delete set null,
  atualizado_por uuid references auth.users(id) on delete set null,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  constraint demandas_codigo_nao_vazio check (btrim(codigo) <> ''),
  constraint demandas_codigo_unico unique (codigo),
  constraint demandas_tipo_nao_vazio check (btrim(tipo_demanda) <> ''),
  constraint demandas_etapa_nao_vazia check (btrim(etapa_atual) <> ''),
  constraint demandas_responsavel_nao_vazio check (btrim(responsavel_atual) <> ''),
  constraint demandas_processo_nao_vazio check (btrim(processo_sei) <> ''),
  constraint demandas_prioridade_valida check (prioridade in ('Alta', 'Média', 'Baixa')),
  constraint demandas_progresso_valido check (progresso between 0 and 100)
);

create table if not exists public.movimentacoes (
  id bigint generated always as identity primary key,
  demanda_id uuid not null references public.demandas(id)
    on update cascade on delete cascade,
  unidade text not null,
  tipo text not null,
  data_movimentacao date not null,
  observacao text,
  criado_por uuid references auth.users(id) on delete set null,
  criado_em timestamptz not null default now(),
  constraint movimentacoes_unidade_valida
    check (unidade in ('Campus', 'PROEN', 'CONSEPE')),
  constraint movimentacoes_tipo_valido
    check (tipo in ('Entrada', 'Saída')),
  constraint movimentacoes_sem_duplicidade
    unique (demanda_id, unidade, tipo, data_movimentacao)
);

-- O papel é administrado pelo responsável do sistema, nunca pelo próprio usuário.
create table if not exists public.perfis_usuario (
  usuario_id uuid primary key references auth.users(id) on delete cascade,
  nome text,
  papel text not null default 'leitor',
  campus_id uuid references public.campi(id) on delete set null,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  constraint perfis_papel_valido check (papel in ('leitor', 'editor', 'admin'))
);

-- -----------------------------------------------------------------------------
-- 3. Índices
-- -----------------------------------------------------------------------------

create index if not exists idx_cursos_campus_id
  on public.cursos(campus_id);

create index if not exists idx_demandas_curso_id
  on public.demandas(curso_id);

create index if not exists idx_demandas_etapa_atual
  on public.demandas(etapa_atual);

create index if not exists idx_demandas_responsavel_atual
  on public.demandas(responsavel_atual);

create index if not exists idx_demandas_prazo
  on public.demandas(prazo);

create index if not exists idx_demandas_processo_sei
  on public.demandas(processo_sei);

create index if not exists idx_movimentacoes_demanda_data
  on public.movimentacoes(demanda_id, data_movimentacao desc);

create index if not exists idx_perfis_usuario_campus_id
  on public.perfis_usuario(campus_id);

-- -----------------------------------------------------------------------------
-- 4. Triggers de atualização
-- -----------------------------------------------------------------------------

drop trigger if exists trg_campi_atualizado_em on public.campi;
create trigger trg_campi_atualizado_em
before update on public.campi
for each row execute function public.atualizar_data_modificacao();

drop trigger if exists trg_cursos_atualizado_em on public.cursos;
create trigger trg_cursos_atualizado_em
before update on public.cursos
for each row execute function public.atualizar_data_modificacao();

drop trigger if exists trg_demandas_atualizado_em on public.demandas;
create trigger trg_demandas_atualizado_em
before update on public.demandas
for each row execute function public.atualizar_data_modificacao();

drop trigger if exists trg_perfis_usuario_atualizado_em on public.perfis_usuario;
create trigger trg_perfis_usuario_atualizado_em
before update on public.perfis_usuario
for each row execute function public.atualizar_data_modificacao();

-- -----------------------------------------------------------------------------
-- 5. Autorização de editores e administradores
-- -----------------------------------------------------------------------------

create or replace function public.usuario_pode_editar()
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
      and p.papel in ('editor', 'admin')
  );
$$;

revoke all on function public.usuario_pode_editar() from public;
revoke all on function public.usuario_pode_editar() from anon;
grant execute on function public.usuario_pode_editar() to authenticated;

-- -----------------------------------------------------------------------------
-- 6. Row Level Security (RLS)
-- Padrão adotado: leitura apenas para usuários autenticados e escrita apenas
-- para quem possui papel editor ou admin em public.perfis_usuario.
-- -----------------------------------------------------------------------------

alter table public.campi enable row level security;
alter table public.cursos enable row level security;
alter table public.demandas enable row level security;
alter table public.movimentacoes enable row level security;
alter table public.perfis_usuario enable row level security;

drop policy if exists "campi_leitura_autenticada" on public.campi;
create policy "campi_leitura_autenticada"
on public.campi for select
to authenticated
using (true);

drop policy if exists "campi_escrita_editor" on public.campi;
create policy "campi_escrita_editor"
on public.campi for all
to authenticated
using (public.usuario_pode_editar())
with check (public.usuario_pode_editar());

drop policy if exists "cursos_leitura_autenticada" on public.cursos;
create policy "cursos_leitura_autenticada"
on public.cursos for select
to authenticated
using (true);

drop policy if exists "cursos_escrita_editor" on public.cursos;
create policy "cursos_escrita_editor"
on public.cursos for all
to authenticated
using (public.usuario_pode_editar())
with check (public.usuario_pode_editar());

drop policy if exists "demandas_leitura_autenticada" on public.demandas;
create policy "demandas_leitura_autenticada"
on public.demandas for select
to authenticated
using (true);

drop policy if exists "demandas_escrita_editor" on public.demandas;
create policy "demandas_escrita_editor"
on public.demandas for all
to authenticated
using (public.usuario_pode_editar())
with check (public.usuario_pode_editar());

drop policy if exists "movimentacoes_leitura_autenticada" on public.movimentacoes;
create policy "movimentacoes_leitura_autenticada"
on public.movimentacoes for select
to authenticated
using (true);

drop policy if exists "movimentacoes_escrita_editor" on public.movimentacoes;
create policy "movimentacoes_escrita_editor"
on public.movimentacoes for all
to authenticated
using (public.usuario_pode_editar())
with check (public.usuario_pode_editar());

drop policy if exists "perfil_leitura_propria" on public.perfis_usuario;
create policy "perfil_leitura_propria"
on public.perfis_usuario for select
to authenticated
using (usuario_id = auth.uid());

-- -----------------------------------------------------------------------------
-- 7. View compatível com app.js e com as 21 colunas da aba Cursos
-- security_invoker faz a view respeitar as permissões e o RLS das tabelas-base.
-- -----------------------------------------------------------------------------

drop view if exists public.painel_cursos;

create view public.painel_cursos
with (security_invoker = true)
as
select
  d.codigo as id,
  ca.nome as campus,
  c.nome as curso,
  c.nivel,
  c.modalidade,
  d.tipo_demanda,
  d.etapa_atual,
  d.responsavel_atual,
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
  d.observacoes
from public.demandas as d
join public.cursos as c on c.id = d.curso_id
join public.campi as ca on ca.id = c.campus_id
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
  'Contrato de leitura do Painel de Avaliação de Cursos do IFBA.';

-- -----------------------------------------------------------------------------
-- 8. Privilégios da API
-- -----------------------------------------------------------------------------

revoke all on table public.campi from anon, authenticated;
revoke all on table public.cursos from anon, authenticated;
revoke all on table public.demandas from anon, authenticated;
revoke all on table public.movimentacoes from anon, authenticated;
revoke all on table public.perfis_usuario from anon, authenticated;
revoke all on table public.painel_cursos from anon, authenticated;

grant select, insert, update, delete on table public.campi to authenticated;
grant select, insert, update, delete on table public.cursos to authenticated;
grant select, insert, update, delete on table public.demandas to authenticated;
grant select, insert, update, delete on table public.movimentacoes to authenticated;
grant select on table public.perfis_usuario to authenticated;
grant select on table public.painel_cursos to authenticated;
grant usage, select on all sequences in schema public to authenticated;

commit;

-- -----------------------------------------------------------------------------
-- PRIMEIRO ADMINISTRADOR (execute separadamente após criar o usuário em Auth)
-- Troque o e-mail e retire os dois hífens do início das linhas.
-- -----------------------------------------------------------------------------
-- insert into public.perfis_usuario (usuario_id, nome, papel)
-- select id, coalesce(raw_user_meta_data ->> 'name', email), 'admin'
-- from auth.users
-- where email = 'seu.email@ifba.edu.br'
-- on conflict (usuario_id) do update
-- set papel = excluded.papel,
--     nome = excluded.nome;

-- -----------------------------------------------------------------------------
-- OPÇÃO DE PAINEL PÚBLICO, SEM LOGIN (não execute por enquanto)
-- Se essa opção for adotada, as quatro tabelas-base ficam legíveis pela API.
-- Escrita continuará bloqueada para visitantes anônimos.
-- -----------------------------------------------------------------------------
-- create policy "campi_leitura_publica" on public.campi
--   for select to anon using (true);
-- create policy "cursos_leitura_publica" on public.cursos
--   for select to anon using (true);
-- create policy "demandas_leitura_publica" on public.demandas
--   for select to anon using (true);
-- create policy "movimentacoes_leitura_publica" on public.movimentacoes
--   for select to anon using (true);
-- grant select on table public.campi, public.cursos, public.demandas,
--   public.movimentacoes, public.painel_cursos to anon;
