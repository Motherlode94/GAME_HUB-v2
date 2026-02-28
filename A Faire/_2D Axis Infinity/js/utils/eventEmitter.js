/**
 * ============================================
 * EVENT EMITTER
 * Simple pub/sub pattern for decoupled communication
 * ============================================
 */

class EventEmitter {
    constructor() {
        this._events = new Map();
    }

    /**
     * Subscribe to an event
     * @param {string} event - Event name
     * @param {Function} callback - Callback function
     * @returns {Function} Unsubscribe function
     */
    on(event, callback) {
        if (!this._events.has(event)) {
            this._events.set(event, new Set());
        }
        
        this._events.get(event).add(callback);
        
        // Return unsubscribe function
        return () => this.off(event, callback);
    }
    
    /**
     * Subscribe to an event once
     * @param {string} event - Event name
     * @param {Function} callback - Callback function
     */
    once(event, callback) {
        const wrapper = (...args) => {
            this.off(event, wrapper);
            callback(...args);
        };
        this.on(event, wrapper);
    }

    /**
     * Unsubscribe from an event
     * @param {string} event - Event name
     * @param {Function} callback - Callback function to remove
     */
    off(event, callback) {
        const callbacks = this._events.get(event);
        if (callbacks) {
            callbacks.delete(callback);
        }
    }

    /**
     * Emit an event
     * @param {string} event - Event name
     * @param {*} data - Data to pass to callbacks
     */
    emit(event, data) {
        const callbacks = this._events.get(event);
        if (callbacks) {
            callbacks.forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in event handler for "${event}":`, error);
                }
            });
        }
    }

    /**
     * Remove all listeners for an event (or all events)
     * @param {string} [event] - Optional event name
     */
    removeAllListeners(event) {
        if (event) {
            this._events.delete(event);
        } else {
            this._events.clear();
        }
    }

    /**
     * Get number of listeners for an event
     * @param {string} event - Event name
     * @returns {number} Number of listeners
     */
    listenerCount(event) {
        return this._events.get(event)?.size || 0;
    }
}

/**
 * Global event bus for application-wide events
 */
const GlobalEvents = new EventEmitter();

// Exposition globale
window.EventEmitter = EventEmitter;
window.GlobalEvents = GlobalEvents;

console.log('✅ EventEmitter chargé');
