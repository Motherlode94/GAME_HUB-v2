function startGame() {
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
    showTextNode(1)
    updateStats()
}

function showTextNode(textNodeIndex) {
    const textNode = textNodes.find(node => node.id === textNodeIndex)
    if (!textNode) {
        console.error(`Text node ${textNodeIndex} not found`)
        return showTextNode(1)
    }
    
    state.visitedNodes.add(textNodeIndex)
    
    textElement.style.opacity = '0'
    setTimeout(() => {
        let displayText = textNode.text
            .replace(/{health}/g, state.health)
            .replace(/{gold}/g, state.gold)
            .replace(/{maxHealth}/g, state.maxHealth)
        
        textElement.innerText = displayText
        textElement.style.opacity = '1'
    }, 200)
    
    while (optionButtonsElement.firstChild) {
        optionButtonsElement.removeChild(optionButtonsElement.firstChild)
    }
    
    textNode.options.forEach((option, index) => {
        if (option.requiredState && !option.requiredState(state)) {
            return
        }
        
        const button = document.createElement('button')
        button.innerText = option.text
        button.className = 'btn'
        button.style.animationDelay = `${index * 0.1}s`
        
        if (option.requiredState) {
            button.title = "Conditions requises"
        }
        
        button.addEventListener('click', () => {
            playSound('click')
            selectOption(option)
        })
        
        optionButtonsElement.appendChild(button)
    })
    
    updateStats()
    saveGame()
}

function selectOption(option) {
    if (option.setState) {
        const oldState = {...state}
        option.setState(state)
        
        if (state.gold > oldState.gold) playSound('coin')
        if (state.health > oldState.health) playSound('heal')
        if (state.hasSword && !oldState.hasSword) playSound('sword')
    }
    
    const nextTextNodeId = option.nextText
    
    if (nextTextNodeId <= 0) {
        return startGame()
    }
    
    if (state.health <= 0) {
        return showTextNode(999)
    }
    
    showTextNode(nextTextNodeId)
}