// ========================
// ARC 2 : VILLAGE D'ELDORIA - HUB PRINCIPAL
// ========================

const nodesVillage = [
{
    id: 4,
    text: "🏘️ Village d'Eldoria atteint ! +50 XP. Les habitants vous accueillent comme un héros d'un autre monde. Santé: {health}, Or: {gold}",
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
        },
        {
            text:"🎮 Vérifier les quêtes système",
            nextText: 63
        }
    ]
},
{
    id: 10,
    text: "📜 QUÊTE PRINCIPALE : 'Vaincre le Troll des Montagnes'. Récompense : 100 or + 200 XP",
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
    id: 63,
    text: "💫 QUÊTE SYSTÈME : 'Éliminez 3 gobelins'. Récompense : Compétence [Vision Magique]",
    options: [
        { 
            text: "⚔️ Accepter la quête", 
            nextText: 64,
            requiredState: (state) => state.hasSword
        },
        { 
            text: "❌ Refuser et explorer", 
            nextText: 65
        }
    ]
},
{
    id: 64,
    text: "🎮 COMBAT ! Vous activez votre compétence passive. Les gobelins tombent. +150 XP, +30 or !",
    options: [
        { 
            text: "📊 Vérifier les gains", 
            nextText: 66,
            setState: (state) => {
                state.gold += 30
                state.inventory.push('👁️ Vision Magique')
            } 
        }
    ]
},
{
    id: 65,
    text: "🌟 Vous découvrez un portail dimensionnel. Une voix résonne : 'Donjon Niveau 1'",
    options: [
        { 
            text: "🚪 Entrer dans le donjon",
            nextText: 67
        },
        { 
            text: "🏃 Fuir prudemment",
            nextText: 4
        }
    ] 
},
{
    id: 66,
    text: "📈 NIVEAU UP ! Vos stats augmentent. Santé: {health}, Or: {gold}. Nouvelle quête disponible.",
    options: [
        { 
            text: "➡️ Continuer l'aventure", 
            nextText: 4,
            setState: (state) => {
                state.maxHealth += 20
                state.health += 20
            }
        }
    ]
},
{
    id: 67,
    text: "⚔️ BOSS DE DONJON ! Un ogre géant vous bloque. Santé: {health}",
    options: [
        { 
            text: "⚡ Utiliser Vision Magique", 
            nextText: 68,
            requiredState: (state) => state.inventory.includes('👁️ Vision Magique'),
            setState: (state) => {
                state.health -= 10
            }
        },
        { 
            text: "🗡️ Combat direct", 
            nextText: 69,
            setState: (state) => {
                state.health -= 50
            }
        },
        { 
            text: "🏃 Fuir le donjon", 
            nextText: 8 
        }
    ]
},
{
    id: 68,
    text: "✨ Vous voyez le point faible ! VICTOIRE ! Butin : 200 or + Armure Légendaire",
    options: [
        { 
            text: "💰 Tout récupérer", 
            nextText: 70,
            setState: (state) => {
                state.gold += 200
                state.hasShield = true
                state.inventory.push('🛡️ Armure Légendaire')
            }
        }
    ]
},
{
    id: 69,
    text: "💥 L'ogre vous terrasse. Le système affiche : 'Respawn disponible : -50 or'",
    options: [
        { 
            text: "🔄 Utiliser le respawn", 
            nextText: 67,
            requiredState: (state) => state.gold >= 50,
            setState: (state) => {
                state.gold -= 50
                state.health = state.maxHealth
            }
        },
        { 
            text: "💀 Abandonner", 
            nextText: 999 
        }
    ]
},
{
    id: 70,
    text: "🏆 TITRE DÉBLOQUÉ : 'Tueur d'Ogre'. Les habitants vous vénèrent comme un héros légendaire !",
    options: [
        { 
            text: "🎊 Célébrer la victoire", 
            nextText: 15 
        }
    ]
}
]