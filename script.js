// State Management
let timeLeft = 10; // TEST MODE: 10 SECONDS
let timerId = null;
let isFocusSession = true;
let missionCount = 1;
let weeklyStats = [0, 0, 0, 0, 0, 0, 0]; // Mon to Sun

// DOM Elements
const timerDisplay = document.getElementById('timer-display');
const fuelFill = document.getElementById('fuel-fill');
const sessionStatus = document.getElementById('session-status');
const missionNameInput = document.getElementById('mission-name');
const startBtn = document.getElementById('start-btn');
const startText = document.getElementById('start-text');
const resetBtn = document.getElementById('reset-btn');
const pauseBtn = document.getElementById('pause-btn');
const kodariQuote = document.getElementById('kodari-quote');
const rocketWrapper = document.getElementById('rocket-wrapper');
const leafWrapper = document.getElementById('leaf-wrapper');
const starsContainer = document.getElementById('stars');
const resetStatsBtn = document.getElementById('reset-stats');

// Constants
const FOCUS_TIME = 25 * 60;
const BREAK_TIME = 5 * 60;

const quotes = {
    focus: [
        "지금 이 몰입이 당신의 위대한 미래를 만듭니다! 충성!",
        "목표 수익과 성공이 코앞입니다! 이 기세를 유지하세요!",
        "오늘의 집중력이 내일의 결과물을 결정합니다. 계속 가시죠!",
        "지금 로켓 연료가 아주 뜨겁게 타오르고 있습니다. 최고십니다!",
        "성공은 멈추지 않는 자의 것입니다. 당신의 열정을 응원합니다!",
        "AI와 함께라면 당신은 무엇이든 해낼 수 있습니다. 파이팅!",
        "당신의 꿈을 향한 비행, 코다리 관제탑이 완벽하게 지원합니다!"
    ],
    break: [
        "로켓도 엔진을 식혀야 더 높이 날 수 있습니다. 잠시 쉬어 가세요. 🍵",
        "지금은 차 한 잔의 여유를 즐기실 시간입니다. 숨을 크게 들이마셔 보세요.",
        "마음을 비우고 다음 도약을 위한 에너지를 충전하십시오. ✨",
        "5분간의 꿀맛 같은 휴식! 뇌에도 신선한 산소를 공급해 주세요.",
        "잠시 눈을 감고 당신이 이뤄낼 멋진 미래를 상상해 보세요. 😊",
        "충성! 휴식도 업무의 연장입니다. 확실하게 쉬어주십시오!",
        "가벼운 스트레칭 어떠신가요? 몸이 유연해야 생각도 유연해집니다."
    ]
};

// Initialization
function init() {
    createStars();
    loadStats();
    updateDisplay();
    updateChart();
    requestNotificationPermission();
    registerServiceWorker();
}

function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js')
            .then(() => console.log('Service Worker Registered'));
    }
}

function loadStats() {
    const saved = localStorage.getItem('kodariWeeklyStats');
    if (saved) {
        weeklyStats = JSON.parse(saved);
    } else {
        // Dummy data for first look
        weeklyStats = [45, 120, 60, 90, 0, 0, 0];
        saveStats();
    }
}

function saveStats() {
    localStorage.setItem('kodariWeeklyStats', JSON.stringify(weeklyStats));
}

function updateChart() {
    const bars = document.querySelectorAll('.bar-fill');
    const maxVal = Math.max(...weeklyStats, 60); // Min scale of 60 mins
    
    weeklyStats.forEach((mins, i) => {
        const height = (mins / maxVal) * 100;
        bars[i].style.height = `${height}%`;
        bars[i].title = `${mins}분 집중 완료!`;
    });
}

function recordFocus(minutes) {
    const now = new Date();
    // getDay() returns 0 for Sunday, 1 for Monday, etc.
    // Convert to: 0 for Monday, 6 for Sunday
    let dayIndex = now.getDay() - 1;
    if (dayIndex === -1) dayIndex = 6; 

    weeklyStats[dayIndex] += minutes;
    saveStats();
    updateChart();
}

function requestNotificationPermission() {
    if ("Notification" in window) {
        Notification.requestPermission();
    }
}

function playLaunchSound() {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    
    // 1. Deep Rumble (Brown Noise)
    const bufferSize = 2 * audioCtx.sampleRate;
    const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        output[i] = (lastOut + (0.02 * white)) / 1.02;
        lastOut = output[i];
        output[i] *= 3.5; // Gain
    }
    
    const noise = audioCtx.createBufferSource();
    noise.buffer = noiseBuffer;
    
    const noiseFilter = audioCtx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.setValueAtTime(100, audioCtx.currentTime);
    noiseFilter.frequency.exponentialRampToValueAtTime(1000, audioCtx.currentTime + 4);
    
    const noiseGain = audioCtx.createGain();
    noiseGain.gain.setValueAtTime(0, audioCtx.currentTime);
    noiseGain.gain.linearRampToValueAtTime(0.5, audioCtx.currentTime + 1);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 8);
    
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(audioCtx.destination);
    
    // 2. Rising Whistle (Sine)
    const osc = audioCtx.createOscillator();
    const oscGain = audioCtx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(40, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, audioCtx.currentTime + 6);
    
    oscGain.gain.setValueAtTime(0, audioCtx.currentTime);
    oscGain.gain.linearRampToValueAtTime(0.1, audioCtx.currentTime + 2);
    oscGain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 8);
    
    osc.connect(oscGain);
    oscGain.connect(audioCtx.destination);
    
    noise.start();
    osc.start();
    noise.stop(audioCtx.currentTime + 5); 
    osc.stop(audioCtx.currentTime + 5);
}

function sendNotification(message) {
    if ("Notification" in window && Notification.permission === "granted") {
        new Notification("🚀 코다리 관제탑", {
            body: message,
            icon: "success_rocket.png"
        });
    }
}

function createStars() {
    for (let i = 0; i < 50; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        star.style.width = star.style.height = Math.random() * 3 + 'px';
        star.style.top = Math.random() * 100 + '%';
        star.style.left = Math.random() * 100 + '%';
        star.style.setProperty('--duration', (Math.random() * 3 + 2) + 's');
        starsContainer.appendChild(star);
    }
}

function updateDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    timerDisplay.textContent = timeString;
    
    // Update Tab Title
    const status = isFocusSession ? "집중" : "휴식";
    document.title = `[${timeString}] ${status} - 코다리 타이머`;
    
    // Update Fuel Level
    const totalTime = isFocusSession ? FOCUS_TIME : BREAK_TIME;
    const fuelPercentage = ((totalTime - timeLeft) / totalTime) * 100;
    fuelFill.style.width = `${fuelPercentage}%`;

    // Vibration Intensity
    if (timerId && isFocusSession) {
        if (fuelPercentage > 90) {
            rocketWrapper.className = 'rocket-wrapper vibrate';
            rocketWrapper.style.animationDuration = '0.05s';
        } else if (fuelPercentage > 50) {
            rocketWrapper.className = 'rocket-wrapper vibrate';
            rocketWrapper.style.animationDuration = '0.15s';
        } else {
            rocketWrapper.className = 'rocket-wrapper';
        }
    } else {
        rocketWrapper.className = 'rocket-wrapper';
    }

    // Update Status
    if (isFocusSession) {
        sessionStatus.textContent = fuelPercentage < 100 ? 'GATHERING FUEL...' : 'READY FOR LAUNCH!';
        sessionStatus.style.color = '#fbbf24';
        rocketWrapper.classList.remove('hidden');
        leafWrapper.classList.add('hidden');
    } else {
        sessionStatus.textContent = 'RESTING IN ORBIT...';
        sessionStatus.style.color = '#10b981';
        rocketWrapper.classList.add('hidden');
        leafWrapper.classList.remove('hidden');
    }
}

function startTimer() {
    if (timerId) return;
    
    startBtn.classList.add('hidden');
    pauseBtn.classList.remove('hidden');
    resetBtn.classList.remove('hidden'); // Show abort button when running
    
    timerId = setInterval(() => {
        if (timeLeft > 0) {
            timeLeft--;
            updateDisplay();
            
            // Periodically change quote
            if (timeLeft % 300 === 0) {
                const list = isFocusSession ? quotes.focus : quotes.break;
                kodariQuote.textContent = `"${list[Math.floor(Math.random() * list.length)]}"`;
            }
        } else {
            handleTimerComplete();
        }
    }, 1000);

    const list = isFocusSession ? quotes.focus : quotes.break;
    kodariQuote.textContent = `"${list[Math.floor(Math.random() * list.length)]}"`;
}

function playBreakEndSound() {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    
    // Create a gentle chime using multiple oscillators (harmonics)
    const frequencies = [440, 880, 1320]; // A4 and its harmonics
    frequencies.forEach((freq, index) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        
        gain.gain.setValueAtTime(0, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.05 / (index + 1), audioCtx.currentTime + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 2);
        
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        
        osc.start();
        osc.stop(audioCtx.currentTime + 2);
    });
}

function handleTimerComplete() {
    clearInterval(timerId);
    timerId = null;

    if (isFocusSession) {
        playLaunchSound(); // START SOUND IMMEDIATELY
        
        kodariQuote.textContent = '"임무 성공! 로켓 발사!! 대표님 최고십니다! 충성!"';
        sendNotification("임무 성공! 로켓이 발사되었습니다. 이제 좀 쉬세요! 🚀");
        
        // Manual JS Animation (3 Seconds)
        const duration = 3000; // 3 Seconds
        const startTime = performance.now();
        const startPos = 0;
        const endPos = -1500;
        
        function animateLaunch(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const easeProgress = progress * progress;
            const currentPos = startPos + (endPos - startPos) * easeProgress;
            
            rocketWrapper.style.transform = `translateY(${currentPos}px) scale(${1 - progress * 0.7})`;
            rocketWrapper.style.opacity = 1 - progress;
            
            const fire = document.getElementById('thruster-fire');
            if (fire) {
                fire.style.opacity = progress < 0.9 ? 1 : 0;
                fire.style.height = (80 + Math.random() * 40) + 'px';
            }

            if (progress < 1) {
                requestAnimationFrame(animateLaunch);
            }
        }
        
        requestAnimationFrame(animateLaunch);
        recordFocus(25);
        
        setTimeout(() => {
            toggleSession();
            missionCount++;
            if (missionNameInput.value.includes('MISSION #')) {
                missionNameInput.value = `MISSION #${missionCount}`;
            }
            
            // ENSURE ROCKET IS RESET AFTER ANIMATION
            resetRocketUI();
            
            resetBtn.classList.add('hidden');
            startTimer();
        }, duration); 
    } else {
        playBreakEndSound(); // USE THE NEW GENTLE CHIME
        
        sendNotification("휴식 종료! 다시 엔진을 점화할 시간입니다! 🔋");
        toggleSession();
        
        // ENSURE ROCKET IS VISIBLE FOR NEXT FOCUS
        resetRocketUI();
        
        startTimer();
    }
}

// Dedicated function to reset rocket visuals
function resetRocketUI() {
    rocketWrapper.style.transform = 'translateY(0) scale(1)';
    rocketWrapper.style.opacity = 1;
    const fire = document.getElementById('thruster-fire');
    if (fire) fire.style.opacity = 0;
}

function pauseTimer() {
    clearInterval(timerId);
    timerId = null;
    startBtn.classList.remove('hidden');
    pauseBtn.classList.add('hidden');
    resetBtn.classList.remove('hidden'); // Keep abort visible while paused
    startText.textContent = 'RESUME';
    rocketWrapper.className = 'rocket-wrapper';
}

function resetTimer() {
    clearInterval(timerId);
    timerId = null;
    timeLeft = isFocusSession ? FOCUS_TIME : BREAK_TIME;
    startBtn.classList.remove('hidden');
    pauseBtn.classList.add('hidden');
    resetBtn.classList.add('hidden'); // Hide abort after reset
    startText.textContent = isFocusSession ? '엔진 점화 (START)' : '대기권 진입 (START)';
    updateDisplay();
    kodariQuote.textContent = '"시스템 리셋 완료! 다시 준비하겠습니다! 충성!"';
    rocketWrapper.className = 'rocket-wrapper';
}

function toggleSession() {
    isFocusSession = !isFocusSession;
    timeLeft = isFocusSession ? FOCUS_TIME : BREAK_TIME;
    startText.textContent = isFocusSession ? '엔진 점화 (START)' : '대기권 진입 (START)';
    startBtn.classList.remove('hidden');
    pauseBtn.classList.add('hidden');
    updateDisplay();
}

// Event Listeners
startBtn.addEventListener('click', startTimer);
pauseBtn.addEventListener('click', pauseTimer);
resetBtn.addEventListener('click', resetTimer);
resetStatsBtn.addEventListener('click', () => {
    if (confirm('모든 성공 기록을 초기화하시겠습니까?')) {
        weeklyStats = [0, 0, 0, 0, 0, 0, 0];
        saveStats();
        updateChart();
    }
});

init();
