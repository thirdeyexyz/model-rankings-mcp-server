# GenCurator — Generative AI Model Discovery & Curation

An MCP server built for **creative professionals** who need to find the right generative AI model for the task at hand — fast and without wading through benchmarks. Ask it in plain language what you're trying to make, and it tells you what to use.

> *"What's the best model for photorealistic product shots?"*
> *"Which image model handles retro illustration best?"*
> *"Fastest TTS for my podcast, under $5 per million characters?"*
> *"Compare Flux, DALL-E 3, and Midjourney for e-commerce work."*

Works with **any [Model Context Protocol](https://modelcontextprotocol.io) client** — Claude Desktop, Claude Code, [Msty](https://msty.app), Cursor, Continue, Zed, Cline, Goose, [LibreChat](https://docs.librechat.ai/features/mcp.html), or anything else that speaks MCP.

**Contributions are very welcome.** See [CONTRIBUTING.md](CONTRIBUTING.md) — especially if you work in a creative field and have ideas for better model scoring or new data sources.

---

## Who this is for

GenCurator is optimised for creative use cases across all generation modalities:

| You make… | Modality | Example query |
|-----------|----------|---------------|
| Photography / product visuals | Image | *"Photorealistic e-commerce shots, quality priority"* |
| Illustrations / concept art | Image | *"Retro 80s illustration for a zine cover"* |
| Short-form video / social content | Video | *"Best model for smooth 4-second product clips"* |
| Podcasts / voiceovers / dubbing | Audio | *"Natural-sounding TTS with Dutch language support"* |
| Background music / sound design | Music | *"Ambient music for a meditation app, royalty-free"* |
| Long-form writing / copywriting | Text | *"Best cost-efficient model for bulk article drafts"* |

The `ranking_recommend` tool takes a plain-language description of your task and a priority (`quality`, `speed`, `cost`, or `balanced`) and returns ranked recommendations from live data.

---

## Data sources

| Source | Modalities | What it provides | API key required |
|--------|-----------|------------------|-----------------|
| **Artificial Analysis** | All (text, image, video, audio, music) | Elo rankings, pricing, latency | Yes (free) |
| **Hugging Face Hub** | All | Open model metadata, downloads, community metrics | Optional (for gated models) |
| **OpenRouter** | Text | 300+ models with live pricing | No |
| **BenchLM** | Text | Capability scores by category (coding, reasoning, agentic, …) | No |

If a key is missing or a source errors out, GenCurator skips that source, returns what it could gather from the others, and surfaces the skipped sources as warnings in the response.

---

## Quick start

### 1. Install dependencies

```bash
npm install
npm run build
```

### 2. Configure API keys

```bash
# Required — get a free key at https://artificialanalysis.ai/
export ARTIFICIAL_ANALYSIS_API_KEY="your_key_here"

# Optional — only needed for gated Hugging Face models
export HF_TOKEN="hf_your_token_here"
```

Or copy `.env.example` to `.env` and fill it in.

### 3. Connect to your MCP client

GenCurator speaks the standard MCP protocol over stdio (default) or Streamable HTTP. Pick the section for your client:

<details open>
<summary><b>Claude Desktop</b></summary>

Edit `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "gencurator": {
      "command": "node",
      "args": ["/absolute/path/to/gencurator-mcp/dist/index.js"],
      "env": {
        "ARTIFICIAL_ANALYSIS_API_KEY": "your_key_here"
      }
    }
  }
}
```

Fully quit and relaunch Claude Desktop (Cmd-Q on macOS — closing the window is not enough).

</details>

<details>
<summary><b>Claude Code</b></summary>

```bash
claude mcp add gencurator \
  --env ARTIFICIAL_ANALYSIS_API_KEY=your_key_here \
  -- node /absolute/path/to/gencurator-mcp/dist/index.js
```

Run `/mcp` inside Claude Code to confirm it's connected.

</details>

<details>
<summary><b>Msty</b></summary>

In Msty: **Settings → Model Context Protocol → Add MCP Server**. Choose **stdio**, then fill in:

- **Name:** `gencurator`
- **Command:** `node`
- **Args:** `/absolute/path/to/gencurator-mcp/dist/index.js`
- **Env:** `ARTIFICIAL_ANALYSIS_API_KEY=your_key_here`

Save and toggle the server on. The tools become available to any chat that has MCP enabled.

</details>

<details>
<summary><b>Cursor</b></summary>

Edit `~/.cursor/mcp.json` (global) or `.cursor/mcp.json` in a project:

```json
{
  "mcpServers": {
    "gencurator": {
      "command": "node",
      "args": ["/absolute/path/to/gencurator-mcp/dist/index.js"],
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
    "gencurator": {
      "command": {
        "path": "node",
        "args": ["/absolute/path/to/gencurator-mcp/dist/index.js"],
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
- **Args:** `["/absolute/path/to/gencurator-mcp/dist/index.js"]`
- **Env:** `ARTIFICIAL_ANALYSIS_API_KEY=your_key_here` (and optionally `HF_TOKEN`)

</details>

### 4. Or run as a standalone HTTP server

```bash
TRANSPORT=http PORT=3000 node dist/index.js
```

The server accepts MCP requests at `http://localhost:3000/mcp`. Use this when running on a remote machine or when your client prefers a URL over spawning a subprocess.

---

## Tools

### `ranking_get_leaderboard`
Ranked list for any modality. Supports filtering by BenchLM capability category for text.

> *"Top 5 image generation models"*
> *"Best text models for coding tasks"* → `source=benchlm, category=coding`

### `ranking_search_models`
Cross-source search by name, creator, or keyword. Deduplicates and prefers entries with score data.

> *"Find Flux image models"*
> *"Suno music models"*

### `ranking_recommend`
Plain-language task description + priority → ranked recommendations. The most useful tool for creative workflows.

> *"Photorealistic product shots for e-commerce"* → `modality=image, priority=quality`
> *"Background music for a meditation app"* → `modality=music, priority=balanced`
> *"Fast cheap text generation for bulk drafts"* → `modality=text, priority=cost`

### `ranking_compare`
Side-by-side table of 2–5 models.

> *"Compare DALL-E 3, Midjourney, and Flux for image work"*

### `ranking_cache_status`
Check or clear the 1-hour data cache.

---

## Design notes

**Accuracy vs. token efficiency.** GenCurator deliberately balances result quality against context window cost. Leaderboard output uses compact tables with adaptive columns (only columns that have data are shown). Recommendation output is a single line per model. JSON format is available for all tools when you need the full data. This keeps the server useful even in long agentic sessions where context is at a premium.

**Graceful degradation.** If an API key is missing or a source is unreachable, the server returns whatever it can from other sources and reports the skipped ones as warnings — it never fails the entire request because one source is down.

---

## Architecture

```
src/
├── index.ts              # MCP server setup + tool registration
├── types.ts              # TypeScript interfaces
├── constants.ts          # API URLs, config
├── schemas/index.ts      # Zod input schemas
├── services/
│   ├── api-client.ts     # Generic HTTP client with timeout
│   ├── cache.ts          # In-memory TTL cache
│   ├── artificial-analysis.ts
│   ├── huggingface.ts
│   ├── openrouter.ts
│   └── benchlm.ts
└── tools/
    ├── format.ts         # Compact markdown/JSON formatters
    └── handlers.ts       # Tool handler logic + graceful degradation
```

---

## Contributing

Contributions are very welcome — especially from people working in creative fields. See [CONTRIBUTING.md](CONTRIBUTING.md) for a full guide. Priority areas: new data sources (Arena.ai, LMArena, VBench), better recommendation scoring for creative tasks, and qualitative model tags ("strong at illustration", "good for photorealism").

---

## License

MIT
