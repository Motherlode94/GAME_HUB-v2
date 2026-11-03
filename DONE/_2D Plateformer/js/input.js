// ─────────────────────────────────────────────
//  input.js  –  keyboard & click input module
// ─────────────────────────────────────────────
var Input = (function () {
    var _keys    = {};
    var _just    = {};
    var _clicked = false;

    var PREVENT = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'];

    window.addEventListener('keydown', function (e) {
        if (!_keys[e.code]) _just[e.code] = true;
        _keys[e.code] = true;
        if (PREVENT.indexOf(e.code) !== -1) e.preventDefault();
    });

    window.addEventListener('keyup', function (e) {
        _keys[e.code] = false;
    });

    // Release all controls if the browser loses focus.
    window.addEventListener('blur', function () {
        for (var key in _keys) _keys[key] = false;
        for (var code in _just) delete _just[code];
    });

    window.addEventListener('click', function () {
        _clicked = true;
    });

    function clearFrame() {
        for (var k in _just) delete _just[k];
        _clicked = false;
    }

    return {
        // Pass this object directly to player.handleInput()
        keys: _keys,

        isJustPressed: function (code) {
            return !!_just[code];
        },

        // True if any key was pressed OR screen was clicked this frame
        isAnyAction: function () {
            return Object.keys(_just).length > 0 || _clicked;
        },

        clearFrame: clearFrame
    };
})();