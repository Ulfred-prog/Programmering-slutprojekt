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
const baseOrcSpeed = 2;
const baseSoldierSpeed = 2;
const orcSpeedScale = 1;
const soldierSpeedScale = 1;

// Hitbox scale factor to easily configure hitbox size relative to sprite size
const hitboxScale = 0.4;
const attackHitboxScale = 0.4;

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

let showHitboxes = false;

document.addEventListener("keydown", (e) => {
    if (e.key.toLowerCase() === "c") {
        showHitboxes = !showHitboxes;
    }

    if (e.key === "ArrowRight") movingRight = true;
    else if (e.key === "ArrowLeft") movingLeft = true;
    else if (e.key === "ArrowUp") movingUp = true;
    else if (e.key === "ArrowDown") movingDown = true;

    if ((e.code === "Space" || e.code === "ShiftLeft") && !attacking && !heavyAttacking && !hurt && !dead) {
        if (e.code === "Space") {
            attacking = true;
        } else if (e.code === "ShiftLeft") {
            heavyAttacking = true;
        }
        frameIndex = 0;
    }

    if (["ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown", "Space", "ShiftLeft"].includes(e.code)) {
        e.preventDefault();
    }
});

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

function isInAttackRange(attackerX, attackerWidth, targetX, targetWidth, rangeMultiplier) {
    // Calculate horizontal distance between attacker and target centers
    const attackerCenterX = attackerX + attackerWidth / 2;
    const targetCenterX = targetX + targetWidth / 2;
    const distance = Math.abs(attackerCenterX - targetCenterX);
    // Calculate attack range based on attacker's width and range multiplier
    const attackRange = attackerWidth * rangeMultiplier;
    return distance <= attackRange;
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
        // Calculate distance to orc hitbox center
        const orcBox = orcHitbox();
        const orcCenterX = orcBox.x + orcBox.width / 2;
        const orcCenterY = orcBox.y + orcBox.height / 2;

        const soldierBox = {
            x: soldier.x,
            y: soldier.y,
            width: soldier.width,
            height: soldier.height
        };
        const soldierCenterX = soldierBox.x + soldierBox.width / 2;
        const soldierCenterY = soldierBox.y + soldierBox.height / 2;

        // Calculate distance between soldier and orc centers
        const dx = orcCenterX - soldierCenterX;
        const dy = orcCenterY - soldierCenterY;
        const distanceToOrc = Math.sqrt(dx * dx + dy * dy);

        // Minimum distance to keep from orc (slightly larger than orc hitbox width)
        const minDistanceToOrc = orcBox.width * 0.9;

        // If soldier is close enough to orc, start attacking
        if (distanceToOrc <= minDistanceToOrc) {
            soldier.attacking = true;
            soldier.state = "attack";
            soldier.frameIndex = 0;
            return; // Skip movement this frame
        }

        // Move soldier towards orc only if farther than minDistanceToOrc
        if (distanceToOrc > minDistanceToOrc) {
            // Normalize direction vector
            const dirX = dx / distanceToOrc;
            const dirY = dy / distanceToOrc;

            // Calculate proposed new position
            let newX = soldier.x + dirX * baseSoldierSpeed * soldierSpeedScale;
            let newY = soldier.y + dirY * baseSoldierSpeed * soldierSpeedScale;

            // Check if new position is inside arena (purple area)
            const centerX = newX + soldier.width / 2;
            const centerY = newY + soldier.height / 2;
            if (canMoveTo(newX, newY)) {
                // Only update position if inside arena
                soldier.x = newX;
                soldier.y = newY;
            }

            soldier.facingRight = dirX >= 0;
            soldier.state = "walk";
        } else {
            soldier.state = "idle";
        }

        // Collision avoidance with other soldiers to prevent bundling
        const separationDistance = soldier.width * 0.4; // reduced minimum distance between soldiers
        soldiers.forEach(other => {
            if (other === soldier || other.dead) return;

            const otherCenterX = other.x + other.width / 2;
            const otherCenterY = other.y + other.height / 2;

            const distX = soldierCenterX - otherCenterX;
            const distY = soldierCenterY - otherCenterY;
            const dist = Math.sqrt(distX * distX + distY * distY);

            if (dist < separationDistance && dist > 0) {
                // Calculate repulsion vector
                const repulseX = distX / dist;
                const repulseY = distY / dist;

                // Calculate proposed new position after repulsion
                let repulseNewX = soldier.x + repulseX * baseSoldierSpeed * soldierSpeedScale * 0.3;
                let repulseNewY = soldier.y + repulseY * baseSoldierSpeed * soldierSpeedScale * 0.3;

                // Check if repulsion move keeps soldier inside arena
                const repulseCenterX = repulseNewX + soldier.width / 2;
                const repulseCenterY = repulseNewY + soldier.height / 2;
                if (isPurpleAt(Math.floor(repulseCenterX), Math.floor(repulseCenterY))) {
                    soldier.x = repulseNewX;
                    soldier.y = repulseNewY;
                }
            }
        });

       

        // Attack logic
        if (soldier.attacking) {
            // When attack animation reaches frame 2, check cone or square pattern hit with orc
            if (soldier.frameIndex === 2 && soldier.frameCounter === 0) {
                const soldierCenterX = soldier.x + soldier.width / 2;
                const soldierCenterY = soldier.y + soldier.height / 2;
                const orcCenterX = orcX + (frameWidth * scale) / 2;
                const orcCenterY = orcY + (frameHeight * scale) / 2;

                // Define attack reach parameters similar to orc's attack
                const attackReachLength = frameWidth * scale * 0.6;
                const attackReachWidth = frameHeight * scale * 0.5;

                // Determine soldier facing direction
                const facingRight = soldier.facingRight;

                // Function to check if orc center is in soldier's attack cone or square
                function isOrcHit() {
                    const orcBox = orcHitbox();
                    console.log("Orc hitbox:", orcBox);
                    const corners = [
                        { x: orcBox.x, y: orcBox.y },
                        { x: orcBox.x + orcBox.width, y: orcBox.y },
                        { x: orcBox.x, y: orcBox.y + orcBox.height },
                        { x: orcBox.x + orcBox.width, y: orcBox.y + orcBox.height }
                    ];
                    for (const corner of corners) {
                        let inside = false;
                        if (attackPatternType === "cone") {
                            inside = isPointInCone(corner.x, corner.y, soldierCenterX, soldierCenterY, facingRight, attackReachLength, attackReachWidth);
                        } else if (attackPatternType === "square") {
                            inside = isPointInSquare(corner.x, corner.y, soldierCenterX, soldierCenterY, facingRight, attackReachLength, attackReachWidth);
                        }
                        console.log(`Corner (${corner.x.toFixed(1)}, ${corner.y.toFixed(1)}) inside attack area: ${inside}`);
                        if (inside) {
                            return true;
                        }
                    }
                    return false;
                }

                if (isOrcHit()) {
                    console.log("Orc hit by soldier");
                    if (!hurt && !dead) {
                        const now = Date.now();
                        if (!window.orcLastHitTime) {
                            window.orcLastHitTime = 0;
                        }
                        const hitCooldown = 500; // cooldown 0.5 seconds
                        if (now - window.orcLastHitTime > hitCooldown) {
                            currentHealth = Math.max(0, currentHealth - 15);
                            hurt = true; // trigger hurt animation
                            console.log("Orc hurt set to true, currentHealth:", currentHealth);
                            window.orcLastHitTime = now;
                        } else {
                            console.log("Hit cooldown active, no damage applied");
                        }
                    } else {
                        console.log("Orc is currently hurt or dead, no damage applied");
                    }
                }
            }

        if (soldier.frameIndex >= soldierAttackFrames - 1) {
            soldier.attacking = false;
            soldier.state = "idle";
            soldier.frameIndex = 0;
        }
        }
    }

    // Hurt logic
    if (soldier.hurt) {
        soldier.state = "hurt";
        soldier.frameIndex = 0;
        soldier.hurt = false;
        soldier.health -= 5;
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

function isOrcInAttackRange(rangeMultiplier) {

    for (const soldier of soldiers) {
        if (soldier.dead) continue;
        const orcCenterX = orcX + (frameWidth * scale) / 2;
        const orcCenterY = orcY + (frameHeight * scale) / 2;
        const soldierCenterX = soldier.x + soldier.width / 2;
        const soldierCenterY = soldier.y + soldier.height / 2;
        const dx = orcCenterX - soldierCenterX;
        const dy = orcCenterY - soldierCenterY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const attackRange = (frameWidth * scale) * rangeMultiplier;
        if (distance <= attackRange) {
            return true;
        }
    }
    return false;
}


const attackPatternType = "cone";

function isPointInCone(px, py, cx, cy, facingRight, coneLength, coneWidth) {

    const dx = px - cx;
    const dy = py - cy;

    if (!facingRight) {

        if (dx > 0) return false;
    } else {
        if (dx < 0) return false;
    }


    const absDx = Math.abs(dx);
    if (absDx > coneLength) return false;


    const halfWidthAtDx = (coneWidth / 2) * (1 - absDx / coneLength);


    return Math.abs(dy) <= halfWidthAtDx;
}

function isPointInSquare(px, py, cx, cy, facingRight, squareLength, squareWidth) {

    const dx = px - cx;
    const dy = py - cy;

    if (facingRight) {
        if (dx < 0 || dx > squareLength) return false;
    } else {
        if (dx > 0 || dx < -squareLength) return false;
    }

    return Math.abs(dy) <= squareWidth / 2;
}

function checkOrcAttackHits() {
    if (!attacking && !heavyAttacking) return;

    const orcCenterX = orcX + (frameWidth * scale) / 2;
    const orcCenterY = orcY + (frameHeight * scale) / 2;

    // Define attack reach parameters
    const attackReachLength = frameWidth * scale * 0.8;
    const attackReachWidth = frameHeight * scale * 0.6;

    soldiers.forEach(soldier => {
        if (soldier.dead) return;

        // Soldier center point
        const soldierCenterX = soldier.x + soldier.width / 2;
        const soldierCenterY = soldier.y + soldier.height / 2;

        let hit = false;
        if (attackPatternType === "cone") {
            hit = isPointInCone(soldierCenterX, soldierCenterY, orcCenterX, orcCenterY, facingRight, attackReachLength, attackReachWidth);
        } else if (attackPatternType === "square") {
            hit = isPointInSquare(soldierCenterX, soldierCenterY, orcCenterX, orcCenterY, facingRight, attackReachLength, attackReachWidth);
        }

        if (hit) {
            soldier.hurt = true;
        }
    });
}

function orcAttackHitbox() {

    return null;
}


const originalAnimate = animate;
animate = function () {
    originalAnimate();

    checkOrcAttackHits();
    updateAllSoldiers();
    drawAllSoldiers();
};

let soldiers = [];


let currentWave = 1;
let currentRound = 1;
let soldiersToSpawn = 0;
let soldiersSpawned = 0;
let spawnInterval = 1000;
let lastSpawnTime = 0;
let waveInProgress = false;
let gameStarted = false;
let gameCompleted = false; 


const waveConfig = {
    1: { soldiersCount: 3, spawnInterval: 1500 },
    2: { soldiersCount: 5, spawnInterval: 1200 },
    3: { soldiersCount: 7, spawnInterval: 1000 },
    4: { soldiersCount: 10, spawnInterval: 800 },
    5: { soldiersCount: 12, spawnInterval: 600 }, 
};


function findPurpleBoundingBox() {
    const width = borderCanvas.width;
    const height = borderCanvas.height;
    const imgData = borderCtx.getImageData(0, 0, width, height);
    const data = imgData.data;

    let minX = width, minY = height, maxX = 0, maxY = 0;
    let found = false;

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const index = (y * width + x) * 4;
            const r = data[index];
            const g = data[index + 1];
            const b = data[index + 2];
            if (r > 120 && b > 120 && g < 80) {
                found = true;
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
            }
        }
    }

    if (!found) {

        return { minX: 0, minY: 0, maxX: width, maxY: height };
    }

    return { minX, minY, maxX, maxY };
}

function orcHitbox() {

    const width = frameWidth * scale * hitboxScale;
    const height = frameHeight * scale * hitboxScale;
    const offsetX = (frameWidth * scale - width) / 2;
    const offsetY = (frameHeight * scale - height) / 2;
    return {
        x: orcX + offsetX,
        y: orcY + offsetY,
        width: width,
        height: height
    };
}

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

    ctx.drawImage(borderOverlay, 0, 0, canvas.width, canvas.height);
    ctx.drawImage(arenaBackground, 0, 0, canvas.width, canvas.height);

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
    if (hurt && frameIndex >= frameCount) {
        console.log("Hurt animation finished, resetting hurt flag");
        hurt = false;
        frameIndex = 0;

        window.orcLastHitTime = 0;
    }
            frameIndex = frameCount - 1; 
        } else {
            frameIndex %= frameCount;
        }
    }
    frameCounter++;

    const healthBarHeight = 12; 
    drawHealthBar(20, 20, frameWidth * scale - 60, healthBarHeight, currentHealth, maxHealth);


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
            if (canMoveTo(orcX + baseOrcSpeed * orcSpeedScale, orcY)) {
                orcX += baseOrcSpeed * orcSpeedScale;
                facingRight = true;
            }
        }
        if (movingLeft && orcX > 0) {
            if (canMoveTo(orcX - baseOrcSpeed * orcSpeedScale, orcY)) {
                orcX -= baseOrcSpeed * orcSpeedScale;
                facingRight = false;
            }
        }
        if (movingUp && orcY > 0) {
            if (canMoveTo(orcX, orcY - baseOrcSpeed * orcSpeedScale)) {
                orcY -= baseOrcSpeed * orcSpeedScale;
            }
        }
        if (movingDown && orcY < canvas.height - frameHeight * scale) {
            if (canMoveTo(orcX, orcY + baseOrcSpeed * orcSpeedScale)) {
                orcY += baseOrcSpeed * orcSpeedScale;
            }
        }
    }

   // Wave and round logic
if (!gameCompleted) {

    if (waveInProgress && soldiersSpawned >= soldiersToSpawn && soldiers.length === 0) {
        waveInProgress = false;
        
        if (currentWave >= 5) {
            gameCompleted = true;
            showVictoryScreen();
        } else {
            setTimeout(() => {
                currentWave++;
                startWave(currentWave);
            }, 2000);
        }
    }
    

    const now = Date.now();
    if (waveInProgress && soldiersSpawned < soldiersToSpawn && now - lastSpawnTime > spawnInterval) {
        spawnSoldier();
        soldiersSpawned++;
        lastSpawnTime = now;
    }
}

    if (showHitboxes) {
        ctx.strokeStyle = "red";
        ctx.lineWidth = 2;

        const orcBox = orcHitbox();
        ctx.strokeRect(orcBox.x, orcBox.y, orcBox.width, orcBox.height);

        ctx.strokeStyle = "blue";
        soldiers.forEach(soldier => {

            const width = soldier.width * hitboxScale;
            const height = soldier.height * hitboxScale;
            const offsetX = (soldier.width - width) / 2;
            const offsetY = (soldier.height - height) / 2;
            const hitboxX = soldier.x + offsetX;
            const hitboxY = soldier.y + offsetY;
            ctx.strokeRect(hitboxX, hitboxY, width, height);
        });


        ctx.strokeStyle = "purple";
        ctx.lineWidth = 3;
        const arenaBox = findPurpleBoundingBox();
        ctx.strokeRect(arenaBox.minX, arenaBox.minY, arenaBox.maxX - arenaBox.minX, arenaBox.maxY - arenaBox.minY);
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
        // Removed setting attacking flags to disable hitbox based attack
        /*
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
        */
    }

    if (["ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown", "Space", "ShiftLeft"].includes(e.code)) {
        e.preventDefault();
    }
});


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


    document.getElementById("mainMenu").style.display = "none";
    document.getElementById("gameCanvas").style.display = "block";
    document.getElementById("waveInfo").style.display = "block";

    const center = findPurpleCenter();
    orcX = center.x - (frameWidth * scale) / 2;
    orcY = center.y - (frameHeight * scale) / 2;

    startWave(currentWave);
});


function getPurpleRadius(centerX, centerY) {

    const maxRadius = Math.min(borderCanvas.width, borderCanvas.height) / 2;
    let radius = maxRadius;


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


    radius += 20;


    const angle = Math.random() * 2 * Math.PI;
    const x = center.x + radius * Math.cos(angle) - (frameWidth * scale) / 2;
    const y = center.y + radius * Math.sin(angle) - (frameHeight * scale) / 2;

    const soldier = createSoldier(x, y);


    soldier.facingRight = x < center.x ? true : false;

    soldiers.push(soldier);
}


function startWave(waveNumber) {
    const config = waveConfig[waveNumber] || waveConfig[Object.keys(waveConfig).length];
    soldiersToSpawn = config.soldiersCount;
    spawnInterval = config.spawnInterval;
    soldiersSpawned = 0;
    waveInProgress = true;


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
})
