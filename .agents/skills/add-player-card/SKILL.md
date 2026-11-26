---
name: add-player-card
description: 신규 축구선수 카드 스펙(이름, 오버롤, 스탯, 포지션, 국적, 클럽, 이미지 등)을 기반으로 지정한 선수 사진을 WebP로 최적화 저장한 뒤 player_data.js에 카드를 등록하고, PWA 캐시 및 선수데이터.csv를 완벽하게 동기화·검증하는 워크스페이스 전용 스킬입니다.
---

# ⚽ 신규 선수 카드 등록 및 CSV 동기화 스킬 (`add-player-card`)

이 스킬은 사용자가 신규 선수 카드의 스펙(이름, 오버롤, 세부 능력치 6종, 포지션, 이미지 등)을 제공했을 때, 지정된 선수 이미지를 WebP 표준 규격으로 최적화 저장하고 `player_data.js` 데이터베이스에 카드를 표준 형식으로 추가한 뒤, 브라우저 PWA 캐시 갱신 및 `선수데이터.csv` 엑셀 시트 동기화, 회귀 테스트 검증까지 안전하게 일괄 수행하는 워크스페이스 표준 가이드입니다.

> ⚠️ **원칙**: 이 스킬의 실행 범위는 **이미지 최적화, 코드 수정, CSV 동기화 및 로컬 테스트 검증까지**입니다. Git 커밋 및 푸시는 사용자의 명시적인 요청이 있을 때만 별도로 진행합니다.

---

## 📌 1. 선수 카드 데이터 구조 및 표준 규칙

### 1) 카드 객체 필수 속성 포맷
`player_data.js` 내 `CARDS_DATABASE` 객체에 아래의 표준 구조로 등록합니다:

```javascript
    "카드ID": {
        id: "카드ID",                   // 소문자 스네이크 케이스 (예: super_son, zion_suzuki)
        name: "선수명",                 // 인게임 표시명 (예: S손흥민, 스즈키 자이온)
        playerKey: "대표선수ID",        // (동일 실존 선수의 타 클래스 카드 또는 S카드일 때 필수)
        recordName: "기록표시명",       // (동일 실존 선수의 타 클래스 카드 또는 S카드일 때 필수, 예: 손흥민)
        rating: 94,                     // 오버롤 (OVR, 정수)
        position: "LW",                 // 9대 표준 포지션 중 택1
        nation: "South Korea",          // 국가명 (영문)
        nationFlag: "https://flagcdn.com/w40/kr.png", // 국기 URL (flagcdn 2자리 소문자 국가코드)
        club: "LA FC",                  // 소속 클럽 대문자 표기
        image: "player2/선수이미지.webp", // WebP로 최적화된 실제 이미지 파일 경로
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

### 4) 이미지 최적화 및 저장 원칙 (WebP 표준 — 필수!)
1. 사용자가 지정한 이미지 파일(프로젝트 내 `player/`, `player2/` 또는 지정 경로의 `.png`, `.jpg`, `.jpeg`, `.webp` 등)의 실재를 먼저 확인합니다.
2. 지정된 이미지는 반드시 아래 **WebP 최적화 규격**으로 변환·저장합니다:
   - **해상도**: 원본 종횡비를 유지하며 **최대 변 480px 이하** (`thumbnail((480, 480), Image.Resampling.LANCZOS)`)
   - **포맷/품질**: **`WEBP`**, `quality=82`, `method=6`, **알파(투명 배경) 채널 보존** (`RGBA`/`RGB` 유지)
   - **저장 경로**: `player2/`(또는 지정 폴더)에 `.webp` 확장자로 저장 (예: `player2/S음바페.png` ➔ `player2/S음바페.webp`)
   - **원본 파일 정리**: `.webp` 변환 및 정상 열람/용량 검증 완료 후, 프로젝트 내 원본 `.png`/`.jpg`/`.jpeg` 파일은 삭제하여 대용량 미참조 파일이 남지 않게 교체합니다.
   - **`player_data.js` 등록**: `image` 필드는 반드시 최적화된 `.webp` 상대 경로(예: `"player2/S음바페.webp"`)로 기입합니다.
3. **기존 카드 이미지 교체 시 캐시 주의**:
   - `sw.js`는 이미지 전용 영구 캐시(`IMAGE_CACHE_NAME`, Cache-First)를 유지합니다.
   - 기존 카드의 이미지를 교체할 때는 가급적 기존과 다른 `.webp` 파일명으로 저장·연결하여, `IMAGE_CACHE_NAME`을 초기화하지 않고도 모든 사용자에게 새 사진이 즉시 반영되도록 합니다.

---

## 🛠️ 2. 표준 작업 절차 (SOP)

### Step 1: 선수 정보 확인 및 이미지 WebP 최적화 저장
- 요청된 오버롤과 6대 스탯(`PAC, SHO, PAS, DRI, DEF, PHY`)의 수치를 확인합니다.
- 지정된 원본 이미지 파일을 확인한 뒤 Python Pillow로 WebP 최적화 변환 및 원본 정리를 수행합니다:
  ```powershell
  $env:PYTHONUTF8=1; @'
  import os
  from PIL import Image

  src = r"player2/원본파일명.png"
  dst = r"player2/저장파일명.webp"

  with Image.open(src) as im:
      if im.mode not in ("RGBA", "RGB"):
          im = im.convert("RGBA")
      im.thumbnail((480, 480), Image.Resampling.LANCZOS)
      im.save(dst, "WEBP", quality=82, method=6)

  assert os.path.exists(dst) and os.path.getsize(dst) > 0
  if os.path.abspath(src) != os.path.abspath(dst):
      os.remove(src)
  print(f"Optimized: {dst} ({os.path.getsize(dst):,} bytes)")
  '@ | python -
  ```
- 변환된 `.webp` 파일을 `read_file` 등으로 확인해 투명 배경과 화질이 정상인지 검증합니다.

### Step 2: `player_data.js`에 카드 데이터 등록
- `player_data.js`의 `CARDS_DATABASE` 객체 마지막 위치(`};` 바로 직전)에 신규 카드 객체를 추가합니다.
- `image` 필드에 Step 1에서 생성한 `.webp` 경로를 기입합니다.
- 기존 `CARDS_DATABASE`에 동일 실존 선수의 다른 클래스 카드가 이미 있거나 슈퍼(`S` 접두어) 카드인 경우, 기존 카드와 동일한 `playerKey`와 `recordName`을 부여(기존 카드에도 누락되어 있다면 함께 부여)하여 득점·도움 기록 통합과 라인업 중복 배치 차단이 동작하도록 합니다.
- 문법 오류(쉼표 누락, 괄호 불일치)가 없는지 확인합니다.

### Step 3: PWA 캐시 및 브라우저 버전 상향 (필수!)
모바일 기기 및 브라우저에서 변경된 선수 데이터가 즉시 반영되도록 버전을 상향합니다:
1. **`index.html`**:
   `<script src="player_data.js?v=X.XX"></script>`의 쿼리 파라미터 버전을 **0.01 상향**합니다 (예: `2.09` ➔ `2.10`).
2. **`sw.js`**:
   최상단의 `CACHE_NAME = 'fc-star-vXXX'`의 버전을 **1 증가**시킵니다 (예: `'fc-star-v491'` ➔ `'fc-star-v492'`).
   *(단, `IMAGE_CACHE_NAME`은 기존 캐싱된 선수 이미지 재다운로드를 막기 위해 유지합니다.)*

### Step 4: `선수데이터.csv` 엑셀 시트 자동 동기화
`js-to-csv` 스킬의 파이썬 스크립트를 실행하여 `선수데이터.csv`를 최신화합니다:
```powershell
$env:PYTHONUTF8=1; python .agents/skills/js-to-csv/scripts/convert_js_to_csv.py -i player_data.js -o 선수데이터.csv
```
> ⚠️ **주의사항 (사용자 전용 파일 보호)**:
> - `선수데이터1.xlsx`, `선수데이터2.xlsx`, `선수데이터2.csv` 등은 사용자가 직접 편집 및 열람하는 파일이므로 **절대 수정하거나 덮어쓰지 않습니다**.
> - 오직 `선수데이터.csv`만 변환 동기화합니다.

### Step 5: 무결성 검증 (Syntax Check, 이미지 실재 검증 & Regression Tests)
수정 후 다음 검증들을 실행하여 정상 동작을 확인합니다:
1. **JS 구문 검사 및 전체 이미지 경로 실재 검증**:
   ```powershell
   node --check player_data.js
   node --check sw.js
   ```
   - `player_data.js` 내 모든 카드의 `image` 경로가 실제 디스크에 존재하는지, `.webp` 확장자인지 확인합니다.
2. **회귀 테스트 실행**:
   ```powershell
   node tests/canonical_player_identity.test.cjs
   node tests/achievements_reconciliation.test.cjs
   node tests/cloud_save_throttle.test.cjs
   node tests/position_match_goal_bonus.test.cjs
   node tests/market_mode.test.cjs
   node tests/quiz_subjective.test.cjs
   ```
   *(Node.js가 기본 PATH에 없는 경우 Playwright 내장 `%LOCALAPPDATA%\ms-playwright-go\1.57.0\node.exe` 경로 활용 가능)*

### Step 6: 작업 기록 갱신
1. **`.agents/progress.md`**: 작업 목표, 상태(완료), 주요 변경(이미지 WebP 최적화 결과, 선수 스탯, 버전, CSV 동기화) 갱신.
2. **`.agents/log.md`**: 작업 일자, 요청 요약, 이미지 최적화 전/후 용량, 등록 카드 스펙, 변경 파일, 검증 결과 기록.

---

## 🚫 3. 제외 대상 (하지 말아야 할 작업)

- **Git Commit / Push**: 사용자가 "깃 푸시해줘", "커밋해줘"라고 명시적으로 지시하기 전에는 절대 `git commit`이나 `git push`를 실행하지 않습니다.
- **xlsx 파일 수정**: `선수데이터1.xlsx`, `선수데이터2.xlsx` 파일을 임의로 변환하거나 덮어쓰지 않습니다.
- **비최적화 원본 PNG/JPG 방치**: `player/` 및 `player2/`에 WebP로 변환 완료한 원본 `.png`/`.jpg` 파일을 그대로 남겨 두지 않습니다.
