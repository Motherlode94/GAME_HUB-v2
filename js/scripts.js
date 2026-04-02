document.addEventListener('DOMContentLoaded', function () {

// ── Game Data ──────────────────────────────────────────────────────────────
const GAMES = (window.WGC_DATA && Array.isArray(window.WGC_DATA.GAMES))
    ? window.WGC_DATA.GAMES
    : [];

// ── Storage helpers ────────────────────────────────────────────────────────
function getScores(gameId)          { return window.WGC_DATA?.getScores(gameId)    ?? []; }
function saveScores(gameId, scores) { window.WGC_DATA?.saveScores(gameId, scores); }
function addScore(gameId, entry)    { return window.WGC_DATA?.addScore(gameId, entry); }
function getComments(gameId)        { return window.WGC_DATA?.getComments(gameId)  ?? []; }
function saveComments(gameId, c)    { window.WGC_DATA?.saveComments(gameId, c); }

// ── Identite joueur auto-generee ───────────────────────────────────────────
// Cree une seule fois, stockee en localStorage, jamais demandee au joueur.
function getOrCreatePlayerId() {
    let pid = localStorage.getItem('wgc_pid');
    if (!pid) {
        pid = 'J-' + Math.random().toString(36).slice(2, 6).toUpperCase();
        localStorage.setItem('wgc_pid', pid);
    }
    return pid;
}
const PLAYER_ID = getOrCreatePlayerId();

// ── Debounce helper ────────────────────────────────────────────────────────
function debounce(fn, delay = 300) {
    let timer;
    return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), delay); };
}

// ── State ──────────────────────────────────────────────────────────────────
let activeCategory = 'all';
let searchQuery    = '';
let sortMode       = 'default';
let currentGameId  = null;
let lastPlayedGame = null;

// Favoris
function getFavorites() {
    try { return JSON.parse(localStorage.getItem('wgc_favorites') || '[]'); } catch { return []; }
}
function toggleFavorite(gameId) {
    const favs = getFavorites();
    const idx  = favs.indexOf(gameId);
    if (idx === -1) favs.push(gameId); else favs.splice(idx, 1);
    localStorage.setItem('wgc_favorites', JSON.stringify(favs));
    return idx === -1;
}
function isFavorite(gameId) { return getFavorites().includes(gameId); }

// ── DOM refs ───────────────────────────────────────────────────────────────
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

// Panel post-game (avis optionnel uniquement)
const postgamePanel = document.getElementById('postgame-panel');
const postgameTitle = document.getElementById('postgame-game-title');
const pgStars       = document.querySelectorAll('.pg-star');
const pgCommentText = document.getElementById('pg-comment-text');
const pgSubmitBtn   = document.getElementById('pg-submit-btn');
const pgSkipBtn     = document.getElementById('pg-skip-btn');

// Banner session
const sessionBanner      = document.getElementById('session-banner');
const sessionBannerTitle = document.getElementById('session-banner-title');
const sessionFinishBtn   = document.getElementById('session-finish-btn');
const sessionCancelBtn   = document.getElementById('session-cancel-btn');

// ── Toast notification ─────────────────────────────────────────────────────
const scoreToast = (function () {
    const el = document.createElement('div');
    el.id = 'score-toast';
    el.style.cssText = [
        'position:fixed', 'bottom:2rem', 'left:50%',
        'transform:translateX(-50%) translateY(2rem)',
        'background:#16213e', 'color:#e0e0e0', 'border:1px solid #e63946',
        'padding:.75rem 1.5rem', 'border-radius:8px', 'font-size:.95rem',
        'opacity:0', 'transition:opacity .3s,transform .3s', 'z-index:9999',
        'pointer-events:none', 'white-space:nowrap'
    ].join(';');
    document.body.appendChild(el);
    return el;
}());

let toastTimer = null;
function showToast(msg, ms = 3000) {
    scoreToast.textContent = msg;
    scoreToast.style.opacity = '1';
    scoreToast.style.transform = 'translateX(-50%) translateY(0)';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
        scoreToast.style.opacity = '0';
        scoreToast.style.transform = 'translateX(-50%) translateY(2rem)';
    }, ms);
}

// ── Grid ───────────────────────────────────────────────────────────────────
function getFiltered() {
    let list = [...GAMES];
    if (activeCategory === 'favorites') {
        const favs = getFavorites();
        list = list.filter(g => favs.includes(g.id));
    } else if (activeCategory !== 'all') {
        list = list.filter(g => g.category === activeCategory);
    }
    if (searchQuery) {
        const q = searchQuery.toLowerCase();
        list = list.filter(g =>
            g.title.toLowerCase().includes(q) ||
            (g.description ?? '').toLowerCase().includes(q) ||
            g.tags.some(t => t.toLowerCase().includes(q))
        );
    }
    switch (sortMode) {
        case 'az':     list.sort((a, b) => a.title.localeCompare(b.title)); break;
        case 'za':     list.sort((a, b) => b.title.localeCompare(a.title)); break;
        case 'rating': list.sort((a, b) => b.rating - a.rating);           break;
        case 'year':   list.sort((a, b) => b.year - a.year);               break;
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
        <div class="game-card${game.playUrl ? ' game-card--playable' : ''}" data-id="${game.id}" style="animation-delay:${i * 0.05}s">
            <button class="card-fav-btn${isFavorite(game.id) ? ' active' : ''}" data-fav-id="${game.id}" title="Ajouter aux favoris">&#10084;</button>
            ${game.coverImage ? `<div class="card-media"><img src="${escapeAttr(game.coverImage)}" alt="${escapeAttr(game.title)} cover" loading="lazy"></div>` : ''}
            <div class="card-content">
                <div class="card-header">
                    <span class="card-category">${game.category}</span>
                    <span class="card-rating">${(game.rating ?? 0).toFixed(1)}</span>
                </div>
                <h3>${escapeHtml(game.title)}</h3>
                <p>${escapeHtml(game.description ?? '')}</p>
                <div class="card-footer">
                    <span class="card-year">${game.year}</span>
                    ${game.playUrl ? `<span class="card-play">&#9654; Play</span>` : `<span class="card-more">Details &rarr;</span>`}
                </div>
            </div>
        </div>
    `).join('');

    grid.querySelectorAll('.game-card').forEach(card => {
        card.addEventListener('click', () => openModal(parseInt(card.dataset.id, 10)));
    });
    grid.querySelectorAll('.card-fav-btn').forEach(btn => {
        btn.addEventListener('click', e => {
            e.stopPropagation();
            const id    = parseInt(btn.dataset.favId, 10);
            const added = toggleFavorite(id);
            btn.classList.toggle('active', added);
            if (activeCategory === 'favorites') renderGrid();
        });
    });
}

// ── Modal info ─────────────────────────────────────────────────────────────
function openModal(id) {
    const game = GAMES.find(g => g.id === id);
    if (!game) return;
    currentGameId = id;

    document.getElementById('modal-badge').textContent = game.category.toUpperCase();
    document.getElementById('modal-title').textContent = game.title;
    document.getElementById('modal-desc').textContent  = game.description ?? '';
    document.getElementById('modal-meta').innerHTML = `
        <span><span class="star">★</span> ${(game.rating ?? 0).toFixed(1)} / 10</span>
        <span>📅 ${game.year}</span>
        <span>🎮 ${capitalize(game.category)}</span>
    `;
    document.getElementById('modal-tags').innerHTML =
        game.tags.map(t => `<span class="modal-tag">${escapeHtml(t)}</span>`).join('');

    const playBtn = document.getElementById('modal-play-btn');
    if (game.playUrl) {
        playBtn.classList.remove('hidden');
        playBtn.onclick = () => { closeModal(); launchGame(game); };
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

// ── Tabs ───────────────────────────────────────────────────────────────────
document.querySelectorAll('.modal-tab').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
});
function switchTab(tab) {
    document.querySelectorAll('.modal-tab').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
    document.querySelectorAll('.modal-tab-content').forEach(c => c.classList.remove('active'));
    document.getElementById(`tab-${tab}`).classList.add('active');
}

// ── Leaderboard ────────────────────────────────────────────────────────────
function renderLeaderboard(gameId) {
    const scores = getScores(gameId).sort((a, b) => b.score - a.score);
    const list   = document.getElementById('leaderboard-list');
    if (!scores.length) {
        list.innerHTML = `<p class="lb-empty">Aucun score pour l'instant. Sois le premier !</p>`;
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

// ── Changelog ─────────────────────────────────────────────────────────────
function renderChangelog(game) {
    const container = document.getElementById('changelog-list');
    if (!game.changelog?.length) {
        container.innerHTML = `<p class="lb-empty">Aucune note de patch pour l'instant.</p>`;
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

// ── Comments ───────────────────────────────────────────────────────────────
function renderComments(gameId) {
    const comments  = getComments(gameId);
    const container = document.getElementById('comments-list');
    if (!comments.length) {
        container.innerHTML = `<p class="lb-empty">Aucun avis pour l'instant. Joue et laisse le tien !</p>`;
        return;
    }
    container.innerHTML = comments
        .sort((a, b) => new Date(b.ts) - new Date(a.ts))
        .map(c => `
            <div class="comment-card">
                <div class="comment-header">
                    <span class="comment-name">${escapeHtml(c.name)}</span>
                    <span class="comment-stars">${'★'.repeat(c.stars)}${'☆'.repeat(5 - c.stars)}</span>
                    <span class="comment-date">${c.date}</span>
                </div>
                ${c.score ? `<span class="comment-score">Score: ${Number(c.score).toLocaleString()}</span>` : ''}
                <p class="comment-text">${escapeHtml(c.text)}</p>
            </div>
        `).join('');
}

// ── Game launch — nouvelle page ────────────────────────────────────────────
function launchGame(game) {
    lastPlayedGame = game;
    sessionStorage.setItem('wgc_activeGameId', String(game.id));
    window.open(new URL(game.playUrl, window.location.href).toString(), '_blank');
    syncSessionBanner();
}

function clearActiveSession() {
    sessionStorage.removeItem('wgc_activeGameId');
}

// ── Score AUTO-SAUVEGARDE — zéro interaction requise ──────────────────────
// Le jeu envoie : window.opener.postMessage({ type:'gameScore', score:1234 }, '*')
window.addEventListener('message', e => {
    if (e.origin !== location.origin) return;
    if (e.data?.type !== 'gameScore') return;

    const score = parseInt(e.data.score);
    if (!score || score <= 0) return;

    const game = GAMES.find(g => g.id === Number(e.data.gameId)) || lastPlayedGame;
    if (!game) return;

    lastPlayedGame = game;

    // Sauvegarde immediate — aucune action requise du joueur
    addScore(game.id, {
        name:  PLAYER_ID,
        score,
        date:  new Date().toLocaleDateString('fr-FR')
    });

    showToast(`✓ Score ${score.toLocaleString()} enregistre — ${game.title}`);

    // Propose un avis optionnel (panel leger, tout skippable en un clic)
    if (postgamePanel?.classList.contains('hidden')) {
        showReviewPanel(game);
    }
});

// ── Panel avis optionnel ───────────────────────────────────────────────────
let selectedStars = 0;

function showReviewPanel(game) {
    if (!postgamePanel) return;
    postgameTitle.textContent = game.title;
    selectedStars = 0;
    pgStars.forEach(s => s.classList.remove('active', 'hover'));
    if (pgCommentText) pgCommentText.value = '';

    // Masquer les champs nom/score du HTML (non utilises dans ce systeme)
    ['pg-score-name', 'pg-score-value'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });

    postgamePanel.classList.remove('hidden');
    postgamePanel.classList.add('open');
    document.body.style.overflow = 'hidden';
    syncSessionBanner();
}

function closeReviewPanel() {
    if (!postgamePanel) return;
    postgamePanel.classList.remove('open');
    postgamePanel.classList.add('hidden');
    document.body.style.overflow = '';
    clearActiveSession();
    lastPlayedGame = null;
    syncSessionBanner();
}

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

if (pgSubmitBtn) {
    pgSubmitBtn.addEventListener('click', () => {
        if (!lastPlayedGame) { closeReviewPanel(); return; }

        const text  = pgCommentText?.value.trim() ?? '';
        const stars = selectedStars || 3;

        if (text || selectedStars > 0) {
            const comments = getComments(lastPlayedGame.id);
            comments.push({
                name:  PLAYER_ID,
                stars,
                score: null,
                text,
                date:  new Date().toLocaleDateString('fr-FR'),
                ts:    new Date().toISOString()
            });
            saveComments(lastPlayedGame.id, comments);
            showToast('✓ Avis publie !');
        }

        const gid = lastPlayedGame.id;
        closeReviewPanel();
        openModal(gid);
        switchTab('comments');
    });
}

if (pgSkipBtn) pgSkipBtn.addEventListener('click', closeReviewPanel);

// ── Session banner ─────────────────────────────────────────────────────────
function syncSessionBanner() {
    if (!sessionBanner) return;
    if (!lastPlayedGame || !postgamePanel?.classList.contains('hidden')) {
        sessionBanner.classList.add('hidden');
        return;
    }
    sessionBannerTitle.textContent = lastPlayedGame.title;
    sessionBanner.classList.remove('hidden');
}

if (sessionFinishBtn) {
    sessionFinishBtn.addEventListener('click', () => {
        if (lastPlayedGame) showReviewPanel(lastPlayedGame);
    });
}
if (sessionCancelBtn) {
    sessionCancelBtn.addEventListener('click', () => {
        clearActiveSession();
        lastPlayedGame = null;
        syncSessionBanner();
    });
}

// ── Events ─────────────────────────────────────────────────────────────────
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
document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (postgamePanel && !postgamePanel.classList.contains('hidden')) closeReviewPanel();
    else closeModal();
});

window.addEventListener('focus', syncSessionBanner);

// ── Helpers ────────────────────────────────────────────────────────────────
function capitalize(str) { return str.charAt(0).toUpperCase() + str.slice(1); }
function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
        .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
function escapeAttr(str) { return escapeHtml(str); }

// ── Init ───────────────────────────────────────────────────────────────────
const activeGameId = Number(sessionStorage.getItem('wgc_activeGameId'));
if (activeGameId) {
    lastPlayedGame = GAMES.find(g => g.id === activeGameId) || null;
}
syncSessionBanner();
renderGrid();

}); // end DOMContentLoaded