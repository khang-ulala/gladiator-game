// Gladiator Duel — fresh rebuild
// Paste this file as game.js and replace the existing one.

const DEBUG = false; // set true to log keys and collisions

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const menu = document.getElementById('menu');
const startBtn = document.getElementById('startBtn');
const overlay = document.getElementById('overlay');
const overlayText = document.getElementById('overlayText');
const restartBtn = document.getElementById('restartBtn');

canvas.width = 900;
canvas.height = 500;

let gameRunning = false;
let keys = {}; // stores normalized keys that are currently down

// normalize key: letters become lowercase, special names stay as-is
function normKey(k) {
  if (!k) return k;
  return k.length === 1 ? k.toLowerCase() : k;
}

window.addEventListener('keydown', (e) => {
  const k = normKey(e.key);
  keys[k] = true;
  if (DEBUG) console.log('keydown', k);
});
window.addEventListener('keyup', (e) => {
  const k = normKey(e.key);
  keys[k] = false;
  if (DEBUG) console.log('keyup', k);
});

// Player class
class Player {
  constructor(x, y, color, controlMap) {
    this.x = x; this.y = y;
    this.color = color;
    this.radius = 28;
    this.speed = 4;
    this.alive = true;

    // attack animation state
    this.isAttacking = false;
    this.attackProgress = 0; // 0..1
    this.attackDuration = 12; // frames
    this.maxThrust = 48;

    // shield state
    this.parryHeld = false;       // true while block key held
    this.shieldAngle = 0;        // current rotation (radians)
    this.shieldTarget = 0;
    this.shieldOffset = 10;      // how far from body center the shield center sits (base)
    this.shieldRx = 22;          // ellipse radii (local)
    this.shieldRy = 36;

    // stun/knockback
    this.stunned = false;
    this.stunTimer = 0;
    this.vx = 0;

    // controls normalized (strings)
    this.controls = {};
    for (let k in controlMap) {
      this.controls[k] = normKey(controlMap[k]);
    }

    // facing: left-side players face right (+1), right-side players face left (-1)
    this.facing = (this.x < canvas.width / 2) ? 1 : -1;

    // spear geometry
    this.spearBaseOffset = this.radius;
    this.spearLength = 60;
    this.spearThrust = 0;

    // single-hit guard (prevents multiple hits in a single attack)
    this.attackHitDone = false;
  }

  startAttack() {
    if (!this.alive || this.isAttacking || this.stunned) return;
    this.isAttacking = true;
    this.attackProgress = 0;
    this.attackHitDone = false;
  }
  releaseAttack() {
    // not used, attacks auto animate
  }

  update() {
    // update stun/knockback
    if (this.stunned) {
      this.x += this.vx;
      this.stunTimer--;
      if (this.stunTimer <= 0) {
        this.stunned = false;
        this.vx = 0;
      }
      // ensure still inside bounds
      this._clampPos();
      return;
    }

    // movement (check keys map)
    if (keys[this.controls.up]) this.y -= this.speed;
    if (keys[this.controls.down]) this.y += this.speed;
    if (keys[this.controls.left]) this.x -= this.speed;
    if (keys[this.controls.right]) this.x += this.speed;

    // clamp inside arena
    this._clampPos();

    // parry hold state
    this.parryHeld = !!keys[this.controls.parry];
    // set shield target angle: when idle target is 0; when parry held, rotate toward center by 90deg
    // rotate toward center: -facing * (pi/2) (so shield rotates inward)
    this.shieldTarget = this.parryHeld ? -this.facing * (Math.PI / 2) : 0;
    // smooth angle change
    this.shieldAngle += (this.shieldTarget - this.shieldAngle) * 0.35;

    // attack animation progress
    if (this.isAttacking) {
      this.attackProgress += 1 / this.attackDuration;
      const p = this.attackProgress;
      // simple smooth in/out: sin curve
      this.spearThrust = Math.sin(p * Math.PI) * this.maxThrust;
      if (p >= 1) {
        this.isAttacking = false;
        this.attackProgress = 0;
        this.spearThrust = 0;
        this.attackHitDone = false;
      }
    }
  }

  _clampPos() {
    this.x = Math.max(this.radius + 10, Math.min(canvas.width - this.radius - 10, this.x));
    this.y = Math.max(this.radius + 10, Math.min(canvas.height - this.radius - 10, this.y));
  }

  draw() {
    // body (skin-colored ball)
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();

    // spear (handle + head) — handle color and spearhead triangle
    const dir = this.facing;
    const baseX = this.x + dir * this.spearBaseOffset;
    const baseY = this.y;
    const tipX = baseX + dir * (this.spearLength + this.spearThrust);
    const tipY = baseY;

    // handle
    ctx.strokeStyle = '#6b3f1b';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(baseX, baseY);
    ctx.lineTo(tipX - dir * 16, tipY);
    ctx.stroke();

    // spearhead (triangle)
    ctx.fillStyle = '#bfc6ca';
    ctx.beginPath();
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(tipX - dir * 16, tipY - 9);
    ctx.lineTo(tipX - dir * 16, tipY + 9);
    ctx.closePath();
    ctx.fill();

    // semi-oval shield
    // shield center in local coords: (facing * (radius + shieldOffset), 0)
    ctx.save();
    // rotate around player center by current shieldAngle
    ctx.translate(this.x, this.y);
    ctx.rotate(this.shieldAngle);
    ctx.fillStyle = '#b8860b'; // goldenrod
    // draw only half of the ellipse (semi-oval) facing outward
    // we draw an ellipse and clip half using arc angles
    const cx = this.facing * (this.radius + this.shieldOffset);
    const cy = 0;
    const rx = this.shieldRx;
    const ry = this.shieldRy;

    // draw semi-ellipse (facing outward side)
    ctx.beginPath();
    if (this.facing === 1) {
      // draw semi-ellipse from -90deg to 90deg
      ctx.ellipse(cx, cy, rx, ry, 0, -Math.PI / 2, Math.PI / 2);
    } else {
      // for right-facing(-1) invert angles
      ctx.ellipse(cx, cy, rx, ry, 0, Math.PI / 2, (Math.PI * 3) / 2);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // optional debug: draw spear tip small dot
    if (DEBUG) {
      const dotX = tipX, dotY = tipY;
      ctx.fillStyle = 'red';
      ctx.beginPath(); ctx.arc(dotX, dotY, 4, 0, Math.PI * 2); ctx.fill();
    }
  }

  // stun this player (called on attacker when they get parried)
  stun(knockback = 6, frames = 40) {
    this.stunned = true;
    this.stunTimer = frames;
    this.vx = knockback;
  }
}

// create players: left player uses WASD + g/h, right player uses Arrows + 4/5
let p1 = new Player(220, canvas.height / 2, '#f1c27d', {
  up: 'w', down: 's', left: 'a', right: 'd', stab: 'g', parry: 'h'
});
let p2 = new Player(canvas.width - 220, canvas.height / 2, '#ffd9b3', {
  up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight', stab: '4', parry: '5'
});

// helper: rotate vector (x,y) by angle
function rotate(x, y, ang) {
  const c = Math.cos(ang), s = Math.sin(ang);
  return { x: x * c - y * s, y: x * s + y * c };
}

function checkCollisions() {
  // for each attacker -> defender
  const pairs = [ [p1, p2], [p2, p1] ];
  for (let [att, def] of pairs) {
    if (!att.alive || !def.alive) continue;
    // only consider while attacker is in attack animation and hasn't already applied its hit
    if (!att.isAttacking) continue;

    // compute spear tip world coords
    const dir = att.facing;
    const baseX = att.x + dir * att.spearBaseOffset;
    const baseY = att.y;
    const tipX = baseX + dir * (att.spearLength + att.spearThrust);
    const tipY = baseY;

    // ---- check shield parry first (defender)
    // transform spear tip into defender-local coords (rotate by -shieldAngle about defender center)
    const relX = tipX - def.x;
    const relY = tipY - def.y;
    const rotated = rotate(relX, relY, -def.shieldAngle);
    // shield center local coords:
    const shieldCenterX = def.facing * (def.radius + def.shieldOffset);
    const shieldCenterY = 0;
    const dx = rotated.x - shieldCenterX;
    const dy = rotated.y - shieldCenterY;
    const a = def.shieldRx;
    const b = def.shieldRy;
    const insideEllipse = (dx*dx)/(a*a) + (dy*dy)/(b*b) <= 1;

    if (insideEllipse && def.parryHeld) {
      // parry succeeded: knockback & stun the attacker, cancel their attack
      att.isAttacking = false;
      att.attackProgress = 0;
      att.spearThrust = 0;
      att.attackHitDone = true;
      // attacker knocked back away from defender
      const knock = -att.facing * 7; // push backward
      att.stun(knock, 45);
      // small effect: briefly wobble defender (optional)
      if (DEBUG) console.log('parry!', att === p1 ? 'p1' : 'p2');
      continue; // go next pair
    }

    // ---- check body hit
    // distance tip -> defender center
    const dx2 = tipX - def.x;
    const dy2 = tipY - def.y;
    const dist2 = Math.sqrt(dx2*dx2 + dy2*dy2);
    // require spear to be sufficiently extended (prevent hitting before thrust)
    if (dist2 < def.radius + 4 && !att.attackHitDone) {
      // hit landed
      att.isAttacking = false;
      att.attackProgress = 0;
      att.spearThrust = 0;
      att.attackHitDone = true;

      def.alive = false;
      // show overlay winner
      showWinner(att === p1 ? 'Left Player (WASD/G/H)' : 'Right Player (Arrow/4/5)');
      if (DEBUG) console.log('hit landed', att === p1 ? 'p1' : 'p2');
      return;
    }
  }
}

function showWinner(name) {
  gameRunning = false;
  overlayText.textContent = `${name} wins!`;
  overlay.classList.remove('hidden');
  overlay.style.pointerEvents = 'auto';
}

function resetGame() {
  // reset players
  p1 = new Player(220, canvas.height / 2, '#f1c27d', {
    up: 'w', down: 's', left: 'a', right: 'd', stab: 'g', parry: 'h'
  });
  p2 = new Player(canvas.width - 220, canvas.height / 2, '#ffd9b3', {
    up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight', stab: '4', parry: '5'
  });

  overlay.classList.add('hidden');
  overlay.style.pointerEvents = 'none';
  gameRunning = true;
}

// main loop
function loop() {
  // always render even if not running so menu/overlay looks fine
  // clear
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // background floor
  ctx.fillStyle = '#362a1f';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (gameRunning) {
    // update state
    // map controls to action starts: attack/parry key detection (start only on keydown)
    // we use keys[...] boolean; to start an attack only once per key press we look for press transitions:
    // simple approach: start when key is true and attack not already active
    if (keys[normKey(p1.controls.stab)]) p1.startAttack();
    if (keys[normKey(p2.controls.stab)]) p2.startAttack();

    // parry hold is read in update from keys

    p1.update();
    p2.update();

    // collisions
    checkCollisions();
  }

  // draw players (draw alive or falling)
  if (p1.alive) p1.draw(); else {
    // lying down representation for dead
    ctx.fillStyle = '#666';
    ctx.fillRect(p1.x - 24, p1.y + 10, 48, 10);
  }

  if (p2.alive) p2.draw(); else {
    ctx.fillStyle = '#666';
    ctx.fillRect(p2.x - 24, p2.y + 10, 48, 10);
  }

  requestAnimationFrame(loop);
}

// UI wiring
startBtn.addEventListener('click', () => {
  menu.style.display = 'none';
  canvas.style.display = 'block';
  // focus canvas so key events definitely land
  canvas.focus();
  overlay.classList.add('hidden');
  gameRunning = true;
});

// restart
restartBtn.addEventListener('click', () => {
  resetGame();
  canvas.focus();
});

// optional: log raw key to console for debugging (toggle DEBUG)
if (DEBUG) {
  window.addEventListener('keydown', (e) => console.log('raw key:', e.key));
}

// start rendering loop right away
loop();
