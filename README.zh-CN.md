# TestConrad / Conrad

中文 | [English](./README.md)

大模型测试平台，用于配置中转接口、选择请求模型，并按固定流程检测模型连通性、模型归属、方法卡题库和最终评分。

## 项目定位

TestConrad 是一个面向大模型中转站和模型服务商的前端测试台。用户可以填写 `Base URL`、`API Key`、请求模型和对比模型，然后启动一次可视化检测流程，快速判断接口是否可用、返回模型是否匹配、以及模型行为是否符合对应方法卡。

## 核心功能

- 服务商模板：内置 OpenAI、Claude、Gemini、GLM、DeepSeek、Qwen、Kimi 等模型目录。
- 请求模型选择：支持本地模型列表搜索，选择请求模型后自动填充对比模型。
- 接口路径适配：支持 OpenAI、Anthropic、Gemini、完整地址和自定义路径模式。
- 本地代理：通过 Vite 中间件转发请求，降低浏览器 CORS 对调试的影响。
- 字段校验：缺少 `Base URL`、`API Key`、请求模型或对比模型时会阻止测试并提示用户。
- 串行动画：运行后按 `01 配置校验 -> 02 连通性 -> 03 模型核对 -> 04 方法卡题库` 顺序展示。
- 结果面板：展示当前测试模型、最终检测分数、实时日志、测试概览、Token 消耗和执行总时间。
- 分享结果：支持生成结果图，便于保存或传播测试结果。
- 全局背景：使用 `public/global-background.mp4` 作为页面视频背景。

## 技术栈

- React
- TypeScript
- Vite
- Tailwind CSS v4
- Lucide React
- Three.js / React Three Fiber

## 本地运行

```bash
npm install
npm run dev
```

默认开发地址通常是：

```text
http://localhost:5173/
```

如果端口被占用，Vite 会自动切换到下一个可用端口。

## 构建与预览

```bash
npm run build
npm run preview
```

## 使用流程

1. 选择服务商和模型模板。
2. 填写 `Base URL`。
3. 填写 `API Key`。
4. 选择请求模型。
5. 检查或调整自动填充的对比模型。
6. 点击“运行检测”。
7. 在右侧结果面板查看检测流程、日志、概览和最终分数。

## 目录结构

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

## 注意事项

- 页面不会内置真实 API Key，所有密钥都由用户在浏览器界面中输入。
- 模型检测结果依赖上游接口返回内容，不应把单次测试结果视为绝对结论。
- 方法卡题库用于辅助判断模型行为，建议结合多轮重复测试和人工复核使用。
