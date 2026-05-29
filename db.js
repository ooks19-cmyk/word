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
            leagueRound: 1, // K리그 리그 현재 라운드
            leagueTeams: [], // K리그 12팀 실시간 승점 상태 (비어있으면 로컬 프리셋으로 자동초기화)
            quizOffset: 0, // 단어 퀴즈 현재 공부 진도 오프셋
            quizLastDate: "", // 마지막 단어 퀴즈 턴 실행 날짜
            updatedAt: new Date().toISOString()
        };

        if (this.isFirebase) {
            try {
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

        if (this.isFirebase) {
            try {
                await this.firestore.collection('fc_star_users').doc(normalizedId).update({
                    ...progressData,
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
                    ...progressData,
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
                return null;
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
    }
};

// Initialize DB Services
dbService.init();

// Bind to global window scope for app.js integration
window.dbService = dbService;
window.firebaseConfig = firebaseConfig;
