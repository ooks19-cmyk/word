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
let lastSyncedUpdatedAt = "";
try {
    const savedSyncedTime = localStorage.getItem('fc_star_last_synced_updated_at');
    if (savedSyncedTime) lastSyncedUpdatedAt = savedSyncedTime;
} catch (e) {
    lastSyncedUpdatedAt = "";
}

// DEVELOPER MODE & MULTI-YEAR LEAGUE STATE VARIABLES
let isDeveloperMode = false;
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


