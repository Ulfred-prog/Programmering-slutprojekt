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

arenaBackground.src = "images/Bakgrundsbild.png";
borderOverlay.src = "images/border.png";
walkSprite.src = "images/Orc/Orc with shadows/Orc-Walk.png";
idleSprite.src = "images/Orc/Orc with shadows/Orc-Idle.png";
attackSprite.src = "images/Orc/Orc with shadows/orc-Attack01.png";
attackHeavySprite.src = "images/Orc/Orc with shadows/orc-Attack02.png";

const frameWidth = 100;
const frameHeight = 100;
const scale = 1.75;
const speed = 2;

// Define a smaller hitbox inside the sprite for collision detection
const hitboxOffsetX = 20 * scale;  // pixels from left of sprite
const hitboxOffsetY = 30 * scale;  // pixels from top of sprite
const hitboxWidth = 60 * scale;    // smaller width than full sprite
const hitboxHeight = 70 * scale;   // smaller height than full sprite

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
let frameIndex = 0, frameDelay = 5, frameCounter = 0;

let imagesLoaded = 0;

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

// Use smaller hitbox for collision detection
function canMoveTo(x, y) {
    const pointsToCheck = [
        [x + hitboxOffsetX, y + hitboxOffsetY], // top-left
        [x + hitboxOffsetX + hitboxWidth, y + hitboxOffsetY], // top-right
        [x + hitboxOffsetX, y + hitboxOffsetY + hitboxHeight], // bottom-left
        [x + hitboxOffsetX + hitboxWidth, y + hitboxOffsetY + hitboxHeight], // bottom-right
    ];

    return !pointsToCheck.some(([px, py]) => isPurpleAt(px, py));
}

function drawHealthBar(x, y, width, height, health, maxHealth) {
    const ratio = health / maxHealth;
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

    if (heavyAttacking) {
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
        } else {
            frameIndex %= frameCount;
        }
    }
    frameCounter++;

    drawHealthBar(orcX + 30, orcY + 50, frameWidth * scale - 60, 6, currentHealth, maxHealth);

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

    if (!attacking && !heavyAttacking) {
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

    requestAnimationFrame(animate);
}

document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") movingRight = true;
    if (e.key === "ArrowLeft") movingLeft = true;
    if (e.key === "ArrowUp") movingUp = true;
    if (e.key === "ArrowDown") movingDown = true;

    if (e.code === "Space" && !attacking && !heavyAttacking) {
        attacking = true;
        frameIndex = 0;
        currentHealth = Math.max(0, currentHealth - 10);
    }

    if (e.code === "ShiftLeft" && !attacking && !heavyAttacking) {
        heavyAttacking = true;
        frameIndex = 0;
        currentHealth = Math.max(0, currentHealth - 20);
    }

    if (["ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown", "Space", "ShiftLeft"].includes(e.code)) {
        e.preventDefault();
    }
});

document.addEventListener("keyup", (e) => {
    if (e.key === "ArrowRight") movingRight = false;
    if (e.key === "ArrowLeft") movingLeft = false;
    if (e.key === "ArrowUp") movingUp = false;
    if (e.key === "ArrowDown") movingDown = false;
});
