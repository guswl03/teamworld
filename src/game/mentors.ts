export interface MentorTopic {
  title: string;
  keywords: string;
  summary: string;
  preparation: string[];
}
export interface Mentor {
  id: string;
  name: string;
  topics: MentorTopic[];
  x: number;
  y: number;
  image: string;
  color: number;
}
const topic = (
  title: string,
  keywords: string,
  summary: string,
  preparation: string[],
): MentorTopic => ({ title, keywords, summary, preparation });
const records: { name: string; topics: MentorTopic[]; x: number; y: number }[] =
  [
    {
      name: "전상현",
      x: 230,
      y: 345,
      topics: [
        topic(
          "시스템 프로그래밍",
          "컴파일러 · 언어 · 메모리 · 자료구조 · 네트워크",
          "프로그램이 실행되는 흐름과 메모리, 자료구조, 네트워크의 연결을 살펴봅니다.",
          ["익숙한 언어로 짧은 프로그램 작성", "스택과 힙의 차이 정리"],
        ),
      ],
    },
    {
      name: "강대명",
      x: 390,
      y: 345,
      topics: [
        topic(
          "파일시스템 인터널",
          "MBR · GPT · FAT32 · NTFS · EXT4",
          "파티션과 파일시스템이 데이터를 저장하고 찾는 구조를 비교합니다.",
          ["파티션과 파일의 개념 복습", "실습용 복제 디스크 이미지 준비"],
        ),
      ],
    },
    {
      name: "김관영",
      x: 700,
      y: 305,
      topics: [
        topic(
          "Git/GitHub 실전",
          "fork · PR · 협업",
          "변경 이력을 관리하고 동료와 리뷰하는 협업 흐름을 익힙니다.",
          ["연습 저장소 준비", "커밋과 브랜치 개념 복습"],
        ),
        topic(
          "차량보안 입문",
          "CAN · LIN · FlexRay · ECU",
          "차량 내부 통신과 제어 장치의 기본 구조, 보안 고려사항을 살펴봅니다.",
          ["차량 통신 용어 정리", "교육용 자료·시뮬레이터 준비"],
        ),
        topic(
          "Recon 기반 보안 취약점 탐지 및 분석 실습",
          "OSINT",
          "공개 정보의 출처를 검토하고 허가된 범위에서 분석 결과를 정리합니다.",
          ["실습 대상과 허용 범위 확인", "공개 정보 출처 기록 양식 준비"],
        ),
      ],
    },
    {
      name: "김주생",
      x: 900,
      y: 305,
      topics: [
        topic(
          "가상메모리와 페이지 테이블",
          "CR3 · 주소 변환",
          "가상 주소가 물리 주소로 변환되는 과정을 페이지 테이블로 이해합니다.",
          ["이진수와 16진수 복습", "운영체제 메모리 관리 개념 정리"],
        ),
        topic(
          "보안 특허 개발",
          "보안 아이디어 · 특허",
          "보안 문제를 정의하고 해결 아이디어를 구조적으로 정리합니다.",
          ["해결하고 싶은 보안 문제 정리", "관련 공개 기술 자료 조사"],
        ),
      ],
    },
    {
      name: "김태홍",
      x: 1210,
      y: 345,
      topics: [
        topic(
          "생성형 AI 보안",
          "LLM Gateway",
          "생성형 AI 서비스의 요청 흐름과 게이트웨이에서 고려할 보안 요소를 살펴봅니다.",
          ["LLM 서비스 요청 흐름 그려보기", "민감정보 처리 원칙 정리"],
        ),
      ],
    },
    {
      name: "남성엽",
      x: 1370,
      y: 345,
      topics: [
        topic(
          "개발자를 위한 오펜시브 시큐리티",
          "개발 · 보안 검증",
          "공격 관점으로 소프트웨어의 가정을 점검하고 방어 개선에 연결합니다.",
          ["격리된 교육용 실습 환경 준비", "허가된 테스트 범위 확인"],
        ),
      ],
    },
    {
      name: "문재현",
      x: 280,
      y: 865,
      topics: [
        topic(
          "AI에 대한 이해 및 적용",
          "기초 · 알고리즘 · 라벨링 · 모델 · Agentic AI",
          "데이터 준비부터 모델과 에이전트 활용까지 AI 개발 흐름을 살펴봅니다.",
          ["분석할 예제 데이터 준비", "라벨링과 모델 평가 개념 정리"],
        ),
      ],
    },
    {
      name: "박수현",
      x: 520,
      y: 865,
      topics: [
        topic(
          "생성형 AI를 활용한 웹서비스 개발",
          "생성형 AI · 웹서비스",
          "웹서비스 개발 과정에서 생성형 AI를 활용하고 결과를 검증하는 흐름을 익힙니다.",
          ["만들고 싶은 웹서비스 요구사항 정리", "HTML·API 기본 개념 복습"],
        ),
      ],
    },
    {
      name: "장상근",
      x: 1080,
      y: 865,
      topics: [
        topic(
          "바이브 엔지니어링",
          "AI 협업 · 개발",
          "AI와 협업하며 요구사항을 구체화하고 구현 결과를 검토하는 개발 과정을 살펴봅니다.",
          ["작은 기능의 완료 조건 작성", "결과 확인용 테스트 사례 정리"],
        ),
      ],
    },
    {
      name: "한현상",
      x: 1320,
      y: 865,
      topics: [
        topic(
          "퍼블릭 클라우드 보안 개발과 AI 보안",
          "퍼블릭 클라우드 · AI 보안",
          "클라우드 서비스와 AI 기능을 개발할 때 권한, 데이터, 보안 경계를 검토합니다.",
          ["클라우드 권한·네트워크 기본 개념 복습", "샘플 서비스 구성도 준비"],
        ),
      ],
    },
    {
      name: "이경문",
      x: 570,
      y: 575,
      topics: [
        topic(
          "Network Protocol",
          "Ethernet · ARP · IP · TCP · UDP · Tunneling",
          "계층별 네트워크 프로토콜의 역할과 패킷 흐름을 비교합니다.",
          ["네트워크 계층 모델 복습", "교육용 패킷 캡처 자료 준비"],
        ),
      ],
    },
    {
      name: "양혁재",
      x: 1030,
      y: 575,
      topics: [
        topic(
          "담당 주제 확인 중",
          "제공된 커리큘럼에 주제 없음",
          "제공된 명단에는 이름이 있으나 담당 커리큘럼은 확인되지 않았습니다.",
          ["추가 커리큘럼 안내 확인"],
        ),
      ],
    },
  ];
const rosterOrder = [
  "전상현",
  "강대명",
  "김관영",
  "김주생",
  "김태홍",
  "남성엽",
  "문재현",
  "박수현",
  "양혁재",
  "이경문",
  "장상근",
  "한현상",
];
export const MENTORS: Mentor[] = records
  .map((r, i) => ({
    ...r,
    id: `mentor-${i + 1}`,
    image: `/assets/mentors/mentor-${i + 1}.png`,
    color: [0x198a92, 0x586bb1, 0xb26c35][Math.floor(i / 4)],
  }))
  .sort((a, b) => rosterOrder.indexOf(a.name) - rosterOrder.indexOf(b.name));
export const mentorApproach = (m: Mentor) => ({ x: m.x, y: m.y + 40 });
export function mentorAt(
  point: { x: number; y: number },
  mentors: readonly Mentor[] = MENTORS,
): Mentor | undefined {
  let nearest: Mentor | undefined,
    distance = 65;
  for (const mentor of mentors) {
    const d = Math.hypot(point.x - mentor.x, point.y - mentor.y);
    if (d <= 65 && (!nearest || d < distance)) {
      nearest = mentor;
      distance = d;
    }
  }
  return nearest;
}
