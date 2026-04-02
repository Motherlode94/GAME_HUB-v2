
document.addEventListener('DOMContentLoaded', function() {
// ── Game Data ─────────────────────────────────
const GAMES = [
    {
        id: 1,
        title: "Artiste Manager",
        category: "action",
        year: 2026,
            tags: ["", "", "", ""],
            playUrl: "DONE/_2D Artiste Manager/index.html",
            description: " ",
            rating:  7.5,

            ///////// Metadata for display and management
            //changelog: [
            //    { version: "", date: "", notes: ["", "", ""] },
            //]
            //coverImage: "path/to/image.png",
            //strategyType: "",
        },
        {
            id: 2,
            title: "War Zone Commander",
            category: "strategy",
            year: 2026,
            tags: ["", "", "", ""],
            playUrl: "DONE/_2D War Zone Commander/index.html",
            description: " ",
            rating:  7.5,

            ///////// Metadata for display and management
            //changelog: [
            //    { version: "", date: "", notes: ["", "", ""] },
            //]
            //coverImage: "path/to/image.png",
            //strategyType: "",
        },
        {
            id: 3,
            title: "Football Manager",
            category: "sports",
            year: 2026,
            tags: ["", "", "", ""],
            playUrl: "DONE/_2D Football Manager/index.html",
            description: " ",
            rating:  7.5,

            ///////// Metadata for display and management
            //changelog: [
            //    { version: "", date: "", notes: ["", "", ""] },
            //]
            //coverImage: "path/to/image.png",
            //strategyType: "",
        }
];


// ── Storage helpers ────────────────────────────
if (window.WGC_DATA && Array.isArray(window.WGC_DATA.GAMES) && window.WGC_DATA.GAMES.length) {
    GAMES.splice(0, GAMES.length, ...window.WGC_DATA.GAMES);
}

function getScores(gameId) {
    if (window.WGC_DATA && typeof window.WGC_DATA.getScores === 'function') {
        return window.WGC_DATA.getScores(gameId);
    }
    try { return JSON.parse(localStorage.getItem(`wgc_scores_${gameId}`)) || []; }
    catch { return []; }
}
function saveScores(gameId, scores) {
    if (window.WGC_DATA && typeof window.WGC_DATA.saveScores === 'function') {
        window.WGC_DATA.saveScores(gameId, scores);
        return;
    }
    localStorage.setItem(`wgc_scores_${gameId}`, JSON.stringify(scores));
}
function addScore(gameId, entry) {
    if (window.WGC_DATA && typeof window.WGC_DATA.addScore === 'function') {
        return window.WGC_DATA.addScore(gameId, entry);
    }
    const scores = getScores(gameId);
    scores.push(entry);
    saveScores(gameId, scores);
    return getScores(gameId);
}
function getComments(gameId) {
    if (window.WGC_DATA && typeof window.WGC_DATA.getComments === 'function') {
        return window.WGC_DATA.getComments(gameId);
    }
    try { return JSON.parse(localStorage.getItem(`wgc_comments_${gameId}`)) || []; }
    catch { return []; }
}
function saveComments(gameId, comments) {
    if (window.WGC_DATA && typeof window.WGC_DATA.saveComments === 'function') {
        window.WGC_DATA.saveComments(gameId, comments);
        return;
    }
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

// Favoris (persistant dans localStorage)
function getFavorites() {
    try { return JSON.parse(localStorage.getItem('wgc_favorites') || '[]'); } catch { return []; }
}
function toggleFavorite(gameId) {
    const favs = getFavorites();
    const idx = favs.indexOf(gameId);
    if (idx === -1) favs.push(gameId); else favs.splice(idx, 1);
    localStorage.setItem('wgc_favorites', JSON.stringify(favs));
    return idx === -1; // true = ajouté
}
function isFavorite(gameId) { return getFavorites().includes(gameId); }

// ── DOM ────────────────────────────────────────
const grid        = document.getElementById('games-grid');
const noResults   = document.getElementById('no-results');
const resultsInfo = document.getElementById('results-info');
const strategyCompare = document.getElementById('strategy-compare');
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
const viewerEmpty      = document.getElementById('viewer-empty');
const viewerPopoutBtn  = document.getElementById('viewer-popout');

// Post-game panel
const postgamePanel  = document.getElementById('postgame-panel');
const postgameTitle  = document.getElementById('postgame-game-title');
const pgScoreName    = document.getElementById('pg-score-name');
const pgScoreValue   = document.getElementById('pg-score-value');
const pgStars        = document.querySelectorAll('.pg-star');
const pgCommentText  = document.getElementById('pg-comment-text');
const pgSubmitBtn    = document.getElementById('pg-submit-btn');
const pgSkipBtn      = document.getElementById('pg-skip-btn');
const sessionBanner      = document.getElementById('session-banner');
const sessionBannerTitle = document.getElementById('session-banner-title');
const sessionFinishBtn   = document.getElementById('session-finish-btn');
const sessionCancelBtn   = document.getElementById('session-cancel-btn');

// ── Grid ───────────────────────────────────────
const FOUR_X_AXES = [
    { key: 'explore', label: 'Explore', short: 'EXP' },
    { key: 'expand', label: 'Expand', short: 'XPD' },
    { key: 'exploit', label: 'Exploit', short: 'XPL' },
    { key: 'exterminate', label: 'Exterminate', short: 'XTR' }
];

function clampPercent(value) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return 0;
    return Math.max(0, Math.min(100, Math.round(numeric)));
}

function getFourXProfile(game) {
    if (!game || game.category !== 'strategy') return null;
    const source = game.fourX || {};
    return {
        explore: clampPercent(source.explore),
        expand: clampPercent(source.expand),
        exploit: clampPercent(source.exploit),
        exterminate: clampPercent(source.exterminate)
    };
}

function getFourXAverage(profile) {
    if (!profile) return 0;
    const total = FOUR_X_AXES.reduce((sum, axis) => sum + profile[axis.key], 0);
    return Math.round(total / FOUR_X_AXES.length);
}

function getStrongestAxis(profile) {
    if (!profile) return { key: '', label: '', value: 0 };
    let best = FOUR_X_AXES[0];
    for (let i = 1; i < FOUR_X_AXES.length; i++) {
        if (profile[FOUR_X_AXES[i].key] > profile[best.key]) {
            best = FOUR_X_AXES[i];
        }
    }
    return { key: best.key, label: best.label, value: profile[best.key] };
}

function renderFourXSummary(game) {
    const profile = getFourXProfile(game);
    if (!profile) return '';

    const strongest = getStrongestAxis(profile);
    const profileType = game.strategyType || 'Strategy 4X';

    return `
        <div class="card-4x">
            <div class="card-4x-header">
                <span class="card-4x-badge">4X</span>
                <span class="card-4x-type">${escapeHtml(profileType)}</span>
            </div>
            <div class="card-4x-meta">
                <span>Dominant: ${escapeHtml(strongest.label)} ${strongest.value}</span>
                <span>4X Avg: ${getFourXAverage(profile)}</span>
            </div>
            <div class="card-4x-mini">
                ${FOUR_X_AXES.map(axis => `<span>${axis.short}<em>${profile[axis.key]}</em></span>`).join('')}
            </div>
        </div>
    `;
}

function renderStrategyCompare(filteredGames) {
    if (!strategyCompare) return;

    const strategyGames = filteredGames.filter(game => game.category === 'strategy');
    if (!strategyGames.length) {
        strategyCompare.innerHTML = '';
        strategyCompare.classList.add('hidden');
        return;
    }

    const ranked = strategyGames
        .map((game) => {
            const profile = getFourXProfile(game);
            return {
                game,
                profile,
                avg: getFourXAverage(profile),
                strongest: getStrongestAxis(profile)
            };
        })
        .sort((a, b) => b.avg - a.avg);

    strategyCompare.innerHTML = `
        <div class="strategy-compare-head">
            <div>
                <p class="strategy-compare-kicker">Comparateur Strategy</p>
                <h3>Vue 4X des jeux strategy visibles</h3>
            </div>
            <span class="strategy-compare-count">${ranked.length} jeu${ranked.length > 1 ? 'x' : ''}</span>
        </div>
        <div class="strategy-compare-list">
            ${ranked.map((entry) => `
                <article class="strategy-compare-card">
                    <div class="strategy-compare-top">
                        <h4>${escapeHtml(entry.game.title)}</h4>
                        <span class="strategy-compare-score">${entry.avg}</span>
                    </div>
                    <p class="strategy-compare-type">${escapeHtml(entry.game.strategyType || 'Strategy')} - Focus ${escapeHtml(entry.strongest.label)}</p>
                    <div class="strategy-compare-bars">
                        ${FOUR_X_AXES.map(axis => `
                            <div class="sx-bar-row">
                                <span>${axis.label}</span>
                                <div class="sx-bar-track"><i style="width:${entry.profile[axis.key]}%"></i></div>
                                <strong>${entry.profile[axis.key]}</strong>
                            </div>
                        `).join('')}
                    </div>
                </article>
            `).join('')}
        </div>
    `;

    strategyCompare.classList.remove('hidden');
}

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
        renderStrategyCompare([]);
        return;
    }

    noResults.classList.add('hidden');
    renderStrategyCompare(filtered);
    resultsInfo.innerHTML = `Showing <strong>${filtered.length}</strong> of <strong>${GAMES.length}</strong> games`;
    grid.innerHTML = filtered.map((game, i) => `
        <div class="game-card${game.playUrl ? ' game-card--playable' : ''}${game.category === 'strategy' ? ' game-card--strategy' : ''}" data-id="${game.id}" style="animation-delay:${i * 0.05}s">
            <button class="card-fav-btn${isFavorite(game.id) ? ' active' : ''}" data-fav-id="${game.id}" title="Ajouter aux favoris">&#10084;</button>
            ${game.coverImage ? `
                <div class="card-media">
                    <img src="${escapeAttr(game.coverImage)}" alt="${escapeAttr(game.title)} cover" loading="lazy">
                </div>
            ` : ''}
            <div class="card-content">
                <div class="card-header">
                    <span class="card-category">${game.category}</span>
                    <span class="card-rating">${game.rating.toFixed(1)}</span>
                </div>
                <h3>${game.title}</h3>
                <p>${game.description}</p>
                ${renderFourXSummary(game)}
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
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = parseInt(btn.dataset.favId, 10);
            const added = toggleFavorite(id);
            btn.classList.toggle('active', added);
            if (activeCategory === 'favorites') renderGrid();
        });
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
function submitScoreForGame(gameId, name, score) {
    if (!name || !Number.isFinite(score) || score < 0) return;
    addScore(gameId, {
        name,
        score,
        date: new Date().toLocaleDateString('fr-FR')
    });
}

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

function persistActiveSession(game) {
    if (!game) return;
    sessionStorage.setItem('wgc_activeGameId', String(game.id));
}

function clearActiveSession() {
    sessionStorage.removeItem('wgc_activeGameId');
}

function syncSessionBanner() {
    if (!sessionBanner) return;

    if (!lastPlayedGame || !postgamePanel.classList.contains('hidden')) {
        sessionBanner.classList.add('hidden');
        return;
    }

    sessionBannerTitle.textContent = lastPlayedGame.title;
    sessionBanner.classList.remove('hidden');
}

function updateViewerControls() {
    if (!viewerPopoutBtn) return;
    const hasGame = !!(lastPlayedGame && lastPlayedGame.playUrl);
    viewerPopoutBtn.disabled = !hasGame;
    viewerPopoutBtn.style.opacity = hasGame ? '1' : '0.5';
    viewerPopoutBtn.style.cursor = hasGame ? 'pointer' : 'not-allowed';
}

function openGame(game) {
    if (!playerName) {
        showPseudoModal(game);
        return;
    }
    launchGame(game);
}

function launchGame(game) {
    lastPlayedGame = game;
    persistActiveSession(game);
    syncSessionBanner();

    modalGameTitle.textContent = game.title;
    modalGameOverlay.classList.add('active');
    if (viewerEmpty) viewerEmpty.classList.add('hidden');
    gameIframe.src = new URL(game.playUrl, window.location.href).toString();
    updateViewerControls();

    modalGameOverlay.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ── Pseudo modal ───────────────────────────────
const pseudoOverlay    = document.getElementById('pseudo-overlay');
const pseudoInput      = document.getElementById('pseudo-input');
const pseudoConfirmBtn = document.getElementById('pseudo-confirm-btn');
const pseudoCancelBtn  = document.getElementById('pseudo-cancel-btn');
let pendingGame = null;

function showPseudoModal(game) {
    pendingGame = game;
    pseudoInput.value = playerName;
    pseudoOverlay.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    setTimeout(() => pseudoInput.focus(), 50);
}

function closePseudoModal() {
    pseudoOverlay.classList.add('hidden');
    document.body.style.overflow = '';
    pendingGame = null;
}

pseudoConfirmBtn.addEventListener('click', () => {
    const val = pseudoInput.value.trim();
    if (!val) { pseudoInput.style.borderColor = '#e63946'; setTimeout(() => pseudoInput.style.borderColor = '', 1500); return; }
    playerName = val.slice(0, 20);
    sessionStorage.setItem('wgc_playerName', playerName);
    closePseudoModal();
    if (pendingGame) launchGame(pendingGame);
});

pseudoCancelBtn.addEventListener('click', closePseudoModal);

pseudoInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') pseudoConfirmBtn.click();
    if (e.key === 'Escape') closePseudoModal();
});

function closeGame() {
    modalGameOverlay.classList.remove('active');
    gameIframe.src = '';
    if (viewerEmpty) viewerEmpty.classList.remove('hidden');
    modalGameTitle.textContent = 'Selectionne un jeu pour commencer';
    updateViewerControls();

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
    syncSessionBanner();
}

function closePostGame() {
    postgamePanel.classList.remove('open');
    postgamePanel.classList.add('hidden');
    document.body.style.overflow = '';
    clearActiveSession();
    lastPlayedGame = null;
    syncSessionBanner();
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

if (sessionFinishBtn) {
    sessionFinishBtn.addEventListener('click', () => {
        if (!lastPlayedGame) return;
        closeGame();
    });
}

if (sessionCancelBtn) {
    sessionCancelBtn.addEventListener('click', () => {
        clearActiveSession();
        lastPlayedGame = null;
        syncSessionBanner();
        updateViewerControls();
    });
}

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
        submitScoreForGame(gid, name, score);
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
if (viewerPopoutBtn) {
    viewerPopoutBtn.addEventListener('click', () => {
        if (!lastPlayedGame || !lastPlayedGame.playUrl) return;
        window.open(new URL(lastPlayedGame.playUrl, window.location.href).toString(), '_blank');
    });
}
document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (!postgamePanel.classList.contains('hidden')) closePostGame();
    else if (modalGameOverlay.classList.contains('active')) closeGame();
    else closeModal();
});

// ── Helpers ────────────────────────────────────
function capitalize(str) { return str.charAt(0).toUpperCase() + str.slice(1); }
function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g,'&amp;')
        .replace(/</g,'&lt;')
        .replace(/>/g,'&gt;')
        .replace(/"/g,'&quot;')
        .replace(/'/g,'&#39;');
}
function escapeAttr(str) {
    return escapeHtml(str);
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

const activeGameId = Number(sessionStorage.getItem('wgc_activeGameId'));
if (activeGameId) {
    lastPlayedGame = GAMES.find((game) => game.id === activeGameId) || null;
}

window.addEventListener('focus', syncSessionBanner);
syncSessionBanner();
updateViewerControls();

renderGrid();
}); // end DOMContentLoaded
