// ========================
// ARC 5 : DONJON - PIÈGES & BIBLIOTHÈQUE ANCIENNE
// ========================

const nodesDungeon = [
{
    id: 32,
    text: "🔥 Un piège s'active ! Des flammes jaillissent du sol. Santé: {health}",
    options: [
        { 
            text: "🚶‍♂️ Tenter d'esquiver", 
            nextText: 33,
            setState: (state) => {
                state.health -= 25
                if (state.hasShield) state.health += 15
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
                state.gold -= 5
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
    id: 34,
    text: "🛡️ Le bouclier vous protège efficacement des flammes !",
    options: [
        { text: "➡️ Continuer", nextText: 4 }
    ]
},
{
    id: 35,
    text: "💨 Vous échappez aux flammes de justesse !",
    options: [
        { text: "➡️ Continuer", nextText: 4 }
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
    id: 37,
    text: "⚠️ Vous continuez prudemment le chemin.",
    options: [
        { text: "➡️ Avancer", nextText: 4 }
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
    id: 39,
    text: "💰 Vous trouvez 35 pièces d'or cachées !",
    options: [
        { text: "➡️ Continuer", nextText: 4 }
    ]
},
{
    id: 40,
    text: "🚪 Vous sortez rapidement de la bibliothèque.",
    options: [
        { text: "➡️ Continuer", nextText: 4 }
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
    id: 42,
    text: "💾 Vous gardez le sort pour plus tard.",
    options: [
        { text: "➡️ Continuer", nextText: 43 }
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
    id: 45,
    text: "💥 Vous forcez la porte mais vous blessez. Santé: {health}",
    options: [
        { text: "➡️ Continuer malgré tout", nextText: 44 }
    ]
},
{
    id: 46,
    text: "🔍 Vous trouvez un passage alternatif.",
    options: [
        { text: "➡️ Emprunter le passage", nextText: 4 }
    ]
}
]