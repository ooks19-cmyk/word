// js/utils.js - UI 유틸리티 모듈

// Point widgets update helper
function renderUserPoints() {
    const ptsVal = document.getElementById('userPointsVal');
    if (ptsVal) ptsVal.innerText = userPoints;
    
    const packPtsVal = document.getElementById('packUserPointsVal');
    if (packPtsVal) packPtsVal.innerText = userPoints;
    
    // Manage Pack Button accessibility
    const openPackBtn = document.getElementById('openPackBtn');
    if (openPackBtn) {
        if (userPoints < 1) {
            openPackBtn.style.background = 'rgba(255, 255, 255, 0.05)';
            openPackBtn.style.color = 'var(--text-muted)';
            openPackBtn.style.border = '1px solid var(--glass-border)';
            openPackBtn.style.boxShadow = 'none';
            openPackBtn.style.cursor = 'not-allowed';
            openPackBtn.innerText = '포인트 부족 (단어 퀴즈 풀기)';
        } else {
            openPackBtn.style.background = '';
            openPackBtn.style.color = '';
            openPackBtn.style.border = '';
            openPackBtn.style.boxShadow = '';
            openPackBtn.style.cursor = '';
            openPackBtn.innerText = '카드 팩 열기';
        }
    }
}

// User Level update helper
function renderUserLevel() {
    const lvlVal = document.getElementById('quizLevelVal');
    if (lvlVal) lvlVal.innerText = userLevel;
}

// 6. INTERACTIVE 3D TILT EFFECT & HOLO GLOW
function apply3DTiltEffect(element) {
    if (!element) return;
    
    element.addEventListener('mousemove', (e) => {
        if (!element.classList.contains('flipped')) return;
        
        const rect = element.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const width = rect.width;
        const height = rect.height;
        
        const rotateX = ((y / height) - 0.5) * -25;
        const rotateY = ((x / width) - 0.5) * 25;
        
        element.style.transform = `rotateY(${180 + rotateY}deg) rotateX(${rotateX}deg) scale(1.03)`;
        
        const shine = element.querySelector('.card-shine');
        if (shine) {
            const percentX = (x / width) * 100;
            const percentY = (y / height) * 100;
            shine.style.backgroundPosition = `${percentX}% ${percentY}%`;
            shine.style.opacity = '0.5';
        }
    });
    
    element.addEventListener('mouseleave', () => {
        if (!element.classList.contains('flipped')) {
            element.style.transform = '';
            return;
        }
        element.style.transform = `rotateY(180deg) rotateX(0deg) scale(1)`;
        const shine = element.querySelector('.card-shine');
        if (shine) {
            shine.style.backgroundPosition = '0% 0%';
            shine.style.opacity = '0';
        }
    });
}

// 7. TOAST SYSTEM
function showToast(message) {
    const toast = document.getElementById('toastContainer');
    const toastMsg = document.getElementById('toastMessage');
    if (!toast || !toastMsg) {
        console.warn("showToast: 토스트 DOM 요소를 찾을 수 없어 기본 alert 창으로 출력합니다. 메시지:", message);
        alert(message);
        return;
    }
    toastMsg.innerText = message;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// 8. PARTY GLOW/SPARK PARTICLES EFFECT
function createSparkParticles(isExplosion = false, themeGlow = '#ffd700') {
    const container = document.getElementById('particlesContainer');
    if (!container) {
        console.warn("createSparkParticles: particlesContainer 요소를 찾을 수 없어 파티클 스파크 연출을 건너뜁니다.");
        return;
    }
    container.innerHTML = '';
    
    const count = isExplosion ? 60 : 25;
    const colors = [themeGlow, '#ffffff', '#ffd700', '#20e3b2', '#00f2fe'];
    
    for (let i = 0; i < count; i++) {
        const spark = document.createElement('div');
        spark.style.position = 'absolute';
        spark.style.width = `${Math.random() * 6 + 4}px`;
        spark.style.height = spark.style.width;
        spark.style.borderRadius = '50%';
        spark.style.background = colors[Math.floor(Math.random() * colors.length)];
        spark.style.boxShadow = `0 0 10px ${spark.style.background}`;
        
        if (isExplosion) {
            spark.style.left = '50%';
            spark.style.top = '50%';
            
            const angle = Math.random() * Math.PI * 2;
            const velocity = Math.random() * 200 + 80;
            const destX = Math.cos(angle) * velocity;
            const destY = Math.sin(angle) * velocity;
            
            spark.animate([
                { transform: 'translate(-50%, -50%) scale(1)', opacity: 1 },
                { transform: `translate(calc(-50% + ${destX}px), calc(-50% + ${destY}px)) scale(0)`, opacity: 0 }
            ], {
                duration: Math.random() * 800 + 700,
                easing: 'cubic-bezier(0.1, 0.8, 0.25, 1)',
                fill: 'forwards'
            });
        } else {
            spark.style.left = `${Math.random() * 100}%`;
            spark.style.top = '100%';
            
            spark.animate([
                { transform: 'translateY(0) scale(1)', opacity: 0.8 },
                { transform: `translateY(-${Math.random() * 400 + 200}px) translateX(${Math.random() * 60 - 30}px) scale(0)`, opacity: 0 }
            ], {
                duration: Math.random() * 2000 + 1500,
                easing: 'ease-out',
                fill: 'forwards'
            });
        }
        
        container.appendChild(spark);
    }
}
