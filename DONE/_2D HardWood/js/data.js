// ═══════════════════════════════════════
//  data.js — Static constants & data
// ═══════════════════════════════════════

const JERSEY_COLORS = [
  '#3d7fff','#ff4d6d','#00e676','#ffd700',
  '#a855f7','#ff6d00','#00bcd4','#e91e63'
];

const POSITIONS  = ['PG','SG','SF','PF','C'];
const POS_NAMES  = {
  PG: 'Point Guard',
  SG: 'Shooting Guard',
  SF: 'Small Forward',
  PF: 'Power Forward',
  C:  'Center'
};

const FIRST_NAMES = [
  'Marcus','Jaylen','Devon','Trevon','Khalil','Zion','Tyler','Isaiah',
  'Jordan','Chris','DeMar','Luka','Nikola','Giannis','Anthony','Devin',
  'Ja','Lamelo','Cade','Evan','Miles','Aaron','Bradley','Terry','Jalen',
  'Tyrese','Darius','RJ','Franz','Herbert'
];
const LAST_NAMES = [
  'Rivers','Storm','Knight','Vance','Cross','Pierce','Ellis','Webb',
  'Banks','Hayes','Fox','Dren','Volk','Bell','Davis','Wade','Murray',
  'Ball','Bridges','Grant','Carter','Gordon','Neal','Rozier','Green',
  'Maxey','Garland','Barrett','Wagner','Jones'
];

const AI_TEAMS = [
  { name:'Nova Hawks',    city:'Nova',    color:'#ff4d6d' },
  { name:'Steel Wolves',  city:'Steel',   color:'#aaaaaa' },
  { name:'Neon Vipers',   city:'Neon',    color:'#00e676' },
  { name:'Solar Bears',   city:'Solar',   color:'#ffd700' },
  { name:'Circuit Kings', city:'Circuit', color:'#a855f7' },
  { name:'Iron Dragons',  city:'Iron',    color:'#ff6d00' },
  { name:'Ghost Riders',  city:'Ghost',   color:'#00bcd4' },
  { name:'Apex Sharks',   city:'Apex',    color:'#e91e63' },
];

const TACTICS_LIST = [
  {
    id:'run_gun',  name:'Run & Gun',
    desc:'Fast pace, lots of shots, tires defenders',
    bonus:'+8% 3PT, -5% DEF',
    paceBonus:2, offBonus:8, defMalus:5
  },
  {
    id:'iso',      name:'Isolation',
    desc:'Star player takes over, systematic setups',
    bonus:'+12% star shots',
    paceBonus:-1, offBonus:6, defMalus:2
  },
  {
    id:'triangle', name:'Triangle',
    desc:'Ball movement, everyone scores',
    bonus:'+6% all shots',
    paceBonus:0, offBonus:6, defMalus:0
  },
  {
    id:'lockdown', name:'Lockdown DEF',
    desc:'Suffocating defense, low scoring game',
    bonus:'+10% DEF, -4% OFF',
    paceBonus:-2, offBonus:-4, defMalus:-10
  },
  {
    id:'motion',   name:'Motion OFF',
    desc:'Constant cuts and screens to create openings',
    bonus:'+5% mid-range',
    paceBonus:1, offBonus:5, defMalus:2
  },
  {
    id:'press',    name:'Full Court Press',
    desc:'Pressure defense forces turnovers',
    bonus:'+15% steals',
    paceBonus:1, offBonus:0, defMalus:-5
  },
];

const TRAINING_LIST = [
  { id:'shooting',  name:'Shooting Drills',    icon:'🏀', desc:'Improve 3PT and mid-range',              stat:'shooting',  gain:3,  cost:30, sessions:2 },
  { id:'defense',   name:'Defense Workshop',   icon:'🛡',  desc:'Improve blocking & steals',              stat:'defense',   gain:3,  cost:30, sessions:2 },
  { id:'speed',     name:'Sprint Training',    icon:'⚡',  desc:'Improve speed & transition',             stat:'speed',     gain:3,  cost:25, sessions:2 },
  { id:'strength',  name:'Weight Room',        icon:'💪',  desc:'Improve inside scoring & rebounding',    stat:'strength',  gain:3,  cost:25, sessions:2 },
  { id:'iq',        name:'Film Session',       icon:'📽',  desc:'Improve basketball IQ & passing',        stat:'iq',        gain:3,  cost:20, sessions:2 },
  { id:'recovery',  name:'Recovery Day',       icon:'🧘',  desc:'Restore energy for all players',         stat:'energy',    gain:20, cost:15, sessions:1 },
];