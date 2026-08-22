// js/league.js - 멀티 리그(K리그1 / 프리미어리그) 매치 시뮬레이터 + 명예의 전당 모듈

// 11. MULTI-LEAGUE MATCH SIMULATOR & LEAGUE STANDINGS ENGINE
let leagueTeams = [];
let leagueRound = 1;
let isMatchRunning = false;
let leaguePlayerStats = {};

const K_LEAGUE_TEAMS_PRESET = [
    { id: "jeonbuk", name: "전북 현대", shortName: "JHM", rating: 70, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 },
    { id: "ulsan", name: "울산 HD", shortName: "ULS", rating: 80, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 },
    { id: "seoul", name: "FC 서울", shortName: "SEO", rating: 78, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 },
    { id: "pohang", name: "포항 스틸러스", shortName: "POH", rating: 77, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 },
    { id: "gangwon", name: "강원 FC", shortName: "GWN", rating: 76, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 },
    { id: "gwangju", name: "광주 FC", shortName: "GWJ", rating: 75, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 },
    { id: "gimcheon", name: "김천 상무", shortName: "GMC", rating: 75, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 },
    { id: "bucheon_fc", name: "부천 FC", shortName: "BCN", rating: 74, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 },
    { id: "jeju", name: "제주 유나이티드", shortName: "JEJ", rating: 73, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 },
    { id: "daejeon", name: "대전 하나", shortName: "DJN", rating: 73, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 },
    { id: "anyang", name: "FC 안양", shortName: "AYG", rating: 71, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 },
    { id: "incheon", name: "인천 유나이티드", shortName: "ICN", rating: 70, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 }
];

const LEAGUE_CONFIGS = {
    kleague1: {
        id: 'kleague1',
        name: 'K리그 1',
        shortName: 'K1',
        seasonPrefix: 'K리그1',
        totalRounds: 33,
        userTeamId: 'jeonbuk',
        userTeamName: '전북 현대',
        userTeamEmblem: 'img/mark_jb.svg',
        get teamsPreset() { return K_LEAGUE_TEAMS_PRESET; },
        get playersPreset() { return (typeof OTHER_TEAMS_PLAYERS_PRESET !== 'undefined') ? OTHER_TEAMS_PLAYERS_PRESET : []; },
        get fixtures() { return JEONBUK_FIXTURES; },
        themeColor: '#00ff87',
        accentColor: '#ffd700',
        strongTeams: ['ulsan', 'seoul', 'pohang', 'gimcheon']
    },
    epl: {
        id: 'epl',
        name: '프리미어리그',
        shortName: 'EPL',
        seasonPrefix: '프리미어리그',
        totalRounds: 38,
        userTeamId: 'liverpool',
        userTeamName: '리버풀',
        userTeamEmblem: 'img/mark_liverpool.png',
        get teamsPreset() { return (typeof EPL_TEAMS_PRESET !== 'undefined') ? EPL_TEAMS_PRESET : []; },
        get playersPreset() { return (typeof OTHER_TEAMS_PLAYERS_PRESET_EPL !== 'undefined') ? OTHER_TEAMS_PLAYERS_PRESET_EPL : []; },
        get fixtures() { return (typeof LIVERPOOL_FIXTURES_EPL !== 'undefined') ? LIVERPOOL_FIXTURES_EPL : []; },
        themeColor: '#c8102e',
        accentColor: '#38003c',
        strongTeams: ['mancity', 'arsenal', 'chelsea', 'tottenham', 'manutd']
    }
};

function getActiveLeagueConfig() {
    const leagueId = (typeof currentLeagueId !== 'undefined' && LEAGUE_CONFIGS[currentLeagueId]) ? currentLeagueId : 'kleague1';
    return LEAGUE_CONFIGS[leagueId];
}

const JEONBUK_FIXTURES = [
    // 1회차 (라운드 1~11)
    { round: 1, opponent: "ulsan", isHome: false },
    { round: 2, opponent: "seoul", isHome: true },
    { round: 3, opponent: "pohang", isHome: false },
    { round: 4, opponent: "gangwon", isHome: true },
    { round: 5, opponent: "gwangju", isHome: false },
    { round: 6, opponent: "gimcheon", isHome: true },
    { round: 7, opponent: "bucheon_fc", isHome: false },
    { round: 8, opponent: "jeju", isHome: true },
    { round: 9, opponent: "daejeon", isHome: false },
    { round: 10, opponent: "anyang", isHome: true },
    { round: 11, opponent: "incheon", isHome: false },
    // 2회차 (라운드 12~22, 홈/원정 반대)
    { round: 12, opponent: "ulsan", isHome: true },
    { round: 13, opponent: "seoul", isHome: false },
    { round: 14, opponent: "pohang", isHome: true },
    { round: 15, opponent: "gangwon", isHome: false },
    { round: 16, opponent: "gwangju", isHome: true },
    { round: 17, opponent: "gimcheon", isHome: false },
    { round: 18, opponent: "bucheon_fc", isHome: true },
    { round: 19, opponent: "jeju", isHome: false },
    { round: 20, opponent: "daejeon", isHome: true },
    { round: 21, opponent: "anyang", isHome: false },
    { round: 22, opponent: "incheon", isHome: true },
    // 3회차 (라운드 23~33, 홈/원정 배분)
    { round: 23, opponent: "ulsan", isHome: false },
    { round: 24, opponent: "seoul", isHome: true },
    { round: 25, opponent: "pohang", isHome: false },
    { round: 26, opponent: "gangwon", isHome: true },
    { round: 27, opponent: "gwangju", isHome: false },
    { round: 28, opponent: "gimcheon", isHome: true },
    { round: 29, opponent: "bucheon_fc", isHome: false },
    { round: 30, opponent: "jeju", isHome: true },
    { round: 31, opponent: "daejeon", isHome: false },
    { round: 32, opponent: "anyang", isHome: true },
    { round: 33, opponent: "incheon", isHome: false }
];

function initLeaguePlayerStats() {
    leaguePlayerStats = {};
    const config = getActiveLeagueConfig();
    const playersPreset = config.playersPreset;
    const leagueTeamIds = config.teamsPreset.map(t => t.id);

    if (Array.isArray(playersPreset)) {
        playersPreset.forEach(p => {
            if (!p.teamId || !leagueTeamIds.includes(p.teamId)) return;
            
            leaguePlayerStats[p.id] = {
                id: p.id,
                name: p.name,
                teamId: p.teamId,
                teamName: p.teamName,
                goals: 0,
                assists: 0
            };
        });
    }
}

function registerGoal(playerId, playerName, teamId, teamName) {
    const config = getActiveLeagueConfig();
    const leagueTeamIds = config.teamsPreset.map(t => t.id);
    if (!teamId || !leagueTeamIds.includes(teamId)) return;
    
    if (!leaguePlayerStats) leaguePlayerStats = {};
    if (!leaguePlayerStats[playerId]) {
        leaguePlayerStats[playerId] = {
            id: playerId,
            name: playerName,
            teamId: teamId,
            teamName: teamName,
            goals: 0,
            assists: 0
        };
    }
    leaguePlayerStats[playerId].goals += 1;
}

function registerAssist(playerId, playerName, teamId, teamName) {
    if (!playerId) return;
    const config = getActiveLeagueConfig();
    const leagueTeamIds = config.teamsPreset.map(t => t.id);
    if (!teamId || !leagueTeamIds.includes(teamId)) return;
    
    if (!leaguePlayerStats) leaguePlayerStats = {};
    if (!leaguePlayerStats[playerId]) {
        leaguePlayerStats[playerId] = {
            id: playerId,
            name: playerName,
            teamId: teamId,
            teamName: teamName,
            goals: 0,
            assists: 0
        };
    }
    leaguePlayerStats[playerId].assists += 1;
}

function processPlayerGoal(goalData) {
    const config = getActiveLeagueConfig();
    const { scorerId, scorerName, assisterId, assisterName } = goalData || {};
    if (scorerId) registerGoal(scorerId, scorerName, config.userTeamId, config.userTeamName);
    if (assisterId) registerAssist(assisterId, assisterName, config.userTeamId, config.userTeamName);
}

function simulateOtherPlayersStats() {
    const config = getActiveLeagueConfig();
    const playersPreset = config.playersPreset;
    const leagueTeamIds = config.teamsPreset.map(t => t.id);

    if (Array.isArray(playersPreset)) {
        playersPreset.forEach(p => {
            if (!p.teamId || !leagueTeamIds.includes(p.teamId)) return;
            
            // Roll for goal (15% chance, approx 0.15 per match)
            if (Math.random() < 0.15) {
                registerGoal(p.id, p.name, p.teamId, p.teamName);
            }
            // Roll for assist (10% chance, approx 0.10 per match)
            if (Math.random() < 0.10) {
                registerAssist(p.id, p.name, p.teamId, p.teamName);
            }
        });
    }
    
    try {
        localStorage.setItem('fc_star_league_stats', JSON.stringify(leaguePlayerStats));
    } catch (e) {
        console.warn("Saving league stats failed", e);
    }
    
    renderLeagueStats();
}

function renderLeagueStats() {
    const goalsBody = document.getElementById('leagueGoalsBody');
    const assistsBody = document.getElementById('leagueAssistsBody');
    
    if (!goalsBody || !assistsBody) return;
    
    const config = getActiveLeagueConfig();
    const leagueTeamIds = config.teamsPreset.map(t => t.id);
    const playersArray = Object.values(leaguePlayerStats || {})
        .filter(p => p.teamId && leagueTeamIds.includes(p.teamId));
    
    // 1. Render Goals Leaderboard (Top 5)
    const sortedGoals = [...playersArray]
        .filter(p => p.goals > 0)
        .sort((a, b) => {
            if (b.goals !== a.goals) return b.goals - a.goals;
            if (b.assists !== a.assists) return b.assists - a.assists;
            return a.name.localeCompare(b.name, 'ko');
        })
        .slice(0, 5);
        
    goalsBody.innerHTML = '';
    if (sortedGoals.length === 0) {
        goalsBody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: #64748b; padding: 10px;">기록된 득점이 없습니다.</td></tr>`;
    } else {
        sortedGoals.forEach((p, idx) => {
            const rank = idx + 1;
            const isUserTeam = p.teamId === config.userTeamId;
            const rowStyle = isUserTeam ? 'style="background: rgba(0, 255, 135, 0.08); font-weight: bold; color: #ffd700;"' : '';
            goalsBody.innerHTML += `
                <tr ${rowStyle} style="border-bottom: 1px solid rgba(255, 255, 255, 0.05);">
                    <td style="padding: 6px; text-align: center;">${rank}</td>
                    <td style="padding: 6px;">${p.name}</td>
                    <td style="padding: 6px; color: #94a3b8; font-size: 0.72rem;">${p.teamName}</td>
                    <td style="padding: 6px; text-align: center; font-weight: bold; color: #ffd700;">${p.goals}</td>
                </tr>
            `;
        });
    }
    
    // 2. Render Assists Leaderboard (Top 5)
    const sortedAssists = [...playersArray]
        .filter(p => p.assists > 0)
        .sort((a, b) => {
            if (b.assists !== a.assists) return b.assists - a.assists;
            if (b.goals !== a.goals) return b.goals - a.goals;
            return a.name.localeCompare(b.name, 'ko');
        })
        .slice(0, 5);
        
    assistsBody.innerHTML = '';
    if (sortedAssists.length === 0) {
        assistsBody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: #64748b; padding: 10px;">기록된 도움이 없습니다.</td></tr>`;
    } else {
        sortedAssists.forEach((p, idx) => {
            const rank = idx + 1;
            const isUserTeam = p.teamId === config.userTeamId;
            const rowStyle = isUserTeam ? 'style="background: rgba(0, 255, 135, 0.08); font-weight: bold; color: #00ff87;"' : '';
            assistsBody.innerHTML += `
                <tr ${rowStyle} style="border-bottom: 1px solid rgba(255, 255, 255, 0.05);">
                    <td style="padding: 6px; text-align: center;">${rank}</td>
                    <td style="padding: 6px;">${p.name}</td>
                    <td style="padding: 6px; color: #94a3b8; font-size: 0.72rem;">${p.teamName}</td>
                    <td style="padding: 6px; text-align: center; font-weight: bold; color: #00ff87;">${p.assists}</td>
                </tr>
            `;
        });
    }
}

function checkAndMigrateLeagueTeams() {
    const config = getActiveLeagueConfig();
    let isMigrated = false;
    
    if (!Array.isArray(leagueTeams) || leagueTeams.length === 0) {
        console.warn(`[League Check] leagueTeams가 비어있어 ${config.name} 기본 프리셋으로 초기화합니다.`);
        leagueTeams = JSON.parse(JSON.stringify(config.teamsPreset));
        isMigrated = true;
    } else {
        // 1. 유저 팀(리버풀 / 전북)이 현재 leagueTeams에 포함되어 있는지 검사
        const hasUserTeam = leagueTeams.some(t => t.id === config.userTeamId);
        const currentTeamIds = leagueTeams.map(t => t.id);
        const missingPresets = config.teamsPreset.filter(p => !currentTeamIds.includes(p.id));
        
        // 팀 목록에 변화가 있거나 누락된 팀이 있는 경우 기존 전적을 안전하게 보존하며 병합
        if (!hasUserTeam || missingPresets.length > 0 || leagueTeams.length !== config.teamsPreset.length) {
            console.warn(`[League Check] 현재 리그(${config.name})와 leagueTeams 팀 목록 불일치 감지 -> 기존 전적을 보존하며 ${config.name} 프리셋과 병합합니다.`, { hasUserTeam, missingCount: missingPresets.length });
            
            // 기존 전적 맵 생성 (팀 ID 기준)
            const statsMap = {};
            leagueTeams.forEach(t => {
                if (t && t.id) {
                    statsMap[t.id] = {
                        p: t.p || 0,
                        w: t.w || 0,
                        d: t.d || 0,
                        l: t.l || 0,
                        gf: t.gf || 0,
                        ga: t.ga || 0,
                        gd: t.gd !== undefined ? t.gd : ((t.gf || 0) - (t.ga || 0)),
                        pts: t.pts || 0,
                        rating: t.rating
                    };
                }
            });
            
            // K리그 레거시 ID 마이그레이션 매핑 지원
            if (config.id === 'kleague1') {
                if (statsMap["suwon_fc"] && !statsMap["bucheon_fc"]) {
                    statsMap["bucheon_fc"] = statsMap["suwon_fc"];
                }
                if (statsMap["daegu"] && !statsMap["anyang"]) {
                    statsMap["anyang"] = statsMap["daegu"];
                }
            }
            
            // 새 프리셋에 기존 전적 주입
            leagueTeams = config.teamsPreset.map(preset => {
                const existing = statsMap[preset.id];
                if (existing) {
                    return {
                        ...preset,
                        rating: (existing.rating !== undefined && existing.rating > 0) ? existing.rating : preset.rating,
                        p: existing.p,
                        w: existing.w,
                        d: existing.d,
                        l: existing.l,
                        gf: existing.gf,
                        ga: existing.ga,
                        gd: existing.gd,
                        pts: existing.pts
                    };
                }
                return { ...preset };
            });
            
            isMigrated = true;
        } else if (config.id === 'kleague1') {
            // K리그용 레거시 마이그레이션 (부천, 안양)
            const teamMigrations = {
                "suwon_fc": { id: "bucheon_fc", name: "부천 FC", rating: 74 },
                "daegu": { id: "anyang", name: "FC 안양", rating: 71 }
            };
            
            leagueTeams.forEach(team => {
                if (teamMigrations[team.id]) {
                    const mig = teamMigrations[team.id];
                    console.log(`Migrating team ID: ${team.id} -> ${mig.id}`);
                    team.id = mig.id;
                    team.name = mig.name;
                    if (team.rating === undefined || team.rating === 68) {
                        team.rating = mig.rating;
                    }
                    isMigrated = true;
                }
            });
        }
    }
    
    if (isMigrated) {
        try {
            localStorage.setItem('fc_star_league_teams', JSON.stringify(leagueTeams));
        } catch (e) {}
    }
}

function initLeague() {
    try {
        const savedLeague = localStorage.getItem('fc_star_current_league');
        if (savedLeague && LEAGUE_CONFIGS[savedLeague]) {
            currentLeagueId = savedLeague;
        }

        const savedTeams = localStorage.getItem('fc_star_league_teams');
        const savedRound = localStorage.getItem('fc_star_league_round');
        const savedYear = localStorage.getItem('fc_star_league_year');
        const savedFame = localStorage.getItem('fc_star_hall_of_fame');
        const savedMatchDate = localStorage.getItem('fc_star_match_last_date');
        const savedStats = localStorage.getItem('fc_star_league_stats');
        
        if (savedTeams && savedRound) {
            leagueTeams = JSON.parse(savedTeams);
            checkAndMigrateLeagueTeams();
            leagueRound = parseInt(savedRound);
        } else {
            resetLeagueSeasonState();
        }
        
        if (savedStats) {
            leaguePlayerStats = JSON.parse(savedStats);
            const config = getActiveLeagueConfig();
            const leagueTeamIds = config.teamsPreset.map(t => t.id);
            
            // 타 리그나 없는 팀의 레거시 데이터 정리
            Object.keys(leaguePlayerStats).forEach(playerId => {
                const p = leaguePlayerStats[playerId];
                if (!p || !p.teamId || !leagueTeamIds.includes(p.teamId)) {
                    delete leaguePlayerStats[playerId];
                }
            });
        } else {
            initLeaguePlayerStats();
        }
        
        if (savedYear) leagueYear = parseInt(savedYear) || 2026;
        if (savedFame) hallOfFame = JSON.parse(savedFame) || [];
        if (savedMatchDate) matchLastDate = savedMatchDate;
        const savedMatchTodayCount = localStorage.getItem('fc_star_match_today_count');
        if (savedMatchTodayCount) matchTodayCount = parseInt(savedMatchTodayCount) || 0;
        
        const savedCareer = localStorage.getItem('fc_star_career_stats');
        if (savedCareer) {
            careerStats = JSON.parse(savedCareer);
        } else {
            careerStats = { w: 0, d: 0, l: 0, gf: 0, ga: 0, playerGoals: {} };
        }
    } catch(e) {
        resetLeagueSeasonState();
    }
    
    // Sync User Team OVR with current active formation
    syncPlayerTeamOvr();
    renderLeagueTable();
    updateMatchPreviewBoard();
    renderLeagueStats();
    if (typeof updateAppLogo === 'function') updateAppLogo();
    renderCareerStats();
    
    // Initialize Friendly Match State
    if (typeof initFriendlyMatchState === 'function') {
        initFriendlyMatchState();
    }
    
    // 시즌 완료 후 페이지 새로고침 시 챔피언 확인 모달 자동 복구
    const config = getActiveLeagueConfig();
    if (leagueRound > config.totalRounds) {
        setTimeout(() => {
            checkSeasonChampion();
        }, 500);
    }
}

function resetLeagueSeasonState() {
    const config = getActiveLeagueConfig();
    leagueTeams = JSON.parse(JSON.stringify(config.teamsPreset));
    leagueRound = 1;
    initLeaguePlayerStats();
    
    // 2번째 시즌 이후 상대 팀 OVR 다이내믹 스케일링 적용 (leagueYear > 2026)
    if (typeof leagueYear !== 'undefined' && leagueYear > 2026) {
        const pureOvr = getPlayerPureOvr();
        const top20Ovr = getPlayerTop20Ovr();
        const strongTeams = config.strongTeams || [];
        
        leagueTeams.forEach(team => {
            if (team.id === config.userTeamId) {
                team.rating = pureOvr;
            } else if (strongTeams.includes(team.id)) {
                // 강팀: 플레이어 덱 상위 11개 평균 OVR - 2 ~ 0 범위 랜덤
                const offset = Math.floor(Math.random() * 3) - 2; // -2, -1, 0
                team.rating = top20Ovr + offset;
            } else {
                // 중하위팀: 플레이어 덱 상위 11개 평균 OVR - 10 ~ -2 범위 랜덤
                const offset = Math.floor(Math.random() * 9) - 10; // -10 ~ -2
                team.rating = top20Ovr + offset;
            }
        });
    }
    
    try {
        localStorage.setItem('fc_star_current_league', currentLeagueId);
        localStorage.setItem('fc_star_league_teams', JSON.stringify(leagueTeams));
        localStorage.setItem('fc_star_league_round', leagueRound.toString());
        localStorage.setItem('fc_star_league_stats', JSON.stringify(leaguePlayerStats));
        localStorage.setItem('fc_star_league_year', leagueYear.toString());
    } catch (e) {
        console.warn("Saving reset league failed", e);
    }
}

function resetLeagueSeason() {
    if (isMatchRunning) return;
    
    resetLeagueSeasonState();
    
    // 코리아컵 리셋 연동 (새 컵 세션 준비)
    if (typeof resetCupStateData === 'function') {
        resetCupStateData();
    }
    if (typeof initCupTab === 'function') {
        initCupTab();
    }

    // 아챔 리셋 연동 (새 아챔 세션 준비)
    if (typeof resetAclStateData === 'function') {
        resetAclStateData();
    }
    if (typeof initAclTab === 'function') {
        initAclTab();
    }
    
    syncPlayerTeamOvr();
    renderLeagueTable();
    renderLeagueStats();
    updateMatchPreviewBoard();
    
    // Clear commentary
    const commBox = document.getElementById('commentaryScroll');
    if (commBox) {
        commBox.innerHTML = '<div class="comm-item comm-system">시즌이 초기화되었습니다. 경기를 시작하려면 아래 \'경기 시작\' 버튼을 누르세요.</div>';
    }
    
    const config = getActiveLeagueConfig();
    showToast(`${config.name} 시즌이 성공적으로 초기화되었습니다!`);
    
    // Auto-save user data to cloud
    saveUserProgress();
}

// 감독 커리어 통산 기록 및 명예의 전당 진행상태 기록 (isResigned: 중도 사퇴 여부)
function recordSeasonProgressToFame(isResigned = false) {
    const config = getActiveLeagueConfig();
    const sorted = [...leagueTeams].sort((a, b) => {
        if (b.pts !== a.pts) return b.pts - a.pts;
        if (b.gd !== a.gd) return b.gd - a.gd;
        return b.gf - a.gf;
    });
    
    const userTeamRank = sorted.findIndex(t => t.id === config.userTeamId) + 1;
    const userTeam = leagueTeams.find(t => t.id === config.userTeamId) || { w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 };
    const champion = sorted[0] || { name: config.userTeamName };
    
    // 득점왕 / 도움왕 산출 (해당 팀 선수만 기록)
    const playersArray = Object.values(leaguePlayerStats || {});
    const sortedGoals = [...playersArray].filter(p => p.goals > 0).sort((a, b) => b.goals - a.goals);
    const sortedAssists = [...playersArray].filter(p => p.assists > 0).sort((a, b) => b.assists - a.assists);
    
    const topScorer = sortedGoals[0] || null;
    const topAssister = sortedAssists[0] || null;
    
    let cupRecordText = "-";
    if (typeof cupState !== 'undefined' && cupState) {
        const winnerId = cupState.bracket?.winner?.id || cupState.champion;
        if (winnerId === config.userTeamId) {
            cupRecordText = "우승 🏆";
        } else {
            let playerEliminatedRound = 16;
            [16, 8, 4, 2].forEach(r => {
                const matches = cupState.bracket?.[r] || [];
                const pMatch = matches.find(m => (m.team1 && m.team1.id === config.userTeamId) || (m.team2 && m.team2.id === config.userTeamId));
                if (pMatch) {
                    playerEliminatedRound = r;
                }
            });
            if (playerEliminatedRound === 2) cupRecordText = "준우승 🥈";
            else if (playerEliminatedRound === 4) cupRecordText = "4강";
            else if (playerEliminatedRound === 8) cupRecordText = "8강";
            else cupRecordText = "16강";
        }
    }
    
    let aclRecordText = "-";
    if (typeof aclState !== 'undefined' && aclState) {
        if (aclState.champion === 'jeonbuk' || aclState.champion === 'liverpool') aclRecordText = "우승 🏆";
        else if (aclState.stage === 'final') aclRecordText = "준우승 🥈";
        else if (aclState.stage === 'semi') aclRecordText = "4강";
        else if (aclState.stage === 'quarter') aclRecordText = "8강";
        else if (aclState.stage === 'r16') aclRecordText = "16강";
        else aclRecordText = "조별리그";
    }
    
    const record = {
        leagueId: config.id,
        leagueName: config.name,
        year: leagueYear,
        resigned: isResigned,
        playedRound: leagueRound,
        totalRounds: config.totalRounds,
        userTeamId: config.userTeamId,
        userTeamName: config.userTeamName,
        userTeamRank: userTeamRank,
        jeonbukRank: userTeamRank, // 레거시 뷰 호환
        userTeamStats: {
            w: userTeam.w,
            d: userTeam.d,
            l: userTeam.l,
            gf: userTeam.gf,
            ga: userTeam.ga,
            pts: userTeam.pts
        },
        jeonbukStats: {
            w: userTeam.w,
            d: userTeam.d,
            l: userTeam.l,
            pts: userTeam.pts
        },
        champion: champion.name,
        topScorer: (topScorer && topScorer.teamId === config.userTeamId) ? { name: topScorer.name, goals: topScorer.goals } : null,
        topAssister: (topAssister && topAssister.teamId === config.userTeamId) ? { name: topAssister.name, assists: topAssister.assists } : null,
        cupRecord: cupRecordText,
        aclRecord: aclRecordText,
        isHardMode: isHardMode
    };
    
    // 중복 방지 검증 후 추가
    if (!hallOfFame.some(r => r.year === leagueYear && r.leagueId === config.id && r.isHardMode === isHardMode)) {
        hallOfFame.push(record);
        
        // 통산 커리어 스탯 누적
        let activeCareer = isHardMode ? careerStatsHard : careerStats;
        if (!activeCareer) {
            activeCareer = { w: 0, d: 0, l: 0, gf: 0, ga: 0, playerGoals: {} };
            if (isHardMode) careerStatsHard = activeCareer;
            else careerStats = activeCareer;
        }
        activeCareer.w += userTeam.w;
        activeCareer.d += userTeam.d;
        activeCareer.l += userTeam.l;
        activeCareer.gf += userTeam.gf;
        activeCareer.ga += userTeam.ga;
        
        // 플레이어 구단 소속 선수 골 누적
        playersArray.forEach(p => {
            if (p.teamId === config.userTeamId && p.goals > 0) {
                if (!activeCareer.playerGoals) activeCareer.playerGoals = {};
                if (!activeCareer.playerGoals[p.id]) {
                    activeCareer.playerGoals[p.id] = { name: p.name, goals: 0 };
                }
                activeCareer.playerGoals[p.id].goals += p.goals;
            }
        });
        
        try {
            localStorage.setItem('fc_star_hall_of_fame', JSON.stringify(hallOfFame));
            if (isHardMode) {
                localStorage.setItem('fc_star_career_stats_hard', JSON.stringify(careerStatsHard));
            } else {
                localStorage.setItem('fc_star_career_stats', JSON.stringify(careerStats));
            }
        } catch (e) {}
    }
}

// 감독 커리어 이적 함수 (새로운 리그 부임 -> 다음 연도 1라운드 시작)
function transferToLeague(targetLeagueId) {
    if (isMatchRunning) {
        showToast("경기 진행 중에는 리그를 이동할 수 없습니다.");
        return;
    }
    if (!LEAGUE_CONFIGS[targetLeagueId]) {
        console.error("Unknown league target:", targetLeagueId);
        return;
    }
    if (targetLeagueId === currentLeagueId) {
        showToast(`이미 ${LEAGUE_CONFIGS[targetLeagueId].name}를 진행 중입니다.`);
        return;
    }
    
    const oldConfig = getActiveLeagueConfig();
    
    // 1. 현재 시즌 진행 중(1R 이상 경기 기록 있음)이면 명예의 전당에 '중도 사퇴' 기록
    const playedMatches = leagueTeams.reduce((acc, t) => acc + (t.p || 0), 0);
    if (playedMatches > 0 && leagueRound <= oldConfig.totalRounds) {
        recordSeasonProgressToFame(true); // isResigned = true
    }
    
    // 2. 새 리그 설정 및 연도 증가
    currentLeagueId = targetLeagueId;
    leagueYear += 1;
    leagueRound = 1;
    
    // 3. 새 시즌 초기화 및 뷰 갱신
    resetLeagueSeasonState();
    if (typeof initCup === 'function') initCup();
    if (typeof initCupTab === 'function') initCupTab();
    syncPlayerTeamOvr();
    renderLeagueTable();
    updateMatchPreviewBoard();
    renderLeagueStats();
    renderHallOfFame();
    if (typeof updateAppLogo === 'function') updateAppLogo();
    if (typeof updateMatchSubTabsUI === 'function') updateMatchSubTabsUI();
    if (typeof updateFriendlyMatchPreview === 'function') updateFriendlyMatchPreview();
    if (typeof renderFriendlyTable === 'function') renderFriendlyTable();
    if (typeof switchMatchSubTab === 'function') switchMatchSubTab('league');
    
    // 4. 저장 및 부임 환영 안내
    saveUserProgress();
    const newConfig = getActiveLeagueConfig();
    showToast(`🎉 ${leagueYear}년, ${newConfig.name} [${newConfig.userTeamName}]의 새 사령탑으로 부임하셨습니다!`);
}

function getTeamEmblemPath(teamId) {
    const mapping = {
        // K리그
        "jeonbuk": "img/mark_jb.svg",
        "ulsan": "img/mark_ulsan.png",
        "seoul": "img/mark_seoul.png",
        "pohang": "img/mark_pohang.png",
        "gangwon": "img/mark_gangwon.png",
        "gwangju": "img/mark_gwangju.png",
        "gimcheon": "img/mark_kc.png",
        "bucheon_fc": "img/mark_buchn.png",
        "jeju": "img/mark_jeju.png",
        "daejeon": "img/mark_dj.png",
        "anyang": "img/mark_anyang.png",
        "incheon": "img/mark_incheon.png",
        // EPL
        "liverpool": "img/mark_liverpool.png",
        "mancity": "img/mark_mancity.png",
        "arsenal": "img/mark_arsenal.png",
        "chelsea": "img/mark_chelsea.png",
        "tottenham": "img/mark_tottenham.png",
        "manutd": "img/mark_manutd.png",
        "newcastle": "img/mark_newcastle.png",
        "astonvilla": "img/mark_astonvilla.png",
        "brighton": "img/mark_brighton.png",
        "westham": "img/mark_westham.png",
        "bournemouth": "img/mark_bournemouth.png",
        "fulham": "img/mark_fulham.png",
        "palace": "img/mark_palace.png",
        "brentford": "img/mark_brentford.png",
        "nottingham": "img/mark_nottingham.png",
        "wolves": "img/mark_wolves.png",
        "everton": "img/mark_everton.png",
        "leicester": "img/mark_leicester.png",
        "ipswich": "img/mark_ipswich.png",
        "southampton": "img/mark_southampton.png"
    };
    return mapping[teamId] || "img/mark_jb.svg";
}

function updateMatchPreviewBoard() {
    const config = getActiveLeagueConfig();
    
    // 현재 연도 시즌 텍스트 갱신
    const seasonYearTextEl = document.getElementById('leagueSeasonYearText');
    if (seasonYearTextEl) {
        seasonYearTextEl.innerText = `${leagueYear} ${config.seasonPrefix}`;
    }

    // 어려움 모드 뱃지 갱신
    const hardModeIndicatorEl = document.getElementById('leagueHardModeIndicator');
    if (hardModeIndicatorEl) {
        hardModeIndicatorEl.style.display = (typeof isHardMode !== 'undefined' && isHardMode) ? 'flex' : 'none';
    }

    // 오늘의 경기 진행 횟수 UI 업데이트
    const matchTodayCountValEl = document.getElementById('matchTodayCountVal');
    if (matchTodayCountValEl) {
        const todayStr = new Date().toLocaleDateString('ko-KR');
        const displayCount = (matchLastDate === todayStr) ? matchTodayCount : 0;
        matchTodayCountValEl.innerText = displayCount;
    }

    const matchRoundContainerEl = document.getElementById('matchRoundContainer');
    if (matchRoundContainerEl) {
        matchRoundContainerEl.innerHTML = `라운드: <span id="matchRoundVal">${Math.min(leagueRound, config.totalRounds)}</span>/${config.totalRounds} | 오늘 경기: <span id="matchTodayCountVal">${(matchLastDate === new Date().toLocaleDateString('ko-KR')) ? matchTodayCount : 0}</span>/10`;
    }

    if (leagueRound > config.totalRounds) {
        // Season completed
        const roundValEl = document.getElementById('matchRoundVal');
        if (roundValEl) roundValEl.innerText = config.totalRounds;
        document.getElementById('sbTimeDisplay').innerText = "끝";
        document.getElementById('homeTeamName').innerText = "시즌";
        document.getElementById('awayTeamName').innerText = "종료";
        document.getElementById('homeScore').innerText = "-";
        document.getElementById('awayScore').innerText = "-";
        document.getElementById('matchVenueDisplay').innerText = "시즌이 모두 종료되었습니다. 리셋을 눌러 새 시즌을 시작하세요!";
        const analysisCard = document.getElementById('leagueOpponentAnalysisCard');
        if (analysisCard) analysisCard.style.display = 'none';
        return;
    }
    
    const fixtures = config.fixtures;
    const fixture = fixtures[leagueRound - 1] || fixtures[0];
    const opponent = leagueTeams.find(t => t.id === fixture.opponent) || config.teamsPreset.find(t => t.id === fixture.opponent) || { id: fixture.opponent || "unknown", name: "상대팀", rating: 75 };
    const userTeam = leagueTeams.find(t => t.id === config.userTeamId) || config.teamsPreset.find(t => t.id === config.userTeamId) || { id: config.userTeamId, name: config.userTeamName, rating: 75 };
    
    // 상대팀 분위기 설정 및 바인딩
    if (typeof prepareOpponentMood === 'function') {
        if (!currentOpponentMood || currentOpponentMood.opponentId !== opponent.id) {
            prepareOpponentMood(opponent.id);
        }
    }
    const mood = (typeof currentOpponentMood !== 'undefined' && currentOpponentMood) ? currentOpponentMood : { modifier: 0, label: "보통", emoji: "😐" };
    const moodModifierSign = mood.modifier > 0 ? `+${mood.modifier}` : (mood.modifier < 0 ? `${mood.modifier}` : '');
    const oppOvrDisplayHtml = `${opponent.rating + mood.modifier}`;

    // 상대팀 포메이션 정보 로드 및 상성 분석
    const oppFormation = (typeof TEAM_FORMATIONS_PRESET !== 'undefined' && TEAM_FORMATIONS_PRESET[opponent.id]) ? TEAM_FORMATIONS_PRESET[opponent.id] : "4-4-2";
    const compBonus = (typeof getFormationCompatibilityBonus === 'function') ? getFormationCompatibilityBonus(currentFormation, oppFormation) : 0;
    
    // UI에 바인딩
    const analysisCard = document.getElementById('leagueOpponentAnalysisCard');
    if (analysisCard) {
        analysisCard.style.display = 'block';
        document.getElementById('leagueOpponentFormationText').innerText = oppFormation;
        document.getElementById('leagueOpponentMoodText').innerHTML = `${mood.label} ${mood.emoji}${mood.modifier !== 0 ? ` (OVR ${mood.modifier > 0 ? '+' + mood.modifier : mood.modifier})` : ''}`;
        
        const compTextEl = document.getElementById('leagueOpponentCompatibilityText');
        if (compTextEl) {
            compTextEl.className = 'opponent-analysis-tactic-row';
            if (compBonus > 0) {
                compTextEl.style.display = 'block';
                compTextEl.classList.add('tactic-advantage');
                compTextEl.innerHTML = `${config.userTeamName}의 <strong>${currentFormation}</strong> 전술이 상대의 <strong>${oppFormation}</strong> 전술에 상성상 우세합니다! (공격 찬스 확률 +5.0% ⚡)`;
            } else if (compBonus < 0) {
                compTextEl.style.display = 'block';
                compTextEl.classList.add('tactic-disadvantage');
                compTextEl.innerHTML = `상대의 <strong>${oppFormation}</strong> 전술이 ${config.userTeamName}의 <strong>${currentFormation}</strong> 전술에 상성상 우세합니다. (공격 찬스 확률 -5.0% ⚠️)`;
            } else {
                compTextEl.style.display = 'none';
            }
        }
    }

    const roundValEl = document.getElementById('matchRoundVal');
    if (roundValEl) roundValEl.innerText = leagueRound;
    document.getElementById('sbTimeDisplay').innerText = "VS";
    document.getElementById('homeScore').innerText = "0";
    document.getElementById('awayScore').innerText = "0";
    
    const venueName = (config.id === 'epl') ? '안필드' : '전주성';
    
    if (fixture.isHome) {
        document.getElementById('homeTeamName').innerText = userTeam.name;
        document.getElementById('homeTeamOvr').innerText = userTeam.rating + 2;
        document.getElementById('awayTeamName').innerText = opponent.name;
        document.getElementById('awayTeamOvr').innerHTML = oppOvrDisplayHtml;
        
        const homeEmb = document.getElementById('homeEmblem');
        const awayEmb = document.getElementById('awayEmblem');
        if (homeEmb) {
            homeEmb.innerHTML = `<img src="${getTeamEmblemPath(userTeam.id)}" alt="${userTeam.name}" class="match-emblem-img match-emblem-glow" style="height: 48px; width: 48px; object-fit: contain;">`;
            homeEmb.removeAttribute('style');
            homeEmb.classList.add('jeonbuk-emblem-box');
        }
        if (awayEmb) {
            awayEmb.innerHTML = `<img src="${getTeamEmblemPath(opponent.id)}" alt="${opponent.name}" class="match-emblem-img" style="height: 48px; width: 48px; filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.35)); object-fit: contain;">`;
            awayEmb.removeAttribute('style');
            awayEmb.classList.remove('jeonbuk-emblem-box');
        }
        
        document.getElementById('matchVenueDisplay').innerText = `홈 경기 (${venueName}) - HOME ADVANTAGE +2 OVR`;
    } else {
        document.getElementById('homeTeamName').innerText = opponent.name;
        document.getElementById('homeTeamOvr').innerHTML = opponent.rating + mood.modifier + 2;
        document.getElementById('awayTeamName').innerText = userTeam.name;
        document.getElementById('awayTeamOvr').innerText = userTeam.rating;
        
        const homeEmb = document.getElementById('homeEmblem');
        const awayEmb = document.getElementById('awayEmblem');
        if (homeEmb) {
            homeEmb.innerHTML = `<img src="${getTeamEmblemPath(opponent.id)}" alt="${opponent.name}" class="match-emblem-img" style="height: 48px; width: 48px; filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.35)); object-fit: contain;">`;
            homeEmb.removeAttribute('style');
            homeEmb.classList.remove('jeonbuk-emblem-box');
        }
        if (awayEmb) {
            awayEmb.innerHTML = `<img src="${getTeamEmblemPath(userTeam.id)}" alt="${userTeam.name}" class="match-emblem-img match-emblem-glow" style="height: 48px; width: 48px; object-fit: contain;">`;
            awayEmb.removeAttribute('style');
            awayEmb.classList.add('jeonbuk-emblem-box');
        }
        
        document.getElementById('matchVenueDisplay').innerText = "원정 경기 - AWAY PENALTY";
    }
}

function renderLeagueTable() {
    const config = getActiveLeagueConfig();
    const titleEl = document.getElementById('leagueTableTitle');
    if (titleEl) {
        titleEl.innerHTML = `<i class="fa-solid fa-ranking-star" style="margin-right: 8px; color: #ffd700;"></i>${leagueYear} ${config.seasonPrefix} 실시간 순위`;
    }

    const tbody = document.getElementById('leagueTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';
    
    // Sort Standings: 1. PTS (desc), 2. GD (desc), 3. GF (desc)
    const sorted = [...leagueTeams].sort((a, b) => {
        if (b.pts !== a.pts) return b.pts - a.pts;
        if (b.gd !== a.gd) return b.gd - a.gd;
        return b.gf - a.gf;
    });
    
    sorted.forEach((team, idx) => {
        const rank = idx + 1;
        const row = document.createElement('tr');
        
        if (team.id === config.userTeamId) {
            row.className = 'league-row-jeonbuk';
        }
        
        const gdSign = team.gd > 0 ? `+${team.gd}` : team.gd;
        
        row.innerHTML = `
            <td class="league-row-rank">${rank}</td>
            <td class="league-team-col" title="팀 전력: OVR ${team.rating}">
                <img src="${getTeamEmblemPath(team.id)}" alt="${team.name}">
                <span>${team.name}</span>
                <span class="league-team-ovr-badge">OVR ${team.rating}</span>
            </td>
            <td>${team.p}</td>
            <td class="league-row-pts">${team.pts}</td>
            <td>${team.w}</td>
            <td>${team.d}</td>
            <td>${team.l}</td>
            <td>${gdSign}</td>
        `;
        
        tbody.appendChild(row);
    });
}

function startLeagueAutoSimulation() {
    const config = getActiveLeagueConfig();
    if (isMatchRunning) {
        showToast("⚠️ 현재 경기가 진행 중입니다.");
        return;
    }
    if (leagueRound > config.totalRounds) {
        showToast("시즌이 종료되었습니다. 우측 상단의 '시즌 리셋'을 진행해주세요!");
        return;
    }
    
    const inputVal = prompt("몇 경기를 자동 진행할까요?", "10");
    if (inputVal === null) return;
    
    const roundsToSimulate = parseInt(inputVal, 10);
    if (isNaN(roundsToSimulate) || roundsToSimulate <= 0) {
        showToast("⚠️ 올바른 경기 수를 입력해주세요.");
        return;
    }
    
    let simulatedCount = 0;
    let wins = 0;
    let draws = 0;
    let losses = 0;
    
    const todayStr = new Date().toLocaleDateString('ko-KR');
    
    // 날짜가 변경되었을 경우 오늘의 경기 진행수 초기화
    if (matchLastDate !== todayStr) {
        matchTodayCount = 0;
        localStorage.setItem('fc_star_match_today_count', '0');
    }
    
    for (let i = 0; i < roundsToSimulate; i++) {
        if (leagueRound > config.totalRounds) {
            alert(`시즌이 종료되어 자동진행이 중단되었습니다.\n진행된 경기: ${simulatedCount}경기 (${wins}승 ${draws}무 ${losses}패)`);
            break;
        }
        
        // K리그일 때만 33라운드 최종전 직전, 코리아컵/아챔 완료 상태 검사
        if (config.id === 'kleague1' && leagueRound === 33) {
            let isCupFinished = false;
            try {
                const savedCup = localStorage.getItem('fc_star_cup_state_kleague1') || localStorage.getItem('fc_star_cup_state');
                if (savedCup) {
                    const cupStateParsed = JSON.parse(savedCup);
                    isCupFinished = cupStateParsed.isFinished;
                }
            } catch (e) {
                console.warn("Cup state check failed:", e);
            }
            
            if (!isCupFinished) {
                alert(`⚠️ K리그1 33라운드 최종전을 시작하기 전에 코리아컵 결승전을 완료해야 하므로 자동진행이 중단되었습니다!\n진행된 경기: ${simulatedCount}경기 (${wins}승 ${draws}무 ${losses}패)`);
                break;
            }
    
            let isAclFinished = false;
            try {
                const savedAcl = localStorage.getItem('fc_star_acl_state');
                if (savedAcl) {
                    const aclStateParsed = JSON.parse(savedAcl);
                    isAclFinished = aclStateParsed.isFinished;
                }
            } catch (e) {
                console.warn("ACL state check failed:", e);
            }
            
            if (!isAclFinished) {
                alert(`⚠️ K리그1 33라운드 최종전을 시작하기 전에 AFC 챔피언스리그를 완료해야 하므로 자동진행이 중단되었습니다!\n진행된 경기: ${simulatedCount}경기 (${wins}승 ${draws}무 ${losses}패)`);
                break;
            }
        } else if (config.id === 'epl' && leagueRound === 38) {
            // EPL 38라운드 최종전 직전 카라바오컵 완료 상태 검사
            let isCupFinished = false;
            try {
                const savedCup = localStorage.getItem('fc_star_cup_state_epl');
                if (savedCup) {
                    const cupStateParsed = JSON.parse(savedCup);
                    isCupFinished = cupStateParsed.isFinished;
                }
            } catch (e) {
                console.warn("EPL Cup state check failed:", e);
            }
            
            if (!isCupFinished) {
                alert(`⚠️ 프리미어리그 38라운드 최종전을 시작하기 전에 카라바오컵 결승전을 완료해야 하므로 자동진행이 중단되었습니다!\n진행된 경기: ${simulatedCount}경기 (${wins}승 ${draws}무 ${losses}패)`);
                break;
            }
        }
        
        // 일일 경기 제한 검사 (개발자 모드 아닐 시)
        if (!isDeveloperMode && matchTodayCount >= 10) {
            alert(`⚠️ 하루 최대 10경기 진행 제한에 도달하여 자동진행이 중단되었습니다.\n진행된 경기: ${simulatedCount}경기 (${wins}승 ${draws}무 ${losses}패)\n내일 다시 도전해 주세요!`);
            break;
        }
        
        // 1. 플레이어 팀 OVR 동기화
        syncPlayerTeamOvr();
        
        const fixtures = config.fixtures;
        const fixture = fixtures[leagueRound - 1];
        if (!fixture) break;
        const opponent = leagueTeams.find(t => t.id === fixture.opponent) || { rating: 75, name: "상대팀" };
        const userTeam = leagueTeams.find(t => t.id === config.userTeamId) || { rating: 75, name: config.userTeamName };
        
        // 2. 포메이션 전술 보너스 연산
        const formTactic = getPlayerFormationTacticBonuses();
        const formationAttackBoost = formTactic.formationAttackBoost;
        const formationScoreBoost = formTactic.formationScoreBoost;
    
        const isPlayerHome = fixture.isHome;
        const finalOvrs = calculateFinalMatchOvrs('league', isPlayerHome, opponent.rating, false);
        const playerOvr = finalOvrs.playerOvr;
        const opponentOvr = finalOvrs.opponentOvr;
        const diff = playerOvr - opponentOvr;
        
        // Score counters
        let playerScoreVal = 0;
        let opponentScoreVal = 0;
        
        const detailedTactic = getPlayerDetailedTacticBonuses();
        const detailedTacticBonus = detailedTactic.detailedTacticBonus;
        const suitabilityBonus = detailedTactic.suitabilityBonus;
        
        const activeAttacker = squadFormation["ST"] ? CARDS_DATABASE[squadFormation["ST"]].name : "무명 스트라이커";
        const activeLw = squadFormation["LW"] ? CARDS_DATABASE[squadFormation["LW"]].name : "무명 윙어";
        const activeRw = squadFormation["RW"] ? CARDS_DATABASE[squadFormation["RW"]].name : "무명 윙백";
        const activeCm = squadFormation["CM"] ? CARDS_DATABASE[squadFormation["CM"]].name : "무명 미드필더";
        const activeGk = squadFormation["GK"] ? CARDS_DATABASE[squadFormation["GK"]].name : "무명 골키퍼";
        
        const maxProb = 0.80;
        const minProb = 0.20;
        
        const opponentFormation = (typeof TEAM_FORMATIONS_PRESET !== 'undefined' && TEAM_FORMATIONS_PRESET[opponent.id]) ? TEAM_FORMATIONS_PRESET[opponent.id] : "4-4-2";
        const compatibilityBonus = (typeof getFormationCompatibilityBonus === 'function') ? getFormationCompatibilityBonus(currentFormation, opponentFormation) : 0;
        let activeDiff = diff;
        let activePlayerAttackProb = Math.min(maxProb, Math.max(minProb, 0.40 + (diff * 0.019) + formationAttackBoost + suitabilityBonus + detailedTacticBonus + compatibilityBonus - (isHardMode ? 0.05 : 0)));
        
        const eventMins = [15, 45, 63, 82, 88];
        
        eventMins.forEach(currentMin => {
            const activePlayers = { ST: activeAttacker, LW: activeLw, RW: activeRw, CM: activeCm, GK: activeGk };
            const specialEvent = rollSpecialMatchEvent(activePlayers, opponent.name);
            
            if (specialEvent) {
                if (specialEvent.type === "pk_player") {
                    if (specialEvent.isGoal) {
                        playerScoreVal++;
                        const goalData = determineScorerAndAssister(1);
                        processPlayerGoal(goalData);
                    }
                } else if (specialEvent.type === "pk_opponent") {
                    if (specialEvent.isGoal) {
                        opponentScoreVal++;
                        const oppGoalData = determineOpponentScorerAndAssister(opponent.id);
                        if (oppGoalData.scorerId) {
                            registerGoal(oppGoalData.scorerId, oppGoalData.scorerName, opponent.id, opponent.name);
                        }
                        if (oppGoalData.assisterId) {
                            registerAssist(oppGoalData.assisterId, oppGoalData.assisterName, opponent.id, opponent.name);
                        }
                    }
                } else if (specialEvent.type === "red_opponent") {
                    activeDiff += specialEvent.ovrChange;
                    activePlayerAttackProb = Math.min(maxProb, Math.max(minProb, 0.40 + (activeDiff * 0.019) + formationAttackBoost + suitabilityBonus + detailedTacticBonus + compatibilityBonus - (isHardMode ? 0.05 : 0)));
                } else if (specialEvent.type === "red_player") {
                    activeDiff += specialEvent.ovrChange;
                    activePlayerAttackProb = Math.min(maxProb, Math.max(minProb, 0.40 + (activeDiff * 0.019) + formationAttackBoost + suitabilityBonus + detailedTacticBonus + compatibilityBonus - (isHardMode ? 0.05 : 0)));
                }
            } else {
                const isPlayerAttack = Math.random() < activePlayerAttackProb;
                if (isPlayerAttack) {
                    let attackOptions = [0, 1, 2];
                    if (currentFormation === '4-2-3-1') attackOptions.push(5);
                    
                    const selectedOption = attackOptions[Math.floor(Math.random() * attackOptions.length)];
                    let chancePlayerStat = 75;
                    
                    if (selectedOption === 0) {
                        const lwCardId = squadFormation['LW'];
                        if (lwCardId && CARDS_DATABASE[lwCardId]) {
                            const card = getAwakenedCard(lwCardId);
                            chancePlayerStat = getWingerChanceStat('LW', card);
                        }
                    } else if (selectedOption === 1) {
                        const stCardId = squadFormation['ST'];
                        if (stCardId && CARDS_DATABASE[stCardId]) {
                            const card = getAwakenedCard(stCardId);
                            chancePlayerStat = getStrikerChanceStat('ST', card, strikerStyles);
                        }
                    } else if (selectedOption === 2) {
                        const rwCardId = squadFormation['RW'];
                        if (rwCardId && CARDS_DATABASE[rwCardId]) {
                            const card = getAwakenedCard(rwCardId);
                            chancePlayerStat = getWingerChanceStat('RW', card);
                        }
                    } else if (selectedOption === 5) {
                        const cmCardId = squadFormation['CM'];
                        if (cmCardId && CARDS_DATABASE[cmCardId]) {
                            const card = getAwakenedCard(cmCardId);
                            chancePlayerStat = card.stats.dri || 75;
                        }
                    }
                    
                    const scoreProb = calculatePlayerScoreProb(activeDiff, chancePlayerStat, opponentOvr, formationScoreBoost, suitabilityBonus);
                    const isGoal = Math.random() < scoreProb;
                    if (isGoal) {
                        playerScoreVal++;
                        const goalData = determineScorerAndAssister(selectedOption);
                        processPlayerGoal(goalData);
                    }
                } else {
                    let playerGkStat = 70;
                    const gkCardId = squadFormation['GK'];
                    if (gkCardId && CARDS_DATABASE[gkCardId]) {
                        const card = getAwakenedCard(gkCardId);
                        playerGkStat = card.stats.def || card.rating || 70;
                    }
                    
                    const oppScoreProb = calculateOpponentScoreProb(activeDiff, opponentOvr, playerGkStat);
                    const isGoal = Math.random() < oppScoreProb;
                    if (isGoal) {
                        opponentScoreVal++;
                        const oppGoalData = determineOpponentScorerAndAssister(opponent.id);
                        if (oppGoalData.scorerId) {
                            registerGoal(oppGoalData.scorerId, oppGoalData.scorerName, opponent.id, opponent.name);
                        }
                        if (oppGoalData.assisterId) {
                            registerAssist(oppGoalData.assisterId, oppGoalData.assisterName, opponent.id, opponent.name);
                        }
                    }
                }
            }
        });
        
        const isWinner = playerScoreVal > opponentScoreVal;
        const isDraw = playerScoreVal === opponentScoreVal;
        
        if (isWinner) {
            wins++;
            userTeam.w += 1; userTeam.pts += 3;
            opponent.l += 1;
            if (typeof updateLeagueWinStreak === 'function') updateLeagueWinStreak(true, false);
        } else if (isDraw) {
            draws++;
            userTeam.d += 1; userTeam.pts += 1;
            opponent.d += 1; opponent.pts += 1;
            if (typeof updateLeagueWinStreak === 'function') updateLeagueWinStreak(false, true);
        } else {
            losses++;
            userTeam.l += 1;
            opponent.w += 1; opponent.pts += 3;
            if (typeof updateLeagueWinStreak === 'function') updateLeagueWinStreak(false, false);
        }
        
        userTeam.p += 1; userTeam.gf += playerScoreVal; userTeam.ga += opponentScoreVal; userTeam.gd = userTeam.gf - userTeam.ga;
        opponent.p += 1; opponent.gf += opponentScoreVal; opponent.ga += playerScoreVal; opponent.gd = opponent.gf - opponent.ga;
        
        simulateOtherMatches(fixture.opponent);
        leagueRound += 1;
        simulatedCount++;
        matchTodayCount += 1;
    }
    
    if (simulatedCount > 0) {
        matchLastDate = todayStr;
        
        try {
            localStorage.setItem('fc_star_league_teams', JSON.stringify(leagueTeams));
            localStorage.setItem('fc_star_league_round', leagueRound.toString());
            localStorage.setItem('fc_star_match_last_date', matchLastDate);
            localStorage.setItem('fc_star_match_today_count', matchTodayCount.toString());
            localStorage.setItem('fc_star_user_points', userPoints.toString());
            localStorage.setItem('fc_star_league_stats', JSON.stringify(leaguePlayerStats));
        } catch(e) {
            console.warn("Saving standing failed", e);
        }
        
        renderUserPoints();
        renderLeagueTable();
        renderLeagueStats();
        
        // 메인 스크롤 코멘터리 박스 리셋
        const commBox = document.getElementById('commentaryScroll');
        if (commBox) {
            commBox.innerHTML = `<div class="comm-item comm-system">리그 자동 진행이 완료되었습니다. (${simulatedCount}경기 완료)</div>`;
        }
        
        document.getElementById('homeScore').innerText = "-";
        document.getElementById('awayScore').innerText = "-";
        document.getElementById('sbTimeDisplay').innerText = "대기";
        
        if (leagueRound > config.totalRounds) {
            setTimeout(() => {
                checkSeasonChampion();
            }, 500);
        } else {
            updateMatchPreviewBoard();
        }
        
        saveUserProgress();
        
        alert(`🏆 ${config.name} 자동 진행이 완료되었습니다!\n\n▶ 진행 경기: ${simulatedCount}경기\n▶ 결과: ${wins}승 ${draws}무 ${losses}패\n▶ 현재 라운드: ${leagueRound > config.totalRounds ? '시즌 종료' : leagueRound + '라운드'}`);
    }
}

function startMatchSimulation() {
    const config = getActiveLeagueConfig();
    if (isMatchRunning) return;
    if (leagueRound > config.totalRounds) {
        showToast("시즌이 종료되었습니다. 우측 상단의 '시즌 리셋'을 진행해주세요!");
        return;
    }
    
    // KFA 코리아컵 & ACL 완료 여부 체크 (K리그일 때만 33라운드 최종전 진입 시 차단)
    if (config.id === 'kleague1' && leagueRound === 33) {
        let isCupFinished = false;
        try {
            const savedCup = localStorage.getItem('fc_star_cup_state');
            if (savedCup) {
                const cupStateParsed = JSON.parse(savedCup);
                isCupFinished = cupStateParsed.isFinished;
            }
        } catch (e) {
            console.warn("Cup state check failed:", e);
        }
        
        if (!isCupFinished) {
            alert("⚠️ K리그1 33라운드 최종전을 시작하기 전에 코리아컵(리그컵) 결승전을 완료해야 합니다!\n코리아컵 탭으로 이동하여 대회를 마쳐주세요.");
            return;
        }

        let isAclFinished = false;
        try {
            const savedAcl = localStorage.getItem('fc_star_acl_state');
            if (savedAcl) {
                const aclStateParsed = JSON.parse(savedAcl);
                isAclFinished = aclStateParsed.isFinished;
            }
        } catch (e) {
            console.warn("ACL state check failed:", e);
        }
        
        if (!isAclFinished) {
            alert("⚠️ K리그1 33라운드 최종전을 시작하기 전에 AFC 챔피언스리그(아챔)를 완료해야 합니다!\n아챔 탭으로 이동하여 대회를 마쳐주세요.");
            return;
        }
    }
    
    const todayStr = new Date().toLocaleDateString('ko-KR');
    
    // 날짜가 변경되었을 경우 오늘의 경기 진행수 초기화
    if (matchLastDate !== todayStr) {
        matchTodayCount = 0;
        localStorage.setItem('fc_star_match_today_count', '0');
    }
    
    // 일 단위 경기 진행 제한 체크 (개발자 모드 아닐 시 하루 10경기만 가능)
    if (!isDeveloperMode && matchTodayCount >= 10) {
        showToast("⚠️ 경기는 하루에 최대 10경기만 진행할 수 있습니다! 내일 다시 도전해 주세요.");
        return;
    }
    
    // Ensure User Team stats are synchronized
    syncPlayerTeamOvr();
    
    isMatchRunning = true;
    
    const startBtn = document.getElementById('btnStartMatch');
    if (startBtn) {
        startBtn.disabled = true;
        startBtn.style.background = 'rgba(255, 255, 255, 0.05)';
        startBtn.style.color = 'var(--text-muted)';
        startBtn.style.cursor = 'not-allowed';
    }
    
    const fixtures = config.fixtures;
    const fixture = fixtures[leagueRound - 1];
    const opponent = leagueTeams.find(t => t.id === fixture.opponent) || { rating: 75, name: "상대팀" };
    const userTeam = leagueTeams.find(t => t.id === config.userTeamId) || { rating: 75, name: config.userTeamName };
    
    // 포메이션 전술에 따른 직접/비례 확률 보너스 연산 엔진
    const formTactic = getPlayerFormationTacticBonuses();
    const formationAttackBoost = formTactic.formationAttackBoost;
    const formationScoreBoost = formTactic.formationScoreBoost;
    const formationTacticDetailsHtml = formTactic.formationTacticDetailsHtml;

    const isPlayerHome = fixture.isHome;
    
    // 1. Home-Away Advantage configuration (+2 OVR)
    const finalOvrs = calculateFinalMatchOvrs('league', isPlayerHome, opponent.rating, false);
    const playerOvr = finalOvrs.playerOvr;
    const opponentOvr = finalOvrs.opponentOvr;
    const diff = playerOvr - opponentOvr;
    
    // Score counters
    let playerScoreVal = 0;
    let opponentScoreVal = 0;
    
    // 2. Play starting whistle sound
    playSound('reveal');
    
    // Clear commentary box
    const commBox = document.getElementById('commentaryScroll');
    commBox.innerHTML = '';
    
    const addCommentary = (min, text, type = 'normal') => {
        const item = document.createElement('div');
        item.className = `comm-item comm-${type}`;
        
        const timestamp = min === 'SYSTEM' || min === 'FT' ? '' : `<strong style="color:#ffd700; margin-right: 6px;">${min}'</strong>`;
        item.innerHTML = `${timestamp}${text}`;
        
        commBox.appendChild(item);
        commBox.scrollTop = commBox.scrollHeight;
    };
    
    // Clock tick simulator: 10 ticks representing match timeline
    const matchMinutes = [0, 15, 30, 45, 52, 63, 74, 82, 88, 90];
    let tickIdx = 0;

    // 세부전술 및 전술 적합 보너스 계산
    const detailedTactic = getPlayerDetailedTacticBonuses();
    const detailedTacticBonus = detailedTactic.detailedTacticBonus;
    const suitabilityBonus = detailedTactic.suitabilityBonus;
    const detailedTacticLabel = detailedTactic.detailedTacticLabel;
    const suitabilityLabel = detailedTactic.suitabilityLabel;
    
    const sbTimeDisplay = document.getElementById('sbTimeDisplay');
    sbTimeDisplay.classList.add('live-ticking');
    
    // Attack Event Generators (5 key attacks simulated at minutes 15, 45, 63, 82, 88)
    const eventMins = [15, 45, 63, 82, 88];
    
    // Retreive active player names in key positions for personalized commentaries
    const activeAttacker = squadFormation["ST"] ? CARDS_DATABASE[squadFormation["ST"]].name : "무명 스트라이커";
    const activeLw = squadFormation["LW"] ? CARDS_DATABASE[squadFormation["LW"]].name : "무명 윙어";
    const activeRw = squadFormation["RW"] ? CARDS_DATABASE[squadFormation["RW"]].name : "무명 윙백";
    const activeCm = squadFormation["CM"] ? CARDS_DATABASE[squadFormation["CM"]].name : "무명 미드필더";
    const activeGk = squadFormation["GK"] ? CARDS_DATABASE[squadFormation["GK"]].name : "무명 골키퍼";
    
    // 3. CALIBRATED WIN PROBABILITY ALGORITHM (Diff = playerOvr - opponentOvr)
    // Capped probabilities to balance the luck and stats, plus tactical Gegenpressing boost and formation attack boost
    const maxProb = 0.80; // 상한 80%로 조정!
    const minProb = 0.20;
    
    const opponentFormation = TEAM_FORMATIONS_PRESET[opponent.id] || "4-4-2";
    const compatibilityBonus = getFormationCompatibilityBonus(currentFormation, opponentFormation);
    const playerAttackProb = Math.min(maxProb, Math.max(minProb, 0.40 + (diff * 0.019) + formationAttackBoost + suitabilityBonus + detailedTacticBonus + compatibilityBonus - (isHardMode ? 0.05 : 0))); // 베이스 40%, 격차 0.019, 상성 보너스 적용!
    
    let activeDiff = diff;
    let activePlayerAttackProb = playerAttackProb;

    // 공통 코멘터리 데이터 정의
    const commentaryData = {
        playerOvr: playerOvr,
        opponentName: opponent.name,
        opponentOvr: opponentOvr,
        isPlayerHome: isPlayerHome,
        playerScoreVal: playerScoreVal,
        opponentScoreVal: opponentScoreVal,
        activeGk: activeGk,
        detailedTacticLabel: detailedTacticLabel,
        suitabilityLabel: suitabilityLabel,
        playerAttackProb: playerAttackProb,
        compatibilityBonus: compatibilityBonus
    };

    addCommentary('SYSTEM', getMatchEventCommentary('PRE_ANALYZE', commentaryData, false), 'system');
    
    if (formationTacticDetailsHtml) {
        addCommentary('SYSTEM', formationTacticDetailsHtml, 'attack');
    }
    
    if (detailedTacticLabel || suitabilityLabel) {
        addCommentary('SYSTEM', getMatchEventCommentary('TACTIC_ANALYZE', commentaryData, false), 'attack');
    }
    
    // 개발자 모드: 대기 없이 즉시 시뮬레이션 결과 연산 및 출력
    if (isDeveloperMode) {
        sbTimeDisplay.classList.remove('live-ticking');
        sbTimeDisplay.innerText = "종료";
        
        matchMinutes.forEach(currentMin => {
            if (currentMin === 0) {
                addCommentary(0, getMatchEventCommentary('KICKOFF', commentaryData, false, true), 'normal');
            } else if (eventMins.includes(currentMin)) {
                // 특별 돌발 변수 체크
                const activePlayers = { ST: activeAttacker, LW: activeLw, RW: activeRw, CM: activeCm, GK: activeGk };
                const specialEvent = rollSpecialMatchEvent(activePlayers, opponent.name);
                
                if (specialEvent) {
                    addCommentary(currentMin, specialEvent.eventDesc, 'system');
                    if (specialEvent.type === "pk_player") {
                        if (specialEvent.isGoal) {
                            playerScoreVal++;
                            const goalData = determineScorerAndAssister(1); // PK는 보통 ST가 키커
                            processPlayerGoal(goalData);
                            addCommentary(currentMin, specialEvent.eventGoal, 'goal');
                        } else {
                            addCommentary(currentMin, specialEvent.eventFail, 'normal');
                        }
                    } else if (specialEvent.type === "pk_opponent") {
                        if (specialEvent.isGoal) {
                            opponentScoreVal++;
                            const oppGoalData = determineOpponentScorerAndAssister(opponent.id);
                            if (oppGoalData.scorerId) {
                                registerGoal(oppGoalData.scorerId, oppGoalData.scorerName, opponent.id, opponent.name);
                            }
                            if (oppGoalData.assisterId) {
                                registerAssist(oppGoalData.assisterId, oppGoalData.assisterName, opponent.id, opponent.name);
                            }
                            let pkCommentaryText = specialEvent.eventGoal;
                            if (oppGoalData.scorerName) {
                                pkCommentaryText = `⚽ <strong>[PK 실점]</strong> 상대 키커 <strong>${oppGoalData.scorerName}</strong>의 강력한 슛이 그대로 그물을 출렁입니다! 골키퍼가 방향을 읽지 못했습니다.`;
                            }
                            addCommentary(currentMin, pkCommentaryText, 'normal');
                        } else {
                            addCommentary(currentMin, specialEvent.eventFail, 'normal');
                        }
                    } else if (specialEvent.type === "red_opponent") {
                        activeDiff += specialEvent.ovrChange; // +5
                        activePlayerAttackProb = Math.min(maxProb, Math.max(minProb, 0.40 + (activeDiff * 0.019) + formationAttackBoost + suitabilityBonus + detailedTacticBonus + compatibilityBonus - (isHardMode ? 0.05 : 0)));
                        addCommentary(currentMin, specialEvent.eventFail, 'normal');
                    } else if (specialEvent.type === "red_player") {
                        activeDiff += specialEvent.ovrChange; // -5
                        activePlayerAttackProb = Math.min(maxProb, Math.max(minProb, 0.40 + (activeDiff * 0.019) + formationAttackBoost + suitabilityBonus + detailedTacticBonus + compatibilityBonus - (isHardMode ? 0.05 : 0)));
                        addCommentary(currentMin, specialEvent.eventFail, 'normal');
                    }
                } else {
                    const isPlayerAttack = Math.random() < activePlayerAttackProb;
                    if (isPlayerAttack) {
                        // 공격 이벤트 유형 풀 구성 및 무작위 선택
                        let attackOptions = [0, 1, 2]; // 0: LW 돌파, 1: ST 돌파, 2: RW 돌파
                        if (currentFormation === '4-2-3-1') attackOptions.push(5); // 4-2-3-1 점유율 연출
                        
                        const selectedOption = attackOptions[Math.floor(Math.random() * attackOptions.length)];
                        let chancePlayerStat = 75;
                        
                        if (selectedOption === 0) {
                            const lwCardId = squadFormation['LW'];
                            if (lwCardId && CARDS_DATABASE[lwCardId]) {
                                const card = getAwakenedCard(lwCardId);
                                chancePlayerStat = getWingerChanceStat('LW', card);
                            }
                        } else if (selectedOption === 1) {
                            const stCardId = squadFormation['ST'];
                            if (stCardId && CARDS_DATABASE[stCardId]) {
                                 const card = getAwakenedCard(stCardId);
                                 chancePlayerStat = getStrikerChanceStat('ST', card, strikerStyles);
                            }
                        } else if (selectedOption === 2) {
                            const rwCardId = squadFormation['RW'];
                            if (rwCardId && CARDS_DATABASE[rwCardId]) {
                                const card = getAwakenedCard(rwCardId);
                                chancePlayerStat = getWingerChanceStat('RW', card);
                            }
                        } else if (selectedOption === 5) { // 4-2-3-1 점유율 연출 (CM 드리블 비례)
                            const cmCardId = squadFormation['CM'];
                            if (cmCardId && CARDS_DATABASE[cmCardId]) {
                                const card = getAwakenedCard(cmCardId);
                                chancePlayerStat = card.stats.dri || 75;
                            }
                        }
                        
                        const scoreProb = calculatePlayerScoreProb(activeDiff, chancePlayerStat, opponentOvr, formationScoreBoost, suitabilityBonus);
                        const isGoal = Math.random() < scoreProb;
                        const activePlayers = { ST: activeAttacker, LW: activeLw, RW: activeRw, CM: activeCm };
                        const isTacticActive = detailedTacticBonus > 0;
                        const { eventDesc, eventGoal, eventFail } = getDetailedTacticCommentary(selectedOption, currentFormation, isTacticActive, activePlayers, squadFormation, playerDeck, wingerStyles, strikerStyles);
                        
                        addCommentary(currentMin, eventDesc, 'attack');
                        if (isGoal) {
                            playerScoreVal++;
                            const goalData = determineScorerAndAssister(selectedOption);
                            processPlayerGoal(goalData);
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
                        
                        const oppScoreProb = calculateOpponentScoreProb(activeDiff, opponentOvr, playerGkStat);
                        const isGoal = Math.random() < oppScoreProb;
                        
                        addCommentary(currentMin, getMatchEventCommentary('OPP_ATTACK', commentaryData, false), 'attack');
                        if (isGoal) {
                            opponentScoreVal++;
                            const oppGoalData = determineOpponentScorerAndAssister(opponent.id);
                            if (oppGoalData.scorerId) {
                                registerGoal(oppGoalData.scorerId, oppGoalData.scorerName, opponent.id, opponent.name);
                            }
                            if (oppGoalData.assisterId) {
                                registerAssist(oppGoalData.assisterId, oppGoalData.assisterName, opponent.id, opponent.name);
                            }
                            const goalCommentaryData = { ...commentaryData, opponentScorerName: oppGoalData.scorerName, opponentAssisterName: oppGoalData.assisterName };
                            addCommentary(currentMin, getMatchEventCommentary('OPP_GOAL', goalCommentaryData, false), 'normal');
                        } else {
                            addCommentary(currentMin, getMatchEventCommentary('GK_SAVE', commentaryData, false), 'normal');
                        }
                    }
                }
            } else if (currentMin === 45) {
                commentaryData.playerScoreVal = playerScoreVal;
                commentaryData.opponentScoreVal = opponentScoreVal;
                addCommentary('HT', getMatchEventCommentary('HALFTIME', commentaryData, false, true), 'system');
            }
        });

        if (isPlayerHome) {
            document.getElementById('homeScore').innerText = playerScoreVal;
            document.getElementById('awayScore').innerText = opponentScoreVal;
        } else {
            document.getElementById('homeScore').innerText = opponentScoreVal;
            document.getElementById('awayScore').innerText = playerScoreVal;
        }

        const isWinner = playerScoreVal > opponentScoreVal;
        const isDraw = playerScoreVal === opponentScoreVal;
        
        commentaryData.playerScoreVal = playerScoreVal;
        commentaryData.opponentScoreVal = opponentScoreVal;

        addCommentary('FT', getMatchEventCommentary('FULLTIME', commentaryData, false), 'system');
        if (isWinner) {
            addCommentary('FT', getMatchEventCommentary('RESULT', commentaryData, false), 'goal');
        } else if (isDraw) {
            addCommentary('FT', getMatchEventCommentary('RESULT', commentaryData, false), 'system');
        } else {
            addCommentary('FT', getMatchEventCommentary('RESULT', commentaryData, false), 'normal');
        }

        const userTeam = leagueTeams.find(t => t.id === config.userTeamId);
        const opp = leagueTeams.find(t => t.id === opponent.id);
        
        if (userTeam) {
            userTeam.p += 1; userTeam.gf += playerScoreVal; userTeam.ga += opponentScoreVal; userTeam.gd = userTeam.gf - userTeam.ga;
        }
        if (opp) {
            opp.p += 1; opp.gf += opponentScoreVal; opp.ga += playerScoreVal; opp.gd = opp.gf - opp.ga;
        }
        
        if (isWinner) {
            if (userTeam) { userTeam.w += 1; userTeam.pts += 3; }
            if (opp) { opp.l += 1; }
            if (typeof updateLeagueWinStreak === 'function') updateLeagueWinStreak(true, false);
        }
        else if (isDraw) {
            if (userTeam) { userTeam.d += 1; userTeam.pts += 1; }
            if (opp) { opp.d += 1; opp.pts += 1; }
            if (typeof updateLeagueWinStreak === 'function') updateLeagueWinStreak(false, true);
        }
        else {
            if (userTeam) { userTeam.l += 1; }
            if (opp) { opp.w += 1; opp.pts += 3; }
            if (typeof updateLeagueWinStreak === 'function') updateLeagueWinStreak(false, false);
        }

        simulateOtherMatches(fixture.opponent);
        leagueRound += 1;

        // 경기 완료 데이터 및 날짜 저장
        if (matchLastDate !== todayStr) {
            matchLastDate = todayStr;
            matchTodayCount = 1;
        } else {
            matchTodayCount += 1;
        }
        
        try {
            localStorage.setItem('fc_star_league_teams', JSON.stringify(leagueTeams));
            localStorage.setItem('fc_star_league_round', leagueRound.toString());
            localStorage.setItem('fc_star_match_last_date', matchLastDate);
            localStorage.setItem('fc_star_match_today_count', matchTodayCount.toString());
            localStorage.setItem('fc_star_user_points', userPoints.toString());
        } catch(e) {}

        renderUserPoints();
        renderLeagueTable();
        isMatchRunning = false;
        
        startBtn.disabled = false;
        startBtn.style.background = '';
        startBtn.style.color = '';
        startBtn.style.cursor = '';

        if (leagueRound > config.totalRounds) {
            checkSeasonChampion();
        } else {
            updateMatchPreviewBoard();
            showToast(`⚡ [개발자 모드] 결과 즉시 출력 완료!`);
        }
        
        saveUserProgress();
        return;
    }
    
    const matchTimer = setInterval(() => {
        const currentMin = matchMinutes[tickIdx];
        sbTimeDisplay.innerText = `${currentMin}'`;
        
        if (currentMin === 0) {
            addCommentary(0, getMatchEventCommentary('KICKOFF', commentaryData, false, false), 'normal');
        } else if (eventMins.includes(currentMin)) {
            // 특별 돌발 변수 체크
            const activePlayers = { ST: activeAttacker, LW: activeLw, RW: activeRw, CM: activeCm, GK: activeGk };
            const specialEvent = rollSpecialMatchEvent(activePlayers, opponent.name);
            
            if (specialEvent) {
                addCommentary(currentMin, specialEvent.eventDesc, 'system');
                if (specialEvent.type === "pk_player") {
                    const isGoal = specialEvent.isGoal;
                    if (isGoal) {
                        playerScoreVal++;
                        const goalData = determineScorerAndAssister(1); // PK는 보통 ST가 키커
                        processPlayerGoal(goalData);
                        playSound('reveal');
                        
                        if (isPlayerHome) {
                            document.getElementById('homeScore').innerText = playerScoreVal;
                        } else {
                            document.getElementById('awayScore').innerText = playerScoreVal;
                        }
                        
                        setTimeout(() => {
                            addCommentary(currentMin, specialEvent.eventGoal, 'goal');
                        }, 450);
                    } else {
                        setTimeout(() => {
                            addCommentary(currentMin, specialEvent.eventFail, 'normal');
                        }, 450);
                    }
                } else if (specialEvent.type === "pk_opponent") {
                    const isGoal = specialEvent.isGoal;
                    if (isGoal) {
                        opponentScoreVal++;
                        playSound('rumble');
                        
                        const oppGoalData = determineOpponentScorerAndAssister(opponent.id);
                        if (oppGoalData.scorerId) {
                            registerGoal(oppGoalData.scorerId, oppGoalData.scorerName, opponent.id, opponent.name);
                        }
                        if (oppGoalData.assisterId) {
                            registerAssist(oppGoalData.assisterId, oppGoalData.assisterName, opponent.id, opponent.name);
                        }
                        
                        if (isPlayerHome) {
                            document.getElementById('awayScore').innerText = opponentScoreVal;
                        } else {
                            document.getElementById('homeScore').innerText = opponentScoreVal;
                        }
                        
                        setTimeout(() => {
                            let pkCommentaryText = specialEvent.eventGoal;
                            if (oppGoalData.scorerName) {
                                pkCommentaryText = `⚽ <strong>[PK 실점]</strong> 상대 키커 <strong>${oppGoalData.scorerName}</strong>의 강력한 슛이 그대로 그물을 출렁입니다! 골키퍼가 방향을 읽지 못했습니다.`;
                            }
                            addCommentary(currentMin, pkCommentaryText, 'normal');
                        }, 450);
                    } else {
                        setTimeout(() => {
                            addCommentary(currentMin, specialEvent.eventFail, 'normal');
                        }, 450);
                    }
                } else if (specialEvent.type === "red_opponent") {
                    activeDiff += specialEvent.ovrChange; // +5
                    activePlayerAttackProb = Math.min(maxProb, Math.max(minProb, 0.40 + (activeDiff * 0.019) + formationAttackBoost + suitabilityBonus + detailedTacticBonus + compatibilityBonus - (isHardMode ? 0.05 : 0)));
                    setTimeout(() => {
                        addCommentary(currentMin, specialEvent.eventFail, 'normal');
                    }, 450);
                } else if (specialEvent.type === "red_player") {
                    activeDiff += specialEvent.ovrChange; // -5
                    activePlayerAttackProb = Math.min(maxProb, Math.max(minProb, 0.40 + (activeDiff * 0.019) + formationAttackBoost + suitabilityBonus + detailedTacticBonus + compatibilityBonus - (isHardMode ? 0.05 : 0)));
                    setTimeout(() => {
                        addCommentary(currentMin, specialEvent.eventFail, 'normal');
                    }, 450);
                }
            } else {
                // Simulated Attack Event
                const isPlayerAttack = Math.random() < activePlayerAttackProb;
                
                if (isPlayerAttack) {
                    // 공격 이벤트 유형 풀 구성 및 무작위 선택
                    let attackOptions = [0, 1, 2]; // 0: LW 돌파, 1: ST 돌파, 2: RW 돌파
                    if (currentFormation === '4-2-3-1') attackOptions.push(5); // 4-2-3-1 점유율 연출
                    
                    const selectedOption = attackOptions[Math.floor(Math.random() * attackOptions.length)];
                    let chancePlayerStat = 75;
                    
                    if (selectedOption === 0) {
                        const lwCardId = squadFormation['LW'];
                        if (lwCardId && CARDS_DATABASE[lwCardId]) {
                            const card = getAwakenedCard(lwCardId);
                            chancePlayerStat = getWingerChanceStat('LW', card);
                        }
                    } else if (selectedOption === 1) {
                        const stCardId = squadFormation['ST'];
                        if (stCardId && CARDS_DATABASE[stCardId]) {
                            const card = getAwakenedCard(stCardId);
                            chancePlayerStat = getStrikerChanceStat('ST', card, strikerStyles);
                        }
                    } else if (selectedOption === 2) {
                        const rwCardId = squadFormation['RW'];
                        if (rwCardId && CARDS_DATABASE[rwCardId]) {
                            const card = getAwakenedCard(rwCardId);
                            chancePlayerStat = getWingerChanceStat('RW', card);
                        }
                    } else if (selectedOption === 5) { // 4-2-3-1 점유율 연출 (CM 드리블 비례)
                        const cmCardId = squadFormation['CM'];
                        if (cmCardId && CARDS_DATABASE[cmCardId]) {
                            const card = getAwakenedCard(cmCardId);
                            chancePlayerStat = card.stats.dri || 75;
                        }
                    }
                    
                    const scoreProb = calculatePlayerScoreProb(activeDiff, chancePlayerStat, opponentOvr, formationScoreBoost, suitabilityBonus);
                    const isGoal = Math.random() < scoreProb;
                    const activePlayers = { ST: activeAttacker, LW: activeLw, RW: activeRw, CM: activeCm };
                    const isTacticActive = detailedTacticBonus > 0;
                    const { eventDesc, eventGoal, eventFail } = getDetailedTacticCommentary(selectedOption, currentFormation, isTacticActive, activePlayers, squadFormation, playerDeck, wingerStyles, strikerStyles);
                    
                    addCommentary(currentMin, eventDesc, 'attack');
                    
                    if (isGoal) {
                        playerScoreVal++;
                        const goalData = determineScorerAndAssister(selectedOption);
                        processPlayerGoal(goalData);
                        playSound('reveal');
                        
                        if (isPlayerHome) {
                            document.getElementById('homeScore').innerText = playerScoreVal;
                        } else {
                            document.getElementById('awayScore').innerText = playerScoreVal;
                        }
                        
                        setTimeout(() => {
                            addCommentary(currentMin, eventGoal, 'goal');
                        }, 450);
                    } else {
                        setTimeout(() => {
                            addCommentary(currentMin, eventFail, 'normal');
                        }, 450);
                    }
                } else {
                    let playerGkStat = 70;
                    const gkCardId = squadFormation['GK'];
                    if (gkCardId && CARDS_DATABASE[gkCardId]) {
                        const card = getAwakenedCard(gkCardId);
                        playerGkStat = card.stats.def || card.rating || 70;
                    }
                    
                    const oppScoreProb = calculateOpponentScoreProb(activeDiff, opponentOvr, playerGkStat);
                    const isGoal = Math.random() < oppScoreProb;
                    
                    addCommentary(currentMin, getMatchEventCommentary('OPP_ATTACK', commentaryData, false), 'attack');
                    
                    if (isGoal) {
                        opponentScoreVal++;
                        playSound('rumble');
                        
                        const oppGoalData = determineOpponentScorerAndAssister(opponent.id);
                        if (oppGoalData.scorerId) {
                            registerGoal(oppGoalData.scorerId, oppGoalData.scorerName, opponent.id, opponent.name);
                        }
                        if (oppGoalData.assisterId) {
                            registerAssist(oppGoalData.assisterId, oppGoalData.assisterName, opponent.id, opponent.name);
                        }
                        
                        if (isPlayerHome) {
                            document.getElementById('awayScore').innerText = opponentScoreVal;
                        } else {
                            document.getElementById('homeScore').innerText = opponentScoreVal;
                        }
                        
                        setTimeout(() => {
                            const goalCommentaryData = { ...commentaryData, opponentScorerName: oppGoalData.scorerName, opponentAssisterName: oppGoalData.assisterName };
                            addCommentary(currentMin, getMatchEventCommentary('OPP_GOAL', goalCommentaryData, false), 'normal');
                        }, 450);
                    } else {
                        setTimeout(() => {
                            const saveText = getMatchEventCommentary('GK_SAVE', commentaryData, false);
                            addCommentary(currentMin, saveText, 'normal');
                        }, 450);
                    }
                }
            }
        } else if (currentMin === 45) {
            commentaryData.playerScoreVal = playerScoreVal;
            commentaryData.opponentScoreVal = opponentScoreVal;
            addCommentary('HT', getMatchEventCommentary('HALFTIME', commentaryData, false, false), 'system');
        } else if (currentMin === 90) {
            // Full time whistle
            sbTimeDisplay.innerText = "종료";
            sbTimeDisplay.classList.remove('live-ticking');
            playSound('reveal');
            
            clearInterval(matchTimer);
            
            const isWinner = playerScoreVal > opponentScoreVal;
            const isDraw = playerScoreVal === opponentScoreVal;
            
            commentaryData.playerScoreVal = playerScoreVal;
            commentaryData.opponentScoreVal = opponentScoreVal;

            addCommentary('FT', getMatchEventCommentary('FULLTIME', commentaryData, false), 'system');
            
            if (isWinner) {
                addCommentary('FT', getMatchEventCommentary('RESULT', commentaryData, false), 'goal');
            } else if (isDraw) {
                addCommentary('FT', getMatchEventCommentary('RESULT', commentaryData, false), 'system');
            } else {
                addCommentary('FT', getMatchEventCommentary('RESULT', commentaryData, false), 'normal');
            }
            
            // 4. Update Standing Points
            const userTeam = leagueTeams.find(t => t.id === config.userTeamId);
            const opp = leagueTeams.find(t => t.id === opponent.id);
            
            userTeam.p += 1;
            userTeam.gf += playerScoreVal;
            userTeam.ga += opponentScoreVal;
            userTeam.gd = userTeam.gf - userTeam.ga;
            
            opp.p += 1;
            opp.gf += opponentScoreVal;
            opp.ga += playerScoreVal;
            opp.gd = opp.gf - opp.ga;
            
            if (isWinner) {
                userTeam.w += 1; userTeam.pts += 3;
                opp.l += 1;
                if (typeof updateLeagueWinStreak === 'function') updateLeagueWinStreak(true, false);
            } else if (isDraw) {
                userTeam.d += 1; userTeam.pts += 1;
                opp.d += 1; opp.pts += 1;
                if (typeof updateLeagueWinStreak === 'function') updateLeagueWinStreak(false, true);
            } else {
                userTeam.l += 1;
                opp.w += 1; opp.pts += 3;
                if (typeof updateLeagueWinStreak === 'function') updateLeagueWinStreak(false, false);
            }
            
            // 5. Simulate all other league fixtures for this round
            simulateOtherMatches(fixture.opponent);
            
            // Increase round
            leagueRound += 1;
            
            // 하루 제한용 일시 기록
            if (matchLastDate !== todayStr) {
                matchLastDate = todayStr;
                matchTodayCount = 1;
            } else {
                matchTodayCount += 1;
            }

            try {
                localStorage.setItem('fc_star_league_teams', JSON.stringify(leagueTeams));
                localStorage.setItem('fc_star_league_round', leagueRound.toString());
                localStorage.setItem('fc_star_match_last_date', matchLastDate);
                localStorage.setItem('fc_star_match_today_count', matchTodayCount.toString());
                localStorage.setItem('fc_star_user_points', userPoints.toString());
            } catch(e) {
                console.warn("Saving standing failed", e);
            }
            
            renderUserPoints();
            renderLeagueTable();
            isMatchRunning = false;
            
            // Unlock start button
            if (startBtn) {
                startBtn.disabled = false;
                startBtn.style.background = '';
                startBtn.style.color = '';
                startBtn.style.cursor = '';
            }
            
            // Check season completion celebrating
            if (leagueRound > config.totalRounds) {
                setTimeout(() => {
                    checkSeasonChampion();
                }, 1000);
            } else {
                // Update match preview for next round
                setTimeout(() => {
                    updateMatchPreviewBoard();
                    showToast(`🏆 경기 완료! (하루 최대 10경기 제한)`);
                }, 2000);
            }
            
            // Auto-save progress
            saveUserProgress();
        }
        
        tickIdx++;
    }, 1500); // Ticks run roughly every 1.5s to hit the ~15s duration constraint perfectly
}

function simulateOtherMatches(opponentId) {
    const config = getActiveLeagueConfig();
    const roundFixtures = [];
    const availableTeams = leagueTeams.filter(t => t.id !== config.userTeamId && t.id !== opponentId);
    
    // Shuffle available teams to pair them randomly for simulation
    const shuffled = [...availableTeams].sort(() => 0.5 - Math.random());
    
    for (let i = 0; i < shuffled.length; i += 2) {
        if (i + 1 < shuffled.length) {
            roundFixtures.push({ home: shuffled[i], away: shuffled[i+1] });
        }
    }
    
    roundFixtures.forEach(fix => {
        const home = leagueTeams.find(t => t.id === fix.home.id);
        const away = leagueTeams.find(t => t.id === fix.away.id);
        
        // Home advantage (+3 OVR)
        const homeRating = home.rating + 3;
        const awayRating = away.rating;
        const diff = homeRating - awayRating;
        
        // Calibrate expectations using diff
        const expHome = Math.max(0.3, 1.4 + (diff * 0.05));
        const expAway = Math.max(0.3, 1.4 - (diff * 0.05));
        
        // Luck factor: add poisson/random noise goals
        const homeGoals = Math.max(0, Math.round(expHome + (Math.random() * 2.5 - 1.25)));
        const awayGoals = Math.max(0, Math.round(expAway + (Math.random() * 2.5 - 1.25)));
        
        home.p += 1;
        home.gf += homeGoals;
        home.ga += awayGoals;
        home.gd = home.gf - home.ga;
        
        away.p += 1;
        away.gf += awayGoals;
        away.ga += homeGoals;
        away.gd = away.gf - away.ga;
        
        if (homeGoals > awayGoals) {
            home.w += 1; home.pts += 3;
            away.l += 1;
        } else if (homeGoals === awayGoals) {
            home.d += 1; home.pts += 1;
            away.d += 1; away.pts += 1;
        } else {
            home.l += 1;
            away.w += 1; away.pts += 3;
        }
    });
    
    simulateOtherPlayersStats();
}

function getTopScorerAndAssister() {
    const playersArray = Object.values(leaguePlayerStats || {});
    if (playersArray.length === 0) return { topScorer: null, topAssister: null };
    
    const sortedGoals = [...playersArray].sort((a, b) => {
        if (b.goals !== a.goals) return b.goals - a.goals;
        return b.assists - a.assists;
    });
    
    const sortedAssists = [...playersArray].sort((a, b) => {
        if (b.assists !== a.assists) return b.assists - a.assists;
        return b.goals - a.goals;
    });
    
    const topScorer = sortedGoals[0] && sortedGoals[0].goals > 0 ? sortedGoals[0] : null;
    const topAssister = sortedAssists[0] && sortedAssists[0].assists > 0 ? sortedAssists[0] : null;
    
    return { topScorer, topAssister };
}

function checkSeasonChampion() {
    const config = getActiveLeagueConfig();
    const sorted = [...leagueTeams].sort((a, b) => {
        if (b.pts !== a.pts) return b.pts - a.pts;
        if (b.gd !== a.gd) return b.gd - a.gd;
        return b.gf - a.gf;
    });
    
    const champion = sorted[0] || { name: config.userTeamName, pts: 0 };
    const userTeam = sorted.find(t => t.id === config.userTeamId) || sorted[0];
    const userTeamRank = sorted.findIndex(t => t.id === config.userTeamId) + 1;
    const isUserTeamChamp = (champion.id === config.userTeamId);
    
    // Stop starts previews
    const venueDisplay = document.getElementById('matchVenueDisplay');
    if (venueDisplay) {
        venueDisplay.innerText = `${leagueYear} ${config.seasonPrefix} 종료! 명예의 전당 등록 및 다음 시즌을 준비하세요.`;
    }
    const timeDisplay = document.getElementById('sbTimeDisplay');
    if (timeDisplay) timeDisplay.innerText = "끝";
    
    // 1. 명예의 전당에 완주 기록 등록
    recordSeasonProgressToFame(false);
    
    // 1-B. 리그 우승 보상 (+10 FP) 연동 및 헌정 배너 생성
    let captainAwakenedMsg = "";
    if (isUserTeamChamp) {
        if (typeof userPoints !== 'undefined') {
            userPoints += 10;
        } else {
            userPoints = 10;
        }
        
        // 연속 리그 우승 기록 갱신 및 업적 조건 판정
        consecutiveLeagueTitles++;
        try {
            localStorage.setItem('fc_star_consecutive_titles', consecutiveLeagueTitles.toString());
        } catch (e) {}

        if (typeof checkLeagueEndAchievements === 'function') {
            checkLeagueEndAchievements(true, userTeam.l);
        }

        captainAwakenedMsg = `
            <div class="captain-awakening-reward" style="margin-top: 1rem; padding: 0.8rem; background: rgba(255, 215, 0, 0.15); border: 1.5px solid rgba(255, 215, 0, 0.35); border-radius: 12px; font-size: 0.82rem; color: #ffd700; font-weight: bold; line-height: 1.45; text-align: left; box-shadow: 0 0 10px rgba(255, 215, 0, 0.25);">
                 <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
                    <i class="fa-solid fa-trophy" style="color: #ffd700; animation: keyPlayerLabelPulse 1s infinite alternate;"></i>
                    <span style="font-size: 0.88rem; font-weight: 900;">리그 우승 보상: +10 FP 지급!</span>
                </div>
                ${config.userTeamName}의 위대한 우승을 축하드립니다!<br>
                리그 우승 기념 보상으로 <strong>10 드림 포인트(FP)</strong>가 성공적으로 지급되었습니다.
            </div>
        `;
        try {
            localStorage.setItem('fc_star_user_points', userPoints.toString());
        } catch(e) {}
        renderUserPoints();
    } else {
        // 우승 실패 시 연속 우승 카운터 리셋
        consecutiveLeagueTitles = 0;
        try {
            localStorage.setItem('fc_star_consecutive_titles', '0');
        } catch (e) {}
    }
    
    // 2. 최종 결과 모달 활성화 및 커스터마이징
    const modal = document.getElementById('revealModal');
    if (!modal) return;
    modal.classList.add('active');
    
    const card3d = document.getElementById('card3dWrapper');
    if (card3d) card3d.style.display = 'none'; // Hide player card
    
    const btnCollect = document.getElementById('btnCollect');
    if (btnCollect) btnCollect.style.display = 'none'; // 영입 버튼 숨기기
    
    const stage = document.querySelector('.reveal-stage');
    if (!stage) return;
    
    // 기존 축하 팝업이 남아있다면 제거
    const oldCeleb = document.getElementById('squadChampCelebration');
    if (oldCeleb) oldCeleb.remove();
    
    const trophyContainer = document.createElement('div');
    trophyContainer.id = "squadChampCelebration";
    trophyContainer.className = "empty-deck";
    trophyContainer.style.background = 'radial-gradient(circle, rgba(255,215,0,0.15) 0%, rgba(10,14,26,0.95) 70%)';
    trophyContainer.style.border = '2px solid #ffd700';
    trophyContainer.style.padding = '2.5rem 2rem';
    trophyContainer.style.borderRadius = '20px';
    trophyContainer.style.maxWidth = '420px';
    trophyContainer.style.textAlign = 'center';
    trophyContainer.style.animation = 'goalPop 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
    
    // K리그 트레블 검사 (코리아컵 + 아챔)
    let isTreble = false;
    if (config.id === 'kleague1' && isUserTeamChamp) {
        let cupWon = false, aclWon = false;
        try {
            const savedCup = localStorage.getItem('fc_star_cup_state');
            if (savedCup && JSON.parse(savedCup).bracket?.winner?.id === 'jeonbuk') cupWon = true;
            const savedAcl = localStorage.getItem('fc_star_acl_state');
            if (savedAcl && JSON.parse(savedAcl).bracket?.winner?.id === 'jeonbuk') aclWon = true;
            isTreble = cupWon && aclWon;
        } catch(e) {}
    }
    
    if (isTreble) {
        userPoints += 10;
        try {
            localStorage.setItem('fc_star_user_points', userPoints.toString());
        } catch(e) {}
        renderUserPoints();
        
        showToast("🏆 역사적인 트레블(3관왕) 달성! 보너스 10 FP 지급!");
        
        trophyContainer.style.background = 'radial-gradient(circle, rgba(0,255,135,0.25) 0%, rgba(10,14,26,0.98) 80%)';
        trophyContainer.style.border = '2.5px solid #ffd700';
        trophyContainer.style.boxShadow = '0 0 35px rgba(255, 215, 0, 0.4), 0 0 20px rgba(0, 255, 135, 0.3)';
        
        trophyContainer.innerHTML = `
            <div style="display: flex; justify-content: center; gap: 1rem; margin-bottom: 1.5rem;">
                <i class="fa-solid fa-crown" style="font-size: 3.5rem; color:#ffd700; filter:drop-shadow(0 0 15px rgba(255,215,0,0.6)); animation: float 3s ease-in-out infinite;"></i>
                <i class="fa-solid fa-trophy" style="font-size: 3.5rem; color:#00d2fc; filter:drop-shadow(0 0 15px rgba(0,210,252,0.6)); animation: float 3s ease-in-out infinite 0.5s;"></i>
                <i class="fa-solid fa-earth-asia" style="font-size: 3.5rem; color:#00ff87; filter:drop-shadow(0 0 15px rgba(0,255,135,0.6)); animation: float 3s ease-in-out infinite 1s;"></i>
            </div>
            <h2 style="font-size:1.80rem; font-weight:900; background: linear-gradient(135deg, #ffd700 0%, #00ff87 100%); -webkit-background-clip:text; -webkit-text-fill-color:transparent; margin-bottom:0.8rem; text-shadow: 0 0 10px rgba(0,255,135,0.25);">👑 역사적인 트레블 달성! 👑</h2>
            <p style="color:var(--text-light); font-size:1.05rem; line-height:1.6; margin-bottom:1rem;">
                축하합니다! ${config.userTeamName}가 ${leagueYear} 시즌 **K리그1 + 코리아컵 + AFC 챔피언스리그**를 모두 제패하며 위대한 **트레블(3관왕)**을 완성했습니다!<br>
                축구 역사에 영원히 기억될 대기록의 주인공이 되었습니다.<br>
                <strong style="color: #ffd700; font-size: 1.05rem;">🎁 트레블 달성 보상: +10 FP</strong>
            </p>
            ${captainAwakenedMsg}
            <button class="btn-open-pack" onclick="closeChampModal()" style="margin-top:1.5rem;">다음 시즌 시작하기</button>
        `;
    } else if (isUserTeamChamp) {
        trophyContainer.innerHTML = `
            <i class="fa-solid fa-trophy" style="font-size: 5rem; color:#ffd700; filter:drop-shadow(0 0 25px rgba(255,215,0,0.6)); margin-bottom:1.5rem; animation: float 3s ease-in-out infinite;"></i>
            <h2 style="font-size:1.8rem; font-weight:900; background:var(--gold-gradient); -webkit-background-clip:text; -webkit-text-fill-color:transparent; margin-bottom:0.8rem;">🎉 ${config.seasonPrefix} 우승 달성! 🎉</h2>
            <p style="color:var(--text-light); font-size:1.05rem; line-height:1.6; margin-bottom:1rem;">
                축하합니다! ${config.userTeamName}가 ${leagueYear} 시즌 ${config.name} 우승을 차지하여 역사적인 트로피를 들어올렸습니다!<br>
                당신이 지휘한 스쿼드가 리그 정상의 주역으로 우뚝 섰습니다.
            </p>
            ${captainAwakenedMsg}
            <button class="btn-open-pack" onclick="closeChampModal()" style="margin-top:1.5rem;">다음 시즌 시작하기</button>
        `;
    } else {
        trophyContainer.innerHTML = `
            <i class="fa-solid fa-ranking-star" style="font-size: 5rem; color:#b5c2d9; filter:drop-shadow(0 0 20px rgba(255,255,255,0.2)); margin-bottom:1.5rem; animation: float 3s ease-in-out infinite;"></i>
            <h2 style="font-size:1.8rem; font-weight:900; color:#cbd5e1; margin-bottom:0.8rem;">⚽ ${leagueYear} ${config.seasonPrefix} 종료 ⚽</h2>
            <p style="color:var(--text-light); font-size:1.05rem; line-height:1.6; margin-bottom:1.8rem;">
                ${config.userTeamName}가 최종 **${userTeamRank}위**로 시즌을 마쳤습니다.<br>
                시즌 우승팀: **${champion.name}** (승점 ${champion.pts}점)<br>
                아쉽지만 스쿼드를 더 강력하게 정비하여 다음 연도 시즌의 정상에 재도전하세요!
            </p>
            <button class="btn-open-pack" onclick="closeChampModal()" style="margin-top:0;">다음 시즌 시작하기</button>
        `;
    }
    
    stage.appendChild(trophyContainer);
    
    // Trigger sparks
    let celebrationTimerCount = 0;
    const celebrationTimer = setInterval(() => {
        if (!modal.classList.contains('active')) {
            clearInterval(celebrationTimer);
            return;
        }
        createSparkParticles(true, isUserTeamChamp ? '#ffd700' : '#00ff87');
        celebrationTimerCount++;
        if (celebrationTimerCount > 8) clearInterval(celebrationTimer);
    }, 1200);
    
    // Auto-save user data to cloud after season ending
    saveUserProgress();
}

function closeChampModal() {
    const modal = document.getElementById('revealModal');
    if (modal) modal.classList.remove('active');
    
    // Restore elements
    const card3d = document.getElementById('card3dWrapper');
    if (card3d) card3d.style.display = 'block';
    
    const celeb = document.getElementById('squadChampCelebration');
    if (celeb) celeb.remove();
    
    // 다음 연도 시즌 시작 처리
    startNextSeason();
}

function startNextSeason() {
    const config = getActiveLeagueConfig();
    
    // 1. 리그 연도 증가
    leagueYear += 1;
    localStorage.setItem('fc_star_league_year', leagueYear.toString());
    
    // 2. 현재 리그 순위표 초기화 및 라운드 1로 리셋 (기존 스쿼드 및 카드/포인트 보존)
    resetLeagueSeasonState();
    
    // 코리아컵 및 아챔 새 시즌 리셋 연동
    if (typeof resetCupStateData === 'function') {
        resetCupStateData();
    }
    if (typeof initCupTab === 'function') {
        initCupTab();
    }

    if (typeof resetAclStateData === 'function') {
        resetAclStateData();
    }
    if (typeof initAclTab === 'function') {
        initAclTab();
    }
    
    // 3. 순위표 렌더링 및 프리뷰 정보 새로고침
    syncPlayerTeamOvr();
    renderLeagueTable();
    updateMatchPreviewBoard();
    renderLeagueStats();
    
    // Commentary clear
    const commBox = document.getElementById('commentaryScroll');
    if (commBox) {
        commBox.innerHTML = `<div class="comm-item comm-system">새로운 ${leagueYear} ${config.seasonPrefix}이 시작되었습니다! 첫 경기를 진행해 보세요.</div>`;
    }
    
    showToast(`🚀 새로운 ${leagueYear} ${config.seasonPrefix}의 막이 올랐습니다!`);
    
    // 4. 세이브 동기화
    saveUserProgress();
}

function switchFameLeagueTab(leagueId) {
    if (!LEAGUE_CONFIGS[leagueId]) return;
    currentFameLeagueTab = leagueId;
    
    // Update active style on league sub-tab buttons
    const tabs = document.querySelectorAll('.fame-league-tab-btn');
    tabs.forEach(tab => {
        if (tab.dataset.league === leagueId) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });
    
    renderHallOfFame();
}

function renderHallOfFame() {
    if (typeof switchFameSubTab === 'function') {
        switchFameSubTab(isHardMode ? 'hard' : 'normal');
    } else {
        renderHallOfFameSub(isHardMode ? 'hard' : 'normal');
    }
}

function renderHallOfFameSub(subTabId) {
    const isHard = (subTabId === 'hard');
    const suffix = isHard ? 'Hard' : 'Normal';
    
    const gridEl = document.getElementById('fameGrid' + suffix);
    const placeholderEl = document.getElementById('emptyFamePlaceholder' + suffix);
    const countEl = document.getElementById('fameSeasonCount' + suffix);
    const headerEl = document.getElementById('fameClubHeader' + suffix);
    
    if (!gridEl) return;
    
    // 1. 현재 선택된 리그 탭(currentFameLeagueTab) 및 난이도에 따라 필터링
    const targetLeagueId = currentFameLeagueTab || 'kleague1';
    const targetConfig = LEAGUE_CONFIGS[targetLeagueId] || LEAGUE_CONFIGS['kleague1'];
    
    const filteredFame = hallOfFame.filter(record => {
        const matchesLeague = (record.leagueId === targetLeagueId) || (!record.leagueId && targetLeagueId === 'kleague1');
        const matchesHard = isHard ? (record.isHardMode === true) : !record.isHardMode;
        return matchesLeague && matchesHard;
    });
    
    // Update count display
    if (countEl) countEl.innerText = filteredFame.length;
    
    // Clear dynamic cards
    const existingCards = gridEl.querySelectorAll('.fame-card');
    existingCards.forEach(c => c.remove());
    
    if (filteredFame.length === 0) {
        if (placeholderEl) {
            placeholderEl.style.display = 'flex';
            placeholderEl.querySelector('p') && (placeholderEl.querySelector('p').innerText = `아직 ${targetConfig.name} 명예의 전당에 등록된 시즌 기록이 없습니다.`);
        }
        if (headerEl) headerEl.style.display = 'none';
        renderCareerStatsSub(subTabId);
        return;
    }
    
    if (placeholderEl) placeholderEl.style.display = 'none';

    // Calculate championships
    let leagueTitles = 0;
    let cupTitles = 0;
    let aclTitles = 0;

    filteredFame.forEach(record => {
        const rank = record.userTeamRank || record.jeonbukRank;
        if (rank === 1 && !record.resigned) {
            leagueTitles++;
        }
        if (record.cupRecord && record.cupRecord.includes("우승")) {
            cupTitles++;
        }
        if (record.aclRecord && record.aclRecord.includes("우승")) {
            aclTitles++;
        }
    });

    // Render Club Header
    if (headerEl) {
        headerEl.style.display = 'flex';
        headerEl.style.flexWrap = 'wrap';
        
        let trophyShelfHtml = '';
        if (targetLeagueId === 'epl') {
            trophyShelfHtml = `
                <!-- EPL Trophy -->
                <div class="trophy-badge-container" style="display: flex; align-items: center; gap: 0.6rem; background: rgba(255, 255, 255, 0.03); border: 1.5px solid ${leagueTitles > 0 ? (isHard ? 'rgba(255, 62, 108, 0.4)' : 'rgba(255, 215, 0, 0.3)') : 'rgba(255, 255, 255, 0.05)'}; padding: 0.5rem 0.8rem; border-radius: 14px; min-width: 130px; transition: all 0.3s; ${leagueTitles > 0 ? (isHard ? 'box-shadow: 0 0 15px rgba(255, 62, 108, 0.2);' : 'box-shadow: 0 0 15px rgba(255, 215, 0, 0.1);') : ''}">
                    <i class="fa-solid fa-crown" style="font-size: 1.6rem; color: ${leagueTitles > 0 ? (isHard ? '#ff3e6c' : '#ffd700') : '#4b5563'}; filter: ${leagueTitles > 0 ? (isHard ? 'drop-shadow(0 0 6px rgba(255, 62, 108, 0.6))' : 'drop-shadow(0 0 6px rgba(255, 215, 0, 0.6))') : 'none'};"></i>
                    <div>
                        <div style="font-size: 0.7rem; color: var(--text-muted); font-weight: 700;">프리미어리그</div>
                        <div style="font-size: 0.9rem; font-weight: 800; color: ${leagueTitles > 0 ? '#fff' : '#6b7280'};">${leagueTitles}회 우승</div>
                    </div>
                </div>
                <!-- Carabao Cup Trophy -->
                <div class="trophy-badge-container" style="display: flex; align-items: center; gap: 0.6rem; background: rgba(255, 255, 255, 0.03); border: 1.5px solid ${cupTitles > 0 ? 'rgba(0, 210, 252, 0.3)' : 'rgba(255, 255, 255, 0.05)'}; padding: 0.5rem 0.8rem; border-radius: 14px; min-width: 130px; transition: all 0.3s; ${cupTitles > 0 ? 'box-shadow: 0 0 15px rgba(0, 210, 252, 0.1);' : ''}">
                    <i class="fa-solid fa-trophy" style="font-size: 1.6rem; color: ${cupTitles > 0 ? '#00d2fc' : '#4b5563'}; filter: ${cupTitles > 0 ? 'drop-shadow(0 0 6px rgba(0, 210, 252, 0.6))' : 'none'};"></i>
                    <div>
                        <div style="font-size: 0.7rem; color: var(--text-muted); font-weight: 700;">카라바오컵</div>
                        <div style="font-size: 0.9rem; font-weight: 800; color: ${cupTitles > 0 ? '#fff' : '#6b7280'};">${cupTitles}회 우승</div>
                    </div>
                </div>
            `;
        } else {
            trophyShelfHtml = `
                <!-- K-League Trophy -->
                <div class="trophy-badge-container" style="display: flex; align-items: center; gap: 0.6rem; background: rgba(255, 255, 255, 0.03); border: 1.5px solid ${leagueTitles > 0 ? (isHard ? 'rgba(255, 62, 108, 0.4)' : 'rgba(255, 215, 0, 0.3)') : 'rgba(255, 255, 255, 0.05)'}; padding: 0.5rem 0.8rem; border-radius: 14px; min-width: 110px; transition: all 0.3s; ${leagueTitles > 0 ? (isHard ? 'box-shadow: 0 0 15px rgba(255, 62, 108, 0.2);' : 'box-shadow: 0 0 15px rgba(255, 215, 0, 0.1);') : ''}">
                    <i class="fa-solid fa-crown" style="font-size: 1.6rem; color: ${leagueTitles > 0 ? (isHard ? '#ff3e6c' : '#ffd700') : '#4b5563'}; filter: ${leagueTitles > 0 ? (isHard ? 'drop-shadow(0 0 6px rgba(255, 62, 108, 0.6))' : 'drop-shadow(0 0 6px rgba(255, 215, 0, 0.6))') : 'none'};"></i>
                    <div>
                        <div style="font-size: 0.7rem; color: var(--text-muted); font-weight: 700;">K리그1</div>
                        <div style="font-size: 0.9rem; font-weight: 800; color: ${leagueTitles > 0 ? '#fff' : '#6b7280'};">${leagueTitles}회 우승</div>
                    </div>
                </div>
                <!-- Korea Cup Trophy -->
                <div class="trophy-badge-container" style="display: flex; align-items: center; gap: 0.6rem; background: rgba(255, 255, 255, 0.03); border: 1.5px solid ${cupTitles > 0 ? 'rgba(0, 210, 252, 0.3)' : 'rgba(255, 255, 255, 0.05)'}; padding: 0.5rem 0.8rem; border-radius: 14px; min-width: 110px; transition: all 0.3s; ${cupTitles > 0 ? 'box-shadow: 0 0 15px rgba(0, 210, 252, 0.1);' : ''}">
                    <i class="fa-solid fa-trophy" style="font-size: 1.6rem; color: ${cupTitles > 0 ? '#00d2fc' : '#4b5563'}; filter: ${cupTitles > 0 ? 'drop-shadow(0 0 6px rgba(0, 210, 252, 0.6))' : 'none'};"></i>
                    <div>
                        <div style="font-size: 0.7rem; color: var(--text-muted); font-weight: 700;">코리아컵</div>
                        <div style="font-size: 0.9rem; font-weight: 800; color: ${cupTitles > 0 ? '#fff' : '#6b7280'};">${cupTitles}회 우승</div>
                    </div>
                </div>
                <!-- ACL Trophy -->
                <div class="trophy-badge-container" style="display: flex; align-items: center; gap: 0.6rem; background: rgba(255, 255, 255, 0.03); border: 1.5px solid ${aclTitles > 0 ? 'rgba(0, 255, 135, 0.3)' : 'rgba(255, 255, 255, 0.05)'}; padding: 0.5rem 0.8rem; border-radius: 14px; min-width: 110px; transition: all 0.3s; ${aclTitles > 0 ? 'box-shadow: 0 0 15px rgba(0, 255, 135, 0.1);' : ''}">
                    <i class="fa-solid fa-earth-asia" style="font-size: 1.6rem; color: ${aclTitles > 0 ? '#00ff87' : '#4b5563'}; filter: ${aclTitles > 0 ? 'drop-shadow(0 0 6px rgba(0, 255, 135, 0.6))' : 'none'};"></i>
                    <div>
                        <div style="font-size: 0.7rem; color: var(--text-muted); font-weight: 700;">아챔 (ACL)</div>
                        <div style="font-size: 0.9rem; font-weight: 800; color: ${aclTitles > 0 ? '#fff' : '#6b7280'};">${aclTitles}회 우승</div>
                    </div>
                </div>
            `;
        }
        
        headerEl.innerHTML = `
            <div class="fame-club-info" style="display: flex; align-items: center; gap: 1rem; flex: 1; min-width: 200px;">
                <img src="${getTeamEmblemPath(targetConfig.userTeamId)}" class="logo-emblem" alt="${targetConfig.userTeamName}" style="height: 60px; width: 60px; object-fit: contain; filter: drop-shadow(0 0 8px rgba(0, 255, 135, 0.6)); animation: emblemPulse 3s ease-in-out infinite alternate;">
                <div>
                    <h3 style="font-size: 1.25rem; font-weight: 800; color: #fff; margin-bottom: 2px;">${targetConfig.userTeamName} ${isHard ? '<span style="color:#ff3e6c;">[어려움]</span>' : ''}</h3>
                    <p style="font-size: 0.8rem; color: var(--text-muted); font-weight: 600;">${targetConfig.name} 명예의 전당 트로피 룸</p>
                </div>
            </div>
            <div class="fame-trophy-shelf" style="display: flex; gap: 1rem; align-items: center; flex-wrap: wrap; margin-left: auto;">
                ${trophyShelfHtml}
            </div>
        `;
    }
    
    filteredFame.forEach(record => {
        const card = document.createElement('div');
        card.className = 'fame-card';
        
        const rank = record.userTeamRank || record.jeonbukRank;
        const stats = record.userTeamStats || record.jeonbukRecord || { w: 0, d: 0, l: 0, pts: 0 };
        const totalRounds = record.totalRounds || 33;
        const leagueName = record.leagueName || 'K리그1';
        const isRecordEpl = (record.leagueId === 'epl');
        const cupName = isRecordEpl ? '카라바오컵' : '코리아컵';
        
        let badgeClass = 'other-medal';
        let badgeIcon = '<i class="fa-solid fa-award"></i>';
        
        if (record.resigned) {
            badgeClass = 'other-medal';
            badgeIcon = '<i class="fa-solid fa-person-walking-arrow-right" style="color: #f59e0b;"></i>';
        } else if (rank === 1) {
            badgeClass = 'gold-crown';
            badgeIcon = '<i class="fa-solid fa-crown"></i>';
        } else if (rank === 2) {
            badgeClass = 'silver-medal';
            badgeIcon = '<i class="fa-solid fa-medal"></i>';
        } else if (rank === 3) {
            badgeClass = 'bronze-medal';
            badgeIcon = '<i class="fa-solid fa-medal"></i>';
        } else {
            badgeClass = 'other-medal';
            badgeIcon = '<i class="fa-solid fa-shield-halved"></i>';
        }
        
        let awardHtml = '';
        if (record.topScorer || record.topAssister) {
            awardHtml += `<div class="fame-card-awards" style="margin-top: 0.6rem; padding-top: 0.5rem; border-top: 1px dashed rgba(255, 255, 255, 0.1); font-size: 0.76rem; display: flex; flex-direction: column; gap: 4px; line-height: 1.4;">`;
            if (record.topScorer) {
                awardHtml += `<div style="color: #ffd700;"><i class="fa-solid fa-soccer-ball" style="margin-right: 4px;"></i> 리그 득점왕: <strong>${record.topScorer.name}</strong> (${record.topScorer.goals}골)</div>`;
            }
            if (record.topAssister) {
                awardHtml += `<div style="color: #00ff87;"><i class="fa-solid fa-star" style="margin-right: 4px;"></i> 리그 도움왕: <strong>${record.topAssister.name}</strong> (${record.topAssister.assists}도움)</div>`;
            }
            awardHtml += `</div>`;
        }
        
        let roundStatusHtml = '';
        if (record.resigned) {
            roundStatusHtml = `
                <div class="fame-card-rank" style="color: #f59e0b;"><i class="fa-solid fa-person-running"></i> [중도 사퇴] ${record.playedRound}R 진행 중 (당시 ${rank}위)</div>
                <div class="fame-card-stats">
                    <span>진행 승점: <strong>${stats.pts} 점</strong></span>
                    <span>진행 전적: <strong>${stats.w}승 ${stats.d}무 ${stats.l}패</strong></span>
                    <span style="color: #94a3b8; font-size: 0.75rem;">※ 타 리그 감독 부임으로 시즌을 중도 마감했습니다.</span>
                </div>
            `;
        } else {
            roundStatusHtml = `
                <div class="fame-card-rank">최종 순위: ${rank}위</div>
                <div class="fame-card-stats">
                    <span>최종 승점: <strong>${stats.pts} 점</strong></span>
                    <span>시즌 전적: <strong>${totalRounds}전 ${stats.w}승 ${stats.d}무 ${stats.l}패</strong></span>
                    <span>시즌 우승팀: <strong>${record.champion}</strong></span>
                    ${record.cupRecord ? `<span>${cupName} 성적: <strong style="color: #00d2fc;">${record.cupRecord}</strong></span>` : ''}
                    ${record.aclRecord ? `<span>아챔 성적: <strong style="color: #00ff87;">${record.aclRecord}</strong></span>` : ''}
                </div>
            `;
        }
        
        card.innerHTML = `
            <div class="fame-card-badge ${badgeClass}">
                ${badgeIcon}
            </div>
            <div class="fame-card-content">
                <h4 class="fame-card-title">${record.year}년 시즌 ${leagueName} ${record.resigned ? '<span style="font-size:0.75rem; color:#f59e0b; font-weight:bold;">[중도 사퇴]</span>' : ''}</h4>
                ${roundStatusHtml}
                ${awardHtml}
            </div>
        `;
        
        gridEl.appendChild(card);
    });
    
    renderCareerStatsSub(subTabId);
}

function renderCareerStats() {
    renderCareerStatsSub(isHardMode ? 'hard' : 'normal');
}

function renderCareerStatsSub(subTabId) {
    const isHard = (subTabId === 'hard');
    const suffix = isHard ? 'Hard' : 'Normal';
    const dashboardEl = document.getElementById('careerStatsDashboard' + suffix);
    if (!dashboardEl) return;
    
    const activeCareer = isHard ? careerStatsHard : careerStats;
    const filteredFame = hallOfFame.filter(record => {
        if (isHard) return record.isHardMode === true;
        return !record.isHardMode;
    });
    
    if (filteredFame.length === 0) {
        dashboardEl.style.display = 'none';
        return;
    }
    
    dashboardEl.style.display = 'block';
    
    const gd = activeCareer.gf - activeCareer.ga;
    const gdSign = gd > 0 ? `+${gd}` : gd;
    
    const topScorers = Object.values(activeCareer.playerGoals || {})
        .filter(p => p.goals > 0)
        .sort((a, b) => b.goals - a.goals)
        .slice(0, 3);
        
    let scorersHtml = '';
    if (topScorers.length === 0) {
        scorersHtml = `<div style="text-align: center; color: #64748b; padding: 10px; font-size: 0.8rem;">득점 기록 없음</div>`;
    } else {
        scorersHtml = topScorers.map((p, idx) => {
            let medalColor = '#ffd700'; // 1st
            if (idx === 1) medalColor = '#c0c0c0'; // 2nd
            if (idx === 2) medalColor = '#cd7f32'; // 3rd
            return `
                <div style="display: flex; align-items: center; justify-content: space-between; font-size: 0.82rem; padding: 6px 10px; background: rgba(255,255,255,0.03); border-radius: 8px; border: 1px solid rgba(255,255,255,0.02);">
                    <span style="display: flex; align-items: center; gap: 6px;">
                        <i class="fa-solid fa-medal" style="color: ${medalColor};"></i>
                        <strong>${p.name}</strong>
                    </span>
                    <span style="color: #ffd700; font-weight: 800;">${p.goals}골</span>
                </div>
            `;
        }).join('');
    }
    
    dashboardEl.innerHTML = `
        <div style="background: linear-gradient(135deg, rgba(8, 10, 16, 0.6) 0%, rgba(15, 19, 34, 0.6) 100%); border: 1.5px solid ${isHard ? 'rgba(255, 62, 108, 0.45)' : 'rgba(255, 215, 0, 0.35)'}; border-radius: 20px; padding: 1.2rem; margin-bottom: 1.5rem; box-shadow: var(--card-shadow); backdrop-filter: blur(10px);">
            <h3 style="font-size: 1.1rem; font-weight: 900; background: ${isHard ? 'linear-gradient(135deg, #ff3e6c, #ff6b6b)' : 'var(--gold-gradient)'}; -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 1rem; display: flex; align-items: center; gap: 8px;">
                <i class="fa-solid fa-chart-line" style="color: ${isHard ? '#ff3e6c' : '#ffd700'};"></i> 클럽 통산 누적 성적 ${isHard ? '<span style="color:#ff3e6c; font-size:0.8rem;">[어려움]</span>' : ''} (All-Time Career Stats)
            </h3>
            
            <div style="display: flex; gap: 1.2rem; flex-wrap: wrap;">
                <!-- Left Column: Match & Goal Stats -->
                <div style="flex: 1.3; min-width: 250px; display: grid; grid-template-columns: repeat(auto-fit, minmax(110px, 1fr)); gap: 0.6rem;">
                    <div style="background: rgba(255,255,255,0.03); padding: 0.6rem; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05); text-align: center; display: flex; flex-direction: column; justify-content: center;">
                        <div style="font-size: 0.72rem; color: #94a3b8; margin-bottom: 0.2rem;">통산 경기</div>
                        <div style="font-size: 1.3rem; font-weight: 900; color: #fff;">${activeCareer.w + activeCareer.d + activeCareer.l}전</div>
                    </div>
                    <div style="background: ${isHard ? 'rgba(255, 62, 108, 0.05)' : 'rgba(0, 255, 135, 0.04)'}; padding: 0.6rem; border-radius: 12px; border: 1.5px solid ${isHard ? 'rgba(255, 62, 108, 0.25)' : 'rgba(0, 255, 135, 0.12)'}; text-align: center; display: flex; flex-direction: column; justify-content: center;">
                        <div style="font-size: 0.72rem; color: ${isHard ? '#ff3e6c' : '#00ff87'}; margin-bottom: 0.2rem;">통산 전적</div>
                        <div style="font-size: 1.05rem; font-weight: 800; color: #fff; margin-top: 0.1rem;">${activeCareer.w}승 ${activeCareer.d}무 ${activeCareer.l}패</div>
                    </div>
                    <div style="background: rgba(255,255,255,0.03); padding: 0.6rem; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05); text-align: center; display: flex; flex-direction: column; justify-content: center;">
                        <div style="font-size: 0.72rem; color: #94a3b8; margin-bottom: 0.2rem;">통산 득/실점</div>
                        <div style="font-size: 1.05rem; font-weight: 800; color: #fff; margin-top: 0.1rem;">${activeCareer.gf}득 / ${activeCareer.ga}실</div>
                    </div>
                    <div style="background: ${isHard ? 'rgba(255, 62, 108, 0.05)' : 'rgba(255, 215, 0, 0.04)'}; padding: 0.6rem; border-radius: 12px; border: 1.5px solid ${isHard ? 'rgba(255, 62, 108, 0.25)' : 'rgba(255, 215, 0, 0.12)'}; text-align: center; display: flex; flex-direction: column; justify-content: center;">
                        <div style="font-size: 0.72rem; color: ${isHard ? '#ff3e6c' : '#ffd700'}; margin-bottom: 0.2rem;">통산 골득실</div>
                        <div style="font-size: 1.3rem; font-weight: 900; color: ${isHard ? '#ff3e6c' : '#ffd700'};">${gdSign}</div>
                    </div>
                </div>
                
                <!-- Right Column: Top Scorers -->
                <div style="flex: 1; min-width: 220px; background: rgba(10,14,26,0.3); border: 1px solid rgba(255,255,255,0.05); padding: 0.8rem; border-radius: 16px; display: flex; flex-direction: column; gap: 0.4rem;">
                    <h4 style="font-size: 0.82rem; font-weight: 800; color: ${isHard ? '#ff3e6c' : '#ffd700'}; margin-bottom: 0.2rem; display: flex; align-items: center; gap: 6px;">
                        <i class="fa-solid fa-fire-flame-curved"></i> 클럽 통산 득점 랭킹 (Top 3)
                    </h4>
                    ${scorersHtml}
                </div>
            </div>
        </div>
    `;
}

// 전북 현대의 리그 경기 연승 기록 업데이트 헬퍼
function updateLeagueWinStreak(isWin, isDraw) {
    if (isWin) {
        currentWinStreak++;
        if (currentWinStreak > maxWinStreak) {
            maxWinStreak = currentWinStreak;
        }
    } else {
        // 무승부나 패배는 연승 리셋
        currentWinStreak = 0;
    }
    
    try {
        localStorage.setItem('fc_star_current_win_streak', currentWinStreak.toString());
        localStorage.setItem('fc_star_max_win_streak', maxWinStreak.toString());
    } catch (e) {}

    // 연승 업적 체크
    if (typeof checkWinStreakAchievements === 'function') {
        checkWinStreakAchievements(currentWinStreak);
    }
}

// 감독 이적 (리그 변경) 모달 제어
function openLeagueTransferModal() {
    if (isMatchRunning) {
        showToast("경기 진행 중에는 리그를 이동할 수 없습니다.");
        return;
    }
    const modal = document.getElementById('leagueTransferModal');
    if (!modal) return;
    
    // 대상 리그 카드 및 버튼 활성화 상태 동기화
    const kleagueCard = document.getElementById('transferCardKLeague');
    const eplCard = document.getElementById('transferCardEpl');
    const btnKLeague = document.getElementById('btnTransferToKLeague');
    const btnEpl = document.getElementById('btnTransferToEpl');
    
    if (currentLeagueId === 'kleague1') {
        if (kleagueCard) {
            kleagueCard.style.borderColor = '#00ff87';
            kleagueCard.style.background = 'rgba(0, 255, 135, 0.08)';
        }
        if (btnKLeague) {
            btnKLeague.innerText = '진행 중 ⚽';
            btnKLeague.disabled = true;
            btnKLeague.style.background = 'rgba(255, 255, 255, 0.08)';
            btnKLeague.style.color = '#94a3b8';
            btnKLeague.style.cursor = 'default';
        }
        if (eplCard) {
            eplCard.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            eplCard.style.background = 'rgba(255, 255, 255, 0.03)';
        }
        if (btnEpl) {
            btnEpl.innerText = '부임하기 🚀';
            btnEpl.disabled = false;
            btnEpl.style.background = 'linear-gradient(135deg, #ffd700, #ff6b6b)';
            btnEpl.style.color = '#051622';
            btnEpl.style.cursor = 'pointer';
        }
    } else {
        if (eplCard) {
            eplCard.style.borderColor = '#ffd700';
            eplCard.style.background = 'rgba(255, 215, 0, 0.08)';
        }
        if (btnEpl) {
            btnEpl.innerText = '진행 중 ⚽';
            btnEpl.disabled = true;
            btnEpl.style.background = 'rgba(255, 255, 255, 0.08)';
            btnEpl.style.color = '#94a3b8';
            btnEpl.style.cursor = 'default';
        }
        if (kleagueCard) {
            kleagueCard.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            kleagueCard.style.background = 'rgba(255, 255, 255, 0.03)';
        }
        if (btnKLeague) {
            btnKLeague.innerText = '부임하기 🚀';
            btnKLeague.disabled = false;
            btnKLeague.style.background = 'linear-gradient(135deg, #00ff87, #60efff)';
            btnKLeague.style.color = '#051622';
            btnKLeague.style.cursor = 'pointer';
        }
    }
    
    modal.style.display = 'flex';
    modal.classList.add('active');
}

function closeLeagueTransferModal() {
    const modal = document.getElementById('leagueTransferModal');
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('active');
    }
}

function confirmLeagueTransfer(targetLeagueId) {
    if (targetLeagueId === currentLeagueId) {
        showToast(`이미 ${LEAGUE_CONFIGS[targetLeagueId].name}를 진행 중입니다.`);
        closeLeagueTransferModal();
        return;
    }
    
    const targetConfig = LEAGUE_CONFIGS[targetLeagueId];
    const confirmMsg = `[감독 이적 안내]\n\n▶ 부임 리그: ${targetConfig.name} (${targetConfig.userTeamName})\n▶ 시작 연도: ${leagueYear + 1}년 시즌 1라운드부터 시작\n\n※ 현재 시즌 진행 내역은 명예의 전당에 '중도 사퇴'로 기록되며, 통산 기록에 승/무/패/골이 누적됩니다.\n\n정말로 이적하시겠습니까?`;
    
    if (confirm(confirmMsg)) {
        closeLeagueTransferModal();
        transferToLeague(targetLeagueId);
    }
}
