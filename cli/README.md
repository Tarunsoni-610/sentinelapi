# Sentinel-Agent CLI 🛡️

Autonomous Terminal API Security Scanner & Conversational AI Agent for SentinelAPI.

## Quick Start

### 1. Installation & Global Linking
```bash
cd cli
npm install
npm link # Or: sudo npm link (if global node_modules requires elevated permissions)
```

Alternatively, invoke directly via project root:
```bash
npm run cli -- scan
# or
node cli/bin/sentinel.js scan
```

---

## Commands & Usage

### 🛡️ 1. Security Scan (`sentinel scan`)
Runs stateful OWASP API Top 10 security audit probes against target API:
```bash
# Interactive mode (default in TTY)
sentinel scan

# Automated non-interactive mode for CI/CD
sentinel scan --no-interactive --target http://localhost:4000 --spec ./sandbox-api/openapi.yaml --fail-on high

# Export JSON output
sentinel scan --json --fail-on none > report.json
```

**Options:**
- `-t, --target <url>`: Target API base URL (defaults to `sentinel.config.json` or `http://localhost:4000`)
- `-s, --spec <pathOrUrl>`: Path or URL to OpenAPI specification (YAML/JSON)
- `-m, --modules <list>`: Comma-separated modules (`bola`, `broken_auth`, `excessive_data_exposure`, `rate_limiting`)
- `-i, --interactive` / `--no-interactive`: Enable/disable interactive triage loop
- `-j, --json`: Output raw JSON report
- `-q, --quiet`: Suppress banners and progress spinners
- `--fail-on <severity>`: Exit with code 1 if findings meet or exceed severity (`critical`, `high`, `medium`, `low`)
- `--api-key <key>`: Override Gemini API Key

---

### 💬 2. Interactive Agent Chat (`sentinel chat` / `sentinel agent`)
Launch a multi-turn conversational AI Security Agent while coding:
```bash
sentinel chat --agent owasp_auditor
```

**Agent Personas:**
- `owasp_auditor` (default): OWASP Top 10 vulnerability detection & root-cause dissection.
- `secure_integrator`: Zero-trust API client/server integration, HMAC signatures, token rotation & Zod schema validation.
- `remediation_copilot`: Production-grade Unified Git Diff patch generation.
- `pentester`: Stateful multi-persona exploit chains, cURL PoCs & adversary simulation.

**In-Chat Slash Commands:**
- `/agent [name]`: Switch persona on the fly
- `/repo <url|path>`: Clone a GitHub repository or attach local workspace
- `/file <relPath>`: Read and load a source file into agent context
- `/spec [path]`: Load an OpenAPI schema into context
- `/config`: Inspect current `sentinel.config.json`
- `/set <key> <value>`: Modify configuration on the fly
- `/scan`: Trigger live OWASP audit probes
- `/clear`: Reset conversation memory
- `/export`: Export session transcript to Markdown
- `/help`: Show command cheat sheet
- `/exit`: Leave chat

---

### 🐙 3. GitHub Repository Cloning & Inspection (`sentinel clone`)
```bash
sentinel clone https://github.com/org/api-service --dest ./.sentinel/repos
```
Auto-discovers OpenAPI/Swagger specifications and Express/Fastify/NestJS route controllers.

---

### ⚙️ 4. Configuration Management (`sentinel config`)
```bash
# View active configuration
sentinel config show

# Update a setting
sentinel config set target http://localhost:8080

# Initialize sample sentinel.config.json
sentinel config init
```

---

### ⚡ 5. Sandbox Patch Verification (`sentinel verify`)
```bash
sentinel verify bola-orders
sentinel verify bola-orders --revert
```

---

### 🛠️ 6. AI Code Remediation (`sentinel remediate`)
```bash
sentinel remediate --patch-id bola-orders
```

---

## Running Tests
Execute the comprehensive ESM integration test suite:
```bash
npm --prefix cli test
```
All 8 integration test suites verify CLI help, audit scans, exit codes, diff generation, sandbox verification, repo discovery, offline agent fallback, and configuration updating.
