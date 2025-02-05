// Rendering functions
const createRenderer = (ctx, canvas) => {
  const drawDot = (x, y, color = 'yellow', size = 10) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  };

  const drawChasers = (chasers) => {
    chasers.forEach(chaser => {
      // Draw slime body
      ctx.fillStyle = 'green';
      ctx.fillRect(
        chaser.x - chaser.size / 2,
        chaser.y - chaser.size / 2,
        chaser.size,
        chaser.size
      );

      // Draw eyes
      ctx.fillStyle = 'white';
      const eyeSize = chaser.size / 6;
      ctx.beginPath();
      ctx.arc(chaser.x - eyeSize, chaser.y - eyeSize, eyeSize, 0, Math.PI * 2);
      ctx.arc(chaser.x + eyeSize, chaser.y - eyeSize, eyeSize, 0, Math.PI * 2);
      ctx.fill();
    });
  };

  const drawCollectibles = (collectibles) => {
    collectibles.forEach(key => {
      // Draw key
      ctx.fillStyle = 'gold';
      ctx.beginPath();
      ctx.arc(key.x, key.y, key.size, 0, Math.PI * 2);
      ctx.fill();
      
      // Add shine effect
      ctx.fillStyle = 'white';
      ctx.beginPath();
      ctx.arc(key.x - key.size/3, key.y - key.size/3, key.size/4, 0, Math.PI * 2);
      ctx.fill();
    });
  };

  const drawMudPatches = (mudPatches) => {
    mudPatches.forEach(mud => {
      // Base mud circle
      ctx.fillStyle = '#4a3728';
      ctx.beginPath();
      ctx.arc(mud.x, mud.y, mud.size/2, 0, Math.PI * 2);
      ctx.fill();

      // Mud texture spots
      mud.spots.forEach(spot => {
        ctx.fillStyle = '#362a1e';
        ctx.beginPath();
        const spotX = mud.x + Math.cos(spot.angle) * spot.dist;
        const spotY = mud.y + Math.sin(spot.angle) * spot.dist;
        ctx.arc(spotX, spotY, spot.size, 0, Math.PI * 2);
        ctx.fill();
      });
    });
  };

  const drawSpeedCrates = (speedCrates) => {
    speedCrates.forEach(crate => {
      // Wooden crate
      ctx.fillStyle = '#8B4513';
      ctx.fillRect(crate.x - 12.5, crate.y - 12.5, 25, 25);
      
      // Lightning bolt
      ctx.strokeStyle = '#00BFFF';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(crate.x, crate.y - 8);
      ctx.lineTo(crate.x + 6, crate.y);
      ctx.lineTo(crate.x - 6, crate.y);
      ctx.lineTo(crate.x, crate.y + 8);
      ctx.stroke();
    });
  };

  const drawUI = (score, lives) => {
    // Score
    ctx.fillStyle = 'white';
    ctx.font = '24px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${score}`, 20, 30);

    // Lives
    for (let i = 0; i < lives; i++) {
      ctx.fillStyle = 'yellow';
      ctx.beginPath();
      ctx.arc(20 + i * 30, 60, 10, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  const drawGameOver = (highScore) => {
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = 'red';
    ctx.font = '80px monospace';
    ctx.textAlign = 'center';
    ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2);
    
    ctx.fillStyle = 'white';
    ctx.font = '40px monospace';
    ctx.fillText(`High Score: ${highScore}`, canvas.width / 2, canvas.height / 2 + 80);
  };

  const renderGame = (gameState) => {
    const { dotX, dotY, dotColor, chasers, collectibles, mudPatches, speedCrates, score, lives } = gameState;
    
    // Clear canvas
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw game elements
    drawMudPatches(mudPatches);
    drawSpeedCrates(speedCrates);
    drawCollectibles(collectibles);
    drawChasers(chasers);
    drawDot(dotX, dotY, dotColor);
    drawUI(score, lives);
  };

  const renderGameOver = async (score) => {
    try {
      const response = await fetch("http://localhost:3000/api/highscore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ game: "escapae", score })
      });
      const data = await response.json();
      drawGameOver(data.highScore);
    } catch (error) {
      console.error("Error updating high score:", error);
      drawGameOver(score);
    }
  };

  return {
    renderGame,
    renderGameOver
  };
};

export default createRenderer; 