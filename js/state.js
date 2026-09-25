// js/state.js - 전역 상태 관리 모듈

// CARDS_DATABASE is now loaded dynamically from player/player_data.js

// 0. ACTIVE USER UNIFIED DOCUMENT PRE-LOAD (아이디별 단일 통합 JSON 문서 우선 조회)
let preloadedUserData = null;
try {
    const activeOwner = (localStorage.getItem('fc_star_current_user') || localStorage.getItem('fc_star_local_data_owner') || "").trim().toLowerCase();
    if (activeOwner) {
        const unifiedDoc = localStorage.getItem(`fc_star_user_${activeOwner}`);
        if (unifiedDoc) {
            preloadedUserData = JSON.parse(unifiedDoc);
        }
    }
} catch (e) {
    preloadedUserData = null;
}

// 1. USER POINTS & LEVEL STATE (FP & Level)
let userPoints = 0;
try {
    if (preloadedUserData && preloadedUserData.userPoints !== undefined && preloadedUserData.userPoints !== null) {
        userPoints = parseInt(preloadedUserData.userPoints) || 0;
    } else {
        const savedPoints = localStorage.getItem('fc_star_user_points');
        if (savedPoints !== null) {
            userPoints = parseInt(savedPoints);
            if (isNaN(userPoints) || userPoints < 0) userPoints = 0;
        }
    }
} catch (e) {
    userPoints = 0;
}

let userLevel = 1;
try {
    if (preloadedUserData && preloadedUserData.userLevel !== undefined && preloadedUserData.userLevel !== null) {
        userLevel = parseInt(preloadedUserData.userLevel) || 1;
    } else {
        const savedLevel = localStorage.getItem('fc_star_user_level');
        if (savedLevel !== null) {
            userLevel = parseInt(savedLevel);
            if (isNaN(userLevel) || userLevel < 1) userLevel = 1;
        }
    }
} catch (e) {
    userLevel = 1;
}

// 1.5 HARD MODE STATE
let isHardMode = false;
try {
    if (preloadedUserData && preloadedUserData.isHardMode !== undefined) {
        isHardMode = !!preloadedUserData.isHardMode;
    } else {
        const savedHardMode = localStorage.getItem('fc_star_is_hard_mode');
        if (savedHardMode !== null) {
            isHardMode = savedHardMode === 'true';
        }
    }
} catch (e) {
    isHardMode = false;
}

// 2. PLAYER DECK STATE (Loaded from Unified Doc or LocalStorage with robust error handling)
let playerDeck = {};
try {
    let savedDeck = (preloadedUserData && preloadedUserData.playerDeck) ? preloadedUserData.playerDeck : null;
    if (!savedDeck) {
        const legacyDeckStr = localStorage.getItem('fc_star_player_deck');
        if (legacyDeckStr) {
            savedDeck = JSON.parse(legacyDeckStr);
        }
    }
    if (savedDeck && typeof savedDeck === 'object' && !Array.isArray(savedDeck)) {
        playerDeck = savedDeck;
        // Sync structures for cards
        Object.keys(playerDeck).forEach(key => {
            if (typeof CARDS_DATABASE !== 'undefined' && CARDS_DATABASE[key]) {
                playerDeck[key].card = CARDS_DATABASE[key];
                playerDeck[key].isStored = playerDeck[key].isStored === true;
            } else {
                delete playerDeck[key]; // Cleanup legacy format cards
            }
        });
    }
} catch (e) {
    console.warn("LocalStorage access blocked. Using in-memory fallback.", e);
    playerDeck = {};
}

let activePulledCard = null;
let isFlipped = false;

let quizOffset = (preloadedUserData && preloadedUserData.quizOffset !== undefined) ? parseInt(preloadedUserData.quizOffset) || 0 : 0;
let quizLastDate = (preloadedUserData && preloadedUserData.quizLastDate) ? preloadedUserData.quizLastDate : "";
let matchLastDate = (preloadedUserData && preloadedUserData.matchLastDate) ? preloadedUserData.matchLastDate : "";
let matchTodayCount = (preloadedUserData && preloadedUserData.matchTodayCount !== undefined) ? parseInt(preloadedUserData.matchTodayCount) || 0 : 0;
let lastLoginDate = (preloadedUserData && preloadedUserData.lastLoginDate) ? preloadedUserData.lastLoginDate : "";
if (!lastLoginDate) {
    try {
        const savedLoginDate = localStorage.getItem('fc_star_last_login_date');
        if (savedLoginDate) lastLoginDate = savedLoginDate;
    } catch (e) {
        lastLoginDate = "";
    }
}

// REAL-TIME USER AUTH & DATA SYNC STATE
let currentUser = null;
let authMode = 'login'; // 'login' or 'register'
let isAuthSubmitting = false;
window.lastSyncedUpdatedAt = (preloadedUserData && preloadedUserData.lastSyncedUpdatedAt) ? preloadedUserData.lastSyncedUpdatedAt : "";
let isCloudDataSynced = false;
if (!window.lastSyncedUpdatedAt) {
    try {
        const savedSyncedTime = localStorage.getItem('fc_star_last_synced_updated_at');
        if (savedSyncedTime) window.lastSyncedUpdatedAt = savedSyncedTime;
    } catch (e) {
        window.lastSyncedUpdatedAt = "";
    }
}

// DEVELOPER MODE & MULTI-YEAR LEAGUE STATE VARIABLES
let isDeveloperMode = false;
let currentLeagueId = 'kleague1'; // 'kleague1', 'epl', 'jleague'
try {
    const savedLeague = (preloadedUserData && preloadedUserData.currentLeagueId) ? preloadedUserData.currentLeagueId : localStorage.getItem('fc_star_current_league');
    if (savedLeague && (savedLeague === 'kleague1' || savedLeague === 'epl' || savedLeague === 'jleague')) {
        currentLeagueId = savedLeague;
    }
} catch (e) {
    currentLeagueId = 'kleague1';
}
let currentFameLeagueTab = 'kleague1'; // 'kleague1', 'epl', 'jleague'

let leagueYear = (preloadedUserData && preloadedUserData.leagueYear) ? parseInt(preloadedUserData.leagueYear) || 2026 : 2026;
let hallOfFame = (preloadedUserData && preloadedUserData.hallOfFame) ? preloadedUserData.hallOfFame : [];
let careerStats = (preloadedUserData && preloadedUserData.careerStats) ? preloadedUserData.careerStats : { w: 0, d: 0, l: 0, gf: 0, ga: 0, playerGoals: {} };
let careerStatsHard = (preloadedUserData && preloadedUserData.careerStatsHard) ? preloadedUserData.careerStatsHard : { w: 0, d: 0, l: 0, gf: 0, ga: 0, playerGoals: {} };
if (!preloadedUserData) {
    try {
        const savedStats = localStorage.getItem('fc_star_career_stats');
        if (savedStats) careerStats = JSON.parse(savedStats);
    } catch(e) {}
    try {
        const savedStatsHard = localStorage.getItem('fc_star_career_stats_hard');
        if (savedStatsHard) careerStatsHard = JSON.parse(savedStatsHard);
    } catch(e) {}
}

let userPvpStats = (preloadedUserData && preloadedUserData.pvpStats) ? preloadedUserData.pvpStats : { w: 0, d: 0, l: 0 };
let userPvpOpponentStats = (preloadedUserData && preloadedUserData.pvpOpponentStats) ? preloadedUserData.pvpOpponentStats : {};
if (!preloadedUserData) {
    try {
        const savedPvpW = localStorage.getItem('fc_star_pvp_w');
        const savedPvpD = localStorage.getItem('fc_star_pvp_d');
        const savedPvpL = localStorage.getItem('fc_star_pvp_l');
        if (savedPvpW !== null) userPvpStats.w = parseInt(savedPvpW) || 0;
        if (savedPvpD !== null) userPvpStats.d = parseInt(savedPvpD) || 0;
        if (savedPvpL !== null) userPvpStats.l = parseInt(savedPvpL) || 0;

        const savedPvpOpp = localStorage.getItem('fc_star_pvp_opp_stats');
        if (savedPvpOpp) {
            userPvpOpponentStats = JSON.parse(savedPvpOpp) || {};
        }
    } catch (e) {
        userPvpOpponentStats = {};
    }
}

let currentFormation = (preloadedUserData && preloadedUserData.currentFormation) ? preloadedUserData.currentFormation : '4-4-2';
if (!preloadedUserData) {
    try {
        const savedFormation = localStorage.getItem('fc_star_current_formation');
        if (savedFormation) {
            currentFormation = savedFormation;
        }
    } catch (e) {
        currentFormation = '4-4-2';
    }
}

// 3. TTS AUTOPLAY PREFERENCE STATE (Option 1 vs Option 2 Toggle)
let isQuizTtsAutoplay = true; // 항상 자동발음 ON 강제
try {
    localStorage.setItem('fc_star_quiz_tts_autoplay', 'true');
} catch (e) {
    // Ignore
}

// 4. SQUAD NUMBERS STATE (등번호 설정 데이터 1~90)
let squadNumbers = {};
try {
    let savedNumbers = (preloadedUserData && preloadedUserData.squadNumbers) ? preloadedUserData.squadNumbers : null;
    if (!savedNumbers) {
        const numbersStr = localStorage.getItem('fc_star_squad_numbers');
        if (numbersStr) savedNumbers = JSON.parse(numbersStr);
    }
    if (savedNumbers && typeof savedNumbers === 'object') {
        squadNumbers = savedNumbers;
        for (let i = 1; i <= 90; i++) {
            if (!squadNumbers[i]) {
                squadNumbers[i] = { number: i, cardId: null };
            }
        }
    } else {
        for (let i = 1; i <= 90; i++) {
            squadNumbers[i] = { number: i, cardId: null };
        }
    }
} catch (e) {
    squadNumbers = {};
    for (let i = 1; i <= 90; i++) {
        squadNumbers[i] = { number: i, cardId: null };
    }
}

// 5. SQUAD CAPTAIN STATE (구단 주장 설정 데이터)
let squadCaptain = (preloadedUserData && preloadedUserData.squadCaptain !== undefined) ? preloadedUserData.squadCaptain : null;
if (!preloadedUserData) {
    try {
        const savedCaptain = localStorage.getItem('fc_star_squad_captain');
        if (savedCaptain) {
            squadCaptain = savedCaptain;
        }
    } catch (e) {
        squadCaptain = null;
    }
}

// 6. ACHIEVEMENTS & LEAGUE WIN STREAKS STATE (업적 및 리그 연승 기록 상태)
let userAchievements = {
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
    wins2000: { unlocked: false, rewarded: false }
};
if (preloadedUserData && preloadedUserData.userAchievements) {
    userAchievements = { ...userAchievements, ...preloadedUserData.userAchievements };
} else {
    try {
        const savedAchievements = localStorage.getItem('fc_star_user_achievements');
        if (savedAchievements) {
            const parsed = JSON.parse(savedAchievements);
            if (parsed && typeof parsed === 'object') {
                userAchievements = { ...userAchievements, ...parsed };
            }
        }
    } catch (e) {}
}

let consecutiveLeagueTitles = (preloadedUserData && preloadedUserData.consecutiveLeagueTitles !== undefined) ? parseInt(preloadedUserData.consecutiveLeagueTitles) || 0 : 0;
let currentWinStreak = (preloadedUserData && preloadedUserData.currentWinStreak !== undefined) ? parseInt(preloadedUserData.currentWinStreak) || 0 : 0;
let maxWinStreak = (preloadedUserData && preloadedUserData.maxWinStreak !== undefined) ? parseInt(preloadedUserData.maxWinStreak) || 0 : 0;
if (!preloadedUserData) {
    try {
        const savedTitles = localStorage.getItem('fc_star_consecutive_titles');
        if (savedTitles) consecutiveLeagueTitles = parseInt(savedTitles) || 0;
    } catch (e) {}
    try {
        const savedCurrentStreak = localStorage.getItem('fc_star_current_win_streak');
        if (savedCurrentStreak) currentWinStreak = parseInt(savedCurrentStreak) || 0;
    } catch (e) {}
    try {
        const savedMaxStreak = localStorage.getItem('fc_star_max_win_streak');
        if (savedMaxStreak) maxWinStreak = parseInt(savedMaxStreak) || 0;
    } catch (e) {}
}

// 6-1. DATA SAVER MODE STATE (데이터 절약 모드 - 접속/로그인 시에만 클라우드 백업, 플레이 중 백업 차단)
let isDataSaverMode = (preloadedUserData && preloadedUserData.isDataSaverMode !== undefined) ? !!preloadedUserData.isDataSaverMode : false;
if (!preloadedUserData) {
    try {
        const savedDataSaver = localStorage.getItem('fc_star_data_saver');
        if (savedDataSaver !== null) {
            isDataSaverMode = savedDataSaver === 'true';
        }
    } catch (e) {}
}

// 7. WINGER PLAYSTYLE CONFIGURATION STATE
let wingerStyles = {
    '4-4-2': { LW: 'dribble', RW: 'sprint' },
    '4-3-3': { LW: 'dribble', RW: 'sprint' },
    '3-4-3': { LW: 'dribble', RW: 'sprint' },
    '5-4-1': { LW: 'dribble', RW: 'sprint' },
    '4-2-3-1': { LW: 'dribble', RW: 'sprint' }
};
try {
    let savedWingerStyles = (preloadedUserData && preloadedUserData.wingerStyles) ? preloadedUserData.wingerStyles : null;
    if (!savedWingerStyles) {
        const savedStr = localStorage.getItem('fc_star_winger_styles');
        if (savedStr) savedWingerStyles = JSON.parse(savedStr);
    }
    if (savedWingerStyles) {
        if (savedWingerStyles.LW || savedWingerStyles.RW) {
            Object.keys(wingerStyles).forEach(f => {
                wingerStyles[f] = { 
                    LW: savedWingerStyles.LW || 'dribble', 
                    RW: savedWingerStyles.RW || 'sprint' 
                };
            });
        } else {
            wingerStyles = savedWingerStyles;
        }
    }
} catch (e) {
    console.warn("Winger styles parsing failed, fallback used", e);
}

// 8. STRIKER PLAYSTYLE CONFIGURATION STATE
let strikerStyles = {
    '4-4-2': { ST: 'targetman' },
    '4-3-3': { ST: 'targetman' },
    '3-4-3': { ST: 'targetman' },
    '5-4-1': { ST: 'targetman' },
    '4-2-3-1': { ST: 'targetman' }
};
try {
    let savedStrikerStyles = (preloadedUserData && preloadedUserData.strikerStyles) ? preloadedUserData.strikerStyles : null;
    if (!savedStrikerStyles) {
        const savedStr = localStorage.getItem('fc_star_striker_styles');
        if (savedStr) savedStrikerStyles = JSON.parse(savedStr);
    }
    if (savedStrikerStyles) {
        if (savedStrikerStyles.ST) {
            Object.keys(strikerStyles).forEach(f => {
                strikerStyles[f] = { 
                    ST: savedStrikerStyles.ST || 'targetman' 
                };
            });
        } else {
            strikerStyles = savedStrikerStyles;
        }
    }
} catch (e) {
    console.warn("Striker styles parsing failed, fallback used", e);
}

// 9. DAILY CONDITION SYSTEM
function isTomy0304() {
    try {
        const savedUser = localStorage.getItem('fc_star_current_user');
        if (savedUser && savedUser.toLowerCase() === 'tomy0304') {
            return true;
        }
        if (typeof currentUser === 'string' && currentUser.toLowerCase() === 'tomy0304') {
            return true;
        }
    } catch (e) {}
    return false;
}

function updateDeckConditions() {
    if (typeof playerDeck !== 'object' || !playerDeck) return;
    const todayStr = new Date().toLocaleDateString('ko-KR');
    let modified = false;
    
    const isTomy = isTomy0304();
    
    Object.keys(playerDeck).forEach(key => {
        const item = playerDeck[key];
        if (!item) return;
        
        if (isTomy) {
            // tomy0304는 컨디션 무조건 0(보통) 고정
            if (item.condition !== 0 || item.conditionDate !== todayStr) {
                item.condition = 0;
                item.conditionDate = todayStr;
                modified = true;
            }
        } else {
            // conditionDate가 오늘 날짜와 다르면 컨디션 갱신
            if (item.conditionDate !== todayStr) {
                const rand = Math.random();
                let cond = 0;
                if (rand < 0.25) {
                    cond = 2; // 상승 ↗️
                } else if (rand < 0.50) {
                    cond = -2; // 하락 ↘️
                } else {
                    cond = 0; // 보통 ➡️
                }
                item.condition = cond;
                item.conditionDate = todayStr;
                modified = true;
            }
        }
    });
    
    if (modified) {
        try {
            // 로컬스토리지에 저장 (컨디션 자동 정규화는 타임스탬프를 오염시키지 않음)
            localStorage.setItem('fc_star_player_deck', JSON.stringify(playerDeck));
        } catch (e) {}
        
        // 클라우드 저장 (동기화 중이 아니며 클라우드가 완전히 연결된 상태에서만 안전하게 저장)
        if (typeof saveUserProgress === 'function' && typeof isCloudDataSynced !== 'undefined' && isCloudDataSynced && (!window.isSyncingData)) {
            saveUserProgress();
        }
    }
}

// 초기 실행
try {
    updateDeckConditions();
} catch (e) {
    console.warn("컨디션 업데이트 실패:", e);
}

// ==========================================
// 🏆 CHALLENGE MODE STATE (도전모드 스테이지 시스템 - 아이디별 격리 스토리지 연동)
// ==========================================
let challengeSeason = 1;
let challengeStage = 1;
let challengeBossOvr = 98; // 기본 1시즌 마지막 보스 OVR 98 (시즌 종료 시 마지막 경기 시점 OVR + 1 로 갱신)
let challengeLastDate = "";
let challengeDailyFreeUsed = false;
let challengeDailyRetryUsed = false;
let challengeHistory = { w: 0, d: 0, l: 0, totalGames: 0 };
let challengeSeasonTeams = null; // 시즌별 1~10 스테이지 상대팀 배열 (시즌2부터 6~10위 랜덤 셔플)

function getChallengeTodayDateString() {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// 🔄 전역 상태를 순수 기본값으로 완전 초기화 (계정 전환/로그아웃/게스트 진입 시 이전 계정 메모리 오염 원천 차단)
function resetStateToDefault() {
    userPoints = 0;
    userLevel = 1;
    isHardMode = false;
    playerDeck = {};
    activePulledCard = null;
    isFlipped = false;
    quizOffset = 0;
    quizLastDate = "";
    quizQueue = [];
    quizSolvedCount = 0;
    quizCurrentIndex = 0;
    matchLastDate = "";
    matchTodayCount = 0;
    lastLoginDate = "";
    if (typeof window !== 'undefined') {
        window.lastSyncedUpdatedAt = "";
    }
    isCloudDataSynced = false;
    currentLeagueId = 'kleague1';
    currentFameLeagueTab = 'kleague1';
    leagueYear = 2026;
    hallOfFame = [];
    leaguePlayerStats = {};
    careerStats = { w: 0, d: 0, l: 0, gf: 0, ga: 0, playerGoals: {} };
    careerStatsHard = { w: 0, d: 0, l: 0, gf: 0, ga: 0, playerGoals: {} };
    userPvpStats = { w: 0, d: 0, l: 0 };
    userPvpOpponentStats = {};
    currentFormation = '4-4-2';
    squadFormation = {};
    squadFormations = {
        '4-4-2': {},
        '4-3-3': {},
        '3-4-3': {},
        '5-4-1': {},
        '4-2-3-1': {}
    };
    squadCaptain = null;
    squadNumbers = {};
    for (let i = 1; i <= 90; i++) {
        squadNumbers[i] = { number: i, cardId: null };
    }
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
        wins2000: { unlocked: false, rewarded: false }
    };
    consecutiveLeagueTitles = 0;
    currentWinStreak = 0;
    maxWinStreak = 0;
    isDataSaverMode = false;
    wingerStyles = {
        '4-4-2': { LW: 'dribble', RW: 'sprint' },
        '4-3-3': { LW: 'dribble', RW: 'sprint' },
        '3-4-3': { LW: 'dribble', RW: 'sprint' },
        '5-4-1': { LW: 'dribble', RW: 'sprint' },
        '4-2-3-1': { LW: 'dribble', RW: 'sprint' }
    };
    strikerStyles = {
        '4-4-2': { ST: 'targetman' },
        '4-3-3': { ST: 'targetman' },
        '3-4-3': { ST: 'targetman' },
        '5-4-1': { ST: 'targetman' },
        '4-2-3-1': { ST: 'targetman' }
    };
    if (typeof nationalModeState !== 'undefined') nationalModeState = null;
    if (typeof nationalSquadPresets !== 'undefined') nationalSquadPresets = {};
    if (typeof nationalNationSelections !== 'undefined') nationalNationSelections = {};
    if (typeof cupState !== 'undefined') cupState = null;
    if (typeof aclState !== 'undefined') aclState = null;
    
    // 도전모드 기본값 리셋
    challengeSeason = 1;
    challengeStage = 1;
    challengeBossOvr = 98;
    challengeLastDate = "";
    challengeDailyFreeUsed = false;
    challengeDailyRetryUsed = false;
    challengeHistory = { w: 0, d: 0, l: 0, totalGames: 0 };
    challengeSeasonTeams = null;
    
    // 친선경기 기본값 리셋
    friendlyMatchesHistory = { w: 0, d: 0, l: 0, pts: 0 };
    friendlyCurrentOpponentIndex = 0;
    friendlyMatchesToday = 0;
    friendlyMatchLastDate = "";
    
    if (typeof resetLeagueSeasonState === 'function') resetLeagueSeasonState();
}

function loadChallengeState() {
    const rawId = (typeof currentUser === 'string' && currentUser) ? currentUser.trim() : (localStorage.getItem('fc_star_current_user') || "");
    const myId = rawId.toLowerCase();
    try {
        let savedSeason = null;
        let savedStage = null;
        let savedBossOvr = null;
        let savedDate = null;
        let savedFreeUsed = null;
        let savedRetryUsed = null;
        let savedHistory = null;
        let savedSeasonTeams = null;

        // 1. 현재 계정의 통합 문서(`fc_star_user_${myId}`) 우선 조회
        if (myId) {
            const userDocStr = localStorage.getItem(`fc_star_user_${myId}`);
            if (userDocStr) {
                try {
                    const uDoc = JSON.parse(userDocStr);
                    if (uDoc.challengeSeason !== undefined) savedSeason = uDoc.challengeSeason.toString();
                    if (uDoc.challengeStage !== undefined) savedStage = uDoc.challengeStage.toString();
                    if (uDoc.challengeBossOvr !== undefined) savedBossOvr = uDoc.challengeBossOvr.toString();
                    if (uDoc.challengeLastDate) savedDate = uDoc.challengeLastDate;
                    if (uDoc.challengeDailyFreeUsed !== undefined) savedFreeUsed = uDoc.challengeDailyFreeUsed ? 'true' : 'false';
                    if (uDoc.challengeDailyRetryUsed !== undefined) savedRetryUsed = uDoc.challengeDailyRetryUsed ? 'true' : 'false';
                    if (uDoc.challengeHistory) savedHistory = JSON.stringify(uDoc.challengeHistory);
                    if (uDoc.challengeSeasonTeams) savedSeasonTeams = JSON.stringify(uDoc.challengeSeasonTeams);
                } catch(e) {}
            }
        }

        // 2. ID별 키 조회 (통합 문서에 없는 경우)
        if (myId) {
            if (!savedSeason) savedSeason = localStorage.getItem(`fc_star_challenge_season_${myId}`);
            if (!savedStage) savedStage = localStorage.getItem(`fc_star_challenge_stage_${myId}`);
            if (!savedBossOvr) savedBossOvr = localStorage.getItem(`fc_star_challenge_boss_ovr_${myId}`);
            if (!savedDate) savedDate = localStorage.getItem(`fc_star_challenge_last_date_${myId}`);
            if (savedFreeUsed === null) savedFreeUsed = localStorage.getItem(`fc_star_challenge_free_used_${myId}`);
            if (savedRetryUsed === null) savedRetryUsed = localStorage.getItem(`fc_star_challenge_retry_used_${myId}`);
            if (!savedHistory) savedHistory = localStorage.getItem(`fc_star_challenge_history_${myId}`);
            if (!savedSeasonTeams) savedSeasonTeams = localStorage.getItem(`fc_star_challenge_season_teams_${myId}`);
        }

        // 3. 미로그인 단독 상태에서만 공통 키 폴백 허용 (타 계정 오염 방지)
        if (!myId) {
            if (!savedSeason) savedSeason = localStorage.getItem('fc_star_challenge_season');
            if (!savedStage) savedStage = localStorage.getItem('fc_star_challenge_stage');
            if (!savedBossOvr) savedBossOvr = localStorage.getItem('fc_star_challenge_boss_ovr');
            if (!savedDate) savedDate = localStorage.getItem('fc_star_challenge_last_date');
            if (savedFreeUsed === null) savedFreeUsed = localStorage.getItem('fc_star_challenge_free_used');
            if (savedRetryUsed === null) savedRetryUsed = localStorage.getItem('fc_star_challenge_retry_used');
            if (!savedHistory) savedHistory = localStorage.getItem('fc_star_challenge_history');
            if (!savedSeasonTeams) savedSeasonTeams = localStorage.getItem('fc_star_challenge_season_teams');
        }

        if (savedSeason) {
            const parsedSeason = parseInt(savedSeason);
            if (!isNaN(parsedSeason) && parsedSeason >= 1) challengeSeason = parsedSeason;
        }
        if (savedStage) {
            const parsedStage = parseInt(savedStage);
            if (!isNaN(parsedStage) && parsedStage >= 1 && parsedStage <= 10) challengeStage = parsedStage;
        }
        if (savedBossOvr) {
            const parsedBossOvr = parseInt(savedBossOvr);
            if (!isNaN(parsedBossOvr) && parsedBossOvr >= 80) challengeBossOvr = parsedBossOvr;
        }

        if (savedSeasonTeams) {
            try { challengeSeasonTeams = JSON.parse(savedSeasonTeams); } catch(e) { challengeSeasonTeams = null; }
        }

        const todayStr = getChallengeTodayDateString();
        challengeLastDate = savedDate || todayStr;

        if (savedDate === todayStr) {
            challengeDailyFreeUsed = savedFreeUsed === 'true';
            challengeDailyRetryUsed = savedRetryUsed === 'true';
        } else {
            // 새 날짜인 경우 일일 사용량 리셋
            challengeDailyFreeUsed = false;
            challengeDailyRetryUsed = false;
            challengeLastDate = todayStr;
            saveChallengeState();
        }

        if (savedHistory) {
            try { challengeHistory = JSON.parse(savedHistory); } catch(e) {}
        }
    } catch (e) {
        console.warn("도전모드 로드 에러:", e);
    }
}

function saveChallengeState() {
    const rawId = (typeof currentUser === 'string' && currentUser) ? currentUser.trim() : (localStorage.getItem('fc_star_current_user') || "");
    const myId = rawId.toLowerCase();
    try {
        // 1. ID별 전용 키 저장
        if (myId) {
            localStorage.setItem(`fc_star_challenge_season_${myId}`, challengeSeason.toString());
            localStorage.setItem(`fc_star_challenge_stage_${myId}`, challengeStage.toString());
            localStorage.setItem(`fc_star_challenge_boss_ovr_${myId}`, (challengeBossOvr || 98).toString());
            localStorage.setItem(`fc_star_challenge_last_date_${myId}`, challengeLastDate || getChallengeTodayDateString());
            localStorage.setItem(`fc_star_challenge_free_used_${myId}`, challengeDailyFreeUsed ? 'true' : 'false');
            localStorage.setItem(`fc_star_challenge_retry_used_${myId}`, challengeDailyRetryUsed ? 'true' : 'false');
            localStorage.setItem(`fc_star_challenge_history_${myId}`, JSON.stringify(challengeHistory));
            if (challengeSeasonTeams && Array.isArray(challengeSeasonTeams)) {
                localStorage.setItem(`fc_star_challenge_season_teams_${myId}`, JSON.stringify(challengeSeasonTeams));
            }
        } else {
            // 미로그인 단독 상태일 때만 공통 키 저장
            localStorage.setItem('fc_star_challenge_season', challengeSeason.toString());
            localStorage.setItem('fc_star_challenge_stage', challengeStage.toString());
            localStorage.setItem('fc_star_challenge_boss_ovr', (challengeBossOvr || 98).toString());
            localStorage.setItem('fc_star_challenge_last_date', challengeLastDate || getChallengeTodayDateString());
            localStorage.setItem('fc_star_challenge_free_used', challengeDailyFreeUsed ? 'true' : 'false');
            localStorage.setItem('fc_star_challenge_retry_used', challengeDailyRetryUsed ? 'true' : 'false');
            localStorage.setItem('fc_star_challenge_history', JSON.stringify(challengeHistory));
            if (challengeSeasonTeams && Array.isArray(challengeSeasonTeams)) {
                localStorage.setItem('fc_star_challenge_season_teams', JSON.stringify(challengeSeasonTeams));
            }
        }
    } catch (e) {
        console.warn("도전모드 저장 에러:", e);
    }
}

try {
    loadChallengeState();
} catch (e) {}

