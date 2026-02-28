// Diplomacy system for Empire Manager 2D
// Adds light AI personas to make neighboring empires react differently.

const Diplomacy = {
    states: {
        PEACE: 0,
        ALLIANCE: 1,
        WAR: 2,
        TRUCE: 3
    },

    personas: {
        magnat: {
            label: "Magnat",
            trait: "commerce avant tout",
            driftMin: -1,
            driftMax: 2,
            warThreshold: 15,
            warChance: 0.14,
            allianceThreshold: 72,
            allianceChance: 0.2,
            tradeBias: 1.25,
            emissaryBonus: 2,
            tributeBonus: 3,
            intimidationResist: 0.2,
            tradeYield: 13
        },
        guerrier: {
            label: "Guerrier",
            trait: "respecte la force",
            driftMin: -3,
            driftMax: 1,
            warThreshold: 30,
            warChance: 0.34,
            allianceThreshold: 84,
            allianceChance: 0.12,
            tradeBias: 0.65,
            emissaryBonus: 0,
            tributeBonus: 1,
            intimidationResist: 0.45,
            tradeYield: 8
        },
        scientifique: {
            label: "Scientifique",
            trait: "rationnel et prudent",
            driftMin: -2,
            driftMax: 2,
            warThreshold: 20,
            warChance: 0.16,
            allianceThreshold: 75,
            allianceChance: 0.19,
            tradeBias: 1,
            emissaryBonus: 2,
            tributeBonus: 2,
            intimidationResist: 0.25,
            tradeYield: 11
        },
        pacifique: {
            label: "Pacifique",
            trait: "evite les conflits",
            driftMin: 0,
            driftMax: 3,
            warThreshold: 10,
            warChance: 0.08,
            allianceThreshold: 65,
            allianceChance: 0.28,
            tradeBias: 1.05,
            emissaryBonus: 3,
            tributeBonus: 2,
            intimidationResist: 0.12,
            tradeYield: 10
        },
        neutre: {
            label: "Neutre",
            trait: "equilibre politique",
            driftMin: -2,
            driftMax: 2,
            warThreshold: 22,
            warChance: 0.18,
            allianceThreshold: 78,
            allianceChance: 0.16,
            tradeBias: 0.9,
            emissaryBonus: 1,
            tributeBonus: 1,
            intimidationResist: 0.25,
            tradeYield: 9
        }
    },

    empires: [],
    relations: {},
    lastCheckedMonth: null,
    monthlyIntervalId: null,

    init() {
        this.empires = this.generateEmpires();
        this.initializeRelations();
        this.setupDiplomacyEvents();
        this.syncDiplomacyState();
    },

    generateEmpires() {
        return [
            {
                id: 1,
                name: "Royaume du Nord",
                strength: 3,
                aggression: 2,
                wealth: 4,
                color: "#3498db",
                leader: "Roi Thorvald",
                persona: "neutre"
            },
            {
                id: 2,
                name: "Empire de l'Est",
                strength: 5,
                aggression: 4,
                wealth: 5,
                color: "#e74c3c",
                leader: "Empereur Chen",
                persona: "guerrier"
            },
            {
                id: 3,
                name: "Confederation du Sud",
                strength: 2,
                aggression: 1,
                wealth: 3,
                color: "#2ecc71",
                leader: "Chef Malik",
                persona: "pacifique"
            },
            {
                id: 4,
                name: "Principaute de l'Ouest",
                strength: 4,
                aggression: 3,
                wealth: 4,
                color: "#f39c12",
                leader: "Prince Lorenzo",
                persona: "magnat"
            }
        ];
    },

    initializeRelations() {
        this.relations = {};
        this.empires.forEach((empire) => {
            const persona = this.getPersona(empire.persona);
            const baseOpinion = 45 + Math.floor(Math.random() * 21); // 45..65
            const openingBias = empire.persona === "pacifique" ? 6 : (empire.persona === "guerrier" ? -5 : 0);
            this.relations[empire.id] = {
                state: this.states.PEACE,
                opinion: this.clampOpinion(baseOpinion + openingBias),
                lastContact: 0,
                tradeAgreement: false,
                hasAlliance: false,
                tribute: 0,
                persona: empire.persona || "neutre",
                tradeIncomePerMonth: persona.tradeYield || 10
            };
        });
    },

    getPersona(id) {
        return this.personas[id] || this.personas.neutre;
    },

    getStateText(state) {
        switch (state) {
            case this.states.PEACE:
                return "Paix";
            case this.states.ALLIANCE:
                return "Alliance";
            case this.states.WAR:
                return "Guerre";
            case this.states.TRUCE:
                return "Treve";
            default:
                return "Inconnu";
        }
    },

    getOpinionColor(opinion) {
        if (opinion >= 70) return "#2ecc71";
        if (opinion >= 40) return "#f39c12";
        return "#e74c3c";
    },

    clampOpinion(value) {
        return Math.max(0, Math.min(100, Math.floor(Number(value) || 0)));
    },

    getEmpireById(empireId) {
        return this.empires.find((e) => e.id === empireId) || null;
    },

    applyOpinionDelta(empireId, delta) {
        const relation = this.relations[empireId];
        if (!relation) return;
        relation.opinion = this.clampOpinion(relation.opinion + delta);
    },

    getGovernanceAffinity(personaId) {
        if (typeof EmpireGovernor === "undefined" || !EmpireGovernor.currentProfile) return 0;

        const profile = EmpireGovernor.currentProfile;
        const matrix = {
            magnat: { magnat: 2, guerrier: -1, scientifique: 1, pacifique: 1, neutre: 0 },
            guerrier: { magnat: -1, guerrier: 2, scientifique: 0, pacifique: -2, neutre: 0 },
            scientifique: { magnat: 1, guerrier: -1, scientifique: 2, pacifique: 1, neutre: 0 },
            pacifique: { magnat: 1, guerrier: -2, scientifique: 1, pacifique: 2, neutre: 1 },
            neutre: { magnat: 0, guerrier: 0, scientifique: 0, pacifique: 1, neutre: 1 }
        };

        return (matrix[profile] && Number.isFinite(matrix[profile][personaId]))
            ? matrix[profile][personaId]
            : 0;
    },

    syncDiplomacyState() {
        if (!gameState.diplomacy) gameState.diplomacy = {};
        gameState.diplomacy.relations = this.relations;

        gameState.diplomacy.wars = Object.keys(this.relations)
            .filter((id) => this.relations[id].state === this.states.WAR)
            .map((id) => Number(id));

        gameState.diplomacy.alliances = Object.keys(this.relations)
            .filter((id) => this.relations[id].state === this.states.ALLIANCE)
            .map((id) => Number(id));

        gameState.diplomacy.tradeAgreements = Object.keys(this.relations)
            .filter((id) => this.relations[id].tradeAgreement)
            .map((id) => Number(id));
    },

    openMenu() {
        const modalHtml = `
            <div class="diplomacy-modal" id="diplomacy-modal">
                <div class="modal-header">
                    <h2>Diplomatie</h2>
                    <button class="close-modal" onclick="this.closest('.diplomacy-modal').remove()">x</button>
                </div>
                <div class="diplomacy-content">
                    <div class="empires-list">
                        ${this.empires.map((empire) => this.createEmpireCard(empire)).join("")}
                    </div>
                    <div class="diplomacy-actions">
                        <h3>Actions diplomatiques</h3>
                        <div class="action-buttons">
                            <button class="btn-diplomacy" onclick="Diplomacy.sendEmissary()">
                                Envoyer un emissaire
                                <small>Cout: 50 Or</small>
                            </button>
                            <button class="btn-diplomacy" onclick="Diplomacy.proposeTrade()">
                                Proposer un commerce
                                <small>Plus fiable avec les empires marchands</small>
                            </button>
                            <button class="btn-diplomacy" onclick="Diplomacy.declareWar()">
                                Declarer la guerre
                                <small>Demande une armee solide</small>
                            </button>
                            <button class="btn-diplomacy" onclick="Diplomacy.offerTribute()">
                                Offrir un tribut
                                <small>+ opinion, -100 Or</small>
                            </button>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <p>Relations globales: <span id="global-relations">${this.getDiplomaticStatus()}</span></p>
                </div>
            </div>
        `;

        const existing = document.getElementById("diplomacy-modal");
        if (existing) existing.remove();
        document.body.insertAdjacentHTML("beforeend", modalHtml);
        this.updateDiplomacyDisplay();
    },

    createEmpireCard(empire) {
        const relation = this.relations[empire.id];
        const stateText = this.getStateText(relation.state);
        const opinionColor = this.getOpinionColor(relation.opinion);
        const persona = this.getPersona(empire.persona);

        return `
            <div class="empire-card" data-empire-id="${empire.id}">
                <div class="empire-header" style="border-left: 4px solid ${empire.color}">
                    <h4>${empire.name}</h4>
                    <span class="empire-leader">${empire.leader}</span>
                </div>
                <div class="empire-stats">
                    <div class="stat">
                        <span class="stat-label">Profil:</span>
                        <span class="stat-value">${persona.label}</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Doctrine:</span>
                        <span class="stat-value">${persona.trait}</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Relation:</span>
                        <span class="stat-value ${stateText.toLowerCase()}">${stateText}</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Opinion:</span>
                        <span class="stat-value opinion-value" style="color: ${opinionColor}">${relation.opinion}/100</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Force:</span>
                        <span class="stat-value">${"S".repeat(empire.strength)}</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Richesse:</span>
                        <span class="stat-value">${"$".repeat(empire.wealth)}</span>
                    </div>
                </div>
                <div class="empire-actions">
                    <button class="btn-small" onclick="Diplomacy.interactWithEmpire(${empire.id}, 'improve')">Ameliorer</button>
                    <button class="btn-small" onclick="Diplomacy.interactWithEmpire(${empire.id}, 'threaten')">Menacer</button>
                </div>
            </div>
        `;
    },

    interactWithEmpire(empireId, action) {
        const empire = this.getEmpireById(empireId);
        const relation = this.relations[empireId];
        if (!empire || !relation) return;

        const persona = this.getPersona(empire.persona);

        if (action === "improve") {
            if ((Number(gameState.resources.gold) || 0) < 30) {
                UI.notify("Pas assez d'or pour offrir un cadeau.", "warning");
                return;
            }
            gameState.resources.gold -= 30;
            this.applyOpinionDelta(empireId, 12 + persona.emissaryBonus);
            UI.notify(`Cadeau envoye a ${empire.name}.`, "success");
        }

        if (action === "threaten") {
            if ((Number(gameState.army.soldiers) || 0) < 25) {
                UI.notify("Votre armee est trop faible pour menacer.", "warning");
                return;
            }

            const armyPower = Number(gameState.army.soldiers) || 0;
            const empirePower = empire.strength * 25;
            const baseChance = 0.35 + ((armyPower - empirePower) / 300);
            const chance = Math.max(0.08, Math.min(0.85, baseChance - persona.intimidationResist));
            const success = Math.random() < chance;

            if (success) {
                this.applyOpinionDelta(empireId, -16);
                gameState.resources.gold += 50;
                UI.notify(`Menace reussie contre ${empire.name}. +50 Or`, "success");
            } else {
                this.applyOpinionDelta(empireId, -28);
                relation.state = this.states.WAR;
                relation.hasAlliance = false;
                UI.notify(`${empire.name} reagit violemment et vous declare la guerre.`, "error");
            }
        }

        this.syncDiplomacyState();
        this.updateDiplomacyDisplay();
    },

    sendEmissary() {
        if ((Number(gameState.resources.gold) || 0) < 50) {
            UI.notify("Pas assez d'or pour envoyer des emissaires.", "error");
            return;
        }

        gameState.resources.gold -= 50;
        this.empires.forEach((empire) => {
            const persona = this.getPersona(empire.persona);
            this.applyOpinionDelta(empire.id, 4 + persona.emissaryBonus);
        });

        UI.notify("Emissaires envoyes a toutes les cours voisines.", "success");
        this.syncDiplomacyState();
        this.updateDiplomacyDisplay();
    },

    proposeTrade() {
        let bestEmpire = null;
        let bestScore = Number.NEGATIVE_INFINITY;

        this.empires.forEach((empire) => {
            const relation = this.relations[empire.id];
            if (!relation || relation.state === this.states.WAR) return;

            const persona = this.getPersona(empire.persona);
            const score = relation.opinion + (persona.tradeBias * 12);
            if (score > bestScore) {
                bestScore = score;
                bestEmpire = empire;
            }
        });

        if (!bestEmpire) {
            UI.notify("Aucun empire disponible pour commercer.", "warning");
            return;
        }

        const relation = this.relations[bestEmpire.id];
        const persona = this.getPersona(bestEmpire.persona);
        const chance = Math.max(0.12, Math.min(0.92, 0.3 + (relation.opinion / 180) + (persona.tradeBias * 0.12)));

        if (Math.random() < chance) {
            relation.tradeAgreement = true;
            relation.tradeIncomePerMonth = persona.tradeYield;
            this.applyOpinionDelta(bestEmpire.id, 5);
            UI.notify(`Accord commercial signe avec ${bestEmpire.name}.`, "success");
        } else {
            this.applyOpinionDelta(bestEmpire.id, -4);
            UI.notify(`${bestEmpire.name} refuse l'accord commercial.`, "warning");
        }

        this.syncDiplomacyState();
        this.updateDiplomacyDisplay();
    },

    declareWar() {
        const eligible = this.empires.filter((empire) => {
            const relation = this.relations[empire.id];
            return relation && relation.state !== this.states.WAR;
        });

        if ((Number(gameState.army.soldiers) || 0) < 100) {
            UI.notify("Pas assez de soldats pour declarer la guerre.", "error");
            return;
        }
        if (eligible.length === 0) return;

        const target = eligible.reduce((worst, current) => {
            return this.relations[current.id].opinion < this.relations[worst.id].opinion ? current : worst;
        });

        if (!window.confirm(`Declarer la guerre a ${target.name} ?`)) return;

        const relation = this.relations[target.id];
        relation.state = this.states.WAR;
        relation.tradeAgreement = false;
        relation.hasAlliance = false;
        this.applyOpinionDelta(target.id, -18);

        UI.notify(`Guerre declaree contre ${target.name}.`, "error");
        this.syncDiplomacyState();
        this.updateDiplomacyDisplay();
    },

    offerTribute() {
        if ((Number(gameState.resources.gold) || 0) < 100) {
            UI.notify("Pas assez d'or pour offrir un tribut.", "warning");
            return;
        }

        const target = this.empires.reduce((worst, current) => {
            if (!worst) return current;
            const currentOpinion = this.relations[current.id].opinion;
            const worstOpinion = this.relations[worst.id].opinion;
            return currentOpinion < worstOpinion ? current : worst;
        }, null);

        if (!target) return;

        const relation = this.relations[target.id];
        const persona = this.getPersona(target.persona);

        gameState.resources.gold -= 100;
        relation.tribute += 100;
        this.applyOpinionDelta(target.id, 20 + persona.tributeBonus);

        if (relation.state === this.states.WAR) {
            relation.state = this.states.TRUCE;
            UI.notify(`Tribut accepte par ${target.name}. Une treve est ouverte.`, "success");
        } else {
            UI.notify(`Tribut accepte par ${target.name}.`, "success");
        }

        this.syncDiplomacyState();
        this.updateDiplomacyDisplay();
    },

    updateDiplomacyDisplay() {
        const cards = document.querySelectorAll(".empire-card");
        cards.forEach((card) => {
            const empireId = Number(card.dataset.empireId);
            const relation = this.relations[empireId];
            if (!relation) return;

            const opinionNode = card.querySelector(".opinion-value");
            if (opinionNode) {
                opinionNode.textContent = `${relation.opinion}/100`;
                opinionNode.style.color = this.getOpinionColor(relation.opinion);
            }

            const relationNode = card.querySelector(".stat-value.paix, .stat-value.alliance, .stat-value.guerre, .stat-value.treve");
            if (relationNode) {
                const text = this.getStateText(relation.state);
                relationNode.textContent = text;
                relationNode.className = `stat-value ${text.toLowerCase()}`;
            }
        });

        const globalNode = document.getElementById("global-relations");
        if (globalNode) {
            globalNode.textContent = this.getDiplomaticStatus();
        }
    },

    setupDiplomacyEvents() {
        this.setupMonthlyUpdates();
    },

    setupMonthlyUpdates() {
        if (this.monthlyIntervalId) return;
        this.monthlyIntervalId = window.setInterval(() => {
            if (this.isNewMonth()) {
                this.updateDiplomaticRelations();
            }
        }, 1000);
    },

    isNewMonth() {
        if (!gameState || !gameState.date) return false;
        const month = Number(gameState.date.month) || 1;
        if (this.lastCheckedMonth === null) {
            this.lastCheckedMonth = month;
            return false;
        }
        if (month !== this.lastCheckedMonth) {
            this.lastCheckedMonth = month;
            return true;
        }
        return false;
    },

    updateDiplomaticRelations() {
        this.empires.forEach((empire) => {
            const relation = this.relations[empire.id];
            if (!relation) return;

            const persona = this.getPersona(empire.persona);
            const affinity = this.getGovernanceAffinity(empire.persona);
            const driftRange = persona.driftMax - persona.driftMin + 1;
            const randomDrift = persona.driftMin + Math.floor(Math.random() * driftRange);
            const governanceDrift = affinity > 0 ? 1 : (affinity < 0 ? -1 : 0);
            this.applyOpinionDelta(empire.id, randomDrift + governanceDrift);

            if (relation.state === this.states.WAR) {
                if (relation.opinion >= 46 && Math.random() < 0.18 + (affinity * 0.03)) {
                    relation.state = this.states.TRUCE;
                    UI.notify(`${empire.name} propose une treve.`, "warning");
                }
            } else if (relation.state === this.states.TRUCE) {
                if (relation.opinion >= 56) {
                    relation.state = this.states.PEACE;
                } else if (relation.opinion <= persona.warThreshold - 4 && Math.random() < persona.warChance) {
                    relation.state = this.states.WAR;
                    UI.notify(`${empire.name} rompt la treve et reprend la guerre.`, "error");
                }
            } else if (relation.state === this.states.PEACE) {
                const warChance = persona.warChance * (1 + (empire.aggression * 0.08));
                if (relation.opinion <= persona.warThreshold && Math.random() < Math.min(0.75, warChance)) {
                    relation.state = this.states.WAR;
                    relation.tradeAgreement = false;
                    relation.hasAlliance = false;
                    UI.notify(`${empire.name} vous declare la guerre.`, "error");
                } else if (relation.opinion >= persona.allianceThreshold) {
                    const allianceChance = persona.allianceChance + (Math.max(0, affinity) * 0.04);
                    if (Math.random() < Math.min(0.82, allianceChance)) {
                        relation.state = this.states.ALLIANCE;
                        relation.hasAlliance = true;
                        UI.notify(`${empire.name} propose une alliance.`, "success");
                    }
                }
            } else if (relation.state === this.states.ALLIANCE) {
                if (relation.opinion < 45) {
                    relation.state = this.states.PEACE;
                    relation.hasAlliance = false;
                    UI.notify(`Alliance rompue avec ${empire.name}.`, "warning");
                } else if (Math.random() < 0.18) {
                    this.applyOpinionDelta(empire.id, 1);
                }
            }

            if (relation.tradeAgreement) {
                if (relation.state === this.states.WAR || relation.opinion < 35) {
                    relation.tradeAgreement = false;
                    if (relation.opinion < 35) {
                        UI.notify(`Commerce suspendu avec ${empire.name}.`, "warning");
                    }
                } else {
                    // Trade money is handled by Economy.processTradeRoutes.
                    if (Math.random() < 0.25) {
                        this.applyOpinionDelta(empire.id, 1);
                    }
                }
            }
        });

        this.syncDiplomacyState();
        this.updateDiplomacyDisplay();
    },

    getDiplomaticStatus() {
        const values = Object.values(this.relations);
        const wars = values.filter((relation) => relation.state === this.states.WAR).length;
        const alliances = values.filter((relation) => relation.state === this.states.ALLIANCE).length;

        if (wars > 0) return "En guerre";
        if (alliances > 0) return "Alliances actives";
        return "En paix";
    }
};

window.addEventListener("load", () => {
    Diplomacy.init();
});
