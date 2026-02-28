// ========================
// ARC 1 : RÉVEIL DANS UN AUTRE MONDE
// ========================

const nodesAwakening = [
{
    id: 1,
    text: "⚡ FLASH ! Vous vous réveillez dans un monde inconnu. Un écran translucide flotte devant vous : 'Système activé. Bienvenue, Invocateur.' Une épée rouillée gît à vos pieds.",
    options: [
        { 
            text: "⚔️ Prendre l'épée et vérifier le système", 
            nextText: 2,
            setState: (state) => {
                state.hasSword = true
                state.gold += 5
                state.inventory.push('📱 Interface Système')
            }
        },
        { 
            text: "🙈 Ignorer l'épée, explorer le système", 
            nextText: 3 
        },
        { 
            text: "🔍 Examiner l'écran de statut", 
            nextText: 6 
        }
    ]
},
{
    id: 2,
    text: "🐺 Un loup vous attaque ! Grâce à l'épée, vous le repoussez. +10 XP, +10 or. Le système enregistre votre victoire.",
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
    text: "🐺 Le loup attaque ! Le système affiche : 'Combat sans arme détecté. Dégâts doublés.' Santé: {health}",
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
    text: "📱 Interface Système activée. Stats : Niveau 1. Vous trouvez 20 pièces d'or dans un coffre.",
    options: [
        { 
            text: "⚔️💰 Prendre l'or et l'épée", 
            nextText: 2,
            setState: (state) => {
                state.hasSword = true
                state.gold += 20
                state.inventory.push('🗺️ Carte du monde')
            }
        },
        { 
            text: "💰 Prendre seulement l'or", 
            nextText: 3,
            setState: (state) => {
                state.gold += 20
            }
        }
    ]
},
{
    id: 7,
    text: "🕳️ Dans la tanière : un coffre piégé ! Tentez-vous votre chance ?",
    options: [
        { 
            text: "🔓 Ouvrir prudemment",
            nextText: 71,
            requiredState: (state) => state.inventory.includes('🗺️ Carte du monde')
        },
        { 
            text: "💥 Forcer le coffre",
            nextText: 72,
            setState: (state) => {
                state.health -= 30
            }
        },
        {
            text: "🚶 Ignorer et partir",
            nextText: 4
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
    id: 71,
    text: "✅ Coffre déverrouillé ! 50 or + Amulette de chance trouvés !",
    options: [
        { 
            text: "💰 Tout prendre", 
            nextText: 4,
            setState: (state) => {
                state.gold += 50
                state.inventory.push('⭐ Amulette de chance')
            }
        }
    ]
},
{
    id: 72,
    text: "💥 PIÈGE ! Vous êtes blessé mais trouvez 30 or. Santé: {health}",
    options: [
        { 
            text: "🩹 Se soigner et continuer", 
            nextText: 4,
            setState: (state) => {
                state.gold += 30
            }
        }
    ]
}
]