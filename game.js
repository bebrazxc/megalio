const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const bunnyImg = new Image();
bunnyImg.src = 'assets/bunny.png';
const carrotImg = new Image();
carrotImg.src = 'assets/carrot.png';
const platformImg = new Image();
platformImg.src = 'assets/platform.png';
const spikesImg = new Image();
spikesImg.src = 'assets/spikes.png';

const groundY = 364;

let bunny = {
  x: 100,
  y: groundY - 64, // 64 — высота персонажа
  width: 64,
  height: 64,
  vy: 0,
  onGround: true
};

let carrots = [];
let spikes = [];
let score = 0;
let gameOver = false;
let bullets = [];
let gameSpeed = 4; // начальная скорость

let platforms = [
  // земля не нужна, она уже есть как ground
];

const startScreen = document.getElementById('startScreen');
const gameCanvas = document.getElementById('gameCanvas');
const scoreDiv = document.getElementById('score');
const gameOverScreen = document.getElementById('gameOverScreen');
const finalScore = document.getElementById('finalScore');
const startBtn = document.getElementById('startBtn');
const playAgainBtn = document.getElementById('playAgainBtn');
const backToMenuBtn = document.getElementById('backToMenuBtn');

function spawnPlatform() {
  // Платформы на уровне персонажа
  let y = groundY - bunny.height + 8; // чуть выше земли
  platforms.push({ x: 800, y: y, width: 120, height: 20 });
}

function spawnCarrot() {
  // 50% шанс спавна на платформе, 50% — на земле
  let spawnOnPlatform = platforms.length > 0 && Math.random() < 0.5;
  let carrot;
  if (spawnOnPlatform) {
    // Выбираем случайную платформу
    let p = platforms[Math.floor(Math.random() * platforms.length)];
    carrot = {
      x: p.x + p.width / 2 - 16, // по центру платформы
      y: p.y - 32, // чуть выше платформы
      width: 32,
      height: 32
    };
  } else {
    carrot = { x: 800, y: groundY - 32, width: 32, height: 32 };
  }

  // Проверка на шипы
  let overlapSpike = spikes.some(s =>
    carrot.x < s.x + s.width &&
    carrot.x + carrot.width > s.x &&
    carrot.y < s.y + s.height &&
    carrot.y + carrot.height > s.y
  );

  // Проверка на платформы (если не на платформе)
  let overlapPlatform = !spawnOnPlatform && platforms && platforms.some(p =>
    carrot.x < p.x + p.width &&
    carrot.x + carrot.width > p.x &&
    carrot.y + carrot.height > p.y &&
    carrot.y < p.y + p.height
  );

  if (!overlapSpike && !overlapPlatform) {
    carrots.push(carrot);
  }
}

function spawnSpike() {
  // Не спавнить шипы слишком близко к платформам
  let spikeX = 800;
  let tooCloseToPlatform = platforms.some(p =>
    Math.abs(spikeX - (p.x + p.width / 2)) < 100 // 100px от центра платформы
  );
  if (!tooCloseToPlatform) {
    spikes.push({ x: spikeX, y: groundY - 32, width: 32, height: 32 });
  }
}

let spawnTimer = 0;

document.addEventListener('keydown', function(e) {
  if (
    ((e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') && bunny.onGround && !gameOver)
  ) {
    bunny.vy = -8;
    bunny.onGround = false;
  } else if (e.code === 'Space' && !bunny.onGround && !gameOver) {
  }
});

function checkCollision(a, b, bOffset = 0) {
  return (
    a.x < b.x + b.width - bOffset &&
    a.x + a.width > b.x + bOffset &&
    a.y < b.y + b.height - bOffset &&
    a.y + a.height > b.y + bOffset
  );
}

function showGame() {
  startScreen.style.display = 'none';
  gameCanvas.style.display = 'block';
  scoreDiv.style.display = 'block';
  gameOverScreen.style.display = 'none';
  resetGame();
  gameLoop();
}

function showGameOver() {
  gameOverScreen.style.display = 'flex';
  finalScore.innerText = `You collected ${score} carrots!`;
}

function showMenu() {
  startScreen.style.display = 'flex';
  gameCanvas.style.display = 'none';
  scoreDiv.style.display = 'none';
  gameOverScreen.style.display = 'none';
}

startBtn.onclick = showGame;
playAgainBtn.onclick = showGame;
backToMenuBtn.onclick = showMenu;

function resetGame() {
  bunny = {
    x: 100,
    y: groundY - 64,
    width: 64,
    height: 64,
    vy: 0,
    onGround: true
  };
  carrots = [];
  spikes = [];
  bullets = [];
  score = 0;
  gameOver = false;
  document.getElementById('score').innerText = 'Score: 0';
  spawnTimer = 0;
}

function updateGameSpeed() {
  if (score <= 10) {
    gameSpeed = 4 + score * 0.2;
  } else {
    gameSpeed = 4 + 10 * 0.2 + (score - 10) * 0.1; // после 10 морковок скорость растет в 2 раза медленнее
  }
}

function gameLoop() {
  if (gameOver) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw ground
  ctx.fillStyle = "#3e2c1c";
  ctx.fillRect(0, 364, 800, 36);
  ctx.fillStyle = "#4caf50";
  ctx.fillRect(0, 364, 800, 8);

  // Move carrots and spikes
  carrots.forEach(c => c.x -= gameSpeed);
  spikes.forEach(s => s.x -= gameSpeed);

  // Gravity
  bunny.vy += 0.4;
  bunny.y += bunny.vy;

  // Проверка на платформы
  let onAnyPlatform = false;
  for (let p of platforms) {
    // Проверяем, что кролик падает сверху на платформу
    if (
      bunny.y + bunny.height <= p.y + 8 && // был выше платформы
      bunny.y + bunny.height + bunny.vy >= p.y && // пересекает платформу
      bunny.x + bunny.width > p.x + 8 &&
      bunny.x < p.x + p.width - 8 &&
      bunny.vy >= 0
    ) {
      bunny.y = p.y - bunny.height;
      bunny.vy = 0;
      bunny.onGround = true;
      onAnyPlatform = true;
    }
  }
  if (!onAnyPlatform) bunny.onGround = false;

  // Проверка на землю
  if (bunny.y + bunny.height > groundY) {
    bunny.y = groundY - bunny.height;
    bunny.vy = 0;
    bunny.onGround = true;
  }

  // Draw carrots
  for (let c of carrots) {
    ctx.drawImage(carrotImg, c.x, c.y, c.width, c.height);
  }

  // Draw spikes
  for (let s of spikes) {
    ctx.drawImage(spikesImg, s.x, s.y, s.width, s.height);
  }

  // Draw bunny
  ctx.drawImage(bunnyImg, bunny.x, bunny.y, bunny.width, bunny.height);

  // Check collision with carrots
  for (let i = carrots.length - 1; i >= 0; i--) {
    if (checkCollision(bunny, carrots[i])) {
      carrots.splice(i, 1);
      score++;
      document.getElementById('score').innerText = 'Score: ' + score;
      updateGameSpeed();
    }
  }

  // Check collision with spikes
  for (let s of spikes) {
    if (checkCollision(bunny, s, 24)) { // хитбокс шипов ещё меньше
      gameOver = true;
      showGameOver();
    }
  }

  // Remove off-screen objects
  carrots = carrots.filter(c => c.x + c.width > 0);
  spikes = spikes.filter(s => s.x + s.width > 0);

  // Spawn new objects
  spawnTimer++;
  if (spawnTimer % 90 === 0) spawnCarrot();
  if (spawnTimer % 150 === 0) spawnSpike();
  if (spawnTimer % 120 === 0) spawnPlatform();

  // Движение пуль
  bullets.forEach(b => b.x += b.speed);

  // Отрисовка пуль
  ctx.fillStyle = "#ff0";
  for (let b of bullets) {
    ctx.fillRect(b.x, b.y, b.width, b.height);
  }

  // Проверка попадания пули в морковку
  for (let i = carrots.length - 1; i >= 0; i--) {
    for (let j = bullets.length - 1; j >= 0; j--) {
      if (checkCollision(carrots[i], bullets[j])) {
        carrots.splice(i, 1);
        bullets.splice(j, 1);
        score++;
        document.getElementById('score').innerText = 'Score: ' + score;
        updateGameSpeed();
        break;
      }
    }
  }

  // Удаляем пули, которые улетели за экран
  bullets = bullets.filter(b => b.x < canvas.width);

  platforms.forEach(p => p.x -= gameSpeed);

  // Отрисовка платформ
  for (let p of platforms) {
    ctx.drawImage(platformImg, p.x, p.y, p.width, p.height);
  }

  platforms = platforms.filter(p => p.x + p.width > 0);

  requestAnimationFrame(gameLoop);
}

// Wait for all images to load
let imagesLoaded = 0;
[bunnyImg, carrotImg, platformImg, spikesImg].forEach(img => {
  img.onload = () => {
    imagesLoaded++;
    if (imagesLoaded === 4) gameLoop();
  };
});
