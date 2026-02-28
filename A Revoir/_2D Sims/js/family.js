// ============================================================================
// FAMILY TREE & INHERITANCE SYSTEM
// ============================================================================

function Family() {
    this.families = {}; // familyId -> Family data
    this.members = {}; // characterId -> familyId
}

Family.prototype.createFamily = function(founderId, surname) {
    const familyId = 'fam_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    this.families[familyId] = {
        id: familyId,
        surname: surname,
        founder: founderId,
        members: [founderId],
        tree: {
            [founderId]: {
                parents: [],
                children: [],
                spouse: null,
                siblings: []
            }
        },
        wealth: 0,
        heirlooms: [],
        reputation: 50
    };
    
    this.members[founderId] = familyId;
    return familyId;
};

Family.prototype.marry = function(char1Id, char2Id) {
    const fam1 = this.members[char1Id];
    const fam2 = this.members[char2Id];
    
    // Si un des deux n'a pas de famille, rejoindre celle de l'autre
    let targetFamily = fam1 || fam2;
    
    if (!targetFamily) {
        // Créer une nouvelle famille
        targetFamily = this.createFamily(char1Id, 'Family');
    }
    
    // Ajouter les deux à la famille
    if (!this.families[targetFamily].tree[char1Id]) {
        this.addMember(targetFamily, char1Id);
    }
    if (!this.families[targetFamily].tree[char2Id]) {
        this.addMember(targetFamily, char2Id);
    }
    
    // Enregistrer le mariage
    this.families[targetFamily].tree[char1Id].spouse = char2Id;
    this.families[targetFamily].tree[char2Id].spouse = char1Id;
    
    return {
        type: 'marriage',
        spouses: [char1Id, char2Id],
        family: targetFamily,
        timestamp: Time.current
    };
};

Family.prototype.haveBaby = function(parent1Id, parent2Id, babyId) {
    const familyId = this.members[parent1Id];
    if (!familyId) return null;
    
    this.addMember(familyId, babyId);
    
    const tree = this.families[familyId].tree;
    tree[babyId] = {
        parents: [parent1Id, parent2Id],
        children: [],
        spouse: null,
        siblings: []
    };
    
    // Ajouter aux enfants des parents
    tree[parent1Id].children.push(babyId);
    tree[parent2Id].children.push(babyId);
    
    // Gérer les frères et sœurs
    const siblings = [...tree[parent1Id].children];
    siblings.forEach(sibId => {
        if (sibId !== babyId) {
            tree[babyId].siblings.push(sibId);
            tree[sibId].siblings.push(babyId);
        }
    });
    
    return {
        type: 'birth',
        baby: babyId,
        parents: [parent1Id, parent2Id],
        family: familyId,
        timestamp: Time.current
    };
};

Family.prototype.addMember = function(familyId, charId) {
    if (!this.families[familyId]) return;
    
    if (!this.families[familyId].members.includes(charId)) {
        this.families[familyId].members.push(charId);
    }
    
    this.members[charId] = familyId;
    
    if (!this.families[familyId].tree[charId]) {
        this.families[familyId].tree[charId] = {
            parents: [],
            children: [],
            spouse: null,
            siblings: []
        };
    }
};

Family.prototype.handleDeath = function(deceasedId) {
    const familyId = this.members[deceasedId];
    if (!familyId) return null;
    
    const family = this.families[familyId];
    const node = family.tree[deceasedId];
    
    // Calculer l'héritage
    const inheritance = {
        deceased: deceasedId,
        wealth: 0,
        heirlooms: [],
        heirs: []
    };
    
    // Ordre de succession: conjoint > enfants > parents > frères/sœurs
    if (node.spouse && !this.isDead(node.spouse)) {
        inheritance.heirs.push({id: node.spouse, share: 0.5});
    }
    
    if (node.children.length > 0) {
        const aliveChildren = node.children.filter(id => !this.isDead(id));
        const childShare = 0.5 / Math.max(aliveChildren.length, 1);
        aliveChildren.forEach(childId => {
            inheritance.heirs.push({id: childId, share: childShare});
        });
    }
    
    return inheritance;
};

Family.prototype.isDead = function(charId) {
    // À implémenter selon votre système de personnages
    return false; // Placeholder
};

Family.prototype.getRelationType = function(char1Id, char2Id) {
    const fam1 = this.members[char1Id];
    const fam2 = this.members[char2Id];
    
    if (!fam1 || fam1 !== fam2) return 'stranger';
    
    const tree = this.families[fam1].tree;
    const node1 = tree[char1Id];
    const node2 = tree[char2Id];
    
    if (node1.spouse === char2Id) return 'spouse';
    if (node1.parents.includes(char2Id)) return 'parent';
    if (node1.children.includes(char2Id)) return 'child';
    if (node1.siblings.includes(char2Id)) return 'sibling';
    
    // Vérifier autres relations
    if (this.isGrandparent(char1Id, char2Id, tree)) return 'grandparent';
    if (this.isGrandchild(char1Id, char2Id, tree)) return 'grandchild';
    if (this.isAuntUncle(char1Id, char2Id, tree)) return 'aunt_uncle';
    if (this.isCousin(char1Id, char2Id, tree)) return 'cousin';
    
    return 'family';
};

Family.prototype.isGrandparent = function(char1Id, char2Id, tree) {
    const children = tree[char1Id].children;
    for (let childId of children) {
        if (tree[childId].children.includes(char2Id)) return true;
    }
    return false;
};

Family.prototype.isGrandchild = function(char1Id, char2Id, tree) {
    return this.isGrandparent(char2Id, char1Id, tree);
};

Family.prototype.isAuntUncle = function(char1Id, char2Id, tree) {
    const siblings = tree[char1Id].siblings;
    for (let sibId of siblings) {
        if (tree[sibId].children.includes(char2Id)) return true;
    }
    return false;
};

Family.prototype.isCousin = function(char1Id, char2Id, tree) {
    const parents = tree[char1Id].parents;
    for (let parentId of parents) {
        const siblings = tree[parentId].siblings;
        for (let auntUncleId of siblings) {
            if (tree[auntUncleId].children.includes(char2Id)) return true;
        }
    }
    return false;
};

// Instance globale
const FamilySystem = new Family();