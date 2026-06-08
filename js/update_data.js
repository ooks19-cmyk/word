// js/update_data.js - 업데이트 기록 (Release Notes) 데이터 및 렌더링 엔진

const UPDATE_LOGS = [
    {
        version: "v1.7.3",
        date: "2026.06.09",
        latest: true,
        borderColor: "#00ff87",
        titleColor: "#00ff87",
        badgeText: "LATEST",
        items: [
            "<strong>신규 친구(Friend) 탭 추가</strong>: 다른 유저를 ID로 검색하거나 전체 랭킹에서 확인하여, 해당 유저의 레벨, K리그 통산 전적(w/d/l/득실), 그리고 친선경기 전적을 실시간으로 간편하게 조회할 수 있습니다.",
            "<strong>친구 스쿼드 피치 뷰 구현</strong>: 친구가 현재 구성해둔 베스트 11 포메이션과 선수 배치 상태(OVR, 강화 등급, 포지션)를 축구 피치 레이아웃 상에서 시각적(읽기 전용)으로 살펴볼 수 있습니다."
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
