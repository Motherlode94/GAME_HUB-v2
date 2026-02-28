// ─────────────────────────────────────────────
//  levels.js  –  3 worlds
// ─────────────────────────────────────────────

var TILE_SIZE  = 32;
var LEVEL_ROWS = 20;
var LEVEL_COLS = 80;

function _emptyMap() {
    return Array.from({ length: LEVEL_ROWS }, function () {
        return new Array(LEVEL_COLS).fill(0);
    });
}

function _fill(map, row, c1, c2) {
    for (var c = c1; c <= c2; c++) {
        if (row >= 0 && row < LEVEL_ROWS && c >= 0 && c < LEVEL_COLS)
            map[row][c] = 1;
    }
}

function _coin(col, row) {
    return { x: col * TILE_SIZE + 7, y: row * TILE_SIZE + 7 };
}

function _enemy(col, surfaceRow, minCol, maxCol, speed) {
    return {
        x:    col     * TILE_SIZE,
        y:    surfaceRow * TILE_SIZE - 34,
        minX: minCol  * TILE_SIZE,
        maxX: maxCol  * TILE_SIZE,
        speed: speed || 1.2
    };
}

function _mp(col, row, widthPx, minCol, maxCol, speed) {
    return {
        x: col * TILE_SIZE, y: row * TILE_SIZE,
        w: widthPx, h: 14,
        minX: minCol * TILE_SIZE, maxX: maxCol * TILE_SIZE,
        speed: speed
    };
}

// ── WORLD 1-1 : Grasslands ───────────────────
function _buildLevel1() {
    var map = _emptyMap();

    _fill(map, 19, 0, 79);          // solid bottom
    _fill(map, 18, 0, 12);          // start ground
    // gap 13-15
    _fill(map, 18, 16, 31);         // mid-left
    // gap 32-35 (moving platform)
    _fill(map, 18, 36, 50);         // mid-right
    // gap 51-54 (moving platform)
    _fill(map, 18, 55, 79);         // right ground

    _fill(map, 15,  7, 10);
    _fill(map, 14, 12, 16);
    _fill(map, 12, 20, 23);
    _fill(map, 10, 27, 30);
    _fill(map, 11, 40, 44);
    _fill(map,  9, 46, 50);
    _fill(map, 12, 60, 64);
    _fill(map, 10, 68, 72);
    _fill(map, 14, 74, 77);

    return {
        name: 'WORLD 1-1  GRASSLANDS',
        bg: 'sky',
        map: map,
        playerStart: { x: 2 * TILE_SIZE, y: 16 * TILE_SIZE },
        goalX: 77 * TILE_SIZE,
        coins: [
            _coin(3,17), _coin(5,17), _coin(8,17), _coin(11,17),
            _coin(8,14), _coin(9,14), _coin(10,14),
            _coin(13,13), _coin(14,13), _coin(15,13), _coin(16,13),
            _coin(21,11), _coin(22,11), _coin(23,11),
            _coin(28, 9), _coin(29, 9), _coin(30, 9),
            _coin(19,17), _coin(23,17), _coin(28,17),
            _coin(37,17), _coin(41,17), _coin(46,17), _coin(49,17),
            _coin(41,10), _coin(43,10),
            _coin(47, 8), _coin(49, 8),
            _coin(57,17), _coin(61,17), _coin(65,17), _coin(69,17),
            _coin(61,11), _coin(63,11),
            _coin(69, 9), _coin(71, 9),
            _coin(75,13), _coin(76,13),
        ],
        enemies: [
            _enemy( 8, 18,  1, 11, 1.2),
            _enemy(24, 18, 17, 30, 1.4),
            _enemy(44, 18, 37, 49, 1.3),
        ],
        movingPlatforms: [
            _mp(30, 14, 90, 29, 36, 1.8),
            _mp(49, 13, 90, 48, 55, 2.2),
        ],
    };
}

// ── WORLD 1-2 : Rocky Canyon ─────────────────
function _buildLevel2() {
    var map = _emptyMap();

    _fill(map, 19, 0, 79);
    _fill(map, 18, 0,  8);
    // gap 9-14
    _fill(map, 18, 15, 21);
    // gap 22-24
    _fill(map, 18, 25, 32);
    // gap 33-36
    _fill(map, 18, 37, 44);
    // gap 45-49
    _fill(map, 18, 50, 58);
    // gap 59-62
    _fill(map, 18, 63, 79);

    _fill(map, 12,  2,  5);
    _fill(map, 14, 10, 13);
    _fill(map, 10, 17, 19);
    _fill(map, 12, 26, 29);
    _fill(map,  9, 30, 33);
    _fill(map, 11, 38, 41);
    _fill(map,  8, 52, 56);
    _fill(map, 12, 64, 67);
    _fill(map, 10, 71, 74);

    return {
        name: 'WORLD 1-2  ROCKY CANYON',
        bg: 'cave',
        map: map,
        playerStart: { x: 1 * TILE_SIZE, y: 16 * TILE_SIZE },
        goalX: 77 * TILE_SIZE,
        coins: [
            _coin(3,17), _coin(5,17), _coin(7,17),
            _coin(3,11), _coin(4,11), _coin(5,11),
            _coin(11,13), _coin(12,13),
            _coin(17, 9), _coin(18, 9),
            _coin(26,11), _coin(27,11), _coin(28,11),
            _coin(31, 8), _coin(32, 8),
            _coin(20,17), _coin(25,17), _coin(32,17),
            _coin(39,10), _coin(40,10),
            _coin(38,17), _coin(42,17),
            _coin(53, 7), _coin(54, 7), _coin(55, 7),
            _coin(51,17), _coin(56,17),
            _coin(64,17), _coin(68,17), _coin(73,17),
            _coin(65,11), _coin(66,11),
            _coin(71, 9), _coin(72, 9),
            _coin(77,17), _coin(78,17),
        ],
        enemies: [
            _enemy( 4, 18,  1,  7, 1.5),
            _enemy(18, 18, 16, 21, 1.7),
            _enemy(28, 18, 26, 31, 2.0),
            _enemy(39, 18, 38, 43, 2.0),
            _enemy(54, 18, 51, 57, 1.8),
            _enemy(67, 18, 64, 78, 2.2),
        ],
        movingPlatforms: [
            _mp(30, 13, 90, 28, 38, 2.0),
            _mp(43, 12, 90, 42, 52, 2.5),
            _mp(57, 10, 80, 55, 64, 1.8),
        ],
    };
}

// ── WORLD 1-3 : Sky Fortress ─────────────────
function _buildLevel3() {
    var map = _emptyMap();

    _fill(map, 19, 0, 79);          // lava floor / death pit
    _fill(map, 18, 0,  5);          // start pad
    _fill(map, 15,  7, 10);
    _fill(map, 12, 12, 15);
    _fill(map, 14, 18, 20);
    _fill(map, 11, 22, 25);
    _fill(map, 13, 28, 32);
    _fill(map, 10, 35, 37);
    _fill(map, 12, 40, 43);
    _fill(map,  9, 45, 47);
    _fill(map, 11, 50, 53);
    _fill(map, 13, 56, 59);
    _fill(map, 10, 62, 65);
    _fill(map, 12, 68, 71);
    _fill(map, 14, 73, 77);
    _fill(map, 18, 73, 79);         // goal pad (ground level)

    return {
        name: 'WORLD 1-3  SKY FORTRESS',
        bg: 'sky',
        map: map,
        playerStart: { x: 1 * TILE_SIZE, y: 16 * TILE_SIZE },
        goalX: 76 * TILE_SIZE,
        coins: [
            _coin( 2,17), _coin( 4,17),
            _coin( 8,14), _coin( 9,14), _coin(10,14),
            _coin(13,11), _coin(14,11), _coin(15,11),
            _coin(19,13), _coin(20,13),
            _coin(23,10), _coin(24,10), _coin(25,10),
            _coin(29,12), _coin(30,12), _coin(31,12), _coin(32,12),
            _coin(36, 9), _coin(37, 9),
            _coin(41,11), _coin(42,11), _coin(43,11),
            _coin(46, 8), _coin(47, 8),
            _coin(51,10), _coin(52,10), _coin(53,10),
            _coin(57,12), _coin(58,12),
            _coin(63, 9), _coin(64, 9), _coin(65, 9),
            _coin(69,11), _coin(70,11), _coin(71,11),
            _coin(74,13), _coin(75,13), _coin(76,13), _coin(77,13),
        ],
        enemies: [
            _enemy( 8, 15,  7, 10, 1.0),
            _enemy(13, 12, 12, 15, 1.4),
            _enemy(22, 11, 22, 25, 1.8),
            _enemy(30, 13, 28, 32, 2.2),
            _enemy(36, 10, 35, 37, 2.5),
            _enemy(41, 12, 40, 43, 2.0),
            _enemy(51, 11, 50, 53, 2.3),
            _enemy(63, 10, 62, 65, 2.8),
            _enemy(74, 14, 73, 77, 2.4),
        ],
        movingPlatforms: [
            _mp( 5, 14, 80,  4, 13, 2.8),
            _mp(11, 11, 80, 10, 17, 3.2),
            _mp(20,  9, 80, 19, 26, 3.5),
            _mp(33,  8, 80, 32, 39, 3.8),
            _mp(43, 10, 80, 42, 49, 3.2),
            _mp(55, 11, 80, 54, 61, 2.8),
            _mp(65, 13, 80, 64, 72, 3.0),
        ],
    };
}

var LEVELS = [
    _buildLevel1(),
    _buildLevel2(),
    _buildLevel3(),
];