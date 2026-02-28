const equipes = [
    {
        nom: "Solar Lions",
        attaque: 80,
        defense: 70,
        pouvoir: "Solar Burst",
        eveil: false
    },
    {
        nom: "Shadow Wolves",
        attaque: 75,
        defense: 85,
        pouvoir: "Shadow Lock",
        eveil: true
    },
    {
        nom: "Storm Eagles",
        attaque: 82,
        defense: 68,
        pouvoir: "Thunder Shot",
        eveil: false
    },
    {
        nom: "Iron Bulls",
        attaque: 70,
        defense: 90,
        pouvoir: "Iron Wall",
        eveil: true
    },
    {
        nom: "Phantom Foxes",
        attaque: 88,
        defense: 65,
        pouvoir: "Phantom Dash",
        eveil: false
    },
    {
        nom: "Aqua Serpents",
        attaque: 78,
        defense: 72,
        pouvoir: "Tidal Control",
        eveil: false
    },
    {
        nom: "Crimson Dragons",
        attaque: 90,
        defense: 75,
        pouvoir: "Dragon Fury",
        eveil: true
    },
    {
        nom: "Frost Titans",
        attaque: 74,
        defense: 88,
        pouvoir: "Frozen Field",
        eveil: false
    },
    {
        nom: "Neon Panthers",
        attaque: 85,
        defense: 70,
        pouvoir: "Neon Speed",
        eveil: false
    },
    {
        nom: "Obsidian Kings",
        attaque: 83,
        defense: 83,
        pouvoir: "King's Dominion",
        eveil: true
    }
];

const nomsJoueurs = {
    "Solar Lions": ["Sol", "Ray", "Blaze", "Phoenix", "Flare", "Helios"],
    "Shadow Wolves": ["Shade", "Luna", "Noir", "Eclipse", "Phantom", "Dusk"],
    "Storm Eagles": ["Thunder", "Bolt", "Gale", "Tempest", "Zephyr", "Storm"],
    "Iron Bulls": ["Steel", "Tank", "Forge", "Titan", "Boulder", "Hammer"],
    "Phantom Foxes": ["Ghost", "Spirit", "Wisp", "Wraith", "Specter", "Shade"],
    "Aqua Serpents": ["Wave", "Tide", "Coral", "Marine", "Ocean", "Reef"],
    "Crimson Dragons": ["Drako", "Fury", "Ember", "Inferno", "Magma", "Pyro"],
    "Frost Titans": ["Ice", "Glacier", "Frozen", "Arctic", "Snow", "Blizzard"],
    "Neon Panthers": ["Flash", "Spark", "Glow", "Neon", "Pulse", "Volt"],
    "Obsidian Kings": ["Crown", "Royal", "Noble", "Majesty", "King", "Emperor"]
};

const couleursDisponibles = [
    {nom: "Rouge", code: "#ff6b6b"},
    {nom: "Bleu", code: "#4ecdc4"},
    {nom: "Vert", code: "#2ecc71"},
    {nom: "Jaune", code: "#f1c40f"},
    {nom: "Violet", code: "#9b59b6"},
    {nom: "Orange", code: "#e67e22"},
    {nom: "Rose", code: "#e84393"},
    {nom: "Cyan", code: "#00cec9"}
];

const niveauxDifficulte = [
    {nom: "Facile", multiplicateur: 0.7},
    {nom: "Normal", multiplicateur: 1.0},
    {nom: "Difficile", multiplicateur: 1.3},
    {nom: "Expert", multiplicateur: 1.6}
];

const buttons = document.querySelectorAll("#menu button");
const content = document.getElementById("content");
let bestCatalogScore = 0;

function updateCatalogScore(nextValue) {
    const score = Math.max(0, Math.floor(Number(nextValue) || 0));
    if (score <= bestCatalogScore) return bestCatalogScore;

    bestCatalogScore = score;

    const scoreEl = document.getElementById("finalScore");
    if (scoreEl) {
        scoreEl.textContent = String(bestCatalogScore);
    }

    window.gameState = window.gameState || {};
    window.gameState.score = bestCatalogScore;

    if (window.CatalogScore && typeof window.CatalogScore.capture === "function") {
        window.CatalogScore.capture();
    }

    return bestCatalogScore;
}

buttons.forEach(button => {
    button.addEventListener("click", () => {
        const mode = button.dataset.mode;
        chargerMode(mode);
    });
});

function chargerMode(mode) {
    switch (mode) {
        case "exhibition":
            afficherExhibition();
            break;
        case "career-team":
            afficherCarriere();
            break;
        case "league":
            content.innerHTML = "<p>🚧 Mode Ligue en cours de développement</p>";
            break;
        case "career-player":
            content.innerHTML = "<p>🚧 Mode Carrière Joueur en cours de développement</p>";
            break;
        default:
            content.innerHTML = "<p>🚧 Mode en cours de développement</p>";
    }
}

function afficherExhibition() {
    content.innerHTML = `
        <h2>Exhibition</h2>
        <p>Choisis deux équipes</p>
        <div id="teams"></div>
        <button id="playMatch">Jouer le match</button>
        <div id="result"></div>
    `;

    const teamsDiv = document.getElementById("teams");

    equipes.forEach((equipe, index) => {
        const div = document.createElement("div");
        div.innerHTML = `
            <input type="checkbox" value="${index}">
            ${equipe.nom} (${equipe.pouvoir})
        `;
        teamsDiv.appendChild(div);
    });

    document.getElementById("playMatch").addEventListener("click", lancerMatch);
}

function afficherCarriere() {
    content.innerHTML = `
        <h2>Mode Carrière</h2>
        <p>Crée ton équipe et commence ta carrière !</p>
        
        <div style="margin:20px 0;">
            <h3>Choisis ton équipe</h3>
            <select id="equipeCarriere" style="padding:10px; font-size:16px; margin:10px 0;">
                ${equipes.map((e, i) => `<option value="${i}">${e.nom} - Attaque: ${e.attaque} Défense: ${e.defense}</option>`).join('')}
            </select>
        </div>
        
        <div style="margin:20px 0;">
            <h3>Choisis la couleur de ton équipe</h3>
            <div id="couleurChoix" style="display:flex; gap:10px; flex-wrap:wrap;">
                ${couleursDisponibles.map((c, i) => `
                    <div onclick="selectionnerCouleur(${i})" style="width:60px; height:60px; background:${c.code}; border:3px solid #fff; border-radius:10px; cursor:pointer; transition:transform 0.2s;" 
                    onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'" id="couleur${i}">
                    </div>
                `).join('')}
            </div>
            <p>Couleur sélectionnée: <span id="couleurSelectionnee" style="font-weight:bold;">Rouge</span></p>
        </div>
        
        <div style="margin:20px 0;">
            <h3>Choisis le niveau de difficulté</h3>
            <select id="niveauDifficulte" style="padding:10px; font-size:16px; margin:10px 0;">
                ${niveauxDifficulte.map((n, i) => `<option value="${i}">${n.nom}</option>`).join('')}
            </select>
        </div>
        
        <button id="demarrerCarriere" style="padding:15px 30px; font-size:18px; background:#4caf50; color:#fff; border:none; border-radius:10px; cursor:pointer;">
            🏆 Démarrer la carrière
        </button>
    `;
    
    window.couleurSelectionneeIndex = 0;
    
    document.getElementById("demarrerCarriere").addEventListener("click", demarrerCarriere);
}

function selectionnerCouleur(index) {
    document.querySelectorAll('[id^="couleur"]').forEach(el => {
        el.style.border = '3px solid #fff';
    });
    
    document.getElementById(`couleur${index}`).style.border = '5px solid #000';
    document.getElementById('couleurSelectionnee').textContent = couleursDisponibles[index].nom;
    window.couleurSelectionneeIndex = index;
}

function demarrerCarriere() {
    const equipeIndex = document.getElementById('equipeCarriere').value;
    const niveauIndex = document.getElementById('niveauDifficulte').value;
    
    const monEquipe = {...equipes[equipeIndex]};
    const maCouleur = couleursDisponibles[window.couleurSelectionneeIndex].code;
    const niveau = niveauxDifficulte[niveauIndex];
    
    monEquipe.couleur = maCouleur;
    monEquipe.joueurs = genererNomsJoueurs(monEquipe.nom);
    
    window.carriereData = {
        equipe: monEquipe,
        niveau: niveau,
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
        classementEquipes: []
    };
    
    monEquipe.joueurs.forEach(nom => {
        window.carriereData.buteurs[nom] = 0;
        window.carriereData.passeurs[nom] = 0;
    });
    
    afficherProchainMatch();
}

function afficherProchainMatch() {
    const data = window.carriereData;
    
    let phaseTexte = '';
    let adversaireMultiplicateur = 1.0;
    
    if (data.matchsJoues < 6) {
        data.phase = 'poules';
        phaseTexte = `Phase de poules - Match ${data.matchsJoues + 1}/6`;
        adversaireMultiplicateur = data.niveau.multiplicateur + (data.matchsJoues * 0.05);
    } else if (data.matchsJoues === 6) {
        if (data.points >= 12) {
            data.phase = 'huitiemes';
            phaseTexte = '🏆 Huitièmes de finale';
            adversaireMultiplicateur = data.niveau.multiplicateur + 0.4;
        } else {
            afficherFinCarriere('eliminé');
            return;
        }
    } else if (data.matchsJoues === 7) {
        data.phase = 'quarts';
        phaseTexte = '🏆 Quarts de finale';
        adversaireMultiplicateur = data.niveau.multiplicateur + 0.6;
    } else if (data.matchsJoues === 8) {
        data.phase = 'demi';
        phaseTexte = '🏆 Demi-finale';
        adversaireMultiplicateur = data.niveau.multiplicateur + 0.8;
    } else if (data.matchsJoues === 9) {
        data.phase = 'finale';
        phaseTexte = '🏆🏆 GRANDE FINALE 🏆🏆';
        adversaireMultiplicateur = data.niveau.multiplicateur + 1.0;
    } else if (data.matchsJoues === 10) {
        afficherFinCarriere('champion');
        return;
    }
    
    let adversaireIndex;
    do {
        adversaireIndex = Math.floor(Math.random() * equipes.length);
    } while (equipes[adversaireIndex].nom === data.equipe.nom);
    
    const adversaire = {...equipes[adversaireIndex]};
    adversaire.attaque = Math.floor(adversaire.attaque * adversaireMultiplicateur);
    adversaire.defense = Math.floor(adversaire.defense * adversaireMultiplicateur);
    adversaire.couleur = '#ff6b6b';
    adversaire.joueurs = genererNomsJoueurs(adversaire.nom);
    
    content.innerHTML = `
        <div style="background:linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding:30px; border-radius:20px;">
            <h2 style="color:#fff; text-shadow:2px 2px 4px #000;">Mode Carrière - ${phaseTexte}</h2>
            
            <div style="background:rgba(0,0,0,0.3); padding:20px; border-radius:15px; margin:20px 0;">
                <h3 style="color:#ffd700;">📊 Ton bilan</h3>
                <div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:15px; margin:15px 0;">
                    <div style="background:rgba(255,255,255,0.1); padding:15px; border-radius:10px;">
                        <div style="font-size:28px; font-weight:bold; color:#4caf50;">${data.matchsGagnes}</div>
                        <div style="color:#aaa;">Victoires</div>
                    </div>
                    <div style="background:rgba(255,255,255,0.1); padding:15px; border-radius:10px;">
                        <div style="font-size:28px; font-weight:bold; color:#ff6b6b;">${data.matchsPerdus}</div>
                        <div style="color:#aaa;">Défaites</div>
                    </div>
                    <div style="background:rgba(255,255,255,0.1); padding:15px; border-radius:10px;">
                        <div style="font-size:28px; font-weight:bold; color:#ffd700;">${data.matchsNuls}</div>
                        <div style="color:#aaa;">Nuls</div>
                    </div>
                    <div style="background:rgba(255,255,255,0.1); padding:15px; border-radius:10px;">
                        <div style="font-size:28px; font-weight:bold; color:#4ecdc4;">${data.points}</div>
                        <div style="color:#aaa;">Points</div>
                    </div>
                </div>
            </div>
            
            <div style="background:rgba(0,0,0,0.3); padding:20px; border-radius:15px; margin:20px 0;">
                <h3 style="color:#fff;">⚔️ Prochain match</h3>
                <div style="display:flex; justify-content:space-around; align-items:center; margin:20px 0;">
                    <div style="text-align:center;">
                        <div style="font-size:24px; font-weight:bold; color:${data.equipe.couleur};">${data.equipe.nom}</div>
                        <div style="color:#aaa;">Attaque: ${data.equipe.attaque} | Défense: ${data.equipe.defense}</div>
                    </div>
                    <div style="font-size:36px; color:#fff;">VS</div>
                    <div style="text-align:center;">
                        <div style="font-size:24px; font-weight:bold; color:#ff6b6b;">${adversaire.nom}</div>
                        <div style="color:#aaa;">Attaque: ${adversaire.attaque} | Défense: ${adversaire.defense}</div>
                    </div>
                </div>
                
                <button onclick="jouerMatchCarriere(${JSON.stringify(adversaire).replace(/"/g, '&quot;')})" 
                    style="padding:15px 40px; font-size:20px; background:#4caf50; color:#fff; border:none; border-radius:50px; cursor:pointer; font-weight:bold; box-shadow:0 8px 20px rgba(0,0,0,0.3); margin-top:20px;">
                    ⚽ Jouer le match
                </button>
            </div>
            
            <button onclick="afficherCarriere()" style="padding:10px 20px; background:#f44336; color:#fff; border:none; border-radius:10px; cursor:pointer; margin-top:10px;">
                ❌ Abandonner la carrière
            </button>
        </div>
    `;
}

function jouerMatchCarriere(adversaire) {
    window.matchCarriereAdversaire = adversaire;
    simulerMatch(window.carriereData.equipe, adversaire);
}

function afficherFinCarriere(resultat) {
    const data = window.carriereData;
    
    let titre = '';
    let message = '';
    let emoji = '';
    
    if (resultat === 'champion') {
        titre = '🏆🏆 CHAMPION ! 🏆🏆';
        message = `Félicitations ! Tu as remporté la compétition avec ${data.equipe.nom} !`;
        emoji = '🎉';
    } else {
        titre = '❌ Éliminé';
        message = `Dommage ! Tu as été éliminé en phase de poules avec ${data.points} points.`;
        emoji = '😢';
    }

    const finalCareerScore =
        (data.points * 120) +
        (data.matchsGagnes * 200) +
        (data.butsMarques * 40) +
        (resultat === "champion" ? 2500 : 500);
    updateCatalogScore(finalCareerScore);
    
    content.innerHTML = `
        <div style="background:linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding:40px; border-radius:20px; text-align:center;">
            <div style="font-size:80px; margin-bottom:20px;">${emoji}</div>
            <h2 style="color:#fff; font-size:36px; text-shadow:2px 2px 4px #000;">${titre}</h2>
            <p style="color:#fff; font-size:20px; margin:20px 0;">${message}</p>
            
            <div style="background:rgba(0,0,0,0.3); padding:20px; border-radius:15px; margin:30px 0;">
                <h3 style="color:#ffd700;">📊 Statistiques finales</h3>
                <div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:15px; margin:15px 0;">
                    <div>
                        <div style="font-size:32px; font-weight:bold; color:#4caf50;">${data.matchsGagnes}</div>
                        <div style="color:#aaa;">Victoires</div>
                    </div>
                    <div>
                        <div style="font-size:32px; font-weight:bold; color:#ff6b6b;">${data.matchsPerdus}</div>
                        <div style="color:#aaa;">Défaites</div>
                    </div>
                    <div>
                        <div style="font-size:32px; font-weight:bold; color:#ffd700;">${data.matchsNuls}</div>
                        <div style="color:#aaa;">Nuls</div>
                    </div>
                    <div>
                        <div style="font-size:32px; font-weight:bold; color:#4ecdc4;">${data.points}</div>
                        <div style="color:#aaa;">Points</div>
                    </div>
                </div>
            </div>
            
            <button onclick="afficherCarriere()" style="padding:15px 40px; font-size:20px; background:#4caf50; color:#fff; border:none; border-radius:50px; cursor:pointer; font-weight:bold; box-shadow:0 8px 20px rgba(0,0,0,0.3); margin-top:20px;">
                🔄 Nouvelle carrière
            </button>
        </div>
    `;
}

function genererNomsJoueurs(nomEquipe) {
    const noms = nomsJoueurs[nomEquipe] || ["J1", "J2", "J3", "J4", "J5", "J6"];
    return noms;
}

function lancerMatch() {
    const checked = document.querySelectorAll("#teams input:checked");

    if (checked.length !== 2) {
        alert("Sélectionne exactement 2 équipes !");
        return;
    }

    const teamA = equipes[checked[0].value];
    const teamB = equipes[checked[1].value];

    simulerMatch(teamA, teamB);
}

function simulerMatch(equipeA, equipeB) {

    let scoreA = 0;
    let scoreB = 0;
    let commentaires = [];

const stats = {
    possessionA: 0,
    possessionB: 0,
    tirsA: 0,
    tirsB: 0,
    tirsCadresA: 0,
    tirsCadresB: 0,
    penaltyA: 0,
    penaltyB: 0,
    coupsFrancsA: 0,
    coupsFrancsB: 0,


    fautesA: 0,
    fautesB: 0,
    jaunesA: 0,
    jaunesB: 0,
    rougesA: 0,
    rougesB: 0
};

    const terrain = creerTerrain(equipeA, equipeB);
    const joueurs = initialiserJoueurs(equipeA, equipeB);
    const ballon = {x: 400, y: 300, possesseur: null};

    let possession = Math.random() < 0.5 ? equipeA : equipeB;
    ballon.possesseur = possession === equipeA ? joueurs.A[Math.floor(Math.random() * joueurs.A.length)] : joueurs.B[Math.floor(Math.random() * joueurs.B.length)];

    let minuteActuelle = 0;
    const intervalMatch = setInterval(() => {
        minuteActuelle++;

        if (minuteActuelle > 90) {
            clearInterval(intervalMatch);
            afficherResultatMatch(equipeA, equipeB, scoreA, scoreB, commentaires, stats);
            return;
        }

        afficherMinute(minuteActuelle, scoreA, scoreB);

        if (Math.random() < 0.1) {
            possession = possession === equipeA ? equipeB : equipeA;
            ballon.possesseur = possession === equipeA ? joueurs.A[Math.floor(Math.random() * joueurs.A.length)] : joueurs.B[Math.floor(Math.random() * joueurs.B.length)];
        }

        if (possession === equipeA) stats.possessionA++;
        else stats.possessionB++;

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
        afficherEvenement(`🟨 Carton jaune - ${fautif.nom}`, '#ffeb3b');
    } else if (carton === "rouge") {
        if (fautif === equipeA) stats.rougesA++;
        else stats.rougesB++;
        commentaires.push(`🟥 ${minuteActuelle}' CARTON ROUGE pour ${fautif.nom} !`);
        afficherEvenement(`🟥 CARTON ROUGE - ${fautif.nom}`, '#f44336');
        
        const joueursEquipe = fautif === equipeA ? joueurs.A : joueurs.B;
        const joueurExpulse = joueursEquipe[Math.floor(Math.random() * joueursEquipe.length)];
        joueurExpulse.expulse = true;
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
                afficherEvenement(`⚽ BUT! PENALTY - ${victime.nom}`, '#4caf50');
                animerBut(ballon, victime === equipeA ? 'droite' : 'gauche');
            } else {
                commentaires.push(`🧤 ${minuteActuelle}' Penalty arrêté (${victime.nom})`);
                afficherEvenement(`🧤 Penalty arrêté!`, '#ff9800');
            }
        }
        else {
            if (victime === equipeA) stats.coupsFrancsA++;
            else stats.coupsFrancsB++;

            const but = tirerCoupFranc(victime);

            if (but) {
                if (victime === equipeA) scoreA++;
                else scoreB++;
                commentaires.push(`🎯 ${minuteActuelle}' BUT SUR COUP FRANC (${victime.nom})`);
                afficherEvenement(`⚽ BUT! Coup franc - ${victime.nom}`, '#4caf50');
                animerBut(ballon, victime === equipeA ? 'droite' : 'gauche');
            } else {
                commentaires.push(`❌ ${minuteActuelle}' Coup franc manqué (${victime.nom})`);
                afficherEvenement(`❌ Coup franc manqué`, '#ff5722');
            }
        }
    }

    return;
}

        let penaliteA = stats.rougesA * 0.08;
let penaliteB = stats.rougesB * 0.08;

let chanceAction = possession === equipeA
    ? 0.35 - penaliteA
    : 0.35 - penaliteB;

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
                if (window.carriereData && attaquant === window.carriereData.equipe) {
                    window.carriereData.buteurs[buteur.nom]++;
                    
                    const passeurPotentiel = joueurs.A[Math.floor(Math.random() * joueurs.A.length)];
                    if (passeurPotentiel.nom !== buteur.nom && !passeurPotentiel.expulse) {
                        window.carriereData.passeurs[passeurPotentiel.nom]++;
                    }
                }

                commentaires.push(`⚽ ${minuteActuelle}' BUT de ${attaquant.nom}`);
                afficherEvenement(`⚽ BUUUUT! ${attaquant.nom}`, '#4caf50');
                animerBut(ballon, attaquant === equipeA ? 'droite' : 'gauche');
            } 
            else if (action.cadre) {
                commentaires.push(`🧤 ${minuteActuelle}' Tir cadré arrêté (${attaquant.nom})`);
                afficherEvenement(`🧤 Arrêt du gardien!`, '#2196f3');
                animerArret(ballon, attaquant === equipeA ? 'droite' : 'gauche');
            } 
            else {
                commentaires.push(`❌ ${minuteActuelle}' Tir non cadré (${attaquant.nom})`);
                afficherEvenement(`❌ Tir à côté!`, '#9e9e9e');
            }
        }

    }, 100);
}

function creerTerrain(equipeA, equipeB) {
    const terrainHTML = `
        <svg id="terrain" width="800" height="600" style="border:2px solid #333; background:#2d5016;">
            <rect x="0" y="0" width="800" height="600" fill="#2d5016"/>
            
            <line x1="400" y1="0" x2="400" y2="600" stroke="#fff" stroke-width="2"/>
            <circle cx="400" cy="300" r="80" fill="none" stroke="#fff" stroke-width="2"/>
            <circle cx="400" cy="300" r="5" fill="#fff"/>
            
            <rect x="0" y="200" width="80" height="200" fill="none" stroke="#fff" stroke-width="2"/>
            <rect x="0" y="250" width="40" height="100" fill="none" stroke="#fff" stroke-width="2"/>
            
            <rect x="720" y="200" width="80" height="200" fill="none" stroke="#fff" stroke-width="2"/>
            <rect x="760" y="250" width="40" height="100" fill="none" stroke="#fff" stroke-width="2"/>
            
            <g id="joueursA"></g>
            <g id="joueursB"></g>
            <circle id="ballon" cx="400" cy="300" r="8" fill="#fff" stroke="#000" stroke-width="2"/>
        </svg>
        <div id="scoreboard" style="display:flex; justify-content:space-between; margin-top:10px; font-size:24px; font-weight:bold;">
            <div style="color:#ff6b6b;">${equipeA.nom}: <span id="scoreA">0</span></div>
            <div style="color:#fff;">Minute: <span id="minute">0</span></div>
            <div style="color:#4ecdc4;">${equipeB.nom}: <span id="scoreB">0</span></div>
        </div>
        <div id="evenement" style="text-align:center; margin-top:10px; height:40px; font-size:20px; font-weight:bold;"></div>
    `;
    
    content.innerHTML = terrainHTML;
    return document.getElementById('terrain');
}

function initialiserJoueurs(equipeA, equipeB) {
    const nomsA = equipeA.joueurs || genererNomsJoueurs(equipeA.nom);
    const nomsB = equipeB.joueurs || genererNomsJoueurs(equipeB.nom);
    
    const joueursA = [
        {x: 30, y: 300, role: 'gardien', expulse: false, nom: nomsA[0]},
        {x: 120, y: 200, role: 'defense', expulse: false, nom: nomsA[1]},
        {x: 120, y: 400, role: 'defense', expulse: false, nom: nomsA[2]},
        {x: 200, y: 300, role: 'milieu', expulse: false, nom: nomsA[3]},
        {x: 280, y: 200, role: 'attaque', expulse: false, nom: nomsA[4]},
        {x: 280, y: 400, role: 'attaque', expulse: false, nom: nomsA[5]}
    ];
    
    const joueursB = [
        {x: 770, y: 300, role: 'gardien', expulse: false, nom: nomsB[0]},
        {x: 680, y: 200, role: 'defense', expulse: false, nom: nomsB[1]},
        {x: 680, y: 400, role: 'defense', expulse: false, nom: nomsB[2]},
        {x: 600, y: 300, role: 'milieu', expulse: false, nom: nomsB[3]},
        {x: 520, y: 200, role: 'attaque', expulse: false, nom: nomsB[4]},
        {x: 520, y: 400, role: 'attaque', expulse: false, nom: nomsB[5]}
    ];
    
    const couleurA = equipeA.couleur || '#ff6b6b';
    const couleurB = equipeB.couleur || '#4ecdc4';
    
    dessinerJoueurs(joueursA, 'A', couleurA);
    dessinerJoueurs(joueursB, 'B', couleurB);
    
    return {A: joueursA, B: joueursB};
}

function dessinerJoueurs(joueurs, equipe, couleur) {
    const container = document.getElementById(`joueurs${equipe}`);
    container.innerHTML = '';
    
    joueurs.forEach((joueur, index) => {
        if (!joueur.expulse) {
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', joueur.x);
            circle.setAttribute('cy', joueur.y);
            circle.setAttribute('r', '15');
            circle.setAttribute('fill', couleur);
            circle.setAttribute('stroke', '#000');
            circle.setAttribute('stroke-width', '2');
            circle.setAttribute('id', `joueur${equipe}${index}`);
            container.appendChild(circle);
            
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', joueur.x);
            text.setAttribute('y', joueur.y - 20);
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('fill', '#fff');
            text.setAttribute('font-size', '12');
            text.setAttribute('font-weight', 'bold');
            text.setAttribute('id', `nom${equipe}${index}`);
            text.textContent = joueur.nom || `J${index + 1}`;
            container.appendChild(text);
        }
    });
}

function deplacerJoueurs(joueurs, possession, equipeA) {
    Object.keys(joueurs).forEach(equipe => {
        joueurs[equipe].forEach((joueur, index) => {
            if (!joueur.expulse) {
                const deplacement = Math.random() * 20 - 10;
                joueur.x += deplacement;
                joueur.y += Math.random() * 20 - 10;
                
                joueur.x = Math.max(20, Math.min(780, joueur.x));
                joueur.y = Math.max(20, Math.min(580, joueur.y));
                
                const circle = document.getElementById(`joueur${equipe}${index}`);
                if (circle) {
                    circle.setAttribute('cx', joueur.x);
                    circle.setAttribute('cy', joueur.y);
                }
                
                const text = document.getElementById(`nom${equipe}${index}`);
                if (text) {
                    text.setAttribute('x', joueur.x);
                    text.setAttribute('y', joueur.y - 20);
                }
            }
        });
    });
}

function animerBallon(ballon, possesseur) {
    if (possesseur) {
        ballon.x = possesseur.x;
        ballon.y = possesseur.y;
        
        const ballonElement = document.getElementById('ballon');
        if (ballonElement) {
            ballonElement.setAttribute('cx', ballon.x);
            ballonElement.setAttribute('cy', ballon.y);
        }
    }
}

function animerBut(ballon, cage) {
    const ballonElement = document.getElementById('ballon');
    const targetX = cage === 'droite' ? 790 : 10;
    const targetY = 300;
    
    let steps = 0;
    const maxSteps = 20;
    const deltaX = (targetX - ballon.x) / maxSteps;
    const deltaY = (targetY - ballon.y) / maxSteps;
    
    const animation = setInterval(() => {
        steps++;
        ballon.x += deltaX;
        ballon.y += deltaY;
        
        if (ballonElement) {
            ballonElement.setAttribute('cx', ballon.x);
            ballonElement.setAttribute('cy', ballon.y);
        }
        
        if (steps >= maxSteps) {
            clearInterval(animation);
            setTimeout(() => {
                ballon.x = 400;
                ballon.y = 300;
                if (ballonElement) {
                    ballonElement.setAttribute('cx', 400);
                    ballonElement.setAttribute('cy', 300);
                }
            }, 500);
        }
    }, 50);
}

function animerArret(ballon, cage) {
    const ballonElement = document.getElementById('ballon');
    const targetX = cage === 'droite' ? 750 : 50;
    
    let steps = 0;
    const maxSteps = 10;
    const deltaX = (targetX - ballon.x) / maxSteps;
    
    const animation = setInterval(() => {
        steps++;
        ballon.x += deltaX;
        
        if (ballonElement) {
            ballonElement.setAttribute('cx', ballon.x);
            ballonElement.setAttribute('cy', ballon.y);
        }
        
        if (steps >= maxSteps) {
            clearInterval(animation);
        }
    }, 50);
}

function animerPenalty(ballon, cage) {
    ballon.x = cage === 'gauche' ? 100 : 700;
    ballon.y = 300;
    
    const ballonElement = document.getElementById('ballon');
    if (ballonElement) {
        ballonElement.setAttribute('cx', ballon.x);
        ballonElement.setAttribute('cy', ballon.y);
    }
}

function afficherMinute(minute, scoreA, scoreB) {
    const minuteElement = document.getElementById('minute');
    const scoreAElement = document.getElementById('scoreA');
    const scoreBElement = document.getElementById('scoreB');
    
    if (minuteElement) minuteElement.textContent = minute;
    if (scoreAElement) scoreAElement.textContent = scoreA;
    if (scoreBElement) scoreBElement.textContent = scoreB;
}

function afficherEvenement(texte, couleur) {
    const evenementElement = document.getElementById('evenement');
    if (evenementElement) {
        evenementElement.textContent = texte;
        evenementElement.style.color = couleur;
        
        setTimeout(() => {
            evenementElement.textContent = '';
        }, 3000);
    }
}

function tirerPenalty(equipe) {
    let chance = 75 + (equipe.attaque / 5);
    return Math.random() * 100 < chance;
}

function tirerCoupFranc(equipe) {
    let chance = 30 + (equipe.attaque / 8);
    return Math.random() * 100 < chance;
}

function tirerCarton() {
    const tirage = Math.random();

    if (tirage < 0.75) return "jaune";
    if (tirage < 0.85) return "rouge";
    return null;
}

function actionOffensiveDetaillee(attaque, defense) {
    let precision = attaque.attaque - defense.defense / 2;
    let puissance = attaque.attaque;

    if (Math.random() < 0.1) precision += 10;

    if (attaque.eveil && Math.random() < 0.05) {
        precision += 20;
        puissance += 20;
    }

    const chancePrecision = Math.random() * 100;
    const cadre = chancePrecision < precision;

    if (!cadre) {
        return { cadre: false, but: false };
    }

    const chanceBut = Math.random() * 100;
    const but = (puissance + chanceBut) > (defense.defense + 60);

    return { cadre: true, but };
}


function calculScore(equipe) {
    let base = Math.floor(Math.random() * 3);
    let bonus = Math.floor(equipe.attaque / 30);

    if (equipe.eveil && Math.random() > 0.7) {
        bonus += 2;
    }

    return base + bonus;
}

function afficherResultatMatch(teamA, teamB, scoreA, scoreB, commentaires, stats) {
    const possA = Math.round(stats.possessionA / 90 * 100);
    const possB = Math.round(stats.possessionB / 90 * 100);
    
    let boutonSuite = '';
    let boutonClassement = '';
    
    if (window.carriereData) {
        window.carriereData.matchsJoues++;
        window.carriereData.butsMarques += scoreA;
        window.carriereData.butsEncaisses += scoreB;
        
        if (scoreA > scoreB) {
            window.carriereData.matchsGagnes++;
            window.carriereData.points += 3;
        } else if (scoreA < scoreB) {
            window.carriereData.matchsPerdus++;
        } else {
            window.carriereData.matchsNuls++;
            window.carriereData.points += 1;
        }
        
        window.carriereData.classementEquipes.push({
            adversaire: teamB.nom,
            scoreA: scoreA,
            scoreB: scoreB,
            resultat: scoreA > scoreB ? 'V' : scoreA < scoreB ? 'D' : 'N'
        });
        
        boutonSuite = `
            <button onclick="afficherProchainMatch()" style="padding:15px 40px; font-size:20px; background:#4caf50; color:#fff; border:none; border-radius:50px; cursor:pointer; font-weight:bold; box-shadow:0 8px 20px rgba(0,0,0,0.3); margin:10px;">
                ➡️ Match suivant
            </button>
        `;
        
        boutonClassement = `
            <button onclick="afficherClassement()" style="padding:15px 40px; font-size:20px; background:#2196f3; color:#fff; border:none; border-radius:50px; cursor:pointer; font-weight:bold; box-shadow:0 8px 20px rgba(0,0,0,0.3); margin:10px;">
                📊 Voir les classements
            </button>
        `;
    } else {
        boutonSuite = `
            <button onclick="afficherExhibition()" style="padding:15px 40px; font-size:20px; background:#4caf50; color:#fff; border:none; border-radius:50px; cursor:pointer; font-weight:bold; box-shadow:0 8px 20px rgba(0,0,0,0.3); margin-top:20px;">
                🔄 Rejouer
            </button>
        `;
    }

    const careerPoints = window.carriereData ? window.carriereData.points : 0;
    const careerGames = window.carriereData ? window.carriereData.matchsJoues : 0;
    const victoryBonus = scoreA > scoreB ? 180 : scoreA === scoreB ? 80 : 20;
    const matchScore =
        victoryBonus +
        (scoreA * 140) -
        (scoreB * 30) +
        (stats.tirsCadresA * 12) +
        possA +
        (careerPoints * 90) +
        (careerGames * 35);
    updateCatalogScore(matchScore);
    
    content.innerHTML = `
        <div style="background:linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding:30px; border-radius:20px;">
            <h2 style="color:#fff; text-shadow:2px 2px 4px #000;">🏆 Résultat du match</h2>
            
            <div style="background:rgba(0,0,0,0.3); padding:20px; border-radius:15px; margin:20px 0;">
                <div style="display:flex; justify-content:space-around; align-items:center; margin:20px 0;">
                    <div style="text-align:center;">
                        <div style="font-size:24px; font-weight:bold; color:#ff6b6b;">${teamA.nom}</div>
                        <div style="font-size:72px; font-weight:bold; color:#fff; text-shadow:3px 3px 6px #000;">${scoreA}</div>
                    </div>
                    <div style="font-size:48px; color:#fff;">-</div>
                    <div style="text-align:center;">
                        <div style="font-size:24px; font-weight:bold; color:#4ecdc4;">${teamB.nom}</div>
                        <div style="font-size:72px; font-weight:bold; color:#fff; text-shadow:3px 3px 6px #000;">${scoreB}</div>
                    </div>
                </div>
                
                <div style="text-align:center; font-size:24px; font-weight:bold; margin:20px 0;">
                    ${scoreA > scoreB ? '🎉 Victoire !' : scoreA < scoreB ? '😢 Défaite' : '🤝 Match nul'}
                </div>
            </div>

            <div style="background:rgba(0,0,0,0.3); padding:20px; border-radius:15px; margin:20px 0;">
                <h3 style="color:#fff;">📊 Statistiques</h3>
                <div style="display:grid; grid-template-columns:1fr auto 1fr; gap:10px; margin:15px 0; text-align:center;">
                    <div style="color:#ff6b6b; font-weight:bold;">${possA}%</div>
                    <div style="color:#aaa;">Possession</div>
                    <div style="color:#4ecdc4; font-weight:bold;">${possB}%</div>
                    
                    <div style="color:#ff6b6b; font-weight:bold;">${stats.tirsA}</div>
                    <div style="color:#aaa;">Tirs</div>
                    <div style="color:#4ecdc4; font-weight:bold;">${stats.tirsB}</div>
                    
                    <div style="color:#ff6b6b; font-weight:bold;">${stats.tirsCadresA}</div>
                    <div style="color:#aaa;">Tirs cadrés</div>
                    <div style="color:#4ecdc4; font-weight:bold;">${stats.tirsCadresB}</div>
                    
                    <div style="color:#ff6b6b; font-weight:bold;">${stats.fautesA}</div>
                    <div style="color:#aaa;">Fautes</div>
                    <div style="color:#4ecdc4; font-weight:bold;">${stats.fautesB}</div>
                    
                    <div style="color:#ff6b6b; font-weight:bold;">🟨 ${stats.jaunesA} 🟥 ${stats.rougesA}</div>
                    <div style="color:#aaa;">Cartons</div>
                    <div style="color:#4ecdc4; font-weight:bold;">🟨 ${stats.jaunesB} 🟥 ${stats.rougesB}</div>
                </div>
            </div>

            <div style="background:rgba(0,0,0,0.3); padding:20px; border-radius:15px; margin:20px 0;">
                <h3 style="color:#fff;">📝 Commentaires</h3>
                <div style="max-height:200px; overflow-y:auto; padding:10px;">
                    ${commentaires.map((c, i) => `
                        <div style="padding:8px; margin:5px 0; background:${i % 2 === 0 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.2)'}; border-left:3px solid ${c.includes('BUT') ? '#4caf50' : c.includes('🟥') ? '#f44336' : '#4ecdc4'}; border-radius:5px; color:#fff; font-size:14px;">
                            ${c}
                        </div>
                    `).join('')}
                </div>
            </div>

            <div style="text-align:center;">
                ${boutonSuite}
                ${boutonClassement}
            </div>
        </div>
    `;
}

function afficherClassement() {
    const data = window.carriereData;
    
    const buteursArray = Object.entries(data.buteurs).sort((a, b) => b[1] - a[1]);
    const passeursArray = Object.entries(data.passeurs).sort((a, b) => b[1] - a[1]);
    
    content.innerHTML = `
        <div style="background:linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding:30px; border-radius:20px;">
            <h2 style="color:#fff; text-shadow:2px 2px 4px #000;">📊 Classements de la carrière</h2>
            
            <div style="background:rgba(0,0,0,0.3); padding:20px; border-radius:15px; margin:20px 0;">
                <h3 style="color:#ffd700; margin-bottom:15px;">🏆 Bilan général</h3>
                <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:15px;">
                    <div style="background:rgba(255,255,255,0.1); padding:15px; border-radius:10px;">
                        <div style="font-size:24px; font-weight:bold; color:#4caf50;">${data.matchsGagnes}-${data.matchsNuls}-${data.matchsPerdus}</div>
                        <div style="color:#aaa;">V-N-D</div>
                    </div>
                    <div style="background:rgba(255,255,255,0.1); padding:15px; border-radius:10px;">
                        <div style="font-size:24px; font-weight:bold; color:#ffd700;">${data.points} pts</div>
                        <div style="color:#aaa;">Points</div>
                    </div>
                    <div style="background:rgba(255,255,255,0.1); padding:15px; border-radius:10px;">
                        <div style="font-size:24px; font-weight:bold; color:#4ecdc4;">${data.butsMarques}-${data.butsEncaisses}</div>
                        <div style="color:#aaa;">Buts</div>
                    </div>
                </div>
            </div>
            
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px; margin:20px 0;">
                <div style="background:rgba(0,0,0,0.3); padding:20px; border-radius:15px;">
                    <h3 style="color:#ffd700; margin-bottom:15px;">⚽ Top Buteurs</h3>
                    <div style="background:rgba(255,255,255,0.05); border-radius:10px; padding:10px;">
                        ${buteursArray.slice(0, 6).map((b, i) => `
                            <div style="display:flex; justify-content:space-between; align-items:center; padding:12px; margin:5px 0; background:${i === 0 ? 'rgba(255,215,0,0.2)' : i === 1 ? 'rgba(192,192,192,0.2)' : i === 2 ? 'rgba(205,127,50,0.2)' : 'rgba(255,255,255,0.05)'}; border-radius:8px; border-left:4px solid ${i === 0 ? '#ffd700' : i === 1 ? '#c0c0c0' : i === 2 ? '#cd7f32' : '#4ecdc4'};">
                                <div style="display:flex; align-items:center; gap:10px;">
                                    <span style="font-weight:bold; font-size:18px; color:#fff; width:25px;">${i + 1}</span>
                                    <span style="color:#fff; font-size:16px;">${b[0]}</span>
                                </div>
                                <div style="display:flex; align-items:center; gap:5px;">
                                    <span style="font-size:24px; font-weight:bold; color:#ffd700;">${b[1]}</span>
                                    <span style="color:#aaa;">⚽</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div style="background:rgba(0,0,0,0.3); padding:20px; border-radius:15px;">
                    <h3 style="color:#ffd700; margin-bottom:15px;">🎯 Top Passeurs</h3>
                    <div style="background:rgba(255,255,255,0.05); border-radius:10px; padding:10px;">
                        ${passeursArray.slice(0, 6).map((p, i) => `
                            <div style="display:flex; justify-content:space-between; align-items:center; padding:12px; margin:5px 0; background:${i === 0 ? 'rgba(255,215,0,0.2)' : i === 1 ? 'rgba(192,192,192,0.2)' : i === 2 ? 'rgba(205,127,50,0.2)' : 'rgba(255,255,255,0.05)'}; border-radius:8px; border-left:4px solid ${i === 0 ? '#ffd700' : i === 1 ? '#c0c0c0' : i === 2 ? '#cd7f32' : '#4ecdc4'};">
                                <div style="display:flex; align-items:center; gap:10px;">
                                    <span style="font-weight:bold; font-size:18px; color:#fff; width:25px;">${i + 1}</span>
                                    <span style="color:#fff; font-size:16px;">${p[0]}</span>
                                </div>
                                <div style="display:flex; align-items:center; gap:5px;">
                                    <span style="font-size:24px; font-weight:bold; color:#4ecdc4;">${p[1]}</span>
                                    <span style="color:#aaa;">🎯</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
            
            <div style="background:rgba(0,0,0,0.3); padding:20px; border-radius:15px; margin:20px 0;">
                <h3 style="color:#ffd700; margin-bottom:15px;">📋 Historique des matchs</h3>
                <div style="max-height:300px; overflow-y:auto; padding:10px;">
                    ${data.classementEquipes.map((m, i) => `
                        <div style="display:flex; justify-content:space-between; align-items:center; padding:12px; margin:5px 0; background:${m.resultat === 'V' ? 'rgba(76,175,80,0.2)' : m.resultat === 'D' ? 'rgba(244,67,54,0.2)' : 'rgba(255,193,7,0.2)'}; border-radius:8px; border-left:4px solid ${m.resultat === 'V' ? '#4caf50' : m.resultat === 'D' ? '#f44336' : '#ffc107'};">
                            <div style="color:#fff;">
                                <span style="font-weight:bold;">Match ${i + 1}</span> - ${data.equipe.nom} vs ${m.adversaire}
                            </div>
                            <div style="display:flex; align-items:center; gap:15px;">
                                <span style="font-size:20px; font-weight:bold; color:#fff;">${m.scoreA} - ${m.scoreB}</span>
                                <span style="font-size:18px; font-weight:bold; padding:5px 15px; background:${m.resultat === 'V' ? '#4caf50' : m.resultat === 'D' ? '#f44336' : '#ffc107'}; border-radius:20px; color:#fff;">${m.resultat}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <div style="text-align:center; margin-top:20px;">
                <button onclick="afficherProchainMatch()" style="padding:15px 40px; font-size:20px; background:#4caf50; color:#fff; border:none; border-radius:50px; cursor:pointer; font-weight:bold; box-shadow:0 8px 20px rgba(0,0,0,0.3); margin:10px;">
                    ⬅️ Retour
                </button>
            </div>
        </div>
    `;
}
