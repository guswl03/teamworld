# TeamWorld MVP 제품·기술 명세서

> 분산된 5개 팀이 하나의 RPG 월드에 모여 일하는 느낌을 주고, GitHub
> 활동을 프로젝트/퀘스트로 시각화하는 웹 기반 협업 공간.

-   버전: v0.1
-   작성일: 2026-09-05
-   핵심 원칙: 설치 없이 URL 접속 → GitHub 로그인 → 바로 월드 입장

------------------------------------------------------------------------

## 1. 제품 목표

현재 각자 일하고 있는 5개 팀을 하나의 온라인 공간에 모여 있는 것처럼
표현한다.

TeamWorld는 일반적인 업무 대시보드가 아니라 2D RPG 월드 형태의 협업
공간이다. 구성원은 캐릭터로 접속하고 각 팀은 고유한 공간을 가진다. 중앙
광장에서는 전체 팀의 존재와 프로젝트 진행 상황을 확인한다.

### 핵심 컨셉

-   5개 팀 = 5개 길드/지역
-   중앙 광장 = 전체 팀 공용 공간
-   프로젝트 = Quest Line
-   GitHub Issue = Quest
-   Pull Request = Review Mission
-   Merge = Quest Complete
-   Milestone = Boss / Chapter
-   Release = Boss Clear / World Event

### MVP 성공 조건

1.  브라우저에서 설치 없이 실행
2.  GitHub OAuth 로그인
3.  최초 접속 시 닉네임/캐릭터/팀 선택
4.  WASD 또는 방향키 이동
5.  다른 접속자의 위치를 실시간 표시
6.  사용자 이름/팀/상태 표시
7.  중앙 광장 + 5개 팀 공간
8.  실제 URL로 배포 가능

------------------------------------------------------------------------

## 2. MVP 제외 범위

초기에는 아래 기능을 제외한다.

-   음성/영상 통화
-   전투 및 복잡한 RPG 스탯
-   아이템 거래
-   사용자 제작 맵 에디터
-   완전한 모바일 게임 조작
-   Slack/Jira/Notion 연동
-   MMO 수준의 별도 게임 서버
-   개인 Commit 수 기반 경쟁 랭킹

------------------------------------------------------------------------

## 3. 사용자 흐름

### 최초 접속

``` text
서비스 URL
    ↓
랜딩 페이지
    ↓
Continue with GitHub
    ↓
GitHub OAuth
    ↓
프로필 설정
 ├─ 닉네임
 ├─ 캐릭터
 └─ 소속 팀
    ↓
월드 입장
```

### 재접속

``` text
URL 접속
→ 로그인 세션 확인
→ 프로필 로드
→ 월드 입장
```

------------------------------------------------------------------------

## 4. 월드 구조

``` text
                    [ Main Guild ]
                     중앙 광장
                         │
          ┌──────────────┼──────────────┐
          │              │              │
      [ Team 1 ]     [ Team 2 ]     [ Team 3 ]
          │                              │
          └──────────[ Team 4 ]──[ Team 5 ]
```

### 중앙 광장

향후 다음 요소를 표시한다.

-   온라인 인원
-   전체 프로젝트 진행률
-   최근 완료 Quest
-   Release / Milestone
-   공지
-   전체 회의 공간
-   Achievement / Trophy

### 팀 공간

각 팀은 독립 영역을 가진다.

-   팀 이름
-   현재 접속 팀원
-   팀원 캐릭터
-   현재 프로젝트
-   업무 상태

DB는 팀 5개에 고정하지 않고 추후 확장 가능하게 설계한다.

------------------------------------------------------------------------

## 5. 기능 명세

### F-01 GitHub 로그인

-   Continue with GitHub
-   GitHub OAuth 인증
-   GitHub user ID 저장
-   GitHub username 저장
-   GitHub avatar 활용
-   세션 유지
-   로그아웃

로그인용 GitHub 권한과 Repository 접근 권한은 분리한다. 최초 로그인은
최소 권한만 요청한다.

### F-02 사용자 프로필

  필드              설명
  ----------------- ------------------
  id                내부 UUID
  github_id         GitHub 사용자 ID
  github_username   GitHub 사용자명
  nickname          표시 이름
  avatar_type       캐릭터
  team_id           소속 팀
  status            업무 상태
  created_at        생성 시간
  updated_at        수정 시간

### F-03 팀

  필드         설명
  ------------ -------------
  id           UUID
  name         팀 이름
  slug         내부 식별자
  room_id      팀 공간
  theme        공간 테마
  created_at   생성 시간

### F-04 2D 월드

-   타일 기반 맵
-   플레이어 캐릭터
-   WASD/방향키 이동
-   기본 충돌
-   카메라 추적
-   다른 사용자 표시
-   캐릭터 위 닉네임
-   캐릭터 위 상태

``` text
    💻 Working
       NEMO
        🧙
```

### F-05 실시간 위치

위치는 DB에 매 프레임 저장하지 않고 Realtime Broadcast로 전송한다.

``` json
{
  "type": "player_move",
  "userId": "uuid",
  "x": 420,
  "y": 315,
  "direction": "left",
  "animation": "walk"
}
```

원격 캐릭터는 좌표 보간을 적용하여 움직임을 부드럽게 표현한다.

### F-06 Presence

``` json
{
  "userId": "uuid",
  "nickname": "NEMO",
  "teamId": "team-1",
  "roomId": "main-square",
  "status": "working"
}
```

상태:

-   online
-   working
-   meeting
-   break
-   away

### F-07 Room

``` text
main-square
team-1
team-2
team-3
team-4
team-5
```

사용자가 공간 경계를 이동하면 roomId를 변경한다.

### F-08 채팅

v0.2 우선순위.

-   Room 채팅
-   전체 채팅
-   사용자명
-   전송 시간
-   텍스트 메시지

------------------------------------------------------------------------

## 6. GitHub 연동

### Phase 1: Authentication

``` text
GitHub OAuth
      ↓
Supabase Auth
      ↓
TeamWorld Profile
```

### Phase 2: Repository Integration

사용자가 별도의 Connect Repository 기능을 통해 업무 Repository를
연결한다.

연동 후보:

-   Repository
-   Issue
-   Pull Request
-   Commit
-   Milestone
-   Release

### GitHub → RPG 변환

  GitHub         TeamWorld
  -------------- --------------------------
  Repository     Project / Region
  Issue          Quest
  Assignee       Quest 담당 플레이어
  Commit         Quest Activity
  Pull Request   Review Mission
  Merge          Quest Complete
  Milestone      Boss / Chapter
  Release        Boss Clear / World Event
  Contributor    Party Member

장기적으로 GitHub App + Webhook 방식의 이벤트 동기화를 검토한다.

------------------------------------------------------------------------

## 7. 권장 기술 스택

### Frontend

-   Next.js
-   React
-   TypeScript
-   Phaser
-   Tailwind CSS

### Backend

-   Supabase Auth
-   Supabase PostgreSQL
-   Supabase Realtime
-   Supabase Row Level Security

### Infrastructure / External

-   Vercel
-   GitHub OAuth
-   GitHub API
-   향후 GitHub App / Webhook

------------------------------------------------------------------------

## 8. 시스템 아키텍처

``` text
┌───────────────────────────────────────┐
│                Browser                │
│                                       │
│ Next.js / React       Phaser          │
│ Login / Settings      Map             │
│ Dashboard / UI        Player/Movement │
└───────────────┬───────────────────────┘
                ↓
        ┌───────────────────┐
        │     Supabase      │
        │ Auth / PostgreSQL │
        │ Realtime / RLS    │
        └─────────┬─────────┘
                  ↓
             ┌─────────┐
             │ GitHub  │
             │ API/App │
             └─────────┘

GitHub Repository → Vercel → Production URL
```

------------------------------------------------------------------------

## 9. 데이터베이스 초안

### profiles

``` sql
profiles
- id uuid PK
- github_id text UNIQUE
- github_username text
- nickname text
- avatar_type text
- team_id uuid FK
- status text
- created_at timestamptz
- updated_at timestamptz
```

### teams

``` sql
teams
- id uuid PK
- name text
- slug text UNIQUE
- room_id text
- theme jsonb
- created_at timestamptz
```

### projects

``` sql
projects
- id uuid PK
- team_id uuid FK
- name text
- github_owner text
- github_repo text
- github_repo_id text
- status text
- created_at timestamptz
- updated_at timestamptz
```

### quests

``` sql
quests
- id uuid PK
- project_id uuid FK
- github_issue_id text
- github_issue_number integer
- title text
- assignee_id uuid FK
- status text
- progress integer
- created_at timestamptz
- updated_at timestamptz
```

### achievements

``` sql
achievements
- id uuid PK
- team_id uuid FK
- project_id uuid FK NULL
- type text
- title text
- metadata jsonb
- unlocked_at timestamptz
```

------------------------------------------------------------------------

## 10. Realtime 설계 원칙

``` text
빠르고 휘발성인 데이터
→ Broadcast
→ 위치 / 방향 / 애니메이션

현재 접속 상태
→ Presence
→ 온라인 / room / working / meeting

보존 데이터
→ PostgreSQL
→ 프로필 / 팀 / 프로젝트 / Quest / 설정
```

------------------------------------------------------------------------

## 11. 프론트엔드 구조

``` text
src/
├─ app/
│  ├─ page.tsx
│  ├─ login/
│  ├─ onboarding/
│  ├─ world/
│  └─ settings/
├─ components/
│  ├─ auth/
│  ├─ profile/
│  ├─ team/
│  ├─ world-ui/
│  └─ common/
├─ game/
│  ├─ config.ts
│  ├─ scenes/
│  │  ├─ BootScene.ts
│  │  └─ WorldScene.ts
│  ├─ entities/
│  │  ├─ Player.ts
│  │  └─ RemotePlayer.ts
│  ├─ maps/
│  └─ networking/
│     ├─ presence.ts
│     └─ movement.ts
├─ lib/
│  ├─ supabase/
│  ├─ github/
│  └─ auth/
├─ hooks/
├─ types/
└─ assets/
```

------------------------------------------------------------------------

## 12. 화면

### `/`

``` text
TEAMWORLD

Your team.
One world.

[ Continue with GitHub ]

5 Teams
1 World
```

### `/onboarding`

``` text
Choose your character

[ Character A ] [ Character B ] [ Character C ]

Nickname
[____________]

Team
[ Team 1 ▼ ]

[ Enter World ]
```

### `/world`

``` text
┌─────────────────────────────────────────┐
│ TeamWorld       18 Online     [Profile] │
├─────────────────────────────────────────┤
│                                         │
│               GAME WORLD                │
│                                         │
│            🧙    🧝    🧑‍🚀             │
│                                         │
├─────────────────────────────────────────┤
│ Status: Working ▼       Team 1          │
└─────────────────────────────────────────┘
```

### `/settings`

-   닉네임
-   캐릭터
-   팀
-   GitHub 연결 상태
-   Repository 연결
-   로그아웃

------------------------------------------------------------------------

## 13. 모바일

MVP는 Desktop First.

Desktop에서는 전체 RPG 월드와 이동을 지원한다.

초기 Mobile 버전은 다음 기능을 우선한다.

-   온라인 인원
-   팀원 상태
-   프로젝트 상태
-   Quest
-   채팅

모바일 월드 이동은 후속 버전에서 검토한다.

------------------------------------------------------------------------

## 14. 보안

-   GitHub OAuth + Supabase Auth
-   PostgreSQL RLS
-   본인 프로필 수정 권한 제한
-   조직/월드 단위 접근 제어
-   관리자 역할 별도 관리
-   로그인 권한과 Repository 접근 권한 분리
-   GitHub Client Secret/Token의 클라이언트 노출 금지
-   Secret은 서버 환경변수에서 관리

GitHub 활동을 게임 요소로 변환하더라도 개인별 Commit 수나 활동량을 강제
순위화하지 않는다. 목적은 감시가 아니라 공동 진행 상황과 함께 일하는
감각의 시각화다.

------------------------------------------------------------------------

## 15. 배포

``` text
GitHub Repository
       ↓
     Vercel
       ↓
Production Domain
       ↓
    Supabase
```

### 환경변수

``` env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
NEXT_PUBLIC_APP_URL=
```

Secret과 `.env` 파일은 Git에 커밋하지 않는다.

------------------------------------------------------------------------

## 16. 개발 로드맵

### Sprint 1 --- Foundation

-   Next.js + TypeScript
-   Supabase
-   GitHub OAuth
-   profiles / teams
-   onboarding
-   Vercel Preview

완료 기준: GitHub 로그인 후 프로필 생성 및 온보딩 완료.

### Sprint 2 --- Single Player World

-   Phaser
-   테스트 맵
-   플레이어
-   WASD/방향키
-   충돌
-   카메라
-   중앙 광장 + 5개 팀 공간

완료 기준: 브라우저에서 캐릭터가 정상적으로 월드를 이동.

### Sprint 3 --- Multiplayer

-   Presence
-   접속/퇴장 동기화
-   Broadcast 이동 이벤트
-   RemotePlayer
-   위치 보간
-   닉네임/상태

완료 기준: 서로 다른 두 브라우저에서 두 캐릭터가 실시간으로 보이고
움직임이 동기화됨.

### Sprint 4 --- Team Experience

-   팀별 Spawn
-   Room 감지
-   상태 변경
-   온라인 인원
-   팀원 UI
-   기본 채팅

완료 기준: 5개 팀이 실제 내부 테스트에 사용할 수 있음.

### Sprint 5 --- GitHub Quest Prototype

-   Repository 연결
-   Issue 조회
-   Issue → Quest
-   PR 상태
-   Merge → Quest Complete
-   프로젝트 진행 UI

완료 기준: 실제 GitHub 프로젝트 하나가 RPG Quest로 월드에 표시됨.

------------------------------------------------------------------------

## 17. MVP 완료 정의

``` text
A: URL 접속
→ GitHub 로그인
→ Team 1 선택
→ 캐릭터 선택
→ 월드 입장

B: 다른 PC에서 접속
→ GitHub 로그인
→ Team 2 선택
→ 월드 입장

A 화면에 B 표시
B 화면에 A 표시

A가 이동
→ B 화면에서도 A 이동

A = Working
B = Meeting
→ 각각 캐릭터 위에 상태 표시
```

위 시나리오가 실제 배포 환경에서 정상 동작하면 1차 MVP를 완료한 것으로
본다.

------------------------------------------------------------------------

## 18. 후속 버전

### v0.2 --- Social

-   채팅
-   이모트
-   팀 상태
-   회의 공간

### v0.3 --- GitHub RPG

-   Repository 연결
-   Issue Quest
-   PR Review Mission
-   Milestone Boss
-   Release World Event

### v0.4 --- World Progression

-   팀 공간 꾸미기
-   Trophy
-   Achievement
-   프로젝트 완료 오브젝트
-   회사/팀의 프로젝트 히스토리를 월드에 누적

### v1.0

-   Organization 생성/초대
-   여러 Organization 지원
-   관리자 기능
-   GitHub App/Webhook
-   커스텀 도메인 검토
-   Slack/Jira/Notion/Calendar 등 확장

------------------------------------------------------------------------

## 19. 가장 먼저 구현할 것

첫 번째 목표는 아래 한 문장으로 제한한다.

> **GitHub로 로그인하면 5개 팀 구성원이 하나의 RPG 맵에 접속하고 서로
> 움직이는 모습을 실시간으로 볼 수 있는 웹앱.**

GitHub Quest, Achievement, 꾸미기 등은 이 코어 경험이 실제 사용자에게
재미와 연결감을 주는지 확인한 이후 확장한다.

------------------------------------------------------------------------

## 20. 프로젝트 가칭

**TeamWorld**

대체 후보:

-   GuildSpace
-   WorkGuild
-   PartyWork
-   TeamQuest
-   GuildOffice

제품명은 MVP 개발 중 변경 가능하다.
