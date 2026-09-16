// js/national_data.js - National team mode data (kept independent from club data)
const NATIONAL_TEAMS = {
    KR: { id: 'KR', name: '대한민국', playerNation: 'South Korea', flag: 'https://flagcdn.com/w80/kr.png', color: '#c8102e', shortName: 'KOR', formation: '4-3-3', stars: ['손흥민', '이강인'] },
    JP: { id: 'JP', name: '일본', playerNation: 'Japan', flag: 'https://flagcdn.com/w80/jp.png', color: '#003f87', shortName: 'JPN', formation: '3-4-3', stars: ['미토마', '쿠보'] }
};

const NATIONAL_WORLD_ELITE = ['FR', 'AR', 'ES', 'BR', 'EN', 'DE'];
const NATIONAL_ASIA_ELITE = ['KR', 'JP', 'IR', 'SA'];
const NATIONAL_FORMATION_POOL = ['4-3-3', '3-4-3', '5-4-1', '4-2-3-1', '4-4-2'];
const NATIONAL_AI_FORMATIONS = {
    FR:'4-3-3', AR:'4-3-3', ES:'4-3-3', BR:'4-2-3-1', EN:'4-3-3', DE:'4-2-3-1', PT:'4-2-3-1', NL:'4-3-3', IT:'3-4-3', BE:'4-3-3', HR:'4-3-3', UY:'4-2-3-1', CO:'4-3-3', MX:'4-2-3-1', US:'4-3-3', CA:'4-2-3-1', MA:'5-4-1', SN:'4-3-3', NG:'4-2-3-1', EG:'4-3-3', GH:'4-2-3-1',
    IR:'4-2-3-1', SA:'4-3-3', AU:'4-3-3', QA:'3-4-3', UZ:'4-2-3-1', RS:'3-4-3', CH:'4-2-3-1', DK:'4-3-3', TR:'4-2-3-1', IQ:'4-2-3-1', AE:'4-3-3', OM:'5-4-1', JO:'3-4-3', BH:'5-4-1', CN:'4-2-3-1', KW:'4-4-2', ID:'4-3-3', TH:'4-2-3-1'
};
const NATIONAL_WORLD_POOL = ['FR','AR','ES','BR','EN','DE','PT','NL','IT','BE','HR','UY','CO','MX','US','CA','MA','SN','NG','EG','GH','JP','KR','IR','SA','AU','QA','UZ','RS','CH','DK','TR'];
const NATIONAL_ASIA_POOL = ['KR','JP','IR','SA','AU','QA','UZ','IQ','AE','OM','JO','BH','CN','KW','ID','TH'];

const NATIONAL_AI_TEAMS = {
    FR:['프랑스','https://flagcdn.com/w80/fr.png','음바페','그리즈만'], AR:['아르헨티나','https://flagcdn.com/w80/ar.png','메시','라우타로'], ES:['스페인','https://flagcdn.com/w80/es.png','야말','페드리'], BR:['브라질','https://flagcdn.com/w80/br.png','비니시우스','호드리구'], EN:['잉글랜드','https://flagcdn.com/w80/gb-eng.png','케인','벨링엄'], DE:['독일','https://flagcdn.com/w80/de.png','무시알라','비르츠'],
    PT:['포르투갈','https://flagcdn.com/w80/pt.png','호날두','브루노'], NL:['네덜란드','https://flagcdn.com/w80/nl.png','각포','데파이'], IT:['이탈리아','https://flagcdn.com/w80/it.png','레테기','바렐라'], BE:['벨기에','https://flagcdn.com/w80/be.png','루카쿠','더브라위너'], HR:['크로아티아','https://flagcdn.com/w80/hr.png','모드리치','크라마리치'], UY:['우루과이','https://flagcdn.com/w80/uy.png','누녜스','발베르데'], CO:['콜롬비아','https://flagcdn.com/w80/co.png','루이스 디아스','하메스'], MX:['멕시코','https://flagcdn.com/w80/mx.png','히메네스','로사노'], US:['미국','https://flagcdn.com/w80/us.png','풀리시치','맥케니'], CA:['캐나다','https://flagcdn.com/w80/ca.png','데이비스','데이비드'], MA:['모로코','https://flagcdn.com/w80/ma.png','엔네시리','하키미'], SN:['세네갈','https://flagcdn.com/w80/sn.png','마네','쿨리발리'], NG:['나이지리아','https://flagcdn.com/w80/ng.png','오시멘','루크먼'], EG:['이집트','https://flagcdn.com/w80/eg.png','살라','트레제게'], GH:['가나','https://flagcdn.com/w80/gh.png','쿠두스','파티'],
    IR:['이란','https://flagcdn.com/w80/ir.png','타레미','아즈문'], SA:['사우디아라비아','https://flagcdn.com/w80/sa.png','알도사리','알셰흐리'], AU:['호주','https://flagcdn.com/w80/au.png','어바인','맥클라렌'], QA:['카타르','https://flagcdn.com/w80/qa.png','아피프','알모에즈'], UZ:['우즈베키스탄','https://flagcdn.com/w80/uz.png','쇼무로도프','파이줄라예프'], RS:['세르비아','https://flagcdn.com/w80/rs.png','블라호비치','미트로비치'], CH:['스위스','https://flagcdn.com/w80/ch.png','샤키리','엠볼로'], DK:['덴마크','https://flagcdn.com/w80/dk.png','회이룬','에릭센'], TR:['튀르키예','https://flagcdn.com/w80/tr.png','찰하놀루','귈레르'],
    IQ:['이라크','https://flagcdn.com/w80/iq.png','아이멘 후세인','알리 자심'], AE:['아랍에미리트','https://flagcdn.com/w80/ae.png','마브쿠트','카이우'], OM:['오만','https://flagcdn.com/w80/om.png','알가사니','알무샤이프리'], JO:['요르단','https://flagcdn.com/w80/jo.png','알타마리','알나이마트'], BH:['바레인','https://flagcdn.com/w80/bh.png','알아스와드','알하샤시'], CN:['중국','https://flagcdn.com/w80/cn.png','우레이','장위닝'], KW:['쿠웨이트','https://flagcdn.com/w80/kw.png','알무타리','알다피리'], ID:['인도네시아','https://flagcdn.com/w80/id.png','스트라위크','오라트망군'], TH:['태국','https://flagcdn.com/w80/th.png','송크라신','수파촉']
};

function getNationalTeamConfig(id) {
    if (NATIONAL_TEAMS[id]) return NATIONAL_TEAMS[id];
    const ai = NATIONAL_AI_TEAMS[id];
    return ai ? { id, name: ai[0], flag: ai[1], shortName: id, formation: NATIONAL_AI_FORMATIONS[id] || '4-4-2', stars: [ai[2], ai[3]], color: '#475569' } : null;
}
