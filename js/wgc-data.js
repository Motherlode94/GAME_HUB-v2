(function () {
    const GAMES = [
        { id: 39, title: "Gestion Tycoon", category: "simulation", tags: ["prototype","à tester"], playUrl: "A Faire/_2D Gestion Tycoon/index.html", description: "Prototype à vérifier : contrôles, gameplay et stabilité non encore validés." },
        { id: 40, title: "GodSworm", category: "strategy", tags: ["prototype","à tester"], playUrl: "A Faire/_2D GodSworm/index.html", description: "Prototype à vérifier : contrôles, gameplay et stabilité non encore validés." },
        { id: 41, title: "Mario Like", category: "platformer", tags: ["prototype","à tester"], playUrl: "A Faire/_2D Mario Like/index.html", description: "Prototype à vérifier : contrôles, gameplay et stabilité non encore validés." },
        { id: 42, title: "MineCraft", category: "simulation", tags: ["prototype","à tester"], playUrl: "A Faire/_2D MineCraft/index.html", description: "Prototype à vérifier : contrôles, gameplay et stabilité non encore validés." },
        { id: 43, title: "Neo Soccer 2D", category: "sports", tags: ["prototype","à tester"], playUrl: "A Faire/_2D Neo Soccer 2D/index.html", description: "Prototype à vérifier : contrôles, gameplay et stabilité non encore validés." },
        { id: 44, title: "Racing", category: "racing", tags: ["prototype","à tester"], playUrl: "A Faire/_2D Racing/index.html", description: "Prototype à vérifier : contrôles, gameplay et stabilité non encore validés." },
        { id: 45, title: "Shooter", category: "action", tags: ["prototype","à tester"], playUrl: "A Faire/_2D Shooter/index.html", description: "Prototype à vérifier : contrôles, gameplay et stabilité non encore validés." },
        { id: 46, title: "Tennis Man", category: "sports", tags: ["prototype","à tester"], playUrl: "A Faire/_2D Tennis Man/index.html", description: "Prototype à vérifier : contrôles, gameplay et stabilité non encore validés." },
        { id: 47, title: "Zombie Shooter", category: "action", tags: ["prototype","à tester"], playUrl: "A Faire/_2D Zombie Shooter/index.html", description: "Prototype à vérifier : contrôles, gameplay et stabilité non encore validés." },
        { id: 38, title: "TOYMARE : The Forgotten Factory", category: "adventure", tags: ["horreur","jouets","usine","énigmes","survie"], playUrl: "A Faire/_2D Toymare The Forgotten Factory/index.html", description: "Explore une usine de jouets abandonnée, manipule ses machines avec deux bras mécaniques et échappe à une mascotte inquiétante." },
        { id: 37, title: "Black Veil", category: "adventure", tags: ["horreur","infiltration","survie","TPS","discrétion"], playUrl: "A Faire/_2D Black Veil/index.html", description: "Traverse un village maudit, cache-toi des Veilleurs et retrouve trois sceaux pour atteindre la chapelle." },
        { id: 36, title: "Infernum : Le Rachat", category: "action", tags: ["enfer","rédemption","action","choix moraux","dark fantasy"], playUrl: "A Faire/_2D Infernum Le Rachat/index.html", description: "Affronte les geôliers infernaux et choisis entre sauver une âme ou voler son pouvoir. Tes actes déterminent ton jugement." },
        { id: 32, title: "Shadow Runner", category: "action", tags: ["ninja","parkour","infiltration","combat"], playUrl: "A Faire/_2D Shadow Runner/index.html", description: "Ninja TPS avec esquive, combat rapproché et infiltration." },
        { id: 33, title: "Underground Fighter", category: "action", tags: ["combat","boxe","combo","tournoi"], playUrl: "A Faire/_2D Underground Fighter/index.html", description: "Combat technique TPS avec combos, garde et tournois." },
        { id: 34, title: "Iron Vanguard", category: "action", tags: ["mecha","robot","arene","combat"], playUrl: "A Faire/_2D Iron Vanguard/index.html", description: "Combat de méchas TPS, canon et boost." },
        { id: 35, title: "Void Breach", category: "action", tags: ["espace","survie","creatures","fps"], playUrl: "A Faire/_2D Void Breach/index.html", description: "Station spatiale et créatures, prototype de combat spatial." },
        { id: 31, title: "Construction Simulator FPS", category: "simulation", tags: ["construction","fps","chantier","engins","simulation"], playUrl: "A Faire/_2D Construction Simulator/index.html", description: "Construis des bâtiments à la première personne, collecte des matériaux, conduis une chargeuse et réalise des contrats pour développer ton entreprise." },
        { id: 30, title: "Anachkel — Le Jeu d'Horreur", category: "adventure", tags: ["horreur","fps","survie","exploration","poupée"], playUrl: "A Faire/_2D Anachkel Horror/index.html", description: "Explore un manoir hanté à la première personne, retrouve la clé et les documents, maîtrise ta lampe et survis à Anachkel." },
        { id: 28, title: "Supermarket Empire FPS", category: "simulation", tags: ["supermarché","fps","commerce","gestion","caisse"], playUrl: "A Faire/_2D Supermarket Empire/index.html", description: "Gère ton supermarché à la première personne : rayons, stocks, fournisseurs, caisse, clients et employés." },
        { id: 29, title: "Detective Stories FPS", category: "adventure", tags: ["detective","fps","enquêtes","preuves","interrogatoires"], playUrl: "A Faire/_2D Detective Stories/index.html", description: "Explore les scènes, interroge les témoins, collecte les indices et prends des décisions fondées sur les preuves." },
        {
            id: 27,
            title: "WarLike Police Simulator FPS",
            category: "simulation",
            tags: ["police", "fps", "patrouille", "enquete", "interactions"],
            playUrl: "A Faire/_2D Police Simulator/index.html",
            description: "Patrouille dans un quartier en vue subjective, collecte des indices, dialogue avec les témoins et gère tes interventions. Sauvegarde locale."
        },
        {
            id: 1,
            title: "Artiste Manager",
            category: "action",

            tags: ["gestion", "musique", "carriere", "simulation"],
            playUrl: "A Faire/_2D Artiste Manager/index.html",
            description: "Propulse ton artiste vers le sommet. Gère sa carrière, ses concerts et sa réputation dans l'industrie musicale.",

        },
        {
            id: 2,
            title: "War Zone Commander",
            category: "strategy",

            tags: ["guerre", "commandement", "tactique", "militaire"],
            playUrl: "A Faire/_2D War Zone Commander/index.html",
            description: "Prends le commandement d'une armée sur le champ de bataille. Planifie tes attaques et écrase l'ennemi.",

        },
        {
            id: 3,
            title: "Football Manager",
            category: "sports",

            tags: ["football", "gestion", "equipe", "championnat"],
            playUrl: "A Faire/_2D Football Manager/index.html",
            description: "Entraîne ton équipe, gère les transferts et mène tes joueurs vers le titre du championnat.",

        },
        {
            id: 4,
            title: "Free Force",
            category: "action",

            tags: ["combat", "arcade", "action", "reflexes"],
            playUrl: "A Faire/_2D Free Force/index.html",
            description: "Affronte des vagues d'ennemis dans un jeu d'action nerveux. Survie, précision et vitesse de réaction.",

        },
        {
            id: 5,
            title: "Be The King",
            category: "strategy",

            tags: ["royaute", "strategie", "empire", "politique"],
            playUrl: "A Faire/_2D Be the Kings/index.html",
            description: "Construis ton royaume, lève des armées et étends ton empire. Le trône t'attend — sauras-tu le garder ?",

        },
        {
            id: 6,
            title: "Fighting Legends",
            category: "action",

            tags: ["combat", "versus", "legendes", "arcade"],
            playUrl: "A Faire/_2D Fighting Legends/index.html",
            description: "Incarne des légendes du combat et affronte tes adversaires dans des duels épiques en 2D.",

        },
        {
            id: 7,
            title: "City Builder",
            category: "strategy",

            tags: ["ville", "construction", "gestion", "urbanisme"],
            playUrl: "A Faire/_2D City Builder/index.html",
            description: "Conçois et développe ta ville de zéro. Gère les ressources, les habitants et les infrastructures.",

        },
        {
            id: 8,
            title: "Hero Forces",
            category: "action",

            tags: ["heros", "equipe", "combat", "cooperation"],
            playUrl: "A Faire/_2D Hero Forces/index.html",
            description: "Commande une escouade de héros et repousse les forces du mal dans des missions d'action intenses.",

        },
        {
            id: 9,
            title: "NFL Sim",
            category: "sports",

            tags: ["football americain", "NFL", "simulation", "equipe"],
            playUrl: "A Faire/_2D NFL Sim/index.html",
            description: "Vis l'expérience du football américain. Gère ton équipe NFL et mène-la jusqu'au Super Bowl.",

        },
        {
            id: 10,
            title: "Dungeon Crawler",
            category: "rpg",

            tags: ["donjon", "exploration", "rpg", "monstres"],
            playUrl: "A Faire/_2D Dungeon Crawler/index.html",
            description: "Plonge dans des donjons sombres et infestés de monstres. Collecte du loot et monte en puissance.",

        },
        {
            id: 11,
            title: "Axis Infinity",
            category: "strategy",

            tags: ["tour par tour", "conquete", "strategie", "infini"],
            playUrl: "A Faire/_2D Axis Infinity/index.html",
            description: "Un jeu de stratégie sans fin où chaque décision compte. Conquiers les axes et domine le plateau.",

        },
        {
            id: 12,
            title: "Vampire's Sim",
            category: "rpg",

            tags: ["vampire", "horreur", "simulation", "nuit"],
            playUrl: "A Faire/_2D Vampire's Sim/index.html",
            description: "Incarne un vampire et gère ta survie nocturne. Chasse, séduction et pouvoirs obscurs t'attendent.",

        },
        {
            id: 13,
            title: "Tower Defense",
            category: "strategy",

            tags: ["defense", "tourelles", "vagues", "strategie"],
            playUrl: "A Faire/_2D Tower Defense/index.html",
            description: "Place tes tourelles et défends ta base contre des vagues d'ennemis de plus en plus puissants.",

        },
        {
            id: 14,
            title: "Hard Wood",
            category: "sports",

            tags: ["basketball", "arcade", "sport", "competition"],
            playUrl: "A Faire/_2D Hard Wood/index.html",
            description: "Descends sur le parquet et montre tes moves. Basketball arcade rapide et compétitif.",

        },
        {
            id: 15,
            title: "Hack n Slash v2",
            category: "action",

            tags: ["hack", "slash", "action", "jeu"],
            playUrl: "A Faire/_2D Hack n Slash v2/index.html",
            description: "Reviens dans l'univers de Hack n Slash avec de nouvelles capacités et des défis plus difficiles.",

        },
        {
            id: 16,
            title: "Basket Sim",
            category: "sports",

            tags: ["basketball", "simulation", "equipe", "championnat"],
            playUrl: "A Faire/_2D Basket Sim/index.html",
            description: "Gère ton équipe de basketball et participe à des championnats compétitifs.",

        },
        {
            id: 17,
            title: "Platerformer Challenge",
            category: "platformer",

            tags: ["plateformer", "challenge", "precision", "reflexes"],
            playUrl: "A Faire/_2D Plateformer/index.html",
            description: "Teste tes compétences de plateformer à travers des niveaux remplis de pièges et d'obstacles.",

        },
        {
            id: 18,
            title: "Iron Meridian: Greyfall",
            category: "strategy",
            tags: ["tactique", "escouades", "science-fiction militaire", "fictif", "missions"],
            playUrl: "A Faire/_2D Iron Meridian/index.html",
            description: "Dirige le commando Astra dans une opération fictive : sécurise trois secteurs, préserve tes unités et organise une extraction."
        },
        {
            id: 19,
            title: "After Dark",
            category: "rpg",
            tags: ["visual novel","romance","dialogue","adulte"],
            playUrl: "DONE/_2D After Dark/index.html",
            description: "Visual novel 2D nocturne à choix et relations."
        },
        {
            id: 20,
            title: "Anime Harem",
            category: "rpg",
            tags: ["anime","simulation","relations"],
            playUrl: "A Faire/_2D Anime Harem/index.html",
            description: "Simulation 2D de relations et de personnages."
        },
        {
            id: 21,
            title: "Hearts of Eden",
            category: "rpg",
            tags: ["simulation","romance","relations"],
            playUrl: "DONE/_2D Hearts of Eden/index.html",
            description: "Simulation sociale et relations entre adultes."
        },
        {
            id: 22,
            title: "The Silent Verdict",
            category: "strategy",
            tags: ["enquete","mystere","deduction"],
            playUrl: "DONE/_2D The Silent Verdict/index.html",
            description: "Résous trois enquêtes par les preuves et les témoignages."
        },
        {
            id: 23,
            title: "No Man's Dawn",
            category: "action",
            tags: ["survie","exploration","3d"],
            playUrl: "DONE/_3D No Mans Dawn/index.html",
            description: "Explore une région isolée et reconstruis un refuge."
        },
        {
            id: 24,
            title: "Redline District",
            category: "sports",
            tags: ["course","voiture","3d"],
            playUrl: "DONE/_3D Redline District/index.html",
            description: "Courses automobiles sur circuit avec adversaires."
        },
        {
            id: 25,
            title: "The Last Signal",
            category: "rpg",
            tags: ["horreur","enquete","3d"],
            playUrl: "DONE/_3D The Last Signal/index.html",
            description: "Une station radio abandonnée cache une transmission inquiétante."
        },
        {id:26,title:"Agence X",category:"strategy",tags:["studio","production","gestion","tycoon","18+"],playUrl:"DONE/_2D Agence X/index.html",description:"Dirige un studio de productions pour adultes fictifs : casting, tournages, distribution, contrats et finances."}
    ];

    function parseJson(value, fallback) {
        try { return JSON.parse(value) || fallback; } catch { return fallback; }
    }

    function normalizeText(value) {
        return String(value || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    }

    function normalizeScoreEntry(entry) {
        return {
            name:  typeof entry?.name === "string" && entry.name.trim() ? entry.name.trim().slice(0, 20) : "Anonyme",
            score: Math.max(0, Math.floor(Number(entry?.score) || 0)),
            date:  entry?.date || new Date().toLocaleDateString("fr-FR")
        };
    }

    function getGameById(gameId) {
        return GAMES.find((game) => game.id === Number(gameId)) || null;
    }

    function findGameByInput(value) {
        const raw = String(value || "").trim();
        if (!raw) return null;
        const byId = getGameById(raw);
        if (byId) return byId;
        const normalized = normalizeText(raw);
        if (!normalized) return null;
        const exact = GAMES.find((game) => normalizeText(game.title) === normalized);
        if (exact) return exact;
        const partials = GAMES.filter((game) => normalizeText(game.title).includes(normalized));
        return partials.length === 1 ? partials[0] : null;
    }

    function getScores(gameId) {
        return parseJson(localStorage.getItem("wgc_scores_" + Number(gameId)), [])
            .filter((entry) => entry && typeof entry === "object")
            .map(normalizeScoreEntry)
            .sort((a, b) => b.score - a.score);
    }

    function saveScores(gameId, scores) {
        localStorage.setItem("wgc_scores_" + Number(gameId), JSON.stringify(
            scores.filter((e) => e && typeof e === "object")
                  .map(normalizeScoreEntry)
                  .sort((a, b) => b.score - a.score)
                  .slice(0, 20)
        ));
    }

    function addScore(gameId, entry) {
        const scores = getScores(gameId);
        scores.push(normalizeScoreEntry(entry));
        saveScores(gameId, scores);
        return getScores(gameId);
    }

    function getComments(gameId) {
        return parseJson(localStorage.getItem("wgc_comments_" + Number(gameId)), [])
            .filter((entry) => entry && typeof entry === "object");
    }

    function saveComments(gameId, comments) {
        localStorage.setItem("wgc_comments_" + Number(gameId), JSON.stringify(
            comments.filter((e) => e && typeof e === "object").slice(-200)
        ));
    }

    function addComment(gameId, comment) {
        const comments = getComments(gameId);
        comments.push(comment);
        saveComments(gameId, comments);
        return getComments(gameId);
    }

    window.WGC_DATA = {
        GAMES, getGameById, findGameByInput,
        getScores, saveScores, addScore,
        getComments, saveComments, addComment
    };
})();