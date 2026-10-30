// js/ui/map.js
const Map = {
    canvas: null,
    ctx: null,
    tileSize: 40,
    cols: 15,
    rows: 10,
    hoveredTile: null,

    init() {
        this.canvas = document.getElementById("gameCanvas");
        if (!this.canvas) {
            console.error("Canvas introuvable");
            return;
        }

        this.ctx = this.canvas.getContext("2d");
        this.canvas.width = this.cols * this.tileSize;
        this.canvas.height = this.rows * this.tileSize;

        this.canvas.addEventListener("click", (event) => this.handleClick(event));
        console.log("Carte initialisee");
    },

    draw() {
        if (!this.ctx || !this.canvas) return;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        for (let y = 0; y < this.rows; y += 1) {
            for (let x = 0; x < this.cols; x += 1) {
                const px = x * this.tileSize;
                const py = y * this.tileSize;

                this.ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
                this.ctx.strokeRect(px, py, this.tileSize, this.tileSize);

                const chantier = gameState.underConstruction.find((building) => building.x === x && building.y === y);
                if (chantier) {
                    this.drawConstruction(px, py, chantier);
                    continue;
                }

                const building = gameState.buildings.find((item) => item.x === x && item.y === y);
                if (building) {
                    this.drawBuilding(px, py, building.name, building.level || 1);
                }
            }
        }

        if (typeof Citizens !== "undefined" && Array.isArray(Citizens.list)) {
            Citizens.list.forEach((citizen) => {
                if (citizen.pixelX === undefined || citizen.pixelY === undefined) return;

                const posX = Math.max(5, Math.min(citizen.pixelX, this.canvas.width - 5));
                const posY = Math.max(5, Math.min(citizen.pixelY, this.canvas.height - 5));

                this.ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
                this.ctx.beginPath();
                this.ctx.arc(posX + 2, posY + 4, 6, 0, Math.PI * 2);
                this.ctx.fill();

                this.ctx.fillStyle = citizen.color || "#3498db";
                this.ctx.beginPath();
                this.ctx.arc(posX, posY, 5, 0, Math.PI * 2);
                this.ctx.fill();

                this.ctx.strokeStyle = "white";
                this.ctx.lineWidth = 1;
                this.ctx.stroke();

                if (citizen.type && citizen.type.symbol) {
                    this.ctx.fillStyle = "white";
                    this.ctx.font = "10px Arial";
                    this.ctx.textAlign = "center";
                    this.ctx.textBaseline = "middle";
                    this.ctx.fillText(citizen.type.symbol, posX, posY);
                }
            });

            this.ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
            this.ctx.fillRect(5, 5, 120, 20);
            this.ctx.fillStyle = "white";
            this.ctx.font = "12px Arial";
            this.ctx.textAlign = "left";
            this.ctx.textBaseline = "alphabetic";
            this.ctx.fillText(`Citoyens: ${Citizens.list.length}`, 10, 18);
        }
    },

    drawConstruction(px, py, chantier) {
        const progress = 1 - (chantier.timeLeft / chantier.totalTime);
        const padding = 5;

        this.ctx.fillStyle = "rgba(149, 165, 166, 0.4)";
        this.ctx.fillRect(px + padding, py + padding, this.tileSize - (padding * 2), this.tileSize - (padding * 2));

        this.ctx.fillStyle = "#34495e";
        this.ctx.fillRect(px + 5, py + this.tileSize - 10, this.tileSize - 10, 4);

        this.ctx.fillStyle = "#f1c40f";
        this.ctx.fillRect(px + 5, py + this.tileSize - 10, (this.tileSize - 10) * progress, 4);

        this.ctx.fillStyle = "white";
        this.ctx.font = "10px Arial";
        this.ctx.textAlign = "center";
        this.ctx.textBaseline = "middle";
        this.ctx.fillText("CONSTR.", px + (this.tileSize / 2), py + (this.tileSize / 2));
    },

    drawBuilding(px, py, name, level) {
        const padding = 5;
        const size = this.tileSize - (padding * 2);

        const styles = {
            Ferme: { color: "#2ecc71", symbol: "F" },
            Mine: { color: "#95a5a6", symbol: "M" },
            "Marche": { color: "#f1c40f", symbol: "$" },
            "Marché": { color: "#f1c40f", symbol: "$" },
            "Marché": { color: "#f1c40f", symbol: "$" },
            Barracks: { color: "#e74c3c", symbol: "B" },
            "Chateau": { color: "#8e44ad", symbol: "C" },
            "Château": { color: "#8e44ad", symbol: "C" },
            "Château": { color: "#8e44ad", symbol: "C" }
        };

        const style = styles[name] || { color: "#34495e", symbol: "?" };

        this.ctx.fillStyle = style.color;
        this.ctx.fillRect(px + padding, py + padding, size, size);

        this.ctx.fillStyle = "white";
        this.ctx.font = "18px Arial";
        this.ctx.textAlign = "center";
        this.ctx.textBaseline = "middle";
        this.ctx.fillText(style.symbol, px + (this.tileSize / 2), py + (this.tileSize / 2));

        if (level > 1) {
            this.ctx.fillStyle = "#2c3e50";
            this.ctx.beginPath();
            this.ctx.arc(px + this.tileSize - 8, py + 8, 7, 0, Math.PI * 2);
            this.ctx.fill();

            this.ctx.fillStyle = "white";
            this.ctx.font = "bold 9px Arial";
            this.ctx.fillText(level, px + this.tileSize - 8, py + 8);
        }
    },

    handleClick(event) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        const localX = (event.clientX - rect.left) * scaleX;
        const localY = (event.clientY - rect.top) * scaleY;
        const x = Math.floor(localX / this.tileSize);
        const y = Math.floor(localY / this.tileSize);
        const isCtrlLike = !!(event.ctrlKey || event.metaKey);
        const isShift = !!event.shiftKey;

        if (x < 0 || y < 0 || x >= this.cols || y >= this.rows) {
            UI.notify("Zone hors carte.", "warning");
            return;
        }

        if (window.currentSelection) {
            Buildings.place(window.currentSelection, x, y);
            return;
        }

        const clickedBuilding = gameState.buildings.find((building) => building.x === x && building.y === y);
        if (clickedBuilding) {
            if (isCtrlLike) {
                // Ctrl+click: apply group upgrades to same building type.
                const maxOperations = isShift ? 999 : 4;
                this.upgradeBuildingGroup(clickedBuilding.name, maxOperations);
            } else {
                Buildings.upgrade(x, y);
            }
            return;
        }

        UI.notify(`Case selectionnee: ${x}, ${y}. Choisissez un batiment.`, "info");
    },

    upgradeBuildingGroup(buildingName, maxOperations) {
        const candidates = gameState.buildings
            .filter((building) => building.name === buildingName)
            .slice()
            .sort((a, b) => (a.level || 1) - (b.level || 1));

        if (!candidates.length) return;

        const cap = Math.max(1, Math.floor(Number(maxOperations) || 1));
        let upgraded = 0;

        candidates.forEach((building) => {
            if (upgraded >= cap) return;

            const before = building.level || 1;
            Buildings.upgrade(building.x, building.y);
            if ((building.level || 1) > before) {
                upgraded += 1;
            }
        });

        if (upgraded > 0) {
            UI.notify(`${buildingName}: ${upgraded} amelioration(s) de groupe.`, "success");
        }
    }
};

