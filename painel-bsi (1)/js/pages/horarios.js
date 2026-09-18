renderNav('horarios.html');

const RAW = DB.turmas;
RAW.forEach(t => { t.horarios = horariosStr(t); });

const periodos = uniqueSorted(RAW.map(t=>t.periodo_exibicao)).sort((a,b)=>periodoRank(a)-periodoRank(b));
const salas = uniqueSorted(RAW.map(t=>t.sala)).filter(s=>s!=='–');
const profs = uniqueSorted(RAW.map(t=>t.professor));

fillSelect('fPeriodo', periodos, periodoLabel);
fillSelect('fSala', salas);
fillSelect('fProf', profs);

let state = { search:'', periodo:'', sala:'', prof:'', slotKey:null, ociosidade:false };
let sortKey = 'periodo_exibicao', sortDir = 1;

function applyFilters(){
  return RAW.filter(t=>{
    if(state.search){
      const s = state.search.toLowerCase();
      const hay = [t.nome_exibicao, t.sigla_exibicao, t.new_cod, t.old_cod, t.professor, t.old_nome, t.new_nome].join(' ').toLowerCase();
      if(!hay.includes(s)) return false;
    }
    if(state.periodo && t.periodo_exibicao !== state.periodo) return false;
    if(state.sala && t.sala !== state.sala) return false;
    if(state.prof && t.professor !== state.prof) return false;
    if(state.slotKey){
      const [d,h] = state.slotKey.split('|');
      if(!t.slots.some(s=>s.dia===d && s.hora===parseInt(h))) return false;
    }
    return true;
  });
}

function renderSchedule(){
  const rows = applyFilters();
  let html = '<thead><tr><th>Horário</th>' + DIAS.map(d=>`<th>${DIA_NOME[d]}</th>`).join('') + '</tr></thead><tbody>';
  HORAS.forEach(h=>{
    html += `<tr><td class="hourcell">${h}h–${h+2}h</td>`;
    DIAS.forEach(d=>{
      const key = `${d}|${h}`;
      const items = rows.filter(t=>t.slots.some(s=>s.dia===d && s.hora===h));
      let cell;
      if(state.ociosidade){
        const idle = items.length===0;
        cell = `<td class="slot ${idle?'idle':''}" data-key="${key}">`;
        cell += idle ? `<span class="idle-tag">livre</span>` : items.map(t=>`<span class="idle-tag" style="color:var(--muted)">ocupado · ${t.sigla_exibicao}</span>`).join('');
      } else {
        cell = `<td class="slot" data-key="${key}">`;
        items.forEach(t=>{
          const cls = t.periodo_exibicao==='O' ? 'optativa' : (t.periodo_exibicao==='A' ? 'atividade' : '');
          const isActive = state.slotKey===key ? 'active' : '';
          cell += `<button class="chip ${cls} ${isActive}" data-slot="${key}" data-id="${t.id}"><b>${esc(t.sigla_exibicao||t.nome_exibicao)}</b><span class="sub">${esc(t.professor||'')} · ${esc(t.sala||'—')}</span></button>`;
        });
      }
      cell += '</td>';
      html += cell;
    });
    html += '</tr>';
  });
  html += '</tbody>';
  document.getElementById('scheduleTable').innerHTML = html;

  document.querySelectorAll('.chip').forEach(ch=>{
    ch.addEventListener('click', ()=>{
      const key = ch.getAttribute('data-slot');
      state.slotKey = (state.slotKey===key) ? null : key;
      renderAll();
    });
  });

  const totalSlots = DIAS.length * HORAS.length;
  const occupiedSlots = new Set();
  rows.forEach(t=>t.slots.forEach(s=>occupiedSlots.add(s.dia+'|'+s.hora)));
  document.getElementById('gridTitle').textContent = state.ociosidade ? 'Modo ociosidade — horários livres' : 'Grade semanal';
  document.getElementById('gridHint').textContent = state.ociosidade
    ? `${totalSlots - occupiedSlots.size} de ${totalSlots} blocos livres no filtro atual`
    : 'clique numa aula para filtrar a tabela abaixo';
}

function renderTable(rows){
  const sorted = [...rows].sort((a,b)=>{
    let av=a[sortKey], bv=b[sortKey];
    if(sortKey==='periodo_exibicao'){ av=periodoRank(a.periodo_exibicao); bv=periodoRank(b.periodo_exibicao); }
    if(sortKey==='vagas'){ av=a.vagas||0; bv=b.vagas||0; }
    if(typeof av==='string') av=av.toLowerCase(); if(typeof bv==='string') bv=bv.toLowerCase();
    if(av===undefined||av===null) av=''; if(bv===undefined||bv===null) bv='';
    if(av<bv) return -1*sortDir; if(av>bv) return 1*sortDir; return 0;
  });
  const body = document.getElementById('tableBody');
  if(sorted.length===0){
    body.innerHTML = `<tr><td colspan="8"><div class="empty-state">Nenhuma turma corresponde aos filtros selecionados.</div></td></tr>`;
    document.getElementById('filterCount').textContent = '';
    document.getElementById('tableHint').textContent = '';
    return;
  }
  body.innerHTML = sorted.map(t=>{
    const per = periodoShort(t.periodo_exibicao);
    const gradeTag = t.status_grade==='ambas' ? '<span class="tag ambas">ambas</span>' :
                      t.status_grade==='somente_2008' ? '<span class="tag somente_2008">só 2008/1</span>' :
                      t.status_grade==='somente_2023' ? '<span class="tag somente_2023">só 2023/2</span>' : '';
    return `<tr>
      <td>${per}</td><td>${esc(t.nome_exibicao)||'—'}</td>
      <td style="font-family:var(--font-mono)">${esc(t.sigla_exibicao)||'—'}</td>
      <td>${esc(t.professor)||'—'}</td>
      <td style="font-family:var(--font-mono)">${t.horarios}</td>
      <td>${esc(t.sala)||'—'}</td>
      <td style="font-family:var(--font-mono)">${t.vagas ?? '—'}</td>
      <td>${gradeTag}</td>
    </tr>`;
  }).join('');
  document.getElementById('filterCount').textContent = `${rows.length} de ${RAW.length} turmas`;
  document.getElementById('tableHint').textContent = `${rows.length} turma(s) listada(s)`;
}

document.getElementById('fSearch').addEventListener('input', e=>{ state.search=e.target.value; renderAll(); });
document.getElementById('fPeriodo').addEventListener('change', e=>{ state.periodo=e.target.value; renderAll(); });
document.getElementById('fSala').addEventListener('change', e=>{ state.sala=e.target.value; renderAll(); });
document.getElementById('fProf').addEventListener('change', e=>{ state.prof=e.target.value; renderAll(); });
document.getElementById('fOciosidade').addEventListener('change', e=>{ state.ociosidade=e.target.checked; state.slotKey=null; renderAll(); });
document.getElementById('btnReset').addEventListener('click', ()=>{
  state = { search:'', periodo:'', sala:'', prof:'', slotKey:null, ociosidade:false };
  document.getElementById('fSearch').value='';
  document.getElementById('fPeriodo').value='';
  document.getElementById('fSala').value='';
  document.getElementById('fProf').value='';
  document.getElementById('fOciosidade').checked=false;
  renderAll();
});
document.querySelectorAll('table.data th[data-key]').forEach(th=>{
  th.addEventListener('click', ()=>{
    const k = th.getAttribute('data-key');
    if(sortKey===k) sortDir*=-1; else { sortKey=k; sortDir=1; }
    renderTable(applyFilters());
  });
});

function renderAll(){
  const rows = applyFilters();
  renderSchedule();
  renderTable(rows);
}
renderAll();
