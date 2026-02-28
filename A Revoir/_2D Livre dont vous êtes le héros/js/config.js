const soundEffects = {
    click: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-select-click-1109.mp3'),
    sword: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-sword-slash-2760.mp3'),
    coin: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-coin-win-notification-1998.mp3'),
    heal: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-magic-bell-chime-2313.mp3')
}

const initialState = {
    health: 100,
    maxHealth: 100,
    hasSword: false,
    hasShield: false,
    gold: 0,
    inventory: [],
    visitedNodes: new Set([1]),
    difficulty: 'normal'
}

function playSound(type) {
    if (soundEffects[type]) {
        soundEffects[type].currentTime = 0
        soundEffects[type].play().catch(e => console.log("Audio error:", e))
    }
}