---
name: add-quiz-words
description: WORD 폴더의 교재 단어 이미지나 신규 단어 목록을 기반으로 날짜별 퀴즈 스케줄러(quiz_data.js)에 등록하고 가이드, PWA 캐시 및 버전을 완벽하게 동기화·배포하는 워크스페이스 스킬입니다.
---

# 📚 영단어 퀴즈 신규 세트 추가 스킬 (`add-quiz-words`)

이 스킬은 교재 단어 이미지(예: `WORD/` 폴더 내 이미지) 또는 사용자 제공 단어 목록을 분석하여 `quiz_data.js`의 날짜별 스케줄러(`QUIZ_WORDS_BY_DATE`) 및 통합 백업 풀(`QUIZ_WORDS`)에 신규 단어를 등록하고, PWA 캐시 무효화 및 문서 동기화까지 일괄 수행하는 표준 가이드입니다.

---

## 📌 1. 단어 세트 구성 및 스케줄링 규칙

1. **세트당 단어 수**: 교재 1단원(2페이지) 기준 **정확히 22단어** (1페이지당 11단어).
2. **날짜 키 포맷**: `YYMMDD` 문자열 (예: 2026년 9월 1일 $\rightarrow$ `"260901"`).
3. **스케줄 및 복습일 규칙**:
   - **목요일·금요일**: 시스템이 자동으로 **과거 누적 단어 복습 풀(4지선다 객관식)**을 출제하므로, 새로운 진도 시작일은 가급적 **토/일/월/화/수**로 배정합니다.
   - **일반 요일**: 등록된 날짜 중 `key <= today`인 최신 날짜의 세트가 활성화되며, 시작 당일은 객관식, 이후 유지 기간은 주관식으로 출제됩니다.

---

## 🛠️ 2. 작업 절차 (Standard Operating Procedure)

### Step 1: 교재 이미지 단어 전사 및 데이터 검증
- `WORD/` 폴더의 이미지 파일(예: `260901-1.jpg`, `260901-2.jpg`)을 순차 분석하여 영어 단어(`word`)와 한국어 뜻(`meaning`)을 정확히 추출합니다.
- 중복된 오타나 특수문자가 없는지 정제합니다.

### Step 2: `quiz_data.js` 데이터베이스 등록
1. **`QUIZ_WORDS_BY_DATE` 객체에 신규 날짜 키 등록**:
   ```javascript
   "260901": [
       { word: "brush", meaning: "붓, 솔" },
       { word: "canvas", meaning: "캔버스, 화폭" },
       ... (총 22단어)
   ],
   ```
2. **`QUIZ_WORDS` 전역 통합 풀 하단에 동기화 추가**:
   ```javascript
   /* === [260901 추가분 (교재 Lesson 2, 22단어)] === */
   { word: "brush", meaning: "붓, 솔" },
   { word: "canvas", meaning: "캔버스, 화폭" },
   ...
   ```

### Step 3: 가이드 문서 최신화 (`.agents/skills/add-quiz-words/quiz_vocabulary_schedule.md`)
- `QUIZ_WORDS_BY_DATE` 섹션에 신규 날짜 키, 가동 기간, 학습 주제 및 단어 예시 등록.
- 문서 상단의 총 수록 단어 수(`QUIZ_WORDS.length`) 수치 갱신.

### Step 4: PWA 캐시 무효화 및 버전 상향 (필수!)
- **`index.html`**: `<script src="quiz_data.js?v=X.X"></script>` 쿼리 파라미터 버전 상향.
- **`sw.js`**: 최상단 `CACHE_NAME = 'fc-star-vXXX'` 숫자를 1 증가하여 모바일 브라우저 캐시 강제 갱신.

### Step 5: 변경 내역 기록 (`log.md`)
- `log.md` 최하단에 신규 번호(예: `106) ...`)를 부여하고 추가된 단어 수, 날짜 키, 세부 내역을 기록.

### Step 6: 자동 무결성 검증 스크립트 실행
- Python 스크립트로 괄호 쌍(`{ }`, `[ ]`), 각 날짜 키별 22단어 여부, 중복 키 유무를 최종 검증.

---

## 🔍 3. 자동 검증 파이썬 템플릿

```python
with open('quiz_data.js', 'r', encoding='utf-8') as f:
    code = f.read()

# 괄호 정합성 검사
assert code.count('{') == code.count('}'), "중괄호 불일치"
assert code.count('[') == code.count(']'), "대괄호 불일치"

# 버전 동기화 검사
with open('sw.js', 'r', encoding='utf-8') as f:
    assert 'fc-star-v' in f.read()

print("✅ 단어 데이터 및 PWA 캐시 무결성 검증 완료!")
```
