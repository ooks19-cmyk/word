// js/national_hof.js - National Hall of Fame View Engine
let currentNationalHofNation = null;

function renderNationalHallOfFame(targetNationId) {
    const root = document.getElementById('nationalHallOfFame');
    if (!root) return;

    // 1. 활성 국가 결정
    const availableNations = (typeof NATIONAL_TEAMS !== 'undefined') ? Object.keys(NATIONAL_TEAMS) : ['KR', 'JP'];
    if (targetNationId && NATIONAL_TEAMS[targetNationId]) {
        currentNationalHofNation = targetNationId;
    } else if (!currentNationalHofNation || !NATIONAL_TEAMS[currentNationalHofNation]) {
        const activeState = (typeof getNationalModeState === 'function')
            ? getNationalModeState()
            : (typeof nationalModeState !== 'undefined' ? nationalModeState : null);
        currentNationalHofNation = (activeState && activeState.selectedNationId && NATIONAL_TEAMS[activeState.selectedNationId])
            ? activeState.selectedNationId
            : (availableNations[0] || 'KR');
    }
    const selected = currentNationalHofNation;
    const c = (typeof getNationalTeamConfig === 'function')
        ? getNationalTeamConfig(selected)
        : (typeof NATIONAL_TEAMS !== 'undefined' ? NATIONAL_TEAMS[selected] : null);
    if (!c) return;

    // 2. 상태 및 아카이브 데이터 조회
    const state = (typeof getNationalModeState === 'function')
        ? getNationalModeState()
        : (typeof nationalModeState !== 'undefined' && nationalModeState
            ? nationalModeState
            : (typeof createNationalState === 'function' ? createNationalState(typeof leagueYear === 'number' ? leagueYear : 2026) : { archive: {} }));

    const archive = state.archive || { recordsByNation: {}, careerByNation: {} };
    const rawRecords = (archive.recordsByNation && archive.recordsByNation[selected]) ? archive.recordsByNation[selected] : [];
    // 최신 연도순 정렬
    const records = [...rawRecords].sort((a, b) => (b.year || 0) - (a.year || 0));
    const career = (archive.careerByNation && archive.careerByNation[selected])
        ? archive.careerByNation[selected]
        : { w: 0, d: 0, l: 0, gf: 0, ga: 0, playerGoals: {}, playerAssists: {} };

    // 통산 통계 계산
    const totalMatches = (career.w || 0) + (career.d || 0) + (career.l || 0);
    const winRate = totalMatches > 0 ? Math.round(((career.w || 0) / totalMatches) * 100) : 0;
    const gd = (career.gf || 0) - (career.ga || 0);
    const gdSign = gd > 0 ? `+${gd}` : `${gd}`;

    // 트로피 및 입상 횟수 계산
    let titlesCount = 0;
    let runnerUpCount = 0;
    let semiFinalCount = 0;

    records.forEach(r => {
        const res = r.result || '';
        if (res.includes('준우승')) runnerUpCount++;
        else if (res.includes('우승')) titlesCount++;
        else if (res.includes('4강') || res.includes('3위') || res.includes('4위')) semiFinalCount++;
    });

    // 득점 및 도움 순위 Top 5
    const topScorers = Object.entries(career.playerGoals || {})
        .filter(([_, goals]) => goals > 0)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    const topAssisters = Object.entries(career.playerAssists || {})
        .filter(([_, assists]) => assists > 0)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    // 테마 컬러
    const themeColor = c.color || '#c8102e';

    // 3. UI 템플릿 빌드
    // (1) 국가 선택 탭 바
    const nationTabsHtml = `
        <div class="national-hof-tabs">
            ${Object.values(NATIONAL_TEAMS).map(nation => {
                const isActive = nation.id === selected;
                const nationClass = nation.id === 'KR' ? 'nation-kr' : (nation.id === 'JP' ? 'nation-jp' : '');
                return `
                    <button class="national-hof-tab-btn ${isActive ? 'active ' + nationClass : ''}"
                            onclick="switchNationalHofNation('${nation.id}')">
                        <img src="${nation.flag}" alt="${nation.name}" class="national-hof-tab-flag">
                        <span>${nation.name}</span>
                        <span style="font-size: 0.78rem; opacity: 0.75;">(${nation.shortName})</span>
                    </button>
                `;
            }).join('')}
        </div>
    `;

    // (2) 대표팀 헤더 & 트로피 진열장
    const headerHtml = `
        <div class="national-hof-header" style="--theme-color: ${themeColor};">
            <div class="national-hof-team-info">
                <img src="${c.flag}" alt="${c.name}" class="national-hof-flag-large">
                <div>
                    <div class="national-hof-team-title">
                        ${c.name} 국가대표팀
                        <span style="font-size: 0.78rem; padding: 2px 8px; border-radius: 6px; background: rgba(255,255,255,0.08); font-weight: 700; color: #94a3b8;">${c.shortName}</span>
                    </div>
                    <div class="national-hof-team-meta">
                        <span class="national-hof-meta-badge"><i class="fa-solid fa-chess-board" style="margin-right: 4px;"></i>${c.formation}</span>
                        <span class="national-hof-meta-badge"><i class="fa-solid fa-star" style="color: #ffd700; margin-right: 4px;"></i>${c.stars ? c.stars.join(' · ') : ''}</span>
                    </div>
                </div>
            </div>

            <div class="national-trophy-shelf">
                <div class="national-trophy-badge ${titlesCount > 0 ? 'has-trophy' : ''}">
                    <i class="fa-solid fa-crown" style="font-size: 1.5rem; color: ${titlesCount > 0 ? '#ffd700' : '#475569'};"></i>
                    <div>
                        <div style="font-size: 0.68rem; color: var(--text-muted); font-weight: 700;">우승 트로피</div>
                        <div style="font-size: 0.88rem; font-weight: 800; color: ${titlesCount > 0 ? '#fff' : '#64748b'};">${titlesCount}회 우승</div>
                    </div>
                </div>
                <div class="national-trophy-badge ${runnerUpCount > 0 ? 'has-trophy' : ''}">
                    <i class="fa-solid fa-medal" style="font-size: 1.5rem; color: ${runnerUpCount > 0 ? '#c0c0c0' : '#475569'};"></i>
                    <div>
                        <div style="font-size: 0.68rem; color: var(--text-muted); font-weight: 700;">준우승</div>
                        <div style="font-size: 0.88rem; font-weight: 800; color: ${runnerUpCount > 0 ? '#fff' : '#64748b'};">${runnerUpCount}회</div>
                    </div>
                </div>
                <div class="national-trophy-badge ${semiFinalCount > 0 ? 'has-trophy' : ''}">
                    <i class="fa-solid fa-award" style="font-size: 1.5rem; color: ${semiFinalCount > 0 ? '#cd7f32' : '#475569'};"></i>
                    <div>
                        <div style="font-size: 0.68rem; color: var(--text-muted); font-weight: 700;">4강 진출</div>
                        <div style="font-size: 0.88rem; font-weight: 800; color: ${semiFinalCount > 0 ? '#fff' : '#64748b'};">${semiFinalCount}회</div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // (3) 통산 커리어 대시보드
    const renderLeaderRows = (items, unit) => {
        if (!items || items.length === 0) {
            return `<div style="text-align: center; color: #64748b; padding: 12px; font-size: 0.78rem;">기록 없음</div>`;
        }
        return items.map(([name, count], idx) => {
            let medalColor = '#ffd700'; // 1위 금
            if (idx === 1) medalColor = '#c0c0c0'; // 2위 은
            if (idx === 2) medalColor = '#cd7f32'; // 3위 동
            const medalIcon = idx < 3
                ? `<i class="fa-solid fa-medal" style="color: ${medalColor};"></i>`
                : `<span style="display:inline-block; width:14px; text-align:center; font-size:0.75rem; color:#94a3b8; font-weight:800;">${idx + 1}</span>`;
            return `
                <div class="national-leader-item">
                    <span class="national-leader-rank">
                        ${medalIcon}
                        <span>${name}</span>
                    </span>
                    <span style="color: #ffd700; font-weight: 800;">${count}${unit}</span>
                </div>
            `;
        }).join('');
    };

    const dashboardHtml = `
        <div class="national-dashboard">
            <h3 class="national-dashboard-title">
                <i class="fa-solid fa-chart-line" style="color: #ffd700;"></i>
                <span>${c.name} 대표팀 통산 누적 성적 (All-Time Stats)</span>
            </h3>

            <div class="national-dashboard-body">
                <!-- 왼쪽: 경기 및 득실 요약 -->
                <div class="national-stats-col">
                    <div class="national-stat-box">
                        <div class="national-stat-label">통산 경기</div>
                        <div class="national-stat-value">${totalMatches}전</div>
                        <div class="national-stat-sub">승률 ${winRate}%</div>
                    </div>
                    <div class="national-stat-box" style="border-color: rgba(0, 255, 135, 0.15); background: rgba(0, 255, 135, 0.03);">
                        <div class="national-stat-label" style="color: #00ff87;">통산 전적</div>
                        <div class="national-stat-value" style="font-size: 1.05rem;">${career.w || 0}승 ${career.d || 0}무 ${career.l || 0}패</div>
                        <div class="national-stat-sub">${titlesCount > 0 ? `🏆 ${titlesCount}회 우승 달성` : '대회 도전 중'}</div>
                    </div>
                    <div class="national-stat-box">
                        <div class="national-stat-label">통산 득/실점</div>
                        <div class="national-stat-value" style="font-size: 1.05rem;">${career.gf || 0}득 / ${career.ga || 0}실</div>
                        <div class="national-stat-sub">경기당 ${totalMatches > 0 ? ((career.gf || 0) / totalMatches).toFixed(1) : 0}득점</div>
                    </div>
                    <div class="national-stat-box" style="border-color: rgba(255, 215, 0, 0.15); background: rgba(255, 215, 0, 0.03);">
                        <div class="national-stat-label" style="color: #ffd700;">통산 골득실</div>
                        <div class="national-stat-value" style="color: ${gd > 0 ? '#00ff87' : (gd < 0 ? '#ff4d4f' : '#ffd700')};">${gdSign}</div>
                        <div class="national-stat-sub">득실 마진</div>
                    </div>
                </div>

                <!-- 오른쪽: 득점 및 도움 랭킹 -->
                <div class="national-leaders-col">
                    <div class="national-leaderboard">
                        <h4 class="national-leader-title">
                            <i class="fa-solid fa-soccer-ball"></i> 통산 득점 랭킹 (Top 5)
                        </h4>
                        ${renderLeaderRows(topScorers, '골')}
                    </div>
                    <div class="national-leaderboard">
                        <h4 class="national-leader-title" style="color: #00ff87;">
                            <i class="fa-solid fa-star"></i> 통산 도움 랭킹 (Top 5)
                        </h4>
                        ${renderLeaderRows(topAssisters, '도움')}
                    </div>
                </div>
            </div>
        </div>
    `;

    // (4) 연도별 국제대회 기록 그리드
    let tournamentCardsHtml = '';
    if (records.length === 0) {
        tournamentCardsHtml = `
            <div class="empty-deck" style="margin-top: 0.5rem; grid-column: 1 / -1;">
                <i class="fa-solid fa-earth-asia" style="font-size: 3.5rem; color: var(--text-muted); opacity: 0.6; margin-bottom: 1.5rem;"></i>
                <h3>국제대회 출전 기록이 없습니다</h3>
                <p>${c.name} 국가대표팀을 지휘하여 월드컵, 아시안컵, 올림픽, 아시안게임에서 승리를 쟁취하고 명예의 전당에 이름을 남기세요!</p>
            </div>
        `;
    } else {
        tournamentCardsHtml = records.map(r => {
            const res = r.result || '대회 참가';
            let badgeClass = 'other-medal';
            let badgeIcon = '<i class="fa-solid fa-shield-halved"></i>';
            let resultColor = '#fff';

            if (res.includes('준우승')) {
                badgeClass = 'silver-medal';
                badgeIcon = '<i class="fa-solid fa-medal"></i>';
                resultColor = '#c0c0c0';
            } else if (res.includes('우승')) {
                badgeClass = 'gold-crown';
                badgeIcon = '<i class="fa-solid fa-crown"></i>';
                resultColor = '#ffd700';
            } else if (res.includes('4강') || res.includes('3위') || res.includes('4위')) {
                badgeClass = 'bronze-medal';
                badgeIcon = '<i class="fa-solid fa-award"></i>';
                resultColor = '#cd7f32';
            } else {
                badgeClass = 'other-medal';
                badgeIcon = '<i class="fa-solid fa-shield-halved"></i>';
                resultColor = '#94a3b8';
            }

            // 대회별 아이콘 및 태그
            let tournamentIcon = 'fa-trophy';
            let tournamentType = '국제대회';
            const tourName = r.tournament || '';
            if (tourName.includes('월드컵')) {
                tournamentIcon = 'fa-earth-americas';
                tournamentType = '32개국 본선';
            } else if (tourName.includes('아시안컵')) {
                tournamentIcon = 'fa-shield-halved';
                tournamentType = '16개국 본선';
            } else if (tourName.includes('올림픽')) {
                tournamentIcon = 'fa-medal';
                tournamentType = '32개국 본선';
            } else if (tourName.includes('아시안게임')) {
                tournamentIcon = 'fa-star';
                tournamentType = '16개국 본선';
            }

            const totalMatch = (r.w || 0) + (r.d || 0) + (r.l || 0);
            const scoreMargin = (r.gf || 0) - (r.ga || 0);
            const marginSign = scoreMargin >= 0 ? `+${scoreMargin}` : `${scoreMargin}`;

            return `
                <div class="fame-card">
                    <div class="fame-card-badge ${badgeClass}">
                        ${badgeIcon}
                    </div>
                    <div class="fame-card-content">
                        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.3rem;">
                            <h4 class="fame-card-title" style="margin-bottom: 0;">
                                <i class="fa-solid ${tournamentIcon}" style="color: ${resultColor}; margin-right: 6px;"></i>
                                ${r.year}년 ${tourName}
                            </h4>
                            <span class="national-tournament-tag">${tournamentType}</span>
                        </div>
                        <div class="fame-card-rank" style="color: ${resultColor};">
                            최종 성적: ${res}
                        </div>
                        <div class="fame-card-stats">
                            <span>대회 전적: <strong>${totalMatch}전 ${r.w || 0}승 ${r.d ? r.d + '무 ' : ''}${r.l || 0}패</strong></span>
                            <span>득점/실점: <strong>${r.gf || 0}득점 ${r.ga || 0}실점</strong> <small style="color:${scoreMargin >= 0 ? '#00ff87' : '#ff4d4f'};">(${marginSign})</small></span>
                            ${r.resetUsed ? `<span style="color: #f59e0b; font-size: 0.76rem;"><i class="fa-solid fa-rotate-left" style="margin-right: 4px;"></i>대회 재도전 1회 사용</span>` : ''}
                            ${r.finishedOn ? `<span style="color: #94a3b8; font-size: 0.74rem;"><i class="fa-regular fa-calendar-check" style="margin-right: 4px;"></i>종료일: ${r.finishedOn}</span>` : ''}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    const recordsSectionHtml = `
        <div>
            <div class="deck-header" style="justify-content: flex-end; margin-bottom: 0.8rem;">
                <div class="deck-count">
                    출전한 국제대회: <span style="color: #ffd700; font-weight: 800;">${records.length}</span>개
                </div>
            </div>
            <div class="fame-grid">
                ${tournamentCardsHtml}
            </div>
        </div>
    `;

    // 4. 루트 컨테이너에 렌더링
    root.innerHTML = `
        <div class="national-hof-container">
            ${nationTabsHtml}
            ${headerHtml}
            ${dashboardHtml}
            ${recordsSectionHtml}
        </div>
    `;
}

function switchNationalHofNation(nationId) {
    if (typeof playClickSound === 'function') {
        try { playClickSound(); } catch (e) {}
    }
    renderNationalHallOfFame(nationId);
}
