// js/squad.js - 포메이션 & 비밀 작전 보드 모듈

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

// 각 포메이션별 11개 슬롯 좌표 정보 정의
const FORMATION_COORDINATES = {
    '4-4-2': {
        'ST': { top: '10%', left: '35%' },
        'RW': { top: '10%', left: '65%' },
        'LW': { top: '45%', left: '12%' },
        'LCM': { top: '48%', left: '35%' },
        'RCM': { top: '48%', left: '65%' },
        'CM': { top: '45%', left: '88%' },
        'LB': { top: '74%', left: '15%' },
        'LCB': { top: '77%', left: '38%' },
        'RCB': { top: '77%', left: '62%' },
        'RB': { top: '74%', left: '85%' },
        'GK': { top: '90%', left: '50%' }
    },
    '4-3-3': {
        'LW': { top: '15%', left: '15%' },
        'ST': { top: '8%', left: '50%' },
        'RW': { top: '15%', left: '85%' },
        'LCM': { top: '44%', left: '22%' },
        'CM': { top: '50%', left: '50%' },
        'RCM': { top: '44%', left: '78%' },
        'LB': { top: '73%', left: '12%' },
        'LCB': { top: '77%', left: '36%' },
        'RCB': { top: '77%', left: '64%' },
        'RB': { top: '73%', left: '88%' },
        'GK': { top: '90%', left: '50%' }
    },
    '3-4-3': {
        'ST': { top: '8%', left: '50%' },
        'LW': { top: '15%', left: '20%' },
        'RW': { top: '15%', left: '80%' },
        'CM': { top: '34%', left: '50%' },
        'LB': { top: '48%', left: '15%' },
        'RB': { top: '48%', left: '85%' },
        'RCM': { top: '55%', left: '50%' },
        'LCB': { top: '74%', left: '28%' },
        'RCB': { top: '74%', left: '72%' },
        'LCM': { top: '76%', left: '50%' },
        'GK': { top: '90%', left: '50%' }
    },
    '5-4-1': {
        'ST': { top: '8%', left: '50%' },
        'LW': { top: '36%', left: '15%' },
        'RW': { top: '36%', left: '85%' },
        'LCM': { top: '42%', left: '35%' },
        'RCM': { top: '42%', left: '65%' },
        'LB': { top: '65%', left: '12%' },
        'LCB': { top: '74%', left: '30%' },
        'CM': { top: '73%', left: '50%' },
        'RCB': { top: '74%', left: '70%' },
        'RB': { top: '65%', left: '88%' },
        'GK': { top: '90%', left: '50%' }
    },
    '4-2-3-1': {
        'ST': { top: '8%', left: '50%' },
        'LW': { top: '25%', left: '20%' },
        'RW': { top: '25%', left: '80%' },
        'CM': { top: '28%', left: '50%' },
        'LCM': { top: '52%', left: '33%' },
        'RCM': { top: '52%', left: '67%' },
        'LB': { top: '73%', left: '12%' },
        'LCB': { top: '77%', left: '36%' },
        'RCB': { top: '77%', left: '64%' },
        'RB': { top: '73%', left: '88%' },
        'GK': { top: '90%', left: '50%' }
    }
};

// 포메이션 활성화 조건 충족 여부 검사 헬퍼 함수
function validateFormation(formationType) {
    if (formationType === '4-4-2') return true;
    
    if (formationType === '4-3-3') {
        const cmCardId = squadFormation['CM'];
        if (!cmCardId) return false;
        const cmCard = getAwakenedCard(cmCardId);
        return cmCard && cmCard.stats && cmCard.stats.pas >= 80;
    }
    
    if (formationType === '3-4-3') {
        const cmCardId = squadFormation['CM'];
        if (!cmCardId) return false;
        const cmCard = getAwakenedCard(cmCardId);
        return cmCard && cmCard.stats && cmCard.stats.dri >= 80;
    }
    
    if (formationType === '5-4-1') {
        const lwCardId = squadFormation['LW'];
        const rwCardId = squadFormation['RW'];
        let hasValidWinger = false;
        
        if (lwCardId) {
            const lwCard = getAwakenedCard(lwCardId);
            if (lwCard && lwCard.stats && lwCard.stats.pac >= 80) hasValidWinger = true;
        }
        if (rwCardId) {
            const rwCard = getAwakenedCard(rwCardId);
            if (rwCard && rwCard.stats && rwCard.stats.pac >= 80) hasValidWinger = true;
        }
        return hasValidWinger;
    }
    
    if (formationType === '4-2-3-1') {
        const cmCardId = squadFormation['CM'];
        if (!cmCardId) return false;
        const cmCard = getAwakenedCard(cmCardId);
        return cmCard && cmCard.stats && cmCard.stats.dri >= 80;
    }
    
    return false;
}


function renderSquadFormation() {
    let totalOvr = 0;
    
    TACTICAL_POSITIONS.forEach(pos => {
        const slotEl = document.getElementById(`slot-${pos}`);
        if (!slotEl) return;
        
        // 2. 피치 위 동적 포지션 재배치
        const coord = FORMATION_COORDINATES[currentFormation][pos];
        if (coord) {
            slotEl.style.top = coord.top;
            slotEl.style.left = coord.left;
        }
        
        // 3. 핵심 포지션 골드 아우라 하이라이팅
        let isKeySlot = false;
        if (currentFormation === '4-3-3' && pos === 'CM') isKeySlot = true;
        else if (currentFormation === '3-4-3' && pos === 'CM') isKeySlot = true;
        else if (currentFormation === '5-4-1' && (pos === 'LW' || pos === 'RW')) isKeySlot = true;
        else if (currentFormation === '4-2-3-1' && pos === 'CM') isKeySlot = true;
        
        if (isKeySlot) {
            slotEl.classList.add('key-player-slot');
        } else {
            slotEl.classList.remove('key-player-slot');
        }
        
        const cardId = squadFormation[pos];
        let cardData = null;
        
        if (cardId && CARDS_DATABASE[cardId]) {
            cardData = getAwakenedCard(cardId);
        }
        
        let displayPos = pos;
        if (currentFormation === '5-4-1') {
            if (pos === 'LW') displayPos = 'LM';
            else if (pos === 'RW') displayPos = 'RM';
            else if (pos === 'CM') displayPos = 'CB';
        } else if (currentFormation === '3-4-3') {
            if (pos === 'RCM') displayPos = 'DM';
        } else if (currentFormation === '4-2-3-1') {
            if (pos === 'LW') displayPos = 'LM';
            else if (pos === 'RW') displayPos = 'RM';
            else if (pos === 'CM') displayPos = 'AM';
            else if (pos === 'LCM' || pos === 'RCM') displayPos = 'DM';
        }
        
        if (cardData) {
            // Placed player card structure
            totalOvr += cardData.rating;
            const starIndicator = cardData.awakening > 0 ? `<span style="font-size: 0.55rem; color: #ffd700; margin-left: 1px; vertical-align: middle;">★</span>` : '';
            const isCaptain = (cardId === squadCaptain);
            const captainClass = isCaptain ? ' captain-active' : '';
            const captainBadge = isCaptain ? '<div class="mini-card-captain-badge">👑</div>' : '';
            slotEl.innerHTML = `
                <div class="mini-player-card active-placed${captainClass}">
                    ${captainBadge}
                    <div class="mini-card-ovr-badge">${cardData.rating}${starIndicator}</div>
                    <div class="mini-card-position-badge">${displayPos}</div>
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
                    <div class="mini-card-position-badge">${displayPos}</div>
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
    
    // 4. 헤더의 포메이션 설정 버튼 내 라벨 및 스타일 동적 갱신
    const activeLabelEl = document.getElementById('activeFormationLabel');
    if (activeLabelEl) {
        if (currentFormation === '4-4-2') {
            activeLabelEl.innerText = "4-4-2 무전술";
            activeLabelEl.style.color = '#cbd5e1';
        } else if (currentFormation === '4-3-3') {
            activeLabelEl.innerText = "4-3-3 빌드업";
            activeLabelEl.style.color = '#ffd700';
        } else if (currentFormation === '3-4-3') {
            activeLabelEl.innerText = "3-4-3 스위칭";
            activeLabelEl.style.color = '#00ff87';
        } else if (currentFormation === '5-4-1') {
            activeLabelEl.innerText = "5-4-1 역습";
            activeLabelEl.style.color = '#ff3e6c';
        } else if (currentFormation === '4-2-3-1') {
            activeLabelEl.innerText = "4-2-3-1 점유";
            activeLabelEl.style.color = '#00d2fc';
        }
    }
    
    // 전북 현대 OVR 동기화 (K리그 매치 탭 연결)
    if (typeof syncJeonbukOvr === 'function') {
        syncJeonbukOvr();
    } else {
        const teamOvrValEl = document.getElementById('teamOvrVal');
        if (teamOvrValEl) {
            teamOvrValEl.innerText = avgOvr;
        }
    }
    
    // 5. 팀 평균 파라미터 6종 실시간 UI 갱신
    const stats6 = ['pac', 'sho', 'pas', 'dri', 'def', 'phy'];
    stats6.forEach(s => {
        if (typeof getTeamAverageStat === 'function') {
            const val = getTeamAverageStat(s);
            const el = document.getElementById(`teamAvg-${s}`);
            if (el) el.innerText = val;
        }
    });
    


    // 6. 구단 주장 셀렉터 및 UI 실시간 동기화
    if (typeof updateCaptainSelectorUI === 'function') {
        updateCaptainSelectorUI();
    }
}

// 포지션별 실제 카드 포지션 배치 제한 검사 함수
function isPositionCompatible(displayPos, cardPos) {
    if (displayPos === 'GK') {
        return cardPos === 'GK';
    }
    if (displayPos === 'ST') {
        return ['ST', 'LW', 'RW'].includes(cardPos);
    }
    if (['LW', 'RW', 'LM', 'RM'].includes(displayPos)) {
        return ['LW', 'RW'].includes(cardPos);
    }
    if (displayPos === 'AM') {
        return ['CM', 'LW', 'RW'].includes(cardPos);
    }
    if (['CM', 'LCM', 'RCM', 'DM'].includes(displayPos)) {
        return cardPos === 'CM';
    }
    if (['CB', 'LCB', 'RCB', 'LB', 'RB'].includes(displayPos)) {
        return ['CB', 'LB', 'RB'].includes(cardPos);
    }
    return false;
}

function openCardSelector(position) {
    activeSelectorPosition = position;
    
    const overlay = document.getElementById('drawerOverlay');
    const title = document.getElementById('drawerPositionTitle');
    const content = document.getElementById('drawerContent');
    
    let displayTitle = position;
    
    if (currentFormation === '5-4-1') {
        if (position === 'LW') displayTitle = 'LM';
        else if (position === 'RW') displayTitle = 'RM';
        else if (position === 'CM') displayTitle = 'CB';
    } else if (currentFormation === '3-4-3') {
        if (position === 'RCM') displayTitle = 'DM';
    } else if (currentFormation === '4-2-3-1') {
        if (position === 'LW') displayTitle = 'LM';
        else if (position === 'RW') displayTitle = 'RM';
        else if (position === 'CM') displayTitle = 'AM';
        else if (position === 'LCM' || position === 'RCM') displayTitle = 'DM';
    }
    title.innerText = displayTitle;
    overlay.classList.add('active');
    
    // Clear and render choices
    content.innerHTML = '';
    
    // 핵심 포지션 가이드 배너 추가
    let bannerHtml = '';
    if (currentFormation === '4-3-3' && position === 'CM') {
        bannerHtml = `
            <div style="background: rgba(255, 215, 0, 0.1); border: 1.5px solid rgba(255, 215, 0, 0.3); padding: 0.8rem 1rem; border-radius: 12px; font-size: 0.8rem; color: #ffd700; line-height: 1.45; font-weight: bold; margin-bottom: 1rem; text-align: left; word-break: keep-all;">
                <i class="fa-solid fa-star" style="margin-right: 4px; animation: keyPlayerLabelPulse 1.5s infinite alternate;"></i> 
                <strong>[4-3-3 빌드업 핵심 자리 - CM]</strong><br>
                패스(PAS)가 <strong>80 이상</strong>인 선수를 기용하면 전술이 활성화되며, 핵심 선수 패스 수치 비례 <strong>공격권 획득 확률 보너스</strong>를 획득합니다! (80 초과 1점당 +0.5%)
            </div>
        `;
    } else if (currentFormation === '3-4-3' && position === 'CM') {
        bannerHtml = `
            <div style="background: rgba(0, 255, 135, 0.1); border: 1.5px solid rgba(0, 255, 135, 0.3); padding: 0.8rem 1rem; border-radius: 12px; font-size: 0.8rem; color: #00ff87; line-height: 1.45; font-weight: bold; margin-bottom: 1rem; text-align: left; word-break: keep-all;">
                <i class="fa-solid fa-star" style="margin-right: 4px; animation: keyPlayerLabelPulse 1.5s infinite alternate;"></i> 
                <strong>[3-4-3 스위칭 핵심 자리 - CM (CAM)]</strong><br>
                드리블(DRI)이 <strong>80 이상</strong>인 선수를 기용하면 전술이 활성화되며, 핵심 선수 드리블 수치 비례 <strong>공격권 획득 확률 보너스</strong>를 획득합니다! (80 초과 1점당 +0.5%)
            </div>
        `;
    } else if (currentFormation === '5-4-1' && (position === 'LW' || position === 'RW')) {
        const displayWingerPos = position === 'LW' ? 'LM' : 'RM';
        bannerHtml = `
            <div style="background: rgba(255, 62, 108, 0.1); border: 1.5px solid rgba(255, 62, 108, 0.3); padding: 0.8rem 1rem; border-radius: 12px; font-size: 0.8rem; color: #ff3e6c; line-height: 1.45; font-weight: bold; margin-bottom: 1rem; text-align: left; word-break: keep-all;">
                <i class="fa-solid fa-star" style="margin-right: 4px; animation: keyPlayerLabelPulse 1.5s infinite alternate;"></i> 
                <strong>[5-4-1 역습 핵심 자리 - ${displayWingerPos}]</strong><br>
                속도(PAC)가 <strong>80 이상</strong>인 선수를 이 자리(${displayWingerPos})에 기용하면 전술이 활성화되며, 핵심 LM/RM 속도 비례 <strong>득점 성공 확률 보너스</strong>를 획득합니다! (80 초과 1점당 +0.5%)
            </div>
        `;
    } else if (currentFormation === '4-2-3-1' && position === 'CM') {
        bannerHtml = `
            <div style="background: rgba(0, 210, 252, 0.1); border: 1.5px solid rgba(0, 210, 252, 0.3); padding: 0.8rem 1rem; border-radius: 12px; font-size: 0.8rem; color: #00d2fc; line-height: 1.45; font-weight: bold; margin-bottom: 1rem; text-align: left; word-break: keep-all;">
                <i class="fa-solid fa-star" style="margin-right: 4px; animation: keyPlayerLabelPulse 1.5s infinite alternate;"></i> 
                <strong>[4-2-3-1 점유율 핵심 자리 - AM (CM)]</strong><br>
                드리블(DRI)이 <strong>80 이상</strong>인 선수를 기용하면 전술이 활성화되며, 핵심 선수 드리블 수치 비례 <strong>공격권 획득 확률 보너스</strong>를 획득합니다! (80 초과 1점당 +0.5%)
            </div>
        `;
    }
    
    if (bannerHtml) {
        const bannerContainer = document.createElement('div');
        bannerContainer.innerHTML = bannerHtml;
        content.appendChild(bannerContainer);
    }
    
    // If a player is already assigned, show the Release button first
    const assignedPlayerId = squadFormation[position];
    if (assignedPlayerId) {
        const releaseBtn = document.createElement('button');
        releaseBtn.className = 'btn-release-player';
        releaseBtn.innerHTML = `<i class="fa-solid fa-user-minus" style="margin-right: 6px;"></i>배치 해제`;
        releaseBtn.onclick = () => releasePlayerFromPosition();
        content.appendChild(releaseBtn);
    }
    
    // Retrieve all collected cards from deck and sort by placeability (compatible first), then by rating (OVR) in descending order
    const deckKeys = Object.keys(playerDeck)
        .filter(k => playerDeck[k].quantity > 0)
        .sort((a, b) => {
            const cardA = getAwakenedCard(a);
            const cardB = getAwakenedCard(b);
            
            const isCompA = cardA ? isPositionCompatible(displayTitle, cardA.position) : false;
            const isCompB = cardB ? isPositionCompatible(displayTitle, cardB.position) : false;
            
            // 배치 가능한 선수를 항상 우선하여 최상단 정렬
            if (isCompA && !isCompB) return -1;
            if (!isCompA && isCompB) return 1;
            
            // 배치 가능 여부가 동일할 경우 OVR 역순(내림차순) 정렬
            const ratingA = cardA ? cardA.rating : 0;
            const ratingB = cardB ? cardB.rating : 0;
            return ratingB - ratingA;
        });
    
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
        
        const isCompatible = isPositionCompatible(displayTitle, card.position);
        
        // Render item row
        const row = document.createElement('div');
        row.className = 'drawer-card-item';
        if (!isCompatible) {
            row.style.opacity = '0.55';
            row.style.transition = 'opacity 0.2s ease';
        }
        
        // Check if this card is already assigned *to this specific slot*
        const isCurrentSlot = assignedPlayerId === key;
        
        // 추천 태그 및 OVR 조건 충족 배지 삽입
        let recTagHtml = '';
        if (currentFormation === '4-3-3' && position === 'CM') {
            if (card.stats && card.stats.pas >= 80) {
                recTagHtml = `<span style="font-size: 0.65rem; background: rgba(255, 215, 0, 0.2); color: #ffd700; border: 1px solid #ffd700; padding: 1px 5px; border-radius: 4px; font-weight: 800; margin-left: 6px;">[PAS 80+ 추천]</span>`;
            }
        } else if (currentFormation === '3-4-3' && position === 'CM') {
            if (card.stats && card.stats.dri >= 80) {
                recTagHtml = `<span style="font-size: 0.65rem; background: rgba(0, 255, 135, 0.2); color: #00ff87; border: 1px solid #00ff87; padding: 1px 5px; border-radius: 4px; font-weight: 800; margin-left: 6px;">[DRI 80+ 추천]</span>`;
            }
        } else if (currentFormation === '5-4-1' && (position === 'LW' || position === 'RW')) {
            if (card.stats && card.stats.pac >= 80) {
                recTagHtml = `<span style="font-size: 0.65rem; background: rgba(255, 62, 108, 0.2); color: #ff3e6c; border: 1px solid #ff3e6c; padding: 1px 5px; border-radius: 4px; font-weight: 800; margin-left: 6px;">[PAC 80+ 추천]</span>`;
            }
        } else if (currentFormation === '4-2-3-1' && position === 'CM') {
            if (card.stats && card.stats.dri >= 80) {
                recTagHtml = `<span style="font-size: 0.65rem; background: rgba(0, 210, 252, 0.2); color: #00d2fc; border: 1px solid #00d2fc; padding: 1px 5px; border-radius: 4px; font-weight: 800; margin-left: 6px;">[DRI 80+ 추천]</span>`;
            }
        }
        
        const awkLabel = card.awakening > 0 ? `<span style="color: #ffd700; font-weight: 800; font-size: 0.8rem; margin-left: 5px;">★ ${card.awakening}</span>` : '';
        const statusText = availableCount > 0 ? `<span style="color: #00ff87; font-weight: 600;">기용 가능</span>` : `<span style="color: var(--text-muted);">다른 자리에 배치됨</span>`;
        
        const stats = card.stats || { pac: 70, sho: 70, pas: 70, dri: 70, def: 70, phy: 70 };
        row.innerHTML = `
            <div class="drawer-card-info" style="align-items: flex-start;">
                <div class="drawer-card-thumb" style="background: radial-gradient(circle, ${card.theme.glow}22 0%, #0c1122 100%); margin-top: 4px;">
                    <img src="${card.image}" alt="${card.name}" onerror="this.src='https://placehold.co/48x48/005a3c/ffd700?text=${encodeURIComponent(card.name)}'">
                </div>
                <div class="drawer-card-details">
                    <h4 style="margin: 0 0 4px 0; display: flex; align-items: center; flex-wrap: wrap; gap: 4px;">${card.name} (OVR ${card.rating})${awkLabel}${recTagHtml}</h4>
                    <p style="margin: 0 0 6px 0; font-size: 0.78rem;">${card.position} | 상태: ${statusText}</p>
                    <div class="drawer-card-stats" style="display: flex; gap: 4px; flex-wrap: wrap;">
                        <span style="font-size: 0.62rem; font-weight: 700; background: rgba(255, 62, 108, 0.15); border: 1px solid rgba(255, 62, 108, 0.3); padding: 1px 4px; border-radius: 4px; color: #ff3e6c;">속도 ${stats.pac}</span>
                        <span style="font-size: 0.62rem; font-weight: 700; background: rgba(255, 159, 67, 0.15); border: 1px solid rgba(255, 159, 67, 0.3); padding: 1px 4px; border-radius: 4px; color: #ff9f43;">슈팅 ${stats.sho}</span>
                        <span style="font-size: 0.62rem; font-weight: 700; background: rgba(255, 215, 0, 0.15); border: 1px solid rgba(255, 215, 0, 0.3); padding: 1px 4px; border-radius: 4px; color: #ffd700;">패스 ${stats.pas}</span>
                        <span style="font-size: 0.62rem; font-weight: 700; background: rgba(0, 255, 135, 0.15); border: 1px solid rgba(0, 255, 135, 0.3); padding: 1px 4px; border-radius: 4px; color: #00ff87;">드리블 ${stats.dri}</span>
                        <span style="font-size: 0.62rem; font-weight: 700; background: rgba(0, 210, 252, 0.15); border: 1px solid rgba(0, 210, 252, 0.3); padding: 1px 4px; border-radius: 4px; color: #00d2fc;">수비 ${stats.def}</span>
                        <span style="font-size: 0.62rem; font-weight: 700; background: rgba(165, 88, 234, 0.15); border: 1px solid rgba(165, 88, 234, 0.3); padding: 1px 4px; border-radius: 4px; color: #a55eea;">피지컬 ${stats.phy}</span>
                    </div>
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
        } else if (!isCompatible) {
            actionBtn.className = 'btn-select-player';
            actionBtn.style.background = 'rgba(255, 62, 108, 0.08)';
            actionBtn.style.color = '#ff3e6c';
            actionBtn.style.border = '1px solid rgba(255, 62, 108, 0.2)';
            actionBtn.style.cursor = 'not-allowed';
            actionBtn.innerText = '포지션 제한';
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
    
    const card = CARDS_DATABASE[cardId];
    if (!card) return;
    
    // Get active slot's display position
    let displayTitle = activeSelectorPosition;
    if (currentFormation === '5-4-1') {
        if (activeSelectorPosition === 'LW') displayTitle = 'LM';
        else if (activeSelectorPosition === 'RW') displayTitle = 'RM';
        else if (activeSelectorPosition === 'CM') displayTitle = 'CB';
    } else if (currentFormation === '3-4-3') {
        if (activeSelectorPosition === 'RCM') displayTitle = 'DM';
    } else if (currentFormation === '4-2-3-1') {
        if (activeSelectorPosition === 'LW') displayTitle = 'LM';
        else if (activeSelectorPosition === 'RW') displayTitle = 'RM';
        else if (activeSelectorPosition === 'CM') displayTitle = 'AM';
        else if (activeSelectorPosition === 'LCM' || activeSelectorPosition === 'RCM') displayTitle = 'DM';
    }
    
    if (!isPositionCompatible(displayTitle, card.position)) {
        showToast(`❌ 이 포지션(${displayTitle})에는 ${card.position} 선수를 배치할 수 없습니다!`);
        return;
    }
    
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
    activeSelectorSquadNumber = null;
}


// ==========================================
// 포메이션 설정 모달 제어 및 변경 엔진
// ==========================================
function openFormationModal() {
    const modal = document.getElementById('formationModal');
    if (modal) {
        modal.classList.add('active');
        updateFormationModalUI();
    }
}

function closeFormationModal() {
    const modal = document.getElementById('formationModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

function updateFormationModalUI() {
    const formations = ['4-4-2', '4-3-3', '3-4-3', '5-4-1', '4-2-3-1'];
    formations.forEach(f => {
        const cardEl = document.getElementById(`formCard-${f}`);
        const statusEl = document.getElementById(`formStatus-${f}`);
        if (!cardEl || !statusEl) return;
        
        const isValid = validateFormation(f);
        const isActive = (currentFormation === f);
        
        // 초기화
        cardEl.style.borderColor = 'rgba(255, 255, 255, 0.08)';
        cardEl.style.background = 'rgba(255, 255, 255, 0.02)';
        cardEl.style.boxShadow = 'none';
        
        if (isActive) {
            // 현재 선택된 활성 포메이션 스타일
            if (f === '4-4-2') {
                cardEl.style.borderColor = '#cbd5e1';
                cardEl.style.boxShadow = '0 0 15px rgba(203, 213, 225, 0.3)';
            } else if (f === '4-3-3') {
                cardEl.style.borderColor = '#ffd700';
                cardEl.style.boxShadow = '0 0 15px rgba(255, 215, 0, 0.3)';
            } else if (f === '3-4-3') {
                cardEl.style.borderColor = '#00ff87';
                cardEl.style.boxShadow = '0 0 15px rgba(0, 255, 133, 0.3)';
            } else if (f === '5-4-1') {
                cardEl.style.borderColor = '#ff3e6c';
                cardEl.style.boxShadow = '0 0 15px rgba(255, 62, 108, 0.3)';
            } else if (f === '4-2-3-1') {
                cardEl.style.borderColor = '#00d2fc';
                cardEl.style.boxShadow = '0 0 15px rgba(0, 210, 252, 0.3)';
            }
            cardEl.style.background = 'rgba(255, 255, 255, 0.05)';
            
            // 뱃지 상태 업데이트
            statusEl.className = "tactic-status-badge active";
            if (f === '4-4-2') {
                statusEl.innerText = "사용 중";
                statusEl.style.background = 'rgba(255,255,255,0.08)';
                statusEl.style.color = '#fff';
                statusEl.style.borderColor = 'rgba(255,255,255,0.2)';
            } else {
                if (isValid) {
                    statusEl.innerText = "사용 중 (보너스 활성)";
                    if (f === '4-3-3') {
                        statusEl.style.background = 'rgba(255, 215, 0, 0.18)';
                        statusEl.style.color = '#ffd700';
                        statusEl.style.borderColor = '#ffd700';
                    } else if (f === '3-4-3') {
                        statusEl.style.background = 'rgba(0, 255, 135, 0.18)';
                        statusEl.style.color = '#00ff87';
                        statusEl.style.borderColor = '#00ff87';
                    } else if (f === '5-4-1') {
                        statusEl.style.background = 'rgba(255, 62, 108, 0.18)';
                        statusEl.style.color = '#ff3e6c';
                        statusEl.style.borderColor = '#ff3e6c';
                    } else if (f === '4-2-3-1') {
                        statusEl.style.background = 'rgba(0, 210, 252, 0.18)';
                        statusEl.style.color = '#00d2fc';
                        statusEl.style.borderColor = '#00d2fc';
                    }
                } else {
                    statusEl.innerText = "사용 중 (보너스 미활성)";
                    statusEl.style.background = 'rgba(255, 255, 255, 0.05)';
                    statusEl.style.color = '#ff8888';
                    statusEl.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                }
            }
        } else {
            // 선택되지 않은 포메이션 스타일
            if (f === '4-4-2' || isValid) {
                statusEl.innerText = f === '4-4-2' ? "선택 가능" : "선택 가능 (보너스 준비)";
                statusEl.className = "tactic-status-badge active";
                statusEl.style.background = 'rgba(255, 255, 255, 0.05)';
                statusEl.style.color = '#cbd5e1';
                statusEl.style.borderColor = 'rgba(255, 255, 255, 0.2)';
            } else {
                statusEl.innerText = "선택 가능 (보너스 미활성)";
                statusEl.className = "tactic-status-badge inactive";
                statusEl.style.background = 'rgba(255, 255, 255, 0.02)';
                statusEl.style.color = 'var(--text-muted)';
                statusEl.style.borderColor = 'rgba(255, 255, 255, 0.08)';
            }
        }
    });
}

function changeFormation(type) {
    if (type === currentFormation) {
        closeFormationModal();
        return;
    }
    
    currentFormation = type;
    try {
        localStorage.setItem('fc_star_current_formation', type);
    } catch (e) {}
    
    closeFormationModal();
    renderSquadFormation();
    if (typeof syncJeonbukOvr === 'function') {
        syncJeonbukOvr();
    }
    
    const isValid = validateFormation(type);
    if (isValid) {
        showToast(`⚽ 포메이션이 '${type}'(으)로 변경되었습니다! (전술 보너스 활성)`);
    } else {
        showToast(`⚽ 포메이션이 '${type}'(으)로 변경되었습니다. (핵심 조건 미달로 보너스 비활성)`);
    }
    
    // Auto-save
    saveUserProgress();
}

// ==========================================================================
// 10. SQUAD NUMBERS SETTINGS LOGIC (등번호 설정 시스템)
// ==========================================================================
let activeSelectorSquadNumber = null;

// 등번호 모달 열기 및 목록 렌더링
function openSquadNumberModal() {
    const modal = document.getElementById('squadNumberModal');
    if (!modal) return;
    
    modal.style.display = 'flex';
    modal.classList.add('active');
    
    renderSquadNumbersList();
}

// 등번호 모달 닫기
function closeSquadNumberModal() {
    const modal = document.getElementById('squadNumberModal');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
    }
}

// 등번호 목록 실시간 동적 빌드
function renderSquadNumbersList() {
    const fixedGrid = document.getElementById('fixedSquadNumbersGrid');
    const customGrid = document.getElementById('customSquadNumbersGrid');
    if (!fixedGrid || !customGrid) return;
    
    fixedGrid.innerHTML = '';
    customGrid.innerHTML = '';
    
    // 1~30번 리스트 빌드
    for (let i = 1; i <= 30; i++) {
        const item = squadNumbers[i];
        if (!item) continue;
        
        const cardId = item.cardId;
        let isAssigned = false;
        let playerNameAndOvr = '<i class="fa-solid fa-plus" style="margin-right: 4px; opacity: 0.5;"></i> 선수 배정하기';
        let cardClass = '';
        
        if (cardId && CARDS_DATABASE[cardId]) {
            const cardData = getAwakenedCard(cardId);
            if (cardData) {
                isAssigned = true;
                const starStr = cardData.awakening > 0 ? `★${cardData.awakening} ` : '';
                playerNameAndOvr = `${cardData.name} <span class="badge-ovr">${starStr}OVR ${cardData.rating}</span>`;
                
                // 등급 판정
                if (cardData.rarity === 'legend') {
                    cardClass = 'legend';
                } else if (cardData.rating >= 80) {
                    cardClass = 'premium';
                } else {
                    cardClass = 'common';
                }
            }
        }
        
        const row = document.createElement('div');
        row.className = 'squad-number-row';
        
        if (i <= 20) {
            // 1~20번: 고정 등번호
            row.innerHTML = `
                <div class="squad-number-badge fixed">${i}</div>
                <div class="squad-number-player-box ${isAssigned ? 'assigned ' + cardClass : 'empty'}" onclick="openSquadNumberPlayerSelector('${i}')">
                    ${playerNameAndOvr}
                </div>
            `;
            fixedGrid.appendChild(row);
        } else {
            // 21~30번: 자유 커스텀 등번호
            row.innerHTML = `
                <input type="number" class="squad-number-input" min="1" max="99" value="${item.number}" onchange="changeCustomSquadNumber('${i}', this.value)" title="등번호 숫자 직접 수정 (1~99)">
                <div class="squad-number-player-box ${isAssigned ? 'assigned ' + cardClass : 'empty'}" onclick="openSquadNumberPlayerSelector('${i}')">
                    ${playerNameAndOvr}
                </div>
            `;
            customGrid.appendChild(row);
        }
    }
}

// 등번호용 선수 선택 드로어 열기
function openSquadNumberPlayerSelector(numKey) {
    activeSelectorSquadNumber = numKey;
    activeSelectorPosition = null;
    
    const overlay = document.getElementById('drawerOverlay');
    const title = document.getElementById('drawerPositionTitle');
    const content = document.getElementById('drawerContent');
    
    if (!overlay || !title || !content) return;
    
    const item = squadNumbers[numKey];
    title.innerText = `${item.number}번 배정`;
    overlay.classList.add('active');
    
    content.innerHTML = '';
    
    // 안내용 가이드 배너 추가
    const banner = document.createElement('div');
    banner.innerHTML = `
        <div style="background: rgba(0, 255, 135, 0.08); border: 1px solid rgba(0, 255, 135, 0.3); padding: 0.8rem 1rem; border-radius: 12px; font-size: 0.8rem; color: #00ff87; line-height: 1.45; font-weight: bold; margin-bottom: 1rem; text-align: left; word-break: keep-all;">
            <i class="fa-solid fa-circle-info" style="margin-right: 4px;"></i> 
            <strong>[스쿼드 등번호 배정]</strong><br>
            원하는 선수를 선택하여 <strong>${item.number}번</strong> 등번호를 배정하세요. (이미 배정된 선수는 기존 배정이 자동 해제됩니다!)
        </div>
    `;
    content.appendChild(banner);
    
    // 현재 등번호에 선수가 배정되어 있는 경우 배치 해제 버튼 제공
    if (item.cardId) {
        const releaseBtn = document.createElement('button');
        releaseBtn.className = 'btn-release-player';
        releaseBtn.innerHTML = `<i class="fa-solid fa-user-minus" style="margin-right: 6px;"></i>등번호 배정 해제`;
        releaseBtn.onclick = () => releasePlayerFromSquadNumber(numKey);
        content.appendChild(releaseBtn);
    }
    
    // 보유한 카드 가져와 정렬 (OVR 내림차순)
    const deckKeys = Object.keys(playerDeck)
        .filter(k => playerDeck[k].quantity > 0)
        .sort((a, b) => {
            const cardA = getAwakenedCard(a);
            const cardB = getAwakenedCard(b);
            const ratingA = cardA ? cardA.rating : 0;
            const ratingB = cardB ? cardB.rating : 0;
            return ratingB - ratingA;
        });
        
    if (deckKeys.length === 0) {
        content.innerHTML += `
            <div class="empty-drawer-state">
                <i class="fa-regular fa-face-frown"></i>
                <p>아직 수집한 선수가 없습니다.<br>카드 팩에서 선수를 먼저 영입하세요!</p>
            </div>
        `;
        return;
    }
    
    deckKeys.forEach(key => {
        const card = getAwakenedCard(key);
        if (!card) return;
        
        // 현재 이 카드가 다른 등번호 슬롯에 이미 배정되어 있는지 확인
        let otherNumKey = null;
        for (let idx = 1; idx <= 30; idx++) {
            if (squadNumbers[idx] && squadNumbers[idx].cardId === key) {
                otherNumKey = idx;
                break;
            }
        }
        
        const isCurrentSlot = item.cardId === key;
        const awkLabel = card.awakening > 0 ? `<span style="color: #ffd700; font-weight: 800; font-size: 0.8rem; margin-left: 5px;">★ ${card.awakening}</span>` : '';
        
        let statusHtml = '';
        if (isCurrentSlot) {
            statusHtml = `<span style="color: #ffd700; font-weight: bold;">이 등번호 사용 중</span>`;
        } else if (otherNumKey) {
            statusHtml = `<span style="color: #60efff; font-weight: bold;">현재 ${squadNumbers[otherNumKey].number}번 사용 중</span>`;
        } else {
            statusHtml = `<span style="color: #94a3b8; font-weight: normal;">미배정 상태</span>`;
        }
        
        const row = document.createElement('div');
        row.className = 'drawer-card-item';
        
        const stats = card.stats || { pac: 70, sho: 70, pas: 70, dri: 70, def: 70, phy: 70 };
        row.innerHTML = `
            <div class="drawer-card-info" style="align-items: flex-start;">
                <div class="drawer-card-thumb" style="background: radial-gradient(circle, ${card.theme.glow}22 0%, #0c1122 100%); margin-top: 4px;">
                    <img src="${card.image}" alt="${card.name}" onerror="this.src='https://placehold.co/48x48/005a3c/ffd700?text=${encodeURIComponent(card.name)}'">
                </div>
                <div class="drawer-card-details">
                    <h4 style="margin: 0 0 4px 0; display: flex; align-items: center; flex-wrap: wrap; gap: 4px;">${card.name} (OVR ${card.rating})${awkLabel}</h4>
                    <p style="margin: 0 0 6px 0; font-size: 0.78rem;">${card.position} | 상태: ${statusHtml}</p>
                    <div class="drawer-card-stats" style="display: flex; gap: 4px; flex-wrap: wrap;">
                        <span style="font-size: 0.62rem; font-weight: 700; background: rgba(255, 62, 108, 0.12); border: 1px solid rgba(255, 62, 108, 0.2); padding: 1px 4px; border-radius: 4px; color: #ff3e6c;">속도 ${stats.pac}</span>
                        <span style="font-size: 0.62rem; font-weight: 700; background: rgba(255, 159, 67, 0.12); border: 1px solid rgba(255, 159, 67, 0.2); padding: 1px 4px; border-radius: 4px; color: #ff9f43;">슈팅 ${stats.sho}</span>
                        <span style="font-size: 0.62rem; font-weight: 700; background: rgba(255, 215, 0, 0.12); border: 1px solid rgba(255, 215, 0, 0.2); padding: 1px 4px; border-radius: 4px; color: #ffd700;">패스 ${stats.pas}</span>
                        <span style="font-size: 0.62rem; font-weight: 700; background: rgba(0, 255, 135, 0.12); border: 1px solid rgba(0, 255, 135, 0.2); padding: 1px 4px; border-radius: 4px; color: #00ff87;">드리블 ${stats.dri}</span>
                        <span style="font-size: 0.62rem; font-weight: 700; background: rgba(0, 210, 252, 0.12); border: 1px solid rgba(0, 210, 252, 0.2); padding: 1px 4px; border-radius: 4px; color: #00d2fc;">수비 ${stats.def}</span>
                        <span style="font-size: 0.62rem; font-weight: 700; background: rgba(165, 88, 234, 0.12); border: 1px solid rgba(165, 88, 234, 0.2); padding: 1px 4px; border-radius: 4px; color: #a55eea;">피지컬 ${stats.phy}</span>
                    </div>
                </div>
            </div>
        `;
        
        const actionBtn = document.createElement('button');
        actionBtn.className = 'btn-select-player';
        
        if (isCurrentSlot) {
            actionBtn.style.background = 'rgba(255, 255, 255, 0.1)';
            actionBtn.style.color = '#fff';
            actionBtn.style.cursor = 'default';
            actionBtn.innerText = '배정됨';
        } else {
            actionBtn.innerText = '선택';
            actionBtn.onclick = () => selectPlayerForSquadNumber(key);
        }
        
        row.appendChild(actionBtn);
        content.appendChild(row);
    });
}

// 선수를 특정 등번호에 최종 배정
function selectPlayerForSquadNumber(cardId) {
    if (!activeSelectorSquadNumber) return;
    
    // 1인 1번호 원칙: 타 슬롯에 이 선수가 있다면 먼저 배제 처리 (지능형 스왑)
    for (let idx = 1; idx <= 30; idx++) {
        if (squadNumbers[idx] && squadNumbers[idx].cardId === cardId) {
            squadNumbers[idx].cardId = null;
        }
    }
    
    // 배정
    squadNumbers[activeSelectorSquadNumber].cardId = cardId;
    
    // 상태 저장
    try {
        localStorage.setItem('fc_star_squad_numbers', JSON.stringify(squadNumbers));
    } catch(e) {
        console.warn("등번호 저장 실패:", e);
    }
    
    closeDrawer();
    renderSquadNumbersList();
    
    const cardName = CARDS_DATABASE[cardId].name;
    const numVal = squadNumbers[activeSelectorSquadNumber].number;
    showToast(`👕 ${cardName} 선수에게 등번호 ${numVal}번을 배정했습니다!`);
    
    // 클라우드 자동 세이브
    saveUserProgress();
}

// 특정 등번호 배정 해제
function releasePlayerFromSquadNumber(numKey) {
    const item = squadNumbers[numKey];
    if (!item) return;
    
    const assignedPlayerId = item.cardId;
    const cardName = assignedPlayerId ? CARDS_DATABASE[assignedPlayerId].name : "무명";
    
    item.cardId = null;
    
    // 상태 저장
    try {
        localStorage.setItem('fc_star_squad_numbers', JSON.stringify(squadNumbers));
    } catch(e) {
        console.warn("등번호 저장 실패:", e);
    }
    
    closeDrawer();
    renderSquadNumbersList();
    showToast(`👕 등번호 ${item.number}번(${cardName}) 선수의 배정을 해제했습니다.`);
    
    // 클라우드 자동 세이브
    saveUserProgress();
}

// 21~30번 커스텀 자유 번호의 숫자 직접 변경
function changeCustomSquadNumber(numKey, newNumberVal) {
    const item = squadNumbers[numKey];
    if (!item) return;
    
    const parsedVal = parseInt(newNumberVal);
    if (isNaN(parsedVal) || parsedVal < 1 || parsedVal > 99) {
        showToast("⚠️ 등번호는 1번부터 99번 사이의 숫자만 입력 가능합니다.");
        renderSquadNumbersList(); // 원복 복원
        return;
    }
    
    const oldNum = item.number;
    item.number = parsedVal;
    
    // 상태 저장
    try {
        localStorage.setItem('fc_star_squad_numbers', JSON.stringify(squadNumbers));
    } catch(e) {
        console.warn("등번호 저장 실패:", e);
    }
    
    renderSquadNumbersList();
    showToast(`👕 등번호 슬롯 ${numKey}의 번호가 No.${oldNum}번에서 No.${parsedVal}번으로 변경되었습니다!`);
    
    // 클라우드 자동 세이브
    saveUserProgress();
}

// ==========================================================================
// 11. SQUAD CAPTAIN SETTINGS LOGIC (구단 주장 임명 및 출전대기 감지 시스템)
// ==========================================================================

// 구단 주장 UI 갱신 함수 (선발 제외 ⏳ 대기 감지 포함)
function updateCaptainSelectorUI() {
    const selectCaptainEl = document.getElementById('select-squad-captain');
    const nameDisplayEl = document.getElementById('captain-display-name');
    if (!selectCaptainEl || !nameDisplayEl) return;

    // 현재 포메이션에 배치된 실존 선수(anonymous가 아닌 카드) ID 수집
    const best11Cards = [];
    TACTICAL_POSITIONS.forEach(pos => {
        const cardId = squadFormation[pos];
        if (cardId && CARDS_DATABASE[cardId]) {
            best11Cards.push(cardId);
        }
    });

    // select option들 초기화
    selectCaptainEl.innerHTML = '<option value="">주장 임명 (베스트 11)</option>';

    // 베스트 11 기용 멤버 option 추가 (중복 제거)
    const uniqueBest11 = [...new Set(best11Cards)];
    uniqueBest11.forEach(cardId => {
        const card = CARDS_DATABASE[cardId];
        if (card) {
            const opt = document.createElement('option');
            opt.value = cardId;
            opt.innerText = `${card.name} (${card.position})`;
            selectCaptainEl.appendChild(opt);
        }
    });

    // 현재 주장 상태에 따른 분기 처리
    if (squadCaptain) {
        const captainCard = CARDS_DATABASE[squadCaptain];
        if (captainCard) {
            const isPlaced = uniqueBest11.includes(squadCaptain);
            if (isPlaced) {
                // 선발 출전 중
                nameDisplayEl.innerHTML = `<i class="fa-solid fa-crown" style="color: #ffd700; margin-right: 4px;"></i>${captainCard.name}`;
                nameDisplayEl.style.color = '#ffd700';
                nameDisplayEl.style.background = 'rgba(255, 215, 0, 0.1)';
                nameDisplayEl.style.borderColor = 'rgba(255, 215, 0, 0.3)';
                selectCaptainEl.value = squadCaptain;
            } else {
                // 스쿼드 이탈 (출전 대기 ⏳ 상태)
                nameDisplayEl.innerHTML = `<i class="fa-solid fa-crown" style="color: #ff9f43; margin-right: 4px;"></i>${captainCard.name} <span style="font-size: 0.72rem; color: #ff9f43; font-weight: bold; background: rgba(255, 159, 67, 0.15); padding: 1px 4px; border-radius: 4px; margin-left: 2px;">(출전대기 ⏳)</span>`;
                nameDisplayEl.style.color = '#ff9f43';
                nameDisplayEl.style.background = 'rgba(255, 159, 67, 0.08)';
                nameDisplayEl.style.borderColor = 'rgba(255, 159, 67, 0.25)';

                // select에도 출전대기 상태 선수 임시 추가하여 selected 처리
                const opt = document.createElement('option');
                opt.value = squadCaptain;
                opt.innerText = `${captainCard.name} (출전대기 ⏳)`;
                opt.selected = true;
                selectCaptainEl.appendChild(opt);
            }
        } else {
            // 비정상 데이터 소거
            squadCaptain = null;
            nameDisplayEl.innerText = "미지정 ❌";
            nameDisplayEl.style.color = '#cbd5e1';
            nameDisplayEl.style.background = 'rgba(255, 255, 255, 0.05)';
            nameDisplayEl.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            selectCaptainEl.value = "";
            try { localStorage.removeItem('fc_star_squad_captain'); } catch(e) {}
        }
    } else {
        // 미지정
        nameDisplayEl.innerText = "미지정 ❌";
        nameDisplayEl.style.color = '#cbd5e1';
        nameDisplayEl.style.background = 'rgba(255, 255, 255, 0.05)';
        nameDisplayEl.style.borderColor = 'rgba(255, 255, 255, 0.1)';
        selectCaptainEl.value = "";
    }
}

// 구단 주장 지정/해임 변경 처리 함수
function changeSquadCaptain(cardId) {
    if (!cardId) {
        // 주장 해임
        const oldCaptain = squadCaptain;
        squadCaptain = null;
        try {
            localStorage.removeItem('fc_star_squad_captain');
        } catch (e) {}
        
        renderSquadFormation();
        
        if (oldCaptain && CARDS_DATABASE[oldCaptain]) {
            showToast(`👑 ${CARDS_DATABASE[oldCaptain].name} 선수의 주장 지정을 취소했습니다.`);
        } else {
            showToast(`👑 주장을 해임하였습니다.`);
        }
    } else {
        // 주장 지정
        squadCaptain = cardId;
        try {
            localStorage.setItem('fc_star_squad_captain', cardId);
        } catch (e) {}
        
        renderSquadFormation();
        
        if (CARDS_DATABASE[cardId]) {
            showToast(`👑 ${CARDS_DATABASE[cardId].name} 선수를 구단 주장으로 새롭게 임명했습니다!`);
        }
    }
    
    // Firebase 백업 동기화
    if (typeof saveUserProgress === 'function') {
        saveUserProgress();
    }
}


