# 기술 문서 (Technical Documentation)

> `README.md`가 "무엇을 만들었는지"를 소개한다면, 이 문서는 "어떻게 동작하는지"를 설명합니다.
> 코드를 처음 보는 사람이 구조와 구현 의도를 빠르게 파악할 수 있도록 작성했습니다.

## 1. 개요

- **목적**: 외부 프레임워크(React/Vue) 없이 순수 HTML/CSS/JS로 반응형 자기소개 페이지를 구현
- **배경**: Codyssey `B1-1` 미션 — "나를 소개하는 웹페이지 처음부터 만들기"
- **핵심 제약**: 라이브러리 의존 없이 DOM API, Fetch API, CSS만으로 SPA에 가까운 인터랙션(테마 전환, 동적 렌더링, 폼 검증)을 구현하는 것이 과제의 핵심

## 2. 아키텍처

파일 3개(`index.html` / `style.css` / `main.js`)로 구성된 정적 사이트이며, 별도의 빌드 도구 없이 브라우저가 바로 해석합니다.

```
index.html  ──▶ DOM 구조 + 시맨틱 마크업 (섹션별 id로 JS/CSS가 참조)
style.css   ──▶ CSS 변수 기반 디자인 토큰 + 미디어 쿼리 반응형
main.js     ──▶ DOM 이벤트 바인딩, 상태 → 렌더링 갱신, GitHub API 호출
```

프레임워크가 없으므로 "상태 관리"는 React의 `useState`처럼 명시적이지 않지만,
각 기능은 **상태값(변수/속성) → 그 값을 읽어 DOM을 갱신하는 함수** 패턴을 일관되게 따릅니다.
`main.js`는 이 패턴 단위로 6개 섹션(Config / Theme / Hamburger / Scroll effects / Scroll animation / Projects / Contact form)으로 나뉘어 있고, 섹션 간 의존성이 없어 개별적으로 읽고 수정할 수 있습니다.

## 3. 핵심 기능 구현 상세

### 3.1 다크 모드 — `localStorage` + CSS 변수 스위칭

- **상태**: `document.documentElement`의 `data-theme` 속성 (`'light'` | `'dark'`)
- **렌더링**: `[data-theme='dark']` 셀렉터가 `:root`의 CSS 변수를 재정의 → 모든 색상이 변수 참조라 전체 UI가 자동으로 갱신됨 (색상별 개별 토글 불필요)
- **영속성**: 변경 시 `localStorage.setItem('theme', theme)`. 최초 진입 시 저장된 값이 없으면 `window.matchMedia('(prefers-color-scheme: dark)')`로 OS 설정을 감지 ([main.js:22-26](js/main.js#L22-L26))

```js
const getInitialTheme = () => {
  const saved = localStorage.getItem('theme');
  if (saved === 'light' || saved === 'dark') return saved;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};
```

이 구조의 장점: 새 컴포넌트를 추가해도 `var(--color-*)`만 쓰면 다크모드 대응이 자동으로 따라옵니다.

### 3.2 반응형 내비게이션 — 모바일 햄버거 메뉴

- 768px 미만에서는 CSS로 `.hamburger`를 보이게 하고 `.nav__menu`를 `max-height: 0`으로 숨김
- 클릭 시 JS는 `active` 클래스만 토글하고, 실제 열고 닫는 애니메이션은 CSS `transition: max-height`가 담당 (JS와 애니메이션 로직 분리)
- 접근성: `aria-expanded` 속성을 열림/닫힘 상태에 맞춰 갱신 ([main.js:44-52](js/main.js#L44-L52))
- 메뉴 항목 클릭 시 `closeMenu()` 호출 후 `scrollIntoView({ behavior: 'smooth' })`로 이동 — 네이티브 앵커 점프 대신 부드러운 스크롤 사용

### 3.3 스크롤 인터랙션

| 기능 | 트리거 | 구현 |
|---|---|---|
| 헤더 배경 전환 | `scrollY > 60px` | `header.classList.toggle('scrolled', ...)` |
| 맨 위로 버튼 노출 | `scrollY > 300px` | `scrollTopBtn.classList.toggle('show', ...)` |
| 섹션 fade-in | 뷰포트 진입 20% | `IntersectionObserver` |

`scroll` 이벤트 핸들러 2개를 리스너 하나로 묶어 처리하고([main.js:73-76](js/main.js#L73-L76)), 스크롤 애니메이션은 `scroll` 이벤트 대신 `IntersectionObserver`를 사용해 스크롤 시마다 레이아웃을 강제로 계산(reflow)하지 않도록 했습니다. 한 번 `in-view` 클래스가 붙으면 `unobserve()`로 관찰을 해제해 불필요한 콜백을 방지합니다.

### 3.4 GitHub API 연동 — 비동기 상태 머신

Projects 섹션은 4가지 상태(`loading` / `error` / `empty` / `success`)를 명시적으로 관리합니다.

```
loadProjects()
  → setProjectsState('loading')      // 스피너 표시
  → fetch(GitHub REST API)
      성공 & 데이터 있음 → 'success'  (카드 렌더링)
      성공 & 빈 배열     → 'empty'
      실패(4xx/네트워크) → 'error'    (재시도 버튼 노출)
```

`setProjectsState`는 4개 상태 엘리먼트를 모두 숨긴 뒤 해당 상태만 노출하는 방식이라, 상태 전환 시 "이전 상태 지우는 걸 깜빡하는" 버그가 구조적으로 발생하지 않습니다 ([main.js:113-121](js/main.js#L113-L121)).

- Fork한 레포는 `filter((repo) => !repo.fork)`로 제외해 본인 프로젝트만 노출
- 카드 렌더링은 `createProjectCard`가 구조분해 할당(`{ name, description, html_url, ... }`)으로 필요한 필드만 추출해 템플릿 리터럴로 조립
- 에러 상태의 "다시 시도" 버튼은 `loadProjects`를 그대로 재호출 — 별도 재시도 로직 불필요

**알려진 제약**: 비인증 GitHub REST API는 시간당 60회 요청 제한이 있어, 배포 직후 트래픽이 몰리면 403(rate limit)으로 `error` 상태가 뜰 수 있습니다. 현재는 UI로만 대응하며 별도 캐싱/재시도 지연은 없습니다.

### 3.5 Contact 폼 유효성 검사

- `novalidate` 속성으로 브라우저 기본 검증을 끄고 커스텀 검증만 사용 (에러 메시지 스타일/위치를 직접 제어하기 위함)
- 필드별로 `<p role="alert">` 에러 요소를 두어 스크린리더가 에러 발생을 즉시 안내하도록 구성
- 검증 규칙: 이름/메시지는 공백 제거 후 빈 값 체크, 이메일은 정규식(`/^[^\s@]+@[^\s@]+\.[^\s@]+$/`)으로 형식 검증
- UX 디테일: 에러가 이미 표시된 필드는 입력할 때마다 재검증해 실시간으로 에러가 사라지도록 처리 ([main.js:229-235](js/main.js#L229-L235)) — 단, 에러가 없는 상태에서는 매 입력마다 검증하지 않아 불필요한 연산을 줄임
- 실제 전송 로직(백엔드/이메일 서비스)은 없음 — 제출 성공 시 폼을 리셋하고 성공 메시지만 표시하는 프론트엔드 검증 데모

### 3.6 보너스 — 프로젝트 언어 필터링

- `loadProjects` 성공 시 fork 아닌 레포 전체를 `allRepos`에 저장하고, `activeLanguage`(기본 `'all'`) 상태를 둡니다.
- `renderProjectFilters`가 `repos.map((r) => r.language).filter(Boolean)`로 등장한 언어를 `Set`으로 중복 제거해 버튼을 동적으로 생성합니다.
- 버튼 클릭 시 `activeLanguage`만 바꾸고 `renderFilteredProjects`가 `allRepos.filter((repo) => repo.language === activeLanguage)`로 다시 그립니다 — **API 재호출 없이** 이미 가져온 데이터를 클라이언트에서 필터링합니다.

### 3.7 보너스 — Hero 타이핑 효과

`typeText(el, text, speed)`가 `el.textContent`를 비운 뒤 `setTimeout` 재귀 호출로 한 글자씩 채웁니다. 타이핑 중에는 `typing` 클래스를 붙여 CSS `::after`로 깜빡이는 커서를 표시하고, 완료되면 클래스를 제거합니다 (`requestAnimationFrame`/`setInterval` 대신 `setTimeout` 재귀를 쓴 이유: 각 글자마다 지연 시간을 개별 제어하기 쉽고, 완료 시점을 콜백 없이 자연스럽게 알 수 있기 때문).

### 3.8 보너스 — 폼 실제 전송 (Formspree)

기존 "성공 메시지만 표시" 로직을 `fetch(CONTACT_FORM_ENDPOINT, { method: 'POST', body: new FormData(form) })` 기반 비동기 전송으로 교체했습니다.

- 전송 중에는 버튼을 `disabled` 처리하고 텍스트를 "전송 중..."으로 변경해 중복 제출을 방지
- `response.ok`가 아니면 에러를 throw해 `catch`에서 `#form-submit-error`를 노출
- `finally`에서 버튼 상태를 항상 원복 — 성공/실패 어느 경로든 버튼이 멈춰있지 않도록 보장
- **설정 필요**: `CONTACT_FORM_ENDPOINT`(및 `<form action>`)는 placeholder(`YOUR_FORM_ID`)이므로, [Formspree](https://formspree.io)에서 발급받은 실제 엔드포인트로 교체해야 정상 전송됩니다. 교체 전에는 fetch가 실패해 에러 상태 UI가 뜨는 것이 정상 동작입니다(try/catch 검증 완료).

### 3.9 보너스 — 시스템 다크 모드 감지

3.1의 `getInitialTheme()`이 `localStorage`에 저장된 값이 없을 때 `window.matchMedia('(prefers-color-scheme: dark)').matches`로 OS 설정을 읽어 초기 테마를 결정합니다. 별도 구현 없이 3.1 다크모드 로직에 이미 포함되어 있습니다.

## 4. CSS 설계

- **디자인 토큰화**: 색상·간격·그림자·전환시간을 모두 `:root` CSS 변수로 정의 → 다크모드는 변수 재정의만으로 전체 테마 전환
- **레이아웃**: 내비게이션은 Flexbox(1차원 정렬), Skills/Projects 카드 그리드는 `grid-template-columns: repeat(auto-fit, minmax(260px, 1fr))`로 컬럼 수를 뷰포트 너비에 따라 자동 조정 (미디어 쿼리로 컬럼 수를 직접 지정하지 않음)
- **브레이크포인트**: 768px(모바일↔태블릿), 1024px(데스크톱 타이포 확대) — 모바일 퍼스트가 아닌 "기본 스타일 + `max-width: 767px`로 모바일 오버라이드" 방식

## 5. 접근성(A11y)

- 시맨틱 태그(`header`/`nav`/`main`/`section`/`article`/`footer`) 사용
- 아이콘 전용 버튼(햄버거, 테마 토글, 스크롤 탑)에 `aria-label` 부여
- 폼 에러 메시지에 `role="alert"`, 성공 메시지에 `role="status"` — 스크린리더에 상태 변화 전달
- 햄버거 메뉴에 `aria-expanded`/`aria-controls` 연결

## 6. 로컬 개발 & 배포

- 별도 빌드 단계 없음 — VS Code Live Server 등으로 `index.html`을 바로 열면 됨
- 배포는 정적 파일 그대로 GitHub Pages에 push

## 7. 향후 개선 아이디어

- GitHub API 응답을 `sessionStorage`에 잠깐 캐싱해 새로고침 시 rate limit 리스크 완화
- 모바일 스크린샷 추가 (README에 TODO로 명시되어 있음)
- 폼 제출을 실제 서비스(예: Formspree, EmailJS)와 연동
