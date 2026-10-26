/**
 * other_teams_data_ligue1.js - French Ligue 1 Teams & Players Preset & 34R Fixtures
 * 
 * 2026 Ligue 1 Preset for FC STAR CARD Multi-League System.
 * User Team: 파리 생제르맹 (Paris Saint-Germain, PSG)
 */

// 1. 18개 프랑스 리그앙 구단 프리셋
const LIGUE1_TEAMS_PRESET = [
    { id: "psg", name: "파리 생제르맹", shortName: "PSG", rating: 70, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0, emblem: "img/mark_psg.png", color: "#004170" },
    { id: "monaco", name: "AS 모나코", shortName: "ASM", rating: 89, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0, emblem: "img/mark_monaco.png", color: "#e2001a" },
    { id: "marseille", name: "올랭피크 드 마르세유", shortName: "OM", rating: 89, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0, emblem: "img/mark_marseille.png", color: "#00a3e0" },
    { id: "lille", name: "LOSC 릴", shortName: "LOSC", rating: 88, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0, emblem: "img/mark_lille.png", color: "#e01e13" },
    { id: "lyon", name: "올랭피크 리옹", shortName: "OL", rating: 87, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0, emblem: "img/mark_lyon.png", color: "#1c2d5a" },
    { id: "nice", name: "OGC 니스", shortName: "NIC", rating: 86, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0, emblem: "img/mark_nice.png", color: "#d00027" },
    { id: "lens", name: "RC 랑스", shortName: "RCL", rating: 85, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0, emblem: "img/mark_lens.png", color: "#e30613" },
    { id: "rennes", name: "스타드 렌", shortName: "REN", rating: 85, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0, emblem: "img/mark_rennes.png", color: "#e30613" },
    { id: "brest", name: "스타드 브레스투아 29", shortName: "BRE", rating: 84, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0, emblem: "img/mark_brest.png", color: "#da291c" },
    { id: "reims", name: "스타드 드 랭스", shortName: "REI", rating: 83, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0, emblem: "img/mark_reims.png", color: "#d81e05" },
    { id: "toulouse", name: "툴루즈 FC", shortName: "TOU", rating: 83, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0, emblem: "img/mark_toulouse.png", color: "#542e71" },
    { id: "strasbourg", name: "RC 스트라스부르", shortName: "STR", rating: 82, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0, emblem: "img/mark_strasbourg.png", color: "#0066b2" },
    { id: "montpellier", name: "몽펠리에 HSC", shortName: "MON", rating: 81, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0, emblem: "img/mark_montpellier.png", color: "#002b66" },
    { id: "nantes", name: "FC 낭트", shortName: "NAN", rating: 81, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0, emblem: "img/mark_nantes.png", color: "#00843d" },
    { id: "auxerre", name: "AJ 오세르", shortName: "AUX", rating: 80, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0, emblem: "img/mark_auxerre.png", color: "#003399" },
    { id: "angers", name: "앙제 SCO", shortName: "ANG", rating: 79, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0, emblem: "img/mark_angers.png", color: "#111111" },
    { id: "saint_etienne", name: "AS 생테티엔", shortName: "STE", rating: 79, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0, emblem: "img/mark_saint_etienne.png", color: "#007a3d" },
    { id: "le_havre", name: "르아브르 AC", shortName: "HAC", rating: 78, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0, emblem: "img/mark_le_havre.png", color: "#002f6c" }
];

// 1-1. 쿠프 드 프랑스 (Coupe de France) 16개 참여 구단 프리셋
const CUP_TEAMS_PRESET_LIGUE1 = [
    { id: "psg", name: "파리 생제르맹", rating: 70, emblem: "img/mark_psg.png", color: "#004170" },
    { id: "monaco", name: "AS 모나코", rating: 89, emblem: "img/mark_monaco.png", color: "#e2001a" },
    { id: "marseille", name: "올랭피크 드 마르세유", rating: 89, emblem: "img/mark_marseille.png", color: "#00a3e0" },
    { id: "lille", name: "LOSC 릴", rating: 88, emblem: "img/mark_lille.png", color: "#e01e13" },
    { id: "lyon", name: "올랭피크 리옹", rating: 87, emblem: "img/mark_lyon.png", color: "#1c2d5a" },
    { id: "nice", name: "OGC 니스", rating: 86, emblem: "img/mark_nice.png", color: "#d00027" },
    { id: "lens", name: "RC 랑스", rating: 85, emblem: "img/mark_lens.png", color: "#e30613" },
    { id: "rennes", name: "스타드 렌", rating: 85, emblem: "img/mark_rennes.png", color: "#e30613" },
    { id: "brest", name: "스타드 브레스투아 29", rating: 84, emblem: "img/mark_brest.png", color: "#da291c" },
    { id: "reims", name: "스타드 드 랭스", rating: 83, emblem: "img/mark_reims.png", color: "#d81e05" },
    { id: "toulouse", name: "툴루즈 FC", rating: 83, emblem: "img/mark_toulouse.png", color: "#542e71" },
    { id: "strasbourg", name: "RC 스트라스부르", rating: 82, emblem: "img/mark_strasbourg.png", color: "#0066b2" },
    { id: "montpellier", name: "몽펠리에 HSC", rating: 81, emblem: "img/mark_montpellier.png", color: "#002b66" },
    { id: "nantes", name: "FC 낭트", rating: 81, emblem: "img/mark_nantes.png", color: "#00843d" },
    { id: "auxerre", name: "AJ 오세르", rating: 80, emblem: "img/mark_auxerre.png", color: "#003399" },
    { id: "saint_etienne", name: "AS 생테티엔", rating: 79, emblem: "img/mark_saint_etienne.png", color: "#007a3d" }
];

// 2. 리그앙 상대팀 주요 스타 선수 프리셋 (득점왕/도움왕 시뮬레이터 연동)
const OTHER_TEAMS_PLAYERS_PRESET_LIGUE1 = [
    // 1. AS 모나코 (monaco)
    { id: "l1_monaco_1", name: "골로빈", teamId: "monaco", teamName: "AS 모나코" },
    { id: "l1_monaco_2", name: "비아르", teamId: "monaco", teamName: "AS 모나코" },
    { id: "l1_monaco_3", name: "미나미노", teamId: "monaco", teamName: "AS 모나코" },

    // 2. 올랭피크 마르세유 (marseille)
    { id: "l1_marseille_1", name: "그린우드", teamId: "marseille", teamName: "올랭피크 드 마르세유" },
    { id: "l1_marseille_2", name: "와히", teamId: "marseille", teamName: "올랭피크 드 마르세유" },
    { id: "l1_marseille_3", name: "라비오", teamId: "marseille", teamName: "올랭피크 드 마르세유" },

    // 3. LOSC 릴 (lille)
    { id: "l1_lille_1", name: "조너선 데이비드", teamId: "lille", teamName: "LOSC 릴" },
    { id: "l1_lille_2", name: "제그로바", teamId: "lille", teamName: "LOSC 릴" },

    // 4. 올랭피크 리옹 (lyon)
    { id: "l1_lyon_1", name: "라카제트", teamId: "lyon", teamName: "올랭피크 리옹" },
    { id: "l1_lyon_2", name: "미카우타제", teamId: "lyon", teamName: "올랭피크 리옹" },
    { id: "l1_lyon_3", name: "셰르키", teamId: "lyon", teamName: "올랭피크 리옹" },

    // 5. OGC 니스 (nice)
    { id: "l1_nice_1", name: "게상", teamId: "nice", teamName: "OGC 니스" },
    { id: "l1_nice_2", name: "모피", teamId: "nice", teamName: "OGC 니스" },

    // 6. RC 랑스 (lens)
    { id: "l1_lens_1", name: "소토카", teamId: "lens", teamName: "RC 랑스" },
    { id: "l1_lens_2", name: "사이드", teamId: "lens", teamName: "RC 랑스" },

    // 7. 스타드 렌 (rennes)
    { id: "l1_rennes_1", name: "칼리뮈앙도", teamId: "rennes", teamName: "스타드 렌" },
    { id: "l1_rennes_2", name: "블라스", teamId: "rennes", teamName: "스타드 렌" },

    // 8. 스타드 브레스투아 29 (brest)
    { id: "l1_brest_1", name: "델 카스티요", teamId: "brest", teamName: "스타드 브레스투아 29" },
    { id: "l1_brest_2", name: "아조르크", teamId: "brest", teamName: "스타드 브레스투아 29" },

    // 9. 스타드 드 랭스 (reims)
    { id: "l1_reims_1", name: "나카무라 케이토", teamId: "reims", teamName: "스타드 드 랭스" },
    { id: "l1_reims_2", name: "이토 준야", teamId: "reims", teamName: "스타드 드 랭스" },

    // 10. 툴루즈 FC (toulouse)
    { id: "l1_toulouse_1", name: "아부클랄", teamId: "toulouse", teamName: "툴루즈 FC" },
    { id: "l1_toulouse_2", name: "그보호", teamId: "toulouse", teamName: "툴루즈 FC" },

    // 11. RC 스트라스부르 (strasbourg)
    { id: "l1_strasbourg_1", name: "에메하", teamId: "strasbourg", teamName: "RC 스트라스부르" },
    { id: "l1_strasbourg_2", name: "바콰", teamId: "strasbourg", teamName: "RC 스트라스부르" },

    // 12. 몽펠리에 HSC (montpellier)
    { id: "l1_montpellier_1", name: "아담스", teamId: "montpellier", teamName: "몽펠리에 HSC" },
    { id: "l1_montpellier_2", name: "사바니에", teamId: "montpellier", teamName: "몽펠리에 HSC" },

    // 13. FC 낭트 (nantes)
    { id: "l1_nantes_1", name: "아블린", teamId: "nantes", teamName: "FC 낭트" },
    { id: "l1_nantes_2", name: "시몽", teamId: "nantes", teamName: "FC 낭트" },

    // 14. AJ 오세르 (auxerre)
    { id: "l1_auxerre_1", name: "시나요코", teamId: "auxerre", teamName: "AJ 오세르" },
    { id: "l1_auxerre_2", name: "트라오레", teamId: "auxerre", teamName: "AJ 오세르" },

    // 15. 앙제 SCO (angers)
    { id: "l1_angers_1", name: "압델리", teamId: "angers", teamName: "앙제 SCO" },
    { id: "l1_angers_2", name: "디엥", teamId: "angers", teamName: "앙제 SCO" },

    // 16. AS 생테티엔 (saint_etienne)
    { id: "l1_saint_etienne_1", name: "다비타슈빌리", teamId: "saint_etienne", teamName: "AS 생테티엔" },
    { id: "l1_saint_etienne_2", name: "스타생", teamId: "saint_etienne", teamName: "AS 생테티엔" },

    // 17. 르아브르 AC (le_havre)
    { id: "l1_le_havre_1", name: "카시미르", teamId: "le_havre", teamName: "르아브르 AC" },
    { id: "l1_le_havre_2", name: "투레", teamId: "le_havre", teamName: "르아브르 AC" }
];

// 3. 프랑스 리그앙 34라운드 홈/원정 대진표 (파리 생제르맹 기준)
const LIGUE1_FIXTURES = [
    // 1회차 (전반기: 라운드 1~17)
    { round: 1, opponent: "le_havre", isHome: false },
    { round: 2, opponent: "montpellier", isHome: true },
    { round: 3, opponent: "lille", isHome: false },
    { round: 4, opponent: "brest", isHome: true },
    { round: 5, opponent: "reims", isHome: false },
    { round: 6, opponent: "rennes", isHome: true },
    { round: 7, opponent: "nice", isHome: false },
    { round: 8, opponent: "strasbourg", isHome: true },
    { round: 9, opponent: "marseille", isHome: false },
    { round: 10, opponent: "lens", isHome: true },
    { round: 11, opponent: "angers", isHome: false },
    { round: 12, opponent: "toulouse", isHome: true },
    { round: 13, opponent: "nantes", isHome: true },
    { round: 14, opponent: "auxerre", isHome: false },
    { round: 15, opponent: "lyon", isHome: true },
    { round: 16, opponent: "monaco", isHome: false },
    { round: 17, opponent: "saint_etienne", isHome: true },

    // 2회차 (후반기: 라운드 18~34, 홈/원정 반대)
    { round: 18, opponent: "lens", isHome: false },
    { round: 19, opponent: "reims", isHome: true },
    { round: 20, opponent: "brest", isHome: false },
    { round: 21, opponent: "monaco", isHome: true },
    { round: 22, opponent: "toulouse", isHome: false },
    { round: 23, opponent: "lyon", isHome: false },
    { round: 24, opponent: "lille", isHome: true },
    { round: 25, opponent: "rennes", isHome: false },
    { round: 26, opponent: "marseille", isHome: true },
    { round: 27, opponent: "saint_etienne", isHome: false },
    { round: 28, opponent: "angers", isHome: true },
    { round: 29, opponent: "nantes", isHome: false },
    { round: 30, opponent: "nice", isHome: true },
    { round: 31, opponent: "strasbourg", isHome: false },
    { round: 32, opponent: "le_havre", isHome: true },
    { round: 33, opponent: "montpellier", isHome: false },
    { round: 34, opponent: "auxerre", isHome: true }
];

// 4. 리그앙 구단 기본 포메이션 프리셋
const LIGUE1_TEAM_FORMATIONS = {
    "psg": "4-3-3",
    "monaco": "4-2-3-1",
    "marseille": "4-2-3-1",
    "lille": "4-2-3-1",
    "lyon": "4-3-3",
    "nice": "3-4-3",
    "lens": "3-4-3",
    "rennes": "4-3-3",
    "brest": "4-3-3",
    "reims": "4-3-3",
    "toulouse": "3-4-3",
    "strasbourg": "3-4-3",
    "montpellier": "4-2-3-1",
    "nantes": "4-3-3",
    "auxerre": "4-2-3-1",
    "angers": "4-2-3-1",
    "saint_etienne": "4-3-3",
    "le_havre": "4-3-3"
};

// 전역 TEAM_FORMATIONS_PRESET과 자동 병합
if (typeof TEAM_FORMATIONS_PRESET !== 'undefined') {
    Object.assign(TEAM_FORMATIONS_PRESET, LIGUE1_TEAM_FORMATIONS);
}
