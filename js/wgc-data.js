(function () {
    const GAMES = [
        {
            id: 1,
            title: "Artiste Manager",
            category: "action",

            tags: ["gestion", "musique", "carriere", "simulation"],
            playUrl: "DONE/_2D Artiste Manager/index.html",
            description: "Propulse ton artiste vers le sommet. Gère sa carrière, ses concerts et sa réputation dans l'industrie musicale.",

        },
        {
            id: 2,
            title: "War Zone Commander",
            category: "strategy",

            tags: ["guerre", "commandement", "tactique", "militaire"],
            playUrl: "DONE/_2D War Zone Commander/index.html",
            description: "Prends le commandement d'une armée sur le champ de bataille. Planifie tes attaques et écrase l'ennemi.",

        },
        {
            id: 3,
            title: "Football Manager",
            category: "sports",

            tags: ["football", "gestion", "equipe", "championnat"],
            playUrl: "DONE/_2D Football Manager/index.html",
            description: "Entraîne ton équipe, gère les transferts et mène tes joueurs vers le titre du championnat.",

        },
        {
            id: 4,
            title: "Free Force",
            category: "action",

            tags: ["combat", "arcade", "action", "reflexes"],
            playUrl: "DONE/_2D Free Force/index.html",
            description: "Affronte des vagues d'ennemis dans un jeu d'action nerveux. Survie, précision et vitesse de réaction.",

        },
        {
            id: 5,
            title: "Be The King",
            category: "strategy",

            tags: ["royaute", "strategie", "empire", "politique"],
            playUrl: "DONE/_2D Be The Kings/index.html",
            description: "Construis ton royaume, lève des armées et étends ton empire. Le trône t'attend — sauras-tu le garder ?",

        },
        {
            id: 6,
            title: "Fighting Legends",
            category: "action",

            tags: ["combat", "versus", "legendes", "arcade"],
            playUrl: "DONE/_2D Fighting Legends/index.html",
            description: "Incarne des légendes du combat et affronte tes adversaires dans des duels épiques en 2D.",

        },
        {
            id: 7,
            title: "City Builder",
            category: "strategy",

            tags: ["ville", "construction", "gestion", "urbanisme"],
            playUrl: "DONE/_2D City Builder/index.html",
            description: "Conçois et développe ta ville de zéro. Gère les ressources, les habitants et les infrastructures.",

        },
        {
            id: 8,
            title: "Hero Forces",
            category: "action",

            tags: ["heros", "equipe", "combat", "cooperation"],
            playUrl: "DONE/_2D Hero Forces/index.html",
            description: "Commande une escouade de héros et repousse les forces du mal dans des missions d'action intenses.",

        },
        {
            id: 9,
            title: "NFL Sim",
            category: "sports",

            tags: ["football americain", "NFL", "simulation", "equipe"],
            playUrl: "DONE/_2D NFL Sim/index.html",
            description: "Vis l'expérience du football américain. Gère ton équipe NFL et mène-la jusqu'au Super Bowl.",

        },
        {
            id: 10,
            title: "Dungeon Crawler",
            category: "rpg",

            tags: ["donjon", "exploration", "rpg", "monstres"],
            playUrl: "DONE/_2D Dungeon Crawler/index.html",
            description: "Plonge dans des donjons sombres et infestés de monstres. Collecte du loot et monte en puissance.",

        },
        {
            id: 11,
            title: "Axis Infinity",
            category: "strategy",

            tags: ["tour par tour", "conquete", "strategie", "infini"],
            playUrl: "DONE/_2D Axis Infinity/index.html",
            description: "Un jeu de stratégie sans fin où chaque décision compte. Conquiers les axes et domine le plateau.",

        },
        {
            id: 12,
            title: "Vampire's Sim",
            category: "rpg",

            tags: ["vampire", "horreur", "simulation", "nuit"],
            playUrl: "DONE/_2D Vampire's Sim/index.html",
            description: "Incarne un vampire et gère ta survie nocturne. Chasse, séduction et pouvoirs obscurs t'attendent.",

        },
        {
            id: 13,
            title: "Tower Defense",
            category: "strategy",

            tags: ["defense", "tourelles", "vagues", "strategie"],
            playUrl: "DONE/_2D Tower Defense/index.html",
            description: "Place tes tourelles et défends ta base contre des vagues d'ennemis de plus en plus puissants.",

        },
        {
            id: 14,
            title: "Hard Wood",
            category: "sports",

            tags: ["basketball", "arcade", "sport", "competition"],
            playUrl: "DONE/_2D Hard Wood/index.html",
            description: "Descends sur le parquet et montre tes moves. Basketball arcade rapide et compétitif.",

        },
        {
            id: 15,
            title: "Hack n Slash v2",
            category: "action",

            tags: ["hack", "slash", "action", "jeu"],
            playUrl: "DONE/_2D Hack n Slash v2/index.html",
            description: "Reviens dans l'univers de Hack n Slash avec de nouvelles capacités et des défis plus difficiles.",

        },
        {
            id: 16,
            title: "Basket Sim",
            category: "sports",

            tags: ["basketball", "simulation", "equipe", "championnat"],
            playUrl: "DONE/_2D Basket Sim/index.html",
            description: "Gère ton équipe de basketball et participe à des championnats compétitifs.",

        },
        {
            id: 17,
            title: "Platerformer Challenge",
            category: "platformer",

            tags: ["plateformer", "challenge", "precision", "reflexes"],
            playUrl: "DONE/_2D Plateformer/index.html",
            description: "Teste tes compétences de plateformer à travers des niveaux remplis de pièges et d'obstacles.",

        }
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