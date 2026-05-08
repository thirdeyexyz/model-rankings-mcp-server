# Model Rankings MCP Server

An MCP server that provides real-time AI model rankings and recommendations across **text, image, video, audio, and music generation** modalities.

Works with **any [Model Context Protocol](https://modelcontextprotocol.io) client** — Claude Desktop, Claude Code, [Msty](https://msty.app), Cursor, Continue, Zed, Cline, Goose, [LibreChat](https://docs.librechat.ai/features/mcp.html), or anything else that speaks MCP. Query it to get leaderboard data, search for models, compare options side-by-side, or get task-specific recommendations.

## Data sources

| Source | Modalities | What it provides | API key required |
|--------|-----------|------------------|-----------------|
| **Artificial Analysis** | All (text, image, video, audio, music) | Elo rankings, pricing, latency | Yes (free) |
| **Hugging Face Hub** | All | Open model metadata, downloads, community metrics | Optional (for gated models) |
| **OpenRouter** | Text | Usage-based rankings, 300+ models, pricing | No |
| **BenchLM** | Text | Capability-categorised scores (coding, reasoning, agentic, …) | No |

If a key is missing or a source errors out, the server skips that source, returns whatever it could gather from the others, and surfaces the skipped sources as warnings in the response.

## Quick start

### 1. Install dependencies

```bash
npm install
npm run build
```

### 2. Configure API keys

Create a `.env` file or export environment variables:

```bash
# Required — get a free key at https://artificialanalysis.ai/
export ARTIFICIAL_ANALYSIS_API_KEY="your_key_here"

# Optional — for gated Hugging Face models
export HF_TOKEN="hf_your_token_here"
```

### 3. Connect it to your MCP client

The server speaks the standard [Model Context Protocol](https://modelcontextprotocol.io) over stdio (default) or Streamable HTTP. Any MCP-compatible client can use it. Pick the section for your client:

<details open>
<summary><b>Claude Desktop</b></summary>

Edit `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows). Create the file if it doesn't exist:

```json
{
  "mcpServers": {
    "model-rankings": {
      "command": "node",
      "args": ["/absolute/path/to/model-rankings-mcp-server/dist/index.js"],
      "env": {
        "ARTIFICIAL_ANALYSIS_API_KEY": "your_key_here"
      }
    }
  }
}
```

Fully quit and relaunch Claude Desktop (Cmd-Q on macOS — closing the window isn't enough).

</details>

<details>
<summary><b>Claude Code</b></summary>

```bash
claude mcp add model-rankings \
  --env ARTIFICIAL_ANALYSIS_API_KEY=your_key_here \
  -- node /absolute/path/to/model-rankings-mcp-server/dist/index.js
```

Run `/mcp` inside Claude Code to confirm it's connected.

</details>

<details>
<summary><b>Msty</b></summary>

In Msty: **Settings → Model Context Protocol → Add MCP Server**. Choose **stdio**, then fill in:

- **Name:** `model-rankings`
- **Command:** `node`
- **Args:** `/absolute/path/to/model-rankings-mcp-server/dist/index.js`
- **Env:** `ARTIFICIAL_ANALYSIS_API_KEY=your_key_here`

Save and toggle the server on. The tools become available to any chat that has MCP enabled.

If you prefer JSON, the same config in Msty's `mcp.json` is the same shape as the Claude Desktop block above.

</details>

<details>
<summary><b>Cursor</b></summary>

Edit `~/.cursor/mcp.json` (global) or `.cursor/mcp.json` in a project (project-scoped):

```json
{
  "mcpServers": {
    "model-rankings": {
      "command": "node",
      "args": ["/absolute/path/to/model-rankings-mcp-server/dist/index.js"],
      "env": { "ARTIFICIAL_ANALYSIS_API_KEY": "your_key_here" }
    }
  }
}
```

Restart Cursor or toggle the server on under **Settings → MCP**.

</details>

<details>
<summary><b>Zed</b></summary>

Add to your Zed `settings.json`:

```json
{
  "context_servers": {
    "model-rankings": {
      "command": {
        "path": "node",
        "args": ["/absolute/path/to/model-rankings-mcp-server/dist/index.js"],
        "env": { "ARTIFICIAL_ANALYSIS_API_KEY": "your_key_here" }
      }
    }
  }
}
```

</details>

<details>
<summary><b>Continue, Cline, Goose, and other clients</b></summary>

Most MCP clients accept the same shape: a `command`, `args`, and `env`. Point them at:

- **Command:** `node`
- **Args:** `["/absolute/path/to/model-rankings-mcp-server/dist/index.js"]`
- **Env:** `ARTIFICIAL_ANALYSIS_API_KEY=your_key_here` (and optionally `HF_TOKEN`)

</details>

### 4. Or run as a standalone HTTP server

For clients that prefer HTTP, or when you want to run the server on a remote machine:

```bash
TRANSPORT=http PORT=3000 node dist/index.js
```

The server then accepts MCP requests at `http://localhost:3000/mcp` over Streamable HTTP. Most modern MCP clients can connect to a URL instead of spawning a subprocess.

## Tools

### `ranking_get_leaderboard`
Get a ranked leaderboard for any modality.

> "Show me the top 5 image generation models"
> "What are the best LLMs right now?"

### `ranking_search_models`
Search across all sources by name, creator, or keyword.

> "Find Flux image models"
> "Search for code-focused LLMs"

### `ranking_recommend`
Get task-specific recommendations with priority weighting.

> "Photorealistic product shots for e-commerce" (priority: quality)
> "Retro 80s illustration for a zine cover" (priority: quality)
> "Fast cheap text generation for prototyping" (priority: cost)

### `ranking_compare`
Side-by-side comparison table of 2–5 models.

> Compare GPT-4o vs Claude Sonnet vs Gemini
> Compare DALL-E 3 vs Midjourney vs Flux

### `ranking_cache_status`
Check or clear the 1-hour data cache.

## Architecture

```
src/
├── index.ts              # MCP server setup + tool registration
├── types.ts              # TypeScript interfaces
├── constants.ts          # API URLs, config
├── schemas/index.ts      # Zod input schemas
├── services/
│   ├── api-client.ts     # Generic HTTP client
│   ├── cache.ts          # In-memory TTL cache
│   ├── artificial-analysis.ts
│   ├── huggingface.ts
│   ├── openrouter.ts
│   └── benchlm.ts
└── tools/
    ├── format.ts         # Markdown/JSON formatters
    └── handlers.ts       # Tool handler logic
```

## Adding new data sources

See [CONTRIBUTING.md](CONTRIBUTING.md). Candidates we'd love to see: LMArena/LMSYS, Arena.ai, VBench, HF TTS Arena.

## License

MIT
