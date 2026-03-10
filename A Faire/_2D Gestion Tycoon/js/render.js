function getSafeCanvasCtx() {
    if (typeof canvas === "undefined" || typeof ctx === "undefined") return null;
    if (!canvas || !ctx) return null;
    return { canvas, ctx };
}

function drawBackground(ctx2d, width, height, dayFactor) {
    const sky = ctx2d.createLinearGradient(0, 0, 0, height);
    sky.addColorStop(0, `rgba(${Math.floor(22 + 45 * dayFactor)}, ${Math.floor(46 + 80 * dayFactor)}, ${Math.floor(76 + 100 * dayFactor)}, 1)`);
    sky.addColorStop(0.5, `rgba(${Math.floor(32 + 45 * dayFactor)}, ${Math.floor(72 + 70 * dayFactor)}, ${Math.floor(112 + 80 * dayFactor)}, 1)`);
    sky.addColorStop(1, `rgba(${Math.floor(34 + 28 * dayFactor)}, ${Math.floor(84 + 60 * dayFactor)}, ${Math.floor(62 + 40 * dayFactor)}, 1)`);

    ctx2d.fillStyle = sky;
    ctx2d.fillRect(0, 0, width, height);

    ctx2d.fillStyle = `rgba(31, 93, 70, ${0.55 + 0.25 * dayFactor})`;
    ctx2d.fillRect(0, height - 130, width, 130);

    ctx2d.fillStyle = "rgba(87, 65, 54, 0.8)";
    ctx2d.fillRect(70, height - 190, width - 140, 86);

    ctx2d.fillStyle = "rgba(0, 0, 0, 0.2)";
    for (let i = 0; i < 7; i += 1) {
        const y = height - 190 + i * 12;
        ctx2d.fillRect(70, y, width - 140, 2);
    }
}

function drawBuildingShadow(ctx2d, x, y, width, height) {
    ctx2d.fillStyle = "rgba(0, 0, 0, 0.35)";
    ctx2d.fillRect(x + 10, y + 12, width, Math.max(22, height * 0.62));
}

function drawBuildingBody(ctx2d, building, x, y, width, height) {
    ctx2d.fillStyle = building.color;
    ctx2d.fillRect(x, y, width, height);

    ctx2d.fillStyle = "rgba(255, 255, 255, 0.08)";
    ctx2d.fillRect(x + 4, y + 4, width - 8, 8);

    ctx2d.fillStyle = "#243241";
    ctx2d.beginPath();
    ctx2d.moveTo(x, y);
    const visualLevel = Math.min(20, Math.max(0, building.level));
    ctx2d.lineTo(x + width * 0.5, y - (30 + visualLevel * 2));
    ctx2d.lineTo(x + width, y);
    ctx2d.closePath();
    ctx2d.fill();
}

function drawBuildingWindows(ctx2d, building, x, y, width, height, pulse) {
    const cols = 2;
    const rows = 3;
    const w = 20;
    const h = 18;

    for (let row = 0; row < rows; row += 1) {
        for (let col = 0; col < cols; col += 1) {
            const winX = x + 14 + col * (width * 0.38);
            const winY = y + 20 + row * 24;
            const toggleSeed = (row + 1) * 13 + (col + 1) * 7 + building.level * 3 + pulse;
            const lit = (toggleSeed % 4) !== 0 || building.level >= 3;

            ctx2d.fillStyle = lit ? "rgba(255, 240, 175, 0.9)" : "rgba(35, 46, 58, 0.9)";
            ctx2d.fillRect(winX, winY, w, h);
        }
    }
}

function drawBuildingLabel(ctx2d, building, x, y, width, height) {
    ctx2d.fillStyle = "rgba(8, 20, 32, 0.72)";
    ctx2d.fillRect(x + 8, y + height - 35, width - 16, 24);

    ctx2d.fillStyle = "#ffffff";
    ctx2d.textAlign = "center";
    ctx2d.font = "bold 14px Segoe UI";
    ctx2d.fillText(building.icon, x + width / 2, y + height / 2 + 5);

    ctx2d.font = "12px Segoe UI";
    ctx2d.fillText(`Niv ${building.level}`, x + width / 2, y + height + 20);

    const cost = typeof getBuildingCost === "function" ? getBuildingCost(building) : 0;
    ctx2d.fillStyle = gameData.money >= cost ? "#4dde8c" : "#f07b7b";
    ctx2d.font = "11px Segoe UI";
    ctx2d.fillText(building.level === 0 ? "Acheter" : `${Math.floor(cost).toLocaleString("fr-FR")} EUR`, x + width / 2, y - 10);
}

function drawBuilding(ctx2d, building, pulse) {
    const visualLevel = Math.min(20, Math.max(0, building.level));
    const width = 92 + visualLevel * 4;
    const height = 108 + visualLevel * 5;
    const x = building.x;
    const y = building.y;

    drawBuildingShadow(ctx2d, x, y, width, height);
    drawBuildingBody(ctx2d, building, x, y, width, height);
    drawBuildingWindows(ctx2d, building, x, y, width, height, pulse);
    drawBuildingLabel(ctx2d, building, x, y, width, height);
}

function drawParticles(ctx2d) {
    for (const particle of gameData.particles) {
        const alpha = Math.max(0, Math.min(1, particle.life));
        ctx2d.globalAlpha = alpha;
        ctx2d.fillStyle = "#ffd56f";
        ctx2d.font = "bold 14px Segoe UI";
        ctx2d.textAlign = "center";
        ctx2d.fillText(`+${Math.floor(particle.value)}`, particle.x, particle.y);
    }
    ctx2d.globalAlpha = 1;
}

function drawOverlay(ctx2d, width) {
    const incomeNet = typeof calculateIncome === "function" ? calculateIncome() : 0;
    const incomeGross = typeof calculateGrossIncome === "function" ? calculateGrossIncome() : 0;
    const upkeep = typeof getStaffUpkeepPerSecond === "function" ? getStaffUpkeepPerSecond() : 0;
    const totalLevel = typeof getTotalLevel === "function" ? getTotalLevel() : 0;
    const multiplier = typeof getIncomeMultiplier === "function" ? getIncomeMultiplier() : 1;
    const boost = typeof getBoostState === "function" ? getBoostState() : { cooldownRemaining: 0 };
    const events = typeof getActiveEventsState === "function" ? getActiveEventsState() : [];
    const prestige = typeof getPrestigeState === "function" ? getPrestigeState() : { points: 0 };

    ctx2d.fillStyle = "rgba(6, 16, 26, 0.65)";
    ctx2d.fillRect(16, 12, 470, 108);

    ctx2d.fillStyle = "#ecf5ff";
    ctx2d.font = "bold 20px Segoe UI";
    ctx2d.textAlign = "left";
    ctx2d.fillText(`Caisse: ${Math.floor(gameData.money).toLocaleString("fr-FR")} EUR`, 28, 40);

    ctx2d.font = "14px Segoe UI";
    ctx2d.fillText(`Net: ${Math.floor(incomeNet).toLocaleString("fr-FR")} EUR/s`, 28, 62);
    ctx2d.fillText(`Brut: ${Math.floor(incomeGross).toLocaleString("fr-FR")} | Charges: ${Math.floor(upkeep).toLocaleString("fr-FR")}`, 28, 82);
    ctx2d.fillText(`Niveaux: ${totalLevel} | Mult: x${multiplier.toFixed(2)} | Prestige: ${prestige.points || 0}`, 28, 102);

    ctx2d.fillStyle = "rgba(6, 16, 26, 0.65)";
    ctx2d.fillRect(width - 280, 12, 264, 108);
    ctx2d.fillStyle = "#d5edff";
    ctx2d.fillText(`Vitesse: x${gameData.gameSpeed}`, width - 266, 40);
    ctx2d.fillText(gameData.isPaused ? "Etat: Pause" : "Etat: Actif", width - 266, 62);
    ctx2d.fillText(`Evenements: ${events.length}`, width - 266, 84);

    if (boost.cooldownRemaining > 0) {
        ctx2d.fillText(`Prime: ${boost.cooldownRemaining}s`, width - 266, 104);
    } else {
        ctx2d.fillStyle = "#6ef2a0";
        ctx2d.fillText("Prime: disponible", width - 266, 104);
    }
}

function render() {
    const refs = getSafeCanvasCtx();
    if (!refs) return;

    const width = refs.canvas.width;
    const height = refs.canvas.height;

    const playSeconds = gameData.stats && Number.isFinite(Number(gameData.stats.playSeconds))
        ? gameData.stats.playSeconds
        : 0;

    const dayCycle = (Math.sin(playSeconds / 50) + 1) * 0.5;
    const pulse = Math.floor(playSeconds * 2);

    refs.ctx.clearRect(0, 0, width, height);
    drawBackground(refs.ctx, width, height, dayCycle);

    for (const building of gameData.buildings) {
        drawBuilding(refs.ctx, building, pulse);
    }

    drawParticles(refs.ctx);
    drawOverlay(refs.ctx, width);
}
