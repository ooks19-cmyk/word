/* js/friend.js - FC STAR CARD Friend list & squad viewer logic */

let friendUsersList = [];
let selectedFriendId = null;

// 친구 탭 진입 시 초기화 함수
// 팀 OVR 계산 헬퍼 함수
function calculateUserTeamOvr(user) {
    if (!user) return 70;
    if (user.squadFormation && typeof user.squadFormation === 'object' && Object.keys(user.squadFormation).length > 0) {
        let totalOvr = 0;
        let count = 0;
        const positions = ["ST", "LW", "RW", "CM", "LCM", "RCM", "LB", "LCB", "RCB", "RB", "GK"];
        positions.forEach(pos => {
            const cardId = user.squadFormation[pos];
            if (cardId) {
                let cardRating = 70;
                if (typeof CARDS_DATABASE !== 'undefined' && CARDS_DATABASE && CARDS_DATABASE[cardId]) {
                    cardRating = CARDS_DATABASE[cardId].rating;
                    if (user.playerDeck && user.playerDeck[cardId] && typeof user.playerDeck[cardId].awakening === 'number') {
                        cardRating += user.playerDeck[cardId].awakening;
                    }
                }
                totalOvr += cardRating;
                count++;
            }
        });
        if (count > 0) {
            return Math.round(totalOvr / count);
        }
    }
    const lvl = parseInt(user.userLevel) || 1;
    return 70 + (lvl > 15 ? 15 : lvl);
}

// 친구 탭 진입 시 초기화 함수 (24시간 로컬 캐싱 적용)
async function initFriendTab(forceRefresh = false) {
    const listScrollEl = document.getElementById('friendListScroll');
    if (listScrollEl) {
        listScrollEl.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; color: var(--text-muted); padding: 2rem 0; font-size: 0.85rem;">
                    <i class="fa-solid fa-spinner fa-spin" style="margin-right: 6px; color: #ffd700;"></i> 순위표를 불러오는 중...
                </td>
            </tr>
        `;
    }

    const CACHE_KEY = 'fc_star_friend_rankings_cache';
    const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24시간 (밀리초)

    try {
        let allUsers = null;
        let useCache = false;

        // 강제 새로고침이 아닐 경우 로컬스토리지 캐시 유효성 확인
        if (!forceRefresh) {
            try {
                const cachedDataStr = localStorage.getItem(CACHE_KEY);
                if (cachedDataStr) {
                    const cached = JSON.parse(cachedDataStr);
                    const now = Date.now();
                    if (cached && cached.timestamp && (now - cached.timestamp < CACHE_DURATION) && Array.isArray(cached.users)) {
                        allUsers = cached.users;
                        useCache = true;
                        console.log("🟢 [Friend Cache] 24시간 이내의 유효한 로컬 캐시 데이터를 불러왔습니다.");
                    }
                }
            } catch (cacheErr) {
                console.warn("⚠️ 로컬 캐시 파싱 실패:", cacheErr);
            }
        }

        // 캐시를 사용하지 못하거나 강제 리프레시 요청 시 서버 실시간 동기화
        if (!useCache) {
            allUsers = await dbService.fetchRankings();
            
            if (allUsers && allUsers.length > 0) {
                try {
                    const cachePayload = {
                        timestamp: Date.now(),
                        users: allUsers
                    };
                    localStorage.setItem(CACHE_KEY, JSON.stringify(cachePayload));
                    console.log("💾 [Friend Cache] 최신 유저 목록 로컬 캐싱 완료 (24시간 보관)");
                    if (forceRefresh && typeof showToast === 'function') {
                        showToast("🔄 실시간 순위표 동기화가 완료되었습니다.");
                    }
                } catch (saveErr) {
                    console.warn("⚠️ 로컬 캐시 저장 실패:", saveErr);
                }
            }
        } else {
            // 캐시 로드 성공 피드백 알림
            if (typeof showToast === 'function') {
                showToast("⚡ 로컬 순위표 정보를 불러왔습니다.");
            }
        }
        
        if (!allUsers || allUsers.length === 0) {
            friendUsersList = [];
        } else {
            const myId = typeof currentUser !== 'undefined' ? currentUser : '';
            const normalizedMyId = myId ? myId.trim().toLowerCase() : '';

            // 각 유저의 수치 계산 및 내 계정 최신 로컬 상태 동기화
            allUsers.forEach(u => {
                const isMe = normalizedMyId && u.id && u.id.trim().toLowerCase() === normalizedMyId;
                if (isMe) {
                    if (typeof userPoints !== 'undefined') u.userPoints = userPoints;
                    if (typeof userLevel !== 'undefined') u.userLevel = userLevel;
                    if (typeof squadFormation !== 'undefined') u.squadFormation = squadFormation;
                    if (typeof playerDeck !== 'undefined') u.playerDeck = playerDeck;
                    if (typeof isHardMode !== 'undefined') u.isHardMode = isHardMode;
                }
                u._calcPoints = parseInt(u.userPoints ?? u.points ?? 0) || 0;
                u._calcLevel = parseInt(u.userLevel ?? 1) || 1;
                u._calcOvr = calculateUserTeamOvr(u);
            });

            // 🎯 포인트(FP) 기준 내림차순 정렬 (동점 시 레벨, OVR 순)
            allUsers.sort((a, b) => {
                if (b._calcPoints !== a._calcPoints) {
                    return b._calcPoints - a._calcPoints;
                }
                if (b._calcLevel !== a._calcLevel) {
                    return b._calcLevel - a._calcLevel;
                }
                return b._calcOvr - a._calcOvr;
            });

            // 순위 부여 (1위부터 순차 부여)
            allUsers.forEach((u, idx) => {
                u._rank = idx + 1;
            });

            friendUsersList = allUsers;
        }

        renderFriendList(friendUsersList);

        // 기본 선택: 기존 선택이 없으면 1위 유저 또는 내 계정 자동 선택
        if (friendUsersList.length > 0) {
            const targetId = selectedFriendId && friendUsersList.some(u => u.id === selectedFriendId)
                ? selectedFriendId
                : friendUsersList[0].id;
            selectFriend(targetId);
        }
    } catch (error) {
        console.error("순위표 조회 에러:", error);
        if (listScrollEl) {
            listScrollEl.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; color: #ff8888; padding: 2rem 0; font-size: 0.85rem;">
                        <i class="fa-solid fa-triangle-exclamation" style="margin-right: 6px;"></i> 순위표를 불러오지 못했습니다.
                    </td>
                </tr>
            `;
        }
    }
}

// 친구 순위표 테이블 렌더링
function renderFriendList(users) {
    const listScrollEl = document.getElementById('friendListScroll');
    if (!listScrollEl) return;

    listScrollEl.innerHTML = '';

    if (!users || users.length === 0) {
        listScrollEl.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; color: var(--text-muted); padding: 2.5rem 0; font-size: 0.85rem;">
                    검색 결과가 없습니다.
                </td>
            </tr>
        `;
        return;
    }

    const myId = typeof currentUser !== 'undefined' ? currentUser : '';
    const normalizedMyId = myId ? myId.trim().toLowerCase() : '';

    users.forEach(user => {
        const userId = user.id || 'unknown';
        const userLvl = user._calcLevel ?? (user.userLevel || 1);
        const userPts = user._calcPoints ?? (parseInt(user.userPoints ?? user.points ?? 0) || 0);
        const userOvr = user._calcOvr ?? calculateUserTeamOvr(user);
        const isMe = userId.trim().toLowerCase() === normalizedMyId;
        const isHard = user.isHardMode === true;
        const rank = user._rank || '-';

        // 순위 메달/배지
        let rankBadgeHtml = '';
        if (rank === 1) {
            rankBadgeHtml = `<span class="rank-badge rank-1"><i class="fa-solid fa-medal"></i> 1</span>`;
        } else if (rank === 2) {
            rankBadgeHtml = `<span class="rank-badge rank-2"><i class="fa-solid fa-medal"></i> 2</span>`;
        } else if (rank === 3) {
            rankBadgeHtml = `<span class="rank-badge rank-3"><i class="fa-solid fa-medal"></i> 3</span>`;
        } else {
            rankBadgeHtml = `<span class="rank-badge rank-normal">${rank}</span>`;
        }

        const meBadge = isMe ? `<span class="friend-my-badge">나</span>` : '';
        const hardBadge = isHard ? `<span class="friend-hard-badge">HARD</span>` : '';

        const rowEl = document.createElement('tr');
        rowEl.className = 'friend-ranking-row' 
            + (isMe ? ' my-account' : '') 
            + (isHard ? ' hard-mode' : '') 
            + (selectedFriendId === userId ? ' active' : '');
        rowEl.id = `friend-row-${userId}`;
        rowEl.onclick = () => selectFriend(userId);

        rowEl.innerHTML = `
            <td class="col-rank">${rankBadgeHtml}</td>
            <td class="col-user">
                <div class="ranking-user-wrapper">
                    <span class="ranking-user-name">${userId}</span>
                    ${meBadge}
                    ${hardBadge}
                </div>
            </td>
            <td class="col-points">
                <span class="ranking-points-num">${userPts.toLocaleString()}</span>
                <span class="ranking-points-unit">FP</span>
            </td>
            <td class="col-level">
                <span class="ranking-level-badge">Lv.${userLvl}</span>
            </td>
            <td class="col-ovr">
                <span class="ranking-ovr-badge">${userOvr}</span>
            </td>
        `;

        listScrollEl.appendChild(rowEl);
    });
}

// 친구 아이디 검색 필터
function searchFriend() {
    const searchInput = document.getElementById('friendSearchInput');
    if (!searchInput) return;

    const keyword = searchInput.value.trim().toLowerCase();

    if (!keyword) {
        renderFriendList(friendUsersList);
        return;
    }

    const filtered = friendUsersList.filter(u => u.id && u.id.toLowerCase().includes(keyword));
    renderFriendList(filtered);
}

// 특정 친구 상세 보기 클릭
function selectFriend(userId) {
    selectedFriendId = userId;

    // 리스트 아이템 active 스타일 갱신 (테이블 행 및 기존 아이템 모두 호환)
    const rows = document.querySelectorAll('.friend-ranking-row, .friend-item');
    rows.forEach(it => it.classList.remove('active'));
    
    const activeRow = document.getElementById(`friend-row-${userId}`) || document.getElementById(`friend-item-${userId}`);
    if (activeRow) {
        activeRow.classList.add('active');
    }

    // 대상 유저 데이터 획득
    const user = friendUsersList.find(u => u.id === userId);
    if (!user) return;

    // UI 보이기
    document.getElementById('friendDetailPlaceholder').style.display = 'none';
    const detailContent = document.getElementById('friendDetailContent');
    detailContent.style.display = 'flex';

    // 1. 프로필 카드 바인딩
    document.getElementById('friendDetailId').innerText = user.id.toUpperCase();
    document.getElementById('friendDetailLevel').innerText = user.userLevel || 1;

    // 기존에 생성된 뱃지가 있다면 제거
    const existingBadge = document.getElementById('friendDetailHardBadge');
    if (existingBadge) {
        existingBadge.remove();
    }
    
    // 어려움 모드인 경우 뱃지 추가
    if (user.isHardMode === true) {
        const summaryUserEl = document.querySelector('.friend-summary-user');
        if (summaryUserEl) {
            const badgeEl = document.createElement('span');
            badgeEl.id = 'friendDetailHardBadge';
            badgeEl.className = 'friend-detail-hard-badge';
            badgeEl.innerHTML = `<i class="fa-solid fa-fire-flame-curved" style="margin-right: 4px;"></i>어려움 모드`;
            summaryUserEl.appendChild(badgeEl);
        }
    }

    // 통산 전적 바인딩
    const career = user.careerStats || { w: 0, d: 0, l: 0, gf: 0, ga: 0 };
    document.getElementById('friendCareerRecord').innerText = `${career.w || 0}승 ${career.d || 0}무 ${career.l || 0}패`;
    const diff = (career.gf || 0) - (career.ga || 0);
    const diffSign = diff > 0 ? `+${diff}` : `${diff}`;
    document.getElementById('friendCareerGoalDiff').innerText = `득실차 ${diffSign} (득 ${career.gf || 0} / 실 ${career.ga || 0})`;

    // 친선전 전적 바인딩
    const friendly = user.friendlyMatchesHistory || { w: 0, d: 0, l: 0, pts: 0 };
    document.getElementById('friendFriendlyRecord').innerText = `${friendly.w || 0}승 ${friendly.d || 0}무 ${friendly.l || 0}패`;
    document.getElementById('friendFriendlyPts').innerText = `승점 ${friendly.pts || 0} pts`;

    // 2. 스쿼드 렌더링 시작
    const formation = user.currentFormation || '4-4-2';
    const squad = user.squadFormation || {};
    const deck = user.playerDeck || {};

    renderFriendSquad(squad, deck, formation, user);

    // 사운드 효과
    if (typeof playClickSound === 'function') {
        try {
            playClickSound();
        } catch (e) {}
    }
}

// 상대방 전용 각성 카드 가공 헬퍼
function getFriendAwakenedCard(cardId, friendDeck) {
    if (typeof CARDS_DATABASE === 'undefined' || !CARDS_DATABASE || !CARDS_DATABASE[cardId]) {
        return null;
    }
    const card = CARDS_DATABASE[cardId];
    
    // 복사본 생성하여 원본 데이터 오염 방지
    const copy = JSON.parse(JSON.stringify(card));
    const deckItem = friendDeck[cardId];
    
    if (deckItem && typeof deckItem.awakening === 'number' && deckItem.awakening > 0) {
        copy.awakening = deckItem.awakening;
        copy.rating += deckItem.awakening;
        if (copy.stats) {
            Object.keys(copy.stats).forEach(stat => {
                copy.stats[stat] += deckItem.awakening;
            });
        }
    } else {
        copy.awakening = 0;
    }
    return copy;
}

// 친구 스쿼드 피치 배치 렌더러
function renderFriendSquad(squad, deck, formationType, user) {
    // 포메이션 라벨 설정
    const labelEl = document.getElementById('friendActiveTactic');
    if (labelEl) {
        if (formationType === '4-4-2') {
            labelEl.innerText = "4-4-2 무전술";
            labelEl.style.color = '#cbd5e1';
            labelEl.style.borderColor = 'rgba(255, 255, 255, 0.2)';
        } else if (formationType === '4-3-3') {
            labelEl.innerText = "4-3-3 빌드업";
            labelEl.style.color = '#ffd700';
            labelEl.style.borderColor = 'rgba(255, 215, 0, 0.4)';
        } else if (formationType === '3-4-3') {
            labelEl.innerText = "3-4-3 스위칭";
            labelEl.style.color = '#00ff87';
            labelEl.style.borderColor = 'rgba(0, 255, 135, 0.4)';
        } else if (formationType === '5-4-1') {
            labelEl.innerText = "5-4-1 역습";
            labelEl.style.color = '#ff3e6c';
            labelEl.style.borderColor = 'rgba(255, 62, 108, 0.4)';
        } else if (formationType === '4-2-3-1') {
            labelEl.innerText = "4-2-3-1 점유율";
            labelEl.style.color = '#00d2fc';
            labelEl.style.borderColor = 'rgba(0, 210, 252, 0.4)';
        }
    }

    let totalOvr = 0;
    const TACTICAL_POSITIONS = ["GK", "LB", "LCB", "RCB", "RB", "LCM", "CM", "RCM", "LW", "ST", "RW"];

    TACTICAL_POSITIONS.forEach(pos => {
        const slotEl = document.getElementById(`friend-slot-${pos}`);
        if (!slotEl) return;

        // 피치 위 동적 포지션 배치 좌표 (js/squad.js에 선언된 FORMATION_COORDINATES 공유)
        if (typeof FORMATION_COORDINATES !== 'undefined' && FORMATION_COORDINATES[formationType]) {
            const coord = FORMATION_COORDINATES[formationType][pos];
            if (coord) {
                slotEl.style.top = coord.top;
                slotEl.style.left = coord.left;
            }
        }

        // 전술별 포지션 뱃지 명칭 변환
        const displayPos = getFormationDisplayPosition(pos, formationType);

        const cardId = squad[pos];
        let cardData = null;

        if (cardId) {
            cardData = getFriendAwakenedCard(cardId, deck);
        }

        if (cardData) {
            totalOvr += cardData.rating;
            const starIndicator = cardData.awakening > 0 ? `<span style="font-size: 0.55rem; color: #ffd700; margin-left: 1px; vertical-align: middle;">★</span>` : '';
            
            // 주장 마크 체크 (만약 상대방 데이터에 squadCaptain이 있다면 표시)
            const isCaptain = (cardId === squad.squadCaptain || cardId === user.squadCaptain);
            const captainClass = isCaptain ? ' captain-active' : '';
            const captainBadge = isCaptain ? '<div class="mini-card-captain-badge">👑</div>' : '';

            slotEl.innerHTML = `
                <div class="mini-player-card active-placed${captainClass}">
                    ${captainBadge}
                    <div class="mini-card-ovr-badge">${cardData.rating}${starIndicator}</div>
                    <div class="mini-card-portrait">
                        <img src="${cardData.image}" alt="${cardData.name}" onerror="this.src='https://placehold.co/80x80/005a3c/ffd700?text=${encodeURIComponent(cardData.name)}'">
                    </div>
                    <div class="mini-card-name">${cardData.name}</div>
                </div>
                <div class="pitch-position-label">${displayPos}</div>
            `;
        } else {
            totalOvr += 70;
            slotEl.innerHTML = `
                <div class="mini-player-card anonymous">
                    <div class="mini-card-ovr-badge">70</div>
                    <div class="mini-card-portrait">
                        <i class="fa-solid fa-user-ninja"></i>
                    </div>
                    <div class="mini-card-name">무명 선수</div>
                </div>
                <div class="pitch-position-label">${displayPos}</div>
            `;
        }
    });

    // 팀 평균 OVR 표기
    const avgOvr = Math.round(totalOvr / 11);
    const teamOvrEl = document.getElementById('friendTeamOvr');
    if (teamOvrEl) {
        teamOvrEl.innerText = avgOvr;
    }
}

// 돋보기 버튼 엔터 핫키 바인딩
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('friendSearchInput');
    if (searchInput) {
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                searchFriend();
            }
        });
    }
});
