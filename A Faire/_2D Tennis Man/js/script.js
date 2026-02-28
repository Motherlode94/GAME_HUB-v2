const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 1000;
canvas.height = 600;

/* =====================
   SCORE
===================== */

let playerScore = 0;
let aiScore = 0;

const scoreElement = document.getElementById("score");

function updateScore() {
    scoreElement.textContent =
        "Joueur : " + playerScore + " | IA : " + aiScore;
}

/* =====================
   COURT SETTINGS
===================== */

const court = {
    margin: 80,
    netY: canvas.height / 2
};

/* =====================
   PLAYER
===================== */

const player = {
    x: canvas.width / 2 - 40,
    y: canvas.height - 120,
    width: 80,
    height: 15,
    speed: 7
};

/* =====================
   AI
===================== */

const ai = {
    x: canvas.width / 2 - 40,
    y: 100,
    width: 80,
    height: 15,
    speed: 4
};

/* =====================
   BALL
===================== */

const ball = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    radius: 10,
    vx: 4,
    vy: 4
};

let keys = {
    ArrowLeft: false,
    ArrowRight: false
};

document.addEventListener("keydown", e => {
    if (e.key in keys) keys[e.key] = true;
});

document.addEventListener("keyup", e => {
    if (e.key in keys) keys[e.key] = false;
});

/* =====================
   DRAW COURT
===================== */

function drawCourt() {

    ctx.fillStyle = "#1e7f1e";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = "white";
    ctx.lineWidth = 4;

    // terrain extérieur
    ctx.strokeRect(
        court.margin,
        court.margin,
        canvas.width - court.margin * 2,
        canvas.height - court.margin * 2
    );

    // filet
    ctx.fillStyle = "white";
    ctx.fillRect(
        court.margin,
        court.netY - 3,
        canvas.width - court.margin * 2,
        6
    );
}

/* =====================
   COLLISION
===================== */

function paddleCollision(paddle) {

    if (
        ball.x > paddle.x &&
        ball.x < paddle.x + paddle.width &&
        ball.y + ball.radius > paddle.y &&
        ball.y - ball.radius < paddle.y + paddle.height
    ) {
        ball.vy *= -1;

        // angle dynamique
        let impact =
            (ball.x - (paddle.x + paddle.width / 2))
            / (paddle.width / 2);

        ball.vx = impact * 6;
    }
}

/* =====================
   RESET BALL
===================== */

function resetBall() {
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    ball.vx = (Math.random() > 0.5 ? 4 : -4);
    ball.vy = (Math.random() > 0.5 ? 4 : -4);
}

/* =====================
   UPDATE LOOP
===================== */

function update() {

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawCourt();

    // mouvement joueur
    if (keys.ArrowLeft && player.x > court.margin)
        player.x -= player.speed;

    if (keys.ArrowRight &&
        player.x + player.width < canvas.width - court.margin)
        player.x += player.speed;

    // déplacement balle
    ball.x += ball.vx;
    ball.y += ball.vy;

    // rebond murs latéraux
    if (ball.x - ball.radius < court.margin ||
        ball.x + ball.radius > canvas.width - court.margin)
        ball.vx *= -1;

    // collision joueur
    paddleCollision(player);

    // collision IA
    paddleCollision(ai);

    // IA suit balle
    ai.x += (ball.x - (ai.x + ai.width / 2)) * 0.05;

    // point joueur
    if (ball.y < court.margin) {
        playerScore++;
        updateScore();
        resetBall();
    }

    // point IA
    if (ball.y > canvas.height - court.margin) {
        aiScore++;
        updateScore();
        resetBall();
    }

    // dessin raquettes
    ctx.fillStyle = "white";
    ctx.fillRect(player.x, player.y, player.width, player.height);
    ctx.fillRect(ai.x, ai.y, ai.width, ai.height);

    // dessin balle
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = "yellow";
    ctx.fill();

    requestAnimationFrame(update);
}

updateScore();
update();