const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Player template
function createPlayer(x, color, controls) {
  return {
    x: x,
    y: 300,
    width: 40,
    height: 40,
    color: color,
    speed: 3,
    attacking: false,
    blocking: false,
    stunned: 0,
    alive: true,
    controls
  };
}

// Players
const player1 = createPlayer(150, "blue", {up:"w",down:"s",left:"a",right:"d",attack:"g",block:"h"});
const player2 = createPlayer(610, "red", {up:"ArrowUp",down:"ArrowDown",left:"ArrowLeft",right:"ArrowRight",attack:"4",block:"5"});

const players = [player1, player2];
let keys = {};
let gameOver = false;

// Input
window.addEventListener("keydown", e => { keys[e.key] = true; });
window.addEventListener("keyup", e => { keys[e.key] = false; });

function updatePlayer(p) {
  if (!p.alive || p.stunned > 0) {
    if (p.stunned > 0) p.stunned--;
    return;
  }

  if (keys[p.controls.left]) p.x -= p.speed;
  if (keys[p.controls.right]) p.x += p.speed;
  if (keys[p.controls.up]) p.y -= p.speed;
  if (keys[p.controls.down]) p.y += p.speed;

  // Arena bounds
  p.x = Math.max(0, Math.min(canvas.width - p.width, p.x));
  p.y = Math.max(0, Math.min(canvas.height - p.height, p.y));

  // Attack
  if (keys[p.controls.attack] && !p.attacking) {
    p.attacking = true;
    setTimeout(()=>{ p.attacking = false; }, 300);
  }

  // Block
  p.blocking = keys[p.controls.block];
}

function checkCollisions() {
  for (let i = 0; i < players.length; i++) {
    let p = players[i];
    let o = players[1-i]; // opponent
    if (p.attacking && !gameOver) {
      let spear = {
        x: p.x + (p === player1 ? p.width : -20),
        y: p.y + 10,
        width: 20,
        height: 10
      };
      let shield = {
        x: o.x + (o === player1 ? -20 : o.width),
        y: o.y,
        width: 20,
        height: o.height
      };
      let hitOpponent = rectsOverlap(spear, o);
      let hitShield = o.blocking && rectsOverlap(spear, shield);

      if (hitShield) {
        p.stunned = 60; // ~1 sec stun
      } else if (hitOpponent && o.alive) {
        o.alive = false;
        endGame(p === player1 ? "Blue Gladiator Wins!" : "Red Gladiator Wins!");
      }
    }
  }
}

function rectsOverlap(r1, r2) {
  return !(r1.x > r2.x + r2.width ||
           r1.x + r1.width < r2.x ||
           r1.y > r2.y + r2.height ||
           r1.y + r1.height < r2.y);
}

function drawPlayer(p) {
  if (!p.alive) {
    ctx.fillStyle = "gray";
    ctx.fillRect(p.x, p.y + p.height/2, p.width, 10); // lying body
    return;
  }
  // body
  ctx.fillStyle = p.color;
  ctx.beginPath();
  ctx.arc(p.x + p.width/2, p.y + p.height/2, p.width/2, 0, Math.PI*2);
  ctx.fill();
  // shield
  ctx.fillStyle = "gold";
  ctx.fillRect(p.x + (p===player1?-20:p.width), p.y, 20, p.height);
  // spear
  ctx.fillStyle = "silver";
  if (p.attacking) {
    ctx.fillRect(p.x + (p===player1?p.width:-30), p.y+10, 30, 10);
  } else {
    ctx.fillRect(p.x + (p===player1?p.width:-10), p.y+15, 20, 5);
  }
}

function endGame(message) {
  gameOver = true;
  document.getElementById("overlay").style.visibility = "visible";
  document.getElementById("message").innerText = message;
}

function restartGame() {
  player1.x = 150; player1.y = 300; player1.alive = true; player1.stunned = 0;
  player2.x = 610; player2.y = 300; player2.alive = true; player2.stunned = 0;
  gameOver = false;
  document.getElementById("overlay").style.visibility = "hidden";
}

function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (!gameOver) {
    players.forEach(updatePlayer);
    checkCollisions();
  }
  players.forEach(drawPlayer);
  requestAnimationFrame(gameLoop);
}

gameLoop();
