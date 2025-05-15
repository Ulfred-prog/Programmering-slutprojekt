const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Offscreen canvas for collision detection
const borderCanvas = document.createElement("canvas");
const borderCtx = borderCanvas.getContext("2d");

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    borderCanvas.width = canvas.width;
    borderCanvas.height = canvas.height;

    if (borderOverlay.complete) {
        borderCtx.drawImage(borderOverlay, 0, 0, canvas.width, canvas.height);
    }
}
window.addEventListener("resize", resizeCanvas);

// Load images
const arenaBackground = new Image();
const borderOverlay = new Image();
const walkSprite = new Image();
const idleSprite = new Image();
const attackSprite = new Image();
const attackHeavySprite = new Image();
const hurtSprite = new Image();
const deathSprite = new Image();

const soldierIdleSprite = new Image();
const soldierWalkSprite = new Image();
const soldierAttack1Sprite = new Image();
const soldierAttack2Sprite = new Image();
const soldierAttack3Sprite = new Image();
const soldierHurtSprite = new Image();
const soldierDeathSprite = new Image();

arenaBackground.src = "images/Bakgrundsbild.png";
borderOverlay.src = "images/border.png";
walkSprite.src = "images/Orc/Orc with shadows/Orc-Walk.png";
idleSprite.src = "images/Orc/Orc with shadows/Orc-Idle.png";
attackSprite.src = "images/Orc/Orc with shadows/orc-Attack01.png";
attackHeavySprite.src = "images/Orc/Orc with shadows/orc-Attack02.png";
hurtSprite.src = "images/Orc/Orc with shadows/Orc-Hurt.png";
deathSprite.src = "images/Orc/Orc with shadows/Orc-Death.png";

soldierIdleSprite.src = "images/Soldier/Soldier/Soldier-Idle.png";
soldierWalkSprite.src = "images/Soldier/Soldier/Soldier-Walk.png";
soldierAttack1Sprite.src = "images/Soldier/Soldier/Soldier-Attack01.png";
soldierAttack2Sprite.src = "images/Soldier/Soldier/Soldier-Attack02.png";
soldierAttack3Sprite.src = "images/Soldier/Soldier/Soldier-Attack03.png";
soldierHurtSprite.src = "images/Soldier/Soldier/Soldier-Hurt.png";
soldierDeathSprite.src = "images/Soldier/Soldier/Soldier-Death.png";

const frameWidth = 100;
const frameHeight = 100;
const scale = 1.75;
const speed = 2;

let orcX = 0;
let orcY = 0;

let movingRight = false, movingLeft = false, movingUp = false, movingDown = false;
let facingRight = true;
let attacking = false, heavyAttacking = false;

let maxHealth = 100;
let currentHealth = 100;

const walkFrames = 8;
const idleFrames = 6;
const attackFrames = 3;
const heavyAttackFrames = 6;
const hurtFrames = 4;
const deathFrames = 6;
const soldierIdleFrames = 6;
const soldierWalkFrames = 8;
const soldierAttackFrames = 3;
const soldierHurtFrames = 4;
const soldierDeathFrames = 6;
let frameIndex = 0, frameDelay = 5, frameCounter = 0;

let imagesLoaded = 0;
let gameOver = false;
let hurt = false;
let dead = false;

const deathScreen = document.getElementById("deathScreen");
const restartButton = document.getElementById("restartButton");

function createSoldier(x, y) {
    return {
        x,
        y,
        width: frameWidth * scale,
        height: frameHeight * scale,
        health: 100,
        maxHealth: 100,
        facingRight: true,
        attacking: false,
        hurt: false,
        dead: false,
        frameIndex: 0,
        frameCounter: 0,
        frameDelay: 5,
        state: "idle", // idle, walk, attack, hurt, death
    };
}

function drawSoldier(soldier) {
    let sprite;
    let frameCount;

    switch (soldier.state) {
        case "walk":
            sprite = soldierWalkSprite;
            frameCount = soldierWalkFrames;
            break;
        case "attack":
            // For simplicity, use first attack sprite
            sprite = soldierAttack1Sprite;
            frameCount = soldierAttackFrames;
            break;
        case "hurt":
            sprite = soldierHurtSprite;
            frameCount = soldierHurtFrames;
            break;
        case "death":
            sprite = soldierDeathSprite;
            frameCount = soldierDeathFrames;
            break;
        case "idle":
        default:
            sprite = soldierIdleSprite;
            frameCount = soldierIdleFrames;
            break;
    }

    if (soldier.frameCounter >= soldier.frameDelay) {
        soldier.frameIndex++;
        soldier.frameCounter = 0;
        if ((soldier.state === "attack" || soldier.state === "hurt") && soldier.frameIndex >= frameCount) {
            if (soldier.state === "death") {
                soldier.frameIndex = frameCount - 1;
            } else {
                soldier.state = "idle";
                soldier.frameIndex = 0;
                soldier.attacking = false;
                soldier.hurt = false;
            }
        } else {
            soldier.frameIndex %= frameCount;
        }
    }
    soldier.frameCounter++;

    ctx.save();
    if (!soldier.facingRight) {
        ctx.scale(-1, 1);
        ctx.drawImage(sprite,
            soldier.frameIndex * frameWidth, 0, frameWidth, frameHeight,
            -soldier.x - soldier.width, soldier.y,
            soldier.width, soldier.height
        );
    } else {
        ctx.drawImage(sprite,
            soldier.frameIndex * frameWidth, 0, frameWidth, frameHeight,
            soldier.x, soldier.y,
            soldier.width, soldier.height
        );
    }
    ctx.restore();

    // Draw health bar
    const healthBarHeight = 8;
    const healthBarWidth = soldier.width - 20;
    const healthRatio = Math.max(0, Math.min(soldier.health / soldier.maxHealth, 1));
    ctx.fillStyle = "red";
    ctx.fillRect(soldier.x + 10, soldier.y - 15, healthBarWidth, healthBarHeight);
    ctx.fillStyle = "green";
    ctx.fillRect(soldier.x + 10, soldier.y - 15, healthBarWidth * healthRatio, healthBarHeight);
    ctx.strokeStyle = "black";
    ctx.strokeRect(soldier.x + 10, soldier.y - 15, healthBarWidth, healthBarHeight);
}

function updateSoldier(soldier) {
    // If soldier is dead and death animation finished, remove soldier from array
    if (soldier.dead) {
        if (soldier.state === "death" && soldier.frameIndex >= soldierDeathFrames - 1) {
            const index = soldiers.indexOf(soldier);
            if (index > -1) {
                soldiers.splice(index, 1);
            }
            return;
        }
        return;
    }

    // Simple AI: move towards orc if not attacking or hurt
    if (!soldier.attacking && !soldier.hurt) {
        if (soldier.x < orcX) {
            soldier.x += speed;
            soldier.facingRight = true;
            soldier.state = "walk";
        } else if (soldier.x > orcX) {
            soldier.x -= speed;
            soldier.facingRight = false;
            soldier.state = "walk";
        } else {
            soldier.state = "idle";
        }

        // Check attack range
        const distance = Math.abs(soldier.x - orcX);
        if (distance < 100) {
            // Slow down attack rate by adding cooldown
            if (!soldier.attackCooldown || Date.now() - soldier.attackCooldown > 1500) {
                soldier.attacking = true;
                soldier.state = "attack";
                soldier.frameIndex = 0;
                soldier.attackCooldown = Date.now();
            }
        }
    }

    // Attack logic
    if (soldier.attacking) {
        // When attack animation reaches frame 2, check hitbox collision with orc
        if (soldier.frameIndex === 2 && soldier.frameCounter === 0) {
            // Simple hitbox: rectangle in front of soldier
            const hitboxX = soldier.facingRight ? soldier.x + soldier.width : soldier.x - 50;
            const hitboxY = soldier.y;
            const hitboxWidth = 50;
            const hitboxHeight = soldier.height;

            // Check collision with orc
            if (orcX < hitboxX + hitboxWidth &&
                orcX + frameWidth * scale > hitboxX &&
                orcY < hitboxY + hitboxHeight &&
                orcY + frameHeight * scale > hitboxY) {
                if (!hurt && !dead) {
                    currentHealth = Math.max(0, currentHealth - 10);
                    hurt = true;
                }
            }
        }

        if (soldier.frameIndex >= soldierAttackFrames - 1) {
            soldier.attacking = false;
            soldier.state = "idle";
            soldier.frameIndex = 0;
        }
    }

    // Hurt logic
    if (soldier.hurt) {
        soldier.state = "hurt";
        soldier.frameIndex = 0;
        soldier.hurt = false;
        soldier.health -= 10;
        if (soldier.health <= 0) {
            soldier.dead = true;
            soldier.state = "death";
            soldier.frameIndex = 0;
        }
    }
}

function drawAllSoldiers() {
    soldiers.forEach(drawSoldier);
}

function updateAllSoldiers() {
    soldiers.forEach(updateSoldier);
}

function orcAttackHitbox() {
    // Define orc attack hitbox based on facing direction
    const hitboxX = facingRight ? orcX + frameWidth * scale : orcX - 30;
    const hitboxY = orcY;
    const hitboxWidth = 30;
    const hitboxHeight = frameHeight * scale;
    return { x: hitboxX, y: hitboxY, width: hitboxWidth, height: hitboxHeight };
}

function checkOrcAttackHits() {
    if (!attacking && !heavyAttacking) return;

    const hitbox = orcAttackHitbox();

    soldiers.forEach(soldier => {
        if (soldier.dead) return;
        if (hitbox.x < soldier.x + soldier.width &&
            hitbox.x + hitbox.width > soldier.x &&
            hitbox.y < soldier.y + soldier.height &&
            hitbox.y + hitbox.height > soldier.y) {
            soldier.hurt = true;
        }
    });
}

// Modify animate function to include soldiers
const originalAnimate = animate;
animate = function () {
    originalAnimate();

    updateAllSoldiers();
    drawAllSoldiers();
    checkOrcAttackHits();
};

let soldiers = [];

// Wave and round system variables
let currentWave = 1;
let currentRound = 1;
let soldiersToSpawn = 0;
let soldiersSpawned = 0;
let spawnInterval = 1000; // milliseconds between spawns
let lastSpawnTime = 0;
let waveInProgress = false;
let gameStarted = false;

// Wave configuration: number of soldiers per wave (wave 1 easiest)
const waveConfig = {
    1: { soldiersCount: 3, spawnInterval: 1500 },
    2: { soldiersCount: 5, spawnInterval: 1200 },
    3: { soldiersCount: 7, spawnInterval: 1000 },
    4: { soldiersCount: 10, spawnInterval: 800 },
    // Add more waves as needed
};

function findPurpleCenter() {
    const width = borderCanvas.width;
    const height = borderCanvas.height;
    const imgData = borderCtx.getImageData(0, 0, width, height);
    const data = imgData.data;

    let sumX = 0, sumY = 0, count = 0;

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const index = (y * width + x) * 4;
            const r = data[index];
            const g = data[index + 1];
            const b = data[index + 2];
            if (r > 120 && b > 120 && g < 80) {
                sumX += x;
                sumY += y;
                count++;
            }
        }
    }

    if (count === 0) {
        return { x: width / 2, y: height / 2 };
    }

    return { x: sumX / count, y: sumY / count };
}

function imageLoaded() {
    imagesLoaded++;
    if (imagesLoaded === 6) {
        resizeCanvas();

        borderCtx.drawImage(borderOverlay, 0, 0, canvas.width, canvas.height);

        const center = findPurpleCenter();
        orcX = center.x - (frameWidth * scale) / 2;
        orcY = center.y - (frameHeight * scale) / 2;

        // Do not start wave automatically, wait for game start
        // startWave(currentWave);

        animate();
    }
}

arenaBackground.onload = imageLoaded;
borderOverlay.onload = imageLoaded;
walkSprite.onload = imageLoaded;
idleSprite.onload = imageLoaded;
attackSprite.onload = imageLoaded;
attackHeavySprite.onload = imageLoaded;

function isMoving() {
    return movingLeft || movingRight || movingUp || movingDown;
}

function isPurpleAt(x, y) {
    const pixel = borderCtx.getImageData(x, y, 1, 1).data;
    const [r, g, b] = pixel;
    return r > 120 && b > 120 && g < 80;
}

// Check if the center point of the orc is inside the purple arena
function canMoveTo(x, y) {
    const centerX = x + (frameWidth * scale) / 2;
    const centerY = y + (frameHeight * scale) / 2;
    return !isPurpleAt(centerX, centerY);
}

function drawHealthBar(x, y, width, height, health, maxHealth) {
    const ratio = Math.max(0, Math.min(health / maxHealth, 1)); // Clamp ratio between 0 and 1
    ctx.fillStyle = "red";
    ctx.fillRect(x, y, width, height);
    ctx.fillStyle = "green";
    ctx.fillRect(x, y, width * ratio, height);
    ctx.strokeStyle = "black";
    ctx.strokeRect(x, y, width, height);
}

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.drawImage(arenaBackground, 0, 0, canvas.width, canvas.height);
    ctx.drawImage(borderOverlay, 0, 0, canvas.width, canvas.height);

    let currentSprite;
    let frameCount;

    if (dead) {
        currentSprite = deathSprite;
        frameCount = deathFrames;
    } else if (hurt) {
        currentSprite = hurtSprite;
        frameCount = hurtFrames;
    } else if (heavyAttacking) {
        currentSprite = attackHeavySprite;
        frameCount = heavyAttackFrames;
    } else if (attacking) {
        currentSprite = attackSprite;
        frameCount = attackFrames;
    } else if (isMoving()) {
        currentSprite = walkSprite;
        frameCount = walkFrames;
    } else {
        currentSprite = idleSprite;
        frameCount = idleFrames;
    }

    if (frameCounter >= frameDelay) {
        frameIndex++;
        frameCounter = 0;
        if ((attacking || heavyAttacking) && frameIndex >= frameCount) {
            attacking = false;
            heavyAttacking = false;
            frameIndex = 0;
        } else if (hurt && frameIndex >= frameCount) {
            hurt = false;
            frameIndex = 0;
        } else if (dead && frameIndex >= frameCount) {
            frameIndex = frameCount - 1; // Hold last death frame
        } else {
            frameIndex %= frameCount;
        }
    }
    frameCounter++;

    const healthBarHeight = 12; // increased thickness
    drawHealthBar(20, 20, frameWidth * scale - 60, healthBarHeight, currentHealth, maxHealth);

    // Draw health counter text on the health bar
    ctx.fillStyle = "white";
    ctx.font = "bold 14px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const healthBarX = 20;
    const healthBarY = 20;
    const healthBarWidth = frameWidth * scale - 60;
    ctx.fillText(currentHealth + " / " + maxHealth, healthBarX + healthBarWidth / 2, healthBarY + healthBarHeight / 2);

    ctx.save();
    if (!facingRight) {
        ctx.scale(-1, 1);
        ctx.drawImage(currentSprite,
            frameIndex * frameWidth, 0, frameWidth, frameHeight,
            -orcX - frameWidth * scale, orcY,
            frameWidth * scale, frameHeight * scale
        );
    } else {
        ctx.drawImage(currentSprite,
            frameIndex * frameWidth, 0, frameWidth, frameHeight,
            orcX, orcY,
            frameWidth * scale, frameHeight * scale
        );
    }
    ctx.restore();

    if (!attacking && !heavyAttacking && !hurt && !dead) {
        if (movingRight && orcX < canvas.width - frameWidth * scale) {
            if (canMoveTo(orcX + speed, orcY)) {
                orcX += speed;
                facingRight = true;
            }
        }
        if (movingLeft && orcX > 0) {
            if (canMoveTo(orcX - speed, orcY)) {
                orcX -= speed;
                facingRight = false;
            }
        }
        if (movingUp && orcY > 0) {
            if (canMoveTo(orcX, orcY - speed)) {
                orcY -= speed;
            }
        }
        if (movingDown && orcY < canvas.height - frameHeight * scale) {
            if (canMoveTo(orcX, orcY + speed)) {
                orcY += speed;
            }
        }
    }

    // Wave and round logic
    if (!waveInProgress && soldiers.length === 0) {
        currentWave++;
        startWave(currentWave);
    }

    // Spawn soldiers during wave
    const now = Date.now();
    if (waveInProgress && soldiersSpawned < soldiersToSpawn && now - lastSpawnTime > spawnInterval) {
        spawnSoldier();
        soldiersSpawned++;
        lastSpawnTime = now;
    }

    if (currentHealth <= 0 && !dead) {
        dead = true;
        gameOver = true;
        deathScreen.style.display = "flex";
    }

    requestAnimationFrame(animate);
}

document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") movingRight = true;
    else if (e.key === "ArrowLeft") movingLeft = true;
    else if (e.key === "ArrowUp") movingUp = true;
    else if (e.key === "ArrowDown") movingDown = true;

    if ((e.code === "Space" || e.code === "ShiftLeft") && !attacking && !heavyAttacking && !hurt && !dead) {
        if (e.code === "Space") {
            attacking = true;
            // Remove orc self damage on attack
            // currentHealth = Math.max(0, currentHealth - 10);
            // hurt = true;
        } else if (e.code === "ShiftLeft") {
            heavyAttacking = true;
            // Remove orc self damage on attack
            // currentHealth = Math.max(0, currentHealth - 20);
            // hurt = true;
        }
        frameIndex = 0;
    }

    if (["ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown", "Space", "ShiftLeft"].includes(e.code)) {
        e.preventDefault();
    }
});

// Start game on start button click
const startButton = document.getElementById("startButton");
startButton.addEventListener("click", () => {
    gameStarted = true;
    currentWave = 1;
    currentRound = 1;
    waveInProgress = false;
    soldiers = [];
    currentHealth = maxHealth;
    dead = false;
    hurt = false;
    gameOver = false;

    // Hide main menu, show game canvas and wave info
    document.getElementById("mainMenu").style.display = "none";
    document.getElementById("gameCanvas").style.display = "block";
    document.getElementById("waveInfo").style.display = "block";

    const center = findPurpleCenter();
    orcX = center.x - (frameWidth * scale) / 2;
    orcY = center.y - (frameHeight * scale) / 2;

    startWave(currentWave);
});

// Spawn soldier function
function getPurpleRadius(centerX, centerY) {
    // Scan from center outward in multiple directions to find radius of purple circle
    const maxRadius = Math.min(borderCanvas.width, borderCanvas.height) / 2;
    let radius = maxRadius;

    // Check pixels radially in 8 directions and take minimum radius where purple ends
    const directions = [
        { dx: 1, dy: 0 },
        { dx: 0.707, dy: 0.707 },
        { dx: 0, dy: 1 },
        { dx: -0.707, dy: 0.707 },
        { dx: -1, dy: 0 },
        { dx: -0.707, dy: -0.707 },
        { dx: 0, dy: -1 },
        { dx: 0.707, dy: -0.707 },
    ];

    for (const dir of directions) {
        for (let r = 0; r < maxRadius; r++) {
            const x = Math.round(centerX + dir.dx * r);
            const y = Math.round(centerY + dir.dy * r);
            if (x < 0 || y < 0 || x >= borderCanvas.width || y >= borderCanvas.height) {
                radius = Math.min(radius, r);
                break;
            }
            if (!isPurpleAt(x, y)) {
                radius = Math.min(radius, r);
                break;
            }
        }
    }
    return radius;
}

function spawnSoldier() {
    const center = findPurpleCenter();
    let radius = getPurpleRadius(center.x, center.y);

    // Increase radius to spawn soldiers slightly outside the purple circle
    radius += 20;

    // Spawn soldier at random angle on circumference of purple circle
    const angle = Math.random() * 2 * Math.PI;
    const x = center.x + radius * Math.cos(angle) - (frameWidth * scale) / 2;
    const y = center.y + radius * Math.sin(angle) - (frameHeight * scale) / 2;

    const soldier = createSoldier(x, y);

    // Set facingRight based on position relative to center
    soldier.facingRight = x < center.x ? true : false;

    soldiers.push(soldier);
}

// Start a wave
function startWave(waveNumber) {
    const config = waveConfig[waveNumber] || waveConfig[Object.keys(waveConfig).length];
    soldiersToSpawn = config.soldiersCount;
    spawnInterval = config.spawnInterval;
    soldiersSpawned = 0;
    waveInProgress = true;

    // Update wave info UI
    const waveInfo = document.getElementById("waveInfo");
    if (waveInfo) {
        waveInfo.textContent = `Wave: ${currentWave} | Round: ${currentRound}`;
    }
}

restartButton.addEventListener("click", () => {
    currentHealth = maxHealth;
    gameOver = false;
    hurt = false;
    dead = false;
    const center = findPurpleCenter();
    orcX = center.x - (frameWidth * scale) / 2;
    orcY = center.y - (frameHeight * scale) / 2;
    deathScreen.style.display = "none";
});

document.addEventListener("keyup", (e) => {
    if (e.key === "ArrowRight") movingRight = false;
    else if (e.key === "ArrowLeft") movingLeft = false;
    else if (e.key === "ArrowUp") movingUp = false;
    else if (e.key === "ArrowDown") movingDown = false;
});
