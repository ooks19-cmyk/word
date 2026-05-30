// js/deck.js - 선수 컬렉션 모듈

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
