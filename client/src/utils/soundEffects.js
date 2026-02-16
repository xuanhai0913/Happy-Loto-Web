/**
 * Sound Effects for Happy Loto
 * Uses pre-downloaded MP3 files for reliable playback on mobile
 */

// Pre-load audio elements for instant playback
const sounds = {};
const SOUND_FILES = {
    gameStart: "/audio/sfx/game_start.mp3",
    numberCalled: "/audio/sfx/number_called.mp3",
    tap: "/audio/sfx/click-button.mp3",
    win: "/audio/sfx/win.mp3",
    fail: "/audio/sfx/fail.mp3",
    click: "/audio/sfx/click-button.mp3",
};

// Pre-load all sounds
function preloadSounds() {
    Object.entries(SOUND_FILES).forEach(([key, src]) => {
        const audio = new Audio(src);
        audio.preload = "auto";
        audio.volume = key === "tap" || key === "click" ? 0.4 : 0.5;
        sounds[key] = audio;
    });
}

// Play a sound by key
function playSound(key) {
    try {
        const audio = sounds[key];
        if (!audio) return;
        // Clone for overlapping plays
        if (!audio.paused) {
            const clone = audio.cloneNode();
            clone.volume = audio.volume;
            clone.play().catch(() => { });
            return;
        }
        audio.currentTime = 0;
        audio.play().catch(() => { });
    } catch (e) {
        // Silently fail
    }
}

// Initialize on import
preloadSounds();

/** Game Start - ascending fanfare */
export function playGameStart() {
    playSound("gameStart");
}

/** Number Called - ding notification */
export function playNumberCalled() {
    playSound("numberCalled");
}

/** Number Tap on ticket - click */
export function playNumberTap() {
    playSound("tap");
}

/** Win / KINH! */
export function playWinSound() {
    playSound("win");
}

/** Fail / False alarm */
export function playFailSound() {
    playSound("fail");
}

/** Button click */
export function playClick() {
    playSound("click");
}

/** Pause - reuse click */
export function playPauseSound() {
    playSound("click");
}

/** Resume - reuse click */
export function playResumeSound() {
    playSound("click");
}

/** Reset / New game - reuse click */
export function playResetSound() {
    playSound("click");
}

/** Verification start - reuse numberCalled */
export function playVerificationStart() {
    playSound("numberCalled");
}

/** Other player wins - reuse gameStart */
export function playOtherWin() {
    playSound("gameStart");
}

/** Initialize audio context (call on first user tap) */
export function initAudio() {
    preloadSounds();
}
