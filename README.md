# SpecDown MCP Server

<p align="center">
  <img src="https://img.shields.io/npm/v/specdown-mcp?color=blue" alt="npm version" />
  <img src="https://img.shields.io/node/v/specdown-mcp" alt="node" />
  <img src="https://img.shields.io/npm/dm/specdown-mcp" alt="downloads" />
  <img src="https://img.shields.io/badge/MCP-compatible-green" alt="MCP" />
</p>

**MCP server for [SpecDown](https://specdown.app)** — let Claude, Cursor, and other AI coding assistants read, search, and edit your Markdown spec documents. Spec-as-Code, AI-ready.

**Jump to your IDE:** [Cursor](#cursor) • [Claude Desktop](#claude-desktop) • [Claude Code](#claude-code) • [Windsurf](#windsurf) • [OpenCode](#opencode) • [VS Code](#vs-code) • [Codex CLI](#codex-cli)

---

## Features

- **Read & search** — list projects, browse documents, full-text search across all specs
- **Edit & comment** — update docs, add inline comments, create new documents
- **Spec-driven AI** — give AI full context from your Markdown specs with zero copy-paste
- **9 tools** — `list_projects`, `list_documents`, `read_document`, `search_documents`, `read_project_context`, `list_comments`, `add_comment`, `create_document`, `update_document`
- **Resources** — `specdown://projects`, `specdown://project/{id}`

---

## Prerequisites

1. **[SpecDown account](https://specdown.app)** — sign up free
2. **API key** — get yours from [Settings → API Keys](https://specdown.app/settings/api-keys)

---

## Quick Install

```bash
# No install needed — run directly with npx:
npx specdown-mcp

# Or install globally:
npm install -g specdown-mcp
```

---

## IDE Configuration

Replace `YOUR_API_KEY` with your key from [SpecDown Settings](https://specdown.app/settings/api-keys).

### Cursor

**Config path:** `.cursor/mcp.json` (project) or `~/.cursor/mcp.json` (global)

```json
{
  "mcpServers": {
    "specdown": {
      "command": "npx",
      "args": ["-y", "specdown-mcp"],
      "env": {
        "SPECDOWN_API_KEY": "YOUR_API_KEY"
      }
    }
  }
}
```

---

### Claude Desktop

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
**Linux:** `~/.config/claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "specdown": {
      "command": "npx",
      "args": ["-y", "specdown-mcp"],
      "env": {
        "SPECDOWN_API_KEY": "YOUR_API_KEY"
      }
    }
  }
}
```

---

### Claude Code

```json
{
  "mcpServers": {
    "specdown": {
      "command": "npx",
      "args": ["-y", "specdown-mcp"],
      "env": {
        "SPECDOWN_API_KEY": "YOUR_API_KEY"
      }
    }
  }
}
```

---

### Windsurf

**Config path:** `~/.windsurf/mcp.json` or `.windsurf/mcp.json` (project)

```json
{
  "mcpServers": {
    "specdown": {
      "command": "npx",
      "args": ["-y", "specdown-mcp"],
      "env": {
        "SPECDOWN_API_KEY": "YOUR_API_KEY"
      }
    }
  }
}
```

---

### OpenCode

**Config path:** `opencode.json` (project root) or `~/.config/opencode/opencode.json`

```json
{
  "mcpServers": {
    "specdown": {
      "command": "npx",
      "args": ["-y", "specdown-mcp"],
      "env": {
        "SPECDOWN_API_KEY": "YOUR_API_KEY"
      }
    }
  }
}
```

---

### VS Code

**Config path:** `.vscode/mcp.json`

```json
{
  "servers": {
    "specdown": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "specdown-mcp"],
      "env": {
        "SPECDOWN_API_KEY": "YOUR_API_KEY"
      }
    }
  }
}
```

---

### Codex CLI

**Config path:** `~/.codex/config.toml`

```toml
[mcp_servers.specdown]
command = "npx"
args = ["-y", "specdown-mcp"]

[mcp_servers.specdown.env]
SPECDOWN_API_KEY = "YOUR_API_KEY"
```

---

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `SPECDOWN_API_KEY` | **Yes** | — | Your API key from [SpecDown Settings](https://specdown.app/settings/api-keys) |
| `SPECDOWN_API_URL` | No | `https://specdown.app` | API base URL — for self-hosted instances |
| `SPECDOWN_SUPABASE_URL` | No | built-in | Override Supabase URL for self-hosted |
| `SPECDOWN_SUPABASE_ANON_KEY` | No | built-in | Override Supabase anon key for self-hosted |

---

## Available Tools

| Tool | Description |
|---|---|
| `list_projects` | List all projects you have access to |
| `list_documents` | List documents in a project |
| `read_document` | Read full markdown content by ID or project+path |
| `search_documents` | Full-text search across all documents |
| `read_project_context` | Get project overview: tree, README, description |
| `list_comments` | List comments on a document |
| `add_comment` | Add a comment (anchored to text or threaded reply) |
| `create_document` | Create a new document or folder |
| `update_document` | Replace document content (auto-versions on change) |

---

## Troubleshooting

**`Error: SPECDOWN_API_KEY must be set`**
→ Add `SPECDOWN_API_KEY` to the `env` block in your IDE's MCP config.

**`Unauthorized` or `401`**
→ Your key may be invalid or expired. Generate a new one at [Settings → API Keys](https://specdown.app/settings/api-keys).

**Server not appearing in IDE**
→ Restart the IDE after editing MCP config. Cursor: `Cmd+Shift+P` → "MCP: Reload Servers".

**`npx: command not found`**
→ Install Node.js ≥ 18 from [nodejs.org](https://nodejs.org).

---

## Self-hosted SpecDown

Point the server at your own instance:

```json
"env": {
  "SPECDOWN_API_KEY": "YOUR_API_KEY",
  "SPECDOWN_API_URL": "https://your-specdown.example.com"
}
```

---

## Links

- [SpecDown](https://specdown.app) — Spec-as-Code platform
- [Get API Key](https://specdown.app/settings/api-keys)
- [Docs](https://specdown.app/docs)
- [GitHub](https://github.com/specdown-app/mcp-server)
- [Report issue](https://github.com/specdown-app/mcp-server/issues)

## License

MIT
