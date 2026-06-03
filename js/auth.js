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
    
    const myId = currentUser;
    const progressData = {
        userPoints: userPoints,
        userLevel: userLevel,
        playerDeck: playerDeck,
        squadFormation: squadFormation,
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
        
        // 친선경기 ID별 실시간 클라우드 전적 연동 필드
        friendlyMatchesHistory: typeof friendlyMatchesHistory !== 'undefined' ? friendlyMatchesHistory : { w: 0, d: 0, l: 0, pts: 0 },
        friendlyCurrentOpponentIndex: typeof friendlyCurrentOpponentIndex !== 'undefined' ? friendlyCurrentOpponentIndex : 0,
        friendlyMatchesToday: typeof friendlyMatchesToday !== 'undefined' ? friendlyMatchesToday : 0,
        friendlyMatchLastDate: typeof friendlyMatchLastDate !== 'undefined' ? friendlyMatchLastDate : "",
        friendlySeasonStartDate: localStorage.getItem(`fc_star_friendly_season_start_date_${myId}`) || new Date().toISOString()
    };
    
    dbService.saveProgress(currentUser, progressData);
}

function syncUserDataOnLogin(userData) {
    if (!userData) return;
    
    try {
        // Restore progress
        userPoints = userData.userPoints || 0;
        userLevel = userData.userLevel || 1;
        playerDeck = userData.playerDeck || {};
        squadFormation = userData.squadFormation || {};
        currentFormation = userData.currentFormation || '4-4-2';
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
        localStorage.setItem('fc_star_squad_numbers', JSON.stringify(squadNumbers));
        
        // 개발자 모드 UI 연동 복원
        updateDevModeUI();
        
        // Refresh all screens
        renderUserPoints();
        updateTotalCardCount();
        renderDeck();
        renderSquadFormation();
        syncJeonbukOvr();
        updateMatchPreviewBoard();
        renderLeagueTable();
        renderLeagueStats();
        renderCareerStats();
        
        // Refresh Auth Badge
        updateAuthBadgeUI();
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

function handleLogout() {
    const confirmLogout = confirm("정말 로그아웃 하시겠습니까?\n로그아웃 시 비회원 로컬 모드로 전환됩니다.");
    if (confirmLogout) {
        currentUser = null;
        localStorage.removeItem('fc_star_current_user');
        
        // Clean active local states to avoid leakage, then reload
        localStorage.removeItem('fc_star_user_points');
        localStorage.removeItem('fc_star_player_deck');
        localStorage.removeItem('fc_star_squad_formation');
        localStorage.removeItem('fc_star_league_teams');
        localStorage.removeItem('fc_star_league_round');
        localStorage.removeItem('fc_star_squad_numbers');
        localStorage.removeItem('fc_star_squad_captain');
        
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
            "레벨 10이 되면 특급 윙어 <strong>'이승우'</strong>, 레벨 20이 되면 월드클래스 <strong>'손흥민'</strong>, 레벨 30이 되면 파리의 마술사 <strong>'이강인'</strong>, 레벨 40이 되면 태극전사 <strong>'이승우(스페셜)'</strong>, 레벨 50이 되면 영원한 산소탱크 <strong>'박지성'</strong>, 레벨 60이 되면 마스터 플레이메이커 <strong>'기성용'</strong>, 레벨 70이 되면 괴물 수비수 <strong>'김민재'</strong> 전설 카드 등 특별한 보상을 즉시 받으실 수 있습니다!<br><br>열심히 단어 공부를 하고 특별한 혜택을 쟁취해보세요!"
        );
    } else if (level > 0 && level % 10 === 0) {
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
        } else {
            // Award random card
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
            } else {
                awardMessage = `축하합니다! 레벨 ${level} 도달 기념으로 K리그 최고의 스타 <strong>'${cardObj.name}'</strong> 선수카드가 무작위 특별 보상으로 지급되었습니다!<br><br>${detailMsg}`;
            }
                
            showLevelRewardModal(
                "🎁 특별 레벨업 보상 🎁",
                `Lv. ${level} 달성을 축하합니다!`,
                `${awardMessage}<br><br>앞으로도 레벨 10이 오를 때마다 '특별한' 선물이 지급됩니다!`
            );
        }
    }
}
