/* FC STAR CARD - Database & User Synchronization Service (db.js) */
/* This file manages user accounts and real-time cloud data backup.
   If firebaseConfig is configured with actual API credentials, Firestore will activate.
   Otherwise, it gracefully falls back to a Local Mock Cloud using LocalStorage for simulation!
*/

const firebaseConfig = {
    apiKey: "AIzaSyD0jJfd1uyjzpYqN3cyLHn1sVr7dIkxQac",
    authDomain: "my-family-ab699.firebaseapp.com",
    projectId: "my-family-ab699",
    storageBucket: "my-family-ab699.firebasestorage.app",
    messagingSenderId: "289127412048",
    appId: "1:289127412048:web:7e006f8ae7be4a6ba5bc55",
    measurementId: "G-HKJ97FTF6F"
};

// Helper to recursively remove undefined fields and replace them with null (or skip) for Firestore compatibility
function cleanUndefined(obj) {
    if (obj === null || obj === undefined) {
        return null;
    }
    if (Array.isArray(obj)) {
        return obj.map(item => item === undefined ? null : cleanUndefined(item));
    }
    if (typeof obj === 'object') {
        const proto = Object.getPrototypeOf(obj);
        if (proto === null || proto === Object.prototype) {
            const result = {};
            for (const key in obj) {
                if (Object.prototype.hasOwnProperty.call(obj, key)) {
                    const val = obj[key];
                    if (val !== undefined) {
                        result[key] = cleanUndefined(val);
                    }
                }
            }
            return result;
        }
    }
    return obj;
}

const dbService = {
    isFirebase: false,
    firestore: null,

    init() {
        const hasConfig = firebaseConfig && firebaseConfig.apiKey && firebaseConfig.apiKey.trim() !== "";
        if (hasConfig) {
            try {
                if (!firebase.apps.length) {
                    firebase.initializeApp(firebaseConfig);
                }
                this.firestore = firebase.firestore();
                this.isFirebase = true;
                
                // 오프라인 데이터 지속성 캐시 활성화
                this.firestore.enablePersistence({ synchronizeTabs: true })
                    .catch((err) => {
                        console.warn("⚠️ Firestore Persistence 활성화 실패:", err.code);
                    });

                console.log("🟢 Firebase Firestore 클라우드 원격 연결 완료!");
            } catch (error) {
                console.error("🔴 Firebase 초기화 에러 (로컬 모의 클라우드로 대체):", error);
                this.isFirebase = false;
            }
        } else {
            console.log("🔵 Firebase 설정 없음 - 로컬 모의 클라우드로 가동합니다 (개발 및 비회원 모드).");
            this.isFirebase = false;
        }
    },

    // 로컬 모의 클라우드 헬퍼 (로컬스토리지를 원격 서버처럼 가상 시뮬레이션)
    _getLocalUsers() {
        try {
            const data = localStorage.getItem('fc_star_mock_cloud_users');
            return data ? JSON.parse(data) : {};
        } catch (e) {
            return {};
        }
    },

    _saveLocalUsers(users) {
        try {
            localStorage.setItem('fc_star_mock_cloud_users', JSON.stringify(users));
        } catch (e) {
            console.error("로컬 가상 클라우드 백업 저장 실패:", e);
        }
    },

    // 로그인 처리
    async login(id, password) {
        const normalizedId = id.trim().toLowerCase();
        if (!normalizedId) throw new Error("아이디를 입력해주세요.");

        if (this.isFirebase) {
            try {
                // 오프라인 상태 고정을 강제로 해제하고 즉시 백엔드 연결 활성화
                await this.firestore.enableNetwork();
                const doc = await this.firestore.collection('fc_star_users').doc(normalizedId).get();
                if (!doc.exists) {
                    throw new Error("존재하지 않는 아이디입니다.");
                }
                const userData = doc.data();
                if (userData.password !== password) {
                    throw new Error("비밀번호가 올바르지 않습니다.");
                }
                return userData;
            } catch (error) {
                console.error("Firebase 로그인 실패:", error);
                throw error;
            }
        } else {
            // 로컬 모의 클라우드 로그인
            const users = this._getLocalUsers();
            const user = users[normalizedId];
            if (!user) {
                throw new Error("존재하지 않는 아이디입니다.");
            }
            if (user.password !== password) {
                throw new Error("비밀번호가 올바르지 않습니다.");
            }
            return user;
        }
    },

    // 회원가입 처리
    async register(id, password) {
        const normalizedId = id.trim().toLowerCase();
        if (!normalizedId) throw new Error("아이디를 입력해주세요.");
        if (!password || password.trim() === "") throw new Error("비밀번호를 입력해주세요.");

        // 축구 카드 게임 특화 초기 시작 유저 정보 구조
        const defaultData = {
            id: normalizedId,
            password: password,
            userPoints: 0, // 초기 가차 포인트 (FP)
            userLevel: 1, // 초기 레벨
            playerDeck: {}, // 소유한 카드 덱 데이터
            squadFormation: {}, // 베스트 11 포메이션 배치 상황
            squadFormations: { '4-4-2': {}, '4-3-3': {}, '3-4-3': {}, '5-4-1': {}, '4-2-3-1': {} }, // 각 포메이션별 개별 스쿼드 배치 상황
            leagueRound: 1, // K리그 리그 현재 라운드
            leagueTeams: [], // K리그 12팀 실시간 승점 상태 (비어있으면 로컬 프리셋으로 자동초기화)
            quizOffset: 0, // 단어 퀴즈 현재 공부 진도 오프셋
            quizLastDate: "", // 마지막 단어 퀴즈 턴 실행 날짜
            quizQueue: [], // 퀴즈 대기열
            quizSolvedCount: 0, // 퀴즈 정답 맞춘 개수
            quizCurrentIndex: 0, // 퀴즈 현재 진행 인덱스
            matchLastDate: "", // 마지막 경기 진행 날짜
            matchTodayCount: 0, // 오늘의 경기 진행 수
            leagueYear: 2026, // 리그 연도
            hallOfFame: [], // 명예의 전당 기록
            leaguePlayerStats: {}, // 리그 선수 개인 스탯 기록
            careerStats: { w: 0, d: 0, l: 0, gf: 0, ga: 0, playerGoals: {} }, // 통산 성적
            cupState: null, // 코리아컵 대회 진행도 및 스탯
            updatedAt: new Date().toISOString()
        };

        if (this.isFirebase) {
            try {
                // 오프라인 상태 고정을 강제로 해제하고 즉시 백엔드 연결 활성화
                await this.firestore.enableNetwork();
                const docRef = this.firestore.collection('fc_star_users').doc(normalizedId);
                const doc = await docRef.get();
                if (doc.exists) {
                    throw new Error("이미 존재하는 아이디입니다.");
                }
                await docRef.set(defaultData);
                return defaultData;
            } catch (error) {
                console.error("Firebase 회원가입 실패:", error);
                throw error;
            }
        } else {
            // 로컬 모의 클라우드 가입
            const users = this._getLocalUsers();
            if (users[normalizedId]) {
                throw new Error("이미 존재하는 아이디입니다.");
            }
            users[normalizedId] = defaultData;
            this._saveLocalUsers(users);
            return defaultData;
        }
    },

    // 데이터 클라우드 백업 저장
    async saveProgress(id, progressData) {
        const normalizedId = id.trim().toLowerCase();
        if (!normalizedId) return;

        // Firestore에서 undefined 필드 오류 방지를 위한 정제 작업
        let cleanData = progressData;
        try {
            cleanData = cleanUndefined(progressData);
        } catch (e) {
            console.error("Data sanitization failed for progressData", e);
        }

        if (this.isFirebase) {
            try {
                await this.firestore.collection('fc_star_users').doc(normalizedId).update({
                    ...cleanData,
                    updatedAt: new Date().toISOString()
                });
                console.log("☁️ Firestore 실시간 클라우드 백업 완료!");
            } catch (error) {
                console.error("Firestore 백업 저장 실패 (원격 배경):", error);
            }
        } else {
            // 로컬 모의 클라우드 데이터 업데이트
            const users = this._getLocalUsers();
            if (users[normalizedId]) {
                users[normalizedId] = {
                    ...users[normalizedId],
                    ...cleanData,
                    updatedAt: new Date().toISOString()
                };
                this._saveLocalUsers(users);
                console.log("💾 로컬 모의 클라우드에 실시간 데이터 세이브 완료!");
            }
        }
    },

    // 유저 상세 데이터 조회 (세션 자동 복원용)
    async getUserData(id) {
        const normalizedId = id.trim().toLowerCase();
        if (!normalizedId) return null;

        if (this.isFirebase) {
            try {
                const doc = await this.firestore.collection('fc_star_users').doc(normalizedId).get();
                return doc.exists ? doc.data() : null;
            } catch (error) {
                console.error("Firebase 유저 조회 실패:", error);
                throw new Error("network_error");
            }
        } else {
            const users = this._getLocalUsers();
            return users[normalizedId] || null;
        }
    },

    // 실시간 순위표 수집을 위한 가벼운 전체 랭킹 조회 인터페이스
    async fetchRankings() {
        if (this.isFirebase) {
            try {
                const snapshot = await this.firestore.collection('fc_star_users').get();
                const list = [];
                snapshot.forEach(doc => {
                    list.push(doc.data());
                });
                return list;
            } catch (error) {
                console.error("Firebase 유저 리스트 수집 실패:", error);
                throw error;
            }
        } else {
            const usersObj = this._getLocalUsers();
            return Object.values(usersObj);
        }
    },

    // 친선경기용 상대 3명 정보 로드 (최근 접속 순, 본인 및 개발자 제외, 로컬 캐시 백업 적용)
    async fetchFriendlyOpponents(myId) {
        const normalizedMyId = myId ? myId.trim().toLowerCase() : "";
        const EXCLUDED_IDS = [normalizedMyId, "ooks12"];
        const fallbackOpponents = [
            {
                id: "bot_ulsanking",
                name: "UlsanKing_99",
                rating: 83,
                squadFormation: { ST: "cards_default", GK: "cards_default" },
                bestPlayerName: "20 손흥민 (LW)",
                activeFormation: "4-3-3",
                updatedAt: new Date().toISOString(),
                isMock: true
            },
            {
                id: "bot_seoulfc",
                name: "SeoulFC_Star",
                rating: 80,
                squadFormation: { ST: "cards_default", GK: "cards_default" },
                bestPlayerName: "이강인 (RW)",
                activeFormation: "4-2-3-1",
                updatedAt: new Date().toISOString(),
                isMock: true
            },
            {
                id: "bot_collector",
                name: "CardCollector",
                rating: 76,
                squadFormation: { ST: "cards_default", GK: "cards_default" },
                bestPlayerName: "김민재 (CB)",
                activeFormation: "5-4-1",
                updatedAt: new Date().toISOString(),
                isMock: true
            }
        ];

        // 날짜/시간 정밀 변환 헬퍼 (Firestore Timestamp 객체 혹은 다양한 규격 지원)
        const safeGetDate = (dateVal) => {
            if (!dateVal) return new Date(0);
            if (typeof dateVal.toDate === 'function') {
                return dateVal.toDate();
            }
            const d = new Date(dateVal);
            return isNaN(d.getTime()) ? new Date(0) : d;
        };

        let loadedList = [];
        try {
            if (this.isFirebase) {
                // Firebase DB 조회: 필드 누락으로 인한 문서 유실 방지를 위해 전체 조회 후 JS 단에서 정렬함
                const snapshot = await this.firestore.collection('fc_star_users').get();
                snapshot.forEach(doc => {
                    const data = doc.data();
                    if (data) {
                        // 문서 ID(doc.id)가 계정 ID(normalizedId) 역할을 하므로, data.id가 누락되었을 시 보정
                        const rawId = data.id || doc.id || "";
                        const userId = rawId.trim().toLowerCase();
                        if (userId && !EXCLUDED_IDS.includes(userId)) {
                            data.id = userId;
                            loadedList.push(data);
                        }
                    }
                });
                
                // JS단에서 안전하게 최신 updatedAt 순으로 퀵 정렬 (누락 필드가 있어도 드롭되지 않고 0으로 치환)
                loadedList.sort((a, b) => safeGetDate(b.updatedAt) - safeGetDate(a.updatedAt));
            } else {
                // 로컬 가상 클라우드 조회
                const usersObj = this._getLocalUsers();
                const list = Object.values(usersObj);
                list.sort((a, b) => safeGetDate(b.updatedAt) - safeGetDate(a.updatedAt));
                list.forEach(data => {
                    if (data) {
                        const rawId = data.id || "";
                        const userId = rawId.trim().toLowerCase();
                        if (userId && !EXCLUDED_IDS.includes(userId)) {
                            data.id = userId;
                            loadedList.push(data);
                        }
                    }
                });
            }

            // OVR, 포메이션, 핵심 선수 데이터 보완 처리 (실제 스쿼드 카드를 실시간 역추적하여 전력 산출)
            loadedList = loadedList.map(user => {
                let calculatedOvr = 70;
                
                // 상대 스쿼드 실제 카드 기반 OVR 및 정보 동적 계산
                if (user.squadFormation && typeof user.squadFormation === 'object' && Object.keys(user.squadFormation).length > 0) {
                    let totalOvr = 0;
                    let count = 0;
                    const positions = ["ST", "LW", "RW", "CM", "LCM", "RCM", "LB", "LCB", "RCB", "RB", "GK"];
                    
                    positions.forEach(pos => {
                        const cardId = user.squadFormation[pos];
                        if (cardId) {
                            let cardRating = 70;
                            if (typeof CARDS_DATABASE !== 'undefined' && CARDS_DATABASE && CARDS_DATABASE[cardId]) {
                                cardRating = CARDS_DATABASE[cardId].rating;
                                // 상대방 덱에 강화(각성) 수치가 기록되어 있으면 합산
                                if (user.playerDeck && user.playerDeck[cardId] && typeof user.playerDeck[cardId].awakening === 'number') {
                                    cardRating += user.playerDeck[cardId].awakening;
                                }
                            }
                            totalOvr += cardRating;
                            count++;
                        }
                    });
                    
                    if (count > 0) {
                        calculatedOvr = Math.round(totalOvr / count);
                    }
                } else {
                    calculatedOvr = user.userLevel ? 70 + parseInt(user.userLevel) : 72;
                }
                
                // 상대방 액티브 포메이션 자동 판단
                let activeFormation = user.currentFormation || "4-4-2";
                if (!user.currentFormation && user.squadFormation && typeof user.squadFormation === 'object') {
                    const keys = Object.keys(user.squadFormation);
                    if (keys.includes("LCM") || keys.includes("RCM")) {
                        activeFormation = "4-3-3";
                    }
                }

                // 상대방 스쿼드 내 OVR이 가장 높은 에이스 선수 탐지
                let bestPlayerName = "핵심 플레이어 (CM)";
                if (user.squadFormation && typeof user.squadFormation === 'object') {
                    let maxRating = 0;
                    let bestCard = null;
                    Object.values(user.squadFormation).forEach(cardId => {
                        if (cardId && typeof CARDS_DATABASE !== 'undefined' && CARDS_DATABASE && CARDS_DATABASE[cardId]) {
                            const card = CARDS_DATABASE[cardId];
                            let rating = card.rating;
                            if (user.playerDeck && user.playerDeck[cardId] && typeof user.playerDeck[cardId].awakening === 'number') {
                                rating += user.playerDeck[cardId].awakening;
                            }
                            if (rating > maxRating) {
                                maxRating = rating;
                                bestCard = { name: card.name, position: card.position };
                            }
                        }
                    });
                    if (bestCard) {
                        bestPlayerName = `${bestCard.name} (${bestCard.position})`;
                    }
                }

                return {
                    id: user.id,
                    name: user.id.toUpperCase(),
                    rating: user.rating || calculatedOvr,
                    squadFormation: user.squadFormation || {},
                    bestPlayerName: user.bestPlayerName || bestPlayerName,
                    activeFormation: user.activeFormation || activeFormation,
                    friendlyMatchesHistory: user.friendlyMatchesHistory || { w: 0, d: 0, l: 0, pts: 0 },
                    updatedAt: user.updatedAt,
                    isMock: false
                };
            });

            // 원격 DB 가입 유저가 부족할 시 부족한 만큼 AI 가상 봇(Mock) 데이터로 스마트 믹스!
            if (loadedList.length < 3) {
                const needed = 3 - loadedList.length;
                for (let i = 0; i < needed; i++) {
                    if (fallbackOpponents[i]) {
                        loadedList.push(fallbackOpponents[i]);
                    }
                }
            }

            // 최종적으로 정확히 상위 3개 라인업 완비
            loadedList = loadedList.slice(0, 3);

            // 로드된 데이터가 있으면 로컬 스토리지에 즉시 캐싱 백업
            if (loadedList.length > 0) {
                localStorage.setItem('fc_star_friendly_cached_opponents', JSON.stringify(loadedList));
                console.log("💾 친선경기 상대를 로컬 스토리지 캐시에 세이브 완료!");
                return loadedList;
            } else {
                throw new Error("No other players found");
            }
        } catch (error) {
            console.warn("⚠️ 친선경기 상대 로드 실패. 로컬 캐시 폴백 작동 시도:", error);
            try {
                // 1차 폴백: 로컬 스토리지 캐시 검사
                const cached = localStorage.getItem('fc_star_friendly_cached_opponents');
                if (cached) {
                    const parsed = JSON.parse(cached);
                    if (parsed && parsed.length > 0) {
                        console.log("🟢 로컬 스토리지에 캐싱된 상대 데이터 폴백 성공!");
                        return parsed.map(opp => ({ ...opp, isMock: false }));
                    }
                }
            } catch (cacheErr) {
                console.error("로컬 캐시 파싱 에러:", cacheErr);
            }
            
            // 2차 폴백: 가상 봇 데이터 제공
            console.log("🟢 캐시 부재로 2차 폴백 가상 봇 상대 로드 완료!");
            return fallbackOpponents;
        }
    }
};

// Initialize DB Services
dbService.init();

// Bind to global window scope for app.js integration
window.dbService = dbService;
window.firebaseConfig = firebaseConfig;
