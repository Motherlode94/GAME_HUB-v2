// CITY BUILDER — public transport simulation; independent of existing vehicle ambience.
const TransitSystem = (() => {
  let fleet = 2, fare = 3, lastCycle = -1;
  let metrics = {routes:0,stops:0,connected:0,demand:0,capacity:0,passengers:0,unserved:0,congestion:0,revenue:0,operatingCost:0,net:0};
  let routes = [];
  let panel;
  const key = (x,y) => y*GRID+x;
  const near = [[1,0],[-1,0],[0,1],[0,-1]];
  const routeLimit = 8;
  function topology() {
    const roads = new Set(), stops = [], buildings = [];
    for(let y=0;y<GRID;y++) for(let x=0;x<GRID;x++) {
      const t=grid[y][x].type;
      if(t==='road') roads.add(key(x,y));
      else if(t==='bus_stop') stops.push({x,y});
      else if(t && t!=='road') buildings.push({x,y,t,pop:grid[y][x].pop||0});
    }
    const adjacent = p => near.map(([dx,dy])=>({x:p.x+dx,y:p.y+dy}))
      .filter(q=>q.x>=0&&q.y>=0&&q.x<GRID&&q.y<GRID&&roads.has(key(q.x,q.y)));
    return {roads,stops,buildings,adjacent};
  }
  function shortestRoadPath(from,to,roadSet) {
    const first=key(from.x,from.y), target=key(to.x,to.y);
    const queue=[first], prev=new Map([[first,null]]);
    for(let i=0;i<queue.length;i++){
      const at=queue[i]; if(at===target)break;
      const x=at%GRID,y=Math.floor(at/GRID);
      for(const [dx,dy] of near){
        const nx=x+dx,ny=y+dy,k=key(nx,ny);
        if(nx>=0&&nx<GRID&&ny>=0&&ny<GRID&&roadSet.has(k)&&!prev.has(k)){
          prev.set(k,at);queue.push(k);
        }
      }
    }
    if(!prev.has(target))return null;
    const result=[];let k=target;
    while(k!==null){result.push({x:k%GRID,y:Math.floor(k/GRID)});k=prev.get(k);}
    return result.reverse();
  }
  function compute() {
    const t=topology();
    routes=[];
    for(let i=0;i<t.stops.length;i++){
      if(routes.length>=routeLimit)break;
      for(let j=i+1;j<t.stops.length;j++){
        const aa=t.adjacent(t.stops[i]),bb=t.adjacent(t.stops[j]);
        let best=null;
        for(const a of aa)for(const b of bb){
          const p=shortestRoadPath(a,b,t.roads);
          if(p && (!best||p.length<best.length)) best=p;
        }
        if(best){
          routes.push({a:t.stops[i],b:t.stops[j],path:best});
          break;
        }
      }
    }
    // Stops on a main-road component are the only operational ones.
    const active=new Set();
    routes.forEach(r=>{active.add(key(r.a.x,r.a.y));active.add(key(r.b.x,r.b.y));});
    const served=t.buildings.filter(b=>t.stops.some(s=>active.has(key(s.x,s.y))&&Math.abs(s.x-b.x)+Math.abs(s.y-b.y)<=5));
    const demand=Math.round(served.reduce((sum,b)=>sum+Math.max(1,b.pop||1)*(b.t==='house'?2:1),0));
    const capacity=Math.min(routes.length*45, fleet*35);
    const passengers=Math.min(demand,capacity);
    const roadCount=t.roads.size;
    const congestion=Math.min(90, Math.round((t.buildings.length*2+fleet*3)/Math.max(1,roadCount)*5));
    const moved=Math.floor(passengers*(1-congestion/180));
    const revenue=moved*fare;
    const operatingCost=fleet*12+routes.length*5;
    metrics={routes:routes.length,stops:t.stops.length,connected:active.size,demand,capacity,passengers:moved,unserved:Math.max(0,demand-moved),congestion,revenue,operatingCost,net:revenue-operatingCost};
  }
  function makePanel() {
    if(panel)return;
    const parent=document.getElementById('side-panel');
    if(!parent)return;
    panel=document.createElement('section');
    panel.id='city-transit-panel';
    panel.className='panel-section';
    panel.innerHTML='<div class="panel-header">🚌 Transports publics</div><div class="transit-details" style="padding:10px;font-size:12px;line-height:1.7"></div><div style="display:flex;gap:6px;flex-wrap:wrap;padding:6px"><button type="button" data-action="add">+ Bus (350 $)</button><button type="button" data-action="remove">− Bus</button><button type="button" data-action="fare">Tarif : 3 $</button></div>';
    parent.appendChild(panel);
    panel.addEventListener('click',e=>{
      const action=e.target?.dataset?.action;
      if(!action||!gameStarted)return;
      if(action==='add'){if(budget<350){notify('Budget insuffisant pour un bus.');return;}budget-=350;fleet++;}
      if(action==='remove'&&fleet>0){fleet--;}
      if(action==='fare'){fare=fare>=6?1:fare+1;}
      compute();render();updateUI();
    });
  }
  function render() {
    if(!panel)return;
    const d=panel.querySelector('.transit-details');
    d.textContent='Arrêts : '+metrics.stops+' · Reliés : '+metrics.connected+' · Lignes : '+metrics.routes+
      ' | Flotte : '+fleet+' · Capacité : '+metrics.capacity+
      ' | Voyageurs : '+metrics.passengers+'/'+metrics.demand+
      ' | Sans service : '+metrics.unserved+' | Trafic : '+metrics.congestion+
      '% | Billets : +'+metrics.revenue+' $ · Entretien : −'+metrics.operatingCost+
      ' $ · Solde : '+metrics.net+' $/cycle';
    panel.querySelector('[data-action="fare"]').textContent='Tarif : '+fare+' $';
    panel.querySelector('[data-action="remove"]').disabled=fleet===0;
  }
  function update() {
    if(typeof grid==='undefined'||!grid.length)return;
    // Recalculate once per game turn and after topology changes, no expensive BFS per animation frame.
    if(tick===lastCycle)return;
    lastCycle=tick;
    if(tick%60===0 && gameStarted && speed!==0){
      compute();
      budget=Math.max(0,budget+metrics.net);
    } else if(tick%10===0)compute();
    if(tick%10===0)render();
  }
  function init(){
    makePanel();compute();render();
    window._gameTickExtensions=window._gameTickExtensions||[];
    window._gameTickExtensions.push(update);
  }
  return {init,getMetrics:()=>({...metrics}),getRoutes:()=>routes.map(r=>({...r,path:r.path.slice()}))};
})();
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',TransitSystem.init);
else TransitSystem.init();
