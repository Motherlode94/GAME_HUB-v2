// Fonctions d'effets visuels

function createExplosion(x, y, color, count) {
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 8 + 2;
        const size = Math.random() * 6 + 2;
        particles.push(new Particle(
            x, y,
            Math.cos(angle) * speed,
            Math.sin(angle) * speed,
            color,
            size,
            Math.random() * 0.5 + 0.5,
            0.03
        ));
    }
}

function createShockwave(x, y, radius, color = '#ff00ff') {
    shockwaves.push({
        x, y,
        radius: 0,
        maxRadius: radius,
        life: 1,
        color
    });
}

/* ===================== */
/* NOUVEAUX EFFETS SPÉCIAUX */
/* ===================== */

function createArcEffect(x, y, radius, angle, arcWidth, color) {
    // Effet d'arc pour la hache (cleave)
    shockwaves.push({
        x, y,
        radius: 0,
        maxRadius: radius,
        life: 1,
        color,
        startAngle: angle - arcWidth / 2,
        endAngle: angle + arcWidth / 2,
        isArc: true
    });
    
    // Particules le long de l'arc
    const particleCount = 15;
    for (let i = 0; i < particleCount; i++) {
        const particleAngle = angle - arcWidth / 2 + (arcWidth * i / particleCount);
        const distance = radius * 0.8;
        const px = x + Math.cos(particleAngle) * distance;
        const py = y + Math.sin(particleAngle) * distance;
        
        particles.push(new Particle(
            px, py,
            Math.cos(particleAngle) * 3,
            Math.sin(particleAngle) * 3,
            color,
            6,
            0.8,
            0.04
        ));
    }
}

function createThrustEffect(x, y, dirX, dirY, distance, color) {
    // Effet de charge pour la lance
    const steps = 10;
    for (let i = 0; i < steps; i++) {
        const t = i / steps;
        const px = x + dirX * distance * t;
        const py = y + dirY * distance * t;
        
        // Particules le long de la trajectoire
        for (let j = 0; j < 3; j++) {
            particles.push(new Particle(
                px + (Math.random() - 0.5) * 20,
                py + (Math.random() - 0.5) * 20,
                (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 2,
                color,
                4 + Math.random() * 2,
                0.6,
                0.03
            ));
        }
    }
    
    // Ligne de thrust
    shockwaves.push({
        x, y,
        endX: x + dirX * distance,
        endY: y + dirY * distance,
        life: 1,
        color,
        isLine: true,
        width: 20
    });
}

function createEarthquakeEffect(x, y, radius, color) {
    // Plusieurs ondes de choc pour le marteau
    for (let i = 0; i < 3; i++) {
        setTimeout(() => {
            shockwaves.push({
                x, y,
                radius: 0,
                maxRadius: radius * (0.7 + i * 0.15),
                life: 1,
                color: i === 0 ? color : '#ffaa00',
                thickness: 4 + i * 2
            });
        }, i * 100);
    }
    
    // Particules de poussière
    for (let i = 0; i < 40; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 6 + 2;
        particles.push(new Particle(
            x, y,
            Math.cos(angle) * speed,
            Math.sin(angle) * speed,
            '#8B4513',
            8 + Math.random() * 4,
            1,
            0.02
        ));
    }
}

function createTeleportEffect(x, y, color) {
    // Effet de téléportation pour la dague
    for (let i = 0; i < 20; i++) {
        const angle = (Math.PI * 2 * i) / 20;
        const speed = 6;
        particles.push(new Particle(
            x, y,
            Math.cos(angle) * speed,
            Math.sin(angle) * speed,
            color,
            6,
            1,
            0.05
        ));
    }
    
    // Anneau lumineux
    shockwaves.push({
        x, y,
        radius: 30,
        maxRadius: 80,
        life: 1,
        color,
        expanding: true
    });
}

function createDashEffect(x, y, color) {
    // Effet de dash simple
    for (let i = 0; i < 10; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 4 + 1;
        particles.push(new Particle(
            x, y,
            Math.cos(angle) * speed,
            Math.sin(angle) * speed,
            color,
            4,
            0.8,
            0.04
        ));
    }
}

function createLightningEffect(fromPos, toPos, color) {
    // Éclair en chaîne pour la baguette
    const segments = 8;
    const points = [{x: fromPos.x, y: fromPos.y}];
    
    // Créer des points intermédiaires avec du zigzag
    for (let i = 1; i < segments; i++) {
        const t = i / segments;
        const baseX = fromPos.x + (toPos.x - fromPos.x) * t;
        const baseY = fromPos.y + (toPos.y - fromPos.y) * t;
        const offset = 20;
        
        points.push({
            x: baseX + (Math.random() - 0.5) * offset,
            y: baseY + (Math.random() - 0.5) * offset
        });
    }
    points.push({x: toPos.x, y: toPos.y});
    
    // Ajouter l'éclair aux effets visuels
    lightningEffects.push({
        points,
        life: 1,
        color,
        timer: 15
    });
    
    // Particules aux extrémités
    [fromPos, toPos].forEach(pos => {
        for (let i = 0; i < 8; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 3 + 1;
            particles.push(new Particle(
                pos.x, pos.y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                color,
                3,
                0.6,
                0.05
            ));
        }
    });
}

function createCritEffect(x, y) {
    // Effet de coup critique
    for (let i = 0; i < 12; i++) {
        const angle = (Math.PI * 2 * i) / 12;
        particles.push(new Particle(
            x, y,
            Math.cos(angle) * 5,
            Math.sin(angle) * 5,
            '#ffff00',
            8,
            1,
            0.04
        ));
    }
    
    // Texte "CRIT!"
    damageNumbers.push({
        x,
        y: y - 20,
        value: 'CRIT!',
        timer: 40,
        color: '#ffff00',
        velocity: new Vector(0, -3),
        isCrit: true
    });
}

/* ===================== */
/* MISE À JOUR DES EFFETS */
/* ===================== */

// Tableau pour les éclairs
if (typeof lightningEffects === 'undefined') {
    var lightningEffects = [];
}

// Fonction pour mettre à jour et dessiner les ondes de choc améliorées
function updateAndDrawShockwaves() {
    shockwaves = shockwaves.filter(sw => {
        sw.life -= 0.03;
        if (sw.life <= 0) return false;
        
        if (!sw.isLine) {
            sw.radius = sw.maxRadius * (1 - sw.life);
        }
        
        ctx.save();
        ctx.globalAlpha = sw.life * 0.6;
        ctx.strokeStyle = sw.color;
        ctx.lineWidth = sw.thickness || 3;
        ctx.shadowColor = sw.color;
        ctx.shadowBlur = 15;
        
        if (sw.isArc) {
            // Arc (cleave)
            ctx.beginPath();
            ctx.arc(sw.x, sw.y, sw.radius, sw.startAngle, sw.endAngle);
            ctx.stroke();
        } else if (sw.isLine) {
            // Ligne (thrust)
            const t = 1 - sw.life;
            const currentEndX = sw.x + (sw.endX - sw.x) * t;
            const currentEndY = sw.y + (sw.endY - sw.y) * t;
            
            ctx.lineWidth = sw.width;
            ctx.beginPath();
            ctx.moveTo(sw.x, sw.y);
            ctx.lineTo(currentEndX, currentEndY);
            ctx.stroke();
        } else {
            // Cercle normal
            ctx.beginPath();
            ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        ctx.restore();
        return true;
    });
}

// Fonction pour mettre à jour et dessiner les éclairs
function updateAndDrawLightning() {
    lightningEffects = lightningEffects.filter(lightning => {
        lightning.timer--;
        if (lightning.timer <= 0) return false;
        
        lightning.life = lightning.timer / 15;
        
        ctx.save();
        ctx.globalAlpha = lightning.life;
        ctx.strokeStyle = lightning.color;
        ctx.lineWidth = 3;
        ctx.shadowColor = lightning.color;
        ctx.shadowBlur = 20;
        ctx.lineCap = 'round';
        
        // Dessiner l'éclair principal
        ctx.beginPath();
        ctx.moveTo(lightning.points[0].x, lightning.points[0].y);
        for (let i = 1; i < lightning.points.length; i++) {
            ctx.lineTo(lightning.points[i].x, lightning.points[i].y);
        }
        ctx.stroke();
        
        // Éclair secondaire plus fin
        ctx.globalAlpha = lightning.life * 0.5;
        ctx.lineWidth = 6;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();
        
        ctx.restore();
        return true;
    });
}

/* ===================== */
/* === LEVEL UP === */
/* ===================== */

function createLevelUpEffect(x, y, upgradeType) {
    let color;
    switch (upgradeType) {
        case 'health': color = '#ff4444'; break;
        case 'damage': color = '#ffff00'; break;
        case 'speed': color = '#00ffff'; break;
        case 'attackSpeed': color = '#ff8800'; break;
        default: color = '#ffffff';
    }

    for (let i = 0; i < 24; i++) {
        const angle = (i * Math.PI * 2) / 24;
        particles.push(new Particle(
            x, y,
            Math.cos(angle) * 4,
            Math.sin(angle) * 4,
            color,
            6,
            1.5,
            0.02
        ));
    }

    levelUpMessages.push({
        x,
        y,
        text: 'LEVEL UP!',
        subtext: upgradeType.toUpperCase(),
        timer: 120,
        color
    });
}

function createDamageNumber(x, y, damage, color) {
    damageNumbers.push({
        x,
        y,
        value: damage,
        timer: 60,
        color,
        velocity: new Vector(0, -2)
    });
}

function createScorePopup(x, y, score) {
    scorePopups.push({
        x,
        y,
        value: `+${score}`,
        timer: 90,
        color: '#ffff00'
    });
}

function createExperiencePopup(x, y, text) {
    experiencePopups.push({
        x,
        y,
        text,
        timer: 90,
        color: '#00ffff'
    });
}

/* ===================== */
/* === BARRE SPECIAL === */
/* ===================== */

function drawSpecialBar(x, y, current, max, color = '#ff00ff') {
    if (!Number.isFinite(current) || !Number.isFinite(max) || max <= 0) return;

    const percent = Math.max(0, Math.min(1, current / max));
    const width = 60;
    const height = 8;

    ctx.save();

    // Fond
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(x - width / 2 - 1, y - 1, width + 2, height + 2);

    if (percent > 0) {
        const gradient = ctx.createLinearGradient(
            x - width / 2,
            y,
            x - width / 2 + width * percent,
            y
        );
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, '#00ffff');
        ctx.fillStyle = gradient;
        ctx.fillRect(
            x - width / 2,
            y,
            width * percent,
            height
        );
    }

    if (percent >= 1) {
        // Animation pulsante
        const pulse = Math.sin(Date.now() / 100) * 0.3 + 0.7;
        ctx.globalAlpha = pulse;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x - width / 2, y, width, height);
        ctx.globalAlpha = 1;
        
        ctx.shadowColor = color;
        ctx.shadowBlur = 15;
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.strokeRect(x - width / 2, y, width, height);

        ctx.font = 'bold 10px Arial';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('SPECIAL', x, y - 8);
    }

    ctx.restore();
}

/* ===================== */
/* === DASH INDICATOR === */
/* ===================== */

function drawDashIndicator(x, y, current, max) {
    if (!Number.isFinite(current) || !Number.isFinite(max) || max <= 0) return;

    const percent = Math.max(0, Math.min(1, 1 - current / max));
    const radius = 8;

    ctx.save();

    // Cercle de fond
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    // Arc de progression
    ctx.strokeStyle = percent === 1 ? '#00ffff' : '#0088aa';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = percent === 1 ? 10 : 0;
    ctx.beginPath();
    ctx.arc(x, y, radius, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * percent);
    ctx.stroke();

    // Icône dash
    if (percent === 1) {
        ctx.fillStyle = '#00ffff';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⚡', x, y);
    }

    ctx.restore();
}

/* ===================== */
/* === COMBO COUNTER === */
/* ===================== */

function drawComboCounter() {
    if (!player || player.combo <= 0) return;

    const maxTime = player.comboMaxTime;
    if (!Number.isFinite(maxTime) || maxTime <= 0) return;

    const percent = Math.max(
        0,
        Math.min(1, player.comboTimer / maxTime)
    );

    ctx.save();

    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(canvas.width / 2 - 150, 20, 300, 60);

    const comboSize = 40 + player.combo;
    ctx.font = `bold ${comboSize}px Arial`;

    const grad = ctx.createLinearGradient(
        canvas.width / 2 - 100,
        40,
        canvas.width / 2 + 100,
        40
    );

    if (player.combo > 20) {
        grad.addColorStop(0, '#ff0000');
        grad.addColorStop(0.5, '#ffff00');
        grad.addColorStop(1, '#ff0000');
    } else if (player.combo > 10) {
        grad.addColorStop(0, '#ffff00');
        grad.addColorStop(1, '#ff8800');
    } else {
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(1, '#ffff00');
    }

    ctx.fillStyle = grad;
    ctx.textAlign = 'center';
    ctx.shadowColor = '#000';
    ctx.shadowBlur = 10;
    ctx.fillText(`COMBO x${player.combo}`, canvas.width / 2, 60);

    ctx.font = 'bold 20px Arial';
    ctx.fillStyle = '#00ffff';
    ctx.fillText(
        `${(1 + player.combo * 0.15).toFixed(1)}x MULTIPLIER`,
        canvas.width / 2,
        85
    );

    const barWidth = 250;
    const barHeight = 6;

    ctx.fillStyle = '#333';
    ctx.fillRect(
        canvas.width / 2 - barWidth / 2,
        95,
        barWidth,
        barHeight
    );

    if (percent > 0) {
        const barGrad = ctx.createLinearGradient(
            canvas.width / 2 - barWidth / 2,
            95,
            canvas.width / 2 - barWidth / 2 + barWidth * percent,
            95
        );

        barGrad.addColorStop(0, percent > 0.6 ? '#00ff00' : percent > 0.3 ? '#ffff00' : '#ff0000');
        barGrad.addColorStop(1, percent > 0.6 ? '#00aa00' : percent > 0.3 ? '#aaaa00' : '#aa0000');

        ctx.fillStyle = barGrad;
        ctx.fillRect(
            canvas.width / 2 - barWidth / 2,
            95,
            barWidth * percent,
            barHeight
        );
    }

    ctx.restore();
}