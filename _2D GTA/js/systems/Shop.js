// Shop.js - Weapon shop

Game.Shop = {
  shops: [],
  nearShop: null,
  menuOpen: false,

  init() {
    this.shops = [];
    this.nearShop = null;
    this.menuOpen = false;

    this.addShop(1000, 500, "Ammu-Nation");
    this.addShop(2500, 1500, "Gun Store");
  },

  addShop(x, y, name) {
    this.shops.push({
      x,
      y,
      width: 80,
      height: 80,
      name,
      color: "#ff00ff"
    });
  },

  update() {
    const player = Game.player;
    if (!player) return;

    this.nearShop = null;

    for (const shop of this.shops) {
      const dist = Utils.distance(
        player.x + player.size / 2,
        player.y + player.size / 2,
        shop.x + shop.width / 2,
        shop.y + shop.height / 2
      );

      if (dist < 100) {
        this.nearShop = shop;
        break;
      }
    }

    if (Game.Menu && Game.Menu.active) {
      this.menuOpen = false;
      return;
    }

    if (this.nearShop && Input.wasJustPressed("f")) {
      this.menuOpen = !this.menuOpen;
    }

    if (!this.menuOpen) return;

    if (Input.wasJustPressed("1")) this.buyItem("pistol");
    if (Input.wasJustPressed("2")) this.buyItem("uzi");
    if (Input.wasJustPressed("3")) this.buyItem("shotgun");
    if (Input.wasJustPressed("4")) this.buyItem("ammo");
    if (Input.wasJustPressed("escape")) this.menuOpen = false;
  },

  buyItem(itemType) {
    if (!Game.WeaponManager || !Game.HUD) return;

    let result;

    if (itemType === "ammo") {
      result = Game.WeaponManager.buyAmmo(50, 100);
    } else {
      result = Game.WeaponManager.buyWeapon(itemType);
    }

    if (result.success) {
      Game.HUD.showMessage(`OK ${result.message}`, 60);
    } else {
      Game.HUD.showMessage(`ERREUR ${result.message}`, 60);
    }
  },

  draw(ctx) {
    for (const shop of this.shops) {
      ctx.fillStyle = shop.color;
      ctx.fillRect(shop.x, shop.y, shop.width, shop.height);

      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 3;
      ctx.strokeRect(shop.x, shop.y, shop.width, shop.height);

      ctx.fillStyle = "#ffffff";
      ctx.font = "18px Arial";
      ctx.textAlign = "center";
      ctx.fillText("SHOP", shop.x + shop.width / 2, shop.y + shop.height / 2 + 6);
    }

    if (this.nearShop && !this.menuOpen) {
      const shop = this.nearShop;
      ctx.fillStyle = "#ffffff";
      ctx.font = "16px Arial";
      ctx.textAlign = "center";
      ctx.fillText("Appuyez sur F", shop.x + shop.width / 2, shop.y - 10);
    }
  },

  drawUI(ctx, canvas) {
    if (!this.menuOpen || !this.nearShop || !Game.WeaponManager || !Game.HUD) return;

    ctx.fillStyle = "rgba(0,0,0,0.82)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#ff00ff";
    ctx.font = "bold 40px Arial";
    ctx.textAlign = "center";
    ctx.fillText(`SHOP ${this.nearShop.name}`, canvas.width / 2, 80);

    ctx.fillStyle = "#ffffff";
    ctx.font = "20px Arial";

    const startY = 150;
    const lineHeight = 60;

    const weapons = Game.WeaponManager.weapons;
    const inventory = Game.WeaponManager.inventory;

    const hasPistol = inventory.includes("pistol");
    ctx.fillStyle = hasPistol ? "#888888" : "#ffff00";
    ctx.fillText(`[1] Pistolet - $${weapons.pistol.price}`, canvas.width / 2, startY);
    if (hasPistol) ctx.fillText("(Possede)", canvas.width / 2, startY + 20);

    const hasUzi = inventory.includes("uzi");
    ctx.fillStyle = hasUzi ? "#888888" : "#ff8800";
    ctx.fillText(`[2] Uzi - $${weapons.uzi.price}`, canvas.width / 2, startY + lineHeight);
    if (hasUzi) ctx.fillText("(Possede)", canvas.width / 2, startY + lineHeight + 20);

    const hasShotgun = inventory.includes("shotgun");
    ctx.fillStyle = hasShotgun ? "#888888" : "#ff0000";
    ctx.fillText(`[3] Shotgun - $${weapons.shotgun.price}`, canvas.width / 2, startY + lineHeight * 2);
    if (hasShotgun) ctx.fillText("(Possede)", canvas.width / 2, startY + lineHeight * 2 + 20);

    ctx.fillStyle = "#44ff44";
    ctx.fillText("[4] 50 Munitions - $100", canvas.width / 2, startY + lineHeight * 3);

    ctx.fillStyle = "#ffd700";
    ctx.font = "24px Arial";
    ctx.fillText(`Argent: $${Game.HUD.money}`, canvas.width / 2, startY + lineHeight * 4 + 20);

    ctx.fillStyle = "#aaaaaa";
    ctx.font = "18px Arial";
    ctx.fillText("Echap pour fermer", canvas.width / 2, canvas.height - 30);

    ctx.textAlign = "left";
  }
};
