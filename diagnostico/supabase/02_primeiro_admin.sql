-- Depois de solicitar acesso pelo formulário e confirmar seu e-mail:
-- Substitua o e-mail abaixo. Execute SOMENTE no SQL Editor do Supabase.
-- Não coloque este SQL em uma página pública executável.
do $$
declare target uuid;
begin
 select p.id into target from public.profiles p join auth.users u on u.id=p.id
 where lower(p.email)=lower('danilo-souza@ifba.edu.br') and u.email_confirmed_at is not null;
 if target is null then raise exception 'Conta não encontrada ou e-mail não confirmado.'; end if;
 update public.profiles set status='aprovado',approved_role='administrador',reviewed_at=now() where id=target;
end $$;
