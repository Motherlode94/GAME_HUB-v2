// walls.js
class Wall extends Building {
  constructor(x, y) {
    super(x, y, faction, "wall");
    this.blockMovement = true;
    this.projectileBlock = true;
  }
}