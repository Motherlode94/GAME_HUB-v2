// js/Renderer.js
class Renderer {
    static draw(player, ctx) {
        const pos = player.pos;
        const stats = player.stats;
        const prog = player.progression;
        const weaponSystem = player.weaponSystem;
        const weapon = weaponSystem.weapon;

        ctx.save();
        ctx.translate(pos.x, pos.y);

        if (
            stats.invincible &&
            Math.floor(stats.invincibleTimer / 3) % 2 === 0
        ) {
            ctx.globalAlpha = 0.4;
        }

        if (player.dash.dashing) {
            ctx.shadowColor = '#00ffff';
            ctx.shadowBlur = 30;
            ctx.globalAlpha = 0.7;

            for (let i = 1; i <= 3; i++) {
                ctx.globalAlpha = Math.max(0, 0.3 - i * 0.1);
                ctx.fillStyle = '#00ffff';
                ctx.fillRect(-14 - i * 5, -14, 28, 28);
            }

            ctx.globalAlpha = 0.7;
        }

        if (playerImg && playerImg.complete && playerImg.naturalWidth > 0) {
            const drawWidth = 64;
            const drawHeight = 64;
            const yOffset = 50;

            ctx.drawImage(
                playerImg,
                -drawWidth / 2,
                -yOffset,
                drawWidth,
                drawHeight
            );
        } else {
            ctx.fillStyle = '#4488ff';
            ctx.fillRect(-14, -14, 28, 28);
        }

        if (weaponSystem.comboCount > 2) {
            this.drawComboAura(ctx, weaponSystem.comboCount);
        }

        if (prog.level >= 10) {
            this.drawLevelAura(ctx, prog.level);
        }

        ctx.restore();

        if (weaponSystem.attacking) {
            this.drawWeaponAttack(player, ctx);
        }

        this.drawWeaponName(ctx, weapon, pos, weaponSystem.comboCount);

        if (weaponSystem.comboCount > 0) {
            this.drawComboCounter(ctx, pos, weaponSystem.comboCount);
        }

        if (prog.specialCharge > 0) {
            drawSpecialBar(
                pos.x,
                pos.y - 40,
                prog.specialCharge,
                prog.specialMax,
                weapon.color
            );
        }

        if (player.dash.cooldown > 0) {
            drawDashIndicator(
                pos.x,
                pos.y - 55,
                player.dash.cooldown,
                player.dash.maxCooldown
            );
        }

        if (weapon.critChance) {
            this.drawCritChanceIndicator(ctx, pos, weapon.critChance);
        }
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

        // Layered attack trail, matching the active weapon style.
        // Visual only: the weapon system still owns timing and hit detection.
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        ctx.strokeStyle = weapon.color || '#cbdcff';
        ctx.shadowColor = weapon.color || '#cbdcff';
        ctx.shadowBlur = 14;
        ctx.lineCap = 'round';
        ctx.globalAlpha = 0.24;
        if (style === 'slash' || style === 'chop') {
            ctx.lineWidth = style === 'chop' ? 20 : 12;
            ctx.beginPath();ctx.arc(0,0,style === 'chop' ? 55 : 45,-.85,.65);ctx.stroke();
        } else if (style === 'thrust' || style === 'stab' || style === 'ranged') {
            ctx.lineWidth = style === 'thrust' ? 12 : 7;
            ctx.beginPath();ctx.moveTo(8,0);ctx.lineTo(style === 'thrust' ? 90 : style === 'ranged' ? 50 : 30,0);ctx.stroke();
        } else if (style === 'smash' || style === 'magic') {
            ctx.lineWidth = 15;
            ctx.beginPath();ctx.arc(0,0,style === 'smash' ? 40 + combo*2 : 30,0,Math.PI*2);ctx.stroke();
        }
        ctx.restore();

        switch (style) {
            case 'slash':
                ctx.lineWidth = 6;
                ctx.strokeStyle = weapon.color;
                ctx.beginPath();
                ctx.arc(0, 0, 45, -0.6, 0.6);
                ctx.stroke();
                break;

            case 'chop':
                ctx.lineWidth = 12;
                ctx.strokeStyle = weapon.color;
                ctx.beginPath();
                ctx.arc(0, 0, 55, -0.8, 0.3);
                ctx.stroke();

                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(55, 0, 8, 0, Math.PI * 2);
                ctx.fill();
                break;

            case 'thrust':
                ctx.lineWidth = 4;
                ctx.strokeStyle = weapon.color;
                ctx.beginPath();
                ctx.moveTo(10, 0);
                ctx.lineTo(90, 0);
                ctx.stroke();
                break;

            case 'stab':
                ctx.lineWidth = 3;
                ctx.strokeStyle = weapon.color;
                ctx.beginPath();
                ctx.moveTo(10, 0);
                ctx.lineTo(30, 0);
                ctx.stroke();
                break;

            case 'smash':
                ctx.lineWidth = 8;
                ctx.strokeStyle = weapon.color;
                ctx.beginPath();
                ctx.arc(0, 0, 40 + combo * 2, 0, Math.PI * 2);
                ctx.stroke();
                break;

            case 'magic':
                ctx.lineWidth = 4;
                ctx.strokeStyle = weapon.color;
                ctx.beginPath();
                ctx.arc(0, 0, 30, 0, Math.PI * 2);
                ctx.stroke();

                ctx.beginPath();
                ctx.arc(0, 0, 15, 0, Math.PI * 2);
                ctx.stroke();
                break;

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

    static drawWeaponShape(ctx, style, weapon, combo, progress) {
        switch (style) {
            case 'slash': {
                ctx.lineWidth = 6 + combo * 0.5;
                const angle = progress * 1.6 - 0.8;
                ctx.beginPath();
                ctx.arc(0, 0, 45 + combo * 2, -0.8, angle);
                ctx.stroke();

                const endX = Math.cos(angle) * (45 + combo * 2);
                const endY = Math.sin(angle) * (45 + combo * 2);
                ctx.fillStyle = weapon.color;
                ctx.beginPath();
                ctx.arc(endX, endY, 3, 0, Math.PI * 2);
                ctx.fill();
                break;
            }

            case 'chop': {
                ctx.lineWidth = 10 + combo * 0.5;
                const angle = progress * 1.4 - 1.2;
                ctx.beginPath();
                ctx.arc(0, 0, 55 + combo, -1.2, angle);
                ctx.stroke();

                if (progress > 0.7) {
                    ctx.strokeStyle = '#ffaa00';
                    ctx.lineWidth = 4;
                    ctx.beginPath();
                    ctx.arc(0, 0, 60 + combo, angle - 0.2, angle);
                    ctx.stroke();
                }
                break;
            }

            case 'stab': {
                ctx.lineWidth = 4 + combo * 0.3;
                const length = 15 + progress * (20 + combo * 2);
                ctx.beginPath();
                ctx.moveTo(15, 0);
                ctx.lineTo(length, 0);
                ctx.stroke();

                if (progress > 0.8) {
                    ctx.fillStyle = weapon.color;
                    ctx.beginPath();
                    ctx.arc(length, 0, 4, 0, Math.PI * 2);
                    ctx.fill();
                }
                break;
            }

            case 'thrust': {
                ctx.lineWidth = 5 + combo * 0.4;
                const length = 15 + progress * 75;
                ctx.beginPath();
                ctx.moveTo(15, 0);
                ctx.lineTo(length, 0);
                ctx.stroke();

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

            case 'smash': {
                ctx.lineWidth = 8 + combo;
                const radius = 40 + progress * 20;
                ctx.beginPath();
                ctx.arc(30, 0, radius * (1 - progress * 0.3), 0, Math.PI * 2);
                ctx.stroke();

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

            case 'magic': {
                ctx.lineWidth = 4 + combo * 0.3;
                const radius = 35 + combo + progress * 15;

                ctx.beginPath();
                ctx.arc(25, 0, radius, 0, Math.PI * 2);
                ctx.stroke();

                for (let i = 0; i < 6; i++) {
                    const angle = (Math.PI * 2 * i) / 6 + progress * Math.PI;
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

            case 'ranged': {
                ctx.lineWidth = 3;
                const drawProgress = Math.min(progress * 2, 1);

                ctx.beginPath();
                ctx.arc(-10, 0, 20, -Math.PI / 3, Math.PI / 3);
                ctx.stroke();

                ctx.beginPath();
                ctx.moveTo(-10 - 17.3, -10);
                ctx.lineTo(-10 - 17.3 * (1 - drawProgress * 0.3), 0);
                ctx.lineTo(-10 - 17.3, 10);
                ctx.stroke();

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
        const colors = ['#ffaa00', '#ffdd00', '#ff4400', '#ff00ff'];
        const colorIndex = Math.min(Math.floor(combo / 2), colors.length - 1);
        const auraSize = 25 + combo * 2;

        ctx.save();
        ctx.globalAlpha = 0.3 + intensity * 0.3;
        ctx.shadowColor = colors[colorIndex];
        ctx.shadowBlur = 30;
        ctx.strokeStyle = colors[colorIndex];
        ctx.lineWidth = 2 + combo * 0.3;

        ctx.beginPath();
        ctx.arc(0, 0, auraSize, 0, Math.PI * 2);
        ctx.stroke();

        ctx.globalAlpha = 0.2;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(
            0,
            0,
            auraSize + 5 + Math.sin(Date.now() / 100) * 3,
            0,
            Math.PI * 2
        );
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
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 4;
        ctx.strokeText(weapon.name, pos.x, pos.y - 70);

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

function drawSpecialBar(x, y, charge, max, color = '#ffaa00') {
    const width = 60;
    const height = 6;
    const percent = charge / max;

    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(x - width / 2 - 1, y - 1, width + 2, height + 2);

    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = percent === 1 ? 15 : 5;
    ctx.fillRect(x - width / 2, y, width * percent, height);

    if (percent === 1) {
        const pulse = Math.sin(Date.now() / 100) * 0.3 + 0.7;
        ctx.globalAlpha = pulse;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x - width / 2, y, width, height);
    }

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

function drawDashIndicator(x, y, cooldown, maxCooldown) {
    const radius = 8;
    const percent = 1 - cooldown / maxCooldown;

    ctx.save();

    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.beginPath();
    ctx.arc(x - 35, y, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = percent === 1 ? '#00ffff' : '#0088aa';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = percent === 1 ? 10 : 0;
    ctx.beginPath();
    ctx.arc(
        x - 35,
        y,
        radius,
        -Math.PI / 2,
        -Math.PI / 2 + Math.PI * 2 * percent
    );
    ctx.stroke();

    if (percent === 1) {
        ctx.fillStyle = '#00ffff';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⚡', x - 35, y);
    }

    ctx.restore();
}