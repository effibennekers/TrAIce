# Code Review: TrAIce Repository Security Posture
**Date**: 2026-10-08  
**Ready for Production**: No  
**Critical Issues**: 0

## Scope Reviewed
- Backend application and container: `backend/`
- Dashboard application and container: `dashboard/`
- Runtime/orchestration and ingress: `docker-compose.yml`, `nginx/default.conf`

## Tooling and Scan Notes
- Static/manual review completed across frontend, backend, and infrastructure files.
- Runtime container/image vulnerability scanners were executed after this review:
  - Docker Scout was unavailable on this machine (`docker scout` command not found).
  - Trivy scan run on `traice-backend:prod-test`: **74 high, 0 critical** vulnerabilities (30 without fix available yet).
  - Trivy scan run on `traice-dashboard:prod-test`: **0 high, 0 critical** vulnerabilities.

## Findings

### High

#### 1) Internal Services Exposed Directly on Host, Bypassing Ingress Controls
**Severity**: High  
**Evidence**:
- `docker-compose.yml:15` (`backend` publishes host port `8000:8000`)
- `docker-compose.yml:43` (`dashboard` publishes host port `5173:5173`)
- `docker-compose.yml:66` (`nginx` publishes `8080:80`)

**Risk explanation**:  
Publishing backend and dashboard directly allows clients to bypass `nginx` controls and any edge hardening policy (future WAF, centralized TLS, request filtering, rate limiting, uniform headers). This undermines zero-trust segmentation and increases attack surface.

**Specific remediation steps**:
1. In production compose/deployment, publish only the ingress service (for example `nginx`) to the host.
2. Remove host `ports` for backend/dashboard and use internal Docker networking (`expose` or internal service discovery only).
3. Add network-level policy to restrict east-west access to only required service pairs.

#### 2) Compose Targets Development Images (Hot Reload) Rather Than Production Runtime
**Severity**: High  
**Evidence**:
- `docker-compose.yml:8` (`backend` build target is `development`)
- `docker-compose.yml:35` (`dashboard` build target is `development`)
- `backend/Dockerfile:23` (development command uses `uvicorn ... --reload`)
- `dashboard/Dockerfile:25` (development command runs dev server bound on `0.0.0.0`)

**Risk explanation**:  
Development targets are not production-hardened (hot reload, larger attack surface, mutable runtime assumptions, and debug-oriented behavior). If deployed outside local development, this materially increases exploitation and reliability risk.

**Specific remediation steps**:
1. Create a production deployment manifest that explicitly uses `target: production` for backend/dashboard.
2. Keep the current compose file as dev-only and add a separate production compose (or orchestrator manifests).
3. Enforce deployment guardrails in CI/CD so production cannot ship `development` targets.

#### 3) Ingress Is HTTP-Only (No TLS Termination or Redirect in Nginx)
**Severity**: High  
**Evidence**:
- `nginx/default.conf:7` (`listen 80;` only)
- `nginx/default.conf:16` and `nginx/default.conf:39` (`X-Forwarded-Proto` set from `$scheme`)

**Risk explanation**:  
Without HTTPS termination and redirect, traffic can be transmitted in cleartext and is vulnerable to interception/modification in non-local environments. This conflicts with production confidentiality/integrity requirements.

**Specific remediation steps**:
1. Add TLS listener (`listen 443 ssl;`) with managed certificates.
2. Add HTTP to HTTPS redirect on port 80.
3. Ensure upstream apps consistently receive `X-Forwarded-Proto=https` behind TLS termination.

### Medium

#### 4) Container Runtime Hardening Is Incomplete in Orchestration Layer
**Severity**: Medium  
**Evidence**:
- `docker-compose.yml` has no service-level hardening keys such as `read_only`, `cap_drop`, `security_opt: [no-new-privileges:true]`, `tmpfs`, or explicit `user` for `nginx` service.
- `docker-compose.yml:63` (`nginx:1.27-alpine` default runtime user is not constrained in compose)

**Risk explanation**:  
Even with distroless/nonroot app images, missing runtime constraints allows broader post-compromise movement and persistence (filesystem writes, privilege primitives, container breakout blast radius).

**Specific remediation steps**:
1. Add `read_only: true` where feasible, with explicit writable `tmpfs` mount points.
2. Add `cap_drop: ["ALL"]` and only add back required capabilities.
3. Add `security_opt: ["no-new-privileges:true"]`.
4. Set explicit non-root `user` and resource limits (`pids_limit`, memory/cpu constraints).

#### 5) Unpinned Base Images by Digest Increase Supply-Chain Drift Risk
**Severity**: Medium  
**Evidence**:
- `backend/Dockerfile:4` (`python:${PYTHON_VERSION}-slim`)
- `backend/Dockerfile:25` (`gcr.io/distroless/python3-debian13:nonroot`)
- `dashboard/Dockerfile:5` (`node:${NODE_VERSION}-alpine`)
- `dashboard/Dockerfile:36` (`gcr.io/distroless/nodejs26-debian13:nonroot`)
- `docker-compose.yml:63` (`nginx:1.27-alpine`)

**Risk explanation**:  
Tag-based pulls can silently change over time, causing unplanned vulnerability exposure or behavior drift between builds.

**Specific remediation steps**:
1. Pin all runtime/base images to immutable digests (`@sha256:...`).
2. Add automated digest update workflow with vulnerability gating.
3. Produce and store SBOM/provenance artifacts in CI.

#### 6) Nginx Edge Hardening Is Minimal (No Rate Limiting/Timeout Guardrails/Security Headers)
**Severity**: Medium  
**Evidence**:
- `nginx/default.conf` contains proxy routes but no `limit_req`, `limit_conn`, hardened proxy timeout directives, or explicit security headers at ingress.

**Risk explanation**:  
Absence of edge controls increases DoS susceptibility and allows inconsistent security header behavior if upstream applications change.

**Specific remediation steps**:
1. Add request/connection limiting (`limit_req_zone`, `limit_req`, `limit_conn`).
2. Add hardened proxy/body timeout and size constraints.
3. Set baseline headers at ingress (`X-Content-Type-Options`, `X-Frame-Options`, CSP, referrer policy) and keep apps aligned.

#### 7) Backend API Has No Authentication/Authorization Controls
**Severity**: Medium  
**Evidence**:
- `backend/app/main.py:61`, `backend/app/main.py:72`, `backend/app/main.py:77`, `backend/app/main.py:89` (public GET endpoints)
- No auth dependency/middleware enforcement visible in route declarations.

**Risk explanation**:  
Any reachable client can query API resources. If data sensitivity grows beyond mock data, this becomes immediate unauthorized data exposure and abuse risk.

**Specific remediation steps**:
1. Introduce authN/authZ middleware/dependencies (JWT or service-to-service token model).
2. Define endpoint-level authorization policy and least-privilege roles.
3. Add audit logging for authenticated access.

### Low

#### 8) Cookie Written Client-Side Without `Secure`/`SameSite` Attributes
**Severity**: Low  
**Evidence**:
- `dashboard/src/components/ui/sidebar.tsx:86` (writes `document.cookie` with `path` and `max-age` only)

**Risk explanation**:  
State cookie can be sent in more contexts than needed. While not sensitive, this weakens default browser-side protections.

**Specific remediation steps**:
1. Add `SameSite=Lax` (or `Strict`) and `Secure` in HTTPS contexts.
2. Consider moving non-essential UI state to local storage when acceptable.

#### 9) CSP in App Server Allows `unsafe-inline` for Scripts/Styles
**Severity**: Low  
**Evidence**:
- `dashboard/server.cjs:172` (CSP includes `script-src 'self' 'unsafe-inline'` and `style-src 'self' 'unsafe-inline'`)

**Risk explanation**:  
`unsafe-inline` weakens XSS mitigation and allows inline script/style execution if an injection path appears.

**Specific remediation steps**:
1. Move toward nonce/hash-based CSP and remove `unsafe-inline`.
2. Enforce CSP at ingress as well for consistency.

## Container Hardening Assessment (Production Targets)

### Backend production target (`backend/Dockerfile`)
- Positive:
  - Distroless runtime and non-root user (`backend/Dockerfile:25`, `backend/Dockerfile:40`).
  - Dev dependencies excluded (`backend/Dockerfile:19` with `--no-dev`).
- Gaps:
  - Base/runtime image tags not digest-pinned.
  - No explicit runtime healthcheck in Dockerfile.
  - Runtime hardening depends on orchestrator; compose currently does not apply hardening controls.

### Dashboard production target (`dashboard/Dockerfile`)
- Positive:
  - Distroless runtime and non-root user (`dashboard/Dockerfile:36`, `dashboard/Dockerfile:51`).
  - Production dependency install (`dashboard/Dockerfile:19`).
  - Basic proto hardening (`dashboard/Dockerfile:42`, `NODE_OPTIONS=--disable-proto=delete`).
- Gaps:
  - Base/runtime image tags not digest-pinned.
  - Runtime hardening not enforced at orchestration level.

## Explicit Statement on Critical/High
- Critical findings: **None**.
- High findings: **Present (3)**.

## Residual Risks
- Current compose appears development-oriented; accidental production reuse is a major residual risk.
- If API data evolves from mock to sensitive, absence of auth/rate limiting becomes materially higher impact.
- Without image scanning/SBOM in CI, newly introduced CVEs may go undetected between releases.

## Quick Wins (Max 8)
- [ ] Create separate production deployment manifests using `target: production` only.
- [ ] Publish only ingress externally; remove host ports for backend/dashboard.
- [ ] Enable TLS termination + HTTP->HTTPS redirect in ingress.
- [ ] Add compose hardening: `read_only`, `cap_drop: [ALL]`, `no-new-privileges`, explicit non-root user.
- [ ] Pin all container images to immutable digests.
- [ ] Add `trivy`/`grype` image scans and SBOM generation in CI.
- [ ] Add API authentication/authorization middleware and policy.
- [ ] Add ingress rate limits and proxy timeout/body-size guardrails.
