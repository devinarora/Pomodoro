const CIRCUMFERENCE = 2 * Math.PI * 90;
const STORAGE_KEY = 'pomodoro-settings';

let catchTimeoutId = null;
let pixelVisualReady = false;

const state = {
    workMinutes: 25,
    breakMinutes: 5,
    volume: 0.7,
    autoStart: true,
    visual: 'ring',
    theme: null,
    currentMode: 'work',
    remainingSeconds: 25 * 60,
    totalSeconds: 25 * 60,
    isRunning: false,
    endTimestamp: null,
    audioContext: null,
    intervalId: null,
};

const elements = {
    container: document.querySelector('.container'),
    timerText: document.getElementById('timer-text'),
    timerStatus: document.getElementById('timer-status'),
    timerProgress: document.querySelector('.timer-progress'),
    pixelCanvas: document.getElementById('pixel-canvas'),
    startBtn: document.getElementById('start-btn'),
    themeToggle: document.getElementById('theme-toggle'),
    pauseBtn: document.getElementById('pause-btn'),
    resetBtn: document.getElementById('reset-btn'),
    workDuration: document.getElementById('work-duration'),
    breakDuration: document.getElementById('break-duration'),
    volume: document.getElementById('volume'),
    volumeValue: document.getElementById('volume-value'),
    autoStart: document.getElementById('auto-start'),
    visual: document.getElementById('visual'),
};

function loadSettings() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            const settings = JSON.parse(saved);
            state.workMinutes = settings.workMinutes || 25;
            state.breakMinutes = settings.breakMinutes || 5;
            state.volume = settings.volume !== undefined ? settings.volume : 0.7;
            state.autoStart = settings.autoStart !== undefined ? settings.autoStart : true;
            state.theme = settings.theme || null;
            state.visual = settings.visual || 'ring';

            elements.workDuration.value = state.workMinutes;
            elements.breakDuration.value = state.breakMinutes;
            elements.volume.value = Math.round(state.volume * 100);
            elements.volumeValue.textContent = Math.round(state.volume * 100) + '%';
            elements.autoStart.checked = state.autoStart;
            elements.visual.value = state.visual;
        }
    } catch (error) {
        console.warn('Failed to load settings:', error);
    }
    state.theme = state.theme || getDefaultTheme();
    applyTheme(state.theme);
    applyVisual();
}

function saveSettings() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            workMinutes: state.workMinutes,
            breakMinutes: state.breakMinutes,
            volume: state.volume,
            autoStart: state.autoStart,
            visual: state.visual,
            theme: state.theme,
        }));
    } catch (error) {
        console.warn('Failed to save settings:', error);
    }
}

function getDefaultTheme() {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme) {
    if (theme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        elements.themeToggle.textContent = '🌙';
    } else {
        document.documentElement.removeAttribute('data-theme');
        elements.themeToggle.textContent = '☀️';
    }
}

function handleThemeToggle() {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    applyTheme(state.theme);
    saveSettings();
}

function applyVisual() {
    if (!elements.visual) return;
    elements.visual.value = state.visual;
    elements.container.classList.toggle('fisher', state.visual === 'fisher');

    if (state.visual === 'fisher') {
        if (!pixelVisualReady) {
            PixelVisual.init(elements.pixelCanvas);
            pixelVisualReady = true;
        }
        syncFisherPhase();
    } else if (catchTimeoutId) {
        clearTimeout(catchTimeoutId);
        catchTimeoutId = null;
    }
}

function handleVisualChange() {
    state.visual = elements.visual.value;
    saveSettings();
    applyVisual();
}

function syncFisherPhase() {
    if (state.visual !== 'fisher') return;
    if (!state.isRunning) {
        PixelVisual.setPhase('idle');
    } else {
        PixelVisual.setPhase(state.currentMode === 'work' ? 'fishing' : 'relaxing');
    }
}

function showFisherCatch() {
    if (state.visual !== 'fisher') return;
    if (catchTimeoutId) {
        clearTimeout(catchTimeoutId);
    }
    PixelVisual.setPhase('caught');
    catchTimeoutId = setTimeout(() => {
        catchTimeoutId = null;
        syncFisherPhase();
    }, 2500);
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');
}

function updateTimerDisplay() {
    elements.timerText.textContent = formatTime(state.remainingSeconds);
    const modeLabel = state.currentMode === 'work' ? 'Work' : 'Break';
    elements.timerStatus.textContent = modeLabel;
    elements.timerProgress.classList.toggle('break-mode', state.currentMode === 'break');

    const totalSeconds = state.totalSeconds;
    const progress = totalSeconds > 0 ? state.remainingSeconds / totalSeconds : 0;
    const offset = CIRCUMFERENCE * (1 - progress);
    elements.timerProgress.style.strokeDasharray = CIRCUMFERENCE;
    elements.timerProgress.style.strokeDashoffset = offset;
}

function setMode(mode) {
    state.currentMode = mode;
    const minutes = mode === 'work' ? state.workMinutes : state.breakMinutes;
    state.remainingSeconds = minutes * 60;
    state.totalSeconds = minutes * 60;
    updateTimerDisplay();
}

function advanceMode() {
    stopTick();
    const finishedWork = state.currentMode === 'work';
    setMode(state.currentMode === 'work' ? 'break' : 'work');
    playAlarm();

    if (state.autoStart) {
        startTick();
    } else {
        state.isRunning = false;
        state.endTimestamp = null;
        updateButtons();
    }

    if (finishedWork) {
        showFisherCatch();
    } else {
        syncFisherPhase();
    }
}

function primeAudio() {
    if (!state.audioContext) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        state.audioContext = new AudioCtx();
    }
    if (state.audioContext.state === 'suspended') {
        state.audioContext.resume();
    }
}

function playAlarm() {
    if (state.volume <= 0) return;

    try {
        primeAudio();

        const ctx = state.audioContext;
        const now = ctx.currentTime;
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(880, now);
        oscillator.frequency.exponentialRampToValueAtTime(440, now + 0.25);
        oscillator.frequency.exponentialRampToValueAtTime(880, now + 0.5);

        gainNode.gain.setValueAtTime(state.volume, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.9);

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.start(now);
        oscillator.stop(now + 3);

        oscillator.onended = () => {
            oscillator.disconnect();
            gainNode.disconnect();
        };
    } catch (error) {
        console.error('Failed to play alarm:', error);
    }
}

function tick() {
    if (!state.isRunning) return;

    const now = Date.now();
    const remaining = Math.max(0, Math.ceil((state.endTimestamp - now) / 1000));

    state.remainingSeconds = remaining;

    if (remaining <= 0) {
        advanceMode();
        return;
    }

    updateTimerDisplay();
}

function startTick() {
    if (state.intervalId) {
        clearInterval(state.intervalId);
    }
    state.endTimestamp = Date.now() + state.remainingSeconds * 1000;
    state.isRunning = true;
    state.intervalId = setInterval(tick, 100);
    updateButtons();
    syncFisherPhase();
}

function stopTick() {
    if (state.intervalId) {
        clearInterval(state.intervalId);
        state.intervalId = null;
    }
}

function startTimer() {
    startTick();
}

function pauseTimer() {
    stopTick();
    state.isRunning = false;
    updateButtons();
    syncFisherPhase();
}

function resetTimer() {
    stopTick();
    state.isRunning = false;
    state.endTimestamp = null;
    setMode(state.currentMode);
    updateButtons();
    syncFisherPhase();
}

function updateButtons() {
    elements.startBtn.disabled = state.isRunning;
    elements.pauseBtn.disabled = !state.isRunning;
}

function handleStart() {
    primeAudio();
    if (state.remainingSeconds <= 0) {
        setMode('work');
    }
    startTimer();
}

function handleDurationChange(event) {
    const minInput = parseInt(event.target.value, 10);
    const maxValue = event.target.id === 'work-duration' ? 120 : 60;
    if (minInput < 1 || minInput > maxValue) {
        return;
    }
    state.workMinutes = parseInt(elements.workDuration.value, 10) || 25;
    state.breakMinutes = parseInt(elements.breakDuration.value, 10) || 5;
    saveSettings();
}

function handleVolumeChange(event) {
    const volume = parseInt(event.target.value, 10) / 100;
    state.volume = volume;
    elements.volumeValue.textContent = event.target.value + '%';
    saveSettings();
}

function handleAutoStartChange() {
    state.autoStart = elements.autoStart.checked;
    saveSettings();
}

function init() {
    loadSettings();
    setMode('work');
    updateButtons();

    elements.startBtn.addEventListener('click', handleStart);
    elements.themeToggle.addEventListener('click', handleThemeToggle);
    elements.pauseBtn.addEventListener('click', pauseTimer);
    elements.resetBtn.addEventListener('click', resetTimer);
    elements.workDuration.addEventListener('change', handleDurationChange);
    elements.breakDuration.addEventListener('change', handleDurationChange);
    elements.volume.addEventListener('input', handleVolumeChange);
    elements.autoStart.addEventListener('change', handleAutoStartChange);
    elements.visual.addEventListener('change', handleVisualChange);

    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js').catch((error) => {
            console.warn('Service worker registration failed:', error);
        });
    }
}

document.addEventListener('DOMContentLoaded', init);