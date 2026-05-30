// js/card.js - 카드 렌더링 모듈

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
