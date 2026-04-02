(function () {
    const GAMES = [
        {
            id: 1,
            title: "Artiste Manager",
            category: "action",
            year: 2026,
            tags: ["", "", "", ""],
            playUrl: "DONE/_2D Artiste Manager/index.html",
            description: " ",
            rating:  7.5,

            ///////// Metadata for display and management
            //changelog: [
            //    { version: "", date: "", notes: ["", "", ""] },
            //]
            //coverImage: "path/to/image.png",
            //strategyType: "",
        },
        {
            id: 2,
            title: "War Zone Commander",
            category: "strategy",
            year: 2026,
            tags: ["", "", "", ""],
            playUrl: "DONE/_2D War Zone Commander/index.html",
            description: " ",
            rating:  7.5,

            ///////// Metadata for display and management
            //changelog: [
            //    { version: "", date: "", notes: ["", "", ""] },
            //]
            //coverImage: "path/to/image.png",
            //strategyType: "",
        },
        {
            id: 3,
            title: "Football Manager",
            category: "sports",
            year: 2026,
            tags: ["", "", "", ""],
            playUrl: "DONE/_2D Football Manager/index.html",
            description: " ",
            rating:  7.5,

            ///////// Metadata for display and management
            //changelog: [
            //    { version: "", date: "", notes: ["", "", ""] },
            //]
            //coverImage: "path/to/image.png",
            //strategyType: "",
        },
        {
            id: 4,
            title: "Free Force  ",
            category: "action",
            year: 2026,
            tags: ["", "", "", ""],
            playUrl: "DONE/_2D Free Force  /index.html",
            description: " ",
            rating:  7.5,

            ///////// Metadata for display and management
            //changelog: [
            //    { version: "", date: "", notes: ["", "", ""] },
            //]
            //coverImage: "path/to/image.png",
            //strategyType: "",
        },
        {
            id: 5,
            title: "Be The King",
            category: "strategy",
            year: 2026,
            tags: ["", "", "", ""],
            playUrl: "DONE/_2D Be The King/index.html",
            description: " ",
            rating:  7.5,

            ///////// Metadata for display and management
            //changelog: [
            //    { version: "", date: "", notes: ["", "", ""] },
            //]
            //coverImage: "path/to/image.png",
            //strategyType: "",
        },
        {
            id: 6,
            title: "Fighting Legends",
            category: "action",
            year: 2026,
            tags: ["", "", "", ""],
            playUrl: "DONE/_2D Fighting Legends/index.html",
            description: " ",
            rating:  7.5,

            ///////// Metadata for display and management
            //changelog: [
            //    { version: "", date: "", notes: ["", "", ""] },
            //]
            //coverImage: "path/to/image.png",
            //strategyType: "",
        },
        {
            id: 7,
            title: "City Builder",
            category: "strategy",
            year: 2026,
            tags: ["", "", "", ""],
            playUrl: "DONE/_2D City Builder/index.html",
            description: " ",
            rating:  7.5,

            ///////// Metadata for display and management
            //changelog: [
            //    { version: "", date: "", notes: ["", "", ""] },
            //]
            //coverImage: "path/to/image.png",
            //strategyType: "",
        },
        {
            id: 8,
            title: " Hero Forces",
            category: "action",
            year: 2026,
            tags: ["", "", "", ""],
            playUrl: "DONE/_2D Hero Forces/index.html",
            description: " ",
            rating:  7.5,

            ///////// Metadata for display and management
            //changelog: [
            //    { version: "", date: "", notes: ["", "", ""] },
            //]
            //coverImage: "path/to/image.png",
            //strategyType: "",
        },
        {
            id: 9,
            title: "NFL Sim",
            category: "sports",
            year: 2026,
            tags: ["", "", "", ""],
            playUrl: "DONE/_2D NFL Sim/index.html",
            description: " ",
            rating:  7.5,

            ///////// Metadata for display and management
            //changelog: [
            //    { version: "", date: "", notes: ["", "", ""] },
            //]
            //coverImage: "path/to/image.png",
            //strategyType: "",
        },
        {
            id: 10,
            title: "Dungeon Crawler",
            category: "rpg",
            year: 2026,
            tags: ["", "", "", ""],
            playUrl: "DONE/_2D Dungeon Crawler/index.html",
            description: " ",
            rating:  7.5,

            ///////// Metadata for display and management
            //changelog: [
            //    { version: "", date: "", notes: ["", "", ""] },
            //]
            //coverImage: "path/to/image.png",
            //strategyType: "",
        }
    ];

    function parseJson(value, fallback) {
        try {
            return JSON.parse(value) || fallback;
        } catch {
            return fallback;
        }
    }

    function normalizeText(value) {
        return String(value || "")
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, " ")
            .trim();
    }

    function normalizeScoreEntry(entry) {
        return {
            name: typeof entry?.name === "string" && entry.name.trim() ? entry.name.trim().slice(0, 20) : "Anonyme",
            score: Math.max(0, Math.floor(Number(entry?.score) || 0)),
            date: entry?.date || new Date().toLocaleDateString("fr-FR")
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
            scores
                .filter((entry) => entry && typeof entry === "object")
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
            comments.filter((entry) => entry && typeof entry === "object").slice(-200)
        ));
    }

    function addComment(gameId, comment) {
        const comments = getComments(gameId);
        comments.push(comment);
        saveComments(gameId, comments);
        return getComments(gameId);
    }

    window.WGC_DATA = {
        GAMES,
        getGameById,
        findGameByInput,
        getScores,
        saveScores,
        addScore,
        getComments,
        saveComments,
        addComment
    };
})();
