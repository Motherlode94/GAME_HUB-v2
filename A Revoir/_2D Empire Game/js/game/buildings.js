// js/game/buildings.js
const Buildings = {
    types: {
        'Château': { cost: 0, prod: 2, type: 'gold', prodFood: 2, workers: 0, buildTime: 0, housing: 10 },
        'Ferme': { cost: 50, prod: 5, type: 'food', workers: 3, buildTime: 5, housing: 0 },
        'Mine': { cost: 80, prod: 3, type: 'gold', workers: 5, buildTime: 10, housing: 0 },
        'Maison': { cost: 40, prod: 0, type: 'housing', workers: 0, buildTime: 4, housing: 5 },
        'Marché': { cost: 100, prod: 2, type: 'gold', workers: 2, buildTime: 15, housing: 0 },
        'Barracks': { cost: 150, prod: 0, type: 'military', workers: 10, buildTime: 12, housing: 0 }
    },

    normalizeText(value) {
        return String(value || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .trim();
    },

    resolveBuildingName(rawName) {
        if (!rawName) return null;
        if (this.types[rawName]) return rawName;

        const keyMap = {
            farm: 'Ferme',
            house: 'Maison',
            mine: 'Mine',
            market: 'Marché',
            marche: 'Marché',
            barracks: 'Barracks',
            chateau: 'Château'
        };

        const mapped = keyMap[this.normalizeText(rawName)] || rawName;
        const resolved = Object.keys(this.types).find(
            (name) => this.normalizeText(name) === this.normalizeText(mapped)
        );
        return resolved || null;
    },

    // Step 1: choose a building from panel
    select(buildingName) {
        const resolvedName = this.resolveBuildingName(buildingName);
        if (!resolvedName) return;

        window.currentSelection = resolvedName;
        UI.notify(`Construction selectionnee : ${resolvedName}. Cliquez sur la carte.`);
    },

    // Step 2: place a building on map
    place(buildingName, x, y) {
        const resolvedName = this.resolveBuildingName(buildingName);
        const b = this.types[resolvedName];
        if (!b) return;

        if (typeof Map !== 'undefined') {
            if (x < 0 || y < 0 || x >= Map.cols || y >= Map.rows) {
                UI.notify("Position invalide: hors carte.");
                window.currentSelection = null;
                return;
            }
        }

        if (gameState.resources.gold < b.cost) {
            UI.notify("Pas assez d'or !");
            window.currentSelection = null;
            return;
        }

        const isOccupied = gameState.buildings.some((build) => build.x === x && build.y === y) ||
            gameState.underConstruction.some((build) => build.x === x && build.y === y);

        if (isOccupied) {
            this.upgrade(x, y);
            return;
        }

        gameState.resources.gold -= b.cost;

        gameState.underConstruction.push({
            name: resolvedName,
            x: x,
            y: y,
            timeLeft: b.buildTime,
            totalTime: b.buildTime
        });

        UI.notify(`Chantier demarre : ${resolvedName}`);
        window.currentSelection = null;
    },

    // Step 3: upgrade existing building
    upgrade(x, y) {
        const b = gameState.buildings.find((build) => build.x === x && build.y === y);
        if (!b) return;

        const baseStats = this.types[b.name];
        if (!baseStats) return;

        const upgradeCost = baseStats.cost * (b.level || 1);

        if (gameState.resources.gold >= upgradeCost) {
            gameState.resources.gold -= upgradeCost;
            b.level = (b.level || 1) + 1;

            if (typeof State !== 'undefined' && State.calculateProduction) {
                State.calculateProduction();
            }
            UI.notify(`${b.name} ameliore au Niveau ${b.level} !`);

            if (b.name === 'Maison' && typeof Citizens !== 'undefined') {
                this.createCitizenForHouse(b);
            }
        } else {
            UI.notify(`Or insuffisant pour l'amelioration (${upgradeCost} requis)`);
        }
    },

    // Step 4: update active constructions each tick
    updateConstruction() {
        for (let i = gameState.underConstruction.length - 1; i >= 0; i -= 1) {
            const chantier = gameState.underConstruction[i];
            chantier.timeLeft -= 1;

            if (chantier.timeLeft <= 0) {
                const newBuilding = {
                    name: chantier.name,
                    x: chantier.x,
                    y: chantier.y,
                    level: 1
                };

                gameState.buildings.push(newBuilding);
                gameState.underConstruction.splice(i, 1);

                if (typeof State !== 'undefined' && State.calculateProduction) {
                    State.calculateProduction();
                }
                UI.notify(`Batiment termine : ${chantier.name} !`);

                this.onBuildingCompleted(newBuilding);
            }
        }
    },

    onBuildingCompleted(building) {
        if (typeof Citizens !== 'undefined') {
            if (building.name === 'Maison') {
                this.createCitizensForNewHouse(building);
            }

            if (Citizens.onBuildingBuilt) {
                Citizens.onBuildingBuilt(building);
            }
        }

        if (building.name === 'Maison') {
            this.updatePopulationForNewHouse();
        }
    },

    createCitizensForNewHouse(building) {
        if (typeof Citizens === 'undefined') return;

        const citizensToCreate = 2 + Math.floor(Math.random() * 2);
        for (let i = 0; i < citizensToCreate; i += 1) {
            const citizen = Citizens.createCitizen();
            if (!citizen) continue;
            Citizens.placeAtBuilding(citizen, building);
            citizen.home = building;
        }
    },

    createCitizenForHouse(building) {
        if (typeof Citizens === 'undefined') return;

        const citizen = Citizens.createCitizen();
        if (!citizen) return;

        Citizens.placeAtBuilding(citizen, building);
        citizen.home = building;
    },

    updatePopulationForNewHouse() {
        const houses = gameState.buildings.filter((b) => b.name === 'Maison').length;
        const houseCapacity = houses * 5;

        if (gameState.population.current < houseCapacity) {
            const increase = Math.min(3, houseCapacity - gameState.population.current);
            gameState.population.current += increase;
            gameState.population.total = gameState.population.current;

            UI.notify(`Nouvelle maison construite ! Population +${increase}`);

            if (typeof UI !== 'undefined') {
                UI.refresh();
            }
        }
    }
};
