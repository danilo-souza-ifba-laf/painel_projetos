window.Catalog = (() => {
 const level = role => ({coordenador_tecnico:'tecnico',coordenador_superior:'superior'})[role] || null;
 const state = {campuses:[],courses:[]};
 async function load(){
  const [a,b]=await Promise.all([App.db().from('campuses').select('id,name,active').order('name'),App.db().from('courses').select('id,campus_id,name,level,active').order('name')]);
  if(a.error)throw a.error;if(b.error)throw b.error;state.campuses=a.data;state.courses=b.data;
 }
 function options(select,items,placeholder,selected='') {select.replaceChildren(new Option(placeholder,''));for(const item of items)select.add(new Option(item.name,item.id));select.value=selected||'';}
 function campuses(select,selected=''){options(select,state.campuses.filter(x=>x.active),'Selecione a unidade',selected);}
 function courses(select,campus,role,selected=''){const l=level(role);const items=state.courses.filter(x=>x.active&&x.campus_id===campus&&x.level===l);options(select,items,items.length?'Selecione o curso':'Nenhum curso disponível',selected);select.required=!!l;select.disabled=!l;return items.length;}
 function campusName(id){return state.campuses.find(x=>x.id===id)?.name||'Não informado';}
 function courseName(id){return state.courses.find(x=>x.id===id)?.name||'Não se aplica / não informado';}
 return {level,state,load,options,campuses,courses,campusName,courseName};
})();
