const {$,db,roles,message,url}=App;
async function loadRequests(){
 $('requests').replaceChildren();
 const {data,error}=await db().from('profiles').select('id,full_name,email,cpf,siape,requested_role,created_at,campus_id,course_id').eq('status','pendente').order('created_at');if(error)throw error;
 if(!data.length){$('requests').textContent='Nenhuma solicitação pendente.';return;}
 for(const row of data){const item=document.createElement('article');item.className='request-item';const title=document.createElement('strong');title.textContent=row.full_name;item.append(title);const detail=document.createElement('p');detail.textContent=`${row.email} · CPF: ${row.cpf} · SIAPE: ${row.siape||'Não informado'}`;detail.textContent+=` · Unidade: ${Catalog.campusName(row.campus_id)} · Curso: ${Catalog.courseName(row.course_id)}`;item.append(detail);const label=document.createElement('label');label.textContent='Perfil a autorizar';const select=document.createElement('select');select.setAttribute('aria-label','Perfil a autorizar para '+row.full_name);for(const [value,text]of Object.entries(roles)){select.add(new Option(text,value));}select.value=row.requested_role;label.append(select);item.append(label);
const unitLabel=document.createElement('label');unitLabel.textContent='Campus / unidade a autorizar';const unit=document.createElement('select');unitLabel.append(unit);item.append(unitLabel);Catalog.campuses(unit,row.campus_id);
const courseLabel=document.createElement('label');courseLabel.textContent='Curso a autorizar';const course=document.createElement('select');courseLabel.append(course);item.append(courseLabel);
function syncCourse(selected=''){courseLabel.hidden=!Catalog.level(select.value);Catalog.courses(course,unit.value,select.value,selected);}
syncCourse(row.course_id);select.addEventListener('change',()=>syncCourse());unit.addEventListener('change',()=>syncCourse());
const actions=document.createElement('div');actions.className='actions';for(const [status,text]of [['aprovado','Aprovar'],['indeferido','Indeferir']]){const b=document.createElement('button');b.className=status==='aprovado'?'primary':'secondary';b.textContent=text;b.addEventListener('click',async()=>{if(!confirm(`${text} a solicitação de ${row.full_name}?`))return;actions.querySelectorAll('button').forEach(x=>x.disabled=true);try{const {error}=await db().rpc('review_access',{target_id:row.id,new_status:status,assigned_role:select.value,assigned_campus:unit.value||null,assigned_course:Catalog.level(select.value)?course.value||null:null});if(error)throw error;await loadRequests();message('Decisão registrada.');}catch(e){message(App.errorText(e),'error');actions.querySelectorAll('button').forEach(x=>x.disabled=false);}});actions.append(b);}item.append(actions);$('requests').append(item);}
}
async function init(){try{
 const {data:{user},error}=await db().auth.getUser();if(error||!user){location.replace(url('login.html'));return;}
 const {data:p,error:pe}=await db().from('profiles').select('full_name,email,status,requested_role,approved_role,campus_id,course_id').eq('id',user.id).single();if(pe)throw pe;
 await Catalog.load();$('campus-display').textContent=Catalog.campusName(p.campus_id);$('course-display').textContent=Catalog.courseName(p.course_id);$('message').hidden=true;$('profile').hidden=false;$('welcome').textContent=`Olá, ${p.full_name}`;$('email-display').textContent=user.email;$('status').textContent=({pendente:'Aguardando aprovação',aprovado:'Aprovado',indeferido:'Indeferido',bloqueado:'Bloqueado'})[p.status];$('requested').textContent=roles[p.requested_role];$('approved').textContent=p.status==='aprovado'?roles[p.approved_role]:'Nenhum perfil ativo';$('access-note').textContent=p.status==='aprovado'?'Login realizado com sucesso. Este é o perfil autorizado para seu acesso ao sistema.':'Sua identidade foi autenticada, mas o acesso aos módulos ainda não está liberado. Consulte a administração.';
 if(p.status==='aprovado'&&p.approved_role==='administrador'){$('admin').hidden=false;$('catalog-admin').hidden=false;renderCatalog();await loadRequests();}
 db().auth.onAuthStateChange(event=>{if(event==='SIGNED_OUT')location.replace(url('login.html'));});
}catch(e){message(App.errorText(e),'error');}}
$('refresh').addEventListener('click',()=>loadRequests().catch(e=>message(App.errorText(e),'error')));
$('logout').addEventListener('click',async()=>{try{const {error}=await db().auth.signOut({scope:'local'});if(error)throw error;location.replace(url('login.html'));}catch(e){message(App.errorText(e),'error');}});
init();

function renderCatalog(){
 Catalog.campuses($('admin-campus'),$('admin-campus').value);
 for(const [table,items,container] of [['campuses',Catalog.state.campuses,'campus-list'],['courses',Catalog.state.courses,'course-list']]){
  $(container).replaceChildren();
  if(!items.length)$(container).textContent='Nenhum registro cadastrado.';
  for(const row of items){const line=document.createElement('div');line.className='catalog-row';const name=document.createElement('span');name.textContent=table==='courses'?`${row.name} · ${row.level==='tecnico'?'Técnico':'Superior'} · ${Catalog.campusName(row.campus_id)}`:row.name;line.append(name);
   const button=document.createElement('button');button.className='quiet';button.textContent=row.active?'Desativar':'Ativar';button.setAttribute('aria-label',button.textContent+' '+row.name);button.addEventListener('click',async()=>{button.disabled=true;try{const {error}=await db().from(table).update({active:!row.active}).eq('id',row.id);if(error)throw error;await refreshCatalog();message('Catálogo atualizado. A desativação impede novas seleções e preserva os vínculos existentes.');}catch(e){message(App.errorText(e),'error');button.disabled=false;}});line.append(button);$(container).append(line);
  }
 }
}
async function refreshCatalog(){await Catalog.load();renderCatalog();await loadRequests();}
$('campus-form').addEventListener('submit',e=>{e.preventDefault();App.run(e.currentTarget,async()=>{const {error}=await db().from('campuses').insert({name:$('campus-name').value.trim()});if(error)throw error;$('campus-form').reset();await refreshCatalog();message('Unidade cadastrada.');});});
$('course-form').addEventListener('submit',e=>{e.preventDefault();App.run(e.currentTarget,async()=>{const {error}=await db().from('courses').insert({name:$('course-name').value.trim(),campus_id:$('admin-campus').value,level:$('course-level').value});if(error)throw error;$('course-name').value='';await refreshCatalog();message('Curso cadastrado e disponível para seleção.');});});
