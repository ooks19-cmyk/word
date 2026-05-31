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

// REAL-TIME USER AUTH & DATA SYNC STATE
let currentUser = null;
let authMode = 'login'; // 'login' or 'register'
let isAuthSubmitting = false;

// DEVELOPER MODE & MULTI-YEAR LEAGUE STATE VARIABLES
let isDeveloperMode = false;
let leagueYear = 2026;
let hallOfFame = [];
let careerStats = { w: 0, d: 0, l: 0, gf: 0, ga: 0, playerGoals: {} };

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
let isQuizTtsAutoplay = false;
try {
    const savedAutoplay = localStorage.getItem('fc_star_quiz_tts_autoplay');
    if (savedAutoplay !== null) {
        isQuizTtsAutoplay = savedAutoplay === 'true';
    }
} catch (e) {
    isQuizTtsAutoplay = false;
}

// 4. SQUAD NUMBERS STATE (등번호 설정 데이터 1~30)
let squadNumbers = {};
try {
    const savedNumbers = localStorage.getItem('fc_star_squad_numbers');
    if (savedNumbers) {
        squadNumbers = JSON.parse(savedNumbers);
    } else {
        // 기본 1~30번 데이터셋 구성
        for (let i = 1; i <= 30; i++) {
            squadNumbers[i] = { number: i, cardId: null };
        }
    }
} catch (e) {
    squadNumbers = {};
    for (let i = 1; i <= 30; i++) {
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


