// Audio management functions
const createAudioSystem = () => {
  const soundEffects = {
    slip: new Audio("/mc-games/escapae/assets/audio/cartoon-yoink-1-183915.mp3"),
    wood: new Audio("/mc-games/escapae/assets/audio/wood-break-small-2-45921.mp3"),
    hurt: new Audio("/mc-games/escapae/assets/audio/oof-sound-effect-147492.mp3"),
    key: new Audio("/mc-games/escapae/assets/audio/metal-clang-284809.mp3")
  };

  let backgroundMusic = null;
  let sfxVolume = 0.5;

  const playSound = (soundName) => {
    if (soundEffects[soundName]) {
      soundEffects[soundName].currentTime = 0;
      soundEffects[soundName].volume = sfxVolume;
      soundEffects[soundName].play().catch(error => {
        console.error(`Failed to play ${soundName} sound:`, error);
      });
    }
  };

  const startBackgroundMusic = () => {
    if (!backgroundMusic) {
      backgroundMusic = new Audio("/mc-games/escapae/assets/audio/myBackgroundTrack.mp3");
      backgroundMusic.loop = true;
      const volumeSlider = document.getElementById('volumeSlider');
      backgroundMusic.volume = volumeSlider ? volumeSlider.value : 0.5;
      window.backgroundMusic = backgroundMusic;
    }
    backgroundMusic.play().catch(error => console.error("Error playing background music:", error));
  };

  const stopBackgroundMusic = () => {
    if (backgroundMusic) {
      backgroundMusic.pause();
      backgroundMusic.currentTime = 0;
    }
  };

  const setSfxVolume = (volume) => {
    sfxVolume = volume;
  };

  return {
    playSound,
    startBackgroundMusic,
    stopBackgroundMusic,
    setSfxVolume
  };
};

export default createAudioSystem; 