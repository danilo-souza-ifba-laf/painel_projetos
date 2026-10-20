const {$,db,run,message,url}=App;
let recovery=false;
try{
 db().auth.onAuthStateChange(event=>{if(event==='PASSWORD_RECOVERY'){recovery=true;$('reset-form').querySelector('button').disabled=false;message('Link validado. Informe sua nova senha.');}});
 db().auth.getSession().then(({error})=>{if(error)message(App.errorText(error),'error');});
}catch(e){message(App.errorText(e),'error');}
$('reset-form').addEventListener('submit',e=>{e.preventDefault();if(!recovery)return message('Abra um novo link de recuperação enviado por e-mail.','error');run(e.currentTarget,async()=>{if($('password').value!==$('confirm').value)throw new Error('As senhas não coincidem.');const {error}=await db().auth.updateUser({password:$('password').value});if(error)throw error;await db().auth.signOut({scope:'local'});location.replace(url('login.html'));});});
