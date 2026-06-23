// js/update_data.js - 업데이트 기록 (Release Notes) 데이터 및 렌더링 엔진

const UPDATE_LOGS = [
    {
        version: "v2.0.0",
        date: "2026.06.23",
        latest: true,
        borderColor: "#ff3e6c",
        titleColor: "#ff3e6c",
        badgeText: "LATEST",
        items: [
            "<strong>신규 선수 카드 대거 추가 (호날두, 변준수, 홀란드, 미토마, 엔도 와타루)</strong>: 게임 다양성과 라인업 강화를 위해 5명의 핵심 선수 카드를 새롭게 추가했습니다.<br>• <strong>에를링 홀란드</strong> (OVR 91, ST, 월드클래스)<br>• <strong>크리스티아누 호날두</strong> (OVR 90, LW, 레전드)<br>• <strong>미토마 카오루</strong> (OVR 85, LW, 스페셜)<br>• <strong>엔도 와타루</strong> (OVR 85, CM, 스페셜)<br>• <strong>변준수</strong> (OVR 84, CB, 스페셜)",
            "<strong>선수 카드 정보 수정 및 밸런스 조정</strong>: 기존 등록된 선수들의 정보를 보정했습니다.<br>• <strong>김태환</strong>: 카드 설명 잘림 버그 수정.<br>• <strong>강상윤</strong>: 오버롤 81 상향 및 스페셜 등급 변경, 스탯 조정.<br>• <strong>조위제</strong>: 오버롤 83 상향 및 스페셜 등급 변경, 스탯 대폭 상향.<br>• <strong>맹성웅</strong>: 수비(DEF) 스탯 80으로 상향.",
            "<strong>매치 엔진 텍스트-기록지 통계 동기화 오류 해결</strong>: 4-3-3(타겟맨), 5-4-1(역습), 4-2-3-1(점유율) 등의 포메이션에서 중계 로그와 경기 종료 후 기록(득점자, 도움자)이 불일치하던 고질적인 엔진 매핑 오류를 실시간 추적 변수를 통해 완벽히 해결했습니다.",
            "<strong>엑셀 호환성 강화를 위한 CSV 인코딩 개선</strong>: 윈도우용 엑셀에서 <code>선수데이터.csv</code> 파일 오픈 시 한글이 깨지는 현상을 해결하기 위해 첫머리에 BOM(Byte Order Mark) 식별 바이트를 적용해 UTF-8 with BOM 형식으로 재저장했습니다."
        ]
    },
    {
        version: "v1.9.1",
        date: "2026.06.22",
        latest: false,
        borderColor: "#ffd700",
        titleColor: "#ffd700",
        badgeText: "",
        items: [
            "<strong>클라우드 동기화 안정성 강화 (데이터 덮어쓰기 방지)</strong>: 다른 기기에서 로그인 시, 클라우드의 최신 데이터를 완벽히 동기화하기 전에 로컬 캐시가 서버의 최신 데이터를 덮어쓰는 결함을 <code>isCloudDataSynced</code> 세이프가드 플래그를 도입하여 원천 해결하였습니다.",
            "<strong>오프라인 상태 게임 차단 및 세션 해제</strong>: 자동 세션 복원(자동 로그인) 시도 중 인터넷 불안정으로 인해 <code>network_error</code>가 감지되면 즉각 오프라인 상태 진입을 제한하고, 로컬 세션을 안전하게 정리한 후 로그인 화면으로 즉시 전환하여 데이터의 오염 가능성을 100% 방지했습니다."
        ]
    },
    {
        version: "v1.9.0",
        date: "2026.06.18",
        latest: false,
        borderColor: "#ffd700",
        titleColor: "#ffd700",
        badgeText: "",
        items: [
            "<strong>상대팀 최대 OVR 92 제한 (밸런스 패치)</strong>: 게임 내 모든 매치 모드(K리그1, 코리아컵, AFC 챔피언스리그, 친선전)에서 상대팀(또는 AI 봇, 타 유저)의 전력 OVR이 최대 92를 초과하지 못하도록 한계값 캡(Cap)을 적용했습니다. 이를 통해 전력 격차로 인한 급격한 난이도 상승을 방지하고 게임 밸런스를 균형 있게 조절하였습니다.",
            "<strong>양현준 스페셜 카드 신규 출시</strong>: 대한민국 국가대표팀의 차세대 윙어인 <strong>양현준</strong>(OVR 85, RW) 카드가 스페셜 등급으로 새롭게 추가되었습니다. 소속 클럽은 CELTIC으로 연동되었으며, 이미지 포맷은 <strong>webp</strong> 파일로 안전하게 결합되었습니다. 또한 사용자 요청에 맞춰 <strong>슈팅(SHO) 능력치를 82</strong>로 상향 보정하여 출시했습니다.",
            "<strong>PWA 오프라인 캐싱 최신화</strong>: 서비스 워커의 <code>CACHE_NAME</code>을 <code>'fc-star-v185'</code>로 판올림하고, <code>index.html</code> 내 로드되는 각 스크립트 자산들의 캐시 버전을 일제히 상향하여 유저 브라우저에 신규 카드 데이터 및 변경된 OVR 캡 알고리즘이 캐시 지연 없이 즉각적으로 반영되도록 개선했습니다."
        ]
    },
    {
        version: "v1.8.0",
        date: "2026.06.15",
        latest: false,
        borderColor: "#ffd700",
        titleColor: "#ffd700",
        badgeText: "",
        items: [
            "<strong>명예의 전당 하위 탭 분리 및 어려움 모드(Hard Mode) 전격 출시</strong>: 명예의 전당 탭 최상단에 일반/어려움/지옥/업적 4개의 하위 메뉴바가 신설되었습니다. 일반 모드 도중 어려움 모드 탭을 누르면 즉시 확인 팝업을 거쳐 '어려움 진입 모달'이 활성화됩니다.",
            "<strong>어려움 모드 진입 및 이적 규칙</strong>: 어려움 모드 진입 시, 현재 덱의 전체 카드 대신 오직 <strong>베스트 11 포메이션에 배치된 11명의 선수</strong> 중 <strong>정확히 3명</strong>의 카드만 선택해 어려움 모드로 보유한 채 진입할 수 있습니다. 나머지 카드 및 리그/컵/아챔 진행 상황은 전면 리셋됩니다.",
            "<strong>진입 보상 및 특전</strong>: 진입 시 선택한 3명 중 <strong>지정한 1명의 선수가 즉시 ★6 각성(최종 강화)</strong>된 상태로 시작합니다. 또한 어려움 모드 활성화 중에는 나의 덱 페이지에서 <strong>★5 각성 완료된 카드를 대상으로 '★6 강화 (10 FP)'</strong> 전용 버튼이 활성화되어 10 FP를 소모하고 ★6 강화가 가능합니다. 더불어 퀴즈 5문제 완수 보상 포인트가 기존 1 FP에서 **`2 FP`**로 상향 제공됩니다.",
            "<strong>게임 밸런스 패널티 반영</strong>: 어려움 모드 활성화 시 리그, 코리아컵, 아챔, 친선경기 전 시뮬레이션에서 플레이어의 <strong>공격 찬스 획득 확률이 5% 감소</strong>하여 적용됩니다."
        ]
    },
    {
        version: "v1.7.6",
        date: "2026.06.14",
        latest: false,
        borderColor: "#00ff87",
        titleColor: "#00ff87",
        badgeText: "",
        items: [
            "<strong>K리그1 자동 진행 (즉시 시뮬레이션) 모드 도입</strong>: 리그 매치 컨트롤 영역 하단에 즉시 완료 버튼이 추가되었습니다. 경기 수를 입력(기본 10경기)하면 딜레이 없이 단숨에 즉시 시뮬레이션을 완료하며, 경기 횟수에 비례해 팀 순위표, 골득실, 승점 및 개인 기록(득점/도움)이 완벽히 백그라운드에서 자동 연산 및 일괄 갱신됩니다.",
            "<strong>자동 진행 제약 및 안전 조건 감지</strong>: 33라운드 최종전 직전 코리아컵 및 아챔 결승전 미완료 시 경고 후 자동 진행 정지, 33라운드 초과 시 시즌 종료 자동차단, 일일 최대 경기 제한(개발자 모드 아닐 시 10경기) 도달 시 즉시 중단 기능이 안전하게 연동되었습니다.",
            "<strong>ooks 수석코치의 실시간 전술 조언 시스템 추가</strong>: 전술 조언 플로팅 버튼이 신설되었습니다. 상대 포메이션에 맞춤형 카운터 전술(3-4-3 ➔ 4-2-3-1 ➔ 5-4-1 ➔ 4-3-3 ➔ 3-4-3)을 제안하며, 무상성 구단을 상대로는 내 팀 스쿼드 완성도가 가장 높은 포메이션을 동적으로 추천합니다. 모바일 화면에서 하단 내비게이션 탭 바 영역과 겹쳐 눌리지 않던 터치 동선 최적화도 완료되었습니다.",
            "<strong>경기 엔진 밸런스 패치 및 퇴장 시스템 개편</strong>: 경기 중 4% 확률의 돌발 특수 상황에서 레드카드 퇴장 이벤트를 전격 영구 삭제하여 패널티킥 허용/획득만 50% 확률로 동등하게 발생하도록 하였습니다. 또한 승부차기(PK) 전북 현대 성공률을 70%, 상대팀 성공률을 60%로 일괄 현실화하고, 경기별 상대팀 컨디션에 따른 OVR 변동폭을 기존 -2 ~ +2에서 -1 ~ +1로 축소 안정화했습니다. 추가로, <strong>코리아컵(리그컵) 8강 진출 후 탈락 시에도 5 FP 보상</strong>이 지급되도록 보상 기준이 완화되었으며, 포메이션 간 상성 우세/열세 보너스가 기존 +-5%에서 **`+-10%`**로 대폭 상향되었습니다.",
            "<strong>신규 선수 카드 2종 공식 추가</strong>: 대한민국 국가대표(KOREA) 소속 좌측 윙백/풀백인 <strong>이태석</strong>(OVR 84, LB) 카드가 스페셜 등급으로, 대한민국 축구 영웅이자 테크니션인 <strong>안정환</strong>(OVR 89, LW) 카드가 레전드 등급으로 데이터베이스에 공식 추가되었습니다. 또한 안정환 선수는 레벨 150 달성 특별 보상 카드로 지정되어 보상 연동이 완료되었습니다."
        ]
    },
    {
        version: "v1.7.5",
        date: "2026.06.13",
        latest: false,
        borderColor: "#ffd700",
        titleColor: "#ffd700",
        badgeText: "",
        items: [
            "<strong>신규 국가대표 스페셜 카드 4종 추가 및 밸런스 조정</strong>: 대한민국 국가대표 선수인 김승규(OVR 84, GK), 이한범(OVR 83, CB), 설영우(OVR 83, RB), 백승호(OVR 84, CM) 총 4명의 스페셜 카드가 데이터베이스에 공식 추가되었습니다.",
            "<strong>선수 세부 스탯 현실화 보정</strong>: 황인범(패스 90, 드리블 89, 수비 75), 김승규(수비 86), 이한범(패스 75), 백승호(드리블 84) 등 일부 선수들의 세부 능력치가 현실적인 플레이 스타일에 맞춰 최종 보정 업데이트되었습니다."
        ]
    },
    {
        version: "v1.7.4",
        date: "2026.06.12",
        latest: false,
        borderColor: "#ffd700",
        titleColor: "#ffd700",
        badgeText: "",
        items: [
            "<strong>단어 퀴즈 당일 세트 4지선다형 객관식 모드 도입</strong>: 퀴즈 페이지 진입 시 오늘 날짜의 스케줄 세트가 활성화될 경우, 주관식 입력 폼 대신 2x2 네온 스타일의 4지선다 객관식 버튼으로 자동 전환됩니다. 정/오답 상태에 맞춰 다이내믹 네온 트랜지션 연출(그린 Sparks 효과 및 레드 Shake 진동 효과)이 작동합니다. (스케줄 미매치 시 기존 주관식으로 자동 폴백)",
            "<strong>웹/로컬 환경 Firestore 10초 타임아웃 로그인 에러 해결</strong>: 네트워크 일시적 지연으로 인해 Firestore 백엔드 응답이 10초 이상 지연될 때 클라이언트가 오프라인 모드로 갇히며 로그인이 불가능하던 문제를 완벽히 해결했습니다. 오프라인 지속성 캐시를 활성화해 타임아웃 시에도 로컬 데이터를 안전하게 대조하며, 로그인/회원가입 버튼 클릭 시 <code>enableNetwork()</code>를 강제 트리거해 즉각적으로 백엔드 서버와 실시간 소켓 재연결을 시도합니다.",
            "<strong>매치 시뮬레이터 전술적합 보너스 밸런스 조정</strong>: 포메이션 세부 전술 적용 시 계산되던 전술적합 보너스 비율을 게임 밸런스 조율을 위해 기준치 초과 능력치당 기존 1.0%에서 <strong>0.5%</strong>로 하향 조정했습니다."
        ]
    },
    {
        version: "v1.7.3",
        date: "2026.06.09",
        latest: false,
        borderColor: "#ffd700",
        titleColor: "#ffd700",
        badgeText: "",
        items: [
            "<strong>신규 친구(Friend) 탭 추가</strong>: 다른 유저를 ID로 검색하거나 전체 랭킹에서 확인하여, 해당 유저의 레벨, K리그 통산 전적(w/d/l/득실), 그리고 친선경기 전적을 실시간으로 간편하게 조회할 수 있습니다.",
            "<strong>친구 스쿼드 피치 뷰 구현</strong>: 친구가 현재 구성해둔 베스트 11 포메이션과 선수 배치 상태(OVR, 강화 등급, 포지션)를 축구 피치 레이아웃 상에서 시각적(읽기 전용)으로 살펴볼 수 있습니다.",
            "<strong>레벨업 보상 라인업 확장</strong>: 레벨 140 달성 특별 보상으로 젊은 시절의 전설적인 스트라이커 <strong>'이동국99'</strong> 스페셜 카드가 새롭게 추가되었습니다. 이에 따라 10레벨 단위 5 FP(포인트) 보상 구간은 레벨 150 이상부터 적용되도록 조정되었습니다."
        ]
    },
    {
        version: "v1.7.2",
        date: "2026.06.08",
        latest: false,
        borderColor: "#ffd700",
        titleColor: "#ffd700",
        badgeText: "",
        items: [
            "<strong>신규 스페셜 카드 추가 (이동국99)</strong>: 1999년도 K리그에 혜성처럼 등장해 센세이션을 일으킨 포항 스틸러스 시절의 젊은 이동국 선수가 스페셜 카드로 추가되었습니다. 리그 신인왕과 득점왕을 향해 질주하던 압도적인 피지컬과 폭발적인 슈팅력이 스펙에 고스란히 반영되었습니다."
        ]
    },
    {
        version: "v1.7.1",
        date: "2026.06.07",
        latest: false,
        borderColor: "#ffd700",
        titleColor: "#ffd700",
        badgeText: "",
        items: [
            "<strong>신규 선수 카드 데이터베이스 추가</strong>: 제시 린가드(OVR 85, LW), 세징야(OVR 85, CAM), 무고사(OVR 83, ST), 송민규(OVR 83, LW) 총 4명의 K리그 인기 선수가 신규 카드로 추가되었습니다. (세징야 선수는 webp 이미지 연동)",
            "<strong>공격형 미드필더(CAM) 포지션 배치 제한 완화</strong>: 전술 판에서 CAM 속성의 선수를 측면 공격수/윙어(LW, RW, LM, RM) 및 중앙 미드필더(CM, LCM, RCM, DM) 위치에 유연하게 기용할 수 있도록 배치 규칙을 개선했습니다.",
            "<strong>레벨업 보상 시스템 확장</strong>: 레벨 130 달성 특별 보상으로 '세징야' 선수 카드가 신규 지정되었습니다. 더불어 레벨 140부터는 10레벨 업마다 선수 카드 대신 5 FP(포인트)를 즉시 보상받도록 확장되었습니다.",
            "<strong>선수 정보 현실화 및 스탯 보정</strong>: 황희찬 선수의 기본 포지션이 ST에서 LW(윙어)로 현실화되었으며, 무고사(슈팅 87), 세징야(속도 83, 슈팅 86, 드리블 86), 송민규(슈팅 82, 패스 78, 드리블 85) 등 일부 능력치가 최신 밸런스에 맞춰 조정되었습니다."
        ]
    },
    {
        version: "v1.7.0",
        date: "2026.06.07",
        latest: false,
        borderColor: "#ffd700",
        titleColor: "#ffd700",
        badgeText: "",
        items: [
            "<strong>AFC 챔피언스리그 (아챔) 모드 정식 출시</strong>: K리그 1~3위(플레이어 고정 포함) 진출 구단 및 일본, 중국, 태국의 강호들로 구성된 동아시아 8팀 브라켓과 알 힐랄, 알 나스르 등 중동 명문 클럽들로 구성된 서아시아 8팀 브라켓이 격돌하는 토너먼트 모드가 신설되었습니다.",
            "<strong>동-서아시아 4강(준결승) 크로스 매칭</strong>: 16강과 8강은 동/서 권역별로 자체 진행되며, 4강 준결승 단계부터 각 권역의 생존 구단들이 교차 매칭하여 결승전 진출을 다투는 사실적인 토너먼트 규칙을 반영했습니다.",
            "<strong>아챔 매치 OVR 밸런스 룰렛 적용</strong>: 아챔 시작 시 상대팀 OVR이 전북 현대 OVR 기준 +-2 범위 내에서 도전적으로 동적 조정되어 쫄깃한 난이도를 보장합니다. (K리그 상대팀 OVR은 리그 현재 세팅 연동)",
            "<strong>아챔 전용 보상 포인트(FP) 테이블 설계</strong>: 8강/4강 진출(탈락) 시 10 FP, 결승전 준우승 시 15 FP, 최종 우승 시 20 FP의 풍성한 보상 룰이 새롭게 도입되었습니다.",
            "<strong>아챔 구단별 전용 브랜드 컬러 엠블럼 매핑</strong>: 중동 및 아시아 각 명문 구단의 아이덴티티가 담긴 브랜드 쉴드 엠블럼을 UI 대진표에 탑재해 시각적 완성도를 극대화했습니다."
        ]
    },
    {
        version: "v1.6.1",
        date: "2026.06.06",
        latest: false,
        borderColor: "#ffd700",
        titleColor: "#ffd700",
        badgeText: "",
        items: [
            "<strong>3-4-3 포메이션 포지션 표기 및 배치 규칙 오류 수정</strong>: 3-4-3 전술 배치 시 중앙 수비수가 LCM으로 표기되던 오류를 CB로 수정하고, 미드필더 좌우 날개 자리가 LB/RB로 표기되던 오류를 CM으로 수정하여 포지션 적합성 검사 및 카드 배치 드로어가 정상 동작하도록 수정하였습니다."
        ]
    },
    {
        version: "v1.6.0",
        date: "2026.06.06",
        latest: false,
        borderColor: "#ffd700",
        titleColor: "#ffd700",
        badgeText: "",
        items: [
            "<strong>공통 전술 및 매치 엔진 최적화</strong>: 리그, 코리아컵, 친선경기 모드 전체에 중속 적용되던 전술 연산(OVR 보너스, 세부 전술, 전술 적합성 분석) 코드를 하나의 중앙 공통 엔진(`match_algorithm.js`)으로 리팩토링 및 통합하여 성능과 가동 효율을 개선하였습니다.",
            "<strong>전북 현대 주요 공격수 스탯 업데이트</strong>: 핵심 공격 자원의 슈팅(SHO) 능력치를 5씩 상향 업데이트하여 전방 파괴력을 보강하였습니다. (대상 선수: 김승섭 LW 74→79, 이동준 RW 72→77, 전진우 LW 75→80)"
        ]
    },
    {
        version: "v1.5.0",
        date: "2026.06.05",
        latest: false,
        borderColor: "#ffd700",
        titleColor: "#ffd700",
        badgeText: "",
        items: [
            "<strong>경기 문자중계 진행 속도 최적화</strong>: 경기 문자중계 및 시뮬레이션 소요 시간을 기존 10초에서 15초로 연장하여, 경기 흐름 파악을 더 쉽게 하고 몰입감 넘치는 상세한 경기 상황 묘사를 제공하도록 개선했습니다."
        ]
    },
    {
        version: "v1.4.0",
        date: "2026.06.04",
        latest: false,
        borderColor: "#ffd700",
        titleColor: "#ffd700",
        badgeText: "",
        items: [
            "<strong>K리그 득점/도움 순위 집계 정상화</strong>: K리그 1 참가 구단(12개 팀) 소속 선수들만 순위표에 오르도록 해외 가상 구단 및 K리그 2 비활성 구단 필터 적용 및 기존 레거시 데이터 자동 클린업 적용.",
            "<strong>업데이트 기록 모달 추가</strong>: 메인 상단 전북 현대 엠블럼 클릭 시 업데이트 로그 조회 기능 신설.",
            "<strong>신규 스페셜 카드 및 레벨 90 보상 추가</strong>: 옌스(OVR 85, CM), 이동경(OVR 86, CM) 스페셜 등급 선수를 데이터베이스에 추가하고, 이동경 선수를 레벨 90 달성 특별 보상 카드로 적용 완료."
        ]
    },
    {
        version: "v1.3.0",
        date: "2026.06.03",
        latest: false,
        borderColor: "#a55eea",
        titleColor: "#a55eea",
        badgeText: "",
        items: [
            "<strong>상대방 득점자/도움자 실명 중계</strong>: 문자 중계 코멘터리에 상대 선수의 실명(이동경, 세징야 등) 및 패널티킥 실명 키커 노출 구현.",
            "<strong>코리아컵(리그컵) 및 연장 극장골 연동</strong>: 컵 대회 득점/도움 기록 내 상대 구단 주요 선수 실명 완벽 적재.",
            "<strong>상대팀 주요 선수 CSV 데이터 구축</strong>: K리그 및 해외 구단 총 20개 상대팀 에이스/미드필더 핵심 데이터셋 코딩 완료."
        ]
    },
    {
        version: "v1.2.0",
        date: "2026.05.28",
        latest: false,
        borderColor: "#94a3b8",
        titleColor: "#94a3b8",
        badgeText: "",
        items: [
            "<strong>친선 매칭 해외 명문 구단 결합</strong>: LA FC(손흥민), PSG(이강인), 아스날(사카), 레알 마드리드(음바페), 토쿄FC(마츠키) 등 해외 5개 가상 구단 연동.",
            "<strong>동적 OVR 밸런스 조정</strong>: 내 스쿼드 평균 OVR 대비 +-2 범위의 상대팀 OVR 동적 난이도 매칭 탑재."
        ]
    },
    {
        version: "v1.1.0 이전",
        date: "이전 버전",
        latest: false,
        borderColor: "#94a3b8",
        titleColor: "#94a3b8",
        badgeText: "",
        items: [
            "<strong>단어 퀴즈 시스템 개편</strong>: TTS 원어민 자동 발음 기능 및 패스(Pass) 시 정답 피드백 뷰 추가.",
            "<strong>선수단 등번호(Squad Number) 설정</strong>: 포메이션 화면 피치 하단에서 등번호 자동/수동 커스텀 설정 기능 신설.",
            "<strong>PWA 및 모바일 터치 최적화</strong>: 모바일 홈 화면 설치(Manifest) 대응 및 터치 감도 보정."
        ]
    }
];

function renderUpdateLogs() {
    const container = document.querySelector('#updateLogModal .drawer-content');
    if (!container) return;

    container.innerHTML = UPDATE_LOGS.map(entry => {
        const badgeHtml = entry.badgeText 
            ? `<span style="font-size: 0.75rem; background: rgba(0, 255, 135, 0.15); padding: 0.1rem 0.4rem; border-radius: 6px; margin-left: 6px; color: ${entry.titleColor};">${entry.badgeText}</span>` 
            : "";
            
        const itemsHtml = entry.items.map(item => `<li>${item}</li>`).join('');

        return `
            <div class="update-entry" style="border-left: 3px solid ${entry.borderColor}; padding-left: 0.8rem;">
                <h4 style="font-size: 0.95rem; font-weight: 800; color: ${entry.titleColor}; margin: 0 0 0.4rem 0; display: flex; justify-content: space-between; align-items: center;">
                    <span>${entry.version}${badgeHtml}</span>
                    <span style="font-size: 0.75rem; color: #64748b; font-weight: normal;">${entry.date}</span>
                </h4>
                <ul style="margin: 0; padding-left: 1.1rem; font-size: 0.82rem; line-height: 1.5; color: #cbd5e1;">
                    ${itemsHtml}
                </ul>
            </div>
        `;
    }).join('');
}

// 돔 로드 완료 시 즉시 렌더링
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderUpdateLogs);
} else {
    renderUpdateLogs();
}
