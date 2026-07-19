// app.js - FC STAR CARD Entry Point (진입점)

// Tab Switching
function switchTab(tabName) {
    const tabs = {
        'pack': {
            btn: document.getElementById('tabPackBtn'),
            section: document.getElementById('packSection')
        },
        'quiz': {
            btn: document.getElementById('tabQuizBtn'),
            section: document.getElementById('quizSection')
        },
        'deck': {
            btn: document.getElementById('tabDeckBtn'),
            section: document.getElementById('deckSection')
        },
        'squad': {
            btn: document.getElementById('tabSquadBtn'),
            section: document.getElementById('squadSection')
        },
        'match': {
            btn: document.getElementById('tabMatchBtn'),
            section: document.getElementById('matchSection')
        },
        'fame': {
            btn: document.getElementById('tabFameBtn'),
            section: document.getElementById('fameSection')
        },
        'friend': {
            btn: document.getElementById('tabFriendBtn'),
            section: document.getElementById('friendSection')
        }
    };

    Object.keys(tabs).forEach(key => {
        if (tabs[key].btn && tabs[key].section) {
            if (key === tabName) {
                tabs[key].btn.classList.add('active');
                tabs[key].section.classList.add('active');
            } else {
                tabs[key].btn.classList.remove('active');
                tabs[key].section.classList.remove('active');
            }
        }
    });

    if (tabName === 'deck') {
        renderDeck();
    } else if (tabName === 'squad') {
        renderSquadFormation();
    } else if (tabName === 'match') {
        switchMatchSubTab('league');
    } else if (tabName === 'quiz') {
        if (typeof quizQueue === 'undefined' || !quizQueue || quizQueue.length === 0) {
            initQuizRound();
        } else {
            const completeOverlay = document.getElementById('quizCompleteOverlay');
            if (quizSolvedCount >= 5) {
                if (completeOverlay) completeOverlay.style.display = 'flex';
            } else {
                if (completeOverlay) completeOverlay.style.display = 'none';
                renderQuizCurrent();
            }
        }
        renderUserLevel();
        if (typeof showQuizSetToast === 'function') {
            showQuizSetToast();
        }
    } else if (tabName === 'fame') {
        renderHallOfFame();
    } else if (tabName === 'friend') {
        if (typeof initFriendTab === 'function') {
            initFriendTab();
        }
    }
    
    // 수석코치 조언 플로팅 버튼 노출 제어
    if (typeof updateFloatingAdvisorBtnVisibility === 'function') {
        updateFloatingAdvisorBtnVisibility(tabName);
    }
    
    renderUserPoints(); // Ensure header points are sync'd
}

// 경기진행 하위 탭 전환 함수
function switchMatchSubTab(tabId) {
    const subTabs = {
        'league': {
            btn: document.getElementById('matchSubTabLeague'),
            layout: document.getElementById('matchLayoutLeague')
        },
        'cup': {
            btn: document.getElementById('matchSubTabCup'),
            layout: document.getElementById('matchLayoutCup')
        },
        'acl': {
            btn: document.getElementById('matchSubTabAcl'),
            layout: document.getElementById('matchLayoutAcl')
        },
        'friendly': {
            btn: document.getElementById('matchSubTabFriendly'),
            layout: document.getElementById('matchLayoutFriendly')
        }
    };

    Object.keys(subTabs).forEach(key => {
        const item = subTabs[key];
        if (item.btn && item.layout) {
            if (key === tabId) {
                item.btn.classList.add('active');
                // 리그, 친선경기, 코리아컵, 아챔은 기존 .match-layout(flex)을 사용하므로 flex로 보여주고, 나머지는 block
                item.layout.style.display = (key === 'league' || key === 'friendly' || key === 'cup' || key === 'acl') ? 'flex' : 'block';
                item.layout.classList.add('active');
            } else {
                item.btn.classList.remove('active');
                item.layout.style.display = 'none';
                item.layout.classList.remove('active');
            }
        }
    });

    // 하위 탭 진입 시 전용 연동 호출
    if (tabId === 'friendly') {
        if (typeof initFriendlyMatchTab === 'function') {
            initFriendlyMatchTab();
        }
    } else if (tabId === 'league') {
        if (typeof syncJeonbukOvr === 'function') syncJeonbukOvr();
        if (typeof updateMatchPreviewBoard === 'function') updateMatchPreviewBoard();
        if (typeof renderLeagueTable === 'function') renderLeagueTable();
    } else if (tabId === 'cup') {
        if (typeof initCupTab === 'function') initCupTab();
    } else if (tabId === 'acl') {
        if (typeof initAclTab === 'function') initAclTab();
    }

    // 클릭 사운드 피드백 (sound.js 연계)
    if (typeof playClickSound === 'function') {
        try {
            playClickSound();
        } catch (e) {
            console.warn("Sound play failed:", e);
        }
    }
}

// 10. INITIALIZATION
document.addEventListener('DOMContentLoaded', () => {
    updateGlowTheme();
    updateTotalCardCount();
    renderSquadFormation(); // Initialize squad pitch rendering
    initLeague();           // Initialize K League Standing & Fixtures
    if (typeof initCup === 'function') initCup(); // Initialize KFA Cup State
    if (typeof initAcl === 'function') initAcl(); // Initialize ACL State
    renderUserPoints();     // Sync user gacha points on load
    // CARDS_DATABASE 포지션 유효성 검사 (ST, LW, RW, CM, CB, LB, RB, GK)
    try {
        const VALID_POSITIONS = ['ST', 'LW', 'RW', 'CM', 'CB', 'LB', 'RB', 'GK', 'CAM'];
        Object.keys(CARDS_DATABASE).forEach(cardId => {
            const card = CARDS_DATABASE[cardId];
            if (card && card.position && !VALID_POSITIONS.includes(card.position)) {
                console.error(`[FC STAR 포지션 제한 오류] 카드 ID '${cardId}' (${card.name})의 포지션 '${card.position}'은(는) 허용되지 않는 값입니다. 'ST, LW, RW, CM, CB, LB, RB, GK, CAM' 중 하나여야 합니다.`);
            }
        });
    } catch (e) {
        console.warn("Card database position assertion skipped:", e);
    }
    
    // Register PWA Service Worker
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('sw.js')
                .then(reg => console.log('Service Worker registered successfully!', reg))
                .catch(err => console.error('Service Worker registration failed.', err));
        });
    }
    
    // Bind Enter key to quiz input
    const quizInput = document.getElementById('quizAnswerInput');
    if (quizInput) {
        quizInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                submitQuizAnswer();
            }
        });
    }
    
    // Bind Enter key to Auth Input
    const authPwInput = document.getElementById('authUserPasswordInput');
    if (authPwInput) {
        authPwInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                handleAuthSubmit();
            }
        });
    }
    
    document.getElementById('appLogo').addEventListener('click', () => {
        initAudio();
    });
    
    // Auto restore active logged-in user session - 무조건 로그인 화면이 나오도록 자동 세션 복원 비활성화
    try {
        localStorage.removeItem('fc_star_current_user');
        currentUser = null;
        setTimeout(() => {
            openAuthModal(true);
        }, 200);
    } catch(e) {
        console.warn("세션 초기화 실패:", e);
        setTimeout(() => {
            openAuthModal(true);
        }, 200);
    }
    
    // 모바일 브라우저 뒤로가기 버튼 더블클릭 종료 연동
    initMobileBackButtonControl();

    // 페이지를 닫거나 이탈할 때 최종 데이터 세이브
    window.addEventListener('beforeunload', () => {
        if (typeof saveUserProgress === 'function') {
            saveUserProgress();
        }
    });
});

// 모바일 브라우저 뒤로가기 버튼 제어 (두 번 눌러 종료 & 모달 닫기)
let lastBackPressTime = 0;

function initMobileBackButtonControl() {
    // 최초 더미 히스토리 푸시
    history.pushState({ page: 'main' }, '');

    window.addEventListener('popstate', (event) => {
        // 활성화된 모달/레이어가 있다면 닫음
        const closedAny = checkAndCloseActiveModal();

        if (closedAny) {
            // 모달을 닫았으므로 히스토리 뎁스 유지
            history.pushState({ page: 'main' }, '');
        } else {
            // 모달이 없는 상태에서 뒤로가기 감지: 2초 내 더블 클릭 시 종료
            const now = Date.now();
            if (now - lastBackPressTime < 2000) {
                // 더블 클릭 시 히스토리를 한 단계 더 뒤로 이동시켜 실제 브라우저 종료/이전 페이지 이동을 허용
                history.back();
            } else {
                lastBackPressTime = now;
                if (typeof showToast === 'function') {
                    showToast("이전 버튼을 한 번 더 누르면 종료됩니다.");
                }
                // 뒤로가기 차단을 유지하기 위해 다시 히스토리 푸시
                history.pushState({ page: 'main' }, '');
            }
        }
    });
}

function checkAndCloseActiveModal() {
    const modals = [
        { id: 'drawerOverlay', active: (el) => el.classList.contains('active'), close: () => { if (typeof closeDrawer === 'function') closeDrawer(); } },
        { id: 'formationModal', active: (el) => el.classList.contains('active'), close: () => { if (typeof closeFormationModal === 'function') closeFormationModal(); } },
        { id: 'squadNumberModal', active: (el) => el.classList.contains('active'), close: () => { if (typeof closeSquadNumberModal === 'function') closeSquadNumberModal(); } },
        { id: 'authModal', active: (el) => el.classList.contains('active'), close: () => { if (typeof closeAuthModal === 'function') closeAuthModal(); } },
        { id: 'levelRewardModal', active: (el) => el.classList.contains('active'), close: () => { if (typeof closeLevelRewardModal === 'function') closeLevelRewardModal(); } },
        { id: 'friendlyMatchModal', active: (el) => el.style.display === 'flex' || el.classList.contains('active'), close: () => { if (typeof closeFriendlyMatchModal === 'function') closeFriendlyMatchModal(); } },
        { id: 'friendlyCloseModal', active: (el) => el.style.display === 'flex' || el.classList.contains('active'), close: () => { if (typeof closeFriendlyCloseModal === 'function') closeFriendlyCloseModal(); } },
        { id: 'revealModal', active: (el) => el.classList.contains('active'), close: () => { if (typeof closeRevealModal === 'function') closeRevealModal(); } },
        { id: 'updateLogModal', active: (el) => el.classList.contains('active'), close: () => { if (typeof closeUpdateLogModal === 'function') closeUpdateLogModal(); } },
        { id: 'advisorModal', active: (el) => el.classList.contains('active'), close: () => { if (typeof closeCoachAdvisorModal === 'function') closeCoachAdvisorModal(); } },
        { id: 'hardModeExplainModal', active: (el) => el.classList.contains('active') || el.style.display === 'flex', close: () => { if (typeof closeHardModeExplainModal === 'function') closeHardModeExplainModal(); } },
        { id: 'hardModeEntryModal', active: (el) => el.classList.contains('active') || el.style.display === 'flex', close: () => { if (typeof closeHardModeEntryModal === 'function') closeHardModeEntryModal(); } },
        { id: 'achievementDetailModal', active: (el) => el.style.display === 'flex' || el.classList.contains('active'), close: () => { if (typeof closeAchievementModal === 'function') closeAchievementModal(); } }
    ];

    for (const m of modals) {
        const el = document.getElementById(m.id);
        if (el && m.active(el)) {
            m.close();
            return true;
        }
    }
    return false;
}

function openUpdateLogModal() {
    const modal = document.getElementById('updateLogModal');
    if (modal) modal.classList.add('active');
}

function closeUpdateLogModal() {
    const modal = document.getElementById('updateLogModal');
    if (modal) modal.classList.remove('active');
}

// ==========================================================================
// HARD MODE SYSTEM & SUB-TABS MANAGEMENT
// ==========================================================================

// 명예의 전당 하위 탭 전환
function switchFameSubTab(subTabName) {
    if (subTabName === 'hard' && !isHardMode) {
        openHardModeExplainModal();
        return;
    }
    
    if (subTabName === 'hell') {
        alert("준비중인 기능입니다!");
        return;
    }

    
    // active 탭 클래스 처리
    const btns = document.querySelectorAll('.fame-sub-btn');
    btns.forEach(btn => {
        if (btn.id === 'fameSubTab' + subTabName.charAt(0).toUpperCase() + subTabName.slice(1)) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    // layout 뷰 토글
    const layouts = ['Normal', 'Hard', 'Hell', 'Achievements'];
    layouts.forEach(l => {
        const layoutEl = document.getElementById('fameLayout' + l);
        if (layoutEl) {
            if (l.toLowerCase() === subTabName.toLowerCase()) {
                layoutEl.style.display = 'block';
                layoutEl.classList.add('active');
            } else {
                layoutEl.style.display = 'none';
                layoutEl.classList.remove('active');
            }
        }
    });
    
    if (subTabName === 'normal') {
        renderHallOfFameSub('normal');
    } else if (subTabName === 'hard') {
        renderHallOfFameSub('hard');
    } else if (subTabName === 'achievements') {
        if (typeof renderAchievements === 'function') {
            renderAchievements();
        }
    }

    
    if (typeof playClickSound === 'function') {
        try { playClickSound(); } catch (e) {}
    }
}

// 어려움 모드 안내 모달 제어 함수군
function openHardModeExplainModal() {
    const modal = document.getElementById('hardModeExplainModal');
    if (modal) {
        modal.style.display = 'flex';
        modal.classList.add('active');
    }
}

function closeHardModeExplainModal() {
    const modal = document.getElementById('hardModeExplainModal');
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('active');
    }
}

function proceedToHardModeEntry() {
    closeHardModeExplainModal();
    openHardModeEntryModal();
}

// 어려움 진입 모달 오픈
function openHardModeEntryModal() {
    const modal = document.getElementById('hardModeEntryModal');
    if (!modal) return;
    
    // 현재 포메이션에 배치된 선수들 추출
    const squadCardIds = Object.values(squadFormation).filter(id => id);
    
    if (squadCardIds.length < 11) {
        alert("포메이션에 11명의 선수가 모두 배치되어 있어야 어려움 모드에 진입할 수 있습니다.\n포메이션 메뉴에서 선수를 모두 기용해주세요.");
        return;
    }
    
    // squadCardIds의 중복 제거 및 유효성 검사
    const uniqueIds = Array.from(new Set(squadCardIds));
    if (uniqueIds.length < 11) {
        alert("포메이션에 중복된 선수가 기용되어 있습니다. 11명의 서로 다른 선수를 기용해주세요.");
        return;
    }
    
    modal.style.display = 'flex';
    modal.classList.add('active');
    
    // HTML 목록 그리기
    const listEl = document.getElementById('hardModeSquadList');
    if (listEl) {
        listEl.innerHTML = '';
        uniqueIds.forEach(cardId => {
            const cardObj = playerDeck[cardId];
            if (!cardObj) return;
            
            const cardData = cardObj.card;
            const awakeningText = cardObj.awakening > 0 ? ` (+${cardObj.awakening})` : '';
            
            listEl.innerHTML += `
                <label style="display: flex; align-items: center; justify-content: space-between; background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); padding: 0.65rem 1rem; border-radius: 12px; cursor: pointer; transition: all 0.2s;" class="hard-mode-checkbox-label">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <input type="checkbox" name="hardModeSquadCards" value="${cardId}" onchange="onHardModeCardSelectChange()" style="width: 18px; height: 18px; cursor: pointer; accent-color: #ff3e6c;">
                        <span style="font-size: 0.9rem; font-weight: 700; color: #fff;">${cardData.name} (${cardData.position})${awakeningText}</span>
                    </div>
                    <span style="font-size: 0.8rem; font-weight: 800; color: #ffd700;">OVR ${cardData.rating + (cardObj.awakening * 2)}</span>
                </label>
            `;
        });
    }
    
    // 드롭다운 초기화
    updateHardModeTargetSelect([]);
}

// 체크박스 선택 변경 핸들러
function onHardModeCardSelectChange() {
    const checkedBoxes = document.querySelectorAll('input[name="hardModeSquadCards"]:checked');
    const selectedIds = Array.from(checkedBoxes).map(cb => cb.value);
    
    // 스타일 업데이트 (선택된 항목 테두리 강조)
    const labels = document.querySelectorAll('.hard-mode-checkbox-label');
    labels.forEach(label => {
        const cb = label.querySelector('input[type="checkbox"]');
        if (cb && cb.checked) {
            label.style.borderColor = '#ff3e6c';
            label.style.background = 'rgba(255, 62, 108, 0.05)';
        } else {
            label.style.borderColor = 'rgba(255, 255, 255, 0.08)';
            label.style.background = 'rgba(255, 255, 255, 0.03)';
        }
    });

    // 선택 제한 (최대 3명)
    if (selectedIds.length > 3) {
        alert("최대 3명의 선수만 선택할 수 있습니다.");
        // 가장 마지막에 선택된 것 취소
        const lastChecked = checkedBoxes[checkedBoxes.length - 1];
        if (lastChecked) {
            lastChecked.checked = false;
            // 강제로 트리거
            onHardModeCardSelectChange();
            return;
        }
    }
    
    updateHardModeTargetSelect(selectedIds);
}

// 6강화 타겟 드롭다운 갱신
function updateHardModeTargetSelect(selectedIds) {
    const selectEl = document.getElementById('hardModeTargetCard');
    if (!selectEl) return;
    
    if (selectedIds.length === 0) {
        selectEl.innerHTML = '<option value="">이적할 선수를 먼저 선택하세요</option>';
        return;
    }
    
    selectEl.innerHTML = '<option value="">★6 각성 강화 보상을 받을 선수 선택 (1명)</option>';
    selectedIds.forEach(cardId => {
        const cardObj = playerDeck[cardId];
        if (cardObj) {
            selectEl.innerHTML += `<option value="${cardId}">${cardObj.card.name}</option>`;
        }
    });
}

// 어려움 모드 진입 모달 닫기
function closeHardModeEntryModal() {
    const modal = document.getElementById('hardModeEntryModal');
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('active');
    }
}

// 어려움 모드 최종 진입 완료 처리
function submitHardModeEntry() {
    const checkedBoxes = document.querySelectorAll('input[name="hardModeSquadCards"]:checked');
    const selectedIds = Array.from(checkedBoxes).map(cb => cb.value);
    
    if (selectedIds.length !== 3) {
        alert("어려움 모드에 진입하기 위해 정확히 3명의 선수를 선택하셔야 합니다.");
        return;
    }
    
    const targetCardId = document.getElementById('hardModeTargetCard').value;
    if (!targetCardId) {
        alert("★6 각성 혜택을 적용할 선수를 1명 선택해주세요.");
        return;
    }
    
    const confirmFinal = confirm(
        "정말로 어려움 모드에 진입하시겠습니까?\n\n" +
        "[주의 및 규칙 확인]\n" +
        "- 선택한 3명 이외의 모든 카드와 리그/컵/아챔 성적이 전면 리셋됩니다.\n" +
        "- 지정하신 1명의 선수가 ★6 각성(최종 강화) 상태로 지급됩니다.\n" +
        "- 진입 선물 보너스로 10 FP 및 월드클래스 '리오넬 메시' 카드가 지급됩니다.\n" +
        "- 승리가 약간 어려워집니다 (공격 찬스 확률 -5%).\n" +
        "- 단어 퀴즈 클리어 시 2포인트를 줍니다.\n\n" +
        "이대로 어려움 모드를 시작하시겠습니까?"
    );
    if (!confirmFinal) return;
    
    // 1. 덱 필터링 (선택된 3명 제외 삭제)
    const newDeck = {};
    selectedIds.forEach(cardId => {
        if (playerDeck[cardId]) {
            newDeck[cardId] = playerDeck[cardId];
        }
    });
    playerDeck = newDeck;
    
    // 2. 1명 ★6 강화 혜택 적용
    if (playerDeck[targetCardId]) {
        playerDeck[targetCardId].awakening = 6;
        playerDeck[targetCardId].quantity = 1;
    }
    
    // 2.5. 어려움 모드 진입 보상으로 월드 클래스 카드(리오넬 메시) 지급
    const messiId = "lionel_messi";
    if (typeof CARDS_DATABASE !== 'undefined' && CARDS_DATABASE[messiId]) {
        playerDeck[messiId] = {
            card: CARDS_DATABASE[messiId],
            quantity: 1,
            awakening: 0
        };
    }
    
    // 3. 포메이션 초기화 (3명 제외 포지션 비우기)
    Object.keys(squadFormation).forEach(pos => {
        const currentId = squadFormation[pos];
        if (currentId && !selectedIds.includes(currentId)) {
            delete squadFormation[pos];
        }
    });
    
    // squadFormations의 모든 포메이션도 동일하게 3명 제외하고 제거 처리
    if (typeof squadFormations === 'object') {
        Object.keys(squadFormations).forEach(fKey => {
            const form = squadFormations[fKey];
            if (form && typeof form === 'object') {
                Object.keys(form).forEach(pos => {
                    const id = form[pos];
                    if (id && !selectedIds.includes(id)) {
                        delete form[pos];
                    }
                });
            }
        });
    }
    
    // 4. 모드 전환 및 진입 선물 10 FP 지급
    isHardMode = true;
    if (typeof userPoints !== 'undefined') {
        userPoints += 10;
    } else {
        userPoints = 10;
    }
    
    // 5. 진행 상태 초기화 (시즌 리셋)
    leagueRound = 1;
    if (typeof resetLeagueSeasonState === 'function') {
        resetLeagueSeasonState();
    } else {
        // Fallback
        initLeague();
    }
    
    // 컵, 아챔 로컬 저장 데이터 클리어
    try {
        localStorage.removeItem('fc_star_cup_state');
        localStorage.removeItem('fc_star_acl_state');
        if (typeof initCup === 'function') initCup();
        if (typeof initAcl === 'function') initAcl();
    } catch(e) {}
    
    // 6. LocalStorage 동기화
    try {
        localStorage.setItem('fc_star_is_hard_mode', 'true');
        localStorage.setItem('fc_star_player_deck', JSON.stringify(playerDeck));
        localStorage.setItem('fc_star_squad_formations', JSON.stringify(squadFormations));
        localStorage.setItem('fc_star_squad_formation', JSON.stringify(squadFormation));
        localStorage.setItem('fc_star_league_round', '1');
        localStorage.setItem('fc_star_user_points', userPoints.toString());
    } catch(e) {}
    
    // 7. 클라우드 백업
    if (typeof saveUserProgress === 'function') {
        saveUserProgress();
    }
    
    // 8. 모달 닫기
    closeHardModeEntryModal();
    
    // 9. UI 전면 리프레시
    renderUserPoints();
    updateTotalCardCount();
    renderDeck();
    renderSquadFormation();
    if (typeof syncJeonbukOvr === 'function') syncJeonbukOvr();
    if (typeof updateMatchPreviewBoard === 'function') updateMatchPreviewBoard();
    if (typeof renderLeagueTable === 'function') renderLeagueTable();
    if (typeof renderLeagueStats === 'function') renderLeagueStats();
    
    // 10. 명예의 전당 탭으로 전환하여 어려움 모드 탭 활성화 확인
    switchFameSubTab('hard');
    
    // 파티클 축하 효과
    if (typeof celebrateQuizSuccess === 'function') {
        celebrateQuizSuccess();
    }
    
    // 테마 후광(Glow) 갱신
    updateGlowTheme();
    
    alert(`🔥 어려움 모드가 시작되었습니다! 🔥\n★6 각성 강화 혜택, 진입 선물 10 FP, 그리고 월드클래스 '리오넬 메시' 카드가 지급되었습니다!\n주력 선수를 앞세워 리그 정상을 향해 도전해보세요!`);
}

// 어려움/지옥모드 상태에 따른 팀 엠블럼 후광(Glow) 테마 갱신 헬퍼
function updateGlowTheme() {
    if (typeof isHardMode !== 'undefined' && isHardMode) {
        document.body.classList.add('hard-mode');
        document.body.classList.remove('hell-mode');
    } else if (typeof isHellMode !== 'undefined' && isHellMode) {
        document.body.classList.add('hell-mode');
        document.body.classList.remove('hard-mode');
    } else {
        document.body.classList.remove('hard-mode');
        document.body.classList.remove('hell-mode');
    }
}