'use client';

import { MODEL_LIST, type ModelRegion } from '@/lib/model-list';
import {
  getPlaybookForModel,
  type Language,
  type LocalizedText,
  type ModelPlaybook,
  type PlaybookProbe as Probe,
} from '@/lib/model-playbooks';
import {
  Activity,
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  Download,
  Eye,
  EyeOff,
  Gauge,
  Hash,
  KeyRound,
  Languages,
  ListChecks,
  Loader2,
  Play,
  RefreshCw,
  RotateCcw,
  Search,
  Server,
  ShieldAlert,
  ShieldCheck,
  Timer,
  XCircle,
} from 'lucide-react';
import {
  CSSProperties,
  ComponentType,
  ImgHTMLAttributes,
  ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

type RelayConfig = {
  baseUrl: string;
  apiKey: string;
  model: string;
  compareModel: string;
  endpointMode: EndpointMode;
  customPath: string;
};

type EndpointMode = 'openai' | 'anthropic' | 'gemini' | 'full' | 'custom';
type ProbeStatus = 'idle' | 'running' | 'pass' | 'warn' | 'fail';
type StageStatus = ProbeStatus;
type StageId = 'validation' | 'connectivity' | 'model-match' | 'probes';
type ModelFetchStatus = 'idle' | 'loading' | 'success' | 'error';

type ProbeResult = {
  id: string;
  weight: number;
  status: Exclude<ProbeStatus, 'idle' | 'running'>;
  durationMs: number;
  tokenCount?: number;
  returnedModel?: string;
  content?: string;
  error?: LocalizedText;
  reason: LocalizedText;
};

type ChatResult = {
  content: string;
  returnedModel?: string;
  tokenCount?: number;
};

type PipelineStage = {
  id: StageId;
  status: StageStatus;
  detail: LocalizedText;
  durationMs?: number;
};

type RunTimelineItem = {
  id: string;
  index: number;
  title: string;
  description: string;
  status: StageStatus;
  detail: LocalizedText;
  durationMs?: number;
  tokenCount?: number;
  returnedModel?: string;
  probe?: Probe;
  result?: ProbeResult;
};

type ModelCheck = {
  returnedModel?: string;
  message: LocalizedText;
};

type ProviderPreset = {
  id: string;
  name: LocalizedText;
  domain: string;
  mark?: string;
  baseUrl: string;
  endpointMode: EndpointMode;
  customPath?: string;
  models: string[];
};

type CompareModelOption = {
  key: string;
  model: string;
  vendorId: string;
  vendorName: string;
  region: ModelRegion;
  source: 'catalog' | 'runtime';
};

const defaultConfig: RelayConfig = {
  baseUrl: '',
  apiKey: '',
  model: '',
  compareModel: '',
  endpointMode: 'openai',
  customPath: '/v1/chat/completions',
};

const copy = {
  zh: {
    title: '模型测试方法论台',
    subtitle: 'LLM鉴定、保真与稳定性探针',
    language: '语言',
    theme: '主题',
    light: '白天',
    dark: '黑夜',
    shareImage: '生成结果图',
    reset: '重置',
    providerTemplates: '服务商和模型模板',
    baseUrl: 'Base URL',
    endpointPath: '接口路径',
    proxyMode: '本地代理已启用，避免浏览器 CORS 拦截',
    endpointModes: {
      openai: 'OpenAI',
      anthropic: 'Anthropic',
      gemini: 'Gemini',
      full: '完整地址',
      custom: '自定义',
    },
    waitingBaseUrl: '填写 Base URL',
    apiKey: 'API Key',
    showApiKey: '显示 API Key',
    hideApiKey: '隐藏 API Key',
    commonModel: '常见 model',
    fetchedModel: '获取的 model',
    fetchModels: '获取所有 model',
    fetchingModels: '正在获取 model',
    fetchedModels: '已获取 model',
    noFetchedModels: '还没有获取到 model',
    modelsFetchHint: '填写 Base URL 和 API Key 后获取可用模型列表。',
    providerModel: '服务商模型',
    requestModel: '请求模型',
    requestModelPlaceholder: '选择请求模型',
    requestModelSearch: '搜索请求模型',
    requestModelPicker: '打开请求模型列表',
    compareModel: '对比模型',
    compareModelPlaceholder: '用于比对 response.model',
    compareModelSearch: '搜索模型或厂商',
    compareModelCatalog: '本地模型目录',
    runtimeModels: '当前环境',
    modelSearchEmpty: '没有匹配的模型',
    compareModelPicker: '打开对比模型列表',
    actualModel: '实际 model',
    actualModelPlaceholder: '中转站实际请求模型名',
    optional: '可选',
    run: '运行检测',
    running: '检测中',
    flowTitle: '测试流程',
    flowDescription: '先验收硬特征，再做模型归属核对，最后测稳定性漂移。',
    activeModelLogo: '当前测试模型',
    finalScoreTitle: '最终检测分数',
    finalScoreDescription: '4 个检测模块完成后生成',
    processTitle: '方法原则',
    resultTraceTitle: '运行过程',
    processDescription: '优先使用不可轻易伪造的硬信号，再补充能力题和稳定性重复测。',
    resultTraceDescription: '点击运行后，这里按顺序显示连通、模型核对、自动题和人工复核状态。',
    playbookTitle: '当前方法卡',
    playbookAppliesTo: '适用范围',
    playbookSummary: '为什么这样测',
    playbookCaution: '使用边界',
    playbookManual: '人工检查',
    playbookSources: '出处',
    playbookAuto: '自动题',
    noAutoProbes: '当前方法卡没有来源支持的自动题，只保留连通性、response.model 和人工检查。',
    score: '鉴别分',
    realtimeScore: '实时计算',
    waitingDetection: '待执行',
    passed: '通过项',
    warnings: '观察项',
    risks: '风险项',
    progress: '进度',
    tokenUsage: 'Token',
    elapsedTime: '耗时',
    results: '运行记录',
    showResults: '查看过程',
    hideResults: '查看方法',
    manualReviewTitle: '人工复核',
    manualReviewDescription: '当前方法卡的人工检查项',
    manualReviewQueued: '连通性与模型核对完成后，对照人工检查项复核。',
    manualReviewReady: '自动题不足，已完成可自动校验部分；请按人工检查项复核。',
    prompt: 'Prompt',
    raw: '原始返回 / 错误',
    notRun: '尚未运行',
    status: {
      pass: '通过',
      warn: '观察',
      fail: '风险',
      running: '运行中',
      idle: '待执行',
    },
    switchLanguage: '切换到 English',
    switchTheme: '切换昼夜模式',
    errorOverlayTitle: '检测失败',
    errorOverlayDescription: '请检查 Base URL、API Key、模型名和接口路径后再次运行。',
    errors: {
      baseUrlMissing: 'Base URL 缺失。',
      apiKeyMissing: 'API Key 缺失。',
      modelMissing: 'model 缺失。',
      compareModelMissing: '对比模型缺失。',
      baseUrlInvalid: 'Base URL 格式无效。',
      jsonParse: 'JSON 配置解析失败。',
    },
  },
  en: {
    title: 'Model Testing Playbook',
    subtitle: 'LLM identity, fidelity, and stability probes',
    language: 'Language',
    theme: 'Theme',
    light: 'Light',
    dark: 'Dark',
    shareImage: 'Generate result image',
    reset: 'Reset',
    providerTemplates: 'Provider and model templates',
    baseUrl: 'Base URL',
    endpointPath: 'Endpoint path',
    proxyMode: 'Local proxy enabled to avoid browser CORS blocks',
    endpointModes: {
      openai: 'OpenAI',
      anthropic: 'Anthropic',
      gemini: 'Gemini',
      full: 'Full URL',
      custom: 'Custom',
    },
    waitingBaseUrl: 'Enter Base URL',
    apiKey: 'API Key',
    showApiKey: 'Show API Key',
    hideApiKey: 'Hide API Key',
    commonModel: 'Common model',
    fetchedModel: 'Fetched model',
    fetchModels: 'Fetch all models',
    fetchingModels: 'Fetching models',
    fetchedModels: 'Fetched models',
    noFetchedModels: 'No models fetched yet',
    modelsFetchHint: 'Enter Base URL and API Key, then fetch the available model list.',
    providerModel: 'Provider model',
    requestModel: 'Request model',
    requestModelPlaceholder: 'Choose request model',
    requestModelSearch: 'Search request model',
    requestModelPicker: 'Open request model list',
    compareModel: 'Compare model',
    compareModelPlaceholder: 'Expected response.model value',
    compareModelSearch: 'Search model or vendor',
    compareModelCatalog: 'Local model catalog',
    runtimeModels: 'Current runtime',
    modelSearchEmpty: 'No matching models',
    compareModelPicker: 'Open compare model list',
    actualModel: 'Actual model',
    actualModelPlaceholder: 'Model name sent to the relay',
    optional: 'Optional',
    run: 'Run check',
    running: 'Checking',
    flowTitle: 'Test Flow',
    flowDescription: 'Verify hard signals first, then model identity, then stability drift.',
    activeModelLogo: 'Active test model',
    finalScoreTitle: 'Final detection score',
    finalScoreDescription: 'Generated after the 4 check modules complete',
    processTitle: 'Method Rules',
    resultTraceTitle: 'Run Process',
    processDescription:
      'Prefer hard-to-forge evidence, then add capability probes and repeated stability checks.',
    resultTraceDescription:
      'After you run a check, this shows connectivity, model match, automated probes, and manual review in order.',
    playbookTitle: 'Active playbook',
    playbookAppliesTo: 'Applies to',
    playbookSummary: 'Why this method',
    playbookCaution: 'Boundary',
    playbookManual: 'Manual checks',
    playbookSources: 'Sources',
    playbookAuto: 'Automated probes',
    noAutoProbes:
      'This playbook has no source-backed automated probes. Keep connectivity, response.model, and manual checks only.',
    score: 'Detection score',
    realtimeScore: 'Live calculation',
    waitingDetection: 'Queued',
    passed: 'Passed',
    warnings: 'Warnings',
    risks: 'Risks',
    progress: 'Progress',
    tokenUsage: 'Tokens',
    elapsedTime: 'Time',
    results: 'Run log',
    showResults: 'Show process',
    hideResults: 'Show method',
    manualReviewTitle: 'Manual review',
    manualReviewDescription: 'Manual checks in the active playbook',
    manualReviewQueued: 'After connectivity and model check finish, review the manual checklist.',
    manualReviewReady:
      'Automated evidence is limited; the automatic checks are complete. Review the manual checklist next.',
    prompt: 'Prompt',
    raw: 'Raw response / error',
    notRun: 'Not run yet',
    status: {
      pass: 'Pass',
      warn: 'Watch',
      fail: 'Risk',
      running: 'Running',
      idle: 'Queued',
    },
    switchLanguage: 'Switch to Chinese',
    switchTheme: 'Toggle theme',
    errorOverlayTitle: 'Check failed',
    errorOverlayDescription:
      'Check the Base URL, API Key, model name, and endpoint path, then run again.',
    errors: {
      baseUrlMissing: 'Base URL is required.',
      apiKeyMissing: 'API Key is required.',
      modelMissing: 'model is required.',
      compareModelMissing: 'Compare model is required.',
      baseUrlInvalid: 'Base URL is invalid.',
      jsonParse: 'Failed to parse JSON config.',
    },
  },
} as const;

const stageCopy: Record<
  Language,
  Record<StageId, { name: string; description: string; idleDetail: string }>
> = {
  zh: {
    validation: {
      name: '配置校验',
      description: '检查地址、密钥和模型名',
      idleDetail: '待执行',
    },
    connectivity: {
      name: '连通性',
      description: '请求 /chat/completions',
      idleDetail: '待执行',
    },
    'model-match': {
      name: '模型核对',
      description: '比对 response.model',
      idleDetail: '待执行',
    },
    probes: {
      name: '方法卡题库',
      description: '按当前模型执行专属题目',
      idleDetail: '待执行',
    },
  },
  en: {
    validation: {
      name: 'Config check',
      description: 'Check URL, key, and model names',
      idleDetail: 'Queued',
    },
    connectivity: {
      name: 'Connectivity',
      description: 'Request /chat/completions',
      idleDetail: 'Queued',
    },
    'model-match': {
      name: 'Model check',
      description: 'Compare response.model',
      idleDetail: 'Queued',
    },
    probes: {
      name: 'Playbook probes',
      description: 'Run the model-specific prompts for this playbook',
      idleDetail: 'Queued',
    },
  },
};

const localText = (zh: string, en: string): LocalizedText => ({ zh, en });

const regionLabels: Record<ModelRegion, LocalizedText> = {
  global: localText('国际主流厂商', 'Global vendors'),
  china: localText('国产主流厂商', 'Chinese vendors'),
};

const STAGE_FADE_MS = 420;
const STAGE_STABLE_MS = 800;
const LOGO_FADE_MS = 420;
const NEXT_PAINT_MS = 32;
const DETECTION_STAGE_COUNT = 4;

function normalizeSearchValue(value: string) {
  return value.toLowerCase().replace(/[\s\-._/]+/g, '');
}

function uniqueNonEmpty(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

const providerPresets: ProviderPreset[] = [
  {
    id: 'openai',
    name: localText('OpenAI', 'OpenAI'),
    domain: 'openai.com',
    mark: 'AI',
    baseUrl: 'https://api.openai.com/v1',
    endpointMode: 'openai',
    models: ['gpt-5.5', 'gpt-5.2', 'gpt-5.1', 'gpt-5', 'codex', 'gpt-4o', 'o3-mini'],
  },
  {
    id: 'claude',
    name: localText('Claude', 'Claude'),
    domain: 'anthropic.com',
    mark: 'CL',
    baseUrl: 'https://api.anthropic.com',
    endpointMode: 'anthropic',
    models: [
      'claude-opus-4.6',
      'claude-opus-4.5',
      'claude-sonnet-4.5',
      'claude-3.5-sonnet',
      'claude-3-opus',
    ],
  },
  {
    id: 'gemini',
    name: localText('Gemini', 'Gemini'),
    domain: 'gemini.google.com',
    mark: 'GM',
    baseUrl: 'https://generativelanguage.googleapis.com',
    endpointMode: 'gemini',
    models: ['gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-1.5-pro', 'gemini-1.5-flash'],
  },
  {
    id: 'glm',
    name: localText('GLM', 'GLM'),
    domain: 'zhipuai.cn',
    mark: 'GLM',
    baseUrl: 'https://open.bigmodel.cn/api/paas',
    endpointMode: 'custom',
    customPath: '/v4/chat/completions',
    models: ['glm-5.1', 'glm-4.5v', 'glm-4.6', 'chatglm3-6b'],
  },
  {
    id: 'custom',
    name: localText('自定义', 'Custom'),
    domain: 'example.com',
    mark: 'CU',
    baseUrl: '',
    endpointMode: 'custom',
    customPath: '/v1/chat/completions',
    models: [],
  },
];

const glmLogoProvider: ProviderPreset = {
  id: 'glm',
  name: localText('GLM', 'GLM'),
  domain: 'zhipuai.cn',
  mark: 'GLM',
  baseUrl: '',
  endpointMode: 'custom',
  models: [],
};

function resolveRunLogoProvider(modelName: string, fallback: ProviderPreset) {
  const normalized = normalizeSearchValue(modelName);
  const providerById = (id: string) =>
    providerPresets.find((provider) => provider.id === id) ?? fallback;

  if (normalized.includes('claude') || normalized.includes('anthropic'))
    return providerById('claude');
  if (normalized.includes('glm') || normalized.includes('chatglm') || normalized.includes('zhipu'))
    return providerById('glm') ?? glmLogoProvider;
  if (
    normalized.includes('gpt') ||
    normalized.includes('openai') ||
    normalized.includes('codex') ||
    /^o\d/.test(normalized)
  )
    return providerById('openai');
  if (
    normalized.includes('gemini') ||
    normalized.includes('gemma') ||
    normalized.includes('google')
  )
    return providerById('gemini');

  return fallback;
}

function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function initialStages(language: Language): PipelineStage[] {
  return (['validation', 'connectivity', 'model-match', 'probes'] as StageId[]).map((id) => ({
    id,
    status: 'idle',
    detail: {
      zh: stageCopy.zh[id].idleDetail,
      en: stageCopy.en[id].idleDetail,
    },
  }));
}

const systemPrompt = '你正在接受模型测试方法论验证。必须严格遵循用户要求，不要添加无关解释。';

function joinUrlPath(baseUrl: string, path: string) {
  const base = baseUrl.trim().replace(/\/+$/, '');
  const suffix = path.trim().replace(/^\/+/, '');
  return `${base}/${suffix}`;
}

function buildEndpoint(config: RelayConfig) {
  const baseUrl = config.baseUrl.trim();
  if (config.endpointMode === 'full') return baseUrl;
  if (config.endpointMode === 'custom')
    return joinUrlPath(baseUrl, config.customPath || '/chat/completions');
  if (config.endpointMode === 'anthropic') return joinUrlPath(baseUrl, '/v1/messages');
  if (config.endpointMode === 'gemini')
    return joinUrlPath(baseUrl, `/v1beta/models/${config.model.trim()}:generateContent`);
  return /\/v1\/?$/i.test(baseUrl)
    ? joinUrlPath(baseUrl, '/chat/completions')
    : joinUrlPath(baseUrl, '/v1/chat/completions');
}

function buildModelsEndpoint(config: RelayConfig) {
  const baseUrl = config.baseUrl.trim();
  if (config.endpointMode === 'full') {
    return baseUrl
      .replace(/\/+$/, '')
      .replace(/(?:\/v\d+)?\/chat\/completions$/i, (match) =>
        match.replace(/chat\/completions$/i, 'models'),
      );
  }
  if (config.endpointMode === 'custom') return joinUrlPath(baseUrl, '/models');
  if (config.endpointMode === 'anthropic') return joinUrlPath(baseUrl, '/v1/models');
  if (config.endpointMode === 'gemini') return joinUrlPath(baseUrl, '/v1beta/models');
  return /\/v1\/?$/i.test(baseUrl)
    ? joinUrlPath(baseUrl, '/models')
    : joinUrlPath(baseUrl, '/v1/models');
}

function statusScore(status: ProbeResult['status'], weight: number) {
  if (status === 'pass') return weight;
  if (status === 'warn') return weight * 0.5;
  return 0;
}

function numericValue(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function scoreLabel(
  score: number,
  probeCount: number,
): {
  text: LocalizedText;
  tone: string;
  icon: ComponentType<{ size?: number; className?: string }>;
} {
  if (probeCount === 0)
    return {
      text: localText('证据不足', 'Insufficient evidence'),
      tone: 'text-slate-600',
      icon: Search,
    };
  if (score >= 86)
    return {
      text: localText('特征吻合', 'Signature matched'),
      tone: 'text-emerald-600',
      icon: ShieldCheck,
    };
  if (score >= 68)
    return {
      text: localText('部分吻合', 'Partially matched'),
      tone: 'text-amber-600',
      icon: AlertTriangle,
    };
  if (score >= 45)
    return {
      text: localText('特征混杂', 'Mixed signals'),
      tone: 'text-orange-600',
      icon: ShieldAlert,
    };
  return {
    text: localText('明显不符', 'Clearly mismatched'),
    tone: 'text-rose-600',
    icon: XCircle,
  };
}

function extractOpenAiContent(payload: unknown) {
  if (!payload || typeof payload !== 'object') {
    throw new Error('中转站返回非 OpenAI-compatible 响应：响应不是对象。');
  }

  const data = payload as {
    model?: unknown;
    error?: { message?: unknown; type?: unknown; code?: unknown };
    choices?: Array<{ message?: { content?: unknown }; text?: unknown }>;
    usage?: { total_tokens?: unknown; totalTokens?: unknown };
  };

  if (data.error) {
    const message = [data.error.message, data.error.type, data.error.code]
      .filter(Boolean)
      .join(' / ');
    throw new Error(message || '中转站返回错误。');
  }

  const content = data.choices?.[0]?.message?.content ?? data.choices?.[0]?.text;
  if (typeof content !== 'string') {
    throw new Error('中转站返回非 OpenAI-compatible 响应：缺少 choices[0].message.content。');
  }

  return {
    content,
    returnedModel: typeof data.model === 'string' ? data.model : undefined,
    tokenCount: numericValue(data.usage?.total_tokens) ?? numericValue(data.usage?.totalTokens),
  };
}

function extractAnthropicContent(payload: unknown, requestedModel: string) {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Anthropic 响应不是对象。');
  }

  const data = payload as {
    model?: unknown;
    error?: { message?: unknown; type?: unknown };
    content?: Array<{ type?: unknown; text?: unknown }>;
    usage?: { input_tokens?: unknown; output_tokens?: unknown };
  };

  if (data.error) {
    const message = [data.error.message, data.error.type].filter(Boolean).join(' / ');
    throw new Error(message || 'Anthropic 返回错误。');
  }

  const content = data.content
    ?.map((item) => (typeof item.text === 'string' ? item.text : ''))
    .join('');
  if (!content) {
    throw new Error('Anthropic 响应缺少 content 文本。');
  }

  return {
    content,
    returnedModel: typeof data.model === 'string' ? data.model : requestedModel,
    tokenCount:
      (numericValue(data.usage?.input_tokens) ?? 0) +
        (numericValue(data.usage?.output_tokens) ?? 0) || undefined,
  };
}

function extractGeminiContent(payload: unknown, requestedModel: string) {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Gemini 响应不是对象。');
  }

  const data = payload as {
    error?: { message?: unknown; status?: unknown; code?: unknown };
    candidates?: Array<{ content?: { parts?: Array<{ text?: unknown }> } }>;
    usageMetadata?: { totalTokenCount?: unknown };
  };

  if (data.error) {
    const message = [data.error.message, data.error.status, data.error.code]
      .filter(Boolean)
      .join(' / ');
    throw new Error(message || 'Gemini 返回错误。');
  }

  const content = data.candidates?.[0]?.content?.parts
    ?.map((part) => (typeof part.text === 'string' ? part.text : ''))
    .join('');
  if (!content) {
    throw new Error('Gemini 响应缺少 candidates[0].content.parts 文本。');
  }

  return {
    content,
    returnedModel: requestedModel,
    tokenCount: numericValue(data.usageMetadata?.totalTokenCount),
  };
}

function buildChatRequest(config: RelayConfig, prompt: string, maxTokens: number) {
  if (config.endpointMode === 'anthropic') {
    return {
      payload: {
        model: config.model.trim(),
        max_tokens: maxTokens,
        temperature: 0,
        system: systemPrompt,
        messages: [{ role: 'user', content: prompt }],
      },
      headers: {
        'x-api-key': config.apiKey.trim(),
        'anthropic-version': '2023-06-01',
      },
    };
  }

  if (config.endpointMode === 'gemini') {
    return {
      payload: {
        generationConfig: {
          temperature: 0,
          maxOutputTokens: maxTokens,
        },
        systemInstruction: {
          parts: [{ text: systemPrompt }],
        },
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      },
      headers: {
        'x-goog-api-key': config.apiKey.trim(),
      },
    };
  }

  return {
    payload: {
      model: config.model.trim(),
      temperature: 0,
      max_tokens: maxTokens,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
    },
    headers: undefined,
  };
}

function extractChatContent(config: RelayConfig, payload: unknown) {
  if (config.endpointMode === 'anthropic')
    return extractAnthropicContent(payload, config.model.trim());
  if (config.endpointMode === 'gemini') return extractGeminiContent(payload, config.model.trim());
  return extractOpenAiContent(payload);
}

function requestErrorMessage(error: unknown): LocalizedText {
  if (error instanceof TypeError) {
    return localText(
      '请求失败，可能是网络错误、CORS 被拦截，或中转站未允许浏览器跨域调用。',
      'Request failed. This may be a network error, a CORS block, or a relay that does not allow browser calls.',
    );
  }
  if (error instanceof Error) {
    if (/403|forbidden|access_denied/i.test(error.message)) {
      return localText(
        `鉴权或访问权限被拒绝：${error.message}。请检查 API Key、模型权限、计费状态、请求路径和中转站路由规则。`,
        `Access was denied: ${error.message}. Check the API key, model permissions, billing status, request path, and relay routing rules.`,
      );
    }
    if (/401|unauthorized|invalid_api_key/i.test(error.message)) {
      return localText(
        `鉴权失败：${error.message}。请检查 API Key 是否正确。`,
        `Authentication failed: ${error.message}. Check whether the API key is correct.`,
      );
    }
    if (/404|model_not_found|not found/i.test(error.message)) {
      return localText(
        `模型或路径不存在：${error.message}。请检查 model 名称和接口路径模式。`,
        `Model or path not found: ${error.message}. Check the model name and endpoint path mode.`,
      );
    }
    return localText(error.message, error.message);
  }
  return localText('请求失败，未知错误。', 'Request failed with an unknown error.');
}

async function requestChat(
  config: RelayConfig,
  prompt: string,
  maxTokens = 120,
): Promise<ChatResult> {
  const chatRequest = buildChatRequest(config, prompt, maxTokens);

  const response = await fetch('/api/relay-proxy', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      endpoint: buildEndpoint(config),
      apiKey: config.apiKey.trim(),
      payload: chatRequest.payload,
      headers: chatRequest.headers,
    }),
  });

  const raw = await response.text();
  let responsePayload: unknown;
  try {
    responsePayload = raw ? JSON.parse(raw) : {};
  } catch {
    throw new Error(`中转站返回非 JSON 响应，HTTP ${response.status}。`);
  }

  if (!response.ok) {
    const errorPayload = responsePayload as {
      error?: { message?: string; type?: string; code?: string };
    };
    const message = [
      errorPayload.error?.message,
      errorPayload.error?.type,
      errorPayload.error?.code,
    ]
      .filter(Boolean)
      .join(' / ');
    throw new Error(`HTTP ${response.status}${message ? ` / ${message}` : ''}`);
  }

  return extractChatContent(config, responsePayload);
}

function extractModelIds(payload: unknown) {
  if (!payload || typeof payload !== 'object') {
    throw new Error('模型列表响应不是对象。');
  }

  const data = payload as {
    data?: Array<{ id?: unknown; name?: unknown }>;
    models?: Array<string | { id?: unknown; name?: unknown }>;
    error?: { message?: unknown; type?: unknown; code?: unknown };
  };

  if (data.error) {
    const message = [data.error.message, data.error.type, data.error.code]
      .filter(Boolean)
      .join(' / ');
    throw new Error(message || '模型列表接口返回错误。');
  }

  const rawModels = Array.isArray(data.data)
    ? data.data
    : Array.isArray(data.models)
      ? data.models
      : [];
  const modelIds = rawModels
    .map((model) => {
      if (typeof model === 'string') return model;
      if (model && typeof model === 'object') {
        return typeof model.id === 'string'
          ? model.id
          : typeof model.name === 'string'
            ? model.name
            : '';
      }
      return '';
    })
    .map((model) => model.replace(/^models\//, ''))
    .filter(Boolean);

  return Array.from(new Set(modelIds)).sort((a, b) => a.localeCompare(b));
}

async function requestModelList(config: RelayConfig) {
  const response = await fetch('/api/models-proxy', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      endpoint: buildModelsEndpoint(config),
      apiKey: config.apiKey.trim(),
      headers:
        config.endpointMode === 'anthropic'
          ? {
              'x-api-key': config.apiKey.trim(),
              'anthropic-version': '2023-06-01',
            }
          : config.endpointMode === 'gemini'
            ? {
                'x-goog-api-key': config.apiKey.trim(),
              }
            : undefined,
    }),
  });

  const raw = await response.text();
  let responsePayload: unknown;
  try {
    responsePayload = raw ? JSON.parse(raw) : {};
  } catch {
    throw new Error(`模型列表接口返回非 JSON 响应，HTTP ${response.status}。`);
  }

  if (!response.ok) {
    const errorPayload = responsePayload as {
      error?: { message?: string; type?: string; code?: string };
    };
    const message = [
      errorPayload.error?.message,
      errorPayload.error?.type,
      errorPayload.error?.code,
    ]
      .filter(Boolean)
      .join(' / ');
    throw new Error(`HTTP ${response.status}${message ? ` / ${message}` : ''}`);
  }

  return extractModelIds(responsePayload);
}

function GlassPanel({ className = '', children }: { className?: string; children: ReactNode }) {
  return (
    <section
      className={`rounded-lg border border-[#d7dee7] bg-white shadow-[0_18px_45px_rgba(17,24,39,0.07)] ${className}`}
    >
      {children}
    </section>
  );
}

function FieldIcon({ children }: { children: ReactNode }) {
  return (
    <div className='grid h-8 w-8 shrink-0 place-items-center rounded-md border border-[#d7dee7] bg-[#f3f6f9] text-[#526070]'>
      {children}
    </div>
  );
}

function providerLogoUrl(domain: string) {
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`;
}

function ProviderLogo({
  provider,
  className = '',
  ...props
}: {
  provider: ProviderPreset;
  className?: string;
} & ImgHTMLAttributes<HTMLImageElement>) {
  const [failed, setFailed] = useState(false);

  if (provider.id === 'custom') {
    return (
      <span
        className={`grid place-items-center rounded-full border ${className}`}
        aria-hidden='true'
      >
        <Server size={13} />
      </span>
    );
  }

  if (failed) {
    return (
      <span
        className={`grid place-items-center rounded-full border text-[10px] font-bold ${className}`}
        aria-hidden='true'
      >
        {provider.mark ?? provider.name.en.slice(0, 2).toUpperCase()}
      </span>
    );
  }

  return (
    <img
      {...props}
      className={`rounded-full object-contain ${className}`}
      src={providerLogoUrl(provider.domain)}
      alt={`${provider.name.en} logo`}
      onError={() => setFailed(true)}
    />
  );
}

function StatusPill({ status, language }: { status: ProbeResult['status']; language: Language }) {
  const styles = {
    pass: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    warn: 'border-amber-200 bg-amber-50 text-amber-700',
    fail: 'border-rose-200 bg-rose-50 text-rose-700',
  };
  const Icon = status === 'pass' ? CheckCircle2 : AlertTriangle;

  return (
    <span
      className={`inline-flex h-6 items-center gap-1 rounded-md border px-2 text-[11px] font-medium ${styles[status]}`}
    >
      <Icon size={13} />
      {copy[language].status[status]}
    </span>
  );
}

function StageBadge({ status, language }: { status: StageStatus; language: Language }) {
  if (status === 'running') {
    return (
      <span className='inline-flex h-6 items-center gap-1 whitespace-nowrap rounded-md border border-sky-200 bg-sky-50 px-2 text-[11px] font-medium text-sky-700'>
        <Loader2 className='animate-spin' size={13} />
        {copy[language].status.running}
      </span>
    );
  }

  if (status === 'idle') {
    return (
      <span className='inline-flex h-6 items-center gap-1 whitespace-nowrap rounded-md border border-[#dbe2ea] bg-[#f6f8fa] px-2 text-[11px] font-medium text-[#6d7785]'>
        <span className='h-2 w-2 rounded-full bg-[#9aa5b4]' />
        {copy[language].status.idle}
      </span>
    );
  }

  return <StatusPill status={status} language={language} />;
}

function StageIcon({ status }: { status: StageStatus }) {
  if (status === 'running') return <Loader2 className='animate-spin text-sky-600' size={18} />;
  if (status === 'pass') return <CheckCircle2 className='text-emerald-600' size={18} />;
  if (status === 'warn') return <AlertTriangle className='text-amber-600' size={18} />;
  if (status === 'fail') return <AlertTriangle className='text-rose-600' size={18} />;
  return <span className='h-3 w-3 rounded-full bg-[#9aa5b4]' />;
}

type TestLogItem = {
  id: string;
  time: string;
  title: string;
  detail: string;
  status: StageStatus;
};

const TRANSITION_MS = 800;
const INTERNAL_STEP_MS = 900;
const PROGRESS_FRAME_MS = 24;
const PROGRESS_ANIMATION_MS = 900;
const progressDefaults = [96, 86, 72, 88];

function clampProgress(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function nowTime(language: Language) {
  return new Date().toLocaleTimeString(language === 'zh' ? 'zh-CN' : 'en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function formatDuration(ms: number) {
  if (!ms) return '--';
  if (ms < 1000) return `${ms} ms`;
  return `${(ms / 1000).toFixed(1)} s`;
}

function stageProgressTarget(status: StageStatus, fallback: number) {
  if (status === 'pass') return fallback;
  if (status === 'warn') return Math.max(48, Math.round(fallback * 0.68));
  if (status === 'fail') return 28;
  if (status === 'running') return Math.max(35, Math.round(fallback * 0.42));
  return 0;
}

function ProgressRing({ value, status }: { value: number; status: StageStatus }) {
  const radius = 43;
  const circumference = Math.PI * 2 * radius;
  const progress = clampProgress(value);
  const offset = circumference * (1 - progress / 100);
  const tone =
    status === 'fail'
      ? '#f43f5e'
      : status === 'warn'
        ? '#f59e0b'
        : status === 'running'
          ? '#2563eb'
          : '#14b8a6';

  return (
    <div className='progress-ring-shell' style={{ '--ring-color': tone } as CSSProperties}>
      <svg className='progress-ring-svg' viewBox='0 0 112 112' aria-hidden='true'>
        <circle className='progress-ring-track' cx='56' cy='56' r={radius} />
        <circle
          className='progress-ring-path'
          cx='56'
          cy='56'
          r={radius}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className='progress-ring-number'>{progress}%</div>
    </div>
  );
}

export default function DemoOne() {
  const [language, setLanguage] = useState<Language>('zh');
  const [config, setConfig] = useState<RelayConfig>(defaultConfig);
  const [selectedProviderId, setSelectedProviderId] = useState(providerPresets[0].id);
  const [showApiKey, setShowApiKey] = useState(false);
  const [results, setResults] = useState<ProbeResult[]>([]);
  const [runningId, setRunningId] = useState<string | null>(null);
  const [stages, setStages] = useState<PipelineStage[]>(() => initialStages('zh'));
  const [modelCheck, setModelCheck] = useState<ModelCheck>({
    message: localText('尚未核对', 'Not checked yet'),
  });
  const [configError, setConfigError] = useState('');
  const [fetchedModels, setFetchedModels] = useState<string[]>([]);
  const [modelsStatus, setModelsStatus] = useState<ModelFetchStatus>('idle');
  const [modelsMessage, setModelsMessage] = useState<LocalizedText>(localText('', ''));
  const [runError, setRunError] = useState<LocalizedText | null>(null);
  const [resultsOpen, setResultsOpen] = useState(false);
  const [scoreOpen, setScoreOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [mountedStep, setMountedStep] = useState(0);
  const [activeRunLogoProvider, setActiveRunLogoProvider] = useState<ProviderPreset | null>(null);
  const [activeRunModelName, setActiveRunModelName] = useState('');
  const [logoVisible, setLogoVisible] = useState(false);
  const [finalScoreMounted, setFinalScoreMounted] = useState(false);
  const [finalScoreVisible, setFinalScoreVisible] = useState(false);
  const [hasEntered, setHasEntered] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [ringProgress, setRingProgress] = useState<number[]>(() =>
    Array(DETECTION_STAGE_COUNT).fill(0),
  );
  const [bottomModulesVisible, setBottomModulesVisible] = useState(false);
  const [testLogs, setTestLogs] = useState<TestLogItem[]>([]);
  const [resultOutput, setResultOutput] = useState('等待开始测试。');
  const [requestModelSearch, setRequestModelSearch] = useState('');
  const [requestModelOpen, setRequestModelOpen] = useState(false);
  const [compareModelSearch, setCompareModelSearch] = useState('');
  const [compareModelOpen, setCompareModelOpen] = useState(false);
  const requestModelPanelRef = useRef<HTMLDivElement>(null);
  const requestModelSearchRef = useRef<HTMLInputElement>(null);
  const compareModelPanelRef = useRef<HTMLDivElement>(null);
  const compareModelSearchRef = useRef<HTMLInputElement>(null);
  const mainPanelRef = useRef<HTMLElement>(null);
  const ringProgressRef = useRef<number[]>(Array(DETECTION_STAGE_COUNT).fill(0));
  const t = copy[language];
  const dark = false;

  useEffect(() => {
    if (!requestModelOpen) {
      setRequestModelSearch('');
      return;
    }

    requestModelSearchRef.current?.focus();
  }, [requestModelOpen]);

  useEffect(() => {
    if (!requestModelOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!requestModelPanelRef.current?.contains(event.target as Node)) {
        setRequestModelOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setRequestModelOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [requestModelOpen]);

  useEffect(() => {
    if (!compareModelOpen) {
      setCompareModelSearch('');
      return;
    }

    compareModelSearchRef.current?.focus();
  }, [compareModelOpen]);

  useEffect(() => {
    if (!compareModelOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!compareModelPanelRef.current?.contains(event.target as Node)) {
        setCompareModelOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setCompareModelOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [compareModelOpen]);

  const modelUnderTest = config.compareModel.trim() || config.model.trim();
  const activePlaybook = useMemo<ModelPlaybook>(
    () => getPlaybookForModel(modelUnderTest),
    [modelUnderTest],
  );
  const probes = activePlaybook.probes;

  const scoreData = useMemo(() => {
    const rawScore = results.reduce(
      (sum, result) => sum + statusScore(result.status, result.weight),
      0,
    );
    const returnedModels = Array.from(
      new Set(
        [modelCheck.returnedModel, ...results.map((result) => result.returnedModel)].filter(
          Boolean,
        ),
      ),
    ) as string[];
    const score = Math.max(0, Math.round(rawScore));
    const pass = results.filter((result) => result.status === 'pass').length;
    const warn = results.filter((result) => result.status === 'warn').length;
    const fail = results.filter((result) => result.status === 'fail').length;
    const tokenCount = results.reduce((sum, result) => sum + (result.tokenCount ?? 0), 0);
    const durationMs =
      results.reduce((sum, result) => sum + result.durationMs, 0) +
      stages.reduce((sum, stage) => sum + (stage.durationMs ?? 0), 0);
    return {
      score,
      pass,
      warn,
      fail,
      tokenCount,
      durationMs,
      returnedModels,
      label: scoreLabel(score, probes.length),
    };
  }, [modelCheck, probes.length, results, stages]);

  const runTimeline = useMemo<RunTimelineItem[]>(() => {
    const stageItems = stages.map((stage, index) => {
      const meta = stageCopy[language][stage.id];
      return {
        id: `stage-${stage.id}`,
        index: index + 1,
        title: meta.name,
        description: meta.description,
        status: stage.status,
        detail: stage.detail,
        durationMs: stage.durationMs,
      };
    });

    if (probes.length > 0) {
      const probeItems = probes.map((probe, index) => {
        const result = results.find((item) => item.id === probe.id);
        const active = runningId === probe.id;
        const status: StageStatus = active ? 'running' : (result?.status ?? 'idle');
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
        };
      });

      return [...stageItems, ...probeItems];
    }

    const probeStage = stages.find((stage) => stage.id === 'probes');
    const connectivityFailed = stages.some(
      (stage) => stage.id === 'connectivity' && stage.status === 'fail',
    );
    const manualStatus: StageStatus = connectivityFailed ? 'idle' : (probeStage?.status ?? 'idle');
    const manualDetail =
      manualStatus === 'warn'
        ? localText(copy.zh.manualReviewReady, copy.en.manualReviewReady)
        : localText(copy.zh.manualReviewQueued, copy.en.manualReviewQueued);

    return [
      ...stageItems,
      {
        id: 'manual-review',
        index: stageItems.length + 1,
        title: t.manualReviewTitle,
        description: t.manualReviewDescription,
        status: manualStatus,
        detail: manualDetail,
      },
    ];
  }, [
    language,
    probes,
    results,
    runningId,
    stages,
    t.manualReviewDescription,
    t.manualReviewTitle,
  ]);

  const isRunning = runningId !== null;
  const selectedProvider =
    providerPresets.find((provider) => provider.id === selectedProviderId) ?? providerPresets[0];
  const canFetchModels = Boolean(config.baseUrl.trim() && config.apiKey.trim());
  const defaultModelOptions = useMemo(
    () => uniqueNonEmpty([...selectedProvider.models, config.model]),
    [config.model, selectedProvider.models],
  );
  const fetchedModelOptions = useMemo(
    () =>
      fetchedModels.length > 0
        ? uniqueNonEmpty([config.model, ...fetchedModels])
        : defaultModelOptions,
    [config.model, defaultModelOptions, fetchedModels],
  );
  const effectiveRequestModel = config.model.trim() || fetchedModelOptions[0] || '';
  const normalizedRequestModelSearch = normalizeSearchValue(requestModelSearch);
  const filteredRequestModelOptions = useMemo(
    () =>
      fetchedModelOptions.filter(
        (model) =>
          !normalizedRequestModelSearch ||
          normalizeSearchValue(model).includes(normalizedRequestModelSearch),
      ),
    [fetchedModelOptions, normalizedRequestModelSearch],
  );

  useEffect(() => {
    if (config.model.trim() || fetchedModelOptions.length === 0) return;

    setConfig((current) =>
      current.model.trim() ? current : { ...current, model: fetchedModelOptions[0] },
    );
  }, [config.model, fetchedModelOptions]);

  const compareModelCatalog = useMemo<CompareModelOption[]>(
    () =>
      MODEL_LIST.flatMap((group) =>
        group.models.map((model) => ({
          key: `${group.id}:${model}`,
          model,
          vendorId: group.id,
          vendorName: group.name,
          region: group.region,
          source: 'catalog' as const,
        })),
      ),
    [],
  );
  const runtimeCompareOptions = useMemo<CompareModelOption[]>(() => {
    const runtimeModels = Array.from(
      new Set(
        [...selectedProvider.models, ...fetchedModels, config.model, config.compareModel].filter(
          Boolean,
        ),
      ),
    );

    return runtimeModels.map((model) => {
      const matchedCatalog = compareModelCatalog.find((option) => option.model === model);
      if (matchedCatalog) return matchedCatalog;

      return {
        key: `runtime:${model}`,
        model,
        vendorId: selectedProvider.id,
        vendorName: selectedProvider.name.en,
        region:
          selectedProvider.id === 'custom'
            ? 'global'
            : selectedProvider.id === 'openai' ||
                selectedProvider.id === 'claude' ||
                selectedProvider.id === 'gemini'
              ? 'global'
              : 'china',
        source: 'runtime',
      };
    });
  }, [
    compareModelCatalog,
    config.compareModel,
    config.model,
    fetchedModels,
    selectedProvider.id,
    selectedProvider.models,
    selectedProvider.name.en,
  ]);
  const compareModelOptions = useMemo<CompareModelOption[]>(() => {
    const merged = new Map<string, CompareModelOption>();

    for (const option of compareModelCatalog) {
      merged.set(option.model, option);
    }
    for (const option of runtimeCompareOptions) {
      if (!merged.has(option.model)) {
        merged.set(option.model, option);
      }
    }

    return Array.from(merged.values());
  }, [compareModelCatalog, runtimeCompareOptions]);
  const normalizedCompareModelSearch = normalizeSearchValue(compareModelSearch);
  const filteredCompareModelOptions = useMemo(
    () =>
      compareModelOptions.filter((option) => {
        if (!normalizedCompareModelSearch) return true;

        return [option.model, option.vendorName, option.vendorId].some((value) =>
          normalizeSearchValue(value).includes(normalizedCompareModelSearch),
        );
      }),
    [compareModelOptions, normalizedCompareModelSearch],
  );
  const compareModelSections = useMemo(() => {
    const runtimeOnly = filteredCompareModelOptions.filter((option) => option.source === 'runtime');
    const catalogGroups = MODEL_LIST.map((group) => ({
      ...group,
      options: filteredCompareModelOptions.filter((option) => option.vendorId === group.id),
    })).filter((group) => group.options.length > 0);

    return { runtimeOnly, catalogGroups };
  }, [filteredCompareModelOptions]);
  const hasCompareModelResults =
    compareModelSections.runtimeOnly.length > 0 || compareModelSections.catalogGroups.length > 0;

  const updateConfig = <K extends keyof RelayConfig>(key: K, value: RelayConfig[K]) => {
    setConfig((current) => ({ ...current, [key]: value }));
    setConfigError('');
    if (key === 'baseUrl' || key === 'apiKey' || key === 'endpointMode' || key === 'customPath') {
      setModelsStatus('idle');
      setModelsMessage(localText('', ''));
      setFetchedModels([]);
    }
  };

  const applyProvider = (provider: ProviderPreset) => {
    setSelectedProviderId(provider.id);
    setConfig((current) => ({
      ...current,
      baseUrl: current.baseUrl.trim() ? current.baseUrl : provider.baseUrl,
      model: provider.models.includes(current.model)
        ? current.model
        : provider.models[0] || current.model || '',
      compareModel: provider.models.includes(current.compareModel)
        ? current.compareModel
        : current.compareModel || provider.models[0] || current.model || '',
      endpointMode: provider.endpointMode,
      customPath: provider.customPath ?? current.customPath,
    }));
    setConfigError('');
    setRunError(null);
  };

  const selectCompareModel = (model: string) => {
    updateConfig('compareModel', model);
    setCompareModelOpen(false);
  };

  const selectRequestModel = (model: string) => {
    setConfig((current) => ({
      ...current,
      model,
      compareModel: model,
    }));
    setConfigError('');
    setRequestModelOpen(false);
  };

  const getRunConfig = (): RelayConfig => ({
    ...config,
    model: effectiveRequestModel,
    compareModel: config.compareModel.trim(),
  });

  const validateConfig = (runConfig: RelayConfig) => {
    if (!runConfig.baseUrl.trim()) return t.errors.baseUrlMissing;
    if (!runConfig.apiKey.trim()) return t.errors.apiKeyMissing;
    if (!runConfig.model.trim()) return t.errors.modelMissing;
    if (!runConfig.compareModel.trim()) return t.errors.compareModelMissing;
    try {
      new URL(runConfig.baseUrl.trim());
    } catch {
      return t.errors.baseUrlInvalid;
    }
    return '';
  };

  const localizedValidationError = (validationMessage: string) => {
    if (validationMessage === t.errors.baseUrlMissing)
      return localText(copy.zh.errors.baseUrlMissing, copy.en.errors.baseUrlMissing);
    if (validationMessage === t.errors.apiKeyMissing)
      return localText(copy.zh.errors.apiKeyMissing, copy.en.errors.apiKeyMissing);
    if (validationMessage === t.errors.modelMissing)
      return localText(copy.zh.errors.modelMissing, copy.en.errors.modelMissing);
    if (validationMessage === t.errors.compareModelMissing)
      return localText(copy.zh.errors.compareModelMissing, copy.en.errors.compareModelMissing);
    if (validationMessage === t.errors.baseUrlInvalid)
      return localText(copy.zh.errors.baseUrlInvalid, copy.en.errors.baseUrlInvalid);
    return localText(validationMessage, validationMessage);
  };

  const generateShareImage = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 675;
    const context = canvas.getContext('2d');
    if (!context) return;

    const modelName = effectiveRequestModel || '--';
    const compareName = config.compareModel.trim() || '--';
    const label = results.length ? scoreData.label.text[language] : t.waitingDetection;
    const completedAt = new Date().toLocaleString(language === 'zh' ? 'zh-CN' : 'en-US');
    const summaryItems = [
      [t.passed, String(scoreData.pass), '#059669'],
      [t.warnings, String(scoreData.warn), '#d97706'],
      [t.risks, String(scoreData.fail), '#e11d48'],
      [
        t.tokenUsage,
        scoreData.tokenCount > 0 ? scoreData.tokenCount.toLocaleString() : '--',
        '#17202a',
      ],
      [
        t.elapsedTime,
        scoreData.durationMs > 0 ? `${(scoreData.durationMs / 1000).toFixed(1)}s` : '--',
        '#17202a',
      ],
    ] as const;

    const roundedRect = (x: number, y: number, width: number, height: number, radius: number) => {
      context.beginPath();
      context.moveTo(x + radius, y);
      context.arcTo(x + width, y, x + width, y + height, radius);
      context.arcTo(x + width, y + height, x, y + height, radius);
      context.arcTo(x, y + height, x, y, radius);
      context.arcTo(x, y, x + width, y, radius);
      context.closePath();
    };

    const drawText = (text: string, x: number, y: number, maxWidth: number) => {
      let value = text;
      while (context.measureText(value).width > maxWidth && value.length > 4) {
        value = `${value.slice(0, -4)}...`;
      }
      context.fillText(value, x, y);
    };

    context.fillStyle = '#e8eef3';
    context.fillRect(0, 0, canvas.width, canvas.height);

    const gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, 'rgba(14, 116, 144, 0.16)');
    gradient.addColorStop(0.55, 'rgba(255, 255, 255, 0.5)');
    gradient.addColorStop(1, 'rgba(16, 185, 129, 0.12)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);

    roundedRect(54, 48, 1092, 579, 22);
    context.fillStyle = '#ffffff';
    context.fill();
    context.strokeStyle = '#d7dee7';
    context.lineWidth = 2;
    context.stroke();

    context.fillStyle = '#17202a';
    context.font = '700 38px sans-serif';
    drawText(t.title, 92, 116, 720);
    context.fillStyle = '#667384';
    context.font = '500 18px sans-serif';
    drawText(`${modelName} -> ${compareName}`, 94, 154, 760);

    roundedRect(914, 78, 170, 92, 16);
    context.fillStyle = '#101820';
    context.fill();
    context.fillStyle = '#ffffff';
    context.font = '700 34px monospace';
    context.fillText(results.length ? String(scoreData.score) : '--', 938, 124);
    context.fillStyle = '#98a6b8';
    context.font = '500 15px sans-serif';
    drawText(label, 938, 151, 120);

    summaryItems.forEach(([name, value, color], index) => {
      const x = 92 + (index % 3) * 336;
      const y = 220 + Math.floor(index / 3) * 124;
      roundedRect(x, y, 300, 88, 14);
      context.fillStyle = '#fbfcfd';
      context.fill();
      context.strokeStyle = '#d7dee7';
      context.lineWidth = 1;
      context.stroke();
      context.fillStyle = '#667384';
      context.font = '600 16px sans-serif';
      context.fillText(name, x + 22, y + 31);
      context.fillStyle = color;
      context.font = '700 30px sans-serif';
      drawText(value, x + 22, y + 66, 246);
    });

    context.fillStyle = '#344253';
    context.font = '700 18px sans-serif';
    context.fillText(t.resultTraceTitle, 92, 498);
    context.font = '500 14px sans-serif';
    context.fillStyle = '#667384';
    probes.slice(0, 6).forEach((probe, index) => {
      const result = results.find((item) => item.id === probe.id);
      const x = 92 + (index % 3) * 336;
      const y = 532 + Math.floor(index / 3) * 42;
      context.fillStyle =
        result?.status === 'pass'
          ? '#059669'
          : result?.status === 'warn'
            ? '#d97706'
            : result?.status === 'fail'
              ? '#e11d48'
              : '#8b96a5';
      context.beginPath();
      context.arc(x + 8, y - 5, 5, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = '#344253';
      drawText(probe.name[language], x + 22, y, 240);
    });

    context.fillStyle = '#8b96a5';
    context.font = '500 13px monospace';
    context.fillText(completedAt, 92, 600);

    const link = document.createElement('a');
    link.download = `model-check-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const fetchModels = async () => {
    if (!config.baseUrl.trim()) {
      setConfigError(t.errors.baseUrlMissing);
      setRunError(localText(copy.zh.errors.baseUrlMissing, copy.en.errors.baseUrlMissing));
      return;
    }
    if (!config.apiKey.trim()) {
      setConfigError(t.errors.apiKeyMissing);
      setRunError(localText(copy.zh.errors.apiKeyMissing, copy.en.errors.apiKeyMissing));
      return;
    }
    try {
      new URL(config.baseUrl.trim());
    } catch {
      setConfigError(t.errors.baseUrlInvalid);
      setRunError(localText(copy.zh.errors.baseUrlInvalid, copy.en.errors.baseUrlInvalid));
      return;
    }

    setModelsStatus('loading');
    setModelsMessage(localText('正在请求 /models。', 'Requesting /models.'));
    setConfigError('');

    try {
      const models = await requestModelList(config);
      if (models.length === 0) {
        throw new Error(language === 'zh' ? '模型列表为空。' : 'The model list is empty.');
      }
      setFetchedModels(models);
      setModelsStatus('success');
      setModelsMessage(
        localText(`已获取 ${models.length} 个 model。`, `Fetched ${models.length} model(s).`),
      );
      setRunError(null);
      setConfig((current) => ({
        ...current,
        model: models.includes(current.model) ? current.model : models[0],
        compareModel: models.includes(current.compareModel)
          ? current.compareModel
          : current.compareModel || models[0],
      }));
    } catch (error) {
      const message = requestErrorMessage(error);
      setModelsStatus('error');
      setModelsMessage(message);
      setConfigError(message[language]);
      setRunError(message);
    }
  };

  const reset = () => {
    setConfig(defaultConfig);
    setSelectedProviderId(providerPresets[0].id);
    setShowApiKey(false);
    setResults([]);
    setRunningId(null);
    setScoreOpen(false);
    setCurrentStep(DETECTION_STAGE_COUNT);
    setMountedStep(DETECTION_STAGE_COUNT);
    setActiveRunLogoProvider(null);
    setActiveRunModelName('');
    setLogoVisible(false);
    setFinalScoreMounted(false);
    setFinalScoreVisible(false);
    setResultsOpen(false);
    setStages(initialStages(language));
    setModelCheck({ message: localText('尚未核对', 'Not checked yet') });
    setConfigError('');
    setFetchedModels([]);
    setModelsStatus('idle');
    setModelsMessage(localText('', ''));
    setRunError(null);
  };

  const updateStage = (id: StageId, patch: Partial<PipelineStage>) => {
    setStages((current) =>
      current.map((stage) => (stage.id === id ? { ...stage, ...patch } : stage)),
    );
  };

  const runProbe = async (probe: Probe, runConfig: RelayConfig): Promise<ProbeResult> => {
    const startedAt = performance.now();
    try {
      const { content, returnedModel, tokenCount } = await requestChat(runConfig, probe.prompt);
      const judged = probe.judge(content);
      return {
        id: probe.id,
        weight: probe.weight,
        durationMs: Math.round(performance.now() - startedAt),
        tokenCount,
        returnedModel,
        content,
        ...judged,
      };
    } catch (error) {
      return {
        id: probe.id,
        weight: probe.weight,
        status: 'fail',
        durationMs: Math.round(performance.now() - startedAt),
        error: requestErrorMessage(error),
        reason: localText(
          '探针请求未得到可判定的 OpenAI-compatible 响应。',
          'The probe did not receive a judgeable OpenAI-compatible response.',
        ),
      };
    }
  };

  const revealRunLogo = async (provider: ProviderPreset) => {
    setLogoVisible(false);
    setActiveRunLogoProvider(provider);
    await sleep(NEXT_PAINT_MS);
    setLogoVisible(true);
    await sleep(LOGO_FADE_MS);
  };

  const revealStageModule = async (step: number) => {
    setMountedStep(step);
    await sleep(NEXT_PAINT_MS);
    setCurrentStep(step);
    await sleep(STAGE_FADE_MS + STAGE_STABLE_MS);
  };

  const revealRemainingStageModules = async (startStep: number) => {
    for (let step = startStep; step <= DETECTION_STAGE_COUNT; step += 1) {
      await revealStageModule(step);
    }
  };

  const revealFinalScore = async () => {
    setFinalScoreMounted(true);
    await sleep(NEXT_PAINT_MS);
    setFinalScoreVisible(true);
  };

  const runAll = async () => {
    const runConfig = getRunConfig();
    const validationMessage = validateConfig(runConfig);
    if (validationMessage) {
      const validationError = localizedValidationError(validationMessage);
      setConfigError(validationMessage);
      setRunError(validationError);
      setRunningId(null);
      setResultsOpen(false);
      setScoreOpen(false);
      return;
    }

    setRunningId('preparing');
    setResults([]);
    setStages(initialStages(language));
    setModelCheck({ message: localText('尚未核对', 'Not checked yet') });
    setConfigError('');
    setRunError(null);
    setScoreOpen(false);
    setResultsOpen(true);
    setCurrentStep(0);
    setMountedStep(0);
    setFinalScoreMounted(false);
    setFinalScoreVisible(false);
    setActiveRunModelName(runConfig.model);

    await revealRunLogo(resolveRunLogoProvider(runConfig.model, selectedProvider));

    setRunningId('validation');
    updateStage('validation', {
      status: 'running',
      detail: localText(
        '正在检查 Base URL、API Key、请求模型和对比模型。',
        'Checking Base URL, API key, request model, and compare model.',
      ),
    });
    await revealStageModule(1);

    const runtimeValidationMessage = validateConfig(runConfig);
    if (runtimeValidationMessage) {
      setConfigError(runtimeValidationMessage);
      const bilingualValidation = localizedValidationError(runtimeValidationMessage);
      setRunError(bilingualValidation);
      updateStage('validation', {
        status: 'fail',
        detail: bilingualValidation,
      });
      updateStage('connectivity', {
        status: 'idle',
        detail: localText(
          '配置校验未通过，未发送请求。',
          'Config check failed, so no request was sent.',
        ),
      });
      updateStage('model-match', {
        status: 'idle',
        detail: localText(
          '配置校验未通过，未执行模型核对。',
          'Config check failed, so the model check was not run.',
        ),
      });
      updateStage('probes', {
        status: 'idle',
        detail: localText(
          '配置校验未通过，未运行能力探针。',
          'Config check failed, so capability probes were not run.',
        ),
      });
      await revealRemainingStageModules(2);
      await revealFinalScore();
      setRunningId(null);
      return;
    }

    updateStage('validation', {
      status: 'pass',
      detail: localText(
        '配置完整，准备发起连通性请求。',
        'Config is complete. Preparing the connectivity request.',
      ),
    });
    setRunningId('connectivity');

    const connectivityStartedAt = performance.now();
    let ping: ChatResult;
    try {
      updateStage('connectivity', {
        status: 'running',
        detail: localText(
          '正在发送最小 OpenAI-compatible 请求',
          'Sending a minimal OpenAI-compatible request',
        ),
      });
      await revealStageModule(2);
      ping = await requestChat(runConfig, '只输出 PONG', 16);
      updateStage('connectivity', {
        status: 'pass',
        detail: localText(
          '接口可联通，响应结构兼容。',
          'Endpoint is reachable and the response shape is compatible.',
        ),
        durationMs: Math.round(performance.now() - connectivityStartedAt),
      });
    } catch (error) {
      const message = requestErrorMessage(error);
      setRunError(message);
      updateStage('connectivity', {
        status: 'fail',
        detail: message,
        durationMs: Math.round(performance.now() - connectivityStartedAt),
      });
      updateStage('model-match', {
        status: 'idle',
        detail: localText(
          '连通失败，未执行模型核对。',
          'Connectivity failed, so the model check was not run.',
        ),
      });
      updateStage('probes', {
        status: 'idle',
        detail: localText(
          '连通失败，未运行能力探针。',
          'Connectivity failed, so capability probes were not run.',
        ),
      });
      await revealRemainingStageModules(3);
      await revealFinalScore();
      setRunningId(null);
      return;
    }

    setRunningId('model-match');
    updateStage('model-match', {
      status: 'running',
      detail: localText('正在比对返回模型名', 'Comparing the returned model name'),
    });
    await revealStageModule(3);

    const returnedModel = ping.returnedModel;
    const expectedModel = runConfig.compareModel.trim();
    const modelMatches = Boolean(returnedModel && expectedModel && returnedModel === expectedModel);
    const modelDetail = localText(
      `返回模型：${returnedModel || '未提供'}；对比模型：${expectedModel || '未提供'}。`,
      `Returned model: ${returnedModel || 'not provided'}; compare model: ${expectedModel || 'not provided'}.`,
    );

    setModelCheck({
      returnedModel,
      message: modelDetail,
    });
    updateStage('model-match', {
      status: modelMatches ? 'pass' : 'fail',
      detail: modelDetail,
      durationMs: 0,
    });

    setRunningId('probes');
    updateStage('probes', {
      status: 'running',
      detail: localText(
        `正在执行 ${activePlaybook.title[language]} 的专属题目`,
        `Running the model-specific prompts from ${activePlaybook.title[language]}`,
      ),
    });
    await revealStageModule(4);

    if (probes.length === 0) {
      updateStage('probes', {
        status: 'warn',
        detail: localText(copy.zh.noAutoProbes, copy.en.noAutoProbes),
      });
      await revealFinalScore();
      setRunningId(null);
      return;
    }

    const completedResults: ProbeResult[] = [];
    for (const probe of probes) {
      setRunningId(probe.id);
      const result = await runProbe(probe, runConfig);
      completedResults.push(result);
      setResults((current) => [...current, result]);
    }
    const failedCount = completedResults.filter((result) => result.status === 'fail').length;
    const warnedCount = completedResults.filter((result) => result.status === 'warn').length;
    updateStage('probes', {
      status: failedCount > 0 ? 'fail' : warnedCount > 0 ? 'warn' : 'pass',
      detail:
        failedCount > 0
          ? localText(
              `${failedCount} 个风险项，${warnedCount} 个观察项。`,
              `${failedCount} risk item(s), ${warnedCount} watch item(s).`,
            )
          : warnedCount > 0
            ? localText(
                `${warnedCount} 个观察项，其余通过。`,
                `${warnedCount} watch item(s), all others passed.`,
              )
            : localText(
                `${probes.length} 个自动题全部命中。`,
                `All ${probes.length} automated probes matched.`,
              ),
    });
    setScoreOpen(false);
    await revealFinalScore();
    setRunningId(null);
  };

  const endpointPreviewConfig = { ...config, model: effectiveRequestModel };
  const endpointPreview = endpointPreviewConfig.baseUrl.trim()
    ? buildEndpoint(endpointPreviewConfig)
    : t.waitingBaseUrl;
  const probeCount = probes.length;
  const resultCountLabel = `${results.length}/${probeCount}`;

  const updateRingProgress = (index: number, value: number) => {
    const next = [...ringProgressRef.current];
    next[index] = clampProgress(value);
    ringProgressRef.current = next;
    setRingProgress(next);
  };

  const resetAnimatedSurface = (
    message = language === 'zh' ? '等待开始测试。' : 'Waiting to start.',
  ) => {
    ringProgressRef.current = Array(DETECTION_STAGE_COUNT).fill(0);
    setRingProgress(Array(DETECTION_STAGE_COUNT).fill(0));
    setCurrentStep(0);
    setMountedStep(0);
    setLogoVisible(false);
    setActiveRunLogoProvider(null);
    setActiveRunModelName('');
    setFinalScoreMounted(false);
    setFinalScoreVisible(false);
    setBottomModulesVisible(false);
    setTestLogs([]);
    setResultOutput(message);
  };

  const pushLog = (title: string, detail: string, status: StageStatus = 'running') => {
    setTestLogs((current) => [
      ...current,
      {
        id: `${Date.now()}-${current.length}`,
        time: nowTime(language),
        title,
        detail,
        status,
      },
    ]);
  };

  const animateRingTo = async (index: number, target: number) => {
    const from = ringProgressRef.current[index] ?? 0;
    const to = clampProgress(target);
    const startedAt = performance.now();

    while (performance.now() - startedAt < PROGRESS_ANIMATION_MS) {
      const elapsed = performance.now() - startedAt;
      const eased = 1 - Math.pow(1 - Math.min(elapsed / PROGRESS_ANIMATION_MS, 1), 3);
      updateRingProgress(index, from + (to - from) * eased);
      await sleep(PROGRESS_FRAME_MS);
    }

    updateRingProgress(index, to);
  };

  const revealStageCard = async (index: number) => {
    setMountedStep(index + 1);
    await sleep(NEXT_PAINT_MS);
    setCurrentStep(index + 1);
    await sleep(STAGE_FADE_MS);
  };

  const settleStageCard = async (index: number, status: StageStatus, fallbackTarget: number) => {
    await animateRingTo(index, stageProgressTarget(status, fallbackTarget));
    await sleep(INTERNAL_STEP_MS);
  };

  const revealSkippedStages = async (fromIndex: number) => {
    for (let index = fromIndex; index < DETECTION_STAGE_COUNT; index += 1) {
      await revealStageCard(index);
      await settleStageCard(index, 'idle', 0);
    }
  };

  const revealBottomAndScore = async (output: string) => {
    setResultOutput(output);
    setBottomModulesVisible(true);
    await sleep(INTERNAL_STEP_MS);
    setFinalScoreMounted(true);
    await sleep(NEXT_PAINT_MS);
    setFinalScoreVisible(true);
    await sleep(STAGE_FADE_MS);
  };

  const summarizeRun = (
    completedResults: ProbeResult[],
    expectedModel: string,
    returnedModel?: string,
  ) => {
    const localScore = Math.max(
      0,
      Math.round(
        completedResults.reduce(
          (sum, result) => sum + statusScore(result.status, result.weight),
          0,
        ),
      ),
    );
    const passed = completedResults.filter((result) => result.status === 'pass').length;
    const warned = completedResults.filter((result) => result.status === 'warn').length;
    const failed = completedResults.filter((result) => result.status === 'fail').length;

    if (language === 'zh') {
      return `测试完成。请求模型 ${activeRunModelName || effectiveRequestModel || '--'}，返回模型 ${returnedModel || '未提供'}，对比模型 ${expectedModel || '未提供'}。最终鉴别分 ${localScore}，通过 ${passed} 项，观察 ${warned} 项，风险 ${failed} 项。`;
    }

    return `Test complete. Requested model ${activeRunModelName || effectiveRequestModel || '--'}, returned model ${returnedModel || 'not provided'}, expected model ${expectedModel || 'not provided'}. Final score ${localScore}; ${passed} passed, ${warned} warning(s), ${failed} risk item(s).`;
  };

  const finishTesting = async (output: string) => {
    await revealBottomAndScore(output);
    setIsTesting(false);
    setRunningId(null);
  };

  const startTestingExperience = async () => {
    if (isTransitioning || isTesting) return;

    const runConfig = getRunConfig();
    const validationMessage = validateConfig(runConfig);
    if (validationMessage) {
      const validationError = localizedValidationError(validationMessage);
      setConfigError(validationMessage);
      setRunError(validationError);
      setRunningId(null);
      setIsTransitioning(false);
      setIsTesting(false);
      setResultsOpen(false);
      setScoreOpen(false);
      return;
    }

    const runProvider = resolveRunLogoProvider(runConfig.model, selectedProvider);
    const needsEntryTransition = !hasEntered;

    setRunningId('preparing');
    setIsTransitioning(needsEntryTransition);
    setResults([]);
    setStages(initialStages(language));
    setModelCheck({ message: localText('尚未核对', 'Not checked yet') });
    setConfigError('');
    setRunError(null);
    setResultsOpen(true);
    setScoreOpen(false);
    resetAnimatedSurface(language === 'zh' ? '正在准备测试队列。' : 'Preparing the test queue.');
    setActiveRunModelName(runConfig.model);

    if (needsEntryTransition) {
      await sleep(TRANSITION_MS);
      setHasEntered(true);
      setIsTransitioning(false);
    }

    setIsTesting(true);
    window.scrollTo({ top: 0, behavior: 'auto' });
    mainPanelRef.current?.scrollTo({ top: 0, behavior: 'auto' });
    await sleep(120);
    window.scrollTo({ top: 0, behavior: 'auto' });
    mainPanelRef.current?.scrollTo({ top: 0, behavior: 'auto' });

    setActiveRunLogoProvider(runProvider);
    await sleep(NEXT_PAINT_MS);
    setLogoVisible(true);
    pushLog(
      language === 'zh' ? '重置界面' : 'Reset surface',
      `${runProvider.name[language]} · ${runConfig.model || '--'}`,
      'pass',
    );
    await sleep(INTERNAL_STEP_MS);

    setRunningId('validation');
    updateStage('validation', {
      status: 'running',
      detail: localText(
        '正在检查 Base URL、API Key、请求模型和对比模型。',
        'Checking Base URL, API key, request model, and compare model.',
      ),
    });

    const runtimeValidationMessage = validateConfig(runConfig);
    if (runtimeValidationMessage) {
      const bilingualValidation = localizedValidationError(runtimeValidationMessage);

      setConfigError(runtimeValidationMessage);
      setRunError(bilingualValidation);
      updateStage('validation', {
        status: 'fail',
        detail: bilingualValidation,
      });
      pushLog(stageCopy[language].validation.name, bilingualValidation[language], 'fail');
      await revealStageCard(0);
      await settleStageCard(0, 'fail', progressDefaults[0]);

      updateStage('connectivity', {
        status: 'idle',
        detail: localText(
          '配置校验未通过，未发送请求。',
          'Config check failed, so no request was sent.',
        ),
      });
      updateStage('model-match', {
        status: 'idle',
        detail: localText(
          '配置校验未通过，未执行模型核对。',
          'Config check failed, so the model check was not run.',
        ),
      });
      updateStage('probes', {
        status: 'idle',
        detail: localText(
          '配置校验未通过，未运行能力探针。',
          'Config check failed, so capability probes were not run.',
        ),
      });
      pushLog(
        language === 'zh' ? '队列停止' : 'Queue stopped',
        language === 'zh'
          ? '配置缺失，后续模块已跳过。'
          : 'Configuration is incomplete; later modules were skipped.',
        'warn',
      );
      await revealSkippedStages(1);
      await finishTesting(
        language === 'zh'
          ? `配置校验未通过：${runtimeValidationMessage}`
          : `Config check failed: ${runtimeValidationMessage}`,
      );
      return;
    }

    updateStage('validation', {
      status: 'pass',
      detail: localText(
        '配置完整，准备发起连通性请求。',
        'Config is complete. Preparing the connectivity request.',
      ),
    });
    pushLog(
      stageCopy[language].validation.name,
      language === 'zh'
        ? '配置完整，测试队列已锁定。'
        : 'Configuration is complete and the queue is locked.',
      'pass',
    );
    await revealStageCard(0);
    await settleStageCard(0, 'pass', progressDefaults[0]);

    setRunningId('connectivity');
    updateStage('connectivity', {
      status: 'running',
      detail: localText('正在发送最小兼容请求。', 'Sending a minimal compatible request.'),
    });
    pushLog(
      stageCopy[language].connectivity.name,
      language === 'zh' ? '发送 PONG 探测请求。' : 'Sending the PONG probe request.',
      'running',
    );
    await revealStageCard(1);
    await animateRingTo(1, stageProgressTarget('running', progressDefaults[1]));

    const connectivityStartedAt = performance.now();
    let ping: ChatResult;
    try {
      ping = await requestChat(runConfig, '只输出 PONG', 16);
      const durationMs = Math.round(performance.now() - connectivityStartedAt);
      updateStage('connectivity', {
        status: 'pass',
        detail: localText(
          '接口可联通，响应结构兼容。',
          'Endpoint is reachable and the response shape is compatible.',
        ),
        durationMs,
      });
      pushLog(
        stageCopy[language].connectivity.name,
        `${language === 'zh' ? '请求完成' : 'Request completed'} · ${formatDuration(durationMs)}`,
        'pass',
      );
      await settleStageCard(1, 'pass', progressDefaults[1]);
    } catch (error) {
      const message = requestErrorMessage(error);
      const durationMs = Math.round(performance.now() - connectivityStartedAt);
      setRunError(message);
      updateStage('connectivity', {
        status: 'fail',
        detail: message,
        durationMs,
      });
      updateStage('model-match', {
        status: 'idle',
        detail: localText(
          '连通失败，未执行模型核对。',
          'Connectivity failed, so the model check was not run.',
        ),
      });
      updateStage('probes', {
        status: 'idle',
        detail: localText(
          '连通失败，未运行能力探针。',
          'Connectivity failed, so capability probes were not run.',
        ),
      });
      pushLog(stageCopy[language].connectivity.name, message[language], 'fail');
      await settleStageCard(1, 'fail', progressDefaults[1]);
      await revealSkippedStages(2);
      await finishTesting(
        language === 'zh'
          ? `连通性检测失败：${message[language]}`
          : `Connectivity failed: ${message[language]}`,
      );
      return;
    }

    setRunningId('model-match');
    updateStage('model-match', {
      status: 'running',
      detail: localText('正在比对返回模型名。', 'Comparing the returned model name.'),
    });
    await revealStageCard(2);

    const returnedModel = ping.returnedModel;
    const expectedModel = runConfig.compareModel.trim();
    const modelMatches = Boolean(returnedModel && expectedModel && returnedModel === expectedModel);
    const modelDetail = localText(
      `返回模型：${returnedModel || '未提供'}；对比模型：${expectedModel || '未提供'}。`,
      `Returned model: ${returnedModel || 'not provided'}; compare model: ${expectedModel || 'not provided'}.`,
    );

    setModelCheck({
      returnedModel,
      message: modelDetail,
    });
    updateStage('model-match', {
      status: modelMatches ? 'pass' : 'fail',
      detail: modelDetail,
      durationMs: 0,
    });
    pushLog(
      stageCopy[language]['model-match'].name,
      modelDetail[language],
      modelMatches ? 'pass' : 'fail',
    );
    await settleStageCard(2, modelMatches ? 'pass' : 'fail', progressDefaults[2]);

    setRunningId('probes');
    updateStage('probes', {
      status: 'running',
      detail: localText(
        `正在执行 ${activePlaybook.title[language]} 的专属题目。`,
        `Running the model-specific prompts from ${activePlaybook.title[language]}.`,
      ),
    });
    pushLog(stageCopy[language].probes.name, activePlaybook.title[language], 'running');
    await revealStageCard(3);
    await animateRingTo(3, stageProgressTarget('running', progressDefaults[3]));

    if (probes.length === 0) {
      updateStage('probes', {
        status: 'warn',
        detail: localText(copy.zh.noAutoProbes, copy.en.noAutoProbes),
      });
      pushLog(stageCopy[language].probes.name, t.noAutoProbes, 'warn');
      await settleStageCard(3, 'warn', progressDefaults[3]);
      await finishTesting(
        language === 'zh'
          ? '自动题不足，已完成配置、连通性与模型核对。请按人工检查项复核。'
          : 'Automated probes are limited. Config, connectivity, and model check are complete; continue with manual review.',
      );
      return;
    }

    const completedResults: ProbeResult[] = [];
    for (const probe of probes) {
      setRunningId(probe.id);
      pushLog(
        stageCopy[language].probes.name,
        `${language === 'zh' ? '执行' : 'Running'} ${probe.name[language]}`,
        'running',
      );
      const result = await runProbe(probe, runConfig);
      completedResults.push(result);
      setResults((current) => [...current, result]);
      pushLog(probe.name[language], result.reason[language], result.status);
    }

    const failedCount = completedResults.filter((result) => result.status === 'fail').length;
    const warnedCount = completedResults.filter((result) => result.status === 'warn').length;
    const probesStatus: StageStatus = failedCount > 0 ? 'fail' : warnedCount > 0 ? 'warn' : 'pass';
    updateStage('probes', {
      status: probesStatus,
      detail:
        failedCount > 0
          ? localText(
              `${failedCount} 个风险项，${warnedCount} 个观察项。`,
              `${failedCount} risk item(s), ${warnedCount} watch item(s).`,
            )
          : warnedCount > 0
            ? localText(
                `${warnedCount} 个观察项，其余通过。`,
                `${warnedCount} watch item(s), all others passed.`,
              )
            : localText(
                `${probes.length} 个自动题全部命中。`,
                `All ${probes.length} automated probes matched.`,
              ),
    });
    await settleStageCard(3, probesStatus, progressDefaults[3]);
    await finishTesting(summarizeRun(completedResults, expectedModel, returnedModel));
  };

  const resetExperience = () => {
    reset();
    setHasEntered(false);
    setIsTransitioning(false);
    setIsTesting(false);
    resetAnimatedSurface(language === 'zh' ? '等待开始测试。' : 'Waiting to start.');
  };

  const returnToConfig = () => {
    setHasEntered(false);
    setIsTransitioning(false);
    setIsTesting(false);
    setRunningId(null);
    setResultsOpen(false);
    setScoreOpen(false);
    resetAnimatedSurface(language === 'zh' ? '等待开始测试。' : 'Waiting to start.');
    window.scrollTo({ top: 0, behavior: 'auto' });
    mainPanelRef.current?.scrollTo({ top: 0, behavior: 'auto' });
  };

  const shellClassName = [
    'tester-shell',
    dark ? 'tester-shell-dark' : '',
    hasEntered ? 'tester-shell-entered' : '',
    isTransitioning ? 'tester-shell-transitioning' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const overviewStats = [
    {
      label: language === 'zh' ? '总测试数' : 'Total tests',
      value: '128',
      icon: ListChecks,
      tone: 'text-blue-600',
    },
    {
      label: language === 'zh' ? '通过数' : 'Passed',
      value: '96',
      icon: CheckCircle2,
      tone: 'text-emerald-600',
    },
    {
      label: language === 'zh' ? '失败数' : 'Failed',
      value: '12',
      icon: XCircle,
      tone: 'text-rose-600',
    },
    {
      label: language === 'zh' ? '进行中' : 'Running',
      value: '20',
      icon: Loader2,
      tone: 'text-sky-600',
    },
    {
      label: language === 'zh' ? '消耗 Token' : 'Tokens used',
      value: scoreData.tokenCount > 0 ? scoreData.tokenCount.toLocaleString() : '--',
      icon: Hash,
      tone: 'text-indigo-500',
    },
    {
      label: language === 'zh' ? '执行总时间' : 'Total time',
      value: formatDuration(scoreData.durationMs),
      icon: Timer,
      tone: 'text-amber-500',
    },
  ];

  const scoreFormulaLines =
    language === 'zh'
      ? [
          '分数计算',
          '通过项按完整权重计分，观察项按 50% 权重计分，风险项计 0 分。',
          `当前：通过 ${scoreData.pass} 项 / 观察 ${scoreData.warn} 项 / 风险 ${scoreData.fail} 项。`,
          `最终分：${scoreData.score}，Token：${scoreData.tokenCount > 0 ? scoreData.tokenCount.toLocaleString() : '--'}，耗时：${formatDuration(scoreData.durationMs)}。`,
        ]
      : [
          'Score calculation',
          'Pass receives full weight, watch receives 50% weight, risk receives 0.',
          `Current: ${scoreData.pass} pass / ${scoreData.warn} watch / ${scoreData.fail} risk.`,
          `Final score: ${scoreData.score}, tokens: ${scoreData.tokenCount > 0 ? scoreData.tokenCount.toLocaleString() : '--'}, time: ${formatDuration(scoreData.durationMs)}.`,
        ];

  const renderRequestModelPicker = () => (
    <label className='block'>
      <span className='mb-1.5 flex items-center gap-2 text-xs font-semibold text-slate-600'>
        <Activity size={14} />
        {t.requestModel}
      </span>
      <div ref={requestModelPanelRef} className='relative'>
        <div className='config-input-shell'>
          <input
            value={config.model}
            onChange={(event) => {
              updateConfig('model', event.target.value);
              setRequestModelOpen(true);
            }}
            onFocus={() => setRequestModelOpen(true)}
            placeholder={t.requestModelPlaceholder}
            className='config-input'
          />
          <button
            type='button'
            onClick={() => setRequestModelOpen((current) => !current)}
            className='config-icon-button'
            aria-label={t.requestModelPicker}
            title={t.requestModelPicker}
          >
            <ChevronDown
              className={`transition-transform ${requestModelOpen ? 'rotate-180' : ''}`}
              size={16}
            />
          </button>
        </div>

        {requestModelOpen && (
          <div className='model-picker-popover'>
            <div className='model-picker-search'>
              <Search size={14} className='text-slate-400' />
              <input
                ref={requestModelSearchRef}
                value={requestModelSearch}
                onChange={(event) => setRequestModelSearch(event.target.value)}
                placeholder={t.requestModelSearch}
                className='h-9 w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400'
              />
            </div>
            <div className='max-h-72 overflow-y-auto p-2'>
              {filteredRequestModelOptions.length > 0 ? (
                <>
                  <div className='mb-2 flex items-center justify-between px-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400'>
                    <span>{fetchedModels.length > 0 ? t.fetchedModels : t.providerModel}</span>
                    <span>{filteredRequestModelOptions.length}</span>
                  </div>
                  <div className='space-y-1'>
                    {filteredRequestModelOptions.map((model) => (
                      <button
                        key={model}
                        type='button'
                        onClick={() => selectRequestModel(model)}
                        className='model-option-row'
                      >
                        <span className='truncate'>{model}</span>
                        {config.model === model && (
                          <Check size={14} className='shrink-0 text-emerald-600' />
                        )}
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <div className='px-2 py-6 text-center text-sm text-slate-500'>
                  {t.modelSearchEmpty}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </label>
  );

  const renderCompareModelPicker = () => (
    <label className='block'>
      <span className='mb-1.5 flex items-center gap-2 text-xs font-semibold text-slate-600'>
        <Activity size={14} />
        {t.compareModel}
      </span>
      <div ref={compareModelPanelRef} className='relative'>
        <div className='config-input-shell'>
          <input
            value={config.compareModel}
            onChange={(event) => updateConfig('compareModel', event.target.value)}
            onFocus={() => setCompareModelOpen(true)}
            placeholder={t.compareModelPlaceholder}
            className='config-input'
          />
          <button
            type='button'
            onClick={() => setCompareModelOpen((current) => !current)}
            className='config-icon-button'
            aria-label={t.compareModelPicker}
            title={t.compareModelPicker}
          >
            <ChevronDown
              className={`transition-transform ${compareModelOpen ? 'rotate-180' : ''}`}
              size={16}
            />
          </button>
        </div>

        {compareModelOpen && (
          <div className='model-picker-popover'>
            <div className='model-picker-search'>
              <Search size={14} className='text-slate-400' />
              <input
                ref={compareModelSearchRef}
                value={compareModelSearch}
                onChange={(event) => setCompareModelSearch(event.target.value)}
                placeholder={t.compareModelSearch}
                className='h-9 w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400'
              />
            </div>

            <div className='max-h-72 overflow-y-auto p-2'>
              {compareModelSections.runtimeOnly.length > 0 && (
                <div className='mb-3'>
                  <div className='mb-2 flex items-center justify-between px-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400'>
                    <span>{t.runtimeModels}</span>
                    <span>{compareModelSections.runtimeOnly.length}</span>
                  </div>
                  <div className='space-y-1'>
                    {compareModelSections.runtimeOnly.map((option) => (
                      <button
                        key={option.key}
                        type='button'
                        onClick={() => selectCompareModel(option.model)}
                        className='model-option-row'
                      >
                        <span className='min-w-0 truncate'>{option.model}</span>
                        <span className='flex shrink-0 items-center gap-2'>
                          <span className='rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-500'>
                            {option.vendorName}
                          </span>
                          {config.compareModel === option.model && (
                            <Check size={14} className='text-emerald-600' />
                          )}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {compareModelSections.catalogGroups.length > 0 ? (
                <div className='space-y-3'>
                  {(['global', 'china'] as ModelRegion[]).map((region) => {
                    const groups = compareModelSections.catalogGroups.filter(
                      (group) => group.region === region,
                    );
                    if (groups.length === 0) return null;

                    return (
                      <div key={region}>
                        <div className='mb-2 flex items-center justify-between px-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400'>
                          <span>{regionLabels[region][language]}</span>
                          <span>{t.compareModelCatalog}</span>
                        </div>
                        <div className='space-y-2'>
                          {groups.map((group) => (
                            <div
                              key={group.id}
                              className='rounded-xl border border-slate-200 bg-slate-50/80 p-2'
                            >
                              <div className='mb-2 flex items-center justify-between px-1'>
                                <span className='text-xs font-semibold text-slate-700'>
                                  {group.name}
                                </span>
                                <span className='text-[11px] text-slate-400'>
                                  {group.options.length}
                                </span>
                              </div>
                              <div className='space-y-1'>
                                {group.options.map((option) => (
                                  <button
                                    key={option.key}
                                    type='button'
                                    onClick={() => selectCompareModel(option.model)}
                                    className='model-option-row'
                                  >
                                    <span className='truncate'>{option.model}</span>
                                    {config.compareModel === option.model && (
                                      <Check size={14} className='shrink-0 text-emerald-600' />
                                    )}
                                  </button>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : null}

              {!hasCompareModelResults && (
                <div className='px-2 py-6 text-center text-sm text-slate-500'>
                  {t.modelSearchEmpty}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </label>
  );

  return (
    <main className={shellClassName}>
      <video className='global-video-background' autoPlay muted loop playsInline aria-hidden='true'>
        <source src='/global-background.mp4' type='video/mp4' />
      </video>
      <div className='tester-background' />

      <section className='config-stage-panel glass-card'>
        <div className='config-layout-grid'>
          <div className='config-column config-primary-column'>
            <div className='config-panel-header'>
              <div>
                <p className='text-xs font-semibold uppercase tracking-[0.16em] text-blue-200/80'>
                  LLM TEST CONSOLE
                </p>
                <h1 className='mt-2 text-2xl font-semibold text-white'>大模型测试平台</h1>
                <p className='mt-2 text-sm leading-6 text-white/62'>
                  配置接口、选择请求模型，然后启动一次按队列执行的模型检测。
                </p>
              </div>
              <div className='config-chip'>
                <span className='h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.9)]' />
                Ready
              </div>
            </div>

            <div className='rounded-2xl border border-white/35 bg-white/20 p-3'>
              <div className='mb-3 text-xs font-semibold text-white/70'>{t.providerTemplates}</div>
              <div className='grid grid-cols-5 gap-2'>
                {providerPresets.map((provider) => {
                  const active = selectedProviderId === provider.id;
                  return (
                    <button
                      key={provider.id}
                      type='button'
                      onClick={() => applyProvider(provider)}
                      className={`provider-tile ${active ? 'provider-tile-active' : ''}`}
                      title={provider.name[language]}
                    >
                      <ProviderLogo
                        provider={provider}
                        className='h-6 w-6 border border-white/50 bg-white p-0.5'
                      />
                      <span className='max-w-full truncate'>{provider.name[language]}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <label className='block'>
              <span className='mb-1.5 flex items-center gap-2 text-xs font-semibold text-white/72'>
                <Server size={14} />
                {t.baseUrl}
              </span>
              <input
                value={config.baseUrl}
                onChange={(event) => updateConfig('baseUrl', event.target.value)}
                placeholder='https://api.openai.com/v1'
                className='config-input-dark'
              />
            </label>

            <label className='block'>
              <span className='mb-1.5 flex items-center gap-2 text-xs font-semibold text-white/72'>
                <KeyRound size={14} />
                {t.apiKey}
              </span>
              <div className='config-input-dark-shell'>
                <input
                  value={config.apiKey}
                  onChange={(event) => updateConfig('apiKey', event.target.value)}
                  type={showApiKey ? 'text' : 'password'}
                  placeholder='sk-...'
                  className='min-w-0 flex-1 bg-transparent px-3 text-sm text-white outline-none placeholder:text-white/35'
                />
                <button
                  type='button'
                  onClick={() => setShowApiKey((current) => !current)}
                  className='grid h-11 w-11 place-items-center border-l border-white/20 text-white/62 transition hover:bg-white/10 hover:text-white'
                  title={showApiKey ? t.hideApiKey : t.showApiKey}
                >
                  {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </label>
          </div>

          <div className='config-column config-action-column'>
            <div className='rounded-2xl border border-white/30 bg-white/16 p-3'>
              <div className='mb-2 text-xs font-semibold text-white/72'>{t.endpointPath}</div>
              <div className='grid grid-cols-5 gap-1 rounded-xl border border-white/25 bg-black/20 p-1'>
                {(['openai', 'anthropic', 'gemini', 'full', 'custom'] as EndpointMode[]).map(
                  (value) => (
                    <button
                      key={value}
                      type='button'
                      onClick={() => updateConfig('endpointMode', value)}
                      className={`h-8 rounded-lg text-[11px] font-semibold transition ${
                        config.endpointMode === value
                          ? 'bg-white text-slate-950'
                          : 'text-white/62 hover:bg-white/12 hover:text-white'
                      }`}
                    >
                      {t.endpointModes[value]}
                    </button>
                  ),
                )}
              </div>
              {config.endpointMode === 'custom' && (
                <input
                  value={config.customPath}
                  onChange={(event) => updateConfig('customPath', event.target.value)}
                  placeholder='/v1/chat/completions'
                  className='mt-2 h-9 w-full rounded-xl border border-white/25 bg-black/20 px-3 font-mono text-xs text-white outline-none placeholder:text-white/35 focus:border-blue-300'
                />
              )}
              <div className='endpoint-preview' title={`POST ${endpointPreview}`}>
                <span className='endpoint-method'>POST</span>
                <span className='endpoint-url'>{endpointPreview}</span>
              </div>
            </div>

            <div className='grid gap-3 rounded-2xl border border-white/30 bg-white/16 p-3'>
              <div className='flex items-start justify-between gap-3'>
                <div>
                  <div className='flex items-center gap-2 text-xs font-semibold text-white/72'>
                    <ListChecks size={14} />
                    {t.fetchedModels}
                  </div>
                  <div className='mt-1 text-[11px] leading-4 text-white/48'>
                    {modelsMessage[language] || t.modelsFetchHint}
                  </div>
                </div>
                <button
                  type='button'
                  onClick={fetchModels}
                  disabled={!canFetchModels || modelsStatus === 'loading'}
                  className='inline-flex h-8 shrink-0 items-center gap-1 rounded-lg border border-white/30 bg-white/14 px-2 text-xs font-semibold text-white transition hover:bg-white/22 disabled:cursor-not-allowed disabled:opacity-50'
                >
                  {modelsStatus === 'loading' ? (
                    <Loader2 className='animate-spin' size={13} />
                  ) : (
                    <RefreshCw size={13} />
                  )}
                  {modelsStatus === 'loading' ? t.fetchingModels : t.fetchModels}
                </button>
              </div>
              <div className='grid gap-3'>
                {renderRequestModelPicker()}
                {renderCompareModelPicker()}
              </div>
            </div>

            {configError && (
              <div className='rounded-xl border border-rose-300/50 bg-rose-500/18 px-3 py-2 text-sm text-rose-50'>
                {configError}
              </div>
            )}

            <button
              type='button'
              onClick={startTestingExperience}
              disabled={isTransitioning || isTesting}
              className='start-test-button'
            >
              {isTransitioning || isTesting ? (
                <Loader2 className='animate-spin' size={18} />
              ) : (
                <Play size={18} />
              )}
              {isTransitioning || isTesting
                ? language === 'zh'
                  ? '测试中'
                  : 'Testing'
                : language === 'zh'
                  ? '开始测试'
                  : 'Start test'}
            </button>
          </div>
        </div>
      </section>

      <section
        ref={mainPanelRef}
        className='testing-main-panel glass-card'
        aria-hidden={!hasEntered && !isTransitioning}
      >
        <div className='dashboard-stack'>
          <header className='dashboard-titlebar glass-card'>
            <div className='flex min-w-0 items-center gap-3'>
              <button
                type='button'
                onClick={returnToConfig}
                className='back-title-button'
                aria-label={language === 'zh' ? '返回配置' : 'Back to config'}
                title={language === 'zh' ? '返回配置' : 'Back to config'}
              >
                <ChevronLeft size={20} strokeWidth={2.4} />
              </button>
              <div className='min-w-0'>
                <h2 className='text-xl font-semibold text-slate-950'>{t.title}</h2>
                <p className='mt-1 text-sm text-slate-500'>{t.subtitle}</p>
              </div>
            </div>
            <div className='flex shrink-0 items-center gap-2'>
              <div className='status-pill-soft'>
                <span className='h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_14px_rgba(16,185,129,0.8)]' />
                {isTesting
                  ? t.status.running
                  : finalScoreVisible
                    ? language === 'zh'
                      ? '已完成'
                      : 'Complete'
                    : t.status.idle}
              </div>
              <button
                type='button'
                onClick={generateShareImage}
                className='toolbar-icon-button'
                title={t.shareImage}
                aria-label={t.shareImage}
              >
                <Download size={17} />
              </button>
              <button
                type='button'
                onClick={resetExperience}
                className='toolbar-icon-button'
                title={t.reset}
              >
                <RotateCcw size={17} />
              </button>
              <button
                type='button'
                onClick={() => setLanguage((current) => (current === 'zh' ? 'en' : 'zh'))}
                className='toolbar-icon-button'
                title={t.switchLanguage}
                aria-label={t.switchLanguage}
              >
                <Languages size={17} />
              </button>
            </div>
          </header>

          {activeRunLogoProvider && (
            <div className='model-score-row'>
              <div
                className={`run-logo-card dashboard-logo-card ${logoVisible ? 'run-logo-card-visible' : ''}`}
              >
                <div className='flex min-w-0 items-center gap-3'>
                  <ProviderLogo
                    provider={activeRunLogoProvider}
                    className='h-12 w-12 shrink-0 border border-white/70 bg-white p-1'
                  />
                  <div className='min-w-0'>
                    <div className='text-xs font-semibold text-slate-500'>{t.activeModelLogo}</div>
                    <div className='mt-1 truncate text-lg font-semibold text-slate-950'>
                      {activeRunLogoProvider.name[language]}
                    </div>
                    <div className='mt-0.5 truncate font-mono text-xs text-slate-500'>
                      {activeRunModelName || '--'}
                    </div>
                  </div>
                </div>
                {isTesting && <Loader2 className='shrink-0 animate-spin text-blue-600' size={18} />}
              </div>

              {finalScoreMounted && (
                <div
                  className={`final-score-card final-score-banner ${finalScoreVisible ? 'final-score-card-visible' : ''}`}
                >
                  <div className='final-score-meta'>
                    <div className='final-score-icon'>
                      <Gauge size={23} />
                    </div>
                    <div className='min-w-0'>
                      <div className='final-score-title-row'>
                        <span className='final-score-kicker'>{t.finalScoreTitle}</span>
                        <span
                          className='score-help'
                          tabIndex={0}
                          aria-label={language === 'zh' ? '查看分数计算' : 'View score calculation'}
                        >
                          <AlertTriangle size={13} />
                          <span className='score-help-popover' role='tooltip'>
                            {scoreFormulaLines.map((line) => (
                              <span key={line}>{line}</span>
                            ))}
                          </span>
                        </span>
                      </div>
                      <div className='final-score-label'>{scoreData.label.text[language]}</div>
                    </div>
                  </div>
                  <div className='final-score-value-block'>
                    <div className='final-score-value'>{scoreData.score}</div>
                    <div className='final-score-description'>{t.finalScoreDescription}</div>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className='progress-card-grid'>
            {stages.map((stage, index) => {
              if (index >= mountedStep) return null;
              const meta = stageCopy[language][stage.id];
              const visible = index < currentStep;

              return (
                <article
                  key={stage.id}
                  className={`progress-module glass-card sequential-stage-card ${visible ? 'sequential-stage-card-visible' : ''}`}
                >
                  <div className='flex items-start justify-between gap-3'>
                    <div>
                      <div className='font-mono text-xs text-slate-400'>0{index + 1}</div>
                      <h3 className='mt-1 text-base font-semibold text-slate-950'>{meta.name}</h3>
                      <p className='mt-1 text-xs leading-5 text-slate-500'>{meta.description}</p>
                    </div>
                    <StageIcon status={stage.status} />
                  </div>
                  <div className='mt-4 flex items-center justify-center'>
                    <ProgressRing value={ringProgress[index] ?? 0} status={stage.status} />
                  </div>
                  <div className='mt-4 rounded-2xl border border-white/55 bg-white/34 px-3 py-2 text-xs leading-5 text-slate-600'>
                    {stage.detail[language]}
                    {typeof stage.durationMs === 'number' && (
                      <span className='ml-2 font-mono text-slate-400'>
                        {formatDuration(stage.durationMs)}
                      </span>
                    )}
                  </div>
                </article>
              );
            })}
          </div>

          <div
            className={`dashboard-bottom-grid sequenced-block ${bottomModulesVisible ? 'sequenced-block-visible' : ''}`}
          >
            <section className='glass-card log-panel'>
              <div className='flex items-center justify-between gap-3'>
                <div>
                  <h3 className='text-base font-semibold text-slate-950'>
                    {language === 'zh' ? '实时日志' : 'Live log'}
                  </h3>
                  <p className='mt-1 text-xs text-slate-500'>
                    {language === 'zh'
                      ? '按时间戳记录每一步执行状态'
                      : 'Every step is timestamped as it runs'}
                  </p>
                </div>
                <Activity size={18} className='text-blue-600' />
              </div>
              <div className='mt-4 space-y-2'>
                {testLogs.length > 0 ? (
                  testLogs.map((item) => (
                    <div key={item.id} className='log-row'>
                      <span className='font-mono text-[11px] text-slate-400'>{item.time}</span>
                      <span className={`log-dot log-dot-${item.status}`} />
                      <div className='min-w-0'>
                        <div className='truncate text-sm font-semibold text-slate-800'>
                          {item.title}
                        </div>
                        <div className='truncate text-xs text-slate-500'>{item.detail}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className='rounded-2xl border border-white/50 bg-white/26 px-3 py-4 text-sm text-slate-500'>
                    {language === 'zh'
                      ? '等待测试队列启动。'
                      : 'Waiting for the test queue to start.'}
                  </div>
                )}
              </div>
            </section>

            <section className='glass-card overview-panel'>
              <div className='flex items-center justify-between gap-3'>
                <div>
                  <h3 className='text-base font-semibold text-slate-950'>
                    {language === 'zh' ? '测试概览' : 'Test overview'}
                  </h3>
                  <p className='mt-1 text-xs text-slate-500'>
                    {language === 'zh' ? '平台级测试样本统计' : 'Platform-level sample counts'}
                  </p>
                </div>
                <ShieldCheck size={18} className='text-emerald-600' />
              </div>
              <div className='mt-4 grid grid-cols-2 gap-3'>
                {overviewStats.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className='overview-stat-card'>
                      <Icon size={18} className={item.tone} />
                      <div className='mt-3 text-xs text-slate-500'>{item.label}</div>
                      <div className='mt-1 font-mono text-2xl font-semibold text-slate-950'>
                        {item.value}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>

          <section
            className={`glass-card result-output-panel sequenced-block ${bottomModulesVisible ? 'sequenced-block-visible' : ''}`}
          >
            <div className='flex items-start justify-between gap-4'>
              <div>
                <h3 className='text-base font-semibold text-slate-950'>
                  {language === 'zh' ? '结果输出' : 'Result output'}
                </h3>
                <p className='mt-2 text-sm leading-6 text-slate-600'>{resultOutput}</p>
              </div>
              {runError ? (
                <XCircle className='shrink-0 text-rose-500' size={20} />
              ) : finalScoreVisible ? (
                <CheckCircle2 className='shrink-0 text-emerald-500' size={20} />
              ) : (
                <Loader2 className='shrink-0 text-blue-500' size={20} />
              )}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
