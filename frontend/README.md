# Better Memoire web

Next.js frontend for Better Memoire, a photo book customization and ordering studio.
This codebase covers the **landing page** and the full **authentication experience**:
password sign in, registration, email OTP verification, Google sign in, token refresh and
logout. It sits next to the ASP.NET Core backend in `../backend`.

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 App Router, React 19, Server Components |
| Styling | Tailwind CSS 4 with CSS tokens |
| Motion | Motion (`motion/react`), reduced-motion aware |
| Forms | React Hook Form + Zod |
| Icons | Phosphor Icons |
| Fonts | Cormorant SC (display), Grape Nuts (chalk), Alegreya Sans (body) — Vietnamese subsets |
| i18n | Vietnamese (default) and English via a cookie-backed dictionary |

## Run it

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Open `http://localhost:3000`.

```env
BACKEND_URL=http://localhost:5222
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/callback/google
```

`BACKEND_URL` is the ASP.NET Core origin from `backend/Presentation/Properties/launchSettings.json`.
The browser never calls it directly. Google values are server-only; the secret must never be
prefixed with `NEXT_PUBLIC_`.

Useful commands:

```bash
pnpm typecheck
pnpm lint
pnpm build
pnpm start
```

## API wiring

| Browser call | Server handler | Upstream |
|---|---|---|
| `POST /api/auth/login` | `app/api/auth/login/route.ts` | `POST /api/v1/user/login` |
| `POST /api/auth/register` | `app/api/auth/register/route.ts` | `POST /api/v1/user/register` |
| `POST /api/auth/send-otp` | `app/api/auth/send-otp/route.ts` | `POST /api/v1/user/send-otp` |
| `POST /api/auth/verify-otp` | `app/api/auth/verify-otp/route.ts` | `POST /api/v1/user/verify-otp` |
| `GET /api/auth/google/start` | `app/api/auth/google/start/route.ts` | redirects to Google OAuth |
| `GET /api/auth/callback/google` | `app/api/auth/callback/google/route.ts` | exchanges code, calls `POST /api/v1/user/google` |
| `POST /api/auth/google` | `app/api/auth/google/route.ts` | optional direct ID-token exchange |
| `POST /api/auth/refresh` | `app/api/auth/refresh/route.ts` | `POST /api/v1/user/refresh` |
| `POST /api/auth/logout` | `app/api/auth/logout/route.ts` | `POST /api/v1/user/logout` |
| `GET /api/auth/me` | `app/api/auth/me/route.ts` | reads the session cookie |
| `* /api/proxy/api/v1/...` | `app/api/proxy/[...path]/route.ts` | forwards with `Authorization: Bearer` |

All route handlers forward the current locale as `Accept-Language`, so backend error and
validation messages come back in Vietnamese or English.

### Auth behavior

- Registration creates an **unverified** account and sends a 6-digit code. The UI moves to
  an OTP step; `verify-otp` activates the account and sets session cookies.
- Login stores `accessToken` and `refreshToken` in **httpOnly, sameSite=lax** cookies
  (`bm_access`, `bm_refresh`). The browser JavaScript never sees the tokens.
- `bm_signed_in` and `bm_access_exp` are non-sensitive client hints used by
  `SessionRefresher` to rotate the refresh token before the access token expires.
- Logout revokes refresh tokens in the backend first, then clears local cookies.
- Mutating route handlers reject cross-origin `Origin` headers.
- The Google button appears on the **Sign in** tab and starts an OAuth 2.0
  authorization-code flow with PKCE. The start route stores state and verifier cookies,
  Google redirects to `/api/auth/callback/google`, the callback exchanges the code
  server-side using `GOOGLE_CLIENT_SECRET`, and the resulting ID token is validated by the
  backend against `Google:ClientId`.
- The redirect URI must be registered exactly in Google Cloud Console:
  `http://localhost:3000/api/auth/callback/google` for local development.
- The client secret stays server-side. Only the start and callback route handlers read it.

### i18n

- Vietnamese is the default. The switch in the header sets `bm_locale=vi|en` and refreshes
  the server components.
- Copy lives in `lib/i18n/dictionaries.ts`; validation messages are built from the same
  dictionary so field errors and counters follow the active locale.
- Backend messages are resource-based: `backend/Domain/Resources/Message.vi.resx` and
  `Message.en.resx`. `Accept-Language` selects the culture (vi default, en supported).
- Image alt text, metadata, tab labels, password controls and OTP copy are localized.

### Known gaps

- Only landing and auth routes are implemented. Library, studio, checkout and admin routes
  from `docs/FRONTEND.md` are not part of this slice.
- Google OAuth is configured with a real web client. A completed Google account login has
  not been verified in this workspace; the start route, PKCE cookies, consent redirect and
  callback error paths are verified. See `docs/GOOGLE_SIGNIN_TEST.md`.
- Spanish is not in the dictionary yet, even though the old API reference mentions it.

## Design system

The interface is a chalkboard: one slate board, chalk lettering, a single yellow
accent, and photographs taped on like prints. There is no light theme — the board
is the brand.

| Token | Value | Use |
|---|---|---|
| Board | `#2b2f36` | page |
| Board deep | `#1f2328` | header, footer, recesses |
| Panel | `#23272d` | cards, CTA panel |
| Chalk | `#f3f0e6` | headlines, strong text |
| Body | `#d8d6cd` | running text |
| Muted | `#9a9da3` | captions, labels |
| Yellow | `#e9c84a` | the one accent: actions, marks, emphasis |
| Coral | `#e58b80` | hand-drawn underlines, errors |
| Paper | `#ece5d5` | polaroid matte |

Type: **Cormorant SC** for the wordmark and section headings, **Grape Nuts** for the
hand-written headlines, captions and tabs, **Alegreya Sans** for running text, forms
and buttons. All three are self-hosted through `next/font` with Vietnamese subsets.

Shape rules: photographs are physical prints (cream matte, two strips of tape, a
tilt); buttons are chalk shapes with uneven corners; fields are ruled lines, not
boxes; separators are dashed. The board is a fixed SVG noise layer with a fine grain
overlay on top. All motion collapses under `prefers-reduced-motion`.

## Structure

```text
app/                 routes, layout, API handlers
components/landing/  hero, materials, book rail, process, quote, final CTA
components/auth/     auth panel, login/register/OTP forms, session refresher
components/i18n/     locale switcher
components/site/     header and footer
components/ui/       brand, button, input primitives
lib/api/             server backend client and browser result helpers
lib/auth/            cookies, JWT display decoding, session, request guards
lib/i18n/            locale config, dictionaries, server locale helper
lib/validation/      Zod schema factories mirroring FluentValidation
public/images/       optimized WebP photography
scripts/             Playwright visual and auth flow checks
```

## Photography

Placeholder photography is local and optimized to WebP:

- Pexels: [32805946](https://www.pexels.com/photo/32805946/),
  [32091508](https://www.pexels.com/photo/32091508/),
  [3585012](https://www.pexels.com/photo/3585012/),
  [4554377](https://www.pexels.com/photo/4554377/),
  [26673758](https://www.pexels.com/photo/26673758/)
- Unsplash: images served from
  `images.unsplash.com/photo-1524995997946-a1c2e315a42f` and
  `images.unsplash.com/photo-1519682337058-a94d519337bc`

Both licenses allow free use. Replace these with brand photography before launch.

## Visual and auth checks (optional)

With the backend on `:5222`, this app on `:3001`, and a mock mailbox:

```bash
# terminal 1: local Resend replacement, port 5333
node scripts/mock-resend.mjs

# terminal 2: backend with email pointed at the mock
Resend__ApiKey=test Resend__BaseUrl=http://localhost:5333 \
  dotnet run --project ../backend/Presentation/Presentation.csproj --urls http://localhost:5222

# terminal 3
pnpm build
pnpm start -- -p 3001
node scripts/visual-check.mjs
node scripts/frontend-auth-test.mjs
```

`frontend-auth-test.mjs` registers a unique account, reads the OTP from the mock mailbox,
verifies the account, exercises refresh and logout, and checks both locales. Set
`EDGE_PATH` to another Chromium binary if needed. Screenshots go to `../.screens`.
