/**
 * other_teams_data_epl.js - Premier League Teams & Players Preset & 38R Fixtures
 * 
 * 2026 Updated Premier League Preset for FC STAR CARD Multi-League System.
 * User Team: 리버풀 (Liverpool FC)
 */

// 1. 20개 프리미어리그 구단 프리셋 (맨시티 95 기준)
const EPL_TEAMS_PRESET = [
    { id: "liverpool", name: "리버풀", shortName: "LIV", rating: 94, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0, emblem: "img/mark_liverpool.png", color: "#c8102e" },
    { id: "mancity", name: "맨체스터 시티", shortName: "MCI", rating: 95, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0, emblem: "img/mark_mancity.png", color: "#6cabdd" },
    { id: "arsenal", name: "아스날", shortName: "ARS", rating: 94, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0, emblem: "img/mark_arsenal.png", color: "#ef0107" },
    { id: "chelsea", name: "첼시", shortName: "CHE", rating: 91, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0, emblem: "img/mark_chelsea.png", color: "#034694" },
    { id: "tottenham", name: "토트넘 홋스퍼", shortName: "TOT", rating: 91, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0, emblem: "img/mark_tottenham.png", color: "#132257" },
    { id: "manutd", name: "맨체스터 유나이티드", shortName: "MUN", rating: 90, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0, emblem: "img/mark_manutd.png", color: "#da291c" },
    { id: "newcastle", name: "뉴캐슬 유나이티드", shortName: "NEW", rating: 89, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0, emblem: "img/mark_newcastle.png", color: "#241f20" },
    { id: "astonvilla", name: "아스톤 빌라", shortName: "AVL", rating: 89, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0, emblem: "img/mark_astonvilla.png", color: "#95bfe5" },
    { id: "brighton", name: "브라이튼", shortName: "BHA", rating: 87, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0, emblem: "img/mark_brighton.png", color: "#0057b8" },
    { id: "westham", name: "웨스트햄 유나이티드", shortName: "WHU", rating: 86, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0, emblem: "img/mark_westham.png", color: "#7a263a" },
    { id: "bournemouth", name: "본머스", shortName: "BOU", rating: 85, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0, emblem: "img/mark_bournemouth.png", color: "#da291c" },
    { id: "fulham", name: "풀럼", shortName: "FUL", rating: 85, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0, emblem: "img/mark_fulham.png", color: "#cc0000" },
    { id: "palace", name: "크리스탈 팰리스", shortName: "CRY", rating: 85, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0, emblem: "img/mark_palace.png", color: "#1b458f" },
    { id: "brentford", name: "브렌트포드", shortName: "BRE", rating: 84, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0, emblem: "img/mark_brentford.png", color: "#e30613" },
    { id: "nottingham", name: "노팅엄 포레스트", shortName: "NFO", rating: 84, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0, emblem: "img/mark_nottingham.png", color: "#dd0000" },
    { id: "wolves", name: "울버햄튼", shortName: "WOL", rating: 83, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0, emblem: "img/mark_wolves.png", color: "#fdb913" },
    { id: "everton", name: "에버튼", shortName: "EVE", rating: 83, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0, emblem: "img/mark_everton.png", color: "#003399" },
    { id: "leicester", name: "레스터 시티", shortName: "LEI", rating: 82, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0, emblem: "img/mark_leicester.png", color: "#003090" },
    { id: "ipswich", name: "입스위치 타운", shortName: "IPS", rating: 80, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0, emblem: "img/mark_ipswich.png", color: "#003399" },
    { id: "southampton", name: "사우샘프턴", shortName: "SOU", rating: 80, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0, emblem: "img/mark_southampton.png", color: "#d71920" }
];

// 1-1. 카라바오컵 (Carabao Cup / EFL Cup) 16개 참여 구단 프리셋
const CUP_TEAMS_PRESET_EPL = [
    { id: "liverpool", name: "리버풀", rating: 94, emblem: "img/mark_liverpool.png", color: "#c8102e" },
    { id: "mancity", name: "맨체스터 시티", rating: 95, emblem: "img/mark_mancity.png", color: "#6cabdd" },
    { id: "arsenal", name: "아스날", rating: 94, emblem: "img/mark_arsenal.png", color: "#ef0107" },
    { id: "chelsea", name: "첼시", rating: 91, emblem: "img/mark_chelsea.png", color: "#034694" },
    { id: "tottenham", name: "토트넘 홋스퍼", rating: 91, emblem: "img/mark_tottenham.png", color: "#132257" },
    { id: "manutd", name: "맨체스터 유나이티드", rating: 90, emblem: "img/mark_manutd.png", color: "#da291c" },
    { id: "newcastle", name: "뉴캐슬 유나이티드", rating: 89, emblem: "img/mark_newcastle.png", color: "#241f20" },
    { id: "astonvilla", name: "아스톤 빌라", rating: 89, emblem: "img/mark_astonvilla.png", color: "#95bfe5" },
    { id: "brighton", name: "브라이튼", rating: 87, emblem: "img/mark_brighton.png", color: "#0057b8" },
    { id: "westham", name: "웨스트햄 유나이티드", rating: 86, emblem: "img/mark_westham.png", color: "#7a263a" },
    { id: "bournemouth", name: "본머스", rating: 85, emblem: "img/mark_bournemouth.png", color: "#da291c" },
    { id: "fulham", name: "풀럼", rating: 85, emblem: "img/mark_fulham.png", color: "#cc0000" },
    { id: "palace", name: "크리스탈 팰리스", rating: 85, emblem: "img/mark_palace.png", color: "#1b458f" },
    { id: "brentford", name: "브렌트포드", rating: 84, emblem: "img/mark_brentford.png", color: "#e30613" },
    { id: "nottingham", name: "노팅엄 포레스트", rating: 84, emblem: "img/mark_nottingham.png", color: "#dd0000" },
    { id: "wolves", name: "울버햄튼", rating: 83, emblem: "img/mark_wolves.png", color: "#fdb913" }
];

// 2. EPL 상대팀 주요 선수 프리셋 (득점왕/도움왕 시뮬레이터 연동)
const OTHER_TEAMS_PLAYERS_PRESET_EPL = [
    // 1. 맨체스터 시티 (mancity)
    { id: "epl_mancity_1", name: "홀란드", teamId: "mancity", teamName: "맨체스터 시티" },
    { id: "epl_mancity_2", name: "더브라위너", teamId: "mancity", teamName: "맨체스터 시티" },

    // 2. 아스날 (arsenal)
    { id: "epl_arsenal_1", name: "사카", teamId: "arsenal", teamName: "아스날" },
    { id: "epl_arsenal_2", name: "하베르츠", teamId: "arsenal", teamName: "아스날" },

    // 3. 첼시 (chelsea)
    { id: "epl_chelsea_1", name: "팔머", teamId: "chelsea", teamName: "첼시" },
    { id: "epl_chelsea_2", name: "잭슨", teamId: "chelsea", teamName: "첼시" },

    // 4. 토트넘 홋스퍼 (tottenham)
    { id: "epl_tottenham_1", name: "손흥민", teamId: "tottenham", teamName: "토트넘 홋스퍼" },
    { id: "epl_tottenham_2", name: "매디슨", teamId: "tottenham", teamName: "토트넘 홋스퍼" },

    // 5. 맨체스터 유나이티드 (manutd)
    { id: "epl_manutd_1", name: "브루노", teamId: "manutd", teamName: "맨체스터 유나이티드" },
    { id: "epl_manutd_2", name: "래시포드", teamId: "manutd", teamName: "맨체스터 유나이티드" },

    // 6. 뉴캐슬 유나이티드 (newcastle)
    { id: "epl_newcastle_1", name: "이삭", teamId: "newcastle", teamName: "뉴캐슬 유나이티드" },
    { id: "epl_newcastle_2", name: "고든", teamId: "newcastle", teamName: "뉴캐슬 유나이티드" },

    // 7. 아스톤 빌라 (astonvilla)
    { id: "epl_astonvilla_1", name: "왓킨스", teamId: "astonvilla", teamName: "아스톤 빌라" },
    { id: "epl_astonvilla_2", name: "베일리", teamId: "astonvilla", teamName: "아스톤 빌라" },

    // 8. 브라이튼 (brighton)
    { id: "epl_brighton_1", name: "미토마", teamId: "brighton", teamName: "브라이튼" },
    { id: "epl_brighton_2", name: "웰백", teamId: "brighton", teamName: "브라이튼" },

    // 9. 웨스트햄 유나이티드 (westham)
    { id: "epl_westham_1", name: "보웬", teamId: "westham", teamName: "웨스트햄 유나이티드" },
    { id: "epl_westham_2", name: "쿠두스", teamId: "westham", teamName: "웨스트햄 유나이티드" },

    // 10. 본머스 (bournemouth)
    { id: "epl_bournemouth_1", name: "세메뇨", teamId: "bournemouth", teamName: "본머스" },
    { id: "epl_bournemouth_2", name: "에바니우송", teamId: "bournemouth", teamName: "본머스" },

    // 11. 풀럼 (fulham)
    { id: "epl_fulham_1", name: "이워비", teamId: "fulham", teamName: "풀럼" },
    { id: "epl_fulham_2", name: "라울 히메네스", teamId: "fulham", teamName: "풀럼" },

    // 12. 크리스탈 팰리스 (palace)
    { id: "epl_palace_1", name: "에제", teamId: "palace", teamName: "크리스탈 팰리스" },
    { id: "epl_palace_2", name: "마테타", teamId: "palace", teamName: "크리스탈 팰리스" },

    // 13. 브렌트포드 (brentford)
    { id: "epl_brentford_1", name: "음뵈모", teamId: "brentford", teamName: "브렌트포드" },
    { id: "epl_brentford_2", name: "위사", teamId: "brentford", teamName: "브렌트포드" },

    // 14. 노팅엄 포레스트 (nottingham)
    { id: "epl_nottingham_1", name: "우드", teamId: "nottingham", teamName: "노팅엄 포레스트" },
    { id: "epl_nottingham_2", name: "엘랑가", teamId: "nottingham", teamName: "노팅엄 포레스트" },

    // 15. 울버햄튼 (wolves)
    { id: "epl_wolves_1", name: "황희찬", teamId: "wolves", teamName: "울버햄튼" },
    { id: "epl_wolves_2", name: "쿠냐", teamId: "wolves", teamName: "울버햄튼" },

    // 16. 에버튼 (everton)
    { id: "epl_everton_1", name: "칼버트르윈", teamId: "everton", teamName: "에버튼" },
    { id: "epl_everton_2", name: "맥닐", teamId: "everton", teamName: "에버튼" },

    // 17. 레스터 시티 (leicester)
    { id: "epl_leicester_1", name: "바디", teamId: "leicester", teamName: "레스터 시티" },
    { id: "epl_leicester_2", name: "마비디디", teamId: "leicester", teamName: "레스터 시티" },

    // 18. 입스위치 타운 (ipswich)
    { id: "epl_ipswich_1", name: "델랍", teamId: "ipswich", teamName: "입스위치 타운" },
    { id: "epl_ipswich_2", name: "채플린", teamId: "ipswich", teamName: "입스위치 타운" },

    // 19. 사우샘프턴 (southampton)
    { id: "epl_southampton_1", name: "아처", teamId: "southampton", teamName: "사우샘프턴" },
    { id: "epl_southampton_2", name: "아리보", teamId: "southampton", teamName: "사우샘프턴" }
];

// 3. 리버풀 (플레이어 팀) 기준 38라운드 정규 풀리그 대진표
const LIVERPOOL_FIXTURES_EPL = [
    // 전반기 19경기 (1~19라운드)
    { round: 1, opponent: "ipswich", isHome: false },
    { round: 2, opponent: "brentford", isHome: true },
    { round: 3, opponent: "manutd", isHome: false },
    { round: 4, opponent: "nottingham", isHome: true },
    { round: 5, opponent: "bournemouth", isHome: true },
    { round: 6, opponent: "wolves", isHome: false },
    { round: 7, opponent: "palace", isHome: false },
    { round: 8, opponent: "chelsea", isHome: true },
    { round: 9, opponent: "arsenal", isHome: false },
    { round: 10, opponent: "brighton", isHome: true },
    { round: 11, opponent: "astonvilla", isHome: true },
    { round: 12, opponent: "southampton", isHome: false },
    { round: 13, opponent: "mancity", isHome: true },
    { round: 14, opponent: "newcastle", isHome: false },
    { round: 15, opponent: "everton", isHome: false },
    { round: 16, opponent: "fulham", isHome: true },
    { round: 17, opponent: "tottenham", isHome: false },
    { round: 18, opponent: "leicester", isHome: true },
    { round: 19, opponent: "westham", isHome: false },

    // 후반기 19경기 (20~38라운드, 홈/원정 반대)
    { round: 20, opponent: "manutd", isHome: true },
    { round: 21, opponent: "nottingham", isHome: false },
    { round: 22, opponent: "brentford", isHome: false },
    { round: 23, opponent: "ipswich", isHome: true },
    { round: 24, opponent: "bournemouth", isHome: false },
    { round: 25, opponent: "wolves", isHome: true },
    { round: 26, opponent: "everton", isHome: true },
    { round: 27, opponent: "astonvilla", isHome: false },
    { round: 28, opponent: "mancity", isHome: false },
    { round: 29, opponent: "newcastle", isHome: true },
    { round: 30, opponent: "southampton", isHome: true },
    { round: 31, opponent: "brighton", isHome: false },
    { round: 32, opponent: "fulham", isHome: false },
    { round: 33, opponent: "westham", isHome: true },
    { round: 34, opponent: "leicester", isHome: false },
    { round: 35, opponent: "tottenham", isHome: true },
    { round: 36, opponent: "chelsea", isHome: false },
    { round: 37, opponent: "arsenal", isHome: true },
    { round: 38, opponent: "palace", isHome: true }
];
