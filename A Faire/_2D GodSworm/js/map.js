class Territory {
  constructor(x, y, width, height, faction) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.faction = faction;
    this.selected = false;
    this.hovered = false;
    this.population = Math.floor(Math.random() * 45) + 25;
    this.resistance = getFactionProperties(faction).baseResistance || 0;
    this.faithGeneration = 0;
    this.updateFaithGeneration();
  }

  updateFaithGeneration() {
    const props = getFactionProperties(this.faction);
    if (this.faction === FACTIONS.NEUTRAL) {
      this.faithGeneration = 0;
      return;
    }
    const base = Number(props.faithGeneration) || 0;
    this.faithGeneration = this.population * base;
  }

  setFaction(newFaction) {
    this.faction = newFaction;
    this.resistance = getFactionProperties(newFaction).baseResistance || 0;
    this.updateFaithGeneration();
  }

  contains(x, y) {
    return x >= this.x && x <= this.x + this.width && y >= this.y && y <= this.y + this.height;
  }

  decreaseResistance(amount) {
    this.resistance = Math.max(0, this.resistance - amount);
  }

  growPopulation(deltaTime) {
    if (this.faction === FACTIONS.NEUTRAL) return;
    this.population += 0.35 * (deltaTime / 1000);
    this.updateFaithGeneration();
  }

  draw(ctx) {
    // Terrain lisible : couleurs de faction en surcouche, sans modifier les zones cliquables.
    const factionColor=getFactionColor(this.faction,this.selected);
    ctx.fillStyle="#3e533d";ctx.fillRect(this.x,this.y,this.width,this.height);
    ctx.fillStyle=factionColor;ctx.globalAlpha=this.faction===FACTIONS.NEUTRAL?.17:.69;ctx.fillRect(this.x,this.y,this.width,this.height);ctx.globalAlpha=1;
    const seed=(Math.floor(this.x/32)*73856093+Math.floor(this.y/32)*19349663)>>>0;
    ctx.save();ctx.beginPath();ctx.rect(this.x+2,this.y+2,Math.max(0,this.width-4),Math.max(0,this.height-4));ctx.clip();
    // Motif de prairie discret ; reste stable d'une image à l'autre.
    for(let n=0;n<100;n++){
      const hash=(seed+n*1664525+1013904223)>>>0;
      const px=this.x+8+(hash%Math.max(1,this.width-16));
      const py=this.y+8+((Math.imul(hash^0x9e3779b9,1597334677)>>>0)%Math.max(1,this.height-16));
      ctx.fillStyle=n%4===0?"rgba(237,222,161,.17)":"rgba(10,38,22,.14)";
      ctx.fillRect(px,py,3+(n%3),2);
    }
    ctx.restore();
    // Frontières : deux traits contrastés et un effet de sélection.
    // Subtle borders on neutral land, prominent only for owned/selected provinces.
    const neutral=this.faction===FACTIONS.NEUTRAL;
    ctx.strokeStyle=neutral?"rgba(150,166,137,.16)":"rgba(10,18,20,.55)";
    ctx.lineWidth=neutral?1:3;ctx.strokeRect(this.x+1.5,this.y+1.5,this.width-3,this.height-3);
    ctx.strokeStyle=this.selected?"#ffe28e":this.hovered?"#eff0c9":neutral?"rgba(178,193,155,.22)":getFactionBorderColor(this.faction);
    ctx.lineWidth=this.selected?4:this.hovered?2:1.5;ctx.strokeRect(this.x+3,this.y+3,this.width-6,this.height-6);
    if(this.hovered){ctx.fillStyle="rgba(255,255,255,.095)";ctx.fillRect(this.x+5,this.y+5,this.width-10,this.height-10)}
    // Emblème de faction discret, visible sous les unités.
    if(this.faction!==FACTIONS.NEUTRAL&&this.width>=220&&this.height>=180){ctx.save();ctx.globalAlpha=.18;ctx.fillStyle="#fff";ctx.font="bold 64px Georgia";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(getFactionIcon(this.faction),this.x+this.width/2,this.y+this.height/2);ctx.restore()}
    if(this.faction!==FACTIONS.NEUTRAL){
      const barW=Math.min(196,this.width-20),bx=this.x+10,by=this.y+10;
      ctx.fillStyle="rgba(9,14,22,.84)";ctx.fillRect(bx,by,barW,29);
      ctx.fillStyle="#fff";ctx.font="bold 13px Arial";ctx.textAlign="left";ctx.fillText(Math.floor(this.population)+" habitants",bx+9,by+19);
      ctx.fillStyle="#e9ca85";ctx.textAlign="right";ctx.fillText("Rés. "+Math.floor(this.resistance),bx+barW-8,by+19);ctx.textAlign="left";
    }
  }
}

class MapDecoration {
  constructor(x, y, type, data = {}) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.data = data;
  }

  draw(ctx) {
    const x=this.x,y=this.y,d=this.data;
    ctx.save();
    if(this.type==="forest"){
      const size=d.size||26;
      ctx.fillStyle="rgba(14,46,25,.34)";ctx.beginPath();ctx.ellipse(x,y+size*.35,size*1.05,size*.55,0,0,Math.PI*2);ctx.fill();
      for(let i=0;i<5;i++){
        const angle=i*2.4,rx=x+Math.cos(angle)*size*.36,ry=y+Math.sin(angle)*size*.3;
        ctx.fillStyle="#6a4e33";ctx.fillRect(rx-3,ry,6,size*.47);
        ctx.fillStyle=i%2?"#295f3c":"#397948";
        ctx.beginPath();ctx.moveTo(rx,ry-size*.8);ctx.lineTo(rx-size*.35,ry+size*.1);ctx.lineTo(rx+size*.35,ry+size*.1);ctx.closePath();ctx.fill();
        ctx.strokeStyle="rgba(9,28,17,.65)";ctx.lineWidth=1.5;ctx.stroke();
      }
    }else if(this.type==="lake"){
      const w=d.w||45,h=d.h||26;
      ctx.fillStyle="#2b637b";ctx.beginPath();ctx.ellipse(x,y,w+4,h+4,0,0,Math.PI*2);ctx.fill();
      ctx.fillStyle="#317f9b";ctx.beginPath();ctx.ellipse(x,y,w,h,0,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle="rgba(176,225,236,.6)";ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(x-w*.1,y-h*.1,w*.65,h*.55,0,.25,2.2);ctx.stroke();
    }else if(this.type==="road"){
      const ex=d.x2??x,ey=d.y2??y,width=d.w||18;
      ctx.lineCap="round";ctx.strokeStyle="#4f4439";ctx.lineWidth=width+6;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(ex,ey);ctx.stroke();
      ctx.strokeStyle="#a48a65";ctx.lineWidth=width;ctx.stroke();
      ctx.strokeStyle="rgba(226,200,143,.4)";ctx.lineWidth=2;ctx.setLineDash([15,18]);ctx.stroke();ctx.setLineDash([]);
    }
    ctx.restore();
  }
}

const DEFAULT_WORLD_WIDTH = 1920;
const DEFAULT_WORLD_HEIGHT = 1080;
const territories = [];
const mapDecorations = [];

function getMapDimensions() {
  const gameCanvas = document.getElementById("gameCanvas");
  const width = Number(gameCanvas && gameCanvas.width) || DEFAULT_WORLD_WIDTH;
  const height = Number(gameCanvas && gameCanvas.height) || DEFAULT_WORLD_HEIGHT;
  return { width: width, height: height };
}

// Ouverture de partie : camps isolés par de vastes régions neutres.
// Inspiré des distances de développement des RTS classiques, sans reprendre leurs cartes.
function getModeTerritoryFactions(mode) {
  const layout=Array(24).fill(FACTIONS.NEUTRAL);
  layout[0]=FACTIONS.PAGAN;
  if(mode==='team'){
    layout[18]=FACTIONS.NORTHMEN;
    layout[5]=FACTIONS.CRUSADER;
    layout[23]=FACTIONS.NOMAD;
  }else if(mode==='sandbox'){
    layout[23]=FACTIONS.CRUSADER;
    layout[5]=FACTIONS.NORTHMEN;
    layout[18]=FACTIONS.NOMAD;
  }else{
    layout[5]=FACTIONS.CRUSADER;
    layout[18]=FACTIONS.NORTHMEN;
    layout[23]=FACTIONS.NOMAD;
  }
  return layout;
}

function initializeMap(mode = "ffa") {
  const map = getMapDimensions();
  const cols = 6;
  const rows = 4;
  const tileW = Math.floor(map.width / cols);
  const tileH = Math.floor(map.height / rows);
  const factions = getModeTerritoryFactions(mode);

  territories.length = 0;
  mapDecorations.length = 0;

  let idx = 0;
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const x = col * tileW;
      const y = row * tileH;
      const w = col === cols - 1 ? map.width - x : tileW;
      const h = row === rows - 1 ? map.height - y : tileH;
      const faction = factions[idx] || FACTIONS.NEUTRAL;
      territories.push(new Territory(x, y, w, h, faction));
      idx += 1;
    }
  }

  for (let i = 0; i < 28; i += 1) {
    mapDecorations.push(new MapDecoration(Math.random() * map.width, Math.random() * map.height, "forest", { size: 18 + Math.random() * 22 }));
  }

  for (let i = 0; i < 10; i += 1) {
    mapDecorations.push(new MapDecoration(Math.random() * map.width, Math.random() * map.height, "lake", { w: 25 + Math.random() * 45, h: 12 + Math.random() * 24 }));
  }

  mapDecorations.push(new MapDecoration(0, map.height * 0.5, "road", { x2: map.width, y2: map.height * 0.5, w: 20 }));
  mapDecorations.push(new MapDecoration(map.width * 0.5, 0, "road", { x2: map.width * 0.5, y2: map.height, w: 16 }));
}

function getTerritoryAt(x, y) {
  for (let i = territories.length - 1; i >= 0; i -= 1) {
    if (territories[i].contains(x, y)) {
      return territories[i];
    }
  }
  return null;
}

function drawMapDecorations(ctx) {
  mapDecorations.forEach((deco) => deco.draw(ctx));
}

initializeMap("ffa");
