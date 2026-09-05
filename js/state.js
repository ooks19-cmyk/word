// js/state.js - 전역 상태 관리 모듈

// CARDS_DATABASE is now loaded dynamically from player/player_data.js

// 1. USER POINTS & LEVEL STATE (FP & Level)
let userPoints = 0;
try {
    const savedPoints = localStorage.getItem('fc_star_user_points');
    if (savedPoints !== null) {
        userPoints = parseInt(savedPoints);
        if (isNaN(userPoints) || userPoints < 0) userPoints = 0;
    }
} catch (e) {
    userPoints = 0;
}

let userLevel = 1;
try {
    const savedLevel = localStorage.getItem('fc_star_user_level');
    if (savedLevel !== null) {
        userLevel = parseInt(savedLevel);
        if (isNaN(userLevel) || userLevel < 1) userLevel = 1;
    }
} catch (e) {
    userLevel = 1;
}

// 1.5 HARD MODE STATE
let isHardMode = false;
try {
    const savedHardMode = localStorage.getItem('fc_star_is_hard_mode');
    if (savedHardMode !== null) {
        isHardMode = savedHardMode === 'true';
    }
} catch (e) {
    isHardMode = false;
}

// 2. PLAYER DECK STATE (Loaded from LocalStorage with robust error handling)
let playerDeck = {};
try {
    const savedDeck = localStorage.getItem('fc_star_player_deck');
    if (savedDeck) {
        playerDeck = JSON.parse(savedDeck);
        if (!playerDeck || Array.isArray(playerDeck) || typeof playerDeck !== 'object') {
            playerDeck = {};
        }
        
        // Sync structures for both players
        Object.keys(playerDeck).forEach(key => {
            if (typeof CARDS_DATABASE !== 'undefined' && CARDS_DATABASE[key]) {
                playerDeck[key].card = CARDS_DATABASE[key];
                playerDeck[key].isStored = playerDeck[key].isStored === true;
            } else {
                delete playerDeck[key]; // Cleanup legacy format cards
            }
        });
        localStorage.setItem('fc_star_player_deck', JSON.stringify(playerDeck));
    }
} catch (e) {
    console.warn("LocalStorage access blocked. Using in-memory fallback.", e);
    playerDeck = {};
}

let activePulledCard = null;
let isFlipped = false;

let quizOffset = 0;
let quizLastDate = "";
let matchLastDate = "";
let matchTodayCount = 0;
let lastLoginDate = "";
try {
    const savedLoginDate = localStorage.getItem('fc_star_last_login_date');
    if (savedLoginDate) lastLoginDate = savedLoginDate;
} catch (e) {
    lastLoginDate = "";
}

// REAL-TIME USER AUTH & DATA SYNC STATE
let currentUser = null;
let authMode = 'login'; // 'login' or 'register'
let isAuthSubmitting = false;
window.lastSyncedUpdatedAt = "";
let isCloudDataSynced = false;
try {
    const savedSyncedTime = localStorage.getItem('fc_star_last_synced_updated_at');
    if (savedSyncedTime) window.lastSyncedUpdatedAt = savedSyncedTime;
} catch (e) {
    window.lastSyncedUpdatedAt = "";
}

// DEVELOPER MODE & MULTI-YEAR LEAGUE STATE VARIABLES
let isDeveloperMode = false;
let currentLeagueId = 'kleague1'; // 'kleague1' or 'epl'
try {
    const savedLeague = localStorage.getItem('fc_star_current_league');
    if (savedLeague && (savedLeague === 'kleague1' || savedLeague === 'epl')) {
        currentLeagueId = savedLeague;
    }
} catch (e) {
    currentLeagueId = 'kleague1';
}
let currentFameLeagueTab = 'kleague1'; // 'kleague1' or 'epl'

let leagueYear = 2026;
let hallOfFame = [];
let careerStats = { w: 0, d: 0, l: 0, gf: 0, ga: 0, playerGoals: {} };
let careerStatsHard = { w: 0, d: 0, l: 0, gf: 0, ga: 0, playerGoals: {} };
try {
    const savedStats = localStorage.getItem('fc_star_career_stats');
    if (savedStats) careerStats = JSON.parse(savedStats);
} catch(e) {}
try {
    const savedStatsHard = localStorage.getItem('fc_star_career_stats_hard');
    if (savedStatsHard) careerStatsHard = JSON.parse(savedStatsHard);
} catch(e) {}

let userPvpStats = { w: 0, d: 0, l: 0 };
let userPvpOpponentStats = {}; // 상대방별 PvP 전적 { opponentId: { w: 0, d: 0, l: 0 } }
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

let currentFormation = '4-4-2';
try {
    const savedFormation = localStorage.getItem('fc_star_current_formation');
    if (savedFormation) {
        currentFormation = savedFormation;
    }
} catch (e) {
    currentFormation = '4-4-2';
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
    const savedNumbers = localStorage.getItem('fc_star_squad_numbers');
    if (savedNumbers) {
        squadNumbers = JSON.parse(savedNumbers);
        // 기존 세이브 데이터(30번까지)가 있을 경우 90번까지 채워줍니다.
        for (let i = 1; i <= 90; i++) {
            if (!squadNumbers[i]) {
                squadNumbers[i] = { number: i, cardId: null };
            }
        }
    } else {
        // 기본 1~90번 데이터셋 구성
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
let squadCaptain = null;
try {
    const savedCaptain = localStorage.getItem('fc_star_squad_captain');
    if (savedCaptain) {
        squadCaptain = savedCaptain;
    }
} catch (e) {
    squadCaptain = null;
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
    streak30: { unlocked: false, rewarded: false }
};
try {
    const savedAchievements = localStorage.getItem('fc_star_user_achievements');
    if (savedAchievements) {
        const parsed = JSON.parse(savedAchievements);
        if (parsed && typeof parsed === 'object') {
            userAchievements = { ...userAchievements, ...parsed };
        }
    }
} catch (e) {
    // Fallback
}

let consecutiveLeagueTitles = 0;
try {
    const savedTitles = localStorage.getItem('fc_star_consecutive_titles');
    if (savedTitles) {
        consecutiveLeagueTitles = parseInt(savedTitles) || 0;
    }
} catch (e) {}

let currentWinStreak = 0;
try {
    const savedCurrentStreak = localStorage.getItem('fc_star_current_win_streak');
    if (savedCurrentStreak) {
        currentWinStreak = parseInt(savedCurrentStreak) || 0;
    }
} catch (e) {}

let maxWinStreak = 0;
try {
    const savedMaxStreak = localStorage.getItem('fc_star_max_win_streak');
    if (savedMaxStreak) {
        maxWinStreak = parseInt(savedMaxStreak) || 0;
    }
} catch (e) {}

// 7. WINGER PLAYSTYLE CONFIGURATION STATE
let wingerStyles = {
    '4-4-2': { LW: 'dribble', RW: 'sprint' },
    '4-3-3': { LW: 'dribble', RW: 'sprint' },
    '3-4-3': { LW: 'dribble', RW: 'sprint' },
    '5-4-1': { LW: 'dribble', RW: 'sprint' },
    '4-2-3-1': { LW: 'dribble', RW: 'sprint' }
};
try {
    const savedWingerStyles = localStorage.getItem('fc_star_winger_styles');
    if (savedWingerStyles) {
        const parsed = JSON.parse(savedWingerStyles);
        // 마이그레이션 검사: 기존 플랫 객체인지 중첩 객체인지 판별
        if (parsed.LW || parsed.RW) {
            console.log("Migrating flat wingerStyles to nested format...");
            Object.keys(wingerStyles).forEach(f => {
                wingerStyles[f] = { 
                    LW: parsed.LW || 'dribble', 
                    RW: parsed.RW || 'sprint' 
                };
            });
        } else {
            wingerStyles = parsed;
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
    const savedStrikerStyles = localStorage.getItem('fc_star_striker_styles');
    if (savedStrikerStyles) {
        const parsed = JSON.parse(savedStrikerStyles);
        // 마이그레이션 검사: 기존 플랫 객체인지 중첩 객체인지 판별
        if (parsed.ST) {
            console.log("Migrating flat strikerStyles to nested format...");
            Object.keys(strikerStyles).forEach(f => {
                strikerStyles[f] = { 
                    ST: parsed.ST || 'targetman' 
                };
            });
        } else {
            strikerStyles = parsed;
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
            // 로컬스토리지에 저장
            localStorage.setItem('fc_star_player_deck', JSON.stringify(playerDeck));
            localStorage.setItem('fc_star_local_last_updated', Date.now().toString());
        } catch (e) {}
        
        // 클라우드 저장 (만약 auth.js 로드 후 시점이라면 즉시 저장)
        if (typeof saveUserProgress === 'function') {
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
// 🏆 CHALLENGE MODE STATE (도전모드 스테이지 시스템)
// ==========================================
let challengeSeason = 1;
let challengeStage = 1;
let challengeBossOvr = 98; // 기본 1시즌 마지막 보스 OVR 98 (시즌 종료 시 마지막 경기 시점 OVR + 1 로 갱신)
let challengeLastDate = "";
let challengeDailyFreeUsed = false;
let challengeDailyRetryUsed = false;
let challengeHistory = { w: 0, d: 0, l: 0, totalGames: 0 };

function getChallengeTodayDateString() {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function loadChallengeState() {
    const rawId = (typeof currentUser === 'string' && currentUser) ? currentUser.trim() : "ooks";
    const myId = rawId.toLowerCase();
    try {
        const savedSeason = localStorage.getItem(`fc_star_challenge_season_${myId}`) || (rawId !== myId ? localStorage.getItem(`fc_star_challenge_season_${rawId}`) : null);
        const savedStage = localStorage.getItem(`fc_star_challenge_stage_${myId}`) || (rawId !== myId ? localStorage.getItem(`fc_star_challenge_stage_${rawId}`) : null);
        const savedBossOvr = localStorage.getItem(`fc_star_challenge_boss_ovr_${myId}`) || (rawId !== myId ? localStorage.getItem(`fc_star_challenge_boss_ovr_${rawId}`) : null);
        const savedDate = localStorage.getItem(`fc_star_challenge_last_date_${myId}`) || (rawId !== myId ? localStorage.getItem(`fc_star_challenge_last_date_${rawId}`) : null);
        const savedFreeUsed = localStorage.getItem(`fc_star_challenge_free_used_${myId}`) || (rawId !== myId ? localStorage.getItem(`fc_star_challenge_free_used_${rawId}`) : null);
        const savedRetryUsed = localStorage.getItem(`fc_star_challenge_retry_used_${myId}`) || (rawId !== myId ? localStorage.getItem(`fc_star_challenge_retry_used_${rawId}`) : null);
        const savedHistory = localStorage.getItem(`fc_star_challenge_history_${myId}`) || (rawId !== myId ? localStorage.getItem(`fc_star_challenge_history_${rawId}`) : null);

        challengeSeason = savedSeason ? parseInt(savedSeason) : 1;
        challengeStage = savedStage ? parseInt(savedStage) : 1;
        challengeBossOvr = savedBossOvr ? parseInt(savedBossOvr) : 98;
        if (isNaN(challengeSeason) || challengeSeason < 1) challengeSeason = 1;
        if (isNaN(challengeStage) || challengeStage < 1 || challengeStage > 10) challengeStage = 1;
        if (isNaN(challengeBossOvr) || challengeBossOvr < 80) challengeBossOvr = 98;

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
            challengeHistory = JSON.parse(savedHistory);
        } else {
            challengeHistory = { w: 0, d: 0, l: 0, totalGames: 0 };
        }
    } catch (e) {
        console.warn("도전모드 로드 에러:", e);
    }
}

function saveChallengeState() {
    const rawId = (typeof currentUser === 'string' && currentUser) ? currentUser.trim() : "ooks";
    const myId = rawId.toLowerCase();
    try {
        localStorage.setItem(`fc_star_challenge_season_${myId}`, challengeSeason.toString());
        localStorage.setItem(`fc_star_challenge_stage_${myId}`, challengeStage.toString());
        localStorage.setItem(`fc_star_challenge_boss_ovr_${myId}`, (challengeBossOvr || 98).toString());
        localStorage.setItem(`fc_star_challenge_last_date_${myId}`, challengeLastDate || getChallengeTodayDateString());
        localStorage.setItem(`fc_star_challenge_free_used_${myId}`, challengeDailyFreeUsed ? 'true' : 'false');
        localStorage.setItem(`fc_star_challenge_retry_used_${myId}`, challengeDailyRetryUsed ? 'true' : 'false');
        localStorage.setItem(`fc_star_challenge_history_${myId}`, JSON.stringify(challengeHistory));
        localStorage.setItem('fc_star_local_last_updated', Date.now().toString());
    } catch (e) {
        console.warn("도전모드 저장 에러:", e);
    }
}

try {
    loadChallengeState();
} catch (e) {}
