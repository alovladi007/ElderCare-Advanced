# CREOLE — AYITI TKDL: Detailed Implementation Roadmap

**Companion to:** `01-PLATFORM-REVIEW-AND-GAP-ANALYSIS.md` (defect IDs like S1, D6, F2 refer to its registers)
**Planning basis:** verified code state at commit `8bca325`, not the repo's status documents.

## Guiding principles

1. **Stop harm first.** Until access control exists, the platform endangers the knowledge it exists to protect. No new features before Phase 1 completes.
2. **Truth over surface.** Delete or quarantine simulated features rather than shipping theatre. A smaller honest platform beats a wide hollow one.
3. **Kreyòl-first.** Haitian Creole is the product, not a locale option. Every phase carries an i18n/Creole acceptance criterion.
4. **Every phase ends verifiable.** Each phase defines acceptance tests that run in CI. If it isn't tested, it isn't done.
5. **Community sovereignty by design.** Access decisions trace to a community authority, consent is a lifecycle (grantable, revocable, auditable), and CARE principles govern data handling.

## Phase map

| Phase | Name | Duration (1–2 devs) | Depends on |
|---|---|---|---|
| 0 | Baseline, lockdown & bootability | 1–2 weeks | — |
| 1 | Authentication & access enforcement | 2–3 weeks | 0 |
| 2 | Data layer integrity | 2 weeks | 0 (parallel w/ 1) |
| 3 | Honest frontend & Kreyòl-first i18n | 3 weeks | 1 |
| 4 | Search that works (FTS + semantic) | 2–3 weeks | 2 |
| 5 | Media pipeline & Creole NLP | 3 weeks | 2 |
| 6 | TK protection core (labels, consent, digest, timestamping) | 3–4 weeks | 1, 2 |
| 7 | Patent intelligence & examiner portal | 4 weeks | 4, 6 |
| 8 | Testing, CI/CD & production operations | 3 weeks | starts Phase 0, hardens continuously |
| 9 | Mobile field collection & public API | 4 weeks | 3, 5 |

Total: ~6–8 months for 1–2 full-time developers; ~3–4 months for a team of 4. Phases 2, 8 run largely in parallel with their neighbors.

---

## Phase 0 — Baseline, lockdown & bootability (Week 1–2)

**Goal:** a fresh clone boots to a usable, honest, not-dangerous dev stack in one command.

### Workstreams
**0.1 Emergency lockdown (day 1)**
- Until real auth lands (Phase 1): register a temporary global guard denying all mutating verbs and all `restricted`/`secret` reads except allow-listed public routes (`GET /v1/records` public-tier-only, `GET /health`, auth flows). Crude tier filter (`WHERE access_tier='public'`) added to `RecordsService.findAll/findOne` and facets. [S1, S2 stopgap]
- Remove `two_factor_secret`/`backup_codes` from all API responses (`select: false` + DTO). [S5]
- Disable open mail relay endpoint, GDPR delete endpoints, and `PUT /v1/users/:id` mass-assignment until Phase 1 re-enables with auth. [S3, S4, S11]

**0.2 One-command boot**
- `make dev` / `setup.sh`: copies `.env.example` → `.env` if absent, boots compose, waits on health, seeds demo data, creates MinIO bucket (`mc mb` init container or `makeBucket` on service start). [D12]
- Fix `.env.example`: add missing read vars (`API_CORS_ORIGIN`, `KEYCLOAK_URL`, `KEYCLOAK_REDIRECT_URI`, `ADMIN_EMAIL`), remove/rename the 12 unread ones, fix `SMTP_PASS`, `NLP_SERVICE_URL` consumers or names, `VECTOR_DIMENSION=768`, `KEYCLOAK_CLIENT_ID=creole-backend`. [D6, D11]
- Align Keycloak realm: redirect URIs/web origins → `http://localhost:3101`, backend 4200; parametrize or regenerate client secret; fix README demo passwords to match realm (or realm to match README — pick one). [D7, D9, S15]
- `depends_on` with `condition: service_healthy` for backend → db/redis/keycloak/minio; add healthchecks to backend/frontend/nlp in dev compose.
- NLP dev image: install tesseract + poppler + ffmpeg; add model cache volume; move model loading behind startup with a longer health `start_period`. [D14]

**0.3 Truth pass on docs & dead code**
- Rewrite `README.md` Quick Start (ports, passwords, commands verified by actually running them). Move `IMPLEMENTATION_STATUS.md`, `SESSION_SUMMARY.md`, `NEW_FILES_SUMMARY.md`, old `GAP_ANALYSIS.md`/`IMPLEMENTATION_ROADMAP.md` into `docs/archive/` with a banner noting they describe aspiration, not state. [Q8]
- Delete dead code: `frontend/lib/auth.ts` [B8], duplicate LanguageSwitcher, `AuthContext`, root `playwright.config.ts` (keep `e2e/`), `backend/src/swagger.config.ts`, unused security configs — or quarantine under `attic/` if deletion is contested.
- Label simulated features in-UI and in-API: blockchain module returns `501 Not Implemented` (see Phase 6 for its replacement); media-processing stubs removed [F1, F2 quarantine].
- Prune unused frontend deps (chart.js, leaflet, quill, etc. — reintroduce when actually used). [Q6]

**Acceptance criteria**
- `git clone && make dev` → login works with documented credentials, search shows seeded public records, upload works, no CORS errors — verified on a clean machine.
- Anonymous user cannot read any non-public record or hit any mutating endpoint (integration test).
- No endpoint returns fabricated data (grep-audit of known stub strings passes in CI).

---

## Phase 1 — Authentication & access enforcement (Weeks 2–5)

**Goal:** every request is authenticated, authorized, tier-filtered, and audited. This phase IS the product.

### Workstreams
**1.1 Backend authN (Keycloak, properly wired)**
- Fix the DI issue that led to the commented-out guards; register `AuthGuard`, `ResourceGuard`, `RoleGuard` from `nest-keycloak-connect` as global `APP_GUARD`s; annotate genuinely public routes with `@Public()` deliberately (public-tier search, health, docs). [S1]
- Delete the phantom passport `jwt` guard or implement a real JWKS-validating strategy for service-to-service tokens. [S10]
- Map Keycloak `realm_access.roles` correctly in `RolesGuard`. Roles: `admin`, `examiner`, `community_steward`, `expert`, `community_user`, `researcher`.

**1.2 Access-tier enforcement engine**
- Central `AccessPolicyService`: given (user, record) → `full | digest | none`, deciding on `access_tier`, materialized grants, community membership, and role. Applied in records find/search/facets/semantic/GraphQL resolvers and media presign. [S2]
- Materialize approvals: approving an access request writes an `access_grant` row (scope, record/collection, expiry, granted_by); policy service consults it; grants revocable and auditable. [S16]
- `secret` tier: never leaves the DB unencrypted except to explicitly granted stewards; excluded from exports, embeddings, facets, and logs.

**1.3 Endpoint hygiene sweep**
- Replace all `@Body() any` with validated DTOs (class-validator) module by module; `@IsIn` whitelist for `sort_by`/`sort_order`. [S4, S12, B6]
- Enable `ThrottlerGuard` globally with route-tier overrides; wire the existing rate-limit config or delete it. [S13]
- Re-enable GDPR/user endpoints behind self-or-admin checks; 2FA validate reads the secret server-side, burns backup codes, uses `crypto.randomBytes`, encrypts secret at rest. [S3, S9]
- CSP on outside GraphQL path; playground/introspection gated by `NODE_ENV`. [S13]

**1.4 Frontend auth completion**
- `middleware.ts`: session check + redirect for `/admin`, `/dashboard`, `/profile`, `/security`, `/intake`, role-gated segments. [S6]
- BFF pattern: remove `token` from `/api/auth/session` response; proxy authenticated API calls through a route handler that attaches the token server-side; auto-refresh via `expires_at` + refresh route; verify JWT (JWKS) server-side before trusting roles. [S7, S8]
- Logout with `id_token_hint`; env-driven redirect URIs (no hardcoded localhost:3000).

**1.5 Audit that can testify**
- Rewrite chain append inside a serialized transaction (advisory lock); digest includes id, timestamp, prev-hash; add `GET /v1/audit/verify` (recompute chain) and paged read API (admin).
- Audit interceptor: record create/update, media upload, exports, grant/revoke, GDPR actions, 2FA changes, login events. [S14]

**Acceptance criteria**
- Contract test matrix: (anonymous, community_user, steward-of-community, examiner, admin) × (public, restricted, secret record) × (read, search, media, export) — every cell asserted in CI.
- OWASP-style checks: mass assignment attempt, IDOR on another user's profile, order-by injection payload, replayed TOTP code — all rejected (tests).
- Audit verify endpoint returns `valid: true` over 10k concurrent-written entries.
- Session survives >5 min of use (auto-refresh proven by an E2E test with short token TTL).

---

## Phase 2 — Data layer integrity (Weeks 2–4, parallel)

**Goal:** schema changes are migrations, relationships are foreign keys, data survives disasters.

### Workstreams
- **2.1 Migrations for real:** `data-source.ts`; `migration:generate/run/revert` scripts; `synchronize: false` everywhere (incl. seed script); baseline migration generated from current entities; fix and re-cut the two broken migrations (table name `records`, uuid params) [B2, D4]; `migrationsRun: true` on boot or an entrypoint step.
- **2.2 Referential integrity:** FK constraints for the bare-UUID links (usage_tracking→resource, anchors→records, alerts→records, KG edges→nodes, formulation links); `ON DELETE` policies chosen per relation; orphan-cleanup migration first. Register or delete orphaned entities (record-location, record-timeline, media-enhanced). [Q7, B10]
- **2.3 Indexes that match queries:** GIN on `tk_labels`, `ipc_codes`, `region` jsonb; functional GIN for FTS (or persisted tsvector — Phase 4); `pg_trgm` extension; verify with `EXPLAIN` in a migration test.
- **2.4 Separate Keycloak database** in prod compose (`keycloak` schema/db, own user). [D4]
- **2.5 Backups:** pg_dump sidecar (daily full, hourly WAL if warranted) to MinIO with retention; MinIO bucket versioning for media; documented, **rehearsed** restore runbook; backup-success metric.
- **2.6 Seed data v1:** realm users, 20–50 real public-domain plant records (TRAMIL-sourced), IPC starter set, one demo community + steward, sample formulations — enough that every portal shows real data in dev.

**Acceptance criteria**
- CI job boots Postgres, runs all migrations from empty → asserts schema equals entity metadata (no drift), then `migration:revert` twice cleanly.
- Kill-and-restore drill documented and executed: restore from backup on a clean stack within RTO 1h, data intact.
- `synchronize` grep = 0 outside test helpers.

---

## Phase 3 — Honest frontend & Kreyòl-first i18n (Weeks 5–8)

**Goal:** every route renders real data, in the user's language, accessibly.

### Workstreams
- **3.1 API client rebuild:** generate a typed client from the backend OpenAPI spec (openapi-typescript + fetch wrapper or orval), replacing the hand-rolled 812-line client and its ~19 dead paths [B4]; adopt TanStack Query for caching/retry/error surfaces; central error envelope (status-aware, no more silent empty states — show real error UI).
- **3.2 De-mock the portals:** wire GI (4 routes) and Knowledge Graph (4 routes) to their real 48+ endpoints; delete every fixture array; add `GIAPI`/`KG` client namespaces (or generated equivalents). [F3] Fix `getFormulationsByPlant` and dead-link targets; locale-prefix all 54 bare links. [B9]
- **3.3 i18n wiring:** adopt `next-intl` (App Router-native); provider in `app/[locale]/layout.tsx`; migrate the existing 150-key catalogs; replace hardcoded strings page by page (nav → search → record → intake → portals); mount the App-Router language switcher; default locale `ht`. Add missing keys for portal pages (new catalogs grow in all 4 locales together — CI check for key parity, which today is already perfect and must stay so).
- **3.4 Design-system pass:** shared `Button/Card/Input/Badge/Table/EmptyState/ErrorState` primitives; kill inline-style pages; one spinner; `loading.tsx`/`error.tsx`/`not-found.tsx` per segment; `notFound()` for missing records (no more 200-for-404).
- **3.5 TypeScript strict:** `strict: true`, model API response types (from the generated client), eliminate `any` in app code; fix the null-deref surfaces this exposes.
- **3.6 Accessibility & dark mode:** `htmlFor` on all labels; text alternatives for all emoji/color status (esp. plant toxicity badges [Q5]); keyboard/Escape/focus management on menus and modals; `darkMode: 'class'` + mount ThemeProvider/Toggle; axe-core CI check on key pages.

**Acceptance criteria**
- Zero hardcoded fixture data (CI grep for the known mock arrays).
- Switching to Kreyòl renders every migrated page fully in Kreyòl; locale persisted; `ht` is default. Translation-key parity check green.
- `tsc --noEmit` with `strict: true` passes; Playwright smoke over every route asserts non-empty real data or a designed empty state (not silent-catch emptiness).
- axe: no critical violations on the 10 core pages; toxicity conveyed in text.

---

## Phase 4 — Search that works (Weeks 8–10)

**Goal:** trilingual keyword search with ranking, and semantic search that returns rather than throws.

### Workstreams
- **4.1 Persisted FTS:** `search_vector` maintained by DB trigger (not the unreachable job): `setweight(to_tsvector('french', title_fr…)) || to_tsvector('simple', title_ht…) || to_tsvector('english', abstract_en…)`; GIN index; query via `websearch_to_tsquery` per language + `ts_rank_cd`; `ts_headline` snippets; drop the redundant leading-wildcard ILIKE; keep `pg_trgm` similarity as fuzzy fallback for Kreyòl orthographic variants (`fèy`/`fey`). [Q4]
- **4.2 Kreyòl analysis:** custom simple dictionary + synonym file mapping common Kreyòl orthography variants and plant-name synonyms (leverage the medicine DB's multilingual name columns as a synonym source); cross-field search (a Kreyòl query matches `name_kreyol` in plants and `title_ht` in records).
- **4.3 Semantic search repair:** fix the SQL (real columns `title_ht`, `creole_class`) [B1]; decorate the DTOs [B6]; embedding pipeline: on record create/update → enqueue Bull `indexing` job (the first real producer [B7]) → NLP `/embeddings` → pgvector column; re-cut pgvector migration with uuid params [B2]; HNSW index; hybrid endpoint (FTS ∪ vector, reciprocal-rank fusion); **tier filter applied before ranking** (policy service from Phase 1).
- **4.4 Facets & UX:** fix facet queries to respect access policy; add facet counts to the typed client; search page: language toggle, snippets, "did you mean" from trigram.

**Acceptance criteria**
- Gold-set relevance test in CI: ≥20 trilingual queries against seeded corpus with expected top-3 assertions (e.g. Kreyòl `asosi` finds the Momordica record; French `fièvre` finds fever formulations).
- Semantic search returns 200 with ranked results; embeddings exist for 100% of non-secret seeded records within 1 min of creation (queue metric).
- `EXPLAIN` in tests proves index usage (no seq-scan on records for FTS path).
- No `secret`-tier record ever appears in results/facets/embeddings for unauthorized callers (test).

---

## Phase 5 — Media pipeline & Creole NLP (Weeks 10–13)

**Goal:** uploads actually get transcribed, OCR'd, and redacted — with honest Creole capability.

### Workstreams
- **5.1 Wire backend → NLP:** delete stub `MediaProcessingService` returns [F2]; on upload, enqueue Bull `media-processing` job → NLP `/transcribe` (audio/video, ffmpeg-extracted audio), `/ocr` (images/PDF), `/redact_text`; persist results (register `MediaEnhancedEntity` properly or fold fields into `media`); job status API + UI progress; export processor actually writes the file to MinIO and links it [F5].
- **5.2 Creole ASR:** replace/augment Whisper with **Meta MMS** (supports Haitian Creole) or a fine-tuned Whisper checkpoint; language routing: `ht` → MMS, `fr`/`en` → Whisper; store model+confidence with every transcript; human-correction UI flag (transcripts are drafts until steward-approved).
- **5.3 Real translation:** replace the 16-entry dictionary with **NLLB-200** (`hat_Latn` ↔ `fra_Latn`/`eng_Latn`), distilled 600M on CPU or GPU tier; keep the dictionary as a glossary-override layer for domain/sacred terms; translation memory table; label every machine translation as machine-generated pending review. [F6]
- **5.4 OCR for Haiti's documents:** add `tesseract-ocr-hat` traineddata + `fra`; PDF pipeline hardening; confidence thresholds → human review queue.
- **5.5 Redaction hardening:** word-boundary sacred-term matching from a steward-managed term list (per community, DB-backed, not hardcoded); fix `\d{6,}` overreach; return actual `redactions_made` count [F6]; redaction runs before any non-steward view of restricted media.
- **5.6 NLP service ops:** internal-network-only (remove host port in prod), shared-secret auth between backend and NLP, model cache volume, warm-up endpoint, resource limits, batch endpoints for backfills.

**Acceptance criteria**
- E2E: upload Kreyòl audio → transcript appears with language tag + confidence; upload PDF → searchable text indexed into FTS; both via queue with visible status.
- Translation quality gate: chrF/BLEU on a small held-out Kreyòl↔French set beats the dictionary baseline by a wide margin (it will); zero `"[Translation needed"` strings reachable in product.
- Redaction test-suite: sacred terms redacted with word boundaries; count accurate; secret-tier media never leaves MinIO without a grant.
- NLP endpoints unreachable from outside the compose network in prod config; authenticated from backend.

---

## Phase 6 — TK protection core (Weeks 12–16)

**Goal:** the features that make this a TKDL, not a CMS: enforceable labels, living consent, examiner digests, provable timestamps, community governance.

### Workstreams
- **6.1 Communities as first-class:** `Community` entity (name, region, governance contacts, steward users via Keycloak groups); records/media/plants/formulations get real FK ownership; steward role scoped to their community's assets; elder-council/steward approval step wired into the existing workflow state machine (a record with community ownership cannot go `published` without steward approval).
- **6.2 TK Labels made real:** align the label catalog with **Local Contexts** TK Labels & Notices (TK Attribution, TK Non-Commercial, TK Sacred/Secret, TK Community Voice, etc.); `record_labels` join with per-assignment terms; label → policy hooks in `AccessPolicyService` (e.g., TK NC blocks commercial-purpose API keys; TK Secret forces `secret` tier); labels rendered on records and embedded in all exports/citations.
- **6.3 Consent lifecycle:** consent entity upgraded: type (PIC/MAT), scope, grantor (community authority), evidence attachment (signed doc/recorded oral consent), effective/expiry, revocation with cascade rules (revoke → record reverts to restricted, exports blocked, dependents flagged); consent status surfaced on records; ABS agreements reference consent records.
- **6.4 Examiner digest pipeline:** implement the empty `examiner_digest`: steward-approved redacted summary per record (auto-drafted from title/abstract/formulation fields minus sacred/locational data, human-approved); digest is the *only* view an `examiner` role receives for restricted records; PDF prior-art document generator (record → dated, formatted disclosure with IPC codes, digest text, hash, timestamp proof).
- **6.5 Honest timestamping (replaces fake blockchain):** rip out the simulated anchor service [F1]; implement **OpenTimestamps**: hash record content (canonical JSON) → aggregate daily Merkle root → OTS calendar servers (free, Bitcoin-attested) → store `.ots` proof; verify endpoint runs real OTS verification; optional RFC 3161 TSA as second signer; backfill anchoring for existing records; UI: "Prior existence provable as of {date}" with downloadable proof. Fix/retire the odd-node Merkle bug via the OTS library rather than hand-rolled trees.
- **6.6 Defensive publication export:** batch export of digests in patent-office-friendly formats (searchable PDF bundle + XML index), matching how TKDL delivers to examiners; export event audited + labeled.

**Acceptance criteria**
- Policy matrix extended with labels/consent: e.g., record with TK-Sacred label is invisible to examiner role but its digest is not (if steward-approved); revoked consent flips access within one request cycle (tests).
- A generated prior-art PDF for a seeded record verifies: content hash matches, OTS proof validates against Bitcoin headers (or pending-attestation state honestly labeled).
- No code path can publish a community-owned record without a steward-approval event in the audit log.
- Every export artifact carries labels + attribution + timestamp proof reference.

---

## Phase 7 — Patent intelligence & examiner portal (Weeks 16–20)

**Goal:** the biopiracy-prevention loop: watch patent filings, match against the corpus, alert, arm the legal module with evidence.

### Workstreams
- **7.1 Ingestion connectors:** EPO OPS API (free tier) + USPTO PatentsView/bulk XML + WIPO PATENTSCOPE where feasible; scheduled Bull jobs pulling new applications in TK-relevant IPC subclasses (A61K36 herbal preparations, A23L, C12G, etc. — seeded from the IPC module); normalized `patent_application` store.
- **7.2 Matching engine:** candidate generation: IPC overlap + keyword (plant scientific/vernacular names from medicine DB) + embedding similarity (NLP service) between application claims/abstract and record digests; scoring with explainable factors; threshold → creates `PatentAlert` rows automatically (finally real [F4]) with linked evidence.
- **7.3 Alert triage workflow:** alert queue UI for `examiner`/`admin`: review match, attach records, escalate → creates a `BioPiracyCase` pre-filled with evidence package (digests, timestamp proofs, prior-art PDFs); notification to affected community stewards.
- **7.4 Examiner portal hardening:** examiner accounts (Keycloak role + registration/verification flow); portal search runs digest-only view; citation recording actually implemented (replaces the `alert('coming soon')`); export in examiner formats; API keys for office integrations with rate limits + usage tracking (the DRM module's tracking finally called by real code paths).
- **7.5 IPC data load:** run the existing seeder against the real WIPO IPC scheme file (or the master-file subset for relevant sections); TK-relevance flags curated.

**Acceptance criteria**
- Replay test: feed the matcher a known historic biopiracy patent (e.g., a turmeric/neem-style test fixture adapted to a seeded Haitian record) → alert fires with the right record in top-3 evidence.
- Nightly ingestion job runs in staging for a week without manual intervention; lag metric < 48h behind office publication.
- Examiner login → sees digests only; attempt to fetch full restricted record via API → policy denies (test).
- One end-to-end drill: alert → case → generated evidence package (PDF bundle) → all artifacts verifiable.

---

## Phase 8 — Testing, CI/CD & production operations (continuous; hard push Weeks 18–21)

**Goal:** the platform proves itself on every commit and can be deployed, observed, and restored.

### Workstreams
- **8.1 Test pyramid from zero [Q1]:** backend: jest + `@nestjs/testing` installed *and scripted*; unit tests for policy service, audit chain, matching engine; supertest integration suite for the Phase 1 access matrix (this is the crown jewel — it guards the mission). Frontend: vitest/jest actually installed; component tests for primitives; the 3 existing test files fixed or replaced. E2E: one Playwright setup (in `e2e/`), `data-testid`s added to the UI, tests rewritten against real routes/locales/realm users; runs against the compose stack in CI. Coverage gates modest but enforced (start 40%, ratchet).
- **8.2 CI that gates [Q2, D5]:** remove every `|| true`; jobs: lint (eslint installed + configured both apps), typecheck, unit, integration (services via compose), e2e (correct ports, `.env` bootstrap step), image build (prod Dockerfiles — fixed in 8.3), migration-from-empty check, translation-parity check, dead-fixture grep. Branch protection on main.
- **8.3 Production deploy for real [D1–D3, D8, D12]:** fix backend `Dockerfile.prod` (multi-stage: build with dev deps → runtime prune); remove compose `command` overrides; author `nginx/` (TLS termination, HTTP→HTTPS, proxy routes, security headers, rate limit) + certbot automation; secrets via env/secret store, no defaults for credentials (fail-fast boot check); Redis password wired into cache+Bull; internal services off the host network; `.dockerignore` per service; image tags = git SHA; staging environment + promote flow; rollback procedure documented and drilled.
- **8.4 Observability that observes [D10]:** `prom-client` in backend (`/metrics`: http histograms, queue depth, policy denials, audit appends); shared compose network or scrape via published ports; postgres/redis exporters actually defined; 4–5 Grafana dashboards committed as JSON (API health, queue/jobs, DB, auth/security events, NLP latency); Alertmanager templated correctly (no `${ENV}` placeholders) with a real receiver; alert rules referencing metrics that exist; Loki retention via compactor.
- **8.5 Runbooks:** deploy, restore, key rotation, incident response (incl. "sacred data exposed" breach procedure — this platform needs one), on-call basics.

**Acceptance criteria**
- CI red when: a public endpoint regresses to exposing restricted data; a translation key goes missing; a migration breaks; coverage drops below gate. (Prove each by intentional break.)
- `docker compose -f docker-compose.prod.yml up` on a fresh VM with a filled `.env` → all services healthy behind TLS; smoke suite green against it.
- Grafana shows live traffic; a forced backend 5xx storm fires an alert to the configured receiver within 5 min.
- Restore drill and rollback drill both executed and documented.

---

## Phase 9 — Mobile field collection & public API (Weeks 20–24)

**Goal:** reach the knowledge where it lives (rural, offline) and serve institutions.

### Workstreams
- **9.1 Mobile rebuild [D13]:** re-scaffold Expo (app.json, babel, tsconfig, assets, lockfile, correct AsyncStorage package); Keycloak OIDC via `expo-auth-session` (no fake `/auth/login`); Kreyòl-first UI reusing the i18n catalogs; **offline-first field collection**: record drafts + audio + photos captured offline (SQLite/WatermelonDB), background sync with conflict handling; GPS capture with a privacy switch (sacred sites default to region-level precision); steward review queue for field submissions.
- **9.2 Public/institutional API:** versioned read API over public-tier + digest data; API keys with scopes/quotas (usage recorded via the DRM tracking service); OpenAPI docs published; terms embedding TK label obligations.
- **9.3 Impact analytics:** the analytics module repaired [B3] and focused: submissions by community, examiner citations, alert outcomes, benefit-sharing totals — the numbers Haiti's ministries and WIPO will ask for; public impact page.

**Acceptance criteria**
- Field test: airplane-mode capture of a record with audio + photo → sync on reconnect → appears in steward queue (E2E on device farm or emulator CI).
- Mobile app builds in CI (EAS or expo prebuild) from clean checkout.
- External key holder can query public API within quota; restricted data provably absent from all public API responses (contract test).

---

## Cross-cutting tracks (run through all phases)

- **Data acquisition:** TRAMIL-informed plant seeding → community documentation drives (Phase 6+ tooling) → IPC full load (Phase 7). Content is the moat; schedule real data-entry capacity from Phase 2 onward.
- **Legal/governance:** validate label taxonomy, consent forms, and examiner terms with Haitian legal counsel + community representatives; Nagoya/ABS review of benefit module before real contracts.
- **Language quality:** Kreyòl reviewer for every new catalog addition; glossary of domain terms (botany, legal) maintained bilingually.
- **Security reviews:** external pen test after Phase 1 and again before public launch (Phase 8).

## Sequencing summary & first 30 days

Weeks 1–2: Phase 0 complete (lockdown + boots-clean + honest docs).
Weeks 2–5: Phase 1 (auth/enforcement) with Phase 2 (data layer) in parallel.
Day 30 checkpoint: access matrix tests green in gating CI — the platform is safe to put data into. Everything after that is capability, in the order above.
