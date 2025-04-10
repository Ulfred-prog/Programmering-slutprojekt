const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");


function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();


const walkSprite = new Image();
const idleSprite = new Image();
walkSprite.src = "Orc-Walk.png";
idleSprite.src = "Orc-Idle.png"; 

const frameWidth = 100;
const frameHeight = 100;
const walkFrames = 8;
const idleFrames = 6;
let frameIndex = 0;

let orcX = 100;
let orcY = 300;
let speed = 5;
let movingRight = false;
let movingLeft = false;
let movingUp = false;
let movingDown = false;
let facingRight = true;

function isMoving() {
    return movingLeft || movingRight || movingUp || movingDown;
}

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const currentSprite = isMoving() ? walkSprite : idleSprite;
    const frameCount = isMoving() ? walkFrames : idleFrames;

    ctx.save();
    if (!facingRight) {
        ctx.scale(-1, 1);
        ctx.drawImage(
            currentSprite,
            frameIndex * frameWidth, 0, frameWidth, frameHeight,
            -orcX - frameWidth, orcY,
            frameWidth, frameHeight
        );
    } else {
        ctx.drawImage(
            currentSprite,
            frameIndex * frameWidth, 0, frameWidth, frameHeight,
            orcX, orcY,
            frameWidth, frameHeight
        );
    }
    ctx.restore();

    frameIndex = (frameIndex + 1) % frameCount;

    if (movingRight && orcX < canvas.width - frameWidth) {
        orcX += speed;
        facingRight = true;
    }
    if (movingLeft && orcX > 0) {
        orcX -= speed;
        facingRight = false;
    }
    if (movingUp && orcY > 0) {
        orcY -= speed;
    }
    if (movingDown && orcY < canvas.height - frameHeight) {
        orcY += speed;
    }

    setTimeout(animate, 100); 
}

document.addEventListener("keydown", (event) => {
    if (event.key === "ArrowRight") movingRight = true;
    if (event.key === "ArrowLeft") movingLeft = true;
    if (event.key === "ArrowUp") movingUp = true;
    if (event.key === "ArrowDown") movingDown = true;
});

document.addEventListener("keyup", (event) => {
    if (event.key === "ArrowRight") movingRight = false;
    if (event.key === "ArrowLeft") movingLeft = false;
    if (event.key === "ArrowUp") movingUp = false;
    if (event.key === "ArrowDown") movingDown = false;
});

walkSprite.onload = animate;
