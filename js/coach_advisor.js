// js/coach_advisor.js - 수석코치 ooks의 전술 조언 모듈

/**
 * 특정 포메이션에 대해 플레이어의 완성도 보너스 점수(0~2)를 계산합니다.
 * @param {string} formationType 포메이션 형태 (예: "4-3-3")
 * @returns {number} 완성도 보너스 스코어
 */
function getFormationTacticBonusScore(formationType) {
    if (formationType === '4-4-2') return 0;
    
    const formation = squadFormations[formationType] || {};
    let hasKeyPlayer = false;
    let hasTeamTactic = false;

    // 헬퍼: 포메이션 평균 능력치 계산
    const getFormationAverageStatLocal = (form, statName) => {
        let totalStat = 0;
        const TACTICAL_POSITIONS = ["GK", "LB", "LCB", "RCB", "RB", "LCM", "CM", "RCM", "LW", "ST", "RW"];
        TACTICAL_POSITIONS.forEach(pos => {
            const cardId = form[pos];
            if (cardId && CARDS_DATABASE[cardId]) {
                const card = getAwakenedCard(cardId);
                if (card && card.stats && card.stats[statName] !== undefined) {
                    totalStat += card.stats[statName];
                } else {
                    totalStat += 70;
                }
            } else {
                totalStat += 70;
            }
        });
        return Math.round(totalStat / 11);
    };

    if (formationType === '4-3-3') {
        const stCardId = formation['ST'];
        hasKeyPlayer = stCardId && getAwakenedCard(stCardId).stats && getAwakenedCard(stCardId).stats.phy >= 80;
        const avgPas = getFormationAverageStatLocal(formation, 'pas');
        hasTeamTactic = avgPas >= 70;
    } else if (formationType === '3-4-3') {
        const cmCardId = formation['CM'];
        hasKeyPlayer = cmCardId && getAwakenedCard(cmCardId).stats && getAwakenedCard(cmCardId).stats.dri >= 80;
        const avgPac = getFormationAverageStatLocal(formation, 'pac');
        hasTeamTactic = avgPac >= 70;
    } else if (formationType === '5-4-1') {
        const lwCardId = formation['LW'];
        const rwCardId = formation['RW'];
        let lwPac = 0, rwPac = 0;
        if (lwCardId) {
            const card = getAwakenedCard(lwCardId);
            if (card && card.stats && card.stats.pac >= 80) {
                hasKeyPlayer = true;
            }
        }
        if (rwCardId) {
            const card = getAwakenedCard(rwCardId);
            if (card && card.stats && card.stats.pac >= 80) {
                hasKeyPlayer = true;
            }
        }
        const avgDef = getFormationAverageStatLocal(formation, 'def');
        hasTeamTactic = avgDef >= 60;
    } else if (formationType === '4-2-3-1') {
        const cmCardId = formation['CM'];
        hasKeyPlayer = cmCardId && getAwakenedCard(cmCardId).stats && getAwakenedCard(cmCardId).stats.dri >= 80;
        const avgDri = getFormationAverageStatLocal(formation, 'dri');
        hasTeamTactic = avgDri >= 70;
    }

    let bonus = 0;
    if (hasKeyPlayer) bonus += 1;
    if (hasTeamTactic) bonus += 1;
    return bonus;
}

/**
 * 플레이어 포메이션 중 완성도 보너스가 가장 높은 베스트 포메이션을 리턴합니다.
 */
function getBestFormationForPlayer() {
    const formations = ['4-3-3', '3-4-3', '5-4-1', '4-2-3-1'];
    let bestForm = '4-3-3';
    let bestScore = -1;
    
    formations.forEach(f => {
        const score = getFormationTacticBonusScore(f);
        if (score > bestScore) {
            bestScore = score;
            bestForm = f;
        }
    });
    return { formation: bestForm, score: bestScore };
}

/**
 * 현재 활성화된 매치 모드의 상대팀 포메이션과 이름을 획득합니다.
 */
function getActiveOpponentInfo() {
    // 1. 리그 탭 활성화 확인
    const leagueTab = document.getElementById('matchSubTabLeague');
    if (leagueTab && leagueTab.classList.contains('active')) {
        const card = document.getElementById('leagueOpponentAnalysisCard');
        if (card && card.style.display !== 'none') {
            const isHome = document.getElementById('matchVenueDisplay')?.innerText.includes('홈');
            const oppName = isHome 
                ? document.getElementById('awayTeamName')?.innerText 
                : document.getElementById('homeTeamName')?.innerText;
            const oppForm = document.getElementById('leagueOpponentFormationText')?.innerText || '4-4-2';
            return { active: true, name: oppName, formation: oppForm.trim(), mode: 'league' };
        }
    }
    
    // 2. 컵 탭 활성화 확인
    const cupTab = document.getElementById('matchSubTabCup');
    if (cupTab && cupTab.classList.contains('active')) {
        const card = document.getElementById('cupOpponentAnalysisCard');
        if (card && card.style.display !== 'none') {
            const homeName = document.getElementById('cupHomeTeamName')?.innerText;
            const awayName = document.getElementById('cupAwayTeamName')?.innerText;
            const oppName = homeName === '전북 현대' ? awayName : homeName;
            const oppForm = document.getElementById('cupOpponentFormationText')?.innerText || '4-4-2';
            return { active: true, name: oppName, formation: oppForm.trim(), mode: 'cup' };
        }
    }
    
    // 3. 아챔 탭 활성화 확인
    const aclTab = document.getElementById('matchSubTabAcl');
    if (aclTab && aclTab.classList.contains('active')) {
        const card = document.getElementById('aclOpponentAnalysisCard');
        if (card && card.style.display !== 'none') {
            const homeName = document.getElementById('aclHomeTeamName')?.innerText;
            const awayName = document.getElementById('aclAwayTeamName')?.innerText;
            const oppName = homeName === '전북 현대' ? awayName : homeName;
            const oppForm = document.getElementById('aclOpponentFormationText')?.innerText || '4-4-2';
            return { active: true, name: oppName, formation: oppForm.trim(), mode: 'acl' };
        }
    }
    
    // 4. 친선경기 탭 활성화 확인
    const friendlyTab = document.getElementById('matchSubTabFriendly');
    if (friendlyTab && friendlyTab.classList.contains('active')) {
        const card = document.getElementById('friendlyOpponentAnalysisCard');
        if (card && card.style.display !== 'none') {
            const oppName = document.getElementById('friendlyAwayTeamName')?.innerText || '친선 상대';
            const oppForm = document.getElementById('friendlyOpponentFormationText')?.innerText || '4-4-2';
            return { active: true, name: oppName, formation: oppForm.trim(), mode: 'friendly' };
        }
    }
    
    return { active: false };
}

/**
 * 수석코치의 전술 조언 모달을 화면에 렌더링하고 노출합니다.
 */
function showCoachAdvice() {
    // 사운드 재생
    if (typeof playClickSound === 'function') {
        try { playClickSound(); } catch (e) {}
    }

    const opponentInfo = getActiveOpponentInfo();
    const modalBody = document.getElementById('advisorModalBody');
    const modal = document.getElementById('advisorModal');
    
    if (!modalBody || !modal) return;
    
    if (!opponentInfo.active) {
        modalBody.innerHTML = `
            <div class="advisor-empty-state" style="text-align: center; padding: 2.5rem 1rem;">
                <span style="font-size: 3.5rem; margin-bottom: 1.2rem; display: block; filter: drop-shadow(0 0 10px rgba(255,255,255,0.1));">👔</span>
                <p style="font-size: 0.98rem; color: #e2e8f0; font-weight: 700; text-align: center; line-height: 1.6; margin: 0; word-break: keep-all;">
                    감독님, 현재 대기 중인 경기 일정이 없거나 다음 매치가 성사되지 않아 전술 분석이 불가능합니다.<br>
                    <span style="color: #94a3b8; font-size: 0.85rem; font-weight: 400; display: block; margin-top: 8px;">경기 준비 완료 상태(상대 분석 요약이 떠 있는 상태)에서 조언을 요청해주세요.</span>
                </p>
            </div>
        `;
        modal.classList.add('active');
        return;
    }
    
    const oppName = opponentInfo.name || '상대팀';
    const oppForm = opponentInfo.formation;
    const playForm = currentFormation || '4-4-2';
    
    let counterForm = '4-4-2';
    let adviceDetail = '';
    
    // 전술 카운터 규칙 적용
    if (oppForm === '3-4-3') {
        counterForm = '4-2-3-1';
        adviceDetail = `상대의 <strong>3-4-3</strong> 스위칭 전술은 빠른 윙백 침투와 위치 혼선이 위협적입니다. 이를 무력화하려면 중원 숫자를 두텁게 가져가 볼 점유권을 통제하고, 유기적인 측면 패스를 사전에 끊어낼 수 있는 <strong>4-2-3-1</strong> 전술이 가장 좋은 대안입니다.`;
    } else if (oppForm === '4-3-3') {
        counterForm = '3-4-3';
        adviceDetail = `상대는 <strong>4-3-3</strong> 지공 축구로 촘촘히 라인을 올릴 것입니다. 우리는 측면에 숫자를 다수 배치하여 윙백의 역동적인 오버랩을 활용하고, 빠른 유기적 스위칭 축구로 상대의 하프스페이스를 허물 수 있는 <strong>3-4-3</strong> 포메이션을 구성하는 편이 유리합니다.`;
    } else if (oppForm === '5-4-1') {
        counterForm = '4-3-3';
        adviceDetail = `상대는 촘촘히 내려앉아 <strong>5-4-1</strong> 역습 위주의 질식 수비를 펼칠 것으로 분석됩니다. 무작정 부딪히기보다는 정밀한 패스워크와 넓은 윙어 배치를 통해 2선과 측면에서 점진적으로 밀고 들어가는 빌드업 지공 전술인 <strong>4-3-3</strong> 포메이션으로 밀집 공간을 파괴해야 합니다.`;
    } else if (oppForm === '4-2-3-1') {
        counterForm = '5-4-1';
        adviceDetail = `상대는 <strong>4-2-3-1</strong> 포메이션으로 높은 중원 점유율을 통해 게임을 완만하게 이끌어가려 할 것입니다. 상대가 높은 라인에서 실수를 유발하게끔 든든한 5백으로 수비진을 잠근 채 수비 성공 후 번개 같은 템포의 기습 윙어 역습을 노리는 <strong>5-4-1</strong> 전술을 추천드립니다.`;
    } else {
        // 4-4-2 등 기타 무상성 포메이션인 경우 플레이어의 최적 전술 추천
        const best = getBestFormationForPlayer();
        counterForm = best.formation;
        adviceDetail = `상대는 균형 잡힌 기본 전술인 <strong>${oppForm}</strong> 포메이션을 들고 나왔기에 특별한 상성적 약점이 뚜렷하지 않습니다. 이럴 때는 상대 전술에 대응하기보다는, 현재 우리 스쿼드에서 선수 구성과 완성도 보너스(OVR 증가 등)가 가장 높은 <strong>${counterForm}</strong> 전술로 정면 승부를 거시는 것을 적극 권장합니다.`;
    }
    
    // 현재 전술 상태 요약
    let matchStatusHtml = '';
    if (playForm === counterForm) {
        matchStatusHtml = `
            <div class="advice-status-box match-perfect">
                <i class="fa-solid fa-circle-check"></i>
                <span>현재 <strong>${playForm}</strong> 포메이션은 상성상 최적의 전술입니다. 이대로 경기를 치르십시오!</span>
            </div>
        `;
    } else {
        matchStatusHtml = `
            <div class="advice-status-box match-needs-change">
                <i class="fa-solid fa-triangle-exclamation"></i>
                <span>현재 설정된 <strong>${playForm}</strong> 전술보다 <strong>${counterForm}</strong> 전술이 유리합니다.</span>
            </div>
        `;
    }
    
    modalBody.innerHTML = `
        <div class="advisor-content">
            <div class="coach-profile" style="display: flex; align-items: center; gap: 12px; margin-bottom: 1rem;">
                <div class="coach-avatar-wrapper" style="width: 52px; height: 52px; background: rgba(0, 255, 135, 0.15); border: 2px solid rgba(0, 255, 135, 0.4); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.8rem; box-shadow: 0 0 12px rgba(0, 255, 135, 0.25);">👔</div>
                <div class="coach-info" style="display: flex; flex-direction: column; text-align: left;">
                    <span class="coach-name" style="font-size: 1.05rem; font-weight: 900; color: #fff;">수석코치 ooks</span>
                    <span class="coach-role" style="font-size: 0.72rem; color: #94a3b8; font-weight: 500;">FC 전북 현대 수석 전술 분석관</span>
                </div>
            </div>
            
            <hr class="advisor-divider" style="border: none; border-top: 1px solid rgba(255, 255, 255, 0.08); margin: 0 0 1.2rem 0;">
            
            <div class="advice-body" style="text-align: left; display: flex; flex-direction: column; gap: 1rem;">
                <p class="advice-greet" style="font-size: 0.88rem; color: #cbd5e1; line-height: 1.5; margin: 0; word-break: keep-all;">
                    감독님, 분석관 ooks입니다. 다가오는 <strong>${oppName}</strong> 전을 대비해 상대 전술을 정밀 분석한 브리핑 보고서입니다.
                </p>
                
                <div class="tactic-vs-badge-container" style="display: flex; align-items: center; justify-content: center; gap: 16px; background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.05); padding: 0.8rem; border-radius: 16px; margin: 0.2rem 0;">
                    <div class="tactic-team-badge opp-badge" style="display: flex; flex-direction: column; align-items: center; gap: 2px; flex: 1;">
                        <span class="badge-label" style="font-size: 0.65rem; color: #94a3b8;">상대 포메이션</span>
                        <span class="badge-form" style="font-size: 1.15rem; font-weight: 900; color: #f43f5e;">${oppForm}</span>
                    </div>
                    <div class="vs-light" style="font-size: 0.8rem; font-weight: 800; color: #64748b; padding: 4px 8px; background: rgba(255, 255, 255, 0.05); border-radius: 8px;">VS</div>
                    <div class="tactic-team-badge user-badge" style="display: flex; flex-direction: column; align-items: center; gap: 2px; flex: 1;">
                        <span class="badge-label" style="font-size: 0.65rem; color: #94a3b8;">우리 포메이션</span>
                        <span class="badge-form" style="font-size: 1.15rem; font-weight: 900; color: #00ff87;">${playForm}</span>
                    </div>
                </div>
                
                <div class="advice-recommend-card" style="background: rgba(0, 255, 135, 0.03); border: 1.5px solid rgba(0, 255, 135, 0.2); border-radius: 18px; padding: 1.1rem; display: flex; flex-direction: column; gap: 0.5rem; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);">
                    <div class="rec-header" style="display: flex; justify-content: space-between; align-items: center;">
                        <span class="rec-title" style="font-size: 0.88rem; font-weight: 800; color: #00ff87; display: flex; align-items: center; gap: 6px;"><i class="fa-solid fa-lightbulb"></i> 핵심 전술 분석</span>
                        <span class="rec-form-badge" style="font-size: 0.7rem; color: #fff; background: rgba(0, 255, 135, 0.25); border: 1px solid rgba(0, 255, 135, 0.4); padding: 2px 8px; border-radius: 12px; font-weight: 800;">${counterForm} 추천</span>
                    </div>
                    <p class="rec-description" style="font-size: 0.84rem; color: #cbd5e1; line-height: 1.6; margin: 0; word-break: keep-all;">${adviceDetail}</p>
                </div>
                
                ${matchStatusHtml}
            </div>
        </div>
    `;
    
    modal.classList.add('active');
}

/**
 * 전술 조언 모달을 닫습니다.
 */
function closeCoachAdvisorModal() {
    const modal = document.getElementById('advisorModal');
    if (modal) modal.classList.remove('active');
    
    if (typeof playClickSound === 'function') {
        try { playClickSound(); } catch (e) {}
    }
}

/**
 * 경기 탭일 때만 수석코치의 전술 조언 플로팅 버튼을 노출해주는 함수
 */
function updateFloatingAdvisorBtnVisibility(tabName) {
    const btn = document.getElementById('floatingAdvisorBtn');
    if (!btn) return;
    
    if (tabName === 'match') {
        btn.style.display = 'flex';
        btn.classList.add('fade-in');
    } else {
        btn.style.display = 'none';
        btn.classList.remove('fade-in');
    }
}
