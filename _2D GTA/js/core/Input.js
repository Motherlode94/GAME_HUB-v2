window.Input = {
  keys: new Set(),
  mouseX: 0,
  mouseY: 0,
  mouseDown: false,
  
  // Touches pressées ce frame (pour détecter "juste pressé")
  justPressed: new Set(),
  justReleased: new Set()
};

const BLOCKED_KEYS = new Set([
  "arrowup",
  "arrowdown",
  "arrowleft",
  "arrowright",
  " ",
  "tab"
]);

window.addEventListener("keydown", (e) => {
  const key = e.key.toLowerCase();
  if (BLOCKED_KEYS.has(key)) {
    e.preventDefault();
  }
  if (!Input.keys.has(key)) {
    Input.justPressed.add(key);
  }
  Input.keys.add(key);
});

window.addEventListener("keyup", (e) => {
  const key = e.key.toLowerCase();
  if (BLOCKED_KEYS.has(key)) {
    e.preventDefault();
  }
  Input.keys.delete(key);
  Input.justReleased.add(key);
});

// Souris
window.addEventListener("mousemove", (e) => {
  Input.mouseX = e.clientX;
  Input.mouseY = e.clientY;
});

window.addEventListener("mousedown", (e) => {
  Input.mouseDown = true;
});

window.addEventListener("mouseup", (e) => {
  Input.mouseDown = false;
});

// Méthodes utilitaires
Input.isPressed = (key) => Input.keys.has(key.toLowerCase());

Input.wasJustPressed = (key) => Input.justPressed.has(key.toLowerCase());

Input.wasJustReleased = (key) => Input.justReleased.has(key.toLowerCase());

// À appeler à la fin de chaque frame pour nettoyer les événements "just pressed/released"
Input.update = () => {
  Input.justPressed.clear();
  Input.justReleased.clear();
};

// Alias pour les contrôles
Input.moveUp = () => Input.isPressed("z") || Input.isPressed("arrowup") || Input.isPressed("w");
Input.moveDown = () => Input.isPressed("s") || Input.isPressed("arrowdown");
Input.moveLeft = () => Input.isPressed("q") || Input.isPressed("arrowleft") || Input.isPressed("a");
Input.moveRight = () => Input.isPressed("d") || Input.isPressed("arrowright");
Input.action = () => Input.isPressed("e") || Input.isPressed("enter") || Input.isPressed(" ");
Input.pause = () => Input.wasJustPressed("escape") || Input.wasJustPressed("p");

Input.clear = () => {
  Input.keys.clear();
  Input.justPressed.clear();
  Input.justReleased.clear();
  Input.mouseDown = false;
};
