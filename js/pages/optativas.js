renderNav('optativas.html');

const O = DB.optativas;
const M = DB.meta;

// ---------- stat row ----------
(function(){
  const stats = [
    [O.length, 'optativas mapeadas'],
    [M.prereq_rank.length, 'disciplinas distintas usadas como pré-requisito'],
    [M.prereq_rank[0].n_optativas, `optativas destravadas por "${M.prereq_rank[0].nome}"`],
  ];
  document.getElementById('statRow').innerHTML = stats.map(([n,l])=>
    `<div class="stat"><span class="n">${n}</span><span class="l">${l}</span></div>`).join('');
})();

// ---------- prereq bottleneck bars ----------
(function(){
  const list = M.prereq_rank.slice(0, 12);
  const max = Math.max(...list.map(r=>r.n_optativas));
  document.getElementById('prereqBars').innerHTML = list.map(r=>`
    <div class="bar-row">
      <span class="name" title="${esc(r.nome)}">${esc(r.nome)}</span>
      <div class="bar-track"><div class="bar-fill brick" style="width:${(r.n_optativas/max*100).toFixed(0)}%"></div></div>
      <span class="val">${r.n_optativas}</span>
    </div>`).join('');
})();

// ---------- checklist + reverse lookup ----------
let gradeMode = 'new'; // 'new' | 'old'
let checked = new Set();
let search = '';

function slug(s){ return String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9]+/g,'-'); }
function reqsFor(o){ return gradeMode==='new' ? o.new_reqs : o.old_reqs; }
function nameFor(o){ return gradeMode==='new' ? o.new_nome : o.old_nome; }
function codFor(o){ return gradeMode==='new' ? o.new_cod : o.old_cod; }

function allPrereqs(){
  const map = new Map();
  O.forEach(o=>reqsFor(o).forEach(r=>{
    const key = r.cod || r.nome;
    if(!map.has(key)) map.set(key, r.nome);
  }));
  return [...map.entries()].sort((a,b)=>a[1].localeCompare(b[1],'pt'));
}

function renderChecklist(){
  const items = allPrereqs();
  document.getElementById('checklist').innerHTML = items.map(([key,nome])=>`
    <label><input type="checkbox" data-key="${esc(key)}" ${checked.has(key)?'checked':''}> ${esc(nome)}</label>
  `).join('');
  document.querySelectorAll('#checklist input').forEach(cb=>{
    cb.addEventListener('change', ()=>{
      const k = cb.getAttribute('data-key');
      if(cb.checked) checked.add(k); else checked.delete(k);
      renderElectives();
    });
  });
}

function renderElectives(){
  let list = O.slice();
  if(search){
    const s = search.toLowerCase();
    list = list.filter(o => [nameFor(o), o.professor, o.ementa, o.old_nome, o.new_nome].join(' ').toLowerCase().includes(s));
  }
  list = list.map(o=>{
    const reqs = reqsFor(o);
    const met = reqs.filter(r=>checked.has(r.cod || r.nome)).length;
    const eligible = reqs.length===0 || met===reqs.length;
    return {o, reqs, met, eligible};
  }).sort((a,b)=> (b.eligible - a.eligible) || (b.met - a.met));

  document.getElementById('electiveList').innerHTML = list.map(({o,reqs,met,eligible})=>`
    <div class="elective-card ${eligible?'eligible':'locked'}">
      <h4>${esc(nameFor(o)) || '(sem nome nesta grade)'}</h4>
      <div class="meta">${esc(codFor(o))||''} · ${esc(o.professor)||'professor(a) a definir'} ${eligible ? '· <b style="color:var(--ok)">liberada</b>' : reqs.length ? `· ${met}/${reqs.length} pré-requisitos cumpridos` : ''}</div>
      <div class="reqlist">
        ${reqs.map(r=>`<span class="req-chip ${checked.has(r.cod||r.nome)?'met':'unmet'}">${esc(r.cod||'')} ${esc(r.nome)}</span>`).join('') || '<span class="req-chip met">sem pré-requisito listado</span>'}
      </div>
      ${o.ementa ? `<button class="toggle-ementa" data-id="${slug(codFor(o)||nameFor(o))}">ver ementa</button><div class="ementa" id="ementa-${slug(codFor(o)||nameFor(o))}">${esc(o.ementa)}</div>` : ''}
    </div>
  `).join('') || `<div class="empty-state">Nenhuma optativa corresponde à busca.</div>`;

  document.querySelectorAll('.toggle-ementa').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const el = document.getElementById('ementa-'+btn.getAttribute('data-id'));
      el.classList.toggle('open');
      btn.textContent = el.classList.contains('open') ? 'ocultar ementa' : 'ver ementa';
    });
  });
}

document.getElementById('fGradeToggle').addEventListener('change', e=>{
  gradeMode = e.target.value; checked = new Set();
  renderChecklist(); renderElectives();
});
document.getElementById('fSearch').addEventListener('input', e=>{ search = e.target.value; renderElectives(); });

renderChecklist();
renderElectives();
