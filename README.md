# 🛡️ SentinelAPI

> **Autonomous Stateful API Security Scanner & AI-Powered Vulnerability Remediation Platform**

SentinelAPI is an end-to-end API Dynamic Application Security Testing (DAST) and autonomous remediation suite. It assesses OpenAPI contracts against live target APIs, executes stateful authorization boundary probes, detects sensitive data exposure, and synthesizes unified git patches using Google Gemini or OpenAI.

---

## 🏛️ Architecture

SentinelAPI is structured into three microservices:

```
┌─────────────────────────┐      ┌─────────────────────────┐      ┌─────────────────────────┐
│       dashboard/        │      │        scanner/         │      │      sandbox-api/       │
│    React + Vite + TW    │ ───> │     Express (5000)      │ ───> │     Express (4000)      │
│       (Port 5173)       │      │  Stateful DAST + LLM    │      │   Vulnerable Testbed    │
└─────────────────────────┘      └─────────────────────────┘      └─────────────────────────┘
```

1. **`sandbox-api/` (Port 4000)**: Intentionally vulnerable target API featuring authenticated endpoints, order management, profile inspection, admin stats, and an in-memory patch control plane (`/__sandbox/patches/:id/apply`).
2. **`scanner/` (Port 5000)**: Stateful security scanning engine that parses OpenAPI 3.0+ specs, executes multi-tenant authorization probes, detects credential & PII leakage, tests brute-force rate limiting, and uses LLMs (Gemini/OpenAI) to generate unified diff patches.
3. **`dashboard/` (Port 5173)**: Modern Dark/Light Mode Cybersecurity UI with live telemetry terminal, security posture score gauge, cURL PoC generator, code diff viewer, and an interactive **"Apply Sandbox Patch & Re-test"** real-time fix verification loop.

---

## 🔍 Vulnerability Coverage & OWASP Top 10 API 2023

| OWASP Category | Vulnerability | Target Endpoint | Behavior | Verified Patch Behavior |
| :--- | :--- | :--- | :--- | :--- |
| **API1:2023** | Broken Object Level Auth (BOLA / IDOR) | `GET /api/orders/{id}` | User B can read User A's orders | Owner-only check (`403 Forbidden` for non-owners) |
| **API3:2023** | Excessive Data Exposure & PII Leak | `GET /api/users/me` | Leaks `passwordHash`, `ssn`, `apiKey`, `internalNotes` | Strict DTO allow-list (`id, email, name, role`) |
| **API2:2023 / API5:2023** | Missing Authentication / Broken RBAC | `GET /api/admin/stats` | Open to unauthenticated callers | Enforces `authenticate` + `requireAdmin` (`401/403`) |
| **API4:2023** | Unrestricted Resource Consumption | `POST /api/auth/login` | No brute-force rate limit | 10 req / 10s per IP, then `429 + Retry-After` |
| **Control Baseline** | Baseline Negative Controls | `GET /api/invoices/{id}`, `GET /api/products` | Properly secured | Zero false positives confirmed |

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+) & npm
- (Optional) Docker & Docker Compose

### 1. Local Development Setup

Clone the repository and install all dependencies:

```bash
git clone https://github.com/Tarunsoni-610/sentinelapi.git
cd sentinelapi
git checkout mahak

# Install dependencies for all 3 services
npm run install:all
```

### 2. Run Test Suites

```bash
npm test
```

### 3. Start Services

Open three terminals or run background processes:

```bash
# Terminal 1: Vulnerable Target Sandbox (Port 4000)
npm run start:sandbox

# Terminal 2: Security Scanner Service (Port 5000)
npm run start:scanner

# Terminal 3: Dashboard UI (Port 5173)
npm run dev:dashboard
```

Visit the dashboard in your browser at **`http://localhost:5173`**.

---

## 🐳 Running with Docker Compose

To start all 3 services simultaneously with a single command:

```bash
docker compose up --build
```

- **Dashboard**: `http://localhost:5173`
- **Scanner**: `http://localhost:5000`
- **Sandbox API**: `http://localhost:4000`

---

## 🤖 LLM Remediation & Dynamic API Keys

SentinelAPI supports dynamic, per-session API keys for LLM patch generation:
- **Google Gemini**: Uses `gemini-2.5-flash` for rapid root cause analysis and git diff synthesis.
- **OpenAI**: Uses `gpt-4o-mini` with structured JSON output.
- **Offline / Fallback Mode**: If no API key is supplied, SentinelAPI uses built-in high-fidelity production patch templates with full unified git diffs.

You can configure keys dynamically via the **"LLM Keys"** button in the dashboard navigation bar.

---

## 🧪 Real-time Fix Verification Loop

1. Run the live scan from the Dashboard against `http://localhost:4000`.
2. Inspect any detected finding (e.g. **BOLA on Orders**).
3. Review the reproducible **cURL PoC** and the **AI-generated Code Diff**.
4. Click **"Apply Sandbox Patch & Re-test"** in the Interactive Verification tab.
5. Watch the endpoint dynamically update from `200 OK (Vulnerable)` to `403 Forbidden`, instantly promoting the status to `FIX VERIFIED (SECURE)`.
