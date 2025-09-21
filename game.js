const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 800;
canvas.height = 400;

class Player {
    constructor(x, color, controls) {
        this.x = x;
        this.y = canvas.height / 2;
        this.radius = 20;
        this.color = color;
        this.controls = controls;
        this.speed = 4;
        this.isAttacking = false;
        this.isParrying = false;
        this.stunned = false;
        this.stunTimer = 0;
    }

    draw() {
        // body
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // spear
        ctx.strokeStyle = "brown";
        ctx.lineWidth = 4;
        ctx.beginPath();
        let spearOffset = this.isAttacking ? 40 : 30;
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x + (this.controls.facing * spearOffset), this.y);
        ctx.stroke();

        ctx.strokeStyle = "silver";
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(this.x + (this.controls.facing * spearOffset), this.y);
        ctx.lineTo(this.x + (this.controls.facing * (spearOffset + 20)), this.y);
        ctx.stroke();

        // shield
        ctx.save();
        ctx.translate(this.x - this.controls.facing * 25, this.y);
        if (this.isParrying) ctx.rotate(this.controls.facing * Math.PI / 2);
        ctx.fillStyle = "gray";
        ctx.beginPath();
        ctx.ellipse(0, 0, 10, 20, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    move(keys) {
        if (this.stunned) return;
        if (keys[this.controls.up]) this.y -= this.speed;
        if (keys[this.controls.down]) this.y += this.speed;
        if (keys[this.controls.left]) this.x -= this.speed;
        if (keys[this.controls.right]) this.x += this.speed;
    }

    update() {
        if (this.stunned) {
            this.stunTimer--;
            if (this.stunTimer <= 0) this.stunned = false;
        }
    }
}

// Controls mapping
const player1Controls = {
    up: "w",
    down: "s",
    left: "a",
    right: "d",
    stab: "g",
    parry: "h",
    facing: 1
};

const player2Controls = {
    up: "ArrowUp",
    down: "ArrowDown",
    left: "ArrowLeft",
    right: "ArrowRight",
    stab: "4",
    parry: "5",
    facing: -1
};

const player1 = new Player(150, "peachpuff", player1Controls);
const player2 = new Player(650, "lightblue", player2Controls);

let keys = {};

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

function detectHits() {
    // stabbing range
    let distance = Math.abs(player1.x - player2.x);
    let closeEnough = distance < 60 && Math.abs(player1.y - player2.y) < 40;

    if (closeEnough) {
        if (player1.isAttacking && player2.isParrying) {
            player1.stunned = true;
            player1.stunTimer = 30;
        } else if (player2.isAttacking && player1.isParrying) {
            player2.stunned = true;
            player2.stunTimer = 30;
        } else if (player1.isAttacking) {
            alert("Player 1 wins!");
            document.location.reload();
        } else if (player2.isAttacking) {
            alert("Player 2 wins!");
            document.location.reload();
        }
    }
}

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    player1.move(keys);
    player2.move(keys);

    player1.update();
    player2.update();

    player1.draw();
    player2.draw();

    detectHits();

    requestAnimationFrame(gameLoop);
}

gameLoop();
