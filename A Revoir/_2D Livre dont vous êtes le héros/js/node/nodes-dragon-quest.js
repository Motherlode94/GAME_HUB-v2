// ========================
// ARC 6 : QUÊTE DU DRAGON - BOSS FINAL ÉPIQUE
// ========================

const nodesDragonQuest = [
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
    id: 48,
    text: "⚔️ Vous vous préparez au combat... Rien ne se passe.",
    options: [
        { text: "👑 S'approcher du trône", nextText: 47 }
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
    id: 50,
    text: "👑 Vous prenez la couronne ! Le spectre disparaît en silence.",
    options: [
        { text: "🚪 Quitter la salle", nextText: 15 }
    ]
},
{
    id: 51,
    text: "⚔️ Le spectre vous maudit ! Santé: {health}",
    options: [
        { 
            text: "🏃 Fuir la salle", 
            nextText: 4,
            setState: (state) => {
                state.health -= 30
            }
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
    id: 56,
    text: "🧪 Vous préparez des potions de force.",
    options: [
        { 
            text: "⚔️ Affronter le dragon", 
            nextText: 54,
            setState: (state) => {
                state.gold -= 50
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
    id: 58,
    text: "🛡️ Vous vous défendez et contre-attaquez ! Le dragon recule !",
    options: [
        { text: "⚔️ Porter le coup final", nextText: 57 }
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
}
]