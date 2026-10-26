(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const normalizar = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR');
  const campi = [...CAMPI].sort((a,b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  let filtro = 'todos';
  const elementos = [];
  function abrir(campus) {
    $('titulo').textContent = `Campus ${campus.nome}`;
    $('badge').textContent = `Tipologia ${campus.tipologia}`;
    $('badge').style.color = campus.cor;
    $('badge').style.background = campus.fundo;
    $('ato').replaceChildren(linksAtos(campus));
    $('detalhes').showModal();
  }
  function botao(texto, classe, acao) {
    const b = document.createElement('button');
    b.type = 'button'; b.className = classe; b.textContent = texto;
    b.addEventListener('click', acao);
    return b;
  }
  function linksAtos(campus) {
    const lista = document.createElement('ul');
    lista.className = 'atos-lista';
    for (const ato of campus.atos) {
      const item = document.createElement('li');
      const link = document.createElement('a');
      link.textContent = ato.titulo;
      link.href = ato.url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.setAttribute('aria-label', `${ato.titulo} — Campus ${campus.nome} (abre em nova aba)`);
      item.append(link);
      if (ato.observacao) item.append(document.createTextNode(` — ${ato.observacao}`));
      lista.append(item);
    }
    return lista;
  }
  function mudarVista(vista) {
    document.querySelectorAll('[data-vista]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.vista === vista)));
    ['mapa', 'lista', 'tabela'].forEach(id => { $(id).hidden = id !== vista; });
  }
  for (const campus of campi) {
    const ponto = botao('', 'ponto', () => abrir(campus));
    ponto.style.top = `${campus.top}%`; ponto.style.left = `${campus.left}%`;
    ponto.style.setProperty('--cor', campus.cor);
    ponto.dataset.tipologia = campus.tipologia;
    const pin = document.createElement('img');
    pin.src = 'assets/ifba-pin.png';
    pin.alt = '';
    pin.className = 'pin-imagem';
    pin.setAttribute('aria-hidden', 'true');
    ponto.append(pin);
    ponto.setAttribute('aria-label', `Campus ${campus.nome}, tipologia ${campus.tipologia}`);
    ponto.setAttribute('aria-haspopup', 'dialog');
    const tooltip = document.createElement('span');
    tooltip.className = 'tooltip'; tooltip.textContent = campus.nome;
    tooltip.setAttribute('aria-hidden','true'); ponto.append(tooltip);
    $('pontos').append(ponto);
    const card = botao('', 'campus-card', () => abrir(campus));
    card.setAttribute('aria-haspopup','dialog');
    const simbolo = document.createElement('span');
    simbolo.className = 'campus-simbolo';
    simbolo.setAttribute('aria-hidden', 'true');
    const imagem = document.createElement('img');
    imagem.src = 'assets/ifba-marca.png';
    imagem.alt = '';
    imagem.loading = 'lazy';
    simbolo.append(imagem);
    card.append(simbolo);
    const nome = document.createElement('strong'); nome.textContent = campus.nome;
    const tipo = document.createElement('span'); tipo.textContent = `Tipologia ${campus.tipologia} ↗`;
    card.style.setProperty('--cor', campus.cor); card.append(nome, tipo);
    $('lista').append(card);
    const linha = document.createElement('tr');
    const campusCelula = document.createElement('th');
    campusCelula.scope = 'row';
    campusCelula.append(botao(campus.nome, 'campus-tabela', () => abrir(campus)));
    const atosCelula = document.createElement('td'); atosCelula.append(linksAtos(campus));
    const tipoCelula = document.createElement('td');
    const badge = document.createElement('span'); badge.className = 'tipo-tabela';
    badge.textContent = campus.tipologia; badge.style.color = campus.cor; badge.style.background = campus.fundo;
    tipoCelula.append(badge);
    const localCelula = document.createElement('td');
    const localizar = botao('Ver no mapa', 'localizar-campus', () => {
      mudarVista('mapa');
      document.querySelectorAll('.ponto.selecionado').forEach(p => p.classList.remove('selecionado'));
      ponto.classList.add('selecionado');
      ponto.scrollIntoView({block: 'center', inline: 'nearest'});
      ponto.focus({preventScroll: true});
    });
    localizar.setAttribute('aria-label', `Localizar Campus ${campus.nome} no mapa`);
    localCelula.append(localizar); linha.append(campusCelula, atosCelula, tipoCelula, localCelula);
    $('tabela-campi').append(linha);
    elementos.push({campus, ponto, card, linha});
  }
  for (const tipo of ['todos','350/200','90/60','70/45','40/26']) {
    const grupo = campi.filter(c => tipo === 'todos' || c.tipologia === tipo);
    const b = botao(`${tipo === 'todos' ? 'Todos os campi' : `Tipologia ${tipo}`} (${grupo.length})`, 'filtro', () => { filtro = tipo; atualizar(); });
    b.dataset.tipo = tipo; b.setAttribute('aria-pressed', String(tipo === filtro));
    if (tipo !== 'todos') b.style.setProperty('--cor', grupo[0].cor);
    $('filtros').append(b);
  }
  function atualizar() {
    const busca = normalizar($('busca').value.trim()); let total = 0;
    elementos.forEach(({campus,ponto,card,linha}) => {
      const visivel = (filtro === 'todos' || campus.tipologia === filtro) && normalizar(campus.nome).includes(busca);
      ponto.hidden = card.hidden = linha.hidden = !visivel; if (visivel) total++;
    });
    document.querySelectorAll('[data-tipo]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.tipo === filtro)));
    $('resultado').textContent = `${total} de ${campi.length} campi encontrados`;
    $('vazio').hidden = total !== 0;
  }
  document.querySelectorAll('[data-vista]').forEach(b => b.addEventListener('click', () => {
    mudarVista(b.dataset.vista);
  }));
  $('busca').addEventListener('input', atualizar);
  $('fechar').addEventListener('click', () => $('detalhes').close());
  $('detalhes').addEventListener('click', e => {
    const r = $('detalhes').getBoundingClientRect();
    if (e.target === $('detalhes') && (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom)) $('detalhes').close();
  });
  atualizar();
})();
