---
name: js-to-csv
description: JavaScript 데이터베이스 파일(객체 및 배열 리터럴)을 파싱하여 엑셀과 완벽히 호환되는 CSV 파일로 변환하는 범용 스킬입니다.
---

# JavaScript Data to CSV Conversion Skill (`js-to-csv`)

이 스킬은 K리그 카드 게임에서 관리되는 선수 데이터베이스(`CARDS_DATABASE`)와 상대팀 선수 프리셋(`OTHER_TEAMS_PLAYERS_PRESET`) 등의 JS 객체 리터럴 구조를 정밀하게 읽어 엑셀 호환 CSV 파일로 원클릭 변환하는 기능을 제공합니다.

## 디렉토리 구조

```
skills/js-to-csv/
  ├── SKILL.md  (본 설명서)
  └── scripts/
        └── convert_js_to_csv.py  (동적 식별 및 변환 파이썬 엔진)
```

## 사용법 및 실행 명령어

이 스킬은 Python 3 환경에서 실행 가능합니다. 파이썬의 표준 `re`, `csv` 라이브러리를 활용하므로 별도의 추가 패키지 설치(pip)가 필요 없습니다.

### 1. 선수 데이터베이스 (`player_data.js`) 변환
`player_data.js` 파일에서 전체 선수 리스트와 세부 스탯들을 추출하여 `선수데이터.csv`로 저장합니다.
```bash
python skills/js-to-csv/scripts/convert_js_to_csv.py -i player_data.js -o 선수데이터.csv
```

### 2. 상대팀 주요 선수 프리셋 (`other_teams_data.js`) 변환
`other_teams_data.js` 파일의 상대팀 라인업을 추출하여 `상대팀_주요선수.csv`로 저장합니다.
```bash
python skills/js-to-csv/scripts/convert_js_to_csv.py -i other_teams_data.js -o 상대팀_주요선수.csv
```

## 주요 특징 및 처리 기준

* **엑셀 한글 깨짐 방지**: 변환 결과물은 자동으로 `UTF-8-SIG` 인코딩으로 저장되어, 윈도우 엑셀에서 더블클릭하여 바로 오픈해도 한글 깨짐 현상이 전혀 없습니다.
* **평탄화(Flattening) 지원**: `stats: { pac: 91, sho: 89, ... }`와 같이 중첩된 구조를 해체하여 상위 컬럼명(`PAC, SHO, PAS, DRI, DEF, PHY`)으로 평탄화해 매핑합니다.
* **정합성 체크**: 파일이 누락되거나 구조가 지원하지 않는 경우 예외를 포착하여 안전하게 오류를 출력합니다.
