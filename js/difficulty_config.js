// js/difficulty_config.js - 상대팀 오버롤 난이도 설정 중앙 로더 및 헬퍼
// 단일 JSON 파일(difficulty_config.json)에서 topOvr 상한, 리그별 상한, 챔스 상한, 국제대회 OVR을 관리합니다.

const DEFAULT_DIFFICULTY_CONFIG = {
    version: "1.0.0",
    updatedAt: "2026-11-26T10:20:00+09:00",
    topOvrMaxCap: 99,
    leagues: {
        kleague1: 95,
        jleague: 97,
        ligue1: 98,
        epl: 99
    },
    championsLeague: {
        ucl: {
            bossMaxOvrCap: 101,
            strongMaxOvrCap: 99,
            darkhorseMaxOvrCap: 97
        },
        acl: {
            bossMaxOvrCap: 100,
            strongMaxOvrCap: 99,
            normalMaxOvrCap: 97
        }
    },
    national: {
        asia: {
            eliteMinOvr: 95,
            eliteMaxOvr: 96,
            normalMinOvr: 88,
            normalMaxOvr: 94
        },
        world: {
            eliteMinOvr: 97,
            eliteMaxOvr: 100,
            normalMinOvr: 90,
            normalMaxOvr: 96
        }
    }
};

function cloneDifficultyObject(obj) {
    return JSON.parse(JSON.stringify(obj));
}

function toSafeDifficultyInt(value, fallback, minVal, maxVal) {
    const num = Number(value);
    if (!Number.isFinite(num)) return fallback;
    const intVal = Math.trunc(num);
    if (intVal < minVal) return minVal;
    if (intVal > maxVal) return maxVal;
    return intVal;
}

function normalizeMinMaxPair(minVal, maxVal) {
    return minVal <= maxVal ? [minVal, maxVal] : [maxVal, minVal];
}

// 외부 JSON 데이터를 허용 스키마로 검증·정규화
function sanitizeDifficultyConfig(raw) {
    const base = cloneDifficultyObject(DEFAULT_DIFFICULTY_CONFIG);
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
        return base;
    }

    if (typeof raw.version === 'string' && raw.version.trim().length > 0 && raw.version.length <= 32) {
        base.version = raw.version.trim();
    }
    if (typeof raw.updatedAt === 'string' && raw.updatedAt.trim().length > 0 && raw.updatedAt.length <= 64) {
        base.updatedAt = raw.updatedAt.trim();
    }

    // 1. 공통 topOvr 최대값 상한
    base.topOvrMaxCap = toSafeDifficultyInt(raw.topOvrMaxCap, base.topOvrMaxCap, 50, 150);

    // 2. 리그별 OVR 상한
    if (raw.leagues && typeof raw.leagues === 'object') {
        Object.keys(base.leagues).forEach(leagueId => {
            const val = raw.leagues[leagueId];
            const numericVal = (val && typeof val === 'object') ? val.maxOvrCap : val;
            base.leagues[leagueId] = toSafeDifficultyInt(numericVal, base.leagues[leagueId], 50, 150);
        });
    }

    // 3. 챔피언스리그별 OVR 상한
    if (raw.championsLeague && typeof raw.championsLeague === 'object') {
        if (raw.championsLeague.ucl && typeof raw.championsLeague.ucl === 'object') {
            const src = raw.championsLeague.ucl;
            const dst = base.championsLeague.ucl;
            dst.bossMaxOvrCap = toSafeDifficultyInt(src.bossMaxOvrCap, dst.bossMaxOvrCap, 50, 150);
            dst.strongMaxOvrCap = toSafeDifficultyInt(src.strongMaxOvrCap, dst.strongMaxOvrCap, 50, 150);
            dst.darkhorseMaxOvrCap = toSafeDifficultyInt(src.darkhorseMaxOvrCap, dst.darkhorseMaxOvrCap, 50, 150);
        }
        if (raw.championsLeague.acl && typeof raw.championsLeague.acl === 'object') {
            const src = raw.championsLeague.acl;
            const dst = base.championsLeague.acl;
            dst.bossMaxOvrCap = toSafeDifficultyInt(src.bossMaxOvrCap, dst.bossMaxOvrCap, 50, 150);
            dst.strongMaxOvrCap = toSafeDifficultyInt(src.strongMaxOvrCap, dst.strongMaxOvrCap, 50, 150);
            dst.normalMaxOvrCap = toSafeDifficultyInt(src.normalMaxOvrCap, dst.normalMaxOvrCap, 50, 150);
        }
    }

    // 4. 국제대회(국가대표 모드) OVR 범위
    if (raw.national && typeof raw.national === 'object') {
        ['asia', 'world'].forEach(region => {
            const src = raw.national[region];
            if (!src || typeof src !== 'object') return;
            const dst = base.national[region];
            const eMin = toSafeDifficultyInt(src.eliteMinOvr, dst.eliteMinOvr, 50, 150);
            const eMax = toSafeDifficultyInt(src.eliteMaxOvr, dst.eliteMaxOvr, 50, 150);
            [dst.eliteMinOvr, dst.eliteMaxOvr] = normalizeMinMaxPair(eMin, eMax);
            const nMin = toSafeDifficultyInt(src.normalMinOvr, dst.normalMinOvr, 50, 150);
            const nMax = toSafeDifficultyInt(src.normalMaxOvr, dst.normalMaxOvr, 50, 150);
            [dst.normalMinOvr, dst.normalMaxOvr] = normalizeMinMaxPair(nMin, nMax);
        });
    }

    return base;
}

let DIFFICULTY_CONFIG = cloneDifficultyObject(DEFAULT_DIFFICULTY_CONFIG);
let isDifficultyConfigLoaded = false;

function getDifficultyConfig() {
    return DIFFICULTY_CONFIG;
}

function applyDifficultyConfig(rawConfig) {
    DIFFICULTY_CONFIG = sanitizeDifficultyConfig(rawConfig);
    isDifficultyConfigLoaded = true;
    return DIFFICULTY_CONFIG;
}

function getTopOvrMaxCap() {
    return (DIFFICULTY_CONFIG && typeof DIFFICULTY_CONFIG.topOvrMaxCap === 'number')
        ? DIFFICULTY_CONFIG.topOvrMaxCap
        : DEFAULT_DIFFICULTY_CONFIG.topOvrMaxCap;
}

function getLeagueMaxOvrCap(leagueId) {
    const leagues = (DIFFICULTY_CONFIG && DIFFICULTY_CONFIG.leagues) || DEFAULT_DIFFICULTY_CONFIG.leagues;
    if (leagueId && typeof leagues[leagueId] === 'number') {
        return leagues[leagueId];
    }
    return leagues.kleague1 || DEFAULT_DIFFICULTY_CONFIG.leagues.kleague1;
}

function getChampionsLeagueOvrCaps(mode) {
    const key = mode === 'ucl' ? 'ucl' : 'acl';
    return (DIFFICULTY_CONFIG && DIFFICULTY_CONFIG.championsLeague && DIFFICULTY_CONFIG.championsLeague[key])
        || DEFAULT_DIFFICULTY_CONFIG.championsLeague[key];
}

function getNationalOvrConfig(region) {
    const key = region === 'asia' ? 'asia' : 'world';
    return (DIFFICULTY_CONFIG && DIFFICULTY_CONFIG.national && DIFFICULTY_CONFIG.national[key])
        || DEFAULT_DIFFICULTY_CONFIG.national[key];
}

// [minVal, maxVal] 양 끝 포함 정수 난수 반환
function rollDifficultyInt(minVal, maxVal) {
    const lo = Math.min(minVal, maxVal);
    const hi = Math.max(minVal, maxVal);
    return lo + Math.floor(Math.random() * (hi - lo + 1));
}

// difficulty_config.json 비동기 로드 (최신 설정 즉시 반영)
async function loadDifficultyConfig(configPath = 'difficulty_config.json') {
    if (typeof fetch !== 'function') {
        return DIFFICULTY_CONFIG;
    }
    try {
        const res = await fetch(configPath, { cache: 'no-store' });
        if (!res.ok) {
            return DIFFICULTY_CONFIG;
        }
        const parsed = await res.json();
        applyDifficultyConfig(parsed);
        return DIFFICULTY_CONFIG;
    } catch (e) {
        return DIFFICULTY_CONFIG;
    }
}

// 브라우저 진입 시 JSON 설정 비동기 프리로드
if (typeof window !== 'undefined' && typeof fetch === 'function') {
    loadDifficultyConfig();
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        DEFAULT_DIFFICULTY_CONFIG,
        sanitizeDifficultyConfig,
        getDifficultyConfig,
        applyDifficultyConfig,
        getTopOvrMaxCap,
        getLeagueMaxOvrCap,
        getChampionsLeagueOvrCaps,
        getNationalOvrConfig,
        rollDifficultyInt,
        loadDifficultyConfig
    };
}
