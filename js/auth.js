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

let cloudSaveTimeoutId = null;
let lastCloudUploadTime = 0;
const CLOUD_SAVE_INTERVAL = 60000; // 1 minute (60,000 ms)
let lastUploadedPoints = null;
let lastUploadedDeckJson = null;

// 전체 로컬 세이브 저장 수행
function saveAllToLocalStorage() {
    const myId = currentUser || "ooks";
    try {
        localStorage.setItem('fc_star_user_points', userPoints.toString());
        localStorage.setItem('fc_star_user_level', userLevel.toString());
        localStorage.setItem('fc_star_player_deck', JSON.stringify(playerDeck));
        localStorage.setItem('fc_star_squad_formations', JSON.stringify(squadFormations));
        localStorage.setItem('fc_star_squad_formation', JSON.stringify(squadFormation));
        localStorage.setItem('fc_star_current_formation', currentFormation);
        const activeLeague = (typeof currentLeagueId !== 'undefined' && typeof LEAGUE_CONFIGS !== 'undefined' && LEAGUE_CONFIGS[currentLeagueId]) ? currentLeagueId : ((typeof currentLeagueId !== 'undefined' && (currentLeagueId === 'epl' || currentLeagueId === 'jleague' || currentLeagueId === 'kleague1')) ? currentLeagueId : 'kleague1');
        localStorage.setItem('fc_star_current_league', activeLeague);
        localStorage.setItem(`fc_star_league_teams_${activeLeague}`, JSON.stringify(leagueTeams));
        localStorage.setItem('fc_star_league_teams', JSON.stringify(leagueTeams));
        localStorage.setItem(`fc_star_league_round_${activeLeague}`, leagueRound.toString());
        localStorage.setItem('fc_star_league_round', leagueRound.toString());
        localStorage.setItem(`fc_star_league_stats_${activeLeague}`, JSON.stringify(leaguePlayerStats));
        localStorage.setItem('fc_star_league_stats', JSON.stringify(leaguePlayerStats));
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
        
        if (typeof userPvpStats !== 'undefined') {
            localStorage.setItem('fc_star_pvp_w', userPvpStats.w.toString());
            localStorage.setItem('fc_star_pvp_d', userPvpStats.d.toString());
            localStorage.setItem('fc_star_pvp_l', userPvpStats.l.toString());
        }
        if (typeof userPvpOpponentStats !== 'undefined') {
            localStorage.setItem('fc_star_pvp_opp_stats', JSON.stringify(userPvpOpponentStats));
        }
        if (typeof cupState !== 'undefined') {
            const cupKey = (typeof currentLeagueId !== 'undefined' && currentLeagueId === 'epl') ? 'fc_star_cup_state_epl' : 'fc_star_cup_state_kleague1';
            localStorage.setItem(cupKey, JSON.stringify(cupState));
            localStorage.setItem('fc_star_cup_state', JSON.stringify(cupState));
        }
        if (typeof aclState !== 'undefined') {
            const aclKey = (typeof currentLeagueId !== 'undefined' && currentLeagueId === 'epl') ? 'fc_star_acl_state_epl' : 'fc_star_acl_state_kleague1';
            localStorage.setItem(aclKey, JSON.stringify(aclState));
            localStorage.setItem('fc_star_acl_state', JSON.stringify(aclState));
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
            const rawId = currentUser || "ooks";
            const cId = rawId.toLowerCase();
            localStorage.setItem(`fc_star_challenge_season_${cId}`, (typeof challengeSeason !== 'undefined' ? challengeSeason : 1).toString());
            localStorage.setItem(`fc_star_challenge_stage_${cId}`, (typeof challengeStage !== 'undefined' ? challengeStage : 1).toString());
            localStorage.setItem(`fc_star_challenge_boss_ovr_${cId}`, (typeof challengeBossOvr !== 'undefined' ? challengeBossOvr : 98).toString());
            localStorage.setItem(`fc_star_challenge_last_date_${cId}`, (typeof challengeLastDate !== 'undefined' ? challengeLastDate : ""));
            localStorage.setItem(`fc_star_challenge_free_used_${cId}`, (typeof challengeDailyFreeUsed !== 'undefined' && challengeDailyFreeUsed) ? 'true' : 'false');
            localStorage.setItem(`fc_star_challenge_retry_used_${cId}`, (typeof challengeDailyRetryUsed !== 'undefined' && challengeDailyRetryUsed) ? 'true' : 'false');
            localStorage.setItem(`fc_star_challenge_history_${cId}`, JSON.stringify(typeof challengeHistory !== 'undefined' ? challengeHistory : { w: 0, d: 0, l: 0, totalGames: 0 }));
        }
        
        localStorage.setItem('fc_star_local_last_updated', Date.now().toString());
        if (currentUser) {
            localStorage.setItem('fc_star_local_data_owner', currentUser);
        }
    } catch (e) {
        console.warn("⚠️ 로컬 세이브 저장 중 에러 발생:", e);
    }
}

function saveUserProgress(forceImmediate = false) {
    if (!currentUser) return;
    if (typeof window.isSyncingData !== 'undefined' && window.isSyncingData) {
        console.log("⏳ [Save Blocked] 동기화 진행 중이므로 클라우드 저장을 건너뜁니다.");
        return;
    }
    
    // 1. 데이터 유실 방지를 위해 즉각 로컬 저장은 항상 보장
    saveAllToLocalStorage();
    
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
    
    const uploadProgress = () => {
        const myId = currentUser;
        const progressData = {
            userPoints: userPoints,
            userLevel: userLevel,
            playerDeck: (() => {
                const minimalDeck = {};
                Object.keys(playerDeck).forEach(key => {
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
            squadFormation: squadFormation,
            squadFormations: squadFormations,
            currentFormation: currentFormation,
            currentLeagueId: typeof currentLeagueId !== 'undefined' ? currentLeagueId : 'kleague1',
            squadNumbers: squadNumbers,
            squadCaptain: squadCaptain,
            leagueRound: leagueRound,
            leagueTeams: leagueTeams,
            leaguePlayerStats: leaguePlayerStats,
            leagueTeamsEpl: (() => {
                try {
                    const eplTeams = localStorage.getItem('fc_star_league_teams_epl');
                    if (eplTeams) return JSON.parse(eplTeams);
                    if (currentLeagueId === 'epl') return leagueTeams;
                    return null;
                } catch(e) { return null; }
            })(),
            leagueTeamsJLeague: (() => {
                try {
                    const jTeams = localStorage.getItem('fc_star_league_teams_jleague');
                    if (jTeams) return JSON.parse(jTeams);
                    if (currentLeagueId === 'jleague') return leagueTeams;
                    return null;
                } catch(e) { return null; }
            })(),
            leagueTeamsKLeague: (() => {
                try {
                    const kTeams = localStorage.getItem('fc_star_league_teams_kleague1') || localStorage.getItem('fc_star_league_teams');
                    if (kTeams && currentLeagueId === 'kleague1') return JSON.parse(kTeams);
                    if (currentLeagueId === 'kleague1') return leagueTeams;
                    return kTeams ? JSON.parse(kTeams) : null;
                } catch(e) { return null; }
            })(),
            leagueRoundEpl: (() => {
                try {
                    const r = localStorage.getItem('fc_star_league_round_epl');
                    if (r) return parseInt(r);
                    if (currentLeagueId === 'epl') return leagueRound;
                    return 1;
                } catch(e) { return 1; }
            })(),
            leagueRoundJLeague: (() => {
                try {
                    const r = localStorage.getItem('fc_star_league_round_jleague');
                    if (r) return parseInt(r);
                    if (currentLeagueId === 'jleague') return leagueRound;
                    return 1;
                } catch(e) { return 1; }
            })(),
            leagueRoundKLeague: (() => {
                try {
                    const r = localStorage.getItem('fc_star_league_round_kleague1');
                    if (r) return parseInt(r);
                    if (currentLeagueId === 'kleague1') return leagueRound;
                    return 1;
                } catch(e) { return 1; }
            })(),
            leaguePlayerStatsEpl: (() => {
                try {
                    const s = localStorage.getItem('fc_star_league_stats_epl');
                    if (s) return JSON.parse(s);
                    if (currentLeagueId === 'epl') return leaguePlayerStats;
                    return {};
                } catch(e) { return {}; }
            })(),
            leaguePlayerStatsJLeague: (() => {
                try {
                    const s = localStorage.getItem('fc_star_league_stats_jleague');
                    if (s) return JSON.parse(s);
                    if (currentLeagueId === 'jleague') return leaguePlayerStats;
                    return {};
                } catch(e) { return {}; }
            })(),
            leaguePlayerStatsKLeague: (() => {
                try {
                    const s = localStorage.getItem('fc_star_league_stats_kleague1');
                    if (s) return JSON.parse(s);
                    if (currentLeagueId === 'kleague1') return leaguePlayerStats;
                    return {};
                } catch(e) { return {}; }
            })(),
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
            cupStateEpl: (() => {
                try {
                    const eplCup = localStorage.getItem('fc_star_cup_state_epl');
                    return eplCup ? JSON.parse(eplCup) : null;
                } catch(e) { return null; }
            })(),
            cupStateJLeague: (() => {
                try {
                    const jCup = localStorage.getItem('fc_star_cup_state_jleague');
                    return jCup ? JSON.parse(jCup) : null;
                } catch(e) { return null; }
            })(),
            cupStateKLeague: (() => {
                try {
                    const kCup = localStorage.getItem('fc_star_cup_state_kleague1') || localStorage.getItem('fc_star_cup_state');
                    return kCup ? JSON.parse(kCup) : null;
                } catch(e) { return null; }
            })(),
            aclState: typeof aclState !== 'undefined' ? aclState : null,
            aclStateEpl: (() => {
                try {
                    const eplAcl = localStorage.getItem('fc_star_acl_state_epl');
                    return eplAcl ? JSON.parse(eplAcl) : null;
                } catch(e) { return null; }
            })(),
            aclStateJLeague: (() => {
                try {
                    const jAcl = localStorage.getItem('fc_star_acl_state_jleague');
                    return jAcl ? JSON.parse(jAcl) : null;
                } catch(e) { return null; }
            })(),
            aclStateKLeague: (() => {
                try {
                    const kAcl = localStorage.getItem('fc_star_acl_state_kleague1') || localStorage.getItem('fc_star_acl_state');
                    return kAcl ? JSON.parse(kAcl) : null;
                } catch(e) { return null; }
            })(),
            isHardMode: isHardMode,
            userAchievements: userAchievements,
            consecutiveLeagueTitles: consecutiveLeagueTitles,
            currentWinStreak: currentWinStreak,
            maxWinStreak: maxWinStreak,
            wingerStyles: typeof wingerStyles !== 'undefined' ? wingerStyles : { LW: 'dribble', RW: 'sprint' },
            strikerStyles: typeof strikerStyles !== 'undefined' ? strikerStyles : { ST: 'targetman' },
            
            // 도전모드(Challenge Mode) 동기화 필드 - 포인트와 동일한 공통 로컬스토리지 영역 우선 보장
            challengeSeason: (typeof challengeSeason === 'number' && challengeSeason >= 1) ? challengeSeason : (parseInt(localStorage.getItem('fc_star_challenge_season') || '1') || 1),
            challengeStage: (typeof challengeStage === 'number' && challengeStage >= 1) ? challengeStage : (parseInt(localStorage.getItem('fc_star_challenge_stage') || '1') || 1),
            challengeBossOvr: typeof challengeBossOvr !== 'undefined' ? challengeBossOvr : (parseInt(localStorage.getItem('fc_star_challenge_boss_ovr') || '98') || 98),
            challengeLastDate: typeof challengeLastDate !== 'undefined' ? challengeLastDate : (localStorage.getItem('fc_star_challenge_last_date') || ""),
            challengeDailyFreeUsed: typeof challengeDailyFreeUsed !== 'undefined' ? challengeDailyFreeUsed : (localStorage.getItem('fc_star_challenge_free_used') === 'true'),
            challengeDailyRetryUsed: typeof challengeDailyRetryUsed !== 'undefined' ? challengeDailyRetryUsed : (localStorage.getItem('fc_star_challenge_retry_used') === 'true'),
            challengeHistory: typeof challengeHistory !== 'undefined' ? challengeHistory : (() => {
                try { return JSON.parse(localStorage.getItem('fc_star_challenge_history')) || { w: 0, d: 0, l: 0, totalGames: 0 }; } catch(e) { return { w: 0, d: 0, l: 0, totalGames: 0 }; }
            })(),
            challengeSeasonTeams: (typeof challengeSeasonTeams !== 'undefined' && Array.isArray(challengeSeasonTeams)) ? challengeSeasonTeams : (() => {
                try { return JSON.parse(localStorage.getItem('fc_star_challenge_season_teams')); } catch(e) { return null; }
            })(),
            
            // 친선경기 ID별 실시간 클라우드 전적 연동 필드
            friendlyMatchesHistory: typeof friendlyMatchesHistory !== 'undefined' ? friendlyMatchesHistory : { w: 0, d: 0, l: 0, pts: 0 },
            friendlyCurrentOpponentIndex: typeof friendlyCurrentOpponentIndex !== 'undefined' ? friendlyCurrentOpponentIndex : 0,
            friendlyMatchesToday: typeof friendlyMatchesToday !== 'undefined' ? friendlyMatchesToday : 0,
            friendlyMatchLastDate: typeof friendlyMatchLastDate !== 'undefined' ? friendlyMatchLastDate : "",
            friendlySeasonStartDate: localStorage.getItem(`fc_star_friendly_season_start_date_${myId}`) || new Date().toISOString(),
            lastSyncedUpdatedAt: window.lastSyncedUpdatedAt,
            
            // 동기화 조율용 최종 수정 타임스탬프
            localLastUpdated: parseInt(localStorage.getItem('fc_star_local_last_updated') || '0') || Date.now()
        };
        
        dbService.saveProgress(currentUser, progressData)
            .then(() => {
                lastCloudUploadTime = Date.now();
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

    const hasPointsOrCardsChanged = 
        (lastUploadedPoints === null || userPoints !== lastUploadedPoints) ||
        (lastUploadedDeckJson === null || JSON.stringify(playerDeck) !== lastUploadedDeckJson);

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
            modal.style.display = 'none';
            modal.classList.remove('active');
            
            // 1. 서버 데이터 반영 및 로컬스토리지 갱신 (forceLoad = true)
            isCloudDataSynced = true;
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

function syncUserDataOnLogin(userData, forceLoad = false) {
    if (!userData) return;
    
    window.isSyncingData = true;
    try {
        // 로컬스토리지 타임스탬프와 클라우드 타임스탬프 비교
        const localLastUpdated = parseInt(localStorage.getItem('fc_star_local_last_updated') || '0') || 0;
        const cloudLastUpdated = userData.localLastUpdated || 0;
        
        // 🛡️ 모달 표시 여부와 상관없이, 서버에 더 앞선 도전모드 진도가 있으면 즉시 안전하게 확보
        if (userData.challengeSeason || userData.challengeStage) {
            const sSeason = parseInt(userData.challengeSeason) || 1;
            const sStage = parseInt(userData.challengeStage) || 1;
            if (challengeSeason < sSeason || (challengeSeason === sSeason && challengeStage < sStage)) {
                console.log(`🛡️ [Safety Pre-Sync] 서버의 도전모드 진도(시즌 ${sSeason} 스테이지 ${sStage})를 로컬에 안전하게 선반영합니다.`);
                challengeSeason = sSeason;
                challengeStage = sStage;
                if (userData.challengeBossOvr) challengeBossOvr = userData.challengeBossOvr;
                if (userData.challengeSeasonTeams) challengeSeasonTeams = userData.challengeSeasonTeams;
                if (userData.challengeHistory) challengeHistory = userData.challengeHistory;
                if (typeof saveChallengeState === 'function') saveChallengeState();
            }
        }

        // 로컬 진행 내역과 클라우드 데이터 시점이 다르고 강제 로드가 아닐 시 -> 사용자에게 선택 모달 표시
        if (!forceLoad && localLastUpdated > cloudLastUpdated) {
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

        // Restore progress
        window.lastSyncedUpdatedAt = userData.updatedAt || "";
        userPoints = userData.userPoints || 0;
        userLevel = userData.userLevel || 1;
        playerDeck = userData.playerDeck || {};
        lastUploadedPoints = userPoints;
        lastUploadedDeckJson = JSON.stringify(playerDeck);
        currentFormation = userData.currentFormation || '4-4-2';
        isHardMode = userData.isHardMode || false;
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
        localStorage.setItem('fc_star_winger_styles', JSON.stringify(wingerStyles));
        
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
                    playerDeck[key].isStored = playerDeck[key].isStored === true;
                } else {
                    delete playerDeck[key];
                }
            });
        }
        
        // 활성 리그 최우선 복원 (leagueTeams 검증에 필수)
        const validLeagues = (typeof LEAGUE_CONFIGS !== 'undefined') ? Object.keys(LEAGUE_CONFIGS) : ['kleague1', 'epl', 'jleague'];
        if (userData.currentLeagueId && validLeagues.includes(userData.currentLeagueId)) {
            currentLeagueId = userData.currentLeagueId;
        } else {
            currentLeagueId = 'kleague1';
        }
        localStorage.setItem('fc_star_current_league', currentLeagueId);

        // 리그별 독립 데이터 로컬 캐싱 복원
        if (userData.leagueTeamsEpl && Array.isArray(userData.leagueTeamsEpl) && userData.leagueTeamsEpl.length > 0) {
            try {
                localStorage.setItem('fc_star_league_teams_epl', JSON.stringify(userData.leagueTeamsEpl));
            } catch(e) {}
        }
        if (userData.leagueTeamsJLeague && Array.isArray(userData.leagueTeamsJLeague) && userData.leagueTeamsJLeague.length > 0) {
            try {
                localStorage.setItem('fc_star_league_teams_jleague', JSON.stringify(userData.leagueTeamsJLeague));
            } catch(e) {}
        }
        if (userData.leagueTeamsKLeague && Array.isArray(userData.leagueTeamsKLeague) && userData.leagueTeamsKLeague.length > 0) {
            try {
                localStorage.setItem('fc_star_league_teams_kleague1', JSON.stringify(userData.leagueTeamsKLeague));
            } catch(e) {}
        }
        if (userData.leagueRoundEpl) {
            localStorage.setItem('fc_star_league_round_epl', userData.leagueRoundEpl.toString());
        }
        if (userData.leagueRoundJLeague) {
            localStorage.setItem('fc_star_league_round_jleague', userData.leagueRoundJLeague.toString());
        }
        if (userData.leagueRoundKLeague) {
            localStorage.setItem('fc_star_league_round_kleague1', userData.leagueRoundKLeague.toString());
        }
        if (userData.leaguePlayerStatsEpl) {
            try {
                localStorage.setItem('fc_star_league_stats_epl', JSON.stringify(userData.leaguePlayerStatsEpl));
            } catch(e) {}
        }
        if (userData.leaguePlayerStatsJLeague) {
            try {
                localStorage.setItem('fc_star_league_stats_jleague', JSON.stringify(userData.leaguePlayerStatsJLeague));
            } catch(e) {}
        }
        if (userData.leaguePlayerStatsKLeague) {
            try {
                localStorage.setItem('fc_star_league_stats_kleague1', JSON.stringify(userData.leaguePlayerStatsKLeague));
            } catch(e) {}
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
        
        // 리그컵 상태 클라우드 데이터 복원 (K리그 / EPL / J리그 독립 스토리지)
        if (userData.cupStateEpl) {
            localStorage.setItem('fc_star_cup_state_epl', JSON.stringify(userData.cupStateEpl));
        }
        if (userData.cupStateJLeague) {
            localStorage.setItem('fc_star_cup_state_jleague', JSON.stringify(userData.cupStateJLeague));
        }
        if (userData.cupStateKLeague) {
            localStorage.setItem('fc_star_cup_state_kleague1', JSON.stringify(userData.cupStateKLeague));
            localStorage.setItem('fc_star_cup_state', JSON.stringify(userData.cupStateKLeague));
        } else if (userData.cupState) {
            localStorage.setItem('fc_star_cup_state_kleague1', JSON.stringify(userData.cupState));
            localStorage.setItem('fc_star_cup_state', JSON.stringify(userData.cupState));
        }
        if (typeof initCup === 'function') {
            initCup();
        }
        
        // 아챔 및 챔스 상태 클라우드 데이터 복원 (K리그 / EPL / J리그 독립 스토리지)
        if (userData.aclStateEpl) {
            localStorage.setItem('fc_star_acl_state_epl', JSON.stringify(userData.aclStateEpl));
        }
        if (userData.aclStateJLeague) {
            localStorage.setItem('fc_star_acl_state_jleague', JSON.stringify(userData.aclStateJLeague));
        }
        if (userData.aclStateKLeague) {
            localStorage.setItem('fc_star_acl_state_kleague1', JSON.stringify(userData.aclStateKLeague));
            localStorage.setItem('fc_star_acl_state', JSON.stringify(userData.aclStateKLeague));
        } else if (userData.aclState) {
            localStorage.setItem('fc_star_acl_state_kleague1', JSON.stringify(userData.aclState));
            localStorage.setItem('fc_star_acl_state', JSON.stringify(userData.aclState));
        }
        if (typeof initAcl === 'function') {
            initAcl();
        }
        
        // 클라우드에서 도전모드(Challenge Mode) 및 친선경기 상태 복원
        const rawId = (typeof currentUser === 'string' && currentUser) ? currentUser.trim() : (localStorage.getItem('fc_star_current_user') || "");
        const myId = rawId.toLowerCase();

        // 로컬에 기존 진행 데이터가 남아있는지 확인 (공통 키 1순위 조회, ID별 키 fallback)
        const localSeasonStr = localStorage.getItem('fc_star_challenge_season') || (myId ? localStorage.getItem(`fc_star_challenge_season_${myId}`) : null) || (rawId && rawId !== myId ? localStorage.getItem(`fc_star_challenge_season_${rawId}`) : null);
        const localStageStr = localStorage.getItem('fc_star_challenge_stage') || (myId ? localStorage.getItem(`fc_star_challenge_stage_${myId}`) : null) || (rawId && rawId !== myId ? localStorage.getItem(`fc_star_challenge_stage_${rawId}`) : null);
        const localSeason = (localSeasonStr && !isNaN(localSeasonStr)) ? parseInt(localSeasonStr) : null;
        const localStage = (localStageStr && !isNaN(localStageStr)) ? parseInt(localStageStr) : null;

        const cloudSeason = (userData.challengeSeason !== undefined && userData.challengeSeason !== null && !isNaN(userData.challengeSeason)) ? parseInt(userData.challengeSeason) : null;
        const cloudStage = (userData.challengeStage !== undefined && userData.challengeStage !== null && !isNaN(userData.challengeStage)) ? parseInt(userData.challengeStage) : null;

        let needsChallengeCloudSync = false;
        if (cloudSeason !== null && localSeason !== null) {
            if (cloudSeason > localSeason) {
                challengeSeason = cloudSeason;
                challengeStage = (cloudStage !== null) ? cloudStage : 1;
            } else if (localSeason > cloudSeason) {
                challengeSeason = localSeason;
                challengeStage = (localStage !== null) ? localStage : 1;
                needsChallengeCloudSync = true;
            } else {
                challengeSeason = cloudSeason;
                challengeStage = Math.max(localStage || 1, cloudStage || 1);
                if (localStage && cloudStage && localStage > cloudStage) {
                    needsChallengeCloudSync = true;
                }
            }
        } else if (cloudSeason !== null) {
            challengeSeason = cloudSeason;
            challengeStage = (cloudStage !== null) ? cloudStage : 1;
        } else if (localSeason !== null) {
            challengeSeason = localSeason;
            challengeStage = (localStage !== null) ? localStage : 1;
            needsChallengeCloudSync = true;
        } else {
            challengeSeason = 1;
            challengeStage = 1;
        }

        challengeBossOvr = userData.challengeBossOvr || parseInt(localStorage.getItem('fc_star_challenge_boss_ovr') || (myId ? localStorage.getItem(`fc_star_challenge_boss_ovr_${myId}`) : '98') || '98') || 98;
        challengeLastDate = userData.challengeLastDate || localStorage.getItem('fc_star_challenge_last_date') || (myId ? localStorage.getItem(`fc_star_challenge_last_date_${myId}`) : "") || "";
        challengeDailyFreeUsed = (userData.challengeDailyFreeUsed !== undefined) ? userData.challengeDailyFreeUsed : (localStorage.getItem('fc_star_challenge_free_used') === 'true' || (myId && localStorage.getItem(`fc_star_challenge_free_used_${myId}`) === 'true'));
        challengeDailyRetryUsed = (userData.challengeDailyRetryUsed !== undefined) ? userData.challengeDailyRetryUsed : (localStorage.getItem('fc_star_challenge_retry_used') === 'true' || (myId && localStorage.getItem(`fc_star_challenge_retry_used_${myId}`) === 'true'));
        challengeHistory = userData.challengeHistory || (() => {
            try {
                const h = localStorage.getItem('fc_star_challenge_history') || (myId ? localStorage.getItem(`fc_star_challenge_history_${myId}`) : null);
                return h ? JSON.parse(h) : { w: 0, d: 0, l: 0, totalGames: 0 };
            } catch(e) { return { w: 0, d: 0, l: 0, totalGames: 0 }; }
        })();

        if (userData.challengeSeasonTeams && Array.isArray(userData.challengeSeasonTeams) && userData.challengeSeasonTeams.length === 10) {
            challengeSeasonTeams = userData.challengeSeasonTeams;
        } else {
            const savedTeams = localStorage.getItem('fc_star_challenge_season_teams') || (myId ? localStorage.getItem(`fc_star_challenge_season_teams_${myId}`) : null);
            if (savedTeams) {
                try { challengeSeasonTeams = JSON.parse(savedTeams); } catch(e) { challengeSeasonTeams = null; }
            }
        }

        // 공통 로컬스토리지 및 ID별 스토리지에 동시 영구 저장
        if (typeof saveChallengeState === 'function') {
            saveChallengeState();
        }
        if (typeof initChallengeState === 'function') {
            initChallengeState();
        }
        if (needsChallengeCloudSync) {
            setTimeout(() => {
                saveUserProgress(true);
            }, 1000);
        }

        // 클라우드에서 친선경기 전적 및 릴레이 인덱스 상태 복원
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
        if (typeof initFriendlyMatchState === 'function') {
            initFriendlyMatchState();
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
        localStorage.setItem('fc_star_last_synced_updated_at', window.lastSyncedUpdatedAt);
        localStorage.setItem('fc_star_local_last_updated', (userData.localLastUpdated || Date.now()).toString());
        if (myId) {
            localStorage.setItem('fc_star_local_data_owner', myId);
        }
        localStorage.setItem('fc_star_user_achievements', JSON.stringify(userAchievements));
        localStorage.setItem('fc_star_consecutive_titles', consecutiveLeagueTitles.toString());
        localStorage.setItem('fc_star_current_win_streak', currentWinStreak.toString());
        localStorage.setItem('fc_star_max_win_streak', maxWinStreak.toString());
        localStorage.setItem('fc_star_winger_styles', JSON.stringify(wingerStyles));
        localStorage.setItem('fc_star_striker_styles', JSON.stringify(strikerStyles));
        
        // Refresh all screens
        refreshAllScreens();
        
        // 동기화 완료 상태 마크
        isCloudDataSynced = true;
        
        // 데이터 동기화 완료 후 오늘 기준 컨디션 업데이트 적용
        try {
            updateDeckConditions();
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
    
    // 계정 전환 및 충돌 유실 방지: 로그인하려는 ID와 로컬 데이터 소유자 ID가 다른 경우 로컬 데이터 강제 초기화
    const targetUserId = id.trim().toLowerCase();
    const localOwner = localStorage.getItem('fc_star_local_data_owner');
    if (localOwner && localOwner.trim().toLowerCase() !== targetUserId) {
        const isLocalOwnerGuest = localOwner.startsWith('guest_');
        // 이전 소유자가 게스트가 아닌 다른 계정이거나, 또는 일반 로그인 시도인 경우 로컬 데이터 일괄 청소
        if (!isLocalOwnerGuest || authMode === 'login') {
            console.warn("⚠️ [Local Data Owner Mismatch] 기존 로컬 데이터 소유자:", localOwner, "로그인 계정:", targetUserId, "-> 로컬 데이터를 초기화합니다.");
            clearLocalGameData();
        }
    }
    
    isAuthSubmitting = true;
    const btnSubmit = document.getElementById('btnSubmitAuth');
    if (btnSubmit) btnSubmit.disabled = true;
    
    showToast(`${authMode === 'login' ? '로그인' : '회원가입'} 진행 중...`);
    
    try {
        if (authMode === 'login') {
            // LOGIN PROCESS
            const userData = await dbService.login(id, pw);
            currentUser = (userData.id || targetUserId).trim().toLowerCase();
            localStorage.setItem('fc_star_local_data_owner', currentUser);
            
            // Sync and refresh
            syncUserDataOnLogin(userData);
            
            // Keep session
            localStorage.setItem('fc_star_current_user', currentUser);
            
            closeAuthModal();
            showToast(`환영합니다! ${currentUser.toUpperCase()} 계정으로 로그인되었습니다.`);
        } else {
            // REGISTER PROCESS
            const defaultData = await dbService.register(id, pw);
            currentUser = (defaultData.id || targetUserId).trim().toLowerCase();
            localStorage.setItem('fc_star_local_data_owner', currentUser);
            
            // Sync & automatically save existing local progress (if any) as first upload
            syncUserDataOnLogin(defaultData);
            
            // Backup existing local data to cloud immediately
            saveUserProgress(true);
            
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
    
    const localOwner = localStorage.getItem('fc_star_local_data_owner');
    if (localOwner && localOwner.trim().toLowerCase() !== guestId.toLowerCase()) {
        const isLocalOwnerGuest = localOwner.startsWith('guest_');
        if (!isLocalOwnerGuest) {
            console.warn("⚠️ [Local Data Owner Mismatch] 기존 정식 사용자 데이터를 비회원 게스트 환경으로 승계하지 않고 삭제합니다. 소유자:", localOwner);
            clearLocalGameData();
        }
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

function clearLocalGameData() {
    const keys = [
        'fc_star_user_points',
        'fc_star_user_level',
        'fc_star_player_deck',
        'fc_star_squad_formations',
        'fc_star_squad_formation',
        'fc_star_current_formation',
        'fc_star_league_teams',
        'fc_star_league_round',
        'fc_star_quiz_offset',
        'fc_star_quiz_last_date',
        'fc_star_quiz_queue',
        'fc_star_quiz_solved_count',
        'fc_star_quiz_current_index',
        'fc_star_match_last_date',
        'fc_star_match_today_count',
        'fc_star_last_login_date',
        'fc_star_league_year',
        'fc_star_hall_of_fame',
        'fc_star_league_stats',
        'fc_star_career_stats',
        'fc_star_career_stats_hard',
        'fc_star_squad_numbers',
        'fc_star_is_hard_mode',
        'fc_star_last_synced_updated_at',
        'fc_star_user_achievements',
        'fc_star_consecutive_titles',
        'fc_star_current_win_streak',
        'fc_star_max_win_streak',
        'fc_star_winger_styles',
        'fc_star_striker_styles',
        'fc_star_local_last_updated',
        'fc_star_cup_state',
        'fc_star_acl_state',
        'fc_star_challenge_season',
        'fc_star_challenge_stage',
        'fc_star_challenge_boss_ovr',
        'fc_star_challenge_last_date',
        'fc_star_challenge_free_used',
        'fc_star_challenge_retry_used',
        'fc_star_challenge_history',
        'fc_star_challenge_season_teams',
        'fc_star_local_data_owner'
    ];
    const myId = currentUser || localStorage.getItem('fc_star_current_user') || "";
    if (myId) {
        keys.push(`fc_star_challenge_season_${myId}`);
        keys.push(`fc_star_challenge_stage_${myId}`);
        keys.push(`fc_star_challenge_boss_ovr_${myId}`);
        keys.push(`fc_star_challenge_last_date_${myId}`);
        keys.push(`fc_star_challenge_free_used_${myId}`);
        keys.push(`fc_star_challenge_retry_used_${myId}`);
        keys.push(`fc_star_challenge_history_${myId}`);
        keys.push(`fc_star_challenge_season_teams_${myId}`);
        keys.push(`fc_star_friendly_history_${myId}`);
        keys.push(`fc_star_friendly_current_index_${myId}`);
        keys.push(`fc_star_friendly_matches_today_${myId}`);
        keys.push(`fc_star_friendly_match_last_date_${myId}`);
        keys.push(`fc_star_friendly_season_start_date_${myId}`);
    }
    keys.forEach(k => {
        try { localStorage.removeItem(k); } catch(e) {}
    });
}

function handleLogout() {
    const confirmLogout = confirm("정말 로그아웃 하시겠습니까?\n로그아웃 시 비회원 로컬 모드로 전환됩니다.");
    if (confirmLogout) {
        currentUser = null;
        isCloudDataSynced = false;
        
        clearLocalGameData();
        localStorage.removeItem('fc_star_current_user');
        
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
