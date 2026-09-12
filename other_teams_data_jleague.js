/**
 * other_teams_data_jleague.js - J1 League Teams & Players Preset & 33R Fixtures
 * 
 * 2026 J1 League Preset for FC STAR CARD Multi-League System.
 * User Team: FC 도쿄 (FC Tokyo)
 */

// 1. 12개 J1리그 구단 프리셋
const J_LEAGUE_TEAMS_PRESET = [
    { id: "tokyo", name: "FC 도쿄", shortName: "TOK", rating: 70, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0, emblem: "img/mark_tokyo.png", color: "#001c58" },
    { id: "kobe", name: "비셀 고베", shortName: "KOB", rating: 81, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0, emblem: "img/mark_kobe.png", color: "#800020" },
    { id: "hiroshima", name: "산프레체 히로시마", shortName: "HIR", rating: 80, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0, emblem: "img/mark_hiroshima.png", color: "#4b0082" },
    { id: "machida", name: "마치다 젤비아", shortName: "MAC", rating: 79, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0, emblem: "img/mark_machida.png", color: "#003399" },
    { id: "kashima", name: "가시마 앤틀러스", shortName: "KAS", rating: 78, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0, emblem: "img/mark_kashima.png", color: "#b22222" },
    { id: "gamba", name: "감바 오사카", shortName: "GAM", rating: 77, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0, emblem: "img/mark_gamba.png", color: "#002b66" },
    { id: "marinos", name: "요코하마 F. 마리노스", shortName: "MAR", rating: 77, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0, emblem: "img/mark_marinos.png", color: "#003893" },
    { id: "urawa", name: "우라와 레즈", shortName: "URA", rating: 76, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0, emblem: "img/mark_urawa.png", color: "#e60012" },
    { id: "cerezo", name: "세레소 오사카", shortName: "CRZ", rating: 75, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0, emblem: "img/mark_cerezo.png", color: "#e3007f" },
    { id: "verdy", name: "도쿄 베르디", shortName: "VER", rating: 74, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0, emblem: "img/mark_verdy.png", color: "#006400" },
    { id: "kawasaki", name: "가와사키 프론탈레", shortName: "KAW", rating: 73, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0, emblem: "img/mark_kawasaki.png", color: "#00a3e0" },
    { id: "nagoya", name: "나고야 그램퍼스", shortName: "NAG", rating: 72, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0, emblem: "img/mark_nagoya.png", color: "#d2151e" }
];

// 1-1. FA 컵 (Emperor's Cup / FA Cup) 16개 참여 구단 프리셋
const CUP_TEAMS_PRESET_JLEAGUE = [
    { id: "tokyo", name: "FC 도쿄", rating: 70, emblem: "img/mark_tokyo.png", color: "#001c58" },
    { id: "kobe", name: "비셀 고베", rating: 81, emblem: "img/mark_kobe.png", color: "#800020" },
    { id: "hiroshima", name: "산프레체 히로시마", rating: 80, emblem: "img/mark_hiroshima.png", color: "#4b0082" },
    { id: "machida", name: "마치다 젤비아", rating: 79, emblem: "img/mark_machida.png", color: "#003399" },
    { id: "kashima", name: "가시마 앤틀러스", rating: 78, emblem: "img/mark_kashima.png", color: "#b22222" },
    { id: "gamba", name: "감바 오사카", rating: 77, emblem: "img/mark_gamba.png", color: "#002b66" },
    { id: "marinos", name: "요코하마 F. 마리노스", rating: 77, emblem: "img/mark_marinos.png", color: "#003893" },
    { id: "urawa", name: "우라와 레즈", rating: 76, emblem: "img/mark_urawa.png", color: "#e60012" },
    { id: "cerezo", name: "세레소 오사카", rating: 75, emblem: "img/mark_cerezo.png", color: "#e3007f" },
    { id: "verdy", name: "도쿄 베르디", rating: 74, emblem: "img/mark_verdy.png", color: "#006400" },
    { id: "kawasaki", name: "가와사키 프론탈레", rating: 73, emblem: "img/mark_kawasaki.png", color: "#00a3e0" },
    { id: "nagoya", name: "나고야 그램퍼스", rating: 72, emblem: "img/mark_nagoya.png", color: "#d2151e" },
    // 하부/초청 구단 4팀
    { id: "shimizu", name: "시미즈 S-펄스", rating: 71, emblem: "img/mark_shimizu.png", color: "#f39800" },
    { id: "iwata", name: "주빌로 이와타", rating: 70, emblem: "img/mark_iwata.png", color: "#87ceeb" },
    { id: "chiba", name: "제프 유나이티드", rating: 69, emblem: "img/mark_chiba.png", color: "#ffff00" },
    { id: "yamagata", name: "몬테디오 야마가타", rating: 68, emblem: "img/mark_yamagata.png", color: "#000080" }
];

// 2. J리그 상대팀 주요 선수 프리셋 (득점왕/도움왕 시뮬레이터 연동)
const OTHER_TEAMS_PLAYERS_PRESET_JLEAGUE = [
    // 1. 비셀 고베 (kobe)
    { id: "j_kobe_1", name: "오사코", teamId: "kobe", teamName: "비셀 고베" },
    { id: "j_kobe_2", name: "무토", teamId: "kobe", teamName: "비셀 고베" },

    // 2. 산프레체 히로시마 (hiroshima)
    { id: "j_hiroshima_1", name: "피에로스", teamId: "hiroshima", teamName: "산프레체 히로시마" },
    { id: "j_hiroshima_2", name: "카토", teamId: "hiroshima", teamName: "산프레체 히로시마" },

    // 3. 마치다 젤비아 (machida)
    { id: "j_machida_1", name: "에릭", teamId: "machida", teamName: "마치다 젤비아" },
    { id: "j_machida_2", name: "오세훈", teamId: "machida", teamName: "마치다 젤비아" },

    // 4. 가시마 앤틀러스 (kashima)
    { id: "j_kashima_1", name: "스즈키 유마", teamId: "kashima", teamName: "가시마 앤틀러스" },
    { id: "j_kashima_2", name: "나카마", teamId: "kashima", teamName: "가시마 앤틀러스" },

    // 5. 감바 오사카 (gamba)
    { id: "j_gamba_1", name: "우사미", teamId: "gamba", teamName: "감바 오사카" },
    { id: "j_gamba_2", name: "웰톤", teamId: "gamba", teamName: "감바 오사카" },

    // 6. 요코하마 F. 마리노스 (marinos)
    { id: "j_marinos_1", name: "안데르손 로페스", teamId: "marinos", teamName: "요코하마 F. 마리노스" },
    { id: "j_marinos_2", name: "에우베르", teamId: "marinos", teamName: "요코하마 F. 마리노스" },

    // 7. 우라와 레즈 (urawa)
    { id: "j_urawa_1", name: "티아고 산타나", teamId: "urawa", teamName: "우라와 레즈" },
    { id: "j_urawa_2", name: "마츠오", teamId: "urawa", teamName: "우라와 레즈" },

    // 8. 세레소 오사카 (cerezo)
    { id: "j_cerezo_1", name: "레오 세아라", teamId: "cerezo", teamName: "세레소 오사카" },
    { id: "j_cerezo_2", name: "페르난데스", teamId: "cerezo", teamName: "세레소 오사카" },

    // 9. 도쿄 베르디 (verdy)
    { id: "j_verdy_1", name: "기무라", teamId: "verdy", teamName: "도쿄 베르디" },
    { id: "j_verdy_2", name: "소메노", teamId: "verdy", teamName: "도쿄 베르디" },

    // 10. 가와사키 프론탈레 (kawasaki)
    { id: "j_kawasaki_1", name: "마르시뉴", teamId: "kawasaki", teamName: "가와사키 프론탈레" },
    { id: "j_kawasaki_2", name: "에리손", teamId: "kawasaki", teamName: "가와사키 프론탈레" },

    // 11. 나고야 그램퍼스 (nagoya)
    { id: "j_nagoya_1", name: "패트릭", teamId: "nagoya", teamName: "나고야 그램퍼스" },
    { id: "j_nagoya_2", name: "나가이", teamId: "nagoya", teamName: "나고야 그램퍼스" }
];

// 3. J1리그 33라운드 대진표 (FC 도쿄 기준)
const J_LEAGUE_FIXTURES = [
    // 1회차 (라운드 1~11)
    { round: 1, opponent: "kobe", isHome: false },
    { round: 2, opponent: "hiroshima", isHome: true },
    { round: 3, opponent: "machida", isHome: false },
    { round: 4, opponent: "kashima", isHome: true },
    { round: 5, opponent: "gamba", isHome: false },
    { round: 6, opponent: "marinos", isHome: true },
    { round: 7, opponent: "urawa", isHome: false },
    { round: 8, opponent: "cerezo", isHome: true },
    { round: 9, opponent: "verdy", isHome: false },
    { round: 10, opponent: "kawasaki", isHome: true },
    { round: 11, opponent: "nagoya", isHome: false },
    // 2회차 (라운드 12~22, 홈/원정 반대)
    { round: 12, opponent: "kobe", isHome: true },
    { round: 13, opponent: "hiroshima", isHome: false },
    { round: 14, opponent: "machida", isHome: true },
    { round: 15, opponent: "kashima", isHome: false },
    { round: 16, opponent: "gamba", isHome: true },
    { round: 17, opponent: "marinos", isHome: false },
    { round: 18, opponent: "urawa", isHome: true },
    { round: 19, opponent: "cerezo", isHome: false },
    { round: 20, opponent: "verdy", isHome: true },
    { round: 21, opponent: "kawasaki", isHome: false },
    { round: 22, opponent: "nagoya", isHome: true },
    // 3회차 (라운드 23~33, 홈/원정 배분)
    { round: 23, opponent: "kobe", isHome: false },
    { round: 24, opponent: "hiroshima", isHome: true },
    { round: 25, opponent: "machida", isHome: false },
    { round: 26, opponent: "kashima", isHome: true },
    { round: 27, opponent: "gamba", isHome: false },
    { round: 28, opponent: "marinos", isHome: true },
    { round: 29, opponent: "urawa", isHome: false },
    { round: 30, opponent: "cerezo", isHome: true },
    { round: 31, opponent: "verdy", isHome: false },
    { round: 32, opponent: "kawasaki", isHome: true },
    { round: 33, opponent: "nagoya", isHome: false }
];

// 4. J리그 구단 기본 포메이션 프리셋
const J_LEAGUE_TEAM_FORMATIONS = {
    "tokyo": "4-2-3-1",
    "kobe": "4-3-3",
    "hiroshima": "3-4-3",
    "machida": "4-4-2",
    "kashima": "4-2-3-1",
    "gamba": "4-2-3-1",
    "marinos": "4-3-3",
    "urawa": "4-2-3-1",
    "cerezo": "4-4-2",
    "verdy": "3-4-3",
    "kawasaki": "4-3-3",
    "nagoya": "3-4-3",
    // FA컵 참가 하부 구단
    "shimizu": "4-2-3-1",
    "iwata": "4-2-3-1",
    "chiba": "4-4-2",
    "yamagata": "4-2-3-1"
};
