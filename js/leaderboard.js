document.addEventListener('DOMContentLoaded', function() {
// ── Shared game titles (same list as scripts.js) ──
const GAMES = [
    { id: 1, title: 'Combat Arena', category: 'action' },
    { id: 2, title: '2D Basket Sim', category: 'sports' },
    { id: 3, title: 'Broken Array', category: 'strategy' },
    { id: 4, title: 'Tactical War', category: 'strategy' },
    { id: 5, title: 'Dungeon Crawler 2D', category: 'rpg' },
    { id: 6, title: 'FreeForce 2D', category: 'action' },
    { id: 7, title: 'HARDWOOD', category: 'sports' },
    { id: 8, title: 'NFL Mini Run', category: 'sports' }
];

function getScores(id)   { try { return JSON.parse(localStorage.getItem(`wgc_scores_${id}`))   || []; } catch { return []; } }
function getComments(id) { try { return JSON.parse(localStorage.getItem(`wgc_comments_${id}`)) || []; } catch { return []; } }

function normalizeScores(scores) {
    return scores
        .filter(entry => entry && typeof entry === 'object')
        .map(entry => ({
            name: typeof entry.name === 'string' && entry.name.trim() ? entry.name.trim() : 'Anonyme',
            score: Number(entry.score) || 0,
            date: entry.date || ''
        }))
        .filter(entry => entry.score >= 0)
        .sort((a, b) => b.score - a.score);
}

function loadAllData() {
    return GAMES.map(game => {
        const gid      = game.id;
        const scores   = normalizeScores(getScores(gid));
        const comments = getComments(gid);
        return { id: gid, title: game.title, category: game.category, scores, comments };
    }).filter(g => g.scores.length > 0 || g.comments.length > 0);
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function renderPage() {
    const search = document.getElementById('lb-search').value.toLowerCase();
    const sort   = document.getElementById('lb-sort').value;

    let data = loadAllData();

    if (search) data = data.filter(g => g.title.toLowerCase().includes(search));

    if (sort === 'topscore')      data.sort((a,b) => (b.scores[0]?.score||0) - (a.scores[0]?.score||0));
    else if (sort === 'activity') data.sort((a,b) => (b.scores.length + b.comments.length) - (a.scores.length + a.comments.length));
    else                          data.sort((a,b) => a.title.localeCompare(b.title));

    const grid    = document.getElementById('lb-grid');
    const empty   = document.getElementById('lb-empty');
    const summary = document.getElementById('lb-summary');

    if (data.length === 0) {
        grid.innerHTML = '';
        empty.classList.remove('hidden');
        summary.innerHTML = '';
        return;
    }

    empty.classList.add('hidden');

    const totalScores   = data.reduce((s,g) => s + g.scores.length, 0);
    const totalComments = data.reduce((s,g) => s + g.comments.length, 0);
    const avgRating     = (() => {
        const all = data.flatMap(g => g.comments.map(c => c.stars)).filter(Boolean);
        return all.length ? (all.reduce((a,b) => a+b, 0) / all.length).toFixed(1) : '—';
    })();

    summary.innerHTML = `
        <div class="lb-stat"><span class="lb-stat-val">${data.length}</span><span class="lb-stat-label">Jeux actifs</span></div>
        <div class="lb-stat"><span class="lb-stat-val">${totalScores}</span><span class="lb-stat-label">Scores soumis</span></div>
        <div class="lb-stat"><span class="lb-stat-val">${totalComments}</span><span class="lb-stat-label">Avis écrits</span></div>
        <div class="lb-stat"><span class="lb-stat-val">${avgRating} ★</span><span class="lb-stat-label">Note moyenne</span></div>
    `;

    grid.innerHTML = data.map(g => {
        const top3          = g.scores.slice(0, 3);
        const avgStars      = g.comments.length
            ? (g.comments.reduce((s,c) => s + (c.stars||0), 0) / g.comments.length).toFixed(1)
            : null;
        const latestComment = [...g.comments].sort((a,b) => new Date(b.ts) - new Date(a.ts))[0];

        return `
        <div class="lb-card">
            <div class="lb-card-header">
                <div>
                    <span class="lb-card-cat">${g.category || 'game'}</span>
                    <h3 class="lb-card-title">${escapeHtml(g.title)}</h3>
                </div>
                <div class="lb-card-meta">
                    ${avgStars ? `<span class="lb-avg-stars">★ ${avgStars}</span>` : ''}
                    <span class="lb-entry-count">${g.scores.length} score${g.scores.length > 1 ? 's' : ''}</span>
                </div>
            </div>

            ${top3.length ? `
            <div class="lb-card-scores">
                ${top3.map((e,i) => `
                    <div class="lb-card-row ${i===0?'lb-gold':i===1?'lb-silver':'lb-bronze'}">
                        <span class="lb-rank">${i===0?'🥇':i===1?'🥈':'🥉'}</span>
                        <span class="lb-name">${escapeHtml(e.name)}</span>
                        <span class="lb-score">${Number(e.score).toLocaleString()}</span>
                    </div>
                `).join('')}
            </div>` : ''}

            ${latestComment ? `
            <div class="lb-card-review">
                <div class="lb-review-header">
                    <span class="lb-review-name">${escapeHtml(latestComment.name)}</span>
                    <span class="lb-review-stars">${'★'.repeat(latestComment.stars||0)}${'☆'.repeat(5-(latestComment.stars||0))}</span>
                    <span class="lb-review-date">${latestComment.date}</span>
                </div>
                <p class="lb-review-text">"${escapeHtml(latestComment.text)}"</p>
            </div>` : ''}

            <a href="index.html#game-${g.id}" class="lb-card-link"
               onclick="sessionStorage.setItem('openGame','${g.id}')">Voir tous les scores →</a>
        </div>`;
    }).join('');
}

document.getElementById('lb-search').addEventListener('input', renderPage);
document.getElementById('lb-sort').addEventListener('change', renderPage);
document.getElementById('lb-clear-all').addEventListener('click', () => {
    if (!confirm('Effacer TOUS tes scores et avis locaux ? Cette action est irréversible.')) return;
    Object.keys(localStorage).filter(k => k.startsWith('wgc_')).forEach(k => localStorage.removeItem(k));
    renderPage();
});

renderPage();
}); // end DOMContentLoaded
