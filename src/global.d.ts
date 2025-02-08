interface Window {
    backgroundMusic: HTMLAudioElement;
    togglePause: () => void;
    setSfxVolume: (val: number) => void;
}

declare global {
    interface Window {
        backgroundMusic: HTMLAudioElement;
        togglePause: () => void;
        setSfxVolume: (val: number) => void;
    }
} 