// ==========================================
// 🤝 FRIENDLY MATCH (친선 경기) ENGINE & SYSTEM
// ==========================================
let friendlyMatchesToday = 0;
let friendlyMatchLastDate = "";
let selectedFriendlyOpponent = null;
let preloadedFriendlyUsers = [];

// Initialize Friendly Match State from LocalStorage
function initFriendlyMatchState() {
    const myId = typeof currentUser === 'string' && currentUser ? currentUser : "ooks";
    const keyLastDate = `fc_star_friendly_match_last_date_${myId}`;
    const keyMatchesToday = `fc_star_friendly_matches_today_${myId}`;
    
    const todayStr = new Date().toLocaleDateString('ko-KR');
    const savedDate = localStorage.getItem(keyLastDate);
    const savedCount = localStorage.getItem(keyMatchesToday);
    
    if (savedDate === todayStr) {
        friendlyMatchesToday = savedCount ? parseInt(savedCount) : 0;
        friendlyMatchLastDate = savedDate;
    } else {
        friendlyMatchesToday = 0;
        friendlyMatchLastDate = todayStr;
        localStorage.setItem(keyLastDate, todayStr);
        localStorage.setItem(keyMatchesToday, '0');
        
        // 날짜 리셋 시 인덱스도 초기화
        const keyIndex = `fc_star_friendly_current_index_${myId}`;
        localStorage.setItem(keyIndex, '0');
        friendlyCurrentOpponentIndex = 0;
        
        // 새로운 날짜이므로 클라우드 상태도 함께 초기화 백업
        if (typeof saveUserProgress === 'function') {
            saveUserProgress();
        }
    }
}

// Calculate Opponent's Pure OVR based on their squadFormation and playerDeck
function getOpponentPureOvr(opponentData) {
    let totalOvr = 0;
    const TACTICAL_POSITIONS = ["ST", "LW", "RW", "CM", "LCM", "RCM", "LB", "LCB", "RCB", "RB", "GK"];
    
    const formation = opponentData.squadFormation || {};
    const deck = opponentData.playerDeck || {};
    
    TACTICAL_POSITIONS.forEach(pos => {
        const cardId = formation[pos];
        if (cardId && CARDS_DATABASE[cardId]) {
            let rating = CARDS_DATABASE[cardId].rating;
            if (deck[cardId]) {
                const isAwakened = deck[cardId].awake || deck[cardId].awakeLevel > 0;
                if (isAwakened) {
                    const level = deck[cardId].awakeLevel || 1;
                    rating += level;
                }
            }
            totalOvr += rating;
        } else {
            totalOvr += 70; // default silver fallback
        }
    });
    return Math.round(totalOvr / 11);
}

// Get Opponent's Awakened Card (similar to getAwakenedCard but uses opponent's deck)
function getOpponentAwakenedCard(cardId, opponentDeck) {
    if (!CARDS_DATABASE[cardId]) return null;
    const baseCard = CARDS_DATABASE[cardId];
    const userCard = opponentDeck ? opponentDeck[cardId] : null;
    
    if (!userCard) return JSON.parse(JSON.stringify(baseCard));
    
    const cardCopy = JSON.parse(JSON.stringify(baseCard));
    const isAwakened = userCard.awake || userCard.awakeLevel > 0;
    if (isAwakened) {
        const level = userCard.awakeLevel || 1;
        cardCopy.rating += level;
        if (cardCopy.stats) {
            Object.keys(cardCopy.stats).forEach(statKey => {
                cardCopy.stats[statKey] += level;
            });
        }
    }
    return cardCopy;
}

// Get Opponent's Team Average Stat (similar to getTeamAverageStat but uses opponent's squad and deck)
function getOpponentTeamAverageStat(opponentData, statKey) {
    let total = 0;
    let count = 0;
    const TACTICAL_POSITIONS = ["ST", "LW", "RW", "CM", "LCM", "RCM", "LB", "LCB", "RCB", "RB", "GK"];
    const formation = opponentData.squadFormation || {};
    const deck = opponentData.playerDeck || {};
    
    TACTICAL_POSITIONS.forEach(pos => {
        const cardId = formation[pos];
        if (cardId) {
            const awakened = getOpponentAwakenedCard(cardId, deck);
            if (awakened && awakened.stats && typeof awakened.stats[statKey] === 'number') {
                total += awakened.stats[statKey];
                count++;
            }
        }
    });
    return count > 0 ? Math.round(total / count) : 0;
}

// Calculate Opponent's Total OVR including Formation Tactic OVR bonuses
function getOpponentTotalOvr(opponentData) {
    let avgOvr = getOpponentPureOvr(opponentData);
    
    const formation = opponentData.squadFormation || {};
    const deck = opponentData.playerDeck || {};
    const currentFormation = opponentData.currentFormation || '4-4-2';
    
    let hasKeyPlayer = false;
    let hasTeamTactic = false;
    
    if (currentFormation === '4-3-3') {
        const cmCardId = formation['CM'];
        const cmCard = getOpponentAwakenedCard(cmCardId, deck);
        hasKeyPlayer = cmCard && cmCard.stats && cmCard.stats.pas >= 80;
        const avgPas = getOpponentTeamAverageStat(opponentData, 'pas');
        hasTeamTactic = avgPas >= 70;
    } else if (currentFormation === '3-4-3') {
        const cmCardId = formation['CM'];
        const cmCard = getOpponentAwakenedCard(cmCardId, deck);
        hasKeyPlayer = cmCard && cmCard.stats && cmCard.stats.dri >= 80;
        const avgDri = getOpponentTeamAverageStat(opponentData, 'dri');
        hasTeamTactic = avgDri >= 70;
    } else if (currentFormation === '5-4-1') {
        const lwCardId = formation['LW'];
        const rwCardId = formation['RW'];
        
        const lwCard = getOpponentAwakenedCard(lwCardId, deck);
        const rwCard = getOpponentAwakenedCard(rwCardId, deck);
        
        if (lwCard && lwCard.stats && lwCard.stats.pac >= 80) hasKeyPlayer = true;
        if (rwCard && rwCard.stats && rwCard.stats.pac >= 80) hasKeyPlayer = true;
        
        const avgDef = getOpponentTeamAverageStat(opponentData, 'def');
        hasTeamTactic = avgDef >= 60;
    } else if (currentFormation === '4-2-3-1') {
        const cmCardId = formation['CM'];
        const cmCard = getOpponentAwakenedCard(cmCardId, deck);
        hasKeyPlayer = cmCard && cmCard.stats && cmCard.stats.dri >= 80;
        const avgDri = getOpponentTeamAverageStat(opponentData, 'dri');
        hasTeamTactic = avgDri >= 75;
    }
    
    let formationBonus = 0;
    if (currentFormation !== '4-4-2') {
        if (hasKeyPlayer) formationBonus += 1;
        if (hasTeamTactic) formationBonus += 1;
    }
    
    return avgOvr + formationBonus;
}

// Open Friendly Match modal and render other users list (excluding self and ooks12)
async function openFriendlyMatchModal() {
    initFriendlyMatchState();
    
    const modal = document.getElementById('friendlyMatchModal');
    if (!modal) return;
    
    modal.style.display = 'flex';
    
    // Update count display
    const countEl = document.getElementById('friendlyMatchesTodayCount');
    if (countEl) {
        countEl.innerText = `잔여 횟수: ${3 - friendlyMatchesToday}/3`;
        if (3 - friendlyMatchesToday <= 0) {
            countEl.style.color = '#ff3e6c';
        } else {
            countEl.style.color = '#a55eea';
        }
    }
    
    // Reset selection card
    const selectedCard = document.getElementById('friendlySelectedCard');
    if (selectedCard) selectedCard.style.display = 'none';
    
    const startBtn = document.getElementById('btnStartFriendlyChallenge');
    if (startBtn) {
        startBtn.style.opacity = '0.5';
        startBtn.style.pointerEvents = 'none';
    }
    
    selectedFriendlyOpponent = null;
    
    const listEl = document.getElementById('friendlyUserList');
    if (!listEl) return;
    
    listEl.innerHTML = `
        <div style="text-align: center; color: #64748b; padding: 2rem 0; font-size: 0.82rem;">
            <i class="fa-solid fa-spinner fa-spin" style="margin-right: 6px; color: #a55eea;"></i> 가입된 유저 목록을 불러오는 중...
        </div>
    `;
    
    // 24시간 로컬 캐시 유효성 체크
    const cachedUsers = localStorage.getItem('fc_star_friendly_users_cache');
    const cachedUsersTime = localStorage.getItem('fc_star_friendly_users_cache_time');
    const isUsersCacheValid = cachedUsers && cachedUsersTime && (Date.now() - parseInt(cachedUsersTime) < 24 * 60 * 60 * 1000);
    
    if (isUsersCacheValid) {
        try {
            const users = JSON.parse(cachedUsers);
            if (users && users.length > 0) {
                console.log("🟢 24시간 내 캐시된 친선경기 매칭 목록 사용 완료!");
                renderFriendlyUserList(users, listEl);
                return;
            }
        } catch (e) {
            console.warn("매칭용 로컬 캐시 파싱 에러:", e);
        }
    }
    
    try {
        // 5초 타임아웃 프로미스 레이스 설정
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error("Timeout")), 5000);
        });

        const users = await Promise.race([
            window.dbService.fetchRankings(),
            timeoutPromise
        ]);

        // 원격 데이터 로드 성공 시 로컬 캐시에 즉시 세이브
        try {
            localStorage.setItem('fc_star_friendly_users_cache', JSON.stringify(users));
            localStorage.setItem('fc_star_friendly_users_cache_time', Date.now().toString());
        } catch (e) {
            console.warn("친선 매치 데이터 캐싱 실패:", e);
        }

        renderFriendlyUserList(users, listEl);
        
    } catch (error) {
        console.warn("친선 경기 매칭 유저 로드 실패 또는 5초 초과 타임아웃, 로컬 오프라인 캐시 폴백 적용:", error);
        
        let cachedUsersFallback = null;
        try {
            const cacheData = localStorage.getItem('fc_star_friendly_users_cache');
            if (cacheData) {
                cachedUsersFallback = JSON.parse(cacheData);
            }
        } catch (e) {
            console.warn("친선 매치 로컬 캐시 로드 실패:", e);
        }

        if (cachedUsersFallback && cachedUsersFallback.length > 0) {
            renderFriendlyUserList(cachedUsersFallback, listEl);
            showToast("⚠️ 네트워크 지연으로 오프라인 캐시 데이터를 로드했습니다.");
        } else {
            listEl.innerHTML = `
                <div style="text-align: center; color: #ff3e6c; padding: 2rem 0; font-size: 0.82rem; line-height: 1.45;">
                    <i class="fa-solid fa-triangle-exclamation" style="margin-right: 6px;"></i> 네트워크 연결이 불안정하며, 저장된 오프라인 캐시 데이터가 없습니다.
                </div>
            `;
        }
    }
}

// 친선 경기 유저 로스터 렌더링 헬퍼 함수
function renderFriendlyUserList(users, listEl) {
    preloadedFriendlyUsers = users;
    
    // Filter out logged in user and 'ooks12'
    const currentUserId = typeof currentUser === 'string' && currentUser ? currentUser.toLowerCase() : "";
    const filteredUsers = users.filter(u => {
        const uid = u.id.toLowerCase();
        return uid !== 'ooks12' && uid !== currentUserId;
    });
    
    listEl.innerHTML = '';
    
    if (filteredUsers.length === 0) {
        listEl.innerHTML = `
            <div style="text-align: center; color: #64748b; padding: 2rem 0; font-size: 0.82rem;">
                도전 가능한 다른 유저가 존재하지 않습니다.
            </div>
        `;
        return;
    }
    
    filteredUsers.forEach(u => {
        const pureOvr = getOpponentPureOvr(u);
        const opponentOvr = getOpponentTotalOvr(u);
        const tacticBonus = opponentOvr - pureOvr;
        
        let bonusBadgeHtml = "";
        if (tacticBonus > 0) {
            bonusBadgeHtml = `<span style="font-size: 0.62rem; background: rgba(0, 255, 135, 0.12); padding: 1px 5px; border-radius: 4px; color: #00ff87; border: 1px solid rgba(0, 255, 135, 0.25); font-weight: 800; margin-left: 5px;">+${tacticBonus}⚡</span>`;
        }
        
        const userCard = document.createElement('div');
        userCard.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0.6rem 0.8rem;
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.06);
            border-radius: 12px;
            cursor: pointer;
            transition: all 0.2s;
        `;
        userCard.className = 'friendly-user-item';
        userCard.id = `friendly-user-${u.id}`;
        userCard.onclick = () => selectFriendlyOpponent(u.id);
        
        userCard.onmouseenter = () => {
            userCard.style.background = 'rgba(165, 94, 234, 0.08)';
            userCard.style.borderColor = 'rgba(165, 94, 234, 0.3)';
        };
        userCard.onmouseleave = () => {
            if (selectedFriendlyOpponent && selectedFriendlyOpponent.id === u.id) {
                userCard.style.background = 'rgba(165, 94, 234, 0.12)';
                userCard.style.borderColor = '#a55eea';
            } else {
                userCard.style.background = 'rgba(255, 255, 255, 0.03)';
                userCard.style.borderColor = 'rgba(255, 255, 255, 0.06)';
            }
        };
        
        userCard.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px;">
                <i class="fa-solid fa-user" style="color: #94a3b8; font-size: 0.85rem;"></i>
                <span style="font-size: 0.85rem; font-weight: 700; color: #f1f5f9;">${u.id}</span>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 0.72rem; background: rgba(255, 255, 255, 0.06); padding: 2px 6px; border-radius: 6px; color: #94a3b8; display: flex; align-items: center;">OVR ${opponentOvr}${bonusBadgeHtml}</span>
                <i class="fa-solid fa-chevron-right" style="color: #64748b; font-size: 0.75rem;"></i>
            </div>
        `;
        
        listEl.appendChild(userCard);
    });
}

// 친선 대결 상태 및 순위표 글로벌 변수
let friendlyOpponentsList = [];
let friendlyGlobalStandingsList = []; // 친선경기를 한 번이라도 플레이한 이력이 있는 전체 유저 목록
let friendlyCurrentOpponentIndex = 0;
let friendlyMatchesHistory = { w: 0, d: 0, l: 0, pts: 0 };

// 친선경기 전적 상태 로드
function loadFriendlyMatchesState() {
    initFriendlyMatchState();
    
    const myId = typeof currentUser === 'string' && currentUser ? currentUser : "ooks";
    const keyIndex = `fc_star_friendly_current_index_${myId}`;
    const keyHistory = `fc_star_friendly_history_${myId}`;
    
    const savedIndex = localStorage.getItem(keyIndex);
    friendlyCurrentOpponentIndex = savedIndex ? parseInt(savedIndex) : 0;
    
    const savedHistory = localStorage.getItem(keyHistory);
    if (savedHistory) {
        try {
            friendlyMatchesHistory = JSON.parse(savedHistory);
        } catch (e) {
            friendlyMatchesHistory = { w: 0, d: 0, l: 0, pts: 0 };
        }
    } else {
        friendlyMatchesHistory = { w: 0, d: 0, l: 0, pts: 0 };
    }
}

// 친선경기 전적 상태 저장
function saveFriendlyMatchesState() {
    const myId = typeof currentUser === 'string' && currentUser ? currentUser : "ooks";
    const keyIndex = `fc_star_friendly_current_index_${myId}`;
    const keyHistory = `fc_star_friendly_history_${myId}`;
    const keyMatchesToday = `fc_star_friendly_matches_today_${myId}`;

    localStorage.setItem(keyIndex, friendlyCurrentOpponentIndex.toString());
    localStorage.setItem(keyHistory, JSON.stringify(friendlyMatchesHistory));
    localStorage.setItem(keyMatchesToday, friendlyMatchesToday.toString());
}

// 친선경기 매칭 프리뷰 UI 업데이트
function updateFriendlyMatchPreview() {
    const todayStr = new Date().toLocaleDateString('ko-KR');
    
    const countValEl = document.getElementById('friendlyTodayCountVal');
    if (countValEl) {
        countValEl.innerText = friendlyMatchesToday;
    }

    // 주간 시즌 마감 D-Day 동적 갱신 (매주 금요일 자정 23:59:59 기준 마감)
    const myId = typeof currentUser === 'string' && currentUser ? currentUser : "ooks";
    const keyStartDate = `fc_star_friendly_season_start_date_${myId}`;
    let startDateStr = localStorage.getItem(keyStartDate);
    if (!startDateStr) {
        const now = new Date();
        const lastFriday = new Date();
        const day = lastFriday.getDay();
        const diff = (day >= 5) ? (day - 5) : (day + 2);
        lastFriday.setDate(lastFriday.getDate() - diff);
        lastFriday.setHours(0, 0, 0, 0);
        startDateStr = lastFriday.toISOString();
        localStorage.setItem(keyStartDate, startDateStr);
    }
    
    const startDate = new Date(startDateStr);
    const day = startDate.getDay();
    let diffToFriday = (5 - day + 7) % 7;
    if (diffToFriday === 0) diffToFriday = 7;
    
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + diffToFriday);
    endDate.setHours(23, 59, 59, 999);
    
    const now = new Date();
    const diffMs = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (24 * 60 * 60 * 1000));
    
    const dDayBadge = document.getElementById('friendlyDDayBadge');
    if (dDayBadge) {
        if (diffDays > 0) {
            dDayBadge.innerText = `마감 D-${diffDays}`;
            dDayBadge.style.background = 'rgba(165, 94, 234, 0.15)';
            dDayBadge.style.borderColor = 'rgba(165, 94, 234, 0.3)';
            dDayBadge.style.color = '#a55eea';
        } else {
            dDayBadge.innerText = `마감 임박`;
            dDayBadge.style.background = 'rgba(239, 68, 68, 0.15)';
            dDayBadge.style.borderColor = 'rgba(239, 68, 68, 0.3)';
            dDayBadge.style.color = '#ef4444';
        }
    }

    // 상태 배지 업데이트 (Mock 데이터 여부 실시간 구별)
    const statusBadge = document.getElementById('friendlyDataStatusBadge');
    if (statusBadge && friendlyOpponentsList.length > 0) {
        const hasMock = friendlyOpponentsList.some(opp => opp.isMock);
        if (hasMock) {
            statusBadge.style.background = 'rgba(255, 62, 108, 0.12)';
            statusBadge.style.borderColor = 'rgba(255, 62, 108, 0.25)';
            statusBadge.style.color = '#ff3e6c';
            statusBadge.innerHTML = `<i class="fa-solid fa-robot"></i> 가상 AI 봇 (MOCK)`;
        } else {
            statusBadge.style.background = 'rgba(0, 255, 135, 0.12)';
            statusBadge.style.borderColor = 'rgba(0, 255, 135, 0.25)';
            statusBadge.style.color = '#00ff87';
            statusBadge.innerHTML = `<i class="fa-solid fa-circle-dot" style="font-size: 0.5rem; animation: pulse 1.5s infinite;"></i> 실시간 원격 DB`;
        }
    }

    if (friendlyCurrentOpponentIndex >= 3 || friendlyOpponentsList.length === 0) {
        // 모든 릴레이 매칭 완료
        const friendlyTodayCountValEl = document.getElementById('friendlyTodayCountVal');
        if (friendlyTodayCountValEl) friendlyTodayCountValEl.innerText = "3";
        
        const friendlyTimeDisp = document.getElementById('friendlySbTimeDisplay');
        if (friendlyTimeDisp) friendlyTimeDisp.innerText = "완료";
        
        const fHomeScore = document.getElementById('friendlyHomeScore');
        const fAwayScore = document.getElementById('friendlyAwayScore');
        if (fHomeScore) fHomeScore.innerText = "-";
        if (fAwayScore) fAwayScore.innerText = "-";
        
        const fHomeName = document.getElementById('friendlyHomeTeamName');
        if (fHomeName) fHomeName.innerText = "오늘의";
        
        const fAwayName = document.getElementById('friendlyAwayTeamName');
        if (fAwayName) fAwayName.innerText = "대결 종료";
        
        const fVenueDisp = document.getElementById('friendlyMatchVenueDisplay');
        if (fVenueDisp) fVenueDisp.innerText = "오늘의 친선경기를 모두 마쳤습니다. 매일 3개 팀과 릴레이 매칭이 리셋됩니다!";
        
        // 친선경기 개시 버튼 비활성화
        const startBtn = document.getElementById('btnStartFriendlyMatch');
        if (startBtn) {
            startBtn.disabled = true;
            startBtn.innerText = "대결 완료 🏆";
            startBtn.style.background = 'rgba(255, 255, 255, 0.05)';
            startBtn.style.color = 'var(--text-muted)';
            startBtn.style.cursor = 'not-allowed';
        }

        // 친선 중계창 완료 안내 (기존 중계 기록 덮어쓰기 방지)
        const commBox = document.getElementById('friendlyCommentaryScroll');
        if (commBox) {
            const isInitialState = commBox.innerHTML.includes("친선 경기를 시작하려면 아래");
            if (commBox.innerHTML === '' || isInitialState) {
                commBox.innerHTML = '<div class="comm-item comm-system">🏆 오늘의 친선 릴레이 매칭을 모두 완료했습니다! 새로운 상대 팀은 내일 다시 갱신됩니다.</div>';
            }
        }
        return;
    }

    const opponent = friendlyOpponentsList[friendlyCurrentOpponentIndex];
    const jeonbukOvr = getPlayerPureOvr();

    // 친선 스코어보드 바인딩
    const friendlyTimeDisp = document.getElementById('friendlySbTimeDisplay');
    if (friendlyTimeDisp) friendlyTimeDisp.innerText = "VS";
    
    const fHomeScore = document.getElementById('friendlyHomeScore');
    const fAwayScore = document.getElementById('friendlyAwayScore');
    if (fHomeScore) fHomeScore.innerText = "0";
    if (fAwayScore) fAwayScore.innerText = "0";

    // 나 자신 (홈)
    const fHomeName = document.getElementById('friendlyHomeTeamName');
    if (fHomeName) fHomeName.innerText = "나의 구단 (전북)";
    
    const fHomeOvr = document.getElementById('friendlyHomeTeamOvr');
    if (fHomeOvr) fHomeOvr.innerText = jeonbukOvr;
    
    const fHomeEmblem = document.getElementById('friendlyHomeEmblem');
    if (fHomeEmblem) fHomeEmblem.innerHTML = `<img src="img/mark_jb.svg" alt="전북 현대" class="match-emblem-img" style="height: 48px; width: 48px; filter: drop-shadow(0 0 10px rgba(0, 255, 135, 0.6));">`;

    // 상대팀 (원정) - Mock 데이터인 경우 이름에 로봇 아이콘 표시
    const fAwayName = document.getElementById('friendlyAwayTeamName');
    if (fAwayName) {
        fAwayName.innerHTML = opponent.isMock 
            ? `<span style="display: flex; align-items: center; justify-content: center; gap: 6px;"><i class="fa-solid fa-robot" style="color: #ff3e6c;"></i> ${opponent.name}</span>`
            : opponent.name;
    }
    
    const fAwayOvr = document.getElementById('friendlyAwayTeamOvr');
    if (fAwayOvr) fAwayOvr.innerText = opponent.rating;
    
    const fAwayEmblem = document.getElementById('friendlyAwayEmblem');
    if (fAwayEmblem) fAwayEmblem.innerHTML = `<div style="width: 48px; height: 48px; background: rgba(165, 94, 234, 0.15); border: 1.5px solid rgba(165, 94, 234, 0.4); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; color: #a55eea; box-shadow: 0 0 10px rgba(165, 94, 234, 0.3);"><i class="fa-solid fa-crown"></i></div>`;

    const fVenueDisp = document.getElementById('friendlyMatchVenueDisplay');
    if (fVenueDisp) fVenueDisp.innerText = `원정팀 전술: ${opponent.activeFormation} | OVR 보정 없음 (홈어드밴티지: 0)`;

    // 상대 정보 세부 디테일 판넬 업데이트
    const infoDetailEl = document.querySelector('#matchLayoutFriendly .friendly-panel div[style*="background: rgba(255,255,255,0.02)"]');
    if (infoDetailEl) {
        infoDetailEl.innerHTML = `
            <div style="display: flex; justify-content: space-between; font-size: 0.8rem;">
                <span style="color: var(--text-muted);">상대 포메이션:</span>
                <span style="font-weight: 700; color: #fff;">${opponent.activeFormation}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 0.8rem;">
                <span style="color: var(--text-muted);">핵심 선수:</span>
                <span style="font-weight: 700; color: #ffd700;"><i class="fa-solid fa-crown"></i> ${opponent.bestPlayerName}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 0.8rem;">
                <span style="color: var(--text-muted);">대결 순서:</span>
                <span style="font-weight: 700; color: #a55eea;">오늘의 대결 (${friendlyCurrentOpponentIndex + 1} / 3번째)</span>
            </div>
        `;
    }

    // 친선 경기 개시 버튼 상태 갱신
    const startBtn = document.getElementById('btnStartFriendlyMatch');
    if (startBtn) {
        startBtn.disabled = false;
        startBtn.innerHTML = `<i class="fa-solid fa-play" style="margin-right: 8px;"></i>친선 경기 개시 (상대: ${opponent.name})`;
        startBtn.style.background = '';
        startBtn.style.color = '';
        startBtn.style.cursor = 'pointer';
    }
}

// 친선경기 주간 순위표 렌더링
function renderFriendlyTable() {
    const tbody = document.querySelector('#matchLayoutFriendly .friendly-table tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    const myRowData = {
        name: `나의 구단 (전북)`,
        pts: friendlyMatchesHistory.pts || 0,
        record: `${friendlyMatchesHistory.w || 0}승 ${friendlyMatchesHistory.d || 0}무 ${friendlyMatchesHistory.l || 0}패`,
        rate: getFriendlyWinRate(friendlyMatchesHistory),
        isMe: true
    };

    const rows = [myRowData];
    
    // 순위표에는 전적이 한 번이라도 존재하는 전체 DB 유저 리스트만 렌더링!
    friendlyGlobalStandingsList.forEach(opp => {
        const oppWins = opp.friendlyMatchesHistory.w || 0;
        const oppDraws = opp.friendlyMatchesHistory.d || 0;
        const oppLosses = opp.friendlyMatchesHistory.l || 0;
        const oppPts = opp.friendlyMatchesHistory.pts || 0;
        const total = oppWins + oppDraws + oppLosses;
        const oppRate = total === 0 ? "0%" : Math.round((oppWins / total) * 100) + "%";

        rows.push({
            name: opp.name,
            pts: oppPts,
            record: `${oppWins}승 ${oppDraws}무 ${oppLosses}패`,
            rate: oppRate,
            isMe: false,
            isMock: opp.isMock
        });
    });

    // 승점 높은 순으로 정렬
    rows.sort((a, b) => b.pts - a.pts);

    rows.forEach((row, idx) => {
        const rank = idx + 1;
        const tr = document.createElement('tr');
        
        if (row.isMe) {
            tr.className = 'league-row-jeonbuk';
            tr.style.cssText = "background: linear-gradient(90deg, rgba(165, 94, 234, 0.12) 0%, rgba(165, 94, 234, 0.03) 100%) !important; border-color: rgba(165, 94, 234, 0.25) !important;";
        }

        const mockTag = row.isMock ? ` <span style="font-size: 0.65rem; color: #ff3e6c; background: rgba(255, 62, 108, 0.12); padding: 1px 5px; border-radius: 4px; font-weight: 800; border: 1px solid rgba(255, 62, 108, 0.25);"><i class="fa-solid fa-robot"></i> AI</span>` : '';

        tr.innerHTML = `
            <td class="league-row-rank" style="${row.isMe ? 'color: #a55eea !important;' : ''}">${rank}</td>
            <td class="league-team-col" style="${row.isMe ? 'color: #a55eea !important; font-weight: 800;' : ''}">
                <i class="${row.isMe ? 'fa-solid fa-shield-halved' : 'fa-regular fa-circle-user'}" style="${row.isMe ? 'color: #a55eea;' : 'color: var(--text-muted);'}"></i>
                <span>${row.name}${mockTag}</span>
            </td>
            <td class="league-row-pts">${row.pts}</td>
            <td>${row.record}</td>
            <td style="font-weight: 800; color: #00ff87;">${row.rate}</td>
        `;

        tbody.appendChild(tr);
    });
}

function getFriendlyWinRate(history) {
    const total = (history.w || 0) + (history.d || 0) + (history.l || 0);
    if (total === 0) return "0%";
    return Math.round(((history.w || 0) / total) * 100) + "%";
}

// 친선경기 탭 클릭 시 격발되는 정보 초기화 및 로드 함수
// 친선경기 순위표 가공 및 렌더링 헬퍼
function processAndRenderStandings(allUsers, myId) {
    friendlyGlobalStandingsList = allUsers.filter(u => {
        const userId = (u.id || "").trim().toLowerCase();
        if (userId === myId.trim().toLowerCase()) return false;
        if (userId === "ooks12") return false; // 개발자 계정 제외
        
        // 전적이 한 번이라도 있는 유저만 필터링!
        return u.friendlyMatchesHistory && 
               (u.friendlyMatchesHistory.w > 0 || 
                u.friendlyMatchesHistory.d > 0 || 
                u.friendlyMatchesHistory.l > 0);
    }).map(u => {
        let calculatedOvr = 70;
        if (u.squadFormation && typeof u.squadFormation === 'object' && Object.keys(u.squadFormation).length > 0) {
            let totalOvr = 0;
            let count = 0;
            const positions = ["ST", "LW", "RW", "CM", "LCM", "RCM", "LB", "LCB", "RCB", "RB", "GK"];
            positions.forEach(pos => {
                const cardId = u.squadFormation[pos];
                if (cardId) {
                    let cardRating = 70;
                    if (typeof CARDS_DATABASE !== 'undefined' && CARDS_DATABASE && CARDS_DATABASE[cardId]) {
                        cardRating = CARDS_DATABASE[cardId].rating;
                        if (u.playerDeck && u.playerDeck[cardId] && typeof u.playerDeck[cardId].awakening === 'number') {
                            cardRating += u.playerDeck[cardId].awakening;
                        }
                    }
                    totalOvr += cardRating;
                    count++;
                }
            });
            if (count > 0) {
                calculatedOvr = Math.round(totalOvr / count);
            }
        } else {
            calculatedOvr = u.userLevel ? 70 + parseInt(u.userLevel) : 72;
        }
        
        return {
            id: u.id,
            name: u.id.toUpperCase(),
            rating: u.rating || calculatedOvr,
            friendlyMatchesHistory: u.friendlyMatchesHistory,
            isMock: false
        };
    });
    renderFriendlyTable();
}

// 친선경기 탭 클릭 시 격발되는 정보 초기화 및 로드 함수
async function initFriendlyMatchTab() {
    loadFriendlyMatchesState();

    // 주간 자동 시즌 마감 체크
    if (typeof checkFriendlySeasonClose === 'function') {
        const isClosed = checkFriendlySeasonClose();
        if (isClosed) return; // 마감 정산 팝업이 활성화되었으므로 탭 초기화 정지
    }

    const myId = typeof currentUser === 'string' && currentUser ? currentUser : "ooks";

    // 1. 전체 유저 순위표용 캐시 체크 (24시간 규격)
    const cachedUsers = localStorage.getItem('fc_star_friendly_users_cache');
    const cachedUsersTime = localStorage.getItem('fc_star_friendly_users_cache_time');
    const isUsersCacheValid = cachedUsers && cachedUsersTime && (Date.now() - parseInt(cachedUsersTime) < 24 * 60 * 60 * 1000);

    let standingsLoaded = false;
    if (isUsersCacheValid) {
        try {
            const allUsers = JSON.parse(cachedUsers);
            if (allUsers && allUsers.length > 0) {
                console.log("🟢 24시간 내 캐시된 전체 유저 데이터를 로컬에서 불러왔습니다.");
                processAndRenderStandings(allUsers, myId);
                standingsLoaded = true;
            }
        } catch (e) {
            console.warn("전체 유저 캐시 파싱 실패:", e);
        }
    }

    if (!standingsLoaded) {
        try {
            const allUsers = await window.dbService.fetchRankings();
            if (allUsers && allUsers.length > 0) {
                // 캐시 업데이트
                localStorage.setItem('fc_star_friendly_users_cache', JSON.stringify(allUsers));
                localStorage.setItem('fc_star_friendly_users_cache_time', Date.now().toString());
                processAndRenderStandings(allUsers, myId);
            }
        } catch (err) {
            console.warn("순위표용 전체 가입자 전적 조회 실패:", err);
            // 만료되었지만 존재하는 캐시가 있다면 마지막 수단으로 로드
            if (cachedUsers) {
                try {
                    const allUsers = JSON.parse(cachedUsers);
                    processAndRenderStandings(allUsers, myId);
                } catch (e) {}
            }
        }
    }

    // 2. 대결 상대 3인 리스트 캐시 체크 (24시간 규격)
    const cachedOpps = localStorage.getItem('fc_star_friendly_cached_opponents');
    const cachedOppsTime = localStorage.getItem('fc_star_friendly_opponents_cache_time');
    const isOppsCacheValid = cachedOpps && cachedOppsTime && (Date.now() - parseInt(cachedOppsTime) < 24 * 60 * 60 * 1000);

    let opponentsLoaded = false;
    if (isOppsCacheValid) {
        try {
            const opponents = JSON.parse(cachedOpps);
            if (opponents && opponents.length > 0) {
                console.log("🟢 24시간 내 캐시된 친선경기 상대 리스트를 로컬에서 불러왔습니다.");
                friendlyOpponentsList = opponents.sort((a, b) => a.rating - b.rating);
                renderFriendlyTable();
                updateFriendlyMatchPreview();
                opponentsLoaded = true;
            }
        } catch (e) {
            console.warn("상대 캐시 파싱 실패:", e);
        }
    }

    if (!opponentsLoaded) {
        try {
            const opponents = await window.dbService.fetchFriendlyOpponents(myId);
            if (opponents && opponents.length > 0) {
                // 캐시 업데이트
                localStorage.setItem('fc_star_friendly_cached_opponents', JSON.stringify(opponents));
                localStorage.setItem('fc_star_friendly_opponents_cache_time', Date.now().toString());
                
                friendlyOpponentsList = opponents.sort((a, b) => a.rating - b.rating);
                renderFriendlyTable();
                updateFriendlyMatchPreview();
            }
        } catch (e) {
            console.warn("친선경기 상대 리스트 로드 실패:", e);
            // 만료되었지만 캐시가 있다면 마지막 수단으로 로드
            if (cachedOpps) {
                try {
                    const opponents = JSON.parse(cachedOpps);
                    friendlyOpponentsList = opponents.sort((a, b) => a.rating - b.rating);
                    renderFriendlyTable();
                    updateFriendlyMatchPreview();
                } catch (e) {}
            }
        }
    }
}

// 친선경기 릴레이 매칭 시뮬레이터 격발
function startFriendlyMatchSimulation() {
    if (isMatchRunning) return;
    if (friendlyCurrentOpponentIndex >= 3 || friendlyOpponentsList.length === 0) {
        showToast("오늘의 친선 릴레이 매칭을 모두 완료했습니다!");
        return;
    }

    isMatchRunning = true;

    const startBtn = document.getElementById('btnStartFriendlyMatch');
    if (startBtn) {
        startBtn.disabled = true;
        startBtn.style.background = 'rgba(255, 255, 255, 0.05)';
        startBtn.style.color = 'var(--text-muted)';
        startBtn.style.cursor = 'not-allowed';
        startBtn.innerText = "경기 시뮬레이션 중...";
    }

    const opponent = friendlyOpponentsList[friendlyCurrentOpponentIndex];
    const myId = typeof currentUser === 'string' && currentUser ? currentUser : "ooks";
    const jeonbukOvr = getPlayerPureOvr();

    // 홈어드밴티지는 0 보정!
    const playerOvr = jeonbukOvr;
    const oppOvr = opponent.rating;
    const diff = playerOvr - oppOvr;

    let playerScoreVal = 0;
    let opponentScoreVal = 0;

    playSound('reveal');

    const livePulse = document.getElementById('friendlyLivePulseIndicator');
    if (livePulse) {
        livePulse.style.display = 'inline-block';
    }

    const commBox = document.getElementById('friendlyCommentaryScroll');
    if (commBox) commBox.innerHTML = '';

    const addCommentary = (min, text, type = 'normal') => {
        if (!commBox) return;
        const item = document.createElement('div');
        item.className = `comm-item comm-${type}`;
        const timestamp = min === 'SYSTEM' || min === 'FT' ? '' : `<strong style="color:#ffd700; margin-right: 6px;">${min}'</strong>`;
        item.innerHTML = `${timestamp}${text}`;
        commBox.appendChild(item);
        commBox.scrollTop = commBox.scrollHeight;
    };

    const activeAttacker = squadFormation["ST"] ? CARDS_DATABASE[squadFormation["ST"]].name : "무명 스트라이커";
    const activeLw = squadFormation["LW"] ? CARDS_DATABASE[squadFormation["LW"]].name : "무명 윙어";
    const activeRw = squadFormation["RW"] ? CARDS_DATABASE[squadFormation["RW"]].name : "무명 윙백";
    const activeCm = squadFormation["CM"] ? CARDS_DATABASE[squadFormation["CM"]].name : "무명 미드필더";
    const activeGk = squadFormation["GK"] ? CARDS_DATABASE[squadFormation["GK"]].name : "무명 골키퍼";

    const maxProb = 0.80;
    const minProb = 0.20;
    
    // 1. 포메이션별 직접/비례 확률 보너스 연동 (K리그 엔진과 완전 동일)
    let formationAttackBoost = 0;
    let formationScoreBoost = 0;
    let formationTacticDetailsHtml = "";
    
    if (currentFormation === '4-3-3') {
        const cmCardId = squadFormation['CM'];
        const hasKeyPlayer = cmCardId && getAwakenedCard(cmCardId).stats && getAwakenedCard(cmCardId).stats.pas >= 80;
        const avgPas = getTeamAverageStat('pas');
        const hasTeamTactic = avgPas >= 70;
        
        if (hasKeyPlayer && hasTeamTactic) {
            const cmPas = getAwakenedCard(cmCardId).stats.pas;
            formationAttackBoost = (cmPas - 80) * 0.005; // 1점당 +0.5%
            formationTacticDetailsHtml = `⚽ <strong>[4-3-3 빌드업 완성]</strong> 핵심 CM(${getAwakenedCard(cmCardId).name})의 패스 능력치(${cmPas}) 비례 공격권 획득 확률 <span style="color:#ffd700; font-weight:800;">+${(formationAttackBoost * 100).toFixed(1)}%</span> 부스트 탑재!`;
        }
    } else if (currentFormation === '3-4-3') {
        const cmCardId = squadFormation['CM'];
        const hasKeyPlayer = cmCardId && getAwakenedCard(cmCardId).stats && getAwakenedCard(cmCardId).stats.dri >= 80;
        const avgDri = getTeamAverageStat('dri');
        const hasTeamTactic = avgDri >= 70;
        
        if (hasKeyPlayer && hasTeamTactic) {
            const cmDri = getAwakenedCard(cmCardId).stats.dri;
            formationAttackBoost = (cmDri - 80) * 0.005; // 1점당 +0.5%
            formationTacticDetailsHtml = `🌀 <strong>[3-4-3 스위칭 완성]</strong> 핵심 CM(${getAwakenedCard(cmCardId).name})의 드리블 능력치(${cmDri}) 비례 공격권 획득 확률 <span style="color:#00ff87; font-weight:800;">+${(formationAttackBoost * 100).toFixed(1)}%</span> 부스트 탑재!`;
        }
    } else if (currentFormation === '5-4-1') {
        const lwCardId = squadFormation['LW'];
        const rwCardId = squadFormation['RW'];
        let hasKeyPlayer = false;
        let lwPac = 0;
        let rwPac = 0;
        
        if (lwCardId) {
            const card = getAwakenedCard(lwCardId);
            if (card && card.stats && card.stats.pac >= 80) {
                hasKeyPlayer = true;
                lwPac = card.stats.pac;
            }
        }
        if (rwCardId) {
            const card = getAwakenedCard(rwCardId);
            if (card && card.stats && card.stats.pac >= 80) {
                hasKeyPlayer = true;
                rwPac = card.stats.pac;
            }
        }
        
        const avgDef = getTeamAverageStat('def');
        const hasTeamTactic = avgDef >= 60;
        
        if (hasKeyPlayer && hasTeamTactic) {
            const bestPac = Math.max(lwPac, rwPac);
            formationScoreBoost = (bestPac - 80) * 0.005; // 1점당 +0.5%
            formationTacticDetailsHtml = `⚡ <strong>[5-4-1 역습 완성]</strong> 에이스 윙어 최고속도(${bestPac}) 비례 득점 성공 확률 <span style="color:#ff3e6c; font-weight:800;">+${(formationScoreBoost * 100).toFixed(1)}%</span> 부스트 탑재!`;
        }
    } else if (currentFormation === '4-2-3-1') {
        const cmCardId = squadFormation['CM'];
        const hasKeyPlayer = cmCardId && getAwakenedCard(cmCardId).stats && getAwakenedCard(cmCardId).stats.dri >= 80;
        const avgDri = getTeamAverageStat('dri');
        const hasTeamTactic = avgDri >= 70;
        
        if (hasKeyPlayer && hasTeamTactic) {
            const cmDri = getAwakenedCard(cmCardId).stats.dri;
            formationAttackBoost = (cmDri - 80) * 0.005; // 1점당 +0.5%
            formationTacticDetailsHtml = `⚽ <strong>[4-2-3-1 점유율 완성]</strong> 핵심 AM(${getAwakenedCard(cmCardId).name})의 드리블 능력치(${cmDri}) 비례 공격권 획득 확률 <span style="color:#00d2fc; font-weight:800;">+${(formationAttackBoost * 100).toFixed(1)}%</span> 부스트 탑재!`;
        }
    }

    // 2. 세부전술 및 전술 적합 보너스 계산 (K리그와 100% 동일하게 순수 OVR 해설 출력)
    let detailedTacticBonus = 0;
    let suitabilityBonus = 0;
    let detailedTacticLabel = "";
    let suitabilityLabel = "";
    let isDetailedActive = false;
    
    if (currentFormation === '4-3-3') {
        const stCardId = squadFormation['ST'];
        isDetailedActive = stCardId && getAwakenedCard(stCardId).stats && getAwakenedCard(stCardId).stats.phy >= 80;
        if (isDetailedActive) {
            detailedTacticBonus = 0.05;
            detailedTacticLabel = ` [세부전술: 타겟맨 활성 (+5.0%)]`;
        }
        const avgPas = getTeamAverageStat('pas');
        suitabilityBonus = Math.max(0, (avgPas - 70) * 0.01);
        if (suitabilityBonus > 0) {
            suitabilityLabel = ` [전술적합(PAS): +${(suitabilityBonus * 100).toFixed(1)}%]`;
        }
    } else if (currentFormation === '3-4-3') {
        let fastAttackersCount = 0;
        const attackers = ["LW", "ST", "RW"];
        attackers.forEach(pos => {
            const cardId = squadFormation[pos];
            if (cardId && getAwakenedCard(cardId).stats && getAwakenedCard(cardId).stats.pac >= 90) {
                fastAttackersCount++;
            }
        });
        isDetailedActive = fastAttackersCount >= 2;
        if (isDetailedActive) {
            detailedTacticBonus = 0.05;
            detailedTacticLabel = ` [세부전술: 전방압박 활성 (+5.0%)]`;
        }
        const avgDri = getTeamAverageStat('dri');
        suitabilityBonus = Math.max(0, (avgDri - 70) * 0.01);
        if (suitabilityBonus > 0) {
            suitabilityLabel = ` [전술적합(DRI): +${(suitabilityBonus * 100).toFixed(1)}%]`;
        }
    } else if (currentFormation === '5-4-1') {
        let passDefendersCount = 0;
        const defenders = ["LB", "LCB", "CM", "RCB", "RB"];
        defenders.forEach(pos => {
            const cardId = squadFormation[pos];
            if (cardId && CARDS_DATABASE[cardId]) {
                const card = getAwakenedCard(cardId);
                const isRealDefender = ['CB', 'LB', 'RB'].includes(card.position);
                if (isRealDefender && card.stats && card.stats.pas >= 80) {
                    passDefendersCount++;
                }
            }
        });
        isDetailedActive = passDefendersCount >= 1;
        if (isDetailedActive) {
            detailedTacticBonus = 0.05;
            detailedTacticLabel = ` [세부전술: 다이렉트 패스 활성 (+5.0%)]`;
        }
        const avgDef = getTeamAverageStat('def');
        suitabilityBonus = Math.max(0, (avgDef - 60) * 0.01);
        if (suitabilityBonus > 0) {
            suitabilityLabel = ` [전술적합(DEF): +${(suitabilityBonus * 100).toFixed(1)}%]`;
        }
    } else if (currentFormation === '4-2-3-1') {
        let passMidfieldersCount = 0;
        const midfielders = ["LCM", "CM", "RCM"];
        midfielders.forEach(pos => {
            const cardId = squadFormation[pos];
            if (cardId && getAwakenedCard(cardId).stats && getAwakenedCard(cardId).stats.pas >= 83) {
                passMidfieldersCount++;
            }
        });
        isDetailedActive = passMidfieldersCount === 3;
        if (isDetailedActive) {
            detailedTacticBonus = 0.05;
            detailedTacticLabel = ` [세부전술: 티키타카 활성 (+5.0%)]`;
        }
        const avgDri = getTeamAverageStat('dri');
        suitabilityBonus = Math.max(0, (avgDri - 70) * 0.01);
        if (suitabilityBonus > 0) {
            suitabilityLabel = ` [전술적합(DRI): +${(suitabilityBonus * 100).toFixed(1)}%]`;
        }
    }

    const playerAttackProb = Math.min(maxProb, Math.max(minProb, 0.40 + (diff * 0.019) + formationAttackBoost + suitabilityBonus + detailedTacticBonus));

    // 공통 코멘터리 데이터 정의
    const commentaryData = {
        playerOvr: playerOvr,
        opponentName: opponent.name,
        opponentOvr: oppOvr,
        playerScoreVal: playerScoreVal,
        opponentScoreVal: opponentScoreVal,
        activeGk: activeGk,
        detailedTacticLabel: detailedTacticLabel,
        suitabilityLabel: suitabilityLabel,
        playerAttackProb: playerAttackProb
    };

    addCommentary('SYSTEM', getMatchEventCommentary('PRE_ANALYZE', commentaryData, true), 'system');

    if (formationTacticDetailsHtml) {
        addCommentary('SYSTEM', formationTacticDetailsHtml, 'attack');
    }

    if (detailedTacticLabel || suitabilityLabel) {
        addCommentary('SYSTEM', getMatchEventCommentary('TACTIC_ANALYZE', commentaryData, true), 'attack');
    }

    const sbTimeDisplay = document.getElementById('friendlySbTimeDisplay');
    if (sbTimeDisplay) sbTimeDisplay.classList.add('live-ticking');

    const matchMinutes = [0, 15, 30, 45, 52, 63, 74, 82, 88, 90];
    const eventMins = [15, 45, 63, 82, 88];
    let tickIdx = 0;

    const finishFriendlyMatch = () => {
        if (sbTimeDisplay) {
            sbTimeDisplay.classList.remove('live-ticking');
            sbTimeDisplay.innerText = "종료";
        }

        const livePulse = document.getElementById('friendlyLivePulseIndicator');
        if (livePulse) {
            livePulse.style.display = 'none';
        }

        const isWinner = playerScoreVal > opponentScoreVal;
        const isDraw = playerScoreVal === opponentScoreVal;

        // 최종 성적 동기화용 스코어 데이터 갱신
        commentaryData.playerScoreVal = playerScoreVal;
        commentaryData.opponentScoreVal = opponentScoreVal;

        addCommentary('FT', getMatchEventCommentary('FULLTIME', commentaryData, true), 'system');

        if (isWinner) {
            addCommentary('FT', getMatchEventCommentary('RESULT', commentaryData, true), 'goal');
            friendlyMatchesHistory.w += 1;
            friendlyMatchesHistory.pts += 3;
        } else if (isDraw) {
            addCommentary('FT', getMatchEventCommentary('RESULT', commentaryData, true), 'system');
            friendlyMatchesHistory.d += 1;
            friendlyMatchesHistory.pts += 1;
        } else {
            addCommentary('FT', getMatchEventCommentary('RESULT', commentaryData, true), 'normal');
            friendlyMatchesHistory.l += 1;
        }

        friendlyCurrentOpponentIndex += 1;
        friendlyMatchesToday += 1;

        saveFriendlyMatchesState();

        renderFriendlyTable();
        updateFriendlyMatchPreview();

        isMatchRunning = false;

        if (typeof saveUserProgress === 'function') {
            saveUserProgress();
        }

        showToast(`⚡ 친선 매치 결과가 순위표에 반영되었습니다!`);
    };

    if (isDeveloperMode) {
        matchMinutes.forEach(currentMin => {
            if (currentMin === 0) {
                addCommentary(0, getMatchEventCommentary('KICKOFF', commentaryData, true, true), 'normal');
            } else if (eventMins.includes(currentMin)) {
                const isPlayerAttack = Math.random() < playerAttackProb;
                if (isPlayerAttack) {
                    let attackOptions = [0, 1, 2];
                    if (currentFormation === '4-2-3-1') attackOptions.push(5);
                    const selectedOption = attackOptions[Math.floor(Math.random() * attackOptions.length)];
                    
                    let chancePlayerStat = 75;
                    if (selectedOption === 0) {
                        const lwCardId = squadFormation['LW'];
                        if (lwCardId && CARDS_DATABASE[lwCardId]) {
                            const card = getAwakenedCard(lwCardId);
                            chancePlayerStat = Math.round(((card.stats.dri || 75) + (card.stats.sho || 75)) / 2);
                        }
                    } else if (selectedOption === 1) {
                        const stCardId = squadFormation['ST'];
                        if (stCardId && CARDS_DATABASE[stCardId]) {
                            const card = getAwakenedCard(stCardId);
                            chancePlayerStat = card.stats.sho || 75;
                        }
                    } else if (selectedOption === 2) {
                        const rwCardId = squadFormation['RW'];
                        if (rwCardId && CARDS_DATABASE[rwCardId]) {
                            const card = getAwakenedCard(rwCardId);
                            chancePlayerStat = Math.round(((card.stats.pac || 75) + (card.stats.sho || 75)) / 2);
                        }
                    } else if (selectedOption === 5) {
                        const cmCardId = squadFormation['CM'];
                        if (cmCardId && CARDS_DATABASE[cmCardId]) {
                            const card = getAwakenedCard(cmCardId);
                            chancePlayerStat = card.stats.dri || 75;
                        }
                    }

                    const playerChanceBonus = (chancePlayerStat - oppOvr) * 0.01;
                    const maxScoreProb = 0.60;
                    const minScoreProb = 0.10;
                    const scoreProb = Math.min(maxScoreProb, Math.max(minScoreProb, 0.20 + (diff * 0.019) + formationScoreBoost + playerChanceBonus + suitabilityBonus));
                    const isGoal = Math.random() < scoreProb;

                    const activePlayers = { ST: activeAttacker, LW: activeLw, RW: activeRw, CM: activeCm };
                    const { eventDesc, eventGoal, eventFail } = getDetailedTacticCommentary(selectedOption, currentFormation, isDetailedActive, activePlayers);

                    addCommentary(currentMin, eventDesc, 'attack');
                    if (isGoal) {
                        playerScoreVal++;
                        addCommentary(currentMin, eventGoal, 'goal');
                    } else {
                        addCommentary(currentMin, eventFail, 'normal');
                    }
                } else {
                    let playerGkStat = 70;
                    const gkCardId = squadFormation['GK'];
                    if (gkCardId && CARDS_DATABASE[gkCardId]) {
                        const card = getAwakenedCard(gkCardId);
                        playerGkStat = card.stats.def || card.rating || 70;
                    }
                    
                    const oppChanceBonus = (opponent.rating - playerGkStat) * 0.01;
                    const oppScoreProb = Math.min(0.90, Math.max(0.08, 0.35 - (diff * 0.026) + 0.05 + oppChanceBonus));
                    const isGoal = Math.random() < oppScoreProb;
                    
                    addCommentary(currentMin, getMatchEventCommentary('OPP_ATTACK', commentaryData, true), 'attack');
                    if (isGoal) {
                        opponentScoreVal++;
                        addCommentary(currentMin, getMatchEventCommentary('OPP_GOAL', commentaryData, true), 'normal');
                    } else {
                        addCommentary(currentMin, getMatchEventCommentary('GK_SAVE', commentaryData, true), 'normal');
                    }
                }
            } else if (currentMin === 45) {
                commentaryData.playerScoreVal = playerScoreVal;
                commentaryData.opponentScoreVal = opponentScoreVal;
                addCommentary('HT', getMatchEventCommentary('HALFTIME', commentaryData, true, true), 'system');
            }
        });

        const fHomeScore = document.getElementById('friendlyHomeScore');
        const fAwayScore = document.getElementById('friendlyAwayScore');
        if (fHomeScore) fHomeScore.innerText = playerScoreVal;
        if (fAwayScore) fAwayScore.innerText = opponentScoreVal;
        finishFriendlyMatch();
        return;
    }

    const matchTimer = setInterval(() => {
        const currentMin = matchMinutes[tickIdx];
        if (sbTimeDisplay) sbTimeDisplay.innerText = `${currentMin}'`;

        if (currentMin === 0) {
            addCommentary(0, getMatchEventCommentary('KICKOFF', commentaryData, true, false), 'normal');
        } else if (eventMins.includes(currentMin)) {
            const isPlayerAttack = Math.random() < playerAttackProb;
            if (isPlayerAttack) {
                let attackOptions = [0, 1, 2];
                if (currentFormation === '4-2-3-1') attackOptions.push(5);
                const selectedOption = attackOptions[Math.floor(Math.random() * attackOptions.length)];
                
                let chancePlayerStat = 75;
                if (selectedOption === 0) {
                    const lwCardId = squadFormation['LW'];
                    if (lwCardId && CARDS_DATABASE[lwCardId]) {
                        const card = getAwakenedCard(lwCardId);
                        chancePlayerStat = Math.round(((card.stats.dri || 75) + (card.stats.sho || 75)) / 2);
                    }
                } else if (selectedOption === 1) {
                    const stCardId = squadFormation['ST'];
                    if (stCardId && CARDS_DATABASE[stCardId]) {
                        const card = getAwakenedCard(stCardId);
                        chancePlayerStat = card.stats.sho || 75;
                    }
                } else if (selectedOption === 2) {
                    const rwCardId = squadFormation['RW'];
                    if (rwCardId && CARDS_DATABASE[rwCardId]) {
                        const card = getAwakenedCard(rwCardId);
                        chancePlayerStat = Math.round(((card.stats.pac || 75) + (card.stats.sho || 75)) / 2);
                    }
                } else if (selectedOption === 5) {
                    const cmCardId = squadFormation['CM'];
                    if (cmCardId && CARDS_DATABASE[cmCardId]) {
                        const card = getAwakenedCard(cmCardId);
                        chancePlayerStat = card.stats.dri || 75;
                    }
                }

                const playerChanceBonus = (chancePlayerStat - oppOvr) * 0.01;
                const maxScoreProb = 0.60;
                const minScoreProb = 0.10;
                const scoreProb = Math.min(maxScoreProb, Math.max(minScoreProb, 0.20 + (diff * 0.019) + formationScoreBoost + playerChanceBonus + suitabilityBonus));
                const isGoal = Math.random() < scoreProb;

                const activePlayers = { ST: activeAttacker, LW: activeLw, RW: activeRw, CM: activeCm };
                const { eventDesc, eventGoal, eventFail } = getDetailedTacticCommentary(selectedOption, currentFormation, isDetailedActive, activePlayers);

                addCommentary(currentMin, eventDesc, 'attack');
                if (isGoal) {
                    playerScoreVal++;
                    playSound('reveal');
                    const fHomeScore = document.getElementById('friendlyHomeScore');
                    if (fHomeScore) fHomeScore.innerText = playerScoreVal;
                    
                    setTimeout(() => {
                        addCommentary(currentMin, eventGoal, 'goal');
                    }, 450);
                } else {
                    addCommentary(currentMin, eventFail, 'normal');
                }
            } else {
                let playerGkStat = 70;
                const gkCardId = squadFormation['GK'];
                if (gkCardId && CARDS_DATABASE[gkCardId]) {
                    const card = getAwakenedCard(gkCardId);
                    playerGkStat = card.stats.def || card.rating || 70;
                }
                
                const oppChanceBonus = (opponent.rating - playerGkStat) * 0.01;
                const oppScoreProb = Math.min(0.90, Math.max(0.08, 0.35 - (diff * 0.026) + 0.05 + oppChanceBonus));
                const isGoal = Math.random() < oppScoreProb;
                
                addCommentary(currentMin, getMatchEventCommentary('OPP_ATTACK', commentaryData, true), 'attack');
                if (isGoal) {
                    opponentScoreVal++;
                    const fAwayScore = document.getElementById('friendlyAwayScore');
                    if (fAwayScore) fAwayScore.innerText = opponentScoreVal;
                    addCommentary(currentMin, getMatchEventCommentary('OPP_GOAL', commentaryData, true), 'normal');
                } else {
                    const saveText = getMatchEventCommentary('GK_SAVE', commentaryData, true);
                    addCommentary(currentMin, saveText, 'normal');
                }
            }
        } else if (currentMin === 45) {
            commentaryData.playerScoreVal = playerScoreVal;
            commentaryData.opponentScoreVal = opponentScoreVal;
            addCommentary('HT', getMatchEventCommentary('HALFTIME', commentaryData, true, false), 'system');
        }

        tickIdx++;
        if (tickIdx >= matchMinutes.length) {
            clearInterval(matchTimer);
            finishFriendlyMatch();
        }
    }, isDeveloperMode ? 0 : 900);
}

// 친선경기 강제 데이터 리프레시 (원격 DB 재동기화 및 릴레이 재도전)
async function refreshFriendlyOpponentsForce() {
    if (isMatchRunning) {
        showToast("⚠️ 경기가 진행 중일 때는 데이터 새로고침이 불가능합니다.");
        return;
    }
    
    const refreshBtn = document.getElementById('btnRefreshFriendly');
    let originalHtml = "";
    if (refreshBtn) {
        originalHtml = refreshBtn.innerHTML;
        refreshBtn.disabled = true;
        refreshBtn.style.cursor = 'not-allowed';
        refreshBtn.innerHTML = `<i class="fa-solid fa-arrows-rotate fa-spin"></i> 동기화 중...`;
    }

    showToast("🔄 최신 Firebase DB에서 친선 구단 데이터를 새로 동기화하고 있습니다...");
    
    // 강제 동기화를 위해 기존 로컬 캐시를 파괴하고 원격 Fetch 유도
    localStorage.removeItem('fc_star_friendly_cached_opponents');
    localStorage.removeItem('fc_star_friendly_opponents_cache_time');
    localStorage.removeItem('fc_star_friendly_users_cache');
    localStorage.removeItem('fc_star_friendly_users_cache_time');
    
    const myId = typeof currentUser === 'string' && currentUser ? currentUser : "ooks";
    
    try {
        const opponents = await window.dbService.fetchFriendlyOpponents(myId);
        
        // 전체 유저 순위표 실시간 최신 정보로 재동기화
        try {
            const allUsers = await window.dbService.fetchRankings();
            if (allUsers && allUsers.length > 0) {
                // 캐시 세이브 및 타임스탬프 업데이트
                localStorage.setItem('fc_star_friendly_users_cache', JSON.stringify(allUsers));
                localStorage.setItem('fc_star_friendly_users_cache_time', Date.now().toString());

                friendlyGlobalStandingsList = allUsers.filter(u => {
                    const userId = (u.id || "").trim().toLowerCase();
                    if (userId === myId.trim().toLowerCase()) return false;
                    if (userId === "ooks12") return false;
                    
                    return u.friendlyMatchesHistory && 
                           (u.friendlyMatchesHistory.w > 0 || 
                            u.friendlyMatchesHistory.d > 0 || 
                            u.friendlyMatchesHistory.l > 0);
                }).map(u => {
                    let calculatedOvr = 70;
                    if (u.squadFormation && typeof u.squadFormation === 'object' && Object.keys(u.squadFormation).length > 0) {
                        let totalOvr = 0;
                        let count = 0;
                        const positions = ["ST", "LW", "RW", "CM", "LCM", "RCM", "LB", "LCB", "RCB", "RB", "GK"];
                        positions.forEach(pos => {
                            const cardId = u.squadFormation[pos];
                            if (cardId) {
                                let cardRating = 70;
                                if (typeof CARDS_DATABASE !== 'undefined' && CARDS_DATABASE && CARDS_DATABASE[cardId]) {
                                    cardRating = CARDS_DATABASE[cardId].rating;
                                    if (u.playerDeck && u.playerDeck[cardId] && typeof u.playerDeck[cardId].awakening === 'number') {
                                        cardRating += u.playerDeck[cardId].awakening;
                                    }
                                }
                                totalOvr += cardRating;
                                count++;
                            }
                        });
                        if (count > 0) calculatedOvr = Math.round(totalOvr / count);
                    } else {
                        calculatedOvr = u.userLevel ? 70 + parseInt(u.userLevel) : 72;
                    }
                    
                    return {
                        id: u.id,
                        name: u.id.toUpperCase(),
                        rating: u.rating || calculatedOvr,
                        friendlyMatchesHistory: u.friendlyMatchesHistory,
                        isMock: false
                    };
                });
            }
        } catch (allErr) {
            console.warn("리프레시 중 전체 유저 로드 실패:", allErr);
        }

        if (opponents && opponents.length > 0) {
            // 캐시 세이브 및 타임스탬프 업데이트
            localStorage.setItem('fc_star_friendly_cached_opponents', JSON.stringify(opponents));
            localStorage.setItem('fc_star_friendly_opponents_cache_time', Date.now().toString());

            // OVR 오름차순으로 정렬
            friendlyOpponentsList = opponents.sort((a, b) => a.rating - b.rating);
            
            // 릴레이 진행 상태 유지 (데이터 새로고침 시에도 대결 횟수 및 3회 제한 온전히 유지!)
            saveFriendlyMatchesState();
            
            // 중계창은 첫 경기를 시작하기 전(Index가 0일 때)에만 대기 문구로 리셋
            if (friendlyCurrentOpponentIndex === 0) {
                const commBox = document.getElementById('friendlyCommentaryScroll');
                if (commBox) {
                    commBox.innerHTML = '<div class="comm-item comm-system">친선 경기를 시작하려면 아래 \'친선 경기 개시\' 버튼을 누르세요.</div>';
                }
            }
            
            renderFriendlyTable();
            updateFriendlyMatchPreview();
            
            const hasMock = friendlyOpponentsList.some(opp => opp.isMock);
            if (hasMock) {
                showToast("🤖 원격 DB 조회 실패 또는 네트워크 오프라인으로 AI 봇 라인업이 구성되었습니다.");
            } else {
                const displayIndex = Math.min(3, friendlyCurrentOpponentIndex + 1);
                showToast(`🎉 최신 실시간 원격 DB 데이터 동기화 완료! (현재 ${displayIndex}번째 상대 도전 준비 완료)`);
            }
        }
    } catch (e) {
        console.error("강제 동기화 실패:", e);
        showToast("⚠️ 동기화 실패! 가상 봇 모드(MOCK)로 전환되었습니다.");
    } finally {
        if (refreshBtn) {
            refreshBtn.disabled = false;
            refreshBtn.style.cursor = 'pointer';
            refreshBtn.innerHTML = originalHtml;
        }
    }
}

// ==========================================================================
// 17. 친선경기 주간 마감 알고리즘 (WEEKLY DEADLINE & CLOSE SEASON SYSTEM)
// ==========================================================================

// 주간 시즌 마감 여부 정밀 체크 (매주 금요일 밤 23:59:59 기준 마감)
function checkFriendlySeasonClose() {
    const myId = typeof currentUser === 'string' && currentUser ? currentUser : "ooks";
    const keyStartDate = `fc_star_friendly_season_start_date_${myId}`;
    let startDateStr = localStorage.getItem(keyStartDate);
    if (!startDateStr) {
        const now = new Date();
        const lastFriday = new Date();
        const day = lastFriday.getDay();
        const diff = (day >= 5) ? (day - 5) : (day + 2);
        lastFriday.setDate(lastFriday.getDate() - diff);
        lastFriday.setHours(0, 0, 0, 0);
        startDateStr = lastFriday.toISOString();
        localStorage.setItem(keyStartDate, startDateStr);
        return false;
    }
    
    const startDate = new Date(startDateStr);
    const day = startDate.getDay();
    let diffToFriday = (5 - day + 7) % 7;
    if (diffToFriday === 0) diffToFriday = 7;
    
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + diffToFriday);
    endDate.setHours(23, 59, 59, 999); // 금요일 밤 23:59:59
    
    const now = new Date();
    if (now > endDate) {
        triggerFriendlySeasonClose(false); // 시즌 마감 자동 격발
        return true;
    }
    return false;
}

// 주간 친선경기 결산 보상 지급 및 순위 정산 격발
function triggerFriendlySeasonClose(isForce = false) {
    const myId = typeof currentUser === 'string' && currentUser ? currentUser : "ooks";
    
    // 1. 현재 순위표 DOM을 역추적하여 최종 랭킹 및 전적 파싱
    const tbody = document.querySelector('#matchLayoutFriendly .friendly-table tbody');
    if (!tbody) {
        showToast("순위표 정보를 찾을 수 없어 주간 정산을 진행할 수 없습니다.");
        return;
    }
    
    const rows = Array.from(tbody.querySelectorAll('tr'));
    let myRank = 4; // 기본 4위 이하 배정
    let myRecord = "0승 0무 0패 (승점 0)";
    
    rows.forEach((tr, index) => {
        const teamCol = tr.querySelector('.league-team-col span');
        const teamNameText = teamCol ? teamCol.innerText : "";
        if (teamNameText.includes("나의 구단") || teamNameText.includes("전북")) {
            myRank = index + 1;
            const ptsText = tr.querySelector('.league-row-pts') ? tr.querySelector('.league-row-pts').innerText : "0";
            const recordTd = tr.querySelectorAll('td')[3];
            const recordText = recordTd ? recordTd.innerText : "0승 0무 0패";
            myRecord = `${recordText} (승점 ${ptsText})`;
        }
    });

    // 2. 최종 순위별 보상 연산 및 HTML 구조화 (매주 금요일 마감 보상)
    let rewardHtml = "";
    
    if (myRank <= 3) {
        // [TOP 3 우승/준우승 보상] 스쿼드 캡틴(주장) 카드 각성 +1 강화!
        if (squadCaptain && playerDeck[squadCaptain]) {
            if (typeof playerDeck[squadCaptain].awakening !== 'number') {
                playerDeck[squadCaptain].awakening = 0;
            }
            
            const captainCard = CARDS_DATABASE[squadCaptain];
            const oldAwk = playerDeck[squadCaptain].awakening;
            
            if (playerDeck[squadCaptain].awakening < 5) {
                playerDeck[squadCaptain].awakening += 1;
                const newAwk = playerDeck[squadCaptain].awakening;
                
                rewardHtml = `
                    <div style="font-size: 0.95rem; color: #00ff87; font-weight: bold; margin-bottom: 6px;">
                        👑 주간 릴레이 랭킹 TOP 3 달성! 👑
                    </div>
                    <div style="font-size: 0.8rem; color: #cbd5e1; line-height: 1.5; margin-bottom: 12px; word-break: keep-all;">
                        친선경기 주간 순위표에서 당당히 <strong>${myRank}위</strong>로 시즌을 마쳤습니다!<br>
                        약속대로 우리 구단의 자랑스러운 캡틴이 영구적으로 강화됩니다.
                    </div>
                    <div style="background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(165, 94, 234, 0.3); border-radius: 18px; padding: 1rem; width: 100%; display: flex; align-items: center; gap: 14px; box-shadow: 0 0 15px rgba(165, 94, 234, 0.15);">
                        <img src="${captainCard.image}" style="height: 64px; width: 64px; border-radius: 50%; border: 2.5px solid #ffd700; box-shadow: 0 0 15px rgba(255, 215, 0, 0.65);" onerror="this.src='https://placehold.co/120x120/005a3c/ffd700?text=${encodeURIComponent(captainCard.name)}'">
                        <div style="text-align: left; display: flex; flex-direction: column; gap: 2px;">
                            <div style="font-size: 1rem; font-weight: 800; color: #fff;">${captainCard.name}</div>
                            <div style="font-size: 0.75rem; color: #94a3b8; font-weight: 700;">주장 카드 특별 강화 보상</div>
                            <div style="font-size: 0.72rem; color: #ffd700; font-weight: 900; margin-top: 3px; display: flex; align-items: center; gap: 4px;">
                                ★${oldAwk} 각성 &rarr; <span style="font-size: 0.82rem; text-shadow: 0 0 5px #ffd700;">★${newAwk} 각성 (+1 강화 완료!)</span>
                            </div>
                        </div>
                    </div>
                `;
            } else {
                // 이미 주장 카드가 5성(최대 각성/풀강) 상태일 시 대체 보상 FP 5포인트 지급
                userPoints += 5;
                rewardHtml = `
                    <div style="font-size: 0.95rem; color: #00ff87; font-weight: bold; margin-bottom: 6px;">
                        👑 주간 릴레이 랭킹 TOP 3 달성! 👑
                    </div>
                    <div style="font-size: 0.8rem; color: #cbd5e1; line-height: 1.5; margin-bottom: 12px; word-break: keep-all;">
                        구단의 주장 <strong>${captainCard.name}</strong> 선수는 이미 <span style="color:#ffd700;">★5 최강 각성 상태</span>입니다!<br>
                        주장이 이미 풀강화(★5)되어 있어 대체 강화 포인트가 지급되었습니다!
                    </div>
                    <div style="background: rgba(255, 215, 0, 0.08); border: 1.5px solid rgba(255, 215, 0, 0.35); border-radius: 18px; padding: 1.1rem; width: 100%; box-shadow: 0 0 15px rgba(255, 215, 0, 0.15);">
                        <div style="font-size: 1.25rem; font-weight: 900; color: #ffd700; text-shadow: 0 0 10px rgba(255, 215, 0, 0.3); display: flex; align-items: center; justify-content: center; gap: 6px;">
                            <i class="fa-solid fa-circle-dollar-to-slot"></i> +5 FP 대체 보상 지급!
                        </div>
                    </div>
                `;
            }
        } else {
            // 주장 카드가 공백(미설정)일 경우 보상 미지급
            rewardHtml = `
                <div style="font-size: 0.95rem; color: #ff8888; font-weight: bold; margin-bottom: 6px;">
                    👑 주간 릴레이 랭킹 TOP 3 달성! 👑
                </div>
                <div style="font-size: 0.8rem; color: #cbd5e1; line-height: 1.5; margin-bottom: 12px; word-break: keep-all;">
                    친선 주간 릴레이에서 당당히 <strong>${myRank}위</strong>를 달성했으나,<br>
                    현재 <span style="color:#ff6b6b; font-weight:800;">스쿼드 주장(캡틴)이 지정되어 있지 않아</span> 우승 강화 보상을 수령하지 못했습니다.<br>
                    <span style="font-size: 0.72rem; color: #94a3b8; display: block; margin-top: 6px;">💡 스쿼드 관리 화면에서 주장을 임명해 두시면 다음 금요일 마감 때 주장 선수가 즉시 강화됩니다!</span>
                </div>
            `;
        }
    } else {
        // [4위 이하 참가 보상] 4위 이하인 경우 보상 없음
        rewardHtml = `
            <div style="font-size: 0.95rem; color: #a55eea; font-weight: bold; margin-bottom: 6px;">
                🍀 주간 마감 완료! 🍀
            </div>
            <div style="font-size: 0.8rem; color: #cbd5e1; line-height: 1.5; margin-bottom: 12px; word-break: keep-all;">
                주간 친선 릴레이 매치에서 <strong>${myRank}위</strong>로 치열한 레이스를 무사히 마쳤습니다.<br>
                아쉽게 우승권(1~3위)에 진입하지 못해 보상 획득을 실패하였습니다.<br>
                다음 금요일 마감 전까지 전술 OVR을 끌어올려 주장 카드 특별 강화권에 꼭 도전해 보세요!
            </div>
        `;
    }

    // 3. 모달 요약 데이터 렌더링 및 모달 호출
    const modal = document.getElementById('friendlyCloseModal');
    const rankText = document.getElementById('friendlyCloseRankText');
    const recText = document.getElementById('friendlyCloseRecordText');
    const rewardPanel = document.getElementById('friendlyCloseRewardDetail');
    
    if (rankText) {
        rankText.innerText = `${myRank}위`;
        if (myRank === 1) rankText.style.color = '#ffd700';
        else if (myRank === 2) rankText.style.color = '#e2e8f0';
        else if (myRank === 3) rankText.style.color = '#cd7f32';
        else rankText.style.color = '#cbd5e1';
    }
    if (recText) recText.innerText = myRecord;
    if (rewardPanel) rewardPanel.innerHTML = rewardHtml;
    
    if (modal) {
        modal.style.display = 'flex';
        playSound('rank_up');
    }

    // 4. 주간 친선경기 전적 전면 초기화 (전술 훈련 및 신주간 레이스 개막)
    friendlyMatchesHistory = { w: 0, d: 0, l: 0, pts: 0 };
    friendlyCurrentOpponentIndex = 0;
    friendlyMatchesToday = 0;
    
    // 신규 시즌 마감 타임라인 리셋
    localStorage.setItem(`fc_star_friendly_season_start_date_${myId}`, new Date().toISOString());
    
    // 로컬 스토리지에 결과 전적 및 카드 상태 저장
    try {
        localStorage.setItem('fc_star_player_deck', JSON.stringify(playerDeck));
        localStorage.setItem('fc_star_user_points', userPoints.toString());
    } catch(e) {}
    
    saveFriendlyMatchesState();
    
    // 최신 정보 Firestore에 클라우드 자동 동기화 백업
    if (typeof saveUserProgress === 'function') {
        saveUserProgress();
    }
    
    // UI 전역 갱신
    if (typeof renderUserPoints === 'function') renderUserPoints();
    if (typeof renderDeck === 'function') renderDeck();
    if (typeof renderSquadFormation === 'function') renderSquadFormation();
    if (typeof syncJeonbukOvr === 'function') syncJeonbukOvr();
}

// 마감 결산 완료 및 새로운 시즌 대결 탭 세팅
function closeFriendlyCloseModal() {
    const modal = document.getElementById('friendlyCloseModal');
    if (modal) {
        modal.style.display = 'none';
    }
    
    // 탭 정보 즉시 새로고침
    renderFriendlyTable();
    updateFriendlyMatchPreview();
    
    // 중계창 최초 대기 화면으로 초기화
    const commBox = document.getElementById('friendlyCommentaryScroll');
    if (commBox) {
        commBox.innerHTML = '<div class="comm-item comm-system">친선 경기를 시작하려면 아래 \'친선 경기 개시\' 버튼을 누르세요.</div>';
    }
    
    showToast("🎉 새로운 주간 친선 릴레이 매치 시즌이 성황리에 개막했습니다! 지금 바로 상대팀 OVR에 도전해보세요!");
}

// 친선 경기 매칭 모달 닫기
function closeFriendlyMatchModal() {
    const modal = document.getElementById('friendlyMatchModal');
    if (modal) {
        modal.style.display = 'none';
    }
}
