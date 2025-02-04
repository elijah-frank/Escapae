(function() {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    let gameState = "start";
    let gameOverTimer = 0;
    const GAME_OVER_DURATION = 5000;
    let dotX, dotY;
    let angle = 0;
    const speed = 1.2;
    const dotSize = 10;
    let chasers = [];
    const INITIAL_CHASER_SIZE = 120;
    const CHASER_SPEED = 1.1;
    const REPULSION_STRENGTH = 0.5;
    const REPULSION_DISTANCE = 150;
    const SPREAD_TIME = 2000; // Time in ms for initial spreading
    let spreadStartTime = 0;
    let lastSplitScore = 0;
    let collectibles = [];
    let score = 0;
    let stars = [];
    let mudPatches = [];
    const MUD_AVOIDANCE_DISTANCE = 100;
    const MUD_AVOIDANCE_STRENGTH = 1.5;
    let dotControlDisabledUntil = 0;
    // Add dot color state
    let dotColor = 'yellow';
    let dotSlipAmount = 0;
    // Add constant for new chaser spawn distance
    const MIN_SPAWN_DISTANCE = 180; // About 3 inches at typical screen DPI
    let lastSpawnScore = 0; // Track last score we spawned a chaser at
    // Add health system variables
    let lives = 3;
    let dotInvincibleUntil = 0;
    // Add speed crate properties
    let speedCrates = [];
    const SPEED_BOOST_DURATION = 10000; // 10 seconds boost
    const CRATE_SIZE = 25;
    let dotSpeedBoostUntil = 0;
    let chaserSpeedIncrease = 0;
    // Create (or reuse) a single AudioContext for your game
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    /**
     * Starts an upbeat, layered background music loop.
     * The chord layer (sine oscillators) provides a warm base while the
     * melody layer (sawtooth oscillator) plays an arpeggio.
     */ function startBackgroundMusic() {
        const masterGain = audioContext.createGain();
        masterGain.gain.value = 0.05; // Master volume
        masterGain.connect(audioContext.destination);
        // --- Chord layer ---
        // A subtle, warm chord using sine oscillators (A2, C3, D3)
        const chordFrequencies = [
            110,
            130.81,
            146.83
        ];
        const chordOscillators = [];
        chordFrequencies.forEach((freq)=>{
            const osc = audioContext.createOscillator();
            osc.type = 'sine';
            osc.frequency.value = freq;
            osc.connect(masterGain);
            osc.start();
            chordOscillators.push(osc);
        });
        // --- Melody layer (arpeggio) ---
        // An upbeat arpeggio using a sawtooth oscillator for a brighter feel.
        const melodyOsc = audioContext.createOscillator();
        melodyOsc.type = 'sawtooth';
        const melodyGain = audioContext.createGain();
        melodyGain.gain.value = 0.02; // Lower volume to blend with chords
        melodyOsc.connect(melodyGain);
        melodyGain.connect(masterGain);
        melodyOsc.start();
        // Define an arpeggio array (A3, B3, C4, D4)
        const arpeggioNotes = [
            220,
            246.94,
            261.63,
            293.66
        ];
        let noteIndex = 0;
        function scheduleNextNote() {
            melodyOsc.frequency.setValueAtTime(arpeggioNotes[noteIndex], audioContext.currentTime);
            noteIndex = (noteIndex + 1) % arpeggioNotes.length;
            setTimeout(scheduleNextNote, 500); // Change note every 500 ms
        }
        scheduleNextNote();
        return {
            chordOscillators,
            melodyOscillator: melodyOsc,
            melodyGain
        };
    }
    /**
     * Plays a short "slip" sound.
     * This function creates a burst of filtered white noise that fades out quickly.
     */ function playSlipSound() {
        const duration = 0.5;
        const bufferSize = audioContext.sampleRate * duration;
        const noiseBuffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for(let i = 0; i < bufferSize; i++)output[i] = Math.random() * 2 - 1;
        const noiseSource = audioContext.createBufferSource();
        noiseSource.buffer = noiseBuffer;
        const filter = audioContext.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 300; // Adjust frequency for a muffled slip sound
        const gainNode = audioContext.createGain();
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
        noiseSource.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(audioContext.destination);
        noiseSource.start();
        noiseSource.stop(audioContext.currentTime + duration);
    }
    function initializeStars() {
        stars = [];
        const numStars = 50;
        for(let i = 0; i < numStars; i++)stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            radius: Math.random() * 2 + 1
        });
    }
    function initializeGamePositions() {
        dotX = canvas.width / 2;
        dotY = canvas.height / 2;
        chasers = [
            {
                x: INITIAL_CHASER_SIZE / 2,
                y: INITIAL_CHASER_SIZE / 2,
                size: INITIAL_CHASER_SIZE,
                speed: CHASER_SPEED
            }
        ];
        angle = 0;
        collectibles = [
            {
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                size: 15
            }
        ];
        mudPatches = [];
        lastSplitScore = 0;
        lives = 3;
        dotInvincibleUntil = 0;
        speedCrates = [];
        dotSpeedBoostUntil = 0;
        chaserSpeedIncrease = 0;
    }
    function startGame() {
        gameState = "playing";
        startBtn.style.display = "none";
        initializeGamePositions();
        score = 0;
        spreadStartTime = Date.now();
        // Start background music (store oscillators if you later wish to stop them on game over)
        const bgOscillators = startBackgroundMusic();
    }
    const leftBtn = document.getElementById('leftBtn');
    const rightBtn = document.getElementById('rightBtn');
    const upBtn = document.getElementById('upBtn');
    const downBtn = document.getElementById('downBtn');
    const startBtn = document.getElementById('startBtn');
    leftBtn.addEventListener('click', ()=>{
        if (gameState === "playing" && Date.now() >= dotControlDisabledUntil) angle = Math.PI;
    });
    rightBtn.addEventListener('click', ()=>{
        if (gameState === "playing" && Date.now() >= dotControlDisabledUntil) angle = 0;
    });
    upBtn.addEventListener('click', ()=>{
        if (gameState === "playing" && Date.now() >= dotControlDisabledUntil) angle = -Math.PI / 2;
    });
    downBtn.addEventListener('click', ()=>{
        if (gameState === "playing" && Date.now() >= dotControlDisabledUntil) angle = Math.PI / 2;
    });
    document.addEventListener('keydown', (event)=>{
        if (gameState === "start" && event.code === "Space") startGame();
        else if (gameState === "playing" && Date.now() >= dotControlDisabledUntil) switch(event.key){
            case 'ArrowLeft':
                angle = Math.PI;
                break;
            case 'ArrowRight':
                angle = 0;
                break;
            case 'ArrowUp':
                angle = -Math.PI / 2;
                break;
            case 'ArrowDown':
                angle = Math.PI / 2;
                break;
        }
    });
    startBtn.addEventListener('click', startGame);
    function gameLoop() {
        if (gameState === "playing") {
            updateGame();
            renderGame();
        } else if (gameState === "gameOver") {
            renderGameOver();
            if (Date.now() - gameOverTimer > GAME_OVER_DURATION) {
                gameState = "start";
                startBtn.style.display = "block";
            }
        } else if (gameState === "start") renderStartScreen();
        requestAnimationFrame(gameLoop);
    }
    function updateGame() {
        // Update dot position with speed effects
        let currentSpeed = speed;
        if (Date.now() < dotSpeedBoostUntil) {
            currentSpeed = 2; // Boosted speed
            dotColor = 'skyblue';
        } else if (dotSlipAmount > 0) {
            currentSpeed = speed * 3; // Mud slip effect
            dotSlipAmount *= 0.95;
            if (dotSlipAmount < 0.01) dotSlipAmount = 0;
        } else if (dotColor !== 'yellow' && Date.now() >= dotControlDisabledUntil) dotColor = 'yellow';
        dotX += currentSpeed * Math.cos(angle);
        dotY += currentSpeed * Math.sin(angle);
        wrapAround("dot");
        // Group decision-making for chasers
        let keyTarget = null;
        let speedCrateTarget = null;
        // Find closest key to dot
        if (collectibles.length > 0) {
            let minDist = Infinity;
            for (let item of collectibles){
                const d = distanceBetween(dotX, dotY, item.x, item.y);
                if (d < minDist) {
                    minDist = d;
                    keyTarget = item;
                }
            }
        }
        // Find closest speed crate to dot
        if (speedCrates.length > 0) {
            let minDist = Infinity;
            for (let crate of speedCrates){
                const d = distanceBetween(dotX, dotY, crate.x, crate.y);
                if (d < minDist) {
                    minDist = d;
                    speedCrateTarget = crate;
                }
            }
        }
        // Update chasers with roles
        const spreading = Date.now() - spreadStartTime < SPREAD_TIME;
        chasers.forEach((chaser, index)=>{
            let repulsionX = 0;
            let repulsionY = 0;
            let targetX, targetY;
            if (!spreading) {
                // Assign roles based on position and index
                if (keyTarget && index === 0) {
                    // First chaser goes for key
                    targetX = keyTarget.x;
                    targetY = keyTarget.y;
                } else if (speedCrateTarget && index === 1) {
                    // Second chaser goes for speed crate
                    targetX = speedCrateTarget.x;
                    targetY = speedCrateTarget.y;
                } else {
                    // Others form circle around dot
                    const formationOffset = 50;
                    const offsetAngle = index / chasers.length * (2 * Math.PI);
                    targetX = dotX + formationOffset * Math.cos(offsetAngle);
                    targetY = dotY + formationOffset * Math.sin(offsetAngle);
                }
            } else // Spreading phase logic
            switch(index % 4){
                case 0:
                    targetX = canvas.width * 0.1;
                    targetY = canvas.height * 0.1;
                    break;
                case 1:
                    targetX = canvas.width * 0.9;
                    targetY = canvas.height * 0.9;
                    break;
                case 2:
                    targetX = canvas.width * 0.9;
                    targetY = canvas.height * 0.1;
                    break;
                case 3:
                    targetX = canvas.width * 0.1;
                    targetY = canvas.height * 0.9;
                    break;
            }
            // Calculate direction to target
            let dx = targetX - chaser.x;
            let dy = targetY - chaser.y;
            // Wrap-around adjustments
            if (dx > canvas.width / 2) dx -= canvas.width;
            else if (dx < -canvas.width / 2) dx += canvas.width;
            if (dy > canvas.height / 2) dy -= canvas.height;
            else if (dy < -canvas.height / 2) dy += canvas.height;
            const angleToTarget = Math.atan2(dy, dx);
            // Apply repulsion between chasers
            for (let other of chasers){
                if (other === chaser) continue;
                let rx = chaser.x - other.x;
                let ry = chaser.y - other.y;
                if (rx > canvas.width / 2) rx -= canvas.width;
                else if (rx < -canvas.width / 2) rx += canvas.width;
                if (ry > canvas.height / 2) ry -= canvas.height;
                else if (ry < -canvas.height / 2) ry += canvas.height;
                const distSq = rx * rx + ry * ry;
                if (distSq < REPULSION_DISTANCE * REPULSION_DISTANCE && distSq > 0) {
                    const dist = Math.sqrt(distSq);
                    const strength = REPULSION_STRENGTH * (1 - dist / REPULSION_DISTANCE);
                    repulsionX += rx / dist * strength;
                    repulsionY += ry / dist * strength;
                }
            }
            // Improved mud avoidance
            for (let mud of mudPatches){
                let rxMud = chaser.x - mud.x;
                let ryMud = chaser.y - mud.y;
                if (rxMud > canvas.width / 2) rxMud -= canvas.width;
                else if (rxMud < -canvas.width / 2) rxMud += canvas.width;
                if (ryMud > canvas.height / 2) ryMud -= canvas.height;
                else if (ryMud < -canvas.height / 2) ryMud += canvas.height;
                const effectiveMudDistance = MUD_AVOIDANCE_DISTANCE + chaser.size / 2;
                const distSqMud = rxMud * rxMud + ryMud * ryMud;
                if (distSqMud < effectiveMudDistance * effectiveMudDistance && distSqMud > 0) {
                    const distMud = Math.sqrt(distSqMud);
                    const strengthMud = MUD_AVOIDANCE_STRENGTH * (1 - distMud / effectiveMudDistance);
                    repulsionX += rxMud / distMud * strengthMud;
                    repulsionY += ryMud / distMud * strengthMud;
                }
            }
            // Combine forces and move chaser
            const finalAngle = Math.atan2(Math.sin(angleToTarget) + repulsionY, Math.cos(angleToTarget) + repulsionX);
            chaser.x += chaser.speed * Math.cos(finalAngle);
            chaser.y += chaser.speed * Math.sin(finalAngle);
            wrapAroundChaser(chaser);
            for(let i = collectibles.length - 1; i >= 0; i--){
                const item = collectibles[i];
                const dxKey = chaser.x - item.x;
                const dyKey = chaser.y - item.y;
                const distance = Math.sqrt(dxKey * dxKey + dyKey * dyKey);
                if (distance < chaser.size / 2 + item.size / 2) collectibles.splice(i, 1);
            }
        });
        for(let i = collectibles.length - 1; i >= 0; i--){
            const item = collectibles[i];
            const dxKey = dotX - item.x;
            const dyKey = dotY - item.y;
            const distance = Math.sqrt(dxKey * dxKey + dyKey * dyKey);
            if (distance < dotSize / 2 + item.size / 2) {
                collectibles.splice(i, 1);
                score++;
                // Check for chaser splitting (every 5 points)
                if (score > 0 && score % 5 === 0 && score !== lastSplitScore) {
                    let newChasers = [];
                    for (let chaser of chasers){
                        let dx = dotX - chaser.x;
                        let dy = dotY - chaser.y;
                        let angleToDot = Math.atan2(dy, dx);
                        let perpAngle = angleToDot + Math.PI / 2;
                        let offset = chaser.size;
                        // Calculate speed based on new size
                        let newSize = chaser.size / 2;
                        let newSpeed = Math.min(1.4, CHASER_SPEED * (120 / newSize));
                        newChasers.push({
                            x: chaser.x + offset * Math.cos(perpAngle),
                            y: chaser.y + offset * Math.sin(perpAngle),
                            size: newSize,
                            speed: newSpeed
                        });
                        newChasers.push({
                            x: chaser.x - offset * Math.cos(perpAngle),
                            y: chaser.y - offset * Math.sin(perpAngle),
                            size: newSize,
                            speed: newSpeed
                        });
                    }
                    chasers = newChasers;
                    lastSplitScore = score;
                }
                // Check for new chaser spawn (every 15 points)
                if (score > 0 && score % 15 === 0 && score !== lastSpawnScore) {
                    // Try to find a valid spawn position
                    let validSpawn = false;
                    let spawnX, spawnY;
                    let attempts = 0;
                    while(!validSpawn && attempts < 100){
                        spawnX = Math.random() * canvas.width;
                        spawnY = Math.random() * canvas.height;
                        // Check distance from player
                        let dx = spawnX - dotX;
                        let dy = spawnY - dotY;
                        if (dx > canvas.width / 2) dx -= canvas.width;
                        else if (dx < -canvas.width / 2) dx += canvas.width;
                        if (dy > canvas.height / 2) dy -= canvas.height;
                        else if (dy < -canvas.height / 2) dy += canvas.height;
                        let distance = Math.sqrt(dx * dx + dy * dy);
                        if (distance >= MIN_SPAWN_DISTANCE) validSpawn = true;
                        attempts++;
                    }
                    // Add new chaser at full size
                    if (validSpawn) {
                        chasers.push({
                            x: spawnX,
                            y: spawnY,
                            size: INITIAL_CHASER_SIZE,
                            speed: CHASER_SPEED
                        });
                        lastSpawnScore = score;
                    }
                }
            }
        }
        // Check mud collisions - now also removes speed boost and plays slip sound
        if (Date.now() >= dotControlDisabledUntil) for (let mud of mudPatches){
            let dxMud = dotX - mud.x;
            let dyMud = dotY - mud.y;
            let distance = Math.sqrt(dxMud * dxMud + dyMud * dyMud);
            if (distance < dotSize / 2 + mud.size / 2) {
                dotControlDisabledUntil = Date.now() + (3000 + mud.size * 20);
                dotColor = '#8B4513';
                dotSlipAmount = 1.0;
                dotSpeedBoostUntil = 0; // Remove speed boost when hitting mud
                // Play the slip sound effect
                playSlipSound();
            }
        }
        // Gradually return dot to yellow only after slip effect is done
        if (dotColor !== 'yellow' && Date.now() >= dotControlDisabledUntil && dotSlipAmount === 0) dotColor = 'yellow';
        // Check collision between dot and chasers
        if (checkCollision() && Date.now() > dotInvincibleUntil) {
            lives--;
            if (lives <= 0) {
                gameState = "gameOver";
                gameOverTimer = Date.now();
            } else {
                // Reset position and give temporary invincibility
                dotX = canvas.width / 2;
                dotY = canvas.height / 2;
                angle = 0;
                dotInvincibleUntil = Date.now() + 2000; // 2 seconds of invincibility
            }
        }
        // Check collisions with speed crates
        for(let i = speedCrates.length - 1; i >= 0; i--){
            const crate = speedCrates[i];
            // Check dot collision
            if (distanceBetween(dotX, dotY, crate.x, crate.y) < dotSize / 2 + CRATE_SIZE / 2) {
                speedCrates.splice(i, 1);
                dotSpeedBoostUntil = Date.now() + SPEED_BOOST_DURATION;
                dotColor = 'skyblue';
                continue;
            }
            // Check chaser collisions
            for (let chaser of chasers)if (distanceBetween(chaser.x, chaser.y, crate.x, crate.y) < chaser.size / 2 + CRATE_SIZE / 2) {
                speedCrates.splice(i, 1);
                chaserSpeedIncrease += 0.1;
                break;
            }
        }
        // Update chaser speeds
        for (let chaser of chasers)chaser.speed = Math.min(1.4, CHASER_SPEED * (120 / chaser.size) + chaserSpeedIncrease);
    }
    function wrapAround(type) {
        if (type === "dot") {
            if (dotX < 0) dotX = canvas.width;
            else if (dotX > canvas.width) dotX = 0;
            if (dotY < 0) dotY = canvas.height;
            else if (dotY > canvas.height) dotY = 0;
        }
    }
    function wrapAroundChaser(chaser) {
        if (chaser.x < 0) chaser.x = canvas.width;
        else if (chaser.x > canvas.width) chaser.x = 0;
        if (chaser.y < 0) chaser.y = canvas.height;
        else if (chaser.y > canvas.height) chaser.y = 0;
    }
    function checkCollision() {
        const dotRadius = dotSize / 2;
        const dotLeft = dotX - dotRadius;
        const dotRight = dotX + dotRadius;
        const dotTop = dotY - dotRadius;
        const dotBottom = dotY + dotRadius;
        for (let chaser of chasers){
            const chaserLeft = chaser.x - chaser.size / 2;
            const chaserRight = chaser.x + chaser.size / 2;
            const chaserTop = chaser.y - chaser.size / 2;
            const chaserBottom = chaser.y + chaser.size / 2;
            if (dotRight > chaserLeft && dotLeft < chaserRight && dotBottom > chaserTop && dotTop < chaserBottom) return true;
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
        for (let mud of mudPatches){
            // Dark brown base
            ctx.fillStyle = '#3d2817';
            ctx.beginPath();
            ctx.arc(mud.x, mud.y, mud.size / 2, 0, Math.PI * 2);
            ctx.fill();
            // Add stored texture spots
            ctx.fillStyle = '#4a3423';
            for (let spot of mud.spots){
                let spotX = mud.x + Math.cos(spot.angle) * spot.dist;
                let spotY = mud.y + Math.sin(spot.angle) * spot.dist;
                ctx.beginPath();
                ctx.arc(spotX, spotY, spot.size / 2, 0, Math.PI * 2);
                ctx.fill();
            }
            // Add stored shine spots
            ctx.fillStyle = '#5c412c';
            for (let shine of mud.shineSpots){
                let spotX = mud.x + Math.cos(shine.angle) * shine.dist;
                let spotY = mud.y + Math.sin(shine.angle) * shine.dist;
                ctx.beginPath();
                ctx.arc(spotX, spotY, mud.size / 8, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        // Draw the dot with current color
        ctx.fillStyle = dotColor;
        ctx.beginPath();
        ctx.arc(dotX, dotY, dotSize / 2, 0, Math.PI * 2);
        ctx.fill();
        // Draw chasers
        ctx.fillStyle = 'green';
        for (let chaser of chasers)ctx.fillRect(chaser.x - chaser.size / 2, chaser.y - chaser.size / 2, chaser.size, chaser.size);
        // Draw collectible keys on top
        for (let item of collectibles)drawKey(item.x, item.y, item.size);
        // Draw hearts for lives in top-left
        ctx.textAlign = 'left';
        for(let i = 0; i < 3; i++){
            let heartX = 20 + i * 35;
            let heartY = 40;
            if (i < lives) {
                ctx.fillStyle = 'yellow';
                ctx.fillText("\u2665", heartX, heartY);
            } else {
                ctx.strokeStyle = 'yellow';
                ctx.strokeText("\u2665", heartX, heartY);
            }
        }
        // Draw score
        ctx.fillStyle = 'white';
        ctx.font = '30px monospace';
        ctx.textAlign = 'right';
        ctx.fillText(`Score: ${score}`, canvas.width - 20, 40);
        // Draw speed crates with lightning bolt
        for (let crate of speedCrates){
            // Wooden crate appearance
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(crate.x - CRATE_SIZE / 2, crate.y - CRATE_SIZE / 2, CRATE_SIZE, CRATE_SIZE);
            // Add wood grain effect
            ctx.strokeStyle = '#654321';
            ctx.lineWidth = 2;
            for(let i = -2; i <= 2; i++){
                ctx.beginPath();
                ctx.moveTo(crate.x - CRATE_SIZE / 2, crate.y + i * 5);
                ctx.lineTo(crate.x + CRATE_SIZE / 2, crate.y + i * 5);
                ctx.stroke();
            }
            // Vertical edges
            ctx.beginPath();
            ctx.moveTo(crate.x - CRATE_SIZE / 2, crate.y - CRATE_SIZE / 2);
            ctx.lineTo(crate.x - CRATE_SIZE / 2, crate.y + CRATE_SIZE / 2);
            ctx.moveTo(crate.x + CRATE_SIZE / 2, crate.y - CRATE_SIZE / 2);
            ctx.lineTo(crate.x + CRATE_SIZE / 2, crate.y + CRATE_SIZE / 2);
            ctx.stroke();
            // Add blue lightning bolt
            ctx.strokeStyle = '#00BFFF'; // Deep sky blue
            ctx.lineWidth = 3;
            ctx.beginPath();
            // Start at top
            ctx.moveTo(crate.x, crate.y - CRATE_SIZE / 3);
            // Zigzag down
            ctx.lineTo(crate.x + CRATE_SIZE / 4, crate.y);
            ctx.lineTo(crate.x - CRATE_SIZE / 4, crate.y);
            ctx.lineTo(crate.x, crate.y + CRATE_SIZE / 3);
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
    }
    function renderStartScreen() {
        ctx.fillStyle = '#000033';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        for (let star of stars){
            ctx.fillStyle = 'yellow';
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.fillStyle = 'white';
        ctx.font = '50px monospace';
        ctx.textAlign = 'center';
        ctx.fillText("PRESS SPACE TO START", canvas.width / 2, canvas.height / 2);
    }
    initializeStars();
    gameLoop();
    // Update mud spawning with occasional huge patches
    setInterval(()=>{
        if (gameState === "playing") {
            let numToSpawn = Math.floor(Math.random() * 5) + 1;
            for(let i = 0; i < numToSpawn; i++){
                // 10% chance for huge mud patch
                let mudSize = Math.random() < 0.1 ? canvas.width / 4 : Math.random() * 30 + 30; // Normal mud
                let spots = [];
                for(let j = 0; j < 5; j++)spots.push({
                    angle: Math.random() * Math.PI * 2,
                    dist: Math.random() * (mudSize / 4),
                    size: mudSize / 3 + Math.random() * (mudSize / 4)
                });
                let shineSpots = [];
                for(let j = 0; j < 3; j++)shineSpots.push({
                    angle: Math.random() * Math.PI * 2,
                    dist: Math.random() * (mudSize / 5)
                });
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
    const keySpawnInterval = setInterval(()=>{
        if (gameState === "playing") {
            let numToSpawn = Math.floor(Math.random() * 5) + 1;
            for(let i = 0; i < numToSpawn; i++)collectibles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                size: 15
            });
        }
    }, 30000);
    const keyRemovalInterval = setInterval(()=>{
        if (gameState === "playing" && collectibles.length > 0) {
            let numToRemove = Math.floor(Math.random() * 11);
            for(let i = 0; i < numToRemove; i++)if (collectibles.length > 0) {
                const index = Math.floor(Math.random() * collectibles.length);
                collectibles.splice(index, 1);
            }
        }
    }, 60000);
    // Spawn speed crates every 60 seconds (1-2 crates)
    setInterval(()=>{
        if (gameState === "playing") {
            let numToSpawn = Math.floor(Math.random() * 2) + 1;
            for(let i = 0; i < numToSpawn; i++)speedCrates.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height
            });
        }
    }, 60000);
    // Remove speed crates every 40 seconds (0-1 crates)
    setInterval(()=>{
        if (gameState === "playing" && speedCrates.length > 0) {
            if (Math.random() < 0.5) {
                const index = Math.floor(Math.random() * speedCrates.length);
                speedCrates.splice(index, 1);
            }
        }
    }, 40000);
    // Add helper function if not already present
    function distanceBetween(x1, y1, x2, y2) {
        const dx = x1 - x2;
        const dy = y1 - y2;
        return Math.sqrt(dx * dx + dy * dy);
    }
})();

//# sourceMappingURL=index.de158e3a.js.map
