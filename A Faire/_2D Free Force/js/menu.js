/* global gameState, startGame, restartGame, difficulty */

const DIFF_LIST = ['FACILE', 'NORMAL', 'DIFFICILE', 'BRUTAL'];
const DIFF_DESC = {
    FACILE: 'Ennemis lents — idéal pour débuter',
    NORMAL: 'Expérience équilibrée',
    DIFFICILE: 'Spawn rapide, tirs précis',
    BRUTAL: 'Bonne chance, bro…'
};
const DIFF_COLORS = {
    FACILE: '#44ff88',
    NORMAL: '#ffdd00',
    DIFFICILE: '#ff8800',
    BRUTAL: '#ff2200'
};

let diffIdx = Math.max(0, DIFF_LIST.indexOf(localStorage.getItem('ff2d_diff') || 'NORMAL'));
let volLevel = parseInt(localStorage.getItem('ff2d_vol') || '5', 10);
let sfxLevel = parseInt(localStorage.getItem('ff2d_sfx') || '7', 10);
let navIdx = 0;
const NAV_BTNS = Array.from(document.querySelectorAll('#main-nav .menu-btn'));

function showScreen(id) {
    document.querySelectorAll('.screen').forEach((s) => s.classList.remove('active'));
    if (id === 'menu') {
        const menu = document.getElementById('menu-overlay');
        if (menu) {
            menu.classList.add('active');
        }
        if (typeof gameState !== 'undefined') {
            gameState = 'menu';
        }
    } else {
        const el = document.getElementById('screen-' + id) || document.getElementById(id + '-overlay');
        if (el) {
            el.classList.add('active');
        }
    }
}

function hideAllMenus() {
    document.querySelectorAll('.screen').forEach((s) => s.classList.remove('active'));
}

window.hideAllMenus = hideAllMenus;
window.showGameOver = function (sc, best) {
    const scoreEl = document.getElementById('go-score');
    const bestEl = document.getElementById('go-best');
    if (!scoreEl || !bestEl) {
        return;
    }

    scoreEl.textContent = 'SCORE : ' + Number(sc).toLocaleString();
    const isBest = sc >= best;
    bestEl.textContent = isBest ? '★ NOUVEAU RECORD !' : 'MEILLEUR : ' + Number(best).toLocaleString();
    bestEl.style.color = isBest ? '#00ffaa' : '#888';
    showScreen('gameover');
};

function setNav(i) {
    if (!NAV_BTNS.length) {
        return;
    }
    navIdx = (i + NAV_BTNS.length) % NAV_BTNS.length;
    NAV_BTNS.forEach((b, j) => b.classList.toggle('active', j === navIdx));
}

NAV_BTNS.forEach((btn, i) => {
    btn.addEventListener('mouseenter', () => setNav(i));
    btn.addEventListener('click', () => {
        const action = btn.dataset.action;
        if (action === 'play') {
            hideAllMenus();
            if (typeof startGame === 'function') {
                startGame();
            }
            return;
        }

        if (action) {
            showScreen(action);
            if (action === 'scores') {
                renderScores();
            }
        }
    });
});

document.querySelectorAll('[data-back]').forEach((btn) => {
    btn.addEventListener('click', () => showScreen(btn.dataset.back));
});

const restartBtn = document.getElementById('go-restart');
if (restartBtn) {
    restartBtn.addEventListener('click', () => {
        hideAllMenus();
        if (typeof restartGame === 'function') {
            restartGame();
        }
    });
}

const menuBtn = document.getElementById('go-menu');
if (menuBtn) {
    menuBtn.addEventListener('click', () => showScreen('menu'));
}

function updateDiff() {
    const d = DIFF_LIST[diffIdx];
    const valueEl = document.getElementById('diff-value');
    const descEl = document.getElementById('diff-desc');

    if (valueEl) {
        valueEl.textContent = d;
        valueEl.style.color = DIFF_COLORS[d];
    }
    if (descEl) {
        descEl.textContent = DIFF_DESC[d];
    }

    document.querySelectorAll('#diff-dots .dot').forEach((dot, i) => {
        dot.classList.toggle('active', i === diffIdx);
        dot.style.background = i === diffIdx ? DIFF_COLORS[d] : '';
        dot.style.boxShadow = i === diffIdx ? `0 0 8px ${DIFF_COLORS[d]}` : '';
    });

    localStorage.setItem('ff2d_diff', d);
    if (typeof difficulty !== 'undefined') {
        difficulty = d;
    }
}

const diffLeft = document.getElementById('diff-left');
if (diffLeft) {
    diffLeft.addEventListener('click', () => {
        diffIdx = (diffIdx - 1 + DIFF_LIST.length) % DIFF_LIST.length;
        updateDiff();
    });
}

const diffRight = document.getElementById('diff-right');
if (diffRight) {
    diffRight.addEventListener('click', () => {
        diffIdx = (diffIdx + 1) % DIFF_LIST.length;
        updateDiff();
    });
}

updateDiff();

function barStr(n, max = 10) {
    return '▐'.repeat(n) + '░'.repeat(max - n);
}

function updateVol() {
    const volEl = document.getElementById('vol-value');
    if (volEl) {
        volEl.textContent = barStr(volLevel);
    }
    localStorage.setItem('ff2d_vol', String(volLevel));
}

function updateSfx() {
    const sfxEl = document.getElementById('sfx-value');
    if (sfxEl) {
        sfxEl.textContent = barStr(sfxLevel);
    }
    localStorage.setItem('ff2d_sfx', String(sfxLevel));
}

const volLeft = document.getElementById('vol-left');
if (volLeft) {
    volLeft.addEventListener('click', () => {
        volLevel = Math.max(0, volLevel - 1);
        updateVol();
    });
}

const volRight = document.getElementById('vol-right');
if (volRight) {
    volRight.addEventListener('click', () => {
        volLevel = Math.min(10, volLevel + 1);
        updateVol();
    });
}

const sfxLeft = document.getElementById('sfx-left');
if (sfxLeft) {
    sfxLeft.addEventListener('click', () => {
        sfxLevel = Math.max(0, sfxLevel - 1);
        updateSfx();
    });
}

const sfxRight = document.getElementById('sfx-right');
if (sfxRight) {
    sfxRight.addEventListener('click', () => {
        sfxLevel = Math.min(10, sfxLevel + 1);
        updateSfx();
    });
}

updateVol();
updateSfx();

function diffClassName(value) {
    const raw = (value || 'NORMAL').toString().toLowerCase();
    if (raw === 'facile') {
        return 'diff-facile';
    }
    if (raw === 'difficile') {
        return 'diff-difficile';
    }
    if (raw === 'brutal') {
        return 'diff-brutal';
    }
    return 'diff-normal';
}

function renderScores() {
    const list = document.getElementById('scores-list');
    if (!list) {
        return;
    }

    const history = JSON.parse(localStorage.getItem('ff2d_scores') || '[]');
    if (!history.length) {
        list.innerHTML = '<p class="no-scores">AUCUN SCORE — JOUE D\'ABORD !</p>';
        return;
    }

    list.innerHTML = history.map((entry, i) => {
        const diff = entry.difficulty || 'NORMAL';
        return `
        <div class="score-row${i === 0 ? ' top' : ''}">
            <span class="score-rank">${i === 0 ? '★' : (i + 1) + '.'}</span>
            <span class="score-num">${Number(entry.score).toLocaleString()}</span>
            <span class="score-diff ${diffClassName(diff)}">${diff}</span>
            <span class="score-date">${entry.date || ''}</span>
        </div>`;
    }).join('');
}

document.addEventListener('keydown', (e) => {
    const active = document.querySelector('.screen.active');
    if (!active) {
        return;
    }

    const id = active.id;

    if (id === 'menu-overlay' && NAV_BTNS.length) {
        if (e.key === 'ArrowDown') {
            setNav(navIdx + 1);
            e.preventDefault();
        }
        if (e.key === 'ArrowUp') {
            setNav(navIdx - 1);
            e.preventDefault();
        }
        if (e.key === 'Enter' || e.key === ' ') {
            NAV_BTNS[navIdx].click();
            e.preventDefault();
        }
    }

    if (id === 'screen-options') {
        if (e.key === 'ArrowLeft' && diffLeft) {
            diffLeft.click();
        }
        if (e.key === 'ArrowRight' && diffRight) {
            diffRight.click();
        }
        if (e.key === 'Escape') {
            showScreen('menu');
        }
    }

    if (id === 'screen-scores' || id === 'screen-controls') {
        if (e.key === 'Escape' || e.key === 'Backspace') {
            showScreen('menu');
        }
    }

    if (id === 'gameover-overlay') {
        if (e.key === ' ' && restartBtn) {
            restartBtn.click();
        }
        if (e.key === 'Escape') {
            showScreen('menu');
        }
    }
});