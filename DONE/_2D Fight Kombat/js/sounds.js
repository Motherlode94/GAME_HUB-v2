// sounds.js
// Tous les sons generes via Web Audio API — aucun fichier externe

const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;

// Initialise le contexte audio au premier geste utilisateur
function initAudio() {
    if (audioCtx) return;
    audioCtx = new AudioCtx();
}

// Helper : cree un noeud gain master leger
function masterGain(vol = 0.4) {
    const g = audioCtx.createGain();
    g.gain.setValueAtTime(vol, audioCtx.currentTime);
    g.connect(audioCtx.destination);
    return g;
}

// Helper : oscillateur simple avec envelope
function playTone({ type = 'sine', freq = 440, freqEnd = 440, vol = 0.3, attack = 0.005, decay = 0.15, t = null }) {
    if (!audioCtx) return;
    const now  = t ?? audioCtx.currentTime;
    const osc  = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(freqEnd, 1), now + decay);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(vol, now + attack);
    gain.gain.exponentialRampToValueAtTime(0.001, now + attack + decay);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start(now);
    osc.stop(now + attack + decay + 0.01);
}

// Helper : bruit blanc filtre
function playNoise({ freq = 800, q = 1, vol = 0.2, duration = 0.08, t = null }) {
    if (!audioCtx) return;
    const now        = t ?? audioCtx.currentTime;
    const bufferSize = audioCtx.sampleRate * duration;
    const buffer     = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data       = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const source = audioCtx.createBufferSource();
    source.buffer = buffer;

    const filter = audioCtx.createBiquadFilter();
    filter.type            = 'bandpass';
    filter.frequency.value = freq;
    filter.Q.value         = q;

    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(audioCtx.destination);

    source.start(now);
    source.stop(now + duration + 0.01);
}


// SON : Coup normal
function soundHit() {
    if (!audioCtx) return;
    // Impact sourd + clic
    playNoise({ freq: 180, q: 0.8, vol: 0.5, duration: 0.06 });
    playTone({ type: 'square', freq: 120, freqEnd: 60, vol: 0.2, attack: 0.002, decay: 0.08 });
}

// SON : Coup charge (plus lourd)
function soundHitCharged() {
    if (!audioCtx) return;
    const now = audioCtx.currentTime;
    // Impact grave
    playNoise({ freq: 100, q: 0.5, vol: 0.8, duration: 0.12, t: now });
    playTone({ type: 'sawtooth', freq: 80,  freqEnd: 30,  vol: 0.35, attack: 0.003, decay: 0.18, t: now });
    // Harmonie haute pour le "crunch"
    playTone({ type: 'square',   freq: 320, freqEnd: 80,  vol: 0.15, attack: 0.001, decay: 0.10, t: now });
}

// SON : Saut normal
function soundJump() {
    if (!audioCtx) return;
    playTone({ type: 'sine', freq: 280, freqEnd: 520, vol: 0.18, attack: 0.01, decay: 0.12 });
}

// SON : Double saut (plus aigu, leger)
function soundDoubleJump() {
    if (!audioCtx) return;
    const now = audioCtx.currentTime;
    playTone({ type: 'sine',     freq: 520, freqEnd: 820, vol: 0.15, attack: 0.008, decay: 0.10, t: now });
    playTone({ type: 'triangle', freq: 780, freqEnd: 980, vol: 0.08, attack: 0.015, decay: 0.08, t: now + 0.04 });
}

// SON : Dash
function soundDash() {
    if (!audioCtx) return;
    const now = audioCtx.currentTime;
    playNoise({ freq: 1200, q: 3, vol: 0.25, duration: 0.05, t: now });
    playTone({ type: 'sine', freq: 600, freqEnd: 200, vol: 0.12, attack: 0.003, decay: 0.07, t: now });
}

// SON : Atterrissage
function soundLand() {
    if (!audioCtx) return;
    playNoise({ freq: 200, q: 1.5, vol: 0.3, duration: 0.05 });
    playTone({ type: 'sine', freq: 90, freqEnd: 50, vol: 0.15, attack: 0.002, decay: 0.06 });
}

// SON : Debut de charge (tick progressif)
function soundChargeTick(pct) {
    if (!audioCtx) return;
    const freq = 400 + pct * 800; // monte avec la charge
    playTone({ type: 'sine', freq, freqEnd: freq * 1.1, vol: 0.04 + pct * 0.06, attack: 0.002, decay: 0.04 });
}

// SON : Charge complete (ping)
function soundChargeReady() {
    if (!audioCtx) return;
    const now = audioCtx.currentTime;
    playTone({ type: 'sine',     freq: 1200, freqEnd: 1400, vol: 0.2,  attack: 0.005, decay: 0.12, t: now });
    playTone({ type: 'triangle', freq: 600,  freqEnd: 800,  vol: 0.12, attack: 0.005, decay: 0.10, t: now + 0.06 });
}

// SON : Victoire (fanfare simple)
function soundVictory() {
    if (!audioCtx) return;
    const now  = audioCtx.currentTime;
    const notes = [
        { freq: 523, t: 0.00 },  // Do
        { freq: 659, t: 0.12 },  // Mi
        { freq: 784, t: 0.24 },  // Sol
        { freq: 1047,t: 0.38 },  // Do octave
        { freq: 784, t: 0.52 },  // Sol
        { freq: 1047,t: 0.62 },  // Do octave (tenu)
    ];
    for (const n of notes) {
        playTone({ type: 'triangle', freq: n.freq, freqEnd: n.freq * 0.98, vol: 0.22, attack: 0.01, decay: 0.18, t: now + n.t });
    }
    // Accord final
    playTone({ type: 'sine', freq: 523,  freqEnd: 523,  vol: 0.1, attack: 0.02, decay: 0.5, t: now + 0.62 });
    playTone({ type: 'sine', freq: 659,  freqEnd: 659,  vol: 0.1, attack: 0.02, decay: 0.5, t: now + 0.62 });
    playTone({ type: 'sine', freq: 1047, freqEnd: 1047, vol: 0.1, attack: 0.02, decay: 0.5, t: now + 0.62 });
}

// SON : Egalite (descente triste)
function soundDraw() {
    if (!audioCtx) return;
    const now   = audioCtx.currentTime;
    const notes = [
        { freq: 440, t: 0.00 },
        { freq: 370, t: 0.18 },
        { freq: 311, t: 0.36 },
        { freq: 277, t: 0.56 },
    ];
    for (const n of notes) {
        playTone({ type: 'triangle', freq: n.freq, freqEnd: n.freq * 0.95, vol: 0.18, attack: 0.01, decay: 0.22, t: now + n.t });
    }
}

// SON : Timer bas (top toutes les secondes)
function soundTimerBeep() {
    if (!audioCtx) return;
    playTone({ type: 'sine', freq: 880, freqEnd: 800, vol: 0.12, attack: 0.005, decay: 0.08 });
}