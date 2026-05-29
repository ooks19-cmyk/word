// sound.js - 오디오 음향 효과 관리 시스템
let audioCtx = null;

function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
}

// 효과음 재생 함수 (카드 플립, 팩 오픈 등)
function playSound(type) {
    try {
        initAudio();
        if (!audioCtx) return;
        const now = audioCtx.currentTime;
        
        if (type === 'rumble') {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(80, now);
            osc.frequency.exponentialRampToValueAtTime(35, now + 1.2);
            gain.gain.setValueAtTime(0.3, now);
            gain.gain.linearRampToValueAtTime(0.01, now + 1.2);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start(now);
            osc.stop(now + 1.2);
        } else if (type === 'reveal') {
            const osc1 = audioCtx.createOscillator();
            const osc2 = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc1.type = 'sawtooth';
            osc1.frequency.setValueAtTime(220, now);
            osc1.frequency.exponentialRampToValueAtTime(440, now + 0.1);
            osc1.frequency.exponentialRampToValueAtTime(880, now + 0.6);
            
            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(330, now);
            osc2.frequency.exponentialRampToValueAtTime(660, now + 0.15);
            osc2.frequency.exponentialRampToValueAtTime(1320, now + 0.8);
            
            gain.gain.setValueAtTime(0.01, now);
            gain.gain.linearRampToValueAtTime(0.25, now + 0.15);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 1.2);
            
            osc1.connect(gain);
            osc2.connect(gain);
            gain.connect(audioCtx.destination);
            osc1.start(now);
            osc2.start(now);
            osc1.stop(now + 1.5);
            osc2.stop(now + 1.5);
        } else if (type === 'flip') {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(550, now);
            osc.frequency.exponentialRampToValueAtTime(1100, now + 0.3);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start(now);
            osc.stop(now + 0.5);
        }
    } catch (e) {
        console.log("Audio not supported");
    }
}
