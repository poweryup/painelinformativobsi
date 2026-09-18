renderNav('docentes.html');

const T = DB.turmas;
const M = DB.meta;

// ---------- stat row ----------
(function(){
  const profSet = new Set(T.map(t=>t.professor).filter(Boolean));
  const media = (T.length / profSet.size).toFixed(1);
  const multiSala = M.prof_dispersao.length;
  const stats = [
    [profSet.size, 'docentes com turma no semestre'],
    [media, 'turmas por docente, em média'],
    [multiSala, 'docentes em mais de uma sala'],
  ];
  document.getElementById('statRow').innerHTML = stats.map(([n,l])=>
    `<div class="stat"><span class="n">${n}</span><span class="l">${l}</span></div>`).join('');
})();

// ---------- carga por docente (todos, não só top 12) ----------
(function(){
  const counts = {};
  T.forEach(t=>{ if(t.professor) counts[t.professor] = (counts[t.professor]||0)+1; });
  const entries = Object.entries(counts).sort((a,b)=>b[1]-a[1]);
  const max = Math.max(...entries.map(e=>e[1]));
  document.getElementById('cargaBars').innerHTML = entries.map(([name,n])=>`
    <div class="bar-row">
      <span class="name" title="${esc(name)}">${esc(name)}</span>
      <div class="bar-track"><div class="bar-fill" style="width:${(n/max*100).toFixed(0)}%"></div></div>
      <span class="val">${n}</span>
    </div>`).join('');
})();

// ---------- maratona do dia (computada em runtime a partir de T, com fallback aos dados do build) ----------
(function(){
  const profDay = {};
  T.forEach(t=>{
    if(!t.professor) return;
    t.slots.forEach(s=>{
      profDay[t.professor] = profDay[t.professor] || {};
      profDay[t.professor][s.dia] = profDay[t.professor][s.dia] || [];
      profDay[t.professor][s.dia].push(s.hora);
    });
  });
  const rows = Object.entries(profDay).map(([prof, days])=>{
    let bestDay=null, bestHours=[];
    Object.entries(days).forEach(([d,hs])=>{
      hs = [...hs].sort((a,b)=>a-b);
      if(hs.length > bestHours.length){ bestDay=d; bestHours=hs; }
    });
    const janela = bestHours.length ? (Math.max(...bestHours)+2 - Math.min(...bestHours)) : 0;
    return {professor:prof, dia:bestDay, n:bestHours.length, janela, horas:bestHours};
  }).filter(r=>r.n>0).sort((a,b)=>b.n-a.n || b.janela-a.janela);

  document.getElementById('maratonaBody').innerHTML = rows.map(r=>`
    <tr>
      <td>${esc(r.professor)}</td>
      <td>${DIA_NOME[r.dia]}</td>
      <td style="font-family:var(--font-mono)">${r.n}</td>
      <td style="font-family:var(--font-mono)">${r.horas[0]}h–${Math.max(...r.horas)+2}h (${r.janela}h)</td>
    </tr>`).join('');
})();

// ---------- dispersão por salas ----------
(function(){
  const rows = M.prof_dispersao;
  document.getElementById('dispersaoBody').innerHTML = rows.map(r=>`
    <tr><td>${esc(r.professor)}</td><td style="font-family:var(--font-mono)">${r.n_salas}</td><td>${r.salas.join(', ')}</td></tr>
  `).join('') || `<tr><td colspan="3"><div class="empty-state">Todos os docentes lecionam numa única sala fixa.</div></td></tr>`;
})();

// ---------- título × grade ----------
(function(){
  const titulo = {};
  const profSet = new Set();
  T.forEach(t=>{
    if(!t.professor || profSet.has(t.professor)) return;
    profSet.add(t.professor);
    const k = t.professor.startsWith('Profª') ? 'Profª' : t.professor.startsWith('Prof.') ? 'Prof.' : 'Outro';
    titulo[k] = (titulo[k]||0)+1;
  });
  const gradeCount = {ambas:0, somente_2008:0, somente_2023:0};
  T.forEach(t=>{ if(gradeCount[t.status_grade]!==undefined) gradeCount[t.status_grade]++; });

  const cards = [
    [titulo['Prof.']||0, 'Docentes registrados como "Prof."'],
    [titulo['Profª']||0, 'Docentes registradas como "Profª"'],
    [gradeCount.ambas, 'Turmas com equivalência nas duas grades'],
    [gradeCount.somente_2008 + gradeCount.somente_2023, 'Turmas exclusivas de uma grade'],
  ];
  document.getElementById('tituloCards').innerHTML = cards.map(([n,l])=>
    `<div class="curri-card"><div class="n">${n}</div><div class="l">${l}</div></div>`).join('');
})();
