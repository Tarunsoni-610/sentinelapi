# 🚀 Sentinel-Agent CLI — Complete Command Cheat Sheet & Execution Reference

This file contains all commands, flags, workflows, and interactive slash commands for the SentinelAPI Autonomous CLI Agent.

---

## 📋 Table of Contents
1. [Quick Execution & Setup](#1-quick-execution--setup)
2. [Configuration Management (`sentinel config`)](#2-configuration-management-sentinel-config)
3. [Repository Cloning & Workspace Discovery (`sentinel clone`)](#3-repository-cloning--workspace-discovery-sentinel-clone)
4. [OWASP Security Audit Scans (`sentinel scan`)](#4-owasp-security-audit-scans-sentinel-scan)
5. [AI Remediation & Patch Synthesis (`sentinel remediate`)](#5-ai-remediation--patch-synthesis-sentinel-remediate)
6. [Live Sandbox Patch Verification (`sentinel verify`)](#6-live-sandbox-patch-verification-sentinel-verify)
7. [Interactive Security Agent Chat (`sentinel chat`)](#7-interactive-security-agent-chat-sentinel-chat)
8. [In-Chat Slash Commands Reference](#8-in-chat-slash-commands-reference)
9. [Integration Testing & Verification](#9-integration-testing--verification)

---

## 1. Quick Execution & Setup

### Direct Invocation (No Global Permissions Required)
```bash
# Run from repository root
node cli/bin/sentinel.js <command>

# Or via npm script
npm run cli -- <command>
```

### Global Installation
```bash
cd cli
npm install
npm link # (or sudo npm link on macOS if /usr/local is root-owned)
sentinel --help
```

### Set Optional Gemini API Key
```bash
export GEMINI_API_KEY="your-gemini-api-key"
```

---

## 2. Configuration Management (`sentinel config`)

```bash
# 1. Initialize sample sentinel.config.json in project root
sentinel config init

# 2. Display active configuration
sentinel config show

# 3. Output configuration in JSON format
sentinel config show --json

# 4. Set target API base URL
sentinel config set target http://localhost:4000

# 5. Set OpenAPI specification path
sentinel config set spec ./sandbox-api/openapi.yaml

# 6. Set default AI Agent persona
sentinel config set defaultAgent secure_integrator

# 7. Set CI/CD failure threshold
sentinel config set failOn high

# 8. Enable or disable AI diff enrichment
sentinel config set enrichWithAi true
```

---

## 3. Repository Cloning & Workspace Discovery (`sentinel clone`)

```bash
# 1. Inspect current local workspace for OpenAPI specs and route controllers
sentinel clone ./

# 2. Output local workspace discovery as raw JSON
sentinel clone ./ --json

# 3. Clone a remote GitHub repository into .sentinel/repos and auto-discover specs
sentinel clone https://github.com/expressjs/express

# 4. Clone with custom destination directory
sentinel clone https://github.com/org/payment-service --dest ./my-cloned-repos
```

---

## 4. OWASP Security Audit Scans (`sentinel scan`)

```bash
# 1. Interactive terminal scan with interactive finding triage loop
sentinel scan

# 2. Non-interactive scan against custom target and OpenAPI specification
sentinel scan --no-interactive --target http://localhost:4000 --spec ./sandbox-api/openapi.yaml

# 3. Run specific OWASP security modules (BOLA, Broken Auth, Excessive Exposure, Rate Limiting)
sentinel scan --modules bola,broken_auth

# 4. CI/CD Pipeline Mode (Fail build with exit code 1 if findings >= high)
sentinel scan --no-interactive --fail-on high

# 5. CI/CD Pipeline Mode with Critical threshold
sentinel scan --no-interactive --fail-on critical

# 6. Export complete audit findings to JSON file
sentinel scan --json --fail-on none > audit-report.json

# 7. Quiet mode (suppress branding banners and spinners)
sentinel scan --no-interactive --quiet --json
```

---

## 5. AI Remediation & Patch Synthesis (`sentinel remediate`)

```bash
# 1. Generate AI Unified Git Diff patch for BOLA finding
sentinel remediate --patch-id bola-orders

# 2. Generate patch for Excessive Data Exposure finding
sentinel remediate --patch-id excessive-exposure-me

# 3. Generate patch for Broken Authentication finding
sentinel remediate --patch-id missing-auth-admin-stats

# 4. Generate patch for Rate Limiting finding
sentinel remediate --patch-id login-rate-limit

# 5. Output structured remediation diff in JSON format
sentinel remediate --patch-id bola-orders --json
```

---

## 6. Live Sandbox Patch Verification (`sentinel verify`)

```bash
# 1. Apply patch live against sandbox target and verify authorization controls
sentinel verify bola-orders

# 2. Verify Excessive Data Exposure fix on sandbox
sentinel verify excessive-exposure-me

# 3. Verify Admin Authentication fix on sandbox
sentinel verify missing-auth-admin-stats

# 4. Verify Rate Limiter on sandbox
sentinel verify login-rate-limit

# 5. Revert patch back to vulnerable baseline state
sentinel verify bola-orders --revert

# 6. Output verification result as JSON
sentinel verify bola-orders --json
```

---

## 7. Interactive Security Agent Chat (`sentinel chat`)

```bash
# 1. Launch interactive chat with OWASP Top 10 Security Auditor (Default)
sentinel chat

# 2. Launch chat with Secure API Integration Specialist
sentinel chat --agent secure_integrator

# 3. Launch chat with Live Remediation Copilot
sentinel chat --agent remediation_copilot

# 4. Launch chat with API Penetration Testing Agent
sentinel chat --agent pentester

# 5. Launch chat pre-bound to a specific local workspace or repository
sentinel chat --repo ./sandbox-api

# 6. Launch chat pre-bound to an OpenAPI contract
sentinel chat --spec ./sandbox-api/openapi.yaml
```

---

## 8. In-Chat Slash Commands Reference

Type these commands directly inside the `sentinel chat` prompt:

| Slash Command | Description | Example |
| :--- | :--- | :--- |
| `/agent [name]` | Switch AI Persona on the fly (`auditor`, `integrator`, `copilot`, `pentester`) | `/agent secure_integrator` |
| `/repo <url\|path>` | Clone remote GitHub repo or bind local workspace | `/repo https://github.com/org/api` |
| `/file <relPath>` | Read and inject a code file into agent context | `/file sandbox-api/src/routes/users.js` |
| `/spec [path]` | Parse and bind OpenAPI schema into context | `/spec ./sandbox-api/openapi.yaml` |
| `/config` | Display active `sentinel.config.json` parameters | `/config` |
| `/set <key> <val>` | Modify configuration on the fly during chat | `/set target http://localhost:8080` |
| `/scan` | Execute live OWASP audit probes against target API | `/scan` |
| `/clear` | Clear conversation history memory | `/clear` |
| `/export` | Export chat transcript and diffs to Markdown | `/export` |
| `/help` | Display command cheat sheet | `/help` |
| `/exit` | Exit chat session | `/exit` |

---

## 9. Integration Testing & Verification

```bash
# Run all 8 integration & unit tests
npm --prefix cli test

# Run individual test suites
npm test
```
