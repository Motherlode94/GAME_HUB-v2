// ============================================================================
// ROUTINES & SCHEDULES SYSTEM
// ============================================================================

const ActivityPriorities = {
    URGENT: 5,
    HIGH: 4,
    NORMAL: 3,
    LOW: 2,
    OPTIONAL: 1
};

function RoutineSystem() {
    this.routines = {}; // charId -> routine schedule
    this.currentActivities = {}; // charId -> current activity
}

RoutineSystem.prototype.createRoutine = function(charId, type = 'default') {
    const routine = {
        type: type,
        schedule: this.generateSchedule(type),
        flexibility: 0.5, // 0 = rigide, 1 = très flexible
        preferences: {
            wakeUpTime: 7,
            bedTime: 23,
            mealTimes: [8, 13, 19],
            workHours: [9, 17]
        }
    };
    
    this.routines[charId] = routine;
    return routine;
};

RoutineSystem.prototype.generateSchedule = function(type) {
    const schedules = {
        default: [
            { hour: 7, activity: 'wake_up', duration: 1, priority: ActivityPriorities.HIGH },
            { hour: 8, activity: 'breakfast', duration: 1, priority: ActivityPriorities.HIGH },
            { hour: 9, activity: 'work', duration: 8, priority: ActivityPriorities.NORMAL },
            { hour: 13, activity: 'lunch', duration: 1, priority: ActivityPriorities.HIGH },
            { hour: 18, activity: 'free_time', duration: 3, priority: ActivityPriorities.LOW },
            { hour: 19, activity: 'dinner', duration: 1, priority: ActivityPriorities.HIGH },
            { hour: 21, activity: 'leisure', duration: 2, priority: ActivityPriorities.OPTIONAL },
            { hour: 23, activity: 'sleep', duration: 8, priority: ActivityPriorities.URGENT }
        ],
        
        student: [
            { hour: 7, activity: 'wake_up', duration: 1, priority: ActivityPriorities.HIGH },
            { hour: 8, activity: 'breakfast', duration: 1, priority: ActivityPriorities.NORMAL },
            { hour: 9, activity: 'school', duration: 6, priority: ActivityPriorities.HIGH },
            { hour: 15, activity: 'homework', duration: 2, priority: ActivityPriorities.NORMAL },
            { hour: 17, activity: 'play', duration: 2, priority: ActivityPriorities.LOW },
            { hour: 19, activity: 'dinner', duration: 1, priority: ActivityPriorities.HIGH },
            { hour: 20, activity: 'free_time', duration: 2, priority: ActivityPriorities.OPTIONAL },
            { hour: 22, activity: 'sleep', duration: 9, priority: ActivityPriorities.URGENT }
        ],
        
        retired: [
            { hour: 8, activity: 'wake_up', duration: 1, priority: ActivityPriorities.NORMAL },
            { hour: 9, activity: 'breakfast', duration: 1, priority: ActivityPriorities.NORMAL },
            { hour: 10, activity: 'hobby', duration: 3, priority: ActivityPriorities.LOW },
            { hour: 13, activity: 'lunch', duration: 1, priority: ActivityPriorities.HIGH },
            { hour: 14, activity: 'nap', duration: 1, priority: ActivityPriorities.NORMAL },
            { hour: 15, activity: 'social', duration: 3, priority: ActivityPriorities.LOW },
            { hour: 19, activity: 'dinner', duration: 1, priority: ActivityPriorities.HIGH },
            { hour: 20, activity: 'tv', duration: 2, priority: ActivityPriorities.OPTIONAL },
            { hour: 22, activity: 'sleep', duration: 10, priority: ActivityPriorities.URGENT }
        ],
        
        night_owl: [
            { hour: 10, activity: 'wake_up', duration: 1, priority: ActivityPriorities.HIGH },
            { hour: 11, activity: 'breakfast', duration: 1, priority: ActivityPriorities.NORMAL },
            { hour: 12, activity: 'work', duration: 6, priority: ActivityPriorities.NORMAL },
            { hour: 18, activity: 'dinner', duration: 1, priority: ActivityPriorities.HIGH },
            { hour: 19, activity: 'social', duration: 4, priority: ActivityPriorities.LOW },
            { hour: 23, activity: 'creative', duration: 3, priority: ActivityPriorities.NORMAL },
            { hour: 2, activity: 'sleep', duration: 8, priority: ActivityPriorities.URGENT }
        ]
    };
    
    return schedules[type] || schedules.default;
};

RoutineSystem.prototype.getScheduledActivity = function(charId) {
    const routine = this.routines[charId];
    if (!routine) return null;
    
    const currentHour = Time.hour;
    const schedule = routine.schedule;
    
    // Trouver l'activité actuelle
    for (let i = 0; i < schedule.length; i++) {
        const activity = schedule[i];
        const endHour = (activity.hour + activity.duration) % 24;
        
        // Gérer le passage de minuit
        if (activity.hour < endHour) {
            if (currentHour >= activity.hour && currentHour < endHour) {
                return activity;
            }
        } else {
            if (currentHour >= activity.hour || currentHour < endHour) {
                return activity;
            }
        }
    }
    
    return null;
};

RoutineSystem.prototype.shouldDoActivity = function(charId, proposedActivity) {
    const scheduledActivity = this.getScheduledActivity(charId);
    if (!scheduledActivity) return true;
    
    const routine = this.routines[charId];
    
    // Si l'activité proposée est urgente, elle prend le dessus
    if (proposedActivity.priority >= ActivityPriorities.URGENT) {
        return true;
    }
    
    // Si l'activité programmée est plus importante
    if (scheduledActivity.priority > proposedActivity.priority) {
        // Vérifier la flexibilité
        return Math.random() < routine.flexibility;
    }
    
    return true;
};

RoutineSystem.prototype.interruptRoutine = function(charId, reason, duration) {
    const current = this.currentActivities[charId];
    
    if (current) {
        current.interrupted = true;
        current.interruptReason = reason;
        current.interruptDuration = duration;
        
        return {
            type: 'routine_interrupted',
            character: charId,
            activity: current.activity,
            reason: reason,
            timestamp: Time.current
        };
    }
    
    return null;
};

RoutineSystem.prototype.adaptRoutineToSeason = function(charId) {
    const routine = this.routines[charId];
    if (!routine) return;
    
    const season = Season.currentSeason;
    
    // Ajuster les heures selon la saison
    if (season === 'SUMMER') {
        routine.preferences.wakeUpTime = Math.max(6, routine.preferences.wakeUpTime - 1);
        routine.preferences.bedTime = Math.min(24, routine.preferences.bedTime + 1);
    } else if (season === 'WINTER') {
        routine.preferences.wakeUpTime = Math.min(9, routine.preferences.wakeUpTime + 1);
        routine.preferences.bedTime = Math.max(21, routine.preferences.bedTime - 1);
    }
    
    // Régénérer le planning
    this.updateScheduleTimes(charId);
};

RoutineSystem.prototype.updateScheduleTimes = function(charId) {
    const routine = this.routines[charId];
    if (!routine) return;
    
    const prefs = routine.preferences;
    
    // Mettre à jour les heures clés
    routine.schedule.forEach(item => {
        if (item.activity === 'wake_up') {
            item.hour = prefs.wakeUpTime;
        } else if (item.activity === 'sleep') {
            item.hour = prefs.bedTime;
        } else if (item.activity === 'breakfast') {
            item.hour = prefs.mealTimes[0];
        } else if (item.activity === 'lunch') {
            item.hour = prefs.mealTimes[1];
        } else if (item.activity === 'dinner') {
            item.hour = prefs.mealTimes[2];
        }
    });
    
    // Trier par heure
    routine.schedule.sort((a, b) => a.hour - b.hour);
};

RoutineSystem.prototype.adaptRoutineToAge = function(charId) {
    const age = Aging.getAge(charId);
    const stage = Aging.getStage(charId);
    
    let routineType = 'default';
    
    if (stage === 'Child' || stage === 'Teen') {
        routineType = 'student';
    } else if (stage === 'Senior' || stage === 'Elder') {
        routineType = 'retired';
    }
    
    this.createRoutine(charId, routineType);
};

RoutineSystem.prototype.getNextActivity = function(charId) {
    const routine = this.routines[charId];
    if (!routine) return null;
    
    const currentHour = Time.hour;
    const schedule = routine.schedule;
    
    // Trouver la prochaine activité
    for (let i = 0; i < schedule.length; i++) {
        const activity = schedule[i];
        if (activity.hour > currentHour) {
            return {
                activity: activity.activity,
                hour: activity.hour,
                timeUntil: activity.hour - currentHour
            };
        }
    }
    
    // Si aucune activité trouvée, retourner la première de demain
    return {
        activity: schedule[0].activity,
        hour: schedule[0].hour,
        timeUntil: (24 - currentHour) + schedule[0].hour
    };
};

RoutineSystem.prototype.setCustomSchedule = function(charId, customSchedule) {
    const routine = this.routines[charId];
    if (!routine) {
        this.createRoutine(charId);
    }
    
    this.routines[charId].schedule = customSchedule;
    this.routines[charId].type = 'custom';
};

RoutineSystem.prototype.addWeeklyEvent = function(charId, dayOfWeek, hour, activity, duration) {
    const routine = this.routines[charId];
    if (!routine) return;
    
    if (!routine.weeklyEvents) {
        routine.weeklyEvents = {};
    }
    
    if (!routine.weeklyEvents[dayOfWeek]) {
        routine.weeklyEvents[dayOfWeek] = [];
    }
    
    routine.weeklyEvents[dayOfWeek].push({
        hour: hour,
        activity: activity,
        duration: duration,
        priority: ActivityPriorities.NORMAL
    });
};

RoutineSystem.prototype.getWeeklyEvents = function(charId, dayOfWeek) {
    const routine = this.routines[charId];
    if (!routine || !routine.weeklyEvents) return [];
    
    return routine.weeklyEvents[dayOfWeek] || [];
};

// Instance globale
const Routines = new RoutineSystem();