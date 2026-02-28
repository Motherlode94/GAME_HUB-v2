// ══════════════════════════════════════════════
//  WARLIKE GAMING CORPS — Espace Joueur
//  space.js
// ══════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', function() {

// ── Access codes ─────────────────────────────
// Clé → { username, avatar, role }
// Modifie cette liste pour ajouter / retirer des membres
const ACCESS_CODES = {
    "WGC-ALPHA-001":  { username: "HardieBay",  avatar: "H", role: "admin"  },
    "WGC-ARNDR-001": { username: "GANDZIRI_Arnaud",  avatar: "GA", role: "member" },
    "WGC-PLAYER-002": { username: "Joueur_02",  avatar: "A", role: "member" },
    "WGC-PLAYER-003": { username: "Joueur_03",  avatar: "S", role: "member" },
    "WGC-PLAYER-004": { username: "Joueur_04",  avatar: "M", role: "member" },
    "WGC-PLAYER-005": { username: "Joueur_05",  avatar: "K", role: "member" },
    // "MON-CODE-ICI": { username: "PseudoJoueur", avatar: "P", role: "member" },
};

// ── Tag labels ────────────────────────────────
const TAG_LABELS = {
    general:     '',
    bug:         '🐛 Bug',
    improvement: '💡 Amélioration',
    appreciation:'❤️ Coup de cœur'
};

// ── Storage helpers ───────────────────────────
function getMsgs(channel) {
    try { return JSON.parse(localStorage.getItem(`wgc_space_${channel}`)) || []; }
    catch { return []; }
}
function saveMsgs(channel, msgs) {
    localStorage.setItem(`wgc_space_${channel}`, JSON.stringify(msgs));
}
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function timeAgo(isoStr) {
    const diff    = Date.now() - new Date(isoStr).getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours   = Math.floor(minutes / 60);
    const days    = Math.floor(hours / 24);
    const weeks   = Math.floor(days / 7);
    const months  = Math.floor(days / 30);
    const years   = Math.floor(days / 365);

    if (seconds < 60) return "à l'instant";
    if (minutes < 60) return `il y a ${minutes}min`;
    if (hours   < 24) return `il y a ${hours}h`;
    if (days    < 7)  return `il y a ${days}j`;
    if (weeks   < 5)  return `il y a ${weeks} sem`;
    if (months  < 12) return `il y a ${months} mois`;
    return `il y a ${years} an${years > 1 ? 's' : ''}`;
}

// ── State ─────────────────────────────────────
let currentUser   = null;
let currentGameId = null;
let currentTag    = 'general';
let lastMsgTime   = 0; // anti-spam: timestamp of last sent message

// ── Session ───────────────────────────────────
function getSession()      { try { return JSON.parse(sessionStorage.getItem('wgc_space_session')); } catch { return null; } }
function saveSession(code) { sessionStorage.setItem('wgc_space_session', JSON.stringify({ code })); }
function clearSession()    { sessionStorage.removeItem('wgc_space_session'); }

// ── DOM refs ──────────────────────────────────
const loginScreen    = document.getElementById('login-screen');
const spaceMain      = document.getElementById('space-main');
const codeInput      = document.getElementById('access-code-input');
const codeBtn        = document.getElementById('access-code-btn');
const loginError     = document.getElementById('login-error');
const gameSelect     = document.getElementById('sp-game-select');
const gamePlaceholder= document.getElementById('sp-game-placeholder');
const chatGame       = document.getElementById('chat-game');
const composerGame   = document.getElementById('composer-game');

// ── Init space after login ────────────────────
function initSpace(user) {
    currentUser = user;
    loginScreen.classList.add('hidden');
    spaceMain.classList.remove('hidden');
    document.getElementById('sp-username').textContent = user.username;
    document.getElementById('sp-avatar').textContent   = user.avatar;
    if (user.role === 'admin') {
        document.getElementById('sp-avatar').style.background = 'linear-gradient(135deg,#e63946,#c1121f)';
    }
    renderChannel('general');
    renderChannel('suggestions');
}

// Auto-login from session
const existing = getSession();
if (existing && ACCESS_CODES[existing.code]) {
    initSpace({ ...ACCESS_CODES[existing.code], code: existing.code });
}

// ── Login ─────────────────────────────────────
function tryLogin() {
    const code = codeInput.value.trim().toUpperCase();
    const user = ACCESS_CODES[code];
    if (!user) {
        loginError.classList.remove('hidden');
        codeInput.style.borderColor = '#e63946';
        setTimeout(() => { codeInput.style.borderColor = ''; }, 2000);
        return;
    }
    loginError.classList.add('hidden');
    saveSession(code);
    initSpace({ ...user, code });
}

codeBtn.addEventListener('click', tryLogin);
codeInput.addEventListener('keydown', e => { if (e.key === 'Enter') tryLogin(); });

document.getElementById('sp-logout-btn').addEventListener('click', () => {
    clearSession();
    location.reload();
});

// ── Tab switching ─────────────────────────────
document.querySelectorAll('.sp-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.sp-tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.sp-panel').forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(`sptab-${btn.dataset.sptab}`).classList.add('active');
    });
});

// ── Game selector ─────────────────────────────
gameSelect.addEventListener('change', () => {
    const val = gameSelect.value;
    if (!val) {
        currentGameId = null;
        gamePlaceholder.classList.remove('hidden');
        chatGame.classList.add('hidden');
        composerGame.classList.add('hidden');
        return;
    }
    currentGameId = val;
    gamePlaceholder.classList.add('hidden');
    chatGame.classList.remove('hidden');
    composerGame.classList.remove('hidden');
    renderChannel('game');
});

// ── Tag selector ─────────────────────────────
document.querySelectorAll('.sp-msg-tag').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.sp-msg-tag').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentTag = btn.dataset.tag;
    });
});

// ── Render channel ────────────────────────────
function getChannelKey(channel) {
    return channel === 'game' ? `game_${currentGameId}` : channel;
}

function renderChannel(channel) {
    const key  = getChannelKey(channel);
    const msgs = getMsgs(key);
    const el   = document.getElementById(`chat-${channel}`);
    if (!el) return;

    if (msgs.length === 0) {
        el.innerHTML = `<div class="sp-no-msgs">
            <span>${channel === 'suggestions' ? '💡' : '💬'}</span>
            <p>Aucun message pour l'instant. Sois le premier !</p>
        </div>`;
        return;
    }

    el.innerHTML = msgs.map(m => {
        const isMe       = m.username === currentUser?.username;
        const tagBadge   = m.tag && m.tag !== 'general'
            ? `<span class="sp-msg-tag-badge">${TAG_LABELS[m.tag] || m.tag}</span>` : '';
        const adminBadge = m.role === 'admin'
            ? `<span class="sp-admin-badge">ADMIN</span>` : '';
        const avatarStyle = m.role === 'admin'
            ? 'style="background:linear-gradient(135deg,#e63946,#c1121f)"' : '';
        return `
        <div class="sp-msg ${isMe ? 'sp-msg--me' : ''}">
            <div class="sp-msg-avatar" ${avatarStyle}>${escapeHtml(m.avatar)}</div>
            <div class="sp-msg-body">
                <div class="sp-msg-meta">
                    <span class="sp-msg-name">${escapeHtml(m.username)}</span>
                    ${adminBadge}${tagBadge}
                    <span class="sp-msg-time">${timeAgo(m.ts)}</span>
                </div>
                <p class="sp-msg-text">${escapeHtml(m.text)}</p>
            </div>
        </div>`;
    }).join('');

    el.scrollTop = el.scrollHeight;
}

// ── Send message ──────────────────────────────
function sendMsg(channel) {
    const textarea = document.getElementById(`msg-${channel}`);
    if (!textarea) return;
    const text = textarea.value.trim();
    if (!text || !currentUser) return;

    // Anti-spam: 20s cooldown between messages
    const now = Date.now();
    if (now - lastMsgTime < 20000) {
        const wait = Math.ceil((20000 - (now - lastMsgTime)) / 1000);
        alert(`Attends encore ${wait}s avant d'envoyer un autre message.`);
        return;
    }
    lastMsgTime = now;

    const key  = getChannelKey(channel);
    const msgs = getMsgs(key);
    msgs.push({
        username: currentUser.username,
        avatar:   currentUser.avatar,
        role:     currentUser.role || 'member',
        text,
        tag:      channel === 'game' ? currentTag : null,
        ts:       new Date().toISOString()
    });
    if (msgs.length > 200) msgs.shift();
    saveMsgs(key, msgs);
    textarea.value = '';
    renderChannel(channel);
}

document.querySelectorAll('.sp-send-btn').forEach(btn => {
    btn.addEventListener('click', () => sendMsg(btn.dataset.channel));
});

// Ctrl+Enter / Cmd+Enter to send
document.querySelectorAll('.sp-composer textarea').forEach(ta => {
    ta.addEventListener('keydown', e => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            const btn = ta.closest('.sp-composer')?.querySelector('.sp-send-btn');
            if (btn) sendMsg(btn.dataset.channel);
        }
    });
});

// Auto-refresh every 15s
setInterval(() => {
    if (!currentUser) return;
    const activePanel = document.querySelector('.sp-panel.active');
    if (!activePanel) return;
    const tab = activePanel.id.replace('sptab-', '');
    if      (tab === 'games'       && currentGameId) renderChannel('game');
    else if (tab === 'general')                      renderChannel('general');
    else if (tab === 'suggestions')                  renderChannel('suggestions');
}, 15000);

}); // end DOMContentLoaded