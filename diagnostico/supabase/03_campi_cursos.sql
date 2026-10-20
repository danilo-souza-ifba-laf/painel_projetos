-- Atualização v1.1: executar UMA VEZ após 01_schema.sql.
-- Preserva cadastros existentes; vínculos antigos ficam nulos até preenchimento.
begin;
create table public.campuses (
 id uuid primary key default gen_random_uuid(),
 name text not null check(char_length(trim(name)) between 2 and 120),
 active boolean not null default true
);
create unique index campuses_name_unique on public.campuses(lower(trim(name)));
create table public.courses (
 id uuid primary key default gen_random_uuid(),
 campus_id uuid not null references public.campuses(id),
 name text not null check(char_length(trim(name)) between 2 and 200),
 level text not null check(level in ('tecnico','superior')),
 active boolean not null default true
);
create unique index courses_name_unique on public.courses(campus_id,level,lower(trim(name)));
alter table public.profiles add column campus_id uuid references public.campuses(id);
alter table public.profiles add column course_id uuid references public.courses(id);
alter table public.access_audit add column old_campus_id uuid;
alter table public.access_audit add column new_campus_id uuid;
alter table public.access_audit add column old_course_id uuid;
alter table public.access_audit add column new_course_id uuid;
alter table public.campuses enable row level security;
alter table public.courses enable row level security;
revoke all on public.campuses,public.courses from anon,authenticated;
grant select on public.campuses,public.courses to anon,authenticated;
grant insert on public.campuses,public.courses to authenticated;
-- Impede mudar o campus/nível de um curso já vinculado; cadastre outra oferta.
grant update(name,active) on public.campuses,public.courses to authenticated;
-- Catálogo institucional sem dados pessoais, acessível antes do login.
create policy campus_public on public.campuses for select to anon,authenticated using(true);
create policy course_public on public.courses for select to anon,authenticated using(true);
create policy campus_admin_insert on public.campuses for insert to authenticated with check(public.is_access_admin());
create policy campus_admin_update on public.campuses for update to authenticated using(public.is_access_admin()) with check(public.is_access_admin());
create policy course_admin_insert on public.courses for insert to authenticated with check(public.is_access_admin());
create policy course_admin_update on public.courses for update to authenticated using(public.is_access_admin()) with check(public.is_access_admin());
insert into public.campuses(name) values ('Reitoria');

create function public.validate_access_link(unit_id uuid,selected_course uuid,role_code public.access_role)
returns void language plpgsql security definer set search_path='' as $$
declare wanted text;
begin
 if unit_id is null or not exists(select 1 from public.campuses where id=unit_id and active) then raise exception 'Selecione um campus/unidade ativo.'; end if;
 wanted:=case role_code when 'coordenador_tecnico' then 'tecnico' when 'coordenador_superior' then 'superior' else null end;
 if wanted is not null then
  if selected_course is null or not exists(select 1 from public.courses where id=selected_course and campus_id=unit_id and level=wanted and active) then raise exception 'O curso deve estar ativo e corresponder ao campus e ao nível do perfil.'; end if;
 elsif selected_course is not null then raise exception 'Curso é exclusivo dos perfis de coordenação.';
 end if;
end; $$;
revoke all on function public.validate_access_link(uuid,uuid,public.access_role) from public,anon,authenticated;

create or replace function public.create_access_request() returns trigger language plpgsql security definer set search_path='' as $$
declare unit_id uuid; selected_course uuid; role_code public.access_role;
begin
 unit_id:=nullif(new.raw_user_meta_data->>'campus_id','')::uuid;
 selected_course:=nullif(new.raw_user_meta_data->>'course_id','')::uuid;
 role_code:=(new.raw_user_meta_data->>'requested_role')::public.access_role;
 perform public.validate_access_link(unit_id,selected_course,role_code);
 insert into public.profiles(id,full_name,email,cpf,siape,requested_role,campus_id,course_id)
 values(new.id,trim(new.raw_user_meta_data->>'full_name'),new.email,new.raw_user_meta_data->>'cpf',nullif(new.raw_user_meta_data->>'siape',''),role_code,unit_id,selected_course);
 return new;
end; $$;

-- Substitui a assinatura anterior; atualize também os arquivos do frontend.
drop function public.review_access(uuid,public.access_status,public.access_role);
create function public.review_access(target_id uuid,new_status public.access_status,assigned_role public.access_role,assigned_campus uuid,assigned_course uuid)
returns void language plpgsql security definer set search_path='' as $$
declare target public.profiles;
begin
 if not public.is_access_admin() then raise exception 'Ação permitida apenas ao administrador aprovado.'; end if;
 if target_id=auth.uid() then raise exception 'Não é permitido alterar o próprio acesso.'; end if;
 if new_status is null or new_status not in ('aprovado','indeferido','bloqueado') then raise exception 'Situação inválida.'; end if;
 select * into target from public.profiles where id=target_id for update;
 if not found then raise exception 'Solicitação não encontrada.'; end if;
 if new_status='aprovado' then
  if assigned_role is null then raise exception 'Informe o perfil autorizado.'; end if;
  perform public.validate_access_link(assigned_campus,assigned_course,assigned_role);
  if not exists(select 1 from auth.users where id=target_id and email_confirmed_at is not null) then raise exception 'O solicitante ainda não confirmou o e-mail.'; end if;
 end if;
 update public.profiles set status=new_status,
 approved_role=case when new_status='aprovado' then assigned_role else null end,
 campus_id=case when new_status='aprovado' then assigned_campus else campus_id end,
 course_id=case when new_status='aprovado' then assigned_course else course_id end,
 reviewed_at=now(),reviewed_by=auth.uid() where id=target_id;
end; $$;
revoke all on function public.review_access(uuid,public.access_status,public.access_role,uuid,uuid) from public,anon;
grant execute on function public.review_access(uuid,public.access_status,public.access_role,uuid,uuid) to authenticated;
create or replace function public.audit_access_change() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if old.status is distinct from new.status or old.approved_role is distinct from new.approved_role or old.campus_id is distinct from new.campus_id or old.course_id is distinct from new.course_id then
 insert into public.access_audit(target_id,actor_id,old_status,new_status,old_role,new_role,old_campus_id,new_campus_id,old_course_id,new_course_id)
 values(new.id,auth.uid(),old.status,new.status,old.approved_role,new.approved_role,old.campus_id,new.campus_id,old.course_id,new.course_id);
 end if; return new;
end; $$;
commit;
