// js/deck.js - 선수 컬렉션 & 보관함(Storage) 모듈

// 포지션 필터링 전역 상태
let currentDeckPositionFilter = 'ALL';
let currentStoragePositionFilter = 'ALL';

// 포지션 대분류 매칭 헬퍼 함수
function matchPositionCategory(playerPos, category) {
    if (!category || category === 'ALL') return true;
    const pos = (playerPos || '').toUpperCase().trim();
    if (category === 'FW') return ['ST', 'LW', 'RW', 'CF'].includes(pos);
    if (category === 'MF') return ['CM', 'CAM', 'LM', 'RM', 'CDM', 'DM'].includes(pos);
    if (category === 'DF') return ['CB', 'LB', 'RB', 'LWB', 'RWB'].includes(pos);
    if (category === 'GK') return pos === 'GK';
    return false;
}

// 덱 포지션 필터 변경
function filterDeckByPosition(category) {
    currentDeckPositionFilter = category;
    
    // UI 버튼 active 클래스 갱신
    const categories = ['ALL', 'FW', 'MF', 'DF', 'GK'];
    categories.forEach(cat => {
        const btn = document.getElementById(`filterDeck_${cat}`);
        if (btn) {
            if (cat === category) btn.classList.add('active');
            else btn.classList.remove('active');
        }
    });
    
    if (typeof playClickSound === 'function') {
        try { playClickSound(); } catch (e) {}
    }
    
    renderDeck();
}

// 보관함 포지션 필터 변경
function filterStorageByPosition(category) {
    currentStoragePositionFilter = category;
    
    // UI 버튼 active 클래스 갱신
    const categories = ['ALL', 'FW', 'MF', 'DF', 'GK'];
    categories.forEach(cat => {
        const btn = document.getElementById(`filterStorage_${cat}`);
        if (btn) {
            if (cat === category) btn.classList.add('active');
            else btn.classList.remove('active');
        }
    });
    
    if (typeof playClickSound === 'function') {
        try { playClickSound(); } catch (e) {}
    }
    
    renderStorageDeck();
}

// 카드 DOM 요소 생성 헬퍼 함수
function createCardDOM(key, awakened) {
    const cardEl = document.createElement('div');
    const isSuper = awakened && awakened.rarity === 'super';
    cardEl.className = `fut-card flipped ${isSuper ? 'is-super' : ''}`;
    
    // Card Front
    const cardFront = document.createElement('div');
    cardFront.className = `card-front ${isSuper ? 'super-card' : ''}`;
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
        if (typeof playSound === 'function') playSound('flip');
    });
    
    // Double-tap to flip on Mobile
    let lastTap = 0;
    cardEl.addEventListener('touchstart', (e) => {
        const currentTime = new Date().getTime();
        const tapLength = currentTime - lastTap;
        if (tapLength < 300 && tapLength > 0) {
            e.preventDefault();
            e.stopPropagation();
            cardEl.classList.toggle('flipped');
            if (typeof playSound === 'function') playSound('flip');
        }
        lastTap = currentTime;
    }, { passive: false });
    
    return cardEl;
}

// 5. RENDER COLLECTION DECK (보관된 카드 제외 및 포지션 필터링 반영)
function renderDeck() {
    const grid = document.getElementById('deckGrid');
    const placeholder = document.getElementById('emptyDeckPlaceholder');
    if (!grid) return;
    
    const existingCards = grid.querySelectorAll('.deck-card-wrapper');
    existingCards.forEach(el => el.remove());
    
    // 1. 보관되지 않은 활성 카드 추출
    const activeKeys = Object.keys(playerDeck).filter(k => !playerDeck[k].isStored);
    
    // 2. 포지션 필터 적용
    const filteredKeys = activeKeys.filter(k => {
        const card = getAwakenedCard(k);
        return card ? matchPositionCategory(card.position, currentDeckPositionFilter) : true;
    });
    
    // 3. 능력치(Rating)가 높은 순서대로 정렬 (각성 스탯 보너스 반영)
    filteredKeys.sort((a, b) => {
        const cardA = getAwakenedCard(a);
        const cardB = getAwakenedCard(b);
        const ratingA = cardA ? cardA.rating : 0;
        const ratingB = cardB ? cardB.rating : 0;
        return ratingB - ratingA;
    });
    
    if (filteredKeys.length === 0) {
        if (placeholder) {
            placeholder.style.display = 'flex';
            if (activeKeys.length > 0) {
                placeholder.innerHTML = `
                    <i class="fa-regular fa-folder-open"></i>
                    <h3>선택한 포지션(${currentDeckPositionFilter})의 카드가 없습니다</h3>
                    <p>'전체' 버튼을 누르거나 다른 포지션 필터를 선택해보세요.</p>
                `;
            } else {
                placeholder.innerHTML = `
                    <i class="fa-regular fa-folder-open"></i>
                    <h3>아직 수집한 카드가 없습니다</h3>
                    <p>'카드 뽑기' 탭으로 이동하여 축구 스타 카드를 수집해보세요!</p>
                `;
            }
        }
    } else {
        if (placeholder) placeholder.style.display = 'none';
        
        filteredKeys.forEach(key => {
            const wrapper = document.createElement('div');
            wrapper.className = 'deck-card-wrapper';
            
            const awakened = getAwakenedCard(key);
            const cardEl = createCardDOM(key, awakened);
            wrapper.appendChild(cardEl);
            
            // 카드 우측 하단 [📦 보관함으로 이동] 플로팅 버튼 생성
            const storageBtn = document.createElement('button');
            storageBtn.className = 'btn-card-storage-float';
            storageBtn.title = '보관함으로 이동';
            storageBtn.innerHTML = '<i class="fa-solid fa-box-archive"></i>';
            storageBtn.onclick = (e) => {
                e.stopPropagation();
                moveToStorage(key);
            };
            wrapper.appendChild(storageBtn);
            
            // ★5 각성 완료된 카드에 ★6 강화(10 FP) 버튼 노출
            const deckCardObj = playerDeck[key];
            if (deckCardObj && deckCardObj.awakening === 5) {
                const upgradeBtn = document.createElement('button');
                upgradeBtn.className = 'btn-quick-upgrade-six';
                upgradeBtn.style.marginTop = '0.8rem';
                upgradeBtn.style.width = '100%';
                upgradeBtn.style.padding = '0.55rem 0.8rem';
                upgradeBtn.style.background = 'linear-gradient(135deg, #ffd700, #ff3e6c)';
                upgradeBtn.style.border = 'none';
                upgradeBtn.style.borderRadius = '10px';
                upgradeBtn.style.color = '#080a10';
                upgradeBtn.style.fontWeight = '800';
                upgradeBtn.style.fontSize = '0.82rem';
                upgradeBtn.style.cursor = 'pointer';
                upgradeBtn.style.display = 'flex';
                upgradeBtn.style.alignItems = 'center';
                upgradeBtn.style.justifyContent = 'center';
                upgradeBtn.style.gap = '6px';
                upgradeBtn.style.boxShadow = '0 4px 12px rgba(255, 62, 108, 0.3)';
                upgradeBtn.style.transition = 'all 0.2s';
                upgradeBtn.innerHTML = `<i class="fa-solid fa-bolt" style="color: #080a10;"></i> ★6 강화 (10 FP)`;
                
                upgradeBtn.onclick = (e) => {
                    e.stopPropagation();
                    upgradeCardToSix(key);
                };
                upgradeBtn.onmouseover = () => { upgradeBtn.style.transform = 'scale(1.03)'; };
                upgradeBtn.onmouseout = () => { upgradeBtn.style.transform = 'none'; };
                
                wrapper.appendChild(upgradeBtn);
            }
            
            grid.appendChild(wrapper);
        });
    }
    updateTotalCardCount();
}

// 5.1 RENDER STORAGE DECK (보관된 카드들만 전용 그리드에 렌더링 + 포지션 필터링 적용)
function renderStorageDeck() {
    const grid = document.getElementById('storageGrid');
    const placeholder = document.getElementById('emptyStoragePlaceholder');
    if (!grid) return;
    
    const existingCards = grid.querySelectorAll('.deck-card-wrapper');
    existingCards.forEach(el => el.remove());
    
    // 1. 보관된 카드들 추출
    const storedKeys = Object.keys(playerDeck).filter(k => playerDeck[k].isStored === true);
    
    // 2. 포지션 필터 적용
    const filteredKeys = storedKeys.filter(k => {
        const card = getAwakenedCard(k);
        return card ? matchPositionCategory(card.position, currentStoragePositionFilter) : true;
    });
    
    // 3. 능력치(Rating)가 높은 순서대로 정렬
    filteredKeys.sort((a, b) => {
        const cardA = getAwakenedCard(a);
        const cardB = getAwakenedCard(b);
        const ratingA = cardA ? cardA.rating : 0;
        const ratingB = cardB ? cardB.rating : 0;
        return ratingB - ratingA;
    });
    
    if (filteredKeys.length === 0) {
        if (placeholder) {
            placeholder.style.display = 'flex';
            if (storedKeys.length > 0) {
                placeholder.innerHTML = `
                    <i class="fa-solid fa-box-open" style="font-size: 3rem; color: #64748b; margin-bottom: 0.8rem;"></i>
                    <h3>선택한 포지션(${currentStoragePositionFilter})의 보관 카드가 없습니다</h3>
                    <p>'전체' 버튼을 누르거나 다른 포지션 필터를 선택해보세요.</p>
                `;
            } else {
                placeholder.innerHTML = `
                    <i class="fa-solid fa-box-open" style="font-size: 3rem; color: #64748b; margin-bottom: 0.8rem;"></i>
                    <h3>보관함이 비어 있습니다</h3>
                    <p>내 컬렉션 카드 우측 하단의 📦 버튼을 눌러 보관할 수 있습니다.</p>
                `;
            }
        }
    } else {
        if (placeholder) placeholder.style.display = 'none';
        
        filteredKeys.forEach(key => {
            const wrapper = document.createElement('div');
            wrapper.className = 'deck-card-wrapper';
            
            const awakened = getAwakenedCard(key);
            const cardEl = createCardDOM(key, awakened);
            wrapper.appendChild(cardEl);
            
            // 카드 우측 하단 [📤 내 컬렉션으로 복원] 플로팅 버튼 생성
            const restoreBtn = document.createElement('button');
            restoreBtn.className = 'btn-card-storage-float restore';
            restoreBtn.title = '내 컬렉션으로 복원';
            restoreBtn.innerHTML = '<i class="fa-solid fa-arrow-up-from-bracket"></i>';
            restoreBtn.onclick = (e) => {
                e.stopPropagation();
                restoreFromStorage(key);
            };
            wrapper.appendChild(restoreBtn);
            
            grid.appendChild(wrapper);
        });
    }
    updateTotalCardCount();
}

// 5.2 보관함 화면 전환 함수
function openStoragePage() {
    const deckContainer = document.getElementById('deckContainer');
    const storageContainer = document.getElementById('storageContainer');
    if (deckContainer) deckContainer.style.display = 'none';
    if (storageContainer) {
        storageContainer.style.display = 'block';
        renderStorageDeck();
    }
}

function closeStoragePage() {
    const deckContainer = document.getElementById('deckContainer');
    const storageContainer = document.getElementById('storageContainer');
    if (storageContainer) storageContainer.style.display = 'none';
    if (deckContainer) {
        deckContainer.style.display = 'block';
        renderDeck();
    }
}

// 5.3 카드를 보관함으로 이동 (포메이션 등록 시 해제 확인)
function moveToStorage(cardId) {
    const cardObj = playerDeck[cardId];
    if (!cardObj) return;
    
    const cardName = cardObj.card ? cardObj.card.name : '선수';
    
    // 현재 포메이션에 배치되어 있는지 검사
    let isPlacedInSquad = false;
    ['4-4-2', '4-3-3', '3-4-3', '5-4-1', '4-2-3-1'].forEach(f => {
        if (typeof squadFormations !== 'undefined' && squadFormations[f]) {
            Object.keys(squadFormations[f]).forEach(pos => {
                if (squadFormations[f][pos] === cardId) {
                    isPlacedInSquad = true;
                }
            });
        }
    });
    
    if (isPlacedInSquad) {
        const confirmStorage = confirm(`'${cardName}' 선수는 현재 선발 포메이션에 등록되어 있습니다.\n포메이션에서 제외하고 보관함으로 이동하시겠습니까?`);
        if (!confirmStorage) return;
        
        // 모든 포메이션 슬롯에서 해당 카드 안전하게 제외
        ['4-4-2', '4-3-3', '3-4-3', '5-4-1', '4-2-3-1'].forEach(f => {
            if (typeof squadFormations !== 'undefined' && squadFormations[f]) {
                Object.keys(squadFormations[f]).forEach(pos => {
                    if (squadFormations[f][pos] === cardId) {
                        squadFormations[f][pos] = null;
                    }
                });
            }
        });
        if (typeof squadFormations !== 'undefined' && typeof currentFormation !== 'undefined') {
            squadFormation = squadFormations[currentFormation];
        }
    }
    
    cardObj.isStored = true;
    
    try {
        localStorage.setItem('fc_star_player_deck', JSON.stringify(playerDeck));
        if (typeof squadFormations !== 'undefined') {
            localStorage.setItem('fc_star_squad_formations', JSON.stringify(squadFormations));
        }
    } catch(e) {}
    
    if (typeof saveUserProgress === 'function') saveUserProgress();
    
    renderDeck();
    renderStorageDeck();
    if (typeof renderSquadFormation === 'function') renderSquadFormation();
    if (typeof syncJeonbukOvr === 'function') syncJeonbukOvr();
    if (typeof updateMatchPreviewBoard === 'function') updateMatchPreviewBoard();
    
    if (typeof showToast === 'function') {
        showToast(`📦 '${cardName}' 선수를 보관함으로 이동했습니다.`);
    }
}

// 5.4 보관함에서 내 컬렉션으로 복원
function restoreFromStorage(cardId) {
    const cardObj = playerDeck[cardId];
    if (!cardObj) return;
    
    const cardName = cardObj.card ? cardObj.card.name : '선수';
    cardObj.isStored = false;
    
    try {
        localStorage.setItem('fc_star_player_deck', JSON.stringify(playerDeck));
    } catch(e) {}
    
    if (typeof saveUserProgress === 'function') saveUserProgress();
    
    renderDeck();
    renderStorageDeck();
    if (typeof renderSquadFormation === 'function') renderSquadFormation();
    
    if (typeof showToast === 'function') {
        showToast(`📤 '${cardName}' 선수를 내 컬렉션으로 복원했습니다.`);
    }
}

// 5.5 카드 수치 및 포지션 필터 뱃지 카운트 갱신
function updateTotalCardCount() {
    let activeTotal = 0;
    let storedTotal = 0;
    
    const deckCategoryCounts = { ALL: 0, FW: 0, MF: 0, DF: 0, GK: 0 };
    const storageCategoryCounts = { ALL: 0, FW: 0, MF: 0, DF: 0, GK: 0 };
    
    Object.keys(playerDeck).forEach(key => {
        const cardObj = playerDeck[key];
        const card = getAwakenedCard(key);
        const pos = card ? card.position : '';
        const qty = cardObj.quantity || 1;
        
        if (cardObj.isStored === true) {
            storedTotal += qty;
            storageCategoryCounts.ALL += qty;
            if (matchPositionCategory(pos, 'FW')) storageCategoryCounts.FW += qty;
            if (matchPositionCategory(pos, 'MF')) storageCategoryCounts.MF += qty;
            if (matchPositionCategory(pos, 'DF')) storageCategoryCounts.DF += qty;
            if (matchPositionCategory(pos, 'GK')) storageCategoryCounts.GK += qty;
        } else {
            activeTotal += qty;
            deckCategoryCounts.ALL += qty;
            if (matchPositionCategory(pos, 'FW')) deckCategoryCounts.FW += qty;
            if (matchPositionCategory(pos, 'MF')) deckCategoryCounts.MF += qty;
            if (matchPositionCategory(pos, 'DF')) deckCategoryCounts.DF += qty;
            if (matchPositionCategory(pos, 'GK')) deckCategoryCounts.GK += qty;
        }
    });
    
    const totalEl = document.getElementById('totalCardsCount');
    if (totalEl) totalEl.innerText = activeTotal;
    
    const badgeEl = document.getElementById('storedCardsCountBadge');
    if (badgeEl) badgeEl.innerText = storedTotal;
    
    const storageCountEl = document.getElementById('storageCardsCount');
    if (storageCountEl) storageCountEl.innerText = storedTotal;
    
    // 내 컬렉션 필터 뱃지 업데이트
    ['ALL', 'FW', 'MF', 'DF', 'GK'].forEach(cat => {
        const deckCountBadge = document.getElementById(`filterCount_${cat}`);
        if (deckCountBadge) deckCountBadge.innerText = deckCategoryCounts[cat] || 0;
        
        const storageCountBadge = document.getElementById(`filterStorageCount_${cat}`);
        if (storageCountBadge) storageCountBadge.innerText = storageCategoryCounts[cat] || 0;
    });
}

// 5.6 ★6 퀵 업그레이드 특전 구현
function upgradeCardToSix(cardId) {
    if (typeof userPoints === 'undefined' || userPoints < 10) {
        alert("보유 포인트(FP)가 부족합니다. (10 FP 필요)");
        return;
    }
    
    const cardObj = playerDeck[cardId];
    if (!cardObj) return;
    
    const confirmUpgrade = confirm(`정말로 10 FP를 사용하여 '${cardObj.card.name}' 선수를 ★6 각성으로 강화하시겠습니까?`);
    if (!confirmUpgrade) return;
    
    userPoints -= 10;
    cardObj.awakening = 6;
    
    try {
        localStorage.setItem('fc_star_user_points', userPoints.toString());
        localStorage.setItem('fc_star_player_deck', JSON.stringify(playerDeck));
    } catch(e) {}
    
    if (typeof saveUserProgress === 'function') {
        saveUserProgress();
    }
    
    renderUserPoints();
    renderDeck();
    renderStorageDeck();
    renderSquadFormation();
    if (typeof syncJeonbukOvr === 'function') syncJeonbukOvr();
    if (typeof updateMatchPreviewBoard === 'function') updateMatchPreviewBoard();
    
    // 파티클 성공 효과
    if (typeof celebrateQuizSuccess === 'function') {
        celebrateQuizSuccess();
    }
    
    alert(`🎉 '${cardObj.card.name}' 선수가 ★6 각성(최종 강화)으로 고정 강화되었습니다! 🎉`);
}

