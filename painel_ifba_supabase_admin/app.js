(function () {
  "use strict";

  const stageColors = {
    "Mapeamento inicial":"slate", "Elaboração pelo campus":"blue",
    "Análise técnica PROEN":"amber", "Solicitação ajustes ao campus":"orange",
    "Diligência ao campus":"orange", "Aguardando CONSEPE":"purple",
    "Relatado no CONSEPE":"purple", "Resolução emitida":"green", "Concluído":"green"
  };
  const consepeColors = {
    "Não encaminhado":"slate", "Preparação para envio":"blue", "Na Câmara de Ensino":"blue",
    "Em análise pelo relator":"amber", "Em análise":"amber", "Pauta agendada":"purple",
    "Aprovado":"green", "Aprovado com ressalvas":"orange",
    "Aguardando emissão de Resolução":"purple", "Resolução emitida":"green"
  };
  const state = { courses:[], updatedAt:"", source:"demo", scope:"Todos", query:"", campus:"", level:"", stage:"" };
  const $ = selector => document.querySelector(selector);

  document.addEventListener("DOMContentLoaded", init);

  async function init() {
    bindEvents();
    if (!window.IFBA_SUPABASE_CONFIGURED || !window.IFBA_SUPABASE) {
      usePayload(window.IFBA_DEMO_DATA, "demo");
      return;
    }

    const { data, error } = await window.IFBA_SUPABASE.auth.getSession();
    if (error || !data.session) {
      window.location.replace("login.html?return=index.html");
      return;
    }

    const { data:profile } = await window.IFBA_SUPABASE
      .from("perfis_usuario")
      .select("nome,email,papel,ativo")
      .eq("usuario_id", data.session.user.id)
      .maybeSingle();

    if (!profile || !profile.ativo) {
      window.alert("Seu perfil não está ativo para consultar o painel.");
      await window.IFBA_SUPABASE.auth.signOut();
      window.location.replace("login.html");
      return;
    }

    $("#logoutButton").hidden = false;
    $("#adminLink").hidden = profile.papel !== "admin";
    loadData();
  }

  function bindEvents() {
    document.querySelectorAll("[data-scope]").forEach(button => button.addEventListener("click", () => chooseScope(button.dataset.scope)));
    $("#searchInput").addEventListener("input", event => { state.query=event.target.value.trim().toLowerCase(); renderRegistry(); });
    $("#campusFilter").addEventListener("change", event => { state.campus=event.target.value; renderRegistry(); });
    $("#levelFilter").addEventListener("change", event => { state.level=event.target.value; renderRegistry(); });
    $("#stageFilter").addEventListener("change", event => { state.stage=event.target.value; renderRegistry(); });
    $("#clearFilters").addEventListener("click", clearFilters);
    $("#refreshButton").addEventListener("click", loadData);
    $("#logoutButton").addEventListener("click", signOut);
    $("#courseTableBody").addEventListener("click", openFromEvent);
    $("#mobileCards").addEventListener("click", openFromEvent);
    $("#drawerBackdrop").addEventListener("click", event => { if(event.target.id==="drawerBackdrop"||event.target.dataset.close==="drawer") closeDrawer(); });
    document.addEventListener("keydown", event => { if(event.key==="Escape") closeDrawer(); });
  }

  async function loadData() {
    setLoading(true);
    try {
      if (!window.IFBA_SUPABASE) {
        usePayload(window.IFBA_DEMO_DATA, "demo");
        return;
      }
      const { data, error } = await window.IFBA_SUPABASE.from("painel_cursos").select("*").order("campus").order("curso");
      if (error) throw error;
      usePayload(data || [], "supabase");
    } catch (error) {
      console.error(error);
      usePayload({ data:[], atualizadoEm:new Date().toISOString() }, "supabase");
      window.alert("Não foi possível consultar o Supabase. Verifique a conexão e as permissões do usuário.");
    } finally {
      setLoading(false);
    }
  }

  function usePayload(payload, source) {
    const rows = Array.isArray(payload) ? payload : payload && Array.isArray(payload.data) ? payload.data : [];
    state.courses = rows.map(row => ({...row, progresso:Number(row.progresso)||0}));
    state.updatedAt = Array.isArray(payload) ? latestUpdate(rows) : payload.atualizadoEm || new Date().toISOString();
    state.source = source;
    updateSource(); populateFilters(); renderAll();
  }

  function latestUpdate(rows) {
    const values = rows.map(row => row.atualizado_em).filter(Boolean).sort().reverse();
    return values[0] || new Date().toISOString();
  }

  function setLoading(active) {
    if (!active) return;
    const box=$("#statusMessage");
    box.hidden=false; box.className="status-message"; box.textContent="Carregando projetos…";
  }

  function updateSource() {
    const badge=$("#sourceBadge");
    badge.className=`source-badge ${state.source==="supabase"?"live":"demo"}`;
    badge.innerHTML=`<i></i>${state.source==="supabase"?"Supabase conectado":"Dados demonstrativos"}`;
    $("#updatedAt").textContent=new Intl.DateTimeFormat("pt-BR",{dateStyle:"short",timeStyle:"short"}).format(new Date(state.updatedAt));
  }

  function populateFilters() {
    const rows=scopedCourses();
    fillSelect($("#campusFilter"), unique(rows,"campus"), "Todos os campi", state.campus);
    fillSelect($("#levelFilter"), unique(rows,"nivel"), "Todos os níveis", state.level);
    fillSelect($("#stageFilter"), unique(rows,"etapa_atual"), "Todas as etapas", state.stage);
  }

  function unique(rows,field) { return [...new Set(rows.map(row=>row[field]).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"pt-BR")); }
  function fillSelect(select, values, placeholder, selected) { select.replaceChildren(new Option(placeholder,""), ...values.map(value=>new Option(value,value))); select.value=values.includes(selected)?selected:""; }
  function renderAll() { renderMetrics(); renderStages(); renderRegistry(); }

  function renderMetrics() {
    const courses=scopedCourses();
    const overdue=courses.filter(row=>isOverdue(row)).length;
    $("#metricTotal").textContent=courses.length;
    $("#metricCampus").textContent=courses.filter(row=>row.responsavel_atual==="Campus").length;
    $("#metricProen").textContent=courses.filter(row=>String(row.responsavel_atual).startsWith("PROEN")).length;
    $("#metricConsepe").textContent=courses.filter(row=>["Em análise","Em análise pelo relator","Pauta agendada"].includes(row.situacao_consepe)).length;
    $("#metricOverdue").textContent=overdue;
    $("#attentionTitle").textContent=overdue?`${overdue} ${overdue===1?"projeto exige":"projetos exigem"} atenção`:"Nenhum projeto exige atenção";
  }

  function renderStages() {
    const courses=scopedCourses(); const total=Math.max(courses.length,1);
    $("#stageBars").innerHTML=Object.keys(stageColors).map(label=>{
      const count=courses.filter(row=>row.etapa_atual===label).length;
      if(!count)return "";
      const color=stageColors[label]; const width=Math.max(8,(count/total)*100);
      return `<div><div class="stage-label"><i class="dot ${color}"></i>${escapeHtml(label)}<strong>${count}</strong></div><div class="bar"><span class="${color}" style="width:${width}%"></span></div></div>`;
    }).join("");
  }

  function filteredCourses() {
    return scopedCourses().filter(row=>{
      const haystack=`${row.curso} ${row.campus} ${row.processo_sei} ${row.tipo_demanda} ${row.responsavel_usuario_nome||""}`.toLowerCase();
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
    const owner=row.responsavel_usuario_nome?`${row.responsavel_atual} · ${row.responsavel_usuario_nome}`:row.responsavel_atual;
    return `<tr><td><button class="course-link" type="button" data-id="${escapeHtml(row.id)}">${escapeHtml(row.curso)}</button><small>${escapeHtml(row.campus)} · ${escapeHtml(row.nivel)}</small></td><td>${escapeHtml(row.tipo_demanda)}</td><td><span class="badge ${stageColor}"><i></i>${escapeHtml(row.etapa_atual)}</span><div class="mini-progress"><span style="width:${clamp(row.progresso)}%"></span></div></td><td><span class="owner ${ownerClass(row.responsavel_atual)}">${escapeHtml(owner)}</span></td><td><strong>${formatDate(movement.date)}</strong><small>${escapeHtml(movement.label)}</small></td><td><strong class="${overdue?"overdue":""}">${formatDate(row.prazo)}</strong><small>${deadline}</small></td><td><span class="badge ${consepeColor}"><i></i>${escapeHtml(row.situacao_consepe)}</span></td><td><button class="detail-button" type="button" data-id="${escapeHtml(row.id)}" aria-label="Ver detalhes de ${escapeHtml(row.curso)}">→</button></td></tr>`;
  }

  function mobileCard(row) {
    const color=stageColors[row.etapa_atual]||"slate";
    const owner=row.responsavel_usuario_nome||row.responsavel_atual;
    return `<button type="button" class="course-card" data-id="${escapeHtml(row.id)}"><header><span class="badge ${color}"><i></i>${escapeHtml(row.etapa_atual)}</span><span>→</span></header><strong>${escapeHtml(row.curso)}</strong><small>${escapeHtml(row.campus)} · ${escapeHtml(row.nivel)}</small><dl><div><dt>Responsável</dt><dd>${escapeHtml(owner)}</dd></div><div><dt>Prazo</dt><dd>${formatDate(row.prazo)}</dd></div><div><dt>CONSEPE</dt><dd>${escapeHtml(row.situacao_consepe)}</dd></div></dl></button>`;
  }

  function openFromEvent(event) {
    const trigger=event.target.closest("[data-id]"); if(!trigger)return;
    const course=state.courses.find(row=>String(row.id)===String(trigger.dataset.id)); if(course)openDrawer(course);
  }

  function openDrawer(row) {
    $("#drawerTitle").textContent=row.curso;
    $("#drawerSubtitle").textContent=`${row.campus} · ${row.nivel} · ${row.modalidade}`;
    $("#drawerStage").textContent=row.etapa_atual; $("#drawerProgress").style.width=`${clamp(row.progresso)}%`; $("#drawerPercent").textContent=`${clamp(row.progresso)}%`;
    const details=[["Tipo de demanda",row.tipo_demanda],["Unidade responsável",row.responsavel_atual],["Usuário responsável",row.responsavel_usuario_nome],["Processo SEI",row.processo_sei],["Portaria da comissão",row.portaria_comissao],["Data da portaria",formatDate(row.data_portaria)],["Prazo atual",formatDate(row.prazo)]];
    $("#detailGrid").innerHTML=details.map(([label,value])=>`<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value||"—")}</dd></div>`).join("");
    const movements=[["Campus · entrada",row.entrada_campus],["Campus · saída",row.saida_campus],["PROEN · entrada",row.entrada_proen],["PROEN · saída",row.saida_proen]];
    $("#timeline").innerHTML=movements.map(([label,date])=>`<div class="${date?"done":"pending"}"><i></i><span>${escapeHtml(label)}</span><strong>${formatDate(date)}</strong></div>`).join("");
    const consepeColor=consepeColors[row.situacao_consepe]||"slate";
    $("#consepeBox").innerHTML=`<span class="badge ${consepeColor}"><i></i>${escapeHtml(row.situacao_consepe)}</span><p>${row.data_consepe?`Último registro em ${formatDate(row.data_consepe)}.`:"Ainda não há data de tramitação registrada."}</p>`;
    $("#drawerNotes").textContent=row.observacoes||"Nenhuma observação registrada.";
    $("#drawerBackdrop").hidden=false; document.body.classList.add("modal-open"); setTimeout(()=>$("#detailDrawer .close-button").focus(),0);
  }

  function closeDrawer() { $("#drawerBackdrop").hidden=true; document.body.classList.remove("modal-open"); }
  async function signOut() { await window.IFBA_SUPABASE.auth.signOut(); window.location.replace("login.html"); }
  function clearFilters() { state.query=state.campus=state.level=state.stage=""; $("#searchInput").value=""; $("#campusFilter").value=""; $("#levelFilter").value=""; $("#stageFilter").value=""; renderRegistry(); }
  function chooseScope(scope) { state.scope=scope||"Todos"; state.campus=state.level=state.stage=""; document.querySelectorAll("[data-scope]").forEach(button=>{const active=button.dataset.scope===state.scope;button.classList.toggle("active",active);button.setAttribute("aria-pressed",String(active));}); $("#scopeTitle").textContent=state.scope==="Todos"?"EPTNM e cursos superiores":state.scope; populateFilters(); renderAll(); }
  function groupForLevel(level) { const normalized=String(level||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase(); if(normalized.includes("superior")||normalized.includes("graduacao"))return "Superior"; if(normalized.includes("eptnm")||normalized.includes("tecnico")||normalized.includes("medio"))return "EPTNM"; return "Outro"; }
  function scopedCourses() { return state.scope==="Todos"?state.courses:state.courses.filter(row=>groupForLevel(row.nivel)===state.scope); }
  function latestMovement(row) { const entries=[[row.entrada_proen,"Entrada na PROEN"],[row.saida_proen,"Saída da PROEN"],[row.entrada_campus,"Entrada no campus"],[row.saida_campus,"Saída do campus"]].filter(item=>item[0]).sort((a,b)=>b[0].localeCompare(a[0])); return entries.length?{date:entries[0][0],label:entries[0][1]}:{date:"",label:"Sem movimentação"}; }
  function daysTo(value) { if(!value)return null; const today=new Date();today.setHours(0,0,0,0);const date=new Date(`${value}T12:00:00`);return Math.ceil((date-today)/86400000); }
  function isOverdue(row) { const days=daysTo(row.prazo);return days!==null&&days<0&&row.etapa_atual!=="Concluído"; }
  function ownerClass(value) { const text=String(value||"").toLowerCase(); return text.startsWith("proen")?"proen":text.startsWith("campus")?"campus":text.startsWith("consepe")?"consepe":""; }
  function formatDate(value) { if(!value)return "—";const parts=String(value).slice(0,10).split("-");return parts.length===3?`${parts[2]}/${parts[1]}/${parts[0]}`:escapeHtml(value); }
  function clamp(value) { return Math.min(100,Math.max(0,Number(value)||0)); }
  function escapeHtml(value) { return String(value??"").replace(/[&<>'"]/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[char])); }
})();

