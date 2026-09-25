# OWASP API Security Top 10 Knowledge Base

This knowledge base defines the core vulnerability heuristics, detection methods, and remediation patterns used by SentinelAPI.

## API1:2023 - Broken Object Level Authorization (BOLA / IDOR)
- **Description**: Object-level authorization flaws occur when an API endpoint accepts an object identifier (e.g. `/api/orders/{id}`) from the client and retrieves or modifies the corresponding record without verifying whether the authenticated user owns or has access rights to that object.
- **Attack Vector**: User B substitutes their own order ID with User A's order ID in a GET/PUT/DELETE request and receives unauthorized access (HTTP 200 OK with User A's data).
- **Detection Method**: Authenticate two separate user personas (Alice and Bob). Create a resource under Alice. Attempt to read or modify Alice's resource using Bob's Bearer token. If the response returns 200 OK and valid resource data, BOLA is confirmed.
- **Remediation**:
  - Implement tenant isolation and user ID matching (`order.userId === req.user.id`).
  - Reject unauthorized cross-tenant requests with `HTTP 403 Forbidden` or `HTTP 404 Not Found`.

---

## API2:2023 - Broken Authentication
- **Description**: Occurs when authentication mechanisms are poorly implemented or omitted entirely, allowing attackers to compromise authentication tokens or invoke protected functions anonymously.
- **Attack Vector**: Unauthenticated requests to private administrative or telemetry endpoints (e.g., `/api/admin/stats`) returning sensitive platform information without checking for a valid `Authorization: Bearer <token>` header.
- **Detection Method**: Issue unauthenticated HTTP requests without headers to sensitive endpoints. If the endpoint responds with HTTP 200 OK containing private metrics, user lists, or internal data, Broken Authentication is confirmed.
- **Remediation**:
  - Require valid JWT/Bearer token validation middleware on all non-public routes.
  - Return `HTTP 401 Unauthorized` when tokens are missing, expired, or invalid.

---

## API3:2023 - Broken Object Property Level Authorization (Excessive Data Exposure)
- **Description**: APIs often expose internal database objects directly to the client without filtering properties, relying on the client-side UI to filter out sensitive attributes.
- **Attack Vector**: Calling `/api/users/me` or `/api/users/{id}` returns sensitive fields such as `ssn`, `passwordHash`, `apiKey`, or internal staff notes.
- **Detection Method**: Compare received JSON response keys against the declared properties in the OpenAPI schema contract. Any undeclared sensitive property leaks confirm Excessive Data Exposure.
- **Remediation**:
  - Apply strict Data Transfer Objects (DTO) and allow-lists before serialization.
  - Only return fields explicitly declared in the API specification.

---

## API4:2023 - Unrestricted Resource Consumption (Rate Limiting)
- **Description**: When APIs fail to restrict the frequency or volume of requests, attackers can perform high-velocity automated credential stuffing, brute-force dictionary attacks, or resource exhaustion DoS.
- **Attack Vector**: Blasting high-velocity login attempts to `/api/auth/login` without being throttled.
- **Detection Method**: Fire 15-20 rapid concurrent requests in under 1 second. If no request returns `HTTP 429 Too Many Requests` and no `Retry-After` header is present, rate limiting is absent.
- **Remediation**:
  - Attach IP- and account-based rate limiting middleware.
  - Return `HTTP 429 Too Many Requests` with a standard `Retry-After` header when thresholds are exceeded.

---

## API5:2023 - Broken Function Level Authorization
- **Description**: Complex access control policies with different roles and administrative capabilities are not properly enforced by the backend handlers.
- **Attack Vector**: A standard non-privileged user sending requests to administrative routes (e.g., `/api/admin/stats` or `/api/admin/users`) and gaining access.
- **Detection Method**: Authenticate as a low-privileged user (e.g. `role: 'user'`) and attempt to access admin endpoints. If HTTP 200 OK is returned instead of HTTP 403 Forbidden, BFLA is confirmed.
- **Remediation**:
  - Enforce role-based access control (RBAC) middleware verifying `req.user.role === 'admin'`.
