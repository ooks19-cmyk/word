// js/match.js - K리그1 매치 시뮬레이터 + 명예의 전당 모듈

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
        OTHER_TEAMS_PLAYERS_PRESET.forEach(p => {
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

function processPlayerGoal(attackDesc) {
    const activeAttacker = squadFormation["ST"] ? CARDS_DATABASE[squadFormation["ST"]].name : "무명 스트라이커";
    const activeLw = squadFormation["LW"] ? CARDS_DATABASE[squadFormation["LW"]].name : "무명 윙어";
    const activeRw = squadFormation["RW"] ? CARDS_DATABASE[squadFormation["RW"]].name : "무명 윙백";
    const activeCm = squadFormation["CM"] ? CARDS_DATABASE[squadFormation["CM"]].name : "무명 미드필더";

    let scorerId, scorerName, assisterId, assisterName;
    if (attackDesc.includes(activeLw)) {
        scorerId = squadFormation["LW"]; scorerName = activeLw;
        assisterId = squadFormation["CM"]; assisterName = activeCm;
    } else if (attackDesc.includes(activeAttacker)) {
        scorerId = squadFormation["ST"]; scorerName = activeAttacker;
    } else {
        scorerId = squadFormation["RW"]; scorerName = activeRw;
        assisterId = squadFormation["CM"]; assisterName = activeCm;
    }
    
    if (scorerId) registerGoal(scorerId, scorerName, 'jeonbuk', '전북 현대');
    if (assisterId && Math.random() < 0.8) registerAssist(assisterId, assisterName, 'jeonbuk', '전북 현대');
}

function simulateOtherPlayersStats() {
    if (typeof OTHER_TEAMS_PLAYERS_PRESET !== 'undefined') {
        OTHER_TEAMS_PLAYERS_PRESET.forEach(p => {
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
    
    const playersArray = Object.values(leaguePlayerStats || {});
    
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
            leagueRound = parseInt(savedRound);
        } else {
            resetLeagueSeasonState();
        }
        
        if (savedStats) {
            leaguePlayerStats = JSON.parse(savedStats);
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
}

function syncJeonbukOvr() {
    let totalOvr = 0;
    TACTICAL_POSITIONS.forEach(pos => {
        const cardId = squadFormation[pos];
        if (cardId && CARDS_DATABASE[cardId]) {
            totalOvr += getAwakenedCard(cardId).rating;
        } else {
            totalOvr += 70;
        }
    });
    const avgOvr = Math.round(totalOvr / 11);
    
    const jb = leagueTeams.find(t => t.id === 'jeonbuk');
    if (jb) {
        jb.rating = avgOvr;
    }
}

function resetLeagueSeasonState() {
    leagueTeams = JSON.parse(JSON.stringify(K_LEAGUE_TEAMS_PRESET));
    leagueRound = 1;
    initLeaguePlayerStats();
    
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
    // 오늘의 경기 진행 횟수 UI 업데이트
    const matchTodayCountValEl = document.getElementById('matchTodayCountVal');
    if (matchTodayCountValEl) {
        const todayStr = new Date().toLocaleDateString('ko-KR');
        const displayCount = (matchLastDate === todayStr) ? matchTodayCount : 0;
        matchTodayCountValEl.innerText = displayCount;
    }

    // Update active tactical badge on match scoreboard
    const matchTacticBadgeEl = document.getElementById('matchTacticBadge');
    if (matchTacticBadgeEl) {
        matchTacticBadgeEl.style.display = isGegenpressingActive ? 'inline-block' : 'none';
    }
    const matchTikiBadgeEl = document.getElementById('matchTikiBadge');
    if (matchTikiBadgeEl) {
        matchTikiBadgeEl.style.display = isTikitakaActive ? 'inline-block' : 'none';
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
        
        document.getElementById('matchVenueDisplay').innerText = "홈 경기 (전주성) - HOME ADVANTAGE +3 OVR";
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
            <td class="league-team-col">
                <img src="${getTeamEmblemPath(team.id)}" alt="${team.name}">
                <span>${team.name}</span>
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
    
    const todayStr = new Date().toLocaleDateString('ko-KR');
    
    // 날짜가 변경되었을 경우 오늘의 경기 진행수 초기화
    if (matchLastDate !== todayStr) {
        matchTodayCount = 0;
        localStorage.setItem('fc_star_match_today_count', '0');
    }
    
    // 일 단위 경기 진행 제한 체크 (개발자 모드 아닐 시 하루 5경기만 가능)
    if (!isDeveloperMode && matchTodayCount >= 5) {
        showToast("⚠️ 경기는 하루에 최대 5경기만 진행할 수 있습니다! 내일 다시 도전해 주세요.");
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
    
    const isPlayerHome = fixture.isHome;
    const playerOvrBase = jeonbuk.rating;
    const opponentOvrBase = opponent.rating;
    
    // 1. Home-Away Advantage configuration (+3 OVR)
    const playerOvr = isPlayerHome ? playerOvrBase + 3 : playerOvrBase;
    const opponentOvr = !isPlayerHome ? opponentOvrBase + 3 : opponentOvrBase;
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
    
    addCommentary('SYSTEM', `경기 시작 전력 분석 | 전북 OVR ${playerOvrBase} (${isPlayerHome ? '홈' : '원정'}) vs ${opponent.name} OVR ${opponentOvrBase}`, 'system');
    
    if (isGegenpressingActive) {
        addCommentary('SYSTEM', `⚡ [비밀 작전 발동!] 전방압박 전술이 켜졌습니다! 우리 공격수들이 와다다 달려들어 공을 뺏으며 공격 기회가 늘어납니다. (공격 찬스 확률 +6%!)`, 'attack');
    }
    
    if (isTikitakaActive) {
        addCommentary('SYSTEM', `🌀 [비밀 작전 발동!] 티키타카 전술이 켜졌습니다! 패스 패스 슉슉! 우리 패스가 그라운드를 휘저으며 득점 확률이 올라갑니다. (골 성공 확률 +5%!)`, 'goal');
    }
    
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
    // Capped probabilities to balance the luck and stats, plus tactical Gegenpressing boost
    const tacticBoost = isGegenpressingActive ? 0.06 : 0;
    const maxProb = isGegenpressingActive ? 0.90 : 0.85;
    const minProb = isGegenpressingActive ? 0.26 : 0.20;
    const playerAttackProb = Math.min(maxProb, Math.max(minProb, 0.5 + (diff * 0.038) + tacticBoost));
    
    // 개발자 모드: 대기 없이 즉시 시뮬레이션 결과 연산 및 출력
    if (isDeveloperMode) {
        sbTimeDisplay.classList.remove('live-ticking');
        sbTimeDisplay.innerText = "종료";
        
        matchMinutes.forEach(currentMin => {
            if (currentMin === 0) {
                addCommentary(0, `주심의 힘찬 휘슬 소리와 함께 전반전 경기가 시작됩니다! 양 팀 조심스러운 탐색전이 이어집니다.`, 'normal');
            } else if (eventMins.includes(currentMin)) {
                const isPlayerAttack = Math.random() < playerAttackProb;
                if (isPlayerAttack) {
                    const scoreBoost = isTikitakaActive ? 0.05 : 0;
                    const maxScoreProb = isTikitakaActive ? 0.93 : 0.88;
                    const minScoreProb = isTikitakaActive ? 0.15 : 0.10;
                    const scoreProb = Math.min(maxScoreProb, Math.max(minScoreProb, 0.35 + (diff * 0.026) + scoreBoost));
                    const isGoal = Math.random() < scoreProb;
                    const attackTypes = [
                        {
                            desc: `${activeLw} 선수가 폭발적인 속도로 왼쪽 측면을 흔듭니다! 수비수를 제치고 강력하게 슛!`,
                            goal: `골!!! ${activeLw}의 환상적인 감아차기 슛이 골문 오른쪽 구석에 정확히 꽂힙니다! 전북 득점!! 🎉`,
                            fail: `아아! 마지막 순간 상대 수비수의 육탄 방어에 가로막히며 코너킥으로 연결됩니다.`
                        },
                        {
                            desc: `전방에서 강한 압박으로 공을 탈취한 ${activeAttacker}! 일대일 단독 찬스에 직면하여 슛 시도!`,
                            goal: `골!!! ${activeAttacker}가 침착하게 골키퍼 키를 넘기는 칩슛으로 골망을 흔듭니다! 그림 같은 선제골! ⚽`,
                            fail: `앗! 슛이 너무 강했습니다. 크로스바를 살짝 빗나가며 아쉬움을 삼킵니다.`
                        },
                        {
                            desc: `${activeCm} 선수의 창의적인 킬패스가 배후 공간을 무력화시킵니다! 뛰어 들어가는 ${activeRw}! 슛!`,
                            goal: `골!!! ${activeRw}가 몸을 날리는 멋진 발리 슛으로 골을 선사합니다! 멋진 팀워크 플레이! 🥳`,
                            fail: `키퍼의 슈퍼세이브! 상대 수문장이 온몸으로 막아내며 아쉬운 득점 찬스가 무산됩니다.`
                        }
                    ];
                    const selectedAttack = attackTypes[Math.floor(Math.random() * attackTypes.length)];
                    addCommentary(currentMin, selectedAttack.desc, 'attack');
                    if (isGoal) {
                        playerScoreVal++;
                        processPlayerGoal(selectedAttack.desc);
                        addCommentary(currentMin, selectedAttack.goal, 'goal');
                    } else {
                        addCommentary(currentMin, selectedAttack.fail, 'normal');
                    }
                } else {
                    const scoreProb = Math.min(0.88, Math.max(0.08, 0.35 - (diff * 0.026)));
                    const isGoal = Math.random() < scoreProb;
                    addCommentary(currentMin, `상대팀이 중원에서 패스워크를 맞추며 우리 진영을 위협합니다. 문전 앞 혼전 상황!`, 'attack');
                    if (isGoal) {
                        opponentScoreVal++;
                        addCommentary(currentMin, `실점! 상대 공격수의 기습적인 헤더 슛이 ${activeGk} 골키퍼의 손끝을 스치며 골문으로 밀려 들어갑니다.`, 'normal');
                    } else {
                        addCommentary(currentMin, `${activeGk} 골키퍼의 빛나는 판단력! 침착하게 날아오는 크로스를 캐칭해 냅니다. 위기를 넘깁니다!`, 'normal');
                    }
                }
            } else if (currentMin === 45) {
                addCommentary('HT', `치열했던 전반전 경기가 마무리됩니다. 라커룸으로 향하는 선수들. 현재 스코어 ${isPlayerHome ? playerScoreVal : opponentScoreVal} - ${isPlayerHome ? opponentScoreVal : playerScoreVal}`, 'system');
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
        
        addCommentary('FT', `삐- 삐- 삐--! 경기 종료! 양 팀 피땀 흘린 치열한 승부가 마침내 막을 내립니다!`, 'system');
        if (isWinner) {
            addCommentary('FT', `승리!!! 전북 현대가 완벽한 전술 장악과 에이스들의 빛나는 골 활약에 힘입어 ${playerScoreVal} - ${opponentScoreVal} 짜릿한 승리를 챙깁니다! 🏆`, 'goal');
        } else if (isDraw) {
            addCommentary('FT', `무승부! 양 팀 승부를 가리지 못하며 ${playerScoreVal} - ${opponentScoreVal} 로 승점 1점씩 나누어 가집니다. 다음 라운드 반등을 노립니다.`, 'system');
        } else {
            addCommentary('FT', `패배! 전북 현대가 분전했으나 상대의 기습 카운터 공격을 넘지 못하며 ${playerScoreVal} - ${opponentScoreVal} 아쉬운 승점 3점을 내줍니다. 피드백이 필요합니다.`, 'normal');
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
        
        // 경기 승패 무관 1 FP 지급
        userPoints += 1;
        
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
            showToast(`⚡ [개발자 모드] 결과 즉시 출력 및 +1 FP 획득 완료!`);
        }
        
        saveUserProgress();
        return;
    }
    
    const matchTimer = setInterval(() => {
        const currentMin = matchMinutes[tickIdx];
        sbTimeDisplay.innerText = `${currentMin}'`;
        
        if (currentMin === 0) {
            addCommentary(0, `주심의 힘찬 휘슬 소리와 함께 전반전 경기가 시작됩니다! 양 팀 조심스러운 탐색전이 이어집니다.`, 'normal');
        } else if (eventMins.includes(currentMin)) {
            // Simulated Attack Event
            const isPlayerAttack = Math.random() < playerAttackProb;
            
            if (isPlayerAttack) {
                // Player Attack chance
                const scoreBoost = isTikitakaActive ? 0.05 : 0;
                const maxScoreProb = isTikitakaActive ? 0.93 : 0.88;
                const minScoreProb = isTikitakaActive ? 0.15 : 0.10;
                const scoreProb = Math.min(maxScoreProb, Math.max(minScoreProb, 0.35 + (diff * 0.026) + scoreBoost));
                const isGoal = Math.random() < scoreProb;
                
                // Customize commentary text using line up players
                const attackTypes = [
                    {
                        desc: `${activeLw} 선수가 폭발적인 속도로 왼쪽 측면을 흔듭니다! 수비수를 제치고 강력하게 슛!`,
                        goal: `골!!! ${activeLw}의 환상적인 감아차기 슛이 골문 오른쪽 구석에 정확히 꽂힙니다! 전북 득점!! 🎉`,
                        fail: `아아! 마지막 순간 상대 수비수의 육탄 방어에 가로막히며 코너킥으로 연결됩니다.`
                    },
                    {
                        desc: `전방에서 강한 압박으로 공을 탈취한 ${activeAttacker}! 일대일 단독 찬스에 직면하여 슛 시도!`,
                        goal: `골!!! ${activeAttacker}가 침착하게 골키퍼 키를 넘기는 칩슛으로 골망을 흔듭니다! 그림 같은 선제골! ⚽`,
                        fail: `앗! 슛이 너무 강했습니다. 크로스바를 살짝 빗나가며 아쉬움을 삼킵니다.`
                    },
                    {
                        desc: `${activeCm} 선수의 창의적인 킬패스가 배후 공간을 무력화시킵니다! 뛰어 들어가는 ${activeRw}! 슛!`,
                        goal: `골!!! ${activeRw}가 몸을 날리는 멋진 발리 슛으로 골을 선사합니다! 멋진 팀워크 플레이! 🥳`,
                        fail: `키퍼의 슈퍼세이브! 상대 수문장이 온몸으로 막아내며 아쉬운 득점 찬스가 무산됩니다.`
                    }
                ];
                
                const selectedAttack = attackTypes[Math.floor(Math.random() * attackTypes.length)];
                addCommentary(currentMin, selectedAttack.desc, 'attack');
                
                if (isGoal) {
                    playerScoreVal++;
                    processPlayerGoal(selectedAttack.desc);
                    playSound('reveal');
                    
                    if (isPlayerHome) {
                        document.getElementById('homeScore').innerText = playerScoreVal;
                    } else {
                        document.getElementById('awayScore').innerText = playerScoreVal;
                    }
                    
                    setTimeout(() => {
                        addCommentary(currentMin, selectedAttack.goal, 'goal');
                    }, 450);
                } else {
                    setTimeout(() => {
                        addCommentary(currentMin, selectedAttack.fail, 'normal');
                    }, 450);
                }
            } else {
                // Opponent Attack chance
                const scoreProb = Math.min(0.88, Math.max(0.08, 0.35 - (diff * 0.026)));
                const isGoal = Math.random() < scoreProb;
                
                addCommentary(currentMin, `상대팀이 중원에서 패스워크를 맞추며 우리 진영을 위협합니다. 문전 앞 혼전 상황!`, 'attack');
                
                if (isGoal) {
                    opponentScoreVal++;
                    playSound('rumble');
                    
                    if (isPlayerHome) {
                        document.getElementById('awayScore').innerText = opponentScoreVal;
                    } else {
                        document.getElementById('homeScore').innerText = opponentScoreVal;
                    }
                    
                    setTimeout(() => {
                        addCommentary(currentMin, `실점! 상대 공격수의 기습적인 헤더 슛이 ${activeGk} 골키퍼의 손끝을 스치며 골문으로 밀려 들어갑니다.`, 'normal');
                    }, 450);
                } else {
                    setTimeout(() => {
                        addCommentary(currentMin, `${activeGk} 골키퍼의 빛나는 판단력! 침착하게 날아오는 크로스를 캐칭해 냅니다. 위기를 넘깁니다!`, 'normal');
                    }, 450);
                }
            }
        } else if (currentMin === 45) {
            addCommentary('HT', `치열했던 전반전 경기가 마무리됩니다. 라커룸으로 향하는 선수들. 현재 스코어 ${isPlayerHome ? playerScoreVal : opponentScoreVal} - ${isPlayerHome ? opponentScoreVal : playerScoreVal}`, 'system');
        } else if (currentMin === 90) {
            // Full time whistle
            sbTimeDisplay.innerText = "종료";
            sbTimeDisplay.classList.remove('live-ticking');
            playSound('reveal');
            
            clearInterval(matchTimer);
            
            const isWinner = playerScoreVal > opponentScoreVal;
            const isDraw = playerScoreVal === opponentScoreVal;
            
            addCommentary('FT', `삐- 삐- 삐--! 경기 종료! 양 팀 피땀 흘린 치열한 승부가 마침내 막을 내립니다!`, 'system');
            
            if (isWinner) {
                addCommentary('FT', `승리!!! 전북 현대가 완벽한 전술 장악과 에이스들의 빛나는 골 활약에 힘입어 ${playerScoreVal} - ${opponentScoreVal} 짜릿한 승리를 챙깁니다! 🏆`, 'goal');
            } else if (isDraw) {
                addCommentary('FT', `무승부! 양 팀 승부를 가리지 못하며 ${playerScoreVal} - ${opponentScoreVal} 로 승점 1점씩 나누어 가집니다. 다음 라운드 반등을 노립니다.`, 'system');
            } else {
                addCommentary('FT', `패배! 전북 현대가 분전했으나 상대의 기습 카운터 공격을 넘지 못하며 ${playerScoreVal} - ${opponentScoreVal} 아쉬운 승점 3점을 내줍니다. 피드백이 필요합니다.`, 'normal');
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
            
            // 경기 승패 무관 1 FP 지급
            userPoints += 1;

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
                    showToast(`🏆 경기 완료 보상으로 +1 FP 획득! (하루 최대 5경기 제한)`);
                }, 2000);
            }
            
            // Auto-save progress
            saveUserProgress();
        }
        
        tickIdx++;
    }, 1100); // Ticks run roughly every 1.1s to hit the ~10s duration constraint perfectly
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
        topAssister: (topAssister && topAssister.teamId === 'jeonbuk') ? { name: topAssister.name, assists: topAssister.assists } : null
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
    trophyContainer.style.padding = '3rem 2rem';
    trophyContainer.style.borderRadius = '20px';
    trophyContainer.style.maxWidth = '420px';
    trophyContainer.style.textAlign = 'center';
    trophyContainer.style.animation = 'goalPop 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
    
    if (isJeonbukChamp) {
        trophyContainer.innerHTML = `
            <i class="fa-solid fa-trophy" style="font-size: 5rem; color:#ffd700; filter:drop-shadow(0 0 25px rgba(255,215,0,0.6)); margin-bottom:1.5rem; animation: float 3s ease-in-out infinite;"></i>
            <h2 style="font-size:1.8rem; font-weight:900; background:var(--gold-gradient); -webkit-background-clip:text; -webkit-text-fill-color:transparent; margin-bottom:0.8rem;">🎉 리그 우승 달성! 🎉</h2>
            <p style="color:var(--text-light); font-size:1.05rem; line-height:1.6; margin-bottom:1.8rem;">
                축하합니다! 전북 현대가 ${leagueYear} 시즌 K리그1 우승을 차지하여 역사적인 트로피를 들어올렸습니다!<br>
                당신이 꾸린 베스트 11이 K리그 정상의 주역으로 우뚝 섰습니다.
            </p>
            <button class="btn-open-pack" onclick="closeChampModal()" style="margin-top:0;">다음 시즌 시작하기</button>
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
    
    if (!gridEl) return;
    
    // Update count display
    if (countEl) countEl.innerText = hallOfFame.length;
    
    // Clear dynamic cards
    const existingCards = gridEl.querySelectorAll('.fame-card');
    existingCards.forEach(c => c.remove());
    
    if (hallOfFame.length === 0) {
        if (placeholderEl) placeholderEl.style.display = 'flex';
        return;
    }
    
    if (placeholderEl) placeholderEl.style.display = 'none';
    
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
