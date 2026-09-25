# SentinelAPI Security Agent Skills & Execution Strategies

This document defines the automated reasoning procedures and probing strategies executed by the SentinelAPI orchestrator.

## Skill 1: OpenAPI Contract Ingestion & Endpoint Normalization
1. Parse the provided OpenAPI 3.0.x / 3.1.x or Swagger 2.0 specification using `@apidevtools/swagger-parser`.
2. Extract all route paths, HTTP methods, operation IDs, security requirements, and JSON schemas.
3. Classify endpoints into categories:
   - **Auth Endpoints**: Login, register, token refresh.
   - **User / Profile Endpoints**: User management, `/me`, `/users/{id}`.
   - **Object CRUD Endpoints**: `/orders`, `/invoices`, `/products`.
   - **Admin / Telemetry Endpoints**: `/admin/*`, `/metrics`, `/stats`.

## Skill 2: Multi-Persona Stateful Probe Orchestration
1. **Bootstrap Personas**:
   - Persona A: `alice@sandbox.local` (Standard User)
   - Persona B: `bob@sandbox.local` (Attacker Persona)
2. **Stateful Sequence**:
   - Alice authenticates and creates a private object (e.g. Order #1002).
   - Bob authenticates and attempts to read / modify Alice's object directly.
   - Sentinel captures HTTP status codes, headers, and response bodies as cryptographic proof.
3. **Control Assertion**:
   - Probe non-vulnerable baseline routes (e.g. `/api/invoices/{id}`) to verify that legitimate 404/403 controls pass, eliminating false positives.

## Skill 3: Contract Violation & Schema Leak Analysis
1. Intercept JSON response payloads from profile and user routes.
2. Cross-reference returned JSON keys against OpenAPI `components.schemas.*` declarations.
3. Check for sensitive key patterns: `password`, `hash`, `ssn`, `secret`, `token`, `apiKey`, `internal`.
4. If undeclared sensitive properties are returned, generate an Excessive Data Exposure finding with payload evidence.

## Skill 4: High-Velocity Rate Limiting & Resource Exhaustion Probing
1. Dispatch burst batches (15-20 requests concurrently) to authentication endpoints.
2. Measure response latency, status codes, and HTTP throttling headers.
3. Assert whether `HTTP 429 Too Many Requests` is returned.

## Skill 5: Context-Aware LLM Remediation Synthesis
1. Extract the AST code context and route handler from the codebase or template catalog.
2. Format a structured prompt with the OWASP category, target method/route, reproduce evidence, and code snippet.
3. Call the Gemini API (`gemini-2.5-flash`) via `@google/genai` to generate:
   - Executive root cause explanation.
   - Step-by-step remediation guide.
   - Unified Git Diff patch in `diff` format (`--- a/...` `+++ b/...`).
   - Clean, corrected code snippet.
