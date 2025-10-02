/* Robust script: carrega champions.json (se existir), fallback interno se necessário.
   Popula selects, renderiza cards (1 ou 2 campeões) e gera matchup. */

const slugExceptions = {
  "Cho'Gath": "Chogath",
  "Kai'Sa": "Kaisa",
  "Kha'Zix": "Khazix",
  "Vel'Koz": "Velkoz",
  "Rek'Sai": "RekSai",
  "Wukong": "MonkeyKing",
  "Jarvan IV": "JarvanIV",
  "Renata Glasc": "Renata",
  "Miss Fortune": "MissFortune",
  "Dr. Mundo": "DrMundo",
  "Tahm Kench": "TahmKench",
  "Twisted Fate": "TwistedFate",
  "Xin Zhao": "XinZhao",
  "Lee Sin": "LeeSin",
  "Master Yi": "MasterYi",
  "Aurelion Sol": "AurelionSol",
  "Nunu & Willump": "Nunu",
  "Kog'Maw": "KogMaw",
  "Bel'Veth": "Belveth"
};

function getSlug(name){
  if(!name) return '';
  if(slugExceptions[name]) return slugExceptions[name];
  const noDiacritics = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return noDiacritics.replace(/[^a-zA-Z0-9]/g, '');
}

function splashUrlFromName(name){
  const slug = getSlug(name);
  return `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${slug}_0.jpg`;
}
function riotChampionPageFromName(name){
  const slug = getSlug(name).toLowerCase();
  return `https://www.leagueoflegends.com/pt-br/champions/${slug}/`;
}

/* fallback sample (only if champions.json not found) */
const fallbackChampions = [
  {
    name: "Akali",
    lane: "MID/TOP",
    class: "Assassina",
    lore: "Akali foi discípula da ordem Kinkou...",
    strong_against: ["Ryze","Orianna","Lux"],
    weak_against: ["Lissandra","Galio","Rumble"],
    synergy_with: ["Shen","Lee Sin","Rakan"],
    description: "Akali é uma assassina extremamente móvel..."
  },
  {
    name: "Bel'Veth",
    lane: "JUNGLE",
    class: "Lutadora",
    lore: "Bel'Veth é uma imperatriz do Vazio...",
    strong_against: ["Junglers lentos","Times sem controle"],
    weak_against: ["Alto CC","Comps que a isolam"],
    synergy_with: ["Orianna","Leona","Miss Fortune"],
    description: "Bel'Veth é uma caçadora do Vazio que escala brutalmente..."
  }
];

let championsList = [];

/* DOM ready */
document.addEventListener('DOMContentLoaded', () => {
  const playerSel = document.getElementById('player-select');
  const enemySel  = document.getElementById('enemy-select');
  const cardsCont = document.getElementById('cards-container');
  const matchPlayerLabel = document.getElementById('matchup-player');
  const matchEnemyLabel  = document.getElementById('matchup-enemy');
  const matchCard = document.getElementById('match-card');
  const analyzeBtn = document.getElementById('analyzeBtn');

  async function loadChampions(){
    try{
      const res = await fetch('champions.json', {cache: "no-store"});
      if(!res.ok) throw new Error('arquivo não encontrado');
      let data = await res.json();

      // se for objeto (nome: {...}) converte para array mantendo 'name'
      if(!Array.isArray(data)){
        const arr = [];
        for(const key in data){
          if(Object.prototype.hasOwnProperty.call(data,key)){
            const obj = data[key];
            if(!obj.name) obj.name = key;
            arr.push(obj);
          }
        }
        data = arr;
      }

      // garantir que cada item tenha .name
      data = data.map(item => {
        if(!item.name && item.nome) item.name = item.nome;
        return item;
      });

      championsList = data;
    }catch(err){
      console.warn('Não foi possível carregar champions.json — usando fallback interno. Erro:', err.message);
      championsList = fallbackChampions;
    }

    populateSelects();
    updateView();
  }

  function populateSelects(){
    // limpar
    playerSel.innerHTML = `<option value=""> Campeão Aliado </option>`;
    enemySel.innerHTML  = `<option value=""> Campeão Inimigo </option>`;

    // ordenar alfabeticamente (por nome)
    const sorted = [...championsList].sort((a,b) => {
      const na = (a.name||'').toString();
      const nb = (b.name||'').toString();
      return na.localeCompare(nb, 'pt', {sensitivity:'base'});
    });

    sorted.forEach(champ => {
      const name = champ.name || '';
      const opt1 = document.createElement('option');
      opt1.value = name; opt1.textContent = name;
      playerSel.appendChild(opt1);

      const opt2 = document.createElement('option');
      opt2.value = name; opt2.textContent = name;
      enemySel.appendChild(opt2);
    });
  }

  function findChampionByName(name){
    return championsList.find(c => (c.name||'').toString() === name) || null;
  }

  function renderChampionCard(champ, whoId){
    if(!champ) return '';

    const lane = champ.lane || champ.role || champ.role_pt || champ.cargo || '';
    const classe = champ.class || champ.classe || champ.type || '';
    const lore = champ.lore || champ.bio || champ.historia || '';
    const description = champ.description || champ.desc || champ.descricao || '';
    const forte = champ.forte_contra || champ.strong_against || champ.strong || [];
    const fraco = champ.fraco_contra || champ.weak_against || champ.weak || [];
    const sinergia = champ.sinergia_com || champ.synergy_with || champ.synergy || [];

    // create container
    const wrapper = document.createElement('div');
    wrapper.className = 'card';
    wrapper.id = `card-${whoId}`;

    // set CSS var for background image
    const splash = splashUrlFromName(champ.name);
    wrapper.style.setProperty('--bg-url', `url('${splash}')`);

    // innerHTML content
    wrapper.innerHTML = `
      <div class="card-content">
        <h2>${champ.name}</h2>
        <div class="role-line"><strong>Lane:</strong> ${lane || '-'}</div>
        <div class="role-line"><strong>Classe:</strong> ${classe || '-'}</div>

        <div class="section-title">📖 Lore:</div>
        <p>${lore || 'Lore não disponível.'}</p>

        <div class="counters-block">
          <div class="counter-col">
            <div class="section-title">⚔️ Forte contra</div>
            <ul>${(forte && forte.length) ? forte.map(x => `<li>${x}</li>`).join('') : '<li>—</li>'}</ul>
          </div>
          <div class="counter-col">
            <div class="section-title">💀 Fraco contra</div>
            <ul>${(fraco && fraco.length) ? fraco.map(x => `<li>${x}</li>`).join('') : '<li>—</li>'}</ul>
          </div>
          <div class="counter-col">
            <div class="section-title">🤝 Sinergia</div>
            <ul>${(sinergia && sinergia.length) ? sinergia.map(x => `<li>${x}</li>`).join('') : '<li>—</li>'}</ul>
          </div>
        </div>

        <div class="section-title">📝 Descrição:</div>
        <p>${description || 'Descrição não disponível.'}</p>

        <button class="habilidades-btn" onclick="window.open('${riotChampionPageFromName(champ.name)}','_blank')">HABILIDADES</button>
      </div>
    `;
    return wrapper;
  }

  function updateView(){
    const p = playerSel.value;
    const e = enemySel.value;

    matchPlayerLabel.textContent = p || 'Campeão';
    matchEnemyLabel.textContent  = e || 'Campeão';

    cardsCont.innerHTML = '';
    matchCard.style.display = 'none';
    matchCard.innerHTML = '';

    if(!p && !e) {
      // nenhum selecionado -> tela limpa (conforme pedido)
      return;
    }

    if(p && !e){
      const champ = findChampionByName(p);
      if(champ) cardsCont.appendChild(renderChampionCard(champ, 'player'));
      return;
    }

    if(e && !p){
      const champ = findChampionByName(e);
      if(champ) cardsCont.appendChild(renderChampionCard(champ, 'enemy'));
      return;
    }

    if(p && e){
      const cp = findChampionByName(p);
      const ce = findChampionByName(e);
      if(cp) cardsCont.appendChild(renderChampionCard(cp,'player'));
      if(ce) cardsCont.appendChild(renderChampionCard(ce,'enemy'));
      return;
    }
  }

  function analyzeMatchup(){
    const p = playerSel.value;
    const e = enemySel.value;
    if(!p || !e){
      alert('Selecione ambos os campeões para analisar o matchup.');
      return;
    }
    const champP = findChampionByName(p);
    const champE = findChampionByName(e);
    const forte = champP ? (champP.forte_contra || champP.strong_against || []) : [];
    const fraco = champP ? (champP.fraco_contra || champP.weak_against || []) : [];

    let summary = `<h3>${champP.name} vs ${champE.name}</h3>`;
    if(forte.includes(champE.name)) summary += `<p><b>Resumo:</b> ${champP.name} tem vantagem na rota contra ${champE.name}.</p>`;
    else if(fraco.includes(champE.name)) summary += `<p><b>Resumo:</b> ${champP.name} tem dificuldade contra ${champE.name}.</p>`;
    else summary += `<p><b>Resumo:</b> Matchup neutro — depende do estilo e execução.</p>`;

    summary += `<p>Dicas (micro/macro) podem ser adicionadas aqui.</p>`;

    matchCard.innerHTML = summary;
    matchCard.style.display = 'block';
    matchCard.scrollIntoView({behavior:'smooth', block:'center'});
  }

  // listeners
  playerSel.addEventListener('change', updateView);
  enemySel.addEventListener('change', updateView);
  analyzeBtn.addEventListener('click', analyzeMatchup);

  // inicializa
  loadChampions();
});
