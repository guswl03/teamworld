# TeamWorld

5개 길드가 같은 RPG 월드에서 만나는 웹 협업 공간. Next.js + Phaser 3 + Supabase 기반의 개발 버전으로, 현재 월드는 BoB를 모티브로 한 **비공식 가상 IT 교육센터**입니다. 실제 센터의 평면도나 공식 상담 서비스가 아닙니다.

## 로컬 실행

Node.js 22 이상, pnpm 11을 사용합니다.

```sh
pnpm install
pnpm dev --hostname 127.0.0.1 --port 3100
```

http://127.0.0.1:3100 에서 **월드 먼저 둘러보기**를 누르면 계정 없이 체험합니다. 같은 브라우저에서 새 탭을 열고 다시 체험에 입장하면 두 캐릭터가 서로 보입니다. 데모는 브라우저 BroadcastChannel만 사용하므로 다른 브라우저/PC와 연결되지 않습니다. 데모 프로필은 탭 세션에만 저장됩니다. 탭을 복제하면 같은 사용자로 복원될 수 있으므로 앱의 **새 탭으로 친구 만들기** 링크를 사용하세요. 온라인 인원은 사용자 ID로 중복 제거하고 캐릭터는 연결 세션별로 표시합니다.

## 구현 범위

- 랜딩, GitHub OAuth PKCE 콜백, 온보딩, 프로필 설정, 로그아웃
- 자체 제작 실내 도트 센터: 라운지·안내 데스크·실습실·프로젝트 공간, 벽·책상과 일치하는 이동 충돌
- IT 콘셉트 4종 캐릭터의 대기/걷기 애니메이션, 프로필과 월드에 동일 아틀라스 적용
- 사용자 제공 명단의 멘토 NPC 12명, 커리큘럼 주제·준비 안내와 가까이 가서 E로 대화
- 멘토별 개별 픽셀 이미지: 사용자 외형 메모와 담당 분야를 반영한 창작 NPC이며 실제 초상은 아닙니다. [이미지·프롬프트 기록](public/assets/mentors/PROVENANCE.md)
- 월드가 화면 전체를 차지하는 작업 공간, 하단 채팅·동료·퀘스트·배낭·길드·설정 메뉴
- 네이비·청록 안내판 스타일 UI: 본문/입력창 16px, 보조 설명/메뉴 최소 14px, 창 제목 24px
- 클릭 없이 바로 WASD/방향키 이동, 충돌, 카메라 추적, 확대/축소, 길드 이동
- 월드 위 작업 창에서 채팅/프로필 수정, 창을 닫거나 Esc를 누르면 이동 복귀
- 이름/상태 표시, 전체/우리 길드 동료 목록, 모바일 상태/채팅 화면
- 루미의 탐험 퀘스트, 명소 3곳 발견, 보물상자와 모자 보상/착용
- 월드 전체 채팅: 최대 200자, 1초 전송 간격, 최근 100개 메시지
- Supabase private Presence + 10 Hz Broadcast, 원격 좌표 보간, 연결 오류/재시도
- GitHub ID 초대 명단, 프로필 RLS, 월드별 데이터 및 Realtime 접근 제한
- 서명 검증·중복 방지·연결 저장소 확인을 거치는 GitHub 이슈/PR 웹훅 서버 경계

채팅은 접속 중 메모리에만 존재하며 새로고침하면 사라집니다. 탐험 진행과 모자는 월드/프로필별로 이 브라우저에 저장되며 다른 기기나 동료에게 동기화되지 않습니다. NPC는 게임 안내 캐릭터이며 접속 인원에 포함되지 않습니다. NPC 대사는 실제 멘토의 인용 발언이나 실시간 상담이 아닙니다. 양혁재 멘토의 주제는 제공 자료에 없어 미확인으로 표시합니다. GitHub 웹훅 저장 경계는 구현되어 있지만 Quest 화면 표시는 후속 작업이며, 전투와 음성/영상은 아직 없습니다.

작업 창이나 NPC 대화가 열린 동안에는 캐릭터 이동을 멈춥니다. 창을 바꾸거나 닫아도 채팅 초안과 접속 상태는 유지되며, 월드 안에서 프로필을 저장해도 현재 위치는 바뀌지 않습니다. 모바일에서는 월드 이동 없이 같은 하단 메뉴로 채팅과 프로필 등 작업을 이용합니다.

## 단축키

Enter: 채팅 열기/전송 · P: 동료 · Q: 퀘스트 · I: 배낭 · G: 장소 · O: 설정 · Esc: 창 닫고 이동 복귀 · E: 가까운 NPC/물건과 상호작용. 입력창에 글을 쓰거나 한글 조합 중일 때는 이동/메뉴 단축키를 실행하지 않습니다.

## 외부 그래픽과 지도 편집

현재 센터 지도는 `src/game/center-model.ts`의 공통 배치/충돌 정보와 `src/game/center-art.ts`의 자체 Phaser 그래픽으로 구성됩니다. 아래 Tiny Swords/Tiled 자료는 이전 마을 버전의 보존 자료이며 센터 실내 도면을 편집하지 않습니다. 멘토 주제는 `src/game/mentors.ts`, 출처와 한계는 [센터 참고 자료](docs/center-reference.md)에 기록했습니다. IT 캐릭터 생성 출처·프롬프트는 [아틀라스 기록](public/assets/it-team/PROVENANCE.md)을 참고하세요.

[Pixel Frog의 Tiny Swords](https://pixelfrog-assets.itch.io/tiny-swords) 중 **TS_old version_CC0 Licensed**만 사용합니다. 최신 Free Pack과 Enemy Pack은 재배포 조건이 다르므로 그대로 바꿔 넣지 마세요. 원본 출처, 파일 매핑, 라이선스 및 다운로드 해시는 `public/assets/tiny-swords/PROVENANCE.md`에 기록했습니다. 추가 유료 도구나 프로덕션 의존성은 없습니다.

`public/maps/village.tmj`는 [Tiled](https://www.mapeditor.org/)에서 열 수 있는 이전 마을 지형 지도입니다. 64px 타일을 게임에서 0.5배로 표시합니다. 같은 폴더 구조를 유지하면 이미지 타일셋이 연결됩니다. 기본 지형을 재생성하려면 `node scripts/generate-village.mjs`를 실행합니다. 이 명령은 수동 지도 편집을 덮어쓰므로 먼저 변경을 보관하세요.

건물/소품 배치는 `src/game/world-art.ts`, 퀘스트 장식은 `src/game/world-details.ts`, 충돌/이동은 `src/game/world-model.ts`에 있습니다. Tiled는 이번 버전에서 **시각 지형만** 편집합니다. 길이나 건물을 옮길 때는 충돌과 퀘스트 좌표도 함께 검토해야 합니다. 게임 실행 중 외부 소재 서버에 접속하지 않습니다.

## 실제 GitHub 로그인과 멀티플레이 연결

1. Supabase 프로젝트를 준비하고 SQL Editor에서 `supabase/migrations/001_teamworld.sql` 전체를 한 번 실행합니다. 새 테이블 및 RLS 정책을 만드는 마이그레이션입니다. 기존 TeamWorld 테이블이 있는 프로젝트에 중복 실행하지 마세요.
2. GitHub의 Developer settings → OAuth Apps에서 OAuth 앱을 준비합니다. Homepage URL은 앱 주소, Authorization callback URL은 `https://<project-ref>.supabase.co/auth/v1/callback`입니다.
3. Supabase Authentication → Providers → GitHub에 Client ID와 Client Secret을 등록합니다. 앱 코드/브라우저에 GitHub Secret을 넣지 않습니다.
4. Supabase Authentication → URL Configuration에서 Site URL을 배포 주소로 설정하고 Redirect URLs에 `http://127.0.0.1:3100/auth/callback`, 배포 주소의 `/auth/callback`을 등록합니다. 개발 시 브라우저 주소와 허용 주소의 호스트/포트가 일치해야 합니다.
5. Supabase Realtime 설정의 **Allow public access**를 끕니다. 앱은 `world:<uuid>` private 채널만 사용합니다. 로그인 세션과 allowlist가 없는 사용자는 입장할 수 없습니다.
6. `.env.example`을 `.env.local`로 복사한 뒤 프로젝트 URL과 브라우저용 publishable/anon 키를 넣습니다. `NEXT_PUBLIC_WORLD_ID`는 기본값을 사용합니다. 환경 변수 변경 후 개발 서버를 다시 시작합니다. 아래 웹훅 연동을 사용하지 않는 로컬 클라이언트 실행에는 서버 비밀값이 필요하지 않습니다.
7. 관리자가 GitHub 숫자 ID를 확인하고 다음 SQL로 팀원을 초대합니다. 숫자 ID는 GitHub 사용자 API(`https://api.github.com/users/<username>`)의 `id` 필드입니다. 닉네임/사용자명 문자열을 넣지 않습니다.

```sql
insert into public.world_access(world_id, github_id)
values ('11111111-1111-4111-8111-111111111111', '실제_GitHub_숫자_ID');
```

월드/길드 이름은 관리자가 DB에서 바꿀 수 있습니다. 5개 팀을 초과해 추가해도 DB 구조는 유지되며, 추가 팀의 위치는 안전한 센터 보조 위치를 사용합니다. 6개 이상 팀에 대한 맵 디자인은 별도 조정이 권장됩니다.

## GitHub App 웹훅 설정

먼저 `supabase/migrations/002_github_rpg.sql`을 적용하고 관리자가 `public.projects`에 연결할 저장소의 숫자 ID, GraphQL node ID, 소유자, 저장소명, 대상 `world_id`를 등록합니다. 웹훅은 GitHub가 보낸 월드 ID를 신뢰하지 않고 이 연결 정보로 월드를 다시 결정합니다.

배포 환경의 **서버 전용** 환경 변수에 다음 값을 설정합니다.

- `GITHUB_WEBHOOK_SECRET`: GitHub App의 Webhook secret과 정확히 같은 충분히 긴 임의 문자열
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase 프로젝트 URL
- `SUPABASE_SECRET_KEY`: 권장하는 서버 전용 Supabase secret key
- `SUPABASE_SERVICE_ROLE_KEY`: `SUPABASE_SECRET_KEY`가 없을 때만 사용하는 레거시 fallback

`SUPABASE_SECRET_KEY`와 `SUPABASE_SERVICE_ROLE_KEY`를 모두 설정하면 전자를 사용합니다. 이 키들과 웹훅 secret은 브라우저 코드, 로그, Git 기록에 넣지 마세요. `.env.example`에는 변수 이름만 있으며 실제 값은 배포 플랫폼의 비밀 저장소나 git에서 제외된 `.env.local`에 둡니다.

GitHub의 Developer settings에서 GitHub App을 만들 때 Webhook을 활성화하고 URL을 `https://<배포-도메인>/api/github/webhook`, Content type을 `application/json`으로 설정한 뒤 같은 Webhook secret을 입력합니다. Repository permissions는 **Metadata: Read-only**(GitHub 기본 필수), **Issues: Read-only**, **Pull requests: Read-only**만 부여하고 Subscribe to events에서 **Issues**와 **Pull request**를 선택합니다. 앱은 필요한 저장소에만 설치하세요. 설치 시 전송되는 `ping`은 저장 없이 연결 확인 응답을 받습니다.

현재 서버는 서명된 `issues`와 `pull_request` 이벤트를 받아 Quest로 저장하는 역할만 합니다. GitHub App JWT 발급, installation access token 발급, 외부 앱 등록·설치는 이 저장소에서 자동화하지 않습니다.

## 검증

```sh
pnpm typecheck
pnpm test
pnpm format:check
pnpm build
```

자동 테스트: 기본 이동/입력 중단·복귀/IME·단축키 방어, 이동 속도/충돌/영역, 프로필/패킷 검증, 두 클라이언트 접속·이동·상태·채팅·퇴장, 퀘스트 순서/저장 데이터 검증, 지도/스프라이트 호환성, PostgreSQL RLS/권한. DB 테스트는 개발 전용 PGlite에 최소 Supabase 스키마를 구성하고 실제 마이그레이션을 그대로 실행합니다. 호스팅 Supabase 서비스 검증을 대체하지는 않습니다. 브라우저 검증 결과는 `docs/verification.md`에 기록했습니다.

실서비스 완료 확인: 서로 다른 PC의 초대된 GitHub 계정 A/B로 접속하여 다른 팀/캐릭터를 선택하고, 서로 보이는지/이동하는지/상태 변경이 반영되는지/로그아웃 후 사라지는지 확인합니다. 이어 초대되지 않은 계정으로 팀/프로필/채널 접근이 거부되는지 확인합니다. 실제 OAuth 및 호스팅 Realtime 검증에는 사용자 계정과 Supabase 설정이 필요합니다.

## 운영 및 접근 제어

- GitHub 로그인 권한은 기본 프로필만 요청합니다. 저장소 접근 권한은 요청하지 않습니다.
- GitHub 식별자는 사용자가 바꿀 수 있는 프로필 메타데이터가 아니라 `auth.identities`의 GitHub identity에서 DB 트리거가 가져옵니다.
- 클라이언트에는 초대 명단 변경 권한이 없습니다. 프로필도 본인의 닉네임·캐릭터·팀·상태 필드만 수정할 수 있습니다.
- 팀과 프로필의 월드가 일치하도록 복합 외래 키로 강제합니다. 소속 길드는 같은 월드 안에서 자유롭게 선택합니다.
- 위치는 메모리/Realtime에만 존재합니다. Presence는 입장·상태 변경·방 이동 및 5초 스냅샷에 사용하고 프레임별 DB 쓰기는 없습니다.
- Realtime은 초대된 구성원 사이의 협업용입니다. 메시지의 표시 이름/좌표는 클라이언트가 제공하므로 서버 판정, 성과 측정, 보안 감사 근거로 사용하지 않습니다. 입력 검증과 존재하는 세션 확인을 적용합니다.
- 멤버 권한 철회는 DB 데이터 접근에는 즉시 적용되지만 이미 열린 Realtime 채널의 권한은 접속 시 계산됩니다. 즉시 철회가 필요한 운영에서는 해당 사용자의 세션/연결 종료도 수행해야 합니다.
- 유휴/집중 상태는 사용자가 직접 설정합니다. 연결 끊김을 업무의 ‘자리 비움’으로 추정하지 않습니다.

## 배포 준비

이 저장소는 루트에 Next.js 앱이 있습니다. Vercel에서 저장소를 연결하고 Root Directory는 기본값(`.`)으로 유지합니다. Next.js 프리셋, `pnpm install`, `pnpm build`를 사용하고 위의 세 공개 환경 변수를 넣은 뒤 OAuth 리디렉션 주소를 실제 도메인과 맞춥니다. Vercel 게시와 외부 계정/비밀값 설정은 별도로 진행해야 합니다.

공식 참고: [Next.js 설치](https://nextjs.org/docs/app/getting-started/installation), [Supabase GitHub 로그인](https://supabase.com/docs/guides/auth/social-login/auth-github), [Realtime 접근 제어](https://supabase.com/docs/guides/realtime/authorization), [Phaser](https://docs.phaser.io/).
