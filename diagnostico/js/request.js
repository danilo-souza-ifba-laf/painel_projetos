const {$,db,run,message,url,validCPF}=App;
$('cpf').addEventListener('input',e=>{const v=e.target.value.replace(/\D/g,'').slice(0,11);e.target.value=v.replace(/^(\d{3})(\d)/,'$1.$2').replace(/^(\d{3})\.(\d{3})(\d)/,'$1.$2.$3').replace(/(\d{3})\.(\d{3})\.(\d{3})(\d)/,'$1.$2.$3-$4');});
$('request-form').addEventListener('submit',e=>{e.preventDefault();run(e.currentTarget,async()=>{
 if(!validCPF($('cpf').value))throw new Error('Informe um CPF válido.');
 if($('name').value.trim().split(/\s+/).length<2)throw new Error('Informe seu nome completo.');
 if($('password').value!==$('confirm').value)throw new Error('As senhas não coincidem.');
 if(!$('campus').value)throw new Error('Selecione seu campus ou unidade.');
 if(Catalog.level($('role').value)&&!$('course').value)throw new Error('Selecione o curso. Se ele não estiver disponível, solicite o cadastro à administração.');
 const {error}=await db().auth.signUp({email:$('email').value.trim(),password:$('password').value,options:{emailRedirectTo:url('index.html'),data:{full_name:$('name').value.trim(),cpf:$('cpf').value.replace(/\D/g,''),siape:$('siape').value.trim()||null,requested_role:$('role').value,campus_id:$('campus').value,course_id:Catalog.level($('role').value)?$('course').value:null}}});
 if(error)throw error;
 await db().auth.signOut({scope:'local'});
 $('request-form').reset();updateCourses();message('Confira seu e-mail para confirmar o cadastro. Após a confirmação, entre para acompanhar a aprovação. Se já possui conta, utilize o login ou recupere sua senha.');window.scrollTo({top:0,behavior:'smooth'});
});});

function updateCourses(){const needs=!!Catalog.level($('role').value);$('course-field').hidden=!needs;const count=Catalog.courses($('course'),$('campus').value,$('role').value);$('course-hint').textContent=!$('campus').value?'Selecione primeiro seu campus.':count?'Selecione o curso que você coordena.':'Não há cursos deste nível neste campus. Solicite o cadastro à administração antes de continuar.';}
$('campus').addEventListener('change',updateCourses);$('role').addEventListener('change',updateCourses);
Catalog.load().then(()=>{Catalog.campuses($('campus'));updateCourses();}).catch(e=>{App.message(App.errorText(e),'error');Catalog.options($('campus'),[],'Não foi possível carregar as unidades');});
