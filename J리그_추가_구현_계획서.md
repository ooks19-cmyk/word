# J리그 추가 구현 계획서 (옵션 A - 플러그인 방식)

## 1. 전제: 기존 코드 분석 결과

코드베이스를 전수 조사한 결과, EPL 추가 당시 데이터가 뒤섞인 핵심 원인이 3곳에 있습니다.

### ⚠️ 문제 위치 1 — `js/league.js` 296~300번째 줄
```js
// 현재 리그가 아닌 "다른 리그"를 2개 중 1개로 하드코딩
const otherLeagueId = (config.id === 'epl') ? 'kleague1' : 'epl';
```
**→ J리그(`jleague`)가 추가되면 이 코드는 jleague인데 epl이라고 잘못 백업합니다.**

### ⚠️ 문제 위치 2 — `js/auth.js` 111번째 줄
```js
// jleague를 허용하지 않아 클라우드 저장 시 kleague1로 강제 되돌림
const activeLeague = (currentLeagueId === 'epl' || currentLeagueId === 'kleague1') 
    ? currentLeagueId : 'kleague1';
```

### ⚠️ 문제 위치 3 — `js/auth.js` 647번째 줄
```js
// 클라우드 로드 시 jleague는 kleague1로 강제 리셋
if (userData.currentLeagueId && 
    (userData.currentLeagueId === 'kleague1' || userData.currentLeagueId === 'epl')) {
    currentLeagueId = userData.currentLeagueId;
} else {
    currentLeagueId = 'kleague1'; // ← jleague는 여기서 무조건 리셋됨
}
```

---

## 2. 플레이어 기본 구단 및 라인업 확정

- **플레이어 기본 구단**: **FC 도쿄 (`tokyo`)** (초기 OVR 70)
- **엠블럼**: `img/mark_tokyo.png`
- **J1리그 12개 참여 구단 (초기 능력치 예시)**:
  1. **FC 도쿄** (`tokyo`, 유저팀, OVR 70)
  2. **비셀 고베** (`kobe`, OVR 81)
  3. **산프레체 히로시마** (`hiroshima`, OVR 80)
  4. **마치다 젤비아** (`machida`, OVR 79)
  5. **가시마 앤틀러스** (`kashima`, OVR 78)
  6. **감바 오사카** (`gamba`, OVR 77)
  7. **요코하마 F. 마리노스** (`marinos`, OVR 77)
  8. **우라와 레즈** (`urawa`, OVR 76)
  9. **세레소 오사카** (`cerezo`, OVR 75)
  10. **도쿄 베르디** (`verdy`, OVR 74)
  11. **가와사키 프론탈레** (`kawasaki`, OVR 73)
  12. **나고야 그램퍼스** (`nagoya`, OVR 72)

---

## 3. 구현 계획 (5개 파일 수정 + 1개 파일 신규)

### [1단계] 데이터 파일 신규 생성 ✦ 가장 먼저

#### [NEW] `other_teams_data_jleague.js`
J리그 전용 데이터를 완전히 독립된 파일 하나에 모두 담습니다.

- `J_LEAGUE_TEAMS_PRESET`: 12개 구단 (유저팀 FC 도쿄 `tokyo`, OVR 70 스타트)
- `J_LEAGUE_FIXTURES`: 33라운드 홈/원정 대진표 (FC 도쿄 기준)
- `CUP_TEAMS_PRESET_JLEAGUE`: FA컵 16개 참여 구단
- `OTHER_TEAMS_PLAYERS_PRESET_JLEAGUE`: 각 구단 주요 선수 1~2명 (득점 시뮬레이터용)

---

### [2단계] 리그 엔진 업데이트

#### [MODIFY] `js/league.js` — 4곳 수정

**① `LEAGUE_CONFIGS`에 jleague 설정 추가** (57번째 줄 직후)
```js
jleague: {
    id: 'jleague',
    name: 'J1리그',
    shortName: 'J1',
    seasonPrefix: 'J1리그',
    totalRounds: 33,
    userTeamId: 'tokyo',
    userTeamName: 'FC 도쿄',
    userTeamEmblem: 'img/mark_tokyo.png',
    get teamsPreset() { return J_LEAGUE_TEAMS_PRESET; },
    get playersPreset() { return OTHER_TEAMS_PLAYERS_PRESET_JLEAGUE; },
    get fixtures() { return J_LEAGUE_FIXTURES; },
    themeColor: '#001c58',
    accentColor: '#e60012',
    strongTeams: ['kobe', 'hiroshima', 'machida', 'marinos']
}
```

**② `checkAndMigrateLeagueTeams()`의 하드코딩 백업 로직 수정** (300번째 줄)
```js
// 기존 (문제 있는 코드)
const otherLeagueId = (config.id === 'epl') ? 'kleague1' : 'epl';

// 변경 후 (모든 리그 자동 감지)
const detectedOtherLeagueId = Object.keys(LEAGUE_CONFIGS).find(lid => {
    if (lid === config.id) return false;
    const otherCfg = LEAGUE_CONFIGS[lid];
    return leagueTeams.some(t => t && t.id === otherCfg.userTeamId);
});
if (detectedOtherLeagueId) {
    localStorage.setItem(`fc_star_league_teams_${detectedOtherLeagueId}`, 
        JSON.stringify(leagueTeams));
}
```

**③ `getTeamEmblemPath()`에 J리그 구단 엠블럼 매핑 추가** (797번째 줄 직전)
```js
// J리그 엠블럼 추가
"tokyo": "img/mark_tokyo.png",
"kobe": "img/mark_kobe.png",
"hiroshima": "img/mark_hiroshima.png",
"machida": "img/mark_machida.png",
// ... 나머지 J리그 구단들
```

**④ `openLeagueTransferModal()`에 J리그 카드 UI 상태 동기화 추가** (2736번째 줄)
- 현재 K리그/EPL 2개 이분법 → 3-way 분기로 확장

---

### [3단계] 컵대회 및 아시아챔피언스리그 엔진 업데이트

#### [MODIFY] `js/cup.js` — 헬퍼 함수 4곳 수정
- **`getActiveCupTournamentName()`** — J리그 시 "FA 컵" 반환
- **`getActiveCupUserTeamId()`** — J리그 시 `tokyo` 반환  
- **`getActiveCupTeamsPreset()`** — J리그 시 `CUP_TEAMS_PRESET_JLEAGUE` 반환  
- **`getActiveCupPlayersPreset()`** — J리그 선수 프리셋 반환

#### [MODIFY] `js/acl.js` — 3곳 수정
- J리그 소속일 때도 아시아 챔피언스리그(ACL) 진출 및 참가 처리 (EPL의 UCL과 구분)

---

### [4단계] 클라우드 동기화 업데이트

#### [MODIFY] `js/auth.js` — 3곳 수정

**① 로컬 저장 시 jleague 허용** (111번째 줄)
```js
const activeLeague = (typeof LEAGUE_CONFIGS !== 'undefined' && LEAGUE_CONFIGS[currentLeagueId]) 
    ? currentLeagueId : 'kleague1';
```

**② 클라우드 세이브에 J리그 데이터 필드 추가** (~249번째 줄)
```js
leagueTeamsJLeague: (() => {
    try {
        const d = localStorage.getItem('fc_star_league_teams_jleague');
        if (d) return JSON.parse(d);
        if (currentLeagueId === 'jleague') return leagueTeams;
        return null;
    } catch(e) { return null; }
})(),
leagueRoundJLeague: ...,
leaguePlayerStatsJLeague: ...,
```

**③ 클라우드 로드 시 jleague 유효 리그로 인정** (647번째 줄)
```js
const validLeagues = Object.keys(LEAGUE_CONFIGS);
if (userData.currentLeagueId && validLeagues.includes(userData.currentLeagueId)) {
    currentLeagueId = userData.currentLeagueId;
} else {
    currentLeagueId = 'kleague1';
}
```

---

### [5단계] 감독 이적 모달 UI 및 index.html 스크립트 추가

#### [MODIFY] `index.html`
1. `<script src="other_teams_data_jleague.js"></script>` 추가
2. 감독 이적 모달에 J1리그 선택 카드 추가

---

## 4. 파일별 작업 요약표

| 파일 | 작업 | 기존 K리그/EPL 영향 |
|:---|:---|:---|
| `other_teams_data_jleague.js` | ✨ 신규 생성 | **없음** |
| `js/league.js` | 🔧 4곳 수정 | ⚠️ 백업 로직 1줄 수정 (안전) |
| `js/cup.js` | 🔧 4곳 수정 | ✅ 기존 분기에 줄 하나 추가 |
| `js/acl.js` | 🔧 3곳 수정 (J리그도 아챔) | ✅ 기존 분기에 줄 하나 추가 |
| `js/auth.js` | 🔧 3곳 수정 | ⚠️ 허용 리그 ID 1줄 수정 (안전) |
| `index.html` | 🔧 스크립트 로드 및 모달 카드 추가 | ✅ 기존 UI 건드리지 않음 |

---

## 5. 데이터 격리 보장 체계

J리그 진행 시 모든 데이터는 `_jleague` suffix 키로 독립 저장됩니다:

```
로컬스토리지                       Firestore 클라우드
fc_star_league_teams_jleague  →  leagueTeamsJLeague
fc_star_league_round_jleague  →  leagueRoundJLeague
fc_star_cup_state_jleague     →  cupStateJLeague
fc_star_acl_state_jleague     →  aclStateJLeague
```

K리그(`_kleague1`)와 EPL(`_epl`) 키는 **단 한 글자도 공유하지 않습니다.**
