(function () {
 'use strict';
 const root = document.documentElement;
 const themes = ['industrial', 'if', 'mec'];
 const radios = Array.from(document.querySelectorAll('input[name="theme"]'));
 const picker = document.querySelector('.theme-picker');
 function applyTheme(theme) {
  if (!themes.includes(theme)) theme = 'industrial';
  root.dataset.theme = theme;
  radios.forEach(r => {r.checked = r.value === theme;});
  document.querySelector('meta[name="theme-color"]').content = {industrial:'#eee9e1',if:'#eef3ed',mec:'#eef3fa'}[theme];
  try { localStorage.setItem('danilo-portfolio-theme', theme); } catch (_) {}
 }
 let saved; try {saved = localStorage.getItem('danilo-portfolio-theme');} catch (_) {}
 applyTheme(saved);
 radios.forEach(r => r.addEventListener('change', () => {applyTheme(r.value); picker.open = false; picker.querySelector('summary').focus();}));
 document.addEventListener('click', e => {if (!picker.contains(e.target)) picker.open = false;});
 document.addEventListener('keydown', e => {if (e.key === 'Escape' && picker.open) {picker.open = false; picker.querySelector('summary').focus();}});
 const menu = document.querySelector('.menu-toggle');
 const nav = document.querySelector('.nav-links');
 function closeMenu(){nav.classList.remove('is-open');menu.setAttribute('aria-expanded','false');}
 menu.addEventListener('click', () => {const open = nav.classList.toggle('is-open');menu.setAttribute('aria-expanded',String(open));});
 nav.querySelectorAll('a').forEach(a => a.addEventListener('click',closeMenu));
 document.addEventListener('keydown', e => {if(e.key === 'Escape' && nav.classList.contains('is-open')){closeMenu();menu.focus();}});
 const filters = Array.from(document.querySelectorAll('[data-filter]'));
 const cards = Array.from(document.querySelectorAll('[data-categories]'));
 const search = document.querySelector('#project-search');
 const clear = document.querySelector('#clear-filters');
 let category = 'todos';
 const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
 function update(){
  const term = normalize(search.value.trim());let count = 0;
  cards.forEach(card => {const match = (category === 'todos' || card.dataset.categories.split(' ').includes(category)) && normalize(card.textContent).includes(term);card.hidden = !match;if(match) count++;});
  filters.forEach(b => {const active = b.dataset.filter === category;b.classList.toggle('is-active',active);b.setAttribute('aria-pressed',String(active));});
  document.querySelector('#project-count').textContent = count + (count === 1 ? ' projeto' : ' projetos');
  document.querySelector('#empty-projects').hidden = count !== 0;
  clear.hidden = category === 'todos' && !term;
 }
 filters.forEach(b => b.addEventListener('click',()=>{category=b.dataset.filter;update();}));
 search.addEventListener('input',update);
 clear.addEventListener('click',()=>{category='todos';search.value='';update();search.focus();});
 update();
})();
