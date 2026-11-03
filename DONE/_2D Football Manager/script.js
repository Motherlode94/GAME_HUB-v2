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
const MAX_TITULAIRES = 10;
const FORMATION_OUTFIELD_SLOTS = 9;

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
                numero: idx + 1,
                role: p.role,
                titulaire: idx < 10,
                vitesse: clamp(vitesse),
                tir: clamp(tir),
                passe: clamp(passe),
                defense: clamp(defense),
                physique: clamp(physique),
                gardien: p.role === 'gardien' ? clamp(gardien) : 0,
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
    const total = atts.reduce((s, j) => s + (j.tir * getFacteurFormeJoueur(j)), 0);
    return Math.round(total / atts.length);
}

function getEquipeDef(joueurs) {
    const defs = joueurs.filter(j => j.titulaire && !j.blesse && (j.role === 'defense' || j.role === 'gardien'));
    if (defs.length === 0) return 50;
    const total = defs.reduce((s, j) => {
        const statDef = j.role === 'gardien' ? Math.round((j.defense + j.gardien) / 2) : j.defense;
        return s + (statDef * getFacteurFormeJoueur(j));
    }, 0);
    return Math.round(total / defs.length);
}

function getFacteurFormeJoueur(joueur) {
    const fatigue = clampNombre(joueur.fatigue, 0, 100, 25);
    const moral = clampNombre(joueur.moral, 20, 100, 65);
    const fatiguePenalty = fatigue / 150; // 0 to ~0.66
    const moralBonus = (moral - 65) / 220; // about -0.2 to +0.15
    return Math.max(0.65, Math.min(1.15, 1 - fatiguePenalty + moralBonus));
}

function getFormationTargets(formation) {
    const def = Math.max(2, (formation && Number.isFinite(formation.def) ? formation.def : 4) - 1);
    const mid = Math.max(2, formation && Number.isFinite(formation.mid) ? formation.mid : 3);
    let att = Math.max(1, FORMATION_OUTFIELD_SLOTS - def - mid);

    let sum = def + mid + att;
    if (sum !== FORMATION_OUTFIELD_SLOTS) {
        att += FORMATION_OUTFIELD_SLOTS - sum;
        att = Math.max(1, att);
        sum = def + mid + att;
    }
    if (sum > FORMATION_OUTFIELD_SLOTS) {
        const surplus = sum - FORMATION_OUTFIELD_SLOTS;
        const takeMid = Math.min(surplus, Math.max(0, mid - 2));
        const takeDef = Math.max(0, surplus - takeMid);
        return { gardien: 1, defense: Math.max(2, def - takeDef), milieu: Math.max(2, mid - takeMid), attaque: att };
    }
    return { gardien: 1, defense: def, milieu: mid, attaque: att };
}

function autoComposerEquipeParFormation(equipe, formation) {
    if (!equipe || !Array.isArray(equipe.joueurs)) return;
    const targets = getFormationTargets(formation);
    const joueurs = equipe.joueurs.map((j, i) => ({ joueur: j, index: i }));
    joueurs.forEach(x => { x.joueur.titulaire = false; });

    const available = (role) => joueurs
        .filter(x => !x.joueur.blesse && !x.joueur.titulaire && (role ? x.joueur.role === role : true))
        .sort((a, b) => b.joueur.global - a.joueur.global);

    const take = (role, count) => {
        for (let i = 0; i < count; i++) {
            const candidate = available(role)[0];
            if (!candidate) break;
            candidate.joueur.titulaire = true;
        }
    };

    take('gardien', targets.gardien);
    take('defense', targets.defense);
    take('milieu', targets.milieu);
    take('attaque', targets.attaque);

    let titulaires = equipe.joueurs.filter(j => j.titulaire).length;
    if (titulaires < MAX_TITULAIRES) {
        available().forEach(c => {
            if (titulaires >= MAX_TITULAIRES) return;
            c.joueur.titulaire = true;
            titulaires++;
        });
    }
    equilibrerTitulaires(equipe);
}

function clampNombre(value, min, max, fallback = min) {
    const n = Number(value);
    if (!Number.isFinite(n)) return fallback;
    return Math.max(min, Math.min(max, Math.round(n)));
}

function recalculerJoueur(joueur) {
    joueur.global = Math.round((joueur.vitesse + joueur.tir + joueur.passe + joueur.defense + joueur.physique + (joueur.gardien || joueur.tir)) / 6);
    const baseValeur = joueur.role === 'attaque' ? 130000 : joueur.role === 'milieu' ? 120000 : joueur.role === 'gardien' ? 115000 : 110000;
    joueur.valeur = Math.round((joueur.global * baseValeur) / 1000) * 1000;
    return joueur;
}

function normaliserJoueur(joueur, index = 0) {
    const nom = String(joueur.nom || `Joueur ${index + 1}`).trim();
    joueur.nom = nom || `Joueur ${index + 1}`;
    joueur.numero = clampNombre(joueur.numero, 1, 99, index + 1);
    joueur.role = roleLabels[joueur.role] ? joueur.role : 'milieu';
    joueur.titulaire = !!joueur.titulaire;
    joueur.vitesse = clampNombre(joueur.vitesse, 20, 99, 55);
    joueur.tir = clampNombre(joueur.tir, 20, 99, 55);
    joueur.passe = clampNombre(joueur.passe, 20, 99, 55);
    joueur.defense = clampNombre(joueur.defense, 20, 99, 55);
    joueur.physique = clampNombre(joueur.physique, 20, 99, 55);
    joueur.gardien = joueur.role === 'gardien'
        ? clampNombre(joueur.gardien, 20, 99, 60)
        : 0;
    joueur.expulse = !!joueur.expulse;
    joueur.blesse = !!joueur.blesse;
    joueur.blesseMatchs = clampNombre(joueur.blesseMatchs, 0, 20, 0);
    joueur.fatigue = clampNombre(joueur.fatigue, 0, 100, 25);
    joueur.moral = clampNombre(joueur.moral, 20, 100, 65);
    joueur.buts = clampNombre(joueur.buts, 0, 999, 0);
    joueur.passes = clampNombre(joueur.passes, 0, 999, 0);
    return recalculerJoueur(joueur);
}

function equilibrerTitulaires(equipe, preserveIndex = -1) {
    if (!equipe || !Array.isArray(equipe.joueurs)) return;
    const titulaires = equipe.joueurs
        .map((j, i) => ({ j, i }))
        .filter(x => x.j.titulaire && x.i !== preserveIndex);
    if (titulaires.length >= MAX_TITULAIRES && preserveIndex >= 0 && equipe.joueurs[preserveIndex]) {
        equipe.joueurs[preserveIndex].titulaire = false;
    }
    let actifs = equipe.joueurs.filter(j => j.titulaire).length;
    if (actifs <= MAX_TITULAIRES) return;
    for (let i = equipe.joueurs.length - 1; i >= 0 && actifs > MAX_TITULAIRES; i--) {
        if (equipe.joueurs[i].titulaire && i !== preserveIndex) {
            equipe.joueurs[i].titulaire = false;
            actifs--;
        }
    }
}

function syncEquipeDepuisEffectif(equipe) {
    if (!equipe || !Array.isArray(equipe.joueurs)) return;
    equipe.joueurs = equipe.joueurs.map((j, i) => normaliserJoueur(j, i));
    equilibrerTitulaires(equipe);
    equipe.attaque = getEquipeAtt(equipe.joueurs);
    equipe.defense = getEquipeDef(equipe.joueurs);
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

function getActiveGameData() {
    if (window.activeMode === 'exhibition' && window.exhibitionData) return { mode: 'exhibition', data: window.exhibitionData };
    if (window.activeMode === 'ligue' && window.ligueData) return { mode: 'ligue', data: window.ligueData };
    if (window.activeMode === 'carriere' && window.carriereData) return { mode: 'carriere', data: window.carriereData };
    if (window.exhibitionData && !window.carriereData && !window.ligueData) return { mode: 'exhibition', data: window.exhibitionData };
    if (window.ligueData && !window.carriereData) return { mode: 'ligue', data: window.ligueData };
    if (window.carriereData && !window.ligueData) return { mode: 'carriere', data: window.carriereData };
    if (window.carriereData) return { mode: 'carriere', data: window.carriereData };
    if (window.ligueData) return { mode: 'ligue', data: window.ligueData };
    if (window.exhibitionData) return { mode: 'exhibition', data: window.exhibitionData };
    return null;
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
    window.exhibitionData = null;
    window.activeMode = mode || null;
    
    switch (mode) {
        case "exhibition": afficherExhibition(); break;
        case "career-team": afficherCarriere(); break;
        case "league": afficherLigue(); break;
        case "career-player": afficherCarriere(); break;
    }
}

// ==================== EXHIBITION MODE ====================

function getSelectedExhibitionIndices() {
    const checked = document.querySelectorAll("#teams input:checked");
    if (checked.length !== 2) return null;
    return [parseInt(checked[0].value, 10), parseInt(checked[1].value, 10)];
}

function buildExhibitionTeam(teamIndex) {
    const base = equipes[teamIndex];
    const team = { ...base };
    team.joueurs = genererJoueursDetailles(team.nom, team.attaque, team.defense);
    syncEquipeDepuisEffectif(team);
    return team;
}

function prepareExhibitionData(editSide = 0) {
    const selected = getSelectedExhibitionIndices();
    if (!selected) {
        alert("Selectionne exactement 2 equipes pour utiliser le cheat menu.");
        return null;
    }

    const key = selected.join('-');
    const existing = window.exhibitionData;
    const sameSelection = !!(existing && Array.isArray(existing.selection) && existing.selection.join('-') === key);

    if (!sameSelection) {
        window.exhibitionData = {
            equipes: [buildExhibitionTeam(selected[0]), buildExhibitionTeam(selected[1])],
            monEquipeIndex: editSide === 1 ? 1 : 0,
            budget: 5000000,
            selection: selected
        };
    } else {
        existing.monEquipeIndex = editSide === 1 ? 1 : 0;
        existing.budget = clampNombre(existing.budget, 0, 9999999999, 5000000);
        existing.equipes.forEach(syncEquipeDepuisEffectif);
    }

    window.activeMode = 'exhibition';
    return window.exhibitionData;
}

function ouvrirCheatMenuExhibition(editSide = 0) {
    const data = prepareExhibitionData(editSide);
    if (!data) return;
    afficherCheatMenu('exhibition');
}

function afficherExhibition() {
    window.activeMode = 'exhibition';
    content.innerHTML = `
        <div class="game-panel">
            <h2>🎮 Exhibition</h2>
            <p style="color:#ddd; margin:10px 0;">Choisis deux équipes pour un match rapide</p>
            <div class="panel-card">
                <div id="teams" style="display:grid; grid-template-columns:repeat(2, 1fr); gap:10px; text-align:left;"></div>
            </div>
            <div style="text-align:center;">
                <button class="btn-action btn-green" id="playMatch">Jouer le match</button>
                <button class="btn-action btn-orange" onclick="ouvrirCheatMenuExhibition(0)">Cheat Equipe 1</button>
                <button class="btn-action btn-orange" onclick="ouvrirCheatMenuExhibition(1)">Cheat Equipe 2</button>
            </div>
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

    if (window.exhibitionData && Array.isArray(window.exhibitionData.selection)) {
        window.exhibitionData.selection.forEach(idx => {
            const checkbox = document.getElementById(`team${idx}`);
            if (checkbox) checkbox.checked = true;
        });
    }

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
    window.activeMode = 'carriere';
    const equipeIndex = document.getElementById('equipeCarriere').value;
    const niveauIndex = document.getElementById('niveauDifficulte').value;
    
    const baseEquipe = equipes[equipeIndex];
    const monEquipe = { ...baseEquipe };
    const maCouleur = couleursDisponibles[window.couleurSelectionneeIndex].code;
    const niveau = niveauxDifficulte[niveauIndex];
    
    monEquipe.couleur = maCouleur;
    monEquipe.joueurs = genererJoueursDetailles(monEquipe.nom, monEquipe.attaque, monEquipe.defense);
    autoComposerEquipeParFormation(monEquipe, formations[window.selectedFormation]);
    syncEquipeDepuisEffectif(monEquipe);
    
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
        budget: 5000000,
        gestion: {
            entrainements: 0,
            soins: 0,
            message: '',
            messageColor: '#4ecdc4'
        }
    };
    
    monEquipe.joueurs.forEach(j => {
        window.carriereData.buteurs[j.nom] = j.buts;
        window.carriereData.passeurs[j.nom] = j.passes;
    });
    
    SoundEngine.play('whistle');
    afficherProchainMatch();
}

function afficherProchainMatch() {
    window.activeMode = 'carriere';
    const data = window.carriereData;
    
    // Recovery step between matches
    data.equipe.joueurs.forEach(j => {
        if (j.blesse && j.blesseMatchs > 0) {
            j.blesseMatchs--;
            if (j.blesseMatchs <= 0) { j.blesse = false; j.blesseMatchs = 0; }
        }
        j.fatigue = clampNombre((j.fatigue || 0) - 10, 0, 100, 20);
        j.moral = clampNombre((j.moral || 65) + 1, 20, 100, 65);
    });
    data.subsRestants = 3;
    syncEquipeDepuisEffectif(data.equipe);
    
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
    const actifs = data.equipe.joueurs.filter(j => j.titulaire && !j.blesse);
    const fatigueMoy = actifs.length ? Math.round(actifs.reduce((s, j) => s + (j.fatigue || 0), 0) / actifs.length) : 0;
    const moralMoy = actifs.length ? Math.round(actifs.reduce((s, j) => s + (j.moral || 65), 0) / actifs.length) : 65;
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
                <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:10px;">
                    <span style="background:rgba(14,165,233,0.15);padding:4px 10px;border-radius:999px;font-size:12px;">Forme: ${100 - fatigueMoy}%</span>
                    <span style="background:rgba(34,197,94,0.15);padding:4px 10px;border-radius:999px;font-size:12px;">Moral: ${moralMoy}%</span>
                    <span style="background:rgba(245,158,11,0.15);padding:4px 10px;border-radius:999px;font-size:12px;">Budget: ${formatMoney(data.budget || 0)}</span>
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
                    <button class="btn-action btn-orange" onclick="afficherGestionEquipeCarriere()">Gestion Equipe</button>
                    <button class="btn-action btn-orange" onclick="afficherCheatMenu('carriere')">Cheat Menu</button>
                </div>
            </div>
            
            <button class="btn-action btn-red" onclick="afficherCarriere()" style="margin-top:10px;">❌ Abandonner</button>
        </div>
    `;
}

// ==================== EFFECTIF (SQUAD VIEW) ====================

function afficherEffectif() {
    window.activeMode = 'carriere';
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
                    <div class="player-name">#${j.numero || '--'} ${j.nom} ${injuryHTML}</div>
                    <div class="player-stats-mini">
                        ⚡${j.vitesse} 🎯${j.tir} 🎯${j.passe} 🛡${j.defense} 💪${j.physique}
                        ${j.role === 'gardien' ? ' 🧤' + j.gardien : ''}
                    </div>
                    <div class="stat-bar-container">
                        <div class="stat-bar-fill" style="width:${j.global}%;background:linear-gradient(90deg, ${j.global > 75 ? '#22c55e' : j.global > 60 ? '#f59e0b' : '#ef4444'}, ${j.global > 75 ? '#14b8a6' : j.global > 60 ? '#eab308' : '#dc2626'});"></div>
                    </div>
                    <div style="font-size:12px;color:#94a3b8;margin-top:2px;">Global: ${j.global} | Forme: ${100 - (j.fatigue || 0)}% | Moral: ${j.moral || 65}% | ⚽ ${j.buts} | 🎯 ${j.passes} | 💰 ${formatMoney(j.valeur)}</div>
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
                <button class="btn-action btn-blue" onclick="afficherGestionEquipeCarriere()">Gestion Equipe</button>
                <button class="btn-action btn-orange" onclick="afficherCheatMenu('effectif')">Cheat Menu</button>
            </div>
        </div>
    `;
}

function setGestionMessageCarriere(text, color = '#4ecdc4') {
    const data = window.carriereData;
    if (!data) return;
    data.gestion = data.gestion || {};
    data.gestion.message = text;
    data.gestion.messageColor = color;
}

function getEtatMoyenTitulaires(equipe) {
    if (!equipe || !Array.isArray(equipe.joueurs)) return { fatigue: 0, moral: 65 };
    const tit = equipe.joueurs.filter(j => j.titulaire && !j.blesse);
    if (tit.length === 0) return { fatigue: 0, moral: 65 };
    return {
        fatigue: Math.round(tit.reduce((s, j) => s + (j.fatigue || 0), 0) / tit.length),
        moral: Math.round(tit.reduce((s, j) => s + (j.moral || 65), 0) / tit.length)
    };
}

function afficherGestionEquipeCarriere() {
    window.activeMode = 'carriere';
    const data = window.carriereData;
    if (!data || !data.equipe || !Array.isArray(data.equipe.joueurs)) { afficherCarriere(); return; }

    data.gestion = data.gestion || { entrainements: 0, soins: 0, message: '', messageColor: '#4ecdc4' };
    syncEquipeDepuisEffectif(data.equipe);

    const targets = getFormationTargets(data.formation);
    const titulaires = data.equipe.joueurs.filter(j => j.titulaire);
    const counts = {
        gardien: titulaires.filter(j => j.role === 'gardien').length,
        defense: titulaires.filter(j => j.role === 'defense').length,
        milieu: titulaires.filter(j => j.role === 'milieu').length,
        attaque: titulaires.filter(j => j.role === 'attaque').length
    };
    const etat = getEtatMoyenTitulaires(data.equipe);
    const messageHTML = data.gestion.message
        ? `<div style="margin:8px 0;padding:10px;border-radius:10px;background:rgba(255,255,255,0.06);color:${data.gestion.messageColor || '#4ecdc4'};">${data.gestion.message}</div>`
        : '';

    const formationCards = formations.map((f, i) => `
        <button class="strategy-btn ${data.formation && data.formation.nom === f.nom ? 'selected' : ''}" style="min-width:90px;" onclick="changerFormationGestionCarriere(${i})">${f.nom}</button>
    `).join('');

    const rows = data.equipe.joueurs.map((j, i) => {
        const soignerDisabled = !j.blesse ? 'disabled style="opacity:0.4;"' : '';
        const titulaireDisabled = j.blesse ? 'disabled' : '';
        return `
            <tr>
                <td>#${j.numero || '--'}</td>
                <td style="text-align:left;font-weight:bold;">${j.nom}${j.blesse ? ` <span class="injury-badge">INF ${j.blesseMatchs}m</span>` : ''}</td>
                <td>
                    <select onchange="changerRoleGestionCarriere(${i}, this.value)" style="min-width:80px;padding:5px;">
                        ${Object.entries(roleLabels).map(([k, v]) => `<option value="${k}" ${j.role === k ? 'selected' : ''}>${v}</option>`).join('')}
                    </select>
                </td>
                <td>${j.global}</td>
                <td style="color:${(j.fatigue || 0) > 70 ? '#ef4444' : '#93c5fd'};">${100 - (j.fatigue || 0)}%</td>
                <td style="color:${(j.moral || 65) < 45 ? '#ef4444' : '#22c55e'};">${j.moral || 65}%</td>
                <td><input type="checkbox" ${j.titulaire ? 'checked' : ''} ${titulaireDisabled} onchange="toggleTitulaireGestionCarriere(${i}, this.checked)"></td>
                <td><button class="btn-action btn-orange" style="margin:0;padding:5px 10px;font-size:12px;" onclick="soignerJoueurCarriere(${i})" ${soignerDisabled}>Soigner</button></td>
            </tr>
        `;
    }).join('');

    content.innerHTML = `
        <div class="game-panel">
            <h2>Gestion d'equipe - ${data.equipe.nom}</h2>
            ${messageHTML}

            <div class="panel-card">
                <h3 style="color:#ffd700;">Composition & Formation</h3>
                <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-top:10px;">${formationCards}</div>
                <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:12px;">
                    <span style="background:rgba(255,255,255,0.08);padding:5px 10px;border-radius:999px;font-size:12px;">Titulaires: ${titulaires.length}/${MAX_TITULAIRES}</span>
                    <span style="background:rgba(59,130,246,0.15);padding:5px 10px;border-radius:999px;font-size:12px;">DEF ${counts.defense}/${targets.defense}</span>
                    <span style="background:rgba(34,197,94,0.15);padding:5px 10px;border-radius:999px;font-size:12px;">MID ${counts.milieu}/${targets.milieu}</span>
                    <span style="background:rgba(239,68,68,0.15);padding:5px 10px;border-radius:999px;font-size:12px;">ATT ${counts.attaque}/${targets.attaque}</span>
                </div>
                <div style="text-align:center;margin-top:10px;">
                    <button class="btn-action btn-blue" onclick="autoComposerGestionCarriere()">Auto-composer</button>
                </div>
            </div>

            <div class="panel-card">
                <h3 style="color:#22c55e;">Preparation de l'equipe</h3>
                <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin:10px 0;">
                    <span style="background:rgba(14,165,233,0.15);padding:5px 10px;border-radius:999px;font-size:12px;">Forme moyenne: ${100 - etat.fatigue}%</span>
                    <span style="background:rgba(34,197,94,0.15);padding:5px 10px;border-radius:999px;font-size:12px;">Moral moyen: ${etat.moral}%</span>
                    <span style="background:rgba(245,158,11,0.15);padding:5px 10px;border-radius:999px;font-size:12px;">Budget: ${formatMoney(data.budget || 0)}</span>
                    <span style="background:rgba(255,255,255,0.08);padding:5px 10px;border-radius:999px;font-size:12px;">Seances: ${data.gestion.entrainements || 0}</span>
                </div>
                <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;">
                    <button class="btn-action btn-green" onclick="appliquerEntrainementCarriere('attaque')">Entrainement Attaque</button>
                    <button class="btn-action btn-blue" onclick="appliquerEntrainementCarriere('defense')">Entrainement Defense</button>
                    <button class="btn-action btn-purple" onclick="appliquerEntrainementCarriere('technique')">Entrainement Technique</button>
                    <button class="btn-action btn-orange" onclick="reposEquipeCarriere()">Repos collectif</button>
                </div>
            </div>

            <div class="panel-card">
                <h3 style="color:#94a3b8;">Gestion individuelle</h3>
                <div style="overflow:auto;">
                    <table class="league-table">
                        <thead>
                            <tr><th>No</th><th style="text-align:left;">Joueur</th><th>Poste</th><th>OVR</th><th>Forme</th><th>Moral</th><th>Tit.</th><th>Medical</th></tr>
                        </thead>
                        <tbody>${rows}</tbody>
                    </table>
                </div>
            </div>

            <div style="text-align:center;margin-top:15px;">
                <button class="btn-action btn-green" onclick="afficherProchainMatch()">Retour</button>
            </div>
        </div>
    `;
}

function changerFormationGestionCarriere(index) {
    const data = window.carriereData;
    if (!data) return;
    data.formation = formations[index] || data.formation;
    autoComposerEquipeParFormation(data.equipe, data.formation);
    syncEquipeDepuisEffectif(data.equipe);
    setGestionMessageCarriere(`Formation active: ${data.formation.nom}. Composition adaptee automatiquement.`, '#22c55e');
    SoundEngine.play('click');
    afficherGestionEquipeCarriere();
}

function autoComposerGestionCarriere() {
    const data = window.carriereData;
    if (!data) return;
    autoComposerEquipeParFormation(data.equipe, data.formation);
    syncEquipeDepuisEffectif(data.equipe);
    setGestionMessageCarriere("Composition automatique appliquee selon la formation.", '#22c55e');
    SoundEngine.play('click');
    afficherGestionEquipeCarriere();
}

function changerRoleGestionCarriere(index, role) {
    const data = window.carriereData;
    if (!data || !data.equipe || !data.equipe.joueurs[index]) return;
    const j = data.equipe.joueurs[index];
    j.role = roleLabels[role] ? role : j.role;
    if (j.role === 'gardien' && (j.gardien || 0) < 45) j.gardien = 45;
    if (j.role !== 'gardien') j.gardien = 0;
    normaliserJoueur(j, index);
    syncEquipeDepuisEffectif(data.equipe);
    afficherGestionEquipeCarriere();
}

function toggleTitulaireGestionCarriere(index, checked) {
    const data = window.carriereData;
    if (!data || !data.equipe || !data.equipe.joueurs[index]) return;
    const joueur = data.equipe.joueurs[index];
    if (joueur.blesse && checked) {
        setGestionMessageCarriere(`${joueur.nom} est blesse et ne peut pas etre titulaire.`, '#ef4444');
        return afficherGestionEquipeCarriere();
    }

    const totalAvant = data.equipe.joueurs.filter(j => j.titulaire).length;
    if (checked && !joueur.titulaire && totalAvant >= MAX_TITULAIRES) {
        setGestionMessageCarriere(`Limite atteinte: ${MAX_TITULAIRES} titulaires maximum.`, '#ef4444');
        return afficherGestionEquipeCarriere();
    }

    joueur.titulaire = !!checked;
    equilibrerTitulaires(data.equipe, checked ? index : -1);
    syncEquipeDepuisEffectif(data.equipe);
    afficherGestionEquipeCarriere();
}

function reposEquipeCarriere() {
    const data = window.carriereData;
    if (!data || !data.equipe) return;
    data.equipe.joueurs.forEach(j => {
        j.fatigue = clampNombre((j.fatigue || 0) - 18, 0, 100, 20);
        j.moral = clampNombre((j.moral || 65) + 3, 20, 100, 65);
    });
    syncEquipeDepuisEffectif(data.equipe);
    setGestionMessageCarriere("Repos collectif effectue: forme + moral ameliores.", '#22c55e');
    SoundEngine.play('click');
    afficherGestionEquipeCarriere();
}

function soignerJoueurCarriere(index) {
    const data = window.carriereData;
    if (!data || !data.equipe || !data.equipe.joueurs[index]) return;
    const joueur = data.equipe.joueurs[index];
    if (!joueur.blesse) {
        setGestionMessageCarriere(`${joueur.nom} n'a pas besoin de soins.`, '#94a3b8');
        return afficherGestionEquipeCarriere();
    }

    const cout = Math.max(80000, (joueur.blesseMatchs || 1) * 120000);
    if ((data.budget || 0) < cout) {
        setGestionMessageCarriere(`Budget insuffisant pour soigner ${joueur.nom} (${formatMoney(cout)}).`, '#ef4444');
        return afficherGestionEquipeCarriere();
    }

    data.budget -= cout;
    joueur.blesse = false;
    joueur.blesseMatchs = 0;
    joueur.fatigue = clampNombre((joueur.fatigue || 20) + 5, 0, 100, 20);
    data.gestion = data.gestion || {};
    data.gestion.soins = (data.gestion.soins || 0) + 1;
    syncEquipeDepuisEffectif(data.equipe);
    setGestionMessageCarriere(`${joueur.nom} est de retour. Cout medical: ${formatMoney(cout)}.`, '#22c55e');
    SoundEngine.play('sub');
    afficherGestionEquipeCarriere();
}

function appliquerEntrainementCarriere(type) {
    const data = window.carriereData;
    if (!data || !data.equipe) return;

    const seances = {
        attaque: { cout: 180000, label: 'Attaque' },
        defense: { cout: 180000, label: 'Defense' },
        technique: { cout: 150000, label: 'Technique' }
    };
    const seance = seances[type];
    if (!seance) return;

    if ((data.budget || 0) < seance.cout) {
        setGestionMessageCarriere(`Budget insuffisant pour la seance ${seance.label}.`, '#ef4444');
        return afficherGestionEquipeCarriere();
    }

    data.budget -= seance.cout;
    data.equipe.joueurs.forEach((j, idx) => {
        if (j.blesse) return;
        if (type === 'attaque') {
            if (j.role === 'attaque' || j.role === 'milieu') { j.tir += 2; j.vitesse += 1; }
            else { j.passe += 1; }
            j.fatigue = clampNombre((j.fatigue || 0) + 8, 0, 100, 20);
        } else if (type === 'defense') {
            if (j.role === 'defense' || j.role === 'gardien') { j.defense += 2; }
            if (j.role === 'gardien') j.gardien += 2;
            j.physique += 1;
            j.fatigue = clampNombre((j.fatigue || 0) + 8, 0, 100, 20);
        } else if (type === 'technique') {
            j.passe += 2;
            if (j.role === 'milieu') j.vitesse += 1;
            j.fatigue = clampNombre((j.fatigue || 0) + 6, 0, 100, 20);
        }
        j.moral = clampNombre((j.moral || 65) + 2, 20, 100, 65);
        normaliserJoueur(j, idx);
    });

    data.gestion = data.gestion || {};
    data.gestion.entrainements = (data.gestion.entrainements || 0) + 1;
    syncEquipeDepuisEffectif(data.equipe);
    setGestionMessageCarriere(`Seance ${seance.label} terminee. Cout: ${formatMoney(seance.cout)}.`, '#22c55e');
    SoundEngine.play('click');
    afficherGestionEquipeCarriere();
}

function getCheatState() {
    const active = getActiveGameData();
    if (!active || !active.data) return null;
    const { mode, data } = active;
    const isMultiEquipes = mode === 'ligue' || mode === 'exhibition';
    const equipe = isMultiEquipes ? (data.equipes && data.equipes[data.monEquipeIndex]) : data.equipe;
    if (!equipe || !Array.isArray(equipe.joueurs)) return null;
    return { mode, data, equipe };
}

function getCheatRoleOptions(selectedRole) {
    return Object.entries(roleLabels).map(([key, label]) => `
        <option value="${key}" ${key === selectedRole ? 'selected' : ''}>${label}</option>
    `).join('');
}

function getCheatRetourAction() {
    const ctx = window._cheatContext || {};
    if (ctx.mode === 'exhibition') return 'afficherExhibition()';
    if (ctx.origine === 'transferts') return 'afficherTransferts()';
    if (ctx.origine === 'effectif') return ctx.mode === 'ligue' ? 'afficherEffectifLigue()' : 'afficherEffectif()';
    return ctx.mode === 'ligue' ? 'afficherJourneeLigue()' : 'afficherProchainMatch()';
}

function changerEquipeCheatExhibition(index) {
    const state = getCheatState();
    if (!state || state.mode !== 'exhibition') return;
    state.data.monEquipeIndex = index === 1 ? 1 : 0;
    window._cheatSelectionIndex = 0;
    afficherCheatMenu('exhibition');
}

function isNumeroDisponible(equipe, numero, ignoreIndex = -1) {
    return !equipe.joueurs.some((j, i) => i !== ignoreIndex && j.numero === numero);
}

function afficherCheatMenu(origine = '') {
    const state = getCheatState();
    if (!state) { alert("Lance d'abord une exhibition, une carriere ou une ligue."); return; }

    syncEquipeDepuisEffectif(state.equipe);
    state.data.budget = clampNombre(state.data.budget, 0, 9999999999, 5000000);

    const previousCtx = window._cheatContext || {};
    window._cheatContext = {
        mode: state.mode,
        origine: origine || previousCtx.origine || state.mode
    };

    const players = state.equipe.joueurs;
    const selectedIndex = clampNombre(window._cheatSelectionIndex, 0, Math.max(0, players.length - 1), 0);
    window._cheatSelectionIndex = selectedIndex;
    const joueursExistantsHTML = players.map((j, i) => `
        <button class="btn-action ${i === selectedIndex ? 'btn-orange' : 'btn-blue'}"
            style="margin:0;padding:6px 10px;font-size:12px;"
            onclick="selectionnerJoueurCheat(${i})">
            #${j.numero || '--'} ${j.nom}
        </button>
    `).join('');
    const exhibitionSwitchHTML = state.mode === 'exhibition' && Array.isArray(state.data.equipes) && state.data.equipes.length === 2
        ? `
            <div class="panel-card">
                <h3 style="color:#f59e0b;margin-bottom:12px;">Equipe a modifier</h3>
                <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;">
                    <button class="btn-action ${state.data.monEquipeIndex === 0 ? 'btn-orange' : 'btn-blue'}" onclick="changerEquipeCheatExhibition(0)">${state.data.equipes[0].logo || 'A'} ${state.data.equipes[0].nom}</button>
                    <button class="btn-action ${state.data.monEquipeIndex === 1 ? 'btn-orange' : 'btn-blue'}" onclick="changerEquipeCheatExhibition(1)">${state.data.equipes[1].logo || 'B'} ${state.data.equipes[1].nom}</button>
                </div>
            </div>
        `
        : '';

    content.innerHTML = `
        <div class="game-panel">
            <h2>Cheat Menu - ${state.equipe.nom}</h2>
            ${exhibitionSwitchHTML}

            <div class="panel-card">
                <h3 style="color:#ffd700;margin-bottom:12px;">Budget</h3>
                <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;justify-content:center;">
                    <span style="font-family:'Orbitron';font-size:24px;color:#ffd700;">${formatMoney(state.data.budget)}</span>
                    <input id="cheatBudgetInput" type="number" min="0" step="50000" value="500000" style="max-width:180px;">
                    <button class="btn-action btn-green" style="margin:0;" onclick="appliquerCheatBudget('add')">+ Ajouter</button>
                    <button class="btn-action btn-orange" style="margin:0;" onclick="appliquerCheatBudget('set')">Definir</button>
                </div>
            </div>

            <div class="panel-card">
                <h3 style="color:#4ecdc4;margin-bottom:12px;">Selection joueur (equipe actuelle)</h3>
                <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center;">
                    ${joueursExistantsHTML}
                </div>
            </div>

            <div class="panel-card">
                <h3 style="color:#22c55e;margin-bottom:12px;">Ajouter un joueur</h3>
                <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(150px, 1fr));gap:8px;">
                    <input id="cheatNewNom" type="text" placeholder="Nom" value="Nouveau Joueur">
                    <input id="cheatNewNumero" type="number" min="1" max="99" value="${Math.min(99, players.length + 1)}" placeholder="Numero">
                    <select id="cheatNewRole">${getCheatRoleOptions('milieu')}</select>
                    <label style="display:flex;align-items:center;gap:6px;color:#cbd5e1;"><input id="cheatNewTitulaire" type="checkbox"> Titulaire</label>
                    <input id="cheatNewVitesse" type="number" min="20" max="99" value="70" placeholder="Vitesse">
                    <input id="cheatNewTir" type="number" min="20" max="99" value="70" placeholder="Tir">
                    <input id="cheatNewPasse" type="number" min="20" max="99" value="70" placeholder="Passe">
                    <input id="cheatNewDefense" type="number" min="20" max="99" value="70" placeholder="Defense">
                    <input id="cheatNewPhysique" type="number" min="20" max="99" value="70" placeholder="Physique">
                    <input id="cheatNewGardien" type="number" min="0" max="99" value="20" placeholder="Gardien">
                </div>
                <div style="text-align:center;margin-top:10px;">
                    <button class="btn-action btn-green" onclick="ajouterJoueurCheat()">Ajouter au club</button>
                </div>
            </div>

            <div class="panel-card">
                <h3 style="color:#4ecdc4;margin-bottom:12px;">Modifier un joueur existant</h3>
                <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;justify-content:center;margin-bottom:10px;">
                    <select id="cheatPlayerIndex" onchange="chargerJoueurCheat()" style="min-width:260px;">
                        ${players.map((j, i) => `<option value="${i}" ${i === selectedIndex ? 'selected' : ''}>#${j.numero} ${j.nom} (${roleLabels[j.role]})</option>`).join('')}
                    </select>
                    <span style="color:#94a3b8;">Titulaires: ${players.filter(j => j.titulaire).length}/${MAX_TITULAIRES}</span>
                </div>
                <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(150px, 1fr));gap:8px;">
                    <div style="grid-column:1 / -1;color:#cbd5e1;font-size:13px;">Joueur selectionne: <strong id="cheatSelectedName">#${players[selectedIndex]?.numero || '--'} ${players[selectedIndex]?.nom || ''}</strong></div>
                    <input id="cheatEditNumero" type="number" min="1" max="99" placeholder="Numero">
                    <select id="cheatEditRole">${getCheatRoleOptions('milieu')}</select>
                    <label style="display:flex;align-items:center;gap:6px;color:#cbd5e1;"><input id="cheatEditTitulaire" type="checkbox"> Titulaire</label>
                    <input id="cheatEditVitesse" type="number" min="20" max="99" placeholder="Vitesse">
                    <input id="cheatEditTir" type="number" min="20" max="99" placeholder="Tir">
                    <input id="cheatEditPasse" type="number" min="20" max="99" placeholder="Passe">
                    <input id="cheatEditDefense" type="number" min="20" max="99" placeholder="Defense">
                    <input id="cheatEditPhysique" type="number" min="20" max="99" placeholder="Physique">
                    <input id="cheatEditGardien" type="number" min="0" max="99" placeholder="Gardien">
                </div>
                <div style="display:flex;justify-content:center;gap:10px;flex-wrap:wrap;margin-top:12px;">
                    <button class="btn-action btn-blue" onclick="sauvegarderJoueurCheat()">Sauvegarder joueur</button>
                    <button class="btn-action btn-red" onclick="supprimerJoueurCheat()">Supprimer joueur</button>
                </div>
            </div>

            <div style="text-align:center;margin-top:16px;">
                <button class="btn-action btn-green" onclick="${getCheatRetourAction()}">Retour</button>
            </div>
        </div>
    `;

    chargerJoueurCheat();
}

function appliquerCheatBudget(mode) {
    const state = getCheatState();
    if (!state) return;
    const raw = document.getElementById('cheatBudgetInput')?.value;
    const montant = clampNombre(raw, 0, 9999999999, -1);
    if (montant < 0) { alert("Entre un montant valide."); return; }
    if (mode === 'set') state.data.budget = montant;
    else state.data.budget = Math.max(0, (state.data.budget || 0) + montant);
    SoundEngine.play('transfer');
    afficherCheatMenu();
}

function chargerJoueurCheat() {
    const state = getCheatState();
    if (!state) return;
    const select = document.getElementById('cheatPlayerIndex');
    if (!select) return;
    const idx = clampNombre(select.value, 0, Math.max(0, state.equipe.joueurs.length - 1), 0);
    const joueur = state.equipe.joueurs[idx];
    if (!joueur) return;
    window._cheatSelectionIndex = idx;

    const selectedNameEl = document.getElementById('cheatSelectedName');
    if (selectedNameEl) selectedNameEl.textContent = `#${joueur.numero || '--'} ${joueur.nom || ''}`;
    document.getElementById('cheatEditNumero').value = joueur.numero || (idx + 1);
    document.getElementById('cheatEditRole').value = joueur.role || 'milieu';
    document.getElementById('cheatEditTitulaire').checked = !!joueur.titulaire;
    document.getElementById('cheatEditVitesse').value = joueur.vitesse;
    document.getElementById('cheatEditTir').value = joueur.tir;
    document.getElementById('cheatEditPasse').value = joueur.passe;
    document.getElementById('cheatEditDefense').value = joueur.defense;
    document.getElementById('cheatEditPhysique').value = joueur.physique;
    document.getElementById('cheatEditGardien').value = joueur.gardien || 0;
}

function selectionnerJoueurCheat(index) {
    const state = getCheatState();
    if (!state) return;
    const idx = clampNombre(index, 0, Math.max(0, state.equipe.joueurs.length - 1), 0);
    window._cheatSelectionIndex = idx;
    afficherCheatMenu();
}

function migrerNomStatsCarriere(data, ancienNom, nouveauNom) {
    if (!data || ancienNom === nouveauNom) return;
    ['buteurs', 'passeurs'].forEach(key => {
        if (!data[key]) return;
        const ancien = data[key][ancienNom];
        if (ancien !== undefined) {
            data[key][nouveauNom] = (data[key][nouveauNom] || 0) + ancien;
            delete data[key][ancienNom];
        } else if (data[key][nouveauNom] === undefined) {
            data[key][nouveauNom] = 0;
        }
    });
}

function ajouterJoueurCheat() {
    const state = getCheatState();
    if (!state) return;

    const nom = String(document.getElementById('cheatNewNom')?.value || '').trim();
    if (!nom) { alert("Le nom du joueur est obligatoire."); return; }
    const numero = clampNombre(document.getElementById('cheatNewNumero')?.value, 1, 99, state.equipe.joueurs.length + 1);
    if (!isNumeroDisponible(state.equipe, numero)) { alert("Ce numero est deja pris."); return; }

    const titulaire = !!document.getElementById('cheatNewTitulaire')?.checked;
    if (titulaire && state.equipe.joueurs.filter(j => j.titulaire).length >= MAX_TITULAIRES) {
        alert(`Limite de ${MAX_TITULAIRES} titulaires atteinte.`);
        return;
    }

    const joueur = normaliserJoueur({
        nom,
        numero,
        role: document.getElementById('cheatNewRole')?.value || 'milieu',
        titulaire,
        vitesse: document.getElementById('cheatNewVitesse')?.value,
        tir: document.getElementById('cheatNewTir')?.value,
        passe: document.getElementById('cheatNewPasse')?.value,
        defense: document.getElementById('cheatNewDefense')?.value,
        physique: document.getElementById('cheatNewPhysique')?.value,
        gardien: document.getElementById('cheatNewGardien')?.value,
        expulse: false,
        blesse: false,
        blesseMatchs: 0,
        buts: 0,
        passes: 0
    }, state.equipe.joueurs.length);

    state.equipe.joueurs.push(joueur);
    syncEquipeDepuisEffectif(state.equipe);
    if (state.mode === 'carriere') migrerNomStatsCarriere(state.data, joueur.nom, joueur.nom);

    window._cheatSelectionIndex = state.equipe.joueurs.length - 1;
    SoundEngine.play('transfer');
    afficherCheatMenu();
}

function sauvegarderJoueurCheat() {
    const state = getCheatState();
    if (!state) return;
    const idx = clampNombre(document.getElementById('cheatPlayerIndex')?.value, 0, Math.max(0, state.equipe.joueurs.length - 1), 0);
    const joueur = state.equipe.joueurs[idx];
    if (!joueur) return;

    const numero = clampNombre(document.getElementById('cheatEditNumero')?.value, 1, 99, joueur.numero || idx + 1);
    if (!isNumeroDisponible(state.equipe, numero, idx)) { alert("Ce numero est deja pris."); return; }

    const titulaire = !!document.getElementById('cheatEditTitulaire')?.checked;
    const autresTitulaires = state.equipe.joueurs.filter((j, i) => i !== idx && j.titulaire).length;
    if (titulaire && autresTitulaires >= MAX_TITULAIRES) {
        alert(`Limite de ${MAX_TITULAIRES} titulaires atteinte.`);
        return;
    }

    joueur.numero = numero;
    joueur.role = document.getElementById('cheatEditRole')?.value || joueur.role;
    joueur.titulaire = titulaire;
    joueur.vitesse = document.getElementById('cheatEditVitesse')?.value;
    joueur.tir = document.getElementById('cheatEditTir')?.value;
    joueur.passe = document.getElementById('cheatEditPasse')?.value;
    joueur.defense = document.getElementById('cheatEditDefense')?.value;
    joueur.physique = document.getElementById('cheatEditPhysique')?.value;
    joueur.gardien = document.getElementById('cheatEditGardien')?.value;

    normaliserJoueur(joueur, idx);
    equilibrerTitulaires(state.equipe, titulaire ? idx : -1);
    syncEquipeDepuisEffectif(state.equipe);

    window._cheatSelectionIndex = idx;
    SoundEngine.play('click');
    afficherCheatMenu();
}

function supprimerJoueurCheat() {
    const state = getCheatState();
    if (!state) return;
    if (state.equipe.joueurs.length <= 6) { alert("Garde au moins 6 joueurs dans l'equipe."); return; }

    const idx = clampNombre(document.getElementById('cheatPlayerIndex')?.value, 0, Math.max(0, state.equipe.joueurs.length - 1), 0);
    const joueur = state.equipe.joueurs[idx];
    if (!joueur) return;
    if (!confirm(`Supprimer ${joueur.nom} (n°${joueur.numero}) ?`)) return;

    state.equipe.joueurs.splice(idx, 1);
    syncEquipeDepuisEffectif(state.equipe);
    if (state.mode === 'carriere' && state.data.buteurs && state.data.passeurs) {
        delete state.data.buteurs[joueur.nom];
        delete state.data.passeurs[joueur.nom];
    }

    window._cheatSelectionIndex = Math.max(0, idx - 1);
    SoundEngine.play('click');
    afficherCheatMenu();
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
    window.activeMode = 'ligue';
    const equipeIndex = parseInt(document.getElementById('equipeLigue').value);
    const niveauIndex = parseInt(document.getElementById('niveauLigue').value);
    const maCouleur = couleursDisponibles[window.couleurSelectionneeIndex].code;
    
    // Build all teams with full rosters
    const ligueEquipes = equipes.map((e, i) => {
        const team = { ...e };
        team.joueurs = genererJoueursDetailles(e.nom, e.attaque, e.defense);
        syncEquipeDepuisEffectif(team);
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
    window.activeMode = 'ligue';
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
                    <button class="btn-action btn-orange" onclick="afficherCheatMenu('ligue')">Cheat Menu</button>
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
    window.activeMode = 'ligue';
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
                    <div class="player-name">#${j.numero || '--'} ${j.nom} ${injuryHTML}</div>
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
                <button class="btn-action btn-orange" onclick="afficherCheatMenu('effectif')">Cheat Menu</button>
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
    
    // Apply formation/strategy bonuses from current roster
    const form = data.formation;
    const strat = data.strategie;
    syncEquipeDepuisEffectif(monEquipe);
    monEquipe.attaque = clampNombre(getEquipeAtt(monEquipe.joueurs) + form.bonusAtt + strat.bonusAtt, 20, 99, monEquipe.attaque);
    monEquipe.defense = clampNombre(getEquipeDef(monEquipe.joueurs) + form.bonusDef + strat.bonusDef, 20, 99, monEquipe.defense);
    
    window._isLigueMatch = true;
    simulerMatch(monEquipe, advCopy);
}

// ==================== MATCH SIMULATION (SHARED) ====================

function jouerMatchCarriere(adversaire) {
    window.matchCarriereAdversaire = adversaire;
    
    const data = window.carriereData;
    const form = data.formation;
    const strat = data.strategie;
    const titulairesDisponibles = data.equipe.joueurs.filter(j => j.titulaire && !j.blesse).length;
    if (titulairesDisponibles < 8) {
        autoComposerEquipeParFormation(data.equipe, data.formation);
        setGestionMessageCarriere("Composition auto appliquee: effectif insuffisant pour debuter.", '#f59e0b');
    }
    
    // Apply bonuses from formation + strategy using current roster
    syncEquipeDepuisEffectif(data.equipe);
    data.equipe.attaque = clampNombre(getEquipeAtt(data.equipe.joueurs) + form.bonusAtt + strat.bonusAtt, 20, 99, data.equipe.attaque);
    data.equipe.defense = clampNombre(getEquipeDef(data.equipe.joueurs) + form.bonusDef + strat.bonusDef, 20, 99, data.equipe.defense);
    
    window._isLigueMatch = false;
    simulerMatch(data.equipe, adversaire);
}

function lancerMatch() {
    window.activeMode = 'exhibition';
    const selected = getSelectedExhibitionIndices();
    if (!selected) { alert("Selectionne exactement 2 equipes !"); return; }

    const key = selected.join('-');
    const hasSavedData = !!(
        window.exhibitionData &&
        Array.isArray(window.exhibitionData.selection) &&
        window.exhibitionData.selection.join('-') === key &&
        Array.isArray(window.exhibitionData.equipes) &&
        window.exhibitionData.equipes.length === 2
    );

    if (!hasSavedData) {
        window.exhibitionData = {
            equipes: [buildExhibitionTeam(selected[0]), buildExhibitionTeam(selected[1])],
            monEquipeIndex: 0,
            budget: 5000000,
            selection: selected
        };
    } else {
        window.exhibitionData.equipes.forEach(syncEquipeDepuisEffectif);
    }

    const prepareTeamForMatch = (team) => {
        const clone = { ...team };
        clone.joueurs = (team.joueurs || []).map((j, i) => {
            const joueur = normaliserJoueur({ ...j }, i);
            joueur.expulse = false;
            joueur.blesse = false;
            joueur.blesseMatchs = 0;
            return joueur;
        });
        syncEquipeDepuisEffectif(clone);
        return clone;
    };

    const teamA = prepareTeamForMatch(window.exhibitionData.equipes[0]);
    const teamB = prepareTeamForMatch(window.exhibitionData.equipes[1]);

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
        
        let primeMatch = 90000;
        let moralDelta = 1;
        if (scoreA > scoreB) { data.matchsGagnes++; data.points += 3; primeMatch = 240000; moralDelta = 5; }
        else if (scoreA < scoreB) { data.matchsPerdus++; moralDelta = -4; }
        else { data.matchsNuls++; data.points += 1; primeMatch = 140000; moralDelta = 2; }

        data.budget = (data.budget || 0) + primeMatch;
        data.equipe.joueurs.forEach(j => {
            const fatigueGain = j.titulaire ? 15 : 6;
            j.fatigue = clampNombre((j.fatigue || 0) + fatigueGain, 0, 100, 20);
            j.moral = clampNombre((j.moral || 65) + moralDelta, 20, 100, 65);
        });
        syncEquipeDepuisEffectif(data.equipe);
        setGestionMessageCarriere(`Prime de match: ${formatMoney(primeMatch)}. Moral ${moralDelta >= 0 ? '+' : ''}${moralDelta}.`, '#4ecdc4');
        
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

    const theme = isChampion ? 'champion' : (monRang <= 3 ? 'podium' : 'defeat');
    const icon = isChampion ? '&#x1F3C6;' : (monRang <= 3 ? '&#x1F3C5;' : '&#x1F4A5;');
    const title = isChampion
        ? 'Champion de la Ligue'
        : (monRang <= 3 ? `Podium - ${monRang}${monRang === 1 ? 'er' : 'e'} place` : `Saison terminee - ${monRang}${monRang === 1 ? 'er' : 'e'} place`);
    const subtitle = isChampion
        ? `${monEquipe.logo} ${monEquipe.nom} souleve la coupe apres une saison maitrisee.`
        : `${monEquipe.logo} ${monEquipe.nom} termine la saison avec ${ligueScore.pts} points.`;
    const ribbon = isChampion ? 'Trophee de Ligue' : (monRang <= 3 ? 'Objectif podium atteint' : 'Revanche la saison prochaine');

    content.innerHTML = `
        <div class="game-panel finale-screen">
            <div class="finale-hero ${theme}">
                <div class="finale-confetti"></div>
                <div class="finale-kicker">Fin de Ligue</div>
                <div class="finale-icon">${icon}</div>
                <div class="finale-title">${title}</div>
                <div class="finale-subtitle">${subtitle}</div>
                <div class="finale-ribbon">${ribbon}</div>
            </div>

            <div class="finale-highlights">
                <div class="finale-chip"><div class="finale-chip-value">${monRang}</div><div class="finale-chip-label">Classement</div></div>
                <div class="finale-chip"><div class="finale-chip-value">${ligueScore.pts}</div><div class="finale-chip-label">Points</div></div>
                <div class="finale-chip"><div class="finale-chip-value">${ligueScore.v}</div><div class="finale-chip-label">Victoires</div></div>
                <div class="finale-chip"><div class="finale-chip-value">${finalScore}</div><div class="finale-chip-label">Score Final</div></div>
            </div>

            <div class="panel-card">
                <h3 style="color:#ffd700;margin-bottom:12px;">Classement final</h3>
                <div style="overflow-x:auto;">
                    <table class="league-table">
                        <thead><tr>
                            <th>#</th><th style="text-align:left;">Equipe</th><th>MJ</th><th>V</th><th>N</th><th>D</th><th>BP</th><th>BC</th><th>Diff</th><th>Pts</th>
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
                <button class="btn-action btn-orange" onclick="afficherTransferts()">Marche des transferts</button>
                <button class="btn-action btn-green" onclick="afficherLigue()">Nouvelle saison</button>
            </div>
        </div>
    `;
}

// ==================== TRANSFER MARKET ====================

function afficherTransferts() {
    const active = getActiveGameData();
    const data = active ? active.data : null;
    if (!data) { afficherLigue(); return; }
    const retourAction = active && active.mode === 'ligue' ? 'afficherFinLigue()' : 'afficherProchainMatch()';
    
    const monIdx = data.monEquipeIndex !== undefined ? data.monEquipeIndex : null;
    const monEquipe = monIdx !== null ? data.equipes[monIdx] : (data.equipe || null);
    if (!monEquipe) { afficherLigue(); return; }
    
    const budget = data.budget ?? 5000000;
    
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
                                    <div style="font-weight:bold;font-size:16px;color:#fff;">#${j.numero || '--'} ${j.nom}</div>
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
                <button class="btn-action btn-orange" onclick="afficherCheatMenu('transferts')">Cheat Menu</button>
                <button class="btn-action btn-blue" onclick="${retourAction}">⬅️ Retour</button>
            </div>
        </div>
    `;
    
    window._transferTargets = topTargets;
}

function acheterJoueur(index) {
    const active = getActiveGameData();
    const data = active ? active.data : null;
    const target = window._transferTargets[index];
    if (!target || !data) return;
    
    if (target.valeur > data.budget) { alert("Budget insuffisant !"); return; }
    
    data.budget -= target.valeur;
    
    const monEquipe = data.equipes ? data.equipes[data.monEquipeIndex] : data.equipe;
    const newPlayer = { ...target };
    delete newPlayer.equipeOrigine;
    delete newPlayer.equipeOrigineLogo;
    delete newPlayer.equipeIdx;
    if (!newPlayer.numero) newPlayer.numero = monEquipe.joueurs.length + 1;
    newPlayer.titulaire = false;
    newPlayer.buts = 0;
    newPlayer.passes = 0;
    
    monEquipe.joueurs.push(newPlayer);
    syncEquipeDepuisEffectif(monEquipe);
    
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
    const isChampion = resultat === 'champion';

    const titre = isChampion ? 'Coupe remportee' : 'Parcours termine';
    const message = isChampion
        ? `Felicitations ! ${data.equipe.nom} remporte la competition.`
        : `Elimination avec ${data.points} points. Relance-toi sur la prochaine saison.`;
    const icon = isChampion ? '&#x1F3C6;' : '&#x274C;';
    const theme = isChampion ? 'champion' : 'defeat';
    const ribbon = isChampion ? 'Champion de la Coupe' : 'Objectif : rebondir';

    if (isChampion) SoundEngine.play('victory');

    const finalCareerScore = (data.points * 120) + (data.matchsGagnes * 200) + (data.butsMarques * 40) + (isChampion ? 2500 : 500);
    updateCatalogScore(finalCareerScore);

    const diff = data.butsMarques - data.butsEncaisses;
    const totalMatches = Math.max(1, data.matchsJoues || 1);
    const winRate = Math.round((data.matchsGagnes / totalMatches) * 100);

    content.innerHTML = `
        <div class="game-panel finale-screen">
            <div class="finale-hero ${theme}">
                <div class="finale-confetti"></div>
                <div class="finale-kicker">Fin de Carriere</div>
                <div class="finale-icon">${icon}</div>
                <div class="finale-title">${titre}</div>
                <div class="finale-subtitle">${message}</div>
                <div class="finale-ribbon">${ribbon}</div>
            </div>

            <div class="finale-highlights">
                <div class="finale-chip"><div class="finale-chip-value">${data.points}</div><div class="finale-chip-label">Points</div></div>
                <div class="finale-chip"><div class="finale-chip-value">${winRate}%</div><div class="finale-chip-label">Win Rate</div></div>
                <div class="finale-chip"><div class="finale-chip-value">${diff > 0 ? '+' : ''}${diff}</div><div class="finale-chip-label">Difference</div></div>
                <div class="finale-chip"><div class="finale-chip-value">${finalCareerScore}</div><div class="finale-chip-label">Score Final</div></div>
            </div>

            <div class="panel-card">
                <h3 style="color:#ffd700;">Statistiques finales</h3>
                <div class="panel-grid panel-grid-4">
                    <div class="panel-stat-box"><div class="panel-stat-value" style="color:#4caf50;">${data.matchsGagnes}</div><div class="panel-stat-label">Victoires</div></div>
                    <div class="panel-stat-box"><div class="panel-stat-value" style="color:#ff6b6b;">${data.matchsPerdus}</div><div class="panel-stat-label">Defaites</div></div>
                    <div class="panel-stat-box"><div class="panel-stat-value" style="color:#ffd700;">${data.matchsNuls}</div><div class="panel-stat-label">Nuls</div></div>
                    <div class="panel-stat-box"><div class="panel-stat-value" style="color:#4ecdc4;">${data.butsMarques}-${data.butsEncaisses}</div><div class="panel-stat-label">Buts</div></div>
                </div>
            </div>

            <div style="margin-top:20px;text-align:center;">
                <button class="btn-action btn-orange" onclick="afficherTransfertsCarriere()">Transferts</button>
                <button class="btn-action btn-green" onclick="afficherCarriere()">Nouvelle carriere</button>
            </div>
        </div>
    `;
}

function afficherTransfertsCarriere() {
    window.activeMode = 'carriere';
    if (!window.carriereData) { afficherCarriere(); return; }
    
    // Temporarily make a compatible structure
    window.carriereData.equipes = equipes.map((e, i) => {
        const team = { ...e };
        team.joueurs = genererJoueursDetailles(e.nom, e.attaque, e.defense);
        syncEquipeDepuisEffectif(team);
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

