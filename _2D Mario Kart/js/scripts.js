// ============================================
// MARIO KART RACING - MOTEUR DE JEU COMPLET
// Version améliorée
// ============================================

'use strict';

const canvas = document.getElementById('game-canvas');
const ctx = canvas ? canvas.getContext('2d') : null;

// ==========================================
// CONFIGURATION GLOBALE
// ==========================================

const CONFIG = {
    roadWidth: 2500,
    segmentLength: 150,
    rumbleLength: 4,
    cameraDepth: 0.84,
    drawDistance: 500,
    fieldOfView: 100,
    cameraHeight: 1500,

    // Physique
    maxSpeed: 280,
    acceleration: 0.5,
    braking: -6,
    deceleration: -0.25,
    offRoadDecel: -4,
    offRoadLimit: 120,
    centrifugal: 0.22,

    // IA
    aiDifficulty: 'normal',
    aiCount: 7,

    // Course
    totalLaps: 3,
    trackLength: 0
};

const COLORS = {
    sky: ['#667eea', '#764ba2'],
    ground: ['#4a7c59', '#2d5f3f'],
    rumble: { light: '#FFFFFF', dark: '#FF1744' },
    road: { light: '#555555', dark: '#3d3d3d' },
    lane: '#FFFFFF',
    mountain: ['#6b5d4f', '#4a3f35']
};

// ==========================================
// ÉTAT DU JEU
// ==========================================

function createInitialState() {
    return {
        screen: 'main-menu',
        selectedCharacter: null,
        playerRacer: null,
        aiRacers: [],
        allRacers: [],
        raceStarted: false,
        raceFinished: false,
        paused: false,
        countdownActive: false,
        startTime: 0,
        currentLap: 1,
        lapTimes: [],
        bestLapTime: Infinity,
        totalCoins: 0,
        currentItem: null,
        difficulty: 'normal',
        soundEnabled: true,
        musicEnabled: true
    };
}

let gameState = createInitialState();

// ==========================================
// PERSONNAGES & OBJETS
// ==========================================

const CHARACTERS = {
    mario:  { name: 'MARIO',  icon: '🧑‍🦰', speed: 240, accel: 0.48, handling: 0.85, color: '#E53935' },
    luigi:  { name: 'LUIGI',  icon: '👨',    speed: 230, accel: 0.52, handling: 0.92, color: '#43A047' },
    peach:  { name: 'PEACH',  icon: '👸',    speed: 220, accel: 0.56, handling: 0.95, color: '#EC407A' },
    bowser: { name: 'BOWSER', icon: '🐲',    speed: 270, accel: 0.42, handling: 0.75, color: '#FF6F00' }
};

const ITEMS = {
    MUSHROOM: { emoji: '🍄', name: 'Turbo',   speedBoost: 100 },
    BANANA:   { emoji: '🍌', name: 'Banane',  effect: 'slow' },
    SHELL:    { emoji: '🐢', name: 'Carapace',effect: 'spin' },
    STAR:     { emoji: '⭐', name: 'Étoile',  speedBoost: 60, duration: 5000 }
};

const ITEMS_ARRAY = Object.values(ITEMS);

// ==========================================
// CACHE DOM — évite les getElementById à chaque frame
// ==========================================

const DOM = {};

function cacheDom() {
    DOM.playerPosition = document.getElementById('player-position');
    DOM.lapDisplay      = document.getElementById('lap-display');
    DOM.speedValue      = document.getElementById('speed-value');
    DOM.raceTimer       = document.getElementById('race-timer');
    DOM.currentItem     = document.getElementById('current-item');
    DOM.standingsList   = document.getElementById('standings-list');
    DOM.countdownOverlay = document.getElementById('countdown-overlay');
    DOM.countdownNumber  = document.getElementById('countdown-number');
}

// ==========================================
// SEGMENTS DE ROUTE
// ==========================================

let roadSegments = [];

// ==========================================
// CLASSE RACER
// ==========================================

class Racer {
    constructor(character, isPlayer = false, startOffset = 0) {
        this.character = character;
        this.isPlayer  = isPlayer;
        this.position  = startOffset;        // ← plus de double assignation
        this.x         = 0;
        this.speed     = 0;
        this.maxSpeed  = character.speed;
        this.accel     = character.accel;
        this.handling  = character.handling;
        this.lap       = 1;
        this.lapTimes  = [];
        this.lapStartTime = 0;
        this.coins     = 0;
        this.item      = null;
        this.boost     = 0;
        this.stunned   = 0;
        this.finished  = false;
        this.finishTime = Infinity;

        // IA
        this.aiTarget    = 0;
        this.aiTimer     = 0;
        this.aiItemDelay = 0;
        this._aiRandOffset = (Math.random() - 0.5) * 20; // variation unique par IA
    }

    update(dt, keys) {
        if (this.finished) return;

        if (this.stunned > 0) {
            this.stunned -= dt;
            this.speed *= 0.95;
            return;
        }

        const segment    = findSegment(this.position);
        const speedPercent = this.speed / this.maxSpeed;

        if (this.isPlayer) {
            this._updatePlayer(dt, keys, speedPercent);
        } else {
            this._updateAI(dt, segment);
        }

        // Effet centrifuge
        this.x -= dt * speedPercent * segment.curve * CONFIG.centrifugal * 2;

        // Limites latérales
        this.x = Math.max(-2.8, Math.min(2.8, this.x));

        // Hors route → ralentissement
        if (Math.abs(this.x) > 1.4) {
            this.speed = Math.max(this.speed + CONFIG.offRoadDecel * dt, CONFIG.offRoadLimit);
        }

        // Diminution boost
        if (this.boost > 0) {
            this.boost = Math.max(0, this.boost - dt * 30);
        }

        // Avancer
        this.position += this.speed * dt;

        // Fin de tour
        if (this.position >= CONFIG.trackLength) {
            this._completeLap();
        }
    }

    _updatePlayer(dt, keys, speedPercent) {
        if (keys['ArrowUp'] || keys['KeyW']) {
            this.speed = Math.min(this.speed + this.accel, this.maxSpeed + this.boost);
        } else if (keys['ArrowDown'] || keys['KeyS']) {
            this.speed = Math.max(this.speed + CONFIG.braking, -50);
        } else {
            this.speed = Math.max(this.speed + CONFIG.deceleration, 0);
        }

        const dx = dt * 3 * speedPercent * this.handling;
        if (keys['ArrowLeft']  || keys['KeyA']) this.x -= dx;
        if (keys['ArrowRight'] || keys['KeyD']) this.x += dx;
    }

    _updateAI(dt, segment) {
        const diffMod = { easy: 0.72, normal: 0.88, hard: 0.98 }[CONFIG.aiDifficulty] ?? 0.88;
        const targetSpeed = this.maxSpeed * diffMod + this._aiRandOffset;

        this.speed += this.speed < targetSpeed ? this.accel * 0.9 : CONFIG.deceleration;

        // Direction : recalcul tous les 0.3s pour éviter le recalcul constant
        this.aiTimer += dt;
        if (this.aiTimer >= 0.3) {
            this.aiTimer = 0;
            let target = -segment.curve * 0.4;
            if (this.x < -2) target =  0.5;
            if (this.x >  2) target = -0.5;
            // Variation fixe par IA pour un comportement unique mais stable
            target += Math.sin(Date.now() / 3000 + this._aiRandOffset) * 0.2;
            this.aiTarget = target;
        }

        const diff      = this.aiTarget - this.x;
        const turnSpeed = dt * 2.5 * this.handling;
        if (Math.abs(diff) > 0.1) {
            this.x += Math.sign(diff) * Math.min(Math.abs(diff), turnSpeed);
        }

        // Utilisation d'item
        if (this.item && this.aiItemDelay <= 0 && Math.random() < 0.02) {
            this.useItem();
            this.aiItemDelay = 3;
        }
        this.aiItemDelay = Math.max(0, this.aiItemDelay - dt);
    }

    _completeLap() {
        this.position -= CONFIG.trackLength;
        const lapTime = Date.now() - this.lapStartTime;
        this.lapTimes.push(lapTime);
        this.lapStartTime = Date.now();
        this.lap++;

        if (this.isPlayer) {
            gameState.currentLap = this.lap;
            if (lapTime < gameState.bestLapTime) {
                gameState.bestLapTime = lapTime;
            }
            updateLapFlash();

            if (this.lap > CONFIG.totalLaps) {
                this.finished   = true;
                this.finishTime = Date.now() - gameState.startTime;
                finishRace();
            }
        } else if (this.lap > CONFIG.totalLaps) {
            this.finished   = true;
            this.finishTime = Date.now() - gameState.startTime;
        }
    }

    useItem() {
        if (!this.item) return;
        if (this.item === ITEMS.MUSHROOM) {
            this.boost = this.item.speedBoost;
        } else if (this.item === ITEMS.STAR) {
            this.boost = this.item.speedBoost;
            setTimeout(() => { this.boost = 0; }, this.item.duration);
        }
        this.item = null;
        if (this.isPlayer && DOM.currentItem) {
            DOM.currentItem.textContent = '❌';
        }
    }

    collectItem(item) {
        this.item = item;
        if (this.isPlayer && DOM.currentItem) {
            DOM.currentItem.textContent = item.emoji;
        }
    }

    collectCoin() {
        this.coins++;
        this.maxSpeed = Math.min(this.maxSpeed + 1, this.character.speed + 20);
        if (this.isPlayer) {
            gameState.totalCoins++;
        }
    }
}

// ==========================================
// MENUS & NAVIGATION
// ==========================================

function showScreen(screenName) {
    // Evite de relancer la course si on est déjà sur game-screen
    if (screenName === 'game-screen' && gameState.screen === 'game-screen') return;

    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(screenName);
    if (!target) { console.warn(`Screen "${screenName}" introuvable.`); return; }
    target.classList.add('active');
    gameState.screen = screenName;

    if (screenName === 'character-select') setupCharacterSelection();
    else if (screenName === 'game-screen') startRaceSequence();
}

function setupCharacterSelection() {
    document.querySelectorAll('.character-card').forEach(card => {
        // Clone pour éviter les doubles écouteurs si on revient sur l'écran
        const clone = card.cloneNode(true);
        card.parentNode.replaceChild(clone, card);
        clone.addEventListener('click', function () {
            document.querySelectorAll('.character-card').forEach(c => c.classList.remove('selected'));
            this.classList.add('selected');
            gameState.selectedCharacter = CHARACTERS[this.getAttribute('data-character')];
            setTimeout(() => {
                if (gameState.selectedCharacter) showLoadingScreen();
            }, 800);
        });
    });
}

function showLoadingScreen() {
    showScreen('loading-screen');
    const playerIcon  = document.getElementById('player-preview');
    const progressBar = document.getElementById('loading-progress');
    if (playerIcon)  playerIcon.textContent  = gameState.selectedCharacter.icon;
    if (progressBar) progressBar.style.width = '0%';

    let progress = 0;
    const interval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress >= 100) {
            progress = 100;
            if (progressBar) progressBar.style.width = '100%';
            clearInterval(interval);
            setTimeout(() => showScreen('game-screen'), 500);
        } else {
            if (progressBar) progressBar.style.width = progress + '%';
        }
    }, 200);
}

function restartRace() {
    // Réinitialise l'état sans perdre le perso sélectionné
    const saved = { selectedCharacter: gameState.selectedCharacter };
    gameState = { ...createInitialState(), ...saved };
    showLoadingScreen();
}

// ==========================================
// CRÉATION DU CIRCUIT
// ==========================================

function createTrack() {
    roadSegments = [];
    addSection(100, 0, 0);
    addSection(80,  5, 500);
    addSection(60,  5, 0);
    addSection(70,  0, -600);
    addSection(90, -6, 0);
    addSection(50,  0, 800);
    addSection(60,  4, 0);
    addSection(50, -4, 0);
    addSection(50,  4, -400);
    addSection(100, 0, 0);
    addSection(80, -7, 200);
    addSection(70,  3, -700);
    addSection(90,  0, 0);
    CONFIG.trackLength = roadSegments.length * CONFIG.segmentLength;
    addTrackElements();
}

function addSection(length, curve, hill) {
    const startIdx = roadSegments.length;
    const startY   = roadSegments.length > 0 ? roadSegments[roadSegments.length - 1].p2.world.y : 0;

    for (let i = 0; i < length; i++) {
        const idx = startIdx + i;
        roadSegments.push({
            index: idx,
            p1: { world: { y: startY + hill * (i / length),       z: idx * CONFIG.segmentLength       }, camera: {}, screen: {} },
            p2: { world: { y: startY + hill * ((i + 1) / length), z: (idx + 1) * CONFIG.segmentLength }, camera: {}, screen: {} },
            curve,
            sprites: [],
            color: Math.floor(idx / CONFIG.rumbleLength) % 2
        });
    }
}

function addTrackElements() {
    const len = roadSegments.length;

    // Arbres
    for (let i = 8; i < len; i += 3) {
        const seg = roadSegments[i];
        if (Math.random() > 0.35) seg.sprites.push({ type: 'tree',    offset: -(3.5 + Math.random() * 2.5), emoji: '🌳', size: 120 });
        if (Math.random() > 0.35) seg.sprites.push({ type: 'tree',    offset:   3.5 + Math.random() * 2.5,  emoji: '🌳', size: 120 });
    }

    // Pièces
    for (let i = 30; i < len; i += 18) {
        roadSegments[i].sprites.push({ type: 'coin', offset: (Math.random() - 0.5) * 2.2, emoji: '⭐', size: 55, collected: false, rotation: 0 });
    }

    // Boîtes d'items
    for (let i = 50; i < len; i += 55) {
        roadSegments[i].sprites.push({ type: 'itembox', offset: (Math.random() - 0.5) * 1.8, emoji: '🎁', size: 70, active: true, respawn: 0, bounce: 0 });
    }

    // Panneaux
    [100, 180, 240, 310, 400, 490, 580, 670, 770, 860].forEach(pos => {
        if (pos < len) {
            roadSegments[pos].sprites.push({ type: 'sign', offset: -3, emoji: '⚠️', size: 70 });
            roadSegments[pos].sprites.push({ type: 'sign', offset:  3, emoji: '⚠️', size: 70 });
        }
    });

    // Ligne de départ
    if (roadSegments[5]) {
        roadSegments[5].sprites.push({ type: 'flag', offset: -3.5, emoji: '🏁', size: 90 });
        roadSegments[5].sprites.push({ type: 'flag', offset:  3.5, emoji: '🏁', size: 90 });
    }
}

function findSegment(z) {
    const idx = Math.floor(z / CONFIG.segmentLength) % roadSegments.length;
    return roadSegments[idx >= 0 ? idx : idx + roadSegments.length];
}

// ==========================================
// DÉMARRAGE DE COURSE
// ==========================================

function startRaceSequence() {
    if (!canvas) return;
    cacheDom();

    // Lecture des options
    const diffSel  = document.getElementById('difficulty');
    const lapSel   = document.getElementById('lap-count');
    if (diffSel)  { CONFIG.aiDifficulty = diffSel.value; gameState.difficulty = diffSel.value; }
    if (lapSel)   { CONFIG.totalLaps    = parseInt(lapSel.value); }

    createTrack();
    resizeCanvas();

    const allRacers = [];
    gameState.playerRacer = new Racer(gameState.selectedCharacter, true, 0);
    allRacers.push(gameState.playerRacer);

    const aiChars = Object.values(CHARACTERS).filter(c => c !== gameState.selectedCharacter);
    gameState.aiRacers = [];
    for (let i = 0; i < CONFIG.aiCount; i++) {
        const racer = new Racer(aiChars[i % aiChars.length], false, -200 * (i + 1));
        gameState.aiRacers.push(racer);
        allRacers.push(racer);
    }
    gameState.allRacers = allRacers;

    setupMobileControls();
    startCountdown();
}

function startCountdown() {
    if (!DOM.countdownOverlay || !DOM.countdownNumber) return;
    DOM.countdownOverlay.classList.remove('hidden');

    let count = 3;
    DOM.countdownNumber.textContent = count;
    DOM.countdownNumber.style.animation = 'none';

    const interval = setInterval(() => {
        count--;
        if (count > 0) {
            DOM.countdownNumber.textContent = count;
        } else if (count === 0) {
            DOM.countdownNumber.textContent = 'GO!';
        } else {
            DOM.countdownOverlay.classList.add('hidden');
            const now = Date.now();
            gameState.raceStarted = true;
            gameState.startTime   = now;
            gameState.allRacers.forEach(r => { r.lapStartTime = now; });
            clearInterval(interval);
        }
    }, 1000);
}

function finishRace() {
    gameState.raceFinished = true;
    gameState.raceStarted  = false;
    removeMobileControls();

    const position  = calculatePosition(gameState.playerRacer);
    const totalTime = gameState.playerRacer.finishTime;

    setTimeout(() => showResultsScreen(position, totalTime), 2000);
}

// ==========================================
// ÉCRAN DE RÉSULTATS
// ==========================================

function showResultsScreen(position, totalTime) {
    showScreen('results-screen');

    const title = document.getElementById('results-title');
    if (title) {
        if (position === 1) {
            title.textContent = '🏆 VICTOIRE ! 🏆';
            title.style.color = '#FFD700';
        } else if (position <= 3) {
            title.textContent = '🥈 PODIUM ! 🥉';
            title.style.color = '#FF6F00';
        } else {
            title.textContent = '🏁 COURSE TERMINÉE 🏁';
            title.style.color = '#94a3b8';
        }
    }

    setText('final-position', position + getPositionSuffix(position));
    setText('final-time',     formatTime(totalTime));
    setText('best-lap',       gameState.bestLapTime < Infinity ? formatTime(gameState.bestLapTime) : '--:--');
    setText('total-coins',    gameState.totalCoins);

    const sorted = getSortedRacers();
    const listEl = document.getElementById('final-standings-list');
    if (listEl) {
        listEl.innerHTML = sorted.map((racer, idx) => {
            const medal = idx === 0 ? '#FFD700' : idx < 3 ? '#FF9800' : '#1976D2';
            return `<div style="padding:10px;background:${medal};margin:5px 0;border-radius:10px;color:#fff;font-size:1.2em;">
                ${idx + 1}. ${racer.character.icon} ${racer.character.name} ${racer.isPlayer ? '(VOUS)' : ''}
            </div>`;
        }).join('');
    }
}

// ==========================================
// PAUSE
// ==========================================

function togglePause() {
    if (!gameState.raceStarted && !gameState.paused) return;
    gameState.paused = !gameState.paused;
    gameState.raceStarted = !gameState.paused;

    let overlay = document.getElementById('pause-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'pause-overlay';
        overlay.style.cssText = `
            position:absolute;inset:0;background:rgba(0,0,0,.65);
            display:flex;flex-direction:column;align-items:center;justify-content:center;
            z-index:500;color:#fff;font-family:inherit;
        `;
        overlay.innerHTML = `
            <div style="font-size:3em;margin-bottom:16px;">⏸</div>
            <div style="font-size:2em;font-weight:bold;letter-spacing:3px;margin-bottom:24px;">PAUSE</div>
            <button onclick="togglePause()" style="
                padding:12px 32px;font-size:1.1em;font-weight:bold;
                background:linear-gradient(135deg,#22c55e,#16a34a);
                border:none;border-radius:12px;color:#fff;cursor:pointer;">
                ▶ Reprendre
            </button>
        `;
        const gameContainer = document.querySelector('.game-container');
        if (gameContainer) gameContainer.appendChild(overlay);
    }

    overlay.style.display = gameState.paused ? 'flex' : 'none';
    if (!gameState.paused) {
        // Remet à jour les lapStartTime pour ne pas fausser les temps
        const pauseGap = 0; // on ne mesure pas la durée de pause ici pour rester simple
        gameState.startTime += pauseGap;
    }
}

// ==========================================
// BOUCLE DE JEU
// ==========================================

const keys = {};

document.addEventListener('keydown', e => {
    keys[e.code] = true;
    keys[e.key]  = true;

    if (e.code === 'Space' && gameState.playerRacer && gameState.raceStarted) {
        e.preventDefault();
        gameState.playerRacer.useItem();
    }
    if (e.code === 'Escape') {
        if (gameState.screen === 'game-screen') togglePause();
    }
});

document.addEventListener('keyup', e => {
    keys[e.code] = false;
    keys[e.key]  = false;
});

// Throttle du HUD : ne met à jour le DOM standings que toutes les 200ms
let _standingsTimer = 0;

function update(dt) {
    if (!gameState.raceStarted || gameState.raceFinished || gameState.paused) return;

    gameState.allRacers.forEach(r => r.update(dt, keys));
    updateSpriteCollisions();
    updateHUD();

    _standingsTimer += dt;
    if (_standingsTimer >= 0.2) {
        _standingsTimer = 0;
        updateStandings();
    }
}

function updateSpriteCollisions() {
    const player = gameState.playerRacer;
    const seg    = findSegment(player.position);
    const now    = Date.now();

    for (let i = -2; i <= 2; i++) {
        const idx     = (seg.index + i + roadSegments.length) % roadSegments.length;
        const segment = roadSegments[idx];

        segment.sprites.forEach(sprite => {
            const dist  = Math.abs(sprite.offset - player.x);
            const zDist = Math.abs(segment.p1.world.z - player.position);

            if (zDist < 50 && dist < 0.6) {
                if (sprite.type === 'coin' && !sprite.collected) {
                    sprite.collected = true;
                    player.collectCoin();
                }
                if (sprite.type === 'itembox' && sprite.active) {
                    sprite.active   = false;
                    sprite.respawn  = 600;
                    player.collectItem(ITEMS_ARRAY[Math.floor(Math.random() * ITEMS_ARRAY.length)]);
                }
            }
        });
    }

    // Mise à jour des sprites (animations, respawn)
    roadSegments.forEach(s => {
        s.sprites.forEach(sprite => {
            if (sprite.type === 'itembox') {
                if (!sprite.active) {
                    sprite.respawn--;
                    if (sprite.respawn <= 0) sprite.active = true;
                }
                sprite.bounce = Math.sin(now / 100) * 12;
            }
            if (sprite.type === 'coin') {
                sprite.rotation += 0.05; // vitesse angulaire constante (pas par frame)
            }
        });
    });
}

// Met à jour le HUD depuis le cache DOM — aucun getElementById par frame
function updateHUD() {
    const player   = gameState.playerRacer;
    const position = calculatePosition(player);
    const elapsed  = Date.now() - gameState.startTime;

    if (DOM.playerPosition) DOM.playerPosition.textContent = position;
    if (DOM.lapDisplay)     DOM.lapDisplay.textContent     = `${Math.min(player.lap, CONFIG.totalLaps)}/${CONFIG.totalLaps}`;
    if (DOM.speedValue)     DOM.speedValue.textContent     = Math.floor(Math.max(0, player.speed));
    if (DOM.raceTimer)      DOM.raceTimer.textContent      = formatTime(elapsed);
}

function updateStandings() {
    if (!DOM.standingsList) return;
    const sorted = getSortedRacers();
    DOM.standingsList.innerHTML = sorted.slice(0, 8).map((racer, idx) => `
        <div style="padding:8px;color:${racer.isPlayer ? '#FFD700' : '#FFF'};
                    font-size:1.1em;border-bottom:1px solid #444;">
            ${idx + 1}. ${racer.character.icon} ${racer.isPlayer ? 'VOUS' : racer.character.name}
        </div>
    `).join('');
}

// Flash visuel lors d'un nouveau tour
function updateLapFlash() {
    const lapEl = DOM.lapDisplay;
    if (!lapEl) return;
    lapEl.style.transition = 'none';
    lapEl.style.color      = '#22c55e';
    lapEl.style.transform  = 'scale(1.6)';
    setTimeout(() => {
        lapEl.style.transition = 'all 0.4s ease';
        lapEl.style.color      = '';
        lapEl.style.transform  = '';
    }, 400);
}

// ==========================================
// RENDU
// ==========================================

function project(p, camX, camY, camZ) {
    const camDist = p.camera.z - camZ;
    if (camDist <= 0) return false;
    const scale   = CONFIG.cameraDepth / camDist;
    p.screen.scale = scale;
    p.screen.x = (1 + scale * (p.camera.x - camX)) * canvas.width / 2;
    p.screen.y = (1 - scale * (p.camera.y - camY)) * canvas.height / 2;
    p.screen.w = scale * CONFIG.roadWidth * canvas.width / 2;
    return true;
}

function render() {
    if (!canvas || !ctx || !gameState.playerRacer) return;

    const player    = gameState.playerRacer;
    const baseSeg   = findSegment(player.position);
    const playerSeg = findSegment(player.position + CONFIG.cameraDepth);
    const camY      = CONFIG.cameraHeight + playerSeg.p1.world.y;

    // Ciel
    const skyGrad = ctx.createLinearGradient(0, 0, 0, canvas.height / 2);
    skyGrad.addColorStop(0, COLORS.sky[0]);
    skyGrad.addColorStop(1, COLORS.sky[1]);
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawMountains();
    drawStars();

    // Sol
    const horizon   = canvas.height / 2;
    const groundGrad = ctx.createLinearGradient(0, horizon, 0, canvas.height);
    groundGrad.addColorStop(0, COLORS.ground[0]);
    groundGrad.addColorStop(1, COLORS.ground[1]);
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, horizon, canvas.width, canvas.height - horizon);

    // Route
    let x = 0;
    let dx = -(baseSeg.curve * player.x * CONFIG.fieldOfView / 2);

    for (let n = 0; n < CONFIG.drawDistance; n++) {
        const seg = roadSegments[(baseSeg.index + n) % roadSegments.length];

        seg.p1.camera.z = seg.p1.world.z - player.position;
        seg.p2.camera.z = seg.p2.world.z - player.position;
        seg.p1.camera.x = x + dx;
        seg.p2.camera.x = x + dx;
        seg.p1.camera.y = seg.p1.world.y;
        seg.p2.camera.y = seg.p2.world.y;

        x  += dx;
        dx += seg.curve;

        if (seg.p1.camera.z <= CONFIG.cameraDepth || seg.p2.camera.z <= 0) continue;
        if (!project(seg.p1, player.x, camY, CONFIG.cameraDepth)) continue;
        if (!project(seg.p2, player.x, camY, CONFIG.cameraDepth)) continue;
        if (seg.p2.screen.y >= seg.p1.screen.y) continue;

        drawSegment(seg);
    }

    drawRacers();
    drawPlayerKart();
}

function drawMountains() {
    const offset = gameState.playerRacer.position;
    ctx.fillStyle = COLORS.mountain[1];
    ctx.beginPath();
    ctx.moveTo(0, canvas.height / 2);
    for (let i = 0; i <= 12; i++) {
        ctx.lineTo((i / 12) * canvas.width,
            canvas.height / 2 - 130 - Math.sin(i * 0.6 + offset / 2500) * 80);
    }
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.fill();

    ctx.fillStyle = COLORS.mountain[0];
    ctx.beginPath();
    ctx.moveTo(0, canvas.height / 2);
    for (let i = 0; i <= 12; i++) {
        ctx.lineTo((i / 12) * canvas.width,
            canvas.height / 2 - 90 - Math.sin(i * 0.4 + offset / 2000) * 60);
    }
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.fill();
}

function drawStars() {
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    const offset = gameState.playerRacer.position;
    for (let i = 0; i < 40; i++) {
        ctx.fillRect(
            (i * 137 + offset / 5) % canvas.width,
            (i * 73)               % (canvas.height / 2.5),
            2, 2
        );
    }
}

function drawSegment(seg) {
    const p1     = seg.p1.screen;
    const p2     = seg.p2.screen;
    const rumble = seg.color ? COLORS.rumble.light : COLORS.rumble.dark;
    const road   = seg.color ? COLORS.road.light   : COLORS.road.dark;

    ctx.fillStyle = rumble;
    drawQuad(p1.x - p1.w - p1.w * 0.18, p1.y, p1.w * 0.4,
             p2.x - p2.w - p2.w * 0.18, p2.y, p2.w * 0.4);
    drawQuad(p1.x + p1.w - p1.w * 0.22, p1.y, p1.w * 0.4,
             p2.x + p2.w - p2.w * 0.22, p2.y, p2.w * 0.4);

    ctx.fillStyle = road;
    drawQuad(p1.x - p1.w, p1.y, p1.w * 2, p2.x - p2.w, p2.y, p2.w * 2);

    if (seg.color) {
        ctx.fillStyle = COLORS.lane;
        const lw1 = p1.w / 16, lw2 = p2.w / 16;
        drawQuad(p1.x - lw1, p1.y, lw1 * 2, p2.x - lw2, p2.y, lw2 * 2);
        const off1 = p1.w * 0.7, off2 = p2.w * 0.7;
        drawQuad(p1.x - off1 - lw1, p1.y, lw1 * 2, p2.x - off2 - lw2, p2.y, lw2 * 2);
        drawQuad(p1.x + off1 - lw1, p1.y, lw1 * 2, p2.x + off2 - lw2, p2.y, lw2 * 2);
    }

    drawSprites(seg);
}

function drawQuad(x1, y1, w1, x2, y2, w2) {
    ctx.beginPath();
    ctx.moveTo(x1 - w1, y1);
    ctx.lineTo(x2 - w2, y2);
    ctx.lineTo(x2 + w2, y2);
    ctx.lineTo(x1 + w1, y1);
    ctx.fill();
}

function drawSprites(seg) {
    seg.sprites.forEach(sprite => {
        if (sprite.type === 'coin'    && sprite.collected) return;
        if (sprite.type === 'itembox' && !sprite.active)   return;

        const p    = seg.p2.screen;
        const x    = p.x + p.scale * sprite.offset * canvas.width / 2;
        const y    = p.y + (sprite.bounce || 0) * p.scale;
        const size = sprite.size * p.scale;

        if (p.scale <= 0.008 || size <= 12) return;

        ctx.save();
        ctx.font         = `${size}px Arial`;
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'bottom';

        if (sprite.type === 'coin') {
            ctx.translate(x, y);
            ctx.rotate(sprite.rotation);
            ctx.shadowColor = '#FFD700';
            ctx.shadowBlur  = 25 * p.scale;
            ctx.fillText(sprite.emoji, 0, 0);
        } else {
            if (sprite.type === 'itembox') {
                ctx.shadowColor = 'rgba(255,200,0,0.9)';
                ctx.shadowBlur  = 20 * p.scale;
            }
            ctx.fillText(sprite.emoji, x, y);
        }
        ctx.restore();
    });
}

function drawRacers() {
    const player = gameState.playerRacer;
    const camY   = CONFIG.cameraHeight + findSegment(player.position + CONFIG.cameraDepth).p1.world.y;

    const visible = gameState.aiRacers
        .map(racer => {
            const relZ = racer.position - player.position;
            if (relZ < -500 || relZ > CONFIG.drawDistance * CONFIG.segmentLength) return null;
            const seg = findSegment(racer.position);
            const p   = { camera: { x: racer.x, y: seg.p1.world.y, z: relZ }, screen: {} };
            return project(p, player.x, camY, CONFIG.cameraDepth) ? { racer, p } : null;
        })
        .filter(Boolean)
        .sort((a, b) => b.p.camera.z - a.p.camera.z);

    visible.forEach(({ racer, p }) => {
        const size = 80 * p.screen.scale;
        if (size < 8) return;

        ctx.save();
        ctx.translate(p.screen.x, p.screen.y);

        // Ombre
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.beginPath();
        ctx.ellipse(0, size * 0.5, size * 0.6, size * 0.25, 0, 0, Math.PI * 2);
        ctx.fill();

        // Kart
        ctx.fillStyle = racer.character.color;
        ctx.fillRect(-size * 0.4, -size * 0.5, size * 0.8, size);

        // Pilote
        ctx.font         = `${size * 0.6}px Arial`;
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(racer.character.icon, 0, -size * 0.15);
        ctx.restore();
    });
}

function drawPlayerKart() {
    if (!gameState.playerRacer) return;
    const x      = canvas.width / 2;
    const y      = canvas.height - 140;
    const bounce = Math.sin(Date.now() / 80) * 4;
    const tilt   = gameState.playerRacer.x * 5;

    ctx.save();
    ctx.translate(x, y + bounce);
    ctx.rotate(tilt * Math.PI / 180);

    // Ombre
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.beginPath();
    ctx.ellipse(0, 45, 50, 22, 0, 0, Math.PI * 2);
    ctx.fill();

    // Carrosserie
    const color = gameState.playerRacer.character.color;
    ctx.fillStyle = color;
    ctx.fillRect(-40, -45, 80, 90);

    // Roues
    ctx.fillStyle = '#000';
    [[-44, -50], [28, -50], [-44, 26], [28, 26]].forEach(([wx, wy]) =>
        ctx.fillRect(wx, wy, 16, 24)
    );

    // Pare-chocs
    ctx.fillStyle = '#1565C0';
    ctx.fillRect(-35, 42, 70, 12);

    // Phares
    ctx.fillStyle = '#FFEB3B';
    ctx.fillRect(-30, -52, 16, 10);
    ctx.fillRect(14, -52, 16, 10);

    // Pilote
    ctx.font         = 'bold 48px Arial';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(gameState.playerRacer.character.icon, 0, -14);
    ctx.restore();
}

// ==========================================
// CANVAS RESPONSIVE
// ==========================================

function resizeCanvas() {
    if (!canvas) return;
    const wrapper = canvas.closest('.game-container') || canvas.parentElement;
    if (!wrapper) return;
    const ratio = 1200 / 800;
    const w     = wrapper.clientWidth;
    const h     = wrapper.clientHeight || w / ratio;
    canvas.width  = Math.max(w, 320);
    canvas.height = Math.max(Math.round(canvas.width / ratio), 240);
}

window.addEventListener('resize', resizeCanvas);

// ==========================================
// CONTRÔLES TACTILES (mobile)
// ==========================================

let _touchControls = null;

function setupMobileControls() {
    if (_touchControls) removeMobileControls();

    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (!isTouchDevice) return;

    const container = canvas.closest('.game-container') || canvas.parentElement;
    if (!container) return;

    const pad = document.createElement('div');
    pad.id = 'touch-pad';
    pad.style.cssText = `
        position:absolute;bottom:0;left:0;right:0;height:160px;
        display:flex;justify-content:space-between;align-items:flex-end;
        padding:12px 16px 20px;z-index:200;pointer-events:none;
        box-sizing:border-box;
    `;

    // Groupe gauche : accél + frein
    pad.innerHTML = `
        <div style="display:flex;flex-direction:column;gap:10px;pointer-events:all;">
            <button id="tc-up"   data-key="ArrowUp"    style="${touchBtnStyle('#22c55e')}">▲</button>
            <button id="tc-down" data-key="ArrowDown"  style="${touchBtnStyle('#ef4444')}">▼</button>
        </div>
        <div style="display:flex;flex-direction:column;align-items:center;gap:10px;pointer-events:all;">
            <button id="tc-item" data-key="Space" style="${touchBtnStyle('#f59e0b','56px')}">🎁</button>
        </div>
        <div style="display:flex;flex-direction:column;gap:10px;pointer-events:all;">
            <button id="tc-left"  data-key="ArrowLeft"  style="${touchBtnStyle('#3b82f6')}">◀</button>
            <button id="tc-right" data-key="ArrowRight" style="${touchBtnStyle('#3b82f6')}">▶</button>
        </div>
    `;

    container.appendChild(pad);
    _touchControls = pad;

    pad.querySelectorAll('button[data-key]').forEach(btn => {
        const key = btn.getAttribute('data-key');
        btn.addEventListener('touchstart', e => {
            e.preventDefault();
            if (key === 'Space' && gameState.playerRacer) {
                gameState.playerRacer.useItem();
            } else {
                keys[key] = true;
            }
        }, { passive: false });
        btn.addEventListener('touchend',   e => { e.preventDefault(); keys[key] = false; }, { passive: false });
        btn.addEventListener('touchcancel',e => { e.preventDefault(); keys[key] = false; }, { passive: false });
    });
}

function touchBtnStyle(color, size = '52px') {
    return `
        width:${size};height:${size};border-radius:50%;border:2px solid ${color};
        background:rgba(0,0,0,.5);color:#fff;font-size:1.2em;
        display:flex;align-items:center;justify-content:center;
        -webkit-tap-highlight-color:transparent;touch-action:manipulation;
    `;
}

function removeMobileControls() {
    if (_touchControls) { _touchControls.remove(); _touchControls = null; }
}

// ==========================================
// GAME LOOP
// ==========================================

let lastTime = 0;

function gameLoop(time) {
    const dt = Math.min((time - lastTime) / 1000, 1 / 25);
    lastTime = time;

    if (gameState.screen === 'game-screen') {
        update(dt);
        render();
    }

    requestAnimationFrame(gameLoop);
}

// ==========================================
// UTILITAIRES
// ==========================================

function getSortedRacers() {
    return [...gameState.allRacers].sort((a, b) =>
        (b.lap * 1_000_000 + b.position) - (a.lap * 1_000_000 + a.position)
    );
}

function calculatePosition(racer) {
    return getSortedRacers().indexOf(racer) + 1;
}

function getPositionSuffix(pos) {
    return pos === 1 ? 'er' : 'ème';
}

function formatTime(ms) {
    if (!isFinite(ms) || ms < 0) return '--:--.--';
    const m  = Math.floor(ms / 60000);
    const s  = Math.floor((ms % 60000) / 1000);
    const cs = Math.floor((ms % 1000) / 10);
    return `${m}:${s.toString().padStart(2, '0')}.${cs.toString().padStart(2, '0')}`;
}

function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

// ==========================================
// INITIALISATION
// ==========================================

requestAnimationFrame(gameLoop);

// Exports globaux pour les onclick HTML
window.showScreen   = showScreen;
window.restartRace  = restartRace;
window.togglePause  = togglePause;