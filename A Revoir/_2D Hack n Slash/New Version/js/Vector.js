class Vector {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    add(v) {
        return new Vector(this.x + v.x, this.y + v.y);
    }
    sub(v) {
        return new Vector(this.x - v.x, this.y - v.y);
    }
    mul(s) {
        return new Vector(this.x * s, this.y * s);
    }
    length() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }
    normalize() {
        const len = this.length();
        return len > 0 ? this.mul(1 / len) : new Vector(0, 0);
    }
    distance(v) {
        return this.sub(v).length();
    }
    dot(v) {
        return this.x * v.x + this.y * v.y;
    }
}
