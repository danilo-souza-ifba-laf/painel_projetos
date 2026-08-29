const ABA_CURSOS = 'Cursos';
const ABA_LISTAS = 'Listas';

function doGet() {
  const planilha = SpreadsheetApp.getActiveSpreadsheet();
  const abaCursos = planilha.getSheetByName(ABA_CURSOS);
  if (!abaCursos) return respostaJson({ erro: `A aba ${ABA_CURSOS} não foi encontrada.` });

  const valores = abaCursos.getDataRange().getDisplayValues();
  if (valores.length < 2) return respostaJson({ data: [], atualizadoEm: new Date().toISOString() });

  const cabecalhos = valores.shift().map(normalizarCabecalho);
  const dados = valores.filter(linha => linha.some(celula => String(celula).trim() !== '')).map(linha =>
    cabecalhos.reduce((registro, chave, indice) => {
      registro[chave] = chave === 'progresso'
        ? Number(String(linha[indice]).replace('%', '').replace(',', '.'))
        : normalizarData(chave, linha[indice]);
      return registro;
    }, {})
  );

  return respostaJson({
    atualizadoEm: new Date().toISOString(),
    total: dados.length,
    listas: lerListas(planilha.getSheetByName(ABA_LISTAS)),
    data: dados
  });
}

function lerListas(aba) {
  if (!aba) return {};
  const valores = aba.getDataRange().getDisplayValues();
  if (valores.length < 2) return {};
  const cabecalhos = valores.shift().map(normalizarCabecalho);
  return cabecalhos.reduce((listas, chave, indice) => {
    listas[chave] = [...new Set(valores.map(linha => String(linha[indice] || '').trim()).filter(Boolean))];
    return listas;
  }, {});
}

function normalizarCabecalho(valor) {
  return String(valor).trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

function normalizarData(chave, valor) {
  if (!chave.startsWith('data_') && !chave.startsWith('entrada_') && !chave.startsWith('saida_') && chave !== 'prazo') return valor;
  const partes = String(valor).match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  return partes ? `${partes[3]}-${partes[2]}-${partes[1]}` : valor;
}

function respostaJson(conteudo) {
  return ContentService.createTextOutput(JSON.stringify(conteudo)).setMimeType(ContentService.MimeType.JSON);
}
