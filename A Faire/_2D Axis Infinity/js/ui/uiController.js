/**
 * ============================================
 * UI CONTROLLER
 * Handles all DOM manipulation and UI updates
 * 
 * FIX: Utilise window.* pour les constantes globales
 * ============================================
 */

class UIController extends EventEmitter {
    constructor() {
        super();
        
        // Cache DOM elements
        this.elements = {};
        this._cacheElements();
        
        // Bind methods
        this._boundHandlers = {};
    }

    // ==========================================
    // INITIALIZATION
    // ==========================================

    _cacheElements() {
        // Screens
        this.elements.screens = {
            start: document.getElementById('start-screen'),
            teamSelection: document.getElementById('team-selection-screen'),
            battle: document.getElementById('battle-screen'),
            result: document.getElementById('result-screen')
        };

        // Start screen
        this.elements.startBtn = document.getElementById('start-btn');
        this.elements.tutorialBtn = document.getElementById('tutorial-btn');
        this.elements.bestScores = document.getElementById('best-scores');

        // Team selection
        this.elements.difficultySelector = document.getElementById('difficulty-selector');
        this.elements.availableCreatures = document.getElementById('available-creatures');
        this.elements.selectedTeam = document.getElementById('selected-team');
        this.elements.confirmTeamBtn = document.getElementById('confirm-team-btn');

        // Battle screen
        this.elements.roundCounter = document.getElementById('round-counter');
        this.elements.turnIndicator = document.getElementById('turn-indicator');
        this.elements.comboDisplay = document.getElementById('combo-display');
        this.elements.playerCreatures = document.getElementById('player-creatures');
        this.elements.enemyCreatures = document.getElementById('enemy-creatures');
        this.elements.skillsContainer = document.getElementById('skills-container');
        this.elements.logContent = document.getElementById('log-content');

        // Result screen
        this.elements.resultBadge = document.getElementById('result-badge');
        this.elements.resultTitle = document.getElementById('result-title');
        this.elements.resultStats = document.getElementById('result-stats');
        this.elements.playAgainBtn = document.getElementById('play-again-btn');
        this.elements.changeTeamBtn = document.getElementById('change-team-btn');

        // Modal
        this.elements.tutorialModal = document.getElementById('tutorial-modal');
        this.elements.modalClose = document.getElementById('modal-close');
        this.elements.tutorialCloseBtn = document.getElementById('tutorial-close-btn');

        // Background
        this.elements.bgParticles = document.getElementById('bg-particles');
    }

    // ==========================================
    // SCREEN MANAGEMENT
    // ==========================================

    showScreen(screenName) {
        // Map des noms (support les deux formats)
        const screenMap = {
            'start': 'start',
            'team-selection': 'teamSelection',
            'teamSelection': 'teamSelection',
            'battle': 'battle',
            'result': 'result'
        };

        const mappedName = screenMap[screenName] || screenName;

        Object.values(this.elements.screens).forEach(screen => {
            if (screen) screen.classList.remove('active');
        });

        const screen = this.elements.screens[mappedName];
        if (screen) {
            screen.classList.add('active');
            this.emit('screenChange', { screen: screenName });
        }
    }

    // ==========================================
    // START SCREEN
    // ==========================================

    displayBestScores(scores) {
        if (!this.elements.bestScores) return;
        
        const DIFFICULTY_LEVELS = window.DIFFICULTY_LEVELS;
        const hasScores = Object.values(scores).some(s => s > 0);
        
        if (!hasScores) {
            this.elements.bestScores.innerHTML = '';
            return;
        }

        let html = '<h3>🏆 Meilleurs Scores</h3><div class="score-list">';
        
        Object.entries(DIFFICULTY_LEVELS).forEach(([key, config]) => {
            const score = scores[key] || 0;
            if (score > 0) {
                html += `
                    <div class="score-item">
                        <span style="color: ${config.color}">${config.name}</span>
                        <span>${score} rounds</span>
                    </div>
                `;
            }
        });
        
        html += '</div>';
        this.elements.bestScores.innerHTML = html;
    }

    // ==========================================
    // TEAM SELECTION
    // ==========================================

    displayDifficultySelector(currentDifficulty) {
        if (!this.elements.difficultySelector) return;
        
        const DIFFICULTY_LEVELS = window.DIFFICULTY_LEVELS;
        let html = '';
        
        Object.entries(DIFFICULTY_LEVELS).forEach(([key, config]) => {
            const isActive = key === currentDifficulty ? 'active' : '';
            html += `
                <button class="difficulty-btn ${isActive}" data-difficulty="${key}">
                    ${config.name}
                </button>
            `;
        });
        
        this.elements.difficultySelector.innerHTML = html;

        // Add event listeners
        this.elements.difficultySelector.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.elements.difficultySelector.querySelectorAll('.difficulty-btn')
                    .forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.emit('difficultyChange', { difficulty: btn.dataset.difficulty });
            });
        });
    }

    displayCreatureCards(templates, selectedIds = []) {
        if (!this.elements.availableCreatures) return;
        
        const GAME_CONSTANTS = window.GAME_CONSTANTS;
        const teamSize = GAME_CONSTANTS?.TEAM_SIZE || 3;
        
        this.elements.availableCreatures.innerHTML = '';

        templates.forEach(template => {
            const isSelected = selectedIds.includes(template.id);
            const isDisabled = selectedIds.length >= teamSize && !isSelected;
            
            const card = this._createCreatureCard(template, isSelected, isDisabled);
            
            card.addEventListener('click', () => {
                if (!isDisabled || isSelected) {
                    this.emit('creatureSelect', { template, isSelected });
                }
            });
            
            this.elements.availableCreatures.appendChild(card);
        });
    }

    // Each species gets a deterministic signature, even when its emoji is shared.
    _portrait(creature, battle = false) {
        const id = String(creature.id || creature.name || '0');
        let hash = 2166136261;
        for (let i = 0; i < id.length; i++) hash = Math.imul(hash ^ id.charCodeAt(i), 16777619);
        const hue = (hash >>> 0) % 360;
        const initials = String(creature.name || '?').slice(0, 2).toUpperCase().replace(/[^A-ZÀ-ÿ]/g, '');
        const cls = battle ? 'battle-creature-icon' : 'creature-icon';
        return `<div class="${cls} axis-portrait" style="--axis-hue:${hue}" title="${String(creature.name || 'Créature').replace(/"/g,'&quot;')}"><span class="axis-emblem">${creature.icon || '◆'}</span><span class="axis-signature">${initials || id.slice(-2)}</span></div>`;
    }

    _createCreatureCard(template, isSelected = false, isDisabled = false) {
        const TYPE_NAMES = window.TYPE_NAMES || {};
        
        const card = document.createElement('div');
        card.className = 'creature-card';
        card.dataset.id = template.id;
        
        if (isSelected) card.classList.add('selected');
        if (isDisabled) card.classList.add('disabled');
        
        // Afficher le niveau si la créature en a un
        const level = template.level || 1;
        const levelBadge = level > 1 ? `<div class="creature-level">Nv. ${level}</div>` : '';
        
        card.innerHTML = `
            ${levelBadge}
            ${this._portrait(template)}
            <div class="creature-name">${template.name || 'Sans nom'}</div>
            <div class="creature-type type-${template.type}">${TYPE_NAMES[template.type] || template.type}</div>
            <div class="creature-stats">
                <div class="stat">
                    <span class="stat-label">PV</span>
                    <span class="stat-value">${template.baseHP ?? '?'}</span>
                </div>
                <div class="stat">
                    <span class="stat-label">ATK</span>
                    <span class="stat-value">${template.baseAttack ?? '?'}</span>
                </div>
                <div class="stat">
                    <span class="stat-label">DEF</span>
                    <span class="stat-value">${template.baseDefense ?? '?'}</span>
                </div>
                <div class="stat">
                    <span class="stat-label">CRIT</span>
                    <span class="stat-value">${template.critRate ?? 10}%</span>
                </div>
            </div>
        `;
        
        return card;
    }

    updateSelectedTeamSlots(selectedTemplates) {
        if (!this.elements.selectedTeam) return;
        
        const GAME_CONSTANTS = window.GAME_CONSTANTS;
        const teamSize = GAME_CONSTANTS?.TEAM_SIZE || 3;
        
        const slots = this.elements.selectedTeam.querySelectorAll('.team-slot');
        
        slots.forEach((slot, index) => {
            const template = selectedTemplates[index];
            
            if (template) {
                slot.classList.remove('empty');
                slot.classList.add('filled');
                slot.innerHTML = this._portrait(template);
            } else {
                slot.classList.add('empty');
                slot.classList.remove('filled');
                slot.innerHTML = '';
            }
        });

        // Update confirm button
        if (this.elements.confirmTeamBtn) {
            this.elements.confirmTeamBtn.disabled = selectedTemplates.length !== teamSize;
        }
    }

    // ==========================================
    // BATTLE SCREEN
    // ==========================================

    displayBattleTeams(playerTeam, enemyTeam) {
        this._displayTeam(playerTeam, this.elements.playerCreatures, false);
        this._displayTeam(enemyTeam, this.elements.enemyCreatures, true);
    }

    _displayTeam(team, container, isEnemy) {
        if (!container) return;
        container.innerHTML = '';
        
        team.forEach(creature => {
            const card = this._createBattleCreatureCard(creature);
            container.appendChild(card);
        });
    }

    _createBattleCreatureCard(creature) {
        const TYPE_NAMES = window.TYPE_NAMES || {};
        
        const card = document.createElement('div');
        card.className = 'battle-creature';
        card.dataset.id = creature.id;
        
        if (!creature.isAlive) card.classList.add('dead');
        
        // Calcul des pourcentages
        const hpPercent = (creature.currentHP / creature.maxHP) * 100;
        const energyPercent = (creature.currentEnergy / creature.maxEnergy) * 100;
        
        // Status effects HTML
        let statusHTML = '';
        if (creature.statusEffects && creature.statusEffects.length > 0) {
            statusHTML = '<div class="status-effects">';
            creature.statusEffects.forEach(effect => {
                statusHTML += `<span class="status-icon" style="color: ${effect.color}" title="${effect.name} (${effect.duration} tours)">${effect.icon}</span>`;
            });
            statusHTML += '</div>';
        }
        
        card.innerHTML = `
            ${this._portrait(creature, true)}
            <div class="battle-creature-info">
                <div class="battle-creature-name">${creature.name}</div>
                <div class="creature-type type-${creature.type}">${TYPE_NAMES[creature.type] || creature.type}</div>
                ${statusHTML}
                <div class="health-bar">
                    <div class="health-fill ${hpPercent < 25 ? 'low' : ''}" style="width: ${hpPercent}%"></div>
                    <div class="bar-text">${creature.currentHP}/${creature.maxHP}</div>
                </div>
                <div class="energy-bar">
                    <div class="energy-fill" style="width: ${energyPercent}%"></div>
                    <div class="bar-text">⚡ ${creature.currentEnergy}/${creature.maxEnergy}</div>
                </div>
                ${creature.shield > 0 ? `<div class="shield-indicator">🛡️ ${creature.shield}</div>` : ''}
            </div>
        `;
        
        return card;
    }

    updateCreatureCard(creature) {
        const card = document.querySelector(`.battle-creature[data-id="${creature.id}"]`);
        if (!card) return;

        const newCard = this._createBattleCreatureCard(creature);
        card.replaceWith(newCard);
    }

    updateRoundInfo(round, turn, comboCount = 0) {
        if (this.elements.roundCounter) {
            this.elements.roundCounter.textContent = round;
        }
        
        if (this.elements.turnIndicator) {
            this.elements.turnIndicator.textContent = turn === 'player' ? 'Votre tour' : 'Tour ennemi';
            this.elements.turnIndicator.classList.toggle('enemy', turn === 'enemy');
        }
        
        // Update combo display
        if (this.elements.comboDisplay) {
            if (comboCount > 0) {
                this.elements.comboDisplay.textContent = `🔥 COMBO x${comboCount}`;
                this.elements.comboDisplay.classList.add('active');
            } else {
                this.elements.comboDisplay.textContent = '';
                this.elements.comboDisplay.classList.remove('active');
            }
        }
    }

    displaySkills(creature, onSkillSelect) {
        if (!this.elements.skillsContainer) return;
        
        this.elements.skillsContainer.innerHTML = '';
        
        if (!creature) return;

        creature.skills.forEach(skill => {
            const btn = document.createElement('button');
            btn.className = 'skill-btn';
            
            if (skill.isUltimate) btn.classList.add('ultimate-skill');
            btn.disabled = creature.currentEnergy < skill.cost;
            
            btn.innerHTML = `
                <div class="skill-name ${skill.isUltimate ? 'ultimate-name' : ''}">${skill.name}</div>
                <div class="skill-cost">Coût: ${skill.cost} ⚡</div>
                <div class="skill-description">${skill.description}</div>
            `;
            
            btn.addEventListener('click', () => {
                if (!btn.disabled) {
                    onSkillSelect(skill);
                }
            });
            
            this.elements.skillsContainer.appendChild(btn);
        });
    }

    displayTargetPrompt() {
        if (!this.elements.skillsContainer) return;
        this.elements.skillsContainer.innerHTML = '<div class="target-prompt">👆 Sélectionnez une cible</div>';
    }

    displayEnemyTurnIndicator() {
        if (!this.elements.skillsContainer) return;
        this.elements.skillsContainer.innerHTML = '<div class="enemy-turn-indicator">🎯 Tour ennemi...</div>';
    }

    highlightActiveCreature(creature) {
        document.querySelectorAll('.battle-creature').forEach(card => {
            card.classList.remove('active');
        });

        if (creature) {
            const card = document.querySelector(`.battle-creature[data-id="${creature.id}"]`);
            if (card) card.classList.add('active');
        }
    }

    enableTargetSelection(targets, onTargetSelect) {
        targets.forEach(target => {
            const card = document.querySelector(`.battle-creature[data-id="${target.id}"]`);
            if (card && target.isAlive) {
                card.classList.add('targetable');
                
                const handler = () => {
                    this.disableTargetSelection();
                    onTargetSelect(target);
                };
                
                card.addEventListener('click', handler, { once: true });
                card._targetHandler = handler;
            }
        });
    }

    disableTargetSelection() {
        document.querySelectorAll('.battle-creature.targetable').forEach(card => {
            card.classList.remove('targetable');
        });
    }

    clearSkills() {
        if (this.elements.skillsContainer) {
            this.elements.skillsContainer.innerHTML = '';
        }
    }

    // ==========================================
    // BATTLE LOG
    // ==========================================

    addLogEntry(message, type = 'info') {
        if (!this.elements.logContent) return;
        
        const div = document.createElement('div');
        div.className = `log-entry ${type}`;
        div.textContent = message;
        
        // Insert at top
        this.elements.logContent.insertBefore(div, this.elements.logContent.firstChild);
        
        // Limit entries
        while (this.elements.logContent.children.length > 15) {
            this.elements.logContent.removeChild(this.elements.logContent.lastChild);
        }
    }

    clearLog() {
        if (this.elements.logContent) {
            this.elements.logContent.innerHTML = '';
        }
    }

    // ==========================================
    // VISUAL EFFECTS
    // ==========================================

    playDamageEffect(creature, isCritical = false) {
        const card = document.querySelector(`.battle-creature[data-id="${creature.id}"]`);
        if (!card) return;

        card.classList.add('shake');
        if (isCritical) card.classList.add('critical-hit');
        
        setTimeout(() => {
            card.classList.remove('shake', 'critical-hit');
        }, 400);
    }

    showDamageNumber(creature, amount, type = 'damage') {
        const card = document.querySelector(`.battle-creature[data-id="${creature.id}"]`);
        if (!card) return;

        const number = document.createElement('div');
        number.className = `damage-number ${type}`;
        number.textContent = type === 'heal' ? `+${amount}` : `-${amount}`;
        
        card.style.position = 'relative';
        card.appendChild(number);
        
        setTimeout(() => number.remove(), 800);
    }

    playUltimateEffect() {
        const flash = document.createElement('div');
        flash.className = 'screen-flash';
        document.body.appendChild(flash);
        
        setTimeout(() => flash.remove(), 400);
    }

    createParticleEffect(creature, type) {
        const card = document.querySelector(`.battle-creature[data-id="${creature.id}"]`);
        if (!card) return;

        const icons = {
            fire: '🔥',
            water: '💧',
            grass: '🌿',
            plant: '🌿',
            electric: '⚡',
            earth: '🪨',
            ground: '🪨',
            ice: '❄️',
            default: '💥'
        };

        const particle = document.createElement('div');
        particle.className = 'particle-effect';
        particle.textContent = icons[type] || icons.default;
        particle.style.setProperty('--tx', `${(Math.random() - 0.5) * 60}px`);
        particle.style.setProperty('--ty', `${-30 - Math.random() * 30}px`);
        
        card.style.position = 'relative';
        card.appendChild(particle);
        
        setTimeout(() => particle.remove(), 800);
    }

    // ==========================================
    // RESULT SCREEN
    // ==========================================

    displayResult(playerWon, stats) {
        if (!this.elements.resultBadge || !this.elements.resultTitle || !this.elements.resultStats) return;
        
        if (playerWon) {
            this.elements.resultBadge.textContent = '🏆';
            this.elements.resultTitle.textContent = 'VICTOIRE !';
            this.elements.resultTitle.className = 'result-title victory';
            
            let resultHTML = `
                <p>Félicitations ! Vous avez vaincu l'équipe ennemie !</p>
                <p>🏆 Rounds: <span class="highlight">${stats.rounds}</span></p>
                ${stats.maxCombo > 0 ? `<p>🔥 Meilleur combo: <span class="highlight">x${stats.maxCombo}</span></p>` : ''}
            `;
            
            // Afficher les level ups
            if (stats.levelUpInfo && stats.levelUpInfo.length > 0) {
                resultHTML += '<div class="level-up-section">';
                resultHTML += '<h3 class="level-up-title">⭐ Progression des Créatures</h3>';
                stats.levelUpInfo.forEach(info => {
                    resultHTML += `
                        <div class="level-up-item">
                            <span class="creature-name">${info.creature.icon} ${info.creature.name}</span>
                            <span class="level-progress">Nv. ${info.previousLevel} → Nv. ${info.newLevel}</span>
                            <span class="xp-gained">+${info.xpGained} XP</span>
                        </div>
                    `;
                });
                resultHTML += '</div>';
            }
            
            this.elements.resultStats.innerHTML = resultHTML;
        } else {
            this.elements.resultBadge.textContent = '💔';
            this.elements.resultTitle.textContent = 'DÉFAITE';
            this.elements.resultTitle.className = 'result-title defeat';
            
            let statsHTML = `
                <p>Votre équipe a été vaincue...</p>
                <p>⚔️ Rounds survécus: <span class="highlight">${stats.rounds}</span></p>
            `;
            
            if (stats.isNewRecord) {
                statsHTML += '<p class="new-record">🏆 NOUVEAU RECORD ! 🏆</p>';
            }
            
            statsHTML += `
                <p>📊 Meilleur score (${stats.difficultyName}): <span class="highlight">${stats.bestScore} rounds</span></p>
                <p>Réessayez avec une meilleure stratégie !</p>
            `;
            
            this.elements.resultStats.innerHTML = statsHTML;
        }
    }

    // ==========================================
    // MODAL
    // ==========================================

    showTutorial() {
        if (this.elements.tutorialModal) {
            this.elements.tutorialModal.classList.add('active');
        }
    }

    hideTutorial() {
        if (this.elements.tutorialModal) {
            this.elements.tutorialModal.classList.remove('active');
        }
    }

    // ==========================================
    // BACKGROUND PARTICLES
    // ==========================================

    initBackgroundParticles() {
        const container = this.elements.bgParticles;
        if (!container) return;
        
        const particleCount = 20;
        
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.left = `${Math.random() * 100}%`;
            particle.style.animationDelay = `${Math.random() * 15}s`;
            particle.style.animationDuration = `${15 + Math.random() * 10}s`;
            
            const colors = ['#ff6b4a', '#4ecdc4', '#f1c40f', '#9b59b6', '#2ecc71'];
            particle.style.background = colors[Math.floor(Math.random() * colors.length)];
            
            container.appendChild(particle);
        }
    }

    // ==========================================
    // WARNING MESSAGE
    // ==========================================

    showWarning(message) {
        const screen = this.elements.screens.teamSelection;
        if (!screen) return;

        screen.querySelector('.team-warning')?.remove();

        const msg = document.createElement('div');
        msg.className = 'team-warning';
        msg.textContent = message;
        msg.style.cssText = 'color:#ff4444; padding:12px; text-align:center; font-weight:bold; background:#ffebee; border-radius:8px; margin:10px;';
        
        screen.insertBefore(msg, screen.firstChild);
        setTimeout(() => msg.remove(), 4000);
    }
}

// Exposition globale
window.UIController = UIController;
console.log('✅ UIController chargé');