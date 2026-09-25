// js/auth.js - 인증 + 클라우드 동기화 + 개발자 도구 + 레벨 보상 모듈

// ==========================================================================
// 14. DEVELOPER CHEAT & DEBUGGING UTILITIES
// ==========================================================================
function developerSetPoints() {
    if (!isDeveloperMode || !currentUser || currentUser.toLowerCase() !== 'ooks12') {
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
// 14-1. DATA SAVER MODE UTILITIES (데이터 절약 모드 토글 & UI 헬퍼)
// ==========================================================================
function toggleDataSaverMode(isChecked) {
    isDataSaverMode = isChecked;
    try {
        localStorage.setItem('fc_star_data_saver', isDataSaverMode ? 'true' : 'false');
    } catch(e) {}
    updateDataSaverUI();
    if (isDataSaverMode) {
        showToast("🌱 데이터 절약 모드가 켜졌습니다. (접속 시에만 클라우드 백업)");
    } else {
        showToast("☁️ 실시간 클라우드 백업 모드로 전환되었습니다.");
        // 실시간 모드로 복귀 시 즉시 1회 백업 실행
        saveUserProgress(true, true);
    }
}

function updateDataSaverUI() {
    const badge = document.getElementById('headerDataSaverBadge');
    const checkbox = document.getElementById('dataSaverCheckbox');
    const desc = document.getElementById('dataSaverStatusDesc');
    
    if (badge) {
        badge.style.display = isDataSaverMode ? 'inline-flex' : 'none';
    }
    if (checkbox) {
        checkbox.checked = isDataSaverMode;
    }
    if (desc) {
        if (isDataSaverMode) {
            desc.innerHTML = '<i class="fa-solid fa-circle-check" style="color: #00ff87; margin-right: 4px;"></i> <strong>절약 모드 켜짐</strong>: 접속(로그인) 시점에만 1회 백업하며, 플레이 중 네트워크 호출을 완전 차단합니다.';
        } else {
            desc.innerHTML = '<i class="fa-solid fa-circle-info" style="color: #94a3b8; margin-right: 4px;"></i> <strong>실시간 백업 켜짐</strong>: 경기, 팩 개봉 등 모든 플레이 데이터가 실시간으로 클라우드에 자동 저장됩니다.';
        }
    }
}

// ==========================================================================
// 15. USER AUTHENTICATION & CLOUD DATA SYNC SERVICE LOGIC
// ==========================================================================

let cloudSaveTimeoutId = null;
let lastCloudUploadTime = 0;
const CLOUD_SAVE_INTERVAL = 60000; // 1 minute (60,000 ms)
let lastUploadedPoints = null;
let lastUploadedDeckJson = null;

// 카드 보유량·각성만 즉시 업로드 기준으로 삼는다. 보관 여부나 스쿼드 배치는 카드 획득/소비가 아니므로 60초 지연 저장을 따른다.
function getCardOwnershipSignature(deck = playerDeck) {
    return JSON.stringify(Object.keys(deck || {}).sort().map(key => {
        const item = deck[key] || {};
        return [key, item.quantity || 1, item.awakening || 0];
    }));
}

// 캐시 접속 후 최초 서버 확인만 재시도한다. 세이브 선택 완료 후에는 재검사하지 않는다.
let pendingInitialCloudSync = null;
let initialCloudSyncTimeoutId = null;

function resetInitialCloudSync() {
    pendingInitialCloudSync = null;
    clearTimeout(initialCloudSyncTimeoutId);
    initialCloudSyncTimeoutId = null;
    clearTimeout(cloudSaveTimeoutId);
    cloudSaveTimeoutId = null;
    isCloudDataSynced = false;
    dbService.cloudSaveUserId = null;
    lastCloudUploadTime = 0;
    lastUploadedPoints = null;
    lastUploadedDeckJson = null;
}

function startInitialCloudSync(userData, password) {
    if (!dbService.isFirebase || userData._serverVerified === true) {
        syncUserDataOnLogin(userData);
        return;
    }
    // 캐시 데이터로 서버 세이브 선택을 판단하거나 기존 로컬 진행을 덮어쓰지 않는다.
    isCloudDataSynced = false;
    dbService.cloudSaveUserId = null;
    pendingInitialCloudSync = { id: currentUser, password, checking: false };
    refreshAllScreens();
    showToast('⚠️ 로컬 데이터로 시작합니다. 서버 확인 전에는 클라우드 저장이 보류됩니다.');
    initialCloudSyncTimeoutId = setTimeout(retryInitialCloudSync, 15000);
}

async function retryInitialCloudSync() {
    const pending = pendingInitialCloudSync;
    if (!pending || pending.checking || currentUser !== pending.id) return;
    clearTimeout(initialCloudSyncTimeoutId);
    initialCloudSyncTimeoutId = null;
    pending.checking = true;
    try {
        // 재확인은 서버 전용이다. 캐시 응답으로 업로드를 해제하지 않는다.
        let serverData;
        try {
            serverData = await dbService.login(pending.id, pending.password, true);
        } catch (loginErr) {
            if (pendingInitialCloudSync !== pending || currentUser !== pending.id) return;
            // 오프라인에서 처음 만든 게스트만 서버에서 계정 부재가 확인된 후 생성한다.
            if (pending.id.startsWith('guest_') && loginErr.message === '존재하지 않는 아이디입니다.') {
                serverData = await dbService.register(pending.id, pending.password);
            } else {
                throw loginErr;
            }
        }
        if (pendingInitialCloudSync !== pending || currentUser !== pending.id) return;
        if (serverData._serverVerified !== true) throw new Error('initial_sync_pending');
        pendingInitialCloudSync = null;
        // 오프라인 중의 진행도 보호하기 위해 서버가 확인되면 사용자가 최초 세이브를 선택한다.
        syncUserDataOnLogin(serverData, false, true);
    } catch (err) {
        if (pendingInitialCloudSync === pending && currentUser === pending.id) {
            initialCloudSyncTimeoutId = setTimeout(retryInitialCloudSync, 15000);
        }
    } finally {
        pending.checking = false;
    }
}

window.addEventListener('online', retryInitialCloudSync);

// ==========================================================================
// 14-2. UNIFIED DATA STORAGE & HYDRATION ENGINE (Firebase 1:1 일치 단일 JSON 통합 스토리지)
// ==========================================================================

// 공통 게임 상태 하이드레이션 (로컬 저장소 로드 및 클라우드 동기화 공통)
function applyUserDataToState(userData) {
    if (!userData || typeof userData !== 'object') return;
    
    // 1. 포인트, 레벨, 하드모드
    if (userData.userPoints !== undefined && userData.userPoints !== null) {
        userPoints = parseInt(userData.userPoints) || 0;
    }
    if (userData.userLevel !== undefined && userData.userLevel !== null) {
        userLevel = parseInt(userData.userLevel) || 1;
    }
    if (userData.isHardMode !== undefined) {
        isHardMode = !!userData.isHardMode;
    }
    
    // 2. 덱 복원 및 CARDS_DATABASE 정규화
    if (userData.playerDeck && typeof userData.playerDeck === 'object') {
        playerDeck = userData.playerDeck;
        if (typeof CARDS_DATABASE !== 'undefined' && CARDS_DATABASE) {
            Object.keys(playerDeck).forEach(key => {
                if (CARDS_DATABASE[key]) {
                    playerDeck[key].card = CARDS_DATABASE[key];
                    playerDeck[key].isStored = playerDeck[key].isStored === true;
                } else {
                    delete playerDeck[key];
                }
            });
        }
    }
    
    // 3. 포메이션 복원
    currentFormation = userData.currentFormation || '4-4-2';
    
    // 윙어/스트라이커 스타일 복원
    const parsedWingers = userData.wingerStyles || { LW: 'dribble', RW: 'sprint' };
    wingerStyles = {
        '4-4-2': { LW: 'dribble', RW: 'sprint' },
        '4-3-3': { LW: 'dribble', RW: 'sprint' },
        '3-4-3': { LW: 'dribble', RW: 'sprint' },
        '5-4-1': { LW: 'dribble', RW: 'sprint' },
        '4-2-3-1': { LW: 'dribble', RW: 'sprint' }
    };
    if (parsedWingers.LW || parsedWingers.RW) {
        Object.keys(wingerStyles).forEach(f => {
            wingerStyles[f] = { LW: parsedWingers.LW || 'dribble', RW: parsedWingers.RW || 'sprint' };
        });
    } else {
        wingerStyles = parsedWingers;
    }

    const parsedStrikers = userData.strikerStyles || { ST: 'targetman' };
    strikerStyles = {
        '4-4-2': { ST: 'targetman' },
        '4-3-3': { ST: 'targetman' },
        '3-4-3': { ST: 'targetman' },
        '5-4-1': { ST: 'targetman' },
        '4-2-3-1': { ST: 'targetman' }
    };
    if (parsedStrikers.ST) {
        Object.keys(strikerStyles).forEach(f => {
            strikerStyles[f] = { ST: parsedStrikers.ST || 'targetman' };
        });
    } else {
        strikerStyles = parsedStrikers;
    }

    squadFormations = userData.squadFormations || {
        '4-4-2': {},
        '4-3-3': {},
        '3-4-3': {},
        '5-4-1': {},
        '4-2-3-1': {}
    };
    if (!userData.squadFormations && userData.squadFormation) {
        squadFormations[currentFormation] = userData.squadFormation;
    }
    ['4-4-2', '4-3-3', '3-4-3', '5-4-1', '4-2-3-1'].forEach(f => {
        if (!squadFormations[f] || typeof squadFormations[f] !== 'object') {
            squadFormations[f] = {};
        }
    });
    squadFormation = squadFormations[currentFormation] || {};
    squadCaptain = userData.squadCaptain || null;
    
    // 등번호 복원
    squadNumbers = userData.squadNumbers || {};
    for (let i = 1; i <= 90; i++) {
        if (!squadNumbers[i]) {
            squadNumbers[i] = { number: i, cardId: null };
        }
    }
    
    // 4. 활성 리그 및 리그별 데이터 복원
    const validLeagues = (typeof LEAGUE_CONFIGS !== 'undefined') ? Object.keys(LEAGUE_CONFIGS) : ['kleague1', 'epl', 'jleague'];
    if (userData.currentLeagueId && validLeagues.includes(userData.currentLeagueId)) {
        currentLeagueId = userData.currentLeagueId;
    } else {
        currentLeagueId = 'kleague1';
    }

    // 리그별 독립 데이터 로컬 캐싱 복원
    if (userData.leagueTeamsEpl && Array.isArray(userData.leagueTeamsEpl) && userData.leagueTeamsEpl.length > 0) {
        try { localStorage.setItem('fc_star_league_teams_epl', JSON.stringify(userData.leagueTeamsEpl)); } catch(e) {}
    }
    if (userData.leagueTeamsJLeague && Array.isArray(userData.leagueTeamsJLeague) && userData.leagueTeamsJLeague.length > 0) {
        try { localStorage.setItem('fc_star_league_teams_jleague', JSON.stringify(userData.leagueTeamsJLeague)); } catch(e) {}
    }
    if (userData.leagueTeamsKLeague && Array.isArray(userData.leagueTeamsKLeague) && userData.leagueTeamsKLeague.length > 0) {
        try { localStorage.setItem('fc_star_league_teams_kleague1', JSON.stringify(userData.leagueTeamsKLeague)); } catch(e) {}
    }
    if (userData.leagueRoundEpl) {
        try { localStorage.setItem('fc_star_league_round_epl', userData.leagueRoundEpl.toString()); } catch(e) {}
    }
    if (userData.leagueRoundJLeague) {
        try { localStorage.setItem('fc_star_league_round_jleague', userData.leagueRoundJLeague.toString()); } catch(e) {}
    }
    if (userData.leagueRoundKLeague) {
        try { localStorage.setItem('fc_star_league_round_kleague1', userData.leagueRoundKLeague.toString()); } catch(e) {}
    }
    if (userData.leaguePlayerStatsEpl) {
        try { localStorage.setItem('fc_star_league_stats_epl', JSON.stringify(userData.leaguePlayerStatsEpl)); } catch(e) {}
    }
    if (userData.leaguePlayerStatsJLeague) {
        try { localStorage.setItem('fc_star_league_stats_jleague', JSON.stringify(userData.leaguePlayerStatsJLeague)); } catch(e) {}
    }
    if (userData.leaguePlayerStatsKLeague) {
        try { localStorage.setItem('fc_star_league_stats_kleague1', JSON.stringify(userData.leaguePlayerStatsKLeague)); } catch(e) {}
    }

    // 현재 활성 리그에 맞는 팀/라운드 데이터 선택 로드
    let targetTeams = (currentLeagueId === 'epl') ? userData.leagueTeamsEpl : ((currentLeagueId === 'jleague') ? userData.leagueTeamsJLeague : userData.leagueTeamsKLeague);
    if (!targetTeams || !Array.isArray(targetTeams) || targetTeams.length === 0) {
        targetTeams = userData.leagueTeams;
    }

    let targetRound = (currentLeagueId === 'epl') ? userData.leagueRoundEpl : ((currentLeagueId === 'jleague') ? userData.leagueRoundJLeague : userData.leagueRoundKLeague);
    if (!targetRound) {
        targetRound = userData.leagueRound || 1;
    }

    if (targetTeams && Array.isArray(targetTeams) && targetTeams.length > 0) {
        leagueTeams = targetTeams;
        leagueRound = parseInt(targetRound) || 1;
        if (typeof checkAndMigrateLeagueTeams === 'function') {
            checkAndMigrateLeagueTeams();
        }
    } else {
        if (typeof resetLeagueSeasonState === 'function') {
            resetLeagueSeasonState();
        }
    }

    // 5. 퀴즈 및 일일 진행
    quizOffset = userData.quizOffset || 0;
    quizLastDate = userData.quizLastDate || "";
    quizQueue = userData.quizQueue || [];
    quizSolvedCount = userData.quizSolvedCount || 0;
    quizCurrentIndex = userData.quizCurrentIndex || 0;
    matchLastDate = userData.matchLastDate || "";
    matchTodayCount = userData.matchTodayCount || 0;
    lastLoginDate = userData.lastLoginDate || "";

    // 6. 리그 연도, 명예의 전당, 커리어 스탯
    leagueYear = userData.leagueYear || 2026;
    hallOfFame = userData.hallOfFame || [];
    leaguePlayerStats = userData.leaguePlayerStats || {};
    if (Object.keys(leaguePlayerStats).length === 0 && typeof initLeaguePlayerStats === 'function') {
        initLeaguePlayerStats();
    }
    careerStats = userData.careerStats || { w: 0, d: 0, l: 0, gf: 0, ga: 0, playerGoals: {} };
    careerStatsHard = userData.careerStatsHard || { w: 0, d: 0, l: 0, gf: 0, ga: 0, playerGoals: {} };
    userPvpStats = userData.pvpStats || { w: 0, d: 0, l: 0 };
    userPvpOpponentStats = userData.pvpOpponentStats || {};

    // 7. 업적 및 연승
    userAchievements = {
        double: { unlocked: false, rewarded: false },
        treble: { unlocked: false, rewarded: false },
        invincible: { unlocked: false, rewarded: false },
        threepeat: { unlocked: false, rewarded: false },
        fivepeat: { unlocked: false, rewarded: false },
        collector: { unlocked: false, rewarded: false },
        worldclass: { unlocked: false, rewarded: false },
        hardworldclass: { unlocked: false, rewarded: false },
        streak10: { unlocked: false, rewarded: false },
        streak20: { unlocked: false, rewarded: false },
        streak30: { unlocked: false, rewarded: false },
        goals300: { unlocked: false, rewarded: false },
        goals500: { unlocked: false, rewarded: false },
        goals1000: { unlocked: false, rewarded: false },
        wins1000: { unlocked: false, rewarded: false },
        wins2000: { unlocked: false, rewarded: false },
        ...(userData.userAchievements || {})
    };
    consecutiveLeagueTitles = userData.consecutiveLeagueTitles || 0;
    currentWinStreak = userData.currentWinStreak || 0;
    maxWinStreak = userData.maxWinStreak || 0;

    // 8. 국대 모드
    if (userData.nationalModeState && typeof initNationalMode === 'function') {
        nationalModeState = typeof deserializeNationalModeStateFromCloud === 'function' ? deserializeNationalModeStateFromCloud(userData.nationalModeState) : userData.nationalModeState;
        if (typeof nationalDevMode !== 'undefined' && nationalDevMode && typeof nationalDevState !== 'undefined') nationalDevState = nationalModeState;
        try { localStorage.setItem('fc_star_national_mode_state', JSON.stringify(nationalModeState)); } catch(e) {}
    }
    if (userData.nationalSquadPresets && typeof nationalSquadPresets !== 'undefined') {
        nationalSquadPresets = userData.nationalSquadPresets;
        try { localStorage.setItem('fc_star_national_squad_presets', JSON.stringify(nationalSquadPresets)); } catch(e) {}
        const activeNationalState = typeof getNationalModeState === 'function' ? getNationalModeState() : null;
        if (activeNationalState && activeNationalState.selectedNationId && typeof applyNationalSquadPreset === 'function') {
            applyNationalSquadPreset(activeNationalState, activeNationalState.selectedNationId);
        }
    }
    if (userData.nationalNationSelections && typeof nationalNationSelections !== 'undefined') {
        nationalNationSelections = userData.nationalNationSelections;
        try { localStorage.setItem('fc_star_national_nation_selections', JSON.stringify(nationalNationSelections)); } catch(e) {}
        const activeNationalState = typeof getNationalModeState === 'function' ? getNationalModeState() : null;
        if (activeNationalState && typeof applySavedNationalNation === 'function') applySavedNationalNation(activeNationalState);
    }
    if (typeof syncNationalModeYear === 'function') {
        syncNationalModeYear(false);
    }

    // 9. 컵 & 아챔 상태
    if (userData.cupStateEpl) {
        try { localStorage.setItem('fc_star_cup_state_epl', JSON.stringify(userData.cupStateEpl)); } catch(e) {}
    }
    if (userData.cupStateJLeague) {
        try { localStorage.setItem('fc_star_cup_state_jleague', JSON.stringify(userData.cupStateJLeague)); } catch(e) {}
    }
    if (userData.cupStateKLeague) {
        try {
            localStorage.setItem('fc_star_cup_state_kleague1', JSON.stringify(userData.cupStateKLeague));
            localStorage.setItem('fc_star_cup_state', JSON.stringify(userData.cupStateKLeague));
        } catch(e) {}
    } else if (userData.cupState) {
        try {
            localStorage.setItem('fc_star_cup_state_kleague1', JSON.stringify(userData.cupState));
            localStorage.setItem('fc_star_cup_state', JSON.stringify(userData.cupState));
        } catch(e) {}
    }
    if (typeof initCup === 'function') initCup();

    if (userData.aclStateEpl) {
        try { localStorage.setItem('fc_star_acl_state_epl', JSON.stringify(userData.aclStateEpl)); } catch(e) {}
    }
    if (userData.aclStateJLeague) {
        try { localStorage.setItem('fc_star_acl_state_jleague', JSON.stringify(userData.aclStateJLeague)); } catch(e) {}
    }
    if (userData.aclStateKLeague) {
        try {
            localStorage.setItem('fc_star_acl_state_kleague1', JSON.stringify(userData.aclStateKLeague));
            localStorage.setItem('fc_star_acl_state', JSON.stringify(userData.aclStateKLeague));
        } catch(e) {}
    } else if (userData.aclState) {
        try {
            localStorage.setItem('fc_star_acl_state_kleague1', JSON.stringify(userData.aclState));
            localStorage.setItem('fc_star_acl_state', JSON.stringify(userData.aclState));
        } catch(e) {}
    }
    if (typeof initAcl === 'function') initAcl();

    // 10. 도전모드
    if (userData.challengeSeason !== undefined && !isNaN(userData.challengeSeason)) challengeSeason = parseInt(userData.challengeSeason) || 1;
    if (userData.challengeStage !== undefined && !isNaN(userData.challengeStage)) challengeStage = parseInt(userData.challengeStage) || 1;
    if (userData.challengeBossOvr !== undefined && !isNaN(userData.challengeBossOvr)) challengeBossOvr = parseInt(userData.challengeBossOvr) || 98;
    if (userData.challengeLastDate) challengeLastDate = userData.challengeLastDate;
    if (userData.challengeDailyFreeUsed !== undefined) challengeDailyFreeUsed = !!userData.challengeDailyFreeUsed;
    if (userData.challengeDailyRetryUsed !== undefined) challengeDailyRetryUsed = !!userData.challengeDailyRetryUsed;
    if (userData.challengeHistory) challengeHistory = userData.challengeHistory;
    if (userData.challengeSeasonTeams) challengeSeasonTeams = userData.challengeSeasonTeams;
    if (typeof initChallengeState === 'function') initChallengeState();

    // 11. 친선 경기
    friendlyMatchesHistory = userData.friendlyMatchesHistory || { w: 0, d: 0, l: 0, pts: 0 };
    friendlyCurrentOpponentIndex = userData.friendlyCurrentOpponentIndex || 0;
    friendlyMatchesToday = userData.friendlyMatchesToday || 0;
    friendlyMatchLastDate = userData.friendlyMatchLastDate || "";
    if (typeof initFriendlyMatchState === 'function') initFriendlyMatchState();

    // 12. 절약 모드
    if (userData.isDataSaverMode !== undefined) {
        isDataSaverMode = !!userData.isDataSaverMode;
        try { localStorage.setItem('fc_star_data_saver', isDataSaverMode ? 'true' : 'false'); } catch(e) {}
    }
}

// 전체 유저 진행 데이터 수집 (Firestore 및 로컬 통합 스토리지 공통 스키마 규격)
function collectCurrentUserProgressData(targetUserId) {
    const rawId = (targetUserId || currentUser || localStorage.getItem('fc_star_current_user') || "guest").trim();
    const myId = rawId.toLowerCase();
    
    // 현재 계정의 로컬 통합 문서 캐시 조회 (비활성 리그/모드 데이터의 안전한 소유권 격리 유지)
    let cachedUserDoc = null;
    try {
        const uDocStr = localStorage.getItem(`fc_star_user_${myId}`);
        if (uDocStr) cachedUserDoc = JSON.parse(uDocStr);
    } catch(e) {}

    return {
        id: myId,
        userPoints: userPoints,
        userLevel: userLevel,
        playerDeck: (() => {
            const minimalDeck = {};
            Object.keys(playerDeck || {}).forEach(key => {
                if (playerDeck[key]) {
                    minimalDeck[key] = {
                        quantity: playerDeck[key].quantity || 1,
                        awakening: playerDeck[key].awakening || 0,
                        condition: typeof playerDeck[key].condition === 'number' ? playerDeck[key].condition : 0,
                        conditionDate: playerDeck[key].conditionDate || "",
                        isStored: playerDeck[key].isStored === true
                    };
                }
            });
            return minimalDeck;
        })(),
        squadFormation: typeof squadFormation !== 'undefined' ? squadFormation : {},
        squadFormations: typeof squadFormations !== 'undefined' ? squadFormations : { '4-4-2': {}, '4-3-3': {}, '3-4-3': {}, '5-4-1': {}, '4-2-3-1': {} },
        currentFormation: typeof currentFormation !== 'undefined' ? currentFormation : '4-4-2',
        currentLeagueId: typeof currentLeagueId !== 'undefined' ? currentLeagueId : 'kleague1',
        squadNumbers: typeof squadNumbers !== 'undefined' ? squadNumbers : {},
        squadCaptain: typeof squadCaptain !== 'undefined' ? squadCaptain : null,
        leagueRound: typeof leagueRound !== 'undefined' ? leagueRound : 1,
        leagueTeams: typeof leagueTeams !== 'undefined' ? leagueTeams : [],
        leaguePlayerStats: typeof leaguePlayerStats !== 'undefined' ? leaguePlayerStats : {},
        leagueTeamsEpl: (() => {
            if (typeof currentLeagueId !== 'undefined' && currentLeagueId === 'epl' && typeof leagueTeams !== 'undefined') return leagueTeams;
            if (cachedUserDoc && cachedUserDoc.leagueTeamsEpl) return cachedUserDoc.leagueTeamsEpl;
            return null;
        })(),
        leagueTeamsJLeague: (() => {
            if (typeof currentLeagueId !== 'undefined' && currentLeagueId === 'jleague' && typeof leagueTeams !== 'undefined') return leagueTeams;
            if (cachedUserDoc && cachedUserDoc.leagueTeamsJLeague) return cachedUserDoc.leagueTeamsJLeague;
            return null;
        })(),
        leagueTeamsKLeague: (() => {
            if (typeof currentLeagueId !== 'undefined' && currentLeagueId === 'kleague1' && typeof leagueTeams !== 'undefined') return leagueTeams;
            if (cachedUserDoc && cachedUserDoc.leagueTeamsKLeague) return cachedUserDoc.leagueTeamsKLeague;
            return null;
        })(),
        leagueRoundEpl: (() => {
            if (typeof currentLeagueId !== 'undefined' && currentLeagueId === 'epl' && typeof leagueRound !== 'undefined') return leagueRound;
            if (cachedUserDoc && cachedUserDoc.leagueRoundEpl) return parseInt(cachedUserDoc.leagueRoundEpl) || 1;
            return 1;
        })(),
        leagueRoundJLeague: (() => {
            if (typeof currentLeagueId !== 'undefined' && currentLeagueId === 'jleague' && typeof leagueRound !== 'undefined') return leagueRound;
            if (cachedUserDoc && cachedUserDoc.leagueRoundJLeague) return parseInt(cachedUserDoc.leagueRoundJLeague) || 1;
            return 1;
        })(),
        leagueRoundKLeague: (() => {
            if (typeof currentLeagueId !== 'undefined' && currentLeagueId === 'kleague1' && typeof leagueRound !== 'undefined') return leagueRound;
            if (cachedUserDoc && cachedUserDoc.leagueRoundKLeague) return parseInt(cachedUserDoc.leagueRoundKLeague) || 1;
            return 1;
        })(),
        leaguePlayerStatsEpl: (() => {
            if (typeof currentLeagueId !== 'undefined' && currentLeagueId === 'epl' && typeof leaguePlayerStats !== 'undefined') return leaguePlayerStats;
            if (cachedUserDoc && cachedUserDoc.leaguePlayerStatsEpl) return cachedUserDoc.leaguePlayerStatsEpl;
            return {};
        })(),
        leaguePlayerStatsJLeague: (() => {
            if (typeof currentLeagueId !== 'undefined' && currentLeagueId === 'jleague' && typeof leaguePlayerStats !== 'undefined') return leaguePlayerStats;
            if (cachedUserDoc && cachedUserDoc.leaguePlayerStatsJLeague) return cachedUserDoc.leaguePlayerStatsJLeague;
            return {};
        })(),
        leaguePlayerStatsKLeague: (() => {
            if (typeof currentLeagueId !== 'undefined' && currentLeagueId === 'kleague1' && typeof leaguePlayerStats !== 'undefined') return leaguePlayerStats;
            if (cachedUserDoc && cachedUserDoc.leaguePlayerStatsKLeague) return cachedUserDoc.leaguePlayerStatsKLeague;
            return {};
        })(),
        quizOffset: typeof quizOffset !== 'undefined' ? quizOffset : 0,
        quizLastDate: typeof quizLastDate !== 'undefined' ? quizLastDate : "",
        quizQueue: typeof quizQueue !== 'undefined' ? quizQueue : [],
        quizSolvedCount: typeof quizSolvedCount !== 'undefined' ? quizSolvedCount : 0,
        quizCurrentIndex: typeof quizCurrentIndex !== 'undefined' ? quizCurrentIndex : 0,
        matchLastDate: typeof matchLastDate !== 'undefined' ? matchLastDate : "",
        matchTodayCount: typeof matchTodayCount !== 'undefined' ? matchTodayCount : 0,
        lastLoginDate: typeof lastLoginDate !== 'undefined' ? lastLoginDate : "",
        leagueYear: typeof leagueYear !== 'undefined' ? leagueYear : 2026,
        hallOfFame: typeof hallOfFame !== 'undefined' ? hallOfFame : [],
        careerStats: typeof careerStats !== 'undefined' ? careerStats : { w: 0, d: 0, l: 0, gf: 0, ga: 0, playerGoals: {} },
        careerStatsHard: typeof careerStatsHard !== 'undefined' ? careerStatsHard : { w: 0, d: 0, l: 0, gf: 0, ga: 0, playerGoals: {} },
        pvpStats: typeof userPvpStats !== 'undefined' ? userPvpStats : { w: 0, d: 0, l: 0 },
        pvpOpponentStats: typeof userPvpOpponentStats !== 'undefined' ? userPvpOpponentStats : {},
        cupState: typeof cupState !== 'undefined' ? cupState : null,
        cupStateEpl: (() => {
            if (typeof currentLeagueId !== 'undefined' && currentLeagueId === 'epl' && typeof cupState !== 'undefined') return cupState;
            if (cachedUserDoc && cachedUserDoc.cupStateEpl) return cachedUserDoc.cupStateEpl;
            return null;
        })(),
        cupStateJLeague: (() => {
            if (typeof currentLeagueId !== 'undefined' && currentLeagueId === 'jleague' && typeof cupState !== 'undefined') return cupState;
            if (cachedUserDoc && cachedUserDoc.cupStateJLeague) return cachedUserDoc.cupStateJLeague;
            return null;
        })(),
        cupStateKLeague: (() => {
            if (typeof currentLeagueId !== 'undefined' && currentLeagueId === 'kleague1' && typeof cupState !== 'undefined') return cupState;
            if (cachedUserDoc && cachedUserDoc.cupStateKLeague) return cachedUserDoc.cupStateKLeague;
            if (cachedUserDoc && cachedUserDoc.cupState) return cachedUserDoc.cupState;
            return null;
        })(),
        aclState: typeof aclState !== 'undefined' ? aclState : null,
        aclStateEpl: (() => {
            if (typeof currentLeagueId !== 'undefined' && currentLeagueId === 'epl' && typeof aclState !== 'undefined') return aclState;
            if (cachedUserDoc && cachedUserDoc.aclStateEpl) return cachedUserDoc.aclStateEpl;
            return null;
        })(),
        aclStateJLeague: (() => {
            if (typeof currentLeagueId !== 'undefined' && currentLeagueId === 'jleague' && typeof aclState !== 'undefined') return aclState;
            if (cachedUserDoc && cachedUserDoc.aclStateJLeague) return cachedUserDoc.aclStateJLeague;
            return null;
        })(),
        aclStateKLeague: (() => {
            if (typeof currentLeagueId !== 'undefined' && currentLeagueId === 'kleague1' && typeof aclState !== 'undefined') return aclState;
            if (cachedUserDoc && cachedUserDoc.aclStateKLeague) return cachedUserDoc.aclStateKLeague;
            if (cachedUserDoc && cachedUserDoc.aclState) return cachedUserDoc.aclState;
            return null;
        })(),
        isHardMode: typeof isHardMode !== 'undefined' ? !!isHardMode : false,
        userAchievements: typeof userAchievements !== 'undefined' ? userAchievements : {},
        consecutiveLeagueTitles: typeof consecutiveLeagueTitles !== 'undefined' ? consecutiveLeagueTitles : 0,
        currentWinStreak: typeof currentWinStreak !== 'undefined' ? currentWinStreak : 0,
        maxWinStreak: typeof maxWinStreak !== 'undefined' ? maxWinStreak : 0,
        nationalModeState: typeof nationalModeState !== 'undefined' && typeof serializeNationalModeStateForCloud === 'function' ? serializeNationalModeStateForCloud(nationalModeState) : (typeof nationalModeState !== 'undefined' ? nationalModeState : null),
        nationalSquadPresets: typeof nationalSquadPresets !== 'undefined' ? nationalSquadPresets : {},
        nationalNationSelections: typeof nationalNationSelections !== 'undefined' ? nationalNationSelections : {},
        wingerStyles: typeof wingerStyles !== 'undefined' ? wingerStyles : { '4-4-2': { LW: 'dribble', RW: 'sprint' }, '4-3-3': { LW: 'dribble', RW: 'sprint' }, '3-4-3': { LW: 'dribble', RW: 'sprint' }, '5-4-1': { LW: 'dribble', RW: 'sprint' }, '4-2-3-1': { LW: 'dribble', RW: 'sprint' } },
        strikerStyles: typeof strikerStyles !== 'undefined' ? strikerStyles : { '4-4-2': { ST: 'targetman' }, '4-3-3': { ST: 'targetman' }, '3-4-3': { ST: 'targetman' }, '5-4-1': { ST: 'targetman' }, '4-2-3-1': { ST: 'targetman' } },
        
        // 도전모드(Challenge Mode) 동기화 필드 - 인메모리 및 해당 계정 캐시 기준
        challengeSeason: (typeof challengeSeason === 'number' && challengeSeason >= 1) ? challengeSeason : (cachedUserDoc && cachedUserDoc.challengeSeason ? parseInt(cachedUserDoc.challengeSeason) : 1),
        challengeStage: (typeof challengeStage === 'number' && challengeStage >= 1) ? challengeStage : (cachedUserDoc && cachedUserDoc.challengeStage ? parseInt(cachedUserDoc.challengeStage) : 1),
        challengeBossOvr: typeof challengeBossOvr !== 'undefined' ? challengeBossOvr : (cachedUserDoc && cachedUserDoc.challengeBossOvr ? parseInt(cachedUserDoc.challengeBossOvr) : 98),
        challengeLastDate: typeof challengeLastDate !== 'undefined' ? challengeLastDate : (cachedUserDoc && cachedUserDoc.challengeLastDate ? cachedUserDoc.challengeLastDate : ""),
        challengeDailyFreeUsed: typeof challengeDailyFreeUsed !== 'undefined' ? challengeDailyFreeUsed : (cachedUserDoc && cachedUserDoc.challengeDailyFreeUsed !== undefined ? !!cachedUserDoc.challengeDailyFreeUsed : false),
        challengeDailyRetryUsed: typeof challengeDailyRetryUsed !== 'undefined' ? challengeDailyRetryUsed : (cachedUserDoc && cachedUserDoc.challengeDailyRetryUsed !== undefined ? !!cachedUserDoc.challengeDailyRetryUsed : false),
        challengeHistory: typeof challengeHistory !== 'undefined' ? challengeHistory : (cachedUserDoc && cachedUserDoc.challengeHistory ? cachedUserDoc.challengeHistory : { w: 0, d: 0, l: 0, totalGames: 0 }),
        challengeSeasonTeams: (typeof challengeSeasonTeams !== 'undefined' && Array.isArray(challengeSeasonTeams)) ? challengeSeasonTeams : (cachedUserDoc && cachedUserDoc.challengeSeasonTeams ? cachedUserDoc.challengeSeasonTeams : null),
        
        // 친선경기 ID별 실시간 클라우드 전적 연동 필드
        friendlyMatchesHistory: typeof friendlyMatchesHistory !== 'undefined' ? friendlyMatchesHistory : (cachedUserDoc && cachedUserDoc.friendlyMatchesHistory ? cachedUserDoc.friendlyMatchesHistory : { w: 0, d: 0, l: 0, pts: 0 }),
        friendlyCurrentOpponentIndex: typeof friendlyCurrentOpponentIndex !== 'undefined' ? friendlyCurrentOpponentIndex : (cachedUserDoc && cachedUserDoc.friendlyCurrentOpponentIndex ? cachedUserDoc.friendlyCurrentOpponentIndex : 0),
        friendlyMatchesToday: typeof friendlyMatchesToday !== 'undefined' ? friendlyMatchesToday : (cachedUserDoc && cachedUserDoc.friendlyMatchesToday ? cachedUserDoc.friendlyMatchesToday : 0),
        friendlyMatchLastDate: typeof friendlyMatchLastDate !== 'undefined' ? friendlyMatchLastDate : (cachedUserDoc && cachedUserDoc.friendlyMatchLastDate ? cachedUserDoc.friendlyMatchLastDate : ""),
        friendlySeasonStartDate: localStorage.getItem(`fc_star_friendly_season_start_date_${myId}`) || (cachedUserDoc && cachedUserDoc.friendlySeasonStartDate ? cachedUserDoc.friendlySeasonStartDate : new Date().toISOString()),
        lastSyncedUpdatedAt: typeof window !== 'undefined' ? window.lastSyncedUpdatedAt : "",
        
        // 🌱 데이터 절약 모드 설정 동기화
        isDataSaverMode: typeof isDataSaverMode !== 'undefined' ? isDataSaverMode : (cachedUserDoc && cachedUserDoc.isDataSaverMode !== undefined ? !!cachedUserDoc.isDataSaverMode : false),
        
        // 동기화 조율용 최종 수정 타임스탬프 (해당 유저 통합 문서 시점 또는 현재 시간)
        localLastUpdated: (cachedUserDoc && cachedUserDoc.localLastUpdated) ? cachedUserDoc.localLastUpdated : Date.now()
    };
}

// 레거시 개별 localStorage 키들로부터 진행 데이터를 직접 구성하는 헬퍼 함수
function buildLegacyProgressFromLocalStorage(targetUserId) {
    const rawId = (targetUserId || currentUser || localStorage.getItem('fc_star_current_user') || "guest").trim();
    const myId = rawId.toLowerCase();
    
    let deck = {};
    try {
        const d = localStorage.getItem('fc_star_player_deck');
        if (d) deck = JSON.parse(d);
    } catch(e) {}

    let squadForms = { '4-4-2': {}, '4-3-3': {}, '3-4-3': {}, '5-4-1': {}, '4-2-3-1': {} };
    try {
        const sf = localStorage.getItem('fc_star_squad_formations');
        if (sf) squadForms = JSON.parse(sf);
    } catch(e) {}

    let singleSquad = {};
    try {
        const sq = localStorage.getItem('fc_star_squad_formation');
        if (sq) singleSquad = JSON.parse(sq);
    } catch(e) {}

    let curFormation = localStorage.getItem('fc_star_current_formation') || '4-4-2';
    let curLeague = localStorage.getItem('fc_star_current_league') || 'kleague1';

    let legTeams = [];
    try {
        const lt = localStorage.getItem(`fc_star_league_teams_${curLeague}`) || localStorage.getItem('fc_star_league_teams');
        if (lt) legTeams = JSON.parse(lt);
    } catch(e) {}

    let legRound = parseInt(localStorage.getItem(`fc_star_league_round_${curLeague}`) || localStorage.getItem('fc_star_league_round') || '1') || 1;

    let legStats = {};
    try {
        const ls = localStorage.getItem(`fc_star_league_stats_${curLeague}`) || localStorage.getItem('fc_star_league_stats');
        if (ls) legStats = JSON.parse(ls);
    } catch(e) {}

    let qQueue = [];
    try {
        const qq = localStorage.getItem('fc_star_quiz_queue');
        if (qq) qQueue = JSON.parse(qq);
    } catch(e) {}

    let hof = [];
    try {
        const h = localStorage.getItem('fc_star_hall_of_fame');
        if (h) hof = JSON.parse(h);
    } catch(e) {}

    let cStats = { w: 0, d: 0, l: 0, gf: 0, ga: 0, playerGoals: {} };
    try {
        const cs = localStorage.getItem('fc_star_career_stats');
        if (cs) cStats = JSON.parse(cs);
    } catch(e) {}

    let cStatsHard = { w: 0, d: 0, l: 0, gf: 0, ga: 0, playerGoals: {} };
    try {
        const csh = localStorage.getItem('fc_star_career_stats_hard');
        if (csh) cStatsHard = JSON.parse(csh);
    } catch(e) {}

    let sqNumbers = {};
    try {
        const sn = localStorage.getItem('fc_star_squad_numbers');
        if (sn) sqNumbers = JSON.parse(sn);
    } catch(e) {}

    let uAchievements = {};
    try {
        const ua = localStorage.getItem('fc_star_user_achievements');
        if (ua) uAchievements = JSON.parse(ua);
    } catch(e) {}

    let wStyles = { '4-4-2': { LW: 'dribble', RW: 'sprint' }, '4-3-3': { LW: 'dribble', RW: 'sprint' }, '3-4-3': { LW: 'dribble', RW: 'sprint' }, '5-4-1': { LW: 'dribble', RW: 'sprint' }, '4-2-3-1': { LW: 'dribble', RW: 'sprint' } };
    try {
        const ws = localStorage.getItem('fc_star_winger_styles');
        if (ws) wStyles = JSON.parse(ws);
    } catch(e) {}

    let sStyles = { '4-4-2': { ST: 'targetman' }, '4-3-3': { ST: 'targetman' }, '3-4-3': { ST: 'targetman' }, '5-4-1': { ST: 'targetman' }, '4-2-3-1': { ST: 'targetman' } };
    try {
        const ss = localStorage.getItem('fc_star_striker_styles');
        if (ss) sStyles = JSON.parse(ss);
    } catch(e) {}

    let natState = null;
    try {
        const ns = localStorage.getItem('fc_star_national_mode_state');
        if (ns) natState = JSON.parse(ns);
    } catch(e) {}

    let natPresets = {};
    try {
        const np = localStorage.getItem('fc_star_national_squad_presets');
        if (np) natPresets = JSON.parse(np);
    } catch(e) {}

    let natSelections = {};
    try {
        const nsel = localStorage.getItem('fc_star_national_nation_selections');
        if (nsel) natSelections = JSON.parse(nsel);
    } catch(e) {}

    let pvpW = parseInt(localStorage.getItem('fc_star_pvp_w') || '0') || 0;
    let pvpD = parseInt(localStorage.getItem('fc_star_pvp_d') || '0') || 0;
    let pvpL = parseInt(localStorage.getItem('fc_star_pvp_l') || '0') || 0;
    let pvpOpp = {};
    try {
        const po = localStorage.getItem('fc_star_pvp_opp_stats');
        if (po) pvpOpp = JSON.parse(po);
    } catch(e) {}

    let frHistory = { w: 0, d: 0, l: 0, pts: 0 };
    try {
        const fh = localStorage.getItem(`fc_star_friendly_history_${myId}`);
        if (fh) frHistory = JSON.parse(fh);
    } catch(e) {}

    let chalHistory = { w: 0, d: 0, l: 0, totalGames: 0 };
    try {
        const ch = localStorage.getItem(`fc_star_challenge_history_${myId}`) || localStorage.getItem('fc_star_challenge_history');
        if (ch) chalHistory = JSON.parse(ch);
    } catch(e) {}

    let chalTeams = null;
    try {
        const ct = localStorage.getItem('fc_star_challenge_season_teams');
        if (ct) chalTeams = JSON.parse(ct);
    } catch(e) {}

    return {
        id: myId,
        userPoints: parseInt(localStorage.getItem('fc_star_user_points') || '0') || 0,
        userLevel: parseInt(localStorage.getItem('fc_star_user_level') || '1') || 1,
        playerDeck: deck,
        squadFormation: singleSquad,
        squadFormations: squadForms,
        currentFormation: curFormation,
        currentLeagueId: curLeague,
        squadNumbers: sqNumbers,
        squadCaptain: localStorage.getItem('fc_star_squad_captain') || null,
        leagueRound: legRound,
        leagueTeams: legTeams,
        leaguePlayerStats: legStats,
        leagueTeamsEpl: (() => { try { return JSON.parse(localStorage.getItem('fc_star_league_teams_epl')); } catch(e) { return null; } })(),
        leagueTeamsJLeague: (() => { try { return JSON.parse(localStorage.getItem('fc_star_league_teams_jleague')); } catch(e) { return null; } })(),
        leagueTeamsKLeague: (() => { try { return JSON.parse(localStorage.getItem('fc_star_league_teams_kleague1') || localStorage.getItem('fc_star_league_teams')); } catch(e) { return null; } })(),
        leagueRoundEpl: parseInt(localStorage.getItem('fc_star_league_round_epl') || '1') || 1,
        leagueRoundJLeague: parseInt(localStorage.getItem('fc_star_league_round_jleague') || '1') || 1,
        leagueRoundKLeague: parseInt(localStorage.getItem('fc_star_league_round_kleague1') || '1') || 1,
        leaguePlayerStatsEpl: (() => { try { return JSON.parse(localStorage.getItem('fc_star_league_stats_epl')) || {}; } catch(e) { return {}; } })(),
        leaguePlayerStatsJLeague: (() => { try { return JSON.parse(localStorage.getItem('fc_star_league_stats_jleague')) || {}; } catch(e) { return {}; } })(),
        leaguePlayerStatsKLeague: (() => { try { return JSON.parse(localStorage.getItem('fc_star_league_stats_kleague1')) || {}; } catch(e) { return {}; } })(),
        quizOffset: parseInt(localStorage.getItem('fc_star_quiz_offset') || '0') || 0,
        quizLastDate: localStorage.getItem('fc_star_quiz_last_date') || "",
        quizQueue: qQueue,
        quizSolvedCount: parseInt(localStorage.getItem('fc_star_quiz_solved_count') || '0') || 0,
        quizCurrentIndex: parseInt(localStorage.getItem('fc_star_quiz_current_index') || '0') || 0,
        matchLastDate: localStorage.getItem('fc_star_match_last_date') || "",
        matchTodayCount: parseInt(localStorage.getItem('fc_star_match_today_count') || '0') || 0,
        lastLoginDate: localStorage.getItem('fc_star_last_login_date') || "",
        leagueYear: parseInt(localStorage.getItem('fc_star_league_year') || '2026') || 2026,
        hallOfFame: hof,
        careerStats: cStats,
        careerStatsHard: cStatsHard,
        pvpStats: { w: pvpW, d: pvpD, l: pvpL },
        pvpOpponentStats: pvpOpp,
        cupState: (() => { try { return JSON.parse(localStorage.getItem('fc_star_cup_state')); } catch(e) { return null; } })(),
        cupStateEpl: (() => { try { return JSON.parse(localStorage.getItem('fc_star_cup_state_epl')); } catch(e) { return null; } })(),
        cupStateJLeague: (() => { try { return JSON.parse(localStorage.getItem('fc_star_cup_state_jleague')); } catch(e) { return null; } })(),
        cupStateKLeague: (() => { try { return JSON.parse(localStorage.getItem('fc_star_cup_state_kleague1') || localStorage.getItem('fc_star_cup_state')); } catch(e) { return null; } })(),
        aclState: (() => { try { return JSON.parse(localStorage.getItem('fc_star_acl_state')); } catch(e) { return null; } })(),
        aclStateEpl: (() => { try { return JSON.parse(localStorage.getItem('fc_star_acl_state_epl')); } catch(e) { return null; } })(),
        aclStateJLeague: (() => { try { return JSON.parse(localStorage.getItem('fc_star_acl_state_jleague')); } catch(e) { return null; } })(),
        aclStateKLeague: (() => { try { return JSON.parse(localStorage.getItem('fc_star_acl_state_kleague1') || localStorage.getItem('fc_star_acl_state')); } catch(e) { return null; } })(),
        isHardMode: localStorage.getItem('fc_star_is_hard_mode') === 'true',
        userAchievements: uAchievements,
        consecutiveLeagueTitles: parseInt(localStorage.getItem('fc_star_consecutive_titles') || '0') || 0,
        currentWinStreak: parseInt(localStorage.getItem('fc_star_current_win_streak') || '0') || 0,
        maxWinStreak: parseInt(localStorage.getItem('fc_star_max_win_streak') || '0') || 0,
        nationalModeState: natState,
        nationalSquadPresets: natPresets,
        nationalNationSelections: natSelections,
        wingerStyles: wStyles,
        strikerStyles: sStyles,
        challengeSeason: parseInt(localStorage.getItem(`fc_star_challenge_season_${myId}`) || localStorage.getItem('fc_star_challenge_season') || '1') || 1,
        challengeStage: parseInt(localStorage.getItem(`fc_star_challenge_stage_${myId}`) || localStorage.getItem('fc_star_challenge_stage') || '1') || 1,
        challengeBossOvr: parseInt(localStorage.getItem(`fc_star_challenge_boss_ovr_${myId}`) || localStorage.getItem('fc_star_challenge_boss_ovr') || '98') || 98,
        challengeLastDate: localStorage.getItem(`fc_star_challenge_last_date_${myId}`) || localStorage.getItem('fc_star_challenge_last_date') || "",
        challengeDailyFreeUsed: (localStorage.getItem(`fc_star_challenge_free_used_${myId}`) || localStorage.getItem('fc_star_challenge_free_used')) === 'true',
        challengeDailyRetryUsed: (localStorage.getItem(`fc_star_challenge_retry_used_${myId}`) || localStorage.getItem('fc_star_challenge_retry_used')) === 'true',
        challengeHistory: chalHistory,
        challengeSeasonTeams: chalTeams,
        friendlyMatchesHistory: frHistory,
        friendlyCurrentOpponentIndex: parseInt(localStorage.getItem(`fc_star_friendly_current_index_${myId}`) || '0') || 0,
        friendlyMatchesToday: parseInt(localStorage.getItem(`fc_star_friendly_matches_today_${myId}`) || '0') || 0,
        friendlyMatchLastDate: localStorage.getItem(`fc_star_friendly_match_last_date_${myId}`) || "",
        friendlySeasonStartDate: localStorage.getItem(`fc_star_friendly_season_start_date_${myId}`) || new Date().toISOString(),
        lastSyncedUpdatedAt: localStorage.getItem('fc_star_last_synced_updated_at') || "",
        isDataSaverMode: localStorage.getItem('fc_star_data_saver') === 'true',
        localLastUpdated: parseInt(localStorage.getItem('fc_star_local_last_updated') || '0') || Date.now()
    };
}

// 전체 로컬 세이브 저장 수행 (Firebase 1:1 일치 단일 JSON + 레거시 개별 키 듀얼 라이트)
function saveAllToLocalStorage(targetUserId) {
    const rawId = (targetUserId || currentUser || localStorage.getItem('fc_star_current_user') || "guest").trim();
    const myId = rawId.toLowerCase();
    const progressData = collectCurrentUserProgressData(myId);
    if (!progressData) return;

    try {
        // ⭐ 1. Firebase Firestore와 100% 동일한 통합 단일 JSON 문서 저장 (아이디별 키)
        localStorage.setItem(`fc_star_user_${myId}`, JSON.stringify(progressData));
        localStorage.setItem('fc_star_local_last_updated', Date.now().toString());
        localStorage.setItem('fc_star_local_data_owner', myId);

        // ⭐ 2. 하위 호환성을 위한 개별 키 동시 저장 (Dual-Write)
        if (typeof userPoints !== 'undefined') localStorage.setItem('fc_star_user_points', userPoints.toString());
        if (typeof userLevel !== 'undefined') localStorage.setItem('fc_star_user_level', userLevel.toString());
        if (typeof playerDeck !== 'undefined') localStorage.setItem('fc_star_player_deck', JSON.stringify(playerDeck));
        if (typeof squadFormations !== 'undefined') localStorage.setItem('fc_star_squad_formations', JSON.stringify(squadFormations));
        if (typeof squadFormation !== 'undefined') localStorage.setItem('fc_star_squad_formation', JSON.stringify(squadFormation));
        if (typeof currentFormation !== 'undefined') localStorage.setItem('fc_star_current_formation', currentFormation);
        const activeLeague = (typeof currentLeagueId !== 'undefined' && typeof LEAGUE_CONFIGS !== 'undefined' && LEAGUE_CONFIGS[currentLeagueId]) ? currentLeagueId : ((typeof currentLeagueId !== 'undefined' && (currentLeagueId === 'epl' || currentLeagueId === 'jleague' || currentLeagueId === 'kleague1')) ? currentLeagueId : 'kleague1');
        localStorage.setItem('fc_star_current_league', activeLeague);
        if (typeof leagueTeams !== 'undefined') {
            localStorage.setItem(`fc_star_league_teams_${activeLeague}`, JSON.stringify(leagueTeams));
            localStorage.setItem('fc_star_league_teams', JSON.stringify(leagueTeams));
        }
        if (typeof leagueRound !== 'undefined') {
            localStorage.setItem(`fc_star_league_round_${activeLeague}`, leagueRound.toString());
            localStorage.setItem('fc_star_league_round', leagueRound.toString());
        }
        if (typeof leaguePlayerStats !== 'undefined') {
            localStorage.setItem(`fc_star_league_stats_${activeLeague}`, JSON.stringify(leaguePlayerStats));
            localStorage.setItem('fc_star_league_stats', JSON.stringify(leaguePlayerStats));
        }
        if (typeof quizOffset !== 'undefined') localStorage.setItem('fc_star_quiz_offset', quizOffset.toString());
        if (typeof quizLastDate !== 'undefined') localStorage.setItem('fc_star_quiz_last_date', quizLastDate);
        if (typeof quizQueue !== 'undefined') localStorage.setItem('fc_star_quiz_queue', JSON.stringify(quizQueue));
        if (typeof quizSolvedCount !== 'undefined') localStorage.setItem('fc_star_quiz_solved_count', quizSolvedCount.toString());
        if (typeof quizCurrentIndex !== 'undefined') localStorage.setItem('fc_star_quiz_current_index', quizCurrentIndex.toString());
        if (typeof matchLastDate !== 'undefined') localStorage.setItem('fc_star_match_last_date', matchLastDate);
        if (typeof matchTodayCount !== 'undefined') localStorage.setItem('fc_star_match_today_count', matchTodayCount.toString());
        if (typeof lastLoginDate !== 'undefined') localStorage.setItem('fc_star_last_login_date', lastLoginDate);
        if (typeof leagueYear !== 'undefined') localStorage.setItem('fc_star_league_year', leagueYear.toString());
        if (typeof hallOfFame !== 'undefined') localStorage.setItem('fc_star_hall_of_fame', JSON.stringify(hallOfFame));
        if (typeof careerStats !== 'undefined') localStorage.setItem('fc_star_career_stats', JSON.stringify(careerStats));
        if (typeof careerStatsHard !== 'undefined') localStorage.setItem('fc_star_career_stats_hard', JSON.stringify(careerStatsHard));
        if (typeof squadNumbers !== 'undefined') localStorage.setItem('fc_star_squad_numbers', JSON.stringify(squadNumbers));
        if (typeof isHardMode !== 'undefined') localStorage.setItem('fc_star_is_hard_mode', isHardMode.toString());
        if (typeof lastSyncedUpdatedAt !== 'undefined') localStorage.setItem('fc_star_last_synced_updated_at', lastSyncedUpdatedAt);
        if (typeof userAchievements !== 'undefined') localStorage.setItem('fc_star_user_achievements', JSON.stringify(userAchievements));
        if (typeof consecutiveLeagueTitles !== 'undefined') localStorage.setItem('fc_star_consecutive_titles', consecutiveLeagueTitles.toString());
        if (typeof currentWinStreak !== 'undefined') localStorage.setItem('fc_star_current_win_streak', currentWinStreak.toString());
        if (typeof maxWinStreak !== 'undefined') localStorage.setItem('fc_star_max_win_streak', maxWinStreak.toString());
        if (typeof wingerStyles !== 'undefined') localStorage.setItem('fc_star_winger_styles', JSON.stringify(wingerStyles));
        if (typeof strikerStyles !== 'undefined') localStorage.setItem('fc_star_striker_styles', JSON.stringify(strikerStyles));
        if (typeof nationalModeState !== 'undefined' && nationalModeState) {
            localStorage.setItem('fc_star_national_mode_state', JSON.stringify(nationalModeState));
        }
        if (typeof nationalSquadPresets !== 'undefined') {
            localStorage.setItem('fc_star_national_squad_presets', JSON.stringify(nationalSquadPresets));
        }
        if (typeof nationalNationSelections !== 'undefined') {
            localStorage.setItem('fc_star_national_nation_selections', JSON.stringify(nationalNationSelections));
        }
        
        if (typeof userPvpStats !== 'undefined') {
            localStorage.setItem('fc_star_pvp_w', userPvpStats.w.toString());
            localStorage.setItem('fc_star_pvp_d', userPvpStats.d.toString());
            localStorage.setItem('fc_star_pvp_l', userPvpStats.l.toString());
        }
        if (typeof userPvpOpponentStats !== 'undefined') {
            localStorage.setItem('fc_star_pvp_opp_stats', JSON.stringify(userPvpOpponentStats));
        }
        if (typeof cupState !== 'undefined') {
            const cupKey = (typeof currentLeagueId !== 'undefined' && currentLeagueId === 'epl') ? 'fc_star_cup_state_epl' : ((typeof currentLeagueId !== 'undefined' && currentLeagueId === 'jleague') ? 'fc_star_cup_state_jleague' : 'fc_star_cup_state_kleague1');
            localStorage.setItem(cupKey, JSON.stringify(cupState));
            if (!currentLeagueId || currentLeagueId === 'kleague1') {
                localStorage.setItem('fc_star_cup_state', JSON.stringify(cupState));
            }
        }
        if (typeof aclState !== 'undefined') {
            const aclKey = (typeof currentLeagueId !== 'undefined' && currentLeagueId === 'epl') ? 'fc_star_acl_state_epl' : ((typeof currentLeagueId !== 'undefined' && currentLeagueId === 'jleague') ? 'fc_star_acl_state_jleague' : 'fc_star_acl_state_kleague1');
            localStorage.setItem(aclKey, JSON.stringify(aclState));
            if (!currentLeagueId || currentLeagueId === 'kleague1') {
                localStorage.setItem('fc_star_acl_state', JSON.stringify(aclState));
            }
        }
        if (typeof friendlyMatchesHistory !== 'undefined') {
            localStorage.setItem(`fc_star_friendly_history_${myId}`, JSON.stringify(friendlyMatchesHistory));
        }
        if (typeof friendlyCurrentOpponentIndex !== 'undefined') {
            localStorage.setItem(`fc_star_friendly_current_index_${myId}`, friendlyCurrentOpponentIndex.toString());
        }
        if (typeof friendlyMatchesToday !== 'undefined') {
            localStorage.setItem(`fc_star_friendly_matches_today_${myId}`, friendlyMatchesToday.toString());
        }
        if (typeof friendlyMatchLastDate !== 'undefined') {
            localStorage.setItem(`fc_star_friendly_match_last_date_${myId}`, friendlyMatchLastDate);
        }
        
        // 🏆 도전모드(Challenge Mode) 로컬스토리지 안전 저장
        if (typeof saveChallengeState === 'function') {
            saveChallengeState();
        } else {
            localStorage.setItem(`fc_star_challenge_season_${myId}`, (typeof challengeSeason !== 'undefined' ? challengeSeason : 1).toString());
            localStorage.setItem(`fc_star_challenge_stage_${myId}`, (typeof challengeStage !== 'undefined' ? challengeStage : 1).toString());
            localStorage.setItem(`fc_star_challenge_boss_ovr_${myId}`, (typeof challengeBossOvr !== 'undefined' ? challengeBossOvr : 98).toString());
            localStorage.setItem(`fc_star_challenge_last_date_${myId}`, (typeof challengeLastDate !== 'undefined' ? challengeLastDate : ""));
            localStorage.setItem(`fc_star_challenge_free_used_${myId}`, (typeof challengeDailyFreeUsed !== 'undefined' && challengeDailyFreeUsed) ? 'true' : 'false');
            localStorage.setItem(`fc_star_challenge_retry_used_${myId}`, (typeof challengeDailyRetryUsed !== 'undefined' && challengeDailyRetryUsed) ? 'true' : 'false');
            localStorage.setItem(`fc_star_challenge_history_${myId}`, JSON.stringify(typeof challengeHistory !== 'undefined' ? challengeHistory : { w: 0, d: 0, l: 0, totalGames: 0 }));
        }
    } catch (e) {
        console.warn("⚠️ 로컬 세이브 저장 중 에러 발생:", e);
    }
}

// 아이디별 로컬 게임 데이터 로드 및 하이드레이션
function loadLocalGameData(targetUserId) {
    const rawId = (targetUserId || currentUser || localStorage.getItem('fc_star_current_user') || "").trim();
    const myId = rawId ? rawId.toLowerCase() : "";
    
    // 1. 인메모리 전역 상태를 순수 기본값으로 완전 리셋 (이전 계정의 메모리 잔여물 완전 차단)
    if (typeof resetStateToDefault === 'function') {
        resetStateToDefault();
    }
    
    try {
        let loadedData = null;
        
        // 2. 아이디별 통합 JSON 키 우선 조회
        if (myId) {
            const unifiedDataStr = localStorage.getItem(`fc_star_user_${myId}`);
            if (unifiedDataStr) {
                try {
                    loadedData = JSON.parse(unifiedDataStr);
                } catch(e) {
                    console.warn(`[Storage] 통합 데이터 파싱 실패 (fc_star_user_${myId}):`, e);
                }
            }
        }
        
        // 3. 통합 키에 데이터가 없는 경우, 소유자 일치 시에만 기존 레거시 개별 키에서 1회 안전 마이그레이션
        if (!loadedData && myId) {
            const localOwner = (localStorage.getItem('fc_star_local_data_owner') || "").trim().toLowerCase();
            const legacyUser = (localStorage.getItem('fc_star_current_user') || "").trim().toLowerCase();
            const isOwnerMatched = (localOwner === myId || legacyUser === myId || (myId.startsWith('guest_') && localOwner.startsWith('guest_')));
            if (isOwnerMatched) {
                const legacyDeckStr = localStorage.getItem('fc_star_player_deck');
                if (legacyDeckStr || localStorage.getItem('fc_star_user_points') !== null) {
                    console.log(`[Storage Migration] 기존 레거시 개별 키 데이터를 통합 구조(fc_star_user_${myId})로 안전 마이그레이션합니다.`);
                    loadedData = buildLegacyProgressFromLocalStorage(myId);
                    localStorage.setItem(`fc_star_user_${myId}`, JSON.stringify(loadedData));
                    localStorage.setItem('fc_star_local_data_owner', myId);
                }
            } else {
                console.log(`[Storage] 소유자 불일치(로컬 소유자: ${localOwner}, 접속자: ${myId}) -> 타 계정 레거시 복사 방지.`);
            }
        }
        
        // 4. 데이터가 존재하면 인메모리 상태에 일괄 적용 (하이드레이션)
        if (loadedData) {
            applyUserDataToState(loadedData);
            return loadedData;
        }
    } catch (e) {
        console.error("로컬 게임 데이터 로드 중 에러:", e);
    }
    return null;
}

function saveUserProgress(forceImmediate = false, isLoginBackup = false) {
    if (!currentUser) return;
    if (typeof window.isSyncingData !== 'undefined' && window.isSyncingData) {
        console.log("⏳ [Save Blocked] 동기화 진행 중이므로 클라우드 저장을 건너뜁니다.");
        return;
    }
    
    // 1. 데이터 유실 방지를 위해 즉각 로컬 저장은 항상 보장
    saveAllToLocalStorage();
    
    // 🌱 데이터 절약 모드 검사: 로그인/로그아웃/수동 동기화 등 필수 백업 시점(isLoginBackup)이 아닌 모든 일반 저장은 클라우드 전송 차단
    if (isDataSaverMode && !isLoginBackup) {
        console.log("🌱 [Data Saver] 데이터 절약 모드 작동 중: 클라우드 자동 저장을 차단하고 로컬에만 보관합니다.");
        return;
    }
    
    if (!isCloudDataSynced) {
        console.warn("⚠️ [Save Blocked] 클라우드 데이터가 아직 동기화되지 않았으므로 업로드를 차단합니다.");
        return;
    }
    
    const now = Date.now();
    const timeSinceLastUpload = now - lastCloudUploadTime;
    
    // 지연 업로드 타이머 예약 초기화 (디바운싱 효과)
    if (cloudSaveTimeoutId) {
        clearTimeout(cloudSaveTimeoutId);
        cloudSaveTimeoutId = null;
    }
    
    const saveUserId = currentUser;
    const uploadProgress = () => {
        // 예약 업로드도 실행 시점에 계정과 최초 동기화 상태를 다시 확인한다.
        if (!currentUser || currentUser !== saveUserId || !isCloudDataSynced || window.isSyncingData ||
            (dbService.isFirebase && dbService.cloudSaveUserId !== currentUser)) return;
        
        const progressData = collectCurrentUserProgressData();
        if (!progressData) return;
        
        // 로그인 시점의 syncUserDataOnLogin에서만 세이브 선택을 확인한다.
        // 플레이 중 자동 저장은 재확인 모달 없이 마지막으로 선택한 데이터를 갱신한다.
        dbService.saveProgress(currentUser, progressData, false)
            .then(() => {
                lastCloudUploadTime = Date.now();
                lastUploadedPoints = progressData.userPoints;
                lastUploadedDeckJson = getCardOwnershipSignature(progressData.playerDeck);
                isUploadingProgress = false;
                console.log("☁️ [Cloud Save] Firestore 실시간 백업 완료 (v2)");
            })
            .catch(err => {
                isUploadingProgress = false;
                if (err.message === "version_conflict") {
                    console.warn("⚠️ [Cloud Save Mismatch] 다른 기기에서 최근 업데이트된 데이터가 발견되었습니다. 사용자 확인 모달을 호출합니다.");
                    showSyncConflictModal(progressData, err.serverData);
                } else {
                    console.error("Firestore 동기화 저장 에러:", err);
                }
            });
    };

    const currentDeckOwnershipSignature = getCardOwnershipSignature(playerDeck);
    const hasPointsOrCardsChanged = 
        (lastUploadedPoints === null || userPoints !== lastUploadedPoints) ||
        (lastUploadedDeckJson === null || currentDeckOwnershipSignature !== lastUploadedDeckJson);

    if (forceImmediate || hasPointsOrCardsChanged || timeSinceLastUpload >= CLOUD_SAVE_INTERVAL) {
        if (forceImmediate) {
            console.log("⚡ [Cloud Save] forceImmediate 트리거 -> 지연 없이 즉시 Firestore 클라우드 백업을 실행합니다.");
        } else if (hasPointsOrCardsChanged) {
            console.log("☁️ [Cloud Save] 포인트 또는 카드 변경 감지 -> 대기 시간 없이 즉시 동기화 백업을 실행합니다.");
        }
        uploadProgress();
    } else {
        const delay = CLOUD_SAVE_INTERVAL - timeSinceLastUpload;
        console.log(`⏳ [Cloud Save Deferred] ${Math.round(delay / 1000)}초 후 업로드 예정...`);
        cloudSaveTimeoutId = setTimeout(uploadProgress, delay);
    }
}

// 데이터 동기화 충돌 방지 및 처리 조율 모달 표시
function showSyncConflictModal(progressData, serverData) {
    if (dbService.isFirebase && (!serverData || serverData._serverVerified !== true)) return;
    const syncUserId = currentUser;
    const modal = document.getElementById('syncConflictModal');
    if (!modal) return;
    
    // 로컬 vs 클라우드 비교 정보 바인딩
    const localPtsEl = document.getElementById('conflictLocalPoints');
    const localCardsEl = document.getElementById('conflictLocalCards');
    const cloudPtsEl = document.getElementById('conflictCloudPoints');
    const cloudCardsEl = document.getElementById('conflictCloudCards');

    const localPts = (progressData && progressData.userPoints !== undefined) ? progressData.userPoints : userPoints;
    const localDeck = (progressData && progressData.playerDeck) ? progressData.playerDeck : playerDeck;
    const localCardCount = Object.keys(localDeck || {}).length;

    const cloudPts = (serverData && serverData.userPoints !== undefined) ? serverData.userPoints : 0;
    const cloudDeck = (serverData && serverData.playerDeck) ? serverData.playerDeck : {};
    const cloudCardCount = Object.keys(cloudDeck || {}).length;

    if (localPtsEl) localPtsEl.innerText = localPts;
    if (localCardsEl) localCardsEl.innerText = localCardCount;
    if (cloudPtsEl) cloudPtsEl.innerText = cloudPts;
    if (cloudCardsEl) cloudCardsEl.innerText = cloudCardCount;

    modal.style.display = 'flex';
    modal.classList.add('active');
    
    const btnLoad = document.getElementById('btnSyncLoadCloud');
    const btnOverwrite = document.getElementById('btnSyncOverwriteCloud');
    
    if (btnLoad) {
        btnLoad.onclick = () => {
            if (currentUser !== syncUserId) return;
            modal.style.display = 'none';
            modal.classList.remove('active');
            
            // 1. 서버 데이터 반영 및 로컬스토리지 갱신 (forceLoad = true)
            syncUserDataOnLogin(serverData, true);
            
            // 2. 화면 반영을 위해 안전하게 새로고침
            showToast("☁️ 클라우드 데이터를 성공적으로 동기화하여 불러옵니다...");
            setTimeout(() => {
                window.location.reload();
            }, 800);
        };
    }
    
    if (btnOverwrite) {
        btnOverwrite.onclick = () => {
            if (currentUser !== syncUserId) return;
            modal.style.display = 'none';
            modal.classList.remove('active');
            
            // 🛡️ 도전모드 진도 하락 방지 안전 가드: 서버에 더 높은 진도가 있으면 절대 1로 강등시키지 않음
            if (serverData) {
                const sSeason = parseInt(serverData.challengeSeason) || 1;
                const sStage = parseInt(serverData.challengeStage) || 1;
                if (challengeSeason < sSeason || (challengeSeason === sSeason && challengeStage < sStage)) {
                    console.log(`🛡️ [Safety Guard] 서버의 도전모드 진도(시즌 ${sSeason} 스테이지 ${sStage})가 로컬(시즌 ${challengeSeason} 스테이지 ${challengeStage})보다 앞서 있으므로 서버 진도를 보호 유지합니다.`);
                    challengeSeason = sSeason;
                    challengeStage = sStage;
                    if (serverData.challengeBossOvr) challengeBossOvr = serverData.challengeBossOvr;
                    if (serverData.challengeSeasonTeams) challengeSeasonTeams = serverData.challengeSeasonTeams;
                    if (serverData.challengeHistory) challengeHistory = serverData.challengeHistory;
                    if (typeof saveChallengeState === 'function') saveChallengeState();
                }
            }

            // 강제 업로드: 내 동기화 기준시각을 서버 수정시각으로 맞춰서 검증 패스 유도
            window.lastSyncedUpdatedAt = serverData ? (serverData.updatedAt || "") : "";
            try {
                localStorage.setItem('fc_star_last_synced_updated_at', window.lastSyncedUpdatedAt);
            } catch (e) {}
            
            isCloudDataSynced = true;
            dbService.cloudSaveUserId = currentUser;
            lastUploadedPoints = null; // 강제 업로드 트리거를 위해 초기화
            lastUploadedDeckJson = null;
            showToast("💾 로컬 데이터로 클라우드 백업을 진행합니다...");
            // 즉시 저장을 실행하여 강제 업로드
            saveUserProgress();
        };
    }
}

// 전체 화면 렌더링 갱신
function refreshAllScreens() {
    updateDevModeUI();
    if (typeof updateGlowTheme === 'function') updateGlowTheme();
    if (typeof updateAppLogo === 'function') updateAppLogo();
    renderUserPoints();
    updateTotalCardCount();
    renderDeck();
    if (typeof renderStorageDeck === 'function') renderStorageDeck();
    renderSquadFormation();
    syncJeonbukOvr();
    updateMatchPreviewBoard();
    renderLeagueTable();
    renderLeagueStats();
    renderCareerStats();
    if (typeof updateMatchSubTabsUI === 'function') updateMatchSubTabsUI();
    if (typeof initCupTab === 'function') {
        initCupTab();
    }
    if (typeof initAclTab === 'function') {
        initAclTab();
    }
    if (typeof renderAchievements === 'function') {
        renderAchievements();
    }
    updateAuthBadgeUI();
}

function syncUserDataOnLogin(userData, forceLoad = false, requireChoice = false) {
    if (!userData) return;
    isCloudDataSynced = false;
    dbService.cloudSaveUserId = null;
    if (dbService.isFirebase && userData._serverVerified !== true) return;
    
    window.isSyncingData = true;
    try {
        const targetUserId = (userData.id || currentUser || "").trim().toLowerCase();
        
        // 로컬스토리지 해당 유저 타임스탬프와 클라우드 타임스탬프 비교
        let localLastUpdated = 0;
        if (targetUserId) {
            try {
                const userDocStr = localStorage.getItem(`fc_star_user_${targetUserId}`);
                if (userDocStr) {
                    const uDoc = JSON.parse(userDocStr);
                    localLastUpdated = parseInt(uDoc.localLastUpdated || '0') || 0;
                }
            } catch(e) {}
        }
        const cloudLastUpdated = userData.localLastUpdated || 0;

        // 로컬 진행 내역과 클라우드 데이터 시점이 다르고 강제 로드가 아닐 시 -> 사용자에게 선택 모달 표시
        if (!forceLoad && (requireChoice || (localLastUpdated > 0 && localLastUpdated > cloudLastUpdated))) {
            console.log("⚠️ [Sync Info] 로컬 장치에 업로드되지 않은 최신 게임 진행 내역이 감지되었습니다. 사용자 선택을 대기합니다.");
            isCloudDataSynced = false; // 사용자가 선택하기 전까지 자동 클라우드 업로드 전면 차단
            window.isSyncingData = false;
            refreshAllScreens();
            
            // 로컬 현재 데이터 구성 (도전모드 상태도 함께 포함)
            const localDataObj = {
                userPoints: userPoints,
                playerDeck: playerDeck,
                challengeSeason: challengeSeason,
                challengeStage: challengeStage
            };
            
            // 사용자에게 [클라우드 불러오기] vs [로컬로 덮어쓰기] 선택 모달 즉시 표시
            showSyncConflictModal(localDataObj, userData);
            return;
        }

        // 1. 공통 하이드레이션 함수로 인메모리 상태 일괄 복원
        applyUserDataToState(userData);
        window.lastSyncedUpdatedAt = userData.updatedAt || "";
        lastUploadedPoints = userPoints;
        lastUploadedDeckJson = getCardOwnershipSignature(playerDeck);

        // 2. 하루 최초 로그인 시 포인트 3점 지급 판정
        const todayStr = new Date().toLocaleDateString('ko-KR');
        if (lastLoginDate !== todayStr) {
            userPoints += 3;
            lastLoginDate = todayStr;
            setTimeout(() => {
                showToast("🎁 오늘 첫 로그인 보상! +3 FP가 지급되었습니다.");
            }, 1200);
            
            // 보상 적립 후 클라우드 서버에 즉시 자동 백업
            setTimeout(() => {
                saveUserProgress();
            }, 2500);
        }

        // 3. 통합 로컬스토리지 및 개별 키 듀얼 라이트 즉시 반영
        saveAllToLocalStorage(targetUserId);

        // 4. 전체 화면 렌더링 갱신
        refreshAllScreens();
        
        // 동기화 완료 상태 마크
        isCloudDataSynced = true;
        dbService.cloudSaveUserId = currentUser;
        
        // 🌱 로그인/접속 완료 시점 보장 1회 클라우드 백업 (절약 모드 켜짐 여부와 상관없이 1회 확실하게 백업)
        saveUserProgress(true, true);
        
        // 데이터 동기화 완료 후 오늘 기준 컨디션 업데이트 적용
        try {
            if (typeof updateDeckConditions === 'function') {
                updateDeckConditions();
            }
        } catch (e) {
            console.warn("동기화 완료 후 컨디션 업데이트 실패:", e);
        }
    } catch (e) {
        console.error("데이터 동기화 실패:", e);
        alert("계정 데이터 동기화 도중 에러가 발생했습니다: " + e.message);
    } finally {
        window.isSyncingData = false;
    }
}

function updateAuthBadgeUI() {
    updateDataSaverUI();
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
    
    updateDataSaverUI();
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
    
    const targetUserId = id.trim().toLowerCase();
    
    isAuthSubmitting = true;
    const btnSubmit = document.getElementById('btnSubmitAuth');
    resetInitialCloudSync();
    if (btnSubmit) btnSubmit.disabled = true;
    
    showToast(`${authMode === 'login' ? '로그인' : '회원가입'} 진행 중...`);
    
    try {
        if (authMode === 'login') {
            // LOGIN PROCESS
            const userData = await dbService.login(id, pw);
            currentUser = (userData.id || targetUserId).trim().toLowerCase();
            localStorage.setItem('fc_star_local_data_owner', currentUser);
            localStorage.setItem('fc_star_current_user', currentUser);
            
            // ⭐ 1. 해당 유저의 로컬 통합 데이터가 있으면 먼저 로드 (내부에서 resetStateToDefault 자동 호출)
            loadLocalGameData(currentUser);
            
            // ⭐ 2. 클라우드 서버 데이터 동기화 시작
            startInitialCloudSync(userData, pw);
            
            closeAuthModal();
            showToast(`환영합니다! ${currentUser.toUpperCase()} 계정으로 로그인되었습니다.`);
        } else {
            // REGISTER PROCESS
            // 이전 계정 인메모리 잔여물 완전 리셋
            if (typeof resetStateToDefault === 'function') resetStateToDefault();
            
            const defaultData = await dbService.register(id, pw);
            currentUser = (defaultData.id || targetUserId).trim().toLowerCase();
            localStorage.setItem('fc_star_local_data_owner', currentUser);
            localStorage.setItem('fc_star_current_user', currentUser);
            
            // Sync & automatically save existing local progress (if any) as first upload
            startInitialCloudSync(defaultData, pw);
            
            // Backup fresh default local data to cloud immediately
            saveAllToLocalStorage(currentUser);
            saveUserProgress(true, true);
            
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

async function handleGuestPlay() {
    if (isAuthSubmitting) return;
    
    // 1. Generate or retrieve guest ID
    let guestId = localStorage.getItem('fc_star_guest_id');
    if (!guestId) {
        const randStr = Math.random().toString(36).substring(2, 10); // 8 random characters
        guestId = `guest_${randStr}`;
        localStorage.setItem('fc_star_guest_id', guestId);
    }

    isAuthSubmitting = true;
    const btnGuest = document.getElementById('btnGuestAuth');
    resetInitialCloudSync();
    if (btnGuest) {
        btnGuest.disabled = true;
        btnGuest.innerHTML = `<i class="fa-solid fa-spinner fa-spin" style="margin-right: 6px;"></i>게스트 시작 중...`;
    }
    
    const guestPw = "fc_star_guest_pwd"; // secure/fixed guest password
    
    try {
        showToast("게스트 세션 생성 중...");
        
        let userData = null;
        try {
            // Try logging in (in case the guest account is already registered in the cloud)
            userData = await dbService.login(guestId, guestPw);
        } catch (loginErr) {
            // If it doesn't exist, register it
            if (loginErr.message && loginErr.message.includes("존재하지 않는 아이디")) {
                userData = await dbService.register(guestId, guestPw);
            } else {
                throw loginErr;
            }
        }
        
        currentUser = guestId.toLowerCase();
        localStorage.setItem('fc_star_current_user', currentUser);
        localStorage.setItem('fc_star_local_data_owner', currentUser);
        
        // ⭐ 게스트 로컬 통합 데이터 우선 로드 (내부에서 resetStateToDefault 자동 호출)
        loadLocalGameData(currentUser);
        
        // Sync and refresh
        if (userData) {
            startInitialCloudSync(userData, guestPw);
            saveAllToLocalStorage(currentUser);
            saveUserProgress(true, true);
        }
        
        closeAuthModal();
        showToast("게스트 모드로 게임을 시작합니다!");
    } catch (err) {
        console.warn("⚠️ 클라우드 게스트 생성 실패 (오프라인 모드 진입):", err);
        // Offline / network fallback: directly start guest mode locally
        currentUser = guestId.toLowerCase();
        localStorage.setItem('fc_star_current_user', currentUser);
        localStorage.setItem('fc_star_local_data_owner', currentUser);
        loadLocalGameData(currentUser);
        
        // Trigger UI rendering
        isCloudDataSynced = false;
        dbService.cloudSaveUserId = null;
        if (dbService.isFirebase) {
            pendingInitialCloudSync = { id: guestId, password: guestPw, checking: false };
            initialCloudSyncTimeoutId = setTimeout(retryInitialCloudSync, 15000);
        }
        if (typeof updateAuthBadgeUI === 'function') updateAuthBadgeUI();
        if (typeof updateDevModeUI === 'function') updateDevModeUI();
        if (typeof loadFriendlyMatchesState === 'function') {
            loadFriendlyMatchesState();
        }
        
        renderUserPoints();
        updateTotalCardCount();
        renderDeck();
        renderSquadFormation();
        if (typeof syncJeonbukOvr === 'function') syncJeonbukOvr();
        if (typeof updateMatchPreviewBoard === 'function') updateMatchPreviewBoard();
        if (typeof renderLeagueTable === 'function') renderLeagueTable();
        if (typeof renderLeagueStats === 'function') renderLeagueStats();
        if (typeof renderCareerStats === 'function') renderCareerStats();
        
        closeAuthModal();
        showToast("⚠️ 오프라인 게스트 모드로 인게임에 진입했습니다.");
    } finally {
        isAuthSubmitting = false;
        if (btnGuest) {
            btnGuest.disabled = false;
            btnGuest.innerHTML = `<i class="fa-solid fa-user-secret" style="margin-right: 6px;"></i>로그인 없이 시작 (게스트)`;
        }
    }
}

// 로컬 게임 데이터 정리 (명시적 removeUnifiedDoc 요청 시에만 해당 유저 통합 문서 삭제)
function clearLocalGameData(targetUserId, removeUnifiedDoc = false) {
    const rawId = (targetUserId || currentUser || localStorage.getItem('fc_star_current_user') || "").trim();
    const myId = rawId.toLowerCase();
    
    // 명시적으로 removeUnifiedDoc이 true일 때만 아이디별 통합 JSON 키 삭제
    if (myId && removeUnifiedDoc) {
        try { localStorage.removeItem(`fc_star_user_${myId}`); } catch(e) {}
    }
}
const clearActiveSessionCache = clearLocalGameData;

async function handleLogout() {
    const confirmLogout = confirm("정말 로그아웃 하시겠습니까?\n로그아웃 시 비회원 로컬 모드로 전환됩니다.");
    if (confirmLogout) {
        // 1. 로그인 상태인 경우, 최종 진행 데이터를 클라우드 및 로컬 통합 키에 안전 저장
        if (currentUser) {
            try {
                showToast("☁️ 최종 데이터를 안전하게 저장하는 중...");
                saveAllToLocalStorage(currentUser);
                const progressData = collectCurrentUserProgressData(currentUser);
                if (progressData && isCloudDataSynced) {
                    await dbService.saveProgress(currentUser, progressData, false);
                    console.log("☁️ [Logout Backup] 로그아웃 전 최종 클라우드 저장 성공!");
                }
            } catch (e) {
                console.error("❌ 로그아웃 전 클라우드 저장 중 에러:", e);
            }
        }
        
        resetInitialCloudSync();
        currentUser = null;
        isCloudDataSynced = false;
        
        localStorage.removeItem('fc_star_current_user');
        
        // 로그아웃 시 메모리 전역 상태 안전 리셋
        if (typeof resetStateToDefault === 'function') {
            resetStateToDefault();
        }
        
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
            "레벨 10이 상승할 때마다 <strong>전설(Legend) 카드 1장</strong>이 특별 선물로 지급되며, 모든 카드를 보유 중일 경우 <strong>10 FP(포인트)</strong>가 지급됩니다!<br><br>열심히 단어 공부를 하고 특별한 전설 혜택을 쟁취해보세요!"
        );
    } else if (level > 0 && level % 10 === 0) {
        if (typeof CARDS_DATABASE === 'undefined') return;

        // 전설 등급 카드 목록 추출
        const legendKeys = Object.keys(CARDS_DATABASE).filter(k => CARDS_DATABASE[k].rarity === 'legend');
        
        // 아직 보유하지 않은 전설 카드 목록 필터링
        const unownedLegends = legendKeys.filter(k => !playerDeck[k]);

        if (unownedLegends.length === 0) {
            // 모든 전설 카드를 이미 보유 중인 경우: 10 FP 지급
            userPoints += 10;
            try {
                localStorage.setItem('fc_star_user_points', userPoints.toString());
            } catch(e) {}
            renderUserPoints();
            saveUserProgress();

            showLevelRewardModal(
                "🎁 특별 레벨업 보상 🎁",
                `Lv. ${level} 달성을 축하합니다!`,
                `축하합니다! 레벨 ${level} 달성 기념 보상입니다.<br>이미 모든 전설 카드를 보유하고 있어 특별 선물로 <strong>10 FP (가차 포인트)</strong>가 지급되었습니다!<br><br>앞으로도 레벨 10이 오를 때마다 전설 카드 또는 10 FP가 지급됩니다!`
            );
        } else {
            // 미보유 전설 카드 중 무작위 1장 선정 및 지급
            const chosenKey = unownedLegends[Math.floor(Math.random() * unownedLegends.length)];
            const cardObj = CARDS_DATABASE[chosenKey];

            playerDeck[chosenKey] = {
                card: cardObj,
                quantity: 1,
                awakening: 0,
                condition: 0,
                conditionDate: new Date().toLocaleDateString('ko-KR')
            };

            // 상태 저장
            try {
                localStorage.setItem('fc_star_player_deck', JSON.stringify(playerDeck));
            } catch(e) {}
            saveUserProgress();
            
            if (typeof updateTotalCardCount === 'function') updateTotalCardCount();
            if (typeof renderDeck === 'function') renderDeck();

            showLevelRewardModal(
                "🎁 특별 레벨업 보상 🎁",
                `Lv. ${level} 달성을 축하합니다!`,
                `축하합니다! 레벨 ${level} 달성 기념으로 새로운 전설 등급 카드 <strong>'${cardObj.name}'</strong> 선수를 획득하셨습니다!<br><br>(내 컬렉션(덱)에 새로운 전설 선수로 안전하게 지급되었습니다!)<br><br>앞으로도 레벨 10이 오를 때마다 전설 카드(모두 보유 시 10 FP)가 지급됩니다!`
            );
        }
    }
}
