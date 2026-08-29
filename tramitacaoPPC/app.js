(function () {
  "use strict";

  const STORAGE_KEY = "ifba-painel-api";
  const stageColors = {
    "Mapeamento inicial":"slate", "Elaboração pelo campus":"blue",
    "Análise técnica PROEN":"amber", "Solicitação ajustes ao campus":"orange",
    "Aguardando CONSEPE":"purple", "Relatado no CONSEPE":"purple",
    "Resolução emitida":"green", "Diligência ao campus":"orange", "Concluído":"green"
  };
  const consepeColors = {
    "Não encaminhado":"slate", "Na Camara de Ensino":"blue",
    "Em análise pelo relator":"amber", "Pauta agendada":"purple", "Aprovado":"green",
    "Aprovado com Ressalvas - (com a unidade)":"orange", "Aguardando emissão de Resolução":"blue",
    "Resolução Emitida":"green", "Preparação para envio":"blue", "Em análise":"amber"
  };
  const state = { courses:[], lists:{}, updatedAt:"", source:"base", scope:"Todos", query:"", campus:"", level:"", stage:"" };
  const $ = selector => document.querySelector(selector);

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    bindEvents();
    loadData();
  }

  function bindEvents() {
    document.querySelectorAll("[data-scope]").forEach(button=>button.addEventListener("click",()=>chooseScope(button.dataset.scope)));
    $("#searchInput").addEventListener("input", event => { state.query=event.target.value.trim().toLowerCase(); renderRegistry(); });
    $("#campusFilter").addEventListener("change", event => { state.campus=event.target.value; renderRegistry(); });
    $("#levelFilter").addEventListener("change", event => { state.level=event.target.value; renderRegistry(); });
    $("#stageFilter").addEventListener("change", event => { state.stage=event.target.value; renderRegistry(); });
    $("#clearFilters").addEventListener("click", clearFilters);
    $("#refreshButton").addEventListener("click", () => loadData());
    $("#apiButton").addEventListener("click", openApiModal);
    $("#saveApi").addEventListener("click", saveApi);
    $("#courseTableBody").addEventListener("click", openFromEvent);
    $("#mobileCards").addEventListener("click", openFromEvent);
    $("#drawerBackdrop").addEventListener("click", event => { if(event.target.id==="drawerBackdrop"||event.target.dataset.close==="drawer") closeModal("drawer"); });
    $("#apiBackdrop").addEventListener("click", event => { if(event.target.id==="apiBackdrop"||event.target.dataset.close==="api") closeModal("api"); });
    document.addEventListener("keydown", event => { if(event.key==="Escape"){ closeModal("drawer"); closeModal("api"); } });
  }

  async function loadData(forcedUrl) {
    const url = forcedUrl !== undefined ? forcedUrl : localStorage.getItem(STORAGE_KEY) || "";
    setLoading(true);
    try {
      if (!url) {
        usePayload(window.IFBA_DEMO_DATA, "base");
      } else {
        const response = await fetch(url, { cache:"no-store" });
        if (!response.ok) throw new Error(`Resposta HTTP ${response.status}`);
        usePayload(await response.json(), "api");
      }
    } catch (error) {
      console.error(error);
      usePayload(window.IFBA_DEMO_DATA, "base");
      window.alert("Não foi possível acessar a API informada. O painel voltou a exibir a base local atualizada.");
    } finally {
      setLoading(false);
    }
  }

  function usePayload(payload, source) {
    const rows = Array.isArray(payload) ? payload : payload && Array.isArray(payload.data) ? payload.data : [];
    state.courses = rows.map(row => ({...row, progresso:Number(row.progresso)||0}));
    state.lists = Array.isArray(payload) ? {} : payload.listas || {};
    state.updatedAt = Array.isArray(payload) ? new Date().toISOString() : payload.atualizadoEm || new Date().toISOString();
    state.source = source;
    updateSource(); populateFilters(); renderAll();
  }

  function setLoading(active) {
    if (!active) return;
    const box=$("#statusMessage");
    box.hidden=false; box.className="status-message"; box.textContent="Carregando projetos...";
  }

  function updateSource() {
    const badge=$("#sourceBadge");
    badge.className=`source-badge ${state.source==="api"?"live":"demo"}`;
    badge.innerHTML=`<i></i>${state.source==="api"?"API do Google Sheets":"Base da planilha atualizada"}`;
    $("#updatedAt").textContent=new Intl.DateTimeFormat("pt-BR",{dateStyle:"short",timeStyle:"short"}).format(new Date(state.updatedAt));
  }

  function populateFilters() {
    const rows=scopedCourses();
    const configuredLevels=(state.lists.nivel||[]).filter(value=>state.scope==="Todos"||groupForLevel(value)===state.scope);
    fillSelect($("#campusFilter"), mergeOptions(state.lists.campus||[], unique(rows,"campus")), "Todos os campi", state.campus);
    fillSelect($("#levelFilter"), mergeOptions(configuredLevels, unique(rows,"nivel")), "Todos os níveis", state.level);
    fillSelect($("#stageFilter"), mergeOptions(state.lists.etapa_atual||[], unique(rows,"etapa_atual")), "Todas as etapas", state.stage);
  }

  function unique(rows,field) {
    return [...new Set(rows.map(row=>row[field]).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"pt-BR"));
  }

  function mergeOptions(...groups) {
    return [...new Set(groups.flat().filter(Boolean))].sort((a,b)=>a.localeCompare(b,"pt-BR"));
  }

  function fillSelect(select, values, placeholder, selected) {
    select.replaceChildren(new Option(placeholder,""), ...values.map(value=>new Option(value,value)));
    select.value=values.includes(selected)?selected:"";
  }

  function renderAll() { renderMetrics(); renderStages(); renderRegistry(); }

  function renderMetrics() {
    const courses=scopedCourses();
    const overdue=courses.filter(row=>isOverdue(row)).length;
    $("#metricTotal").textContent=courses.length;
    $("#metricCampus").textContent=courses.filter(row=>ownerTone(row.responsavel_atual)==="campus").length;
    $("#metricProen").textContent=courses.filter(row=>ownerTone(row.responsavel_atual)==="proen").length;
    $("#metricConsepe").textContent=courses.filter(isConsepeActive).length;
    $("#metricOverdue").textContent=overdue;
    $("#attentionTitle").textContent=overdue?`${overdue} ${overdue===1?"projeto exige":"projetos exigem"} atenção`:"Nenhum projeto exige atenção";
  }

  function renderStages() {
    const courses=scopedCourses(); const total=Math.max(courses.length,1);
    const labels=mergeOptions(state.lists.etapa_atual||[], unique(courses,"etapa_atual"));
    $("#stageBars").innerHTML=labels.map(label=>{
      const count=courses.filter(row=>row.etapa_atual===label).length;
      if(!count)return "";
      const color=stageColors[label]; const width=Math.max(8,(count/total)*100);
      return `<div><div class="stage-label"><i class="dot ${color}"></i>${escapeHtml(label)}<strong>${count}</strong></div><div class="bar"><span class="${color}" style="width:${width}%"></span></div></div>`;
    }).join("");
  }

  function filteredCourses() {
    return scopedCourses().filter(row=>{
      const haystack=`${row.curso} ${row.campus} ${row.processo_sei} ${row.tipo_demanda}`.toLowerCase();
      return haystack.includes(state.query)&&(!state.campus||row.campus===state.campus)&&(!state.level||row.nivel===state.level)&&(!state.stage||row.etapa_atual===state.stage);
    });
  }

  function renderRegistry() {
    const rows=filteredCourses(); const scoped=scopedCourses();
    $("#visibleCount").textContent=rows.length; $("#totalCount").textContent=scoped.length; $("#registryScope").textContent=state.scope;
    const status=$("#statusMessage"); status.hidden=rows.length>0; status.textContent=rows.length?"":"Nenhum projeto corresponde aos filtros selecionados.";
    $("#courseTableBody").innerHTML=rows.map(tableRow).join("");
    $("#mobileCards").innerHTML=rows.map(mobileCard).join("");
  }

  function tableRow(row) {
    const movement=latestMovement(row); const remaining=daysTo(row.prazo); const overdue=isOverdue(row);
    const deadline=remaining===null?"Sem prazo":overdue?`${Math.abs(remaining)} dias em atraso`:remaining===0?"Vence hoje":`${remaining} dias restantes`;
    const stageColor=stageColors[row.etapa_atual]||"slate"; const consepeColor=consepeColors[row.situacao_consepe]||"slate";
    return `<tr><td><button class="course-link" type="button" data-id="${escapeHtml(row.id)}">${escapeHtml(row.curso)}</button><small>${escapeHtml(row.campus)} · ${escapeHtml(row.nivel)}</small></td><td>${escapeHtml(row.tipo_demanda)}</td><td><span class="badge ${stageColor}"><i></i>${escapeHtml(row.etapa_atual)}</span><div class="mini-progress"><span style="width:${clamp(row.progresso)}%"></span></div></td><td><span class="owner ${ownerTone(row.responsavel_atual)}">${escapeHtml(row.responsavel_atual)}</span></td><td><strong>${formatDate(movement.date)}</strong><small>${escapeHtml(movement.label)}</small></td><td><strong class="${overdue?"overdue":""}">${formatDate(row.prazo)}</strong><small>${deadline}</small></td><td><span class="badge ${consepeColor}"><i></i>${escapeHtml(row.situacao_consepe)}</span></td><td><button class="detail-button" type="button" data-id="${escapeHtml(row.id)}" aria-label="Ver detalhes de ${escapeHtml(row.curso)}">→</button></td></tr>`;
  }

  function mobileCard(row) {
    const color=stageColors[row.etapa_atual]||"slate";
    return `<button type="button" class="course-card" data-id="${escapeHtml(row.id)}"><header><span class="badge ${color}"><i></i>${escapeHtml(row.etapa_atual)}</span><span>→</span></header><strong>${escapeHtml(row.curso)}</strong><small>${escapeHtml(row.campus)} · ${escapeHtml(row.nivel)}</small><dl><div><dt>Responsável</dt><dd>${escapeHtml(row.responsavel_atual)}</dd></div><div><dt>Prazo</dt><dd>${formatDate(row.prazo)}</dd></div><div><dt>CONSEPE</dt><dd>${escapeHtml(row.situacao_consepe)}</dd></div></dl></button>`;
  }

  function openFromEvent(event) {
    const trigger=event.target.closest("[data-id]"); if(!trigger)return;
    const course=state.courses.find(row=>String(row.id)===String(trigger.dataset.id)); if(course)openDrawer(course);
  }

  function openDrawer(row) {
    $("#drawerTitle").textContent=row.curso;
    $("#drawerSubtitle").textContent=`${row.campus} · ${row.nivel} · ${row.modalidade}`;
    $("#drawerStage").textContent=row.etapa_atual; $("#drawerProgress").style.width=`${clamp(row.progresso)}%`; $("#drawerPercent").textContent=`${clamp(row.progresso)}%`;
    const details=[["Tipo de demanda",row.tipo_demanda],["Responsável atual",row.responsavel_atual],["Processo SEI",row.processo_sei],["Portaria da comissão",row.portaria_comissao],["Data da portaria",formatDate(row.data_portaria)],["Prazo atual",formatDate(row.prazo)]];
    $("#detailGrid").innerHTML=details.map(([label,value])=>`<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value||"—")}</dd></div>`).join("");
    const movements=[["Campus · entrada",row.entrada_campus],["Campus · saída",row.saida_campus],["PROEN · entrada",row.entrada_proen],["PROEN · saída",row.saida_proen]];
    $("#timeline").innerHTML=movements.map(([label,date])=>`<div class="${date?"done":"pending"}"><i></i><span>${escapeHtml(label)}</span><strong>${formatDate(date)}</strong></div>`).join("");
    const consepeColor=consepeColors[row.situacao_consepe]||"slate";
    $("#consepeBox").innerHTML=`<span class="badge ${consepeColor}"><i></i>${escapeHtml(row.situacao_consepe)}</span><p>${row.data_consepe?`Último registro em ${formatDate(row.data_consepe)}.`:"Ainda não há data de tramitação registrada."}</p>`;
    $("#drawerNotes").textContent=row.observacoes||"Nenhuma observação registrada.";
    openModal("drawer"); setTimeout(()=>$("#detailDrawer .close-button").focus(),0);
  }

  function openApiModal() { $("#apiUrl").value=localStorage.getItem(STORAGE_KEY)||""; openModal("api"); setTimeout(()=>$("#apiUrl").focus(),0); }
  function saveApi() { const url=$("#apiUrl").value.trim(); if(url)localStorage.setItem(STORAGE_KEY,url);else localStorage.removeItem(STORAGE_KEY);closeModal("api");loadData(url); }
  function openModal(name) { $(name==="drawer"?"#drawerBackdrop":"#apiBackdrop").hidden=false; document.body.classList.add("modal-open"); }
  function closeModal(name) { const target=$(name==="drawer"?"#drawerBackdrop":"#apiBackdrop"); target.hidden=true; if($("#drawerBackdrop").hidden&&$("#apiBackdrop").hidden)document.body.classList.remove("modal-open"); }

  function clearFilters() {
    state.query=state.campus=state.level=state.stage="";
    $("#searchInput").value=""; $("#campusFilter").value=""; $("#levelFilter").value=""; $("#stageFilter").value=""; renderRegistry();
  }

  function chooseScope(scope) {
    state.scope=scope||"Todos"; state.campus=state.level=state.stage="";
    document.querySelectorAll("[data-scope]").forEach(button=>{const active=button.dataset.scope===state.scope;button.classList.toggle("active",active);button.setAttribute("aria-pressed",String(active));});
    $("#scopeTitle").textContent=state.scope==="Todos"?"EPTNM e cursos superiores":state.scope;
    populateFilters(); renderAll();
  }

  function groupForLevel(level) {
    const normalized=String(level||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
    if(normalized.includes("superior")||normalized.includes("graduacao"))return "Superior";
    if(normalized.includes("eptnm")||normalized.includes("tecnico")||normalized.includes("medio"))return "EPTNM";
    return "Outro";
  }

  function scopedCourses() { return state.scope==="Todos"?state.courses:state.courses.filter(row=>groupForLevel(row.nivel)===state.scope); }

  function normalizeText(value) { return String(value||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase(); }
  function ownerTone(value) {
    const normalized=normalizeText(value);
    if(normalized.startsWith("campus"))return "campus";
    if(normalized.startsWith("proen")||normalized.startsWith("proex"))return "proen";
    if(normalized.startsWith("consepe"))return "consepe";
    return "outro";
  }
  function isCompleted(row) { return ["resolucao emitida","concluido"].includes(normalizeText(row.etapa_atual))||normalizeText(row.situacao_consepe)==="resolucao emitida"; }
  function isConsepeActive(row) {
    if(isCompleted(row))return false;
    const status=normalizeText(row.situacao_consepe);
    return ownerTone(row.responsavel_atual)==="consepe"||["na camara de ensino","em analise pelo relator","pauta agendada","aguardando emissao de resolucao","preparacao para envio","em analise"].includes(status);
  }


  function latestMovement(row) {
    const entries=[[row.entrada_proen,"Entrada na PROEN"],[row.saida_proen,"Saída da PROEN"],[row.entrada_campus,"Entrada no campus"],[row.saida_campus,"Saída do campus"]].filter(item=>item[0]).sort((a,b)=>b[0].localeCompare(a[0]));
    return entries.length?{date:entries[0][0],label:entries[0][1]}:{date:"",label:"Sem movimentação"};
  }
  function daysTo(value) { if(!value)return null; const today=new Date();today.setHours(0,0,0,0);const date=new Date(`${value}T12:00:00`);return Math.ceil((date-today)/86400000); }
  function isOverdue(row) { const days=daysTo(row.prazo);return days!==null&&days<0&&!isCompleted(row); }
  function formatDate(value) { if(!value)return "—";const parts=String(value).slice(0,10).split("-");return parts.length===3?`${parts[2]}/${parts[1]}/${parts[0]}`:escapeHtml(value); }
  function clamp(value) { return Math.min(100,Math.max(0,Number(value)||0)); }
  function escapeHtml(value) { return String(value??"").replace(/[&<>'"]/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[char])); }
})();
