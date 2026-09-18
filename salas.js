renderNav('salas.html');

const T = DB.turmas;
const M = DB.meta;

// ---------- stat row ----------
(function(){
  const salaList = uniqueSorted(T.map(t=>t.sala)).filter(s=>s!=='–');
  const totalVagas = T.filter(t=>t.sala && t.sala!=='–').reduce((a,t)=>a+(t.vagas||0),0);
  const stats = [
    [salaList.length, 'espaços distintos usados'],
    [M.conflitos_sala.length, 'conflitos de sala detectados'],
    [totalVagas, 'vagas somadas em sala'],
  ];
  document.getElementById('statRow').innerHTML = stats.map(([n,l])=>
    `<div class="stat"><span class="n">${n}</span><span class="l">${l}</span></div>`).join('');
})();

// ---------- ocupação ranking ----------
(function(){
  const list = [...M.ociosidade].sort((a,b)=>a.taxa-b.taxa);
  document.getElementById('ocupacaoBars').innerHTML = list.map(r=>`
    <div class="bar-row">
      <span class="name">${esc(r.sala)}</span>
      <div class="bar-track"><div class="bar-fill ${r.taxa<30?'ok':r.taxa>55?'brick':''}" style="width:${r.taxa}%"></div></div>
      <span class="val">${r.taxa}%</span>
    </div>`).join('');
})();

// ---------- versatilidade ----------
(function(){
  const list = M.room_versatility;
  const max = Math.max(...list.map(r=>r.n_disciplinas));
  document.getElementById('versatilidadeBars').innerHTML = list.map(r=>`
    <div class="bar-row">
      <span class="name">${esc(r.sala)}</span>
      <div class="bar-track"><div class="bar-fill" style="width:${(r.n_disciplinas/max*100).toFixed(0)}%"></div></div>
      <span class="val">${r.n_disciplinas}</span>
    </div>`).join('');
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

// ---------- audit cards ----------
(function(){
  const cards = [];
  if(M.conflitos_sala.length === 0){
    cards.push({cls:'ok', h:'Conflitos de sala', big:'0 encontrados',
      p:`Comparando todas as ${T.length} turmas, nenhuma sala aparece com duas alocações simultâneas no mesmo dia e horário.`});
  } else {
    cards.push({cls:'brick', h:'Conflitos de sala', big:`${M.conflitos_sala.length} encontrados`,
      p: M.conflitos_sala.map(c=>`${c.sala} · ${c.dia} ${c.hora}h: ${c.turmas.join(' + ')}`).join('; ')});
  }
  const idleTop = [...M.ociosidade].sort((a,b)=>a.taxa-b.taxa)[0];
  const busyTop = [...M.ociosidade].sort((a,b)=>b.taxa-a.taxa)[0];
  cards.push({cls:'', h:'Espaço mais ocioso', big:`${idleTop.sala} · ${idleTop.taxa}%`,
    p:`Ocupado em apenas ${idleTop.ocupados} dos ${idleTop.total} blocos possíveis da semana.`});
  cards.push({cls:'brick', h:'Espaço mais concorrido', big:`${busyTop.sala} · ${busyTop.taxa}%`,
    p:`Ocupado em ${busyTop.ocupados} dos ${busyTop.total} blocos possíveis — o espaço com menos horários vagos do curso.`});

  document.getElementById('auditGrid').innerHTML = cards.map(c=>`
    <div class="insight-card ${c.cls}"><h4>${c.h}</h4><div class="big">${c.big}</div><p>${c.p}</p></div>`).join('');
})();

// ---------- vida da sala ----------
(function(){
  const salaList = uniqueSorted(T.map(t=>t.sala)).filter(s=>s && s!=='–');
  fillSelect('fSalaVida', salaList);
  document.getElementById('fSalaVida').value = salaList[0];

  function render(){
    const sala = document.getElementById('fSalaVida').value;
    let html = '<thead><tr><th>Horário</th>' + DIAS.map(d=>`<th>${DIA_NOME[d]}</th>`).join('') + '</tr></thead><tbody>';
    HORAS.forEach(h=>{
      html += `<tr><td class="hourcell">${h}h–${h+2}h</td>`;
      DIAS.forEach(d=>{
        const items = T.filter(t=>t.sala===sala && t.slots.some(s=>s.dia===d && s.hora===h));
        let cell = '<td class="slot">';
        items.forEach(t=>{
          cell += `<div class="chip" style="cursor:default"><b>${esc(t.sigla_exibicao||t.nome_exibicao)}</b><span class="sub">${esc(t.professor||'')} · ${periodoShort(t.periodo_exibicao)}</span></div>`;
        });
        html += cell + '</td>';
      });
      html += '</tr>';
    });
    html += '</tbody>';
    document.getElementById('vidaTable').innerHTML = html;
  }
  document.getElementById('fSalaVida').addEventListener('change', render);
  render();
})();
