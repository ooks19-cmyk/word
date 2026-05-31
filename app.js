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
        syncJeonbukOvr();
        updateMatchPreviewBoard();
        renderLeagueTable();
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
    }
    
    renderUserPoints(); // Ensure header points are sync'd
}

// 10. INITIALIZATION
document.addEventListener('DOMContentLoaded', () => {
    updateTotalCardCount();
    renderSquadFormation(); // Initialize squad pitch rendering
    initLeague();           // Initialize K League Standing & Fixtures
    renderUserPoints();     // Sync user gacha points on load
    // CARDS_DATABASE 포지션 유효성 검사 (ST, LW, RW, CM, CB, LB, RB, GK)
    try {
        const VALID_POSITIONS = ['ST', 'LW', 'RW', 'CM', 'CB', 'LB', 'RB', 'GK'];
        Object.keys(CARDS_DATABASE).forEach(cardId => {
            const card = CARDS_DATABASE[cardId];
            if (card && card.position && !VALID_POSITIONS.includes(card.position)) {
                console.error(`[FC STAR 포지션 제한 오류] 카드 ID '${cardId}' (${card.name})의 포지션 '${card.position}'은(는) 허용되지 않는 값입니다. 'ST, LW, RW, CM, CB, LB, RB, GK' 중 하나여야 합니다.`);
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
                const userData = await dbService.getUserData(savedUser);
                if (userData) {
                    currentUser = savedUser;
                    syncUserDataOnLogin(userData);
                    console.log("🟢 세션 복원 성공!");
                } else {
                    localStorage.removeItem('fc_star_current_user');
                    openAuthModal(true); // 세션 복원 실패 시 강제 로그인
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
});