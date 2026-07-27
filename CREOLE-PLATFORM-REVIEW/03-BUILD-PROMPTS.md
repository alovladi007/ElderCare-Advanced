# CREOLE — AYITI TKDL: Comprehensive Build Prompts

Copy-paste-ready prompts to build the entire platform, phase by phase, with an AI coding agent (Claude Code or similar) or as work orders for developers. Each prompt is self-contained: paste the **Master Context** first (once per session), then the phase prompt.

**How to use**
1. Run one phase per session/PR. Do not batch phases.
2. Paste Master Context + the phase prompt. Let the agent explore the repo before coding.
3. Require the acceptance checklist at the end of each prompt to pass before merging.
4. Phases must land in order 0 → 1 → 2 (2 may parallel 1) → 3 … Skipping the early phases rebuilds the current problem: features on an unenforced foundation.

---

## MASTER CONTEXT (paste first, always)

```
You are working on CREOLE — AYITI Traditional Knowledge Digital Library
(github.com/alovladi007/CREOLE---AYITI-Traditional-Knowledge-Digital-Library).

PURPOSE: Haiti's equivalent of India's TKDL. It must (a) defensively publish Haitian
traditional knowledge (medicinal plants, formulations, cultural practices) in a form
patent examiners can cite to block biopiracy patents; (b) protect sacred and
community-restricted knowledge with strictly enforced graded access; (c) detect
patent applications that misappropriate Haitian TK; (d) manage community consent and
benefit-sharing; (e) serve Haitian communities Kreyòl-first.

STACK: NestJS 10 + TypeORM 0.3 + Postgres 15 (pgvector image) backend in /backend
(port 4000 in-container, 4200 on host); Next.js 14 App Router frontend in /frontend
(3000 in-container, 3101 host); Keycloak 24 OIDC in /keycloak (8090 host); FastAPI
NLP service in /nlp (Whisper, Tesseract, sentence-transformers; 8100 host); MinIO,
Redis, docker-compose; monitoring stack in /monitoring; Expo app in /mobile;
Playwright in /e2e.

CRITICAL GROUND TRUTH (verified by line-level review — trust this over the repo's
own status documents, which are aspirational):
- ALL ~634 backend endpoints are currently ANONYMOUS: the global Keycloak guards are
  commented out in backend/src/app.module.ts (~line 110) behind a TODO, and no
  controller has @UseGuards. @Roles/@Resource decorators exist but are inert.
- access_tier ('public'|'restricted'|'secret') on records is NEVER enforced in any
  query — secret records are served to unauthenticated callers.
- Several features are SIMULATED: blockchain anchoring fabricates tx hashes
  (blockchain-anchor.service.ts), OCR/transcription return hardcoded strings
  (media-processing.service.ts, which isn't even registered in MediaModule), patent
  "alerts" have no patent-office integration, GraphQL updateRecord ignores its input.
- The Python NLP service is REAL (Whisper/Tesseract/embeddings) but the backend
  never calls its /ocr or /transcribe endpoints.
- Frontend: only ~12 of 32 routes work; ~19 api-client paths point at nonexistent
  endpoints (failures silently caught into empty states); the GI and knowledge-graph
  portals render hardcoded mock arrays although real backend endpoints exist; the
  4-locale i18n catalogs (excellent, authentic Kreyòl, 150 keys each) are wired to
  NOTHING — all UI is hardcoded English; there is no auth middleware; the access
  token is returned to client JS by /api/auth/session; token refresh exists but is
  never called; TypeScript strict is off.
- ZERO tests can execute anywhere (no jest deps/scripts in backend or frontend; e2e
  suites target test-ids, routes, and credentials that don't exist). CI masks all
  lint/test steps with `|| true`.
- Migrations never run (no data-source.ts, no scripts; both existing migration files
  are broken — wrong table name 'record' vs 'records'; text vs uuid params) and
  synchronize:true is unconditional, including production, where Keycloak is also
  pointed at the SAME Postgres database.
- Prod compose cannot boot: backend Dockerfile.prod runs `npm ci --only=production`
  then `npm run build` (nest CLI missing); ./nginx/ directory doesn't exist but is
  mounted; frontend prod service overrides CMD with `npm start` in a standalone
  image with no npm.
- Dev stack boots but is unusable out of the box: backend CORS defaults to
  localhost:3000 (frontend is 3101), Keycloak realm redirect URIs only allow
  localhost:3000, README demo passwords don't match the realm (realm has admin123/
  examiner123/user123), .env.example omits vars the code reads (API_CORS_ORIGIN,
  KEYCLOAK_URL, KEYCLOAK_REDIRECT_URI) and defines ~12 vars nothing reads
  (SMTP_PASSWORD vs code's SMTP_PASS, CORS_ORIGINS vs code's API_CORS_ORIGIN,
  VECTOR_DIMENSION=384 vs the actual 768).
- Haitian Creole is unsupported in NLP: translation is a 16-entry dict, Whisper has
  no 'ht', Tesseract 'hat' traineddata not installed.

NON-NEGOTIABLE RULES:
1. Never expose restricted/secret-tier data to unauthorized callers. When in doubt,
   deny. Access filtering happens in queries/policy code, never only in the UI.
2. Never fabricate data or capability: no mock hashes, no hardcoded "transcribed
   content", no fixture arrays presented as live data, no status docs claiming
   things work that don't. If a feature is partial, label it and return honest
   errors (501 with explanation beats fake success).
3. Kreyòl-first: user-facing strings go through i18n with keys added to ALL FOUR
   locale files (ht/fr/en/es); ht is the default locale.
4. Every change ships with tests that run in CI. If the test infra for the area
   doesn't exist yet, creating it is part of the task.
5. Migrations only — never synchronize:true. Never commit real secrets.
6. Prefer deleting dead/simulated code over maintaining it.
```

---

## PROMPT 0 — Baseline, Lockdown & One-Command Boot

```
PHASE 0 of the CREOLE rebuild. Goal: a fresh clone boots to a usable, honest,
not-dangerous dev stack in one command, and the repo stops lying about itself.
No new features in this phase.

TASK 0.1 — EMERGENCY LOCKDOWN (do this first, as its own commit)
- In backend/src/records/records.service.ts, add access-tier filtering to findAll,
  findOne, and getFacets: until real auth lands in Phase 1, anonymous/unresolved
  callers get ONLY access_tier='public' rows. Apply the same guard to the GraphQL
  records resolver and the semantic search path (note: semantic search SQL is
  currently broken anyway — leave it failing closed, don't fix it here).
- Hide 2FA material: on UserProfile entity set select:false for two_factor_secret
  and backup_codes; audit every place users are returned and strip these fields.
- Disable until Phase 1 (return 403 with a clear message, keep the code): 
  POST /v1/notifications/email (open mail relay), DELETE /v1/security/gdpr/*,
  POST /v1/security/gdpr/anonymize/*, DELETE /v1/security/2fa/:userId,
  PUT /v1/users/:id, DELETE /v1/users/:id, all DELETE routes in blockchain/drm/
  bulk operations.
- Write integration-style tests (see Task 0.5 for minimal test infra) proving:
  anonymous GET /v1/records returns only public records; the disabled endpoints
  return 403.

TASK 0.2 — ENV & CONFIG TRUTH
- Reconcile .env.example with what the code actually reads. Add: API_CORS_ORIGIN
  (=http://localhost:3101), KEYCLOAK_URL (=http://localhost:8090 for host,
  document the in-network value), KEYCLOAK_REDIRECT_URI
  (=http://localhost:3101/api/auth/callback), ADMIN_EMAIL. Fix names to match code
  or code to match names (pick ONE convention and grep every getenv/config.get):
  SMTP_PASS/SMTP_PASSWORD, SMTP_FROM/EMAIL_FROM, NLP_HOST+NLP_PORT vs
  NLP_SERVICE_URL, CORS_ORIGINS vs API_CORS_ORIGIN. Set VECTOR_DIMENSION=768.
  Set KEYCLOAK_CLIENT_ID=creole-backend (the realm has no 'creole-client').
  Remove variables nothing reads, or wire them (e.g., actually read RATE_LIMIT_*
  in the throttler config).
- backend/src/main.ts: CORS origin from env, supporting a comma-separated list.
- Remove hardcoded secret fallbacks in backend/src/app.module.ts and
  media.service.ts: if POSTGRES_PASSWORD, KEYCLOAK_CLIENT_SECRET, MINIO keys are
  unset, fail fast at boot with a clear error instead of defaulting.

TASK 0.3 — KEYCLOAK & COMPOSE ALIGNMENT
- keycloak/realm-export/creole-realm.json: redirectUris/webOrigins →
  http://localhost:3101/*; backend client → 4200 equivalents; replace the
  committed client secret with a placeholder documented in .env.example (realm
  import supports env substitution via KC_* or document a post-import step —
  choose and implement one mechanism).
- Make README demo credentials match the realm (admin123/examiner123/user123) or
  change the realm to match the README — one or the other, verified by logging in.
- docker-compose.yml: add healthchecks for backend/frontend/nlp; backend
  depends_on db+redis+keycloak+minio with condition: service_healthy; add a
  minio-init service that creates the creole-media bucket with mc; parametrize
  KEYCLOAK_ADMIN/PASSWORD from env.
- nlp/Dockerfile (dev): install tesseract-ocr, tesseract-ocr-fra, poppler-utils,
  ffmpeg, curl; add a named volume for the HuggingFace/Whisper model cache in
  compose; add healthcheck with generous start_period (models download on first
  boot).
- Create `make dev` (or extend setup.sh): cp .env.example .env if missing →
  docker compose up -d --build → wait for health → run seed → print URLs and
  credentials. Must work on a clean machine.

TASK 0.4 — TRUTH PASS
- Move IMPLEMENTATION_STATUS.md, SESSION_SUMMARY.md, NEW_FILES_SUMMARY.md,
  GAP_ANALYSIS.md, IMPLEMENTATION_ROADMAP.md, ENHANCEMENTS.md, PLATFORM_OVERVIEW.md
  to docs/archive/ and prepend each with: "ARCHIVED — describes aspirations of an
  earlier session, not verified behavior."
- Rewrite README.md: accurate quick start (ports 3101/4200/8090/9021/8100),
  verified credentials, actual feature status table (working / partial / planned),
  remove claims of features that are simulated.
- Delete dead code: frontend/lib/auth.ts (broken PKCE, unused),
  components/LanguageSwitcher.tsx (Pages-Router, broken; keep the AppRouter one),
  components/AuthContext.tsx (empty), root playwright.config.ts (keep e2e/),
  backend/src/swagger.config.ts (never imported), backend/src/security/
  ip-whitelist.guard.ts and rate-limit.config.ts (wire in Phase 1 or delete now —
  delete now, Phase 1 recreates properly).
- Quarantine simulated features: BlockchainModule endpoints → 501 with message
  "timestamping arrives in Phase 6 (OpenTimestamps)"; delete
  media-processing.service.ts stub methods and media-enhanced orphan registration
  (Phase 5 rebuilds this against the real NLP service); frontend
  dashboard/requests/page.tsx: remove the "Approved in demo"/"Denied in demo"
  audit note strings.
- Remove unused frontend deps: chart.js, react-chartjs-2, leaflet, react-leaflet,
  react-quill, react-select, react-dropzone, isomorphic-unfetch, date-fns,
  react-hook-form, zod, @hookform/resolvers (reintroduce when actually used).
  Delete the dead components that imported them (AnalyticsDashboard, RecordMap,
  RichTextEditor, AdvancedSearch, SearchFilters + their broken tests).

TASK 0.5 — MINIMAL TEST INFRA (foundation for all later phases)
- backend: add jest, ts-jest, @types/jest, @nestjs/testing, supertest; jest config;
  "test" and "test:e2e" scripts. Delete the 6 existing spec files (they test
  methods that don't exist) and write fresh ones for Task 0.1's lockdown behavior.
- frontend: add vitest (or jest) + @testing-library/react properly, "test" script;
  one smoke test that the root page renders.
- .github/workflows/ci-cd.yml: remove every `|| true`; add a compose-boot job that
  does cp .env.example .env, docker compose up -d, waits on
  http://localhost:4200/health and http://localhost:3101 (the CORRECT ports), and
  runs the backend integration tests against the stack.

ACCEPTANCE CHECKLIST (verify each, show evidence in the PR description):
[ ] Clean clone + `make dev` → login via UI with documented credentials succeeds;
    seeded public records visible; no CORS errors in browser console.
[ ] curl anonymous /v1/records returns only public-tier records (test passes).
[ ] Disabled endpoints return 403 (tests pass).
[ ] CI green with no || true, including compose-boot job on correct ports.
[ ] grep -r "Approved in demo\|Transcribed audio content\|generateMockTransactionHash"
    returns nothing in live code paths.
[ ] README quick start executed verbatim on a clean environment by a second party
    (or fresh container) without deviation.
```

---

## PROMPT 1 — Authentication & Access Enforcement

```
PHASE 1 of the CREOLE rebuild (requires Phase 0 merged). Goal: every request is
authenticated, authorized, tier-filtered, and audited. This phase is the product's
core; take no shortcuts. Work in backend/ and frontend/.

TASK 1.1 — GLOBAL KEYCLOAK GUARDS
- Diagnose and fix why the APP_GUARD registrations in backend/src/app.module.ts
  (~line 110) caused DI errors (typical causes: KeycloakConnectModule registered
  async while guards resolve eagerly, or missing exports). Register AuthGuard,
  ResourceGuard, RoleGuard from nest-keycloak-connect as global APP_GUARDs.
- Sweep all 26 controllers: mark deliberately-public routes with @Public()
  (GET /v1/records public-tier search, GET /v1/records/:id for public records,
  /health, auth-adjacent routes, Swagger docs in dev). EVERYTHING else requires a
  valid token by default. Remove the Phase 0 temporary deny-guard.
- Fix RolesGuard to read Keycloak's realm_access.roles claim shape. Define roles:
  admin, examiner, community_steward, expert, community_user, researcher. Update
  the realm export to include the new roles and one demo user per role.
- Delete backend/src/auth/jwt-auth.guard.ts (phantom passport strategy) and the
  @UseGuards references in semantic.controller.ts; Keycloak guards cover them.

TASK 1.2 — ACCESS POLICY ENGINE (the heart of the platform)
- Create backend/src/access-policy/ with AccessPolicyService exposing:
    resolveRecordAccess(user, record): 'full' | 'digest' | 'none'
    applyRecordFilter(user, queryBuilder): void  // pushes WHERE conditions
  Decision inputs: record.access_tier; materialized access grants (below); user
  roles; community stewardship (user's Keycloak groups vs record's owning
  community); TK labels (hook point now, enforced fully in Phase 6).
  Rules: public→full for everyone. restricted→full for admin, owning steward,
  grant holders; digest for examiner (digest content itself arrives Phase 6 —
  until then digest==title+classification only); none otherwise. secret→full only
  for admin and owning steward; never in search/facets/exports/embeddings.
- Create AccessGrantEntity: id, record_id (FK), grantee_user_id, scope
  (read_full|read_digest), granted_by, reason, expires_at, revoked_at. Migration
  included (Phase 2 conventions: real migration file, no synchronize).
- Rewire AccessService.approve(): approval now creates an AccessGrant and audits
  it; add revoke endpoint (steward/admin); AccessPolicyService consults live
  grants (cache 60s max).
- Apply the policy in EVERY read path: RecordsService.findAll/findOne/getFacets,
  GraphQL resolvers, media presign (media of a restricted record requires the
  same access as the record), export service, semantic search (when Phase 4
  revives it — leave the call site ready).

TASK 1.3 — ENDPOINT HYGIENE SWEEP
- Replace every @Body() any / inline-object body with a class-validator DTO.
  Priority order: users, security, records, access, benefit, media, then the big
  CRUD modules (patent/medicine/expert/legal/gi/kg/drm — these can be
  mechanical). sort_by/sort_order get @IsIn whitelists (fixes the order-by
  injection in records.service.ts:86).
- Re-enable the endpoints disabled in Phase 0, now protected: GDPR endpoints =
  self-or-admin; user update = self (limited fields: display_name, locale,
  preferences) or admin (role changes audited); 2FA disable = self with password/
  TOTP proof, or admin with audit.
- Fix 2FA properly in two-factor.service.ts + security.controller.ts:
  validate reads the user's stored secret server-side (never from request body);
  backup codes via crypto.randomBytes, stored hashed (bcrypt), single-use burn;
  TOTP replay prevention (store last-used counter); rate limit 5 attempts/15min.
  Encrypt two_factor_secret at rest (AES-256-GCM with key from env; fail boot if
  key missing when 2FA rows exist).
- Enable ThrottlerGuard as global APP_GUARD (the module is already registered);
  stricter @Throttle on auth, search, upload, export routes.
- main.ts: enable CSP except the /graphql path in dev; gate GraphQL
  playground/introspection on NODE_ENV!=='production'.
- notify: re-enable email endpoint admin-only; template-based (no arbitrary
  to/subject/body from clients).

TASK 1.4 — FRONTEND AUTH COMPLETION
- middleware.ts: alongside locale handling, check the session cookie for
  /{locale}/admin/*, /dashboard/*, /profile, /security/*, /intake — redirect to
  login with returnTo. Role-check admin segments server-side (decode+VERIFY the
  JWT via Keycloak JWKS using jose — add jose dependency; never trust unverified
  payloads for gating again).
- BFF: remove `token` from /api/auth/session response. Add
  app/api/proxy/[...path]/route.ts that forwards API calls with the bearer token
  attached server-side, refreshing via the existing (currently never-called)
  refresh logic when expires_at is near. Update the 5 pages that fetched the
  token to call the proxy instead. lib/authServer.ts: verify signature + expiry.
- Wire token refresh: in serverFetch/proxy, if expires_at - now < 60s, call the
  refresh flow, update the session cookie, then forward.
- logout: include id_token_hint; env-driven post-logout redirect (no hardcoded
  localhost:3000 anywhere — grep and fix callback/route.ts:45 too).
- Fix AuthButtons to render the actual username from the (server-verified)
  session (add name/email claims to the session payload, not the raw token).

TASK 1.5 — AUDIT THAT CAN TESTIFY
- Rewrite AuditService.append: run inside a transaction holding
  pg_advisory_xact_lock; digest = sha256(id + timestamp + actor + action +
  canonical(details) + prevHash); store seq number.
- Add AuditController (admin-only): GET /v1/audit (paged, filterable),
  GET /v1/audit/verify (walk chain, return first broken link if any).
- Add a NestJS interceptor auditing: record create/update/publish, media upload,
  export, grant create/revoke, GDPR actions, 2FA changes, role changes, login
  callback (frontend posts a login event). Remove the /tmp anchor-log fallback.

TASK 1.6 — THE ACCESS MATRIX TEST SUITE (crown jewel — do not skim)
- supertest integration suite spinning up the app with a test DB and mocked/real
  Keycloak tokens (use keycloak test container or signed test JWTs with the
  realm's dev key): matrix of
  {anonymous, community_user, steward-of-community-A, steward-of-community-B,
   examiner, admin} × {public, restricted, restricted-with-grant, secret record}
  × {GET by id, search listing, facets, media presign, export}.
  Assert exact allow/deny/digest outcomes for all ~120 cells.
- Adversarial tests: mass-assignment attempt on user update; IDOR on another
  user's profile/grants; sort_by injection payloads; TOTP replay; expired grant;
  revoked grant takes effect immediately.

ACCEPTANCE CHECKLIST:
[ ] Access matrix suite green in CI; intentionally breaking a policy rule turns CI red.
[ ] Zero endpoints outside the explicit @Public() list respond without a token
    (automated route-table audit test that introspects the Nest router).
[ ] Frontend: visiting /ht/admin logged-out redirects to login; logged in as
    community_user shows 403 page; session survives 10 minutes of activity with
    5-minute token TTL (E2E).
[ ] /api/auth/session response contains no access_token (test).
[ ] Audit verify endpoint validates a chain of 10k entries written concurrently.
[ ] npm audit / dependency review clean of criticals.
```

---

## PROMPT 2 — Data Layer Integrity

```
PHASE 2 of the CREOLE rebuild (parallel with Phase 1 after Phase 0). Goal: schema
changes are migrations, relationships are foreign keys, data survives disasters.
Work mostly in backend/ and docker-compose files.

TASK 2.1 — MIGRATIONS FOR REAL
- Create backend/src/data-source.ts (TypeORM DataSource reading the same env as
  app.module). Add scripts: migration:generate, migration:run, migration:revert,
  migration:show (typeorm-ts-node-commonjs).
- Set synchronize:false in app.module.ts AND seed/seed.ts. Add migrationsRun:true
  (or a compose entrypoint step `npm run migration:run` before start — choose the
  entrypoint approach for prod, migrationsRun for dev, and document).
- Generate a baseline migration from current entities against an empty DB
  (includes CREATE EXTENSION vector + pg_trgm). Fix the two existing broken
  migration files by folding their intent into new correct migrations: search
  indexes must target table "records" (plural); pgvector functions must take uuid
  parameters; drop the old broken files.
- The records.search_vector column: leave as plain nullable tsvector for now
  (Phase 4 adds the trigger); records.embedding vector(768).

TASK 2.2 — REFERENTIAL INTEGRITY
- Add FK constraints (with a data-cleanup migration first that nulls/deletes
  orphans): usage_tracking.resource_id→records (nullable, SET NULL),
  blockchain_anchors.record_id→records (CASCADE),
  patent_alerts.tk_record_id→records (SET NULL),
  kg_relationships.source/target→kg_nodes (CASCADE),
  patent_citations→patent_formulations, formulation links→medicinal_plants,
  payout→benefit_contract (verify existing), expert/validation links. Document
  each ON DELETE choice in the migration.
- Register or remove orphaned entities: record-location + record-timeline (either
  add to RecordsModule forFeature + relations, or delete files); media-enhanced
  (delete — Phase 5 re-models processing results on the media table).
- Add GIN indexes: tk_labels, ipc_codes, region (jsonb_path_ops as appropriate);
  pg_trgm GIN on records.title_ht, title_fr, medicinal_plants name columns.

TASK 2.3 — PRODUCTION DATA TOPOLOGY
- docker-compose.prod.yml: give Keycloak its own database (second db in the
  postgres instance via init script, own user) — KC_DB_URL must not point at the
  app database. Wire REDIS_PASSWORD into backend cache config AND Bull connection
  config (backend/src/cache/cache.config.ts, jobs/jobs.module.ts).

TASK 2.4 — BACKUPS
- Add a backup service to prod compose: nightly pg_dump (custom format) of app DB
  + Keycloak DB to MinIO bucket creole-backups with 30-day retention (mc lifecycle);
  enable MinIO versioning on creole-media. Script + cron in a small alpine
  sidecar; log success/failure; write a /backups status file the backend health
  endpoint can report.
- Write docs/runbooks/restore.md with exact commands; EXECUTE a restore drill
  against a scratch stack and record the transcript in the PR.

TASK 2.5 — SEED DATA V1
- Extend backend/src/seed/: idempotent seeding of (a) demo users matching realm
  roles incl. steward; (b) one demo Community; (c) 25 medicinal plants with real
  public-domain TRAMIL-style data (multilingual names, uses, safety) — cite
  sources in a data/README; (d) 10 formulations linked to plants and conditions;
  (e) the TK-relevant IPC starter codes via the existing ipc-seeder (fix its
  "would be marked here" stub to actually set the flags); (f) 5 records per
  access tier with realistic Kreyòl titles. Wire `npm run seed` into make dev.

TASK 2.6 — MIGRATION CI GATE
- CI job: empty postgres → migration:run → assert no pending schema drift
  (typeorm schema:log empty) → migration:revert twice → re-run. Fails on drift.

ACCEPTANCE CHECKLIST:
[ ] grep synchronize backend/src → only 'false'.
[ ] Fresh stack boots via migrations only; schema-drift CI gate green.
[ ] All listed FKs exist (assert via information_schema query in a test).
[ ] Restore drill transcript included; backup job visible in prod compose config.
[ ] make dev shows seeded plants/formulations/records in the UI in all portals
    that have real endpoints.
```

---

## PROMPT 3 — Honest Frontend & Kreyòl-First i18n

```
PHASE 3 of the CREOLE rebuild (requires Phase 1). Goal: every route renders real
data through a typed client, in the user's language (Kreyòl default), accessibly.
Work in frontend/ (+ small backend fixes where routes are missing/shadowed).

TASK 3.1 — TYPED API CLIENT FROM OPENAPI
- Backend already serves Swagger. Ensure @nestjs/swagger decorators give usable
  schemas for the modules the frontend consumes (records, access, benefit, users,
  security, analytics, medicine, patent, expert, legal, gi, knowledge-graph).
  Export the spec to frontend at build time (script: curl 4200/api/docs-json →
  openapi.json, committed).
- Generate a typed client (openapi-typescript + a thin typed fetch wrapper, or
  orval). All calls go through the Phase 1 BFF proxy for authenticated routes.
- Adopt @tanstack/react-query: QueryClientProvider in the locale layout; every
  page's data fetching becomes useQuery/useMutation with proper error and loading
  states. DELETE lib/api-client.ts once all consumers are migrated.
- While migrating, fix the ~19 wrong paths by using the real backend routes
  (medicine search routes, expert routes, legal analytics/stats routes, patent
  ipc routes). Backend fixes where the route itself is broken:
  * ipc-classification.controller.ts: move @Get('search') and other static
    segments ABOVE @Get(':code'); same shadowing fix in drm.controller.ts
    ('community/unnotified' vs 'community/:communityName').
  * Add the missing bare list endpoints the UX needs (GET /medicine/plants with
    pagination, GET /expert/profiles, etc.) OR point the client at the existing
    search endpoints — prefer the latter unless pagination demands new routes.
  * Fix MedicineAPI.getFormulationsByPlant → real endpoint.
  * analytics.service.ts: fix the QueryBuilder.where(FindOperator) bugs and the
    @Query vs @Param mistakes on record/:recordId and user/:userId routes.

TASK 3.2 — DE-MOCK GI AND KNOWLEDGE-GRAPH PORTALS
- Delete every mock/fixture array in app/[locale]/gi/* (4 pages) and
  app/[locale]/knowledge-graph/* (4 pages). Wire to the real endpoints via the
  typed client. The graph visualize page: fetch a real neighborhood
  (node + relationships by node id, depth 1-2) and render with a lightweight SVG
  layout (no heavy graph lib yet).
- Fix all locale-dropping links (54 sites): create a LocaleLink wrapper or use
  next-intl's Link; remove links to routes that don't exist
  (/medicine/conditions, /medicine/evidence, /patent-examiner/citations,
  /patent-examiner/biopiracy, /expert/network|validations|credentials|disputes)
  or build minimal real pages where the backend supports them — build:
  /medicine/conditions (conditions list from real endpoint); remove the rest
  until their phases.
- Replace every silent `catch { setX([]) }` with react-query error states
  rendering a visible error component (with retry). Empty ≠ broken, ever again.

TASK 3.3 — I18N WIRING (KREYÒL-FIRST)
- Install next-intl (App Router native). Provider in app/[locale]/layout.tsx;
  middleware integration with existing locale detection/cookie; defaultLocale ht.
- Port the 4 × 150-key catalogs from public/locales/*/common.json into next-intl
  message files (preserve keys; convert {{var}} → {var} interpolations).
- Migrate pages to t() in this order: nav/toolbar, home/search, record detail,
  intake, requests/dashboard, then the portals. New keys added to ALL FOUR
  locales (translate honestly to fr/es/en; for ht write real Kreyòl — match the
  existing catalog's quality and orthography; flag uncertain translations with a
  reviewer TODO list in the PR, not in the strings).
- Mount LanguageSwitcherAppRouter in the toolbar; delete next-i18next.config.js
  and the next-i18next dependency.
- CI check: script asserting key parity across the 4 catalogs (fails on drift).

TASK 3.4 — DESIGN SYSTEM & STATES
- Create components/ui/: Button, Card, Input, Select, Badge, Table, Modal,
  EmptyState, ErrorState, PageHeader, Spinner (one!). Tailwind only; delete
  inline-style objects as pages migrate (SearchBar, RecordCard, the /intake,
  /profile, /admin, /dashboard pages).
- Add loading.tsx + error.tsx per major segment; app-level not-found.tsx;
  records/[id] uses notFound() for missing records (404 not 200).
- Responsive nav: collapse the toolbar into a menu under md breakpoint.

TASK 3.5 — TYPESCRIPT STRICT
- tsconfig: strict true, target ES2022. Fix fallout using the generated API types
  (no `any` in app code; useState<T | null> with guards). This will surface real
  bugs (e.g., stats.profiles.total_experts null-derefs) — fix with proper
  loading/error handling, not non-null assertions.

TASK 3.6 — ACCESSIBILITY + DARK MODE
- Every form control: id + htmlFor (or wrapping label). Every status currently
  emoji/color-only gets a text label — plant safety badges MUST read
  "Toxic"/"Safe"/"Caution" as text (safety issue).
- Keyboard: menus/modals get Escape-close, focus trap, aria-expanded; visible
  focus rings.
- tailwind.config.js: darkMode:'class'; mount ThemeProvider in layout + ThemeToggle
  in toolbar; sweep key pages for dark: variants (systematic, not exhaustive —
  ensure readable, not perfect).
- Add @axe-core/playwright checks for home, record detail, intake, plants, and
  one portal page to the E2E suite; no critical violations.

ACCEPTANCE CHECKLIST:
[ ] lib/api-client.ts deleted; all data flows through generated typed client +
    react-query; network tab shows only 2xx/expected calls on a full click-through.
[ ] Zero fixture arrays (CI grep for mockData|mockNodes|mockRelationships|
    Simulated stats passes).
[ ] Default locale ht: fresh visit renders Kreyòl everywhere migrated; switcher
    persists choice; parity check green.
[ ] tsc --noEmit strict green; next build green.
[ ] Playwright click-through of all routes: real data or designed empty/error
    states; no silent empties; no 404 links.
[ ] axe checks green; dark mode toggles and persists.
```

---

## PROMPT 4 — Search That Works

```
PHASE 4 of the CREOLE rebuild (requires Phase 2; Phase 3 helpful). Goal:
trilingual keyword search with real ranking and snippets, plus repaired semantic
search with an actual embedding pipeline. Backend + small frontend.

TASK 4.1 — PERSISTED FTS
- Migration: trigger function maintaining records.search_vector =
  setweight(to_tsvector('simple', unaccent(coalesce(title_ht,''))),'A') ||
  setweight(to_tsvector('french', coalesce(title_fr,'')),'A') ||
  setweight(to_tsvector('simple', unaccent(coalesce(abstract_ht,''))),'B') ||
  setweight(to_tsvector('french', coalesce(abstract_fr,'')),'B') ||
  setweight(to_tsvector('english', coalesce(abstract_en,'')),'B')
  (adjust to actual column names in record.entity.ts; include unaccent extension).
  GIN index on search_vector. Backfill UPDATE in the migration.
- RecordsService.findAll: query with websearch_to_tsquery per selected language
  (simple for ht, french, english) OR'd across configs; rank ts_rank_cd; snippets
  via ts_headline on the best-matching field; REMOVE the per-row to_tsvector and
  the leading-wildcard ILIKE. Keep a pg_trgm similarity() fallback branch when
  FTS yields 0 results (catches Kreyòl orthographic variants) with a
  "did you mean" suggestion from word_similarity.
- Kreyòl synonyms: a synonyms table (term, variant, domain) seeded from the
  medicine DB's multilingual plant names + common orthographic pairs
  (fèy/fey, remèd/remed…). Query expansion: OR the variants into the tsquery.
- All search paths call AccessPolicyService.applyRecordFilter FIRST.

TASK 4.2 — SEMANTIC SEARCH REPAIR + PIPELINE
- Fix semantic.service.ts SQL: select the real columns (title_ht, title_fr,
  creole_class, access_tier); parameterize; add class-validator decorators to
  SemanticSearchDto/UpdateEmbeddingsDto (currently every request 400s against
  forbidNonWhitelisted).
- Embedding pipeline: RecordsService create/update emits an event → Bull
  'indexing' queue (FIRST real producer; queue infra exists) → IndexingProcessor
  calls NLP /embeddings on title+abstract (skip secret-tier records entirely) →
  writes records.embedding vector(768). Retry w/ backoff; dead-letter logging;
  admin endpoint POST /v1/semantic/reindex (enqueues all non-secret).
- Hybrid endpoint GET /v1/search: FTS + vector cosine (embedding <=> query
  embedding via NLP) merged with reciprocal rank fusion; language param;
  facets included; policy-filtered before ranking.
- HNSW index on embedding (migration; the old broken pgvector migration's intent,
  corrected to uuid).

TASK 4.3 — FRONTEND SEARCH UX
- Search page: language-aware placeholder, snippet rendering (sanitized
  ts_headline output), facet sidebar from real facets, "did you mean" chip,
  result count + latency display.

TASK 4.4 — RELEVANCE GOLD SET
- tests/search-gold.spec.ts: seed corpus (Phase 2 seeds + 20 extra crafted
  records); ≥20 assertions across languages: Kreyòl query 'asosi' → Momordica
  charantia record top-3; 'fyèv'/'fièvre'/'fever' each find fever formulations;
  misspelled 'asossi' → suggestion; secret-tier never appears anonymously.
  Runs in CI against the compose stack.

ACCEPTANCE CHECKLIST:
[ ] Gold set green in CI; EXPLAIN test asserts index scans (no seq scan on the
    FTS path).
[ ] GET /v1/semantic/search returns 200 ranked results (E2E) within 500ms warm.
[ ] Creating a record produces an embedding within 60s (queue metric test);
    secret records have NULL embedding (test).
[ ] Reindex endpoint processes the full corpus; queue depth visible in logs.
```

---

## PROMPT 5 — Media Pipeline & Creole NLP

```
PHASE 5 of the CREOLE rebuild (requires Phase 2). Goal: uploads actually get
transcribed, OCR'd, redacted — with honest Haitian Creole capability. Work in
backend/, nlp/, frontend/ (status UI).

TASK 5.1 — WIRE BACKEND → NLP VIA JOBS
- Delete the stub methods in media-processing.service.ts entirely. New
  MediaProcessingService (registered in MediaModule this time): on upload
  completion, enqueue Bull 'media-processing' job typed by mime:
  audio/video → ffmpeg audio extraction (in NLP container) → /transcribe;
  image/pdf → /ocr; text fields → /redact_text for restricted-tier records.
- Persist results on the media entity (add columns via migration: transcript,
  transcript_language, transcript_confidence, transcript_model, ocr_text,
  ocr_confidence, processing_status, processing_error, processed_at). Feed
  transcript/ocr text into the record's search_vector (extend the Phase 4 trigger
  or an explicit update).
- Job status: GET /v1/media/:id/status; frontend record page shows
  processing/complete/failed with retry button (steward/admin).
- Fix ExportProcessor: actually write the export file to MinIO and store the
  real presigned/asset URL before marking completed.

TASK 5.2 — CREOLE ASR
- In nlp/: add Meta MMS ASR (facebook/mms-1b-all supports Haitian Creole 'hat')
  via transformers; route by language param: ht→MMS, fr/en→Whisper; auto-detect
  fallback tries both and keeps higher-confidence. Return model + confidence +
  segments. Update /transcribe contract; document GPU-optional operation and CPU
  latency expectations honestly in nlp/README.md.
- Model management: models load lazily on first use with a /warmup endpoint;
  HF cache volume (Phase 0 added it) covers MMS too.

TASK 5.3 — REAL TRANSLATION
- Replace the 16-entry dictionary in nlp/main.py with NLLB-200 distilled 600M
  (hat_Latn ↔ fra_Latn ↔ eng_Latn ↔ spa_Latn). Keep a glossary override table
  (DB-backed via a backend endpoint the NLP service queries at startup, or a
  mounted YAML for now) applied pre/post translation for domain and sacred terms.
- Every machine translation response carries {machine_translated: true, model,
  quality_note}; frontend renders an "otomatik" badge; steward can approve/edit
  (stores human translation, wins over machine).
- Remove "[Translation needed: …]" pathways.

TASK 5.4 — OCR + REDACTION HARDENING
- Dockerfiles: add tesseract-ocr-hat (Haitian Creole traineddata) alongside fra/
  eng in BOTH nlp Dockerfiles; OCR language param plumbed through.
- /redact_text: sacred/PII term list becomes a parameter (backend sends the
  owning community's steward-managed term list — new CommunityTermList entity +
  CRUD, steward-scoped); regex with word boundaries; fix \d{6,} overreach
  (require ID-like context or make it opt-in); return actual counts and spans;
  redactions_made computed, not hardcoded.
- Enforcement: media/text of restricted records passes redaction before ANY
  non-full-access view (wire into AccessPolicyService digest path).

TASK 5.5 — NLP SERVICE OPS
- Shared-secret auth (X-Internal-Token from env) required on all NLP endpoints;
  backend sends it; NLP rejects without it. Remove the host port mapping for nlp
  in docker-compose.prod.yml (internal only); keep it in dev.
- Remove unused opencv-python from requirements. Add pytest + tests: transcribe a
  bundled 5s fixture wav, OCR a fixture image (hat + fra), translate a fixture
  sentence, redact with boundaries — run in CI (CPU, small models or mocked
  model layer where too heavy; at minimum contract tests with mocked pipelines
  and one real Tesseract test).

ACCEPTANCE CHECKLIST:
[ ] E2E: upload Kreyòl audio fixture → transcript with language 'ht', model
    'mms', confidence stored, searchable via FTS. Upload PDF → OCR text indexed.
[ ] Zero hardcoded processing outputs (grep 'Transcribed audio content'|
    'Extracted text from image'|'Canon EOS' = 0).
[ ] Translation of a held-out Kreyòl paragraph is fluent French/English (manual
    check documented in PR) and flagged machine_translated.
[ ] NLP endpoints 401 without internal token; unreachable from host in prod
    compose config.
[ ] Redaction unit suite green (boundaries, counts, community term lists).
```

---

## PROMPT 6 — TK Protection Core

```
PHASE 6 of the CREOLE rebuild (requires Phases 1+2). Goal: the features that make
this a TKDL — enforceable TK labels, living consent, examiner digests, provable
timestamps, community governance. Backend + frontend + realm.

TASK 6.1 — COMMUNITIES AS FIRST-CLASS
- CommunityEntity: name (ht/fr/en), region, description, governance_notes,
  contact; Keycloak group per community (creole/communities/<slug>);
  community_steward role + group membership = stewardship. Records, media,
  medicinal_plants, formulations, GI registrations get owning_community_id FK
  (nullable migration + backfill of seeds).
- Workflow: extend the existing review-assignment state machine — a record with
  owning_community_id cannot transition to 'published' without a
  steward_approval event from a steward of THAT community (admin override
  audited). UI: steward queue page (/[locale]/steward) listing pending items.

TASK 6.2 — TK LABELS MADE REAL
- Align labels catalog with Local Contexts TK Labels & Notices: seed the ~20
  labels (TK Attribution, TK Non-Commercial, TK Sacred, TK Secret/Confidential,
  TK Community Voice, TK Outreach, etc.) with ht/fr/en/es names+descriptions and
  official-style iconography slots (label_code, icon asset path).
- RecordLabelEntity join: record_id, label_id, assigned_by, terms_note,
  community_id. Replace the free-text records.tk_labels jsonb usage with the
  join (migration converts existing strings where they match codes; keeps jsonb
  column until frontend migrated, then drop).
- Enforcement hooks in AccessPolicyService: TK Sacred/Secret label forces
  access_tier ≥ restricted and excludes from examiner digest; TK Non-Commercial
  blocks commercial-scope API keys (Phase 9) and stamps exports; label set
  rendered on record pages and embedded in every export/citation footer.

TASK 6.3 — CONSENT LIFECYCLE
- Upgrade ConsentEntity: type (PIC|MAT|other), scope_note, grantor_name,
  grantor_authority, community_id FK, evidence_media_id FK (signed doc or
  recorded oral consent), effective_date, expiry_date, revoked_at,
  revocation_reason. Full CRUD (steward/admin), replacing the findAll-only
  service.
- Revocation cascade: revoking the governing consent → record drops to
  'restricted', exports/deriving digests blocked, dependent ABS agreements
  flagged 'under_review', stewards + admin notified, all audited.
- Record page shows consent status; publish transition requires an active
  consent when owning_community_id is set.

TASK 6.4 — EXAMINER DIGEST PIPELINE
- Records get digest fields (migration): digest_text, digest_status
  (none|draft|approved), digest_approved_by/at. "Generate digest draft" action
  (steward): auto-draft from title/classification/formulation fields minus
  sacred terms (community term list) and minus precise locations (strip
  coordinates; region-level only); steward edits + approves in UI.
- AccessPolicyService digest path now returns digest_text for examiner role on
  restricted records with approved digests; 'none' when digest not approved.
- Prior-art PDF generator (backend service + endpoint, steward/admin/examiner):
  branded dated document per record: digest text, IPC codes, TK labels, content
  hash (sha256 of canonical record JSON), timestamp proof reference (6.5),
  citation formats. Store generated PDFs in MinIO; audit generation.

TASK 6.5 — HONEST TIMESTAMPING (replaces the fake blockchain)
- DELETE the simulated logic in blockchain-anchor.service.ts (mock hashes,
  Math.random blocks, forced confirmations, fake etherscan URLs) and the
  hand-rolled Merkle code (it has an odd-node verification bug anyway).
- Implement OpenTimestamps: nightly job hashes all new/changed records
  (canonical JSON) → opentimestamps client stamps each hash (or a per-day
  Merkle aggregation via the OTS lib itself) → store .ots proof bytes on a new
  timestamp_proofs table (record_id FK, content_hash, ots_proof bytea, stamped_at,
  upgraded_at, status pending_attestation|attested). Daily upgrade job completes
  pending proofs once Bitcoin-attested.
- Endpoints: GET /v1/records/:id/timestamp-proof (download .ots + verify
  instructions), POST /v1/timestamp/verify (server-side verification of an
  uploaded proof against a record). Trim the module's public surface to these +
  admin list; delete the other ~28 endpoints.
- UI on record page: "Prior existence provable as of {date}" with proof download;
  pending state honestly labeled.
- Optional (config-gated): RFC 3161 TSA countersignature (freetsa or similar) as
  a second, immediately-verifiable proof.

TASK 6.6 — DEFENSIVE PUBLICATION EXPORT
- Admin/steward batch export: select records (approved digests only) → bundle of
  prior-art PDFs + machine-readable XML/JSON index (id, hash, date, IPC, labels)
  + a manifest with the batch's own OTS proof. This is the artifact delivered to
  patent offices. Audited + rate-limited.

ACCEPTANCE CHECKLIST:
[ ] Extended access-matrix suite: sacred-labeled record invisible to examiner;
    approved digest visible to examiner as digest only; revoked consent flips
    access in the next request (all tests).
[ ] Publish without steward approval or active consent → blocked (test).
[ ] A generated prior-art PDF's embedded hash matches recomputed canonical hash;
    OTS proof verifies (attested) or reports pending honestly (test with the OTS
    lib in stub/calendar mode for CI + one recorded real verification in the PR).
[ ] grep for mock/fabricated blockchain code = 0; blockchain module surface ≤ 6
    endpoints.
[ ] All new UI strings in 4 locales; steward flows fully usable in Kreyòl.
```

---

## PROMPT 7 — Patent Intelligence & Examiner Portal

```
PHASE 7 of the CREOLE rebuild (requires Phases 4+6). Goal: the biopiracy-
prevention loop — ingest patent filings, match against the corpus, alert, arm the
legal module. Backend + frontend.

TASK 7.1 — INGESTION CONNECTORS
- PatentApplicationEntity: office (EPO|USPTO|WIPO), external_id, title, abstract,
  claims_text, applicants, ipc_codes jsonb, filing_date, publication_date,
  raw_ref, fetched_at. Migration + GIN on ipc_codes + FTS index on
  title/abstract/claims.
- EPO OPS connector (free tier, OAuth2 client-credentials; env-configured keys):
  scheduled Bull job pulling published applications in configured IPC subclasses
  (default watchlist: A61K36*, A61K8*, A23L*, A23V*, C12G*, A01H* — stored in a
  watchlist table, admin-editable). Respect rate limits (throttled client,
  resumable cursor). USPTO: PatentsView API connector with the same normalized
  output. Design connectors behind a PatentSourcePort interface so WIPO/others
  can be added.
- Nightly schedule via Bull repeatable jobs; admin status endpoint (last run,
  fetched counts, lag).

TASK 7.2 — MATCHING ENGINE
- MatchingService: for each new application produce candidate TK records via
  (a) IPC overlap with patent_formulations/records.ipc_codes, (b) term hits:
  scientific + vernacular plant names from medicinal_plants (all languages)
  found in claims/abstract, (c) embedding similarity: application abstract
  embedding (NLP service) vs record embeddings (non-secret only). Combined
  score with per-factor breakdown stored on a new PatentMatchEntity
  (application FK, record FK, score, factors jsonb).
- Score ≥ threshold (env) → auto-create PatentAlert (this replaces hand-entered
  alerts) linking application + top matched records + factor explanation;
  notify admin + stewards of affected communities (existing notify service).

TASK 7.3 — TRIAGE → LEGAL PIPELINE
- Alert queue UI (/[locale]/patent-examiner/alerts, examiner+admin): list, match
  evidence panel (factors, side-by-side digest vs claims), actions: dismiss
  (reason), watch, escalate. Escalate → creates BioPiracyCase pre-filled with
  the evidence package: matched digests, prior-art PDFs, timestamp proofs,
  match explanation; case links back to alert. Community stewards notified.
- Implement citation recording for real (replaces the alert('coming soon')):
  examiner records that an office cited a CREOLE record against an application;
  stored via PatentCitationService; shows in impact analytics.

TASK 7.4 — EXAMINER PORTAL HARDENING
- Examiner registration flow: request account (institution, office, email) →
  admin approves → Keycloak user with examiner role created via admin API.
- Examiner search UI runs against digest-only view (policy enforced server-side;
  test attempts to fetch full restricted records with an examiner token fail).
- Examiner API keys (hashed, scoped read-digest, quota) for office integrations;
  every keyed request logged through the DRM UsageTrackingService (its first
  real caller) with attribution requirements returned in response headers.

TASK 7.5 — IPC FULL LOAD
- Fix/finish ipc-seeder: import the WIPO IPC scheme (2025 edition XML/master
  files, documented download step; commit the relevant-section subset A/C to
  keep repo size sane) with hierarchy links; mark TK-relevant flags from the
  watchlist config. Idempotent, chunked.

ACCEPTANCE CHECKLIST:
[ ] Replay test: fixture application modeled on a historic biopiracy case
    (e.g., a bitter-melon/asosi preparation claim) vs seeded corpus → alert
    fires with the right record in top-3 and a human-readable factor breakdown.
[ ] Connectors run against recorded/mocked API fixtures in CI (VCR-style); one
    documented live staging run in the PR (counts + lag).
[ ] Examiner token: digest-only enforced (matrix test extended); API key quota
    + usage logging verified (tests).
[ ] Escalation produces a case whose evidence bundle files all exist in MinIO
    and verify (hashes/proofs).
[ ] Alert/triage UI in 4 locales.
```

---

## PROMPT 8 — Testing, CI/CD & Production Operations

```
PHASE 8 of the CREOLE rebuild (hardening pass; prerequisites Phases 0-2 minimum,
ideally after 3-5). Goal: the platform proves itself on every commit and deploys,
observes, restores. Work across repo.

TASK 8.1 — TEST PYRAMID COMPLETION
- Backend: unit coverage for AccessPolicyService, audit chain, matching engine,
  2FA, citation/export services; integration (supertest+testcontainers or
  compose services) for records, access grants, media jobs, search. Coverage
  gate: 40% lines now, ratchet plan documented (5%/month to 70%).
- Frontend: component tests for ui/ primitives + critical flows (intake form
  validation, search interaction) with Testing Library; MSW for API mocks
  matching the OpenAPI spec.
- E2E: single Playwright setup in e2e/ (root config already deleted in Phase 0);
  add data-testid attributes to UI touchpoints; rewrite suites against REAL
  routes (locale-prefixed), REAL realm users, correct ports; journeys: login,
  search (3 languages), intake→steward approval→publish, access request→grant→
  restricted view, upload→transcript, examiner digest view, alert triage.
  Runs against compose stack in CI; traces on failure.

TASK 8.2 — CI THAT GATES
- Workflow jobs (all gating, zero || true): lint (add eslint flat config to
  frontend + backend, fix or explicitly disable rules — no red baseline),
  typecheck, unit, integration, e2e, prod-image builds, migration-from-empty,
  translation-parity, fixture-grep, npm/pip audit (fail on critical), SBOM
  artifact. Concurrency-cancel stale runs; cache deps. Branch protection notes
  in docs.
- Deliberate-break verification: PR description shows CI failing when (a) a
  policy rule is inverted, (b) a locale key is removed — then reverted.

TASK 8.3 — PRODUCTION DEPLOYMENT FOR REAL
- backend/Dockerfile.prod: multi-stage — deps(ci) → build(nest build) →
  runtime(node:alpine, prune prod deps, dist only, non-root, dumb-init,
  healthcheck). Remove compose `command:` overrides for backend and frontend
  (use image CMDs). Frontend prod build gets NEXT_PUBLIC_API_URL as build ARG
  from compose.
- Author nginx/: nginx.conf with TLS termination (certbot webroot + renewal
  sidecar), HTTP→HTTPS, HSTS, proxy /→frontend, /api + /v1 + /graphql→backend,
  /auth→keycloak (path-based or subdomains — choose subdomains:
  app./api./auth./ via server_name), security headers, gzip, rate-limit zone on
  auth+search. Remove ALL host port mappings for db/redis/minio/keycloak-internal
  in prod compose; only nginx 80/443 exposed.
- Secrets: prod compose requires a filled .env (no credential defaults — boot
  fails loudly on missing); document generation; rotate the committed Keycloak
  client secret story (new realm import mechanism from Phase 0).
- Image tags: :sha-<git-sha> pushed by CI (prod Dockerfiles, not dev); staging
  compose file; promote-by-retag; rollback = previous sha (runbook + one drill).

TASK 8.4 — OBSERVABILITY THAT OBSERVES
- Backend: prom-client /metrics — http duration histogram by route/status, Bull
  queue depth/failures, policy denial counter, audit append counter, DB pool
  gauge. NLP: prometheus-fastapi-instrumentator. Frontend: next runtime metrics
  optional (skip if noisy).
- Fix compose networking: shared 'observability' network joined by app services
  + prometheus/promtail; define postgres-exporter and redis-exporter services;
  fix promtail docker socket permissions (user: root or group).
- Rewrite alert rules against metrics that now exist; fix ContainerRestarting to
  use changes(container_start_time_seconds); Alertmanager config templated at
  deploy time (envsubst entrypoint) with a real receiver (email or webhook from
  env); test route with amtool in CI (config lint).
- Commit 5 Grafana dashboards as JSON in the provisioned path (create the json/
  subdir the provider expects): API Overview, Security/Auth events, Jobs &
  Queues, Postgres, NLP latency. Loki: enable compactor-based retention.
- Runbooks in docs/runbooks/: deploy, rollback, restore, cert renewal, key
  rotation, incident response INCLUDING a sacred-data-exposure breach procedure
  (who is notified — affected community stewards first — what gets rotated,
  what gets audited).

ACCEPTANCE CHECKLIST:
[ ] Fresh VM + filled .env + `docker compose -f docker-compose.prod.yml up -d`
    → all healthy behind TLS; e2e smoke green against it (documented transcript).
[ ] CI: all jobs gating; deliberate-break evidence included; prod images build
    from prod Dockerfiles and are the ones pushed.
[ ] Grafana shows live app traffic; induced 5xx storm alerts the receiver < 5min
    (screenshot); backup job metric visible.
[ ] Rollback drill + restore drill transcripts in docs/runbooks/.
```

---

## PROMPT 9 — Mobile Field Collection & Public API

```
PHASE 9 of the CREOLE rebuild (requires Phases 3+5). Goal: offline-first field
collection for communities and a public read API for institutions. Work in
mobile/, backend/, frontend/ (impact page).

TASK 9.1 — MOBILE REBUILD
- Re-scaffold mobile/ as a fresh Expo (SDK 52+) TypeScript app: app.json (name
  CREOLE, slug, icons/splash from a simple brand asset you create, iOS/Android
  permission strings for mic/camera/location with Kreyòl+French+English
  descriptions), babel.config.js, tsconfig, eslint, lockfile. Correct deps
  (@react-native-async-storage/async-storage — the currently referenced
  react-native-async-storage package name is wrong/nonexistent).
- Auth: expo-auth-session OIDC PKCE against Keycloak (no password grant, no fake
  /auth/login); secure token storage (expo-secure-store); refresh handling.
- Kreyòl-first: i18n (i18n-js or lingui) reusing the web catalogs via a shared
  sync script; ht default.
- Screens: browse/search public records (online); record capture wizard: title
  (ht required), classification, community, consent capture step (photo of
  signed form or recorded oral consent audio), photos, audio recording, GPS
  with precision switch (exact|commune-level|off; sacred sites default
  commune-level); saves as local draft.
- Offline-first: expo-sqlite (or WatermelonDB) draft store incl. media file
  paths; background sync when online: upload media → create record in 'draft'
  status → steward review queue (Phase 6) handles the rest; conflict policy:
  drafts are append-only client-side, server assigns ids; sync status UI.
- CI: eas build --profile preview (or expo prebuild + gradle assemble) must pass
  from clean checkout; unit tests for the sync engine (jest-expo).

TASK 9.2 — PUBLIC / INSTITUTIONAL API
- /api/public/v1: read-only, public-tier records + approved digests + plants
  (non-sensitive fields) + GI registry; OpenAPI docs page; stable pagination;
  ETags.
- API keys: ApiKeyEntity (hashed key, owner org, scope: public|digest, quota/day,
  commercial: bool); TK Non-Commercial labeled content excluded for
  commercial:true keys (Phase 6 hook); middleware: key auth + quota + per-key
  usage recording via UsageTrackingService; 429 on quota.
- Terms endpoint + docs page embedding TK label obligations and attribution
  requirements (returned also as response headers X-TK-Attribution).

TASK 9.3 — IMPACT ANALYTICS
- Repair analytics module bugs if not already (QueryBuilder.where misuse,
  @Query/@Param mixups). Build an impact dashboard (admin + a public
  /[locale]/impact page): records by community/classification over time,
  examiner citations recorded, alerts→cases→outcomes funnel, benefit-sharing
  totals from payouts, API usage by institution. Public page shows only
  aggregates (k-anonymity: suppress groups < 5).

ACCEPTANCE CHECKLIST:
[ ] Emulator E2E (CI): airplane-mode capture with photo+audio → reconnect →
    record appears in steward queue with consent evidence attached.
[ ] Mobile build passes in CI from clean checkout; app boots in Kreyòl.
[ ] Public API: restricted/secret content provably absent (contract test
    sweeping every public endpoint against seeded restricted data); quota +
    attribution headers verified.
[ ] Impact page renders from real event data; public aggregates suppress small
    groups (test).
```

---

## Maintenance prompt (recurring, after any phase)

```
Run a truth audit on the CREOLE repo:
1. Grep for fixture/mock/stub patterns in live code paths (mockData, Simulated,
   coming soon, TODO: Get from auth, hardcoded credentials) — list and fix or
   ticket each.
2. Route-table audit: introspect Nest routes; diff against @Public() allowlist
   and the frontend's generated client usage; flag unauthenticated routes and
   unconsumed endpoints (candidates for deletion — surface area is a liability).
3. Translation parity + Kreyòl quality sample (10 random new keys reviewed).
4. Access-matrix suite still green; add cells for any new resource type.
5. Docs freshness: README quick start re-executed verbatim; ports/credentials
   verified; feature table matches reality.
Report findings as a checklist PR.
```
