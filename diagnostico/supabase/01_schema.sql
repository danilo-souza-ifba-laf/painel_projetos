-- Execute uma vez em um projeto Supabase novo, antes do primeiro cadastro.
begin;
create type public.access_role as enum ('administrador','coordenador_tecnico','coordenador_superior','diretor','equipe_curriculos');
create type public.access_status as enum ('pendente','aprovado','indeferido','bloqueado');
create function public.valid_cpf(v text) returns boolean language plpgsql immutable set search_path='' as $$
declare n int; i int; s int; d int;
begin
 if v is null or v !~ '^[0-9]{11}$' or v = repeat(substr(v,1,1),11) then return false; end if;
 for n in 9..10 loop
  s:=0; for i in 1..n loop s:=s+substr(v,i,1)::int*(n+2-i); end loop;
  d:=((s*10)%11)%10; if d<>substr(v,n+1,1)::int then return false; end if;
 end loop; return true;
end; $$;
create table public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 full_name text not null check(char_length(trim(full_name)) between 5 and 150 and trim(full_name) ~ '\s'),
 email text not null,
 cpf text not null unique check(public.valid_cpf(cpf)),
 siape text check(siape is null or siape ~ '^[0-9]{7}$'),
 requested_role public.access_role not null,
 approved_role public.access_role,
 status public.access_status not null default 'pendente',
 created_at timestamptz not null default now(),
 reviewed_at timestamptz,
 reviewed_by uuid references auth.users(id) on delete set null,
 check(status <> 'aprovado' or approved_role is not null)
);
create table public.access_audit (
 id bigint generated always as identity primary key,
 target_id uuid not null,
 actor_id uuid,
 old_status public.access_status,
 new_status public.access_status not null,
 old_role public.access_role,
 new_role public.access_role,
 occurred_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
alter table public.access_audit enable row level security;
revoke all on public.profiles,public.access_audit from anon,authenticated;
grant select on public.profiles,public.access_audit to authenticated;
create function public.is_access_admin() returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.profiles where id=auth.uid() and status='aprovado' and approved_role='administrador');
$$;
revoke all on function public.is_access_admin() from public,anon;
grant execute on function public.is_access_admin() to authenticated;
create policy own_profile_or_admin on public.profiles for select to authenticated using(id=(select auth.uid()) or (select public.is_access_admin()));
create policy audit_admin on public.access_audit for select to authenticated using((select public.is_access_admin()));
-- Não há INSERT/UPDATE/DELETE direto pelo navegador, inclusive para administradores.
create function public.create_access_request() returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into public.profiles(id,full_name,email,cpf,siape,requested_role)
 values(new.id,trim(new.raw_user_meta_data->>'full_name'),new.email,
 new.raw_user_meta_data->>'cpf',nullif(new.raw_user_meta_data->>'siape',''),
 (new.raw_user_meta_data->>'requested_role')::public.access_role);
 return new;
end; $$;
revoke all on function public.create_access_request() from public,anon,authenticated;
create trigger on_auth_user_created_diagnostico after insert on auth.users for each row execute function public.create_access_request();
create function public.review_access(target_id uuid,new_status public.access_status,assigned_role public.access_role)
returns void language plpgsql security definer set search_path='' as $$
declare target public.profiles;
begin
 if not public.is_access_admin() then raise exception 'Ação permitida apenas ao administrador aprovado.'; end if;
 if target_id=auth.uid() then raise exception 'Não é permitido alterar o próprio acesso.'; end if;
 if new_status is null or new_status not in ('aprovado','indeferido','bloqueado') then raise exception 'Situação inválida.'; end if;
 if new_status='aprovado' and assigned_role is null then raise exception 'Informe o perfil autorizado.'; end if;
 select * into target from public.profiles where id=target_id for update;
 if not found then raise exception 'Solicitação não encontrada.'; end if;
 if new_status='aprovado' and not exists(select 1 from auth.users where id=target_id and email_confirmed_at is not null) then raise exception 'O solicitante ainda não confirmou o e-mail.'; end if;
 update public.profiles set status=new_status,approved_role=case when new_status='aprovado' then assigned_role else null end,reviewed_at=now(),reviewed_by=auth.uid() where id=target_id;
end; $$;
revoke all on function public.review_access(uuid,public.access_status,public.access_role) from public,anon;
grant execute on function public.review_access(uuid,public.access_status,public.access_role) to authenticated;
create function public.audit_access_change() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if old.status is distinct from new.status or old.approved_role is distinct from new.approved_role then
 insert into public.access_audit(target_id,actor_id,old_status,new_status,old_role,new_role)
 values(new.id,auth.uid(),old.status,new.status,old.approved_role,new.approved_role);
 end if; return new;
end; $$;
revoke all on function public.audit_access_change() from public,anon,authenticated;
create trigger audit_access_update after update on public.profiles for each row execute function public.audit_access_change();
commit;
