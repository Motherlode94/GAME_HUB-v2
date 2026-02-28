// ========================
// ARC 4 : QUÊTE DU TROLL DES MONTAGNES
// ========================

const nodesTrollQuest = [
{
    id: 20,
    text: "👹 BOSS FIGHT ! Le Troll des Montagnes apparaît ! Santé: {health}",
    options: [
        { 
            text: "⚔️ Attaquer avec l'épée", 
            nextText: 73,
            requiredState: (state) => state.hasSword,
            setState: (state) => {
                state.health -= 30
            }
        },
        { 
            text: "🛡️ Défense stratégique", 
            nextText: 74,
            requiredState: (state) => state.hasShield,
            setState: (state) => {
                state.health -= 15
            }
        },
        { 
            text: "🏃 Battre en retraite", 
            nextText: 75,
            setState: (state) => {
                state.health -= 20
            }
        }
    ]
},
{
    id: 73,
    text: "⚔️ Vous frappez le troll ! Il vacille... Un dernier coup ?",
    options: [
        { 
            text: "💥 Coup final !", 
            nextText: 76,
            setState: (state) => {
                state.gold += 100
                state.inventory.push('💀 Crâne de Troll')
            }
        },
        { 
            text: "🎯 Viser les jambes", 
            nextText: 77,
            setState: (state) => {
                state.gold += 80
            }
        }
    ]
},
{
    id: 74,
    text: "🛡️ Votre bouclier absorbe les coups ! Le troll est fatigué.",
    options: [
        { 
            text: "⚔️ Contre-attaquer maintenant", 
            nextText: 76,
            requiredState: (state) => state.hasSword,
            setState: (state) => {
                state.gold += 120
                state.inventory.push('💀 Crâne de Troll')
            }
        },
        { 
            text: "🏃 Fuir pendant qu'il récupère", 
            nextText: 4 
        }
    ]
},
{
    id: 75,
    text: "🏃 Vous fuyez dans la forêt. Le troll abandonne la poursuite.",
    options: [
        { 
            text: "🔄 Retenter le combat", 
            nextText: 20,
            setState: (state) => {
                state.health = Math.min(state.maxHealth, state.health + 20)
            }
        },
        { 
            text: "🚶 Chercher un autre chemin", 
            nextText: 78 
        }
    ]
},
{
    id: 76,
    text: "🏆 VICTOIRE ÉPIQUE ! Le troll s'effondre. +200 XP, +100 or ! Niveau 5 atteint !",
    options: [
        { 
            text: "🎖️ Retourner au village en héros", 
            nextText: 22,
            setState: (state) => {
                state.maxHealth += 20
                state.health += 20
            }
        },
        { 
            text: "🗺️ Explorer la caverne du troll", 
            nextText: 79 
        }
    ]
},
{
    id: 77,
    text: "🎯 Le troll tombe à genoux ! Vous gagnez le combat. +200 XP, +80 or.",
    options: [
        { 
            text: "🎖️ Retourner au village", 
            nextText: 22 
        },
        { 
            text: "🕳️ Fouiller sa tanière", 
            nextText: 79 
        }
    ]
},
{
    id: 78,
    text: "🌲 Vous trouvez un sentier secret menant à une clairière mystique.",
    options: [
        { 
            text: "✨ Explorer la clairière", 
            nextText: 80 
        },
        { 
            text: "⬅️ Retourner au village", 
            nextText: 4 
        }
    ]
},
{
    id: 79,
    text: "💎 TRÉSOR LÉGENDAIRE ! 250 or + Épée enchantée + Armure runique !",
    options: [
        { 
            text: "💰 Tout prendre", 
            nextText: 81,
            setState: (state) => {
                state.gold += 250
                state.hasSword = true
                state.hasShield = true
                state.inventory.push('⚔️ Épée Enchantée', '🛡️ Armure Runique')
            }
        }
    ]
},
{
    id: 80,
    text: "🧚 Une fée apparaît : 'Héros, je peux t'offrir un pouvoir...'",
    options: [
        { 
            text: "💪 Force surhumaine", 
            nextText: 82,
            setState: (state) => {
                state.maxHealth += 50
                state.health += 50
            }
        },
        { 
            text: "✨ Magie de soin", 
            nextText: 83,
            setState: (state) => {
                state.inventory.push('✨ Régénération')
                state.health = state.maxHealth
            }
        },
        { 
            text: "💰 Richesse infinie", 
            nextText: 84,
            setState: (state) => {
                state.gold += 500
            }
        }
    ]
},
{
    id: 81,
    text: "⚡ Équipement légendaire obtenu ! Vous êtes maintenant invincible !",
    options: [
        { 
            text: "👑 Conquérir le royaume", 
            nextText: 85 
        },
        { 
            text: "🏡 Vivre en paix au village", 
            nextText: 22 
        }
    ]
}
]