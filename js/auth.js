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
// 15. USER AUTHENTICATION & CLOUD DATA SYNC SERVICE LOGIC
// ==========================================================================

function saveUserProgress() {
    if (!currentUser) return;
    if (!isCloudDataSynced) {
        console.warn("⚠️ [Save Blocked] 클라우드 데이터가 아직 동기화되지 않았으므로 업로드를 차단합니다.");
        return;
    }
    
    const myId = currentUser;
    const progressData = {
        userPoints: userPoints,
        userLevel: userLevel,
        playerDeck: playerDeck,
        squadFormation: squadFormation,
        squadFormations: squadFormations,
        currentFormation: currentFormation,
        squadNumbers: squadNumbers,
        squadCaptain: squadCaptain,
        leagueRound: leagueRound,
        leagueTeams: leagueTeams,
        quizOffset: quizOffset,
        quizLastDate: quizLastDate,
        quizQueue: quizQueue,
        quizSolvedCount: quizSolvedCount,
        quizCurrentIndex: quizCurrentIndex,
        matchLastDate: matchLastDate,
        matchTodayCount: matchTodayCount,
        lastLoginDate: lastLoginDate,
        leagueYear: leagueYear,
        hallOfFame: hallOfFame,
        leaguePlayerStats: leaguePlayerStats,
        careerStats: careerStats,
        careerStatsHard: careerStatsHard,
        pvpStats: typeof userPvpStats !== 'undefined' ? userPvpStats : { w: 0, d: 0, l: 0 },
        pvpOpponentStats: typeof userPvpOpponentStats !== 'undefined' ? userPvpOpponentStats : {},
        cupState: typeof cupState !== 'undefined' ? cupState : null,
        aclState: typeof aclState !== 'undefined' ? aclState : null,
        isHardMode: isHardMode,
        userAchievements: userAchievements,
        consecutiveLeagueTitles: consecutiveLeagueTitles,
        currentWinStreak: currentWinStreak,
        maxWinStreak: maxWinStreak,
        wingerStyles: typeof wingerStyles !== 'undefined' ? wingerStyles : { LW: 'dribble', RW: 'sprint' },
        strikerStyles: typeof strikerStyles !== 'undefined' ? strikerStyles : { ST: 'targetman' },
        
        // 친선경기 ID별 실시간 클라우드 전적 연동 필드
        friendlyMatchesHistory: typeof friendlyMatchesHistory !== 'undefined' ? friendlyMatchesHistory : { w: 0, d: 0, l: 0, pts: 0 },
        friendlyCurrentOpponentIndex: typeof friendlyCurrentOpponentIndex !== 'undefined' ? friendlyCurrentOpponentIndex : 0,
        friendlyMatchesToday: typeof friendlyMatchesToday !== 'undefined' ? friendlyMatchesToday : 0,
        friendlyMatchLastDate: typeof friendlyMatchLastDate !== 'undefined' ? friendlyMatchLastDate : "",
        friendlySeasonStartDate: localStorage.getItem(`fc_star_friendly_season_start_date_${myId}`) || new Date().toISOString(),
        lastSyncedUpdatedAt: lastSyncedUpdatedAt
    };
    
    dbService.saveProgress(currentUser, progressData);
}

function syncUserDataOnLogin(userData) {
    if (!userData) return;
    
    try {
        // Restore progress
        lastSyncedUpdatedAt = userData.updatedAt || "";
        userPoints = userData.userPoints || 0;
        userLevel = userData.userLevel || 1;
        playerDeck = userData.playerDeck || {};
        currentFormation = userData.currentFormation || '4-4-2';
        isHardMode = userData.isHardMode || false;
        wingerStyles = userData.wingerStyles || { LW: 'dribble', RW: 'sprint' };
        localStorage.setItem('fc_star_winger_styles', JSON.stringify(wingerStyles));
        strikerStyles = userData.strikerStyles || { ST: 'targetman' };
        localStorage.setItem('fc_star_striker_styles', JSON.stringify(strikerStyles));
        
        squadFormations = userData.squadFormations || {
            '4-4-2': {},
            '4-3-3': {},
            '3-4-3': {},
            '5-4-1': {},
            '4-2-3-1': {}
        };
        // Migrate old flat format if necessary
        if (!userData.squadFormations && userData.squadFormation) {
            squadFormations[currentFormation] = userData.squadFormation;
        }
        // Ensure all are objects
        ['4-4-2', '4-3-3', '3-4-3', '5-4-1', '4-2-3-1'].forEach(f => {
            if (!squadFormations[f] || typeof squadFormations[f] !== 'object') {
                squadFormations[f] = {};
            }
        });
        squadFormation = squadFormations[currentFormation];
        squadCaptain = userData.squadCaptain || null;
        leagueRound = userData.leagueRound || 1;
        
        squadNumbers = userData.squadNumbers || {};
        // 기존 세이브 데이터가 있거나 없는 경우 모두 90번까지 슬롯을 채워줍니다.
        for (let i = 1; i <= 90; i++) {
            if (!squadNumbers[i]) {
                squadNumbers[i] = { number: i, cardId: null };
            }
        }
        
        // CARDS_DATABASE 기준 최신 구조 동기화 (하이드레이션)
        if (typeof CARDS_DATABASE !== 'undefined' && CARDS_DATABASE) {
            Object.keys(playerDeck).forEach(key => {
                if (CARDS_DATABASE[key]) {
                    playerDeck[key].card = CARDS_DATABASE[key];
                } else {
                    delete playerDeck[key];
                }
            });
        }
        
        if (userData.leagueTeams && userData.leagueTeams.length > 0) {
            leagueTeams = userData.leagueTeams;
            if (typeof checkAndMigrateLeagueTeams === 'function') {
                checkAndMigrateLeagueTeams();
            }
        } else {
            // Fallback: reset teams if none exists
            resetLeagueSeasonState();
        }
        
        // Firebase에 보관된 퀴즈 진도 데이터 동기화
        quizOffset = userData.quizOffset || 0;
        quizLastDate = userData.quizLastDate || "";
        quizQueue = userData.quizQueue || [];
        quizSolvedCount = userData.quizSolvedCount || 0;
        quizCurrentIndex = userData.quizCurrentIndex || 0;
        matchLastDate = userData.matchLastDate || "";
        matchTodayCount = userData.matchTodayCount || 0;
        lastLoginDate = userData.lastLoginDate || "";
        
        // 하루 최초 로그인 시 포인트 3점 지급 판정
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
        
        // 리그 연도 및 명예의 전당 클라우드 데이터 복원
        leagueYear = userData.leagueYear || 2026;
        hallOfFame = userData.hallOfFame || [];
        leaguePlayerStats = userData.leaguePlayerStats || {};
        if (Object.keys(leaguePlayerStats).length === 0) {
            initLeaguePlayerStats();
        }
        
        careerStats = userData.careerStats || { w: 0, d: 0, l: 0, gf: 0, ga: 0, playerGoals: {} };
        careerStatsHard = userData.careerStatsHard || { w: 0, d: 0, l: 0, gf: 0, ga: 0, playerGoals: {} };
        userPvpStats = userData.pvpStats || { w: 0, d: 0, l: 0 };
        userPvpOpponentStats = userData.pvpOpponentStats || {};

        localStorage.setItem('fc_star_pvp_w', userPvpStats.w.toString());
        localStorage.setItem('fc_star_pvp_d', userPvpStats.d.toString());
        localStorage.setItem('fc_star_pvp_l', userPvpStats.l.toString());
        localStorage.setItem('fc_star_pvp_opp_stats', JSON.stringify(userPvpOpponentStats));
        
        // 업적 및 연승 클라우드 데이터 복원
        userAchievements = userData.userAchievements || {
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
        consecutiveLeagueTitles = userData.consecutiveLeagueTitles || 0;
        currentWinStreak = userData.currentWinStreak || 0;
        maxWinStreak = userData.maxWinStreak || 0;
        
        // 코리아컵 상태 클라우드 데이터 복원
        if (userData.cupState) {
            cupState = userData.cupState;
            localStorage.setItem('fc_star_cup_state', JSON.stringify(cupState));
            if (typeof initCup === 'function') {
                initCup();
            }
        }
        
        // 아챔 상태 클라우드 데이터 복원
        if (userData.aclState) {
            aclState = userData.aclState;
            localStorage.setItem('fc_star_acl_state', JSON.stringify(aclState));
            if (typeof initAcl === 'function') {
                initAcl();
            }
        }
        
        // 클라우드에서 친선경기 전적 및 릴레이 인덱스 상태 복원
        const myId = currentUser;
        friendlyMatchesHistory = userData.friendlyMatchesHistory || { w: 0, d: 0, l: 0, pts: 0 };
        friendlyCurrentOpponentIndex = userData.friendlyCurrentOpponentIndex || 0;
        friendlyMatchesToday = userData.friendlyMatchesToday || 0;
        friendlyMatchLastDate = userData.friendlyMatchLastDate || "";
        
        localStorage.setItem(`fc_star_friendly_history_${myId}`, JSON.stringify(friendlyMatchesHistory));
        localStorage.setItem(`fc_star_friendly_current_index_${myId}`, friendlyCurrentOpponentIndex.toString());
        localStorage.setItem(`fc_star_friendly_matches_today_${myId}`, friendlyMatchesToday.toString());
        localStorage.setItem(`fc_star_friendly_match_last_date_${myId}`, friendlyMatchLastDate);
        if (userData.friendlySeasonStartDate) {
            localStorage.setItem(`fc_star_friendly_season_start_date_${myId}`, userData.friendlySeasonStartDate);
        }
        
        // Sync local storage so it serves as offline cache
        localStorage.setItem('fc_star_user_points', userPoints.toString());
        localStorage.setItem('fc_star_user_level', userLevel.toString());
        localStorage.setItem('fc_star_player_deck', JSON.stringify(playerDeck));
        localStorage.setItem('fc_star_squad_formations', JSON.stringify(squadFormations));
        localStorage.setItem('fc_star_squad_formation', JSON.stringify(squadFormation));
        localStorage.setItem('fc_star_current_formation', currentFormation);
        localStorage.setItem('fc_star_league_teams', JSON.stringify(leagueTeams));
        localStorage.setItem('fc_star_league_round', leagueRound.toString());
        localStorage.setItem('fc_star_quiz_offset', quizOffset.toString());
        localStorage.setItem('fc_star_quiz_last_date', quizLastDate);
        localStorage.setItem('fc_star_quiz_queue', JSON.stringify(quizQueue));
        localStorage.setItem('fc_star_quiz_solved_count', quizSolvedCount.toString());
        localStorage.setItem('fc_star_quiz_current_index', quizCurrentIndex.toString());
        localStorage.setItem('fc_star_match_last_date', matchLastDate);
        localStorage.setItem('fc_star_match_today_count', matchTodayCount.toString());
        localStorage.setItem('fc_star_last_login_date', lastLoginDate);
        localStorage.setItem('fc_star_league_year', leagueYear.toString());
        localStorage.setItem('fc_star_hall_of_fame', JSON.stringify(hallOfFame));
        localStorage.setItem('fc_star_league_stats', JSON.stringify(leaguePlayerStats));
        localStorage.setItem('fc_star_career_stats', JSON.stringify(careerStats));
        localStorage.setItem('fc_star_career_stats_hard', JSON.stringify(careerStatsHard));
        localStorage.setItem('fc_star_squad_numbers', JSON.stringify(squadNumbers));
        localStorage.setItem('fc_star_is_hard_mode', isHardMode.toString());
        localStorage.setItem('fc_star_last_synced_updated_at', lastSyncedUpdatedAt);
        localStorage.setItem('fc_star_user_achievements', JSON.stringify(userAchievements));
        localStorage.setItem('fc_star_consecutive_titles', consecutiveLeagueTitles.toString());
        localStorage.setItem('fc_star_current_win_streak', currentWinStreak.toString());
        localStorage.setItem('fc_star_max_win_streak', maxWinStreak.toString());
        localStorage.setItem('fc_star_winger_styles', JSON.stringify(wingerStyles));
        localStorage.setItem('fc_star_striker_styles', JSON.stringify(strikerStyles));
        
        // 개발자 모드 UI 연동 복원
        updateDevModeUI();
        
        // Refresh all screens
        if (typeof updateGlowTheme === 'function') updateGlowTheme();
        renderUserPoints();
        updateTotalCardCount();
        renderDeck();
        renderSquadFormation();
        syncJeonbukOvr();
        updateMatchPreviewBoard();
        renderLeagueTable();
        renderLeagueStats();
        renderCareerStats();
        if (typeof initCupTab === 'function') {
            initCupTab();
        }
        if (typeof initAclTab === 'function') {
            initAclTab();
        }
        if (typeof renderAchievements === 'function') {
            renderAchievements();
        }
        
        // Refresh Auth Badge
        updateAuthBadgeUI();
        
        // 동기화 완료 상태 마크
        isCloudDataSynced = true;
    } catch (e) {
        console.error("데이터 동기화 실패:", e);
        alert("계정 데이터 동기화 도중 에러가 발생했습니다: " + e.message);
    }
}

function updateAuthBadgeUI() {
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
    
    isAuthSubmitting = true;
    const btnSubmit = document.getElementById('btnSubmitAuth');
    if (btnSubmit) btnSubmit.disabled = true;
    
    showToast(`${authMode === 'login' ? '로그인' : '회원가입'} 진행 중...`);
    
    try {
        if (authMode === 'login') {
            // LOGIN PROCESS
            const userData = await dbService.login(id, pw);
            currentUser = userData.id;
            
            // Sync and refresh
            syncUserDataOnLogin(userData);
            
            // Keep session
            localStorage.setItem('fc_star_current_user', currentUser);
            
            closeAuthModal();
            showToast(`환영합니다! ${currentUser.toUpperCase()} 계정으로 로그인되었습니다.`);
        } else {
            // REGISTER PROCESS
            const defaultData = await dbService.register(id, pw);
            currentUser = defaultData.id;
            
            // Sync & automatically save existing local progress (if any) as first upload
            syncUserDataOnLogin(defaultData);
            
            // Backup existing local data to cloud immediately
            saveUserProgress();
            
            // Keep session
            localStorage.setItem('fc_star_current_user', currentUser);
            
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
        
        currentUser = guestId;
        localStorage.setItem('fc_star_current_user', guestId);
        
        // Sync and refresh
        if (userData) {
            syncUserDataOnLogin(userData);
            // Backup existing local data to cloud immediately (just in case they had offline progress before registering)
            saveUserProgress();
        }
        
        closeAuthModal();
        showToast("게스트 모드로 게임을 시작합니다!");
    } catch (err) {
        console.warn("⚠️ 클라우드 게스트 생성 실패 (오프라인 모드 진입):", err);
        // Offline / network fallback: directly start guest mode locally
        currentUser = guestId;
        localStorage.setItem('fc_star_current_user', guestId);
        
        // Trigger UI rendering
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

function handleLogout() {
    const confirmLogout = confirm("정말 로그아웃 하시겠습니까?\n로그아웃 시 비회원 로컬 모드로 전환됩니다.");
    if (confirmLogout) {
        currentUser = null;
        isCloudDataSynced = false;
        localStorage.removeItem('fc_star_current_user');
        
        // Clean active local states to avoid leakage, then reload
        localStorage.removeItem('fc_star_user_points');
        localStorage.removeItem('fc_star_player_deck');
        localStorage.removeItem('fc_star_squad_formations');
        localStorage.removeItem('fc_star_squad_formation');
        localStorage.removeItem('fc_star_league_teams');
        localStorage.removeItem('fc_star_league_round');
        localStorage.removeItem('fc_star_squad_numbers');
        localStorage.removeItem('fc_star_squad_captain');
        localStorage.removeItem('fc_star_cup_state');
        localStorage.removeItem('fc_star_pvp_w');
        localStorage.removeItem('fc_star_pvp_d');
        localStorage.removeItem('fc_star_pvp_l');
        localStorage.removeItem('fc_star_pvp_opp_stats');
        localStorage.removeItem('fc_star_winger_styles');
        
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
            "레벨 10이 되면 특급 윙어 <strong>'이승우'</strong>, 레벨 20이 되면 월드클래스 <strong>'손흥민'</strong>, 레벨 30이 되면 파리의 마술사 <strong>'이강인'</strong>, 레벨 40이 되면 태극전사 <strong>'이승우(스페셜)'</strong>, 레벨 50이 되면 영원한 산소탱크 <strong>'박지성'</strong>, 레벨 60이 되면 마스터 플레이메이커 <strong>'기성용'</strong>, 레벨 70이 되면 괴물 수비수 <strong>'김민재'</strong>, 레벨 80이 되면 중원의 열정 엔진 <strong>'이재성'</strong>, 레벨 90이 되면 왼발의 마술사 <strong>'이동경'</strong> 특별 카드, 레벨 110이 되면 대한민국의 핵심 사령탑 <strong>'황인범'</strong> 특별 카드, 레벨 120이 되면 대한민국 황소 <strong>'황희찬'</strong> 특별 카드, 레벨 130이 되면 대구 FC의 전설 <strong>'세징야'</strong> 특별 카드, 레벨 140이 되면 포항의 젊은 사자 <strong>'이동국99'</strong> 특별 카드, 레벨 150이 되면 대한민국 축구 영웅 <strong>'안정환'</strong> 전설 카드가 지급되며, 레벨 160부터는 10레벨 달성 시마다 <strong>5 FP(포인트)</strong>를 받으실 수 있습니다!<br><br>열심히 단어 공부를 하고 특별한 혜택을 쟁취해보세요!"
        );
    } else if (level > 0 && level % 10 === 0) {
        if (level > 150) {
            // 레벨 150부터는 5 FP 지급
            userPoints += 5;
            try {
                localStorage.setItem('fc_star_user_points', userPoints.toString());
            } catch(e) {}
            renderUserPoints();
            saveUserProgress();
            
            showLevelRewardModal(
                "🎁 특별 레벨업 보상 🎁",
                `Lv. ${level} 달성을 축하합니다!`,
                `축하합니다! 레벨 ${level} 도달 기념으로 특별 보상인 <strong>5 FP(포인트)</strong>가 지급되었습니다!<br><br>앞으로도 레벨 10이 오를 때마다 5 FP가 지급됩니다!`
            );
            return;
        }

        let cardId = "";
        let isRandom = false;
        
        if (level === 10) {
            cardId = "lee_seung_woo";
        } else if (level === 20) {
            cardId = "son_heung_min";
        } else if (level === 30) {
            cardId = "lee_kang_in";
        } else if (level === 40) {
            cardId = "lee_seung_woo_kr";
        } else if (level === 50) {
            cardId = "park_ji_sung";
        } else if (level === 60) {
            cardId = "ki_sung_yueng";
        } else if (level === 70) {
            cardId = "kim_min_jae";
        } else if (level === 80) {
            cardId = "lee_jae_sung";
        } else if (level === 90) {
            cardId = "lee_dong_gyeong";
        } else if (level === 110) {
            cardId = "hwang_in_beom";
        } else if (level === 120) {
            cardId = "hwang_hee_chan";
        } else if (level === 130) {
            cardId = "cesinha";
        } else if (level === 140) {
            cardId = "lee_dong_gook_99";
        } else if (level === 150) {
            cardId = "ahn_jung_hwan";
        } else {
            // Award random card (e.g. level 100)
            if (typeof CARDS_DATABASE !== 'undefined') {
                const keys = Object.keys(CARDS_DATABASE);
                if (keys.length > 0) {
                    cardId = keys[Math.floor(Math.random() * keys.length)];
                    isRandom = true;
                }
            }
        }
        
        if (cardId && typeof CARDS_DATABASE !== 'undefined' && CARDS_DATABASE[cardId]) {
            const cardObj = CARDS_DATABASE[cardId];
            let detailMsg = "";
            if (playerDeck[cardId]) {
                playerDeck[cardId].quantity = 1;
                if (typeof playerDeck[cardId].awakening !== 'number') {
                    playerDeck[cardId].awakening = 0;
                }
                if (playerDeck[cardId].awakening < 5) {
                    playerDeck[cardId].awakening += 1;
                    detailMsg = `(보유 중인 ${cardObj.name} 카드가 <strong>★${playerDeck[cardId].awakening} 각성</strong>으로 한층 강해졌습니다!)`;
                } else {
                    detailMsg = `(이미 ${cardObj.name} 카드가 최대 각성 상태(5각성)입니다.)`;
                }
            } else {
                playerDeck[cardId] = {
                    card: cardObj,
                    quantity: 1,
                    awakening: 0
                };
                detailMsg = `(내 컬렉션(덱)에 새로운 선수로 안전하게 지급되었습니다!)`;
            }
            
            // Save state
            try {
                localStorage.setItem('fc_star_player_deck', JSON.stringify(playerDeck));
            } catch(e) {}
            saveUserProgress();
            
            let awardMessage = "";
            if (level === 10) {
                awardMessage = `축하합니다! 레벨 10 도달 기념으로 전북 현대 최고의 특급 윙어 <strong>'이승우'</strong> 선수카드가 지급되었습니다!<br><br>${detailMsg}`;
            } else if (level === 20) {
                awardMessage = `축하합니다! 레벨 20 도달 기념으로 대한민국 최고의 월드클래스 슈퍼스타 <strong>'손흥민'</strong> 선수카드가 지급되었습니다!<br><br>${detailMsg}`;
            } else if (level === 30) {
                awardMessage = `축하합니다! 레벨 30 도달 기념으로 파리 생제르맹(PSG)의 보석이자 천재 미드필더 <strong>'이강인'</strong> 전설 카드가 지급되었습니다!<br><br>${detailMsg}`;
            } else if (level === 40) {
                awardMessage = `축하합니다! 레벨 40 도달 기념으로 태극 마크를 단 최고의 국가대표 <strong>'이승우'</strong> 스페셜 선수카드가 지급되었습니다!<br><br>${detailMsg}`;
            } else if (level === 50) {
                awardMessage = `축하합니다! 레벨 50 도달 기념으로 맨체스터 유나이티드의 전설이자 영원한 캡틴 <strong>'박지성'</strong> 전설 카드가 지급되었습니다!<br><br>${detailMsg}`;
            } else if (level === 60) {
                awardMessage = `축하합니다! 레벨 60 도달 기념으로 국가대표 최고의 딥라잉 플레이메이커이자 캡틴 <strong>'기성용'</strong> 전설 카드가 지급되었습니다!<br><br>${detailMsg}`;
            } else if (level === 70) {
                awardMessage = `축하합니다! 레벨 70 도달 기념으로 대한민국 최고의 피지컬 괴물 수비수 <strong>'김민재'</strong> 전설 카드가 지급되었습니다!<br><br>${detailMsg}`;
            } else if (level === 80) {
                awardMessage = `축하합니다! 레벨 80 도달 기념으로 대한민국 국가대표 중원의 엔진이자 에이스 <strong>'이재성'</strong> 스페셜 카드가 지급되었습니다!<br><br>${detailMsg}`;
            } else if (level === 90) {
                awardMessage = `축하합니다! 레벨 90 도달 기념으로 왼발의 마술사라 불리는 대한민국 최고의 테크니션 미드필더 <strong>'이동경'</strong> 스페셜 카드가 지급되었습니다!<br><br>${detailMsg}`;
            } else if (level === 110) {
                awardMessage = `축하합니다! 레벨 110 도달 기념으로 대한민국 국가대표 중원의 마에스트로 <strong>'황인범'</strong> 스페셜 카드가 지급되었습니다!<br><br>${detailMsg}`;
            } else if (level === 120) {
                awardMessage = `축하합니다! 레벨 120 도달 기념으로 대한민국 프리미어리거 '황소' <strong>'황희찬'</strong> 스페셜 카드가 지급되었습니다!<br><br>${detailMsg}`;
            } else if (level === 130) {
                awardMessage = `축하합니다! 레벨 130 도달 기념으로 대구 FC의 살아있는 전설 <strong>'세징야'</strong> 스페셜 카드가 지급되었습니다!<br><br>${detailMsg}`;
            } else if (level === 140) {
                awardMessage = `축하합니다! 레벨 140 도달 기념으로 포항 스틸러스 시절 신인왕과 득점왕을 거머쥐었던 젊은 사자 <strong>'이동국99'</strong> 스페셜 카드가 지급되었습니다!<br><br>${detailMsg}`;
            } else if (level === 150) {
                awardMessage = `축하합니다! 레벨 150 도달 기념으로 대한민국 최고의 판타지스타이자 테크니션 <strong>'안정환'</strong> 전설 카드가 지급되었습니다!<br><br>${detailMsg}`;
            } else {
                awardMessage = `축하합니다! 레벨 ${level} 도달 기념으로 K리그 최고의 스타 <strong>'${cardObj.name}'</strong> 선수카드가 무작위 특별 보상으로 지급되었습니다!<br><br>${detailMsg}`;
            }
                
            let subText = "앞으로도 레벨 10이 오를 때마다 '특별한' 선물이 지급됩니다!";
            if (level === 140) {
                subText = "앞으로 레벨 150 달성 시 대한민국 축구 영웅 '안정환' 전설 카드가 지급됩니다!";
            } else if (level === 150) {
                subText = "앞으로 레벨 160부터는 10레벨마다 5 FP가 지급됩니다!";
            }
            showLevelRewardModal(
                "🎁 특별 레벨업 보상 🎁",
                `Lv. ${level} 달성을 축하합니다!`,
                `${awardMessage}<br><br>${subText}`
            );
        }
    }
}
