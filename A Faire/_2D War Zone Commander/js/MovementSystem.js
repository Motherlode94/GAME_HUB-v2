window.RTS = window.RTS || {};

RTS.MovementSystem = {

    update: function(units, delta) {

        units.forEach(function(unit) {

            if (!unit.target || !Number.isFinite(delta) || delta <= 0) return;

            var dx   = unit.target.x - unit.x;
            var dy   = unit.target.y - unit.y;
            var dist = Math.sqrt(dx * dx + dy * dy);

            if (dist > Math.max(2, unit.speed * delta)) {
                unit.x += (dx / dist) * unit.speed * delta;
                unit.y += (dy / dist) * unit.speed * delta;
            } else {
                unit.x = unit.target.x;
                unit.y = unit.target.y;
                unit.target = null;
            }
        });
    }
};