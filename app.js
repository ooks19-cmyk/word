// CARDS_DATABASE is now loaded dynamically from player/player_data.js

// 1. USER POINTS & LEVEL STATE (FP & Level)
let userPoints = 0;
try {
    const savedPoints = localStorage.getItem('fc_star_user_points');
    if (savedPoints !== null) {
        userPoints = parseInt(savedPoints);
        if (isNaN(userPoints) || userPoints < 0) userPoints = 0;
    }
} catch (e) {
    userPoints = 0;
}

let userLevel = 1;
try {
    const savedLevel = localStorage.getItem('fc_star_user_level');
    if (savedLevel !== null) {
        userLevel = parseInt(savedLevel);
        if (isNaN(userLevel) || userLevel < 1) userLevel = 1;
    }
} catch (e) {
    userLevel = 1;
}

// 2. PLAYER DECK STATE (Loaded from LocalStorage with robust error handling)
let playerDeck = {};
try {
    const savedDeck = localStorage.getItem('fc_star_player_deck');
    if (savedDeck) {
        playerDeck = JSON.parse(savedDeck);
        if (!playerDeck || Array.isArray(playerDeck) || typeof playerDeck !== 'object') {
            playerDeck = {};
        }
        
        // Sync structures for both players
        Object.keys(playerDeck).forEach(key => {
            if (CARDS_DATABASE[key]) {
                playerDeck[key].card = CARDS_DATABASE[key];
            } else {
                delete playerDeck[key]; // Cleanup legacy format cards
            }
        });
        localStorage.setItem('fc_star_player_deck', JSON.stringify(playerDeck));
    }
} catch (e) {
    console.warn("LocalStorage access blocked. Using in-memory fallback.", e);
    playerDeck = {};
}

let activePulledCard = null;
let isFlipped = false;



let quizOffset = 0;
let quizLastDate = "";
let matchLastDate = "";
let matchTodayCount = 0;

// REAL-TIME USER AUTH & DATA SYNC STATE
let currentUser = null;
let authMode = 'login'; // 'login' or 'register'
let isAuthSubmitting = false;

// DEVELOPER MODE & MULTI-YEAR LEAGUE STATE VARIABLES
let isDeveloperMode = false;
let leagueYear = 2026;
let hallOfFame = [];
let careerStats = { w: 0, d: 0, l: 0, gf: 0, ga: 0, playerGoals: {} };



// Tab Switching
function switchTab(tabName) {
    const tabs = {
        'pack': {
            btn: document.getElementById('tabPackBtn'),
            section: document.getElementById('packSection')
        },
        'quiz': {
            btn: document.getElementById('tabQuizBtn'),
            section: document.getElementById('quizSection')
        },
        'deck': {
            btn: document.getElementById('tabDeckBtn'),
            section: document.getElementById('deckSection')
        },
        'squad': {
            btn: document.getElementById('tabSquadBtn'),
            section: document.getElementById('squadSection')
        },
        'match': {
            btn: document.getElementById('tabMatchBtn'),
            section: document.getElementById('matchSection')
        },
        'fame': {
            btn: document.getElementById('tabFameBtn'),
            section: document.getElementById('fameSection')
        }
    };

    Object.keys(tabs).forEach(key => {
        if (tabs[key].btn && tabs[key].section) {
            if (key === tabName) {
                tabs[key].btn.classList.add('active');
                tabs[key].section.classList.add('active');
            } else {
                tabs[key].btn.classList.remove('active');
                tabs[key].section.classList.remove('active');
            }
        }
    });

    if (tabName === 'deck') {
        renderDeck();
    } else if (tabName === 'squad') {
        renderSquadFormation();
    } else if (tabName === 'match') {
        syncJeonbukOvr();
        updateMatchPreviewBoard();
        renderLeagueTable();
    } else if (tabName === 'quiz') {
        if (!quizQueue || quizQueue.length === 0) {
            initQuizRound();
        } else {
            const completeOverlay = document.getElementById('quizCompleteOverlay');
            if (quizSolvedCount >= 5) {
                if (completeOverlay) completeOverlay.style.display = 'flex';
            } else {
                if (completeOverlay) completeOverlay.style.display = 'none';
                renderQuizCurrent();
            }
        }
        renderUserLevel();
    } else if (tabName === 'fame') {
        renderHallOfFame();
    }
    
    renderUserPoints(); // Ensure header points are sync'd
}

// 각성 수치가 반영된 동적 선수 데이터 반환 함수
function getAwakenedCard(cardId) {
    const baseCard = CARDS_DATABASE[cardId];
    if (!baseCard) return null;
    
    const deckItem = playerDeck[cardId];
    const awk = (deckItem && typeof deckItem.awakening === 'number') ? deckItem.awakening : 0;
    if (awk === 0) {
        baseCard.awakening = 0;
        return baseCard;
    }
    
    // 능력치 훼손 방지를 위한 깊은 복사
    const awakenedCard = JSON.parse(JSON.stringify(baseCard));
    awakenedCard.rating += awk;
    if (awakenedCard.stats) {
        Object.keys(awakenedCard.stats).forEach(k => {
            awakenedCard.stats[k] += awk;
        });
    }
    awakenedCard.awakening = awk;
    return awakenedCard;
}

// 3. GENERATING DECORATED REAL PORTRAIT CARD HTML
function generateCardHTML(cardData) {
    const awk = cardData.awakening || 0;
    const awkStars = '★'.repeat(awk);
    const awkBadgeHTML = awk > 0 ? `
        <div class="card-awakening-badge" style="
            position: absolute;
            top: 0.6rem;
            right: 1.2rem;
            background: linear-gradient(135deg, #ffd700 0%, #b8860b 50%, #ffd700 100%);
            color: #000;
            font-size: 0.7rem;
            font-weight: 900;
            padding: 3px 8px;
            border-radius: 20px;
            box-shadow: 0 0 10px rgba(255, 215, 0, 0.7), 0 2px 4px rgba(0,0,0,0.5);
            z-index: 10;
            letter-spacing: 0.5px;
            border: 1px solid rgba(255, 255, 255, 0.2);
        ">
            ${awkStars} ${awk}각성
        </div>
    ` : '';

    const rarity = cardData.rarity || 'normal';
    const rarityBadgeHTML = `
        <div class="card-rarity-badge" style="
            position: absolute;
            top: 0.6rem;
            left: 1.2rem;
            background: ${rarity === 'legend' ? 'linear-gradient(135deg, #ff0055 0%, #ffaa00 50%, #ffd700 100%)' : 'rgba(255, 255, 255, 0.15)'};
            color: ${rarity === 'legend' ? '#000' : '#fff'};
            font-size: 0.65rem;
            font-weight: 900;
            padding: 3px 8px;
            border-radius: 20px;
            box-shadow: ${rarity === 'legend' ? '0 0 10px rgba(255, 215, 0, 0.7), 0 2px 4px rgba(0,0,0,0.5)' : 'none'};
            z-index: 10;
            letter-spacing: 0.5px;
            border: 1px solid ${rarity === 'legend' ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.2)'};
            backdrop-filter: blur(5px);
        ">
            ${rarity === 'legend' ? '👑 전설' : '일반'}
        </div>
    `;

    return `
        <div class="card-shine"></div>
        ${awkBadgeHTML}
        ${rarityBadgeHTML}
        <div class="card-header-stats">
            <div class="card-rating">${cardData.rating}</div>
            <div class="card-position">${cardData.position}</div>
            <div class="card-nation" style="background-image: url('${cardData.nationFlag}');"></div>
            <div class="card-club" style="color: ${cardData.theme.glow}; font-weight: 800; font-size: 0.75rem; letter-spacing: 1px; margin-top: 5px;">${cardData.club}</div>
        </div>
        
        <!-- Decorated Image Frame (Real Player Portrait with neon background, frame border, and hologram badge) -->
        <div class="card-image-container grade-gold">
            <div class="card-portrait-background" style="background: radial-gradient(circle at 50% 40%, ${cardData.theme.primary}aa 0%, #080a10 85%);">
                <!-- Tech grid line overlay inside portrait -->
                <div class="portrait-grid"></div>
            </div>
            
            <img src="${cardData.image}" alt="${cardData.name}" class="card-player-img" onerror="this.src='https://placehold.co/320x320/005a3c/ffd700?text=${encodeURIComponent(cardData.name)}'">
            <div class="card-badge-glow" style="background: radial-gradient(circle, ${cardData.theme.glow}33 0%, transparent 70%);"></div>
        </div>
        
        <div class="card-info-pane">
            <div class="card-name" style="background: linear-gradient(135deg, #fff 0%, ${cardData.theme.glow} 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">${cardData.name}</div>
            <div class="card-stats-grid">
                <div class="stat-item">
                    <div class="stat-val">${cardData.stats.pac}</div>
                    <div class="stat-lbl">PAC</div>
                </div>
                <div class="stat-item">
                    <div class="stat-val">${cardData.stats.sho}</div>
                    <div class="stat-lbl">SHO</div>
                </div>
                <div class="stat-item">
                    <div class="stat-val">${cardData.stats.pas}</div>
                    <div class="stat-lbl">PAS</div>
                </div>
                <div class="stat-item">
                    <div class="stat-val">${cardData.stats.dri}</div>
                    <div class="stat-lbl">DRI</div>
                </div>
                <div class="stat-item">
                    <div class="stat-val">${cardData.stats.def}</div>
                    <div class="stat-lbl">DEF</div>
                </div>
                <div class="stat-item">
                    <div class="stat-val">${cardData.stats.phy}</div>
                    <div class="stat-lbl">PHY</div>
                </div>
            </div>
        </div>
    `;
}

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

// 4. PACK OPENING (Drawn randomly between Lee Seung-woo & Kim Seung-sub)
function openPack() {
    if (userPoints < 1) {
        showToast("포인트가 부족합니다! '단어 퀴즈' 탭에서 퀴즈를 풀고 FP를 획득하세요.");
        switchTab('quiz');
        return;
    }

    const keys = Object.keys(CARDS_DATABASE);
    const legendKeys = keys.filter(k => CARDS_DATABASE[k].rarity === 'legend');
    const normalKeys = keys.filter(k => CARDS_DATABASE[k].rarity === 'normal');
    
    let chosenKey = "";
    const rand = Math.random(); // 0.0 ~ 1.0
    
    // Each individual Legend card has exactly a 1% probability
    const totalLegendProb = legendKeys.length * 0.01;
    
    if (rand < totalLegendProb && legendKeys.length > 0) {
        // Draw from the legend pool uniformly (each card has exactly a 1% chance)
        chosenKey = legendKeys[Math.floor(Math.random() * legendKeys.length)];
    } else {
        // Draw from the normal pool (or fallback if empty)
        chosenKey = normalKeys.length > 0 
            ? normalKeys[Math.floor(Math.random() * normalKeys.length)]
            : keys[Math.floor(Math.random() * keys.length)];
    }
    
    activePulledCard = CARDS_DATABASE[chosenKey];
    isFlipped = false;
    
    // Set up card front html with awakening preview if duplicate
    let previewCard = activePulledCard;
    if (playerDeck[chosenKey]) {
        const currentAwk = playerDeck[chosenKey].awakening || 0;
        const nextAwk = Math.min(5, currentAwk + 1);
        previewCard = JSON.parse(JSON.stringify(activePulledCard));
        previewCard.rating += nextAwk;
        if (previewCard.stats) {
            Object.keys(previewCard.stats).forEach(statKey => {
                previewCard.stats[statKey] += nextAwk;
            });
        }
        previewCard.awakening = nextAwk;
    } else {
        previewCard.awakening = 0;
    }
    
    document.getElementById('cardFrontContainer').innerHTML = generateCardHTML(previewCard);
    
    // Set neon glows to card border
    const futCardFront = document.querySelector('#cardFrontContainer');
    futCardFront.style.borderColor = activePulledCard.theme.glow;
    futCardFront.style.boxShadow = `0 0 20px ${activePulledCard.theme.glow}33, var(--card-shadow)`;

    // Reset classes and instantly snap card to back side
    const wrapper = document.getElementById('card3dWrapper');
    wrapper.classList.remove('reveal');
    
    const futCard = document.getElementById('futCard');
    futCard.style.transition = 'none'; // Disable animation for instant reset
    futCard.classList.remove('flipped');
    
    // Force browser reflow
    void wrapper.offsetWidth;
    void futCard.offsetWidth;
    
    futCard.style.transition = ''; // Restore animation
    
    document.getElementById('btnCollect').style.display = 'none';
    
    // Activate reveal modal
    const modal = document.getElementById('revealModal');
    modal.classList.add('active');
    
    // Sound rumble
    playSound('rumble');
    
    // Neon spark particles matching team theme color
    createSparkParticles(false, activePulledCard.theme.glow);
    
    // Delayed card entry reveal (Wait for modal to fully fade in)
    setTimeout(() => {
        wrapper.classList.add('reveal');
        playSound('reveal');
    }, 600);

    // Apply interactive 3D Tilt after card enters
    setTimeout(() => {
        apply3DTiltEffect(document.getElementById('futCard'));
    }, 1200);
}

// Trigger Flip Card
function flipRevealedCard() {
    if (isFlipped) return;
    isFlipped = true;
    
    playSound('flip');
    
    const futCard = document.getElementById('futCard');
    futCard.classList.add('flipped');
    
    const flash = document.getElementById('flashOverlay');
    flash.classList.add('trigger');
    
    setTimeout(() => {
        flash.classList.remove('trigger');
    }, 800);
    
    // Exploding spark particles matching player neon theme
    createSparkParticles(true, activePulledCard.theme.glow);
    
    setTimeout(() => {
        const btn = document.getElementById('btnCollect');
        btn.style.display = 'block';
        btn.style.animation = 'fadeIn 0.4s ease-out forwards';
    }, 600);
}

// Save Card to local deck
function collectCard() {
    if (!activePulledCard) return;
    
    const id = activePulledCard.id;
    let message = "";
    
    if (playerDeck[id]) {
        // 중복 카드 영입 시: 수량은 1개로 유지하고 각성 등급 업!
        playerDeck[id].quantity = 1;
        if (typeof playerDeck[id].awakening !== 'number') {
            playerDeck[id].awakening = 0;
        }
        
        if (playerDeck[id].awakening < 5) {
            playerDeck[id].awakening += 1;
            message = `축하합니다! ${activePulledCard.name} 선수가 ${playerDeck[id].awakening}단계 각성에 성공했습니다! (모든 능력치 +1)`;
        } else {
            message = `이미 최대 각성 상태(5각성)인 ${activePulledCard.name} 선수를 영입하여 카드가 흡수되었습니다!`;
        }
    } else {
        // 첫 영입 시
        playerDeck[id] = {
            card: activePulledCard,
            quantity: 1,
            awakening: 0
        };
        message = `축하합니다! K리그 스타 ${activePulledCard.name} 선수를 새로운 구단원으로 영입했습니다!`;
    }
    
    // Deduct 1 Gacha FP point
    userPoints = Math.max(0, userPoints - 1);
    try {
        localStorage.setItem('fc_star_user_points', userPoints.toString());
        localStorage.setItem('fc_star_player_deck', JSON.stringify(playerDeck));
    } catch (e) {
        console.warn("Saving to localStorage failed. Using in-memory fallback.", e);
    }
    
    renderUserPoints(); // Sync displays
    closeRevealModal();
    showToast(message);
    updateTotalCardCount();
    renderDeck(); // 즉시 덱 화면 갱신
    
    // Auto-save user data to cloud
    saveUserProgress();
}

function closeRevealModal() {
    const modal = document.getElementById('revealModal');
    modal.classList.remove('active');
    document.getElementById('card3dWrapper').classList.remove('reveal');
}

// 5. RENDER COLLECTION DECK
function renderDeck() {
    const grid = document.getElementById('deckGrid');
    const placeholder = document.getElementById('emptyDeckPlaceholder');
    
    const existingCards = grid.querySelectorAll('.deck-card-wrapper');
    existingCards.forEach(el => el.remove());
    
    const keys = Object.keys(playerDeck);
    
    // 능력치(Rating)가 높은 순서대로 정렬 (각성 스탯 보너스 반영)
    keys.sort((a, b) => {
        const cardA = getAwakenedCard(a);
        const cardB = getAwakenedCard(b);
        const ratingA = cardA ? cardA.rating : 0;
        const ratingB = cardB ? cardB.rating : 0;
        return ratingB - ratingA;
    });
    
    if (keys.length === 0) {
        placeholder.style.display = 'flex';
    } else {
        placeholder.style.display = 'none';
        
        keys.forEach(key => {
            const wrapper = document.createElement('div');
            wrapper.className = 'deck-card-wrapper';
            
            // Note: quantity badge removed because quantity is always strictly 1 (Unique Card System)
            
            const cardEl = document.createElement('div');
            cardEl.className = 'fut-card flipped';
            
            const awakened = getAwakenedCard(key);
            
            // Card Front
            const cardFront = document.createElement('div');
            cardFront.className = 'card-front';
            cardFront.innerHTML = generateCardHTML(awakened);
            cardFront.style.borderColor = awakened.theme.glow;
            cardFront.style.boxShadow = `0 0 15px ${awakened.theme.glow}22, var(--card-shadow)`;
            
            // Card Back (Player Profile)
            const cardBack = document.createElement('div');
            cardBack.className = 'card-back';
            cardBack.style.background = `radial-gradient(circle at 50% 30%, ${awakened.theme.primary}ee 0%, #06080d 100%)`;
            cardBack.style.borderColor = awakened.theme.glow;
            cardBack.style.boxShadow = `0 0 15px ${awakened.theme.glow}22, var(--card-shadow)`;
            cardBack.style.display = 'flex';
            cardBack.style.flexDirection = 'column';
            cardBack.style.justifyContent = 'space-between';
            cardBack.style.alignItems = 'center';
            cardBack.style.color = '#fff';
            cardBack.style.textAlign = 'center';
            cardBack.style.boxSizing = 'border-box';
            cardBack.style.padding = '1.25rem';
            
            // Back pattern decoration
            const pattern = document.createElement('div');
            pattern.className = 'card-back-pattern';
            pattern.style.borderColor = `${awakened.theme.glow}22`;
            cardBack.appendChild(pattern);
            
            // Header
            const header = document.createElement('div');
            header.style.width = '100%';
            header.style.borderBottom = `1px solid ${awakened.theme.glow}33`;
            header.style.paddingBottom = '6px';
            header.style.marginBottom = '8px';
            header.style.zIndex = '2';
            header.innerHTML = `
                <span style="font-size: 0.65rem; letter-spacing: 2px; color: ${awakened.theme.glow}; font-weight: 800; text-transform: uppercase;">PLAYER PROFILE</span>
                <h3 style="margin: 4px 0 0 0; font-size: 1.15rem; font-weight: 800; background: linear-gradient(135deg, #fff 0%, ${awakened.theme.glow} 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">${awakened.name}</h3>
            `;
            cardBack.appendChild(header);
            
            // Body description
            const body = document.createElement('div');
            body.style.flexGrow = '1';
            body.style.display = 'flex';
            body.style.flexDirection = 'column';
            body.style.justifyContent = 'center';
            body.style.alignItems = 'center';
            body.style.zIndex = '2';
            body.style.padding = '0 5px';
            
            const descText = awakened.description || 'FC 스타 리그의 대표 선수입니다. 탁월한 기량과 활약으로 팀의 승리를 이끌며 팬들의 뜨거운 사랑을 받고 있습니다.';
            body.innerHTML = `
                <p style="font-size: 0.72rem; line-height: 1.45; color: #cbd5e1; margin: 0; word-break: keep-all; font-weight: 500;">
                    ${descText}
                </p>
            `;
            cardBack.appendChild(body);
            
            // Footer
            const footer = document.createElement('div');
            footer.style.width = '100%';
            footer.style.borderTop = '1px solid rgba(255,255,255,0.08)';
            footer.style.paddingTop = '6px';
            footer.style.marginTop = '8px';
            footer.style.display = 'flex';
            footer.style.justifyContent = 'space-between';
            footer.style.alignItems = 'center';
            footer.style.fontSize = '0.62rem';
            footer.style.color = '#94a3b8';
            footer.style.fontWeight = '600';
            footer.style.zIndex = '2';
            footer.innerHTML = `
                <span>${awakened.club}</span>
                <span style="display: flex; align-items: center; gap: 4px;">
                    <img src="${awakened.nationFlag}" style="width: 12px; height: 8px; border-radius: 1px; object-fit: cover;">
                    ${awakened.position}
                </span>
            `;
            cardBack.appendChild(footer);
            
            cardEl.appendChild(cardFront);
            cardEl.appendChild(cardBack);
            
            // Double-click to flip on Desktop
            cardEl.addEventListener('dblclick', (e) => {
                e.stopPropagation();
                cardEl.classList.toggle('flipped');
                if (typeof playSound === 'function') {
                    playSound('flip');
                }
            });
            
            // Double-tap to flip on Mobile (Using touchstart for instant, responsive flipping without double-tap-to-zoom delay)
            let lastTap = 0;
            cardEl.addEventListener('touchstart', (e) => {
                const currentTime = new Date().getTime();
                const tapLength = currentTime - lastTap;
                if (tapLength < 300 && tapLength > 0) {
                    e.preventDefault(); // Prevents mobile browser double-tap-to-zoom
                    e.stopPropagation();
                    cardEl.classList.toggle('flipped');
                    if (typeof playSound === 'function') {
                        playSound('flip');
                    }
                }
                lastTap = currentTime;
            }, { passive: false });
            
            wrapper.appendChild(cardEl);
            grid.appendChild(wrapper);
        });
    }
    updateTotalCardCount();
}

function updateTotalCardCount() {
    let total = 0;
    Object.keys(playerDeck).forEach(key => {
        total += playerDeck[key].quantity;
    });
    document.getElementById('totalCardsCount').innerText = total;
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

// 9. SQUAD FORMATION BOARD LOGIC
let squadFormation = {};
let activeSelectorPosition = null;

try {
    const savedFormation = localStorage.getItem('fc_star_squad_formation');
    if (savedFormation) {
        squadFormation = JSON.parse(savedFormation);
        if (!squadFormation || typeof squadFormation !== 'object') {
            squadFormation = {};
        }
    }
} catch (e) {
    squadFormation = {};
}

// 11 Key tactical board positions
const TACTICAL_POSITIONS = ["GK", "LB", "LCB", "RCB", "RB", "LCM", "CM", "RCM", "LW", "ST", "RW"];

function renderSquadFormation() {
    let totalOvr = 0;
    
    TACTICAL_POSITIONS.forEach(pos => {
        const slotEl = document.getElementById(`slot-${pos}`);
        if (!slotEl) return;
        
        const cardId = squadFormation[pos];
        let cardData = null;
        
        if (cardId && CARDS_DATABASE[cardId]) {
            cardData = getAwakenedCard(cardId);
        }
        
        if (cardData) {
            // Placed player card structure
            totalOvr += cardData.rating;
            const starIndicator = cardData.awakening > 0 ? `<span style="font-size: 0.55rem; color: #ffd700; margin-left: 1px; vertical-align: middle;">★</span>` : '';
            slotEl.innerHTML = `
                <div class="mini-player-card active-placed">
                    <div class="mini-card-ovr-badge">${cardData.rating}${starIndicator}</div>
                    <div class="mini-card-position-badge">${pos}</div>
                    <div class="mini-card-portrait">
                        <img src="${cardData.image}" alt="${cardData.name}" onerror="this.src='https://placehold.co/80x80/005a3c/ffd700?text=${encodeURIComponent(cardData.name)}'">
                    </div>
                    <div class="mini-card-name">${cardData.name}</div>
                </div>
            `;
        } else {
            // Anonymous Player OVR 70 card placeholder structure
            totalOvr += 70;
            slotEl.innerHTML = `
                <div class="mini-player-card anonymous">
                    <div class="mini-card-ovr-badge">70</div>
                    <div class="mini-card-position-badge">${pos}</div>
                    <div class="mini-card-portrait">
                        <i class="fa-solid fa-user-ninja"></i>
                    </div>
                    <div class="mini-card-name">무명 선수</div>
                </div>
            `;
        }
    });
    
    // Calculate and display average team OVR rating
    const avgOvr = Math.round(totalOvr / 11);
    document.getElementById('teamOvrVal').innerText = avgOvr;
}

function openCardSelector(position) {
    activeSelectorPosition = position;
    
    const overlay = document.getElementById('drawerOverlay');
    const title = document.getElementById('drawerPositionTitle');
    const content = document.getElementById('drawerContent');
    
    title.innerText = position;
    overlay.classList.add('active');
    
    // Clear and render choices
    content.innerHTML = '';
    
    // If a player is already assigned, show the Release button first
    const assignedPlayerId = squadFormation[position];
    if (assignedPlayerId) {
        const releaseBtn = document.createElement('button');
        releaseBtn.className = 'btn-release-player';
        releaseBtn.innerHTML = `<i class="fa-solid fa-user-minus" style="margin-right: 6px;"></i>배치 해제`;
        releaseBtn.onclick = () => releasePlayerFromPosition();
        content.appendChild(releaseBtn);
    }
    
    // Retrieve all collected cards from deck
    const deckKeys = Object.keys(playerDeck).filter(k => playerDeck[k].quantity > 0);
    
    if (deckKeys.length === 0) {
        content.innerHTML += `
            <div class="empty-drawer-state">
                <i class="fa-regular fa-face-frown"></i>
                <p>아직 수집한 카드가 없습니다.<br>카드 뽑기에서 선수를 영입해보세요!</p>
            </div>
        `;
        return;
    }
    
    // List player choices
    deckKeys.forEach(key => {
        const item = playerDeck[key];
        const card = getAwakenedCard(key); // 각성된 카드 능력치/스펙 동적 계산 반영
        
        // Count how many of this card are currently placed in the formation to prevent duplicate usage exceeding the collected quantity
        let placedCount = 0;
        Object.keys(squadFormation).forEach(p => {
            if (squadFormation[p] === key) placedCount++;
        });
        
        const availableCount = item.quantity - placedCount;
        
        // Render item row
        const row = document.createElement('div');
        row.className = 'drawer-card-item';
        
        // Check if this card is already assigned *to this specific slot*
        const isCurrentSlot = assignedPlayerId === key;
        
        const awkLabel = card.awakening > 0 ? `<span style="color: #ffd700; font-weight: 800; font-size: 0.8rem; margin-left: 5px;">★ ${card.awakening}</span>` : '';
        const statusText = availableCount > 0 ? `<span style="color: #00ff87; font-weight: 600;">기용 가능</span>` : `<span style="color: var(--text-muted);">다른 자리에 배치됨</span>`;
        
        row.innerHTML = `
            <div class="drawer-card-info">
                <div class="drawer-card-thumb" style="background: radial-gradient(circle, ${card.theme.glow}22 0%, #0c1122 100%);">
                    <img src="${card.image}" alt="${card.name}" onerror="this.src='https://placehold.co/48x48/005a3c/ffd700?text=${encodeURIComponent(card.name)}'">
                </div>
                <div class="drawer-card-details">
                    <h4>${card.name} (OVR ${card.rating})${awkLabel}</h4>
                    <p>${card.position} | 상태: ${statusText}</p>
                </div>
            </div>
        `;
        
        const actionBtn = document.createElement('button');
        
        if (isCurrentSlot) {
            actionBtn.className = 'btn-select-player';
            actionBtn.style.background = 'rgba(255, 255, 255, 0.1)';
            actionBtn.style.color = '#fff';
            actionBtn.style.cursor = 'default';
            actionBtn.innerText = '배치됨';
        } else if (availableCount <= 0) {
            actionBtn.className = 'btn-select-player';
            actionBtn.style.background = 'rgba(255, 255, 255, 0.05)';
            actionBtn.style.color = 'var(--text-muted)';
            actionBtn.style.cursor = 'not-allowed';
            actionBtn.innerText = '선택 불가';
        } else {
            actionBtn.className = 'btn-select-player';
            actionBtn.innerText = '선택';
            actionBtn.onclick = () => selectPlayerForPosition(key);
        }
        
        row.appendChild(actionBtn);
        content.appendChild(row);
    });
}

function selectPlayerForPosition(cardId) {
    if (!activeSelectorPosition) return;
    
    // Assign player
    squadFormation[activeSelectorPosition] = cardId;
    
    // Save to localStorage
    try {
        localStorage.setItem('fc_star_squad_formation', JSON.stringify(squadFormation));
    } catch(e) {
        console.warn("Saving squad formation failed:", e);
    }
    
    closeDrawer();
    renderSquadFormation();
    
    const cardName = CARDS_DATABASE[cardId].name;
    showToast(`${activeSelectorPosition} 자리에 ${cardName} 선수를 배치했습니다!`);
    
    // Auto-save user data to cloud
    saveUserProgress();
}

function releasePlayerFromPosition() {
    if (!activeSelectorPosition) return;
    
    const assignedPlayerId = squadFormation[activeSelectorPosition];
    const cardName = assignedPlayerId ? CARDS_DATABASE[assignedPlayerId].name : "무명";
    
    // Remove player
    delete squadFormation[activeSelectorPosition];
    
    // Save to localStorage
    try {
        localStorage.setItem('fc_star_squad_formation', JSON.stringify(squadFormation));
    } catch(e) {
        console.warn("Saving squad formation failed:", e);
    }
    
    closeDrawer();
    renderSquadFormation();
    showToast(`${activeSelectorPosition} 자리의 선수를 배치 해제하였습니다.`);
    
    // Auto-save user data to cloud
    saveUserProgress();
}

function closeDrawer() {
    const overlay = document.getElementById('drawerOverlay');
    overlay.classList.remove('active');
    activeSelectorPosition = null;
}

// 11. K-LEAGUE 1 MATCH SIMULATOR & LEAGUE STANDINGS ENGINE
let leagueTeams = [];
let leagueRound = 1;
let isMatchRunning = false;
let leaguePlayerStats = {};

const K_LEAGUE_TEAMS_PRESET = [
    { id: "jeonbuk", name: "전북 현대", rating: 70, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 },
    { id: "ulsan", name: "울산 HD", rating: 80, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 },
    { id: "seoul", name: "FC 서울", rating: 78, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 },
    { id: "pohang", name: "포항 스틸러스", rating: 77, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 },
    { id: "gangwon", name: "강원 FC", rating: 76, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 },
    { id: "gwangju", name: "광주 FC", rating: 75, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 },
    { id: "gimcheon", name: "김천 상무", rating: 75, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 },
    { id: "bucheon_fc", name: "부천 FC", rating: 74, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 },
    { id: "jeju", name: "제주 유나이티드", rating: 73, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 },
    { id: "daejeon", name: "대전 하나", rating: 73, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 },
    { id: "anyang", name: "FC 안양", rating: 71, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 },
    { id: "incheon", name: "인천 유나이티드", rating: 70, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 }
];

const JEONBUK_FIXTURES = [
    { round: 1, opponent: "ulsan", isHome: false },
    { round: 2, opponent: "seoul", isHome: true },
    { round: 3, opponent: "pohang", isHome: false },
    { round: 4, opponent: "gangwon", isHome: true },
    { round: 5, opponent: "gwangju", isHome: false },
    { round: 6, opponent: "gimcheon", isHome: true },
    { round: 7, opponent: "bucheon_fc", isHome: false },
    { round: 8, opponent: "jeju", isHome: true },
    { round: 9, opponent: "daejeon", isHome: false },
    { round: 10, opponent: "anyang", isHome: true },
    { round: 11, opponent: "incheon", isHome: false }
];

function initLeaguePlayerStats() {
    leaguePlayerStats = {};
    if (typeof OTHER_TEAMS_PLAYERS_PRESET !== 'undefined') {
        OTHER_TEAMS_PLAYERS_PRESET.forEach(p => {
            leaguePlayerStats[p.id] = {
                id: p.id,
                name: p.name,
                teamId: p.teamId,
                teamName: p.teamName,
                goals: 0,
                assists: 0
            };
        });
    }
}

function registerGoal(playerId, playerName, teamId, teamName) {
    if (!leaguePlayerStats) leaguePlayerStats = {};
    if (!leaguePlayerStats[playerId]) {
        leaguePlayerStats[playerId] = {
            id: playerId,
            name: playerName,
            teamId: teamId,
            teamName: teamName,
            goals: 0,
            assists: 0
        };
    }
    leaguePlayerStats[playerId].goals += 1;
}

function registerAssist(playerId, playerName, teamId, teamName) {
    if (!playerId) return;
    if (!leaguePlayerStats) leaguePlayerStats = {};
    if (!leaguePlayerStats[playerId]) {
        leaguePlayerStats[playerId] = {
            id: playerId,
            name: playerName,
            teamId: teamId,
            teamName: teamName,
            goals: 0,
            assists: 0
        };
    }
    leaguePlayerStats[playerId].assists += 1;
}

function processPlayerGoal(attackDesc) {
    const activeAttacker = squadFormation["ST"] ? CARDS_DATABASE[squadFormation["ST"]].name : "무명 스트라이커";
    const activeLw = squadFormation["LW"] ? CARDS_DATABASE[squadFormation["LW"]].name : "무명 윙어";
    const activeRw = squadFormation["RW"] ? CARDS_DATABASE[squadFormation["RW"]].name : "무명 윙백";
    const activeCm = squadFormation["CM"] ? CARDS_DATABASE[squadFormation["CM"]].name : "무명 미드필더";

    let scorerId, scorerName, assisterId, assisterName;
    if (attackDesc.includes(activeLw)) {
        scorerId = squadFormation["LW"]; scorerName = activeLw;
        assisterId = squadFormation["CM"]; assisterName = activeCm;
    } else if (attackDesc.includes(activeAttacker)) {
        scorerId = squadFormation["ST"]; scorerName = activeAttacker;
    } else {
        scorerId = squadFormation["RW"]; scorerName = activeRw;
        assisterId = squadFormation["CM"]; assisterName = activeCm;
    }
    
    if (scorerId) registerGoal(scorerId, scorerName, 'jeonbuk', '전북 현대');
    if (assisterId && Math.random() < 0.8) registerAssist(assisterId, assisterName, 'jeonbuk', '전북 현대');
}

function simulateOtherPlayersStats() {
    if (typeof OTHER_TEAMS_PLAYERS_PRESET !== 'undefined') {
        OTHER_TEAMS_PLAYERS_PRESET.forEach(p => {
            // Roll for goal (15% chance, approx 0.15 per match)
            if (Math.random() < 0.15) {
                registerGoal(p.id, p.name, p.teamId, p.teamName);
            }
            // Roll for assist (10% chance, approx 0.10 per match)
            if (Math.random() < 0.10) {
                registerAssist(p.id, p.name, p.teamId, p.teamName);
            }
        });
    }
    
    try {
        localStorage.setItem('fc_star_league_stats', JSON.stringify(leaguePlayerStats));
    } catch (e) {
        console.warn("Saving league stats failed", e);
    }
    
    renderLeagueStats();
}

function renderLeagueStats() {
    const goalsBody = document.getElementById('leagueGoalsBody');
    const assistsBody = document.getElementById('leagueAssistsBody');
    
    if (!goalsBody || !assistsBody) return;
    
    const playersArray = Object.values(leaguePlayerStats || {});
    
    // 1. Render Goals Leaderboard (Top 5)
    const sortedGoals = [...playersArray]
        .filter(p => p.goals > 0)
        .sort((a, b) => {
            if (b.goals !== a.goals) return b.goals - a.goals;
            if (b.assists !== a.assists) return b.assists - a.assists;
            return a.name.localeCompare(b.name, 'ko');
        })
        .slice(0, 5);
        
    goalsBody.innerHTML = '';
    if (sortedGoals.length === 0) {
        goalsBody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: #64748b; padding: 10px;">기록된 득점이 없습니다.</td></tr>`;
    } else {
        sortedGoals.forEach((p, idx) => {
            const rank = idx + 1;
            const isJeonbuk = p.teamId === 'jeonbuk';
            const rowStyle = isJeonbuk ? 'style="background: rgba(0, 255, 135, 0.08); font-weight: bold; color: #ffd700;"' : '';
            goalsBody.innerHTML += `
                <tr ${rowStyle} style="border-bottom: 1px solid rgba(255, 255, 255, 0.05);">
                    <td style="padding: 6px; text-align: center;">${rank}</td>
                    <td style="padding: 6px;">${p.name}</td>
                    <td style="padding: 6px; color: #94a3b8; font-size: 0.72rem;">${p.teamName}</td>
                    <td style="padding: 6px; text-align: center; font-weight: bold; color: #ffd700;">${p.goals}</td>
                </tr>
            `;
        });
    }
    
    // 2. Render Assists Leaderboard (Top 5)
    const sortedAssists = [...playersArray]
        .filter(p => p.assists > 0)
        .sort((a, b) => {
            if (b.assists !== a.assists) return b.assists - a.assists;
            if (b.goals !== a.goals) return b.goals - a.goals;
            return a.name.localeCompare(b.name, 'ko');
        })
        .slice(0, 5);
        
    assistsBody.innerHTML = '';
    if (sortedAssists.length === 0) {
        assistsBody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: #64748b; padding: 10px;">기록된 도움이 없습니다.</td></tr>`;
    } else {
        sortedAssists.forEach((p, idx) => {
            const rank = idx + 1;
            const isJeonbuk = p.teamId === 'jeonbuk';
            const rowStyle = isJeonbuk ? 'style="background: rgba(0, 255, 135, 0.08); font-weight: bold; color: #00ff87;"' : '';
            assistsBody.innerHTML += `
                <tr ${rowStyle} style="border-bottom: 1px solid rgba(255, 255, 255, 0.05);">
                    <td style="padding: 6px; text-align: center;">${rank}</td>
                    <td style="padding: 6px;">${p.name}</td>
                    <td style="padding: 6px; color: #94a3b8; font-size: 0.72rem;">${p.teamName}</td>
                    <td style="padding: 6px; text-align: center; font-weight: bold; color: #00ff87;">${p.assists}</td>
                </tr>
            `;
        });
    }
}

function initLeague() {
    try {
        const savedTeams = localStorage.getItem('fc_star_league_teams');
        const savedRound = localStorage.getItem('fc_star_league_round');
        const savedYear = localStorage.getItem('fc_star_league_year');
        const savedFame = localStorage.getItem('fc_star_hall_of_fame');
        const savedMatchDate = localStorage.getItem('fc_star_match_last_date');
        const savedStats = localStorage.getItem('fc_star_league_stats');
        
        if (savedTeams && savedRound) {
            leagueTeams = JSON.parse(savedTeams);
            leagueRound = parseInt(savedRound);
        } else {
            resetLeagueSeasonState();
        }
        
        if (savedStats) {
            leaguePlayerStats = JSON.parse(savedStats);
            // 2026시즌 이적 시장 및 선수명 개편 반영 동기화 (기존 저장 데이터 보정)
            if (typeof OTHER_TEAMS_PLAYERS_PRESET !== 'undefined') {
                // 1. 구 ID 매핑 보정 (lingard -> anderson, gabriel -> fridjonsson, wanderson -> lee_ho_jae)
                const idMapping = {
                    "lingard": "anderson",
                    "gabriel": "fridjonsson",
                    "wanderson": "lee_ho_jae"
                };
                Object.keys(idMapping).forEach(oldId => {
                    const newId = idMapping[oldId];
                    if (leaguePlayerStats[oldId] && !leaguePlayerStats[newId]) {
                        leaguePlayerStats[newId] = leaguePlayerStats[oldId];
                        leaguePlayerStats[newId].id = newId;
                        delete leaguePlayerStats[oldId];
                    }
                });

                // 2. 이름 및 소속팀 최신화 동기화
                OTHER_TEAMS_PLAYERS_PRESET.forEach(p => {
                    if (leaguePlayerStats[p.id]) {
                        leaguePlayerStats[p.id].name = p.name;
                        leaguePlayerStats[p.id].teamId = p.teamId;
                        leaguePlayerStats[p.id].teamName = p.teamName;
                    } else {
                        // 세션 도중 새로 추가된 선수가 있다면 등록
                        leaguePlayerStats[p.id] = {
                            id: p.id,
                            name: p.name,
                            teamId: p.teamId,
                            teamName: p.teamName,
                            goals: 0,
                            assists: 0
                        };
                    }
                });
            }
        } else {
            initLeaguePlayerStats();
        }
        
        if (savedYear) leagueYear = parseInt(savedYear) || 2026;
        if (savedFame) hallOfFame = JSON.parse(savedFame) || [];
        if (savedMatchDate) matchLastDate = savedMatchDate;
        const savedMatchTodayCount = localStorage.getItem('fc_star_match_today_count');
        if (savedMatchTodayCount) matchTodayCount = parseInt(savedMatchTodayCount) || 0;
        
        const savedCareer = localStorage.getItem('fc_star_career_stats');
        if (savedCareer) {
            careerStats = JSON.parse(savedCareer);
        } else {
            careerStats = { w: 0, d: 0, l: 0, gf: 0, ga: 0, playerGoals: {} };
        }
    } catch(e) {
        resetLeagueSeasonState();
    }
    
    // Sync Jeonbuk OVR with current active formation
    syncJeonbukOvr();
    renderLeagueTable();
    updateMatchPreviewBoard();
    renderLeagueStats();
    renderCareerStats();
}

function syncJeonbukOvr() {
    let totalOvr = 0;
    TACTICAL_POSITIONS.forEach(pos => {
        const cardId = squadFormation[pos];
        if (cardId && CARDS_DATABASE[cardId]) {
            totalOvr += getAwakenedCard(cardId).rating;
        } else {
            totalOvr += 70;
        }
    });
    const avgOvr = Math.round(totalOvr / 11);
    
    const jb = leagueTeams.find(t => t.id === 'jeonbuk');
    if (jb) {
        jb.rating = avgOvr;
    }
}

function resetLeagueSeasonState() {
    leagueTeams = JSON.parse(JSON.stringify(K_LEAGUE_TEAMS_PRESET));
    leagueRound = 1;
    initLeaguePlayerStats();
    
    try {
        localStorage.setItem('fc_star_league_teams', JSON.stringify(leagueTeams));
        localStorage.setItem('fc_star_league_round', leagueRound.toString());
        localStorage.setItem('fc_star_league_stats', JSON.stringify(leaguePlayerStats));
    } catch (e) {
        console.warn("Saving reset league failed", e);
    }
}

function resetLeagueSeason() {
    if (isMatchRunning) return;
    
    resetLeagueSeasonState();
    syncJeonbukOvr();
    renderLeagueTable();
    renderLeagueStats();
    updateMatchPreviewBoard();
    
    // Clear commentary
    const commBox = document.getElementById('commentaryScroll');
    commBox.innerHTML = '<div class="comm-item comm-system">시즌이 초기화되었습니다. 경기를 시작하려면 아래 \'경기 시작\' 버튼을 누르세요.</div>';
    
    showToast("리그 시즌이 성공적으로 초기화되었습니다!");
    
    // Auto-save user data to cloud
    saveUserProgress();
}

function getTeamEmblemPath(teamId) {
    const mapping = {
        "jeonbuk": "img/mark_jb.svg",
        "ulsan": "img/mark_ulsan.png",
        "seoul": "img/mark_seoul.png",
        "pohang": "img/mark_pohang.png",
        "gangwon": "img/mark_gangwon.png",
        "gwangju": "img/mark_gwangju.png",
        "gimcheon": "img/mark_kc.png",
        "bucheon_fc": "img/mark_buchn.png",
        "jeju": "img/mark_jeju.png",
        "daejeon": "img/mark_dj.png",
        "anyang": "img/mark_anyang.png",
        "incheon": "img/mark_incheon.png"
    };
    return mapping[teamId] || "img/mark_jb.svg";
}

function updateMatchPreviewBoard() {
    // 오늘의 경기 진행 횟수 UI 업데이트
    const matchTodayCountValEl = document.getElementById('matchTodayCountVal');
    if (matchTodayCountValEl) {
        const todayStr = new Date().toLocaleDateString('ko-KR');
        const displayCount = (matchLastDate === todayStr) ? matchTodayCount : 0;
        matchTodayCountValEl.innerText = displayCount;
    }

    if (leagueRound > 11) {
        // Season completed
        document.getElementById('matchRoundVal').innerText = "11";
        document.getElementById('sbTimeDisplay').innerText = "끝";
        document.getElementById('homeTeamName').innerText = "시즌";
        document.getElementById('awayTeamName').innerText = "종료";
        document.getElementById('homeScore').innerText = "-";
        document.getElementById('awayScore').innerText = "-";
        document.getElementById('matchVenueDisplay').innerText = "시즌이 모두 종료되었습니다. 리셋을 눌러 새 시즌을 시작하세요!";
        return;
    }
    
    const fixture = JEONBUK_FIXTURES[leagueRound - 1];
    const opponent = leagueTeams.find(t => t.id === fixture.opponent);
    const jeonbuk = leagueTeams.find(t => t.id === 'jeonbuk');
    
    document.getElementById('matchRoundVal').innerText = leagueRound;
    document.getElementById('sbTimeDisplay').innerText = "VS";
    document.getElementById('homeScore').innerText = "0";
    document.getElementById('awayScore').innerText = "0";
    
    if (fixture.isHome) {
        document.getElementById('homeTeamName').innerText = jeonbuk.name;
        document.getElementById('homeTeamOvr').innerText = jeonbuk.rating;
        document.getElementById('homeEmblem').innerHTML = `<img src="img/mark_jb.svg" alt="전북 현대" class="match-emblem-img" style="height: 48px; width: 48px; filter: drop-shadow(0 0 10px rgba(0, 255, 135, 0.6));">`;
        
        document.getElementById('awayTeamName').innerText = opponent.name;
        document.getElementById('awayTeamOvr').innerText = opponent.rating;
        document.getElementById('awayEmblem').innerHTML = `<img src="${getTeamEmblemPath(opponent.id)}" alt="${opponent.name}" class="match-emblem-img" style="height: 48px; width: 48px; filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.35)); object-fit: contain;">`;
        
        document.getElementById('matchVenueDisplay').innerText = "홈 경기 (전주성) - HOME ADVANTAGE +3 OVR";
    } else {
        document.getElementById('homeTeamName').innerText = opponent.name;
        document.getElementById('homeTeamOvr').innerText = opponent.rating;
        document.getElementById('homeEmblem').innerHTML = `<img src="${getTeamEmblemPath(opponent.id)}" alt="${opponent.name}" class="match-emblem-img" style="height: 48px; width: 48px; filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.35)); object-fit: contain;">`;
        
        document.getElementById('awayTeamName').innerText = jeonbuk.name;
        document.getElementById('awayTeamOvr').innerText = jeonbuk.rating;
        document.getElementById('awayEmblem').innerHTML = `<img src="img/mark_jb.svg" alt="전북 현대" class="match-emblem-img" style="height: 48px; width: 48px; filter: drop-shadow(0 0 10px rgba(0, 255, 135, 0.6));">`;
        
        document.getElementById('matchVenueDisplay').innerText = "원정 경기 - AWAY PENALTY";
    }
}

function renderLeagueTable() {
    const titleEl = document.getElementById('leagueTableTitle');
    if (titleEl) {
        titleEl.innerHTML = `<i class="fa-solid fa-ranking-star" style="margin-right: 8px; color: #ffd700;"></i>${leagueYear} K리그1 실시간 순위`;
    }

    const tbody = document.getElementById('leagueTableBody');
    tbody.innerHTML = '';
    
    // Sort Standings: 1. PTS (desc), 2. GD (desc), 3. GF (desc)
    const sorted = [...leagueTeams].sort((a, b) => {
        if (b.pts !== a.pts) return b.pts - a.pts;
        if (b.gd !== a.gd) return b.gd - a.gd;
        return b.gf - a.gf;
    });
    
    sorted.forEach((team, idx) => {
        const rank = idx + 1;
        const row = document.createElement('tr');
        
        if (team.id === 'jeonbuk') {
            row.className = 'league-row-jeonbuk';
        }
        
        const gdSign = team.gd > 0 ? `+${team.gd}` : team.gd;
        
        row.innerHTML = `
            <td class="league-row-rank">${rank}</td>
            <td class="league-team-col">
                <img src="${getTeamEmblemPath(team.id)}" alt="${team.name}">
                <span>${team.name}</span>
            </td>
            <td>${team.p}</td>
            <td class="league-row-pts">${team.pts}</td>
            <td>${team.w}</td>
            <td>${team.d}</td>
            <td>${team.l}</td>
            <td>${gdSign}</td>
        `;
        
        tbody.appendChild(row);
    });
}

// 12. HIGH-FIDELITY MATCH TEXT BROADCAST SIMULATOR
function startMatchSimulation() {
    if (isMatchRunning) return;
    if (leagueRound > 11) {
        showToast("시즌이 종료되었습니다. 우측 상단의 '시즌 리셋'을 진행해주세요!");
        return;
    }
    
    const todayStr = new Date().toLocaleDateString('ko-KR');
    
    // 날짜가 변경되었을 경우 오늘의 경기 진행수 초기화
    if (matchLastDate !== todayStr) {
        matchTodayCount = 0;
        localStorage.setItem('fc_star_match_today_count', '0');
    }
    
    // 일 단위 경기 진행 제한 체크 (개발자 모드 아닐 시 하루 3경기만 가능)
    if (!isDeveloperMode && matchTodayCount >= 3) {
        showToast("⚠️ 경기는 하루에 최대 3경기만 진행할 수 있습니다! 내일 다시 도전해 주세요.");
        return;
    }
    
    // Ensure Jeonbuk stats are synchronized
    syncJeonbukOvr();
    
    isMatchRunning = true;
    
    const startBtn = document.getElementById('btnStartMatch');
    startBtn.disabled = true;
    startBtn.style.background = 'rgba(255, 255, 255, 0.05)';
    startBtn.style.color = 'var(--text-muted)';
    startBtn.style.cursor = 'not-allowed';
    
    const fixture = JEONBUK_FIXTURES[leagueRound - 1];
    const opponent = leagueTeams.find(t => t.id === fixture.opponent);
    const jeonbuk = leagueTeams.find(t => t.id === 'jeonbuk');
    
    const isPlayerHome = fixture.isHome;
    const playerOvrBase = jeonbuk.rating;
    const opponentOvrBase = opponent.rating;
    
    // 1. Home-Away Advantage configuration (+3 OVR)
    const playerOvr = isPlayerHome ? playerOvrBase + 3 : playerOvrBase;
    const opponentOvr = !isPlayerHome ? opponentOvrBase + 3 : opponentOvrBase;
    const diff = playerOvr - opponentOvr;
    
    // Score counters
    let playerScoreVal = 0;
    let opponentScoreVal = 0;
    
    // 2. Play starting whistle sound
    playSound('reveal');
    
    // Clear commentary box
    const commBox = document.getElementById('commentaryScroll');
    commBox.innerHTML = '';
    
    const addCommentary = (min, text, type = 'normal') => {
        const item = document.createElement('div');
        item.className = `comm-item comm-${type}`;
        
        const timestamp = min === 'SYSTEM' || min === 'FT' ? '' : `<strong style="color:#ffd700; margin-right: 6px;">${min}'</strong>`;
        item.innerHTML = `${timestamp}${text}`;
        
        commBox.appendChild(item);
        commBox.scrollTop = commBox.scrollHeight;
    };
    
    // Clock tick simulator: 10 ticks representing match timeline
    const matchMinutes = [0, 15, 30, 45, 52, 63, 74, 82, 88, 90];
    let tickIdx = 0;
    
    addCommentary('SYSTEM', `경기 시작 전력 분석 | 전북 OVR ${playerOvrBase} (${isPlayerHome ? '홈' : '원정'}) vs ${opponent.name} OVR ${opponentOvrBase}`, 'system');
    
    const sbTimeDisplay = document.getElementById('sbTimeDisplay');
    sbTimeDisplay.classList.add('live-ticking');
    
    // Attack Event Generators (5 key attacks simulated at minutes 15, 45, 63, 82, 88)
    const eventMins = [15, 45, 63, 82, 88];
    
    // Retreive active player names in key positions for personalized commentaries
    const activeAttacker = squadFormation["ST"] ? CARDS_DATABASE[squadFormation["ST"]].name : "무명 스트라이커";
    const activeLw = squadFormation["LW"] ? CARDS_DATABASE[squadFormation["LW"]].name : "무명 윙어";
    const activeRw = squadFormation["RW"] ? CARDS_DATABASE[squadFormation["RW"]].name : "무명 윙백";
    const activeCm = squadFormation["CM"] ? CARDS_DATABASE[squadFormation["CM"]].name : "무명 미드필더";
    const activeGk = squadFormation["GK"] ? CARDS_DATABASE[squadFormation["GK"]].name : "무명 골키퍼";
    
    // 3. CALIBRATED WIN PROBABILITY ALGORITHM (Diff = playerOvr - opponentOvr)
    // Capped probabilities to balance the luck and stats
    const playerAttackProb = Math.min(0.85, Math.max(0.2, 0.5 + (diff * 0.038)));
    
    // 개발자 모드: 대기 없이 즉시 시뮬레이션 결과 연산 및 출력
    if (isDeveloperMode) {
        sbTimeDisplay.classList.remove('live-ticking');
        sbTimeDisplay.innerText = "종료";
        
        matchMinutes.forEach(currentMin => {
            if (currentMin === 0) {
                addCommentary(0, `주심의 힘찬 휘슬 소리와 함께 전반전 경기가 시작됩니다! 양 팀 조심스러운 탐색전이 이어집니다.`, 'normal');
            } else if (eventMins.includes(currentMin)) {
                const isPlayerAttack = Math.random() < playerAttackProb;
                if (isPlayerAttack) {
                    const scoreProb = Math.min(0.88, Math.max(0.1, 0.35 + (diff * 0.026)));
                    const isGoal = Math.random() < scoreProb;
                    const attackTypes = [
                        {
                            desc: `${activeLw} 선수가 폭발적인 속도로 왼쪽 측면을 흔듭니다! 수비수를 제치고 강력하게 슛!`,
                            goal: `골!!! ${activeLw}의 환상적인 감아차기 슛이 골문 오른쪽 구석에 정확히 꽂힙니다! 전북 득점!! 🎉`,
                            fail: `아아! 마지막 순간 상대 수비수의 육탄 방어에 가로막히며 코너킥으로 연결됩니다.`
                        },
                        {
                            desc: `전방에서 강한 압박으로 공을 탈취한 ${activeAttacker}! 일대일 단독 찬스에 직면하여 슛 시도!`,
                            goal: `골!!! ${activeAttacker}가 침착하게 골키퍼 키를 넘기는 칩슛으로 골망을 흔듭니다! 그림 같은 선제골! ⚽`,
                            fail: `앗! 슛이 너무 강했습니다. 크로스바를 살짝 빗나가며 아쉬움을 삼킵니다.`
                        },
                        {
                            desc: `${activeCm} 선수의 창의적인 킬패스가 배후 공간을 무력화시킵니다! 뛰어 들어가는 ${activeRw}! 슛!`,
                            goal: `골!!! ${activeRw}가 몸을 날리는 멋진 발리 슛으로 골을 선사합니다! 멋진 팀워크 플레이! 🥳`,
                            fail: `키퍼의 슈퍼세이브! 상대 수문장이 온몸으로 막아내며 아쉬운 득점 찬스가 무산됩니다.`
                        }
                    ];
                    const selectedAttack = attackTypes[Math.floor(Math.random() * attackTypes.length)];
                    addCommentary(currentMin, selectedAttack.desc, 'attack');
                    if (isGoal) {
                        playerScoreVal++;
                        processPlayerGoal(selectedAttack.desc);
                        addCommentary(currentMin, selectedAttack.goal, 'goal');
                    } else {
                        addCommentary(currentMin, selectedAttack.fail, 'normal');
                    }
                } else {
                    const scoreProb = Math.min(0.88, Math.max(0.08, 0.35 - (diff * 0.026)));
                    const isGoal = Math.random() < scoreProb;
                    addCommentary(currentMin, `상대팀이 중원에서 패스워크를 맞추며 우리 진영을 위협합니다. 문전 앞 혼전 상황!`, 'attack');
                    if (isGoal) {
                        opponentScoreVal++;
                        addCommentary(currentMin, `실점! 상대 공격수의 기습적인 헤더 슛이 ${activeGk} 골키퍼의 손끝을 스치며 골문으로 밀려 들어갑니다.`, 'normal');
                    } else {
                        addCommentary(currentMin, `${activeGk} 골키퍼의 빛나는 판단력! 침착하게 날아오는 크로스를 캐칭해 냅니다. 위기를 넘깁니다!`, 'normal');
                    }
                }
            } else if (currentMin === 45) {
                addCommentary('HT', `치열했던 전반전 경기가 마무리됩니다. 라커룸으로 향하는 선수들. 현재 스코어 ${isPlayerHome ? playerScoreVal : opponentScoreVal} - ${isPlayerHome ? opponentScoreVal : playerScoreVal}`, 'system');
            }
        });

        if (isPlayerHome) {
            document.getElementById('homeScore').innerText = playerScoreVal;
            document.getElementById('awayScore').innerText = opponentScoreVal;
        } else {
            document.getElementById('homeScore').innerText = opponentScoreVal;
            document.getElementById('awayScore').innerText = playerScoreVal;
        }

        const isWinner = playerScoreVal > opponentScoreVal;
        const isDraw = playerScoreVal === opponentScoreVal;
        
        addCommentary('FT', `삐- 삐- 삐--! 경기 종료! 양 팀 피땀 흘린 치열한 승부가 마침내 막을 내립니다!`, 'system');
        if (isWinner) {
            addCommentary('FT', `승리!!! 전북 현대가 완벽한 전술 장악과 에이스들의 빛나는 골 활약에 힘입어 ${playerScoreVal} - ${opponentScoreVal} 짜릿한 승리를 챙깁니다! 🏆`, 'goal');
        } else if (isDraw) {
            addCommentary('FT', `무승부! 양 팀 승부를 가리지 못하며 ${playerScoreVal} - ${opponentScoreVal} 로 승점 1점씩 나누어 가집니다. 다음 라운드 반등을 노립니다.`, 'system');
        } else {
            addCommentary('FT', `패배! 전북 현대가 분전했으나 상대의 기습 카운터 공격을 넘지 못하며 ${playerScoreVal} - ${opponentScoreVal} 아쉬운 승점 3점을 내줍니다. 피드백이 필요합니다.`, 'normal');
        }

        const jb = leagueTeams.find(t => t.id === 'jeonbuk');
        const opp = leagueTeams.find(t => t.id === opponent.id);
        
        jb.p += 1; jb.gf += playerScoreVal; jb.ga += opponentScoreVal; jb.gd = jb.gf - jb.ga;
        opp.p += 1; opp.gf += opponentScoreVal; opp.ga += playerScoreVal; opp.gd = opp.gf - opp.ga;
        
        if (isWinner) { jb.w += 1; jb.pts += 3; opp.l += 1; }
        else if (isDraw) { jb.d += 1; jb.pts += 1; opp.d += 1; opp.pts += 1; }
        else { jb.l += 1; opp.w += 1; opp.pts += 3; }

        simulateOtherMatches(fixture.opponent);
        leagueRound += 1;

        // 경기 완료 데이터 및 날짜 저장
        if (matchLastDate !== todayStr) {
            matchLastDate = todayStr;
            matchTodayCount = 1;
        } else {
            matchTodayCount += 1;
        }
        
        // 경기 승패 무관 1 FP 지급
        userPoints += 1;
        
        try {
            localStorage.setItem('fc_star_league_teams', JSON.stringify(leagueTeams));
            localStorage.setItem('fc_star_league_round', leagueRound.toString());
            localStorage.setItem('fc_star_match_last_date', matchLastDate);
            localStorage.setItem('fc_star_match_today_count', matchTodayCount.toString());
            localStorage.setItem('fc_star_user_points', userPoints.toString());
        } catch(e) {}

        renderUserPoints();
        renderLeagueTable();
        isMatchRunning = false;
        
        startBtn.disabled = false;
        startBtn.style.background = '';
        startBtn.style.color = '';
        startBtn.style.cursor = '';

        if (leagueRound > 11) {
            checkSeasonChampion();
        } else {
            updateMatchPreviewBoard();
            showToast(`⚡ [개발자 모드] 결과 즉시 출력 및 +1 FP 획득 완료!`);
        }
        
        saveUserProgress();
        return;
    }
    
    const matchTimer = setInterval(() => {
        const currentMin = matchMinutes[tickIdx];
        sbTimeDisplay.innerText = `${currentMin}'`;
        
        if (currentMin === 0) {
            addCommentary(0, `주심의 힘찬 휘슬 소리와 함께 전반전 경기가 시작됩니다! 양 팀 조심스러운 탐색전이 이어집니다.`, 'normal');
        } else if (eventMins.includes(currentMin)) {
            // Simulated Attack Event
            const isPlayerAttack = Math.random() < playerAttackProb;
            
            if (isPlayerAttack) {
                // Player Attack chance
                const scoreProb = Math.min(0.88, Math.max(0.1, 0.35 + (diff * 0.026)));
                const isGoal = Math.random() < scoreProb;
                
                // Customize commentary text using line up players
                const attackTypes = [
                    {
                        desc: `${activeLw} 선수가 폭발적인 속도로 왼쪽 측면을 흔듭니다! 수비수를 제치고 강력하게 슛!`,
                        goal: `골!!! ${activeLw}의 환상적인 감아차기 슛이 골문 오른쪽 구석에 정확히 꽂힙니다! 전북 득점!! 🎉`,
                        fail: `아아! 마지막 순간 상대 수비수의 육탄 방어에 가로막히며 코너킥으로 연결됩니다.`
                    },
                    {
                        desc: `전방에서 강한 압박으로 공을 탈취한 ${activeAttacker}! 일대일 단독 찬스에 직면하여 슛 시도!`,
                        goal: `골!!! ${activeAttacker}가 침착하게 골키퍼 키를 넘기는 칩슛으로 골망을 흔듭니다! 그림 같은 선제골! ⚽`,
                        fail: `앗! 슛이 너무 강했습니다. 크로스바를 살짝 빗나가며 아쉬움을 삼킵니다.`
                    },
                    {
                        desc: `${activeCm} 선수의 창의적인 킬패스가 배후 공간을 무력화시킵니다! 뛰어 들어가는 ${activeRw}! 슛!`,
                        goal: `골!!! ${activeRw}가 몸을 날리는 멋진 발리 슛으로 골을 선사합니다! 멋진 팀워크 플레이! 🥳`,
                        fail: `키퍼의 슈퍼세이브! 상대 수문장이 온몸으로 막아내며 아쉬운 득점 찬스가 무산됩니다.`
                    }
                ];
                
                const selectedAttack = attackTypes[Math.floor(Math.random() * attackTypes.length)];
                addCommentary(currentMin, selectedAttack.desc, 'attack');
                
                if (isGoal) {
                    playerScoreVal++;
                    processPlayerGoal(selectedAttack.desc);
                    playSound('reveal');
                    
                    if (isPlayerHome) {
                        document.getElementById('homeScore').innerText = playerScoreVal;
                    } else {
                        document.getElementById('awayScore').innerText = playerScoreVal;
                    }
                    
                    setTimeout(() => {
                        addCommentary(currentMin, selectedAttack.goal, 'goal');
                    }, 450);
                } else {
                    setTimeout(() => {
                        addCommentary(currentMin, selectedAttack.fail, 'normal');
                    }, 450);
                }
            } else {
                // Opponent Attack chance
                const scoreProb = Math.min(0.88, Math.max(0.08, 0.35 - (diff * 0.026)));
                const isGoal = Math.random() < scoreProb;
                
                addCommentary(currentMin, `상대팀이 중원에서 패스워크를 맞추며 우리 진영을 위협합니다. 문전 앞 혼전 상황!`, 'attack');
                
                if (isGoal) {
                    opponentScoreVal++;
                    playSound('rumble');
                    
                    if (isPlayerHome) {
                        document.getElementById('awayScore').innerText = opponentScoreVal;
                    } else {
                        document.getElementById('homeScore').innerText = opponentScoreVal;
                    }
                    
                    setTimeout(() => {
                        addCommentary(currentMin, `실점! 상대 공격수의 기습적인 헤더 슛이 ${activeGk} 골키퍼의 손끝을 스치며 골문으로 밀려 들어갑니다.`, 'normal');
                    }, 450);
                } else {
                    setTimeout(() => {
                        addCommentary(currentMin, `${activeGk} 골키퍼의 빛나는 판단력! 침착하게 날아오는 크로스를 캐칭해 냅니다. 위기를 넘깁니다!`, 'normal');
                    }, 450);
                }
            }
        } else if (currentMin === 45) {
            addCommentary('HT', `치열했던 전반전 경기가 마무리됩니다. 라커룸으로 향하는 선수들. 현재 스코어 ${isPlayerHome ? playerScoreVal : opponentScoreVal} - ${isPlayerHome ? opponentScoreVal : playerScoreVal}`, 'system');
        } else if (currentMin === 90) {
            // Full time whistle
            sbTimeDisplay.innerText = "종료";
            sbTimeDisplay.classList.remove('live-ticking');
            playSound('reveal');
            
            clearInterval(matchTimer);
            
            const isWinner = playerScoreVal > opponentScoreVal;
            const isDraw = playerScoreVal === opponentScoreVal;
            
            addCommentary('FT', `삐- 삐- 삐--! 경기 종료! 양 팀 피땀 흘린 치열한 승부가 마침내 막을 내립니다!`, 'system');
            
            if (isWinner) {
                addCommentary('FT', `승리!!! 전북 현대가 완벽한 전술 장악과 에이스들의 빛나는 골 활약에 힘입어 ${playerScoreVal} - ${opponentScoreVal} 짜릿한 승리를 챙깁니다! 🏆`, 'goal');
            } else if (isDraw) {
                addCommentary('FT', `무승부! 양 팀 승부를 가리지 못하며 ${playerScoreVal} - ${opponentScoreVal} 로 승점 1점씩 나누어 가집니다. 다음 라운드 반등을 노립니다.`, 'system');
            } else {
                addCommentary('FT', `패배! 전북 현대가 분전했으나 상대의 기습 카운터 공격을 넘지 못하며 ${playerScoreVal} - ${opponentScoreVal} 아쉬운 승점 3점을 내줍니다. 피드백이 필요합니다.`, 'normal');
            }
            
            // 4. Update Standing Points
            const jb = leagueTeams.find(t => t.id === 'jeonbuk');
            const opp = leagueTeams.find(t => t.id === opponent.id);
            
            jb.p += 1;
            jb.gf += playerScoreVal;
            jb.ga += opponentScoreVal;
            jb.gd = jb.gf - jb.ga;
            
            opp.p += 1;
            opp.gf += opponentScoreVal;
            opp.ga += playerScoreVal;
            opp.gd = opp.gf - opp.ga;
            
            if (isWinner) {
                jb.w += 1; jb.pts += 3;
                opp.l += 1;
            } else if (isDraw) {
                jb.d += 1; jb.pts += 1;
                opp.d += 1; opp.pts += 1;
            } else {
                jb.l += 1;
                opp.w += 1; opp.pts += 3;
            }
            
            // 5. Simulate all other 5 K League fixtures for this round
            simulateOtherMatches(fixture.opponent);
            
            // Increase round
            leagueRound += 1;
            
            // 하루 제한용 일시 기록
            if (matchLastDate !== todayStr) {
                matchLastDate = todayStr;
                matchTodayCount = 1;
            } else {
                matchTodayCount += 1;
            }
            
            // 경기 승패 무관 1 FP 지급
            userPoints += 1;

            try {
                localStorage.setItem('fc_star_league_teams', JSON.stringify(leagueTeams));
                localStorage.setItem('fc_star_league_round', leagueRound.toString());
                localStorage.setItem('fc_star_match_last_date', matchLastDate);
                localStorage.setItem('fc_star_match_today_count', matchTodayCount.toString());
                localStorage.setItem('fc_star_user_points', userPoints.toString());
            } catch(e) {
                console.warn("Saving standing failed", e);
            }
            
            renderUserPoints();
            renderLeagueTable();
            isMatchRunning = false;
            
            // Unlock start button
            startBtn.disabled = false;
            startBtn.style.background = '';
            startBtn.style.color = '';
            startBtn.style.cursor = '';
            
            // Check season completion celebrating
            if (leagueRound > 11) {
                setTimeout(() => {
                    checkSeasonChampion();
                }, 1000);
            } else {
                // Update match preview for next round
                setTimeout(() => {
                    updateMatchPreviewBoard();
                    showToast(`🏆 경기 완료 보상으로 +1 FP 획득! (하루 최대 3경기 제한)`);
                }, 2000);
            }
            
            // Auto-save progress
            saveUserProgress();
        }
        
        tickIdx++;
    }, 1100); // Ticks run roughly every 1.1s to hit the ~10s duration constraint perfectly
}

// 6. SIMULATE OTHER MATCHES IN K LEAGUE WITH HOME-AWAY & LUCK GRADIENTS
function simulateOtherMatches(opponentId) {
    const roundFixtures = [];
    const availableTeams = leagueTeams.filter(t => t.id !== 'jeonbuk' && t.id !== opponentId);
    
    // Shuffle available teams to pair them randomly for simulation
    const shuffled = [...availableTeams].sort(() => 0.5 - Math.random());
    
    for (let i = 0; i < shuffled.length; i += 2) {
        if (i + 1 < shuffled.length) {
            roundFixtures.push({ home: shuffled[i], away: shuffled[i+1] });
        }
    }
    
    roundFixtures.forEach(fix => {
        const home = leagueTeams.find(t => t.id === fix.home.id);
        const away = leagueTeams.find(t => t.id === fix.away.id);
        
        // Home advantage (+3 OVR)
        const homeRating = home.rating + 3;
        const awayRating = away.rating;
        const diff = homeRating - awayRating;
        
        // Calibrate expectations using diff
        const expHome = Math.max(0.3, 1.4 + (diff * 0.05));
        const expAway = Math.max(0.3, 1.4 - (diff * 0.05));
        
        // Luck factor: add poisson/random noise goals
        const homeGoals = Math.max(0, Math.round(expHome + (Math.random() * 2.5 - 1.25)));
        const awayGoals = Math.max(0, Math.round(expAway + (Math.random() * 2.5 - 1.25)));
        
        home.p += 1;
        home.gf += homeGoals;
        home.ga += awayGoals;
        home.gd = home.gf - home.ga;
        
        away.p += 1;
        away.gf += awayGoals;
        away.ga += homeGoals;
        away.gd = away.gf - away.ga;
        
        if (homeGoals > awayGoals) {
            home.w += 1; home.pts += 3;
            away.l += 1;
        } else if (homeGoals === awayGoals) {
            home.d += 1; home.pts += 1;
            away.d += 1; away.pts += 1;
        } else {
            home.l += 1;
            away.w += 1; away.pts += 3;
        }
    });
    
    simulateOtherPlayersStats();
}

function getTopScorerAndAssister() {
    const playersArray = Object.values(leaguePlayerStats || {});
    if (playersArray.length === 0) return { topScorer: null, topAssister: null };
    
    const sortedGoals = [...playersArray].sort((a, b) => {
        if (b.goals !== a.goals) return b.goals - a.goals;
        return b.assists - a.assists;
    });
    
    const sortedAssists = [...playersArray].sort((a, b) => {
        if (b.assists !== a.assists) return b.assists - a.assists;
        return b.goals - a.goals;
    });
    
    const topScorer = sortedGoals[0] && sortedGoals[0].goals > 0 ? sortedGoals[0] : null;
    const topAssister = sortedAssists[0] && sortedAssists[0].assists > 0 ? sortedAssists[0] : null;
    
    return { topScorer, topAssister };
}

// 7. CHECK SEASON WINNER CELEBRATION
function checkSeasonChampion() {
    const sorted = [...leagueTeams].sort((a, b) => {
        if (b.pts !== a.pts) return b.pts - a.pts;
        if (b.gd !== a.gd) return b.gd - a.gd;
        return b.gf - a.gf;
    });
    
    const champion = sorted[0];
    const jb = sorted.find(t => t.id === 'jeonbuk');
    const jbRank = sorted.findIndex(t => t.id === 'jeonbuk') + 1;
    const isJeonbukChamp = champion.id === 'jeonbuk';
    
    // Stop starts previews
    document.getElementById('matchVenueDisplay').innerText = `${leagueYear} 시즌 종료! 명예의 전당 등록 및 다음 시즌을 준비하세요.`;
    document.getElementById('sbTimeDisplay').innerText = "끝";
    
    // 1. 명예의 전당에 전적 기록 등록
    const { topScorer, topAssister } = getTopScorerAndAssister();
    
    const record = {
        year: leagueYear,
        jeonbukRank: jbRank,
        jeonbukRecord: {
            w: jb.w,
            d: jb.d,
            l: jb.l,
            pts: jb.pts
        },
        champion: champion.name,
        topScorer: (topScorer && topScorer.teamId === 'jeonbuk') ? { name: topScorer.name, goals: topScorer.goals } : null,
        topAssister: (topAssister && topAssister.teamId === 'jeonbuk') ? { name: topAssister.name, assists: topAssister.assists } : null
    };
    
    // 중복 방지 검증 후 추가
    if (!hallOfFame.some(r => r.year === leagueYear)) {
        hallOfFame.push(record);
        
        // Accumulate Club Career Stats
        if (!careerStats) careerStats = { w: 0, d: 0, l: 0, gf: 0, ga: 0, playerGoals: {} };
        careerStats.w += jb.w;
        careerStats.d += jb.d;
        careerStats.l += jb.l;
        careerStats.gf += jb.gf;
        careerStats.ga += jb.ga;
        
        // Accumulate player goals (Jeonbuk players only)
        const playersArray = Object.values(leaguePlayerStats || {});
        playersArray.forEach(p => {
            if (p.teamId === 'jeonbuk' && p.goals > 0) {
                if (!careerStats.playerGoals) careerStats.playerGoals = {};
                if (!careerStats.playerGoals[p.id]) {
                    careerStats.playerGoals[p.id] = { name: p.name, goals: 0 };
                }
                careerStats.playerGoals[p.id].goals += p.goals;
            }
        });
        
        try {
            localStorage.setItem('fc_star_hall_of_fame', JSON.stringify(hallOfFame));
            localStorage.setItem('fc_star_career_stats', JSON.stringify(careerStats));
        } catch (e) {}
    }
    
    // 2. 최종 결과 모달 활성화 및 커스터마이징
    const modal = document.getElementById('revealModal');
    modal.classList.add('active');
    
    const card3d = document.getElementById('card3dWrapper');
    card3d.style.display = 'none'; // Hide player card
    
    const stage = document.querySelector('.reveal-stage');
    const trophyContainer = document.createElement('div');
    trophyContainer.id = "squadChampCelebration";
    trophyContainer.className = "empty-deck";
    trophyContainer.style.background = 'radial-gradient(circle, rgba(255,215,0,0.15) 0%, rgba(10,14,26,0.95) 70%)';
    trophyContainer.style.border = '2px solid #ffd700';
    trophyContainer.style.padding = '3rem 2rem';
    trophyContainer.style.borderRadius = '20px';
    trophyContainer.style.maxWidth = '420px';
    trophyContainer.style.textAlign = 'center';
    trophyContainer.style.animation = 'goalPop 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
    
    if (isJeonbukChamp) {
        trophyContainer.innerHTML = `
            <i class="fa-solid fa-trophy" style="font-size: 5rem; color:#ffd700; filter:drop-shadow(0 0 25px rgba(255,215,0,0.6)); margin-bottom:1.5rem; animation: float 3s ease-in-out infinite;"></i>
            <h2 style="font-size:1.8rem; font-weight:900; background:var(--gold-gradient); -webkit-background-clip:text; -webkit-text-fill-color:transparent; margin-bottom:0.8rem;">🎉 리그 우승 달성! 🎉</h2>
            <p style="color:var(--text-light); font-size:1.05rem; line-height:1.6; margin-bottom:1.8rem;">
                축하합니다! 전북 현대가 ${leagueYear} 시즌 K리그1 우승을 차지하여 역사적인 트로피를 들어올렸습니다!<br>
                당신이 꾸린 베스트 11이 K리그 정상의 주역으로 우뚝 섰습니다.
            </p>
            <button class="btn-open-pack" onclick="closeChampModal()" style="margin-top:0;">다음 시즌 시작하기</button>
        `;
    } else {
        trophyContainer.innerHTML = `
            <i class="fa-solid fa-ranking-star" style="font-size: 5rem; color:#b5c2d9; filter:drop-shadow(0 0 20px rgba(255,255,255,0.2)); margin-bottom:1.5rem; animation: float 3s ease-in-out infinite;"></i>
            <h2 style="font-size:1.8rem; font-weight:900; color:#cbd5e1; margin-bottom:0.8rem;">⚽ ${leagueYear} 시즌 종료 ⚽</h2>
            <p style="color:var(--text-light); font-size:1.05rem; line-height:1.6; margin-bottom:1.8rem;">
                전북 현대가 최종 **${jbRank}위**로 시즌을 마쳤습니다.<br>
                시즌 우승팀: **${champion.name}** (승점 ${champion.pts}점)<br>
                아쉽지만 스쿼드를 더 강력하게 정비하여 다음 연도 시즌의 정상에 재도전하세요!
            </p>
            <button class="btn-open-pack" onclick="closeChampModal()" style="margin-top:0;">다음 시즌 시작하기</button>
        `;
    }
    
    stage.appendChild(trophyContainer);
    
    // Trigger sparks
    let celebrationTimerCount = 0;
    const celebrationTimer = setInterval(() => {
        if (!modal.classList.contains('active')) {
            clearInterval(celebrationTimer);
            return;
        }
        createSparkParticles(true, isJeonbukChamp ? '#ffd700' : '#00ff87');
        celebrationTimerCount++;
        if (celebrationTimerCount > 8) clearInterval(celebrationTimer);
    }, 1200);
    
    // Auto-save user data to cloud after season ending
    saveUserProgress();
}

function closeChampModal() {
    const modal = document.getElementById('revealModal');
    modal.classList.remove('active');
    
    // Restore elements
    const card3d = document.getElementById('card3dWrapper');
    if (card3d) card3d.style.display = 'block';
    
    const celeb = document.getElementById('squadChampCelebration');
    if (celeb) celeb.remove();
    
    // 다음 연도 시즌 시작 처리
    startNextSeason();
}

function startNextSeason() {
    // 1. 리그 연도 증가
    leagueYear += 1;
    localStorage.setItem('fc_star_league_year', leagueYear.toString());
    
    // 2. K리그 순위표 초기화 및 라운드 1로 리셋 (기존 스쿼드 및 카드/포인트 보존)
    resetLeagueSeasonState();
    
    // 3. 순위표 렌더링 및 프리뷰 정보 새로고침
    syncJeonbukOvr();
    renderLeagueTable();
    updateMatchPreviewBoard();
    
    // Commentary clear
    const commBox = document.getElementById('commentaryScroll');
    if (commBox) {
        commBox.innerHTML = `<div class="comm-item comm-system">새로운 ${leagueYear} 시즌이 시작되었습니다! 첫 경기를 진행해 보세요.</div>`;
    }
    
    showToast(`🚀 새로운 ${leagueYear} 시즌의 막이 올랐습니다!`);
    
    // 4. 세이브 동기화
    saveUserProgress();
}

function renderHallOfFame() {
    const gridEl = document.getElementById('fameGrid');
    const placeholderEl = document.getElementById('emptyFamePlaceholder');
    const countEl = document.getElementById('fameSeasonCount');
    
    if (!gridEl) return;
    
    // Update count display
    if (countEl) countEl.innerText = hallOfFame.length;
    
    // Clear dynamic cards
    const existingCards = gridEl.querySelectorAll('.fame-card');
    existingCards.forEach(c => c.remove());
    
    if (hallOfFame.length === 0) {
        if (placeholderEl) placeholderEl.style.display = 'flex';
        return;
    }
    
    if (placeholderEl) placeholderEl.style.display = 'none';
    
    hallOfFame.forEach(record => {
        const card = document.createElement('div');
        card.className = 'fame-card';
        
        let badgeClass = 'other-medal';
        let badgeIcon = '<i class="fa-solid fa-award"></i>';
        
        if (record.jeonbukRank === 1) {
            badgeClass = 'gold-crown';
            badgeIcon = '<i class="fa-solid fa-crown"></i>';
        } else if (record.jeonbukRank === 2) {
            badgeClass = 'silver-medal';
            badgeIcon = '<i class="fa-solid fa-medal"></i>';
        } else if (record.jeonbukRank === 3) {
            badgeClass = 'bronze-medal';
            badgeIcon = '<i class="fa-solid fa-medal"></i>';
        } else {
            badgeClass = 'other-medal';
            badgeIcon = '<i class="fa-solid fa-shield-halved"></i>';
        }
        
        let awardHtml = '';
        if (record.topScorer || record.topAssister) {
            awardHtml += `<div class="fame-card-awards" style="margin-top: 0.6rem; padding-top: 0.5rem; border-top: 1px dashed rgba(255, 255, 255, 0.1); font-size: 0.76rem; display: flex; flex-direction: column; gap: 4px; line-height: 1.4;">`;
            if (record.topScorer) {
                awardHtml += `<div style="color: #ffd700;"><i class="fa-solid fa-soccer-ball" style="margin-right: 4px;"></i> 리그 득점왕: <strong>${record.topScorer.name}</strong> (${record.topScorer.goals}골)</div>`;
            }
            if (record.topAssister) {
                awardHtml += `<div style="color: #00ff87;"><i class="fa-solid fa-star" style="margin-right: 4px;"></i> 리그 도움왕: <strong>${record.topAssister.name}</strong> (${record.topAssister.assists}도움)</div>`;
            }
            awardHtml += `</div>`;
        }
        
        card.innerHTML = `
            <div class="fame-card-badge ${badgeClass}">
                ${badgeIcon}
            </div>
            <div class="fame-card-content">
                <h4 class="fame-card-title">${record.year}년 시즌 K리그1</h4>
                <div class="fame-card-rank">최종 순위: ${record.jeonbukRank}위</div>
                <div class="fame-card-stats">
                    <span>최종 승점: <strong>${record.jeonbukRecord.pts} 점</strong></span>
                    <span>시즌 전적: <strong>11전 ${record.jeonbukRecord.w}승 ${record.jeonbukRecord.d}무 ${record.jeonbukRecord.l}패</strong></span>
                    <span>시즌 우승팀: <strong>${record.champion}</strong></span>
                </div>
                ${awardHtml}
            </div>
        `;
        
        gridEl.appendChild(card);
    });
    
    renderCareerStats();
}

function renderCareerStats() {
    const dashboardEl = document.getElementById('careerStatsDashboard');
    if (!dashboardEl) return;
    
    if (hallOfFame.length === 0) {
        dashboardEl.style.display = 'none';
        return;
    }
    
    dashboardEl.style.display = 'block';
    
    const gd = careerStats.gf - careerStats.ga;
    const gdSign = gd > 0 ? `+${gd}` : gd;
    
    // Sort players for top 3 scorers
    const topScorers = Object.values(careerStats.playerGoals || {})
        .filter(p => p.goals > 0)
        .sort((a, b) => b.goals - a.goals)
        .slice(0, 3);
        
    let scorersHtml = '';
    if (topScorers.length === 0) {
        scorersHtml = `<div style="text-align: center; color: #64748b; padding: 10px; font-size: 0.8rem;">득점 기록 없음</div>`;
    } else {
        scorersHtml = topScorers.map((p, idx) => {
            let medalColor = '#ffd700'; // 1st
            if (idx === 1) medalColor = '#c0c0c0'; // 2nd
            if (idx === 2) medalColor = '#cd7f32'; // 3rd
            return `
                <div style="display: flex; align-items: center; justify-content: space-between; font-size: 0.82rem; padding: 6px 10px; background: rgba(255,255,255,0.03); border-radius: 8px; border: 1px solid rgba(255,255,255,0.02);">
                    <span style="display: flex; align-items: center; gap: 6px;">
                        <i class="fa-solid fa-medal" style="color: ${medalColor};"></i>
                        <strong>${p.name}</strong>
                    </span>
                    <span style="color: #ffd700; font-weight: 800;">${p.goals}골</span>
                </div>
            `;
        }).join('');
    }
    
    dashboardEl.innerHTML = `
        <div style="background: linear-gradient(135deg, rgba(8, 10, 16, 0.6) 0%, rgba(15, 19, 34, 0.6) 100%); border: 1.5px solid rgba(255, 215, 0, 0.35); border-radius: 20px; padding: 1.2rem; margin-bottom: 1.5rem; box-shadow: var(--card-shadow); backdrop-filter: blur(10px);">
            <h3 style="font-size: 1.1rem; font-weight: 900; background: var(--gold-gradient); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 1rem; display: flex; align-items: center; gap: 8px;">
                <i class="fa-solid fa-chart-line" style="color: #ffd700;"></i> 클럽 통산 누적 성적 (All-Time Career Stats)
            </h3>
            
            <div style="display: flex; gap: 1.2rem; flex-wrap: wrap;">
                <!-- Left Column: Match & Goal Stats -->
                <div style="flex: 1.3; min-width: 250px; display: grid; grid-template-columns: repeat(auto-fit, minmax(110px, 1fr)); gap: 0.6rem;">
                    <div style="background: rgba(255,255,255,0.03); padding: 0.6rem; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05); text-align: center; display: flex; flex-direction: column; justify-content: center;">
                        <div style="font-size: 0.72rem; color: #94a3b8; margin-bottom: 0.2rem;">통산 경기</div>
                        <div style="font-size: 1.3rem; font-weight: 900; color: #fff;">${careerStats.w + careerStats.d + careerStats.l}전</div>
                    </div>
                    <div style="background: rgba(0, 255, 135, 0.04); padding: 0.6rem; border-radius: 12px; border: 1px solid rgba(0, 255, 135, 0.12); text-align: center; display: flex; flex-direction: column; justify-content: center;">
                        <div style="font-size: 0.72rem; color: #00ff87; margin-bottom: 0.2rem;">통산 전적</div>
                        <div style="font-size: 1.05rem; font-weight: 800; color: #fff; margin-top: 0.1rem;">${careerStats.w}승 ${careerStats.d}무 ${careerStats.l}패</div>
                    </div>
                    <div style="background: rgba(255,255,255,0.03); padding: 0.6rem; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05); text-align: center; display: flex; flex-direction: column; justify-content: center;">
                        <div style="font-size: 0.72rem; color: #94a3b8; margin-bottom: 0.2rem;">통산 득/실점</div>
                        <div style="font-size: 1.05rem; font-weight: 800; color: #fff; margin-top: 0.1rem;">${careerStats.gf}득 / ${careerStats.ga}실</div>
                    </div>
                    <div style="background: rgba(255, 215, 0, 0.04); padding: 0.6rem; border-radius: 12px; border: 1px solid rgba(255, 215, 0, 0.12); text-align: center; display: flex; flex-direction: column; justify-content: center;">
                        <div style="font-size: 0.72rem; color: #ffd700; margin-bottom: 0.2rem;">통산 골득실</div>
                        <div style="font-size: 1.3rem; font-weight: 900; color: #ffd700;">${gdSign}</div>
                    </div>
                </div>
                
                <!-- Right Column: Top Scorers -->
                <div style="flex: 1; min-width: 220px; background: rgba(10,14,26,0.3); border: 1px solid rgba(255,255,255,0.05); padding: 0.8rem; border-radius: 16px; display: flex; flex-direction: column; gap: 0.4rem;">
                    <h4 style="font-size: 0.82rem; font-weight: 800; color: #ffd700; margin-bottom: 0.2rem; display: flex; align-items: center; gap: 6px;">
                        <i class="fa-solid fa-fire-flame-curved"></i> 클럽 통산 득점 랭킹 (Top 3)
                    </h4>
                    ${scorersHtml}
                </div>
            </div>
        </div>
    `;
}

// 10. INITIALIZATION
document.addEventListener('DOMContentLoaded', () => {
    updateTotalCardCount();
    renderSquadFormation(); // Initialize squad pitch rendering
    initLeague();           // Initialize K League Standing & Fixtures
    renderUserPoints();     // Sync user gacha points on load
    renderUserLevel();      // Sync user level on load
    
    // Register PWA Service Worker
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('sw.js')
                .then(reg => console.log('Service Worker registered successfully!', reg))
                .catch(err => console.error('Service Worker registration failed.', err));
        });
    }
    
    // Bind Enter key to quiz input
    const quizInput = document.getElementById('quizAnswerInput');
    if (quizInput) {
        quizInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                submitQuizAnswer();
            }
        });
    }
    
    // Bind Enter key to Auth Input
    const authPwInput = document.getElementById('authUserPasswordInput');
    if (authPwInput) {
        authPwInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                handleAuthSubmit();
            }
        });
    }
    
    document.getElementById('appLogo').addEventListener('click', () => {
        initAudio();
    });
    
    // Auto restore active logged-in user session
    try {
        const savedUser = localStorage.getItem('fc_star_current_user');
        if (savedUser) {
            console.log("🔐 기존 로그인 세션 자동 복원 중... ID:", savedUser);
            setTimeout(async () => {
                const userData = await dbService.getUserData(savedUser);
                if (userData) {
                    currentUser = savedUser;
                    syncUserDataOnLogin(userData);
                    console.log("🟢 세션 복원 성공!");
                } else {
                    localStorage.removeItem('fc_star_current_user');
                    openAuthModal(true); // 세션 복원 실패 시 강제 로그인
                }
            }, 100);
        } else {
            // 세션 기록이 없다면 즉시 전체화면을 가리는 강제 로그인 팝업 활성화!
            setTimeout(() => {
                openAuthModal(true);
            }, 200);
        }
    } catch(e) {
        console.warn("세션 복원 실패:", e);
        setTimeout(() => {
            openAuthModal(true);
        }, 200);
    }
});



// ==========================================================================
// 14. DEVELOPER CHEAT & DEBUGGING UTILITIES
// ==========================================================================
function developerSetPoints() {
    if (!isDeveloperMode || !currentUser || currentUser.toLowerCase() !== 'ooks12') {
        showToast("⚠️ 보유 포인트 수정은 'ooks12' 계정의 개발자 모드에서만 가능합니다.");
        return;
    }
    const input = prompt("🛠 개발자 모드: 포인트를 직접 수정합니다.\n원하는 포인트(FP) 수치를 입력해주세요:", userPoints);
    if (input !== null) {
        const parsed = parseInt(input.trim());
        if (!isNaN(parsed) && parsed >= 0) {
            userPoints = parsed;
            try {
                localStorage.setItem('fc_star_user_points', userPoints.toString());
            } catch(e) {}
            renderUserPoints();
            showToast(`개발자 권한으로 보유 포인트가 ${userPoints} FP로 조정되었습니다!`);
            
            // Auto-save user data to cloud after developer settings
            saveUserProgress();
        } else {
            showToast("올바른 양의 정수를 입력하세요.");
        }
    }
}

function developerSetLevel() {
    if (!isDeveloperMode || !currentUser || currentUser.toLowerCase() !== 'ooks12') {
        showToast("⚠️ 레벨 수정은 'ooks12' 계정의 개발자 모드에서만 가능합니다.");
        return;
    }
    const input = prompt("🛠 개발자 모드: 레벨을 직접 수정합니다.\n원하는 레벨 수치를 입력해주세요:", userLevel);
    if (input !== null) {
        const parsed = parseInt(input.trim());
        if (!isNaN(parsed) && parsed >= 1) {
            userLevel = parsed;
            try {
                localStorage.setItem('fc_star_user_level', userLevel.toString());
            } catch(e) {}
            if (typeof renderUserLevel === 'function') renderUserLevel();
            showToast(`개발자 권한으로 레벨이 ${userLevel}로 조정되었습니다!`);
            
            // Auto-save user data to cloud
            saveUserProgress();
            
            // Trigger Level Reward Events (e.g. awards Lee Seung-woo card if 10 is reached)
            if (typeof checkLevelUpRewards === 'function') {
                checkLevelUpRewards(userLevel);
            }
        } else {
            showToast("올바른 양의 정수를 입력하세요.");
        }
    }
}

function toggleDeveloperMode(isChecked) {
    isDeveloperMode = isChecked;
    try {
        localStorage.setItem('fc_star_dev_mode', isDeveloperMode ? 'true' : 'false');
    } catch(e) {}
    showToast(isDeveloperMode ? "🛠 개발자 모드가 활성화되었습니다!" : "🛠 개발자 모드가 비활성화되었습니다.");
}

function updateDevModeUI() {
    const devToggleContainer = document.getElementById('devToggleContainer');
    const checkbox = document.getElementById('devModeCheckbox');
    
    if (currentUser && currentUser.toLowerCase() === 'ooks12') {
        if (devToggleContainer) devToggleContainer.style.display = 'flex';
        try {
            const savedDevMode = localStorage.getItem('fc_star_dev_mode');
            if (savedDevMode === 'true') {
                isDeveloperMode = true;
                if (checkbox) checkbox.checked = true;
            } else {
                isDeveloperMode = false;
                if (checkbox) checkbox.checked = false;
            }
        } catch (e) {
            isDeveloperMode = false;
        }
    } else {
        if (devToggleContainer) devToggleContainer.style.display = 'none';
        isDeveloperMode = false;
        if (checkbox) checkbox.checked = false;
        try { localStorage.removeItem('fc_star_dev_mode'); } catch (e) {}
    }
}

// ==========================================================================
// 15. USER AUTHENTICATION & CLOUD DATA SYNC SERVICE LOGIC
// ==========================================================================

function saveUserProgress() {
    if (!currentUser) return;
    
    const progressData = {
        userPoints: userPoints,
        userLevel: userLevel,
        playerDeck: playerDeck,
        squadFormation: squadFormation,
        leagueRound: leagueRound,
        leagueTeams: leagueTeams,
        quizOffset: quizOffset,
        quizLastDate: quizLastDate,
        quizQueue: quizQueue,
        quizSolvedCount: quizSolvedCount,
        quizCurrentIndex: quizCurrentIndex,
        matchLastDate: matchLastDate,
        matchTodayCount: matchTodayCount,
        leagueYear: leagueYear,
        hallOfFame: hallOfFame,
        leaguePlayerStats: leaguePlayerStats,
        careerStats: careerStats
    };
    
    dbService.saveProgress(currentUser, progressData);
}

function syncUserDataOnLogin(userData) {
    if (!userData) return;
    
    try {
        // Restore progress
        userPoints = userData.userPoints || 0;
        userLevel = userData.userLevel || 1;
        playerDeck = userData.playerDeck || {};
        squadFormation = userData.squadFormation || {};
        leagueRound = userData.leagueRound || 1;
        
        // CARDS_DATABASE 기준 최신 구조 동기화 (하이드레이션)
        if (typeof CARDS_DATABASE !== 'undefined' && CARDS_DATABASE) {
            Object.keys(playerDeck).forEach(key => {
                if (CARDS_DATABASE[key]) {
                    playerDeck[key].card = CARDS_DATABASE[key];
                } else {
                    delete playerDeck[key];
                }
            });
        }
        
        if (userData.leagueTeams && userData.leagueTeams.length > 0) {
            leagueTeams = userData.leagueTeams;
        } else {
            // Fallback: reset teams if none exists
            resetLeagueSeasonState();
        }
        
        // Firebase에 보관된 퀴즈 진도 데이터 동기화
        quizOffset = userData.quizOffset || 0;
        quizLastDate = userData.quizLastDate || "";
        quizQueue = userData.quizQueue || [];
        quizSolvedCount = userData.quizSolvedCount || 0;
        quizCurrentIndex = userData.quizCurrentIndex || 0;
        matchLastDate = userData.matchLastDate || "";
        matchTodayCount = userData.matchTodayCount || 0;
        
        // 리그 연도 및 명예의 전당 클라우드 데이터 복원
        leagueYear = userData.leagueYear || 2026;
        hallOfFame = userData.hallOfFame || [];
        leaguePlayerStats = userData.leaguePlayerStats || {};
        if (Object.keys(leaguePlayerStats).length === 0) {
            initLeaguePlayerStats();
        }
        
        careerStats = userData.careerStats || { w: 0, d: 0, l: 0, gf: 0, ga: 0, playerGoals: {} };
        
        // Sync local storage so it serves as offline cache
        localStorage.setItem('fc_star_user_points', userPoints.toString());
        localStorage.setItem('fc_star_user_level', userLevel.toString());
        localStorage.setItem('fc_star_player_deck', JSON.stringify(playerDeck));
        localStorage.setItem('fc_star_squad_formation', JSON.stringify(squadFormation));
        localStorage.setItem('fc_star_league_teams', JSON.stringify(leagueTeams));
        localStorage.setItem('fc_star_league_round', leagueRound.toString());
        localStorage.setItem('fc_star_quiz_offset', quizOffset.toString());
        localStorage.setItem('fc_star_quiz_last_date', quizLastDate);
        localStorage.setItem('fc_star_quiz_queue', JSON.stringify(quizQueue));
        localStorage.setItem('fc_star_quiz_solved_count', quizSolvedCount.toString());
        localStorage.setItem('fc_star_quiz_current_index', quizCurrentIndex.toString());
        localStorage.setItem('fc_star_match_last_date', matchLastDate);
        localStorage.setItem('fc_star_match_today_count', matchTodayCount.toString());
        localStorage.setItem('fc_star_league_year', leagueYear.toString());
        localStorage.setItem('fc_star_hall_of_fame', JSON.stringify(hallOfFame));
        localStorage.setItem('fc_star_league_stats', JSON.stringify(leaguePlayerStats));
        localStorage.setItem('fc_star_career_stats', JSON.stringify(careerStats));
        
        // 개발자 모드 UI 연동 복원
        updateDevModeUI();
        
        // Refresh all screens
        renderUserPoints();
        updateTotalCardCount();
        renderDeck();
        renderSquadFormation();
        syncJeonbukOvr();
        updateMatchPreviewBoard();
        renderLeagueTable();
        renderLeagueStats();
        renderCareerStats();
        
        // Refresh Auth Badge
        updateAuthBadgeUI();
    } catch (e) {
        console.error("데이터 동기화 실패:", e);
        alert("계정 데이터 동기화 도중 에러가 발생했습니다: " + e.message);
    }
}

function updateAuthBadgeUI() {
    const authText = document.getElementById('headerAuthText');
    const authBtn = document.getElementById('headerAuthBtn');
    
    if (currentUser) {
        if (authText) authText.innerText = `${currentUser.toUpperCase()} 님`;
        if (authBtn) authBtn.classList.add('logged-in');
    } else {
        if (authText) authText.innerText = "로그인";
        if (authBtn) authBtn.classList.remove('logged-in');
    }
}

function toggleAuthModal() {
    const modal = document.getElementById('authModal');
    if (!modal) return;
    
    if (modal.classList.contains('active')) {
        closeAuthModal();
    } else {
        openAuthModal();
    }
}

function openAuthModal(isForce = false) {
    const modal = document.getElementById('authModal');
    if (!modal) return;
    
    modal.classList.add('active');
    
    const loggedInState = document.getElementById('authLoggedInState');
    const loggedOutState = document.getElementById('authLoggedOutState');
    const modalTitle = document.getElementById('authModalTitle');
    const closeBtn = modal.querySelector('.btn-close-drawer');
    
    // Gateway Blur Visual Effects
    const mainEl = document.querySelector('main');
    const headerEl = document.querySelector('header');
    
    if (currentUser) {
        // Logged In Screen
        if (loggedInState) loggedInState.style.display = 'block';
        if (loggedOutState) loggedOutState.style.display = 'none';
        if (modalTitle) modalTitle.innerHTML = `<i class="fa-solid fa-user-check" style="margin-right: 8px; color: #00ff87;"></i>연동된 계정`;
        
        const loggedInUserText = document.getElementById('loggedInUserText');
        if (loggedInUserText) loggedInUserText.innerText = currentUser.toUpperCase();
        
        if (closeBtn) closeBtn.style.display = 'block';
        
        // Remove blur
        if (mainEl) mainEl.style.filter = '';
        if (headerEl) headerEl.style.filter = '';
    } else {
        // Logged Out Form
        if (loggedInState) loggedInState.style.display = 'none';
        if (loggedOutState) loggedOutState.style.display = 'flex';
        
        authMode = 'login';
        refreshAuthFormFields();
        
        if (isForce) {
            // Force login gateway: Hide close button & Apply blur
            if (closeBtn) closeBtn.style.display = 'none';
            if (mainEl) mainEl.style.filter = 'blur(10px) brightness(0.6)';
            if (headerEl) headerEl.style.filter = 'blur(10px) brightness(0.6)';
        } else {
            if (closeBtn) closeBtn.style.display = 'block';
        }
    }
}

function closeAuthModal() {
    // If not logged in, force block closing the gateway!
    if (!currentUser) {
        showToast("FC STAR CARD 플레이를 위해 로그인 또는 가입을 먼저 진행해 주세요!");
        return;
    }
    
    const modal = document.getElementById('authModal');
    if (modal) modal.classList.remove('active');
    
    // Remove blur
    const mainEl = document.querySelector('main');
    const headerEl = document.querySelector('header');
    if (mainEl) mainEl.style.filter = '';
    if (headerEl) headerEl.style.filter = '';
}

function toggleAuthMode() {
    authMode = (authMode === 'login') ? 'register' : 'login';
    refreshAuthFormFields();
}

function refreshAuthFormFields() {
    const modalTitle = document.getElementById('authModalTitle');
    const btnSubmit = document.getElementById('btnSubmitAuth');
    const toggleBtn = document.getElementById('authToggleBtn');
    const toggleHint = document.getElementById('authToggleHint');
    
    const idInput = document.getElementById('authUserIdInput');
    const pwInput = document.getElementById('authUserPasswordInput');
    
    if (idInput) idInput.value = '';
    if (pwInput) pwInput.value = '';
    
    if (authMode === 'login') {
        if (modalTitle) modalTitle.innerHTML = `<i class="fa-solid fa-user-shield" style="margin-right: 8px; color: #ffd700;"></i>계정 로그인`;
        if (btnSubmit) btnSubmit.innerHTML = `<i class="fa-solid fa-key" style="margin-right: 6px;"></i>로그인 완료`;
        if (toggleHint) toggleHint.innerText = "아직 계정이 없으신가요?";
        if (toggleBtn) toggleBtn.innerText = "회원가입 하기";
    } else {
        if (modalTitle) modalTitle.innerHTML = `<i class="fa-solid fa-user-plus" style="margin-right: 8px; color: #ffd700;"></i>새 계정 생성`;
        if (btnSubmit) btnSubmit.innerHTML = `<i class="fa-solid fa-user-plus" style="margin-right: 6px;"></i>회원가입 & 시작`;
        if (toggleHint) toggleHint.innerText = "이미 계정이 있으신가요?";
        if (toggleBtn) toggleBtn.innerText = "로그인 하기";
    }
}

async function handleAuthSubmit() {
    if (isAuthSubmitting) return;
    
    const idInput = document.getElementById('authUserIdInput');
    const pwInput = document.getElementById('authUserPasswordInput');
    
    const id = idInput ? idInput.value.trim() : "";
    const pw = pwInput ? pwInput.value : "";
    
    if (!id) {
        showToast("아이디를 입력해주세요!");
        if (idInput) idInput.focus();
        return;
    }
    if (!pw) {
        showToast("비밀번호를 입력해주세요!");
        if (pwInput) pwInput.focus();
        return;
    }
    
    isAuthSubmitting = true;
    const btnSubmit = document.getElementById('btnSubmitAuth');
    if (btnSubmit) btnSubmit.disabled = true;
    
    showToast(`${authMode === 'login' ? '로그인' : '회원가입'} 진행 중...`);
    
    try {
        if (authMode === 'login') {
            // LOGIN PROCESS
            const userData = await dbService.login(id, pw);
            currentUser = userData.id;
            
            // Sync and refresh
            syncUserDataOnLogin(userData);
            
            // Keep session
            localStorage.setItem('fc_star_current_user', currentUser);
            
            closeAuthModal();
            showToast(`환영합니다! ${currentUser.toUpperCase()} 계정으로 로그인되었습니다.`);
        } else {
            // REGISTER PROCESS
            const defaultData = await dbService.register(id, pw);
            currentUser = defaultData.id;
            
            // Sync & automatically save existing local progress (if any) as first upload
            syncUserDataOnLogin(defaultData);
            
            // Backup existing local data to cloud immediately
            saveUserProgress();
            
            // Keep session
            localStorage.setItem('fc_star_current_user', currentUser);
            
            closeAuthModal();
            showToast(`축하합니다! ${currentUser.toUpperCase()} 계정이 생성 및 연동되었습니다!`);
        }
    } catch (err) {
        showToast("계정 연동 실패!");
        alert("계정 처리 중 에러 발생: " + err.message);
    } finally {
        isAuthSubmitting = false;
        if (btnSubmit) btnSubmit.disabled = false;
    }
}

function handleLogout() {
    const confirmLogout = confirm("정말 로그아웃 하시겠습니까?\n로그아웃 시 비회원 로컬 모드로 전환됩니다.");
    if (confirmLogout) {
        currentUser = null;
        localStorage.removeItem('fc_star_current_user');
        
        // Clean active local states to avoid leakage, then reload
        localStorage.removeItem('fc_star_user_points');
        localStorage.removeItem('fc_star_player_deck');
        localStorage.removeItem('fc_star_squad_formation');
        localStorage.removeItem('fc_star_league_teams');
        localStorage.removeItem('fc_star_league_round');
        
        showToast("성공적으로 로그아웃되었습니다! 로컬 모드로 리로딩합니다...");
        
        setTimeout(() => {
            window.location.reload();
        }, 1000);
    }
}

// 16. USER LEVEL UP SPECIAL REWARDS SYSTEM
function showLevelRewardModal(title, subtitle, message) {
    const modal = document.getElementById('levelRewardModal');
    const titleEl = document.getElementById('levelRewardTitle');
    const subEl = document.getElementById('levelRewardSubtitle');
    const msgEl = document.getElementById('levelRewardMessage');
    
    if (modal && titleEl && subEl && msgEl) {
        titleEl.innerText = title;
        subEl.innerText = subtitle;
        msgEl.innerHTML = message;
        modal.style.display = 'flex';
        modal.classList.add('active');
    }
}

function closeLevelRewardModal() {
    const modal = document.getElementById('levelRewardModal');
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('active');
    }
}

function checkLevelUpRewards(level) {
    if (level === 2) {
        showLevelRewardModal(
            "🚀 특별 목표 알림 🚀",
            "Lv. 2 달성을 축하합니다!",
            "레벨 10이 되면 특급 윙어 <strong>'이승우'</strong>, 레벨 20이 되면 월드클래스 <strong>'손흥민'</strong>, 레벨 30이 되면 파리의 마술사 <strong>'이강인'</strong> 전설 카드 등 특별한 보상을 즉시 받으실 수 있습니다!<br><br>열심히 단어 공부를 하고 특별한 혜택을 쟁취해보세요!"
        );
    } else if (level > 0 && level % 10 === 0) {
        let cardId = "";
        let isRandom = false;
        
        if (level === 10) {
            cardId = "lee_seung_woo";
        } else if (level === 20) {
            cardId = "son_heung_min";
        } else if (level === 30) {
            cardId = "lee_kang_in";
        } else {
            // Award random card
            if (typeof CARDS_DATABASE !== 'undefined') {
                const keys = Object.keys(CARDS_DATABASE);
                if (keys.length > 0) {
                    cardId = keys[Math.floor(Math.random() * keys.length)];
                    isRandom = true;
                }
            }
        }
        
        if (cardId && typeof CARDS_DATABASE !== 'undefined' && CARDS_DATABASE[cardId]) {
            const cardObj = CARDS_DATABASE[cardId];
            let detailMsg = "";
            if (playerDeck[cardId]) {
                playerDeck[cardId].quantity = 1;
                if (typeof playerDeck[cardId].awakening !== 'number') {
                    playerDeck[cardId].awakening = 0;
                }
                if (playerDeck[cardId].awakening < 5) {
                    playerDeck[cardId].awakening += 1;
                    detailMsg = `(보유 중인 ${cardObj.name} 카드가 <strong>★${playerDeck[cardId].awakening} 각성</strong>으로 한층 강해졌습니다!)`;
                } else {
                    detailMsg = `(이미 ${cardObj.name} 카드가 최대 각성 상태(5각성)입니다.)`;
                }
            } else {
                playerDeck[cardId] = {
                    card: cardObj,
                    quantity: 1,
                    awakening: 0
                };
                detailMsg = `(내 컬렉션(덱)에 새로운 선수로 안전하게 지급되었습니다!)`;
            }
            
            // Save state
            try {
                localStorage.setItem('fc_star_player_deck', JSON.stringify(playerDeck));
            } catch(e) {}
            saveUserProgress();
            
            let awardMessage = "";
            if (level === 10) {
                awardMessage = `축하합니다! 레벨 10 도달 기념으로 전북 현대 최고의 특급 윙어 <strong>'이승우'</strong> 선수카드가 지급되었습니다!<br><br>${detailMsg}`;
            } else if (level === 20) {
                awardMessage = `축하합니다! 레벨 20 도달 기념으로 대한민국 최고의 월드클래스 슈퍼스타 <strong>'손흥민'</strong> 선수카드가 지급되었습니다!<br><br>${detailMsg}`;
            } else if (level === 30) {
                awardMessage = `축하합니다! 레벨 30 도달 기념으로 파리 생제르맹(PSG)의 보석이자 천재 미드필더 <strong>'이강인'</strong> 전설 카드가 지급되었습니다!<br><br>${detailMsg}`;
            } else {
                awardMessage = `축하합니다! 레벨 ${level} 도달 기념으로 K리그 최고의 스타 <strong>'${cardObj.name}'</strong> 선수카드가 무작위 특별 보상으로 지급되었습니다!<br><br>${detailMsg}`;
            }
                
            showLevelRewardModal(
                "🎁 특별 레벨업 보상 🎁",
                `Lv. ${level} 달성을 축하합니다!`,
                `${awardMessage}<br><br>앞으로도 레벨 10이 오를 때마다 '특별한' 선물이 지급됩니다!`
            );
        }
    }
}
