// js/mechanics/events.js - SYSTÈME D'ÉVÉNEMENTS ALÉATOIRES
const Events = {
    // Configuration
    CONFIG: {
        CHECK_INTERVAL: 3,          // Vérifier tous les X ticks
        BASE_EVENT_CHANCE: 0.08,    // 8% de chance par vérification
        MAX_ACTIVE_EVENTS: 3,       // Événements simultanés max
        EVENT_DURATION: { min: 3, max: 12 } // Durée en ticks
    },
    
    // État
    state: {
        activeEvents: [],
        eventHistory: [],
        ticksSinceLastCheck: 0,
        totalEventsTriggered: 0
    },
    
    // Catalogue d'événements
    catalog: {
        // ===== CATASTROPHES =====
        drought: {
            id: 'drought',
            name: '☀️ Sécheresse',
            type: 'disaster',
            description: 'Une terrible sécheresse frappe vos terres.',
            probability: 0.12,
            duration: { min: 4, max: 8 },
            conditions: (gs) => gs.date.month >= 5 && gs.date.month <= 8,
            effects: {
                onStart: (gs) => {
                    gs.production.foodPerTick *= 0.4;
                    return { foodMod: 0.4 };
                },
                onEnd: (gs, data) => {
                    gs.production.foodPerTick /= data.foodMod;
                },
                perTick: (gs) => {
                    gs.population.happiness = Math.max(0, gs.population.happiness - 1.5);
                }
            },
            choices: [
                { text: "Rationner l'eau (-10 bonheur, réduit durée)", action: (gs, evt) => {
                    gs.population.happiness -= 10;
                    evt.remainingDuration = Math.max(1, evt.remainingDuration - 2);
                }},
                { text: "Prier pour la pluie (aléatoire)", action: (gs, evt) => {
                    if (Math.random() < 0.3) {
                        evt.remainingDuration = 0;
                        UI?.notify("🌧️ Miracle ! La pluie arrive !", "success");
                    }
                }}
            ]
        },
        
        plague: {
            id: 'plague',
            name: '☠️ Épidémie',
            type: 'disaster',
            description: 'Une maladie mystérieuse se répand.',
            probability: 0.08,
            duration: { min: 5, max: 10 },
            conditions: (gs) => gs.population.current > 20 && 
                               (gs.population.current / gs.population.maxPop) > 0.7,
            effects: {
                onStart: (gs) => ({ initialPop: gs.population.current }),
                perTick: (gs) => {
                    const deaths = Math.ceil(gs.population.current * 0.03);
                    gs.population.current = Math.max(5, gs.population.current - deaths);
                    gs.population.happiness = Math.max(0, gs.population.happiness - 2);
                }
            },
            choices: [
                { text: "Quarantaine (-50 or, réduit pertes)", action: (gs, evt) => {
                    if (gs.resources.gold >= 50) {
                        gs.resources.gold -= 50;
                        evt.deathReduction = 0.5;
                        UI?.notify("🏥 Quarantaine établie", "info");
                    } else {
                        UI?.notify("Pas assez d'or !", "error");
                    }
                }},
                { text: "Brûler les corps (+hygiène, -5 bonheur)", action: (gs) => {
                    gs.population.happiness -= 5;
                }}
            ]
        },
        
        flood: {
            id: 'flood',
            name: '🌊 Inondation',
            type: 'disaster',
            description: 'Les rivières débordent et ravagent les cultures.',
            probability: 0.10,
            duration: { min: 2, max: 4 },
            conditions: (gs) => gs.date.month >= 3 && gs.date.month <= 5,
            effects: {
                onStart: (gs) => {
                    const farms = gs.buildings.filter(b => b.name === 'Ferme');
                    const destroyed = Math.min(farms.length, Math.ceil(Math.random() * 2));
                    for (let i = 0; i < destroyed; i++) {
                        const idx = gs.buildings.findIndex(b => b.name === 'Ferme');
                        if (idx > -1) gs.buildings.splice(idx, 1);
                    }
                    return { farmsDestroyed: destroyed };
                },
                onEnd: (gs, data) => {
                    if (data.farmsDestroyed > 0) {
                        UI?.notify(`${data.farmsDestroyed} ferme(s) à reconstruire`, "warning");
                    }
                }
            }
        },
        
        fire: {
            id: 'fire',
            name: '🔥 Incendie',
            type: 'disaster',
            description: 'Un incendie se déclare dans la ville !',
            probability: 0.10,
            duration: { min: 1, max: 2 },
            conditions: (gs) => gs.buildings.length > 5,
            effects: {
                onStart: (gs) => {
                    const flammable = gs.buildings.filter(b => 
                        b.name !== 'Château' && b.name !== 'Mine'
                    );
                    if (flammable.length > 0) {
                        const victim = flammable[Math.floor(Math.random() * flammable.length)];
                        const idx = gs.buildings.indexOf(victim);
                        if (idx > -1) {
                            gs.buildings.splice(idx, 1);
                            return { destroyed: victim.name };
                        }
                    }
                    return { destroyed: null };
                }
            },
            choices: [
                { text: "Mobiliser la population (-20 bonheur, sauve bâtiment)", action: (gs, evt) => {
                    if (evt.data?.destroyed && Math.random() < 0.6) {
                        gs.buildings.push({ name: evt.data.destroyed, x: 0, y: 0, level: 1 });
                        UI?.notify("🧯 Bâtiment sauvé !", "success");
                    }
                    gs.population.happiness -= 20;
                }}
            ]
        },
        
        // ===== OPPORTUNITÉS =====
        bountifulHarvest: {
            id: 'bountifulHarvest',
            name: '🌾 Récolte Abondante',
            type: 'blessing',
            description: 'Les récoltes sont exceptionnelles cette année !',
            probability: 0.15,
            duration: { min: 2, max: 4 },
            conditions: (gs) => gs.date.month >= 8 && gs.date.month <= 10 &&
                               gs.buildings.some(b => b.name === 'Ferme'),
            effects: {
                onStart: (gs) => {
                    gs.production.foodPerTick *= 2;
                    gs.population.happiness = Math.min(100, gs.population.happiness + 10);
                    return { foodMod: 2 };
                },
                onEnd: (gs, data) => {
                    gs.production.foodPerTick /= data.foodMod;
                }
            }
        },
        
        goldVein: {
            id: 'goldVein',
            name: '💎 Filon d\'Or',
            type: 'blessing',
            description: 'Vos mineurs découvrent un riche filon !',
            probability: 0.08,
            duration: { min: 3, max: 6 },
            conditions: (gs) => gs.buildings.some(b => b.name === 'Mine'),
            effects: {
                onStart: (gs) => {
                    const bonus = 50 + Math.floor(Math.random() * 100);
                    gs.resources.gold += bonus;
                    gs.production.goldPerTick *= 1.5;
                    return { bonus, goldMod: 1.5 };
                },
                onEnd: (gs, data) => {
                    gs.production.goldPerTick /= data.goldMod;
                    UI?.notify("Le filon est épuisé", "info");
                }
            }
        },
        
        wanderingMerchant: {
            id: 'wanderingMerchant',
            name: '🎪 Marchand Ambulant',
            type: 'opportunity',
            description: 'Un marchand exotique propose ses services.',
            probability: 0.12,
            duration: { min: 1, max: 1 },
            conditions: (gs) => gs.resources.gold >= 30,
            effects: {},
            choices: [
                { text: "Acheter des épices (+15 bonheur, -30 or)", action: (gs) => {
                    if (gs.resources.gold >= 30) {
                        gs.resources.gold -= 30;
                        gs.population.happiness = Math.min(100, gs.population.happiness + 15);
                    }
                }},
                { text: "Acheter des outils (+20% prod, -50 or)", action: (gs) => {
                    if (gs.resources.gold >= 50) {
                        gs.resources.gold -= 50;
                        gs.production.goldPerTick *= 1.2;
                        gs.production.foodPerTick *= 1.2;
                        setTimeout(() => {
                            gs.production.goldPerTick /= 1.2;
                            gs.production.foodPerTick /= 1.2;
                        }, 60000);
                    }
                }},
                { text: "Le chasser (risque)", action: (gs) => {
                    if (Math.random() < 0.3) {
                        UI?.notify("Le marchand était un espion !", "warning");
                    }
                }}
            ]
        },
        
        refugees: {
            id: 'refugees',
            name: '👥 Réfugiés',
            type: 'opportunity',
            description: 'Des réfugiés demandent asile dans votre empire.',
            probability: 0.10,
            duration: { min: 1, max: 1 },
            conditions: (gs) => gs.population.current < gs.population.maxPop - 5,
            effects: {},
            choices: [
                { text: "Les accueillir (+5-10 pop, -20 nourriture)", action: (gs) => {
                    const newPop = 5 + Math.floor(Math.random() * 6);
                    gs.population.current += newPop;
                    gs.resources.food -= 20;
                    UI?.notify(`${newPop} nouveaux citoyens !`, "success");
                }},
                { text: "Les refouler (-5 bonheur)", action: (gs) => {
                    gs.population.happiness -= 5;
                }},
                { text: "Les recruter comme soldats (+3 soldats)", action: (gs) => {
                    if (gs.army) gs.army.soldiers = (gs.army.soldiers || 0) + 3;
                }}
            ]
        },
        
        // ===== ÉVÉNEMENTS POLITIQUES =====
        rebellion: {
            id: 'rebellion',
            name: '⚔️ Complot',
            type: 'political',
            description: 'Des nobles mécontents complotent contre vous.',
            probability: 0.06,
            duration: { min: 3, max: 5 },
            conditions: (gs) => gs.population.happiness < 40,
            effects: {
                perTick: (gs) => {
                    if (Math.random() < 0.15) {
                        UI?.notify("Les conspirateurs gagnent du terrain...", "warning");
                    }
                }
            },
            choices: [
                { text: "Exécuter les meneurs (-10 pop, résolu)", action: (gs, evt) => {
                    gs.population.current = Math.max(5, gs.population.current - 10);
                    evt.remainingDuration = 0;
                    UI?.notify("Justice expéditive rendue", "info");
                }},
                { text: "Négocier (-100 or, +20 bonheur)", action: (gs, evt) => {
                    if (gs.resources.gold >= 100) {
                        gs.resources.gold -= 100;
                        gs.population.happiness += 20;
                        evt.remainingDuration = 0;
                    }
                }},
                { text: "Ignorer (risque de révolte)", action: () => {} }
            ]
        },
        
        festival: {
            id: 'festival',
            name: '🎉 Festival',
            type: 'political',
            description: 'Le peuple demande à organiser un festival.',
            probability: 0.12,
            duration: { min: 1, max: 1 },
            conditions: (gs) => gs.resources.gold >= 40 && gs.resources.food >= 30,
            effects: {},
            choices: [
                { text: "Grand festival (-80 or, -50 food, +25 bonheur)", action: (gs) => {
                    gs.resources.gold -= 80;
                    gs.resources.food -= 50;
                    gs.population.happiness = Math.min(100, gs.population.happiness + 25);
                }},
                { text: "Petit festival (-40 or, -30 food, +10 bonheur)", action: (gs) => {
                    gs.resources.gold -= 40;
                    gs.resources.food -= 30;
                    gs.population.happiness = Math.min(100, gs.population.happiness + 10);
                }},
                { text: "Refuser (-8 bonheur)", action: (gs) => {
                    gs.population.happiness -= 8;
                }}
            ]
        }
    },
    
    // Initialisation
    init() {
        this.state.activeEvents = [];
        this.state.eventHistory = [];
        console.log("🎲 Système d'événements initialisé");
    },
    
    // Mise à jour (appelée chaque tick)
    update() {
        this.state.ticksSinceLastCheck++;
        
        // Vérifier nouveaux événements
        if (this.state.ticksSinceLastCheck >= this.CONFIG.CHECK_INTERVAL) {
            this.state.ticksSinceLastCheck = 0;
            this.checkForNewEvents();
        }
        
        // Traiter événements actifs
        this.processActiveEvents();
    },
    
    // Vérifier si un événement se déclenche
    checkForNewEvents() {
        if (this.state.activeEvents.length >= this.CONFIG.MAX_ACTIVE_EVENTS) return;
        if (Math.random() > this.CONFIG.BASE_EVENT_CHANCE) return;
        
        // Filtrer événements éligibles
        const eligible = Object.values(this.catalog).filter(evt => {
            // Pas déjà actif
            if (this.state.activeEvents.some(a => a.id === evt.id)) return false;
            // Conditions remplies
            if (evt.conditions && !evt.conditions(gameState)) return false;
            // Probabilité
            return Math.random() < evt.probability;
        });
        
        if (eligible.length > 0) {
            const event = eligible[Math.floor(Math.random() * eligible.length)];
            this.triggerEvent(event);
        }
    },
    
    // Déclencher un événement
    triggerEvent(eventTemplate) {
        const duration = eventTemplate.duration.min + 
            Math.floor(Math.random() * (eventTemplate.duration.max - eventTemplate.duration.min + 1));
        
        const event = {
            ...eventTemplate,
            remainingDuration: duration,
            startTick: this.state.totalEventsTriggered,
            data: {}
        };
        
        // Exécuter effet de départ
        if (event.effects?.onStart) {
            event.data = event.effects.onStart(gameState) || {};
        }
        
        this.state.activeEvents.push(event);
        this.state.totalEventsTriggered++;
        
        // Notification + choix
        this.showEventPopup(event);
        
        console.log(`🎲 Événement: ${event.name}`);
    },
    
    // Traiter les événements actifs
    processActiveEvents() {
        for (let i = this.state.activeEvents.length - 1; i >= 0; i--) {
            const event = this.state.activeEvents[i];
            
            // Effet par tick
            if (event.effects?.perTick) {
                event.effects.perTick(gameState, event.data);
            }
            
            // Réduire durée
            event.remainingDuration--;
            
            // Fin de l'événement
            if (event.remainingDuration <= 0) {
                if (event.effects?.onEnd) {
                    event.effects.onEnd(gameState, event.data);
                }
                
                this.state.eventHistory.push({
                    id: event.id,
                    name: event.name,
                    endedAt: Date.now()
                });
                
                this.state.activeEvents.splice(i, 1);
                UI?.notify(`${event.name} terminé`, "info");
            }
        }
    },
    
    // Afficher popup d'événement
    showEventPopup(event) {
        const hasChoices = event.choices && event.choices.length > 0;
        
        let popupHTML = `
            <div class="event-popup" id="event-popup-${event.id}">
                <div class="event-header ${event.type}">
                    <h3>${event.name}</h3>
                    <span class="event-duration">⏱️ ${event.remainingDuration} tours</span>
                </div>
                <p class="event-description">${event.description}</p>
        `;
        
        if (hasChoices) {
            popupHTML += `<div class="event-choices">`;
            event.choices.forEach((choice, idx) => {
                popupHTML += `
                    <button class="event-choice-btn" onclick="Events.makeChoice('${event.id}', ${idx})">
                        ${choice.text}
                    </button>
                `;
            });
            popupHTML += `</div>`;
        }
        
        popupHTML += `
                <button class="event-close" onclick="this.parentElement.remove()">
                    ${hasChoices ? 'Ignorer' : 'Fermer'}
                </button>
            </div>
        `;
        
        // Styles inline pour autonomie
        const styles = `
            <style>
                .event-popup {
                    position: fixed; top: 50%; left: 50%;
                    transform: translate(-50%, -50%);
                    background: #2c3e50; color: white;
                    padding: 20px; border-radius: 12px;
                    z-index: 10000; min-width: 320px; max-width: 450px;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.5);
                    animation: eventPopIn 0.3s ease;
                }
                @keyframes eventPopIn {
                    from { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
                    to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                }
                .event-header { display: flex; justify-content: space-between; margin-bottom: 10px; }
                .event-header.disaster h3 { color: #e74c3c; }
                .event-header.blessing h3 { color: #2ecc71; }
                .event-header.opportunity h3 { color: #f39c12; }
                .event-header.political h3 { color: #9b59b6; }
                .event-duration { color: #95a5a6; font-size: 0.9em; }
                .event-description { color: #bdc3c7; margin: 15px 0; line-height: 1.5; }
                .event-choices { display: flex; flex-direction: column; gap: 8px; margin: 15px 0; }
                .event-choice-btn {
                    background: #34495e; border: none; color: white;
                    padding: 10px 15px; border-radius: 6px; cursor: pointer;
                    transition: background 0.2s;
                }
                .event-choice-btn:hover { background: #4a6785; }
                .event-close {
                    background: #7f8c8d; border: none; color: white;
                    padding: 8px 20px; border-radius: 6px; cursor: pointer;
                    width: 100%; margin-top: 10px;
                }
            </style>
        `;
        
        // Injecter si styles pas déjà présents
        if (!document.getElementById('event-styles')) {
            const styleEl = document.createElement('div');
            styleEl.id = 'event-styles';
            styleEl.innerHTML = styles;
            document.head.appendChild(styleEl);
        }
        
        document.body.insertAdjacentHTML('beforeend', popupHTML);
    },
    
    // Faire un choix
    makeChoice(eventId, choiceIndex) {
        const event = this.state.activeEvents.find(e => e.id === eventId);
        if (!event || !event.choices?.[choiceIndex]) return;
        
        event.choices[choiceIndex].action(gameState, event);
        
        // Fermer popup
        const popup = document.getElementById(`event-popup-${eventId}`);
        if (popup) popup.remove();
        
        UI?.refresh();
    },
    
    // Forcer un événement (debug/quêtes)
    forceEvent(eventId) {
        const template = this.catalog[eventId];
        if (template) this.triggerEvent(template);
    },
    
    // Stats
    getStats() {
        return {
            active: this.state.activeEvents.map(e => ({ name: e.name, remaining: e.remainingDuration })),
            totalTriggered: this.state.totalEventsTriggered,
            history: this.state.eventHistory.slice(-10)
        };
    },
    
    // Système de callbacks pour événements custom (compatible avec production.js)
    listeners: {},
    
    // Enregistrer un listener
    on(eventName, callback) {
        if (!this.listeners[eventName]) {
            this.listeners[eventName] = [];
        }
        this.listeners[eventName].push(callback);
    },
    
    // Retirer un listener
    off(eventName, callback) {
        if (!this.listeners[eventName]) return;
        this.listeners[eventName] = this.listeners[eventName].filter(cb => cb !== callback);
    },
    
    // Déclencher un événement custom (pour compatibilité avec production.js)
    trigger(eventName, data) {
        // Exécuter les callbacks enregistrés
        if (this.listeners[eventName]) {
            this.listeners[eventName].forEach(callback => {
                try {
                    callback(data);
                } catch (e) {
                    console.error(`Erreur callback ${eventName}:`, e);
                }
            });
        }
        
        // Log optionnel
        if (eventName !== 'productionUpdated') { // Éviter spam
            console.log(`📡 Event: ${eventName}`);
        }
    }
};

// Intégration au Timer
if (typeof Timer !== 'undefined') {
    const originalOnTick = Timer.onTick.bind(Timer);
    Timer.onTick = function() {
        originalOnTick();
        Events.update();
    };
}

// Initialisation
window.addEventListener('load', () => {
    setTimeout(() => Events.init(), 600);
});