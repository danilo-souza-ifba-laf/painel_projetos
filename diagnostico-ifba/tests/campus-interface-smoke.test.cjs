// Smoke test da execução dos scripts e regras na interface com DOM mínimo.
// Não substitui testes em navegador ou verificação de layout/IndexedDB.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
function run(role,campus='Barreiras',query='?campus=Barreiras&year=2026'){
 const nodes=new Map(),storage=new Map();
 class Element{constructor(id,attrs=''){this.id=id;this.attrs=attrs;this.value=(attrs.match(/value="([^"]*)"/)||[])[1]||'';this.disabled=/\bdisabled\b/.test(attrs);this.checked=false;this.hidden=false;this.open=false;this.listeners={};this.dataset={}}set innerHTML(v){this.html=v;for(const m of v.matchAll(/<[\w-]+\b([^>]*\bid="([^"]+)"[^>]*)>/g))nodes.set(m[2],new Element(m[2],m[1]))}get innerHTML(){return this.html||''}set textContent(v){this.text=v}get textContent(){return this.text||''}addEventListener(k,fn){this.listeners[k]=fn}querySelector(s){return s==='[data-close]'?new Element('close'):null}showModal(){this.open=true}close(){this.open=false}scrollIntoView(){}}
 for(const id of ['content','nav','account','modal','toast'])nodes.set(id,new Element(id));
 const document={body:{dataset:{page:'campus'}},querySelector:s=>nodes.get(s.replace(/^#/,''))||null,querySelectorAll:s=>s==='[data-open]'?['integrated','subsequent','graduation'].map(k=>{const n=new Element('open');n.dataset.open=k;return n}):[],createElement:()=>({click(){}})};
 const session={role,campus,course:campus==='Salvador'?'ads-ssa':'ali-bar'};
 const ctx={document,URL,URLSearchParams,Date,console,crypto:{randomUUID:()=> 'test-id'},sessionStorage:{getItem:()=>JSON.stringify(session),removeItem(){}},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},location:{search:query,replace(){},href:''},window:{addEventListener(){},open(){}},setTimeout:()=>{},confirm:()=>true};vm.createContext(ctx);
 for(const file of ['campus-model.js','campus.js','app.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../assets',file),'utf8'),ctx,{filename:file});
 return {ctx,nodes,storage};
}
(async()=>{
 const manager=run('campus');assert.match(manager.nodes.get('campusName').attrs,/readonly/);assert.equal(manager.nodes.has('editIdentity'),false);assert.equal(manager.nodes.has('saveDraft'),true);
 for(const [k,v] of Object.entries({effective:'85',tae:'50',temporary:'10'}))manager.nodes.get(k).value=v;
 await manager.nodes.get('saveDraft').onclick();const saved=JSON.parse(manager.storage.get('diag-campusRecords'))['Barreiras|2026'];assert.equal(saved.status,'draft');assert.equal(saved.values.effective,85);assert.equal(saved.version,1);
 vm.runInContext("campusFile=async()=>({});let rec=read('campusRecords',{});rec['Barreiras|2026'].attachment={name:'carga.xlsx',size:1024,key:'test'};write('campusRecords',rec);campusPage()",manager.ctx);
 manager.nodes.get('confirmData').checked=true;await manager.nodes.get('campusForm').onsubmit({preventDefault(){}});await manager.nodes.get('confirmValidation').onclick();const validated=JSON.parse(manager.storage.get('diag-campusRecords'))['Barreiras|2026'];assert.equal(validated.status,'validated');assert.equal(manager.nodes.has('reopen'),true);
 const coord=run('coord');assert.equal(coord.nodes.has('saveDraft'),false);assert.equal(coord.nodes.get('workload').disabled,true);
 const admin=run('admin');assert.equal(admin.nodes.has('editIdentity'),true);
 const denied=run('campus','Salvador');assert.match(denied.nodes.get('content').innerHTML,/Acesso indisponível/);
 console.log('PASS smoke: scripts, campos protegidos, rascunho, confirmação/validação, consulta e bloqueio de campus.');
})().catch(e=>{console.error(e);process.exitCode=1});
