/* js/realtime.js - 실시간 1대1 PvP 대결 제어 엔진 */

let currentPvpRoomId = null;
let isHostUser = false;
let pvpRoomListener = null;
let pvpMatchTimer = null;
let isPvpStatsRecorded = false; // 전적 저장 완료 감지 플래그 (Host/Guest 중복 기록 방지)
let isMatchSimulating = false; // 시뮬레이션 중복 격발 방지 잠금 플래그

let pvpMatchActiveDiff = 0;
const pvpMatchMinutes = [0, 15, 30, 45, 52, 63, 74, 82, 88, 90];
const pvpEventMins = [15, 45, 63, 82, 88];

// 친구 서브 탭 스위칭 함수
function switchFriendSubTab(tabName) {
    const infoTabBtn = document.getElementById('friendSubTabInfo');
    const pvpTabBtn = document.getElementById('friendSubTabPvP');
    const infoLayout = document.getElementById('friendLayoutInfo');
    const pvpLayout = document.getElementById('friendLayoutPvP');

    if (!infoTabBtn || !pvpTabBtn || !infoLayout || !pvpLayout) return;

    if (tabName === 'info') {
        infoTabBtn.classList.add('active');
        pvpTabBtn.classList.remove('active');
        infoLayout.style.display = 'flex';
        pvpLayout.style.display = 'none';
        
        // PvP 채널에서 이탈 시 리스너 클린업
        cleanupPvpMatch();
    } else if (tabName === 'pvp') {
        infoTabBtn.classList.remove('active');
        pvpTabBtn.classList.add('active');
        infoLayout.style.display = 'none';
        pvpLayout.style.display = 'block';
        
        initPvpTab();
    }
}

// PvP 탭 초기화 및 진입 환경 검사
function initPvpTab() {
    // 1. 로그인 여부 검사
    const myId = typeof currentUser === 'string' && currentUser ? currentUser : "";
    if (!myId) {
        showToast("⚠️ 실시간 PvP 대결은 계정 로그인 상태에서만 가동할 수 있습니다.");
        switchFriendSubTab('info');
        // 로그인 모달 강제 팝업 유도
        if (typeof toggleAuthModal === 'function') toggleAuthModal();
        return;
    }

    // 2. Firebase Firestore 활성화 체크
    if (!window.dbService || !window.dbService.isFirebase) {
        showToast("⚠️ 온라인 연결 상태(Firebase)가 아닙니다. 실시간 대결이 불가능합니다.");
        switchFriendSubTab('info');
        return;
    }

    // 화면 뷰 초기화
    document.getElementById('pvpSetupView').style.display = 'flex';
    document.getElementById('pvpLobbyView').style.display = 'none';
    document.getElementById('pvpMatchView').style.display = 'none';

    // 인풋 필드 클리어
    const codeInput = document.getElementById('pvpRoomCodeInput');
    if (codeInput) codeInput.value = "";
    
    isPvpStatsRecorded = false;
    cleanupPvpMatch();
    
    // 상대 전적 렌더링 호출
    if (typeof renderPvpOpponentStats === 'function') {
        renderPvpOpponentStats();
    }
}

// 헬퍼: 스쿼드 내 OVR이 가장 높은 에이스 카드 이름 검출
function getSquadAcePlayerName(formation, deck) {
    if (!formation || typeof formation !== 'object') return "에이스 선수";
    let maxRating = 0;
    let bestPlayerName = "핵심 선수";
    
    Object.values(formation).forEach(cardId => {
        if (cardId && typeof CARDS_DATABASE !== 'undefined' && CARDS_DATABASE[cardId]) {
            const card = CARDS_DATABASE[cardId];
            let rating = card.rating;
            // 강화 단계 반영
            if (deck && deck[cardId] && typeof deck[cardId].awakening === 'number') {
                rating += deck[cardId].awakening;
            }
            if (rating > maxRating) {
                maxRating = rating;
                bestPlayerName = `${card.name} (${card.position})`;
            }
        }
    });
    return bestPlayerName;
}

// [Host] 대결 방 개설 처리
async function handleCreatePvpRoom() {
    const myId = typeof currentUser === 'string' && currentUser ? currentUser : "ooks";
    
    // 6자리 대결용 난수 코드 생성
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // 호스트 스쿼드 OVR 및 카드 데이터 종합
    const myOvr = getPlayerPureOvr() + getPlayerFormationTacticBonuses().formationBonus;
    const aceName = getSquadAcePlayerName(squadFormation, playerDeck);
    
    const squadData = {
        ovr: myOvr,
        squad: squadFormation,
        playerDeck: playerDeck,
        wingerStyles: wingerStyles[currentFormation] || { LW: 'dribble', RW: 'sprint' },
        strikerStyles: strikerStyles[currentFormation] || { ST: 'targetman' }
    };

    showToast("방을 개설하는 중...");
    try {
        await window.dbService.createPvpRoom(code, myId, squadData, currentFormation);
        
        currentPvpRoomId = code;
        isHostUser = true;

        // UI 셋업
        document.getElementById('pvpSetupView').style.display = 'none';
        document.getElementById('pvpLobbyView').style.display = 'flex';
        document.getElementById('pvpLobbyRoomCodeLabel').innerText = `방 코드: ${code}`;
        
        // 버튼 셋업
        document.getElementById('btnPvpHostStart').style.display = 'block';
        document.getElementById('btnPvpHostStart').disabled = true; // 게스트 대기
        document.getElementById('btnPvpGuestReady').style.display = 'none';

        // 실시간 채널 수신 감지 시작
        startPvpRoomListener(code);
    } catch (err) {
        showToast("방 개설 실패: " + err.message);
    }
}

// [Guest] 대결 방 입장 처리
async function handleJoinPvpRoom() {
    const codeInput = document.getElementById('pvpRoomCodeInput');
    if (!codeInput) return;
    
    const code = codeInput.value.trim();
    if (code.length !== 6 || isNaN(code)) {
        showToast("⚠️ 유효한 6자리 방 코드를 입력하세요.");
        return;
    }

    const myId = typeof currentUser === 'string' && currentUser ? currentUser : "ooks";
    
    // 게스트 스쿼드 OVR 및 카드 데이터 종합
    const myOvr = getPlayerPureOvr() + getPlayerFormationTacticBonuses().formationBonus;
    
    const squadData = {
        ovr: myOvr,
        squad: squadFormation,
        playerDeck: playerDeck,
        wingerStyles: wingerStyles[currentFormation] || { LW: 'dribble', RW: 'sprint' },
        strikerStyles: strikerStyles[currentFormation] || { ST: 'targetman' }
    };

    showToast("대결 방에 입장하는 중...");
    try {
        await window.dbService.joinPvpRoom(code, myId, squadData, currentFormation);
        
        currentPvpRoomId = code;
        isHostUser = false;

        // UI 셋업
        document.getElementById('pvpSetupView').style.display = 'none';
        document.getElementById('pvpLobbyView').style.display = 'flex';
        document.getElementById('pvpLobbyRoomCodeLabel').innerText = `방 코드: ${code}`;

        // 버튼 셋업
        document.getElementById('btnPvpHostStart').style.display = 'none';
        document.getElementById('btnPvpGuestReady').style.display = 'block';
        document.getElementById('btnPvpGuestReady').classList.remove('pvp-btn-gray');
        document.getElementById('btnPvpGuestReady').classList.add('pvp-btn-green');
        document.getElementById('btnPvpGuestReady').innerHTML = `<i class="fa-solid fa-check"></i> 준비 완료`;

        // 실시간 채널 수신 감지 시작
        startPvpRoomListener(code);
    } catch (err) {
        showToast("입장 실패: " + err.message);
    }
}

// 대기실 내 포메이션 선택 및 OVR 실시간 동기화 업데이트
async function changePvpFormation(isHost, formationName) {
    if (!currentPvpRoomId) return;
    
    // 1. 내 전역 포메이션 정보 변경 및 OVR 재평가
    currentFormation = formationName;
    
    // UI 로컬 OVR 업데이트
    if (typeof syncJeonbukOvr === 'function') {
        syncJeonbukOvr();
    }
    
    // 변경된 스쿼드 데이터 조립
    const myOvr = getPlayerPureOvr() + getPlayerFormationTacticBonuses().formationBonus;
    const squadData = {
        ovr: myOvr,
        squad: squadFormation,
        playerDeck: playerDeck,
        wingerStyles: wingerStyles[formationName] || { LW: 'dribble', RW: 'sprint' },
        strikerStyles: strikerStyles[formationName] || { ST: 'targetman' }
    };
    
    // 2. Firestore 방 정보에 즉시 동기화 전송
    await window.dbService.updatePvpRoomTactic(currentPvpRoomId, isHost, squadData, formationName);
}

// [Guest] 준비 완료 토글 처리
let guestReadyState = false;
async function handleToggleGuestReady() {
    if (!currentPvpRoomId) return;
    
    const btn = document.getElementById('btnPvpGuestReady');
    guestReadyState = !guestReadyState;
    
    if (guestReadyState) {
        btn.classList.remove('pvp-btn-green');
        btn.classList.add('pvp-btn-gray');
        btn.innerHTML = `<i class="fa-solid fa-xmark"></i> 준비 취소`;
    } else {
        btn.classList.remove('pvp-btn-gray');
        btn.classList.add('pvp-btn-green');
        btn.innerHTML = `<i class="fa-solid fa-check"></i> 준비 완료`;
    }
    
    await window.dbService.setPvpGuestReady(currentPvpRoomId, guestReadyState);
}

// [Host] 대결 경기 개시 시작
async function handleStartPvpMatch() {
    if (!currentPvpRoomId || !isHostUser) return;
    
    showToast("대결 경기가 시작됩니다!");
    await window.dbService.startPvpMatch(currentPvpRoomId);
}

// Firestore 실시간 리스너 작동 (대기실 & 경기 상태 실시간 업데이트)
function startPvpRoomListener(roomId) {
    if (pvpRoomListener) pvpRoomListener(); // 기존 리스너 해제
    
    const myId = typeof currentUser === 'string' && currentUser ? currentUser : "";
    
    pvpRoomListener = window.dbService.firestore.collection('fc_star_rooms').doc(roomId)
        .onSnapshot(doc => {
            if (!doc.exists) {
                // 방 폭파(호스트가 나감) 감지
                cleanupPvpMatch();
                showToast("⚠️ 호스트가 방을 나가 대결 방이 파괴되었습니다.");
                initPvpTab();
                return;
            }
            
            const room = doc.data();
            
            // 1. 호스트 정보 카드 렌더링
            const hostInfo = room.host;
            document.getElementById('pvpHostNameLabel').innerText = hostInfo.id.toUpperCase();
            document.getElementById('pvpHostOvrLabel').innerText = `OVR ${hostInfo.ovr}`;
            
            // 호스트 대표 에이스 계산
            const hostAce = getSquadAcePlayerName(hostInfo.squad, hostInfo.playerDeck);
            document.getElementById('pvpHostAceLabel').innerText = hostAce;
            
            // 호스트 포메이션 제어: 본인에겐 셀렉트 박스, 게스트에겐 비공개 처리
            const hostSelect = document.getElementById('pvpHostFormationSelect');
            const hostMasked = document.getElementById('pvpHostFormationMasked');
            if (isHostUser) {
                hostSelect.style.display = 'block';
                hostSelect.value = hostInfo.formation;
                hostMasked.style.display = 'none';
            } else {
                hostSelect.style.display = 'none';
                hostMasked.style.display = 'inline-flex'; // ???? 비공개!
            }
            
            // 2. 게스트 정보 카드 렌더링
            const guestInfo = room.guest;
            const guestCard = document.getElementById('pvpLobbyGuestCard');
            const guestContent = document.getElementById('pvpGuestBoxContent');
            const guestPlaceholder = document.getElementById('pvpGuestBoxPlaceholder');
            
            if (guestInfo) {
                // 게스트 들어옴
                guestCard.classList.remove('waiting-active');
                guestPlaceholder.style.display = 'none';
                guestContent.style.display = 'flex';
                
                document.getElementById('pvpGuestNameLabel').innerText = guestInfo.id.toUpperCase();
                document.getElementById('pvpGuestOvrLabel').innerText = `OVR ${guestInfo.ovr}`;
                
                // 게스트 대표 에이스 계산
                const guestAce = getSquadAcePlayerName(guestInfo.squad, guestInfo.playerDeck);
                document.getElementById('pvpGuestAceLabel').innerText = guestAce;
                
                // 게스트 포메이션 제어: 본인에겐 셀렉트 박스, 호스트에겐 비공개 처리
                const guestSelect = document.getElementById('pvpGuestFormationSelect');
                const guestMasked = document.getElementById('pvpGuestFormationMasked');
                if (!isHostUser) {
                    guestSelect.style.display = 'block';
                    guestSelect.value = guestInfo.formation;
                    guestMasked.style.display = 'none';
                } else {
                    guestSelect.style.display = 'none';
                    guestMasked.style.display = 'inline-flex'; // ???? 비공개!
                }
                
                // 게스트 레디 상태 동기화
                const readyBadgeContainer = document.getElementById('pvpGuestReadyBadgeContainer');
                if (room.guestReady) {
                    guestCard.classList.add('ready-active');
                    readyBadgeContainer.style.display = 'flex';
                } else {
                    guestCard.classList.remove('ready-active');
                    readyBadgeContainer.style.display = 'none';
                }
                
                // 호스트 대결 시작 버튼 활성화 여부
                if (isHostUser) {
                    const hostStartBtn = document.getElementById('btnPvpHostStart');
                    if (room.guestReady) {
                        hostStartBtn.disabled = false;
                        hostStartBtn.style.opacity = '1';
                        hostStartBtn.style.pointerEvents = 'auto';
                    } else {
                        hostStartBtn.disabled = true;
                        hostStartBtn.style.opacity = '0.5';
                        hostStartBtn.style.pointerEvents = 'none';
                    }
                }
            } else {
                // 게스트 대기 중
                guestCard.classList.remove('ready-active');
                guestCard.classList.add('waiting-active');
                guestContent.style.display = 'none';
                guestPlaceholder.style.display = 'block';
                if (isHostUser) {
                    document.getElementById('btnPvpHostStart').disabled = true;
                }
            }
            
            // 3. 실시간 경기 진행 상태 체크
            if (room.status === 'waiting' || room.status === 'ready') {
                // 중계창 닫고 대기실 열기
                document.getElementById('pvpSetupView').style.display = 'none';
                document.getElementById('pvpLobbyView').style.display = 'flex';
                document.getElementById('pvpMatchView').style.display = 'none';
                
                // 재대결 전적 저장을 위해 기록 완료 플래그 리셋
                isPvpStatsRecorded = false;
                isMatchSimulating = false; // 대기실 상태로 돌아왔으므로 잠금 해제
            } else if (room.status === 'playing') {
                // 대기실 닫고 중계창 열기
                document.getElementById('pvpLobbyView').style.display = 'none';
                document.getElementById('pvpMatchView').style.display = 'flex';
                document.getElementById('pvpMatchControls').style.display = 'none';
                
                // 스코어보드 팀 정보 설정 (상성이 공개되므로 뱃지에 포메이션 출력!)
                document.getElementById('pvpHomeName').innerText = hostInfo.id.toUpperCase();
                document.getElementById('pvpHomeOvr').innerText = hostInfo.ovr;
                document.getElementById('pvpHomeFormationBadge').innerText = hostInfo.formation;
                
                document.getElementById('pvpAwayName').innerText = guestInfo.id.toUpperCase();
                document.getElementById('pvpAwayOvr').innerText = guestInfo.ovr;
                document.getElementById('pvpAwayFormationBadge').innerText = guestInfo.formation;
                
                // 포메이션 상성 문구 출력
                const compBonus = getFormationCompatibilityBonus(hostInfo.formation, guestInfo.formation);
                const compLabel = document.getElementById('pvpMatchCompatibilityLabel');
                if (compBonus > 0) {
                    compLabel.innerHTML = `🛡️ <strong>${hostInfo.id.toUpperCase()}</strong> 포메이션 상성 우세 (+5% 찬스)`;
                } else if (compBonus < 0) {
                    compLabel.innerHTML = `🛡️ <strong>${guestInfo.id.toUpperCase()}</strong> 포메이션 상성 우세 (+5% 찬스)`;
                } else {
                    compLabel.innerHTML = `⚖️ 포메이션 상성 팽팽함 (변동 없음)`;
                }
                
                // Host, Guest 공통으로 실시간 중계 화면 리스너 가동
                renderPvpMatchState(room.matchState);
                
                if (isHostUser) {
                    // Host이고 타이머가 작동 안하고 있으면 격발
                    if (!pvpMatchTimer) {
                        startPvpMatchSimulation(roomId, room);
                    }
                }
            } else if (room.status === 'finished') {
                // 경기 종료 상태
                isMatchSimulating = false; // 경기 종료 상태 감지 즉시 잠금 해제
                renderPvpMatchState(room.matchState);
                document.getElementById('pvpMatchControls').style.display = 'flex';
                document.getElementById('pvpLiveIndicator').style.display = 'none';
                document.getElementById('pvpSbTime').classList.remove('pvp-live-pulse');
                document.getElementById('pvpSbTime').innerText = "FT";
                
                // 전적 기록 및 세이브 격발 (Host/Guest 공통)
                if (!isPvpStatsRecorded && room.matchState) {
                    isPvpStatsRecorded = true;
                    const hostScoreVal = room.matchState.hostScore || 0;
                    const guestScoreVal = room.matchState.guestScore || 0;
                    const psoWinner = room.matchState.psoWinner || null;
                    
                    let myResult = "d";
                    let opponentId = "opponent";
                    
                    if (psoWinner) {
                        if (isHostUser) {
                            myResult = psoWinner === 'host' ? 'w' : 'l';
                            opponentId = (room.guest && room.guest.id) ? room.guest.id : "guest";
                        } else {
                            myResult = psoWinner === 'guest' ? 'w' : 'l';
                            opponentId = (room.host && room.host.id) ? room.host.id : "host";
                        }
                    } else {
                        if (isHostUser) {
                            myResult = hostScoreVal > guestScoreVal ? "w" : (hostScoreVal < guestScoreVal ? "l" : "d");
                            opponentId = (room.guest && room.guest.id) ? room.guest.id : "guest";
                        } else {
                            myResult = guestScoreVal > hostScoreVal ? "w" : (guestScoreVal < hostScoreVal ? "l" : "d");
                            opponentId = (room.host && room.host.id) ? room.host.id : "host";
                        }
                    }
                    
                    recordPvpStatsAndSave(myResult, opponentId);
                }

                // 재대결 버튼 및 라벨 렌더링
                const gameCount = room.gameCount || 1;
                const rematchInfoEl = document.getElementById('pvpRematchInfo');
                const guestRematchBtn = document.getElementById('btnPvpGuestRematch');
                const hostRematchBtn = document.getElementById('btnPvpHostRematch');
                
                if (rematchInfoEl) {
                    rematchInfoEl.innerText = `[${gameCount} / 3 게임 진행 완료]`;
                }

                if (gameCount < 3) {
                    if (!isHostUser) {
                        // 게스트 브라우저
                        if (guestRematchBtn) {
                            guestRematchBtn.style.display = 'block';
                            if (room.guestRematchReady) {
                                guestRematchBtn.disabled = true;
                                guestRematchBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> 수락 대기 중...`;
                                guestRematchBtn.classList.remove('pvp-btn-green');
                                guestRematchBtn.classList.add('pvp-btn-gray');
                            } else {
                                guestRematchBtn.disabled = false;
                                guestRematchBtn.innerHTML = `<i class="fa-solid fa-arrows-rotate"></i> 재대결 신청`;
                                guestRematchBtn.classList.remove('pvp-btn-gray');
                                guestRematchBtn.classList.add('pvp-btn-green');
                            }
                        }
                        if (hostRematchBtn) hostRematchBtn.style.display = 'none';
                    } else {
                        // 호스트 브라우저
                        if (hostRematchBtn) {
                            hostRematchBtn.style.display = 'block';
                            if (room.guestRematchReady) {
                                hostRematchBtn.disabled = false;
                                hostRematchBtn.style.opacity = '1';
                                hostRematchBtn.style.pointerEvents = 'auto';
                            } else {
                                hostRematchBtn.disabled = true;
                                hostRematchBtn.style.opacity = '0.5';
                                hostRematchBtn.style.pointerEvents = 'none';
                            }
                        }
                        if (guestRematchBtn) guestRematchBtn.style.display = 'none';
                    }
                } else {
                    // 3경기 종료
                    if (rematchInfoEl) {
                        rematchInfoEl.innerText = `[3 / 3 게임 대결 완료] 재대결 불가`;
                    }
                    if (guestRematchBtn) guestRematchBtn.style.display = 'none';
                    if (hostRematchBtn) hostRematchBtn.style.display = 'none';
                }
            }
        });
}

// 태그 보존형 고속 타이핑 효과 헬퍼
function typewriterEffect(element, prefix, fullHtml) {
    element.innerHTML = prefix;
    const span = document.createElement('span');
    element.appendChild(span);
    
    let index = 0;
    let currentHTML = "";
    
    if (element.dataset.typingTimer) {
        clearInterval(parseInt(element.dataset.typingTimer));
    }
    
    const timer = setInterval(() => {
        if (index >= fullHtml.length) {
            clearInterval(timer);
            element.removeAttribute('data-typing-timer');
            span.innerHTML = fullHtml; // 최종 완전 렌더링
            const commBox = document.getElementById('pvpCommentaryScroll');
            if (commBox) commBox.scrollTop = commBox.scrollHeight;
            return;
        }
        
        if (fullHtml[index] === '<') {
            const closeIdx = fullHtml.indexOf('>', index);
            if (closeIdx !== -1) {
                currentHTML += fullHtml.substring(index, closeIdx + 1);
                index = closeIdx + 1;
            } else {
                currentHTML += fullHtml[index];
                index++;
            }
        } else {
            currentHTML += fullHtml[index];
            index++;
        }
        
        span.innerHTML = currentHTML;
        const commBox = document.getElementById('pvpCommentaryScroll');
        if (commBox) commBox.scrollTop = commBox.scrollHeight;
    }, 15);
    
    element.setAttribute('data-typing-timer', timer.toString());
}

// 리스너가 들어오는 변경된 matchState 정보로 화면을 갱신하는 뷰어 함수 (특히 Guest 구동)
function renderPvpMatchState(matchState) {
    if (!matchState) return;
    
    // 점수 업데이트
    document.getElementById('pvpHomeScore').innerText = matchState.hostScore;
    document.getElementById('pvpAwayScore').innerText = matchState.guestScore;
    
    // 시간 표시
    const pvpSbTimeEl = document.getElementById('pvpSbTime');
    const liveIndicator = document.getElementById('pvpLiveIndicator');
    
    if (matchState.psoState) {
        // 승부차기(PSO) 중인 경우
        if (pvpSbTimeEl) {
            pvpSbTimeEl.innerText = "PSO";
            pvpSbTimeEl.classList.add('pvp-live-pulse');
        }
        if (liveIndicator) liveIndicator.style.display = 'inline-block';
        
        // 승부차기 O/X 현황 스코어보드 하단 상성 문구 자리에 강제 렌더링
        const compLabel = document.getElementById('pvpMatchCompatibilityLabel');
        if (compLabel) {
            const pso = matchState.psoState;
            const hKicks = pso.hostKicks.join(' ');
            const gKicks = pso.guestKicks.join(' ');
            compLabel.innerHTML = `⚽ <strong>승부차기 킥 전황</strong><br>Host [${pso.hostScore}] ${hKicks} vs Guest [${pso.guestScore}] ${gKicks}`;
        }
    } else {
        // 일반 경기 또는 연장전
        if (pvpSbTimeEl) {
            if (matchState.minute === 120) {
                pvpSbTimeEl.innerText = "120'";
            } else {
                pvpSbTimeEl.innerText = `${matchState.minute}'`;
            }
            if (matchState.minute > 0 && matchState.minute < 120) {
                pvpSbTimeEl.classList.add('pvp-live-pulse');
                if (liveIndicator) liveIndicator.style.display = 'inline-block';
            } else {
                pvpSbTimeEl.classList.remove('pvp-live-pulse');
            }
        }
    }
    
    // 문자 중계 박스 리스트 갱신
    const commBox = document.getElementById('pvpCommentaryScroll');
    if (commBox) {
        const currentCount = commBox.children.length;
        const events = matchState.eventsLog || [];
        
        if (events.length < currentCount) {
            commBox.innerHTML = "";
        }
        
        const startIdx = commBox.innerHTML === "" ? 0 : commBox.children.length;
        
        for (let i = startIdx; i < events.length; i++) {
            const evt = events[i];
            const item = document.createElement('div');
            item.className = `comm-item comm-${evt.type}`;
            const timestamp = evt.min === 'SYSTEM' || evt.min === 'FT' || evt.min === 'HT' || evt.min === 'HT_ET' || evt.min === 'FT_ET' || evt.min === '승부차기' ? '' : `<strong style="color:#ffd700; margin-right: 6px;">${evt.min}'</strong>`;
            
            if (i === events.length - 1) {
                const prevTypingItem = commBox.querySelector('[data-typing-timer]');
                if (prevTypingItem) {
                    const timerId = parseInt(prevTypingItem.getAttribute('data-typing-timer'));
                    if (timerId) clearInterval(timerId);
                    prevTypingItem.removeAttribute('data-typing-timer');
                    
                    const prevIdx = i - 1;
                    if (prevIdx >= 0) {
                        const prevEvt = events[prevIdx];
                        const prevTimestamp = prevEvt.min === 'SYSTEM' || prevEvt.min === 'FT' || prevEvt.min === 'HT' || prevEvt.min === 'HT_ET' || prevEvt.min === 'FT_ET' || prevEvt.min === '승부차기' ? '' : `<strong style="color:#ffd700; margin-right: 6px;">${prevEvt.min}'</strong>`;
                        prevTypingItem.innerHTML = `${prevTimestamp}${prevEvt.text}`;
                    }
                }
                
                commBox.appendChild(item);
                typewriterEffect(item, timestamp, evt.text);
            } else {
                item.innerHTML = `${timestamp}${evt.text}`;
                commBox.appendChild(item);
            }
        }
        
        commBox.scrollTop = commBox.scrollHeight;
    }
}

// PvP 전용 득점 확률 대칭 계산 엔진
function calculatePvpScoreProb(activeDiff, shootStat, oppGkStat, oppDefAvg, scoreBoost, suitBonus) {
    // 득점자 슛 스탯 vs 수비수 평균/골키퍼 OVR 격차
    const shooterBonus = Math.max(0, (shootStat - oppGkStat) * 0.01);
    const defBonus = Math.max(0, (oppDefAvg - 70) * 0.008); // 수비력이 높을수록 득점 확률 삭감
    
    const maxScoreProb = 0.50;
    const minScoreProb = 0.10;
    
    // 대칭형 기본 공식 대입
    const calculated = 0.24 + (activeDiff * 0.019) + scoreBoost + shooterBonus + suitBonus - defBonus;
    return Math.min(maxScoreProb, Math.max(minScoreProb, calculated));
}

// [Host 전용] 실시간 대결 시뮬레이션 타이머 및 연산 격발
function startPvpMatchSimulation(roomId, roomData) {
    if (pvpMatchTimer || isMatchSimulating) return;
    isMatchSimulating = true;
    
    const hostInfo = roomData.host;
    const guestInfo = roomData.guest;
    
    let hostScoreVal = 0;
    let guestScoreVal = 0;
    const eventsLogList = [];
    
    // 연장전 및 승부차기를 위한 상태 변수
    let isExtraTime = false;
    let isPenaltyShootout = false;
    const extraTimeMinutes = [91, 100, 105, 106, 115, 120];
    const extraEventMins = [100, 115];
    let extraTickIdx = 0;
    
    const psoState = {
        hostScore: 0,
        guestScore: 0,
        hostKicks: [],
        guestKicks: [],
        currentKicker: 'host',
        kickerIndex: 0
    };
    
    const addPvpCommentary = (min, text, type = 'normal') => {
        eventsLogList.push({ min, text, type });
        // 로컬 호스트 화면도 갱신
        const stateObj = {
            minute: isExtraTime ? 120 : (min === 'SYSTEM' || min === 'FT' || min === 'HT' || min === 'HT_ET' || min === 'FT_ET' || min === '승부차기' ? 90 : parseInt(min)),
            hostScore: hostScoreVal,
            guestScore: guestScoreVal,
            eventsLog: eventsLogList
        };
        if (isPenaltyShootout) {
            stateObj.psoState = psoState;
        }
        renderPvpMatchState(stateObj);
    };
    
    // 상성 비교에 따른 가중치
    const compVal = getFormationCompatibilityBonus(hostInfo.formation, guestInfo.formation);
    let hostTacticBonus = 0;
    if (compVal > 0) hostTacticBonus = 0.05;
    else if (compVal < 0) hostTacticBonus = -0.05;

    // 상대가 5-4-1일 때의 찬스 확률 2.5% 보너스 적용
    let host541Bonus = 0;
    if (guestInfo.formation === '5-4-1') {
        host541Bonus += 0.025; // 상대가 5-4-1이므로 호스트 찬스 2.5% 상승
    }
    if (hostInfo.formation === '5-4-1') {
        host541Bonus -= 0.025; // 호스트가 5-4-1이므로 상대(게스트) 찬스 2.5% 상승 (호스트 기준 -2.5%)
    }

    // OVR 격차
    const ovrDiff = hostInfo.ovr - guestInfo.ovr;
    
    // 호스트 기준 찬스 획득 확률 계산 (기본 50% + OVR 격차당 1% + 상성 가중치 5% + 상대 5-4-1 보너스 2.5%)
    const hostAttackProb = Math.min(0.80, Math.max(0.20, 0.50 + (ovrDiff * 0.01) + hostTacticBonus + host541Bonus));
    
    // 대칭형 매치 기초 정보 로깅
    addPvpCommentary('SYSTEM', `🏟️ <strong>1대1 실시간 대결 시작!</strong><br>[Host] ${hostInfo.id.toUpperCase()} (OVR ${hostInfo.ovr}) vs [Guest] ${guestInfo.id.toUpperCase()} (OVR ${guestInfo.ovr})`, 'system');
    addPvpCommentary('SYSTEM', `⚙️ 전술 OVR 격차에 따른 공격 찬스 비율<br>- ${hostInfo.id.toUpperCase()}: ${Math.round(hostAttackProb * 100)}% | ${guestInfo.id.toUpperCase()}: ${Math.round((1 - hostAttackProb) * 100)}%`, 'system');
    
    let tickIdx = 0;
    
    const finishPvpMatchSim = async (psoWinner = null) => {
        clearInterval(pvpMatchTimer);
        pvpMatchTimer = null;
        
        addPvpCommentary('FT', `삐- 삐- 삐--! 주심의 휘슬과 함께 양 구단의 뜨거운 실시간 혈투가 종료되었습니다!`, 'system');
        
        // 결과 정산 코멘터리
        let resultCommentary = "";
        let hostResult = "d"; // w: 승, d: 무, l: 패
        let guestResult = "d";
        
        if (psoWinner) {
            if (psoWinner === 'host') {
                resultCommentary = `🏆 승부차기 극적 승리!!! <strong>${hostInfo.id.toUpperCase()}</strong>가 승부차기 스코어 ${psoState.hostScore} - ${psoState.guestScore}로 최종 승리하며 대결을 제패합니다!`;
                hostResult = "w";
                guestResult = "l";
            } else {
                resultCommentary = `🏆 승부차기 극적 승리!!! <strong>${guestInfo.id.toUpperCase()}</strong>가 승부차기 스코어 ${psoState.guestScore} - ${psoState.hostScore}로 최종 승리하며 대결을 제패합니다!`;
                hostResult = "l";
                guestResult = "w";
            }
        } else {
            if (hostScoreVal > guestScoreVal) {
                resultCommentary = `🏆 승리!!! <strong>${hostInfo.id.toUpperCase()}</strong>가 전술 OVR 격차를 극복하고 승리를 차지합니다!`;
                hostResult = "w";
                guestResult = "l";
            } else if (hostScoreVal < guestScoreVal) {
                resultCommentary = `🏆 승리!!! <strong>${guestInfo.id.toUpperCase()}</strong>가 불굴의 조직력으로 적지에서 귀중한 승점의 승리를 가져갑니다!`;
                hostResult = "l";
                guestResult = "w";
            }
        }
        addPvpCommentary('FT', resultCommentary, 'system');
        
        // Firestore 최종 전적 반영 유도 및 status를 finished로 승격
        const matchStateData = {
            minute: isExtraTime || psoWinner ? 120 : 90,
            hostScore: hostScoreVal,
            guestScore: guestScoreVal,
            currentEvent: eventsLogList[eventsLogList.length - 1],
            eventsLog: eventsLogList
        };
        if (psoWinner) {
            matchStateData.psoState = psoState;
            matchStateData.psoWinner = psoWinner;
        }
        
        await window.dbService.firestore.collection('fc_star_rooms').doc(roomId).update({
            status: "finished",
            matchState: matchStateData,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
    };
    
    const runPvpTick = async () => {
        // [A] 승부차기 진행 중인 경우
        if (isPenaltyShootout) {
            const positions = ["ST", "LW", "RW", "CM", "LCM", "RCM", "LB", "LCB", "RCB", "RB", "GK"];
            const currKickerSide = psoState.currentKicker;
            const kickerIdx = psoState.kickerIndex; // 0, 1, 2, ...
            
            const activeTeam = currKickerSide === 'host' ? hostInfo : guestInfo;
            const defenderTeam = currKickerSide === 'host' ? guestInfo : hostInfo;
            
            // 키커 정보 로드
            const posKey = positions[kickerIdx % positions.length];
            const kickerId = activeTeam.squad[posKey];
            let kickerName = `${activeTeam.id.toUpperCase()} 선수 (${posKey})`;
            let kickerSho = 75;
            if (kickerId && CARDS_DATABASE[kickerId]) {
                const card = getAwakenedCard(kickerId, activeTeam.playerDeck);
                kickerName = card.name;
                kickerSho = card.stats.sho || card.rating || 75;
            }
            
            // 골키퍼 정보 로드
            const gkId = defenderTeam.squad["GK"];
            let gkName = `${defenderTeam.id.toUpperCase()} 골키퍼`;
            let gkDef = 70;
            if (gkId && CARDS_DATABASE[gkId]) {
                const card = getAwakenedCard(gkId, defenderTeam.playerDeck);
                gkName = card.name;
                gkDef = card.stats.def || card.rating || 70;
            }
            
            // 패널티킥 골 성공 확률 계산 (기본 75% 베이스)
            const psoProb = Math.min(0.92, Math.max(0.40, 0.75 + (kickerSho - gkDef) * 0.005));
            const isGoal = Math.random() < psoProb;
            
            if (currKickerSide === 'host') {
                psoState.hostKicks.push(isGoal ? 'O' : 'X');
                if (isGoal) psoState.hostScore++;
                addPvpCommentary('승부차기', `⚽ [PSO] [Host] ${kickerIdx + 1}번 키커 ${kickerName} 슛... ${isGoal ? '⚽ 골인! (O)' : `❌ ${gkName} 골키퍼 선방! (X)`}`, isGoal ? 'goal' : 'normal');
                psoState.currentKicker = 'guest';
            } else {
                psoState.guestKicks.push(isGoal ? 'O' : 'X');
                if (isGoal) psoState.guestScore++;
                addPvpCommentary('승부차기', `⚽ [PSO] [Guest] ${kickerIdx + 1}번 키커 ${kickerName} 슛... ${isGoal ? '⚽ 골인! (O)' : `❌ ${gkName} 골키퍼 선방! (X)`}`, isGoal ? 'goal' : 'normal');
                psoState.currentKicker = 'host';
                psoState.kickerIndex++; // 양 팀 다 찼으므로 키커 라운드 증가
            }
            
            // 승부 판정 조건
            const hKicksLen = psoState.hostKicks.length;
            const gKicksLen = psoState.guestKicks.length;
            const hScore = psoState.hostScore;
            const gScore = psoState.guestScore;
            
            let isPsoFinished = false;
            let psoWinner = null;
            
            if (hKicksLen === gKicksLen) {
                const roundNum = hKicksLen;
                if (roundNum <= 5) {
                    const remKicks = 5 - roundNum;
                    if (hScore > gScore + remKicks) {
                        isPsoFinished = true;
                        psoWinner = 'host';
                    } else if (gScore > hScore + remKicks) {
                        isPsoFinished = true;
                        psoWinner = 'guest';
                    } else if (roundNum === 5 && hScore === gScore) {
                        addPvpCommentary('승부차기', `📢 5번의 킥 이후에도 ${hScore} - ${gScore}로 동점! 승부차기는 서든데스 룰로 이행됩니다!`, 'system');
                    } else if (roundNum === 5 && hScore !== gScore) {
                        isPsoFinished = true;
                        psoWinner = hScore > gScore ? 'host' : 'guest';
                    }
                } else {
                    // 서든데스 (6회 이상)
                    if (hScore !== gScore) {
                        isPsoFinished = true;
                        psoWinner = hScore > gScore ? 'host' : 'guest';
                    }
                }
            } else {
                const roundNum = gKicksLen;
                if (roundNum < 5) {
                    const hostRemKicks = 5 - hKicksLen;
                    const guestRemKicks = 5 - gKicksLen;
                    if (hScore > gScore + guestRemKicks) {
                        isPsoFinished = true;
                        psoWinner = 'host';
                    } else if (gScore > hScore + hostRemKicks) {
                        isPsoFinished = true;
                        psoWinner = 'guest';
                    }
                }
            }
            
            const stateData = {
                minute: 120,
                hostScore: hostScoreVal,
                guestScore: guestScoreVal,
                psoState: psoState,
                currentEvent: eventsLogList[eventsLogList.length - 1],
                eventsLog: eventsLogList
            };
            await window.dbService.updatePvpMatchState(roomId, stateData);
            
            if (isPsoFinished) {
                isPenaltyShootout = false;
                finishPvpMatchSim(psoWinner);
            }
            return;
        }
        
        // [B] 연장전 진행 중인 경우
        if (isExtraTime) {
            const currentExtraMin = extraTimeMinutes[extraTickIdx];
            
            if (currentExtraMin === 91) {
                addPvpCommentary(90, "⏱️ 주심의 휘슬과 함께 연장 전반전 경기가 시작됩니다!", 'normal');
            } else if (extraEventMins.includes(currentExtraMin)) {
                // 찬스 획득 결정
                const isHostAttack = Math.random() < hostAttackProb;
                const attackerInfo = isHostAttack ? hostInfo : guestInfo;
                const defenderInfo = isHostAttack ? guestInfo : hostInfo;
                const attackerName = attackerInfo.id.toUpperCase();
                const defenderName = defenderInfo.id.toUpperCase();
                const activeDiff = isHostAttack ? ovrDiff : -ovrDiff;
                
                const attStId = attackerInfo.squad["ST"];
                let attStSho = 75;
                if (attStId && CARDS_DATABASE[attStId]) {
                    const card = getAwakenedCard(attStId, attackerInfo.playerDeck);
                    attStSho = getStrikerChanceStat('ST', card, attackerInfo.strikerStyles);
                }
                const defGkId = defenderInfo.squad["GK"];
                let defGkDef = 70;
                let defGkName = "상대 골키퍼";
                if (defGkId && CARDS_DATABASE[defGkId]) {
                    const card = getAwakenedCard(defGkId, defenderInfo.playerDeck);
                    defGkDef = card.stats.def || card.rating || 70;
                    defGkName = card.name;
                }
                const defDefAvg = getTeamAverageStat('def', defenderInfo.squad, defenderInfo.playerDeck);
                
                const attFormTactic = getPlayerFormationTacticBonuses(attackerInfo.formation, attackerInfo.squad, attackerInfo.playerDeck);
                const attDetailedTactic = getPlayerDetailedTacticBonuses(attackerInfo.formation, attackerInfo.squad, attackerInfo.playerDeck);
                const scoreBoost = attFormTactic.formationScoreBoost || 0;
                const suitabilityBonus = attDetailedTactic.suitabilityBonus || 0;
                
                const scoreProb = calculatePvpScoreProb(activeDiff, attStSho, defGkDef, defDefAvg, scoreBoost, suitabilityBonus);
                const isGoal = Math.random() < scoreProb;
                
                const activePlayers = {
                    ST: (attackerInfo.squad["ST"] && CARDS_DATABASE[attackerInfo.squad["ST"]]) ? CARDS_DATABASE[attackerInfo.squad["ST"]].name : "스트라이커",
                    LW: (attackerInfo.squad["LW"] && CARDS_DATABASE[attackerInfo.squad["LW"]]) ? CARDS_DATABASE[attackerInfo.squad["LW"]].name : "윙어",
                    RW: (attackerInfo.squad["RW"] && CARDS_DATABASE[attackerInfo.squad["RW"]]) ? CARDS_DATABASE[attackerInfo.squad["RW"]].name : "윙어",
                    CM: (attackerInfo.squad["CM"] && CARDS_DATABASE[attackerInfo.squad["CM"]]) ? CARDS_DATABASE[attackerInfo.squad["CM"]].name : "미드필더",
                    GK: defGkName
                };
                
                let option = 1;
                const randOpt = Math.random();
                if (attackerInfo.formation === '4-2-3-1') {
                    option = randOpt < 0.4 ? 5 : (randOpt < 0.7 ? 1 : (randOpt < 0.85 ? 0 : 2));
                } else {
                    option = randOpt < 0.4 ? 1 : (randOpt < 0.7 ? 0 : 2);
                }
                
                const isTacticActive = attDetailedTactic.detailedTacticBonus > 0;
                const commData = getDetailedTacticCommentary(option, attackerInfo.formation, isTacticActive, activePlayers, attackerInfo.squad, attackerInfo.playerDeck, attackerInfo.wingerStyles, attackerInfo.strikerStyles);
                
                const cleanText = (text) => {
                    if (!text) return "";
                    return text
                        .replace(/전북 현대|전북|나의 구단/g, `<strong>${attackerName}</strong>`)
                        .replace(/상대팀|상대/g, `<strong>${defenderName}</strong>`)
                        .replace(/전주성/g, `경기장`);
                };
                const cleanTextForDef = (text) => {
                    if (!text) return "";
                    return text
                        .replace(/전북 현대|전북|나의 구단/g, `<strong>${defenderName}</strong>`)
                        .replace(/상대팀|상대/g, `<strong>${attackerName}</strong>`)
                        .replace(/전주성/g, `경기장`);
                };
                
                addPvpCommentary(currentExtraMin, `⚡ [${attackerName}] [찬스 - 연장] ${cleanText(commData.eventDesc)}`, 'attack');
                
                if (isGoal) {
                    if (isHostAttack) hostScoreVal++;
                    else guestScoreVal++;
                    playSound('reveal');
                    addPvpCommentary(currentExtraMin, cleanText(commData.eventGoal), 'goal');
                } else {
                    const isGkSaveText = Math.random() < 0.5;
                    if (isGkSaveText) {
                        const saveText = getMatchEventCommentary('GK_SAVE', { activeGk: defGkName });
                        addPvpCommentary(currentExtraMin, cleanTextForDef(saveText), 'normal');
                    } else {
                        addPvpCommentary(currentExtraMin, cleanText(commData.eventFail), 'normal');
                    }
                }
            } else if (currentExtraMin === 105) {
                addPvpCommentary('HT_ET', `연장 전반전이 종료되었습니다. 현재 스코어 ${hostScoreVal} - ${guestScoreVal}. 곧이어 연장 후반전이 개시됩니다!`, 'system');
            }
            
            const stateData = {
                minute: currentExtraMin,
                hostScore: hostScoreVal,
                guestScore: guestScoreVal,
                currentEvent: eventsLogList[eventsLogList.length - 1],
                eventsLog: eventsLogList
            };
            await window.dbService.updatePvpMatchState(roomId, stateData);
            
            extraTickIdx++;
            if (extraTickIdx >= extraTimeMinutes.length) {
                // 연장 120분 종료
                if (hostScoreVal === guestScoreVal) {
                    // 여전히 무승부 -> 승부차기 돌입
                    isPenaltyShootout = true;
                    addPvpCommentary('승부차기', `⏱️ 연장 120분마저 ${hostScoreVal} - ${guestScoreVal} 무승부로 끝났습니다. 이제 경기 승패를 가르기 위한 운명의 승부차기로 돌입합니다!`, 'system');
                    
                    const stateData = {
                        minute: 120,
                        hostScore: hostScoreVal,
                        guestScore: guestScoreVal,
                        psoState: psoState,
                        currentEvent: eventsLogList[eventsLogList.length - 1],
                        eventsLog: eventsLogList
                    };
                    await window.dbService.updatePvpMatchState(roomId, stateData);
                } else {
                    // 스코어가 달라짐 -> 정상 종료
                    isExtraTime = false;
                    finishPvpMatchSim();
                }
            }
            return;
        }

        // [C] 정규 90분 경기 진행 중인 경우
        const currentMin = pvpMatchMinutes[tickIdx];
        
        if (currentMin === 0) {
            addPvpCommentary(0, "주심의 힘찬 킥오프 휘슬과 함께 전후반 90분의 뜨거운 실시간 혈투가 개시됩니다!", 'normal');
        } else if (pvpEventMins.includes(currentMin)) {
            // 찬스 획득 팀 결정
            const isHostAttack = Math.random() < hostAttackProb;
            const attackerInfo = isHostAttack ? hostInfo : guestInfo;
            const defenderInfo = isHostAttack ? guestInfo : hostInfo;
            const attackerName = attackerInfo.id.toUpperCase();
            const defenderName = defenderInfo.id.toUpperCase();
            const activeDiff = isHostAttack ? ovrDiff : -ovrDiff;
            
            const attStId = attackerInfo.squad["ST"];
            let attStSho = 75;
            if (attStId && CARDS_DATABASE[attStId]) {
                const card = getAwakenedCard(attStId, attackerInfo.playerDeck);
                attStSho = getStrikerChanceStat('ST', card, attackerInfo.strikerStyles);
            }
            const defGkId = defenderInfo.squad["GK"];
            let defGkDef = 70;
            let defGkName = "상대 골키퍼";
            if (defGkId && CARDS_DATABASE[defGkId]) {
                const card = getAwakenedCard(defGkId, defenderInfo.playerDeck);
                defGkDef = card.stats.def || card.rating || 70;
                defGkName = card.name;
            }
            const defDefAvg = getTeamAverageStat('def', defenderInfo.squad, defenderInfo.playerDeck);
            
            const attFormTactic = getPlayerFormationTacticBonuses(attackerInfo.formation, attackerInfo.squad, attackerInfo.playerDeck);
            const attDetailedTactic = getPlayerDetailedTacticBonuses(attackerInfo.formation, attackerInfo.squad, attackerInfo.playerDeck);
            const scoreBoost = attFormTactic.formationScoreBoost || 0;
            const suitabilityBonus = attDetailedTactic.suitabilityBonus || 0;
            
            const scoreProb = calculatePvpScoreProb(activeDiff, attStSho, defGkDef, defDefAvg, scoreBoost, suitabilityBonus);
            const isGoal = Math.random() < scoreProb;
            
            const activePlayers = {
                ST: (attackerInfo.squad["ST"] && CARDS_DATABASE[attackerInfo.squad["ST"]]) ? CARDS_DATABASE[attackerInfo.squad["ST"]].name : "스트라이커",
                LW: (attackerInfo.squad["LW"] && CARDS_DATABASE[attackerInfo.squad["LW"]]) ? CARDS_DATABASE[attackerInfo.squad["LW"]].name : "윙어",
                RW: (attackerInfo.squad["RW"] && CARDS_DATABASE[attackerInfo.squad["RW"]]) ? CARDS_DATABASE[attackerInfo.squad["RW"]].name : "윙어",
                CM: (attackerInfo.squad["CM"] && CARDS_DATABASE[attackerInfo.squad["CM"]]) ? CARDS_DATABASE[attackerInfo.squad["CM"]].name : "미드필더",
                GK: defGkName
            };
            
            let option = 1;
            const randOpt = Math.random();
            if (attackerInfo.formation === '4-2-3-1') {
                option = randOpt < 0.4 ? 5 : (randOpt < 0.7 ? 1 : (randOpt < 0.85 ? 0 : 2));
            } else {
                option = randOpt < 0.4 ? 1 : (randOpt < 0.7 ? 0 : 2);
            }
            
            const isTacticActive = attDetailedTactic.detailedTacticBonus > 0;
            const commData = getDetailedTacticCommentary(option, attackerInfo.formation, isTacticActive, activePlayers, attackerInfo.squad, attackerInfo.playerDeck, attackerInfo.wingerStyles, attackerInfo.strikerStyles);
            
            const cleanText = (text) => {
                if (!text) return "";
                return text
                    .replace(/전북 현대|전북|나의 구단/g, `<strong>${attackerName}</strong>`)
                    .replace(/상대팀|상대/g, `<strong>${defenderName}</strong>`)
                    .replace(/전주성/g, `경기장`);
            };
            const cleanTextForDef = (text) => {
                if (!text) return "";
                return text
                    .replace(/전북 현대|전북|나의 구단/g, `<strong>${defenderName}</strong>`)
                    .replace(/상대팀|상대/g, `<strong>${attackerName}</strong>`)
                    .replace(/전주성/g, `경기장`);
            };
            
            addPvpCommentary(currentMin, `⚡ [${attackerName}] [찬스] ${cleanText(commData.eventDesc)}`, 'attack');
            
            if (isGoal) {
                if (isHostAttack) hostScoreVal++;
                else guestScoreVal++;
                playSound('reveal');
                addPvpCommentary(currentMin, cleanText(commData.eventGoal), 'goal');
            } else {
                const isGkSaveText = Math.random() < 0.5;
                if (isGkSaveText) {
                    const saveText = getMatchEventCommentary('GK_SAVE', { activeGk: defGkName });
                    addPvpCommentary(currentMin, cleanTextForDef(saveText), 'normal');
                } else {
                    addPvpCommentary(currentMin, cleanText(commData.eventFail), 'normal');
                }
            }
        } else if (currentMin === 45) {
            addPvpCommentary('HT', `치열했던 전반전 경기 종료. 현재 스코어 ${hostScoreVal} - ${guestScoreVal}로 양 팀 휴식에 들어갑니다.`, 'system');
        }
        
        const stateData = {
            minute: currentMin,
            hostScore: hostScoreVal,
            guestScore: guestScoreVal,
            currentEvent: eventsLogList[eventsLogList.length - 1],
            eventsLog: eventsLogList
        };
        await window.dbService.updatePvpMatchState(roomId, stateData);
        
        tickIdx++;
        if (tickIdx >= pvpMatchMinutes.length) {
            // 90분 정규 시간 종료
            if (hostScoreVal === guestScoreVal) {
                // 무승부 -> 연장전 돌입
                isExtraTime = true;
                addPvpCommentary('SYSTEM', `⏱️ [연장전] 정규 시간 90분이 ${hostScoreVal} - ${guestScoreVal} 무승부로 끝났습니다. 승부를 내기 위해 연장전(전후반 15분)으로 돌입합니다!`, 'system');
                
                const stateData = {
                    minute: 90,
                    hostScore: hostScoreVal,
                    guestScore: guestScoreVal,
                    currentEvent: eventsLogList[eventsLogList.length - 1],
                    eventsLog: eventsLogList
                };
                await window.dbService.updatePvpMatchState(roomId, stateData);
            } else {
                // 스코어 격차 있음 -> 정규 경기 정상 종료
                finishPvpMatchSim();
            }
        }
    };
    
    // 경기 시작
    runPvpTick();
    pvpMatchTimer = setInterval(runPvpTick, 3000); // 3.0초당 1티어 경과
}

// 매치 결과를 유저 전적(pvpStats)에 누적하고 백업 저장하는 함수
function recordPvpStatsAndSave(result, opponentId = "") {
    if (typeof currentUser !== 'string' || !currentUser) return;
    
    // 1. 전역 상태 데이터 혹은 로컬 데이터 파싱
    if (typeof userPvpStats === 'undefined') {
        window.userPvpStats = { w: 0, d: 0, l: 0 };
    }
    if (typeof userPvpOpponentStats === 'undefined') {
        window.userPvpOpponentStats = {};
    }
    
    // 통산 전적 반영
    if (result === 'w') {
        userPvpStats.w += 1;
    } else if (result === 'd') {
        userPvpStats.d += 1;
    } else if (result === 'l') {
        userPvpStats.l += 1;
    }
    
    // 상대방별 전적 반영
    if (opponentId && typeof opponentId === 'string') {
        const oppKey = opponentId.toLowerCase().trim();
        if (!userPvpOpponentStats[oppKey]) {
            userPvpOpponentStats[oppKey] = { w: 0, d: 0, l: 0 };
        }
        if (result === 'w') {
            userPvpOpponentStats[oppKey].w += 1;
        } else if (result === 'd') {
            userPvpOpponentStats[oppKey].d += 1;
        } else if (result === 'l') {
            userPvpOpponentStats[oppKey].l += 1;
        }
    }
    
    // db.js 구조와 로컬스토리지를 연동하여 세이브
    localStorage.setItem('fc_star_pvp_w', userPvpStats.w.toString());
    localStorage.setItem('fc_star_pvp_d', userPvpStats.d.toString());
    localStorage.setItem('fc_star_pvp_l', userPvpStats.l.toString());
    localStorage.setItem('fc_star_pvp_opp_stats', JSON.stringify(userPvpOpponentStats));
    
    // 최신 정보 Firestore 동기화 백업 격발
    if (typeof saveUserProgress === 'function') {
        saveUserProgress();
    }
    
    // UI 업데이트 격발
    renderPvpOpponentStats();
    
    showToast(`⚡ 실시간 대결 결과가 PvP 전적(${userPvpStats.w}승 ${userPvpStats.d}무 ${userPvpStats.l}패)에 반영되었습니다!`);
}

// 상대방별 실시간 전적 리스트를 화면에 렌더링하는 함수 (득점 순위와 동일한 디자인 구조)
function renderPvpOpponentStats() {
    const listEl = document.getElementById('pvpOpponentStatsList');
    if (!listEl) return;
    
    const statsArray = Object.entries(userPvpOpponentStats || {}).map(([oppId, stats]) => ({
        id: oppId,
        w: stats.w || 0,
        d: stats.d || 0,
        l: stats.l || 0,
        total: (stats.w || 0) + (stats.d || 0) + (stats.l || 0)
    }));
    
    if (statsArray.length === 0) {
        listEl.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 0.76rem; padding: 15px 10px;">상대 대결 전적이 없습니다. 첫 경기를 치러보세요!</div>`;
        return;
    }
    
    // 승리(w) 내림차순 -> 같으면 총 경기수 내림차순
    statsArray.sort((a, b) => {
        if (b.w !== a.w) return b.w - a.w;
        return b.total - a.total;
    });
    
    listEl.innerHTML = statsArray.map((item, idx) => {
        let rankBadge = "";
        if (idx === 0) {
            rankBadge = `<span style="display: inline-flex; align-items: center; justify-content: center; width: 20px; height: 20px; background: #ffd700; color: #000; border-radius: 50%; font-size: 0.7rem; font-weight: 900; box-shadow: 0 0 6px rgba(255, 215, 0, 0.4);">🥇</span>`;
        } else if (idx === 1) {
            rankBadge = `<span style="display: inline-flex; align-items: center; justify-content: center; width: 20px; height: 20px; background: #c0c0c0; color: #000; border-radius: 50%; font-size: 0.7rem; font-weight: 900;">🥈</span>`;
        } else if (idx === 2) {
            rankBadge = `<span style="display: inline-flex; align-items: center; justify-content: center; width: 20px; height: 20px; background: #cd7f32; color: #000; border-radius: 50%; font-size: 0.7rem; font-weight: 900;">🥉</span>`;
        } else {
            rankBadge = `<span style="display: inline-flex; align-items: center; justify-content: center; width: 20px; height: 20px; background: rgba(255, 255, 255, 0.08); color: var(--text-muted); border-radius: 50%; font-size: 0.7rem; font-weight: 800; border: 1px solid rgba(255, 255, 255, 0.1);">${idx + 1}</span>`;
        }
        
        return `
            <div class="pvp-opp-stat-row" style="display: flex; align-items: center; justify-content: space-between; font-size: 0.8rem; padding: 10px 14px; background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 12px; margin-bottom: 2px; transition: all 0.2s;">
                <div style="display: flex; align-items: center; gap: 8px;">
                    ${rankBadge}
                    <strong style="color: #fff; font-size: 0.82rem; letter-spacing: 0.5px;">${item.id.toUpperCase()}</strong>
                </div>
                <div style="color: var(--text-muted); font-size: 0.78rem; font-weight: 800; display: flex; gap: 6px;">
                    <span style="color: #00ff87; background: rgba(0, 255, 135, 0.1); padding: 1px 6px; border-radius: 6px; border: 1px solid rgba(0, 255, 135, 0.2);">${item.w}승</span>
                    <span style="color: #cbd5e1; background: rgba(255, 255, 255, 0.05); padding: 1px 6px; border-radius: 6px; border: 1px solid rgba(255, 255, 255, 0.1);">${item.d}무</span>
                    <span style="color: #ff3e6c; background: rgba(255, 62, 108, 0.1); padding: 1px 6px; border-radius: 6px; border: 1px solid rgba(255, 62, 108, 0.2);">${item.l}패</span>
                </div>
            </div>
        `;
    }).join('');
}

// PvP 대결 종료 및 대기실 나가기 클린업
async function handleExitPvpRoom() {
    if (pvpMatchTimer) {
        clearInterval(pvpMatchTimer);
        pvpMatchTimer = null;
    }
    
    const myId = typeof currentUser === 'string' && currentUser ? currentUser : "";
    if (currentPvpRoomId && myId) {
        await window.dbService.leavePvpRoom(currentPvpRoomId, myId);
    }
    
    cleanupPvpMatch();
    initPvpTab();
}

// 실시간 상태 전면 클린업
function cleanupPvpMatch() {
    if (pvpRoomListener) {
        pvpRoomListener();
        pvpRoomListener = null;
    }
    if (pvpMatchTimer) {
        clearInterval(pvpMatchTimer);
        pvpMatchTimer = null;
    }
    
    currentPvpRoomId = null;
    isHostUser = false;
    guestReadyState = false;
    isMatchSimulating = false; // 경기 진행 잠금 플래그 초기화

    // 재대결 버튼 상태 초기화
    const guestRematchBtn = document.getElementById('btnPvpGuestRematch');
    const hostRematchBtn = document.getElementById('btnPvpHostRematch');
    const rematchInfoEl = document.getElementById('pvpRematchInfo');
    
    if (guestRematchBtn) {
        guestRematchBtn.style.display = 'none';
        guestRematchBtn.disabled = false;
        guestRematchBtn.innerHTML = `<i class="fa-solid fa-arrows-rotate"></i> 재대결 신청`;
    }
    if (hostRematchBtn) {
        hostRematchBtn.style.display = 'none';
        hostRematchBtn.disabled = true;
    }
    if (rematchInfoEl) {
        rematchInfoEl.innerText = "";
    }
}

// [Guest] 재대결 신청 핸들러
async function handleGuestRematch() {
    if (!currentPvpRoomId) return;
    showToast("재대결을 신청합니다. 호스트의 수락을 대기합니다...");
    await window.dbService.requestPvpRematch(currentPvpRoomId, true);
}

// [Host] 재대결 대기실 이동 수락 핸들러
async function handleHostRematch() {
    if (!currentPvpRoomId || !isHostUser) return;
    
    // 현재 방의 gameCount 가져오기
    try {
        const doc = await window.dbService.firestore.collection('fc_star_rooms').doc(currentPvpRoomId).get();
        if (doc.exists) {
            const roomData = doc.data();
            const currGameCount = roomData.gameCount || 1;
            if (currGameCount >= 3) {
                showToast("⚠️ 최대 대결 횟수(3게임)를 초과하여 재대결을 진행할 수 없습니다.");
                return;
            }
            
            showToast("재대결을 시작하여 대기실로 이동합니다!");
            await window.dbService.startPvpRematch(currentPvpRoomId, currGameCount + 1);
        }
    } catch (err) {
        showToast("재대결 시작 실패: " + err.message);
    }
}
