// ============================================================
// AWAKENING FOOTBALL - ENHANCED EDITION
// Features: League, Transfers, Player Skills, Sound, Tactics, Injuries
// ============================================================

// ==================== DATA ====================

const equipes = [
    { nom: "Solar Lions", attaque: 80, defense: 70, pouvoir: "Solar Burst", eveil: false, logo: "🦁" },
    { nom: "Shadow Wolves", attaque: 75, defense: 85, pouvoir: "Shadow Lock", eveil: true, logo: "🐺" },
    { nom: "Storm Eagles", attaque: 82, defense: 68, pouvoir: "Thunder Shot", eveil: false, logo: "🦅" },
    { nom: "Iron Bulls", attaque: 70, defense: 90, pouvoir: "Iron Wall", eveil: true, logo: "🐂" },
    { nom: "Phantom Foxes", attaque: 88, defense: 65, pouvoir: "Phantom Dash", eveil: false, logo: "🦊" },
    { nom: "Aqua Serpents", attaque: 78, defense: 72, pouvoir: "Tidal Control", eveil: false, logo: "🐍" },
    { nom: "Crimson Dragons", attaque: 90, defense: 75, pouvoir: "Dragon Fury", eveil: true, logo: "🐉" },
    { nom: "Frost Titans", attaque: 74, defense: 88, pouvoir: "Frozen Field", eveil: false, logo: "❄️" },
    { nom: "Neon Panthers", attaque: 85, defense: 70, pouvoir: "Neon Speed", eveil: false, logo: "🐆" },
    { nom: "Obsidian Kings", attaque: 83, defense: 83, pouvoir: "King's Dominion", eveil: true, logo: "👑" }
];

const nomsJoueurs = {
    "Solar Lions": ["Sol", "Ray", "Blaze", "Phoenix", "Flare", "Helios", "Apollo", "Solstice", "Dawn", "Radiant", "Lumen"],
    "Shadow Wolves": ["Shade", "Luna", "Noir", "Eclipse", "Phantom", "Dusk", "Umbra", "Raven", "Onyx", "Veil", "Nocturne"],
    "Storm Eagles": ["Thunder", "Bolt", "Gale", "Tempest", "Zephyr", "Storm", "Cyclone", "Vortex", "Aero", "Nimbus", "Stratos"],
    "Iron Bulls": ["Steel", "Tank", "Forge", "Titan", "Boulder", "Hammer", "Anvil", "Iron", "Granite", "Atlas", "Siege"],
    "Phantom Foxes": ["Ghost", "Spirit", "Wisp", "Wraith", "Specter", "Shade", "Mirage", "Haze", "Vanish", "Echo", "Flicker"],
    "Aqua Serpents": ["Wave", "Tide", "Coral", "Marine", "Ocean", "Reef", "Torrent", "Neptune", "Abyss", "Stream", "Delta"],
    "Crimson Dragons": ["Drako", "Fury", "Ember", "Inferno", "Magma", "Pyro", "Blitz", "Scorch", "Flame", "Vulcan", "Ignis"],
    "Frost Titans": ["Ice", "Glacier", "Frozen", "Arctic", "Snow", "Blizzard", "Frost", "Tundra", "Boreal", "Cryo", "Hail"],
    "Neon Panthers": ["Flash", "Spark", "Glow", "Neon", "Pulse", "Volt", "Pixel", "Blaze", "Flicker", "Lux", "Prism"],
    "Obsidian Kings": ["Crown", "Royal", "Noble", "Majesty", "King", "Emperor", "Regent", "Duke", "Baron", "Monarch", "Czar"]
};

const couleursDisponibles = [
    { nom: "Rouge", code: "#ff6b6b" },
    { nom: "Bleu", code: "#4ecdc4" },
    { nom: "Vert", code: "#2ecc71" },
    { nom: "Jaune", code: "#f1c40f" },
    { nom: "Violet", code: "#9b59b6" },
    { nom: "Orange", code: "#e67e22" },
    { nom: "Rose", code: "#e84393" },
    { nom: "Cyan", code: "#00cec9" }
];

const niveauxDifficulte = [
    { nom: "Facile", multiplicateur: 0.7 },
    { nom: "Normal", multiplicateur: 1.0 },
    { nom: "Difficile", multiplicateur: 1.3 },
    { nom: "Expert", multiplicateur: 1.6 }
];

const formations = [
    { nom: "4-4-2", desc: "Équilibré", def: 4, mid: 4, att: 2, bonusAtt: 0, bonusDef: 0 },
    { nom: "4-3-3", desc: "Offensif", def: 4, mid: 3, att: 3, bonusAtt: 8, bonusDef: -5 },
    { nom: "3-5-2", desc: "Milieu fort", def: 3, mid: 5, att: 2, bonusAtt: 3, bonusDef: -3 },
    { nom: "5-3-2", desc: "Défensif", def: 5, mid: 3, att: 2, bonusAtt: -5, bonusDef: 8 }
];

const strategies = [
    { nom: "Défensif", bonusAtt: -8, bonusDef: 10, bonusPoss: -5 },
    { nom: "Équilibré", bonusAtt: 0, bonusDef: 0, bonusPoss: 0 },
    { nom: "Offensif", bonusAtt: 10, bonusDef: -8, bonusPoss: 5 },
    { nom: "Ultra-Offensif", bonusAtt: 15, bonusDef: -15, bonusPoss: 8 }
];

const roleLabels = { gardien: "GK", defense: "DEF", milieu: "MID", attaque: "ATT" };
const roleColors = { gardien: "#f59e0b", defense: "#3b82f6", milieu: "#22c55e", attaque: "#ef4444" };

// ==================== SOUND ENGINE ====================

const SoundEngine = {
    ctx: null,
    enabled: true,
    
    init() {
        try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) {}
    },
    
    resume() {
        if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
    },
    
    play(type) {
        if (!this.enabled || !this.ctx) return;
        this.resume();
        const now = this.ctx.currentTime;
        
        switch(type) {
            case 'whistle': this._whistle(now); break;
            case 'goal': this._goal(now); break;
            case 'card': this._card(now); break;
            case 'crowd': this._crowd(now); break;
            case 'kick': this._kick(now); break;
            case 'save': this._save(now); break;
            case 'click': this._click(now); break;
            case 'victory': this._victory(now); break;
            case 'injury': this._injury(now); break;
            case 'sub': this._sub(now); break;
            case 'transfer': this._transfer(now); break;
        }
    },
    
    _osc(freq, type, start, dur, vol=0.15) {
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = type;
        o.frequency.value = freq;
        g.gain.setValueAtTime(vol, start);
        g.gain.exponentialRampToValueAtTime(0.001, start + dur);
        o.connect(g);
        g.connect(this.ctx.destination);
        o.start(start);
        o.stop(start + dur);
    },
    
    _noise(start, dur, vol=0.05) {
        const bufSize = this.ctx.sampleRate * dur;
        const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
        const src = this.ctx.createBufferSource();
        src.buffer = buf;
        const g = this.ctx.createGain();
        g.gain.setValueAtTime(vol, start);
        g.gain.exponentialRampToValueAtTime(0.001, start + dur);
        src.connect(g);
        g.connect(this.ctx.destination);
        src.start(start);
    },
    
    _whistle(t) {
        this._osc(900, 'sine', t, 0.15, 0.12);
        this._osc(1200, 'sine', t + 0.18, 0.3, 0.12);
    },
    
    _goal(t) {
        [523, 659, 784, 1047].forEach((f, i) => {
            this._osc(f, 'square', t + i * 0.12, 0.2, 0.08);
        });
        this._noise(t, 1.5, 0.08);
    },
    
    _card(t) {
        this._osc(400, 'sawtooth', t, 0.15, 0.1);
        this._osc(300, 'sawtooth', t + 0.15, 0.25, 0.1);
    },
    
    _crowd(t) { this._noise(t, 2.0, 0.04); },
    _kick(t) { this._osc(150, 'sine', t, 0.08, 0.2); this._noise(t, 0.06, 0.1); },
    _save(t) { this._osc(500, 'triangle', t, 0.1, 0.1); this._osc(600, 'triangle', t + 0.1, 0.15, 0.08); },
    _click(t) { this._osc(800, 'sine', t, 0.04, 0.08); },
    
    _victory(t) {
        [523, 659, 784, 1047, 1047].forEach((f, i) => {
            this._osc(f, 'sine', t + i * 0.15, 0.3, 0.1);
        });
    },
    
    _injury(t) { this._osc(250, 'sawtooth', t, 0.4, 0.08); this._osc(200, 'sawtooth', t + 0.2, 0.4, 0.06); },
    _sub(t) { this._osc(600, 'sine', t, 0.1, 0.08); this._osc(800, 'sine', t + 0.12, 0.1, 0.08); },
    _transfer(t) { [440, 554, 659, 880].forEach((f, i) => this._osc(f, 'sine', t + i * 0.1, 0.2, 0.07)); }
};

// ==================== PLAYER SKILLS GENERATOR ====================

function genererJoueursDetailles(nomEquipe, baseAtt, baseDef) {
    const noms = nomsJoueurs[nomEquipe] || [];
    const postes = [
        { role: 'gardien', count: 1 },
        { role: 'defense', count: 3 },
        { role: 'milieu', count: 3 },
        { role: 'attaque', count: 3 },
        { role: 'defense', count: 1 }  // remplaçant
    ];
    
    const joueurs = [];
    let idx = 0;
    
    postes.forEach(p => {
        for (let i = 0; i < p.count; i++) {
            const nom = noms[idx] || `J${idx + 1}`;
            const variation = () => Math.floor(Math.random() * 20) - 10;
            
            let vitesse, tir, passe, defense, physique, gardien;
            
            switch(p.role) {
                case 'gardien':
                    vitesse = 40 + variation(); tir = 20 + variation();
                    passe = 50 + variation(); defense = 70 + variation();
                    physique = 65 + variation(); gardien = 70 + Math.floor(baseDef / 4) + variation();
                    break;
                case 'defense':
                    vitesse = 55 + variation(); tir = 35 + variation();
                    passe = 55 + variation(); defense = 60 + Math.floor(baseDef / 4) + variation();
                    physique = 70 + variation(); gardien = 0;
                    break;
                case 'milieu':
                    vitesse = 65 + variation(); tir = 55 + variation();
                    passe = 65 + Math.floor((baseAtt + baseDef) / 8) + variation();
                    defense = 55 + variation(); physique = 60 + variation(); gardien = 0;
                    break;
                case 'attaque':
                    vitesse = 70 + variation(); tir = 65 + Math.floor(baseAtt / 4) + variation();
                    passe = 55 + variation(); defense = 35 + variation();
                    physique = 60 + variation(); gardien = 0;
                    break;
            }
            
            const clamp = v => Math.max(20, Math.min(99, v));
            
            joueurs.push({
                nom,
                role: p.role,
                titulaire: idx < 10,
                vitesse: clamp(vitesse),
                tir: clamp(tir),
                passe: clamp(passe),
                defense: clamp(defense),
                physique: clamp(physique),
                gardien: clamp(gardien),
                expulse: false,
                blesse: false,
                blesseMatchs: 0,
                buts: 0,
                passes: 0,
                global: 0,
                valeur: 0
            });
            
            const j = joueurs[joueurs.length - 1];
            j.global = Math.round((j.vitesse + j.tir + j.passe + j.defense + j.physique + (j.gardien || j.tir)) / 6);
            j.valeur = Math.round(j.global * (0.8 + Math.random() * 0.6) * 100) * 1000;
            
            idx++;
        }
    });
    
    return joueurs;
}

function getEquipeGlobal(joueurs) {
    const tits = joueurs.filter(j => j.titulaire && !j.blesse);
    if (tits.length === 0) return 50;
    return Math.round(tits.reduce((s, j) => s + j.global, 0) / tits.length);
}

function getEquipeAtt(joueurs) {
    const atts = joueurs.filter(j => j.titulaire && !j.blesse && (j.role === 'attaque' || j.role === 'milieu'));
    if (atts.length === 0) return 50;
    return Math.round(atts.reduce((s, j) => s + j.tir, 0) / atts.length);
}

function getEquipeDef(joueurs) {
    const defs = joueurs.filter(j => j.titulaire && !j.blesse && (j.role === 'defense' || j.role === 'gardien'));
    if (defs.length === 0) return 50;
    return Math.round(defs.reduce((s, j) => s + j.defense, 0) / defs.length);
}

// ==================== GLOBALS ====================

const buttons = document.querySelectorAll("#menu button");
const content = document.getElementById("content");
let bestCatalogScore = 0;

function updateCatalogScore(nextValue) {
    const score = Math.max(0, Math.floor(Number(nextValue) || 0));
    if (score <= bestCatalogScore) return bestCatalogScore;
    bestCatalogScore = score;
    const scoreEl = document.getElementById("finalScore");
    if (scoreEl) scoreEl.textContent = String(bestCatalogScore);
    window.gameState = window.gameState || {};
    window.gameState.score = bestCatalogScore;
    if (window.CatalogScore && typeof window.CatalogScore.capture === "function") window.CatalogScore.capture();
    return bestCatalogScore;
}

// ==================== MENU ====================

buttons.forEach(button => {
    button.addEventListener("click", () => {
        SoundEngine.init();
        SoundEngine.play('click');
        chargerMode(button.dataset.mode);
    });
});

document.getElementById('soundToggle').addEventListener('click', () => {
    SoundEngine.init();
    SoundEngine.enabled = !SoundEngine.enabled;
    document.getElementById('soundIcon').textContent = SoundEngine.enabled ? '🔊' : '🔇';
});

function chargerMode(mode) {
    window.carriereData = null;
    window.ligueData = null;
    
    switch (mode) {
        case "exhibition": afficherExhibition(); break;
        case "career-team": afficherCarriere(); break;
        case "league": afficherLigue(); break;
        case "career-player":
            content.innerHTML = `<div class="game-panel"><h2>🚧 Mode Carrière Joueur</h2><p style="margin-top:15px;color:#94a3b8;">En cours de développement - Bientôt disponible !</p></div>`;
            break;
    }
}

// ==================== EXHIBITION MODE ====================

function afficherExhibition() {
    content.innerHTML = `
        <div class="game-panel">
            <h2>🎮 Exhibition</h2>
            <p style="color:#ddd; margin:10px 0;">Choisis deux équipes pour un match rapide</p>
            <div class="panel-card">
                <div id="teams" style="display:grid; grid-template-columns:repeat(2, 1fr); gap:10px; text-align:left;"></div>
            </div>
            <button class="btn-action btn-green" id="playMatch">⚽ Jouer le match</button>
        </div>
    `;

    const teamsDiv = document.getElementById("teams");
    equipes.forEach((equipe, index) => {
        const div = document.createElement("div");
        div.style.cssText = "display:flex;align-items:center;gap:8px;padding:8px 12px;background:rgba(255,255,255,0.05);border-radius:10px;cursor:pointer;transition:all 0.2s;";
        div.innerHTML = `
            <input type="checkbox" value="${index}" id="team${index}" style="width:18px;height:18px;accent-color:#22c55e;">
            <label for="team${index}" style="cursor:pointer;flex:1;display:flex;align-items:center;gap:8px;">
                <span style="font-size:24px;">${equipe.logo}</span>
                <span style="font-weight:bold;">${equipe.nom}</span>
                <span style="color:#94a3b8;font-size:13px;">(${equipe.pouvoir})</span>
            </label>
        `;
        div.addEventListener('mouseenter', () => div.style.background = 'rgba(34,197,94,0.15)');
        div.addEventListener('mouseleave', () => div.style.background = 'rgba(255,255,255,0.05)');
        teamsDiv.appendChild(div);
    });

    document.getElementById("playMatch").addEventListener("click", lancerMatch);
}

// ==================== CAREER MODE ====================

function afficherCarriere() {
    let formationHTML = formations.map((f, i) => `
        <div class="formation-card ${i === 0 ? 'selected' : ''}" onclick="selectFormation(${i}, 'career')" id="careerForm${i}">
            <div class="formation-name">${f.nom}</div>
            <div class="formation-desc">${f.desc}</div>
        </div>
    `).join('');
    
    let strategyHTML = strategies.map((s, i) => `
        <button class="strategy-btn ${i === 1 ? 'selected' : ''}" onclick="selectStrategy(${i}, 'career')" id="careerStrat${i}">${s.nom}</button>
    `).join('');

    content.innerHTML = `
        <div class="game-panel">
            <h2>🏆 Mode Carrière</h2>
            <p style="color:#ddd; margin:10px 0;">Crée ton équipe et commence ta carrière !</p>
            
            <div class="panel-card">
                <h3 style="color:#ffd700; margin-bottom:12px;">📋 Choisis ton équipe</h3>
                <select id="equipeCarriere">
                    ${equipes.map((e, i) => `<option value="${i}">${e.logo} ${e.nom} — ATT: ${e.attaque} DEF: ${e.defense}</option>`).join('')}
                </select>
            </div>
            
            <div class="panel-card">
                <h3 style="color:#ffd700; margin-bottom:12px;">🎨 Couleur</h3>
                <div style="display:flex; gap:10px; flex-wrap:wrap; justify-content:center;">
                    ${couleursDisponibles.map((c, i) => `
                        <div onclick="selectionnerCouleur(${i})" id="couleur${i}"
                            style="width:50px;height:50px;background:${c.code};border:3px solid ${i === 0 ? '#fff' : 'rgba(255,255,255,0.2)'};border-radius:12px;cursor:pointer;transition:all 0.2s;">
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <div class="panel-card">
                <h3 style="color:#ffd700; margin-bottom:12px;">⚔️ Formation</h3>
                <div class="formation-grid">${formationHTML}</div>
            </div>
            
            <div class="panel-card">
                <h3 style="color:#ffd700; margin-bottom:12px;">🧠 Stratégie</h3>
                <div class="strategy-row">${strategyHTML}</div>
            </div>
            
            <div class="panel-card">
                <h3 style="color:#ffd700; margin-bottom:12px;">📈 Difficulté</h3>
                <select id="niveauDifficulte">
                    ${niveauxDifficulte.map((n, i) => `<option value="${i}" ${i === 1 ? 'selected' : ''}>${n.nom}</option>`).join('')}
                </select>
            </div>
            
            <button class="btn-action btn-green" id="demarrerCarriere" style="margin-top:15px;">🏆 Démarrer la carrière</button>
        </div>
    `;
    
    window.couleurSelectionneeIndex = 0;
    window.selectedFormation = 0;
    window.selectedStrategy = 1;
    
    document.getElementById("demarrerCarriere").addEventListener("click", demarrerCarriere);
}

function selectFormation(idx, ctx) {
    const prefix = ctx + 'Form';
    formations.forEach((_, i) => {
        const el = document.getElementById(prefix + i);
        if (el) el.classList.toggle('selected', i === idx);
    });
    window.selectedFormation = idx;
    SoundEngine.play('click');
}

function selectStrategy(idx, ctx) {
    const prefix = ctx + 'Strat';
    strategies.forEach((_, i) => {
        const el = document.getElementById(prefix + i);
        if (el) el.classList.toggle('selected', i === idx);
    });
    window.selectedStrategy = idx;
    SoundEngine.play('click');
}

function selectionnerCouleur(index) {
    couleursDisponibles.forEach((_, i) => {
        const el = document.getElementById(`couleur${i}`);
        if (el) el.style.border = i === index ? '3px solid #fff' : '3px solid rgba(255,255,255,0.2)';
    });
    window.couleurSelectionneeIndex = index;
    SoundEngine.play('click');
}

function demarrerCarriere() {
    const equipeIndex = document.getElementById('equipeCarriere').value;
    const niveauIndex = document.getElementById('niveauDifficulte').value;
    
    const baseEquipe = equipes[equipeIndex];
    const monEquipe = { ...baseEquipe };
    const maCouleur = couleursDisponibles[window.couleurSelectionneeIndex].code;
    const niveau = niveauxDifficulte[niveauIndex];
    
    monEquipe.couleur = maCouleur;
    monEquipe.joueurs = genererJoueursDetailles(monEquipe.nom, monEquipe.attaque, monEquipe.defense);
    
    window.carriereData = {
        equipe: monEquipe,
        niveau: niveau,
        formation: formations[window.selectedFormation],
        strategie: strategies[window.selectedStrategy],
        matchsJoues: 0,
        matchsGagnes: 0,
        matchsPerdus: 0,
        matchsNuls: 0,
        points: 0,
        butsMarques: 0,
        butsEncaisses: 0,
        phase: 'poules',
        adversairesAffrontes: [],
        buteurs: {},
        passeurs: {},
        classementEquipes: [],
        subsRestants: 3,
        budget: 5000000
    };
    
    monEquipe.joueurs.forEach(j => {
        window.carriereData.buteurs[j.nom] = j.buts;
        window.carriereData.passeurs[j.nom] = j.passes;
    });
    
    SoundEngine.play('whistle');
    afficherProchainMatch();
}

function afficherProchainMatch() {
    const data = window.carriereData;
    
    // Heal injuries
    data.equipe.joueurs.forEach(j => {
        if (j.blesse && j.blesseMatchs > 0) {
            j.blesseMatchs--;
            if (j.blesseMatchs <= 0) { j.blesse = false; j.blesseMatchs = 0; }
        }
    });
    data.subsRestants = 3;
    
    let phaseTexte = '';
    let adversaireMultiplicateur = 1.0;
    
    if (data.matchsJoues < 6) {
        data.phase = 'poules';
        phaseTexte = `Phase de poules — Match ${data.matchsJoues + 1}/6`;
        adversaireMultiplicateur = data.niveau.multiplicateur + (data.matchsJoues * 0.05);
    } else if (data.matchsJoues === 6) {
        if (data.points >= 12) { data.phase = 'huitiemes'; phaseTexte = '🏆 Huitièmes de finale'; adversaireMultiplicateur = data.niveau.multiplicateur + 0.4; }
        else { afficherFinCarriere('eliminé'); return; }
    } else if (data.matchsJoues === 7) { data.phase = 'quarts'; phaseTexte = '🏆 Quarts de finale'; adversaireMultiplicateur = data.niveau.multiplicateur + 0.6; }
    else if (data.matchsJoues === 8) { data.phase = 'demi'; phaseTexte = '🏆 Demi-finale'; adversaireMultiplicateur = data.niveau.multiplicateur + 0.8; }
    else if (data.matchsJoues === 9) { data.phase = 'finale'; phaseTexte = '🏆🏆 GRANDE FINALE 🏆🏆'; adversaireMultiplicateur = data.niveau.multiplicateur + 1.0; }
    else if (data.matchsJoues === 10) { afficherFinCarriere('champion'); return; }
    
    let adversaireIndex;
    do { adversaireIndex = Math.floor(Math.random() * equipes.length); } while (equipes[adversaireIndex].nom === data.equipe.nom);
    
    const baseAdv = equipes[adversaireIndex];
    const adversaire = { ...baseAdv };
    adversaire.attaque = Math.floor(adversaire.attaque * adversaireMultiplicateur);
    adversaire.defense = Math.floor(adversaire.defense * adversaireMultiplicateur);
    adversaire.couleur = '#ff6b6b';
    adversaire.joueurs = genererJoueursDetailles(adversaire.nom, adversaire.attaque, adversaire.defense);
    
    const blesses = data.equipe.joueurs.filter(j => j.blesse);
    const blessesHTML = blesses.length > 0
        ? `<div style="margin-top:10px;"><span class="injury-badge">🏥 ${blesses.length} blessé(s): ${blesses.map(j => j.nom + ' (' + j.blesseMatchs + ' match' + (j.blesseMatchs > 1 ? 's' : '') + ')').join(', ')}</span></div>`
        : '';
    
    content.innerHTML = `
        <div class="game-panel">
            <h2>🏆 Carrière — ${phaseTexte}</h2>
            
            <div class="panel-card">
                <h3 style="color:#ffd700;">📊 Bilan</h3>
                <div class="panel-grid panel-grid-4">
                    <div class="panel-stat-box"><div class="panel-stat-value" style="color:#4caf50;">${data.matchsGagnes}</div><div class="panel-stat-label">Victoires</div></div>
                    <div class="panel-stat-box"><div class="panel-stat-value" style="color:#ff6b6b;">${data.matchsPerdus}</div><div class="panel-stat-label">Défaites</div></div>
                    <div class="panel-stat-box"><div class="panel-stat-value" style="color:#ffd700;">${data.matchsNuls}</div><div class="panel-stat-label">Nuls</div></div>
                    <div class="panel-stat-box"><div class="panel-stat-value" style="color:#4ecdc4;">${data.points}</div><div class="panel-stat-label">Points</div></div>
                </div>
                ${blessesHTML}
            </div>
            
            <div class="panel-card">
                <h3 style="color:#fff;">⚔️ Prochain match</h3>
                <div style="display:flex;justify-content:space-around;align-items:center;margin:20px 0;">
                    <div style="text-align:center;">
                        <div style="font-size:36px;">${data.equipe.logo}</div>
                        <div style="font-size:20px;font-weight:bold;color:${data.equipe.couleur};">${data.equipe.nom}</div>
                        <div style="color:#aaa;font-size:13px;">Global: ${getEquipeGlobal(data.equipe.joueurs)}</div>
                    </div>
                    <div style="font-family:'Orbitron';font-size:28px;color:#fff;">VS</div>
                    <div style="text-align:center;">
                        <div style="font-size:36px;">${adversaire.logo}</div>
                        <div style="font-size:20px;font-weight:bold;color:#ff6b6b;">${adversaire.nom}</div>
                        <div style="color:#aaa;font-size:13px;">Global: ${getEquipeGlobal(adversaire.joueurs)}</div>
                    </div>
                </div>
                
                <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin:10px 0;">
                    <span style="background:rgba(34,197,94,0.2);padding:5px 12px;border-radius:20px;font-size:13px;">📐 ${data.formation.nom}</span>
                    <span style="background:rgba(245,158,11,0.2);padding:5px 12px;border-radius:20px;font-size:13px;">🧠 ${data.strategie.nom}</span>
                </div>
                
                <div style="text-align:center;margin-top:15px;">
                    <button class="btn-action btn-green" onclick="jouerMatchCarriere(${JSON.stringify(adversaire).replace(/"/g, '&quot;')})">⚽ Jouer le match</button>
                    <button class="btn-action btn-blue" onclick="afficherEffectif()">👥 Effectif</button>
                    <button class="btn-action btn-purple" onclick="afficherTactiques()">📐 Tactiques</button>
                </div>
            </div>
            
            <button class="btn-action btn-red" onclick="afficherCarriere()" style="margin-top:10px;">❌ Abandonner</button>
        </div>
    `;
}

// ==================== EFFECTIF (SQUAD VIEW) ====================

function afficherEffectif() {
    const data = window.carriereData;
    const joueurs = data.equipe.joueurs;
    
    const titulaires = joueurs.filter(j => j.titulaire);
    const remplacants = joueurs.filter(j => !j.titulaire);
    
    function renderPlayerCard(j, idx) {
        const roleColor = roleColors[j.role] || '#888';
        const injuryHTML = j.blesse ? `<span class="injury-badge">🏥 ${j.blesseMatchs}m</span>` : '';
        
        return `
            <div class="player-card ${j.blesse ? 'injured' : ''}">
                <div class="player-role-badge" style="background:${roleColor};">${roleLabels[j.role]}</div>
                <div class="player-info">
                    <div class="player-name">${j.nom} ${injuryHTML}</div>
                    <div class="player-stats-mini">
                        ⚡${j.vitesse} 🎯${j.tir} 🎯${j.passe} 🛡${j.defense} 💪${j.physique}
                        ${j.role === 'gardien' ? ' 🧤' + j.gardien : ''}
                    </div>
                    <div class="stat-bar-container">
                        <div class="stat-bar-fill" style="width:${j.global}%;background:linear-gradient(90deg, ${j.global > 75 ? '#22c55e' : j.global > 60 ? '#f59e0b' : '#ef4444'}, ${j.global > 75 ? '#14b8a6' : j.global > 60 ? '#eab308' : '#dc2626'});"></div>
                    </div>
                    <div style="font-size:12px;color:#94a3b8;margin-top:2px;">Global: ${j.global} | ⚽ ${j.buts} | 🎯 ${j.passes} | 💰 ${formatMoney(j.valeur)}</div>
                </div>
            </div>
        `;
    }
    
    content.innerHTML = `
        <div class="game-panel">
            <h2>👥 Effectif — ${data.equipe.nom}</h2>
            
            <div class="panel-card">
                <h3 style="color:#22c55e;margin-bottom:12px;">⭐ Titulaires</h3>
                <div style="display:grid;gap:8px;">
                    ${titulaires.map((j, i) => renderPlayerCard(j, i)).join('')}
                </div>
            </div>
            
            <div class="panel-card">
                <h3 style="color:#f59e0b;margin-bottom:12px;">🔄 Remplaçant</h3>
                <div style="display:grid;gap:8px;">
                    ${remplacants.map((j, i) => renderPlayerCard(j, i)).join('')}
                </div>
            </div>
            
            <div style="text-align:center;margin-top:15px;">
                <button class="btn-action btn-green" onclick="afficherProchainMatch()">⬅️ Retour</button>
            </div>
        </div>
    `;
}

// ==================== TACTIQUES ====================

function afficherTactiques() {
    const data = window.carriereData;
    
    let formationHTML = formations.map((f, i) => `
        <div class="formation-card ${data.formation.nom === f.nom ? 'selected' : ''}" onclick="selectFormation(${i}, 'tac'); window.carriereData.formation = formations[${i}];" id="tacForm${i}">
            <div class="formation-name">${f.nom}</div>
            <div class="formation-desc">${f.desc}</div>
            <div style="font-size:11px;color:#94a3b8;margin-top:5px;">ATT ${f.bonusAtt >= 0 ? '+' : ''}${f.bonusAtt} | DEF ${f.bonusDef >= 0 ? '+' : ''}${f.bonusDef}</div>
        </div>
    `).join('');
    
    let strategyHTML = strategies.map((s, i) => `
        <button class="strategy-btn ${data.strategie.nom === s.nom ? 'selected' : ''}" onclick="selectStrategy(${i}, 'tac'); window.carriereData.strategie = strategies[${i}];" id="tacStrat${i}">${s.nom}</button>
    `).join('');
    
    content.innerHTML = `
        <div class="game-panel">
            <h2>📐 Tactiques</h2>
            
            <div class="panel-card">
                <h3 style="color:#ffd700;margin-bottom:12px;">Formation</h3>
                <div class="formation-grid">${formationHTML}</div>
            </div>
            
            <div class="panel-card">
                <h3 style="color:#ffd700;margin-bottom:12px;">Stratégie</h3>
                <div class="strategy-row">${strategyHTML}</div>
            </div>
            
            <div style="text-align:center;margin-top:15px;">
                <button class="btn-action btn-green" onclick="afficherProchainMatch()">✅ Confirmer</button>
            </div>
        </div>
    `;
}

// ==================== LEAGUE MODE ====================

function afficherLigue() {
    let formationHTML = formations.map((f, i) => `
        <div class="formation-card ${i === 0 ? 'selected' : ''}" onclick="selectFormation(${i}, 'league')" id="leagueForm${i}">
            <div class="formation-name">${f.nom}</div>
            <div class="formation-desc">${f.desc}</div>
        </div>
    `).join('');

    content.innerHTML = `
        <div class="game-panel">
            <h2>🏅 Mode Ligue</h2>
            <p style="color:#ddd; margin:10px 0;">Saison complète — Affronte toutes les équipes et finis en tête !</p>
            
            <div class="panel-card">
                <h3 style="color:#ffd700;margin-bottom:12px;">📋 Choisis ton équipe</h3>
                <select id="equipeLigue">
                    ${equipes.map((e, i) => `<option value="${i}">${e.logo} ${e.nom} — ATT: ${e.attaque} DEF: ${e.defense}</option>`).join('')}
                </select>
            </div>
            
            <div class="panel-card">
                <h3 style="color:#ffd700;margin-bottom:12px;">🎨 Couleur</h3>
                <div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center;">
                    ${couleursDisponibles.map((c, i) => `
                        <div onclick="selectionnerCouleur(${i})" id="couleur${i}"
                            style="width:50px;height:50px;background:${c.code};border:3px solid ${i === 0 ? '#fff' : 'rgba(255,255,255,0.2)'};border-radius:12px;cursor:pointer;transition:all 0.2s;">
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <div class="panel-card">
                <h3 style="color:#ffd700;margin-bottom:12px;">⚔️ Formation</h3>
                <div class="formation-grid">${formationHTML}</div>
            </div>
            
            <div class="panel-card">
                <h3 style="color:#ffd700;margin-bottom:12px;">📈 Difficulté</h3>
                <select id="niveauLigue">
                    ${niveauxDifficulte.map((n, i) => `<option value="${i}" ${i === 1 ? 'selected' : ''}>${n.nom}</option>`).join('')}
                </select>
            </div>
            
            <button class="btn-action btn-green" id="demarrerLigue" style="margin-top:15px;">🏅 Démarrer la Ligue</button>
        </div>
    `;
    
    window.couleurSelectionneeIndex = 0;
    window.selectedFormation = 0;
    window.selectedStrategy = 1;
    
    document.getElementById("demarrerLigue").addEventListener("click", demarrerLigue);
}

function demarrerLigue() {
    const equipeIndex = parseInt(document.getElementById('equipeLigue').value);
    const niveauIndex = parseInt(document.getElementById('niveauLigue').value);
    const maCouleur = couleursDisponibles[window.couleurSelectionneeIndex].code;
    
    // Build all teams with full rosters
    const ligueEquipes = equipes.map((e, i) => {
        const team = { ...e };
        team.joueurs = genererJoueursDetailles(e.nom, e.attaque, e.defense);
        if (i === equipeIndex) team.couleur = maCouleur;
        return team;
    });
    
    // Generate all matchdays (round-robin)
    const matchdays = genererCalendrier(ligueEquipes);
    
    // Init standings
    const classement = ligueEquipes.map(e => ({
        nom: e.nom,
        logo: e.logo,
        pts: 0, mj: 0, v: 0, n: 0, d: 0, bp: 0, bc: 0, diff: 0
    }));
    
    window.ligueData = {
        equipes: ligueEquipes,
        monEquipeIndex: equipeIndex,
        niveau: niveauxDifficulte[niveauIndex],
        formation: formations[window.selectedFormation],
        strategie: strategies[1],
        matchdays: matchdays,
        journeeActuelle: 0,
        classement: classement,
        subsRestants: 3,
        budget: 5000000
    };
    
    SoundEngine.play('whistle');
    afficherJourneeLigue();
}

function genererCalendrier(teams) {
    const n = teams.length;
    const matchdays = [];
    const indices = teams.map((_, i) => i);
    
    // Simple round-robin
    for (let round = 0; round < n - 1; round++) {
        const day = [];
        for (let i = 0; i < n / 2; i++) {
            const home = indices[i];
            const away = indices[n - 1 - i];
            day.push({ home, away, played: false, scoreHome: 0, scoreAway: 0 });
        }
        matchdays.push(day);
        // Rotate indices (keep first fixed)
        const last = indices.pop();
        indices.splice(1, 0, last);
    }
    
    return matchdays;
}

function afficherJourneeLigue() {
    const data = window.ligueData;
    const journee = data.matchdays[data.journeeActuelle];
    const monIdx = data.monEquipeIndex;
    
    // Heal injuries
    data.equipes[monIdx].joueurs.forEach(j => {
        if (j.blesse && j.blesseMatchs > 0) {
            j.blesseMatchs--;
            if (j.blesseMatchs <= 0) { j.blesse = false; j.blesseMatchs = 0; }
        }
    });
    data.subsRestants = 3;
    
    const monMatch = journee.find(m => m.home === monIdx || m.away === monIdx);
    const autresMatchs = journee.filter(m => m !== monMatch);
    
    const monEquipe = data.equipes[monIdx];
    const advIdx = monMatch.home === monIdx ? monMatch.away : monMatch.home;
    const adversaire = data.equipes[advIdx];
    
    const blesses = monEquipe.joueurs.filter(j => j.blesse);
    const blessesHTML = blesses.length > 0
        ? `<div style="margin-top:10px;"><span class="injury-badge">🏥 ${blesses.length} blessé(s): ${blesses.map(j => j.nom + ' (' + j.blesseMatchs + 'm)').join(', ')}</span></div>`
        : '';
    
    // Standings table
    const sorted = [...data.classement].sort((a, b) => b.pts - a.pts || b.diff - a.diff || b.bp - a.bp);
    
    content.innerHTML = `
        <div class="game-panel">
            <h2>🏅 Ligue — Journée ${data.journeeActuelle + 1}/${data.matchdays.length}</h2>
            
            <div class="panel-card">
                <h3 style="color:#ffd700;margin-bottom:12px;">📊 Classement</h3>
                <div style="overflow-x:auto;">
                    <table class="league-table">
                        <thead><tr>
                            <th style="width:30px;">#</th><th style="text-align:left;">Équipe</th><th>MJ</th><th>V</th><th>N</th><th>D</th><th>BP</th><th>BC</th><th>Diff</th><th>Pts</th>
                        </tr></thead>
                        <tbody>
                            ${sorted.map((t, i) => `
                                <tr class="${t.nom === monEquipe.nom ? 'my-team' : ''}">
                                    <td style="font-weight:bold;color:${i < 1 ? '#ffd700' : i < 3 ? '#22c55e' : '#fff'};">${i + 1}</td>
                                    <td style="text-align:left;">${t.logo} ${t.nom}</td>
                                    <td>${t.mj}</td><td>${t.v}</td><td>${t.n}</td><td>${t.d}</td>
                                    <td>${t.bp}</td><td>${t.bc}</td>
                                    <td style="color:${t.diff > 0 ? '#22c55e' : t.diff < 0 ? '#ef4444' : '#fff'};">${t.diff > 0 ? '+' : ''}${t.diff}</td>
                                    <td style="font-weight:bold;color:#ffd700;">${t.pts}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <div class="panel-card">
                <h3 style="color:#fff;margin-bottom:12px;">⚔️ Ton match</h3>
                <div style="display:flex;justify-content:space-around;align-items:center;margin:15px 0;">
                    <div style="text-align:center;">
                        <div style="font-size:36px;">${monEquipe.logo}</div>
                        <div style="font-size:18px;font-weight:bold;color:${monEquipe.couleur || '#22c55e'};">${monEquipe.nom}</div>
                    </div>
                    <div style="font-family:'Orbitron';font-size:24px;color:#fff;">VS</div>
                    <div style="text-align:center;">
                        <div style="font-size:36px;">${adversaire.logo}</div>
                        <div style="font-size:18px;font-weight:bold;color:#ff6b6b;">${adversaire.nom}</div>
                    </div>
                </div>
                ${blessesHTML}
                
                <div style="text-align:center;margin-top:15px;">
                    <button class="btn-action btn-green" onclick="jouerMatchLigue()">⚽ Jouer</button>
                    <button class="btn-action btn-blue" onclick="afficherEffectifLigue()">👥 Effectif</button>
                </div>
            </div>
            
            <div class="panel-card">
                <h3 style="color:#94a3b8;margin-bottom:10px;">📅 Autres matchs</h3>
                ${autresMatchs.map(m => `
                    <div style="display:flex;justify-content:center;align-items:center;gap:10px;padding:8px;margin:4px 0;background:rgba(255,255,255,0.05);border-radius:8px;">
                        <span>${data.equipes[m.home].logo} ${data.equipes[m.home].nom}</span>
                        <span style="color:#94a3b8;">vs</span>
                        <span>${data.equipes[m.away].logo} ${data.equipes[m.away].nom}</span>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function afficherEffectifLigue() {
    const data = window.ligueData;
    const joueurs = data.equipes[data.monEquipeIndex].joueurs;
    
    const titulaires = joueurs.filter(j => j.titulaire);
    const remplacants = joueurs.filter(j => !j.titulaire);
    
    function renderPC(j) {
        const roleColor = roleColors[j.role] || '#888';
        const injuryHTML = j.blesse ? `<span class="injury-badge">🏥 ${j.blesseMatchs}m</span>` : '';
        return `
            <div class="player-card ${j.blesse ? 'injured' : ''}">
                <div class="player-role-badge" style="background:${roleColor};">${roleLabels[j.role]}</div>
                <div class="player-info">
                    <div class="player-name">${j.nom} ${injuryHTML}</div>
                    <div class="player-stats-mini">⚡${j.vitesse} 🎯${j.tir} 🎯${j.passe} 🛡${j.defense} 💪${j.physique}</div>
                    <div style="font-size:12px;color:#94a3b8;margin-top:2px;">Global: ${j.global} | ⚽ ${j.buts} | 🎯 ${j.passes}</div>
                </div>
            </div>`;
    }
    
    content.innerHTML = `
        <div class="game-panel">
            <h2>👥 Effectif</h2>
            <div class="panel-card">
                <h3 style="color:#22c55e;margin-bottom:12px;">⭐ Titulaires</h3>
                <div style="display:grid;gap:8px;">${titulaires.map(j => renderPC(j)).join('')}</div>
            </div>
            <div class="panel-card">
                <h3 style="color:#f59e0b;margin-bottom:12px;">🔄 Remplaçant</h3>
                <div style="display:grid;gap:8px;">${remplacants.map(j => renderPC(j)).join('')}</div>
            </div>
            <div style="text-align:center;margin-top:15px;">
                <button class="btn-action btn-green" onclick="afficherJourneeLigue()">⬅️ Retour</button>
            </div>
        </div>
    `;
}

function jouerMatchLigue() {
    const data = window.ligueData;
    const journee = data.matchdays[data.journeeActuelle];
    const monIdx = data.monEquipeIndex;
    const monMatch = journee.find(m => m.home === monIdx || m.away === monIdx);
    const advIdx = monMatch.home === monIdx ? monMatch.away : monMatch.home;
    
    const monEquipe = data.equipes[monIdx];
    const adversaire = data.equipes[advIdx];
    
    // Apply difficulty to adversaire
    const mult = data.niveau.multiplicateur;
    const advCopy = { ...adversaire };
    advCopy.attaque = Math.floor(adversaire.attaque * mult);
    advCopy.defense = Math.floor(adversaire.defense * mult);
    advCopy.joueurs = adversaire.joueurs.map(j => ({ ...j }));
    advCopy.couleur = '#ff6b6b';
    
    window.ligueMatchData = { monMatch, advIdx, journee };
    
    // Apply formation/strategy bonuses
    const form = data.formation;
    const strat = data.strategie;
    monEquipe.attaque = equipes[monIdx].attaque + form.bonusAtt + strat.bonusAtt;
    monEquipe.defense = equipes[monIdx].defense + form.bonusDef + strat.bonusDef;
    
    window._isLigueMatch = true;
    simulerMatch(monEquipe, advCopy);
}

// ==================== MATCH SIMULATION (SHARED) ====================

function jouerMatchCarriere(adversaire) {
    window.matchCarriereAdversaire = adversaire;
    
    const data = window.carriereData;
    const form = data.formation;
    const strat = data.strategie;
    
    // Apply bonuses from formation + strategy
    const baseEquipe = equipes.find(e => e.nom === data.equipe.nom);
    data.equipe.attaque = (baseEquipe ? baseEquipe.attaque : data.equipe.attaque) + form.bonusAtt + strat.bonusAtt;
    data.equipe.defense = (baseEquipe ? baseEquipe.defense : data.equipe.defense) + form.bonusDef + strat.bonusDef;
    
    window._isLigueMatch = false;
    simulerMatch(data.equipe, adversaire);
}

function lancerMatch() {
    const checked = document.querySelectorAll("#teams input:checked");
    if (checked.length !== 2) { alert("Sélectionne exactement 2 équipes !"); return; }
    
    const teamA = { ...equipes[checked[0].value] };
    const teamB = { ...equipes[checked[1].value] };
    teamA.joueurs = genererJoueursDetailles(teamA.nom, teamA.attaque, teamA.defense);
    teamB.joueurs = genererJoueursDetailles(teamB.nom, teamB.attaque, teamB.defense);
    
    window._isLigueMatch = false;
    simulerMatch(teamA, teamB);
}

function simulerMatch(equipeA, equipeB) {
    let scoreA = 0, scoreB = 0;
    let commentaires = [];
    
    const stats = {
        possessionA: 0, possessionB: 0,
        tirsA: 0, tirsB: 0, tirsCadresA: 0, tirsCadresB: 0,
        penaltyA: 0, penaltyB: 0, coupsFrancsA: 0, coupsFrancsB: 0,
        fautesA: 0, fautesB: 0, jaunesA: 0, jaunesB: 0, rougesA: 0, rougesB: 0,
        blessuresA: [], blessuresB: [], subsA: 0, subsB: 0
    };
    
    const terrain = creerTerrain(equipeA, equipeB);
    const joueurs = initialiserJoueurs(equipeA, equipeB);
    const ballon = { x: 400, y: 300, possesseur: null };
    
    let possession = Math.random() < 0.5 ? equipeA : equipeB;
    ballon.possesseur = possession === equipeA
        ? joueurs.A[Math.floor(Math.random() * joueurs.A.length)]
        : joueurs.B[Math.floor(Math.random() * joueurs.B.length)];
    
    SoundEngine.play('whistle');
    SoundEngine.play('crowd');
    
    let minuteActuelle = 0;
    const intervalMatch = setInterval(() => {
        minuteActuelle++;
        
        if (minuteActuelle > 90) {
            clearInterval(intervalMatch);
            SoundEngine.play('whistle');
            afficherResultatMatch(equipeA, equipeB, scoreA, scoreB, commentaires, stats);
            return;
        }
        
        // Half-time whistle
        if (minuteActuelle === 45) { SoundEngine.play('whistle'); }
        
        afficherMinute(minuteActuelle, scoreA, scoreB);
        
        if (Math.random() < 0.1) {
            possession = possession === equipeA ? equipeB : equipeA;
            ballon.possesseur = possession === equipeA
                ? joueurs.A[Math.floor(Math.random() * joueurs.A.length)]
                : joueurs.B[Math.floor(Math.random() * joueurs.B.length)];
        }
        
        if (possession === equipeA) stats.possessionA++;
        else stats.possessionB++;
        
        // === INJURY SYSTEM ===
        if (Math.random() < 0.012) {
            const equipeBlessee = Math.random() < 0.5 ? 'A' : 'B';
            const joueursEquipe = joueurs[equipeBlessee].filter(j => !j.expulse && !j.blesse);
            if (joueursEquipe.length > 1) {
                const victime = joueursEquipe[Math.floor(Math.random() * joueursEquipe.length)];
                if (victime.role !== 'gardien') {
                    victime.blesse = true;
                    victime.blesseMatchs = Math.floor(Math.random() * 3) + 1;
                    
                    const equipeNom = equipeBlessee === 'A' ? equipeA.nom : equipeB.nom;
                    commentaires.push(`🏥 ${minuteActuelle}' BLESSURE: ${victime.nom} (${equipeNom}) sort sur blessure !`);
                    afficherEvenement(`🏥 Blessure — ${victime.nom}`, '#ef4444');
                    SoundEngine.play('injury');
                    
                    if (equipeBlessee === 'A') stats.blessuresA.push(victime.nom);
                    else stats.blessuresB.push(victime.nom);
                    
                    // Auto-sub for AI, or notify for player
                    const isPlayerTeam = (equipeBlessee === 'A' && (window.carriereData || window.ligueData));
                    if (!isPlayerTeam) {
                        autoSubstitution(joueurs, equipeBlessee, victime, equipeBlessee === 'A' ? equipeA : equipeB);
                        if (equipeBlessee === 'A') stats.subsA++;
                        else stats.subsB++;
                    } else {
                        // Auto-sub for player team too (simplified)
                        autoSubstitution(joueurs, equipeBlessee, victime, equipeBlessee === 'A' ? equipeA : equipeB);
                        stats.subsA++;
                        commentaires.push(`🔄 ${minuteActuelle}' Remplacement automatique pour ${victime.nom}`);
                        SoundEngine.play('sub');
                    }
                    
                    const couleurA = equipeA.couleur || '#ff6b6b';
                    const couleurB = equipeB.couleur || '#4ecdc4';
                    dessinerJoueurs(joueurs.A, 'A', couleurA);
                    dessinerJoueurs(joueurs.B, 'B', couleurB);
                }
            }
        }
        
        // === FAUTES ===
        if (Math.random() < 0.08) {
            const fautif = Math.random() < 0.5 ? equipeA : equipeB;
            const victime = fautif === equipeA ? equipeB : equipeA;
            
            if (fautif === equipeA) stats.fautesA++;
            else stats.fautesB++;
            
            const carton = tirerCarton();
            if (carton === "jaune") {
                if (fautif === equipeA) stats.jaunesA++;
                else stats.jaunesB++;
                commentaires.push(`🟨 ${minuteActuelle}' Carton jaune pour ${fautif.nom}`);
                afficherEvenement(`🟨 Carton jaune — ${fautif.nom}`, '#ffeb3b');
                SoundEngine.play('card');
            } else if (carton === "rouge") {
                if (fautif === equipeA) stats.rougesA++;
                else stats.rougesB++;
                commentaires.push(`🟥 ${minuteActuelle}' CARTON ROUGE pour ${fautif.nom} !`);
                afficherEvenement(`🟥 CARTON ROUGE — ${fautif.nom}`, '#f44336');
                SoundEngine.play('card');
                
                const joueursEquipe = fautif === equipeA ? joueurs.A : joueurs.B;
                const joueurExpulse = joueursEquipe.filter(j => !j.expulse)[Math.floor(Math.random() * joueursEquipe.filter(j => !j.expulse).length)];
                if (joueurExpulse) joueurExpulse.expulse = true;
                
                const couleurA = equipeA.couleur || '#ff6b6b';
                const couleurB = equipeB.couleur || '#4ecdc4';
                dessinerJoueurs(joueurs.A, 'A', couleurA);
                dessinerJoueurs(joueurs.B, 'B', couleurB);
            }
            
            if (Math.random() < 0.25) {
                if (Math.random() < 0.35) {
                    if (victime === equipeA) stats.penaltyA++;
                    else stats.penaltyB++;
                    animerPenalty(ballon, victime === equipeA ? 'gauche' : 'droite');
                    const but = tirerPenalty(victime);
                    if (but) {
                        if (victime === equipeA) scoreA++;
                        else scoreB++;
                        commentaires.push(`🎯 ${minuteActuelle}' BUT SUR PENALTY (${victime.nom})`);
                        afficherEvenement(`⚽ BUT! PENALTY — ${victime.nom}`, '#4caf50');
                        SoundEngine.play('goal');
                        animerBut(ballon, victime === equipeA ? 'droite' : 'gauche');
                    } else {
                        commentaires.push(`🧤 ${minuteActuelle}' Penalty arrêté (${victime.nom})`);
                        afficherEvenement(`🧤 Penalty arrêté!`, '#ff9800');
                        SoundEngine.play('save');
                    }
                } else {
                    if (victime === equipeA) stats.coupsFrancsA++;
                    else stats.coupsFrancsB++;
                    const but = tirerCoupFranc(victime);
                    if (but) {
                        if (victime === equipeA) scoreA++;
                        else scoreB++;
                        commentaires.push(`🎯 ${minuteActuelle}' BUT SUR COUP FRANC (${victime.nom})`);
                        afficherEvenement(`⚽ BUT! Coup franc — ${victime.nom}`, '#4caf50');
                        SoundEngine.play('goal');
                        animerBut(ballon, victime === equipeA ? 'droite' : 'gauche');
                    } else {
                        commentaires.push(`❌ ${minuteActuelle}' Coup franc manqué (${victime.nom})`);
                        afficherEvenement(`❌ Coup franc manqué`, '#ff5722');
                        SoundEngine.play('kick');
                    }
                }
            }
            return;
        }
        
        // === OFFENSIVE ACTION ===
        let penaliteA = stats.rougesA * 0.08;
        let penaliteB = stats.rougesB * 0.08;
        let chanceAction = possession === equipeA ? 0.35 - penaliteA : 0.35 - penaliteB;
        
        if (Math.random() < Math.max(0.1, chanceAction)) {
            const attaquant = possession;
            const defenseur = attaquant === equipeA ? equipeB : equipeA;
            
            deplacerJoueurs(joueurs, possession, equipeA);
            animerBallon(ballon, ballon.possesseur);
            
            const action = actionOffensiveDetaillee(attaquant, defenseur);
            
            if (attaquant === equipeA) {
                stats.tirsA++;
                if (action.cadre) stats.tirsCadresA++;
            } else {
                stats.tirsB++;
                if (action.cadre) stats.tirsCadresB++;
            }
            
            if (action.but) {
                if (attaquant === equipeA) scoreA++;
                else scoreB++;
                
                const buteur = ballon.possesseur;
                
                // Track individual stats
                if (buteur && buteur.nom) {
                    const equipeJoueurs = attaquant === equipeA ? equipeA.joueurs : equipeB.joueurs;
                    if (equipeJoueurs) {
                        const jSource = equipeJoueurs.find(j => j.nom === buteur.nom);
                        if (jSource) jSource.buts++;
                    }
                }
                
                // Career tracking
                if (window.carriereData && attaquant === window.carriereData.equipe) {
                    if (buteur) window.carriereData.buteurs[buteur.nom] = (window.carriereData.buteurs[buteur.nom] || 0) + 1;
                    const passeurPotentiel = joueurs.A[Math.floor(Math.random() * joueurs.A.length)];
                    if (passeurPotentiel && passeurPotentiel.nom !== (buteur && buteur.nom) && !passeurPotentiel.expulse) {
                        window.carriereData.passeurs[passeurPotentiel.nom] = (window.carriereData.passeurs[passeurPotentiel.nom] || 0) + 1;
                        const jP = window.carriereData.equipe.joueurs.find(j => j.nom === passeurPotentiel.nom);
                        if (jP) jP.passes++;
                    }
                }
                
                commentaires.push(`⚽ ${minuteActuelle}' BUT de ${attaquant.nom}`);
                afficherEvenement(`⚽ BUUUUT! ${attaquant.nom}`, '#4caf50');
                SoundEngine.play('goal');
                animerBut(ballon, attaquant === equipeA ? 'droite' : 'gauche');
            } else if (action.cadre) {
                commentaires.push(`🧤 ${minuteActuelle}' Tir cadré arrêté (${attaquant.nom})`);
                afficherEvenement(`🧤 Arrêt du gardien!`, '#2196f3');
                SoundEngine.play('save');
                animerArret(ballon, attaquant === equipeA ? 'droite' : 'gauche');
            } else {
                commentaires.push(`❌ ${minuteActuelle}' Tir non cadré (${attaquant.nom})`);
                afficherEvenement(`❌ Tir à côté!`, '#9e9e9e');
                SoundEngine.play('kick');
            }
        }
    }, 100);
}

function autoSubstitution(joueurs, equipe, blesseJoueur, equipeObj) {
    const team = joueurs[equipe];
    const remplacant = equipeObj.joueurs
        ? equipeObj.joueurs.find(j => !j.titulaire && !j.blesse && !j.expulse && j.role === blesseJoueur.role)
        || equipeObj.joueurs.find(j => !j.titulaire && !j.blesse && !j.expulse)
        : null;
    
    if (remplacant) {
        // Find the injured player on the pitch and replace
        const idx = team.findIndex(j => j.nom === blesseJoueur.nom);
        if (idx !== -1) {
            team[idx] = {
                ...team[idx],
                nom: remplacant.nom,
                role: remplacant.role,
                expulse: false,
                blesse: false
            };
            remplacant.titulaire = true;
            blesseJoueur.titulaire = false;
        }
    } else {
        // No sub available, just remove
        blesseJoueur.expulse = true;
    }
}

// ==================== TERRAIN & ANIMATION ====================

function creerTerrain(equipeA, equipeB) {
    const terrainHTML = `
        <svg id="terrain" width="800" height="600" viewBox="0 0 800 600" style="border:2px solid #333; background:#2d5016; max-width:100%; height:auto; border-radius:10px;">
            <defs>
                <pattern id="grass" patternUnits="userSpaceOnUse" width="40" height="40">
                    <rect width="40" height="40" fill="#2d5016"/>
                    <rect x="0" y="0" width="20" height="40" fill="#2a4c14"/>
                </pattern>
            </defs>
            <rect x="0" y="0" width="800" height="600" fill="url(#grass)"/>
            <line x1="400" y1="0" x2="400" y2="600" stroke="#fff" stroke-width="2" opacity="0.7"/>
            <circle cx="400" cy="300" r="80" fill="none" stroke="#fff" stroke-width="2" opacity="0.7"/>
            <circle cx="400" cy="300" r="5" fill="#fff"/>
            <rect x="0" y="200" width="80" height="200" fill="none" stroke="#fff" stroke-width="2" opacity="0.7"/>
            <rect x="0" y="250" width="40" height="100" fill="none" stroke="#fff" stroke-width="2" opacity="0.7"/>
            <rect x="720" y="200" width="80" height="200" fill="none" stroke="#fff" stroke-width="2" opacity="0.7"/>
            <rect x="760" y="250" width="40" height="100" fill="none" stroke="#fff" stroke-width="2" opacity="0.7"/>
            <g id="joueursA"></g>
            <g id="joueursB"></g>
            <circle id="ballon" cx="400" cy="300" r="8" fill="#fff" stroke="#000" stroke-width="2"/>
        </svg>
        <div id="scoreboard" style="display:flex; justify-content:space-between; align-items:center; margin-top:12px; padding:12px 20px; background:rgba(0,0,0,0.4); border-radius:12px;">
            <div style="display:flex;align-items:center;gap:8px;">
                <span style="font-size:20px;">${equipeA.logo || '🏠'}</span>
                <span style="color:${equipeA.couleur || '#ff6b6b'};font-weight:bold;font-size:18px;">${equipeA.nom}</span>
                <span style="font-family:'Orbitron';font-size:28px;font-weight:bold;color:#fff;" id="scoreA">0</span>
            </div>
            <div style="font-family:'Orbitron';color:#94a3b8;font-size:16px;"><span id="minute">0</span>'</div>
            <div style="display:flex;align-items:center;gap:8px;">
                <span style="font-family:'Orbitron';font-size:28px;font-weight:bold;color:#fff;" id="scoreB">0</span>
                <span style="color:${equipeB.couleur || '#4ecdc4'};font-weight:bold;font-size:18px;">${equipeB.nom}</span>
                <span style="font-size:20px;">${equipeB.logo || '⚔️'}</span>
            </div>
        </div>
        <div id="evenement" style="text-align:center; margin-top:8px; height:35px; font-size:18px; font-weight:bold;"></div>
    `;
    content.innerHTML = terrainHTML;
    return document.getElementById('terrain');
}

function genererNomsJoueurs(nomEquipe) {
    return nomsJoueurs[nomEquipe] || ["J1", "J2", "J3", "J4", "J5", "J6"];
}

function initialiserJoueurs(equipeA, equipeB) {
    const nomsA = equipeA.joueurs ? equipeA.joueurs.filter(j => j.titulaire && !j.blesse).map(j => j.nom) : genererNomsJoueurs(equipeA.nom);
    const nomsB = equipeB.joueurs ? equipeB.joueurs.filter(j => j.titulaire && !j.blesse).map(j => j.nom) : genererNomsJoueurs(equipeB.nom);
    
    const makeTeam = (noms, side) => {
        const positions = side === 'A'
            ? [{ x: 30, y: 300, role: 'gardien' }, { x: 120, y: 150, role: 'defense' }, { x: 120, y: 300, role: 'defense' }, { x: 120, y: 450, role: 'defense' }, { x: 250, y: 200, role: 'milieu' }, { x: 250, y: 400, role: 'milieu' }, { x: 200, y: 300, role: 'milieu' }, { x: 330, y: 200, role: 'attaque' }, { x: 330, y: 400, role: 'attaque' }, { x: 350, y: 300, role: 'attaque' }]
            : [{ x: 770, y: 300, role: 'gardien' }, { x: 680, y: 150, role: 'defense' }, { x: 680, y: 300, role: 'defense' }, { x: 680, y: 450, role: 'defense' }, { x: 550, y: 200, role: 'milieu' }, { x: 550, y: 400, role: 'milieu' }, { x: 600, y: 300, role: 'milieu' }, { x: 470, y: 200, role: 'attaque' }, { x: 470, y: 400, role: 'attaque' }, { x: 450, y: 300, role: 'attaque' }];
        
        return positions.slice(0, Math.max(noms.length, 6)).map((p, i) => ({
            x: p.x, y: p.y, role: p.role,
            expulse: false, blesse: false,
            nom: noms[i] || `J${i + 1}`
        }));
    };
    
    const joueursA = makeTeam(nomsA, 'A');
    const joueursB = makeTeam(nomsB, 'B');
    
    dessinerJoueurs(joueursA, 'A', equipeA.couleur || '#ff6b6b');
    dessinerJoueurs(joueursB, 'B', equipeB.couleur || '#4ecdc4');
    
    return { A: joueursA, B: joueursB };
}

function dessinerJoueurs(joueurs, equipe, couleur) {
    const container = document.getElementById(`joueurs${equipe}`);
    if (!container) return;
    container.innerHTML = '';
    
    joueurs.forEach((joueur, index) => {
        if (!joueur.expulse && !joueur.blesse) {
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', joueur.x);
            circle.setAttribute('cy', joueur.y);
            circle.setAttribute('r', '14');
            circle.setAttribute('fill', couleur);
            circle.setAttribute('stroke', '#000');
            circle.setAttribute('stroke-width', '2');
            circle.setAttribute('id', `joueur${equipe}${index}`);
            container.appendChild(circle);
            
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', joueur.x);
            text.setAttribute('y', joueur.y - 18);
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('fill', '#fff');
            text.setAttribute('font-size', '10');
            text.setAttribute('font-weight', 'bold');
            text.setAttribute('font-family', 'Rajdhani, sans-serif');
            text.setAttribute('id', `nom${equipe}${index}`);
            text.textContent = joueur.nom || `J${index + 1}`;
            container.appendChild(text);
        }
    });
}

function deplacerJoueurs(joueurs, possession, equipeA) {
    Object.keys(joueurs).forEach(equipe => {
        joueurs[equipe].forEach((joueur, index) => {
            if (!joueur.expulse && !joueur.blesse) {
                joueur.x += Math.random() * 20 - 10;
                joueur.y += Math.random() * 20 - 10;
                joueur.x = Math.max(20, Math.min(780, joueur.x));
                joueur.y = Math.max(20, Math.min(580, joueur.y));
                
                const circle = document.getElementById(`joueur${equipe}${index}`);
                if (circle) { circle.setAttribute('cx', joueur.x); circle.setAttribute('cy', joueur.y); }
                const text = document.getElementById(`nom${equipe}${index}`);
                if (text) { text.setAttribute('x', joueur.x); text.setAttribute('y', joueur.y - 18); }
            }
        });
    });
}

function animerBallon(ballon, possesseur) {
    if (possesseur) {
        ballon.x = possesseur.x;
        ballon.y = possesseur.y;
        const el = document.getElementById('ballon');
        if (el) { el.setAttribute('cx', ballon.x); el.setAttribute('cy', ballon.y); }
    }
}

function animerBut(ballon, cage) {
    const el = document.getElementById('ballon');
    const targetX = cage === 'droite' ? 790 : 10;
    let steps = 0;
    const maxSteps = 20;
    const deltaX = (targetX - ballon.x) / maxSteps;
    const deltaY = (300 - ballon.y) / maxSteps;
    
    const animation = setInterval(() => {
        steps++;
        ballon.x += deltaX;
        ballon.y += deltaY;
        if (el) { el.setAttribute('cx', ballon.x); el.setAttribute('cy', ballon.y); }
        if (steps >= maxSteps) {
            clearInterval(animation);
            setTimeout(() => { ballon.x = 400; ballon.y = 300; if (el) { el.setAttribute('cx', 400); el.setAttribute('cy', 300); } }, 500);
        }
    }, 50);
}

function animerArret(ballon, cage) {
    const el = document.getElementById('ballon');
    const targetX = cage === 'droite' ? 750 : 50;
    let steps = 0;
    const maxSteps = 10;
    const deltaX = (targetX - ballon.x) / maxSteps;
    
    const animation = setInterval(() => {
        steps++;
        ballon.x += deltaX;
        if (el) { el.setAttribute('cx', ballon.x); el.setAttribute('cy', ballon.y); }
        if (steps >= maxSteps) clearInterval(animation);
    }, 50);
}

function animerPenalty(ballon, cage) {
    ballon.x = cage === 'gauche' ? 100 : 700;
    ballon.y = 300;
    const el = document.getElementById('ballon');
    if (el) { el.setAttribute('cx', ballon.x); el.setAttribute('cy', ballon.y); }
}

function afficherMinute(minute, scoreA, scoreB) {
    const mEl = document.getElementById('minute');
    const saEl = document.getElementById('scoreA');
    const sbEl = document.getElementById('scoreB');
    if (mEl) mEl.textContent = minute;
    if (saEl) saEl.textContent = scoreA;
    if (sbEl) sbEl.textContent = scoreB;
}

function afficherEvenement(texte, couleur) {
    const el = document.getElementById('evenement');
    if (el) {
        el.textContent = texte;
        el.style.color = couleur;
        setTimeout(() => { if (el) el.textContent = ''; }, 3000);
    }
}

// ==================== MATCH LOGIC ====================

function tirerPenalty(equipe) { return Math.random() * 100 < (75 + equipe.attaque / 5); }
function tirerCoupFranc(equipe) { return Math.random() * 100 < (30 + equipe.attaque / 8); }

function tirerCarton() {
    const t = Math.random();
    if (t < 0.75) return "jaune";
    if (t < 0.85) return "rouge";
    return null;
}

function actionOffensiveDetaillee(attaque, defense) {
    let precision = attaque.attaque - defense.defense / 2;
    let puissance = attaque.attaque;
    if (Math.random() < 0.1) precision += 10;
    if (attaque.eveil && Math.random() < 0.05) { precision += 20; puissance += 20; }
    
    const cadre = Math.random() * 100 < precision;
    if (!cadre) return { cadre: false, but: false };
    
    const but = (puissance + Math.random() * 100) > (defense.defense + 60);
    return { cadre: true, but };
}

function calculScore(equipe) {
    let base = Math.floor(Math.random() * 3);
    let bonus = Math.floor(equipe.attaque / 30);
    if (equipe.eveil && Math.random() > 0.7) bonus += 2;
    return base + bonus;
}

// ==================== RESULT SCREEN ====================

function afficherResultatMatch(teamA, teamB, scoreA, scoreB, commentaires, stats) {
    const possA = Math.round(stats.possessionA / 90 * 100);
    const possB = 100 - possA;
    
    let boutonSuite = '';
    let boutonClassement = '';
    
    // Career mode tracking
    if (window.carriereData && !window._isLigueMatch) {
        const data = window.carriereData;
        data.matchsJoues++;
        data.butsMarques += scoreA;
        data.butsEncaisses += scoreB;
        
        if (scoreA > scoreB) { data.matchsGagnes++; data.points += 3; }
        else if (scoreA < scoreB) { data.matchsPerdus++; }
        else { data.matchsNuls++; data.points += 1; }
        
        data.classementEquipes.push({ adversaire: teamB.nom, scoreA, scoreB, resultat: scoreA > scoreB ? 'V' : scoreA < scoreB ? 'D' : 'N' });
        
        boutonSuite = `<button class="btn-action btn-green" onclick="afficherProchainMatch()">➡️ Match suivant</button>`;
        boutonClassement = `<button class="btn-action btn-blue" onclick="afficherClassement()">📊 Classements</button>`;
    }
    // League mode tracking
    else if (window._isLigueMatch && window.ligueData) {
        const data = window.ligueData;
        const lmd = window.ligueMatchData;
        const monIdx = data.monEquipeIndex;
        
        // Update my match
        lmd.monMatch.played = true;
        lmd.monMatch.scoreHome = lmd.monMatch.home === monIdx ? scoreA : scoreB;
        lmd.monMatch.scoreAway = lmd.monMatch.home === monIdx ? scoreB : scoreA;
        
        // Update standings for my match
        updateStandings(data, lmd.monMatch);
        
        // Simulate other matches
        lmd.journee.forEach(m => {
            if (!m.played) {
                const h = data.equipes[m.home];
                const a = data.equipes[m.away];
                const result = simulerMatchRapide(h, a);
                m.played = true;
                m.scoreHome = result.home;
                m.scoreAway = result.away;
                updateStandings(data, m);
            }
        });
        
        if (data.journeeActuelle < data.matchdays.length - 1) {
            boutonSuite = `<button class="btn-action btn-green" onclick="window.ligueData.journeeActuelle++; afficherJourneeLigue();">➡️ Journée suivante</button>`;
        } else {
            // Season over — offer transfer market
            boutonSuite = `<button class="btn-action btn-green" onclick="afficherFinLigue()">🏆 Voir résultats</button>`;
        }
        boutonClassement = `<button class="btn-action btn-blue" onclick="afficherJourneeLigue()">📊 Classement</button>`;
    }
    else {
        boutonSuite = `<button class="btn-action btn-green" onclick="afficherExhibition()">🔄 Rejouer</button>`;
    }
    
    if (scoreA > scoreB) SoundEngine.play('victory');
    
    const careerPoints = window.carriereData ? window.carriereData.points : 0;
    const careerGames = window.carriereData ? window.carriereData.matchsJoues : 0;
    const victoryBonus = scoreA > scoreB ? 180 : scoreA === scoreB ? 80 : 20;
    const matchScore = victoryBonus + (scoreA * 140) - (scoreB * 30) + (stats.tirsCadresA * 12) + possA + (careerPoints * 90) + (careerGames * 35);
    updateCatalogScore(matchScore);
    
    content.innerHTML = `
        <div class="game-panel">
            <h2>🏆 Résultat du match</h2>
            
            <div class="panel-card">
                <div style="display:flex;justify-content:space-around;align-items:center;margin:15px 0;">
                    <div style="text-align:center;">
                        <div style="font-size:32px;">${teamA.logo || '🏠'}</div>
                        <div style="font-size:20px;font-weight:bold;color:${teamA.couleur || '#ff6b6b'};">${teamA.nom}</div>
                        <div style="font-family:'Orbitron';font-size:56px;font-weight:900;color:#fff;text-shadow:3px 3px 6px #000;">${scoreA}</div>
                    </div>
                    <div style="font-family:'Orbitron';font-size:36px;color:#94a3b8;">—</div>
                    <div style="text-align:center;">
                        <div style="font-size:32px;">${teamB.logo || '⚔️'}</div>
                        <div style="font-size:20px;font-weight:bold;color:${teamB.couleur || '#4ecdc4'};">${teamB.nom}</div>
                        <div style="font-family:'Orbitron';font-size:56px;font-weight:900;color:#fff;text-shadow:3px 3px 6px #000;">${scoreB}</div>
                    </div>
                </div>
                <div style="text-align:center;font-size:22px;font-weight:bold;margin:10px 0;">
                    ${scoreA > scoreB ? '🎉 Victoire !' : scoreA < scoreB ? '😢 Défaite' : '🤝 Match nul'}
                </div>
            </div>

            <div class="panel-card">
                <h3 style="color:#fff;">📊 Statistiques</h3>
                <div style="display:grid;grid-template-columns:1fr auto 1fr;gap:8px;margin:12px 0;text-align:center;">
                    <div style="color:${teamA.couleur || '#ff6b6b'};font-weight:bold;">${possA}%</div><div style="color:#94a3b8;">Possession</div><div style="color:${teamB.couleur || '#4ecdc4'};font-weight:bold;">${possB}%</div>
                    <div style="color:${teamA.couleur || '#ff6b6b'};font-weight:bold;">${stats.tirsA}</div><div style="color:#94a3b8;">Tirs</div><div style="color:${teamB.couleur || '#4ecdc4'};font-weight:bold;">${stats.tirsB}</div>
                    <div style="color:${teamA.couleur || '#ff6b6b'};font-weight:bold;">${stats.tirsCadresA}</div><div style="color:#94a3b8;">Tirs cadrés</div><div style="color:${teamB.couleur || '#4ecdc4'};font-weight:bold;">${stats.tirsCadresB}</div>
                    <div style="color:${teamA.couleur || '#ff6b6b'};font-weight:bold;">${stats.fautesA}</div><div style="color:#94a3b8;">Fautes</div><div style="color:${teamB.couleur || '#4ecdc4'};font-weight:bold;">${stats.fautesB}</div>
                    <div style="color:${teamA.couleur || '#ff6b6b'};font-weight:bold;">🟨${stats.jaunesA} 🟥${stats.rougesA}</div><div style="color:#94a3b8;">Cartons</div><div style="color:${teamB.couleur || '#4ecdc4'};font-weight:bold;">🟨${stats.jaunesB} 🟥${stats.rougesB}</div>
                    ${stats.blessuresA.length + stats.blessuresB.length > 0 ? `<div style="color:#fca5a5;">${stats.blessuresA.length}</div><div style="color:#94a3b8;">🏥 Blessures</div><div style="color:#fca5a5;">${stats.blessuresB.length}</div>` : ''}
                </div>
            </div>

            <div class="panel-card">
                <h3 style="color:#fff;">📝 Commentaires</h3>
                <div style="max-height:200px;overflow-y:auto;padding:8px;">
                    ${commentaires.map((c, i) => `
                        <div style="padding:6px 10px;margin:3px 0;background:${i % 2 === 0 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.2)'};border-left:3px solid ${c.includes('BUT') ? '#4caf50' : c.includes('🟥') ? '#f44336' : c.includes('🏥') ? '#ef4444' : '#4ecdc4'};border-radius:5px;color:#fff;font-size:13px;text-align:left;">
                            ${c}
                        </div>
                    `).join('')}
                </div>
            </div>

            <div style="text-align:center;margin-top:15px;">
                ${boutonSuite}
                ${boutonClassement}
            </div>
        </div>
    `;
}

// ==================== LEAGUE HELPERS ====================

function simulerMatchRapide(home, away) {
    const attH = home.attaque + Math.random() * 20 - 10;
    const defH = home.defense + Math.random() * 20 - 10;
    const attA = away.attaque + Math.random() * 20 - 10;
    const defA = away.defense + Math.random() * 20 - 10;
    
    let goalsH = Math.max(0, Math.round((attH - defA / 2) / 30 + Math.random() * 2 - 0.5));
    let goalsA = Math.max(0, Math.round((attA - defH / 2) / 30 + Math.random() * 2 - 0.5));
    
    return { home: Math.min(goalsH, 6), away: Math.min(goalsA, 6) };
}

function updateStandings(data, match) {
    const home = data.classement.find(c => c.nom === data.equipes[match.home].nom);
    const away = data.classement.find(c => c.nom === data.equipes[match.away].nom);
    
    if (!home || !away) return;
    
    home.mj++; away.mj++;
    home.bp += match.scoreHome; home.bc += match.scoreAway;
    away.bp += match.scoreAway; away.bc += match.scoreHome;
    
    if (match.scoreHome > match.scoreAway) {
        home.v++; home.pts += 3; away.d++;
    } else if (match.scoreHome < match.scoreAway) {
        away.v++; away.pts += 3; home.d++;
    } else {
        home.n++; away.n++; home.pts++; away.pts++;
    }
    
    home.diff = home.bp - home.bc;
    away.diff = away.bp - away.bc;
}

function afficherFinLigue() {
    const data = window.ligueData;
    const sorted = [...data.classement].sort((a, b) => b.pts - a.pts || b.diff - a.diff || b.bp - a.bp);
    const monEquipe = data.equipes[data.monEquipeIndex];
    const monRang = sorted.findIndex(c => c.nom === monEquipe.nom) + 1;
    
    const isChampion = monRang === 1;
    if (isChampion) SoundEngine.play('victory');
    
    const ligueScore = sorted.find(c => c.nom === monEquipe.nom);
    const finalScore = (ligueScore.pts * 150) + (ligueScore.v * 200) + (ligueScore.bp * 40) + (isChampion ? 3000 : monRang <= 3 ? 1500 : 500);
    updateCatalogScore(finalScore);
    
    content.innerHTML = `
        <div class="game-panel">
            <h2>${isChampion ? '🏆🏆 CHAMPION DE LA LIGUE ! 🏆🏆' : `🏅 Saison terminée — ${monRang}${monRang === 1 ? 'er' : 'e'} place`}</h2>
            
            <div class="panel-card">
                <h3 style="color:#ffd700;margin-bottom:12px;">📊 Classement final</h3>
                <div style="overflow-x:auto;">
                    <table class="league-table">
                        <thead><tr>
                            <th>#</th><th style="text-align:left;">Équipe</th><th>MJ</th><th>V</th><th>N</th><th>D</th><th>BP</th><th>BC</th><th>Diff</th><th>Pts</th>
                        </tr></thead>
                        <tbody>
                            ${sorted.map((t, i) => `
                                <tr class="${t.nom === monEquipe.nom ? 'my-team' : ''}">
                                    <td style="font-weight:bold;color:${i === 0 ? '#ffd700' : i < 3 ? '#22c55e' : '#fff'};">${i + 1}</td>
                                    <td style="text-align:left;">${t.logo} ${t.nom}</td>
                                    <td>${t.mj}</td><td>${t.v}</td><td>${t.n}</td><td>${t.d}</td>
                                    <td>${t.bp}</td><td>${t.bc}</td>
                                    <td style="color:${t.diff > 0 ? '#22c55e' : t.diff < 0 ? '#ef4444' : '#fff'};">${t.diff > 0 ? '+' : ''}${t.diff}</td>
                                    <td style="font-weight:bold;color:#ffd700;">${t.pts}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <div style="text-align:center;margin-top:20px;">
                <button class="btn-action btn-orange" onclick="afficherTransferts()">💰 Marché des transferts</button>
                <button class="btn-action btn-green" onclick="afficherLigue()">🔄 Nouvelle saison</button>
            </div>
        </div>
    `;
}

// ==================== TRANSFER MARKET ====================

function afficherTransferts() {
    const data = window.ligueData || window.carriereData;
    if (!data) { afficherLigue(); return; }
    
    const monIdx = data.monEquipeIndex !== undefined ? data.monEquipeIndex : null;
    const monEquipe = monIdx !== null ? data.equipes[monIdx] : (data.equipe || null);
    if (!monEquipe) { afficherLigue(); return; }
    
    const budget = data.budget || 5000000;
    
    // Generate transfer targets from other teams
    const joueursDispo = [];
    const allEquipes = data.equipes || equipes;
    
    allEquipes.forEach((e, eIdx) => {
        if (e.nom === monEquipe.nom) return;
        if (e.joueurs) {
            e.joueurs.forEach(j => {
                if (Math.random() < 0.3 && !j.blesse) {
                    joueursDispo.push({ ...j, equipeOrigine: e.nom, equipeOrigineLogo: e.logo, equipeIdx: eIdx });
                }
            });
        }
    });
    
    // Sort by global rating
    joueursDispo.sort((a, b) => b.global - a.global);
    const topTargets = joueursDispo.slice(0, 8);
    
    content.innerHTML = `
        <div class="game-panel">
            <h2>💰 Marché des Transferts</h2>
            <div style="margin:15px 0;">
                <span style="font-family:'Orbitron';font-size:24px;color:#ffd700;">💰 ${formatMoney(budget)}</span>
                <span style="color:#94a3b8;margin-left:10px;">Budget disponible</span>
            </div>
            
            <div class="panel-card">
                <h3 style="color:#22c55e;margin-bottom:15px;">🛒 Joueurs disponibles</h3>
                <div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(300px, 1fr));gap:12px;">
                    ${topTargets.map((j, i) => `
                        <div class="transfer-card">
                            <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:10px;">
                                <div>
                                    <div style="font-weight:bold;font-size:16px;color:#fff;">${j.nom}</div>
                                    <div style="font-size:13px;color:#94a3b8;">${j.equipeOrigineLogo || ''} ${j.equipeOrigine} — ${roleLabels[j.role]}</div>
                                </div>
                                <div style="text-align:right;">
                                    <div style="font-family:'Orbitron';font-size:22px;font-weight:bold;color:${j.global > 75 ? '#22c55e' : j.global > 60 ? '#f59e0b' : '#ef4444'};">${j.global}</div>
                                    <div style="font-size:11px;color:#94a3b8;">GLOBAL</div>
                                </div>
                            </div>
                            <div style="font-size:12px;color:#94a3b8;margin-bottom:8px;">
                                ⚡${j.vitesse} 🎯${j.tir} 🎯${j.passe} 🛡${j.defense} 💪${j.physique}
                            </div>
                            <div style="display:flex;justify-content:space-between;align-items:center;">
                                <div class="transfer-price">${formatMoney(j.valeur)}</div>
                                <button class="btn-action btn-green" style="padding:8px 18px;font-size:14px;margin:0;" onclick="acheterJoueur(${i})" ${j.valeur > budget ? 'disabled style="opacity:0.4;padding:8px 18px;font-size:14px;margin:0;"' : ''}>
                                    ${j.valeur > budget ? '❌ Trop cher' : '✅ Recruter'}
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <div style="text-align:center;margin-top:20px;">
                <button class="btn-action btn-blue" onclick="${window.ligueData ? 'afficherFinLigue()' : 'afficherProchainMatch()'}">⬅️ Retour</button>
            </div>
        </div>
    `;
    
    window._transferTargets = topTargets;
}

function acheterJoueur(index) {
    const data = window.ligueData || window.carriereData;
    const target = window._transferTargets[index];
    if (!target || !data) return;
    
    if (target.valeur > data.budget) { alert("Budget insuffisant !"); return; }
    
    data.budget -= target.valeur;
    
    const monEquipe = data.equipes ? data.equipes[data.monEquipeIndex] : data.equipe;
    const newPlayer = { ...target };
    delete newPlayer.equipeOrigine;
    delete newPlayer.equipeOrigineLogo;
    delete newPlayer.equipeIdx;
    newPlayer.titulaire = false;
    newPlayer.buts = 0;
    newPlayer.passes = 0;
    
    monEquipe.joueurs.push(newPlayer);
    
    SoundEngine.play('transfer');
    
    // Refresh the view
    afficherTransferts();
}

function formatMoney(amount) {
    if (amount >= 1000000) return (amount / 1000000).toFixed(1) + 'M€';
    if (amount >= 1000) return (amount / 1000).toFixed(0) + 'K€';
    return amount + '€';
}

// ==================== CAREER END / CLASSEMENT ====================

function afficherFinCarriere(resultat) {
    const data = window.carriereData;
    let titre, message, emoji;
    
    if (resultat === 'champion') {
        titre = '🏆🏆 CHAMPION ! 🏆🏆';
        message = `Félicitations ! Tu as remporté la compétition avec ${data.equipe.nom} !`;
        emoji = '🎉';
        SoundEngine.play('victory');
    } else {
        titre = '❌ Éliminé';
        message = `Dommage ! Éliminé en poules avec ${data.points} points.`;
        emoji = '😢';
    }

    const finalCareerScore = (data.points * 120) + (data.matchsGagnes * 200) + (data.butsMarques * 40) + (resultat === "champion" ? 2500 : 500);
    updateCatalogScore(finalCareerScore);
    
    content.innerHTML = `
        <div class="game-panel" style="text-align:center;">
            <div style="font-size:80px;margin-bottom:20px;">${emoji}</div>
            <h2 style="font-size:28px;">${titre}</h2>
            <p style="color:#fff;font-size:18px;margin:15px 0;">${message}</p>
            
            <div class="panel-card">
                <h3 style="color:#ffd700;">📊 Statistiques finales</h3>
                <div class="panel-grid panel-grid-4">
                    <div class="panel-stat-box"><div class="panel-stat-value" style="color:#4caf50;">${data.matchsGagnes}</div><div class="panel-stat-label">Victoires</div></div>
                    <div class="panel-stat-box"><div class="panel-stat-value" style="color:#ff6b6b;">${data.matchsPerdus}</div><div class="panel-stat-label">Défaites</div></div>
                    <div class="panel-stat-box"><div class="panel-stat-value" style="color:#ffd700;">${data.matchsNuls}</div><div class="panel-stat-label">Nuls</div></div>
                    <div class="panel-stat-box"><div class="panel-stat-value" style="color:#4ecdc4;">${data.points}</div><div class="panel-stat-label">Points</div></div>
                </div>
            </div>
            
            <div style="margin-top:20px;">
                <button class="btn-action btn-orange" onclick="afficherTransfertsCarriere()">💰 Transferts</button>
                <button class="btn-action btn-green" onclick="afficherCarriere()">🔄 Nouvelle carrière</button>
            </div>
        </div>
    `;
}

function afficherTransfertsCarriere() {
    if (!window.carriereData) { afficherCarriere(); return; }
    
    // Temporarily make a compatible structure
    window.carriereData.equipes = equipes.map((e, i) => {
        const team = { ...e };
        team.joueurs = genererJoueursDetailles(e.nom, e.attaque, e.defense);
        if (e.nom === window.carriereData.equipe.nom) return window.carriereData.equipe;
        return team;
    });
    window.carriereData.monEquipeIndex = equipes.findIndex(e => e.nom === window.carriereData.equipe.nom);
    
    afficherTransferts();
}

function afficherClassement() {
    const data = window.carriereData;
    const buteursArray = Object.entries(data.buteurs).sort((a, b) => b[1] - a[1]);
    const passeursArray = Object.entries(data.passeurs).sort((a, b) => b[1] - a[1]);
    
    content.innerHTML = `
        <div class="game-panel">
            <h2>📊 Classements</h2>
            
            <div class="panel-card">
                <h3 style="color:#ffd700;margin-bottom:12px;">🏆 Bilan général</h3>
                <div class="panel-grid panel-grid-3">
                    <div class="panel-stat-box"><div class="panel-stat-value" style="color:#4caf50;">${data.matchsGagnes}-${data.matchsNuls}-${data.matchsPerdus}</div><div class="panel-stat-label">V-N-D</div></div>
                    <div class="panel-stat-box"><div class="panel-stat-value" style="color:#ffd700;">${data.points} pts</div><div class="panel-stat-label">Points</div></div>
                    <div class="panel-stat-box"><div class="panel-stat-value" style="color:#4ecdc4;">${data.butsMarques}-${data.butsEncaisses}</div><div class="panel-stat-label">Buts</div></div>
                </div>
            </div>
            
            <div class="panel-grid panel-grid-2">
                <div class="panel-card">
                    <h3 style="color:#ffd700;margin-bottom:12px;">⚽ Top Buteurs</h3>
                    ${buteursArray.slice(0, 6).map((b, i) => `
                        <div style="display:flex;justify-content:space-between;padding:8px;margin:4px 0;background:${i === 0 ? 'rgba(255,215,0,0.2)' : 'rgba(255,255,255,0.05)'};border-radius:8px;border-left:3px solid ${i === 0 ? '#ffd700' : '#4ecdc4'};">
                            <span style="color:#fff;">${i + 1}. ${b[0]}</span>
                            <span style="font-weight:bold;color:#ffd700;">${b[1]} ⚽</span>
                        </div>
                    `).join('')}
                </div>
                
                <div class="panel-card">
                    <h3 style="color:#ffd700;margin-bottom:12px;">🎯 Top Passeurs</h3>
                    ${passeursArray.slice(0, 6).map((p, i) => `
                        <div style="display:flex;justify-content:space-between;padding:8px;margin:4px 0;background:${i === 0 ? 'rgba(255,215,0,0.2)' : 'rgba(255,255,255,0.05)'};border-radius:8px;border-left:3px solid ${i === 0 ? '#ffd700' : '#4ecdc4'};">
                            <span style="color:#fff;">${i + 1}. ${p[0]}</span>
                            <span style="font-weight:bold;color:#4ecdc4;">${p[1]} 🎯</span>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <div class="panel-card">
                <h3 style="color:#ffd700;margin-bottom:12px;">📋 Historique des matchs</h3>
                <div style="max-height:250px;overflow-y:auto;">
                    ${data.classementEquipes.map((m, i) => `
                        <div style="display:flex;justify-content:space-between;align-items:center;padding:10px;margin:4px 0;background:${m.resultat === 'V' ? 'rgba(76,175,80,0.2)' : m.resultat === 'D' ? 'rgba(244,67,54,0.2)' : 'rgba(255,193,7,0.2)'};border-radius:8px;border-left:3px solid ${m.resultat === 'V' ? '#4caf50' : m.resultat === 'D' ? '#f44336' : '#ffc107'};">
                            <span style="color:#fff;"><b>Match ${i + 1}</b> — vs ${m.adversaire}</span>
                            <div style="display:flex;align-items:center;gap:10px;">
                                <span style="font-family:'Orbitron';font-size:18px;color:#fff;">${m.scoreA} - ${m.scoreB}</span>
                                <span style="padding:4px 12px;background:${m.resultat === 'V' ? '#4caf50' : m.resultat === 'D' ? '#f44336' : '#ffc107'};border-radius:20px;font-weight:bold;font-size:13px;">${m.resultat}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <div style="text-align:center;margin-top:15px;">
                <button class="btn-action btn-green" onclick="afficherProchainMatch()">⬅️ Retour</button>
            </div>
        </div>
    `;
}