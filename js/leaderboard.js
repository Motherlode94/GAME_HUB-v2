document.addEventListener('DOMContentLoaded', function () {
const WGC = window.WGC_DATA || {};
const GAMES = Array.isArray(WGC.GAMES) ? WGC.GAMES : [];

function getScores(id) {
    return typeof WGC.getScores === 'function' ? WGC.getScores(id) : [];
}

function getComments(id) {
    return typeof WGC.getComments === 'function' ? WGC.getComments(id) : [];
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function loadAllData() {
    return GAMES.map((game) => ({
        id: game.id,
        title: game.title,
        category: game.category,
        scores: getScores(game.id),
        comments: getComments(game.id)
    })).filter((game) => game.scores.length > 0 || game.comments.length > 0);
}

function renderPage() {
    const search = document.getElementById('lb-search').value.trim().toLowerCase();
    const sort = document.getElementById('lb-sort').value;
    let data = loadAllData();

    if (search) {
        data = data.filter((game) => game.title.toLowerCase().includes(search));
    }

    if (sort === 'topscore') {
        data.sort((a, b) => (b.scores[0]?.score || 0) - (a.scores[0]?.score || 0));
    } else if (sort === 'activity') {
        data.sort((a, b) => (b.scores.length + b.comments.length) - (a.scores.length + a.comments.length));
    } else {
        data.sort((a, b) => a.title.localeCompare(b.title));
    }

    const grid = document.getElementById('lb-grid');
    const empty = document.getElementById('lb-empty');
    const summary = document.getElementById('lb-summary');

    if (data.length === 0) {
        grid.innerHTML = '';
        summary.innerHTML = '';
        empty.classList.remove('hidden');
        return;
    }

    empty.classList.add('hidden');

    const totalScores = data.reduce((sum, game) => sum + game.scores.length, 0);
    const totalComments = data.reduce((sum, game) => sum + game.comments.length, 0);
    const allStars = data.flatMap((game) => game.comments.map((comment) => comment.stars)).filter(Boolean);
    const avgRating = allStars.length ? (allStars.reduce((a, b) => a + b, 0) / allStars.length).toFixed(1) : '-';

    summary.innerHTML = `
        <div class="lb-stat"><span class="lb-stat-val">${data.length}</span><span class="lb-stat-label">Jeux actifs</span></div>
        <div class="lb-stat"><span class="lb-stat-val">${totalScores}</span><span class="lb-stat-label">Scores soumis</span></div>
        <div class="lb-stat"><span class="lb-stat-val">${totalComments}</span><span class="lb-stat-label">Avis ecrits</span></div>
        <div class="lb-stat"><span class="lb-stat-val">${avgRating} *</span><span class="lb-stat-label">Note moyenne</span></div>
    `;

    grid.innerHTML = data.map((game) => {
        const top3 = game.scores.slice(0, 3);
        const avgStars = game.comments.length
            ? (game.comments.reduce((sum, comment) => sum + (comment.stars || 0), 0) / game.comments.length).toFixed(1)
            : null;
        const latestComment = [...game.comments].sort((a, b) => new Date(b.ts || 0) - new Date(a.ts || 0))[0];

        return `
        <div class="lb-card">
            <div class="lb-card-header">
                <div>
                    <span class="lb-card-cat">${game.category || 'game'}</span>
                    <h3 class="lb-card-title">${escapeHtml(game.title)}</h3>
                </div>
                <div class="lb-card-meta">
                    ${avgStars ? `<span class="lb-avg-stars">* ${avgStars}</span>` : ''}
                    <span class="lb-entry-count">${game.scores.length} score${game.scores.length > 1 ? 's' : ''}</span>
                </div>
            </div>

            ${top3.length ? `
            <div class="lb-card-scores">
                ${top3.map((entry, index) => `
                    <div class="lb-card-row ${index === 0 ? 'lb-gold' : index === 1 ? 'lb-silver' : 'lb-bronze'}">
                        <span class="lb-rank">${index === 0 ? '#1' : index === 1 ? '#2' : '#3'}</span>
                        <span class="lb-name">${escapeHtml(entry.name)}</span>
                        <span class="lb-score">${Number(entry.score).toLocaleString()}</span>
                    </div>
                `).join('')}
            </div>` : ''}

            ${latestComment ? `
            <div class="lb-card-review">
                <div class="lb-review-header">
                    <span class="lb-review-name">${escapeHtml(latestComment.name || '')}</span>
                    <span class="lb-review-stars">${'*'.repeat(latestComment.stars || 0)}</span>
                    <span class="lb-review-date">${latestComment.date || ''}</span>
                </div>
                <p class="lb-review-text">"${escapeHtml(latestComment.text || '')}"</p>
            </div>` : ''}

            <a href="index.html#game-${game.id}" class="lb-card-link"
               onclick="sessionStorage.setItem('openGame','${game.id}')">Voir les scores</a>
        </div>`;
    }).join('');
}

document.getElementById('lb-search').addEventListener('input', renderPage);
document.getElementById('lb-sort').addEventListener('change', renderPage);
document.getElementById('lb-clear-all').addEventListener('click', () => {
    if (!confirm('Effacer tous les scores et avis locaux ?')) return;
    Object.keys(localStorage)
        .filter((key) => key.startsWith('wgc_'))
        .forEach((key) => localStorage.removeItem(key));
    renderPage();
});

renderPage();
});
