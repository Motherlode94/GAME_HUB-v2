// js/game/governor.js - profils IA legers pour harmoniser le gameplay
const EmpireGovernor = {
    profiles: {
        magnat: {
            label: "Magnat",
            buildPriority: ["Marché", "Mine", "Maison", "Ferme", "Barracks"],
            soldierRatio: 0.08,
            taxRate: 0.16,
            reserveGold: 140
        },
        guerrier: {
            label: "Guerrier",
            buildPriority: ["Barracks", "Mine", "Maison", "Ferme", "Marché"],
            soldierRatio: 0.22,
            taxRate: 0.13,
            reserveGold: 90
        },
        scientifique: {
            label: "Scientifique",
            buildPriority: ["Marché", "Maison", "Mine", "Ferme", "Barracks"],
            soldierRatio: 0.12,
            taxRate: 0.12,
            reserveGold: 120
        },
        pacifique: {
            label: "Pacifique",
            buildPriority: ["Ferme", "Maison", "Marché", "Mine", "Barracks"],
            soldierRatio: 0.05,
            taxRate: 0.1,
            reserveGold: 150
        },
        neutre: {
            label: "Neutre",
            buildPriority: ["Maison", "Ferme", "Mine", "Marché", "Barracks"],
            soldierRatio: 0.14,
            taxRate: 0.12,
            reserveGold: 110
        }
    },

    currentProfile: "neutre",
    tickCounter: 0,

    init() {
        const saved = localStorage.getItem("empire_governor_profile");
        if (saved && this.profiles[saved]) {
            this.currentProfile = saved;
        }
    },

    getProfile() {
        return this.profiles[this.currentProfile] || this.profiles.neutre;
    },

    setProfile(profileId, silent = false) {
        if (!this.profiles[profileId]) return false;
        this.currentProfile = profileId;
        localStorage.setItem("empire_governor_profile", profileId);
        if (!silent && typeof UI !== "undefined") {
            UI.notify(`Gouverneur: profil ${this.getProfile().label}`, "info");
        }
        return true;
    },

    cycleProfile() {
        const keys = Object.keys(this.profiles);
        const index = keys.indexOf(this.currentProfile);
        const next = keys[(index + 1) % keys.length];
        this.setProfile(next, false);
    },

    isTileOccupied(x, y) {
        return gameState.buildings.some((b) => b.x === x && b.y === y) ||
            gameState.underConstruction.some((b) => b.x === x && b.y === y);
    },

    findEmptyTile() {
        if (typeof Map === "undefined") return null;

        for (let i = 0; i < 60; i += 1) {
            const x = Math.floor(Math.random() * Map.cols);
            const y = Math.floor(Math.random() * Map.rows);
            if (!this.isTileOccupied(x, y)) {
                return { x, y };
            }
        }

        for (let y = 0; y < Map.rows; y += 1) {
            for (let x = 0; x < Map.cols; x += 1) {
                if (!this.isTileOccupied(x, y)) {
                    return { x, y };
                }
            }
        }

        return null;
    },

    chooseBuilding(profile) {
        const pop = Number(gameState.population.current) || 0;
        const maxPop = Number(gameState.population.maxPop) || 10;
        const food = Number(gameState.resources.food) || 0;

        if (maxPop > 0 && pop / maxPop > 0.84) return "Maison";
        if (food < pop * 1.4) return "Ferme";

        for (const name of profile.buildPriority) {
            const info = Buildings.types[name];
            if (!info) continue;
            if ((Number(gameState.resources.gold) || 0) >= info.cost + profile.reserveGold) {
                return name;
            }
        }

        return null;
    },

    manageConstruction(profile) {
        if (gameState.underConstruction.length >= 2) return;

        const name = this.chooseBuilding(profile);
        if (!name) return;

        const tile = this.findEmptyTile();
        if (tile) {
            Buildings.place(name, tile.x, tile.y);
            return;
        }

        const toUpgrade = gameState.buildings.find((b) => b.name === name);
        if (toUpgrade) {
            Buildings.upgrade(toUpgrade.x, toUpgrade.y);
        }
    },

    manageArmy(profile) {
        if (typeof Army === "undefined") return;

        const civilians = Math.max(1, Number(gameState.population.current) || 1);
        const currentSoldiers = Math.max(0, Number(gameState.army.soldiers) || 0);
        const targetSoldiers = Math.max(0, Math.floor(civilians * profile.soldierRatio));

        if (currentSoldiers + 3 <= targetSoldiers) {
            const maxRecruitable = Army.calculateMaxRecruitable();
            if (maxRecruitable > 0) {
                Army.recruit(Math.min(2, maxRecruitable));
            }
            return;
        }

        if (currentSoldiers > targetSoldiers + 5) {
            Army.disband(Math.min(2, currentSoldiers - targetSoldiers));
        }
    },

    applyTaxPolicy(profile) {
        if (!gameState.economy) return;
        gameState.economy.taxRate = profile.taxRate;
    },

    update() {
        if (window.gamePaused) return;
        this.tickCounter += 1;

        const profile = this.getProfile();
        this.applyTaxPolicy(profile);

        if (this.tickCounter % 10 === 0) {
            this.manageArmy(profile);
        }

        if (this.tickCounter % 14 === 0) {
            this.manageConstruction(profile);
        }
    }
};

EmpireGovernor.init();
window.EmpireGovernor = EmpireGovernor;
