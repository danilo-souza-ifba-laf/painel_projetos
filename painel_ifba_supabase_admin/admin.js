(function () {
  "use strict";

  const TYPES = ["Implantação de curso", "Reformulação do PPC", "Alteração Menor Relevância do PPC", "Suspensão da oferta", "Estudo de viabilidade", "Atualização do PPC", "Reconhecimento de curso"];
  const STAGES = ["Mapeamento inicial", "Elaboração pelo campus", "Análise técnica PROEN", "Solicitação ajustes ao campus", "Diligência ao campus", "Aguardando CONSEPE", "Relatado no CONSEPE", "Resolução emitida", "Concluído"];
  const UNITS = ["Campus", "PROEN", "PROEN - DPE", "PROEN - DESUP", "PROEN - DETEC", "PROEX - Curricularização", "CONSEPE"];
  const CONSEPE = ["Não encaminhado", "Preparação para envio", "Na Câmara de Ensino", "Em análise pelo relator", "Em análise", "Pauta agendada", "Aprovado", "Aprovado com ressalvas", "Aguardando emissão de Resolução", "Resolução emitida"];
  const LEVELS = ["Superior - Licenciatura", "Superior - Bacharelado", "Superior - Tecnologia", "EPTNM - Concomitante", "EPTNM - Integrado", "EPTNM - Subsequente", "EPTNM - EJA"];
  const state = { session:null, profile:null, campi:[], courses:[], profiles:[], demands:[], selectedDemandId:null };
  const $ = selector => document.querySelector(selector);

  document.addEventListener("DOMContentLoaded", init);

  async function init() {
    bindStaticEvents();
    populateStaticSelects();

    if (!window.IFBA_SUPABASE_CONFIGURED || !window.IFBA_SUPABASE) {
      denyAccess("Conexão não configurada", "Preencha a URL e a chave publicável em supabase-config.js.");
      return;
    }

    const { data, error } = await window.IFBA_SUPABASE.auth.getSession();
    if (error || !data.session) {
      window.location.replace("login.html?return=admin.html");
      return;
    }

    state.session = data.session;
    const access = await loadAdminProfile();
    if (!access) return;

    $("#adminName").textContent = state.profile.nome || state.profile.email || "Administrador";
    $("#accessState").hidden = true;
    $("#adminApp").hidden = false;
    setToday();
    await loadAll();
  }

  function bindStaticEvents() {
    $("#logoutButton").addEventListener("click", signOut);
    $("#refreshAdmin").addEventListener("click", loadAll);
    $("#newDemand").addEventListener("click", resetDemandForm);
    $("#cancelEdit").addEventListener("click", resetDemandForm);
    $("#campusId").addEventListener("change", () => populateCourseSelect());
    $("#demandSearch").addEventListener("input", renderDemandList);
    $("#demandList").addEventListener("click", event => {
      const item = event.target.closest("[data-demand-id]");
      if (item) selectDemand(item.dataset.demandId);
    });
    $("#progressValue").addEventListener("input", updateProgressOutput);
    $("#demandForm").addEventListener("submit", saveDemand);
    $("#archiveDemand").addEventListener("click", archiveDemand);
    $("#movementForm").addEventListener("submit", saveMovement);
    $("#openCampusDialog").addEventListener("click", () => openDialog("campusDialog"));
    $("#openCourseDialog").addEventListener("click", openCourseDialog);
    $("#campusForm").addEventListener("submit", saveCampus);
    $("#courseForm").addEventListener("submit", saveCourse);
    document.querySelectorAll("[data-close-dialog]").forEach(button => button.addEventListener("click", () => $("#" + button.dataset.closeDialog).close()));
  }

  function populateStaticSelects() {
    setOptions($("#demandType"), TYPES);
    setOptions($("#currentStage"), STAGES);
    setOptions($("#currentUnit"), UNITS);
    setOptions($("#consepeStatus"), CONSEPE);
    setOptions($("#newCourseLevel"), LEVELS);
  }

  async function loadAdminProfile() {
    const { data, error } = await window.IFBA_SUPABASE
      .from("perfis_usuario")
      .select("usuario_id,nome,email,papel,ativo")
      .eq("usuario_id", state.session.user.id)
      .maybeSingle();

    if (error || !data) {
      denyAccess("Perfil não encontrado", "Execute a migração 02 e vincule esta conta em perfis_usuario.");
      return false;
    }
    if (!data.ativo || data.papel !== "admin") {
      denyAccess("Acesso não autorizado", "Esta página é exclusiva para usuários com perfil administrador.", true);
      return false;
    }
    state.profile = data;
    return true;
  }

  async function loadAll() {
    setGlobalBusy(true);
    const sb = window.IFBA_SUPABASE;
    const [campiResult, coursesResult, profilesResult, demandsResult] = await Promise.all([
      sb.from("campi").select("id,nome,ativo").eq("ativo", true).order("nome"),
      sb.from("cursos").select("id,campus_id,nome,nivel,modalidade,ativo").eq("ativo", true).order("nome"),
      sb.from("perfis_usuario").select("usuario_id,nome,email,papel,campus_id,ativo").eq("ativo", true).order("nome"),
      sb.from("painel_cursos").select("*").order("campus").order("curso")
    ]);

    const failed = [campiResult, coursesResult, profilesResult, demandsResult].find(result => result.error);
    if (failed) {
      showMessage("demandMessage", friendlyError(failed.error), "error");
      setGlobalBusy(false);
      return;
    }

    state.campi = campiResult.data || [];
    state.courses = coursesResult.data || [];
    state.profiles = profilesResult.data || [];
    state.demands = demandsResult.data || [];
    populateCampusSelects();
    populateAssignedUsers();
    renderDemandList();
    renderMetrics();

    if (state.selectedDemandId) {
      const selected = state.demands.find(item => item.demanda_id === state.selectedDemandId);
      if (selected) selectDemand(selected.demanda_id);
      else resetDemandForm();
    }
    setGlobalBusy(false);
  }

  function populateCampusSelects() {
    const current = $("#campusId").value;
    setOptions($("#campusId"), state.campi.map(item => ({ value:item.id, label:item.nome })), "Selecione");
    setOptions($("#newCourseCampus"), state.campi.map(item => ({ value:item.id, label:item.nome })), "Selecione");
    if (state.campi.some(item => item.id === current)) $("#campusId").value = current;
    populateCourseSelect();
  }

  function populateCourseSelect(selectedId) {
    const campusId = $("#campusId").value;
    const courses = state.courses.filter(item => item.campus_id === campusId);
    setOptions($("#courseId"), courses.map(item => ({ value:item.id, label:`${item.nome} · ${item.nivel}` })), campusId ? "Selecione" : "Selecione primeiro o campus");
    $("#courseId").disabled = !campusId;
    if (selectedId && courses.some(item => item.id === selectedId)) $("#courseId").value = selectedId;
  }

  function populateAssignedUsers(selectedId) {
    const users = state.profiles.map(item => ({ value:item.usuario_id, label:`${item.nome || item.email}${item.papel === "admin" ? " · admin" : ""}` }));
    setOptions($("#assignedUser"), users, "Ainda não atribuído");
    if (selectedId && users.some(item => item.value === selectedId)) $("#assignedUser").value = selectedId;
  }

  function renderDemandList() {
    const query = $("#demandSearch").value.trim().toLocaleLowerCase("pt-BR");
    const rows = state.demands.filter(item => `${item.id} ${item.curso} ${item.campus} ${item.processo_sei}`.toLocaleLowerCase("pt-BR").includes(query));
    $("#adminDemandCount").textContent = rows.length;
    $("#demandEmpty").hidden = rows.length > 0;
    $("#demandList").innerHTML = rows.map(item => {
      const owner = item.responsavel_usuario_nome || "Sem usuário atribuído";
      return `<button class="demand-item ${item.demanda_id === state.selectedDemandId ? "active" : ""}" type="button" data-demand-id="${escapeHtml(item.demanda_id)}"><span class="demand-item-top"><span class="demand-item-code">${escapeHtml(item.id)}</span><span class="demand-item-priority ${slug(item.prioridade)}">${escapeHtml(item.prioridade)}</span></span><strong>${escapeHtml(item.curso)}</strong><small>${escapeHtml(item.campus)} · ${escapeHtml(item.etapa_atual)}</small><span class="demand-item-owner"><i></i>${escapeHtml(owner)}</span></button>`;
    }).join("");
  }

  function renderMetrics() {
    const today = isoToday();
    $("#adminMetricTotal").textContent = state.demands.length;
    $("#adminMetricUnassigned").textContent = state.demands.filter(item => !item.responsavel_usuario_id).length;
    $("#adminMetricOverdue").textContent = state.demands.filter(item => item.prazo && item.prazo < today && item.etapa_atual !== "Concluído").length;
    $("#adminMetricUsers").textContent = state.profiles.length;
  }

  function selectDemand(id) {
    const item = state.demands.find(row => row.demanda_id === id);
    if (!item) return;
    state.selectedDemandId = id;
    $("#demandUuid").value = item.demanda_id;
    $("#campusId").value = item.campus_id;
    populateCourseSelect(item.curso_id);
    $("#demandCode").value = item.id || "";
    $("#processoSei").value = item.processo_sei || "";
    setSelectValue($("#demandType"), item.tipo_demanda);
    setSelectValue($("#currentStage"), item.etapa_atual);
    setSelectValue($("#currentUnit"), item.responsavel_atual);
    populateAssignedUsers(item.responsavel_usuario_id);
    $("#priority").value = item.prioridade || "Média";
    $("#deadline").value = dateValue(item.prazo);
    $("#progressValue").value = item.progresso || 0;
    $("#commissionOrdinance").value = item.portaria_comissao || "";
    $("#commissionDate").value = dateValue(item.data_portaria);
    setSelectValue($("#consepeStatus"), item.situacao_consepe);
    $("#consepeDate").value = dateValue(item.data_consepe);
    $("#notes").value = item.observacoes || "";
    $("#editorMode").textContent = "EDITANDO DEMANDA";
    $("#editorTitle").textContent = `${item.id} · ${item.curso}`;
    $("#cancelEdit").hidden = false;
    $("#archiveDemand").hidden = false;
    $("#movementContext").textContent = `${item.id} · ${item.curso} · ${item.campus}`;
    $("#saveMovement").disabled = false;
    updateProgressOutput();
    renderDemandList();
    if (window.innerWidth < 1100) $("#demandForm").scrollIntoView({ behavior:"smooth", block:"start" });
  }

  function resetDemandForm() {
    state.selectedDemandId = null;
    $("#demandForm").reset();
    $("#demandUuid").value = "";
    $("#priority").value = "Média";
    $("#progressValue").value = 0;
    $("#editorMode").textContent = "NOVA DEMANDA";
    $("#editorTitle").textContent = "Cadastrar acompanhamento";
    $("#cancelEdit").hidden = true;
    $("#archiveDemand").hidden = true;
    $("#movementContext").textContent = "Selecione uma demanda na lista para registrar entrada ou saída.";
    $("#saveMovement").disabled = true;
    populateCourseSelect();
    populateAssignedUsers();
    updateProgressOutput();
    showMessage("demandMessage", "", "");
    renderDemandList();
  }

  async function saveDemand(event) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.checkValidity()) {
      form.reportValidity();
      showMessage("demandMessage", "Preencha os campos obrigatórios.", "error");
      return;
    }

    const payload = {
      codigo: value("demandCode"), curso_id:value("courseId"), tipo_demanda:value("demandType"),
      etapa_atual:value("currentStage"), responsavel_atual:value("currentUnit"),
      responsavel_usuario_id:valueOrNull("assignedUser"), processo_sei:value("processoSei"),
      portaria_comissao:valueOrNull("commissionOrdinance"), data_portaria:valueOrNull("commissionDate"),
      situacao_consepe:value("consepeStatus"), data_consepe:valueOrNull("consepeDate"),
      prazo:valueOrNull("deadline"), prioridade:value("priority"), progresso:Number(value("progressValue")),
      observacoes:valueOrNull("notes"), atualizado_por:state.session.user.id
    };

    setButtonBusy("saveDemand", true, "Salvando…");
    const sb = window.IFBA_SUPABASE;
    const result = state.selectedDemandId
      ? await sb.from("demandas").update(payload).eq("id", state.selectedDemandId).select("id").single()
      : await sb.from("demandas").insert({ ...payload, criado_por:state.session.user.id }).select("id").single();

    setButtonBusy("saveDemand", false, "Salvar demanda");
    if (result.error) {
      showMessage("demandMessage", friendlyError(result.error), "error");
      return;
    }

    state.selectedDemandId = result.data.id;
    showMessage("demandMessage", "Demanda salva com sucesso.", "success");
    await loadAll();
  }

  async function archiveDemand() {
    if (!state.selectedDemandId) return;
    const item = state.demands.find(row => row.demanda_id === state.selectedDemandId);
    if (!window.confirm(`Arquivar ${item ? item.id + " · " + item.curso : "esta demanda"}? O registro deixará de aparecer no painel.`)) return;
    const { error } = await window.IFBA_SUPABASE.from("demandas").update({ ativa:false, atualizado_por:state.session.user.id }).eq("id", state.selectedDemandId);
    if (error) {
      showMessage("demandMessage", friendlyError(error), "error");
      return;
    }
    resetDemandForm();
    await loadAll();
  }

  async function saveMovement(event) {
    event.preventDefault();
    if (!state.selectedDemandId) return;
    const form = event.currentTarget;
    if (!form.checkValidity()) { form.reportValidity(); return; }
    setButtonBusy("saveMovement", true, "Registrando…");
    const { error } = await window.IFBA_SUPABASE.from("movimentacoes").insert({
      demanda_id:state.selectedDemandId, unidade:value("movementUnit"), tipo:value("movementType"),
      data_movimentacao:value("movementDate"), observacao:valueOrNull("movementNote"), criado_por:state.session.user.id
    });
    setButtonBusy("saveMovement", false, "Registrar");
    if (error) {
      showMessage("movementMessage", friendlyError(error), "error");
      return;
    }
    showMessage("movementMessage", "Movimentação registrada com sucesso.", "success");
    $("#movementNote").value = "";
    await loadAll();
  }

  async function saveCampus(event) {
    event.preventDefault();
    const name = value("newCampusName");
    if (!name) { $("#newCampusName").reportValidity(); return; }
    setButtonBusy("saveCampus", true, "Adicionando…");
    const { data, error } = await window.IFBA_SUPABASE.from("campi").insert({ nome:name }).select("id,nome,ativo").single();
    setButtonBusy("saveCampus", false, "Adicionar");
    if (error) { showMessage("campusMessage", friendlyError(error), "error"); return; }
    state.campi.push(data); state.campi.sort((a,b) => a.nome.localeCompare(b.nome,"pt-BR"));
    populateCampusSelects(); $("#campusId").value = data.id; populateCourseSelect();
    $("#newCampusName").value = ""; $("#campusDialog").close();
  }

  function openCourseDialog() {
    populateCampusSelects();
    $("#newCourseCampus").value = $("#campusId").value || "";
    openDialog("courseDialog");
  }

  async function saveCourse(event) {
    event.preventDefault();
    if (!event.currentTarget.checkValidity()) { event.currentTarget.reportValidity(); return; }
    setButtonBusy("saveCourse", true, "Adicionando…");
    const payload = { campus_id:value("newCourseCampus"), nome:value("newCourseName"), nivel:value("newCourseLevel"), modalidade:value("newCourseModality") };
    const { data, error } = await window.IFBA_SUPABASE.from("cursos").insert(payload).select("id,campus_id,nome,nivel,modalidade,ativo").single();
    setButtonBusy("saveCourse", false, "Adicionar");
    if (error) { showMessage("courseMessage", friendlyError(error), "error"); return; }
    state.courses.push(data); state.courses.sort((a,b) => a.nome.localeCompare(b.nome,"pt-BR"));
    $("#campusId").value = data.campus_id; populateCourseSelect(data.id);
    event.currentTarget.reset(); $("#courseDialog").close();
  }

  async function signOut() {
    await window.IFBA_SUPABASE.auth.signOut();
    window.location.replace("login.html");
  }

  function denyAccess(title, text, signedIn) {
    const box = $("#accessState");
    box.innerHTML = `<span class="access-symbol" aria-hidden="true">!</span><h1>${escapeHtml(title)}</h1><p>${escapeHtml(text)}</p>${signedIn ? '<a class="admin-primary" href="index.html">Voltar ao painel</a>' : ""}`;
  }

  function setGlobalBusy(active) {
    $("#refreshAdmin").disabled = active;
    $("#refreshAdmin").textContent = active ? "Atualizando…" : "Atualizar";
  }
  function updateProgressOutput() { $("#progressOutput").textContent = `${value("progressValue")}%`; }
  function setToday() { $("#movementDate").value = isoToday(); }
  function isoToday() { const now=new Date(); const local=new Date(now.getTime()-now.getTimezoneOffset()*60000); return local.toISOString().slice(0,10); }
  function dateValue(value) { return value ? String(value).slice(0,10) : ""; }
  function value(id) { return $("#" + id).value.trim(); }
  function valueOrNull(id) { return value(id) || null; }
  function openDialog(id) { showMessage(id === "campusDialog" ? "campusMessage" : "courseMessage", "", ""); $("#" + id).showModal(); }
  function setButtonBusy(id, active, busyText) { const button=$("#"+id); if(!button.dataset.label)button.dataset.label=button.textContent;button.disabled=active;button.textContent=active?busyText:button.dataset.label; }
  function setSelectValue(select, value) { if (value && ![...select.options].some(option => option.value === value)) select.add(new Option(value,value)); select.value=value || ""; }
  function setOptions(select, values, placeholder) { const options=values.map(item => typeof item === "string" ? new Option(item,item) : new Option(item.label,item.value)); select.replaceChildren(...(placeholder !== undefined ? [new Option(placeholder,"")] : []),...options); }
  function showMessage(id,text,type){const el=$("#"+id);el.textContent=text;el.className=`form-message ${type||""}`;}
  function slug(value){return String(value||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-");}
  function escapeHtml(value){return String(value??"").replace(/[&<>'"]/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[char]));}
  function friendlyError(error){const message=String(error&&error.message||"");if(/duplicate key|unique constraint/i.test(message))return "Já existe um registro com esses dados.";if(/row-level security|permission denied/i.test(message))return "Seu perfil não possui permissão para realizar esta operação.";if(/foreign key/i.test(message))return "O registro está vinculado a outro cadastro e não pode ser alterado dessa forma.";return "Não foi possível concluir a operação. Verifique os dados e tente novamente.";}
})();
