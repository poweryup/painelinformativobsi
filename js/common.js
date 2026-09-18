// ===========================================================
// Utilidades e navegação compartilhadas entre as páginas
// ===========================================================
const DIAS = ['2ª','3ª','4ª','5ª','6ª','Sáb.'];
const DIA_NOME = {'2ª':'Segunda','3ª':'Terça','4ª':'Quarta','5ª':'Quinta','6ª':'Sexta','Sáb.':'Sábado'};
const HORAS = [8,14,16,18,20];
const HORAS_PADRAO = new Set([14,16,18,20]);

const PAGES = [
  {href:'index.html', label:'Visão geral'},
  {href:'horarios.html', label:'Grade semanal'},
  {href:'salas.html', label:'Salas'},
  {href:'docentes.html', label:'Docentes'},
  {href:'curriculo.html', label:'Currículo'},
  {href:'optativas.html', label:'Optativas'},
];

function renderNav(active){
  const nav = document.createElement('nav');
  nav.className = 'topnav';
  const here = active || location.pathname.split('/').pop() || 'index.html';
  nav.innerHTML = `<div class="wrap">
    <span class="brand">BSI <span>2026.2</span></span>
    ${PAGES.map(p=>`<a class="navlink ${p.href===here?'active':''}" href="${p.href}">${p.label}</a>`).join('')}
  </div>`;
  document.body.prepend(nav);
}

function horariosStr(t){
  return t.slots.map(s => `${s.dia} ${s.hora}h`).join(' · ') || '—';
}

function periodoRank(v){ if(v==='A') return 900; if(v==='O') return 901; return parseInt(v)||0; }
function periodoLabel(v){ return v==='A' ? 'Atividade complementar/extensão' : v==='O' ? 'Optativa' : `${v}º período`; }
function periodoShort(v){ return v==='A' ? 'Ativ.' : v==='O' ? 'Optativa' : `${v}º`; }

function uniqueSorted(arr){ return [...new Set(arr.filter(Boolean))].sort((a,b)=>a.localeCompare(b,'pt')); }

function fillSelect(id, items, labelFn){
  const el = document.getElementById(id);
  if(!el) return;
  items.forEach(v=>{
    const o=document.createElement('option');
    o.value=v; o.textContent = labelFn?labelFn(v):v;
    el.appendChild(o);
  });
}

// escape helper for safe text injection in title attrs etc.
function esc(s){
  return (s===null||s===undefined) ? '' : String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');
}
