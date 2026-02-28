
document.addEventListener('DOMContentLoaded', function() {
// ── Game Data ─────────────────────────────────
const GAMES = [
    {
        id: 1,
        title: "Combat Arena",
        category: "action",
        year: 2026,
        rating: 9.4,
        description: "A fast-paced 2-player local fighting game. Double jump, dash, and unleash charged attacks to defeat your opponent.",
        tags: ["fighting", "2-player", "local", "indie"],
        playUrl: "DONE/_2D Fight Kombat/index.html",
        changelog: [
            { version: "1.2.0", date: "2026-03-10", notes: ["Added new arena: Lava Pit", "Fixed dash cancel bug", "Improved hitbox precision"] },
            { version: "1.1.0", date: "2026-02-01", notes: ["Added character skins", "Rebalanced damage values"] },
            { version: "1.0.0", date: "2026-01-15", notes: ["Initial release"] }
        ]
    },
    {
        id: 2,
        title: "2D Basket Sim",
        category: "sports",
        year: 2026,
        rating: 8.9,
        description: "An arcade basketball challenge with classic, precision, and survival modes built around speed, shot timing, and score combos.",
        tags: ["basketball", "arcade", "sports", "score attack", "combo"],
        playUrl: "DONE/_2D Basket Sim/index.html",
        changelog: [
            { version: "1.0.0", date: "2026-02-28", notes: ["Initial release"] }
        ]
    },
    {
        id: 3,
        title: "Broken Array",
        category: "strategy",
        year: 2026,
        rating: 8.6,
        description: "A minimalist tactical RTS where you build a base, manage resources, train squads, and survive escalating attack waves.",
        tags: ["strategy", "rts", "base building", "survival", "waves"],
        playUrl: "DONE/_2D Broken Array/index.html",
        changelog: [
            { version: "1.0.0", date: "2026-02-28", notes: ["Initial release"] }
        ]
    },
    {
        id: 4,
        title: "Tactical War",
        category: "strategy",
        year: 2026,
        rating: 8.8,
        description: "A World War II real-time strategy game focused on squad control, map pressure, and tactical battlefield positioning.",
        tags: ["strategy", "rts", "wwii", "squads", "tactics"],
        playUrl: "DONE/_2D Comapagny of Hero/index.html",
        changelog: [
            { version: "0.1.0", date: "2026-02-28", notes: ["Initial playable build"] }
        ]
    },
    {
        id: 5,
        title: "Dungeon Crawler 2D",
        category: "rpg",
        year: 2026,
        rating: 9.0,
        description: "Explore a procedural dungeon, fight enemies in turn-based battles, loot rooms, and level up through endless runs.",
        tags: ["rpg", "dungeon", "turn-based", "loot", "procedural"],
        playUrl: "DONE/_2D Dungeon Crawler/index.html",
        changelog: [
            { version: "1.0.0", date: "2026-02-28", notes: ["Initial release"] }
        ]
    },
    {
        id: 6,
        title: "FreeForce 2D",
        category: "action",
        year: 2026,
        rating: 8.7,
        description: "A side-scrolling action shooter with multiple weapons, enemy types, bosses, power-ups, and score chasing.",
        tags: ["action", "shooter", "bosses", "weapons", "arcade"],
        playUrl: "DONE/_2D FreeForce/index.html",
        changelog: [
            { version: "1.0.0", date: "2026-02-28", notes: ["Initial release"] }
        ]
    },
    {
        id: 7,
        title: "HARDWOOD",
        category: "sports",
        year: 2026,
        rating: 8.8,
        description: "A basketball management game where you build your franchise, set up your team, and guide a season from the front office.",
        tags: ["sports", "manager", "basketball", "team building", "simulation"],
        playUrl: "DONE/_2D HardWood/index.html",
        changelog: [
            { version: "1.0.0", date: "2026-02-28", notes: ["Initial release"] }
        ]
    },
    {
        id: 8,
        title: "NFL Mini Run",
        category: "sports",
        year: 2026,
        rating: 8.8,
        description: "Sprint through defenders, chain touchdowns, grab power-ups, and survive longer each round in this arcade football run game.",
        tags: ["sports", "arcade", "football", "mobile", "score attack"],
        playUrl: "DONE/_2D NFL Sim/index.html",
        changelog: [
            { version: "0.2.0", date: "2026-02-28", notes: ["Added mobile joystick controls", "Added combos, formations, and power-ups"] },
            { version: "0.1.0", date: "2026-02-28", notes: ["Initial playable prototype"] }
        ]
    }
];


// ── Storage helpers ────────────────────────────
function getScores(gameId) {
    try { return JSON.parse(localStorage.getItem(`wgc_scores_${gameId}`)) || []; }
    catch { return []; }
}
function saveScores(gameId, scores) {
    localStorage.setItem(`wgc_scores_${gameId}`, JSON.stringify(scores));
}
function getComments(gameId) {
    try { return JSON.parse(localStorage.getItem(`wgc_comments_${gameId}`)) || []; }
    catch { return []; }
}
function saveComments(gameId, comments) {
    localStorage.setItem(`wgc_comments_${gameId}`, JSON.stringify(comments));
}

// ── Debounce helper ────────────────────────────
function debounce(fn, delay = 300) {
    let timer;
    return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), delay); };
}

// ── State ──────────────────────────────────────
let activeCategory = 'all';
let searchQuery    = '';
let sortMode       = 'default';
let currentGameId  = null;

// Pseudo persistant par session (demandé une seule fois avant le 1er jeu)
let playerName = sessionStorage.getItem('wgc_playerName') || '';

// ── DOM ────────────────────────────────────────
const grid        = document.getElementById('games-grid');
const noResults   = document.getElementById('no-results');
const resultsInfo = document.getElementById('results-info');
const gameCount   = document.getElementById('game-count');
const searchInput = document.getElementById('search-input');
const clearBtn    = document.getElementById('clear-search');
const sortSelect  = document.getElementById('sort-select');
const chips       = document.querySelectorAll('.chip');

const modalOverlay = document.getElementById('modal-overlay');
const modalClose   = document.getElementById('modal-close');

const modalGameOverlay = document.getElementById('modal-game-overlay');
const modalGameClose   = document.getElementById('modal-game-close');
const modalGameTitle   = document.getElementById('modal-game-title');
const gameIframe       = document.getElementById('game-iframe');

// Post-game panel
const postgamePanel  = document.getElementById('postgame-panel');
const postgameTitle  = document.getElementById('postgame-game-title');
const pgScoreName    = document.getElementById('pg-score-name');
const pgScoreValue   = document.getElementById('pg-score-value');
const pgStars        = document.querySelectorAll('.pg-star');
const pgCommentText  = document.getElementById('pg-comment-text');
const pgSubmitBtn    = document.getElementById('pg-submit-btn');
const pgSkipBtn      = document.getElementById('pg-skip-btn');

// ── Grid ───────────────────────────────────────
function getFiltered() {
    let list = [...GAMES];
    if (activeCategory !== 'all') list = list.filter(g => g.category === activeCategory);
    if (searchQuery) {
        const q = searchQuery.toLowerCase();
        list = list.filter(g =>
            g.title.toLowerCase().includes(q) ||
            g.description.toLowerCase().includes(q) ||
            g.tags.some(t => t.toLowerCase().includes(q))
        );
    }
    switch (sortMode) {
        case 'az':     list.sort((a, b) => a.title.localeCompare(b.title)); break;
        case 'za':     list.sort((a, b) => b.title.localeCompare(a.title)); break;
        case 'rating': list.sort((a, b) => b.rating - a.rating);            break;
        case 'year':   list.sort((a, b) => b.year - a.year);                break;
    }
    return list;
}

function renderGrid() {
    const filtered = getFiltered();
    gameCount.textContent = GAMES.length;
    if (filtered.length === 0) {
        grid.innerHTML = '';
        noResults.classList.remove('hidden');
        resultsInfo.innerHTML = '';
        return;
    }
    noResults.classList.add('hidden');
    resultsInfo.innerHTML = `Showing <strong>${filtered.length}</strong> of <strong>${GAMES.length}</strong> games`;
    grid.innerHTML = filtered.map((game, i) => `
        <div class="game-card${game.playUrl ? ' game-card--playable' : ''}" data-id="${game.id}" style="animation-delay:${i*0.05}s">
            <div class="card-header">
                <span class="card-category">${game.category}</span>
                <span class="card-rating">${game.rating.toFixed(1)}</span>
            </div>
            <h3>${game.title}</h3>
            <p>${game.description}</p>
            <div class="card-footer">
                <span class="card-year">${game.year}</span>
                ${game.playUrl ? `<span class="card-play">&#9654; Play</span>` : `<span class="card-more">Details &rarr;</span>`}
            </div>
        </div>
    `).join('');
    grid.querySelectorAll('.game-card').forEach(card => {
        card.addEventListener('click', () => openModal(parseInt(card.dataset.id)));
    });
}

// ── Modal info ─────────────────────────────────
function openModal(id) {
    const game = GAMES.find(g => g.id === id);
    if (!game) return;
    currentGameId = id;

    document.getElementById('modal-badge').textContent = game.category.toUpperCase();
    document.getElementById('modal-title').textContent = game.title;
    document.getElementById('modal-desc').textContent  = game.description;
    document.getElementById('modal-meta').innerHTML = `
        <span><span class="star">★</span> ${game.rating.toFixed(1)} / 10</span>
        <span>📅 ${game.year}</span>
        <span>🎮 ${capitalize(game.category)}</span>
    `;
    document.getElementById('modal-tags').innerHTML = game.tags.map(t => `<span class="modal-tag">${t}</span>`).join('');

    const playBtn = document.getElementById('modal-play-btn');
    if (game.playUrl) {
        playBtn.classList.remove('hidden');
        playBtn.onclick = () => { closeModal(); openGame(game); };
    } else {
        playBtn.classList.add('hidden');
        playBtn.onclick = null;
    }

    switchTab('scores');
    renderLeaderboard(id);
    renderChangelog(game);
    renderComments(id);

    modalOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    modalOverlay.classList.remove('open');
    document.body.style.overflow = '';
    currentGameId = null;
}

// ── Tabs ───────────────────────────────────────
document.querySelectorAll('.modal-tab').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
});

function switchTab(tab) {
    document.querySelectorAll('.modal-tab').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
    document.querySelectorAll('.modal-tab-content').forEach(c => c.classList.remove('active'));
    document.getElementById(`tab-${tab}`).classList.add('active');
}

// ── Leaderboard ────────────────────────────────
function renderLeaderboard(gameId) {
    const scores = getScores(gameId).sort((a, b) => b.score - a.score);
    const list   = document.getElementById('leaderboard-list');
    if (scores.length === 0) {
        list.innerHTML = `<p class="lb-empty">No scores yet. Be the first!</p>`;
        return;
    }
    list.innerHTML = scores.map((e, i) => `
        <div class="lb-row ${i===0?'lb-gold':i===1?'lb-silver':i===2?'lb-bronze':''}">
            <span class="lb-rank">${i===0?'🥇':i===1?'🥈':i===2?'🥉':'#'+(i+1)}</span>
            <span class="lb-name">${escapeHtml(e.name)}</span>
            <span class="lb-score">${Number(e.score).toLocaleString()}</span>
            <span class="lb-date">${e.date}</span>
        </div>
    `).join('');
}

// Score submission removed — scores are submitted via the post-game panel after playing

// ── Changelog ─────────────────────────────────
function renderChangelog(game) {
    const container = document.getElementById('changelog-list');
    if (!game.changelog || !game.changelog.length) {
        container.innerHTML = `<p class="lb-empty">No patch notes yet.</p>`;
        return;
    }
    container.innerHTML = game.changelog.map((e, i) => `
        <div class="cl-entry ${i===0?'cl-latest':''}">
            <div class="cl-header">
                <span class="cl-version">v${e.version}</span>
                ${i===0?'<span class="cl-badge">LATEST</span>':''}
                <span class="cl-date">${e.date}</span>
            </div>
            <ul class="cl-notes">${e.notes.map(n=>`<li>${n}</li>`).join('')}</ul>
        </div>
    `).join('');
}

// ── Comments ───────────────────────────────────
function renderComments(gameId) {
    const comments = getComments(gameId);
    const container = document.getElementById('comments-list');
    if (!comments.length) {
        container.innerHTML = `<p class="lb-empty">No reviews yet. Play the game and share your thoughts!</p>`;
        return;
    }
    container.innerHTML = comments
        .sort((a, b) => new Date(b.ts) - new Date(a.ts))
        .map(c => `
            <div class="comment-card">
                <div class="comment-header">
                    <span class="comment-name">${escapeHtml(c.name)}</span>
                    <span class="comment-stars">${'★'.repeat(c.stars)}${'☆'.repeat(5-c.stars)}</span>
                    <span class="comment-date">${c.date}</span>
                </div>
                ${c.score ? `<span class="comment-score">Score: ${Number(c.score).toLocaleString()}</span>` : ''}
                <p class="comment-text">${escapeHtml(c.text)}</p>
            </div>
        `).join('');
}

// ── Game launch ───────────────────────────────
let lastPlayedGame = null;

function launchGameInNewTab(game) {
    const url = new URL(game.playUrl, window.location.href).toString();
    const opened = window.open(url, '_blank');
    if (!opened) window.location.href = url;
}

function openGame(game) {
    // Ask for pseudo once per session if not already set
    if (!playerName) {
        const input = prompt('Entre ton pseudo avant de jouer (sera utilisé pour ton score) :');
        if (!input || !input.trim()) return; // cancelled → don't launch
        playerName = input.trim().slice(0, 20);
        sessionStorage.setItem('wgc_playerName', playerName);
    }

    lastPlayedGame = game;

    // Avoid iframe usage because deployed environments report CSP frame-src warnings.
    launchGameInNewTab(game);
}

function closeGame() {
    modalGameOverlay.classList.remove('open');
    modalGameOverlay.classList.add('hidden');
    gameIframe.src = '';
    document.body.style.overflow = '';

    // Show post-game panel
    if (lastPlayedGame) {
        showPostGame(lastPlayedGame);
    }
}

// ── Post-game panel ────────────────────────────
let selectedStars = 0;

function showPostGame(game) {
    postgameTitle.textContent = game.title;
    selectedStars = 0;
    pgStars.forEach(s => s.classList.remove('active'));
    pgScoreName.value    = playerName; // pre-fill with session pseudo
    pgScoreValue.value   = '';
    pgScoreValue.disabled = false;
    pgScoreValue.placeholder = 'Ton score (optionnel)';
    delete pgScoreValue.dataset.fromGame;
    pgCommentText.value  = '';

    postgamePanel.classList.remove('hidden');
    postgamePanel.classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closePostGame() {
    postgamePanel.classList.remove('open');
    postgamePanel.classList.add('hidden');
    document.body.style.overflow = '';
    lastPlayedGame = null;
}



// Star rating
pgStars.forEach(star => {
    star.addEventListener('mouseover', () => {
        const val = parseInt(star.dataset.val);
        pgStars.forEach(s => s.classList.toggle('hover', parseInt(s.dataset.val) <= val));
    });
    star.addEventListener('mouseleave', () => {
        pgStars.forEach(s => s.classList.remove('hover'));
    });
    star.addEventListener('click', () => {
        selectedStars = parseInt(star.dataset.val);
        pgStars.forEach(s => s.classList.toggle('active', parseInt(s.dataset.val) <= selectedStars));
    });
});

pgSubmitBtn.addEventListener('click', () => {
    if (!lastPlayedGame) return;

    const name = pgScoreName.value.trim();
    if (!name) { flashInput(pgScoreName, 'Entre ton pseudo !'); return; }

    // Update session pseudo if changed
    if (name !== playerName) {
        playerName = name;
        sessionStorage.setItem('wgc_playerName', playerName);
    }

    // Score: auto (from game via postMessage) or manual, always optional
    const scoreRaw = pgScoreValue.value.trim();
    const score    = scoreRaw !== '' ? parseInt(scoreRaw) : null;
    const scoreValid = score !== null && !isNaN(score) && score >= 0;

    const text = pgCommentText.value.trim();
    if (!scoreValid && !text) {
        flashInput(pgCommentText, 'Ajoute un avis ou un score...');
        return;
    }

    const gid = lastPlayedGame.id;

    if (scoreValid) {
        const scores = getScores(gid);
        scores.push({ name, score, date: new Date().toLocaleDateString('fr-FR') });
        scores.sort((a,b) => b.score - a.score);
        if (scores.length > 20) scores.length = 20;
        saveScores(gid, scores);
    }

    if (text) {
        const comments = getComments(gid);
        comments.push({
            name,
            stars: selectedStars || 3,
            score: scoreValid ? score : null,
            text,
            date: new Date().toLocaleDateString('fr-FR'),
            ts: new Date().toISOString()
        });
        saveComments(gid, comments);
    }

    closePostGame();
    openModal(gid);
    switchTab(text ? 'comments' : 'scores');
});

pgSkipBtn.addEventListener('click', closePostGame);

// ── Events ─────────────────────────────────────
searchInput.addEventListener('input', debounce(() => {
    searchQuery = searchInput.value.trim();
    clearBtn.classList.toggle('visible', searchQuery.length > 0);
    renderGrid();
}));
clearBtn.addEventListener('click', () => {
    searchInput.value = ''; searchQuery = '';
    clearBtn.classList.remove('visible');
    searchInput.focus(); renderGrid();
});
sortSelect.addEventListener('change', () => { sortMode = sortSelect.value; renderGrid(); });
chips.forEach(chip => {
    chip.addEventListener('click', () => {
        chips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        activeCategory = chip.dataset.cat;
        renderGrid();
    });
});
modalClose.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', e => { if (e.target === modalOverlay) closeModal(); });
modalGameClose.addEventListener('click', closeGame);
modalGameOverlay.addEventListener('click', e => { if (e.target === modalGameOverlay) closeGame(); });
document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (!postgamePanel.classList.contains('hidden')) closePostGame();
    else if (modalGameOverlay.classList.contains('open')) closeGame();
    else closeModal();
});

// ── Helpers ────────────────────────────────────
function capitalize(str) { return str.charAt(0).toUpperCase() + str.slice(1); }
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function flashInput(input, msg) {
    input.style.borderColor = '#e63946';
    const prev = input.placeholder;
    input.placeholder = msg;
    setTimeout(() => { input.style.borderColor=''; input.placeholder=prev; }, 2000);
}

// ── Auto-score from game via postMessage ───────
// Games can send: parent.postMessage({ type: 'gameScore', score: 1234 }, '*')
window.addEventListener('message', (e) => {
    if (e.origin !== location.origin) return;
    if (e.data?.type === 'gameScore') {
        const reportedGame = GAMES.find(game => game.id === Number(e.data.gameId)) || lastPlayedGame;
        if (!reportedGame) return;

        lastPlayedGame = reportedGame;
        if (postgamePanel.classList.contains('hidden')) {
            showPostGame(reportedGame);
        }

        pgScoreValue.value            = e.data.score;
        pgScoreValue.disabled         = true;
        pgScoreValue.placeholder      = 'Score reçu du jeu';
        pgScoreValue.dataset.fromGame = 'true';
    }
});

renderGrid();
}); // end DOMContentLoaded
