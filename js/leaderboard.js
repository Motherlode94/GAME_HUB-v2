document.addEventListener('DOMContentLoaded', function() {
// ── Shared game titles (same list as scripts.js) ──
const GAME_TITLES = {
    1:'Combat Arena', 2:'Vampire Sim', 3:'Zombie Shooter', 4:'Pixel Platformer',
    5:'FreeForce 2D', 6:'Racing Rivals', 7:'Axis Infinity', 8:'2D Shooter',
    9:'Dungeon Crawler', 10:'2D Mario Like', 11:'2D Mario Kart', 12:'2D GodSworm',
    13:'2D Football Sim', 14:'2D Sims', 15:'2D Minecraft', 16:'2D Hack n Slash',
    17:'2D GTA', 18:'2D Rpg', 19:'2D Tower Defense', 20:'2D Gestion Tycoon', 21:'2D Empire Game'
};
const GAME_CATS = {
    1:'action',2:'adventure',3:'survival',4:'platformer',5:'action',6:'racing',
    7:'',8:'shooter',9:'adventure',10:'platformer',11:'racing',12:'adventure',
    13:'sports',14:'simulation',15:'sandbox',16:'action',17:'action',18:'rpg',
    19:'strategy',20:'simulation',21:'strategy'
};

function getScores(id)   { try { return JSON.parse(localStorage.getItem(`wgc_scores_${id}`))   || []; } catch { return []; } }
function getComments(id) { try { return JSON.parse(localStorage.getItem(`wgc_comments_${id}`)) || []; } catch { return []; } }

function loadAllData() {
    return Object.keys(GAME_TITLES).map(id => {
        const gid      = parseInt(id);
        const scores   = getScores(gid).sort((a,b) => b.score - a.score);
        const comments = getComments(gid);
        return { id: gid, title: GAME_TITLES[gid], category: GAME_CATS[gid], scores, comments };
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
        const latestComment = g.comments.sort((a,b) => new Date(b.ts) - new Date(a.ts))[0];

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