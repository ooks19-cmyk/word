// js/league.js - K리그1 매치 시뮬레이터 + 명예의 전당 모듈

// 11. K-LEAGUE 1 MATCH SIMULATOR & LEAGUE STANDINGS ENGINE
let leagueTeams = [];
let leagueRound = 1;
let isMatchRunning = false;
let leaguePlayerStats = {};

const K_LEAGUE_TEAMS_PRESET = [
    { id: "jeonbuk", name: "전북 현대", rating: 70, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 },
    { id: "ulsan", name: "울산 HD", rating: 80, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 },
    { id: "seoul", name: "FC 서울", rating: 78, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 },
    { id: "pohang", name: "포항 스틸러스", rating: 77, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 },
    { id: "gangwon", name: "강원 FC", rating: 76, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 },
    { id: "gwangju", name: "광주 FC", rating: 75, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 },
    { id: "gimcheon", name: "김천 상무", rating: 75, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 },
    { id: "bucheon_fc", name: "부천 FC", rating: 74, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 },
    { id: "jeju", name: "제주 유나이티드", rating: 73, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 },
    { id: "daejeon", name: "대전 하나", rating: 73, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 },
    { id: "anyang", name: "FC 안양", rating: 71, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 },
    { id: "incheon", name: "인천 유나이티드", rating: 70, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 }
];

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
    if (typeof OTHER_TEAMS_PLAYERS_PRESET !== 'undefined') {
        const leagueTeamIds = K_LEAGUE_TEAMS_PRESET.map(t => t.id);
        OTHER_TEAMS_PLAYERS_PRESET.forEach(p => {
            // K리그 1 참가 팀 소속 선수만 통계 초기화 대상에 포함 (해외 가상팀, K리그 2 등 제외)
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
    // K리그 1 참가 팀 소속 선수의 골만 K리그 통계에 기록
    const leagueTeamIds = K_LEAGUE_TEAMS_PRESET.map(t => t.id);
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
    // K리그 1 참가 팀 소속 선수의 도움만 K리그 통계에 기록
    const leagueTeamIds = K_LEAGUE_TEAMS_PRESET.map(t => t.id);
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
    const { scorerId, scorerName, assisterId, assisterName } = goalData || {};
    if (scorerId) registerGoal(scorerId, scorerName, 'jeonbuk', '전북 현대');
    if (assisterId) registerAssist(assisterId, assisterName, 'jeonbuk', '전북 현대');
}

function simulateOtherPlayersStats() {
    if (typeof OTHER_TEAMS_PLAYERS_PRESET !== 'undefined') {
        const leagueTeamIds = K_LEAGUE_TEAMS_PRESET.map(t => t.id);
        OTHER_TEAMS_PLAYERS_PRESET.forEach(p => {
            // K리그 1 참가 팀 소속 선수만 리그 시뮬레이션(라운드 진행 시 무작위 득점/도움 누적) 진행
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
    
    const leagueTeamIds = K_LEAGUE_TEAMS_PRESET.map(t => t.id);
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
            const isJeonbuk = p.teamId === 'jeonbuk';
            const rowStyle = isJeonbuk ? 'style="background: rgba(0, 255, 135, 0.08); font-weight: bold; color: #ffd700;"' : '';
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
            const isJeonbuk = p.teamId === 'jeonbuk';
            const rowStyle = isJeonbuk ? 'style="background: rgba(0, 255, 135, 0.08); font-weight: bold; color: #00ff87;"' : '';
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
    if (!Array.isArray(leagueTeams)) return;
    
    let isMigrated = false;
    
    // Map of old team IDs to new team IDs and names
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
    
    // Safety check: ensure every team preset in K_LEAGUE_TEAMS_PRESET exists in leagueTeams
    const currentTeamIds = leagueTeams.map(t => t.id);
    const missingPresets = K_LEAGUE_TEAMS_PRESET.filter(p => !currentTeamIds.includes(p.id));
    
    if (missingPresets.length > 0) {
        console.warn("League teams list is missing required team presets. Resetting list to preset defaults.", missingPresets);
        leagueTeams = JSON.parse(JSON.stringify(K_LEAGUE_TEAMS_PRESET));
        isMigrated = true;
    }
    
    if (isMigrated) {
        try {
            localStorage.setItem('fc_star_league_teams', JSON.stringify(leagueTeams));
        } catch (e) {}
    }
}

function initLeague() {
    try {
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
            
            const leagueTeamIds = K_LEAGUE_TEAMS_PRESET.map(t => t.id);
            // K리그 1 참가 팀 소속이 아닌 예전 데이터(해외 가상팀, K리그 2 등)를 로드 즉시 필터링 및 제거
            Object.keys(leaguePlayerStats).forEach(playerId => {
                const p = leaguePlayerStats[playerId];
                if (!p || !p.teamId || !leagueTeamIds.includes(p.teamId)) {
                    delete leaguePlayerStats[playerId];
                }
            });

            // 2026시즌 이적 시장 및 선수명 개편 반영 동기화 (기존 저장 데이터 보정)
            if (typeof OTHER_TEAMS_PLAYERS_PRESET !== 'undefined') {
                // 1. 구 ID 매핑 보정 (lingard -> anderson, gabriel -> fridjonsson, wanderson -> lee_ho_jae)
                const idMapping = {
                    "lingard": "anderson",
                    "gabriel": "fridjonsson",
                    "wanderson": "lee_ho_jae"
                };
                Object.keys(idMapping).forEach(oldId => {
                    const newId = idMapping[oldId];
                    if (leaguePlayerStats[oldId] && !leaguePlayerStats[newId]) {
                        leaguePlayerStats[newId] = leaguePlayerStats[oldId];
                        leaguePlayerStats[newId].id = newId;
                        delete leaguePlayerStats[oldId];
                    }
                });

                // 2. 이름 및 소속팀 최신화 동기화
                OTHER_TEAMS_PLAYERS_PRESET.forEach(p => {
                    // K리그 1 참가 팀 소속 선수만 동기화 대상에 포함
                    if (!p.teamId || !leagueTeamIds.includes(p.teamId)) return;
                    
                    if (leaguePlayerStats[p.id]) {
                        leaguePlayerStats[p.id].name = p.name;
                        leaguePlayerStats[p.id].teamId = p.teamId;
                        leaguePlayerStats[p.id].teamName = p.teamName;
                    } else {
                        // 세션 도중 새로 추가된 선수가 있다면 등록
                        leaguePlayerStats[p.id] = {
                            id: p.id,
                            name: p.name,
                            teamId: p.teamId,
                            teamName: p.teamName,
                            goals: 0,
                            assists: 0
                        };
                    }
                });
            }
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
    
    // Sync Jeonbuk OVR with current active formation
    syncJeonbukOvr();
    renderLeagueTable();
    updateMatchPreviewBoard();
    renderLeagueStats();
    renderCareerStats();
    
    // Initialize Friendly Match State
    if (typeof initFriendlyMatchState === 'function') {
        initFriendlyMatchState();
    }
    
    // 시즌 완료 후 페이지 새로고침 시 챔피언 확인 모달 자동 복구
    if (leagueRound > 33) {
        setTimeout(() => {
            checkSeasonChampion();
        }, 500);
    }
}

// getPlayerPureOvr() and syncJeonbukOvr() have been moved to js/match_algorithm.js

function resetLeagueSeasonState() {
    leagueTeams = JSON.parse(JSON.stringify(K_LEAGUE_TEAMS_PRESET));
    leagueRound = 1;
    initLeaguePlayerStats();
    
    // 2번째 시즌 이후 상대 팀 OVR 다이내믹 스케일링 적용 (leagueYear > 2026)
    if (typeof leagueYear !== 'undefined' && leagueYear > 2026) {
        const pureOvr = getPlayerPureOvr();
        const strongTeams = ['ulsan', 'seoul', 'pohang', 'gimcheon'];
        
        leagueTeams.forEach(team => {
            if (team.id === 'jeonbuk') {
                team.rating = pureOvr;
            } else if (strongTeams.includes(team.id)) {
                // 강팀 4팀: 플레이어 순수 OVR + 0 ~ +2 범위 랜덤
                const offset = Math.floor(Math.random() * 3); // 0, 1, 2
                team.rating = pureOvr + offset;
            } else {
                // 약팀 8팀: 플레이어 순수 OVR 0 ~ -5 범위 랜덤
                const offset = -Math.floor(Math.random() * 6); // 0, -1, -2, -3, -4, -5
                team.rating = pureOvr + offset;
            }
        });
    }
    
    try {
        localStorage.setItem('fc_star_league_teams', JSON.stringify(leagueTeams));
        localStorage.setItem('fc_star_league_round', leagueRound.toString());
        localStorage.setItem('fc_star_league_stats', JSON.stringify(leaguePlayerStats));
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
    
    syncJeonbukOvr();
    renderLeagueTable();
    renderLeagueStats();
    updateMatchPreviewBoard();
    
    // Clear commentary
    const commBox = document.getElementById('commentaryScroll');
    commBox.innerHTML = '<div class="comm-item comm-system">시즌이 초기화되었습니다. 경기를 시작하려면 아래 \'경기 시작\' 버튼을 누르세요.</div>';
    
    showToast("리그 시즌이 성공적으로 초기화되었습니다!");
    
    // Auto-save user data to cloud
    saveUserProgress();
}

function getTeamEmblemPath(teamId) {
    const mapping = {
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
        "incheon": "img/mark_incheon.png"
    };
    return mapping[teamId] || "img/mark_jb.svg";
}

function updateMatchPreviewBoard() {
    // 현재 연도 시즌 텍스트 갱신
    const seasonYearTextEl = document.getElementById('leagueSeasonYearText');
    if (seasonYearTextEl) {
        seasonYearTextEl.innerText = `${leagueYear} 시즌`;
    }

    // 오늘의 경기 진행 횟수 UI 업데이트
    const matchTodayCountValEl = document.getElementById('matchTodayCountVal');
    if (matchTodayCountValEl) {
        const todayStr = new Date().toLocaleDateString('ko-KR');
        const displayCount = (matchLastDate === todayStr) ? matchTodayCount : 0;
        matchTodayCountValEl.innerText = displayCount;
    }


    if (leagueRound > 33) {
        // Season completed
        document.getElementById('matchRoundVal').innerText = "33";
        document.getElementById('sbTimeDisplay').innerText = "끝";
        document.getElementById('homeTeamName').innerText = "시즌";
        document.getElementById('awayTeamName').innerText = "종료";
        document.getElementById('homeScore').innerText = "-";
        document.getElementById('awayScore').innerText = "-";
        document.getElementById('matchVenueDisplay').innerText = "시즌이 모두 종료되었습니다. 리셋을 눌러 새 시즌을 시작하세요!";
        return;
    }
    
    const fixture = JEONBUK_FIXTURES[leagueRound - 1];
    const opponent = leagueTeams.find(t => t.id === fixture.opponent);
    const jeonbuk = leagueTeams.find(t => t.id === 'jeonbuk');
    
    document.getElementById('matchRoundVal').innerText = leagueRound;
    document.getElementById('sbTimeDisplay').innerText = "VS";
    document.getElementById('homeScore').innerText = "0";
    document.getElementById('awayScore').innerText = "0";
    
    if (fixture.isHome) {
        document.getElementById('homeTeamName').innerText = jeonbuk.name;
        document.getElementById('homeTeamOvr').innerText = jeonbuk.rating;
        document.getElementById('homeEmblem').innerHTML = `<img src="img/mark_jb.svg" alt="전북 현대" class="match-emblem-img" style="height: 48px; width: 48px; filter: drop-shadow(0 0 10px rgba(0, 255, 135, 0.6));">`;
        
        document.getElementById('awayTeamName').innerText = opponent.name;
        document.getElementById('awayTeamOvr').innerText = opponent.rating;
        document.getElementById('awayEmblem').innerHTML = `<img src="${getTeamEmblemPath(opponent.id)}" alt="${opponent.name}" class="match-emblem-img" style="height: 48px; width: 48px; filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.35)); object-fit: contain;">`;
        
        document.getElementById('matchVenueDisplay').innerText = "홈 경기 (전주성) - HOME ADVANTAGE +2 OVR";
    } else {
        document.getElementById('homeTeamName').innerText = opponent.name;
        document.getElementById('homeTeamOvr').innerText = opponent.rating;
        document.getElementById('homeEmblem').innerHTML = `<img src="${getTeamEmblemPath(opponent.id)}" alt="${opponent.name}" class="match-emblem-img" style="height: 48px; width: 48px; filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.35)); object-fit: contain;">`;
        
        document.getElementById('awayTeamName').innerText = jeonbuk.name;
        document.getElementById('awayTeamOvr').innerText = jeonbuk.rating;
        document.getElementById('awayEmblem').innerHTML = `<img src="img/mark_jb.svg" alt="전북 현대" class="match-emblem-img" style="height: 48px; width: 48px; filter: drop-shadow(0 0 10px rgba(0, 255, 135, 0.6));">`;
        
        document.getElementById('matchVenueDisplay').innerText = "원정 경기 - AWAY PENALTY";
    }
}

function renderLeagueTable() {
    const titleEl = document.getElementById('leagueTableTitle');
    if (titleEl) {
        titleEl.innerHTML = `<i class="fa-solid fa-ranking-star" style="margin-right: 8px; color: #ffd700;"></i>${leagueYear} K리그1 실시간 순위`;
    }

    const tbody = document.getElementById('leagueTableBody');
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
        
        if (team.id === 'jeonbuk') {
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

function startMatchSimulation() {
    if (isMatchRunning) return;
    if (leagueRound > 33) {
        showToast("시즌이 종료되었습니다. 우측 상단의 '시즌 리셋'을 진행해주세요!");
        return;
    }
    
    // KFA 코리아컵 & ACL 완료 여부 체크 (33라운드 최종전 진입 시 차단)
    if (leagueRound === 33) {
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
    
    // Ensure Jeonbuk stats are synchronized
    syncJeonbukOvr();
    
    isMatchRunning = true;
    
    const startBtn = document.getElementById('btnStartMatch');
    startBtn.disabled = true;
    startBtn.style.background = 'rgba(255, 255, 255, 0.05)';
    startBtn.style.color = 'var(--text-muted)';
    startBtn.style.cursor = 'not-allowed';
    
    const fixture = JEONBUK_FIXTURES[leagueRound - 1];
    const opponent = leagueTeams.find(t => t.id === fixture.opponent);
    const jeonbuk = leagueTeams.find(t => t.id === 'jeonbuk');
    
    // 포메이션 전술에 따른 직접/비례 확률 보너스 연산 엔진
    const formTactic = getPlayerFormationTacticBonuses();
    const formationAttackBoost = formTactic.formationAttackBoost;
    const formationScoreBoost = formTactic.formationScoreBoost;
    const formationTacticDetailsHtml = formTactic.formationTacticDetailsHtml;

    const isPlayerHome = fixture.isHome;
    const playerOvrBase = jeonbuk.rating;
    const opponentOvrBase = opponent.rating;
    
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
    const playerAttackProb = Math.min(maxProb, Math.max(minProb, 0.40 + (diff * 0.019) + formationAttackBoost + suitabilityBonus + detailedTacticBonus)); // 베이스 40%, 격차 0.019 적용!
    let activeDiff = diff;
    let activePlayerAttackProb = playerAttackProb;

    // 공통 코멘터리 데이터 정의
    const commentaryData = {
        playerOvr: playerOvrBase,
        opponentName: opponent.name,
        opponentOvr: opponentOvrBase,
        isPlayerHome: isPlayerHome,
        playerScoreVal: playerScoreVal,
        opponentScoreVal: opponentScoreVal,
        activeGk: activeGk,
        detailedTacticLabel: detailedTacticLabel,
        suitabilityLabel: suitabilityLabel,
        playerAttackProb: playerAttackProb
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
                        activePlayerAttackProb = Math.min(maxProb, Math.max(minProb, 0.40 + (activeDiff * 0.019) + formationAttackBoost + suitabilityBonus + detailedTacticBonus));
                        addCommentary(currentMin, specialEvent.eventFail, 'normal');
                    } else if (specialEvent.type === "red_player") {
                        activeDiff += specialEvent.ovrChange; // -5
                        activePlayerAttackProb = Math.min(maxProb, Math.max(minProb, 0.40 + (activeDiff * 0.019) + formationAttackBoost + suitabilityBonus + detailedTacticBonus));
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
                                chancePlayerStat = Math.round(((card.stats.dri || 75) + (card.stats.sho || 75)) / 2);
                            }
                        } else if (selectedOption === 1) {
                            const stCardId = squadFormation['ST'];
                            if (stCardId && CARDS_DATABASE[stCardId]) {
                                const card = getAwakenedCard(stCardId);
                                chancePlayerStat = card.stats.sho || 75;
                            }
                        } else if (selectedOption === 2) {
                            const rwCardId = squadFormation['RW'];
                            if (rwCardId && CARDS_DATABASE[rwCardId]) {
                                const card = getAwakenedCard(rwCardId);
                                chancePlayerStat = Math.round(((card.stats.pac || 75) + (card.stats.sho || 75)) / 2);
                            }
                        } else if (selectedOption === 5) { // 4-2-3-1 점유율 연출 (CM 드리블 비례)
                            const cmCardId = squadFormation['CM'];
                            if (cmCardId && CARDS_DATABASE[cmCardId]) {
                                const card = getAwakenedCard(cmCardId);
                                chancePlayerStat = card.stats.dri || 75;
                            }
                        }
                        
                        const playerChanceBonus = Math.max(0, (chancePlayerStat - opponent.rating) * 0.01);
                        const maxScoreProb = 0.50;
                        const minScoreProb = 0.10;
                        const scoreProb = Math.min(maxScoreProb, Math.max(minScoreProb, 0.24 + (activeDiff * 0.019) + formationScoreBoost + playerChanceBonus + suitabilityBonus));
                        const isGoal = Math.random() < scoreProb;
                        const activePlayers = { ST: activeAttacker, LW: activeLw, RW: activeRw, CM: activeCm };
                        const isTacticActive = detailedTacticBonus > 0;
                        const { eventDesc, eventGoal, eventFail } = getDetailedTacticCommentary(selectedOption, currentFormation, isTacticActive, activePlayers);
                        
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
                        
                        const playerDef = getTeamAverageStat('def');
                        const playerDefBonus = Math.max(0, (playerDef - 70) * 0.01);
                        const gkBonus = (playerGkStat + 5 - opponentOvr) * 0.01;
                        const oppScoreProb = Math.min(0.50, Math.max(0.10, 0.40 - (activeDiff * 0.026) - playerDefBonus - gkBonus));
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

        const jb = leagueTeams.find(t => t.id === 'jeonbuk');
        const opp = leagueTeams.find(t => t.id === opponent.id);
        
        jb.p += 1; jb.gf += playerScoreVal; jb.ga += opponentScoreVal; jb.gd = jb.gf - jb.ga;
        opp.p += 1; opp.gf += opponentScoreVal; opp.ga += playerScoreVal; opp.gd = opp.gf - opp.ga;
        
        if (isWinner) { jb.w += 1; jb.pts += 3; opp.l += 1; }
        else if (isDraw) { jb.d += 1; jb.pts += 1; opp.d += 1; opp.pts += 1; }
        else { jb.l += 1; opp.w += 1; opp.pts += 3; }

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

        if (leagueRound > 33) {
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
                    activePlayerAttackProb = Math.min(maxProb, Math.max(minProb, 0.40 + (activeDiff * 0.019) + formationAttackBoost + suitabilityBonus + detailedTacticBonus));
                    setTimeout(() => {
                        addCommentary(currentMin, specialEvent.eventFail, 'normal');
                    }, 450);
                } else if (specialEvent.type === "red_player") {
                    activeDiff += specialEvent.ovrChange; // -5
                    activePlayerAttackProb = Math.min(maxProb, Math.max(minProb, 0.40 + (activeDiff * 0.019) + formationAttackBoost + suitabilityBonus + detailedTacticBonus));
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
                            chancePlayerStat = Math.round(((card.stats.dri || 75) + (card.stats.sho || 75)) / 2);
                        }
                    } else if (selectedOption === 1) {
                        const stCardId = squadFormation['ST'];
                        if (stCardId && CARDS_DATABASE[stCardId]) {
                            const card = getAwakenedCard(stCardId);
                            chancePlayerStat = card.stats.sho || 75;
                        }
                    } else if (selectedOption === 2) {
                        const rwCardId = squadFormation['RW'];
                        if (rwCardId && CARDS_DATABASE[rwCardId]) {
                            const card = getAwakenedCard(rwCardId);
                            chancePlayerStat = Math.round(((card.stats.pac || 75) + (card.stats.sho || 75)) / 2);
                        }
                    } else if (selectedOption === 5) { // 4-2-3-1 점유율 연출 (CM 드리블 비례)
                        const cmCardId = squadFormation['CM'];
                        if (cmCardId && CARDS_DATABASE[cmCardId]) {
                            const card = getAwakenedCard(cmCardId);
                            chancePlayerStat = card.stats.dri || 75;
                        }
                    }
                    
                    const playerChanceBonus = Math.max(0, (chancePlayerStat - opponent.rating) * 0.01);
                    const maxScoreProb = 0.50;
                    const minScoreProb = 0.10;
                    const scoreProb = Math.min(maxScoreProb, Math.max(minScoreProb, 0.24 + (activeDiff * 0.019) + formationScoreBoost + playerChanceBonus + suitabilityBonus));
                    const isGoal = Math.random() < scoreProb;
                    const activePlayers = { ST: activeAttacker, LW: activeLw, RW: activeRw, CM: activeCm };
                    const isTacticActive = detailedTacticBonus > 0;
                    const { eventDesc, eventGoal, eventFail } = getDetailedTacticCommentary(selectedOption, currentFormation, isTacticActive, activePlayers);
                    
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
                    
                    const playerDef = getTeamAverageStat('def');
                    const playerDefBonus = Math.max(0, (playerDef - 70) * 0.01);
                    const gkBonus = (playerGkStat + 5 - opponentOvr) * 0.01;
                    const oppScoreProb = Math.min(0.50, Math.max(0.10, 0.40 - (activeDiff * 0.026) - playerDefBonus - gkBonus));
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
            const jb = leagueTeams.find(t => t.id === 'jeonbuk');
            const opp = leagueTeams.find(t => t.id === opponent.id);
            
            jb.p += 1;
            jb.gf += playerScoreVal;
            jb.ga += opponentScoreVal;
            jb.gd = jb.gf - jb.ga;
            
            opp.p += 1;
            opp.gf += opponentScoreVal;
            opp.ga += playerScoreVal;
            opp.gd = opp.gf - opp.ga;
            
            if (isWinner) {
                jb.w += 1; jb.pts += 3;
                opp.l += 1;
            } else if (isDraw) {
                jb.d += 1; jb.pts += 1;
                opp.d += 1; opp.pts += 1;
            } else {
                jb.l += 1;
                opp.w += 1; opp.pts += 3;
            }
            
            // 5. Simulate all other 5 K League fixtures for this round
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
            startBtn.disabled = false;
            startBtn.style.background = '';
            startBtn.style.color = '';
            startBtn.style.cursor = '';
            
            // Check season completion celebrating
            if (leagueRound > 33) {
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
    const roundFixtures = [];
    const availableTeams = leagueTeams.filter(t => t.id !== 'jeonbuk' && t.id !== opponentId);
    
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
    const sorted = [...leagueTeams].sort((a, b) => {
        if (b.pts !== a.pts) return b.pts - a.pts;
        if (b.gd !== a.gd) return b.gd - a.gd;
        return b.gf - a.gf;
    });
    
    const champion = sorted[0];
    const jb = sorted.find(t => t.id === 'jeonbuk');
    const jbRank = sorted.findIndex(t => t.id === 'jeonbuk') + 1;
    const isJeonbukChamp = champion.id === 'jeonbuk';
    
    // Stop starts previews
    document.getElementById('matchVenueDisplay').innerText = `${leagueYear} 시즌 종료! 명예의 전당 등록 및 다음 시즌을 준비하세요.`;
    document.getElementById('sbTimeDisplay').innerText = "끝";
    
    // 1. 명예의 전당에 전적 기록 등록
    const { topScorer, topAssister } = getTopScorerAndAssister();
    
    // 코리아컵 시즌 성적 조회
    let cupRecordText = "미참가";
    try {
        const savedCup = localStorage.getItem('fc_star_cup_state');
        if (savedCup) {
            const cupStateParsed = JSON.parse(savedCup);
            
            // 전북 현대 성적 판별
            if (cupStateParsed.bracket && cupStateParsed.bracket.winner && cupStateParsed.bracket.winner.id === 'jeonbuk') {
                cupRecordText = "우승 🏆";
            } else {
                const rounds = [2, 4, 8, 16];
                let foundRecord = false;
                for (let r of rounds) {
                    const matches = cupStateParsed.bracket[r] || [];
                    const jbMatch = matches.find(m => (m.team1 && m.team1.id === 'jeonbuk') || (m.team2 && m.team2.id === 'jeonbuk'));
                    if (jbMatch) {
                        if (r === 2) cupRecordText = "준우승 🥈";
                        else if (r === 4) cupRecordText = "4강 탈락";
                        else if (r === 8) cupRecordText = "8강 탈락";
                        else if (r === 16) cupRecordText = "16강 탈락";
                        foundRecord = true;
                        break;
                    }
                }
                
                if (!foundRecord && !cupStateParsed.isFinished) {
                    cupRecordText = `진행 중 (${cupStateParsed.round}강전)`;
                }
            }
        }
    } catch (e) {
        console.warn("Cup Hall of Fame check failed:", e);
    }
    
    // 아챔(AFC 챔피언스리그) 시즌 성적 조회
    let aclRecordText = "미참가";
    try {
        const savedAcl = localStorage.getItem('fc_star_acl_state');
        if (savedAcl) {
            const aclStateParsed = JSON.parse(savedAcl);
            
            // 전북 현대 성적 판별
            if (aclStateParsed.bracket && aclStateParsed.bracket.winner && aclStateParsed.bracket.winner.id === 'jeonbuk') {
                aclRecordText = "우승 🏆";
            } else {
                const rounds = [2, 4, 8, 16];
                let foundRecord = false;
                for (let r of rounds) {
                    const matches = aclStateParsed.bracket[r] || [];
                    const jbMatch = matches.find(m => (m.team1 && m.team1.id === 'jeonbuk') || (m.team2 && m.team2.id === 'jeonbuk'));
                    if (jbMatch) {
                        if (r === 2) aclRecordText = "준우승 🥈";
                        else if (r === 4) aclRecordText = "4강 탈락";
                        else if (r === 8) aclRecordText = "8강 탈락";
                        else if (r === 16) aclRecordText = "16강 탈락";
                        foundRecord = true;
                        break;
                    }
                }
                
                if (!foundRecord && !aclStateParsed.isFinished) {
                    aclRecordText = `진행 중 (${aclStateParsed.round}강전)`;
                }
            }
        }
    } catch (e) {
        console.warn("ACL Hall of Fame check failed:", e);
    }
    
    const record = {
        year: leagueYear,
        jeonbukRank: jbRank,
        jeonbukRecord: {
            w: jb.w,
            d: jb.d,
            l: jb.l,
            pts: jb.pts
        },
        champion: champion.name,
        topScorer: (topScorer && topScorer.teamId === 'jeonbuk') ? { name: topScorer.name, goals: topScorer.goals } : null,
        topAssister: (topAssister && topAssister.teamId === 'jeonbuk') ? { name: topAssister.name, assists: topAssister.assists } : null,
        cupRecord: cupRecordText,
        aclRecord: aclRecordText
    };
    
    // 중복 방지 검증 후 추가
    if (!hallOfFame.some(r => r.year === leagueYear)) {
        hallOfFame.push(record);
        
        // Accumulate Club Career Stats
        if (!careerStats) careerStats = { w: 0, d: 0, l: 0, gf: 0, ga: 0, playerGoals: {} };
        careerStats.w += jb.w;
        careerStats.d += jb.d;
        careerStats.l += jb.l;
        careerStats.gf += jb.gf;
        careerStats.ga += jb.ga;
        
        // Accumulate player goals (Jeonbuk players only)
        const playersArray = Object.values(leaguePlayerStats || {});
        playersArray.forEach(p => {
            if (p.teamId === 'jeonbuk' && p.goals > 0) {
                if (!careerStats.playerGoals) careerStats.playerGoals = {};
                if (!careerStats.playerGoals[p.id]) {
                    careerStats.playerGoals[p.id] = { name: p.name, goals: 0 };
                }
                careerStats.playerGoals[p.id].goals += p.goals;
            }
        });
        
        try {
            localStorage.setItem('fc_star_hall_of_fame', JSON.stringify(hallOfFame));
            localStorage.setItem('fc_star_career_stats', JSON.stringify(careerStats));
        } catch (e) {}
    }
    
    // 1-B. 구단 주장 각성 보너스 (+1) 연동 및 헌정 배너 생성
    let captainAwakenedMsg = "";
    if (isJeonbukChamp && squadCaptain && playerDeck[squadCaptain]) {
        if (typeof playerDeck[squadCaptain].awakening !== 'number') {
            playerDeck[squadCaptain].awakening = 0;
        }
        if (playerDeck[squadCaptain].awakening < 5) {
            playerDeck[squadCaptain].awakening += 1;
            const captainCard = CARDS_DATABASE[squadCaptain];
            captainAwakenedMsg = `
                <div class="captain-awakening-reward" style="margin-top: 1rem; padding: 0.8rem; background: rgba(255, 215, 0, 0.15); border: 1.5px solid rgba(255, 215, 0, 0.35); border-radius: 12px; font-size: 0.82rem; color: #ffd700; font-weight: bold; line-height: 1.45; text-align: left; box-shadow: 0 0 10px rgba(255, 215, 0, 0.25);">
                     <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
                        <i class="fa-solid fa-crown" style="color: #ffd700; animation: keyPlayerLabelPulse 1s infinite alternate;"></i>
                        <span style="font-size: 0.88rem; font-weight: 900;">캡틴 각성 레벨 +1 상향!</span>
                    </div>
                    우승을 지휘한 주장 <strong>${captainCard.name}</strong> 선수가<br>
                    영구적으로 <strong>★${playerDeck[squadCaptain].awakening} 각성</strong> 등급으로 강화되었습니다!<br>
                    <span style="font-size: 0.72rem; color: #cbd5e1; font-weight: normal;">(주장 OVR 및 6대 세부 스탯 +1 영구 증가)</span>
                </div>
            `;
        } else {
            captainAwakenedMsg = `
                <div class="captain-awakening-reward" style="margin-top: 1rem; padding: 0.8rem; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.15); border-radius: 12px; font-size: 0.82rem; color: #cbd5e1; line-height: 1.4; text-align: left;">
                    👑 캡틴 <strong>${CARDS_DATABASE[squadCaptain].name}</strong> 선수는 이미 최대 각성 단계(★5)입니다. 명예로운 우승으로 주장 임무를 완벽히 마쳤습니다!
                </div>
            `;
        }
        
        try {
            localStorage.setItem('fc_star_player_deck', JSON.stringify(playerDeck));
        } catch(e) {}
    } else if (isJeonbukChamp && squadCaptain && !playerDeck[squadCaptain]) {
        squadCaptain = null;
        try { localStorage.removeItem('fc_star_squad_captain'); } catch(e) {}
    }
    
    if (isJeonbukChamp && !squadCaptain) {
        captainAwakenedMsg = `
            <div class="captain-awakening-reward" style="margin-top: 1rem; padding: 0.8rem; background: rgba(255, 255, 255, 0.03); border: 1px dashed rgba(255, 255, 255, 0.15); border-radius: 12px; font-size: 0.78rem; color: #94a3b8; line-height: 1.45; text-align: left;">
                <i class="fa-solid fa-circle-info" style="margin-right: 4px; color: #ff9f43;"></i> 현재 지정된 구단 주장이 없습니다. 포메이션 화면 피치 하단에서 주장을 임명하고 다음 우승 시 각성 보너스 혜택을 쟁취해보세요!
            </div>
        `;
    }
    
    // 2. 최종 결과 모달 활성화 및 커스터마이징
    const modal = document.getElementById('revealModal');
    modal.classList.add('active');
    
    const card3d = document.getElementById('card3dWrapper');
    card3d.style.display = 'none'; // Hide player card
    
    const stage = document.querySelector('.reveal-stage');
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
    
    const isTreble = isJeonbukChamp && cupRecordText.includes("우승") && aclRecordText.includes("우승");
    
    if (isTreble) {
        // Add treble bonus reward (+10 FP)
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
                축하합니다! 전북 현대가 ${leagueYear} 시즌 **K리그1 + 코리아컵 + AFC 챔피언스리그**를 모두 제패하며 위대한 **트레블(3관왕)**을 완성했습니다!<br>
                아시아 축구 역사에 영원히 기억될 대기록의 주인공이 되었습니다.<br>
                <strong style="color: #ffd700; font-size: 1.05rem;">🎁 트레블 달성 보상: +10 FP</strong>
            </p>
            ${captainAwakenedMsg}
            <button class="btn-open-pack" onclick="closeChampModal()" style="margin-top:1.5rem;">다음 시즌 시작하기</button>
        `;
    } else if (isJeonbukChamp) {
        trophyContainer.innerHTML = `
            <i class="fa-solid fa-trophy" style="font-size: 5rem; color:#ffd700; filter:drop-shadow(0 0 25px rgba(255,215,0,0.6)); margin-bottom:1.5rem; animation: float 3s ease-in-out infinite;"></i>
            <h2 style="font-size:1.8rem; font-weight:900; background:var(--gold-gradient); -webkit-background-clip:text; -webkit-text-fill-color:transparent; margin-bottom:0.8rem;">🎉 리그 우승 달성! 🎉</h2>
            <p style="color:var(--text-light); font-size:1.05rem; line-height:1.6; margin-bottom:1rem;">
                축하합니다! 전북 현대가 ${leagueYear} 시즌 K리그1 우승을 차지하여 역사적인 트로피를 들어올렸습니다!<br>
                당신이 꾸린 베스트 11이 K리그 정상의 주역으로 우뚝 섰습니다.
            </p>
            ${captainAwakenedMsg}
            <button class="btn-open-pack" onclick="closeChampModal()" style="margin-top:1.5rem;">다음 시즌 시작하기</button>
        `;
    } else {
        trophyContainer.innerHTML = `
            <i class="fa-solid fa-ranking-star" style="font-size: 5rem; color:#b5c2d9; filter:drop-shadow(0 0 20px rgba(255,255,255,0.2)); margin-bottom:1.5rem; animation: float 3s ease-in-out infinite;"></i>
            <h2 style="font-size:1.8rem; font-weight:900; color:#cbd5e1; margin-bottom:0.8rem;">⚽ ${leagueYear} 시즌 종료 ⚽</h2>
            <p style="color:var(--text-light); font-size:1.05rem; line-height:1.6; margin-bottom:1.8rem;">
                전북 현대가 최종 **${jbRank}위**로 시즌을 마쳤습니다.<br>
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
        createSparkParticles(true, isJeonbukChamp ? '#ffd700' : '#00ff87');
        celebrationTimerCount++;
        if (celebrationTimerCount > 8) clearInterval(celebrationTimer);
    }, 1200);
    
    // Auto-save user data to cloud after season ending
    saveUserProgress();
}

function closeChampModal() {
    const modal = document.getElementById('revealModal');
    modal.classList.remove('active');
    
    // Restore elements
    const card3d = document.getElementById('card3dWrapper');
    if (card3d) card3d.style.display = 'block';
    
    const celeb = document.getElementById('squadChampCelebration');
    if (celeb) celeb.remove();
    
    // 다음 연도 시즌 시작 처리
    startNextSeason();
}

function startNextSeason() {
    // 1. 리그 연도 증가
    leagueYear += 1;
    localStorage.setItem('fc_star_league_year', leagueYear.toString());
    
    // 2. K리그 순위표 초기화 및 라운드 1로 리셋 (기존 스쿼드 및 카드/포인트 보존)
    resetLeagueSeasonState();
    
    // 코리아컵 새 시즌 리셋 연동
    if (typeof resetCupStateData === 'function') {
        resetCupStateData();
    }
    if (typeof initCupTab === 'function') {
        initCupTab();
    }

    // 아챔 새 시즌 리셋 연동
    if (typeof resetAclStateData === 'function') {
        resetAclStateData();
    }
    if (typeof initAclTab === 'function') {
        initAclTab();
    }
    
    // 3. 순위표 렌더링 및 프리뷰 정보 새로고침
    syncJeonbukOvr();
    renderLeagueTable();
    updateMatchPreviewBoard();
    
    // Commentary clear
    const commBox = document.getElementById('commentaryScroll');
    if (commBox) {
        commBox.innerHTML = `<div class="comm-item comm-system">새로운 ${leagueYear} 시즌이 시작되었습니다! 첫 경기를 진행해 보세요.</div>`;
    }
    
    showToast(`🚀 새로운 ${leagueYear} 시즌의 막이 올랐습니다!`);
    
    // 4. 세이브 동기화
    saveUserProgress();
}

function renderHallOfFame() {
    const gridEl = document.getElementById('fameGrid');
    const placeholderEl = document.getElementById('emptyFamePlaceholder');
    const countEl = document.getElementById('fameSeasonCount');
    const headerEl = document.getElementById('fameClubHeader');
    
    if (!gridEl) return;
    
    // Update count display
    if (countEl) countEl.innerText = hallOfFame.length;
    
    // Clear dynamic cards
    const existingCards = gridEl.querySelectorAll('.fame-card');
    existingCards.forEach(c => c.remove());
    
    if (hallOfFame.length === 0) {
        if (placeholderEl) placeholderEl.style.display = 'flex';
        if (headerEl) headerEl.style.display = 'none';
        return;
    }
    
    if (placeholderEl) placeholderEl.style.display = 'none';

    // Calculate championships
    let kLeagueTitles = 0;
    let cupTitles = 0;
    let aclTitles = 0;

    hallOfFame.forEach(record => {
        if (record.jeonbukRank === 1) {
            kLeagueTitles++;
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
        headerEl.style.flexWrap = 'wrap'; // Responsive wrap for mobile
        
        headerEl.innerHTML = `
            <div class="fame-club-info" style="display: flex; align-items: center; gap: 1rem; flex: 1; min-width: 200px;">
                <img src="img/mark_jb.svg" class="logo-emblem" alt="Jeonbuk Hyundai Motors Logo" style="height: 60px; width: 60px; object-fit: contain; filter: drop-shadow(0 0 8px rgba(0, 255, 135, 0.6)); animation: emblemPulse 3s ease-in-out infinite alternate;">
                <div>
                    <h3 style="font-size: 1.25rem; font-weight: 800; color: #fff; margin-bottom: 2px;">전북 현대 모터스</h3>
                    <p style="font-size: 0.8rem; color: var(--text-muted); font-weight: 600;">명예의 전당 트로피 룸</p>
                </div>
            </div>
            <div class="fame-trophy-shelf" style="display: flex; gap: 1rem; align-items: center; flex-wrap: wrap; margin-left: auto;">
                <!-- K-League Trophy -->
                <div class="trophy-badge-container" style="display: flex; align-items: center; gap: 0.6rem; background: rgba(255, 255, 255, 0.03); border: 1.5px solid ${kLeagueTitles > 0 ? 'rgba(255, 215, 0, 0.3)' : 'rgba(255, 255, 255, 0.05)'}; padding: 0.5rem 0.8rem; border-radius: 14px; min-width: 110px; transition: all 0.3s; ${kLeagueTitles > 0 ? 'box-shadow: 0 0 15px rgba(255, 215, 0, 0.1);' : ''}">
                    <i class="fa-solid fa-crown" style="font-size: 1.6rem; color: ${kLeagueTitles > 0 ? '#ffd700' : '#4b5563'}; filter: ${kLeagueTitles > 0 ? 'drop-shadow(0 0 6px rgba(255, 215, 0, 0.6))' : 'none'};"></i>
                    <div>
                        <div style="font-size: 0.7rem; color: var(--text-muted); font-weight: 700;">K리그1</div>
                        <div style="font-size: 0.9rem; font-weight: 800; color: ${kLeagueTitles > 0 ? '#fff' : '#6b7280'};">${kLeagueTitles}회 우승</div>
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
            </div>
        `;
    }
    
    hallOfFame.forEach(record => {
        const card = document.createElement('div');
        card.className = 'fame-card';
        
        let badgeClass = 'other-medal';
        let badgeIcon = '<i class="fa-solid fa-award"></i>';
        
        if (record.jeonbukRank === 1) {
            badgeClass = 'gold-crown';
            badgeIcon = '<i class="fa-solid fa-crown"></i>';
        } else if (record.jeonbukRank === 2) {
            badgeClass = 'silver-medal';
            badgeIcon = '<i class="fa-solid fa-medal"></i>';
        } else if (record.jeonbukRank === 3) {
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
        
        card.innerHTML = `
            <div class="fame-card-badge ${badgeClass}">
                ${badgeIcon}
            </div>
            <div class="fame-card-content">
                <h4 class="fame-card-title">${record.year}년 시즌 K리그1</h4>
                <div class="fame-card-rank">최종 순위: ${record.jeonbukRank}위</div>
                <div class="fame-card-stats">
                    <span>최종 승점: <strong>${record.jeonbukRecord.pts} 점</strong></span>
                    <span>시즌 전적: <strong>33전 ${record.jeonbukRecord.w}승 ${record.jeonbukRecord.d}무 ${record.jeonbukRecord.l}패</strong></span>
                    <span>시즌 우승팀: <strong>${record.champion}</strong></span>
                    ${record.cupRecord ? `<span>코리아컵 성적: <strong style="color: #00d2fc;">${record.cupRecord}</strong></span>` : ''}
                    ${record.aclRecord ? `<span>아챔 성적: <strong style="color: #00ff87;">${record.aclRecord}</strong></span>` : ''}
                </div>
                ${awardHtml}
            </div>
        `;
        
        gridEl.appendChild(card);
    });
    
    renderCareerStats();
}

function renderCareerStats() {
    const dashboardEl = document.getElementById('careerStatsDashboard');
    if (!dashboardEl) return;
    
    if (hallOfFame.length === 0) {
        dashboardEl.style.display = 'none';
        return;
    }
    
    dashboardEl.style.display = 'block';
    
    const gd = careerStats.gf - careerStats.ga;
    const gdSign = gd > 0 ? `+${gd}` : gd;
    
    // Sort players for top 3 scorers
    const topScorers = Object.values(careerStats.playerGoals || {})
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
        <div style="background: linear-gradient(135deg, rgba(8, 10, 16, 0.6) 0%, rgba(15, 19, 34, 0.6) 100%); border: 1.5px solid rgba(255, 215, 0, 0.35); border-radius: 20px; padding: 1.2rem; margin-bottom: 1.5rem; box-shadow: var(--card-shadow); backdrop-filter: blur(10px);">
            <h3 style="font-size: 1.1rem; font-weight: 900; background: var(--gold-gradient); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 1rem; display: flex; align-items: center; gap: 8px;">
                <i class="fa-solid fa-chart-line" style="color: #ffd700;"></i> 클럽 통산 누적 성적 (All-Time Career Stats)
            </h3>
            
            <div style="display: flex; gap: 1.2rem; flex-wrap: wrap;">
                <!-- Left Column: Match & Goal Stats -->
                <div style="flex: 1.3; min-width: 250px; display: grid; grid-template-columns: repeat(auto-fit, minmax(110px, 1fr)); gap: 0.6rem;">
                    <div style="background: rgba(255,255,255,0.03); padding: 0.6rem; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05); text-align: center; display: flex; flex-direction: column; justify-content: center;">
                        <div style="font-size: 0.72rem; color: #94a3b8; margin-bottom: 0.2rem;">통산 경기</div>
                        <div style="font-size: 1.3rem; font-weight: 900; color: #fff;">${careerStats.w + careerStats.d + careerStats.l}전</div>
                    </div>
                    <div style="background: rgba(0, 255, 135, 0.04); padding: 0.6rem; border-radius: 12px; border: 1px solid rgba(0, 255, 135, 0.12); text-align: center; display: flex; flex-direction: column; justify-content: center;">
                        <div style="font-size: 0.72rem; color: #00ff87; margin-bottom: 0.2rem;">통산 전적</div>
                        <div style="font-size: 1.05rem; font-weight: 800; color: #fff; margin-top: 0.1rem;">${careerStats.w}승 ${careerStats.d}무 ${careerStats.l}패</div>
                    </div>
                    <div style="background: rgba(255,255,255,0.03); padding: 0.6rem; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05); text-align: center; display: flex; flex-direction: column; justify-content: center;">
                        <div style="font-size: 0.72rem; color: #94a3b8; margin-bottom: 0.2rem;">통산 득/실점</div>
                        <div style="font-size: 1.05rem; font-weight: 800; color: #fff; margin-top: 0.1rem;">${careerStats.gf}득 / ${careerStats.ga}실</div>
                    </div>
                    <div style="background: rgba(255, 215, 0, 0.04); padding: 0.6rem; border-radius: 12px; border: 1px solid rgba(255, 215, 0, 0.12); text-align: center; display: flex; flex-direction: column; justify-content: center;">
                        <div style="font-size: 0.72rem; color: #ffd700; margin-bottom: 0.2rem;">통산 골득실</div>
                        <div style="font-size: 1.3rem; font-weight: 900; color: #ffd700;">${gdSign}</div>
                    </div>
                </div>
                
                <!-- Right Column: Top Scorers -->
                <div style="flex: 1; min-width: 220px; background: rgba(10,14,26,0.3); border: 1px solid rgba(255,255,255,0.05); padding: 0.8rem; border-radius: 16px; display: flex; flex-direction: column; gap: 0.4rem;">
                    <h4 style="font-size: 0.82rem; font-weight: 800; color: #ffd700; margin-bottom: 0.2rem; display: flex; align-items: center; gap: 6px;">
                        <i class="fa-solid fa-fire-flame-curved"></i> 클럽 통산 득점 랭킹 (Top 3)
                    </h4>
                    ${scorersHtml}
                </div>
            </div>
        </div>
    `;
}
