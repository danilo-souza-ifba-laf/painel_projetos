const campusNames = {
  BAR: "Barreiras",
  BRU: "Brumado",
  CAM: "Camaçari",
  CFO: "Campo Formoso",
  EUC: "Euclides da Cunha",
  EUN: "Eunápolis",
  FSA: "Feira de Santana",
  ILH: "Ilhéus",
  IRE: "Irecê",
  JAC: "Jacobina",
  JAG: "Jaguaquara",
  JEQ: "Jequié",
  JUA: "Juazeiro",
  LAF: "Lauro de Freitas",
  PAU: "Paulo Afonso",
  POR: "Porto Seguro",
  SAL: "Salvador",
  SAJ: "Santo Antônio de Jesus",
  SAM: "Santo Amaro",
  SEA: "Seabra",
  SFI: "Simões Filho",
  UBA: "Ubaitaba",
  VAL: "Valença",
  VCA: "Vitória da Conquista",
  REI: "Reitoria",
  POL: "Polo de Inovação Salvador",
};

const campusSummary = {
  BAR: { suap: 1027, sistec: 1108, divergence: 79, suapSistec: 1, sistecSuap: 53 },
  BRU: { suap: 375, sistec: 369, divergence: 18, suapSistec: 22, sistecSuap: 17 },
  SAL: { suap: 1418, sistec: 1396, divergence: 64, suapSistec: 31, sistecSuap: 28 },
  LAF: { suap: 267, sistec: 253, divergence: 21, suapSistec: 38, sistecSuap: 24 },
};

const courses = [
  { campus: "BAR", code: "3", name: "Curso Técnico em Eletrotécnica", offer: "Técnico", mode: "Presencial", suap: 5, sistec: 8, suapOnly: 0, sistecOnly: 164 },
  { campus: "BAR", code: "66", name: "Licenciatura em Matemática", offer: "Graduação", mode: "Presencial", suap: 47, sistec: 42, suapOnly: 10, sistecOnly: 22 },
  { campus: "BAR", code: "67", name: "Curso Técnico em Eletromecânica", offer: "Técnico", mode: "Presencial", suap: 18, sistec: 22, suapOnly: 0, sistecOnly: 65 },
  { campus: "BAR", code: "70", name: "Curso Técnico em Enfermagem", offer: "Técnico", mode: "Presencial", suap: 71, sistec: 80, suapOnly: 0, sistecOnly: 137 },
  { campus: "BAR", code: "82", name: "Bacharelado em Engenharia de Alimentos", offer: "Graduação", mode: "Presencial", suap: 52, sistec: 49, suapOnly: 9, sistecOnly: 13 },
  { campus: "BAR", code: "89", name: "Curso Técnico em Edificações", offer: "Técnico", mode: "Presencial", suap: 154, sistec: 54, suapOnly: 101, sistecOnly: 1 },
  { campus: "BAR", code: "90", name: "Curso Técnico em Alimentos", offer: "Técnico", mode: "Presencial", suap: 161, sistec: 283, suapOnly: 0, sistecOnly: 157 },
  { campus: "BAR", code: "91", name: "Curso Técnico em Informática", offer: "Técnico", mode: "Presencial", suap: 138, sistec: 158, suapOnly: 0, sistecOnly: 34 },
  { campus: "BAR", code: "95", name: "Bacharelado em Arquitetura e Urbanismo", offer: "Graduação", mode: "Presencial", suap: 135, sistec: 115, suapOnly: 27, sistecOnly: 10 },
  { campus: "BAR", code: "97", name: "Especialização em Ensino de Matemática", offer: "Pós-graduação", mode: "EAD", suap: 11, sistec: 11, suapOnly: 0, sistecOnly: 21 },
  { campus: "BAR", code: "CaGespFI", name: "Gestão Escolar na Perspectiva da Educação Inclusiva", offer: "FIC", mode: "EAD", suap: 234, sistec: 234, suapOnly: 0, sistecOnly: 0 },
  { campus: "BAR", code: "—", name: "Registros sem curso associado", offer: "FIC", mode: "EAD", suap: 1, sistec: 52, suapOnly: 0, sistecOnly: 2 },
  { campus: "BRU", code: "112", name: "Curso Técnico em Informática", offer: "Técnico", mode: "Presencial", suap: 132, sistec: 128, suapOnly: 8, sistecOnly: 5 },
  { campus: "BRU", code: "118", name: "Curso Técnico em Mineração", offer: "Técnico", mode: "Presencial", suap: 148, sistec: 151, suapOnly: 4, sistecOnly: 7 },
  { campus: "BRU", code: "203", name: "Tecnologia em Análise e Desenvolvimento de Sistemas", offer: "Graduação", mode: "Presencial", suap: 95, sistec: 90, suapOnly: 6, sistecOnly: 3 },
  { campus: "SAL", code: "12", name: "Bacharelado em Administração", offer: "Graduação", mode: "Presencial", suap: 240, sistec: 238, suapOnly: 9, sistecOnly: 7 },
  { campus: "SAL", code: "24", name: "Engenharia Química", offer: "Graduação", mode: "Presencial", suap: 210, sistec: 205, suapOnly: 11, sistecOnly: 8 },
  { campus: "SAL", code: "41", name: "Licenciatura em Matemática", offer: "Graduação", mode: "Presencial", suap: 135, sistec: 140, suapOnly: 5, sistecOnly: 10 },
  { campus: "SAL", code: "54", name: "Curso Técnico em Geologia", offer: "Técnico", mode: "Presencial", suap: 168, sistec: 161, suapOnly: 12, sistecOnly: 5 },
  { campus: "LAF", code: "301", name: "Tecnologia em Jogos Digitais", offer: "Graduação", mode: "Presencial", suap: 118, sistec: 116, suapOnly: 7, sistecOnly: 5 },
  { campus: "LAF", code: "305", name: "Tecnologia em Inteligência Artificial", offer: "Graduação", mode: "Presencial", suap: 74, sistec: 69, suapOnly: 8, sistecOnly: 3 },
  { campus: "LAF", code: "309", name: "Formação Inicial em Tecnologias Digitais", offer: "FIC", mode: "EAD", suap: 75, sistec: 68, suapOnly: 6, sistecOnly: 2 },
];

const students = [
  { registration: "2026001001", name: "Ana Beatriz Almeida", cpf: "***.214.***-**", course: "66 - Licenciatura em Matemática", campus: "BAR", suapStatus: "Matriculado", lastPeriod: "Matriculado", date: "27/01/2026", inSuap: true, inSistec: false },
  { registration: "2026001002", name: "João Vitor Santos", cpf: "***.781.***-**", course: "89 - Curso Técnico em Edificações", campus: "BAR", suapStatus: "Matriculado", lastPeriod: "Concluído", date: "27/01/2026", inSuap: true, inSistec: false },
  { registration: "2025002048", name: "Mariana Costa Lima", cpf: "***.093.***-**", course: "90 - Curso Técnico em Alimentos", campus: "BAR", suapStatus: "Não localizado", lastPeriod: "Matriculado", date: "27/01/2026", inSuap: false, inSistec: true },
  { registration: "2024003410", name: "Pedro Henrique Souza", cpf: "***.462.***-**", course: "95 - Arquitetura e Urbanismo", campus: "BAR", suapStatus: "Matriculado", lastPeriod: "Matriculado", date: "27/01/2026", inSuap: true, inSistec: true },
  { registration: "2026002117", name: "Camila Oliveira Rocha", cpf: "***.555.***-**", course: "112 - Curso Técnico em Informática", campus: "BRU", suapStatus: "Matriculado", lastPeriod: "Matriculado", date: "31/01/2026", inSuap: true, inSistec: false },
  { registration: "2025004289", name: "Rafael Gomes Silva", cpf: "***.807.***-**", course: "203 - Análise e Desenvolvimento de Sistemas", campus: "BRU", suapStatus: "Não localizado", lastPeriod: "Matriculado", date: "31/01/2026", inSuap: false, inSistec: true },
  { registration: "2026005174", name: "Luana Ferreira Reis", cpf: "***.170.***-**", course: "24 - Engenharia Química", campus: "SAL", suapStatus: "Matriculado", lastPeriod: "Matriculado", date: "02/02/2026", inSuap: true, inSistec: false },
  { registration: "2025006082", name: "Gabriel Nunes Alves", cpf: "***.629.***-**", course: "54 - Curso Técnico em Geologia", campus: "SAL", suapStatus: "Não localizado", lastPeriod: "Evadido", date: "02/02/2026", inSuap: false, inSistec: true },
  { registration: "2026007105", name: "Isabela Martins Dias", cpf: "***.318.***-**", course: "301 - Tecnologia em Jogos Digitais", campus: "LAF", suapStatus: "Matriculado", lastPeriod: "Matriculado", date: "04/02/2026", inSuap: true, inSistec: false },
];

const historySeries = {
  BAR: {
    dates: ["18/01", "18/01", "24/11", "25/11", "27/01", "27/01", "27/11", "27/11"],
    distortion: [1140, 1000, 1600, 1015, 1005, 1080, 1530, 1027],
    divergence: [210, 4, 650, 2, 5, 78, 580, 1],
  },
};

const campusFilter = document.querySelector("#campus-filter");
const offerFilter = document.querySelector("#offer-filter");
const modeFilter = document.querySelector("#mode-filter");
const studentSearch = document.querySelector("#student-search");
const tableBody = document.querySelector("#student-table-body");
const toast = document.querySelector("#toast");
let activeTab = "suap-only";
let currentRows = [];
let toastTimer;

function formatNumber(value) {
  return new Intl.NumberFormat("pt-BR").format(value);
}

function setCampusOptions() {
  campusFilter.innerHTML = Object.entries(campusNames)
    .map(([code, name]) => `<option value="${code}">${code} — ${name}</option>`)
    .join("");
  campusFilter.value = "BAR";
}

function getFilteredCourses() {
  return courses.filter((course) =>
    course.campus === campusFilter.value &&
    (!offerFilter.value || course.offer === offerFilter.value) &&
    (!modeFilter.value || course.mode === modeFilter.value)
  );
}

function getSummary(filteredCourses) {
  const unfilteredCampus = !offerFilter.value && !modeFilter.value;
  const preset = unfilteredCampus ? campusSummary[campusFilter.value] : null;
  const suap = preset?.suap ?? filteredCourses.reduce((total, course) => total + course.suap, 0);
  const sistec = preset?.sistec ?? filteredCourses.reduce((total, course) => total + course.sistec, 0);
  const distortion = Math.abs(suap - sistec);
  const divergence = preset?.divergence ?? filteredCourses.reduce((total, course) => total + Math.min(course.suapOnly + course.sistecOnly, 12), 0);
  const suapSistec = preset?.suapSistec ?? (divergence ? Math.round(filteredCourses.reduce((sum, course) => sum + course.suapOnly, 0) / Math.max(divergence, 1) * 100) : 0);
  const sistecSuap = preset?.sistecSuap ?? (divergence ? Math.round(filteredCourses.reduce((sum, course) => sum + course.sistecOnly, 0) / Math.max(divergence, 1) * 100) : 0);
  return { suap, sistec, distortion, divergence, suapSistec: Math.min(suapSistec, 100), sistecSuap: Math.min(sistecSuap, 100) };
}

function setRing(element, value) {
  const safeValue = Math.min(Math.max(Math.round(value), 0), 100);
  element.style.setProperty("--value", safeValue);
  element.querySelector("span").textContent = `${safeValue}%`;
  element.setAttribute("aria-label", `${safeValue}%`);
}

function renderSummary(summary) {
  document.querySelector("#suap-total").textContent = formatNumber(summary.suap);
  document.querySelector("#sistec-total").textContent = formatNumber(summary.sistec);
  document.querySelector("#distortion-total").textContent = formatNumber(summary.distortion);
  document.querySelector("#divergence-total").textContent = formatNumber(summary.divergence);
  document.querySelector("#suap-date").textContent = "27/01/2026, 15:10:25";
  document.querySelector("#sistec-date").textContent = "27/01/2026, 16:36:01";

  const distortionPercent = summary.suap ? summary.distortion / summary.suap * 100 : 0;
  setRing(document.querySelector("#distortion-gauge"), distortionPercent);

  document.querySelector("#suap-sistec-percent").textContent = `${summary.suapSistec}%`;
  document.querySelector("#sistec-suap-percent").textContent = `${summary.sistecSuap}%`;
  document.querySelector("#suap-sistec-bar").value = summary.suapSistec;
  document.querySelector("#sistec-suap-bar").value = summary.sistecSuap;
}

function deltaBadge(value, positive) {
  if (!value) return `<span class="delta delta-neutral">0</span>`;
  const className = positive ? "delta-up" : "delta-down";
  const symbol = positive ? "▲" : "▼";
  return `<span class="delta ${className}">${symbol} ${formatNumber(value)}</span>`;
}

function courseTitle(course) {
  return `${course.code} - ${course.name} (${campusNames[course.campus]})`;
}

function renderCourseCards(filteredCourses, summary) {
  const distortionContainer = document.querySelector("#distortion-cards");
  const divergenceContainer = document.querySelector("#divergence-cards");

  if (!filteredCourses.length) {
    const empty = `<p class="empty-state">Nenhum curso encontrado para os filtros selecionados.</p>`;
    distortionContainer.innerHTML = empty;
    divergenceContainer.innerHTML = empty;
    return;
  }

  distortionContainer.innerHTML = filteredCourses.map((course) => {
    const difference = course.suap - course.sistec;
    const percent = summary.suap ? Math.abs(difference) / summary.suap * 100 : 0;
    return `
      <article class="course-card distortion-course">
        <h3>${courseTitle(course)}</h3>
        <div class="course-metrics">
          <div class="metric-stack">
            <div class="metric-row"><small>Matriculados</small><strong>${formatNumber(course.suap)}</strong>${deltaBadge(Math.abs(difference), difference >= 0)}<span>Suap</span></div>
            <div class="metric-row"><small>Matriculados</small><strong>${formatNumber(course.sistec)}</strong>${deltaBadge(Math.abs(difference), difference <= 0)}<span>Sistec</span></div>
          </div>
          <div class="ring course-ring" style="--value:${Math.min(Math.round(percent), 100)}"><span>${Math.min(Math.round(percent), 100)}%</span></div>
        </div>
      </article>`;
  }).join("");

  divergenceContainer.innerHTML = filteredCourses.map((course) => {
    const maxDivergence = Math.max(course.suapOnly, course.sistecOnly);
    const percent = summary.suap ? maxDivergence / summary.suap * 100 : 0;
    return `
      <article class="course-card divergence-course">
        <h3>${courseTitle(course)}</h3>
        <div class="course-metrics">
          <div class="metric-stack">
            <div class="metric-row"><small>Matriculados</small><strong>${formatNumber(course.suapOnly)}</strong>${deltaBadge(Math.abs(course.suapOnly - course.sistecOnly), course.suapOnly >= course.sistecOnly)}<span>Suap/Sistec</span></div>
            <div class="metric-row"><small>Matriculados</small><strong>${formatNumber(course.sistecOnly)}</strong>${deltaBadge(Math.abs(course.sistecOnly - course.suapOnly), course.sistecOnly >= course.suapOnly)}<span>Sistec/Suap</span></div>
          </div>
          <div class="ring course-ring" style="--value:${Math.min(Math.round(percent), 100)}"><span>${Math.min(Math.round(percent), 100)}%</span></div>
        </div>
      </article>`;
  }).join("");
}

function getRowsForActiveTab() {
  const campusRows = students.filter((student) => student.campus === campusFilter.value);
  if (activeTab === "suap-only") return campusRows.filter((student) => student.inSuap && !student.inSistec);
  if (activeTab === "sistec-only") return campusRows.filter((student) => !student.inSuap && student.inSistec);
  if (activeTab === "suap-total") return campusRows.filter((student) => student.inSuap);
  return campusRows.filter((student) => student.inSistec);
}

function renderTable() {
  const query = studentSearch.value.trim().toLocaleLowerCase("pt-BR");
  currentRows = getRowsForActiveTab().filter((student) =>
    [student.registration, student.name, student.course].some((value) => value.toLocaleLowerCase("pt-BR").includes(query))
  );

  tableBody.innerHTML = currentRows.length
    ? currentRows.map((student) => `
      <tr>
        <td>${student.registration}</td>
        <td>${student.name}</td>
        <td>${student.cpf}</td>
        <td>${student.course}</td>
        <td><span class="status-pill">${student.suapStatus}</span></td>
        <td><span class="status-pill">${student.lastPeriod}</span></td>
        <td>${student.campus}</td>
        <td>${student.date}</td>
      </tr>`).join("")
    : `<tr><td colspan="8" class="empty-state">Nenhum registro localizado.</td></tr>`;

  document.querySelector("#table-result-count").textContent = `${currentRows.length} ${currentRows.length === 1 ? "resultado" : "resultados"}`;
  document.querySelector("#divergent-count").textContent = getRowsForActiveTab().length;
}

function renderNotification(summary) {
  const distortionPercent = summary.suap ? (summary.distortion / summary.suap * 100).toFixed(1).replace(".", ",") : "0,0";
  document.querySelector("#notification-summary").textContent = `No âmbito da Auditoria de Dados Acadêmicos, foi identificado que os cursos deste campus apresentam ${distortionPercent}% de distorção entre o quantitativo de matrículas registradas no SUAP e no SISTEC. Além disso, foram identificados ${summary.suapSistec}% de registros presentes no SUAP e não localizados no SISTEC e ${summary.sistecSuap}% na situação inversa.`;

  const campusSlug = campusNames[campusFilter.value].toLocaleLowerCase("pt-BR").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "");
  const email = campusFilter.value === "BAR" ? "coresbarreiras@ifba.edu.br" : `cores.${campusSlug}@ifba.edu.br`;
  const recipient = document.querySelector("#recipient-email");
  recipient.textContent = email;
  recipient.href = `mailto:${email}`;
}

function renderChart(containerId, values, labels) {
  const container = document.querySelector(containerId);
  const maxValue = Math.max(...values, 1);
  container.innerHTML = values.map((value, index) => {
    const height = Math.max(value / maxValue * 190, 2);
    return `<div class="bar-item" style="--height:${height}px"><b>${formatNumber(value)}</b><span>${labels[index]}</span></div>`;
  }).join("");
}

function renderCharts(summary) {
  const history = historySeries[campusFilter.value] ?? {
    dates: ["05/01", "12/01", "19/01", "26/01", "02/02", "09/02"],
    distortion: [summary.distortion + 34, summary.distortion + 21, summary.distortion + 15, summary.distortion + 8, summary.distortion + 3, summary.distortion],
    divergence: [summary.divergence + 19, summary.divergence + 14, summary.divergence + 10, summary.divergence + 6, summary.divergence + 2, summary.divergence],
  };
  renderChart("#distortion-chart", history.distortion, history.dates);
  renderChart("#divergence-chart", history.divergence, history.dates);
}

function renderDashboard() {
  const filteredCourses = getFilteredCourses();
  const summary = getSummary(filteredCourses);
  renderSummary(summary);
  renderCourseCards(filteredCourses, summary);
  renderTable();
  renderNotification(summary);
  renderCharts(summary);
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("is-visible");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 3200);
}

function downloadCurrentRows() {
  if (!currentRows.length) {
    showToast("Não há registros para exportar nesta visualização.");
    return;
  }
  const columns = ["Matrícula", "Nome", "CPF", "Curso", "Situação SUAP", "Último período", "Campus", "Data referência"];
  const data = currentRows.map((row) => [row.registration, row.name, row.cpf, row.course, row.suapStatus, row.lastPeriod, row.campus, row.date]);
  const csv = [columns, ...data].map((line) => line.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(";")).join("\n");
  const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `panda-${campusFilter.value}-${activeTab}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function updateEmailButton() {
  const firstFile = document.querySelector("#attachment-suap").files.length;
  const secondFile = document.querySelector("#attachment-sistec").files.length;
  document.querySelector("#send-email").disabled = !(firstFile && secondFile);
}

setCampusOptions();
renderDashboard();

[campusFilter, offerFilter, modeFilter].forEach((filter) => {
  filter.addEventListener("change", () => {
    studentSearch.value = "";
    renderDashboard();
  });
});

studentSearch.addEventListener("input", renderTable);

document.querySelector("#student-tabs").addEventListener("click", (event) => {
  const button = event.target.closest("button[data-tab]");
  if (!button) return;
  activeTab = button.dataset.tab;
  document.querySelectorAll("#student-tabs button").forEach((tab) => tab.setAttribute("aria-selected", String(tab === button)));
  studentSearch.value = "";
  renderTable();
});

document.querySelector("#download-csv").addEventListener("click", downloadCurrentRows);
document.querySelector("#refresh-table").addEventListener("click", () => {
  studentSearch.value = "";
  renderTable();
  showToast("Tabela atualizada com os dados demonstrativos.");
});

document.querySelector("#data-upload-button").addEventListener("click", () => document.querySelector("#data-upload").click());
document.querySelector("#data-upload").addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (file) showToast(`Arquivo “${file.name}” selecionado. Integre aqui o processamento dos dados.`);
});

["#attachment-suap", "#attachment-sistec"].forEach((selector) => document.querySelector(selector).addEventListener("change", updateEmailButton));
document.querySelector("#send-email").addEventListener("click", () => showToast("Protótipo pronto para integração ao serviço institucional de e-mail."));
