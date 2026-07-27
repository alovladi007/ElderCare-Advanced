# ElderCare-Advanced — Six-Month Build/Fix Plan

Companion to [`PLATFORM_AUDIT.md`](./PLATFORM_AUDIT.md). Finding IDs (C1, H4, S6, F1…) refer to that document.

**Assumed team:** 2–3 full-stack engineers, 1 designer/accessibility specialist part-time from M2, 1 security/compliance advisor part-time from M3. Adjust durations proportionally, but **do not reorder the phases** — each depends on the previous one.

---

## Guiding decisions

Four decisions determine whether this plan succeeds. Make them before writing code.

**1. Delete the demo scaffolding. Do not port it.**
14 modules (~12,900 LOC) are unreachable, do not compile, and mostly return `Math.random()`. Salvage `advanced-nlu`, `event-streaming`, and `telemedicine` into a branch for later; **delete the rest outright**, especially `voice-health` (invents clinical risk scores) and `blockchain` (fabricates audit hashes). Keeping them costs compile time, review attention, and credibility. If a capability is wanted later, rebuild it against a real schema with real tests.

**2. Narrow to one app tree.**
`backend/` + `client/` are live. `frontend/`, `platform/`, `monitoring-backend/`, `server/`, `smart-home-platform/` are not. Archive them to a branch and delete from `main`. Three of them ship their own JWT verification with a *different* secret — that is a security liability, not just clutter.

**3. Treat the smart-home engine as the product core.**
It is real, tested by hand in this audit, and working. Everything else is either supporting it (auth, care management) or noise.

**4. Fix the documentation as you go, and delete the rest.**
39 status files, several asserting the opposite of the code. Replace with one `README.md`, one `ARCHITECTURE.md`, and ADRs going forward. Do this in M1 while the findings are fresh.

---

## Month 1 — Stop the bleeding, make it buildable

**Goal:** no anonymous access to PHI or safety devices; the app compiles; CI tells the truth.

### Week 1 — Security triage (ship daily, in this order)
| # | Fix | Effort |
|---|---|---|
| C1 | Delete `app.useStaticAssets(...uploads...)` in `main.ts:56`. Serve files only via an authorized handler | 1 line |
| C10 | Remove the card-number/CVV fields from `PaymentCheckout.jsx`; integrate real Stripe Elements, or disable the payment screen behind a flag until it is real. **Never again render a success screen that isn't tied to a charge** | 1 day |
| C3, C4 | `@UseGuards(JwtAuthGuard, RolesGuard)` on `home`/`device`/`automation`/`emergency` controllers; `NODE_ENV`-gate `SimulatorController` out of production | 2 hours |
| C2 | `RegisterDto` — `@IsEmail`, `@IsStrongPassword`, `@IsIn(['FAMILY','ELDER'])`. Privileged roles only via an authenticated admin flow | 3 hours |
| C7 | `path.basename()` + resolved-prefix assertion in `storage.controller.ts:149` and `:191` | 1 hour |
| H7 | Remove both `JWT_SECRET` fallbacks; fail fast at boot if unset. **Rotate the secret — assume it is burned** | 1 hour |
| C11 | Delete the hardcoded-ADMIN block in `UnifiedDashboard.jsx:40` and the auto-login in `MonitoringDashboard.jsx:37`; remove the global `axios.defaults` mutation | 3 hours |

Close the week with an external scan against a deployed instance to confirm each is actually closed, not just changed in source.

### Week 2 — Make the frontend function
- **C9** `response.token` → `response.access_token`; standardize on one token key.
- **C13** Make `useAuth` return `{ error, isLoading, clearError }`, or stop destructuring them. Add a React error boundary so this class of bug is visible rather than silent.
- **C12** Fix all 23 `/care/*` → `/care-management/*` call sites plus the 6 path mismatches in `api.client.js`. **Then write one integration test per endpoint group that fails if a client path 404s** — this is the check that was missing.
- **F3** `useParams()` in `ElderProfilePage` and `CareManagementDashboard`; implement the 5 missing `smartHomeService` methods; replace `import.meta.env` with `process.env.REACT_APP_*`.
- Collapse 4 API clients into 1.

### Week 3 — Compile and test honestly
- Fix the **32 compile errors in wired modules** (`smart-home` 16, `care-management` 16) — mostly schema drift: `prisma.elder` → `prisma.elderProfile`, `medicationName` → `name`, alert enum mismatches.
- **Delete the 14 dead modules** (decision 1). This removes ~255 of the 287 errors at a stroke. Target: `tsc --noEmit` clean.
- Repair the 11 failing test suites (mostly DI wiring in `Test.createTestingModule`).
- Fix `backend/Dockerfile` (`npm ci --only=production` then `tsc` cannot work).

### Week 4 — CI that can fail, and honest docs
- Remove every `|| true` from `ci.yml`. Add the missing `lint` scripts. Fix the artifact path (`client/dist` → `client/build`) and the `VITE_*` → `REACT_APP_*` env vars. Wire in the Playwright specs.
- Add `npm audit --audit-level=high` as a **blocking** gate, plus Dependabot and secret scanning (gitleaks).
- Enforce the existing 60% coverage threshold on `backend/src` — set it to current-actual and ratchet up, so it can never regress.
- Delete the 39 status markdown files; write one honest `README.md` and `ARCHITECTURE.md`.
- Archive and delete the 5 dead app trees (decision 2).

**Exit criteria:** `npm ci && npm run build && npm test` green from a clean clone · zero anonymous access to PHI or actuators · login works · CI blocks on failure.

---

## Month 2 — Authorization

**Goal:** every PHI request is authorized against a real relationship model. This is the single largest correctness gap and cannot be parallelized with M1.

1. **Schema first (S6).** Nothing links a family member or caregiver to an elder, so the guard is currently unwritable. Add:
   ```prisma
   model CareRelationship {
     id           String   @id @default(uuid())
     userId       String
     elderId      String
     relationship RelationshipType   // FAMILY | CAREGIVER | CLINICIAN | POA
     permissions  Json               // scoped: vitals, meds, location, billing
     grantedAt    DateTime @default(now())
     grantedBy    String
     revokedAt    DateTime?
     @@unique([userId, elderId])
     @@index([userId])
   }
   ```
2. **`ElderAccessGuard` + `@ElderParam('elderId')`** resolving the caller's authorized elder set. Deny by default. Model it on `notifications.controller.ts:21-40` — the one controller that already scopes to `req.user.userId`.
3. **Apply to all ~40 PHI handlers.** Write the deny test *first* for each: a second user must receive 403.
4. **Fix RBAC ordering (H5).** Remove `RolesGuard` from `APP_GUARD`; use a composite `JwtRolesGuard`. Add `if (!user) throw new UnauthorizedException()`. Add a `@Public()` decorator for genuinely public routes.
5. **DTOs everywhere (H8, C8).** All 40 handlers. Kill every `@Body() body: any`, and never spread a request body into a Prisma write.
6. **Frontend route protection (C11).** A real `ProtectedRoute` wrapper with role gating on all 49 routes.

**Exit criteria:** an authenticated user cannot read or modify any elder they have no `CareRelationship` with — proven by an automated test per endpoint, not by inspection.

---

## Month 3 — HIPAA technical safeguards

Bring in the compliance advisor at the start of this month, not the end.

| Safeguard | Work | Finding |
|---|---|---|
| §164.312(b) Audit controls | `PhiAccessInterceptor` writing append-only `DataAccessLog` on **every** PHI access including denials. Revoke UPDATE/DELETE from the app DB role. 6-year retention | H4 |
| §164.312(a)(2)(iii) Automatic logoff | 15-min access tokens + rotating refresh tokens stored server-side; check `isActive` and `passwordChangedAt` in `JwtStrategy.validate`; real logout; idle timeout in the UI | H6 |
| §164.312(d) Authentication | TOTP/WebAuthn MFA, mandatory for ADMIN and CLINICIAN | H6 |
| §164.312(a)(2)(iv) Encryption at rest | `pgcrypto` or TDE for the highest-sensitivity columns; `sslmode=require` | H8 |
| §164.312(e) Transmission security | TLS termination + HSTS in front of every listener; no plaintext listener | H8 |
| §164.312(c)(1) Integrity | Soft-delete (`deletedAt`, `deletedBy`, `createdBy`) on all PHI models via Prisma middleware; replace the 53 `onDelete: Cascade` rules on clinical records with archival | S5, S7 |
| §164.502(b) Minimum necessary | Scope `CareRelationship.permissions` per data class | — |
| Consent & retention | Consent model, retention windows, right-to-erasure path (blocked today by the `Restrict` rules in S6) | M7 |

Also this month: **C5** — real IoT token validation. Store a deterministic HMAC-SHA256 lookup key (the current bcrypt `@unique` column is why the check was stubbed out), verify `homeId` binding, support expiry and revocation.

Move tokens from `localStorage` to `httpOnly; Secure; SameSite=Strict` cookies and add CSRF protection at the same time.

**Exit criteria:** a third-party HIPAA readiness assessment with no critical findings. Book it for early M4 so M3 has a real deadline.

---

## Month 4 — Accessibility (F1)

**Treat this as a product workstream with a specialist, not a cleanup task.** The users are seniors with low vision, tremor, arthritis, and cognitive impairment. Today the app has 2 ARIA attributes across 84 files and renders clinical values at 14px in `text-gray-400` over animated gradients.

- **Design pass first.** Establish a 16px base (18px preferred), a palette that clears 4.5:1 (7:1 for clinical values) on *static* backgrounds, and 44×44 minimum targets. This will change the dark-glassmorphism look — that is the correct trade.
- **Component library rebuild.** `Button` sizes, `Input` with `aria-describedby`/`aria-invalid`, `Modal` with focus trap and `role="dialog"`, real focus-visible styles. Replace the 9 native `confirm()` calls with the existing accessible `Modal` — one of them gates cancelling an active emergency.
- **Keyboard and screen reader.** Skip link, landmarks, heading hierarchy, `tabIndex` and key handlers on custom clickables, `aria-live` for alerts and errors, `aria-hidden` on decorative icons.
- **Motion.** Honor `prefers-reduced-motion`; remove the permanent 10–20s background animation loops.
- **User preferences.** Text-size control and high-contrast mode, persisted.
- **Automated + human testing.** `jest-axe` in CI, `@axe-core/playwright` on key flows, then **usability testing with actual users over 70** — the only way to validate this.
- Restore the full `no-restricted-globals` rule (F4).

**Exit criteria:** WCAG 2.2 AA on all primary flows, verified by an external audit, plus recorded sessions with 5+ users in the target demographic.

---

## Month 5 — Data model and performance

- **S4 — FK indexes on 40 models.** The cheapest performance win in the repo; Postgres does not auto-index foreign keys and `getUnifiedProfile` fans out across ~12 of them. Add composites: `@@index([elderId, recordedAt])` on `VitalReading`, `@@index([elderId, status, triggeredAt])` on `Alert`.
- **S9, S10, S11 — deduplicate.** Merge `MedicationDose`/`MedicationLog` (two sources of truth for **medication adherence** — a safety-critical metric), `SensorEvent`/`SensorReading`, `AccessLog`/`DataAccessLog`. Convert ~30 shadow strings to their existing enums; delete `RoleAssignment.role String`, a second authorization vocabulary nothing consults.
- **S8 — normalize PHI out of Json blobs** into `Condition`, `Allergy`, `Surgery`, `Prescription` with ICD-10/RxNorm coding. Enables "which elders are allergic to penicillin" and per-field access control.
- **S2, S3, S6, S12 — relations, cascade rules, split the `ElderProfile` god-model**, remove the duplicated `firstName`/`lastName`.
- **Observability.** Prometheus `/metrics`, OpenTelemetry tracing, `/healthz` + `/readyz` (none exist), container healthchecks, frontend error tracking (`@sentry/react` — there is none today), alerting on emergency-path failures.
- **Load test the emergency path.** Establish and enforce a latency budget from sensor event → caregiver notification. For a safety product this is the number that matters most, and it is currently unmeasured.

---

## Month 6 — Production readiness

- **Frontend platform.** Migrate off deprecated CRA (Vite recommended — the repo already has a Vite app to learn from). This is what unblocks the 33 high-severity advisories that cannot otherwise be patched (C14). Add real code splitting, a bundle budget, and fix the PWA: either remove the service worker or make it network-first with `/api` excluded — **never serve cached vitals** (F4).
- **Deployment.** Stop committing build artifacts to the repo root (the live site is 7 months stale and ships a 1.7 MB source map). Real CD from CI. Multi-stage Dockerfiles, non-root `USER`, `.dockerignore`. Infrastructure as code — there is currently zero (no k8s, Helm, or Terraform).
- **Data lifecycle.** Automated encrypted backups, tested restore, retention jobs, `LocationTracking`/`SensorEvent` purge.
- **Test depth.** Controller tests, E2E for the critical safety paths (fall → alert → escalation → caregiver ack), 70%+ coverage on `backend/src`, frontend component tests (0 today).
- **Security validation.** External penetration test and a threat model for the IoT ingestion path. Budget two weeks for remediation of what it finds.
- **Operations.** On-call runbook, incident response plan, HIPAA breach-notification procedure, documented RTO/RPO.

**Exit criteria:** clean external pen test · WCAG 2.2 AA verified · HIPAA readiness assessment passed · one-command deploy · measured emergency-path latency under budget.

---

## Deliberately deferred

Do not restart these until the above is done and stable:

**Robotics, blockchain, edge computing, computer vision, voice health analysis, ML prediction.** They are unreachable, do not compile, and mostly return random numbers. Rebuild any that survive product prioritization — as separately scoped projects, against a real schema, with real integrations and real tests. **`voice-health` in particular must never be enabled as written**: it generates Parkinson's, stroke, and depression risk alerts from `Math.random()`.

---

## Using this as an agent prompt

To hand a phase to an autonomous agent, use this frame:

> You are working on ElderCare-Advanced, a HIPAA-regulated elder-care platform. Read `PLATFORM_AUDIT.md` for verified findings and `SIX_MONTH_PLAN.md` for sequencing. Execute **Month N** only.
>
> **Rules.**
> 1. This system handles PHI and controls physical safety devices. A regression can expose patient data or silence a real emergency. When a change touches auth, PHI access, or the emergency path, write the failing test first.
> 2. Do not mark work complete based on code reading. Verify against the running instance (`http://localhost:9401`, seeded via `npm run seed`) with an actual request, and paste the output.
> 3. Never simulate. No `Math.random()` standing in for a measurement, no `setTimeout` standing in for an integration, no success response for an action that did not occur. If an integration cannot be completed, leave the feature disabled and say so — that is what produced the findings in this audit.
> 4. Report honestly. If a fix is partial, say which part. If a test fails, paste it. Do not add a status markdown file claiming completion; that habit produced 39 documents asserting the opposite of the code.
> 5. Each finding ID you close: state the ID, the fix, and the verification command with its real output.
>
> **Definition of done for the phase:** every listed exit criterion demonstrated with command output, `npm run build` and `npm test` green, and no new `|| true` anywhere in CI.
