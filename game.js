const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let gameRunning = false;
const keys = {};

class Player {
    constructor(x, y, color, controls) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.radius = 25;
        this.speed = 4;

        this.controls = controls;
        this.isAttacking = false;
        this.isParrying = false;
    }

    draw() {
        // body
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // spear (just a line for now)
        ctx.strokeStyle = "brown";
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(this.x + this.radius, this.y);
        ctx.lineTo(this.x + this.radius + 40, this.y);
        ctx.stroke();

        // shield (semi-oval)
        ctx.fillStyle = "gold";
        ctx.beginPath();
        ctx.ellipse(this.x - this.radius - 15, this.y, 15, 25, 0, 0, Math.PI * 2);
        ctx.fill();
    }
}

const player1 = new Player(150, canvas.height / 2, "peachpuff", {
    up: "w",
    down: "s",
    left: "a",
    right: "d",
    stab: "g",
    parry: "h"
});

const player2 = new Player(canvas.width - 150, canvas.height / 2, "tan", {
    up: "ArrowUp",
    down: "ArrowDown",
    left: "ArrowLeft",
    right: "ArrowRight",
    stab: "4",
    parry: "5"
});

document.addEventListener("keydown", (e) => {
    keys[e.key] = true;

    if (e.key === player1.controls.stab) player1.isAttacking = true;
    if (e.key === player1.controls.parry) player1.isParrying = true;

    if (e.key === player2.controls.stab) player2.isAttacking = true;
    if (e.key === player2.controls.parry) player2.isParrying = true;
});

document.addEventListener("keyup", (e) => {
    keys[e.key] = false;

    if (e.key === player1.controls.stab) player1.isAttacking = false;
    if (e.key === player1.controls.parry) player1.isParrying = false;

    if (e.key === player2.controls.stab) player2.isAttacking = false;
    if (e.key === player2.controls.parry) player2.isParrying = false;
});

function attack(player) {
    // placeholder spear thrust animation
    ctx.strokeStyle = "gray";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(player.x + player.radius, player.y);
    ctx.lineTo(player.x + player.radius + 60, player.y);
    ctx.stroke();
}

function parry(player) {
    // placeholder parry shield rotation
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(Math.PI / 2); // rotate 90 degrees
    ctx.fillStyle = "gold";
    ctx.beginPath();
    ctx.ellipse(-player.radius - 15, 0, 15, 25, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}

function update() {
    // Player 1 movement
    if (keys[player1.controls.left]) player1.x -= player1.speed;
    if (keys[player1.controls.right]) player1.x += player1.speed;
    if (keys[player1.controls.up]) player1.y -= player1.speed;
    if (keys[player1.controls.down]) player1.y += player1.speed;

    // Player 2 movement
    if (keys[player2.controls.left]) player2.x -= player2.speed;
    if (keys[player2.controls.right]) player2.x += player2.speed;
    if (keys[player2.controls.up]) player2.y -= player2.speed;
    if (keys[player2.controls.down]) player2.y += player2.speed;

    // keep inside arena
    player1.x = Math.max(30, Math.min(canvas.width - 30, player1.x));
    player1.y = Math.max(30, Math.min(canvas.height - 30, player1.y));
    player2.x = Math.max(30, Math.min(canvas.width - 30, player2.x));
    player2.y = Math.max(30, Math.min(canvas.height - 30, player2.y));
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // arena
    ctx.fillStyle = "#222";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // players
    player1.draw();
    player2.draw();

    if (player1.isAttacking) attack(player1);
    if (player2.isAttacking) attack(player2);

    if (player1.isParrying) parry(player1);
    if (player2.isParrying) parry(player2);
}

function gameLoop() {
    if (gameRunning) {
        update();
        draw();
        requestAnimationFrame(gameLoop);
    }
}

document.getElementById("startBtn").addEventListener("click", () => {
    document.getElementById("menu").style.display = "none";
    canvas.style.display = "block";
    gameRunning = true;
    gameLoop();
});
