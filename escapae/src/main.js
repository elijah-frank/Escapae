// Main game file
import createAudioSystem from './audio.js';
import createGameState from './gameState.js';
import createInputHandler from './input.js';
import createRenderer from './renderer.js';

// Create instances at module level
const gameState = createGameState();
const audio = createAudioSystem();

const initGame = () => {
  // Initialize canvas
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
  
  // Create remaining module instances
  const renderer = createRenderer(ctx, canvas);
  const input = createInputHandler(gameState);

  // Set up collision sound handlers
  const handleCollision = (collisionType) => {
    switch(collisionType) {
      case "collectible":
        audio.playSound("key");
        break;
      case "chaser":
        audio.playSound("hurt");
        break;
      case "speedCrate":
        audio.playSound("wood");
        break;
      case "mud":
        audio.playSound("slip");
        break;
    }
  };

  // Game loop with timestamp for smooth animations
  let lastTime = 0;
  const gameLoop = (timestamp) => {
    // Calculate delta time
    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;

    // Update game state
    const state = gameState.update(deltaTime);
    
    // Handle any collisions that occurred
    if (state.collision) {
      handleCollision(state.collision);
    }

    // Render current state
    renderer.renderGame(state);

    // Request next frame
    requestAnimationFrame(gameLoop);
  };

  // Initialize game
  const init = () => {
    // Set up all event listeners
    input.setupEventListeners();

    // Set up settings menu handlers
    setupSettingsHandlers();

    // Start game loop
      requestAnimationFrame(gameLoop);
  };

  // Settings menu handlers
  const setupSettingsHandlers = () => {
    const volumeSlider = document.getElementById('volumeSlider');
    const sfxSlider = document.getElementById('sfxSlider');
    const brightnessSlider = document.getElementById('brightnessSlider');
    const zoomSlider = document.getElementById('zoomSlider');

    if (volumeSlider) {
      volumeSlider.addEventListener('input', (e) => {
        audio.setBackgroundVolume(e.target.value);
      });
    }

    if (sfxSlider) {
      sfxSlider.addEventListener('input', (e) => {
        audio.setSfxVolume(e.target.value);
      });
    }

    if (brightnessSlider) {
      brightnessSlider.addEventListener('input', (e) => {
        canvas.style.filter = `brightness(${e.target.value}%)`;
      });
    }

    if (zoomSlider) {
      zoomSlider.addEventListener('input', (e) => {
        const scale = e.target.value / 100;
        document.documentElement.style.setProperty('--game-scale', scale);
      });
    }
  };

  // Clean up function
  const cleanup = () => {
    input.cleanup();
    audio.stopBackgroundMusic();
  };

  return {
    init,
    cleanup
  };
};

// Start the game
const game = initGame();
game.init();

// Clean up on page unload
window.addEventListener('unload', () => {
  game.cleanup();
});

// Expose necessary functions for HTML buttons
console.log('Exposing global functions...');
window.togglePause = () => {
  if (gameState.getState().gameStatus === "playing") {
    gameState.togglePause();
  }
};

window.setSfxVolume = (value) => {
  audio.setSfxVolume(value);
};

// Expose startGame for the start button
window.startGame = () => {
  console.log('startGame called');
  document.getElementById('startBtn').style.display = 'none';
  gameState.startGame();
  audio.startBackgroundMusic();
};
  