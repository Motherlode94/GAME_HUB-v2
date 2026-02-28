let state = {
    health: 100,
    maxHealth: 100,
    hasSword: false,
    hasShield: false,
    gold: 0,
    inventory: [],
    visitedNodes: new Set(),
    difficulty: 'normal'
}

function saveGame() {
    localStorage.setItem('adventureGameSave', JSON.stringify({
        ...state,
        visitedNodes: Array.from(state.visitedNodes)
    }))
}

function loadGame() {
    const saved = localStorage.getItem('adventureGameSave')
    if (saved) {
        const loaded = JSON.parse(saved)
        state = {
            ...loaded,
            visitedNodes: new Set(loaded.visitedNodes)
        }
        return true
    }
    return false
}

function resetState() {
    state = {
        health: 100,
        maxHealth: 100,
        hasSword: false,
        hasShield: false,
        gold: 0,
        inventory: [],
        visitedNodes: new Set([1]),
        difficulty: 'normal'
    }
}