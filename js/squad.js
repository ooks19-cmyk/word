// js/squad.js - 포메이션 & 비밀 작전 보드 모듈

// 9. SQUAD FORMATION BOARD LOGIC
let squadFormation = {};
let activeSelectorPosition = null;
let isGegenpressingActive = false;
let isTikitakaActive = false;

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
    
    // Check and update squad tactics status
    checkSquadTactics();
}

function checkSquadTactics() {
    // 1. 전방압박 (Gegenpressing) 검사
    let fastForwardsCount = 0;
    const forwards = ["LW", "ST", "RW"];
    
    forwards.forEach(pos => {
        const cardId = squadFormation[pos];
        if (cardId && CARDS_DATABASE[cardId]) {
            const cardData = getAwakenedCard(cardId);
            if (cardData && cardData.stats && cardData.stats.pac >= 80) {
                fastForwardsCount++;
            }
        }
    });

    isGegenpressingActive = (fastForwardsCount >= 2);
    
    // 2. 티키타카 (Tiki-Taka) 검사
    let passMidfieldersCount = 0;
    let placedMidfieldersCount = 0;
    const midfielders = ["LCM", "CM", "RCM"];
    
    midfielders.forEach(pos => {
        const cardId = squadFormation[pos];
        if (cardId && CARDS_DATABASE[cardId]) {
            placedMidfieldersCount++;
            const cardData = getAwakenedCard(cardId);
            if (cardData && cardData.stats && cardData.stats.pas >= 75) {
                passMidfieldersCount++;
            }
        }
    });

    // 3명이 모두 다 차있고, 세 미드필더 전부 패스가 75 이상이어야 함
    isTikitakaActive = (placedMidfieldersCount === 3 && passMidfieldersCount === 3);

    // 3. UI 업데이트 (최상단 헤더 아이콘 배지 점등)
    const headerGegen = document.getElementById('headerTacticGegen');
    const headerTiki = document.getElementById('headerTacticTiki');
    
    if (headerGegen) {
        if (isGegenpressingActive) {
            headerGegen.className = "header-tactic-badge active gegen";
        } else {
            headerGegen.className = "header-tactic-badge inactive";
        }
    }
    
    if (headerTiki) {
        if (isTikitakaActive) {
            headerTiki.className = "header-tactic-badge active tiki";
        } else {
            headerTiki.className = "header-tactic-badge inactive";
        }
    }

    // 4. 하단 전술판 대시보드 UI 업데이트
    
    // 4-A. 전방압박 카드 업데이트
    const boxGegen = document.getElementById('tacticBoxGegen');
    const badgeGegen = document.getElementById('tacticStatusBadgeGegen');
    const textGegen = document.getElementById('tacticCountTextGegen');
    
    if (boxGegen && badgeGegen && textGegen) {
        if (isGegenpressingActive) {
            boxGegen.classList.add('active');
            badgeGegen.innerText = "ON (활성)";
            badgeGegen.className = "tactic-status-badge active gegen";
            textGegen.innerText = `${fastForwardsCount} / 2명 달성 🎉 (작전 발동!)`;
            textGegen.style.color = "#ffd700";
        } else {
            boxGegen.classList.remove('active');
            badgeGegen.innerText = "OFF (꺼짐)";
            badgeGegen.className = "tactic-status-badge inactive";
            textGegen.innerText = `${fastForwardsCount} / 2명 달성`;
            textGegen.style.color = "#ff8888";
        }
    }

    // 4-B. 티키타카 카드 업데이트
    const boxTiki = document.getElementById('tacticBoxTiki');
    const badgeTiki = document.getElementById('tacticStatusBadgeTiki');
    const textTiki = document.getElementById('tacticCountTextTiki');
    
    if (boxTiki && badgeTiki && textTiki) {
        if (isTikitakaActive) {
            boxTiki.classList.add('active');
            badgeTiki.innerText = "ON (활성)";
            badgeTiki.className = "tactic-status-badge active tiki";
            textTiki.innerText = `${passMidfieldersCount} / 3명 달성 🎉 (작전 발동!)`;
            textTiki.style.color = "#00ff87";
        } else {
            boxTiki.classList.remove('active');
            badgeTiki.innerText = "OFF (꺼짐)";
            badgeTiki.className = "tactic-status-badge inactive";
            textTiki.innerText = `${passMidfieldersCount} / 3명 달성 (미드필더 3명 배치 & 패스 75이상 필요)`;
            textTiki.style.color = "#ff8888";
        }
    }

    // 5. 추천 선수 동적 갱신
    
    // 5-A. 전방압박 추천 공격수
    const candidateGegen = ["son_heung_min", "lee_dong_jun", "lee_seung_woo", "jeon_jin_woo", "lee_kang_in", "kim_seung_sub"];
    const listGegen = document.getElementById('tacticPlayerListGegen');
    if (listGegen) {
        listGegen.innerHTML = '';
        candidateGegen.forEach(id => {
            const card = CARDS_DATABASE[id];
            if (!card) return;
            const isOwned = playerDeck.hasOwnProperty(id);
            const tag = document.createElement('span');
            tag.className = `rec-player-tag${isOwned ? ' owned-fast' : ''}`;
            
            let emoji = '🏃‍♂️';
            if (id === 'son_heung_min') emoji = '🌟';
            if (id === 'lee_dong_jun') emoji = '⚡';
            if (id === 'jeon_jin_woo') emoji = '⚽';
            if (id === 'lee_kang_in') emoji = '💫';
            if (id === 'kim_seung_sub') emoji = '🔥';
            
            tag.innerHTML = `${card.name} (속도 ${card.stats.pac} / ${card.position}) ${emoji}${isOwned ? ' [보유중]' : ''}`;
            listGegen.appendChild(tag);
        });
    }

    // 5-B. 티키타카 추천 미드필더
    const candidateTiki = ["lee_kang_in", "son_heung_min", "lee_yeong_jae", "kim_jin_gyu", "oberdan", "kang_sang_yoon", "gamboa", "maeng_seong_ung"];
    const listTiki = document.getElementById('tacticPlayerListTiki');
    if (listTiki) {
        listTiki.innerHTML = '';
        candidateTiki.forEach(id => {
            const card = CARDS_DATABASE[id];
            if (!card) return;
            const isOwned = playerDeck.hasOwnProperty(id);
            const tag = document.createElement('span');
            tag.className = `rec-player-tag${isOwned ? ' owned-fast' : ''}`;
            
            let emoji = '🌀';
            if (id === 'lee_kang_in') emoji = '💫';
            if (id === 'son_heung_min') emoji = '🌟';
            if (id === 'lee_yeong_jae') emoji = '🏃‍♂️';
            if (id === 'kim_jin_gyu') emoji = '⚽';
            if (id === 'oberdan') emoji = '🌀';
            if (id === 'kang_sang_yoon') emoji = '🔥';
            if (id === 'gamboa') emoji = '⚡';
            if (id === 'maeng_seong_ung') emoji = '🛡️';
            
            tag.innerHTML = `${card.name} (패스 ${card.stats.pas} / ${card.position}) ${emoji}${isOwned ? ' [보유중]' : ''}`;
            listTiki.appendChild(tag);
        });
    }
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

function openTacticModal(tacticType) {
    const tacticModal = document.getElementById('tacticModal');
    const modalDrawer = tacticModal ? tacticModal.querySelector('.tactic-modal-drawer') : null;
    const titleText = document.getElementById('tacticModalTitleText');
    const boxGegen = document.getElementById('tacticBoxGegen');
    const boxTiki = document.getElementById('tacticBoxTiki');
    
    if (tacticModal && modalDrawer) {
        // Remove existing theme classes first
        modalDrawer.classList.remove('gegen-glow', 'tiki-glow');
        
        // Show the respective card and set modal title and glow theme
        if (tacticType === 'gegen') {
            if (titleText) titleText.innerHTML = `<i class="fa-solid fa-bolt" style="color: #ffd700; margin-right: 8px;"></i> 우리 팀의 전방압박 작전`;
            if (boxGegen) boxGegen.style.display = 'block';
            if (boxTiki) boxTiki.style.display = 'none';
            modalDrawer.classList.add('gegen-glow');
        } else if (tacticType === 'tiki') {
            if (titleText) titleText.innerHTML = `<i class="fa-solid fa-arrows-spin" style="color: #00ff87; margin-right: 8px;"></i> 우리 팀의 티키타카 작전`;
            if (boxTiki) boxTiki.style.display = 'block';
            if (boxGegen) boxGegen.style.display = 'none';
            modalDrawer.classList.add('tiki-glow');
        }
        
        tacticModal.classList.add('active');
        checkSquadTactics(); // Sync and redraw recommending tags and states instantly
    }
}

function closeTacticModal() {
    const tacticModal = document.getElementById('tacticModal');
    if (tacticModal) {
        tacticModal.classList.remove('active');
    }
}
