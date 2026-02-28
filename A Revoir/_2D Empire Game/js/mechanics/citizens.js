// js/mechanics/citizens.js - robust auto-work behavior
const Citizens = {
    list: [],
    colors: ['#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c'],

    CONFIG: {
        MAX_CITIZENS_VISUAL: 100,
        CITIZENS_PER_HOUSE: 5,
        CASTLE_CAPACITY: 10,
        WALK_SPEED: { min: 0.45, max: 1.0 },
        WORK_HOURS: { start: 6, end: 18 }
    },

    worldTime: { hour: 8, minute: 0, isDay: true },
    timeAccumulator: 0,
    employmentCheckTimer: 0,

    init() {
        this.list = [];
        this.timeAccumulator = 0;
        this.employmentCheckTimer = 0;
        console.log('Citizens system initialized.');
    },

    normalizeName(value) {
        return String(value || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .trim();
    },

    isHomeBuildingName(name) {
        const n = this.normalizeName(name);
        return n.includes('maison') || n.includes('chateau') || (n.includes('cha') && n.includes('teau'));
    },

    getBuildingRole(name) {
        const n = this.normalizeName(name);
        if (n.includes('ferme') || n.includes('farm')) return 'farm';
        if (n.includes('mine')) return 'mine';
        if (n.includes('march')) return 'market';
        if (n.includes('barracks') || n.includes('caserne') || n.includes('chateau') || (n.includes('cha') && n.includes('teau'))) {
            return 'military';
        }
        return null;
    },

    getRandomType() {
        const types = [
            { name: 'paysan', symbol: 'P', preferredRoles: ['farm'] },
            { name: 'mineur', symbol: 'M', preferredRoles: ['mine'] },
            { name: 'artisan', symbol: 'A', preferredRoles: ['market'] },
            { name: 'garde', symbol: 'G', preferredRoles: ['military'] }
        ];
        return types[Math.floor(Math.random() * types.length)];
    },

    pickRandomColor() {
        return this.colors[Math.floor(Math.random() * this.colors.length)];
    },

    createCitizen(homeBuilding = null) {
        if (this.list.length >= this.CONFIG.MAX_CITIZENS_VISUAL) return null;

        if (!homeBuilding) {
            homeBuilding = this.findAvailableHousing();
            if (!homeBuilding) return null;
        }

        const type = this.getRandomType();
        const citizen = {
            id: `c_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            type,
            color: this.pickRandomColor(),
            home: homeBuilding,
            workplace: null,
            gridX: Number(homeBuilding.x) || 0,
            gridY: Number(homeBuilding.y) || 0,
            pixelX: 0,
            pixelY: 0,
            state: 'at_home',
            path: [],
            pathIndex: 0,
            speed: this.CONFIG.WALK_SPEED.min + Math.random() * (this.CONFIG.WALK_SPEED.max - this.CONFIG.WALK_SPEED.min),
            isEmployed: false,
            workTimer: 0
        };

        this.placeAtBuilding(citizen, homeBuilding);
        this.tryAssignWork(citizen);
        this.list.push(citizen);
        return citizen;
    },

    findAvailableHousing() {
        const housing = gameState.buildings.filter((building) => this.isHomeBuildingName(building.name));

        for (const home of housing) {
            const capacity = this.isHomeBuildingName(home.name) && this.normalizeName(home.name).includes('maison')
                ? this.CONFIG.CITIZENS_PER_HOUSE * (home.level || 1)
                : this.CONFIG.CASTLE_CAPACITY;

            const occupants = this.list.filter((citizen) => citizen.home === home).length;
            if (occupants < capacity) return home;
        }

        return null;
    },

    calculateHousingCapacity() {
        let capacity = 0;
        gameState.buildings.forEach((building) => {
            if (!this.isHomeBuildingName(building.name)) return;
            if (this.normalizeName(building.name).includes('maison')) {
                capacity += this.CONFIG.CITIZENS_PER_HOUSE * (building.level || 1);
            } else {
                capacity += this.CONFIG.CASTLE_CAPACITY;
            }
        });
        return capacity;
    },

    calculateAvailableJobs() {
        let jobs = 0;
        gameState.buildings.forEach((building) => {
            const data = Buildings.types[building.name];
            if (data && data.workers > 0) {
                jobs += data.workers * (building.level || 1);
            }
        });
        return jobs;
    },

    calculateUnemployment() {
        const totalAdults = Math.floor((Number(gameState.population.current) || 0) * 0.7);
        const jobs = this.calculateAvailableJobs();
        const employed = Math.min(totalAdults, jobs);
        const unemployed = Math.max(0, totalAdults - employed);

        gameState.population.workers = employed;
        gameState.population.unemployed = unemployed;
        return unemployed;
    },

    isWorkplaceUsable(workplace) {
        if (!workplace) return false;
        if (!gameState.buildings.includes(workplace)) return false;

        const data = Buildings.types[workplace.name];
        if (!data || !data.workers) return false;

        const currentWorkers = this.list.filter((citizen) => citizen.workplace === workplace).length;
        return currentWorkers <= data.workers * (workplace.level || 1);
    },

    getAvailableWorkplaces(preferredRoles = null) {
        return gameState.buildings.filter((building) => {
            const data = Buildings.types[building.name];
            if (!data || !data.workers) return false;

            const role = this.getBuildingRole(building.name);
            if (Array.isArray(preferredRoles) && preferredRoles.length > 0 && !preferredRoles.includes(role)) {
                return false;
            }

            const currentWorkers = this.list.filter((citizen) => citizen.workplace === building).length;
            return currentWorkers < data.workers * (building.level || 1);
        });
    },

    tryAssignWork(citizen) {
        if (!citizen) return false;

        if (citizen.workplace && this.isWorkplaceUsable(citizen.workplace)) {
            citizen.isEmployed = true;
            return true;
        }

        citizen.workplace = null;
        citizen.isEmployed = false;

        const preferred = this.getAvailableWorkplaces(citizen.type && citizen.type.preferredRoles);
        const fallback = this.getAvailableWorkplaces(null);
        const candidates = preferred.length > 0 ? preferred : fallback;

        if (candidates.length <= 0) return false;

        candidates.sort((a, b) => {
            const distA = Math.hypot((citizen.gridX || 0) - a.x, (citizen.gridY || 0) - a.y);
            const distB = Math.hypot((citizen.gridX || 0) - b.x, (citizen.gridY || 0) - b.y);
            return distA - distB;
        });

        citizen.workplace = candidates[0];
        citizen.isEmployed = true;
        return true;
    },

    placeAtBuilding(citizen, building) {
        if (!building || typeof Map === 'undefined') return;

        citizen.gridX = Number(building.x) || 0;
        citizen.gridY = Number(building.y) || 0;
        citizen.pixelX = citizen.gridX * Map.tileSize + (Map.tileSize * 0.5) + ((Math.random() - 0.5) * 10);
        citizen.pixelY = citizen.gridY * Map.tileSize + (Map.tileSize * 0.5) + ((Math.random() - 0.5) * 10);
    },

    update(deltaTime = 1) {
        const dt = Math.max(0.1, Number(deltaTime) || 1);

        this.updateWorldTime(dt);
        this.employmentCheckTimer += dt;

        if (this.employmentCheckTimer >= 30) {
            this.employmentCheckTimer = 0;
            this.reassignUnemployed();
        }

        this.list.forEach((citizen) => {
            this.updateCitizenState(citizen, dt);
            this.updateMovement(citizen, dt);
        });

        this.calculateUnemployment();
    },

    updateWorldTime(deltaFrames) {
        this.timeAccumulator += deltaFrames;

        while (this.timeAccumulator >= 60) {
            this.timeAccumulator -= 60;
            this.worldTime.minute += 1;
            if (this.worldTime.minute >= 60) {
                this.worldTime.minute = 0;
                this.worldTime.hour = (this.worldTime.hour + 1) % 24;
            }
        }

        this.worldTime.isDay = this.worldTime.hour >= 6 && this.worldTime.hour < 20;
    },

    updateCitizenState(citizen, deltaFrames = 1) {
        const hour = this.worldTime.hour;
        const isWorkTime = hour >= this.CONFIG.WORK_HOURS.start && hour < this.CONFIG.WORK_HOURS.end;

        if (citizen.workplace && !this.isWorkplaceUsable(citizen.workplace)) {
            citizen.workplace = null;
            citizen.isEmployed = false;
            if (citizen.state === 'going_work' || citizen.state === 'working') {
                citizen.state = 'going_home';
                this.setPathTo(citizen, citizen.home);
            }
        }

        switch (citizen.state) {
            case 'at_home':
                if (isWorkTime) {
                    if (!citizen.workplace) {
                        this.tryAssignWork(citizen);
                    }
                    if (citizen.workplace) {
                        citizen.state = 'going_work';
                        this.setPathTo(citizen, citizen.workplace);
                    }
                }
                break;

            case 'going_work':
                if (!citizen.workplace) {
                    citizen.state = 'at_home';
                    break;
                }
                if (this.hasArrivedAtDestination(citizen)) {
                    citizen.state = 'working';
                    citizen.workTimer = 0;
                }
                break;

            case 'working':
                citizen.workTimer += deltaFrames;
                if (!isWorkTime) {
                    citizen.state = 'going_home';
                    this.setPathTo(citizen, citizen.home);
                }
                break;

            case 'going_home':
                if (this.hasArrivedAtDestination(citizen)) {
                    citizen.state = 'at_home';
                }
                break;

            default:
                citizen.state = 'at_home';
                break;
        }
    },

    setPathTo(citizen, building) {
        if (!building || typeof Map === 'undefined') return;

        const targetX = (building.x * Map.tileSize) + (Map.tileSize * 0.5);
        const targetY = (building.y * Map.tileSize) + (Map.tileSize * 0.5);

        const distance = Math.hypot(targetX - citizen.pixelX, targetY - citizen.pixelY);
        const steps = Math.max(8, Math.min(36, Math.ceil(distance / 14)));

        citizen.path = [];
        for (let i = 1; i <= steps; i += 1) {
            const t = i / steps;
            citizen.path.push({
                x: citizen.pixelX + ((targetX - citizen.pixelX) * t),
                y: citizen.pixelY + ((targetY - citizen.pixelY) * t)
            });
        }
        citizen.pathIndex = 0;
    },

    hasArrivedAtDestination(citizen) {
        return !citizen.path || citizen.pathIndex >= citizen.path.length;
    },

    updateMovement(citizen, deltaFrames) {
        if (!citizen.path || citizen.pathIndex >= citizen.path.length) return;

        const target = citizen.path[citizen.pathIndex];
        const dx = target.x - citizen.pixelX;
        const dy = target.y - citizen.pixelY;
        const dist = Math.hypot(dx, dy);

        const step = citizen.speed * deltaFrames;
        if (dist <= step * 1.8) {
            citizen.pixelX = target.x;
            citizen.pixelY = target.y;
            citizen.pathIndex += 1;
        } else if (dist > 0) {
            citizen.pixelX += (dx / dist) * step;
            citizen.pixelY += (dy / dist) * step;
        }
    },

    onBuildingBuilt(building) {
        // New houses increase capacity; visual citizens are synced by syncWithPopulation.
        if (building && this.isHomeBuildingName(building.name)) {
            this.syncWithPopulation();
        }
        this.reassignUnemployed();
    },

    reassignUnemployed() {
        this.list.forEach((citizen) => {
            if (!citizen.workplace || !this.isWorkplaceUsable(citizen.workplace)) {
                this.tryAssignWork(citizen);
            }
        });
    },

    removeCitizen(citizen) {
        const index = this.list.indexOf(citizen);
        if (index > -1) {
            this.list.splice(index, 1);
            return true;
        }
        return false;
    },

    removeMultiple(count) {
        let removed = 0;

        const unemployed = this.list.filter((citizen) => !citizen.isEmployed);
        for (let i = 0; i < Math.min(count, unemployed.length); i += 1) {
            this.removeCitizen(unemployed[i]);
            removed += 1;
        }

        while (removed < count && this.list.length > 0) {
            this.list.pop();
            removed += 1;
        }

        return removed;
    },

    syncWithPopulation() {
        const housingCap = this.calculateHousingCapacity();
        gameState.population.maxPop = housingCap;

        const targetVisual = Math.max(
            0,
            Math.min(
                this.CONFIG.MAX_CITIZENS_VISUAL,
                Math.floor(gameState.population.current || 0),
                Math.floor(housingCap || 0)
            )
        );

        while (this.list.length < targetVisual) {
            const created = this.createCitizen();
            if (!created) break;
        }

        while (this.list.length > targetVisual) {
            this.list.pop();
        }

        this.reassignUnemployed();
    },

    getStats() {
        const employed = this.list.filter((citizen) => citizen.isEmployed).length;
        return {
            total: this.list.length,
            employed,
            unemployed: this.list.length - employed,
            housingCapacity: this.calculateHousingCapacity(),
            jobsAvailable: this.calculateAvailableJobs(),
            time: `${this.worldTime.hour.toString().padStart(2, '0')}:${this.worldTime.minute.toString().padStart(2, '0')}`
        };
    }
};
