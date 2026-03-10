
(function () {
    "use strict";

    const SAVE_KEY = "wgc_president_sim_save_v2";
    const SAVE_VERSION = 2;
    const HUB_GAME_ID = 11;

    const MONTHS = [
        "Janvier", "Fevrier", "Mars", "Avril", "Mai", "Juin",
        "Juillet", "Aout", "Septembre", "Octobre", "Novembre", "Decembre"
    ];

    const NATIONS = [
        { id: "canada", name: "Canada", region: "Amerique du Nord", population: 41, economy: 86, military: 62, industry: 74, science: 81, institutions: 79, climateRisk: 44 },
        { id: "usa", name: "Etats-Unis", region: "Amerique du Nord", population: 340, economy: 100, military: 98, industry: 92, science: 94, institutions: 68, climateRisk: 57 },
        { id: "mexico", name: "Mexique", region: "Amerique du Nord", population: 131, economy: 68, military: 58, industry: 59, science: 50, institutions: 45, climateRisk: 66 },
        { id: "brazil", name: "Bresil", region: "Amerique du Sud", population: 216, economy: 74, military: 67, industry: 63, science: 58, institutions: 49, climateRisk: 71 },
        { id: "argentina", name: "Argentine", region: "Amerique du Sud", population: 46, economy: 62, military: 54, industry: 57, science: 55, institutions: 47, climateRisk: 59 },
        { id: "uk", name: "Royaume-Uni", region: "Europe", population: 69, economy: 84, military: 70, industry: 73, science: 82, institutions: 78, climateRisk: 42 },
        { id: "france", name: "France", region: "Europe", population: 65, economy: 82, military: 73, industry: 72, science: 81, institutions: 74, climateRisk: 47 },
        { id: "germany", name: "Allemagne", region: "Europe", population: 84, economy: 88, military: 69, industry: 86, science: 85, institutions: 82, climateRisk: 40 },
        { id: "russia", name: "Russie", region: "Eurasie", population: 143, economy: 70, military: 87, industry: 71, science: 66, institutions: 39, climateRisk: 64 },
        { id: "egypt", name: "Egypte", region: "Afrique", population: 111, economy: 61, military: 59, industry: 49, science: 43, institutions: 36, climateRisk: 78 },
        { id: "nigeria", name: "Nigeria", region: "Afrique", population: 232, economy: 58, military: 52, industry: 44, science: 39, institutions: 29, climateRisk: 81 },
        { id: "india", name: "Inde", region: "Asie", population: 1430, economy: 83, military: 76, industry: 78, science: 72, institutions: 58, climateRisk: 73 },
        { id: "china", name: "Chine", region: "Asie", population: 1410, economy: 95, military: 92, industry: 94, science: 88, institutions: 60, climateRisk: 62 },
        { id: "japan", name: "Japon", region: "Asie", population: 124, economy: 85, military: 66, industry: 80, science: 90, institutions: 83, climateRisk: 46 },
        { id: "indonesia", name: "Indonesie", region: "Asie", population: 282, economy: 67, military: 57, industry: 55, science: 48, institutions: 43, climateRisk: 84 },
        { id: "australia", name: "Australie", region: "Oceanie", population: 27, economy: 78, military: 60, industry: 66, science: 76, institutions: 74, climateRisk: 52 }
    ];

    const POLICIES = [
        { id: "tax_reform", title: "Reforme fiscale progressive", desc: "Recettes publiques en hausse, impact social mitige.", effects: { treasury: 420, approval: -3, stability: 1, industry: -1 } },
        { id: "infra_boost", title: "Plan infrastructures", desc: "Routes, ports, rails et fibre sur tout le territoire.", effects: { treasury: -560, gdp: 7, industry: 5, approval: 2, stability: 2 } },
        { id: "defense_doctrine", title: "Doctrine de defense", desc: "Modernisation militaire acceleree.", effects: { treasury: -410, security: 5, armyTraining: 4, diplomacy: -3 } },
        { id: "social_shield", title: "Bouclier social", desc: "Aides publiques renforcees pour les menages.", effects: { treasury: -480, approval: 8, stability: 4, debtPressure: 2 } },
        { id: "green_transition", title: "Transition verte", desc: "Soutien massif au renouvelable et au rail propre.", effects: { treasury: -500, ecology: 9, diplomacy: 4, industry: 2 } },
        { id: "market_opening", title: "Ouverture des marches", desc: "Deregulation et attractivite economique.", effects: { treasury: 260, gdp: 5, approval: -4, stability: -2, industry: 2 } },
        { id: "innovation_fund", title: "Fonds innovation", desc: "Financement des universites et startups strategiques.", effects: { treasury: -360, science: 8, gdp: 3, diplomacy: 2 } },
        { id: "security_law", title: "Securite interieure", desc: "Lutte anti-criminalite et modernisation policiere.", effects: { treasury: -240, security: 8, stability: 3, approval: -2 } },
        { id: "export_push", title: "Strategie export", desc: "Soutien des filieres industrielles a l'export.", effects: { treasury: 210, gdp: 4, diplomacy: 3, industry: 4 } },
        { id: "public_health", title: "Plan hopitaux", desc: "Capacites hospitalieres et recherche medicale.", effects: { treasury: -390, approval: 5, stability: 3, science: 3 } },
        { id: "education_drive", title: "Reforme education", desc: "Ecoles, universites et formation technique.", effects: { treasury: -370, science: 6, approval: 3, industry: 2 } },
        { id: "energy_shock", title: "Subventions energie", desc: "Protection des menages face aux prix de l'energie.", effects: { treasury: -340, approval: 4, stability: 3, ecology: -2 } }
    ];

    const LAWS = [
        {
            id: "civil_protection_act",
            title: "Loi de protection civile",
            desc: "Renforce prevention, evacuation et secours en cas d'intemperies.",
            threshold: 53,
            onPass: { effects: { treasury: -260, security: 6, stability: 2 }, modifiers: { climateShield: 0.16, healthSystem: 0.06 } },
            onFail: { effects: { approval: -2, stability: -2 } }
        },
        {
            id: "national_service_act",
            title: "Service national moderne",
            desc: "Reserve operationnelle et formation civique.",
            threshold: 55,
            onPass: { effects: { treasury: -190, security: 4, armyReadiness: 6 }, modifiers: { armyEfficiency: 0.08, lawAndOrder: 0.04 } },
            onFail: { effects: { approval: -3 } }
        },
        {
            id: "anti_corruption_pack",
            title: "Paquet anti-corruption",
            desc: "Transparence budgetaire et controle des contrats publics.",
            threshold: 58,
            onPass: { effects: { approval: 4, stability: 3, treasury: 220 }, modifiers: { taxEfficiency: 0.1, judiciaryTrust: 0.08 } },
            onFail: { effects: { stability: -2, approval: -2 } }
        },
        {
            id: "education_republic_act",
            title: "Loi education nationale",
            desc: "Investissement long terme dans le capital humain.",
            threshold: 51,
            onPass: { effects: { treasury: -280, science: 5, approval: 2 }, modifiers: { innovationBoost: 0.14 } },
            onFail: { effects: { approval: -1 } }
        },
        {
            id: "strategic_industry_act",
            title: "Loi de souverainete industrielle",
            desc: "Relocalisation de filieres critiques.",
            threshold: 56,
            onPass: { effects: { treasury: -350, industry: 6, gdp: 2 }, modifiers: { tradeBonus: 0.07 } },
            onFail: { effects: { treasury: -80 } }
        },
        {
            id: "green_constitution",
            title: "Constitution ecologique",
            desc: "Normes climatiques et transition energetique acceleree.",
            threshold: 60,
            onPass: { effects: { treasury: -310, ecology: 7, diplomacy: 4 }, modifiers: { energyTransition: 0.2, climateShield: 0.08 } },
            onFail: { effects: { approval: -2, diplomacy: -1 } }
        },
        {
            id: "health_security_act",
            title: "Loi de securite sanitaire",
            desc: "Stocks strategiques et protocoles de crise sanitaire.",
            threshold: 52,
            onPass: { effects: { treasury: -220, security: 3, approval: 2 }, modifiers: { healthSystem: 0.12 } },
            onFail: { effects: { stability: -2 } }
        },
        {
            id: "digital_sovereignty_act",
            title: "Loi de souverainete numerique",
            desc: "Protection cyber et infrastructures cloud nationales.",
            threshold: 54,
            onPass: { effects: { treasury: -240, security: 4, science: 2 }, modifiers: { judiciaryTrust: 0.04, innovationBoost: 0.08 } },
            onFail: { effects: { security: -1 } }
        },
        {
            id: "labor_balance_act",
            title: "Loi d'equilibre du travail",
            desc: "Flexibilite encadree et securisation des parcours.",
            threshold: 50,
            onPass: { effects: { approval: 3, stability: 2, gdp: 2 }, modifiers: { socialProtection: 0.1 } },
            onFail: { effects: { approval: -2 } }
        }
    ];

    const MONUMENTS = [
        { id: "great_dam", title: "Grand Barrage National", desc: "Production d'energie et reserve d'eau strategique.", upfrontTreasury: 1800, upfrontIndustry: 8, duration: 6, completionEffects: { stability: 3, security: 2 }, passive: { treasury: 120, ecology: -1 }, modifiers: { climateShield: 0.08 } },
        { id: "space_center", title: "Centre Spatial Republique", desc: "Prestige et avancee technologique.", upfrontTreasury: 2200, upfrontIndustry: 10, duration: 7, completionEffects: { diplomacy: 4, science: 5 }, passive: { science: 1, gdp: 1 }, modifiers: { innovationBoost: 0.12 } },
        { id: "hospital_network", title: "Reseau Hospitalier National", desc: "Capacite medicale et reponse rapide aux crises.", upfrontTreasury: 1700, upfrontIndustry: 7, duration: 5, completionEffects: { approval: 4, security: 2 }, passive: { stability: 1 }, modifiers: { healthSystem: 0.16 } },
        { id: "fortress_line", title: "Ligne de Defense Integrale", desc: "Base militaire, defense aerienne et radar.", upfrontTreasury: 2100, upfrontIndustry: 9, duration: 6, completionEffects: { security: 6, armyTraining: 6 }, passive: { stability: 1 }, modifiers: { armyEfficiency: 0.14 } },
        { id: "mega_port", title: "Mega Port Continental", desc: "Hub logistique pour le commerce mondial.", upfrontTreasury: 2000, upfrontIndustry: 8, duration: 6, completionEffects: { gdp: 4, diplomacy: 2 }, passive: { treasury: 140, industry: 1 }, modifiers: { tradeBonus: 0.12 } },
        { id: "green_wall", title: "Ceinture Verte Nationale", desc: "Protection des sols et adaptation climatique.", upfrontTreasury: 1500, upfrontIndustry: 6, duration: 5, completionEffects: { ecology: 8, approval: 2 }, passive: { ecology: 1 }, modifiers: { climateShield: 0.14, energyTransition: 0.08 } },
        { id: "high_speed_grid", title: "Reseau Ferroviaire Haute Vitesse", desc: "Mobilite, productivite et cohesion territoriale.", upfrontTreasury: 2400, upfrontIndustry: 12, duration: 8, completionEffects: { gdp: 5, stability: 3 }, passive: { treasury: 90, industry: 1 }, modifiers: { taxEfficiency: 0.06 } }
    ];

    const ARMY_UNITS = [
        { id: "infantry", name: "Infanterie", costTreasury: 90, costIndustry: 1, manpower: 0.01, power: 2.2, upkeep: 8 },
        { id: "mechanized", name: "Brigade mecanisee", costTreasury: 230, costIndustry: 2, manpower: 0.008, power: 5.3, upkeep: 16 },
        { id: "airwing", name: "Escadron aerien", costTreasury: 380, costIndustry: 3, manpower: 0.004, power: 8.4, upkeep: 24 },
        { id: "naval", name: "Groupe naval", costTreasury: 460, costIndustry: 3, manpower: 0.004, power: 9.1, upkeep: 28 },
        { id: "drone", name: "Unite drone", costTreasury: 260, costIndustry: 2, manpower: 0.002, power: 6.2, upkeep: 14 },
        { id: "missile_defense", name: "Batterie antimissile", costTreasury: 520, costIndustry: 4, manpower: 0.003, power: 10.2, upkeep: 30 }
    ];

    const MILITARY_OPERATIONS = [
        {
            id: "border_drill",
            title: "Exercice frontalier",
            desc: "Demonstration de force et preparation tactique.",
            costTreasury: 180,
            difficulty: 85,
            success: { effects: { security: 4, diplomacy: 1, armyReadiness: 6 } },
            failure: { effects: { treasury: -120, approval: -2, armyReadiness: -3 } }
        },
        {
            id: "counter_terror",
            title: "Operation anti-terroriste",
            desc: "Neutralisation de cellules hostiles sur le territoire.",
            costTreasury: 240,
            difficulty: 95,
            success: { effects: { security: 6, stability: 3, approval: 2 } },
            failure: { effects: { security: -5, stability: -3, approval: -3 } }
        },
        {
            id: "peacekeeping",
            title: "Mission de maintien de paix",
            desc: "Operation multinationale pour stabiliser une zone voisine.",
            costTreasury: 260,
            difficulty: 92,
            success: { effects: { diplomacy: 6, approval: 2, armyTraining: 3 } },
            failure: { effects: { diplomacy: -4, approval: -2, armyTraining: -2 } }
        },
        {
            id: "cyber_shield",
            title: "Bouclier cyber",
            desc: "Contre-mesures actives contre les attaques numeriques.",
            costTreasury: 210,
            difficulty: 88,
            success: { effects: { security: 5, science: 2, diplomacy: 2 } },
            failure: { effects: { security: -3, treasury: -140 } }
        },
        {
            id: "humanitarian_airlift",
            title: "Pont aerien humanitaire",
            desc: "Projection rapide de secours sur zone sinistree.",
            costTreasury: 190,
            difficulty: 82,
            success: { effects: { approval: 3, diplomacy: 4, stability: 2 } },
            failure: { effects: { treasury: -90, approval: -1 } }
        }
    ];

    const WEATHER_EVENTS = [
        { id: "storm", name: "Tempete majeure", seasons: ["printemps", "automne", "hiver"], base: 4.2, effects: { treasury: -320, gdp: -2, stability: -2 } },
        { id: "flood", name: "Inondations", seasons: ["printemps", "automne"], base: 4.8, effects: { treasury: -360, stability: -3, approval: -2, population: -0.02 } },
        { id: "heatwave", name: "Canicule", seasons: ["ete"], base: 4.4, effects: { treasury: -280, gdp: -2, ecology: -3, approval: -2 } },
        { id: "drought", name: "Secheresse", seasons: ["ete"], base: 5.2, effects: { treasury: -340, gdp: -3, approval: -2, ecology: -2 } },
        { id: "wildfire", name: "Incendies geants", seasons: ["ete"], base: 5.6, effects: { treasury: -400, stability: -3, ecology: -4, population: -0.03 } },
        { id: "coldwave", name: "Vague de froid", seasons: ["hiver"], base: 4.1, effects: { treasury: -250, gdp: -2, approval: -1 } },
        { id: "cyclone", name: "Cyclone tropical", seasons: ["ete", "automne"], base: 6.1, effects: { treasury: -520, stability: -4, approval: -3, population: -0.04 } }
    ];

    const GLOBAL_EVENTS = [
        {
            title: "Crise financiere regionale",
            text: "Les marches voisins chutent. Les investisseurs attendent ta reaction.",
            choices: [
                { label: "Injecter un plan de stabilisation", summary: "Couteux mais rassurant", effects: { treasury: -420, stability: 4, gdp: 2 } },
                { label: "Attendre et observer", summary: "Moins de cout immediat", effects: { treasury: 80, gdp: -3, approval: -2 } }
            ]
        },
        {
            title: "Affaire de corruption d'Etat",
            text: "Un haut responsable est implique dans un scandale public.",
            choices: [
                { label: "Poursuites judiciaires immediates", summary: "Image de fermete", effects: { approval: 4, stability: 2, treasury: -120 } },
                { label: "Gestion interne discrete", summary: "Evite le choc institutionnel", effects: { approval: -5, stability: -2, diplomacy: -1 } }
            ]
        },
        {
            title: "Rupture mondiale des chaines logistiques",
            text: "Des blocages maritimes menacent l'approvisionnement national.",
            choices: [
                { label: "Activer les stocks strategiques", summary: "Protege l'economie", effects: { treasury: -240, gdp: 1, stability: 2 } },
                { label: "Laisser le marche s'adapter", summary: "Moins de depense publique", effects: { treasury: 120, gdp: -2, approval: -2 } }
            ]
        },
        {
            title: "Manifestations nationales",
            text: "Plusieurs villes connaissent des mobilisations massives.",
            choices: [
                { label: "Conceder un paquet social", summary: "Apaise la rue", effects: { treasury: -300, approval: 6, stability: 4 } },
                { label: "Maintenir la ligne dure", summary: "Autorite immediate", effects: { security: 3, approval: -6, stability: -2 } }
            ]
        },
        {
            title: "Pandemie emergente",
            text: "Un nouveau pathogene se propage rapidement. Le systeme de sante est sous pression.",
            choices: [
                { label: "Declencher le plan sanitaire national", summary: "Couteux mais efficace", effects: { treasury: -480, stability: 3, approval: 2, security: 2 } },
                { label: "Gerer au fil de l'eau", summary: "Economise mais risque", effects: { treasury: -120, approval: -5, stability: -4 } }
            ]
        },
        {
            title: "Cyberattaque massive sur les infrastructures",
            text: "Des hackers d'origine etrangere ciblent les systemes energetiques et bancaires.",
            choices: [
                { label: "Activer la cellule de crise cyber", summary: "Contre-mesures actives", effects: { treasury: -280, security: 5, stability: 2, science: 1 } },
                { label: "Minimiser publiquement l'incident", summary: "Evite la panique mais laisse des failles", effects: { treasury: -80, security: -4, diplomacy: -2 } }
            ]
        },
        {
            title: "Crise migratoire aux frontieres",
            text: "Des flux migratoires importants arrivent aux frontieres. La presse et l'opposition reagissent.",
            choices: [
                { label: "Politique d'integration structuree", summary: "Investissement a long terme", effects: { treasury: -360, stability: 2, approval: -2, diplomacy: 4 } },
                { label: "Renforcer les controles frontaliers", summary: "Rassure l'opinion courte terme", effects: { treasury: -180, security: 3, approval: 3, diplomacy: -4 } }
            ]
        },
        {
            title: "Seisme majeur en zone habitee",
            text: "Un seisme de magnitude elevee frappe une region densement peuplee du pays.",
            choices: [
                { label: "Mobiliser l'armee et les secours nationaux", summary: "Intervention directe et massive", effects: { treasury: -420, approval: 4, security: 2, stability: 2 } },
                { label: "Coordonner avec les ONG internationales", summary: "Moins couteux mais moins de controle", effects: { treasury: -180, diplomacy: 3, approval: 1, stability: -1 } }
            ]
        },
        {
            title: "Greve generale nationale",
            text: "Les syndicats lancent un arret de travail reconductible. L'economie ralentit.",
            choices: [
                { label: "Ouvrir des negociations tripartites", summary: "Dialogue et compromis", effects: { treasury: -240, approval: 4, stability: 5, gdp: -2 } },
                { label: "Prendre un decret de requisition", summary: "Reprise forcee mais tensions durables", effects: { security: 2, approval: -7, stability: -3, gdp: 1 } }
            ]
        },
        {
            title: "Accord de libre-echange majeur propose",
            text: "Un bloc regional propose un accord commercial ambitieux. L'industrie est partagee.",
            choices: [
                { label: "Signer l'accord integralement", summary: "Dynamise l'export et la diplomatie", effects: { treasury: 310, gdp: 4, diplomacy: 5, industry: -2 } },
                { label: "Negocier des clauses de protection", summary: "Moins de gains mais preserves", effects: { treasury: 140, gdp: 2, diplomacy: 2, industry: 2 } }
            ]
        }
    ];

    const DIPLO_ACTIONS = {
        trade: { label: "Accord commercial", cost: 180, effects: { relationTarget: 12, treasury: 220, gdp: 3, diplomacy: 2 } },
        aid: { label: "Aide economique", cost: 260, effects: { relationTarget: 18, approval: 1, diplomacy: 4 } },
        climate: { label: "Pacte climat", cost: 200, effects: { relationTarget: 10, ecology: 5, diplomacy: 4 } },
        alliance: { label: "Traite d'alliance", cost: 320, minRelation: 45, effects: { relationTarget: 16, security: 3, diplomacy: 5 } },
        intel: { label: "Partage de renseignement", cost: 170, minRelation: 15, effects: { relationTarget: 8, security: 4, diplomacy: 2 } },
        sanction: { label: "Sanctions", cost: 0, effects: { relationTarget: -18, diplomacy: -4, treasury: 80 } },
        pressure: { label: "Pression militaire", cost: 210, effects: { relationTarget: -24, security: 2, diplomacy: -6, armyReadiness: 3 } }
    };

    const DOCTRINES = [
        {
            id: "balanced",
            name: "Cap equilibre",
            desc: "Approche prudente sur economie, securite et climat.",
            tags: ["stability", "social"],
            startEffects: { stability: 2, approval: 2 },
            modifiers: { socialProtection: 0.04, judiciaryTrust: 0.03 }
        },
        {
            id: "growth",
            name: "Croissance offensive",
            desc: "Priorite PIB et industrie, au prix d'un risque social/climat plus fort.",
            tags: ["economy", "industry"],
            startEffects: { treasury: 520, gdp: 5, industry: 4, ecology: -3, approval: -2 },
            modifiers: { taxEfficiency: 0.06, tradeBonus: 0.08 }
        },
        {
            id: "fortress",
            name: "Forteresse nationale",
            desc: "Securite, armee et resilience geostrategique au premier plan.",
            tags: ["security", "military"],
            startEffects: { security: 6, approval: -1, diplomacy: -3, armyReadiness: 8, armyTraining: 4 },
            modifiers: { armyEfficiency: 0.1, lawAndOrder: 0.06 }
        },
        {
            id: "green",
            name: "Transition souveraine",
            desc: "Ecologie, innovation et diplomatie multilatetale.",
            tags: ["climate", "science"],
            startEffects: { ecology: 9, diplomacy: 4, science: 4, treasury: -320 },
            modifiers: { climateShield: 0.1, energyTransition: 0.14, innovationBoost: 0.05 }
        }
    ];

    const OBJECTIVE_POOL = [
        {
            id: "fiscal_buffer",
            title: "Stabilite budgetaire",
            desc: "Maintenir le Tresor sur une base solide.",
            metric: "treasury",
            comparator: "gte",
            target: 5000,
            unit: "credits",
            tags: ["economy"],
            reward: { treasury: 260, stability: 2 },
            penalty: { treasury: -260, approval: -2 }
        },
        {
            id: "growth_target",
            title: "Dynamique PIB",
            desc: "Conserver une croissance economique elevee.",
            metric: "gdp",
            comparator: "gte",
            target: 100,
            unit: "index",
            tags: ["economy", "industry"],
            reward: { treasury: 180, approval: 1, gdp: 1 },
            penalty: { gdp: -2, approval: -2 }
        },
        {
            id: "social_cohesion",
            title: "Cohesion sociale",
            desc: "Garder popularite et stabilite a bon niveau.",
            metric: "approval",
            comparator: "gte",
            target: 52,
            unit: "%",
            tags: ["social", "stability"],
            reward: { stability: 2, approval: 2 },
            penalty: { stability: -3, approval: -2 }
        },
        {
            id: "institutional_order",
            title: "Ordre institutionnel",
            desc: "Eviter les tensions internes prolongees.",
            metric: "stability",
            comparator: "gte",
            target: 54,
            unit: "%",
            tags: ["stability", "security"],
            reward: { approval: 1, stability: 3 },
            penalty: { stability: -4, security: -2 }
        },
        {
            id: "security_net",
            title: "Bouclier securitaire",
            desc: "Maintenir une securite interieure robuste.",
            metric: "security",
            comparator: "gte",
            target: 56,
            unit: "%",
            tags: ["security", "military"],
            reward: { security: 3, approval: 1 },
            penalty: { security: -4, approval: -2 }
        },
        {
            id: "green_baseline",
            title: "Socle ecologique",
            desc: "Limiter la degradation environnementale.",
            metric: "ecology",
            comparator: "gte",
            target: 50,
            unit: "%",
            tags: ["climate"],
            reward: { ecology: 3, diplomacy: 1 },
            penalty: { ecology: -3, treasury: -160 }
        },
        {
            id: "innovation_track",
            title: "Piste innovation",
            desc: "Elever le niveau scientifique national.",
            metric: "science",
            comparator: "gte",
            target: 72,
            unit: "index",
            tags: ["science"],
            reward: { science: 2, gdp: 1, approval: 1 },
            penalty: { science: -2, gdp: -1 }
        },
        {
            id: "industrial_depth",
            title: "Profondeur industrielle",
            desc: "Soutenir la base productive locale.",
            metric: "industry",
            comparator: "gte",
            target: 68,
            unit: "index",
            tags: ["industry", "economy"],
            reward: { industry: 2, treasury: 140 },
            penalty: { industry: -2, treasury: -120 }
        },
        {
            id: "allied_network",
            title: "Reseau d'alliance",
            desc: "Maintenir des relations exterieures constructives.",
            metric: "avgRelations",
            comparator: "gte",
            target: 5,
            unit: "rel",
            tags: ["diplomacy"],
            reward: { diplomacy: 3, treasury: 130 },
            penalty: { diplomacy: -3, relationsAll: -4 }
        },
        {
            id: "force_projection",
            title: "Projection militaire",
            desc: "Conserver un niveau credible de puissance armee.",
            metric: "armyPower",
            comparator: "gte",
            target: 1250,
            unit: "power",
            tags: ["military", "security"],
            reward: { security: 2, armyReadiness: 3 },
            penalty: { security: -3, armyReadiness: -3 }
        },
        {
            id: "debt_watch",
            title: "Controle de la dette",
            desc: "Limiter la pression de dette publique.",
            metric: "debtPressure",
            comparator: "lte",
            target: 22,
            unit: "index",
            tags: ["economy", "stability"],
            reward: { treasury: 180, approval: 1 },
            penalty: { debtPressure: 4, approval: -2, stability: -2 }
        },
        {
            id: "legislative_output",
            title: "Production legislative",
            desc: "Consolider le cadre legal du mandat.",
            metric: "lawsEnacted",
            comparator: "gte",
            target: 2,
            unit: "laws",
            tags: ["stability", "social"],
            reward: { stability: 2, approval: 1, diplomacy: 1 },
            penalty: { approval: -1, stability: -2 }
        }
    ];

    const dom = {
        setupScreen: document.getElementById("setup-screen"),
        startNation: document.getElementById("start-nation"),
        startDoctrine: document.getElementById("start-doctrine"),
        startGameBtn: document.getElementById("start-game-btn"),
        gameUi: document.getElementById("game-ui"),
        nationName: document.getElementById("nation-name"),
        dateLabel: document.getElementById("date-label"),
        policyCards: document.getElementById("policy-cards"),
        lawCards: document.getElementById("law-cards"),
        monumentCards: document.getElementById("monument-cards"),
        projectStatus: document.getElementById("project-status"),
        projectBadge: document.getElementById("project-badge"),
        turnLog: document.getElementById("turn-log"),
        endTurnBtn: document.getElementById("end-turn-btn"),
        saveBtn: document.getElementById("save-btn"),
        loadBtn: document.getElementById("load-btn"),
        selectedTitle: document.getElementById("selected-title"),
        selectedDesc: document.getElementById("selected-desc"),
        selectedStats: document.getElementById("selected-stats"),
        diplomacyUsage: document.getElementById("diplomacy-usage"),
        militaryUsage: document.getElementById("military-usage"),
        policyUsage: document.getElementById("policy-usage"),
        lawUsage: document.getElementById("law-usage"),
        weatherBadge: document.getElementById("weather-badge"),
        diploButtons: Array.from(document.querySelectorAll(".diplo-btn")),
        mapNations: Array.from(document.querySelectorAll("#world-map [data-nation]")),
        armyOverview: document.getElementById("army-overview"),
        recruitCards: document.getElementById("recruit-cards"),
        operationCards: document.getElementById("operation-cards"),
        eventModal: document.getElementById("event-modal"),
        eventTitle: document.getElementById("event-title"),
        eventText: document.getElementById("event-text"),
        eventChoices: document.getElementById("event-choices"),
        gameOverModal: document.getElementById("gameover-modal"),
        gameOverTitle: document.getElementById("gameover-title"),
        gameOverText: document.getElementById("gameover-text"),
        restartBtn: document.getElementById("restart-btn"),
        objectiveDue: document.getElementById("objective-due"),
        objectiveList: document.getElementById("objective-list"),
        riskOverview: document.getElementById("risk-overview"),
        kpiTreasury: document.getElementById("kpi-treasury"),
        kpiGdp: document.getElementById("kpi-gdp"),
        kpiApproval: document.getElementById("kpi-approval"),
        kpiStability: document.getElementById("kpi-stability"),
        kpiMilitary: document.getElementById("kpi-military"),
        kpiDiplomacy: document.getElementById("kpi-diplomacy"),
        kpiEcology: document.getElementById("kpi-ecology"),
        kpiSecurity: document.getElementById("kpi-security"),
        kpiPopulation: document.getElementById("kpi-population"),
        kpiIndustry: document.getElementById("kpi-industry"),
        kpiScience: document.getElementById("kpi-science"),
        kpiScore: document.getElementById("kpi-score")
    };

    let state = createInitialState();

    function createInitialState() {
        return {
            version: SAVE_VERSION,
            started: false,
            gameOver: false,
            turn: 1,
            monthIndex: 0,
            year: 2026,
            playerNationId: null,
            selectedNationId: null,
            doctrineId: "balanced",
            usedDiplomacy: false,
            usedMilitaryAction: false,
            usedLawVote: false,
            policyOptions: [],
            selectedPolicyId: null,
            lawOptions: [],
            pendingEvent: null,
            stats: null,
            relations: {},
            foreign: {},
            lawsEnacted: [],
            modifiers: {
                taxEfficiency: 0,
                tradeBonus: 0,
                climateShield: 0,
                armyEfficiency: 0,
                lawAndOrder: 0,
                innovationBoost: 0,
                healthSystem: 0,
                judiciaryTrust: 0,
                energyTransition: 0,
                socialProtection: 0
            },
            monuments: { built: [], activeProject: null },
            army: {
                units: { infantry: 0, mechanized: 0, airwing: 0, naval: 0, drone: 0, missile_defense: 0 },
                readiness: 50,
                training: 50,
                warFatigue: 0,
                lastUpkeep: 0
            },
            objectives: {
                activeIds: [],
                nextEvaluationTurn: 3,
                successCount: 0,
                failCount: 0,
                lastReport: "Aucun bilan trimestriel."
            },
            weather: { lastLabel: "Calme", lastSeverity: 0, alerts: 0 },
            log: []
        };
    }

    function clamp(value, min, max) {
        return Math.min(max, Math.max(min, value));
    }

    function randInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function deepClone(value) {
        return JSON.parse(JSON.stringify(value));
    }

    function formatNumber(value) {
        return Math.round(value).toLocaleString("fr-FR");
    }

    function monthSeason(monthIndex) {
        if ([11, 0, 1].includes(monthIndex)) return "hiver";
        if ([2, 3, 4].includes(monthIndex)) return "printemps";
        if ([5, 6, 7].includes(monthIndex)) return "ete";
        return "automne";
    }

    function nationById(id) {
        return NATIONS.find((n) => n.id === id) || null;
    }

    function lawById(id) {
        return LAWS.find((law) => law.id === id) || null;
    }

    function monumentById(id) {
        return MONUMENTS.find((m) => m.id === id) || null;
    }

    function unitById(id) {
        return ARMY_UNITS.find((unit) => unit.id === id) || null;
    }

    function operationById(id) {
        return MILITARY_OPERATIONS.find((op) => op.id === id) || null;
    }

    function doctrineById(id) {
        return DOCTRINES.find((item) => item.id === id) || DOCTRINES[0];
    }

    function objectiveById(id) {
        return OBJECTIVE_POOL.find((item) => item.id === id) || null;
    }

    function objectiveMetricValue(objective) {
        if (!objective || !state.stats) return 0;
        const s = state.stats;

        switch (objective.metric) {
            case "avgRelations":
                return averageRelations();
            case "armyPower":
                return computeArmyPower();
            case "lawsEnacted":
                return state.lawsEnacted.length;
            case "debtPressure":
                return s.debtPressure;
            default:
                return Number(s[objective.metric] || 0);
        }
    }

    function objectivePassed(objective) {
        const value = objectiveMetricValue(objective);
        if (objective.comparator === "lte") return value <= objective.target;
        return value >= objective.target;
    }

    function objectiveValueLabel(objective, value) {
        if (objective.unit === "credits") return formatNumber(value);
        if (objective.unit === "%") return `${Math.round(value)}%`;
        if (objective.unit === "laws") return `${Math.round(value)} lois`;
        return `${Math.round(value)}`;
    }

    function relationLabel(value) {
        if (value >= 55) return "Allie potentiel";
        if (value >= 25) return "Cooperation";
        if (value >= -24) return "Neutre";
        if (value >= -54) return "Tendu";
        return "Hostile";
    }

    function relationColor(value) {
        if (value >= 40) return "#2cc58e";
        if (value >= 10) return "#68d7a9";
        if (value <= -55) return "#e86460";
        if (value <= -20) return "#f28b68";
        return "#ffcf5d";
    }

    function averageRelations() {
        const values = Object.keys(state.relations)
            .filter((id) => id !== state.playerNationId)
            .map((id) => state.relations[id]);
        if (!values.length) return 0;
        return values.reduce((sum, value) => sum + value, 0) / values.length;
    }

    function computeArmyPower() {
        const units = state.army.units;
        let raw = 0;
        ARMY_UNITS.forEach((unit) => {
            raw += (units[unit.id] || 0) * unit.power;
        });

        const readinessFactor = 0.65 + state.army.readiness / 180;
        const trainingFactor = 1 + state.army.training / 250;
        const lawFactor = 1 + state.modifiers.armyEfficiency;
        return Math.max(1, Math.round(raw * readinessFactor * trainingFactor * lawFactor));
    }

    function computeArmyUpkeep() {
        let upkeep = 0;
        ARMY_UNITS.forEach((unit) => {
            upkeep += (state.army.units[unit.id] || 0) * unit.upkeep;
        });
        return Math.round(upkeep * (1 - state.modifiers.armyEfficiency * 0.2));
    }

    function computeScore() {
        if (!state.stats) return 0;
        const s = state.stats;
        const armyPower = computeArmyPower();
        const score = (
            state.turn * 42 +
            s.gdp * 7 +
            s.treasury / 10 +
            s.approval * 9 +
            s.stability * 10 +
            s.diplomacy * 6 +
            s.ecology * 5 +
            s.security * 8 +
            s.science * 5 +
            s.industry * 5 +
            armyPower * 1.3 +
            state.lawsEnacted.length * 150 +
            state.monuments.built.length * 220 +
            state.objectives.successCount * 120 -
            state.objectives.failCount * 70 +
            averageRelations() * 6
        );

        return Math.max(0, Math.round(score));
    }

    function addLog(text) {
        state.log.unshift(`[M${state.turn}] ${text}`);
        state.log = state.log.slice(0, 36);
    }

    function normalizeState() {
        if (!state.stats) return;
        if (!state.objectives) {
            state.objectives = { activeIds: [], nextEvaluationTurn: 3, successCount: 0, failCount: 0, lastReport: "Aucun bilan trimestriel." };
        }
        if (!Array.isArray(state.objectives.activeIds)) {
            state.objectives.activeIds = [];
        }
        if (typeof state.objectives.lastReport !== "string") {
            state.objectives.lastReport = "Aucun bilan trimestriel.";
        }

        const s = state.stats;
        s.treasury = clamp(s.treasury, -9000, 220000);
        s.gdp = clamp(s.gdp, 20, 420);
        s.approval = clamp(s.approval, 0, 100);
        s.stability = clamp(s.stability, 0, 100);
        s.diplomacy = clamp(s.diplomacy, 0, 100);
        s.ecology = clamp(s.ecology, 0, 100);
        s.security = clamp(s.security, 0, 100);
        s.population = clamp(s.population, 5, 2000);
        s.industry = clamp(s.industry, 0, 140);
        s.science = clamp(s.science, 0, 140);
        s.debtPressure = clamp(s.debtPressure, 0, 100);

        state.army.readiness = clamp(state.army.readiness, 0, 100);
        state.army.training = clamp(state.army.training, 0, 100);
        state.army.warFatigue = clamp(state.army.warFatigue, 0, 100);

        Object.keys(state.army.units).forEach((unitId) => {
            state.army.units[unitId] = Math.max(0, Math.floor(state.army.units[unitId] || 0));
        });

        Object.keys(state.relations).forEach((nationId) => {
            state.relations[nationId] = clamp(state.relations[nationId], -100, 100);
        });

        state.objectives.successCount = Math.max(0, Math.floor(state.objectives.successCount || 0));
        state.objectives.failCount = Math.max(0, Math.floor(state.objectives.failCount || 0));
        state.objectives.nextEvaluationTurn = Math.max(3, Math.floor(state.objectives.nextEvaluationTurn || 3));
    }

    function initializeStartSelect() {
        const sorted = [...NATIONS].sort((a, b) => a.name.localeCompare(b.name));
        dom.startNation.innerHTML = sorted
            .map((nation) => `<option value="${nation.id}">${nation.name} (${nation.region})</option>`)
            .join("");
        dom.startNation.value = "france";

        dom.startDoctrine.innerHTML = DOCTRINES
            .map((doctrine) => `<option value="${doctrine.id}">${doctrine.name} - ${doctrine.desc}</option>`)
            .join("");
        dom.startDoctrine.value = "balanced";
    }

    function initialArmyFromNation(nation) {
        return {
            units: {
                infantry: Math.round(nation.military * 1.1),
                mechanized: Math.round(nation.military * 0.35),
                airwing: Math.round(nation.military * 0.2),
                naval: Math.round(nation.military * 0.18),
                drone: Math.round(nation.military * 0.22),
                missile_defense: Math.round(nation.military * 0.12)
            },
            readiness: clamp(44 + Math.round(nation.institutions * 0.4), 30, 90),
            training: clamp(40 + Math.round(nation.military * 0.35), 30, 92),
            warFatigue: 0,
            lastUpkeep: 0
        };
    }

    function initialStatsFromNation(nation) {
        return {
            treasury: 3600 + nation.economy * 28,
            gdp: 72 + nation.economy * 1.35,
            approval: clamp(52 + randInt(-6, 8), 20, 85),
            stability: clamp(50 + Math.round(nation.institutions * 0.35) + randInt(-6, 6), 25, 90),
            diplomacy: clamp(46 + randInt(-7, 7), 20, 85),
            ecology: clamp(48 + randInt(-8, 8), 15, 88),
            security: clamp(45 + Math.round(nation.institutions * 0.4), 20, 90),
            population: nation.population,
            industry: clamp(nation.industry + randInt(-4, 5), 20, 120),
            science: clamp(nation.science + randInt(-4, 5), 20, 120),
            debtPressure: 12
        };
    }

    function initializeRelations(playerNationId) {
        const relations = {};
        NATIONS.forEach((nation) => {
            if (nation.id === playerNationId) {
                relations[nation.id] = 100;
                return;
            }
            relations[nation.id] = randInt(-24, 32);
        });
        return relations;
    }

    function initializeForeignData(playerNationId) {
        const foreign = {};
        NATIONS.forEach((nation) => {
            if (nation.id === playerNationId) return;
            foreign[nation.id] = {
                economy: clamp(nation.economy + randInt(-8, 8), 25, 130),
                military: clamp(nation.military + randInt(-10, 10), 20, 130),
                stability: clamp(52 + randInt(-14, 15), 20, 95),
                climateRisk: nation.climateRisk
            };
        });
        return foreign;
    }

    function pickRandomFromPool(pool, count) {
        const copy = [...pool];
        const picks = [];
        while (copy.length && picks.length < count) {
            const index = randInt(0, copy.length - 1);
            picks.push(copy.splice(index, 1)[0]);
        }
        return picks;
    }

    function pickPolicyOptions() {
        state.policyOptions = pickRandomFromPool(POLICIES, 4);
        state.selectedPolicyId = null;
    }

    function pickLawOptions() {
        const remaining = LAWS.filter((law) => !state.lawsEnacted.includes(law.id));
        state.lawOptions = pickRandomFromPool(remaining, 3).map((law) => law.id);
    }

    function applyDoctrineStartPackage() {
        const doctrine = doctrineById(state.doctrineId);
        applyStatEffects(doctrine.startEffects);
        applyModifiers(doctrine.modifiers);
        addLog(`Doctrine active: ${doctrine.name}.`);
    }

    function pickQuarterObjectives() {
        const doctrine = doctrineById(state.doctrineId);
        const pool = [...OBJECTIVE_POOL];
        const picks = [];

        if (doctrine.tags && doctrine.tags.length) {
            const focused = pool.filter((objective) => objective.tags.some((tag) => doctrine.tags.includes(tag)));
            if (focused.length) {
                const first = focused[randInt(0, focused.length - 1)];
                picks.push(first.id);
            }
        }

        while (picks.length < 3 && pool.length) {
            const candidate = pool[randInt(0, pool.length - 1)];
            if (!picks.includes(candidate.id)) {
                picks.push(candidate.id);
            }
        }

        state.objectives.activeIds = picks;
    }

    function evaluateQuarterObjectives(completedTurn) {
        if (!state.objectives.activeIds.length) return;

        let passedCount = 0;
        let failedCount = 0;

        state.objectives.activeIds.forEach((objectiveId) => {
            const objective = objectiveById(objectiveId);
            if (!objective) return;

            if (objectivePassed(objective)) {
                applyStatEffects(objective.reward);
                passedCount += 1;
                addLog(`Objectif valide: ${objective.title}.`);
            } else {
                applyStatEffects(objective.penalty);
                failedCount += 1;
                addLog(`Objectif manque: ${objective.title}.`);
            }
        });

        state.objectives.successCount += passedCount;
        state.objectives.failCount += failedCount;
        state.objectives.lastReport = `Bilan T${Math.ceil(completedTurn / 3)}: ${passedCount} valide(s), ${failedCount} manque(s).`;
        state.objectives.nextEvaluationTurn = completedTurn + 3;
        pickQuarterObjectives();
    }

    function applyStatEffects(effects, targetNationId) {
        if (!effects || !state.stats) return;

        Object.entries(effects).forEach(([key, value]) => {
            if (key === "relationTarget") {
                if (targetNationId) state.relations[targetNationId] = clamp((state.relations[targetNationId] || 0) + value, -100, 100);
                return;
            }
            if (key === "relationsAll") {
                Object.keys(state.relations).forEach((nationId) => {
                    if (nationId === state.playerNationId) return;
                    state.relations[nationId] = clamp(state.relations[nationId] + value, -100, 100);
                });
                return;
            }
            if (key === "armyReadiness") {
                state.army.readiness += value;
                return;
            }
            if (key === "armyTraining") {
                state.army.training += value;
                return;
            }
            if (Object.prototype.hasOwnProperty.call(state.stats, key)) {
                state.stats[key] += value;
            }
        });

        normalizeState();
    }

    function applyModifiers(modifiers) {
        if (!modifiers) return;
        Object.entries(modifiers).forEach(([key, value]) => {
            state.modifiers[key] = (state.modifiers[key] || 0) + value;
        });
    }

    function getLawPassChance(law) {
        const s = state.stats;
        const base = law.threshold;
        const support = (s.approval * 0.25) + (s.stability * 0.2) + (s.diplomacy * 0.08) + (state.modifiers.judiciaryTrust * 100 * 0.18);
        const fatiguePenalty = state.lawsEnacted.length * 1.2;
        return clamp(Math.round(base + support - 42 - fatiguePenalty), 10, 95);
    }

    function kpiColor(val, danger = 28, warn = 50) {
        if (val <= danger) return "var(--kpi-bad)";
        if (val <= warn)   return "var(--kpi-warn)";
        return "var(--kpi-good)";
    }

    function setKpiColor(el, val, danger, warn) {
        el.style.color = kpiColor(val, danger, warn);
    }

    function renderTopBar() {
        const currentNation = nationById(state.playerNationId);
        const doctrine = doctrineById(state.doctrineId);
        const score = computeScore();
        const militaryPower = computeArmyPower();
        const s = state.stats;

        dom.nationName.textContent = currentNation ? currentNation.name : "-";
        dom.dateLabel.textContent = `${MONTHS[state.monthIndex]} ${state.year} - Mois ${state.turn}/48 - ${doctrine.name}`;

        dom.kpiTreasury.textContent = formatNumber(s.treasury);
        dom.kpiTreasury.style.color = s.treasury < 0 ? "var(--kpi-bad)" : s.treasury < 2000 ? "var(--kpi-warn)" : "";

        dom.kpiGdp.textContent = formatNumber(s.gdp);
        dom.kpiGdp.style.color = s.gdp < 60 ? "var(--kpi-bad)" : s.gdp < 85 ? "var(--kpi-warn)" : "";

        dom.kpiApproval.textContent = `${Math.round(s.approval)}%`;
        setKpiColor(dom.kpiApproval, s.approval, 28, 50);

        dom.kpiStability.textContent = `${Math.round(s.stability)}%`;
        setKpiColor(dom.kpiStability, s.stability, 28, 50);

        dom.kpiMilitary.textContent = formatNumber(militaryPower);

        dom.kpiDiplomacy.textContent = `${Math.round(s.diplomacy)}`;
        setKpiColor(dom.kpiDiplomacy, s.diplomacy, 20, 40);

        dom.kpiEcology.textContent = `${Math.round(s.ecology)}%`;
        setKpiColor(dom.kpiEcology, s.ecology, 25, 48);

        dom.kpiSecurity.textContent = `${Math.round(s.security)}%`;
        setKpiColor(dom.kpiSecurity, s.security, 28, 50);

        dom.kpiPopulation.textContent = `${s.population.toFixed(1)} M`;
        dom.kpiIndustry.textContent = `${Math.round(s.industry)}`;
        dom.kpiScience.textContent = `${Math.round(s.science)}`;
        dom.kpiScore.textContent = formatNumber(score);
    }

    function describeEffects(effects) {
        if (!effects) return "";
        const labels = {
            treasury: "Tresor",
            gdp: "PIB",
            approval: "Popularite",
            stability: "Stabilite",
            diplomacy: "Diplomatie",
            ecology: "Ecologie",
            security: "Securite",
            population: "Population",
            industry: "Industrie",
            science: "Science",
            armyReadiness: "Preparation",
            armyTraining: "Entrainement",
            debtPressure: "Dette"
        };

        return Object.entries(effects)
            .filter(([key]) => key !== "relationTarget" && key !== "relationsAll")
            .map(([key, value]) => {
                const sign = value >= 0 ? "+" : "";
                const suffix = ["approval", "stability", "ecology", "security"].includes(key) ? "%" : "";
                return `${labels[key] || key} ${sign}${value}${suffix}`;
            })
            .join(" | ");
    }

    function renderPolicyCards() {
        dom.policyCards.innerHTML = state.policyOptions.map((policy) => {
            const isActive = state.selectedPolicyId === policy.id ? "active" : "";
            return `
                <article class="card ${isActive}" data-policy-id="${policy.id}">
                    <h4>${policy.title}</h4>
                    <p>${policy.desc}</p>
                    <div class="card-impact">${describeEffects(policy.effects)}</div>
                </article>
            `;
        }).join("");

        dom.policyCards.querySelectorAll("[data-policy-id]").forEach((node) => {
            node.addEventListener("click", () => {
                if (!state.started || state.pendingEvent || state.gameOver) return;
                state.selectedPolicyId = node.dataset.policyId;
                renderPolicyCards();
                renderUsageBadges();
            });
        });
    }

    function renderLawCards() {
        dom.lawCards.innerHTML = state.lawOptions.map((lawId) => {
            const law = lawById(lawId);
            if (!law) return "";
            const enacted = state.lawsEnacted.includes(law.id);
            const chance = getLawPassChance(law);
            const disabled = enacted || state.usedLawVote || state.pendingEvent || state.gameOver;
            return `
                <article class="card">
                    <h4>${law.title}</h4>
                    <p>${law.desc}</p>
                    <div class="card-impact">Vote requis: ${chance}% de chance</div>
                    <div class="card-impact">Si adoptee: ${describeEffects(law.onPass.effects)}</div>
                    <button class="card-btn" data-law-id="${law.id}" ${disabled ? "disabled" : ""}>${enacted ? "Deja adoptee" : "Faire voter"}</button>
                </article>
            `;
        }).join("");

        dom.lawCards.querySelectorAll("[data-law-id]").forEach((button) => {
            button.addEventListener("click", () => voteLaw(button.dataset.lawId));
        });
    }

    function renderMonuments() {
        const project = state.monuments.activeProject;
        if (!project) {
            dom.projectStatus.innerHTML = "Aucun chantier national en cours.";
            dom.projectBadge.textContent = "Projet: aucun";
        } else {
            const monument = monumentById(project.id);
            const pct = clamp(Math.round((project.progress / project.duration) * 100), 0, 100);
            dom.projectBadge.textContent = `Projet: ${monument ? monument.title : project.id}`;
            dom.projectStatus.innerHTML = `
                <strong>${monument ? monument.title : project.id}</strong><br>
                Progression: ${pct}% (${project.progress.toFixed(1)} / ${project.duration} mois)
                <div class="project-bar"><span style="width:${pct}%"></span></div>
            `;
        }

        dom.monumentCards.innerHTML = MONUMENTS.map((monument) => {
            const isBuilt = state.monuments.built.includes(monument.id);
            const isActive = project && project.id === monument.id;
            const disabled = isBuilt || !!project || state.pendingEvent || state.gameOver;
            return `
                <article class="card">
                    <h4>${monument.title}</h4>
                    <p>${monument.desc}</p>
                    <div class="card-impact">Cout: ${formatNumber(monument.upfrontTreasury)} | Industrie: -${monument.upfrontIndustry}</div>
                    <div class="card-impact">Duree: ${monument.duration} mois</div>
                    <button class="card-btn" data-monument-id="${monument.id}" ${disabled ? "disabled" : ""}>${isBuilt ? "Construit" : isActive ? "En chantier" : "Lancer projet"}</button>
                </article>
            `;
        }).join("");

        dom.monumentCards.querySelectorAll("[data-monument-id]").forEach((button) => {
            button.addEventListener("click", () => startMonumentProject(button.dataset.monumentId));
        });
    }

    function renderArmySection() {
        const militaryPower = computeArmyPower();
        const upkeep = computeArmyUpkeep();
        const units = state.army.units;

        dom.armyOverview.innerHTML = `
            <div class="stat-row"><span>Puissance totale</span><span>${formatNumber(militaryPower)}</span></div>
            <div class="stat-row"><span>Preparation</span><span>${Math.round(state.army.readiness)}%</span></div>
            <div class="stat-row"><span>Entrainement</span><span>${Math.round(state.army.training)}%</span></div>
            <div class="stat-row"><span>Entretien mensuel</span><span>${formatNumber(upkeep)}</span></div>
            <div class="stat-row"><span>Fatigue de guerre</span><span>${Math.round(state.army.warFatigue)}%</span></div>
        `;

        dom.recruitCards.innerHTML = ARMY_UNITS.map((unit) => {
            const count = units[unit.id] || 0;
            const disabled = state.pendingEvent || state.gameOver;
            return `
                <article class="card">
                    <h4>${unit.name}</h4>
                    <p>Actuel: ${count} | Puissance: ${unit.power}</p>
                    <div class="card-impact">Cout: ${unit.costTreasury} | Industrie: -${unit.costIndustry} | Pop: -${unit.manpower.toFixed(3)}M</div>
                    <button class="card-btn" data-recruit-id="${unit.id}" ${disabled ? "disabled" : ""}>Recruter</button>
                </article>
            `;
        }).join("");

        dom.recruitCards.querySelectorAll("[data-recruit-id]").forEach((button) => {
            button.addEventListener("click", () => recruitUnit(button.dataset.recruitId));
        });

        dom.operationCards.innerHTML = MILITARY_OPERATIONS.map((operation) => {
            const disabled = state.usedMilitaryAction || state.pendingEvent || state.gameOver;
            return `
                <article class="card">
                    <h4>${operation.title}</h4>
                    <p>${operation.desc}</p>
                    <div class="card-impact">Cout: ${operation.costTreasury} | Difficulte: ${operation.difficulty}</div>
                    <button class="card-btn" data-operation-id="${operation.id}" ${disabled ? "disabled" : ""}>Lancer</button>
                </article>
            `;
        }).join("");

        dom.operationCards.querySelectorAll("[data-operation-id]").forEach((button) => {
            button.addEventListener("click", () => launchMilitaryOperation(button.dataset.operationId));
        });
    }

    function renderMap() {
        dom.mapNations.forEach((shape) => {
            const nationId = shape.dataset.nation;
            const isPlayer = nationId === state.playerNationId;
            const relation = state.relations[nationId] || 0;
            shape.style.fill = isPlayer ? "#5aa6ff" : relationColor(relation);
            shape.classList.toggle("selected", nationId === state.selectedNationId);
        });
    }

    function renderSelectedNation() {
        if (!state.selectedNationId) {
            dom.selectedTitle.textContent = "Selection nation";
            dom.selectedDesc.textContent = "Clique une nation sur la carte pour negocier.";
            dom.selectedStats.innerHTML = "";
            toggleDiploButtons(false);
            return;
        }

        const nation = nationById(state.selectedNationId);
        if (!nation) return;

        if (state.selectedNationId === state.playerNationId) {
            dom.selectedTitle.textContent = `${nation.name} (toi)`;
            dom.selectedDesc.textContent = "Vue interne de ton gouvernement.";
            dom.selectedStats.innerHTML = `
                <div class="stat-row"><span>Region</span><span>${nation.region}</span></div>
                <div class="stat-row"><span>Population</span><span>${state.stats.population.toFixed(1)} M</span></div>
                <div class="stat-row"><span>Lois adoptees</span><span>${state.lawsEnacted.length}</span></div>
                <div class="stat-row"><span>Monuments acheves</span><span>${state.monuments.built.length}</span></div>
                <div class="stat-row"><span>Alerte climat</span><span>${state.weather.alerts}</span></div>
            `;
            toggleDiploButtons(false);
            return;
        }

        const relation = state.relations[state.selectedNationId] || 0;
        const foreign = state.foreign[state.selectedNationId];
        dom.selectedTitle.textContent = nation.name;
        dom.selectedDesc.textContent = `Relation bilaterale: ${relationLabel(relation)} (${relation})`;
        dom.selectedStats.innerHTML = `
            <div class="stat-row"><span>Region</span><span>${nation.region}</span></div>
            <div class="stat-row"><span>Population</span><span>${nation.population} M</span></div>
            <div class="stat-row"><span>Economie</span><span>${Math.round(foreign.economy)}</span></div>
            <div class="stat-row"><span>Armee</span><span>${Math.round(foreign.military)}</span></div>
            <div class="stat-row"><span>Stabilite</span><span>${Math.round(foreign.stability)}%</span></div>
            <div class="stat-row"><span>Risque climat</span><span>${foreign.climateRisk}</span></div>
        `;

        toggleDiploButtons(true);
    }

    function toggleDiploButtons(enabled) {
        dom.diploButtons.forEach((button) => {
            button.disabled = !enabled || state.usedDiplomacy || state.pendingEvent || state.gameOver;
        });
    }

    function renderUsageBadges() {
        dom.diplomacyUsage.textContent = state.usedDiplomacy ? "Action diplo: utilisee" : "Action diplo: disponible";
        dom.militaryUsage.textContent = state.usedMilitaryAction ? "Operation militaire: utilisee" : "Operation militaire: disponible";
        dom.policyUsage.textContent = state.selectedPolicyId ? "Politique: selectionnee" : "Politique: en attente";
        dom.lawUsage.textContent = state.usedLawVote ? "Vote: utilise" : "Vote: disponible";

        const weatherText = state.weather.lastSeverity > 0
            ? `${state.weather.lastLabel} (sev. ${state.weather.lastSeverity.toFixed(1)})`
            : `Meteo: ${state.weather.lastLabel}`;
        dom.weatherBadge.textContent = weatherText;
    }

    function renderLog() {
        if (!state.log.length) {
            dom.turnLog.innerHTML = "<li>Debut de mandat. Les institutions attendent tes ordres.</li>";
            return;
        }
        dom.turnLog.innerHTML = state.log.map((entry) => {
            let cls = "";
            if (/valide|adopte|succes|positif|\+[1-9]|renforce|accord|victoire|hausse|lance|plan|mois termine/.test(entry)) cls = "log-good";
            else if (/manque|echoue|crise|incident|amende|sanction|hostile|deficit|perte|chute|effondre|greve|penalite|attaque/.test(entry)) cls = "log-bad";
            return `<li class="${cls}">${entry}</li>`;
        }).join("");
    }

    function renderObjectives() {
        if (!state.started || !state.stats) return;

        const nextEval = state.objectives.nextEvaluationTurn;
        dom.objectiveDue.textContent = `Evaluation: M${Math.min(nextEval, 48)}`;

        const objectiveCards = state.objectives.activeIds.map((objectiveId) => {
            const objective = objectiveById(objectiveId);
            if (!objective) return "";
            const current = objectiveMetricValue(objective);
            const passed = objectivePassed(objective);
            const stateClass = passed ? "good" : "risk";
            const comparator = objective.comparator === "lte" ? "<=" : ">=";

            return `
                <article class="card objective-card ${stateClass}">
                    <h4>${objective.title}</h4>
                    <p>${objective.desc}</p>
                    <div class="objective-progress">
                        Cible ${comparator} <strong>${objectiveValueLabel(objective, objective.target)}</strong><br>
                        Actuel: <strong>${objectiveValueLabel(objective, current)}</strong>
                    </div>
                </article>
            `;
        }).join("");

        dom.objectiveList.innerHTML = `
            <article class="card">
                <h4>Bilan precedent</h4>
                <p>${state.objectives.lastReport}</p>
            </article>
            ${objectiveCards}
        `;
    }

    function computeRiskRows() {
        const s = state.stats;
        const armyPower = computeArmyPower();

        const economyRisk = clamp(
            52 - ((s.gdp - 80) * 0.9) - (s.treasury / 800) + (s.debtPressure * 0.85),
            0,
            100
        );

        const socialRisk = clamp(
            100 - ((s.approval * 0.55) + (s.stability * 0.45)),
            0,
            100
        );

        const securityRisk = clamp(
            100 - ((s.security * 0.58) + (state.army.readiness * 0.24) + (Math.min(1600, armyPower) / 40)),
            0,
            100
        );

        const climateRisk = clamp(
            86 - (s.ecology * 0.74) + (state.weather.alerts * 1.6) - (state.modifiers.climateShield * 35),
            0,
            100
        );

        return [
            { label: "Economie", value: economyRisk },
            { label: "Societe", value: socialRisk },
            { label: "Securite", value: securityRisk },
            { label: "Climat", value: climateRisk }
        ];
    }

    function renderRiskOverview() {
        if (!state.started || !state.stats) return;

        const rows = computeRiskRows();
        dom.riskOverview.innerHTML = rows.map((row) => `
            <div class="risk-row">
                <span>${row.label}</span>
                <div class="risk-track"><i style="width:${Math.round(row.value)}%"></i></div>
                <span class="risk-value">${Math.round(row.value)}</span>
            </div>
        `).join("");
    }

    function renderAll() {
        if (!state.started || !state.stats) return;
        renderTopBar();
        renderPolicyCards();
        renderLawCards();
        renderMonuments();
        renderArmySection();
        renderMap();
        renderSelectedNation();
        renderUsageBadges();
        renderObjectives();
        renderRiskOverview();
        renderLog();
    }

    function voteLaw(lawId) {
        if (!state.started || state.usedLawVote || state.pendingEvent || state.gameOver) return;
        const law = lawById(lawId);
        if (!law || state.lawsEnacted.includes(law.id)) return;

        const chance = getLawPassChance(law);
        const roll = randInt(1, 100);

        if (roll <= chance) {
            state.lawsEnacted.push(law.id);
            applyStatEffects(law.onPass.effects);
            applyModifiers(law.onPass.modifiers);
            addLog(`Loi adoptee: ${law.title}.`);
        } else {
            applyStatEffects(law.onFail.effects);
            addLog(`Echec parlementaire: ${law.title}.`);
        }

        state.usedLawVote = true;
        renderAll();
    }

    function startMonumentProject(monumentId) {
        if (!state.started || state.pendingEvent || state.gameOver) return;
        if (state.monuments.activeProject) {
            alert("Un chantier monumental est deja en cours.");
            return;
        }

        const monument = monumentById(monumentId);
        if (!monument) return;
        if (state.monuments.built.includes(monument.id)) return;

        if (state.stats.treasury < monument.upfrontTreasury || state.stats.industry < monument.upfrontIndustry) {
            alert("Ressources insuffisantes pour lancer ce monument.");
            return;
        }

        state.stats.treasury -= monument.upfrontTreasury;
        state.stats.industry -= monument.upfrontIndustry;
        state.monuments.activeProject = { id: monument.id, progress: 0, duration: monument.duration };

        addLog(`Chantier lance: ${monument.title}.`);
        normalizeState();
        renderAll();
    }

    function recruitUnit(unitId) {
        if (!state.started || state.pendingEvent || state.gameOver) return;
        const unit = unitById(unitId);
        if (!unit) return;

        if (state.stats.treasury < unit.costTreasury || state.stats.industry < unit.costIndustry || state.stats.population <= 6) {
            alert("Impossible de recruter: ressources insuffisantes.");
            return;
        }

        state.stats.treasury -= unit.costTreasury;
        state.stats.industry -= unit.costIndustry;
        state.stats.population -= unit.manpower;
        state.army.units[unit.id] += 1;
        state.army.training += 0.4;

        addLog(`Recrutement valide: ${unit.name}.`);
        normalizeState();
        renderAll();
    }

    function launchMilitaryOperation(operationId) {
        if (!state.started || state.usedMilitaryAction || state.pendingEvent || state.gameOver) return;
        const operation = operationById(operationId);
        if (!operation) return;

        if (state.stats.treasury < operation.costTreasury) {
            alert("Tresor insuffisant pour cette operation.");
            return;
        }

        state.stats.treasury -= operation.costTreasury;

        const power = computeArmyPower();
        const score = state.stats.security + state.army.readiness + (state.army.training * 0.7) + (power / 8) + randInt(-25, 25);

        if (score >= operation.difficulty) {
            applyStatEffects(operation.success.effects);
            addLog(`Operation reussie: ${operation.title}.`);
        } else {
            applyStatEffects(operation.failure.effects);
            addLog(`Operation partiellement reussie: ${operation.title}.`);
        }

        state.usedMilitaryAction = true;
        state.army.warFatigue += 1.8;
        normalizeState();
        renderAll();
    }

    function executeDiplomaticAction(actionId) {
        if (!state.started || state.gameOver || state.pendingEvent) return;
        if (state.usedDiplomacy) return;
        if (!state.selectedNationId || state.selectedNationId === state.playerNationId) return;

        const action = DIPLO_ACTIONS[actionId];
        if (!action) return;

        const relation = state.relations[state.selectedNationId] || 0;
        if (typeof action.minRelation === "number" && relation < action.minRelation) {
            alert("Relation trop faible pour cette action diplomatique.");
            return;
        }

        if (state.stats.treasury < action.cost) {
            alert("Tresor insuffisant pour cette action diplomatique.");
            return;
        }

        state.stats.treasury -= action.cost;
        applyStatEffects(action.effects, state.selectedNationId);

        state.usedDiplomacy = true;
        const target = nationById(state.selectedNationId);
        addLog(`Diplomatie: ${action.label} avec ${target ? target.name : "nation cible"}.`);

        normalizeState();
        renderAll();
    }

    function processMonumentProgress() {
        const project = state.monuments.activeProject;
        if (!project) return;

        const monument = monumentById(project.id);
        if (!monument) return;

        const speed = 1 + (state.stats.industry / 120) + (state.modifiers.innovationBoost * 1.8);
        project.progress += speed;

        if (project.progress >= project.duration) {
            state.monuments.activeProject = null;
            state.monuments.built.push(monument.id);
            applyStatEffects(monument.completionEffects);
            applyModifiers(monument.modifiers);
            addLog(`Monument acheve: ${monument.title}.`);
        }
    }

    function applyMonumentPassives() {
        state.monuments.built.forEach((monumentId) => {
            const monument = monumentById(monumentId);
            if (!monument || !monument.passive) return;
            applyStatEffects(monument.passive);
        });
    }

    function processEconomy() {
        const s = state.stats;
        const avgRelations = averageRelations();
        const armyCost = computeArmyUpkeep();
        state.army.lastUpkeep = armyCost;

        const revenue =
            (s.gdp * 8.2) +
            (s.industry * 5.1) +
            (s.diplomacy * 3.4) +
            (state.modifiers.taxEfficiency * 620) +
            (state.modifiers.tradeBonus * 540) +
            (avgRelations * 2.6);

        const expenses =
            (s.population * 2.0) +
            armyCost +
            ((100 - s.security) * 4.2) +
            (state.modifiers.socialProtection * 140) +
            (s.debtPressure * 8);

        const net = Math.round(revenue - expenses + randInt(-180, 180));
        s.treasury += net;

        const growth =
            ((s.industry - 50) / 9) +
            ((s.science - 50) / 11) +
            ((s.diplomacy - 50) / 15) +
            (state.modifiers.tradeBonus * 8) +
            (state.modifiers.innovationBoost * 7) -
            (s.debtPressure / 30) +
            randInt(-3, 3);

        s.gdp += growth;
        s.approval += (net > 0 ? 1.4 : -1.8) + ((s.stability - 50) / 45) - (Math.max(0, -s.treasury) / 1600);
        s.stability += ((s.security - 50) / 30) + ((s.approval - 50) / 40) + (avgRelations / 120) + randInt(-2, 2);
        s.diplomacy += (avgRelations / 100) + (state.modifiers.judiciaryTrust * 4) + randInt(-1, 1);
        s.science += (state.modifiers.innovationBoost * 2.4) + randInt(-1, 1);
        s.industry += (state.modifiers.tradeBonus * 1.6) + randInt(-1, 1);
        s.security += (state.modifiers.lawAndOrder * 2.2) + (computeArmyPower() / 1400) + randInt(-2, 1);
        s.ecology += (-1.3 + (state.modifiers.energyTransition * 2.5) + randInt(-1, 1));

        const popGrowth = 0.07 + (state.modifiers.healthSystem * 0.16) + ((s.approval - 50) / 1000);
        s.population += s.population * (popGrowth / 100);

        if (s.treasury < 0) {
            s.debtPressure += 1.6;
        } else {
            s.debtPressure -= 0.9;
        }

        state.army.readiness += (s.security > 55 ? 0.6 : -0.8) - (state.army.warFatigue / 120);
        state.army.training += 0.25;
        state.army.warFatigue -= 0.5;

        const trend = net >= 0 ? "surplus" : "deficit";
        addLog(`Budget: ${trend} ${formatNumber(net)} credits.`);
    }

    function processWeatherSystem() {
        const nation = nationById(state.playerNationId);
        const season = monthSeason(state.monthIndex);
        const s = state.stats;

        const chance =
            0.22 +
            (nation.climateRisk / 220) +
            (Math.max(0, 62 - s.ecology) / 220) -
            (state.modifiers.climateShield * 0.22) -
            (state.modifiers.healthSystem * 0.06);

        if (Math.random() < chance) {
            const candidates = WEATHER_EVENTS.filter((event) => event.seasons.includes(season));
            const weather = candidates[randInt(0, candidates.length - 1)];
            const rawSeverity = weather.base + randInt(-1, 2) + (Math.max(0, 60 - s.ecology) / 22);
            const severity = Math.max(2.4, rawSeverity);
            const mitigation = 1 + state.modifiers.climateShield + (state.modifiers.healthSystem * 0.5) + (s.security / 260);
            const multiplier = Math.max(0.38, severity / mitigation / 5);

            const scaledEffects = {};
            Object.entries(weather.effects).forEach(([key, value]) => {
                scaledEffects[key] = Math.round(value * multiplier * 10) / 10;
            });

            applyStatEffects(scaledEffects);
            state.weather.lastLabel = `${weather.name} (${season})`;
            state.weather.lastSeverity = severity;
            state.weather.alerts += 1;

            addLog(`Intemperie: ${weather.name} frappe le pays (sev. ${severity.toFixed(1)}).`);
            return;
        }

        if (Math.random() < 0.2) {
            applyStatEffects({ treasury: 90, approval: 1, gdp: 1 });
            state.weather.lastLabel = `Conditions favorables (${season})`;
            state.weather.lastSeverity = 0;
            addLog("Meteo stable: bonnes conditions de production.");
            return;
        }

        state.weather.lastLabel = `Calme (${season})`;
        state.weather.lastSeverity = 0;
    }

    function processGeopolitics() {
        const armyPower = computeArmyPower();

        Object.keys(state.foreign).forEach((nationId) => {
            const foreign = state.foreign[nationId];
            const relationShift = randInt(-6, 6) + Math.round((state.stats.diplomacy - 50) / 20) + Math.round(state.modifiers.judiciaryTrust * 4);
            state.relations[nationId] = clamp(state.relations[nationId] + relationShift, -100, 100);

            foreign.economy = clamp(foreign.economy + randInt(-2, 2), 20, 140);
            foreign.military = clamp(foreign.military + randInt(-2, 2), 20, 140);
            foreign.stability = clamp(foreign.stability + randInt(-2, 2), 20, 100);

            if (state.relations[nationId] > 70) {
                applyStatEffects({ treasury: 95, diplomacy: 1 });
            }

            if (state.relations[nationId] < -78 && Math.random() < 0.2) {
                const enemyPressure = foreign.military + randInt(-10, 16);
                const defenseScore = (armyPower / 12) + state.stats.security + randInt(-12, 12);

                if (defenseScore >= enemyPressure) {
                    applyStatEffects({ diplomacy: 2, security: 1, approval: 1 });
                    state.army.readiness += 2;
                    addLog(`Incident frontalier contenu face a ${nationById(nationId).name}.`);
                } else {
                    applyStatEffects({ treasury: -360, stability: -5, approval: -4, security: -4, population: -0.03 });
                    state.army.warFatigue += 3;
                    addLog(`Crise frontaliere: fortes tensions avec ${nationById(nationId).name}.`);
                }
            }
        });
    }

    function processDomesticPressure() {
        const s = state.stats;

        if (s.approval < 28 && Math.random() < 0.45) {
            applyStatEffects({ stability: -4, treasury: -140, security: -2 });
            addLog("Manifestations nationales: l'opposition gagne du terrain.");
        }

        if (s.security < 24 && Math.random() < 0.32) {
            applyStatEffects({ stability: -5, approval: -3, treasury: -220 });
            addLog("Attentat majeur: securite nationale en echec.");
        }

        if (s.ecology < 20 && Math.random() < 0.36) {
            applyStatEffects({ population: -0.04, approval: -2, gdp: -2, treasury: -180 });
            addLog("Crise environnementale locale: pertes agricoles et sanitaires.");
        }
    }

    function maybeTriggerGlobalEvent() {
        if (Math.random() > 0.33) {
            state.pendingEvent = null;
            return;
        }

        const event = deepClone(GLOBAL_EVENTS[randInt(0, GLOBAL_EVENTS.length - 1)]);
        state.pendingEvent = event;
        showEventModal(event);
    }

    function advanceOneMonth() {
        if (!state.started || state.gameOver || state.pendingEvent) return;

        const policy = state.policyOptions.find((item) => item.id === state.selectedPolicyId);
        if (!policy) {
            alert("Selectionne une politique nationale avant de valider le mois.");
            return;
        }

        applyStatEffects(policy.effects);
        addLog(`Politique appliquee: ${policy.title}.`);

        processMonumentProgress();
        applyMonumentPassives();
        processEconomy();
        processWeatherSystem();
        processGeopolitics();
        processDomesticPressure();

        const completedTurn = state.turn;
        if (completedTurn >= state.objectives.nextEvaluationTurn) {
            evaluateQuarterObjectives(completedTurn);
        }

        normalizeState();

        state.turn += 1;
        state.monthIndex += 1;
        if (state.monthIndex > 11) {
            state.monthIndex = 0;
            state.year += 1;
        }

        state.usedDiplomacy = false;
        state.usedMilitaryAction = false;
        state.usedLawVote = false;

        pickPolicyOptions();
        pickLawOptions();

        maybeTriggerGlobalEvent();
        evaluateGameState();
        renderAll();
    }

    function showEventModal(event) {
        dom.eventTitle.textContent = event.title;
        dom.eventText.textContent = event.text;
        dom.eventChoices.innerHTML = event.choices.map((choice, index) => `
            <button class="event-choice" data-event-choice="${index}">
                <strong>${choice.label}</strong><br>
                <small>${choice.summary}</small>
            </button>
        `).join("");

        dom.eventChoices.querySelectorAll("[data-event-choice]").forEach((button) => {
            button.addEventListener("click", () => resolveEventChoice(Number(button.dataset.eventChoice)));
        });

        dom.eventModal.classList.remove("hidden");
        dom.eventModal.setAttribute("aria-hidden", "false");
    }

    function closeEventModal() {
        dom.eventModal.classList.add("hidden");
        dom.eventModal.setAttribute("aria-hidden", "true");
    }

    function resolveEventChoice(choiceIndex) {
        if (!state.pendingEvent) return;
        const choice = state.pendingEvent.choices[choiceIndex];
        if (!choice) return;

        applyStatEffects(choice.effects);
        addLog(`Evenement: ${state.pendingEvent.title} -> ${choice.label}.`);

        state.pendingEvent = null;
        closeEventModal();
        normalizeState();
        evaluateGameState();
        renderAll();
    }

    function showGameOverModal(title, text) {
        state.gameOver = true;
        const score = computeScore();
        dom.gameOverTitle.textContent = title;
        dom.gameOverText.textContent = `${text} Score final: ${formatNumber(score)}.`;
        dom.gameOverModal.classList.remove("hidden");
        dom.gameOverModal.setAttribute("aria-hidden", "false");
        reportScore(score);
    }

    function closeGameOverModal() {
        dom.gameOverModal.classList.add("hidden");
        dom.gameOverModal.setAttribute("aria-hidden", "true");
    }

    function evaluateGameState() {
        if (!state.started || state.gameOver || !state.stats) return;

        const s = state.stats;
        const armyPower = computeArmyPower();

        if (s.approval <= 8) {
            showGameOverModal("Defaite electorale", "Ta popularite s'effondre et ton gouvernement tombe.");
            return;
        }

        if (s.stability <= 7) {
            showGameOverModal("Crise institutionnelle", "Les institutions cessent de fonctionner correctement.");
            return;
        }

        if (s.treasury <= -4500) {
            showGameOverModal("Banqueroute d'Etat", "Le Tresor est en faillite et les services s'arretent.");
            return;
        }

        if (s.security <= 8 && armyPower < 120) {
            showGameOverModal("Effondrement securitaire", "L'Etat perd le controle du territoire.");
            return;
        }

        if (state.turn > 48) {
            showGameOverModal("Fin de mandat", "Tu as complete un mandat presidentiel entier.");
        }
    }

    function serializeState() {
        return {
            version: SAVE_VERSION,
            state
        };
    }

    function migrateLegacySave(rawData) {
        const fresh = createInitialState();
        if (!rawData || typeof rawData !== "object") return fresh;

        if (rawData.stats && rawData.playerNationId) {
            const nation = nationById(rawData.playerNationId) || nationById("france");
            fresh.started = true;
            fresh.playerNationId = nation.id;
            fresh.selectedNationId = rawData.selectedNationId || nation.id;
            fresh.turn = Number(rawData.turn) || 1;
            fresh.monthIndex = Number(rawData.monthIndex) || 0;
            fresh.year = Number(rawData.year) || 2026;
            fresh.stats = Object.assign(initialStatsFromNation(nation), rawData.stats);
            fresh.relations = rawData.relations || initializeRelations(nation.id);
            fresh.foreign = rawData.foreign || initializeForeignData(nation.id);
            fresh.log = Array.isArray(rawData.log) ? rawData.log.slice(0, 30) : [];
            fresh.policyOptions = pickRandomFromPool(POLICIES, 4);
            fresh.doctrineId = "balanced";
            fresh.objectives.activeIds = pickRandomFromPool(OBJECTIVE_POOL, 3).map((item) => item.id);
            return fresh;
        }

        return fresh;
    }

    function loadSerializedState(payload) {
        const base = createInitialState();
        if (!payload || typeof payload !== "object") return base;

        const incoming = payload.state || payload;
        const merged = Object.assign(base, incoming);

        merged.modifiers = Object.assign(base.modifiers, incoming.modifiers || {});
        merged.monuments = Object.assign(base.monuments, incoming.monuments || {});
        merged.army = Object.assign(base.army, incoming.army || {});
        merged.army.units = Object.assign(base.army.units, (incoming.army && incoming.army.units) || {});
        merged.objectives = Object.assign(base.objectives, incoming.objectives || {});
        merged.weather = Object.assign(base.weather, incoming.weather || {});
        merged.doctrineId = incoming.doctrineId || base.doctrineId;

        if (!merged.stats && merged.playerNationId) {
            const nation = nationById(merged.playerNationId);
            merged.stats = nation ? initialStatsFromNation(nation) : null;
        }

        return merged;
    }

    function saveGame() {
        if (!state.started) return;
        localStorage.setItem(SAVE_KEY, JSON.stringify(serializeState()));
        addLog("Sauvegarde locale enregistree.");
        renderLog();
    }

    function loadGame() {
        const raw = localStorage.getItem(SAVE_KEY);
        if (!raw) {
            alert("Aucune sauvegarde disponible.");
            return;
        }

        try {
            const data = JSON.parse(raw);
            if (!data.version || data.version < 2) {
                state = migrateLegacySave(data);
            } else {
                state = loadSerializedState(data);
            }

            normalizeState();
            state.started = true;
            if (!state.doctrineId) {
                state.doctrineId = "balanced";
            }
            if (!state.objectives.activeIds || !state.objectives.activeIds.length) {
                pickQuarterObjectives();
            }
            if (state.objectives.nextEvaluationTurn < state.turn) {
                const phase = state.turn % 3;
                state.objectives.nextEvaluationTurn = phase === 0 ? state.turn : state.turn + (3 - phase);
            }
            dom.setupScreen.classList.add("hidden");
            dom.gameUi.classList.remove("hidden");
            closeEventModal();
            closeGameOverModal();
            renderAll();

            if (state.pendingEvent) {
                showEventModal(state.pendingEvent);
            }
        } catch (error) {
            console.error(error);
            alert("Sauvegarde corrompue ou incompatible.");
        }
    }

    function reportScore(score) {
        const payload = { type: "gameScore", gameId: HUB_GAME_ID, score };
        try {
            if (window.opener && window.opener !== window) {
                window.opener.postMessage(payload, window.location.origin);
            }
        } catch (error) {
            console.warn("Unable to send score to opener", error);
        }

        try {
            if (window.parent && window.parent !== window) {
                window.parent.postMessage(payload, window.location.origin);
            }
        } catch (error) {
            console.warn("Unable to send score to parent", error);
        }
    }

    function selectNationOnMap(nationId) {
        if (!state.started) return;
        state.selectedNationId = nationId;
        renderSelectedNation();
        renderMap();
    }

    function startGame() {
        const nation = nationById(dom.startNation.value);
        if (!nation) return;

        state = createInitialState();
        state.started = true;
        state.playerNationId = nation.id;
        state.selectedNationId = nation.id;
        state.doctrineId = dom.startDoctrine.value || "balanced";
        state.stats = initialStatsFromNation(nation);
        state.relations = initializeRelations(nation.id);
        state.foreign = initializeForeignData(nation.id);
        state.army = initialArmyFromNation(nation);

        applyDoctrineStartPackage();
        pickQuarterObjectives();

        pickPolicyOptions();
        pickLawOptions();

        addLog(`Prise de fonction a la tete de ${nation.name}.`);
        addLog("Le cabinet est forme: economie, armee, climat et diplomatie sous surveillance.");
        addLog("Nouveaux objectifs trimestriels publies par le conseil d'Etat.");

        normalizeState();

        dom.setupScreen.classList.add("hidden");
        dom.gameUi.classList.remove("hidden");
        closeEventModal();
        closeGameOverModal();
        renderAll();
    }

    function resetToSetup() {
        closeEventModal();
        closeGameOverModal();
        state = createInitialState();
        dom.setupScreen.classList.remove("hidden");
        dom.gameUi.classList.add("hidden");
    }

    function bindEvents() {
        dom.startGameBtn.addEventListener("click", startGame);
        dom.endTurnBtn.addEventListener("click", advanceOneMonth);
        dom.saveBtn.addEventListener("click", saveGame);
        dom.loadBtn.addEventListener("click", loadGame);

        dom.diploButtons.forEach((button) => {
            button.addEventListener("click", () => executeDiplomaticAction(button.dataset.action));
        });

        dom.mapNations.forEach((shape) => {
            shape.addEventListener("click", () => {
                selectNationOnMap(shape.dataset.nation);
            });

            if (window.PointerEvent) {
                shape.addEventListener("pointerup", (e) => {
                    if (e.pointerType !== "mouse") {
                        e.preventDefault();
                        selectNationOnMap(shape.dataset.nation);
                    }
                });
            }
        });

        dom.restartBtn.addEventListener("click", resetToSetup);
    }

    function init() {
        initializeStartSelect();
        bindEvents();
    }

    init();
})();
