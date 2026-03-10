(function () {
    const GAMES = [
        {
            id: 1,
            title: "Combat Arena",
            category: "action",
            year: 2026,
            rating: 9.4,
            description: "A fast-paced 2-player local fighting game. Double jump, dash, and unleash charged attacks to defeat your opponent.",
            tags: ["fighting", "2-player", "local", "indie"],
            playUrl: "DONE/_2D Fight Kombat/index.html",
            changelog: [
                { version: "1.2.0", date: "2026-03-10", notes: ["Added new arena: Lava Pit", "Fixed dash cancel bug", "Improved hitbox precision"] },
                { version: "1.1.0", date: "2026-02-01", notes: ["Added character skins", "Rebalanced damage values"] },
                { version: "1.0.0", date: "2026-01-15", notes: ["Initial release"] }
            ]
        },
        {
            id: 2,
            title: "2D Basket Sim",
            category: "sports",
            year: 2026,
            rating: 8.9,
            description: "An arcade basketball challenge with classic, precision, and survival modes built around speed, shot timing, and score combos.",
            tags: ["basketball", "arcade", "sports", "score attack", "combo"],
            playUrl: "DONE/_2D Basket Sim/index.html",
            changelog: [
                { version: "1.0.0", date: "2026-02-28", notes: ["Initial release"] }
            ]
        },
        {
            id: 3,
            title: "Broken Array",
            category: "strategy",
            year: 2026,
            rating: 8.6,
            description: "A minimalist tactical RTS where you build a base, manage resources, train squads, and survive escalating attack waves.",
            tags: ["strategy", "rts", "base building", "survival", "waves"],
            strategyType: "RTS Survival",
            fourX: { explore: 58, expand: 76, exploit: 85, exterminate: 83 },
            coverImage: "DONE/_2D Comapagny of Hero/assets/map02.png",
            playUrl: "DONE/_2D Broken Array/index.html",
            changelog: [
                { version: "1.0.0", date: "2026-02-28", notes: ["Initial release"] }
            ]
        },
        {
            id: 4,
            title: "Tactical War",
            category: "strategy",
            year: 2026,
            rating: 8.8,
            description: "A World War II real-time strategy game focused on squad control, map pressure, and tactical battlefield positioning.",
            tags: ["strategy", "rts", "wwii", "squads", "tactics"],
            strategyType: "Tactical RTS",
            fourX: { explore: 64, expand: 71, exploit: 74, exterminate: 91 },
            coverImage: "DONE/_2D Comapagny of Hero/assets/map01.png",
            playUrl: "DONE/_2D Comapagny of Hero/index.html",
            changelog: [
                { version: "0.1.0", date: "2026-02-28", notes: ["Initial playable build"] }
            ]
        },
        {
            id: 5,
            title: "Dungeon Crawler 2D",
            category: "rpg",
            year: 2026,
            rating: 9.0,
            description: "Explore a procedural dungeon, fight enemies in turn-based battles, loot rooms, and level up through endless runs.",
            tags: ["rpg", "dungeon", "turn-based", "loot", "procedural"],
            playUrl: "DONE/_2D Dungeon Crawler/index.html",
            changelog: [
                { version: "1.0.0", date: "2026-02-28", notes: ["Initial release"] }
            ]
        },
        {
            id: 6,
            title: "FreeForce 2D",
            category: "action",
            year: 2026,
            rating: 8.7,
            description: "A side-scrolling action shooter with multiple weapons, enemy types, bosses, power-ups, and score chasing.",
            tags: ["action", "shooter", "bosses", "weapons", "arcade"],
            playUrl: "DONE/_2D FreeForce/index.html",
            changelog: [
                { version: "1.0.0", date: "2026-02-28", notes: ["Initial release"] }
            ]
        },
        {
            id: 7,
            title: "HARDWOOD",
            category: "sports",
            year: 2026,
            rating: 8.8,
            description: "A basketball management game where you build your franchise, set up your team, and guide a season from the front office.",
            tags: ["sports", "manager", "basketball", "team building", "simulation"],
            playUrl: "DONE/_2D HardWood/index.html",
            changelog: [
                { version: "1.0.0", date: "2026-02-28", notes: ["Initial release"] }
            ]
        },
        {
            id: 8,
            title: "NFL Mini Run",
            category: "sports",
            year: 2026,
            rating: 8.8,
            description: "Sprint through defenders, chain touchdowns, grab power-ups, and survive longer each round in this arcade football run game.",
            tags: ["sports", "arcade", "football", "mobile", "score attack"],
            playUrl: "DONE/_2D NFL Sim/index.html",
            changelog: [
                { version: "0.2.0", date: "2026-02-28", notes: ["Added mobile joystick controls", "Added combos, formations, and power-ups"] },
                { version: "0.1.0", date: "2026-02-28", notes: ["Initial playable prototype"] }
            ]
        },
        {
            id: 9,
            title: "City Builder",
            category: "simulation",
            year: 2026,
            rating: 8.7,
            description: "Build and manage your own city. Place roads, houses, shops, and services while balancing power, water, budget, and citizen satisfaction.",
            tags: ["simulation", "city builder", "management", "economy", "mobile"],
            playUrl: "DONE/_2D City Builder/index.html",
            changelog: [
                { version: "1.0.0", date: "2026-03-04", notes: ["Initial release with 11 building types", "Power & water resource system", "Day/night cycle and satisfaction mechanics", "Full mobile support with touch & pinch-to-zoom"] }
            ]
        },
        {
            id: 10,
            title: "Be the King",
            category: "strategy",
            year: 2026,
            rating: 8.9,
            description: "Lead your kingdom from Antiquity to the modern age, expand territory on a tactical world map, and balance economy, science, diplomacy, and war.",
            tags: ["strategy", "kingdom", "empire", "4x", "map"],
            strategyType: "Grand Strategy 4X",
            fourX: { explore: 88, expand: 91, exploit: 86, exterminate: 78 },
            playUrl: "DONE/_2D Be the Kings/index.html",
            changelog: [
                { version: "2.0.0", date: "2026-03-09", notes: ["Moved to DONE catalog", "Improved map/building persistence on load", "Added quick map build interactions"] }
            ]
        },
        {
            id: 11,
            title: "AM3 President Simulator 2D",
            category: "strategy",
            year: 2026,
            rating: 9.1,
            description: "Run a modern nation on a 2D world map: choose monthly policies, handle diplomacy by country, and keep stability through a full presidential term.",
            tags: ["strategy", "president", "politics", "diplomacy", "world map", "simulation"],
            strategyType: "Geo-Political Strategy",
            fourX: { explore: 82, expand: 69, exploit: 89, exterminate: 47 },
            playUrl: "DONE/_2D President Simulator/index.html",
            changelog: [
                { version: "1.0.0", date: "2026-03-09", notes: ["Initial release", "Interactive world map by nation", "Monthly policy and diplomacy systems", "Score reporting to hub"] }
            ]
        },
        {
            id: 12,
            title: "Urban Shadows Simulator",
            category: "strategy",
            year: 2026,
            rating: 9.0,
            description: "A 4-phase simulator campaign: Police, Prison, Gang, and Ninja Assassin. Manage stats, execute actions, and clear each objective to progress.",
            tags: ["strategy", "simulation", "police", "prison", "gang", "ninja", "campaign"],
            strategyType: "Campaign Strategy",
            fourX: { explore: 76, expand: 72, exploit: 81, exterminate: 79 },
            playUrl: "DONE/_2D Urban Shadows Simulator/index.html",
            changelog: [
                { version: "1.0.0", date: "2026-03-09", notes: ["Initial release", "4-phase progression campaign", "Action-based daily simulation", "2D city tactical map", "Score reporting to hub"] }
            ]
        },
        {
            id: 13,
            title: "Adventure Quest: Echoes of the Citadel",
            category: "adventure",
            year: 2026,
            rating: 8.7,
            description: "Explore a large 2D world, complete quest phases, avoid patrol guards, recover the relic, and return to the village alive.",
            tags: ["adventure", "quest", "exploration", "mobile", "story"],
            playUrl: "DONE/_2D Adventure Quest/index.html",
            changelog: [
                { version: "1.0.0", date: "2026-03-09", notes: ["Initial release", "Quest progression with Elder/Key/Gate/Relic", "Desktop and mobile controls", "Score reporting to hub"] }
            ]
        },
        {
            id: 14,
            title: "Bordel Manager 2D",
            category: "simulation",
            year: 2026,
            rating: 8.8,
            description: "Run an adult venue management sim focused on finance, team morale, legal compliance, reputation, and nightly operations.",
            tags: ["simulation", "management", "economy", "business", "mobile"],
            playUrl: "DONE/_2D Bordel Manager/index.html",
            changelog: [
                { version: "1.0.0", date: "2026-03-09", notes: ["Initial release", "Nightly operation simulation", "Compliance/security/reputation systems", "Desktop + mobile support", "Score reporting to hub"] }
            ]
        },
        {
            id: 15,
            title: "Porn Empire Mobile",
            category: "simulation",
            year: 2026,
            rating: 8.9,
            description: "Build and scale an adult media studio empire with daily production, legal compliance, team morale, audience growth, and monetization strategy.",
            tags: ["simulation", "tycoon", "business", "adult", "mobile"],
            playUrl: "DONE/_2D Porn Empire Mobile/index.html",
            changelog: [
                { version: "1.0.0", date: "2026-03-10", notes: ["Initial release", "Mobile-first controls", "Daily management loop", "Risk/event system", "Score reporting to hub"] }
            ]
        },
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
