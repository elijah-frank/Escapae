(function() {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
  
    let gameState = "start";
    let gameOverTimer = 0;
    const GAME_OVER_DURATION = 5000;
  
    // Player variables
    let playerX, playerY;
    const playerSize = 10;
    let playerColor = 'yellow';
    let playerSlipAmount = 0;
    let playerControlDisabledUntil = 0;
    let playerInvincibleUntil = 0;
    let playerSpeedBoostUntil = 0;
    let lives = 3;
  
    let angle = 0;
    const speed = 1.2;
  
    // Chaser variables
    let chasers = [];
    const INITIAL_CHASER_SIZE = 120;
    const CHASER_SPEED = 1.1;
    const REPULSION_STRENGTH = 0.5;
    const REPULSION_DISTANCE = 150;
    const SPREAD_TIME = 2000;
    let spreadStartTime = 0;
  
    // Collectibles and score
    let collectibles = [];
    let score = 0;
  
    // Stars and mud patches
    let stars = [];
    let mudPatches = [];
    const MUD_AVOIDANCE_DISTANCE = 100;
    const MUD_AVOIDANCE_STRENGTH = 1.5;
  
    // Speed crates and related boost
    let speedCrates = [];
    const SPEED_BOOST_DURATION = 10000;
    const CRATE_SIZE = 25;
    let chaserSpeedIncrease = 0;
  
    // Audio settings
    const audioManager = {
        audioContext: new (window.AudioContext || window.webkitAudioContext)(),
        backgroundMusic: null,
        audioContextUnlocked: false,
        sfxVolume: 0.5,
        soundEffects: { slip: null, wood: null, hurt: null, key: null },
        startBackgroundMusic: function() {
            if (!this.backgroundMusic) {
                this.backgroundMusic = new Audio("assets/audio/myBackgroundTrack.mp3");
                this.backgroundMusic.loop = true;
                const volumeSlider = document.getElementById('volumeSlider');
                this.backgroundMusic.volume = volumeSlider ? volumeSlider.value : 0.5;
                window.backgroundMusic = this.backgroundMusic;
            }
            this.backgroundMusic.play().catch(error => console.error("Error playing background music:", error));
        },
        playSlipSound: function() {
            if (this.soundEffects.slip) {
                console.log("Playing slip sound, volume:", this.sfxVolume);
                this.soundEffects.slip.currentTime = 0;
                this.soundEffects.slip.volume = this.sfxVolume;
                this.soundEffects.slip.play().catch(error => { console.error("Failed to play slip sound:", error); });
                setTimeout(() => { this.soundEffects.slip.volume = 0.01; }, 1000);
            } else { console.log("Slip sound not initialized"); }
        },
        playWoodCrackleSound: function() {
            if (this.soundEffects.wood) {
                console.log("Playing wood sound, volume:", this.sfxVolume);
                this.soundEffects.wood.currentTime = 0;
                this.soundEffects.wood.volume = this.sfxVolume;
                this.soundEffects.wood.play().catch(error => { console.error("Failed to play wood sound:", error); });
                setTimeout(() => { this.soundEffects.wood.volume = 0.01; }, 1000);
            } else { console.log("Wood sound not initialized"); }
        },
        playHurtSound: function() {
            if (this.soundEffects.hurt) {
                console.log("Playing hurt sound, volume:", this.sfxVolume);
                this.soundEffects.hurt.currentTime = 0;
                this.soundEffects.hurt.volume = this.sfxVolume;
                this.soundEffects.hurt.play().catch(error => { console.error("Failed to play hurt sound:", error); });
                setTimeout(() => { this.soundEffects.hurt.volume = 0.01; }, 1000);
            } else { console.log("Hurt sound not initialized"); }
        },
        playKeyPickupSound: function() {
            if (this.soundEffects.key) {
                console.log("Playing key sound, volume:", this.sfxVolume);
                this.soundEffects.key.currentTime = 0;
                this.soundEffects.key.volume = this.sfxVolume;
                this.soundEffects.key.play().catch(error => { console.error("Failed to play key sound:", error); });
                setTimeout(() => { this.soundEffects.key.volume = 0.01; }, 1000);
            } else { console.log("Key sound not initialized"); }
        },
        startMP3Background: function() {
            if (!this.backgroundMusic) {
                this.backgroundMusic = new Audio("assets/audio/myBackgroundTrack.mp3");
                this.backgroundMusic.loop = true;
                const volumeSlider = document.getElementById("volumeSlider");
                this.backgroundMusic.volume = volumeSlider ? parseFloat(volumeSlider.value) : 0.5;
                window.backgroundMusic = this.backgroundMusic;
            }
            this.backgroundMusic.play().catch(error => console.error("Error playing background music:", error));
        },
        stopBackgroundMusic: function() {
            if (this.backgroundMusic) {
                this.backgroundMusic.pause();
                this.backgroundMusic.currentTime = 0;
            }
        }
    };
  
    let globalHighScore = 0;
    let paused = false;
    let hasSubmittedScore = false;
  
    function initializeStars() {
      stars = [];
      const numStars = 50;
      for (let i = 0; i < numStars; i++) {
        stars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          radius: Math.random() * 2 + 1
        });
      }
    }

    function initializeGamePositions() {
      playerX = canvas.width / 2;
      playerY = canvas.height / 2;
      chasers = [{
        x: INITIAL_CHASER_SIZE / 2,
        y: INITIAL_CHASER_SIZE / 2,
        size: INITIAL_CHASER_SIZE,
        speed: CHASER_SPEED,
        aiType: 1
      }];
      angle = 0;
      collectibles = [{
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: 15
      }];
      mudPatches = [];
      playerColor = 'yellow';
      playerSlipAmount = 0;
      playerControlDisabledUntil = 0;
      playerInvincibleUntil = 0;
      speedCrates = [];
      playerSpeedBoostUntil = 0;
      chaserSpeedIncrease = 0;
      lives = 3;
    }
  
    function startGame() {
      if (!audioManager.audioContextUnlocked) {
        // Create a silent buffer to unlock audio
        const buffer = audioManager.audioContext.createBuffer(1, 1, 22050);
        const source = audioManager.audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(audioManager.audioContext.destination);
        source.start(0);

        // Preload all sound effects with relative paths
        audioManager.soundEffects.slip = new Audio("assets/audio/cartoon-yoink-1-183915.mp3");
        audioManager.soundEffects.wood = new Audio("assets/audio/wood-break-small-2-45921.mp3");
        audioManager.soundEffects.hurt = new Audio("assets/audio/oof-sound-effect-147492.mp3");
        audioManager.soundEffects.key = new Audio("assets/audio/metal-clang-284809.mp3");

        // Preload all sounds and set initial volume
        Object.values(audioManager.soundEffects).forEach(sound => {
            sound.load();
            sound.volume = audioManager.sfxVolume;
        });

        audioManager.audioContextUnlocked = true;
      }

      console.log("Sound effects initialized:", audioManager.soundEffects);

      const backBtn = document.querySelector('#backToGamesBtn');
      if (backBtn) {
        backBtn.remove();
      }
      gameState = "playing";
      startBtn.style.display = "none";
      document.getElementById("settingsMenu").style.display = "none";
      initializeGamePositions();
      score = 0;
      spreadStartTime = Date.now();
      audioManager.startBackgroundMusic();
    }
  
    const leftBtn = document.getElementById('leftBtn');
    const rightBtn = document.getElementById('rightBtn');
    const upBtn = document.getElementById('upBtn');
    const downBtn = document.getElementById('downBtn');
    const startBtn = document.getElementById('startBtn');
  
    leftBtn.addEventListener('click', () => {
      if (gameState === "playing" && Date.now() >= playerControlDisabledUntil) angle = Math.PI;
    });
    rightBtn.addEventListener('click', () => {
      if (gameState === "playing" && Date.now() >= playerControlDisabledUntil) angle = 0;
    });
    upBtn.addEventListener('click', () => {
      if (gameState === "playing" && Date.now() >= playerControlDisabledUntil) angle = -Math.PI / 2;
    });
    downBtn.addEventListener('click', () => {
      if (gameState === "playing" && Date.now() >= playerControlDisabledUntil) angle = Math.PI / 2;
    });
  
    document.addEventListener('keydown', (event) => {
      if (gameState === "start" && event.code === "Space") {
        startGame();
      } else if (gameState === "playing") {
        // Use Space to toggle pause/resume, while arrow keys move the dot.
        if (event.code === "Space") {
          togglePause();
        } else if (Date.now() >= playerControlDisabledUntil) {
          switch (event.key) {
            case 'ArrowLeft': angle = Math.PI; break;
            case 'ArrowRight': angle = 0; break;
            case 'ArrowUp': angle = -Math.PI / 2; break;
            case 'ArrowDown': angle = Math.PI / 2; break;
          }
        }
      }
    });
  
    startBtn.addEventListener('click', () => {
      if (audioManager.audioContext.state === 'suspended') {
        audioManager.audioContext.resume();
      }
      startGame();
    });
  
    function gameLoop() {
      if (!paused) {
        if (gameState === "playing") {
          updateGame();
          renderGame();
        } else if (gameState === "gameOver") {
          // Stop MP3 music when the game ends.
          audioManager.stopBackgroundMusic();
          renderGameOver();
          if (Date.now() - gameOverTimer > GAME_OVER_DURATION) {
            gameState = "start";
            startBtn.style.display = "block";
          }
        } else if (gameState === "start") {
          renderStartScreen();
        }
      }
      updateControlsVisibility();
      requestAnimationFrame(gameLoop);
    }
  
    function updateGame() {
      // Update dot position with speed effects
      let currentSpeed = speed;
      if (Date.now() < playerSpeedBoostUntil) {
        currentSpeed = 2; // Boosted speed
        playerColor = 'skyblue';
      } else if (playerSlipAmount > 0) {
        currentSpeed = speed * 3; // Mud slip effect
        playerSlipAmount *= 0.95;
        if (playerSlipAmount < 0.01) playerSlipAmount = 0;
      } else if (playerColor !== 'yellow' && Date.now() >= playerControlDisabledUntil) {
        playerColor = 'yellow';
      }
      
      playerX += currentSpeed * Math.cos(angle);
      playerY += currentSpeed * Math.sin(angle);
      wrapAround("player");
  
      // Update chaser positions with improved pathfinding
      chasers.forEach(chaser => {
        if (chaser.aiType === undefined) chaser.aiType = 1;
  
        if (!chaser.nextJobRoll || Date.now() >= chaser.nextJobRoll) {
          chaser.aiType = Math.floor(Math.random() * 4) + 1;
          chaser.nextJobRoll = Date.now() + Math.random() * 5000 + 10000;
        }
  
        let targetX, targetY;
        
        // Type 4 slimes don't wrap around - they wander randomly
        if (chaser.aiType === 4) {
          if (!chaser.randomTarget || distanceBetween(chaser.x, chaser.y, chaser.randomTarget.x, chaser.randomTarget.y) < 10) {
            chaser.randomTarget = {
              x: Math.random() * canvas.width,
              y: Math.random() * canvas.height
            };
          }
          targetX = chaser.randomTarget.x;
          targetY = chaser.randomTarget.y;
        } else {
          // All other slime types use smart pathfinding with screen wrapping
          switch(chaser.aiType) {
            case 1: // Direct chase
              let paths = [
                {x: playerX, y: playerY}, // Direct path
                {x: playerX + canvas.width, y: playerY}, // Wrap right
                {x: playerX - canvas.width, y: playerY}, // Wrap left
                {x: playerX, y: playerY + canvas.height}, // Wrap down
                {x: playerX, y: playerY - canvas.height} // Wrap up
              ];
              
              // Find closest path accounting for mud
              let bestPath = paths[0];
              let shortestDist = Infinity;
              
              paths.forEach(path => {
                let dist = distanceBetween(chaser.x, chaser.y, path.x, path.y);
                // Check if path crosses mud
                for (let mud of mudPatches) {
                  let mudDist = distanceBetween(mud.x, mud.y, 
                    (chaser.x + path.x)/2, (chaser.y + path.y)/2);
                  if (mudDist < mud.size/2 + MUD_AVOIDANCE_DISTANCE) {
                    dist += MUD_AVOIDANCE_DISTANCE * 2;
                  }
                }
                if (dist < shortestDist) {
                  shortestDist = dist;
                  bestPath = path;
                }
              });
              
              targetX = bestPath.x;
              targetY = bestPath.y;
              break;
              
            case 2: // Key seeker
              if (!chaser.targetKey || !collectibles.includes(chaser.targetKey)) {
                let nearestKey = null;
                let minDist = Infinity;
                collectibles.forEach(key => {
                  let paths = [
                    {x: key.x, y: key.y},
                    {x: key.x + canvas.width, y: key.y},
                    {x: key.x - canvas.width, y: key.y},
                    {x: key.x, y: key.y + canvas.height},
                    {x: key.x, y: key.y - canvas.height}
                  ];
                  
                  paths.forEach(path => {
                    let d = distanceBetween(chaser.x, chaser.y, path.x, path.y);
                    if (d < minDist) {
                      minDist = d;
                      nearestKey = key;
                    }
                  });
                });
                chaser.targetKey = nearestKey;
              }
              if (chaser.targetKey) {
                targetX = chaser.targetKey.x;
                targetY = chaser.targetKey.y;
              } else {
                targetX = playerX;
                targetY = playerY;
              }
              break;
              
            case 3: // Prediction chase
              const predictionFactor = 20;
              let predictedX = playerX + Math.cos(angle) * speed * predictionFactor;
              let predictedY = playerY + Math.sin(angle) * speed * predictionFactor;
              
              // Find best wrap-around path to predicted position
              let predPaths = [
                {x: predictedX, y: predictedY},
                {x: predictedX + canvas.width, y: predictedY},
                {x: predictedX - canvas.width, y: predictedY},
                {x: predictedX, y: predictedY + canvas.height},
                {x: predictedX, y: predictedY - canvas.height}
              ];
              
              let bestPredPath = predPaths[0];
              let minPredDist = Infinity;
              predPaths.forEach(path => {
                let d = distanceBetween(chaser.x, chaser.y, path.x, path.y);
                if (d < minPredDist) {
                  minPredDist = d;
                  bestPredPath = path;
                }
              });
              
              targetX = bestPredPath.x;
              targetY = bestPredPath.y;
              break;
          }
        }

        // Add mud avoidance for all types except type 4
        if (chaser.aiType !== 4) {
          let repulsionX = 0, repulsionY = 0;
          for (let mud of mudPatches) {
            let dxMud = chaser.x - mud.x;
            let dyMud = chaser.y - mud.y;
            let distMud = Math.sqrt(dxMud * dxMud + dyMud * dyMud);
            let effectiveDistance = MUD_AVOIDANCE_DISTANCE + chaser.size / 2;
            if (distMud < effectiveDistance && distMud > 0) {
              let strength = MUD_AVOIDANCE_STRENGTH * (1 - distMud / effectiveDistance);
              repulsionX += (dxMud / distMud) * strength;
              repulsionY += (dyMud / distMud) * strength;
            }
          }
          targetX += repulsionX * 50;
          targetY += repulsionY * 50;
        }

        // Move towards target
        let dx = targetX - chaser.x;
        let dy = targetY - chaser.y;
        let angleToTarget = Math.atan2(dy, dx);
        
        chaser.x += chaser.speed * Math.cos(angleToTarget);
        chaser.y += chaser.speed * Math.sin(angleToTarget);
        
        // Wrap around screen for all types except 4
        if (chaser.aiType !== 4) {
          if (chaser.x < 0) chaser.x = canvas.width;
          if (chaser.x > canvas.width) chaser.x = 0;
          if (chaser.y < 0) chaser.y = canvas.height;
          if (chaser.y > canvas.height) chaser.y = 0;
        }
      });

      // Chaser-key collision: if a chaser hits a key, remove the key (destroy it)
      for (let i = collectibles.length - 1; i >= 0; i--) {
        const keyItem = collectibles[i];
        for (let chaser of chasers) {
          if (distanceBetween(chaser.x, chaser.y, keyItem.x, keyItem.y) < 
              (chaser.size / 2 + keyItem.size / 2)) {
            collectibles.splice(i, 1); // Remove the key
            break;
          }
        }
      }

      // Player-key collision (keep existing logic for player collecting keys)
      for (let i = collectibles.length - 1; i >= 0; i--) {
        const item = collectibles[i];
        const distance = distanceBetween(playerX, playerY, item.x, item.y);
        if (distance < (playerSize / 2 + item.size / 2)) {
          collectibles.splice(i, 1);
          score++;
          audioManager.playKeyPickupSound();
          
          // Only 25% chance to split a slime when collecting a key
          if (chasers.length > 0 && Math.random() < 0.25) {
            let closestChaser = chasers[0];
            let minDist = distanceBetween(playerX, playerY, closestChaser.x, closestChaser.y);
            for (let ch of chasers) {
              let d = distanceBetween(playerX, playerY, ch.x, ch.y);
              if (d < minDist) {
                minDist = d;
                closestChaser = ch;
              }
            }
            let index = chasers.indexOf(closestChaser);
            if (index !== -1) {
              let newAiType = Math.floor(Math.random() * 4) + 1;
              chasers.splice(index, 1, ...splitChaser(closestChaser, item, newAiType));
            }
          }
        }
      }
  
      // Check mud collisions - now also removes speed boost and plays slip sound
      if (Date.now() >= playerControlDisabledUntil) {
        for (let mud of mudPatches) {
          let dxMud = playerX - mud.x;
          let dyMud = playerY - mud.y;
          let distance = Math.sqrt(dxMud * dxMud + dyMud * dyMud);
          if (distance < (playerSize / 2 + mud.size / 2)) {
            playerControlDisabledUntil = Date.now() + (3000 + mud.size * 20);
            playerColor = '#8B4513';
            playerSlipAmount = 1.0;
            playerSpeedBoostUntil = 0; // Remove speed boost when hitting mud
            audioManager.playSlipSound();
          }
        }
      }
  
      // Gradually return dot to yellow only after slip effect is done
      if (playerColor !== 'yellow' && Date.now() >= playerControlDisabledUntil && playerSlipAmount === 0) {
        playerColor = 'yellow';
      }
  
      // Check collision between dot and chasers
      if (checkCollision() && Date.now() > playerInvincibleUntil) {
        lives--;
        audioManager.playHurtSound();
        if (lives <= 0) {
          gameState = "gameOver";
          gameOverTimer = Date.now();
        } else {
          playerX = canvas.width / 2;
          playerY = canvas.height / 2;
          angle = 0;
          playerInvincibleUntil = Date.now() + 2000;
        }
      }

      // Check collisions with speed crates
      for (let i = speedCrates.length - 1; i >= 0; i--) {
        const crate = speedCrates[i];
        // Check dot collision
        if (distanceBetween(playerX, playerY, crate.x, crate.y) < (playerSize/2 + CRATE_SIZE/2)) {
          speedCrates.splice(i, 1);
          playerSpeedBoostUntil = Date.now() + SPEED_BOOST_DURATION;
          playerColor = 'skyblue';
          audioManager.playWoodCrackleSound();
          continue;
        }
        // Check chaser collisions
        for (let chaser of chasers) {
          if (distanceBetween(chaser.x, chaser.y, crate.x, crate.y) < (chaser.size/2 + CRATE_SIZE/2)) {
            speedCrates.splice(i, 1);
            chaserSpeedIncrease += 0.1;
            break;
          }
        }
      }

      // Update chaser speeds – cap maximum speed to player's speed minus 0.1
      for (let chaser of chasers) {
        chaser.speed = Math.min(speed - 0.1, CHASER_SPEED * (120 / chaser.size) + chaserSpeedIncrease);
      }
    }
  
    function wrapAround(type) {
      if (type === "player") {
        if (playerX < 0) playerX = canvas.width;
        else if (playerX > canvas.width) playerX = 0;
        if (playerY < 0) playerY = canvas.height;
        else if (playerY > canvas.height) playerY = 0;
      }
    }
  
    function checkCollision() {
      const dotRadius = playerSize / 2;
      const dotLeft = playerX - dotRadius;
      const dotRight = playerX + dotRadius;
      const dotTop = playerY - dotRadius;
      const dotBottom = playerY + dotRadius;
  
      for (let chaser of chasers) {
        const chaserLeft = chaser.x - chaser.size / 2;
        const chaserRight = chaser.x + chaser.size / 2;
        const chaserTop = chaser.y - chaser.size / 2;
        const chaserBottom = chaser.y + chaser.size / 2;
  
        if (
          dotRight > chaserLeft &&
          dotLeft < chaserRight &&
          dotBottom > chaserTop &&
          dotTop < chaserBottom
        ) {
          return true;
        }
      }
      return false;
    }
  
    function drawKey(x, y, size) {
      ctx.fillStyle = 'gold';
      const headRadius = size / 3;
      ctx.beginPath();
      ctx.arc(x, y, headRadius, 0, Math.PI * 2);
      ctx.fill();
      
      const shaftWidth = size / 4;
      const shaftLength = size;
      ctx.fillRect(x, y - shaftWidth / 2, shaftLength, shaftWidth);
      
      const toothSize = shaftWidth;
      ctx.fillRect(x + shaftLength, y - toothSize / 2, toothSize, toothSize);
    }
  
    function renderGame() {
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
  
      // Draw mud patches first (under everything else)
      for (let mud of mudPatches) {
        // Dark brown base
        ctx.fillStyle = '#3d2817';
        ctx.beginPath();
        ctx.arc(mud.x, mud.y, mud.size / 2, 0, Math.PI * 2);
        ctx.fill();

        // Add stored texture spots
        ctx.fillStyle = '#4a3423';
        for (let spot of mud.spots) {
          let spotX = mud.x + Math.cos(spot.angle) * spot.dist;
          let spotY = mud.y + Math.sin(spot.angle) * spot.dist;
          ctx.beginPath();
          ctx.arc(spotX, spotY, spot.size / 2, 0, Math.PI * 2);
          ctx.fill();
        }

        // Add stored shine spots
        ctx.fillStyle = '#5c412c';
        for (let shine of mud.shineSpots) {
          let spotX = mud.x + Math.cos(shine.angle) * shine.dist;
          let spotY = mud.y + Math.sin(shine.angle) * shine.dist;
          ctx.beginPath();
          ctx.arc(spotX, spotY, mud.size / 8, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Draw the dot with current color (blink if invincible)
      if (Date.now() < playerInvincibleUntil) {
        if (Math.floor(Date.now() / 300) % 2 === 0) {
          ctx.fillStyle = playerColor;
          ctx.beginPath();
          ctx.arc(playerX, playerY, playerSize / 2, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        ctx.fillStyle = playerColor;
        ctx.beginPath();
        ctx.arc(playerX, playerY, playerSize / 2, 0, Math.PI * 2);
        ctx.fill();
      }

      // Get the debug toggle state
      const debugMode = document.getElementById('debugToggle').checked;

      // Draw chasers
      for (let chaser of chasers) {
        // Draw chaser body
        ctx.fillStyle = 'green';
        ctx.fillRect(
          chaser.x - chaser.size / 2,
          chaser.y - chaser.size / 2,
          chaser.size,
          chaser.size
        );

        if (debugMode) {
          // Draw the current AI type (job) number on each chaser for debugging.
          ctx.fillStyle = 'white';
          ctx.font = '12px monospace';
          ctx.fillText(chaser.aiType, chaser.x - 4, chaser.y + 4);
        } else {
          // Draw googly eyes on the chaser.
          const eyeOffsetX = chaser.size / 4;
          const eyeOffsetY = -chaser.size / 4;
          const eyeRadius = chaser.size / 8;
          const pupilRadius = chaser.size / 16;
          const eyeRotation = (Date.now() / 250 + chaser.x/100 + chaser.y/100) % (2 * Math.PI);
          const pupilOffset = eyeRadius / 2;

          // Draw left eye
          const leftEyeX = chaser.x - eyeOffsetX;
          const leftEyeY = chaser.y + eyeOffsetY;
          ctx.beginPath();
          ctx.arc(leftEyeX, leftEyeY, eyeRadius, 0, 2 * Math.PI);
          ctx.fillStyle = 'white';
          ctx.fill();
          const leftPupilX = leftEyeX + Math.cos(eyeRotation) * pupilOffset;
          const leftPupilY = leftEyeY + Math.sin(eyeRotation) * pupilOffset;
          ctx.beginPath();
          ctx.arc(leftPupilX, leftPupilY, pupilRadius, 0, 2 * Math.PI);
          ctx.fillStyle = 'black';
          ctx.fill();

          // Draw right eye
          const rightEyeX = chaser.x + eyeOffsetX;
          const rightEyeY = chaser.y + eyeOffsetY;
          ctx.beginPath();
          ctx.arc(rightEyeX, rightEyeY, eyeRadius, 0, 2 * Math.PI);
          ctx.fillStyle = 'white';
          ctx.fill();
          const rightPupilX = rightEyeX + Math.cos(eyeRotation) * pupilOffset;
          const rightPupilY = rightEyeY + Math.sin(eyeRotation) * pupilOffset;
          ctx.beginPath();
          ctx.arc(rightPupilX, rightPupilY, pupilRadius, 0, 2 * Math.PI);
          ctx.fillStyle = 'black';
          ctx.fill();
        }
      }

      // Draw collectible keys on top
      for (let item of collectibles) {
        drawKey(item.x, item.y, item.size);
      }

      // Draw hearts for lives in top-left
      ctx.textAlign = 'left';
      for (let i = 0; i < 3; i++) {
        let heartX = 20 + i * 35;
        let heartY = 40;
        ctx.font = '30px monospace';
        if (i < lives) {
          ctx.fillStyle = 'yellow';
          ctx.fillText("♥", heartX, heartY);
        } else {
          ctx.fillStyle = 'yellow';
          // Use the outlined heart (Unicode: U+2661) consistently.
          ctx.fillText("♡", heartX, heartY);
        }
      }

      // Draw score
      ctx.fillStyle = 'white';
      ctx.font = '30px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`Score: ${score}`, canvas.width - 20, 40);

      // Draw speed crates with lightning bolt
      for (let crate of speedCrates) {
        // Wooden crate appearance
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(crate.x - CRATE_SIZE/2, crate.y - CRATE_SIZE/2, CRATE_SIZE, CRATE_SIZE);
        
        // Add wood grain effect
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 2;
        for (let i = -2; i <= 2; i++) {
          ctx.beginPath();
          ctx.moveTo(crate.x - CRATE_SIZE/2, crate.y + i * 5);
          ctx.lineTo(crate.x + CRATE_SIZE/2, crate.y + i * 5);
          ctx.stroke();
        }
        // Vertical edges
        ctx.beginPath();
        ctx.moveTo(crate.x - CRATE_SIZE/2, crate.y - CRATE_SIZE/2);
        ctx.lineTo(crate.x - CRATE_SIZE/2, crate.y + CRATE_SIZE/2);
        ctx.moveTo(crate.x + CRATE_SIZE/2, crate.y - CRATE_SIZE/2);
        ctx.lineTo(crate.x + CRATE_SIZE/2, crate.y + CRATE_SIZE/2);
        ctx.stroke();

        // Add blue lightning bolt
        ctx.strokeStyle = '#00BFFF'; // Deep sky blue
        ctx.lineWidth = 3;
        ctx.beginPath();
        // Start at top
        ctx.moveTo(crate.x, crate.y - CRATE_SIZE/3);
        // Zigzag down
        ctx.lineTo(crate.x + CRATE_SIZE/4, crate.y);
        ctx.lineTo(crate.x - CRATE_SIZE/4, crate.y);
        ctx.lineTo(crate.x, crate.y + CRATE_SIZE/3);
        ctx.stroke();
        
        // Add glow effect
        ctx.strokeStyle = 'rgba(0, 191, 255, 0.3)';
        ctx.lineWidth = 6;
        ctx.stroke();
      }
    }
  
    function renderGameOver() {
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = 'red';
      ctx.font = '80px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2);

      if (!hasSubmittedScore) {
        hasSubmittedScore = true;
        fetch("http://localhost:3000/api/highscore", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ score: score })
        })
          .then(response => response.json())
          .then(data => {
            globalHighScore = data.score;
            ctx.fillStyle = 'white';
            ctx.font = '40px monospace';
            ctx.fillText("High Score: " + data.score, canvas.width / 2, canvas.height / 2 + 80);
            console.log("Updated global high score:", globalHighScore);
          })
          .catch(error => {
            console.error("Error submitting high score:", error);
            ctx.fillStyle = 'white';
            ctx.font = '40px monospace';
            ctx.fillText("High Score: " + score, canvas.width / 2, canvas.height / 2 + 80);
          });
      }

      // Return to start screen after 5 seconds
      if (Date.now() - gameOverTimer > GAME_OVER_DURATION) {
        gameState = "start";
        startBtn.style.display = "block";
        hasSubmittedScore = false;
      }
    }
  
    function renderStartScreen() {
      // Dark blue background
      ctx.fillStyle = '#000033';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw stars (assuming you have the stars array)
      for (let star of stars) {
        ctx.fillStyle = 'yellow';
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Text settings
      ctx.fillStyle = 'white';
      ctx.textAlign = 'center';
      
      // Title
      ctx.font = '60px monospace';
      ctx.fillText("Welcome to Escapae!", canvas.width / 2, canvas.height / 2 - 100);
      
      // Game description (split into two lines)
      ctx.font = '30px monospace';
      ctx.fillText("Deep underground, collect golden keys while avoiding giant slimes", canvas.width / 2, canvas.height / 2 - 20);
      ctx.fillText("and mud patches. Find enough keys to help you escapae!", canvas.width / 2, canvas.height / 2 + 20);
      
      // Start instruction
      ctx.font = '40px monospace';
      ctx.fillText("Press SPACE or click Start to begin your escape", canvas.width / 2, canvas.height / 2 + 100);

      // Add back button (styled to match the game's aesthetic)
      const backBtn = document.createElement('button');
      backBtn.innerText = "Back";
      backBtn.style.position = 'absolute';
      backBtn.style.left = '20px';
      backBtn.style.top = '20px';
      backBtn.style.padding = '10px 20px';
      backBtn.style.fontSize = '20px';
      backBtn.style.backgroundColor = 'black';
      backBtn.style.color = 'white';
      backBtn.style.border = '2px solid white';
      backBtn.style.cursor = 'pointer';
      backBtn.style.fontFamily = 'monospace';
      
      if (!document.querySelector('#backToGamesBtn')) {
        backBtn.id = 'backToGamesBtn';
        document.body.appendChild(backBtn);
        
        backBtn.addEventListener('click', () => {
          window.location.href = '/mc-games/';
        });
      }
    }
  
    initializeStars();
    gameLoop();

    // Update mud spawning with occasional huge patches
    setInterval(() => {
      if (gameState === "playing") {
        let numToSpawn = Math.floor(Math.random() * 5) + 1;
        for (let i = 0; i < numToSpawn; i++) {
          // 10% chance for huge mud patch
          let mudSize = Math.random() < 0.1 ? 
            canvas.width / 4 : // Huge mud (quarter screen)
            Math.random() * 30 + 30;  // Normal mud
          
          let spots = [];
          for (let j = 0; j < 5; j++) {
            spots.push({
              angle: Math.random() * Math.PI * 2,
              dist: Math.random() * (mudSize / 4),
              size: mudSize / 3 + Math.random() * (mudSize / 4)
            });
          }
          let shineSpots = [];
          for (let j = 0; j < 3; j++) {
            shineSpots.push({
              angle: Math.random() * Math.PI * 2,
              dist: Math.random() * (mudSize / 5)
            });
          }
          mudPatches.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: mudSize,
            spots: spots,
            shineSpots: shineSpots
          });
        }
      }
    }, 30000);

    // Fix key spawning - remove old intervals and add new ones
    const keySpawnInterval = setInterval(() => {
      if (gameState === "playing") {
        let numToSpawn = Math.floor(Math.random() * 5) + 2;
        for (let i = 0; i < numToSpawn; i++) {
          collectibles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: 15
          });
        }
      }
    }, 20000);

    const keyRemovalInterval = setInterval(() => {
      if (gameState === "playing" && collectibles.length > 0) {
        let numToRemove = Math.floor(Math.random() * 11);
        for (let i = 0; i < numToRemove; i++) {
          if (collectibles.length > 0) {
            const index = Math.floor(Math.random() * collectibles.length);
            collectibles.splice(index, 1);
          }
        }
      }
    }, 60000);

    // Spawn speed crates every 60 seconds (1-2 crates)
    setInterval(() => {
      if (gameState === "playing") {
        let numToSpawn = Math.floor(Math.random() * 2) + 1;
        for (let i = 0; i < numToSpawn; i++) {
          speedCrates.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height
          });
        }
      }
    }, 60000);

    // Remove speed crates every 40 seconds (0-1 crates)
    setInterval(() => {
      if (gameState === "playing" && speedCrates.length > 0) {
        if (Math.random() < 0.5) { // 50% chance to remove one
          const index = Math.floor(Math.random() * speedCrates.length);
          speedCrates.splice(index, 1);
        }
      }
    }, 40000);

    function distanceBetween(x1, y1, x2, y2) {
      const dx = x1 - x2;
      const dy = y1 - y2;
      return Math.sqrt(dx * dx + dy * dy);
    }

    // NEW: helper functions for side labeling
    function getSideByIndex(index) {
      const sides = ["top", "right", "bottom", "left"];
      return sides[index % sides.length];
    }

    function getNextSide(side) {
      const sides = ["top", "right", "bottom", "left"];
      let idx = sides.indexOf(side);
      return sides[(idx + 1) % sides.length];
    }

    // NEW: picks a random corner of the canvas
    function pickRandomCorner() {
      const corners = [
        { x: 0, y: 0 },
        { x: canvas.width, y: 0 },
        { x: canvas.width, y: canvas.height },
        { x: 0, y: canvas.height }
      ];
      return corners[Math.floor(Math.random() * corners.length)];
    }

    function splitChaser(chaser, keyTarget, newAiType) {
      if (chaser.size < 20) return [chaser];
      let newSize = chaser.size * 0.7;
      let angleToPlayer = Math.atan2(playerY - chaser.y, playerX - chaser.x);
      let offset = chaser.size / 2;
      const chaser1 = {
        x: chaser.x + offset * Math.cos(angleToPlayer + 0.3),
        y: chaser.y + offset * Math.sin(angleToPlayer + 0.3),
        size: newSize,
        speed: chaser.speed,
        aiType: chaser.aiType
      };
      const chaser2 = {
        x: chaser.x + offset * Math.cos(angleToPlayer - 0.3),
        y: chaser.y + offset * Math.sin(angleToPlayer - 0.3),
        size: newSize,
        speed: chaser.speed,
        aiType: newAiType
      };
      if (keyTarget) {
        chaser1.targetKey = { x: keyTarget.x, y: keyTarget.y };
      }
      // Assign side labels:
      let parentSide = chaser.assignedSide || "top";
      chaser1.assignedSide = parentSide;
      chaser2.assignedSide = getNextSide(parentSide);
      
      // NEW: assign different random corner targets that the new chaser pieces will pursue for 7 seconds before resuming normal behavior.
      let corner1 = pickRandomCorner();
      let corner2 = pickRandomCorner();
      // Ensure the two corners are different
      while (corner2.x === corner1.x && corner2.y === corner1.y) {
        corner2 = pickRandomCorner();
      }
      chaser1.cornerTarget = corner1;
      chaser2.cornerTarget = corner2;
      chaser1.cornerDuration = Date.now() + 7000;
      chaser2.cornerDuration = Date.now() + 7000;
      
      return [chaser1, chaser2];
    }

    function mergeChasers() {
      if (chasers.length < 25) return;
      for (let i = 0; i < chasers.length; i++) {
        for (let j = i + 1; j < chasers.length; j++) {
          let d = distanceBetween(chasers[i].x, chasers[i].y, chasers[j].x, chasers[j].y);
          if (d < 40) {
            const merged = {
              x: (chasers[i].x + chasers[j].x) / 2,
              y: (chasers[i].y + chasers[j].y) / 2,
              size: chasers[i].size + chasers[j].size * 0.5,
              speed: Math.max(chasers[i].speed, chasers[j].speed)
            };
            chasers.splice(j, 1);
            chasers.splice(i, 1);
            chasers.push(merged);
            return;
          }
        }
      }
    }

    // New function to toggle pause/resume.
    function togglePause() {
      paused = !paused;
      const settingsMenu = document.getElementById("settingsMenu");
      settingsMenu.style.display = paused ? "flex" : "none";
    }
    window.togglePause = togglePause;  // expose togglePause globally for button access
    window.setSfxVolume = function(val) { audioManager.sfxVolume = val; };

    // New function to hide or display on-screen controls.
    function updateControlsVisibility() {
      const controlsDiv = document.querySelector('.controls');
      const pauseButton = document.getElementById('pauseButton');
      if (gameState === 'playing' && !paused) {
        // Show arrow controls using their original grid display.
        controlsDiv.style.display = 'grid';
        // Show the pause button.
        pauseButton.style.display = 'block';
      } else {
        // Hide both controls.
        controlsDiv.style.display = 'none';
        pauseButton.style.display = 'none';
      }
    }

    function adjustBackgroundVolume(targetVolume) {
      if (audioManager.backgroundMusic) {
        audioManager.backgroundMusic.volume = targetVolume;
      }
    }

    // Function to fetch the current high score from the backend
    function fetchHighScore() {
      fetch("http://localhost:3000/api/highscore")
        .then(response => response.json())
        .then(data => {
          globalHighScore = data.score || 0;
          console.log("Fetched high score:", globalHighScore);
        })
        .catch(error => {
          console.error("Error fetching high score:", error);
          globalHighScore = 0;
        });
    }

    // Immediately fetch the high score on game load
    fetchHighScore();

    // Debug: Press "T" to test and display the current high score
    document.addEventListener("keydown", (e) => {
      if (e.key === "t" || e.key === "T") {
        alert("Current High Score: " + globalHighScore);
      }
    });
})();
  