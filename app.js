const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 800;
canvas.height = 540;


const sprite = new Image();
sprite.src = "Orc-Walk.png"; 


const frameWidth = 100;
const frameHeight = 100;
const totalFrames = 8;
let frameIndex = 0;


let orcX = 100;
let orcY = 300;
let speed = 5;
let movingRight = false;
let movingLeft = false;
let movingUp = false;
let movingDown = false;

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    
    ctx.drawImage(sprite, frameIndex * frameWidth, 0, frameWidth, frameHeight, orcX, orcY, frameWidth, frameHeight);
    
 
    frameIndex = (frameIndex + 1) % totalFrames;
    
   
    if (movingRight) orcX += speed;
    if (movingLeft) orcX -= speed;
    if (movingUp) orcY -= speed;
    if (movingDown) orcY += speed;
    
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

sprite.onload = animate;
