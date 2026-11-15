# Better Memoire backend

ASP.NET Core 10 API with Clean Architecture, MediatR CQRS, EF Core/PostgreSQL and Redis.
The authentication slice is complete: seven endpoints, email OTP, JWT access/refresh
rotation, Google ID-token exchange and Vietnamese/English messages.

## Authentication API

Base route: `/api/v1/user`

| Method | Route | Body | Response |
|---|---|---|---|
| POST | `/login` | `{ email, password }` | `{ accessToken, refreshToken }` |
| POST | `/register` | `{ email, fullName, password, phoneNumber, avatarUrl }` | user + `otpRequired` |
| POST | `/send-otp` | `{ email }` | generic message |
| POST | `/verify-otp` | `{ email, otp, password?, fullName?, phoneNumber? }` | `{ accessToken, refreshToken }` |
| POST | `/google` | `{ idToken }` | `{ accessToken, refreshToken }` |
| POST | `/refresh` | `{ refreshToken }` | rotated `{ accessToken, refreshToken }` |
| POST | `/logout` | Bearer access token | message |

- `register` creates an unverified account and sends a 6-digit code. It does not return tokens.
- `verify-otp` activates the account, records the login and issues the token pair.
- `refresh` is single-use: the old refresh token is revoked. Replaying a rotated or unknown
  token revokes all refresh tokens for that user.
- `logout` requires a valid access token and revokes every refresh token for the user.
- Auth routes use endpoint rate limits (`auth`: 10/15 min, `otp`: 5/15 min per IP).

## Configuration

`appsettings.json` carries empty placeholders. Put real values in User Secrets or environment
variables:

| Key | Purpose |
|---|---|
| `PostgresConfig:*` | PostgreSQL connection |
| `Redis:ConnectionString` | Redis for OTP attempts and idempotency |
| `JwtSettings:Key` / `RefreshKey` | access / refresh signing keys |
| `Auth:ExpiryMinutes` | OTP TTL (default 15) |
| `Auth:MaxAttempts` | OTP attempts before invalidation (default 5) |
| `Resend:ApiKey` / `From` / `BaseUrl` | transactional email |
| `Google:ClientId` | Google ID-token audience, must match the frontend OAuth client |

The local test setup uses Memurai (Redis) plus a mock Resend endpoint. Google login is a real
OAuth 2.0 authorization-code flow handled by the Next.js server; the backend only receives
the resulting ID token and validates its Google signature, issuer, expiry and audience.
See `docs/testing/GOOGLE_SIGNIN_TEST.md`.

## Localization and error codes

- Error codes live in `Domain/Errors/ErrorCode.cs` and are stable API strings such as
  `AUTH_INVALID_CREDENTIALS`, `AUTH_OTP_TOO_MANY_ATTEMPTS` and `ORDER_INVALID_TRANSITION`.
- `Domain/Errors/ErrorCodeCatalog.cs` maps each code to a resx key.
- `Domain/Resources/Message.vi.resx` and `Message.en.resx` own the localized copy.
- Every ProblemDetails response carries the code under `extensions.code`; the message is
  resolved from the request culture.
- Domain rules throw `DomainRuleException(code)`, application use cases throw typed
  `BadRequestException` / `UnauthorizedException` / `ForbiddenException` / `ConflictException`
  / `TooManyRequestsException` / `UnprocessableEntityException` / `TransientFailureException`,
  all carrying a code.

`Accept-Language` selects the culture. Vietnamese is the default; English is supported.
The resx files are embedded as satellite assemblies and `IStringLocalizer<Message>` is used in
middleware, handlers, validators, email and external service adapters.

## Run

```bash
dotnet build backend/Presentation/Presentation.csproj
dotnet run --project backend/Presentation/Presentation.csproj --urls http://localhost:5222
```

Program startup applies pending EF Core migrations. PostgreSQL and Redis must be reachable.

For local OTP testing without Resend, point `Resend:BaseUrl` at a mock mailbox and set
`Resend:ApiKey` to any value; the integration script extracts the code from the captured email.

## Tests

The seven endpoints were exercised end to end against a local PostgreSQL/Redis stack:

- register → pre-verification login rejected (403)
- OTP verify → tokens; login → tokens
- refresh → rotated tokens; replay → 401
- logout → 200; refresh after logout → 401; anonymous logout → 401
- send-otp → verify-otp without register
- invalid Google token → 401 localized
- duplicate register → 409 localized
- invalid payload → 400 localized in vi and en
