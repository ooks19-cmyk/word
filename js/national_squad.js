// js/national_squad.js - isolated national squad editor
const NATIONAL_FORMATIONS = ['4-3-3','3-4-3','5-4-1','4-2-3-1'];
const NATIONAL_SQUAD_SLOTS = ['GK','LB','LCB','RCB','RB','LCM','CM','RCM','LW','ST','RW'];
const NATIONAL_433_SLOTS = NATIONAL_SQUAD_SLOTS; // Backward-compatible alias for older saves/tests.
const NATIONAL_KEY_PLAYER_RULES = {
    '4-3-3': { slot:'CM', role:'DM', stat:'pas', statLabel:'PAS', minimum:80 },
    '3-4-3': { slot:'CM', role:'AM', stat:'dri', statLabel:'DRI', minimum:80 },
    '5-4-1': { slots:['LW','RW'], role:'LM/RM', stat:'pac', statLabel:'PAC', minimum:80 },
    '4-2-3-1': { slot:'CM', role:'AM', stat:'dri', statLabel:'DRI', minimum:80 }
};
let nationalSelectedSlot = null;
let nationalSquadPresets = {};
try {
    nationalSquadPresets = JSON.parse(localStorage.getItem('fc_star_national_squad_presets')) || {};
} catch(e) {
    nationalSquadPresets = {};
}

function createEmptyNationalSquad() {
    return Object.fromEntries(NATIONAL_SQUAD_SLOTS.map(slot=>[slot,null]));
}
function normalizeNationalFormation(formation) {
    return NATIONAL_FORMATIONS.includes(formation) ? formation : '4-3-3';
}
function normalizeNationalStyleSettings(state) {
    if (!state) return state;
    state.wingerStyles = state.wingerStyles && typeof state.wingerStyles === 'object' ? state.wingerStyles : {};
    state.strikerStyles = state.strikerStyles && typeof state.strikerStyles === 'object' ? state.strikerStyles : {};
    NATIONAL_FORMATIONS.forEach(formation => {
        const wingers = state.wingerStyles[formation] || {};
        const striker = state.strikerStyles[formation] || {};
        state.wingerStyles[formation] = { LW: wingers.LW === 'sprint' ? 'sprint' : 'dribble', RW: wingers.RW === 'dribble' ? 'dribble' : 'sprint' };
        state.strikerStyles[formation] = { ST: striker.ST === 'linebreaker' ? 'linebreaker' : 'targetman' };
    });
    return state;
}
function getNationalWingerStyles(state, formation) {
    normalizeNationalStyleSettings(state);
    return state.wingerStyles[normalizeNationalFormation(formation)];
}
function getNationalStrikerStyles(state, formation) {
    normalizeNationalStyleSettings(state);
    return state.strikerStyles[normalizeNationalFormation(formation)];
}
function setNationalWingerStyle(position, isSprint) {
    const state=getNationalModeState(),formation=state&&normalizeNationalFormation(state.formation);
    if (!state || !['LW','RW'].includes(position)) return;
    getNationalWingerStyles(state,formation)[position]=isSprint?'sprint':'dribble';
    storeNationalStylePreset(state);
    saveNationalModeState();
}
function setNationalStrikerStyle(isLinebreaker) {
    const state=getNationalModeState(),formation=state&&normalizeNationalFormation(state.formation);
    if (!state) return;
    getNationalStrikerStyles(state,formation).ST=isLinebreaker?'linebreaker':'targetman';
    storeNationalStylePreset(state);
    saveNationalModeState();
}
function normalizeNationalSquadPreset(nationId) {
    const raw=nationalSquadPresets[nationId];
    if (!raw) return { currentFormation:'4-3-3', formations:{}, styleSettingsVersion:false, wingerStyles:{}, strikerStyles:{} };
    if (raw.formations && typeof raw.formations === 'object') {
        raw.currentFormation=normalizeNationalFormation(raw.currentFormation);
        raw.styleSettingsVersion=raw.styleSettingsVersion===true;
        raw.wingerStyles=raw.wingerStyles&&typeof raw.wingerStyles==='object'?raw.wingerStyles:{};
        raw.strikerStyles=raw.strikerStyles&&typeof raw.strikerStyles==='object'?raw.strikerStyles:{};
        NATIONAL_FORMATIONS.forEach(formation=>{
            const squad=raw.formations[formation]||{};
            raw.formations[formation]=Object.fromEntries(NATIONAL_SQUAD_SLOTS.map(slot=>[slot,squad[slot]||null]));
        });
        return raw;
    }
    const migrated={currentFormation:'4-3-3',formations:{'4-3-3':Object.fromEntries(NATIONAL_SQUAD_SLOTS.map(slot=>[slot,raw[slot]||null]))},styleSettingsVersion:false,wingerStyles:{},strikerStyles:{}};
    nationalSquadPresets[nationId]=migrated;
    try { localStorage.setItem('fc_star_national_squad_presets',JSON.stringify(nationalSquadPresets)); } catch(e) {}
    return migrated;
}
function storeNationalSquadPreset(state) {
    if (!state || !state.selectedNationId) return;
    const preset=normalizeNationalSquadPreset(state.selectedNationId);
    const formation=normalizeNationalFormation(state.formation);
    preset.currentFormation=formation;
    preset.formations[formation]=Object.fromEntries(NATIONAL_SQUAD_SLOTS.map(slot=>[slot,state.squad?.[slot]||null]));
    nationalSquadPresets[state.selectedNationId]=preset;
}
function applyNationalSquadPreset(state, nationId) {
    if (!state || !nationId) return;
    const preset=normalizeNationalSquadPreset(nationId);
    state.formation=normalizeNationalFormation(state.formation||preset.currentFormation);
    state.squad={...(preset.formations[state.formation]||createEmptyNationalSquad())};
    if (preset.styleSettingsVersion) {
        const formation=state.formation,wingers=preset.wingerStyles[formation]||{},strikers=preset.strikerStyles[formation]||{};
        normalizeNationalStyleSettings(state);
        state.wingerStyles[formation]={LW:wingers.LW==='sprint'?'sprint':'dribble',RW:wingers.RW==='dribble'?'dribble':'sprint'};
        state.strikerStyles[formation]={ST:strikers.ST==='linebreaker'?'linebreaker':'targetman'};
    }
}
function storeNationalStylePreset(state) {
    if (!state || !state.selectedNationId) return;
    const preset=normalizeNationalSquadPreset(state.selectedNationId),formation=normalizeNationalFormation(state.formation),wingers=getNationalWingerStyles(state,formation),strikers=getNationalStrikerStyles(state,formation);
    preset.styleSettingsVersion=true;
    preset.wingerStyles[formation]={LW:wingers.LW,RW:wingers.RW};
    preset.strikerStyles[formation]={ST:strikers.ST};
    nationalSquadPresets[state.selectedNationId]=preset;
    try { localStorage.setItem('fc_star_national_squad_presets',JSON.stringify(nationalSquadPresets)); } catch(e) {}
}
function rememberNationalSquadPreset(state) {
    if (!state || !state.selectedNationId) return;
    storeNationalSquadPreset(state);
    if (typeof syncNationalPlayerTeamSnapshot==='function') syncNationalPlayerTeamSnapshot(state);
    try { localStorage.setItem('fc_star_national_squad_presets',JSON.stringify(nationalSquadPresets)); } catch(e) {}
    if (typeof nationalDevMode !== 'undefined' && nationalDevMode) {
        if (typeof saveUserProgress==='function') saveUserProgress();
    } else if (typeof saveNationalModeState==='function') {
        saveNationalModeState();
    }
}

function getNationalSlotLabel(slot, formation = null) {
    const state=typeof getNationalModeState==='function'?getNationalModeState():null;
    const activeFormation=normalizeNationalFormation(formation||(state&&state.formation));
    return typeof getFormationDisplayPosition === 'function' ? getFormationDisplayPosition(slot, activeFormation) : slot;
}
function getNationalSlotRole(slot, formation = null) {
    const shown = getNationalSlotLabel(slot, formation);
    return ({ LCB:'CB', RCB:'CB', LCM:'CM', RCM:'CM', LM:'LW', RM:'RW', AM:'CAM', DM:'CM' })[shown] || shown;
}
function getNationalCardRole(card) {
    return ({ LCB:'CB', RCB:'CB', LCM:'CM', RCM:'CM', LM:'LW', RM:'RW', AM:'CAM', DM:'CM' })[card.position] || card.position;
}
function isNationalPositionCompatible(displayPosition, cardPosition) {
    if (typeof isPositionCompatible === 'function') return isPositionCompatible(displayPosition, cardPosition);
    if (displayPosition === 'GK') return cardPosition === 'GK';
    if (displayPosition === 'ST') return ['ST', 'LW', 'RW'].includes(cardPosition);
    if (['LW', 'RW', 'LM', 'RM'].includes(displayPosition)) return ['LW', 'RW', 'CAM'].includes(cardPosition);
    if (displayPosition === 'AM') return ['CM', 'LW', 'RW', 'CAM'].includes(cardPosition);
    if (['CM', 'LCM', 'RCM', 'DM'].includes(displayPosition)) return ['CM', 'CAM'].includes(cardPosition);
    if (['CB', 'LCB', 'RCB', 'LB', 'RB'].includes(displayPosition)) return ['CB', 'LB', 'RB'].includes(cardPosition);
    return false;
}
function getNationalEligibleCards(nationId, slot, formation = null) {
    const config = getNationalTeamConfig(nationId);
    if (!config || typeof playerDeck === 'undefined') return [];
    const displayPosition = getNationalSlotLabel(slot, formation);
    return Object.keys(playerDeck).filter(id => {
        const item = playerDeck[id], card = CARDS_DATABASE[id];
        return item && (item.quantity ?? 1) > 0 && card && card.nation === config.playerNation && isNationalPositionCompatible(displayPosition, card.position);
    }).sort((a, b) => getAwakenedCard(b).rating - getAwakenedCard(a).rating);
}
function canBuildNationalSquad(nationId, formation = null) {
    const activeState=typeof getNationalModeState==='function'?getNationalModeState():null;
    const activeFormation=normalizeNationalFormation(formation||(activeState&&activeState.formation));
    const candidates = NATIONAL_SQUAD_SLOTS.map(slot => getNationalEligibleCards(nationId, slot, activeFormation));
    if (candidates.some(list => !list.length)) return { ok:false, missing: NATIONAL_SQUAD_SLOTS.filter((_, i) => !candidates[i].length).map(slot=>getNationalSlotLabel(slot,activeFormation)) };
    const used = new Set();
    const ordered = NATIONAL_SQUAD_SLOTS.map((slot,i) => ({slot,list:candidates[i]})).sort((a,b) => a.list.length-b.list.length);
    const assign = index => {
        if (index === ordered.length) return true;
        return ordered[index].list.some(id => { if (used.has(id)) return false; used.add(id); if (assign(index + 1)) return true; used.delete(id); return false; });
    };
    return assign(0) ? { ok:true } : { ok:false, missing:['중복 없이 배치 가능한 선수'] };
}
function isNationalSquadComplete(state) {
    if (!state || !state.selectedNationId || !state.squad) return false;
    const formation=normalizeNationalFormation(state.formation),used=new Set();
    return NATIONAL_SQUAD_SLOTS.every(slot=>{
        const id=state.squad[slot];
        if(!id||used.has(id)||!getNationalEligibleCards(state.selectedNationId,slot,formation).includes(id))return false;
        used.add(id);
        return true;
    });
}
const NATIONAL_PITCH_COORDINATES = {
    '4-3-3': {
        LW:{top:'15%',left:'15%'},ST:{top:'8%',left:'50%'},RW:{top:'15%',left:'85%'},
        LCM:{top:'44%',left:'22%'},CM:{top:'50%',left:'50%'},RCM:{top:'44%',left:'78%'},
        LB:{top:'73%',left:'12%'},LCB:{top:'77%',left:'36%'},RCB:{top:'77%',left:'64%'},RB:{top:'73%',left:'88%'},GK:{top:'90%',left:'50%'}
    },
    '3-4-3': {
        ST:{top:'8%',left:'50%'},LW:{top:'15%',left:'20%'},RW:{top:'15%',left:'80%'},CM:{top:'28%',left:'50%'},
        LB:{top:'42%',left:'15%'},RB:{top:'42%',left:'85%'},RCM:{top:'48%',left:'50%'},
        LCB:{top:'66%',left:'28%'},RCB:{top:'66%',left:'72%'},LCM:{top:'68%',left:'50%'},GK:{top:'90%',left:'50%'}
    },
    '5-4-1': {
        ST:{top:'8%',left:'50%'},LW:{top:'36%',left:'15%'},RW:{top:'36%',left:'85%'},LCM:{top:'42%',left:'35%'},RCM:{top:'42%',left:'65%'},
        LB:{top:'65%',left:'12%'},LCB:{top:'74%',left:'30%'},CM:{top:'73%',left:'50%'},RCB:{top:'74%',left:'70%'},RB:{top:'65%',left:'88%'},GK:{top:'90%',left:'50%'}
    },
    '4-2-3-1': {
        ST:{top:'8%',left:'50%'},LW:{top:'25%',left:'20%'},RW:{top:'25%',left:'80%'},CM:{top:'28%',left:'50%'},
        LCM:{top:'52%',left:'33%'},RCM:{top:'52%',left:'67%'},LB:{top:'73%',left:'12%'},
        LCB:{top:'77%',left:'36%'},RCB:{top:'77%',left:'64%'},RB:{top:'73%',left:'88%'},GK:{top:'90%',left:'50%'}
    }
};
function getNationalSquadSummary(state) {
    const filled=NATIONAL_SQUAD_SLOTS.filter(slot=>state.squad[slot]&&CARDS_DATABASE[state.squad[slot]]).length;
    const average=key=>Math.round(NATIONAL_SQUAD_SLOTS.reduce((sum,slot)=>{const id=state.squad[slot],card=id&&CARDS_DATABASE[id]?getAwakenedCard(id):null;return sum+(card?(card.stats?.[key]??card[key]??card.rating):70);},0)/11);
    const ovr=Math.round(NATIONAL_SQUAD_SLOTS.reduce((sum,slot)=>{const id=state.squad[slot];return sum+(id&&CARDS_DATABASE[id]?getAwakenedCard(id).rating:70);},0)/11);
    return {filled,ovr,stats:Object.fromEntries(['pac','sho','pas','dri','def','phy'].map(key=>[key,average(key)]))};
}
function getNationalKeyPlayerStatus(state) {
    const formation=normalizeNationalFormation(state&&state.formation),rule=NATIONAL_KEY_PLAYER_RULES[formation];
    const slots=rule?(rule.slots||[rule.slot]):[];
    const candidates=slots.map(slot=>{const cardId=state&&state.squad?state.squad[slot]:null,card=cardId&&CARDS_DATABASE[cardId]?getAwakenedCard(cardId):null;return {slot,card,value:card&&card.stats?Number(card.stats[rule.stat]||0):0};});
    const activeCandidate=candidates.find(item=>item.value>=rule.minimum)||candidates[0]||{card:null,value:0};
    return { ...rule, slots, formation, card:activeCandidate.card, value:activeCandidate.value, active:candidates.some(item=>item.value>=rule.minimum) };
}
function nationalPitchStyleBadge(slot,state,formation) {
    let style=null,icon='',label='',className='';
    if (['LW','RW'].includes(slot)) {
        style=getNationalWingerStyles(state,formation)[slot];
        if (style==='sprint') { icon='fa-person-running'; label='치고 달리기'; className='sprint'; }
        else { icon='fa-wand-magic-sparkles'; label='드리블 돌파'; className='dribble'; }
    } else if (slot==='ST') {
        style=getNationalStrikerStyles(state,formation).ST;
        if (style==='linebreaker') { icon='fa-bolt'; label='라인브레이커'; className='linebreaker'; }
        else { icon='fa-bullseye'; label='타겟맨'; className='targetman'; }
    }
    return style?`<div class="mini-card-position-badge national-style-badge ${className}" title="${label}"><i class="fa-solid ${icon}"></i></div>`:'';
}
function nationalPitchCard(slot,state) {
    const formation=normalizeNationalFormation(state.formation),cardId=state.squad[slot],base=cardId&&CARDS_DATABASE[cardId],card=base&&getAwakenedCard(cardId),coord=NATIONAL_PITCH_COORDINATES[formation][slot];
    const keyRule=NATIONAL_KEY_PLAYER_RULES[formation],isKeyPlayerSlot=keyRule&&(keyRule.slots||[keyRule.slot]).includes(slot);
    const styleBadge=card?nationalPitchStyleBadge(slot,state,formation):'';
    const positionBadge=styleBadge||`<div class="mini-card-position-badge">${base&&base.position||slot}</div>`;
    const content=card?`<div class="mini-player-card active-placed"><div class="mini-card-ovr-badge">${card.rating}</div>${positionBadge}<div class="mini-card-portrait"><img src="${base.image}" alt="${base.name}" onerror="this.style.display='none'"></div><div class="mini-card-name">${base.name}</div></div>`:`<div class="mini-player-card anonymous"><div class="mini-card-ovr-badge">70</div><div class="mini-card-portrait"><i class="fa-solid fa-user-ninja"></i></div><div class="mini-card-name">무명 선수</div></div>`;
    const keyClass=isKeyPlayerSlot?' key-player-slot':'';
    const keyAttrs=isKeyPlayerSlot?` data-key-label="★핵심 ${getNationalSlotLabel(slot,formation)}" title="${formation} 핵심 선수: ${getNationalSlotLabel(slot,formation)} ${keyRule.statLabel} ${keyRule.minimum} 이상 (OVR +1)"`:'';
    return `<div class="pitch-slot national-pitch-slot${keyClass}"${keyAttrs} style="top:${coord.top};left:${coord.left}" onclick="openNationalCardSelector('${slot}')">${content}<div class="pitch-position-label">${getNationalSlotLabel(slot,formation)}</div></div>`;
}
function nationalStyleSwitch(label, detail, checked, onChange, icon) {
    return `<div class="national-style-control"><div><strong><i class="fa-solid ${icon}"></i> ${label}</strong><small>${detail}</small></div><label class="national-style-switch"><input type="checkbox" ${checked?'checked':''} onchange="${onChange}"><span class="national-style-slider"></span></label></div>`;
}
function updateNationalStyleControl(valueId, isActive, activeLabel, inactiveLabel) {
    const value=document.getElementById(valueId);
    if (!value) return;
    value.textContent=isActive?activeLabel:inactiveLabel;
    value.classList.toggle('active',isActive);
}
function nationalPlayerStyleSettingsHtml(state, formation, slot) {
    if (['LW','RW'].includes(slot)) {
        const isSprint=getNationalWingerStyles(state,formation)[slot]==='sprint',label=getNationalSlotLabel(slot,formation);
        const valueId=`nationalWingerStyleValue-${slot}`,activeLabel='치고 달리기 ⚡',inactiveLabel='드리블 돌파 🌀';
        return `<section class="national-style-settings national-player-style-settings"><div class="national-style-control national-player-style-control"><strong><i class="fa-solid fa-arrows-left-right"></i> ${label} 윙어 플레이스타일 설정</strong><div class="national-style-action"><span id="${valueId}" class="national-style-value ${isSprint?'active':''}">${isSprint?activeLabel:inactiveLabel}</span><label class="national-style-switch"><input type="checkbox" ${isSprint?'checked':''} onchange="setNationalWingerStyle('${slot}', this.checked);updateNationalStyleControl('${valueId}', this.checked, '${activeLabel}', '${inactiveLabel}')"><span class="national-style-slider"></span></label></div></div></section>`;
    }
    if (slot==='ST') {
        const isLinebreaker=getNationalStrikerStyles(state,formation).ST==='linebreaker';
        const valueId='nationalStrikerStyleValue',activeLabel='라인브레이커 ⚡',inactiveLabel='타겟맨 🌀';
        return `<section class="national-style-settings national-player-style-settings"><div class="national-style-control national-player-style-control"><strong><i class="fa-solid fa-arrows-left-right"></i> 스트라이커 플레이스타일 설정</strong><div class="national-style-action"><span id="${valueId}" class="national-style-value ${isLinebreaker?'active':''}">${isLinebreaker?activeLabel:inactiveLabel}</span><label class="national-style-switch"><input type="checkbox" ${isLinebreaker?'checked':''} onchange="setNationalStrikerStyle(this.checked);updateNationalStyleControl('${valueId}', this.checked, '${activeLabel}', '${inactiveLabel}')"><span class="national-style-slider"></span></label></div></div></section>`;
    }
    return '';
}
function renderNationalSquadEditor() {
    const root=document.getElementById('nationalSquadEditor'),state=getNationalModeState();if(!root||!state||!state.selectedNationId)return;
    const config=getNationalTeamConfig(state.selectedNationId),summary=getNationalSquadSummary(state),stats=summary.stats;
    const statRows=[['pac','PAC','속도'],['sho','SHO','슛'],['pas','PAS','패스'],['dri','DRI','드리블'],['def','DEF','수비'],['phy','PHY','피지컬']];
    const formation=normalizeNationalFormation(state.formation);
    const keyStatus=getNationalKeyPlayerStatus(state);
    const formationButtons=NATIONAL_FORMATIONS.map(item=>`<button class="national-formation-button ${item===formation?'active':''}" onclick="changeNationalFormation('${item}')">${item}</button>`).join('');
    const keyStatusHtml=`<div class="national-key-player-status"><span><i class="fa-solid fa-star"></i> ${formation} 핵심 선수 <strong>${keyStatus.role}</strong> · ${keyStatus.statLabel} ${keyStatus.minimum} 이상 <small>(OVR +1)</small></span><b class="${keyStatus.active?'active':'inactive'}">${keyStatus.active?`활성 ✓ · ${keyStatus.card.name} ${keyStatus.value}`:'비활성 ✕'}</b></div>`;
    const selectedSlotLabel=nationalSelectedSlot?getNationalSlotLabel(nationalSelectedSlot,formation):'';
    root.innerHTML=`<div class="squad-container national-squad-container"><div class="squad-header national-squad-header"><div class="national-formation-picker"><span><i class="fa-solid fa-gears"></i> 포메이션</span>${formationButtons}</div><div class="squad-header-right"><div class="deck-count">선발 <span>${summary.filled}</span>/11</div><div class="deck-count">팀 OVR: <span class="national-ovr-value">${summary.ovr}</span></div></div></div>${keyStatusHtml}<div class="pitch-outer-wrapper"><div class="football-pitch"><div class="pitch-line pitch-center-circle"></div><div class="pitch-line pitch-half-line"></div><div class="pitch-line pitch-penalty-area-top"></div><div class="pitch-line pitch-penalty-area-bottom"></div><div class="pitch-line pitch-center-spot"></div>${NATIONAL_SQUAD_SLOTS.map(slot=>nationalPitchCard(slot,state)).join('')}</div></div><div class="team-average-stats-board national-average-board"><h4><i class="fa-solid fa-chart-simple"></i> ${config.name} 베스트 11 팀 평균 능력치</h4><div class="team-avg-grid">${statRows.map(([key,code,label])=>`<div class="national-stat national-stat-${key}"><small>${code} (${label})</small><strong>${stats[key]}</strong></div>`).join('')}</div></div></div><div class="drawer-overlay national-drawer-overlay ${nationalSelectedSlot?'active':''}" id="nationalDrawerOverlay" onclick="if(event.target===this)closeNationalCardSelector()"><aside class="selector-drawer"><div class="drawer-header national-drawer-header"><h3>선수 배치하기 (${selectedSlotLabel})</h3><button class="btn-close-drawer national-drawer-close-button" onclick="closeNationalCardSelector()" aria-label="선수 배치 완료"><i class="fa-solid fa-xmark"></i></button></div><div class="drawer-content" id="nationalDrawerContent"></div></aside></div>`;
    if(nationalSelectedSlot)renderNationalCandidates();
}
function openNationalCardSelector(slot){if(!NATIONAL_SQUAD_SLOTS.includes(slot))return;nationalSelectedSlot=slot;renderNationalSquadEditor();}
function closeNationalCardSelector(){nationalSelectedSlot=null;renderNationalSquadEditor();}
function selectNationalSlot(slot){openNationalCardSelector(slot);}
function renderNationalCandidates(){
    const box=document.getElementById('nationalDrawerContent'),state=getNationalModeState();if(!box||!state||!nationalSelectedSlot)return;
    const formation=normalizeNationalFormation(state.formation),assigned=state.squad[nationalSelectedSlot],candidates=getNationalEligibleCards(state.selectedNationId,nationalSelectedSlot,formation);
    const styleSettings=nationalPlayerStyleSettingsHtml(state,formation,nationalSelectedSlot);
    let html=styleSettings;
    if(assigned)html+=`<button class="btn-release-player" onclick="releaseNationalCard()"><i class="fa-solid fa-user-minus"></i> 배치 해제</button>`;
    if(!candidates.length)html+='<div class="empty-drawer-state"><i class="fa-regular fa-face-frown"></i><p>이 자리에 배치할 수 있는 보유 카드가 없습니다.</p></div>';
    else html+=candidates.map(id=>{const base=CARDS_DATABASE[id],card=getAwakenedCard(id),used=Object.entries(state.squad).some(([slot,placed])=>slot!==nationalSelectedSlot&&placed===id),stats=card.stats||base.stats||{};return `<div class="drawer-card-item ${used?'national-card-used':''}"><div class="drawer-card-info"><div class="drawer-card-thumb"><img src="${base.image}" alt="${base.name}" onerror="this.style.display='none'"></div><div class="drawer-card-details"><h4>${base.name} <span>OVR ${card.rating}</span></h4><p>${base.position} · ${used?'다른 자리에 배치됨':'기용 가능'}</p><div class="national-drawer-stats"><span>PAC ${stats.pac??'-'}</span><span>SHO ${stats.sho??'-'}</span><span>PAS ${stats.pas??'-'}</span><span>DRI ${stats.dri??'-'}</span><span>DEF ${stats.def??'-'}</span><span>PHY ${stats.phy??'-'}</span></div></div></div><button class="btn-select-player" onclick="assignNationalCard('${id}')">${assigned===id?'선택됨':'선택'}</button></div>`;}).join('');
    box.innerHTML=html;
}
function changeNationalFormation(formation){
    const state=getNationalModeState(),next=normalizeNationalFormation(formation);
    if(!state||next===state.formation)return;
    storeNationalSquadPreset(state);
    const preset=normalizeNationalSquadPreset(state.selectedNationId);
    state.formation=next;
    preset.currentFormation=next;
    state.squad={...(preset.formations[next]||createEmptyNationalSquad())};
    nationalSelectedSlot=null;
    rememberNationalSquadPreset(state);
    renderNationalMode();
    if(typeof showToast==='function')showToast(`⚽ 국대 포메이션이 ${next}(으)로 변경되었습니다.`);
}
function assignNationalCard(cardId){const state=getNationalModeState();if(!state||!nationalSelectedSlot||!getNationalEligibleCards(state.selectedNationId,nationalSelectedSlot,state.formation).includes(cardId))return;Object.keys(state.squad).forEach(slot=>{if(state.squad[slot]===cardId)state.squad[slot]=null;});state.squad[nationalSelectedSlot]=cardId;nationalSelectedSlot=null;rememberNationalSquadPreset(state);renderNationalMode();}
function releaseNationalCard(){const state=getNationalModeState();if(!state||!nationalSelectedSlot)return;state.squad[nationalSelectedSlot]=null;nationalSelectedSlot=null;rememberNationalSquadPreset(state);renderNationalMode();}
