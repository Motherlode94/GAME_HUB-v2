// js/ui/ui.js - VERSION AMÉLIORÉE
const UI = {
    // Cache des éléments DOM pour éviter les requêtes répétées
    domCache: {},
    notificationQueue: [],
    isRefreshing: false,
    
    // Initialiser les références DOM
    init() {
        console.log("Initialisation de l'UI...");
        
        // Cache les éléments fréquemment utilisés
        this.cacheElements();
        
        // Initialiser le système de notifications
        this.initNotifications();
        
        // Mettre à jour initialement
        this.refresh();
        
        console.log("UI initialisée avec succès");
        return this;
    },
    
    // Mettre en cache les éléments DOM
    cacheElements() {
        const elementsToCache = [
            'gold-val', 'food-val', 'stone-val', 'pop-val',
            'happiness-val', 'workers-status', 'game-mode',
            'building-count', 'army-count', 'empire-score',
            'game-date', 'game-status', 'game-speed',
            'notification-area'
        ];
        
        elementsToCache.forEach(id => {
            this.domCache[id] = document.getElementById(id);
        });
        
        // Cache spécial pour les boutons de construction
        this.domCache.buildButtons = document.querySelectorAll('.btn-build');
    },
    
    // Initialiser le système de notifications
    initNotifications() {
        // Créer la zone de notifications si elle n'existe pas
        if (!this.domCache['notification-area']) {
            const notifArea = document.createElement('div');
            notifArea.id = 'notification-area';
            Object.assign(notifArea.style, {
                position: 'fixed',
                top: '20px',
                right: '20px',
                width: '300px',
                zIndex: '1000',
                maxHeight: '80vh',
                overflowY: 'auto',
                pointerEvents: 'none'
            });
            document.body.appendChild(notifArea);
            this.domCache['notification-area'] = notifArea;
        }
    },
    
    // Met à jour l'ensemble des chiffres à l'écran (version optimisée)
    refresh(force = false) {
        // Éviter les rafraîchissements trop fréquents
        if (this.isRefreshing && !force) {
            return;
        }
        
        this.isRefreshing = true;
        
        try {
            // Utiliser requestAnimationFrame pour de meilleures performances
            requestAnimationFrame(() => {
                // Ressources (mise à jour groupée)
                this.updateResources();
                
                // Population et ouvriers
                this.updatePopulation();
                
                // Panneau d'informations
                this.updateInfoPanel();
                
                // Date et statut
                this.updateDate();
                
                // Boutons de construction
                this.updateBuildButtons();
                
                // Traiter la file d'attente des notifications
                this.processNotificationQueue();
                
                this.isRefreshing = false;
            });
        } catch (error) {
            console.error('Erreur lors du rafraîchissement UI:', error);
            this.notify('Erreur de rafraîchissement de l\'interface', 'error');
            this.isRefreshing = false;
        }
    },
    
    // Mise à jour des ressources (optimisée)
    updateResources() {
        const resources = gameState.resources;
        
        // Mise à jour groupée avec formatage
        if (this.domCache['gold-val']) {
            this.domCache['gold-val'].innerText = this.formatNumber(resources.gold || 0);
        }
        if (this.domCache['food-val']) {
            this.domCache['food-val'].innerText = this.formatNumber(resources.food || 0);
        }
        if (this.domCache['stone-val']) {
            this.domCache['stone-val'].innerText = this.formatNumber(resources.stone || 0);
        }
    },
    
    // Mise à jour de la population et des ouvriers
    updatePopulation() {
        // Population totale
        if (this.domCache['pop-val']) {
            const currentPop = Math.floor(gameState.population.current || 0);
            const maxPop = this.calculateMaxPopulation();
            
            // Mettre à jour la valeur max dans gameState pour cohérence
            gameState.population.maxPop = maxPop;
            
            this.domCache['pop-val'].innerText = `${this.formatNumber(currentPop)} / ${this.formatNumber(maxPop)}`;
            
            // Indicateur visuel de capacité
            const percent = maxPop > 0 ? (currentPop / maxPop) * 100 : 0;
            this.domCache['pop-val'].style.color = percent >= 90 ? '#e74c3c' : 
                                                 percent >= 70 ? '#f39c12' : '#2ecc71';
            this.domCache['pop-val'].title = `Occupation: ${Math.round(percent)}%`;
        }
        
        // Bonheur
        if (this.domCache['happiness-val']) {
            const happiness = Math.floor(gameState.population.happiness || 100);
            this.domCache['happiness-val'].innerText = `${happiness}%`;
            this.domCache['happiness-val'].style.color = happiness < 40 ? '#e74c3c' : 
                                                       happiness < 70 ? '#f39c12' : '#2ecc71';
        }
        
        // Ouvriers
        this.updateWorkersStatus();
    },
    
    // Mettre à jour le statut des ouvriers
// Mettre à jour le statut des ouvriers
    updateWorkersStatus() {
        const workersRoot = this.domCache['workers-status'];
        if (!workersRoot) return;

        const valueNode = workersRoot.querySelector('.res-value') || workersRoot;

        const jobs = this.calculateAvailableJobs();
        const available = Math.floor(gameState.population.workers || 0);
        const employed = Math.min(available, jobs);
        const unemployed = Math.max(0, available - jobs);

        if (jobs === 0) {
            valueNode.innerText = `${available} / 0`;
            valueNode.style.color = '#3498db';
            workersRoot.title = `Aucun emploi cree\nConstruisez des Fermes ou Mines`;
        } else {
            const efficiency = Math.round((employed / jobs) * 100);
            valueNode.innerText = `${employed} / ${jobs}`;
            valueNode.style.color = employed < jobs
                ? (efficiency < 50 ? '#e74c3c' : '#f39c12')
                : '#2ecc71';
            workersRoot.title = `Employes: ${employed}\nEmplois: ${jobs}\nChomeurs: ${unemployed}\nEfficacite: ${efficiency}%`;
        }

        gameState.efficiency = jobs > 0 ? (employed / jobs) * 100 : 100;
        gameState.population.unemployed = unemployed;
    },
    // NOUVELLE FONCTION : Calculer les emplois disponibles
    calculateAvailableJobs() {
        let totalJobs = 0;
        
        gameState.buildings.forEach(building => {
            const buildingType = Buildings.types[building.name];
            if (buildingType && buildingType.workers > 0) {
                totalJobs += buildingType.workers * (building.level || 1);
            }
        });
        
        return totalJobs;
    },
    
    // Calculer la population maximum basée sur les maisons (version améliorée)
    calculateMaxPopulation() {
        let totalCapacity = 0;
        let houseCount = 0;
        let castleCount = 0;
        
        // Parcourir les bâtiments une seule fois
        gameState.buildings.forEach(building => {
            if (building.name === 'Maison') {
                houseCount++;
                // Capacité de base: 5 + (niveau - 1) supplémentaires
                const baseCapacity = 5;
                const levelBonus = (building.level || 1) - 1;
                totalCapacity += baseCapacity + levelBonus;
            } else if (building.name === 'Château') {
                castleCount++;
                totalCapacity += 10; // Capacité fixe pour les châteaux
            }
        });
        
        // Bonus pour avoir plusieurs châteaux
        if (castleCount > 1) {
            totalCapacity += (castleCount - 1) * 2; // +2 par château supplémentaire
        }
        
        // Minimum garanti
        return Math.max(10, totalCapacity);
    },
    
    // Calculer le nombre d'ouvriers nécessaires (version améliorée)
    calculateWorkersNeeded() {
        let totalNeeded = 0;
        
        gameState.buildings.forEach(building => {
            const buildingType = Buildings.types[building.name];
            if (buildingType && buildingType.workers) {
                // Ajuster selon le niveau du bâtiment
                const baseWorkers = buildingType.workers;
                const levelMultiplier = 1 + ((building.level || 1) - 1) * 0.2; // +20% par niveau
                totalNeeded += Math.ceil(baseWorkers * levelMultiplier);
            }
        });
        
        return totalNeeded;
    },
    
    // Mettre à jour le panneau d'informations
    updateInfoPanel() {
        // Mode de jeu
        if (this.domCache['game-mode']) {
            let modeText = window.currentSelection ? 'Construction' : 'Gestion';
            if (typeof EmpireGovernor !== 'undefined' && EmpireGovernor.getProfile) {
                modeText += ` • ${EmpireGovernor.getProfile().label}`;
            }
            this.domCache['game-mode'].innerText = modeText;
        }
        
        // Nombre de bâtiments
        if (this.domCache['building-count']) {
            const totalBuildings = gameState.buildings.length;
            this.domCache['building-count'].innerText = totalBuildings;
            
            // Info-bulle avec détails
            const buildingTypes = {};
            gameState.buildings.forEach(b => {
                buildingTypes[b.name] = (buildingTypes[b.name] || 0) + 1;
            });
            
            const details = Object.entries(buildingTypes)
                .map(([name, count]) => `${name}: ${count}`)
                .join('\n');
            
            this.domCache['building-count'].title = `Détails:\n${details}`;
        }
        
        // Mettre à jour le compteur de soldats si l'élément existe
        const soldierCount = document.getElementById('army-count') || document.getElementById('soldier-count');
        if (soldierCount) {
            const soldiers = Math.floor(Number(gameState.army?.soldiers) || 0);
            soldierCount.innerText = soldiers;
        }
    },
    
    // Mettre à jour la date et le statut
    updateDate() {
        // Date
        if (this.domCache['game-date']) {
            const year = gameState.date.year || 1;
            const month = gameState.date.month || 1;
            const season = this.getSeason(month);
            this.domCache['game-date'].innerText = `📅 An ${year} - ${season}`;
        }
        
        // Statut
        if (this.domCache['game-status']) {
            let status = "En paix";
            let statusColor = '#2ecc71';
            
            // Vérifier la diplomatie
            if (typeof Diplomacy !== 'undefined') {
                const dipStatus = Diplomacy.getDiplomaticStatus();
                if (dipStatus && dipStatus !== 'peace' && dipStatus !== 'En paix') {
                    status = `${dipStatus}`;
                    statusColor = '#e74c3c';
                }
            }
            
            // Vérifier les révoltes
            if (gameState.population.happiness < 30) {
                status = "Risque de revolte";
                statusColor = '#e74c3c';
            } else if (gameState.population.happiness < 50) {
                status = "Mecontentement";
                statusColor = '#f39c12';
            }
            
            this.domCache['game-status'].innerText = status;
            this.domCache['game-status'].style.color = statusColor;
        }
    },
    
    // Obtenir la saison selon le mois
    getSeason(month) {
        const seasons = [
            'Hiver', 'Hiver', 'Printemps', 'Printemps', 'Printemps',
            'Été', 'Été', 'Été', 'Automne', 'Automne', 'Automne', 'Hiver'
        ];
        return seasons[(month - 1) % 12] || 'Printemps';
    },
    
    // Mettre à jour les boutons de construction
    updateBuildButtons() {
        if (!this.domCache.buildButtons || this.domCache.buildButtons.length === 0) {
            return;
        }
        
        this.domCache.buildButtons.forEach(button => {
            const rawName = button.getAttribute('data-building') ||
                            button.getAttribute('data-type') ||
                            button.innerText.split('\n')[0].trim();

            const normalized = String(rawName || '').toLowerCase();
            const mappedName = ({
                farm: 'Ferme',
                house: 'Maison',
                mine: 'Mine',
                market: 'Marche',
                barracks: 'Barracks',
                chateau: 'Chateau',
                château: 'Chateau'
            })[normalized] || rawName;
            const resolvedName = Object.keys(Buildings.types || {}).find(
                (name) => this.normalizeText(name) === this.normalizeText(mappedName)
            );

            if (resolvedName && Buildings.types[resolvedName]) {
                const building = Buildings.types[resolvedName];
                const cost = building.cost || 0;
                const canAfford = gameState.resources.gold >= cost;
                
                // Mettre à jour l'état du bouton
                button.disabled = !canAfford;
                
                // Styles
                if (canAfford) {
                    button.style.opacity = '1';
                    button.style.cursor = 'pointer';
                    button.style.boxShadow = '0 2px 4px rgba(46, 204, 113, 0.3)';
                } else {
                    button.style.opacity = '0.5';
                    button.style.cursor = 'not-allowed';
                    button.style.boxShadow = 'none';
                }
                
                // Mettre à jour le coût affiché
                const costElement = button.querySelector('.building-cost') || 
                                  button.querySelector('.cost') ||
                                  this.findOrCreateCostElement(button);
                
                if (costElement) {
                    costElement.innerHTML = `💰 ${this.formatNumber(cost)}`;
                    costElement.style.color = canAfford ? '#f1c40f' : '#e74c3c';
                    costElement.style.fontWeight = 'bold';
                }
                
                // Ajouter une info-bulle
                if (building.description) {
                    button.title = building.description;
                }
            }
        });
    },
    
    // Trouver ou créer un élément de coût
    findOrCreateCostElement(button) {
        // Essayer de trouver un élément existant
        let costElement = button.querySelector('.cost-display');
        
        if (!costElement) {
            // Créer un nouvel élément
            costElement = document.createElement('span');
            costElement.className = 'cost-display';
            button.appendChild(costElement);
        }
        
        return costElement;
    },
    
    // Système de notifications amélioré
    notify(msg, type = 'info', duration = 5000) {
        // Ajouter à la file d'attente
        this.notificationQueue.push({
            message: msg,
            type: type,
            timestamp: Date.now(),
            duration: duration
        });
    },
    
    // Traiter la file d'attente des notifications
    processNotificationQueue() {
        if (!this.notificationQueue.length || !this.domCache['notification-area']) return;
        
        const now = Date.now();
        
        // Traiter les notifications dans la file d'attente
        while (this.notificationQueue.length > 0) {
            const notif = this.notificationQueue.shift();
            this.createNotification(notif.message, notif.type, notif.duration);
        }
    },
    
    // Créer une notification visuelle
    createNotification(msg, type = 'info', duration = 5000) {
        const notifArea = this.domCache['notification-area'];
        if (!notifArea) return;
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        // Icône selon le type
        const icons = {
            info: 'INFO',
            success: 'OK',
            warning: 'WARN',
            error: 'ERR'
        };
        
        notification.innerHTML = `
            <div class="notification-icon">${icons[type] || icons.info}</div>
            <div class="notification-content">${msg}</div>
            <div class="notification-close">&times;</div>
        `;
        
        // Styles
        Object.assign(notification.style, {
            background: this.getNotificationColor(type),
            color: 'white',
            padding: '12px 16px',
            margin: '8px 0',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            pointerEvents: 'auto',
            transform: 'translateX(100%)',
            opacity: '0',
            transition: 'all 0.3s ease'
        });
        
        notifArea.insertBefore(notification, notifArea.firstChild);
        
        // Animation d'entrée
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
            notification.style.opacity = '1';
        }, 10);
        
        // Bouton de fermeture
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.onclick = () => this.removeNotification(notification);
        
        // Auto-suppression
        const timeoutId = setTimeout(() => {
            this.removeNotification(notification);
        }, duration);
        
        // Sauvegarder l'ID pour annulation si besoin
        notification.dataset.timeoutId = timeoutId;
        
        // Limiter le nombre de notifications
        this.limitNotifications(notifArea, 5);
    },
    
    // Supprimer une notification avec animation
    removeNotification(notification) {
        if (!notification.parentNode) return;
        
        // Annuler le timeout s'il existe
        if (notification.dataset.timeoutId) {
            clearTimeout(parseInt(notification.dataset.timeoutId));
        }
        
        // Animation de sortie
        notification.style.transform = 'translateX(100%)';
        notification.style.opacity = '0';
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    },
    
    // Limiter le nombre de notifications
    limitNotifications(container, max) {
        while (container.children.length > max) {
            const oldest = container.lastChild;
            this.removeNotification(oldest);
        }
    },
    
    // Obtenir la couleur de notification
    getNotificationColor(type) {
        const colors = {
            info: '#3498db',
            success: '#2ecc71',
            warning: '#f39c12',
            error: '#e74c3c'
        };
        return colors[type] || colors.info;
    },
    
    // Formater les nombres (ajoute des séparateurs de milliers)
    formatNumber(num) {
        return Math.floor(num).toLocaleString('fr-FR');
    },

    normalizeText(value) {
        return String(value || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .trim();
    },
    
    // Effet visuel pour les changements de ressources
    animateResourceChange(elementId, change) {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        const originalColor = element.style.color;
        const animationColor = change >= 0 ? '#2ecc71' : '#e74c3c';
        const symbol = change >= 0 ? '+' : '';
        
        // Créer l'élément d'animation
        const anim = document.createElement('span');
        anim.innerText = `${symbol}${this.formatNumber(change)}`;
        anim.style.position = 'absolute';
        anim.style.color = animationColor;
        anim.style.fontWeight = 'bold';
        anim.style.opacity = '1';
        anim.style.transition = 'all 1s ease';
        
        element.parentNode.style.position = 'relative';
        element.parentNode.appendChild(anim);
        
        // Animation
        setTimeout(() => {
            anim.style.transform = 'translateY(-20px)';
            anim.style.opacity = '0';
        }, 10);
        
        // Nettoyer après l'animation
        setTimeout(() => {
            if (anim.parentNode) {
                anim.parentNode.removeChild(anim);
            }
        }, 1100);
    }
};

// Initialiser automatiquement quand le DOM est prêt
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => UI.init());
} else {
    UI.init();
}


