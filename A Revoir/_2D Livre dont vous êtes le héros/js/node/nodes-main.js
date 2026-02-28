// ========================
// FICHIER PRINCIPAL - COMBINE TOUS LES ARCS
// ========================

// Combiner tous les nodes en un seul array
const textNodes = [
    ...nodesAwakening,
    ...nodesVillage,
    ...nodesExploration,
    ...nodesTrollQuest,
    ...nodesDungeon,
    ...nodesDragonQuest,
    ...nodesEndings
]

// Trier par ID pour éviter les bugs
textNodes.sort((a, b) => a.id - b.id)

// Vérification des doublons (optionnel - pour debug)
const checkDuplicates = () => {
    const ids = textNodes.map(node => node.id)
    const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index)
    if (duplicates.length > 0) {
        console.error('⚠️ IDs en doublon détectés:', duplicates)
    } else {
        console.log('✅ Aucun doublon détecté')
    }
}

checkDuplicates()