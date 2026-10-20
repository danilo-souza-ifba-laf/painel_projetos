const { $, db, run, message, url } = App;
$('login-form').addEventListener('submit',e=>{e.preventDefault();run(e.currentTarget,async()=>{const {error}=await db().auth.signInWithPassword({email:$('email').value.trim(),password:$('password').value});if(error)throw error;location.replace(url('index.html'));});});
$('forgot').addEventListener('click',()=>run($('login-form'),async()=>{if(!$('email').reportValidity())return;const {error}=await db().auth.resetPasswordForEmail($('email').value.trim(),{redirectTo:url('redefinir-senha.html')});if(error)throw error;message('Se houver uma conta para este e-mail, você receberá as instruções de recuperação.');}));
if(location.hash.includes('error'))message('O link de e-mail expirou ou é inválido. Solicite um novo link.','error');
