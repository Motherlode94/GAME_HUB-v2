const textElement = document.getElementById('text')
const optionButtonsElement = document.getElementById('option-buttons')
const statsElement = document.getElementById('stats')

function updateStats() {
    if (!statsElement) return
    
    const healthBar = document.getElementById('health-bar')
    const healthText = document.getElementById('health-text')
    const goldText = document.getElementById('gold-text')
    const inventoryElement = document.getElementById('inventory')
    
    if (healthBar) {
        const healthPercent = (state.health / state.maxHealth) * 100
        healthBar.style.width = `${healthPercent}%`
        healthBar.className = `health-fill ${healthPercent > 70 ? 'high' : healthPercent > 30 ? 'medium' : 'low'}`
    }
    
    if (healthText) healthText.textContent = `❤️ ${state.health}/${state.maxHealth}`
    if (goldText) goldText.textContent = `💰 ${state.gold}`
    
    if (inventoryElement) {
        inventoryElement.innerHTML = ''
        const items = []
        if (state.hasSword) items.push('⚔️ Épée')
        if (state.hasShield) items.push('🛡️ Bouclier')
        if (state.inventory.length > 0) {
            state.inventory.forEach(item => items.push(item))
        }
        
        items.forEach(item => {
            const span = document.createElement('span')
            span.className = 'inventory-item'
            span.textContent = item
            inventoryElement.appendChild(span)
        })
    }
}

function initializeUI() {
    if (!statsElement) {
        const statsDiv = document.createElement('div')
        statsDiv.id = 'stats'
        statsDiv.innerHTML = `
            <div class="health-container">
                <div class="health-bar">
                    <div id="health-bar" class="health-fill"></div>
                </div>
                <span id="health-text">❤️ 100/100</span>
            </div>
            <div id="gold-text">💰 0</div>
            <div id="inventory" class="inventory"></div>
        `
        document.body.insertBefore(statsDiv, document.querySelector('.container'))
    }
    
    const saveBtn = document.createElement('button')
    saveBtn.textContent = '💾 Sauvegarder'
    saveBtn.className = 'save-btn'
    saveBtn.onclick = saveGame
    document.body.appendChild(saveBtn)
    
    const loadBtn = document.createElement('button')
    loadBtn.textContent = '📂 Charger'
    loadBtn.className = 'load-btn'
    loadBtn.onclick = () => {
        if (loadGame()) {
            showTextNode(Math.max(...state.visitedNodes))
        } else {
            alert('Aucune sauvegarde trouvée')
        }
    }
    document.body.appendChild(loadBtn)
}