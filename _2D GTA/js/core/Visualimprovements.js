// VisualImprovements.js - Améliorations visuelles pour séparer les éléments

/**
 * SOLUTION 1: Ombres portées pour tous les objets
 * ================================================
 */

Game.Shadow = {
  /**
   * Dessine une ombre au sol pour un objet
   */
  draw(ctx, x, y, width, height, options = {}) {
    const {
      opacity = 0.3,
      offsetY = 5,
      scaleX = 0.8,
      scaleY = 0.3
    } = options;

    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.fillStyle = "#000000";
    ctx.beginPath();
    ctx.ellipse(
      x + width / 2,
      y + height + offsetY,
      (width / 2) * scaleX,
      (height / 4) * scaleY,
      0, 0, Math.PI * 2
    );
    ctx.fill();
    ctx.restore();
  },

  /**
   * Dessine une ombre rectangulaire simple
   */
  drawRect(ctx, x, y, width, height, offset = 5) {
    ctx.save();
    ctx.globalAlpha = 0.2;
    ctx.fillStyle = "#000000";
    ctx.fillRect(x + offset, y + offset, width, height);
    ctx.restore();
  }
};

/**
 * SOLUTION 2: Contours pour séparer visuellement
 * ===============================================
 */

Game.Outline = {
  /**
   * Dessine un rectangle avec contour
   */
  drawRect(ctx, x, y, width, height, fillColor, outlineColor = "#000000", outlineWidth = 3) {
    // Contour
    ctx.strokeStyle = outlineColor;
    ctx.lineWidth = outlineWidth;
    ctx.lineJoin = "round";
    ctx.strokeRect(x, y, width, height);
    
    // Remplissage
    ctx.fillStyle = fillColor;
    ctx.fillRect(x, y, width, height);
  },

  /**
   * Dessine un cercle avec contour
   */
  drawCircle(ctx, x, y, radius, fillColor, outlineColor = "#000000", outlineWidth = 2) {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    
    // Contour
    ctx.strokeStyle = outlineColor;
    ctx.lineWidth = outlineWidth;
    ctx.stroke();
    
    // Remplissage
    ctx.fillStyle = fillColor;
    ctx.fill();
  }
};

/**
 * SOLUTION 3: Highlighting pour les items interactifs
 * ====================================================
 */

Game.Highlight = {
  /**
   * Effet de pulsation pour attirer l'attention
   */
  pulse(ctx, x, y, width, height, time, color = "#ffff00") {
    const pulseScale = 1 + Math.sin(time * 0.1) * 0.1;
    const pulseAlpha = 0.3 + Math.sin(time * 0.15) * 0.2;
    
    ctx.save();
    ctx.globalAlpha = pulseAlpha;
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    
    const scaledWidth = width * pulseScale;
    const scaledHeight = height * pulseScale;
    const offsetX = (scaledWidth - width) / 2;
    const offsetY = (scaledHeight - height) / 2;
    
    ctx.strokeRect(
      x - offsetX,
      y - offsetY,
      scaledWidth,
      scaledHeight
    );
    ctx.restore();
  },

  /**
   * Aura lumineuse autour d'un objet
   */
  glow(ctx, x, y, width, height, color = "#ffff00", intensity = 10) {
    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = intensity;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, width, height);
    ctx.restore();
  }
};

/**
 * SOLUTION 4: Système de profondeur visuelle (Z-depth)
 * =====================================================
 */

Game.Depth = {
  /**
   * Calcule l'échelle basée sur la position Y (effet de perspective)
   */
  getScale(y, minY = 0, maxY = 2000) {
    const normalized = (y - minY) / (maxY - minY);
    return 0.7 + normalized * 0.3; // Scale de 0.7 à 1.0
  },

  /**
   * Calcule l'opacité basée sur la position Y
   */
  getOpacity(y, minY = 0, maxY = 2000) {
    const normalized = (y - minY) / (maxY - minY);
    return 0.6 + normalized * 0.4; // Opacité de 0.6 à 1.0
  },

  /**
   * Dessine un objet avec effet de profondeur
   */
  drawWithDepth(ctx, x, y, drawFn, worldHeight = 2000) {
    const scale = this.getScale(y, 0, worldHeight);
    const opacity = this.getOpacity(y, 0, worldHeight);

    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.translate(-x, -y);
    
    drawFn(ctx);
    
    ctx.restore();
  }
};

/**
 * SOLUTION 5: Amélioration des items au sol
 * ==========================================
 */

Game.ItemVisuals = {
  /**
   * Dessine un item avec tous les effets visuels
   */
  draw(ctx, item, time = 0) {
    const { x, y, size, color, icon, type } = item;
    
    // 1. Ombre
    Game.Shadow.draw(ctx, x, y, size, size, { opacity: 0.4 });
    
    // 2. Highlight si item important
    if (item.important) {
      Game.Highlight.pulse(ctx, x, y, size, size, time, color);
    }
    
    // 3. Contour
    ctx.save();
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, size, size);
    ctx.restore();
    
    // 4. Fond de l'item
    ctx.fillStyle = color || "#ffdd00";
    ctx.fillRect(x, y, size, size);
    
    // 5. Icône
    if (icon) {
      ctx.font = `${size * 0.7}px Arial`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#000000";
      ctx.fillText(icon, x + size/2 + 1, y + size/2 + 1); // Ombre du texte
      
      ctx.fillStyle = "#ffffff";
      ctx.fillText(icon, x + size/2, y + size/2);
    }
    
    // 6. Animation de flottement
    const floatY = Math.sin(time * 0.1 + x) * 3;
    ctx.save();
    ctx.translate(0, floatY);
    // Redessiner l'icône avec le flottement si nécessaire
    ctx.restore();
  }
};

/**
 * SOLUTION 6: Amélioration des véhicules
 * =======================================
 */

Game.VehicleVisuals = {
  /**
   * Dessine un véhicule avec ombre et contour
   */
  draw(ctx, vehicle) {
    const { x, y, width, height, color, angle } = vehicle;
    
    ctx.save();
    ctx.translate(x + width/2, y + height/2);
    ctx.rotate((angle || 0) * Math.PI / 180);
    
    // Ombre
    Game.Shadow.draw(ctx, -width/2, -height/2, width, height, {
      opacity: 0.5,
      offsetY: 8
    });
    
    // Contour noir épais
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 4;
    ctx.strokeRect(-width/2, -height/2, width, height);
    
    // Véhicule
    ctx.fillStyle = color;
    ctx.fillRect(-width/2, -height/2, width, height);
    
    // Fenêtres
    ctx.fillStyle = "rgba(100, 150, 200, 0.5)";
    ctx.fillRect(-width/2 + 5, -height/2 + 5, width - 10, height/3);
    
    ctx.restore();
  }
};

/**
 * SOLUTION 7: Amélioration des bâtiments
 * =======================================
 */

Game.BuildingVisuals = {
  /**
   * Dessine un bâtiment avec effet 3D
   */
  draw(ctx, building) {
    const { x, y, width, height, color, name } = building;
    
    // Ombre portée
    ctx.save();
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = "#000000";
    ctx.fillRect(x + 10, y + 10, width, height);
    ctx.restore();
    
    // Côté (effet 3D)
    ctx.fillStyle = this.darkenColor(color, 0.3);
    ctx.beginPath();
    ctx.moveTo(x + width, y);
    ctx.lineTo(x + width + 15, y + 15);
    ctx.lineTo(x + width + 15, y + height + 15);
    ctx.lineTo(x + width, y + height);
    ctx.closePath();
    ctx.fill();
    
    // Toit (effet 3D)
    ctx.fillStyle = this.lightenColor(color, 0.2);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 15, y - 15);
    ctx.lineTo(x + width + 15, y - 15);
    ctx.lineTo(x + width, y);
    ctx.closePath();
    ctx.fill();
    
    // Façade principale avec contour
    Game.Outline.drawRect(ctx, x, y, width, height, color, "#000000", 4);
    
    // Fenêtres
    this.drawWindows(ctx, x, y, width, height);
    
    // Nom du bâtiment
    if (name) {
      ctx.fillStyle = "#000000";
      ctx.font = "bold 14px Arial";
      ctx.textAlign = "center";
      ctx.fillText(name, x + width/2 + 1, y - 6);
      
      ctx.fillStyle = "#ffffff";
      ctx.fillText(name, x + width/2, y - 7);
    }
  },
  
  drawWindows(ctx, x, y, width, height) {
    const windowSize = 12;
    const spacing = 20;
    const cols = Math.floor(width / spacing);
    const rows = Math.floor(height / spacing);
    
    ctx.fillStyle = "rgba(200, 230, 255, 0.6)";
    
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const wx = x + col * spacing + 10;
        const wy = y + row * spacing + 10;
        ctx.fillRect(wx, wy, windowSize, windowSize);
        
        // Reflet
        ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
        ctx.fillRect(wx, wy, windowSize, windowSize/2);
        ctx.fillStyle = "rgba(200, 230, 255, 0.6)";
      }
    }
  },
  
  darkenColor(color, amount) {
    const hex = color.replace('#', '');
    const r = Math.max(0, parseInt(hex.substr(0, 2), 16) * (1 - amount));
    const g = Math.max(0, parseInt(hex.substr(2, 2), 16) * (1 - amount));
    const b = Math.max(0, parseInt(hex.substr(4, 2), 16) * (1 - amount));
    return `rgb(${r}, ${g}, ${b})`;
  },
  
  lightenColor(color, amount) {
    const hex = color.replace('#', '');
    const r = Math.min(255, parseInt(hex.substr(0, 2), 16) * (1 + amount));
    const g = Math.min(255, parseInt(hex.substr(2, 2), 16) * (1 + amount));
    const b = Math.min(255, parseInt(hex.substr(4, 2), 16) * (1 + amount));
    return `rgb(${r}, ${g}, ${b})`;
  }
};

/**
 * SOLUTION 8: Animation de ramassage d'items
 * ===========================================
 */

Game.PickupAnimation = {
  active: [],
  
  start(x, y, icon, color) {
    this.active.push({
      x, y,
      startY: y,
      icon,
      color,
      time: 0,
      duration: 30
    });
  },
  
  update() {
    for (let i = this.active.length - 1; i >= 0; i--) {
      const anim = this.active[i];
      anim.time++;
      anim.y = anim.startY - anim.time * 2; // Monte vers le haut
      
      if (anim.time >= anim.duration) {
        this.active.splice(i, 1);
      }
    }
  },
  
  draw(ctx) {
    for (const anim of this.active) {
      const alpha = 1 - (anim.time / anim.duration);
      const scale = 1 + (anim.time / anim.duration) * 0.5;
      
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = `${20 * scale}px Arial`;
      ctx.textAlign = "center";
      ctx.fillStyle = anim.color;
      ctx.fillText(anim.icon, anim.x, anim.y);
      ctx.restore();
    }
  }
};