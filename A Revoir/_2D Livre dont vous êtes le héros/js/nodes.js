const textNodes = [
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
            nextText:63
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
    id: 59,
    text: "Vous fuyez comme un lâche... Le dragon détruit le village. FIN TRAGIQUE.",
    options: [
        { 
            text: "🔄uer", 
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