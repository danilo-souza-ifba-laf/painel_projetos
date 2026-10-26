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
    $('ato').textContent = campus.ato;
    $('documento').href = campus.url;
    $('detalhes').showModal();
  }
  function botao(texto, classe, acao) {
    const b = document.createElement('button');
    b.type = 'button'; b.className = classe; b.textContent = texto;
    b.addEventListener('click', acao);
    return b;
  }
  for (const campus of campi) {
    const ponto = botao('', 'ponto', () => abrir(campus));
    ponto.style.top = `${campus.top}%`; ponto.style.left = `${campus.left}%`;
    ponto.style.setProperty('--cor', campus.cor);
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
    $('lista').append(card); elementos.push({campus, ponto, card});
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
    elementos.forEach(({campus,ponto,card}) => {
      const visivel = (filtro === 'todos' || campus.tipologia === filtro) && normalizar(campus.nome).includes(busca);
      ponto.hidden = card.hidden = !visivel; if (visivel) total++;
    });
    document.querySelectorAll('[data-tipo]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.tipo === filtro)));
    $('resultado').textContent = `${total} de ${campi.length} campi encontrados`;
    $('vazio').hidden = total !== 0;
  }
  document.querySelectorAll('[data-vista]').forEach(b => b.addEventListener('click', () => {
    document.querySelectorAll('[data-vista]').forEach(outro => outro.setAttribute('aria-pressed', String(outro === b)));
    $('mapa').hidden = b.dataset.vista !== 'mapa'; $('lista').hidden = b.dataset.vista !== 'lista';
  }));
  $('busca').addEventListener('input', atualizar);
  $('fechar').addEventListener('click', () => $('detalhes').close());
  $('detalhes').addEventListener('click', e => {
    const r = $('detalhes').getBoundingClientRect();
    if (e.target === $('detalhes') && (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom)) $('detalhes').close();
  });
  atualizar();
})();
