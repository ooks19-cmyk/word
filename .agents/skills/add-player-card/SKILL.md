---
name: add-player-card
description: 신규 축구선수 카드 스펙(이름, 오버롤, 스탯, 포지션, 국적, 클럽, 이미지 등)을 기반으로 player_data.js에 카드를 등록하고, PWA 캐시 및 선수데이터.csv를 완벽하게 동기화·검증하는 워크스페이스 전용 스킬입니다.
---

# ⚽ 신규 선수 카드 등록 및 CSV 동기화 스킬 (`add-player-card`)

이 스킬은 사용자가 신규 선수 카드의 스펙(이름, 오버롤, 세부 능력치 6종, 포지션, 이미지 등)을 제공했을 때, `player_data.js` 데이터베이스에 카드를 표준 형식으로 추가하고, 브라우저 PWA 캐시 갱신 및 `선수데이터.csv` 엑셀 시트 동기화, 회귀 테스트 검증까지 안전하게 일괄 수행하는 워크스페이스 표준 가이드입니다.

> ⚠️ **원칙**: 이 스킬의 실행 범위는 **코드 수정, CSV 동기화 및 로컬 테스트 검증까지**입니다. Git 커밋 및 푸시는 사용자의 명시적인 요청이 있을 때만 별도로 진행합니다.

---

## 📌 1. 선수 카드 데이터 구조 및 표준 규칙

### 1) 카드 객체 필수 속성 포맷
`player_data.js` 내 `CARDS_DATABASE` 객체에 아래의 표준 구조로 등록합니다:

```javascript
    "카드ID": {
        id: "카드ID",                   // 소문자 스네이크 케이스 (예: super_son, zion_suzuki)
        name: "선수명",                 // 인게임 표시명 (예: S손흥민, 스즈키 자이온)
        rating: 94,                     // 오버롤 (OVR, 정수)
        position: "LW",                 // 9대 표준 포지션 중 택1
        nation: "South Korea",          // 국가명 (영문)
        nationFlag: "https://flagcdn.com/w40/kr.png", // 국기 URL (flagcdn 2자리 소문자 국가코드)
        club: "LA FC",                  // 소속 클럽 대문자 표기
        image: "player2/선수이미지.png", // 실제 존재하는 이미지 파일 경로
        rarity: "super",                // 희귀도 등급 (normal, special, worldclass, legend, super)
        description: "선수 설명 문구",   // 2~3문장의 생동감 넘치는 특징 묘사
        theme: {                        // 등급별 카드 비주얼 테마
            primary: "#14002e",
            secondary: "#ff007f",
            glow: "#00f2fe"
        },
        stats: {                        // 6대 핵심 스탯 (0~99 정수)
            pac: 95,                    // 페이스 / 주력 (속도)
            sho: 95,                    // 슈팅 / 결정력
            pas: 87,                    // 패스 / 연계
            dri: 90,                    // 드리블 / 볼 컨트롤
            def: 54,                    // 수비력
            phy: 76                     // 피지컬 / 체력
        }
    }
```

### 2) 포지션 표준 가이드라인 (엄수!)
포메이션 슬롯 배치 제한 시스템과의 호환을 위해 반드시 아래 **9가지 표준 포지션** 중 하나만 사용합니다:
- **`ST`** (스트라이커 / CF 포함)
- **`LW`**, **`RW`** (측면 윙어)
- **`CAM`** (공격형 미드필더 / 인게임 UI 및 피치 슬롯에는 `AM`으로 표기됨)
- **`CM`** (중앙 미드필더 / CDM, LM, RM 범용 호환)
- **`CB`** (중앙 수비수)
- **`LB`**, **`RB`** (측면 풀백)
- **`GK`** (골키퍼)

### 3) 등급(Rarity) 및 테마 컬러 프리셋

| 희귀도 | 기준 OVR | 네이밍/특징 | Theme (primary / secondary / glow) |
| :--- | :---: | :--- | :--- |
| **`normal`** | ~84 | 일반 카드 | `#005a3c` / `#ffffff` / `#00d2ff` |
| **`special`** | 85~89 | K리그/해외파 스페셜 | `#da1a32` / `#1d2b58` / `#ff2a55` (또는 팀 고유색) |
| **`worldclass`** | 90~93 | 세계적 월드클래스 | `#000a20` / `#4facfe` / `#00f2fe` |
| **`legend`** | 89~92+ | 발롱도르/역대급 레전드 | `#000000` / `#c39e5c` / `#ffd700` |
| **`super`** | 94+ | 도전모드 보상 6각성 (S+이름) | `#14002e` / `#ff007f` / `#00f2fe` (오로라) |

### 4) 이미지 파일 탐색 원칙
1. 프로젝트 내 `player/` 및 `player2/` 폴더에서 해당 선수의 이미지 파일(`.png`, `.webp` 등)의 실제 존재 여부를 확인합니다.
2. 예: `player2/슈퍼 손흥민.png` ➔ `image: "player2/슈퍼 손흥민.png"`

---

## 🛠️ 2. 표준 작업 절차 (SOP)

### Step 1: 선수 정보 및 이미지 경로 검증
- 요청된 오버롤과 6대 스탯(`PAC, SHO, PAS, DRI, DEF, PHY`)의 수치를 확인합니다.
- `player/` 또는 `player2/` 경로에서 이미지 파일이 존재하는지 PowerShell 또는 파일 확인 도구로 검증합니다.

### Step 2: `player_data.js`에 카드 데이터 등록
- `player_data.js`의 `CARDS_DATABASE` 객체 마지막 위치(`};` 바로 직전)에 신규 카드 객체를 추가합니다.
- 문법 오류(쉼표 누락, 괄호 불일치)가 없는지 확인합니다.

### Step 3: PWA 캐시 및 브라우저 버전 상향 (필수!)
모바일 기기 및 브라우저에서 변경된 선수 데이터가 즉시 반영되도록 버전을 상향합니다:
1. **`index.html`**:
   `<script src="player_data.js?v=X.XX"></script>`의 쿼리 파라미터 버전을 **0.01 상향**합니다 (예: `1.73` ➔ `1.74`).
2. **`sw.js`**:
   최상단의 `CACHE_NAME = 'fc-star-vXXX'`의 버전을 **1 증가**시킵니다 (예: `'fc-star-v411'` ➔ `'fc-star-v412'`).

### Step 4: `선수데이터.csv` 엑셀 시트 자동 동기화
`js-to-csv` 스킬의 파이썬 스크립트를 실행하여 `선수데이터.csv`를 최신화합니다:
```powershell
$env:PYTHONUTF8=1; python .agents/skills/js-to-csv/scripts/convert_js_to_csv.py -i player_data.js -o 선수데이터.csv
```
> ⚠️ **주의사항 (사용자 전용 파일 보호)**:
> - `선수데이터1.xlsx`, `선수데이터2.xlsx`, `선수데이터2.csv` 등은 사용자가 직접 편집 및 열람하는 파일이므로 **절대 수정하거나 덮어쓰지 않습니다**.
> - 오직 `선수데이터.csv`만 변환 동기화합니다.

### Step 5: 무결성 검증 (Syntax Check & Regression Tests)
수정 후 다음 검증 명령어들을 순차 실행하여 정상 동작을 확인합니다:
1. **JS 구문 검사**:
   ```powershell
   node --check player_data.js
   node --check sw.js
   ```
2. **전체 회귀 테스트 4종 실행**:
   ```powershell
   node tests/national_mode.test.cjs
   node tests/achievements_reconciliation.test.cjs
   node tests/cloud_save_throttle.test.cjs
   node tests/position_match_goal_bonus.test.cjs
   ```
   *(Node.js가 기본 PATH에 없는 경우 Playwright 내장 `node.exe` 경로 활용 가능)*

### Step 6: 작업 기록 갱신
1. **`.agents/progress.md`**: 작업 목표, 상태(완료), 주요 변경(선수 스탯, 버전, CSV 동기화) 갱신.
2. **`.agents/log.md`**: 작업 일자, 요청 요약, 등록 카드 스펙, 변경 파일, 검증 결과 기록.

---

## 🚫 3. 제외 대상 (하지 말아야 할 작업)

- **Git Commit / Push**: 사용자가 "깃 푸시해줘", "커밋해줘"라고 명시적으로 지시하기 전에는 절대 `git commit`이나 `git push`를 실행하지 않습니다.
- **xlsx 파일 수정**: `선수데이터1.xlsx`, `선수데이터2.xlsx` 파일을 임의로 변환하거나 덮어쓰지 않습니다.
