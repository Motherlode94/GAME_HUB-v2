const Input = {
    keys: {},
    mouse: { x: 0, y: 0, clicked: false },
    debug: false,

    init() {
        console.log("Input system initialized");

        document.addEventListener("keydown", (event) => {
            var gameKeys = [
                "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight",
                " ", "Spacebar",
                "z", "Z", "q", "Q", "s", "S", "d", "D",
                "r", "R", "p", "P", "i", "I",
                "1", "2", "3", "0"
            ];

            if (gameKeys.includes(event.key)) {
                event.preventDefault();
                event.stopPropagation();
            }

            this.keys[event.key] = true;

            if (this.debug) {
                console.log("Key pressed:", event.key);
            }

            this.onKeyPress(event.key);
        }, { passive: false, capture: true });

        document.addEventListener("keyup", (event) => {
            var gameKeys = [
                "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight",
                " ", "Spacebar",
                "z", "Z", "q", "Q", "s", "S", "d", "D",
                "r", "R", "p", "P", "i", "I",
                "1", "2", "3", "0"
            ];

            if (gameKeys.includes(event.key)) {
                event.preventDefault();
                event.stopPropagation();
            }

            this.keys[event.key] = false;

            if (this.debug) {
                console.log("Key released:", event.key);
            }
        }, { passive: false, capture: true });

        var world = document.getElementById("world");
        if (world) {
            world.addEventListener("mousemove", (event) => {
                var rect = world.getBoundingClientRect();
                this.mouse.x = event.clientX - rect.left;
                this.mouse.y = event.clientY - rect.top;
            });

            world.addEventListener("click", (event) => {
                var rect = world.getBoundingClientRect();
                this.mouse.clicked = true;
                this.mouse.clickX = event.clientX - rect.left;
                this.mouse.clickY = event.clientY - rect.top;
            });
        }

        console.log("Input listeners attached");
    },

    onKeyPress(key) {
        if (key === " ") {
            this.spacePressed = true;
        }

        if (key === "r" || key === "R") {
            if (typeof player !== "undefined" && player && !player.isDead) {
                player.needs.energy = Math.min(100, player.needs.energy + 10);
                console.log("Repos +10 energie");
            }
        }

        if (key === "i" || key === "I") {
            this.debug = !this.debug;
            console.log("Debug mode:", this.debug ? "ON" : "OFF");
        }

        if (typeof window.onGameHotkey === "function") {
            window.onGameHotkey(key);
        }
    },

    isMoving() {
        return this.keys["ArrowUp"] || this.keys["ArrowDown"] ||
               this.keys["ArrowLeft"] || this.keys["ArrowRight"] ||
               this.keys["z"] || this.keys["s"] || this.keys["q"] || this.keys["d"] ||
               this.keys["Z"] || this.keys["S"] || this.keys["Q"] || this.keys["D"];
    },

    getMovementVector() {
        var dx = 0;
        var dy = 0;

        if (this.keys["ArrowUp"] || this.keys["z"] || this.keys["Z"]) dy -= 1;
        if (this.keys["ArrowDown"] || this.keys["s"] || this.keys["S"]) dy += 1;
        if (this.keys["ArrowLeft"] || this.keys["q"] || this.keys["Q"]) dx -= 1;
        if (this.keys["ArrowRight"] || this.keys["d"] || this.keys["D"]) dx += 1;

        if (dx !== 0 && dy !== 0) {
            var len = Math.sqrt(dx * dx + dy * dy);
            dx /= len;
            dy /= len;
        }

        if (this.debug && (dx !== 0 || dy !== 0)) {
            console.log("Movement vector:", { dx: dx, dy: dy });
        }

        return { dx: dx, dy: dy };
    },

    clearFrame() {
        this.mouse.clicked = false;
        this.spacePressed = false;
    },

    testKeys() {
        console.log("Active keys:", Object.keys(this.keys).filter((key) => this.keys[key]));
    }
};

if (typeof document !== "undefined") {
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", function () { Input.init(); });
    } else {
        Input.init();
    }
}
