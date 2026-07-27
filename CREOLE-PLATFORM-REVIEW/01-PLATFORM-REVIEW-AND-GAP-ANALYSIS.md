# CREOLE — AYITI Traditional Knowledge Digital Library
## Full Platform Review & Gap Analysis

**Reviewed repository:** `alovladi007/CREOLE---AYITI-Traditional-Knowledge-Digital-Library` (commit `8bca325`, July 2026)
**Method:** Line-level code review of every subsystem (backend, frontend, infrastructure, NLP, mobile, tests, docs), with every claim in the repo's own status documents verified against the actual code.

---

## 1. Executive Summary

CREOLE aims to be Haiti's equivalent of India's TKDL: a defensive-publication and community-protection platform for Haitian traditional knowledge (medicinal plants, formulations, rituals, geographical indications), used to block biopiracy patents and enforce community consent.

**The verdict: the platform is wide but hollow.** It has an unusually large surface area — ~28,800 lines of backend TypeScript, 43 database entities, **634 REST endpoints**, 32 frontend routes, monitoring stack, mobile app, E2E suites — but the load-bearing core is missing or broken:

| Dimension | Claimed (repo docs) | Verified reality |
|---|---|---|
| Security | "All endpoints protected with Keycloak & RBAC" | **All 634 endpoints are anonymous.** The three global guards are commented out behind a `TODO` (`backend/src/app.module.ts:110-113`). Zero `@UseGuards` on any controller (2 broken exceptions). |
| Sacred-knowledge protection | "3-tier access control" | **`access_tier` is never enforced anywhere.** `restricted` and `secret` records are served in full to unauthenticated callers via the public search endpoint. |
| Frontend | "7 complete portals, 650+ endpoint client" | 12 of 32 routes work. ~19 API-client paths point at endpoints that don't exist. GI and Knowledge-Graph portals render **hardcoded mock data** while the real backend endpoints sit unused. |
| i18n | "Multi-language HT/FR/EN/ES" | Translation files are excellent (150 keys × 4 locales, authentic Kreyòl) — and **zero pages consume them**. All UI is hardcoded English. No i18n provider exists. |
| Blockchain | "Multi-blockchain anchoring, legal evidence" | **Entirely simulated.** Random hex "transaction hashes", `Math.random()` block numbers, status forced to `confirmed`, fake etherscan URLs — exposed via a `markAsLegalEvidence` endpoint. |
| OCR / transcription | "Video/audio transcription, OCR" | NestJS returns hardcoded strings (`'Transcribed audio content...'`). The Python NLP service has *real* Whisper/Tesseract implementations that the backend **never calls**. |
| Haitian Creole NLP | "Advanced multilingual NLP" | Translation is a 16-entry hardcoded dictionary. Whisper has no `ht` model token; Tesseract `hat` traineddata not installed; embedding model wasn't trained on Creole. **Creole is unsupported at every NLP layer.** |
| Tests | "Run E2E tests / backend tests" | **Zero tests can execute anywhere.** No jest in backend or frontend package.json, no test scripts; E2E suites target routes, test-ids, and credentials that don't exist; CI masks everything with `\|\| true`. |
| Deployment | "Production-ready, health checks" | Dev stack boots but is unusable (CORS blocks the frontend, Keycloak rejects the redirect URI, README passwords are wrong). **Prod stack cannot build or boot** (3 independent hard blockers). |
| Migrations | "npm run migration:run" (DEPLOYMENT.md) | The command doesn't exist. No DataSource, no scripts. `synchronize: true` runs unconditionally — including production — while prod Keycloak shares the same database. |
| Monitoring | "Prometheus/Grafana/Loki, 5 dashboards" | Monitoring network is isolated from the app network; backend exposes no `/metrics`; **zero Grafana dashboard JSONs exist**; Alertmanager config uses env placeholders it can't expand. |
| Mobile | "React Native app with offline support" | Cannot `npm install` (nonexistent package name), no `app.json`/babel/tsconfig, calls a `/auth/login` endpoint the backend doesn't have. |

**What is genuinely good** (worth preserving and building on):

1. **The Python NLP service** — real Whisper transcription, real Tesseract OCR (incl. PDF), real 768-dim multilingual embeddings, real image redaction. The most honestly implemented component.
2. **The translation assets** — authentic, idiomatic Haitian Creole across 150 keys, schema-aligned in 4 locales. The expensive part of i18n is already done.
3. **The OIDC/PKCE handlers** (frontend `app/api/auth/login|callback`) — correct S256 PKCE, state validation, httpOnly session (with fixable defects around it).
4. **The pgvector migration** — well-written HNSW + SQL functions (never executed, and with a type bug, but the right idea).
5. **The domain data model breadth** — 43 entities covering the right concepts (formulations, IPC codes, ABS agreements, territories, expert credentials). The vocabulary of the platform is correct even where the enforcement is absent.
6. **Working flows**: `/v1/records` CRUD + search page, access-request flow, benefit-sharing contract admin, citation generator (5 formats), CSV/XLSX export service, review-workflow state machine.

**The strategic problem:** the repo's own status documents (`IMPLEMENTATION_STATUS.md` declares 12 modules "100% COMPLETE") describe an aspiration, not the code. Any future work must start by re-baselining truth — otherwise every new feature is built on the same unverified foundation.

---

## 2. Critical Defect Register

Consolidated from line-level review. Severity: 🔴 platform-defeating · 🟠 major · 🟡 significant.

### 2.1 Security & access control (the platform's reason to exist)

| # | Sev | Defect | Location |
|---|---|---|---|
| S1 | 🔴 | Global Keycloak guards commented out — **all 634 endpoints anonymous**; every `@Roles`/`@Resource` decorator is inert metadata | `backend/src/app.module.ts:110-113` |
| S2 | 🔴 | `access_tier` (`public`/`restricted`/`secret`) never filters any query. Sacred/secret records served to the world via `GET /v1/records` | `backend/src/records/records.service.ts:17-151` |
| S3 | 🔴 | Anonymous GDPR erasure & 2FA disable for any user by UUID | `backend/src/security/security.controller.ts:67-97` |
| S4 | 🔴 | Unauthenticated mass assignment: `PUT /v1/users/:id` passes `any` body into `repo.update` → set `role: 'admin'` | `backend/src/users/users.controller.ts:40-46` |
| S5 | 🔴 | `two_factor_secret` + plaintext `backup_codes` returned by unauthenticated `GET /v1/users/:id` (no `select:false`) | `backend/src/users/user-profile.entity.ts:27-31` |
| S6 | 🔴 | Frontend has **zero route protection** — `/admin`, `/dashboard/*`, `/profile`, `/security/2fa` reachable logged-out; middleware does locale only | `frontend/middleware.ts` |
| S7 | 🟠 | Access token exfiltrated to client JS via `/api/auth/session` response — nullifies httpOnly design | `frontend/app/api/auth/session/route.ts:14` |
| S8 | 🟠 | Token refresh implemented but never called; expiry written and never read; sessions die silently in ~5 min; JWT signature never verified, roles read from unverified base64 payload | `frontend/app/api/auth/refresh/route.ts`, `lib/authServer.ts:7-12` |
| S9 | 🟠 | 2FA validate endpoint accepts the TOTP **secret in the request body** — it's a code calculator, not an auth check; backup codes from `Math.random()`, stored plaintext, never burned | `backend/src/security/security.controller.ts:59-65`, `two-factor.service.ts:34` |
| S10 | 🟠 | `JwtAuthGuard` references passport strategy `'jwt'` that is never registered — the only 2 guarded routes 500 | `backend/src/auth/jwt-auth.guard.ts:5` |
| S11 | 🟠 | Open unauthenticated mail relay: `POST /v1/notifications/email` with arbitrary to/subject/body | `backend/src/notify/notify.controller.ts:12-26` |
| S12 | 🟠 | Order-by SQL injection surface on public search (`sort_by` only `@IsString()`, interpolated into `orderBy`) | `backend/src/records/records.service.ts:86` |
| S13 | 🟠 | Rate limiting registered but no `ThrottlerGuard` provided → inert. IP whitelist guard dead code. CSP disabled globally. GraphQL playground+introspection on in prod | `backend/src/app.module.ts:74-77`, `main.ts:14`, `graphql.module.ts:21-22` |
| S14 | 🟠 | Audit hash chain: race-prone (no transaction), digest omits timestamp/id (reorder undetectable), **no verify function, no read API**, and only access-requests are audited — record creation, exports, GDPR deletes, user changes are not | `backend/src/audit/audit.service.ts:11-20` |
| S15 | 🟡 | Keycloak client secret committed to git; `admin/admin` hardcoded in dev compose; weak prod fallbacks (`:-creoleredis`, `:-admin`) | `keycloak/realm-export/creole-realm.json:25`, `docker-compose.yml:54-55` |
| S16 | 🟡 | Access-request approval grants nothing — flips a status column; no permission is materialized; nothing ever consults it | `backend/src/access/access.service.ts:18-26` |
| S17 | 🟡 | Every backing service (Postgres, Redis, MinIO, Keycloak) published to host in prod compose; no TLS anywhere; `sslRequired: none` in realm | `docker-compose.prod.yml` |
| S18 | 🟡 | Unused `RichTextEditor` renders `dangerouslySetInnerHTML` without sanitization — stored-XSS trap if ever mounted | `frontend/components/RichTextEditor.tsx:38` |

### 2.2 Fabricated / simulated features presented as real

| # | Sev | Defect | Location |
|---|---|---|---|
| F1 | 🔴 | Blockchain anchoring fully simulated (random tx hashes, forced `confirmed`) yet exposed as legal evidence with etherscan URLs. Merkle verify also has an odd-node desync bug | `backend/src/blockchain/services/blockchain-anchor.service.ts:100-131, 232-243` |
| F2 | 🔴 | OCR/transcription return hardcoded strings; fake Canon EXIF + Port-au-Prince GPS written to every image; the service isn't even registered in its module — while the NLP service's real `/ocr` and `/transcribe` are never called | `backend/src/media/media-processing.service.ts:46-161` |
| F3 | 🟠 | GI portal (4 routes) + Knowledge-Graph portal (4 routes) render elaborate hardcoded fixtures ("Café Bonbon Bleu de Thiotte, $450,000") while 48+ real backend endpoints exist; `api-client.ts` has no GIAPI/KnowledgeGraphAPI at all | `frontend/app/[locale]/gi/*`, `knowledge-graph/*` |
| F4 | 🟠 | "Patent monitoring/alerts" have zero USPTO/EPO/WIPO integration — alerts are manually inserted rows | `backend/src/patent/` |
| F5 | 🟠 | Export job processor fabricates a `file_url` for a file never written, marks request `completed` → guaranteed 404 | `backend/src/jobs/export.processor.ts:44-45` |
| F6 | 🟠 | Translation endpoint is a 16-entry lowercase-exact-match dictionary; misses return `"[Translation needed: …]"`; `redactions_made: true` hardcoded | `nlp/main.py:92-151` |
| F7 | 🟡 | GraphQL `updateRecord` mutation ignores its input and returns the unchanged record — a no-op reporting success | `backend/src/graphql/records.resolver.ts:54-58` |
| F8 | 🟡 | `"Approved in demo"` persisted into the real audit note on every access-request decision | `frontend/app/[locale]/dashboard/requests/page.tsx:37` |

### 2.3 Broken-on-invocation code paths

| # | Sev | Defect | Location |
|---|---|---|---|
| B1 | 🔴 | Semantic search SQL selects `title`, `classification` — neither is a column (they're TS getters; real columns `title_ht`, `creole_class`) → every call throws | `backend/src/semantic/semantic.service.ts:181-184` |
| B2 | 🔴 | Both migrations broken: search-index migration targets table `record` (entity is `records`) — all 7 statements fail; pgvector functions declare `text` ids vs `uuid` columns | `backend/src/migrations/*` |
| B3 | 🟠 | Analytics dashboard passes `FindOperator`/`{}` into `QueryBuilder.where()` → malformed SQL; two routes read path params via `@Query()` → always `undefined` | `backend/src/analytics/analytics.service.ts:36-82` |
| B4 | 🟠 | ~19 frontend api-client paths 404 (or worse: `/legal/*/stats` matches `@Get('biopiracy/:id')` with `id="stats"`); `MedicineAPI.getFormulationsByPlant` doesn't exist → TypeError | `frontend/lib/api-client.ts` (multiple) |
| B5 | 🟠 | NestJS route-order shadowing: `@Get(':code')` declared before `@Get('search')` swallows IPC search; same pattern in DRM controller | `backend/.../ipc-classification.controller.ts:15-21` |
| B6 | 🟠 | Semantic controller DTOs are undecorated classes + global `forbidNonWhitelisted: true` → **every request rejected with 400** | `backend/src/semantic/semantic.controller.ts:18-28` |
| B7 | 🟠 | Bull queues registered with processors but **no producer ever enqueues a job** — indexing & export pipelines unreachable; `search_vector` column never populated, never queried | `backend/src/jobs/` |
| B8 | 🟡 | `lib/auth.ts` PKCE: sha256 returns an unawaited Promise cast `as any` → empty code challenge (dead module, but loaded) | `frontend/lib/auth.ts:49-52` |
| B9 | 🟡 | 8 dead-target internal links (`/medicine/conditions`, `/expert/network`, …); 54 links drop the locale prefix | `frontend/app/[locale]/*` (multiple) |
| B10 | 🟡 | CacheModule registered globally, never injected anywhere. MediaProcessingService + MediaEnhancedEntity + record-location/timeline entities orphaned. 8 of 14 frontend components dead (incl. entire dark-mode and language-switcher stack) | multiple |

### 2.4 Deployment, config, CI

| # | Sev | Defect | Location |
|---|---|---|---|
| D1 | 🔴 | Backend prod image cannot build: `npm ci --only=production` strips `@nestjs/cli`, then `npm run build` → "nest: not found" | `backend/Dockerfile.prod:12,19` |
| D2 | 🔴 | `nginx/` directory doesn't exist; prod compose mounts `./nginx/nginx.conf` → Docker creates empty dir → nginx crash-loops. No TLS assets anywhere | `docker-compose.prod.yml:144-145` |
| D3 | 🔴 | Frontend prod container crash-loops: compose `command: npm start` overrides CMD, but standalone image has no npm/next binaries | `docker-compose.prod.yml:56` |
| D4 | 🔴 | `synchronize: true` unconditional (comment says "dev only") — production auto-syncs schema **in the same database Keycloak creates ~90 tables in** | `backend/src/app.module.ts:69` + `docker-compose.prod.yml:87` |
| D5 | 🔴 | CI e2e job fails deterministically: `docker compose up` with no `.env` (Postgres refuses to init), waits on ports 4000/3000 (actual 4200/3101) without `\|\| true` | `.github/workflows/ci-cd.yml:184-191` |
| D6 | 🔴 | CORS default `http://localhost:3000` vs frontend on 3101; `API_CORS_ORIGIN` absent from `.env.example` (which defines unread `CORS_ORIGINS` instead) → all browser API calls blocked out of the box | `backend/src/main.ts:19`, `.env.example:65` |
| D7 | 🔴 | Keycloak realm redirect URIs allow `localhost:3000` only (actual 3101) → every login rejected with `Invalid parameter: redirect_uri`; `KEYCLOAK_URL` defaults to 8080 (actual 8090) | `keycloak/realm-export/creole-realm.json:17-18` |
| D8 | 🟠 | Prod Redis has `--requirepass` but backend cache + Bull never pass a password → NOAUTH failures | `docker-compose.prod.yml:128` vs `backend/src/cache/cache.config.ts` |
| D9 | 🟠 | README demo passwords all wrong (`adminpass` vs realm's `admin123` etc.); README/DEPLOYMENT/docs-site ports stale (20+ occurrences of pre-remap ports) | `README.md:230-234` etc. |
| D10 | 🟠 | Monitoring on isolated bridge network; backend has no `/metrics`/prom-client; postgres/redis exporters referenced but not defined; zero Grafana dashboard JSONs (5 advertised); Alertmanager `${ENV}` placeholders unexpandable; alert rules reference metrics nothing emits | `docker-compose.monitoring.yml`, `monitoring/*` |
| D11 | 🟠 | Env-var name mismatches silently disable features: `SMTP_PASS` vs `SMTP_PASSWORD` (mail never sends), `NLP_HOST/PORT` vs `NLP_SERVICE_URL`, `VECTOR_DIMENSION=384` vs 768-dim model/migration, `KEYCLOAK_CLIENT_ID=creole-client` vs realm's `creole-backend` | `.env.example` vs code (multiple) |
| D12 | 🟠 | No MinIO bucket bootstrap → first upload fails. No backup script/cron despite `./backups` mount. No `.dockerignore` in any service dir (`COPY . .` bakes local `node_modules`/`.env` into images). `NEXT_PUBLIC_API_URL` never passed as build-arg → client bundle hardcodes `localhost:4000` | multiple |
| D13 | 🟠 | Mobile app: no `app.json`/`babel.config.js`/`tsconfig.json`/assets/lockfile; depends on nonexistent package name `react-native-async-storage`; calls `/auth/login` which doesn't exist | `mobile/*` |
| D14 | 🟠 | NLP dev Dockerfile installs no tesseract/poppler/ffmpeg → OCR/transcription fail in the documented dev stack; ~1.2 GB models download at container start with no cache volume and a 20s health start-period (restart loop risk) | `nlp/Dockerfile` |

### 2.5 Quality & testing

| # | Sev | Defect |
|---|---|---|
| Q1 | 🔴 | **Zero executable tests platform-wide.** Backend: 6 spec files, no jest dep, no test script, specs test methods that don't exist. Frontend: jest config + 3 tests, no jest installed, tests import default exports from named-export modules and assert classes on components that use inline styles. E2E: 29+ tests depend on `data-testid` attrs (0 exist in frontend), a `/search` route that doesn't exist, credentials not in the realm; both Playwright configs unrunnable. |
| Q2 | 🟠 | CI is decorative: every lint/test step `\|\| true`-masked; only `npm run build` gates anything; published "prod" images are actually dev Dockerfile builds |
| Q3 | 🟠 | TypeScript `strict: false` frontend-wide; pervasive `any`; `useState<any>(null)` + deep property access = guaranteed null-derefs on API failure |
| Q4 | 🟠 | Search quality: `'simple'` dictionary (no stemming for FR/EN), per-row `to_tsvector` at query time (no persisted vector/index used), redundant leading-wildcard ILIKE, no trigram/fuzzy, no cross-lingual expansion — for a trilingual corpus |
| Q5 | 🟡 | Accessibility ~absent: 46 labels, 0 `htmlFor`; toxicity/safety conveyed by emoji+color only (a safety issue for a medicinal-plant database); no keyboard support; dark mode fully inert |
| Q6 | 🟡 | 12 heavy unused frontend deps (~1.5 MB): chart.js, leaflet, react-quill, react-hook-form, zod, etc. installed and unreachable |
| Q7 | 🟡 | Referential integrity sparse: 12 `@ManyToOne` across 43 entities; most cross-links are bare UUID strings with no FK |
| Q8 | 🟡 | Documentation debt: 10 root markdown files (~150 KB) with materially false status claims; docs-site ports/env schema stale; `GAP_ANALYSIS.md` ironically the most honest file |

---

## 3. Gap Analysis Against Purpose

The purpose (per the repo, and per the TKDL model it cites): **(a)** defensively publish Haitian TK in patent-examiner-usable form, **(b)** protect sacred/community knowledge with graded access and consent, **(c)** detect and fight biopiracy, **(d)** manage benefit-sharing, **(e)** serve Haitian communities in their language.

### Gap 1 — Protection is inverted (CRITICAL)
The single most important invariant — *secret knowledge stays secret* — is violated today. The platform currently **increases** biopiracy risk: it aggregates sensitive TK into one database and serves it anonymously. Until S1/S2/S6 are fixed, adding content is harmful. The TK Labels system is a name lookup with no linkage, no license terms, no enforcement; access-request approval grants nothing (S16); the `examiner_digest` concept (redacted view for patent examiners — the heart of the TKDL model) is an empty column nothing writes or serves.

### Gap 2 — No trustworthy prior-art artifact
TKDL's value is that a patent office can *rely* on it: dated, tamper-evident, examiner-formatted disclosures. CREOLE has: an unverifiable audit chain (S14), fabricated blockchain proofs presented as legal evidence (F1), no prior-art document generator, no WIPO ST.26/office export formats, and no dated defensive-publication pipeline. A patent challenge built on this evidence would collapse in examination.

### Gap 3 — No real patent-office integration
Zero connection to EPO OPS, USPTO/PatentsView, WIPO PATENTSCOPE, or Lens.org. "Biopiracy alerts" are hand-entered rows. There is no similarity matching between incoming patent applications and the TK corpus — the feature that actually prevented TKDL's 237 cases.

### Gap 4 — Creole is a façade
For a platform named CREOLE whose primary users are Haitian communities: the UI renders only hardcoded English (despite finished Kreyòl translations); ASR, OCR, and translation do not support Haitian Creole at any layer; search uses no language-aware analysis. Viable paths exist and are not used: **Meta NLLB-200** (translation, supports `hat_Latn`), **Meta MMS ASR** (supports Haitian Creole), Tesseract `hat` traineddata, and per-language Postgres FTS configs.

### Gap 5 — Community governance absent
No community entity as an owning party, no elder-council/community approval workflow bound to record visibility, no Local Contexts TK Label integration, no consent lifecycle (PIC is a free-text column with a findAll-only service), no data-sovereignty (CARE) posture. "Communities" are string fields.

### Gap 6 — Data layer cannot be trusted to evolve
`synchronize: true` in prod + broken never-run migrations + Keycloak in the same schema + no backups + sparse FKs = eventual data loss on a platform whose entire value is the permanence and provenance of its records.

### Gap 7 — Nothing proves anything works
Zero executable tests, decorative CI, no monitoring signal. Combined with the aspirational status docs, there is no feedback loop that distinguishes working features from theatre — which is how the current state came to be.

### Gap 8 — Operational reality
Fresh-clone dev experience is broken in four independent ways (env bootstrap, CORS, Keycloak redirect, wrong documented passwords); production literally cannot deploy (D1–D4). The mobile app and E2E suites are unstartable.

### What the platform does NOT need (yet)
- **More endpoints/entities.** At 634 endpoints with ~0% enforcement and near-0 data, surface area is a liability. Several modules (DRM's 53 endpoints, Blockchain's 31) should shrink or be quarantined until the core works.
- **A real blockchain.** OpenTimestamps (free, Bitcoin-anchored, verifiable) or RFC 3161 TSA timestamps deliver the actual legal need (provable prior existence) without gas costs, keys, or the current fabrication. Replace, don't extend, the simulated Ethereum layer.
- **Neo4j.** The graph module's Postgres node/edge tables plus recursive CTEs cover current scale; Neo4j "sync" fields are aspiration. Defer.

---

## 4. Review Notes by Subsystem (condensed)

**Backend (NestJS 10, ~28.8k LOC):** Best module: Medicine (genuine rich CRUD + stats). Largest: Expert (97 routes of CRUD + scoring arithmetic). Citation, Export (CSV/XLSX), Workflow state machine, MinIO media upload/presign, GDPR export, event tracking: real. Auth, tier enforcement, semantic search, jobs, cache, blockchain, media processing, patent monitoring: absent, broken, or simulated (see registers above). Validation exists globally but most controllers take `any` bodies, bypassing it.

**Frontend (Next.js 14 App Router, ~10.7k LOC):** Working: search/records/intake/access-request/benefit-contract flows, OIDC handlers. Broken: 12 routes calling dead paths (failures swallowed to empty states — a reviewer sees "no data", not "broken"), 8 mock-fixture routes, unwired i18n, no auth middleware, 8/14 dead components, split-brain styling (Tailwind vs inline styles), no react-query/SWR (three inconsistent fetch styles), `strict: false`.

**NLP (FastAPI, 454 lines):** Real Whisper/Tesseract/sentence-transformers/PIL-redaction. Weaknesses: dictionary translation, naive regex redaction (`\d{6,}` catches years/coords; sacred terms without word boundaries; `redactions_made` hardcoded true), no auth on any endpoint (published on host 8100), models download at import time, dev image missing system deps, no Creole support (see Gap 4).

**Infra:** Dev compose boots 5 of 7 services usefully; port table in PORTS.md accurate but every other doc stale. Prod compose triple-broken; monitoring observes only itself; CI's only real gates are `npm run build` ×2 and a 2.5 GB pip install; single squashed commit history (`8bca325`) — no revert granularity.

**Mobile (Expo RN):** 9 files; unbuildable and unwired (D13). Treat as a design sketch, not an app.

---

## 5. Priority Synthesis

Ordering principle: **stop harm → make truth visible → make the core real → then extend.**

1. **P0 — Lockdown & truth** (S1–S6, D6–D7, honest README): make the platform not-dangerous and bootable end-to-end. Days, not weeks.
2. **P1 — Auth & access enforcement done right**: Keycloak guards, tier filtering, materialized grants, frontend middleware, BFF tokens. This is the platform's core feature.
3. **P2 — Data layer integrity**: real migrations, FKs, indexes, backups, seed data.
4. **P3 — Honest frontend**: fix client paths, wire GI/KG portals to real endpoints, remove fixtures, wire i18n (Kreyòl-first), strict TS, shared components.
5. **P4 — Search & semantics that work**: persisted tsvector + GIN + per-language configs + trigram; fixed semantic search + real embedding pipeline via the jobs queue.
6. **P5 — Real media & Creole NLP pipeline**: backend→NLP wiring via Bull; MMS/NLLB for Creole ASR/translation; honest capability labeling.
7. **P6 — TK protection core**: TK Labels as enforceable licenses (Local Contexts), consent lifecycle, examiner digest generation, defensive-publication export, OpenTimestamps.
8. **P7 — Patent intelligence**: EPO OPS/PatentsView ingestion, TK-vs-application similarity matching, alert pipeline, examiner portal with real accounts.
9. **P8 — Ops maturity**: gating CI, test pyramid, prod deploy (nginx/TLS/secrets), monitoring that observes the app, backups/DR drills.
10. **P9 — Reach**: mobile rebuild (offline-first field collection), public API for institutions, analytics.

The companion documents translate this into a dated roadmap (`02-ROADMAP.md`) and full build prompts per phase (`03-BUILD-PROMPTS.md`).
