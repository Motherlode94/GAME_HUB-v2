// ========================
// ARC 7 : TOUTES LES FINS DU JEU
// ========================

const nodesEndings = [
{
    id: 11,
    text: "🏰 Après un long voyage, vous arrivez au Royaume d'Éméraude. Les aventures vous attendent... Fin de cette histoire !",
    options: [
        { 
            text: "🔄 Recommencer", 
            nextText: -1 
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
    id: 82,
    text: "💪 Votre force est décuplée ! Les monstres vous craignent désormais.",
    options: [
        { 
            text: "⚔️ Partir en quête épique", 
            nextText: 86 
        },
        { 
            text: "🏘️ Protéger le village", 
            nextText: 4 
        }
    ]
},
{
    id: 83,
    text: "✨ Le pouvoir de régénération coule en vous. Santé: {health}/{maxHealth}",
    options: [
        { 
            text: "🌍 Explorer le monde", 
            nextText: 87 
        },
        { 
            text: "🏘️ Retour au village", 
            nextText: 4 
        }
    ]
},
{
    id: 84,
    text: "💰 Vos poches débordent d'or ! Or total: {gold}",
    options: [
        { 
            text: "🏰 Acheter un château", 
            nextText: 88 
        },
        { 
            text: "🎁 Partager avec le village", 
            nextText: 89 
        }
    ]
},
{
    id: 85,
    text: "👑 Vous conquérez le royaume ! Tous vous acclament comme roi légendaire !",
    options: [{ text: "🔄 Rejouer", nextText: -1 }]
},
{
    id: 86,
    text: "⚔️ Vous devenez le plus grand aventurier de tous les temps ! FIN HÉROÏQUE !",
    options: [{ text: "🔄 Rejouer", nextText: -1 }]
},
{
    id: 87,
    text: "🌍 Vous voyagez à travers le monde, aidant tous ceux dans le besoin. FIN NOBLE !",
    options: [{ text: "🔄 Rejouer", nextText: -1 }]
},
{
    id: 88,
    text: "🏰 Vous vivez dans un magnifique château. Or final: {gold}. FIN ROYALE !",
    options: [{ text: "🔄 Rejouer", nextText: -1 }]
},
{
    id: 89,
    text: "🎁 Votre générosité rend tout le village prospère ! FIN PHILANTHROPIQUE !",
    options: [{ text: "🔄 Rejouer", nextText: -1 }]
},
{
    id: 999,
    text: "💀 GAME OVER - Le système se désactive. 'Connexion perdue. Respawn impossible.'",
    options: [
        { 
            text: "🔄 Réessayer", 
            nextText: -1 
        }
    ]
}
]