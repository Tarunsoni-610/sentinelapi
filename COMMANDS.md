# 🚀 Sentinel-Agent CLI — Complete Command Reference & Execution Catalog

This document provides an exhaustive, copy-pasteable reference for all commands, options, workflows, and interactive slash commands in the SentinelAPI CLI Agent.

---

## 📋 Table of Contents
1. [Installation & Quick Start](#1-installation--quick-start)
2. [Configuration Management (`sentinel config`)](#2-configuration-management-sentinel-config)
3. [Repository Cloning & Workspace Discovery (`sentinel clone`)](#3-repository-cloning--workspace-discovery-sentinel-clone)
4. [OWASP Security Audit Scans (`sentinel scan`)](#4-owasp-security-audit-scans-sentinel-scan)
5. [AI Remediation & Patch Synthesis (`sentinel remediate`)](#5-ai-remediation--patch-synthesis-sentinel-remediate)
6. [Live Sandbox Patch Verification (`sentinel verify`)](#6-live-sandbox-patch-verification-sentinel-verify)
7. [Interactive Security Agent Chat (`sentinel chat`)](#7-interactive-security-agent-chat-sentinel-chat)
8. [In-Chat Slash Commands Reference](#8-in-chat-slash-commands-reference)
9. [Integration Testing & Verification](#9-integration-testing--verification)

---

## 1. Installation & Quick Start

### Direct Invocation (Zero Global Permissions Needed)
```bash
# Execute from project root
node cli/bin/sentinel.js <command>

# Or via npm script wrapper
npm run cli -- <command>
```

### Global System Installation
```bash
cd cli
npm install
npm link # (or sudo npm link on macOS if /usr/local is root-owned)
sentinel --help
```

### Environment Configuration
```bash
# Optional: Set Gemini API key for live LLM synthesis (falls back to offline templates if omitted)
export GEMINI_API_KEY="your-gemini-api-key"
```

---

## 2. Configuration Management (`sentinel config`)

```bash
# Initialize sample sentinel.config.json in project root
sentinel config init

# Display active configuration
sentinel config show

# Display configuration in JSON format
sentinel config show --json

# Set target API URL
sentinel config set target http://localhost:4000

# Set OpenAPI specification path
sentinel config set spec ./sandbox-api/openapi.yaml

# Set default AI Agent persona
sentinel config set defaultAgent secure_integrator

# Set CI/CD failure threshold
sentinel config set failOn high

# Toggle AI diff enrichment
sentinel config set enrichWithAi true
```

---

## 3. Repository Cloning & Workspace Discovery (`sentinel clone`)

```bash
# Inspect current local workspace for OpenAPI specs and route controllers
sentinel clone ./

# Output local workspace discovery as raw JSON
sentinel clone ./ --json

# Clone a remote GitHub repository into .sentinel/repos and auto-discover specs
sentinel clone https://github.com/expressjs/express

# Clone with custom destination directory
sentinel clone https://github.com/org/payment-service --dest ./my-cloned-repos
```

---

## 4. OWASP Security Audit Scans (`sentinel scan`)

```bash
# Interactive terminal scan with interactive finding triage loop
sentinel scan

# Non-interactive automated scan
sentinel scan --no-interactive --target http://localhost:4000 --spec ./sandbox-api/openapi.yaml

# Run specific OWASP security modules
sentinel scan --modules bola,broken_auth

# CI/CD Pipeline Mode (Fail build with exit code 1 if findings >= high)
sentinel scan --no-interactive --fail-on high

# CI/CD Pipeline Mode with Critical threshold
sentinel scan --no-interactive --fail-on critical

# Export complete audit findings to JSON file
sentinel scan --json --fail-on none > audit-report.json

# Quiet mode (suppress branding banners and spinners)
sentinel scan --no-interactive --quiet --json
```

---

## 5. AI Remediation & Patch Synthesis (`sentinel remediate`)

```bash
# Generate AI Unified Git Diff patch for BOLA finding
sentinel remediate --patch-id bola-orders

# Generate patch for Excessive Data Exposure finding
sentinel remediate --patch-id excessive-exposure-me

# Generate patch for Broken Authentication finding
sentinel remediate --patch-id missing-auth-admin-stats

# Generate patch for Rate Limiting finding
sentinel remediate --patch-id login-rate-limit

# Output structured remediation diff in JSON format
sentinel remediate --patch-id bola-orders --json
```

---

## 6. Live Sandbox Patch Verification (`sentinel verify`)

```bash
# Apply patch live against sandbox target and verify authorization controls
sentinel verify bola-orders

# Verify Excessive Data Exposure fix on sandbox
sentinel verify excessive-exposure-me

# Verify Admin Authentication fix on sandbox
sentinel verify missing-auth-admin-stats

# Verify Rate Limiter on sandbox
sentinel verify login-rate-limit

# Revert patch back to vulnerable baseline state
sentinel verify bola-orders --revert

# Output verification result as JSON
sentinel verify bola-orders --json
```

---

## 7. Interactive Security Agent Chat (`sentinel chat`)

```bash
# Launch interactive chat with OWASP Top 10 Security Auditor (Default)
sentinel chat

# Launch chat with Secure API Integration Specialist
sentinel chat --agent secure_integrator

# Launch chat with Live Remediation Copilot
sentinel chat --agent remediation_copilot

# Launch chat with API Penetration Testing Agent
sentinel chat --agent pentester

# Launch chat pre-bound to a specific local workspace or repository
sentinel chat --repo ./sandbox-api

# Launch chat pre-bound to an OpenAPI contract
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
| `/scan` | Execute live OWASP probes against target API | `/scan` |
| `/clear` | Clear conversation history memory | `/clear` |
| `/export` | Export chat transcript and diffs to Markdown | `/export` |
| `/help` | Display command cheat sheet | `/help` |
| `/exit` | Exit chat session | `/exit` |

---

## 9. Integration Testing & Verification

```bash
# Run all 8 integration & unit tests
npm --prefix cli test

# Run all workspaces test suites
npm test
```
