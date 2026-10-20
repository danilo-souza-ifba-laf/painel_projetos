'use strict';
window.App = (() => {
 const roles = {administrador:'Administrador',coordenador_tecnico:'Coordenadores de Cursos Técnicos',coordenador_superior:'Coordenadores de Cursos Superiores',diretor:'Diretores Gerais e de Ensino',equipe_curriculos:'Equipe de Construção dos Currículos'};
 const $ = id => document.getElementById(id);
 function message(text, kind='info') { const box=$('message');box.hidden=false;box.textContent=text;box.dataset.kind=kind; }
 let client;
 function db() {
  if(client) return client;
  const c=window.APP_CONFIG;
  if(!c || c.supabaseUrl.includes('SEU-PROJETO') || c.supabaseKey==='SUA_CHAVE_PUBLICA') throw new Error('Configure a URL e a chave pública do Supabase em js/config.js.');
  if(!window.supabase) throw new Error('Não foi possível carregar a conexão. Verifique a internet e recarregue a página.');
  client=window.supabase.createClient(c.supabaseUrl,c.supabaseKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
  return client;
 }
 function url(page){return new URL(page,location.href).href;}
 async function run(form, action){const buttons=form.querySelectorAll('button');buttons.forEach(b=>b.disabled=true);try{await action();}catch(e){message(errorText(e),'error');}finally{buttons.forEach(b=>b.disabled=false);}}
 function errorText(e){const m=e.message||'';if(m.includes('Invalid login'))return 'E-mail ou senha incorretos.';if(m.includes('Email not confirmed'))return 'Confirme seu e-mail antes de entrar.';if(/rate limit|too many/i.test(m))return 'Muitas tentativas. Aguarde alguns minutos e tente novamente.';if(/fetch|network/i.test(m))return 'Falha de conexão. Verifique sua internet e tente novamente.';if(/Database error/i.test(m))return 'Cadastro não concluído. Confira seus dados ou procure a administração.';return m||'Não foi possível concluir a operação.';}
 function validCPF(value){const s=value.replace(/\D/g,'');if(!/^\d{11}$/.test(s)||/^(\d)\1{10}$/.test(s))return false;for(let n=9;n<11;n++){let sum=0;for(let i=0;i<n;i++)sum+=Number(s[i])*(n+1-i);const digit=(sum*10)%11%10;if(digit!==Number(s[n]))return false;}return true;}
 try{document.documentElement.dataset.theme=localStorage.getItem('ifba-theme')||'light';}catch{}
 $('theme')?.addEventListener('click',()=>{const t=document.documentElement.dataset.theme==='dark'?'light':'dark';document.documentElement.dataset.theme=t;try{localStorage.setItem('ifba-theme',t);}catch{}});
 document.querySelectorAll('[data-password]').forEach(b=>b.addEventListener('click',()=>{const i=$(b.dataset.password);const visible=i.type==='password';i.type=visible?'text':'password';b.textContent=visible?'Ocultar':'Mostrar';b.setAttribute('aria-label',visible?'Ocultar senha':'Mostrar senha');b.setAttribute('aria-pressed',String(visible));}));
 return {$,roles,message,db,url,run,errorText,validCPF};
})();
