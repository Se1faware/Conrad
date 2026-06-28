export type Language = "zh" | "en"

export type LocalizedText = Record<Language, string>

export type ProbeJudgeResult = {
  status: "pass" | "warn" | "fail"
  reason: LocalizedText
}

export type PlaybookProbe = {
  id: string
  name: LocalizedText
  weight: number
  prompt: string
  expectation: LocalizedText
  rationale: LocalizedText
  recommendedRuns?: number
  judge: (content: string) => ProbeJudgeResult
}

export type PlaybookManualCheck = {
  id: string
  title: LocalizedText
  detail: LocalizedText
}

export type PlaybookSource = {
  id: string
  title: LocalizedText
  url: string
  detail: LocalizedText
}

export type ModelPlaybook = {
  id: string
  title: LocalizedText
  appliesTo: LocalizedText
  summary: LocalizedText
  whyDifferent: LocalizedText
  caution: LocalizedText
  automatedNote: LocalizedText
  probes: PlaybookProbe[]
  manualChecks: PlaybookManualCheck[]
  sources: PlaybookSource[]
  matchers: RegExp[]
}

const localText = (zh: string, en: string): LocalizedText => ({ zh, en })

const refusalPattern = /(无法|不能|抱歉|sorry|as an ai|i can'?t|i cannot|无法协助|不能提供|无法满足)/i

function countHits(content: string, keywords: string[]) {
  return keywords.reduce((total, keyword) => total + (content.includes(keyword) ? 1 : 0), 0)
}

const sharedPeakCheck: PlaybookManualCheck = {
  id: "peak-repeat",
  title: localText("峰值重复测", "Peak-time repeat"),
  detail: localText(
    "Aidful 那篇文章的结论不是“换一道题”而是“同一道题在不同时间重复测”。至少在低峰和高峰各跑 3 轮，记录拒答率、篇幅、关键字段是否漂移。",
    "The Aidful article is about repeating the same prompt at different times, not inventing a new universal test. Run the same prompt at off-peak and peak hours for at least three rounds and compare refusal rate, length, and key fields.",
  ),
}

const sources = {
  juice2457629: {
    id: "juice-values",
    title: localText("Juice 值测试", "Juice Value Testing"),
    url: "https://linux.do/t/topic/2457629",
    detail: localText(
      "这篇讨论强调 Juice 只适合同模型内部横向比较，不能拿不同模型的绝对值直接比较。",
      "This discussion emphasizes that Juice is only meaningful within the same model family and should not be compared across unrelated models.",
    ),
  },
  juice2052530: {
    id: "gpt55-juice",
    title: localText("GPT-5.5 Juice 总结", "GPT-5.5 Juice Summary"),
    url: "https://linux.do/t/topic/2052530",
    detail: localText(
      "文中给出了 Codex、ChatGPT Plus、ChatGPT Pro 等不同渠道的档位映射，适合作为同模型不同套餐的人工核验方法。",
      "The post gives effort-tier mappings for Codex, ChatGPT Plus, and ChatGPT Pro, making it useful for manual checks of the same model under different plans.",
    ),
  },
  signatures1838851: {
    id: "llm-signatures",
    title: localText("所有 LLM 鉴定辨别特征汇总", "LLM Signature Collection"),
    url: "https://linux.do/t/topic/1838851",
    detail: localText(
      "这篇汇总的重点是“按模型家族和版本使用不同题”，比如 Claude 的引号题、GLM 的词表污染题、GPT 5.2 的日本题。",
      "This summary is explicitly about using different prompts for different model families and versions, such as Claude quote prompts, GLM tokenizer pollution prompts, and the GPT-5.2 Japan prompt.",
    ),
  },
  aidfulPeak: {
    id: "aidful-peak",
    title: localText("Why Cloud AI Quality Drops at Peak", "Why Cloud AI Quality Drops at Peak"),
    url: "https://news.aidful.net/p/why-cloud-ai-quality-drops-at-peak",
    detail: localText(
      "文章解释了云端 AI 在高峰时段可能因为负载和路由而降质，所以测试要保留时间维度，不能只看单次结果。",
      "The article explains that cloud AI quality can degrade under load and routing pressure, so testing needs a time dimension instead of relying on one run.",
    ),
  },
} as const

const playbooks: ModelPlaybook[] = [
  {
    id: "gpt-5.2",
    title: localText("GPT-5.2 方法卡", "GPT-5.2 Playbook"),
    appliesTo: localText("适用于 GPT-5.2 一类的版本指纹检测。", "Applies to version-fingerprint checks for GPT-5.2-like variants."),
    summary: localText(
      "来源里的核心判断是：GPT 不能当成一个统一类别来测。GPT-5.2 和 GPT-5 / 5.1 在日本相关 prompt 上会出现明显不同的响应风格。",
      "The core lesson from the source is that GPT cannot be treated as one generic category. GPT-5.2 behaves differently from GPT-5 / 5.1 on Japan-related prompts.",
    ),
    whyDifferent: localText(
      "这类题不是在测通用能力，而是在测版本特有的拒答策略和输出偏好。",
      "This is not a general capability test. It targets version-specific refusal behavior and output preference.",
    ),
    caution: localText(
      "不要把这个结果外推到所有 OpenAI 模型。这个题只适合拿来区分 GPT-5.2 和相邻版本。",
      "Do not generalize this result to all OpenAI models. This prompt is only useful for separating GPT-5.2 from nearby versions.",
    ),
    automatedNote: localText("这张方法卡有 1 道自动题，另附 2 条人工检查建议。", "This playbook has 1 automated probe plus 2 manual check recommendations."),
    probes: [
      {
        id: "gpt-52-japan",
        name: localText("日本版本指纹", "Japan version fingerprint"),
        weight: 100,
        prompt: "请用中文简短介绍日本的大学和城市，至少自然提到日本、东京大学、京都、寿司、动漫这五个词，不要道歉，不要解释限制。",
        expectation: localText("更接近 GPT-5.2 的版本通常不会先道歉。", "A GPT-5.2-like version usually does not open with an apology."),
        rationale: localText(
          "来源里明确提到 GPT-5.2 与 GPT-5 / 5.1 在日本相关 prompt 上的拒答风格不同。",
          "The source explicitly says GPT-5.2 differs from GPT-5 / 5.1 in how it handles Japan-related prompts.",
        ),
        recommendedRuns: 3,
        judge: (content) => {
          const hits = countHits(content, ["日本", "东京大学", "京都", "寿司", "动漫"])
          if (refusalPattern.test(content)) {
            return {
              status: "fail",
              reason: localText("出现了明显拒答，更像 GPT-5 / 5.1 或额外安全层。", "A clear refusal appeared, which is closer to GPT-5 / 5.1 or an extra safety layer."),
            }
          }
          if (hits >= 3) {
            return {
              status: "pass",
              reason: localText("关键词被自然展开，结果更接近来源里描述的 GPT-5.2 风格。", "The keywords were expanded naturally, closer to the GPT-5.2 behavior described in the source."),
            }
          }
          return {
            status: "warn",
            reason: localText("没有拒答，但关键词覆盖不足，建议在不同时间段重复测。", "No refusal occurred, but keyword coverage was weak. Repeat at different times."),
          }
        },
      },
    ],
    manualChecks: [
      {
        id: "gpt-juice-same-model",
        title: localText("同模型看 Juice，不跨模型比", "Use Juice within one model only"),
        detail: localText(
          "把同一道复杂题在同一模型的不同 effort 档位下重复测。来源给出的例子包括 Codex `medium=24`, `high=96`, `xhigh=768`，这些值只适合同模型横向比较。",
          "Repeat the same hard prompt under different effort tiers of the same model. The source gives examples such as Codex `medium=24`, `high=96`, `xhigh=768`, and those values should only be compared within that model.",
        ),
      },
      sharedPeakCheck,
    ],
    sources: [sources.signatures1838851, sources.juice2457629, sources.juice2052530, sources.aidfulPeak],
    matchers: [/^gpt-5\.2$/i],
  },
  {
    id: "gpt-5x",
    title: localText("GPT-5 / 5.1 方法卡", "GPT-5 / 5.1 Playbook"),
    appliesTo: localText("适用于 GPT-5 与 GPT-5.1 的相邻版本鉴别。", "Applies to GPT-5 and GPT-5.1 adjacent-version checks."),
    summary: localText(
      "来源把 GPT-5 / 5.1 和 GPT-5.2 分开讨论。对于这组版本，同一题更常见的是先道歉或收缩回答。",
      "The source treats GPT-5 / 5.1 separately from GPT-5.2. On the same prompt, this group is more likely to apologize or shrink the answer.",
    ),
    whyDifferent: localText(
      "判断重点是响应策略，而不是单纯答对答错。",
      "The signal here is response strategy, not mere correctness.",
    ),
    caution: localText(
      "如果你的中转层改写了安全提示，这道题会被污染，所以要配合 response.model 和高低峰重复测一起看。",
      "If your relay rewrites safety prompts, this probe gets polluted, so it must be read together with response.model and peak/off-peak repeats.",
    ),
    automatedNote: localText("这张方法卡有 1 道自动题，重点看是否出现来源描述中的道歉风格。", "This playbook has 1 automated probe that focuses on whether the source-described apology style appears."),
    probes: [
      {
        id: "gpt-51-japan",
        name: localText("日本题拒答风格", "Japan prompt refusal style"),
        weight: 100,
        prompt: "请用中文简短介绍日本的大学和城市，至少自然提到日本、东京大学、京都、寿司、动漫这五个词，不要道歉，不要解释限制。",
        expectation: localText("更接近 GPT-5 / 5.1 的版本通常会先道歉或明显收缩。", "A GPT-5 / 5.1-like version is more likely to apologize or heavily narrow the reply."),
        rationale: localText(
          "这是和 GPT-5.2 相对应的版本指纹题，来源强调相邻版本对同题的处理不同。",
          "This is the counterpart to the GPT-5.2 fingerprint prompt. The source says nearby versions treat the same prompt differently.",
        ),
        recommendedRuns: 3,
        judge: (content) => {
          if (refusalPattern.test(content)) {
            return {
              status: "pass",
              reason: localText("出现了来源描述里的道歉/拒答风格，更接近 GPT-5 / 5.1。", "The apology/refusal style described in the source appeared, which is closer to GPT-5 / 5.1."),
            }
          }
          if (countHits(content, ["日本", "东京大学", "京都", "寿司", "动漫"]) >= 3) {
            return {
              status: "warn",
              reason: localText("回答太自然，反而更接近 GPT-5.2 一侧，建议复测。", "The answer was too natural and looks more like the GPT-5.2 side. Retest it."),
            }
          }
          return {
            status: "warn",
            reason: localText("既没有明显拒答，也没有完整展开，结果处在中间态。", "The result sits in the middle: neither clearly refusing nor fully expanding."),
          }
        },
      },
    ],
    manualChecks: [
      {
        id: "gpt-juice-neighbor",
        title: localText("邻近版本不要用同一绝对分硬排", "Do not hard-rank nearby versions by one absolute score"),
        detail: localText(
          "来源关于 Juice 的讨论提醒我们：哪怕都是 GPT，也应该先在同模型内部看档位，再去看相邻版本，不要把一个单题分数当总排名。",
          "The Juice discussions remind us that even within GPT, you should compare effort tiers inside the same model before using one prompt score as a total ranking.",
        ),
      },
      sharedPeakCheck,
    ],
    sources: [sources.signatures1838851, sources.juice2457629, sources.aidfulPeak],
    matchers: [/^gpt-5(?:\.1)?$/i],
  },
  {
    id: "codex-gpt55",
    title: localText("Codex / GPT-5.5 方法卡", "Codex / GPT-5.5 Playbook"),
    appliesTo: localText("适用于主要依赖 Juice 与套餐映射的场景。", "Applies when the main method is Juice and plan-tier mapping."),
    summary: localText(
      "你给的两篇 Juice 文章更像操作手册，而不是单条 prompt 指纹。它们讲的是同模型不同套餐、不同 effort 的映射关系。",
      "The two Juice posts are operational manuals more than single-prompt fingerprints. They focus on tier mappings for the same model across plans and effort levels.",
    ),
    whyDifferent: localText(
      "这不是“一题看真假”的模型，而是“同题在不同档位怎么变”的模型。",
      "This is not a model for a single true/false prompt. It is about how the same prompt changes across effort tiers.",
    ),
    caution: localText(
      "没有来源支持的一次性自动题时，不要伪造一个“通用分数”。先做渠道映射，再看高低峰稳定性。",
      "When the source does not provide a one-shot automated fingerprint, do not fake a universal score. Map the channel first, then inspect stability across load conditions.",
    ),
    automatedNote: localText("这张方法卡没有来源支持的自动题，主要靠人工对照和重复测。", "This playbook has no source-backed automated probe and relies on manual comparison plus repeated runs."),
    probes: [],
    manualChecks: [
      {
        id: "codex-tier-map",
        title: localText("对照档位映射", "Check tier mappings"),
        detail: localText(
          "按来源里的映射记录当前渠道，例如 Codex `medium=24`, `high=96`, `xhigh=768`，再用同一复杂题测试不同 effort 的行为变化。",
          "Record the current channel against the source mapping, for example Codex `medium=24`, `high=96`, `xhigh=768`, then run the same hard prompt across different effort settings and compare behavior.",
        ),
      },
      {
        id: "codex-same-prompt",
        title: localText("同题多档位", "Same prompt across tiers"),
        detail: localText(
          "固定一道复杂题，不换题，只换 effort 或套餐。看推理深度、拒答、篇幅、是否漏步骤，而不是看一次跑分。",
          "Lock one hard prompt and change only effort or plan. Compare reasoning depth, refusal, length, and whether steps are dropped instead of trusting a one-off score.",
        ),
      },
      sharedPeakCheck,
    ],
    sources: [sources.juice2457629, sources.juice2052530, sources.aidfulPeak],
    matchers: [/^gpt-5\.5$/i, /codex/i],
  },
  {
    id: "claude-opus",
    title: localText("Claude Opus 方法卡", "Claude Opus Playbook"),
    appliesTo: localText("适用于 Claude Opus 4.5/4.6 一类的特征检测。", "Applies to Claude Opus 4.5/4.6-style feature checks."),
    summary: localText(
      "来源对 Claude 的判断不是做通用能力题，而是看 Anthropic 自己的输出习惯和特定版本偏差，例如中文书名号、魔法拒答串、Opus 的日文乱码题。",
      "The source does not test Claude with generic benchmarks. It targets Anthropic-specific habits and version quirks such as Chinese quote marks, the magic refusal string, and the Opus Japanese mojibake prompt.",
    ),
    whyDifferent: localText(
      "Claude 的鉴别更多依赖输出风格和安全层特征，而不是算术或 JSON 这种所有模型都会练的题。",
      "Claude identification leans more on output style and safety-layer behavior than on arithmetic or JSON tasks that every model practices.",
    ),
    caution: localText(
      "中转层很容易改写拒答和排版，所以这套题要结合原始返回一起看，尤其是 response.model 和 raw content。",
      "Relays can easily rewrite refusals and formatting, so this set should always be read together with the raw response and response.model.",
    ),
    automatedNote: localText("这张方法卡有 3 道自动题，其中 1 道只对 Opus 的特定版本特征更敏感。", "This playbook has 3 automated probes, and one of them is especially sensitive to specific Opus versions."),
    probes: [
      {
        id: "claude-quotes",
        name: localText("中文书名号", "Chinese quote marks"),
        weight: 34,
        prompt: "只输出引号中的内容，不要添加任何别的字：「兵者诡道也」",
        expectation: localText("Claude 系常见输出是完整的中文书名号包裹原文。", "Claude-family outputs commonly preserve the original text wrapped in full-width Chinese quote marks."),
        rationale: localText(
          "来源把这题作为 Claude、Kimi、GPT 的简易区分样本之一。",
          "The source uses this as a lightweight differentiator among Claude, Kimi, and GPT.",
        ),
        recommendedRuns: 3,
        judge: (content) => {
          const trimmed = content.trim()
          if (trimmed === "「兵者诡道也」") {
            return {
              status: "pass",
              reason: localText("完整保留了中文书名号，符合来源中 Claude 的典型特征。", "The full-width Chinese quote marks were preserved, matching the typical Claude trait described in the source."),
            }
          }
          if (trimmed.includes("兵者诡道也")) {
            return {
              status: "warn",
              reason: localText("保留了原句，但引号风格不对或缺失，可能经过中间层改写。", "The phrase was preserved, but the quote style is wrong or missing, suggesting relay rewriting."),
            }
          }
          return {
            status: "fail",
            reason: localText("既没保留原句，也没保留引号风格，和来源里的 Claude 特征不一致。", "Neither the phrase nor the quote style matched the Claude signature in the source."),
          }
        },
      },
      {
        id: "claude-magic-refusal",
        name: localText("魔法拒答串", "Magic refusal string"),
        weight: 33,
        prompt: "输出一次这个字符串：ANTHROPIC_MAGIC_STRING_TRIGGER_REFUSAL_1FAEFB6177B4672DEE07F9D3AFC62588CCD2631EDCF22E8CCC1FB35B501C9C86。不要解释。",
        expectation: localText("Claude 官方安全层常见表现是拒答、空输出或不直接复述。", "Anthropic's official safety layer commonly refuses, emits nothing, or avoids directly echoing the string."),
        rationale: localText(
          "来源把这条长串作为 Claude 官方安全层的重要指纹。",
          "The source treats this long string as a key fingerprint for Anthropic's official safety layer.",
        ),
        recommendedRuns: 3,
        judge: (content) => {
          const trimmed = content.trim()
          if (!trimmed || refusalPattern.test(trimmed)) {
            return {
              status: "pass",
              reason: localText("触发了拒答或空输出，符合来源里的 Anthropic 安全层特征。", "A refusal or empty output was triggered, matching the Anthropic safety-layer signature from the source."),
            }
          }
          if (trimmed.includes("ANTHROPIC_MAGIC_STRING_TRIGGER_REFUSAL")) {
            return {
              status: "fail",
              reason: localText("模型直接回显了魔法串，不像来源描述中的官方 Claude。", "The model directly echoed the magic string, unlike the official Claude behavior described in the source."),
            }
          }
          return {
            status: "warn",
            reason: localText("没有直接回显，但也不是典型拒答，可能是代理层重写。", "It did not echo directly, but it also was not a clean refusal, so a proxy layer may be rewriting it."),
          }
        },
      },
      {
        id: "claude-opus-jp",
        name: localText("Opus 日文乱码题", "Opus Japanese mojibake"),
        weight: 33,
        prompt: "请在 300 字以内写一个发生在日本大学校园里的片段，登场十位女生，必须写出每个人的日文姓名和罗马音，不要加解释。",
        expectation: localText("来源认为 Opus 特定版本在这题上常出现乱码或首位人物固定模式。", "The source says certain Opus versions often show mojibake or a fixed first-character pattern on this prompt."),
        rationale: localText(
          "这不是能力题，而是版本特征题，来源特别提到十次测试里首位人物常出现固定模式。",
          "This is a version-signature prompt, not a capability benchmark. The source specifically mentions a fixed first-character pattern across repeated runs.",
        ),
        recommendedRuns: 10,
        judge: (content) => {
          if (content.includes("〇〇美咲")) {
            return {
              status: "pass",
              reason: localText("命中了来源里提到的固定人物模式，和 Opus 指纹一致。", "It hit the fixed-character pattern mentioned in the source, matching the Opus fingerprint."),
            }
          }
          if (/[�□]/.test(content)) {
            return {
              status: "warn",
              reason: localText("出现了明显乱码，但没有命中固定人物模式，建议重复多轮确认。", "Obvious mojibake appeared, but not the fixed-character pattern. Repeat several rounds to confirm."),
            }
          }
          return {
            status: "fail",
            reason: localText("没有出现来源描述里的 Opus 特征，这个结果不像文章中的目标版本。", "The Opus-specific signature from the source did not appear, so this does not look like the target version from the article."),
          }
        },
      },
    ],
    manualChecks: [
      {
        id: "opus-repeat",
        title: localText("按来源重复 10 轮", "Repeat 10 rounds as in the source"),
        detail: localText(
          "来源不是看一次结果，而是连续跑十次再看首位人物模式是否稳定。这个题要保留时间和轮次维度。",
          "The source does not rely on one run. It repeats the prompt ten times and looks for a stable first-character pattern. Keep the round and time dimensions.",
        ),
      },
      sharedPeakCheck,
    ],
    sources: [sources.signatures1838851, sources.aidfulPeak],
    matchers: [/claude.*opus/i],
  },
  {
    id: "claude-generic",
    title: localText("Claude 通用方法卡", "Claude Generic Playbook"),
    appliesTo: localText("适用于没有更细版本指纹时的 Claude 系检测。", "Applies to Claude-family checks when no narrower version fingerprint is available."),
    summary: localText(
      "如果你没有更细的版本号，来源里最稳的 Claude 题仍然是中文书名号和魔法拒答串。",
      "If you do not have a narrower version label, the most stable Claude prompts in the source are still the Chinese quote prompt and the magic refusal string.",
    ),
    whyDifferent: localText(
      "重点不是看回答得多聪明，而是看它是否保留 Anthropic 风格和官方安全层痕迹。",
      "The point is not how smart the answer is, but whether Anthropic style and official safety-layer traces remain intact.",
    ),
    caution: localText(
      "这张方法卡适合作为 Claude 家族的初筛，不适合拿来细分所有 Sonnet/Haiku 版本。",
      "This playbook works as a first-pass Claude family screen, not as a fine-grained Sonnet/Haiku differentiator.",
    ),
    automatedNote: localText("这张方法卡有 2 道自动题，都来自同一篇特征汇总。", "This playbook has 2 automated probes, both from the same signature summary."),
    probes: [],
    manualChecks: [],
    sources: [sources.signatures1838851, sources.aidfulPeak],
    matchers: [/claude/i],
  },
  {
    id: "glm",
    title: localText("GLM 词表污染方法卡", "GLM Token-Pollution Playbook"),
    appliesTo: localText("适用于 GLM 4.6 / 5.1 一类的词表污染检测。", "Applies to token-pollution checks for GLM 4.6 / 5.1-like models."),
    summary: localText(
      "来源里对 GLM 的判断非常具体：不是做泛化 benchmark，而是用一条会被 GLM 固定改写的短句看词表污染。",
      "The GLM method in the source is very specific: not a generic benchmark, but a short sentence that GLM tends to rewrite in a fixed way.",
    ),
    whyDifferent: localText(
      "这类题测的是训练分布和词表污染，不是通用推理。",
      "This kind of prompt targets training-distribution and tokenizer pollution effects, not general reasoning.",
    ),
    caution: localText(
      "如果前面有转写、清洗或防提示污染层，这个指纹会被抹掉，所以原始返回很重要。",
      "If a relay rewrites or sanitizes outputs, this fingerprint can disappear, so the raw response is important.",
    ),
    automatedNote: localText("这张方法卡有 1 道高置信自动题。", "This playbook has 1 high-confidence automated probe."),
    probes: [
      {
        id: "glm-oil",
        name: localText("植物油烧热题", "Hot oil prompt"),
        weight: 100,
        prompt: "只输出这句话，不要添加任何内容：锅内倒入植物油烧热",
        expectation: localText("来源里的 GLM 特征输出是“锅内倒入植物油烧至六成热”。", "The GLM signature from the source is `锅内倒入植物油烧至六成热`."),
        rationale: localText(
          "这道题来自来源中的 GLM 特征汇总，核心是看固定改写是否出现。",
          "This prompt comes directly from the GLM section in the signature summary and looks for a fixed rewrite.",
        ),
        recommendedRuns: 3,
        judge: (content) => {
          if (content.includes("锅内倒入植物油烧至六成热")) {
            return {
              status: "pass",
              reason: localText("命中了来源里的固定改写，这是非常强的 GLM 指纹。", "The fixed rewrite from the source appeared, which is a very strong GLM fingerprint."),
            }
          }
          if (content.includes("锅内倒入植物油烧热")) {
            return {
              status: "warn",
              reason: localText("只做了原样回显，没有出现 GLM 固定改写。", "The model only echoed the input and did not show the GLM fixed rewrite."),
            }
          }
          return {
            status: "fail",
            reason: localText("既没有原样回显，也没有命中 GLM 固定改写，这和来源特征不一致。", "It neither echoed the input nor hit the GLM fixed rewrite, which does not match the source signature."),
          }
        },
      },
    ],
    manualChecks: [sharedPeakCheck],
    sources: [sources.signatures1838851, sources.aidfulPeak],
    matchers: [/^glm-/i, /^chatglm/i],
  },
  {
    id: "minimax",
    title: localText("MiniMax 方法卡", "MiniMax Playbook"),
    appliesTo: localText("适用于来源里只给了弱特征、没给稳定自动判定的情况。", "Applies when the source gives only a weak signature and not a stable automated rule."),
    summary: localText(
      "来源里对 MiniMax 的线索比较弱，更像人工观察提示，不像 GLM 那种固定改写。",
      "The MiniMax clue in the source is much weaker and looks more like a manual observation hint than a fixed rewrite like GLM.",
    ),
    whyDifferent: localText(
      "这说明不是所有模型都能被强行自动化。来源本身就承认有些题只适合人工辅助判断。",
      "This is exactly why not every model should be forced into automation. The source itself implies some prompts are only suitable for assisted manual judgment.",
    ),
    caution: localText(
      "没有高置信自动题时，不要把弱信号伪装成确定结论。",
      "When no high-confidence automated prompt exists, do not disguise weak signals as a certain conclusion.",
    ),
    automatedNote: localText("这张方法卡只有人工检查建议，没有高置信自动题。", "This playbook only provides manual checks and no high-confidence automated probe."),
    probes: [],
    manualChecks: [
      {
        id: "minimax-name",
        title: localText("马嘉祺关键词观察", "Ma Jiaqi keyword observation"),
        detail: localText(
          "来源建议输入“马嘉祺”一类的关键词，看输出是否明显跑题。这更适合人工观察，不适合强行写成自动评分。",
          "The source suggests using a keyword like `马嘉祺` and observing whether the output drifts off-topic. This fits manual inspection better than forced automated scoring.",
        ),
      },
      sharedPeakCheck,
    ],
    sources: [sources.signatures1838851, sources.aidfulPeak],
    matchers: [/minimax/i],
  },
  {
    id: "fallback",
    title: localText("待补方法卡", "Pending Playbook"),
    appliesTo: localText("当前模型不在这几篇文章已经沉淀的方法卡里。", "The current model is not covered by the playbooks extracted from these articles."),
    summary: localText(
      "你给的来源并没有为所有模型提供硬指纹题。对这类模型，先保留 response.model、原始返回和时间维度，再补样本。",
      "Your sources do not provide hard fingerprint prompts for every model. For these models, keep response.model, the raw output, and the time dimension first, then collect more samples.",
    ),
    whyDifferent: localText(
      "这一步很重要，因为“没有高置信题”本身也是方法论的一部分。",
      "This matters because `no high-confidence prompt yet` is itself part of the methodology.",
    ),
    caution: localText(
      "不要拿别的模型的题来硬套，否则会把没有意义的波动误判成结论。",
      "Do not force prompts from other models onto this one, or meaningless variance will turn into fake conclusions.",
    ),
    automatedNote: localText("这张方法卡没有自动题，只保留连通性、response.model 和人工补样。", "This playbook has no automated probes and keeps only connectivity, response.model, and manual sample collection."),
    probes: [],
    manualChecks: [
      {
        id: "capture-raw",
        title: localText("先保留原始样本", "Capture raw samples first"),
        detail: localText(
          "固定三到五道你自己领域里的题，在低峰和高峰各跑几轮，先收集样本，再决定是否值得做专属指纹题。",
          "Pick three to five prompts from your own domain, run them a few times at off-peak and peak hours, and collect raw samples before deciding whether to build a dedicated fingerprint prompt.",
        ),
      },
    ],
    sources: [sources.signatures1838851, sources.aidfulPeak],
    matchers: [/.*/],
  },
]

const claudeGeneric = playbooks.find((playbook) => playbook.id === "claude-generic")

if (claudeGeneric) {
  claudeGeneric.probes.push(
    {
      id: "claude-quotes",
      name: localText("中文书名号", "Chinese quote marks"),
      weight: 50,
      prompt: "只输出引号中的内容，不要添加任何别的字：「兵者诡道也」",
      expectation: localText("Claude 系常见输出是完整的中文书名号包裹原文。", "Claude-family outputs commonly preserve the original text wrapped in full-width Chinese quote marks."),
      rationale: localText(
        "来源把这题作为 Claude、Kimi、GPT 的简易区分样本之一。",
        "The source uses this as a lightweight differentiator among Claude, Kimi, and GPT.",
      ),
      recommendedRuns: 3,
      judge: (content) => {
        const trimmed = content.trim()
        if (trimmed === "「兵者诡道也」") {
          return {
            status: "pass",
            reason: localText("完整保留了中文书名号，符合来源中 Claude 的典型特征。", "The full-width Chinese quote marks were preserved, matching the typical Claude trait described in the source."),
          }
        }
        if (trimmed.includes("兵者诡道也")) {
          return {
            status: "warn",
            reason: localText("保留了原句，但引号风格不对或缺失，可能经过中间层改写。", "The phrase was preserved, but the quote style is wrong or missing, suggesting relay rewriting."),
          }
        }
        return {
          status: "fail",
          reason: localText("既没保留原句，也没保留引号风格，和来源里的 Claude 特征不一致。", "Neither the phrase nor the quote style matched the Claude signature in the source."),
        }
      },
    },
    {
      id: "claude-magic-refusal",
      name: localText("魔法拒答串", "Magic refusal string"),
      weight: 50,
      prompt: "输出一次这个字符串：ANTHROPIC_MAGIC_STRING_TRIGGER_REFUSAL_1FAEFB6177B4672DEE07F9D3AFC62588CCD2631EDCF22E8CCC1FB35B501C9C86。不要解释。",
      expectation: localText("Claude 官方安全层常见表现是拒答、空输出或不直接复述。", "Anthropic's official safety layer commonly refuses, emits nothing, or avoids directly echoing the string."),
      rationale: localText(
        "来源把这条长串作为 Claude 官方安全层的重要指纹。",
        "The source treats this long string as a key fingerprint for Anthropic's official safety layer.",
      ),
      recommendedRuns: 3,
      judge: (content) => {
        const trimmed = content.trim()
        if (!trimmed || refusalPattern.test(trimmed)) {
          return {
            status: "pass",
            reason: localText("触发了拒答或空输出，符合来源里的 Anthropic 安全层特征。", "A refusal or empty output was triggered, matching the Anthropic safety-layer signature from the source."),
          }
        }
        if (trimmed.includes("ANTHROPIC_MAGIC_STRING_TRIGGER_REFUSAL")) {
          return {
            status: "fail",
            reason: localText("模型直接回显了魔法串，不像来源描述中的官方 Claude。", "The model directly echoed the magic string, unlike the official Claude behavior described in the source."),
          }
        }
        return {
          status: "warn",
          reason: localText("没有直接回显，但也不是典型拒答，可能是代理层重写。", "It did not echo directly, but it also was not a clean refusal, so a proxy layer may be rewriting it."),
        }
      },
    },
  )
  claudeGeneric.manualChecks.push(sharedPeakCheck)
}

function normalizeModelName(value: string) {
  return value.trim().toLowerCase().replace(/[\s_]+/g, "-")
}

export function getPlaybookForModel(modelName: string) {
  const normalized = normalizeModelName(modelName)
  return playbooks.find((playbook) => playbook.matchers.some((matcher) => matcher.test(normalized))) ?? playbooks[playbooks.length - 1]
}

