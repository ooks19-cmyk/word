/**
 * K League & Friendly Overseas Teams Key Player Data Preset (2026 Updated)
 * Used for simulating other teams' goal & assist scorers dynamically.
 */
const OTHER_TEAMS_PLAYERS_PRESET = [
    // 1. 울산 HD (ulsan)
    { id: "ulsan_player_1", name: "이동경", teamId: "ulsan", teamName: "울산 HD" },
    { id: "ulsan_player_2", name: "말컹", teamId: "ulsan", teamName: "울산 HD" },
    
    // 2. FC 서울 (seoul)
    { id: "seoul_player_1", name: "송민규", teamId: "seoul", teamName: "FC 서울" },
    { id: "seoul_player_2", name: "안데르손", teamId: "seoul", teamName: "FC 서울" },
    
    // 3. 포항 스틸러스 (pohang)
    { id: "pohang_player_1", name: "이호재", teamId: "pohang", teamName: "포항 스틸러스" },
    
    // 4. 강원 FC (gangwon)
    { id: "gangwon_player_1", name: "모재현", teamId: "gangwon", teamName: "강원 FC" },
    
    // 5. 광주 FC (gwangju)
    { id: "gwangju_player_1", name: "프리드욘슨", teamId: "gwangju", teamName: "광주 FC" },
    { id: "gwangju_player_2", name: "신창무", teamId: "gwangju", teamName: "광주 FC" },
    
    // 6. 김천 상무 (gimcheon)
    { id: "gimcheon_player_1", name: "고재현", teamId: "gimcheon", teamName: "김천 상무" },
    { id: "gimcheon_player_2", name: "이건희", teamId: "gimcheon", teamName: "김천 상무" },
    
    // 7. 부천 FC (bucheon_fc)
    { id: "bucheon_player_1", name: "윤빛가람", teamId: "bucheon_fc", teamName: "부천 FC" },
    { id: "bucheon_player_2", name: "갈레고", teamId: "bucheon_fc", teamName: "부천 FC" },
    
    // 8. 제주 유나이티드 (jeju)
    { id: "jeju_player_1", name: "남태희", teamId: "jeju", teamName: "제주 유나이티드" },
    
    // 9. 대전 하나 (daejeon)
    { id: "daejeon_player_1", name: "주민규", teamId: "daejeon", teamName: "대전 하나" },
    { id: "daejeon_player_2", name: "마사", teamId: "daejeon", teamName: "대전 하나" },
    
    // 10. FC 안양 (anyang)
    { id: "anyang_player_1", name: "아일톤", teamId: "anyang", teamName: "FC 안양" },
    { id: "anyang_player_2", name: "토마스", teamId: "anyang", teamName: "FC 안양" },
    
    // 11. 인천 유나이티드 (incheon)
    { id: "incheon_player_1", name: "무고사", teamId: "incheon", teamName: "인천 유나이티드" },
    { id: "incheon_player_2", name: "제르소", teamId: "incheon", teamName: "인천 유나이티드" },
    
    // 12. 수원삼성 (suwon_samsung)
    { id: "suwon_player_1", name: "일류첸코", teamId: "suwon_samsung", teamName: "수원삼성" },
    { id: "suwon_player_2", name: "파올리뉴", teamId: "suwon_samsung", teamName: "수원삼성" },
    
    // 13. 대구FC (daegu_fc)
    { id: "daegu_player_1", name: "세징야", teamId: "daegu_fc", teamName: "대구FC" },
    { id: "daegu_player_2", name: "에드가", teamId: "daegu_fc", teamName: "대구FC" },    

    // 14. 부산 (busan_ipark) - 주요선수 미지정으로 기본 봇 선수 매핑
    { id: "busan_player_default_1", name: "가브리엘", teamId: "busan_ipark", teamName: "부산" },
    { id: "busan_player_default_2", name: "크리스찬", teamId: "busan_ipark", teamName: "부산" },
    
    // 15. 서울E (seoul_e_land) - 주요선수 미지정으로 기본 봇 선수 매핑
    { id: "seoule_player_default_1", name: "박재용", teamId: "seoul_e_land", teamName: "서울E" },
    { id: "seoule_player_default_2", name: "에울레르", teamId: "seoul_e_land", teamName: "서울E" },
    
    // 16. LA FC (virtual_la_fc)
    { id: "virtual_la_fc_player_1", name: "손흥민", teamId: "virtual_la_fc", teamName: "LA FC" },
    { id: "virtual_la_fc_player_2", name: "부앙가", teamId: "virtual_la_fc", teamName: "LA FC" },
    
    // 17. PSG (virtual_psg)
    { id: "virtual_psg_player_1", name: "이강인", teamId: "virtual_psg", teamName: "PSG" },
    
    // 18. 아스날 (virtual_아스날)
    { id: "virtual_arsenal_player_1", name: "사카", teamId: "virtual_아스날", teamName: "아스날" },
    
    // 19. 레알마드리드 (virtual_레알마드리드)
    { id: "virtual_real_madrid_player_1", name: "음바페", teamId: "virtual_레알마드리드", teamName: "레알마드리드" },
    
    // 20. 토쿄FC (virtual_토쿄fc)
    { id: "virtual_tokyo_fc_player_1", name: "마츠키", teamId: "virtual_토쿄fc", teamName: "토쿄FC" },
    
    // 21. 비셀 고베 (vissel_kobe)
    { id: "vissel_kobe_player_1", name: "오사코", teamId: "vissel_kobe", teamName: "비셀 고베" },
    { id: "vissel_kobe_player_2", name: "무토", teamId: "vissel_kobe", teamName: "비셀 고베" },
    
    // 22. 요코하마 마리노스 (yokohama_marinos)
    { id: "yokohama_marinos_player_1", name: "에우베르", teamId: "yokohama_marinos", teamName: "요코하마 마리노스" },
    { id: "yokohama_marinos_player_2", name: "로페즈", teamId: "yokohama_marinos", teamName: "요코하마 마리노스" },
    
    // 23. 가와사키 프론탈레 (kawasaki_frontale)
    { id: "kawasaki_frontale_player_1", name: "이에나가", teamId: "kawasaki_frontale", teamName: "가와사키 프론탈레" },
    { id: "kawasaki_frontale_player_2", name: "와키자카", teamId: "kawasaki_frontale", teamName: "가와사키 프론탈레" },
    
    // 24. 상하이 포트 (shanghai_port)
    { id: "shanghai_port_player_1", name: "오스카", teamId: "shanghai_port", teamName: "상하이 포트" },
    { id: "shanghai_port_player_2", name: "바르가스", teamId: "shanghai_port", teamName: "상하이 포트" },
    
    // 25. FC 부리람 (buriram_united)
    { id: "buriram_united_player_1", name: "차이뎃", teamId: "buriram_united", teamName: "FC 부리람" },
    { id: "buriram_united_player_2", name: "두가우", teamId: "buriram_united", teamName: "FC 부리람" },
    
    // 26. 알 힐랄 (al_hilal)
    { id: "al_hilal_player_1", name: "미트로비치", teamId: "al_hilal", teamName: "알 힐랄" },
    { id: "al_hilal_player_2", name: "말콤", teamId: "al_hilal", teamName: "알 힐랄" },
    { id: "al_hilal_player_3", name: "네베스", teamId: "al_hilal", teamName: "알 힐랄" },
    
    // 27. 알 나스르 (al_nassr)
    { id: "al_nassr_player_1", name: "호날두", teamId: "al_nassr", teamName: "알 나스르" },
    { id: "al_nassr_player_2", name: "마네", teamId: "al_nassr", teamName: "알 나스르" },
    { id: "al_nassr_player_3", name: "브로조비치", teamId: "al_nassr", teamName: "알 나스르" },
    
    // 28. 알 아흘리 (al_ahli)
    { id: "al_ahli_player_1", name: "토니", teamId: "al_ahli", teamName: "알 아흘리" },
    { id: "al_ahli_player_2", name: "피르미누", teamId: "al_ahli", teamName: "알 아흘리" },
    { id: "al_ahli_player_3", name: "마레즈", teamId: "al_ahli", teamName: "알 아흘리" },
    
    // 29. 알 이티하드 (al_itihad)
    { id: "al_itihad_player_1", name: "벤제마", teamId: "al_itihad", teamName: "알 이티하드" },
    { id: "al_itihad_player_2", name: "캉테", teamId: "al_itihad", teamName: "알 이티하드" },
    { id: "al_itihad_player_3", name: "디아비", teamId: "al_itihad", teamName: "알 이티하드" },
    
    // 30. 알 아인 (al_ain)
    { id: "al_ain_player_1", name: "라히미", teamId: "al_ain", teamName: "알 아인" },
    { id: "al_ain_player_2", name: "카쿠", teamId: "al_ain", teamName: "알 아인" },
    
    // 31. 알 사드 (al_sadd)
    { id: "al_sadd_player_1", name: "아피프", teamId: "al_sadd", teamName: "알 사드" },
    { id: "al_sadd_player_2", name: "무히카", teamId: "al_sadd", teamName: "알 사드" },
    
    // 32. 페르세폴리스 (persepolis)
    { id: "persepolis_player_1", name: "알리푸르", teamId: "persepolis", teamName: "페르세폴리스" },
    { id: "persepolis_player_2", name: "아미리", teamId: "persepolis", teamName: "페르세폴리스" },
    
    // 33. 파흐타코르 (pakhtakor)
    { id: "pakhtakor_player_1", name: "체란", teamId: "pakhtakor", teamName: "파흐타코르" },
    { id: "pakhtakor_player_2", name: "소비르호자예브", teamId: "pakhtakor", teamName: "파흐타코르" }
];

const ACL_TEAMS_PRESET = [
    // 동아시아 5팀 (플레이어 전북현대 + 다른 K리그 2팀은 런타임에 동기화/추출됨)
    { id: "vissel_kobe", name: "비셀 고베", rating: 77, color: "#800020" },
    { id: "yokohama_marinos", name: "요코하마 마리노스", rating: 76, color: "#2563eb" },
    { id: "kawasaki_frontale", name: "가와사키 프론탈레", rating: 75, color: "#38bdf8" },
    { id: "shanghai_port", name: "상하이 포트", rating: 74, color: "#dc2626" },
    { id: "buriram_united", name: "FC 부리람", rating: 70, color: "#1e3a8a" },
    
    // 서아시아 8팀
    { id: "al_hilal", name: "알 힐랄", rating: 81, color: "#004baf" },
    { id: "al_nassr", name: "알 나스르", rating: 80, color: "#fbbf24" },
    { id: "al_ahli", name: "알 아흘리", rating: 78, color: "#10b981" },
    { id: "al_itihad", name: "알 이티하드", rating: 77, color: "#f59e0b" },
    { id: "al_ain", name: "알 아인", rating: 76, color: "#7c3aed" },
    { id: "al_sadd", name: "알 사드", rating: 75, color: "#f3f4f6" },
    { id: "persepolis", name: "페르세폴리스", rating: 74, color: "#ef4444" },
    { id: "pakhtakor", name: "파흐타코르", rating: 71, color: "#ea580c" }
];

const TEAM_FORMATIONS_PRESET = {
    // K리그 1
    "jeonbuk": "4-3-3",
    "ulsan": "4-2-3-1",
    "seoul": "3-4-3", // 피드백 반영: 서울 3-4-3 설정
    "pohang": "5-4-1",
    "gangwon": "3-4-3",
    "gwangju": "4-3-3",
    "gimcheon": "4-4-2",
    "bucheon_fc": "3-4-3",
    "jeju": "5-4-1",
    "daejeon": "4-2-3-1",
    "anyang": "4-4-2",
    "incheon": "5-4-1",
    
    // 코리아컵 K리그 2 추가 구단
    "suwon_samsung": "4-2-3-1",
    "daegu_fc": "3-4-3",
    "busan_ipark": "4-3-3",
    "seoul_e_land": "4-4-2",
    
    // 아챔 해외 팀 프리셋
    "vissel_kobe": "4-3-3",
    "yokohama_marinos": "4-2-3-1",
    "kawasaki_frontale": "4-3-3",
    "shanghai_port": "3-4-3",
    "buriram_united": "5-4-1",
    "al_hilal": "4-2-3-1",
    "al_nassr": "4-3-3",
    "al_ahli": "4-2-3-1",
    "al_itihad": "3-4-3",
    "al_ain": "4-2-3-1",
    "al_sadd": "5-4-1",
    "persepolis": "4-4-2",
    "pakhtakor": "4-4-2"
};
