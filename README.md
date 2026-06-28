# TestConrad / Conrad

[中文](./README.zh-CN.md) | English

An LLM testing console for configuring relay endpoints, selecting request models, and running a staged verification flow for connectivity, model identity, playbook probes, and final scoring.

## Overview

TestConrad is a frontend testing console for LLM relay services and model providers. Users can enter a `Base URL`, `API Key`, request model, and comparison model, then run a visual verification workflow to check whether the endpoint is reachable, whether the returned model matches expectations, and whether model behavior fits the selected playbook.

## Features

- Provider presets: built-in catalogs for OpenAI, Claude, Gemini, GLM, DeepSeek, Qwen, Kimi, and more.
- Request model picker: local fuzzy search with automatic comparison-model filling after selection.
- Endpoint modes: OpenAI, Anthropic, Gemini, full URL, and custom endpoint paths.
- Local relay proxy: Vite middleware forwards requests to reduce browser CORS friction during testing.
- Required-field validation: testing is blocked when `Base URL`, `API Key`, request model, or comparison model is missing.
- Sequential flow animation: stages render in order: `01 Config validation -> 02 Connectivity -> 03 Model match -> 04 Playbook probes`.
- Result dashboard: shows the active model, final score, live logs, test overview, token usage, and total runtime.
- Result sharing: generates a shareable result image.
- Global background: uses `public/global-background.mp4` as the page video background.

## Tech Stack

- React
- TypeScript
- Vite
- Tailwind CSS v4
- Lucide React
- Three.js / React Three Fiber

## Local Development

```bash
npm install
npm run dev
```

The default dev URL is usually:

```text
http://localhost:5173/
```

If the port is already in use, Vite will automatically pick the next available port.

## Build and Preview

```bash
npm run build
npm run preview
```

## Usage

1. Select a provider and model template.
2. Enter the `Base URL`.
3. Enter the `API Key`.
4. Select the request model.
5. Review or adjust the auto-filled comparison model.
6. Click "Run Detection".
7. Review the flow, logs, overview, and final score in the result panel.

## Project Structure

```text
src/
  App.tsx
  main.tsx
  index.css
  components/ui/
    demo.tsx
    background-paper-shaders.tsx
  lib/
    model-list.ts
    model-playbooks.ts
public/
  global-background.mp4
vite.config.ts
```

## Notes

- The app does not ship with any real API key. Users provide credentials in the browser UI.
- Test results depend on upstream provider responses and should not be treated as final proof from a single run.
- Playbook probes are assistive signals. Use repeated runs and manual review for stronger conclusions.
