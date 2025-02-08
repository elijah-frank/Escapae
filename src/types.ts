interface Star {
  x: number;
  y: number;
  radius: number;
}

interface Chaser {
  x: number;
  y: number;
  size: number;
  speed: number;
  aiType: number;
  assignedSide?: string;
  targetKey?: Collectible;
  cornerTarget?: { x: number; y: number };
  cornerDuration?: number;
  nextJobRoll?: number;
  randomTarget?: { x: number; y: number };
}

interface Collectible {
  x: number;
  y: number;
  size: number;
}

interface SpeedCrate {
  x: number;
  y: number;
}

interface MudSpot {
  angle: number;
  dist: number;
  size: number;
}

interface ShineSpot {
  angle: number;
  dist: number;
}

interface MudPatch {
  x: number;
  y: number;
  size: number;
  spots: MudSpot[];
  shineSpots: ShineSpot[];
}

interface AudioManager {
  audioContext: AudioContext;
  backgroundMusic: HTMLAudioElement | null;
  audioContextUnlocked: boolean;
  sfxVolume: number;
  soundEffects: {
    slip: HTMLAudioElement | null;
    wood: HTMLAudioElement | null;
    hurt: HTMLAudioElement | null;
    key: HTMLAudioElement | null;
  };
  startBackgroundMusic: () => void;
  playSlipSound: () => void;
  playWoodCrackleSound: () => void;
  playHurtSound: () => void;
  playKeyPickupSound: () => void;
  startMP3Background: () => void;
  stopBackgroundMusic: () => void;
}

export type {
    AudioManager, Chaser,
    Collectible, MudPatch, MudSpot,
    ShineSpot, SpeedCrate, Star
};
