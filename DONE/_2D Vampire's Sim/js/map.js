/* ═══════════════════════════════════════════════════════════════
   VAMPIRE SIM — map.js
   Carte de la ville gothique de Noctalis (52×36 tuiles)
   Chargé avant game.js — expose des globals utilisés par game.js
   ═══════════════════════════════════════════════════════════════ */

// ── Tile type constants ───────────────────────────────────────
const TILE = Object.freeze({
  ROAD:      0,
  WALL:      1,
  ALLEY:     2,
  GYM:       3,
  PARK:      4,
  SHOP:      5,
  WATER:     6,
  CEMETERY:  7,
  CHURCH:    8,  // danger zone (chasse interdite, suspicion -5/sec)
  SEWER:     9,  // vitesse réduite, suspicion réduite rapidement
});

// ── World dimensions ─────────────────────────────────────────
const MAP_COLS = 52;
const MAP_ROWS = 36;
const MAP_T    = 52; // pixel size per tile — MUST match game.js T

// ── Visual config per tile ────────────────────────────────────
const MAP_TILE_CFG = {
  [TILE.ROAD]:     { base: "#0a0e16", edge: "#121a26", label: null },
  [TILE.WALL]:     { base: "#0e0808", edge: "#1e0a0a", label: null },
  [TILE.ALLEY]:    { base: "#060d18", edge: "#0a1828", label: "RUELLE"    },
  [TILE.GYM]:      { base: "#060e06", edge: "#0d1e0d", label: "GYMNASE"   },
  [TILE.PARK]:     { base: "#060e06", edge: "#0e200e", label: null },
  [TILE.SHOP]:     { base: "#110a04", edge: "#261808", label: "APOTHICAIRE"},
  [TILE.WATER]:    { base: "#040c18", edge: "#081428", label: null },
  [TILE.CEMETERY]: { base: "#080a0a", edge: "#101618", label: "CIMETIÈRE"  },
  [TILE.CHURCH]:   { base: "#0a0808", edge: "#1a100a", label: "CATHÉDRALE" },
  [TILE.SEWER]:    { base: "#050a06", edge: "#0a140a", label: "ÉGOUTS"     },
};

// ── Minimap colors ─────────────────────────────────────────────
const MAP_MINIMAP = {
  [TILE.ROAD]:     "#101824",
  [TILE.WALL]:     "#1e0a0a",
  [TILE.ALLEY]:    "#0d1e2e",
  [TILE.GYM]:      "#0a1e0a",
  [TILE.PARK]:     "#0d2210",
  [TILE.SHOP]:     "#26180a",
  [TILE.WATER]:    "#0a1828",
  [TILE.CEMETERY]: "#141614",
  [TILE.CHURCH]:   "#1a0e0e",
  [TILE.SEWER]:    "#0a1408",
};

// ═══════════════════════════════════════════════════════════════
// MAP GRID BUILDER
// ═══════════════════════════════════════════════════════════════
function _buildGrid() {
  // Default: all ROAD
  const G = Array.from({ length: MAP_ROWS }, () => new Uint8Array(MAP_COLS));

  // ── Helper functions ──────────────────────────────────────
  const set = (x, y, t) => {
    if (x >= 0 && x < MAP_COLS && y >= 0 && y < MAP_ROWS) G[y][x] = t;
  };
  const fill = (x, y, w, h, t) => {
    for (let row = y; row < y + h; row++)
      for (let col = x; col < x + w; col++)
        set(col, row, t);
  };
  // Hollow rectangle: outer=border tile, inner=fill tile
  const rect = (x, y, w, h, outer, inner = TILE.ROAD) => {
    fill(x, y, w, h, outer);
    if (w > 2 && h > 2) fill(x + 1, y + 1, w - 2, h - 2, inner);
  };
  // Solid building with optional door gap
  const building = (x, y, w, h, doorSide = null, doorOffset = null) => {
    fill(x, y, w, h, TILE.WALL);
    if (doorSide === "top"    && doorOffset !== null) { set(x + doorOffset, y,       TILE.ROAD); set(x + doorOffset + 1, y,       TILE.ROAD); }
    if (doorSide === "bottom" && doorOffset !== null) { set(x + doorOffset, y + h - 1, TILE.ROAD); set(x + doorOffset + 1, y + h - 1, TILE.ROAD); }
    if (doorSide === "left"   && doorOffset !== null) { set(x,       y + doorOffset, TILE.ROAD); set(x,       y + doorOffset + 1, TILE.ROAD); }
    if (doorSide === "right"  && doorOffset !== null) { set(x + w - 1, y + doorOffset, TILE.ROAD); set(x + w - 1, y + doorOffset + 1, TILE.ROAD); }
  };

  // ── BORDER WALLS ─────────────────────────────────────────
  fill(0, 0, MAP_COLS, 1, TILE.WALL);
  fill(0, MAP_ROWS - 1, MAP_COLS, 1, TILE.WALL);
  for (let r = 0; r < MAP_ROWS; r++) { G[r][0] = TILE.WALL; G[r][MAP_COLS - 1] = TILE.WALL; }

  // Horizontal streets (always ROAD): rows 9–10, 19–20, 29–30
  // Vertical streets  (always ROAD): cols 12–13, 26–27, 40–41
  // These are ROAD by default — blocks will overwrite interior then we re-clear streets

  // ═══════════════════════════════════════════════════════
  // DISTRICT 1 — CATHÉDRALE (rows 1–8, cols 1–11)
  // ═══════════════════════════════════════════════════════
  // Outer precinct wall
  fill(1, 1, 11, 8, TILE.WALL);
  // Inner courtyard (road)
  fill(2, 2, 9, 6, TILE.ROAD);
  // Cathedral building (church tiles, 5w × 5h)
  fill(3, 2, 7, 5, TILE.CHURCH);
  // Pillar columns
  fill(3, 2, 1, 5, TILE.WALL);
  fill(9, 2, 1, 5, TILE.WALL);
  fill(3, 2, 7, 1, TILE.WALL);
  // Rose window zone — leave as CHURCH
  // Main entrance arch (ground level door)
  set(6, 6, TILE.ROAD); set(7, 6, TILE.ROAD);
  // Side doors
  set(2, 4, TILE.ROAD); set(11, 4, TILE.ROAD);
  set(2, 5, TILE.ROAD); set(11, 5, TILE.ROAD);
  // Small chapel extension (top-right of block)
  fill(9, 1, 3, 2, TILE.WALL);

  // ═══════════════════════════════════════════════════════
  // DISTRICT 2 — CIMETIÈRE (rows 1–8, cols 14–25)
  // ═══════════════════════════════════════════════════════
  // Iron fence perimeter
  fill(14, 1, 12, 8, TILE.WALL);
  // Graves field
  fill(15, 2, 10, 6, TILE.CEMETERY);
  // Wrought-iron gate gaps
  set(14, 4, TILE.ROAD); set(14, 5, TILE.ROAD);
  set(25, 4, TILE.ROAD); set(25, 5, TILE.ROAD);
  set(19, 1, TILE.ROAD); set(20, 1, TILE.ROAD);
  // Mausoleum in centre
  fill(18, 3, 4, 3, TILE.WALL);
  set(19, 4, TILE.CEMETERY); set(20, 4, TILE.CEMETERY); // mausoleum interior

  // ═══════════════════════════════════════════════════════
  // DISTRICT 3 — QUARTIER RÉSIDENTIEL (rows 1–8, cols 28–39)
  // ═══════════════════════════════════════════════════════
  // Central dark alley running N-S
  fill(33, 1, 1, 8, TILE.ALLEY);
  // Left cluster of buildings
  building(28, 1, 5, 4, "bottom", 1);
  building(28, 5, 5, 4, "top", 1);
  // Right cluster
  building(34, 1, 6, 3, "bottom", 2);
  building(34, 4, 6, 4, "top", 2);
  // Alley pockets
  fill(28, 4, 5, 1, TILE.ALLEY);

  // ═══════════════════════════════════════════════════════
  // DISTRICT 4 — MARCHÉ NOIR (rows 1–8, cols 42–50)
  // ═══════════════════════════════════════════════════════
  // Market hall perimeter
  fill(42, 1, 9, 8, TILE.WALL);
  // Open interior
  fill(43, 2, 7, 6, TILE.ROAD);
  // 4 shop stalls
  fill(43, 2, 3, 3, TILE.SHOP);
  fill(47, 2, 3, 3, TILE.SHOP);
  fill(43, 5, 3, 3, TILE.SHOP);
  fill(47, 5, 3, 3, TILE.SHOP);
  // Central path
  fill(46, 2, 1, 6, TILE.ROAD);
  fill(43, 4, 7, 1, TILE.ROAD);
  // Entrances
  set(42, 4, TILE.ROAD); set(42, 5, TILE.ROAD);
  set(50, 4, TILE.ROAD); set(50, 5, TILE.ROAD);

  // ═══════════════════════════════════════════════════════
  // DISTRICT 5 — JARDIN PUBLIC (rows 11–18, cols 1–11)
  // ═══════════════════════════════════════════════════════
  fill(1, 11, 11, 8, TILE.PARK);
  // Paths crossing the park
  fill(6, 11, 1, 8, TILE.ROAD);   // vertical path
  fill(1, 14, 11, 1, TILE.ROAD);  // horizontal path
  // Ornamental pond (water) in SW quadrant
  fill(2, 15, 3, 3, TILE.WATER);
  // Tree groups (leave as PARK, drawn as deco)
  // Entry from roads
  set(1,  14, TILE.ROAD); set(1,  15, TILE.ROAD);
  set(11, 14, TILE.ROAD); set(11, 15, TILE.ROAD);

  // ═══════════════════════════════════════════════════════
  // DISTRICT 6 — RUELLES SOMBRES (rows 11–18, cols 14–25)
  // ═══════════════════════════════════════════════════════
  fill(14, 11, 12, 8, TILE.ALLEY);
  // Ruined building shells (walls with alley floors peeking)
  building(14, 11, 3, 3);
  set(15, 12, TILE.ALLEY);
  building(23, 11, 3, 3);
  set(24, 12, TILE.ALLEY);
  building(14, 16, 3, 3);
  set(15, 17, TILE.ALLEY);
  building(23, 16, 3, 3);
  set(24, 17, TILE.ALLEY);
  // Alley crossroads
  fill(17, 11, 1, 8, TILE.ALLEY);
  fill(21, 11, 1, 8, TILE.ALLEY);
  fill(14, 14, 12, 1, TILE.ALLEY);

  // ═══════════════════════════════════════════════════════
  // DISTRICT 7 — ARÈNE D'ENTRAÎNEMENT (rows 11–18, cols 28–39)
  // ═══════════════════════════════════════════════════════
  // Outer walls
  fill(28, 11, 12, 8, TILE.WALL);
  // Training floor
  fill(29, 12, 10, 6, TILE.GYM);
  // Practice pit in centre
  fill(31, 13, 6, 4, TILE.ROAD);
  // Equipment racks (wall corners)
  fill(29, 12, 2, 2, TILE.WALL);
  fill(37, 12, 2, 2, TILE.WALL);
  fill(29, 16, 2, 2, TILE.WALL);
  fill(37, 16, 2, 2, TILE.WALL);
  // Entrances
  set(33, 11, TILE.ROAD); set(34, 11, TILE.ROAD);
  set(33, 18, TILE.ROAD); set(34, 18, TILE.ROAD);

  // ═══════════════════════════════════════════════════════
  // DISTRICT 8 — QUAIS (rows 11–18, cols 42–50)
  // ═══════════════════════════════════════════════════════
  // Warehouse block (left)
  fill(42, 11, 4, 8, TILE.WALL);
  set(42, 14, TILE.ROAD); set(42, 15, TILE.ROAD); // gate
  fill(43, 14, 1, 3, TILE.ROAD); // dock access road
  // Water
  fill(46, 11, 5, 8, TILE.WATER);
  // Pier planks (road over water entrance)
  fill(44, 14, 2, 3, TILE.ROAD);
  // Moored boat hull (wall tiles)
  fill(47, 12, 3, 3, TILE.WALL);
  set(48, 13, TILE.ROAD); // boat deck

  // ═══════════════════════════════════════════════════════
  // DISTRICT 9 — TAUDIS (rows 21–28, cols 1–11)
  // ═══════════════════════════════════════════════════════
  // Cross alley spine
  fill(6, 21, 1, 8, TILE.ALLEY);
  fill(1, 24, 11, 1, TILE.ALLEY);
  // Shanty buildings
  building(1, 21, 5, 3, "bottom", 1);
  building(7, 21, 5, 3, "bottom", 1);
  building(1, 25, 4, 4, "top", 1);
  building(6, 25, 6, 4, "top", 2);
  // Extra alley pockets
  fill(1, 23, 5, 1, TILE.ALLEY);
  fill(7, 25, 1, 4, TILE.ALLEY);

  // ═══════════════════════════════════════════════════════
  // DISTRICT 10 — PLACE CENTRALE (rows 21–28, cols 14–25)
  // ═══════════════════════════════════════════════════════
  // All open road with park corners
  fill(14, 21, 12, 8, TILE.ROAD);
  // Corner gardens
  fill(14, 21, 4, 4, TILE.PARK);
  fill(22, 21, 4, 4, TILE.PARK);
  fill(14, 25, 4, 4, TILE.PARK);
  fill(22, 25, 4, 4, TILE.PARK);
  // Central fountain (water)
  fill(18, 23, 4, 3, TILE.WATER);
  // Footpaths crossing to fountain
  fill(14, 24, 12, 1, TILE.ROAD);
  fill(19, 21, 2, 8, TILE.ROAD);

  // ═══════════════════════════════════════════════════════
  // DISTRICT 11 — RUELLE DES APOTHICAIRES (rows 21–28, cols 28–39)
  // ═══════════════════════════════════════════════════════
  // Main alley spine
  fill(33, 21, 1, 8, TILE.ALLEY);
  fill(28, 24, 12, 1, TILE.ROAD);
  // Apothecary shops (walled with shop floors)
  building(28, 21, 5, 3, "bottom", 1);
  fill(29, 22, 3, 1, TILE.SHOP);
  building(34, 21, 6, 3, "bottom", 2);
  fill(35, 22, 4, 1, TILE.SHOP);
  building(28, 25, 5, 4, "top", 1);
  fill(29, 25, 3, 2, TILE.SHOP);
  building(34, 25, 6, 4, "top", 2);
  fill(35, 25, 4, 2, TILE.SHOP);

  // ═══════════════════════════════════════════════════════
  // DISTRICT 12 — USINE (rows 21–28, cols 42–50)
  // ═══════════════════════════════════════════════════════
  fill(42, 21, 9, 8, TILE.WALL);
  // Factory floor
  fill(43, 22, 7, 6, TILE.ROAD);
  // Sewer grates (access to sewers)
  fill(44, 24, 4, 2, TILE.SEWER);
  // Machinery blocks (walls)
  fill(43, 22, 2, 3, TILE.WALL);
  fill(48, 22, 2, 3, TILE.WALL);
  // Chimney stack
  fill(43, 21, 1, 2, TILE.WALL);
  fill(48, 21, 1, 2, TILE.WALL);
  // Entry/exit
  set(45, 21, TILE.ROAD); set(46, 21, TILE.ROAD);
  set(45, 28, TILE.ROAD); set(46, 28, TILE.ROAD);

  // ═══════════════════════════════════════════════════════
  // DISTRICT 13 — RÉSEAU D'ÉGOUTS (rows 31–34, cols 1–11)
  // ═══════════════════════════════════════════════════════
  fill(1, 31, 11, 4, TILE.SEWER);
  // Tunnel walls on top and bottom
  fill(1, 31, 11, 1, TILE.WALL);
  fill(1, 34, 11, 1, TILE.WALL);
  // Pillars
  fill(3, 31, 1, 4, TILE.WALL);
  fill(7, 31, 1, 4, TILE.WALL);
  // Hatch entrance from road above
  set(5, 30, TILE.SEWER); set(6, 30, TILE.SEWER);
  // Air vent (sewer access from slum)
  set(6, 28, TILE.SEWER);

  // ═══════════════════════════════════════════════════════
  // DISTRICT 14 — CASERNE DES CHASSEURS (rows 31–34, cols 14–25)
  // ═══════════════════════════════════════════════════════
  fill(14, 31, 12, 4, TILE.WALL);
  // Interior parade ground
  fill(15, 31, 10, 3, TILE.ROAD);
  // Armoury / training room
  fill(16, 31, 6, 2, TILE.GYM);
  // Barracks cells
  fill(15, 31, 1, 3, TILE.WALL);
  fill(24, 31, 1, 3, TILE.WALL);
  // Gate
  set(19, 30, TILE.ROAD); set(20, 30, TILE.ROAD);
  set(19, 34, TILE.ROAD); set(20, 34, TILE.ROAD);

  // ═══════════════════════════════════════════════════════
  // DISTRICT 15 — VIEUX QUARTIER (rows 31–34, cols 28–39)
  // ═══════════════════════════════════════════════════════
  // Dense alley maze
  fill(28, 31, 12, 4, TILE.ALLEY);
  // Old crumbling buildings
  building(28, 31, 4, 2);
  fill(29, 31, 2, 1, TILE.ALLEY);
  building(36, 31, 4, 2);
  fill(37, 31, 2, 1, TILE.ALLEY);
  building(28, 33, 5, 2);
  fill(29, 33, 3, 1, TILE.ALLEY);
  building(34, 33, 6, 2);
  fill(35, 33, 4, 1, TILE.ALLEY);
  // Alley spine
  fill(33, 31, 1, 4, TILE.ALLEY);
  fill(28, 32, 12, 1, TILE.ALLEY);

  // ═══════════════════════════════════════════════════════
  // DISTRICT 16 — PORT (rows 31–34, cols 42–50)
  // ═══════════════════════════════════════════════════════
  // Harbour master's warehouse
  fill(42, 31, 4, 4, TILE.WALL);
  set(42, 32, TILE.ROAD); set(42, 33, TILE.ROAD);
  // Open water
  fill(46, 31, 5, 4, TILE.WATER);
  // Stone dock (road)
  fill(44, 31, 2, 4, TILE.ROAD);
  // Moored galleon (wall)
  fill(47, 31, 4, 3, TILE.WALL);
  set(48, 32, TILE.ROAD); set(49, 32, TILE.ROAD); // deck

  // ═══════════════════════════════════════════════════════
  // RE-CLEAR MAIN STREETS (overwrite any blocks that bled into them)
  // Horizontal: rows 9–10, 19–20, 29–30
  // Vertical:   cols 12–13, 26–27, 40–41
  // ═══════════════════════════════════════════════════════
  for (let c = 1; c < MAP_COLS - 1; c++) {
    G[9][c]  = TILE.ROAD;
    G[10][c] = TILE.ROAD;
    G[19][c] = TILE.ROAD;
    G[20][c] = TILE.ROAD;
    G[29][c] = TILE.ROAD;
    G[30][c] = TILE.ROAD;
  }
  for (let r = 1; r < MAP_ROWS - 1; r++) {
    G[r][12] = TILE.ROAD;
    G[r][13] = TILE.ROAD;
    G[r][26] = TILE.ROAD;
    G[r][27] = TILE.ROAD;
    G[r][40] = TILE.ROAD;
    G[r][41] = TILE.ROAD;
  }

  // Side-streets (1 tile wide connectors inside blocks for navigation)
  // Cathedral side exits
  fill(1,  4, 2, 2, TILE.ROAD);
  // Residential alley exits
  fill(33, 1, 1, 1, TILE.ALLEY);
  // Park cross exit
  fill(1, 14, 1, 2, TILE.ROAD);
  // Sewer connection to industrial
  set(44, 28, TILE.SEWER); set(45, 28, TILE.SEWER);
  set(44, 29, TILE.SEWER); set(45, 29, TILE.SEWER);

  return G;
}

// ═══════════════════════════════════════════════════════════════
// EXPORTED MAP GRID
// ═══════════════════════════════════════════════════════════════
const MAP = _buildGrid();

// ═══════════════════════════════════════════════════════════════
// POINTS OF INTEREST — shown as labels + icons on the map
// ═══════════════════════════════════════════════════════════════
const MAP_POIS = [
  // { tx, ty, icon, name, color, interaction }
  { tx: 6,  ty: 5,  icon: "⛪", name: "Cathédrale de Sang",   color: "#c9a227", zone: TILE.CHURCH   },
  { tx: 19, ty: 4,  icon: "🪦", name: "Cimetière des Nobles", color: "#7a9a8a", zone: TILE.CEMETERY },
  { tx: 33, ty: 3,  icon: "🏚", name: "Vieilles Demeures",    color: "#8a7a6a", zone: TILE.ALLEY    },
  { tx: 46, ty: 4,  icon: "🏪", name: "Marché Noir",          color: "#c9a227", zone: TILE.SHOP     },
  { tx: 5,  ty: 14, icon: "🌿", name: "Jardin du Silence",    color: "#3a8a4a", zone: TILE.PARK     },
  { tx: 19, ty: 14, icon: "🌑", name: "Ruelles Sombres",      color: "#4a6a8a", zone: TILE.ALLEY    },
  { tx: 33, ty: 14, icon: "⚡", name: "Arène de Drakmoor",    color: "#9b59b6", zone: TILE.GYM      },
  { tx: 44, ty: 14, icon: "⚓", name: "Quais Maudits",        color: "#3a6a8a", zone: TILE.WATER    },
  { tx: 5,  ty: 24, icon: "🏘", name: "Taudis des Damnés",    color: "#8a6a4a", zone: TILE.ALLEY    },
  { tx: 19, ty: 24, icon: "🏛", name: "Place Noctalis",       color: "#c9a227", zone: TILE.ROAD     },
  { tx: 33, ty: 24, icon: "💊", name: "Ruelle des Remèdes",   color: "#27ae60", zone: TILE.SHOP     },
  { tx: 46, ty: 24, icon: "🏭", name: "Usine Abyssale",       color: "#6a4a2a", zone: TILE.SEWER    },
  { tx: 5,  ty: 32, icon: "🚰", name: "Égouts de Noctalis",   color: "#3a6a3a", zone: TILE.SEWER    },
  { tx: 19, ty: 32, icon: "⚔", name: "Caserne des Chasseurs", color: "#c0392b", zone: TILE.GYM      },
  { tx: 33, ty: 32, icon: "🌆", name: "Vieux Quartier",       color: "#8a7a6a", zone: TILE.ALLEY    },
  { tx: 46, ty: 32, icon: "🚢", name: "Port des Ombres",      color: "#3a6a8a", zone: TILE.WATER    },
];

// ═══════════════════════════════════════════════════════════════
// LAMPPOSTS — world positions (tile coords) of gas lamps
// ═══════════════════════════════════════════════════════════════
const MAP_LAMPPOSTS = (() => {
  const pts = [];
  // Along main horizontal streets, every 3 tiles
  for (const row of [9, 19, 29]) {
    for (let c = 2; c < MAP_COLS - 2; c += 3) {
      if (MAP[row][c] === TILE.ROAD) pts.push({ tx: c, ty: row, warm: true });
    }
  }
  // Along main vertical streets, every 3 tiles
  for (const col of [12, 26, 40]) {
    for (let r = 2; r < MAP_ROWS - 2; r += 3) {
      if (MAP[r][col] === TILE.ROAD) pts.push({ tx: col, ty: r, warm: true });
    }
  }
  // Intersections get extra bright lamps
  for (const col of [12, 26, 40]) {
    for (const row of [9, 19, 29]) {
      pts.push({ tx: col, ty: row, warm: true, bright: true });
    }
  }
  // Market and cathedral entrances
  pts.push({ tx: 42, ty: 4, warm: false });
  pts.push({ tx: 14, ty: 4, warm: false });
  pts.push({ tx: 27, ty: 9, warm: true  });
  return pts;
})();

// ═══════════════════════════════════════════════════════════════
// DECORATION OBJECTS — benches, trees, fountain details, signs
// ═══════════════════════════════════════════════════════════════
const MAP_DECOS = [
  // {type, tx, ty}  — drawn by renderer
  // Trees in park
  { type: "tree",   tx: 2,  ty: 12 }, { type: "tree", tx: 4,  ty: 12 },
  { type: "tree",   tx: 8,  ty: 12 }, { type: "tree", tx: 10, ty: 12 },
  { type: "tree",   tx: 2,  ty: 16 }, { type: "tree", tx: 10, ty: 16 },
  { type: "tree",   tx: 2,  ty: 17 }, { type: "tree", tx: 4,  ty: 17 },
  // Town square trees
  { type: "tree",   tx: 15, ty: 22 }, { type: "tree", tx: 24, ty: 22 },
  { type: "tree",   tx: 15, ty: 27 }, { type: "tree", tx: 24, ty: 27 },
  // Benches along park path
  { type: "bench",  tx: 3,  ty: 14 }, { type: "bench", tx: 9, ty: 14 },
  // Town square benches
  { type: "bench",  tx: 17, ty: 24 }, { type: "bench", tx: 22, ty: 24 },
  { type: "bench",  tx: 17, ty: 21 }, { type: "bench", tx: 22, ty: 26 },
  // Gravestones extras
  { type: "grave",  tx: 16, ty: 3  }, { type: "grave", tx: 18, ty: 3  },
  { type: "grave",  tx: 20, ty: 3  }, { type: "grave", tx: 22, ty: 3  },
  { type: "grave",  tx: 16, ty: 5  }, { type: "grave", tx: 18, ty: 6  },
  { type: "grave",  tx: 21, ty: 6  }, { type: "grave", tx: 23, ty: 5  },
  // Fountain centre
  { type: "fountain", tx: 19, ty: 24 },
  // Barrels in alley district
  { type: "barrel", tx: 15, ty: 12 }, { type: "barrel", tx: 22, ty: 15 },
  { type: "barrel", tx: 15, ty: 17 },
  // Old quarter rubble
  { type: "rubble", tx: 30, ty: 32 }, { type: "rubble", tx: 35, ty: 33 },
  // Dock crates
  { type: "crate",  tx: 43, ty: 13 }, { type: "crate",  tx: 44, ty: 15 },
  { type: "crate",  tx: 43, ty: 32 }, { type: "crate",  tx: 44, ty: 33 },
];

// ═══════════════════════════════════════════════════════════════
// NPC SPAWN ZONES — type + list of valid tile coords
// ═══════════════════════════════════════════════════════════════
const MAP_SPAWNS = (() => {
  const victimZones = [];
  const hunterZones = [];
  const patrolWaypoints = [];

  // Victims spawn on ROAD / ALLEY / PARK tiles outside player start zone
  for (let r = 1; r < MAP_ROWS - 1; r++) {
    for (let c = 1; c < MAP_COLS - 1; c++) {
      const t = MAP[r][c];
      if (t === TILE.ROAD || t === TILE.ALLEY || t === TILE.PARK) {
        victimZones.push({ tx: c, ty: r });
      }
    }
  }

  // Hunters patrol main streets
  for (let c = 1; c < MAP_COLS - 1; c++) {
    for (const row of [9, 10, 19, 20, 29, 30]) {
      if (MAP[row][c] === TILE.ROAD) hunterZones.push({ tx: c, ty: row });
    }
  }

  // Patrol waypoints for structured hunter movement
  for (const col of [12, 26, 40]) {
    for (const row of [9, 19, 29]) {
      patrolWaypoints.push({ x: (col + 0.5) * MAP_T, y: (row + 0.5) * MAP_T });
    }
  }
  // Extra waypoints at district corners
  const corners = [
    [6,9],[19,9],[33,9],[46,9],
    [6,19],[19,19],[33,19],[46,19],
    [6,29],[19,29],[33,29],[46,29],
  ];
  corners.forEach(([c,r]) => {
    patrolWaypoints.push({ x: (c+0.5)*MAP_T, y: (r+0.5)*MAP_T });
  });

  const player = { tx: 14, ty: 9 }; // spawn on main road, near map centre

  return { victimZones, hunterZones, patrolWaypoints, player };
})();

// ═══════════════════════════════════════════════════════════════
// TILE QUERY HELPERS (used by game.js)
// ═══════════════════════════════════════════════════════════════
function mapTileAt(wx, wy) {
  const tx = Math.floor(wx / MAP_T);
  const ty = Math.floor(wy / MAP_T);
  if (tx < 0 || ty < 0 || tx >= MAP_COLS || ty >= MAP_ROWS) return TILE.WALL;
  return MAP[ty][tx];
}

function mapWalkable(wx, wy) {
  const t = mapTileAt(wx, wy);
  return t !== TILE.WALL;
}

function mapSpeedMod(wx, wy) {
  const t = mapTileAt(wx, wy);
  if (t === TILE.SEWER) return 0.65;
  if (t === TILE.PARK)  return 0.9;
  if (t === TILE.WATER) return 0;   // impassable (no, handled by walkable)
  return 1.0;
}

// ═══════════════════════════════════════════════════════════════
// FOG BUILDER — returns a pre-rendered off-screen canvas
// ═══════════════════════════════════════════════════════════════
function buildFogCanvas() {
  const fc = document.createElement("canvas");
  fc.width  = MAP_COLS * MAP_T;
  fc.height = MAP_ROWS * MAP_T;
  const fctx = fc.getContext("2d");

  // Base dark tint (atmospheric night)
  fctx.fillStyle = "rgba(0,0,10,0.18)";
  fctx.fillRect(0, 0, fc.width, fc.height);

  // Gas-lamp glows from lamppost data
  for (const lp of MAP_LAMPPOSTS) {
    const gx = (lp.tx + 0.5) * MAP_T;
    const gy = (lp.ty + 0.5) * MAP_T;
    const radius = lp.bright ? MAP_T * 3.5 : MAP_T * 2.2;
    const g = fctx.createRadialGradient(gx, gy, 0, gx, gy, radius);
    if (lp.warm) {
      g.addColorStop(0,   "rgba(255,190,70,0.11)");
      g.addColorStop(0.4, "rgba(255,150,30,0.05)");
      g.addColorStop(1,   "rgba(0,0,0,0)");
    } else {
      g.addColorStop(0,   "rgba(180,220,255,0.09)");
      g.addColorStop(0.5, "rgba(100,140,200,0.04)");
      g.addColorStop(1,   "rgba(0,0,0,0)");
    }
    fctx.fillStyle = g;
    fctx.fillRect(gx - radius, gy - radius, radius * 2, radius * 2);
  }

  // Moody water reflections on WATER tiles
  for (let r = 0; r < MAP_ROWS; r++) {
    for (let c = 0; c < MAP_COLS; c++) {
      if (MAP[r][c] === TILE.WATER) {
        const gx = (c + 0.5) * MAP_T, gy = (r + 0.5) * MAP_T;
        const g2 = fctx.createRadialGradient(gx, gy, 0, gx, gy, MAP_T);
        g2.addColorStop(0, "rgba(30,80,180,0.08)");
        g2.addColorStop(1, "rgba(0,0,0,0)");
        fctx.fillStyle = g2;
        fctx.fillRect(gx - MAP_T, gy - MAP_T, MAP_T * 2, MAP_T * 2);
      }
      if (MAP[r][c] === TILE.SEWER) {
        const gx = (c + 0.5) * MAP_T, gy = (r + 0.5) * MAP_T;
        const g3 = fctx.createRadialGradient(gx, gy, 0, gx, gy, MAP_T * 0.8);
        g3.addColorStop(0, "rgba(20,80,20,0.06)");
        g3.addColorStop(1, "rgba(0,0,0,0)");
        fctx.fillStyle = g3;
        fctx.fillRect(gx - MAP_T, gy - MAP_T, MAP_T * 2, MAP_T * 2);
      }
    }
  }

  return fc;
}