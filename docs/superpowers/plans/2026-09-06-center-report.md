# Task 1 — 가상 교육센터 구현 보고서

2026-09-06. 기존 체크아웃에서 구현했으며 커밋·푸시·브랜치 생성·의존성 추가·저장 데이터 마이그레이션은 하지 않았다.

## 변경 내용

- 1600×1120 센터: 5개 유리벽 랩/프로젝트 룸, 개방된 중앙 동선, 모니터·키보드 책상, 강의 화면, 라운지 소파/테이블, 안내 데스크/커피머신/리플릿, 화분, 창문과 게시판. `center-model.ts`의 모든 solid footprint를 `center-art.ts`가 그리며 동일 목록을 `obstaclesFor`가 사용한다. 창문/게시판/강의 화면은 벽 장식, 로비 카펫은 통과 가능한 바닥 장식이다.
- 초기 진입 및 홈 이동: 리셉션 로비 (800,900). 안내원 루미 (720,900), 웰컴 키트 (960,750). 기존 팀 이동 ID/스폰 계약과 `main-square` ID를 보존했다.
- 12명 멘토 NPC. 제공된 명단 순서로 디렉터리에 표시한다. 김관영은 3개 주제, 김주생은 2개 주제, 양혁재는 `담당 주제 확인 중`이다. 4개 기존 IT 아바타에 프레임·색상·배지/태블릿/헤드셋 조합을 적용했다. 온라인 플레이어 목록/접속 수와 멘토 데이터는 분리했다.
- 장소 창에서 멘토 앞까지 이동하고, 반경 65 이내에서 E 또는 상호작용 버튼으로 안내를 연다. 동일 거리에서는 명단의 첫 레코드가 선택된다. 안내원/키트가 멘토보다 우선한다. 지도에 이름과 NPC 표식, 16px 이상 라벨을 제공한다.
- 모달은 native dialog와 기존 입력 잠금 흐름을 사용한다. 학습 주제·키워드·중립적 요약·임시 준비 체크리스트, 실제 발언/실시간 상담이 아니라는 고지를 포함한다. 디렉터리 클릭 자체는 상담을 열지 않는다.
- 마을/시장/분수 중심의 표시 문구를 센터/랩/로비/키트 문구로 변경했다. 채팅 draft 및 단축키 구현을 보존했고, 채팅 제목만 라운지로 변경했다. 기존 모자 보상을 보존하고 IT 캐릭터 머리 위치에 맞춰 올렸다.
- adventure storage key와 version 1, `garden`/`market`/`pond` ID, 진행 순서, 보상/장비 상태를 유지한다.

## TDD 및 검증 증거

프로젝트 AGENTS.md, 설치된 Next `use-client` 문서, TDD skill 및 writing-good-tests reference를 읽었다. 첫 focused test는 구현 전 작성했고 missing feature를 assert하여 실패했다.

실행: `node node_modules/tsx/dist/cli.mjs --test tests/center.test.ts`

최초 RED (exit 1):

```text
✖ center geometry and curriculum mentors are available
  AssertionError [ERR_ASSERTION]: shared indoor geometry is missing
✔ saved village progression still completes in the center with the same IDs
tests 2 / pass 1 / fail 1 / duration_ms 581.8051
```

모델 구현 직후 GREEN (렌더러 작성 전, exit 0):

```text
✔ center geometry and curriculum mentors are available (69.2521ms)
✔ saved village progression still completes in the center with the same IDs (3.0385ms)
tests 2 / pass 2 / fail 0 / duration_ms 653.5484
```

최종 focused GREEN (exit 0):

```text
✔ center geometry and curriculum mentors are available (35.2292ms)
✔ saved village progression still completes in the center with the same IDs (0.7735ms)
tests 2 / pass 2 / fail 0 / duration_ms 430.835
```

첫 테스트는 각 solid 중앙의 충돌, 5개 문 통과, 로비에서 10px 격자 flood-fill로 모든 팀 스폰/12명 멘토 접근 지점/안내원/키트/3개 안내존 도달, 65 반경 밖 멘토 선택 금지, 같은 거리의 안정적인 선택을 검증한다. 두 번째는 실제 v1 저장 fixture의 복원 후 보상/장비 완료를 검증한다.

최종 전체 실행: `pnpm test` (exit 0): **35 tests / 35 pass / 0 fail / duration_ms 2182.7893**. 기존 adventure, chat, database 정책, transport/demo peers, IT avatar, movement/IME/shortcut, legacy asset 및 world tests 모두 통과했다.

최종 타입 검사: `pnpm typecheck` → `$ tsc --noEmit`, **exit 0**, 진단 없음.

변경 소스와 테스트에 설치된 Prettier를 직접 실행했다. 컨트롤러 소유 CSS/avatar 파일은 수정하지 않았다.

## 출처와 제한

- 교육센터는 공개 판교 주소에서 영감을 받은 가상 공간이다. 실제 도면을 검증한 것이 아니며 공식 BoB 서비스가 아니다. 사용자 커리큘럼 스크린샷의 이름/주제를 사용했고 사진에서 신원이나 경력을 추론하지 않았다. 요약과 체크리스트는 해당 주제를 위한 게임 설명이다.
- 실내 아트는 이번 변경에서 작성한 원본 절차적 픽셀 도형이다. IT atlas는 이 작업 전 승인된 생성 이미지 자산을 그대로 재사용했다. 기존 CC0 마을 자산은 디스크에 보존되지만 센터 장면에서 로드하지 않는다.
- 체크리스트는 해당 모달을 닫으면 초기화됨을 표시한다. 센터 탐방 보상은 기존과 같이 로컬 브라우저 저장이다.
- 이 구현 작업자는 실제 호스팅/외부 다중 사용자 연결 검증이나 production build를 수행하지 않았다. 컨트롤러가 브라우저, 빌드 및 통합 검증을 담당한다. 컨트롤러의 중간 브라우저 확인에서는 G → 김관영 이동 → E 모달, 3개 커리큘럼과 고지 표시가 확인되었다.

## 파일 소유 범위

신규 `src/game/center-model.ts`, `center-art.ts`, `mentors.ts`, `src/components/mentor-dialog.tsx`, `tests/center.test.ts`. 기존 world-model/art/details/create-world, adventure-model/panel, world-shell 변경. 컨트롤러 요청에 따라 `world-chat.tsx`는 제목 1줄만 변경했다.

## 최종 리뷰 P2 수정 — 추가 팀의 안전한 도착

독립 리뷰가 추가 20번째 팀의 도착 (774.2108717741263, 989.6150317607573)이 리셉션과 겹치고, 29번째 팀도 벽과 겹치는 문제를 발견했다. `safeArrival`를 추가하여 team spawn과 scene travel이 같은 충돌 검사를 사용하게 했다. 기존 5개 팀의 좌표와 모든 room ID는 보존한다. 목표가 막혀 있으면 최대 120px 범위를 10px 간격으로 제한 검색하고, 범위를 벗어난 잘못된 좌표는 검증된 로비로 보낸다. 프로토콜 변경은 없다.

회귀 테스트를 먼저 작성한 RED (exit 1):

```text
✖ additional teams cannot arrive inside reception or glass walls
AssertionError: team 20 arrival 774.2108717741263,989.6150317607573 is blocked
✖ unusable arrival coordinates fall back to the walkable lobby
actual y: 1000080 / expected y: 900
tests 4 / pass 2 / fail 2 / duration_ms 432.9419
```

수정 후 focused GREEN (exit 0): `tests 4 / pass 4 / fail 0 / duration_ms 549.604`.

20·29번째 팀을 우선 검사한 뒤 6~200번째 팀의 실제 도착점이 서 있을 수 있는지 검사한다. NaN/Infinity/백만 단위 좌표의 로비 fallback, 기존 5개 좌표와 room ID도 검사한다. 기존 테스트의 파일 존재 assertion은 제거했고 실제 동작 검사만 남겼다.

수정 후 최종 `pnpm test`: **37 tests / 37 pass / 0 fail / duration_ms 2334.4429**, exit 0. `pnpm typecheck`: `$ tsc --noEmit`, exit 0. 변경 3개 소스/테스트 파일 Prettier 완료. 컨트롤러의 마지막 재검토 대상으로 전달했다.
