/**
 * Sound Effects for Happy Loto
 * Uses Web Audio API to generate game sounds programmatically
 * No external files needed - all sounds are synthesized
 */

// Singleton AudioContext
let audioCtx = null;

function getAudioContext() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    // Resume if suspended (browser autoplay policy)
    if (audioCtx.state === "suspended") {
        audioCtx.resume();
    }
    return audioCtx;
}

/**
 * Play a short beep/tone
 */
function playTone(freq, duration, type = "sine", volume = 0.3) {
    try {
        const ctx = getAudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime);

        gain.gain.setValueAtTime(volume, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + duration);
    } catch (e) {
        // Silently fail if audio is not available
    }
}

/**
 * Game Start - ascending cheerful tones
 */
export function playGameStart() {
    const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
        setTimeout(() => playTone(freq, 0.3, "sine", 0.25), i * 120);
    });
}

/**
 * Number Called - a short "ding" notification
 */
export function playNumberCalled() {
    playTone(880, 0.15, "sine", 0.2);
    setTimeout(() => playTone(1100, 0.12, "sine", 0.15), 80);
}

/**
 * Number Tap/Select - soft click feedback
 */
export function playNumberTap() {
    playTone(600, 0.06, "square", 0.08);
}

/**
 * Win / KINH - triumphant fanfare
 */
export function playWinSound() {
    const fanfare = [
        { freq: 523, delay: 0 },     // C5
        { freq: 659, delay: 100 },   // E5
        { freq: 784, delay: 200 },   // G5
        { freq: 1047, delay: 350 },  // C6
        { freq: 1175, delay: 450 },  // D6
        { freq: 1319, delay: 550 },  // E6
        { freq: 1568, delay: 700 },  // G6
    ];
    fanfare.forEach(({ freq, delay }) => {
        setTimeout(() => playTone(freq, 0.4, "sine", 0.2), delay);
    });
}

/**
 * Fail / False alarm - descending "wah wah"
 */
export function playFailSound() {
    const notes = [440, 415, 370, 330]; // A4 descending
    notes.forEach((freq, i) => {
        setTimeout(() => playTone(freq, 0.35, "sawtooth", 0.1), i * 250);
    });
}

/**
 * Game Paused - low soft tone
 */
export function playPauseSound() {
    playTone(330, 0.3, "sine", 0.15);
}

/**
 * Game Resumed - upward tone
 */
export function playResumeSound() {
    playTone(440, 0.15, "sine", 0.15);
    setTimeout(() => playTone(554, 0.15, "sine", 0.15), 100);
}

/**
 * Game Reset / New game - short reset sound
 */
export function playResetSound() {
    playTone(659, 0.12, "sine", 0.15);
    setTimeout(() => playTone(523, 0.2, "sine", 0.15), 100);
}

/**
 * Verification Start - suspenseful rising tone
 */
export function playVerificationStart() {
    playTone(400, 0.5, "sine", 0.12);
    setTimeout(() => playTone(500, 0.5, "sine", 0.12), 200);
    setTimeout(() => playTone(600, 0.5, "sine", 0.12), 400);
}

/**
 * Someone else wins - short celebration
 */
export function playOtherWin() {
    const notes = [523, 659, 784]; // C5, E5, G5
    notes.forEach((freq, i) => {
        setTimeout(() => playTone(freq, 0.25, "sine", 0.15), i * 100);
    });
}

/**
 * Initialize audio context on first user interaction
 * Call this early to ensure sounds work
 */
export function initAudio() {
    try {
        getAudioContext();
    } catch (e) {
        // Audio not available
    }
}
