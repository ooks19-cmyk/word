// js/pack.js - 카드 팩 개봉 모듈

// 4. PACK OPENING (Drawn randomly between Lee Seung-woo & Kim Seung-sub)
function openPack() {
    if (userPoints < 1) {
        showToast("포인트가 부족합니다! '단어 퀴즈' 탭에서 퀴즈를 풀고 FP를 획득하세요.");
        switchTab('quiz');
        return;
    }

    let keys = Object.keys(CARDS_DATABASE).filter(k => !(playerDeck[k] && playerDeck[k].awakening >= 5));
    
    // 월드 클래스 등급은 어려움 모드 이상에서만 출현하도록 제한
    if (typeof isHardMode === 'undefined' || !isHardMode) {
        keys = keys.filter(k => CARDS_DATABASE[k].rarity !== 'worldclass');
    }
    
    // 만약 모든 카드가 5각성이어서 뽑을 카드가 없다면 폴백으로 전체 카드 허용
    if (keys.length === 0) {
        keys = Object.keys(CARDS_DATABASE);
        if (typeof isHardMode === 'undefined' || !isHardMode) {
            keys = keys.filter(k => CARDS_DATABASE[k].rarity !== 'worldclass');
        }
    }
    
    const legendKeys = keys.filter(k => CARDS_DATABASE[k].rarity === 'legend');
    const specialKeys = keys.filter(k => CARDS_DATABASE[k].rarity === 'special');
    const worldclassKeys = keys.filter(k => CARDS_DATABASE[k].rarity === 'worldclass');
    const normalKeys = keys.filter(k => CARDS_DATABASE[k].rarity === 'normal');
    
    let chosenKey = "";
    const rand = Math.random(); // 0.0 ~ 1.0
    
    // Each individual Legend, Special and World Class card has exactly a 1% probability
    const totalLegendProb = legendKeys.length * 0.01;
    const totalSpecialProb = specialKeys.length * 0.01;
    const totalWorldclassProb = worldclassKeys.length * 0.01;
    const totalPremiumProb = totalLegendProb + totalSpecialProb + totalWorldclassProb;
    
    if (rand < totalPremiumProb) {
        // Draw from the premium pool (World Class, Legend or Special)
        if (rand < totalWorldclassProb && worldclassKeys.length > 0) {
            chosenKey = worldclassKeys[Math.floor(Math.random() * worldclassKeys.length)];
        } else if (rand < (totalWorldclassProb + totalLegendProb) && legendKeys.length > 0) {
            chosenKey = legendKeys[Math.floor(Math.random() * legendKeys.length)];
        } else if (specialKeys.length > 0) {
            chosenKey = specialKeys[Math.floor(Math.random() * specialKeys.length)];
        } else {
            chosenKey = keys[Math.floor(Math.random() * keys.length)]; // Fallback
        }
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

    // Automated Flash and Spark Explosion (Replaces manual flip)
    setTimeout(() => {
        // White flash effect
        const flash = document.getElementById('flashOverlay');
        if (flash) {
            flash.classList.add('trigger');
            setTimeout(() => {
                flash.classList.remove('trigger');
            }, 800);
        }
        
        // Sound and explosion particles
        playSound('flip');
        createSparkParticles(true, activePulledCard.theme.glow);
        
        // Show collect button automatically
        const btn = document.getElementById('btnCollect');
        if (btn) {
            btn.style.display = 'block';
            btn.style.animation = 'fadeIn 0.4s ease-out forwards';
        }
    }, 1100);

    // Apply interactive 3D Tilt after card enters and flash completes
    setTimeout(() => {
        apply3DTiltEffect(document.getElementById('futCard'));
    }, 1500);
}

// Trigger Flip Card (Disabled/No-op since card is revealed automatically)
function flipRevealedCard() {
    // No-op
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
            // 이미 5각성인 카드 등장 시 1 FP 보상 지급
            userPoints += 1;
            message = `이미 최대 각성 상태(5각성)인 ${activePulledCard.name} 선수를 영입하여 보상으로 1 FP가 지급되었습니다!`;
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
    const btnCollect = document.getElementById('btnCollect');
    if (btnCollect) btnCollect.style.display = 'none';
}
