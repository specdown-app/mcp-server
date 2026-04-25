# SpecDown MCP Server — AI-Native Markdown MCP for AI Assistants

<p align="center">
  <img src="https://img.shields.io/npm/v/specdown-mcp?color=blue" alt="npm version" />
  <img src="https://img.shields.io/node/v/specdown-mcp" alt="node" />
  <img src="https://img.shields.io/npm/dm/specdown-mcp" alt="downloads" />
  <img src="https://img.shields.io/badge/MCP-compatible-green" alt="MCP compatible" />
  <img src="https://img.shields.io/badge/spec--as--code-MCP-blueviolet" alt="spec as code" />
</p>

**AI-native Markdown MCP server for [SpecDown](https://specdown.app)** — give Claude, Cursor, Copilot, and other AI coding assistants direct read/write access to your Markdown spec documents.

Stop copy-pasting specs into AI chat. Connect once, AI reads your Markdown docs forever — **AI-native spec-driven development**.

**Jump to your IDE:** [Cursor](#cursor) • [Claude Desktop](#claude-desktop) • [Claude Code](#claude-code) • [Windsurf](#windsurf) • [OpenCode](#opencode) • [VS Code](#vs-code) • [Codex CLI](#codex-cli)

---

## What is AI-Native Markdown MCP?

[Model Context Protocol (MCP)](https://modelcontextprotocol.io) is an open standard that lets AI assistants connect to external tools and data sources. `specdown-mcp` is an **AI-native Markdown MCP server** that exposes your SpecDown spec documents as MCP resources — so Claude, Cursor, and other AI tools can read, search, and edit your specs directly.

**AI-native Spec as Code + AI = spec-driven development:**
```
Engineer writes Markdown spec → AI reads spec via MCP → AI implements feature from spec
```

---

## Features

- **Read & search Markdown docs** — list projects, browse document tree, full-text search
- **Edit docs** — update Markdown content, create new documents (auto-versioned)
- **Upload images** — attach image assets and get markdown links back for documents
- **Inline comments** — add and list comments anchored to specific text
- **Sync planning for agents** — inspect remote snapshots, plan local-vs-remote sync, and apply remote sync operations
- **AI-native spec-driven development** — give AI full Markdown context with zero copy-paste
- **13 MCP tools** — complete read/write and sync-planning API for your spec documents
- **MCP resources** — `specdown://projects`, `specdown://project/{id}`

---

## Prerequisites

1. **[SpecDown account](https://specdown.app)** — free plan available
2. **API key** — generate at [Settings → API Keys](https://specdown.app/settings/api-keys)

---

## Quick Start

No install needed — `npx` runs it on demand:

```bash
# Verify it works
SPECDOWN_API_KEY=your_key npx specdown-mcp
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

## Available MCP Tools

| Tool | Description |
|------|-------------|
| `list_projects` | List all projects you have access to |
| `list_documents` | List Markdown documents in a project |
| `list_project_files` | List preview-only project attachments |
| `read_document` | Read full Markdown content by ID or project+path |
| `read_project_file` | Read attachment metadata, text preview, embed ref, and download URL |
| `search_documents` | Full-text search across all Markdown spec docs |
| `read_project_context` | Get project overview: tree, README, description |
| `list_comments` | List inline comments on a document |
| `add_comment` | Add a comment (anchored to text or threaded reply) |
| `create_document` | Create a new Markdown document or folder |
| `update_document` | Replace Markdown content (auto-versioned on change) |
| `upload_image` | Upload an image asset and return a markdown link |
| `upload_project_file` | Upload any project attachment and return a `[@/path]` embed reference |
| `get_sync_status` | Return remote sync snapshots and summary for a project subtree |
| `plan_sync` | Compare local snapshots with remote docs and produce a sync plan |
| `apply_sync_plan` | Apply remote upsert/delete operations produced from a sync plan |

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `SPECDOWN_API_KEY` | **Yes** | Your API key from [SpecDown Settings](https://specdown.app/settings/api-keys) |
| `SPECDOWN_API_URL` | No | Override API base URL (for self-hosted instances) |

---

## Troubleshooting

**`Error: SPECDOWN_API_KEY must be set`**
→ Add `SPECDOWN_API_KEY` to the `env` block in your IDE's MCP config.

**`Unauthorized` or `401`**
→ Key may be invalid or expired. Regenerate at [Settings → API Keys](https://specdown.app/settings/api-keys).

**Server not appearing in IDE**
→ Restart the IDE after editing MCP config. Cursor: `Cmd+Shift+P` → "MCP: Reload Servers".

**`npx: command not found`**
→ Install Node.js ≥ 18 from [nodejs.org](https://nodejs.org).

---

## Self-hosted SpecDown

Point the MCP server at your own instance:

```json
"env": {
  "SPECDOWN_API_KEY": "YOUR_API_KEY",
  "SPECDOWN_API_URL": "https://your-specdown.example.com"
}
```

---

## Related

- [SpecDown](https://specdown.app) — Markdown editor online, Spec as Code platform
- [specdown-cli](https://github.com/specdown-app/cli) — Markdown CLI for terminal, CI/CD, and automation
- [Get API Key](https://specdown.app/settings/api-keys)
- [Report issue](https://github.com/specdown-app/mcp-server/issues)

## License

MIT
