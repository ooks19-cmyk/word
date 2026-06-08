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
    
    // Auto restore active logged-in user session
    try {
        const savedUser = localStorage.getItem('fc_star_current_user');
        if (savedUser) {
            console.log("🔐 기존 로그인 세션 자동 복원 중... ID:", savedUser);
            setTimeout(async () => {
                try {
                    const userData = await dbService.getUserData(savedUser);
                    if (userData) {
                        currentUser = savedUser;
                        syncUserDataOnLogin(userData);
                        console.log("🟢 세션 복원 성공!");
                    } else {
                        localStorage.removeItem('fc_star_current_user');
                        openAuthModal(true); // 세션 복원 실패 시 강제 로그인
                    }
                } catch (err) {
                    if (err.message === "network_error") {
                        console.warn("⚠️ 네트워크 에러로 인해 로컬 오프라인 데이터로 로그인 세션을 복원합니다.");
                        currentUser = savedUser;
                        
                        // 로컬 캐시 데이터로 오프라인 상태 로드
                        if (typeof loadFriendlyMatchesState === 'function') {
                            loadFriendlyMatchesState();
                        }
                        
                        // UI 복원 및 렌더링 호출
                        if (typeof updateAuthBadgeUI === 'function') updateAuthBadgeUI();
                        if (typeof updateDevModeUI === 'function') updateDevModeUI();
                        
                        renderUserPoints();
                        updateTotalCardCount();
                        renderDeck();
                        renderSquadFormation();
                        if (typeof syncJeonbukOvr === 'function') syncJeonbukOvr();
                        if (typeof updateMatchPreviewBoard === 'function') updateMatchPreviewBoard();
                        if (typeof renderLeagueTable === 'function') renderLeagueTable();
                        if (typeof renderLeagueStats === 'function') renderLeagueStats();
                        if (typeof renderCareerStats === 'function') renderCareerStats();
                        
                        if (typeof showToast === 'function') {
                            showToast("⚠️ 오프라인 모드로 로그인 세션을 복원했습니다.");
                        }
                    } else {
                        console.error("세션 복원 중 알 수 없는 예외 발생:", err);
                        localStorage.removeItem('fc_star_current_user');
                        openAuthModal(true);
                    }
                }
            }, 100);
        } else {
            // 세션 기록이 없다면 즉시 전체화면을 가리는 강제 로그인 팝업 활성화!
            setTimeout(() => {
                openAuthModal(true);
            }, 200);
        }
    } catch(e) {
        console.warn("세션 복원 실패:", e);
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
        { id: 'updateLogModal', active: (el) => el.classList.contains('active'), close: () => { if (typeof closeUpdateLogModal === 'function') closeUpdateLogModal(); } }
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