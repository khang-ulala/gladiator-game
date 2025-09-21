const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const menu = document.getElementById("menu");
const gameOverScreen = document.getElementById("gameOver");
const winnerText = document.getElementById("winnerText");
const startBtn = document.getElementById("startBtn");
const restartBtn = document.getElementById("restartBtn");

let gameRunning = false;

class Gladiator {
  constructor(x, color, controls) {
    this.x = x;
    this.y = canvas.height / 2;
    this.radius = 30;
    this.color = color;
    this.hp = 1;

    // Weapons
    this.spearLength = 60;
    this.spearThrust = 0;
    this.isAttacking = false;

    this.shieldAngle = 0;
    this.isBlocking = false;

    this.controls = controls;

    this.stunned = false;
    this.stunTimer = 0;
    this.knockback = 0;
  }

  draw() {
    // Body
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();

    // Spear
    let dir = this.x < canvas.width / 2 ? 1 : -1;
    let spearBaseX = this.x + dir * this.radius;
    let spearBaseY = this.y;
    let spearTipX = spearBaseX + dir * (this.spearLength + this.spearThrust);
    let spearTipY = spearBaseY;

    ctx.strokeStyle = "saddlebrown";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(spearBaseX, spearBaseY);
    ctx.lineTo(spearTipX - dir * 15, spearTipY);
    ctx.stroke();

    ctx.fillStyle = "silver";
    ctx.beginPath();
    ctx.moveTo(spearTipX, spearTipY);
    ctx.lineTo(spearTipX - dir * 15, spearTipY - 10);
    ctx.lineTo(spearTipX - dir * 15, spearTipY + 10);
    ctx.closePath();
    ctx.fill();

    // Shield
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.shieldAngle);
    ctx.fillStyle = "goldenrod";
    ctx.beginPath();
    ctx.ellipse(this.radius, 0, 20, 40, 0, Math.PI * 2, false);
    ctx.fill();
    ctx.restore();
  }

  attack() {
    if (this.isAttacking || this.stunned) return;
    this.isAttacking = true;
    let thrustInterval = setInterval(() => {
      this.spearThrust += 5;
      if (this.spearThrust >= 30) {
        clearInterval(thrustInterval);
        let retractInterval = setInterval(() => {
          this.spearThrust -= 5;
          if (this.spearThrust <= 0) {
            clearInterval(retractInterval);
            this.isAttacking = false;
          }
        }, 30);
      }
    }, 30);
  }

  block() {
    if (this.isBlocking) return;
    this.isBlocking = true;
    let targetAngle = this.shieldAngle + Math.PI / 2;
    let step = (Math.PI / 2) / 10;

    let rotateInterval = setInterval(() => {
      this.shieldAngle += step;
      if (this.shieldAngle >= targetAngle) {
        clearInterval(rotateInterval);
        this.isBlocking = false;
      }
    }, 30);
  }

  stun() {
    this.stunned = true;
    this.stunTimer = 60; // ~1 second
    this.knockback = (this.x < canvas.width / 2 ? -5 : 5);
  }

  update() {
    if (this.stunned) {
      this.x += this.knockback;
      this.stunTimer--;
      if (this.stunTimer <= 0) {
        this.stunned = false;
        this.knockback = 0;
      }
    }
  }
}

let player1, player2;

function startGame() {
  player1 = new Gladiator(200, "#f1c27d", { attack: "f", block: "g" });
  player2 = new Gladiator(600, "#ffdbac", { attack: "ArrowLeft", block: "ArrowRight" });

  menu.style.display = "none";
  gameOverScreen.style.display = "none";
  canvas.style.display = "block";

  gameRunning = true;
  gameLoop();
}

function endGame(winner) {
  gameRunning = false;
  canvas.style.display = "none";
  gameOverScreen.style.display = "block";
  winnerText.textContent = `${winner} Wins!`;
}

function checkCollisions() {
  [[player1, player2], [player2, player1]].forEach(([attacker, defender]) => {
    let dir = attacker.x < canvas.width / 2 ? 1 : -1;
    let spearTipX = attacker.x + dir * (attacker.radius + attacker.spearLength + attacker.spearThrust);
    let spearTipY = attacker.y;

    // --- Shield collision check ---
    let shieldX = defender.x + Math.cos(defender.shieldAngle) * defender.radius;
    let shieldY = defender.y + Math.sin(defender.shieldAngle) * defender.radius;
    let dxShield = spearTipX - shieldX;
    let dyShield = spearTipY - shieldY;
    let distShield = Math.sqrt(dxShield*dxShield + dyShield*dyShield);

    if (distShield < 40 && attacker.isAttacking) {
      // parry success
      attacker.stun();
      attacker.isAttacking = false;
      attacker.spearThrust = 0;
      return;
    }

    // --- Body collision check ---
    let dx = spearTipX - defender.x;
    let dy = spearTipY - defender.y;
    let dist = Math.sqrt(dx*dx + dy*dy);

    if (dist < defender.radius && attacker.isAttacking && !defender.stunned) {
      defender.hp -= 1;
      attacker.isAttacking = false;
      attacker.spearThrust = 0;
      if (defender.hp <= 0) {
        endGame(attacker === player1 ? "Player 1" : "Player 2");
      }
    }
  });
}

function gameLoop() {
  if (!gameRunning) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#444";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  player1.update();
  player2.update();

  player1.draw();
  player2.draw();

  checkCollisions();

  requestAnimationFrame(gameLoop);
}

window.addEventListener("keydown", (e) => {
  if (!gameRunning) return;
  if (e.key === player1.controls.attack) player1.attack();
  if (e.key === player1.controls.block) player1.block();
  if (e.key === player2.controls.attack) player2.attack();
  if (e.key === player2.controls.block) player2.block();
});

startBtn.addEventListener("click", startGame);
restartBtn.addEventListener("click", startGame);
