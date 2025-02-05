const createInputHandler = (gameState) => {
  // Constants for key mappings
  const KEYS = {
    ARROW_LEFT: 'ArrowLeft',
    ARROW_RIGHT: 'ArrowRight',
    ARROW_UP: 'ArrowUp',
    ARROW_DOWN: 'ArrowDown',
    SPACE: 'Space'
  };

  // Touch control state
  let touchActive = false;

  const handleKeyDown = (event) => {
    const state = gameState.getState();
    
    if (state.gameStatus === "start" && event.code === KEYS.SPACE) {
      gameState.startGame();
      return;
    }

    if (state.gameStatus === "playing" && !state.paused) {
      switch (event.code) {
        case KEYS.ARROW_LEFT:
          gameState.setAngle(Math.PI);
          break;
        case KEYS.ARROW_RIGHT:
          gameState.setAngle(0);
          break;
        case KEYS.ARROW_UP:
          gameState.setAngle(-Math.PI / 2);
          break;
        case KEYS.ARROW_DOWN:
          gameState.setAngle(Math.PI / 2);
          break;
        case KEYS.SPACE:
          gameState.togglePause();
          break;
      }
    }
  };

  // Touch controls
  const handleTouchStart = (buttonId) => {
    if (touchActive) return;
    touchActive = true;

    const state = gameState.getState();
    if (state.gameStatus !== "playing" || state.paused) return;

    switch (buttonId) {
      case 'leftBtn':
        gameState.setAngle(Math.PI);
        break;
      case 'rightBtn':
        gameState.setAngle(0);
        break;
      case 'upBtn':
        gameState.setAngle(-Math.PI / 2);
        break;
      case 'downBtn':
        gameState.setAngle(Math.PI / 2);
        break;
      case 'pauseButton':
        gameState.togglePause();
        break;
    }
  };

  const handleTouchEnd = () => {
    touchActive = false;
  };

  // Button click handlers
  const handleStartClick = () => {
    if (gameState.getState().gameStatus === "start") {
      gameState.startGame();
    }
  };

  const handlePauseClick = () => {
    gameState.togglePause();
  };

  const handleRestartClick = () => {
    location.reload();
  };

  // Setup all event listeners
  const setupEventListeners = () => {
    // Keyboard controls
    document.addEventListener('keydown', handleKeyDown);

    // Touch controls
    const touchButtons = ['leftBtn', 'rightBtn', 'upBtn', 'downBtn', 'pauseButton'];
    touchButtons.forEach(btnId => {
      const btn = document.getElementById(btnId);
      if (btn) {
        btn.addEventListener('touchstart', () => handleTouchStart(btnId));
        btn.addEventListener('touchend', handleTouchEnd);
        // Also handle mouse events for testing on desktop
        btn.addEventListener('mousedown', () => handleTouchStart(btnId));
        btn.addEventListener('mouseup', handleTouchEnd);
      }
    });

    // Menu buttons
    const startBtn = document.getElementById('startBtn');
    const pauseButton = document.getElementById('pauseButton');
    const restartBtn = document.getElementById('restartBtn');

    if (startBtn) startBtn.addEventListener('click', handleStartClick);
    if (pauseButton) pauseButton.addEventListener('click', handlePauseClick);
    if (restartBtn) restartBtn.addEventListener('click', handleRestartClick);
  };

  // Cleanup function to remove event listeners
  const cleanup = () => {
    document.removeEventListener('keydown', handleKeyDown);
    // Add other cleanup as needed
  };

  return {
    setupEventListeners,
    cleanup
  };
};

export default createInputHandler; 