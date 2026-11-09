(function () {
    const GAMES = [
        {"id":57,"title":"Street Food Rush","category":"simulation","tags":["3d","arcade","cuisine","restaurant","gestion","prototype jouable"],"playUrl":"A Faire/_3D Street Food Rush/index.html","description":"Tiens un stand de cuisine au marché nocturne : prends les commandes, cuis au grill, assemble les menus et sers les clients avant la fin du chrono."},
        {"id":52,"title":"Empire Game","category":"strategy","tags":["stratégie","à revoir"],"playUrl":"A Revoir/_2D Empire Game/index.html","description":"Jeu stratégique à revoir : mécaniques et interface à réévaluer."},
        {"id":53,"title":"Hack n Slash","category":"action","tags":["combat","2d","à revoir"],"playUrl":"A Revoir/_2D Hack n Slash/index.html","description":"Ancienne version à revoir avant validation."},
        {"id":54,"title":"Livre dont vous êtes le héros","category":"adventure","tags":["narration","choix","2d","à revoir"],"playUrl":"A Revoir/_2D Livre dont vous êtes le héros/index.html","description":"Fiction interactive à reprendre et tester."},
        {"id":55,"title":"Sims","category":"simulation","tags":["simulation","2d","à revoir"],"playUrl":"A Revoir/_2D Sims/index.html","description":"Prototype de simulation à revoir."},
        {"id":56,"title":"Blood Eclipse","category":"action","tags":["hack and slash","2d","à revoir"],"playUrl":"A Revoir/_2D_Hack2ndSlash Blood Eclipse/index.html","description":"Projet de combat à revoir ; non certifié terminé."},
        {"id":49,"title":"Étage Zéro","category":"adventure","tags":["horreur","énigmes","enquête","2d","survie"],"playUrl":"A Faire/_2D_3D Etage Zero/index.html","coverImage":"A Faire/_2D_3D Etage Zero/assets/cover.svg","description":"Enquête horrifique 2D : archives, vision spectrale, coffre codé et poursuite dans un étage impossible."},
        {"id":50,"title":"SILENCE 03 — Les Voix du Mur","category":"adventure","tags":["horreur","infiltration","énigmes","2d","survie"],"playUrl":"A Faire/_2D Silence 03/index.html","coverImage":"A Faire/_2D Silence 03/assets/cover.svg","description":"Survival-horror 2D : chaque bruit attire le Gardien. Cachettes, diversions et trois enregistrements à déchiffrer."},
        {"id":51,"title":"NÉRÉIDE — Le Chant du Fond","category":"adventure","tags":["horreur","survie","exploration","énigmes","3d"],"playUrl":"A Faire/_3D Nereide Le Chant du Fond/index.html","coverImage":"A Faire/_3D Nereide Le Chant du Fond/assets/cover.svg","description":"Horreur sous-marine 3D : station explorable, créature, oxygène, sonar, ballast et transmission codée."},
        {"id":23,"title":"No Man's Dawn","category":"action","tags":["survie","exploration","3d"],"playUrl":"A Faire/_3D No Mans Dawn/index.html","description":"Explore une région isolée et reconstruis un refuge."},
        {"id":19,"title":"After Dark","category":"rpg","tags":["visual novel","romance","dialogue","adulte"],"playUrl":"A Faire/_2D After Dark/index.html","description":"Visual novel 2D nocturne à choix et relations."},
        {"id":21,"title":"Hearts of Eden","category":"rpg","tags":["simulation","romance","relations"],"playUrl":"A Faire/_2D Hearts of Eden/index.html","description":"Simulation sociale et relations entre adultes."},
        {"id":25,"title":"The Last Signal","category":"rpg","tags":["horreur","enquete","3d"],"playUrl":"A Faire/_3D The Last Signal/index.html","description":"Une station radio abandonnée cache une transmission inquiétante."},
        {"id":24,"title":"Redline District","category":"sports","tags":["course","voiture","3d"],"playUrl":"A Faire/_3D Redline District/index.html","description":"Courses automobiles sur circuit avec adversaires."},
        {"id":26,"title":"Agence X","category":"strategy","tags":["studio","production","gestion","tycoon","18+"],"playUrl":"A Faire/_2D Agence X/index.html","description":"Dirige un studio de productions pour adultes fictifs : casting, tournages, distribution, contrats et finances."},
        {"id":22,"title":"The Silent Verdict","category":"strategy","tags":["enquete","mystere","deduction"],"playUrl":"A Faire/_2D The Silent Verdict/index.html","description":"Résous trois enquêtes par les preuves et les témoignages."},
        {"id":1,"title":"Artiste Manager","category":"action","tags":["gestion","musique","carriere","simulation"],"playUrl":"DONE/_2D Artiste Manager/index.html","description":"Propulse ton artiste vers le sommet. Gère sa carrière, ses concerts et sa réputation dans l'industrie musicale."},
        {"id":6,"title":"Fighting Legends","category":"action","tags":["combat","versus","legendes","arcade"],"playUrl":"DONE/_2D Fighting Legends/index.html","description":"Incarne des légendes du combat et affronte tes adversaires dans des duels épiques en 2D."},
        {"id":4,"title":"Free Force","category":"action","tags":["combat","arcade","action","reflexes"],"playUrl":"DONE/_2D Free Force/index.html","description":"Affronte des vagues d'ennemis dans un jeu d'action nerveux. Survie, précision et vitesse de réaction."},
        {"id":15,"title":"Hack n Slash v2","category":"action","tags":["hack","slash","action","jeu"],"playUrl":"DONE/_2D Hack n Slash v2/index.html","description":"Reviens dans l'univers de Hack n Slash avec de nouvelles capacités et des défis plus difficiles."},
        {"id":8,"title":"Hero Forces","category":"action","tags":["heros","equipe","combat","cooperation"],"playUrl":"DONE/_2D Hero Forces/index.html","description":"Commande une escouade de héros et repousse les forces du mal dans des missions d'action intenses."},
        {"id":36,"title":"Infernum : Le Rachat","category":"action","tags":["enfer","rédemption","action","choix moraux","dark fantasy"],"playUrl":"A Faire/_2D Infernum Le Rachat/index.html","description":"Affronte les geôliers infernaux et choisis entre sauver une âme ou voler son pouvoir. Tes actes déterminent ton jugement."},
        {"id":34,"title":"Iron Vanguard","category":"action","tags":["mecha","robot","arene","combat"],"playUrl":"DONE/_2D Iron Vanguard/index.html","description":"Combat de méchas TPS, canon et boost."},
        {"id":32,"title":"Shadow Runner","category":"action","tags":["ninja","parkour","infiltration","combat"],"playUrl":"DONE/_2D Shadow Runner/index.html","description":"Ninja TPS avec esquive, combat rapproché et infiltration."},
        {"id":45,"title":"Shooter","category":"action","tags":["prototype","à tester"],"playUrl":"A Faire/_2D Shooter/index.html","description":"Prototype à vérifier : contrôles, gameplay et stabilité non encore validés."},
        {"id":33,"title":"Underground Fighter","category":"action","tags":["combat","boxe","combo","tournoi"],"playUrl":"DONE/_2D Underground Fighter/index.html","description":"Combat technique TPS avec combos, garde et tournois."},
        {"id":35,"title":"Void Breach","category":"action","tags":["espace","survie","creatures","fps"],"playUrl":"DONE/_2D Void Breach/index.html","description":"Station spatiale et créatures, prototype de combat spatial."},
        {"id":47,"title":"Zombie Shooter","category":"action","tags":["prototype","à tester"],"playUrl":"A Faire/_2D Zombie Shooter/index.html","description":"Prototype à vérifier : contrôles, gameplay et stabilité non encore validés."},
        {"id":30,"title":"Anachkel — Le Jeu d'Horreur","category":"adventure","tags":["horreur","fps","survie","exploration","poupée"],"playUrl":"DONE/_2D Anachkel Horror/index.html","description":"Explore un manoir hanté à la première personne, retrouve la clé et les documents, maîtrise ta lampe et survis à Anachkel."},
        {"id":48,"title":"Ashen Bell : Les Trois Veilles","category":"adventure","tags":["horreur","RPG","survie","combat tactique","choix","temps"],"playUrl":"A Faire/_2D Ashen Bell/index.html","description":"Explore un bourg maudit durant trois jours, combats par parties du corps, survie et choix aux conséquences persistantes."},
        {"id":37,"title":"Black Veil","category":"adventure","tags":["horreur","infiltration","survie","TPS","discrétion"],"playUrl":"A Faire/_2D Black Veil/index.html","description":"Traverse un village maudit, cache-toi des Veilleurs et retrouve trois sceaux pour atteindre la chapelle."},
        {"id":29,"title":"Detective Stories FPS","category":"adventure","tags":["detective","fps","enquêtes","preuves","interrogatoires"],"playUrl":"DONE/_2D Detective Stories/index.html","description":"Explore les scènes, interroge les témoins, collecte les indices et prends des décisions fondées sur les preuves."},
        {"id":38,"title":"TOYMARE : The Forgotten Factory","category":"adventure","tags":["horreur","jouets","usine","énigmes","survie"],"playUrl":"A Faire/_2D Toymare The Forgotten Factory/index.html","description":"Explore une usine de jouets abandonnée, manipule ses machines avec deux bras mécaniques et échappe à une mascotte inquiétante."},
        {"id":41,"title":"Mario Like","category":"platformer","tags":["prototype","à tester"],"playUrl":"A Faire/_2D Mario Like/index.html","description":"Prototype à vérifier : contrôles, gameplay et stabilité non encore validés."},
        {"id":17,"title":"Platerformer Challenge","category":"platformer","tags":["plateformer","challenge","precision","reflexes"],"playUrl":"DONE/_2D Plateformer/index.html","description":"Teste tes compétences de plateformer à travers des niveaux remplis de pièges et d'obstacles."},
        {"id":44,"title":"Racing","category":"racing","tags":["prototype","à tester"],"playUrl":"A Faire/_2D Racing/index.html","description":"Prototype à vérifier : contrôles, gameplay et stabilité non encore validés."},
        {"id":20,"title":"Anime Harem","category":"rpg","tags":["anime","simulation","relations"],"playUrl":"DONE/_2D Anime Harem/index.html","description":"Simulation 2D de relations et de personnages."},
        {"id":10,"title":"Dungeon Crawler","category":"rpg","tags":["donjon","exploration","rpg","monstres"],"playUrl":"DONE/_2D Dungeon Crawler/index.html","description":"Plonge dans des donjons sombres et infestés de monstres. Collecte du loot et monte en puissance."},
        {"id":12,"title":"Vampire's Sim","category":"rpg","tags":["vampire","horreur","simulation","nuit"],"playUrl":"DONE/_2D Vampire's Sim/index.html","description":"Incarne un vampire et gère ta survie nocturne. Chasse, séduction et pouvoirs obscurs t'attendent."},
        {"id":31,"title":"Construction Simulator FPS","category":"simulation","tags":["construction","fps","chantier","engins","simulation"],"playUrl":"DONE/_2D Construction Simulator/index.html","description":"Construis des bâtiments à la première personne, collecte des matériaux, conduis une chargeuse et réalise des contrats pour développer ton entreprise."},
        {"id":39,"title":"Gestion Tycoon","category":"simulation","tags":["prototype","à tester"],"playUrl":"A Faire/_2D Gestion Tycoon/index.html","description":"Prototype à vérifier : contrôles, gameplay et stabilité non encore validés."},
        {"id":42,"title":"MineCraft","category":"simulation","tags":["prototype","à tester"],"playUrl":"A Faire/_2D MineCraft/index.html","description":"Prototype à vérifier : contrôles, gameplay et stabilité non encore validés."},
        {"id":28,"title":"Supermarket Empire FPS","category":"simulation","tags":["supermarché","fps","commerce","gestion","caisse"],"playUrl":"DONE/_2D Supermarket Empire/index.html","description":"Gère ton supermarché à la première personne : rayons, stocks, fournisseurs, caisse, clients et employés."},
        {"id":27,"title":"WarLike Police Simulator FPS","category":"simulation","tags":["police","fps","patrouille","enquete","interactions"],"playUrl":"DONE/_2D Police Simulator/index.html","description":"Patrouille dans un quartier en vue subjective, collecte des indices, dialogue avec les témoins et gère tes interventions. Sauvegarde locale."},
        {"id":16,"title":"Basket Sim","category":"sports","tags":["basketball","simulation","equipe","championnat"],"playUrl":"DONE/_2D Basket Sim/index.html","description":"Gère ton équipe de basketball et participe à des championnats compétitifs."},
        {"id":3,"title":"Football Manager","category":"sports","tags":["football","gestion","equipe","championnat"],"playUrl":"DONE/_2D Football Manager/index.html","description":"Entraîne ton équipe, gère les transferts et mène tes joueurs vers le titre du championnat."},
        {"id":14,"title":"Hard Wood","category":"sports","tags":["basketball","arcade","sport","competition"],"playUrl":"DONE/_2D Hard Wood/index.html","description":"Descends sur le parquet et montre tes moves. Basketball arcade rapide et compétitif."},
        {"id":43,"title":"Neo Soccer 2D","category":"sports","tags":["prototype","à tester"],"playUrl":"A Faire/_2D Neo Soccer 2D/index.html","description":"Prototype à vérifier : contrôles, gameplay et stabilité non encore validés."},
        {"id":9,"title":"NFL Sim","category":"sports","tags":["football americain","NFL","simulation","equipe"],"playUrl":"DONE/_2D NFL Sim/index.html","description":"Vis l'expérience du football américain. Gère ton équipe NFL et mène-la jusqu'au Super Bowl."},
        {"id":46,"title":"Tennis Man","category":"sports","tags":["prototype","à tester"],"playUrl":"A Faire/_2D Tennis Man/index.html","description":"Prototype à vérifier : contrôles, gameplay et stabilité non encore validés."},
        {"id":11,"title":"Axis Infinity","category":"strategy","tags":["tour par tour","conquete","strategie","infini"],"playUrl":"DONE/_2D Axis Infinity/index.html","description":"Un jeu de stratégie sans fin où chaque décision compte. Conquiers les axes et domine le plateau."},
        {"id":5,"title":"Be The King","category":"strategy","tags":["royaute","strategie","empire","politique"],"playUrl":"DONE/_2D Be the Kings/index.html","description":"Construis ton royaume, lève des armées et étends ton empire. Le trône t'attend — sauras-tu le garder ?"},
        {"id":7,"title":"City Builder","category":"strategy","tags":["ville","construction","gestion","urbanisme"],"playUrl":"DONE/_2D City Builder/index.html","description":"Conçois et développe ta ville de zéro. Gère les ressources, les habitants et les infrastructures."},
        {"id":40,"title":"GodSworm","category":"strategy","tags":["prototype","à tester"],"playUrl":"A Faire/_2D GodSworm/index.html","description":"Prototype à vérifier : contrôles, gameplay et stabilité non encore validés."},
        {"id":18,"title":"Iron Meridian: Greyfall","category":"strategy","tags":["tactique","escouades","science-fiction militaire","fictif","missions"],"playUrl":"DONE/_2D Iron Meridian/index.html","description":"Dirige le commando Astra dans une opération fictive : sécurise trois secteurs, préserve tes unités et organise une extraction."},
        {"id":13,"title":"Tower Defense","category":"strategy","tags":["defense","tourelles","vagues","strategie"],"playUrl":"DONE/_2D Tower Defense/index.html","description":"Place tes tourelles et défends ta base contre des vagues d'ennemis de plus en plus puissants."},
        {"id":2,"title":"War Zone Commander","category":"strategy","tags":["guerre","commandement","tactique","militaire"],"playUrl":"DONE/_2D War Zone Commander/index.html","description":"Prends le commandement d'une armée sur le champ de bataille. Planifie tes attaques et écrase l'ennemi."}
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