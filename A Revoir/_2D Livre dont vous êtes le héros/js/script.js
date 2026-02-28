const textElement = document.getElementById('text')
const optionButtonsElement = document.getElementById('option-buttons')
const statsElement = document.getElementById('stats')
const soundEffects = {
    click: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-select-click-1109.mp3'),
    sword: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-sword-slash-2760.mp3'),
    coin: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-coin-win-notification-1998.mp3'),
    heal: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-magic-wand-woosh-2334.mp3')
}

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

// Sauvegarde locale
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
    
    // Marquer comme visité
    state.visitedNodes.add(textNodeIndex)
    
    // Animation d'entrée
    textElement.style.opacity = '0'
    setTimeout(() => {
        let displayText = textNode.text
            .replace(/{health}/g, state.health)
            .replace(/{gold}/g, state.gold)
            .replace(/{maxHealth}/g, state.maxHealth)
        
        textElement.innerText = displayText
        textElement.style.opacity = '1'
    }, 200)
    
    // Nettoyer les boutons
    while (optionButtonsElement.firstChild) {
        optionButtonsElement.removeChild(optionButtonsElement.firstChild)
    }
    
    // Créer les boutons avec animations
    textNode.options.forEach((option, index) => {
        if (option.requiredState && !option.requiredState(state)) {
            return
        }
        
        const button = document.createElement('button')
        button.innerText = option.text
        button.className = 'btn'
        button.style.animationDelay = `${index * 0.1}s`
        
        // Tooltip pour les conditions
        if (option.requiredState) {
            button.title = getRequirementText(option.requiredState)
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

function getRequirementText(requiredStateFunc) {
    const requirements = []
    const testState = {
        hasSword: false,
        hasShield: false,
        gold: 0,
        health: 0
    }
    
    // Cette fonction devra être adaptée selon vos besoins spécifiques
    return "Conditions requises"
}

function selectOption(option) {
    // Appliquer les effets sonores
    if (option.setState) {
        const oldState = {...state}
        option.setState(state)
        
        // Jouer des sons selon les changements
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

function playSound(type) {
    if (soundEffects[type]) {
        soundEffects[type].currentTime = 0
        soundEffects[type].play().catch(e => console.log("Audio error:", e))
    }
}

// Nœuds manquants ajoutés
const textNodes = [
    {
        id: 1,
        text: "🌲 Vous vous réveillez dans une forêt sombre. Devant vous se trouve une épée rouillée. Le vent souffle doucement à travers les arbres.",
        options: [
            { 
                text: "⚔️ Prendre l'épée", 
                nextText: 2,
                setState: (state) => {
                    state.hasSword = true
                    state.gold += 5
                    state.inventory.push('🗺️ Carte partielle')
                }
            },
            { 
                text: "🙈 Ignorer l'épée", 
                nextText: 3 
            },
            { 
                text: "🔍 Chercher autour de l'épée", 
                nextText: 6 
            }
        ]
    },
    {
        id: 2,
        text: "Le loup recule devant votre épée ! Vous trouvez 10 pièces d'or sur son passage. Votre courage est récompensé.",
        options: [
            { 
                text: "🚶‍♂️ Continuer le chemin", 
                nextText: 4 
            },
            { 
                text: "🌳 Se reposer près d'un arbre", 
                nextText: 5,
                setState: (state) => {
                    state.health = Math.min(state.maxHealth, state.health + 30)
                }
            },
            { 
                text: "🕳️ Explorer la tanière du loup", 
                nextText: 7 
            }
        ]
    },
    {
        id: 3,
        text: "🐺 Le loup attaque ! Sans arme, vous subissez de graves blessures. Santé: {health}",
        options: [
            { 
                text: "🏃‍♂️ Tenter de fuir", 
                nextText: 8,
                setState: (state) => {
                    state.health -= 20
                }
            },
            { 
                text: "👊 Se défendre avec les mains", 
                nextText: 9,
                setState: (state) => {
                    state.health -= 40
                }
            }
        ]
    },
    {
        id: 4,
        text: "🏡 Vous arrivez au village. Les villageois sont impressionnés par votre bravoure. Santé: {health}, Or: {gold}",
        options: [
            { 
                text: "🛡️ Accepter le bouclier", 
                nextText: 10,
                setState: (state) => {
                    state.hasShield = true
                    state.inventory.push('🍖 Viande séchée')
                }
            },
            { 
                text: "👋 Refuser poliment", 
                nextText: 11 
            }
        ]
    },
    {
        id: 5,
        text: "Vous vous reposez sous un vieux chêne. Un bruit suspect vient des buissons...",
        options: [
            { 
                text: "🔦 Investiguer le bruit", 
                nextText: 12 
            },
            { 
                text: "⚡ Partir rapidement", 
                nextText: 13 
            },
            { 
                text: "🎯 Préparer une embuscade", 
                nextText: 14,
                requiredState: (state) => state.hasSword
            }
        ]
    },
    {
        id: 6,
        text: "🎁 Vous trouvez un sac caché avec 20 pièces d'or ! Une carte partielle est glissée à l'intérieur.",
        options: [
            { 
                text: "⚔️💰 Prendre l'or et l'épée", 
                nextText: 2,
                setState: (state) => {
                    state.hasSword = true
                    state.gold += 20
                    state.inventory.push('🗺️ Carte complète')
                }
            },
            { 
                text: "💰 Prendre seulement l'or", 
                nextText: 3 
            }
        ]
    },
    {
        id: 7,
        text: "💎 TRÉSOR TROUVÉ ! 50 pièces d'or et une potion de soin magique.",
        options: [
            { 
                text: "💊🍶 Tout prendre", 
                nextText: 15,
                setState: (state) => {
                    state.gold += 50
                    state.health = state.maxHealth
                    state.inventory.push('⭐ Amulette de chance')
                }
            },
            { 
                text: "💰 Prendre seulement l'or", 
                nextText: 15,
                setState: (state) => {
                    state.gold += 50
                }
            }
        ]
    },
    {
        id: 8,
        text: "💨 Vous fuyez vers une rivière. L'eau semble pure et fraîche.",
        options: [
            { 
                text: "💧 Boire de l'eau", 
                nextText: 16,
                setState: (state) => {
                    state.health = Math.min(state.maxHealth, state.health + 10)
                }
            },
            { 
                text: "🌊 Suivre la rivière", 
                nextText: 17 
            }
        ]
    },
    {
        id: 9,
        text: "🧙‍♂️ Un ermite vous trouve inconscient et vous soigne avec des herbes médicinales.",
        options: [
            { 
                text: "🙏 Repartir en remerciant", 
                nextText: 18 
            },
            { 
                text: "🏠 Demander l'hospitalité", 
                nextText: 19 
            }
        ]
    },
    {
        id: 10,
        text: "📜 Le chef du village vous propose une quête dangereuse : vaincre le troll des montagnes. Récompense : 100 pièces d'or.",
        options: [
            { 
                text: "✅ Accepter la quête", 
                nextText: 20 
            },
            { 
                text: "❌ Refuser", 
                nextText: 21 
            }
        ]
    },
    {
        id: 11,
        text: "🏰 Après un long voyage, vous arrivez au Royaume d'Émeraude. Les aventures vous attendent... Fin de cette histoire !",
        options: [
            { 
                text: "🔄 Recommencer", 
                nextText: -1 
            }
        ]
    },
    {
        id: 12,
        text: "🐿️ Ce n'était qu'un petit écureuil ! Il vous regarde avec curiosité.",
        options: [
            { 
                text: "➡️ Continuer", 
                nextText: 4 
            }
        ]
    },
    {
        id: 13,
        text: "👨‍🌾 Vous tombez sur un marchand qui propose une potion pour 30 pièces d'or.",
        options: [
            { 
                text: "💸 Acheter la potion (30 or)", 
                nextText: 23,
                requiredState: (state) => state.gold >= 30,
                setState: (state) => {
                    state.gold -= 30
                    state.health = Math.min(state.maxHealth, state.health + 50)
                }
            },
            { 
                text: "➡️ Continuer sans acheter", 
                nextText: 4 
            }
        ]
    },
    {
        id: 14,
        text: "🎪 Vous capturez un bandit ! Il vous offre 25 pièces d'or pour sa liberté.",
        options: [
            { 
                text: "💰 Accepter la rançon", 
                nextText: 24,
                setState: (state) => {
                    state.gold += 25
                }
            },
            { 
                text: "⚖️ Le livrer aux autorités", 
                nextText: 25 
            }
        ]
    },
    {
        id: 15,
        text: "👑 VICTOIRE ! Grâce à vos trésors, vous vivez dans l'opulence. Or final : {gold}",
        options: [
            { 
                text: "🔄 Rejouer", 
                nextText: -1 
            }
        ]
    },
    {
        id: 16,
        text: "✨ L'eau est magique ! Vous êtes complètement guéri. Santé: {health}",
        options: [
            { 
                text: "➡️ Continuer", 
                nextText: 4 
            }
        ]
    },
    {
        id: 17,
        text: "🌅 En suivant la rivière, vous découvrez une grotte mystérieuse.",
        options: [
            { 
                text: "🕯️ Explorer la grotte", 
                nextText: 26 
            },
            { 
                text: "⚠️ Éviter la grotte", 
                nextText: 27 
            }
        ]
    },
    {
        id: 18,
        text: "🌄 L'ermite vous donne des provisions avant votre départ.",
        options: [
            { 
                text: "➡️ Continuer le voyage", 
                nextText: 4,
                setState: (state) => {
                    state.inventory.push('🍞 Provisions')
                }
            }
        ]
    },
    {
        id: 19,
        text: "🏠 L'ermite vous enseigne des techniques de survie pendant votre séjour.",
        options: [
            { 
                text: "🎓 Apprendre et repartir", 
                nextText: 4,
                setState: (state) => {
                    state.maxHealth += 10
                    state.health += 10
                }
            }
        ]
    },
    {
        id: 20,
        text: "👹 COMBAT ÉPIQUE ! Grâce à votre équipement, vous vainquez le troll et gagnez 100 pièces d'or !",
        options: [
            { 
                text: "🎖️ Retourner au village", 
                nextText: 22 
            }
        ]
    },
    {
        id: 21,
        text: "🚶‍♂️ Vous quittez le village. Une caravane vous propose de vous accompagner.",
        options: [
            { 
                text: "🤝 Accepter", 
                nextText: 28 
            },
            { 
                text: "🚶‍♂️ Continuer seul", 
                nextText: 11 
            }
        ]
    },
    {
        id: 22,
        text: "🏆 HÉROS DU VILLAGE ! On vous offre une maison. Vous vivez heureux. Or final : {gold}",
        options: [
            { 
                text: "🔄 Recommencer", 
                nextText: -1 
            }
        ]
    },
    {
        id: 23,
        text: "💊 La potion vous redonne des forces instantanément.",
        options: [
            { 
                text: "➡️ Continuer", 
                nextText: 4 
            }
        ]
    },
    {
        id: 24,
        text: "💰 Le bandit vous paie et disparaît dans la forêt.",
        options: [
            { 
                text: "➡️ Continuer", 
                nextText: 4 
            }
        ]
    },
    {
        id: 25,
        text: "⚖️ Les villageois vous récompensent de 15 pièces d'or pour votre honnêteté.",
        options: [
            { 
                text: "➡️ Continuer", 
                nextText: 4,
                setState: (state) => {
                    state.gold += 15
                }
            }
        ]
    },
    {
        id: 26,
        text: "🦇 La grotte abrite une colonie de chauves-souris géantes !",
        options: [
            { 
                text: "⚔️ Combattre", 
                nextText: 29,
                requiredState: (state) => state.hasSword,
                setState: (state) => {
                    state.health -= 35
                    state.gold += 40
                }
            },
            { 
                text: "🏃‍♂️ Fuir", 
                nextText: 30,
                setState: (state) => {
                    state.health -= 10
                }
            }
        ]
    },
    {
        id: 27,
        text: "🌿 Vous contournez prudemment la grotte et continuez votre chemin.",
        options: [
            { 
                text: "➡️ Continuer", 
                nextText: 4 
            }
        ]
    },
    {
        id: 28,
        text: "🚐 La caravane vous amène rapidement à la capitale.",
        options: [
            { 
                text: "🏙️ Explorer la capitale", 
                nextText: 31 
            }
        ]
    },
    {
        id: 29,
        text: "🎖️ Vous vainquez les chauves-souris et trouvez un trésor !",
        options: [
            { 
                text: "➡️ Continuer", 
                nextText: 4 
            }
        ]
    },
    {
        id: 30,
        text: "💨 Vous fuyez en laissant tomber quelques pièces d'or.",
        options: [
            { 
                text: "➡️ Continuer", 
                nextText: 4,
                setState: (state) => {
                    state.gold = Math.max(0, state.gold - 5)
                }
            }
        ]
    },
    {
        id: 31,
        text: "🏛️ LA CAPITALE ! Vous avez de nombreuses opportunités devant vous... Fin de l'aventure !",
        options: [
            { 
                text: "🔄 Recommencer", 
                nextText: -1 
            }
        ]
    },
    {
    id: 32,
    text: "🔥 Un piège s'active ! Des flammes jaillissent du sol. Santé: {health}",
    options: [
        { 
            text: "🚶‍♂️ Tenter d'esquiver", 
            nextText: 33,
            setState: (state) => {
                state.health -= 25
                if (state.hasShield) state.health += 15 // Le bouclier aide
            }
        },
        { 
            text: "🛡️ Se protéger avec le bouclier",
            nextText: 34,
            requiredState: (state) => state.hasShield,
            setState: (state) => {
                state.health -= 10
            }
        },
        { 
            text: "💨 Courir à toute vitesse", 
            nextText: 35,
            setState: (state) => {
                state.health -= 15
                state.gold -= 5 // On perd de l'or en courant
            }
        }
    ]
},
{
    id: 33,
    text: "Vous survivez au piège mais êtes brûlé. Un passage secret s'ouvre...",
    options: [
        { 
            text: "🕵️‍♂️ Explorer le passage", 
            nextText: 36
        },
        { 
            text: "⚠️ Continuer prudemment", 
            nextText: 37
        }
    ]
},
{
    id: 36,
    text: "Dans le passage secret : une bibliothèque ancienne. Des livres de sorts poussiéreux...",
    options: [
        { 
            text: "📚 Étudier un livre de sorts", 
            nextText: 38,
            setState: (state) => {
                state.inventory.push('📖 Sort de guérison')
            }
        },
        { 
            text: "💰 Chercher des objets de valeur", 
            nextText: 39,
            setState: (state) => {
                state.gold += 35
            }
        },
        { 
            text: "🚪 Sortir rapidement", 
            nextText: 40
        }
    ]
},
{
    id: 38,
    text: "Vous apprenez un sort de guérison ! Santé: {health}",
    options: [
        { 
            text: "✨ Lancer le sort maintenant", 
            nextText: 41,
            setState: (state) => {
                state.health = Math.min(100, state.health + 40)
            }
        },
        { 
            text: "💾 Le garder pour plus tard", 
            nextText: 42
        }
    ]
},
{
    id: 41,
    text: "La magie vous soigne ! Vous vous sentez revigoré. Santé: {health}",
    options: [
        { 
            text: "➡️ Continuer l'exploration", 
            nextText: 43
        }
    ]
},
{
    id: 43,
    text: "Une porte en pierre bloque le chemin. Elle a trois serrures...",
    options: [
        { 
            text: "🔑 Utiliser une clé trouvée plus tôt", 
            nextText: 44,
            requiredState: (state) => state.inventory.includes('🗝️ Clé ancienne')
        },
        { 
            text: "💥 Forcer la porte", 
            nextText: 45,
            setState: (state) => {
                state.health -= 20
            }
        },
        { 
            text: "🔍 Chercher un autre chemin", 
            nextText: 46
        }
    ]
},
{
    id: 44,
    text: "La porte s'ouvre ! Une salle du trône apparaît...",
    options: [
        { 
            text: "👑 S'approcher du trône", 
            nextText: 47
        },
        { 
            text: "⚔️ Se préparer au combat", 
            nextText: 48
        }
    ]
},
{
    id: 47,
    text: "Sur le trône : une couronne étincelante et un spectre royal !",
    options: [
        { 
            text: "👻 Parler au spectre", 
            nextText: 49
        },
        { 
            text: "👑 Prendre la couronne", 
            nextText: 50,
            setState: (state) => {
                state.gold += 200
                state.inventory.push('👑 Couronne royale')
            }
        },
        { 
            text: "⚔️ Attaquer le spectre", 
            nextText: 51
        }
    ]
},
{
    id: 49,
    text: "Le spectre vous parle : 'Défends mon royaume du dragon qui approche...'",
    options: [
        { 
            text: "✅ Accepter la quête", 
            nextText: 52
        },
        { 
            text: "❌ Refuser", 
            nextText: 53
        }
    ]
},
{
    id: 52,
    text: "QUÊTE ÉPIQUE : Vous devez affronter un dragon !",
    options: [
        { 
            text: "🐉 Combattre immédiatement", 
            nextText: 54,
            setState: (state) => {
                // Combat très difficile
                state.health -= 60
                if (state.hasShield && state.hasSword) state.health += 30
            }
        },
        { 
            text: "🏹 Chercher des renforts", 
            nextText: 55
        },
        { 
            text: "🧪 Préparer des potions", 
            nextText: 56,
            requiredState: (state) => state.gold >= 50
        }
    ]
},
{
    id: 54,
    text: "COMBAT CONTRE LE DRAGON ! Santé restante: {health}",
    options: [
        { 
            text: "⚔️ Frapper le cœur", 
            nextText: 57,
            requiredState: (state) => state.health > 0
        },
        { 
            text: "🛡️ Se défendre et contre-attaquer", 
            nextText: 58,
            requiredState: (state) => state.hasShield && state.health > 0
        },
        { 
            text: "💨 Fuir le combat", 
            nextText: 59,
            setState: (state) => {
                state.health -= 40
            }
        }
    ]
},
{
    id: 57,
    text: "VICTOIRE ! Vous avez vaincu le dragon ! Trésor : 500 pièces d'or !",
    options: [
        { 
            text: "💰 Prendre le trésor", 
            nextText: 60,
            setState: (state) => {
                state.gold += 500
                state.inventory.push('🐉 Écaille de dragon')
            }
        }
    ]
},
{
    id: 60,
    text: "🏰 Vous êtes couronné roi ! Le royaume est sauvé. FIN ÉPIQUE ! Or: {gold}",
    options: [
        { 
            text: "🔄 Rejouer", 
            nextText: -1 
        }
    ]
},
{
    id: 59,
    text: "Vous fuyez comme un lâche... Le dragon détruit le village. FIN TRAGIQUE.",
    options: [
        { 
            text: "🔄 Rejouer", 
            nextText: -1 
        }
    ]
},
{
    id: 53,
    text: "Le spectre maudit votre lâcheté. Vous êtes banni du royaume. FIN AMÈRE.",
    options: [
        { 
            text: "🔄 Rejouer", 
            nextText: -1 
        }
    ]
},
{
    id: 55,
    text: "Vous recrutez des mercenaires (coût : 100 or). L'armée est prête !",
    options: [
        { 
            text: "⚔️ Lancer l'assaut", 
            nextText: 61,
            requiredState: (state) => state.gold >= 100,
            setState: (state) => {
                state.gold -= 100
            }
        }
    ]
},
{
    id: 61,
    text: "Avec votre armée, vous vainquez le dragon facilement ! Part du butin : 300 or.",
    options: [
        { 
            text: "💰 Prendre votre part", 
            nextText: 62,
            setState: (state) => {
                state.gold += 300
            }
        }
    ]
},
{
    id: 62,
    text: "Vous devenez un général célèbre. Le royaume vous honore. FIN GLORIEUSE !",
    options: [
        { 
            text: "🔄 Rejouer", 
            nextText: -1 
        }
    ]
},
    {
        id: 999,
        text: "💀 GAME OVER - Vos blessures sont trop graves. La forêt réclame son dû...",
        options: [
            { 
                text: "🔄 Réessayer", 
                nextText: -1 
            }
        ]
    }
]

// Démarrer le jeu
document.addEventListener('DOMContentLoaded', () => {
    // Ajouter les éléments UI s'ils n'existent pas
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
    
    // Bouton de sauvegarde
    const saveBtn = document.createElement('button')
    saveBtn.textContent = '💾 Sauvegarder'
    saveBtn.className = 'save-btn'
    saveBtn.onclick = saveGame
    document.body.appendChild(saveBtn)
    
    // Bouton de chargement
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
    
    startGame()
})