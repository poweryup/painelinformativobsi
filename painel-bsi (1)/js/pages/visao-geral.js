renderNav('index.html');

const T = DB.turmas;
const M = DB.meta;

// ---------- stat row ----------
(function(){
  const nProfs = new Set(T.map(t=>t.professor).filter(Boolean)).size;
  const nSalas = new Set(T.map(t=>t.sala).filter(s=>s && s!=='–')).size;
  const totalVagas = T.reduce((a,t)=>a+(t.vagas||0),0);
  const stats = [
    [T.length, 'turmas ofertadas'],
    [nProfs, 'docentes envolvidos'],
    [nSalas, 'salas/laboratórios'],
    [totalVagas, 'vagas totais'],
  ];
  document.getElementById('statRow').innerHTML = stats.map(([n,l])=>
    `<div class="stat"><span class="n">${n}</span><span class="l">${l}</span></div>`).join('');
})();

// ---------- heatmap sala x dia ----------
(function(){
  const salaList = uniqueSorted(T.map(t=>t.sala)).filter(s=>s && s!=='–');
  const counts = {};
  salaList.forEach(s=>{ counts[s]={}; DIAS.forEach(d=>counts[s][d]=0); });
  T.forEach(t=>{
    if(!t.sala || t.sala==='–') return;
    t.slots.forEach(s=>{ counts[t.sala][s.dia] = (counts[t.sala][s.dia]||0)+1; });
  });
  const max = Math.max(1, ...salaList.flatMap(s=>DIAS.map(d=>counts[s][d])));
  let head = '<div class="heat-head"><span></span>' + DIAS.map(d=>`<span>${d}</span>`).join('') + '</div>';
  let body = salaList.map(s=>{
    let row = `<div class="heat-row"><span class="rlabel">${esc(s)}</span>`;
    DIAS.forEach(d=>{
      const v = counts[s][d];
      const alpha = v===0 ? 0.04 : 0.18 + 0.7*(v/max);
      row += `<div class="heat-cell" style="background:rgba(204,154,50,${alpha})" title="${esc(s)} · ${DIA_NOME[d]}: ${v} turma(s)">${v||''}</div>`;
    });
    return row + '</div>';
  }).join('');
  document.getElementById('heatmapArea').innerHTML = head + '<div class="heatmap">' + body + '</div>';
})();

// ---------- carga por docente (top 10) ----------
(function(){
  const counts = {};
  T.forEach(t=>{ if(t.professor) counts[t.professor] = (counts[t.professor]||0)+1; });
  const entries = Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,10);
  const max = Math.max(...entries.map(e=>e[1]));
  document.getElementById('cargaBars').innerHTML = entries.map(([name,n])=>`
    <div class="bar-row">
      <span class="name" title="${esc(name)}">${esc(name)}</span>
      <div class="bar-track"><div class="bar-fill" style="width:${(n/max*100).toFixed(0)}%"></div></div>
      <span class="val">${n}</span>
    </div>`).join('');
})();

// ---------- curri compare ----------
(function(){
  const c = {ambas:0, somente_2008:0, somente_2023:0};
  T.forEach(t=>{ if(c[t.status_grade]!==undefined) c[t.status_grade]++; });
  const cards = [
    [c.ambas, 'nas duas grades'],
    [c.somente_2008, 'só 2008/1'],
    [c.somente_2023, 'só 2023/2'],
  ];
  document.getElementById('curriCompare').innerHTML = cards.map(([n,l])=>
    `<div class="curri-card"><div class="n">${n}</div><div class="l">${l}</div></div>`).join('');
})();

// ---------- barras CSS: turmas por período / vagas por sala ----------
(function(){
  const periodoCount = {};
  T.forEach(t=>{ const p = t.periodo_exibicao||'—'; periodoCount[p]=(periodoCount[p]||0)+1; });
  const perKeys = Object.keys(periodoCount).sort((a,b)=>periodoRank(a)-periodoRank(b));
  const maxP = Math.max(...perKeys.map(k=>periodoCount[k]));
  document.getElementById('periodoBars').innerHTML = perKeys.map(k=>`
    <div class="bar-row">
      <span class="name">${periodoShort(k)}</span>
      <div class="bar-track"><div class="bar-fill" style="width:${(periodoCount[k]/maxP*100).toFixed(0)}%"></div></div>
      <span class="val">${periodoCount[k]}</span>
    </div>`).join('');

  const bySala = {};
  T.forEach(t=>{ if(t.sala && t.sala!=='–') bySala[t.sala]=(bySala[t.sala]||0)+(t.vagas||0); });
  const sKeys = Object.keys(bySala).sort((a,b)=>bySala[b]-bySala[a]);
  const maxS = Math.max(...sKeys.map(k=>bySala[k]));
  document.getElementById('vagasSalaBars').innerHTML = sKeys.map(k=>`
    <div class="bar-row">
      <span class="name">${esc(k)}</span>
      <div class="bar-track"><div class="bar-fill brick" style="width:${(bySala[k]/maxS*100).toFixed(0)}%"></div></div>
      <span class="val">${bySala[k]}</span>
    </div>`).join('');
})();

// ---------- tiles ----------
(function(){
  const tiles = [
    {href:'horarios.html', tag:'Grade interativa', title:'Grade semanal', desc:'Clique numa aula para filtrar; ative o modo ociosidade para ver os horários livres em cada dia.'},
    {href:'salas.html', tag:'Ocupação', title:'Salas e laboratórios', desc:'Ranking de ocupação, versatilidade por sala e auditoria cruzada com a planilha "Mapa de salas".'},
    {href:'docentes.html', tag:'Carga docente', title:'Docentes', desc:'Ranking completo de turmas por professor(a), dia mais carregado de cada um e quem circula por mais salas.'},
    {href:'curriculo.html', tag:'2008/1 × 2023/2', title:'Currículo', desc:'Comparação entre a grade antiga e a nova, por período e por prefixo de código de disciplina.'},
    {href:'optativas.html', tag:'Pré-requisitos', title:'Optativas', desc:'Explorador de ementas com localizador reverso: marque o que já cursou e veja quais eletivas ficam liberadas.'},
  ];
  document.getElementById('tileGrid').innerHTML = tiles.map(t=>`
    <a class="tile" href="${t.href}">
      <span class="tile-tag">${t.tag}</span>
      <h3>${t.title}</h3>
      <p>${t.desc}</p>
    </a>`).join('');
})();
