// Menu.js - Main menu + pause menu

Game.Menu = {
  active: false,
  mode: "pause", // "main" | "pause"

  open(mode = "pause") {
    this.mode = mode;
    this.active = true;
    if (Input.clear) Input.clear();
  },

  close() {
    this.active = false;
    if (Input.clear) Input.clear();
  },

  togglePause() {
    if (this.active && this.mode === "pause") {
      this.close();
      return;
    }
    this.open("pause");
  },

  update() {
    if (Game.Shop && Game.Shop.menuOpen && Input.wasJustPressed("escape")) {
      Game.Shop.menuOpen = false;
      if (Input.clear) Input.clear();
      return;
    }

    if (!this.active && Input.pause()) {
      this.open("pause");
      return;
    }

    if (!this.active) return;

    if (Input.wasJustPressed("r") && Game.resetGame) {
      Game.resetGame({ openMenu: false, submitScore: true });
      this.close();
      if (Game.HUD) {
        Game.HUD.showMessage("Partie relancee", 120);
      }
      return;
    }

    if (Input.wasJustPressed("m")) {
      this.open("main");
      return;
    }

    if (Input.wasJustPressed("escape")) {
      if (this.mode === "pause") {
        this.close();
      }
      return;
    }

    if (Input.wasJustPressed("enter") || Input.wasJustPressed(" ")) {
      this.close();
      if (this.mode === "main" && Game.HUD) {
        Game.HUD.showMessage("Bonne partie", 120);
      }
    }
  },

  draw(ctx, canvas) {
    if (!this.active) return;

    ctx.fillStyle = "rgba(0, 0, 0, 0.78)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.textAlign = "center";
    ctx.fillStyle = "#ffffff";
    ctx.font = "700 52px Arial";
    ctx.fillText(this.mode === "main" ? "MENU PRINCIPAL" : "PAUSE", canvas.width / 2, 130);

    ctx.fillStyle = "#9cc7ff";
    ctx.font = "22px Arial";
    ctx.fillText("Entrer: jouer/reprendre", canvas.width / 2, 210);
    ctx.fillText("R: recommencer la partie", canvas.width / 2, 245);
    ctx.fillText("M: menu principal", canvas.width / 2, 280);
    ctx.fillText("Echap: fermer la pause", canvas.width / 2, 315);

    if (Game.HUD) {
      ctx.fillStyle = "#ffd66b";
      ctx.font = "24px Arial";
      ctx.fillText(`Argent: $${Utils.formatNumber(Game.HUD.money || 0)}`, canvas.width / 2, 390);
      ctx.fillText(`Score: ${Utils.formatNumber(Game.HUD.score || 0)}`, canvas.width / 2, 425);
      ctx.fillText(`Wanted: ${Game.HUD.wantedLevel || 0}`, canvas.width / 2, 460);
    }

    ctx.textAlign = "left";
  }
};
