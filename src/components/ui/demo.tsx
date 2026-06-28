"use client"

import {
  Activity,
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronDown,
  Download,
  Eye,
  EyeOff,
  KeyRound,
  Languages,
  ListChecks,
  Loader2,
  Moon,
  Play,
  RefreshCw,
  RotateCcw,
  Search,
  Server,
  ShieldAlert,
  ShieldCheck,
  Sun,
  XCircle,
} from "lucide-react"
import { ComponentType, ImgHTMLAttributes, ReactNode, useEffect, useMemo, useRef, useState } from "react"
import { MODEL_LIST, type ModelRegion } from "@/lib/model-list"
import { getPlaybookForModel, type Language, type LocalizedText, type ModelPlaybook, type PlaybookProbe as Probe } from "@/lib/model-playbooks"

type Theme = "light" | "dark"

type RelayConfig = {
  baseUrl: string
  apiKey: string
  model: string
  compareModel: string
  endpointMode: EndpointMode
  customPath: string
}

type EndpointMode = "openai" | "anthropic" | "gemini" | "full" | "custom"
type ProbeStatus = "idle" | "running" | "pass" | "warn" | "fail"
type StageStatus = ProbeStatus
type StageId = "validation" | "connectivity" | "model-match" | "probes"
type ModelFetchStatus = "idle" | "loading" | "success" | "error"

type ProbeResult = {
  id: string
  weight: number
  status: Exclude<ProbeStatus, "idle" | "running">
  durationMs: number
  tokenCount?: number
  returnedModel?: string
  content?: string
  error?: LocalizedText
  reason: LocalizedText
}

type ChatResult = {
  content: string
  returnedModel?: string
  tokenCount?: number
}

type PipelineStage = {
  id: StageId
  status: StageStatus
  detail: LocalizedText
  durationMs?: number
}

type RunTimelineItem = {
  id: string
  index: number
  title: string
  description: string
  status: StageStatus
  detail: LocalizedText
  durationMs?: number
  tokenCount?: number
  returnedModel?: string
  probe?: Probe
  result?: ProbeResult
}

type ModelCheck = {
  returnedModel?: string
  message: LocalizedText
}

type ProviderPreset = {
  id: string
  name: LocalizedText
  domain: string
  mark?: string
  baseUrl: string
  endpointMode: EndpointMode
  customPath?: string
  models: string[]
}

type CompareModelOption = {
  key: string
  model: string
  vendorId: string
  vendorName: string
  region: ModelRegion
  source: "catalog" | "runtime"
}

const defaultConfig: RelayConfig = {
  baseUrl: "",
  apiKey: "",
  model: "",
  compareModel: "",
  endpointMode: "openai",
  customPath: "/v1/chat/completions",
}

const copy = {
  zh: {
    title: "模型测试方法论台",
    subtitle: "LLM鉴定、保真与稳定性探针",
    language: "语言",
    theme: "主题",
    light: "白天",
    dark: "黑夜",
    shareImage: "生成结果图",
    reset: "重置",
    providerTemplates: "服务商和模型模板",
    baseUrl: "Base URL",
    endpointPath: "接口路径",
    proxyMode: "本地代理已启用，避免浏览器 CORS 拦截",
    endpointModes: {
      openai: "OpenAI",
      anthropic: "Anthropic",
      gemini: "Gemini",
      full: "完整地址",
      custom: "自定义",
    },
    waitingBaseUrl: "填写 Base URL",
    apiKey: "API Key",
    showApiKey: "显示 API Key",
    hideApiKey: "隐藏 API Key",
    commonModel: "常见 model",
    fetchedModel: "获取的 model",
    fetchModels: "获取所有 model",
    fetchingModels: "正在获取 model",
    fetchedModels: "已获取 model",
    noFetchedModels: "还没有获取到 model",
    modelsFetchHint: "填写 Base URL 和 API Key 后获取可用模型列表。",
    providerModel: "服务商模型",
    requestModel: "请求模型",
    requestModelPlaceholder: "选择请求模型",
    requestModelSearch: "搜索请求模型",
    requestModelPicker: "打开请求模型列表",
    compareModel: "对比模型",
    compareModelPlaceholder: "用于比对 response.model",
    compareModelSearch: "搜索模型或厂商",
    compareModelCatalog: "本地模型目录",
    runtimeModels: "当前环境",
    modelSearchEmpty: "没有匹配的模型",
    compareModelPicker: "打开对比模型列表",
    actualModel: "实际 model",
    actualModelPlaceholder: "中转站实际请求模型名",
    optional: "可选",
    run: "运行检测",
    running: "检测中",
    flowTitle: "测试流程",
    flowDescription: "先验收硬特征，再做模型归属核对，最后测稳定性漂移。",
    processTitle: "方法原则",
    resultTraceTitle: "运行过程",
    processDescription: "优先使用不可轻易伪造的硬信号，再补充能力题和稳定性重复测。",
    resultTraceDescription: "点击运行后，这里按顺序显示连通、模型核对、自动题和人工复核状态。",
    playbookTitle: "当前方法卡",
    playbookAppliesTo: "适用范围",
    playbookSummary: "为什么这样测",
    playbookCaution: "使用边界",
    playbookManual: "人工检查",
    playbookSources: "出处",
    playbookAuto: "自动题",
    noAutoProbes: "当前方法卡没有来源支持的自动题，只保留连通性、response.model 和人工检查。",
    score: "鉴别分",
    realtimeScore: "实时计算",
    waitingDetection: "待执行",
    passed: "通过项",
    warnings: "观察项",
    risks: "风险项",
    progress: "进度",
    tokenUsage: "Token",
    elapsedTime: "耗时",
    results: "运行记录",
    showResults: "查看过程",
    hideResults: "查看方法",
    manualReviewTitle: "人工复核",
    manualReviewDescription: "当前方法卡的人工检查项",
    manualReviewQueued: "连通性与模型核对完成后，对照人工检查项复核。",
    manualReviewReady: "自动题不足，已完成可自动校验部分；请按人工检查项复核。",
    prompt: "Prompt",
    raw: "原始返回 / 错误",
    notRun: "尚未运行",
    status: {
      pass: "通过",
      warn: "观察",
      fail: "风险",
      running: "运行中",
      idle: "待执行",
    },
    switchLanguage: "切换到 English",
    switchTheme: "切换昼夜模式",
    errorOverlayTitle: "检测失败",
    errorOverlayDescription: "请检查 Base URL、API Key、模型名和接口路径后再次运行。",
    errors: {
      baseUrlMissing: "Base URL 缺失。",
      apiKeyMissing: "API Key 缺失。",
      modelMissing: "model 缺失。",
      compareModelMissing: "对比模型缺失。",
      baseUrlInvalid: "Base URL 格式无效。",
      jsonParse: "JSON 配置解析失败。",
    },
  },
  en: {
    title: "Model Testing Playbook",
    subtitle: "LLM identity, fidelity, and stability probes",
    language: "Language",
    theme: "Theme",
    light: "Light",
    dark: "Dark",
    shareImage: "Generate result image",
    reset: "Reset",
    providerTemplates: "Provider and model templates",
    baseUrl: "Base URL",
    endpointPath: "Endpoint path",
    proxyMode: "Local proxy enabled to avoid browser CORS blocks",
    endpointModes: {
      openai: "OpenAI",
      anthropic: "Anthropic",
      gemini: "Gemini",
      full: "Full URL",
      custom: "Custom",
    },
    waitingBaseUrl: "Enter Base URL",
    apiKey: "API Key",
    showApiKey: "Show API Key",
    hideApiKey: "Hide API Key",
    commonModel: "Common model",
    fetchedModel: "Fetched model",
    fetchModels: "Fetch all models",
    fetchingModels: "Fetching models",
    fetchedModels: "Fetched models",
    noFetchedModels: "No models fetched yet",
    modelsFetchHint: "Enter Base URL and API Key, then fetch the available model list.",
    providerModel: "Provider model",
    requestModel: "Request model",
    requestModelPlaceholder: "Choose request model",
    requestModelSearch: "Search request model",
    requestModelPicker: "Open request model list",
    compareModel: "Compare model",
    compareModelPlaceholder: "Expected response.model value",
    compareModelSearch: "Search model or vendor",
    compareModelCatalog: "Local model catalog",
    runtimeModels: "Current runtime",
    modelSearchEmpty: "No matching models",
    compareModelPicker: "Open compare model list",
    actualModel: "Actual model",
    actualModelPlaceholder: "Model name sent to the relay",
    optional: "Optional",
    run: "Run check",
    running: "Checking",
    flowTitle: "Test Flow",
    flowDescription: "Verify hard signals first, then model identity, then stability drift.",
    processTitle: "Method Rules",
    resultTraceTitle: "Run Process",
    processDescription: "Prefer hard-to-forge evidence, then add capability probes and repeated stability checks.",
    resultTraceDescription: "After you run a check, this shows connectivity, model match, automated probes, and manual review in order.",
    playbookTitle: "Active playbook",
    playbookAppliesTo: "Applies to",
    playbookSummary: "Why this method",
    playbookCaution: "Boundary",
    playbookManual: "Manual checks",
    playbookSources: "Sources",
    playbookAuto: "Automated probes",
    noAutoProbes: "This playbook has no source-backed automated probes. Keep connectivity, response.model, and manual checks only.",
    score: "Detection score",
    realtimeScore: "Live calculation",
    waitingDetection: "Queued",
    passed: "Passed",
    warnings: "Warnings",
    risks: "Risks",
    progress: "Progress",
    tokenUsage: "Tokens",
    elapsedTime: "Time",
    results: "Run log",
    showResults: "Show process",
    hideResults: "Show method",
    manualReviewTitle: "Manual review",
    manualReviewDescription: "Manual checks in the active playbook",
    manualReviewQueued: "After connectivity and model check finish, review the manual checklist.",
    manualReviewReady: "Automated evidence is limited; the automatic checks are complete. Review the manual checklist next.",
    prompt: "Prompt",
    raw: "Raw response / error",
    notRun: "Not run yet",
    status: {
      pass: "Pass",
      warn: "Watch",
      fail: "Risk",
      running: "Running",
      idle: "Queued",
    },
    switchLanguage: "Switch to Chinese",
    switchTheme: "Toggle theme",
    errorOverlayTitle: "Check failed",
    errorOverlayDescription: "Check the Base URL, API Key, model name, and endpoint path, then run again.",
    errors: {
      baseUrlMissing: "Base URL is required.",
      apiKeyMissing: "API Key is required.",
      modelMissing: "model is required.",
      compareModelMissing: "Compare model is required.",
      baseUrlInvalid: "Base URL is invalid.",
      jsonParse: "Failed to parse JSON config.",
    },
  },
} as const

const stageCopy: Record<Language, Record<StageId, { name: string; description: string; idleDetail: string }>> = {
  zh: {
    validation: {
      name: "配置校验",
      description: "检查地址、密钥和模型名",
      idleDetail: "待执行",
    },
    connectivity: {
      name: "连通性",
      description: "请求 /chat/completions",
      idleDetail: "待执行",
    },
    "model-match": {
      name: "模型核对",
      description: "比对 response.model",
      idleDetail: "待执行",
    },
    probes: {
      name: "方法卡题库",
      description: "按当前模型执行专属题目",
      idleDetail: "待执行",
    },
  },
  en: {
    validation: {
      name: "Config check",
      description: "Check URL, key, and model names",
      idleDetail: "Queued",
    },
    connectivity: {
      name: "Connectivity",
      description: "Request /chat/completions",
      idleDetail: "Queued",
    },
    "model-match": {
      name: "Model check",
      description: "Compare response.model",
      idleDetail: "Queued",
    },
    probes: {
      name: "Playbook probes",
      description: "Run the model-specific prompts for this playbook",
      idleDetail: "Queued",
    },
  },
}

const localText = (zh: string, en: string): LocalizedText => ({ zh, en })

const regionLabels: Record<ModelRegion, LocalizedText> = {
  global: localText("国际主流厂商", "Global vendors"),
  china: localText("国产主流厂商", "Chinese vendors"),
}

function normalizeSearchValue(value: string) {
  return value.toLowerCase().replace(/[\s\-._/]+/g, "")
}

function uniqueNonEmpty(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)))
}

const providerPresets: ProviderPreset[] = [
  {
    id: "openai",
    name: localText("OpenAI", "OpenAI"),
    domain: "openai.com",
    mark: "AI",
    baseUrl: "https://api.openai.com/v1",
    endpointMode: "openai",
    models: ["gpt-5.5", "gpt-5.2", "gpt-5.1", "gpt-5", "codex", "gpt-4o", "o3-mini"],
  },
  {
    id: "claude",
    name: localText("Claude", "Claude"),
    domain: "anthropic.com",
    mark: "CL",
    baseUrl: "https://api.anthropic.com",
    endpointMode: "anthropic",
    models: ["claude-opus-4.6", "claude-opus-4.5", "claude-sonnet-4.5", "claude-3.5-sonnet", "claude-3-opus"],
  },
  {
    id: "gemini",
    name: localText("Gemini", "Gemini"),
    domain: "gemini.google.com",
    mark: "GM",
    baseUrl: "https://generativelanguage.googleapis.com",
    endpointMode: "gemini",
    models: ["gemini-2.5-pro", "gemini-2.5-flash", "gemini-1.5-pro", "gemini-1.5-flash"],
  },
  {
    id: "custom",
    name: localText("自定义", "Custom"),
    domain: "example.com",
    mark: "CU",
    baseUrl: "",
    endpointMode: "custom",
    customPath: "/v1/chat/completions",
    models: [],
  },
]

function initialStages(language: Language): PipelineStage[] {
  return (["validation", "connectivity", "model-match", "probes"] as StageId[]).map((id) => ({
    id,
    status: "idle",
    detail: {
      zh: stageCopy.zh[id].idleDetail,
      en: stageCopy.en[id].idleDetail,
    },
  }))
}

const systemPrompt = "你正在接受模型测试方法论验证。必须严格遵循用户要求，不要添加无关解释。"

function joinUrlPath(baseUrl: string, path: string) {
  const base = baseUrl.trim().replace(/\/+$/, "")
  const suffix = path.trim().replace(/^\/+/, "")
  return `${base}/${suffix}`
}

function buildEndpoint(config: RelayConfig) {
  const baseUrl = config.baseUrl.trim()
  if (config.endpointMode === "full") return baseUrl
  if (config.endpointMode === "custom") return joinUrlPath(baseUrl, config.customPath || "/chat/completions")
  if (config.endpointMode === "anthropic") return joinUrlPath(baseUrl, "/v1/messages")
  if (config.endpointMode === "gemini") return joinUrlPath(baseUrl, `/v1beta/models/${config.model.trim()}:generateContent`)
  return /\/v1\/?$/i.test(baseUrl) ? joinUrlPath(baseUrl, "/chat/completions") : joinUrlPath(baseUrl, "/v1/chat/completions")
}

function buildModelsEndpoint(config: RelayConfig) {
  const baseUrl = config.baseUrl.trim()
  if (config.endpointMode === "full") {
    return baseUrl
      .replace(/\/+$/, "")
      .replace(/(?:\/v\d+)?\/chat\/completions$/i, (match) => match.replace(/chat\/completions$/i, "models"))
  }
  if (config.endpointMode === "custom") return joinUrlPath(baseUrl, "/models")
  if (config.endpointMode === "anthropic") return joinUrlPath(baseUrl, "/v1/models")
  if (config.endpointMode === "gemini") return joinUrlPath(baseUrl, "/v1beta/models")
  return /\/v1\/?$/i.test(baseUrl) ? joinUrlPath(baseUrl, "/models") : joinUrlPath(baseUrl, "/v1/models")
}

function statusScore(status: ProbeResult["status"], weight: number) {
  if (status === "pass") return weight
  if (status === "warn") return weight * 0.5
  return 0
}

function numericValue(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined
}

function scoreLabel(score: number, probeCount: number): { text: LocalizedText; tone: string; icon: ComponentType<{ size?: number; className?: string }> } {
  if (probeCount === 0) return { text: localText("证据不足", "Insufficient evidence"), tone: "text-slate-600", icon: Search }
  if (score >= 86) return { text: localText("特征吻合", "Signature matched"), tone: "text-emerald-600", icon: ShieldCheck }
  if (score >= 68) return { text: localText("部分吻合", "Partially matched"), tone: "text-amber-600", icon: AlertTriangle }
  if (score >= 45) return { text: localText("特征混杂", "Mixed signals"), tone: "text-orange-600", icon: ShieldAlert }
  return { text: localText("明显不符", "Clearly mismatched"), tone: "text-rose-600", icon: XCircle }
}

function extractOpenAiContent(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    throw new Error("中转站返回非 OpenAI-compatible 响应：响应不是对象。")
  }

  const data = payload as {
    model?: unknown
    error?: { message?: unknown; type?: unknown; code?: unknown }
    choices?: Array<{ message?: { content?: unknown }; text?: unknown }>
    usage?: { total_tokens?: unknown; totalTokens?: unknown }
  }

  if (data.error) {
    const message = [data.error.message, data.error.type, data.error.code].filter(Boolean).join(" / ")
    throw new Error(message || "中转站返回错误。")
  }

  const content = data.choices?.[0]?.message?.content ?? data.choices?.[0]?.text
  if (typeof content !== "string") {
    throw new Error("中转站返回非 OpenAI-compatible 响应：缺少 choices[0].message.content。")
  }

  return {
    content,
    returnedModel: typeof data.model === "string" ? data.model : undefined,
    tokenCount: numericValue(data.usage?.total_tokens) ?? numericValue(data.usage?.totalTokens),
  }
}

function extractAnthropicContent(payload: unknown, requestedModel: string) {
  if (!payload || typeof payload !== "object") {
    throw new Error("Anthropic 响应不是对象。")
  }

  const data = payload as {
    model?: unknown
    error?: { message?: unknown; type?: unknown }
    content?: Array<{ type?: unknown; text?: unknown }>
    usage?: { input_tokens?: unknown; output_tokens?: unknown }
  }

  if (data.error) {
    const message = [data.error.message, data.error.type].filter(Boolean).join(" / ")
    throw new Error(message || "Anthropic 返回错误。")
  }

  const content = data.content?.map((item) => (typeof item.text === "string" ? item.text : "")).join("")
  if (!content) {
    throw new Error("Anthropic 响应缺少 content 文本。")
  }

  return {
    content,
    returnedModel: typeof data.model === "string" ? data.model : requestedModel,
    tokenCount: (numericValue(data.usage?.input_tokens) ?? 0) + (numericValue(data.usage?.output_tokens) ?? 0) || undefined,
  }
}

function extractGeminiContent(payload: unknown, requestedModel: string) {
  if (!payload || typeof payload !== "object") {
    throw new Error("Gemini 响应不是对象。")
  }

  const data = payload as {
    error?: { message?: unknown; status?: unknown; code?: unknown }
    candidates?: Array<{ content?: { parts?: Array<{ text?: unknown }> } }>
    usageMetadata?: { totalTokenCount?: unknown }
  }

  if (data.error) {
    const message = [data.error.message, data.error.status, data.error.code].filter(Boolean).join(" / ")
    throw new Error(message || "Gemini 返回错误。")
  }

  const content = data.candidates?.[0]?.content?.parts?.map((part) => (typeof part.text === "string" ? part.text : "")).join("")
  if (!content) {
    throw new Error("Gemini 响应缺少 candidates[0].content.parts 文本。")
  }

  return {
    content,
    returnedModel: requestedModel,
    tokenCount: numericValue(data.usageMetadata?.totalTokenCount),
  }
}

function buildChatRequest(config: RelayConfig, prompt: string, maxTokens: number) {
  if (config.endpointMode === "anthropic") {
    return {
      payload: {
        model: config.model.trim(),
        max_tokens: maxTokens,
        temperature: 0,
        system: systemPrompt,
        messages: [{ role: "user", content: prompt }],
      },
      headers: {
        "x-api-key": config.apiKey.trim(),
        "anthropic-version": "2023-06-01",
      },
    }
  }

  if (config.endpointMode === "gemini") {
    return {
      payload: {
        generationConfig: {
          temperature: 0,
          maxOutputTokens: maxTokens,
        },
        systemInstruction: {
          parts: [{ text: systemPrompt }],
        },
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      },
      headers: {
        "x-goog-api-key": config.apiKey.trim(),
      },
    }
  }

  return {
    payload: {
      model: config.model.trim(),
      temperature: 0,
      max_tokens: maxTokens,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
    },
    headers: undefined,
  }
}

function extractChatContent(config: RelayConfig, payload: unknown) {
  if (config.endpointMode === "anthropic") return extractAnthropicContent(payload, config.model.trim())
  if (config.endpointMode === "gemini") return extractGeminiContent(payload, config.model.trim())
  return extractOpenAiContent(payload)
}

function requestErrorMessage(error: unknown): LocalizedText {
  if (error instanceof TypeError) {
    return localText(
      "请求失败，可能是网络错误、CORS 被拦截，或中转站未允许浏览器跨域调用。",
      "Request failed. This may be a network error, a CORS block, or a relay that does not allow browser calls.",
    )
  }
  if (error instanceof Error) {
    if (/403|forbidden|access_denied/i.test(error.message)) {
      return localText(
        `鉴权或访问权限被拒绝：${error.message}。请检查 API Key、模型权限、计费状态、请求路径和中转站路由规则。`,
        `Access was denied: ${error.message}. Check the API key, model permissions, billing status, request path, and relay routing rules.`,
      )
    }
    if (/401|unauthorized|invalid_api_key/i.test(error.message)) {
      return localText(`鉴权失败：${error.message}。请检查 API Key 是否正确。`, `Authentication failed: ${error.message}. Check whether the API key is correct.`)
    }
    if (/404|model_not_found|not found/i.test(error.message)) {
      return localText(`模型或路径不存在：${error.message}。请检查 model 名称和接口路径模式。`, `Model or path not found: ${error.message}. Check the model name and endpoint path mode.`)
    }
    return localText(error.message, error.message)
  }
  return localText("请求失败，未知错误。", "Request failed with an unknown error.")
}

async function requestChat(config: RelayConfig, prompt: string, maxTokens = 120): Promise<ChatResult> {
  const chatRequest = buildChatRequest(config, prompt, maxTokens)

  const response = await fetch("/api/relay-proxy", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      endpoint: buildEndpoint(config),
      apiKey: config.apiKey.trim(),
      payload: chatRequest.payload,
      headers: chatRequest.headers,
    }),
  })

  const raw = await response.text()
  let responsePayload: unknown
  try {
    responsePayload = raw ? JSON.parse(raw) : {}
  } catch {
    throw new Error(`中转站返回非 JSON 响应，HTTP ${response.status}。`)
  }

  if (!response.ok) {
    const errorPayload = responsePayload as { error?: { message?: string; type?: string; code?: string } }
    const message = [errorPayload.error?.message, errorPayload.error?.type, errorPayload.error?.code].filter(Boolean).join(" / ")
    throw new Error(`HTTP ${response.status}${message ? ` / ${message}` : ""}`)
  }

  return extractChatContent(config, responsePayload)
}

function extractModelIds(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    throw new Error("模型列表响应不是对象。")
  }

  const data = payload as {
    data?: Array<{ id?: unknown; name?: unknown }>
    models?: Array<string | { id?: unknown; name?: unknown }>
    error?: { message?: unknown; type?: unknown; code?: unknown }
  }

  if (data.error) {
    const message = [data.error.message, data.error.type, data.error.code].filter(Boolean).join(" / ")
    throw new Error(message || "模型列表接口返回错误。")
  }

  const rawModels = Array.isArray(data.data) ? data.data : Array.isArray(data.models) ? data.models : []
  const modelIds = rawModels
    .map((model) => {
      if (typeof model === "string") return model
      if (model && typeof model === "object") {
        return typeof model.id === "string" ? model.id : typeof model.name === "string" ? model.name : ""
      }
      return ""
    })
    .map((model) => model.replace(/^models\//, ""))
    .filter(Boolean)

  return Array.from(new Set(modelIds)).sort((a, b) => a.localeCompare(b))
}

async function requestModelList(config: RelayConfig) {
  const response = await fetch("/api/models-proxy", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      endpoint: buildModelsEndpoint(config),
      apiKey: config.apiKey.trim(),
      headers:
        config.endpointMode === "anthropic"
          ? {
              "x-api-key": config.apiKey.trim(),
              "anthropic-version": "2023-06-01",
            }
          : config.endpointMode === "gemini"
            ? {
                "x-goog-api-key": config.apiKey.trim(),
              }
            : undefined,
    }),
  })

  const raw = await response.text()
  let responsePayload: unknown
  try {
    responsePayload = raw ? JSON.parse(raw) : {}
  } catch {
    throw new Error(`模型列表接口返回非 JSON 响应，HTTP ${response.status}。`)
  }

  if (!response.ok) {
    const errorPayload = responsePayload as { error?: { message?: string; type?: string; code?: string } }
    const message = [errorPayload.error?.message, errorPayload.error?.type, errorPayload.error?.code].filter(Boolean).join(" / ")
    throw new Error(`HTTP ${response.status}${message ? ` / ${message}` : ""}`)
  }

  return extractModelIds(responsePayload)
}

function GlassPanel({ className = "", children }: { className?: string; children: ReactNode }) {
  return <section className={`rounded-lg border border-[#d7dee7] bg-white shadow-[0_18px_45px_rgba(17,24,39,0.07)] ${className}`}>{children}</section>
}

function FieldIcon({ children }: { children: ReactNode }) {
  return <div className="grid h-8 w-8 shrink-0 place-items-center rounded-md border border-[#d7dee7] bg-[#f3f6f9] text-[#526070]">{children}</div>
}

function providerLogoUrl(domain: string) {
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`
}

function ProviderLogo({
  provider,
  className = "",
  ...props
}: {
  provider: ProviderPreset
  className?: string
} & ImgHTMLAttributes<HTMLImageElement>) {
  const [failed, setFailed] = useState(false)

  if (provider.id === "custom") {
    return (
      <span className={`grid place-items-center rounded-full border ${className}`} aria-hidden="true">
        <Server size={13} />
      </span>
    )
  }

  if (failed) {
    return (
      <span className={`grid place-items-center rounded-full border text-[10px] font-bold ${className}`} aria-hidden="true">
        {provider.mark ?? provider.name.en.slice(0, 2).toUpperCase()}
      </span>
    )
  }

  return (
    <img
      {...props}
      className={`rounded-full object-contain ${className}`}
      src={providerLogoUrl(provider.domain)}
      alt={`${provider.name.en} logo`}
      onError={() => setFailed(true)}
    />
  )
}

function StatusPill({ status, language }: { status: ProbeResult["status"]; language: Language }) {
  const styles = {
    pass: "border-emerald-200 bg-emerald-50 text-emerald-700",
    warn: "border-amber-200 bg-amber-50 text-amber-700",
    fail: "border-rose-200 bg-rose-50 text-rose-700",
  }
  const Icon = status === "pass" ? CheckCircle2 : AlertTriangle

  return (
    <span className={`inline-flex h-6 items-center gap-1 rounded-md border px-2 text-[11px] font-medium ${styles[status]}`}>
      <Icon size={13} />
      {copy[language].status[status]}
    </span>
  )
}

function StageBadge({ status, language }: { status: StageStatus; language: Language }) {
  if (status === "running") {
    return (
      <span className="inline-flex h-6 items-center gap-1 whitespace-nowrap rounded-md border border-sky-200 bg-sky-50 px-2 text-[11px] font-medium text-sky-700">
        <Loader2 className="animate-spin" size={13} />
        {copy[language].status.running}
      </span>
    )
  }

  if (status === "idle") {
    return (
      <span className="inline-flex h-6 items-center gap-1 whitespace-nowrap rounded-md border border-[#dbe2ea] bg-[#f6f8fa] px-2 text-[11px] font-medium text-[#6d7785]">
        <span className="h-2 w-2 rounded-full bg-[#9aa5b4]" />
        {copy[language].status.idle}
      </span>
    )
  }

  return <StatusPill status={status} language={language} />
}

function StageIcon({ status }: { status: StageStatus }) {
  if (status === "running") return <Loader2 className="animate-spin text-sky-600" size={18} />
  if (status === "pass") return <CheckCircle2 className="text-emerald-600" size={18} />
  if (status === "warn") return <AlertTriangle className="text-amber-600" size={18} />
  if (status === "fail") return <AlertTriangle className="text-rose-600" size={18} />
  return <span className="h-3 w-3 rounded-full bg-[#9aa5b4]" />
}

export default function DemoOne() {
  const [language, setLanguage] = useState<Language>("zh")
  const [theme, setTheme] = useState<Theme>("light")
  const [config, setConfig] = useState<RelayConfig>(defaultConfig)
  const [selectedProviderId, setSelectedProviderId] = useState(providerPresets[0].id)
  const [showApiKey, setShowApiKey] = useState(false)
  const [results, setResults] = useState<ProbeResult[]>([])
  const [runningId, setRunningId] = useState<string | null>(null)
  const [stages, setStages] = useState<PipelineStage[]>(() => initialStages("zh"))
  const [modelCheck, setModelCheck] = useState<ModelCheck>({
    message: localText("尚未核对", "Not checked yet"),
  })
  const [configError, setConfigError] = useState("")
  const [fetchedModels, setFetchedModels] = useState<string[]>([])
  const [modelsStatus, setModelsStatus] = useState<ModelFetchStatus>("idle")
  const [modelsMessage, setModelsMessage] = useState<LocalizedText>(localText("", ""))
  const [runError, setRunError] = useState<LocalizedText | null>(null)
  const [resultsOpen, setResultsOpen] = useState(false)
  const [scoreOpen, setScoreOpen] = useState(false)
  const [requestModelSearch, setRequestModelSearch] = useState("")
  const [requestModelOpen, setRequestModelOpen] = useState(false)
  const [compareModelSearch, setCompareModelSearch] = useState("")
  const [compareModelOpen, setCompareModelOpen] = useState(false)
  const requestModelPanelRef = useRef<HTMLDivElement>(null)
  const requestModelSearchRef = useRef<HTMLInputElement>(null)
  const compareModelPanelRef = useRef<HTMLDivElement>(null)
  const compareModelSearchRef = useRef<HTMLInputElement>(null)
  const t = copy[language]
  const dark = theme === "dark"

  useEffect(() => {
    if (!requestModelOpen) {
      setRequestModelSearch("")
      return
    }

    requestModelSearchRef.current?.focus()
  }, [requestModelOpen])

  useEffect(() => {
    if (!requestModelOpen) return

    const handlePointerDown = (event: MouseEvent) => {
      if (!requestModelPanelRef.current?.contains(event.target as Node)) {
        setRequestModelOpen(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setRequestModelOpen(false)
      }
    }

    document.addEventListener("mousedown", handlePointerDown)
    document.addEventListener("keydown", handleKeyDown)

    return () => {
      document.removeEventListener("mousedown", handlePointerDown)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [requestModelOpen])

  useEffect(() => {
    if (!compareModelOpen) {
      setCompareModelSearch("")
      return
    }

    compareModelSearchRef.current?.focus()
  }, [compareModelOpen])

  useEffect(() => {
    if (!compareModelOpen) return

    const handlePointerDown = (event: MouseEvent) => {
      if (!compareModelPanelRef.current?.contains(event.target as Node)) {
        setCompareModelOpen(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setCompareModelOpen(false)
      }
    }

    document.addEventListener("mousedown", handlePointerDown)
    document.addEventListener("keydown", handleKeyDown)

    return () => {
      document.removeEventListener("mousedown", handlePointerDown)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [compareModelOpen])

  const modelUnderTest = config.compareModel.trim() || config.model.trim()
  const activePlaybook = useMemo<ModelPlaybook>(() => getPlaybookForModel(modelUnderTest), [modelUnderTest])
  const probes = activePlaybook.probes

  const scoreData = useMemo(() => {
    const rawScore = results.reduce((sum, result) => sum + statusScore(result.status, result.weight), 0)
    const returnedModels = Array.from(new Set([modelCheck.returnedModel, ...results.map((result) => result.returnedModel)].filter(Boolean))) as string[]
    const score = Math.max(0, Math.round(rawScore))
    const pass = results.filter((result) => result.status === "pass").length
    const warn = results.filter((result) => result.status === "warn").length
    const fail = results.filter((result) => result.status === "fail").length
    const tokenCount = results.reduce((sum, result) => sum + (result.tokenCount ?? 0), 0)
    const durationMs = results.reduce((sum, result) => sum + result.durationMs, 0) + stages.reduce((sum, stage) => sum + (stage.durationMs ?? 0), 0)
    return { score, pass, warn, fail, tokenCount, durationMs, returnedModels, label: scoreLabel(score, probes.length) }
  }, [modelCheck, probes.length, results, stages])

  const runTimeline = useMemo<RunTimelineItem[]>(() => {
    const stageItems = stages.map((stage, index) => {
      const meta = stageCopy[language][stage.id]
      return {
        id: `stage-${stage.id}`,
        index: index + 1,
        title: meta.name,
        description: meta.description,
        status: stage.status,
        detail: stage.detail,
        durationMs: stage.durationMs,
      }
    })

    if (probes.length > 0) {
      const probeItems = probes.map((probe, index) => {
        const result = results.find((item) => item.id === probe.id)
        const active = runningId === probe.id
        const status: StageStatus = active ? "running" : result?.status ?? "idle"
        return {
          id: `probe-${probe.id}`,
          index: stageItems.length + index + 1,
          title: probe.name[language],
          description: probe.expectation[language],
          status,
          detail: result?.reason ?? probe.expectation,
          durationMs: result?.durationMs,
          tokenCount: result?.tokenCount,
          returnedModel: result?.returnedModel,
          probe,
          result,
        }
      })

      return [...stageItems, ...probeItems]
    }

    const probeStage = stages.find((stage) => stage.id === "probes")
    const connectivityFailed = stages.some((stage) => stage.id === "connectivity" && stage.status === "fail")
    const manualStatus: StageStatus = connectivityFailed ? "idle" : probeStage?.status ?? "idle"
    const manualDetail =
      manualStatus === "warn"
        ? localText(copy.zh.manualReviewReady, copy.en.manualReviewReady)
        : localText(copy.zh.manualReviewQueued, copy.en.manualReviewQueued)

    return [
      ...stageItems,
      {
        id: "manual-review",
        index: stageItems.length + 1,
        title: t.manualReviewTitle,
        description: t.manualReviewDescription,
        status: manualStatus,
        detail: manualDetail,
      },
    ]
  }, [language, probes, results, runningId, stages, t.manualReviewDescription, t.manualReviewTitle])

  const isRunning = runningId !== null
  const selectedProvider = providerPresets.find((provider) => provider.id === selectedProviderId) ?? providerPresets[0]
  const canFetchModels = Boolean(config.baseUrl.trim() && config.apiKey.trim())
  const defaultModelOptions = useMemo(() => uniqueNonEmpty([...selectedProvider.models, config.model]), [config.model, selectedProvider.models])
  const fetchedModelOptions = useMemo(
    () => (fetchedModels.length > 0 ? uniqueNonEmpty([config.model, ...fetchedModels]) : defaultModelOptions),
    [config.model, defaultModelOptions, fetchedModels],
  )
  const effectiveRequestModel = config.model.trim() || fetchedModelOptions[0] || ""
  const normalizedRequestModelSearch = normalizeSearchValue(requestModelSearch)
  const filteredRequestModelOptions = useMemo(
    () => fetchedModelOptions.filter((model) => !normalizedRequestModelSearch || normalizeSearchValue(model).includes(normalizedRequestModelSearch)),
    [fetchedModelOptions, normalizedRequestModelSearch],
  )

  useEffect(() => {
    if (config.model.trim() || fetchedModelOptions.length === 0) return

    setConfig((current) => (current.model.trim() ? current : { ...current, model: fetchedModelOptions[0] }))
  }, [config.model, fetchedModelOptions])

  const compareModelCatalog = useMemo<CompareModelOption[]>(
    () =>
      MODEL_LIST.flatMap((group) =>
        group.models.map((model) => ({
          key: `${group.id}:${model}`,
          model,
          vendorId: group.id,
          vendorName: group.name,
          region: group.region,
          source: "catalog" as const,
        })),
      ),
    [],
  )
  const runtimeCompareOptions = useMemo<CompareModelOption[]>(() => {
    const runtimeModels = Array.from(new Set([...selectedProvider.models, ...fetchedModels, config.model, config.compareModel].filter(Boolean)))

    return runtimeModels.map((model) => {
      const matchedCatalog = compareModelCatalog.find((option) => option.model === model)
      if (matchedCatalog) return matchedCatalog

      return {
        key: `runtime:${model}`,
        model,
        vendorId: selectedProvider.id,
        vendorName: selectedProvider.name.en,
        region: selectedProvider.id === "custom" ? "global" : selectedProvider.id === "openai" || selectedProvider.id === "claude" || selectedProvider.id === "gemini" ? "global" : "china",
        source: "runtime",
      }
    })
  }, [compareModelCatalog, config.compareModel, config.model, fetchedModels, selectedProvider.id, selectedProvider.models, selectedProvider.name.en])
  const compareModelOptions = useMemo<CompareModelOption[]>(() => {
    const merged = new Map<string, CompareModelOption>()

    for (const option of compareModelCatalog) {
      merged.set(option.model, option)
    }
    for (const option of runtimeCompareOptions) {
      if (!merged.has(option.model)) {
        merged.set(option.model, option)
      }
    }

    return Array.from(merged.values())
  }, [compareModelCatalog, runtimeCompareOptions])
  const normalizedCompareModelSearch = normalizeSearchValue(compareModelSearch)
  const filteredCompareModelOptions = useMemo(
    () =>
      compareModelOptions.filter((option) => {
        if (!normalizedCompareModelSearch) return true

        return [option.model, option.vendorName, option.vendorId].some((value) => normalizeSearchValue(value).includes(normalizedCompareModelSearch))
      }),
    [compareModelOptions, normalizedCompareModelSearch],
  )
  const compareModelSections = useMemo(() => {
    const runtimeOnly = filteredCompareModelOptions.filter((option) => option.source === "runtime")
    const catalogGroups = MODEL_LIST.map((group) => ({
      ...group,
      options: filteredCompareModelOptions.filter((option) => option.vendorId === group.id),
    })).filter((group) => group.options.length > 0)

    return { runtimeOnly, catalogGroups }
  }, [filteredCompareModelOptions])
  const hasCompareModelResults = compareModelSections.runtimeOnly.length > 0 || compareModelSections.catalogGroups.length > 0

  const updateConfig = <K extends keyof RelayConfig>(key: K, value: RelayConfig[K]) => {
    setConfig((current) => ({ ...current, [key]: value }))
    setConfigError("")
    if (key === "baseUrl" || key === "apiKey" || key === "endpointMode" || key === "customPath") {
      setModelsStatus("idle")
      setModelsMessage(localText("", ""))
      setFetchedModels([])
    }
  }

  const applyProvider = (provider: ProviderPreset) => {
    setSelectedProviderId(provider.id)
    setConfig((current) => ({
      ...current,
      baseUrl: current.baseUrl.trim() ? current.baseUrl : provider.baseUrl,
      model: provider.models.includes(current.model) ? current.model : provider.models[0] || current.model || "",
      compareModel: provider.models.includes(current.compareModel) ? current.compareModel : current.compareModel || provider.models[0] || current.model || "",
      endpointMode: provider.endpointMode,
      customPath: provider.customPath ?? current.customPath,
    }))
    setConfigError("")
    setRunError(null)
  }

  const selectCompareModel = (model: string) => {
    updateConfig("compareModel", model)
    setCompareModelOpen(false)
  }

  const selectRequestModel = (model: string) => {
    updateConfig("model", model)
    setRequestModelOpen(false)
  }

  const getRunConfig = (): RelayConfig => ({
    ...config,
    model: effectiveRequestModel,
    compareModel: config.compareModel.trim(),
  })

  const validateConfig = (runConfig: RelayConfig) => {
    if (!runConfig.baseUrl.trim()) return t.errors.baseUrlMissing
    if (!runConfig.apiKey.trim()) return t.errors.apiKeyMissing
    if (!runConfig.model.trim()) return t.errors.modelMissing
    if (!runConfig.compareModel.trim()) return t.errors.compareModelMissing
    try {
      new URL(runConfig.baseUrl.trim())
    } catch {
      return t.errors.baseUrlInvalid
    }
    return ""
  }

  const generateShareImage = () => {
    const canvas = document.createElement("canvas")
    canvas.width = 1200
    canvas.height = 675
    const context = canvas.getContext("2d")
    if (!context) return

    const modelName = effectiveRequestModel || "--"
    const compareName = config.compareModel.trim() || "--"
    const label = results.length ? scoreData.label.text[language] : t.waitingDetection
    const completedAt = new Date().toLocaleString(language === "zh" ? "zh-CN" : "en-US")
    const summaryItems = [
      [t.passed, String(scoreData.pass), "#059669"],
      [t.warnings, String(scoreData.warn), "#d97706"],
      [t.risks, String(scoreData.fail), "#e11d48"],
      [t.tokenUsage, scoreData.tokenCount > 0 ? scoreData.tokenCount.toLocaleString() : "--", "#17202a"],
      [t.elapsedTime, scoreData.durationMs > 0 ? `${(scoreData.durationMs / 1000).toFixed(1)}s` : "--", "#17202a"],
    ] as const

    const roundedRect = (x: number, y: number, width: number, height: number, radius: number) => {
      context.beginPath()
      context.moveTo(x + radius, y)
      context.arcTo(x + width, y, x + width, y + height, radius)
      context.arcTo(x + width, y + height, x, y + height, radius)
      context.arcTo(x, y + height, x, y, radius)
      context.arcTo(x, y, x + width, y, radius)
      context.closePath()
    }

    const drawText = (text: string, x: number, y: number, maxWidth: number) => {
      let value = text
      while (context.measureText(value).width > maxWidth && value.length > 4) {
        value = `${value.slice(0, -4)}...`
      }
      context.fillText(value, x, y)
    }

    context.fillStyle = "#e8eef3"
    context.fillRect(0, 0, canvas.width, canvas.height)

    const gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height)
    gradient.addColorStop(0, "rgba(14, 116, 144, 0.16)")
    gradient.addColorStop(0.55, "rgba(255, 255, 255, 0.5)")
    gradient.addColorStop(1, "rgba(16, 185, 129, 0.12)")
    context.fillStyle = gradient
    context.fillRect(0, 0, canvas.width, canvas.height)

    roundedRect(54, 48, 1092, 579, 22)
    context.fillStyle = "#ffffff"
    context.fill()
    context.strokeStyle = "#d7dee7"
    context.lineWidth = 2
    context.stroke()

    context.fillStyle = "#17202a"
    context.font = "700 38px sans-serif"
    drawText(t.title, 92, 116, 720)
    context.fillStyle = "#667384"
    context.font = "500 18px sans-serif"
    drawText(`${modelName} -> ${compareName}`, 94, 154, 760)

    roundedRect(914, 78, 170, 92, 16)
    context.fillStyle = "#101820"
    context.fill()
    context.fillStyle = "#ffffff"
    context.font = "700 34px monospace"
    context.fillText(results.length ? String(scoreData.score) : "--", 938, 124)
    context.fillStyle = "#98a6b8"
    context.font = "500 15px sans-serif"
    drawText(label, 938, 151, 120)

    summaryItems.forEach(([name, value, color], index) => {
      const x = 92 + (index % 3) * 336
      const y = 220 + Math.floor(index / 3) * 124
      roundedRect(x, y, 300, 88, 14)
      context.fillStyle = "#fbfcfd"
      context.fill()
      context.strokeStyle = "#d7dee7"
      context.lineWidth = 1
      context.stroke()
      context.fillStyle = "#667384"
      context.font = "600 16px sans-serif"
      context.fillText(name, x + 22, y + 31)
      context.fillStyle = color
      context.font = "700 30px sans-serif"
      drawText(value, x + 22, y + 66, 246)
    })

    context.fillStyle = "#344253"
    context.font = "700 18px sans-serif"
    context.fillText(t.resultTraceTitle, 92, 498)
    context.font = "500 14px sans-serif"
    context.fillStyle = "#667384"
    probes.slice(0, 6).forEach((probe, index) => {
      const result = results.find((item) => item.id === probe.id)
      const x = 92 + (index % 3) * 336
      const y = 532 + Math.floor(index / 3) * 42
      context.fillStyle = result?.status === "pass" ? "#059669" : result?.status === "warn" ? "#d97706" : result?.status === "fail" ? "#e11d48" : "#8b96a5"
      context.beginPath()
      context.arc(x + 8, y - 5, 5, 0, Math.PI * 2)
      context.fill()
      context.fillStyle = "#344253"
      drawText(probe.name[language], x + 22, y, 240)
    })

    context.fillStyle = "#8b96a5"
    context.font = "500 13px monospace"
    context.fillText(completedAt, 92, 600)

    const link = document.createElement("a")
    link.download = `model-check-${Date.now()}.png`
    link.href = canvas.toDataURL("image/png")
    link.click()
  }

  const fetchModels = async () => {
    if (!config.baseUrl.trim()) {
      setConfigError(t.errors.baseUrlMissing)
      setRunError(localText(copy.zh.errors.baseUrlMissing, copy.en.errors.baseUrlMissing))
      return
    }
    if (!config.apiKey.trim()) {
      setConfigError(t.errors.apiKeyMissing)
      setRunError(localText(copy.zh.errors.apiKeyMissing, copy.en.errors.apiKeyMissing))
      return
    }
    try {
      new URL(config.baseUrl.trim())
    } catch {
      setConfigError(t.errors.baseUrlInvalid)
      setRunError(localText(copy.zh.errors.baseUrlInvalid, copy.en.errors.baseUrlInvalid))
      return
    }

    setModelsStatus("loading")
    setModelsMessage(localText("正在请求 /models。", "Requesting /models."))
    setConfigError("")

    try {
      const models = await requestModelList(config)
      if (models.length === 0) {
        throw new Error(language === "zh" ? "模型列表为空。" : "The model list is empty.")
      }
      setFetchedModels(models)
      setModelsStatus("success")
      setModelsMessage(localText(`已获取 ${models.length} 个 model。`, `Fetched ${models.length} model(s).`))
      setRunError(null)
      setConfig((current) => ({
        ...current,
        model: models.includes(current.model) ? current.model : models[0],
        compareModel: models.includes(current.compareModel) ? current.compareModel : current.compareModel || models[0],
      }))
    } catch (error) {
      const message = requestErrorMessage(error)
      setModelsStatus("error")
      setModelsMessage(message)
      setConfigError(message[language])
      setRunError(message)
    }
  }

  const reset = () => {
    setConfig(defaultConfig)
    setSelectedProviderId(providerPresets[0].id)
    setShowApiKey(false)
    setResults([])
    setRunningId(null)
    setScoreOpen(false)
    setResultsOpen(false)
    setStages(initialStages(language))
    setModelCheck({ message: localText("尚未核对", "Not checked yet") })
    setConfigError("")
    setFetchedModels([])
    setModelsStatus("idle")
    setModelsMessage(localText("", ""))
    setRunError(null)
  }

  const updateStage = (id: StageId, patch: Partial<PipelineStage>) => {
    setStages((current) => current.map((stage) => (stage.id === id ? { ...stage, ...patch } : stage)))
  }

  const runProbe = async (probe: Probe, runConfig: RelayConfig): Promise<ProbeResult> => {
    const startedAt = performance.now()
    try {
      const { content, returnedModel, tokenCount } = await requestChat(runConfig, probe.prompt)
      const judged = probe.judge(content)
      return {
        id: probe.id,
        weight: probe.weight,
        durationMs: Math.round(performance.now() - startedAt),
        tokenCount,
        returnedModel,
        content,
        ...judged,
      }
    } catch (error) {
      return {
        id: probe.id,
        weight: probe.weight,
        status: "fail",
        durationMs: Math.round(performance.now() - startedAt),
        error: requestErrorMessage(error),
        reason: localText("探针请求未得到可判定的 OpenAI-compatible 响应。", "The probe did not receive a judgeable OpenAI-compatible response."),
      }
    }
  }

  const runAll = async () => {
    setScoreOpen(false)
    setResultsOpen(true)
    setResults([])
    setStages(initialStages(language))
    setModelCheck({ message: localText("尚未核对", "Not checked yet") })
    setConfigError("")
    setRunError(null)
    setRunningId("validation")
    updateStage("validation", {
      status: "running",
      detail: localText("正在检查 Base URL、API Key、请求模型和对比模型。", "Checking Base URL, API key, request model, and compare model."),
    })

    const runConfig = getRunConfig()
    const validationMessage = validateConfig(runConfig)
    if (validationMessage) {
      setConfigError(validationMessage)
      const bilingualValidation =
        validationMessage === t.errors.baseUrlMissing
          ? localText(copy.zh.errors.baseUrlMissing, copy.en.errors.baseUrlMissing)
          : validationMessage === t.errors.apiKeyMissing
            ? localText(copy.zh.errors.apiKeyMissing, copy.en.errors.apiKeyMissing)
            : validationMessage === t.errors.modelMissing
              ? localText(copy.zh.errors.modelMissing, copy.en.errors.modelMissing)
              : validationMessage === t.errors.compareModelMissing
                ? localText(copy.zh.errors.compareModelMissing, copy.en.errors.compareModelMissing)
                : localText(copy.zh.errors.baseUrlInvalid, copy.en.errors.baseUrlInvalid)
      setRunError(bilingualValidation)
      updateStage("validation", {
        status: "fail",
        detail: bilingualValidation,
      })
      updateStage("connectivity", {
        status: "idle",
        detail: localText("配置校验未通过，未发送请求。", "Config check failed, so no request was sent."),
      })
      updateStage("model-match", {
        status: "idle",
        detail: localText("配置校验未通过，未执行模型核对。", "Config check failed, so the model check was not run."),
      })
      updateStage("probes", {
        status: "idle",
        detail: localText("配置校验未通过，未运行能力探针。", "Config check failed, so capability probes were not run."),
      })
      setRunningId(null)
      return
    }

    updateStage("validation", {
      status: "pass",
      detail: localText("配置完整，准备发起连通性请求。", "Config is complete. Preparing the connectivity request."),
    })
    setRunningId("connectivity")

    const connectivityStartedAt = performance.now()
    try {
      updateStage("connectivity", {
        status: "running",
        detail: localText("正在发送最小 OpenAI-compatible 请求", "Sending a minimal OpenAI-compatible request"),
      })
      const ping = await requestChat(runConfig, "只输出 PONG", 16)
      updateStage("connectivity", {
        status: "pass",
        detail: localText("接口可联通，响应结构兼容。", "Endpoint is reachable and the response shape is compatible."),
        durationMs: Math.round(performance.now() - connectivityStartedAt),
      })

      updateStage("model-match", {
        status: "running",
        detail: localText("正在比对返回模型名", "Comparing the returned model name"),
      })
      const returnedModel = ping.returnedModel
      const expectedModel = runConfig.compareModel.trim()
      const modelMatches = Boolean(returnedModel && expectedModel && returnedModel === expectedModel)
      const modelDetail = localText(
        `返回模型：${returnedModel || "未提供"}；对比模型：${expectedModel || "未提供"}。`,
        `Returned model: ${returnedModel || "not provided"}; compare model: ${expectedModel || "not provided"}.`,
      )

      setModelCheck({
        returnedModel,
        message: modelDetail,
      })
      updateStage("model-match", {
        status: modelMatches ? "pass" : "fail",
        detail: modelDetail,
        durationMs: 0,
      })
    } catch (error) {
      const message = requestErrorMessage(error)
      setRunError(message)
      updateStage("connectivity", {
        status: "fail",
        detail: message,
        durationMs: Math.round(performance.now() - connectivityStartedAt),
      })
      updateStage("model-match", {
        status: "idle",
        detail: localText("连通失败，未执行模型核对。", "Connectivity failed, so the model check was not run."),
      })
      updateStage("probes", {
        status: "idle",
        detail: localText("连通失败，未运行能力探针。", "Connectivity failed, so capability probes were not run."),
      })
      setRunningId(null)
      return
    }

    if (probes.length === 0) {
      updateStage("probes", {
        status: "warn",
        detail: localText(copy.zh.noAutoProbes, copy.en.noAutoProbes),
      })
      setRunningId(null)
      return
    }

    updateStage("probes", {
      status: "running",
      detail: localText(`正在执行 ${activePlaybook.title[language]} 的专属题目`, `Running the model-specific prompts from ${activePlaybook.title[language]}`),
    })
    const completedResults: ProbeResult[] = []
    for (const probe of probes) {
      setRunningId(probe.id)
      const result = await runProbe(probe, runConfig)
      completedResults.push(result)
      setResults((current) => [...current, result])
    }
    const failedCount = completedResults.filter((result) => result.status === "fail").length
    const warnedCount = completedResults.filter((result) => result.status === "warn").length
    updateStage("probes", {
      status: failedCount > 0 ? "fail" : warnedCount > 0 ? "warn" : "pass",
      detail:
        failedCount > 0
          ? localText(`${failedCount} 个风险项，${warnedCount} 个观察项。`, `${failedCount} risk item(s), ${warnedCount} watch item(s).`)
          : warnedCount > 0
            ? localText(`${warnedCount} 个观察项，其余通过。`, `${warnedCount} watch item(s), all others passed.`)
            : localText(`${probes.length} 个自动题全部命中。`, `All ${probes.length} automated probes matched.`),
    })
    setRunningId(null)
    setScoreOpen(true)
  }

  const endpointPreviewConfig = { ...config, model: effectiveRequestModel }
  const endpointPreview = endpointPreviewConfig.baseUrl.trim() ? buildEndpoint(endpointPreviewConfig) : t.waitingBaseUrl
  const probeCount = probes.length
  const resultCountLabel = `${results.length}/${probeCount}`
  const ScoreIcon = scoreData.label.icon

  return (
    <main className={`min-h-screen ${dark ? "theme-dark bg-[#070a0f] text-[#e7edf4]" : "bg-[#e8eef3] text-[#16202c]"}`}>
      <div
        className={`pointer-events-none fixed inset-0 ${
          dark
            ? "bg-[linear-gradient(135deg,rgba(20,184,166,0.16),transparent_32%),linear-gradient(90deg,rgba(59,130,246,0.12),transparent_45%,rgba(16,185,129,0.08))]"
            : "bg-[linear-gradient(135deg,rgba(11,18,32,0.06),transparent_34%),linear-gradient(90deg,rgba(14,116,144,0.08),transparent_42%,rgba(16,185,129,0.06))]"
        }`}
      />

      {scoreOpen && results.length > 0 && results.length === probeCount && !isRunning && (
        <div className="fixed right-6 top-6 z-50 w-[320px] max-w-[calc(100vw-32px)] rounded-lg border border-[#101820] bg-white p-4 shadow-[0_24px_70px_rgba(17,24,39,0.22)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xs font-semibold text-[#667384]">{t.score}</div>
              <div className="mt-1 flex items-center gap-2">
                <ScoreIcon className={scoreData.label.tone} size={22} />
                <span className="font-mono text-4xl font-semibold leading-none text-[#17202a]">{scoreData.score}</span>
              </div>
              <div className={`mt-2 text-sm font-semibold ${scoreData.label.tone}`}>{scoreData.label.text[language]}</div>
            </div>
            <button
              type="button"
              onClick={() => setScoreOpen(false)}
              className="grid h-8 w-8 place-items-center rounded-md border border-[#cad3df] text-[#667384] transition hover:bg-[#f3f6f9] hover:text-[#17202a]"
              aria-label={t.score}
            >
              <XCircle size={16} />
            </button>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="rounded-md border border-[#d7dee7] bg-[#fbfcfd] px-3 py-2">
              <div className="text-[11px] font-medium text-[#667384]">{t.passed}</div>
              <div className="mt-0.5 text-xl font-semibold text-emerald-600">{scoreData.pass}</div>
            </div>
            <div className="rounded-md border border-[#d7dee7] bg-[#fbfcfd] px-3 py-2">
              <div className="text-[11px] font-medium text-[#667384]">{t.warnings}</div>
              <div className="mt-0.5 text-xl font-semibold text-amber-600">{scoreData.warn}</div>
            </div>
            <div className="rounded-md border border-[#d7dee7] bg-[#fbfcfd] px-3 py-2">
              <div className="text-[11px] font-medium text-[#667384]">{t.risks}</div>
              <div className="mt-0.5 text-xl font-semibold text-rose-600">{scoreData.fail}</div>
            </div>
            <div className="rounded-md border border-[#d7dee7] bg-[#fbfcfd] px-3 py-2">
              <div className="text-[11px] font-medium text-[#667384]">{t.elapsedTime}</div>
              <div className="mt-0.5 text-xl font-semibold text-[#17202a]">{scoreData.durationMs > 0 ? `${(scoreData.durationMs / 1000).toFixed(1)}s` : "--"}</div>
            </div>
          </div>
        </div>
      )}

      <div className="relative mx-auto grid min-h-screen w-full max-w-7xl items-start gap-4 p-4 lg:grid-cols-[380px_1fr] lg:px-6 lg:py-3">
        <GlassPanel className="primary-panel self-start overflow-visible lg:sticky lg:top-0">
          <div className="space-y-3 p-3">
            <div className="rounded-lg border border-[#d9e1ea] bg-[#f7f9fb] p-2.5">
              <div className="mb-2 text-xs font-medium text-[#667384]">{t.providerTemplates}</div>
              <div className="grid grid-cols-4 gap-2">
                {providerPresets.map((provider) => {
                  const active = selectedProviderId === provider.id
                  return (
                    <button
                      key={provider.id}
                      type="button"
                      onClick={() => applyProvider(provider)}
                      className={`flex h-12 flex-col items-center justify-center gap-1 rounded-md border text-xs transition ${
                        active
                          ? "border-[#0f766e] bg-[#0f766e] text-white shadow-sm"
                          : "border-[#d7dee7] bg-white text-[#667384] hover:border-[#9bb6c5] hover:text-[#17202a]"
                      }`}
                      title={provider.name[language]}
                    >
                      <ProviderLogo
                        provider={provider}
                        className={`h-5 w-5 ${active ? "border-white/25 bg-white text-[#0f766e]" : "border-[#cbd5e1] bg-white text-[#526070]"}`}
                      />
                      <span className="max-w-full truncate px-1">{provider.name[language]}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <label className="mb-1 block font-semibold">
              <span className="mb-1 flex items-center gap-2 text-xs font-semibold text-[#667384]">
                <Server size={14} />
                {t.baseUrl}
              </span>
              <input
                value={config.baseUrl}
                onChange={(event) => updateConfig("baseUrl", event.target.value)}
                placeholder="https://elysiver.h-e.top/"
                className="h-10 w-full rounded-md border border-[#cad3df] bg-white px-3 text-sm text-[#17202a] outline-none transition placeholder:text-[#9aa5b4] focus:border-[#0e7490] focus:ring-2 focus:ring-[#0e7490]/15"
              />
            </label>

            <div className="rounded-lg border border-[#d9e1ea] bg-[#f7f9fb] p-2.5">
              <div className="mb-2 text-xs font-medium text-[#667384]">{t.endpointPath}</div>
              <div className="grid grid-cols-5 gap-1 rounded-md border border-[#d7dee7] bg-white p-1">
                {(["openai", "anthropic", "gemini", "full", "custom"] as EndpointMode[]).map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => updateConfig("endpointMode", value)}
                    className={`h-8 rounded text-xs font-medium transition ${
                      config.endpointMode === value ? "bg-[#101820] text-white" : "text-[#667384] hover:bg-[#edf2f7] hover:text-[#17202a]"
                    }`}
                  >
                    {t.endpointModes[value]}
                  </button>
                ))}
              </div>

              {config.endpointMode === "custom" && (
                <input
                  value={config.customPath}
                  onChange={(event) => updateConfig("customPath", event.target.value)}
                  placeholder="/v1/chat/completions"
                  className="mt-2 h-9 w-full rounded-md border border-[#cad3df] bg-white px-3 font-mono text-xs text-[#17202a] outline-none transition placeholder:text-[#9aa5b4] focus:border-[#0e7490] focus:ring-2 focus:ring-[#0e7490]/15"
                />
              )}

              <div className="mt-2 rounded-md border border-[#d7dee7] bg-white px-2 py-1.5 font-mono text-[11px] leading-5 text-[#0f766e]">
                POST {endpointPreview}
              </div>
              <div className="mt-2 text-[11px] leading-4 text-[#667384]">{t.proxyMode}</div>
            </div>

            <label className="mb-1 block font-semibold">
              <span className="mb-1 flex items-center gap-2 text-xs font-semibold text-[#667384]">
                <KeyRound size={14} />
                {t.apiKey}
              </span>
              <div className="flex overflow-hidden rounded-md border border-[#cad3df] bg-white focus-within:border-[#0e7490] focus-within:ring-2 focus-within:ring-[#0e7490]/15">
                <input
                  value={config.apiKey}
                  onChange={(event) => updateConfig("apiKey", event.target.value)}
                  type={showApiKey ? "text" : "password"}
                  placeholder="sk-..."
                  className="h-10 min-w-0 flex-1 bg-transparent px-3 text-sm text-[#17202a] outline-none placeholder:text-[#9aa5b4]"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey((current) => !current)}
                  className="grid h-10 w-10 place-items-center border-l border-[#d7dee7] text-[#667384] transition hover:bg-[#f3f6f9] hover:text-[#17202a]"
                  title={showApiKey ? t.hideApiKey : t.showApiKey}
                >
                  {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </label>

            <div className="rounded-lg border border-[#d9e1ea] bg-[#f7f9fb] p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-xs font-medium text-[#667384]">
                    <ListChecks size={14} />
                    {t.fetchedModels}
                  </div>
                  <div className="mt-1 text-[11px] leading-4 text-[#667384]">
                    {modelsMessage[language] || t.modelsFetchHint}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={fetchModels}
                  disabled={!canFetchModels || modelsStatus === "loading"}
                  className="inline-flex h-8 shrink-0 items-center gap-1 rounded-md border border-[#cad3df] bg-white px-2 text-xs font-medium text-[#17202a] transition hover:bg-[#edf2f7] disabled:cursor-not-allowed disabled:opacity-55"
                >
                  {modelsStatus === "loading" ? <Loader2 className="animate-spin" size={13} /> : <RefreshCw size={13} />}
                  {modelsStatus === "loading" ? t.fetchingModels : t.fetchModels}
                </button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <label className="mb-1 block font-semibold">
                <span className="mb-1 flex items-center gap-2 text-xs font-semibold text-[#667384]">
                  <Activity size={14} />
                  {t.requestModel}
                </span>
                <div ref={requestModelPanelRef} className="relative">
                  <div className="flex overflow-hidden rounded-md border border-[#cad3df] bg-white focus-within:border-[#0e7490] focus-within:ring-2 focus-within:ring-[#0e7490]/15">
                    <input
                      value={config.model}
                      onChange={(event) => {
                        updateConfig("model", event.target.value)
                        setRequestModelOpen(true)
                      }}
                      onFocus={() => setRequestModelOpen(true)}
                      placeholder={t.requestModelPlaceholder}
                      className="h-10 min-w-0 flex-1 bg-transparent px-3 text-sm text-[#17202a] outline-none placeholder:text-[#9aa5b4]"
                    />
                    <button
                      type="button"
                      onClick={() => setRequestModelOpen((current) => !current)}
                      className="grid h-10 w-10 place-items-center border-l border-[#d7dee7] text-[#667384] transition hover:bg-[#f3f6f9] hover:text-[#17202a]"
                      aria-label={t.requestModelPicker}
                      title={t.requestModelPicker}
                    >
                      <ChevronDown className={`transition-transform ${requestModelOpen ? "rotate-180" : ""}`} size={16} />
                    </button>
                  </div>

                  {requestModelOpen && (
                    <div className="absolute bottom-[calc(100%+8px)] left-0 right-0 z-50 overflow-hidden rounded-lg border-2 border-black bg-white shadow-[0_18px_45px_rgba(17,24,39,0.12)]">
                      <div className="border-b border-[#e5e7eb] bg-[#fbfcfd] p-2">
                        <div className="flex items-center gap-2 rounded-md border border-[#d7dee7] bg-white px-2">
                          <Search size={14} className="text-[#8b96a5]" />
                          <input
                            ref={requestModelSearchRef}
                            value={requestModelSearch}
                            onChange={(event) => setRequestModelSearch(event.target.value)}
                            placeholder={t.requestModelSearch}
                            className="h-9 w-full bg-transparent text-sm text-[#17202a] outline-none placeholder:text-[#9aa5b4]"
                          />
                        </div>
                      </div>

                      <div className="max-h-[22rem] overflow-y-auto p-2">
                        {filteredRequestModelOptions.length > 0 ? (
                          <div>
                            <div className="mb-2 flex items-center justify-between gap-2 px-1">
                              <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#8b96a5]">
                                {fetchedModels.length > 0 ? t.fetchedModels : t.providerModel}
                              </span>
                              <span className="text-[11px] text-[#8b96a5]">{filteredRequestModelOptions.length}</span>
                            </div>
                            <div className="space-y-1">
                              {filteredRequestModelOptions.map((model) => (
                                <button
                                  key={model}
                                  type="button"
                                  onClick={() => selectRequestModel(model)}
                                  className="flex w-full items-center justify-between gap-3 rounded-md px-2 py-2 text-left transition hover:bg-[#f3f6f9]"
                                >
                                  <span className="block min-w-0 truncate text-sm font-medium text-[#17202a]">{model}</span>
                                  {config.model === model && <Check size={14} className="shrink-0 text-emerald-600" />}
                                </button>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="px-2 py-6 text-center text-sm text-[#667384]">{t.modelSearchEmpty}</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </label>

              <label className="mb-1 block font-semibold">
                <span className="mb-1 flex items-center gap-2 text-xs font-semibold text-[#667384]">
                  <Activity size={14} />
                  {t.compareModel}
                </span>
                <div ref={compareModelPanelRef} className="relative">
                  <div className="flex overflow-hidden rounded-md border border-[#cad3df] bg-white focus-within:border-[#0e7490] focus-within:ring-2 focus-within:ring-[#0e7490]/15">
                    <input
                      value={config.compareModel}
                      onChange={(event) => updateConfig("compareModel", event.target.value)}
                      onFocus={() => setCompareModelOpen(true)}
                      placeholder={t.compareModelPlaceholder}
                      className="h-10 min-w-0 flex-1 bg-transparent px-3 text-sm text-[#17202a] outline-none placeholder:text-[#9aa5b4]"
                    />
                    <button
                      type="button"
                      onClick={() => setCompareModelOpen((current) => !current)}
                      className="grid h-10 w-10 place-items-center border-l border-[#d7dee7] text-[#667384] transition hover:bg-[#f3f6f9] hover:text-[#17202a]"
                      aria-label={t.compareModelPicker}
                      title={t.compareModelPicker}
                    >
                      <ChevronDown className={`transition-transform ${compareModelOpen ? "rotate-180" : ""}`} size={16} />
                    </button>
                  </div>

                  {compareModelOpen && (
                    <div className="absolute bottom-[calc(100%+8px)] left-0 right-0 z-50 overflow-hidden rounded-lg border-2 border-black bg-white shadow-[0_18px_45px_rgba(17,24,39,0.12)]">
                      <div className="border-b border-[#e5e7eb] bg-[#fbfcfd] p-2">
                        <div className="flex items-center gap-2 rounded-md border border-[#d7dee7] bg-white px-2">
                          <Search size={14} className="text-[#8b96a5]" />
                          <input
                            ref={compareModelSearchRef}
                            value={compareModelSearch}
                            onChange={(event) => setCompareModelSearch(event.target.value)}
                            placeholder={t.compareModelSearch}
                            className="h-9 w-full bg-transparent text-sm text-[#17202a] outline-none placeholder:text-[#9aa5b4]"
                          />
                        </div>
                      </div>

                      <div className="max-h-[22rem] overflow-y-auto p-2">
                        {compareModelSections.runtimeOnly.length > 0 && (
                          <div className="mb-3">
                            <div className="mb-2 flex items-center justify-between gap-2 px-1">
                              <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#8b96a5]">{t.runtimeModels}</span>
                              <span className="text-[11px] text-[#8b96a5]">{compareModelSections.runtimeOnly.length}</span>
                            </div>
                            <div className="space-y-1">
                              {compareModelSections.runtimeOnly.map((option) => (
                                <button
                                  key={option.key}
                                  type="button"
                                  onClick={() => selectCompareModel(option.model)}
                                  className="flex w-full items-center justify-between gap-3 rounded-md px-2 py-2 text-left transition hover:bg-[#f3f6f9]"
                                >
                                  <span className="min-w-0">
                                    <span className="block truncate text-sm font-medium text-[#17202a]">{option.model}</span>
                                  </span>
                                  <span className="inline-flex items-center gap-2">
                                    <span className="rounded border border-[#d7dee7] bg-white px-1.5 py-0.5 text-[10px] font-medium text-[#667384]">{option.vendorName}</span>
                                    {config.compareModel === option.model && <Check size={14} className="text-emerald-600" />}
                                  </span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {compareModelSections.catalogGroups.length > 0 ? (
                          <div className="space-y-3">
                            {(["global", "china"] as ModelRegion[]).map((region) => {
                              const groups = compareModelSections.catalogGroups.filter((group) => group.region === region)
                              if (groups.length === 0) return null

                              return (
                                <div key={region}>
                                  <div className="mb-2 flex items-center justify-between gap-2 px-1">
                                    <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#8b96a5]">{regionLabels[region][language]}</span>
                                    <span className="text-[11px] text-[#8b96a5]">{t.compareModelCatalog}</span>
                                  </div>
                                  <div className="space-y-2">
                                    {groups.map((group) => (
                                      <div key={group.id} className="rounded-md border border-[#e5e7eb] bg-[#fbfcfd] p-2">
                                        <div className="mb-2 flex items-center justify-between gap-2 px-1">
                                          <span className="text-xs font-semibold text-[#344253]">{group.name}</span>
                                          <span className="text-[11px] text-[#8b96a5]">{group.options.length}</span>
                                        </div>
                                        <div className="space-y-1">
                                          {group.options.map((option) => (
                                            <button
                                              key={option.key}
                                              type="button"
                                              onClick={() => selectCompareModel(option.model)}
                                              className="flex w-full items-center justify-between gap-3 rounded-md px-2 py-2 text-left transition hover:bg-white"
                                            >
                                              <span className="block min-w-0 truncate text-sm text-[#17202a]">{option.model}</span>
                                              {config.compareModel === option.model && <Check size={14} className="shrink-0 text-emerald-600" />}
                                            </button>
                                          ))}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        ) : null}

                        {!hasCompareModelResults && <div className="px-2 py-6 text-center text-sm text-[#667384]">{t.modelSearchEmpty}</div>}
                      </div>
                    </div>
                  )}
                </div>
              </label>
            </div>
          </div>

          {configError && <div className="mx-4 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{configError}</div>}

          <div className="px-3 pb-3 pt-1">
            <button
              type="button"
              onClick={runAll}
              disabled={isRunning}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 text-sm font-semibold text-white shadow-lg shadow-blue-500/24 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-500/28 disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-60"
            >
              {isRunning ? <Loader2 className="animate-spin" size={18} /> : <Play size={18} />}
              {isRunning ? t.running : t.run}
            </button>
          </div>
        </GlassPanel>

        <div className="relative grid content-start gap-2">
          <GlassPanel className="p-3">
            <div className="border-b border-[#e5e7eb] pb-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h1 className="text-lg font-semibold tracking-normal text-[#17202a]">{t.title}</h1>
                  <div className="mt-0.5 text-xs font-semibold text-[#667384]">{t.subtitle}</div>
                  <div className="mt-1 text-[11px] leading-5 text-[#667384]">
                    <span className="font-semibold text-[#526070]">{t.flowTitle}</span>
                    {" · "}
                    {t.flowDescription}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isRunning && <Loader2 className="animate-spin text-sky-600" size={18} />}
                  <button
                    type="button"
                    onClick={generateShareImage}
                    className="grid h-8 w-8 place-items-center rounded-md border border-[#cad3df] bg-white text-[#526070] transition hover:-translate-y-0.5 hover:bg-[#f3f6f9]"
                    title={t.shareImage}
                    aria-label={t.shareImage}
                  >
                    <Download size={17} />
                  </button>
                  <button
                    type="button"
                    onClick={reset}
                    className="grid h-8 w-8 place-items-center rounded-md border border-[#cad3df] bg-white text-[#526070] transition hover:-translate-y-0.5 hover:bg-[#f3f6f9]"
                    title={t.reset}
                  >
                    <RotateCcw size={17} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setLanguage((current) => (current === "zh" ? "en" : "zh"))}
                    className="grid h-8 w-8 place-items-center rounded-md border border-[#cad3df] bg-white text-[#526070] transition hover:-translate-y-0.5 hover:bg-[#f3f6f9]"
                    title={t.switchLanguage}
                    aria-label={t.switchLanguage}
                  >
                    <Languages size={17} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setTheme((current) => (current === "light" ? "dark" : "light"))}
                    className="grid h-8 w-8 place-items-center rounded-md border border-[#cad3df] bg-white text-[#526070] transition hover:-translate-y-0.5 hover:bg-[#f3f6f9]"
                    title={t.switchTheme}
                    aria-label={t.switchTheme}
                  >
                    {dark ? <Moon size={17} /> : <Sun size={17} />}
                  </button>
                </div>
              </div>
            </div>

            <div className="py-3">
              <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
              {stages.map((stage, index) => {
                const meta = stageCopy[language][stage.id]
                return (
                  <div key={stage.id} className="relative rounded-lg border border-[#d7dee7] bg-[#fbfcfd] p-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <FieldIcon>
                          <StageIcon status={stage.status} />
                        </FieldIcon>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-[#8b96a5]">0{index + 1}</span>
                            <span className="shrink-0 whitespace-nowrap text-sm font-semibold text-[#17202a]">{meta.name}</span>
                          </div>
                          <div className="mt-0.5 text-xs leading-4 text-[#667384]">{meta.description}</div>
                        </div>
                      </div>
                      <StageBadge status={stage.status} language={language} />
                    </div>
                    <div className="mt-1.5 rounded-md border border-[#d7dee7] bg-white px-2 py-1 text-xs leading-4 text-[#526070]">
                      {stage.detail[language]}
                      {typeof stage.durationMs === "number" && <span className="ml-2 font-mono text-[#8b96a5]">{stage.durationMs} ms</span>}
                    </div>
                  </div>
                )
              })}
              </div>
            </div>
          </GlassPanel>

          <GlassPanel className="order-3 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-xs font-semibold text-[#667384]">{t.playbookTitle}</div>
                <h2 className="mt-1 text-base font-semibold text-[#17202a]">{activePlaybook.title[language]}</h2>
                <p className="mt-1 text-sm leading-6 text-[#526070]">{activePlaybook.automatedNote[language]}</p>
              </div>
              <div className="rounded-md border border-[#d7dee7] bg-[#fbfcfd] px-3 py-2 text-right">
                <div className="text-[11px] font-medium text-[#667384]">{t.playbookAuto}</div>
                <div className="mt-1 font-mono text-lg font-semibold text-[#17202a]">{probes.length}</div>
              </div>
            </div>

            <div className="mt-4 grid gap-3 lg:grid-cols-3">
              <div className="rounded-lg border border-[#d7dee7] bg-[#fbfcfd] p-3">
                <div className="text-xs font-semibold text-[#667384]">{t.playbookAppliesTo}</div>
                <p className="mt-2 text-sm leading-6 text-[#344253]">{activePlaybook.appliesTo[language]}</p>
              </div>
              <div className="rounded-lg border border-[#d7dee7] bg-[#fbfcfd] p-3">
                <div className="text-xs font-semibold text-[#667384]">{t.playbookSummary}</div>
                <p className="mt-2 text-sm leading-6 text-[#344253]">{activePlaybook.summary[language]}</p>
                <p className="mt-2 text-sm leading-6 text-[#667384]">{activePlaybook.whyDifferent[language]}</p>
              </div>
              <div className="rounded-lg border border-[#d7dee7] bg-[#fbfcfd] p-3">
                <div className="text-xs font-semibold text-[#667384]">{t.playbookCaution}</div>
                <p className="mt-2 text-sm leading-6 text-[#344253]">{activePlaybook.caution[language]}</p>
              </div>
            </div>

            <div className="mt-4 grid gap-3 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-lg border border-[#d7dee7] bg-[#fbfcfd] p-3">
                <div className="text-xs font-semibold text-[#667384]">{t.playbookManual}</div>
                <div className="mt-2 space-y-2">
                  {activePlaybook.manualChecks.map((check) => (
                    <div key={check.id} className="rounded-md border border-[#d7dee7] bg-white px-3 py-2">
                      <div className="text-sm font-semibold text-[#17202a]">{check.title[language]}</div>
                      <p className="mt-1 text-sm leading-6 text-[#526070]">{check.detail[language]}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-[#d7dee7] bg-[#fbfcfd] p-3">
                <div className="text-xs font-semibold text-[#667384]">{t.playbookSources}</div>
                <div className="mt-2 space-y-2">
                  {activePlaybook.sources.map((source) => (
                    <a
                      key={source.id}
                      href={source.url}
                      target="_blank"
                      rel="noreferrer"
                      className="block rounded-md border border-[#d7dee7] bg-white px-3 py-2 transition hover:border-[#9bb6c5] hover:bg-[#f7f9fb]"
                    >
                      <div className="text-sm font-semibold text-[#17202a]">{source.title[language]}</div>
                      <p className="mt-1 text-sm leading-6 text-[#526070]">{source.detail[language]}</p>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </GlassPanel>

          <GlassPanel className="order-1 overflow-hidden">
            <div className="flex items-center justify-between gap-3 border-b border-[#e5e7eb] bg-[#fbfcfd] px-4 py-3">
              <div>
                <h2 className="text-sm font-semibold text-[#17202a]">{resultsOpen ? t.resultTraceTitle : t.processTitle}</h2>
                <div className="mt-0.5 text-xs text-[#667384]">{resultsOpen ? t.resultTraceDescription : t.processDescription}</div>
              </div>
              <button
                type="button"
                onClick={() => setResultsOpen((current) => !current)}
                className="inline-flex h-8 shrink-0 items-center gap-1 rounded-md border border-[#cad3df] bg-white px-2 text-xs font-medium text-[#17202a] transition hover:bg-[#edf2f7]"
                aria-expanded={resultsOpen}
              >
                {resultsOpen ? t.hideResults : t.showResults}
                <span className="font-mono text-[11px] text-[#667384]">{resultCountLabel}</span>
                <ChevronDown className={`transition-transform duration-300 ${resultsOpen ? "rotate-180" : ""}`} size={14} />
              </button>
            </div>

            {resultsOpen ? (
              <div className="divide-y divide-[#d7dee7]">
                {runTimeline.map((item) => {
                  const hasProbeDetail = Boolean(item.probe)

                  if (hasProbeDetail) {
                    return (
                      <details key={item.id} className="group">
                        <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3 transition hover:bg-[#f7f9fb]">
                          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md border border-[#d7dee7] bg-white font-mono text-[11px] text-[#667384]">
                            {item.index}
                          </span>
                          <FieldIcon>
                            <StageIcon status={item.status} />
                          </FieldIcon>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-semibold text-[#17202a]">{item.title}</span>
                              {item.probe && <span className="rounded border border-[#d7dee7] bg-white px-1.5 py-0.5 font-mono text-[11px] text-[#667384]">{item.probe.weight}</span>}
                              <StageBadge status={item.status} language={language} />
                            </div>
                            <div className="mt-1 truncate text-xs text-[#667384]">{item.detail[language]}</div>
                          </div>
                          <div className="hidden text-right text-xs text-[#667384] sm:block">
                            <div>{typeof item.durationMs === "number" ? `${item.durationMs} ms` : "--"}</div>
                            <div className="mt-1 max-w-36 truncate font-mono">{item.tokenCount ? `${item.tokenCount} tokens` : (item.returnedModel ?? "--")}</div>
                          </div>
                          <ChevronDown className="text-[#7a8594] transition group-open:rotate-180" size={16} />
                        </summary>

                        <div className="grid gap-3 bg-[#f7f9fb] px-4 pb-4 pt-1 md:grid-cols-2">
                          <div className="rounded-md border border-[#d7dee7] bg-white p-3">
                            <div className="mb-2 text-xs font-medium text-[#667384]">{t.prompt}</div>
                            <p className="text-sm leading-6 text-[#344253]">{item.probe?.prompt}</p>
                          </div>
                          <div className="rounded-md border border-[#d7dee7] bg-white p-3">
                            <div className="mb-2 text-xs font-medium text-[#667384]">{t.raw}</div>
                            <pre className="max-h-44 overflow-auto whitespace-pre-wrap break-words font-mono text-xs leading-5 text-[#344253]">
                              {item.result?.content || item.result?.error?.[language] || t.notRun}
                            </pre>
                          </div>
                        </div>
                      </details>
                    )
                  }

                  return (
                    <div key={item.id} className="flex items-start gap-3 px-4 py-3">
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md border border-[#d7dee7] bg-white font-mono text-[11px] text-[#667384]">
                        {item.index}
                      </span>
                      <FieldIcon>
                        <StageIcon status={item.status} />
                      </FieldIcon>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-semibold text-[#17202a]">{item.title}</span>
                          <StageBadge status={item.status} language={language} />
                        </div>
                        <div className="mt-1 text-xs leading-5 text-[#667384]">{item.description}</div>
                        <div className="mt-1 text-sm leading-6 text-[#344253]">
                          {item.detail[language]}
                          {typeof item.durationMs === "number" && <span className="ml-2 font-mono text-xs text-[#8b96a5]">{item.durationMs} ms</span>}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              probes.length > 0 ? (
                <div className="grid gap-2 p-4 md:grid-cols-2 xl:grid-cols-3">
                  {probes.map((probe, index) => {
                    const result = results.find((item) => item.id === probe.id)
                    const active = runningId === probe.id
                    return (
                      <div key={probe.id} className="rounded-lg border border-[#d7dee7] bg-[#fbfcfd] p-2.5">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-2">
                            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md border border-[#d7dee7] bg-white font-mono text-[11px] text-[#667384]">
                              {index + 1}
                            </span>
                            <div className="min-w-0">
                              <div className="truncate text-sm font-semibold text-[#17202a]">{probe.name[language]}</div>
                              <div className="mt-0.5 truncate text-[11px] text-[#667384]">{probe.expectation[language]}</div>
                            </div>
                          </div>
                          {active ? (
                            <span className="inline-flex h-6 items-center gap-1 rounded-md border border-sky-200 bg-sky-50 px-2 text-[11px] font-medium text-sky-700">
                              <Loader2 className="animate-spin" size={13} />
                              {t.status.running}
                            </span>
                          ) : result ? (
                            <StatusPill status={result.status} language={language} />
                          ) : (
                            <span className="inline-flex h-6 items-center gap-1 rounded-md border border-[#dbe2ea] bg-[#f6f8fa] px-2 text-[11px] font-medium text-[#6d7785]">
                              <span className="h-2 w-2 rounded-full bg-[#9aa5b4]" />
                              {t.status.idle}
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="px-4 py-8 text-sm leading-6 text-[#526070]">{t.noAutoProbes}</div>
              )
            )}
          </GlassPanel>

          {runError && (
            <div className="order-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-rose-800">
              <div className="flex items-start gap-3">
                <XCircle className="mt-0.5 shrink-0" size={18} />
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold">{t.errorOverlayTitle}</h3>
                  <p className="mt-1 text-sm leading-6">{runError[language]}</p>
                  <p className="mt-1 text-xs leading-5 text-rose-700/80">{t.errorOverlayDescription}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
