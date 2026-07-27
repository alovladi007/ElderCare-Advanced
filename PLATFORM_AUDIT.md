# ElderCare-Advanced — Platform Audit

**Audited:** July 2026 · commit `99d85c0` · branch `claude/smart-home-safety-module-01CXS3M2Cx4dCY7njKY3NdFp`
**Method:** clean-clone rebuild, static analysis, and live exploitation against a running instance. Every finding marked **[verified]** was reproduced against the running server, not inferred from reading code.

---

## 1. Executive summary

ElderCare-Advanced is a healthcare platform that stores protected health information (PHI): vitals, medications, diagnoses, blood type, medical history, home layouts, and location. It is presented across 39 root-level markdown files as complete and production-ready.

It is not. The accurate description is:

> **A genuinely good ~8,000-line smart-home safety and care-management backend, wrapped in ~13,000 lines of non-functional demo scaffolding, with no authorization layer, a login flow that does not work, and PHI served to anonymous users.**

Four facts define the current state:

1. **The platform is not deployable.** `npm run build` fails with **287 TypeScript errors**; `npm ci` from a clean clone could not install because six imported packages were undeclared (fixed in this audit); the test suite fails **11 of 11 suites**; CI has been red and ignored.
2. **The security posture is not defensible under HIPAA.** Anonymous users can read PHI files, control the smoke alarm, inject fake emergencies, and register themselves as `ADMIN`. There is no object-level authorization anywhere and no PHI access audit trail.
3. **The frontend has never been run end-to-end against its own backend.** Login does not persist a token, the entire care-management data layer calls endpoints that return 404, the registration form throws on the first keystroke, and the payment screen collects raw card numbers before faking a successful charge.
4. **Roughly half the backend is unreachable.** 14 of 28 modules — including every module named for ML, computer vision, robotics, blockchain, telemedicine, and *zero-trust security* — are never imported by `app.module.ts`. They do not compile and expose no routes.

A note on the gap between the code and the 39 status documents: this is not ordinary documentation drift. `IMPLEMENTATION_REVIEW.md:7` states *"There are NO mock implementations, NO fake data, NO placeholders."* On the same day's code, five dashboards call `loadMockData()`. Documentation that asserts the opposite of the code is the artifact a buyer, auditor, or clinical partner reads first, and it is itself a risk.

The core smart-home engine is real, well-structured work and should be the foundation of everything that follows. The advanced modules should be deleted or rebuilt, not shipped.

### Severity counts

| Severity | Count | Examples |
|---|---|---|
| **Critical** | 14 | Anonymous PHI access · privilege escalation · unauthenticated siren control · faked credit-card charges · broken login · care data layer 404s |
| **High** | 17 | 287 compile errors · no authorization model · no audit trail · absent accessibility · 7-day unrevocable tokens |
| **Medium** | 14 | Schema duplication · missing FK indexes · no DTOs · inert validation pipe |
| **Low** | 8 | Port drift · doc/reality contradictions · bcrypt cost · CSP gaps |

### Remediation status

Work completed since the audit was written is marked **[FIXED]** against each
finding below. Summary:

| Finding | Status |
|---|---|
| C2 — anyone can register as ADMIN | **Fixed** — `RegisterDto` with role allowlist and password policy |
| C9 — login never persists a token | **Fixed** — client reads `access_token` |
| C12 — care-management data layer 404s | **Fixed** — client repointed to `/care-management/*` |
| C13 — login/register throw on interaction | **Fixed** — `useAuth` returns `error`/`isLoading`/`clearError` |
| H1 — 287 compile errors | **Fixed** — 0 errors; `npm run build` produces `dist/` |
| H2 — 14 unreachable modules | **Fixed** — deleted (~12,900 LOC) |
| H3 — simulated "AI" features | **Fixed by deletion** — including `voice-health` |
| H9 — 11/11 test suites failing | **Fixed** — 121 unit tests pass; CI gates now real |
| F4 — ESLint rule gutted | **Fixed** — default rule set restored |
| C1, C3–C8, C10, C11, C14, H4–H8, H10–H12 | **Open** — see the plan |

Two live bugs were found while writing the tests and fixed: an SpO2 reading of
100% raised a CRITICAL alert, and every vitals request without a `?days=`
parameter returned 500.

### The five to fix this week

1. **C1** — one line: delete `useStaticAssets`. Stops anonymous PHI download.
2. **C10** — stop collecting raw card numbers. This is active PCI-DSS exposure *and* customers are being told payments succeeded that never happened.
3. **C3/C4** — add `@UseGuards` to five controllers and gate the simulator on `NODE_ENV`. Stops anonymous control of the smoke alarm and fabricated emergencies.
4. **C2** — a `RegisterDto` with a role allowlist. Stops anyone minting an ADMIN.
5. **C9/C13** — three small frontend fixes make login work at all.

---

## 2. Running the platform

The app now boots from a clean clone. Ports were moved to a block verified free of collisions (`9400`/`9401`/`9402`).

| Service | URL | Status |
|---|---|---|
| Web app | `http://localhost:9400` | ✅ compiles, warnings only |
| REST API | `http://localhost:9401` | ✅ builds clean, 121 unit tests pass |
| API docs (Swagger) | `http://localhost:9401/api/docs` | ✅ (unauthenticated — see C8) |
| WebSocket | `ws://localhost:9402` | ✅ |

```bash
sudo service postgresql start
cd backend && npm install && npx prisma migrate deploy && npm run seed && npm run dev
cd client  && npm install && npm start
```

**Seeded accounts** (`backend/prisma/seed.ts`): `admin@eldercare.com / admin123`, `family@eldercare.com / family123`, `caregiver@eldercare.com / caregiver123`, `elder@eldercare.com / elder123`.

> **Note:** the seeded passwords predate the password policy added when C2 was
> closed. They are created directly through Prisma, so they still work for
> login; new self-service registrations must meet the 12-character policy.

### What this audit had to fix just to make it run

| Problem | Detail |
|---|---|
| 6 undeclared dependencies | `sharp`, `@sentry/node`, `socket.io`, `stripe`, `@nestjs/websockets`, `@nestjs/platform-socket.io` were imported by wired modules but absent from `package.json`. Backend crashed on boot. |
| Broken seed script | `prisma/seed.ts` was out of sync with the schema (`ElderProfile.firstName` required; `medications` became a relation). Seeding failed outright, so no demo data existed. |
| Port drift | Hardcoded fallbacks pointed at three different stale ports (`7501`, `8080`, `3001`) across five files. |
| `start-dev.sh` polled a nonexistent endpoint | Waited on `/api/health`; the real route is `/api/gateway/health`. The readiness loop could only ever time out. |

---

## 3. Critical findings

### C1 — Anonymous users can read PHI documents **[verified]**
`backend/src/main.ts:56` mounts the entire upload tree as public static assets:

```ts
app.useStaticAssets(path.join(__dirname, '..', 'uploads'), { prefix: '/uploads/' });
```

`storage.service.ts:49` creates `uploads/medical-records/` inside that same tree. Every uploaded medical record is therefore world-readable, bypassing the guarded `/api/storage/file/...` route entirely.

**Reproduced:**
```
$ curl http://localhost:9401/uploads/medical-records/phi-test-record.txt
PATIENT: Robert Williams, Dx: Diabetes Type 2      # HTTP 200, no token
```

This is a reportable breach class under HIPAA §164.402 if real records are ever uploaded. Filenames rely on 64 bits from `crypto.randomBytes(8)` — security by obscurity, and the URL is handed to the client, so it lands in logs, referrer headers, and browser history.

**Fix:** delete the `useStaticAssets` line. Serve PHI only through an authenticated, authorization-checked handler.

### C2 — Anyone can register themselves as ADMIN, with a one-character password **[verified] [FIXED]**
`auth.controller.ts:16` types `@Body()` as an inline TypeScript literal rather than a DTO class. NestJS's `ValidationPipe` skips validation when the metatype is a plain object, so `whitelist`/`forbidNonWhitelisted` never execute. `auth.service.ts:93` then passes the role straight through: `role: data.role as any`.

**Reproduced:**
```
$ curl -X POST .../api/auth/register -d '{"email":"attacker@evil.com","password":"x","role":"ADMIN", ...}'
{"id":"38de62b0-...","role":"ADMIN","isActive":true}     # HTTP 201
```

Two failures compound: arbitrary role self-assignment, and no password policy whatsoever (`x` was accepted).

**Fix:** a `RegisterDto` with `@IsEmail`, `@IsStrongPassword`, and `@IsIn(['FAMILY','ELDER'])`. Provision privileged roles only through an authenticated admin flow.

### C3 — Unauthenticated control of physical safety devices **[verified]**
`smart-home/controllers/device.controller.ts:6` carries no `@UseGuards` at class or route level.

**Reproduced** — an anonymous request queued a command to a device explicitly flagged `isCritical: true`:
```
POST /api/devices/actuators/{id}/command      # no Authorization header
→ HTTP 201  {"commandName":"SET_STATE","status":"PENDING",
             "actuator":{"actuatorType":"SIREN","name":"Kitchen Smoke Alarm Siren"}}
```

The same absence of guards covers `home.controller.ts` (9 routes), `automation.controller.ts` (6), and `emergency.controller.ts` (6) — the last of which exposes `POST /emergency/cancel/:instanceId`, letting an anonymous caller **silence an in-progress emergency response**.

### C4 — The emergency simulator ships unguarded in production **[verified]**
`smart-home/controllers/simulator.controller.ts` is registered in the production module (`smart-home.module.ts:20-28`) with no guard and no `NODE_ENV` gate.

**Reproduced:** `POST /api/sim/smart-home/fall/{homeId}` with no token → HTTP 201, creating a `severity: CRITICAL`, `valueText: FALL_DETECTED` sensor event that drives the alerting and escalation engines. Ten such endpoints exist (fall, smoke, gas leak, panic, …). Anyone on the network can fabricate a medical emergency, or bury a real one in noise.

### C5 — IoT ingestion accepts any token, by design
`smart-home/controllers/iot.controller.ts:37`:
```ts
// In a real system, validate the token against IotToken table
// For now, we'll accept any token for demo purposes
```
The only check is that the header is non-empty. An `IotToken` model with a hashed token column exists in the schema (`schema.prisma:600`) and is never queried.

A contributing cause worth noting: `IotToken.token` is declared `@unique` on a **bcrypt** hash (`seed.ts:635`). bcrypt is salted, so equal tokens hash differently — the constraint does nothing and lookup-by-token is impossible. The stub is downstream of a schema mistake. Store a deterministic HMAC-SHA256 as the lookup key.

### C6 — No object-level authorization anywhere in the PHI surface
15 of 21 controllers never reference the authenticated user. `req.user` / `@Request()` appears **zero times** in `elder-profile`, `health-monitoring`, `medication`, `appointment`, `care-plan`, `emergency-monitoring`, `storage`, `bookings`, `ai-companion`, and all seven smart-home controllers.

Every `:elderId` path parameter is trusted implicitly. Any authenticated account — including one self-registered seconds earlier — can read any elder's vitals, medications, medical history, and emergency reports, and can `PUT /care-management/emergency/monitoring/config/:elderId` to **disable another elder's vital-sign alarm thresholds**.

**Root cause (S6):** the schema has *no model linking a FAMILY or CAREGIVER user to an ElderProfile*. The authorization guard cannot be written because the data model cannot express "who is allowed to see this elder." This must be fixed first.

### C7 — Path traversal allows arbitrary file read and delete
`storage.controller.ts:149` joins a raw URL parameter into a filesystem path with no `basename()` or containment check:
```ts
const filePath = path.join('uploads', category, filename);
```
Express URL-decodes `%2F` into route params, so `GET /api/storage/file/avatars/..%2F..%2F..%2Fetc%2Fpasswd` reads arbitrary files, and the identical defect at `:191` makes `DELETE` arbitrary-file-deletion. Any valid JWT of any role suffices.

### C8 — Mass assignment straight into Prisma
`elder-profile.service.ts:333`:
```ts
async updateElderProfile(elderId: string, data: any) {
  return this.prisma.elderProfile.update({ where: { id: elderId }, data, ... });
}
```
The unfiltered request body reaches the ORM. A caller can rewrite `medicalRecordNo`, `dateOfBirth`, `status`, or `userId` — re-parenting an elder profile onto their own account, which then grants them everything else legitimately. 40 handlers share the `@Body() body: any` pattern.

### C9 — The web app's login does not work **[verified] [FIXED]**
`client/src/services/auth.service.js:17` guards token storage on the wrong field:
```js
const response = await api.post('/auth/login', credentials);
if (response.token) {                      // ← always undefined
  localStorage.setItem('auth_token', response.token);
}
```
The API returns `access_token`, not `token`:
```
$ curl -X POST .../api/auth/login -d '{...}' | jq 'keys'
["access_token", "user"]
```
So the condition never fires, no token is persisted, and every subsequent request goes out unauthenticated. `LoginPage` → `useAuth` → `authService.login` is the app's primary login path.

This is masked in testing precisely because so many endpoints (C3–C6) require no authentication — the app appears to work while completely unauthenticated.

Compounding it, four competing API clients disagree about where the token lives: `shared/auth/auth.service.ts:38` writes `eldercare_token` while `services/api.js:17` reads `auth_token`.

### C10 — The payment form collects raw card numbers and fakes the charge **[verified]**
`components/booking/PaymentCheckout.jsx:12-17` holds `cardNumber`, `cardName`, `expiryDate`, and `cvv` in ordinary React state, collected through plain `<Input>` fields. `client/package.json` contains **no `@stripe/stripe-js` and no `@stripe/react-stripe-js`** — Stripe Elements is not installed.

Then `:80-88`:
```js
// Simulate Stripe payment processing
// In production, use Stripe Elements or Stripe.js here
await new Promise((resolve) => setTimeout(resolve, 2000));
setSuccess(true);
```

Two critical failures:
1. **PCI-DSS.** Raw PAN and CVV entering first-party JavaScript puts this application in full SAQ-D scope. Any one of the 33 high-severity dependency advisories (C14) becomes a card-harvesting vector.
2. **The customer is told a lie.** The success screen renders *"Payment Successful — Your booking has been confirmed — A confirmation email has been sent"* on a `setTimeout`, unconditionally. No charge is made and no email is sent, while `:224` reassures the user *"Your payment information is encrypted and secure."*

`STRIPE_INTEGRATION_GUIDE.md:214` documents this flow as *"Using Stripe Elements (Recommended for Production)."*

### C11 — No route protection, and three dashboards deliberately bypass auth
Repo-wide across `client/src`: **0** matches for `ProtectedRoute`, `PrivateRoute`, or `RequireAuth`, and **0** call sites for `isAuthenticated`/`hasRole` outside their own definitions. All 49 routes in `App.js` — `/admin`, `/dashboard`, `/care-management/:elderId`, `/emergency-monitoring/:elderId` — render unconditionally.

Worse, the bypasses are deliberate and in-code:

```js
// pages/UnifiedDashboard.jsx:40-47
// import { useAuth } from '../shared/hooks/useAuth';        ← commented out
const user = { role: 'ADMIN', name: 'Demo User', ... };      ← hardcoded ADMIN
```
`loadDashboard()` then branches on `user.role` and calls the admin-only "list every elder" endpoint for any anonymous visitor.

```js
// pages/MonitoringDashboard.jsx:37-50
const loginResponse = await axios.post(`${API_URL}/auth/login`, {
  email: 'doctor@evergreen.com', password: 'password123'
});
```
Hardcoded clinician credentials, auto-submitted on mount: visiting `/#/monitoring/dashboard` mints a real clinician session against patient vitals with no user action. `:70` then sets `axios.defaults.headers.common['Authorization']` — a **global** mutation, attaching that bearer token to every subsequent Axios request to any host.

`EmployeeLoginPage.jsx:13-28` accepts any email/password with no backend call; `EmployeeDashboard.jsx:31-33` has its own auth check commented out.

### C12 — The entire care-management data layer 404s **[verified] [FIXED]**
All 23 methods in `services/care.service.js` call `/care/*`. The backend serves `/care-management/*`:

```
client:  '/care/medications'  '/care/appointments'  '/care/care-plans'  '/care/health-monitoring'
backend: 'care-management/medications'  'care-management/appointments'  'care-management/care-plans'  'care-management/health'

$ curl .../api/care/medications  →  HTTP 404
```

Six further mismatches exist in `shared/api/api.client.js` (`/health/vitals/:id` vs `/health/vitals/elder/:id`; `PATCH /care-tasks/:id` vs `PUT /care-plans/tasks/:id`). Consequence: `MedicationSchedule`, `AppointmentCalendar`, `VitalSignsCharts`, `CareTaskList`, and `CareOverview` cannot load a single record. Smart-home and auth routes *do* match, so the breakage is not uniform — which is why it went unnoticed.

### C13 — Login and Register throw on first interaction **[verified] [FIXED]**
`hooks/useAuth.js:50-57` returns exactly `{ user, loading, isAuthenticated, login, register, logout }`. But:

```js
// pages/LoginPage.jsx:10
const { login, error, isLoading, clearError } = useAuth();   // 3 of these don't exist
// :25 inside handleSubmit
clearError();                                                 // TypeError
```

`RegisterPage.jsx:59` calls `clearError()` from `handleChange`, so **typing a single character into any registration field throws**. `error` and `isLoading` are permanently `undefined`, so the error `<Alert>` never renders and the submit button's loading state never fires. There is no error boundary, so the user sees a dead button.

Together with C9, the authentication UI is non-functional in three independent ways.

### C14 — 60 npm vulnerabilities in the client, 2 critical / 33 high
Including runtime, not just build-time: `axios` (authentication bypass via prototype pollution; SSRF via NO_PROXY) — the HTTP client for every API call; `react-router-dom` (XSS via open redirects); `ws` (uninitialized memory disclosure); `websocket-driver` and `shell-quote` (critical). `react-scripts@5.0.1` (April 2022) is itself flagged and CRA is formally deprecated, so most are unfixable without migrating off CRA.

---

## 4. High-severity findings

### H1 — The backend does not compile: 287 errors **[verified] [FIXED]**
`npx tsc --noEmit` → 287 errors, so `npm run build` cannot produce `dist/` and `npm start` cannot run. Development works only because `ts-node-dev --transpile-only` skips type checking.

| Module | Errors | Wired? |
|---|---|---|
| `mobile-api` | 85 | ❌ |
| `robotics` | 45 | ❌ |
| `edge-computing` | 23 | ❌ |
| `telemedicine` | 20 | ❌ |
| **`smart-home`** | **16** | **✅** |
| **`care-management`** | **16** | **✅** |
| `computer-vision` | 15 | ❌ |
| `iot-devices` | 14 | ❌ |
| `blockchain` | 14 | ❌ |

32 errors are in **wired, production** modules. The root cause is schema drift: **25 Prisma models are referenced in code but do not exist in `schema.prisma`** (`prisma.elder`, `prisma.vitalSigns`, `prisma.iotDevice`, `prisma.mlPrediction`, …). In live code paths, `emergency-alert.service.ts:65` calls `this.prisma.elder` — the model is `ElderProfile`.

`BACKEND_COMPILATION_FIXES.md` states *"0 errors – clean compilation."* That claim is false as of this commit.

### H2 — Half the backend is unreachable dead code **[FIXED]**
`app.module.ts` imports 15 modules. **14 modules — 12,901 of ~25,650 LOC (50.3%) — are referenced nowhere.** Their class names appear only in their own `*.module.ts` files.

Unreachable: `ml-prediction`, `computer-vision`, `advanced-nlu`, `voice-health`, `iot-devices`, `edge-computing`, `robotics`, `event-streaming`, `telemedicine`, `mobile-api`, `blockchain`, `data-analytics`, `zero-trust-security`, `ai-companion`. Only one has a controller, so even if wired, 13 of 14 would expose no HTTP surface at all.

**This includes every security control that would make the platform HIPAA-viable** — `zero-trust-security` holds the only AES-256/RSA-4096 implementation and the only code that writes an access log. Shipping dormant modules named "zero-trust" and "encryption" is worse than having none: it creates a false compliance narrative for anyone reading the repo.

### H3 — "Advanced AI" features are simulations, and one of them generates clinical alerts **[FIXED by deletion]**
The headline capabilities do not do what their names claim.

| Module | Reality | Evidence |
|---|---|---|
| `voice-health` | **23 × `Math.random()`** produce the acoustic features driving health risk scores | `voice-health.service.ts:333-391` |
| `robotics` | `simulateCommandExecution()` returns a canned `"Yes, I am okay. Thank you for checking."` | `robotics.service.ts:999,1035` |
| `edge-computing` | Every inference path resolves to `simulateEdgeInference()` — a `setTimeout` | `edge-computing.service.ts:429,465` |
| `iot-devices` | All four discovery protocols return hardcoded arrays with fake MACs for real products | `iot-device.service.ts:225-378` |
| `computer-vision` | No CV library exists; it reads motion sensors | `computer-vision.service.ts:281` |
| `blockchain` | "Transaction hashes" are SHA-256 digests written with `status:'confirmed'` | `blockchain.service.ts:859,878` |
| `data-analytics` | Trend charts are `Math.random() * 100` | `data-analytics.service.ts:573` |

**The most serious:** `voice-health` feeds its invented numbers into `assessRisks()` → `createHealthAlert()` (`:186`). Were this module ever wired in, it would raise clinical alerts about Parkinson's, stroke, and depression indicators from a random number generator. It must be deleted or rebuilt — never enabled as-is.

`blockchain.service.ts:878` returns the same fake hash from its `catch` block, so a caller can never distinguish an anchored record from an unanchored one — an audit trail that cannot fail is not an audit trail.

Three modules contain genuinely reusable work and are the cheapest to salvage: `advanced-nlu` (real HuggingFace calls with rule-based fallback), `event-streaming` (competent Kafka producer/consumer), and `telemedicine` (real Twilio/Agora token minting).

### H4 — No PHI access audit trail
`DataAccessLog` (`schema.prisma:1508`) is a well-designed HIPAA audit model. **It is written zero times.** `AccessLog`, `AuthAttempt`, `EncryptionKey`, and `PlatformMetric` are likewise never written by live code.

HIPAA §164.312(b) requires recording and examining ePHI activity. There is currently no record of who read which patient's data, making §164.308(a)(1)(ii)(D) review and breach forensics impossible.

### H5 — RBAC is structurally broken
`RolesGuard` is registered as a global `APP_GUARD` (`app.module.ts:58`) **and** applied per-route. NestJS runs global guards *before* route guards, so `RolesGuard` executes before `JwtAuthGuard` populates `req.user`. At `roles.guard.ts:20`, `user` is `undefined` → `TypeError` → HTTP 500 instead of 401/403. Worse, `:17` returns `true` whenever no `@Roles()` metadata is present — so the global guard **fails open** for every undecorated route. No test covers any `@Roles` path.

### H6 — 7-day unrevocable tokens in `localStorage`, no MFA
`auth.module.ts:14` hardcodes `expiresIn: '7d'`, ignoring the `JWT_EXPIRES_IN` env var the `.env.example` advertises. There is no refresh token, no blacklist, no `logout`, no `jti`. `jwt.strategy.ts:15` never touches the database, so deactivating a user or changing their password does not invalidate live tokens. The frontend stores tokens in `localStorage`, so any XSS yields a 7-day credential to PHI. HIPAA §164.312(a)(2)(iii) requires automatic logoff; a 7-day bearer token does not satisfy it. No MFA exists outside the dead `zero-trust` module (§164.312(d)).

### H7 — Hardcoded JWT fallback secret
`auth.module.ts:13` and `jwt.strategy.ts:11`:
```ts
process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production'
```
The same literal is the `docker-compose.yml` default and is published in `.env.example`. If `JWT_SECRET` is unset the app boots silently and every token is forgeable by anyone who has read this public repo.

*Positive:* no real `.env` was ever committed — `git log --all --name-only` shows only `.env.example`, and `.gitignore` covers `.env*`.

### H8 — Zero input validation across the entire HTTP surface
`main.ts:61` configures `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })`, and `class-validator` is a declared dependency — but **`backend/src` contains no DTO class and no `class-validator` decorator**. Every `@Body()` is `any` or an inline literal, both of which the pipe skips. The configuration provides zero protection while creating the appearance of validation, and is the direct enabler of C2 and C8.

### H9 — The entire test suite fails **[verified] [FIXED]**
`npx jest` → **11 of 11 suites fail, 7 of 7 tests fail.** Nine fail at DI wiring. `jest.config.js:29` asserts a 60% coverage threshold that has never been met. **The client has 0 test files** across 48 pages and 36 components. There are no tests for `auth`, `bookings`, `elder-profile`, or any of the 14 advanced modules.

CI compounds this: `.github/workflows/ci.yml` runs lint, integration tests, and `npm audit` with `|| true`, so they can never fail the build. `npm test` and `npm run build` are *not* suppressed — meaning CI is red on every push and is being ignored.

### H10 — Stripe webhooks are silently non-functional
`payment.controller.ts:161` reads `req.rawBody`, but `main.ts:13` creates the app without `{ rawBody: true }`. `rawBody` is always `undefined`, so `stripe.webhooks.constructEvent` throws on every call. Signature verification is implemented correctly; the plumbing is missing. Payment state will silently desync. One-line fix.

### H11 — Seven parallel application trees
The repository contains seven app directories, six with their own `package.json`:

| Directory | Files | LOC |
|---|---|---|
| `backend/` | 314 | 66,865 |
| `client/` | 105 | 19,457 |
| `platform/` | 112 | 10,979 |
| `monitoring-backend/` | 24 | 5,321 |
| `smart-home-platform/` | 59 | 2,982 |
| `server/` | 17 | 2,210 |
| `frontend/` | 10 | 992 |

`platform/backend/src` even has the `dto/` folders the deployed backend lacks — easy to mistake for coverage that does not exist. Three of these define their own JWT verification with a *different* secret. Only `backend/` and `client/` are live.

### H12 — Documentation contradicts the code
39 root-level markdown files, many asserting completion. Spot-checked:

| Claim | Reality |
|---|---|
| `BACKEND_COMPILATION_FIXES.md`: *"0 errors – clean compilation"* | 287 errors **[verified]** |
| `BACKEND_COMPILATION_FIXES.md`: *"180 API endpoints across 11 modules"* | 152 routes mapped **[verified]** |
| `FINAL_VERIFICATION.md`: *"All Issues Resolved / READY TO START"* | Would not boot from a clean clone |
| `SCALING_IMPLEMENTATION_GUIDE.md`: 13 advanced subsystems delivered | All 13 unwired; none compiles |

For a healthcare product, documentation that overstates completeness is itself a risk: it is the artifact a buyer, auditor, or clinical partner reads first.

---

## 5. Data model

**`schema.prisma`:** 1,649 lines · 63 models · 34 enums · 55 `Json` fields · 21 indexes · 0 soft-delete columns. Migration state is healthy — one squashed init migration, no drift.

| # | Problem | Impact |
|---|---|---|
| **S1** | **No `CareRelationship` model** — nothing links a FAMILY/CAREGIVER user to an elder | **Root cause of C6.** Authorization is unimplementable until this exists |
| **S2** | 16 orphan models with no relations at all (`Robot`, `EdgeGateway`, `DataAccessLog`, `EncryptionKey`, …) | 25% of the schema unreachable by traversal |
| **S3** | Dangling FKs — 12 scalar `*Id` columns with no `@relation` | No referential integrity; deleting an elder orphans consultations, keys, audit rows |
| **S4** | **40 of 63 models lack FK indexes** | Postgres does not auto-index FKs. `getUnifiedProfile` fans out across ~12 of them → full scans |
| **S5** | 53 `onDelete: Cascade` rules on clinical records | Deleting a `User` destroys their entire clinical history — violates §164.312(c)(1) and 6-year retention |
| **S6** | 9 relations with no `onDelete` rule → defaults to `Restrict` | Deleting a user who ever issued a command **fails at runtime**, blocking right-to-erasure |
| **S7** | Zero soft-delete/provenance columns (`deletedAt`, `createdBy`) | No tamper-evidence; `DELETE /health/vitals/:id` is irreversible |
| **S8** | PHI in unqueryable `Json` blobs (`medicalConditions`, `allergies`, `surgeries`) | Cannot query "all elders allergic to penicillin"; no ICD-10/RxNorm coding; duplicated across two models |
| **S9** | Duplicate models: `MedicationDose` vs `MedicationLog` | Two sources of truth for **medication adherence** — a safety-critical metric |
| **S10** | Duplicate models: `SensorEvent` vs `SensorReading`; `AccessLog` vs `DataAccessLog` | Parallel telemetry pipelines; split audit trails |
| **S11** | ~30 string fields shadow existing enums; `RoleAssignment.role String` vs the `UserRole` enum | A second authorization vocabulary `RolesGuard` never consults |
| **S12** | `ElderProfile` is a 30-relation god-model that also duplicates `User.firstName/lastName` | Guaranteed divergence between two copies of a patient's legal name |

---

## 6. Frontend

48 pages · 36 components · 49 routes · **0 tests** · 0 protected routes.

Beyond C9–C14 above:

### F1 — Accessibility is absent, for a product whose users are elderly and cognitively impaired
**This is the finding to escalate first.** Unlike the others it is not one sprint of work, and it is a product-viability and ADA/§508 issue, not polish.

Across all **84 JSX files**:

| Measure | Count |
|---|---|
| `aria-*` attributes | **2** |
| `role=` attributes | **2** |
| `tabIndex` / `sr-only` / `aria-live` / `onKeyDown` | **0 / 0 / 0 / 0** |
| Font-size classes below 16px (`text-sm`, `text-xs`) | **395** |
| Font-size classes at 16px (`text-base`) | **4** |
| `text-gray-400` (#9CA3AF) on translucent panels | **162** |
| Files importing `framer-motion` | **41** |
| `prefers-reduced-motion` handling | **0** |

- **Type is 12–14px throughout.** Senior-UX guidance calls for a 16–18px floor, 18–24px preferred. There is no text-resize control, no high-contrast mode, no preference persistence.
- **Contrast fails.** The design is dark glassmorphism — 179 uses of `bg-white/10`, 118 of `backdrop-blur` — over *animated* gradients. `text-gray-400` at 14px on a translucent panel is ~3–4:1, below the 4.5:1 AA floor, and the background is in motion so contrast is not even constant. Clinical values (vitals, medication names, appointment times) are rendered in `text-gray-300`/`text-gray-400`.
- **Form errors are invisible to screen readers.** `forms/Input.jsx:64` renders the error with no `aria-describedby` and no `aria-invalid`.
- **The modal has no focus trap and no `role="dialog"`** (`feedback/Modal.jsx`); keyboard users tab into the page behind it.
- **Default button height is ~38px, `sm` is ~30px** (`ui/Button.jsx:30`) — below the 44×44 target every mobile HIG requires for users with tremor or arthritis.
- **Continuous background animation** (`index.css:29-69`: 20s float, 15s holographic, 10s grid loops) is a documented vestibular and cognitive-load trigger.

`FRONTEND_COMPONENT_LIBRARY.md` — the 13.8 KB component-library spec — mentions accessibility **zero** times, while `IMPLEMENTATION_COMPLETE.md:497` lists "Accessible components" as delivered.

### F2 — Fabricated data presented as live product
| Page | Evidence |
|---|---|
| `AdminDashboard.jsx:5-16` | `totalClients: 247, monthlyRevenue: 125000, satisfactionRate: 98` + three fake bookings. Zero network calls. Routed publicly. |
| `UnifiedDashboard.jsx:68-120` | `loadMockData()` seeds messages, documents, care plans, care team, **health trends** (`'Blood Pressure', current: '125/75'`), billing |
| `EmployeeDashboard.jsx:23-33` | `const mockEmployee = {...}`, real auth check commented out |
| `ContactPage.jsx:10-16` | `setTimeout(1500)` → `console.log` → *"Message sent successfully!"*. **No HTTP request exists** — a caregiver enquiry goes to the console |
| `SmartHomeHub.jsx:12` | `const [homeId] = useState('home-123');` |

### F3 — Broken plumbing
- **Route params never arrive.** `App.js:88` routes `/elder-profile/:elderId`, but `ElderProfilePage.jsx:11` reads `elderId` as a *prop*, not `useParams()` → `GET /api/elder-profile/undefined`. Same for `CareManagementDashboard`. (`EmergencyMonitoringPage.jsx:6` does it correctly, so the pattern was known.)
- **Five service methods called but never defined** — `getAlerts`, `markAlertAsRead`, `markAllAlertsAsRead`, `deleteAlert`, `testScenario`. The last is the "Test Emergency Scenario" button on a life-safety screen; it is an immediate `TypeError`.
- **Vite syntax in a CRA app.** `AlertCenter.jsx:27` uses `import.meta.env.VITE_WS_URL`, which is `undefined` under webpack. The surrounding `try/catch` swallows the throw, so **real-time critical alerts silently never connect** — the worst possible failure mode.
- **770 lines of documented flagship features are orphaned** — `VoiceControl.jsx` (382) and `AICompanionChat.jsx` (388) are imported by nothing, yet have 37 KB of guides describing them as shipped.
- **Post-401 redirects go nowhere.** `services/api.js:41` does `window.location.href = '/login'`, but the app uses `HashRouter`; on GitHub Pages that is a 404, not the login screen.

### F4 — Build and deployment
- **The deployed GitHub Pages artifact is ~7 months stale.** `static/` is committed at the repo root; last touched `2025-10-05`, while `client/src/App.js` was last changed `2026-05-17`. The live site still carries the old brand. **A 1.7 MB source map is committed alongside it**, publishing full readable source.
- **The service worker is broken and dangerous.** `index.js:15` registers it unconditionally (CRA ships this commented out for good reason). `service-worker.js:2-9` pre-caches unhashed filenames (`main.js`) that CRA never emits, so `cache.addAll()` rejects and the worker never activates. If it ever did, `:23-51` is **cache-first for every request with no `/api` exclusion** — serving stale vitals and stale medication schedules to a caregiver is a patient-safety defect, not a caching bug.
- **ESLint was deliberately weakened.** Commit `c9e2a72` overrode `no-restricted-globals` with a 2-item list, dropping ~48 protections repo-wide, to avoid writing `window.` before 9 `confirm()` calls. Those `confirm()` dialogs are themselves the wrong control here — unstyled, non-resizable, non-translatable — and one of them gates **cancelling an active emergency scenario**. A `Modal` component already exists and is unused for these. There is also no `lint` script, so CI's `npm run lint || true` runs nothing.
- **23 near-identical marketing pages** (~3,900 lines) differ only in string literals; they should be one data-driven component.
- **No state management, no shared cache, no request cancellation.** Every component does its own `useState` + `useEffect`, so dashboards refetch the same elder independently.
- **The `.ts` files never run.** There is no `typescript` dependency and no `client/tsconfig.json`; CRA resolves `.js` first. `api.client.ts` (234 lines) and `auth.service.ts` (237 lines) are dead — including `hasRole()`, the only role-checking function in the codebase.

### F5 — CI is decorative
`.github/workflows/ci.yml` is the only workflow, and it cannot represent reality:
- `npm run lint || true` (twice) invokes a script that does not exist.
- `npm run test:integration || true` (`:146`) invokes a script that does not exist — the job provisions Postgres, runs zero tests, and reports green.
- `npm audit ... || true` (twice) can never fail.
- `frontend-test` uploads `client/dist`; CRA emits to `client/build`. It passes `VITE_*` env vars to an app that reads only `REACT_APP_*`, and never runs the client's tests.
- Playwright specs in `tests/e2e/` are never invoked by any workflow.
- The 60% coverage threshold is never enforced because nothing runs `--coverage`.

`npm test` and `npm run build` are *not* suppressed — so CI is red on every push and is being ignored.

---

## 7. What is actually good

This is worth stating plainly, because it is the foundation to build on:

- **`smart-home/` core** (~4,100 LOC) — `automation-engine`, `event-processor`, `device`, and `home` services are genuine, non-simulated rule and event logic against a real schema. **Verified working end-to-end:** the fall simulator produced a `CRITICAL` sensor event that surfaced correctly in home status with 7 devices tracked. This is the strongest work in the repository.
- **`care-management/`** (~3,600 LOC) — real medication, care-plan, appointment, and vitals logic. Blocked by 16 schema-drift errors and missing authorization, not by design flaws.
- **`auth/`** — sound bcrypt + JWT + Passport structure. `validateUser` returns `null` uniformly for unknown-user and bad-password; passwords are stripped from every response; forgot-password is non-enumerating. It needs hardening, not replacement.
- **`common/`** — Winston logging, SendGrid email with a clean dev fallback, sharp-based storage, Prisma. Solid infrastructure.
- **Prisma everywhere** — no raw SQL anywhere in the codebase, so **SQL injection risk is low**.
- **`notifications.controller.ts:21-40`** — correctly scopes every query to `req.user.userId`. This is the one controller that models the right pattern; it should be the template for the authorization work.

---

## 8. Remediation sequence

**Days — stop the bleeding.** Delete the `useStaticAssets` line (C1, one line). Add `@UseGuards` to five smart-home controllers and `NODE_ENV`-gate the simulator (C3, C4). Add a `RegisterDto` with a role allowlist (C2). Fix `response.token` → `access_token` (C9, one line). Remove both JWT fallbacks and fail fast (H7). `path.basename` + containment in storage (C7).

**Weeks — restore authorization.** Add `CareRelationship` (S1) → write `ElderAccessGuard` and apply it to every PHI route (C6) → fix guard ordering and add RBAC tests (H5) → DTOs across all 40 handlers (H8, C8).

**Months — compliance and correctness.** `PhiAccessInterceptor` → append-only `DataAccessLog` (H4). Short-lived + refresh tokens with revocation (H6). MFA for ADMIN/CLINICIAN. TLS enforcement and encryption at rest. Soft-delete and retention (S7). Real IoT token validation (C5). Fix the 32 compile errors in wired modules, then decide per dead module: delete or rebuild (H2).

**Parallel — debt.** FK indexes (S4 — cheapest performance win in the repo). Cascade rules (S5, S6). Deduplicate models (S9, S10). Convert strings to enums (S11). Normalize PHI JSON (S8). Consolidate the seven app trees (H11). Delete the 39 status docs and replace with one accurate README (H12).

The full sequenced plan is in **[`SIX_MONTH_PLAN.md`](./SIX_MONTH_PLAN.md)**.
