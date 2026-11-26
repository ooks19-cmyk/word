// js/difficulty_dashboard.js - FC STAR 난이도 조절 대시보드 프론트엔드 컨트롤러
// 보안 수칙: DOM API(createElement, textContent, replaceChildren) 및 커스텀 모달만 사용합니다.

(function () {
    'use strict';

    const OVR_MIN = 50;
    const OVR_MAX = 150;

    let serverConnected = false;
    let csrfToken = '';
    let currentBranch = 'main';
    let savedConfig = null;
    let draftConfig = null;
    let isBusy = false;

    // 4대 섹션 필드 메타데이터 정의
    const TOP_OVR_FIELDS = [
        {
            key: 'topOvrMaxCap',
            label: '공통 Top OVR 최대값 상한',
            hint: 'getPlayerTop20Ovr() 기본 상한 (기본값 99)',
            get: (cfg) => cfg.topOvrMaxCap,
            set: (cfg, val) => { cfg.topOvrMaxCap = val; }
        }
    ];

    const LEAGUE_FIELDS = [
        {
            key: 'leagues.kleague1',
            label: 'K리그 1 (전북 현대)',
            hint: '2년차 이후 리그·FA컵 상한 (기본값 95)',
            get: (cfg) => cfg.leagues.kleague1,
            set: (cfg, val) => { cfg.leagues.kleague1 = val; }
        },
        {
            key: 'leagues.jleague',
            label: 'J1리그 (FC 도쿄)',
            hint: '2년차 이후 리그·FA컵 상한 (기본값 97)',
            get: (cfg) => cfg.leagues.jleague,
            set: (cfg, val) => { cfg.leagues.jleague = val; }
        },
        {
            key: 'leagues.ligue1',
            label: '프랑스 리그앙 (PSG)',
            hint: '2년차 이후 리그·쿠프 드 프랑스 상한 (기본값 98)',
            get: (cfg) => cfg.leagues.ligue1,
            set: (cfg, val) => { cfg.leagues.ligue1 = val; }
        },
        {
            key: 'leagues.epl',
            label: '프리미어리그 (리버풀)',
            hint: '2년차 이후 리그·FA컵 상한 (기본값 99)',
            get: (cfg) => cfg.leagues.epl,
            set: (cfg, val) => { cfg.leagues.epl = val; }
        }
    ];

    const UCL_FIELDS = [
        {
            key: 'championsLeague.ucl.bossMaxOvrCap',
            label: 'UCL 초강호 보스팀 상한 (레알·뮌헨)',
            hint: 'topOvr + (1~2) 계산 후 상한 (기본값 101)',
            get: (cfg) => cfg.championsLeague.ucl.bossMaxOvrCap,
            set: (cfg, val) => { cfg.championsLeague.ucl.bossMaxOvrCap = val; }
        },
        {
            key: 'championsLeague.ucl.strongMaxOvrCap',
            label: 'UCL 강호팀 상한 (바르사·PSG·인테르 등)',
            hint: 'topOvr + (-2~0) 계산 후 상한 (기본값 99)',
            get: (cfg) => cfg.championsLeague.ucl.strongMaxOvrCap,
            set: (cfg, val) => { cfg.championsLeague.ucl.strongMaxOvrCap = val; }
        },
        {
            key: 'championsLeague.ucl.darkhorseMaxOvrCap',
            label: 'UCL 다크호스팀 상한',
            hint: 'topOvr + (-6~-2) 계산 후 상한 (기본값 97)',
            get: (cfg) => cfg.championsLeague.ucl.darkhorseMaxOvrCap,
            set: (cfg, val) => { cfg.championsLeague.ucl.darkhorseMaxOvrCap = val; }
        }
    ];

    const ACL_FIELDS = [
        {
            key: 'championsLeague.acl.bossMaxOvrCap',
            label: 'ACL 서아시아 보스팀 상한 (랜덤 1팀)',
            hint: 'topOvr + 1 계산 후 상한 (기본값 100)',
            get: (cfg) => cfg.championsLeague.acl.bossMaxOvrCap,
            set: (cfg, val) => { cfg.championsLeague.acl.bossMaxOvrCap = val; }
        },
        {
            key: 'championsLeague.acl.strongMaxOvrCap',
            label: 'ACL 강호팀 상한',
            hint: 'topOvr + (-2~0) 계산 후 상한 (기본값 99)',
            get: (cfg) => cfg.championsLeague.acl.strongMaxOvrCap,
            set: (cfg, val) => { cfg.championsLeague.acl.strongMaxOvrCap = val; }
        },
        {
            key: 'championsLeague.acl.normalMaxOvrCap',
            label: 'ACL 일반 해외팀 상한',
            hint: 'topOvr + (-10~-2) 계산 후 상한 (기본값 97)',
            get: (cfg) => cfg.championsLeague.acl.normalMaxOvrCap,
            set: (cfg, val) => { cfg.championsLeague.acl.normalMaxOvrCap = val; }
        }
    ];

    const NATIONAL_ASIA_RANGES = [
        {
            key: 'national.asia.elite',
            label: '아시아 엘리트 국가 (한국·일본·이란·사우디)',
            hint: '기본값 95 ~ 96',
            getMin: (cfg) => cfg.national.asia.eliteMinOvr,
            getMax: (cfg) => cfg.national.asia.eliteMaxOvr,
            setMin: (cfg, val) => { cfg.national.asia.eliteMinOvr = val; },
            setMax: (cfg, val) => { cfg.national.asia.eliteMaxOvr = val; }
        },
        {
            key: 'national.asia.normal',
            label: '아시아 일반 국가',
            hint: '기본값 88 ~ 94',
            getMin: (cfg) => cfg.national.asia.normalMinOvr,
            getMax: (cfg) => cfg.national.asia.normalMaxOvr,
            setMin: (cfg, val) => { cfg.national.asia.normalMinOvr = val; },
            setMax: (cfg, val) => { cfg.national.asia.normalMaxOvr = val; }
        }
    ];

    const NATIONAL_WORLD_RANGES = [
        {
            key: 'national.world.elite',
            label: '세계 엘리트 국가 (프랑스·아르헨티나·스페인·브라질·잉글랜드·독일)',
            hint: '기본값 97 ~ 100',
            getMin: (cfg) => cfg.national.world.eliteMinOvr,
            getMax: (cfg) => cfg.national.world.eliteMaxOvr,
            setMin: (cfg, val) => { cfg.national.world.eliteMinOvr = val; },
            setMax: (cfg, val) => { cfg.national.world.eliteMaxOvr = val; }
        },
        {
            key: 'national.world.normal',
            label: '세계 일반 국가',
            hint: '기본값 90 ~ 96',
            getMin: (cfg) => cfg.national.world.normalMinOvr,
            getMax: (cfg) => cfg.national.world.normalMaxOvr,
            setMin: (cfg, val) => { cfg.national.world.normalMinOvr = val; },
            setMax: (cfg, val) => { cfg.national.world.normalMaxOvr = val; }
        }
    ];

    function clampOvr(val) {
        const n = Math.trunc(Number(val));
        if (!Number.isFinite(n)) return 95;
        return Math.max(OVR_MIN, Math.min(OVR_MAX, n));
    }

    function cloneObj(obj) {
        return JSON.parse(JSON.stringify(obj));
    }

    function showToast(message, isError) {
        const container = document.getElementById('toastContainer');
        if (!container) return;
        const item = document.createElement('div');
        item.className = isError ? 'toast-item toast-error' : 'toast-item';
        item.textContent = message;
        container.appendChild(item);
        setTimeout(() => {
            if (item.parentNode === container) {
                container.removeChild(item);
            }
        }, 3600);
    }

    function computeDiffItems() {
        if (!savedConfig || !draftConfig) return [];
        const diffs = [];
        const singleGroups = [...TOP_OVR_FIELDS, ...LEAGUE_FIELDS, ...UCL_FIELDS, ...ACL_FIELDS];
        singleGroups.forEach(field => {
            const before = field.get(savedConfig);
            const after = field.get(draftConfig);
            if (before !== after) {
                diffs.push({ label: field.label, before: String(before), after: String(after) });
            }
        });
        const rangeGroups = [...NATIONAL_ASIA_RANGES, ...NATIONAL_WORLD_RANGES];
        rangeGroups.forEach(field => {
            const bMin = field.getMin(savedConfig);
            const bMax = field.getMax(savedConfig);
            const aMin = field.getMin(draftConfig);
            const aMax = field.getMax(draftConfig);
            if (bMin !== aMin || bMax !== aMax) {
                diffs.push({
                    label: field.label,
                    before: bMin + ' ~ ' + bMax,
                    after: aMin + ' ~ ' + aMax
                });
            }
        });
        return diffs;
    }

    function buildSingleFieldRow(field) {
        const val = field.get(draftConfig);
        const origVal = savedConfig ? field.get(savedConfig) : val;
        const row = document.createElement('div');
        row.className = val !== origVal ? 'field-row field-changed' : 'field-row';

        const top = document.createElement('div');
        top.className = 'field-top';

        const labelEl = document.createElement('span');
        labelEl.className = 'field-label';
        labelEl.textContent = field.label;

        const hintEl = document.createElement('span');
        hintEl.className = 'field-hint';
        hintEl.textContent = field.hint;

        top.appendChild(labelEl);
        top.appendChild(hintEl);

        const controls = document.createElement('div');
        controls.className = 'field-controls';

        const btnMinus = document.createElement('button');
        btnMinus.type = 'button';
        btnMinus.className = 'step-btn';
        btnMinus.textContent = '-';
        btnMinus.setAttribute('aria-label', field.label + ' 1 감소');

        const slider = document.createElement('input');
        slider.type = 'range';
        slider.className = 'field-slider';
        slider.min = String(OVR_MIN);
        slider.max = String(OVR_MAX);
        slider.value = String(val);

        const numInput = document.createElement('input');
        numInput.type = 'number';
        numInput.className = 'num-input';
        numInput.min = String(OVR_MIN);
        numInput.max = String(OVR_MAX);
        numInput.value = String(val);

        const btnPlus = document.createElement('button');
        btnPlus.type = 'button';
        btnPlus.className = 'step-btn';
        btnPlus.textContent = '+';
        btnPlus.setAttribute('aria-label', field.label + ' 1 증가');

        const applyValue = (nextVal) => {
            const safe = clampOvr(nextVal);
            field.set(draftConfig, safe);
            slider.value = String(safe);
            numInput.value = String(safe);
            row.className = (savedConfig && safe !== field.get(savedConfig)) ? 'field-row field-changed' : 'field-row';
            refreshDerivedViews();
        };

        btnMinus.addEventListener('click', () => applyValue(field.get(draftConfig) - 1));
        btnPlus.addEventListener('click', () => applyValue(field.get(draftConfig) + 1));
        slider.addEventListener('input', () => applyValue(slider.value));
        numInput.addEventListener('change', () => applyValue(numInput.value));

        controls.appendChild(btnMinus);
        controls.appendChild(slider);
        controls.appendChild(numInput);
        controls.appendChild(btnPlus);

        row.appendChild(top);
        row.appendChild(controls);
        return row;
    }

    function buildRangeFieldRow(field) {
        const minVal = field.getMin(draftConfig);
        const maxVal = field.getMax(draftConfig);
        const isChanged = savedConfig && (minVal !== field.getMin(savedConfig) || maxVal !== field.getMax(savedConfig));

        const row = document.createElement('div');
        row.className = isChanged ? 'field-row field-changed' : 'field-row';

        const top = document.createElement('div');
        top.className = 'field-top';

        const labelEl = document.createElement('span');
        labelEl.className = 'field-label';
        labelEl.textContent = field.label;

        const hintEl = document.createElement('span');
        hintEl.className = 'field-hint';
        hintEl.textContent = field.hint;

        top.appendChild(labelEl);
        top.appendChild(hintEl);

        const pair = document.createElement('div');
        pair.className = 'range-pair';

        const minBox = document.createElement('div');
        minBox.className = 'range-box';
        const minSpan = document.createElement('span');
        minSpan.textContent = '최소 OVR';
        const minInput = document.createElement('input');
        minInput.type = 'number';
        minInput.className = 'num-input';
        minInput.min = String(OVR_MIN);
        minInput.max = String(OVR_MAX);
        minInput.value = String(minVal);
        minBox.appendChild(minSpan);
        minBox.appendChild(minInput);

        const sep = document.createElement('span');
        sep.className = 'range-sep';
        sep.textContent = '~';

        const maxBox = document.createElement('div');
        maxBox.className = 'range-box';
        const maxSpan = document.createElement('span');
        maxSpan.textContent = '최대 OVR';
        const maxInput = document.createElement('input');
        maxInput.type = 'number';
        maxInput.className = 'num-input';
        maxInput.min = String(OVR_MIN);
        maxInput.max = String(OVR_MAX);
        maxInput.value = String(maxVal);
        maxBox.appendChild(maxSpan);
        maxBox.appendChild(maxInput);

        const syncRange = () => {
            let nextMin = clampOvr(minInput.value);
            let nextMax = clampOvr(maxInput.value);
            if (nextMin > nextMax) {
                nextMax = nextMin;
            }
            field.setMin(draftConfig, nextMin);
            field.setMax(draftConfig, nextMax);
            minInput.value = String(nextMin);
            maxInput.value = String(nextMax);
            const changedNow = savedConfig && (nextMin !== field.getMin(savedConfig) || nextMax !== field.getMax(savedConfig));
            row.className = changedNow ? 'field-row field-changed' : 'field-row';
            refreshDerivedViews();
        };

        minInput.addEventListener('change', syncRange);
        maxInput.addEventListener('change', syncRange);

        pair.appendChild(minBox);
        pair.appendChild(sep);
        pair.appendChild(maxBox);

        row.appendChild(top);
        row.appendChild(pair);
        return row;
    }

    function renderAllSections() {
        const renderSingleList = (elId, fields) => {
            const container = document.getElementById(elId);
            if (!container) return;
            const nodes = fields.map(buildSingleFieldRow);
            container.replaceChildren(...nodes);
        };

        const renderRangeList = (elId, fields) => {
            const container = document.getElementById(elId);
            if (!container) return;
            const nodes = fields.map(buildRangeFieldRow);
            container.replaceChildren(...nodes);
        };

        renderSingleList('sectionTopOvr', TOP_OVR_FIELDS);
        renderSingleList('sectionLeagues', LEAGUE_FIELDS);
        renderSingleList('sectionUcl', UCL_FIELDS);
        renderSingleList('sectionAcl', ACL_FIELDS);
        renderRangeList('sectionNationalAsia', NATIONAL_ASIA_RANGES);
        renderRangeList('sectionNationalWorld', NATIONAL_WORLD_RANGES);

        refreshDerivedViews();
    }

    function refreshDerivedViews() {
        const previewEl = document.getElementById('jsonPreview');
        if (previewEl && draftConfig) {
            previewEl.textContent = JSON.stringify(draftConfig, null, 2);
        }

        const updatedEl = document.getElementById('configUpdatedAtText');
        if (updatedEl && draftConfig) {
            updatedEl.textContent = draftConfig.updatedAt || '-';
        }

        const diffs = computeDiffItems();
        const dirtyBadge = document.getElementById('dirtyStatusBadge');
        if (dirtyBadge) {
            if (diffs.length > 0) {
                dirtyBadge.textContent = '미저장 변경 ' + diffs.length + '건';
                dirtyBadge.className = 'status-pill status-dirty';
            } else {
                dirtyBadge.textContent = '변경 사항 없음';
                dirtyBadge.className = 'status-pill status-clean';
            }
        }

        const diffList = document.getElementById('diffList');
        if (diffList) {
            if (diffs.length === 0) {
                const li = document.createElement('li');
                li.className = 'diff-empty';
                li.textContent = '저장된 설정과 동일합니다.';
                diffList.replaceChildren(li);
            } else {
                const nodes = diffs.map(item => {
                    const li = document.createElement('li');
                    li.textContent = item.label + ': ' + item.before + ' → ' + item.after;
                    return li;
                });
                diffList.replaceChildren(...nodes);
            }
        }
    }

    function updateServerUIState(connected) {
        serverConnected = connected;
        const badge = document.getElementById('serverStatusBadge');
        const banner = document.getElementById('offlineBanner');
        const btnSave = document.getElementById('btnSaveOnly');
        const btnPush = document.getElementById('btnOpenPushModal');
        const btnRefreshGit = document.getElementById('btnRefreshGit');

        if (badge) {
            badge.textContent = connected ? '로컬 관리 서버 연결됨 (127.0.0.1)' : '오프라인 모드 (읽기/다운로드 전용)';
            badge.className = connected ? 'status-pill status-online' : 'status-pill status-offline';
        }
        if (banner) {
            banner.classList.toggle('hidden', connected);
        }
        if (btnSave) btnSave.disabled = !connected || isBusy;
        if (btnPush) btnPush.disabled = !connected || isBusy;
        if (btnRefreshGit) btnRefreshGit.disabled = !connected || isBusy;
    }

    function setBusy(busy) {
        isBusy = busy;
        updateServerUIState(serverConnected);
        const btnConfirm = document.getElementById('btnConfirmPush');
        if (btnConfirm) btnConfirm.disabled = busy;
    }

    async function apiGet(path) {
        const res = await fetch(path, {
            method: 'GET',
            credentials: 'same-origin',
            cache: 'no-store'
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
            throw new Error(data.error || ('요청 실패 (HTTP ' + res.status + ')'));
        }
        return data;
    }

    async function apiPost(path, payload) {
        const res = await fetch(path, {
            method: 'POST',
            credentials: 'same-origin',
            cache: 'no-store',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-Token': csrfToken
            },
            body: JSON.stringify(payload || {})
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
            throw new Error(data.error || ('요청 실패 (HTTP ' + res.status + ')'));
        }
        return data;
    }

    async function refreshGitStatus() {
        if (!serverConnected) return;
        const branchEl = document.getElementById('gitBranchText');
        const fileEl = document.getElementById('gitFileStatusText');
        const logEl = document.getElementById('gitOutputLog');
        try {
            const info = await apiGet('/api/git-status');
            currentBranch = info.branch || 'main';
            if (branchEl) branchEl.textContent = currentBranch;
            if (fileEl) fileEl.textContent = info.fileStatusText || '변경 없음';
            if (logEl) {
                const lines = [];
                lines.push('브랜치: ' + currentBranch + ' (미푸시 커밋: ' + (info.aheadCount || 0) + '건)');
                lines.push('파일 상태: ' + (info.fileStatusText || '깨끗함'));
                lines.push('--- 최근 커밋 ---');
                (info.recentCommits || []).forEach(line => lines.push(line));
                logEl.textContent = lines.join('\n');
            }
        } catch (err) {
            if (logEl) logEl.textContent = 'Git 상태 조회 실패: ' + err.message;
        }
    }

    async function loadFromServerOrFallback() {
        try {
            const session = await apiGet('/api/session');
            csrfToken = session.csrfToken || '';
            const data = await apiGet('/api/config');
            savedConfig = sanitizeDifficultyConfig(data.config);
            draftConfig = cloneObj(savedConfig);
            updateServerUIState(true);
            renderAllSections();
            await refreshGitStatus();
        } catch (_err) {
            updateServerUIState(false);
            try {
                const fallbackLoaded = await loadDifficultyConfig('difficulty_config.json');
                savedConfig = cloneObj(fallbackLoaded);
                draftConfig = cloneObj(fallbackLoaded);
            } catch (_innerErr) {
                savedConfig = cloneObj(DEFAULT_DIFFICULTY_CONFIG);
                draftConfig = cloneObj(DEFAULT_DIFFICULTY_CONFIG);
            }
            renderAllSections();
        }
    }

    async function handleSaveOnly() {
        if (!serverConnected || isBusy) return;
        setBusy(true);
        try {
            const result = await apiPost('/api/config', { config: draftConfig });
            savedConfig = sanitizeDifficultyConfig(result.config);
            draftConfig = cloneObj(savedConfig);
            renderAllSections();
            await refreshGitStatus();
            showToast('difficulty_config.json 파일에 저장했습니다.', false);
        } catch (err) {
            showToast('저장 실패: ' + err.message, true);
        } finally {
            setBusy(false);
        }
    }

    function openPushModal() {
        if (!serverConnected || isBusy) return;
        const modal = document.getElementById('pushConfirmModal');
        const msgInput = document.getElementById('commitMessageInput');
        const commitMsg = (msgInput && msgInput.value.trim()) ? msgInput.value.trim() : 'chore: 난이도 오버롤 설정 업데이트';
        const diffs = computeDiffItems();

        const branchEl = document.getElementById('modalBranchName');
        const msgPreviewEl = document.getElementById('modalCommitPreview');
        const diffCountEl = document.getElementById('modalDiffCount');

        if (branchEl) branchEl.textContent = currentBranch;
        if (msgPreviewEl) msgPreviewEl.textContent = commitMsg;
        if (diffCountEl) diffCountEl.textContent = diffs.length + '개 항목 변경';
        if (modal) modal.classList.remove('hidden');
    }

    function closePushModal() {
        const modal = document.getElementById('pushConfirmModal');
        if (modal) modal.classList.add('hidden');
    }

    async function executeSaveAndGitPush() {
        if (!serverConnected || isBusy) return;
        const msgInput = document.getElementById('commitMessageInput');
        const commitMessage = (msgInput && msgInput.value.trim()) ? msgInput.value.trim() : 'chore: 난이도 오버롤 설정 업데이트';
        const logEl = document.getElementById('gitOutputLog');

        setBusy(true);
        try {
            const result = await apiPost('/api/git-push', {
                config: draftConfig,
                commitMessage: commitMessage
            });
            savedConfig = sanitizeDifficultyConfig(result.config);
            draftConfig = cloneObj(savedConfig);
            renderAllSections();
            closePushModal();

            if (logEl) {
                const lines = [];
                lines.push('[Git Push 완료] ' + (result.message || '성공'));
                if (result.commitHash) lines.push('커밋 해시: ' + result.commitHash);
                if (result.branch) lines.push('대상 브랜치: origin/' + result.branch);
                if (result.output) {
                    lines.push('--- 출력 ---');
                    lines.push(result.output);
                }
                logEl.textContent = lines.join('\n');
            }

            showToast(result.message || 'Git Push가 완료되었습니다.', false);
            await refreshGitStatus();
        } catch (err) {
            closePushModal();
            if (logEl) logEl.textContent = '[Git Push 오류]\n' + err.message;
            showToast('Git Push 실패: ' + err.message, true);
        } finally {
            setBusy(false);
        }
    }

    function shiftAllValues(delta) {
        if (!draftConfig) return;
        const singleGroups = [...TOP_OVR_FIELDS, ...LEAGUE_FIELDS, ...UCL_FIELDS, ...ACL_FIELDS];
        singleGroups.forEach(field => {
            field.set(draftConfig, clampOvr(field.get(draftConfig) + delta));
        });
        const rangeGroups = [...NATIONAL_ASIA_RANGES, ...NATIONAL_WORLD_RANGES];
        rangeGroups.forEach(field => {
            const nextMin = clampOvr(field.getMin(draftConfig) + delta);
            const nextMax = clampOvr(field.getMax(draftConfig) + delta);
            field.setMin(draftConfig, Math.min(nextMin, nextMax));
            field.setMax(draftConfig, Math.max(nextMin, nextMax));
        });
        renderAllSections();
        showToast('전체 난이도 수치를 ' + (delta > 0 ? '+' + delta : String(delta)) + ' 조정했습니다.', false);
    }

    function resetToDefaultValues() {
        const fresh = cloneObj(DEFAULT_DIFFICULTY_CONFIG);
        if (draftConfig && draftConfig.updatedAt) {
            fresh.updatedAt = draftConfig.updatedAt;
        }
        draftConfig = fresh;
        renderAllSections();
        showToast('기본 밸런스 값으로 복원했습니다. 저장 버튼을 눌러 반영하세요.', false);
    }

    function downloadConfigJson() {
        if (!draftConfig) return;
        const blob = new Blob([JSON.stringify(draftConfig, null, 2) + '\n'], { type: 'application/json;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'difficulty_config.json';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        showToast('difficulty_config.json 파일을 다운로드했습니다.', false);
    }

    function bindEvents() {
        const byId = (id) => document.getElementById(id);
        byId('btnShiftMinus')?.addEventListener('click', () => shiftAllValues(-1));
        byId('btnShiftPlus')?.addEventListener('click', () => shiftAllValues(1));
        byId('btnResetDefaults')?.addEventListener('click', resetToDefaultValues);
        byId('btnReloadConfig')?.addEventListener('click', () => {
            loadFromServerOrFallback().then(() => showToast('설정 파일을 다시 불러왔습니다.', false));
        });
        byId('btnDownloadJson')?.addEventListener('click', downloadConfigJson);
        byId('btnSaveOnly')?.addEventListener('click', handleSaveOnly);
        byId('btnOpenPushModal')?.addEventListener('click', openPushModal);
        byId('btnRefreshGit')?.addEventListener('click', refreshGitStatus);
        byId('btnCancelPush')?.addEventListener('click', closePushModal);
        byId('btnConfirmPush')?.addEventListener('click', executeSaveAndGitPush);

        const modal = byId('pushConfirmModal');
        modal?.addEventListener('click', (ev) => {
            if (ev.target === modal) closePushModal();
        });
    }

    document.addEventListener('DOMContentLoaded', () => {
        bindEvents();
        loadFromServerOrFallback();
    });
})();
