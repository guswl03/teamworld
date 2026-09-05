# TeamWorld

5개 길드가 같은 RPG 월드에서 만나는 웹 협업 공간. Next.js + Phaser 3 + Supabase 기반이며, 마을 탐험과 실시간 채팅이 추가된 v0.2 개발 버전입니다.

## 로컬 실행

Node.js 22 이상, pnpm 11을 사용합니다.

```sh
pnpm install
pnpm dev --hostname 127.0.0.1 --port 3100
```

http://127.0.0.1:3100 에서 **월드 먼저 둘러보기**를 누르면 계정 없이 체험합니다. 같은 브라우저에서 새 탭을 열고 다시 체험에 입장하면 두 캐릭터가 서로 보입니다. 데모는 브라우저 BroadcastChannel만 사용하므로 다른 브라우저/PC와 연결되지 않습니다. 데모 프로필은 탭 세션에만 저장됩니다. 탭을 복제하면 같은 사용자로 복원될 수 있으므로 앱의 **새 탭으로 친구 만들기** 링크를 사용하세요. 온라인 인원은 사용자 ID로 중복 제거하고 캐릭터는 연결 세션별로 표시합니다.

## 구현 범위

- 랜딩, GitHub OAuth PKCE 콜백, 온보딩, 프로필 설정, 로그아웃
- Tiny Swords CC0 구버전 픽셀 아트, Tiled 호환 지형, 중앙 광장과 5개 길드 건물
- 4종 캐릭터의 대기/걷기 애니메이션, 나무·양·마을 소품
- 월드가 화면 전체를 차지하는 작업 공간, 하단 채팅·동료·퀘스트·배낭·길드·설정 메뉴
- 나무 프레임·양피지·숲색으로 통일한 RPG UI와 자체 제작 픽셀 메뉴 아이콘
- 클릭 없이 바로 WASD/방향키 이동, 충돌, 카메라 추적, 확대/축소, 길드 이동
- 월드 위 작업 창에서 채팅/프로필 수정, 창을 닫거나 Esc를 누르면 이동 복귀
- 이름/상태 표시, 전체/우리 길드 동료 목록, 모바일 상태/채팅 화면
- 루미의 탐험 퀘스트, 명소 3곳 발견, 보물상자와 모자 보상/착용
- 월드 전체 채팅: 최대 200자, 1초 전송 간격, 최근 100개 메시지
- Supabase private Presence + 10 Hz Broadcast, 원격 좌표 보간, 연결 오류/재시도
- GitHub ID 초대 명단, 프로필 RLS, 월드별 데이터 및 Realtime 접근 제한

채팅은 접속 중 메모리에만 존재하며 새로고침하면 사라집니다. 탐험 진행과 모자는 월드/프로필별로 이 브라우저에 저장되며 다른 기기나 동료에게 동기화되지 않습니다. NPC와 양은 장식/퀘스트 캐릭터이며 접속 인원에 포함되지 않습니다. GitHub 저장소·업무 Quest 연동, 전투, 음성/영상은 아직 없습니다.

작업 창이나 NPC 대화가 열린 동안에는 캐릭터 이동을 멈춥니다. 창을 바꾸거나 닫아도 채팅 초안과 접속 상태는 유지되며, 월드 안에서 프로필을 저장해도 현재 위치는 바뀌지 않습니다. 모바일에서는 월드 이동 없이 같은 하단 메뉴로 채팅과 프로필 등 작업을 이용합니다.

## 외부 그래픽과 지도 편집

[Pixel Frog의 Tiny Swords](https://pixelfrog-assets.itch.io/tiny-swords) 중 **TS_old version_CC0 Licensed**만 사용합니다. 최신 Free Pack과 Enemy Pack은 재배포 조건이 다르므로 그대로 바꿔 넣지 마세요. 원본 출처, 파일 매핑, 라이선스 및 다운로드 해시는 `public/assets/tiny-swords/PROVENANCE.md`에 기록했습니다. 추가 유료 도구나 프로덕션 의존성은 없습니다.

`public/maps/village.tmj`는 [Tiled](https://www.mapeditor.org/)에서 열 수 있는 실제 런타임 지형 지도입니다. 64px 타일을 게임에서 0.5배로 표시합니다. 같은 폴더 구조를 유지하면 이미지 타일셋이 연결됩니다. 기본 지형을 재생성하려면 `node scripts/generate-village.mjs`를 실행합니다. 이 명령은 수동 지도 편집을 덮어쓰므로 먼저 변경을 보관하세요.

건물/소품 배치는 `src/game/world-art.ts`, 퀘스트 장식은 `src/game/world-details.ts`, 충돌/이동은 `src/game/world-model.ts`에 있습니다. Tiled는 이번 버전에서 **시각 지형만** 편집합니다. 길이나 건물을 옮길 때는 충돌과 퀘스트 좌표도 함께 검토해야 합니다. 게임 실행 중 외부 소재 서버에 접속하지 않습니다.

## 실제 GitHub 로그인과 멀티플레이 연결

1. Supabase 프로젝트를 준비하고 SQL Editor에서 `supabase/migrations/001_teamworld.sql` 전체를 한 번 실행합니다. 새 테이블 및 RLS 정책을 만드는 마이그레이션입니다. 기존 TeamWorld 테이블이 있는 프로젝트에 중복 실행하지 마세요.
2. GitHub의 Developer settings → OAuth Apps에서 OAuth 앱을 준비합니다. Homepage URL은 앱 주소, Authorization callback URL은 `https://<project-ref>.supabase.co/auth/v1/callback`입니다.
3. Supabase Authentication → Providers → GitHub에 Client ID와 Client Secret을 등록합니다. 앱 코드/브라우저에 GitHub Secret을 넣지 않습니다.
4. Supabase Authentication → URL Configuration에서 Site URL을 배포 주소로 설정하고 Redirect URLs에 `http://127.0.0.1:3100/auth/callback`, 배포 주소의 `/auth/callback`을 등록합니다. 개발 시 브라우저 주소와 허용 주소의 호스트/포트가 일치해야 합니다.
5. Supabase Realtime 설정의 **Allow public access**를 끕니다. 앱은 `world:<uuid>` private 채널만 사용합니다. 로그인 세션과 allowlist가 없는 사용자는 입장할 수 없습니다.
6. `.env.example`을 `.env.local`로 복사한 뒤 프로젝트 URL과 브라우저용 publishable/anon 키를 넣습니다. `NEXT_PUBLIC_WORLD_ID`는 기본값을 사용합니다. 환경 변수 변경 후 개발 서버를 다시 시작합니다. 서비스 역할 키는 사용하지 않습니다.
7. 관리자가 GitHub 숫자 ID를 확인하고 다음 SQL로 팀원을 초대합니다. 숫자 ID는 GitHub 사용자 API(`https://api.github.com/users/<username>`)의 `id` 필드입니다. 닉네임/사용자명 문자열을 넣지 않습니다.

```sql
insert into public.world_access(world_id, github_id)
values ('11111111-1111-4111-8111-111111111111', '실제_GitHub_숫자_ID');
```

월드/길드 이름은 관리자가 DB에서 바꿀 수 있습니다. 5개 팀을 초과해 추가해도 DB 구조는 유지되며, 추가 팀은 월드의 원형 보조 위치에 배치됩니다. 6개 이상 팀에 대한 맵 디자인은 별도 조정이 권장됩니다.

## 검증

```sh
pnpm typecheck
pnpm test
pnpm format:check
pnpm build
```

자동 테스트 29개: 기본 이동/입력 중단·복귀/IME·단축키 방어, 이동 속도/충돌/영역, 프로필/패킷 검증, 두 클라이언트 접속·이동·상태·채팅·퇴장, 퀘스트 순서/저장 데이터 검증, 지도/스프라이트 호환성, PostgreSQL RLS/권한. DB 테스트는 개발 전용 PGlite에 최소 Supabase 스키마를 구성하고 실제 마이그레이션을 그대로 실행합니다. 호스팅 Supabase 서비스 검증을 대체하지는 않습니다. 브라우저 검증 결과는 `docs/verification.md`에 기록했습니다.

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
