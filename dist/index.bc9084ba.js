// Get references to the canvas and its drawing context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
// Define properties for the yellow dot
let dotX = canvas.width / 2; // Start at the center of the canvas
let dotY = canvas.height / 2;
let angle = 0; // Angle in radians; 0 means moving to the right
const speed = 0.5; // Slow down the dot for debugging
// Get the left and right button elements
const leftBtn = document.getElementById('leftBtn');
const rightBtn = document.getElementById('rightBtn');
// Add event listeners to the buttons
leftBtn.addEventListener('click', ()=>{
    // Turn left by subtracting from the angle (in radians)
    angle -= Math.PI / 8; // 22.5° turn; adjust as needed
});
rightBtn.addEventListener('click', ()=>{
    // Turn right by adding to the angle (in radians)
    angle += Math.PI / 8;
});
// The main game loop: update dot position, then render it
function gameLoop() {
    update();
    render();
    console.log("Dot position:", dotX, dotY); // Debug: log the position
    requestAnimationFrame(gameLoop);
}
// Update the dot's position based on its speed and direction
function update() {
    // Comment out movement for testing:
    // dotX += speed * Math.cos(angle);
    // dotY += speed * Math.sin(angle);
    // Wrap the dot around the edges of the canvas for continuous movement
    if (dotX < 0) dotX = canvas.width;
    if (dotX > canvas.width) dotX = 0;
    if (dotY < 0) dotY = canvas.height;
    if (dotY > canvas.height) dotY = 0;
}
// Render (draw) the dot on the canvas
function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'yellow';
    ctx.fillRect(dotX - 10, dotY - 10, 20, 20); // Draw a 20x20 yellow square
}
// Start the animation loop
gameLoop();

//# sourceMappingURL=index.bc9084ba.js.map
