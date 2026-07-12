// js/card.js - 카드 렌더링 모듈

// 각성 수치가 반영된 동적 선수 데이터 반환 함수
function getAwakenedCard(cardId, deck = playerDeck) {
    const baseCard = CARDS_DATABASE[cardId];
    if (!baseCard) return null;
    
    const deckItem = deck[cardId];
    const awk = (deckItem && typeof deckItem.awakening === 'number') ? deckItem.awakening : 0;
    
    // tomy0304 계정은 무조건 컨디션 0 고정
    const isTomy = (typeof isTomy0304 === 'function' && isTomy0304());
    const cond = (isTomy) ? 0 : ((deckItem && typeof deckItem.condition === 'number') ? deckItem.condition : 0);
    
    if (awk === 0 && cond === 0) {
        baseCard.awakening = 0;
        baseCard.condition = 0;
        return baseCard;
    }
    
    // 능력치 훼손 방지를 위한 깊은 복사
    const awakenedCard = JSON.parse(JSON.stringify(baseCard));
    const totalBoost = awk + cond;
    
    awakenedCard.rating += totalBoost;
    if (awakenedCard.stats) {
        Object.keys(awakenedCard.stats).forEach(k => {
            awakenedCard.stats[k] += totalBoost;
        });
    }
    awakenedCard.awakening = awk;
    awakenedCard.condition = cond;
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
    let badgeBg = 'rgba(255, 255, 255, 0.15)';
    let badgeColor = '#fff';
    let badgeText = '일반';
    let badgeShadow = 'none';
    let badgeBorder = '1px solid rgba(255, 255, 255, 0.2)';
    let imageGradeClass = 'grade-gold';

    if (rarity === 'legend') {
        badgeBg = 'linear-gradient(135deg, #ff0055 0%, #ffaa00 50%, #ffd700 100%)';
        badgeColor = '#000';
        badgeText = '👑 전설';
        badgeShadow = '0 0 10px rgba(255, 215, 0, 0.7), 0 2px 4px rgba(0,0,0,0.5)';
        badgeBorder = '1px solid rgba(255, 255, 255, 0.4)';
        imageGradeClass = 'grade-legend';
    } else if (rarity === 'special') {
        badgeBg = 'linear-gradient(135deg, #da1a32 0%, #1d2b58 100%)'; // 대한민국 국가대표 Red & Navy 테마
        badgeColor = '#fff';
        badgeText = '✨ 스페셜';
        badgeShadow = '0 0 12px rgba(218, 26, 50, 0.8), 0 2px 4px rgba(0,0,0,0.5)';
        badgeBorder = '1px solid rgba(255, 255, 255, 0.5)';
        imageGradeClass = 'grade-elite';
    } else if (rarity === 'worldclass') {
        badgeBg = 'linear-gradient(135deg, #00f2fe 0%, #4facfe 50%, #0000ff 100%)'; // 월드클래스 테마
        badgeColor = '#fff';
        badgeText = '🌍 월드클래스';
        badgeShadow = '0 0 12px rgba(0, 242, 254, 0.8), 0 2px 4px rgba(0,0,0,0.5)';
        badgeBorder = '1px solid rgba(0, 242, 254, 0.5)';
        imageGradeClass = 'grade-worldclass';
    }

    const rarityBadgeHTML = `
        <div class="card-rarity-badge" style="
            position: absolute;
            top: 0.6rem;
            left: 1.2rem;
            background: ${badgeBg};
            color: ${badgeColor};
            font-size: 0.65rem;
            font-weight: 900;
            padding: 3px 8px;
            border-radius: 20px;
            box-shadow: ${badgeShadow};
            z-index: 10;
            letter-spacing: 0.5px;
            border: ${badgeBorder};
            backdrop-filter: blur(5px);
        ">
            ${badgeText}
        </div>
    `;

    let condBadgeHTML = '';
    const isTomy = (typeof isTomy0304 === 'function' && isTomy0304());
    if (!isTomy && typeof cardData.condition === 'number') {
        const cond = cardData.condition;
        let arrow = '➡️';
        let color = '#ffd700';
        let bg = 'rgba(255, 255, 255, 0.05)';
        let border = 'rgba(255, 255, 255, 0.15)';
        let title = '보통';
        if (cond === 2) {
            arrow = '↗️';
            color = '#00ff87';
            bg = 'rgba(0, 255, 135, 0.15)';
            border = 'rgba(0, 255, 135, 0.4)';
            title = '최상 (OVR +2)';
        } else if (cond === -2) {
            arrow = '↘️';
            color = '#ff3e6c';
            bg = 'rgba(255, 62, 108, 0.15)';
            border = 'rgba(255, 62, 108, 0.4)';
            title = '저조 (OVR -2)';
        }
        
        condBadgeHTML = `
            <div class="card-condition-badge" style="
                position: absolute;
                top: 2.3rem;
                left: 1.2rem;
                background: ${bg};
                color: ${color};
                font-size: 0.65rem;
                font-weight: 900;
                padding: 2px 6px;
                border-radius: 6px;
                z-index: 10;
                border: 1px solid ${border};
                backdrop-filter: blur(5px);
            " title="컨디션: ${title}">
                ${arrow}
            </div>
        `;
    }

    return `
        <div class="card-shine"></div>
        ${awkBadgeHTML}
        ${rarityBadgeHTML}
        ${condBadgeHTML}
        <div class="card-header-stats">
            <div class="card-rating">${cardData.rating}</div>
            <div class="card-position">${cardData.position}</div>
            <div class="card-nation" style="background-image: url('${cardData.nationFlag}');"></div>
        </div>
        
        <!-- Decorated Image Frame (Real Player Portrait with neon background, frame border, and hologram badge) -->
        <div class="card-image-container ${imageGradeClass}">
            <div class="card-portrait-background" style="background: radial-gradient(circle at 50% 40%, ${cardData.theme.primary}aa 0%, #080a10 85%);">
                <!-- Tech grid line overlay inside portrait -->
                <div class="portrait-grid"></div>
            </div>
            
            <img src="${cardData.image}" alt="${cardData.name}" class="card-player-img" onerror="this.src='https://placehold.co/320x320/005a3c/ffd700?text=${encodeURIComponent(cardData.name)}'">
            <div class="card-badge-glow" style="background: radial-gradient(circle, ${cardData.theme.glow}33 0%, transparent 70%);"></div>
            <div class="card-club" style="color: ${cardData.theme.glow}; font-weight: 800; font-size: 0.75rem; letter-spacing: 1px;">${cardData.club}</div>
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
