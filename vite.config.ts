import { defineConfig } from "vite"
import type { PreviewServer, ViteDevServer } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"

function relayProxyPlugin() {
  const readBody = (req: any) =>
    new Promise<string>((resolve, reject) => {
      let rawBody = ""
      req.on("data", (chunk: unknown) => {
        rawBody += String(chunk)
      })
      req.on("end", () => resolve(rawBody))
      req.on("error", reject)
    })

  const handleRelayProxy = async (req: any, res: any) => {
    res.setHeader("Access-Control-Allow-Origin", "*")
    res.setHeader("Access-Control-Allow-Headers", "Content-Type")
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS")

    if (req.method === "OPTIONS") {
      res.statusCode = 204
      res.end()
      return
    }

    if (req.method !== "POST") {
      res.statusCode = 405
      res.end(JSON.stringify({ error: { message: "Method not allowed" } }))
      return
    }

    try {
      const rawBody = await readBody(req)
      const body = JSON.parse(rawBody || "{}") as {
        endpoint?: string
        apiKey?: string
        payload?: unknown
        headers?: Record<string, string>
      }
      const endpoint = String(body.endpoint || "")
      const apiKey = String(body.apiKey || "")
      const url = new URL(endpoint)

      if (!/^https?:$/.test(url.protocol)) {
        throw new Error("Only HTTP and HTTPS relay endpoints are supported.")
      }

      const upstream = await fetch(url, {
        method: "POST",
        headers: {
          ...(body.headers || { Authorization: `Bearer ${apiKey}` }),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body.payload || {}),
      })

      const responseText = await upstream.text()
      res.statusCode = upstream.status
      res.setHeader("Content-Type", upstream.headers.get("content-type") || "application/json")
      res.end(responseText)
    } catch (error) {
      res.statusCode = 502
      res.setHeader("Content-Type", "application/json")
      res.end(
        JSON.stringify({
          error: {
            message: error instanceof Error ? error.message : "Relay proxy failed.",
          },
        }),
      )
    }
  }

  const handleModelsProxy = async (req: any, res: any) => {
    res.setHeader("Access-Control-Allow-Origin", "*")
    res.setHeader("Access-Control-Allow-Headers", "Content-Type")
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS")

    if (req.method === "OPTIONS") {
      res.statusCode = 204
      res.end()
      return
    }

    if (req.method !== "POST") {
      res.statusCode = 405
      res.end(JSON.stringify({ error: { message: "Method not allowed" } }))
      return
    }

    try {
      const rawBody = await readBody(req)
      const body = JSON.parse(rawBody || "{}") as {
        endpoint?: string
        apiKey?: string
        headers?: Record<string, string>
      }
      const endpoint = String(body.endpoint || "")
      const apiKey = String(body.apiKey || "")
      const url = new URL(endpoint)

      if (!/^https?:$/.test(url.protocol)) {
        throw new Error("Only HTTP and HTTPS model endpoints are supported.")
      }

      const upstream = await fetch(url, {
        method: "GET",
        headers: {
          ...(body.headers || { Authorization: `Bearer ${apiKey}` }),
          "Content-Type": "application/json",
        },
      })

      const responseText = await upstream.text()
      res.statusCode = upstream.status
      res.setHeader("Content-Type", upstream.headers.get("content-type") || "application/json")
      res.end(responseText)
    } catch (error) {
      res.statusCode = 502
      res.setHeader("Content-Type", "application/json")
      res.end(
        JSON.stringify({
          error: {
            message: error instanceof Error ? error.message : "Models proxy failed.",
          },
        }),
      )
    }
  }

  return {
    name: "relay-proxy",
    configureServer(server: ViteDevServer) {
      server.middlewares.use("/api/relay-proxy", handleRelayProxy)
      server.middlewares.use("/api/models-proxy", handleModelsProxy)
    },
    configurePreviewServer(server: PreviewServer) {
      server.middlewares.use("/api/relay-proxy", handleRelayProxy)
      server.middlewares.use("/api/models-proxy", handleModelsProxy)
    },
  }
}

export default defineConfig({
  plugins: [relayProxyPlugin(), react(), tailwindcss()],
  resolve: {
    alias: {
      "@": "/src",
    },
  },
})
