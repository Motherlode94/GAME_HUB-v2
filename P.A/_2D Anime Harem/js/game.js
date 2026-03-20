// =============================================================
//  HAREM SAGA v2 — game.js
//  Histoires profondes · Fonds animés · Météo · 8 lieux · Arcs narratifs
// =============================================================

// ── LIEUX ────────────────────────────────────────────────────
const LOCATIONS = {
  school:  { name:'École',          icon:'🏫', label:'Académie Sakura Hills', bgClass:'school',  timeOfDay:'day'   },
  park:    { name:'Parc Sakura',    icon:'🌸', label:'Parc des Cerisiers',   bgClass:'park',    timeOfDay:'dusk'  },
  cafe:    { name:'Café Lumière',   icon:'☕', label:'Café Lumière',          bgClass:'cafe',    timeOfDay:'night' },
  library: { name:'Bibliothèque',   icon:'📚', label:'Grande Bibliothèque',  bgClass:'library', timeOfDay:'day'   },
  rooftop: { name:'Toit de l\'école',icon:'🌆',label:'Toit — Académie',      bgClass:'rooftop', timeOfDay:'night' },
  home:    { name:'Appartement',    icon:'🏠', label:'Appartement 4F',       bgClass:'home',    timeOfDay:'night' },
  beach:   { name:'Plage d\'Azur',  icon:'🏖️', label:'Plage d\'Azur',        bgClass:'beach',   timeOfDay:'night' },
  shrine:  { name:'Sanctuaire',     icon:'⛩️', label:'Sanctuaire Tenshino',  bgClass:'shrine',  timeOfDay:'night' },
};

const LOCATION_ROOMS = {
  school: [
    { id:'classroom',    name:'Salle de classe' },
    { id:'courtyard',    name:'Cour centrale' },
    { id:'clubroom',     name:'Salle de club' },
    { id:'gym',          name:'Gymnase' },
    { id:'rooftop_gate', name:'Accès toit' },
  ],
  park: [
    { id:'entrance',    name:'Entrée du parc' },
    { id:'cherry_path', name:'Allée sakura' },
    { id:'pond',        name:'Étang' },
    { id:'picnic',      name:'Pelouse pique-nique' },
  ],
  cafe: [
    { id:'counter',  name:'Comptoir' },
    { id:'terrace',  name:'Terrasse' },
    { id:'kitchen',  name:'Cuisine' },
    { id:'backroom', name:'Réserve' },
  ],
  library: [
    { id:'hall',         name:'Hall principal' },
    { id:'reading_room', name:'Salle de lecture' },
    { id:'archives',     name:'Archives' },
    { id:'upper_floor',  name:'Étage silencieux' },
  ],
  rooftop: [
    { id:'door',       name:'Porte d accès' },
    { id:'fence',      name:'Rambarde' },
    { id:'bench',      name:'Coin banc' },
    { id:'water_tank', name:'Citerne' },
  ],
  home: [
    { id:'entry',   name:'Entrée' },
    { id:'living',  name:'Salon' },
    { id:'kitchen', name:'Cuisine' },
    { id:'bedroom', name:'Chambre' },
    { id:'balcony', name:'Balcon' },
  ],
  beach: [
    { id:'promenade', name:'Promenade' },
    { id:'shore',     name:'Rive' },
    { id:'pier',      name:'Ponton' },
    { id:'snack',     name:'Kiosque' },
  ],
  shrine: [
    { id:'torii',     name:'Porte torii' },
    { id:'courtyard', name:'Cour' },
    { id:'ema_wall',  name:'Mur des vœux' },
    { id:'main_hall', name:'Salle principale' },
  ],
};

const SLOT_LABELS = {
  morning:'Matin',
  afternoon:'Après-midi',
  evening:'Soir',
  night:'Nuit',
};

const SLOT_LOCATION_POOL = {
  morning:   ['school','library','park','school','home'],
  afternoon: ['school','cafe','park','library','home'],
  evening:   ['cafe','park','rooftop','home','shrine'],
  night:     ['home','rooftop','shrine','beach','cafe'],
};

const WEATHER_LOCATION_BOOSTS = {
  rain:  ['home','library','cafe'],
  storm: ['home','cafe','library'],
  snow:  ['home','library'],
  sunny: ['park','school','beach'],
  cherry:['park','shrine','cafe'],
  cloudy:['school','library'],
};

const CHARACTER_ACTIVITY_BY_SLOT = {
  sakura: {
    morning:'Sakura classe ses notes de recettes.',
    afternoon:'Sakura prépare quelque chose de sucré.',
    evening:'Sakura cherche un endroit calme pour parler.',
    night:'Sakura écrit dans son carnet personnel.',
  },
  akira: {
    morning:'Akira vérifie son matériel avant les cours.',
    afternoon:'Akira bouge entre entraînement et musique.',
    evening:'Akira se pose à l écart pour souffler.',
    night:'Akira compose en silence.',
  },
  yuki: {
    morning:'Yuki lit déjà depuis un moment.',
    afternoon:'Yuki observe et note chaque détail.',
    evening:'Yuki aime les espaces peu fréquentés.',
    night:'Yuki médite avant de rentrer.',
  },
  nana: {
    morning:'Nana est déjà en mouvement.',
    afternoon:'Nana enchaîne activités et rencontres.',
    evening:'Nana cherche encore une dernière énergie.',
    night:'Nana termine la journée en debrief.',
  },
};

const WEATHERS = [
  { id:'sunny',   icon:'☀️',  label:'Ensoleillé', bonus:0  },
  { id:'cloudy',  icon:'☁️',  label:'Nuageux',    bonus:0  },
  { id:'rain',    icon:'🌧️',  label:'Pluie',      bonus:5  },
  { id:'cherry',  icon:'🌸',  label:'Floraison',  bonus:8  },
  { id:'storm',   icon:'⛈️',  label:'Orage',      bonus:3  },
  { id:'snow',    icon:'❄️',  label:'Neige',      bonus:6  },
];

// ── PERSONNAGES ───────────────────────────────────────────────
const CHARS_DATA = [

  // ══════════════════════════════════
  //  SAKURA
  // ══════════════════════════════════
  {
    id:'sakura', name:'Sakura Hanami', archetype:'Douce & Timide',
    color:'#ff80c0', accent:'#ff3d9a', emoji:'🌸',
    quote:'"Je… je ne suis pas sûre de moi, mais je ferai de mon mieux !"',
    birthday:'14 Avril',
    hobby:'Pâtisserie · Jardinage · Lecture de manga shojo',
    fav_loc:'cafe', fav_food:'fraises à la crème', fav_color:'rose pâle',
    personality:'shy',

    biography:`
      Sakura est née dans une petite ville de montagne, fille unique d'un apiculteur et d'une institutrice.
      Enfant solitaire mais rêveuse, elle passait ses étés à cueillir des fleurs sauvages et à inventer des recettes
      avec le miel de son père. À douze ans, sa famille déménage à Sakura Hills ; l'intégration fut difficile — trop douce,
      trop discrète, trop "différente" pour les autres élèves.

      C'est la cuisine qui l'a sauvée. Chaque gâteau qu'elle confectionne est une lettre muette adressée
      à ceux qu'elle aime. Elle n'a jamais appris à dire "je tiens à toi" avec des mots — alors elle dit
      avec du sucre, de la farine et beaucoup de soin.

      Son grand rêve : ouvrir un jour un petit salon de thé entouré d'un jardin fleuri,
      où les gens pourraient reprendre leur souffle.
    `,

    arcs: [
      {
        id:'arc1', name:'La Pâtissière Silencieuse', threshold:15,
        desc:`Sakura t'observe depuis longtemps sans oser approcher. Elle enfouie ses émotions dans ses créations
        culinaires — chaque macaron, chaque tarte est une déclaration qu'elle n'arrive pas à prononcer.
        Cet arc révèle son monde secret : un carnet de recettes annoté de petites notes personnelles,
        sa cuisine comme sanctuaire.`
      },
      {
        id:'arc2', name:'La Cicatrice Cachée', threshold:50,
        desc:`Sous sa timidité se cache une blessure : une amitié trahie au collège l'a rendue méfiante
        envers les gens qui "semblent bien". Elle commence à te laisser entrer, avec mille précautions.
        Tu découvres son carnet de cuisine — et la page qu'elle a écrite pour toi.`
      },
      {
        id:'arc3', name:'Le Jardin des Aveux', threshold:80,
        desc:`Sakura prend une décision qui lui coûte tout : annuler sa participation au concours de pâtisserie
        national pour être là lors d'un moment difficile qui te touche. Ce sacrifice silencieux dit
        ce qu'elle n'a jamais pu mettre en mots. Le jardin de cerisiers devient le décor de sa confession.`
      }
    ],

    dialogues: {
      school:[
        "Ah ! Tu m'as surprise… (se recroqueville légèrement) Désolée, je fixe souvent le vide en cours de maths.",
        "J'essaie de me concentrer sur le devoir de chimie, mais l'odeur du déjeuner distrait tout le monde…",
        "Je… j'ai apporté des sablés ce matin. Il en reste si tu veux. (sort un sachet soigneusement emballé)",
        "Le professeur Tanaka a rendu les copies. J'ai eu 17. C'est bien ? Je trouvais que j'avais mal répondu à la troisième question…",
        "Tu sais, parfois je me demande si les autres élèves savent à quel point l'école sent bon le matin. Le bois, la craie…",
        "Oh ! Je rangeais juste mon livre… non, rien, tu n'as pas besoin de voir. (cache rapidement son carnet illustré de fleurs)"
      ],
      park:[
        "Les cerisiers sont au maximum de leur floraison… tu savais que la saison ne dure que deux semaines ? Ça me rend mélancolique.",
        "Je viens ici après les cours quand j'ai besoin de respirer. La ville s'entend à peine depuis ce banc.",
        "J'ai ramassé des fleurs sauvages pour faire un sirop. Tu veux que je t'en fasse une bouteille ? (pause) Seulement si tu aimes le goût floral…",
        "Ce parc ressemble à celui de mon village natal. Parfois je ferme les yeux et j'imagine que je suis encore là-bas.",
        "Il y a une exposition florale ici le week-end. Je voulais y aller seule, mais… est-ce que tu… non, laisse, c'est stupide.",
        "Le vent fait tomber les pétales comme une pluie rose. Si tu en attrapes un, ça porte bonheur — c'est ce que dit ma mère."
      ],
      cafe:[
        "Le gérant Hiroshi me laisse tester les nouvelles recettes ! J'ai proposé un fondant au thé matcha et framboise. Il est au menu demain.",
        "J'aime venir ici le soir quand il pleut. Les vitres s'embuent et le monde extérieur disparaît.",
        "Tu prends quoi ? Je recommande le hojicha avec le gâteau aux agrumes… c'est moi qui ai adapté la recette. (timidement fière)",
        "Ce café est le seul endroit où je ne me sens pas obligée de faire semblant d'être plus à l'aise que je ne le suis.",
        "Tu as vu ? Il y a un petit chat sur le rebord de la fenêtre. Il vient tous les mardis. Je lui garde une part de saumon.",
        "Si j'avais un café un jour, je mettrais des plantes partout. Et du bon thé. Et de la musique douce. Et des chats. (rit doucement)"
      ],
      library:[
        "Je cherchais un livre sur la botanique médiévale. Tu lis souvent ici ? Je t'ai vu l'autre jour dans la section histoire.",
        "Shhh — non pas toi, c'est moi qui faisais du bruit. Je feuillette les vieux livres de cuisine reliés main. Ils sentent tellement bon.",
        "J'ai trouvé un traité du XVIIe siècle sur les herbes aromatiques. Certaines plantes qu'on utilise encore existent depuis des millénaires.",
        "Ici au moins, le silence est habité. Dans la rue le silence me pèse. Dans les bibliothèques il me protège.",
        "Tu veux qu'on étudie ensemble ? Je peux t'aider en chimie et tu peux m'expliquer les maths. (baisse les yeux) Si ça te dérange pas."
      ],
      rooftop:[
        "Je ne savais pas que tu montais ici aussi. Je… je prenais juste l'air. Le cours de sport m'épuise un peu.",
        "D'ici on voit le parc ! Et si tu regardes à gauche, le clocher de l'église qui sonne à 17h. J'aime ce son.",
        "Le vent sur le toit est différent. Il n'est pas retenu par les bâtiments. Je respire mieux ici.",
        "Il y a un nid de moineaux sous l'antenne. Trois œufs la semaine dernière. Aujourd'hui il y en avait cinq.",
        "Je mange parfois mes bento ici quand la cantine est trop bruyante. Tu veux partager ? J'ai fait trop d'onigiri."
      ],
      home:[
        "Oh ! Euh… tu aurais pu prévenir ! Je suis en tablier et ma cuisine ressemble à un champ de bataille de farine.",
        "Entre, entre… Excuse le désordre. J'essayais une nouvelle recette de tarte aux poires et gingembre.",
        "Ma plante carnivore près de la fenêtre, c'est ma petite collection. Celle-ci s'appelle Venus. (caresse doucement le pot)",
        "J'ai des photos de mes recettes sur ce carnet… tu veux voir ? Non, enfin, si tu veux… (tend timidement le cahier illustré)",
        "Je faisais juste de la musique. Pas vraiment, juste fredonner. Je chante parfois en cuisinant. C'est gênant ? (rougit)"
      ],
      beach:[
        "La mer la nuit… ça m'impressionne. C'est si grand. Si peu contrôlable. Je suis attirée et apeurée en même temps.",
        "Je ne nage pas très bien. Mais j'adore rester jusqu'aux genoux dans l'eau froide et regarder l'horizon.",
        "Le sable garde la chaleur du jour le soir. Si on s'allonge on sent encore le soleil. (s'assied dans le sable, les yeux brillants)",
        "J'ai vu des étoiles filantes l'été dernier depuis cette plage. Une toutes les dix minutes. Je me suis endormie en comptant.",
        "Si tu ramasses un coquillage et que tu l'approches de ton oreille… tu entends la mer. Je sais que c'est juste l'air, mais j'aime y croire."
      ],
      shrine:[
        "J'ai grandi avec les fêtes de sanctuaire. Ma mère disait que si tu pries ici au coucher du soleil, les esprits t'entendent mieux.",
        "Ces lanternes… chaque famille du quartier en commande une à l'Obon. Mon père y écrit toujours le prénom de sa propre mère.",
        "Tu veux tirer un omamori ? Je t'en offre un. (fouille sa bourse) J'en ai plusieurs pour la santé, la chance, et… l'amour. (rougit violemment)",
        "Ici je me sens moins seule. Même quand je viens seule. C'est étrange, non ? Comme si les lieux pouvaient tenir compagnie.",
        "On peut faire des vœux en attachant ces rubans aux cordes. J'en noue un à chaque solstice depuis que j'ai sept ans."
      ],
      flirt:[
        "Tu… tu peux arrêter de me regarder comme ça ? (joues cramoisies) Je me concentre plus.",
        "C'est… c'est vraiment ce que tu penses ? (silence, puis elle sourit sans le vouloir)",
        "Wh-Whoa… tu es très direct. Je ne sais pas comment répondre. (se cache derrière son carnet)",
        "Non, non, je… je suis contente que tu… enfin voilà. (regardente ses chaussures fixement)",
        "Je t'en veux d'être aussi sincère. C'est difficile de rester calme quand quelqu'un dit des choses pareilles."
      ],
      gift:[
        "C'est vraiment pour moi ? (larmes aux yeux) Tu savais que… c'est exactement ce que je cherchais.",
        "Je vais le garder précieusement. Vraiment. Tout ce que tu me donnes, je le garde. (baisse les yeux)",
        "Personne ne m'offre des cadeaux d'habitude. Je ne sais pas comment réagir. Merci. Vraiment.",
        "Tu as fait attention à ce que j'aime. (pause) Tu m'écoutes vraiment, n'est-ce pas ?"
      ],
      date:[
        "Un rendez-vous ? J'ai souri toute la soirée précédente sans m'en rendre compte.",
        "C'était parfait. Absolument parfait. (silence ému) Je ne veux pas que ça s'arrête.",
        "Je t'ai préparé quelque chose. Pour te remercier de ce moment. (sort un petit gâteau emballé dans du papier kraft et ficelle)"
      ],
      listen:[
        "…Tu m'écoutes vraiment, toi. (pause) Ce n'est pas si commun, tu sais.",
        "Parfois j'ai juste besoin que quelqu'un soit là. Pas pour résoudre quoi que ce soit. Juste… être là.",
        "Je te raconte quelque chose que je n'ai jamais dit à personne. Mon café rêvé s'appellerait 'Le Jardin de Minuit'.",
        "Ma mère me disait que les gens qui savent écouter sont les plus rares. (te regarde longtemps) Elle avait raison.",
        "Tu sais ce que j'aime dans ces moments ? Le silence qu'on partage. Il dit plus que les mots."
      ]
    },

    events: {
      8:{
        chapter:'Chapitre I', title:'Le Carnet de Recettes',
        subtitle:'Une confidence sucrée',
        scene:'Café Lumière, un après-midi de pluie',
        text:`Sakura était penchée sur un carnet à spirales, couvert d'annotations colorées et de petits dessins de gâteaux.
        Quand elle a levé les yeux et réalisé que tu étais là depuis plusieurs minutes, ses joues ont viré au rose bonbon.
        "Je… c'est juste mes recettes. Rien d'intéressant." Elle a refermé le carnet d'un geste rapide —
        mais pas avant que tu aperçoives une page dédiée à un "gâteau pour les jours tristes de quelqu'un de spécial".
        Le prénom noté en bas de page : le tien.`,
        choices:[
          { t:"\"C'est magnifique. Tu peux me montrer ?\"",    g:18, mood:'happy', mem:"Tu as vu le carnet de Sakura — et ton prénom sur la page secrète." },
          { t:"\"Je ferai semblant de n'avoir rien vu.\"",    g:10, mood:'neutral', mem:"Tu as gardé le secret du carnet de Sakura." }
        ]
      },
      22:{
        chapter:'Chapitre I', title:'Le Concours de Pâtisserie',
        subtitle:'Première victoire',
        scene:'Salle des fêtes de l\'école',
        text:`Sakura participait au concours de pâtisserie de l'école pour la première fois.
        Ses mains tremblaient légèrement en posant son entremet sur la table.
        Le jury a goûté en silence. Puis la présidente du jury — une pâtissière professionnelle — a posé sa cuillère
        et dit simplement : "C'est le meilleur que j'aie mangé en dix ans de jury."
        Sakura n'a pas crié, n'a pas sauté. Elle s'est tournée vers toi dans la salle, et ses yeux mouillés ont dit ce que sa voix ne pouvait pas.`,
        choices:[
          { t:"Te lever et applaudir le premier",           g:22, mood:'happy',  mem:"Tu as été le premier à applaudir Sakura à son concours." },
          { t:"Lui adresser un sourire du fond de la salle", g:15, mood:'happy',  mem:"Ton sourire a traversé toute la salle jusqu'à Sakura." }
        ]
      },
      42:{
        chapter:'Chapitre II', title:'La Cicatrice de Juin',
        subtitle:'Une blessure ancienne',
        scene:'Banc du parc, soir de pluie',
        text:`Tu l'as trouvée sous la pluie, assise sur le banc sans parapluie, fixant le sol.
        "Il y a trois ans, j'avais une meilleure amie. Elle a partagé mon journal — mes vrais sentiments — avec toute la classe.
        Depuis, j'ai du mal à…" Elle s'est arrêtée. La pluie battait ses épaules.
        "Tu es le premier depuis longtemps à qui j'ai envie de faire confiance. C'est effrayant."`,
        choices:[
          { t:"Lui tendre ton manteau en silence",          g:28, mood:'happy',  mem:"Tu as donné ton manteau à Sakura sous la pluie — sans rien dire." },
          { t:"\"Je ne trahirai jamais ça. Je te le promets.\"", g:25, mood:'happy',  mem:"Tu as fait une promesse à Sakura sous la pluie." }
        ]
      },
      62:{
        chapter:'Chapitre II', title:'Le Gâteau pour Toi',
        subtitle:'Une déclaration en sucre',
        scene:'Ta porte d\'entrée, un dimanche matin',
        text:`Un dimanche à 8h30, un coup à la porte. Sakura, les cheveux encore en désordre,
        tient un gâteau emballé dans du papier kraft avec une ficelle rose.
        "Je… j'ai passé la nuit à le faire. Il y a de la fraise — ta préférée, d'après ce que tu avais dit une fois.
        J'espère que tu t'en souviens encore, parce que moi je n'oublie rien de ce que tu dis."
        Elle te tend le gâteau et regarde ailleurs. "C'est juste un cadeau. Rien de plus. Enfin, peut-être un peu plus."`,
        choices:[
          { t:"\"Viens déjeuner avec moi. Je partage.\"",     g:30, mood:'happy',  mem:"Sakura a cuisiné toute une nuit pour toi. Vous avez mangé ensemble au soleil." },
          { t:"\"Je me souviens de tout ce que tu me dis aussi.\"", g:35, mood:'blush', mem:"Tu as dit à Sakura que tu écoutes, vraiment. Elle a cligné des yeux très vite." }
        ]
      },
      82:{
        chapter:'Chapitre III', title:'Le Jardin des Aveux',
        subtitle:'Ce que les pétales savent',
        scene:'Parc Sakura, coucher de soleil — floraison maximale',
        text:`Sakura t'a demandé de venir ce soir-là sans te dire pourquoi. Le parc est incandescent —
        les cerisiers sont au sommet de leur floraison, les pétales tombent comme une neige rose dans la lumière orangée.
        Elle se tient au centre, dos à toi.
        "J'ai annulé ma participation au concours national. Le jury national. Celui dont je rêvais depuis deux ans."
        Un silence.
        "Tu traversais quelque chose de difficile cette semaine. Je ne pouvais pas ne pas être là."
        Elle se retourne. Ses yeux sont brillants mais sereins.
        "Je crois que ça s'appelle avoir des priorités. Tu es ma priorité."`,
        choices:[
          { t:"\"Sakura… je ne sais pas comment…\" (l'embrasser doucement)", g:40, mood:'happy', mem:"Sous les cerisiers en fleur, Sakura t'a avoué ses sentiments. Et tu l'as enlacée." },
          { t:"\"On ira au prochain concours ensemble. Je serai là.\"",       g:35, mood:'happy', mem:"Tu as promis à Sakura d'être à ses côtés pour le prochain concours." }
        ]
      }
    }
  },

  // ══════════════════════════════════
  //  AKIRA
  // ══════════════════════════════════
  {
    id:'akira', name:'Akira Kurosawa', archetype:'Tsundere Rebelle',
    color:'#60c0ff', accent:'#2080ff', emoji:'⚡',
    quote:'"N-Ne te méprends pas ! Ce n\'est pas parce que je t\'apprécie !"',
    birthday:'3 Novembre',
    hobby:'Guitare électrique · Mécanique moto · Shogi en ligne',
    fav_loc:'rooftop', fav_food:'ramen épicé', fav_color:'bleu électrique',
    personality:'tsundere',

    biography:`
      Akira a grandi en banlieue avec son grand frère aîné, mécanicien passionné de musique.
      C'est lui qui lui a mis une guitare dans les mains à sept ans en disant : "Si tu veux crier sans blesser les gens, tu joues."
      Elle a compris le message.

      Son père est absent depuis ses douze ans — parti travailler à l'étranger sans vraiment donner de nouvelles.
      Sa mère travaille deux postes. Akira a appris seule à réparer les choses, à être forte,
      à ne jamais demander d'aide. "Les gens partent" est la vérité qu'elle a gravée au fond d'elle.

      En surface : sarcastique, distante, provocatrice. En dessous :
      une musique qu'elle compose la nuit, des paroles qui parlent d'espoir,
      et un espoir désespéré que quelqu'un reste assez longtemps pour l'entendre vraiment.
    `,

    arcs: [
      {
        id:'arc1', name:'Le Mur de Guitare', threshold:15,
        desc:`Akira utilise sa guitare comme armure. Elle joue seule sur le toit, jamais devant un public.
        Cet arc explore pourquoi — et le moment où tu l'entends jouer quelque chose de personnel pour la première fois.`
      },
      {
        id:'arc2', name:'La Fissure dans l\'armure', threshold:50,
        desc:`Une nuit de tempête, quelque chose craque dans la façade d'Akira. Tu découvres les vraies paroles
        de ses chansons, celles qu'elle n'a jamais montrées à personne. Et tu comprends que chaque note
        était une façon de parler de son père.`
      },
      {
        id:'arc3', name:'Capitulation', threshold:80,
        desc:`Akira fait quelque chose qu'elle ne s'était jamais autorisé : demander de l'aide.
        Et reconnaître qu'elle tient à quelqu'un — à voix haute, les yeux dans les yeux,
        sans que la fureur prenne le dessus.`
      }
    ],

    dialogues: {
      school:[
        "Pfff. Tu m'espionnes encore ? J'ai un cours, là. Occupe-toi de tes affaires.",
        "Le professeur Mori est insupportable. Il a rendu mon devoir avec des corrections en rouge partout. J'avais raison sur TOUS les points. (froisse le devoir)",
        "Je me défends très bien seule, tu sais. J'ai pas besoin qu'on m'aide à porter mes affaires. Mais… merci. (marmonne)",
        "T'as vu le tableau d'affichage ? Mon groupe est dissous pour la kermesse. Tant mieux. J'avais pas envie de jouer devant ces abrutis.",
        "Pourquoi tu me regardes ? Y'a quelque chose sur ma joue ? Non ? Alors regarde ailleurs. (tourne la tête, rouge)",
        "J'ai oublié mon repas. Non, j'ai pas faim. Non, je vais bien. (pause) … T'aurais pas du riz de trop, là ?"
      ],
      park:[
        "Je viens ici pour répéter. Pas pour socialiser. C'est clair ? (pose sa guitare) …T'as l'air de vouloir rester quand même.",
        "Cette chanson s'appelle 'Novembre'. Je l'ai composée un jour où tout allait très mal. Elle est nulle.",
        "Les arbres ici sont les seuls qui ne disent rien de stupide. J'apprécie leur silence.",
        "Tu veux entendre ma nouvelle compo ? Non — enfin, si tu insistes… je vais juste jouer quelques accords. (commence à jouer)",
        "Il y a un skatepark à 200m. J'y allais beaucoup avant de me casser le poignet. Ça fait deux ans. Le poignet est rétabli mais je n'y suis pas retournée.",
        "Le parc le soir appartient aux gens qui ont besoin de disparaître un peu. C'est pour ça que j'aime qu'il soit vide. Enfin… presque vide."
      ],
      cafe:[
        "Je ne voulais pas venir ici. Les cafés c'est trop… doux. Mais il pleuvait et tu avais l'air d'y tenir.",
        "Café noir, ristretto, pas de lait, pas de sucre. Non, je ne suis pas masochiste. J'aime les goûts qui ne mentent pas.",
        "Ce barista me reconnaît et prépare ma commande avant que je parle. C'est la seule personne en dehors de toi qui m'a observée suffisamment longtemps.",
        "T'as une tête à lire du manga shonen. Laisse-moi deviner. Naruto ? (croise les bras) Peu importe. Moi c'est du seinen. Les adultes complexes.",
        "J'ai laissé un avis en ligne sur ce café. Cinq étoiles. Annonce ça à personne ou je le nie catégoriquement."
      ],
      library:[
        "T'es là toi aussi ? C'est pas la section romans graphiques, là. T'as pas ta place. (pause) Moi non plus d'ailleurs. Je viens pour les mangas techniques de guitare.",
        "Je répare les vieilles partitions que la bibliothèque jette. C'est pas autorisé. T'as rien vu.",
        "Les livres sur la composition musicale sont tous rangés à l'envers. Ça me rend folle depuis deux ans. J'en ai replacé quelques-uns.",
        "Écoute. Juste écoute. (te tend une oreillette) C'est ce compositeur dont personne parle. Fingerstyle japonais. La version studio. La live est meilleure."
      ],
      rooftop:[
        "J'aurais dû mettre un panneau 'interdit'. C'est MON coin. (soupir) Bon. T'es là. Autant faire avec.",
        "D'ici je vois la banlieue où j'ai grandi. Les toits plats. Les antennes rouillées. Je pensais que partir suffirait à tout effacer. Spoiler : non.",
        "Je joue ici parce que personne n'entend. Ou plutôt, personne ne regardait. (te lance un regard de côté)",
        "La nuit, la ville ressemble à un circuit imprimé. Des milliards de connexions. Des milliards de gens qui ignorent leur propre existence. C'est déprimant et magnifique.",
        "Tu viens souvent ? Si t'es là demain aussi, je jouerai quelque chose. Pour de vrai. Ma composition. Pas pour toi. Juste… à voix haute."
      ],
      home:[
        "Qu'est-ce que tu fais là ?! J'ai pas… non, entre si tu insistes. Mais touche pas à ma guitare.",
        "Mon appartement ressemble à un atelier. Trois guitares, des pédales d'effet partout, une moto en cours de révision dans le couloir. C'est chez moi.",
        "J'ai des disques vinyles de mon frère. Il me les a laissés quand il est parti travailler au nord. (passe la main sur la pochette) Je les ai tous écoutés cent fois.",
        "Je faisais juste du ramen. T'en veux ? Nan, réponds pas, j'en fais trop de toute façon. (retourne à la cuisine en maugréant)"
      ],
      beach:[
        "Je déteste le sable. Il se glisse partout. Mais la mer de nuit c'est… acceptable. (s'assied à distance de l'eau)",
        "Mon frère m'a appris à nager ici. À la dure — il m'a juste jetée à l'eau en disant 'nage'. J'ai nagé. Il avait raison.",
        "Les vagues ressemblent à une basse continue. Mi grave, répété à l'infini avec des variations. J'ai essayé de le noter une fois.",
        "Ne t'éloigne pas trop. L'eau est froide. Pour ta sécurité. Pas pour une autre raison. (regarde ailleurs)"
      ],
      shrine:[
        "Je suis pas croyante. Mais j'aime les sanctuaires. L'encens, le bois vieux, le calme particulier du lieu.",
        "Mon père venait ici avant de partir. Il m'a appris à nouer le ruban des vœux. Je viens encore, même s'il ne revient pas.",
        "Il y a une cloche ici qu'on frappe deux fois. Une fois pour appeler les dieux. Une fois pour les remercier d'avance. J'aime ce principe.",
        "Je fais un vœu chaque année. Je ne te dirai pas lequel. (frappe la cloche deux fois, les yeux fermés)"
      ],
      flirt:[
        "Tu… tu oses ! (se lève d'un coup) J'vais te frapper si tu continues. (rougit jusqu'aux oreilles)",
        "N-n'essaie pas de me séduire comme ça. C'est transparent et maladroit et ça… ça marche pas du tout. (détourne les yeux très vite)",
        "Pourquoi tu dis des trucs pareils ?! C'est embarrassant pour toi, pas pour moi. (croise les bras)",
        "Je t'interdis d'être aussi sincère sans prévenir. J'étais pas préparée. (tousse)",
        "…OK. Peut-être que c'est pas nul à entendre. Peut-être. (marmonne très bas)"
      ],
      gift:[
        "Je n'ai pas besoin de… oh. C'est exactement ce que je cherchais. Pure coïncidence. Merci. (dit très vite)",
        "Tu savais ? (pause) Comment tu savais ? (te regarde différemment, pendant longtemps)",
        "Je vais le garder. Pas parce que tu me l'as offert. Parce qu'il est utile. (l'examine avec un sourire qu'elle essaie de réprimer)"
      ],
      date:[
        "C'est juste parce que j'avais rien à faire ! Clairement. T'es content là ?",
        "…C'était bien. Je le dis une fois. Une seule fois. Voilà. J'ai dit.",
        "(en chemin pour rentrer) T'as pas besoin de me raccompagner. (marche quand même à côté de toi)"
      ],
      listen:[
        "Tu… tu m'écoutes vraiment. T'interromps pas. T'essaies pas de résoudre. Tu écoutes juste.",
        "Je voulais juste que quelqu'un sache. Je savais pas que ça soulagerait autant.",
        "Mon frère était le seul qui écoutait comme toi. Il me manque.",
        "Pourquoi tu fais ça ? (pause) Non, réponds pas. J'veux pas savoir. Si tu réponds je vais encore rougir."
      ]
    },

    events: {
      8:{
        chapter:'Chapitre I', title:'La Mélodie Interdite',
        subtitle:'Ce que le toit garde comme secret',
        scene:'Toit de l\'école, 17h30 — coucher de soleil',
        text:`Tu as entendu quelque chose depuis la cage d'escalier — une guitare, mélodieuse et mélancolique,
        jouée avec une précision troublante. En poussant la porte du toit, tu as trouvé Akira,
        dos tourné, les yeux fermés, perdue dans sa musique.
        Elle s'est arrêtée net en entendant tes pas. Rouge vif.
        "T'as rien entendu. Y'avait rien à entendre. Va-t'en." Mais elle n'a pas bougé. Et toi non plus.`,
        choices:[
          { t:"\"Continue. S'il te plaît. C'était extraordinaire.\"",   g:18, mood:'happy',  mem:"Tu as entendu Akira jouer seule sur le toit. Elle était magique." },
          { t:"Rester sans rien dire, les yeux fermés pour écouter",   g:22, mood:'happy',  mem:"Tu t'es assis en silence pour écouter Akira jouer. Elle a continué." }
        ]
      },
      20:{
        chapter:'Chapitre I', title:'La Défense',
        subtitle:'Elle n\'avait pas besoin d\'aide. Mais quand même.',
        scene:'Couloir de l\'école',
        text:`Trois élèves plus grands bloquaient Akira contre un casier — des remarques sur son look, sa guitare, son attitude.
        Elle tenait bon, yeux brillants de colère, mais ils étaient trois.
        Tu es intervenu. Pas en héros — juste en étant là, calme, jusqu'à ce qu'ils partent.
        Akira t'a regardé avec une expression que tu n'avais jamais vue : pas de la gratitude, pas de la colère.
        Quelque chose entre les deux. "J'avais la situation en main." Une pause. "Mais... merci quand même."`,
        choices:[
          { t:"\"Je sais. J'étais juste là par hasard.\"",              g:15, mood:'neutral', mem:"Tu as aidé Akira sans en faire un truc. Elle te regarde différemment." },
          { t:"Sourire et changer de sujet immédiatement",            g:20, mood:'happy',   mem:"Tu n'as pas fait de la défense d'Akira un moment awkward. Elle apprécie." }
        ]
      },
      40:{
        chapter:'Chapitre II', title:'Les Paroles de Novembre',
        subtitle:'Une fissure dans le mur',
        scene:'Toit — nuit d\'orage',
        text:`Un soir d'orage, tu l'as trouvée sur le toit sous la pluie, carnet ouvert.
        Elle ne t'a pas chassé. Pire — elle t'a tendu le carnet.
        Des paroles de chansons. Des dizaines. "Mon père est parti sans dire au revoir.
        Ma guitare est la seule chose qu'il m'a laissée qui ne peut pas partir."
        Elle a repris le carnet. "T'aurais pas dû lire ça." Mais elle te l'avait tendu.`,
        choices:[
          { t:"\"Ces paroles méritent d'être entendues.\"",             g:28, mood:'happy',  mem:"Akira t'a montré ses paroles sous la pluie. C'est sa cicatrice la plus profonde." },
          { t:"\"Je n'ai pas lu. J'ai juste vu que tu tenais fort.\"", g:22, mood:'neutral', mem:"Tu n'as pas lu le carnet d'Akira. Elle l'a remarqué." }
        ]
      },
      60:{
        chapter:'Chapitre II', title:'Le Concert Fantôme',
        subtitle:'Pour une seule personne dans la salle',
        scene:'Salle de musique vide — après les cours',
        text:`Akira t'a envoyé un message laconique : "Salle de musique. 18h. Viens ou pas."
        Tu es venu. La salle était vide sauf elle et sa guitare branchée sur un petit ampli.
        Elle a joué pendant vingt-cinq minutes sans jamais regarder dans ta direction —
        sa propre composition, complète, avec des paroles murmurées que tu entendais à peine.
        À la dernière note : "C'est pour mon père. Mais tu peux l'entendre aussi. Si tu veux."`,
        choices:[
          { t:"\"C'est la chose la plus belle que j'aie jamais entendue.\"", g:32, mood:'happy',  mem:"Akira a joué pour toi seul dans la salle vide. Sa composition sur son père." },
          { t:"Applaudir lentement, les yeux brillants",                   g:28, mood:'happy',  mem:"Tes applaudissements dans la salle vide. Akira a souri, les yeux au sol." }
        ]
      },
      82:{
        chapter:'Chapitre III', title:'La Capitulation',
        subtitle:'L\'armure tombe',
        scene:'Toit — nuit claire, étoiles',
        text:`"J'ai besoin de te dire quelque chose et je préviens que c'est humiliant pour moi alors
        t'as intérêt à pas sourire."
        Akira, debout sur le toit, mains dans les poches, te fixe.
        "J'en peux plus de faire semblant que je m'en fous. J'en peux plus de rougir et de crier pour cacher que je
        suis contente de te voir. J'en peux plus de composer des chansons sur quelqu'un sans admettre
        à quoi elles servent."
        Elle respire fort.
        "Espèce d'idiot. Je t'aime. Là, t'es content ?"`,
        choices:[
          { t:"La serrer dans tes bras sans rien dire",                g:40, mood:'happy',  mem:"Akira t'a avoué ses sentiments sur le toit. Tu l'as enlacée. Elle n'a pas résisté." },
          { t:"\"Moi aussi. Depuis longtemps.\"",                        g:38, mood:'happy',  mem:"Quand Akira a avoué, tu as répondu. Vous avez regardé la ville ensemble." }
        ]
      }
    }
  },

  // ══════════════════════════════════
  //  YUKI
  // ══════════════════════════════════
  {
    id:'yuki', name:'Yuki Shirogane', archetype:'Mystérieuse & Solitaire',
    color:'#c080ff', accent:'#8040ff', emoji:'❄️',
    quote:'"Le monde est un théâtre. Je joue simplement mon rôle."',
    birthday:'21 Décembre',
    hobby:'Philosophie · Kendo · Calligraphie nocturne',
    fav_loc:'library', fav_food:'soupe miso aux champignons', fav_color:'violet nuit',
    personality:'cool',

    biography:`
      Yuki est née dans une famille d'intellectuels — son père est professeur de philosophie,
      sa mère traductrice littéraire. Elle a grandi entourée de livres, de silence savant,
      et d'adultes qui s'exprimaient en citations plutôt qu'en émotions.

      À quinze ans, elle a perdu sa meilleure amie dans un accident.
      Depuis, Yuki porte cette absence comme un manteau invisible — visible pour ceux qui regardent vraiment.
      Elle s'est réfugiée dans la pensée pure : si tu comprends le monde, tu souffres moins quand il blesse.

      Sa froideur n'est pas de l'indifférence : c'est de la protection.
      Chaque mot qu'elle prononce est pesé, choisi. Chaque silence est un sentiment trop grand pour les mots.
      Et quand elle te regarde vraiment, c'est parce que tu es l'une des rares personnes
      qu'elle juge dignes d'être vues.
    `,

    arcs: [
      {
        id:'arc1', name:'L\'Observatrice', threshold:15,
        desc:`Yuki t'étudie depuis les premières semaines sans jamais s'approcher.
        Cet arc révèle ce qu'elle voit quand elle te regarde — et pourquoi elle décide de faire un pas vers toi.`
      },
      {
        id:'arc2', name:'La Fissure dans le Verre', threshold:50,
        desc:`Yuki parle d'Hana pour la première fois — son amie perdue.
        Tu découvres que sa philosophie entière est construite sur le deuil,
        et que te parler d'elle est le signe de confiance le plus grand qu'elle puisse accorder.`
      },
      {
        id:'arc3', name:'La Nuit où le Gel Fond', threshold:80,
        desc:`Yuki fait quelque chose d'impossible pour elle : elle rit vraiment.
        Et dans ce rire — si bref, si inattendu — tu entends tout ce qu'elle a gardé enfoui.
        La nuit du sanctuaire. La lanterne qu'elle allume pour Hana. Et ce qu'elle murmure en la regardant monter.`
      }
    ],

    dialogues: {
      school:[
        "…","Tu veux quelque chose ?",
        "J'observe. Les gens se trahissent dans les petits gestes. Toi tu touches ton oreille quand tu mens. Je note.",
        "Le cours était correct. La question finale était mal formulée. J'ai répondu à la question qu'il aurait dû poser.",
        "Tu es différent des autres. Je ne sais pas encore si c'est une qualité. (te fixe longuement) Probablement.",
        "Je préfère les couloirs vides. Mais tu n'es pas désagréable à côtoyer. C'est notable."
      ],
      park:[
        "La floraison maximale dure exactement deux semaines. Après, les arbres entrent en deuil silencieux.",
        "Les jardins japonais sont conçus pour représenter la mortalité. Chaque pierre, chaque vide. Je trouve ça honnête.",
        "Je lisais Marcus Aurèle. 'Perds du temps avec quelqu'un de bien — tu es cette personne en ce moment.' C'est une paraphrase.",
        "Les cerisiers ne poussent pas plus vite si on les observe. Pourtant, les regarder change quelque chose en nous.",
        "Tu aimes le silence ? Pas le vide, le silence — quand deux personnes sont ensemble et n'ont rien à prouver."
      ],
      cafe:[
        "Je viens pour la qualité du thé et l'absence de musique de fond. Deux critères rares.",
        "Earl Grey. Pas de sucre — la vie est déjà assez complexe sans rajouter du superflu.",
        "Ce lieu a une âme. Les vieux murs absorbent les émotions. Si tu écoutes, tu entends les conversations de dix ans.",
        "Tu as commandé le même thé que moi. Coïncidence ou observation ? L'un est plus intéressant que l'autre.",
        "La pluie dehors et le thé chaud créent un micro-climat parfait pour penser. Je t'y inclus, si tu es silencieux."
      ],
      library:[
        "La Grande Bibliothèque est le seul endroit où l'humanité a le bon goût de se taire.",
        "J'ai relu Dostoïevski ce mois-ci. Chaque lecture révèle quelque chose d'invisible la fois précédente.",
        "Ces rayonnages contiennent l'intégralité du monde humain. Ce qui est effrayant, c'est ce qui manque.",
        "Tu cherches quelque chose de précis ? Je connais la classification par cœur. (pause) Dis-moi.",
        "J'ai annoté ce livre. Les marges disent ce que le texte ne peut pas. (te le montre, couvert de petits caractères)"
      ],
      rooftop:[
        "Tu es monté ici aussi. La ville est plus honnête vue de haut — on voit les vides entre les bâtiments.",
        "La lune ce soir est à 98% de plénitude. Demain elle sera parfaite. Les choses importantes arrivent toujours un jour trop tôt ou trop tard.",
        "Je pratique le kendo à l'aube parfois. Ici, sur le toit vide. Le vide est le meilleur adversaire.",
        "Tu vois cette lumière là-bas ? C'est la maison de mon père. Il lit encore à cette heure. Nous ne nous ressemblons pas, sauf en cela."
      ],
      home:[
        "Tu es venu jusqu'ici. C'est une décision. Entre.",
        "Mes livres sont rangés par thème et sous-thème. Ne les déplace pas. (ton neutre mais absolu)",
        "Ma calligraphie est sur le bureau. Ne lis pas ce que j'écris la nuit — ça ne t'appartient pas encore.",
        "Tu veux du thé. Je sais sans que tu le demandes. Je t'ai observé assez longtemps."
      ],
      beach:[
        "La mer efface les traces. J'aime cette honnêteté — rien n'est permanent, donc rien ne mérite d'être figé.",
        "Hana aimait la mer. (pause longue) C'est tout ce que je dirai ce soir.",
        "Si on nageait jusqu'à l'horizon, tu crois qu'il y aurait autre chose ? (sourit très légèrement) Bien sûr que non. Mais l'idée est belle.",
        "Le bruit des vagues est la seule musique qui ne prétend pas être autre chose que ce qu'elle est."
      ],
      shrine:[
        "Les sanctuaires sont des espaces entre deux réalités. C'est pour ça qu'on y dit des choses qu'on ne peut pas dire ailleurs.",
        "Je viens ici chaque 21 décembre. Pour Hana. (allume une lanterne, la regarde monter en silence)",
        "Les dieux de ce sanctuaire sont anciens. Ils ont entendu plus de douleur que tu ne peux imaginer. Et ils sont toujours là.",
        "Tu peux formuler un vœu. Je ne t'écouterai pas. Certaines choses appartiennent à l'espace entre les mots."
      ],
      flirt:[
        "…Tu flirtes avec moi. (analyse) C'est maladroit. Mais sincère. Je note les deux.",
        "Mon cœur ne bat que pour les rares personnes qui méritent d'en être proches. Tu progresses.",
        "Continue si tu veux. Je ne promets pas que ça me laissera indifférente. (te regarde longuement, puis détourne les yeux)",
        "Je n'ai pas rougi. C'est de la chaleur. C'est différent. (il fait 18°C)"
      ],
      gift:[
        "…(examine l'objet en silence pendant quinze secondes) Tu as fait attention. C'est rare. Merci.",
        "Je ne possède que ce qui a de la valeur. Tu viens d'en ajouter. (range précieusement le cadeau)",
        "Tu savais que j'en avais besoin. Comment ? (te regarde autrement) Tu m'observes aussi."
      ],
      date:[
        "Je t'accorde ce temps. Ne le gaspille pas. (pause, puis en chemin) …C'était plaisant. Vraiment.",
        "Je ne dis pas ça souvent. J'ai passé un bon moment. (dit très calmement, comme si c'était la chose la plus évidente du monde)"
      ],
      listen:[
        "Tu écoutes sans interpréter. C'est une qualité exceptionnellement rare.",
        "Je peux te parler d'Hana maintenant. (silence) Tu es prêt ? (te regarde longuement avant de commencer)",
        "Certains silences sont plus éloquents que n'importe quel mot. Le nôtre en ce moment en fait partie.",
        "Je parle peu. Quand je parle, chaque mot compte. Sache que te parler, c'est te choisir."
      ]
    },

    events: {
      10:{
        chapter:'Chapitre I', title:'Le Regard Qui Juge',
        subtitle:'Et qui finit par approuver',
        scene:'Bibliothèque — section philosophie',
        text:`Yuki lisait, assise en tailleur sur le sol entre deux rayonnages — un endroit improbable.
        En levant les yeux, elle t'a vu tenir le même livre qu'elle avait terminé la semaine dernière.
        Un silence. Puis : "Tu as du goût."
        C'est tout. Mais de Yuki, c'est une déclaration.`,
        choices:[
          { t:"\"Je l'ai choisi pour la quatrième de couverture. Je suis curieux d'avoir ton avis.\"", g:18, mood:'happy',  mem:"Yuki t'a dit que tu avais du goût. Pour elle, c'est énorme." },
          { t:"Poser le livre à côté d'elle et t'asseoir sans rien dire",                           g:22, mood:'happy',  mem:"Tu t'es assis en silence près de Yuki dans la bibliothèque. Elle n'est pas partie." }
        ]
      },
      25:{
        chapter:'Chapitre I', title:'L\'Étoile Filante',
        subtitle:'Un vœu qu\'on ne formule pas à voix haute',
        scene:'Toit de l\'école — nuit claire',
        text:`"Une étoile filante." Yuki l'a dit sans émotion apparente, puis a attendu.
        "Tu veux formuler un vœu ? Les gens le font. Je trouve l'idée intéressante — pas parce que ça fonctionne,
        mais parce que ça révèle ce qu'on veut vraiment."
        Elle t'a regardé formuler ton vœu. Puis elle a fermé les yeux. Longtemps.
        "Le mien n'a pas changé depuis sept ans. Ce soir il a failli."`,
        choices:[
          { t:"Faire un vœu pour elle, à voix haute",                  g:22, mood:'happy',  mem:"Tu as formulé un vœu pour Yuki sous les étoiles. Elle a cligné des yeux." },
          { t:"Garder ton vœu pour toi et rester dans le silence",     g:28, mood:'neutral', mem:"Tu as gardé ton vœu secret près de Yuki. Elle a apprécié que tu comprennes." }
        ]
      },
      45:{
        chapter:'Chapitre II', title:'Hana',
        subtitle:'Le prénom qu\'on ne dit qu\'à ceux en qui on a confiance',
        scene:'Sanctuaire — soir d\'automne',
        text:`Yuki tenait une petite lanterne en papier, les yeux baissés.
        "Hana. C'est le prénom de mon amie. Elle aimait les lanternes — elle disait que la lumière qui monte
        porte les mots qu'on ne peut pas dire."
        La lanterne s'est envolée.
        "Elle est morte un 21 décembre. Ça fait cinq ans. Je viens chaque année. C'est la première fois que je viens avec quelqu'un."`,
        choices:[
          { t:"Allumer une seconde lanterne et la laisser partir en silence",   g:32, mood:'happy',  mem:"Tu as allumé une lanterne pour Hana avec Yuki. Elle a posé sa main sur la tienne." },
          { t:"\"Merci de me laisser partager ça avec toi.\"",                    g:28, mood:'happy',  mem:"Yuki t'a parlé d'Hana. Tu as su quoi dire — rien. Juste être là." }
        ]
      },
      65:{
        chapter:'Chapitre II', title:'Le Gel Commence à Fondre',
        subtitle:'Un rire impossible',
        scene:'Café Lumière — soir de pluie',
        text:`Tu avais dit quelque chose d'absurde — vraiment absurde, sans réfléchir.
        Et Yuki avait ri.
        Pas un sourire poli. Pas un léger amusement. Un vrai rire, bref et étonné,
        comme si elle l'avait laissé échapper par accident.
        Elle s'est raclé la gorge. A repris son expression habituelle.
        "C'était idiot." Mais elle regardait ailleurs. Et sa main sur la table
        était plus proche de la tienne qu'avant.`,
        choices:[
          { t:"Faire semblant de ne rien avoir vu",                     g:30, mood:'happy',  mem:"Yuki a ri pour la première fois devant toi. Tu as eu la grâce de ne pas en faire tout un plat." },
          { t:"\"Je t'interdis d'être aussi belle quand tu ris.\"",      g:35, mood:'blush',  mem:"Yuki a rougi. Vraiment rougi. Et elle ne l'a pas nié." }
        ]
      },
      84:{
        chapter:'Chapitre III', title:'La Nuit où le Gel Fond',
        subtitle:'Ce que la philosophe n\'avait pas prévu',
        scene:'Sanctuaire — nuit de pleine lune',
        text:`Yuki t'avait demandé de venir sans explication. Au sanctuaire, à minuit.
        Elle était là, face à la lune pleine, calligraphie dans les mains.
        "J'ai passé cinq ans à construire un monde où personne ne pouvait me manquer.
        Un monde de concepts, de distances, de verre."
        Elle a regardé le papier. Y a écrit quelque chose. Te l'a tendu.
        Trois caractères. 'Tu me manques quand tu n'es pas là.'
        "C'est la première fois que j'écris quelque chose de vrai depuis Hana.
        Je n'avais pas prévu que ce serait pour toi."`,
        choices:[
          { t:"Écrire toi aussi trois caractères et lui tendre le papier",  g:40, mood:'happy',  mem:"Au sanctuaire sous la lune, vous avez échangé des calligraphies. Aucun mot. Tout dit." },
          { t:"\"Le monde de verre te protégeait. Je veillerai à être digne de ce qu'il y a dedans.\"", g:38, mood:'happy', mem:"Tu as promis à Yuki d'être à la hauteur de ce qu'elle t'offre. Elle a fermé les yeux." }
        ]
      }
    }
  },

  // ══════════════════════════════════
  //  NANA
  // ══════════════════════════════════
  {
    id:'nana', name:'Nana Haruki', archetype:'Énergique & Solaire',
    color:'#ffb040', accent:'#ff8000', emoji:'🌟',
    quote:'"Allez ! On peut tout accomplir si on y croit à fond !"',
    birthday:'7 Juillet',
    hobby:'Football · Athlétisme · Cuisine de rue · Jeux vidéo de sport',
    fav_loc:'park', fav_food:'takoyaki extra épicé', fav_color:'orange soleil',
    personality:'genki',

    biography:`
      Nana a grandi dans une famille de huit enfants dans un appartement trop petit et trop bruyant —
      et elle en garde l'énergie absolue, la générosité instinctive, et un rire qui prend toute la pièce.

      Son père gérait une petite salle de sport dans le quartier. Elle a grandi entre des sacs de frappe
      et des rires d'adultes en sueur. Le sport n'est pas un hobby pour Nana — c'est la langue dans laquelle
      elle dit 'je suis en vie', 'je me bats', 'je tiens à toi'.

      Ce qu'on ne voit pas tout de suite : Nana est capitaine d'équipe depuis l'âge de treize ans.
      Elle a appris à lire les gens en quelques secondes — qui a besoin d'être encouragé, qui est à bout de forces —
      et elle s'y consacre sans jamais le mentionner.

      Sa peur secrète : ralentir. Parce que dans le silence, elle ne sait pas encore qui elle est.
      Tu es peut-être la personne qui va lui apprendre.
    `,

    arcs: [
      {
        id:'arc1', name:'La Capitaine', threshold:15,
        desc:`Nana est forte, rapide, solaire. Mais pour la première fois, quelqu'un remarque qu'elle est aussi
        celle qui reste après l'entraînement pour ramasser les cônes, celle qui encourage les autres sans jamais
        demander à être encouragée.`
      },
      {
        id:'arc2', name:'La Blessure', threshold:50,
        desc:`Nana se blesse sérieusement à la cheville. Pour la première fois de sa vie, elle est obligée de s'arrêter.
        Et dans cet arrêt forcé, elle découvre qu'elle ne sait pas qui elle est sans courir.
        Tu es là pour l'aider à trouver la réponse.`
      },
      {
        id:'arc3', name:'La Ligne d\'Arrivée', threshold:80,
        desc:`Le grand tournoi régional. Nana joue blessée — pour son équipe, pour son père, pour elle.
        Et pour la première fois, au coup de sifflet final, elle pleure.
        Parce qu'elle réalise que ce n'est pas la victoire qui comptait.`
      }
    ],

    dialogues: {
      school:[
        "YOOOO ! Salut salut ! T'as fait tes devoirs ? Moi j'ai essayé mais il était 23h et j'avais encore l'énergie de faire 50 pompes donc…",
        "Le cours de sport était trop facile ! J'ai demandé au prof si je pouvais faire le parcours deux fois. Il a dit non. J'ai fait deux fois quand même.",
        "T'as vu le planning du tournoi de foot ?? On est qualifiés !! (agite le planning sous ton nez) VIENS NOUS VOIR !!",
        "J'ai raté l'interro de maths. Pas grave. Je vais demander à Sakura de m'aider. Elle est trop forte en maths. Et en pâtisserie. Elle est trop forte en tout.",
        "Le proviseur a dit que j'étais 'trop agitée en classe'. J'ai répondu que j'avais une énergie excessivement positive. Il a pas semblé convaincu."
      ],
      park:[
        "COURSE !! Là, maintenant, jusqu'au cerisier du fond ! (part déjà en courant)",
        "J'adore ce parc ! Je m'entraine ici tous les matins à 6h30. T'as qu'à venir si tu veux. (pause) Sérieusement, viens. C'est bien de courir à deux.",
        "Tu vois ce poteau là-bas ? J'ai fait 47 aller-retours hier. Mon record c'est 52. Je vais battre 52 cette semaine.",
        "J'aime regarder les familles qui viennent le dimanche. Les petits enfants qui courent après les pigeons. (sourire doux) Ça me rappelle mes frères.",
        "Ce banc en bois là, c'est là que je m'assieds quand je suis… (hésite) quand j'ai besoin d'être moins grande."
      ],
      cafe:[
        "J'ADORE ce café ! Ils font des smoothies à la pastèque XXL ! (montre quelque chose trois fois plus grand que la normale)",
        "Le gérant m'a surnommée 'la fusée'. C'est le plus beau compliment de ma vie.",
        "Je suis venue ici après la finale perdue l'an dernier. J'ai commandé cinq gâteaux. Le gérant s'est assis avec moi. Il m'a rien dit. Je lui en suis encore reconnaissante.",
        "T'as mangé quoi ? Tu veux goûter le mien ? (tend sa fourchette sans même demander) Ha, tu aimes ! Je savais !"
      ],
      library:[
        "Chuuuut ! (mime quelqu'un qui crie silencieusement) Je sais comment on se comporte dans une bibli, hein ! (déplace accidentellement une pile de livres) Oups.",
        "Je viens chercher des livres sur la nutrition sportive. Y'en a pas beaucoup. J'ai demandé à la bibliothécaire d'en commander. Elle avait l'air surprise.",
        "Je comprends pas comment Yuki passe des heures ici sans bouger. C'est humain ?",
        "Il y a une section manga ! (chuchote très fort) Je viens jamais ici pour ça. Enfin, peut-être un peu."
      ],
      rooftop:[
        "YESSS le toit ! Tu savais qu'on voit la salle de sport d'ici ? J'y retourne dans vingt minutes, t'as qu'à venir.",
        "Le vent ici est parfait pour s'étirer ! (s'étire bruyamment) Ahhhh. T'aurais dû voir la tête du prof quand j'ai fait ça en salle.",
        "Je mange parfois ici pour éviter la cohue de la cantine. C'est paradoxal, non ? Moi qui aime les foules.",
        "Le coucher de soleil d'ici c'est… (s'arrête) …c'est vraiment bien. Je me tais une seconde. (effectivement silencieuse 8 secondes)"
      ],
      home:[
        "COOOOOU-COU ! Je t'ai apporté des cookies ! Je me suis peut-être un peu emballée sur la quantité mais mieux vaut trop que…",
        "Mon appartement est plus petit mais j'ai acheté un vélo de fitness. Il prend toute la place mais je m'en fous.",
        "J'ai des photos de l'équipe partout ! Là c'est la finale régionale, là c'est après l'entraînement — oui je suis la seule à sourire, les autres sont épuisées, c'est normal.",
        "Tu veux rester dîner ? Je fais du riz sauté épicé. Je préviens : très épicé. Tu peux pas dire non maintenant."
      ],
      beach:[
        "YESSS LA MER !! (a déjà retiré ses chaussures) Course !! Dernière à l'eau est une fille !!",
        "J'ai nagé 2km ce matin. Pour m'échauffer. Les gens de la plage me regardaient bizarrement.",
        "Mon équipe est venue ici après notre première victoire. On a sauté dans l'eau tout habillées. Le coach était furieux. C'était le meilleur soir de ma vie.",
        "Regarde le ciel ! Non, à droite — ces étoiles-là. Mon père m'a appris Orion. C'est la seule constellation que je reconnaisse mais j'en suis très fière."
      ],
      shrine:[
        "Je viens ici avant les gros matchs ! Je tire un omamori et je cours trois fois autour du bâtiment. C'est mon rituel.",
        "Mon équipe est venue ici la veille de la finale. On a toutes fait sonner la cloche ensemble. On a gagné ! Coïncidence ?",
        "Les sanctuaires me calment. Bizarrement. Moi qui suis jamais calme. Ici je deviens presque… normale.",
        "Je fais un vœu pour que personne dans l'équipe ne se blesse. Et un pour moi. Le deuxième c'est plus compliqué à formuler."
      ],
      flirt:[
        "EHHH ?! (rouge tomate instantanément) Arrête ça me fait rire et rougir en même temps et c'est physiquement difficile !!",
        "Waaaah t'es trop direct ! C'est embarrassant ! (rit fort) Je veux dire — c'est pas faux mais c'est embarrassant !",
        "J'suis pas du genre à… je veux dire, avec moi c'est pas… enfin… (agite les mains) LAISSE TOMBER TU VOIS CE QUE JE VEUX DIRE"
      ],
      gift:[
        "OUAIIIS !! (saute sur place) C'est EXACTEMENT ce que je voulais !! Comment tu savais ?! (te serre dans ses bras avant que tu puisses répondre)",
        "T'es trop gentil !! Je t'adore !! (pause, réalise ce qu'elle vient de dire, rougit légèrement) Je veux dire — merci. Beaucoup.",
        "Personne m'offre des trucs d'habitude parce que je dis que j'ai besoin de rien. Mais en fait j'aime les cadeaux. (murmure) C'est notre secret."
      ],
      date:[
        "TROP COOL !! C'était le meilleur soir de ma… enfin du mois… enfin depuis très longtemps ! (trop enthousiaste)",
        "(en chemin pour rentrer, plus calme) Hey. Je voulais dire. Merci. Vraiment. (regard moins agité, plus sincère)",
        "On recommence ? La semaine prochaine ? Ou demain ? (trop vite) Demain c'est peut-être trop vite. La semaine prochaine. Non, demain."
      ],
      listen:[
        "…T'écoutes vraiment. (pause) Personne m'écoute d'habitude. Ils attendent juste que j'aie fini d'être enthousiaste.",
        "OK je vais te dire un truc que je dis jamais. Parfois je suis fatiguée. Genre vraiment fatiguée. Mais j'sais pas comment m'arrêter.",
        "Être capitaine c'est tout le temps penser aux autres. Toi t'es le premier à penser à moi. C'est bizarre. C'est bien.",
        "Tu m'écoutes courir, tu m'écoutes parler, tu m'écoutes me taire. C'est beaucoup pour quelqu'un."
      ]
    },

    events: {
      8:{
        chapter:'Chapitre I', title:'La Capitaine Vue de Près',
        subtitle:'Ce que les spectateurs ne voient jamais',
        scene:'Terrain de sport — après l\'entraînement',
        text:`L'entraînement était fini depuis quarante minutes. Tout le monde était parti.
        Nana était encore là — à ramasser les cônes, à rouler les filets, à vérifier les lacets d'une chaussure
        abandonnée dans un coin.
        Elle ne t'avait pas vu. Tu regardais depuis la tribun.
        Quand elle a fini et s'est retournée, elle t'a vu et a éclaté de rire.
        "T'aurais pu m'aider au lieu de mater !" Mais dans ses yeux, quelque chose de différent :
        elle était contente que quelqu'un ait vu.`,
        choices:[
          { t:"L'aider à porter le dernier filet",                            g:16, mood:'happy',  mem:"Tu l'as regardée rester après l'entraînement pour tout ranger. Elle n'oublie pas." },
          { t:"\"Tu fais ça à chaque fois ?\"",                                  g:20, mood:'happy',  mem:"Tu as vu Nana dans son rôle invisible de capitaine. Elle apprécie que tu remarques." }
        ]
      },
      20:{
        chapter:'Chapitre I', title:'Le Saut de Joie',
        subtitle:'La victoire qui te regarde',
        scene:'Terrain — finale de zone',
        text:`90ème minute. Score à égalité. Corner. Le ballon s'envole.
        Et Nana — une tête parfaite — 1-0.
        Le stade explose. Nana aussi.
        Elle a tourné sur elle-même, les bras écartés, en criant quelque chose vers le ciel.
        Puis ses yeux t'ont trouvé dans les tribunes. Et elle a couru vers toi —
        pas vers l'équipe, pas vers le coach. Vers toi.`,
        choices:[
          { t:"La soulever dans les airs en la rejoignant",                    g:22, mood:'happy',  mem:"Nana a marqué et a couru vers toi en premier. Tu l'as soulevée dans les airs." },
          { t:"Taper dans tes mains depuis les tribunes avec un grand sourire", g:16, mood:'happy',  mem:"Nana t'a cherché du regard après son but. Tu étais là." }
        ]
      },
      42:{
        chapter:'Chapitre II', title:'L\'Arrêt Forcé',
        subtitle:'Quand courir n\'est plus possible',
        scene:'Infirmerie — lendemain de blessure',
        text:`Entorse de la cheville — six semaines minimum.
        Nana était assise sur le lit d'infirmerie, jambe bandée, et pour la première fois depuis que tu la connais,
        elle ne bougeait pas. Elle fixait le sol.
        "Six semaines. Le tournoi régional c'est dans cinq."
        Un silence qui lui ressemblait si peu.
        "J'sais pas quoi faire de moi quand je cours pas. (voix plus basse) J'sais pas qui je suis."`,
        choices:[
          { t:"Rester assis là en silence, lui tenir compagnie",                g:30, mood:'happy',  mem:"Nana blessée. Tu es resté sans essayer de régler quoi que ce soit. Ça l'a aidée." },
          { t:"\"Tu es Nana. Avec ou sans les jambes.\"",                         g:35, mood:'happy',  mem:"Tu as dit à Nana qui elle était quand elle ne le savait plus." }
        ]
      },
      60:{
        chapter:'Chapitre II', title:'Le Défi du Silence',
        subtitle:'Nana immobile — et quelque chose de nouveau',
        scene:'Banc du parc — six semaines sans courir',
        text:`Six semaines sans entraînement. Nana était sur le banc, jambe surélevée,
        regardant les autres courir dans le parc.
        "Je croyais que si je m'arrêtais j'allais exploser. Mais là je suis juste… tranquille. C'est bizarre."
        Elle t'a regardé.
        "Tu m'as parlé pendant tout ce temps. T'es venu chaque jour. T'as même apporté des jeux vidéo.
        Mec — c'est toi qui m'as appris à m'arrêter."`,
        choices:[
          { t:"\"Et toi tu m'as appris à aller plus vite. On est quittes.\"",   g:28, mood:'happy',  mem:"Pendant la blessure de Nana, vous avez appris quelque chose l'un de l'autre." },
          { t:"Lui proposer de regarder son prochain match ensemble quand elle reviendra", g:32, mood:'happy', mem:"Tu as promis à Nana d'être là pour son retour. Elle a souri comme si tu ne comprendrais jamais combien." }
        ]
      },
      82:{
        chapter:'Chapitre III', title:'La Ligne d\'Arrivée',
        subtitle:'Ce n\'était pas la victoire qui comptait',
        scene:'Stade régional — coup de sifflet final',
        text:`Nana avait joué soixante-dix minutes avec une cheville encore fragile.
        Le coach avait voulu la sortir. Elle avait refusé — les yeux brillants, la mâchoire serrée.
        À la fin du match, victoire 2-1, au coup de sifflet final, Nana n'a pas crié.
        Elle s'est assise sur le gazon. Et elle a pleuré.
        Pas de douleur. De quelque chose d'autre.
        Tu as traversé le terrain pour la rejoindre. Elle a levé les yeux.
        "Je pensais que c'était la victoire que je voulais. Mais là je réalise que je voulais juste
        que tu sois dans les tribunes."`,
        choices:[
          { t:"S'asseoir dans l'herbe à côté d'elle sans rien dire",        g:42, mood:'happy',  mem:"Après la finale, Nana a pleuré dans l'herbe et tu étais là. Rien d'autre à ajouter." },
          { t:"\"J'étais là. J'y serai toujours.\"",                            g:38, mood:'happy',  mem:"Tu as dit à Nana que tu serais toujours là. Elle a incliné la tête sur ton épaule." }
        ]
      }
    }
  }

];

// ── STAGES & CONFIG ───────────────────────────────────────────
const STAGES = [
  { min:0,  label:'Inconnus',     color:'#555',    endText:'Vous étiez des étrangers. Peut-être que dans une autre vie…' },
  { min:12, label:'Connaissance', color:'#9b59f7',  endText:'Tu te souviens de son nom. Elle se souvient du tien. C\'est déjà quelque chose.' },
  { min:28, label:'Amis',        color:'#60a5fa',  endText:'Une amitié sincère est née. Elle sourit quand elle te voit.' },
  { min:48, label:'Proches',     color:'#ff80c0',  endText:'Il y a quelque chose entre vous. Vous le savez tous les deux.' },
  { min:68, label:'Crush',       color:'#ff3d9a',  endText:'Les sentiments sont là — évidents, tendres, encore fragiles.' },
  { min:85, label:'Amoureux·se', color:'#ffd700',  endText:'C\'est une histoire d\'amour. La vôtre. Elle durera.' },
];

const WORK_MSGS = [
  "Tu livres des courses pour la voisine du 3e. Elle t'offre des mochis maison.",
  "Serveur remplaçant au café du coin. Le temps passe vite quand on est occupé.",
  "Baby-sitting pour la famille Nakamura. Les jumeaux sont terrifiants mais adorables.",
  "Tu aides à peindre la clôture du jardin communautaire. Conversation avec un vieux monsieur sur le sens de la vie.",
  "Distributeur de flyers devant la gare. Un passant te laisse un billet en plus 'pour le courage'.",
  "Aide-soignant bénévole à la maison de retraite voisine. Tu joues au shogi avec Monsieur Tanaka.",
  "Photographe amateur pour le mariage du cousin de ta logeuse. Résultat : correct.",
];

const STUDY_MSGS = [
  "Tu révises la physique quantique. Ça donne le vertige mais aussi une étrange paix.",
  "Grammaire japonaise ancienne. Tu peux maintenant lire les inscriptions du sanctuaire.",
  "Tu t'entraînes à la calligraphie. Le troisième essai est presque présentable.",
  "Cours d'histoire de l'art en ligne. Tu comprends maintenant pourquoi Yuki aime certaines peintures.",
  "Révisions de chimie avec les notes de cours de Sakura que tu as garder. Sa handwriting est adorable.",
  "Tu apprends trois accords de guitare. Akira te regarderait souffrir.",
];

// ── STATE ─────────────────────────────────────────────────────
let G = {};
let chars = [];

function initState() {
  chars = JSON.parse(JSON.stringify(CHARS_DATA));
  G = {
    day:1, ap:3, money:2000,
    selId:null, location:'school',
    room:'classroom',
    weather: WEATHERS[0],
    seenEvents:{},
    workDone:false, studyDone:false,
    memories:[],
    typing:false,
    currentProfile: null,
    currentProfileTab: 'bio',
    charPresence:{},
    presenceMap:{},
  };
  chars.forEach(c=>{
    c.affection = Number.isFinite(c.affection) ? c.affection : 0;
    G.seenEvents[c.id]={};
  });
  if(!getRoomMeta(G.location, G.room)) G.room=defaultRoomForLocation(G.location);
}

// ── HELPERS ──────────────────────────────────────────────────
function getChar(id){ return chars.find(c=>c.id===id); }
function getStage(aff){ for(let i=STAGES.length-1;i>=0;i--) if(aff>=STAGES[i].min) return i; return 0; }
function rand(a,b){ return Math.floor(Math.random()*(b-a+1))+a; }
function hashSeed(seed){
  let h=2166136261;
  for(let i=0;i<seed.length;i++){
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h>>>0);
}
function pickDeterministic(list, seed){
  if(!list || !list.length) return null;
  return list[hashSeed(seed) % list.length];
}
function getTimeSlot(){
  if(G.ap>=3) return 'morning';
  if(G.ap===2) return 'afternoon';
  if(G.ap===1) return 'evening';
  return 'night';
}
function getRoomMeta(locationId, roomId){
  const rooms=LOCATION_ROOMS[locationId]||[];
  return rooms.find(r=>r.id===roomId)||null;
}
function defaultRoomForLocation(locationId){
  const rooms=LOCATION_ROOMS[locationId]||[];
  return rooms.length?rooms[0].id:null;
}
function getRoomName(locationId, roomId){
  const room=getRoomMeta(locationId, roomId);
  return room?room.name:'-';
}
function isCharacterInCurrentRoom(charId){
  const pos=G.charPresence?.[charId];
  return !!(pos && pos.location===G.location && pos.room===G.room);
}
function getLocationPoolForChar(c, slot){
  const pool=[...(SLOT_LOCATION_POOL[slot]||Object.keys(LOCATIONS))];
  pool.push(c.fav_loc, c.fav_loc);
  if(c.id==='sakura') pool.push('cafe','home','library');
  if(c.id==='akira') pool.push('rooftop','school','cafe');
  if(c.id==='yuki') pool.push('library','shrine','home');
  if(c.id==='nana') pool.push('park','school','beach');
  pool.push(...(WEATHER_LOCATION_BOOSTS[G.weather?.id]||[]));
  if(G.day%7===0) pool.push('shrine');
  if(G.day%5===0) pool.push('home');
  return pool.filter(loc=>LOCATIONS[loc]);
}
function buildPresenceReason(c, slot){
  const base=(CHARACTER_ACTIVITY_BY_SLOT[c.id]||{})[slot] || `${c.name.split(' ')[0]} profite du moment.`;
  if(G.weather?.id==='rain') return `${base} La pluie ralentit le rythme.`;
  if(G.weather?.id==='snow') return `${base} La neige rend le lieu plus calme.`;
  if(G.weather?.id==='cherry') return `${base} Les pétales attirent du monde.`;
  return base;
}
function resolveNpcPresence(){
  const slot=getTimeSlot();
  const nextMap={};
  const nextChars={};

  Object.keys(LOCATION_ROOMS).forEach(loc=>{
    nextMap[loc]={};
    (LOCATION_ROOMS[loc]||[]).forEach(room=>{ nextMap[loc][room.id]=[]; });
  });

  chars.forEach(c=>{
    const seed=`${c.id}|${G.day}|${slot}|${G.weather.id}`;
    const loc=pickDeterministic(getLocationPoolForChar(c, slot), seed+'|loc') || c.fav_loc;
    const rooms=LOCATION_ROOMS[loc]||[];
    const roomMeta=pickDeterministic(rooms, seed+'|room') || rooms[0];
    const roomId=roomMeta?roomMeta.id:defaultRoomForLocation(loc);
    nextChars[c.id]={ location:loc, room:roomId, reason:buildPresenceReason(c, slot), slot };
    if(nextMap[loc] && nextMap[loc][roomId]) nextMap[loc][roomId].push(c.id);
  });

  G.charPresence=nextChars;
  G.presenceMap=nextMap;
  if(!getRoomMeta(G.location, G.room)) G.room=defaultRoomForLocation(G.location);
}
function syncPresenceAfterTimeChange(previousSlot){
  if(previousSlot!==getTimeSlot()) resolveNpcPresence();
}

function showNotif(msg, color='var(--pink)'){
  const el=document.getElementById('notif');
  el.textContent=msg; el.style.borderColor=color; el.style.color=color;
  el.classList.add('show'); clearTimeout(el._t);
  el._t=setTimeout(()=>el.classList.remove('show'),2600);
}

function addMemory(text){
  const day=G.day;
  G.memories.unshift({ day, text });
  if(G.memories.length>20) G.memories.pop();
  renderMemories();
}

function showScreen(id){
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

// ── PARTICULES ───────────────────────────────────────────────
function spawnParticles(){
  const cont=document.getElementById('particles');
  const syms=['🌸','✿','❀','🌺','💮','·'];
  for(let i=0;i<25;i++){
    const p=document.createElement('div');
    p.className='petal';
    p.textContent=syms[Math.floor(Math.random()*syms.length)];
    p.style.left=Math.random()*100+'vw';
    p.style.animationDuration=(8+Math.random()*12)+'s';
    p.style.animationDelay=(-Math.random()*15)+'s';
    p.style.fontSize=(9+Math.random()*10)+'px';
    p.style.opacity=(0.4+Math.random()*0.5).toString();
    cont.appendChild(p);
  }
}

// ── SPRITES SVG ───────────────────────────────────────────────
function buildSprite(charId, w=160, mood='neutral'){
  const c=getChar(charId); if(!c) return '';
  const h=Math.round(w*1.55);
  const happy=mood==='happy', blush=mood==='blush'||mood==='happy';

  const sprites={
    sakura:`<svg width="${w}" height="${h}" viewBox="0 0 100 155" xmlns="http://www.w3.org/2000/svg">
      <!-- HAIR BACK -->
      <ellipse cx="50" cy="43" rx="30" ry="32" fill="#ff80a0"/>
      <path d="M20 43 Q14 85 17 106 Q22 100 27 94 Q25 70 26 54Z" fill="#ff80a0"/>
      <path d="M80 43 Q86 85 83 106 Q78 100 73 94 Q75 70 74 54Z" fill="#ff80a0"/>
      <!-- BANGS -->
      <path d="M33 20 Q50 6 67 20 Q70 32 50 29 Q30 32 33 20Z" fill="#ff6090"/>
      <path d="M27 26 Q24 16 30 14 Q28 22 29 28Z" fill="#ff6090"/>
      <path d="M73 26 Q76 16 70 14 Q72 22 71 28Z" fill="#ff6090"/>
      <!-- BODY — Uniform -->
      <rect x="33" y="84" width="34" height="46" rx="5" fill="white"/>
      <!-- Collar -->
      <path d="M34 84 Q50 92 66 84 L66 93 Q50 101 34 93Z" fill="#ff80a0"/>
      <path d="M43 84 L50 97 L57 84" fill="none" stroke="#ff60a0" stroke-width="1.8"/>
      <!-- Arms -->
      <ellipse cx="26" cy="102" rx="7" ry="23" fill="white" transform="rotate(-9 26 102)"/>
      <ellipse cx="74" cy="102" rx="7" ry="23" fill="white" transform="rotate(9 74 102)"/>
      <!-- Cuffs -->
      <ellipse cx="22" cy="122" rx="7" ry="5" fill="#ff80a0" transform="rotate(-9 22 122)"/>
      <ellipse cx="78" cy="122" rx="7" ry="5" fill="#ff80a0" transform="rotate(9 78 122)"/>
      <!-- Skirt -->
      <path d="M33 130 Q50 138 67 130 L70 153 Q50 160 30 153Z" fill="#ffb0d0"/>
      <path d="M33 130 Q50 136 67 130 L67 134 Q50 140 33 134Z" fill="#ff90c0"/>
      <!-- Legs -->
      <rect x="37" y="153" width="11" height="18" rx="5" fill="#ffe0e8"/>
      <rect x="52" y="153" width="11" height="18" rx="5" fill="#ffe0e8"/>
      <!-- Shoes -->
      <ellipse cx="42" cy="171" rx="9" ry="5" fill="#cc3366"/>
      <ellipse cx="58" cy="171" rx="9" ry="5" fill="#cc3366"/>
      <!-- FACE -->
      <ellipse cx="50" cy="57" rx="21" ry="22" fill="#ffe0e8"/>
      <!-- Eyes whites -->
      <ellipse cx="41" cy="53" rx="5.5" ry="6.5" fill="white"/>
      <ellipse cx="59" cy="53" rx="5.5" ry="6.5" fill="white"/>
      <!-- Iris -->
      <ellipse cx="41" cy="54" rx="4" ry="5" fill="#cc3388"/>
      <ellipse cx="59" cy="54" rx="4" ry="5" fill="#cc3388"/>
      <!-- Pupil -->
      <ellipse cx="41" cy="55" rx="2.2" ry="3" fill="#880044"/>
      <ellipse cx="59" cy="55" rx="2.2" ry="3" fill="#880044"/>
      <!-- Shine -->
      <circle cx="39.5" cy="52" r="1.4" fill="white"/>
      <circle cx="57.5" cy="52" r="1.4" fill="white"/>
      <!-- Eyelashes top -->
      <path d="M36 48 L34 44 M40 47 L39 43 M44 47 L44 43" stroke="#cc3388" stroke-width="1.2" fill="none" stroke-linecap="round"/>
      <path d="M64 48 L66 44 M60 47 L61 43 M56 47 L56 43" stroke="#cc3388" stroke-width="1.2" fill="none" stroke-linecap="round"/>
      <!-- Blush -->
      ${blush?'<ellipse cx="35" cy="60" rx="5.5" ry="3" fill="rgba(255,100,150,.42)"/><ellipse cx="65" cy="60" rx="5.5" ry="3" fill="rgba(255,100,150,.42)"/>':''}
      <!-- Mouth -->
      ${happy?'<path d="M44 65 Q50 72 56 65" fill="none" stroke="#cc3366" stroke-width="2" stroke-linecap="round"/><circle cx="44" cy="65" r="1.2" fill="#cc3366"/><circle cx="56" cy="65" r="1.2" fill="#cc3366"/>'
             :'<path d="M46 66 Q50 68 54 66" fill="none" stroke="#cc3366" stroke-width="1.8" stroke-linecap="round"/>'}
      <!-- Accessories -->
      <circle cx="29" cy="32" r="5.5" fill="#ff3399"/>
      <circle cx="29" cy="32" r="2.5" fill="white"/>
      <circle cx="71" cy="32" r="5.5" fill="#ff3399"/>
      <circle cx="71" cy="32" r="2.5" fill="white"/>
      <!-- Ribbon top -->
      <path d="M47 16 Q50 10 53 16 Q50 20 47 16Z" fill="#ff3399"/>
    </svg>`,

    akira:`<svg width="${w}" height="${h}" viewBox="0 0 100 155" xmlns="http://www.w3.org/2000/svg">
      <!-- SPIKY HAIR -->
      <path d="M20 42 Q18 18 30 13 Q50 6 70 13 Q82 18 80 42 Q78 58 50 60 Q22 58 20 42Z" fill="#3070cc"/>
      <path d="M23 28 L17 12 L32 20Z" fill="#4080dd"/>
      <path d="M37 18 L35 5  L44 16Z" fill="#4080dd"/>
      <path d="M52 17 L54 4  L61 16Z" fill="#4080dd"/>
      <path d="M68 22 L77 9  L70 22Z" fill="#4080dd"/>
      <path d="M78 36 L88 22 L79 36Z" fill="#4080dd"/>
      <!-- Side strands -->
      <path d="M20 42 Q14 60 16 80 Q20 75 24 68 Q21 55 22 43Z" fill="#3070cc"/>
      <path d="M80 42 Q86 60 84 80 Q80 75 76 68 Q79 55 78 43Z" fill="#3070cc"/>
      <!-- UNIFORM — Dark -->
      <rect x="33" y="84" width="34" height="46" rx="4" fill="#1a3a6a"/>
      <path d="M34 84 Q50 90 66 84 L66 92 Q50 98 34 92Z" fill="#2a4a8a"/>
      <!-- Jacket lapels -->
      <path d="M43 84 L50 95 L57 84" fill="none" stroke="#60a0ff" stroke-width="2"/>
      <!-- Arms -->
      <ellipse cx="26" cy="100" rx="7" ry="23" fill="#1a3a6a" transform="rotate(-8 26 100)"/>
      <ellipse cx="74" cy="100" rx="7" ry="23" fill="#1a3a6a" transform="rotate(8 74 100)"/>
      <!-- Pants -->
      <path d="M33 130 Q50 136 67 130 L69 153 Q50 160 31 153Z" fill="#0d2255"/>
      <rect x="36" y="153" width="11" height="17" rx="5" fill="#ffe0e8"/>
      <rect x="53" y="153" width="11" height="17" rx="5" fill="#ffe0e8"/>
      <ellipse cx="41" cy="170" rx="9" ry="5" fill="#1a3a7a"/>
      <ellipse cx="59" cy="170" rx="9" ry="5" fill="#1a3a7a"/>
      <!-- FACE -->
      <ellipse cx="50" cy="57" rx="21" ry="22" fill="#ffe0e8"/>
      <!-- Eyes -->
      <ellipse cx="41" cy="53" rx="5.5" ry="6.5" fill="white"/>
      <ellipse cx="59" cy="53" rx="5.5" ry="6.5" fill="white"/>
      <ellipse cx="41" cy="54" rx="4" ry="5" fill="#1a60cc"/>
      <ellipse cx="59" cy="54" rx="4" ry="5" fill="#1a60cc"/>
      <ellipse cx="41" cy="55" rx="2.2" ry="3" fill="#0a3088"/>
      <ellipse cx="59" cy="55" rx="2.2" ry="3" fill="#0a3088"/>
      <circle cx="39.5" cy="52" r="1.4" fill="white"/>
      <circle cx="57.5" cy="52" r="1.4" fill="white"/>
      ${blush?'<ellipse cx="35" cy="60" rx="5.5" ry="3" fill="rgba(255,100,120,.42)"/><ellipse cx="65" cy="60" rx="5.5" ry="3" fill="rgba(255,100,120,.42)"/>':''}
      ${happy?'<path d="M44 65 Q50 71 56 65" fill="none" stroke="#1a60cc" stroke-width="2" stroke-linecap="round"/>'
             :'<path d="M46 63 Q50 61 54 63" fill="none" stroke="#1a60cc" stroke-width="1.8" stroke-linecap="round"/>'}
      <!-- Eyebrows — sharper -->
      <path d="M36 47 L46 45" stroke="#1a3a7a" stroke-width="2" stroke-linecap="round"/>
      <path d="M54 45 L64 47" stroke="#1a3a7a" stroke-width="2" stroke-linecap="round"/>
    </svg>`,

    yuki:`<svg width="${w}" height="${h}" viewBox="0 0 100 155" xmlns="http://www.w3.org/2000/svg">
      <!-- LONG STRAIGHT HAIR -->
      <rect x="20" y="38" width="10" height="80" rx="5" fill="#7030b0"/>
      <rect x="70" y="38" width="10" height="80" rx="5" fill="#7030b0"/>
      <path d="M20 48 Q18 28 50 18 Q82 28 80 48 Q78 64 50 67 Q22 64 20 48Z" fill="#8040c0"/>
      <!-- Bangs straight -->
      <path d="M32 34 Q50 26 68 34 Q66 42 50 40 Q34 42 32 34Z" fill="#6020a8"/>
      <path d="M22 44 Q20 32 28 28 Q26 36 25 44Z" fill="#7030b0"/>
      <path d="M78 44 Q80 32 72 28 Q74 36 75 44Z" fill="#7030b0"/>
      <!-- ELEGANT UNIFORM -->
      <rect x="33" y="84" width="34" height="46" rx="4" fill="#200840"/>
      <path d="M34 84 Q50 91 66 84 L66 92 Q50 99 34 92Z" fill="#3a1060"/>
      <!-- Decorative ribbon -->
      <path d="M46 88 Q50 84 54 88 Q50 92 46 88Z" fill="#c080ff"/>
      <!-- Arms -->
      <ellipse cx="26" cy="101" rx="7" ry="23" fill="#200840" transform="rotate(-7 26 101)"/>
      <ellipse cx="74" cy="101" rx="7" ry="23" fill="#200840" transform="rotate(7 74 101)"/>
      <!-- Skirt long -->
      <path d="M33 130 Q50 138 67 130 L70 155 Q50 162 30 155Z" fill="#12042a"/>
      <rect x="36" y="155" width="11" height="16" rx="5" fill="#ffe0f8"/>
      <rect x="53" y="155" width="11" height="16" rx="5" fill="#ffe0f8"/>
      <ellipse cx="41" cy="171" rx="9" ry="5" fill="#300870"/>
      <ellipse cx="59" cy="171" rx="9" ry="5" fill="#300870"/>
      <!-- FACE -->
      <ellipse cx="50" cy="58" rx="21" ry="22" fill="#f0e0f8"/>
      <!-- Eyes — large, mysterious -->
      <ellipse cx="41" cy="53" rx="6" ry="7" fill="white"/>
      <ellipse cx="59" cy="53" rx="6" ry="7" fill="white"/>
      <ellipse cx="41" cy="54" rx="4.5" ry="5.5" fill="#5010a0"/>
      <ellipse cx="59" cy="54" rx="4.5" ry="5.5" fill="#5010a0"/>
      <ellipse cx="41" cy="55" rx="2.8" ry="3.5" fill="#2a0060"/>
      <ellipse cx="59" cy="55" rx="2.8" ry="3.5" fill="#2a0060"/>
      <circle cx="39.5" cy="51.5" r="1.6" fill="white"/>
      <circle cx="57.5" cy="51.5" r="1.6" fill="white"/>
      <!-- Long eyelashes -->
      <path d="M35 47 L32 43 M39 46 L38 42 M43 46 L43 42" stroke="#5010a0" stroke-width="1.3" fill="none" stroke-linecap="round"/>
      <path d="M65 47 L68 43 M61 46 L62 42 M57 46 L57 42" stroke="#5010a0" stroke-width="1.3" fill="none" stroke-linecap="round"/>
      ${blush?'<ellipse cx="35" cy="61" rx="5.5" ry="3" fill="rgba(180,80,240,.3)"/><ellipse cx="65" cy="61" rx="5.5" ry="3" fill="rgba(180,80,240,.3)"/>':''}
      ${happy?'<path d="M45 66 Q50 72 55 66" fill="none" stroke="#5010a0" stroke-width="2" stroke-linecap="round"/>'
             :'<path d="M47 66 Q50 65 53 66" fill="none" stroke="#5010a0" stroke-width="1.6" stroke-linecap="round"/>'}
      <!-- Eyebrows refined -->
      <path d="M36 46 Q41 43 46 45" stroke="#4010a0" stroke-width="1.5" fill="none" stroke-linecap="round"/>
      <path d="M54 45 Q59 43 64 46" stroke="#4010a0" stroke-width="1.5" fill="none" stroke-linecap="round"/>
    </svg>`,

    nana:`<svg width="${w}" height="${h}" viewBox="0 0 100 155" xmlns="http://www.w3.org/2000/svg">
      <!-- MESSY PONYTAIL HAIR -->
      <path d="M22 46 Q20 22 50 15 Q80 22 78 46 Q76 62 50 64 Q24 62 22 46Z" fill="#e08020"/>
      <!-- Ponytail right -->
      <path d="M76 38 Q90 35 88 55 Q85 70 78 72 Q82 55 80 40Z" fill="#e08020"/>
      <!-- Messy strands -->
      <path d="M26 26 L20 14 L30 22Z" fill="#f09030"/>
      <path d="M40 19 L38 7  L46 17Z" fill="#f09030"/>
      <path d="M55 18 L57 5  L63 17Z" fill="#f09030"/>
      <path d="M70 24 L79 12 L71 24Z" fill="#f09030"/>
      <!-- SPORTY UNIFORM -->
      <rect x="33" y="84" width="34" height="46" rx="4" fill="#cc5500"/>
      <path d="M34 84 Q50 90 66 84 L66 92 Q50 98 34 92Z" fill="#dd6600"/>
      <!-- Team number -->
      <text x="50" y="113" font-size="12" font-weight="bold" fill="rgba(255,255,255,.4)" text-anchor="middle" font-family="Arial">7</text>
      <!-- Arms -->
      <ellipse cx="26" cy="100" rx="7" ry="23" fill="#cc5500" transform="rotate(-9 26 100)"/>
      <ellipse cx="74" cy="100" rx="7" ry="23" fill="#cc5500" transform="rotate(9 74 100)"/>
      <!-- Shorts -->
      <path d="M33 130 Q50 136 67 130 L68 148 Q50 155 32 148Z" fill="#aa3300"/>
      <rect x="35" y="148" width="12" height="19" rx="5" fill="#ffe0d0"/>
      <rect x="53" y="148" width="12" height="19" rx="5" fill="#ffe0d0"/>
      <!-- Sneakers -->
      <ellipse cx="41" cy="167" rx="10" ry="5" fill="#aa2200"/>
      <ellipse cx="59" cy="167" rx="10" ry="5" fill="#aa2200"/>
      <!-- FACE — Energetic -->
      <ellipse cx="50" cy="57" rx="21" ry="22" fill="#ffe8c8"/>
      <ellipse cx="41" cy="53" rx="5.5" ry="6" fill="white"/>
      <ellipse cx="59" cy="53" rx="5.5" ry="6" fill="white"/>
      <ellipse cx="41" cy="54" rx="3.8" ry="4.5" fill="#cc4400"/>
      <ellipse cx="59" cy="54" rx="3.8" ry="4.5" fill="#cc4400"/>
      <ellipse cx="41" cy="55" rx="2.2" ry="2.8" fill="#880000"/>
      <ellipse cx="59" cy="55" rx="2.2" ry="2.8" fill="#880000"/>
      <circle cx="39.5" cy="52" r="1.4" fill="white"/>
      <circle cx="57.5" cy="52" r="1.4" fill="white"/>
      <!-- Big blush always -->
      <ellipse cx="35" cy="61" rx="6" ry="3.5" fill="rgba(255,120,60,.5)"/>
      <ellipse cx="65" cy="61" rx="6" ry="3.5" fill="rgba(255,120,60,.5)"/>
      ${happy?'<path d="M42 66 Q50 74 58 66" fill="none" stroke="#cc4400" stroke-width="2.5" stroke-linecap="round"/><circle cx="42" cy="66" r="1.5" fill="#cc4400"/><circle cx="58" cy="66" r="1.5" fill="#cc4400"/>'
             :'<path d="M44 67 Q50 71 56 67" fill="none" stroke="#cc4400" stroke-width="2" stroke-linecap="round"/>'}
      <!-- Energetic eyebrows -->
      <path d="M36 46 Q41 42 46 44" stroke="#aa3300" stroke-width="2.2" fill="none" stroke-linecap="round"/>
      <path d="M54 44 Q59 42 64 46" stroke="#aa3300" stroke-width="2.2" fill="none" stroke-linecap="round"/>
      <!-- Hair band -->
      <ellipse cx="86" cy="42" rx="5" ry="4" fill="#ff4400" transform="rotate(-30 86 42)"/>
    </svg>`
  };
  return sprites[charId]||'';
}

// ── BACKGROUNDS ───────────────────────────────────────────────
function setBackgroundLayers(locId){
  const loc=LOCATIONS[locId];
  const bg=loc.bgClass;
  const els=['sky','far','mid','near','overlay'];
  els.forEach(layer=>{
    const el=document.getElementById('bg-'+layer);
    el.className='bg-layer'; // reset
    el.className=`bg-layer bg-${bg}-${layer}`;
  });
  // time overlay
  const to=document.getElementById('time-overlay');
  to.className='time-overlay time-'+loc.timeOfDay;
}

// ── MÉTÉO ─────────────────────────────────────────────────────
function randomizeWeather(){
  const pool=[...WEATHERS,...WEATHERS.slice(0,2)]; // sunny biais
  G.weather=pool[Math.floor(Math.random()*pool.length)];
  renderWeather();
}

function renderWeather(){
  const w=G.weather;
  document.getElementById('weather-icon').textContent=w.icon;
  document.getElementById('weather-label').textContent=w.label;
  const layer=document.getElementById('weather-layer');
  layer.innerHTML='';
  if(w.id==='rain'){
    for(let i=0;i<40;i++){
      const d=document.createElement('div');
      d.className='rain-drop';
      d.style.left=Math.random()*100+'vw';
      d.style.height=(15+Math.random()*25)+'px';
      d.style.top='-30px';
      d.style.animationDuration=(0.6+Math.random()*0.5)+'s';
      d.style.animationDelay=(-Math.random()*2)+'s';
      layer.appendChild(d);
    }
  }else if(w.id==='snow'){
    for(let i=0;i<30;i++){
      const d=document.createElement('div');
      d.className='snow-flake';
      d.textContent='❄';
      d.style.left=Math.random()*100+'vw';
      d.style.fontSize=(8+Math.random()*10)+'px';
      d.style.animationDuration=(4+Math.random()*5)+'s';
      d.style.animationDelay=(-Math.random()*6)+'s';
      layer.appendChild(d);
    }
  }else if(w.id==='cherry'){
    for(let i=0;i<20;i++){
      const p=document.createElement('div');
      p.className='petal snow-flake';
      p.textContent='🌸';
      p.style.left=Math.random()*100+'vw';
      p.style.fontSize=(10+Math.random()*8)+'px';
      p.style.animationDuration=(5+Math.random()*6)+'s';
      p.style.animationDelay=(-Math.random()*8)+'s';
      layer.appendChild(p);
    }
  }
}

// ── DIALOGUE ─────────────────────────────────────────────────
let _typeTimer=null;
function typeText(speaker, text, color='var(--text)', arcTag=''){
  clearInterval(_typeTimer);
  const sw=document.getElementById('dlg-speaker');
  const tw=document.getElementById('dlg-text');
  const dot=document.getElementById('dlg-dot');
  const arcEl=document.getElementById('dlg-arc-tag');
  sw.textContent=speaker;
  sw.style.color=color;
  dot.style.background=color;
  arcEl.style.display=arcTag?'block':'none';
  arcEl.textContent=arcTag;
  tw.innerHTML='';
  let i=0;
  _typeTimer=setInterval(()=>{
    if(i<text.length){ tw.innerHTML+=text[i++]!=='<'?text[i-1]:''; i=text.length; tw.textContent=text; }
    else{ clearInterval(_typeTimer); }
  },20);
  tw.textContent=''; // clear
  let j=0;
  _typeTimer=setInterval(()=>{
    if(j<text.length){ tw.textContent+=text[j++]; }
    else clearInterval(_typeTimer);
  },18);
}

function narratorSay(text){ typeText('Narrateur',text,'rgba(200,180,255,.9)'); }

// ── RENDER ────────────────────────────────────────────────────
function renderHUD(){
  document.getElementById('hud-day').textContent=G.day;
  document.getElementById('hud-money').textContent=G.money;
  // AP
  const dots=document.getElementById('hud-ap-dots');
  dots.innerHTML='';
  for(let i=0;i<3;i++){
    const d=document.createElement('span');
    d.className='ap-dot'+(i>=G.ap?' empty':'');
    dots.appendChild(d);
  }
  // Lieu
  const loc=LOCATIONS[G.location];
  document.getElementById('hud-loc-badge').textContent=loc.icon+' '+loc.name;
  const room=getRoomMeta(G.location, G.room);
  document.getElementById('hud-room-badge').textContent=room?`Pièce: ${room.name}`:'Pièce: -';
  // Char
  const c=G.selId?getChar(G.selId):null;
  if(c){
    document.getElementById('hud-char-name').textContent=c.emoji+' '+c.name;
    const mini=document.getElementById('hud-aff-mini');
    mini.style.display='flex';
    const stg=getStage(c.affection);
    document.getElementById('hud-aff-fill').style.cssText=`width:${c.affection}%;background:linear-gradient(90deg,${c.accent},${c.color})`;
    document.getElementById('hud-stage-label').textContent=STAGES[stg].label;
    document.getElementById('hud-stage-label').style.color=STAGES[stg].color;
    // Arc
    const currentArc=getCurrentArc(c);
    const arcBadge=document.getElementById('hud-arc-badge');
    if(currentArc){ arcBadge.textContent='✦ '+currentArc.name; arcBadge.style.display=''; }
    else arcBadge.style.display='none';
  } else {
    document.getElementById('hud-char-name').textContent='— Sélectionne un personnage —';
    document.getElementById('hud-aff-mini').style.display='none';
    document.getElementById('hud-arc-badge').style.display='none';
  }
}

function getCurrentArc(c){
  if(!c||!c.arcs) return null;
  const done=c.arcs.filter(a=>c.affection>=a.threshold);
  return done.length>0?done[done.length-1]:null;
}

function renderChars(){
  const list=document.getElementById('chars-list');
  list.innerHTML='';
  chars.forEach(c=>{
    const stg=getStage(c.affection);
    const pct=Math.round(c.affection);
    const arc=getCurrentArc(c);
    const hasNew=Object.values(G.seenEvents[c.id]||{}).some(v=>v===false);
    const pos=G.charPresence?.[c.id];
    const sameLoc=!!(pos && pos.location===G.location);
    const sameRoom=!!(sameLoc && pos.room===G.room);
    const whereText = !pos
      ? 'Position inconnue'
      : sameRoom
        ? 'Ici'
        : sameLoc
          ? `Dans ${getRoomName(pos.location, pos.room)}`
          : `${LOCATIONS[pos.location].icon} ${LOCATIONS[pos.location].name}`;
    const presenceClass = sameRoom ? ' here' : sameLoc ? ' near' : ' away';
    const div=document.createElement('div');
    div.className='char-card'+(c.id===G.selId?' active':'')+presenceClass;
    div.style.setProperty('--char-color',c.color);
    div.style.borderTopColor=c.color;
    div.style.borderTopWidth='2px';
    div.style.borderTopStyle='solid';
    div.onclick=()=>selectChar(c.id);
    div.innerHTML=`
      ${hasNew?'<div class="new-badge">NOUVEAU</div>':''}
      <div class="char-mini">${buildSprite(c.id,72)}</div>
      <div class="char-card-name" style="color:${c.color}">${c.emoji} ${c.name}</div>
      <div class="char-card-type">${c.archetype}</div>
      <div class="aff-row"><span>Affection</span><span>${pct}/100</span></div>
      <div class="aff-bar"><div class="aff-fill" style="width:${pct}%;background:linear-gradient(90deg,${c.accent},${c.color})"></div></div>
      <div class="char-stage-label" style="color:${STAGES[stg].color}">${STAGES[stg].label}</div>
      <div class="char-presence">${whereText}</div>
      ${arc?`<div class="char-arc-tag">✦ ${arc.name}</div>`:''}
    `;
    list.appendChild(div);
  });
}

function renderScene(){
  setBackgroundLayers(G.location);
  const loc=LOCATIONS[G.location];
  document.getElementById('loc-icon').textContent=loc.icon;
  document.getElementById('loc-name').textContent=loc.label;
  const sw=document.getElementById('sprite-wrap');
  const sh=document.getElementById('char-shadow');
  const selectedPresent=G.selId && isCharacterInCurrentRoom(G.selId);
  if(selectedPresent){
    sw.innerHTML=buildSprite(G.selId,165);
    sh.style.display='block';
    sw.classList.remove('float');
    void sw.offsetWidth;
    sw.classList.add('float');
  } else {
    sw.innerHTML=''; sh.style.display='none';
  }
}

function renderActions(){
  const sel=!!G.selId;
  const selectedPresent=sel && isCharacterInCurrentRoom(G.selId);
  document.getElementById('btn-talk').disabled=   !selectedPresent||G.ap<=0;
  document.getElementById('btn-listen').disabled= !selectedPresent||G.ap<=0;
  document.getElementById('btn-flirt').disabled=  !selectedPresent||G.ap<=0;
  document.getElementById('btn-gift').disabled=   !selectedPresent||G.money<300;
  document.getElementById('btn-date').disabled=   !selectedPresent||G.money<600;
  document.getElementById('btn-profile').disabled=!sel;
  document.getElementById('btn-work').disabled=   G.ap<=0||G.workDone;
  document.getElementById('btn-study').disabled=  G.ap<=0||G.studyDone;
  Object.keys(LOCATIONS).forEach(k=>{
    const b=document.getElementById('loc-'+k);
    if(b) b.className='loc-btn'+(G.location===k?' active':'');
  });
  // Confess button
  const confBtn=document.getElementById('btn-confess');
  if(G.selId){
    const c=getChar(G.selId);
    if(c.affection>=90){ confBtn.style.display='flex'; confBtn.disabled=!selectedPresent||G.ap<=0; }
    else confBtn.style.display='none';
  } else confBtn.style.display='none';
}

function renderRooms(){
  const list=document.getElementById('room-list');
  if(!list) return;
  const rooms=LOCATION_ROOMS[G.location]||[];
  const map=(G.presenceMap&&G.presenceMap[G.location])||{};
  list.innerHTML='';

  if(!rooms.length){
    list.innerHTML='<div class="presence-empty">Aucune pièce disponible.</div>';
    return;
  }

  rooms.forEach(room=>{
    const occupants=(map[room.id]||[]).length;
    const btn=document.createElement('button');
    btn.className='room-btn'+(room.id===G.room?' active':'');
    btn.innerHTML=`<span>${room.name}</span><span class="room-count">${occupants}</span>`;
    btn.onclick=()=>setRoom(room.id);
    list.appendChild(btn);
  });
}

function renderPresence(){
  const list=document.getElementById('presence-list');
  if(!list) return;
  const map=(G.presenceMap&&G.presenceMap[G.location])||{};
  const ids=(map[G.room]||[]);
  list.innerHTML='';

  if(!ids.length){
    list.innerHTML=`<div class="presence-empty">Aucun PNJ dans cette pièce (${SLOT_LABELS[getTimeSlot()]}).</div>`;
  } else {
    ids.forEach(id=>{
      const c=getChar(id);
      const pos=G.charPresence[id];
      if(!c||!pos) return;
      const item=document.createElement('button');
      item.className='presence-item'+(G.selId===id?' active':'');
      item.innerHTML=`
        <div class="presence-top">
          <span class="presence-name" style="color:${c.color}">${c.emoji} ${c.name.split(' ')[0]}</span>
          <span class="presence-chip">${SLOT_LABELS[pos.slot]}</span>
        </div>
        <div class="presence-note">${pos.reason}</div>
      `;
      item.onclick=()=>selectChar(id);
      list.appendChild(item);
    });
  }

  if(G.selId && !isCharacterInCurrentRoom(G.selId)){
    const c=getChar(G.selId);
    const pos=G.charPresence[G.selId];
    if(c&&pos){
      const hint=document.createElement('div');
      hint.className='presence-hint';
      hint.innerHTML=`${c.emoji} ${c.name.split(' ')[0]} est à ${LOCATIONS[pos.location].name}, ${getRoomName(pos.location,pos.room)}.`;
      list.appendChild(hint);
    }
  }
}

function renderMemories(){
  const log=document.getElementById('memory-log');
  if(!log) return;
  if(G.memories.length===0){
    log.innerHTML='<div class="memory-item muted">Aucun souvenir encore…</div>';
    return;
  }
  log.innerHTML=G.memories.slice(0,8).map(m=>
    `<div class="memory-item"><span style="opacity:.5;font-size:.6rem">Jour ${m.day} — </span>${m.text}</div>`
  ).join('');
}

function renderAll(){ renderHUD(); renderChars(); renderScene(); renderActions(); renderRooms(); renderPresence(); renderMemories(); }

// ── SÉLECTION PERSONNAGE ─────────────────────────────────────
function selectChar(id){
  G.selId=id;
  const c=getChar(id);
  const pos=G.charPresence[id];

  if(pos && pos.location===G.location && pos.room!==G.room){
    G.room=pos.room;
    showNotif(`Tu rejoins ${c.name.split(' ')[0]} dans ${getRoomName(pos.location,pos.room)}.`,'var(--blue)');
  }

  renderAll();

  if(!pos){
    narratorSay(`${c.name.split(' ')[0]} est introuvable pour le moment.`);
    return;
  }

  if(pos.location!==G.location){
    narratorSay(`${c.name.split(' ')[0]} n'est pas ici. Elle est à ${LOCATIONS[pos.location].name}, ${getRoomName(pos.location,pos.room)}.`);
    return;
  }

  if(pos.room!==G.room){
    narratorSay(`${c.name.split(' ')[0]} est dans ${getRoomName(pos.location,pos.room)}.`);
    return;
  }

  const dlgs=c.dialogues[G.location]||c.dialogues.school||[];
  const line=dlgs[Math.floor(Math.random()*dlgs.length)]||'...';
  typeText(c.name, line, c.color);
  setTimeout(()=>checkEvents(id),400);
}

// ── GAIN AFFECTION ────────────────────────────────────────────
function gainAffection(id, base){
  const c=getChar(id);
  const weather=G.weather.bonus||0;
  const locBonus=(G.location===c.fav_loc && isCharacterInCurrentRoom(id))?3:0;
  const total=base+weather+locBonus;
  const oldStage=getStage(c.affection);
  c.affection=Math.min(100,c.affection+total);
  const newStage=getStage(c.affection);
  if(newStage>oldStage){
    showNotif(`💕 ${c.name} : ${STAGES[newStage].label} !`,c.color);
    addMemory(`Relation avec ${c.name} : "${STAGES[newStage].label}"`);
  }
}

function spendAP(n=1){ G.ap=Math.max(0,G.ap-n); }

// ── ACTIONS ──────────────────────────────────────────────────
function doAction(type){
  const c=getChar(G.selId); if(!c) return;
  if(!isCharacterInCurrentRoom(c.id)){
    const pos=G.charPresence[c.id];
    if(pos) showNotif(`${c.emoji} ${c.name.split(' ')[0]} est dans ${getRoomName(pos.location,pos.room)}.`,'var(--blue)');
    else showNotif(`${c.emoji} ${c.name.split(' ')[0]} n'est pas disponible.`,'var(--blue)');
    return;
  }

  const previousSlot=getTimeSlot();

  switch(type){
    case 'talk':{
      if(G.ap<=0) return; spendAP();
      const line=c.dialogues[G.location][Math.floor(Math.random()*c.dialogues[G.location].length)];
      typeText(c.name,line,c.color);
      gainAffection(c.id,4);
      showEmotion('💬',1500);
      break;
    }
    case 'listen':{
      if(G.ap<=0) return; spendAP();
      const lines=c.dialogues.listen||c.dialogues[G.location];
      const line=lines[Math.floor(Math.random()*lines.length)];
      typeText(c.name,line,c.color);
      gainAffection(c.id,6);
      showEmotion('💭',1500);
      showNotif(`👂 ${c.name} apprécie que tu écoutes…`,'var(--blue)');
      break;
    }
    case 'flirt':{
      if(G.ap<=0) return; spendAP();
      const fl=c.dialogues.flirt;
      const line=fl[Math.floor(Math.random()*fl.length)];
      typeText(c.name,line,c.color);
      const p=c.personality;
      const gain=p==='shy'?6:p==='tsundere'?3:p==='cool'?5:8;
      gainAffection(c.id,gain);
      showEmotion('💕',2000);
      break;
    }
    case 'gift':{
      if(G.money<300) return; G.money-=300;
      const gl=c.dialogues.gift;
      typeText(c.name,gl[Math.floor(Math.random()*gl.length)],c.color);
      const bonus=G.location===c.fav_loc?16:11;
      gainAffection(c.id,bonus);
      showEmotion('🎁',2000);
      showNotif(`🎁 -300¥ — ${c.name} est touchée !`,c.color);
      addMemory(`Cadeau offert à ${c.name}.`);
      break;
    }
    case 'date':{
      if(G.money<600) return; G.money-=600;
      const dl=c.dialogues.date;
      typeText(c.name,dl[Math.floor(Math.random()*dl.length)],c.color);
      gainAffection(c.id,22);
      showEmotion('💑',3000);
      showNotif(`💑 -600¥ — Magnifique soirée avec ${c.name} !`,c.color);
      addMemory(`Rendez-vous inoubliable avec ${c.name}.`);
      break;
    }
    case 'confess':{
      if(G.ap<=0||c.affection<90) return; spendAP();
      typeText(c.name,'… (un long silence, puis un regard qui dit tout)',c.color);
      gainAffection(c.id,8);
      showEmotion('💌',4000);
      showNotif(`💌 Aveu à ${c.name}…`,c.color);
      addMemory(`Tu as avoué tes sentiments à ${c.name}. Elle n'a pas répondu avec des mots.`);
      break;
    }
  }
  syncPresenceAfterTimeChange(previousSlot);
  renderAll();
  setTimeout(()=>checkEvents(c.id),500);
}

function doWork(){
  if(G.ap<=0||G.workDone) return;
  const previousSlot=getTimeSlot();
  spendAP(); G.workDone=true;
  const msg=WORK_MSGS[Math.floor(Math.random()*WORK_MSGS.length)];
  const earn=rand(280,450); G.money+=earn;
  narratorSay(msg);
  showNotif(`💼 +${earn}¥ gagné !`,'var(--gold)');
  syncPresenceAfterTimeChange(previousSlot);
  renderAll();
}

function doStudy(){
  if(G.ap<=0||G.studyDone) return;
  const previousSlot=getTimeSlot();
  spendAP(); G.studyDone=true;
  const msg=STUDY_MSGS[Math.floor(Math.random()*STUDY_MSGS.length)];
  narratorSay(msg);
  showNotif(`📖 Tu as étudié. La connaissance est une richesse.`,'var(--blue)');
  if(G.selId){ const c=getChar(G.selId); gainAffection(c.id,2); }
  syncPresenceAfterTimeChange(previousSlot);
  renderAll();
}

function showEmotion(emoji, dur=1800){
  const el=document.getElementById('emotion-bubble');
  el.textContent=emoji; el.style.opacity='1';
  clearTimeout(el._t);
  el._t=setTimeout(()=>{ el.style.opacity='0'; },dur);
}

// ── ÉVÉNEMENTS ───────────────────────────────────────────────
function checkEvents(id){
  const c=getChar(id);
  for(const [thresh,ev] of Object.entries(c.events)){
    const t=parseInt(thresh);
    if(c.affection>=t && !G.seenEvents[id][thresh]){
      G.seenEvents[id][thresh]=true;
      setTimeout(()=>openEvent(c,ev,thresh),700);
      return;
    }
  }
}

function openEvent(c,ev,thresh){
  document.getElementById('m-chapter-tag').textContent=ev.chapter||'';
  document.getElementById('m-title').textContent=ev.title;
  document.getElementById('m-subtitle').textContent=ev.subtitle||'';
  document.getElementById('m-sprite').innerHTML=buildSprite(c.id,130,'happy');
  // Scene bg
  const scb=document.getElementById('m-scene-bg');
  const loc=Object.values(LOCATIONS).find(l=>ev.scene&&ev.scene.includes(l.name.split(' ')[0]));
  scb.style.background=`linear-gradient(135deg, ${c.accent}22, ${c.color}11)`;
  scb.style.borderLeft=`3px solid ${c.color}`;
  scb.style.fontSize='.72rem'; scb.style.color='rgba(255,255,255,.5)';
  scb.style.padding='.4rem .8rem'; scb.style.lineHeight='1.6';
  scb.textContent='📍 '+ev.scene;
  document.getElementById('m-text').textContent=ev.text;
  const ch=document.getElementById('m-choices'); ch.innerHTML='';
  document.getElementById('m-close').style.display='none';
  ev.choices.forEach(choice=>{
    const b=document.createElement('button'); b.className='choice-btn';
    b.innerHTML=`${choice.t} <span class="choice-effect">+${choice.g} 💕</span>`;
    b.onclick=()=>{
      gainAffection(c.id,choice.g);
      if(choice.mem) addMemory(choice.mem);
      const sw=document.getElementById('sprite-wrap');
      sw.classList.remove('bounce'); void sw.offsetWidth; sw.classList.add('bounce');
      if(choice.mood==='happy'||choice.mood==='blush') showEmotion('✨',2000);
      renderAll(); closeModal();
    };
    ch.appendChild(b);
  });
  document.getElementById('event-modal').classList.add('show');
}

function closeModal(){ document.getElementById('event-modal').classList.remove('show'); }

// ── PROFIL ────────────────────────────────────────────────────
function showProfile(){
  if(!G.selId) return;
  const c=getChar(G.selId);
  G.currentProfile=c.id;
  const stg=getStage(c.affection);
  document.getElementById('p-sprite').innerHTML=buildSprite(c.id,140,'happy');
  document.getElementById('p-name').innerHTML=`${c.emoji} ${c.name}`;
  document.getElementById('p-name').style.color=c.color;
  document.getElementById('p-archetype').textContent=c.archetype;
  const sb=document.getElementById('p-stage');
  sb.textContent=STAGES[stg].label;
  sb.style.background=STAGES[stg].color+'22'; sb.style.color=STAGES[stg].color;
  sb.style.border=`1px solid ${STAGES[stg].color}`;
  document.getElementById('p-quote').textContent=c.quote;
  switchProfileTab('bio', document.querySelector('.ptab.active'));
  document.getElementById('profile-modal').classList.add('show');
}

function switchProfileTab(tab, btn){
  document.querySelectorAll('.ptab').forEach(b=>b.classList.remove('active'));
  if(btn) btn.classList.add('active');
  const c=getChar(G.currentProfile); if(!c) return;
  const cont=document.getElementById('profile-tab-content');
  const stg=getStage(c.affection);

  if(tab==='bio'){
    cont.innerHTML=`
      <div class="bio-section">
        <div class="bio-detail">
          <span class="bio-chip">🎂 ${c.birthday}</span>
          <span class="bio-chip">❤️ ${c.fav_food}</span>
          <span class="bio-chip">🎨 ${c.fav_color}</span>
        </div>
        <div class="bio-detail">
          ${c.hobby.split(' · ').map(h=>`<span class="bio-chip">✦ ${h}</span>`).join('')}
        </div>
        ${c.biography.split('\n').filter(l=>l.trim()).map(l=>`<p>${l.trim()}</p>`).join('')}
      </div>
    `;
  } else if(tab==='stats'){
    cont.innerHTML=`<div class="stat-grid">
      <div class="stat-item">
        <div class="stat-label">Affection</div>
        <div class="stat-val" style="color:${c.color}">${c.affection}/100</div>
        <div class="stat-bar"><div class="stat-bar-fill" style="width:${c.affection}%;background:${c.color}"></div></div>
      </div>
      <div class="stat-item">
        <div class="stat-label">Relation</div>
        <div class="stat-val" style="color:${STAGES[stg].color}">${STAGES[stg].label}</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">Lieu favori</div>
        <div class="stat-val">${LOCATIONS[c.fav_loc].icon} ${LOCATIONS[c.fav_loc].name}</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">Jours restants</div>
        <div class="stat-val">${30-G.day}</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">Événements vus</div>
        <div class="stat-val">${Object.keys(G.seenEvents[c.id]||{}).length}/${Object.keys(c.events).length}</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">Météo bonus</div>
        <div class="stat-val">${G.weather.icon} +${G.weather.bonus}</div>
      </div>
    </div>`;
  } else if(tab==='story'){
    cont.innerHTML=c.arcs.map(arc=>{
      const unlocked=c.affection>=arc.threshold;
      return `<div class="story-arc" style="border-color:${unlocked?c.color:'rgba(255,255,255,.1)'}">
        <div class="arc-header">
          <span class="arc-num" style="background:${unlocked?c.color+'33':'rgba(255,255,255,.05)'};color:${unlocked?c.color:'rgba(255,255,255,.3)'}">
            ${unlocked?'✦':'🔒'}
          </span>
          <span class="arc-name" style="color:${unlocked?c.color:'rgba(255,255,255,.3)'}">${arc.name}</span>
          <span class="arc-status">${unlocked?'<span style="color:var(--green)">Débloqué</span>':'<span style="color:var(--muted)">Affection '+arc.threshold+' requis</span>'}</span>
        </div>
        <div class="arc-desc" style="color:${unlocked?'rgba(240,220,255,.9)':'rgba(255,255,255,.2)'}">
          ${unlocked?arc.desc:'???'}
        </div>
      </div>`;
    }).join('');
  } else if(tab==='memories'){
    const charMem=G.memories.filter(m=>m.text.includes(c.name.split(' ')[0]));
    cont.innerHTML=charMem.length>0
      ? `<div class="memory-grid">${charMem.map(m=>`
          <div class="memory-card">
            <div class="memory-card-day">Jour ${m.day}</div>
            <div class="memory-card-text">${m.text}</div>
          </div>`).join('')}</div>`
      : '<div style="text-align:center;padding:2rem;opacity:.4;font-size:.85rem">Aucun souvenir partagé encore…<br>Interagis davantage avec '+c.name.split(' ')[0]+'.</div>';
  }
}

function closeProfile(){ document.getElementById('profile-modal').classList.remove('show'); }

// ── LIEU ─────────────────────────────────────────────────────
function setRoom(roomId){
  if(!getRoomMeta(G.location, roomId)) return;
  if(G.room===roomId) return;
  G.room=roomId;
  renderAll();
  const roomName=getRoomName(G.location, roomId);
  narratorSay(`Tu entres dans ${roomName.toLowerCase()}.`);
  if(G.selId && !isCharacterInCurrentRoom(G.selId)){
    const c=getChar(G.selId);
    if(c) showNotif(`${c.emoji} ${c.name.split(' ')[0]} n'est pas dans cette pièce.`,'var(--blue)');
  }
}

function setLocation(loc){
  G.location=loc;
  if(!getRoomMeta(loc, G.room)) G.room=defaultRoomForLocation(loc);

  if(G.selId){
    const pos=G.charPresence[G.selId];
    if(pos && pos.location===loc && pos.room!==G.room) G.room=pos.room;
  }

  renderAll();
  const locData=LOCATIONS[loc];

  if(G.selId){
    const c=getChar(G.selId);
    const pos=G.charPresence[c.id];
    if(!pos || pos.location!==loc){
      typeText('Narrateur', `${c.name.split(' ')[0]} n'est pas dans ce lieu pour le moment.`, 'rgba(200,180,255,.9)');
      return;
    }

    const dlgs=c.dialogues[loc]||c.dialogues.school;
    const line=dlgs[Math.floor(Math.random()*dlgs.length)];
    const favBonus=loc===c.fav_loc?' ✿ (son endroit préféré !)':'';
    typeText(c.name,line+favBonus,c.color);

    if(loc===c.fav_loc && isCharacterInCurrentRoom(c.id)){
      gainAffection(c.id,2);
      showNotif(`${c.emoji} ${c.name} adore cet endroit !`,c.color);
      renderAll();
    }
  } else {
    narratorSay(`Tu arrives ${locData.label}. ${loc==='shrine'?'Le parfum de l\'encens flotte dans l\'air.':loc==='rooftop'?'La ville s\'étale sous tes yeux.':loc==='beach'?'Le bruit des vagues efface tout le reste.':'L\'atmosphère particulière de ce lieu t\'enveloppe.'}`);
  }
}

function nextDay(){
  G.day++; G.ap=3; G.workDone=false; G.studyDone=false;
  if(G.day>30){ showEndScreen(); return; }
  randomizeWeather();

  if(Math.random()<0.25){
    const locs=Object.keys(LOCATIONS);
    G.location=locs[Math.floor(Math.random()*locs.length)];
  }

  if(!getRoomMeta(G.location, G.room)) G.room=defaultRoomForLocation(G.location);
  resolveNpcPresence();

  const dayMsgs=[
    `Jour ${G.day}. ${G.weather.icon} La ville se réveille sous un ciel ${G.weather.label.toLowerCase()}.`,
    `Matin du jour ${G.day}. ${G.weather.icon} Les rues sentent ${G.weather.id==='rain'?'la pluie et la terre mouillée.':'le café frais et les fleurs de cerisier.'}`,
    `${G.weather.icon} Jour ${G.day}. Une page nouvelle. Qu'est-ce qui t'attend aujourd'hui ?`,
    `Réveil du jour ${G.day}. ${G.weather.icon} Dehors, ${G.weather.label.toLowerCase()}.`,
  ];
  narratorSay(dayMsgs[Math.floor(Math.random()*dayMsgs.length)]);
  showNotif(`🌅 Jour ${G.day} — AP rechargés !`,'var(--green)');
  renderAll();
}

function showEndScreen(){
  const grid=document.getElementById('results-grid');
  grid.innerHTML='';
  let bestChar=null, bestAff=-1;
  chars.forEach(c=>{
    const stg=getStage(c.affection);
    const div=document.createElement('div');
    div.className='result-card';
    div.style.borderColor=c.color+'44';
    div.innerHTML=`
      <div class="result-emoji">${c.emoji}</div>
      <div class="result-name" style="color:${c.color}">${c.name}</div>
      <div class="result-aff">${c.affection}/100 affection</div>
      <div class="result-stage" style="color:${STAGES[stg].color}">${STAGES[stg].label}</div>
      <div class="result-ending" style="color:${c.color}55">${STAGES[stg].endText}</div>
    `;
    grid.appendChild(div);
    if(c.affection>bestAff){ bestAff=c.affection; bestChar=c; }
  });
  // Épilogue
  const epil=document.getElementById('end-epilogue');
  if(bestChar && bestAff>=68){
    epil.textContent=`L'histoire de ${bestChar.name} et toi ne s'arrête pas ici. Elle continue dans les espaces entre les mots, dans les silences partagés, dans chaque pétale de cerisier qui tombe. Certaines histoires ne finissent jamais vraiment.`;
  } else if(bestAff>=28){
    epil.textContent=`Les trente jours ont planté des graines. Des connexions nouvelles, des sourires vrais, des moments qui resteront. Peut-être que si tu revenais, l'histoire irait plus loin.`;
  } else {
    epil.textContent=`Trente jours passent vite. Les gens autour de toi avaient leurs propres histoires à vivre. Une autre fois, peut-être, tu serais là vraiment.`;
  }
  document.getElementById('end-sub').textContent=`Les trente jours se sont écoulés comme des pétales dans le vent…`;
  showScreen('end-screen');
}

// ── TITLE PREVIEW ─────────────────────────────────────────────
function renderTitlePreview(){
  const cont=document.getElementById('title-preview'); cont.innerHTML='';
  CHARS_DATA.forEach(c=>{
    const wrap=document.createElement('div');
    wrap.className='title-char-prev';
    wrap.innerHTML=buildSprite(c.id,85)+'<div class="title-char-name" style="color:'+c.color+'">'+c.emoji+' '+c.name.split(' ')[0]+'</div>';
    wrap.addEventListener('mouseenter',()=>wrap.style.transform='translateY(-10px) scale(1.08)');
    wrap.addEventListener('mouseleave',()=>wrap.style.transform='');
    cont.appendChild(wrap);
  });
}

// ── START / RESTART ───────────────────────────────────────────
function startGame(){
  initState();
  showScreen('main-screen');
  randomizeWeather();
  resolveNpcPresence();
  renderAll();
  narratorSay('Le soleil se lève sur l\'académie Sakura Hills… Une brise légère fait tourbillonner les pétales. Trente jours. Quatre histoires possibles. Laquelle vas-tu choisir ?');
}
function restartGame(){ initState(); resolveNpcPresence(); showScreen('title-screen'); renderTitlePreview(); }

// ── INIT ─────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded',()=>{
  spawnParticles(); initState(); resolveNpcPresence(); renderTitlePreview();
});
