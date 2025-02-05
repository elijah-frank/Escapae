// Menu control handlers
const zoomSlider = document.getElementById('zoomSlider');
const zoomValue = document.getElementById('zoomValue');

console.log('Menu controls initializing...');

// Start button handler
const startBtn = document.getElementById('startBtn');
if (startBtn) {
  console.log('Start button found');
  startBtn.addEventListener('click', () => {
    console.log('Start button clicked');
    if (window.startGame) {
      window.startGame();
    } else {
      console.log('startGame function not found on window');
    }
  });
} else {
  console.log('Start button not found');
}

// Set initial zoom based on screen size
if (window.innerWidth <= 480) {
  zoomSlider.value = 45;
} else if (window.innerWidth <= 768) {
  zoomSlider.value = 65;
} else {
  zoomSlider.value = 100;
}

zoomSlider.addEventListener('input', function() {
  const scale = this.value / 100;
  document.documentElement.style.setProperty('--game-scale', scale);
  zoomValue.textContent = this.value + '%';
});

document.getElementById('brightnessSlider').addEventListener('input', function() {
  const brightness = this.value;
  document.getElementById("gameCanvas").style.filter = "brightness(" + brightness + "%)";
});

document.getElementById('volumeSlider').addEventListener('input', function() {
  if (window.backgroundMusic) {
    window.backgroundMusic.volume = this.value;
  }
});

document.getElementById('sfxSlider').addEventListener('input', function() {
  window.setSfxVolume(this.value);
});

document.getElementById('controlsBtn').addEventListener('click', () => {
  document.getElementById('settingsMenu').style.display = "none";
  document.getElementById('controlsMenu').style.display = "flex";
});

document.getElementById('backBtn').addEventListener('click', () => {
  document.getElementById('controlsMenu').style.display = "none";
  document.getElementById('settingsMenu').style.display = "flex";
});

// These functions are exposed by main.js
document.getElementById('resumeBtn').addEventListener('click', () => {
  window.togglePause();
});

document.getElementById('restartBtn').addEventListener('click', () => {
  location.reload();
});

document.getElementById('pauseButton').addEventListener('click', () => {
  window.togglePause();
}); 