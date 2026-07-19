/* 
 * player/player_data.js - Modular Player Card Database
 * 
 * ⚠️ [중요 - 포지션 부여 가이드라인]
 * 향후 새로운 선수 카드 추가 시, position 속성에는 아래의 표준화된 8가지 값만 부여해야 합니다:
 * - 'ST' (스트라이커)
 * - 'LW', 'RW' (윙어 / W)
 * - 'CM' (미드필더 / DM, AM 포함)
 * - 'CB' (중앙 수비수)
 * - 'LB', 'RB' (측면 수비수 / L&R Back)
 * - 'GK' (골키퍼)
 * 
 * 그 외의 값은 포메이션 슬롯 배치 제한 시스템에 의해 배치 제한에 걸릴 수 있습니다.
 */

const CARDS_DATABASE = {
    "son_heung_min": {
        id: "son_heung_min",
        name: "손흥민",
        rating: 89,
        position: "LW",
        nation: "South Korea",
        nationFlag: "https://flagcdn.com/w40/kr.png",
        club: "LA FC",
        image: "player/손흥민.png",
        rarity: "legend",
        description: "대한민국 축구 역사상 최고의 전설적인 공격수입니다. 탁월한 리더십과 훌륭한 인품, 그리고 그라운드 위에서 끝까지 최선을 다하는 헌신적인 태도로 동료 선수들과 온 국민의 열렬한 사랑과 성원을 받는 이 시대 최고의 축구 선수이자 아이콘입니다.",
        theme: {
            primary: "#000000",
            secondary: "#c39e5c",
            glow: "#ffd700"
        },
        stats: {
            pac: 91,
            sho: 89,
            pas: 84,
            dri: 87,
            def: 42,
            phy: 72
        }
    },
    "lee_seung_woo": {
        id: "lee_seung_woo",
        name: "이승우",
        rating: 82,
        position: "LW",
        nation: "South Korea",
        nationFlag: "https://flagcdn.com/w40/kr.png",
        club: "JEONBUK",
        image: "player/이승우.png",
        rarity: "normal",
        description: "번뜩이는 천재성과 예측 불가능한 플레이 스타일을 지닌 대한민국 최고의 크랙형 공격수입니다. 뛰어난 테크닉, 폭발적인 드리블 스피드, 그리고 독보적인 스타성으로 경기장 분위기를 한순간에 뒤바꿔 놓는 해결사입니다.",
        theme: {
            primary: "#005a3c",
            secondary: "#ffd700",
            glow: "#00ff87"
        },
        stats: {
            pac: 87,
            sho: 80,
            pas: 78,
            dri: 85,
            def: 38,
            phy: 62
        }
    },
    "lee_seung_woo_kr": {
        id: "lee_seung_woo_kr",
        name: "이승우",
        rating: 86,
        position: "LW",
        nation: "South Korea",
        nationFlag: "https://flagcdn.com/w40/kr.png",
        club: "KOREA",
        image: "player/이승우_kr.png",
        rarity: "special",
        description: "가슴에 찬란한 태극 마크를 품고 대한민국의 붉은 함성을 이끄는 특급 국가대표 윙어 이승우입니다. 특유의 기동력과 지칠 줄 모르는 과감한 돌파력, 그리고 그라운드 위에서 번뜩이는 천재적인 플레이로 조국의 승리를 이끄는 스페셜 공격수입니다.",
        theme: {
            primary: "#da1a32",
            secondary: "#1d2b58",
            glow: "#ff2a55"
        },
        stats: {
            pac: 90,
            sho: 84,
            pas: 83,
            dri: 88,
            def: 40,
            phy: 68
        }
    },
    "yang_hyun_jun": {
        id: "yang_hyun_jun",
        name: "양현준",
        rating: 85,
        position: "RW",
        nation: "South Korea",
        nationFlag: "https://flagcdn.com/w40/kr.png",
        club: "CELTIC",
        image: "player/양현준.webp",
        rarity: "special",
        description: "폭발적인 스피드와 저돌적인 드리블 돌파력을 지닌 대한민국의 차세대 윙어 양현준입니다. 과감한 1대1 돌파와 날카로운 크로스로 경기장 측면을 지배하는 대한민국 국가대표팀의 미래이자 스페셜 공격수입니다.",
        theme: {
            primary: "#da1a32",
            secondary: "#1d2b58",
            glow: "#ff2a55"
        },
        stats: {
            pac: 88,
            sho: 82,
            pas: 79,
            dri: 86,
            def: 42,
            phy: 70
        }
    },
    "lee_kang_in": {
        id: "lee_kang_in",
        name: "이강인",
        rating: 86,
        position: "RW",
        nation: "South Korea",
        nationFlag: "https://flagcdn.com/w40/kr.png",
        club: "PARIS SG",
        image: "player/이강인.png",
        rarity: "legend",
        description: "세계 최고의 명문 구단 중 하나인 파리 생제르맹(PSG)에서 활약 중인 대한민국의 대표 미드필더입니다. 압도적인 탈압박과 전매특허인 왼발 정밀 크로스, 그리고 그라운드를 종횡무진하는 마술 같은 시야로 경기를 주도하는 월드클래스 천재 크랙입니다.",
        theme: {
            primary: "#0052b4",
            secondary: "#e30613",
            glow: "#ffd700"
        },
        stats: {
            pac: 83,
            sho: 82,
            pas: 89,
            dri: 89,
            def: 45,
            phy: 68
        }
    },
    "oberdan": {
        id: "oberdan",
        name: "오베르단",
        rating: 81,
        position: "CM",
        nation: "Brazil",
        nationFlag: "https://flagcdn.com/w40/br.png",
        club: "JEONBUK",
        image: "player/오베르단.png",
        rarity: "normal",
        description: "엄청난 활동량과 강력한 수비력을 겸비한 전북 현대의 핵심 수비형 미드필더입니다. 중원 전체를 커버하는 넓은 수비 범위와 지치지 않는 체력으로 팀의 엔진 역할을 수행합니다.",
        theme: {
            primary: "#005a3c",
            secondary: "#ffd700",
            glow: "#00ff87"
        },
        stats: {
            pac: 78,
            sho: 70,
            pas: 78,
            dri: 80,
            def: 81,
            phy: 82
        }
    },
    "song_bum_keun": {
        id: "song_bum_keun",
        name: "송범근",
        rating: 82,
        position: "GK",
        nation: "South Korea",
        nationFlag: "https://flagcdn.com/w40/kr.png",
        club: "JEONBUK",
        image: "player/송범근.png",
        rarity: "normal",
        description: "뛰어난 반사신경과 안정적인 공중볼 처리 능력을 갖춘 전북 현대의 주전 골키퍼입니다. 위기 상황마다 보여주는 눈부신 슈퍼 세이브와 침착한 경기 운영으로 최후방 수비라인의 든든한 버팀목입니다.",
        theme: {
            primary: "#005a3c",
            secondary: "#ffffff",
            glow: "#00d2ff"
        },
        stats: {
            pac: 80,
            sho: 79,
            pas: 75,
            dri: 82,
            def: 82,
            phy: 81
        }
    },
    "compagno": {
        id: "compagno",
        name: "콤파뇨",
        rating: 85,
        position: "ST",
        nation: "Italy",
        nationFlag: "https://flagcdn.com/w40/it.png",
        club: "JEONBUK",
        image: "player/콤파뇨.png",
        rarity: "special",
        description: "탁월한 피지컬과 높은 타점의 헤더를 자랑하는 전북 현대의 정통 타겟맨 스트라이커입니다. 박스 안에서의 압도적인 집중력과 찬스를 놓치지 않는 뛰어난 골 결정력으로 수비진에게 공포를 줍니다.",
        theme: {
            primary: "#005a3c",
            secondary: "#008c45",
            glow: "#ffd700"
        },
        stats: {
            pac: 77,
            sho: 88,
            pas: 71,
            dri: 77,
            def: 42,
            phy: 90
        }
    },
    "tiago": {
        id: "tiago",
        name: "티아고",
        rating: 79,
        position: "ST",
        nation: "Brazil",
        nationFlag: "https://flagcdn.com/w40/br.png",
        club: "JEONBUK",
        image: "player/티아고.png",
        rarity: "normal",
        description: "브라질 출신의 파워풀하고 돌파력이 뛰어난 전북 현대의 대형 공격수입니다. 탄탄한 피지컬을 활용한 포스트 플레이와 강력한 전방 압박, 묵직한 슈팅으로 매번 득점 기회를 노립니다.",
        theme: {
            primary: "#005a3c",
            secondary: "#fec913",
            glow: "#ffd700"
        },
        stats: {
            pac: 76,
            sho: 79,
            pas: 63,
            dri: 74,
            def: 40,
            phy: 83
        }
    },
    "motta": {
        id: "motta",
        name: "모따",
        rating: 79,
        position: "ST",
        nation: "Brazil",
        nationFlag: "https://flagcdn.com/w40/br.png",
        club: "JEONBUK",
        image: "player/모따.png",
        rarity: "normal",
        description: "유연한 발재간과 탁월한 공간 침투력을 보유한 브라질 테크니션 포워드입니다. 감각적인 연계 플레이와 빠른 반박자 빠른 슈팅 타이밍으로 상대의 골문을 흔드는 크랙입니다.",
        theme: {
            primary: "#005a3c",
            secondary: "#fec913",
            glow: "#ff9f00"
        },
        stats: {
            pac: 75,
            sho: 80,
            pas: 64,
            dri: 73,
            def: 35,
            phy: 80
        }
    },
    "kim_jin_gyu": {
        id: "kim_jin_gyu",
        name: "김진규",
        rating: 79,
        position: "CM",
        nation: "South Korea",
        nationFlag: "https://flagcdn.com/w40/kr.png",
        club: "JEONBUK",
        image: "player/김진규.png",
        rarity: "normal",
        description: "넓은 시야와 날카로운 패스로 빌드업의 중심을 잡는 플레이메이커입니다. 영리한 위치 선정과 지능적인 압박 타이밍으로 전북 현대 중원의 연결고리 역할을 확실하게 수행합니다.",
        theme: {
            primary: "#005a3c",
            secondary: "#ffffff",
            glow: "#00d2ff"
        },
        stats: {
            pac: 74,
            sho: 72,
            pas: 80,
            dri: 78,
            def: 68,
            phy: 72
        }
    },
    "lee_yeong_jae": {
        id: "lee_yeong_jae",
        name: "이영재",
        rating: 79,
        position: "CM",
        nation: "South Korea",
        nationFlag: "https://flagcdn.com/w40/kr.png",
        club: "JEONBUK",
        image: "player/이영재.png",
        rarity: "normal",
        description: "마법 같은 왼발 킥력을 지닌 K리그 정상급 플레이메이커 미드필더입니다. 날카로운 세트피스 전담 키커이자, 한 번에 수비를 뚫어버리는 허를 찌르는 전진 패스가 매우 돋보입니다.",
        theme: {
            primary: "#005a3c",
            secondary: "#ffd700",
            glow: "#00ff87"
        },
        stats: {
            pac: 73,
            sho: 76,
            pas: 81,
            dri: 79,
            def: 60,
            phy: 68
        }
    },
    "kim_seung_sub": {
        id: "kim_seung_sub",
        name: "김승섭",
        rating: 84,
        position: "LW",
        nation: "South Korea",
        nationFlag: "https://flagcdn.com/w40/kr.png",
        club: "JEONBUK",
        image: "player/김승섭.png",
        rarity: "normal",
        description: "빠른 스피드와 지치지 않는 체력으로 측면을 돌파하는 헌신적인 윙어입니다. 넓은 활동 영역을 바탕으로 한 날카로운 컷백과 활발한 수비 가담으로 전술적 다양성을 늘려줍니다.",
        theme: {
            primary: "#005a3c",
            secondary: "#ffffff",
            glow: "#00d2ff"
        },
        stats: {
            pac: 86,
            sho: 84,
            pas: 77,
            dri: 84,
            def: 55,
            phy: 70
        }
    },
    "lee_dong_jun": {
        id: "lee_dong_jun",
        name: "이동준",
        rating: 78,
        position: "RW",
        nation: "South Korea",
        nationFlag: "https://flagcdn.com/w40/kr.png",
        club: "JEONBUK",
        image: "player/이동준.png",
        rarity: "normal",
        description: "K리그에서 가장 폭발적인 순간 가속도를 자랑하는 스피드 스타 윙어입니다. 수비 뒷공간을 완전히 허무는 순간적인 배후 침투와 과감한 일대일 돌파가 전매특허입니다.",
        theme: {
            primary: "#005a3c",
            secondary: "#ffffff",
            glow: "#ff3366"
        },
        stats: {
            pac: 89,
            sho: 77,
            pas: 70,
            dri: 80,
            def: 35,
            phy: 60
        }
    },
    "kim_tae_hwan": {
        id: "kim_tae_hwan",
        name: "김태환",
        rating: 78,
        position: "RB",
        nation: "South Korea",
        nationFlag: "https://flagcdn.com/w40/kr.png",
        club: "JEONBUK",
        image: "player/김태환.png",
        rarity: "normal",
        description: "전북 현대의 우측 측면을 책임지는 베테랑 풀백 김태환입니다. '치타'라는 별명에 걸맞은 폭발적인 스피드와 투지 넘치는 대인 수비, 그리고 저돌적인 오버래핑으로 팀의 측면에 단단함과 활력을 불어넣는 든든한 수비수입니다.",
        theme: {
            primary: "#005a3c",
            secondary: "#ff3366",
            glow: "#ff3366"
        },
        stats: {
            pac: 85,
            sho: 60,
            pas: 73,
            dri: 72,
            def: 76,
            phy: 79
        }
    },
    "gamboa": {
        id: "gamboa",
        name: "감보아",
        rating: 78,
        position: "CM",
        nation: "Portugal",
        nationFlag: "https://flagcdn.com/w40/pt.png",
        club: "JEONBUK",
        image: "player/감보아.png",
        rarity: "normal",
        description: "포르투갈 출신의 탄탄한 기본기와 노련한 경기 조율 능력을 가진 중앙 미드필더입니다. 중원에서 침착한 볼 소유와 안정적인 전진 패스로 전체적인 공수 밸런스를 차분히 조절해 줍니다.",
        theme: {
            primary: "#005a3c",
            secondary: "#a855f7",
            glow: "#a855f7"
        },
        stats: {
            pac: 72,
            sho: 65,
            pas: 75,
            dri: 74,
            def: 78,
            phy: 80
        }
    },
    "kim_young_bin": {
        id: "kim_young_bin",
        name: "김영빈",
        rating: 77,
        position: "CB",
        nation: "South Korea",
        nationFlag: "https://flagcdn.com/w40/kr.png",
        club: "JEONBUK",
        image: "player/김영빈.png",
        rarity: "normal",
        description: "강력한 대인 방어 능력과 뛰어난 제공권 경합 능력을 자랑하는 중앙 수비수입니다. 안정적인 수비 위치 선정과 탁월한 투지로 전북 현대 최후방 수비진의 중심을 굳건하게 책임집니다.",
        theme: {
            primary: "#005a3c",
            secondary: "#ffffff",
            glow: "#e2e8f0"
        },
        stats: {
            pac: 68,
            sho: 40,
            pas: 62,
            dri: 60,
            def: 79,
            phy: 78
        }
    },
    "kang_sang_yoon": {
        id: "kang_sang_yoon",
        name: "강상윤",
        rating: 81,
        position: "CM",
        nation: "South Korea",
        nationFlag: "https://flagcdn.com/w40/kr.png",
        club: "JEONBUK",
        image: "player/강상윤.png",
        rarity: "special",
        description: "넘치는 에너지와 적극적인 활동량을 바탕으로 넓은 중원을 누비는 유망주 미드필더입니다. 뛰어난 기동력과 지치지 않는 체력으로 공수 양면에서 헌신적인 엔진 역할을 수행합니다.",
        theme: {
            primary: "#005a3c",
            secondary: "#ffffff",
            glow: "#00d2ff"
        },
        stats: {
            pac: 80,
            sho: 73,
            pas: 83,
            dri: 85,
            def: 75,
            phy: 73
        }
    },
    "kim_tae_hyeon": {
        id: "kim_tae_hyeon",
        name: "김태현",
        rating: 76,
        position: "RB",
        nation: "South Korea",
        nationFlag: "https://flagcdn.com/w40/kr.png",
        club: "JEONBUK",
        image: "player/김태현.png",
        rarity: "normal",
        description: "공수 밸런스가 뛰어나고 탄탄한 수비력을 가진 안정감 넘치는 우측 풀백입니다. 다부진 체격 조건을 앞세운 적극적인 수비 가담과 오버래핑 기동성으로 측면에 단단함을 보탭니다.",
        theme: {
            primary: "#005a3c",
            secondary: "#ffffff",
            glow: "#00d2ff"
        },
        stats: {
            pac: 77,
            sho: 58,
            pas: 70,
            dri: 71,
            def: 74,
            phy: 75
        }
    },
    "maeng_seong_ung": {
        id: "maeng_seong_ung",
        name: "맹성웅",
        rating: 76,
        position: "CM",
        nation: "South Korea",
        nationFlag: "https://flagcdn.com/w40/kr.png",
        club: "JEONBUK",
        image: "player/맹성웅.png",
        rarity: "normal",
        description: "침착한 포지셔닝과 깔끔한 대인 태클로 상대 공격을 차단하는 든든한 홀딩 미드필더입니다. 수비 지능이 매우 우수하여 팀 포백 라인을 앞선에서 보호하는 든든한 1차 저지선입니다.",
        theme: {
            primary: "#005a3c",
            secondary: "#ffffff",
            glow: "#00d2ff"
        },
        stats: {
            pac: 70,
            sho: 60,
            pas: 75,
            dri: 72,
            def: 80,
            phy: 73
        }
    },
    "cho_wi_je": {
        id: "cho_wi_je",
        name: "조위제",
        rating: 83,
        position: "CB",
        nation: "South Korea",
        nationFlag: "https://flagcdn.com/w40/kr.png",
        club: "JEONBUK",
        image: "player/조위제.png",
        rarity: "special",
        description: "압도적인 하드웨어와 빠른 복귀 속도를 지닌 차세대 유망주 대형 센터백입니다. 적극적이고 타이트한 대인 마크와 과감한 공중 경합으로 수비 라인에 피지컬을 더해 줍니다.",
        theme: {
            primary: "#005a3c",
            secondary: "#ffffff",
            glow: "#00ff87"
        },
        stats: {
            pac: 83,
            sho: 50,
            pas: 79,
            dri: 75,
            def: 83,
            phy: 79
        }
    },
    "choi_woo_jin": {
        id: "choi_woo_jin",
        name: "최우진",
        rating: 74,
        position: "LB",
        nation: "South Korea",
        nationFlag: "https://flagcdn.com/w40/kr.png",
        club: "JEONBUK",
        image: "player/최우진.png",
        rarity: "normal",
        description: "뛰어난 순간 돌파력과 날카로운 크로스 능력을 지닌 다이내믹한 좌측 풀백입니다. 공간을 파고드는 폭발적인 오버래핑 훈련이 매우 뛰어나며 공수 모두 기여도가 높은 유망주입니다.",
        theme: {
            primary: "#005a3c",
            secondary: "#ffffff",
            glow: "#00ff87"
        },
        stats: {
            pac: 80,
            sho: 62,
            pas: 71,
            dri: 73,
            def: 70,
            phy: 66
        }
    },
    "lee_ju_hyeon": {
        id: "lee_ju_hyeon",
        name: "이주현",
        rating: 77,
        position: "GK",
        nation: "South Korea",
        nationFlag: "https://flagcdn.com/w40/kr.png",
        club: "JEONBUK",
        image: "player/이주현.png",
        rarity: "normal",
        description: "안정적인 방어 위치 선정과 놀라운 반사 신경을 보유한 유망주 수문장입니다. 공중볼 낙하지점 판단이 예리하며 골문 구석으로 날아오는 까다로운 슈팅도 과감히 잘 캐칭합니다.",
        theme: {
            primary: "#005a3c",
            secondary: "#ffffff",
            glow: "#94a3b8"
        },
        stats: {
            pac: 70,
            sho: 68,
            pas: 65,
            dri: 77,
            def: 77,
            phy: 68
        }
    },
    "jeon_jin_woo": {
        id: "jeon_jin_woo",
        name: "전진우",
        rating: 80,
        position: "LW",
        nation: "South Korea",
        nationFlag: "https://flagcdn.com/w40/kr.png",
        club: "JEONBUK",
        image: "player/전진우.webp",
        rarity: "normal",
        description: "폭발적인 가속도와 유려한 개인 드리블 기술을 장착한 전북 현대의 다재다능한 공격수입니다. 상대 측면을 허물고 안쪽으로 꺾어 들어오는 과감한 침투와 위협적인 연계 플레이에 강점이 있습니다.",
        theme: {
            primary: "#005a3c",
            secondary: "#ffffff",
            glow: "#00d2ff"
        },
        stats: {
            pac: 86,
            sho: 80,
            pas: 72,
            dri: 81,
            def: 38,
            phy: 62
        }
    },
    "park_ji_soo": {
        id: "park_ji_soo",
        name: "박지수",
        rating: 81,
        position: "CB",
        nation: "South Korea",
        nationFlag: "https://flagcdn.com/w40/kr.png",
        club: "JEONBUK",
        image: "player/박지수.webp",
        rarity: "normal",
        description: "대한민국 축구 국가대표팀 출신의 피지컬이 압도적인 철벽 센터백입니다. 빠른 발을 활용한 커버 플레이와 탁월한 대인 방어 능력, 그리고 제공권 장악으로 팀의 최후방을 든든하게 지켜줍니다.",
        theme: {
            primary: "#005a3c",
            secondary: "#ffffff",
            glow: "#00ff87"
        },
        stats: {
            pac: 75,
            sho: 48,
            pas: 68,
            dri: 67,
            def: 82,
            phy: 83
        }
    },
    "jo_hyeon_woo": {
        id: "jo_hyeon_woo",
        name: "조현우",
        rating: 85,
        position: "GK",
        nation: "South Korea",
        nationFlag: "https://flagcdn.com/w40/kr.png",
        club: "ULSAN HD",
        image: "player/조현우.webp",
        rarity: "legend",
        description: "대한민국의 독보적인 넘버원 거미손 골키퍼입니다. 2018 러시아 월드컵 독일전의 신화를 쓴 주역으로, 믿기지 않는 동물적인 반사신경과 눈부신 공중볼 커버, 그리고 1대1 상황에서의 탁월한 선방 능력으로 골문을 완벽히 통제합니다.",
        theme: {
            primary: "#002d62",
            secondary: "#fec913",
            glow: "#ffd700"
        },
        stats: {
            pac: 85,
            sho: 83,
            pas: 75,
            dri: 85,
            def: 85,
            phy: 82
        }
    },
    "park_ji_sung": {
        id: "park_ji_sung",
        name: "박지성",
        rating: 88,
        position: "CM",
        nation: "South Korea",
        nationFlag: "https://flagcdn.com/w40/kr.png",
        club: "MANCHESTER UTD",
        image: "player/박지성.png",
        rarity: "legend",
        description: "대한민국 축구 역사상 가장 위대한 전설적인 멀티 미드필더이자 맨체스터 유나이티드에서 활약했던 영원한 캡틴입니다.",
        theme: {
            primary: "#da291c",
            secondary: "#fbe122",
            glow: "#ffd700"
        },
        stats: {
            pac: 87,
            sho: 80,
            pas: 85,
            dri: 85,
            def: 82,
            phy: 88
        }
    },
    "lee_dong_gook": {
        id: "lee_dong_gook",
        name: "이동국",
        rating: 82,
        position: "ST",
        nation: "South Korea",
        nationFlag: "https://flagcdn.com/w40/kr.png",
        club: "JEONBUK",
        image: "player/이동국.png",
        rarity: "normal",
        description: "전북 현대의 불멸의 영웅이자 K리그 역대 최고의 스트라이커,",
        theme: {
            primary: "#005a3c",
            secondary: "#ffd700",
            glow: "#ffd700"
        },
        stats: {
            pac: 78,
            sho: 84,
            pas: 72,
            dri: 76,
            def: 38,
            phy: 81
        }
    },
    "choi_chol_soon": {
        id: "choi_chol_soon",
        name: "최철순",
        rating: 80,
        position: "CB",
        nation: "South Korea",
        nationFlag: "https://flagcdn.com/w40/kr.png",
        club: "JEONBUK",
        image: "player/최철순.png",
        rarity: "normal",
        description: "전북 현대 왕조의 굳건한 기둥이자 팬들의 무한한 사랑을 받는",
        theme: {
            primary: "#005a3c",
            secondary: "#ffd700",
            glow: "#ffd700"
        },
        stats: {
            pac: 78,
            sho: 55,
            pas: 68,
            dri: 70,
            def: 82,
            phy: 82
        }
    },
    "park_jin_seob": {
        id: "park_jin_seob",
        name: "박진섭",
        rating: 81,
        position: "CB",
        nation: "South Korea",
        nationFlag: "https://flagcdn.com/w40/kr.png",
        club: "JEONBUK",
        image: "player/박진섭.webp",
        rarity: "normal",
        description: "전북 현대의 핵심 수비형 미드필더이자 멀티 수비수 박진섭입니다. 지능적인 수비 위치 선정과 뛰어난 공중볼 장악력으로 빌드업의 핵심 역할을 수행하며 팀의 든든한 버팀목이 되어 줍니다.",
        theme: {
            primary: "#005a3c",
            secondary: "#ffffff",
            glow: "#00ff87"
        },
        stats: {
            pac: 76,
            sho: 65,
            pas: 74,
            dri: 73,
            def: 81,
            phy: 82
        }
    },
    "hong_jeong_ho": {
        id: "hong_jeong_ho",
        name: "홍정호",
        rating: 82,
        position: "CB",
        nation: "South Korea",
        nationFlag: "https://flagcdn.com/w40/kr.png",
        club: "JEONBUK",
        image: "player/홍정호.webp",
        rarity: "normal",
        description: "전북 현대의 든든한 베테랑 중앙 수비수이자 전설적인 리더 홍정호입니다. 탁월한 수비 리딩 능력과 강력한 대인 마크, 침착한 빌드업으로 최후방의 철벽 방어막을 지휘합니다.",
        theme: {
            primary: "#005a3c",
            secondary: "#ffd700",
            glow: "#00ff87"
        },
        stats: {
            pac: 74,
            sho: 58,
            pas: 76,
            dri: 72,
            def: 83,
            phy: 81
        }
    },
    "ki_sung_yueng": {
        id: "ki_sung_yueng",
        name: "기성용",
        rating: 87,
        position: "CM",
        nation: "South Korea",
        nationFlag: "https://flagcdn.com/w40/kr.png",
        club: "KOREA",
        image: "player/기성용.png",
        rarity: "legend",
        description: "대한민국 축구 역사상 최고의 딥라잉 플레이메이커이자 대표팀의 중원을 지휘했던 영원한 코어 미드필더 기성용입니다. 넓은 시야와 컴퓨터 같은 대지를 가르는 롱패스, 자로 잰 듯한 프리킥 킥력과 탁월한 키핑 능력으로 경기 조율의 마법을 부리는 전설적인 미드필더입니다.",
        theme: {
            primary: "#e60012",
            secondary: "#000000",
            glow: "#ffd700"
        },
        stats: {
            pac: 74,
            sho: 81,
            pas: 92,
            dri: 84,
            def: 76,
            phy: 82
        }
    },
    "kim_min_jae": {
        id: "kim_min_jae",
        name: "김민재",
        rating: 87,
        position: "CB",
        nation: "South Korea",
        nationFlag: "https://flagcdn.com/w40/kr.png",
        club: "BAYERN MUNICH",
        image: "player/김민재.webp",
        rarity: "legend",
        description: "압도적인 피지컬과 빠른 주력, 탁월한 대인 마크 능력으로 유럽 무대를 정복한 대한민국의 월드클래스 센터백 '괴물' 김민재입니다. 이탈리아 세리에 A 최우수 수비수 수상에 이어 독일 명문 바이에른 뮌헨에서 최강의 철벽 수비를 지휘하는 불멸의 전설입니다.",
        theme: {
            primary: "#dc052d",
            secondary: "#ffffff",
            glow: "#ffd700"
        },
        stats: {
            pac: 85,
            sho: 57,
            pas: 80,
            dri: 72,
            def: 88,
            phy: 87
        }
    },
    "lee_jae_sung": {
        id: "lee_jae_sung",
        name: "이재성",
        rating: 85,
        position: "CM",
        nation: "South Korea",
        nationFlag: "https://flagcdn.com/w40/kr.png",
        club: "KOREA",
        image: "player/이재성.png",
        rarity: "special",
        description: "독보적인 활동량과 영리한 축구 지능을 겸비한 국가대표 미드필더입니다. 영리한 오프더볼 움직임과 날카로운 패싱력, 전방 압박 능력을 바탕으로 공수 양면에서 중원의 핵심 활력소 역할을 수행합니다.",
        theme: {
            primary: "#da1a32",
            secondary: "#ffffff",
            glow: "#ff2a55"
        },
        stats: {
            pac: 82,
            sho: 78,
            pas: 86,
            dri: 84,
            def: 72,
            phy: 76
        }
    },
    "cho_gue_sung": {
        id: "cho_gue_sung",
        name: "조규성",
        rating: 87,
        position: "ST",
        nation: "South Korea",
        nationFlag: "https://flagcdn.com/w40/kr.png",
        club: "KOREA",
        image: "player/조규성.png",
        rarity: "special",
        description: "조각 같은 비주얼과 압도적인 피지컬로 그라운드를 누비는 대한민국 국가대표 스트라이커 조규성입니다. 공중볼 타점 경합과 강력한 슈팅력, 헌신적인 전방 압박으로 매 경기 상대 골문을 직접 위협하는 해결사입니다.",
        theme: {
            primary: "#000000",
            secondary: "#da1a32",
            glow: "#ff2a55"
        },
        stats: {
            pac: 83,
            sho: 89,
            pas: 75,
            dri: 79,
            def: 45,
            phy: 89
        }
    },
    "jens_castrop": {
        id: "jens_castrop",
        name: "옌스",
        rating: 85,
        position: "CM",
        nation: "South Korea",
        nationFlag: "https://flagcdn.com/w40/kr.png",
        club: "KOREA",
        image: "player/옌스.webp",
        rarity: "special",
        description: "독일 무대에서 다져진 피지컬과 왕성한 활동량으로 대한민국 국가대표팀의 측면과 중원에 에너지를 불어넣는 신성 옌스 카스트로프입니다. 높은 전술적 이해도와 공수 양면에서의 헌신적인 플레이가 돋보입니다.",
        theme: {
            primary: "#da1a32",
            secondary: "#1d2b58",
            glow: "#ff2a55"
        },
        stats: {
            pac: 84,
            sho: 75,
            pas: 81,
            dri: 82,
            def: 79,
            phy: 83
        }
    },
    "lee_dong_gyeong": {
        id: "lee_dong_gyeong",
        name: "이동경",
        rating: 86,
        position: "CM",
        nation: "South Korea",
        nationFlag: "https://flagcdn.com/w40/kr.png",
        club: "KOREA",
        image: "player/이동경.png",
        rarity: "special",
        description: "왼발의 마술사라 불리며 창의적인 패스와 전매특허인 강력하고 정교한 중거리 슈팅을 장착한 특급 공격형 미드필더 이동경입니다. 순간적인 배후 침투와 위협적인 플레이메이킹으로 경기의 흐름을 단숨에 바꾸어 놓습니다.",
        theme: {
            primary: "#da1a32",
            secondary: "#ffffff",
            glow: "#ff2a55"
        },
        stats: {
            pac: 83,
            sho: 86,
            pas: 87,
            dri: 85,
            def: 70,
            phy: 73
        }
    },
    "jeon_byung_kwan": {
        id: "jeon_byung_kwan",
        name: "전병관",
        rating: 83,
        position: "LW",
        nation: "South Korea",
        nationFlag: "https://flagcdn.com/w40/kr.png",
        club: "JEONBUK",
        image: "player/전병관.webp",
        rarity: "normal",
        description: "빠른 순간 가속도와 날카로운 드리블로 측면 돌파를 즐기는 전북 현대의 영건 전병관입니다. 왕성한 활동량과 과감한 슈팅으로 매번 상대 골문을 위협하는 에너지 넘치는 공격수입니다.",
        theme: {
            primary: "#005a3c",
            secondary: "#ffffff",
            glow: "#00d2ff"
        },
        stats: {
            pac: 86,
            sho: 80,
            pas: 76,
            dri: 83,
            def: 43,
            phy: 70
        }
    },
    "hwang_in_beom": {
        id: "hwang_in_beom",
        name: "황인범",
        rating: 86,
        position: "CM",
        nation: "South Korea",
        nationFlag: "https://flagcdn.com/w40/kr.png",
        club: "KOREA",
        image: "player/황인범.webp",
        rarity: "special",
        description: "대한민국 축구 국가대표팀의 든든한 사령탑이자 중원의 마에스트로 황인범입니다. 지치지 않는 왕성한 활동량과 컴퓨터 같은 전진 패스, 그리고 넓은 시야와 지능적인 빌드업으로 대표팀 공수의 핵심 조율사 역할을 수행합니다.",
        theme: {
            primary: "#da1a32",
            secondary: "#1d2b58",
            glow: "#ff2a55"
        },
        stats: {
            pac: 80,
            sho: 78,
            pas: 90,
            dri: 89,
            def: 75,
            phy: 79
        }
    },
    "oh_hyeon_gyu": {
        id: "oh_hyeon_gyu",
        name: "오현규",
        rating: 83,
        position: "ST",
        nation: "South Korea",
        nationFlag: "https://flagcdn.com/w40/kr.png",
        club: "KOREA",
        image: "player/오현규.png",
        rarity: "special",
        description: "강인한 피지컬과 폭발적인 슈팅력, 그리고 끈질긴 전방 압박 능력을 겸비한 대한민국 국가대표 공격수 오현규입니다. 문전에서의 침착함과 적극적인 돌파로 언제든 득점을 터뜨릴 수 있는 해결사입니다.",
        theme: {
            primary: "#da1a32",
            secondary: "#1d2b58",
            glow: "#ff2a55"
        },
        stats: {
            pac: 84,
            sho: 85,
            pas: 70,
            dri: 77,
            def: 37,
            phy: 85
        }
    },
    "lee_gi_hyeok": {
        id: "lee_gi_hyeok",
        name: "이기혁",
        rating: 83,
        position: "CB",
        nation: "South Korea",
        nationFlag: "https://flagcdn.com/w40/kr.png",
        club: "GANGWON",
        image: "player/이기혁.png",
        rarity: "special",
        description: "중앙 수비수와 측면 수비수, 미드필더까지 소화할 수 있는 다재다능한 멀티 플레이어 이기혁입니다. 안정적인 수비 능력과 뛰어난 패스 능력을 바탕으로 후방 빌드업에서 핵심적인 역할을 수행합니다.",
        theme: {
            primary: "#e65c00",
            secondary: "#ffffff",
            glow: "#ff9933"
        },
        stats: {
            pac: 78,
            sho: 65,
            pas: 85,
            dri: 78,
            def: 82,
            phy: 80
        }
    },
    "lee_su_bin": {
        id: "lee_su_bin",
        name: "이수빈",
        rating: 82,
        position: "CM",
        nation: "South Korea",
        nationFlag: "https://flagcdn.com/w40/kr.png",
        club: "JEONBUK",
        image: "player/이수빈.png",
        rarity: "normal",
        description: "부드러운 볼 제어 능력과 넓은 시야, 그리고 안정적인 패스 공급으로 팀의 빌드업을 조율하는 전북 현대의 미드필더 이수빈입니다. 적극적인 공수 조율과 조용한 헌신으로 중원에 안정감을 불어넣습니다.",
        theme: {
            primary: "#005a3c",
            secondary: "#ffffff",
            glow: "#00ff87"
        },
        stats: {
            pac: 80,
            sho: 70,
            pas: 83,
            dri: 80,
            def: 80,
            phy: 78
        }
    },
    "hwang_hee_chan": {
        id: "hwang_hee_chan",
        name: "황희찬",
        rating: 84,
        position: "LW",
        nation: "South Korea",
        nationFlag: "https://flagcdn.com/w40/kr.png",
        club: "KOREA",
        image: "player/황희찬.png",
        rarity: "special",
        description: "우직한 돌파와 강인한 피지컬로 상대를 압도하며 '코리안 가이'라는 별명으로 프리미어리그를 폭격하는 국가대표 윙어 황희찬입니다. 폭발적인 가속도와 저돌적인 문전 침투로 득점을 노립니다.",
        theme: {
            primary: "#da1a32",
            secondary: "#1d2b58",
            glow: "#ff2a55"
        },
        stats: {
            pac: 88,
            sho: 85,
            pas: 72,
            dri: 82,
            def: 38,
            phy: 79
        }
    },
    "song_min_kyu": {
        id: "song_min_kyu",
        name: "송민규",
        rating: 83,
        position: "LW",
        nation: "South Korea",
        nationFlag: "https://flagcdn.com/w40/kr.png",
        club: "JEONBUK",
        image: "player/송민규.png",
        rarity: "normal",
        description: "뛰어난 볼 키핑 능력과 측면에서의 저돌적인 온더볼 플레이로 찬스를 창출하는 전북 현대의 핵심 공격수입니다. 탄탄한 피지컬을 바탕으로 등지는 플레이와 지능적인 연계에 강점이 있습니다.",
        theme: {
            primary: "#005a3c",
            secondary: "#ffffff",
            glow: "#00ff87"
        },
        stats: {
            pac: 81,
            sho: 82,
            pas: 78,
            dri: 85,
            def: 45,
            phy: 77
        }
    },
    "lingard": {
        id: "lingard",
        name: "린가드",
        rating: 86,
        position: "LW",
        nation: "England",
        nationFlag: "https://flagcdn.com/w40/gb-eng.png",
        club: "FC SEOUL",
        image: "player/린가드.png",
        rarity: "special",
        description: "잉글랜드 국가대표와 맨체스터 유나이티드 출신의 월드스타로, FC 서울의 측면 공격 핵심 윙어입니다. 뛰어난 오프더볼 움직임과 창의적인 연계 플레이, 그리고 저돌적인 측면 돌파로 공격진에 활력을 불어넣습니다.",
        theme: {
            primary: "#e50012",
            secondary: "#000000",
            glow: "#ffd700"
        },
        stats: {
            pac: 83,
            sho: 82,
            pas: 84,
            dri: 86,
            def: 55,
            phy: 70
        }
    },
    "cesinha": {
        id: "cesinha",
        name: "세징야",
        rating: 85,
        position: "CAM",
        nation: "Brazil",
        nationFlag: "https://flagcdn.com/w40/br.png",
        club: "DAEGU FC",
        image: "player/세징야.webp",
        rarity: "special",
        description: "대구 FC의 살아있는 전설이자 K리그 최고의 공격형 미드필더 세징야입니다. 압도적인 테크닉과 강력한 중거리 슛, 그리고 예리한 플레이메이킹 능력을 겸비했습니다.",
        theme: {
            primary: "#00d2fc",
            secondary: "#1e3a8a",
            glow: "#00d2fc"
        },
        stats: {
            pac: 83,
            sho: 86,
            pas: 85,
            dri: 86,
            def: 42,
            phy: 75
        }
    },
    "mugosa": {
        id: "mugosa",
        name: "무고사",
        rating: 83,
        position: "ST",
        nation: "Montenegro",
        nationFlag: "https://flagcdn.com/w40/me.png",
        club: "INCHEON UTD",
        image: "player/무고사.png",
        rarity: "normal",
        description: "인천 유나이티드의 상징이자 K리그 최고의 스트라이커 무고사입니다. 탁월한 골 결정력과 높은 문전 집중력으로 어떠한 위치에서도 득점을 만들어내는 해결사입니다.",
        theme: {
            primary: "#0020c2",
            secondary: "#000000",
            glow: "#0055ff"
        },
        stats: {
            pac: 78,
            sho: 87,
            pas: 71,
            dri: 79,
            def: 36,
            phy: 81
        }
    },
    "lee_dong_gook_99": {
        id: "lee_dong_gook_99",
        name: "이동국99",
        rating: 86,
        position: "ST",
        nation: "South Korea",
        nationFlag: "https://flagcdn.com/w40/kr.png",
        club: "POHANG",
        image: "player/이동국99.png",
        rarity: "special",
        description: "1999년 K리그를 뒤흔든 '라이온 킹' 이동국의 파릇파릇한 젊은 시절 카드입니다. 리그 신인왕과 득점왕을 노리던 폭발적인 피지컬과 예리한 돌파력, 그리고 전매특허인 강력한 발리슛을 구사한 특급 공격수입니다.",
        theme: {
            primary: "#e60012",
            secondary: "#000000",
            glow: "#ff2a55"
        },
        stats: {
            pac: 87,
            sho: 88,
            pas: 81,
            dri: 72,
            def: 35,
            phy: 83
        }
    },
    "kim_seung_gyu": {
        id: "kim_seung_gyu",
        name: "김승규",
        rating: 87,
        position: "GK",
        nation: "South Korea",
        nationFlag: "https://flagcdn.com/w40/kr.png",
        club: "KOREA",
        image: "player/김승규.png",
        rarity: "special",
        description: "대한민국 축구 국가대표팀의 베테랑 수문장이자 빌드업 축구의 핵심 골키퍼 김승규입니다. 뛰어난 반사신경과 안정적인 선방력은 물론, 정확한 패싱 능력을 바탕으로 후방 빌드업 전술을 주도하는 든든한 골키퍼입니다.",
        theme: {
            primary: "#da1a32",
            secondary: "#1d2b58",
            glow: "#ff2a55"
        },
        stats: {
            pac: 83,
            sho: 84,
            pas: 80,
            dri: 84,
            def: 89,
            phy: 85
        }
    },
    "lee_han_beom": {
        id: "lee_han_beom",
        name: "이한범",
        rating: 83,
        position: "CB",
        nation: "South Korea",
        nationFlag: "https://flagcdn.com/w40/kr.png",
        club: "KOREA",
        image: "player/이한범.png",
        rarity: "special",
        description: "대한민국 수비의 미래를 짊어진 대형 센터백 이한범입니다. 압도적인 피지컬을 활용한 공중볼 장악과 타이트한 대인 마크가 돋보이며, 안정적인 패스 능력과 경기 리딩 능력까지 갖춘 육각형 수비수입니다.",
        theme: {
            primary: "#da1a32",
            secondary: "#1d2b58",
            glow: "#ff2a55"
        },
        stats: {
            pac: 79,
            sho: 50,
            pas: 75,
            dri: 72,
            def: 83,
            phy: 82
        }
    },
    "seol_young_woo": {
        id: "seol_young_woo",
        name: "설영우",
        rating: 83,
        position: "RB",
        nation: "South Korea",
        nationFlag: "https://flagcdn.com/w40/kr.png",
        club: "KOREA",
        image: "player/설영우.png",
        rarity: "special",
        description: "대한민국 축구 국가대표팀의 핵심 풀백 설영우입니다. 지치지 않는 기동력과 안정적인 수비력은 물론, 날카로운 오버래핑과 정교한 크로스로 측면 공격에 큰 힘을 보태는 현대적인 측면 수비수입니다.",
        theme: {
            primary: "#da1a32",
            secondary: "#1d2b58",
            glow: "#ff2a55"
        },
        stats: {
            pac: 84,
            sho: 63,
            pas: 78,
            dri: 80,
            def: 82,
            phy: 80
        }
    },
    "paik_seung_ho": {
        id: "paik_seung_ho",
        name: "백승호",
        rating: 84,
        position: "CM",
        nation: "South Korea",
        nationFlag: "https://flagcdn.com/w40/kr.png",
        club: "KOREA",
        image: "player/백승호.png",
        rarity: "special",
        description: "바르셀로나 유스 출신의 뛰어난 테크닉과 자로 잰 듯한 킥력을 장착한 미드필더 백승호입니다. 넓은 시야와 침착한 경기 조율력, 그리고 상대 골문을 직접 노리는 날카로운 중거리 슈팅 능력을 지니고 있습니다.",
        theme: {
            primary: "#da1a32",
            secondary: "#1d2b58",
            glow: "#ff2a55"
        },
        stats: {
            pac: 80,
            sho: 79,
            pas: 84,
            dri: 84,
            def: 75,
            phy: 78
        }
    },
    "lee_tae_seok": {
        id: "lee_tae_seok",
        name: "이태석",
        rating: 84,
        position: "LB",
        nation: "South Korea",
        nationFlag: "https://flagcdn.com/w40/kr.png",
        club: "KOREA",
        image: "player/이태석.png",
        rarity: "special",
        description: "대한민국 국가대표팀(KOREA)의 좌측 측면을 든든하게 책임지는 지칠 줄 모르는 기동력의 윙백입니다. 빠른 오버랩핑과 날카로운 크로스, 영리한 수비 포지셔닝으로 공수 양면에서 맹활약하는 스페셜 풀백입니다.",
        theme: {
            primary: "#005a3c",
            secondary: "#ffd700",
            glow: "#00ff87"
        },
        stats: {
            pac: 85,
            sho: 68,
            pas: 78,
            dri: 81,
            def: 80,
            phy: 78
        }
    },
    "ahn_jung_hwan": {
        id: "ahn_jung_hwan",
        name: "안정환",
        rating: 89,
        position: "LW",
        nation: "South Korea",
        nationFlag: "https://flagcdn.com/w40/kr.png",
        club: "KOREA",
        image: "player/안정환.png",
        rarity: "legend",
        description: "대한민국 축구 역사상 최고의 판타지스타이자 테크니션입니다. 2002년 한일 월드컵의 영웅으로 이탈리아전 결승 골을 비롯한 결정적인 경기마다 해결사 역할을 톡톡히 해냈으며, 감각적인 드리블과 우아한 볼 터치, 그리고 폭발적인 슈팅력으로 전 세계를 놀라게 한 레전드 윙어입니다.",
        theme: {
            primary: "#000000",
            secondary: "#c39e5c",
            glow: "#ffd700"
        },
        stats: {
            pac: 86,
            sho: 91,
            pas: 84,
            dri: 90,
            def: 35,
            phy: 75
        }
    },
    "lionel_messi": {
        id: "lionel_messi",
        name: "리오넬 메시",
        rating: 93,
        position: "RW",
        nation: "Argentina",
        nationFlag: "https://flagcdn.com/w40/ar.png",
        club: "INTER MIAMI",
        image: "player/메시.png",
        rarity: "worldclass",
        description: "축구 역사상 가장 위대한 선수(G.O.A.T)로 꼽히는 리오넬 메시입니다. 신의 경지에 다다른 플레이메이킹, 경이로운 볼 컨트롤, 그리고 상대 수비를 완전히 무력화시키는 압도적인 시야와 득점력을 지닌 축구계의 살아있는 신화이자 월드클래스 거장입니다.",
        theme: {
            primary: "#000a20",
            secondary: "#4facfe",
            glow: "#00f2fe"
        },
        stats: {
            pac: 86,
            sho: 91,
            pas: 92,
            dri: 94,
            def: 40,
            phy: 70
        }
    },
    "kim_moon_hwan": {
        id: "kim_moon_hwan",
        name: "김문환",
        rating: 83,
        position: "RB",
        nation: "South Korea",
        nationFlag: "https://flagcdn.com/w40/kr.png",
        club: "KOREA",
        image: "player2/김문환.webp",
        rarity: "special",
        description: "대한민국 축구 국가대표팀의 지치지 않는 우측 풀백 김문환입니다. 왕성한 활동량을 바탕으로 한 헌신적인 수비와 폭발적인 오버래핑, 그리고 전방으로 공급하는 위협적인 얼리 크로스에 강점이 있는 스페셜 측면 수비수입니다.",
        theme: {
            primary: "#da1a32",
            secondary: "#1d2b58",
            glow: "#ff2a55"
        },
        stats: {
            pac: 85,
            sho: 62,
            pas: 77,
            dri: 79,
            def: 81,
            phy: 78
        }
    },
    "yang_min_hyuk": {
        id: "yang_min_hyuk",
        name: "양민혁",
        rating: 84,
        position: "RW",
        nation: "South Korea",
        nationFlag: "https://flagcdn.com/w40/kr.png",
        club: "KOREA",
        image: "player2/양민혁.png",
        rarity: "special",
        description: "대한민국 축구의 초신성이자 폭발적인 스피드와 저돌적인 드리블을 갖춘 공격수 양민혁입니다. 나이답지 않은 침착한 결정력과 예측 불가능한 돌파력으로 상대 측면 수비를 허무는 특급 윙어입니다.",
        theme: {
            primary: "#da1a32",
            secondary: "#1d2b58",
            glow: "#ff2a55"
        },
        stats: {
            pac: 88,
            sho: 80,
            pas: 78,
            dri: 84,
            def: 38,
            phy: 68
        }
    },
    "lee_myung_jae": {
        id: "lee_myung_jae",
        name: "이명재",
        rating: 83,
        position: "LB",
        nation: "South Korea",
        nationFlag: "https://flagcdn.com/w40/kr.png",
        club: "KOREA",
        image: "player2/이명재.webp",
        rarity: "special",
        description: "대한민국 축구 국가대표팀과 울산 HD의 날카로운 킥력을 장착한 좌측 풀백 이명재입니다. 안정적인 수비 위치 선정과 상대 측면을 허무는 정교한 궤적의 크로스로 공수 양면에서 맹활약하는 스페셜 풀백입니다.",
        theme: {
            primary: "#da1a32",
            secondary: "#1d2b58",
            glow: "#ff2a55"
        },
        stats: {
            pac: 82,
            sho: 64,
            pas: 81,
            dri: 77,
            def: 82,
            phy: 79
        }
    },
    "cristiano_ronaldo": {
        id: "cristiano_ronaldo",
        name: "크리스티아누 호날두",
        rating: 90,
        position: "LW",
        nation: "Portugal",
        nationFlag: "https://flagcdn.com/w40/pt.png",
        club: "AL NASSR",
        image: "player2/호날두.png",
        rarity: "legend",
        description: "축구 역사상 가장 위대한 득점 기계이자 철저한 자기관리의 상징인 크리스티아누 호날두입니다. 압도적인 피지컬, 폭발적인 점프력을 활용한 높은 타점의 헤더, 그리고 양발과 머리를 가리지 않는 무결점 골 결정력으로 축구 역사에 수많은 대기록을 수립한 전설적인 윙어입니다.",
        theme: {
            primary: "#000000",
            secondary: "#c39e5c",
            glow: "#ffd700"
        },
        stats: {
            pac: 90,
            sho: 89,
            pas: 82,
            dri: 88,
            def: 35,
            phy: 78
        }
    },
    "byeon_jun_su": {
        id: "byeon_jun_su",
        name: "변준수",
        rating: 84,
        position: "CB",
        nation: "South Korea",
        nationFlag: "https://flagcdn.com/w40/kr.png",
        club: "KOREA",
        image: "player2/변준수.png",
        rarity: "special",
        description: "대한민국 축구 국가대표팀의 미래를 짊어질 차세대 대형 센터백 변준수입니다. 압도적인 피지컬을 활용한 제공권 장악력, 안정적인 대인 방어 능력, 그리고 빌드업의 시발점이 되는 정교한 패스 능력을 갖춘 스페셜 중앙 수비수입니다.",
        theme: {
            primary: "#da1a32",
            secondary: "#1d2b58",
            glow: "#ff2a55"
        },
        stats: {
            pac: 78,
            sho: 45,
            pas: 72,
            dri: 70,
            def: 85,
            phy: 84
        }
    },
    "kaoru_mitoma": {
        id: "kaoru_mitoma",
        name: "미토마",
        rating: 85,
        position: "LW",
        nation: "Japan",
        nationFlag: "https://flagcdn.com/w40/jp.png",
        club: "BRIGHTON",
        image: "player2/미토마.png",
        rarity: "special",
        description: "독보적인 아웃프런트 킥과 정밀한 드리블 돌파로 잉글랜드 프리미어리그를 매료시킨 일본의 윙어 미토마입니다. 상대를 얼어붙게 만드는 타이밍을 뺏는 특유의 잔발 드리블과 날카로운 크로스로 브라이튼의 측면 공격을 지휘하는 스페셜 윙어입니다.",
        theme: {
            primary: "#0057b8",
            secondary: "#ffffff",
            glow: "#00d2ff"
        },
        stats: {
            pac: 88,
            sho: 78,
            pas: 80,
            dri: 90,
            def: 42,
            phy: 68
        }
    },
    "wataru_endo": {
        id: "wataru_endo",
        name: "엔도 와타루",
        rating: 85,
        position: "CB",
        nation: "Japan",
        nationFlag: "https://flagcdn.com/w40/jp.png",
        club: "LIVERPOOL",
        image: "player2/엔도와타루.png",
        rarity: "special",
        description: "명가 리버풀 FC의 든든한 중원 방패이자 뛰어난 수비 지능을 보유한 일본의 미드필더 엔도 와타루입니다. 왕성한 활동량, 안정적인 세컨볼 획득 능력, 그리고 포백 보호 능력을 바탕으로 공수 밸런스를 조율하는 스페셜 미드필더입니다.",
        theme: {
            primary: "#c8102e",
            secondary: "#ffffff",
            glow: "#ff3e6c"
        },
        stats: {
            pac: 73,
            sho: 68,
            pas: 80,
            dri: 76,
            def: 86,
            phy: 84
        }
    },
    "erling_haaland": {
        id: "erling_haaland",
        name: "홀란드",
        rating: 91,
        position: "ST",
        nation: "Norway",
        nationFlag: "https://flagcdn.com/w40/no.png",
        club: "MANCHESTER CITY",
        image: "player2/홀란드.webp",
        rarity: "worldclass",
        description: "압도적인 폭발력과 가공할 만한 피지컬로 골문을 폭격하는 세계 최고의 스트라이커 홀란드입니다. 가공할 만한 스피드와 가공할 만한 슈팅 능력, 그리고 상대 수비진을 힘으로 짓누르는 압도적인 제공권으로 무수한 득점 기록을 갈아치우는 월드클래스 해결사입니다.",
        theme: {
            primary: "#112233",
            secondary: "#6cabdd",
            glow: "#00f2fe"
        },
        stats: {
            pac: 92,
            sho: 93,
            pas: 72,
            dri: 82,
            def: 40,
            phy: 90
        }
    },
    "takumi_minamino": {
        id: "takumi_minamino",
        name: "미나미노",
        rating: 85,
        position: "CM",
        nation: "Japan",
        nationFlag: "https://flagcdn.com/w40/jp.png",
        club: "MONACO",
        image: "player2/미나미노.png",
        rarity: "special",
        description: "뛰어난 공간 침투와 연계 플레이, 그리고 날카로운 결정력을 갖춘 AS 모나코 소속의 일본 대표팀 공격형 미드필더 미나미노입니다. 공수 양면에서 높은 전술적 이해도를 발휘하며 기회를 창출하는 스페셜 미드필더입니다.",
        theme: {
            primary: "#e20613",
            secondary: "#ffffff",
            glow: "#ff3e6c"
        },
        stats: {
            pac: 83,
            sho: 83,
            pas: 88,
            dri: 89,
            def: 45,
            phy: 72
        }
    },
    "junya_ito": {
        id: "junya_ito",
        name: "이토 준야",
        rating: 85,
        position: "RW",
        nation: "Japan",
        nationFlag: "https://flagcdn.com/w40/jp.png",
        club: "REIMS",
        image: "player2/이토준야.png",
        rarity: "special",
        description: "폭발적인 주력과 상대 측면을 완전히 허무는 크로스 능력을 자랑하는 스타드 랭스 소속의 일본 대표팀 윙어 이토 준야입니다. 빠른 역습의 핵심 자원이자 저돌적인 드리블 돌파가 장점인 스페셜 윙어입니다.",
        theme: {
            primary: "#c8102e",
            secondary: "#ffffff",
            glow: "#ffd700"
        },
        stats: {
            pac: 91,
            sho: 78,
            pas: 83,
            dri: 85,
            def: 40,
            phy: 70
        }
    },
    "cho_yu_min": {
        id: "cho_yu_min",
        name: "조유민",
        rating: 83,
        position: "CB",
        nation: "South Korea",
        nationFlag: "https://flagcdn.com/w40/kr.png",
        club: "KOREA",
        image: "player2/조유민.png",
        rarity: "special",
        description: "강인한 제공권 장악력과 뛰어난 수비 리딩 능력을 바탕으로 대표팀 수비의 한 축을 담당하는 센터백 조유민입니다. 파이팅 넘치는 대인 마크와 세트피스 상황에서의 득점력까지 겸비한 스페셜 수비수입니다.",
        theme: {
            primary: "#da1a32",
            secondary: "#1d2b58",
            glow: "#ff2a55"
        },
        stats: {
            pac: 78,
            sho: 48,
            pas: 70,
            dri: 68,
            def: 84,
            phy: 82
        }
    },
    "neymar": {
        id: "neymar",
        name: "네이마르",
        rating: 89,
        position: "LW",
        nation: "Brazil",
        nationFlag: "https://flagcdn.com/w40/br.png",
        club: "AL HILAL",
        image: "player2/네이마르.png",
        rarity: "legend",
        description: "화려한 드리블과 창의적인 플레이로 전 세계 축구팬들을 사로잡는 브라질의 리빙 레전드 공격수 네이마르입니다. 폭발적인 볼 컨트롤, 민첩한 페인트 동작, 그리고 날카로운 킥 능력으로 경기의 판도를 뒤흔드는 월드클래스 크랙입니다.",
        theme: {
            primary: "#000000",
            secondary: "#c39e5c",
            glow: "#ffd700"
        },
        stats: {
            pac: 87,
            sho: 84,
            pas: 86,
            dri: 92,
            def: 37,
            phy: 61
        }
    },
    "luka_modric": {
        id: "luka_modric",
        name: "루카 모드리치",
        rating: 89,
        position: "CM",
        nation: "Croatia",
        nationFlag: "https://flagcdn.com/w40/hr.png",
        club: "REAL MADRID",
        image: "player2/모드리치.png",
        rarity: "legend",
        description: "지치지 않는 체력과 환상적인 아웃프런트 패스, 완벽한 경기 조율로 발롱도르를 수상한 크로아티아의 중원 사령탑 루카 모드리치입니다. 뛰어난 축구 지능과 탈압박 능력으로 팀의 공수 밸런스를 조율하는 전설적인 미드필더입니다.",
        theme: {
            primary: "#000000",
            secondary: "#c39e5c",
            glow: "#ffd700"
        },
        stats: {
            pac: 73,
            sho: 76,
            pas: 90,
            dri: 88,
            def: 72,
            phy: 66
        }
    },
    "koo_ja_cheol": {
        id: "koo_ja_cheol",
        name: "구자철",
        rating: 88,
        position: "CM",
        nation: "South Korea",
        nationFlag: "https://flagcdn.com/w40/kr.png",
        club: "KOREA",
        image: "player2/구자철.png",
        rarity: "special",
        description: "대한민국 중원의 지휘자이자 멀티 플레이어의 정석인 구자철입니다. 뛰어난 축구 지능, 날카로운 패싱력, 그리고 헌신적인 활동량으로 대표팀의 전성기를 이끌었던 전설적인 미드필더입니다.",
        theme: {
            primary: "#da1a32",
            secondary: "#1d2b58",
            glow: "#ff2a55"
        },
        stats: {
            pac: 80,
            sho: 85,
            pas: 89,
            dri: 86,
            def: 78,
            phy: 84
        }
    },
    "na_sang_ho": {
        id: "na_sang_ho",
        name: "나상호",
        rating: 88,
        position: "LW",
        nation: "South Korea",
        nationFlag: "https://flagcdn.com/w40/kr.png",
        club: "KOREA",
        image: "player2/나상호.png",
        rarity: "special",
        description: "왕성한 활동량과 폭발적인 스피드를 무기로 전방 압박과 돌파를 이끄는 국가대표 윙어 나상호입니다. 지치지 않는 기동력과 날카로운 컷인 슛으로 상대 측면을 흔드는 해결사입니다.",
        theme: {
            primary: "#da1a32",
            secondary: "#1d2b58",
            glow: "#ff2a55"
        },
        stats: {
            pac: 91,
            sho: 86,
            pas: 83,
            dri: 88,
            def: 48,
            phy: 78
        }
    },
    "mbappe": {
        id: "mbappe",
        name: "음바페",
        rating: 91,
        position: "ST",
        nation: "France",
        nationFlag: "https://flagcdn.com/w40/fr.png",
        club: "REAL MADRID",
        image: "player2/음바페.png",
        rarity: "legend",
        description: "폭발적인 주력과 경이로운 골 결정력으로 상대 수비진을 무력화하는 세계 최고의 공격수 음바페입니다. 가공할 만한 스피드와 정교한 드리블, 침착한 마무리 능력을 겸비한 월드클래스 크랙입니다.",
        theme: {
            primary: "#000000",
            secondary: "#c39e5c",
            glow: "#ffd700"
        },
        stats: {
            pac: 97,
            sho: 90,
            pas: 80,
            dri: 92,
            def: 36,
            phy: 78
        }
    },
    "lamine_yamal": {
        id: "lamine_yamal",
        name: "라민 야말",
        rating: 89,
        position: "RW",
        nation: "Spain",
        nationFlag: "https://flagcdn.com/w40/es.png",
        club: "BARCELONA",
        image: "player2/라민야말.png",
        rarity: "legend",
        description: "바르셀로나와 스페인의 미래를 짊어진 역대급 천재 윙어 라민 야말입니다. 나이를 무색게 하는 뛰어난 경기 영향력, 정교한 드리블 돌파, 그리고 날카로운 컷인 플레이와 창의적인 패스로 측면을 파괴합니다.",
        theme: {
            primary: "#000000",
            secondary: "#c39e5c",
            glow: "#ffd700"
        },
        stats: {
            pac: 89,
            sho: 83,
            pas: 86,
            dri: 91,
            def: 35,
            phy: 68
        }
    },
    "ruben_dias": {
        id: "ruben_dias",
        name: "후벵 디아스",
        rating: 90,
        position: "CB",
        nation: "Portugal",
        nationFlag: "https://flagcdn.com/w40/pt.png",
        club: "MANCHESTER CITY",
        image: "player2/후뱅디아스.webp",
        rarity: "legend",
        description: "맨체스터 시티의 후방을 든든하게 책임지는 세계 최고의 센터백 후벵 디아스입니다. 뛰어난 수비 지능과 탁월한 대인 방어, 강력한 공중볼 장악력뿐만 아니라 강인한 리더십으로 수비 라인을 지휘하는 사령탑입니다.",
        theme: {
            primary: "#000000",
            secondary: "#c39e5c",
            glow: "#ffd700"
        },
        stats: {
            pac: 72,
            sho: 40,
            pas: 73,
            dri: 69,
            def: 91,
            phy: 89
        }
    },
    "neuer": {
        id: "neuer",
        name: "노이어",
        rating: 91,
        position: "GK",
        nation: "Germany",
        nationFlag: "https://flagcdn.com/w40/de.png",
        club: "BAYERN MUNICH",
        image: "player2/노이어.webp",
        rarity: "legend",
        description: "현대 축구 골키퍼의 패러다임을 바꾼 스위퍼-키퍼의 시조이자 독일 축구의 살아있는 전설 마누엘 노이어입니다. 경이로운 반사 신경, 압도적인 일대일 저지 능력은 물론, 넓은 수비 범위와 필드 플레이어 수준의 정교한 빌드업 능력을 자랑합니다.",
        theme: {
            primary: "#000000",
            secondary: "#c39e5c",
            glow: "#ffd700"
        },
        stats: {
            pac: 88,
            sho: 89,
            pas: 91,
            dri: 92,
            def: 90,
            phy: 87
        }
    }
};

// Ensure every card in the database defaults to normal rarity if not specified
Object.keys(CARDS_DATABASE).forEach(key => {
    if (!CARDS_DATABASE[key].rarity) {
        CARDS_DATABASE[key].rarity = "normal";
    }
});
