renderNav('curriculo.html');

const T = DB.turmas;

// ---------- stat row ----------
(function(){
  const c = {ambas:0, somente_2008:0, somente_2023:0};
  T.forEach(t=>{ if(c[t.status_grade]!==undefined) c[t.status_grade]++; });
  const stats = [
    [T.length, 'turmas no semestre'],
    [c.ambas, 'com equivalência direta'],
    [c.somente_2008 + c.somente_2023, 'exclusivas de uma grade'],
  ];
  document.getElementById('statRow').innerHTML = stats.map(([n,l])=>
    `<div class="stat"><span class="n">${n}</span><span class="l">${l}</span></div>`).join('');
})();

// ---------- curri compare ----------
(function(){
  const c = {ambas:0, somente_2008:0, somente_2023:0};
  T.forEach(t=>{ if(c[t.status_grade]!==undefined) c[t.status_grade]++; });
  const cards = [
    [c.ambas, 'Disciplinas presentes nas duas grades'],
    [c.somente_2008, 'Só existem na grade antiga (2008/1)'],
    [c.somente_2023, 'Só existem na grade nova (2023/2)'],
  ];
  document.getElementById('curriCompare').innerHTML = cards.map(([n,l])=>
    `<div class="curri-card"><div class="n">${n}</div><div class="l">${l}</div></div>`).join('');
})();

// ---------- barras CSS: por prefixo / por período ----------
(function(){
  const prefixCount = {};
  T.forEach(t=>{
    [t.old_cod, t.new_cod].forEach(c=>{
      if(!c) return;
      const m = c.match(/^[A-Z]+/);
      if(m) prefixCount[m[0]] = (prefixCount[m[0]]||0)+1;
    });
  });
  const pKeys = Object.keys(prefixCount).sort((a,b)=>prefixCount[b]-prefixCount[a]);
  const maxPfx = Math.max(...pKeys.map(k=>prefixCount[k]));
  document.getElementById('prefixoBars').innerHTML = pKeys.map(k=>`
    <div class="bar-row">
      <span class="name">${k}</span>
      <div class="bar-track"><div class="bar-fill" style="width:${(prefixCount[k]/maxPfx*100).toFixed(0)}%"></div></div>
      <span class="val">${prefixCount[k]}</span>
    </div>`).join('');

  const periodoCount = {};
  T.forEach(t=>{ const p = t.periodo_exibicao||'—'; periodoCount[p]=(periodoCount[p]||0)+1; });
  const perKeys = Object.keys(periodoCount).sort((a,b)=>periodoRank(a)-periodoRank(b));
  const maxPer = Math.max(...perKeys.map(k=>periodoCount[k]));
  document.getElementById('periodoBars').innerHTML = perKeys.map(k=>`
    <div class="bar-row">
      <span class="name">${periodoShort(k)}</span>
      <div class="bar-track"><div class="bar-fill brick" style="width:${(periodoCount[k]/maxPer*100).toFixed(0)}%"></div></div>
      <span class="val">${periodoCount[k]}</span>
    </div>`).join('');
})();

// ---------- equivalence table ----------
let state = { search:'', grade:'' };
function applyFilters(){
  return T.filter(t=>{
    if(state.grade && t.status_grade !== state.grade) return false;
    if(state.search){
      const s = state.search.toLowerCase();
      const hay = [t.old_nome, t.old_sigla, t.old_cod, t.new_nome, t.new_sigla, t.new_cod].join(' ').toLowerCase();
      if(!hay.includes(s)) return false;
    }
    return true;
  });
}
function renderTable(){
  const rows = applyFilters();
  document.getElementById('tableBody').innerHTML = rows.map(t=>{
    const tag = t.status_grade==='ambas' ? '<span class="tag ambas">ambas</span>' :
                t.status_grade==='somente_2008' ? '<span class="tag somente_2008">só 2008/1</span>' :
                t.status_grade==='somente_2023' ? '<span class="tag somente_2023">só 2023/2</span>' : '';
    return `<tr>
      <td>${esc(t.old_nome)||'—'}</td><td style="font-family:var(--font-mono)">${esc(t.old_sigla)||'—'}</td><td style="font-family:var(--font-mono)">${esc(t.old_cod)||'—'}</td>
      <td>${esc(t.new_nome)||'—'}</td><td style="font-family:var(--font-mono)">${esc(t.new_sigla)||'—'}</td><td style="font-family:var(--font-mono)">${esc(t.new_cod)||'—'}</td>
      <td>${tag}</td>
    </tr>`;
  }).join('') || `<tr><td colspan="7"><div class="empty-state">Nenhuma disciplina corresponde à busca.</div></td></tr>`;
  document.getElementById('filterCount').textContent = `${rows.length} de ${T.length} turmas`;
}
document.getElementById('fSearch').addEventListener('input', e=>{ state.search=e.target.value; renderTable(); });
document.getElementById('fGrade').addEventListener('change', e=>{ state.grade=e.target.value; renderTable(); });
renderTable();
