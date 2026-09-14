# 나를 소개하는 웹페이지 처음부터 만들기

React, Vue, Tailwind 등 외부 라이브러리 없이 **순수 HTML/CSS/JavaScript**만으로 만든 반응형 자기소개 페이지입니다.
Codyssey `B1-1` 미션 결과물입니다.

- 배포 URL: https://huiwoo-jo.github.io/codyssey-self-intro-webpage/
- GitHub 저장소: https://github.com/huiwoo-jo/codyssey-self-intro-webpage

## 스크린샷

| Desktop (Light) | Desktop (Dark) |
|---|---|
| <img width="1470" height="833" alt="image" src="https://github.com/user-attachments/assets/be3401ec-353f-479a-90e3-3ff9059a56bf" /> | <img width="1470" height="833" alt="image" src="https://github.com/user-attachments/assets/ff2f55f2-3d30-48cf-9cfc-98143086a90d" /> |

> 모바일 스크린샷은 아직 없습니다.

## 사용 기술

- **Markup**: 시맨틱 HTML5 (`header`, `nav`, `main`, `section`, `article`, `footer`)
- **Style**: CSS3 — CSS 변수(`:root`), `[data-theme="dark"]`, Flexbox(내비게이션), Grid(프로젝트 카드, `auto-fit`/`minmax`), 모바일 퍼스트 반응형(768px / 1024px 브레이크포인트)
- **Script**: 바닐라 JavaScript(ES6+) — `const`/`let`, 화살표 함수, 템플릿 리터럴, 구조분해 할당, `map`/`filter`/`forEach`
- **API**: GitHub REST API (`/users/{username}/repos`) — `fetch` + `async/await`
- **폰트/아이콘**: Google Fonts(Pretendard), Font Awesome (외부 라이브러리 금지 예외 항목)
- **배포**: GitHub Pages

## 폴더 구조

```
.
├── index.html
├── css/
│   └── style.css
├── js/
│   └── main.js
└── images/
    └── profile.jpg
```

## 주요 기능

- **반응형 레이아웃**: 모바일/태블릿/데스크톱 대응, 모바일에서는 내비게이션이 숨겨지고 햄버거 메뉴로 전환
- **다크 모드**: 토글 버튼으로 테마 전환, `localStorage`에 저장되어 새로고침 후에도 유지 (시스템 다크 모드 설정도 최초 진입 시 감지)
- **부드러운 스크롤 / 스크롤 탑 버튼**: 내비게이션 클릭 시 해당 섹션으로 스무스 스크롤, 300px 이상 스크롤 시 맨 위로 이동 버튼 노출
- **스크롤 애니메이션**: `IntersectionObserver`(threshold 0.2)로 섹션이 뷰포트에 들어오면 fade-in
- **GitHub API 연동**: 본인 저장소 목록을 fetch로 가져와 Projects 섹션에 카드로 렌더링. 로딩(spinner) · 에러(재시도 버튼) · 빈 상태를 각각 별도 UI로 표현
- **Contact 폼 유효성 검사**: 이름/이메일/메시지 필수 입력 검증, 이메일 형식 검증, 필드 근처에 에러 메시지 표시, 제출 시 성공 메시지 노출

### 상태 → 렌더링 흐름 예시

1. 다크 모드 토글 클릭 → `theme` 상태 변경 → `document.documentElement[data-theme]` 및 전체 색상 변수 갱신
2. GitHub API 호출 → 로딩/성공/에러/빈 상태 변경 → Projects 섹션 UI 전환
3. 폼 입력 → 유효성 상태 변경 → 필드별 에러 메시지 표시/숨김

## 로컬 실행

VS Code의 [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) 확장을 설치한 뒤 `index.html`을 우클릭 → **Open with Live Server**로 실행합니다.

## 기준값 메모

- 스크롤 탑 버튼 노출 기준: `scrollY > 300px`
- 내비게이션 배경 전환 기준: `scrollY > 60px`
- 스크롤 애니메이션 `IntersectionObserver` threshold: `0.2`

## GitHub API 관련 주의사항

비인증 호출은 시간당 60회로 제한됩니다. 레이트 리밋(403) 발생 시 자동으로 에러 상태 UI가 표시되며, "다시 시도" 버튼으로 재요청할 수 있습니다.
