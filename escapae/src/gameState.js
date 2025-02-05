// Game state management
const createGameState = () => {
  // Constants
  const CANVAS_WIDTH = 1200;
  const CANVAS_HEIGHT = 800;
  const DOT_SIZE = 10;
  const INITIAL_CHASER_SIZE = 120;
  const CHASER_SPEED = 1.1;
  const PLAYER_SPEED = 1.2;
  const SPEED_BOOST_DURATION = 10000;
  const INVINCIBILITY_DURATION = 2000;

  const initialState = {
    dotX: CANVAS_WIDTH / 2,
    dotY: CANVAS_HEIGHT / 2,
    dotColor: 'yellow',
    angle: 0,
    speed: PLAYER_SPEED,
    score: 0,
    lives: 3,
    chasers: [{
      x: INITIAL_CHASER_SIZE / 2,
      y: INITIAL_CHASER_SIZE / 2,
      size: INITIAL_CHASER_SIZE,
      speed: CHASER_SPEED,
      aiType: 1
    }],
    collectibles: [{
      x: Math.random() * CANVAS_WIDTH,
      y: Math.random() * CANVAS_HEIGHT,
      size: 15
    }],
    mudPatches: [],
    speedCrates: [],
    gameStatus: "start",
    paused: false,
    dotSpeedBoostUntil: 0,
    dotInvincibleUntil: 0,
    dotSlipAmount: 0
  };

  let state = { ...initialState };

  // Helper functions
  const distanceBetween = (x1, y1, x2, y2) => {
    const dx = x1 - x2;
    const dy = y1 - y2;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const wrapPosition = (pos, max) => {
    if (pos < 0) return max;
    if (pos > max) return 0;
    return pos;
  };

  // Update functions
  const updateDotPosition = () => {
    let currentSpeed = state.speed;
    
    if (Date.now() < state.dotSpeedBoostUntil) {
      currentSpeed = state.speed * 2;
      state.dotColor = 'skyblue';
    } else if (state.dotSlipAmount > 0) {
      currentSpeed = state.speed * 3;
      state.dotSlipAmount *= 0.95;
      if (state.dotSlipAmount < 0.01) state.dotSlipAmount = 0;
    } else {
      state.dotColor = 'yellow';
    }

    state.dotX += currentSpeed * Math.cos(state.angle);
    state.dotY += currentSpeed * Math.sin(state.angle);
    
    // Wrap around screen
    state.dotX = wrapPosition(state.dotX, CANVAS_WIDTH);
    state.dotY = wrapPosition(state.dotY, CANVAS_HEIGHT);
  };

  const updateChasers = () => {
    state.chasers.forEach(chaser => {
      // AI type switching logic
      if (!chaser.nextJobRoll || Date.now() >= chaser.nextJobRoll) {
        chaser.aiType = Math.floor(Math.random() * 4) + 1;
        chaser.nextJobRoll = Date.now() + Math.random() * 5000 + 10000;
      }

      // Movement based on AI type
      let targetX = state.dotX;
      let targetY = state.dotY;

      switch(chaser.aiType) {
        case 2: // Key seeker
          if (state.collectibles.length > 0) {
            const nearestKey = state.collectibles.reduce((closest, key) => {
              const dist = distanceBetween(chaser.x, chaser.y, key.x, key.y);
              return (!closest || dist < closest.dist) ? {key, dist} : closest;
            }, null);
            if (nearestKey) {
              targetX = nearestKey.key.x;
              targetY = nearestKey.key.y;
            }
          }
          break;
        case 3: // Prediction chaser
          const predictionFactor = 20;
          targetX = state.dotX + Math.cos(state.angle) * state.speed * predictionFactor;
          targetY = state.dotY + Math.sin(state.angle) * state.speed * predictionFactor;
          break;
        case 4: // Random wanderer
          if (!chaser.randomTarget || distanceBetween(chaser.x, chaser.y, chaser.randomTarget.x, chaser.randomTarget.y) < 10) {
            chaser.randomTarget = {
              x: Math.random() * CANVAS_WIDTH,
              y: Math.random() * CANVAS_HEIGHT
            };
          }
          targetX = chaser.randomTarget.x;
          targetY = chaser.randomTarget.y;
          break;
      }

      // Move chaser
      const dx = targetX - chaser.x;
      const dy = targetY - chaser.y;
      const angle = Math.atan2(dy, dx);
      chaser.x += chaser.speed * Math.cos(angle);
      chaser.y += chaser.speed * Math.sin(angle);

      // Wrap around for all except type 4
      if (chaser.aiType !== 4) {
        chaser.x = wrapPosition(chaser.x, CANVAS_WIDTH);
        chaser.y = wrapPosition(chaser.y, CANVAS_HEIGHT);
      }
    });
  };

  const checkCollisions = () => {
    // Check collisions with collectibles
    for (let i = state.collectibles.length - 1; i >= 0; i--) {
      const item = state.collectibles[i];
      if (distanceBetween(state.dotX, state.dotY, item.x, item.y) < (DOT_SIZE + item.size) / 2) {
        state.collectibles.splice(i, 1);
        state.score++;
        return "collectible";
      }
    }

    // Check collisions with chasers
    if (Date.now() >= state.dotInvincibleUntil) {
      for (const chaser of state.chasers) {
        if (distanceBetween(state.dotX, state.dotY, chaser.x, chaser.y) < (DOT_SIZE + chaser.size) / 2) {
          state.lives--;
          state.dotInvincibleUntil = Date.now() + INVINCIBILITY_DURATION;
          if (state.lives <= 0) {
            state.gameStatus = "gameOver";
          }
          return "chaser";
        }
      }
    }

    // Check collisions with speed crates
    for (let i = state.speedCrates.length - 1; i >= 0; i--) {
      const crate = state.speedCrates[i];
      if (distanceBetween(state.dotX, state.dotY, crate.x, crate.y) < (DOT_SIZE + 25) / 2) {
        state.speedCrates.splice(i, 1);
        state.dotSpeedBoostUntil = Date.now() + SPEED_BOOST_DURATION;
        return "speedCrate";
      }
    }

    return null;
  };

  const update = (delta) => {
    if (state.paused || state.gameStatus !== "playing") return state;

    updateDotPosition();
    updateChasers();
    const collision = checkCollisions();

    return {
      ...state,
      collision
    };
  };

  // Public interface
  return {
    update,
    getState: () => ({ ...state }),
    setState: (newState) => { state = { ...state, ...newState }},
    reset: () => { state = { ...initialState }},
    setAngle: (newAngle) => { state.angle = newAngle },
    togglePause: () => { state.paused = !state.paused },
    startGame: () => { 
      state = { ...initialState };
      state.gameStatus = "playing";
    }
  };
};

export default createGameState; 