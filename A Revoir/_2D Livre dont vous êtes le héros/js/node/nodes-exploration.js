// ========================
// ARC 3 : EXPLORATION - FORÊTS, RIVIÈRES & GROTTES
// ========================

const nodesExploration = [
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
}
]