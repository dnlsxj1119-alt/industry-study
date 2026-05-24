import type { Post, Comment, Bookmark } from '../types';

export const mockPosts: Post[] = [
  {
    id: '1',
    title: 'TSMC CoWoS 증설 속도 둔화',
    url: 'https://example.com/tsmc-cowos',
    source: 'The Elec',
    summary: 'AI 수요는 증가하지만 패키징 공급 병목은 당분간 지속될 전망',
    opinion: 'HBM 다음 병목은 후공정일 가능성이 높다고 생각합니다.',
    content: 'TSMC가 최첨단 패키징 기술인 CoWoS(Chip on Wafer on Substrate)의 생산 능력 확대 속도를 일부 조절하고 있다는 소식입니다. 엔비디아 등 주요 AI 반도체 팹리스의 수요가 급증하고 있으나 장비 리드타임 문제로 인해 당분간 공급 부족 사태가 장기화될 것으로 보입니다.',
    category: '반도체',
    tags: ['TSMC', '패키징', 'HBM'],
    author: '다연',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: '2',
    title: '엔비디아 Blackwell 생산 일정 지연 이슈',
    // url removed for testing optional url
    source: 'Bloomberg',
    summary: '발열 문제로 일부 고객사 납품 일정이 변경될 가능성 제기',
    opinion: '단기 실적에는 영향이 있겠지만 장기 수요는 여전히 견고할 것 같습니다.',
    content: '엔비디아의 차세대 AI 가속기인 Blackwell 아키텍처 기반 칩들이 발열 및 수율 이슈로 인해 일부 생산 일정이 연기되고 있다는 보도가 나왔습니다. 이로 인해 마이크로소프트, 메타 등 주요 빅테크들의 서버 구축 일정도 순연될 수 있다는 전망이 나오고 있습니다.',
    category: 'AI',
    tags: ['NVIDIA', 'Blackwell', 'AI반도체'],
    author: '유연',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    id: '3',
    title: '미국 전력 인프라 투자 본격화',
    url: 'https://example.com/us-power',
    source: 'WSJ',
    summary: '데이터센터 증가로 전력망 현대화 투자가 가속화',
    opinion: 'AI 산업의 병목이 반도체에서 전력 인프라로 확장되는 흐름 같습니다.',
    category: '전력/에너지',
    tags: ['데이터센터', '전력망', '전력인프라'],
    author: '준순',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
  },
  {
    id: '4',
    title: 'LG에너지솔루션 미국 공장 투자 확대',
    url: 'https://example.com/lges',
    source: '연합뉴스',
    summary: 'IRA 보조금 확보를 위해 미국 내 생산능력 추가 확대',
    opinion: '중장기적으로 북미 시장 지배력 강화에 도움이 될 것 같습니다.',
    category: '배터리',
    tags: ['LGES', '배터리', 'IRA'],
    author: '다연',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
  },
  {
    id: '5',
    title: '테슬라 옵티머스 생산 목표 상향 조정',
    // url removed for testing optional url
    source: 'Tesla Investor Day',
    summary: '2025년 생산 목표를 기존 대비 2배 상향 조정',
    opinion: '휴머노이드 시장 선점 전략이 본격화되는 느낌입니다.',
    content: '테슬라는 최근 투자자 설명회에서 옵티머스 봇의 2025년 생산 목표를 기존 계획보다 2배 이상 상향 조정했다고 밝혔습니다. 공장 내 단순 반복 작업을 자동화하여 제조 효율을 극대화하려는 전략으로 풀이됩니다.',
    category: '자동차',
    tags: ['테슬라', '휴머노이드', '로봇'],
    author: '유연',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 96).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 96).toISOString(),
  },
  {
    id: '6',
    title: 'OpenAI 차세대 모델 출시 임박',
    url: 'https://example.com/openai-next',
    source: 'TechCrunch',
    summary: '성능과 추론 능력이 대폭 향상된 차세대 모델 출시 예정',
    opinion: 'AI 모델 경쟁이 다시 한번 가속화될 것 같습니다.',
    content: 'OpenAI가 기존 모델 대비 추론 능력(Reasoning)이 비약적으로 발전한 새로운 파운데이션 모델을 조만간 공개할 것으로 보입니다. 이는 수학 문제 풀이 및 코딩 능력에서 타사 모델과 격차를 벌리기 위한 전략으로 해석됩니다.',
    category: 'AI',
    tags: ['OpenAI', 'AGI', '생성형AI'],
    author: '준순',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 120).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 120).toISOString(),
  },
];

export const mockComments: Comment[] = [
  {
    id: 'c1',
    post_id: '1',
    author: '유연',
    type: '동의',
    content: '맞아요, 후공정 장비 업체들 동향을 더 살펴봐야 할 것 같네요.',
    created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: 'c2',
    post_id: '1',
    author: '준순',
    type: '추가자료',
    content: '관련해서 어제 나온 리포트 링크 공유합니다.',
    created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
  },
];

export const mockBookmarks: Bookmark[] = [
  {
    id: 'b1',
    post_id: '1',
    author: '준순',
    created_at: new Date().toISOString(),
  }
];
