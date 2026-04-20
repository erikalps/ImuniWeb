/* ═══════════════════════════════════════════════
   ImuniWeb — script.js
   Lógica: consulta, timeline, caderneta, drawer
   ═══════════════════════════════════════════════ */

'use strict';

// ── ESTADO ──────────────────────────────────────
let unidade         = 'meses';   // 'meses' | 'anos'
let filtroAtivo     = 'todos';   // 'todos' | 'ob' | 'rec'
let vacinasResult   = [];        // resultado da última consulta
let caderneta       = {};        // { [id]: boolean }

// ── BASE DE DADOS ────────────────────────────────
const VACINAS = [
  {
    id: 'bcg',
    nome: 'BCG',
    tipo: 'ob',
    protege: 'Tuberculose meníngea e miliar',
    doses: ['Dose única ao nascer'],
    rec: 'Aplicada preferencialmente na maternidade logo após o nascimento.',
    faixas: [{ min: 0, max: 1 }],
    fase: 'Nascimento',
  },
  {
    id: 'hepb',
    nome: 'Hepatite B',
    tipo: 'ob',
    protege: 'Hepatite B viral (doença hepática grave)',
    doses: ['Ao nascer', '2 meses', '4 meses', '6 meses'],
    rec: '1ª dose nas primeiras 12h de vida. Demais doses com a pentavalente.',
    faixas: [{ min: 0, max: 12 }],
    fase: 'Nascimento',
  },
  {
    id: 'penta',
    nome: 'Pentavalente (DTP + Hib + HepB)',
    tipo: 'ob',
    protege: 'Difteria, tétano, coqueluche, meningite por Hib e Hepatite B',
    doses: ['2 meses', '4 meses', '6 meses'],
    rec: 'Série primária de 3 doses. Reforços com DTP aos 15 meses e 4 anos.',
    faixas: [{ min: 2, max: 6 }],
    fase: 'Primeiros meses',
  },
  {
    id: 'vip',
    nome: 'VIP (Poliomielite Inativada)',
    tipo: 'ob',
    protege: 'Poliomielite — paralisia infantil',
    doses: ['2 meses', '4 meses', '6 meses'],
    rec: 'Nas 3 doses primárias. Reforços com VOP oral.',
    faixas: [{ min: 2, max: 6 }],
    fase: 'Primeiros meses',
  },
  {
    id: 'rota',
    nome: 'Rotavírus (VORH)',
    tipo: 'ob',
    protege: 'Gastroenterite grave por rotavírus',
    doses: ['2 meses', '4 meses'],
    rec: '1ª dose até 3m15d. 2ª dose até 7m29d. Não aplicar fora dessa janela.',
    faixas: [{ min: 2, max: 7 }],
    fase: 'Primeiros meses',
  },
  {
    id: 'pnc10',
    nome: 'Pneumocócica 10-valente',
    tipo: 'ob',
    protege: 'Pneumonia, meningite e otite por pneumococo',
    doses: ['3 meses', '5 meses', 'Reforço 12 meses'],
    rec: 'Esquema 2+1: duas doses no 1º ano e reforço entre 12–15 meses.',
    faixas: [{ min: 3, max: 15 }],
    fase: 'Primeiros meses',
  },
  {
    id: 'menC',
    nome: 'Meningocócica C',
    tipo: 'ob',
    protege: 'Doença meningocócica do sorogrupo C',
    doses: ['3 meses', '5 meses', 'Reforço 12 meses'],
    rec: 'Esquema 2+1 com reforço no 2º ano de vida.',
    faixas: [{ min: 3, max: 15 }],
    fase: 'Primeiros meses',
  },
  {
    id: 'fa',
    nome: 'Febre Amarela',
    tipo: 'ob',
    protege: 'Febre amarela (doença viral hemorrágica)',
    doses: ['9 meses', 'Reforço 4 anos'],
    rec: 'Uma dose de reforço aos 4 anos. Após os 5 anos: dose única vitalícia.',
    faixas: [{ min: 9, max: 108 }],
    fase: '2º semestre de vida',
  },
  {
    id: 'scr',
    nome: 'Tríplice Viral (SCR)',
    tipo: 'ob',
    protege: 'Sarampo, caxumba e rubéola',
    doses: ['12 meses', '15 meses'],
    rec: '2 doses para proteção plena. A 2ª dose é a Tetra Viral.',
    faixas: [{ min: 12, max: 15 }],
    fase: '1 ano',
  },
  {
    id: 'hepA',
    nome: 'Hepatite A',
    tipo: 'ob',
    protege: 'Hepatite A viral',
    doses: ['15 meses'],
    rec: 'Dose única aos 15 meses. Para adultos não vacinados em situação de risco.',
    faixas: [{ min: 15, max: 36 }],
    fase: '1 ano',
  },
  {
    id: 'var',
    nome: 'Varicela (Tetra Viral)',
    tipo: 'ob',
    protege: 'Catapora e suas complicações (pneumonia, encefalite)',
    doses: ['15 meses'],
    rec: 'Aos 15 meses como Tetra Viral (SCR + varicela).',
    faixas: [{ min: 15, max: 24 }],
    fase: '1 ano',
  },
  {
    id: 'dtpR',
    nome: 'DTP (Reforços)',
    tipo: 'ob',
    protege: 'Difteria, tétano e coqueluche — reforço da imunidade',
    doses: ['15 meses', '4 anos'],
    rec: 'Reforços obrigatórios da série iniciada com a pentavalente.',
    faixas: [{ min: 15, max: 60 }],
    fase: '1–4 anos',
  },
  {
    id: 'vop',
    nome: 'VOP (Reforços orais)',
    tipo: 'ob',
    protege: 'Poliomielite — reforço oral',
    doses: ['15 meses', '4 anos'],
    rec: 'Aplicada como reforço após a série VIP inativada.',
    faixas: [{ min: 15, max: 48 }],
    fase: '1–4 anos',
  },
  {
    id: 'hpv',
    nome: 'HPV Quadrivalente',
    tipo: 'ob',
    protege: 'Câncer de colo uterino, verrugas genitais e outros cânceres por HPV',
    doses: ['1ª dose', '6 meses após (2ª dose)'],
    rec: 'Meninas 9–14 anos e meninos 11–14 anos. Imunossuprimidos: 3 doses.',
    faixas: [{ min: 108, max: 180 }],
    fase: '9–15 anos',
  },
  {
    id: 'menACWY',
    nome: 'Meningocócica ACWY',
    tipo: 'rec',
    protege: 'Doença meningocócica dos sorogrupos A, C, W e Y',
    doses: ['Dose única', 'Reforço 16 anos'],
    rec: 'Recomendada a partir dos 11–12 anos com reforço aos 16.',
    faixas: [{ min: 132, max: 216 }],
    fase: 'Adolescência',
  },
  {
    id: 'flu',
    nome: 'Influenza (Gripe)',
    tipo: 'ob',
    protege: 'Influenza sazonal A e B',
    doses: ['Anual (campanha)'],
    rec: 'Crianças < 9a: 2 doses na 1ª vacinação. Grupos prioritários: crianças 6m–5a, idosos, gestantes e profissionais de saúde.',
    faixas: [{ min: 6, max: 9999 }],
    fase: 'Todas as idades',
  },
  {
    id: 'covid',
    nome: 'Covid-19',
    tipo: 'ob',
    protege: 'Doença grave por SARS-CoV-2',
    doses: ['Esquema primário + reforços anuais'],
    rec: 'A partir de 6 meses de idade. Seguir calendário vigente do Ministério da Saúde.',
    faixas: [{ min: 6, max: 9999 }],
    fase: 'Todas as idades',
  },
  {
    id: 'dtpa',
    nome: 'dTpa (Gestantes)',
    tipo: 'ob',
    protege: 'Proteção do recém-nascido contra coqueluche grave',
    doses: ['Dose única por gestação'],
    rec: 'A partir da 20ª semana de cada gestação, independentemente de dose anterior.',
    faixas: [{ min: 180, max: 600 }],
    fase: 'Adultos',
  },
  {
    id: 'pnc23',
    nome: 'Pneumocócica 23-valente',
    tipo: 'rec',
    protege: '23 sorotipos de pneumococo',
    doses: ['1 a 2 doses'],
    rec: 'Para adultos ≥ 60 anos, imunossuprimidos e portadores de doenças crônicas.',
    faixas: [{ min: 720, max: 9999 }],
    fase: 'Idosos (60+)',
  },
  {
    id: 'zoster',
    nome: 'Zóster (Herpes Zóster)',
    tipo: 'rec',
    protege: 'Herpes zóster e neuralgia pós-herpética',
    doses: ['2 doses com 2–6 meses de intervalo'],
    rec: 'Recomendada a partir dos 50 anos, especialmente para imunossuprimidos.',
    faixas: [{ min: 600, max: 9999 }],
    fase: 'Idosos (50+)',
  },
];

// Fases para a timeline (ordem e metadados)
const FASES = [
  { label: 'Nascimento',         emoji: '👶', bg: '#e8f4ff', sub: '0 a 1 mês' },
  { label: 'Primeiros meses',    emoji: '🍼', bg: '#fff3e8', sub: '2 a 9 meses' },
  { label: '2º semestre de vida',emoji: '🌱', bg: '#e8ffef', sub: '9 a 12 meses' },
  { label: '1 ano',              emoji: '🎂', bg: '#fff8e8', sub: '12 a 24 meses' },
  { label: '1–4 anos',           emoji: '🧒', bg: '#f3e8ff', sub: '1 a 4 anos' },
  { label: '9–15 anos',          emoji: '🧑‍🎓', bg: '#e8f0ff', sub: '9 a 15 anos' },
  { label: 'Adolescência',       emoji: '🧑', bg: '#ffe8f0', sub: '11 a 18 anos' },
  { label: 'Adultos',            emoji: '🧑‍💼', bg: '#f0f0f0', sub: '18 a 59 anos' },
  { label: 'Todas as idades',    emoji: '🌍', bg: '#e8fffd', sub: 'Qualquer faixa' },
  { label: 'Idosos (50+)',       emoji: '👴', bg: '#ffeaea', sub: 'A partir dos 50 anos' },
  { label: 'Idosos (60+)',       emoji: '👴', bg: '#fff0e8', sub: 'A partir dos 60 anos' },
];


// ── HELPERS ─────────────────────────────────────

/**
 * Retorna a idade digitada convertida em meses.
 * @returns {number|null}
 */
function idadeEmMeses() {
  const raw = document.getElementById('idadeInput').value;
  const v   = parseInt(raw, 10);
  if (isNaN(v) || v < 0) return null;
  return unidade === 'anos' ? v * 12 : v;
}

/**

 * @param {number} m
 * @returns {string}
 */
function labelIdade(m) {
  if (unidade === 'anos') {
    const anos = Math.floor(m / 12);
    return `${anos} ano${anos !== 1 ? 's' : ''}`;
  }
  return `${m} mês${m !== 1 ? 'es' : ''}`;
}


// ── TOGGLE MESES / ANOS ──────────────────────────
document.getElementById('btnM').addEventListener('click', () => setUnidade('meses'));
document.getElementById('btnA').addEventListener('click', () => setUnidade('anos'));

function setUnidade(u) {
  unidade = u;
  document.getElementById('btnM').classList.toggle('active', u === 'meses');
  document.getElementById('btnA').classList.toggle('active', u === 'anos');
}


// ── NAVEGAÇÃO ENTRE PÁGINAS ──────────────────────
document.querySelectorAll('.nav-tab').forEach(btn => {
  btn.addEventListener('click', () => {
    const page = btn.dataset.page;

    document.querySelectorAll('.nav-tab').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));

    btn.classList.add('active');
    document.getElementById('page-' + page).classList.add('active');

    if (page === 'timeline')  buildTimeline();
    if (page === 'caderneta') buildCaderneta();
  });
});


// ── CONSULTA ────────────────────────────────────
document.getElementById('btnVerificar').addEventListener('click', verificar);
document.getElementById('idadeInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') verificar();
});

function verificar() {
  const m          = idadeEmMeses();
  const area       = document.getElementById('resultsArea');
  const filterArea = document.getElementById('filterArea');

  // Limpa busca e filtros
  document.getElementById('searchInp').value = '';
  setFiltroInterno('todos');

  if (m === null) {
    filterArea.classList.add('hidden');
    area.innerHTML = emptyHTML('💉', 'Digite sua idade', 'Informe a idade para consultar as vacinas recomendadas.');
    return;
  }

  vacinasResult = VACINAS.filter(v => v.faixas.some(f => m >= f.min && m <= f.max));

  if (vacinasResult.length === 0) {
    filterArea.classList.add('hidden');
    area.innerHTML = emptyHTML('✅', 'Nenhuma vacina específica', 'Consulte sua caderneta ou procure uma UBS próxima para orientações.');
    return;
  }

  filterArea.classList.remove('hidden');
  renderResults(m);
}

function renderResults(meses) {
  const area  = document.getElementById('resultsArea');
  const query = document.getElementById('searchInp').value.toLowerCase();

  const lista = vacinasResult.filter(v => {
    const matchTipo = filtroAtivo === 'todos' || v.tipo === filtroAtivo;
    const matchQ    = !query
      || v.nome.toLowerCase().includes(query)
      || v.protege.toLowerCase().includes(query);
    return matchTipo && matchQ;
  });

  if (lista.length === 0) {
    area.innerHTML = emptyHTML('🔍', 'Nenhuma vacina encontrada', 'Tente outro filtro ou termo de busca.');
    return;
  }

  const m = meses !== undefined ? meses : (idadeEmMeses() ?? 0);

  let html = `
    <div class="rhead">
      <div class="rtitle">Vacinas para ${labelIdade(m)}</div>
      <div class="rcount">${lista.length} encontrada${lista.length !== 1 ? 's' : ''}</div>
    </div>
    <div class="vgrid">`;

  lista.forEach((v, i) => {
    html += `
      <div class="vc ${v.tipo}" style="animation-delay:${i * 0.05}s" data-id="${v.id}" tabindex="0" role="button" aria-label="Ver detalhes: ${v.nome}">
        <div class="vtype">${v.tipo === 'ob' ? '⬤ Obrigatória' : '⬤ Recomendada'}</div>
        <div class="vname">${v.nome}</div>
        <div class="vprot">${v.protege}</div>
        <div class="vmore">Ver detalhes →</div>
      </div>`;
  });

  html += '</div>';
  area.innerHTML = html;

  // Delegação de eventos nos cards gerados
  area.querySelectorAll('.vc').forEach(card => {
    card.addEventListener('click', () => abrirDrawer(card.dataset.id));
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') abrirDrawer(card.dataset.id);
    });
  });
}

// Busca em tempo real
document.getElementById('searchInp').addEventListener('input', () => {
  const m = idadeEmMeses();
  if (m !== null) renderResults(m);
});

// Filtros
document.querySelectorAll('.fpill').forEach(btn => {
  btn.addEventListener('click', () => {
    setFiltroInterno(btn.dataset.filtro);
    const m = idadeEmMeses();
    if (m !== null) renderResults(m);
  });
});

function setFiltroInterno(f) {
  filtroAtivo = f;
  document.querySelectorAll('.fpill').forEach(p => {
    p.classList.toggle('active', p.dataset.filtro === f);
  });
}

function emptyHTML(ico, titulo, texto) {
  return `
    <div class="empty">
      <div class="eico">${ico}</div>
      <h3>${titulo}</h3>
      <p>${texto}</p>
    </div>`;
}


// ── TIMELINE ────────────────────────────────────
function buildTimeline() {
  const container = document.getElementById('timelineContainer');
  if (container.dataset.built) return; // evita rebuild desnecessário

  // Agrupa vacinas por fase
  const map = {};
  VACINAS.forEach(v => {
    if (!map[v.fase]) map[v.fase] = [];
    map[v.fase].push(v);
  });

  let html = '';

  FASES.forEach(fase => {
    const lista = map[fase.label];
    if (!lista) return;

    html += `
      <div class="tl-phase">
        <div class="tl-phase-head">
          <div class="tl-phase-ico" style="background:${fase.bg}">${fase.emoji}</div>
          <div>
            <div class="tl-phase-title">${fase.label}</div>
            <div class="tl-phase-sub">${fase.sub}</div>
          </div>
        </div>
        <div class="tl-items">`;

    lista.forEach(v => {
      html += `
        <div class="tl-item" data-id="${v.id}" tabindex="0" role="button" aria-label="Ver detalhes: ${v.nome}">
          <div class="tl-dot ${v.tipo}"></div>
          <div class="tl-info">
            <div class="tl-name">${v.nome}</div>
            <div class="tl-prot">${v.protege}</div>
          </div>
          <span class="tl-arr">→</span>
        </div>`;
    });

    html += `</div></div>`;
  });

  container.innerHTML = html;
  container.dataset.built = '1';

  // Eventos
  container.querySelectorAll('.tl-item').forEach(item => {
    item.addEventListener('click', () => abrirDrawer(item.dataset.id));
    item.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') abrirDrawer(item.dataset.id);
    });
  });
}


// ── CADERNETA ───────────────────────────────────
function buildCaderneta() {
  renderCaderneta();
}

function renderCaderneta() {
  const total  = VACINAS.length;
  const tomadas = Object.values(caderneta).filter(Boolean).length;
  const pct    = Math.round((tomadas / total) * 100);

  document.getElementById('progressArea').innerHTML = `
    <div class="prog-label">
      <span>${tomadas} de ${total} vacinas registradas</span>
      <span>${pct}%</span>
    </div>
    <div class="progress-bar-wrap">
      <div class="progress-bar-fill" style="width:${pct}%"></div>
    </div>`;

  let html = '';
  VACINAS.forEach(v => {
    const checked = caderneta[v.id] || false;
    html += `
      <div class="cad-row ${checked ? 'checked' : ''} ${v.tipo === 'ob' ? 'obType' : 'recType'}"
           data-id="${v.id}" tabindex="0" role="checkbox" aria-checked="${checked}"
           aria-label="${v.nome}">
        <div class="cad-check">${checked ? '✓' : ''}</div>
        <div class="cad-row-name">${v.nome}</div>
        <div class="cad-row-type">${v.tipo === 'ob' ? 'Obrigatória' : 'Recomendada'}</div>
      </div>`;
  });

  const list = document.getElementById('cadList');
  list.innerHTML = html;

  list.querySelectorAll('.cad-row').forEach(row => {
    row.addEventListener('click', () => toggleCad(row.dataset.id));
    row.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') toggleCad(row.dataset.id);
    });
  });
}

function toggleCad(id) {
  caderneta[id] = !caderneta[id];
  renderCaderneta();
}


// ── DRAWER ──────────────────────────────────────
function abrirDrawer(id) {
  const v = VACINAS.find(x => x.id === id);
  if (!v) return;

  // Tipo e cor
  const isOb = v.tipo === 'ob';
  document.getElementById('dType').textContent  = isOb ? '● Obrigatória' : '● Recomendada';
  document.getElementById('dType').style.color  = isOb ? 'var(--obrig)' : 'var(--recom)';
  document.getElementById('dTitle').textContent = v.nome;

  const pills = v.doses
    .map(d => `<span class="dpill">${d}</span>`)
    .join('');

  document.getElementById('dBody').innerHTML = `
    <div class="iblock">
      <div class="iblabel">Protege contra</div>
      <p>${v.protege}</p>
    </div>
    <div class="iblock">
      <div class="iblabel">Doses</div>
      <div class="dose-pills">${pills}</div>
    </div>
    <div class="iblock">
      <div class="iblabel">Recomendação</div>
      <p>${v.rec}</p>
    </div>
    <div class="iblock">
      <div class="iblabel">Fase de aplicação</div>
      <p>${v.fase}</p>
    </div>
    <div class="sus-badge-d">
      <span class="sus-ico">🏥</span>
      <div>
        <strong>Disponível no SUS</strong>
        Gratuitamente em todas as UBS do Brasil
      </div>
    </div>`;

  document.getElementById('drawer').classList.add('open');
  document.getElementById('drawer').setAttribute('aria-hidden', 'false');
  document.getElementById('overlay').classList.add('open');
  document.getElementById('btnFechar').focus();
}

function fecharDrawer() {
  document.getElementById('drawer').classList.remove('open');
  document.getElementById('drawer').setAttribute('aria-hidden', 'true');
  document.getElementById('overlay').classList.remove('open');
}

// Fechar ao clicar no overlay ou no botão
document.getElementById('overlay').addEventListener('click', fecharDrawer);
document.getElementById('btnFechar').addEventListener('click', fecharDrawer);

// Fechar com ESC
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') fecharDrawer();
});