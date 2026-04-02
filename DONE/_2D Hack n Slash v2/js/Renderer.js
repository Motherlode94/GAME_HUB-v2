class Renderer {
    static draw(player, ctx) {
        const pos = player.pos;
        const facing = player.facing;
        const stats = player.stats;
        const prog = player.progression;
        const weaponSystem = player.weaponSystem;
        const weapon = weaponSystem.weapon;

        ctx.save();
        ctx.translate(pos.x, pos.y);
        ctx.rotate(Math.atan2(facing.y, facing.x));

        // Invincibilité (clignotement)
        if (
            stats.invincible &&
            Math.floor(stats.invincibleTimer / 3) % 2 === 0
        ) {
            ctx.globalAlpha = 0.4;
        }

        // Effet dash
        if (player.dash.dashing) {
            ctx.shadowColor = '#00ffff';
            ctx.shadowBlur = 30;
            ctx.globalAlpha = 0.7;

            // Traînée de dash
            for (let i = 1; i <= 3; i++) {
                ctx.globalAlpha = 0.3 - i * 0.1;
                ctx.fillStyle = '#00ffff';
                ctx.fillRect(-14 - i * 5, -14, 28, 28);
            }
            ctx.globalAlpha = 0.7;
        }

        // Sprite joueur
        if (playerImg && playerImg.complete) {
            ctx.drawImage(
                playerImg,
                0, 0, 200, 200,
                -16, -16, 32, 32
            );
        } else {
            ctx.fillStyle = '#4488ff';
            ctx.fillRect(-14, -14, 28, 28);
        }

        // Attaque visuelle (arme)
        if (weaponSystem.attacking) {
            this.drawWeaponAttack(ctx, weaponSystem, weapon, prog);
        }

        // Aura combo élevé
        if (weaponSystem.comboCount > 2) {
            this.drawComboAura(ctx, weaponSystem.comboCount);
        }

        // Aura niveau élevé
        if (prog.level >= 10) {
            this.drawLevelAura(ctx, prog.level);
        }

        ctx.restore();

        // ===== UI LOCALE =====

        // Nom de l'arme avec combo
        this.drawWeaponName(ctx, weapon, pos, weaponSystem.comboCount);

        // Indicateur de combo
        if (weaponSystem.comboCount > 0) {
            this.drawComboCounter(ctx, pos, weaponSystem.comboCount);
        }

        // Barre spéciale
        if (prog.specialCharge > 0) {
            drawSpecialBar(
                pos.x,
                pos.y - 40,
                prog.specialCharge,
                prog.specialMax,
                weapon.color
            );
        }

        // Cooldown dash
        if (player.dash.cooldown > 0) {
            drawDashIndicator(
                pos.x,
                pos.y - 55,
                player.dash.cooldown,
                player.dash.maxCooldown
            );
        }

        // Indicateur de critique (dague)
        if (weapon.critChance) {
            this.drawCritChanceIndicator(ctx, pos, weapon.critChance);
        }
    }

static drawWeaponAttack(player, ctx) {
    const ws = player.weaponSystem;
    if (!ws || !ws.weapon) return; // ✅ sécurité absolue

    const weapon = ws.weapon;
    const style = weapon.attackStyle || 'slash';
    const combo = player.progression.combo;
    const angle = Math.atan2(player.facing.y, player.facing.x);

    ctx.save();
    ctx.translate(player.pos.x, player.pos.y);
    ctx.rotate(angle);

    switch (style) {

        // 🗡️ ÉPÉE
        case 'slash': {
            ctx.strokeStyle = weapon.color;
            ctx.lineWidth = 6;
            ctx.beginPath();
            ctx.arc(0, 0, 45, -0.6, 0.6);
            ctx.stroke();
            break;
        }

        // 🪓 HACHE
        case 'chop': {
            ctx.strokeStyle = weapon.color;
            ctx.lineWidth = 12;
            ctx.beginPath();
            ctx.arc(0, 0, 55, -0.8, 0.3);
            ctx.stroke();

            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(55, 0, 8, 0, Math.PI * 2);
            ctx.fill();
            break;
        }

        // 🔱 LANCE
        case 'thrust': {
            ctx.strokeStyle = weapon.color;
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(10, 0);
            ctx.lineTo(90, 0);
            ctx.stroke();
            break;
        }

        // 🗡️ DAGUE
        case 'stab': {
            ctx.strokeStyle = weapon.color;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(10, 0);
            ctx.lineTo(30, 0);
            ctx.stroke();
            break;
        }

        // 🔨 MARTEAU
        case 'smash': {
            ctx.strokeStyle = weapon.color;
            ctx.lineWidth = 8;
            ctx.beginPath();
            ctx.arc(0, 0, 40 + combo * 2, 0, Math.PI * 2);
            ctx.stroke();
            break;
        }

        // ✨ MAGIE
        case 'magic': {
            ctx.strokeStyle = weapon.color;
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(0, 0, 30, 0, Math.PI * 2);
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(0, 0, 15, 0, Math.PI * 2);
            ctx.stroke();
            break;
        }

        // 🏹 ARC
        case 'ranged': {
            ctx.strokeStyle = weapon.color;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, -15);
            ctx.quadraticCurveTo(30, 0, 0, 15);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(10, 0);
            ctx.lineTo(50, 0);
            ctx.stroke();
            break;
        }
    }

    ctx.restore();
}


    static drawWeaponAttack(player, ctx) {
    const weapon = player.weaponSystem.weapon;
    const style = weapon.attackStyle;
    const combo = player.progression.combo;
    const angle = Math.atan2(player.facing.y, player.facing.x);

    ctx.save();
    ctx.translate(player.pos.x, player.pos.y);
    ctx.rotate(angle);

    switch (style) {

        // 🗡️ ÉPÉE — arc rapide
        case 'slash': {
            ctx.strokeStyle = weapon.color;
            ctx.lineWidth = 6;
            ctx.beginPath();
            ctx.arc(0, 0, 45, -0.6, 0.6);
            ctx.stroke();
            break;
        }

        // 🪓 HACHE — arc LOURD + impact
        case 'chop': {
            ctx.strokeStyle = weapon.color;
            ctx.lineWidth = 12;
            ctx.beginPath();
            ctx.arc(0, 0, 55, -0.8, 0.3);
            ctx.stroke();

            // impact
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(55, 0, 8, 0, Math.PI * 2);
            ctx.fill();
            break;
        }

        // 🔱 LANCE — ligne longue
        case 'thrust': {
            ctx.strokeStyle = weapon.color;
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(10, 0);
            ctx.lineTo(90, 0);
            ctx.stroke();
            break;
        }

        // 🗡️ DAGUE — pique courte & rapide
        case 'stab': {
            ctx.strokeStyle = weapon.color;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(10, 0);
            ctx.lineTo(30, 0);
            ctx.stroke();
            break;
        }

        // 🔨 MARTEAU — ONDE DE CHOC
        case 'smash': {
            ctx.strokeStyle = weapon.color;
            ctx.lineWidth = 8;
            ctx.beginPath();
            ctx.arc(0, 0, 40 + combo * 2, 0, Math.PI * 2);
            ctx.stroke();
            break;
        }

        // ✨ BÂTON / BAGUETTE — cercle magique
        case 'magic': {
            ctx.strokeStyle = weapon.color;
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(0, 0, 30, 0, Math.PI * 2);
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(0, 0, 15, 0, Math.PI * 2);
            ctx.stroke();
            break;
        }

        // 🏹 ARC — ligne + flèche
        case 'ranged': {
            ctx.strokeStyle = weapon.color;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, -15);
            ctx.quadraticCurveTo(30, 0, 0, 15);
            ctx.stroke();

            // flèche
            ctx.beginPath();
            ctx.moveTo(10, 0);
            ctx.lineTo(50, 0);
            ctx.stroke();
            break;
        }
    }

    ctx.restore();
}


    static drawWeaponShape(ctx, style, weapon, combo, progress) {
        switch (style) {
            // ⚔️ ÉPÉE – arc rapide
            case 'slash': {
                ctx.lineWidth = 6 + combo * 0.5;
                const angle = progress * 1.6 - 0.8;
                ctx.beginPath();
                ctx.arc(0, 0, 45 + combo * 2, -0.8, angle);
                ctx.stroke();
                
                // Lueur à l'extrémité
                const endX = Math.cos(angle) * (45 + combo * 2);
                const endY = Math.sin(angle) * (45 + combo * 2);
                ctx.fillStyle = weapon.color;
                ctx.beginPath();
                ctx.arc(endX, endY, 3, 0, Math.PI * 2);
                ctx.fill();
                break;
            }

            // 🪓 HACHE – arc large et lourd
            case 'chop': {
                ctx.lineWidth = 10 + combo * 0.5;
                const angle = progress * 1.4 - 1.2;
                ctx.beginPath();
                ctx.arc(0, 0, 55 + combo, -1.2, angle);
                ctx.stroke();
                
                // Effet de puissance
                if (progress > 0.7) {
                    ctx.strokeStyle = '#ffaa00';
                    ctx.lineWidth = 4;
                    ctx.beginPath();
                    ctx.arc(0, 0, 60 + combo, angle - 0.2, angle);
                    ctx.stroke();
                }
                break;
            }

            // 🗡️ DAGUE – pique courte et rapide
            case 'stab': {
                ctx.lineWidth = 4 + combo * 0.3;
                const length = 15 + progress * (20 + combo * 2);
                ctx.beginPath();
                ctx.moveTo(15, 0);
                ctx.lineTo(length, 0);
                ctx.stroke();
                
                // Éclair en bout de lame
                if (progress > 0.8) {
                    ctx.fillStyle = weapon.color;
                    ctx.beginPath();
                    ctx.arc(length, 0, 4, 0, Math.PI * 2);
                    ctx.fill();
                }
                break;
            }

            // 🔱 LANCE – ligne longue avec extension
            case 'thrust': {
                ctx.lineWidth = 5 + combo * 0.4;
                const length = 15 + progress * 75;
                ctx.beginPath();
                ctx.moveTo(15, 0);
                ctx.lineTo(length, 0);
                ctx.stroke();
                
                // Pointe brillante
                ctx.fillStyle = weapon.color;
                ctx.shadowBlur = 30;
                ctx.beginPath();
                ctx.moveTo(length, 0);
                ctx.lineTo(length + 10, -4);
                ctx.lineTo(length + 10, 4);
                ctx.closePath();
                ctx.fill();
                break;
            }

            // 🔨 MARTEAU – impact circulaire
            case 'smash': {
                ctx.lineWidth = 8 + combo;
                const radius = 40 + progress * 20;
                ctx.beginPath();
                ctx.arc(30, 0, radius * (1 - progress * 0.3), 0, Math.PI * 2);
                ctx.stroke();
                
                // Ondes de choc
                if (progress > 0.6) {
                    ctx.globalAlpha = 0.5 * (1 - progress);
                    ctx.strokeStyle = '#ffaa00';
                    ctx.lineWidth = 3;
                    for (let i = 1; i <= 2; i++) {
                        ctx.beginPath();
                        ctx.arc(30, 0, radius + i * 15, 0, Math.PI * 2);
                        ctx.stroke();
                    }
                }
                break;
            }

            // ✨ BÂTON – onde magique
            case 'magic': {
                ctx.lineWidth = 4 + combo * 0.3;
                const radius = 35 + combo + progress * 15;
                
                // Cercle magique
                ctx.beginPath();
                ctx.arc(25, 0, radius, 0, Math.PI * 2);
                ctx.stroke();
                
                // Particules
                for (let i = 0; i < 6; i++) {
                    const angle = (Math.PI * 2 * i / 6) + progress * Math.PI;
                    const x = 25 + Math.cos(angle) * radius;
                    const y = Math.sin(angle) * radius;
                    ctx.fillStyle = weapon.color;
                    ctx.globalAlpha = 0.8;
                    ctx.beginPath();
                    ctx.arc(x, y, 2, 0, Math.PI * 2);
                    ctx.fill();
                }
                break;
            }

            // 🏹 ARC – flèche
            case 'ranged': {
                ctx.lineWidth = 3;
                const drawProgress = Math.min(progress * 2, 1);
                
                // Arc
                ctx.beginPath();
                ctx.arc(-10, 0, 20, -Math.PI/3, Math.PI/3);
                ctx.stroke();
                
                // Corde
                ctx.beginPath();
                ctx.moveTo(-10 - 17.3, -10);
                ctx.lineTo(-10 - 17.3 * (1 - drawProgress * 0.3), 0);
                ctx.lineTo(-10 - 17.3, 10);
                ctx.stroke();
                
                // Flèche (si pas encore tirée)
                if (progress < 0.5) {
                    ctx.strokeStyle = '#8B4513';
                    ctx.beginPath();
                    ctx.moveTo(-10 - 17.3 * (1 - drawProgress * 0.3), 0);
                    ctx.lineTo(-30, 0);
                    ctx.stroke();
                }
                break;
            }
        }
    }

    static drawComboAura(ctx, combo) {
        const intensity = Math.min(combo / 5, 1);
        const colors = [
            '#ffaa00', // Bronze
            '#ffdd00', // Or
            '#ff4400', // Rouge
            '#ff00ff'  // Magenta
        ];
        
        const colorIndex = Math.min(Math.floor(combo / 2), colors.length - 1);
        const auraSize = 25 + combo * 2;

        ctx.save();
        ctx.globalAlpha = 0.3 + intensity * 0.3;
        ctx.shadowColor = colors[colorIndex];
        ctx.shadowBlur = 30;
        ctx.strokeStyle = colors[colorIndex];
        ctx.lineWidth = 2 + combo * 0.3;

        // Aura principale
        ctx.beginPath();
        ctx.arc(0, 0, auraSize, 0, Math.PI * 2);
        ctx.stroke();

        // Aura secondaire pulsante
        ctx.globalAlpha = 0.2;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(0, 0, auraSize + 5 + Math.sin(Date.now() / 100) * 3, 0, Math.PI * 2);
        ctx.stroke();

        ctx.restore();
    }

    static drawLevelAura(ctx, level) {
        const size = 30 + level * 0.5;
        const pulse = Math.sin(Date.now() / 200) * 0.2 + 0.8;

        ctx.save();
        ctx.globalAlpha = 0.2;
        ctx.strokeStyle = `hsl(${(level * 10) % 360}, 70%, 60%)`;
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.arc(0, 0, size * pulse, 0, Math.PI * 2);
        ctx.stroke();

        ctx.restore();
    }

    static drawWeaponName(ctx, weapon, pos, combo) {
        ctx.save();
        ctx.font = combo > 3 ? 'bold 18px Arial' : 'bold 16px Arial';
        ctx.textAlign = 'center';
        
        // Contour
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 4;
        ctx.strokeText(weapon.name, pos.x, pos.y - 70);
        
        // Couleur avec intensité selon combo
        const alpha = combo > 0 ? Math.min(1, 0.7 + combo * 0.1) : 1;
        ctx.fillStyle = weapon.color;
        ctx.globalAlpha = alpha;
        ctx.fillText(weapon.name, pos.x, pos.y - 70);
        
        ctx.restore();
    }

    static drawComboCounter(ctx, pos, combo) {
        if (combo === 0) return;

        ctx.save();
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        
        // Couleur selon le niveau de combo
        let color = '#ffffff';
        if (combo >= 5) color = '#ff00ff';
        else if (combo >= 3) color = '#ff4400';
        else if (combo >= 2) color = '#ffaa00';

        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        ctx.strokeText(`×${combo} COMBO`, pos.x, pos.y - 85);
        
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 10;
        ctx.fillText(`×${combo} COMBO`, pos.x, pos.y - 85);
        
        ctx.restore();
    }
    static drawWeaponAttack(player, ctx) {
    if (!player || !player.weaponSystem) return;

    const weapon = player.weaponSystem.weapon;
    if (!weapon) return;

    const style = weapon.attackStyle || 'slash';
    const combo = player.progression.combo;
    const angle = Math.atan2(player.facing.y, player.facing.x);

    ctx.save();
    ctx.translate(player.pos.x, player.pos.y);
    ctx.rotate(angle);

    switch (style) {

        // 🗡️ ÉPÉE
        case 'slash':
            ctx.lineWidth = 6;
            ctx.strokeStyle = weapon.color;
            ctx.beginPath();
            ctx.arc(0, 0, 45, -0.6, 0.6);
            ctx.stroke();
            break;

        // 🪓 HACHE
        case 'chop':
            ctx.lineWidth = 12;
            ctx.strokeStyle = weapon.color;
            ctx.beginPath();
            ctx.arc(0, 0, 55, -0.9, 0.2);
            ctx.stroke();

            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(55, 0, 8, 0, Math.PI * 2);
            ctx.fill();
            break;

        // 🔱 LANCE
        case 'thrust':
            ctx.lineWidth = 4;
            ctx.strokeStyle = weapon.color;
            ctx.beginPath();
            ctx.moveTo(10, 0);
            ctx.lineTo(90, 0);
            ctx.stroke();
            break;

        // 🗡️ DAGUE
        case 'stab':
            ctx.lineWidth = 3;
            ctx.strokeStyle = weapon.color;
            ctx.beginPath();
            ctx.moveTo(10, 0);
            ctx.lineTo(30, 0);
            ctx.stroke();
            break;

        // 🔨 MARTEAU
        case 'smash':
            ctx.lineWidth = 8;
            ctx.strokeStyle = weapon.color;
            ctx.beginPath();
            ctx.arc(0, 0, 40 + combo * 2, 0, Math.PI * 2);
            ctx.stroke();
            break;

        // ✨ MAGIE
        case 'magic':
            ctx.lineWidth = 4;
            ctx.strokeStyle = weapon.color;
            ctx.beginPath();
            ctx.arc(0, 0, 30, 0, Math.PI * 2);
            ctx.stroke();
            break;

        // 🏹 ARC
        case 'ranged':
            ctx.lineWidth = 2;
            ctx.strokeStyle = weapon.color;

            ctx.beginPath();
            ctx.moveTo(0, -15);
            ctx.quadraticCurveTo(30, 0, 0, 15);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(10, 0);
            ctx.lineTo(50, 0);
            ctx.stroke();
            break;
    }

    ctx.restore();
}


    static drawCritChanceIndicator(ctx, pos, critChance) {
        const percent = Math.round(critChance * 100);
        
        ctx.save();
        ctx.font = 'bold 11px Arial';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffaa00';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        
        ctx.strokeText(`CRIT ${percent}%`, pos.x + 40, pos.y - 50);
        ctx.fillText(`CRIT ${percent}%`, pos.x + 40, pos.y - 50);
        
        ctx.restore();
    }

    static easeOutQuad(t) {
        return t * (2 - t);
    }

    static easeInOutCubic(t) {
        return t < 0.5
            ? 4 * t * t * t
            : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }
}

// Fonction améliorée pour la barre spéciale
function drawSpecialBar(x, y, charge, max, color = '#ffaa00') {
    const width = 60;
    const height = 6;
    const percent = charge / max;

    ctx.save();

    // Fond
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(x - width / 2 - 1, y - 1, width + 2, height + 2);

    // Barre de progression
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = percent === 1 ? 15 : 5;
    ctx.fillRect(x - width / 2, y, width * percent, height);

    // Animation quand pleine
    if (percent === 1) {
        const pulse = Math.sin(Date.now() / 100) * 0.3 + 0.7;
        ctx.globalAlpha = pulse;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x - width / 2, y, width, height);
    }

    // Texte
    if (percent === 1) {
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#fff';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.strokeText('SPECIAL!', x, y - 3);
        ctx.fillText('SPECIAL!', x, y - 3);
    }

    ctx.restore();
}

// Fonction pour l'indicateur de dash
function drawDashIndicator(x, y, cooldown, maxCooldown) {
    const radius = 8;
    const percent = 1 - (cooldown / maxCooldown);

    ctx.save();

    // Cercle de fond
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.beginPath();
    ctx.arc(x - 35, y, radius, 0, Math.PI * 2);
    ctx.fill();

    // Arc de progression
    ctx.strokeStyle = percent === 1 ? '#00ffff' : '#0088aa';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = percent === 1 ? 10 : 0;
    ctx.beginPath();
    ctx.arc(x - 35, y, radius, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * percent);
    ctx.stroke();

    // Icône dash (éclair)
    if (percent === 1) {
        ctx.fillStyle = '#00ffff';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⚡', x - 35, y);
    }

    ctx.restore();
}